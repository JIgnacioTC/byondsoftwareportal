import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireRole('admin', 'agent'));

// GET /api/admin/tickets
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { status, type, priority, clientId, assignedTo, search } = req.query;

    let query = db
      .from('tickets')
      .select('*, clients(company_name, client_number), users!tickets_created_by_fkey(full_name)');

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (priority) query = query.eq('priority', priority);
    if (clientId) query = query.eq('client_id', clientId);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (search) {
      query = query.or(`title.ilike.%${search}%,folio.ilike.%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Get assignee names
    const result = await Promise.all((data || []).map(async (ticket) => {
      let assigneeName = null;
      if (ticket.assigned_to) {
        const { data: assignee } = await db
          .from('users')
          .select('full_name')
          .eq('id', ticket.assigned_to)
          .limit(1)
          .single();
        assigneeName = assignee?.full_name || null;
      }
      return {
        ...ticket,
        clientName: ticket.clients?.company_name,
        clientNumber: ticket.clients?.client_number,
        creatorName: ticket.users?.full_name,
        assigneeName,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// GET /api/admin/tickets/agents/list
router.get('/agents/list', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('users')
      .select('id, full_name, email')
      .in('role', ['admin', 'agent'])
      .order('full_name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ error: 'Error al obtener agentes' });
  }
});

// GET /api/admin/tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data: ticket, error } = await db
      .from('tickets')
      .select('*, clients(company_name, client_number), users!tickets_created_by_fkey(full_name, email)')
      .eq('id', req.params.id)
      .limit(1)
      .single();

    if (error || !ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    // Get assignee info
    let assigneeName = null;
    if (ticket.assigned_to) {
      const { data: assignee } = await db
        .from('users')
        .select('full_name')
        .eq('id', ticket.assigned_to)
        .limit(1)
        .single();
      assigneeName = assignee?.full_name || null;
    }

    // Get comments
    const { data: comments } = await db
      .from('ticket_comments')
      .select('*, users(full_name, role)')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    // Get time entries
    const { data: timeEntries } = await db
      .from('time_entries')
      .select('*, users(full_name)')
      .eq('ticket_id', ticket.id)
      .order('work_date', { ascending: false });

    res.json({
      ...ticket,
      clientName: ticket.clients?.company_name,
      clientNumber: ticket.clients?.client_number,
      creatorName: ticket.users?.full_name,
      creatorEmail: ticket.users?.email,
      assigneeName,
      comments: comments || [],
      timeEntries: timeEntries || [],
    });
  } catch (err) {
    console.error('Error fetching ticket:', err);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
});

// PUT /api/admin/tickets/:id
router.put('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { status, priority, assignedTo, type } = req.body;

    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'resuelto') {
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (priority) updates.priority = priority;
    if (assignedTo !== undefined) updates.assigned_to = assignedTo || null;
    if (type) updates.type = type;

    const { data, error } = await db
      .from('tickets')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Ticket no encontrado' });
    res.json(data);
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

// POST /api/admin/tickets/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const db = createAdminClient();
    const { body, isInternal } = req.body;

    if (!body) return res.status(400).json({ error: 'El comentario es requerido' });

    const { data, error } = await db
      .from('ticket_comments')
      .insert({
        ticket_id: req.params.id,
        user_id: req.user.id,
        body,
        is_internal: isInternal || false,
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

// POST /api/admin/tickets/:id/time-entries
router.post('/:id/time-entries', async (req, res) => {
  try {
    const db = createAdminClient();
    const { hours, workDate, notes, billable } = req.body;

    if (!hours || hours < 0.25) {
      return res.status(400).json({ error: 'Las horas deben ser al menos 0.25' });
    }

    // Get ticket to find client_id
    const { data: ticket, error: ticketError } = await db
      .from('tickets')
      .select('client_id, folio')
      .eq('id', req.params.id)
      .limit(1)
      .single();

    if (ticketError || !ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { data: entry, error: entryError } = await db
      .from('time_entries')
      .insert({
        ticket_id: req.params.id,
        agent_id: req.user.id,
        hours: hours,
        work_date: workDate || new Date().toISOString(),
        notes: notes || '',
        billable: billable !== undefined ? billable : true,
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // If billable, insert consumption in ledger
    if (entry.billable) {
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      await db
        .from('hour_ledger')
        .insert({
          client_id: ticket.client_id,
          type: 'consumption',
          hours: -Math.abs(parseFloat(hours)),
          ticket_id: req.params.id,
          time_entry_id: entry.id,
          description: notes || `Registro de tiempo en ticket ${ticket.folio}`,
          period: currentPeriod,
          created_by: req.user.id,
        });
    }

    res.status(201).json(entry);
  } catch (err) {
    console.error('Error creating time entry:', err);
    res.status(500).json({ error: 'Error al registrar tiempo' });
  }
});

export default router;
