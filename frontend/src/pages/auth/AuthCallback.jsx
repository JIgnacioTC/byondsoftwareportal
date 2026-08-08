import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import TorrenLogo from '../../components/TorrenLogo';
import { IconCheck, IconArrowRight } from '../../components/Icons';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadUserProfile } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function handleAuthRedirect() {
      try {
        // 1. Check for errors in query parameters or hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const error = urlParams.get('error') || hashParams.get('error');
        const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (error || errorCode || errorDescription) {
          console.warn('Auth redirect error:', { error, errorCode, errorDescription });
          if (!isMounted) return;
          setErrorType(errorCode || error || 'auth_error');
          if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
            setErrorMessage('El enlace de acceso o recuperación ha expirado o ya fue utilizado.');
          } else if (errorCode === 'access_denied') {
            setErrorMessage('El acceso fue denegado o el enlace no es válido.');
          } else {
            setErrorMessage(errorDescription || 'Ocurrió un error al procesar el enlace de autenticación.');
          }
          setStatus('error');
          return;
        }

        // 2. Check for type recovery in hash or query
        const type = urlParams.get('type') || hashParams.get('type');
        if (type === 'recovery') {
          console.log('Recovery type detected, redirecting to /auth/reset-password');
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // 3. Handle PKCE code exchange if present
        const code = urlParams.get('code');
        if (code) {
          console.log('Exchanging PKCE code for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Exchange code error:', exchangeError);
            if (!isMounted) return;
            setErrorType('exchange_error');
            setErrorMessage(exchangeError.message || 'No se pudo validar el código de autenticación.');
            setStatus('error');
            return;
          }

          if (data?.session) {
            const profileData = await loadUserProfile(data.session.access_token);
            const role = profileData?.user?.role;
            const next = urlParams.get('next');

            if (next) {
              navigate(next, { replace: true });
            } else if (role === 'admin' || role === 'agent') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/portal', { replace: true });
            }
            return;
          }
        }

        // 4. Check existing or hash session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profileData = await loadUserProfile(session.access_token);
          const role = profileData?.user?.role;
          const next = urlParams.get('next');

          if (next) {
            navigate(next, { replace: true });
          } else if (role === 'admin' || role === 'agent') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/portal', { replace: true });
          }
          return;
        }

        // 5. If no session and no code, wait for authStateChange listener or fallback
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log('Auth state change event on callback:', event);
          if (event === 'PASSWORD_RECOVERY') {
            subscription.unsubscribe();
            navigate('/auth/reset-password', { replace: true });
          } else if (event === 'SIGNED_IN' && currentSession) {
            subscription.unsubscribe();
            const profileData = await loadUserProfile(currentSession.access_token);
            const role = profileData?.user?.role;
            if (role === 'admin' || role === 'agent') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/portal', { replace: true });
            }
          }
        });

        // Timeout fallback after 4 seconds
        setTimeout(() => {
          if (isMounted && status === 'processing') {
            subscription.unsubscribe();
            navigate('/login', { replace: true });
          }
        }, 4000);

      } catch (err) {
        console.error('Unhandled callback error:', err);
        if (!isMounted) return;
        setErrorMessage(err.message || 'Error inesperado durante la autenticación.');
        setStatus('error');
      }
    }

    handleAuthRedirect();

    return () => {
      isMounted = false;
    };
  }, [navigate, loadUserProfile, status]);

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
          maxWidth: 480,
          background: 'rgba(26,46,68,0.65)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(196,180,159,0.15)',
          borderRadius: 24,
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <TorrenLogo variant="horizontal" theme="crema" height={24} />
          </Link>
        </div>

        {status === 'processing' && (
          <div>
            <div
              style={{
                width: 48,
                height: 48,
                border: '3px solid rgba(230,218,202,0.2)',
                borderTopColor: '#E6DACA',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#E6DACA',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              Autenticando enlace...
            </h2>
            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6 }}>
              Estamos verificando tus credenciales de acceso seguro a la plataforma TORREN.
            </p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 26,
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
              Enlace no válido o expirado
            </h2>

            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              {errorMessage}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                to="/auth/forgot-password"
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
                <span>Solicitar nuevo enlace</span>
                <IconArrowRight size={16} />
              </Link>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 4 }}>
                <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13 }}>
                  Iniciar Sesión
                </Link>
                <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13 }}>
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
