import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { IconCheck } from '../components/Icons';

function formatMXN(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Returns a callback ref (not a useRef object) on purpose: some callers attach
 * this to an element that only mounts after a loading state resolves (e.g. the
 * product grid, which is absent from the DOM while the skeleton is showing). A
 * plain useRef's identity never changes, so a useEffect keyed on it only ever
 * fires once at mount — before that later element exists — and the observer
 * would never be created. A callback ref re-fires this hook's effect exactly
 * when the node actually appears (or disappears) in the DOM.
 */
function useInView(threshold = 0.2) {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useCallback((el) => setNode(el), []);

  useEffect(() => {
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(node);
    return () => obs.disconnect();
  }, [node, threshold]);

  return [ref, visible];
}

function ProductIcon({ icon }) {
  const icons = {
    cart: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    'shopping-cart': (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    users: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    layers: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    box: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  };
  return icons[icon] || icons.box;
}

const benefits = [
  { title: 'Actualizaciones incluidas', desc: 'Tu software siempre al día sin costo adicional.' },
  { title: 'Soporte técnico', desc: 'Atención prioritaria por chat, correo y teléfono.' },
  { title: 'Cancela cuando quieras', desc: 'Sin contratos de permanencia ni penalizaciones.' },
  { title: 'Seguridad y respaldos', desc: 'Infraestructura segura con respaldos automáticos.' },
];

const S = {
  hero: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '120px 24px 80px',
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
    fontSize: 'clamp(30px, 5vw, 52px)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    lineHeight: 1.1,
    color: '#E6DACA',
    marginBottom: 24,
  },
  heroSub: {
    fontSize: 'clamp(15px, 2vw, 18px)',
    color: '#C4B49F',
    lineHeight: 1.7,
    maxWidth: 620,
    margin: '0 auto',
  },
  productCard: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    overflow: 'hidden',
    border: '1px solid rgba(196,180,159,0.15)',
    borderRadius: 20,
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'rgba(15,30,45,0.6)',
    border: '1px solid rgba(196,180,159,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  // Bleeds to the card's own edges (offsets the card's 40px padding) so the
  // product image reads as a photo/mockup banner, not a small inset icon.
  mediaBox: {
    margin: '-40px -40px 28px',
    height: 180,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    background: 'rgba(15,30,45,0.6)',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
};

export default function Productos() {
  const { user, client } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [authRequiredModalOpen, setAuthRequiredModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({ company: '', contact: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [gridRef, gridVisible] = useInView();
  const [trustRef, trustVisible] = useInView();

  useEffect(() => {
    api.getProducts()
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email: user.email || prev.email,
        contact: user.fullName || prev.contact,
        company: client?.company_name || prev.company,
      }));
    }
  }, [user, client]);

  function openModal(product) {
    setSelectedProduct(product);
    if (!user) {
      setAuthRequiredModalOpen(true);
      return;
    }
    setModalOpen(true);
    setError('');
  }

  function closeModal() {
    setModalOpen(false);
    setAuthRequiredModalOpen(false);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await api.createProductCheckout({
        productSlug: selectedProduct?.slug,
        email: form.email,
        companyName: form.company,
        contactName: form.contact,
      });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      setError('No se pudo procesar la solicitud. Intenta de nuevo.');
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
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#C4B49F',
            marginBottom: 24,
          }}>
            Productos Listos para Ti
          </p>
          <h1 style={S.heroTitle}>
            Software listo para rentar
          </h1>
          <p style={S.heroSub}>
            Soluciones de software preconfiguradas, listas para usar en tu empresa. Renta mensual sin costos de desarrollo ni sorpresas.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#0F1E2D' }}>
        <div className="container">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="plan-skeleton" style={{ ...S.productCard, animationDelay: `${i * 0.1}s` }} aria-hidden="true">
                  <div className="plan-skeleton-line" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 28 }} />
                  <div className="plan-skeleton-line" style={{ width: '60%', height: 18, marginBottom: 16 }} />
                  <div className="plan-skeleton-line" style={{ width: '40%', height: 32, marginBottom: 24 }} />
                  <div className="plan-skeleton-line" style={{ width: '90%', height: 12, marginBottom: 10 }} />
                  <div className="plan-skeleton-line" style={{ width: '80%', height: 12, marginBottom: 32 }} />
                  <div className="plan-skeleton-line" style={{ width: '100%', height: 44, marginTop: 'auto' }} />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 16, color: '#C4B49F' }}>Próximamente tendremos productos disponibles para ti.</p>
            </div>
          ) : (
            <div ref={gridRef} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
              opacity: gridVisible ? 1 : 0,
              transform: gridVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
            }}>
              {products.map((product, i) => {
                const features = Array.isArray(product.features) ? product.features : [];
                return (
                  <div
                    key={product.id}
                    style={{ ...S.productCard, transitionDelay: `${i * 0.1}s` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(230,218,202,0.25)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(196,180,159,0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {product.image_url ? (
                      <div style={S.mediaBox}>
                        <img src={product.image_url} alt="" style={S.mediaImg} />
                      </div>
                    ) : (
                      <div style={S.iconBox}>
                        <ProductIcon icon={product.icon} />
                      </div>
                    )}
                    <h3 style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#E6DACA',
                      marginBottom: 4,
                    }}>{product.name}</h3>
                    {product.tagline && (
                      <p style={{ fontSize: 13, color: '#C4B49F', marginBottom: 12, lineHeight: 1.5 }}>{product.tagline}</p>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 32,
                        fontWeight: 700,
                        color: '#E6DACA',
                      }}>{formatMXN(product.monthly_price)}</span>
                      <span style={{ fontSize: 14, color: '#C4B49F' }}>/mes</span>
                    </div>
                    {features.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24, flex: 1 }}>
                        {features.map((f, j) => (
                          <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', fontSize: 14, color: '#C4B49F', borderBottom: j < features.length - 1 ? '1px solid rgba(196,180,159,0.08)' : 'none' }}>
                            <IconCheck size={16} color="#E6DACA" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                      {product.demo_url ? (
                        <a
                          href={product.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ flex: 1, minWidth: 0, textAlign: 'center', textDecoration: 'none' }}
                        >
                          Ver demo
                        </a>
                      ) : (
                        <button
                          disabled
                          className="btn-secondary"
                          style={{ flex: 1, minWidth: 0, opacity: 0.5, cursor: 'not-allowed' }}
                        >
                          Demo próximamente
                        </button>
                      )}
                      <button
                        onClick={() => openModal(product)}
                        className="btn-cta"
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        Rentar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section ref={trustRef} className="section" style={{ background: '#1A2E44' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            opacity: trustVisible ? 1 : 0,
            transform: trustVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {benefits.map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(26,46,68,0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(196,180,159,0.1)',
                  borderRadius: 20,
                  padding: 36,
                  textAlign: 'center',
                  transition: 'all 0.4s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(230,218,202,0.2)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196,180,159,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 8,
                }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#C4B49F', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {modalOpen && (
        <div onClick={closeModal} style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,30,45,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(26,46,68,0.9)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(196,180,159,0.15)',
              borderRadius: 20,
              padding: 48,
              maxWidth: 480,
              width: '100%',
            }}
          >
            <h3 id="product-modal-title" style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#E6DACA',
              marginBottom: 8,
            }}>Rentar Producto</h3>
            <p style={{ color: '#C4B49F', fontSize: 14, marginBottom: 32 }}>
              Producto: <strong style={{ color: '#E6DACA' }}>{selectedProduct?.name}</strong> — {formatMXN(selectedProduct?.monthly_price)}/mes
            </p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="prod-company" style={labelStyle}>Empresa</label>
              <input
                id="prod-company"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                style={inputStyle}
                placeholder="Nombre de tu empresa"
              />
              <label htmlFor="prod-contact" style={labelStyle}>Nombre de contacto</label>
              <input
                id="prod-contact"
                required
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                style={inputStyle}
                placeholder="Tu nombre completo"
              />
              <label htmlFor="prod-email" style={labelStyle}>Correo electronico</label>
              <input
                id="prod-email"
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                placeholder="tu@empresa.com"
              />
              {error && <p role="alert" style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}
              <p style={{ fontSize: 12, color: '#C4B49F', marginBottom: 16, lineHeight: 1.5 }}>
                Seras redirigido a Stripe para completar el pago de forma segura.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeModal} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-cta" style={{ flex: 1 }}>
                  {submitting ? 'Procesando...' : 'Ir a pagar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {authRequiredModalOpen && (
        <div onClick={closeModal} style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,30,45,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-product-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(26,46,68,0.95)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(196,180,159,0.15)',
              borderRadius: 20,
              padding: 40,
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(230,218,202,0.1)',
              border: '1px solid rgba(230,218,202,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 24,
            }}>
              🔒
            </div>
            <h3 id="auth-product-modal-title" style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#E6DACA',
              marginBottom: 12,
            }}>
              Inicio de sesión requerido
            </h3>
            <p style={{ color: '#C4B49F', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Para rentar <strong style={{ color: '#E6DACA' }}>{selectedProduct?.name}</strong> debes tener una cuenta e iniciar sesión en nuestro portal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => navigate(`/login?mode=signup&product=${selectedProduct?.slug}`)}
                className="btn-cta"
                style={{ width: '100%' }}
              >
                Crear Cuenta Nueva
              </button>
              <button
                onClick={() => navigate(`/login?mode=login&product=${selectedProduct?.slug}`)}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                Ya tengo cuenta (Iniciar Sesión)
              </button>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C4B49F',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .plan-skeleton { display: flex; flex-direction: column; animation: plan-skeleton-fade 1.4s ease-in-out infinite; }
        .plan-skeleton-line { background: rgba(196,180,159,0.12); border-radius: 6px; }
        @keyframes plan-skeleton-fade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .plan-skeleton { animation: none; }
        }
      `}</style>
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
