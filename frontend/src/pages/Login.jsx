import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import TorrenLogo from '../components/TorrenLogo';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const planParam = searchParams.get('plan');

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup');
    } else if (searchParams.get('mode') === 'login') {
      setMode('login');
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await login(email, password);
        if (planParam) {
          navigate(`/?plan=${planParam}#planes`);
        } else if (data.user && (data.user.role === 'admin' || data.user.role === 'agent')) {
          navigate('/admin');
        } else {
          navigate('/portal');
        }
      } else {
        const data = await register(email, password, fullName, companyName);
        if (planParam) {
          navigate(`/?plan=${planParam}#planes`);
        } else if (data.user && (data.user.role === 'admin' || data.user.role === 'agent')) {
          navigate('/admin');
        } else {
          navigate('/portal');
        }
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(26,46,68,0.5)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(196,180,159,0.12)',
        borderRadius: 20,
        padding: '40px 36px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <TorrenLogo variant="full" theme="crema" height={22} subtitle={true} />
          </Link>
          <p style={{
            fontSize: 13,
            color: '#C4B49F',
            marginTop: 14,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.04em',
          }}>
            {planParam ? 'Inicia sesión o regístrate para contratar tu plan' : 'Portal de Clientes y Soporte'}
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15,30,45,0.6)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 28,
          border: '1px solid rgba(196,180,159,0.1)',
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 8,
              border: 'none',
              background: mode === 'login' ? '#E6DACA' : 'transparent',
              color: mode === 'login' ? '#0F1E2D' : '#C4B49F',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 8,
              border: 'none',
              background: mode === 'signup' ? '#E6DACA' : 'transparent',
              color: mode === 'signup' ? '#0F1E2D' : '#C4B49F',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Crear Cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={labelStyle}>Nombre completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                style={inputStyle}
              />

              <label style={labelStyle}>Nombre de tu empresa (opcional)</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej. Mi Empresa S.A."
                style={inputStyle}
              />
            </>
          )}

          <label style={labelStyle}>Correo electrónico *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            style={inputStyle}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Contraseña *</label>
            {mode === 'login' && (
              <Link
                to="/auth/forgot-password"
                style={{
                  fontSize: 12,
                  color: '#C4B49F',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#E6DACA')}
                onMouseLeave={(e) => (e.target.style.color = '#C4B49F')}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />

          {error && (
            <p style={{
              fontSize: 13,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 20,
            }}>
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
            }}
          >
            {loading ? 'Procesando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link to="/" style={{
            fontSize: 13,
            color: '#C4B49F',
            textDecoration: 'none',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.color = '#E6DACA'}
          onMouseLeave={(e) => e.target.style.color = '#C4B49F'}
          >
            ← Volver al inicio
          </Link>
        </div>
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
