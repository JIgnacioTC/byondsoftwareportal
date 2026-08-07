import { Router } from 'express';
import Stripe from 'stripe';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireRole('admin'));

// GET /api/admin/plans
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
});

// GET /api/admin/plans/:id
router.get('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('plans')
      .select('*')
      .eq('id', req.params.id)
      .limit(1)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Plan no encontrado' });
    res.json(data);
  } catch (err) {
    console.error('Error fetching plan:', err);
    res.status(500).json({ error: 'Error al obtener plan' });
  }
});

// POST /api/admin/plans
router.post('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { name, slug, priceMonthly, devHoursMonthly, features, active, sortOrder } = req.body;

    if (!name || !slug || !priceMonthly || !devHoursMonthly) {
      return res.status(400).json({ error: 'Nombre, slug, precio y horas son requeridos' });
    }

    const { data, error } = await db
      .from('plans')
      .insert({
        name,
        slug,
        price_monthly: priceMonthly,
        dev_hours_monthly: devHoursMonthly,
        features: JSON.stringify(features || []),
        active: active !== undefined ? active : true,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating plan:', err);
    res.status(500).json({ error: 'Error al crear plan' });
  }
});

// PUT /api/admin/plans/:id
router.put('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { name, slug, priceMonthly, devHoursMonthly, features, active, sortOrder, stripePriceId } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    if (priceMonthly) updates.price_monthly = priceMonthly;
    if (devHoursMonthly) updates.dev_hours_monthly = devHoursMonthly;
    if (features) updates.features = JSON.stringify(features);
    if (active !== undefined) updates.active = active;
    if (sortOrder !== undefined) updates.sort_order = sortOrder;
    if (stripePriceId !== undefined) updates.stripe_price_id = stripePriceId || null;

    const { data, error } = await db
      .from('plans')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Plan no encontrado' });
    res.json(data);
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
});

// POST /api/admin/plans/:id/sync-stripe
router.post('/:id/sync-stripe', async (req, res) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY no configurada' });
    }
    const stripe = new Stripe(stripeKey);
    const db = createAdminClient();

    const { data: plan, error: planError } = await db
      .from('plans')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    let priceId = plan.stripe_price_id;

    // Archive old price if exists (Stripe prices are immutable)
    if (priceId) {
      try {
        await stripe.prices.update(priceId, { active: false });
      } catch (e) {
        // Price may already be inactive or not found
      }
    }

    // Find existing product by metadata or create new one
    let productId = null;
    const existingProducts = await stripe.products.search({
      query: `metadata["planId"]:"${plan.id}"`,
    });

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
      // Update existing product
      await stripe.products.update(productId, {
        name: `TORREN - ${plan.name}`,
        description: `Plan ${plan.name}: ${plan.dev_hours_monthly} horas de desarrollo al mes`,
        active: plan.active,
        metadata: { planSlug: plan.slug, planId: String(plan.id) },
      });
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: `TORREN - ${plan.name}`,
        description: `Plan ${plan.name}: ${plan.dev_hours_monthly} horas de desarrollo al mes`,
        active: plan.active,
        metadata: { planSlug: plan.slug, planId: String(plan.id) },
      });
      productId = product.id;
    }

    // Create new Stripe Price
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(parseFloat(plan.price_monthly) * 100),
      currency: 'mxn',
      recurring: { interval: 'month' },
      metadata: { planSlug: plan.slug, planId: String(plan.id) },
    });
    priceId = price.id;

    // Save Stripe price ID back to DB
    const { data: updated, error: updateError } = await db
      .from('plans')
      .update({ stripe_price_id: priceId })
      .eq('id', plan.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      plan: updated,
      stripe: {
        productId,
        priceId,
        priceAmount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
      },
    });
  } catch (err) {
    console.error('Error syncing plan to Stripe:', err);
    res.status(500).json({ error: 'Error al sincronizar con Stripe: ' + err.message });
  }
});

export default router;
