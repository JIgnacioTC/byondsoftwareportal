import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const S = {
  hero: {
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '120px 24px 60px',
    background: '#0F1E2D',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 30% 20%, rgba(26,46,68,0.6) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 900,
    textAlign: 'center',
  },
  heroTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(36px, 6vw, 64px)',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    lineHeight: 1.05,
    color: '#E6DACA',
    marginBottom: 16,
  },
  heroSub: {
    fontSize: 'clamp(15px, 2vw, 18px)',
    color: '#C4B49F',
    lineHeight: 1.7,
    maxWidth: 560,
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
    maxWidth: 1100,
    margin: '0 auto',
  },
  card: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(196,180,159,0.15)',
    borderRadius: 20,
    padding: 48,
  },
  label: {
    display: 'block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#C4B49F',
    marginBottom: 8,
  },
  input: {
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
    fontFamily: "'Inter', sans-serif",
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    paddingBottom: 28,
    marginBottom: 28,
    borderBottom: '1px solid rgba(196,180,159,0.08)',
  },
};

// Mirrors the real plan categories from the pricing section instead of a
// generic, disconnected list — picking one here routes the lead to the same
// language used on /#planes.
const serviceOptions = [
  'Hosting & Care',
  'TORREN Build (desarrollo)',
  'TORREN Accelerated (desarrollo con IA)',
  'Proyectos & MVP',
  'Solución Empresarial',
  'Otro / no estoy seguro',
];

const emptyForm = {
  nombre: '',
  empresa: '',
  email: '',
  telefono: '',
  servicio: '',
  mensaje: '',
};

export default function Contacto() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState({});

  useEffect(() => {
    fetch('/api/public/content')
      .then((r) => r.json())
      .then((data) => setContent(data?.contact || {}))
      .catch(() => {});
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.empresa || form.nombre,
          contactName: form.nombre,
          email: form.email,
          phone: form.telefono,
          service: form.servicio,
          message: form.mensaje,
          planSlug: 'consulta-general',
        }),
      });
      if (!res.ok) throw new Error('Error');
      setSuccess(true);
    } catch {
      setError('No se pudo enviar tu mensaje. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Navbar />

      <section style={S.hero}>
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          <h1 style={S.heroTitle}>Hablemos</h1>
          <p style={S.heroSub}>
            Cuéntanos sobre tu proyecto y te responderemos en menos de 24 horas.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#0F1E2D' }}>
        <div className="container">
          <div style={S.grid} className="contact-grid">
            <div style={S.card}>
              {success ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
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
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#E6DACA',
                    marginBottom: 12,
                  }}>Mensaje Enviado</h3>
                  <p style={{ color: '#C4B49F', lineHeight: 1.7, marginBottom: 32 }}>
                    Gracias por contactarnos. Nuestro equipo se pondra en contacto contigo pronto.
                  </p>
                  <button onClick={() => { setSuccess(false); setForm(emptyForm); }} className="btn-cta">
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#E6DACA',
                    marginBottom: 28,
                  }}>Formulario de Contacto</h3>

                  <label style={S.label}>Nombre completo</label>
                  <input
                    required
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    style={S.input}
                    placeholder="Tu nombre"
                  />

                  <label style={S.label}>Empresa</label>
                  <input
                    name="empresa"
                    value={form.empresa}
                    onChange={handleChange}
                    style={S.input}
                    placeholder="Nombre de tu empresa"
                  />

                  <label style={S.label}>Correo electronico</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    style={S.input}
                    placeholder="tu@empresa.com"
                  />

                  <label style={S.label}>Telefono</label>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    style={S.input}
                    placeholder="+52 XX XXXX XXXX"
                  />

                  <label style={S.label}>Servicio de interes</label>
                  <select
                    name="servicio"
                    value={form.servicio}
                    onChange={handleChange}
                    style={{
                      ...S.input,
                      appearance: 'none',
                      cursor: 'pointer',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23C4B49F' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px center',
                    }}
                  >
                    <option value="" style={{ background: '#1A2E44', color: '#C4B49F' }}>Selecciona un servicio</option>
                    {serviceOptions.map((opt, i) => (
                      <option key={i} value={opt} style={{ background: '#1A2E44', color: '#E6DACA' }}>{opt}</option>
                    ))}
                  </select>

                  <label style={S.label}>Mensaje</label>
                  <textarea
                    required
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    rows={5}
                    style={{ ...S.input, resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
                    placeholder="Cuentanos sobre tu proyecto o necesidad..."
                  />

                  {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

                  <button type="submit" disabled={submitting} className="btn-cta" style={{ width: '100%' }}>
                    {submitting ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              )}
            </div>

            <div style={S.card}>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#E6DACA',
                marginBottom: 32,
              }}>Informacion de Contacto</h3>

              <div style={S.infoItem}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(15,30,45,0.6)',
                  border: '1px solid rgba(196,180,159,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 4 12 13 2 4" />
                  </svg>
                </div>
                <div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#C4B49F',
                    display: 'block',
                    marginBottom: 6,
                  }}>Correo</span>
                  <span style={{ fontSize: 15, color: '#E6DACA' }}>{content.email || 'contacto@torren.dev'}</span>
                </div>
              </div>

              <div style={S.infoItem}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(15,30,45,0.6)',
                  border: '1px solid rgba(196,180,159,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#C4B49F',
                    display: 'block',
                    marginBottom: 6,
                  }}>Telefono</span>
                  <span style={{ fontSize: 15, color: '#E6DACA' }}>{content.phone || '+52 XX XXXX XXXX'}</span>
                </div>
              </div>

              <div style={S.infoItem}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(15,30,45,0.6)',
                  border: '1px solid rgba(196,180,159,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#C4B49F',
                    display: 'block',
                    marginBottom: 6,
                  }}>Ubicacion</span>
                  <span style={{ fontSize: 15, color: '#E6DACA' }}>{content.location || 'Ciudad de Mexico, Mexico'}</span>
                </div>
              </div>

              <div style={{ ...S.infoItem, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(15,30,45,0.6)',
                  border: '1px solid rgba(196,180,159,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#C4B49F',
                    display: 'block',
                    marginBottom: 6,
                  }}>Tiempo de respuesta</span>
                  <span style={{ fontSize: 15, color: '#E6DACA' }}>{content.response_time || 'Menos de 24 horas habiles'}</span>
                </div>
              </div>

              <div style={{
                marginTop: 36,
                padding: 28,
                borderRadius: 16,
                background: 'rgba(15,30,45,0.4)',
                border: '1px solid rgba(196,180,159,0.08)',
              }}>
                <p style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 8,
                }}>Horario de atencion</p>
                <p style={{ fontSize: 14, color: '#C4B49F', lineHeight: 1.6 }}>
                  {content.hours_weekday || 'Lunes a Viernes: 9:00 - 18:00 (CST)'}<br />
                  {content.hours_emergency || 'Soporte de emergencia: 24/7'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
