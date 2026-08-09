import Stripe from 'stripe';
import crypto from 'crypto';
import { createAdminClient } from '../config/supabase.js';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY no configurado');
  return new Stripe(key);
}

/**
 * Inserts a monthly hour allocation for a client/period if one doesn't already exist.
 * Idempotent by (client_id, type='allocation', period) so it's safe to call on retries
 * or on both checkout.session.completed and invoice.paid for the same billing period.
 */
async function allocateHoursForPeriod(db, { clientId, planName, hours, period }) {
  const { data: existingAllocations } = await db
    .from('hour_ledger')
    .select('id, hours')
    .eq('client_id', clientId)
    .eq('type', 'allocation')
    .eq('period', period)
    .limit(1);

  if (existingAllocations && existingAllocations.length > 0) {
    return { allocated: false, hours: existingAllocations[0].hours, period };
  }

  const { error: ledgerError } = await db
    .from('hour_ledger')
    .insert({
      client_id: clientId,
      type: 'allocation',
      hours,
      description: `Asignación mensual plan ${planName} - ${period}`,
      period,
    });

  if (ledgerError) {
    console.error('Error inserting hour allocation:', ledgerError);
    throw ledgerError;
  }

  console.log(`Allocated ${hours}h for client ${clientId} (${planName}) in period ${period}`);
  return { allocated: true, hours, period };
}

/**
 * Handles Stripe's `invoice.paid` event for subscription renewals.
 * checkout.session.completed already allocates hours for the plan's first billing
 * period, so this only needs to act on renewal invoices (billing_reason
 * 'subscription_cycle') — new hours for the month the client just paid for.
 */
export async function allocateRenewalHours(invoice) {
  const db = createAdminClient();

  if (invoice.billing_reason !== 'subscription_cycle') {
    console.log(`Invoice ${invoice.id} billing_reason is '${invoice.billing_reason}', not a renewal cycle; skipping hour allocation`);
    return null;
  }

  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) {
    console.warn(`Invoice ${invoice.id} has no subscription; skipping hour allocation`);
    return null;
  }

  const { data: subRecord, error: subFetchErr } = await db
    .from('subscriptions')
    .select('*, clients(*), plans(*)')
    .eq('stripe_subscription_id', subscriptionId)
    .limit(1)
    .single();

  if (subFetchErr || !subRecord) {
    console.warn(`No local subscription found for Stripe subscription ${subscriptionId}; cannot allocate renewal hours`);
    return null;
  }

  const plan = subRecord.plans;
  const client = subRecord.clients;
  if (!plan || !client) {
    console.warn(`Subscription ${subscriptionId} is missing linked plan/client; cannot allocate renewal hours`);
    return null;
  }

  // Prefer the billing period reported by the invoice line item over "now",
  // so the allocation is labeled with the period the client actually paid for.
  const line = invoice.lines?.data?.[0];
  const periodStartSec = line?.period?.start || invoice.period_start;
  const periodEndSec = line?.period?.end || invoice.period_end;
  const periodDate = periodStartSec ? new Date(periodStartSec * 1000) : new Date();
  const period = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;

  const result = await allocateHoursForPeriod(db, {
    clientId: client.id,
    planName: plan.name,
    hours: plan.dev_hours_monthly || 0,
    period,
  });

  // Keep the subscription's billing period window in sync with Stripe.
  await db
    .from('subscriptions')
    .update({
      status: 'activa',
      current_period_start: periodStartSec ? new Date(periodStartSec * 1000).toISOString() : subRecord.current_period_start,
      current_period_end: periodEndSec ? new Date(periodEndSec * 1000).toISOString() : subRecord.current_period_end,
    })
    .eq('id', subRecord.id);

  return { ...result, clientId: client.id, planName: plan.name };
}

/**
 * Fulfill checkout session idempotently:
 * 1. Resolves customer, plan and subscription details.
 * 2. Creates or activates Client in DB.
 * 3. Creates or links User in Supabase Auth & Users table.
 * 4. Creates or updates Subscription in DB.
 * 5. Allocates Plan Development Hours in hour_ledger for current billing period.
 */
export async function fulfillCheckoutSession(sessionIdOrSession) {
  const stripe = getStripe();
  const db = createAdminClient();

  let session;
  if (typeof sessionIdOrSession === 'string') {
    session = await stripe.checkout.sessions.retrieve(sessionIdOrSession, {
      expand: ['customer', 'subscription', 'line_items'],
    });
  } else {
    session = sessionIdOrSession;
    if (typeof session.customer === 'string' || typeof session.subscription === 'string') {
      session = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['customer', 'subscription', 'line_items'],
      });
    }
  }

  if (session.payment_status !== 'paid') {
    console.log(`Session ${session.id} payment_status is ${session.payment_status}, not paid yet.`);
    return {
      success: false,
      status: session.payment_status,
      message: 'El pago aún no ha sido completado',
    };
  }

  const metadata = session.metadata || {};
  const customerEmail = session.customer_details?.email || (typeof session.customer === 'object' ? session.customer?.email : null) || metadata.email;
  const companyName = metadata.companyName || session.customer_details?.name || (typeof session.customer === 'object' ? session.customer?.name : null) || 'Empresa';
  const contactName = metadata.contactName || session.customer_details?.name || companyName;
  const planSlug = metadata.planSlug || 'starter';
  const rawPlanId = metadata.planId;

  if (!customerEmail) {
    throw new Error('No se pudo identificar el correo del cliente en la sesión de Stripe');
  }

  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const stripeSubObject = typeof session.subscription === 'object' ? session.subscription : null;
  const stripeSubId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  // 1. Get Plan from DB
  let plan = null;
  if (rawPlanId) {
    const { data: p } = await db.from('plans').select('*').eq('id', parseInt(rawPlanId)).single();
    plan = p;
  }
  if (!plan && planSlug) {
    const { data: p } = await db.from('plans').select('*').eq('slug', planSlug).single();
    plan = p;
  }
  if (!plan) {
    const { data: p } = await db.from('plans').select('*').eq('active', true).order('id', { ascending: true }).limit(1).single();
    plan = p;
  }
  if (!plan) {
    throw new Error('No se encontró ningún plan activo en el sistema');
  }

  // 2. Identify or Create Client
  let client = null;

  // Try finding by stripe_customer_id
  if (stripeCustomerId) {
    const { data: existingClients } = await db
      .from('clients')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .limit(1);
    if (existingClients && existingClients.length > 0) {
      client = existingClients[0];
    }
  }

  // Try finding by user email
  if (!client) {
    const { data: existingUser } = await db
      .from('users')
      .select('client_id, clients(*)')
      .eq('email', customerEmail.toLowerCase().trim())
      .limit(1)
      .single();

    if (existingUser?.clients) {
      client = existingUser.clients;
    }
  }

  if (client) {
    // Update client to active and ensure stripe_customer_id is saved
    const { data: updatedClient, error: updateErr } = await db
      .from('clients')
      .update({
        status: 'activo',
        stripe_customer_id: stripeCustomerId || client.stripe_customer_id,
        company_name: client.company_name || companyName,
        contact_name: client.contact_name || contactName,
      })
      .eq('id', client.id)
      .select()
      .single();

    if (updateErr) console.error('Error updating client:', updateErr);
    client = updatedClient || client;
  } else {
    // Create new client
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
        company_name: companyName,
        contact_name: contactName,
        status: 'activo',
        stripe_customer_id: stripeCustomerId,
      })
      .select()
      .single();

    if (clientError) throw clientError;
    client = newClient;
  }

  // 3. Identify or Create User in Supabase Auth & Users table
  let userRecord = null;
  let isNewUser = false;
  let setupLink = null;
  const cleanEmail = customerEmail.toLowerCase().trim();

  const { data: existingAppUsers } = await db
    .from('users')
    .select('*')
    .eq('email', cleanEmail)
    .limit(1);

  if (existingAppUsers && existingAppUsers.length > 0) {
    userRecord = existingAppUsers[0];
    // Ensure client_id is linked and user is active
    const { data: updatedUser } = await db
      .from('users')
      .update({
        client_id: client.id,
        active: true,
        full_name: userRecord.full_name || contactName,
      })
      .eq('id', userRecord.id)
      .select()
      .single();

    userRecord = updatedUser || userRecord;
  } else {
    // Check if user exists in Supabase Auth
    let supabaseUid = null;

    // Check auth users list
    try {
      const { data: { users: authUsers } } = await db.auth.admin.listUsers();
      const matchedAuth = authUsers.find(u => u.email?.toLowerCase() === cleanEmail);
      if (matchedAuth) {
        supabaseUid = matchedAuth.id;
      }
    } catch (authListErr) {
      console.warn('Could not list auth users:', authListErr.message);
    }

    if (!supabaseUid) {
      // Create user in Supabase Auth with a secure random initial password
      const tempPassword = `Torren_${crypto.randomBytes(6).toString('hex')}!2026`;
      const { data: newAuthUser, error: authCreateErr } = await db.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: contactName,
          role: 'client_user',
          company_name: companyName,
        },
      });

      if (authCreateErr) {
        console.error('Error creating auth user:', authCreateErr);
        // If already exists error, fetch user
        const { data: { users: retryUsers } } = await db.auth.admin.listUsers();
        const retryAuth = retryUsers?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (retryAuth) {
          supabaseUid = retryAuth.id;
        } else {
          throw authCreateErr;
        }
      } else {
        supabaseUid = newAuthUser.user.id;
      }
    }

    // Insert into users table
    const { data: insertedUser, error: userInsertErr } = await db
      .from('users')
      .insert({
        supabase_uid: supabaseUid,
        email: cleanEmail,
        full_name: contactName,
        role: 'client_user',
        client_id: client.id,
        active: true,
      })
      .select()
      .single();

    if (userInsertErr) throw userInsertErr;
    userRecord = insertedUser;
    isNewUser = true;

    // Generate password recovery / setup link for direct login & password setup
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://www.torren.dev';
      const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
        options: {
          redirectTo: `${frontendUrl}/auth/reset-password`,
        },
      });
      if (!linkErr && linkData?.properties?.action_link) {
        setupLink = linkData.properties.action_link;
      }
    } catch (linkGenErr) {
      console.warn('Could not generate recovery link:', linkGenErr.message);
    }
  }

  // 4. Create or Update Subscription in DB
  let subRecord = null;
  let currentPeriodStart = new Date().toISOString();
  let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (stripeSubObject) {
    if (stripeSubObject.current_period_start) {
      currentPeriodStart = new Date(stripeSubObject.current_period_start * 1000).toISOString();
    }
    if (stripeSubObject.current_period_end) {
      currentPeriodEnd = new Date(stripeSubObject.current_period_end * 1000).toISOString();
    }
  } else if (stripeSubId) {
    try {
      const subObj = await stripe.subscriptions.retrieve(stripeSubId);
      currentPeriodStart = new Date(subObj.current_period_start * 1000).toISOString();
      currentPeriodEnd = new Date(subObj.current_period_end * 1000).toISOString();
    } catch (subFetchErr) {
      console.warn('Could not retrieve subscription details from stripe:', subFetchErr.message);
    }
  }

  const { data: existingSubs } = await db
    .from('subscriptions')
    .select('*')
    .eq('client_id', client.id)
    .limit(1);

  if (existingSubs && existingSubs.length > 0) {
    const { data: updatedSub, error: subUpdateErr } = await db
      .from('subscriptions')
      .update({
        plan_id: plan.id,
        status: 'activa',
        stripe_subscription_id: stripeSubId || existingSubs[0].stripe_subscription_id,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
      })
      .eq('id', existingSubs[0].id)
      .select()
      .single();

    if (subUpdateErr) console.error('Error updating subscription:', subUpdateErr);
    subRecord = updatedSub || existingSubs[0];
  } else {
    const { data: newSub, error: subInsertErr } = await db
      .from('subscriptions')
      .insert({
        client_id: client.id,
        plan_id: plan.id,
        status: 'activa',
        stripe_subscription_id: stripeSubId,
        start_date: new Date().toISOString(),
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
      })
      .select()
      .single();

    if (subInsertErr) throw subInsertErr;
    subRecord = newSub;
  }

  // 5. Allocate Monthly Development Hours in hour_ledger for the current period.
  // Renewal periods (month 2+) are allocated separately by allocateRenewalHours()
  // when Stripe fires `invoice.paid` for the subscription's billing cycle.
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { hours: hoursAllocated } = await allocateHoursForPeriod(db, {
    clientId: client.id,
    planName: plan.name,
    hours: plan.dev_hours_monthly || 0,
    period: currentPeriod,
  });

  return {
    success: true,
    status: session.payment_status,
    client: {
      id: client.id,
      clientNumber: client.client_number,
      companyName: client.company_name,
      contactName: client.contact_name,
      status: client.status,
    },
    user: {
      id: userRecord.id,
      email: userRecord.email,
      fullName: userRecord.full_name,
      role: userRecord.role,
      isNewUser,
    },
    plan: {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      monthlyHours: plan.dev_hours_monthly,
      priceMonthly: plan.price_monthly,
    },
    subscription: {
      id: subRecord.id,
      status: subRecord.status,
      currentPeriodStart,
      currentPeriodEnd,
    },
    hoursAllocated,
    setupLink,
  };
}
