import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Loading, PageHeader, Stat, Table, TableEmpty,
} from '../../components/ui';
import {
  TICKET_PRIORITY, describe, formatDate, formatHours, formatPeriod, currentPeriod,
} from '../../lib/domain';
import { IconChevronRight, IconTicket, IconUserCheck } from '../../components/Icons';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [activating, setActivating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getAdminDashboard());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The endpoint is keyed by CLIENT id and resolves that client's pending subscription.
  const handleActivate = async (subscription) => {
    const company = subscription.clients?.company_name || 'este cliente';
    if (!window.confirm(`¿Activar la suscripción de ${company}? Se asignarán las horas del plan para el periodo en curso.`)) return;

    setActivating(subscription.id);
    setNotice(null);
    try {
      await api.activateSubscription(subscription.client_id);
      setNotice({ tone: 'success', text: `Suscripción de ${company} activada.` });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: `No se pudo activar la suscripción de ${company}: ${err.message}` });
    } finally {
      setActivating(null);
    }
  };

  if (loading) return <Loading label="Cargando dashboard…" />;
  if (error) return <Alert tone="danger" title="No se pudo cargar el dashboard">{error}</Alert>;

  const newTickets = data?.newTickets || [];
  const pendingSubs = data?.pendingSubscriptions || [];
  const hoursByClient = data?.hoursConsumed || [];
  const negative = data?.negativeBalanceClients || [];

  const totalConsumed = hoursByClient.reduce((s, r) => s + Math.abs(Number(r.totalConsumed) || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow={formatPeriod(currentPeriod())}
        title="Dashboard"
        description="Estado operativo del periodo en curso: entrada de tickets, altas pendientes y consumo de horas."
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="trn-stats" style={{ marginBottom: 20 }}>
        <Stat label="Tickets nuevos" value={newTickets.length} hint="Sin triage ni asignación" icon={<IconTicket size={14} color="currentColor" />} />
        <Stat label="Altas pendientes" value={pendingSubs.length} hint="Suscripciones por activar" tone={pendingSubs.length > 0 ? 'warn' : undefined} icon={<IconUserCheck size={14} color="currentColor" />} />
        <Stat label="Cuentas en excedente" value={negative.length} hint="Saldo de horas negativo" tone={negative.length > 0 ? 'danger' : undefined} />
        <Stat label="Horas consumidas" value={formatHours(totalConsumed)} hint="Total del periodo" />
      </div>

      <div className="trn-grid trn-grid--2" style={{ marginBottom: 16 }}>
        <Card
          title="Tickets nuevos"
          subtitle="Entradas sin asignar, más recientes primero"
          flush
          actions={<Button variant="ghost" size="sm" onClick={() => navigate('/admin/tickets')}>Ver todos <IconChevronRight size={14} color="currentColor" /></Button>}
        >
          <Table
            columns={[
              { key: 'title', label: 'Ticket' },
              { key: 'priority', label: 'Prioridad', width: 110 },
            ]}
          >
            {newTickets.length === 0 ? (
              <TableEmpty colSpan={2}>Nada pendiente de triage</TableEmpty>
            ) : (
              newTickets.map((t) => {
                const priority = describe(TICKET_PRIORITY, t.priority);
                return (
                  <tr key={t.id} className="is-clickable" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                    <td>
                      <div className="trn-cellstack">
                        <span className="t-strong trn-truncate">{t.title}</span>
                        <span className="trn-cellstack__sub">
                          <span className="trn-mono">{t.folio}</span> · {t.clients?.company_name || 'Sin cliente'} · {formatDate(t.created_at)}
                        </span>
                      </div>
                    </td>
                    <td><Badge tone={priority.tone}>{priority.label}</Badge></td>
                  </tr>
                );
              })
            )}
          </Table>
        </Card>

        <Card title="Suscripciones por activar" subtitle="Requieren asignación de horas del periodo" flush>
          <Table
            columns={[
              { key: 'client', label: 'Cliente' },
              { key: 'plan', label: 'Plan', width: 150 },
              { key: 'action', label: '', width: 100 },
            ]}
          >
            {pendingSubs.length === 0 ? (
              <TableEmpty colSpan={3}>No hay altas pendientes</TableEmpty>
            ) : (
              pendingSubs.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className="trn-cellstack">
                      <span className="t-strong">{sub.clients?.company_name || '—'}</span>
                      <span className="trn-cellstack__sub trn-mono">{sub.clients?.client_number || '—'}</span>
                    </div>
                  </td>
                  <td className="trn-muted">{sub.plans?.name || '—'}</td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleActivate(sub)}
                      disabled={activating === sub.id}
                    >
                      {activating === sub.id ? 'Activando…' : 'Activar'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      </div>

      <Card title="Consumo de horas por cliente" subtitle={formatPeriod(currentPeriod())} flush>
        <Table
          columns={[
            { key: 'client', label: 'Cliente' },
            { key: 'allocated', label: 'Asignadas', align: 'right', width: 130 },
            { key: 'consumed', label: 'Consumidas', align: 'right', width: 130 },
            { key: 'balance', label: 'Saldo', align: 'right', width: 130 },
          ]}
        >
          {hoursByClient.length === 0 ? (
            <TableEmpty colSpan={4}>Sin movimientos de horas en el periodo</TableEmpty>
          ) : (
            hoursByClient.map((row) => {
              // Consumption rows are stored as negative hours, so a plain sum is the balance.
              const allocated = Number(row.totalAllocated) || 0;
              const consumed = Number(row.totalConsumed) || 0;
              const balance = allocated + consumed;
              return (
                <tr key={row.clientId}>
                  <td className="t-strong">{row.clientName || `Cliente #${row.clientId}`}</td>
                  <td className="num trn-muted">{formatHours(allocated)}</td>
                  <td className="num trn-muted">{formatHours(Math.abs(consumed))}</td>
                  <td className={`num ${balance < 0 ? 'trn-neg' : 'trn-pos'}`}>{formatHours(balance, { signed: true })}</td>
                </tr>
              );
            })
          )}
        </Table>
      </Card>
    </>
  );
}
