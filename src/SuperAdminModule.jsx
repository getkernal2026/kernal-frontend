import { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api.js';
import { supabase } from './lib/supabase.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt$ = (cents, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

const fmtDate = (ts) =>
  ts ? new Date(ts * 1000 || ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const PLAN_COLORS = {
  starter:    'bg-gray-500/20 text-gray-300',
  growth:     'bg-blue-500/20 text-blue-300',
  enterprise: 'bg-violet-500/20 text-violet-300',
};

const STATUS_COLORS = {
  active:    'bg-emerald-500/20 text-emerald-300',
  suspended: 'bg-amber-500/20 text-amber-300',
  churned:   'bg-red-500/20 text-red-300',
};

const ROLE_COLORS = {
  admin:     'bg-rose-500/15 text-rose-300',
  manager:   'bg-blue-500/15 text-blue-300',
  staff:     'bg-gray-500/15 text-gray-300',
  warehouse: 'bg-amber-500/15 text-amber-300',
  viewer:    'bg-gray-500/10 text-gray-400',
};

function Badge({ label, color }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>;
}

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.superadmin.getStats()
      .then((r) => setStats(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 p-6">Loading stats…</div>;
  if (error)   return <div className="text-red-400 p-6">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-white">Platform Overview</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tenants"   value={stats.totalTenants}  sub={`${stats.activeTenants} active`} color="text-white" />
        <StatCard label="Total Users"     value={stats.totalUsers}    sub={`${stats.activeUsers} active`}  color="text-white" />
        <StatCard label="New Tenants (30d)" value={stats.newTenants30d} color="text-emerald-400" />
        <StatCard label="New Users (30d)"   value={stats.newUsers30d}   color="text-blue-400" />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-300 mb-4">Tenants by Plan</p>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.planCounts).map(([plan, count]) => (
            <div key={plan} className="text-center">
              <p className="text-xl font-bold text-white">{count}</p>
              <Badge label={plan.charAt(0).toUpperCase() + plan.slice(1)} color={PLAN_COLORS[plan] || ''} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Tenants ──────────────────────────────────────────────────────────────
function TenantsTab() {
  const [tenants, setTenants]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [inviteTarget, setInviteTarget] = useState(null); // tenant to add a user to
  const [search, setSearch]         = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.superadmin.listTenants()
      .then((r) => setTenants(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = tenants.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
  );

  // ── Create form ──────────────────────────────────────────────────────────
  function CreateForm({ onClose, onCreated }) {
    const [form, setForm] = useState({
      name: '', slug: '', plan: 'starter',
      admin_email: '', admin_password: '', admin_name: '',
    });
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
      e.preventDefault();
      setBusy(true); setErr(null);
      try {
        const body = { name: form.name, slug: form.slug, plan: form.plan };
        if (form.admin_email) {
          body.admin_email    = form.admin_email;
          body.admin_password = form.admin_password;
          body.admin_name     = form.admin_name;
        }
        await api.superadmin.createTenant(body);
        onCreated();
        onClose();
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <form onSubmit={submit} className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
          <h3 className="text-lg font-semibold text-white">New Tenant</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Company Name *</label>
            <input value={form.name} onChange={set('name')} required
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Slug * (lowercase, hyphens only)</label>
            <input value={form.slug} onChange={set('slug')} required pattern="[a-z0-9-]+"
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Plan</label>
            <select value={form.plan} onChange={set('plan')}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 mb-3">First Admin (optional)</p>
            <div className="space-y-3">
              <input value={form.admin_name} onChange={set('admin_name')} placeholder="Full name"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              <input value={form.admin_email} onChange={set('admin_email')} type="email" placeholder="Email"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              <input value={form.admin_password} onChange={set('admin_password')} type="password" placeholder="Temporary password"
                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={busy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium disabled:opacity-50">
              {busy ? 'Creating…' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Edit modal ───────────────────────────────────────────────────────────
  function EditModal({ tenant, onClose, onSaved }) {
    const [form, setForm] = useState({ name: tenant.name, plan: tenant.plan, status: tenant.status });
    const [err, setErr]   = useState(null);
    const [busy, setBusy] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const save = async (e) => {
      e.preventDefault();
      setBusy(true); setErr(null);
      try {
        await api.superadmin.updateTenant(tenant.id, form);
        onSaved(); onClose();
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <form onSubmit={save} className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm space-y-4">
          <h3 className="text-lg font-semibold text-white">Edit: {tenant.name}</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input value={form.name} onChange={set('name')}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Plan</label>
            <select value={form.plan} onChange={set('plan')}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status} onChange={set('status')}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={busy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Add-user-to-tenant modal ─────────────────────────────────────────────
  function InviteUserModal({ tenant, onClose, onCreated }) {
    const [form, setForm] = useState({ full_name: '', email: '', role: 'admin', job_class: '' });
    const [err, setErr]   = useState(null);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
      e.preventDefault();
      setBusy(true); setErr(null);
      try {
        await api.superadmin.inviteUser({
          tenant_id: tenant.id,
          email:     form.email,
          full_name: form.full_name,
          role:      form.role,
          job_class: form.job_class || undefined,
        });
        setDone(true);
        onCreated();
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
          {done ? (
            <>
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-white font-semibold">User created!</p>
                <p className="text-sm text-gray-400 mt-1">
                  They can log in with their email and the default password <span className="font-mono text-amber-300">password</span>.
                  They will be required to set a new password on first login.
                </p>
              </div>
              <div className="flex justify-center">
                <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium">Done</button>
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Add User</h3>
                <p className="text-sm text-gray-400 mt-0.5">Tenant: <span className="text-white">{tenant.name}</span></p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
                <input value={form.full_name} onChange={set('full_name')} required
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email *</label>
                <input value={form.email} onChange={set('email')} type="email" required
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Role *</label>
                <select value={form.role} onChange={set('role')}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  {['viewer', 'staff', 'warehouse', 'manager', 'admin'].map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Job Title (optional)</label>
                <input value={form.job_class} onChange={set('job_class')} placeholder="e.g. Warehouse Lead"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2 text-xs text-amber-300">
                Default password: <span className="font-mono font-bold">password</span> — user will be forced to change it on first login.
              </div>
              {err && <p className="text-red-400 text-sm">{err}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={busy}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium disabled:opacity-50">
                  {busy ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-gray-400 p-6">Loading tenants…</div>;
  if (error)   return <div className="text-red-400 p-6">Error: {error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Tenants ({tenants.length})</h2>
        <div className="flex gap-3 items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-500" />
          <button onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium">
            + New Tenant
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Company</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Slug</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Plan</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Status</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Users</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Created</th>
              <th className="text-xs text-gray-400 font-medium pb-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-800/40">
                <td className="py-3 pr-4 text-white font-medium">{t.name}</td>
                <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{t.slug}</td>
                <td className="py-3 pr-4"><Badge label={t.plan} color={PLAN_COLORS[t.plan] || ''} /></td>
                <td className="py-3 pr-4"><Badge label={t.status} color={STATUS_COLORS[t.status] || ''} /></td>
                <td className="py-3 pr-4 text-gray-300">{t.user_count}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{fmtDate(t.created_at)}</td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setInviteTarget(t)}
                      className="text-xs text-emerald-400 hover:text-emerald-300">+ User</button>
                    <button onClick={() => setEditTenant(t)}
                      className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-gray-500">No tenants found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate  && <CreateForm onClose={() => setShowCreate(false)} onCreated={load} />}
      {editTenant  && <EditModal tenant={editTenant} onClose={() => setEditTenant(null)} onSaved={load} />}
      {inviteTarget && <InviteUserModal tenant={inviteTarget} onClose={() => setInviteTarget(null)} onCreated={load} />}
    </div>
  );
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab({ tenants }) {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filterTenant, setFilterTenant] = useState('');
  const [search, setSearch]       = useState('');
  const [editUser, setEditUser]   = useState(null);
  const [resetTarget, setResetTarget] = useState(null); // user to reset password for

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterTenant) params.tenant_id = filterTenant;
    api.superadmin.listUsers(params)
      .then((r) => setUsers(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterTenant]);

  useEffect(load, [load]);

  const filtered = users.filter((u) =>
    !search ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  function EditUserModal({ user, onClose, onSaved }) {
    const [form, setForm] = useState({ full_name: user.full_name || '', role: user.role, is_active: user.is_active });
    const [err, setErr]   = useState(null);
    const [busy, setBusy] = useState(false);

    const save = async (e) => {
      e.preventDefault();
      setBusy(true); setErr(null);
      try {
        await api.superadmin.updateUser(user.id, form);
        onSaved(); onClose();
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <form onSubmit={save} className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm space-y-4">
          <h3 className="text-lg font-semibold text-white">Edit User</h3>
          <p className="text-sm text-gray-400">{user.email}</p>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Name</label>
            <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
              {['viewer', 'staff', 'warehouse', 'manager', 'admin'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="accent-blue-500" />
            <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={busy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Reset password modal ─────────────────────────────────────────────────
  function ResetPasswordModal({ user, onClose }) {
    const [pwd, setPwd]   = useState('');
    const [conf, setConf] = useState('');
    const [err, setErr]   = useState(null);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      if (pwd.length < 6)    return setErr('Password must be at least 6 characters.');
      if (pwd !== conf)      return setErr('Passwords do not match.');
      setBusy(true); setErr(null);
      try {
        await api.superadmin.resetPassword(user.id, pwd);
        setDone(true);
      } catch (e) {
        setErr(e.message);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm space-y-4">
          {done ? (
            <>
              <div className="text-center py-4">
                <p className="text-2xl mb-2">🔑</p>
                <p className="text-white font-semibold">Password reset!</p>
                <p className="text-sm text-gray-400 mt-1">
                  {user.full_name || user.email} will be required to set a new password on next login.
                </p>
              </div>
              <div className="flex justify-center">
                <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium">Done</button>
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Reset Password</h3>
                <p className="text-sm text-gray-400 mt-0.5">{user.full_name || '—'} · {user.email}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">New Password</label>
                <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" required minLength={6}
                  placeholder="Min. 6 characters"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
                <input value={conf} onChange={(e) => setConf(e.target.value)} type="password" required
                  placeholder="Re-enter password"
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <p className="text-xs text-amber-300/80">The user will be forced to choose a new password on their next login.</p>
              {err && <p className="text-red-400 text-sm">{err}</p>}
              <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={busy}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded font-medium disabled:opacity-50">
                  {busy ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-gray-400 p-6">Loading users…</div>;
  if (error)   return <div className="text-red-400 p-6">Error: {error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Users ({users.length})</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <select value={filterTenant} onChange={(e) => setFilterTenant(e.target.value)}
            className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-1.5 text-sm w-52 focus:outline-none focus:border-blue-500">
            <option value="">All Tenants</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name/email…"
            className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Name</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Email</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Tenant</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Role</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Status</th>
              <th className="text-xs text-gray-400 font-medium pb-3 pr-4">Joined</th>
              <th className="text-xs text-gray-400 font-medium pb-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-800/40">
                <td className="py-3 pr-4 text-white">{u.full_name || '—'}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{u.email || '—'}</td>
                <td className="py-3 pr-4 text-gray-300 text-xs">{u.tenants?.name || '—'}</td>
                <td className="py-3 pr-4"><Badge label={u.role} color={ROLE_COLORS[u.role] || ''} /></td>
                <td className="py-3 pr-4">
                  <span className={`text-xs font-medium ${u.is_active ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{fmtDate(u.created_at)}</td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setResetTarget(u)}
                      className="text-xs text-amber-400 hover:text-amber-300">Reset Pwd</button>
                    <button onClick={() => setEditUser(u)}
                      className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-gray-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editUser    && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={load} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  );
}

// ── Tab: Billing ──────────────────────────────────────────────────────────────
function BillingTab({ tenants }) {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [invoices, setInvoices]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [attachPlan, setAttachPlan]         = useState('starter');
  const [attachBusy, setAttachBusy]         = useState(false);
  const [attachMsg, setAttachMsg]           = useState(null);

  const tenant = tenants.find((t) => t.id === selectedTenant);

  useEffect(() => {
    if (!selectedTenant) { setInvoices([]); return; }
    setLoading(true); setError(null);
    api.superadmin.getInvoices(selectedTenant)
      .then((r) => setInvoices(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedTenant]);

  const handleAttach = async () => {
    setAttachBusy(true); setAttachMsg(null);
    try {
      await api.superadmin.attachBilling(selectedTenant, { plan: attachPlan });
      setAttachMsg({ ok: true, text: 'Stripe subscription attached successfully.' });
    } catch (e) {
      setAttachMsg({ ok: false, text: e.message });
    } finally {
      setAttachBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-white">Billing</h2>

      <div className="max-w-sm">
        <label className="block text-xs text-gray-400 mb-1">Select Tenant</label>
        <select value={selectedTenant} onChange={(e) => { setSelectedTenant(e.target.value); setAttachMsg(null); }}
          className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">— Choose tenant —</option>
          {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {tenant && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4 max-w-lg">
          <div className="flex items-center gap-3">
            <p className="text-white font-medium">{tenant.name}</p>
            <Badge label={tenant.plan} color={PLAN_COLORS[tenant.plan] || ''} />
            <Badge label={tenant.status} color={STATUS_COLORS[tenant.status] || ''} />
          </div>

          {tenant.stripe_customer_id ? (
            <div className="text-xs text-gray-400 font-mono space-y-1">
              <p>Stripe Customer: <span className="text-gray-300">{tenant.stripe_customer_id}</span></p>
              {tenant.stripe_subscription_id && (
                <p>Subscription: <span className="text-gray-300">{tenant.stripe_subscription_id}</span></p>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-gray-600 rounded p-3 space-y-3">
              <p className="text-sm text-gray-400">No Stripe subscription attached.</p>
              <div className="flex items-center gap-3">
                <select value={attachPlan} onChange={(e) => setAttachPlan(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <button onClick={handleAttach} disabled={attachBusy}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium disabled:opacity-50">
                  {attachBusy ? 'Attaching…' : 'Attach Stripe Subscription'}
                </button>
              </div>
              {attachMsg && (
                <p className={`text-sm ${attachMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{attachMsg.text}</p>
              )}
              <p className="text-xs text-gray-500">Requires STRIPE_SECRET_KEY + price IDs set on Railway.</p>
            </div>
          )}
        </div>
      )}

      {selectedTenant && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Invoices</h3>
          {loading && <p className="text-gray-400 text-sm">Loading invoices…</p>}
          {error   && <p className="text-red-400 text-sm">{error}</p>}
          {!loading && !error && invoices.length === 0 && (
            <p className="text-gray-500 text-sm">No invoices found.</p>
          )}
          {invoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="text-xs text-gray-400 font-medium pb-2 pr-4">Invoice #</th>
                    <th className="text-xs text-gray-400 font-medium pb-2 pr-4">Status</th>
                    <th className="text-xs text-gray-400 font-medium pb-2 pr-4">Amount</th>
                    <th className="text-xs text-gray-400 font-medium pb-2 pr-4">Period</th>
                    <th className="text-xs text-gray-400 font-medium pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-800/40">
                      <td className="py-2 pr-4 text-gray-300 font-mono text-xs">{inv.number || inv.id}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs font-medium ${inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'open' ? 'text-amber-400' : 'text-red-400'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-white">{fmt$(inv.amount_paid || inv.amount_due, inv.currency)}</td>
                      <td className="py-2 pr-4 text-gray-400 text-xs">
                        {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                      </td>
                      <td className="py-2">
                        {inv.hosted_url && (
                          <a href={inv.hosted_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300">View</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'tenants',  label: '🏢 Tenants' },
  { id: 'users',    label: '👤 Users' },
  { id: 'billing',  label: '💳 Billing' },
];

export default function SuperAdminModule({ authUser, onSignOut }) {
  const [tab, setTab]         = useState('overview');
  const [tenants, setTenants] = useState([]);

  // Pre-load tenants list (shared by Users + Billing tabs)
  useEffect(() => {
    api.superadmin.listTenants()
      .then((r) => setTenants(r.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white">Kernel</span>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-violet-500/20 text-violet-300">
            superadmin
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>{authUser?.email}</span>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded hover:border-gray-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="flex gap-1 px-4 pt-4 bg-gray-950 border-b border-gray-800 shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === t.id
                ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'tenants'  && <TenantsTab />}
        {tab === 'users'    && <UsersTab tenants={tenants} />}
        {tab === 'billing'  && <BillingTab tenants={tenants} />}
      </main>
    </div>
  );
}
