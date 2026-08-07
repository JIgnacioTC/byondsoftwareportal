import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';

// Landing & Auth
import Landing from './pages/Landing';
import Login from './pages/Login';

// Static pages
import SobreNosotros from './pages/SobreNosotros';
import Servicios from './pages/Servicios';
import Contacto from './pages/Contacto';
import Privacidad from './pages/Privacidad';
import Terminos from './pages/Terminos';

// Client Portal
import PortalLayout from './pages/portal/PortalLayout';
import Dashboard from './pages/portal/Dashboard';
import Tickets from './pages/portal/Tickets';
import TicketDetail from './pages/portal/TicketDetail';
import NewTicket from './pages/portal/NewTicket';
import ClientHours from './pages/portal/ClientHours';
import ClientPlan from './pages/portal/ClientPlan';

// Admin Portal
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Usuarios from './pages/admin/Usuarios';
import Planes from './pages/admin/Planes';
import TicketsAdmin from './pages/admin/TicketsAdmin';
import TicketDetailAdmin from './pages/admin/TicketDetailAdmin';
import AdminReports from './pages/admin/Reports';
import Contenido from './pages/admin/Contenido';
import ServiciosAdmin from './pages/admin/ServiciosAdmin';
import StripeSuccess from './pages/stripe/Success';
import StripeCancel from './pages/stripe/Cancel';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0F1E2D',
        color: '#E6DACA',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 14,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/stripe/success" element={<StripeSuccess />} />
          <Route path="/stripe/cancel" element={<StripeCancel />} />

          {/* Client Portal */}
          <Route
            path="/portal"
            element={
              <PrivateRoute roles={['client_user']}>
                <PortalLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="tickets/nuevo" element={<NewTicket />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="horas" element={<ClientHours />} />
            <Route path="plan" element={<ClientPlan />} />
          </Route>

          {/* Admin Portal */}
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={['admin', 'agent']}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="planes" element={<Planes />} />
            <Route path="tickets" element={<TicketsAdmin />} />
            <Route path="tickets/:id" element={<TicketDetailAdmin />} />
            <Route path="reportes" element={<AdminReports />} />
            <Route path="contenido" element={<Contenido />} />
            <Route path="servicios" element={<ServiciosAdmin />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
