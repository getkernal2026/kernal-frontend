/**
 * RecordHistory — inline audit timeline for a specific record.
 *
 * Props:
 *   entityIds  {string|string[]} — one or more entityIds to filter by
 *   label      {string}          — display name for empty state
 *   isDark     {boolean}
 *   mode       {'compact'|'full'|'coc'} — coc = chain-of-custody (FDA printable)
 *   maxEvents  {number}          — cap on events shown (default 50)
 *
 * Reads from useKernal() → auditLog.
 */

import { useState, useMemo } from 'react';
import { useKernal } from '../KernalContext.jsx';

// ── Severity palette ──────────────────────────────────────────────────────────
const SEV = {
  info:     { dot: 'bg-gray-500',    pill: 'bg-gray-700/60 text-gray-400',           label: 'Info'     },
  notice:   { dot: 'bg-cyan-500',    pill: 'bg-cyan-500/15 text-cyan-400',           label: 'Notice'   },
  warning:  { dot: 'bg-amber-500',   pill: 'bg-amber-500/15 text-amber-400',         label: 'Warning'  },
  critical: { dot: 'bg-rose-500',    pill: 'bg-rose-500/15 text-rose-400',           label: 'Critical' },
};

function SevPill({ severity }) {
  const s = SEV[severity] || SEV.info;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Action → readable verb ────────────────────────────────────────────────────
function actionLabel(action = '') {
  const map = {
    'lot.qty.adjust':      'Qty adjusted',
    'lot.delete':          'Lot deleted',
    'qc.hold.set':         'QC hold placed',
    'qc.hold.release':     'QC hold released',
    'scanner.in':          'Received (scanner)',
    'scanner.out':         'Removed (scanner)',
    'sku.create':          'SKU created',
    'sku.update':          'SKU updated',
    'po.create':           'PO created',
    'po.approve':          'PO approved',
    'po.send':             'Sent to vendor',
    'po.receive':          'Received',
    'po.receive.partial':  'Partially received',
    'po.cancel':           'Cancelled',
    'invoice.create':      'Invoice created',
    'invoice.void':        'Invoice voided',
    'payment.record':      'Payment recorded',
    'check.write':         'Check written',
    'credit.hold.set':     'Credit hold placed',
    'credit.hold.release': 'Credit hold released',
    'customer.update':     'Customer updated',
    'customer.create':     'Customer created',
    'approve':             'Approved',
    'reject':              'Rejected',
    'changes_requested':   'Changes requested',
    'dispatch':            'Dispatched',
    'pod.complete':        'POD captured',
    'packWeigh.confirm':   'Pack & Weigh confirmed',
    'osd.report':          'OS&D reported',
    'role.change':         'Role changed',
    'user.create':         'User created',
    'feature.toggle':      'Feature flag changed',
    'lockdown.toggle':     'Lockdown changed',
    'reconcile.complete':  'Reconciliation complete',
    'order.submit':        'Order submitted',
    'payment.collect':     'Payment collected',
  };
  return map[action] || action.replace(/\./g, ' ');
}

// ── Diff renderer ─────────────────────────────────────────────────────────────
function DiffBlock({ before, after, isDark }) {
  if (!before && !after) return null;
  const bg  = isDark ? 'bg-gray-950/60' : 'bg-slate-50';
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <div className={`p-2 rounded-lg border border-rose-500/20 bg-rose-500/5`}>
        <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mb-1">Before</p>
        <pre className="text-[10px] text-gray-300 whitespace-pre-wrap break-words font-mono">
          {before ? JSON.stringify(before, null, 2) : '(none)'}
        </pre>
      </div>
      <div className={`p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5`}>
        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1">After</p>
        <pre className="text-[10px] text-gray-300 whitespace-pre-wrap break-words font-mono">
          {after ? JSON.stringify(after, null, 2) : '(none)'}
        </pre>
      </div>
    </div>
  );
}

// ── Relative time formatter ───────────────────────────────────────────────────
function fmtRel(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fmtDateTime(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month:'short', day:'numeric', year:'numeric',
    hour:'2-digit', minute:'2-digit', hour12:true
  });
}

// ── Chain-of-Custody mode (FDA printable) ────────────────────────────────────
function CoC({ events, label, isDark }) {
  const textCls = isDark ? 'text-gray-100' : 'text-gray-900';
  const subCls  = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderCls = isDark ? 'border-gray-800' : 'border-slate-200';
  const bgCls   = isDark ? 'bg-gray-900' : 'bg-white';
  const sortedAsc = [...events].sort((a,b) => new Date(a.at) - new Date(b.at));

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Chain of Custody — ${label}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 24px; }
        h2 { font-size: 14px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 10px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f0f0f0; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
        td { padding: 6px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
        .badge { display:inline-block; padding:1px 6px; border-radius:9px; font-weight:700; font-size:9px; text-transform:uppercase; }
        .info { background:#e5e7eb; color:#374151; }
        .notice { background:#cffafe; color:#0e7490; }
        .warning { background:#fef3c7; color:#92400e; }
        .critical { background:#fee2e2; color:#991b1b; }
      </style></head><body>
      <h2>FSMA Chain of Custody — ${label}</h2>
      <div class="sub">Printed ${new Date().toLocaleString()} · Kernel ERP · Append-only log</div>
      <table>
        <tr><th>Timestamp</th><th>Event</th><th>Summary</th><th>User</th><th>Severity</th></tr>
        ${sortedAsc.map(e => `
          <tr>
            <td>${fmtDateTime(e.at)}</td>
            <td>${actionLabel(e.action)}</td>
            <td>${e.summary}</td>
            <td>${e.userName}</td>
            <td><span class="badge ${e.severity}">${e.severity}</span></td>
          </tr>
        `).join('')}
      </table>
      </body></html>
    `;
    const w = window.open('', '_blank');
    w.document.write(printContent);
    w.document.close();
    w.print();
  };

  return (
    <div className={`rounded-xl border ${borderCls} ${bgCls} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCls}`}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className={`text-sm font-bold ${textCls}`}>FSMA Chain of Custody</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{sortedAsc.length} events</span>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print / Export
        </button>
      </div>

      {/* Timeline */}
      {sortedAsc.length === 0 ? (
        <div className={`py-8 text-center text-sm ${subCls}`}>No custody events recorded yet.</div>
      ) : (
        <div className="p-4 space-y-0">
          {sortedAsc.map((e, idx) => (
            <div key={e.id} className="flex gap-3">
              {/* Timeline spine */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-3 h-3 rounded-full border-2 border-gray-900 mt-1 ${SEV[e.severity]?.dot || 'bg-gray-500'}`} />
                {idx < sortedAsc.length - 1 && <div className="w-px flex-1 bg-gray-800 mt-1 mb-0" style={{minHeight:24}} />}
              </div>
              {/* Content */}
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${textCls}`}>{actionLabel(e.action)}</span>
                  <SevPill severity={e.severity} />
                </div>
                <p className={`text-xs mt-0.5 ${subCls}`}>{e.summary}</p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  {fmtDateTime(e.at)} · {e.userName}
                  {e.entityId && ` · ${e.entityId}`}
                </p>
                {(e.before || e.after) && <DiffBlock before={e.before} after={e.after} isDark={isDark} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RecordHistory({ entityIds, label = 'this record', isDark = true, mode = 'compact', maxEvents = 50 }) {
  const { auditLog } = useKernal();
  const [expandedId, setExpandedId] = useState(null);

  // Normalise to array
  const ids = useMemo(() => (Array.isArray(entityIds) ? entityIds : [entityIds]).filter(Boolean), [entityIds]);

  // Filter + sort newest first
  const events = useMemo(() =>
    auditLog
      .filter(e => ids.some(id => e.entityId === id || e.summary?.includes(id)))
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, maxEvents),
    [auditLog, ids, maxEvents]
  );

  const textCls   = isDark ? 'text-gray-100' : 'text-gray-900';
  const subCls    = isDark ? 'text-gray-500' : 'text-gray-400';
  const borderCls = isDark ? 'border-gray-800' : 'border-slate-200';
  const rowHover  = isDark ? 'hover:bg-gray-800/50' : 'hover:bg-slate-50';

  if (mode === 'coc') return <CoC events={events} label={label} isDark={isDark} />;

  if (mode === 'full') {
    return (
      <div className={`rounded-xl border ${borderCls} overflow-hidden`} style={{ background: isDark ? 'rgba(17,24,39,0.5)' : '#fff' }}>
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${borderCls}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className={`text-sm font-bold ${textCls}`}>Change History</span>
          {events.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{events.length}</span>
          )}
        </div>
        {events.length === 0 ? (
          <div className={`py-8 text-center text-sm ${subCls} italic`}>No history for {label} yet.</div>
        ) : (
          <div className="divide-y divide-gray-800/60 max-h-72 overflow-y-auto">
            {events.map(e => {
              const isExp = expandedId === e.id;
              return (
                <div key={e.id}>
                  <button
                    onClick={() => setExpandedId(isExp ? null : e.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${rowHover}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <SevPill severity={e.severity} />
                      <span className={`text-xs font-semibold ${textCls}`}>{actionLabel(e.action)}</span>
                      <span className={`text-[10px] ml-auto ${subCls}`}>{fmtRel(e.at)}</span>
                    </div>
                    <p className={`text-xs mt-1 ${subCls}`}>{e.summary}</p>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{e.userName} · {fmtDateTime(e.at)}</p>
                  </button>
                  {isExp && (e.before || e.after) && (
                    <div className="px-4 pb-3">
                      <DiffBlock before={e.before} after={e.after} isDark={isDark} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // compact mode — slim feed, no header card chrome
  if (events.length === 0) {
    return (
      <p className={`text-xs italic ${subCls} py-2`}>No changes recorded yet for {label}.</p>
    );
  }
  return (
    <div className="space-y-0 divide-y divide-gray-800/60">
      {events.map(e => {
        const isExp = expandedId === e.id;
        return (
          <div key={e.id}>
            <button
              onClick={() => setExpandedId(isExp ? null : e.id)}
              className={`w-full text-left px-0 py-2.5 transition-colors ${rowHover}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEV[e.severity]?.dot || 'bg-gray-500'}`} />
                <span className={`text-xs ${textCls}`}>{e.summary}</span>
                <span className={`text-[10px] ml-auto shrink-0 ${subCls}`}>{fmtRel(e.at)}</span>
              </div>
              <p className={`text-[10px] mt-0.5 pl-3.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{e.userName} · {actionLabel(e.action)}</p>
            </button>
            {isExp && (e.before || e.after) && (
              <div className="pb-2 pl-3.5">
                <DiffBlock before={e.before} after={e.after} isDark={isDark} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
