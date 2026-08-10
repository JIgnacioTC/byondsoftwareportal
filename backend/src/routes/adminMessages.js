import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require admin role
router.use(requireRole('admin', 'agent'));

// GET /api/admin/messages - list contact form submissions, newest first
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching contact messages:', err);
    res.status(500).json({ error: 'Error al obtener mensajes de contacto' });
  }
});

// PUT /api/admin/messages/:id - toggle read/handled status
router.put('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { status } = req.body;

    if (!['nuevo', 'atendido'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const { data, error } = await db
      .from('contact_messages')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating contact message:', err);
    res.status(500).json({ error: 'Error al actualizar mensaje' });
  }
});

export default router;
