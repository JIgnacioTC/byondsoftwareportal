import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await api.getAdminDashboard();
      setData(result);
    } catch (err) {
      setError(err.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async (subscriptionId) => {
    if (!confirm('¿Activar esta suscripción?')) return;
    try {
      await api.activateSubscription(subscriptionId);
      loadDashboard();
    } catch (err) {
      alert('Error al activar suscripción: ' + (err.message || 'Error desconocido'));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Cargando dashboard...</div>;
  if (error) return <div style={{ padding: 40, color: '#dc2626' }}>Error: {error}</div>;
  if (!data) return null;

  const statCards = [
    {
      title: 'Tickets nuevos/sin asignar',
      value: data.newTickets?.length ?? 0,
      color: '#2563eb',
      bg: '#eff6ff',
    },
    {
      title: 'Suscripciones pendientes',
      value: data.pendingSubscriptions?.length ?? 0,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      title: 'Clientes con horas excedentes',
      value: data.negativeBalanceClients?.length ?? 0,
      color: '#dc2626',
      bg: '#fef2f2',
    },
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#111' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        {statCards.map((card) => (
          <div key={card.title} style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{card.title}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 15 }}>
            Tickets nuevos
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {data.newTickets?.length > 0 ? data.newTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ fontWeight: 500, fontSize: 14, color: '#111' }}>{ticket.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  {ticket.clients?.company_name || 'Sin cliente'} — {ticket.folio}
                </div>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                No hay tickets nuevos
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 15 }}>
            Suscripciones pendientes
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {data.pendingSubscriptions?.length > 0 ? data.pendingSubscriptions.map((sub) => (
              <div key={sub.id} style={{
                padding: '12px 20px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#111' }}>{sub.clients?.company_name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{sub.plans?.name || '—'}</div>
                </div>
                <button
                  onClick={() => handleActivateSubscription(sub.id)}
                  style={{
                    padding: '6px 16px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Activar
                </button>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                No hay suscripciones pendientes
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 15 }}>
          Horas consumidas por cliente
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Cliente</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Consumidas</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Disponibles</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.hoursConsumed?.length > 0 ? data.hoursConsumed.map((row) => {
              const balance = (row.totalAllocated ?? 0) + (row.totalConsumed ?? 0);
              const isNegative = balance < 0;
              return (
                <tr key={row.clientId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 20px', fontSize: 14, color: '#111' }}>{row.clientName}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 14, color: '#111' }}>
                    {Math.abs(row.totalConsumed ?? 0).toFixed(2)}h
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 14, color: '#111' }}>
                    {(row.totalAllocated ?? 0).toFixed(2)}h
                  </td>
                  <td style={{
                    padding: '12px 20px',
                    textAlign: 'right',
                    fontSize: 14,
                    fontWeight: 600,
                    color: isNegative ? '#dc2626' : '#16a34a',
                  }}>
                    {balance.toFixed(2)}h
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
