import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const typeLabels = {
  soporte: 'Soporte',
  bug: 'Bug',
  nuevo_desarrollo: 'Nuevo Desarrollo',
  actualizacion: 'Actualización',
};

const statusLabels = {
  nuevo: 'Nuevo',
  en_analisis: 'En Análisis',
  en_progreso: 'En Progreso',
  esperando_cliente: 'Esperando Cliente',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

const priorityLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

const typeColors = {
  soporte: '#3b82f6',
  bug: '#ef4444',
  nuevo_desarrollo: '#10b981',
  actualizacion: '#8b5cf6',
};

const statusColors = {
  nuevo: '#3b82f6',
  en_analisis: '#f59e0b',
  en_progreso: '#f97316',
  esperando_cliente: '#a855f7',
  resuelto: '#10b981',
  cerrado: '#6b7280',
};

const priorityColors = {
  baja: '#6b7280',
  media: '#3b82f6',
  alta: '#f97316',
  critica: '#ef4444',
};

export default function AdminReports() {
  const [hoursData, setHoursData] = useState([]);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('');

  useEffect(() => {
    loadData();
  }, [filterPeriod]);

  async function loadData() {
    try {
      setLoading(true);
      const params = {};
      if (filterPeriod) params.period = filterPeriod;
      const [hours, tickets] = await Promise.all([
        api.getHoursReport(params),
        api.getTicketReports(),
      ]);
      setHoursData(hours);
      setTicketData(tickets);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ color: '#6b7280' }}>Cargando reportes...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Reportes</h2>
        <input
          type="month"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        />
      </div>

      {/* Hours Report */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Consumo de Horas por Cliente</h3>
        {hoursData.length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0 }}>No hay datos para el período seleccionado.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Cliente</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Período</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Tipo</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Horas</th>
                </tr>
              </thead>
              <tbody>
                {hoursData.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500 }}>{row.clientName}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, color: '#6b7280' }}>{row.period}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: row.type === 'consumption' ? '#fee2e2' : row.type === 'allocation' ? '#dcfce7' : '#ede9fe',
                        color: row.type === 'consumption' ? '#991b1b' : row.type === 'allocation' ? '#166534' : '#5b21b6',
                      }}>
                        {row.type === 'allocation' ? 'Asignación' : row.type === 'consumption' ? 'Consumo' : 'Ajuste'}
                      </span>
                    </td>
                    <td style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: Number(row.totalHours) >= 0 ? '#10b981' : '#ef4444',
                    }}>
                      {Number(row.totalHours).toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Reports */}
      {ticketData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {/* By Status */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Tickets por Estado</h3>
            {ticketData.byStatus.map((item) => (
              <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColors[item.status] || '#6b7280' }} />
                  <span style={{ fontSize: 14 }}>{statusLabels[item.status] || item.status}</span>
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{item.count}</span>
              </div>
            ))}
          </div>

          {/* By Type */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Tickets por Tipo</h3>
            {ticketData.byType.map((item) => (
              <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: typeColors[item.type] || '#6b7280' }} />
                  <span style={{ fontSize: 14 }}>{typeLabels[item.type] || item.type}</span>
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{item.count}</span>
              </div>
            ))}
          </div>

          {/* By Priority */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Tickets por Prioridad</h3>
            {ticketData.byPriority.map((item) => (
              <div key={item.priority} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: priorityColors[item.priority] || '#6b7280' }} />
                  <span style={{ fontSize: 14 }}>{priorityLabels[item.priority] || item.priority}</span>
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
