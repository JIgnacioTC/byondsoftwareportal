import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Alert, Button, Card, Field, Input, PageHeader, Select, Textarea,
} from '../../components/ui';
import { TICKET_PRIORITY, TICKET_TYPE, optionsOf } from '../../lib/domain';
import { IconArrowLeft } from '../../components/Icons';

/** Scoped work needs framing before we can estimate it. */
const NEEDS_SCOPE = ['nuevo_desarrollo', 'actualizacion'];

const EMPTY = { type: 'soporte', priority: 'media', title: '', description: '', goal: '', scope: '' };

export default function NewTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const showScope = NEEDS_SCOPE.includes(form.type);

  const titleError = touched && !form.title.trim() ? 'El asunto es obligatorio' : null;
  const descError = touched && !form.description.trim() ? 'La descripción es obligatoria' : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!form.title.trim() || !form.description.trim()) return;

    let description = form.description.trim();
    if (showScope) {
      if (form.goal.trim()) description += `\n\nObjetivo:\n${form.goal.trim()}`;
      if (form.scope.trim()) description += `\n\nAlcance deseado:\n${form.scope.trim()}`;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Field names must match the API contract (type/priority/title/description).
      const created = await api.createTicket({
        type: form.type,
        priority: form.priority,
        title: form.title.trim(),
        description,
      });
      navigate(created?.id ? `/portal/tickets/${created.id}` : '/portal/tickets');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/portal/tickets')} style={{ marginBottom: 14 }}>
        <IconArrowLeft size={15} color="currentColor" /> Volver a tickets
      </Button>

      <PageHeader
        title="Nuevo ticket"
        description="Cuéntanos qué necesitas. Entre más contexto nos des, más rápido podemos atenderlo."
      />

      {error && <Alert tone="danger" title="No se pudo crear el ticket" onClose={() => setError(null)}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card
          footer={
            <div className="trn-row" style={{ justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => navigate('/portal/tickets')}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Creando…' : 'Crear ticket'}
              </Button>
            </div>
          }
        >
          <div className="trn-formgrid--2 trn-formgrid" style={{ marginBottom: 16 }}>
            <Field label="Tipo de solicitud" htmlFor="type">
              <Select id="type" value={form.type} onChange={set('type')} options={optionsOf(TICKET_TYPE)} />
            </Field>
            <Field label="Prioridad" htmlFor="priority" hint="Usa Crítica solo si el servicio está caído.">
              <Select id="priority" value={form.priority} onChange={set('priority')} options={optionsOf(TICKET_PRIORITY)} />
            </Field>
          </div>

          <Field label="Asunto" htmlFor="title" error={titleError} className="trn-span-all">
            <Input
              id="title"
              value={form.title}
              onChange={set('title')}
              placeholder="Resume el problema o la solicitud en una línea"
              maxLength={255}
            />
          </Field>

          <div style={{ height: 16 }} />

          <Field
            label="Descripción"
            htmlFor="description"
            error={descError}
            hint="Incluye pasos para reproducirlo, capturas o mensajes de error si los tienes."
          >
            <Textarea
              id="description"
              value={form.description}
              onChange={set('description')}
              rows={6}
              placeholder="Describe con detalle qué ocurre y desde cuándo…"
            />
          </Field>

          {showScope && (
            <>
              <hr className="trn-divider" style={{ margin: '20px 0 16px' }} />
              <Alert tone="info" title="Información adicional">
                Este tipo de solicitud requiere una evaluación de alcance antes de estimar horas.
              </Alert>
              <div className="trn-stack">
                <Field label="Objetivo" htmlFor="goal" optional>
                  <Textarea id="goal" value={form.goal} onChange={set('goal')} rows={3} placeholder="¿Qué resultado de negocio buscas con este desarrollo?" />
                </Field>
                <Field label="Alcance deseado" htmlFor="scope" optional>
                  <Textarea id="scope" value={form.scope} onChange={set('scope')} rows={3} placeholder="Funcionalidades incluidas, integraciones, restricciones o fechas clave…" />
                </Field>
              </div>
            </>
          )}
        </Card>
      </form>
    </>
  );
}
