import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Field, Input, Loading, PageHeader, Select, Table, TableEmpty,
} from '../../components/ui';
import {
  TICKET_PRIORITY, TICKET_STATUS, TICKET_TYPE, describe, formatDate, optionsOf,
} from '../../lib/domain';
import { IconSearch } from '../../components/Icons';

const EMPTY_FILTERS = { status: '', type: '', priority: '', assignedTo: '', search: '' };

export default function TicketsAdmin() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Draft is what the user is typing; `applied` is what the server was last queried with.
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const load = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTickets(filters);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(applied); }, [load, applied]);

  useEffect(() => {
    api.getAgents()
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => setAgents([]));
  }, []);

  const set = (key) => (e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  const apply = (e) => { e?.preventDefault(); setApplied(draft); };
  const clear = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); };
  const isFiltered = Object.values(applied).some(Boolean);

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Cola completa de solicitudes de todos los clientes."
      />

      <form className="trn-toolbar" onSubmit={apply}>
        <Field label="Estado">
          <Select value={draft.status} onChange={set('status')} placeholder="Todos" options={optionsOf(TICKET_STATUS)} />
        </Field>
        <Field label="Tipo">
          <Select value={draft.type} onChange={set('type')} placeholder="Todos" options={optionsOf(TICKET_TYPE)} />
        </Field>
        <Field label="Prioridad">
          <Select value={draft.priority} onChange={set('priority')} placeholder="Todas" options={optionsOf(TICKET_PRIORITY)} />
        </Field>
        <Field label="Asignado a">
          <Select
            value={draft.assignedTo}
            onChange={set('assignedTo')}
            placeholder="Cualquiera"
            options={agents.map((a) => ({ value: String(a.id), label: a.full_name || a.email }))}
          />
        </Field>
        <Field label="Buscar" className="trn-field--grow">
          <div className="trn-search">
            <IconSearch size={15} color="var(--trn-ink-4)" />
            <Input value={draft.search} onChange={set('search')} placeholder="Folio o asunto…" />
          </div>
        </Field>
        <div className="trn-toolbar__actions">
          <Button type="submit" variant="primary">Filtrar</Button>
          {isFiltered && <Button type="button" variant="ghost" onClick={clear}>Limpiar</Button>}
        </div>
      </form>

      {error && <Alert tone="danger" title="No se pudieron cargar los tickets">{error}</Alert>}

      <Card
        flush
        title={loading ? 'Tickets' : `${tickets.length} ${tickets.length === 1 ? 'ticket' : 'tickets'}`}
      >
        {loading ? (
          <Loading label="Cargando tickets…" />
        ) : (
          <Table
            columns={[
              { key: 'folio', label: 'Folio', width: 155 },
              { key: 'title', label: 'Ticket' },
              { key: 'type', label: 'Tipo', width: 140 },
              { key: 'priority', label: 'Prioridad', width: 105 },
              { key: 'status', label: 'Estado', width: 160 },
              { key: 'assignee', label: 'Asignado a', width: 150 },
              { key: 'created', label: 'Creado', width: 115 },
            ]}
          >
            {tickets.length === 0 ? (
              <TableEmpty colSpan={7}>
                {isFiltered ? 'Ningún ticket coincide con los filtros' : 'No hay tickets registrados'}
              </TableEmpty>
            ) : (
              tickets.map((t) => {
                const status = describe(TICKET_STATUS, t.status);
                const priority = describe(TICKET_PRIORITY, t.priority);
                const type = describe(TICKET_TYPE, t.type);
                return (
                  <tr key={t.id} className="is-clickable" onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                    <td className="t-mono">{t.folio}</td>
                    <td>
                      <div className="trn-cellstack">
                        <span className="t-strong trn-truncate">{t.title}</span>
                        <span className="trn-cellstack__sub">{t.clientName || 'Sin cliente'}</span>
                      </div>
                    </td>
                    <td className="trn-muted">{type.label}</td>
                    <td><Badge tone={priority.tone}>{priority.label}</Badge></td>
                    <td><Badge tone={status.tone} dot>{status.label}</Badge></td>
                    <td className={t.assigneeName ? undefined : 'trn-muted'}>{t.assigneeName || 'Sin asignar'}</td>
                    <td className="trn-muted trn-nowrap">{formatDate(t.created_at)}</td>
                  </tr>
                );
              })
            )}
          </Table>
        )}
      </Card>
    </>
  );
}
