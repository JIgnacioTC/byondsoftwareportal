import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import {
  Alert, Badge, Button, Card, Field, Input, Loading, Modal, PageHeader,
  Select, Table, TableEmpty,
} from '../../components/ui';
import { USER_ROLE, describe, formatDate, initials, optionsOf } from '../../lib/domain';
import { IconKey, IconPlus, IconSearch } from '../../components/Icons';

const EMPTY_FORM = { email: '', password: '', fullName: '', role: 'client_user', clientId: '' };

export default function Usuarios() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');

  const [editor, setEditor] = useState(null); // { user|null, form }
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(null); // { user, password }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, clientsData] = await Promise.all([api.getUsers(), api.getClients()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => setEditor({ user: null, form: EMPTY_FORM });
  const openEdit = (user) => setEditor({
    user,
    form: {
      email: user.email || '',
      password: '',
      fullName: user.full_name || '',
      role: user.role || 'client_user',
      clientId: user.client_id ? String(user.client_id) : '',
    },
  });

  const setForm = (patch) => setEditor((s) => ({ ...s, form: { ...s.form, ...patch } }));

  const handleSave = async (e) => {
    e?.preventDefault();
    const { user, form } = editor;
    if (!form.fullName.trim() || !form.email.trim()) {
      setNotice({ tone: 'warn', text: 'Nombre y correo son obligatorios.' });
      return;
    }
    if (!user && form.password.length < 6) {
      setNotice({ tone: 'warn', text: 'La contraseña inicial debe tener al menos 6 caracteres.' });
      return;
    }
    if (form.role === 'client_user' && !form.clientId) {
      setNotice({ tone: 'warn', text: 'Un usuario cliente debe estar vinculado a un cliente.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        role: form.role,
        clientId: form.role === 'client_user' ? form.clientId : null,
      };
      if (user) {
        await api.updateUser(user.id, payload);
        // The update endpoint does not touch credentials; do it explicitly.
        if (form.password) await api.resetPassword(user.id, form.password);
      } else {
        await api.createUser({ ...payload, password: form.password });
      }
      setEditor(null);
      setNotice({ tone: 'success', text: user ? 'Usuario actualizado.' : 'Usuario creado.' });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetting.password.length < 6) {
      setNotice({ tone: 'warn', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await api.resetPassword(resetting.user.id, resetting.password);
      setResetting(null);
      setNotice({ tone: 'success', text: 'Contraseña restablecida.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    const turningOff = user.active;
    if (!window.confirm(`¿${turningOff ? 'Desactivar' : 'Activar'} el acceso de ${user.full_name || user.email}?`)) return;
    setNotice(null);
    try {
      await api.updateUser(user.id, { active: !turningOff });
      await load();
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message });
    }
  };

  const term = search.trim().toLowerCase();
  const visible = term
    ? users.filter((u) => [u.full_name, u.email, u.clients?.company_name].some((v) => (v || '').toLowerCase().includes(term)))
    : users;

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.company_name }));

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso al portal y a la consola interna."
        actions={<Button variant="primary" onClick={openCreate}><IconPlus size={15} color="currentColor" />Nuevo usuario</Button>}
      />

      {notice && <Alert tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert tone="danger" title="No se pudieron cargar los usuarios">{error}</Alert>}

      <div className="trn-toolbar">
        <Field label="Buscar" className="trn-field--grow">
          <div className="trn-search">
            <IconSearch size={15} color="var(--trn-ink-4)" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, correo o empresa…" />
          </div>
        </Field>
      </div>

      <Card flush title={loading ? 'Usuarios' : `${visible.length} ${visible.length === 1 ? 'usuario' : 'usuarios'}`}>
        {loading ? (
          <Loading label="Cargando usuarios…" />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Usuario' },
              { key: 'role', label: 'Rol', width: 150 },
              { key: 'client', label: 'Cliente', width: 190 },
              { key: 'status', label: 'Acceso', width: 110 },
              { key: 'created', label: 'Alta', width: 120 },
              { key: 'actions', label: '', width: 250 },
            ]}
          >
            {visible.length === 0 ? (
              <TableEmpty colSpan={6}>{term ? 'Ningún usuario coincide' : 'No hay usuarios'}</TableEmpty>
            ) : (
              visible.map((user) => {
                const role = describe(USER_ROLE, user.role);
                const isMe = me?.id === user.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="trn-row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                        <span className="trn-avatar trn-avatar--light" style={{ width: 30, height: 30, fontSize: 11 }}>
                          {initials(user.full_name || user.email)}
                        </span>
                        <div className="trn-cellstack">
                          <span className="t-strong">{user.full_name || '—'}{isMe && <span className="trn-muted" style={{ fontWeight: 400 }}> · tú</span>}</span>
                          <span className="trn-cellstack__sub">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><Badge tone={role.tone}>{role.label}</Badge></td>
                    <td className="trn-muted">{user.clients?.company_name || '—'}</td>
                    <td><Badge tone={user.active ? 'success' : 'neutral'} dot>{user.active ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="trn-muted trn-nowrap">{formatDate(user.created_at)}</td>
                    <td>
                      <div className="trn-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(user)}>Editar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setResetting({ user, password: '' })}>
                          <IconKey size={13} color="currentColor" />Contraseña
                        </Button>
                        {!isMe && (
                          <Button size="sm" variant={user.active ? 'danger' : 'ghost'} onClick={() => handleToggleActive(user)}>
                            {user.active ? 'Desactivar' : 'Activar'}
                          </Button>
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
          title={editor.user ? 'Editar usuario' : 'Nuevo usuario'}
          subtitle={editor.user?.email}
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
              <Field label="Nombre completo" htmlFor="fullName">
                <Input id="fullName" value={editor.form.fullName} onChange={(e) => setForm({ fullName: e.target.value })} autoFocus />
              </Field>
              <Field label="Correo electrónico" htmlFor="email">
                <Input id="email" type="email" value={editor.form.email} onChange={(e) => setForm({ email: e.target.value })} />
              </Field>
              <Field label="Rol" htmlFor="role">
                <Select id="role" value={editor.form.role} onChange={(e) => setForm({ role: e.target.value })} options={optionsOf(USER_ROLE)} />
              </Field>
              {editor.form.role === 'client_user' && (
                <Field label="Cliente" htmlFor="clientId" hint="Determina qué tickets y horas puede ver.">
                  <Select
                    id="clientId"
                    value={editor.form.clientId}
                    onChange={(e) => setForm({ clientId: e.target.value })}
                    placeholder="Selecciona un cliente"
                    options={clientOptions}
                  />
                </Field>
              )}
            </div>
            <Field
              label={editor.user ? 'Nueva contraseña' : 'Contraseña inicial'}
              htmlFor="password"
              optional={Boolean(editor.user)}
              hint={editor.user ? 'Déjalo vacío para no cambiarla.' : 'Mínimo 6 caracteres.'}
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={editor.form.password}
                onChange={(e) => setForm({ password: e.target.value })}
              />
            </Field>
          </form>
        </Modal>
      )}

      {resetting && (
        <Modal
          title="Restablecer contraseña"
          subtitle={resetting.user.email}
          onClose={() => setResetting(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setResetting(null)}>Cancelar</Button>
              <Button variant="primary" onClick={handleResetPassword} disabled={saving}>{saving ? 'Aplicando…' : 'Restablecer'}</Button>
            </>
          }
        >
          <form onSubmit={handleResetPassword}>
            <Field label="Nueva contraseña" htmlFor="newPassword" hint="Mínimo 6 caracteres. Compártela por un canal seguro.">
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={resetting.password}
                onChange={(e) => setResetting((s) => ({ ...s, password: e.target.value }))}
                autoFocus
              />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
}
