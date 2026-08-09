import { Router } from 'express';
import Stripe from 'stripe';
import { createAdminClient } from '../config/supabase.js';
import { fulfillCheckoutSession } from '../services/subscriptionProvisioning.js';

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
        description: plan.dev_hours_monthly > 0 ? `Plan ${plan.name}: ${plan.dev_hours_monthly} horas al mes` : `Servicio ${plan.name}`,
        metadata: { planSlug: plan.slug },
      });

      const priceParams = {
        product: product.id,
        unit_amount: Math.round(parseFloat(plan.base_price) * 100),
        currency: 'mxn',
        metadata: { planSlug: plan.slug },
      };

      if (plan.billing_type === 'monthly') {
        priceParams.recurring = { interval: 'month' };
      }

      const price = await stripe.prices.create(priceParams);

      priceId = price.id;

      // Save stripe_price_id to plan
      await db
        .from('plans')
        .update({ stripe_price_id: priceId, stripe_product_id: product.id })
        .eq('id', plan.id);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: plan.billing_type === 'monthly' ? 'subscription' : 'payment',
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
    res.status(500).json({ error: err.message || 'Error al crear sesion de pago', details: err.stack });
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
        console.log(`Processing checkout.session.completed for session ${session.id}...`);
        const result = await fulfillCheckoutSession(session);
        console.log(`Checkout session ${session.id} fulfilled successfully:`, result);
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

// GET /api/stripe/verify-session/:sessionId - Verify and fulfill a checkout session
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const result = await fulfillCheckoutSession(req.params.sessionId);
    res.json(result);
  } catch (err) {
    console.error('Error verifying session:', err);
    res.status(500).json({ error: err.message || 'Error al verificar sesión' });
  }
});

export default router;
