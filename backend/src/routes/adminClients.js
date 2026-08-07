import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireRole('admin'));

// GET /api/admin/clients
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('clients')
      .select('*, subscriptions(*, plans(*))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// GET /api/admin/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('clients')
      .select('*, subscriptions(*, plans(*))')
      .eq('id', req.params.id)
      .limit(1)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Get hour balance
    const { data: ledger } = await db
      .from('hour_ledger')
      .select('hours')
      .eq('client_id', req.params.id);

    const balance = ledger?.reduce((sum, row) => sum + parseFloat(row.hours), 0) || 0;

    res.json({ ...data, hourBalance: balance });
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// POST /api/admin/clients
router.post('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { companyName, contactName, status } = req.body;

    if (!companyName || !contactName) {
      return res.status(400).json({ error: 'Nombre de empresa y contacto son requeridos' });
    }

    // Generate client number
    const { data: lastClients } = await db
      .from('clients')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    const nextNum = lastClients && lastClients.length > 0 ? lastClients[0].id + 1 : 1;
    const clientNumber = `TRN-${String(nextNum).padStart(4, '0')}`;

    const { data, error } = await db
      .from('clients')
      .insert({
        client_number: clientNumber,
        company_name: companyName,
        contact_name: contactName,
        status: status || 'prospecto',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// PUT /api/admin/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { companyName, contactName, status } = req.body;

    const updates = {};
    if (companyName) updates.company_name = companyName;
    if (contactName) updates.contact_name = contactName;
    if (status) updates.status = status;

    const { data, error } = await db
      .from('clients')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(data);
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// POST /api/admin/clients/:id/activate-subscription
router.post('/:id/activate-subscription', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = req.params.id;

    // Find pending subscription
    const { data: subs } = await db
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('client_id', clientId)
      .eq('status', 'solicitada')
      .limit(1);

    if (!subs || subs.length === 0) {
      return res.status(404).json({ error: 'No se encontró suscripción pendiente' });
    }

    const sub = subs[0];
    const plan = sub.plans;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Activate subscription
    await db
      .from('subscriptions')
      .update({
        status: 'activa',
        start_date: now.toISOString(),
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .eq('id', sub.id);

    // Activate client
    await db
      .from('clients')
      .update({ status: 'activo' })
      .eq('id', clientId);

    // Insert allocation in ledger
    await db
      .from('hour_ledger')
      .insert({
        client_id: clientId,
        type: 'allocation',
        hours: plan.dev_hours_monthly,
        description: `Asignación mensual plan ${plan.name} - ${currentPeriod}`,
        period: currentPeriod,
        created_by: req.user.id,
      });

    res.json({ message: 'Suscripción activada exitosamente' });
  } catch (err) {
    console.error('Error activating subscription:', err);
    res.status(500).json({ error: 'Error al activar suscripción' });
  }
});

// GET /api/admin/clients/:id/ledger
router.get('/:id/ledger', async (req, res) => {
  try {
    const db = createAdminClient();
    const { period } = req.query;
    let query = db
      .from('hour_ledger')
      .select('*, tickets(folio), users(full_name)')
      .eq('client_id', req.params.id);

    if (period) {
      query = query.eq('period', period);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching ledger:', err);
    res.status(500).json({ error: 'Error al obtener libro de horas' });
  }
});

// POST /api/admin/clients/:id/adjustment
router.post('/:id/adjustment', async (req, res) => {
  try {
    const db = createAdminClient();
    const { hours, description, period } = req.body;

    if (!hours || !description) {
      return res.status(400).json({ error: 'Horas y descripción son requeridos' });
    }

    const now = new Date();
    const currentPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await db
      .from('hour_ledger')
      .insert({
        client_id: req.params.id,
        type: 'adjustment',
        hours: hours,
        description,
        period: currentPeriod,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating adjustment:', err);
    res.status(500).json({ error: 'Error al crear ajuste' });
  }
});

export default router;
