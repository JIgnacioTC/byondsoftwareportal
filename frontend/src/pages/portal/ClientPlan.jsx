import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, DefinitionList, EmptyState, Loading, PageHeader,
} from '../../components/ui';
import {
  BILLING_TYPE, SUBSCRIPTION_STATUS, describe, formatDate, formatMoney, parseFeatures,
} from '../../lib/domain';
import { IconCard, IconCheck, IconExternal } from '../../components/Icons';

export default function ClientPlan() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    api.getClientPlan()
      .then(setSubscription)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestChange = async () => {
    if (!window.confirm('Se abrirá un ticket para que nuestro equipo te contacte y definan el nuevo plan. ¿Continuar?')) return;
    setRequesting(true);
    setNotice(null);
    try {
      await api.requestPlanChange();
      setNotice({ tone: 'success', text: 'Solicitud enviada. Creamos un ticket y nuestro equipo te contactará.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setRequesting(false);
    }
  };

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    setNotice(null);
    try {
      const data = await api.createPortalSession(subscription.client_id);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setNotice({ tone: 'danger', text: 'No recibimos una URL de facturación válida.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) return <Loading label="Cargando tu plan…" />;
  if (error) return <Alert tone="danger" title="No pudimos cargar tu plan">{error}</Alert>;

  // The API returns `null` (not an error) when the client has no subscription.
  const plan = subscription?.plans || null;

  if (!subscription || !plan) {
    return (
      <>
        <PageHeader title="Mi plan" />
        <Card>
          <EmptyState
            icon={<IconCard size={20} />}
            title="Sin plan activo"
            description="Aún no tienes un plan asignado. Escríbenos y te ayudamos a elegir el que mejor se ajusta a tu operación."
            action={<Button as="a" href="/contacto" variant="primary">Contactar al equipo</Button>}
          />
        </Card>
      </>
    );
  }

  const status = describe(SUBSCRIPTION_STATUS, subscription.status);
  const billing = describe(BILLING_TYPE, plan.billing_type);
  const features = parseFeatures(plan.features);
  const hours = Number(plan.dev_hours_monthly) || 0;

  return (
    <>
      <PageHeader
        title="Mi plan"
        description="Detalle de tu suscripción, lo que incluye y opciones de facturación."
        actions={
          <>
            <Button variant="secondary" onClick={handleManageBilling} disabled={openingPortal}>
              <IconExternal size={15} color="currentColor" />
              {openingPortal ? 'Abriendo…' : 'Gestionar facturación'}
            </Button>
            <Button variant="primary" onClick={handleRequestChange} disabled={requesting}>
              {requesting ? 'Enviando…' : 'Solicitar cambio de plan'}
            </Button>
          </>
        }
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="trn-grid trn-grid--sidebar">
        <div className="trn-stack">
          <Card>
            <div className="trn-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="trn-eyebrow">{billing.label}</p>
                <h2 style={{ fontSize: 22, fontWeight: 620, letterSpacing: '-0.02em', margin: 0 }}>{plan.name}</h2>
                <p className="trn-muted" style={{ fontSize: 13.5, marginTop: 4 }}>
                  {hours > 0 ? `${hours} horas de desarrollo al mes` : 'Sin bolsa de horas incluida'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="trn-num" style={{ fontSize: 26, fontWeight: 620, letterSpacing: '-0.03em' }}>
                  {formatMoney(plan.base_price)}
                </div>
                <div className="trn-muted" style={{ fontSize: 12.5 }}>
                  MXN {plan.billing_type === 'monthly' ? '/ mes' : ''}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Qué incluye">
            {features.length === 0 ? (
              <p className="trn-muted" style={{ fontSize: 13.5 }}>Este plan no tiene características registradas.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--trn-ink-2)' }}>
                    <span style={{ color: 'var(--trn-success)', flexShrink: 0, marginTop: 2 }}>
                      <IconCheck size={16} color="currentColor" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="trn-stack">
          <Card title="Suscripción" actions={<Badge tone={status.tone} dot>{status.label}</Badge>}>
            <DefinitionList
              items={[
                { label: 'Inicio', value: formatDate(subscription.start_date) },
                {
                  label: 'Periodo actual',
                  value: subscription.current_period_start && subscription.current_period_end
                    ? `${formatDate(subscription.current_period_start)} — ${formatDate(subscription.current_period_end)}`
                    : '—',
                },
                { label: 'Próxima renovación', value: formatDate(subscription.current_period_end) },
                { label: 'Modalidad', value: billing.label },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
