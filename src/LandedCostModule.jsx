import React, { useState, useMemo } from 'react';
import { useKernal } from './KernalContext.jsx';
import { DEMO_MODE } from './lib/demoMode.js';
import {
  Anchor, Ship, DollarSign, Package, BarChart2, Globe,
  Plus, X, ChevronRight, Info, TrendingUp,
} from 'lucide-react';

// ─── Local const — required for Rolldown IIFE TDZ ─────────────────────────────
const COMPANY_INFO = {
  name: 'Kernel Distribution Co.',
  currency: 'USD',
};

// ─── Reference data ───────────────────────────────────────────────────────────
const COST_TYPES = [
  { id: 'freight',        label: 'Ocean / Air Freight',       color: 'blue'    },
  { id: 'duty',           label: 'Import Duty / Tariff',      color: 'amber'   },
  { id: 'customs_broker', label: 'Customs Broker Fee',        color: 'violet'  },
  { id: 'insurance',      label: 'Cargo Insurance',           color: 'emerald' },
  { id: 'handling',       label: 'Port Handling / Drayage',   color: 'cyan'    },
  { id: 'other',          label: 'Other',                     color: 'zinc'    },
];

const TYPE_COLORS = {
  blue:    { bg: 'rgba(59,130,246,.14)',   text: '#60a5fa'  },
  amber:   { bg: 'rgba(245,158,11,.14)',   text: '#fbbf24'  },
  violet:  { bg: 'rgba(139,92,246,.14)',   text: '#a78bfa'  },
  emerald: { bg: 'rgba(52,211,153,.14)',   text: '#34d399'  },
  cyan:    { bg: 'rgba(6,182,212,.14)',    text: '#22d3ee'  },
  zinc:    { bg: 'rgba(113,113,122,.14)',  text: '#9ca3af'  },
};

const ALLOC_METHODS = [
  { id: 'value',    label: 'By Value',    desc: 'Proportional to PO line extended value (qty × unit cost)'  },
  { id: 'quantity', label: 'By Quantity', desc: 'Proportional to unit quantity received'                    },
  { id: 'weight',   label: 'By Weight',   desc: 'Proportional to gross weight in lbs'                      },
];

const STATUS_META = {
  allocated: { label: 'Allocated', color: '#34d399', bg: 'rgba(52,211,153,.1)',   border: 'rgba(52,211,153,.3)'  },
  pending:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(245,158,11,.1)',   border: 'rgba(245,158,11,.3)'  },
  draft:     { label: 'Draft',     color: '#9ca3af', bg: 'rgba(113,113,122,.1)',  border: 'rgba(113,113,122,.3)' },
};

// ─── Seed data ────────────────────────────────────────────────────────────────
const INIT_SHIPMENTS = [
  {
    id: 'SHP-2026-001',
    origin: 'Culiacán, Mexico',
    originCode: 'MX',
    supplier: 'Rancho Verde Distributors',
    arrivalDate: '2026-05-14',
    status: 'allocated',
    poIds: ['PO-4481', 'PO-4482', 'PO-4483'],
    poValue: 45200,
    allocMethod: 'value',
    costs: [
      { id: 'c001', type: 'freight',        amount: 2800, carrier: 'Crowley Maritime',       ref: 'CML-88210'       },
      { id: 'c002', type: 'duty',           amount: 1350, carrier: 'US Customs & Border',    ref: 'CBP-202605-A1'   },
      { id: 'c003', type: 'customs_broker', amount: 450,  carrier: 'Expeditors Intl',        ref: 'EXP-44921'       },
      { id: 'c004', type: 'insurance',      amount: 180,  carrier: 'Allianz Trade',          ref: 'ALZ-INS-7734'    },
    ],
  },
  {
    id: 'SHP-2026-002',
    origin: 'Nogales, AZ (Domestic)',
    originCode: 'US',
    supplier: 'Southwest Produce Co.',
    arrivalDate: '2026-05-18',
    status: 'allocated',
    poIds: ['PO-4490', 'PO-4491'],
    poValue: 12800,
    allocMethod: 'quantity',
    costs: [
      { id: 'c005', type: 'freight',  amount: 620, carrier: 'J.B. Hunt Transport',   ref: 'JBH-556230'   },
      { id: 'c006', type: 'handling', amount: 85,  carrier: 'Tampa Port Authority',  ref: 'TPA-HDL-220'  },
    ],
  },
  {
    id: 'SHP-2026-003',
    origin: 'Leamington, Ontario',
    originCode: 'CA',
    supplier: 'Ontario Greenhouse Growers',
    arrivalDate: '2026-05-20',
    status: 'pending',
    poIds: ['PO-4499'],
    poValue: 8500,
    allocMethod: 'value',
    costs: [
      { id: 'c007', type: 'freight',        amount: 420, carrier: 'Canadian Pacific',       ref: 'CP-90221'        },
      { id: 'c008', type: 'duty',           amount: 340, carrier: 'US Customs & Border',   ref: 'CBP-202605-B3'   },
      { id: 'c009', type: 'customs_broker', amount: 275, carrier: 'Expeditors Intl',       ref: 'EXP-44988'       },
    ],
  },
  {
    id: 'SHP-2026-004',
    origin: 'Bogotá, Colombia',
    originCode: 'CO',
    supplier: 'Trópico Fresh S.A.',
    arrivalDate: '2026-05-23',
    status: 'pending',
    poIds: ['PO-4505', 'PO-4506'],
    poValue: 22100,
    allocMethod: 'weight',
    costs: [
      { id: 'c010', type: 'freight',        amount: 1650, carrier: 'Seaboard Marine',       ref: 'SBD-119432'      },
      { id: 'c011', type: 'duty',           amount: 890,  carrier: 'US Customs & Border',   ref: 'CBP-202605-C2'   },
      { id: 'c012', type: 'customs_broker', amount: 425,  carrier: 'Expeditors Intl',       ref: 'EXP-45001'       },
      { id: 'c013', type: 'insurance',      amount: 145,  carrier: 'Allianz Trade',         ref: 'ALZ-INS-7811'    },
    ],
  },
  {
    id: 'SHP-2026-005',
    origin: 'Hermosillo, Mexico',
    originCode: 'MX',
    supplier: 'Sonora Agro Export',
    arrivalDate: '2026-06-03',
    status: 'draft',
    poIds: ['PO-4512'],
    poValue: 18600,
    allocMethod: 'value',
    costs: [],
  },
];

// PO line items per shipment for allocation view
const PO_LINES = {
  'SHP-2026-001': [
    { po: 'PO-4481', sku: 'SKU-1042', desc: 'Roma Tomatoes (25 lb case)',        qty: 180, weight: 4500,  unitCost: 18.50 },
    { po: 'PO-4481', sku: 'SKU-1043', desc: 'Beefsteak Tomatoes (25 lb case)',   qty: 120, weight: 3000,  unitCost: 22.00 },
    { po: 'PO-4482', sku: 'SKU-1055', desc: 'Jalapeños (10 lb bag)',              qty: 240, weight: 2400,  unitCost: 8.75  },
    { po: 'PO-4482', sku: 'SKU-1056', desc: 'Serrano Peppers (10 lb bag)',        qty: 160, weight: 1600,  unitCost: 9.40  },
    { po: 'PO-4483', sku: 'SKU-1071', desc: 'Tomatillos (25 lb case)',            qty: 90,  weight: 2250,  unitCost: 16.80 },
    { po: 'PO-4483', sku: 'SKU-1072', desc: 'Poblano Peppers (20 lb case)',       qty: 75,  weight: 1500,  unitCost: 14.20 },
  ],
  'SHP-2026-002': [
    { po: 'PO-4490', sku: 'SKU-1011', desc: 'Iceberg Lettuce (24 ct case)',       qty: 200, weight: 2400,  unitCost: 12.50 },
    { po: 'PO-4490', sku: 'SKU-1012', desc: 'Romaine Hearts (3-pk case)',         qty: 150, weight: 1800,  unitCost: 15.20 },
    { po: 'PO-4491', sku: 'SKU-1013', desc: 'Green Cabbage (50 lb bag)',          qty: 80,  weight: 4000,  unitCost: 10.40 },
  ],
  'SHP-2026-003': [
    { po: 'PO-4499', sku: 'SKU-1080', desc: 'Greenhouse Cucumbers (55 ct case)', qty: 120, weight: 1980,  unitCost: 32.00 },
    { po: 'PO-4499', sku: 'SKU-1081', desc: 'Mini Sweet Peppers (5 lb bag)',      qty: 96,  weight: 480,   unitCost: 11.80 },
  ],
  'SHP-2026-004': [
    { po: 'PO-4505', sku: 'SKU-1090', desc: 'Colombian Bananas (40 lb box)',      qty: 280, weight: 11200, unitCost: 14.60 },
    { po: 'PO-4505', sku: 'SKU-1091', desc: 'Plantains Green (50 lb box)',        qty: 120, weight: 6000,  unitCost: 18.20 },
    { po: 'PO-4506', sku: 'SKU-1092', desc: 'Passion Fruit (10 lb flat)',         qty: 95,  weight: 950,   unitCost: 28.50 },
    { po: 'PO-4506', sku: 'SKU-1093', desc: 'Lulo / Naranjilla (5 lb bag)',       qty: 60,  weight: 300,   unitCost: 22.00 },
  ],
  'SHP-2026-005': [
    { po: 'PO-4512', sku: 'SKU-1044', desc: 'Cherry Tomatoes (10 lb flat)',       qty: 310, weight: 3100,  unitCost: 16.40 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (n) => (n * 100).toFixed(1) + '%';

function KpiCard({ label, value, color }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

// ─── Shipments Tab ────────────────────────────────────────────────────────────
function ShipmentsTab({ shipments, selectedId, onSelect }) {
  const totalLanded = shipments.reduce((s, sh) => s + sh.costs.reduce((a, c) => a + c.amount, 0), 0);
  const totalPO     = shipments.reduce((s, sh) => s + sh.poValue, 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <KpiCard label="Active Shipments"   value={shipments.length}                                                         color="#60a5fa" />
        <KpiCard label="Total PO Value"     value={fmt(totalPO)}                                                             color="#34d399" />
        <KpiCard label="Total Landed Costs" value={fmt(totalLanded)}                                                         color="#fbbf24" />
        <KpiCard label="Avg Landed Cost %"  value={totalPO > 0 ? fmtP(totalLanded / totalPO) : '—'}                        color="#a78bfa" />
      </div>

      {shipments.map(sh => {
        const totalCost = sh.costs.reduce((a, c) => a + c.amount, 0);
        const lcp  = sh.poValue > 0 ? totalCost / sh.poValue : 0;
        const meta = STATUS_META[sh.status] || STATUS_META.draft;
        const sel  = sh.id === selectedId;
        return (
          <div key={sh.id} onClick={() => onSelect(sh.id)}
            style={{
              background: sel ? 'rgba(59,130,246,.06)' : '#0d1117',
              border: `1px solid ${sel ? 'rgba(59,130,246,.4)' : '#1f2937'}`,
              borderRadius: 10, padding: '13px 16px', marginBottom: 8,
              cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center',
            }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ship size={16} color="#60a5fa" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{sh.id}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, border: `1px solid ${meta.border}`, background: meta.bg, color: meta.color }}>{meta.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{sh.supplier} · {sh.origin} · Arrived {sh.arrivalDate}</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 3 }}>{sh.poIds.length} PO{sh.poIds.length !== 1 ? 's' : ''}: {sh.poIds.join(', ')}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{fmt(sh.poValue)}</div>
              <div style={{ fontSize: 11, color: '#fbbf24' }}>+{fmt(totalCost)} landed</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{fmtP(lcp)} of PO value</div>
            </div>
            <ChevronRight size={14} color="#374151" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Cost Entry Tab ───────────────────────────────────────────────────────────
function CostEntryTab({ shipments, selectedId, onSelect, onAddCost, onRemoveCost, can }) {
  const sh = shipments.find(s => s.id === selectedId);
  const [form, setForm]     = useState({ type: 'freight', amount: '', carrier: '', ref: '' });
  const [toast, setToast]   = useState(null);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const handleAdd = () => {
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) { notify('Enter a valid amount', false); return; }
    if (!form.carrier.trim()) { notify('Enter carrier / vendor name', false); return; }
    onAddCost(selectedId, { ...form, amount: +form.amount, id: 'cx' + Date.now() });
    setForm({ type: 'freight', amount: '', carrier: '', ref: '' });
    notify('Cost component added');
  };

  const inp = { background: '#0a0f1a', border: '1px solid #1f2937', borderRadius: 6, padding: '7px 10px', color: '#f1f5f9', fontSize: 12, width: '100%' };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(244,63,94,.15)', border: `1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(244,63,94,.3)'}`, color: toast.ok ? '#34d399' : '#fb7185', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Shipment</div>
        <select value={selectedId || ''} onChange={e => onSelect(e.target.value)}
          style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 13, width: '100%', maxWidth: 400 }}>
          <option value="">— Select shipment —</option>
          {shipments.map(s => <option key={s.id} value={s.id}>{s.id} — {s.supplier}</option>)}
        </select>
      </div>

      {sh ? (
        <>
          {/* Existing cost components */}
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Cost Components — {sh.id}</div>
            {sh.costs.length === 0 ? (
              <div style={{ fontSize: 12, color: '#374151', textAlign: 'center', padding: '20px 0' }}>No cost components yet — add one below</div>
            ) : (
              <>
                {sh.costs.map(c => {
                  const ct  = COST_TYPES.find(t => t.id === c.type) || COST_TYPES[5];
                  const col = TYPE_COLORS[ct.color];
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #151c28' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: col.bg, color: col.text, minWidth: 130, textAlign: 'center', flexShrink: 0 }}>{ct.label}</span>
                      <span style={{ flex: 1, fontSize: 12, color: '#9ca3af' }}>{c.carrier}</span>
                      <span style={{ fontSize: 11, color: '#4b5563', minWidth: 90 }}>{c.ref}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', minWidth: 80, textAlign: 'right' }}>{fmt(c.amount)}</span>
                      {can('procurement') && (
                        <button onClick={() => onRemoveCost(sh.id, c.id)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title="Remove">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, marginTop: 4, borderTop: '1px solid #1f2937' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Total Landed Costs:</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>{fmt(sh.costs.reduce((a, c) => a + c.amount, 0))}</span>
                </div>
              </>
            )}
          </div>

          {/* Add new component */}
          {can('procurement') && (
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Add Cost Component</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Type</div>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inp}>
                    {COST_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Amount (USD)</div>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Carrier / Vendor</div>
                  <input type="text" value={form.carrier} onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))} placeholder="e.g. Crowley Maritime" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Reference #</div>
                  <input type="text" value={form.ref} onChange={e => setForm(p => ({ ...p, ref: e.target.value }))} placeholder="Invoice / bill reference" style={inp} />
                </div>
              </div>
              <button onClick={handleAdd}
                style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={13} /> Add Component
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#374151', fontSize: 13 }}>Select a shipment above to manage its cost components</div>
      )}
    </div>
  );
}

// ─── Allocation Tab ───────────────────────────────────────────────────────────
function AllocationTab({ shipments, selectedId, onSelect, onSetMethod, can }) {
  const sh    = shipments.find(s => s.id === selectedId);
  const lines = sh ? (PO_LINES[sh.id] || []) : [];
  const totalLanded = sh ? sh.costs.reduce((a, c) => a + c.amount, 0) : 0;

  const allocatedLines = useMemo(() => {
    if (!sh || lines.length === 0) return lines.map(l => ({ ...l, allocated: 0, perUnit: 0, newUnitCost: l.unitCost, pctIncrease: 0 }));
    const method = sh.allocMethod || 'value';
    const bases  = lines.map(l => {
      if (method === 'value')    return l.qty * l.unitCost;
      if (method === 'quantity') return l.qty;
      return l.weight;
    });
    const totalBase = bases.reduce((a, b) => a + b, 0);
    return lines.map((l, i) => {
      const share      = totalBase > 0 ? bases[i] / totalBase : 1 / lines.length;
      const allocated  = totalLanded * share;
      const perUnit    = l.qty > 0 ? allocated / l.qty : 0;
      return { ...l, allocated, perUnit, newUnitCost: l.unitCost + perUnit, pctIncrease: l.unitCost > 0 ? perUnit / l.unitCost : 0 };
    });
  }, [sh, lines, totalLanded]);

  const thStyle = { fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.05em' };
  const colsBase  = '200px 70px 60px 88px 90px 88px 64px';

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Shipment</div>
          <select value={selectedId || ''} onChange={e => onSelect(e.target.value)}
            style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 13 }}>
            <option value="">— Select —</option>
            {shipments.map(s => <option key={s.id} value={s.id}>{s.id} — {s.supplier}</option>)}
          </select>
        </div>
        {sh && (
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Allocation Method</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {ALLOC_METHODS.map(m => (
                <button key={m.id} onClick={() => can('procurement') && onSetMethod(sh.id, m.id)}
                  title={m.desc}
                  style={{ background: sh.allocMethod === m.id ? 'rgba(59,130,246,.2)' : '#0d1117', border: `1px solid ${sh.allocMethod === m.id ? 'rgba(59,130,246,.45)' : '#1f2937'}`, color: sh.allocMethod === m.id ? '#60a5fa' : '#9ca3af', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {sh && lines.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
            <KpiCard label="Total Landed Costs" value={fmt(totalLanded)}                                               color="#fbbf24" />
            <KpiCard label="PO Lines"           value={lines.length}                                                   color="#60a5fa" />
            <KpiCard label="Avg Landed Cost %"  value={sh.poValue > 0 ? fmtP(totalLanded / sh.poValue) : '—'}        color="#a78bfa" />
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: colsBase, gap: 0, padding: '8px 14px', background: '#080e18', borderBottom: '1px solid #1f2937' }}>
              {['SKU / Description', 'PO', 'Qty', 'Orig. Cost', 'Allocated', 'Landed Cost', 'Δ%'].map(h => (
                <div key={h} style={thStyle}>{h}</div>
              ))}
            </div>
            {allocatedLines.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: colsBase, gap: 0, padding: '9px 14px', borderBottom: '1px solid #0f1622', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{l.sku}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{l.desc}</div>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{l.po}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{l.qty.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{fmt(l.unitCost)}</div>
                <div style={{ fontSize: 12, color: '#fbbf24' }}>{l.allocated > 0 ? fmt(l.allocated) : '—'}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>{fmt(l.newUnitCost)}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: l.pctIncrease > 0.08 ? '#fb7185' : '#fbbf24' }}>
                  {l.pctIncrease > 0 ? '+' + fmtP(l.pctIncrease) : '—'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Info size={11} />
            <span>{ALLOC_METHODS.find(m => m.id === sh.allocMethod)?.desc || 'Allocation by value'}</span>
          </div>
        </>
      ) : sh ? (
        <div style={{ textAlign: 'center', padding: '32px 24px', color: '#374151', fontSize: 13 }}>No PO line data for this shipment in demo</div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#374151', fontSize: 13 }}>Select a shipment to view cost allocation</div>
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ shipments }) {
  // Aggregate by origin country
  const byOriginMap = {};
  shipments.forEach(sh => {
    const totalCost = sh.costs.reduce((a, c) => a + c.amount, 0);
    if (!byOriginMap[sh.originCode]) {
      byOriginMap[sh.originCode] = { code: sh.originCode, origin: sh.origin, poValue: 0, landedCost: 0, count: 0 };
    }
    byOriginMap[sh.originCode].poValue    += sh.poValue;
    byOriginMap[sh.originCode].landedCost += totalCost;
    byOriginMap[sh.originCode].count      += 1;
  });
  const originRows = Object.values(byOriginMap).sort((a, b) => b.landedCost - a.landedCost);

  // Aggregate by cost type
  const byTypeMap = {};
  COST_TYPES.forEach(t => { byTypeMap[t.id] = { label: t.label, color: t.color, total: 0 }; });
  shipments.forEach(sh => sh.costs.forEach(c => { if (byTypeMap[c.type]) byTypeMap[c.type].total += c.amount; }));
  const typeRows   = Object.values(byTypeMap).filter(t => t.total > 0).sort((a, b) => b.total - a.total);
  const totalTypes = typeRows.reduce((a, t) => a + t.total, 0);

  // Full summary table
  const tableColTpl = '120px 1fr 120px 90px 95px 68px 72px';
  const thS = { fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.04em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By origin */}
        <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={12} /> Landed Cost by Origin
          </div>
          {originRows.map(o => {
            const pct = o.poValue > 0 ? o.landedCost / o.poValue : 0;
            const barW = Math.min(pct / 0.15, 1);
            return (
              <div key={o.code} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{o.code}</span>
                    <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>{o.count} shipment{o.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{fmt(o.landedCost)}</span>
                    <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 6 }}>{fmtP(pct)}</span>
                  </div>
                </div>
                <div style={{ height: 5, background: '#1f2937', borderRadius: 99 }}>
                  <div style={{ width: fmtP(barW), height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#d97706,#fbbf24)' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* By cost type */}
        <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={12} /> Cost Breakdown by Type
          </div>
          {typeRows.map(t => {
            const col  = TYPE_COLORS[t.color];
            const pct  = totalTypes > 0 ? t.total / totalTypes : 0;
            return (
              <div key={t.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: col.bg, color: col.text }}>{t.label}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{fmt(t.total)}</span>
                    <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 6 }}>{fmtP(pct)}</span>
                  </div>
                </div>
                <div style={{ height: 5, background: '#1f2937', borderRadius: 99 }}>
                  <div style={{ width: fmtP(pct), height: '100%', borderRadius: 99, background: col.bg.replace(',.14)', ',.9)') }} />
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: '1px solid #1f2937', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Total on record</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>{fmt(totalTypes)}</span>
          </div>
        </div>
      </div>

      {/* Full shipment table */}
      <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#080e18', borderBottom: '1px solid #1f2937' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em' }}>Shipment Landed Cost Summary</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: tableColTpl, padding: '7px 14px', background: '#0a0f1a', borderBottom: '1px solid #1f2937' }}>
          {['Shipment', 'Supplier', 'Origin', 'PO Value', 'Landed Cost', 'LC %', 'Status'].map(h => (
            <div key={h} style={thS}>{h}</div>
          ))}
        </div>
        {shipments.map(sh => {
          const tc   = sh.costs.reduce((a, c) => a + c.amount, 0);
          const pct  = sh.poValue > 0 ? tc / sh.poValue : 0;
          const meta = STATUS_META[sh.status] || STATUS_META.draft;
          return (
            <div key={sh.id} style={{ display: 'grid', gridTemplateColumns: tableColTpl, padding: '9px 14px', borderBottom: '1px solid #0f1622', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{sh.id}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{sh.supplier}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{sh.origin}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{fmt(sh.poValue)}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{fmt(tc)}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: pct > 0.08 ? '#fb7185' : '#34d399' }}>{fmtP(pct)}</div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, border: `1px solid ${meta.border}`, background: meta.bg, color: meta.color, textAlign: 'center', display: 'inline-block' }}>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function LandedCostModule() {
  const { can } = useKernal();
  const [tab, setTab]           = useState('shipments');
  const [shipments, setShipments] = useState(DEMO_MODE ? INIT_SHIPMENTS : []);
  const [selectedId, setSelectedId] = useState('SHP-2026-001');

  const tabs = [
    { id: 'shipments',  label: 'Shipments',  Icon: Ship       },
    { id: 'costs',      label: 'Cost Entry', Icon: DollarSign },
    { id: 'allocation', label: 'Allocation', Icon: Package    },
    { id: 'reports',    label: 'Reports',    Icon: BarChart2  },
  ];

  const handleAddCost    = (shipId, cost) => setShipments(prev => prev.map(s => s.id === shipId ? { ...s, costs: [...s.costs, cost] } : s));
  const handleRemoveCost = (shipId, cid)  => setShipments(prev => prev.map(s => s.id === shipId ? { ...s, costs: s.costs.filter(c => c.id !== cid) } : s));
  const handleSetMethod  = (shipId, m)    => setShipments(prev => prev.map(s => s.id === shipId ? { ...s, allocMethod: m } : s));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1020 }}>
      {/* Module header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Anchor size={18} color="#60a5fa" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Landed Cost Management</h2>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          Allocate freight, import duty, customs broker fees, and insurance to inbound shipments — calculate true landed cost per unit across all PO lines.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid #1f2937', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #60a5fa' : '2px solid transparent', color: tab === t.id ? '#60a5fa' : '#6b7280', padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1, transition: 'color .15s' }}>
            <t.Icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'shipments'  && <ShipmentsTab  shipments={shipments} selectedId={selectedId} onSelect={setSelectedId} />}
      {tab === 'costs'      && <CostEntryTab  shipments={shipments} selectedId={selectedId} onSelect={setSelectedId} onAddCost={handleAddCost} onRemoveCost={handleRemoveCost} can={can} />}
      {tab === 'allocation' && <AllocationTab shipments={shipments} selectedId={selectedId} onSelect={setSelectedId} onSetMethod={handleSetMethod} can={can} />}
      {tab === 'reports'    && <ReportsTab    shipments={shipments} />}
    </div>
  );
}
