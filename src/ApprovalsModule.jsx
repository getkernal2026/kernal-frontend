import React, { useState, useMemo } from 'react';
import { useKernal, APPROVAL_FLOW_TYPES, ROLES } from './KernalContext.jsx';
import { UI } from './ui.js';
import { Overlay, ModalBox, ModalHeader } from './shared/Modal.jsx';
import {
  CheckCircle2, XCircle, MessageSquare, Clock, ShoppingCart, Unlock, Percent,
  FileEdit, AlertCircle, Inbox, Send, History as HistoryIcon, Sliders,
  Filter, X, User as UserIcon, ChevronRight, Bell, BellOff, Eye, Package,
} from 'lucide-react';

// ── helpers ─────────────────────────────────────────────────────────────────
const fmt$ = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(Number(n) || 0);
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
};
const relTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const FLOW_ICONS = {
  po_approval:           ShoppingCart,
  credit_release:        Unlock,
  discount_override:     Percent,
  account_change:        FileEdit,
  order_change_request:  Package,
};

const STATUS_STYLE = {
  pending:            { label:'Pending',    cls:'bg-amber-500/10 text-amber-400 border-amber-500/20',  icon:Clock },
  approved:           { label:'Approved',   cls:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon:CheckCircle2 },
  rejected:           { label:'Rejected',   cls:'bg-rose-500/10 text-rose-400 border-rose-500/20',     icon:XCircle },
  changes_requested:  { label:'Changes Requested', cls:'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon:MessageSquare },
  cancelled:          { label:'Cancelled',  cls:'bg-gray-700 text-gray-400 border-gray-700',           icon:XCircle },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function FlowIcon({ flowType, size = 4 }) {
  const Icon = FLOW_ICONS[flowType] || AlertCircle;
  return <Icon className={`w-${size} h-${size}`} />;
}

// ── Payload renderer per flow type ──────────────────────────────────────────
function PayloadView({ flowType, payload }) {
  if (!payload) return null;
  if (flowType === 'po_approval') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">PO Number</div><div className="font-mono font-bold text-gray-100">{payload.poNumber}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Vendor</div><div className="font-semibold text-gray-100">{payload.vendorName}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">PO Total</div><div className="font-bold text-cyan-400 text-lg">{fmt$(payload.total)}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Line Items</div><div className="text-gray-200">{payload.items?.length || 0}</div></div>
        </div>
        {payload.items?.length > 0 && (
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-950/60 border-b border-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-3 py-2 text-right text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-3 py-2 text-right text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-3 py-2 text-right text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {payload.items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-gray-400">{it.sku}</td>
                    <td className="px-3 py-2 text-gray-200">{it.description}</td>
                    <td className="px-3 py-2 text-right text-gray-200">{it.qty}</td>
                    <td className="px-3 py-2 text-right text-gray-200">{fmt$(it.unitCost)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-100">{fmt$((it.qty || 0) * (it.unitCost || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  if (flowType === 'credit_release') {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Customer</div><div className="font-semibold text-gray-100">{payload.customerName}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Customer ID</div><div className="font-mono text-gray-300">{payload.customerId}</div></div>
          {typeof payload.currentBalance === 'number' && (
            <div><div className="text-xs text-gray-500 uppercase mb-0.5">Outstanding Balance</div><div className="font-bold text-rose-400">{fmt$(payload.currentBalance)}</div></div>
          )}
        </div>
        {payload.reason && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Reason for Release</div>
            <div className="p-3 rounded-lg border border-gray-800 bg-gray-950/40 text-gray-200 italic">{payload.reason}</div>
          </div>
        )}
      </div>
    );
  }
  if (flowType === 'discount_override') {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Customer</div><div className="font-semibold text-gray-100">{payload.customerName}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Scope</div><div className="text-gray-200">{payload.skuScope || 'All SKUs'}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Discount</div><div className="font-bold text-cyan-400 text-lg">{payload.discountPct}%</div></div>
          {payload.expiresOn && <div><div className="text-xs text-gray-500 uppercase mb-0.5">Expires</div><div className="text-gray-200">{payload.expiresOn}</div></div>}
        </div>
        {payload.reason && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Business Justification</div>
            <div className="p-3 rounded-lg border border-gray-800 bg-gray-950/40 text-gray-200 italic">{payload.reason}</div>
          </div>
        )}
      </div>
    );
  }
  if (flowType === 'order_change_request') {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Order</div><div className="font-mono font-bold text-gray-100">{payload.orderId}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Customer</div><div className="font-semibold text-gray-100">{payload.customerName}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Current Status</div><div className="text-amber-400 font-semibold">{payload.currentStatus}</div></div>
          {payload.deliveryDate && <div><div className="text-xs text-gray-500 uppercase mb-0.5">Delivery Date</div><div className="text-gray-200">{payload.deliveryDate}</div></div>}
        </div>
        {payload.changes?.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Requested Changes</div>
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-950/60 border-b border-gray-800"><tr>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">Action</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">SKU</th>
                  <th className="px-3 py-2 text-left text-gray-500 uppercase">Description</th>
                  <th className="px-3 py-2 text-right text-gray-500 uppercase">From</th>
                  <th className="px-3 py-2 text-right text-gray-500 uppercase">To</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-800/60">
                  {payload.changes.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.action === 'add' ? 'bg-emerald-500/10 text-emerald-400' :
                        c.action === 'remove' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-cyan-500/10 text-cyan-400'}`}>{c.action}</span></td>
                      <td className="px-3 py-2 font-mono text-gray-400">{c.sku}</td>
                      <td className="px-3 py-2 text-gray-200">{c.description}</td>
                      <td className="px-3 py-2 text-right text-gray-500"><s>{c.fromQty ?? '—'}</s></td>
                      <td className="px-3 py-2 text-right font-semibold text-cyan-400">{c.toQty ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {payload.reason && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Reason</div>
            <div className="p-3 rounded-lg border border-gray-800 bg-gray-950/40 text-gray-200 italic">{payload.reason}</div>
          </div>
        )}
      </div>
    );
  }
  if (flowType === 'account_change') {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Customer</div><div className="font-semibold text-gray-100">{payload.customerName}</div></div>
          <div><div className="text-xs text-gray-500 uppercase mb-0.5">Customer ID</div><div className="font-mono text-gray-300">{payload.customerId}</div></div>
        </div>
        {payload.changes?.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Proposed Changes</div>
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-950/60 border-b border-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500 uppercase">Field</th>
                    <th className="px-3 py-2 text-left text-gray-500 uppercase">From</th>
                    <th className="px-3 py-2 text-left text-gray-500 uppercase">To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {payload.changes.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-300">{c.field}</td>
                      <td className="px-3 py-2 text-gray-500"><s>{c.from}</s></td>
                      <td className="px-3 py-2 font-semibold text-cyan-400">{c.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {payload.reason && (
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Reason</div>
            <div className="p-3 rounded-lg border border-gray-800 bg-gray-950/40 text-gray-200 italic">{payload.reason}</div>
          </div>
        )}
      </div>
    );
  }
  // Fallback: render JSON
  return (
    <pre className="text-xs text-gray-400 bg-gray-950/40 border border-gray-800 rounded-lg p-3 overflow-auto">{JSON.stringify(payload, null, 2)}</pre>
  );
}

// ── Decision modal — approve / reject / request changes ─────────────────────
function DecisionModal({ request, decision, onClose, onConfirm, requireComment }) {
  const [note, setNote] = useState('');
  const labels = {
    approved:           { title:'Approve Request',           btn:'Approve',           color:'btnEmerald', placeholder:'Optional approval note (visible in audit trail)' },
    rejected:           { title:'Reject Request',            btn:'Reject',            color:'btnDanger',  placeholder:'Required: reason for rejection' },
    changes_requested:  { title:'Request Changes',           btn:'Send Back',         color:'btnPrimary', placeholder:'Required: what needs to change?' },
  };
  const cfg = labels[decision] || labels.approved;
  const isCommentRequired = decision !== 'approved' || requireComment;
  const canConfirm = !isCommentRequired || note.trim().length > 0;
  return (
    <Overlay>
      <ModalBox>
        <ModalHeader title={cfg.title} icon={MessageSquare} onClose={onClose} />
        <div className="p-6 space-y-4">
          <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{APPROVAL_FLOW_TYPES[request.flowType]?.label}</p>
            <p className="text-sm font-bold text-gray-100">{request.title}</p>
            <p className="text-xs text-gray-400 mt-1">{request.summary}</p>
          </div>
          <div>
            <label className={UI.label}>{isCommentRequired ? 'Note (required) *' : 'Note (optional)'}</label>
            <textarea
              rows={3}
              className={UI.input}
              placeholder={cfg.placeholder}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
            <button onClick={onClose} className={UI.btnGhost}>Cancel</button>
            <button
              onClick={() => canConfirm && onConfirm(note.trim())}
              disabled={!canConfirm}
              className={`${UI[cfg.color]} ${!canConfirm ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {cfg.btn}
            </button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ── Detail view (right-rail) ────────────────────────────────────────────────
function DetailPanel({ request, onClose, onDecide, canDecide, requireComment, requester, decider }) {
  const [decision, setDecision] = useState(null);

  if (!request) return (
    <div className={`${UI.card} flex flex-col items-center justify-center text-center p-10 text-gray-500 h-full`}>
      <Inbox className="w-10 h-10 opacity-30 mb-3" />
      <p className="text-sm">Select a request to view details.</p>
    </div>
  );

  const flowMeta = APPROVAL_FLOW_TYPES[request.flowType];

  return (
    <div className={`${UI.card} h-full overflow-hidden flex flex-col`}>
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <FlowIcon flowType={request.flowType} size={4} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{flowMeta?.label}</p>
            <p className="font-bold text-gray-100 truncate">{request.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={request.status} />
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Meta strip */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-gray-500 uppercase tracking-wider mb-1">Request ID</p>
            <p className="font-mono text-gray-200">{request.id}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase tracking-wider mb-1">Requested By</p>
            <p className="text-gray-200">{requester?.name || request.requestedBy}</p>
            <p className="text-gray-500 text-[10px]">{relTime(request.requestedAt)} · {fmtDateTime(request.requestedAt)}</p>
          </div>
          {request.decidedBy && (
            <div>
              <p className="text-gray-500 uppercase tracking-wider mb-1">{request.status === 'approved' ? 'Approved By' : request.status === 'rejected' ? 'Rejected By' : 'Decided By'}</p>
              <p className="text-gray-200">{decider?.name || request.decidedBy}</p>
              <p className="text-gray-500 text-[10px]">{relTime(request.decidedAt)}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {request.summary && (
          <div className="p-3 rounded-lg border border-gray-800 bg-gray-800/30">
            <p className="text-sm text-gray-200">{request.summary}</p>
          </div>
        )}

        {/* Threshold callout */}
        {request.threshold > 0 && (
          <div className="text-xs text-gray-500 italic">
            Approval triggered because the value exceeds the {flowMeta?.label.toLowerCase()} threshold.
          </div>
        )}

        {/* Payload */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Details</h4>
          <PayloadView flowType={request.flowType} payload={request.payload} />
        </div>

        {/* Audit trail */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Audit Trail</h4>
          <div className="space-y-2">
            {(request.audit || []).map((entry, i) => {
              const stylized = STATUS_STYLE[entry.action] || { cls:'bg-gray-700 text-gray-300 border-gray-700', label: entry.action };
              const cls = entry.action === 'submitted'
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                : stylized.cls;
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-2 h-2 rounded-full ${entry.action === 'approved' ? 'bg-emerald-400' : entry.action === 'rejected' ? 'bg-rose-400' : entry.action === 'changes_requested' ? 'bg-cyan-400' : 'bg-sky-400'}`} />
                    {i < (request.audit.length - 1) && <div className="w-0.5 h-8 bg-gray-800" />}
                  </div>
                  <div className="flex-1 pb-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{entry.action.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-500">{fmtDateTime(entry.at)}</span>
                    </div>
                    {entry.note && <p className="text-xs text-gray-400 mt-1 italic">"{entry.note}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Decision bar */}
      {request.status === 'pending' && canDecide && (
        <div className="border-t border-gray-800 p-4 flex items-center justify-end gap-2 bg-gray-900/60">
          <button onClick={() => setDecision('changes_requested')} className={UI.btnSecondary}>
            <MessageSquare className="w-4 h-4" /> Request Changes
          </button>
          <button onClick={() => setDecision('rejected')} className={UI.btnDanger}>
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={() => setDecision('approved')} className={UI.btnEmerald}>
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>
      )}
      {request.status === 'pending' && !canDecide && (
        <div className="border-t border-gray-800 p-3 bg-gray-900/60 text-center text-xs text-gray-500">
          Your role doesn't have approval authority for this flow type.
        </div>
      )}

      {decision && (
        <DecisionModal
          request={request}
          decision={decision}
          requireComment={requireComment}
          onClose={() => setDecision(null)}
          onConfirm={(note) => { onDecide(decision, note); setDecision(null); }}
        />
      )}
    </div>
  );
}

// ── Request row (list item) ─────────────────────────────────────────────────
function RequestRow({ request, isActive, onClick, requester }) {
  const flowMeta = APPROVAL_FLOW_TYPES[request.flowType] || {};
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors ${isActive ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-800/60 text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
          <FlowIcon flowType={request.flowType} size={4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{flowMeta.label}</span>
            <StatusPill status={request.status} />
          </div>
          <p className="font-semibold text-gray-100 text-sm truncate">{request.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{request.summary}</p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {requester?.name || request.requestedBy}</span>
            <span>·</span>
            <span>{relTime(request.requestedAt)}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ── Rules tab ───────────────────────────────────────────────────────────────
function RulesTab() {
  const { settings, updateApprovalRule, can } = useKernal();
  const rules = settings.approvalRules || {};
  const canEdit = can('settings') === 'full';

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-900/40 border border-gray-800 rounded-lg p-3">
        <Sliders className="w-4 h-4 shrink-0 text-cyan-500 mt-0.5" />
        <div>
          Approval rules control when an action requires sign-off and who can decide. Modify thresholds and approver roles below, or in <strong className="text-gray-300">Settings → Approvals</strong>.
          {!canEdit && <span className="block mt-1 text-amber-400">You have read-only access to these rules.</span>}
        </div>
      </div>
      {Object.entries(APPROVAL_FLOW_TYPES).map(([flowType, meta]) => {
        const rule = rules[flowType];
        if (!rule) return null;
        return (
          <div key={flowType} className={UI.cardPad}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center"><FlowIcon flowType={flowType} size={4} /></div>
                <div>
                  <h4 className="font-bold text-gray-100">{meta.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                </div>
              </div>
              <button
                onClick={() => canEdit && updateApprovalRule(flowType, { enabled: !rule.enabled })}
                disabled={!canEdit}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.enabled ? 'bg-cyan-500' : 'bg-gray-700'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-gray-950 transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <label className={UI.label}>{rule.thresholdLabel || 'Threshold'}</label>
                <div className="flex items-center gap-2">
                  {rule.thresholdUnit === '$' && <span className="text-gray-400">$</span>}
                  <input
                    type="number"
                    disabled={!canEdit || !rule.enabled}
                    className={UI.input}
                    value={rule.threshold}
                    onChange={e => updateApprovalRule(flowType, { threshold: Number(e.target.value) || 0 })}
                  />
                  {rule.thresholdUnit && rule.thresholdUnit !== '$' && <span className="text-gray-400">{rule.thresholdUnit}</span>}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={UI.label}>Approver Roles</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ROLES).map(([rid, rdata]) => {
                    const selected = rule.approverRoles?.includes(rid);
                    return (
                      <button
                        key={rid}
                        type="button"
                        disabled={!canEdit || !rule.enabled}
                        onClick={() => {
                          const next = selected
                            ? rule.approverRoles.filter(r => r !== rid)
                            : [...rule.approverRoles, rid];
                          updateApprovalRule(flowType, { approverRoles: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          selected
                            ? `${rdata.bg} ${rdata.color} border-current`
                            : 'bg-gray-800 text-gray-500 border-gray-800 hover:text-gray-300'
                        } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {rdata.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!rule.requireComment}
                  disabled={!canEdit || !rule.enabled}
                  onChange={e => updateApprovalRule(flowType, { requireComment: e.target.checked })}
                  className="w-3.5 h-3.5 rounded text-cyan-500 bg-gray-800 border-gray-700"
                />
                Require comment on approval
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Module ─────────────────────────────────────────────────────────────
export default function ApprovalsModule() {
  const {
    approvalRequests, settings, users, activeUser, activeUserId,
    pendingApprovalsForUser, approvalsRequestedByUser,
    decideApproval, cancelApprovalRequest, logAudit,
  } = useKernal();

  const [tab, setTab] = useState('pending');
  const [activeId, setActiveId] = useState(null);
  const [flowFilter, setFlowFilter] = useState('all');

  const pendingForMe = useMemo(() => pendingApprovalsForUser(activeUserId), [approvalRequests, activeUserId, settings.approvalRules]);
  const myRequests   = useMemo(() => approvalsRequestedByUser(activeUserId), [approvalRequests, activeUserId]);
  const history      = useMemo(() => approvalRequests.filter(r => r.status !== 'pending'), [approvalRequests]);

  const listForTab = tab === 'pending' ? pendingForMe
                   : tab === 'mine'    ? myRequests
                   : tab === 'history' ? history
                   : [];
  const filteredList = flowFilter === 'all' ? listForTab : listForTab.filter(r => r.flowType === flowFilter);

  const active = approvalRequests.find(r => r.id === activeId) || null;
  const requester = active ? users.find(u => u.id === active.requestedBy) : null;
  const decider   = active && active.decidedBy ? users.find(u => u.id === active.decidedBy) : null;

  const activeRule = active ? settings.approvalRules?.[active.flowType] : null;
  const canDecide = !!(active && activeRule?.approverRoles?.includes(activeUser?.role));
  const requireComment = !!activeRule?.requireComment;

  const handleDecide = (decision, note) => {
    if (!active) return;
    decideApproval(active.id, decision, note);
    logAudit({
      moduleId: 'approvals',
      action: `approval.${decision}`,
      entityType: 'approval_request',
      entityId: active.id,
      summary: `${activeUser?.name || 'User'} ${decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'requested changes on'} "${active.title}"${note ? ` — "${note}"` : ''}`,
      before: { status: 'pending' },
      after:  { status: decision, note: note || null, decidedBy: activeUser?.name },
      severity: decision === 'approved' ? 'info' : decision === 'rejected' ? 'warning' : 'notice',
    });
  };

  const tabs = [
    { id: 'pending', label: 'Pending',         count: pendingForMe.length,  icon: Inbox },
    { id: 'mine',    label: 'My Submissions',  count: myRequests.length,    icon: Send },
    { id: 'history', label: 'History',         count: history.length,       icon: HistoryIcon },
    { id: 'rules',   label: 'Rules',           count: null,                 icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2"><Inbox className="w-5 h-5 text-cyan-500" /> Approvals</h1>
            <p className="text-sm text-gray-500 mt-0.5">Central inbox for purchase order, credit hold, discount, and account-change approvals.</p>
          </div>
          {settings.features?.approvalWorkflows === false && (
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center gap-2">
              <BellOff className="w-3.5 h-3.5" /> Workflows disabled — enable in Settings
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div id="kernal-module-tabs" className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setActiveId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {typeof t.count === 'number' && t.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-cyan-500 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {tab === 'rules' ? (
          <RulesTab />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '60vh' }}>
            {/* List */}
            <div className={`${UI.card} lg:col-span-2 overflow-hidden flex flex-col`}>
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={flowFilter}
                    onChange={e => setFlowFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="all">All flow types</option>
                    {Object.entries(APPROVAL_FLOW_TYPES).map(([id, m]) => (
                      <option key={id} value={id}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <span className="text-xs text-gray-500">{filteredList.length} {filteredList.length === 1 ? 'request' : 'requests'}</span>
              </div>
              <div className="overflow-y-auto flex-1">
                {filteredList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-10 text-gray-500 h-full">
                    <Inbox className="w-10 h-10 opacity-30 mb-3" />
                    <p className="text-sm font-medium">
                      {tab === 'pending' ? "You're all caught up — no pending approvals." :
                       tab === 'mine'    ? "You haven't submitted any requests yet." :
                                           'No decided requests yet.'}
                    </p>
                  </div>
                ) : filteredList.map(r => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    isActive={r.id === activeId}
                    onClick={() => setActiveId(r.id)}
                    requester={users.find(u => u.id === r.requestedBy)}
                  />
                ))}
              </div>
            </div>
            {/* Detail */}
            <div className="lg:col-span-3">
              <DetailPanel
                request={active}
                onClose={() => setActiveId(null)}
                onDecide={handleDecide}
                canDecide={canDecide}
                requireComment={requireComment}
                requester={requester}
                decider={decider}
              />
              {active && tab === 'mine' && active.status === 'pending' && (
                <div className="mt-3 flex justify-end">
                  <button onClick={() => { cancelApprovalRequest(active.id); setActiveId(null); }} className={UI.btnGhost}>
                    Withdraw Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
