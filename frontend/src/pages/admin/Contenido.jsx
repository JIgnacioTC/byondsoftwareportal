import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Button, Card, Field, Input, Loading, PageHeader, Textarea,
} from '../../components/ui';

const SECTIONS = [
  {
    key: 'hero',
    label: 'Hero',
    description: 'Lo primero que ve un visitante al entrar al sitio.',
    fields: [
      { key: 'label', label: 'Etiqueta superior' },
      { key: 'heading', label: 'Título principal' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      { key: 'cta_primary', label: 'CTA primario' },
      { key: 'cta_secondary', label: 'CTA secundario' },
    ],
  },
  {
    key: 'process',
    label: 'Proceso',
    description: 'Los cuatro pasos de cómo trabajamos.',
    fields: [
      { key: 'heading', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
      ...[1, 2, 3, 4].flatMap((i) => [
        { key: `step_0${i}_num`, label: `Paso ${i} · Número`, group: `Paso ${i}` },
        { key: `step_0${i}_title`, label: `Paso ${i} · Título`, group: `Paso ${i}` },
        { key: `step_0${i}_desc`, label: `Paso ${i} · Descripción`, type: 'textarea', group: `Paso ${i}` },
      ]),
    ],
  },
  {
    key: 'why',
    label: 'Por qué TORREN',
    description: 'Diferenciadores frente a la competencia.',
    fields: [
      { key: 'heading', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
      ...[1, 2, 3, 4].flatMap((i) => [
        { key: `item_0${i}_title`, label: `Punto ${i} · Título`, group: `Punto ${i}` },
        { key: `item_0${i}_desc`, label: `Punto ${i} · Descripción`, type: 'textarea', group: `Punto ${i}` },
      ]),
    ],
  },
  {
    key: 'services',
    label: 'Servicios',
    description: 'Encabezado de la sección. Las tarjetas se editan en Servicios.',
    fields: [
      { key: 'heading', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
    ],
  },
  {
    key: 'pricing',
    label: 'Planes',
    description: 'Encabezado de la sección. Los planes se editan en Planes.',
    fields: [
      { key: 'heading', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
    ],
  },
  {
    key: 'cta',
    label: 'CTA final',
    description: 'Cierre de la página, antes del pie.',
    fields: [
      { key: 'heading', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      { key: 'cta_primary', label: 'CTA primario' },
      { key: 'cta_secondary', label: 'CTA secundario' },
    ],
  },
  {
    key: 'stats',
    label: 'Estadísticas',
    description: 'Cifras que se muestran junto al hero.',
    fields: [
      { key: 'years_experience', label: 'Años de experiencia' },
    ],
  },
];

export default function Contenido() {
  const [content, setContent] = useState({});
  const [baseline, setBaseline] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeKey, setActiveKey] = useState('hero');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminContent();
      const grouped = data?.grouped || {};
      setContent(grouped);
      setBaseline(grouped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const section = SECTIONS.find((s) => s.key === activeKey);
  const getValue = (key) => content[activeKey]?.[key] ?? '';
  const setValue = (key, value) => setContent((prev) => ({
    ...prev,
    [activeKey]: { ...(prev[activeKey] || {}), [key]: value },
  }));

  const isDirty = section?.fields.some((f) => (content[activeKey]?.[f.key] ?? '') !== (baseline[activeKey]?.[f.key] ?? ''));

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const items = section.fields.map((f) => ({ section: activeKey, key: f.key, value: getValue(f.key) }));
      await api.updateAdminContent(items);
      setBaseline((prev) => ({ ...prev, [activeKey]: { ...(content[activeKey] || {}) } }));
      setNotice({ tone: 'success', text: `Sección "${section.label}" publicada.` });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setContent((prev) => ({ ...prev, [activeKey]: { ...(baseline[activeKey] || {}) } }));
    setNotice(null);
  };

  if (loading) return <Loading label="Cargando contenido…" />;
  if (error) return <Alert tone="danger" title="No se pudo cargar el contenido">{error}</Alert>;

  return (
    <>
      <PageHeader
        title="Contenido de la landing"
        description="Los textos se publican en el sitio público en cuanto guardas la sección."
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="trn-grid" style={{ gridTemplateColumns: '220px minmax(0, 1fr)', alignItems: 'start' }}>
        <Card flush>
          <nav className="trn-sectionnav" aria-label="Secciones de la landing">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-current={activeKey === s.key}
                onClick={() => { setActiveKey(s.key); setNotice(null); }}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </Card>

        <Card
          title={section.label}
          subtitle={section.description}
          footer={
            <div className="trn-row" style={{ justifyContent: 'space-between' }}>
              <span className="trn-muted" style={{ fontSize: 12.5 }}>
                {isDirty ? 'Tienes cambios sin publicar en esta sección.' : 'Todo publicado.'}
              </span>
              <div className="trn-row">
                {isDirty && <Button variant="ghost" onClick={handleDiscard}>Descartar</Button>}
                <Button variant="primary" onClick={handleSave} disabled={saving || !isDirty}>
                  {saving ? 'Publicando…' : 'Publicar sección'}
                </Button>
              </div>
            </div>
          }
        >
          <div className="trn-stack">
            {section.fields.map((field, i) => {
              const prev = section.fields[i - 1];
              const showGroup = field.group && field.group !== prev?.group;
              return (
                <div key={field.key}>
                  {showGroup && (
                    <p className="trn-eyebrow" style={{ marginTop: i === 0 ? 0 : 10 }}>{field.group}</p>
                  )}
                  <Field label={field.label} htmlFor={`${activeKey}-${field.key}`}>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`${activeKey}-${field.key}`}
                        rows={3}
                        value={getValue(field.key)}
                        onChange={(e) => setValue(field.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={`${activeKey}-${field.key}`}
                        value={getValue(field.key)}
                        onChange={(e) => setValue(field.key, e.target.value)}
                      />
                    )}
                  </Field>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
