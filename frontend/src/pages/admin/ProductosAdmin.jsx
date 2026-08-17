import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import {
  Alert, Badge, Button, Card, Checkbox, Field, Input, Loading, Modal,
  PageHeader, Select, Table, TableEmpty, Textarea,
} from '../../components/ui';
import { parseFeatures } from '../../lib/domain';
import { IconBox } from '../../components/Icons';

const ICON_OPTIONS = [
  { value: 'box', label: 'Caja' },
  { value: 'cart', label: 'Carrito' },
  { value: 'users', label: 'Usuarios' },
  { value: 'layers', label: 'Capas' },
];

const EMPTY_FORM = {
  slug: '', name: '', tagline: '', description: '', features: '',
  icon: 'box', imageUrl: '', monthlyPrice: '', demoUrl: '', active: true, sortOrder: 0,
};

// Matches the ServiciosAdmin.jsx slugify implementation for consistency.
const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');
const slugify = (value) => value
  .toLowerCase()
  .normalize('NFD').replace(DIACRITICS_RE, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export default function ProductosAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(null); // { product|null, form }
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setEditor({ product: null, form: EMPTY_FORM });
  const openEdit = (product) => setEditor({
    product,
    form: {
      slug: product.slug || '',
      name: product.name || '',
      tagline: product.tagline || '',
      description: product.description || '',
      features: parseFeatures(product.features).join('\n'),
      icon: product.icon || 'box',
      imageUrl: product.image_url || '',
      monthlyPrice: product.monthly_price ?? '',
      demoUrl: product.demo_url || '',
      active: product.active !== false,
      sortOrder: product.sort_order ?? 0,
    },
  });

  const setForm = (patch) => setEditor((s) => ({ ...s, form: { ...s.form, ...patch } }));

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setNotice({ tone: 'warn', text: 'Formato no soportado. Usa PNG, JPG o WEBP.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ tone: 'warn', text: 'La imagen es demasiado grande (máximo 5MB).' });
      return;
    }

    setUploading(true);
    setNotice(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await api.uploadAdminProductImage(dataUrl);
      setForm({ imageUrl: url });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message || 'No se pudo subir la imagen.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    const { product, form } = editor;
    if (!form.name.trim()) {
      setNotice({ tone: 'warn', text: 'El nombre es obligatorio.' });
      return;
    }
    const slug = (product ? form.slug : form.slug || slugify(form.name)).trim();
    if (!slug) {
      setNotice({ tone: 'warn', text: 'El identificador (slug) es obligatorio.' });
      return;
    }
    const monthlyPrice = parseFloat(form.monthlyPrice);
    if (Number.isNaN(monthlyPrice) || monthlyPrice < 0) {
      setNotice({ tone: 'warn', text: 'El precio mensual debe ser un número válido.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    // The API uses snake_case for this resource.
    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      icon: form.icon,
      image_url: form.imageUrl.trim() || null,
      monthly_price: monthlyPrice,
      demo_url: form.demoUrl.trim() || null,
      active: form.active,
      sort_order: parseInt(form.sortOrder, 10) || 0,
    };
    try {
      if (product) await api.updateAdminProduct(product.id, payload);
      else await api.createAdminProduct({ ...payload, slug });
      setEditor(null);
      setNotice({ tone: 'success', text: product ? 'Producto actualizado.' : 'Producto creado.' });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Dejará de aparecer en /productos.`)) return;
    setNotice(null);
    try {
      await api.deleteAdminProduct(product.id);
      setNotice({ tone: 'success', text: 'Producto eliminado.' });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    }
  };

  return (
    <>
      <PageHeader
        title="Productos"
        description="Software listo para rentar que se publica en /productos."
        actions={<Button variant="primary" onClick={openCreate}>Nuevo producto</Button>}
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert tone="danger" title="No se pudieron cargar los productos">{error}</Alert>}

      <Card flush>
        {loading ? (
          <Loading label="Cargando productos…" />
        ) : (
          <Table
            columns={[
              { key: 'product', label: 'Producto' },
              { key: 'slug', label: 'Slug', width: 150 },
              { key: 'price', label: 'Precio/mes', align: 'right', width: 110 },
              { key: 'order', label: 'Orden', align: 'right', width: 90 },
              { key: 'active', label: 'Visible', width: 110 },
              { key: 'actions', label: '', width: 180 },
            ]}
          >
            {products.length === 0 ? (
              <TableEmpty colSpan={6}>No hay productos configurados</TableEmpty>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="trn-row" style={{ gap: 12, flexWrap: 'nowrap' }}>
                      <span style={{
                        width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                        display: 'grid', placeItems: 'center',
                        background: 'var(--trn-navy)', color: 'var(--trn-cream)',
                      }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <IconBox size={17} color="currentColor" />
                        )}
                      </span>
                      <div className="trn-cellstack">
                        <span className="t-strong">{product.name}</span>
                        <span className="trn-cellstack__sub trn-truncate">{product.tagline || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="trn-muted t-mono">{product.slug}</td>
                  <td className="num trn-muted">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(product.monthly_price)}
                  </td>
                  <td className="num trn-muted">{product.sort_order ?? 0}</td>
                  <td><Badge tone={product.active ? 'success' : 'neutral'} dot>{product.active ? 'Sí' : 'No'}</Badge></td>
                  <td>
                    <div className="trn-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(product)}>Editar</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(product)}>Eliminar</Button>
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
          title={editor.product ? `Editar producto: ${editor.product.name}` : 'Nuevo producto'}
          subtitle={editor.product?.slug}
          onClose={() => setEditor(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
            </>
          }
        >
          <form onSubmit={handleSave} className="trn-stack">
            <Field label="Imagen del producto" hint="PNG, JPG o WEBP. Máximo 5MB. Se muestra en la card de /productos.">
              <div className="trn-row" style={{ gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                  background: 'var(--trn-navy)', display: 'grid', placeItems: 'center', color: 'var(--trn-cream)',
                }}>
                  {editor.form.imageUrl ? (
                    <img src={editor.form.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <IconBox size={28} color="currentColor" />
                  )}
                </div>
                <div className="trn-stack" style={{ gap: 8 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Subiendo…' : editor.form.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                  </Button>
                  {editor.form.imageUrl && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ imageUrl: '' })}>
                      Quitar imagen
                    </Button>
                  )}
                </div>
              </div>
            </Field>

            <div className="trn-formgrid trn-formgrid--2">
              <Field label="Nombre" htmlFor="name">
                <Input id="name" value={editor.form.name} onChange={(e) => setForm({ name: e.target.value })} autoFocus />
              </Field>
              <Field label="Tagline" htmlFor="tagline">
                <Input id="tagline" value={editor.form.tagline} onChange={(e) => setForm({ tagline: e.target.value })} />
              </Field>
            </div>

            {!editor.product && (
              <Field label="Identificador (slug)" htmlFor="slug" hint="Se usa en la URL. Si lo dejas vacío se genera desde el nombre.">
                <Input
                  id="slug"
                  className="trn-input trn-mono"
                  value={editor.form.slug}
                  onChange={(e) => setForm({ slug: slugify(e.target.value) })}
                  placeholder={slugify(editor.form.name) || 'mi-producto'}
                />
              </Field>
            )}

            <Field label="Descripción" htmlFor="description">
              <Textarea id="description" rows={3} value={editor.form.description} onChange={(e) => setForm({ description: e.target.value })} />
            </Field>

            <Field label="Características" htmlFor="features" hint="Una por línea.">
              <Textarea id="features" rows={5} value={editor.form.features} onChange={(e) => setForm({ features: e.target.value })} />
            </Field>

            <div className="trn-formgrid trn-formgrid--2">
              <Field label="Precio mensual (MXN)" htmlFor="monthlyPrice">
                <Input id="monthlyPrice" type="number" step="0.01" min="0" value={editor.form.monthlyPrice} onChange={(e) => setForm({ monthlyPrice: e.target.value })} />
              </Field>
              <Field label="URL de demo" htmlFor="demoUrl" optional hint="Si se deja vacío se muestra 'Demo próximamente'.">
                <Input id="demoUrl" type="url" value={editor.form.demoUrl} onChange={(e) => setForm({ demoUrl: e.target.value })} placeholder="https://..." />
              </Field>
            </div>

            <div className="trn-formgrid">
              <Field label="Icono" htmlFor="icon" hint="Se usa solo si no hay imagen.">
                <Select id="icon" value={editor.form.icon} onChange={(e) => setForm({ icon: e.target.value })} options={ICON_OPTIONS} />
              </Field>
              <Field label="Orden" htmlFor="sortOrder">
                <Input id="sortOrder" type="number" step="1" value={editor.form.sortOrder} onChange={(e) => setForm({ sortOrder: e.target.value })} />
              </Field>
              <Field label="Visibilidad">
                <div style={{ paddingTop: 8 }}>
                  <Checkbox label="Publicar en /productos" checked={editor.form.active} onChange={(e) => setForm({ active: e.target.checked })} />
                </div>
              </Field>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
