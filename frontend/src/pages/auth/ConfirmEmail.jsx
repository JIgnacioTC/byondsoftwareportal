import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import TorrenLogo from '../../components/TorrenLogo';
import { IconCheck, IconArrowRight } from '../../components/Icons';

export default function ConfirmEmail() {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [error, setError] = useState('');
  const { loadUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function verify() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
          if (data?.session) {
            await loadUserProfile(data.session.access_token);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await loadUserProfile(session.access_token);
          setStatus('success');
        } else {
          setStatus('success');
        }
      } catch (err) {
        console.error('Email confirm error:', err);
        setError(err.message || 'El enlace de confirmación no es válido o ha expirado.');
        setStatus('error');
      }
    }

    verify();
  }, [loadUserProfile]);

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
          maxWidth: 460,
          background: 'rgba(26,46,68,0.6)',
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

        {status === 'verifying' ? (
          <div>
            <div
              style={{
                width: 44,
                height: 44,
                border: '3px solid rgba(230,218,202,0.2)',
                borderTopColor: '#E6DACA',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: '#E6DACA',
              }}
            >
              Confirmando correo electrónico...
            </h2>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : status === 'success' ? (
          <div>
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
              ¡Correo Confirmado con Éxito!
            </h2>

            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Tu cuenta ha sido validada en la plataforma TORREN. Ya puedes acceder a tus servicios y panel de soporte.
            </p>

            <Link
              to="/portal"
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
              <span>Acceder al Portal</span>
              <IconArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div>
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
              Error al Confirmar Correo
            </h2>

            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              {error}
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/login" className="btn-cta" style={{ textDecoration: 'none', padding: '10px 18px' }}>
                Iniciar Sesión
              </Link>
              <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', padding: '10px 18px' }}>
                Inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
