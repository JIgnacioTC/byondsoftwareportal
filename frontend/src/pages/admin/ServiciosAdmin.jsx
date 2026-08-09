import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Checkbox, Field, Input, Loading, Modal,
  PageHeader, Select, Table, TableEmpty, Textarea,
} from '../../components/ui';
import { parseFeatures } from '../../lib/domain';
import { ServiceIcon } from '../../components/Icons';

const ICON_OPTIONS = [
  { value: 'code', label: 'Código' },
  { value: 'support', label: 'Soporte' },
  { value: 'monitor', label: 'Monitoreo' },
  { value: 'shield', label: 'Seguridad' },
  { value: 'consulting', label: 'Consultoría' },
  { value: 'migrate', label: 'Migración' },
];

const EMPTY_FORM = {
  slug: '', title: '', subtitle: '', description: '', features: '',
  icon: 'code', active: true, sortOrder: 0,
};

const slugify = (value) => value
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export default function ServiciosAdmin() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(null); // { service|null, form }
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setEditor({ service: null, form: EMPTY_FORM });
  const openEdit = (service) => setEditor({
    service,
    form: {
      slug: service.slug || '',
      title: service.title || '',
      subtitle: service.subtitle || '',
      description: service.description || '',
      features: parseFeatures(service.features).join('\n'),
      icon: service.icon || 'code',
      active: service.active !== false,
      sortOrder: service.sort_order ?? 0,
    },
  });

  const setForm = (patch) => setEditor((s) => ({ ...s, form: { ...s.form, ...patch } }));

  const handleSave = async (e) => {
    e?.preventDefault();
    const { service, form } = editor;
    if (!form.title.trim()) {
      setNotice({ tone: 'warn', text: 'El título es obligatorio.' });
      return;
    }
    const slug = (service ? form.slug : form.slug || slugify(form.title)).trim();
    if (!slug) {
      setNotice({ tone: 'warn', text: 'El identificador (slug) es obligatorio.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    // The API uses snake_case for this resource.
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      icon: form.icon,
      active: form.active,
      sort_order: parseInt(form.sortOrder, 10) || 0,
    };
    try {
      if (service) await api.updateAdminService(service.slug, payload);
      else await api.createAdminService({ ...payload, slug });
      setEditor(null);
      setNotice({ tone: 'success', text: service ? 'Servicio actualizado.' : 'Servicio creado.' });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service) => {
    if (!window.confirm(`¿Eliminar "${service.title}"? Dejará de aparecer en el sitio público.`)) return;
    setNotice(null);
    try {
      await api.deleteAdminService(service.slug);
      setNotice({ tone: 'success', text: 'Servicio eliminado.' });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    }
  };

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Tarjetas de servicio que se publican en la landing y en la página de Servicios."
        actions={<Button variant="primary" onClick={openCreate}>Nuevo servicio</Button>}
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert tone="danger" title="No se pudieron cargar los servicios">{error}</Alert>}

      <Card flush>
        {loading ? (
          <Loading label="Cargando servicios…" />
        ) : (
          <Table
            columns={[
              { key: 'service', label: 'Servicio' },
              { key: 'slug', label: 'Slug', width: 170 },
              { key: 'order', label: 'Orden', align: 'right', width: 90 },
              { key: 'active', label: 'Visible', width: 110 },
              { key: 'actions', label: '', width: 180 },
            ]}
          >
            {services.length === 0 ? (
              <TableEmpty colSpan={5}>No hay servicios configurados</TableEmpty>
            ) : (
              services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="trn-row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center',
                        background: 'var(--trn-navy)', color: 'var(--trn-cream)', flexShrink: 0,
                      }}>
                        <ServiceIcon name={service.icon} size={17} color="currentColor" />
                      </span>
                      <div className="trn-cellstack">
                        <span className="t-strong">{service.title}</span>
                        <span className="trn-cellstack__sub trn-truncate">{service.subtitle || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="trn-muted t-mono">{service.slug}</td>
                  <td className="num trn-muted">{service.sort_order ?? 0}</td>
                  <td><Badge tone={service.active ? 'success' : 'neutral'} dot>{service.active ? 'Sí' : 'No'}</Badge></td>
                  <td>
                    <div className="trn-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(service)}>Editar</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(service)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </Card>

      {editor && (
        <Modal
          wide
          title={editor.service ? `Editar servicio: ${editor.service.title}` : 'Nuevo servicio'}
          subtitle={editor.service?.slug}
          onClose={() => setEditor(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </>
          }
        >
          <form onSubmit={handleSave} className="trn-stack">
            <div className="trn-formgrid trn-formgrid--2">
              <Field label="Título" htmlFor="title">
                <Input id="title" value={editor.form.title} onChange={(e) => setForm({ title: e.target.value })} autoFocus />
              </Field>
              <Field label="Subtítulo" htmlFor="subtitle">
                <Input id="subtitle" value={editor.form.subtitle} onChange={(e) => setForm({ subtitle: e.target.value })} />
              </Field>
            </div>

            {!editor.service && (
              <Field label="Identificador (slug)" htmlFor="slug" hint="Se usa en la URL. Si lo dejas vacío se genera desde el título.">
                <Input
                  id="slug"
                  className="trn-input trn-mono"
                  value={editor.form.slug}
                  onChange={(e) => setForm({ slug: slugify(e.target.value) })}
                  placeholder={slugify(editor.form.title) || 'mi-servicio'}
                />
              </Field>
            )}

            <Field label="Descripción" htmlFor="description">
              <Textarea id="description" rows={3} value={editor.form.description} onChange={(e) => setForm({ description: e.target.value })} />
            </Field>

            <Field label="Características" htmlFor="features" hint="Una por línea.">
              <Textarea id="features" rows={5} value={editor.form.features} onChange={(e) => setForm({ features: e.target.value })} />
            </Field>

            <div className="trn-formgrid">
              <Field label="Icono" htmlFor="icon">
                <Select id="icon" value={editor.form.icon} onChange={(e) => setForm({ icon: e.target.value })} options={ICON_OPTIONS} />
              </Field>
              <Field label="Orden" htmlFor="sortOrder">
                <Input id="sortOrder" type="number" step="1" value={editor.form.sortOrder} onChange={(e) => setForm({ sortOrder: e.target.value })} />
              </Field>
              <Field label="Visibilidad">
                <div style={{ paddingTop: 8 }}>
                  <Checkbox label="Publicar en el sitio" checked={editor.form.active} onChange={(e) => setForm({ active: e.target.checked })} />
                </div>
              </Field>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
