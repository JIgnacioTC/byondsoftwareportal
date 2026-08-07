import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function ClientPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  async function loadPlan() {
    try {
      const data = await api.getClientPlan();
      setPlan(data);
    } catch (err) {
      console.error('Error loading plan:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestChange() {
    if (!confirm('¿Deseas solicitar un cambio de plan? Se creara un ticket para que nuestro equipo te contacte.')) return;
    try {
      setRequesting(true);
      await api.requestPlanChange();
      setMessage('Solicitud enviada. Nuestro equipo se pondra en contacto contigo pronto.');
    } catch (err) {
      setMessage('Error al enviar solicitud: ' + err.message);
    } finally {
      setRequesting(false);
    }
  }

  async function handleManageBilling() {
    try {
      setPortalLoading(true);
      const data = await api.createPortalSession(plan.client_id);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setMessage('Error al abrir portal de facturacion: ' + err.message);
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) return <p style={{ color: '#6b7280' }}>Cargando...</p>;

  if (!plan) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 8px' }}>Sin plan activo</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Aun no tienes un plan asignado. Contacta a nuestro equipo para mas informacion.</p>
      </div>
    );
  }

  const features = typeof plan.planFeatures === 'string' ? JSON.parse(plan.planFeatures) : plan.planFeatures;

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700 }}>Mi Plan</h2>

      <div style={{ background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{plan.planName}</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
              {Number(plan.planHours)} horas de desarrollo al mes
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>
              ${Number(plan.planPrice).toLocaleString('es-MX')}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>MXN / mes</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
            Incluye
          </h4>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {features.map((feature, i) => (
              <li key={i} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#374151', borderBottom: i < features.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ color: '#10b981', fontSize: 18 }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Estado</div>
            <span style={{
              padding: '4px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              background: plan.status === 'activa' ? '#dcfce7' : '#fef3c7',
              color: plan.status === 'activa' ? '#166534' : '#92400e',
            }}>
              {plan.status === 'activa' ? 'Activo' : plan.status}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Inicio</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
              {plan.startDate ? new Date(plan.startDate).toLocaleDateString('es-MX') : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Periodo actual</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
              {plan.currentPeriodStart && plan.currentPeriodEnd
                ? `${new Date(plan.currentPeriodStart).toLocaleDateString('es-MX')} - ${new Date(plan.currentPeriodEnd).toLocaleDateString('es-MX')}`
                : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Proxima renovacion</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
              {plan.currentPeriodEnd ? new Date(plan.currentPeriodEnd).toLocaleDateString('es-MX') : '—'}
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          background: message.includes('Error') ? '#fee2e2' : '#dcfce7',
          color: message.includes('Error') ? '#991b1b' : '#166534',
          fontSize: 14,
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={handleRequestChange}
          disabled={requesting}
          style={{
            padding: '12px 24px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: requesting ? 'not-allowed' : 'pointer',
            opacity: requesting ? 0.7 : 1,
          }}
        >
          {requesting ? 'Enviando...' : 'Solicitar cambio de plan'}
        </button>
        <button
          onClick={handleManageBilling}
          disabled={portalLoading}
          style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: portalLoading ? 'not-allowed' : 'pointer',
            opacity: portalLoading ? 0.7 : 1,
          }}
        >
          {portalLoading ? 'Abriendo...' : 'Gestionar facturacion'}
        </button>
      </div>
    </div>
  );
}
