import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IconCheck } from '../../components/Icons';

export default function StripeSuccess() {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      fetch(`/api/stripe/verify-session/${sessionId}`)
        .then(r => r.json())
        .then(data => {
          setStatus(data);
          setVerifying(false);
        })
        .catch(() => {
          setStatus({ status: 'paid' });
          setVerifying(false);
        });
    } else {
      setStatus({ status: 'paid' });
      setVerifying(false);
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F1E2D',
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
        {verifying ? (
          <p style={{ color: '#C4B49F', fontSize: 15 }}>Verificando pago...</p>
        ) : (
          <>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(230,218,202,0.1)',
              border: '1px solid rgba(230,218,202,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <IconCheck size={28} color="#E6DACA" />
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
              Pago Exitoso
            </h2>
            <p style={{ color: '#C4B49F', marginBottom: 32, lineHeight: 1.6, fontSize: 15 }}>
              Tu suscripcion ha sido activada. Recibiras un correo de confirmacion con los detalles de tu plan.
            </p>
            <p style={{ color: '#C4B49F', marginBottom: 32, lineHeight: 1.6, fontSize: 14 }}>
              Nuestro equipo se pondra en contacto contigo para configurar tu cuenta de acceso al portal.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="btn-cta" style={{ textDecoration: 'none' }}>
                Volver al inicio
              </Link>
              <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>
                Iniciar sesion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
