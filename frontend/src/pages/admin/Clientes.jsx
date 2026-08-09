import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Field, Input, Loading, Modal, PageHeader,
  Select, Stat, Table, TableEmpty,
} from '../../components/ui';
import {
  CLIENT_STATUS, LEDGER_TYPE, SUBSCRIPTION_STATUS,
  describe, formatDate, formatHours, optionsOf,
} from '../../lib/domain';
import { IconPlus, IconSearch } from '../../components/Icons';

const EMPTY_CLIENT = { companyName: '', contactName: '', status: 'prospecto' };
const EMPTY_ADJUSTMENT = { hours: '', description: '' };

/** A client's live subscription, preferring an active one over a requested one. */
function activeSubscription(client) {
  const subs = client.subscriptions || [];
  return subs.find((s) => s.status === 'activa') || subs[0] || null;
}

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');

  const [editor, setEditor] = useState(null); // { client|null, form }
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [ledger, setLedger] = useState({ status: 'idle', rows: [], error: null });
  const [adjustment, setAdjustment] = useState(EMPTY_ADJUSTMENT);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setEditor({ client: null, form: EMPTY_CLIENT });
  const openEdit = (client) => setEditor({
    client,
    form: {
      companyName: client.company_name || '',
      contactName: client.contact_name || '',
      status: client.status || 'prospecto',
    },
  });

  const handleSave = async (e) => {
    e.preventDefault();
    const { client, form } = editor;
    if (!form.companyName.trim() || !form.contactName.trim()) {
      setNotice({ tone: 'warn', text: 'Empresa y contacto son obligatorios.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      if (client) await api.updateClient(client.id, form);
      else await api.createClient(form);
      setEditor(null);
      setNotice({ tone: 'success', text: client ? 'Cliente actualizado.' : 'Cliente creado.' });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (client) => {
    if (!window.confirm(`¿Activar la suscripción pendiente de ${client.company_name}? Se asignarán las horas del plan para el periodo en curso.`)) return;
    setNotice(null);
    try {
      await api.activateSubscription(client.id);
      setNotice({ tone: 'success', text: `Suscripción de ${client.company_name} activada.` });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    }
  };

  const loadLedger = useCallback(async (clientId) => {
    setLedger({ status: 'loading', rows: [], error: null });
    try {
      const rows = await api.getAdminClientLedger(clientId);
      setLedger({ status: 'ready', rows: Array.isArray(rows) ? rows : [], error: null });
    } catch (err) {
      setLedger({ status: 'error', rows: [], error: err.message });
    }
  }, []);

  const openDetail = (client) => {
    setDetail(client);
    setAdjustment(EMPTY_ADJUSTMENT);
    loadLedger(client.id);
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    const hours = parseFloat(adjustment.hours);
    if (!Number.isFinite(hours) || hours === 0) {
      setNotice({ tone: 'warn', text: 'Indica un número de horas distinto de cero (usa negativo para descontar).' });
      return;
    }
    if (!adjustment.description.trim()) {
      setNotice({ tone: 'warn', text: 'El motivo del ajuste es obligatorio.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await api.createAdjustment(detail.id, { hours, description: adjustment.description.trim() });
      setAdjustment(EMPTY_ADJUSTMENT);
      await loadLedger(detail.id);
      setNotice({ tone: 'success', text: 'Ajuste registrado.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const term = search.trim().toLowerCase();
  const visible = term
    ? clients.filter((c) =>
      [c.company_name, c.contact_name, c.client_number].some((v) => (v || '').toLowerCase().includes(term)))
    : clients;

  const ledgerBalance = ledger.rows.reduce((s, r) => s + (Number(r.hours) || 0), 0);

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cuentas registradas, su plan vigente y el saldo de horas."
        actions={<Button variant="primary" onClick={openCreate}><IconPlus size={15} color="currentColor" />Nuevo cliente</Button>}
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert tone="danger" title="No se pudieron cargar los clientes">{error}</Alert>}

      <div className="trn-toolbar">
        <Field label="Buscar" className="trn-field--grow">
          <div className="trn-search">
            <IconSearch size={15} color="var(--trn-ink-4)" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Empresa, contacto o número de cliente…" />
          </div>
        </Field>
      </div>

      <Card flush title={loading ? 'Clientes' : `${visible.length} ${visible.length === 1 ? 'cliente' : 'clientes'}`}>
        {loading ? (
          <Loading label="Cargando clientes…" />
        ) : (
          <Table
            columns={[
              { key: 'company', label: 'Empresa', width: 260 },
              { key: 'contact', label: 'Contacto', width: 180 },
              { key: 'status', label: 'Estado', width: 130 },
              { key: 'plan', label: 'Plan', width: 180 },
              { key: 'created', label: 'Alta', width: 115 },
              { key: 'actions', label: '', width: 200 },
            ]}
          >
            {visible.length === 0 ? (
              <TableEmpty colSpan={6}>{term ? 'Ningún cliente coincide con la búsqueda' : 'Todavía no hay clientes'}</TableEmpty>
            ) : (
              visible.map((client) => {
                const status = describe(CLIENT_STATUS, client.status);
                const sub = activeSubscription(client);
                const subStatus = sub ? describe(SUBSCRIPTION_STATUS, sub.status) : null;
                return (
                  <tr key={client.id}>
                    <td>
                      <div className="trn-cellstack">
                        <span className="t-strong">{client.company_name}</span>
                        <span className="trn-cellstack__sub trn-mono">{client.client_number || '—'}</span>
                      </div>
                    </td>
                    <td className="trn-muted">{client.contact_name || '—'}</td>
                    <td><Badge tone={status.tone} dot>{status.label}</Badge></td>
                    <td>
                      {sub ? (
                        <div className="trn-cellstack">
                          <span>{sub.plans?.name || '—'}</span>
                          <span className="trn-cellstack__sub">{subStatus.label}</span>
                        </div>
                      ) : <span className="trn-muted">Sin plan</span>}
                    </td>
                    <td className="trn-muted trn-nowrap">{formatDate(client.created_at)}</td>
                    <td>
                      <div className="trn-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <Button size="sm" variant="secondary" onClick={() => openDetail(client)}>Detalle</Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(client)}>Editar</Button>
                        {sub?.status === 'solicitada' && (
                          <Button size="sm" variant="primary" onClick={() => handleActivate(client)}>Activar</Button>
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
          title={editor.client ? 'Editar cliente' : 'Nuevo cliente'}
          subtitle={editor.client ? editor.client.client_number : 'El número de cliente se genera automáticamente.'}
          onClose={() => setEditor(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </>
          }
        >
          <form onSubmit={handleSave} className="trn-stack">
            <Field label="Nombre de la empresa" htmlFor="companyName">
              <Input
                id="companyName"
                value={editor.form.companyName}
                onChange={(e) => setEditor((s) => ({ ...s, form: { ...s.form, companyName: e.target.value } }))}
                autoFocus
              />
            </Field>
            <Field label="Nombre de contacto" htmlFor="contactName">
              <Input
                id="contactName"
                value={editor.form.contactName}
                onChange={(e) => setEditor((s) => ({ ...s, form: { ...s.form, contactName: e.target.value } }))}
              />
            </Field>
            <Field label="Estado" htmlFor="clientStatus">
              <Select
                id="clientStatus"
                value={editor.form.status}
                onChange={(e) => setEditor((s) => ({ ...s, form: { ...s.form, status: e.target.value } }))}
                options={optionsOf(CLIENT_STATUS)}
              />
            </Field>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal
          wide
          title={detail.company_name}
          subtitle={`${detail.client_number || 'Sin número'} · ${describe(CLIENT_STATUS, detail.status).label}`}
          onClose={() => { setDetail(null); setLedger({ status: 'idle', rows: [], error: null }); }}
        >
          <div className="trn-stats" style={{ marginBottom: 18 }}>
            <Stat label="Contacto" value={<span style={{ fontSize: 16 }}>{detail.contact_name || '—'}</span>} />
            <Stat label="Plan" value={<span style={{ fontSize: 16 }}>{activeSubscription(detail)?.plans?.name || 'Sin plan'}</span>} />
            <Stat
              label="Saldo de horas"
              value={formatHours(ledgerBalance, { signed: true })}
              tone={ledgerBalance < 0 ? 'danger' : 'success'}
            />
          </div>

          <Card title="Ajuste manual de horas" subtitle="Usa un valor negativo para descontar horas." style={{ marginBottom: 18 }}>
            <form onSubmit={handleAdjustment} className="trn-row" style={{ alignItems: 'flex-end', gap: 12 }}>
              <Field label="Horas" htmlFor="adjHours">
                <Input
                  id="adjHours"
                  type="number"
                  step="0.25"
                  value={adjustment.hours}
                  onChange={(e) => setAdjustment({ ...adjustment, hours: e.target.value })}
                  placeholder="2.5"
                  style={{ width: 110 }}
                />
              </Field>
              <Field label="Motivo" htmlFor="adjDesc" className="trn-field--grow">
                <Input
                  id="adjDesc"
                  value={adjustment.description}
                  onChange={(e) => setAdjustment({ ...adjustment, description: e.target.value })}
                  placeholder="Motivo del ajuste"
                />
              </Field>
              <Button type="submit" variant="primary" disabled={saving}>Registrar</Button>
            </form>
          </Card>

          <Card title="Libro de horas" flush>
            {ledger.status === 'loading' && <Loading label="Cargando movimientos…" />}
            {ledger.status === 'error' && (
              <div style={{ padding: 16 }}><Alert tone="danger">{ledger.error}</Alert></div>
            )}
            {ledger.status === 'ready' && (
              <Table
                columns={[
                  { key: 'date', label: 'Fecha', width: 120 },
                  { key: 'period', label: 'Periodo', width: 100 },
                  { key: 'type', label: 'Tipo', width: 140 },
                  { key: 'desc', label: 'Concepto' },
                  { key: 'hours', label: 'Horas', align: 'right', width: 100 },
                ]}
              >
                {ledger.rows.length === 0 ? (
                  <TableEmpty colSpan={5}>Sin movimientos</TableEmpty>
                ) : (
                  ledger.rows.map((row) => {
                    const type = describe(LEDGER_TYPE, row.type);
                    const value = Number(row.hours);
                    return (
                      <tr key={row.id}>
                        <td className="trn-muted trn-nowrap">{formatDate(row.created_at)}</td>
                        <td className="trn-muted trn-mono">{row.period}</td>
                        <td><Badge tone={type.tone}>{type.label}</Badge></td>
                        <td>
                          <div className="trn-truncate">{row.description || '—'}</div>
                          {row.tickets?.folio && <div className="trn-cellstack__sub trn-mono">{row.tickets.folio}</div>}
                        </td>
                        <td className={`num ${value < 0 ? 'trn-neg' : 'trn-pos'}`}>{formatHours(value, { signed: true })}</td>
                      </tr>
                    );
                  })
                )}
              </Table>
            )}
          </Card>
        </Modal>
      )}
    </>
  );
}
