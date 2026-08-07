import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const statusLabels = {
  nuevo: 'Nuevo',
  en_analisis: 'En análisis',
  en_progreso: 'En progreso',
  esperando_cliente: 'Esperando cliente',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};
const statusColors = {
  nuevo: { bg: '#dbeafe', text: '#1e40af' },
  en_analisis: { bg: '#fef9c3', text: '#a16207' },
  en_progreso: { bg: '#ffedd5', text: '#c2410c' },
  esperando_cliente: { bg: '#f3e8ff', text: '#7c3aed' },
  resuelto: { bg: '#dcfce7', text: '#166534' },
  cerrado: { bg: '#f3f4f6', text: '#6b7280' },
};

const priorityLabels = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' };
const priorityColors = {
  baja: { bg: '#f3f4f6', text: '#6b7280' },
  media: { bg: '#dbeafe', text: '#1d4ed8' },
  alta: { bg: '#ffedd5', text: '#c2410c' },
  critica: { bg: '#fef2f2', text: '#dc2626' },
};

const typeLabels = { bug: 'Bug', feature: 'Feature', soporte: 'Soporte', consulta: 'Consulta' };

export default function TicketsAdmin() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '', priority: '', client: '', search: '' });
  const navigate = useNavigate();

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.client) params.client = filters.client;
      if (filters.search) params.search = filters.search;
      const data = await api.getTickets(params);
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch (err) {
      alert('Error al cargar tickets: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadTickets();
  };

  const clearFilters = () => {
    setFilters({ status: '', type: '', priority: '', client: '', search: '' });
    setTimeout(loadTickets, 0);
  };

  const inputStyle = {
    padding: '7px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#111' }}>Tickets</h1>

      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: 16,
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'end',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Estado</label>
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} style={inputStyle}>
            <option value="">Todos</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_analisis">En análisis</option>
            <option value="en_progreso">En progreso</option>
            <option value="esperando_cliente">Esperando cliente</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Tipo</label>
          <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} style={inputStyle}>
            <option value="">Todos</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="soporte">Soporte</option>
            <option value="consulta">Consulta</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Prioridad</label>
          <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} style={inputStyle}>
            <option value="">Todas</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Cliente</label>
          <input
            value={filters.client}
            onChange={(e) => handleFilterChange('client', e.target.value)}
            placeholder="Buscar cliente..."
            style={{ ...inputStyle, width: 140 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>Buscar</label>
          <input
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Folio, título..."
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={applyFilters}
            style={{
              padding: '7px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Filtrar
          </button>
          <button
            onClick={clearFilters}
            style={{
              padding: '7px 16px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Cargando tickets...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Folio</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Título</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tipo</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Prioridad</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Asignado a</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? tickets.map((ticket) => {
                const sc = statusColors[ticket.status] || statusColors.nuevo;
                const pc = priorityColors[ticket.priority] || priorityColors.media;
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', color: '#2563eb', fontWeight: 500 }}>
                      {ticket.folio}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#111', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.title}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                      {ticket.clientName || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
                      {typeLabels[ticket.type] || ticket.type || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        background: pc.bg,
                        color: pc.text,
                      }}>
                        {priorityLabels[ticket.priority] || ticket.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        background: sc.bg,
                        color: sc.text,
                      }}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                      {ticket.assigneeName || 'Sin asignar'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('es-MX') : '—'}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    No se encontraron tickets
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
