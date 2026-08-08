import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import TorrenLogo from '../../components/TorrenLogo';
import { IconCheck, IconMail, IconArrowRight } from '../../components/Icons';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPasswordForEmail } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      await resetPasswordForEmail(email.trim(), redirectUrl);
      setSent(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        color: '#E6DACA',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'rgba(26,46,68,0.6)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(196,180,159,0.15)',
          borderRadius: 24,
          padding: '48px 40px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <TorrenLogo variant="horizontal" theme="crema" height={24} />
          </Link>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(230,218,202,0.12)',
                border: '1px solid rgba(230,218,202,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 30px rgba(230,218,202,0.15)',
              }}
            >
              <IconMail size={28} color="#E6DACA" />
            </div>

            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: '#E6DACA',
                marginBottom: 10,
              }}
            >
              Revisa tu Correo
            </h2>

            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Hemos enviado las instrucciones para restablecer tu contraseña a <strong style={{ color: '#E6DACA' }}>{email}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                to="/login"
                className="btn-cta"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                }}
              >
                <span>Volver a Iniciar Sesión</span>
                <IconArrowRight size={16} />
              </Link>

              <button
                onClick={() => setSent(false)}
                className="btn-secondary"
                style={{ fontSize: 13, padding: '10px 16px', background: 'transparent' }}
              >
                ¿No recibiste el correo? Reintentar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#E6DACA',
                  letterSpacing: '0.04em',
                }}
              >
                Recuperar Contraseña
              </h2>
              <p style={{ color: '#C4B49F', fontSize: 13, marginTop: 8 }}>
                Ingresa tu correo y te enviaremos un enlace seguro para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                style={inputStyle}
              />

              {error && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    marginBottom: 20,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-cta"
                style={{
                  width: '100%',
                  marginTop: 8,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Enviando correo...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Link
                to="/login"
                style={{
                  fontSize: 13,
                  color: '#C4B49F',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#E6DACA')}
                onMouseLeave={(e) => (e.target.style.color = '#C4B49F')}
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#C4B49F',
  marginBottom: 8,
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid rgba(196,180,159,0.15)',
  background: 'rgba(15,30,45,0.5)',
  color: '#E6DACA',
  fontSize: 15,
  marginBottom: 20,
  outline: 'none',
  transition: 'border-color 0.3s ease',
  boxSizing: 'border-box',
};
