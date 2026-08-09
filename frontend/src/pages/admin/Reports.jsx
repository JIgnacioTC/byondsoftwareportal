import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Field, Input, Loading, PageHeader, Stat, Table, TableEmpty,
} from '../../components/ui';
import {
  TICKET_PRIORITY, TICKET_STATUS, TICKET_TYPE,
  describe, formatHours, formatPeriod,
} from '../../lib/domain';

/** Ledger rows arrive one per (client, period, type); pivot them per client. */
function pivotByClient(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.clientId}-${row.period}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        clientId: row.clientId,
        clientName: row.clientName,
        period: row.period,
        allocation: 0,
        consumption: 0,
        adjustment: 0,
        rollover: 0,
      });
    }
    const bucket = map.get(key);
    if (row.type in bucket) bucket[row.type] += Number(row.totalHours) || 0;
  }
  return [...map.values()]
    .map((r) => ({ ...r, balance: r.allocation + r.consumption + r.adjustment + r.rollover }))
    .sort((a, b) => b.period.localeCompare(a.period) || (a.clientName || '').localeCompare(b.clientName || ''));
}

function Distribution({ title, rows, map, keyField }) {
  const total = rows.reduce((s, r) => s + Number(r.count || 0), 0);
  return (
    <Card title={title} subtitle={`${total} en total`}>
      {rows.length === 0 ? (
        <p className="trn-muted" style={{ fontSize: 13.5 }}>Sin datos.</p>
      ) : (
        <div className="trn-stack" style={{ gap: 12 }}>
          {rows
            .slice()
            .sort((a, b) => b.count - a.count)
            .map((row) => {
              const meta = describe(map, row[keyField]);
              const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
              return (
                <div key={row[keyField]}>
                  <div className="trn-row" style={{ justifyContent: 'space-between', marginBottom: 5 }}>
                    <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    <span className="trn-num" style={{ fontWeight: 600 }}>
                      {row.count} <span className="trn-muted" style={{ fontWeight: 400 }}>· {pct}%</span>
                    </span>
                  </div>
                  <div className="trn-meter"><div className="trn-meter__fill" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
}

export default function AdminReports() {
  const [hoursRows, setHoursRows] = useState([]);
  const [ticketStats, setTicketStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('');

  const load = useCallback(async (selectedPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const [hours, tickets] = await Promise.all([
        api.getHoursReport(selectedPeriod ? { period: selectedPeriod } : {}),
        api.getTicketReports(),
      ]);
      setHoursRows(Array.isArray(hours) ? hours : []);
      setTicketStats(tickets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [load, period]);

  const pivoted = useMemo(() => pivotByClient(hoursRows), [hoursRows]);
  const totals = useMemo(() => ({
    allocated: pivoted.reduce((s, r) => s + r.allocation, 0),
    consumed: pivoted.reduce((s, r) => s + Math.abs(r.consumption), 0),
    balance: pivoted.reduce((s, r) => s + r.balance, 0),
    overdrawn: pivoted.filter((r) => r.balance < 0).length,
  }), [pivoted]);

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Consumo de horas por cuenta y distribución de la carga de tickets."
        actions={
          <div className="trn-row" style={{ alignItems: 'flex-end' }}>
            <Field label="Periodo" htmlFor="period">
              <Input id="period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: 165 }} />
            </Field>
            {period && <Button variant="ghost" onClick={() => setPeriod('')}>Ver todo</Button>}
          </div>
        }
      />

      {error && <Alert tone="danger" title="No se pudieron cargar los reportes">{error}</Alert>}

      {loading ? (
        <Loading label="Calculando reportes…" />
      ) : (
        <>
          <div className="trn-stats" style={{ marginBottom: 20 }}>
            <Stat label="Horas asignadas" value={formatHours(totals.allocated)} hint={period ? formatPeriod(period) : 'Histórico completo'} />
            <Stat label="Horas consumidas" value={formatHours(totals.consumed)} />
            <Stat label="Saldo agregado" value={formatHours(totals.balance, { signed: true })} tone={totals.balance < 0 ? 'danger' : 'success'} />
            <Stat label="Cuentas en excedente" value={totals.overdrawn} tone={totals.overdrawn > 0 ? 'warn' : undefined} />
          </div>

          <Card title="Horas por cliente" subtitle={period ? formatPeriod(period) : 'Todos los periodos'} flush style={{ marginBottom: 16 }}>
            <Table
              columns={[
                { key: 'client', label: 'Cliente' },
                { key: 'period', label: 'Periodo', width: 150 },
                { key: 'alloc', label: 'Asignadas', align: 'right', width: 120 },
                { key: 'cons', label: 'Consumidas', align: 'right', width: 120 },
                { key: 'adj', label: 'Ajustes', align: 'right', width: 110 },
                { key: 'balance', label: 'Saldo', align: 'right', width: 120 },
              ]}
            >
              {pivoted.length === 0 ? (
                <TableEmpty colSpan={6}>Sin movimientos en el periodo seleccionado</TableEmpty>
              ) : (
                pivoted.map((row) => (
                  <tr key={row.key}>
                    <td className="t-strong">{row.clientName || `Cliente #${row.clientId}`}</td>
                    <td className="trn-muted">{formatPeriod(row.period)}</td>
                    <td className="num trn-muted">{formatHours(row.allocation)}</td>
                    <td className="num trn-muted">{formatHours(Math.abs(row.consumption))}</td>
                    <td className="num trn-muted">{row.adjustment ? formatHours(row.adjustment, { signed: true }) : '—'}</td>
                    <td className={`num ${row.balance < 0 ? 'trn-neg' : 'trn-pos'}`}>{formatHours(row.balance, { signed: true })}</td>
                  </tr>
                ))
              )}
            </Table>
          </Card>

          {ticketStats && (
            <div className="trn-grid trn-grid--3">
              <Distribution title="Tickets por estado" rows={ticketStats.byStatus || []} map={TICKET_STATUS} keyField="status" />
              <Distribution title="Tickets por tipo" rows={ticketStats.byType || []} map={TICKET_TYPE} keyField="type" />
              <Distribution title="Tickets por prioridad" rows={ticketStats.byPriority || []} map={TICKET_PRIORITY} keyField="priority" />
            </div>
          )}
        </>
      )}
    </>
  );
}
