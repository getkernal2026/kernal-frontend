import React, { useState, useMemo } from 'react';
import { useKernal } from './KernalContext.jsx';
import { DEMO_MODE } from './lib/demoMode.js';
import {
  Smartphone, ScanBarcode, PackageCheck, MoveRight, ClipboardList,
  Check, X, AlertTriangle, Clock, ChevronRight, ChevronDown,
  Barcode, Layers, ArrowRight, RefreshCw, Zap,
} from 'lucide-react';

// ─── Local const — Rolldown IIFE TDZ fix ─────────────────────────────────────
const COMPANY_INFO = {
  name: 'Kernel Distribution Co.',
  warehouseCode: 'LOC-A',
};

// ─── Status metadata ──────────────────────────────────────────────────────────
const STATUS_META = {
  pending:     { label: 'Pending',     color: '#9ca3af', bg: 'rgba(113,113,122,.1)',  border: 'rgba(113,113,122,.25)' },
  assigned:    { label: 'Assigned',    color: '#60a5fa', bg: 'rgba(59,130,246,.1)',   border: 'rgba(59,130,246,.25)'  },
  in_progress: { label: 'In Progress', color: '#fbbf24', bg: 'rgba(245,158,11,.1)',   border: 'rgba(245,158,11,.25)'  },
  complete:    { label: 'Complete',    color: '#34d399', bg: 'rgba(52,211,153,.1)',   border: 'rgba(52,211,153,.25)'  },
  discrepancy: { label: 'Discrepancy', color: '#fb7185', bg: 'rgba(244,63,94,.1)',    border: 'rgba(244,63,94,.25)'   },
};

// ─── Seed data — Receiving ────────────────────────────────────────────────────
const INIT_RECEIVE_TASKS = [
  {
    id: 'RT-001', poId: 'PO-4481', supplier: 'Rancho Verde Distributors',
    arrivalDate: '2026-05-14', status: 'pending',
    lines: [
      { id: 'RL-001', sku: 'SKU-1042', desc: 'Roma Tomatoes (25 lb case)',    expectedQty: 180, receivedQty: 0,  uom: 'case', barcode: '6141419996730', lot: 'LOT-D-CRITICAL', status: 'pending'  },
      { id: 'RL-002', sku: 'SKU-1043', desc: 'Beefsteak Tomatoes (25 lb)',    expectedQty: 120, receivedQty: 0,  uom: 'case', barcode: '6141419996747', lot: 'LOT-D-CRITICAL', status: 'pending'  },
      { id: 'RL-003', sku: 'SKU-1055', desc: 'Jalapeños (10 lb bag)',         expectedQty: 240, receivedQty: 0,  uom: 'bag',  barcode: '6141419996754', lot: 'LOT-NEW-001',    status: 'pending'  },
    ],
  },
  {
    id: 'RT-002', poId: 'PO-4490', supplier: 'Southwest Produce Co.',
    arrivalDate: '2026-05-18', status: 'in_progress',
    lines: [
      { id: 'RL-004', sku: 'SKU-1011', desc: 'Iceberg Lettuce (24 ct case)', expectedQty: 200, receivedQty: 200, uom: 'case', barcode: '6141419996808', lot: 'LOT-E-WARN',     status: 'complete' },
      { id: 'RL-005', sku: 'SKU-1012', desc: 'Romaine Hearts (3-pk case)',   expectedQty: 150, receivedQty: 0,  uom: 'case', barcode: '6141419996815', lot: 'LOT-E-WARN',     status: 'pending'  },
    ],
  },
  {
    id: 'RT-003', poId: 'PO-AP-0883', supplier: 'Sysco Corporation',
    arrivalDate: '2026-05-19', status: 'complete',
    lines: [
      { id: 'RL-006', sku: 'FRZ-BEEF-01', desc: 'Ground Beef 80/20 (10 lb)', expectedQty: 60, receivedQty: 60, uom: 'pack', barcode: '6141419996900', lot: 'LOT-A-URGENT', status: 'complete' },
      { id: 'RL-007', sku: 'PLT-CHICK-05', desc: 'Chicken Breast IQF (40 lb)', expectedQty: 45, receivedQty: 45, uom: 'case', barcode: '6141419996917', lot: 'LOT-A-URGENT', status: 'complete' },
      { id: 'RL-008', sku: 'FRZ-SALM-01', desc: 'Salmon Fillet (10 lb vac)',  expectedQty: 30, receivedQty: 28, uom: 'pack', barcode: '6141419996924', lot: 'LOT-G-CRITICAL', status: 'complete' },
      { id: 'RL-009', sku: 'DAI-MILK-02', desc: 'Whole Milk (1 gal case)',    expectedQty: 24, receivedQty: 24, uom: 'case', barcode: '6141419996931', lot: 'LOT-A-URGENT', status: 'complete' },
    ],
  },
];

// ─── Seed data — Putaway ──────────────────────────────────────────────────────
const INIT_PUTAWAY_TASKS = [
  { id: 'PA-001', sku: 'SKU-1042', desc: 'Roma Tomatoes (25 lb case)',    qty: 180, lot: 'LOT-D-CRITICAL', from: 'DOCK-A', to: 'A-04-C', assignedTo: 'Marcus T.',  zone: 'Dry Storage',   status: 'assigned',  estMin: 12 },
  { id: 'PA-002', sku: 'SKU-1055', desc: 'Jalapeños (10 lb bag)',         qty: 240, lot: 'LOT-NEW-001',    from: 'DOCK-A', to: 'B-02-A', assignedTo: 'Marcus T.',  zone: 'Produce Cooler',status: 'assigned',  estMin: 15 },
  { id: 'PA-003', sku: 'SKU-1011', desc: 'Iceberg Lettuce (24 ct case)', qty: 200, lot: 'LOT-E-WARN',     from: 'DOCK-B', to: 'C-01-B', assignedTo: 'Devon L.',   zone: 'Produce Cooler',status: 'complete',  estMin: 10 },
  { id: 'PA-004', sku: 'FRZ-BEEF-01', desc: 'Ground Beef 80/20 (10 lb)',  qty: 60,  lot: 'LOT-A-URGENT',  from: 'DOCK-C', to: 'FRZ-02-A', assignedTo: 'Sarah K.', zone: 'Freezer',       status: 'pending',   estMin: 8  },
];

// ─── Seed data — Pick Waves ───────────────────────────────────────────────────
const INIT_WAVES = [
  {
    id: 'WV-2026-089', soId: 'SO-9897', customer: 'City School District',
    status: 'in_progress', startedAt: '10:15', completedAt: null,
    picks: [
      { id: 'PK-001', sku: 'SKU-1042',    desc: 'Roma Tomatoes (25 lb case)',    bin: 'A-04-C',   qty: 12, picked: true,  pickedAt: '10:18' },
      { id: 'PK-002', sku: 'SKU-1011',    desc: 'Iceberg Lettuce (24 ct case)', bin: 'C-01-B',   qty: 8,  picked: true,  pickedAt: '10:22' },
      { id: 'PK-003', sku: 'FRZ-BEEF-01', desc: 'Ground Beef 80/20 (10 lb)',    bin: 'FRZ-02-A', qty: 6,  picked: false, pickedAt: null    },
      { id: 'PK-004', sku: 'PLT-CHICK-05',desc: 'Chicken Breast IQF (40 lb)',  bin: 'FRZ-01-B', qty: 4,  picked: false, pickedAt: null    },
      { id: 'PK-005', sku: 'DAI-MILK-02', desc: 'Whole Milk (1 gal case)',      bin: 'CLR-03-A', qty: 24, picked: false, pickedAt: null    },
    ],
  },
  {
    id: 'WV-2026-090', soId: 'SO-9898', customer: 'Harbor View Hotel',
    status: 'pending', startedAt: null, completedAt: null,
    picks: [
      { id: 'PK-006', sku: 'SKU-1043',    desc: 'Beefsteak Tomatoes (25 lb)',  bin: 'A-04-D',   qty: 6,  picked: false, pickedAt: null },
      { id: 'PK-007', sku: 'FRZ-SALM-01', desc: 'Salmon Fillet (10 lb vac)',   bin: 'FRZ-02-B', qty: 8,  picked: false, pickedAt: null },
      { id: 'PK-008', sku: 'DAI-CHE-02',  desc: 'Cheddar Cheese (5 lb block)', bin: 'CLR-02-A', qty: 10, picked: false, pickedAt: null },
    ],
  },
  {
    id: 'WV-2026-088', soId: 'SO-9893', customer: 'Bayou Grill & Pub',
    status: 'complete', startedAt: '08:30', completedAt: '08:51',
    picks: [
      { id: 'PK-009', sku: 'FRZ-BEEF-01', desc: 'Ground Beef 80/20 (10 lb)', bin: 'FRZ-01-A', qty: 3,  picked: true, pickedAt: '08:35' },
      { id: 'PK-010', sku: 'DAI-MILK-02', desc: 'Whole Milk (1 gal case)',    bin: 'CLR-03-A', qty: 12, picked: true, pickedAt: '08:44' },
    ],
  },
];

// ─── Seed data — Cycle Counts ─────────────────────────────────────────────────
const INIT_CYCLE_COUNTS = [
  { id: 'CC-001', bin: 'A-04-C',   sku: 'SKU-1042',    desc: 'Roma Tomatoes (25 lb case)',    zone: 'Dry Storage',    expectedQty: 45, countedQty: null, status: 'assigned',    assignedTo: 'Marcus T.' },
  { id: 'CC-002', bin: 'B-02-A',   sku: 'SKU-1055',    desc: 'Jalapeños (10 lb bag)',          zone: 'Produce Cooler', expectedQty: 28, countedQty: 26,   status: 'discrepancy', assignedTo: 'Devon L.'  },
  { id: 'CC-003', bin: 'FRZ-02-B', sku: 'FRZ-SALM-01', desc: 'Salmon Fillet (10 lb vac)',      zone: 'Freezer',        expectedQty: 12, countedQty: 12,   status: 'complete',    assignedTo: 'Sarah K.'  },
  { id: 'CC-004', bin: 'CLR-03-A', sku: 'DAI-MILK-02', desc: 'Whole Milk (1 gal case)',        zone: 'Dairy Cooler',   expectedQty: 80, countedQty: null, status: 'pending',     assignedTo: null        },
];

// ─── Scanner component (barcode reader simulation) ────────────────────────────
function Scanner({ label, value, onScan, scanning }) {
  return (
    <div style={{ background: '#080e18', border: '1px solid #1f2937', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
        {label}
      </div>
      {/* Barcode display */}
      <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, padding: '10px 12px', marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Barcode size={28} color="#374151" />
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#6b7280', letterSpacing: '.1em' }}>{value || '——————'}</div>
      </div>
      {/* Scan beam animation */}
      {scanning ? (
        <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 0.8s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>Scanning…</span>
        </div>
      ) : (
        <button onClick={onScan}
          style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
          <ScanBarcode size={14} /> Scan Barcode
        </button>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function KpiCard({ label, value, color, sub }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: `1px solid ${m.border}`, background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>{m.label}</span>
  );
}

// ─── Receive Tab ──────────────────────────────────────────────────────────────
function ReceiveTab({ tasks, setTasks, can }) {
  const [selId, setSelId]     = useState('RT-002');
  const [scanning, setScanning] = useState(null); // line id being scanned
  const [toast, setToast]     = useState(null);

  const task = tasks.find(t => t.id === selId);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScan = (lineId) => {
    setScanning(lineId);
    setTimeout(() => {
      setScanning(null);
      setTasks(prev => prev.map(t => {
        if (t.id !== selId) return t;
        const lines = t.lines.map(l => l.id !== lineId ? l : { ...l, receivedQty: l.expectedQty, status: 'complete' });
        const allDone = lines.every(l => l.status === 'complete');
        return { ...t, lines, status: allDone ? 'complete' : 'in_progress' };
      }));
      notify('Line received ✓');
    }, 1600);
  };

  const pending = tasks.filter(t => t.status !== 'complete').length;
  const totalLines = tasks.reduce((a, t) => a + t.lines.length, 0);
  const doneLines  = tasks.reduce((a, t) => a + t.lines.filter(l => l.status === 'complete').length, 0);

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(244,63,94,.15)', border: `1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(244,63,94,.3)'}`, color: toast.ok ? '#34d399' : '#fb7185', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{toast.msg}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Pending Tasks"  value={pending}                     color="#fbbf24" />
        <KpiCard label="Active Tasks"   value={tasks.filter(t => t.status === 'in_progress').length} color="#60a5fa" />
        <KpiCard label="Lines Received" value={`${doneLines}/${totalLines}`} color="#34d399" />
        <KpiCard label="Completed Today" value={tasks.filter(t => t.status === 'complete').length} color="#a78bfa" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 14 }}>
        {/* Task list */}
        <div>
          {tasks.map(t => {
            const done = t.lines.filter(l => l.status === 'complete').length;
            return (
              <div key={t.id} onClick={() => setSelId(t.id)}
                style={{ background: selId === t.id ? 'rgba(59,130,246,.06)' : '#0d1117', border: `1px solid ${selId === t.id ? 'rgba(59,130,246,.35)' : '#1f2937'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{t.poId}</span>
                  <StatusPill status={t.status} />
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{t.supplier}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: '#1f2937', borderRadius: 99 }}>
                    <div style={{ width: `${t.lines.length > 0 ? (done / t.lines.length) * 100 : 0}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#059669,#34d399)' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#6b7280', flexShrink: 0 }}>{done}/{t.lines.length} lines</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Task detail */}
        {task ? (
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#080e18', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{task.poId} — {task.supplier}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Arrival: {task.arrivalDate}</div>
              </div>
              <StatusPill status={task.status} />
            </div>
            {task.lines.map(line => (
              <div key={line.id} style={{ padding: '11px 16px', borderBottom: '1px solid #0f1622', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: line.status === 'complete' ? 'rgba(52,211,153,.15)' : 'rgba(113,113,122,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {line.status === 'complete' ? <Check size={14} color="#34d399" /> : <Barcode size={14} color="#6b7280" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{line.sku}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{line.desc}</div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>Lot: {line.lot} · Barcode: {line.barcode}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: line.status === 'complete' ? '#34d399' : '#f1f5f9' }}>
                    {line.receivedQty} <span style={{ color: '#4b5563', fontWeight: 400 }}>/ {line.expectedQty}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280' }}>{line.uom}</div>
                </div>
                {line.status !== 'complete' && can('warehouse') ? (
                  <button onClick={() => handleScan(line.id)} disabled={!!scanning}
                    style={{ background: scanning === line.id ? 'rgba(59,130,246,.25)' : 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {scanning === line.id ? <><RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> Scanning…</> : <><ScanBarcode size={11} /> Scan</>}
                  </button>
                ) : (
                  <StatusPill status={line.status} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>Select a task to begin receiving</div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── Putaway Tab ──────────────────────────────────────────────────────────────
function PutawayTab({ tasks, setTasks, can }) {
  const [selId, setSelId]       = useState('PA-001');
  const [scanStep, setScanStep] = useState('idle'); // idle | item_scan | bin_scan | done
  const [toast, setToast]       = useState(null);

  const task = tasks.find(t => t.id === selId);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScanItem = () => {
    setScanStep('item_scanning');
    setTimeout(() => setScanStep('bin_scan'), 1600);
  };

  const handleScanBin = () => {
    setScanStep('bin_scanning');
    setTimeout(() => {
      setScanStep('idle');
      setTasks(prev => prev.map(t => t.id === selId ? { ...t, status: 'complete' } : t));
      notify('Putaway confirmed ✓');
      // auto-select next pending
      const nextPending = tasks.find(t => t.id !== selId && t.status !== 'complete');
      if (nextPending) setSelId(nextPending.id);
    }, 1500);
  };

  const assigned = tasks.filter(t => t.status === 'assigned').length;
  const done     = tasks.filter(t => t.status === 'complete').length;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(244,63,94,.15)', border: `1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(244,63,94,.3)'}`, color: toast.ok ? '#34d399' : '#fb7185', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{toast.msg}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Assigned Tasks"  value={assigned}                                          color="#60a5fa" />
        <KpiCard label="Pending Tasks"   value={tasks.filter(t => t.status === 'pending').length}  color="#fbbf24" />
        <KpiCard label="Completed"       value={done}                                              color="#34d399" />
        <KpiCard label="Total Units"     value={tasks.reduce((a, t) => a + t.qty, 0).toLocaleString()} color="#a78bfa" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        {/* Task list */}
        <div>
          {tasks.map(t => (
            <div key={t.id} onClick={() => { setSelId(t.id); setScanStep('idle'); }}
              style={{ background: selId === t.id ? 'rgba(59,130,246,.06)' : '#0d1117', border: `1px solid ${selId === t.id ? 'rgba(59,130,246,.35)' : '#1f2937'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{t.id}</span>
                <StatusPill status={t.status} />
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 11, color: '#6b7280' }}>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{t.qty}</span>
                <span>{t.uom || 'units'}</span>
                <span>·</span>
                <span>{t.from}</span>
                <ArrowRight size={10} />
                <span style={{ fontWeight: 700, color: '#60a5fa' }}>{t.to}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Scanner panel */}
        {task ? (
          <div>
            {/* Task info card */}
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '13px 16px', marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'SKU',     value: task.sku      },
                  { label: 'Lot',     value: task.lot      },
                  { label: 'Qty',     value: task.qty      },
                  { label: 'Zone',    value: task.zone     },
                  { label: 'From',    value: task.from     },
                  { label: 'Assigned', value: task.assignedTo || 'Unassigned' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 1 }}>{f.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d1d5db' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {/* From → To */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 12px', background: '#080e18', borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', padding: '3px 10px', background: '#1f2937', borderRadius: 5 }}>{task.from}</span>
                <ArrowRight size={14} color="#4b5563" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa', padding: '3px 12px', background: 'rgba(59,130,246,.12)', borderRadius: 5, border: '1px solid rgba(59,130,246,.25)' }}>{task.to}</span>
              </div>
            </div>

            {task.status === 'complete' ? (
              <div style={{ background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.25)', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
                <Check size={28} color="#34d399" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>Putaway Complete</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{task.qty} units placed in {task.to}</div>
              </div>
            ) : (
              <>
                {/* Step 1: Scan item */}
                <div style={{ background: '#0d1117', border: `1px solid ${scanStep === 'bin_scan' || scanStep === 'bin_scanning' ? '#1f2937' : 'rgba(59,130,246,.3)'}`, borderRadius: 10, padding: '13px 16px', marginBottom: 10, opacity: scanStep === 'bin_scan' || scanStep === 'bin_scanning' ? 0.45 : 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: scanStep === 'idle' || scanStep === 'item_scanning' ? 'rgba(59,130,246,.2)' : 'rgba(52,211,153,.2)', color: scanStep === 'idle' || scanStep === 'item_scanning' ? '#60a5fa' : '#34d399', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                    Scan Item Barcode
                  </div>
                  <Scanner label={task.desc} value={scanStep === 'bin_scan' || scanStep === 'bin_scanning' ? task.sku : null} onScan={handleScanItem} scanning={scanStep === 'item_scanning'} />
                </div>

                {/* Step 2: Scan bin */}
                <div style={{ background: '#0d1117', border: `1px solid ${scanStep === 'bin_scan' || scanStep === 'bin_scanning' ? 'rgba(59,130,246,.3)' : '#1f2937'}`, borderRadius: 10, padding: '13px 16px', opacity: scanStep === 'idle' || scanStep === 'item_scanning' ? 0.45 : 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: scanStep === 'bin_scan' || scanStep === 'bin_scanning' ? 'rgba(59,130,246,.2)' : 'rgba(113,113,122,.1)', color: scanStep === 'bin_scan' || scanStep === 'bin_scanning' ? '#60a5fa' : '#6b7280', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                    Scan Destination Bin
                  </div>
                  <Scanner label={`Bin: ${task.to}`} value={scanStep === 'bin_scan' || scanStep === 'bin_scanning' ? task.to : null} onScan={handleScanBin} scanning={scanStep === 'bin_scanning'} />
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>Select a putaway task</div>
        )}
      </div>
    </div>
  );
}

// ─── Pick Tab ─────────────────────────────────────────────────────────────────
function PickTab({ waves, setWaves, can }) {
  const [selId, setSelId]     = useState('WV-2026-089');
  const [scanning, setScanning] = useState(null);
  const [toast, setToast]     = useState(null);

  const wave = waves.find(w => w.id === selId);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScanPick = (pickId) => {
    setScanning(pickId);
    setTimeout(() => {
      setScanning(null);
      setWaves(prev => prev.map(w => {
        if (w.id !== selId) return w;
        const now = new Date().toTimeString().slice(0, 5);
        const picks = w.picks.map(p => p.id !== pickId ? p : { ...p, picked: true, pickedAt: now });
        const allPicked = picks.every(p => p.picked);
        return { ...w, picks, status: allPicked ? 'complete' : 'in_progress', completedAt: allPicked ? now : w.completedAt };
      }));
      notify('Pick confirmed ✓');
    }, 1500);
  };

  const inProgressWaves = waves.filter(w => w.status === 'in_progress').length;
  const totalPicks  = waves.reduce((a, w) => a + w.picks.length, 0);
  const donePicks   = waves.reduce((a, w) => a + w.picks.filter(p => p.picked).length, 0);
  const pendingWaves = waves.filter(w => w.status === 'pending').length;

  const wavePicks = wave?.picks || [];
  const wavePicksDone = wavePicks.filter(p => p.picked).length;
  const nextPick  = wavePicks.find(p => !p.picked);

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(244,63,94,.15)', border: `1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(244,63,94,.3)'}`, color: toast.ok ? '#34d399' : '#fb7185', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{toast.msg}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Active Waves"   value={inProgressWaves}  color="#fbbf24" />
        <KpiCard label="Pending Waves"  value={pendingWaves}     color="#60a5fa" />
        <KpiCard label="Picks Complete" value={`${donePicks}/${totalPicks}`} color="#34d399" />
        <KpiCard label="Completed Waves" value={waves.filter(w => w.status === 'complete').length} color="#a78bfa" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 14 }}>
        {/* Wave list */}
        <div>
          {waves.map(w => {
            const done = w.picks.filter(p => p.picked).length;
            return (
              <div key={w.id} onClick={() => setSelId(w.id)}
                style={{ background: selId === w.id ? 'rgba(59,130,246,.06)' : '#0d1117', border: `1px solid ${selId === w.id ? 'rgba(59,130,246,.35)' : '#1f2937'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 8, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{w.id}</span>
                  <StatusPill status={w.status} />
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{w.soId} · {w.customer}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: '#1f2937', borderRadius: 99 }}>
                    <div style={{ width: `${w.picks.length > 0 ? (done / w.picks.length) * 100 : 0}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#059669,#34d399)' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#6b7280', flexShrink: 0 }}>{done}/{w.picks.length}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pick detail */}
        {wave ? (
          <div>
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: '#080e18', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{wave.id} — {wave.customer}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{wave.soId} · {wavePicksDone}/{wavePicks.length} picks done{wave.startedAt ? ` · Started ${wave.startedAt}` : ''}</div>
                </div>
                <StatusPill status={wave.status} />
              </div>
              {wavePicks.map(pick => (
                <div key={pick.id} style={{ padding: '10px 14px', borderBottom: '1px solid #0f1622', display: 'flex', gap: 12, alignItems: 'center', background: nextPick?.id === pick.id ? 'rgba(59,130,246,.03)' : 'transparent' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: pick.picked ? 'rgba(52,211,153,.15)' : nextPick?.id === pick.id ? 'rgba(59,130,246,.15)' : 'rgba(113,113,122,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {pick.picked ? <Check size={13} color="#34d399" /> : nextPick?.id === pick.id ? <Zap size={13} color="#60a5fa" /> : <Clock size={13} color="#4b5563" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: pick.picked ? '#6b7280' : '#f1f5f9', textDecoration: pick.picked ? 'line-through' : 'none' }}>{pick.sku}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{pick.desc}</div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: '#4b5563' }}>Bin</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>{pick.bin}</div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: '#4b5563' }}>Qty</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{pick.qty}</div>
                  </div>
                  <div style={{ flexShrink: 0, minWidth: 86, textAlign: 'right' }}>
                    {pick.picked ? (
                      <span style={{ fontSize: 10, color: '#34d399' }}>{pick.pickedAt}</span>
                    ) : (
                      wave.status !== 'pending' && can('warehouse') ? (
                        <button onClick={() => handleScanPick(pick.id)} disabled={!!scanning}
                          style={{ background: scanning === pick.id ? 'rgba(59,130,246,.25)' : 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {scanning === pick.id ? <><RefreshCw size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> Scanning</> : <><ScanBarcode size={11} /> Scan</>}
                        </button>
                      ) : <span style={{ fontSize: 10, color: '#4b5563' }}>Queued</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {nextPick && wave.status !== 'pending' && (
              <div style={{ marginTop: 10, background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={14} color="#60a5fa" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>Next: Go to bin {nextPick.bin}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Pick {nextPick.qty}× {nextPick.desc}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>Select a wave to begin picking</div>
        )}
      </div>
    </div>
  );
}

// ─── Cycle Count Tab ──────────────────────────────────────────────────────────
function CycleCountTab({ counts, setCounts, can }) {
  const [selId, setSelId]     = useState('CC-002');
  const [inputQty, setInputQty] = useState('');
  const [scanning, setScanning] = useState(false);
  const [toast, setToast]     = useState(null);

  const count = counts.find(c => c.id === selId);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScanBin = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 1500);
  };

  const handleSubmitCount = () => {
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || qty < 0) { notify('Enter a valid quantity', false); return; }
    const disc = qty - count.expectedQty;
    const status = disc === 0 ? 'complete' : 'discrepancy';
    setCounts(prev => prev.map(c => c.id === selId ? { ...c, countedQty: qty, discrepancy: disc, status } : c));
    setInputQty('');
    notify(disc === 0 ? 'Count matches expected ✓' : `Discrepancy: ${disc > 0 ? '+' : ''}${disc} units`, disc === 0);
  };

  const assigned    = counts.filter(c => c.status === 'assigned').length;
  const discr       = counts.filter(c => c.status === 'discrepancy').length;
  const done        = counts.filter(c => c.status === 'complete').length;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(244,63,94,.15)', border: `1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(244,63,94,.3)'}`, color: toast.ok ? '#34d399' : '#fb7185', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{toast.msg}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Assigned Tasks"  value={assigned}  color="#60a5fa" />
        <KpiCard label="Discrepancies"   value={discr}     color="#fb7185" sub="Require review" />
        <KpiCard label="Completed"       value={done}      color="#34d399" />
        <KpiCard label="Pending"         value={counts.filter(c => c.status === 'pending').length} color="#9ca3af" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        {/* Count list */}
        <div>
          {counts.map(c => (
            <div key={c.id} onClick={() => { setSelId(c.id); setInputQty(''); setScanning(false); }}
              style={{ background: selId === c.id ? 'rgba(59,130,246,.06)' : '#0d1117', border: `1px solid ${selId === c.id ? 'rgba(59,130,246,.35)' : '#1f2937'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{c.id}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,.1)', padding: '1px 6px', borderRadius: 4 }}>{c.bin}</span>
                </div>
                <StatusPill status={c.status} />
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.desc}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{c.zone} · {c.assignedTo || 'Unassigned'}</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>Exp: {c.expectedQty} {c.countedQty !== null ? `· Got: ${c.countedQty}` : ''}</span>
              </div>
              {c.status === 'discrepancy' && (
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={11} color="#fb7185" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fb7185' }}>{c.discrepancy > 0 ? '+' : ''}{c.discrepancy} units</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Count entry */}
        {count ? (
          <div>
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Bin',         value: count.bin         },
                  { label: 'Zone',        value: count.zone        },
                  { label: 'SKU',         value: count.sku         },
                  { label: 'Assigned To', value: count.assignedTo || 'Unassigned' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 1 }}>{f.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d1d5db' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{count.desc}</div>
            </div>

            {/* Scan bin */}
            <div style={{ marginBottom: 12 }}>
              <Scanner label={`Bin: ${count.bin}`} value={scanning ? count.bin : null} onScan={handleScanBin} scanning={scanning} />
            </div>

            {/* Count entry */}
            {count.status === 'complete' || count.status === 'discrepancy' ? (
              <div style={{ background: count.status === 'discrepancy' ? 'rgba(244,63,94,.06)' : 'rgba(52,211,153,.06)', border: `1px solid ${count.status === 'discrepancy' ? 'rgba(244,63,94,.25)' : 'rgba(52,211,153,.25)'}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Expected qty</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{count.expectedQty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Counted qty</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{count.countedQty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #1f2937' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>Discrepancy</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: count.discrepancy === 0 ? '#34d399' : '#fb7185' }}>
                    {count.discrepancy === 0 ? '✓ Match' : `${count.discrepancy > 0 ? '+' : ''}${count.discrepancy} units`}
                  </span>
                </div>
                {count.status === 'discrepancy' && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(244,63,94,.08)', borderRadius: 6, fontSize: 11, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={11} /> Discrepancy flagged — supervisor review required
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Enter Counted Quantity</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>Expected: {count.expectedQty}</div>
                    <input type="number" min="0" value={inputQty} onChange={e => setInputQty(e.target.value)}
                      placeholder="0"
                      style={{ background: '#0a0f1a', border: '1px solid #374151', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 18, fontWeight: 700, width: '100%', textAlign: 'center' }} />
                  </div>
                </div>
                {can('warehouse') && (
                  <button onClick={handleSubmitCount}
                    style={{ width: '100%', background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.3)', color: '#34d399', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <PackageCheck size={14} /> Submit Count
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>Select a count task</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MobileWMSModule() {
  const { can } = useKernal();
  const [tab, setTab] = useState('receive');

  const [receiveTasks, setReceiveTasks] = useState(DEMO_MODE ? INIT_RECEIVE_TASKS : []);
  const [putawayTasks, setPutawayTasks] = useState(DEMO_MODE ? INIT_PUTAWAY_TASKS : []);
  const [waves, setWaves]               = useState(DEMO_MODE ? INIT_WAVES : []);
  const [cycleCounts, setCycleCounts]   = useState(DEMO_MODE ? INIT_CYCLE_COUNTS : []);

  const tabs = [
    { id: 'receive', label: 'Receive',     Icon: PackageCheck    },
    { id: 'putaway', label: 'Putaway',     Icon: MoveRight       },
    { id: 'pick',    label: 'Pick',        Icon: ScanBarcode     },
    { id: 'cycle',   label: 'Cycle Count', Icon: ClipboardList   },
  ];

  // Badges
  const pendingReceive = receiveTasks.filter(t => t.status !== 'complete').length;
  const pendingPutaway = putawayTasks.filter(t => t.status === 'assigned').length;
  const activeWave     = waves.filter(w => w.status === 'in_progress').length;
  const pendingCycle   = cycleCounts.filter(c => c.status === 'assigned' || c.status === 'discrepancy').length;
  const badges = { receive: pendingReceive, putaway: pendingPutaway, pick: activeWave, cycle: pendingCycle };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1040 }}>
      {/* Module header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Smartphone size={18} color="#60a5fa" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Mobile WMS</h2>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.25)' }}>Handheld Scanner</span>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          Warehouse associate workflows — scan-to-receive inbound POs, scan-to-bin putaway, wave picking, and cycle counts. Mirrors what associates see on ruggedized handheld scanners.
        </p>
      </div>

      {/* Tabs */}
      <div id="kernal-module-tabs" style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid #1f2937', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #60a5fa' : '2px solid transparent', color: tab === t.id ? '#60a5fa' : '#6b7280', padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1, transition: 'color .15s', position: 'relative' }}>
            <t.Icon size={13} /> {t.label}
            {badges[t.id] > 0 && (
              <span style={{ fontSize: 9, fontWeight: 800, background: tab === t.id ? '#60a5fa' : '#374151', color: tab === t.id ? '#030712' : '#9ca3af', padding: '1px 5px', borderRadius: 99, minWidth: 16, textAlign: 'center' }}>{badges[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'receive' && <ReceiveTab    tasks={receiveTasks} setTasks={setReceiveTasks} can={can} />}
      {tab === 'putaway' && <PutawayTab    tasks={putawayTasks} setTasks={setPutawayTasks} can={can} />}
      {tab === 'pick'    && <PickTab       waves={waves}        setWaves={setWaves}        can={can} />}
      {tab === 'cycle'   && <CycleCountTab counts={cycleCounts} setCounts={setCycleCounts}  can={can} />}
    </div>
  );
}
