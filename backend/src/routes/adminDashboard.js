import { Router } from 'express';
import { createAdminClient } from '../config/supabase.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireRole('admin', 'agent'));

// GET /api/admin/dashboard
router.get('/', async (req, res) => {
  try {
    const db = createAdminClient();
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // New tickets
    const { data: newTickets } = await db
      .from('tickets')
      .select('*, clients(company_name)')
      .eq('status', 'nuevo')
      .order('created_at', { ascending: false })
      .limit(10);

    // Pending subscriptions
    const { data: pendingSubs } = await db
      .from('subscriptions')
      .select('*, clients(company_name, client_number), plans(name)')
      .eq('status', 'solicitada')
      .order('created_at', { ascending: false });

    // Hours consumed this month
    const { data: hoursData } = await db
      .from('hour_ledger')
      .select('client_id, type, hours, clients(company_name)')
      .eq('period', currentPeriod);

    // Group by client
    const hoursByClient = {};
    (hoursData || []).forEach(row => {
      if (!hoursByClient[row.client_id]) {
        hoursByClient[row.client_id] = {
          clientId: row.client_id,
          clientName: row.clients?.company_name,
          totalConsumed: 0,
          totalAllocated: 0,
        };
      }
      if (row.type === 'consumption') {
        hoursByClient[row.client_id].totalConsumed += parseFloat(row.hours);
      } else if (row.type === 'allocation') {
        hoursByClient[row.client_id].totalAllocated += parseFloat(row.hours);
      }
    });

    // Negative balance clients
    const negativeBalance = Object.values(hoursByClient).filter(c => {
      const balance = c.totalAllocated + c.totalConsumed;
      return balance < 0;
    });

    res.json({
      newTickets: newTickets || [],
      pendingSubscriptions: pendingSubs || [],
      hoursConsumed: Object.values(hoursByClient),
      negativeBalanceClients: negativeBalance,
    });
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
});

// GET /api/admin/reports/hours
router.get('/reports/hours', async (req, res) => {
  try {
    const db = createAdminClient();
    const { period, clientId } = req.query;

    let query = db
      .from('hour_ledger')
      .select('client_id, type, hours, period, clients(company_name)');

    if (period) query = query.eq('period', period);
    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query;

    if (error) throw error;

    // Group by client, period, type
    const grouped = {};
    (data || []).forEach(row => {
      const key = `${row.client_id}-${row.period}-${row.type}`;
      if (!grouped[key]) {
        grouped[key] = {
          clientId: row.client_id,
          clientName: row.clients?.company_name,
          period: row.period,
          type: row.type,
          totalHours: 0,
        };
      }
      grouped[key].totalHours += parseFloat(row.hours);
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Error fetching hours report:', err);
    res.status(500).json({ error: 'Error al obtener reporte de horas' });
  }
});

// GET /api/admin/reports/tickets
router.get('/reports/tickets', async (req, res) => {
  try {
    const db = createAdminClient();
    const { data: tickets } = await db
      .from('tickets')
      .select('status, type, priority');

    // Group by status
    const byStatus = {};
    const byType = {};
    const byPriority = {};

    (tickets || []).forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byType[t.type] = (byType[t.type] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });

    res.json({
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      byPriority: Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
    });
  } catch (err) {
    console.error('Error fetching ticket reports:', err);
    res.status(500).json({ error: 'Error al obtener reporte de tickets' });
  }
});

export default router;
