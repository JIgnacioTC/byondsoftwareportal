import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, DefinitionList, EmptyState, Loading, Textarea,
} from '../../components/ui';
import {
  TICKET_PRIORITY, TICKET_STATUS, TICKET_TYPE, describe, formatDateTime, initials,
} from '../../lib/domain';
import { IconArrowLeft, IconMessage, IconSend } from '../../components/Icons';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTicket(await api.getClientTicket(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.addClientComment(id, body);
      setComment('');
      await fetchTicket();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status) => {
    setActionError(null);
    try {
      await api.updateClientTicketStatus(id, status);
      await fetchTicket();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <Loading label="Cargando ticket…" />;
  if (error) {
    return (
      <>
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/tickets')} style={{ marginBottom: 16 }}>
          <IconArrowLeft size={15} color="currentColor" /> Volver a tickets
        </Button>
        <Alert tone="danger" title="No pudimos cargar el ticket">{error}</Alert>
      </>
    );
  }
  if (!ticket) return null;

  const status = describe(TICKET_STATUS, ticket.status);
  const priority = describe(TICKET_PRIORITY, ticket.priority);
  const type = describe(TICKET_TYPE, ticket.type);
  const comments = ticket.comments || [];

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/portal/tickets')} style={{ marginBottom: 14 }}>
        <IconArrowLeft size={15} color="currentColor" /> Volver a tickets
      </Button>

      {actionError && <Alert tone="danger" onClose={() => setActionError(null)}>{actionError}</Alert>}

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

          <Card title={`Conversación (${comments.length})`} flush>
            {comments.length === 0 ? (
              <EmptyState
                icon={<IconMessage size={20} />}
                title="Sin mensajes todavía"
                description="Escribe abajo para dar contexto adicional a nuestro equipo."
              />
            ) : (
              <div className="trn-thread">
                {comments.map((c) => (
                  <article key={c.id} className="trn-msg">
                    <div className="trn-msg__head">
                      <span className="trn-msg__who">
                        <span className="trn-avatar trn-avatar--light" style={{ width: 26, height: 26, fontSize: 10.5 }}>
                          {initials(c.users?.full_name)}
                        </span>
                        {c.users?.full_name || 'Equipo TORREN'}
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
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un mensaje para el equipo…"
                rows={3}
                aria-label="Nuevo comentario"
              />
              <div className="trn-row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                <Button type="submit" variant="primary" disabled={submitting || !comment.trim()}>
                  <IconSend size={14} color="currentColor" />
                  {submitting ? 'Enviando…' : 'Enviar mensaje'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="trn-stack">
          <Card title="Detalles">
            <DefinitionList
              items={[
                { label: 'Tipo', value: type.label },
                { label: 'Creado por', value: ticket.creatorName },
                { label: 'Asignado a', value: ticket.assigneeName || 'Pendiente de asignar' },
                { label: 'Fecha de creación', value: formatDateTime(ticket.created_at) },
                { label: 'Resuelto', value: ticket.resolved_at ? formatDateTime(ticket.resolved_at) : 'En curso' },
              ]}
            />
          </Card>

          {(ticket.status === 'resuelto' || ticket.status === 'cerrado') && (
            <Card title="Acciones">
              {ticket.status === 'resuelto' && (
                <>
                  <p className="trn-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                    Si la solución te funciona, cierra el ticket. Si no, puedes seguir comentando.
                  </p>
                  <Button variant="primary" block onClick={() => handleStatusChange('cerrado')}>Cerrar ticket</Button>
                </>
              )}
              {ticket.status === 'cerrado' && (
                <>
                  <p className="trn-muted" style={{ fontSize: 12.5, marginBottom: 10 }}>
                    Este ticket está cerrado. Puedes reabrirlo si el problema volvió a presentarse.
                  </p>
                  <Button variant="secondary" block onClick={() => handleStatusChange('nuevo')}>Reabrir ticket</Button>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
