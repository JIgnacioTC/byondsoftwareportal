import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, EmptyState, Loading, Meter, PageHeader, Stat, Table, TableEmpty,
} from '../../components/ui';
import {
  LEDGER_TYPE, SUBSCRIPTION_STATUS, TICKET_STATUS,
  describe, formatDate, formatHours, formatMoney, formatPeriod, currentPeriod,
} from '../../lib/domain';
import { IconChevronRight, IconPlus } from '../../components/Icons';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getClientDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Cargando tu resumen…" />;
  if (error) return <Alert tone="danger" title="No pudimos cargar tu resumen">{error}</Alert>;

  const subscription = data?.subscription || null;
  const plan = subscription?.plans || null;
  const hours = data?.hours || {};
  const openTickets = data?.openTickets || [];
  const movements = data?.recentMovements || [];

  const allocated = Number(hours.allocated) || 0;
  const consumed = Number(hours.consumed) || 0;
  const available = Number(hours.available) || 0;
  const usage = allocated > 0 ? Math.round((consumed / allocated) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow={formatPeriod(currentPeriod())}
        title="Resumen"
        description="Estado de tu plan, horas del periodo en curso y tickets abiertos."
        actions={
          <Button as={Link} to="/portal/tickets/nuevo" variant="primary">
            <IconPlus size={15} color="currentColor" />
            Nuevo ticket
          </Button>
        }
      />

      <div className="trn-stats" style={{ marginBottom: 16 }}>
        <Stat label="Horas asignadas" value={formatHours(allocated)} hint={plan ? plan.name : 'Sin plan activo'} />
        <Stat label="Horas consumidas" value={formatHours(consumed)} hint={`${usage}% del periodo`} tone={usage >= 100 ? 'danger' : usage >= 80 ? 'warn' : undefined} />
        <Stat label="Horas disponibles" value={formatHours(available)} tone={available < 0 ? 'danger' : 'success'} hint={available < 0 ? 'Excedente por facturar' : 'Disponibles este mes'} />
        <Stat label="Tickets abiertos" value={openTickets.length} hint={openTickets.length === 1 ? '1 en curso' : `${openTickets.length} en curso`} />
      </div>

      <div className="trn-grid trn-grid--2" style={{ marginBottom: 16 }}>
        <Card
          title="Plan contratado"
          actions={<Button as={Link} to="/portal/plan" variant="ghost" size="sm">Ver detalle <IconChevronRight size={14} color="currentColor" /></Button>}
        >
          {plan ? (
            <>
              <div className="trn-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{plan.name}</div>
                  <div className="trn-muted" style={{ fontSize: 13 }}>
                    {Number(plan.dev_hours_monthly) > 0 ? `${plan.dev_hours_monthly} h de desarrollo al mes` : 'Sin bolsa de horas'}
                  </div>
                </div>
                <Badge tone={describe(SUBSCRIPTION_STATUS, subscription.status).tone} dot>
                  {describe(SUBSCRIPTION_STATUS, subscription.status).label}
                </Badge>
              </div>
              <div className="trn-metagrid">
                <div>
                  <div className="trn-dl__k">Importe</div>
                  <div className="trn-dl__v trn-num">{formatMoney(plan.base_price)}</div>
                </div>
                <div>
                  <div className="trn-dl__k">Próxima renovación</div>
                  <div className="trn-dl__v">{formatDate(subscription.current_period_end)}</div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="Sin plan activo"
              description="Aún no tienes un plan asignado. Contacta a tu ejecutivo para activarlo."
            />
          )}
        </Card>

        <Card title="Consumo del periodo" subtitle={formatPeriod(currentPeriod())}>
          <div className="trn-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 620, letterSpacing: '-0.03em' }} className="trn-num">
              {consumed.toFixed(1)}
              <span className="trn-muted" style={{ fontSize: 15, fontWeight: 500 }}> / {allocated.toFixed(1)} h</span>
            </span>
            <Badge tone={usage >= 100 ? 'danger' : usage >= 80 ? 'warn' : 'success'}>{usage}% utilizado</Badge>
          </div>
          <Meter value={consumed} max={allocated} />
          <p className="trn-muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            {available < 0
              ? `Has excedido tu bolsa en ${Math.abs(available).toFixed(1)} h. Las horas extra se facturan por separado.`
              : `Te quedan ${available.toFixed(1)} h disponibles en este periodo.`}
          </p>
        </Card>
      </div>

      <div className="trn-stack">
        <Card
          title="Tickets abiertos"
          flush
          actions={<Button as={Link} to="/portal/tickets" variant="ghost" size="sm">Ver todos <IconChevronRight size={14} color="currentColor" /></Button>}
        >
          <Table
            columns={[
              { key: 'folio', label: 'Folio', width: 150 },
              { key: 'title', label: 'Asunto' },
              { key: 'status', label: 'Estado', width: 170 },
              { key: 'created', label: 'Creado', width: 130 },
            ]}
          >
            {openTickets.length === 0 ? (
              <TableEmpty colSpan={4}>No tienes tickets abiertos</TableEmpty>
            ) : (
              openTickets.map((t) => {
                const status = describe(TICKET_STATUS, t.status);
                return (
                  <tr key={t.id} className="is-clickable" onClick={() => navigate(`/portal/tickets/${t.id}`)}>
                    <td className="t-mono">{t.folio}</td>
                    <td className="t-strong"><div className="trn-truncate">{t.title}</div></td>
                    <td><Badge tone={status.tone} dot>{status.label}</Badge></td>
                    <td className="trn-muted trn-nowrap">{formatDate(t.created_at)}</td>
                  </tr>
                );
              })
            )}
          </Table>
        </Card>

        <Card title="Movimientos recientes de horas" flush>
          <Table
            columns={[
              { key: 'date', label: 'Fecha', width: 130 },
              { key: 'type', label: 'Tipo', width: 150 },
              { key: 'desc', label: 'Concepto' },
              { key: 'hours', label: 'Horas', align: 'right', width: 110 },
            ]}
          >
            {movements.length === 0 ? (
              <TableEmpty colSpan={4}>Todavía no hay movimientos</TableEmpty>
            ) : (
              movements.map((m) => {
                const type = describe(LEDGER_TYPE, m.type);
                const value = Number(m.hours);
                return (
                  <tr key={m.id}>
                    <td className="trn-muted trn-nowrap">{formatDate(m.created_at)}</td>
                    <td><Badge tone={type.tone}>{type.label}</Badge></td>
                    <td>
                      <div className="trn-truncate">{m.description || '—'}</div>
                      {m.tickets?.folio && <div className="trn-cellstack__sub trn-mono">{m.tickets.folio}</div>}
                    </td>
                    <td className={`num ${value < 0 ? 'trn-neg' : 'trn-pos'}`}>{formatHours(value, { signed: true })}</td>
                  </tr>
                );
              })
            )}
          </Table>
        </Card>
      </div>
    </>
  );
}
