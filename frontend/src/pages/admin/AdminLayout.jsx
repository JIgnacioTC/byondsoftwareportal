import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { IconChart, IconBuilding, IconUsers, IconBox, IconTicket, IconTrending, IconLayout, IconTool } from '../../components/Icons';

const navItems = [
  { to: '/admin', label: 'Dashboard', Icon: IconChart },
  { to: '/admin/clientes', label: 'Clientes', Icon: IconBuilding },
  { to: '/admin/usuarios', label: 'Usuarios', Icon: IconUsers },
  { to: '/admin/planes', label: 'Planes', Icon: IconBox },
  { to: '/admin/tickets', label: 'Tickets', Icon: IconTicket },
  { to: '/admin/reportes', label: 'Reportes', Icon: IconTrending },
  { to: '/admin/contenido', label: 'Contenido', Icon: IconLayout },
  { to: '/admin/servicios', label: 'Servicios', Icon: IconTool },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{
        width: 250,
        background: '#1e3a5f',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>TORREN</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>Administracion</p>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                transition: 'background 0.2s',
              })}
            >
              <item.Icon size={18} color="#fff" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ marginBottom: 12, fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{user?.full_name || user?.email}</div>
            <div style={{ opacity: 0.7, fontSize: 11 }}>{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 250, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111' }}>
            Portal de Administracion
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{user?.full_name || user?.email}</span>
            <span style={{
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background: '#f3e8ff',
              color: '#7c3aed',
            }}>
              {user?.role}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, padding: 32, background: '#f9fafb', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
