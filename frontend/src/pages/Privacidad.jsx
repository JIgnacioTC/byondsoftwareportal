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
    fontSize: 'clamp(30px, 5vw, 52px)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    lineHeight: 1.1,
    color: '#E6DACA',
    marginBottom: 16,
  },
  card: {
    background: 'rgba(26,46,68,0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(196,180,159,0.15)',
    borderRadius: 20,
    padding: 48,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#E6DACA',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    color: '#C4B49F',
    lineHeight: 1.8,
    marginBottom: 16,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    fontSize: 15,
    color: '#C4B49F',
    lineHeight: 1.8,
    paddingLeft: 20,
    position: 'relative',
    marginBottom: 8,
  },
};

const sections = [
  {
    title: '1. Informacion que Recopilamos',
    content: [
      { type: 'text', value: 'En TORREN recopilamos unicamente la informacion necesaria para prestar nuestros servicios de manera eficiente y profesional. Los datos que podemos solicitar incluyen:' },
      { type: 'list', items: [
        'Nombre completo y datos de contacto (correo electronico, telefono).',
        'Nombre de la empresa u organizacion a la que pertenece.',
        'Informacion tecnica necesaria para la prestacion del servicio (accesos, especificaciones de proyectos).',
        'Datos de facturacion y pago, exclusivamente para procesar transacciones.',
      ]},
      { type: 'text', value: 'No recopilamos datos sensibles como informacion biometrica, creencias religiosas, opiniones politicas ni datos de salud.' },
    ],
  },
  {
    title: '2. Uso de la Informacion',
    content: [
      { type: 'text', value: 'La informacion recopilada se utiliza exclusivamente para los siguientes fines:' },
      { type: 'list', items: [
        'Prestacion y mejora de nuestros servicios de desarrollo de software, soporte tecnico y monitoreo.',
        'Comunicacion relacionada con proyectos, actualizaciones y soporte al cliente.',
        'Procesamiento de pagos y gestion de facturacion.',
        'Cumplimiento de obligaciones legales y contractuales.',
        'Envio de informacion relevante sobre nuestros servicios, previo consentimiento del titular.',
      ]},
    ],
  },
  {
    title: '3. Proteccion de Datos',
    content: [
      { type: 'text', value: 'Implementamos medidas de seguridad tecnicas, administrativas y fisicas apropiadas para proteger la informacion personal contra acceso no autorizado, alteracion, divulgacion o destruccion. Estas medidas incluyen:' },
      { type: 'list', items: [
        'Cifrado de datos en transito y en reposo.',
        'Controles de acceso basados en roles.',
        'Monitoreo y auditoria de accesos a sistemas.',
        'Copias de seguridad periodicas y procedimientos de recuperacion.',
        'Acuerdos de confidencialidad con todo el personal y colaboradores.',
      ]},
    ],
  },
  {
    title: '4. Cookies y Tecnologias de Rastreo',
    content: [
      { type: 'text', value: 'Nuestro portal puede utilizar cookies y tecnologias similares para mejorar la experiencia del usuario. Las cookies que utilizamos son:' },
      { type: 'list', items: [
        'Cookies esenciales: necesarias para el funcionamiento del portal y la autenticacion de sesiones.',
        'Cookies de rendimiento: nos permiten analizar el uso del portal para mejorar su funcionalidad.',
        'Cookies de preferencia: almacenan configuraciones del usuario para personalizar la experiencia.',
      ]},
      { type: 'text', value: 'El usuario puede configurar su navegador para rechazar cookies, aunque esto podria afectar la funcionalidad del portal.' },
    ],
  },
  {
    title: '5. Derechos ARCO',
    content: [
      { type: 'text', value: 'De conformidad con la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares, los titulares de los datos personales tienen derecho a:' },
      { type: 'list', items: [
        'Acceder: conocer que datos personales tenemos y como los utilizamos.',
        'Rectificar: solicitar la correccion de datos inexactos o incompletos.',
        'Cancelar: solicitar la eliminacion de sus datos cuando considere que no estan siendo utilizados conforme a los principios y deberes establecidos.',
        'Oponerse: oponerse al tratamiento de sus datos para fines especificos.',
      ]},
      { type: 'text', value: 'Para ejercer estos derechos, el titular debera presentar una solicitud a traves de los medios indicados en la seccion de Contacto de este aviso.' },
    ],
  },
  {
    title: '6. Contacto',
    content: [
      { type: 'text', value: 'Para cualquier consulta, queja o solicitud relacionada con la proteccion de datos personales, puede contactarnos a traves de:' },
      { type: 'list', items: [
        'Correo electronico: contacto@torren.dev',
        'Direccion: Ciudad de Mexico, Mexico',
      ]},
      { type: 'text', value: 'Nos comprometemos a responder a su solicitud en un plazo no mayor a 20 dias habiles, conforme a la legislacion vigente.' },
    ],
  },
];

export default function Privacidad() {
  return (
    <div>
      <Navbar />

      <section style={S.hero}>
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          <h1 style={S.heroTitle}>Aviso de Privacidad</h1>
          <p style={{
            fontSize: 14,
            color: '#C4B49F',
            letterSpacing: '0.05em',
          }}>
            Ultima actualizacion: Enero 2025
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#0F1E2D' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={S.card}>
            <p style={{ fontSize: 15, color: '#C4B49F', lineHeight: 1.8 }}>
              En TORREN, con domicilio en Ciudad de Mexico, Mexico, nos comprometemos a proteger la privacidad y los datos personales de nuestros clientes, usuarios y visitantes. El presente Aviso de Privacidad describe como recopilamos, utilizamos, almacenamos y protegemos su informacion personal, de conformidad con la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares.
            </p>
          </div>

          {sections.map((section, i) => (
            <div key={i} style={S.card}>
              <h2 style={S.sectionTitle}>{section.title}</h2>
              {section.content.map((block, j) => {
                if (block.type === 'text') {
                  return <p key={j} style={S.paragraph}>{block.value}</p>;
                }
                if (block.type === 'list') {
                  return (
                    <ul key={j} style={S.list}>
                      {block.items.map((item, k) => (
                        <li key={k} style={S.listItem}>
                          <span style={{ position: 'absolute', left: 0, top: 0, color: '#E6DACA' }}>-</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
