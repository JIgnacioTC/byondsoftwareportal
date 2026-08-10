import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { loadUser } from './middleware/auth.js';

// Routes
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import adminClientsRoutes from './routes/adminClients.js';
import adminUsersRoutes from './routes/adminUsers.js';
import adminPlansRoutes from './routes/adminPlans.js';
import adminTicketsRoutes from './routes/adminTickets.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import adminContentRoutes from './routes/adminContent.js';
import adminMessagesRoutes from './routes/adminMessages.js';
import clientPortalRoutes from './routes/clientPortal.js';
import stripeRoutes from './routes/stripe.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Load user on every request
app.use(loadUser);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TORREN Portal API running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Public routes (landing page)
app.use('/api/public', publicRoutes);

// Stripe routes (webhook is public, others need auth)
app.use('/api/stripe', stripeRoutes);

// Admin routes
app.use('/api/admin/clients', adminClientsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/plans', adminPlansRoutes);
app.use('/api/admin/tickets', adminTicketsRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/admin/messages', adminMessagesRoutes);
app.use('/api/admin', adminDashboardRoutes);

// Client portal routes
app.use('/api/client', clientPortalRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
