import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Field, Loading, PageHeader, Select, Table, TableEmpty,
} from '../../components/ui';
import {
  TICKET_PRIORITY, TICKET_STATUS, TICKET_TYPE, describe, formatDate, optionsOf,
} from '../../lib/domain';
import { IconPlus } from '../../components/Icons';

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', type: '' });

  const load = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getClientTickets(params);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters); }, [load, filters]);

  const setFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  const hasFilters = Boolean(filters.status || filters.type);

  return (
    <>
      <PageHeader
        title="Tickets"
        description="Solicitudes de soporte, incidencias y desarrollos que has abierto con nuestro equipo."
        actions={
          <Button as={Link} to="/portal/tickets/nuevo" variant="primary">
            <IconPlus size={15} color="currentColor" />
            Nuevo ticket
          </Button>
        }
      />

      <div className="trn-toolbar">
        <Field label="Estado">
          <Select value={filters.status} onChange={setFilter('status')} placeholder="Todos" options={optionsOf(TICKET_STATUS)} />
        </Field>
        <Field label="Tipo">
          <Select value={filters.type} onChange={setFilter('type')} placeholder="Todos" options={optionsOf(TICKET_TYPE)} />
        </Field>
        {hasFilters && (
          <div className="trn-toolbar__actions">
            <Button variant="ghost" onClick={() => setFilters({ status: '', type: '' })}>Limpiar filtros</Button>
          </div>
        )}
      </div>

      {error && <Alert tone="danger" title="No pudimos cargar tus tickets">{error}</Alert>}

      <Card flush>
        {loading ? (
          <Loading label="Cargando tickets…" />
        ) : (
          <Table
            columns={[
              { key: 'folio', label: 'Folio', width: 150 },
              { key: 'title', label: 'Asunto' },
              { key: 'type', label: 'Tipo', width: 170 },
              { key: 'priority', label: 'Prioridad', width: 120 },
              { key: 'status', label: 'Estado', width: 170 },
              { key: 'created', label: 'Creado', width: 130 },
            ]}
          >
            {tickets.length === 0 ? (
              <TableEmpty colSpan={6}>
                {hasFilters ? 'Ningún ticket coincide con los filtros' : 'Todavía no has abierto ningún ticket'}
              </TableEmpty>
            ) : (
              tickets.map((t) => {
                const status = describe(TICKET_STATUS, t.status);
                const priority = describe(TICKET_PRIORITY, t.priority);
                const type = describe(TICKET_TYPE, t.type);
                return (
                  <tr key={t.id} className="is-clickable" onClick={() => navigate(`/portal/tickets/${t.id}`)}>
                    <td className="t-mono">{t.folio}</td>
                    <td className="t-strong"><div className="trn-truncate">{t.title}</div></td>
                    <td className="trn-muted">{type.label}</td>
                    <td><Badge tone={priority.tone}>{priority.label}</Badge></td>
                    <td><Badge tone={status.tone} dot>{status.label}</Badge></td>
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
