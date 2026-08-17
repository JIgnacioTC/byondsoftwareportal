const API_BASE = '/api';

/** Drop empty filters so `?status=` never reaches the API as a real filter. */
function qs(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

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

  // 204s and HTML error pages would blow up `.json()`, so parse defensively.
  const raw = await response.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    if (response.status === 403) throw new Error('No tienes permiso para ver esta información.');
    throw new Error(data?.error || `Error en la solicitud (${response.status})`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password, fullName, companyName) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName, companyName }) }),
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
  getProducts: () => request('/public/products'),
  getContent: () => request('/public/content'),
  createCheckoutSession: (data) => request('/stripe/create-checkout-session', { method: 'POST', body: JSON.stringify(data) }),
  createProductCheckout: (data) => request('/stripe/create-product-checkout', { method: 'POST', body: JSON.stringify(data) }),

  // Admin - Dashboard
  getAdminDashboard: () => request('/admin'),

  // Admin - Clients
  getClients: () => request('/admin/clients'),
  getClient: (id) => request(`/admin/clients/${id}`),
  createClient: (data) => request('/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/admin/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  // Takes the CLIENT id (the endpoint looks up that client's pending subscription).
  activateSubscription: (clientId) => request(`/admin/clients/${clientId}/activate-subscription`, { method: 'POST' }),
  getAdminClientLedger: (clientId, params = {}) => request(`/admin/clients/${clientId}/ledger${qs(params)}`),
  createAdjustment: (id, data) => request(`/admin/clients/${id}/adjustment`, { method: 'POST', body: JSON.stringify(data) }),

  // Admin - Users
  getUsers: () => request('/admin/users'),
  getUser: (id) => request(`/admin/users/${id}`),
  createUser: (data) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetPassword: (id, newPassword) => request(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),
  sendUserInvite: (id) => request(`/admin/users/${id}/send-invite`, { method: 'POST' }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Admin - Plans
  getAdminPlans: () => request('/admin/plans'),
  getPlan: (id) => request(`/admin/plans/${id}`),
  createPlan: (data) => request('/admin/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id, data) => request(`/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  syncPlanStripe: (id) => request(`/admin/plans/${id}/sync-stripe`, { method: 'POST' }),

  // Admin - Tickets
  getTickets: (params = {}) => request(`/admin/tickets${qs(params)}`),
  getTicket: (id) => request(`/admin/tickets/${id}`),
  updateTicket: (id, data) => request(`/admin/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addTicketComment: (id, data) => request(`/admin/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  addTimeEntry: (id, data) => request(`/admin/tickets/${id}/time-entries`, { method: 'POST', body: JSON.stringify(data) }),
  getAgents: () => request('/admin/tickets/agents/list'),

  // Admin - Reports
  getHoursReport: (params = {}) => request(`/admin/reports/hours${qs(params)}`),
  getTicketReports: () => request('/admin/reports/tickets'),

  // Admin - Content
  getAdminContent: () => request('/admin/content'),
  updateAdminContent: (items) => request('/admin/content', { method: 'PUT', body: JSON.stringify({ items }) }),
  getAdminServices: () => request('/admin/content/services'),
  updateAdminService: (slug, data) => request(`/admin/content/services/${slug}`, { method: 'PUT', body: JSON.stringify(data) }),
  createAdminService: (data) => request('/admin/content/services', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminService: (slug) => request(`/admin/content/services/${slug}`, { method: 'DELETE' }),
  getAdminMessages: () => request('/admin/messages'),
  updateAdminMessageStatus: (id, status) => request(`/admin/messages/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Admin - Products
  getAdminProducts: () => request('/admin/products'),
  createAdminProduct: (data) => request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminProduct: (id, data) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdminProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  // `imageBase64` is a data: URL (e.g. from FileReader.readAsDataURL); returns { url, path }.
  uploadAdminProductImage: (imageBase64) => request('/admin/products/upload-image', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),

  // Stripe
  createPortalSession: (clientId) => request('/stripe/portal-session', { method: 'POST', body: JSON.stringify({ clientId }) }),

  // Client Portal
  getClientDashboard: () => request('/client/dashboard'),
  getClientTickets: (params = {}) => request(`/client/tickets${qs(params)}`),
  getClientTicket: (id) => request(`/client/tickets/${id}`),
  // `data` must use the API field names: { type, priority, title, description }
  createTicket: (data) => request('/client/tickets', { method: 'POST', body: JSON.stringify(data) }),
  addClientComment: (id, body) => request(`/client/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  updateClientTicketStatus: (id, status) => request(`/client/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getClientLedger: (params = {}) => request(`/client/ledger${qs(params)}`),
  getClientPlan: () => request('/client/plan'),
  requestPlanChange: () => request('/client/request-plan-change', { method: 'POST' }),
};
