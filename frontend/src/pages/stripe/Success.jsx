import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { IconCheck, IconBox, IconClock, IconBuilding, IconMail, IconArrowRight } from '../../components/Icons';
import TorrenLogo from '../../components/TorrenLogo';

export default function StripeSuccess() {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      fetch(`/api/stripe/verify-session/${sessionId}`)
        .then(async (r) => {
          const res = await r.json();
          if (!r.ok) throw new Error(res.error || 'Error al verificar sesión');
          return res;
        })
        .then((result) => {
          setData(result);
          setVerifying(false);
        })
        .catch((err) => {
          console.error('Error verifying session:', err);
          setError(err.message);
          setVerifying(false);
        });
    } else {
      setData({
        success: true,
        status: 'paid',
        client: { companyName: 'Cliente TORREN', clientNumber: 'TRN-ACTIVO' },
        plan: { name: 'Suscripción Activa', monthlyHours: 10 },
      });
      setVerifying(false);
    }
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: '#E6DACA',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'rgba(26,46,68,0.75)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(196,180,159,0.18)',
          borderRadius: 24,
          padding: '44px 36px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(230,218,202,0.1)',
          textAlign: 'center',
        }}
      >
        {/* Brand Header */}
        <div style={{ marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <TorrenLogo variant="horizontal" theme="crema" height={26} />
          </Link>
        </div>

        {verifying ? (
          <div style={{ padding: '40px 0' }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: '3px solid rgba(230,218,202,0.2)',
                borderTopColor: '#E6DACA',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h3
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 18,
                letterSpacing: '0.05em',
                color: '#E6DACA',
              }}
            >
              Verificando y aprovisionando tu suscripción...
            </h3>
            <p style={{ color: '#C4B49F', fontSize: 14, marginTop: 8 }}>
              Asignando recursos, horas de desarrollo y credenciales de acceso.
            </p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 28,
              }}
            >
              ⚠️
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
              Atención en la Verificación
            </h2>
            <p style={{ color: '#C4B49F', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {error}. Tu pago puede estar en proceso de confirmación. Si el cargo fue realizado, tus recursos ya están siendo aprovisionados.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn-cta" style={{ textDecoration: 'none' }}>
                Ir al Portal de Cliente
              </Link>
              <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
                Volver al Inicio
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Success Badge */}
            <div
              style={{
                width: 68,
                height: 68,
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
              <IconCheck size={32} color="#E6DACA" />
            </div>

            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#E6DACA',
                marginBottom: 8,
              }}
            >
              ¡Suscripción Activada con Éxito!
            </h1>
            <p style={{ color: '#C4B49F', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Tu pago ha sido procesado correctamente. Hemos activado tu cuenta y asignado tus recursos de desarrollo.
            </p>

            {/* Summary Card */}
            <div
              style={{
                background: 'rgba(15,30,45,0.65)',
                border: '1px solid rgba(196,180,159,0.15)',
                borderRadius: 16,
                padding: '22px 24px',
                textAlign: 'left',
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 14,
                  borderBottom: '1px solid rgba(196,180,159,0.1)',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IconBox size={18} color="#C4B49F" />
                  <span style={{ fontSize: 13, color: '#C4B49F', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Plan Adquirido
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0F1E2D',
                    background: '#E6DACA',
                    padding: '4px 12px',
                    borderRadius: 8,
                    letterSpacing: '0.05em',
                  }}
                >
                  Plan {data?.plan?.name || 'Starter'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C4B49F', fontSize: 12 }}>
                    <IconClock size={14} color="#C4B49F" />
                    <span>Bolsa Mensual</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#E6DACA', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {data?.hoursAllocated || data?.plan?.monthlyHours || 10} Horas de Dev
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C4B49F', fontSize: 12 }}>
                    <IconBuilding size={14} color="#C4B49F" />
                    <span>Empresa</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#E6DACA' }}>
                    {data?.client?.companyName || 'URREA'}
                  </span>
                </div>

                {data?.user?.email && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C4B49F', fontSize: 12 }}>
                      <IconMail size={14} color="#C4B49F" />
                      <span>Usuario Asignado</span>
                    </div>
                    <span style={{ fontSize: 14, color: '#E6DACA', wordBreak: 'break-all' }}>
                      {data.user.email} {data.client?.clientNumber ? `(${data.client.clientNumber})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link
                to="/portal"
                className="btn-cta"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '14px 24px',
                  fontSize: 15,
                }}
              >
                <span>Acceder a mi Portal de Cliente</span>
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

            <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(196,180,159,0.7)', lineHeight: 1.5 }}>
              Si tienes preguntas o requieres asistencia con tu cuenta, nuestro equipo técnico está disponible 24/7.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
