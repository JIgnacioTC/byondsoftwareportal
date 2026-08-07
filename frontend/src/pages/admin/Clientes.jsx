import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const statusColors = {
  activo: { bg: '#dcfce7', text: '#166534' },
  prospecto: { bg: '#dbeafe', text: '#1e40af' },
  suspendido: { bg: '#fef3c7', text: '#92400e' },
  inactivo: { bg: '#f3f4f6', text: '#6b7280' },
};

const emptyClient = { companyName: '', contactName: '', status: 'prospecto' };

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [detailClient, setDetailClient] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [adjustment, setAdjustment] = useState({ hours: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.getClients();
      setClients(Array.isArray(data) ? data : data.clients || []);
    } catch (err) {
      alert('Error al cargar clientes: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingClient) {
        await api.updateClient(editingClient.id, form);
      } else {
        await api.createClient(form);
      }
      setShowForm(false);
      setEditingClient(null);
      setForm(emptyClient);
      loadClients();
    } catch (err) {
      alert('Error al guardar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setForm({
      companyName: client.company_name || '',
      contactName: client.contact_name || '',
      status: client.status || 'prospecto',
    });
    setShowForm(true);
  };

  const handleActivate = async (clientId) => {
    if (!confirm('¿Activar suscripción para este cliente?')) return;
    try {
      await api.activateSubscription(clientId);
      loadClients();
    } catch (err) {
      alert('Error al activar: ' + (err.message || ''));
    }
  };

  const handleViewDetail = async (client) => {
    setDetailClient(client);
    setLedger(null);
    try {
      const data = await api.getClientLedger(client.id);
      setLedger(data);
    } catch (err) {
      setLedger({ error: err.message || 'Error al cargar' });
    }
  };

  const handleAdjustment = async () => {
    if (!adjustment.description.trim()) {
      alert('La descripción es obligatoria');
      return;
    }
    if (!adjustment.hours || isNaN(parseFloat(adjustment.hours))) {
      alert('Las horas deben ser un número válido');
      return;
    }
    try {
      setSaving(true);
      await api.createAdjustment(detailClient.id, {
        hours: parseFloat(adjustment.hours),
        description: adjustment.description,
      });
      setAdjustment({ hours: '', description: '' });
      const data = await api.getClientLedger(detailClient.id);
      setLedger(data);
    } catch (err) {
      alert('Error al registrar ajuste: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Cargando clientes...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111' }}>Clientes</h1>
        <button
          onClick={() => { setShowForm(true); setEditingClient(null); setForm(emptyClient); }}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Nombre de empresa</label>
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Nombre de contacto</label>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              >
                <option value="prospecto">Prospecto</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 20px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingClient(null); }}
                style={{
                  padding: '8px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Empresa</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Núm. Cliente</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Plan</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const sc = statusColors[client.status] || statusColors.inactivo;
              return (
                <tr key={client.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 500, color: '#111' }}>{client.company_name}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#6b7280' }}>{client.client_number || '—'}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: sc.bg,
                      color: sc.text,
                      textTransform: 'capitalize',
                    }}>
                      {client.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#374151' }}>{client.subscriptions?.[0]?.plans?.name || '—'}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(client)}
                        style={{
                          padding: '5px 12px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          color: '#374151',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleViewDetail(client)}
                        style={{
                          padding: '5px 12px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12,
                          color: '#1d4ed8',
                        }}
                      >
                        Detalle
                      </button>
                      {client.status === 'prospecto' && (
                        <button
                          onClick={() => handleActivate(client.id)}
                          style={{
                            padding: '5px 12px',
                            background: '#dcfce7',
                            border: '1px solid #86efac',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            color: '#166534',
                            fontWeight: 600,
                          }}
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detailClient && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Detalle: {detailClient.company_name}
            </h3>
            <button
              onClick={() => { setDetailClient(null); setLedger(null); }}
              style={{
                padding: '5px 12px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Cerrar
            </button>
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Contacto</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{detailClient.contact_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Plan actual</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{detailClient.subscriptions?.[0]?.plans?.name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Estado</div>
                <div style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{detailClient.status}</div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Ajuste manual de horas</h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4 }}>Horas</label>
                  <input
                    type="number"
                    step="0.25"
                    value={adjustment.hours}
                    onChange={(e) => setAdjustment({ ...adjustment, hours: e.target.value })}
                    style={{ width: 100, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4 }}>Descripción *</label>
                  <input
                    value={adjustment.description}
                    onChange={(e) => setAdjustment({ ...adjustment, description: e.target.value })}
                    placeholder="Motivo del ajuste"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
                <button
                  onClick={handleAdjustment}
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    background: '#2563eb',
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

            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Libro mayor</h4>
            {ledger?.error ? (
              <div style={{ color: '#dc2626', fontSize: 13 }}>{ledger.error}</div>
            ) : Array.isArray(ledger) && ledger.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tipo</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Descripción</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Horas</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(ledger) ? ledger : []).map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13 }}>{entry.created_at ? new Date(entry.created_at).toLocaleDateString('es-MX') : '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, textTransform: 'capitalize' }}>{entry.type || '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13 }}>{entry.description || '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, color: entry.hours < 0 ? '#dc2626' : '#16a34a' }}>
                        {entry.hours > 0 ? '+' : ''}{Number(entry.hours).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 500 }}>
                        {Number(entry.hours).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 16 }}>
                {ledger ? 'Sin movimientos' : 'Cargando...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
