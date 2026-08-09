import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import TorrenLogo from '../../components/TorrenLogo';
import { initials } from '../../lib/domain';
import {
  IconChart, IconTicket, IconClock, IconCard, IconLogout, IconMenu, IconX,
} from '../../components/Icons';

const NAV = [
  { to: '/portal', label: 'Resumen', Icon: IconChart, end: true },
  { to: '/portal/tickets', label: 'Tickets', Icon: IconTicket },
  { to: '/portal/horas', label: 'Consumo de horas', Icon: IconClock },
  { to: '/portal/plan', label: 'Mi plan', Icon: IconCard },
];

/** Longest matching nav entry wins, so /portal/tickets/12 still says "Tickets". */
function currentSection(pathname) {
  const match = [...NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  return match?.label || 'Portal';
}

export default function PortalLayout() {
  const { user, client } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Never leave the drawer hanging open after a navigation.
  useEffect(() => { setNavOpen(false); }, [pathname]);

  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.fullName || user?.email || 'Usuario';

  return (
    <div className="trn">
      <div className="trn-shell">
        {navOpen && <div className="trn-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />}

        <aside className={`trn-rail${navOpen ? ' trn-rail--open' : ''}`}>
          <div className="trn-rail__brand">
            <TorrenLogo variant="horizontal" theme="crema" height={20} />
            <span className="trn-rail__eyebrow">Portal de cliente</span>
          </div>

          <nav className="trn-rail__nav" aria-label="Secciones del portal">
            {NAV.map(({ to, label, Icon, end }) => (
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
          </nav>

          <div className="trn-rail__foot">
            <div className="trn-identity">
              <span className="trn-avatar">{initials(displayName)}</span>
              <div style={{ minWidth: 0 }}>
                <div className="trn-identity__name">{displayName}</div>
                <div className="trn-identity__meta">{client?.company_name || 'Cliente'}</div>
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
              <span className="trn-hide-sm">Portal</span>
              <span aria-hidden="true" className="trn-hide-sm">/</span>
              <strong>{currentSection(pathname)}</strong>
            </div>
            <div className="trn-row trn-topbar__meta">
              <span className="trn-muted trn-nowrap trn-hide-sm" style={{ fontSize: 13 }}>{client?.client_number || ''}</span>
              <span className="trn-avatar trn-avatar--light">{initials(displayName)}</span>
            </div>
          </header>

          <main className="trn-content trn-content--narrow">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
