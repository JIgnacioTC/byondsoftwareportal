import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const statusColors = {
  nuevo: { bg: '#dbeafe', text: '#1d4ed8', label: 'Nuevo' },
  en_analisis: { bg: '#fef9c3', text: '#a16207', label: 'En análisis' },
  en_progreso: { bg: '#ffedd5', text: '#c2410c', label: 'En progreso' },
  esperando_cliente: { bg: '#f3e8ff', text: '#7c3aed', label: 'Esperando cliente' },
  resuelto: { bg: '#dcfce7', text: '#15803d', label: 'Resuelto' },
  cerrado: { bg: '#f3f4f6', text: '#6b7280', label: 'Cerrado' },
};

const priorityColors = {
  baja: { bg: '#f3f4f6', text: '#6b7280', label: 'Baja' },
  media: { bg: '#dbeafe', text: '#1d4ed8', label: 'Media' },
  alta: { bg: '#ffedd5', text: '#c2410c', label: 'Alta' },
  critica: { bg: '#fef2f2', text: '#dc2626', label: 'Crítica' },
};

const typeLabels = {
  soporte: 'Soporte',
  bug: 'Bug',
  nuevo_desarrollo: 'Nuevo desarrollo',
  actualizacion: 'Actualización',
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTicket = () => {
    setLoading(true);
    api.getClientTicket(id)
      .then(setTicket)
      .catch((err) => setError(err.message || 'Error al cargar ticket'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await api.addClientComment(id, { texto: comment.trim() });
      setComment('');
      fetchTicket();
    } catch (err) {
      alert(err.message || 'Error al agregar comentario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateClientTicketStatus(id, { estado: newStatus });
      fetchTicket();
    } catch (err) {
      alert(err.message || 'Error al actualizar estado');
    }
  };

  if (loading) return <div style={styles.empty}>Cargando ticket...</div>;
  if (error) return <div style={{ ...styles.empty, color: '#dc2626' }}>{error}</div>;
  if (!ticket) return <div style={styles.empty}>Ticket no encontrado</div>;

  const publicComments = (ticket.comentarios || []).filter((c) => !c.interno);

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/portal/tickets')}>← Volver a tickets</button>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.folioRow}>
            <span style={styles.folio}>#{ticket.folio}</span>
            <span style={{
              ...styles.badge,
              background: statusColors[ticket.estado]?.bg,
              color: statusColors[ticket.estado]?.text,
            }}>
              {statusColors[ticket.estado]?.label || ticket.estado}
            </span>
            <span style={{
              ...styles.badge,
              background: priorityColors[ticket.prioridad]?.bg,
              color: priorityColors[ticket.prioridad]?.text,
            }}>
              {priorityColors[ticket.prioridad]?.label || ticket.prioridad}
            </span>
          </div>
          <h1 style={styles.title}>{ticket.titulo}</h1>
        </div>

        <div style={styles.metaGrid}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Tipo</span>
            <span style={styles.metaValue}>{typeLabels[ticket.tipo] || ticket.tipo}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Creado por</span>
            <span style={styles.metaValue}>{ticket.creado_por || 'N/A'}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Fecha</span>
            <span style={styles.metaValue}>{ticket.fecha_creacion}</span>
          </div>
        </div>
      </div>

      {/* Status actions */}
      {ticket.estado === 'resuelto' && (
        <button style={{ ...styles.actionBtn, background: '#6b7280' }} onClick={() => handleStatusChange('cerrado')}>
          Cerrar ticket
        </button>
      )}
      {ticket.estado === 'cerrado' && (
        <button style={{ ...styles.actionBtn, background: '#2563eb' }} onClick={() => handleStatusChange('nuevo')}>
          Reabrir ticket
        </button>
      )}

      {/* Descripción */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Descripción</h3>
        <div style={styles.description}>{ticket.descripcion || 'Sin descripción'}</div>
      </div>

      {/* Comentarios */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Comentarios ({publicComments.length})</h3>

        {publicComments.length === 0 && (
          <div style={styles.emptyComments}>No hay comentarios aún</div>
        )}

        <div style={styles.commentsList}>
          {publicComments.map((c, i) => (
            <div key={i} style={styles.comment}>
              <div style={styles.commentHeader}>
                <span style={styles.commentAuthor}>{c.autor || 'Usuario'}</span>
                <span style={styles.commentDate}>{c.fecha}</span>
              </div>
              <div style={styles.commentText}>{c.texto}</div>
            </div>
          ))}
        </div>

        {/* Formulario de comentario */}
        <form onSubmit={handleAddComment} style={styles.commentForm}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe un comentario..."
            style={styles.textarea}
            rows={3}
          />
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            style={{
              ...styles.submitBtn,
              opacity: submitting || !comment.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? 'Enviando...' : 'Enviar comentario'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 800, margin: '0 auto' },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 20,
  },
  header: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    padding: 24,
    marginBottom: 20,
  },
  folioRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  folio: { fontSize: 14, fontWeight: 600, color: '#6b7280' },
  badge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12,
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 16px' },
  metaGrid: { display: 'flex', gap: 32, flexWrap: 'wrap' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: { fontSize: 12, color: '#9ca3af', fontWeight: 500 },
  metaValue: { fontSize: 14, color: '#374151', fontWeight: 500 },
  actionBtn: {
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 20,
  },
  section: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 16px' },
  description: { fontSize: 15, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  emptyComments: { textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '16px 0' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  comment: {
    background: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    border: '1px solid #f3f4f6',
  },
  commentHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  commentAuthor: { fontSize: 14, fontWeight: 600, color: '#374151' },
  commentDate: { fontSize: 13, color: '#9ca3af' },
  commentText: { fontSize: 14, color: '#374151', lineHeight: 1.5 },
  commentForm: { display: 'flex', flexDirection: 'column', gap: 12 },
  textarea: {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.5,
  },
  submitBtn: {
    alignSelf: 'flex-end',
    background: '#2563eb',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: { padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 },
};
