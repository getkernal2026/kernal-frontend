import React, { useState, useMemo } from 'react';
import { useKernal, ROLES } from './KernalContext.jsx';
import { UI } from './ui.js';
import {
  ShieldAlert, Activity, Lock, Users as UsersIcon, Search, Filter,
  AlertCircle, AlertTriangle, CheckCircle2, Info, Clock, ChevronRight,
  Package, ShoppingCart, Truck, DollarSign, Building2, Inbox, FileText,
  Settings as SettingsIcon, MapPin, Eye, FlaskConical, ChevronDown,
  QrCode, GitBranch, Printer, Tag, ArrowUpDown, ClipboardList,
  Scale, Gavel, CalendarClock, TriangleAlert, BadgeAlert, Receipt,
  MessageSquareWarning, BadgeCheck, ThumbsDown,
  Thermometer, Wifi, WifiOff, Radio, Zap, Download, X,
} from 'lucide-react';
import { ALLERGEN_DATA, BIG_9, CUSTOMER_ALLERGEN_EXPOSURE } from './shared/allergenData.js';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtRel = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
};

const MODULE_ICONS = {
  inventory:      Package,
  procurement:    ShoppingCart,
  logistics:      Truck,
  accounting:     DollarSign,
  crm:            Building2,
  b2b:            Building2,
  field:          MapPin,
  warehouse:      Package,
  approvals:      Inbox,
  users:          UsersIcon,
  settings:       SettingsIcon,
  lossPrevention: ShieldAlert,
};
const SEVERITY_STYLE = {
  info:     { cls: 'bg-gray-700 text-gray-300 border-gray-600',                Icon: Info,           label: 'Info'     },
  notice:   { cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',          Icon: AlertCircle,    label: 'Notice'   },
  warning:  { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       Icon: AlertTriangle,  label: 'Warning'  },
  critical: { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',          Icon: ShieldAlert,    label: 'Critical' },
};

function SeverityPill({ severity }) {
  const s = SEVERITY_STYLE[severity] || SEVERITY_STYLE.info;
  const Icon = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.cls}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function ModuleChip({ moduleId }) {
  const Icon = MODULE_ICONS[moduleId] || Activity;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
      <Icon className="w-3 h-3" /> {moduleId}
    </span>
  );
}

// ─── Live Journal ────────────────────────────────────────────────────────────
function LiveJournal({ auditLog, users }) {
  const [userFilter,     setUserFilter]     = useState('all');
  const [moduleFilter,   setModuleFilter]   = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search,         setSearch]         = useState('');
  const [activeId,       setActiveId]       = useState(null);
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');

  const modules    = useMemo(() => Array.from(new Set(auditLog.map(e => e.moduleId))).sort(), [auditLog]);
  const activeUsers = useMemo(() => users.filter(u => u.active), [users]);

  const filtered = useMemo(() => auditLog.filter(e => {
    if (userFilter     !== 'all' && e.userId    !== userFilter)     return false;
    if (moduleFilter   !== 'all' && e.moduleId  !== moduleFilter)   return false;
    if (severityFilter !== 'all' && e.severity  !== severityFilter) return false;
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00');
      if (new Date(e.at) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      if (new Date(e.at) > to) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!e.summary?.toLowerCase().includes(q) && !e.entityId?.toLowerCase().includes(q) && !e.userName?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [auditLog, userFilter, moduleFilter, severityFilter, dateFrom, dateTo, search]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Module', 'Action', 'Entity ID', 'Severity', 'User', 'Summary'];
    const rows = filtered.map(e => [
      new Date(e.at).toISOString(),
      e.moduleId || '',
      e.action || '',
      e.entityId || '',
      e.severity || '',
      e.userName || '',
      `"${(e.summary || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `kernal-audit-log-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const active = auditLog.find(e => e.id === activeId);

  // Stats strip
  const stats = useMemo(() => ({
    total:    filtered.length,
    warnings: filtered.filter(e => e.severity === 'warning').length,
    critical: filtered.filter(e => e.severity === 'critical').length,
    notices:  filtered.filter(e => e.severity === 'notice').length,
  }), [filtered]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Events Shown</p><p className="text-2xl font-black text-gray-100 mt-1">{stats.total}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Notices</p><p className="text-2xl font-black text-cyan-400 mt-1">{stats.notices}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Warnings</p><p className="text-2xl font-black text-amber-400 mt-1">{stats.warnings}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Critical</p><p className="text-2xl font-black text-rose-400 mt-1">{stats.critical}</p></div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search summary, entity, or user…" className={`${UI.input} pl-9`} />
        </div>
        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={`${UI.select} w-auto`}>
          <option value="all">All users</option>
          {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({ROLES[u.role]?.label || u.role})</option>)}
        </select>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className={`${UI.select} w-auto`}>
          <option value="all">All modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={`${UI.select} w-auto`}>
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="notice">Notice</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          title="From date"
          className={`${UI.input} w-auto text-xs`}
        />
        <span className="text-gray-600 text-xs">–</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          title="To date"
          className={`${UI.input} w-auto text-xs`}
        />
        <button
          onClick={handleExportCSV}
          className={`${UI.btnSecondary} text-xs shrink-0`}
          title="Export filtered events as CSV"
        >
          ↓ Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '60vh' }}>
        {/* Event list */}
        <div className={`${UI.card} lg:col-span-3 overflow-hidden flex flex-col`}>
          <div className="px-4 py-2.5 border-b border-gray-800 text-xs text-gray-500">
            Showing {filtered.length} of {auditLog.length} events · ordered newest first
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-800/60">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-gray-500 italic">No events match these filters.</div>
            ) : filtered.map(e => (
              <button
                key={e.id}
                onClick={() => setActiveId(e.id)}
                className={`w-full text-left p-4 hover:bg-gray-800/40 transition-colors ${activeId === e.id ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityPill severity={e.severity} />
                      <ModuleChip moduleId={e.moduleId} />
                      <span className="text-[10px] font-mono text-gray-500">{e.action}</span>
                    </div>
                    <p className="text-sm text-gray-100">{e.summary}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                      <span>{e.userName}</span>
                      <span>·</span>
                      <span>{fmtRel(e.at)}</span>
                      {e.entityId && <><span>·</span><span className="font-mono">{e.entityId}</span></>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className={`${UI.card} lg:col-span-2 overflow-hidden flex flex-col`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <Eye className="w-10 h-10 opacity-30 mb-3" />
              <p className="text-sm">Select an event to inspect its before/after diff.</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <SeverityPill severity={active.severity} />
                  <ModuleChip moduleId={active.moduleId} />
                </div>
                <p className="font-bold text-gray-100">{active.summary}</p>
                <p className="text-xs text-gray-500 mt-1">{active.id} · {fmtDateTime(active.at)}</p>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider mb-1">User</p>
                    <p className="text-gray-200 font-bold">{active.userName}</p>
                    <p className="text-gray-500 font-mono">{active.userId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider mb-1">Action</p>
                    <p className="text-gray-200 font-mono">{active.action}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider mb-1">Entity</p>
                    <p className="text-gray-200">{active.entityType}</p>
                    <p className="text-gray-500 font-mono text-[10px]">{active.entityId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase tracking-wider mb-1">Severity</p>
                    <SeverityPill severity={active.severity} />
                  </div>
                </div>

                {(active.before || active.after) && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Diff</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                        <p className="text-[10px] uppercase font-bold text-rose-400 mb-1">Before</p>
                        <pre className="text-[11px] text-gray-300 whitespace-pre-wrap break-words">{active.before ? JSON.stringify(active.before, null, 2) : '(none)'}</pre>
                      </div>
                      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-[10px] uppercase font-bold text-emerald-400 mb-1">After</p>
                        <pre className="text-[11px] text-gray-300 whitespace-pre-wrap break-words">{active.after ? JSON.stringify(active.after, null, 2) : '(none)'}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lockdown ────────────────────────────────────────────────────────────────
function Lockdown({ settings, updateSetting, canEdit }) {
  const strict = !!settings.features?.strictInventoryControl;
  const gates = [
    { id: 'libEdit',  on: strict, label: 'Library lot editor',              desc: 'Direct edits to lot qty, expiry, cost, and QC hold require admin role. Others see read-only.' },
    { id: 'scanIn',   on: strict, label: 'Scanner IN mode',                 desc: 'Inbound barcode receipts require a linked PO ID. Ad-hoc receipts blocked for non-admins.' },
    { id: 'scanOut',  on: strict, label: 'Scanner OUT mode',                desc: 'Outbound barcode removals require a linked order ID. Ad-hoc removals blocked for non-admins.' },
    { id: 'lotDel',   on: strict, label: 'Lot deletion',                    desc: 'Removing a lot record requires admin role. Spoilage/damage writes are logged with reason codes.' },
  ];
  return (
    <div className="space-y-4">
      <div className={`${UI.cardPad} ${strict ? 'border-rose-500/30 bg-rose-500/5' : ''}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${strict ? 'bg-rose-500/15 text-rose-400' : 'bg-gray-800 text-gray-500'}`}><Lock className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-gray-100 text-sm">Strict Inventory Control</h3>
              <p className="text-xs text-gray-500 mt-0.5">Master switch — closes the ad-hoc backdoors that allow stock to enter or leave without a PO or sale link.</p>
              <p className={`text-xs mt-2 font-bold ${strict ? 'text-rose-400' : 'text-gray-500'}`}>{strict ? 'ACTIVE — non-admins are gated' : 'OFF — anyone with inventory access can adjust stock'}</p>
            </div>
          </div>
          <button
            onClick={() => canEdit && updateSetting('features.strictInventoryControl', !strict)}
            disabled={!canEdit}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${strict ? 'bg-rose-500' : 'bg-gray-700'} ${!canEdit ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-gray-950 transition-transform ${strict ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className={UI.cardPad}>
        <h3 className="font-bold text-gray-200 text-sm mb-3">Per-rule status</h3>
        <div className="space-y-2">
          {gates.map(g => (
            <div key={g.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-800 bg-gray-800/30">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-200">{g.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shrink-0 border ${g.on ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                {g.on ? 'Locked' : 'Open'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 italic mt-3">Admins always retain full access. Audit events are emitted regardless of strict-mode status.</p>
      </div>
    </div>
  );
}

// ─── Employee Activity ───────────────────────────────────────────────────────
function EmployeeActivity({ auditLog, users }) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || null);
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Per-user stats — compute over all events
  const userStats = useMemo(() => users.map(u => {
    const events = auditLog.filter(e => e.userId === u.id);
    const inventoryAdjusts = events.filter(e => e.moduleId === 'inventory' && (e.action.startsWith('lot.') || e.action.startsWith('scanner.'))).length;
    const warnings = events.filter(e => e.severity === 'warning').length;
    const lastEvent = events[0]; // newest is index 0 since we prepend
    // Mock anomaly heuristics for demo
    const anomalies = [];
    if (inventoryAdjusts >= 5) anomalies.push(`${inventoryAdjusts} inventory adjustments in audit window`);
    if (warnings >= 2) anomalies.push(`${warnings} warning-level events flagged`);
    return { user: u, events, inventoryAdjusts, warnings, lastEvent, anomalies };
  }), [users, auditLog]);

  const filteredEvents = selectedUserId ? auditLog.filter(e => e.userId === selectedUserId) : [];
  const userAnomalies  = userStats.find(s => s.user.id === selectedUserId)?.anomalies || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Employee list */}
      <div className={`${UI.card} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><UsersIcon className="w-4 h-4 text-cyan-500" /> Employees</h3>
        </div>
        <div className="divide-y divide-gray-800/60 max-h-[60vh] overflow-y-auto">
          {userStats.map(({ user, events, anomalies }) => {
            const roleData = ROLES[user.role] || { label: user.role, color: 'text-gray-400', bg: 'bg-gray-700' };
            const isActive = user.id === selectedUserId;
            return (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full text-left p-3 hover:bg-gray-800/40 transition-colors ${isActive ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${roleData.bg} ${roleData.color}`}>
                    {user.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-100 truncate">{user.name}</p>
                      {anomalies.length > 0 && (
                        <span className="px-1 py-0 rounded-full text-[9px] font-bold bg-amber-500 text-gray-950">{anomalies.length}</span>
                      )}
                    </div>
                    <p className={`text-[10px] ${roleData.color}`}>{roleData.label} · {events.length} events</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity feed for selected user */}
      <div className="lg:col-span-2 space-y-4">
        {selectedUser && (
          <>
            <div className={UI.cardPad}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-100">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{ROLES[selectedUser.role]?.label || selectedUser.role} · {selectedUser.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Total Events</p>
                  <p className="text-2xl font-black text-gray-100">{filteredEvents.length}</p>
                </div>
              </div>
              {userAnomalies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-1.5">
                  <p className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Anomaly Callouts</p>
                  {userAnomalies.map((a, i) => (
                    <p key={i} className="text-xs text-amber-300 pl-4">• {a}</p>
                  ))}
                  <p className="text-[10px] italic text-gray-500 pl-4">Mock heuristics for demo. Production would compute deviation vs role baseline.</p>
                </div>
              )}
            </div>

            <div className={`${UI.card} overflow-hidden`}>
              <div className="px-4 py-3 border-b border-gray-800">
                <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-500" /> Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-800/60 max-h-[60vh] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <p className="p-8 text-center text-gray-500 italic text-sm">No activity for this user yet.</p>
                ) : filteredEvents.slice(0, 50).map(e => (
                  <div key={e.id} className="p-3 hover:bg-gray-800/30">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityPill severity={e.severity} />
                      <ModuleChip moduleId={e.moduleId} />
                      <span className="text-[10px] font-mono text-gray-500">{e.action}</span>
                    </div>
                    <p className="text-sm text-gray-200">{e.summary}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{fmtDateTime(e.at)} · {fmtRel(e.at)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Allergen Recall Simulation ───────────────────────────────────────────────
function AllergenRecall() {
  const [selectedAllergen, setSelectedAllergen] = useState('');
  const [expandedCustomer,  setExpandedCustomer] = useState(null);
  const [reportFired,       setReportFired]      = useState(false);

  const exposure     = selectedAllergen ? (CUSTOMER_ALLERGEN_EXPOSURE[selectedAllergen] || []) : [];
  const affectedSkus = [...new Set(exposure.map(e => e.sku))];
  const containsRows = exposure.filter(e => e.status === 'contains');
  const mayContRows  = exposure.filter(e => e.status === 'may_contain');

  // Group exposure by customer for the customer table
  const byCustomer = exposure.reduce((acc, e) => {
    if (!acc[e.customerId]) acc[e.customerId] = { ...e, orders: [] };
    acc[e.customerId].orders.push(e);
    return acc;
  }, {});

  const allergenInfo = BIG_9.find(a => a.id === selectedAllergen);
  const affectedProducts = affectedSkus.map(sku => ALLERGEN_DATA[sku]).filter(Boolean);

  const statusPill = (s) => s === 'contains'
    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h2 className="font-bold text-gray-100">Allergen Recall Simulation — FSMA 204</h2>
          <p className="text-xs text-gray-500">Select an FDA Big 9 allergen to identify all affected products and customer exposure in the trailing 90 days.</p>
        </div>
      </div>

      {/* Allergen selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Allergen</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {BIG_9.map(a => {
              const exposure_count = (CUSTOMER_ALLERGEN_EXPOSURE[a.id] || []).length;
              const isSelected = selectedAllergen === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => { setSelectedAllergen(isSelected ? '' : a.id); setExpandedCustomer(null); setReportFired(false); }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  <span className="text-xs font-bold leading-tight">{a.label}</span>
                  {exposure_count > 0 && (
                    <span className={`text-[9px] mt-1 px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-rose-500/20 text-rose-300' : 'bg-gray-700 text-gray-500'}`}>
                      {exposure_count} record{exposure_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  {exposure_count === 0 && (
                    <span className="text-[9px] mt-1 text-gray-700">No exposure</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {selectedAllergen && (() => {
        if (exposure.length === 0) return (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-gray-200 font-bold">No Customer Exposure Found</p>
            <p className="text-gray-500 text-sm mt-1">No orders containing <span className="text-white">{allergenInfo?.label}</span> were shipped in the trailing 90 days.</p>
          </div>
        );

        return (
          <div className="space-y-4">

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:'Affected SKUs',       val: affectedSkus.length,                  color:'text-rose-400'   },
                { label:'Unique Customers',    val: Object.keys(byCustomer).length,        color:'text-amber-400'  },
                { label:'Contains Records',    val: containsRows.length,                   color:'text-rose-400'   },
                { label:'May Contain Records', val: mayContRows.length,                    color:'text-amber-400'  },
              ].map(k => (
                <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Affected Products */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-bold text-gray-200">Affected Products</p>
              </div>
              <div className="divide-y divide-gray-800">
                {affectedSkus.map(sku => {
                  const prod = ALLERGEN_DATA[sku];
                  const skuRows = exposure.filter(e => e.sku === sku);
                  const maxStatus = skuRows.some(r => r.status === 'contains') ? 'contains' : 'may_contain';
                  return (
                    <div key={sku} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{prod?.name || sku}</p>
                        <p className="text-xs text-gray-600 font-mono">{sku}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusPill(maxStatus)}`}>
                          {maxStatus === 'contains' ? 'CONTAINS' : 'MAY CONTAIN'}
                        </span>
                        <span className="text-xs text-gray-500">{skuRows.length} order{skuRows.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Exposure Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-bold text-gray-200">Customer Exposure</p>
                <span className="ml-auto text-xs text-gray-600">trailing 90 days</span>
              </div>
              <div className="divide-y divide-gray-800">
                {Object.values(byCustomer).map(cust => {
                  const isExpanded = expandedCustomer === cust.customerId;
                  const worstStatus = cust.orders.some(o => o.status === 'contains') ? 'contains' : 'may_contain';
                  const totalQty = cust.orders.reduce((s, o) => s + o.qty, 0);
                  return (
                    <div key={cust.customerId}>
                      <button
                        onClick={() => setExpandedCustomer(isExpanded ? null : cust.customerId)}
                        className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-800/40 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-200">{cust.customerName}</p>
                          <p className="text-xs text-gray-500">Contact: {cust.contact} · {cust.orders.length} order{cust.orders.length !== 1 ? 's' : ''} · {totalQty} units</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusPill(worstStatus)}`}>
                            {worstStatus === 'contains' ? 'CONTAINS' : 'MAY CONTAIN'}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-800 bg-gray-800/30">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-600 border-b border-gray-800">
                                <th className="px-5 py-2 text-left font-semibold">Order</th>
                                <th className="px-5 py-2 text-left font-semibold">SKU</th>
                                <th className="px-5 py-2 text-center font-semibold">Qty</th>
                                <th className="px-5 py-2 text-center font-semibold">Date</th>
                                <th className="px-5 py-2 text-center font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {cust.orders.map((o, i) => (
                                <tr key={i} className="text-gray-400">
                                  <td className="px-5 py-2 font-mono text-gray-300">{o.orderId}</td>
                                  <td className="px-5 py-2 truncate max-w-[120px]">{o.skuName}</td>
                                  <td className="px-5 py-2 text-center">{o.qty}</td>
                                  <td className="px-5 py-2 text-center">{o.date}</td>
                                  <td className="px-5 py-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusPill(o.status)}`}>
                                      {o.status === 'contains' ? 'CONTAINS' : 'MAY CONTAIN'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FSMA 204 Report Button */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-200">Generate FSMA 204 Allergen Report</p>
                <p className="text-xs text-gray-500 mt-0.5">Produces a formatted record of all affected lots, customers, and quantities for regulatory submission.</p>
              </div>
              <button
                onClick={() => setReportFired(true)}
                disabled={reportFired}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  reportFired
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                }`}
              >
                <FileText className="w-4 h-4" />
                {reportFired ? 'Report Generated ✓' : 'Generate Report'}
              </button>
            </div>

            {reportFired && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400">
                <p className="font-bold">FSMA 204 Allergen Traceability Report generated.</p>
                <p className="text-emerald-300/70 text-xs mt-1">
                  Report covers {allergenInfo?.label} exposure across {Object.keys(byCustomer).length} customers, {exposure.length} order records.
                  In production this would create a downloadable PDF for FDA submission within the required 24-hour window.
                </p>
              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
}

// ─── FSMA 204 KDE/CTE TRACEABILITY ───────────────────────────────────────────
const COMPANY_INFO = { name: 'Kernal Foods Inc.', addr: '5401 E Hillsborough Ave, Tampa, FL 33610', fda: 'FDA-FTL-FIRM-0078234' };

const CTE_META = {
  harvesting:      { label: 'Harvesting',       color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', step: 1 },
  cooling:         { label: 'Cooling',           color: 'cyan',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    step: 2 },
  initial_packing: { label: 'Initial Packing',   color: 'blue',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    step: 3 },
  shipping:        { label: 'Shipping (Inbound)', color: 'amber',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   step: 4 },
  receiving:       { label: 'Receiving',         color: 'violet',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20',  step: 5 },
};

const FTL_LOTS = [
  { lotId: 'LOT-A-URGENT',  sku: 'FRZ-BEEF-01',  name: 'Premium Ground Beef 80/20',   category: 'Fresh/Frozen Beef',        isFTL: true,  tlc: 'TLC-GCR-2026-0401',  gtin: '10850012345678', expiry: '2026-05-27' },
  { lotId: 'LOT-G-CRITICAL',sku: 'FRZ-SALM-01',  name: 'Atlantic Salmon Fillet 6oz',  category: 'Fresh/Frozen Finfish',     isFTL: true,  tlc: 'TLC-ASF-2026-0415',  gtin: '10850098765432', expiry: '2026-05-28' },
  { lotId: 'LOT-D-CRITICAL',sku: 'PRO-TOMA-01',  name: 'Roma Tomatoes 25lb Case',     category: 'Fresh Tomatoes',           isFTL: true,  tlc: 'TLC-SFI-2026-0425',  gtin: '10850011223344', expiry: '2026-05-29' },
  { lotId: 'LOT-E-WARN',    sku: 'DAI-MILK-02',  name: 'Whole Milk 1 Gal',            category: 'Dairy (fluid milk)',       isFTL: false, tlc: 'TLC-DFD-2026-0501',  gtin: '10850055667788', expiry: '2026-06-01' },
  { lotId: 'LOT-A',         sku: 'FRZ-BEEF-01',  name: 'Premium Ground Beef 80/20',   category: 'Fresh/Frozen Beef',        isFTL: true,  tlc: 'TLC-GCR-2026-0310',  gtin: '10850012345678', expiry: '2026-06-15' },
];

const INIT_CTE_LOG = [
  // LOT-A-URGENT — FRZ-BEEF-01 full chain
  { id: 'CTE-0001', cteType: 'harvesting',      lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', productName: 'Premium Ground Beef 80/20',
    date: '2026-04-01', location: 'Gulf Coast Ranch — Wharton, TX', qty: 500, unit: 'lbs',
    kdes: { tlc: 'TLC-GCR-2026-0401', grower: 'Gulf Coast Ranch LLC', commodity: 'Beef', variety: '80/20 Ground', harvestDate: '2026-04-01', farmAddr: '100 Ranch Rd, Wharton TX 77488', fdaFirmId: 'FDA-FIRM-0041200' },
    referenceDoc: 'USDA-INSP-GCR-0401', enteredBy: 'J. Park' },
  { id: 'CTE-0002', cteType: 'cooling',         lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', productName: 'Premium Ground Beef 80/20',
    date: '2026-04-01', location: 'Gulf Coast Ranch Cold Storage — TX', qty: 500, unit: 'lbs',
    kdes: { tlc: 'TLC-GCR-2026-0401', coolerLocation: 'Gulf Coast Ranch Cold Storage', coolingDate: '2026-04-01', tempF: 34, coolerAddr: '100 Ranch Rd, Wharton TX 77488' },
    referenceDoc: 'TEMP-LOG-GCR-0401', enteredBy: 'J. Park' },
  { id: 'CTE-0003', cteType: 'initial_packing', lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', productName: 'Premium Ground Beef 80/20',
    date: '2026-04-02', location: 'Gulf Coast Proteins — Houston, TX', qty: 500, unit: 'lbs',
    kdes: { tlc: 'TLC-GCR-2026-0401', packerName: 'Gulf Coast Proteins LLC', packDate: '2026-04-02', packAddr: '7200 Mykawa Rd, Houston TX 77033', gtin: '10850012345678', fdaFirmId: 'FDA-FIRM-0087600' },
    referenceDoc: 'PO-GCP-04022026', enteredBy: 'J. Park' },
  { id: 'CTE-0004', cteType: 'shipping',        lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', productName: 'Premium Ground Beef 80/20',
    date: '2026-04-03', location: 'Gulf Coast Proteins — Houston, TX', qty: 500, unit: 'lbs',
    kdes: { tlc: 'TLC-GCR-2026-0401', shipDate: '2026-04-03', shipFrom: 'Gulf Coast Proteins LLC, Houston TX', shipTo: 'Kernal Foods Inc, Tampa FL', carrier: 'Refrigerated Freight Inc', bol: 'BOL-RF-2026-9120' },
    referenceDoc: 'BOL-RF-2026-9120', enteredBy: 'J. Park' },
  { id: 'CTE-0005', cteType: 'receiving',       lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', productName: 'Premium Ground Beef 80/20',
    date: '2026-04-04', location: 'Kernal Foods — Tampa FL (LOC-A)', qty: 500, unit: 'lbs',
    kdes: { tlc: 'TLC-GCR-2026-0401', receiptDate: '2026-04-04', receiveAt: 'Kernal Foods Inc, Tampa FL', poNumber: 'PO-AP-0881', receivedBy: 'Mike T.', tempOnArrival: 35 },
    referenceDoc: 'PO-AP-0881', enteredBy: 'M. Torres' },

  // LOT-G-CRITICAL — FRZ-SALM-01 chain
  { id: 'CTE-0006', cteType: 'harvesting',      lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', productName: 'Atlantic Salmon Fillet 6oz',
    date: '2026-04-15', location: 'Atlantic Seafood Farms — Hardangerfjord, Norway', qty: 300, unit: 'lbs',
    kdes: { tlc: 'TLC-ASF-2026-0415', grower: 'Atlantic Seafood Farms AS', commodity: 'Finfish', variety: 'Atlantic Salmon', harvestDate: '2026-04-15', farmAddr: 'Hardangerfjord, Norway', fdaFirmId: 'FDA-FIRM-0099301' },
    referenceDoc: 'ASF-HARV-0415-2026', enteredBy: 'L. Nguyen' },
  { id: 'CTE-0007', cteType: 'initial_packing', lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', productName: 'Atlantic Salmon Fillet 6oz',
    date: '2026-04-16', location: 'ASF Processing — Hardangerfjord, Norway', qty: 300, unit: 'lbs',
    kdes: { tlc: 'TLC-ASF-2026-0415', packerName: 'ASF Processing AS', packDate: '2026-04-16', packAddr: 'Hardangerfjord Processing Facility, Norway', gtin: '10850098765432', fdaFirmId: 'FDA-FIRM-0099301' },
    referenceDoc: 'ASF-PACK-0416-2026', enteredBy: 'L. Nguyen' },
  { id: 'CTE-0008', cteType: 'shipping',        lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', productName: 'Atlantic Salmon Fillet 6oz',
    date: '2026-04-18', location: 'Miami Port of Entry — FL', qty: 300, unit: 'lbs',
    kdes: { tlc: 'TLC-ASF-2026-0415', shipDate: '2026-04-18', shipFrom: 'ASF Processing AS, Norway', shipTo: 'Kernal Foods Inc, Tampa FL', carrier: 'ColdChain Logistics Int\'l', bol: 'BOL-CCL-2026-4418' },
    referenceDoc: 'BOL-CCL-2026-4418', enteredBy: 'L. Nguyen' },
  { id: 'CTE-0009', cteType: 'receiving',       lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', productName: 'Atlantic Salmon Fillet 6oz',
    date: '2026-04-20', location: 'Kernal Foods — Tampa FL (LOC-A)', qty: 300, unit: 'lbs',
    kdes: { tlc: 'TLC-ASF-2026-0415', receiptDate: '2026-04-20', receiveAt: 'Kernal Foods Inc, Tampa FL', poNumber: 'PO-AP-0882', receivedBy: 'Carlos R.', tempOnArrival: 28 },
    referenceDoc: 'PO-AP-0882', enteredBy: 'M. Torres' },

  // LOT-D-CRITICAL — PRO-TOMA-01 chain
  { id: 'CTE-0010', cteType: 'harvesting',      lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', productName: 'Roma Tomatoes 25lb Case',
    date: '2026-04-25', location: 'Sunshine Farms — Immokalee, FL', qty: 800, unit: 'lbs',
    kdes: { tlc: 'TLC-SFI-2026-0425', grower: 'Sunshine Farms Immokalee', commodity: 'Fresh Tomatoes', variety: 'Roma', harvestDate: '2026-04-25', farmAddr: '2100 Farm Rd, Immokalee FL 34142', fdaFirmId: 'FDA-FIRM-0055120' },
    referenceDoc: 'HARVEST-SFI-0425', enteredBy: 'D. Boudreaux' },
  { id: 'CTE-0011', cteType: 'cooling',         lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', productName: 'Roma Tomatoes 25lb Case',
    date: '2026-04-25', location: 'Sunshine Farms Packhouse — Immokalee, FL', qty: 800, unit: 'lbs',
    kdes: { tlc: 'TLC-SFI-2026-0425', coolerLocation: 'Sunshine Farms Packhouse Cooler', coolingDate: '2026-04-25', tempF: 55, coolerAddr: '2100 Farm Rd, Immokalee FL 34142' },
    referenceDoc: 'TEMP-SFI-0425', enteredBy: 'D. Boudreaux' },
  { id: 'CTE-0012', cteType: 'initial_packing', lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', productName: 'Roma Tomatoes 25lb Case',
    date: '2026-04-26', location: 'Sunshine Produce Co — Tampa, FL', qty: 800, unit: 'lbs',
    kdes: { tlc: 'TLC-SFI-2026-0425', packerName: 'Sunshine Produce Co.', packDate: '2026-04-26', packAddr: '400 Distribution Way, Tampa FL 33619', gtin: '10850011223344', fdaFirmId: 'FDA-FIRM-0061440' },
    referenceDoc: 'PO-SPC-04262026', enteredBy: 'D. Boudreaux' },
  { id: 'CTE-0013', cteType: 'shipping',        lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', productName: 'Roma Tomatoes 25lb Case',
    date: '2026-04-27', location: 'Sunshine Produce Co — Tampa, FL', qty: 800, unit: 'lbs',
    kdes: { tlc: 'TLC-SFI-2026-0425', shipDate: '2026-04-27', shipFrom: 'Sunshine Produce Co., Tampa FL', shipTo: 'Kernal Foods Inc, Tampa FL', carrier: 'SPC Direct', bol: 'BOL-SPC-2026-1127' },
    referenceDoc: 'BOL-SPC-2026-1127', enteredBy: 'D. Boudreaux' },
  { id: 'CTE-0014', cteType: 'receiving',       lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', productName: 'Roma Tomatoes 25lb Case',
    date: '2026-04-28', location: 'Kernal Foods — Tampa FL (LOC-A)', qty: 800, unit: 'lbs',
    kdes: { tlc: 'TLC-SFI-2026-0425', receiptDate: '2026-04-28', receiveAt: 'Kernal Foods Inc, Tampa FL', poNumber: 'PO-AP-0879', receivedBy: 'Carlos R.', tempOnArrival: 56 },
    referenceDoc: 'PO-AP-0879', enteredBy: 'D. Boudreaux' },

  // LOT-E-WARN — DAI-MILK-02 (non-FTL but tracked)
  { id: 'CTE-0015', cteType: 'initial_packing', lotId: 'LOT-E-WARN', sku: 'DAI-MILK-02', productName: 'Whole Milk 1 Gal',
    date: '2026-05-01', location: 'Dairy Fresh Distributors — Lakeland, FL', qty: 600, unit: 'units',
    kdes: { tlc: 'TLC-DFD-2026-0501', packerName: 'Dairy Fresh Distributors', packDate: '2026-05-01', packAddr: '900 Dairy Rd, Lakeland FL 33801', gtin: '10850055667788', fdaFirmId: 'FDA-FIRM-0072300' },
    referenceDoc: 'DFD-PACK-0501', enteredBy: 'J. Park' },
  { id: 'CTE-0016', cteType: 'shipping',        lotId: 'LOT-E-WARN', sku: 'DAI-MILK-02', productName: 'Whole Milk 1 Gal',
    date: '2026-05-01', location: 'Dairy Fresh Distributors — Lakeland, FL', qty: 600, unit: 'units',
    kdes: { tlc: 'TLC-DFD-2026-0501', shipDate: '2026-05-01', shipFrom: 'Dairy Fresh Distributors, Lakeland FL', shipTo: 'Kernal Foods Inc, Tampa FL', carrier: 'DFD Direct Route', bol: 'BOL-DFD-2026-0501' },
    referenceDoc: 'BOL-DFD-2026-0501', enteredBy: 'J. Park' },
  { id: 'CTE-0017', cteType: 'receiving',       lotId: 'LOT-E-WARN', sku: 'DAI-MILK-02', productName: 'Whole Milk 1 Gal',
    date: '2026-05-02', location: 'Kernal Foods — Tampa FL (LOC-A)', qty: 600, unit: 'units',
    kdes: { tlc: 'TLC-DFD-2026-0501', receiptDate: '2026-05-02', receiveAt: 'Kernal Foods Inc, Tampa FL', poNumber: 'PO-AP-0880', receivedBy: 'Mike T.', tempOnArrival: 38 },
    referenceDoc: 'PO-AP-0880', enteredBy: 'M. Torres' },
];

// Outbound shipments to customers (one-down traceability)
const DOWNSTREAM_SHIPMENTS = [
  { id: 'DS-001', lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', date: '2026-04-10', customer: "Joe's Steakhouse – Downtown",  customerId: 'CUST-501', qty: 85,  unit: 'lbs',   invoiceRef: 'INV-2026-0811' },
  { id: 'DS-002', lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', date: '2026-04-24', customer: "Joe's Steakhouse – Downtown",  customerId: 'CUST-501', qty: 85,  unit: 'lbs',   invoiceRef: 'INV-2026-0839' },
  { id: 'DS-003', lotId: 'LOT-A-URGENT', sku: 'FRZ-BEEF-01', date: '2026-05-08', customer: "Joe's Steakhouse – Downtown",  customerId: 'CUST-501', qty: 85,  unit: 'lbs',   invoiceRef: 'INV-2026-0860' },
  { id: 'DS-004', lotId: 'LOT-G-CRITICAL',sku: 'FRZ-SALM-01', date: '2026-04-25', customer: 'Armature Works Restaurant',    customerId: 'CUST-105', qty: 40,  unit: 'lbs',   invoiceRef: 'INV-2026-0842' },
  { id: 'DS-005', lotId: 'LOT-D-CRITICAL',sku: 'PRO-TOMA-01', date: '2026-05-01', customer: 'City Hospital Cafe',           customerId: 'CUST-502', qty: 125, unit: 'lbs',   invoiceRef: 'INV-2026-0851' },
  { id: 'DS-006', lotId: 'LOT-D-CRITICAL',sku: 'PRO-TOMA-01', date: '2026-05-08', customer: "Joe's Steakhouse – Downtown",  customerId: 'CUST-501', qty: 125, unit: 'lbs',   invoiceRef: 'INV-2026-0861' },
  { id: 'DS-007', lotId: 'LOT-E-WARN',   sku: 'DAI-MILK-02', date: '2026-05-05', customer: 'City Hospital Cafe',           customerId: 'CUST-502', qty: 120, unit: 'units', invoiceRef: 'INV-2026-0855' },
];

function Fsma204Tab() {
  const [subTab, setSubTab]       = useState('log');     // 'log' | 'trace' | 'pti'
  const [cteFilter, setCteFilter] = useState('All');
  const [lotFilter, setLotFilter] = useState('All');
  const [search, setSearch]       = useState('');
  const [expandedCte, setExpandedCte] = useState(null);
  const [traceLot, setTraceLot]   = useState('LOT-A-URGENT');
  const [ptiLot, setPtiLot]       = useState('LOT-A-URGENT');
  const [reportFired, setReportFired] = useState(false);

  const fmt$ = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);

  const cteBadge = (type) => {
    const m = CTE_META[type] || {};
    return `px-2 py-0.5 rounded-md text-xs font-bold border ${m.bg} ${m.text} ${m.border}`;
  };

  const filteredLog = INIT_CTE_LOG.filter(e => {
    const matchType = cteFilter === 'All' || e.cteType === cteFilter;
    const matchLot  = lotFilter  === 'All' || e.lotId   === lotFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || e.lotId.toLowerCase().includes(q) || e.sku.toLowerCase().includes(q) || e.productName.toLowerCase().includes(q);
    return matchType && matchLot && matchSearch;
  });

  const traceUpstream   = INIT_CTE_LOG.filter(e => e.lotId === traceLot).sort((a,b) => CTE_META[a.cteType]?.step - CTE_META[b.cteType]?.step);
  const traceDownstream = DOWNSTREAM_SHIPMENTS.filter(e => e.lotId === traceLot);
  const traceLotMeta    = FTL_LOTS.find(l => l.lotId === traceLot);
  const ptiMeta         = FTL_LOTS.find(l => l.lotId === ptiLot);

  const renderKdes = (kdes) => (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
      {Object.entries(kdes).map(([k,v]) => (
        <div key={k} className="flex gap-2 text-xs">
          <span className="text-gray-600 font-semibold uppercase tracking-wider min-w-[120px] shrink-0">
            {k.replace(/([A-Z])/g,' $1').replace(/_/g,' ')}
          </span>
          <span className="text-gray-300">{String(v)}</span>
        </div>
      ))}
    </div>
  );

  const kpiData = [
    { label: 'FTL Lots Tracked', value: FTL_LOTS.filter(l=>l.isFTL).length, icon: Tag,           color: 'text-cyan-400'   },
    { label: 'CTE Records',      value: INIT_CTE_LOG.length,                 icon: ClipboardList, color: 'text-emerald-400'},
    { label: 'Downstream Links', value: DOWNSTREAM_SHIPMENTS.length,         icon: ArrowUpDown,   color: 'text-amber-400'  },
    { label: 'FTL Compliance',   value: '100%',                              icon: CheckCircle2,  color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold text-gray-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-500" /> FSMA 204 — KDE/CTE Traceability & PTI Labels
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Key Data Elements · Critical Tracking Events · FDA Food Traceability List · PTI Label Compliance (effective Jan 20, 2026)</p>
        </div>
        <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
          FDA Compliant ✓
        </span>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-3">
        {kpiData.map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">{k.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
            <k.icon className={`w-7 h-7 ${k.color} opacity-30`} />
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {[
          { id: 'log',   label: 'CTE Log',              icon: ClipboardList },
          { id: 'trace', label: 'Traceability Report',  icon: GitBranch     },
          { id: 'pti',   label: 'PTI Labels',           icon: QrCode        },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              subTab === t.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── CTE LOG ── */}
      {subTab === 'log' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search lot ID, SKU…" value={search} onChange={e => setSearch(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 w-56" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['All', ...Object.keys(CTE_META)].map(f => (
                <button key={f} onClick={() => setCteFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    cteFilter === f ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                  }`}>{f === 'All' ? 'All CTEs' : CTE_META[f].label}</button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {['All', ...FTL_LOTS.map(l=>l.lotId)].map(f => (
                <button key={f} onClick={() => setLotFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    lotFilter === f ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                  }`}>{f === 'All' ? 'All Lots' : f}</button>
              ))}
            </div>
          </div>

          {/* CTE Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">CTE Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Lot ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Product / SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-800">Entered By</th>
                  <th className="px-4 py-3 border-b border-gray-800" />
                </tr>
              </thead>
              <tbody>
                {filteredLog.map(e => (
                  <React.Fragment key={e.id}>
                    <tr className="hover:bg-gray-800/30 cursor-pointer" onClick={() => setExpandedCte(expandedCte === e.id ? null : e.id)}>
                      <td className="px-4 py-3">
                        <span className={cteBadge(e.cteType)}>{CTE_META[e.cteType]?.label}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{e.lotId}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-200 text-xs">{e.productName}</div>
                        <div className="text-gray-600 text-xs">{e.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{e.date}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-[180px] truncate">{e.location}</td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-gray-300">{e.qty} {e.unit}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.referenceDoc}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{e.enteredBy}</td>
                      <td className="px-4 py-3">
                        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${expandedCte===e.id?'rotate-180':''}`} />
                      </td>
                    </tr>
                    {expandedCte === e.id && (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 bg-gray-900/60 border-y border-gray-800">
                          <div className="flex gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Key Data Elements (KDEs) — {CTE_META[e.cteType]?.label}</span>
                            <span className="text-xs text-gray-600">Record ID: {e.id}</span>
                          </div>
                          {renderKdes(e.kdes)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/60 text-xs text-gray-600">
              {filteredLog.length} records shown · Click any row to view KDEs
            </div>
          </div>
        </div>
      )}

      {/* ── TRACEABILITY REPORT ── */}
      {subTab === 'trace' && (
        <div className="space-y-4">
          {/* Lot selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-400">Select Lot:</label>
            <div className="flex gap-2 flex-wrap">
              {FTL_LOTS.map(l => (
                <button key={l.lotId} onClick={() => { setTraceLot(l.lotId); setReportFired(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    traceLot === l.lotId ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                  }`}>
                  {l.lotId} {l.isFTL && <span className="ml-1 text-emerald-400">FTL</span>}
                </button>
              ))}
            </div>
          </div>

          {traceLotMeta && (
            <div className="space-y-4">
              {/* Lot header card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-gray-100 text-lg">{traceLotMeta.lotId}</span>
                    {traceLotMeta.isFTL && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-bold">FDA Food Traceability List</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{traceLotMeta.name}</span>
                    <span>SKU: {traceLotMeta.sku}</span>
                    <span>Category: {traceLotMeta.category}</span>
                    <span>TLC: <span className="font-mono text-gray-400">{traceLotMeta.tlc}</span></span>
                    <span>GTIN: <span className="font-mono text-gray-400">{traceLotMeta.gtin}</span></span>
                    <span>Expiry: {traceLotMeta.expiry}</span>
                  </div>
                </div>
                <button onClick={() => setReportFired(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm font-semibold hover:bg-cyan-500/20 transition-colors">
                  <Printer className="w-4 h-4" /> Generate FDA Report
                </button>
              </div>

              {reportFired && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3 text-sm text-emerald-400 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold">FSMA 204 Traceability Report generated — {traceLotMeta.lotId}</p>
                    <p className="text-emerald-300/70 text-xs mt-0.5">
                      Report includes {traceUpstream.length} upstream CTE records + {traceDownstream.length} downstream recipient records.
                      Formatted per FDA FSMA 204 §1.1 one-up/one-down specification. FDA submission ready.
                    </p>
                  </div>
                </div>
              )}

              {/* One-Up: Upstream CTEs */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-cyan-500" />
                  <span className="font-bold text-gray-200 text-sm">One-Up Traceability — Upstream Source Chain ({traceUpstream.length} CTEs)</span>
                </div>
                <div className="p-5">
                  {/* CTE chain visual */}
                  <div className="flex items-center gap-0 mb-5 overflow-x-auto pb-2">
                    {Object.keys(CTE_META).map((type, idx) => {
                      const m = CTE_META[type];
                      const hasCte = traceUpstream.some(e => e.cteType === type);
                      return (
                        <React.Fragment key={type}>
                          <div className={`flex flex-col items-center gap-1 shrink-0 ${hasCte?'opacity-100':'opacity-30'}`}>
                            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold ${hasCte ? `${m.bg} ${m.text} border-current` : 'bg-gray-800 text-gray-600 border-gray-700'}`}>
                              {m.step}
                            </div>
                            <span className={`text-xs font-semibold whitespace-nowrap ${hasCte ? m.text : 'text-gray-600'}`}>{m.label}</span>
                            {hasCte && <CheckCircle2 className={`w-3 h-3 ${m.text}`} />}
                          </div>
                          {idx < Object.keys(CTE_META).length - 1 && (
                            <div className={`h-0.5 flex-1 min-w-[24px] mx-1 ${hasCte?'bg-cyan-500/30':'bg-gray-800'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {/* CTE detail rows */}
                  <div className="space-y-2">
                    {traceUpstream.map(e => {
                      const m = CTE_META[e.cteType];
                      return (
                        <div key={e.id} className={`border rounded-xl p-4 ${m.bg} ${m.border}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${m.bg} ${m.text} ${m.border}`}>{m.label}</span>
                              <span className="text-xs font-mono text-gray-500">{e.id}</span>
                              <span className="text-xs text-gray-500">{e.date}</span>
                            </div>
                            <span className="text-xs text-gray-500">{e.qty} {e.unit} · Ref: {e.referenceDoc}</span>
                          </div>
                          <div className="text-xs text-gray-300 mb-1">{e.location}</div>
                          {renderKdes(e.kdes)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* One-Down: Downstream Recipients */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-gray-200 text-sm">One-Down Traceability — Outbound Recipients ({traceDownstream.length} shipments)</span>
                </div>
                {traceDownstream.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer / Recipient</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ship Date</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Ref</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">FDA Notifiable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traceDownstream.map(ds => (
                        <tr key={ds.id} className="hover:bg-gray-800/30 border-t border-gray-800">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-200 text-xs">{ds.customer}</div>
                            <div className="text-gray-600 text-xs">{ds.customerId}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{ds.date}</td>
                          <td className="px-4 py-3 text-right text-xs font-mono text-gray-300">{ds.qty} {ds.unit}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{ds.invoiceRef}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-xs font-bold">
                              ⚠ Required
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-900/60 border-t border-gray-800">
                        <td className="px-4 py-2 text-xs text-gray-600 font-semibold" colSpan={2}>Total Distributed</td>
                        <td className="px-4 py-2 text-right text-xs font-bold text-amber-400 font-mono">
                          {traceDownstream.reduce((s,d)=>s+d.qty,0)} {traceDownstream[0]?.unit}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="px-5 py-8 text-center text-gray-600 text-sm">No outbound shipments recorded for this lot.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PTI LABELS ── */}
      {subTab === 'pti' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-400">Select Lot:</label>
            <div className="flex gap-2 flex-wrap">
              {FTL_LOTS.map(l => (
                <button key={l.lotId} onClick={() => setPtiLot(l.lotId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    ptiLot === l.lotId ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                  }`}>{l.lotId}</button>
              ))}
            </div>
          </div>

          {ptiMeta && (() => {
            const ctes = INIT_CTE_LOG.filter(e => e.lotId === ptiLot);
            const packing = ctes.find(e => e.cteType === 'initial_packing');
            const receiving = ctes.find(e => e.cteType === 'receiving');
            return (
              <div className="flex gap-6 flex-wrap">
                {/* PTI Label mockup */}
                <div className="bg-white rounded-xl p-5 w-80 shadow-2xl text-gray-900 font-mono text-xs select-none">
                  {/* Label header */}
                  <div className="border-b border-gray-300 pb-2 mb-2 flex justify-between items-center">
                    <div className="text-sm font-black tracking-tight">PTI LABEL</div>
                    <div className="text-xs text-gray-500">FSMA 204 Compliant</div>
                  </div>
                  {/* Commodity */}
                  <div className="text-lg font-black mb-0.5 leading-tight">{ptiMeta.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{ptiMeta.category}</div>
                  {/* Key fields */}
                  <div className="space-y-1 mb-3">
                    {[
                      ['GTIN', ptiMeta.gtin],
                      ['Lot #', ptiMeta.lotId],
                      ['TLC',  ptiMeta.tlc ],
                      ['SKU',  ptiMeta.sku ],
                      ['Pack Date', packing?.kdes?.packDate || packing?.date || '—'],
                      ['Packed By', packing?.kdes?.packerName || '—'],
                      ['Recv At', receiving?.kdes?.receiveAt ? 'Kernal Foods Inc, Tampa FL' : '—'],
                      ['Expiry', ptiMeta.expiry],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between border-b border-gray-100 pb-0.5">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-bold text-right max-w-[180px] truncate">{val}</span>
                      </div>
                    ))}
                  </div>
                  {/* Barcode simulation */}
                  <div className="bg-white border border-gray-200 rounded p-2 text-center mb-2">
                    <div className="flex justify-center gap-px mb-1">
                      {Array.from({length:56}).map((_,i) => (
                        <div key={i} style={{width:'2px',height: (i%7===0||i%11===0||i%3===0)?'28px':'20px',background:'#111'}} />
                      ))}
                    </div>
                    <div className="text-xs font-bold">(01){ptiMeta.gtin}(10){ptiMeta.lotId}</div>
                    <div className="text-xs text-gray-400">GS1-128 · AI 01 + AI 10</div>
                  </div>
                  {/* Footer */}
                  <div className="text-center text-gray-400 text-xs border-t border-gray-200 pt-2">
                    {COMPANY_INFO.name} · {COMPANY_INFO.fda}
                  </div>
                </div>

                {/* Label details panel */}
                <div className="flex-1 min-w-64 space-y-3">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Label Fields — GS1-128 Application Identifiers</div>
                    <div className="space-y-2">
                      {[
                        { ai: '(01)', field: 'GTIN-14', value: ptiMeta.gtin,    desc: 'Global Trade Item Number — uniquely identifies the product' },
                        { ai: '(10)', field: 'Lot #',   value: ptiMeta.lotId,   desc: 'FDA Traceability Lot Code (TLC) — links to FSMA 204 KDEs' },
                        { ai: '(11)', field: 'Pack Date',value: packing?.kdes?.packDate||'—', desc: 'YYMMDD format per GS1 standard' },
                        { ai: '(17)', field: 'Expiry',  value: ptiMeta.expiry,  desc: 'Best by / expiration date for cold chain compliance' },
                        { ai: '(30)', field: 'Qty',     value: packing ? `${packing.qty} ${packing.unit}` : '—', desc: 'Packed quantity in unit of measure' },
                      ].map(r => (
                        <div key={r.ai} className="flex gap-3 border-b border-gray-800 pb-2">
                          <span className="font-mono text-cyan-400 text-xs w-10 shrink-0">{r.ai}</span>
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-300">{r.field}: </span>
                            <span className="font-mono text-xs text-gray-100">{r.value}</span>
                            <div className="text-xs text-gray-600 mt-0.5">{r.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">PTI Compliance Checklist</div>
                    {[
                      ['GTIN-14 present', true],
                      ['Lot / TLC matches FSMA 204 KDE', true],
                      ['Pack date encoded (AI 11)', !!packing?.kdes?.packDate],
                      ['Expiry date present (AI 17)', !!ptiMeta.expiry],
                      ['Packer name in KDE record', !!packing?.kdes?.packerName],
                      ['GS1-128 barcode symbology', true],
                      ['FDA Firm ID on record', !!packing?.kdes?.fdaFirmId],
                    ].map(([item, pass]) => (
                      <div key={item} className="flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0">
                        {pass
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          : <AlertCircle  className="w-3.5 h-3.5 text-amber-400 shrink-0"  />}
                        <span className={`text-xs ${pass ? 'text-gray-300' : 'text-amber-400'}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl text-sm font-semibold hover:bg-cyan-500/20 transition-colors">
                    <Printer className="w-4 h-4" /> Print Label (Zebra ZPL / PDF)
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── PACA COMPLIANCE ─────────────────────────────────────────────────────────
const PACA_TRUST_NOTICE = `PACA TRUST NOTICE: The perishable agricultural commodities listed on this invoice are sold subject to the statutory trust authorized by section 5(c) of the Perishable Agricultural Commodities Act, 1930 (7 U.S.C. 499e(c)). The seller of these commodities retains a trust claim over these commodities, all inventories of food or other products derived from these commodities, and any receivables or proceeds from the sale of these commodities until full payment is received.`;

const INIT_PACA_INVOICES = [
  { id: 'INV-PACA-001', customerId: 'CUST-501', customer: "Joe's Steakhouse – Downtown",  invoiceDate: '2026-05-17', dueDate: '2026-05-27', amount: 2750.00, sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', qty: 125, status: 'Open',    trustNotice: true,  pacaDaysUsed: 10, paid: false },
  { id: 'INV-PACA-002', customerId: 'CUST-502', customer: 'City Hospital Cafe',           invoiceDate: '2026-05-19', dueDate: '2026-05-29', amount: 1100.00, sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', qty: 50,  status: 'Open',    trustNotice: true,  pacaDaysUsed: 8,  paid: false },
  { id: 'INV-PACA-003', customerId: 'CUST-501', customer: "Joe's Steakhouse – Downtown",  invoiceDate: '2026-05-20', dueDate: '2026-05-30', amount: 3400.00, sku: 'FRZ-SALM-01', product: 'Atlantic Salmon Fillet 6oz', qty: 40,  status: 'Open',    trustNotice: true,  pacaDaysUsed: 7,  paid: false },
  { id: 'INV-PACA-004', customerId: 'CUST-502', customer: 'City Hospital Cafe',           invoiceDate: '2026-05-22', dueDate: '2026-06-01', amount: 880.00,  sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', qty: 40,  status: 'Open',    trustNotice: true,  pacaDaysUsed: 5,  paid: false },
  { id: 'INV-PACA-005', customerId: 'CUST-501', customer: "Joe's Steakhouse – Downtown",  invoiceDate: '2026-05-10', dueDate: '2026-05-20', amount: 1540.00, sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', qty: 70,  status: 'Overdue',  trustNotice: true,  pacaDaysUsed: 17, paid: false },
  { id: 'INV-PACA-006', customerId: 'CUST-503', customer: 'Sunset Diner & Grill',         invoiceDate: '2026-04-01', dueDate: '2026-04-11', amount: 660.00,  sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', qty: 30,  status: 'Overdue',  trustNotice: false, pacaDaysUsed: 56, paid: false },
  { id: 'INV-PACA-007', customerId: 'CUST-502', customer: 'City Hospital Cafe',           invoiceDate: '2026-05-05', dueDate: '2026-05-15', amount: 2200.00, sku: 'FRZ-SALM-01', product: 'Atlantic Salmon Fillet 6oz', qty: 26,  status: 'Paid',     trustNotice: true,  pacaDaysUsed: 10, paid: true  },
  { id: 'INV-PACA-008', customerId: 'CUST-501', customer: "Joe's Steakhouse – Downtown",  invoiceDate: '2026-05-01', dueDate: '2026-05-11', amount: 1980.00, sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', qty: 90,  status: 'Paid',     trustNotice: true,  pacaDaysUsed: 10, paid: true  },
];

const INIT_PACA_REJECTIONS = [
  { id: 'REJ-001', date: '2026-05-15', customerId: 'CUST-502', customer: 'City Hospital Cafe',
    sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', lotId: 'LOT-D-CRITICAL', qty: 25, unit: 'cases',
    reason: 'Temperature Abuse', reasonCode: 'TEMP', description: 'Product arrived at 72°F — above 55°F threshold. Driver logged refusal at dock.',
    photoEvidence: true, invoiceRef: 'INV-2026-0851', creditIssued: true, creditAmount: 550.00,
    status: 'Resolved', resolvedDate: '2026-05-16' },
  { id: 'REJ-002', date: '2026-05-20', customerId: 'CUST-501', customer: "Joe's Steakhouse – Downtown",
    sku: 'FRZ-SALM-01', product: 'Atlantic Salmon Fillet 6oz', lotId: 'LOT-G-CRITICAL', qty: 10, unit: 'cases',
    reason: 'Quality — Off Odor', reasonCode: 'QUAL', description: 'Chef reported off-odor on 10 of 40 cases upon opening at kitchen. Remaining 30 cases accepted.',
    photoEvidence: true, invoiceRef: 'INV-2026-0842', creditIssued: false, creditAmount: 850.00,
    status: 'Open', resolvedDate: null },
  { id: 'REJ-003', date: '2026-05-22', customerId: 'CUST-501', customer: "Joe's Steakhouse – Downtown",
    sku: 'PRO-TOMA-01', product: 'Roma Tomatoes 25lb Case', lotId: 'LOT-D-CRITICAL', qty: 8, unit: 'cases',
    reason: 'Short Weight', reasonCode: 'SHRT', description: 'Cases weighed 22 lbs average vs. 25 lb stated. 8 cases refused at delivery.',
    photoEvidence: false, invoiceRef: 'INV-PACA-003', creditIssued: false, creditAmount: 176.00,
    status: 'Pending Credit', resolvedDate: null },
];

const INIT_PACA_DISPUTES = [
  { id: 'DIS-001', openDate: '2026-05-16', customerId: 'CUST-503', customer: 'Sunset Diner & Grill',
    invoiceRef: 'INV-PACA-006', amount: 660.00, product: 'Roma Tomatoes 25lb Case',
    type: 'Non-Payment', description: '$660 invoice 56+ days past PACA 10-day clock. Customer claims quality dispute but no rejection was filed at delivery. PACA trust rights preserved — formal complaint prepared.',
    status: 'PACA Complaint Filed', filedWithPACA: true, filingDate: '2026-05-17',
    resolution: 'Pending USDA-AMS investigation', resolvedDate: null, damagesClaimAmt: 660.00 },
  { id: 'DIS-002', openDate: '2026-05-20', customerId: 'CUST-501', customer: "Joe's Steakhouse – Downtown",
    invoiceRef: 'INV-2026-0842', amount: 850.00, product: 'Atlantic Salmon Fillet 6oz',
    type: 'Quality Rejection', description: 'Customer rejected 10 cases citing off-odor. Seller disputes — product shipped within 24h of processing, temperature log shows cold chain intact. Photos taken at packing.',
    status: 'Under Review', filedWithPACA: false, filingDate: null,
    resolution: null, resolvedDate: null, damagesClaimAmt: 850.00 },
  { id: 'DIS-003', openDate: '2026-04-15', customerId: 'CUST-502', customer: 'City Hospital Cafe',
    invoiceRef: 'INV-2026-0700', amount: 1200.00, product: 'Mixed Produce',
    type: 'Invoice Dispute', description: 'Customer disputed weight/price on 3 line items. Both parties agreed to adjusted pricing. PACA mediation completed.',
    status: 'Resolved', filedWithPACA: false, filingDate: null,
    resolution: 'Agreed credit of $420 applied to account. Balance paid.', resolvedDate: '2026-05-02', damagesClaimAmt: 1200.00 },
];

function PacaTab() {
  const [subTab, setSubTab]           = useState('tracker');
  const [invoiceFilter, setInvoiceFilter] = useState('All');
  const [rejFilter, setRejFilter]     = useState('All');
  const [dispFilter, setDispFilter]   = useState('All');
  const [expandedInv, setExpandedInv] = useState(null);
  const [expandedRej, setExpandedRej] = useState(null);
  const [expandedDis, setExpandedDis] = useState(null);
  const [invoices, setInvoices]       = useState(INIT_PACA_INVOICES);
  const [rejections, setRejections]   = useState(INIT_PACA_REJECTIONS);
  const [disputes, setDisputes]       = useState(INIT_PACA_DISPUTES);
  const [showTrustModal, setShowTrustModal] = useState(false);

  const fmt$ = v => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);

  const urgencyClass = (days, paid) => {
    if (paid) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Paid' };
    if (days >= 10) return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', label: 'OVERDUE' };
    if (days >= 7)  return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Due Soon' };
    return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', label: 'On Track' };
  };

  const dispStatusBadge = (s) => ({
    'PACA Complaint Filed': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Under Review':         'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'Resolved':             'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'Mediation':            'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  }[s] || 'bg-gray-700/60 text-gray-400 border border-gray-700');

  const rejStatusBadge = (s) => ({
    'Resolved':       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'Open':           'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Pending Credit': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }[s] || 'bg-gray-700/60 text-gray-400 border border-gray-700');

  const overdueCount  = invoices.filter(i => !i.paid && i.pacaDaysUsed >= 10).length;
  const dueSoonCount  = invoices.filter(i => !i.paid && i.pacaDaysUsed >= 7 && i.pacaDaysUsed < 10).length;
  const openDisp      = disputes.filter(d => d.status !== 'Resolved').length;
  const openRej       = rejections.filter(r => r.status !== 'Resolved').length;
  const trustMissing  = invoices.filter(i => !i.trustNotice && !i.paid).length;

  const filteredInv = invoices.filter(i =>
    invoiceFilter === 'All' ? true :
    invoiceFilter === 'Overdue' ? (!i.paid && i.pacaDaysUsed >= 10) :
    invoiceFilter === 'Due Soon' ? (!i.paid && i.pacaDaysUsed >= 7 && i.pacaDaysUsed < 10) :
    invoiceFilter === 'Paid' ? i.paid : true
  ).sort((a,b) => b.pacaDaysUsed - a.pacaDaysUsed);

  const filteredRej = rejections.filter(r =>
    rejFilter === 'All' ? true : r.status === rejFilter
  );

  const filteredDis = disputes.filter(d =>
    dispFilter === 'All' ? true : d.status === dispFilter
  );

  const handleMarkPaid = (invId) => {
    setInvoices(prev => prev.map(i => i.id === invId ? { ...i, paid: true, status: 'Paid' } : i));
  };

  const handleIssueCredit = (rejId) => {
    setRejections(prev => prev.map(r => r.id === rejId ? { ...r, creditIssued: true, status: 'Resolved', resolvedDate: '2026-05-27' } : r));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold text-gray-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-500" /> PACA Compliance & Produce Dispute Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Perishable Agricultural Commodities Act — 10-day payment clock · Rejection records · Dispute workflow · Trust notice compliance</p>
        </div>
        <button onClick={() => setShowTrustModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-sm font-semibold hover:bg-violet-500/20 transition-colors">
          <Receipt className="w-4 h-4" /> PACA Trust Notice
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Overdue (10+ Days)', value: overdueCount,  icon: TriangleAlert,        color: overdueCount  > 0 ? 'text-rose-400'    : 'text-gray-500', urgent: overdueCount  > 0 },
          { label: 'Due Soon (7–9 Days)', value: dueSoonCount, icon: CalendarClock,        color: dueSoonCount  > 0 ? 'text-amber-400'   : 'text-gray-500', urgent: false },
          { label: 'Open Rejections',     value: openRej,      icon: ThumbsDown,           color: openRej       > 0 ? 'text-amber-400'   : 'text-gray-500', urgent: false },
          { label: 'Open Disputes',       value: openDisp,     icon: Gavel,                color: openDisp      > 0 ? 'text-rose-400'    : 'text-gray-500', urgent: openDisp > 0 },
          { label: 'Missing Trust Notice', value: trustMissing, icon: BadgeAlert,          color: trustMissing  > 0 ? 'text-amber-400'   : 'text-emerald-400', urgent: false },
        ].map(k => (
          <div key={k.label} className={`bg-gray-900 border rounded-xl px-4 py-3 flex items-center justify-between ${k.urgent ? 'border-rose-500/20' : 'border-gray-800'}`}>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">{k.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
            <k.icon className={`w-7 h-7 ${k.color} opacity-30`} />
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {[
          { id: 'tracker',   label: 'PACA Clock',       icon: CalendarClock },
          { id: 'rejections',label: 'Rejection Log',    icon: ThumbsDown    },
          { id: 'disputes',  label: 'Disputes',         icon: Gavel         },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              subTab === t.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
            {t.id === 'tracker'    && overdueCount > 0 && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded-full text-xs font-bold">{overdueCount}</span>}
            {t.id === 'disputes'   && openDisp > 0     && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">{openDisp}</span>}
          </button>
        ))}
      </div>

      {/* ── PACA CLOCK TRACKER ── */}
      {subTab === 'tracker' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {['All', 'Overdue', 'Due Soon', 'Paid'].map(f => (
              <button key={f} onClick={() => setInvoiceFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  invoiceFilter === f ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                }`}>{f}</button>
            ))}
            <span className="ml-2 text-xs text-gray-600 self-center">PACA requires payment within 10 days of delivery for produce · 7 U.S.C. §499b</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Invoice','Customer','Product / SKU','Invoice Date','PACA Days','Due','Amount','Trust Notice','Status','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInv.map(inv => {
                  const u = urgencyClass(inv.pacaDaysUsed, inv.paid);
                  const daysRemain = Math.max(0, 10 - inv.pacaDaysUsed);
                  return (
                    <React.Fragment key={inv.id}>
                      <tr className="hover:bg-gray-800/30 border-t border-gray-800/60 cursor-pointer"
                        onClick={() => setExpandedInv(expandedInv === inv.id ? null : inv.id)}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{inv.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-200 text-xs">{inv.customer}</div>
                          <div className="text-gray-600 text-xs">{inv.customerId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-300 text-xs">{inv.product}</div>
                          <div className="text-gray-600 text-xs">{inv.sku} · {inv.qty} cases</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{inv.invoiceDate}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${inv.pacaDaysUsed >= 10 ? 'bg-rose-500' : inv.pacaDaysUsed >= 7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (inv.pacaDaysUsed / 10) * 100)}%` }} />
                            </div>
                            <span className={`font-bold text-xs ${u.text}`}>{inv.pacaDaysUsed}d</span>
                          </div>
                          {!inv.paid && inv.pacaDaysUsed < 10 && <div className="text-xs text-gray-600 mt-0.5">{daysRemain}d remaining</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{inv.dueDate}</td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-200 text-xs">{fmt$(inv.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          {inv.trustNotice
                            ? <BadgeCheck className="w-4 h-4 text-emerald-400 mx-auto" />
                            : <BadgeAlert className="w-4 h-4 text-amber-400 mx-auto" />}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${u.bg} ${u.text} ${u.border}`}>{u.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          {!inv.paid && (
                            <button onClick={e => { e.stopPropagation(); handleMarkPaid(inv.id); }}
                              className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedInv === inv.id && (
                        <tr><td colSpan={10} className="px-6 py-4 bg-gray-950/60 border-y border-gray-800">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PACA Details</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex gap-3"><span className="text-gray-600 w-36">Invoice Date</span><span className="text-gray-300">{inv.invoiceDate}</span></div>
                                <div className="flex gap-3"><span className="text-gray-600 w-36">Payment Due (PACA)</span><span className="text-gray-300">{inv.dueDate}</span></div>
                                <div className="flex gap-3"><span className="text-gray-600 w-36">Days on Clock</span><span className={`font-bold ${u.text}`}>{inv.pacaDaysUsed} of 10</span></div>
                                <div className="flex gap-3"><span className="text-gray-600 w-36">PACA Trust Notice</span><span className={inv.trustNotice?'text-emerald-400':'text-amber-400'}>{inv.trustNotice?'✓ Present on Invoice':'⚠ Missing — Add Before Dispute'}</span></div>
                                <div className="flex gap-3"><span className="text-gray-600 w-36">Lot Reference</span><span className="font-mono text-gray-400">LOT-D-CRITICAL</span></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PACA Trust Language</p>
                              <p className="text-xs text-gray-500 leading-relaxed bg-gray-900 border border-gray-800 rounded-lg p-3 italic">{PACA_TRUST_NOTICE.slice(0, 220)}…</p>
                            </div>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/60 text-xs text-gray-600">
              {filteredInv.length} invoices · PACA produce invoices only (fresh/frozen fruits, vegetables, fish)
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTION LOG ── */}
      {subTab === 'rejections' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {['All', 'Open', 'Pending Credit', 'Resolved'].map(f => (
              <button key={f} onClick={() => setRejFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  rejFilter === f ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                }`}>{f}</button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredRej.map(rej => (
              <div key={rej.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedRej(expandedRej === rej.id ? null : rej.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-mono text-xs text-gray-500">{rej.id}</span>
                      <span className="text-xs text-gray-500">{rej.date}</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${rejStatusBadge(rej.status)}`}>{rej.status}</span>
                      {rej.photoEvidence && <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-xs font-bold">📸 Photo Evidence</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-300 mb-1">
                      <span className="font-semibold">{rej.customer}</span>
                      <span>{rej.product}</span>
                      <span className="text-gray-500">{rej.qty} {rej.unit} · {rej.invoiceRef}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        rej.reasonCode==='TEMP'?'bg-rose-500/10 text-rose-400':rej.reasonCode==='QUAL'?'bg-amber-500/10 text-amber-400':'bg-violet-500/10 text-violet-400'
                      }`}>{rej.reason}</span>
                      <span className="text-xs text-gray-500 truncate max-w-sm">{rej.description}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-gray-100 text-sm">{fmt$(rej.creditAmount)}</div>
                    <div className="text-xs text-gray-600">credit claim</div>
                    {rej.creditIssued && <div className="text-xs text-emerald-400 mt-1">Credit Issued ✓</div>}
                  </div>
                </div>
                {expandedRej === rej.id && (
                  <div className="border-t border-gray-800 px-5 py-4 bg-gray-950/40 space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      {[
                        ['Rejection Date', rej.date],
                        ['Customer', rej.customer],
                        ['Product', rej.product],
                        ['Lot ID', rej.lotId],
                        ['SKU', rej.sku],
                        ['Qty Rejected', `${rej.qty} ${rej.unit}`],
                        ['Reason Code', rej.reasonCode],
                        ['Invoice Ref', rej.invoiceRef],
                        ['Credit Amount', fmt$(rej.creditAmount)],
                        ['Photo Evidence', rej.photoEvidence ? 'Yes — attached' : 'No'],
                        ['Credit Issued', rej.creditIssued ? `Yes — ${rej.resolvedDate}` : 'Pending'],
                        ['Status', rej.status],
                      ].map(([label, val]) => (
                        <div key={label} className="flex flex-col gap-0.5">
                          <span className="text-gray-600 uppercase tracking-wider text-[10px]">{label}</span>
                          <span className="text-gray-300 font-medium">{val}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg p-3">{rej.description}</p>
                    {!rej.creditIssued && (
                      <button onClick={() => handleIssueCredit(rej.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> Issue Credit Memo — {fmt$(rej.creditAmount)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DISPUTES ── */}
      {subTab === 'disputes' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {['All', 'Under Review', 'PACA Complaint Filed', 'Resolved'].map(f => (
              <button key={f} onClick={() => setDispFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  dispFilter === f ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                }`}>{f}</button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredDis.map(dis => (
              <div key={dis.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedDis(expandedDis === dis.id ? null : dis.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-mono text-xs text-gray-500">{dis.id}</span>
                      <span className="text-xs text-gray-500">Opened: {dis.openDate}</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${dispStatusBadge(dis.status)}`}>{dis.status}</span>
                      {dis.filedWithPACA && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-xs font-bold">⚖ USDA-AMS Filed</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-300 mb-1">
                      <span className="font-semibold">{dis.customer}</span>
                      <span>{dis.product}</span>
                      <span className="text-gray-500">{dis.invoiceRef} · {dis.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate max-w-2xl">{dis.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-gray-100 text-sm">{fmt$(dis.damagesClaimAmt)}</div>
                    <div className="text-xs text-gray-600">claimed</div>
                  </div>
                </div>
                {expandedDis === dis.id && (
                  <div className="border-t border-gray-800 px-5 py-4 bg-gray-950/40 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2 text-xs">
                        {[
                          ['Dispute Type', dis.type],
                          ['Invoice Ref', dis.invoiceRef],
                          ['Claim Amount', fmt$(dis.damagesClaimAmt)],
                          ['Filed with USDA-AMS', dis.filedWithPACA ? `Yes — ${dis.filingDate}` : 'No'],
                          ['Resolution', dis.resolution || 'Pending'],
                          ['Resolved Date', dis.resolvedDate || '—'],
                        ].map(([label, val]) => (
                          <div key={label} className="flex gap-3">
                            <span className="text-gray-600 w-40 shrink-0">{label}</span>
                            <span className="text-gray-300">{val}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                        <p className="text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg p-3 leading-relaxed">{dis.description}</p>
                      </div>
                    </div>
                    {dis.status === 'Under Review' && (
                      <div className="flex gap-3">
                        <button onClick={() => setDisputes(prev => prev.map(d => d.id===dis.id ? {...d, status:'PACA Complaint Filed', filedWithPACA:true, filingDate:'2026-05-27'} : d))}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-semibold hover:bg-rose-500/20 transition-colors">
                          <Gavel className="w-4 h-4" /> File PACA Complaint (USDA-AMS)
                        </button>
                        <button onClick={() => setDisputes(prev => prev.map(d => d.id===dis.id ? {...d, status:'Resolved', resolution:'Settled by agreement', resolvedDate:'2026-05-27'} : d))}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
                          <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRUST NOTICE MODAL ── */}
      {showTrustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-950 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-gray-100">PACA Trust Notice — Statutory Language</h3>
              </div>
              <button onClick={() => setShowTrustModal(false)}
                className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400">
                <p className="font-bold mb-1">⚠ Required on ALL produce invoices</p>
                <p>PACA requires this notice on every invoice for produce transactions. Without it, you cannot enforce PACA trust rights in a non-payment dispute.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-300 leading-relaxed">
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider mb-2">Statutory Trust Notice — 7 U.S.C. §499e(c)</p>
                {PACA_TRUST_NOTICE}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Statute', '7 U.S.C. §499e(c)'],
                  ['Payment Clock', '10 calendar days from delivery'],
                  ['Coverage', 'Fresh & frozen fruits, vegetables, fish'],
                  ['Enforcement', 'USDA Agricultural Marketing Service'],
                  ['Filing Deadline', '30 days from payment default'],
                  ['Trust Assets', 'Commodities, derived products, receivables'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                    <p className="text-gray-600 text-[10px] uppercase tracking-wider">{label}</p>
                    <p className="text-gray-300 font-medium mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-sm font-semibold hover:bg-violet-500/20 transition-colors">
                  <Printer className="w-4 h-4" /> Copy to Clipboard
                </button>
                <button onClick={() => setShowTrustModal(false)}
                  className="px-4 py-2.5 bg-gray-800 text-gray-400 border border-gray-700 rounded-lg text-sm font-semibold hover:border-gray-600 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cold Chain / Temperature Monitoring ─────────────────────────────────────

const TEMP_THRESHOLDS = {
  FRZ: { min: -18, max: -15, zone: 'Frozen Storage',   color: 'cyan',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/25'  },
  CLR: { min:   2, max:   8, zone: 'Cooler Storage',   color: 'blue',   bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/25'  },
  AMB: { min:  15, max:  25, zone: 'Ambient Storage',  color: 'amber',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/25' },
  TRS: { min:   1, max:   6, zone: 'In Transit',        color: 'violet', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/25'},
};

const INIT_COLD_SENSORS = [
  { id: 'SNS-FRZ-A',  name: 'Freezer A',          zone: 'FRZ', location: 'Zone FRZ · Aisles 1–3', currentTemp: -16.2, status: 'online',  lastPing: '2026-05-27T08:43:00', lots: ['LOT-A-URGENT'],   battPct: 87, model: 'Sensitech TempTale 4', connType: 'WiFi'   },
  { id: 'SNS-FRZ-B',  name: 'Freezer B',          zone: 'FRZ', location: 'Zone FRZ · Aisles 4–6', currentTemp: -13.4, status: 'alert',   lastPing: '2026-05-27T08:44:00', lots: ['LOT-G-CRITICAL'], battPct: 72, model: 'Sensitech TempTale 4', connType: 'WiFi'   },
  { id: 'SNS-CLR-A',  name: 'Cooler A',           zone: 'CLR', location: 'Zone CLR · Aisles 1–2', currentTemp:   4.2, status: 'online',  lastPing: '2026-05-27T08:44:00', lots: ['LOT-D-CRITICAL'], battPct: 94, model: 'Emerson GO Logger',    connType: 'BT'     },
  { id: 'SNS-CLR-B',  name: 'Cooler B',           zone: 'CLR', location: 'Zone CLR · Aisles 3–4', currentTemp:   3.8, status: 'online',  lastPing: '2026-05-27T08:42:00', lots: ['LOT-E-WARN'],     battPct: 61, model: 'Emerson GO Logger',    connType: 'BT'     },
  { id: 'SNS-TRS-01', name: 'Truck RT-A Trailer', zone: 'TRS', location: 'In Transit → CUST-501', currentTemp:   1.2, status: 'online',  lastPing: '2026-05-27T08:43:00', lots: ['LOT-A-URGENT'],   battPct: 78, model: 'Carrier DataCOLD',    connType: '4G LTE' },
  { id: 'SNS-TRS-02', name: 'Truck RT-B Trailer', zone: 'TRS', location: 'In Transit → CUST-502', currentTemp:   7.4, status: 'warning', lastPing: '2026-05-27T08:40:00', lots: ['LOT-D-CRITICAL'], battPct: 55, model: 'Carrier DataCOLD',    connType: '4G LTE' },
];

const INIT_TEMP_LOG = [
  { id: 'TL-001', sensorId: 'SNS-FRZ-B',  sensorName: 'Freezer B',       lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', zone: 'FRZ', temp: -13.4, min: -18, max: -15, status: 'Alert',   loggedBy: 'Auto-IoT',  at: '2026-05-27T08:44:00', notes: 'Temp exceeded upper threshold — door seal inspection needed' },
  { id: 'TL-002', sensorId: 'SNS-TRS-02', sensorName: 'Truck RT-B',      lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', zone: 'TRS', temp:   7.4, min:   1, max:   6, status: 'Warning', loggedBy: 'Auto-IoT',  at: '2026-05-27T08:40:00', notes: 'Transit temp approaching upper limit' },
  { id: 'TL-003', sensorId: 'SNS-TRS-01', sensorName: 'Truck RT-A',      lotId: 'LOT-A-URGENT',   sku: 'FRZ-BEEF-01', zone: 'TRS', temp:   1.2, min:   1, max:   6, status: 'Normal',  loggedBy: 'Auto-IoT',  at: '2026-05-27T08:43:00', notes: '' },
  { id: 'TL-004', sensorId: 'SNS-FRZ-A',  sensorName: 'Freezer A',       lotId: 'LOT-A-URGENT',   sku: 'FRZ-BEEF-01', zone: 'FRZ', temp: -16.2, min: -18, max: -15, status: 'Normal',  loggedBy: 'Auto-IoT',  at: '2026-05-27T08:43:00', notes: '' },
  { id: 'TL-005', sensorId: 'SNS-CLR-A',  sensorName: 'Cooler A',        lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', zone: 'CLR', temp:   4.2, min:   2, max:   8, status: 'Normal',  loggedBy: 'Auto-IoT',  at: '2026-05-27T08:44:00', notes: '' },
  { id: 'TL-006', sensorId: 'SNS-CLR-B',  sensorName: 'Cooler B',        lotId: 'LOT-E-WARN',     sku: 'DAI-MILK-02', zone: 'CLR', temp:   3.8, min:   1, max:   4, status: 'Normal',  loggedBy: 'Auto-IoT',  at: '2026-05-27T08:42:00', notes: '' },
  { id: 'TL-007', sensorId: 'SNS-FRZ-B',  sensorName: 'Freezer B',       lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', zone: 'FRZ', temp: -14.8, min: -18, max: -15, status: 'Warning', loggedBy: 'Auto-IoT',  at: '2026-05-27T06:20:00', notes: 'Temp drift after morning delivery' },
  { id: 'TL-008', sensorId: 'SNS-CLR-B',  sensorName: 'Cooler B',        lotId: 'LOT-E-WARN',     sku: 'DAI-MILK-02', zone: 'CLR', temp:   4.9, min:   1, max:   4, status: 'Warning', loggedBy: 'Auto-IoT',  at: '2026-05-26T16:00:00', notes: 'Brief excursion — door open during restocking' },
  { id: 'TL-009', sensorId: 'Manual',     sensorName: 'Manual Entry',    lotId: 'LOT-A-URGENT',   sku: 'FRZ-BEEF-01', zone: 'FRZ', temp: -17.5, min: -18, max: -15, status: 'Normal',  loggedBy: 'Carlos M.', at: '2026-05-26T14:30:00', notes: 'QC receiving check on arrival' },
  { id: 'TL-010', sensorId: 'SNS-FRZ-B',  sensorName: 'Freezer B',       lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', zone: 'FRZ', temp: -16.9, min: -18, max: -15, status: 'Normal',  loggedBy: 'Auto-IoT',  at: '2026-05-27T04:00:00', notes: '' },
  { id: 'TL-011', sensorId: 'SNS-FRZ-B',  sensorName: 'Freezer B',       lotId: 'LOT-G-CRITICAL', sku: 'FRZ-SALM-01', zone: 'FRZ', temp: -17.1, min: -18, max: -15, status: 'Normal',  loggedBy: 'Auto-IoT',  at: '2026-05-27T02:00:00', notes: '' },
  { id: 'TL-012', sensorId: 'Manual',     sensorName: 'Manual Entry',    lotId: 'LOT-D-CRITICAL', sku: 'PRO-TOMA-01', zone: 'CLR', temp:   5.1, min:   2, max:   8, status: 'Normal',  loggedBy: 'Maria G.',  at: '2026-05-26T10:15:00', notes: 'Receiving temp check on arrival' },
];

// Sparkline data: 12 hourly readings per lot (newest last) for HACCP tab
const HACCP_SPARKLINES = {
  'LOT-A-URGENT':   [-17.5, -17.2, -16.8, -17.0, -16.9, -16.5, -16.8, -16.4, -16.2, -16.5, -16.3, -16.2],
  'LOT-G-CRITICAL': [-17.1, -16.9, -16.8, -17.0, -16.5, -15.8, -15.4, -14.8, -14.5, -14.2, -13.8, -13.4],
  'LOT-D-CRITICAL': [  5.1,   4.9,   5.0,   4.8,   4.5,   4.3,   4.2,   4.1,   4.3,   4.4,   4.2,   4.2],
  'LOT-E-WARN':     [  3.5,   3.6,   3.8,   3.7,   3.9,   4.9,   4.2,   4.0,   3.9,   3.8,   3.8,   3.8],
};

const HACCP_LOT_META = {
  'LOT-A-URGENT':   { sku: 'FRZ-BEEF-01',  name: 'Ground Beef 80/20',    zone: 'FRZ', sensor: 'SNS-FRZ-A', readings: 12, violations: 0, compliance: 100 },
  'LOT-G-CRITICAL': { sku: 'FRZ-SALM-01',  name: 'Atlantic Salmon Fillet', zone: 'FRZ', sensor: 'SNS-FRZ-B', readings: 12, violations: 3, compliance: 75  },
  'LOT-D-CRITICAL': { sku: 'PRO-TOMA-01',  name: 'Roma Tomatoes 25lb',   zone: 'CLR', sensor: 'SNS-CLR-A', readings: 12, violations: 0, compliance: 100 },
  'LOT-E-WARN':     { sku: 'DAI-MILK-02',  name: 'Whole Milk 1 Gal',     zone: 'CLR', sensor: 'SNS-CLR-B', readings: 12, violations: 2, compliance: 83  },
};

function ColdChainTab() {
  const [coldSubTab,  setColdSubTab]  = useState('monitor');
  const [sensors,     setSensors]     = useState(INIT_COLD_SENSORS);
  const [tempLog,     setTempLog]     = useState(INIT_TEMP_LOG);
  const [logFilter,   setLogFilter]   = useState('All');
  const [logLotFilter, setLogLotFilter] = useState('All');
  const [haccpLot,    setHaccpLot]    = useState('LOT-G-CRITICAL');
  const [haccpFired,  setHaccpFired]  = useState(false);
  const [logModal,    setLogModal]    = useState(false);
  const [logForm,     setLogForm]     = useState({ lotId: 'LOT-A-URGENT', zone: 'FRZ', temp: '', sensor: '', notes: '' });
  const [simSensor,   setSimSensor]   = useState(null);
  const [ccToast,     setCcToast]     = useState(null); // { msg, type }

  const notify = (msg, type = 'success') => {
    setCcToast({ msg, type });
    setTimeout(() => setCcToast(null), 3200);
  };

  const fmt1 = (n) => (Number(n) >= 0 ? '+' : '') + Number(n).toFixed(1);

  const getSensorStatus = (sensor) => {
    const t = TEMP_THRESHOLDS[sensor.zone];
    if (!t) return 'online';
    if (sensor.currentTemp > t.max + 1 || sensor.currentTemp < t.min - 1) return 'alert';
    if (sensor.currentTemp > t.max || sensor.currentTemp < t.min) return 'warning';
    return 'online';
  };

  const statusColors = {
    online:  { dot: 'bg-emerald-400', card: 'border-gray-700', label: 'emerald', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
    warning: { dot: 'bg-amber-400',   card: 'border-amber-500/30 bg-amber-500/3', label: 'amber',   text: 'text-amber-400',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25'   },
    alert:   { dot: 'bg-rose-400',    card: 'border-rose-500/40 bg-rose-500/5',   label: 'rose',    text: 'text-rose-400',    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25'       },
    offline: { dot: 'bg-gray-500',    card: 'border-gray-700 opacity-60',         label: 'gray',    text: 'text-gray-400',    badge: 'bg-gray-700 text-gray-400 border-gray-600'             },
  };

  const tempColor = (sensor) => {
    const st = getSensorStatus(sensor);
    if (st === 'alert')   return 'text-rose-300';
    if (st === 'warning') return 'text-amber-300';
    return 'text-emerald-300';
  };

  // KPI calculations
  const violations  = tempLog.filter(t => t.status === 'Alert').length;
  const warnings    = tempLog.filter(t => t.status === 'Warning').length;
  const alertSensors = sensors.filter(s => getSensorStatus(s) === 'alert').length;
  const monitoredLots = [...new Set(tempLog.map(t => t.lotId))].length;
  const totalReadings = tempLog.length;
  const compPct = Math.round(((totalReadings - violations) / totalReadings) * 100);

  // Filtered log
  const filteredLog = tempLog.filter(e => {
    if (logFilter !== 'All' && e.status !== logFilter) return false;
    if (logLotFilter !== 'All' && e.lotId !== logLotFilter) return false;
    return true;
  });

  const handleSimulate = (sensorId) => {
    setSimSensor(sensorId);
    setTimeout(() => {
      setSensors(prev => prev.map(s => {
        if (s.id !== sensorId) return s;
        const t = TEMP_THRESHOLDS[s.zone];
        const base = (t.min + t.max) / 2;
        const newTemp = parseFloat((base + (Math.random() * 4 - 2)).toFixed(1));
        return { ...s, currentTemp: newTemp, lastPing: new Date().toISOString() };
      }));
      setSimSensor(null);
    }, 1400);
  };

  const handleLogReading = () => {
    if (!logForm.temp) return;
    const t = TEMP_THRESHOLDS[logForm.zone];
    const temp = parseFloat(logForm.temp);
    const status = temp > t.max + 1 || temp < t.min - 1 ? 'Alert'
      : temp > t.max || temp < t.min ? 'Warning' : 'Normal';
    const entry = {
      id: `TL-${String(Date.now()).slice(-4)}`,
      sensorId: 'Manual',
      sensorName: logForm.sensor || 'Manual Entry',
      lotId: logForm.lotId,
      sku: HACCP_LOT_META[logForm.lotId]?.sku || '—',
      zone: logForm.zone,
      temp,
      min: t.min, max: t.max,
      status,
      loggedBy: 'Carlos M.',
      at: new Date().toISOString(),
      notes: logForm.notes,
    };
    setTempLog(prev => [entry, ...prev]);
    setLogModal(false);
    setLogForm({ lotId: 'LOT-A-URGENT', zone: 'FRZ', temp: '', sensor: '', notes: '' });
    notify(`Temperature reading logged for ${entry.lotId} — status: ${status}`, status === 'Normal' ? 'success' : 'warning');
  };

  const handleExportLog = () => {
    const header = 'ID,Sensor,Lot,SKU,Zone,Temp (°C),Min,Max,Status,Logged By,Timestamp,Notes';
    const rows = filteredLog.map(e => `${e.id},${e.sensorName},${e.lotId},${e.sku},${e.zone},${e.temp},${e.min},${e.max},${e.status},${e.loggedBy},${e.at},"${e.notes}"`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `cold-chain-log-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredLog.length} temperature records.`, 'success');
  };

  // HACCP sparkline SVG
  const HaccpSparkline = ({ lotId }) => {
    const pts = HACCP_SPARKLINES[lotId] || [];
    const th  = TEMP_THRESHOLDS[HACCP_LOT_META[lotId]?.zone || 'CLR'];
    if (!pts.length) return null;
    const minV = Math.min(...pts, th.min) - 1;
    const maxV = Math.max(...pts, th.max) + 1;
    const range = maxV - minV;
    const W = 320, H = 80;
    const xStep = W / (pts.length - 1);
    const toY = (v) => H - ((v - minV) / range) * H;
    const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * xStep).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
    const thMinY = toY(th.min).toFixed(1);
    const thMaxY = toY(th.max).toFixed(1);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
        {/* threshold band */}
        <rect x="0" y={thMaxY} width={W} height={parseFloat(thMinY) - parseFloat(thMaxY)} fill="rgba(52,211,153,0.08)" />
        <line x1="0" y1={thMinY} x2={W} y2={thMinY} stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="4 3" />
        <line x1="0" y1={thMaxY} x2={W} y2={thMaxY} stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="4 3" />
        {/* temperature line */}
        <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* violation dots */}
        {pts.map((v, i) => {
          const exceedance = v > th.max || v < th.min;
          return exceedance ? (
            <circle key={i} cx={(i * xStep).toFixed(1)} cy={toY(v).toFixed(1)} r="4" fill="#f43f5e" />
          ) : null;
        })}
        {/* hour labels */}
        {[0, 3, 6, 9, 11].map(i => (
          <text key={i} x={(i * xStep).toFixed(1)} y={H - 2} fontSize="9" fill="#4b5563" textAnchor="middle">
            {`-${11 - i}h`}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-5">
      {/* Inline toast */}
      {ccToast && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${ccToast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' : 'bg-amber-500/10 border-amber-500/25 text-amber-300'}`}>
          {ccToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {ccToast.msg}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-cyan-400" /> Cold Chain & Temperature Monitoring
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time IoT sensor feeds, HACCP temperature logs, and CCP compliance tracking</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> IoT Feed Live
          </div>
          <button onClick={() => setLogModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 rounded-xl text-sm font-semibold transition-colors">
            <Thermometer className="w-4 h-4" /> Log Reading
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Active Sensors', value: sensors.length, sub: `${alertSensors} alert${alertSensors !== 1 ? 's' : ''}`, color: alertSensors > 0 ? 'rose' : 'emerald', Icon: Radio },
          { label: 'Temp Violations',value: violations,     sub: `${warnings} warnings`, color: violations > 0 ? 'rose' : 'emerald', Icon: Zap },
          { label: 'Lots Monitored', value: monitoredLots,  sub: 'active this shift',  color: 'cyan',    Icon: Thermometer },
          { label: 'Total Readings', value: totalReadings,  sub: 'last 24 hours',      color: 'gray',    Icon: ClipboardList },
          { label: 'CCP Compliance', value: `${compPct}%`,  sub: violations > 0 ? 'violations recorded' : 'all within range', color: compPct >= 95 ? 'emerald' : compPct >= 80 ? 'amber' : 'rose', Icon: CheckCircle2 },
        ].map(({ label, value, sub, color, Icon }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 text-${color}-400`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <div className="text-xl font-bold text-gray-100">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {[
          { id: 'monitor', label: 'Live Monitor',      Icon: Wifi       },
          { id: 'log',     label: 'Temperature Log',   Icon: ClipboardList },
          { id: 'haccp',   label: 'HACCP Reports',     Icon: FileText   },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setColdSubTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${coldSubTab === id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── LIVE MONITOR ── */}
      {coldSubTab === 'monitor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map(sensor => {
            const th   = TEMP_THRESHOLDS[sensor.zone];
            const st   = getSensorStatus(sensor);
            const sc   = statusColors[st];
            const isSim = simSensor === sensor.id;
            const pct  = th ? Math.max(0, Math.min(100, ((sensor.currentTemp - th.min) / (th.max - th.min)) * 100)) : 50;
            return (
              <div key={sensor.id} className={`bg-gray-900 border ${sc.card} rounded-xl p-5 space-y-3 transition-all`}>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${sc.dot} ${st !== 'offline' ? 'animate-pulse' : ''}`} />
                      <span className="font-bold text-gray-100">{sensor.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{sensor.location}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sc.badge}`}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </span>
                </div>

                {/* Big temperature */}
                <div className="text-center py-2">
                  {isSim
                    ? <div className="text-3xl font-black text-gray-600 animate-pulse">—</div>
                    : <div className={`text-4xl font-black tabular-nums ${tempColor(sensor)}`}>{sensor.currentTemp.toFixed(1)}°C</div>
                  }
                  <div className="text-xs text-gray-500 mt-1">Range: {th?.min}°C to {th?.max}°C</div>
                </div>

                {/* Threshold bar */}
                {th && (
                  <div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-2 rounded-full transition-all ${st === 'alert' ? 'bg-rose-500' : st === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{th.min}°C</span><span className="text-gray-500">{th.zone}</span><span>{th.max}°C</span>
                    </div>
                  </div>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800">
                  {[
                    { label: 'Model',    val: sensor.model    },
                    { label: 'Connect',  val: sensor.connType },
                    { label: 'Battery',  val: `${sensor.battPct}%` },
                    { label: 'Lots',     val: sensor.lots.join(', ') },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <div className="text-xs text-gray-600">{label}</div>
                      <div className="text-xs font-semibold text-gray-400 truncate">{val}</div>
                    </div>
                  ))}
                </div>

                {/* Simulate reading button */}
                <button disabled={isSim} onClick={() => handleSimulate(sensor.id)}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {isSim ? <><span className="animate-spin">↻</span> Polling…</> : <><Radio className="w-3.5 h-3.5" /> Simulate Reading</>}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TEMPERATURE LOG ── */}
      {coldSubTab === 'log' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 flex-wrap">
              {['All', 'Alert', 'Warning', 'Normal'].map(f => (
                <button key={f} onClick={() => setLogFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${logFilter === f ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25' : 'bg-gray-800 text-gray-400 border-transparent hover:text-gray-200'}`}>{f}</button>
              ))}
            </div>
            <select value={logLotFilter} onChange={e => setLogLotFilter(e.target.value)} className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-xs outline-none">
              <option value="All">All Lots</option>
              {Object.keys(HACCP_LOT_META).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={handleExportLog} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-cyan-500/30 rounded-lg text-xs font-semibold transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                  {['Timestamp', 'Lot / SKU', 'Zone', 'Sensor', 'Temp', 'Threshold', 'Status', 'Logged By', 'Notes'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLog.map(e => {
                  const statusMap = {
                    Normal:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    Warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    Alert:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  };
                  const tempNum = Number(e.temp);
                  const tempTxt = e.status === 'Alert' ? 'text-rose-300 font-bold' : e.status === 'Warning' ? 'text-amber-300 font-semibold' : 'text-emerald-300';
                  return (
                    <tr key={e.id} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(e.at)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-200 text-xs">{e.lotId}</div>
                        <div className="text-xs text-gray-500">{e.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TEMP_THRESHOLDS[e.zone]?.bg} ${TEMP_THRESHOLDS[e.zone]?.text}`}>{TEMP_THRESHOLDS[e.zone]?.zone || e.zone}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{e.sensorName}</td>
                      <td className={`px-4 py-3 font-mono text-sm ${tempTxt}`}>{tempNum >= 0 ? '+' : ''}{tempNum.toFixed(1)}°C</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{e.min}° – {e.max}°C</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusMap[e.status] || 'bg-gray-700 text-gray-300'}`}>{e.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{e.loggedBy}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-40 truncate" title={e.notes}>{e.notes || <span className="text-gray-700">—</span>}</td>
                    </tr>
                  );
                })}
                {filteredLog.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">No log entries match the current filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── HACCP REPORTS ── */}
      {coldSubTab === 'haccp' && (
        <div className="space-y-5">
          {/* Lot selector */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Select Lot for HACCP Analysis</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(HACCP_LOT_META).map(lotId => {
                const m = HACCP_LOT_META[lotId];
                const active = haccpLot === lotId;
                const hasVio = m.violations > 0;
                return (
                  <button key={lotId} onClick={() => { setHaccpLot(lotId); setHaccpFired(false); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${active ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${hasVio ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                    {lotId}
                    {hasVio && <span className="text-xs bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full border border-rose-500/25">{m.violations} vio</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* HACCP summary for selected lot */}
          {haccpLot && (() => {
            const m  = HACCP_LOT_META[haccpLot];
            const th = TEMP_THRESHOLDS[m.zone];
            const sns = INIT_COLD_SENSORS.find(s => s.id === m.sensor);
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: meta + compliance */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CCP Summary</div>
                    <div>
                      <div className="text-lg font-bold text-gray-100">{haccpLot}</div>
                      <div className="text-sm text-gray-400">{m.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{m.sku}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Zone',        val: th?.zone },
                        { label: 'Sensor',      val: sns?.name },
                        { label: 'Readings',    val: m.readings },
                        { label: 'Violations',  val: m.violations, red: m.violations > 0 },
                        { label: 'Compliance',  val: `${m.compliance}%`, red: m.compliance < 90, green: m.compliance >= 95 },
                        { label: 'Threshold',   val: `${th?.min}–${th?.max}°C` },
                      ].map(({ label, val, red, green }) => (
                        <div key={label} className="bg-gray-800/60 rounded-lg p-2.5">
                          <div className="text-xs text-gray-500">{label}</div>
                          <div className={`text-sm font-bold mt-0.5 ${red ? 'text-rose-400' : green ? 'text-emerald-400' : 'text-gray-200'}`}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <div className={`flex items-center gap-2 p-3 rounded-xl border ${m.compliance >= 90 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                      {m.compliance >= 90 ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                      <span className="text-xs font-semibold">{m.compliance >= 90 ? 'CCP PASS — Within HACCP limits' : 'CCP FAIL — Review required'}</span>
                    </div>
                  </div>

                  {/* Generate Report */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    {!haccpFired ? (
                      <button onClick={() => setHaccpFired(true)}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" /> Generate HACCP Report
                      </button>
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Report Generated
                        </div>
                        <div className="text-xs text-gray-500 font-mono">HACCP-{haccpLot}-{new Date().toISOString().slice(0,10)}.pdf</div>
                        <button className="w-full mt-2 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-cyan-300 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: sparkline + readings table */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-300">Temperature Trend — Last 12 Hours</span>
                      <span className="text-xs text-gray-500">{th?.min}°C – {th?.max}°C threshold</span>
                    </div>
                    <HaccpSparkline lotId={haccpLot} />
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-2 text-xs text-gray-500"><span className="inline-block w-6 h-0.5 bg-cyan-400" /> Temp reading</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500"><span className="inline-block w-3 h-3 rounded-full bg-rose-500" /> Violation</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500"><span className="inline-block w-6 h-0.5 bg-emerald-400 opacity-50" style={{borderTop: '1px dashed'}} /> Safe zone</div>
                    </div>
                  </div>

                  {/* Recent readings for this lot */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-800 text-sm font-semibold text-gray-300">Recent Readings — {haccpLot}</div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                          {['Time', 'Temp', 'Sensor', 'Status', 'Notes'].map(h => <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {tempLog.filter(e => e.lotId === haccpLot).slice(0, 8).map(e => {
                          const tempNum = Number(e.temp);
                          const tc = e.status === 'Alert' ? 'text-rose-300 font-bold' : e.status === 'Warning' ? 'text-amber-300' : 'text-emerald-300';
                          const sc2 = { Normal: 'bg-emerald-500/10 text-emerald-400', Warning: 'bg-amber-500/10 text-amber-400', Alert: 'bg-rose-500/10 text-rose-400' };
                          return (
                            <tr key={e.id} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                              <td className="px-4 py-2.5 text-xs text-gray-400">{fmtDateTime(e.at)}</td>
                              <td className={`px-4 py-2.5 font-mono text-sm ${tc}`}>{tempNum >= 0 ? '+' : ''}{tempNum.toFixed(1)}°C</td>
                              <td className="px-4 py-2.5 text-xs text-gray-400">{e.sensorName}</td>
                              <td className="px-4 py-2.5"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc2[e.status]}`}>{e.status}</span></td>
                              <td className="px-4 py-2.5 text-xs text-gray-500 max-w-52 truncate">{e.notes || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Log Manual Reading Modal ── */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setLogModal(false)}>
          <div className="bg-gray-950 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-gray-100">Log Manual Temperature Reading</h3>
              </div>
              <button onClick={() => setLogModal(false)} className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Lot ID</label>
                  <select value={logForm.lotId} onChange={e => setLogForm(f => ({ ...f, lotId: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none">
                    {Object.keys(HACCP_LOT_META).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Storage Zone</label>
                  <select value={logForm.zone} onChange={e => setLogForm(f => ({ ...f, zone: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none">
                    {Object.entries(TEMP_THRESHOLDS).map(([k, v]) => <option key={k} value={k}>{v.zone}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Temperature (°C) <span className="text-rose-400">*</span></label>
                  <input type="number" step="0.1" value={logForm.temp} onChange={e => setLogForm(f => ({ ...f, temp: e.target.value }))}
                    placeholder={`${TEMP_THRESHOLDS[logForm.zone]?.min}–${TEMP_THRESHOLDS[logForm.zone]?.max}°C`}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600" />
                  {logForm.temp && (() => {
                    const t = TEMP_THRESHOLDS[logForm.zone];
                    const v = parseFloat(logForm.temp);
                    const st = v > t.max || v < t.min ? (Math.abs(v - (v > t.max ? t.max : t.min)) > 1 ? 'Alert' : 'Warning') : 'Normal';
                    const color = { Alert: 'text-rose-400', Warning: 'text-amber-400', Normal: 'text-emerald-400' }[st];
                    return <div className={`text-xs font-semibold mt-1.5 ${color}`}>→ Will log as: {st}</div>;
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Sensor / Location</label>
                  <input value={logForm.sensor} onChange={e => setLogForm(f => ({ ...f, sensor: e.target.value }))}
                    placeholder="e.g. Freezer A Bay 3" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Reason for manual log, observations, corrective action…" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setLogModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:text-gray-200 transition-colors">Cancel</button>
                <button onClick={handleLogReading} disabled={!logForm.temp} className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors disabled:opacity-40">Save Reading</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main module ─────────────────────────────────────────────────────────────
export default function LossPreventionModule() {
  const { auditLog, users, settings, updateSetting, can } = useKernal();
  const [tab, setTab] = useState('journal');
  const canEdit = can('lossPrevention') === 'full';

  // Feature-flag visibility
  const coldChainEnabled  = !!(settings.features?.refrigeratedFoods || settings.features?.frozenFoods || settings.features?.temperatureLogging);
  const fsmaEnabled       = settings.features?.fsmaTraceability    !== false;
  const allergenEnabled   = settings.features?.allergenManagement  !== false;
  const pacaEnabled       = settings.features?.pacaCompliance      !== false;

  const tabs = [
    { id: 'journal',   label: 'Live Journal',      Icon: Activity      },
    { id: 'lockdown',  label: 'Lockdown',          Icon: Lock          },
    { id: 'employees', label: 'Employee Activity', Icon: UsersIcon     },
    ...(allergenEnabled  ? [{ id: 'allergen', label: 'Allergen Recall',  Icon: FlaskConical }] : []),
    ...(fsmaEnabled      ? [{ id: 'fsma204',  label: 'FSMA 204 / PTI',  Icon: GitBranch    }] : []),
    ...(pacaEnabled      ? [{ id: 'paca',     label: 'PACA Compliance', Icon: Scale        }] : []),
    ...(coldChainEnabled ? [{ id: 'coldchain', label: 'Cold Chain',     Icon: Thermometer  }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-500" /> Loss Prevention
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Audit journal, inventory lockdown gates, and per-employee activity for internal investigations.</p>
        </div>

        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {tabs.map(t => {
            const Icon = t.Icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'journal'   && <LiveJournal      auditLog={auditLog} users={users} />}
        {tab === 'lockdown'  && <Lockdown         settings={settings} updateSetting={updateSetting} canEdit={canEdit} />}
        {tab === 'employees' && <EmployeeActivity auditLog={auditLog} users={users} />}
        {tab === 'allergen'  && allergenEnabled   && <AllergenRecall />}
        {tab === 'fsma204'   && fsmaEnabled       && <Fsma204Tab />}
        {tab === 'paca'      && pacaEnabled       && <PacaTab />}
        {tab === 'coldchain' && coldChainEnabled  && <ColdChainTab />}
      </div>
    </div>
  );
}
