import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const badgeColor = {
  allocation: '#10b981',
  consumption: '#ef4444',
  adjustment: '#8b5cf6',
  rollover: '#3b82f6',
};

const badgeLabel = {
  allocation: 'Asignación',
  consumption: 'Consumo',
  adjustment: 'Ajuste',
  rollover: 'Acumulado',
};

export default function ClientHours() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('');

  useEffect(() => {
    loadLedger();
  }, [filterPeriod]);

  async function loadLedger() {
    try {
      setLoading(true);
      const params = {};
      if (filterPeriod) params.period = filterPeriod;
      const data = await api.getClientLedger(params);
      setLedger(data);
    } catch (err) {
      console.error('Error loading ledger:', err);
    } finally {
      setLoading(false);
    }
  }

  const groupedByPeriod = ledger.reduce((acc, entry) => {
    if (!acc[entry.period]) acc[entry.period] = [];
    acc[entry.period].push(entry);
    return acc;
  }, {});

  const sortedPeriods = Object.keys(groupedByPeriod).sort().reverse();

  function getRunningBalance(entries) {
    return entries.reduce((sum, e) => sum + Number(e.hours), 0);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Consumo de Horas</h2>
        <input
          type="month"
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
        />
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Cargando...</p>
      ) : sortedPeriods.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#6b7280', margin: 0 }}>No hay registros de horas para mostrar.</p>
        </div>
      ) : (
        sortedPeriods.map((period) => {
          const entries = groupedByPeriod[period];
          const balance = getRunningBalance(entries);
          const [year, month] = period.split('-');
          const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
          const periodLabel = `${monthNames[parseInt(month) - 1]} ${year}`;

          return (
            <div key={period} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{periodLabel}</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  background: balance >= 0 ? '#dcfce7' : '#fee2e2',
                  color: balance >= 0 ? '#166534' : '#991b1b',
                }}>
                  Saldo: {balance > 0 ? '+' : ''}{Number(balance).toFixed(1)}h
                </span>
              </div>
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Tipo</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Descripción</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Ticket</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Horas</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            background: badgeColor[entry.type] + '20',
                            color: badgeColor[entry.type],
                          }}>
                            {badgeLabel[entry.type]}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{entry.description}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>{entry.ticketFolio || '—'}</td>
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontWeight: 600,
                          fontSize: 14,
                          color: Number(entry.hours) >= 0 ? '#10b981' : '#ef4444',
                        }}>
                          {Number(entry.hours) > 0 ? '+' : ''}{Number(entry.hours).toFixed(1)}h
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>
                          {new Date(entry.createdAt).toLocaleDateString('es-MX')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
