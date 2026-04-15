import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical, Plus, X } from 'lucide-react';

import type { AppUser, UserRole } from '../models/admin';
import { adminService } from '../services/adminService';

export function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('consultant');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('consultant');

  const loadUsers = async () => {
    try {
      const rows = await adminService.listUsers();
      setUsers(rows);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar usuarios');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const isValidEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

  const roleLabel = (role: UserRole) => (role === 'admin' ? 'Administrador' : 'Consultor');

  const handleCreate = async () => {
    if (!createUsername.trim() || !createEmail.trim() || !createPassword.trim()) {
      setError('Usuario, correo y contraseña son requeridos');
      return;
    }
    if (!isValidEmail(createEmail)) {
      setError('Correo invalido');
      return;
    }

    await adminService.createUser({
      username: createUsername.trim(),
      email: createEmail.trim(),
      password: createPassword,
      role: createRole,
    });

    setCreateUsername('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('consultant');
    setIsCreateModalOpen(false);
    await loadUsers();
  };

  const openEdit = (user: AppUser) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditPassword('');
    setEditRole(user.role);
    setIsEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editingUserId) return;
    if (!editUsername.trim() || !editEmail.trim()) {
      setError('Usuario y correo son requeridos');
      return;
    }
    if (!isValidEmail(editEmail)) {
      setError('Correo invalido');
      return;
    }

    await adminService.updateUser(editingUserId, {
      username: editUsername.trim(),
      email: editEmail.trim(),
      role: editRole,
      ...(editPassword.trim() ? { password: editPassword } : {}),
    });

    setIsEditModalOpen(false);
    await loadUsers();
  };

  const handleDelete = async (userId: string) => {
    await adminService.deleteUser(userId);
    await loadUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Administración de usuarios con rol administrador o consultor.</p>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/40 text-gray-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 text-left">Usuario</th>
                <th className="py-3 px-4 text-left">Correo</th>
                <th className="py-3 px-4 text-center">Contraseña</th>
                <th className="py-3 px-4 text-center">Rol</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="py-3 px-4 text-gray-800 dark:text-slate-100 text-left">{user.username}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-slate-300 text-left">{user.email}</td>
                  <td className="py-3 px-4 text-center text-gray-600 dark:text-slate-400">********</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                          : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                      }`}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                          <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="min-w-44 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-xl p-1">
                          <DropdownMenu.Item onClick={() => openEdit(user)} className="px-3 py-2 rounded-md text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer outline-none">
                            Editar
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onClick={() => handleDelete(user.id)} className="px-3 py-2 rounded-md text-sm text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer outline-none">
                            Eliminar
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-100 dark:border-slate-700 p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">Crear usuario</Dialog.Title>
              <Dialog.Close asChild>
                <button className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <input value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="Usuario" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700" />
              <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="Correo" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700" />
              <input value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} type="password" placeholder="Contraseña" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700" />
              <select value={createRole} onChange={(e) => setCreateRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700">
                <option value="consultant">Consultor</option>
                <option value="admin">Administrador</option>
              </select>
              <button onClick={handleCreate} className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700">Crear</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-100 dark:border-slate-700 p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">Editar usuario</Dialog.Title>
              <Dialog.Close asChild>
                <button className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Usuario" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700" />
              <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Correo" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700" />
              <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} type="password" placeholder="Nueva contraseña (opcional)" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700" />
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700">
                <option value="consultant">Consultor</option>
                <option value="admin">Administrador</option>
              </select>
              <button onClick={handleEdit} className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700">Guardar cambios</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
