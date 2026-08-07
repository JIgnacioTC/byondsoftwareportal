const API_BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  // Get access token from supabase session
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: (accessToken) => {
    const config = {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return fetch(`${API_BASE}/auth/me`, config).then(r => r.json());
  },

  // Public
  getPlans: () => request('/public/plans'),
  submitContact: (data) => request('/public/contact', { method: 'POST', body: JSON.stringify(data) }),
  getStats: () => request('/public/stats'),
  getServices: () => request('/public/services'),
  getContent: () => request('/public/content'),
  createCheckoutSession: (data) => request('/stripe/create-checkout-session', { method: 'POST', body: JSON.stringify(data) }),

  // Admin - Dashboard
  getAdminDashboard: () => request('/admin'),

  // Admin - Clients
  getClients: () => request('/admin/clients'),
  getClient: (id) => request(`/admin/clients/${id}`),
  createClient: (data) => request('/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/admin/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  activateSubscription: (id) => request(`/admin/clients/${id}/activate-subscription`, { method: 'POST' }),
  getClientLedger: (id, period) => request(`/admin/clients/${id}/ledger${period ? `?period=${period}` : ''}`),
  createAdjustment: (id, data) => request(`/admin/clients/${id}/adjustment`, { method: 'POST', body: JSON.stringify(data) }),

  // Admin - Users
  getUsers: () => request('/admin/users'),
  getUser: (id) => request(`/admin/users/${id}`),
  createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (id, newPassword) => request(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Admin - Plans
  getAdminPlans: () => request('/admin/plans'),
  getPlan: (id) => request(`/admin/plans/${id}`),
  createPlan: (data) => request('/admin/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id, data) => request(`/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  syncPlanStripe: (id) => request(`/admin/plans/${id}/sync-stripe`, { method: 'POST' }),

  // Admin - Tickets
  getTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/tickets${qs ? `?${qs}` : ''}`);
  },
  getTicket: (id) => request(`/admin/tickets/${id}`),
  updateTicket: (id, data) => request(`/admin/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addTicketComment: (id, data) => request(`/admin/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  addTimeEntry: (id, data) => request(`/admin/tickets/${id}/time-entries`, { method: 'POST', body: JSON.stringify(data) }),
  getAgents: () => request('/admin/tickets/agents/list'),

  // Admin - Reports
  getHoursReport: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/reports/hours${qs ? `?${qs}` : ''}`);
  },
  getTicketReports: () => request('/admin/reports/tickets'),

  // Admin - Content
  getAdminContent: () => request('/admin/content'),
  updateAdminContent: (items) => request('/admin/content', { method: 'PUT', body: JSON.stringify({ items }) }),
  getAdminServices: () => request('/admin/content/services'),
  updateAdminService: (slug, data) => request(`/admin/content/services/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),
  createAdminService: (data) => request('/admin/content/services', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminService: (slug) => request(`/admin/content/services/${slug}`, { method: 'DELETE' }),

  // Stripe
  createPortalSession: (clientId) => request('/stripe/portal-session', { method: 'POST', body: JSON.stringify({ clientId }) }),

  // Client Portal
  getClientDashboard: () => request('/client/dashboard'),
  getClientTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/client/tickets${qs ? `?${qs}` : ''}`);
  },
  getClientTicket: (id) => request(`/client/tickets/${id}`),
  createTicket: (data) => request('/client/tickets', { method: 'POST', body: JSON.stringify(data) }),
  addClientComment: (id, body) => request(`/client/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  updateClientTicketStatus: (id, status) => request(`/client/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getClientLedger: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/client/ledger${qs ? `?${qs}` : ''}`);
  },
  getClientPlan: () => request('/client/plan'),
  requestPlanChange: () => request('/client/request-plan-change', { method: 'POST' }),
};
