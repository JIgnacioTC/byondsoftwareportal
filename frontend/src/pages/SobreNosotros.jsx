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

function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const visible = useInView(ref, 0.3);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const end = value;
    const duration = 1800;
    const step = (ts) => {
      const progress = Math.min(ts / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, value]);

  return <span ref={ref}>{display.toLocaleString('es-MX')}{suffix}</span>;
}

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
  timeline: {
    position: 'relative',
    paddingLeft: 48,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 0,
    bottom: 0,
    width: 1,
    background: 'rgba(196,180,159,0.15)',
  },
  timelineDot: {
    position: 'absolute',
    left: -41,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#E6DACA',
    border: '2px solid #0F1E2D',
  },
  statsBar: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderTop: '1px solid rgba(196,180,159,0.08)',
    borderBottom: '1px solid rgba(196,180,159,0.08)',
  },
  statsGrid: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 0,
  },
  statItem: {
    padding: '48px 24px',
    textAlign: 'center',
    borderRight: '1px solid rgba(196,180,159,0.08)',
  },
  statNum: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(32px, 4vw, 48px)',
    fontWeight: 700,
    color: '#E6DACA',
    letterSpacing: '0.02em',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#C4B49F',
  },
  valueCard: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(196,180,159,0.15)',
    borderRadius: 20,
    padding: 40,
    flex: 1,
    minWidth: 280,
  },
};

const timelineItems = [
  { year: '2018', title: 'Fundación', desc: 'Nacimos con la visión de ofrecer desarrollo de software a medida con estándares de calidad internacionales desde Ciudad de México.' },
  { year: '2019', title: 'Primeros Clientes Enterprise', desc: 'Consolidamos relaciones con empresas medianas y grandes, estableciendo procesos ágiles y soporte dedicado.' },
  { year: '2021', title: 'Expansión de Servicios', desc: 'Ampliamos nuestro portafolio con servicios de monitoreo 24/7, respaldos automáticos y soporte técnico especializado.' },
  { year: '2023', title: 'Modelo por Horas', desc: 'Implementamos nuestro modelo de consumo por horas, dando a los clientes total transparencia y flexibilidad en sus proyectos.' },
  { year: '2025', title: 'Crecimiento Sostenido', desc: 'Más de 40 clientes activos, cientos de tickets resueltos y miles de horas de desarrollo gestionadas con excelencia.' },
];

const values = [
  { title: 'Misión', desc: 'Empoderar a las empresas con soluciones tecnológicas personalizadas que optimicen sus procesos, incrementen su productividad y les permitan crecer con confianza en un entorno digital.' },
  { title: 'Visión', desc: 'Ser el socio tecnológico de referencia en México y Latinoamérica, reconocido por nuestra excelencia técnica, transparencia operativa y compromiso con el éxito de cada cliente.' },
  { title: 'Valores', desc: 'Transparencia total, excelencia técnica, compromiso con el cliente, mejora continua, trabajo colaborativo y responsabilidad en cada línea de código que escribimos.' },
];

export default function SobreNosotros() {
  const [stats, setStats] = useState(null);
  const histRef = useRef(null);
  const valsRef = useRef(null);
  const histVisible = useInView(histRef);
  const valsVisible = useInView(valsRef);

  useEffect(() => {
    fetch('/api/public/stats').then(r => r.json()).then(setStats).catch(() => {});
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
            Sobre Nosotros
          </p>
          <h1 style={S.heroTitle}>
            Construimos software, no solo código
          </h1>
          <p style={S.heroSub}>
            Somos un equipo de ingenieros, diseñadores y estrategas tecnológicos comprometidos con transformar ideas en soluciones digitales que generan resultados reales.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#0F1E2D' }}>
        <div className="container">
          <div className="section-header">
            <h2>Nuestra Historia</h2>
            <p>Más de siete años construyendo soluciones tecnológicas de alto impacto.</p>
            <div className="section-divider" />
          </div>
          <div ref={histRef} style={{
            maxWidth: 700,
            margin: '0 auto',
            opacity: histVisible ? 1 : 0,
            transform: histVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={S.timeline}>
              <div style={S.timelineLine} />
              {timelineItems.map((item, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: i < timelineItems.length - 1 ? 40 : 0 }}>
                  <div style={S.timelineDot} />
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#E6DACA',
                    display: 'block',
                    marginBottom: 8,
                  }}>{item.year}</span>
                  <h3 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#E6DACA',
                    marginBottom: 8,
                  }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: '#C4B49F', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#1A2E44' }}>
        <div className="container">
          <div className="section-header">
            <h2>Misión, Visión y Valores</h2>
            <p>Los principios que guían cada decisión que tomamos.</p>
            <div className="section-divider" />
          </div>
          <div ref={valsRef} style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            opacity: valsVisible ? 1 : 0,
            transform: valsVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {values.map((v, i) => (
              <div key={i} style={S.valueCard}>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 16,
                }}>{v.title}</h3>
                <p style={{ fontSize: 15, color: '#C4B49F', lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={S.statsBar}>
        <div style={S.statsGrid} className="stats-grid">
          <div style={{ ...S.statItem, borderRight: '1px solid rgba(196,180,159,0.08)' }}>
            <div style={S.statNum}>
              <AnimatedNumber value={stats?.activeClients || 0} suffix="+" />
            </div>
            <div style={S.statLabel}>Clientes Activos</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statNum}>
              <AnimatedNumber value={stats?.resolvedTickets || 0} suffix="+" />
            </div>
            <div style={S.statLabel}>Tickets Resueltos</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statNum}>
              <AnimatedNumber value={stats?.totalHoursManaged || 0} suffix="h" />
            </div>
            <div style={S.statLabel}>Horas Gestionadas</div>
          </div>
          <div style={{ ...S.statItem, borderRight: 'none' }}>
            <div style={S.statNum}>
              <AnimatedNumber value={stats?.yearsExperience || 0} suffix="+" />
            </div>
            <div style={S.statLabel}>Años de Experiencia</div>
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
            ¿Listo para conocernos?
          </h2>
          <p style={{ fontSize: 17, color: '#C4B49F', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Agenda una llamada y descubre cómo podemos convertirnos en tu equipo tecnológico de confianza.
          </p>
          <Link to="/contacto" className="btn-cta">
            Hablemos
          </Link>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid > div { border-right: none !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
