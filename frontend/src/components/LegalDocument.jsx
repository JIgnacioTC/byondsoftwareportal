/**
 * Renders a legal document (Términos, Privacidad) whose body is a single
 * plain-text field edited from the admin panel — not a hardcoded JS array.
 * Convention, kept intentionally simple so a non-developer can edit it in a
 * plain textarea:
 *   "## Heading"   -> starts a new titled card
 *   "- item"       -> consecutive lines become a bullet list
 *   blank line     -> paragraph break
 *   anything else  -> paragraph text
 */
function parseLegalBody(body) {
  const lines = (body || '').split('\n');
  const sections = [];
  let current = null;
  let paragraphBuffer = [];
  let listBuffer = [];

  function flushParagraph() {
    if (paragraphBuffer.length) {
      current?.blocks.push({ type: 'text', value: paragraphBuffer.join(' ').trim() });
      paragraphBuffer = [];
    }
  }
  function flushList() {
    if (listBuffer.length) {
      current?.blocks.push({ type: 'list', items: listBuffer });
      listBuffer = [];
    }
  }
  function ensureCurrent() {
    if (!current) { current = { title: '', blocks: [] }; sections.push(current); }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      current = { title: line.slice(3).trim(), blocks: [] };
      sections.push(current);
    } else if (line.startsWith('- ')) {
      flushParagraph();
      ensureCurrent();
      listBuffer.push(line.slice(2).trim());
    } else if (line === '') {
      flushParagraph();
      flushList();
    } else {
      flushList();
      ensureCurrent();
      paragraphBuffer.push(line);
    }
  }
  flushParagraph();
  flushList();

  return sections.filter((s) => s.blocks.length > 0);
}

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

export function LegalHero({ title, lastUpdated }) {
  return (
    <section style={S.hero}>
      <div style={S.heroOverlay} />
      <div style={S.heroContent}>
        <h1 style={S.heroTitle}>{title}</h1>
        {lastUpdated && (
          <p style={{ fontSize: 14, color: '#C4B49F', letterSpacing: '0.05em' }}>
            Última actualización: {lastUpdated}
          </p>
        )}
      </div>
    </section>
  );
}

export function LegalBody({ intro, body, loading }) {
  const sections = parseLegalBody(body);
  return (
    <section className="section" style={{ background: '#0F1E2D' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {loading ? (
          <div style={S.card}>
            <p style={{ fontSize: 15, color: '#C4B49F' }}>Cargando…</p>
          </div>
        ) : (
          <>
            {intro && (
              <div style={S.card}>
                <p style={{ fontSize: 15, color: '#C4B49F', lineHeight: 1.8 }}>{intro}</p>
              </div>
            )}
            {sections.map((section, i) => (
              <div key={i} style={S.card}>
                {section.title && <h2 style={S.sectionTitle}>{section.title}</h2>}
                {section.blocks.map((block, j) => {
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
          </>
        )}
      </div>
    </section>
  );
}
