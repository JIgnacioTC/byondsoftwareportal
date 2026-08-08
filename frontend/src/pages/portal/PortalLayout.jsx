import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import TorrenLogo from '../../components/TorrenLogo';

const navItems = [
  { to: '/portal', label: 'Dashboard', icon: '📊', end: true },
  { to: '/portal/tickets', label: 'Mis Tickets', icon: '🎫' },
  { to: '/portal/consumo', label: 'Consumo de Horas', icon: '⏱️' },
  { to: '/portal/plan', label: 'Mi Plan', icon: '📋' },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      zIndex: 40,
    },
    sidebar: {
      width: 250,
      background: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      zIndex: 50,
      transition: 'transform 0.2s ease',
    },
    sidebarClosed: {
      transform: 'translateX(-100%)',
    },
    sidebarHeader: {
      padding: '20px 20px 16px',
      borderBottom: '1px solid #e5e7eb',
    },
    logo: {
      fontSize: 18,
      fontWeight: 700,
      color: '#2563eb',
      margin: 0,
    },
    nav: {
      flex: 1,
      padding: '12px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
    link: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderRadius: 8,
      textDecoration: 'none',
      color: '#374151',
      fontSize: 14,
      fontWeight: 500,
      transition: 'background 0.15s',
    },
    linkActive: {
      background: '#eff6ff',
      color: '#2563eb',
      fontWeight: 600,
    },
    logoutBtn: {
      margin: '8px 8px 16px',
      padding: '10px 14px',
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    main: {
      flex: 1,
      marginLeft: 250,
      background: '#f3f4f6',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 24px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 600,
      color: '#111827',
      margin: 0,
    },
    hamburger: {
      display: 'none',
      background: 'none',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      padding: '6px 10px',
      fontSize: 18,
      cursor: 'pointer',
      color: '#374151',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    userName: {
      fontSize: 14,
      color: '#374151',
      fontWeight: 500,
    },
    userAvatar: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      background: '#2563eb',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 600,
    },
    content: {
      flex: 1,
      padding: 24,
    },
  };

  const mobileOverlay = sidebarOpen && (
    <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
  );

  return (
    <div style={styles.container}>
      {mobileOverlay}

      <aside style={{
        ...styles.sidebar,
        ...(sidebarOpen ? {} : {}),
      }}>
        <div style={{ ...styles.sidebarHeader, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <TorrenLogo variant="horizontal" theme="abisal" height={22} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Portal de Cliente
          </span>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.linkActive : {}),
              })}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <div style={styles.main}>
        <header style={styles.header}>
          <button
            style={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h2 style={styles.headerTitle}>Portal de Cliente</h2>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.nombre || user?.email || 'Usuario'}</span>
            <div style={styles.userAvatar}>
              {(user?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main style={styles.content}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside {
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          div[style*="marginLeft: 250"] {
            margin-left: 0 !important;
          }
          button[style*="display: none"] {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
