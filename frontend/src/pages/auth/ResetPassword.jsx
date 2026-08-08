import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import TorrenLogo from '../../components/TorrenLogo';
import { IconCheck, IconArrowRight } from '../../components/Icons';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState('client_user');
  const { updatePassword, loadUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function initSession() {
      try {
        // 1. Handle PKCE code if present
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (codeErr) {
            console.error('Error exchanging code in reset password:', codeErr);
          }
        }

        // 2. Handle hash parameters if present
        const hash = window.location.hash.substring(1);
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }

        // 3. Verify current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
          const profile = await loadUserProfile(session.access_token);
          if (profile?.user?.role) {
            setUserRole(profile.user.role);
          }
        } else {
          // Listen for recovery state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, curSession) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && curSession)) {
              setHasValidSession(true);
              const profile = await loadUserProfile(curSession.access_token);
              if (profile?.user?.role) {
                setUserRole(profile.user.role);
              }
            }
          });

          // Timeout check
          setTimeout(() => {
            setCheckingSession(false);
          }, 1500);
          return () => subscription.unsubscribe();
        }
      } catch (err) {
        console.warn('Session init check failed:', err);
      } finally {
        setCheckingSession(false);
      }
    }

    initSession();
  }, [loadUserProfile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);

      // Auto redirect after 2.5 seconds
      setTimeout(() => {
        if (userRole === 'admin' || userRole === 'agent') {
          navigate('/admin');
        } else {
          navigate('/portal');
        }
      }, 2500);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err.message || 'Error al actualizar la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F1E2D',
        backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(26,46,68,0.7) 0%, #0F1E2D 80%)',
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

        {checkingSession ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid rgba(230,218,202,0.2)',
                borderTopColor: '#E6DACA',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ color: '#C4B49F', fontSize: 14 }}>Verificando enlace de seguridad...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : success ? (
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
              <IconCheck size={30} color="#E6DACA" />
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
              ¡Contraseña Actualizada!
            </h2>
            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Tu nueva clave de acceso ha sido guardada. Redirigiendo a tu panel...
            </p>
            <Link
              to={userRole === 'admin' || userRole === 'agent' ? '/admin' : '/portal'}
              className="btn-cta"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '12px 20px',
              }}
            >
              <span>Ir a mi Portal</span>
              <IconArrowRight size={16} />
            </Link>
          </div>
        ) : !hasValidSession ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 24,
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#E6DACA',
                marginBottom: 10,
              }}
            >
              Enlace Expirado o Inválido
            </h2>
            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Para restablecer o configurar tu contraseña necesitas un enlace válido. Solicita un nuevo correo de recuperación a continuación.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                to="/auth/forgot-password"
                className="btn-cta"
                style={{ textDecoration: 'none', padding: '12px 20px', textAlign: 'center' }}
              >
                Solicitar recuperación
              </Link>
              <Link
                to="/login"
                className="btn-secondary"
                style={{ textDecoration: 'none', padding: '12px 20px', textAlign: 'center', fontSize: 13 }}
              >
                Volver a Iniciar Sesión
              </Link>
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
                Establecer Contraseña
              </h2>
              <p style={{ color: '#C4B49F', fontSize: 13, marginTop: 8 }}>
                Ingresa tu nueva contraseña para acceder a la plataforma TORREN.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Nueva Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={inputStyle}
                minLength={8}
              />

              <label style={labelStyle}>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                style={inputStyle}
                minLength={8}
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
                {loading ? 'Guardando contraseña...' : 'Actualizar Contraseña'}
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
