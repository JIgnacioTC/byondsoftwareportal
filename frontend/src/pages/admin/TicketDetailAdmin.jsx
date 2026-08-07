import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const statusOptions = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'en_analisis', label: 'En análisis' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'esperando_cliente', label: 'Esperando cliente' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'cerrado', label: 'Cerrado' },
];
const statusColors = {
  nuevo: { bg: '#dbeafe', text: '#1e40af' },
  en_analisis: { bg: '#fef9c3', text: '#a16207' },
  en_progreso: { bg: '#ffedd5', text: '#c2410c' },
  esperando_cliente: { bg: '#f3e8ff', text: '#7c3aed' },
  resuelto: { bg: '#dcfce7', text: '#166534' },
  cerrado: { bg: '#f3f4f6', text: '#6b7280' },
};

const priorityOptions = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];
const priorityColors = {
  baja: { bg: '#f3f4f6', text: '#6b7280' },
  media: { bg: '#dbeafe', text: '#1d4ed8' },
  alta: { bg: '#ffedd5', text: '#c2410c' },
  critica: { bg: '#fef2f2', text: '#dc2626' },
};

const typeLabels = { bug: 'Bug', feature: 'Feature', soporte: 'Soporte', consulta: 'Consulta' };

export default function TicketDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState({ body: '', isInternal: false });
  const [timeEntry, setTimeEntry] = useState({ hours: '', workDate: '', notes: '', billable: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [ticketData, agentsData] = await Promise.all([
        api.getTicket(id),
        api.getAgents(),
      ]);
      setTicket(ticketData);
      setAgents(Array.isArray(agentsData) ? agentsData : agentsData.agents || []);
    } catch (err) {
      alert('Error al cargar ticket: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      await api.updateTicket(id, { [field]: value });
      setTicket((prev) => ({ ...prev, [field]: value }));
    } catch (err) {
      alert('Error al actualizar: ' + (err.message || ''));
    }
  };

  const handleAddComment = async () => {
    if (!comment.body.trim()) return;
    try {
      setSaving(true);
      await api.addTicketComment(id, { body: comment.body, isInternal: comment.isInternal });
      setComment({ body: '', isInternal: false });
      loadAll();
    } catch (err) {
      alert('Error al agregar comentario: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleAddTimeEntry = async () => {
    const hours = parseFloat(timeEntry.hours);
    if (!hours || hours < 0.25) {
      alert('Las horas deben ser mínimo 0.25');
      return;
    }
    try {
      setSaving(true);
      await api.addTimeEntry(id, {
        hours,
        workDate: timeEntry.workDate,
        notes: timeEntry.notes,
        billable: timeEntry.billable,
      });
      setTimeEntry({ hours: '', workDate: '', notes: '', billable: true });
      loadAll();
    } catch (err) {
      alert('Error al registrar horas: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    padding: '7px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Cargando ticket...</div>;
  if (!ticket) return <div style={{ textAlign: 'center', padding: 40, color: '#dc2626' }}>Ticket no encontrado</div>;

  const sc = statusColors[ticket.status] || statusColors.nuevo;
  const pc = priorityColors[ticket.priority] || priorityColors.media;

  return (
    <div>
      <button
        onClick={() => navigate('/admin/tickets')}
        style={{
          padding: '6px 14px',
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          color: '#374151',
          marginBottom: 20,
        }}
      >
        ← Volver a tickets
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', marginBottom: 4 }}>{ticket.folio}</div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111' }}>{ticket.title}</h1>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.text }}>
                  {statusOptions.find((s) => s.value === ticket.status)?.label || ticket.status}
                </span>
                <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: pc.bg, color: pc.text }}>
                  {priorityOptions.find((p) => p.value === ticket.priority)?.label || ticket.priority}
                </span>
                <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 500, background: '#f3f4f6', color: '#374151', textTransform: 'capitalize' }}>
                  {typeLabels[ticket.type] || ticket.type}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {ticket.description || 'Sin descripción'}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
              Creado: {ticket.created_at ? new Date(ticket.created_at).toLocaleString('es-MX') : '—'}
              {ticket.clientName && <> · Cliente: {ticket.clientName}</>}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 15 }}>
              Comentarios
            </div>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {ticket.comments?.length > 0 ? ticket.comments.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    background: c.is_internal ? '#fefce8' : '#fff',
                    borderLeft: c.is_internal ? '3px solid #eab308' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      {c.users?.full_name || 'Anónimo'}
                      {c.is_internal && (
                        <span style={{
                          marginLeft: 8,
                          padding: '1px 8px',
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 600,
                          background: '#fef08a',
                          color: '#a16207',
                        }}>
                          Interna
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleString('es-MX') : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.body}</div>
                </div>
              )) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  Sin comentarios
                </div>
              )}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
              <textarea
                value={comment.body}
                onChange={(e) => setComment({ ...comment, body: e.target.value })}
                placeholder="Escribe un comentario..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 13,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={comment.isInternal}
                    onChange={(e) => setComment({ ...comment, isInternal: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  Nota interna
                </label>
                <button
                  onClick={handleAddComment}
                  disabled={saving || !comment.body.trim()}
                  style={{
                    padding: '8px 20px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: saving || !comment.body.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: saving || !comment.body.trim() ? 0.5 : 1,
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 15 }}>
              Registro de horas
            </div>
            <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 140px 1fr 100px auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Horas *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={timeEntry.hours}
                    onChange={(e) => setTimeEntry({ ...timeEntry, hours: e.target.value })}
                    placeholder="0.25"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Fecha trabajo</label>
                  <input
                    type="date"
                    value={timeEntry.workDate}
                    onChange={(e) => setTimeEntry({ ...timeEntry, workDate: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Notas</label>
                  <input
                    value={timeEntry.notes}
                    onChange={(e) => setTimeEntry({ ...timeEntry, notes: e.target.value })}
                    placeholder="Descripción del trabajo..."
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', paddingTop: 18 }}>
                    <input
                      type="checkbox"
                      checked={timeEntry.billable}
                      onChange={(e) => setTimeEntry({ ...timeEntry, billable: e.target.checked })}
                      style={{ width: 16, height: 16 }}
                    />
                    Facturable
                  </label>
                </div>
                <div>
                  <button
                    onClick={handleAddTimeEntry}
                    disabled={saving}
                    style={{
                      padding: '7px 16px',
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    Registrar
                  </button>
                </div>
              </div>
            </div>
            {ticket.timeEntries?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Agente</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Horas</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Notas</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Facturable</th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.timeEntries.map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>
                        {entry.work_date ? new Date(entry.work_date).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151' }}>
                        {entry.users?.full_name || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#111' }}>
                        {Number(entry.hours).toFixed(2)}h
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.notes || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          background: entry.billable ? '#dcfce7' : '#f3f4f6',
                          color: entry.billable ? '#166534' : '#6b7280',
                        }}>
                          {entry.billable ? 'Sí' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Sin registros de tiempo
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111' }}>Gestión del ticket</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Estado</label>
              <select
                value={ticket.status}
                onChange={(e) => handleUpdateField('status', e.target.value)}
                style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Prioridad</label>
              <select
                value={ticket.priority}
                onChange={(e) => handleUpdateField('priority', e.target.value)}
                style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Asignar a</label>
              <select
                value={ticket.assigned_to || ''}
                onChange={(e) => handleUpdateField('assignedTo', e.target.value)}
                style={{ ...selectStyle, width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">Sin asignar</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111' }}>Información</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Cliente</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{ticket.clientName || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Tipo</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111', textTransform: 'capitalize' }}>
                  {typeLabels[ticket.type] || ticket.type || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Creado por</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{ticket.creatorName || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Fecha de creación</div>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleString('es-MX') : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Última actualización</div>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString('es-MX') : '—'}
                </div>
              </div>
              {ticket.timeEntries?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Total horas</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                    {ticket.timeEntries.reduce((sum, e) => sum + Number(e.hours || 0), 0).toFixed(2)}h
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
