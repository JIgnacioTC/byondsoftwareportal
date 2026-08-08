import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TorrenLogo from './TorrenLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navBg = scrolled
    ? 'rgba(15, 30, 45, 0.85)'
    : 'rgba(15, 30, 45, 0.4)';

  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: navBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: scrolled ? '1px solid rgba(196,180,159,0.1)' : '1px solid transparent',
    transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
  };

  const inner = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: scrolled ? 60 : 72,
    transition: 'height 0.4s ease',
  };

  const logo = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#E6DACA',
    textDecoration: 'none',
  };

  const linkStyle = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#C4B49F',
    textDecoration: 'none',
    padding: '8px 0',
    transition: 'color 0.3s ease',
    position: 'relative',
  };

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/servicios', label: 'Servicios' },
    { to: '/sobre-nosotros', label: 'Nosotros' },
    { to: '/contacto', label: 'Contacto' },
  ];

  return (
    <nav style={navStyle}>
      <div style={inner}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <TorrenLogo variant="horizontal" theme="crema" height={scrolled ? 24 : 28} />
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                ...linkStyle,
                color: location.pathname === l.to ? '#E6DACA' : '#C4B49F',
              }}
              onMouseEnter={(e) => e.target.style.color = '#E6DACA'}
              onMouseLeave={(e) => {
                if (location.pathname !== l.to) e.target.style.color = '#C4B49F';
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#0F1E2D',
              background: '#E6DACA',
              padding: '10px 24px',
              borderRadius: 10,
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 20px rgba(230,218,202,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Portal
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            flexDirection: 'column',
            gap: 5,
          }}
          className="nav-hamburger"
          aria-label="Menú"
        >
          <span style={{ width: 24, height: 2, background: '#E6DACA', borderRadius: 1, transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <span style={{ width: 24, height: 2, background: '#E6DACA', borderRadius: 1, opacity: menuOpen ? 0 : 1, transition: 'all 0.3s' }} />
          <span style={{ width: 24, height: 2, background: '#E6DACA', borderRadius: 1, transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(15,30,45,0.95)',
          backdropFilter: 'blur(24px)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          borderTop: '1px solid rgba(196,180,159,0.1)',
        }}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                ...linkStyle,
                fontSize: 14,
                color: location.pathname === l.to ? '#E6DACA' : '#C4B49F',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/login"
            style={{
              ...linkStyle,
              fontSize: 14,
              color: '#0F1E2D',
              background: '#E6DACA',
              padding: '12px 24px',
              borderRadius: 10,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Portal
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
