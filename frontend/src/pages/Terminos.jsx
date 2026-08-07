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
    title: '1. Alcance del Servicio',
    content: [
      { type: 'text', value: 'TORREN ofrece servicios de desarrollo de software a medida, soporte tecnico, monitoreo de sistemas, respaldo de datos y consultoria tecnologica. Los presentes Terminos y Condiciones regulan el uso del portal y la contratacion de dichos servicios.' },
      { type: 'text', value: 'Al acceder a nuestro portal o contratar nuestros servicios, el usuario acepta quedar vinculado por estos terminos. Si no esta de acuerdo con alguno de ellos, le solicitamos abstenerse de utilizar nuestros servicios.' },
    ],
  },
  {
    title: '2. Uso del Portal',
    content: [
      { type: 'text', value: 'El portal de TORREN esta destinado exclusivamente a clientes registrados y usuarios autorizados. Al utilizar el portal, el usuario se compromete a:' },
      { type: 'list', items: [
        'Proporcionar informacion veraz, exacta y actualizada durante el registro y uso del portal.',
        'Mantener la confidencialidad de sus credenciales de acceso y no compartirlas con terceros.',
        'Utilizar el portal unicamente para los fines establecidos (gestion de tickets, monitoreo, consumo de horas).',
        'No intentar acceder a areas o funcionalidades para las cuales no tiene autorizacion.',
        'No utilizar el portal para actividades ilicitas, fraudulentas o que puedan comprometer la seguridad del sistema.',
      ]},
    ],
  },
  {
    title: '3. Propiedad Intelectual',
    content: [
      { type: 'text', value: 'Todo el contenido del portal, incluyendo pero no limitado a textos, graficos, logotipos, iconos, imagenes, clips de audio, descargas digitales y software, es propiedad exclusiva de TORREN o de sus proveedores de contenido y esta protegido por las leyes de propiedad intelectual aplicables.' },
      { type: 'text', value: 'El software desarrollado por TORREN para sus clientes sera propiedad del cliente una vez completado el pago total acordado, salvo que el contrato especifique lo contrario. TORREN se reserva el derecho de utilizar tecnicas, metodologias y conocimientos generales adquiridos durante el desarrollo de los proyectos.' },
    ],
  },
  {
    title: '4. Limitacion de Responsabilidad',
    content: [
      { type: 'text', value: 'TORREN se compromete a prestar sus servicios con la mayor diligencia y profesionalismo. Sin embargo:' },
      { type: 'list', items: [
        'No garantizamos que el portal estara disponible de manera ininterrumpida o libre de errores.',
        'No somos responsables por danos indirectos, incidentales, especiales o consecuentes que puedan derivarse del uso o la imposibilidad de uso de nuestros servicios.',
        'La responsabilidad total de TORREN frente al cliente, por cualquier causa, estara limitada al monto efectivamente pagado por el cliente durante los doce meses anteriores al evento que origine la reclamacion.',
        'No somos responsables por interrupciones en el servicio causadas por fuerza mayor, fallas en infraestructura de terceros o mantenimiento programado previamente comunicado.',
      ]},
    ],
  },
  {
    title: '5. Modificaciones',
    content: [
      { type: 'text', value: 'TORREN se reserva el derecho de modificar estos Terminos y Condiciones en cualquier momento. Las modificaciones seran publicadas en el portal y entraran en vigor a partir de su fecha de publicacion.' },
      { type: 'text', value: 'El uso continuado del portal despues de la publicacion de cambios constituye la aceptacion de los nuevos terminos. Recomendamos revisar esta pagina periodicamente para mantenerse informado de cualquier actualizacion.' },
      { type: 'text', value: 'Los contratos de servicios ya vigentes se regiran por los terminos vigentes al momento de su firma, salvo que ambas partes acuerden expresamente la aplicacion de los nuevos terminos.' },
    ],
  },
  {
    title: '6. Jurisdiccion',
    content: [
      { type: 'text', value: 'Los presentes Terminos y Condiciones se regiran e interpretaran de conformidad con las leyes de los Estados Unidos Mexicanos.' },
      { type: 'text', value: 'Para la interpretacion y cumplimiento de los presentes terminos, las partes se someten a la jurisdiccion de los tribunales competentes de la Ciudad de Mexico, Mexico, renunciando expresamente a cualquier otro fuero que pudiera corresponderles por razon de domicilio presente o futuro.' },
      { type: 'text', value: 'Cualquier disputa que surja en relacion con estos terminos sera resuelta preferentemente mediante negociacion directa entre las partes. En caso de no llegar a un acuerdo, se recurrira a los mecanismos de mediacion o arbitraje aplicables.' },
    ],
  },
];

export default function Terminos() {
  return (
    <div>
      <Navbar />

      <section style={S.hero}>
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          <h1 style={S.heroTitle}>Terminos y Condiciones</h1>
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
              El presente documento establece los Terminos y Condiciones que rigen el uso del portal y los servicios ofrecidos por TORREN. Al contratar nuestros servicios o utilizar nuestro portal, usted acepta estos terminos en su totalidad. Le recomendamos leer detenidamente este documento antes de continuar.
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
