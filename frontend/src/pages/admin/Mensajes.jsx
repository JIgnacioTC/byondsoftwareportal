import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Loading, PageHeader, Table, TableEmpty,
} from '../../components/ui';
import { formatDate } from '../../lib/domain';

export default function Mensajes() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(msg) {
    const nextStatus = msg.status === 'nuevo' ? 'atendido' : 'nuevo';
    setUpdatingId(msg.id);
    try {
      const updated = await api.updateAdminMessageStatus(msg.id, nextStatus);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const newCount = messages.filter((m) => m.status === 'nuevo').length;

  return (
    <>
      <PageHeader
        title="Mensajes de contacto"
        description="Solicitudes enviadas desde el formulario público de Contacto."
      />

      {error && <Alert tone="danger" title="No pudimos cargar los mensajes">{error}</Alert>}

      {loading ? (
        <Loading label="Cargando mensajes…" />
      ) : messages.length === 0 ? (
        <Card>
          <div className="trn-empty">
            <p className="trn-empty__title">Sin mensajes todavía</p>
            <p className="trn-empty__desc">Los envíos del formulario de contacto aparecerán aquí.</p>
          </div>
        </Card>
      ) : (
        <Card
          title="Bandeja de entrada"
          subtitle={newCount > 0 ? `${newCount} sin atender` : 'Todo atendido'}
          flush
        >
          <Table
            columns={[
              { key: 'date', label: 'Fecha', width: 120 },
              { key: 'contact', label: 'Contacto' },
              { key: 'service', label: 'Servicio', width: 160 },
              { key: 'message', label: 'Mensaje' },
              { key: 'status', label: 'Estado', width: 110 },
              { key: 'actions', label: '', width: 120 },
            ]}
          >
            {messages.length === 0 ? (
              <TableEmpty colSpan={6} />
            ) : (
              messages.map((msg) => (
                <tr key={msg.id}>
                  <td className="trn-muted trn-nowrap">{formatDate(msg.created_at)}</td>
                  <td>
                    <div>{msg.contact_name}</div>
                    <div className="trn-muted" style={{ fontSize: 12.5 }}>{msg.company_name}</div>
                    <div className="trn-muted" style={{ fontSize: 12.5 }}>{msg.email}{msg.phone ? ` · ${msg.phone}` : ''}</div>
                  </td>
                  <td className="trn-muted">{msg.service || '—'}</td>
                  <td><div className="trn-truncate" style={{ maxWidth: 320 }}>{msg.message || '—'}</div></td>
                  <td><Badge tone={msg.status === 'nuevo' ? 'warn' : 'success'}>{msg.status === 'nuevo' ? 'Nuevo' : 'Atendido'}</Badge></td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updatingId === msg.id}
                      onClick={() => toggleStatus(msg)}
                    >
                      {msg.status === 'nuevo' ? 'Marcar atendido' : 'Reabrir'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}
    </>
  );
}
