import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, UserRole } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime } from '../../lib/utils';
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  Check,
  X,
  Search,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'VERIFIER' as UserRole,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>('/admin/users');
      setUsers(res);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', form);
      setCreateModalOpen(false);
      setForm({ full_name: '', email: '', password: '', role: 'VERIFIER' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Creation failed');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              User & Role Administration
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold border border-slate-300">
              {users.length} Registered Accounts
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Manage administrative credentials, scrutiny officer assignments, and institutional access roles.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Official User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-surface-pure rounded-xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-3.5 border-b border-surface-border flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary/70 border-b border-surface-border text-ink-secondary font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Associated Institution / Bureau</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Toggle Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900">{u.full_name}</div>
                      <div className="text-[11px] text-ink-secondary font-mono">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-teal-primary">
                      {u.role}
                    </td>

                    <td className="py-3.5 px-4 text-ink-secondary">
                      {u.institution_name || 'AICTE Regulatory Bureau HQ'}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-400 font-mono">
                      {formatDateTime(u.last_login_at)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className="px-2.5 py-1 rounded border border-surface-border bg-surface-secondary hover:bg-slate-200 text-xs font-semibold text-navy-900 transition-colors"
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New User Account"
        subtitle="Provision official access for regulatory or institutional personnel"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Official Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Initial Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Assigned Operational Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as any })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-bold"
            >
              <option value="VERIFIER">VERIFIER (Scrutiny Officer)</option>
              <option value="APPROVING_AUTHORITY">APPROVING_AUTHORITY (Decision Maker)</option>
              <option value="ADMIN">ADMIN (System IT Administrator)</option>
              <option value="AUDITOR">AUDITOR (Read-only Compliance Examiner)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-secondary text-navy-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
