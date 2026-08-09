import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Checkbox, DefinitionList, EmptyState, Field, Input,
  Loading, Select, Table, TableEmpty, Textarea,
} from '../../components/ui';
import {
  TICKET_PRIORITY, TICKET_STATUS, TICKET_TYPE,
  describe, formatDate, formatDateTime, formatHours, initials, optionsOf,
} from '../../lib/domain';
import { IconArrowLeft, IconMessage, IconSend } from '../../components/Icons';

const EMPTY_TIME = { hours: '', workDate: '', notes: '', billable: true };

export default function TicketDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [comment, setComment] = useState({ body: '', isInternal: false });
  const [timeEntry, setTimeEntry] = useState(EMPTY_TIME);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketData, agentsData] = await Promise.all([api.getTicket(id), api.getAgents()]);
      setTicket(ticketData);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /**
   * `field` is the API payload key (status | priority | type | assignedTo);
   * `column` is the DB column the response uses, so local state stays in sync.
   */
  const updateField = async (field, column, value) => {
    const previous = ticket[column];
    setTicket((t) => ({ ...t, [column]: value }));
    setNotice(null);
    try {
      await api.updateTicket(id, { [field]: value });
      await load();
    } catch (err) {
      setTicket((t) => ({ ...t, [column]: previous }));
      setNotice({ tone: 'danger', text: `No se pudo actualizar: ${err.message}` });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const body = comment.body.trim();
    if (!body) return;
    setBusy('comment');
    setNotice(null);
    try {
      await api.addTicketComment(id, { body, isInternal: comment.isInternal });
      setComment({ body: '', isInternal: false });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: `No se pudo publicar el comentario: ${err.message}` });
    } finally {
      setBusy(null);
    }
  };

  const handleAddTime = async (e) => {
    e.preventDefault();
    const hours = parseFloat(timeEntry.hours);
    if (!Number.isFinite(hours) || hours < 0.25) {
      setNotice({ tone: 'warn', text: 'Las horas deben ser al menos 0.25.' });
      return;
    }
    setBusy('time');
    setNotice(null);
    try {
      await api.addTimeEntry(id, {
        hours,
        workDate: timeEntry.workDate || undefined,
        notes: timeEntry.notes,
        billable: timeEntry.billable,
      });
      setTimeEntry(EMPTY_TIME);
      setNotice({ tone: 'success', text: `Se registraron ${hours.toFixed(2)} h en este ticket.` });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: `No se pudo registrar el tiempo: ${err.message}` });
    } finally {
      setBusy(null);
    }
  };

  const totalHours = useMemo(
    () => (ticket?.timeEntries || []).reduce((sum, e) => sum + (Number(e.hours) || 0), 0),
    [ticket],
  );

  if (loading) return <Loading label="Cargando ticket…" />;
  if (error || !ticket) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tickets')} style={{ marginBottom: 16 }}>
          <IconArrowLeft size={15} color="currentColor" /> Volver a tickets
        </Button>
        <Alert tone="danger" title="No se pudo cargar el ticket">{error || 'Ticket no encontrado.'}</Alert>
      </>
    );
  }

  const status = describe(TICKET_STATUS, ticket.status);
  const priority = describe(TICKET_PRIORITY, ticket.priority);
  const type = describe(TICKET_TYPE, ticket.type);
  const comments = ticket.comments || [];
  const timeEntries = ticket.timeEntries || [];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tickets')} style={{ marginBottom: 14 }}>
        <IconArrowLeft size={15} color="currentColor" /> Volver a tickets
      </Button>

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="trn-grid trn-grid--sidebar">
        <div className="trn-stack">
          <Card>
            <p className="trn-eyebrow trn-mono" style={{ letterSpacing: '0.08em' }}>{ticket.folio}</p>
            <h1 style={{ fontSize: 20, fontWeight: 620, letterSpacing: '-0.02em', margin: '0 0 12px' }}>{ticket.title}</h1>
            <div className="trn-row">
              <Badge tone={status.tone} dot>{status.label}</Badge>
              <Badge tone={priority.tone}>Prioridad {priority.label.toLowerCase()}</Badge>
              <Badge tone="neutral">{type.label}</Badge>
            </div>
            <hr className="trn-divider" style={{ margin: '16px 0' }} />
            <div className="trn-prose">{ticket.description || 'Sin descripción.'}</div>
          </Card>

          <Card title={`Comentarios (${comments.length})`} flush>
            {comments.length === 0 ? (
              <EmptyState icon={<IconMessage size={20} />} title="Sin comentarios" description="Nadie ha escrito en este ticket todavía." />
            ) : (
              <div className="trn-thread">
                {comments.map((c) => (
                  <article key={c.id} className={`trn-msg${c.is_internal ? ' trn-msg--internal' : ''}`}>
                    <div className="trn-msg__head">
                      <span className="trn-msg__who">
                        <span className="trn-avatar trn-avatar--light" style={{ width: 26, height: 26, fontSize: 10.5 }}>
                          {initials(c.users?.full_name)}
                        </span>
                        {c.users?.full_name || 'Usuario'}
                        {c.is_internal && <Badge tone="warn">Nota interna</Badge>}
                      </span>
                      <time className="trn-msg__when">{formatDateTime(c.created_at)}</time>
                    </div>
                    <div className="trn-msg__body">{c.body}</div>
                  </article>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} style={{ padding: 16, borderTop: '1px solid var(--trn-line)', background: 'var(--trn-surface-2)' }}>
              <Textarea
                value={comment.body}
                onChange={(e) => setComment({ ...comment, body: e.target.value })}
                placeholder={comment.isInternal ? 'Nota interna, no visible para el cliente…' : 'Respuesta visible para el cliente…'}
                rows={3}
                aria-label="Nuevo comentario"
              />
              <div className="trn-row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                <Checkbox
                  label="Nota interna (no visible para el cliente)"
                  checked={comment.isInternal}
                  onChange={(e) => setComment({ ...comment, isInternal: e.target.checked })}
                />
                <Button type="submit" variant="primary" disabled={busy === 'comment' || !comment.body.trim()}>
                  <IconSend size={14} color="currentColor" />
                  {busy === 'comment' ? 'Enviando…' : 'Publicar'}
                </Button>
              </div>
            </form>
          </Card>

          <Card
            title="Registro de horas"
            subtitle="Las horas facturables descuentan de la bolsa del cliente"
            actions={<Badge tone="neutral">{formatHours(totalHours)} en total</Badge>}
            flush
          >
            <form onSubmit={handleAddTime} style={{ padding: 16, borderBottom: '1px solid var(--trn-line)', background: 'var(--trn-surface-2)' }}>
              <div className="trn-row" style={{ alignItems: 'flex-end', gap: 12 }}>
                <Field label="Horas" htmlFor="hours">
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={timeEntry.hours}
                    onChange={(e) => setTimeEntry({ ...timeEntry, hours: e.target.value })}
                    placeholder="0.25"
                    style={{ width: 100 }}
                  />
                </Field>
                <Field label="Fecha de trabajo" htmlFor="workDate">
                  <Input
                    id="workDate"
                    type="date"
                    value={timeEntry.workDate}
                    onChange={(e) => setTimeEntry({ ...timeEntry, workDate: e.target.value })}
                    style={{ width: 165 }}
                  />
                </Field>
                <Field label="Notas" htmlFor="notes" className="trn-field--grow">
                  <Input
                    id="notes"
                    value={timeEntry.notes}
                    onChange={(e) => setTimeEntry({ ...timeEntry, notes: e.target.value })}
                    placeholder="Qué se trabajó…"
                  />
                </Field>
                <Checkbox
                  label="Facturable"
                  checked={timeEntry.billable}
                  onChange={(e) => setTimeEntry({ ...timeEntry, billable: e.target.checked })}
                />
                <Button type="submit" variant="primary" disabled={busy === 'time'}>
                  {busy === 'time' ? 'Registrando…' : 'Registrar'}
                </Button>
              </div>
            </form>

            <Table
              columns={[
                { key: 'date', label: 'Fecha', width: 130 },
                { key: 'agent', label: 'Agente', width: 180 },
                { key: 'notes', label: 'Notas' },
                { key: 'billable', label: 'Facturable', width: 110 },
                { key: 'hours', label: 'Horas', align: 'right', width: 100 },
              ]}
            >
              {timeEntries.length === 0 ? (
                <TableEmpty colSpan={5}>Sin registros de tiempo</TableEmpty>
              ) : (
                timeEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="trn-muted trn-nowrap">{formatDate(entry.work_date)}</td>
                    <td>{entry.users?.full_name || '—'}</td>
                    <td><div className="trn-truncate">{entry.notes || '—'}</div></td>
                    <td>
                      <Badge tone={entry.billable ? 'success' : 'neutral'}>{entry.billable ? 'Sí' : 'No'}</Badge>
                    </td>
                    <td className="num t-strong">{formatHours(entry.hours)}</td>
                  </tr>
                ))
              )}
            </Table>
          </Card>
        </div>

        <div className="trn-stack">
          <Card title="Gestión">
            <div className="trn-stack" style={{ gap: 14 }}>
              <Field label="Estado" htmlFor="f-status">
                <Select
                  id="f-status"
                  value={ticket.status}
                  onChange={(e) => updateField('status', 'status', e.target.value)}
                  options={optionsOf(TICKET_STATUS)}
                />
              </Field>
              <Field label="Prioridad" htmlFor="f-priority">
                <Select
                  id="f-priority"
                  value={ticket.priority}
                  onChange={(e) => updateField('priority', 'priority', e.target.value)}
                  options={optionsOf(TICKET_PRIORITY)}
                />
              </Field>
              <Field label="Tipo" htmlFor="f-type">
                <Select
                  id="f-type"
                  value={ticket.type}
                  onChange={(e) => updateField('type', 'type', e.target.value)}
                  options={optionsOf(TICKET_TYPE)}
                />
              </Field>
              <Field label="Asignado a" htmlFor="f-assignee">
                <Select
                  id="f-assignee"
                  value={ticket.assigned_to ?? ''}
                  onChange={(e) => updateField('assignedTo', 'assigned_to', e.target.value)}
                  placeholder="Sin asignar"
                  options={agents.map((a) => ({ value: String(a.id), label: a.full_name || a.email }))}
                />
              </Field>
            </div>
          </Card>

          <Card title="Información">
            <DefinitionList
              items={[
                { label: 'Cliente', value: ticket.clientName },
                { label: 'Núm. de cliente', value: ticket.clientNumber },
                { label: 'Creado por', value: ticket.creatorName },
                { label: 'Correo de contacto', value: ticket.creatorEmail },
                { label: 'Creado', value: formatDateTime(ticket.created_at) },
                { label: 'Resuelto', value: ticket.resolved_at ? formatDateTime(ticket.resolved_at) : 'En curso' },
                { label: 'Horas registradas', value: formatHours(totalHours) },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
