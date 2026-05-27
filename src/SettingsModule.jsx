import { useState, useMemo, useEffect, useCallback } from 'react';
import { useKernal, APPROVAL_FLOW_TYPES, ROLES, PLANS, ADDONS } from './KernalContext.jsx';
import { configureWebhook, getWebhookUrl, captureError, getReports, onReportsChange, formatReportAsText } from './ErrorReporter.js';
import { api } from './lib/api.js';

// ── Icons ─────────────────────────────────────────────────────────────────────
function BuildingIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/><path d="M12 12v4"/><path d="M8 12h8"/></svg>;
}
function ToggleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></svg>;
}
function LayersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
}
function ShieldIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 12 14 16 9"/></svg>;
}
function SaveIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function MailIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>;
}
function SendIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function EyeIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function BugIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l1.88 1.88M14.12 3.88 16 2"/><path d="M9 7.13v-1a3 3 0 0 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 4-4"/><path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4"/><path d="M18 13h4"/><path d="M21 21c0-2.1-1.7-3.9-4-4"/></svg>;
}
function LinkIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
}
function FlaskIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"/><path d="M10 3v5l-4.5 8.5A2 2 0 0 0 7.24 20h9.52a2 2 0 0 0 1.74-2.5L14 8.5V3"/></svg>;
}
function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}

// ── Toggle Switch Component ───────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
        checked ? 'bg-cyan-500' : 'bg-gray-700',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span className={['pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200', checked ? 'translate-x-5' : 'translate-x-0.5'].join(' ')} />
    </button>
  );
}

// ── Field Component ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder = '', type = 'text', half = false }) {
  return (
    <div className={half ? 'sm:col-span-1' : 'sm:col-span-2'}>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition"
      />
    </div>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────
function FeatureRow({ label, description, path, tag, tagColor = 'bg-sky-500/15 text-sky-400' }) {
  const { settings, updateSetting } = useKernal();
  const keys = path.split('.');
  let val = settings;
  for (const k of keys) val = val?.[k];
  const checked = !!val;
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-800/70 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-100">{label}</span>
          {tag && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tagColor}`}>{tag}</span>}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
      <Toggle checked={checked} onChange={v => updateSetting(path, v)} />
    </div>
  );
}

// ── Module visibility — all 24 modules, grouped by category ──────────────────
const MODULE_GROUPS_META = [
  {
    group: 'Operations',
    color: 'text-emerald-400',
    modules: [
      { id:'inventory',   label:'Inventory',        icon:'📦', desc:'Product catalog, stock levels, lot tracking' },
      { id:'demand',      label:'Demand Planning',   icon:'📈', desc:'AI buying recommendations, forecasting' },
      { id:'warehouse',   label:'Warehouse',         icon:'🏭', desc:'Receiving, putaway, pick/pack tasks' },
      { id:'mobilewms',   label:'Mobile WMS',        icon:'📱', desc:'Barcode scanning, warehouse associate app' },
      { id:'logistics',   label:'Delivery Operations',icon:'🚚', desc:'Routes, driver app, deliveries, POD' },
      { id:'gps',         label:'Fleet Intelligence', icon:'🛰️', desc:'Live GPS tracking, route optimization' },
    ],
  },
  {
    group: 'Sales',
    color: 'text-violet-400',
    modules: [
      { id:'crm',         label:'CRM',               icon:'🤝', desc:'Customer success, accounts, contacts' },
      { id:'b2b',         label:'B2B Portal',         icon:'🏢', desc:'Customer self-service ordering portal' },
      { id:'field',       label:'Field Sales',        icon:'📍', desc:'Mobile sales reps, prospect management' },
      { id:'pricing',     label:'Pricing Engine',     icon:'🏷️', desc:'Customer tiers, contract pricing, discounts' },
    ],
  },
  {
    group: 'Finance',
    color: 'text-amber-400',
    modules: [
      { id:'procurement', label:'Procurement',        icon:'🛒', desc:'Purchase orders, vendor management' },
      { id:'landedcost',  label:'Landed Cost',        icon:'⚓', desc:'Freight, duties, and true cost of goods' },
      { id:'accounting',  label:'Accounting',         icon:'💰', desc:'Invoices, daily close-out, deposits' },
      { id:'gl',          label:'General Ledger',     icon:'📒', desc:'Chart of accounts, journal entries, P&L' },
      { id:'approvals',   label:'Approvals',          icon:'✅', desc:'PO approvals, credit holds, discount overrides' },
    ],
  },
  {
    group: 'Admin',
    color: 'text-rose-400',
    modules: [
      { id:'lossPrevention', label:'Compliance & Risk', icon:'🛡️', desc:'FSMA traceability, PACA, audit journal' },
      { id:'settings',    label:'Settings',           icon:'⚙️', desc:'Business profile, features, module config', locked: true },
      { id:'users',       label:'Users',              icon:'👥', desc:'User accounts, roles, permissions', locked: true },
    ],
  },
  {
    group: 'Intelligence',
    color: 'text-cyan-400',
    modules: [
      { id:'nlquery',     label:'Ask Kernel',         icon:'✨', desc:'Natural language queries across all your data' },
      { id:'reports',     label:'Report Builder',     icon:'📊', desc:'Custom reports, scheduled exports' },
    ],
  },
  {
    group: 'Platform',
    color: 'text-sky-400',
    modules: [
      { id:'integrations', label:'Integrations',     icon:'🔌', desc:'Third-party connectors, API keys' },
      { id:'edi',          label:'EDI Integration',  icon:'↔️', desc:'850/856/810/214 EDI document exchange' },
      { id:'developer',    label:'Developer API',    icon:'</>', desc:'Webhooks, REST API, OAuth apps' },
      { id:'ecommerce',    label:'eCommerce',         icon:'🛍️', desc:'Shopify, WooCommerce, marketplace sync' },
    ],
  },
];

function ModuleVisibilityRow({ mod }) {
  const { settings, updateSetting, logAudit } = useKernal();
  const isLocked = !!mod.locked;
  const enabled = isLocked ? true : (settings.modules?.[mod.id] !== false);
  const handleToggle = (v) => {
    updateSetting(`modules.${mod.id}`, v);
    logAudit({
      moduleId: 'settings',
      action: 'settings.module.toggle',
      entityType: 'module',
      entityId: mod.id,
      summary: `Module "${mod.label}" ${v ? 'enabled' : 'disabled'}`,
      before: { enabled: !v },
      after:  { enabled: v },
      severity: 'notice',
    });
  };
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-800/60 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-lg w-7 text-center">{mod.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${enabled ? 'text-gray-100' : 'text-gray-500'}`}>{mod.label}</span>
            {isLocked && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-700/80 text-gray-500">Always on</span>}
          </div>
          <p className={`text-xs ${enabled ? 'text-gray-500' : 'text-gray-600'}`}>{mod.desc}</p>
        </div>
      </div>
      {isLocked
        ? <span className="text-xs text-gray-700">🔒</span>
        : <Toggle checked={enabled} onChange={handleToggle} />
      }
    </div>
  );
}

// ── Scheduled Reports ─────────────────────────────────────────────────────────

const REPORT_DEFS = [
  {
    id: 'dispatch_daily',
    icon: '🚚',
    name: 'Daily Dispatch Summary',
    description: "Yesterday's route performance — stops completed, on-time rate, exceptions flagged, and a preview of tomorrow's schedule. Lands in inboxes before the warehouse opens.",
    defaultRoles: ['admin', 'manager', 'dispatcher'],
    defaultFreq: 'daily',
    defaultTime: '06:00',
    defaultDay: 'mon',
    lastSent: 'Yesterday at 06:00',
    color: 'sky',
  },
  {
    id: 'ar_aging_weekly',
    icon: '💰',
    name: 'Weekly AR Aging',
    description: 'Outstanding receivables bucketed by aging (Current · 30 · 60 · 90+ days). Highlights overdue accounts and total cash at risk — no need to open Accounting.',
    defaultRoles: ['admin', 'manager', 'accountant'],
    defaultFreq: 'weekly',
    defaultTime: '07:00',
    defaultDay: 'mon',
    lastSent: 'Mon, May 18 at 07:00',
    color: 'emerald',
  },
  {
    id: 'margin_monthly',
    icon: '📊',
    name: 'Monthly Margin Report',
    description: 'Revenue, COGS, and gross profit by product category for the prior month. Surfaces top and bottom margin performers. Sent on the 1st of each month.',
    defaultRoles: ['admin', 'manager', 'accountant'],
    defaultFreq: 'monthly',
    defaultTime: '07:00',
    defaultDay: 'mon',
    lastSent: 'Fri, May 1 at 07:00',
    color: 'violet',
  },
];

const REPORT_PREVIEW_DATA = {
  dispatch_daily: {
    subjectDate: 'May 24, 2026',
    date: 'Sunday, May 24, 2026',
    kpis: [
      { value: '3',    label: 'Routes Dispatched' },
      { value: '28/30', label: 'Stops Completed' },
      { value: '93%',  label: 'On-Time Rate' },
      { value: '2',    label: 'Exceptions' },
    ],
    routes: [
      { id:'BR-NORTH', driver:'Marcus Webb',   planned:10, completed:10, onTime:100, notes:'' },
      { id:'BR-SOUTH', driver:'Carlos Tran',   planned:12, completed:11, onTime:92,  notes:'1 short-ship' },
      { id:'LSU-UNIV', driver:'Derek Johnson', planned:8,  completed:7,  onTime:88,  notes:'1 refusal' },
    ],
    exceptions: [
      { order:'SO-9895', customer:'Harbor View Restaurant',  detail:'2 cases short-shipped — Ground Beef 80/20 (inventory reallocated to priority order SO-9893).' },
      { order:'SO-9899', customer:'LSU Campus Dining Svcs', detail:'Delivery refused — damaged outer cartons on Jasmine Rice 50lb bags. Product returned to warehouse for QC inspection.' },
    ],
    tomorrow: { date:'Monday, May 25', routes:3, stops:31, pct:97 },
  },
  ar_aging_weekly: {
    subjectDate: 'Week of May 18 – 24, 2026',
    weekOf: 'May 18 – 24, 2026',
    total: 73300,
    buckets: [
      { label:'Current (0–30 days)', amount:42800, pct:58, color:'text-emerald-400', barColor:'bg-emerald-500' },
      { label:'30–60 days',          amount:18400, pct:25, color:'text-amber-400',   barColor:'bg-amber-500'   },
      { label:'60–90 days',          amount:8900,  pct:12, color:'text-orange-400',  barColor:'bg-orange-500'  },
      { label:'90+ days (Critical)', amount:3200,  pct:4,  color:'text-rose-400',    barColor:'bg-rose-500'    },
    ],
    accounts: [
      { name:'Metro Diner & Grill',    balance:8400, days:61, alert:'Approaching Credit Hold' },
      { name:'Sunset Bistro & Bar',    balance:6200, days:47, alert:null },
      { name:'LSU Campus Dining Svcs', balance:4100, days:38, alert:null },
      { name:'Harbor View Restaurant', balance:2800, days:33, alert:null },
    ],
  },
  margin_monthly: {
    subjectDate: 'April 2026',
    month: 'April 2026',
    summary: { revenue:284500, cogs:197300, gp:87200, gpPct:30.7 },
    categories: [
      { name:'Frozen Proteins', revenue:98200,  cogs:71400,  gpPct:27.3, trend:'↓' },
      { name:'Fresh Produce',   revenue:54600,  cogs:34100,  gpPct:37.5, trend:'↑' },
      { name:'Dairy Products',  revenue:41800,  cogs:27200,  gpPct:34.9, trend:'→' },
      { name:'Dry Goods',       revenue:62400,  cogs:46800,  gpPct:25.0, trend:'↓' },
      { name:'Supplies',        revenue:27500,  cogs:17800,  gpPct:35.3, trend:'→' },
    ],
    alerts: [
      { type:'warning',  message:'Dry Goods margin at 25.0% — below 28% threshold. Review vendor pricing on Jasmine Rice and bulk dry SKUs.' },
      { type:'positive', message:'Fresh Produce strongest performer this month at 37.5% GP. Customer demand up 12% MoM.' },
    ],
  },
};

// ── Report preview content sub-components ────────────────────────────────────

function DispatchReportContent({ data }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-100">🚚 Daily Dispatch Summary</h2>
        <p className="text-xs text-gray-500 mt-0.5">{data.date} · Baton Rouge Metro Area</p>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {data.kpis.map(k => (
          <div key={k.label} className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800">
            <div className="text-lg font-black text-gray-100">{k.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{k.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Route Performance</h3>
      <div className="rounded-lg border border-gray-800 overflow-hidden mb-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900/80 text-gray-500">
              <th className="text-left px-3 py-2">Route</th>
              <th className="text-left px-3 py-2">Driver</th>
              <th className="text-center px-3 py-2">Stops</th>
              <th className="text-center px-3 py-2">On-Time</th>
              <th className="text-left px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.routes.map((r,i) => (
              <tr key={i} className="border-t border-gray-800/60">
                <td className="px-3 py-2 font-mono font-bold text-cyan-400">{r.id}</td>
                <td className="px-3 py-2 text-gray-300">{r.driver}</td>
                <td className="px-3 py-2 text-center text-gray-300">{r.completed}/{r.planned}</td>
                <td className="px-3 py-2 text-center font-bold">
                  <span className={r.onTime >= 95 ? 'text-emerald-400' : r.onTime >= 85 ? 'text-amber-400' : 'text-rose-400'}>{r.onTime}%</span>
                </td>
                <td className="px-3 py-2 text-gray-500">{r.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.exceptions.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">⚠ Exceptions ({data.exceptions.length})</h3>
          <div className="space-y-2">
            {data.exceptions.map((ex,i) => (
              <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                <div className="font-bold text-amber-300 text-xs">{ex.order} — {ex.customer}</div>
                <div className="text-xs text-gray-400 mt-0.5">{ex.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-4 py-3">
        <p className="text-xs font-bold text-cyan-400 mb-0.5">📅 Tomorrow's Schedule — {data.tomorrow.date}</p>
        <p className="text-xs text-gray-400">{data.tomorrow.routes} routes · {data.tomorrow.stops} stops · Est. {data.tomorrow.pct}% capacity</p>
      </div>
    </div>
  );
}

function ArAgingReportContent({ data }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-100">💰 Weekly AR Aging Report</h2>
        <p className="text-xs text-gray-500 mt-0.5">Week of {data.weekOf}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-5 text-center">
        <div className="text-3xl font-black text-gray-100">${data.total.toLocaleString()}</div>
        <div className="text-xs text-gray-500 mt-1">Total Outstanding Receivables</div>
      </div>
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Aging Buckets</h3>
      <div className="space-y-3 mb-5">
        {data.buckets.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className={`${b.color} font-semibold`}>{b.label}</span>
              <span className="text-gray-300 font-bold">${b.amount.toLocaleString()} <span className="text-gray-500 font-normal">({b.pct}%)</span></span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${b.barColor} transition-all`} style={{ width:`${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Accounts Requiring Attention</h3>
      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900/80 text-gray-500">
              <th className="text-left px-3 py-2">Account</th>
              <th className="text-right px-3 py-2">Balance</th>
              <th className="text-right px-3 py-2">Days Past Due</th>
              <th className="text-left px-3 py-2">Flag</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.map((a,i) => (
              <tr key={i} className="border-t border-gray-800/60">
                <td className="px-3 py-2 text-gray-300 font-medium">{a.name}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-200">${a.balance.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-bold ${a.days >= 60 ? 'text-rose-400' : a.days >= 30 ? 'text-amber-400' : 'text-gray-400'}`}>{a.days}d</td>
                <td className="px-3 py-2">
                  {a.alert && <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full">⚠ {a.alert}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarginReportContent({ data }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-100">📊 Monthly Margin Report</h2>
        <p className="text-xs text-gray-500 mt-0.5">{data.month} · Final</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-black text-gray-100">${(data.summary.revenue/1000).toFixed(0)}K</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Revenue</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-black text-gray-100">${(data.summary.cogs/1000).toFixed(0)}K</div>
          <div className="text-[10px] text-gray-500 mt-0.5">COGS</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
          <div className="text-xl font-black text-emerald-400">{data.summary.gpPct}%</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Gross Profit</div>
        </div>
      </div>
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">By Category</h3>
      <div className="rounded-lg border border-gray-800 overflow-hidden mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900/80 text-gray-500">
              <th className="text-left px-3 py-2">Category</th>
              <th className="text-right px-3 py-2">Revenue</th>
              <th className="text-right px-3 py-2">COGS</th>
              <th className="text-right px-3 py-2">GP%</th>
              <th className="text-center px-3 py-2">MoM</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((c,i) => (
              <tr key={i} className="border-t border-gray-800/60">
                <td className="px-3 py-2 text-gray-300 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-300">${c.revenue.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-500">${c.cogs.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right font-bold ${c.gpPct >= 30 ? 'text-emerald-400' : c.gpPct >= 25 ? 'text-amber-400' : 'text-rose-400'}`}>{c.gpPct}%</td>
                <td className={`px-3 py-2 text-center font-bold ${c.trend === '↑' ? 'text-emerald-400' : c.trend === '↓' ? 'text-rose-400' : 'text-gray-500'}`}>{c.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2">
        {data.alerts.map((a,i) => (
          <div key={i} className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs ${
            a.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
          }`}>
            <span className="shrink-0">{a.type === 'warning' ? '⚠' : '↑'}</span>
            <span>{a.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Report Preview Modal ──────────────────────────────────────────────────────

function ReportPreviewModal({ reportId, onClose }) {
  const def = REPORT_DEFS.find(r => r.id === reportId);
  const data = REPORT_PREVIEW_DATA[reportId];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{def.icon}</span>
            <span className="font-bold text-gray-100 text-sm">{def.name}</span>
            <span className="text-xs text-gray-500">· Email Preview</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Email preview container */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
            {/* Email meta bar */}
            <div className="bg-gray-900/60 px-4 py-3 border-b border-gray-800 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-[10px] text-gray-500"><span className="text-gray-600">From:</span> Kernel ERM Reports &lt;noreply@kernal-erm.com&gt;</div>
                <div className="text-[10px] text-gray-500"><span className="text-gray-600">Subject:</span> {def.name} · {data.subjectDate}</div>
              </div>
              <span className="text-[10px] text-gray-700 shrink-0">Auto-generated · Do not reply</span>
            </div>

            {/* Report body */}
            <div className="p-5">
              {reportId === 'dispatch_daily'  && <DispatchReportContent  data={data} />}
              {reportId === 'ar_aging_weekly' && <ArAgingReportContent   data={data} />}
              {reportId === 'margin_monthly'  && <MarginReportContent    data={data} />}
            </div>

            {/* Email footer */}
            <div className="px-5 py-4 border-t border-gray-800/50">
              <p className="text-[10px] text-gray-600 text-center">
                You're receiving this because you're subscribed to scheduled reports in Kernel ERM.
                &nbsp;·&nbsp;<span className="text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">Manage Preferences</span>
                &nbsp;·&nbsp;<span className="text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">Unsubscribe</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scheduled Report Card ─────────────────────────────────────────────────────

const DAY_OPTS = [
  { v:'mon', l:'Monday' }, { v:'tue', l:'Tuesday' }, { v:'wed', l:'Wednesday' },
  { v:'thu', l:'Thursday' }, { v:'fri', l:'Friday' },
];

const COLOR_MAP = {
  sky:    { badge:'bg-sky-500/10 text-sky-400 border-sky-500/20',       active:'text-sky-400',    ring:'ring-sky-500/20'    },
  emerald:{ badge:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', active:'text-emerald-400', ring:'ring-emerald-500/20' },
  violet: { badge:'bg-violet-500/10 text-violet-400 border-violet-500/20',   active:'text-violet-400',  ring:'ring-violet-500/20'  },
};

function ScheduledReportCard({ def, sched, onChange, onPreview, onSendNow, wasSent }) {
  const { users, showToast } = useKernal();
  const [sendingNow, setSendingNow] = useState(false);

  const recipientCount = useMemo(() =>
    users.filter(u => u.active !== false && sched.roles.includes(u.role)).length,
  [users, sched.roles]);

  const nextSend = useMemo(() => {
    const t = sched.time || '07:00';
    if (sched.freq === 'daily') return `Tomorrow (Tue, May 26) at ${t}`;
    if (sched.freq === 'monthly') return `Jun 1 at ${t}`;
    const dayLabels = { mon:'Mon · Jun 1', tue:'Tue · May 26', wed:'Wed · May 27', thu:'Thu · May 28', fri:'Fri · May 29' };
    return `Next ${dayLabels[sched.day] || 'Mon · Jun 1'} at ${t}`;
  }, [sched]);

  const handleSendNow = () => {
    if (sendingNow || wasSent) return;
    setSendingNow(true);
    setTimeout(() => {
      setSendingNow(false);
      onSendNow();
      showToast(`${def.name} sent to ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`, 'success');
    }, 900);
  };

  const c = COLOR_MAP[def.color];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl border ${c.badge}`}>
            {def.icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-100 text-sm">{def.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{def.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sched.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
            {sched.active ? 'Active' : 'Paused'}
          </span>
          <Toggle checked={sched.active} onChange={v => onChange({ ...sched, active:v })} />
        </div>
      </div>

      {/* Schedule config */}
      <div className="px-5 pb-4 border-t border-gray-800/60 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Frequency</label>
          <select
            value={sched.freq}
            onChange={e => onChange({ ...sched, freq:e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly (1st)</option>
          </select>
        </div>

        {sched.freq === 'weekly' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Day of Week</label>
            <select
              value={sched.day}
              onChange={e => onChange({ ...sched, day:e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {DAY_OPTS.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Send Time</label>
          <input
            type="time"
            value={sched.time}
            onChange={e => onChange({ ...sched, time:e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Recipients */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-400">Recipients by Role</label>
          <span className="text-xs text-gray-600">{recipientCount} user{recipientCount !== 1 ? 's' : ''} matched</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ROLES).map(([rid, rdata]) => {
            const selected = sched.roles.includes(rid);
            return (
              <button
                key={rid}
                type="button"
                onClick={() => {
                  const next = selected ? sched.roles.filter(r => r !== rid) : [...sched.roles, rid];
                  onChange({ ...sched, roles:next });
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                  selected ? `${rdata.bg} ${rdata.color} border-current` : 'bg-gray-800 text-gray-500 border-gray-800 hover:text-gray-300'
                }`}
              >
                {rdata.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer: timestamps + action buttons */}
      <div className="px-5 py-3.5 border-t border-gray-800/60 flex items-center justify-between gap-4">
        <div className="text-xs text-gray-600 space-y-0.5">
          <div>Last sent: <span className="text-gray-400">{def.lastSent}</span></div>
          <div>Next send: <span className={sched.active ? 'text-gray-400' : 'text-gray-600 italic'}>{sched.active ? nextSend : 'Paused'}</span></div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            <EyeIcon /> Preview
          </button>
          <button
            onClick={handleSendNow}
            disabled={sendingNow || wasSent}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              wasSent       ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default' :
              sendingNow    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse cursor-default' :
              'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
            }`}
          >
            {wasSent ? <><CheckIcon /> Sent!</> : sendingNow ? 'Sending…' : <><SendIcon /> Send Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = ['viewer', 'staff', 'warehouse', 'manager', 'admin'];
const ROLE_COLORS = {
  admin:     'bg-rose-500/15 text-rose-400',
  manager:   'bg-amber-500/15 text-amber-400',
  warehouse: 'bg-blue-500/15 text-blue-400',
  staff:     'bg-cyan-500/15 text-cyan-400',
  viewer:    'bg-gray-700/60 text-gray-400',
};

function UsersTab() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState(null);
  const [editingRole, setEditingRole] = useState({}); // { [userId]: newRole }

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', role: 'staff', job_class: '',
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.admin.listUsers();
      setUsers(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setSaving(true); setFormErr(null);
    try {
      const res = await api.admin.inviteUser(form);
      setUsers(prev => [...prev, res.data]);
      setForm({ email: '', password: '', full_name: '', role: 'staff', job_class: '' });
      setShowForm(false);
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setEditingRole(prev => ({ ...prev, [userId]: true }));
    try {
      await api.admin.updateUser(userId, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      setError(e.message);
    } finally {
      setEditingRole(prev => { const n = { ...prev }; delete n[userId]; return n; });
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user? They will no longer be able to sign in.')) return;
    try {
      await api.admin.deactivateUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: false } : u));
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex items-center justify-center gap-3 text-gray-500 text-sm">
      <span className="animate-spin">⟳</span> Loading team members…
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold text-gray-100">Team Members</h2>
            <p className="text-xs text-gray-500 mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''} in your organization</p>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setFormErr(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Invite User'}
          </button>
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{error}</div>
        )}

        {/* Invite form */}
        {showForm && (
          <form onSubmit={handleInvite} className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Full Name</label>
              <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@yourcompany.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Temporary Password</label>
              <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-cyan-500/50">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Job Class <span className="text-gray-600">(optional)</span></label>
              <input value={form.job_class} onChange={e => setForm(f => ({ ...f, job_class: e.target.value }))}
                placeholder="e.g. Driver, Warehouse Associate, Sales Rep"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50" />
            </div>
            {formErr && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{formErr}</div>}
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-gray-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* User table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="text-center px-4 py-8 text-gray-600 text-sm">No users yet — invite your first team member above.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                      {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-medium ${u.is_active ? 'text-gray-100' : 'text-gray-500'}`}>
                      {u.full_name || '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={!u.is_active || editingRole[u.id]}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/40 ${ROLE_COLORS[u.role] || 'bg-gray-700 text-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {ROLE_OPTIONS.map(r => <option key={r} value={r} className="bg-gray-900 text-gray-100">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700/60 text-gray-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.is_active && (
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      className="text-xs text-gray-600 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
                      title="Deactivate user"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const TABS = [
  { id:'business',       label:'Business Profile',   icon: <BuildingIcon /> },
  { id:'team',           label:'Team',               icon: <span className="text-base leading-none">👥</span> },
  { id:'features',       label:'Feature Toggles',    icon: <ToggleIcon /> },
  { id:'approvals',      label:'Approvals',          icon: <ShieldIcon /> },
  { id:'modules',        label:'Module Visibility',  icon: <LayersIcon /> },
  { id:'billing',        label:'Plan & Billing',      icon: <span className="text-base leading-none">💳</span> },
  { id:'reports',        label:'Scheduled Reports',  icon: <MailIcon /> },
  { id:'errorreporting', label:'Error Reporting',    icon: <BugIcon /> },
];

export default function SettingsModule() {
  const { settings, updateSetting, updateApprovalRule, activeUser } = useKernal();
  const [tab, setTab] = useState('business');
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({ ...settings.business });

  // Error reporting state
  const [webhookDraft, setWebhookDraft] = useState(() => getWebhookUrl() || '');
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'sent' | 'saved'
  const [errorReports, setErrorReports] = useState(() => getReports());

  useEffect(() => {
    // Keep the reports list live — re-render whenever a new crash comes in
    const unsub = onReportsChange(reports => setErrorReports([...reports]));
    return unsub;
  }, []);

  const handleWebhookSave = useCallback(() => {
    configureWebhook(webhookDraft.trim() || null);
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2500);
  }, [webhookDraft]);

  const handleSendTest = useCallback(async () => {
    if (testSending) return;
    setTestSending(true);
    setTestResult(null);
    const report = await captureError({
      error:      new Error('This is a test report from the Error Reporting settings panel.'),
      moduleName: 'Settings',
      type:       'test',
    });
    setTestSending(false);
    setTestResult(report.sent ? 'sent' : 'saved');
    setTimeout(() => setTestResult(null), 4000);
  }, [testSending]);

  // Scheduled reports state
  const [scheduledReports, setScheduledReports] = useState(() =>
    Object.fromEntries(REPORT_DEFS.map(r => [r.id, {
      active: true,
      freq:   r.defaultFreq,
      time:   r.defaultTime,
      day:    r.defaultDay,
      roles:  [...r.defaultRoles],
    }]))
  );
  const [previewReport, setPreviewReport] = useState(null);
  const [sentNow, setSentNow] = useState({});

  const handleSave = () => {
    Object.entries(draft).forEach(([k, v]) => updateSetting(`business.${k}`, v));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setField = (key) => (val) => setDraft(d => ({ ...d, [key]: val }));

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-100">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure your business profile, feature set, and module visibility.</p>
        </div>

        {/* Tab bar */}
        <div id="kernal-module-tabs" className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60',
              ].join(' ')}
            >
              <span className="opacity-70 shrink-0">{t.icon}</span>
              <span className="hidden sm:inline truncate">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* ── Business Profile ── */}
        {tab === 'business' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Field label="Business Name"      value={draft.name}          onChange={setField('name')}          half={false} />
              <Field label="Street Address"     value={draft.address}       onChange={setField('address')}       half={false} />
              <Field label="City"               value={draft.city}          onChange={setField('city')}          half />
              <Field label="State"              value={draft.state}         onChange={setField('state')}         half />
              <Field label="ZIP Code"           value={draft.zip}           onChange={setField('zip')}           half />
              <Field label="Phone"              value={draft.phone}         onChange={setField('phone')}         half type="tel" />
              <Field label="Operations Email"   value={draft.email}         onChange={setField('email')}         half type="email" />
              <Field label="EIN"                value={draft.ein}           onChange={setField('ein')}           half />
              <Field label="Business License #" value={draft.licenseNumber} onChange={setField('licenseNumber')} half={false} />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-600">Changes apply immediately across all modules.</p>
              <button
                onClick={handleSave}
                className={['flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors', saved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'].join(' ')}
              >
                {saved ? <><CheckIcon /> Saved!</> : <><SaveIcon /> Save Changes</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Team ── */}
        {tab === 'team' && <UsersTab />}

        {/* ── Feature Toggles ── */}
        {tab === 'features' && (() => {
          const applyPreset = (flags) => Object.entries(flags).forEach(([k, v]) => updateSetting(`features.${k}`, v));
          const PRESETS = [
            {
              id: 'drygoods', label: 'Dry Goods Only', emoji: '📦',
              description: 'Ambient-temp distributor, no perishables or produce compliance.',
              flags: {
                refrigeratedFoods: false, frozenFoods: false, temperatureLogging: false,
                catchWeightItems: false, lotTracking: false, fefoEnforcement: false,
                fsmaTraceability: false, allergenManagement: true, pacaCompliance: false,
                creditTerms: true, vendorRebates: true, commissionTracking: true,
                multiLocation: false, barcodeScanning: true, caseSplitting: false,
                reorderAutomation: true, deliveryWindows: false, signatureCapture: true,
              },
            },
            {
              id: 'produce', label: 'Produce Distributor', emoji: '🥦',
              description: 'Fresh produce with PACA compliance, FSMA traceability, and catch weight.',
              flags: {
                refrigeratedFoods: true, frozenFoods: false, temperatureLogging: true,
                catchWeightItems: true, lotTracking: true, fefoEnforcement: true,
                fsmaTraceability: true, allergenManagement: true, pacaCompliance: true,
                creditTerms: true, vendorRebates: true, commissionTracking: true,
                multiLocation: true, barcodeScanning: true, caseSplitting: false,
                reorderAutomation: true, deliveryWindows: true, signatureCapture: true,
              },
            },
            {
              id: 'protein', label: 'Protein / Meat', emoji: '🥩',
              description: 'Refrigerated and frozen, catch weight, case splitting, full cold chain.',
              flags: {
                refrigeratedFoods: true, frozenFoods: true, temperatureLogging: true,
                catchWeightItems: true, lotTracking: true, fefoEnforcement: true,
                fsmaTraceability: true, allergenManagement: true, pacaCompliance: false,
                creditTerms: true, vendorRebates: true, commissionTracking: true,
                multiLocation: true, barcodeScanning: true, caseSplitting: true,
                reorderAutomation: true, deliveryWindows: true, signatureCapture: true,
              },
            },
            {
              id: 'broadliner', label: 'Full-Line Broadliner', emoji: '🏭',
              description: 'Everything on — multi-temp, all compliance tracks, multi-location.',
              flags: {
                refrigeratedFoods: true, frozenFoods: true, temperatureLogging: true,
                catchWeightItems: true, lotTracking: true, fefoEnforcement: true,
                fsmaTraceability: true, allergenManagement: true, pacaCompliance: true,
                creditTerms: true, vendorRebates: true, commissionTracking: true,
                multiLocation: true, barcodeScanning: true, caseSplitting: true,
                reorderAutomation: true, deliveryWindows: true, signatureCapture: true,
              },
            },
          ];
          return (
            <div className="space-y-3">

              {/* ── Client Profile Presets ── */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-300 mb-0.5">Client Profile Presets</h2>
                <p className="text-xs text-gray-500 mb-4">Apply a bundle of recommended settings for your distribution type. You can fine-tune individual flags below after applying.</p>
                <div className="grid grid-cols-2 gap-3">
                  {PRESETS.map(p => (
                    <button key={p.id} onClick={() => applyPreset(p.flags)}
                      className="text-left p-3 rounded-xl border border-gray-700 bg-gray-800/50 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{p.emoji}</span>
                        <span className="text-sm font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">{p.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Individual Flags ── */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800/0">
                <div className="p-5 pb-2"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Cold Chain & Perishables</h2><p className="text-xs text-gray-500">Enable if your operation handles temperature-sensitive products.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.refrigeratedFoods" label="Refrigerated Foods" description="Enables refrigerated product categories, cold-storage zone tracking in the warehouse, and refrigerator temp logging on delivery POD." tag="Cold Chain" tagColor="bg-blue-500/15 text-blue-400" />
                  <FeatureRow path="features.frozenFoods" label="Frozen Foods" description="Adds frozen product categories, freezer storage zones, and frozen temp recording on driver POD screens." tag="Cold Chain" tagColor="bg-blue-500/15 text-blue-400" />
                  <FeatureRow path="features.temperatureLogging" label="Temperature Logging" description="Requires drivers to record compartment temperatures at each delivery stop as part of the POD confirmation flow." tag="Cold Chain" tagColor="bg-blue-500/15 text-blue-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Warehouse Operations</h2><p className="text-xs text-gray-500">Control multi-location, scanning, and stock management features.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.multiLocation" label="Multiple Warehouse Locations" description="Enables the location switcher and per-location inventory views. Turn off for single-warehouse operations." tag="Inventory" tagColor="bg-amber-500/15 text-amber-400" />
                  <FeatureRow path="features.barcodeScanning" label="Barcode / Scanner Tool" description="Adds the scanner tool for inventory IN/OUT operations. Operators can scan barcodes to record receipts, picks, and adjustments." tag="Inventory" tagColor="bg-amber-500/15 text-amber-400" />
                  <FeatureRow path="features.caseSplitting" label="Case Splitting" description="Allows pallet or case SKUs to be split into individual child units for each unit to be tracked and sold separately." tag="Inventory" tagColor="bg-amber-500/15 text-amber-400" />
                  <FeatureRow path="features.reorderAutomation" label="Reorder Point Automation" description="Highlights items below their reorder point and surfaces AI-driven buying recommendations in the Demand Planning module." tag="Inventory" tagColor="bg-amber-500/15 text-amber-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Order & Fulfillment</h2><p className="text-xs text-gray-500">Control how orders are picked, tracked, and fulfilled.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.catchWeightItems" label="Catch Weight Items" description="Products sold by approximate weight (e.g. whole fish, meat cuts). Enables weight entry at pick and invoicing by actual weight." tag="Inventory" tagColor="bg-amber-500/15 text-amber-400" />
                  <FeatureRow path="features.lotTracking" label="Lot / Batch Tracking" description="Track products by lot number for traceability, expiry management, and recall readiness." tag="Compliance" tagColor="bg-purple-500/15 text-purple-400" />
                  <FeatureRow path="features.osdPhotoEvidence" label="OSD Photo Evidence" description="Drivers can attach photos when reporting over, short, or damaged items at delivery. Stored on the POD record." tag="Logistics" tagColor="bg-sky-500/15 text-sky-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Delivery & Proof of Delivery</h2><p className="text-xs text-gray-500">Configure driver workflow requirements at the point of delivery.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.deliveryWindows" label="Delivery Time Windows" description="Attach scheduled time-window commitments (e.g. 08:00–10:00) to delivery stops. Windows appear on route cards and driver app screens." tag="Logistics" tagColor="bg-sky-500/15 text-sky-400" />
                  <FeatureRow path="features.signatureCapture" label="Customer Signature Capture" description="Requires a customer signature on the Proof of Delivery screen before the stop can be marked complete." tag="Logistics" tagColor="bg-sky-500/15 text-sky-400" />
                  <FeatureRow path="features.routeOptimization" label="Route Optimization" description="Automatically sequence stops on each route for the most efficient delivery order based on address proximity." tag="Logistics" tagColor="bg-sky-500/15 text-sky-400" />
                  <FeatureRow path="features.etaNotifications" label="ETA Notifications" description="Send automated SMS/email ETA alerts to customers as the driver approaches their stop." tag="Logistics" tagColor="bg-sky-500/15 text-sky-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Compliance & Traceability</h2><p className="text-xs text-gray-500">FDA, food safety, and regulatory requirements for your operation.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.fefoEnforcement" label="FEFO Enforcement (First Expired, First Out)" description="Enforces picking the soonest-expiring lot first. Pickers are warned and blocked if they attempt to select a lot with a later expiry when an earlier one is available. Critical for perishable compliance." tag="Compliance" tagColor="bg-purple-500/15 text-purple-400" />
                  <FeatureRow path="features.fsmaTraceability" label="FSMA Rule 204 Traceability" description="Enables one-up/one-down lot traceability as required by the FDA Food Safety Modernization Act. Track any lot from its supplier receipt through every customer order it was shipped on — generate full traceability reports in seconds." tag="FDA Required" tagColor="bg-rose-500/15 text-rose-400" />
                  <FeatureRow path="features.allergenManagement" label="Allergen Management" description="Enables the Allergen Recall tab in Loss Prevention — track Big-9 allergens across your SKU catalog, run cross-contamination checks, and generate customer exposure reports." tag="Compliance" tagColor="bg-purple-500/15 text-purple-400" />
                  <FeatureRow path="features.pacaCompliance" label="PACA Compliance" description="Enables the PACA Compliance tab for federally licensed produce dealers — track trust obligations, 30-day payment deadlines, and dispute filing windows." tag="Produce" tagColor="bg-emerald-500/15 text-emerald-400" />
                  <FeatureRow path="features.minShelfLifeEnforcement" label="Minimum Shelf Life Enforcement at Pick" description="Blocks OUT scans in the inventory scanner when the FEFO lot's remaining shelf life is below the item's configured minimum (e.g., 14 days for fresh beef). Prevents shipping product that won't meet customer shelf life requirements." tag="Compliance" tagColor="bg-purple-500/15 text-purple-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Payments & Accounts Receivable</h2><p className="text-xs text-gray-500">Configure how payments are collected and credit is managed.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.creditTerms" label="Net-Terms Credit" description="Enables AR aging, credit limits, and credit hold controls in the CRM. When off, all accounts default to COD and credit management fields are hidden." tag="Finance" tagColor="bg-emerald-500/15 text-emerald-400" />
                  <FeatureRow path="features.codCollections" label="COD Collections" description="Drivers collect cash or checks at delivery for COD accounts. Payment is entered at POD and reconciled by accounting during daily close-out." tag="Accounting" tagColor="bg-emerald-500/15 text-emerald-400" />
                  <FeatureRow path="features.creditHoldEnforcement" label="Credit Hold Enforcement" description="When an account is placed on credit hold in the CRM, the B2B portal is automatically blocked — the customer sees a hold banner and cannot place orders until the hold is released." tag="AR / Finance" tagColor="bg-rose-500/15 text-rose-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Finance & Sales Incentives</h2><p className="text-xs text-gray-500">Vendor rebate tracking and sales rep commission payroll.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.vendorRebates" label="Vendor Rebate Tracking" description="Track vendor rebate programs, accruals, and bill-back allowances. Enables the Rebates tab in Procurement and vendor rebate reporting." tag="Finance" tagColor="bg-emerald-500/15 text-emerald-400" />
                  <FeatureRow path="features.commissionTracking" label="Commission Tracking" description="Calculate sales rep commissions by line, order, or territory and export to payroll. Enables the Commissions tab in the accounting module." tag="Finance" tagColor="bg-emerald-500/15 text-emerald-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Order Management</h2><p className="text-xs text-gray-500">Automate and enforce order-level controls across your customer base.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.standingOrders" label="Standing / Recurring Orders" description="Allows B2B customers to create recurring order templates with configurable frequency (weekly, bi-weekly, monthly) and automatic generation dates. Reduces re-entry friction for high-velocity accounts." tag="B2B Portal" tagColor="bg-cyan-500/15 text-cyan-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Pricing</h2><p className="text-xs text-gray-500">Control how prices are applied across accounts.</p></div>
                <div className="px-5">
                  <FeatureRow path="features.customerPricing" label="Customer-Specific Pricing Tiers" description="Assign Standard, Preferred, Premium, or Contract pricing tiers to individual accounts. Tier multipliers are applied to list prices on the B2B portal and sales orders. Manage tiers per customer in the CRM module." tag="Pricing" tagColor="bg-amber-500/15 text-amber-400" />
                </div>
                <div className="p-5 pb-2 pt-5"><h2 className="text-sm font-semibold text-gray-300 mb-0.5">Sales & Customer Channels</h2></div>
                <div className="px-5">
                  <FeatureRow path="features.b2bPortalEnabled" label="B2B Customer Portal" description="Allow business customers to log in, browse your product catalog, and place orders online. Disabling hides the B2B Portal module entirely." tag="Module" tagColor="bg-rose-500/15 text-rose-400" />
                  <FeatureRow path="features.fieldSalesEnabled" label="Field Sales" description="Enable your sales reps' mobile portal for prospect management, quotes, and on-the-road order entry. Disabling hides the Field Sales module." tag="Module" tagColor="bg-rose-500/15 text-rose-400" />
                  <FeatureRow path="features.crmEnabled" label="CRM / Customer Success" description="Track customer accounts, contacts, interactions, and renewal health. Disabling hides the CRM module." tag="Module" tagColor="bg-rose-500/15 text-rose-400" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Approvals ── */}
        {tab === 'approvals' && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-800 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-100 mb-0.5">Approval Workflows</h2>
                  <p className="text-xs text-gray-500">Master switch — when off, all flows below are bypassed and actions take effect immediately.</p>
                </div>
                <Toggle checked={settings.features.approvalWorkflows !== false} onChange={v => updateSetting('features.approvalWorkflows', v)} />
              </div>
              <p className="text-xs text-gray-500">Configure thresholds and approver roles per flow type. Requests above each threshold are routed to the <button onClick={() => null} className="text-cyan-400 ml-1">Approvals</button> inbox for sign-off before the underlying action takes effect.</p>
            </div>
            {Object.entries(APPROVAL_FLOW_TYPES).map(([flowType, meta]) => {
              const rule = settings.approvalRules?.[flowType];
              if (!rule) return null;
              const masterOff = settings.features.approvalWorkflows === false;
              const disabled = masterOff || !rule.enabled;
              return (
                <div key={flowType} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 text-lg">{meta.icon}</div>
                      <div><h4 className="font-bold text-gray-100 text-sm">{meta.label}</h4><p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{meta.description}</p></div>
                    </div>
                    <Toggle checked={!!rule.enabled} disabled={masterOff} onChange={v => updateApprovalRule(flowType, { enabled:v })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">{rule.thresholdLabel || 'Threshold'}</label>
                      <div className="flex items-center gap-2">
                        {rule.thresholdUnit === '$' && <span className="text-gray-400 text-sm">$</span>}
                        <input type="number" disabled={disabled} value={rule.threshold} onChange={e => updateApprovalRule(flowType, { threshold:Number(e.target.value) || 0 })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-40" />
                        {rule.thresholdUnit && rule.thresholdUnit !== '$' && <span className="text-gray-400 text-sm">{rule.thresholdUnit}</span>}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Approver Roles</label>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(ROLES).map(([rid, rdata]) => {
                          const selected = rule.approverRoles?.includes(rid);
                          return (
                            <button key={rid} type="button" disabled={disabled} onClick={() => { const next = selected ? rule.approverRoles.filter(r => r !== rid) : [...rule.approverRoles, rid]; updateApprovalRule(flowType, { approverRoles:next }); }} className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${selected ? `${rdata.bg} ${rdata.color} border-current` : 'bg-gray-800 text-gray-500 border-gray-800 hover:text-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              {rdata.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800/60">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                      <input type="checkbox" checked={!!rule.requireComment} disabled={disabled} onChange={e => updateApprovalRule(flowType, { requireComment:e.target.checked })} className="w-3.5 h-3.5 rounded text-cyan-500 bg-gray-800 border-gray-700" />
                      Require comment on approval
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Module Visibility ── */}
        {tab === 'modules' && (
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                Turn modules on or off to tailor the ERM to each client's workflow. Disabled modules disappear from the sidebar entirely. Settings and Users are always accessible.
              </p>
            </div>
            {MODULE_GROUPS_META.map(group => (
              <div key={group.group} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-800/80 flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${group.color}`}>{group.group}</span>
                  <span className="text-[10px] text-gray-600">
                    {group.modules.filter(m => m.locked || (m && true)).length} module{group.modules.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="px-4">
                  {group.modules.map(mod => <ModuleVisibilityRow key={mod.id} mod={mod} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Plan & Billing ── */}
        {tab === 'billing' && (() => {
          const planId   = settings.plan || 'enterprise';
          const planDef  = PLANS[planId] || PLANS.enterprise;
          const addOns   = settings.addOns || [];
          const isAdmin  = ['admin', 'manager'].includes(activeUser?.role);

          // Flat module metadata lookup from MODULE_GROUPS_META
          const allModMeta = MODULE_GROUPS_META.flatMap(g => g.modules);
          const modLabel = (id) => allModMeta.find(m => m.id === id) || { label: id, icon: '🔲' };

          // Modules included in current plan (with labels)
          const planModules = (planDef.modules || []).map(modLabel);

          // Upgrades: base→enterprise delta modules
          const otherPlanId = planId === 'base' ? 'enterprise' : null;
          const otherPlan   = otherPlanId ? PLANS[otherPlanId] : null;
          const upgradeMods = otherPlan
            ? otherPlan.modules.filter(m => !planDef.modules.includes(m)).map(modLabel)
            : [];

          // Active vs inactive add-ons
          const activeAddOns   = Object.entries(ADDONS).filter(([k]) => addOns.includes(k));
          const inactiveAddOns = Object.entries(ADDONS).filter(([k]) => !addOns.includes(k));

          return (
            <div className="space-y-5">

              {/* ── Admin-managed notice (enterprise / pilot) ── */}
              {planId === 'enterprise' && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                  <span className="text-cyan-400 text-lg shrink-0 mt-0.5">✦</span>
                  <div>
                    <p className="text-xs font-semibold text-cyan-300">Your account is managed by the Kernel team</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      You're on the <span className="text-cyan-400 font-medium">Enterprise</span> plan with full access to all modules and add-ons.
                      To make changes to your plan, add-ons, or billing details, contact us at{' '}
                      <span className="text-cyan-400">hello@kernalerm.com</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Current Plan card ── */}
              <div className={`bg-gray-900 border ${planDef.border} rounded-xl overflow-hidden`}>
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${planDef.bg} ${planDef.color} border ${planDef.border}`}>
                        {planDef.label} Plan
                      </span>
                      <span className="text-[11px] text-gray-500">Current plan</span>
                    </div>
                    <p className={`text-2xl font-bold mt-2 ${planDef.color}`}>{planDef.price}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{planDef.description}</p>
                  </div>
                  {isAdmin && planId !== 'enterprise' && (
                    <button className="shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                      Upgrade Plan
                    </button>
                  )}
                </div>

                {/* Included modules */}
                <div className="border-t border-gray-800 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">Included modules</p>
                  <div className="flex flex-wrap gap-1.5">
                    {planModules.map(m => (
                      <span key={m.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700/60">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Active Add-ons ── */}
              {activeAddOns.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-200">Active Add-ons</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {activeAddOns.length} active
                    </span>
                  </div>
                  <div className="divide-y divide-gray-800/60">
                    {activeAddOns.map(([key, ao]) => (
                      <div key={key} className="flex items-center justify-between gap-4 px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg w-7 text-center">{ao.icon}</span>
                          <div>
                            <p className="text-xs font-medium text-gray-200">{ao.label}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{ao.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-semibold text-emerald-400">{ao.price}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Available Upgrades ── */}
              {(upgradeMods.length > 0 || inactiveAddOns.length > 0) && isAdmin && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800">
                    <p className="text-xs font-semibold text-gray-200">Available Upgrades</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Unlock additional modules and capabilities for your team.</p>
                  </div>

                  {/* Plan upgrade row */}
                  {upgradeMods.length > 0 && otherPlan && (
                    <div className="px-5 py-4 border-b border-gray-800/60 last:border-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${PLANS[otherPlanId].bg} ${PLANS[otherPlanId].color} border ${PLANS[otherPlanId].border}`}>
                              {PLANS[otherPlanId].label} Plan
                            </span>
                          </div>
                          <p className={`text-lg font-bold mt-1.5 ${PLANS[otherPlanId].color}`}>{PLANS[otherPlanId].price}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{PLANS[otherPlanId].description}</p>
                          <p className="text-[11px] text-gray-600 mt-2">
                            Adds: {upgradeMods.map(m => `${m.icon} ${m.label}`).join(' · ')}
                          </p>
                        </div>
                        <button className="shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors mt-1">
                          Upgrade
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inactive add-ons */}
                  {inactiveAddOns.map(([key, ao]) => (
                    <div key={key} className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-gray-800/60 first:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center opacity-50">{ao.icon}</span>
                        <div>
                          <p className="text-xs font-medium text-gray-400">{ao.label}</p>
                          <p className="text-[11px] text-gray-600 mt-0.5">{ao.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-gray-500">{ao.price}</span>
                        <button className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors">
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Non-admin view ── */}
              {!isAdmin && (
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gray-900 border border-gray-800">
                  <span className="text-gray-500 text-base shrink-0 mt-0.5">🔒</span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Billing and plan details are managed by your account administrator.
                  </p>
                </div>
              )}

            </div>
          );
        })()}

        {/* ── Scheduled Reports ── */}
        {tab === 'reports' && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                  <MailIcon />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-100">Automated Report Delivery</h2>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Reports are generated and emailed on schedule — no one has to log in. Configure recipients by role, set your preferred frequency, and preview exactly what each report looks like before it goes out.</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <span className="text-amber-400 text-sm shrink-0">📧</span>
                <p className="text-xs text-amber-300/80">Email delivery requires SMTP configuration. Contact your IT administrator to connect an outbound mail server in your system settings.</p>
              </div>
            </div>

            {/* Report cards */}
            {REPORT_DEFS.map(def => (
              <ScheduledReportCard
                key={def.id}
                def={def}
                sched={scheduledReports[def.id]}
                onChange={next => setScheduledReports(prev => ({ ...prev, [def.id]:next }))}
                onPreview={() => setPreviewReport(def.id)}
                onSendNow={() => setSentNow(prev => ({ ...prev, [def.id]:true }))}
                wasSent={!!sentNow[def.id]}
              />
            ))}
          </div>
        )}

        {/* ── Error Reporting ── */}
        {tab === 'errorreporting' && (
          <div className="space-y-4">

            {/* Status + Webhook config */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
                  <BugIcon />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-100">Automated Crash Reporting</h2>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    When something breaks in the app, Kernel automatically captures a full crash report — the error, the module it happened in,
                    what the user was doing, and everything a developer needs to identify and fix the issue quickly.
                    Connect a webhook below to have those reports delivered automatically.
                  </p>
                </div>
              </div>

              {/* Connection status badge */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border mb-5 ${
                getWebhookUrl()
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-amber-500/5 border-amber-500/15'
              }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${getWebhookUrl() ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <p className={`text-xs font-medium ${getWebhookUrl() ? 'text-emerald-300' : 'text-amber-300/90'}`}>
                  {getWebhookUrl()
                    ? `Webhook connected — crash reports will be sent automatically.`
                    : 'No webhook configured — crash reports are saved locally only (this session).'}
                </p>
              </div>

              {/* Webhook URL input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Webhook URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"><LinkIcon /></div>
                    <input
                      type="url"
                      value={webhookDraft}
                      onChange={e => setWebhookDraft(e.target.value)}
                      placeholder="https://hook.make.com/… or https://hooks.zapier.com/…"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                  </div>
                  <button
                    onClick={handleWebhookSave}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors shrink-0 ${
                      webhookSaved
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
                    }`}
                  >
                    {webhookSaved ? <><CheckIcon /> Saved!</> : <><SaveIcon /> Save</>}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Paste a webhook URL from Make.com, Zapier, Slack, or any service that accepts a POST request.</p>
              </div>

              {/* Test button */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-800/60">
                <button
                  onClick={handleSendTest}
                  disabled={testSending}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    testSending
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse cursor-default'
                      : testResult === 'sent'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : testResult === 'saved'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  <FlaskIcon />
                  {testSending
                    ? 'Sending test…'
                    : testResult === 'sent'
                      ? '✓ Test report delivered!'
                      : testResult === 'saved'
                        ? '⚠ Saved locally (no webhook)'
                        : 'Send Test Report'}
                </button>
                <p className="text-xs text-gray-600">Fires a simulated crash report so you can verify your webhook is receiving data correctly.</p>
              </div>
            </div>

            {/* Recent reports log */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-gray-100">Recent Crash Reports</h3>
                <p className="text-xs text-gray-500 mt-0.5">Last {Math.min(errorReports.length, 5)} reports captured this session. Reports are stored in memory and cleared on page reload.</p>
              </div>
              {errorReports.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="text-2xl mb-2">🟢</div>
                  <p className="text-sm font-medium text-gray-300">No crashes recorded</p>
                  <p className="text-xs text-gray-600 mt-1">If the app encounters an error, it will appear here automatically.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-950/60 text-gray-500 border-b border-gray-800">
                        <th className="text-left px-4 py-2.5 font-semibold">Report ID</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Time</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Module</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Error</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Delivery</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {errorReports.slice(0, 5).map(r => (
                        <tr key={r.id} className="border-t border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-[10px] text-cyan-400">{r.id}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{r.localTime}</td>
                          <td className="px-4 py-3 text-gray-300 font-medium">{r.module}</td>
                          <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={r.error.message}>
                            <span className="font-semibold text-gray-300">{r.error.type}:</span> {r.error.message}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.type === 'test'
                              ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400">TEST</span>
                              : r.sent
                                ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">✓ Sent</span>
                                : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Local</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                const text = formatReportAsText(r);
                                navigator.clipboard?.writeText(text).catch(() => {});
                              }}
                              className="text-gray-600 hover:text-gray-300 transition-colors"
                              title="Copy full report"
                            >
                              <CopyIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Plain-English setup guide */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-100 mb-3">How to Set Up Crash Report Delivery</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                When a crash happens, Kernel sends a detailed report to any URL you provide. The easiest way to receive those reports
                is through a free automation tool like <strong className="text-gray-200">Make.com</strong> or <strong className="text-gray-200">Zapier</strong>.
                Here's how to get set up in about 5 minutes:
              </p>

              <div className="space-y-3">
                {[
                  { n:'1', title:'Create a free Make.com account', body:'Go to make.com and sign up for free. No credit card required for basic use.' },
                  { n:'2', title:'Create a new Scenario', body:'Click "Create a new scenario." Add a Webhooks module as the trigger — choose "Custom webhook." Copy the webhook URL it gives you.' },
                  { n:'3', title:'Paste the URL above and save', body:'Paste the webhook URL into the field above and click Save. Then click "Send Test Report" to fire a sample crash — Make.com will receive it and show you the data shape.' },
                  { n:'4', title:'Add a destination action', body:'Back in Make.com, add a second module after the webhook — for example: send an Email, post to a Slack channel, or create a row in a Google Sheet. Map the fields (module, error message, report ID, stack trace) to your destination.' },
                  { n:'5', title:'Activate the scenario', body:'Turn the scenario on. From now on, every crash in Kernel will be automatically delivered to wherever you set up — no manual checking required.' },
                ].map(step => (
                  <div key={step.n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-200">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800/60">
                <p className="text-xs text-gray-500">
                  <strong className="text-gray-400">Tip:</strong> You can also point the webhook directly at a <strong className="text-gray-400">Slack incoming webhook</strong> URL to receive crash reports as Slack messages,
                  or at a <strong className="text-gray-400">Discord webhook</strong> for Discord notifications.
                  Any service that accepts an HTTP POST with JSON will work.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ── Preview Modal (portal-style) ── */}
      {previewReport && (
        <ReportPreviewModal
          reportId={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}

    </div>
  );
}
