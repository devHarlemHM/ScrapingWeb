import { useEffect, useState } from 'react';

import type { AppUser, UserRole } from '../models/admin';
import { adminService } from '../services/adminService';

export function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('consultant');
  const [error, setError] = useState<string | null>(null);

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

  const handleCreate = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Username, email y password son requeridos');
      return;
    }
    await adminService.createUser({ username: username.trim(), email: email.trim(), password, role });
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('consultant');
    await loadUsers();
  };

  const handleEdit = async (user: AppUser) => {
    const nextUsername = window.prompt('Nuevo username', user.username);
    if (!nextUsername || !nextUsername.trim()) return;
    const nextEmail = window.prompt('Nuevo email', user.email);
    if (!nextEmail || !nextEmail.trim()) return;
    const nextRole = window.prompt('Nuevo role (admin|consultant)', user.role) as UserRole | null;
    if (!nextRole || (nextRole !== 'admin' && nextRole !== 'consultant')) return;

    await adminService.updateUser(user.id, {
      username: nextUsername.trim(),
      email: nextEmail.trim(),
      role: nextRole,
    });
    await loadUsers();
  };

  const handleDelete = async (userId: string) => {
    await adminService.deleteUser(userId);
    await loadUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Gestion de usuarios con rol admin o consultant.</p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="consultant">consultant</option>
            <option value="admin">admin</option>
          </select>
          <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold">
            Crear
          </button>
        </div>

        {error && <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-slate-400">
                <th className="py-2">Username</th>
                <th className="py-2">Email</th>
                <th className="py-2">Password</th>
                <th className="py-2">Role</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100 dark:border-slate-700">
                  <td className="py-2 text-gray-800 dark:text-slate-100">{user.username}</td>
                  <td className="py-2 text-gray-700 dark:text-slate-300">{user.email}</td>
                  <td className="py-2 text-gray-700 dark:text-slate-300">********</td>
                  <td className="py-2 text-gray-700 dark:text-slate-300">{user.role}</td>
                  <td className="py-2 flex gap-2">
                    <button onClick={() => handleEdit(user)} className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="px-2 py-1 rounded bg-rose-100 text-rose-800">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
