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

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMrr = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((cents || 0) / 100);

// Simple inline bar chart for revenue history
function RevenueBar({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <p className="text-sm font-medium text-gray-300 mb-4">Monthly Revenue (12 months)</p>
      <div className="flex items-end gap-1 h-28">
        {data.map((d) => {
          const pct = max > 0 ? (d.amount / max) * 100 : 0;
          return (
            <div key={d.yearMonth} className="flex flex-col items-center flex-1 min-w-0 gap-1">
              <div className="w-full rounded-t" style={{ height: `${Math.max(pct, 2)}%`, background: 'rgba(139,92,246,.7)' }} title={`${d.month}: ${fmtMrr(d.amount)}`} />
              <span className="text-[9px] text-gray-500 truncate w-full text-center">{d.month.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats,   setStats]   = useState(null);
  const [chart,   setChart]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.superadmin.getStats(),
      api.superadmin.revenueChart(12),
    ])
      .then(([statsRes, chartRes]) => {
        setStats(statsRes.data);
        setChart(chartRes.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 p-6">Loading stats…</div>;
  if (error)   return <div className="text-red-400 p-6">Error: {error}</div>;

  const mrrDelta = stats.newMrrThisMonth - (stats.churnedThisMonth > 0 ? stats.churnedThisMonth * 29900 : 0);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-white">Platform Overview</h2>

      {/* Tenant / user counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tenants"     value={stats.totalTenants}  sub={`${stats.activeTenants} active`} color="text-white" />
        <StatCard label="Total Users"       value={stats.totalUsers}    sub={`${stats.activeUsers} active`}   color="text-white" />
        <StatCard label="New Tenants (30d)" value={stats.newTenants30d} color="text-emerald-400" />
        <StatCard label="New Users (30d)"   value={stats.newUsers30d}   color="text-blue-400" />
      </div>

      {/* MRR metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="MRR"
          value={fmtMrr(stats.mrr)}
          sub={stats.mrrSource === 'stripe' ? 'from Stripe' : 'estimated'}
          color="text-violet-400"
        />
        <StatCard
          label="New MRR (this month)"
          value={fmtMrr(stats.newMrrThisMonth)}
          color="text-emerald-400"
        />
        <StatCard
          label="Churned (this month)"
          value={stats.churnedThisMonth}
          sub="tenants"
          color={stats.churnedThisMonth > 0 ? 'text-red-400' : 'text-gray-400'}
        />
        <StatCard
          label="MRR by Plan"
          value={`$${Math.round((stats.mrr || 0) / 100).toLocaleString()}`}
          sub={`S:${stats.planCounts.starter} G:${stats.planCounts.growth} E:${stats.planCounts.enterprise}`}
          color="text-cyan-400"
        />
      </div>

      {/* Revenue chart */}
      <RevenueBar data={chart} />

      {/* Plan breakdown */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-300 mb-4">Tenants by Plan</p>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.planCounts).map(([plan, count]) => (
            <div key={plan} className="text-center">
              <p className="text-xl font-bold text-white">{count}</p>
              <p className="text-xs text-gray-500 mt-1">{fmtMrr(stats.mrrByPlan?.[plan] || 0)} MRR</p>
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

// ── Tab: Bug Management ───────────────────────────────────────────────────────

const AUTOFIX_STATUS = {
  analyzing:    { label: '🔍 Analyzing',  color: 'text-blue-400' },
  patching:     { label: '⚙️ Patching',   color: 'text-amber-400' },
  queued:       { label: '⏳ Queued',     color: 'text-gray-400' },
  pr_open:      { label: '⚡ PR Open',    color: 'text-cyan-400' },
  pr_review:    { label: '👀 PR: Review', color: 'text-amber-400' },
  deployed:     { label: '✅ Deployed',   color: 'text-emerald-400' },
  failed:       { label: '❌ Failed',     color: 'text-red-400' },
  no_change:    { label: '➖ No change',  color: 'text-gray-500' },
  unresolvable: { label: '❓ Unknown file', color: 'text-gray-500' },
};

const SEV_COLORS = {
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  high:     'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  medium:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  low:      'bg-gray-500/20 text-gray-400',
};

const BUG_STATUS_COLORS = {
  open:          'bg-red-500/20 text-red-300',
  investigating: 'bg-amber-500/20 text-amber-300',
  resolved:      'bg-emerald-500/20 text-emerald-300',
  ignored:       'bg-gray-500/20 text-gray-500',
};

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Detail drawer for a single bug report
function BugDetailDrawer({ reportId, onClose, onUpdate }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [notes,   setNotes]   = useState('');

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    api.superadmin.bugs.get(reportId)
      .then(r => { setReport(r); setNotes(r.notes || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reportId]);

  const setStatus = async (status) => {
    setSaving(true);
    try {
      const updated = await api.superadmin.bugs.update(reportId, { status, notes });
      setReport(updated);
      onUpdate(updated);
    } catch {}
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const updated = await api.superadmin.bugs.update(reportId, { notes });
      setReport(updated);
      onUpdate(updated);
    } catch {}
    setSaving(false);
  };

  if (!reportId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 border-l border-gray-700 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">Bug Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Loading…</div>
        ) : !report ? (
          <div className="flex-1 flex items-center justify-center text-red-400">Failed to load</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Meta strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEV_COLORS[report.severity] || ''}`}>{report.severity}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${BUG_STATUS_COLORS[report.status] || ''}`}>{report.status}</span>
              <span className="text-xs text-gray-500">{report.tenants?.name || report.tenant_id?.slice(0, 8) + '…'}</span>
              <span className="text-xs text-gray-500 ml-auto">{timeAgo(report.occurred_at)}</span>
            </div>

            {/* Error message */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Error Message</p>
              <p className="text-sm text-red-300 font-mono break-words bg-gray-800/60 rounded p-3">{report.error_message || '(no message)'}</p>
            </div>

            {/* Context */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-gray-500">Module: </span><span className="text-gray-200">{report.module || '—'}</span></div>
              <div><span className="text-gray-500">Type: </span><span className="text-gray-200">{report.type || '—'}</span></div>
              <div><span className="text-gray-500">User: </span><span className="text-gray-200">{report.user_name || '—'}</span></div>
              <div><span className="text-gray-500">Role: </span><span className="text-gray-200">{report.user_role || '—'}</span></div>
              <div><span className="text-gray-500">Build: </span><span className="text-gray-200 font-mono">{report.build || '—'}</span></div>
              <div><span className="text-gray-500">Session: </span><span className="text-gray-200">{report.session_duration_min != null ? `${report.session_duration_min}m` : '—'}</span></div>
            </div>

            {/* Stack trace */}
            {report.error_stack && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Stack Trace</p>
                <pre className="text-xs text-gray-300 font-mono bg-gray-800/60 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-48">{report.error_stack}</pre>
              </div>
            )}

            {/* Breadcrumb trail */}
            {Array.isArray(report.trail) && report.trail.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Breadcrumb Trail</p>
                <div className="space-y-1">
                  {report.trail.map((t, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-gray-600 font-mono w-14 shrink-0">{t.time || t.ts?.slice(11,19) || '—'}</span>
                      <span className="text-blue-400/70 w-20 shrink-0">{t.category}</span>
                      <span className="text-gray-300">{t.action || t.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AutoFix status */}
            {report.autofix_status && (
              <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 space-y-1.5">
                <p className="text-xs text-gray-400 font-medium">AutoFix</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm font-semibold ${AUTOFIX_STATUS[report.autofix_status]?.color || 'text-gray-400'}`}>
                    {AUTOFIX_STATUS[report.autofix_status]?.label || report.autofix_status}
                  </span>
                  {report.autofix_confidence != null && (
                    <span className="text-xs text-gray-400">Confidence: {report.autofix_confidence}%</span>
                  )}
                  {report.autofix_fix_type && (
                    <span className="text-xs text-gray-400">Type: {report.autofix_fix_type}</span>
                  )}
                </div>
                {report.autofix_pr_url && (
                  <a href={report.autofix_pr_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline">
                    View Pull Request →
                  </a>
                )}
                {report.autofix_branch && (
                  <p className="text-xs text-gray-600 font-mono">{report.autofix_branch}</p>
                )}
              </div>
            )}

            {/* Triage notes */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Triage Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes for your team…"
                className="w-full bg-gray-800 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={saveNotes} disabled={saving}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded font-medium disabled:opacity-50">
                Save Notes
              </button>
              {report.status !== 'investigating' && (
                <button onClick={() => setStatus('investigating')} disabled={saving}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded font-medium disabled:opacity-50">
                  Mark Investigating
                </button>
              )}
              {report.status !== 'resolved' && (
                <button onClick={() => setStatus('resolved')} disabled={saving}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-medium disabled:opacity-50">
                  Mark Resolved
                </button>
              )}
              {report.status !== 'ignored' && (
                <button onClick={() => setStatus('ignored')} disabled={saving}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded font-medium disabled:opacity-50">
                  Ignore
                </button>
              )}
              {report.status !== 'open' && (
                <button onClick={() => setStatus('open')} disabled={saving}
                  className="px-3 py-1.5 bg-red-600/70 hover:bg-red-600 text-white text-xs rounded font-medium disabled:opacity-50">
                  Reopen
                </button>
              )}
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    await api.superadmin.bugs.autofix(reportId);
                    setReport(r => ({ ...r, autofix_status: 'queued' }));
                    onUpdate({ ...report, autofix_status: 'queued' });
                  } catch {}
                  setSaving(false);
                }}
                disabled={saving}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded font-medium disabled:opacity-50 ml-auto">
                ⚡ Re-run AutoFix
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BugsTab({ tenants }) {
  const [reports,  setReports]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);  // report id for drawer

  // Filters
  const [filterTenant,   setFilterTenant]   = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  // Notification settings
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [webhookUrl,  setWebhookUrl]  = useState(() => {
    try { return localStorage.getItem('kernal_superadmin_bug_webhook') || ''; } catch { return ''; }
  });
  const [webhookSaved, setWebhookSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterTenant)   params.tenant_id = filterTenant;
    if (filterStatus)   params.status    = filterStatus;
    if (filterSeverity) params.severity  = filterSeverity;
    params.limit = 200;

    Promise.all([
      api.superadmin.bugs.list(params),
      api.superadmin.bugs.stats(),
    ])
      .then(([listRes, statsRes]) => {
        setReports(listRes.data || []);
        setStats(statsRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterTenant, filterStatus, filterSeverity]);

  useEffect(load, [load]);

  const saveWebhook = () => {
    try { localStorage.setItem('kernal_superadmin_bug_webhook', webhookUrl); } catch {}
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2500);
  };

  const testWebhook = async () => {
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🐛 [Kernel Superadmin] Bug notification test — webhook is working!',
          source: 'kernal-superadmin',
          timestamp: new Date().toISOString(),
        }),
      });
      alert('Test notification sent!');
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  const handleUpdate = (updated) => {
    setReports(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Bug Reports</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded">
            Refresh
          </button>
          <button onClick={() => setShowNotifSettings(!showNotifSettings)}
            className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded">
            🔔 Notifications
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total"       value={stats.total}    color="text-white" />
          <StatCard label="Open"        value={stats.open}     color={stats.open > 0 ? 'text-red-400' : 'text-gray-400'} />
          <StatCard label="Critical"    value={stats.critical} color={stats.critical > 0 ? 'text-red-400' : 'text-gray-400'} />
          <StatCard label="Resolved"    value={stats.resolved} color="text-emerald-400" />
          <StatCard label="Last 24h"    value={stats.last24h}  color={stats.last24h > 0 ? 'text-amber-400' : 'text-gray-400'} />
        </div>
      )}

      {/* Notification settings panel */}
      {showNotifSettings && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-white">Bug Notification Webhook</p>
          <p className="text-xs text-gray-400">Paste a Make.com, Zapier, Slack, or Discord webhook URL. A POST will be sent each time a new bug is reported.</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/…"
              className="flex-1 bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button onClick={saveWebhook} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium">
              {webhookSaved ? '✓ Saved' : 'Save'}
            </button>
            <button onClick={testWebhook} disabled={!webhookUrl}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded font-medium disabled:opacity-40">
              Test
            </button>
          </div>
          <p className="text-xs text-gray-500">Note: This webhook is stored locally in your browser and fires from the frontend when a bug is captured. For server-side alerting, configure a webhook in your infrastructure.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterTenant} onChange={(e) => setFilterTenant(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500">
          <option value="">All Tenants</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {(filterTenant || filterStatus || filterSeverity) && (
          <button onClick={() => { setFilterTenant(''); setFilterStatus(''); setFilterSeverity(''); }}
            className="text-xs text-gray-400 hover:text-white underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading && <div className="text-gray-400 text-sm py-4">Loading reports…</div>}
      {error   && <div className="text-red-400 text-sm py-4">Error: {error}</div>}

      {!loading && !error && reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">🐛</p>
          <p className="text-gray-400 text-sm">No bug reports found. That's a good sign!</p>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="text-xs text-gray-400 font-medium pb-2 pr-3">Severity</th>
                <th className="text-xs text-gray-400 font-medium pb-2 pr-3">Status</th>
                <th className="text-xs text-gray-400 font-medium pb-2 pr-3">AutoFix</th>
                <th className="text-xs text-gray-400 font-medium pb-2 pr-3">Tenant</th>
                <th className="text-xs text-gray-400 font-medium pb-2 pr-3">Module</th>
                <th className="text-xs text-gray-400 font-medium pb-2 pr-3 max-w-xs">Error</th>
                <th className="text-xs text-gray-400 font-medium pb-2 pr-3">When</th>
                <th className="text-xs text-gray-400 font-medium pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {reports.map((r) => (
                <tr key={r.id}
                  onClick={() => setSelected(r.id)}
                  className="hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <td className="py-2.5 pr-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEV_COLORS[r.severity] || ''}`}>
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${BUG_STATUS_COLORS[r.status] || ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    {r.autofix_status ? (
                      <span className={`text-xs font-medium ${AUTOFIX_STATUS[r.autofix_status]?.color || 'text-gray-400'}`}>
                        {AUTOFIX_STATUS[r.autofix_status]?.label || r.autofix_status}
                        {r.autofix_confidence != null && ` ${r.autofix_confidence}%`}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                    {r.autofix_pr_url && (
                      <a href={r.autofix_pr_url} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="ml-1.5 text-[10px] text-blue-400 hover:text-blue-300 underline">PR</a>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-300 text-xs">{r.tenants?.name || '—'}</td>
                  <td className="py-2.5 pr-3 text-gray-400 text-xs font-mono">{r.module || '—'}</td>
                  <td className="py-2.5 pr-3 max-w-xs">
                    <p className="text-gray-200 text-xs truncate max-w-xs">{r.error_message || '—'}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-500 text-xs whitespace-nowrap">{timeAgo(r.occurred_at)}</td>
                  <td className="py-2.5">
                    <button onClick={(e) => { e.stopPropagation(); setSelected(r.id); }}
                      className="text-xs text-blue-400 hover:text-blue-300">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-600 mt-3">{reports.length} report{reports.length !== 1 ? 's' : ''} shown (max 200)</p>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <BugDetailDrawer
          reportId={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
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
  { id: 'bugs',     label: '🐛 Bugs' },
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
        {tab === 'bugs'     && <BugsTab tenants={tenants} />}
      </main>
    </div>
  );
}
