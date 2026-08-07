import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const SECTIONS = [
  {
    key: 'hero',
    label: 'Hero',
    fields: [
      { key: 'label', label: 'Etiqueta superior', type: 'text' },
      { key: 'heading', label: 'Titulo principal', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'cta_primary', label: 'CTA primario', type: 'text' },
      { key: 'cta_secondary', label: 'CTA secundario', type: 'text' },
    ],
  },
  {
    key: 'process',
    label: 'Proceso',
    fields: [
      { key: 'heading', label: 'Titulo', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'text' },
      ...[1, 2, 3, 4].flatMap(i => [
        { key: `step_0${i}_num`, label: `Paso ${i} - Numero`, type: 'text' },
        { key: `step_0${i}_title`, label: `Paso ${i} - Titulo`, type: 'text' },
        { key: `step_0${i}_desc`, label: `Paso ${i} - Descripcion`, type: 'textarea' },
      ]),
    ],
  },
  {
    key: 'why',
    label: 'Por Que TORREN',
    fields: [
      { key: 'heading', label: 'Titulo', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'text' },
      ...[1, 2, 3, 4].flatMap(i => [
        { key: `item_0${i}_title`, label: `Item ${i} - Titulo`, type: 'text' },
        { key: `item_0${i}_desc`, label: `Item ${i} - Descripcion`, type: 'textarea' },
      ]),
    ],
  },
  {
    key: 'services',
    label: 'Servicios',
    fields: [
      { key: 'heading', label: 'Titulo', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'text' },
    ],
  },
  {
    key: 'pricing',
    label: 'Planes',
    fields: [
      { key: 'heading', label: 'Titulo', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'text' },
    ],
  },
  {
    key: 'cta',
    label: 'CTA Final',
    fields: [
      { key: 'heading', label: 'Titulo', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'cta_primary', label: 'CTA primario', type: 'text' },
      { key: 'cta_secondary', label: 'CTA secundario', type: 'text' },
    ],
  },
  {
    key: 'stats',
    label: 'Estadisticas',
    fields: [
      { key: 'years_experience', label: 'Anos de experiencia', type: 'text' },
    ],
  },
];

export default function Contenido() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [message, setMessage] = useState('');

  useEffect(() => { loadContent(); }, []);

  async function loadContent() {
    try {
      setLoading(true);
      const data = await api.getAdminContent();
      setContent(data.grouped || {});
    } catch (err) {
      alert('Error al cargar contenido: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function getValue(section, key) {
    return content[section]?.[key] || '';
  }

  function setValue(section, key, value) {
    setContent(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage('');
      const items = [];
      const currentSection = SECTIONS.find(s => s.key === activeSection);
      if (currentSection) {
        for (const field of currentSection.fields) {
          items.push({
            section: activeSection,
            key: field.key,
            value: getValue(activeSection, field.key),
          });
        }
      }
      await api.updateAdminContent(items);
      setMessage('Contenido guardado correctamente');
    } catch (err) {
      setMessage('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Cargando contenido...</div>;

  const currentSection = SECTIONS.find(s => s.key === activeSection);

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#111' }}>Editor de Contenido</h1>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: activeSection === s.key ? 600 : 400,
                  background: activeSection === s.key ? '#f0f7ff' : '#fff',
                  color: activeSection === s.key ? '#2563eb' : '#374151',
                  border: 'none',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  borderLeft: activeSection === s.key ? '3px solid #2563eb' : '3px solid transparent',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>{currentSection?.label}</h3>

          {message && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              background: message.includes('Error') ? '#fee2e2' : '#dcfce7',
              color: message.includes('Error') ? '#991b1b' : '#166534',
              fontSize: 13,
            }}>
              {message}
            </div>
          )}

          {currentSection?.fields.map(field => (
            <div key={field.key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={getValue(activeSection, field.key)}
                  onChange={(e) => setValue(activeSection, field.key, e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={getValue(activeSection, field.key)}
                  onChange={(e) => setValue(activeSection, field.key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
