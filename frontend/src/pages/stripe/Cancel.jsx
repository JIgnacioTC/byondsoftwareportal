import { Link } from 'react-router-dom';
import TorrenLogo from '../../components/TorrenLogo';

export default function StripeCancel() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1E2D',
      backgroundImage: 'radial-gradient(ellipse at 50% 15%, rgba(26,46,68,0.7) 0%, #0F1E2D 80%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'rgba(26,46,68,0.8)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(196,180,159,0.15)',
        borderRadius: 20,
        padding: 48,
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <TorrenLogo variant="horizontal" theme="crema" height={24} />
          </Link>
        </div>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 28,
          color: '#ef4444',
        }}>
          X
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#E6DACA',
          marginBottom: 12,
        }}>
          Pago Cancelado
        </h2>
        <p style={{ color: '#C4B49F', marginBottom: 32, lineHeight: 1.6, fontSize: 15 }}>
          El proceso de pago fue cancelado. No se realizo ningun cargo a tu cuenta.
        </p>
        <p style={{ color: '#C4B49F', marginBottom: 32, lineHeight: 1.6, fontSize: 14 }}>
          Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/#planes" className="btn-cta" style={{ textDecoration: 'none' }}>
            Ver planes
          </Link>
          <Link to="/contacto" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Contactar
          </Link>
        </div>
      </div>
    </div>
  );
}
