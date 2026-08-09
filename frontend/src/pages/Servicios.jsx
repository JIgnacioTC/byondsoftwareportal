import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function useInView(ref, threshold = 0.2) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function ServiceIcon({ name }) {
  const icons = {
    code: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    headset: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
    monitor: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    shield: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    lightbulb: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      </svg>
    ),
    arrows: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  };
  return icons[name] || icons.code;
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E6DACA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const iconMap = {
  code: 'code',
  headset: 'headset',
  monitor: 'monitor',
  shield: 'shield',
  lightbulb: 'lightbulb',
  arrows: 'arrows',
};

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
  serviceCard: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(196,180,159,0.15)',
    borderRadius: 20,
    padding: 48,
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
  processSteps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 32,
    position: 'relative',
  },
  processLine: {
    position: 'absolute',
    top: 40,
    left: '12.5%',
    right: '12.5%',
    height: 1,
    background: 'rgba(196,180,159,0.15)',
  },
};

const processSteps = [
  { num: '01', title: 'Descubrimiento', desc: 'Analizamos tu negocio, procesos y necesidades para definir la solución ideal.' },
  { num: '02', title: 'Desarrollo', desc: 'Construimos tu software con metodología ágil, entregas parciales y feedback constante.' },
  { num: '03', title: 'Implementación', desc: 'Desplegamos la solución, capacitamos a tu equipo y garantizamos una transición sin fricciones.' },
  { num: '04', title: 'Soporte', desc: 'Monitoreo continuo, soporte técnico y mejoras incrementales para evolucionar contigo.' },
];

export default function Servicios() {
  const [services, setServices] = useState([]);
  const svcRef = useRef(null);
  const procRef = useRef(null);
  const svcVisible = useInView(svcRef);
  const procVisible = useInView(procRef);

  useEffect(() => {
    fetch('/api/public/services').then(r => r.json()).then(setServices).catch(() => {});
  }, []);

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
            Nuestros Servicios
          </p>
          <h1 style={S.heroTitle}>
            Soluciones tecnológicas integrales
          </h1>
          <p style={S.heroSub}>
            Diseñamos, desarrollamos y mantenemos software a medida con los más altos estándares de calidad y soporte continuo.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#0F1E2D' }}>
        <div className="container">
          <div ref={svcRef} className="services-bento-grid" style={{
            opacity: svcVisible ? 1 : 0,
            transform: svcVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {services.map((svc, i) => (
              <div
                key={svc.id}
                style={S.serviceCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(230,218,202,0.25)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196,180,159,0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={S.iconBox}>
                    <ServiceIcon name={iconMap[svc.icon] || 'code'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <h3 style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#E6DACA',
                      marginBottom: 12,
                    }}>{svc.title}</h3>
                    <p style={{ fontSize: 15, color: '#C4B49F', lineHeight: 1.7, marginBottom: 24 }}>{svc.description}</p>
                    {svc.features && svc.features.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 24px' }}>
                        {svc.features.map((f, j) => (
                          <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 14, color: '#C4B49F' }}>
                            <IconCheck />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#1A2E44' }}>
        <div className="container">
          <div className="section-header">
            <h2>Nuestro Proceso</h2>
            <p>Un proceso claro y probado que garantiza resultados desde el primer día.</p>
            <div className="section-divider" />
          </div>
          <div ref={procRef} style={{
            ...S.processSteps,
            opacity: procVisible ? 1 : 0,
            transform: procVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} className="process-grid">
            <div style={S.processLine} className="process-line" />
            {processSteps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(26,46,68,0.8)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(230,218,202,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#E6DACA',
                  letterSpacing: '0.05em',
                }}>
                  {step.num}
                </div>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 12,
                }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#C4B49F', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#0F1E2D', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#E6DACA',
            marginBottom: 16,
          }}>
            ¿Necesitas una solución a medida?
          </h2>
          <p style={{ fontSize: 17, color: '#C4B49F', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Cuéntanos tu proyecto y te diseñaremos una propuesta técnica adaptada a tus necesidades.
          </p>
          <Link to="/contacto" className="btn-cta">
            Solicitar propuesta
          </Link>
        </div>
      </section>

      <Footer />

      <style>{`
        .services-bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        .services-bento-grid > div {
          grid-column: span 12;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 900px) {
          .services-bento-grid > div:nth-child(4n + 1),
          .services-bento-grid > div:nth-child(4n + 4) {
            grid-column: span 7;
          }
          .services-bento-grid > div:nth-child(4n + 2),
          .services-bento-grid > div:nth-child(4n + 3) {
            grid-column: span 5;
          }
        }
        @media (max-width: 768px) {
          .process-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .process-line { display: none !important; }
        }
        @media (max-width: 480px) {
          .process-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
