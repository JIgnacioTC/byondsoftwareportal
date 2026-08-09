import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireRole('admin'));

/** Only client_user rows carry a client_id; '' from a <select> must become NULL. */
function resolveClientId(role, clientId) {
  if (role !== 'client_user') return null;
  const parsed = parseInt(clientId, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

// GET /api/admin/users
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('users')
      .select('*, clients(company_name, client_number)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/admin/users/:id
router.get('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .limit(1)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(data);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// POST /api/admin/users
router.post('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const { email, password, fullName, role, clientId, active } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y rol son requeridos' });
    }

    // Check if email exists
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Create user in Supabase Auth
    const { data: supabaseUser, error: supabaseError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (supabaseError) {
      return res.status(400).json({ error: supabaseError.message });
    }

    // Create our application user
    const { data: newUser, error: userError } = await db
      .from('users')
      .insert({
        supabase_uid: supabaseUser.user.id,
        email,
        full_name: fullName,
        role,
        client_id: resolveClientId(role, clientId),
        active: active !== undefined ? active : true,
      })
      .select()
      .single();

    if (userError) throw userError;

    res.status(201).json({
      id: newUser.id,
      supabaseUid: newUser.supabase_uid,
      email: newUser.email,
      fullName: newUser.full_name,
      role: newUser.role,
      clientId: newUser.client_id,
      active: newUser.active,
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/admin/users/:id
router.put('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    const { email, fullName, role, clientId, active } = req.body;

    const updates = {};
    if (email) updates.email = email;
    if (fullName) updates.full_name = fullName;
    if (role) {
      updates.role = role;
      updates.client_id = resolveClientId(role, clientId);
    }
    if (active !== undefined) updates.active = active;

    const { data, error } = await db
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({
      id: data.id,
      supabaseUid: data.supabase_uid,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      clientId: data.client_id,
      active: data.active,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const db = createAdminClient();
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Get the user to find their supabase_uid
    const { data: user, error: userError } = await db
      .from('users')
      .select('supabase_uid')
      .eq('id', req.params.id)
      .limit(1)
      .single();

    if (userError || !user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Update password in Supabase Auth
    const { error } = await db.auth.admin.updateUserById(user.supabase_uid, {
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
});

// POST /api/admin/users/:id/send-invite (generate setup / recovery link)
router.post('/:id/send-invite', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data: user, error: userError } = await db
      .from('users')
      .select('email')
      .eq('id', req.params.id)
      .limit(1)
      .single();

    if (userError || !user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.torren.dev';
    const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${frontendUrl}/auth/reset-password`,
      },
    });

    if (linkErr) throw linkErr;

    res.json({
      message: 'Enlace generado exitosamente',
      actionLink: linkData?.properties?.action_link,
      email: user.email,
    });
  } catch (err) {
    console.error('Error generating invite link:', err);
    res.status(500).json({ error: err.message || 'Error al generar enlace' });
  }
});

// DELETE /api/admin/users/:id (soft delete - deactivate)
router.delete('/:id', async (req, res) => {
  try {
    const db = createAdminClient();
    // Don't allow deactivating yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivar tu propio usuario' });
    }

    const { data, error } = await db
      .from('users')
      .update({ active: false })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ message: 'Usuario desactivado' });
  } catch (err) {
    console.error('Error deactivating user:', err);
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

export default router;
