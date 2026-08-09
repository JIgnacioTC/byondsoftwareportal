import { Router } from 'express';
import { supabaseAdmin, createAdminClient } from '../config/supabase.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Authenticate with Supabase
    const { data: { session }, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !session) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Use a fresh client for DB queries (signInWithPassword modifies client state)
    const db = createAdminClient();

    // Load our application user
    const { data: users, error: userError } = await db
      .from('users')
      .select('*')
      .eq('supabase_uid', session.user.id)
      .limit(1);

    if (userError || !users || users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    if (!user.active) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    let clientInfo = null;
    if (user.client_id) {
      const { data: clients } = await db
        .from('clients')
        .select('*')
        .eq('id', user.client_id)
        .limit(1);
      clientInfo = clients?.[0] || null;
    }

    res.json({
      user: {
        id: user.id,
        supabaseUid: user.supabase_uid,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        clientId: user.client_id,
      },
      client: clientInfo,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, companyName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName || '',
        },
      },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'No se pudo crear el usuario' });
    }

    const db = createAdminClient();

    // Check if client exists or create one
    let clientId = null;
    if (companyName) {
      const { data: newClient } = await db
        .from('clients')
        .insert({
          company_name: companyName,
          contact_name: fullName,
          contact_email: email,
          status: 'lead',
        })
        .select()
        .single();
      if (newClient) clientId = newClient.id;
    }

    // Create user in public.users
    const { data: newUser, error: newUserError } = await db
      .from('users')
      .insert({
        supabase_uid: authData.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        role: 'client_user',
        client_id: clientId,
        active: true,
      })
      .select()
      .single();

    if (newUserError) {
      console.error('Error creating app user record:', newUserError);
    }

    res.json({
      message: 'Registro exitoso',
      user: newUser || {
        supabaseUid: authData.user.id,
        email,
        fullName,
        role: 'client_user',
        clientId,
      },
      session: authData.session,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error del servidor durante el registro' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await supabaseAdmin.auth.admin.signOut(token);
    }
    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    console.error('Logout error:', err);
    res.json({ message: 'Sesión cerrada' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    let clientInfo = null;
    let subscriptionInfo = null;

    if (req.user.client_id) {
      const { data: clients } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', req.user.client_id)
        .limit(1);
      clientInfo = clients?.[0] || null;

      const { data: subs } = await supabaseAdmin
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('client_id', req.user.client_id)
        .limit(1);
      subscriptionInfo = subs?.[0] || null;
    }

    res.json({
      user: {
        id: req.user.id,
        supabaseUid: req.user.supabase_uid,
        email: req.user.email,
        fullName: req.user.full_name,
        role: req.user.role,
        clientId: req.user.client_id,
      },
      client: clientInfo,
      subscription: subscriptionInfo,
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
