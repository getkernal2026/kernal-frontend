import { useState } from 'react';
import { useKernal, ROLES, ROLE_PERMISSIONS, MODULE_IDS } from './KernalContext.jsx';

// ── Icons ─────────────────────────────────────────────────────────────────────
function UserIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function EditIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
}
function LogInIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
}
function ChevronIcon({ down }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={down ? '6 9 12 15 18 9' : '6 15 12 9 18 15'}/></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function ShieldIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}

// ── Module label map — all 24 modules ────────────────────────────────────────
const MOD_LABELS = {
  // Operations
  inventory:    '📦 Inventory',
  demand:       '📈 Demand Planning',
  warehouse:    '🏭 Warehouse',
  mobilewms:    '📱 Mobile WMS',
  logistics:    '🚚 Delivery Operations',
  gps:          '📡 Fleet Intelligence',
  // Sales
  crm:          '🤝 CRM',
  b2b:          '🏢 B2B Portal',
  field:        '📍 Field Sales',
  pricing:      '🏷️ Pricing Engine',
  // Finance
  procurement:  '🛒 Procurement',
  landedcost:   '⚓ Landed Cost',
  accounting:   '💰 Accounting',
  gl:           '📒 General Ledger',
  approvals:    '✅ Approvals',
  // Admin
  lossPrevention: '🛡️ Compliance & Risk',
  settings:     '⚙️ Settings',
  users:        '👥 Users',
  // Intelligence
  nlquery:      '✨ Ask Kernel',
  reports:      '📊 Report Builder',
  // Platform
  integrations: '🔌 Integrations',
  edi:          '↔️ EDI Integration',
  developer:    '</> Developer API',
  ecommerce:    '🛍️ eCommerce',
};

// Module groups for Role Profiles matrix display
const MOD_GROUPS = [
  { label: 'Operations',    ids: ['inventory','demand','warehouse','mobilewms','logistics','gps'] },
  { label: 'Sales',         ids: ['crm','b2b','field','pricing'] },
  { label: 'Finance',       ids: ['procurement','landedcost','accounting','gl','approvals'] },
  { label: 'Admin',         ids: ['lossPrevention','settings','users'] },
  { label: 'Intelligence',  ids: ['nlquery','reports'] },
  { label: 'Platform',      ids: ['integrations','edi','developer','ecommerce'] },
];

const PERMISSION_OPTS = [
  { value: 'full',   label: 'Full Access', color: 'text-emerald-400' },
  { value: 'view',   label: 'View Only',   color: 'text-sky-400' },
  { value: 'driver', label: 'Driver View', color: 'text-amber-400' },
  { value: 'none',   label: 'No Access',   color: 'text-gray-500' },
];

function permColor(perm) {
  return { full: 'text-emerald-400', view: 'text-sky-400', driver: 'text-amber-400', none: 'text-gray-500' }[perm] || 'text-gray-500';
}
function permBg(perm) {
  return { full: 'bg-emerald-500/10 border-emerald-500/20', view: 'bg-sky-500/10 border-sky-500/20', driver: 'bg-amber-500/10 border-amber-500/20', none: 'bg-gray-800 border-gray-700' }[perm] || 'bg-gray-800 border-gray-700';
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, role, size = 'md' }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const roleData = ROLES[role] || { bg: 'bg-gray-700', color: 'text-gray-300' };
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} ${roleData.bg} rounded-full flex items-center justify-center font-bold ${roleData.color} shrink-0`}>
      {initials}
    </div>
  );
}

// ── Permission pill select ────────────────────────────────────────────────────
function PermSelect({ value, roleDefault, onChange }) {
  const [open, setOpen] = useState(false);
  const isOverride = value !== roleDefault;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={[
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border transition-colors',
          permBg(value), permColor(value),
          isOverride ? 'ring-1 ring-cyan-500/40' : '',
        ].join(' ')}
      >
        {value}
        {isOverride && <span className="text-cyan-400 text-[9px] font-bold">✦</span>}
        <ChevronIcon down={!open} />
      </button>
      {open && (
        <div className="absolute z-20 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[140px] overflow-hidden">
          {roleDefault !== value && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-gray-700 border-b border-gray-700"
            >
              <XIcon /> Reset to role default
            </button>
          )}
          {PERMISSION_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 ${o.color}`}
            >
              {value === o.value && <CheckIcon />}
              {value !== o.value && <span className="w-[13px]" />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── User Detail Panel ─────────────────────────────────────────────────────────
function UserPanel({ user, onClose, onSwitchTo, isAdmin, isAdminOrManager }) {
  const { updateUser, roleProfiles } = useKernal();
  const [name,  setName]  = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role,  setRole]  = useState(user.role);
  const [overrides, setOverrides] = useState({ ...(user.overrides || {}) });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateUser(user.id, { name, email, role, overrides });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setOverride = (modId, val) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (val === null) delete next[modId];
      else next[modId] = val;
      return next;
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <Avatar name={name} role={role} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{name}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
          <XIcon />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
        </div>

        {/* Role — editable by admin only */}
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
            Role {!isAdmin && <span className="text-gray-700">(admin only to change)</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ROLES).map(([r, meta]) => (
              <button
                key={r}
                onClick={() => isAdmin && setRole(r)}
                disabled={!isAdmin}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors',
                  role === r
                    ? `${meta.bg} ${meta.color} border-transparent ring-1 ring-cyan-500/40`
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600',
                  !isAdmin ? 'cursor-default opacity-70' : '',
                ].join(' ')}
              >
                {role === r && <CheckIcon />} {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* Per-module permissions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldIcon />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Module Permissions</span>
            <span className="text-[10px] text-gray-600">✦ = override</span>
          </div>
          <div className="bg-gray-800/50 rounded-lg border border-gray-800 overflow-hidden">
            {MOD_GROUPS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div className="border-t border-gray-800" />}
                <div className="px-3 pt-2 pb-0.5">
                  <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{group.label}</p>
                </div>
                {group.ids.map(modId => {
                  const roleDefault = roleProfiles[role]?.[modId] ?? 'none';
                  const effective   = overrides[modId] !== undefined ? overrides[modId] : roleDefault;
                  return (
                    <div key={modId} className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-800/50">
                      <span className="text-xs text-gray-300">{MOD_LABELS[modId] || modId}</span>
                      <PermSelect
                        value={effective}
                        roleDefault={roleDefault}
                        onChange={val => setOverride(modId, val)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">✦ = personal override (takes precedence over role default). Reset via the dropdown.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
          {/* Save — admin can edit everything; manager can edit name/email only (role locked) */}
          {isAdminOrManager && (
            <button
              onClick={handleSave}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                saved
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20',
              ].join(' ')}
            >
              {saved ? <><CheckIcon /> Saved</> : <><CheckIcon /> Save Changes</>}
            </button>
          )}
          {/* Login As — admin only (prevents privilege escalation) */}
          {isAdmin && (
            <button
              onClick={() => onSwitchTo(user.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              <LogInIcon /> Login As
            </button>
          )}
          {/* Deactivate / Reactivate — admin only */}
          {isAdmin && (
            <button
              onClick={() => { updateUser(user.id, { active: !user.active }); onClose(); }}
              className={[
                'ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                user.active
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
              ].join(' ')}
            >
              {user.active ? 'Deactivate' : 'Reactivate'}
            </button>
          )}
          {!isAdminOrManager && (
            <p className="text-xs text-gray-600 italic">View only — contact an admin to edit users.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose }) {
  const { addUser } = useKernal();
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState('warehouse');

  const handleAdd = () => {
    if (!name.trim()) return;
    addUser({ name: name.trim(), email: email.trim(), role });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-100">Add New User</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"><XIcon /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Full Name *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" type="email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Role</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ROLES).map(([r, meta]) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={[
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors',
                    role === r ? `${meta.bg} ${meta.color} border-transparent` : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600',
                  ].join(' ')}
                >
                  {role === r && <CheckIcon />} {meta.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700 transition-colors">Cancel</button>
          <button onClick={handleAdd} disabled={!name.trim()} className="flex-1 py-2 rounded-lg text-sm font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Add User</button>
        </div>
      </div>
    </div>
  );
}

// ── Role Profiles Tab ─────────────────────────────────────────────────────────
function RoleProfilesTab({ isAdmin }) {
  const { roleProfiles, updateRoleProfile, resetRoleProfile } = useKernal();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [resetConfirm, setResetConfirm] = useState(null);

  const roleData = ROLES[selectedRole] || { label: selectedRole, color: 'text-gray-400', bg: 'bg-gray-700' };
  const profile  = roleProfiles[selectedRole] || {};

  const handleReset = (role) => {
    resetRoleProfile(role);
    setResetConfirm(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-gray-100">Role Profiles</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Define default module access for each job class. Per-user overrides can still be set on individual users.
          {!isAdmin && <span className="text-amber-400 ml-1">View only — admin access required to edit.</span>}
        </p>
      </div>

      {/* Role selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLES).map(([rid, meta]) => (
          <button
            key={rid}
            onClick={() => setSelectedRole(rid)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
              selectedRole === rid
                ? `${meta.bg} ${meta.color} border-transparent ring-1 ring-white/10`
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600 hover:text-gray-200',
            ].join(' ')}
          >
            {meta.label}
          </button>
        ))}
      </div>

      {/* Selected role profile */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Role header */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-800`}>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${roleData.bg} ${roleData.color}`}>
              {roleData.label}
            </span>
            <span className="text-xs text-gray-500">
              — default module access for this job class
            </span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              {resetConfirm === selectedRole ? (
                <>
                  <span className="text-xs text-amber-400">Reset to defaults?</span>
                  <button
                    onClick={() => handleReset(selectedRole)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >Confirm</button>
                  <button
                    onClick={() => setResetConfirm(null)}
                    className="px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >Cancel</button>
                </>
              ) : (
                <button
                  onClick={() => setResetConfirm(selectedRole)}
                  className="px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors"
                >Reset to defaults</button>
              )}
            </div>
          )}
        </div>

        {/* Module matrix grouped by category */}
        {MOD_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="border-t border-gray-800/60" />}
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">{group.label}</p>
            </div>
            {group.ids.map(modId => {
              const current  = profile[modId] ?? 'none';
              const factory  = ROLE_PERMISSIONS[selectedRole]?.[modId] ?? 'none';
              const isModified = current !== factory;
              return (
                <div key={modId} className="flex items-center justify-between gap-2 px-4 py-2 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-300 truncate">{MOD_LABELS[modId] || modId}</span>
                    {isModified && (
                      <span className="text-[9px] font-bold text-cyan-400 whitespace-nowrap">✦ modified</span>
                    )}
                  </div>
                  <PermSelect
                    value={current}
                    roleDefault={factory}
                    onChange={isAdmin ? (val) => updateRoleProfile(selectedRole, modId, val ?? factory) : () => {}}
                  />
                </div>
              );
            })}
          </div>
        ))}

        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-[10px] text-gray-600">
            ✦ = differs from factory default. Changes apply immediately to all users with this role (unless they have a personal override).
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function UserManagementModule() {
  const { users, activeUserId, activeUser, setActiveUserId, getPermission } = useKernal();
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [filter, setFilter]         = useState('all');
  const [mainTab, setMainTab]       = useState('users'); // 'users' | 'roles'

  const isAdmin          = activeUser?.role === 'admin';
  const isAdminOrManager = ['admin', 'manager'].includes(activeUser?.role);

  const selectedUser = users.find(u => u.id === selectedId);

  const filtered = users.filter(u => {
    if (filter === 'active')   return u.active;
    if (filter === 'inactive') return !u.active;
    return true;
  });

  // "Login As" — admin only. Managers and below cannot impersonate other users.
  const handleSwitchTo = (userId) => {
    if (!isAdmin) return;
    setActiveUserId(userId);
    setSelectedId(null);
  };

  // Counts by role for the summary
  const roleCounts = Object.keys(ROLES).reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r && u.active).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-100">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">{users.filter(u => u.active).length} active users · {users.filter(u => !u.active).length} inactive</p>
          </div>
          {isAdmin && mainTab === 'users' && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors shrink-0"
            >
              <PlusIcon /> Add User
            </button>
          )}
        </div>

        {/* Main tab switcher */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {[['users','👥 Users'], ['roles','🛡️ Role Profiles']].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMainTab(k)}
              className={[
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                mainTab === k ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
            >{l}</button>
          ))}
        </div>

        {/* ── Role Profiles tab ── */}
        {mainTab === 'roles' && <RoleProfilesTab isAdmin={isAdmin} />}

        {/* ── Users tab ── */}
        {mainTab === 'users' && <>

        {/* Role summary pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLES).map(([r, meta]) => roleCounts[r] > 0 && (
            <span key={r} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
              {meta.label} <span className="opacity-70">×{roleCounts[r]}</span>
            </span>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {[['all','All'], ['active','Active'], ['inactive','Inactive']].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={[
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === k ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
            >{l}</button>
          ))}
        </div>

        {/* User list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {filtered.map((user, i) => {
            const roleData   = ROLES[user.role] || { label: user.role, color: 'text-gray-400', bg: 'bg-gray-700' };
            const isActive   = user.id === activeUserId;
            const isSelected = user.id === selectedId;
            const hasOverrides = Object.keys(user.overrides || {}).length > 0;

            return (
              <div key={user.id}>
                {i > 0 && <div className="border-t border-gray-800" />}
                <div className={[
                  'flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors',
                  isSelected ? 'bg-gray-800/60' : '',
                  !user.active ? 'opacity-50' : '',
                ].join(' ')}>
                  <Avatar name={user.name} role={user.role} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-100">{user.name}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">
                          Active Session
                        </span>
                      )}
                      {!user.active && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-500">
                          Inactive
                        </span>
                      )}
                      {hasOverrides && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500">
                          ✦ Custom Perms
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleData.bg} ${roleData.color}`}>
                        {roleData.label}
                      </span>
                      <span className="text-xs text-gray-600 truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAdmin && user.active && !isActive && (
                      <button
                        onClick={() => handleSwitchTo(user.id)}
                        title="Login as this user (admin only)"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <LogInIcon />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedId(isSelected ? null : user.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    >
                      <EditIcon />
                    </button>
                  </div>
                </div>

                {/* Inline expanded panel */}
                {isSelected && selectedUser && (
                  <div className="border-t border-gray-800 p-4">
                    <UserPanel
                      key={selectedUser.id}
                      user={selectedUser}
                      onClose={() => setSelectedId(null)}
                      onSwitchTo={handleSwitchTo}
                      isAdmin={isAdmin}
                      isAdminOrManager={isAdminOrManager}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current session info */}
        <div className="text-xs text-gray-600 text-center pb-4">
          Simulation: clicking "Login As" switches the active user context across all modules.
        </div>

        </>} {/* end mainTab === 'users' */}
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
