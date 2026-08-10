import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Card, Field, Loading, PageHeader, Select, Stat, Table, TableEmpty,
} from '../../components/ui';
import { LEDGER_TYPE, describe, formatDate, formatHours, formatPeriod } from '../../lib/domain';

/** Group ledger rows by period, newest first, with a running balance per period. */
function groupByPeriod(entries) {
  const map = new Map();
  for (const entry of entries) {
    const key = entry.period || 'sin-periodo';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([period, rows]) => ({
      period,
      rows,
      allocated: rows.filter((r) => r.type !== 'consumption').reduce((s, r) => s + Number(r.hours || 0), 0),
      consumed: rows.filter((r) => r.type === 'consumption').reduce((s, r) => s + Math.abs(Number(r.hours || 0)), 0),
      balance: rows.reduce((s, r) => s + Number(r.hours || 0), 0),
    }));
}

export default function ClientHours() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('');

  // Fetched once, unfiltered — the period dropdown only ever lists periods
  // that actually have movements, and switching periods is an instant
  // client-side filter instead of a native <input type="month"> (which let
  // you "select" any month, including ones with no data, and round-tripped
  // to the server on every change).
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getClientLedger();
      setLedger(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const allPeriods = useMemo(() => groupByPeriod(ledger), [ledger]);
  const periods = useMemo(
    () => (period ? allPeriods.filter((p) => p.period === period) : allPeriods),
    [allPeriods, period]
  );
  const totals = useMemo(() => ({
    allocated: periods.reduce((s, p) => s + p.allocated, 0),
    consumed: periods.reduce((s, p) => s + p.consumed, 0),
    balance: periods.reduce((s, p) => s + p.balance, 0),
  }), [periods]);

  const periodOptions = useMemo(
    () => allPeriods.map((p) => ({ value: p.period, label: formatPeriod(p.period) })),
    [allPeriods]
  );

  return (
    <>
      <PageHeader
        title="Consumo de horas"
        description="Movimientos de tu bolsa de horas: asignaciones mensuales, consumo por ticket y ajustes."
        actions={
          <Field label="Periodo" htmlFor="period">
            <Select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Todos los periodos"
              options={periodOptions}
              style={{ width: 200 }}
            />
          </Field>
        }
      />

      {error && <Alert tone="danger" title="No pudimos cargar tus horas">{error}</Alert>}

      {loading ? (
        <Loading label="Cargando movimientos…" />
      ) : (
        <>
          <div className="trn-stats" style={{ marginBottom: 20 }}>
            <Stat label="Horas asignadas" value={formatHours(totals.allocated)} hint={period ? formatPeriod(period) : 'Acumulado histórico'} />
            <Stat label="Horas consumidas" value={formatHours(totals.consumed)} />
            <Stat
              label="Saldo"
              value={formatHours(totals.balance, { signed: true })}
              tone={totals.balance < 0 ? 'danger' : 'success'}
              hint={totals.balance < 0 ? 'Excedente por facturar' : 'A favor'}
            />
          </div>

          {periods.length === 0 ? (
            <Card>
              <div className="trn-empty">
                <p className="trn-empty__title">Sin movimientos</p>
                <p className="trn-empty__desc">
                  {period
                    ? `No hay registros de horas en ${formatPeriod(period)}.`
                    : 'Todavía no se han registrado horas en tu cuenta.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="trn-stack">
              {periods.map(({ period: key, rows, balance }) => (
                <Card
                  key={key}
                  title={formatPeriod(key)}
                  subtitle={`${rows.length} ${rows.length === 1 ? 'movimiento' : 'movimientos'}`}
                  actions={
                    <Badge tone={balance < 0 ? 'danger' : 'success'}>
                      Saldo {formatHours(balance, { signed: true })}
                    </Badge>
                  }
                  flush
                >
                  <Table
                    columns={[
                      { key: 'date', label: 'Fecha', width: 130 },
                      { key: 'type', label: 'Tipo', width: 150 },
                      { key: 'desc', label: 'Concepto' },
                      { key: 'ticket', label: 'Ticket', width: 150 },
                      { key: 'hours', label: 'Horas', align: 'right', width: 110 },
                    ]}
                  >
                    {rows.length === 0 ? (
                      <TableEmpty colSpan={5} />
                    ) : (
                      rows.map((entry) => {
                        const type = describe(LEDGER_TYPE, entry.type);
                        const value = Number(entry.hours);
                        return (
                          <tr key={entry.id}>
                            <td className="trn-muted trn-nowrap">{formatDate(entry.created_at)}</td>
                            <td><Badge tone={type.tone}>{type.label}</Badge></td>
                            <td><div className="trn-truncate">{entry.description || '—'}</div></td>
                            <td className="t-mono trn-muted">{entry.tickets?.folio || '—'}</td>
                            <td className={`num ${value < 0 ? 'trn-neg' : 'trn-pos'}`}>{formatHours(value, { signed: true })}</td>
                          </tr>
                        );
                      })
                    )}
                  </Table>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
