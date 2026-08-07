import { Router } from 'express';
import Stripe from 'stripe';
import { createAdminClient } from '../config/supabase.js';

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planSlug, email, companyName, contactName } = req.body;

    if (!planSlug || !email) {
      return res.status(400).json({ error: 'planSlug y email son requeridos' });
    }

    const stripe = getStripe();
    const db = createAdminClient();

    // Get plan from DB
    const { data: plan, error: planError } = await db
      .from('plans')
      .select('*')
      .eq('slug', planSlug)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Get or create Stripe customer
    let customerId = null;

    // Check if customer exists by email
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        name: companyName || contactName || email,
        metadata: {
          planSlug,
          companyName: companyName || '',
          contactName: contactName || '',
        },
      });
      customerId = customer.id;
    }

    // Create or get Stripe price for this plan
    let priceId = plan.stripe_price_id;

    if (!priceId) {
      // Create product and price in Stripe
      const product = await stripe.products.create({
        name: `TORREN - ${plan.name}`,
        description: `Plan ${plan.name}: ${plan.dev_hours_monthly} horas de desarrollo al mes`,
        metadata: { planSlug: plan.slug },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(parseFloat(plan.price_monthly) * 100),
        currency: 'mxn',
        recurring: { interval: 'month' },
        metadata: { planSlug: plan.slug },
      });

      priceId = price.id;

      // Save stripe_price_id to plan
      await db
        .from('plans')
        .update({ stripe_price_id: priceId })
        .eq('id', plan.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/stripe/cancel`,
      metadata: {
        planSlug: plan.slug,
        planId: String(plan.id),
        email,
        companyName: companyName || '',
        contactName: contactName || '',
      },
      subscription_data: {
        metadata: {
          planSlug: plan.slug,
          planId: String(plan.id),
          email,
        },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Error al crear sesion de pago' });
  }
});

// POST /api/stripe/webhook
router.post('/webhook', async (req, res) => {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    if (webhookSecret) {
      const sig = req.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      event = req.body;
    }

    const db = createAdminClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { planId, planSlug, email, companyName, contactName } = session.metadata;

        // Create or find client
        let clientId;

        // Check if client exists by email in users
        const { data: existingUser } = await db
          .from('users')
          .select('client_id, clients(*)')
          .eq('email', email)
          .limit(1)
          .single();

        if (existingUser?.client_id) {
          clientId = existingUser.client_id;

          // Save stripe_customer_id to client
          await db
            .from('clients')
            .update({ stripe_customer_id: session.customer })
            .eq('id', clientId);
        } else {
          // Create new prospect client
          const { data: lastClients } = await db
            .from('clients')
            .select('id')
            .order('id', { ascending: false })
            .limit(1);

          const nextNum = lastClients?.length > 0 ? lastClients[0].id + 1 : 1;
          const clientNumber = `TRN-${String(nextNum).padStart(4, '0')}`;

          const { data: newClient, error: clientError } = await db
            .from('clients')
            .insert({
              client_number: clientNumber,
              company_name: companyName || email,
              contact_name: contactName || email,
              status: 'prospecto',
              stripe_customer_id: session.customer,
            })
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }

        // Get subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        // Create or update subscription in DB
        const { data: existingSub } = await db
          .from('subscriptions')
          .select('id')
          .eq('client_id', clientId)
          .limit(1)
          .single();

        if (existingSub) {
          await db
            .from('subscriptions')
            .update({
              plan_id: parseInt(planId),
              status: 'activa',
              stripe_subscription_id: subscription.id,
              start_date: new Date().toISOString(),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', existingSub.id);
        } else {
          await db
            .from('subscriptions')
            .insert({
              client_id: clientId,
              plan_id: parseInt(planId),
              status: 'activa',
              stripe_subscription_id: subscription.id,
              start_date: new Date().toISOString(),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });
        }

        // Activate client if prospecto
        await db
          .from('clients')
          .update({ status: 'activo' })
          .eq('id', clientId)
          .eq('status', 'prospecto');

        // Create hour allocation for current period
        const plan = await db
          .from('plans')
          .select('dev_hours_monthly')
          .eq('id', parseInt(planId))
          .single();

        if (plan.data) {
          const now = new Date();
          const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

          // Check if allocation already exists
          const { data: existingAllocation } = await db
            .from('hour_ledger')
            .select('id')
            .eq('client_id', clientId)
            .eq('type', 'allocation')
            .eq('period', currentPeriod)
            .limit(1);

          if (!existingAllocation?.length) {
            await db
              .from('hour_ledger')
              .insert({
                client_id: clientId,
                type: 'allocation',
                hours: plan.data.dev_hours_monthly,
                description: `Asignacion mensual plan ${planSlug} - ${currentPeriod}`,
                period: currentPeriod,
              });
          }
        }

        console.log(`Checkout completed for ${email}, plan: ${planSlug}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const statusMap = {
          active: 'activa',
          past_due: 'pausada',
          canceled: 'cancelada',
          unpaid: 'pausada',
          trialing: 'activa',
        };

        const dbStatus = statusMap[subscription.status] || 'activa';

        await db
          .from('subscriptions')
          .update({
            status: dbStatus,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription ${subscription.id} updated to ${dbStatus}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await db
          .from('subscriptions')
          .update({ status: 'cancelada' })
          .eq('stripe_subscription_id', subscription.id);

        console.log(`Subscription ${subscription.id} canceled`);
        break;
      }

      case 'invoice.paid': {
        console.log(`Invoice ${event.data.object.id} paid`);
        break;
      }

      case 'invoice.payment_failed': {
        console.log(`Invoice ${event.data.object.id} payment failed`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// POST /api/stripe/portal-session - Create Stripe Customer Portal session
router.post('/portal-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const db = createAdminClient();
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId requerido' });
    }

    const { data: client } = await db
      .from('clients')
      .select('stripe_customer_id')
      .eq('id', clientId)
      .single();

    if (!client?.stripe_customer_id) {
      return res.status(404).json({ error: 'Cliente sin ID de Stripe' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/plan`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating portal session:', err);
    res.status(500).json({ error: 'Error al crear sesion de portal' });
  }
});

// GET /api/stripe/verify-session/:sessionId - Verify a checkout session
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

    res.json({
      status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
      metadata: session.metadata,
    });
  } catch (err) {
    console.error('Error verifying session:', err);
    res.status(500).json({ error: 'Error al verificar sesion' });
  }
});

export default router;
