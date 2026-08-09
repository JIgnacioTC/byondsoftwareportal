import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Planes() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({ basePrice: '', devHoursMonthly: '', features: '', active: true, stripePriceId: '', billingType: 'monthly', planFamily: 'care' });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminPlans();
      setPlans(Array.isArray(data) ? data : data.plans || []);
    } catch (err) {
      alert('Error al cargar planes: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    const features = Array.isArray(plan.features)
      ? plan.features.join('\n')
      : (plan.features || '');
    setForm({
      basePrice: plan.base_price ?? '',
      billingType: plan.billing_type ?? 'monthly',
      planFamily: plan.plan_family ?? 'care',
      devHoursMonthly: plan.dev_hours_monthly ?? '',
      features,
      active: plan.active !== undefined ? plan.active : true,
      stripePriceId: plan.stripe_price_id || '',
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const featuresList = form.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);
      await api.updatePlan(editingPlan.id, {
        basePrice: parseFloat(form.basePrice) || 0,
        billingType: form.billingType,
        planFamily: form.planFamily,
        devHoursMonthly: parseFloat(form.devHoursMonthly) || 0,
        features: featuresList,
        active: form.active,
        stripePriceId: form.stripePriceId || null,
      });
      setEditingPlan(null);
      loadPlans();
    } catch (err) {
      alert('Error al guardar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleSyncStripe = async (plan) => {
    if (!confirm(`Sincronizar el plan "${plan.name}" con Stripe?\n\nEsto creara/actualizara el producto y precio en Stripe.`)) return;
    try {
      setSyncing(plan.id);
      setSyncResult(null);
      const result = await api.syncPlanStripe(plan.id);
      setSyncResult({ success: true, planName: plan.name, stripe: result.stripe });
      loadPlans();
    } catch (err) {
      setSyncResult({ success: false, planName: plan.name, error: err.message });
    } finally {
      setSyncing(null);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Cargando planes...</div>;

  return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#111' }}>Planes</h1>

      {syncResult && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          background: syncResult.success ? '#dcfce7' : '#fee2e2',
          color: syncResult.success ? '#166534' : '#991b1b',
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>
            {syncResult.success
              ? `"${syncResult.planName}" sincronizado. Price ID: ${syncResult.stripe.priceId}`
              : `Error al sincronizar "${syncResult.planName}": ${syncResult.error}`}
          </span>
          <button onClick={() => setSyncResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit', padding: 0 }}>x</button>
        </div>
      )}

      {editingPlan && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
            Editar plan: {editingPlan.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Precio (MXN)</label>
              <input
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Horas incluidas</label>
              <input
                type="number"
                step="0.5"
                value={form.devHoursMonthly}
                onChange={(e) => setForm({ ...form, devHoursMonthly: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                Plan activo
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Stripe Price ID</label>
            <input
              value={form.stripePriceId}
              onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })}
              placeholder="price_... (se llena automaticamente al sincronizar)"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: 'monospace', background: '#f9fafb' }}
              readOnly
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Caracteristicas (una por linea)
            </label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              rows={5}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
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
              onClick={() => setEditingPlan(null)}
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
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Nombre</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Precio</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Horas</th>
              <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Activo</th>
              <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Stripe</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const isSynced = !!plan.stripe_price_id;
              return (
                <tr key={plan.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{plan.slug}</div>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 14, fontWeight: 500, color: '#111' }}>
                    ${Number(plan.base_price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 14, color: '#111' }}>
                    {plan.dev_hours_monthly ?? '—'}h
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: plan.active ? '#16a34a' : '#d1d5db',
                    }} />
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    {isSynced ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#dcfce7',
                        color: '#166534',
                      }}>
                        Sincronizado
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#fef3c7',
                        color: '#92400e',
                      }}>
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEdit(plan)}
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
                        onClick={() => handleSyncStripe(plan)}
                        disabled={syncing === plan.id}
                        style={{
                          padding: '5px 12px',
                          background: syncing === plan.id ? '#e5e7eb' : '#6366f1',
                          border: 'none',
                          borderRadius: 4,
                          cursor: syncing === plan.id ? 'not-allowed' : 'pointer',
                          fontSize: 12,
                          color: '#fff',
                          fontWeight: 500,
                          opacity: syncing === plan.id ? 0.6 : 1,
                        }}
                      >
                        {syncing === plan.id ? 'Sincronizando...' : 'Sync Stripe'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: 16, background: '#f0f7ff', borderRadius: 8, border: '1px solid #bfdbfe', fontSize: 13, color: '#1e40af' }}>
        <strong>Stripe:</strong> Cada plan debe sincronizarse con Stripe para poder procesar pagos. El boton "Sync Stripe" crea/actualiza el producto y precio en tu cuenta de Stripe.
      </div>
    </div>
  );
}
