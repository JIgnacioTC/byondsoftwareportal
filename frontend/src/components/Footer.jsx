import { Link } from 'react-router-dom';

export default function Footer() {
  const col = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const colTitle = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#E6DACA',
    marginBottom: 8,
  };

  const link = {
    fontSize: 14,
    color: '#C4B49F',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
  };

  return (
    <footer style={{ background: '#1A2E44', borderTop: '1px solid rgba(196,180,159,0.1)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 40px' }}>
        {/* Top: Logo + columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48,
          marginBottom: 64,
        }}>
          {/* Logo + description */}
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#E6DACA',
              marginBottom: 16,
            }}>
              TORREN
            </div>
            <p style={{ fontSize: 14, color: '#C4B49F', lineHeight: 1.7, maxWidth: 280 }}>
              Soluciones de software a medida para empresas que buscan innovación, confianza y resultados.
            </p>
          </div>

          {/* Servicios */}
          <div style={col}>
            <div style={colTitle}>Servicios</div>
            <Link to="/servicios" style={link}>Desarrollo a Medida</Link>
            <Link to="/servicios" style={link}>Soporte Técnico</Link>
            <Link to="/servicios" style={link}>Monitoreo 24/7</Link>
            <Link to="/servicios" style={link}>Backups y Seguridad</Link>
          </div>

          {/* Empresa */}
          <div style={col}>
            <div style={colTitle}>Empresa</div>
            <Link to="/sobre-nosotros" style={link}>Sobre Nosotros</Link>
            <Link to="/contacto" style={link}>Contacto</Link>
            <Link to="/login" style={link}>Portal de Cliente</Link>
          </div>

          {/* Legal */}
          <div style={col}>
            <div style={colTitle}>Legal</div>
            <Link to="/privacidad" style={link}>Aviso de Privacidad</Link>
            <Link to="/terminos" style={link}>Términos y Condiciones</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(196,180,159,0.1)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(196,180,159,0.6)' }}>
            © {new Date().getFullYear()} TORREN. Todos los derechos reservados.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/privacidad" style={{ fontSize: 13, color: 'rgba(196,180,159,0.6)', textDecoration: 'none' }}>Privacidad</Link>
            <Link to="/terminos" style={{ fontSize: 13, color: 'rgba(196,180,159,0.6)', textDecoration: 'none' }}>Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
