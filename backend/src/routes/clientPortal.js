import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireRole('client_user'));

// A client_user with no linked client_id would otherwise crash every route
// below: Supabase/PostgREST rejects `.eq('client_id', null)` with a raw
// Postgres error ("invalid input syntax for type integer") instead of
// matching NULL, so every query here threw a 500. Fail with one clear,
// actionable message instead of letting each route hit that error differently.
router.use((req, res, next) => {
  if (!req.user.client_id) {
    return res.status(409).json({
      error: 'Tu cuenta todavía no está vinculada a una empresa. Contacta a soporte para completar tu alta.',
      code: 'NO_CLIENT_LINKED',
    });
  }
  next();
});

// Helper to get client ID from user
function getClientId(req) {
  return req.user.client_id;
}

// GET /api/client/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Current subscription
    const { data: subs } = await db
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('client_id', clientId)
      .limit(1);

    const subscription = subs?.[0] || null;

    // Hours summary
    const { data: ledger } = await db
      .from('hour_ledger')
      .select('type, hours')
      .eq('client_id', clientId)
      .eq('period', currentPeriod);

    let allocated = 0, consumed = 0, adjustments = 0;
    (ledger || []).forEach(row => {
      const hours = parseFloat(row.hours);
      if (row.type === 'allocation') allocated += hours;
      else if (row.type === 'consumption') consumed += Math.abs(hours);
      else if (row.type === 'adjustment') adjustments += hours;
    });

    // Open tickets
    const { data: openTickets } = await db
      .from('tickets')
      .select('id, folio, type, priority, status, title, created_at')
      .eq('client_id', clientId)
      .not('status', 'in', '("cerrado","resuelto")')
      .order('created_at', { ascending: false })
      .limit(10);

    // Recent movements
    const { data: recentMovements } = await db
      .from('hour_ledger')
      .select('id, type, hours, description, period, created_at, tickets(folio)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      subscription,
      hours: { allocated, consumed, adjustments, available: allocated - consumed + adjustments },
      openTickets: openTickets || [],
      recentMovements: recentMovements || [],
    });
  } catch (err) {
    console.error('Error fetching client dashboard:', err);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
});

// GET /api/client/tickets
router.get('/tickets', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);
    const { status, type } = req.query;

    let query = db
      .from('tickets')
      .select('id, folio, type, priority, status, title, created_at, resolved_at')
      .eq('client_id', clientId);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching client tickets:', err);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// GET /api/client/tickets/:id
router.get('/tickets/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);

    // Both embeds point at `users`, so they must be aliased or PostgREST
    // collapses them into a single ambiguous `users` key.
    const { data: ticket, error } = await db
      .from('tickets')
      .select('*, creator:users!tickets_created_by_fkey(full_name), assignee:users!tickets_assigned_to_fkey(full_name)')
      .eq('id', req.params.id)
      .eq('client_id', clientId)
      .limit(1)
      .single();

    if (error || !ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    // Get comments (hide internal ones)
    const { data: comments } = await db
      .from('ticket_comments')
      .select('id, body, is_internal, created_at, users(full_name, role)')
      .eq('ticket_id', ticket.id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    res.json({
      ...ticket,
      creatorName: ticket.creator?.full_name || null,
      assigneeName: ticket.assignee?.full_name || null,
      comments: comments || [],
    });
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
});

// POST /api/client/tickets
router.post('/tickets', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);
    const { type, priority, title, description } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ error: 'Tipo, título y descripción son requeridos' });
    }

    // Get client number
    const { data: client } = await db
      .from('clients')
      .select('client_number')
      .eq('id', clientId)
      .limit(1)
      .single();

    // Generate folio
    const { data: lastTickets } = await db
      .from('tickets')
      .select('folio')
      .eq('client_id', clientId)
      .order('id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (lastTickets && lastTickets.length > 0) {
      const lastFolio = lastTickets[0].folio;
      const parts = lastFolio.split('-TKT-');
      if (parts.length === 2) {
        nextNum = parseInt(parts[1]) + 1;
      }
    }

    const folio = `${client.client_number}-TKT-${String(nextNum).padStart(4, '0')}`;

    const { data, error } = await db
      .from('tickets')
      .insert({
        folio,
        client_id: clientId,
        created_by: req.user.id,
        type,
        priority: priority || 'media',
        status: 'nuevo',
        title,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: 'Error al crear ticket' });
  }
});

// POST /api/client/tickets/:id/comments
router.post('/tickets/:id/comments', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);

    // Verify ticket belongs to client
    const { data: ticket } = await db
      .from('tickets')
      .select('id')
      .eq('id', req.params.id)
      .eq('client_id', clientId)
      .limit(1)
      .single();

    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'El comentario es requerido' });

    const { data, error } = await db
      .from('ticket_comments')
      .insert({
        ticket_id: req.params.id,
        user_id: req.user.id,
        body,
        is_internal: false,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
});

// PUT /api/client/tickets/:id/status
router.put('/tickets/:id/status', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);
    const { status } = req.body;

    // Verify ticket belongs to client
    const { data: ticket } = await db
      .from('tickets')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('client_id', clientId)
      .limit(1)
      .single();

    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    // A client may only close a resolved ticket, or reopen a resolved/closed one.
    const CLOSE = status === 'cerrado' && ticket.status === 'resuelto';
    const REOPEN = status === 'nuevo' && ['resuelto', 'cerrado'].includes(ticket.status);

    if (!CLOSE && !REOPEN) {
      return res.status(400).json({ error: 'Solo puedes cerrar tickets resueltos o reabrir tickets cerrados' });
    }

    const updates = { status };
    updates.resolved_at = CLOSE ? new Date().toISOString() : null;

    const { data, error } = await db
      .from('tickets')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating ticket status:', err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// GET /api/client/ledger
router.get('/ledger', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);
    const { period } = req.query;

    let query = db
      .from('hour_ledger')
      .select('id, type, hours, description, period, created_at, tickets(folio)')
      .eq('client_id', clientId);

    if (period) query = query.eq('period', period);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching ledger:', err);
    res.status(500).json({ error: 'Error al obtener consumo de horas' });
  }
});

// GET /api/client/plan
router.get('/plan', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);

    const { data, error } = await db
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('client_id', clientId)
      .limit(1)
      .single();

    if (error || !data) return res.json(null);
    res.json(data);
  } catch (err) {
    console.error('Error fetching plan:', err);
    res.status(500).json({ error: 'Error al obtener plan' });
  }
});

// POST /api/client/request-plan-change
router.post('/request-plan-change', async (req, res) => {
  try {
    const db = createAdminClient();
    const clientId = getClientId(req);

    // Get client info
    const { data: client } = await db
      .from('clients')
      .select('client_number')
      .eq('id', clientId)
      .limit(1)
      .single();

    // Generate folio
    const { data: lastTickets } = await db
      .from('tickets')
      .select('folio')
      .eq('client_id', clientId)
      .order('id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (lastTickets && lastTickets.length > 0) {
      const lastFolio = lastTickets[0].folio;
      const parts = lastFolio.split('-TKT-');
      if (parts.length === 2) {
        nextNum = parseInt(parts[1]) + 1;
      }
    }

    const folio = `${client.client_number}-TKT-${String(nextNum).padStart(4, '0')}`;

    const { data, error } = await db
      .from('tickets')
      .insert({
        folio,
        client_id: clientId,
        created_by: req.user.id,
        type: 'actualizacion',
        priority: 'media',
        status: 'nuevo',
        title: 'Solicitud de cambio de plan',
        description: 'El cliente solicita un cambio de plan. Por favor contactar para definir el nuevo plan deseado.',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error requesting plan change:', err);
    res.status(500).json({ error: 'Error al solicitar cambio de plan' });
  }
});

export default router;
