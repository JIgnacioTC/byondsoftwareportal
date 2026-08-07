import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const typeOptions = [
  { value: 'soporte', label: 'Soporte' },
  { value: 'bug', label: 'Bug' },
  { value: 'nuevo_desarrollo', label: 'Nuevo desarrollo' },
  { value: 'actualizacion', label: 'Actualización' },
];

const priorityOptions = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

export default function NewTicket() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState('soporte');
  const [prioridad, setPrioridad] = useState('media');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [alcance, setAlcance] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const showExtraFields = tipo === 'nuevo_desarrollo' || tipo === 'actualizacion';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) {
      setError('El título y la descripción son obligatorios');
      return;
    }

    let fullDescription = descripcion.trim();
    if (showExtraFields) {
      if (objetivo.trim()) fullDescription += `\n\n**Objetivo:**\n${objetivo.trim()}`;
      if (alcance.trim()) fullDescription += `\n\n**Alcance deseado:**\n${alcance.trim()}`;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.createTicket({
        tipo,
        prioridad,
        titulo: titulo.trim(),
        descripcion: fullDescription,
      });
      navigate('/portal/tickets');
    } catch (err) {
      setError(err.message || 'Error al crear el ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/portal/tickets')}>← Volver a tickets</button>
      <h1 style={styles.title}>Nuevo Ticket</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Tipo de ticket</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={styles.select}>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Prioridad</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} style={styles.select}>
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Describe brevemente el problema o solicitud"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalla el problema, pasos para reproducir, o lo que necesitas..."
            style={styles.textarea}
            rows={6}
          />
        </div>

        {showExtraFields && (
          <>
            <div style={styles.infoBox}>
              Este tipo de ticket requiere información adicional para su evaluación.
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Objetivo</label>
              <textarea
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="¿Qué se busca lograr con este desarrollo o actualización?"
                style={styles.textarea}
                rows={3}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Alcance deseado</label>
              <textarea
                value={alcance}
                onChange={(e) => setAlcance(e.target.value)}
                placeholder="Describe el alcance esperado, funcionalidades incluidas, restricciones..."
                style={styles.textarea}
                rows={3}
              />
            </div>
          </>
        )}

        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/portal/tickets')}
            style={styles.cancelBtn}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? 'Creando...' : 'Crear ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: { maxWidth: 700, margin: '0 auto' },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 24px' },
  form: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 14,
    border: '1px solid #fecaca',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#374151' },
  select: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    color: '#374151',
    background: '#fff',
    outline: 'none',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    color: '#111827',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.5,
  },
  infoBox: {
    background: '#eff6ff',
    color: '#1d4ed8',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid #bfdbfe',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: {
    background: '#fff',
    color: '#374151',
    padding: '10px 20px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitBtn: {
    background: '#2563eb',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
