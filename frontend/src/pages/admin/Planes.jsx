import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Checkbox, Field, Input, Loading, Modal,
  PageHeader, Select, Table, TableEmpty, Textarea,
} from '../../components/ui';
import { BILLING_TYPE, describe, formatMoney, optionsOf, parseFeatures } from '../../lib/domain';
import { IconRefresh } from '../../components/Icons';

const PLAN_FAMILY = [
  { value: 'care', label: 'Care' },
  { value: 'build', label: 'Build' },
  { value: 'accelerated', label: 'Accelerated' },
  { value: 'project', label: 'Proyecto' },
  { value: 'custom', label: 'A medida' },
  { value: 'addon', label: 'Add-on' },
];

export default function Planes() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (plan) => setEditor({
    plan,
    form: {
      basePrice: plan.base_price ?? '',
      billingType: plan.billing_type || 'monthly',
      planFamily: plan.plan_family || 'care',
      devHoursMonthly: plan.dev_hours_monthly ?? 0,
      features: parseFeatures(plan.features).join('\n'),
      active: plan.active !== false,
      sortOrder: plan.sort_order ?? 0,
    },
  });

  const setForm = (patch) => setEditor((s) => ({ ...s, form: { ...s.form, ...patch } }));

  const handleSave = async (e) => {
    e?.preventDefault();
    const { plan, form } = editor;
    const basePrice = parseFloat(form.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setNotice({ tone: 'warn', text: 'El precio base debe ser un número válido.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await api.updatePlan(plan.id, {
        basePrice,
        billingType: form.billingType,
        planFamily: form.planFamily,
        devHoursMonthly: parseInt(form.devHoursMonthly, 10) || 0,
        features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
        active: form.active,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      });
      setEditor(null);
      setNotice({ tone: 'success', text: `Plan "${plan.name}" actualizado.` });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (plan) => {
    if (!window.confirm(`Sincronizar "${plan.name}" con Stripe creará o actualizará el producto y generará un precio nuevo. ¿Continuar?`)) return;
    setSyncing(plan.id);
    setNotice(null);
    try {
      const result = await api.syncPlanStripe(plan.id);
      setNotice({ tone: 'success', text: `"${plan.name}" sincronizado. Price ID: ${result?.stripe?.priceId || '—'}` });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: `No se pudo sincronizar "${plan.name}": ${err.message}` });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Planes"
        description="Catálogo comercial que alimenta la landing y el checkout de Stripe."
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert tone="danger" title="No se pudieron cargar los planes">{error}</Alert>}

      <Alert tone="info" title="Sincronización con Stripe">
        Cada plan de pago necesita un precio en Stripe para poder cobrarse. Los planes por cotización se
        negocian fuera de línea y no se sincronizan.
      </Alert>

      <Card flush>
        {loading ? (
          <Loading label="Cargando planes…" />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Plan', width: 230 },
              { key: 'family', label: 'Familia', width: 130 },
              { key: 'billing', label: 'Cobro', width: 130 },
              { key: 'price', label: 'Precio', align: 'right', width: 130 },
              { key: 'hours', label: 'Horas/mes', align: 'right', width: 110 },
              { key: 'active', label: 'Visible', width: 110 },
              { key: 'stripe', label: 'Stripe', width: 130 },
              { key: 'actions', label: '', width: 190 },
            ]}
          >
            {plans.length === 0 ? (
              <TableEmpty colSpan={8}>No hay planes configurados</TableEmpty>
            ) : (
              plans.map((plan) => {
                const billing = describe(BILLING_TYPE, plan.billing_type);
                const isQuote = plan.billing_type === 'quote';
                const synced = Boolean(plan.stripe_price_id);
                return (
                  <tr key={plan.id}>
                    <td>
                      <div className="trn-cellstack">
                        <span className="t-strong">{plan.name}</span>
                        <span className="trn-cellstack__sub trn-mono">{plan.slug}</span>
                      </div>
                    </td>
                    <td className="trn-muted" style={{ textTransform: 'capitalize' }}>{plan.plan_family || '—'}</td>
                    <td><Badge tone={billing.tone}>{billing.label}</Badge></td>
                    <td className="num t-strong">{isQuote ? 'A cotizar' : formatMoney(plan.base_price)}</td>
                    <td className="num trn-muted">{plan.dev_hours_monthly ? `${plan.dev_hours_monthly} h` : '—'}</td>
                    <td><Badge tone={plan.active ? 'success' : 'neutral'} dot>{plan.active ? 'Sí' : 'No'}</Badge></td>
                    <td>
                      {isQuote
                        ? <span className="trn-muted">No aplica</span>
                        : <Badge tone={synced ? 'success' : 'warn'}>{synced ? 'Sincronizado' : 'Pendiente'}</Badge>}
                    </td>
                    <td>
                      <div className="trn-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(plan)}>Editar</Button>
                        {!isQuote && (
                          <Button size="sm" variant="ghost" onClick={() => handleSync(plan)} disabled={syncing === plan.id}>
                            <IconRefresh size={13} color="currentColor" />
                            {syncing === plan.id ? 'Sincronizando…' : 'Sincronizar'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </Table>
        )}
      </Card>

      {editor && (
        <Modal
          wide
          title={`Editar plan: ${editor.plan.name}`}
          subtitle={editor.plan.slug}
          onClose={() => setEditor(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
            </>
          }
        >
          <form onSubmit={handleSave} className="trn-stack">
            <div className="trn-formgrid">
              <Field label="Precio base (MXN)" htmlFor="basePrice">
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editor.form.basePrice}
                  onChange={(e) => setForm({ basePrice: e.target.value })}
                />
              </Field>
              <Field label="Modalidad de cobro" htmlFor="billingType">
                <Select id="billingType" value={editor.form.billingType} onChange={(e) => setForm({ billingType: e.target.value })} options={optionsOf(BILLING_TYPE)} />
              </Field>
              <Field label="Familia" htmlFor="planFamily">
                <Select id="planFamily" value={editor.form.planFamily} onChange={(e) => setForm({ planFamily: e.target.value })} options={PLAN_FAMILY} />
              </Field>
              <Field label="Horas de desarrollo / mes" htmlFor="devHours">
                <Input
                  id="devHours"
                  type="number"
                  min="0"
                  step="1"
                  value={editor.form.devHoursMonthly}
                  onChange={(e) => setForm({ devHoursMonthly: e.target.value })}
                />
              </Field>
              <Field label="Orden en la landing" htmlFor="sortOrder">
                <Input id="sortOrder" type="number" step="1" value={editor.form.sortOrder} onChange={(e) => setForm({ sortOrder: e.target.value })} />
              </Field>
              <Field label="Visibilidad">
                <div style={{ paddingTop: 8 }}>
                  <Checkbox
                    label="Mostrar en la landing"
                    checked={editor.form.active}
                    onChange={(e) => setForm({ active: e.target.checked })}
                  />
                </div>
              </Field>
            </div>

            <Field label="Características" htmlFor="features" hint="Una por línea. Se muestran como viñetas en la landing y en el portal.">
              <Textarea id="features" rows={6} value={editor.form.features} onChange={(e) => setForm({ features: e.target.value })} />
            </Field>

            <Field label="Stripe Price ID" htmlFor="stripePriceId" hint="Se genera al sincronizar; no es editable a mano.">
              <Input id="stripePriceId" className="trn-input trn-mono" value={editor.plan.stripe_price_id || '—'} readOnly />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
