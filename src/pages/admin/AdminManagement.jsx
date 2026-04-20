import React, { useEffect, useState } from 'react';
import { ShieldCheck, MoreVertical, Plus, X } from 'lucide-react';
import { adminService } from '../../services/api';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Admin',
    status: 'Active',
  });

  const loadAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getAdmins();
      setAdmins(response.items || []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setForm({ username: '', email: '', password: '', role: 'Admin', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setForm({
      username: admin.username || '',
      email: admin.email || '',
      password: '',
      role: admin.role || 'Admin',
      status: admin.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingAdmin(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingAdmin) {
        const payload = {
          username: form.username,
          email: form.email,
          role: form.role,
          status: form.status,
          is_admin: true,
        };
        if (form.password) payload.password = form.password;
        await adminService.updateAdmin(editingAdmin.id, payload);
      } else {
        await adminService.createAdmin({
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          status: form.status,
          is_admin: true,
        });
      }
      closeModal();
      await loadAdmins();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin) => {
    const confirmed = window.confirm(`Delete admin ${admin.username}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await adminService.deleteAdmin(admin.id);
      await loadAdmins();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to delete admin');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage administrators, roles and permissions.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 font-medium"
        >
          <Plus className="w-5 h-5" />
          Invite Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading admins...</p>
        )}
        {!loading && admins.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No admin accounts found.</p>
        )}
        {!loading && admins.map((admin) => {
          const adminDisplayName = admin.username || admin.full_name || admin.name || 'Admin';
          const adminInitial = adminDisplayName.charAt(0).toUpperCase();

          return (
          <div key={admin.id} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative group overflow-hidden">
            {/* Background design element */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${
              admin.role === 'Superadmin' ? 'bg-purple-500' : 'bg-blue-500'
            }`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 text-xl">
                {adminInitial}
              </div>
              <button
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => openEditModal(admin)}
                title="Edit admin"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{adminDisplayName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{admin.email}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{admin.role}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {admin.status === 'Active' ? (
                  <span className="text-emerald-500 font-medium tracking-wide">• Active</span>
                ) : (
                  <span>{admin.status}</span>
                )}
                <button
                  onClick={() => handleDelete(admin)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {editingAdmin ? 'Edit Admin' : 'Invite Admin'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <input
                required
                type="text"
                placeholder="Name"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <input
                type="password"
                required={!editingAdmin}
                placeholder={editingAdmin ? 'Leave blank to keep password' : 'Temporary password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option>Admin</option>
                </select>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option>Active</option>
                  <option>Offline</option>
                  <option>Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingAdmin ? 'Update' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
