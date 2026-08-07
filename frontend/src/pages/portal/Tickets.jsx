import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    api.getClientTickets()
      .then(setTickets)
      .catch((err) => setError(err.message || 'Error al cargar tickets'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    if (filterStatus && t.estado !== filterStatus) return false;
    if (filterType && t.tipo !== filterType) return false;
    return true;
  });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mis Tickets</h1>
        <Link to="/portal/tickets/nuevo" style={styles.newBtn}>+ Nuevo Ticket</Link>
      </div>

      {/* Filtros */}
      <div style={styles.filters}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.select}
        >
          <option value="">Todos los estados</option>
          <option value="nuevo">Nuevo</option>
          <option value="en_analisis">En análisis</option>
          <option value="en_progreso">En progreso</option>
          <option value="esperando_cliente">Esperando cliente</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={styles.select}
        >
          <option value="">Todos los tipos</option>
          <option value="soporte">Soporte</option>
          <option value="bug">Bug</option>
          <option value="nuevo_desarrollo">Nuevo desarrollo</option>
          <option value="actualizacion">Actualización</option>
        </select>
      </div>

      {loading && <div style={styles.empty}>Cargando tickets...</div>}
      {error && <div style={{ ...styles.empty, color: '#dc2626' }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={styles.empty}>No se encontraron tickets</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={styles.list}>
          {filtered.map((t) => (
            <div
              key={t.id}
              style={styles.ticketCard}
              onClick={() => navigate(`/portal/tickets/${t.id}`)}
            >
              <div style={styles.ticketRow}>
                <span style={styles.folio}>#{t.folio}</span>
                <span style={{
                  ...styles.badge,
                  background: statusColors[t.estado]?.bg || '#f3f4f6',
                  color: statusColors[t.estado]?.text || '#6b7280',
                }}>
                  {statusColors[t.estado]?.label || t.estado}
                </span>
              </div>

              <h3 style={styles.ticketTitle}>{t.titulo}</h3>

              <div style={styles.ticketMeta}>
                <span style={styles.metaItem}>
                  {typeLabels[t.tipo] || t.tipo}
                </span>
                <span style={{
                  ...styles.priorityBadge,
                  background: priorityColors[t.prioridad]?.bg || '#f3f4f6',
                  color: priorityColors[t.prioridad]?.text || '#6b7280',
                }}>
                  {priorityColors[t.prioridad]?.label || t.prioridad}
                </span>
                <span style={styles.date}>{t.fecha_creacion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 960, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 },
  newBtn: {
    background: '#2563eb',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  filters: { display: 'flex', gap: 12, marginBottom: 20 },
  select: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    color: '#374151',
    background: '#fff',
    outline: 'none',
    minWidth: 160,
  },
  empty: { padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  ticketCard: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, border-color 0.15s',
  },
  ticketRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  folio: { fontSize: 13, fontWeight: 600, color: '#6b7280' },
  badge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12,
  },
  ticketTitle: { fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 10px' },
  ticketMeta: { display: 'flex', alignItems: 'center', gap: 12 },
  metaItem: { fontSize: 13, color: '#6b7280' },
  priorityBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 6,
  },
  date: { fontSize: 13, color: '#9ca3af', marginLeft: 'auto' },
};
