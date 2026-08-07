import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const roleColors = {
  admin: { bg: '#f3e8ff', text: '#7c3aed' },
  agent: { bg: '#dbeafe', text: '#1d4ed8' },
  client_user: { bg: '#dcfce7', text: '#166534' },
};

const emptyForm = { email: '', password: '', fullName: '', role: 'client_user', clientId: '' };

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [usersData, clientsData] = await Promise.all([api.getUsers(), api.getClients()]);
      setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      setClients(Array.isArray(clientsData) ? clientsData : clientsData.clients || []);
    } catch (err) {
      alert('Error al cargar datos: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...form };
      if (payload.role !== 'client_user') delete payload.clientId;
      if (editingUser) {
        if (!payload.password) delete payload.password;
        await api.updateUser(editingUser.id, payload);
      } else {
        await api.createUser(payload);
      }
      closeForm();
      loadAll();
    } catch (err) {
      alert('Error al guardar: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email || '',
      password: '',
      fullName: user.full_name || '',
      role: user.role || 'client_user',
      clientId: user.client_id || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Ingresa la nueva contraseña (mínimo 6 caracteres):');
    if (!newPassword || newPassword.length < 6) {
      if (newPassword !== null) alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      const result = await api.resetPassword(userId, newPassword);
      alert('Contraseña restablecida exitosamente');
    } catch (err) {
      alert('Error: ' + (err.message || ''));
    }
  };

  const handleToggleActive = async (user) => {
    const action = user.is_active || user.active ? 'desactivar' : 'activar';
    if (!confirm(`¿${action} este usuario?`)) return;
    try {
      await api.updateUser(user.id, { active: !(user.is_active || user.active) });
      loadAll();
    } catch (err) {
      alert('Error: ' + (err.message || ''));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Cargando usuarios...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111' }}>Usuarios</h1>
        <button
          onClick={() => { setShowForm(true); setEditingUser(null); setForm(emptyForm); }}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 24,
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Nombre completo</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                {editingUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="admin">Administrador</option>
                <option value="agent">Agente</option>
                <option value="client_user">Usuario cliente</option>
              </select>
            </div>
            {form.role === 'client_user' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Cliente</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={closeForm}
              style={{
                padding: '8px 20px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Nombre</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Correo</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Rol</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Cliente</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const rc = roleColors[user.role] || roleColors.client_user;
              const isActive = user.is_active !== undefined ? user.is_active : user.active;
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 500, color: '#111' }}>{user.full_name || '—'}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#6b7280' }}>{user.email}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: rc.bg,
                      color: rc.text,
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#374151' }}>{user.clients?.company_name || '—'}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      background: isActive ? '#dcfce7' : '#f3f4f6',
                      color: isActive ? '#166534' : '#6b7280',
                    }}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          padding: '5px 10px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          color: '#374151',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        style={{
                          padding: '5px 10px',
                          background: '#fffbeb',
                          border: '1px solid #fcd34d',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          color: '#92400e',
                        }}
                      >
                        Restablecer pass
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        style={{
                          padding: '5px 10px',
                          background: isActive ? '#fef2f2' : '#dcfce7',
                          border: isActive ? '1px solid #fca5a5' : '1px solid #86efac',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 11,
                          color: isActive ? '#dc2626' : '#166534',
                        }}
                      >
                        {isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
