import { createAdminClient } from '../config/supabase.js';

export async function loadUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    // Use a fresh client for each request
    const supabase = createAdminClient();

    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      return next();
    }

    // Load our application user by supabase_uid
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_uid', supabaseUser.id)
      .limit(1);

    if (!userError && users && users.length > 0 && users[0].active) {
      req.user = users[0];
      req.supabaseUser = supabaseUser;
    }
  } catch (err) {
    // Ignore errors, just don't load user
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
}

export function requireClientAccess(req, res, next) {
  if (req.user && req.user.role === 'client_user') {
    const clientId = parseInt(req.params.clientId || req.body.clientId);
    if (clientId && clientId !== req.user.client_id) {
      return res.status(403).json({ error: 'No tienes acceso a este cliente' });
    }
  }
  next();
}
