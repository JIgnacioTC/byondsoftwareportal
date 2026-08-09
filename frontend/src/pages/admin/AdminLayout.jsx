import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import TorrenLogo from '../../components/TorrenLogo';
import { USER_ROLE, describe, initials } from '../../lib/domain';
import { Badge } from '../../components/ui';
import {
  IconBuilding, IconChart, IconLayout, IconLogout, IconMenu, IconTicket,
  IconTool, IconTrending, IconUsers, IconBox, IconX,
} from '../../components/Icons';

const NAV = [
  {
    group: 'Operación',
    items: [
      { to: '/admin', label: 'Dashboard', Icon: IconChart, end: true },
      { to: '/admin/tickets', label: 'Tickets', Icon: IconTicket },
      { to: '/admin/reportes', label: 'Reportes', Icon: IconTrending },
    ],
  },
  {
    group: 'Cuentas',
    items: [
      { to: '/admin/clientes', label: 'Clientes', Icon: IconBuilding },
      { to: '/admin/usuarios', label: 'Usuarios', Icon: IconUsers },
      { to: '/admin/planes', label: 'Planes', Icon: IconBox },
    ],
  },
  {
    group: 'Sitio público',
    items: [
      { to: '/admin/contenido', label: 'Contenido', Icon: IconLayout },
      { to: '/admin/servicios', label: 'Servicios', Icon: IconTool },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function currentSection(pathname) {
  const match = [...ALL_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  return match?.label || 'Dashboard';
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => { setNavOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.fullName || user?.email || 'Usuario';
  const role = describe(USER_ROLE, user?.role);

  return (
    <div className="trn">
      <div className="trn-shell">
        {navOpen && <div className="trn-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

        <aside className={`trn-rail${navOpen ? ' trn-rail--open' : ''}`}>
          <div className="trn-rail__brand">
            <TorrenLogo variant="horizontal" theme="crema" height={20} />
            <span className="trn-rail__eyebrow">Consola interna</span>
          </div>

          <nav className="trn-rail__nav" aria-label="Secciones de administración">
            {NAV.map(({ group, items }) => (
              <div key={group}>
                <p className="trn-rail__group">{group}</p>
                {items.map(({ to, label, Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => `trn-navlink${isActive ? ' trn-navlink--active' : ''}`}
                  >
                    <Icon size={17} color="currentColor" />
                    {label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="trn-rail__foot">
            <div className="trn-identity">
              <span className="trn-avatar">{initials(displayName)}</span>
              <div style={{ minWidth: 0 }}>
                <div className="trn-identity__name">{displayName}</div>
                <div className="trn-identity__meta">{role.label}</div>
              </div>
            </div>
            <button type="button" className="trn-btn trn-btn--secondary trn-btn--sm trn-btn--block" onClick={handleLogout}>
              <IconLogout size={15} color="currentColor" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="trn-main">
          <header className="trn-topbar">
            <div className="trn-crumb">
              <button
                type="button"
                className="trn-btn trn-btn--ghost trn-btn--sm trn-burger"
                onClick={() => setNavOpen((v) => !v)}
                aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={navOpen}
              >
                {navOpen ? <IconX size={18} color="currentColor" /> : <IconMenu size={18} color="currentColor" />}
              </button>
              <span className="trn-hide-sm">Administración</span>
              <span aria-hidden="true" className="trn-hide-sm">/</span>
              <strong>{currentSection(pathname)}</strong>
            </div>
            <div className="trn-row trn-topbar__meta">
              <span className="trn-hide-sm"><Badge tone={role.tone}>{role.label}</Badge></span>
              <span className="trn-avatar trn-avatar--light">{initials(displayName)}</span>
            </div>
          </header>

          <main className="trn-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
