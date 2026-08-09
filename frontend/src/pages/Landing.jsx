import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight, IconCheck, ServiceIcon } from '../components/Icons';

function formatMXN(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);
}

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
  /* Hero */
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '120px 24px 80px',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 30% 20%, rgba(26,46,68,0.6) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(26,46,68,0.4) 0%, transparent 50%)',
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
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    lineHeight: 1.05,
    color: '#E6DACA',
    marginBottom: 24,
  },
  heroSub: {
    fontSize: 'clamp(16px, 2vw, 19px)',
    color: '#C4B49F',
    lineHeight: 1.7,
    maxWidth: 640,
    margin: '0 auto 48px',
  },
  heroCtas: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  heroDecor: {
    position: 'absolute',
    top: '15%',
    right: '-5%',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(230,218,202,0.03) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  /* Stats */
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

  /* Services */
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 24,
  },
  serviceCard: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(196,180,159,0.12)',
    borderRadius: 20,
    padding: 40,
    transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
  },

  /* Process */
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

  /* Pricing */
  pricingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  priceCard: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(196,180,159,0.12)',
    borderRadius: 20,
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
  },
  priceCardFeatured: {
    background: 'rgba(26,46,68,0.6)',
    border: '1px solid rgba(230,218,202,0.25)',
    transform: 'scale(1.03)',
  },

  /* CTA */
  ctaSection: {
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
};

function renderServiceIcon(iconName) {
  return <ServiceIcon name={iconName} size={32} color="#E6DACA" />;
}

import Navbar from '../components/Navbar';

export default function Landing() {
  const [plans, setPlans] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [content, setContent] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({ company: '', contact: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activePlanTab, setActivePlanTab] = useState('care'); // 'care', 'build', 'accelerated', 'project', 'custom'

  const servicesRef = useRef(null);
  const processRef = useRef(null);
  const whyRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);

  const servicesVisible = useInView(servicesRef);
  const processVisible = useInView(processRef);
  const whyVisible = useInView(whyRef);
  const pricingVisible = useInView(pricingRef);
  const ctaVisible = useInView(ctaRef);

  useEffect(() => {
    fetch('/api/public/plans').then(r => r.json()).then(setPlans).catch(() => {});
    fetch('/api/public/services').then(r => r.json()).then(setServices).catch(() => {});
    fetch('/api/public/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/public/content').then(r => r.json()).then(setContent).catch(() => {});
  }, []);

  function openModal(plan) {
    setSelectedPlan(plan);
    setModalOpen(true);
    setSuccess(false);
    setError('');
  }

  function closeModal() {
    setModalOpen(false);
    setForm({ company: '', contact: '', email: '' });
    setSuccess(false);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (selectedPlan?.billing_type === 'quote') {
        const res = await fetch('/api/public/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: selectedPlan?.slug,
            email: form.email,
            companyName: form.company,
            contactName: form.contact,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        setSuccess(true);
      } else {
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planSlug: selectedPlan?.slug,
            email: form.email,
            companyName: form.company,
            contactName: form.contact,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setSuccess(true);
      }
    } catch {
      setError('No se pudo procesar. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const heroLabel = content.hero?.label || 'Desarrollo de Software a Medida';
  const heroHeading = content.hero?.heading || 'Software que impulsa tu negocio';
  const heroSubtitle = content.hero?.subtitle || 'Creamos soluciones tecnologicas personalizadas, soporte tecnico especializado, monitoreo 24/7 y respaldos automaticos para empresas que exigen excelencia.';
  const heroCtaPrimary = content.hero?.cta_primary || 'Ver planes';
  const heroCtaSecondary = content.hero?.cta_secondary || 'Contactar';

  const whyHeading = content.why?.heading || '¿Por Que TORREN?';
  const whySubtitle = content.why?.subtitle || 'No somos proveedores. Somos tu equipo tecnologico de confianza.';
  const whyItems = [1, 2, 3, 4].map(i => ({
    title: content.why?.[`item_0${i}_title`] || '',
    desc: content.why?.[`item_0${i}_desc`] || '',
  })).filter(item => item.title);

  const processHeading = content.process?.heading || 'Como Trabajamos';
  const processSubtitle = content.process?.subtitle || 'Un proceso claro y probado que garantiza resultados desde el primer dia.';
  const processSteps = [1, 2, 3, 4].map(i => ({
    num: content.process?.[`step_0${i}_num`] || `0${i}`,
    title: content.process?.[`step_0${i}_title`] || '',
    desc: content.process?.[`step_0${i}_desc`] || '',
  })).filter(step => step.title);

  const servicesHeading = content.services?.heading || 'Nuestros Servicios';
  const servicesSubtitle = content.services?.subtitle || 'Soluciones tecnologicas integrales disenadas para empresas que buscan crecer con confianza.';

  const pricingHeading = content.pricing?.heading || 'Planes';
  const pricingSubtitle = content.pricing?.subtitle || 'Elige el plan que mejor se adapte a las necesidades de tu empresa.';

  const ctaHeading = content.cta?.heading || '¿Listo para transformar tu software?';
  const ctaSubtitle = content.cta?.subtitle || 'Agenda una consulta gratuita y descubre como podemos ayudar a tu empresa a crecer con tecnologia.';
  const ctaPrimary = content.cta?.cta_primary || 'Agendar consulta';
  const ctaSecondary = content.cta?.cta_secondary || 'Ver planes';

  return (
    <div>
      <Navbar />
      {/* ============ HERO ============ */}
      <section style={S.hero}>
        <div style={S.heroOverlay} />
        <div style={S.heroDecor} />
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
            {heroLabel}
          </p>
          <h1 style={S.heroTitle}>
            {heroHeading}
          </h1>
          <p style={S.heroSub}>
            {heroSubtitle}
          </p>
          <div style={S.heroCtas}>
            <a href="#planes" className="btn-cta">
              {heroCtaPrimary}
              <IconArrowRight size={18} />
            </a>
            <Link to="/contacto" className="btn-secondary">
              {heroCtaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ STATS BAR ============ */}
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

      {/* ============ SERVICES ============ */}
      <section ref={servicesRef} className="section" style={{ background: '#0F1E2D' }}>
        <div className="container">
          <div className="section-header">
            <h2>{servicesHeading}</h2>
            <p>{servicesSubtitle}</p>
            <div className="section-divider" />
          </div>
          <div style={{
            ...S.servicesGrid,
            opacity: servicesVisible ? 1 : 0,
            transform: servicesVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {services.map((svc, i) => (
              <div
                key={svc.id}
                style={{
                  ...S.serviceCard,
                  transitionDelay: `${i * 0.1}s`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(230,218,202,0.25)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196,180,159,0.12)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  {renderServiceIcon(svc.icon)}
                </div>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 8,
                }}>{svc.title}</h3>
                <p style={{ fontSize: 13, color: '#C4B49F', marginBottom: 16, lineHeight: 1.6 }}>{svc.description}</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {svc.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: '#C4B49F' }}>
                      <IconCheck size={14} color="#E6DACA" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section ref={processRef} className="section" style={{ background: '#1A2E44' }}>
        <div className="container">
          <div className="section-header">
            <h2>{processHeading}</h2>
            <p>{processSubtitle}</p>
            <div className="section-divider" />
          </div>
          <div style={{
            ...S.processSteps,
            opacity: processVisible ? 1 : 0,
            transform: processVisible ? 'translateY(0)' : 'translateY(30px)',
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

      {/* ============ WHY TORREN ============ */}
      <section ref={whyRef} className="section" style={{ background: '#0F1E2D' }}>
        <div className="container">
          <div className="section-header">
            <h2>{whyHeading}</h2>
            <p>{whySubtitle}</p>
            <div className="section-divider" />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            opacity: whyVisible ? 1 : 0,
            transform: whyVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {whyItems.map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(26,46,68,0.4)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(196,180,159,0.1)',
                  borderRadius: 20,
                  padding: 36,
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
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 12,
                }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#C4B49F', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section ref={pricingRef} id="planes" className="section" style={{ background: '#1A2E44' }}>
        <div className="container">
          <div className="section-header">
            <h2>{pricingHeading}</h2>
            <p>{pricingSubtitle}</p>
            <div className="section-divider" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
            {[
              { id: 'care', label: 'Hosting & Care' },
              { id: 'build', label: 'TORREN Build' },
              { id: 'accelerated', label: 'TORREN Accelerated' },
              { id: 'project', label: 'Proyectos & MVP' },
              { id: 'custom', label: 'Empresarial' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePlanTab(tab.id)}
                style={{
                  padding: '10px 24px',
                  background: activePlanTab === tab.id ? '#E6DACA' : 'rgba(26,46,68,0.5)',
                  color: activePlanTab === tab.id ? '#0F1E2D' : '#E6DACA',
                  border: '1px solid rgba(196,180,159,0.2)',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  fontSize: 14,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{
            ...S.pricingGrid,
            opacity: pricingVisible ? 1 : 0,
            transform: pricingVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {plans.filter(p => p.plan_family === activePlanTab).map((plan, i) => {
              const isFeatured = plan.slug.includes('growth') || plan.slug.includes('standard');
              const isQuote = plan.billing_type === 'quote';
              const isMonthly = plan.billing_type === 'monthly';
              const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || [];
              
              return (
                <div
                  key={plan.id}
                  style={{
                    ...S.priceCard,
                    ...(isFeatured ? S.priceCardFeatured : {}),
                    transitionDelay: `${i * 0.1}s`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isFeatured) e.currentTarget.style.borderColor = 'rgba(230,218,202,0.2)';
                    e.currentTarget.style.transform = isFeatured ? 'scale(1.05)' : 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isFeatured) e.currentTarget.style.borderColor = 'rgba(196,180,159,0.12)';
                    e.currentTarget.style.transform = isFeatured ? 'scale(1.03)' : 'translateY(0)';
                  }}
                >
                  {isFeatured && (
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: '#0F1E2D',
                      background: '#E6DACA',
                      padding: '6px 16px',
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                      marginBottom: 20,
                    }}>
                      Recomendado
                    </div>
                  )}
                  <h3 style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#E6DACA',
                    marginBottom: 8,
                  }}>{plan.name}</h3>
                  <div style={{ marginBottom: 8 }}>
                    {isQuote ? (
                      <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#E6DACA',
                      }}>Cotización a la medida</span>
                    ) : (
                      <>
                        <span style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 40,
                          fontWeight: 700,
                          color: '#E6DACA',
                        }}>{formatMXN(plan.base_price)}</span>
                        {isMonthly && <span style={{ fontSize: 14, color: '#C4B49F' }}>/mes</span>}
                      </>
                    )}
                  </div>
                  {plan.dev_hours_monthly > 0 && (
                    <p style={{ fontSize: 14, color: '#C4B49F', marginBottom: 24 }}>
                      {plan.dev_hours_monthly} horas de desarrollo al mes
                    </p>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32, flex: 1, marginTop: plan.dev_hours_monthly > 0 ? 0 : 24 }}>
                    {features.map((f, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', fontSize: 14, color: '#C4B49F', borderBottom: j < features.length - 1 ? '1px solid rgba(196,180,159,0.08)' : 'none' }}>
                        <IconCheck size={16} color="#E6DACA" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => openModal(plan)}
                    className={isFeatured ? 'btn-cta' : 'btn-secondary'}
                    style={{ width: '100%' }}
                  >
                    {isQuote ? 'Agendar Llamada' : 'Contratar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section ref={ctaRef} className="section" style={{ ...S.ctaSection, background: '#0F1E2D' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(26,46,68,0.6) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{
          position: 'relative',
          zIndex: 1,
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#E6DACA',
            marginBottom: 16,
          }}>
            {ctaHeading}
          </h2>
          <p style={{ fontSize: 17, color: '#C4B49F', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            {ctaSubtitle}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contacto" className="btn-cta">
              {ctaPrimary}
              <IconArrowRight size={18} />
            </Link>
            <a href="#planes" className="btn-secondary">
              {ctaSecondary}
            </a>
          </div>
        </div>
      </section>

      {/* ============ MODAL ============ */}
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
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'rgba(26,46,68,0.9)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(196,180,159,0.15)',
            borderRadius: 20,
            padding: 48,
            maxWidth: 480,
            width: '100%',
          }}>
            {success ? (
              <div style={{ textAlign: 'center' }}>
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
                  <IconCheck size={28} color="#E6DACA" />
                </div>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 12,
                }}>Solicitud Enviada</h3>
                <p style={{ color: '#C4B49F', marginBottom: 32, lineHeight: 1.6 }}>
                  Nos pondremos en contacto contigo pronto para activar tu cuenta.
                </p>
                <button onClick={closeModal} className="btn-cta" style={{ width: '100%' }}>Cerrar</button>
              </div>
            ) : (
              <>
                <h3 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#E6DACA',
                  marginBottom: 8,
                }}>{selectedPlan?.billing_type === 'quote' ? 'Agendar Llamada' : 'Contratar Plan'}</h3>
                <p style={{ color: '#C4B49F', fontSize: 14, marginBottom: 32 }}>
                  Plan seleccionado: <strong style={{ color: '#E6DACA' }}>{selectedPlan?.name}</strong> 
                  {selectedPlan?.billing_type !== 'quote' && ` — ${formatMXN(selectedPlan?.base_price)}${selectedPlan?.billing_type === 'monthly' ? '/mes' : ''}`}
                </p>
                <form onSubmit={handleSubmit}>
                  <label style={labelStyle}>Empresa</label>
                  <input
                    required
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    style={inputStyle}
                    placeholder="Nombre de tu empresa"
                  />
                  <label style={labelStyle}>Nombre de contacto</label>
                  <input
                    required
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    style={inputStyle}
                    placeholder="Tu nombre completo"
                  />
                  <label style={labelStyle}>Correo electronico</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    placeholder="tu@empresa.com"
                  />
                  {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}
                  {selectedPlan?.billing_type !== 'quote' && (
                    <p style={{ fontSize: 12, color: '#C4B49F', marginBottom: 16, lineHeight: 1.5 }}>
                      Seras redirigido a Stripe para completar el pago de forma segura.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" onClick={closeModal} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                    <button type="submit" disabled={submitting} className="btn-cta" style={{ flex: 1 }}>
                      {submitting ? 'Procesando...' : (selectedPlan?.billing_type === 'quote' ? 'Enviar Solicitud' : 'Ir a pagar')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid > div { border-right: none !important; }
          .process-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .process-line { display: none !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .process-grid { grid-template-columns: 1fr !important; }
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
