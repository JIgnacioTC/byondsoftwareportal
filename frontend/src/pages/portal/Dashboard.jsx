import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

const statusColors = {
  nuevo: { bg: '#dbeafe', text: '#1d4ed8', label: 'Nuevo' },
  en_analisis: { bg: '#fef9c3', text: '#a16207', label: 'En análisis' },
  en_progreso: { bg: '#ffedd5', text: '#c2410c', label: 'En progreso' },
  esperando_cliente: { bg: '#f3e8ff', text: '#7c3aed', label: 'Esperando cliente' },
  resuelto: { bg: '#dcfce7', text: '#15803d', label: 'Resuelto' },
  cerrado: { bg: '#f3f4f6', text: '#6b7280', label: 'Cerrado' },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getClientDashboard()
      .then(setData)
      .catch((err) => setError(err.message || 'Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Cargando...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>{error}</div>;

  const sub = data?.subscription || {};
  const horas = data?.hours || {};
  const tickets = data?.openTickets || [];
  const movimientos = data?.recentMovements || [];

  const porcentaje = horas.allocated > 0
    ? Math.round((horas.consumed / horas.allocated) * 100)
    : 0;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Dashboard</h1>

      <div style={styles.grid}>
        {/* Plan actual */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Plan Actual</h3>
          <div style={styles.planName}>{sub.planName || 'Sin plan'}</div>
          <div style={styles.planPrice}>{sub.planPrice ? `$${Number(sub.planPrice).toLocaleString('es-MX')}` : '$0'}</div>
          <div style={styles.planDetail}>
            Próxima renovación: <strong>{sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX') : 'N/A'}</strong>
          </div>
        </div>

        {/* Consumo de horas */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Consumo de Horas</h3>
          <div style={styles.hoursGrid}>
            <div style={styles.hourItem}>
              <span style={styles.hourLabel}>Asignadas</span>
              <span style={styles.hourValue}>{horas.allocated || 0}</span>
            </div>
            <div style={styles.hourItem}>
              <span style={styles.hourLabel}>Consumidas</span>
              <span style={{ ...styles.hourValue, color: '#dc2626' }}>{horas.consumed || 0}</span>
            </div>
            <div style={styles.hourItem}>
              <span style={styles.hourLabel}>Disponibles</span>
              <span style={{ ...styles.hourValue, color: '#16a34a' }}>{horas.available || 0}</span>
            </div>
          </div>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${Math.min(porcentaje, 100)}%`,
              background: porcentaje > 90 ? '#dc2626' : porcentaje > 70 ? '#f59e0b' : '#2563eb',
            }} />
          </div>
          <div style={styles.progressLabel}>{porcentaje}% utilizado</div>
        </div>
      </div>

      {/* Tickets abiertos */}
      <div style={{ ...styles.card, marginTop: 24 }}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.cardTitle}>Tickets Abiertos</h3>
          <Link to="/portal/tickets" style={styles.viewAll}>Ver todos →</Link>
        </div>
        {tickets.length === 0 ? (
          <div style={styles.empty}>No hay tickets abiertos</div>
        ) : (
          <div style={styles.ticketList}>
            {tickets.map((t) => (
              <Link
                key={t.id}
                to={`/portal/tickets/${t.id}`}
                style={styles.ticketItem}
              >
                <div style={styles.ticketFolio}>#{t.folio}</div>
                <div style={styles.ticketTitle}>{t.title}</div>
                <span style={{
                  ...styles.badge,
                  background: statusColors[t.status]?.bg || '#f3f4f6',
                  color: statusColors[t.status]?.text || '#6b7280',
                }}>
                  {statusColors[t.status]?.label || t.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Movimientos recientes */}
      <div style={{ ...styles.card, marginTop: 24 }}>
        <h3 style={styles.cardTitle}>Movimientos Recientes de Horas</h3>
        {movimientos.length === 0 ? (
          <div style={styles.empty}>No hay movimientos recientes</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Tipo</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Horas</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, i) => (
                <tr key={i}>
                  <td style={styles.td}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString('es-MX') : '—'}</td>
                  <td style={styles.td}>{m.description}</td>
                  <td style={styles.td}>{m.type}</td>
                  <td style={{
                    ...styles.td,
                    textAlign: 'right',
                    color: m.type === 'consumption' ? '#dc2626' : '#16a34a',
                    fontWeight: 600,
                  }}>
                    {Number(m.hours) >= 0 ? '+' : ''}{Number(m.hours).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 960, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    padding: 24,
  },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 16px' },
  planName: { fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 },
  planPrice: { fontSize: 28, fontWeight: 700, color: '#2563eb', marginBottom: 8 },
  planDetail: { fontSize: 14, color: '#6b7280' },
  hoursGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 },
  hourItem: { textAlign: 'center' },
  hourLabel: { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  hourValue: { fontSize: 22, fontWeight: 700, color: '#111827' },
  progressBar: { height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s' },
  progressLabel: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAll: { fontSize: 14, color: '#2563eb', textDecoration: 'none', fontWeight: 500 },
  empty: { padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 },
  ticketList: { display: 'flex', flexDirection: 'column', gap: 8 },
  ticketItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#f9fafb',
    borderRadius: 8,
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 0.15s',
  },
  ticketFolio: { fontSize: 13, fontWeight: 600, color: '#6b7280', minWidth: 60 },
  ticketTitle: { flex: 1, fontSize: 14, color: '#111827', fontWeight: 500 },
  badge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 12,
    whiteSpace: 'nowrap',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: '10px 12px',
    borderBottom: '2px solid #e5e7eb',
  },
  td: {
    fontSize: 14,
    color: '#374151',
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
  },
};
