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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: 'relative',
      zIndex: 1,
    },
    header: {
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 24px',
      height: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 32,
    },
    logoWrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    link: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      borderRadius: 8,
      textDecoration: 'none',
      color: '#374151',
      fontSize: 14,
      fontWeight: 500,
      transition: 'background 0.15s, color 0.15s',
    },
    linkActive: {
      background: '#eff6ff',
      color: '#2563eb',
      fontWeight: 600,
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    },
    userName: {
      fontSize: 14,
      color: '#374151',
      fontWeight: 500,
      display: 'none',
    },
    userAvatar: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: '#2563eb',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
    },
    logoutBtn: {
      padding: '8px 16px',
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
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
      marginLeft: 16,
    },
    content: {
      flex: 1,
      padding: '32px 24px',
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
    },
    mobileMenu: {
      display: menuOpen ? 'flex' : 'none',
      flexDirection: 'column',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: 16,
      gap: 8,
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoWrapper}>
            <TorrenLogo variant="horizontal" theme="abisal" height={22} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Portal de Cliente
            </span>
          </div>
          <nav style={styles.nav} className="desktop-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.linkActive : {}),
                })}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={styles.userInfo}>
          <span style={styles.userName} className="desktop-user">{user?.nombre || user?.email || 'Usuario'}</span>
          <button style={styles.logoutBtn} onClick={handleLogout} className="desktop-logout">
            <span>🚪</span> Salir
          </button>
          <div style={styles.userAvatar}>
            {(user?.nombre || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <button
            style={styles.hamburger}
            className="mobile-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>
      </header>

      <div style={styles.mobileMenu} className="mobile-menu-container">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.linkActive : {}),
            })}
            onClick={() => setMenuOpen(false)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button style={{ ...styles.logoutBtn, marginTop: 8, justifyContent: 'center' }} onClick={handleLogout}>
          <span>🚪</span> Cerrar sesión
        </button>
      </div>

      <main style={styles.content}>
        <Outlet />
      </main>

      <style>{`
        @media (min-width: 769px) {
          .desktop-user { display: block !important; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-logout { display: none !important; }
          .mobile-hamburger { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-container { display: none !important; }
        }
      `}</style>
    </div>
  );
}
