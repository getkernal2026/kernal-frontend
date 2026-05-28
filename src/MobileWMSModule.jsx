import React, { useState, useRef, useEffect } from 'react';
import { useKernal } from './KernalContext.jsx';
import { DEMO_MODE } from './lib/demoMode.js';
import {
  Smartphone, ScanBarcode, PackageCheck, MoveRight, ClipboardList,
  Check, X, AlertTriangle, Clock, Barcode, ArrowRight, Zap,
  Camera, CameraOff, Plus, Trash2,
} from 'lucide-react';

// ─── Local const ──────────────────────────────────────────────────────────────
const COMPANY_INFO = { name: 'Kernel Distribution Co.', warehouseCode: 'LOC-A' };

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
      { id: 'RL-006', sku: 'FRZ-BEEF-01',  desc: 'Ground Beef 80/20 (10 lb)',    expectedQty: 60, receivedQty: 60, uom: 'pack', barcode: '6141419996900', lot: 'LOT-A-URGENT',   status: 'complete' },
      { id: 'RL-007', sku: 'PLT-CHICK-05', desc: 'Chicken Breast IQF (40 lb)',   expectedQty: 45, receivedQty: 45, uom: 'case', barcode: '6141419996917', lot: 'LOT-A-URGENT',   status: 'complete' },
      { id: 'RL-008', sku: 'FRZ-SALM-01',  desc: 'Salmon Fillet (10 lb vac)',    expectedQty: 30, receivedQty: 28, uom: 'pack', barcode: '6141419996924', lot: 'LOT-G-CRITICAL', status: 'complete' },
      { id: 'RL-009', sku: 'DAI-MILK-02',  desc: 'Whole Milk (1 gal case)',      expectedQty: 24, receivedQty: 24, uom: 'case', barcode: '6141419996931', lot: 'LOT-A-URGENT',   status: 'complete' },
    ],
  },
];

// ─── Seed data — Putaway ──────────────────────────────────────────────────────
const INIT_PUTAWAY_TASKS = [
  { id: 'PA-001', sku: 'SKU-1042',    desc: 'Roma Tomatoes (25 lb case)',    qty: 180, lot: 'LOT-D-CRITICAL', barcode: '6141419996730', from: 'DOCK-A', to: 'A-04-C',   assignedTo: 'Marcus T.', zone: 'Dry Storage',    status: 'assigned', estMin: 12 },
  { id: 'PA-002', sku: 'SKU-1055',    desc: 'Jalapeños (10 lb bag)',         qty: 240, lot: 'LOT-NEW-001',    barcode: '6141419996754', from: 'DOCK-A', to: 'B-02-A',   assignedTo: 'Marcus T.', zone: 'Produce Cooler', status: 'assigned', estMin: 15 },
  { id: 'PA-003', sku: 'SKU-1011',    desc: 'Iceberg Lettuce (24 ct case)', qty: 200, lot: 'LOT-E-WARN',     barcode: '6141419996808', from: 'DOCK-B', to: 'C-01-B',   assignedTo: 'Devon L.',  zone: 'Produce Cooler', status: 'complete', estMin: 10 },
  { id: 'PA-004', sku: 'FRZ-BEEF-01', desc: 'Ground Beef 80/20 (10 lb)',    qty: 60,  lot: 'LOT-A-URGENT',  barcode: '6141419996900', from: 'DOCK-C', to: 'FRZ-02-A', assignedTo: 'Sarah K.',  zone: 'Freezer',        status: 'pending',  estMin: 8  },
];

// ─── Seed data — Pick Waves ───────────────────────────────────────────────────
const INIT_WAVES = [
  {
    id: 'WV-2026-089', soId: 'SO-9897', customer: 'City School District',
    status: 'in_progress', startedAt: '10:15', completedAt: null,
    picks: [
      { id: 'PK-001', sku: 'SKU-1042',     desc: 'Roma Tomatoes (25 lb case)',    bin: 'A-04-C',   qty: 12, picked: true,  pickedAt: '10:18' },
      { id: 'PK-002', sku: 'SKU-1011',     desc: 'Iceberg Lettuce (24 ct case)', bin: 'C-01-B',   qty: 8,  picked: true,  pickedAt: '10:22' },
      { id: 'PK-003', sku: 'FRZ-BEEF-01',  desc: 'Ground Beef 80/20 (10 lb)',    bin: 'FRZ-02-A', qty: 6,  picked: false, pickedAt: null    },
      { id: 'PK-004', sku: 'PLT-CHICK-05', desc: 'Chicken Breast IQF (40 lb)',   bin: 'FRZ-01-B', qty: 4,  picked: false, pickedAt: null    },
      { id: 'PK-005', sku: 'DAI-MILK-02',  desc: 'Whole Milk (1 gal case)',      bin: 'CLR-03-A', qty: 24, picked: false, pickedAt: null    },
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
  { id: 'CC-001', bin: 'A-04-C',   sku: 'SKU-1042',    desc: 'Roma Tomatoes (25 lb case)',  zone: 'Dry Storage',    expectedQty: 45, countedQty: null, status: 'assigned',    assignedTo: 'Marcus T.' },
  { id: 'CC-002', bin: 'B-02-A',   sku: 'SKU-1055',    desc: 'Jalapeños (10 lb bag)',        zone: 'Produce Cooler', expectedQty: 28, countedQty: 26,   status: 'discrepancy', assignedTo: 'Devon L.'  },
  { id: 'CC-003', bin: 'FRZ-02-B', sku: 'FRZ-SALM-01', desc: 'Salmon Fillet (10 lb vac)',   zone: 'Freezer',        expectedQty: 12, countedQty: 12,   status: 'complete',    assignedTo: 'Sarah K.'  },
  { id: 'CC-004', bin: 'CLR-03-A', sku: 'DAI-MILK-02', desc: 'Whole Milk (1 gal case)',     zone: 'Dairy Cooler',   expectedQty: 80, countedQty: null, status: 'pending',     assignedTo: null        },
];

// ─── ScannerInput — real HID + camera barcode scanner ────────────────────────
// HID scanners: just point the scanner at a barcode while the input is focused.
// The scanner types the barcode value followed by Enter, which triggers onScanned.
// Camera: uses the BarcodeDetector API (Chrome/Android) with getUserMedia.
// If expectedBarcode is set, the scanned value is validated against it.
function ScannerInput({ label, expectedBarcode, onScanned, active = true, hint }) {
  const inputRef    = useRef(null);
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const animRef     = useRef(null);

  // Keep always-current references to props so the camera scan loop never
  // closes over stale values without needing to restart.
  const propsRef = useRef({ expectedBarcode, onScanned });
  propsRef.current = { expectedBarcode, onScanned };

  const [inputVal,   setInputVal  ] = useState('');
  const [mode,       setMode      ] = useState('input'); // 'input' | 'camera'
  const [camActive,  setCamActive ] = useState(false);
  const [scanError,  setScanError ] = useState('');
  const [lastOk,     setLastOk    ] = useState('');

  const camSupported =
    typeof window !== 'undefined' &&
    'BarcodeDetector' in window &&
    !!navigator.mediaDevices;

  // Auto-focus the text input whenever this scanner is the active step
  useEffect(() => {
    if (active && mode === 'input') inputRef.current?.focus();
  }, [active, mode]);

  // Tear down camera on unmount
  useEffect(() => () => stopCam(), []);

  // ── internal helpers ───────────────────────────────────────────────────────
  const processValue = (raw) => {
    const v = (raw || '').trim();
    if (!v) return;
    const { expectedBarcode: eb, onScanned: os } = propsRef.current;
    if (eb && v !== eb) {
      setScanError(`Wrong item — expected barcode …${eb.slice(-4)}`);
      setLastOk('');
      setTimeout(() => setScanError(''), 3500);
      return;
    }
    setScanError('');
    setLastOk(v);
    setInputVal('');
    os(v);
  };

  const stopCam = () => {
    if (animRef.current)   { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCamActive(false);
  };

  const startCam = async () => {
    setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      setCamActive(true);
      setMode('camera');
    } catch {
      setScanError('Camera unavailable — use HID scanner or type barcode manually');
      setTimeout(() => setScanError(''), 4000);
    }
  };

  // Start BarcodeDetector scan loop once camera stream is ready
  useEffect(() => {
    if (!(mode === 'camera' && camActive && streamRef.current)) return;
    if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }

    let cancelled = false;
    let detector;
    try {
      detector = new BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e', 'itf'],
      });
    } catch {
      setScanError('Barcode detector unavailable on this device');
      stopCam();
      setMode('input');
      return;
    }

    const scan = async () => {
      if (cancelled || !streamRef.current || !videoRef.current) return;
      try {
        const results = await detector.detect(videoRef.current);
        if (!cancelled && results.length > 0) {
          const val = results[0].rawValue;
          stopCam();
          setMode('input');
          processValue(val); // uses propsRef — always current
          return;
        }
      } catch { /* video not ready yet, retry */ }
      if (!cancelled) animRef.current = requestAnimationFrame(scan);
    };
    animRef.current = requestAnimationFrame(scan);
    return () => { cancelled = true; };
  }, [mode, camActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#080e18',
      border: `1px solid ${scanError ? 'rgba(244,63,94,.35)' : active ? 'rgba(59,130,246,.25)' : '#1f2937'}`,
      borderRadius: 10, padding: '12px 14px',
    }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
          {label}
        </div>
      )}

      {mode === 'camera' && camActive ? (
        <div>
          <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#000', minHeight: 150, marginBottom: 8 }}>
            <video ref={videoRef} playsInline muted style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
            {/* scan-line overlay */}
            <div style={{ position: 'absolute', top: '50%', left: '8%', right: '8%', height: 2, background: 'rgba(96,165,250,.85)', boxShadow: '0 0 8px 2px rgba(96,165,250,.5)', pointerEvents: 'none' }} />
          </div>
          <button onClick={() => { stopCam(); setMode('input'); }}
            style={{ width: '100%', background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.25)', color: '#fb7185', borderRadius: 8, padding: '7px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <CameraOff size={12} /> Stop Camera
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: (lastOk || camSupported) ? 7 : 0 }}>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); processValue(inputVal); } }}
              placeholder={hint || (expectedBarcode ? `Scan item (…${expectedBarcode.slice(-4)})` : 'Scan or type barcode…')}
              autoComplete="off"
              spellCheck="false"
              style={{ flex: 1, background: '#0a0f1a', border: `1px solid ${active ? 'rgba(59,130,246,.35)' : '#374151'}`, borderRadius: 8, padding: '8px 12px', color: '#f1f5f9', fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
            />
            <button onClick={() => processValue(inputVal)} title="Submit scan"
              style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ScanBarcode size={14} />
            </button>
          </div>

          {lastOk && (
            <div style={{ fontSize: 10, color: '#34d399', fontFamily: 'monospace', marginBottom: 7, padding: '3px 8px', background: 'rgba(52,211,153,.08)', borderRadius: 4 }}>
              ✓ {lastOk.length > 26 ? `…${lastOk.slice(-22)}` : lastOk}
            </div>
          )}

          {camSupported && (
            <button onClick={startCam}
              style={{ width: '100%', background: 'rgba(167,139,250,.07)', border: '1px solid rgba(167,139,250,.2)', color: '#a78bfa', borderRadius: 8, padding: '6px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Camera size={12} /> Use Camera
            </button>
          )}
        </>
      )}

      {scanError && (
        <div style={{ marginTop: 8, padding: '5px 9px', background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.2)', borderRadius: 6, fontSize: 11, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertTriangle size={10} /> {scanError}
        </div>
      )}
    </div>
  );
}

// ─── New Receive Task Modal ───────────────────────────────────────────────────
function NewReceiveTaskModal({ onSave, onClose }) {
  const [po,          setPo         ] = useState('');
  const [supplier,    setSupplier   ] = useState('');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([
    { id: 'nl-1', sku: '', desc: '', expectedQty: '', uom: 'case', barcode: '', lot: '' },
  ]);

  const addLine = () =>
    setLines(p => [...p, { id: `nl-${Date.now()}`, sku: '', desc: '', expectedQty: '', uom: 'case', barcode: '', lot: '' }]);

  const removeLine = (id) => setLines(p => p.filter(l => l.id !== id));

  const upd = (id, field, val) =>
    setLines(p => p.map(l => l.id === id ? { ...l, [field]: val } : l));

  const canSave = po.trim() && supplier.trim() && arrivalDate &&
    lines.some(l => l.sku.trim() && l.desc.trim() && l.expectedQty);

  const handleSave = () => {
    if (!canSave) return;
    const now = Date.now();
    onSave({
      id: `RT-${now}`,
      poId: po.trim(),
      supplier: supplier.trim(),
      arrivalDate,
      status: 'pending',
      lines: lines
        .filter(l => l.sku.trim() && l.desc.trim() && l.expectedQty)
        .map((l, i) => ({
          id: `RL-${now}-${i}`,
          sku: l.sku.trim(),
          desc: l.desc.trim(),
          expectedQty: parseInt(l.expectedQty, 10) || 0,
          receivedQty: 0,
          uom: l.uom,
          barcode: l.barcode.trim(),
          lot: l.lot.trim(),
          status: 'pending',
        })),
    });
  };

  const inp = { background: '#0a0f1a', border: '1px solid #374151', borderRadius: 8, padding: '7px 11px', color: '#f1f5f9', fontSize: 12, width: '100%', outline: 'none' };
  const lbl = { fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 14, width: '100%', maxWidth: 660, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>New Receive Task</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 2, display: 'flex' }}><X size={17} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', overflow: 'auto', flex: 1 }}>
          {/* Header fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div><label style={lbl}>PO Number *</label><input value={po} onChange={e => setPo(e.target.value)} placeholder="PO-5000" style={inp} /></div>
            <div><label style={lbl}>Supplier *</label><input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" style={inp} /></div>
            <div><label style={lbl}>Arrival Date *</label><input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} style={inp} /></div>
          </div>

          {/* Lines */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.06em' }}>Line Items</div>
            <button onClick={addLine} style={{ background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.25)', color: '#34d399', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={11} /> Add Line
            </button>
          </div>

          {lines.map((line, idx) => (
            <div key={line.id} style={{ background: '#080e18', border: '1px solid #1f2937', borderRadius: 10, padding: '11px 13px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4b5563' }}>LINE {idx + 1}</span>
                {lines.length > 1 && (
                  <button onClick={() => removeLine(line.id)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 2, display: 'flex' }}><Trash2 size={12} /></button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8 }}>
                <div><label style={lbl}>SKU *</label><input value={line.sku} onChange={e => upd(line.id, 'sku', e.target.value)} placeholder="SKU-0000" style={inp} /></div>
                <div><label style={lbl}>Description *</label><input value={line.desc} onChange={e => upd(line.id, 'desc', e.target.value)} placeholder="Item description" style={inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr', gap: 8 }}>
                <div>
                  <label style={lbl}>Exp. Qty *</label>
                  <input type="number" min="0" value={line.expectedQty} onChange={e => upd(line.id, 'expectedQty', e.target.value)} placeholder="0" style={inp} />
                </div>
                <div>
                  <label style={lbl}>UOM</label>
                  <select value={line.uom} onChange={e => upd(line.id, 'uom', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    {['case', 'bag', 'pack', 'pallet', 'each', 'box', 'drum'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Barcode</label><input value={line.barcode} onChange={e => upd(line.id, 'barcode', e.target.value)} placeholder="Scan or enter barcode" style={inp} /></div>
                <div><label style={lbl}>Lot #</label><input value={line.lot} onChange={e => upd(line.id, 'lot', e.target.value)} placeholder="LOT-" style={inp} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'rgba(113,113,122,.1)', border: '1px solid rgba(113,113,122,.25)', color: '#9ca3af', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave}
            style={{ background: canSave ? 'rgba(59,130,246,.2)' : 'rgba(59,130,246,.05)', border: '1px solid rgba(59,130,246,.3)', color: canSave ? '#60a5fa' : '#374151', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: canSave ? 'pointer' : 'default' }}>
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
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
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: `1px solid ${m.border}`, background: m.bg, color: m.color, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.ok ? 'rgba(52,211,153,.15)' : 'rgba(244,63,94,.15)', border: `1px solid ${toast.ok ? 'rgba(52,211,153,.3)' : 'rgba(244,63,94,.3)'}`, color: toast.ok ? '#34d399' : '#fb7185', padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
      {toast.msg}
    </div>
  );
}

// ─── Receive Tab ──────────────────────────────────────────────────────────────
function ReceiveTab({ tasks, setTasks, can }) {
  const [selId,          setSelId         ] = useState('RT-002');
  const [activeScanLine, setActiveScanLine] = useState(null);
  const [showNewTask,    setShowNewTask   ] = useState(false);
  const [toast,          setToast         ] = useState(null);

  const task = tasks.find(t => t.id === selId);

  // Clear active scan when user switches task
  useEffect(() => setActiveScanLine(null), [selId]);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScan = (lineId) => {
    setActiveScanLine(null);
    setTasks(prev => prev.map(t => {
      if (t.id !== selId) return t;
      const lines = t.lines.map(l =>
        l.id !== lineId ? l : { ...l, receivedQty: l.expectedQty, status: 'complete' }
      );
      const allDone = lines.every(l => l.status === 'complete');
      return { ...t, lines, status: allDone ? 'complete' : 'in_progress' };
    }));
    notify('Line received ✓');
  };

  const handleNewTask = (task) => {
    setTasks(prev => [task, ...prev]);
    setSelId(task.id);
    setShowNewTask(false);
    notify('Receive task created ✓');
  };

  const pending    = tasks.filter(t => t.status !== 'complete').length;
  const totalLines = tasks.reduce((a, t) => a + t.lines.length, 0);
  const doneLines  = tasks.reduce((a, t) => a + t.lines.filter(l => l.status === 'complete').length, 0);

  return (
    <div>
      <Toast toast={toast} />
      {showNewTask && <NewReceiveTaskModal onSave={handleNewTask} onClose={() => setShowNewTask(false)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, flex: 1, marginRight: 14 }}>
          <KpiCard label="Pending Tasks"   value={pending}                                               color="#fbbf24" />
          <KpiCard label="Active Tasks"    value={tasks.filter(t => t.status === 'in_progress').length}  color="#60a5fa" />
          <KpiCard label="Lines Received"  value={`${doneLines}/${totalLines}`}                          color="#34d399" />
          <KpiCard label="Completed Today" value={tasks.filter(t => t.status === 'complete').length}     color="#a78bfa" />
        </div>
        <button onClick={() => setShowNewTask(true)}
          style={{ background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.3)', color: '#34d399', borderRadius: 9, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Plus size={13} /> New Task
        </button>
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
              <React.Fragment key={line.id}>
                {/* Line row */}
                <div style={{ padding: '11px 16px', borderBottom: activeScanLine === line.id ? 'none' : '1px solid #0f1622', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: line.status === 'complete' ? 'rgba(52,211,153,.15)' : 'rgba(113,113,122,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {line.status === 'complete' ? <Check size={14} color="#34d399" /> : <Barcode size={14} color="#6b7280" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{line.sku}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{line.desc}</div>
                    <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                      Lot: {line.lot || '—'}{line.barcode ? ` · Barcode: …${line.barcode.slice(-6)}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: line.status === 'complete' ? '#34d399' : '#f1f5f9' }}>
                      {line.receivedQty} <span style={{ color: '#4b5563', fontWeight: 400 }}>/ {line.expectedQty}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{line.uom}</div>
                  </div>
                  {line.status !== 'complete' && can('warehouse') ? (
                    <button
                      onClick={() => setActiveScanLine(activeScanLine === line.id ? null : line.id)}
                      style={{ background: activeScanLine === line.id ? 'rgba(244,63,94,.12)' : 'rgba(59,130,246,.15)', border: `1px solid ${activeScanLine === line.id ? 'rgba(244,63,94,.3)' : 'rgba(59,130,246,.3)'}`, color: activeScanLine === line.id ? '#fb7185' : '#60a5fa', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {activeScanLine === line.id ? <><X size={11} /> Cancel</> : <><ScanBarcode size={11} /> Scan</>}
                    </button>
                  ) : (
                    <StatusPill status={line.status} />
                  )}
                </div>

                {/* Inline scanner — expands below the line row */}
                {activeScanLine === line.id && (
                  <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid #0f1622', background: 'rgba(59,130,246,.02)' }}>
                    <ScannerInput
                      label={`${line.sku} — ${line.desc}`}
                      expectedBarcode={line.barcode || undefined}
                      onScanned={() => handleScan(line.id)}
                      active={true}
                      hint={line.barcode ? undefined : 'Scan item barcode'}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>
            Select a task to begin receiving
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Putaway Tab ──────────────────────────────────────────────────────────────
function PutawayTab({ tasks, setTasks, can }) {
  const [selId,    setSelId   ] = useState('PA-001');
  const [scanStep, setScanStep] = useState('idle'); // idle | bin_scan
  const [toast,    setToast   ] = useState(null);

  const task = tasks.find(t => t.id === selId);

  useEffect(() => setScanStep('idle'), [selId]);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScanItem = () => {
    // Item barcode validated by ScannerInput — advance to bin step
    setScanStep('bin_scan');
  };

  const handleScanBin = () => {
    // Bin label validated by ScannerInput — complete putaway
    setScanStep('idle');
    setTasks(prev => prev.map(t => t.id === selId ? { ...t, status: 'complete' } : t));
    notify('Putaway confirmed ✓');
    const nextPending = tasks.find(t => t.id !== selId && t.status !== 'complete');
    if (nextPending) setSelId(nextPending.id);
  };

  const assigned = tasks.filter(t => t.status === 'assigned').length;
  const done     = tasks.filter(t => t.status === 'complete').length;

  return (
    <div>
      <Toast toast={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Assigned Tasks" value={assigned}                                          color="#60a5fa" />
        <KpiCard label="Pending Tasks"  value={tasks.filter(t => t.status === 'pending').length}  color="#fbbf24" />
        <KpiCard label="Completed"      value={done}                                              color="#34d399" />
        <KpiCard label="Total Units"    value={tasks.reduce((a, t) => a + t.qty, 0).toLocaleString()} color="#a78bfa" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        {/* Task list */}
        <div>
          {tasks.map(t => (
            <div key={t.id} onClick={() => setSelId(t.id)}
              style={{ background: selId === t.id ? 'rgba(59,130,246,.06)' : '#0d1117', border: `1px solid ${selId === t.id ? 'rgba(59,130,246,.35)' : '#1f2937'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{t.id}</span>
                <StatusPill status={t.status} />
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, fontSize: 11, color: '#6b7280' }}>
                <span style={{ fontWeight: 700, color: '#fbbf24' }}>{t.qty}</span>
                <span>units</span>
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
            {/* Task info */}
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '13px 16px', marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'SKU',      value: task.sku                  },
                  { label: 'Lot',      value: task.lot                  },
                  { label: 'Qty',      value: task.qty                  },
                  { label: 'Zone',     value: task.zone                 },
                  { label: 'From',     value: task.from                 },
                  { label: 'Assigned', value: task.assignedTo || 'Unassigned' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 1 }}>{f.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d1d5db' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#080e18', borderRadius: 8 }}>
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
            ) : can('warehouse') ? (
              <>
                {/* Step 1 */}
                <div style={{ background: '#0d1117', border: `1px solid ${scanStep === 'bin_scan' ? '#1f2937' : 'rgba(59,130,246,.3)'}`, borderRadius: 10, padding: '13px 16px', marginBottom: 10, opacity: scanStep === 'bin_scan' ? 0.45 : 1, pointerEvents: scanStep === 'bin_scan' ? 'none' : 'auto' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: scanStep === 'idle' ? 'rgba(59,130,246,.2)' : 'rgba(52,211,153,.2)', color: scanStep === 'idle' ? '#60a5fa' : '#34d399', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {scanStep === 'bin_scan' ? <Check size={10} /> : '1'}
                    </span>
                    Scan Item Barcode
                  </div>
                  <ScannerInput
                    label={task.desc}
                    expectedBarcode={task.barcode || undefined}
                    onScanned={handleScanItem}
                    active={scanStep === 'idle'}
                  />
                </div>

                {/* Step 2 */}
                <div style={{ background: '#0d1117', border: `1px solid ${scanStep === 'bin_scan' ? 'rgba(59,130,246,.3)' : '#1f2937'}`, borderRadius: 10, padding: '13px 16px', opacity: scanStep === 'idle' ? 0.45 : 1, pointerEvents: scanStep === 'idle' ? 'none' : 'auto' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: scanStep === 'bin_scan' ? 'rgba(59,130,246,.2)' : 'rgba(113,113,122,.1)', color: scanStep === 'bin_scan' ? '#60a5fa' : '#6b7280', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                    Scan Destination Bin
                  </div>
                  <ScannerInput
                    label={`Bin: ${task.to}`}
                    expectedBarcode={task.to}
                    onScanned={handleScanBin}
                    active={scanStep === 'bin_scan'}
                    hint={`Scan bin label (${task.to})`}
                  />
                </div>
              </>
            ) : (
              <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 12 }}>
                Warehouse access required to perform putaway
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>
            Select a putaway task
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pick Tab ─────────────────────────────────────────────────────────────────
function PickTab({ waves, setWaves, can }) {
  const [selId,          setSelId         ] = useState('WV-2026-089');
  const [activeScanPick, setActiveScanPick] = useState(null);
  const [toast,          setToast         ] = useState(null);

  const wave = waves.find(w => w.id === selId);

  useEffect(() => setActiveScanPick(null), [selId]);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScanPick = (pickId) => {
    setActiveScanPick(null);
    setWaves(prev => prev.map(w => {
      if (w.id !== selId) return w;
      const now  = new Date().toTimeString().slice(0, 5);
      const picks = w.picks.map(p => p.id !== pickId ? p : { ...p, picked: true, pickedAt: now });
      const allPicked = picks.every(p => p.picked);
      return { ...w, picks, status: allPicked ? 'complete' : 'in_progress', completedAt: allPicked ? now : w.completedAt };
    }));
    notify('Pick confirmed ✓');
  };

  const inProgressWaves = waves.filter(w => w.status === 'in_progress').length;
  const totalPicks      = waves.reduce((a, w) => a + w.picks.length, 0);
  const donePicks       = waves.reduce((a, w) => a + w.picks.filter(p => p.picked).length, 0);
  const pendingWaves    = waves.filter(w => w.status === 'pending').length;
  const wavePicks       = wave?.picks || [];
  const wavePicksDone   = wavePicks.filter(p => p.picked).length;
  const nextPick        = wavePicks.find(p => !p.picked);

  return (
    <div>
      <Toast toast={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Active Waves"    value={inProgressWaves} color="#fbbf24" />
        <KpiCard label="Pending Waves"   value={pendingWaves}    color="#60a5fa" />
        <KpiCard label="Picks Complete"  value={`${donePicks}/${totalPicks}`} color="#34d399" />
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
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    {wave.soId} · {wavePicksDone}/{wavePicks.length} picks done{wave.startedAt ? ` · Started ${wave.startedAt}` : ''}
                  </div>
                </div>
                <StatusPill status={wave.status} />
              </div>

              {wavePicks.map(pick => (
                <React.Fragment key={pick.id}>
                  <div style={{ padding: '10px 14px', borderBottom: activeScanPick === pick.id ? 'none' : '1px solid #0f1622', display: 'flex', gap: 12, alignItems: 'center', background: nextPick?.id === pick.id ? 'rgba(59,130,246,.03)' : 'transparent' }}>
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
                    <div style={{ flexShrink: 0, minWidth: 82, textAlign: 'right' }}>
                      {pick.picked ? (
                        <span style={{ fontSize: 10, color: '#34d399' }}>✓ {pick.pickedAt}</span>
                      ) : wave.status !== 'pending' && can('warehouse') ? (
                        <button
                          onClick={() => setActiveScanPick(activeScanPick === pick.id ? null : pick.id)}
                          style={{ background: activeScanPick === pick.id ? 'rgba(244,63,94,.12)' : 'rgba(59,130,246,.15)', border: `1px solid ${activeScanPick === pick.id ? 'rgba(244,63,94,.3)' : 'rgba(59,130,246,.3)'}`, color: activeScanPick === pick.id ? '#fb7185' : '#60a5fa', borderRadius: 7, padding: '5px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {activeScanPick === pick.id ? <><X size={10} /> Cancel</> : <><ScanBarcode size={11} /> Scan</>}
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, color: '#4b5563' }}>Queued</span>
                      )}
                    </div>
                  </div>

                  {/* Inline scanner */}
                  {activeScanPick === pick.id && (
                    <div style={{ padding: '0 14px 12px', borderBottom: '1px solid #0f1622', background: 'rgba(59,130,246,.02)' }}>
                      <ScannerInput
                        label={`${pick.sku} at bin ${pick.bin} — qty ${pick.qty}`}
                        onScanned={() => handleScanPick(pick.id)}
                        active={true}
                        hint="Scan item barcode to confirm pick"
                      />
                    </div>
                  )}
                </React.Fragment>
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
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>
            Select a wave to begin picking
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cycle Count Tab ──────────────────────────────────────────────────────────
function CycleCountTab({ counts, setCounts, can }) {
  const [selId,      setSelId     ] = useState('CC-002');
  const [inputQty,   setInputQty  ] = useState('');
  const [binScanned, setBinScanned] = useState(false);
  const [toast,      setToast     ] = useState(null);

  const count = counts.find(c => c.id === selId);

  useEffect(() => { setInputQty(''); setBinScanned(false); }, [selId]);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  const handleScanBin = () => {
    setBinScanned(true);
    notify(`Bin ${count.bin} confirmed ✓`);
  };

  const handleSubmitCount = () => {
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || qty < 0) { notify('Enter a valid quantity', false); return; }
    const disc   = qty - count.expectedQty;
    const status = disc === 0 ? 'complete' : 'discrepancy';
    setCounts(prev => prev.map(c => c.id === selId ? { ...c, countedQty: qty, discrepancy: disc, status } : c));
    setInputQty('');
    notify(disc === 0 ? 'Count matches expected ✓' : `Discrepancy: ${disc > 0 ? '+' : ''}${disc} units`, disc === 0);
  };

  const assigned = counts.filter(c => c.status === 'assigned').length;
  const discr    = counts.filter(c => c.status === 'discrepancy').length;
  const done     = counts.filter(c => c.status === 'complete').length;

  return (
    <div>
      <Toast toast={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
        <KpiCard label="Assigned Tasks" value={assigned} color="#60a5fa" />
        <KpiCard label="Discrepancies"  value={discr}    color="#fb7185" sub="Require review" />
        <KpiCard label="Completed"      value={done}     color="#34d399" />
        <KpiCard label="Pending"        value={counts.filter(c => c.status === 'pending').length} color="#9ca3af" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        {/* Count list */}
        <div>
          {counts.map(c => (
            <div key={c.id} onClick={() => setSelId(c.id)}
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
                <span style={{ fontSize: 10, color: '#6b7280' }}>Exp: {c.expectedQty}{c.countedQty !== null ? ` · Got: ${c.countedQty}` : ''}</span>
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
            {/* Count info */}
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'Bin',         value: count.bin                  },
                  { label: 'Zone',        value: count.zone                 },
                  { label: 'SKU',         value: count.sku                  },
                  { label: 'Assigned To', value: count.assignedTo || 'Unassigned' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 1 }}>{f.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d1d5db' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{count.desc}</div>
            </div>

            {/* Bin scanner */}
            {!binScanned && (
              <div style={{ marginBottom: 12 }}>
                <ScannerInput
                  label={`Step 1 — Scan bin ${count.bin}`}
                  expectedBarcode={count.bin}
                  onScanned={handleScanBin}
                  active={!binScanned}
                  hint={`Scan bin label (${count.bin})`}
                />
              </div>
            )}

            {binScanned && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 8, fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={13} /> Bin {count.bin} confirmed
              </div>
            )}

            {/* Count result / entry */}
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
              <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px', opacity: binScanned ? 1 : 0.5, pointerEvents: binScanned ? 'auto' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
                  Step 2 — Enter Counted Quantity
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>Expected: {count.expectedQty}</div>
                    <input type="number" min="0" value={inputQty} onChange={e => setInputQty(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmitCount()}
                      placeholder="0"
                      style={{ background: '#0a0f1a', border: '1px solid #374151', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 18, fontWeight: 700, width: '100%', textAlign: 'center', outline: 'none' }} />
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
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: '#374151', fontSize: 13 }}>
            Select a count task
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MobileWMSModule() {
  const { can } = useKernal();
  const [tab, setTab] = useState('receive');

  // ── State with localStorage persistence (production only) ──────────────────
  const [receiveTasks, setReceiveTasks] = useState(() => {
    if (DEMO_MODE) return INIT_RECEIVE_TASKS;
    try { const s = localStorage.getItem('kernel_wms_receive'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [putawayTasks, setPutawayTasks] = useState(() => {
    if (DEMO_MODE) return INIT_PUTAWAY_TASKS;
    try { const s = localStorage.getItem('kernel_wms_putaway'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [waves, setWaves] = useState(() => {
    if (DEMO_MODE) return INIT_WAVES;
    try { const s = localStorage.getItem('kernel_wms_waves'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  const [cycleCounts, setCycleCounts] = useState(() => {
    if (DEMO_MODE) return INIT_CYCLE_COUNTS;
    try { const s = localStorage.getItem('kernel_wms_cycle'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });

  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('kernel_wms_receive', JSON.stringify(receiveTasks)); }, [receiveTasks]);
  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('kernel_wms_putaway', JSON.stringify(putawayTasks)); }, [putawayTasks]);
  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('kernel_wms_waves',   JSON.stringify(waves));        }, [waves]);
  useEffect(() => { if (!DEMO_MODE) localStorage.setItem('kernel_wms_cycle',   JSON.stringify(cycleCounts));  }, [cycleCounts]);

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs = [
    { id: 'receive', label: 'Receive',     Icon: PackageCheck  },
    { id: 'putaway', label: 'Putaway',     Icon: MoveRight     },
    { id: 'pick',    label: 'Pick',        Icon: ScanBarcode   },
    { id: 'cycle',   label: 'Cycle Count', Icon: ClipboardList },
  ];

  const badges = {
    receive: receiveTasks.filter(t => t.status !== 'complete').length,
    putaway: putawayTasks.filter(t => t.status === 'assigned').length,
    pick:    waves.filter(w => w.status === 'in_progress').length,
    cycle:   cycleCounts.filter(c => c.status === 'assigned' || c.status === 'discrepancy').length,
  };

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
          Warehouse associate workflows — scan-to-receive inbound POs, scan-to-bin putaway, wave picking, and cycle counts.
          {' '}Supports HID barcode scanners (scan into any active input) and camera scanning on Android/Chrome.
        </p>
      </div>

      {/* Tabs */}
      <div id="kernal-module-tabs" style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid #1f2937', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #60a5fa' : '2px solid transparent', color: tab === t.id ? '#60a5fa' : '#6b7280', padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1, transition: 'color .15s', position: 'relative' }}>
            <t.Icon size={13} /> {t.label}
            {badges[t.id] > 0 && (
              <span style={{ fontSize: 9, fontWeight: 800, background: tab === t.id ? '#60a5fa' : '#374151', color: tab === t.id ? '#030712' : '#9ca3af', padding: '1px 5px', borderRadius: 99, minWidth: 16, textAlign: 'center' }}>
                {badges[t.id]}
              </span>
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
