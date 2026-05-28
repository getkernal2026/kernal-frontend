import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useKernal, LOCATIONS } from './KernalContext.jsx';
import { MOCK_INVENTORY } from './shared/mockInventory.js';
import { UI } from './ui.js';

import { TODAY, StatusBadge, PrintButton, ExportButton } from './shared/components.jsx';
import AttachmentsPanel from './shared/AttachmentsPanel.jsx';
import RecordHistory from './shared/RecordHistory.jsx';
import { ALLERGEN_DATA, BIG_9 } from './shared/allergenData.js';
import { DEMO_MODE } from './lib/demoMode.js';
import { api } from './lib/api.js';

import {
  Search, Plus, Package, AlertCircle, Check,
  X, CheckCircle2, Box, Truck, Barcode, Save, XCircle,
  MapPin, ArrowRight, Calendar, TrendingUp, ShieldCheck,
  Lock, Activity, SplitSquareHorizontal, Edit, Trash2,
  Brain, LineChart, AlertTriangle, TrendingDown, ChevronUp,
  ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  Thermometer, Weight, Clock, ShoppingCart, BarChart2, Zap, FileText,
  AlertOctagon, Phone, Mail, CheckCircle, Download, Radio,
  ClipboardList, Siren, FileWarning, Users,
  RefreshCw, ShoppingBag, Gauge, ExternalLink, BookOpen, Paperclip,
  Bell, Tag, Send, ArrowRightLeft, PackageCheck, MoveRight,
} from 'lucide-react';

// Local copy avoids Rolldown IIFE ordering / TDZ issue
const COMPANY_INFO = {
  name:     'Kernel Food Distribution LLC',
  address:  '1800 Commerce Pkwy, Suite A',
  city:     'New Orleans, LA 70123',
  phone:    '(504) 555-9100',
  email:    'purchasing@kernaldist.com',
  taxId:    '72-1234567',
  fdaRegId: 'FD-2026-KFD-001',
};

// ─────────────────────────────────────────────
// KERNAL DESIGN SYSTEM — UI_CLASSES
// All Tailwind tokens live here. Never scatter
// colour classes directly in JSX.
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// CORRECTED MOCK DATA
// Schema: item-level isCatchWeight + minShelfLifeDays
//         lot-level receivedDate, supplierId, receivedTemp,
//                   qcHoldReason, qcHoldDate, cost, actualWeight
// ─────────────────────────────────────────────
const initialMockData = [
  {
    id: 1, sku: 'DRY-RICE-05', vendorId: 'V-004', vendorProductCode: 'MDG-RCE-JAS-PLT', barcode: '002233445566',
    name: 'Jasmine Rice 50lb (Pallet)', category: 'dry goods',
    uom: 'pallet', isCatchWeight: false, minShelfLifeDays: 180,
    splitQty: 40, childSku: 'DRY-RICE-05-BAG',
    price: 1200.00, reorder: 10, velocity: 'Low', location: 'Z-99',
    predictedDemand: 8, trend: 'stable',
    lots: [{ lotId: 'LOT-C', qty: 5, actualWeight: null, expiry: '2027-12-01', receivedDate: '2026-01-10T08:00:00Z', supplierId: 'SUP-001', receivedTemp: null, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 950.00 }],
  },
  {
    id: 2, sku: 'DRY-RICE-05-BAG', vendorId: 'V-004', vendorProductCode: 'MDG-RCE-JAS-BAG', barcode: '002233445566-B',
    name: 'Jasmine Rice 50lb (Bag)', category: 'dry goods',
    uom: 'bag', isCatchWeight: false, minShelfLifeDays: 180,
    splitQty: null, childSku: null,
    price: 35.00, reorder: 20, velocity: 'High', location: 'A-01',
    predictedDemand: 45, trend: 'up',
    lots: [{ lotId: 'LOT-C-SPLIT', qty: 15, actualWeight: null, expiry: '2027-12-01', receivedDate: '2026-01-10T09:30:00Z', supplierId: 'SUP-001', receivedTemp: null, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 23.75 }],
  },
  {
    id: 3, sku: 'FRZ-BEEF-01', vendorId: 'V-001', vendorProductCode: 'GCP-BEEF-8020', barcode: '001122334455',
    name: 'Premium Ground Beef 80/20', category: 'meat',
    uom: 'case', isCatchWeight: true, minShelfLifeDays: 14,
    splitQty: null, childSku: null,
    price: 85.50, reorder: 20, velocity: 'High', location: 'A-12',
    predictedDemand: 85, trend: 'up', seasonalityInsight: 'Memorial Day BBQ Spike (+40%)',
    lots: [
      { lotId: 'LOT-A-URGENT', qty: 6, actualWeight: 124.5, expiry: '2026-05-26', receivedDate: '2026-05-24T07:00:00Z', supplierId: 'SUP-002', receivedTemp: 34, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 65.00 },
      { lotId: 'LOT-A', qty: 20, actualWeight: 412.5, expiry: '2026-06-15', receivedDate: '2026-05-01T07:00:00Z', supplierId: 'SUP-002', receivedTemp: 34, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 65.00 },
      { lotId: 'LOT-B', qty: 25, actualWeight: 518.0, expiry: '2026-07-01', receivedDate: '2026-05-08T07:00:00Z', supplierId: 'SUP-002', receivedTemp: 35, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 67.50 },
    ],
  },
  {
    id: 4, sku: 'PRO-TOMA-01', vendorId: 'V-002', vendorProductCode: 'SPC-TOM-RMA', barcode: '003344556677',
    name: 'Roma Tomatoes', category: 'produce',
    uom: 'case', isCatchWeight: false, minShelfLifeDays: 7,
    splitQty: null, childSku: null,
    price: 24.00, reorder: 15, velocity: 'High', location: 'Cooler-1',
    predictedDemand: 18, trend: 'down',
    lots: [
      { lotId: 'LOT-D-CRITICAL', qty: 18, actualWeight: null, expiry: '2026-05-28', receivedDate: '2026-05-21T06:00:00Z', supplierId: 'SUP-003', receivedTemp: 37, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 15.50 },
      { lotId: 'LOT-D', qty: 12, actualWeight: null, expiry: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], receivedDate: '2026-05-18T06:00:00Z', supplierId: 'SUP-003', receivedTemp: 38, qcHold: true, qcHoldReason: 'Temperature excursion at receiving', qcHoldDate: '2026-05-18T06:45:00Z', cost: 15.50 },
    ],
  },
  {
    id: 5, sku: 'DAI-MILK-02', vendorId: 'V-003', vendorProductCode: 'DFD-MLK-WHL', barcode: '004455667788',
    name: 'Whole Milk 1 Gal (4pk)', category: 'dairy',
    uom: 'case', isCatchWeight: false, minShelfLifeDays: 10,
    splitQty: null, childSku: null,
    price: 18.00, reorder: 30, velocity: 'High', location: 'Truck-04',
    predictedDemand: 40, trend: 'stable',
    lots: [
      { lotId: 'LOT-E-WARN', qty: 10, actualWeight: null, expiry: '2026-05-31', receivedDate: '2026-05-22T05:30:00Z', supplierId: 'SUP-004', receivedTemp: 36, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 12.00 },
      { lotId: 'LOT-E', qty: 8, actualWeight: null, expiry: '2026-06-05', receivedDate: '2026-05-20T05:30:00Z', supplierId: 'SUP-004', receivedTemp: 36, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 12.00 },
    ],
  },
  {
    id: 6, sku: 'SUP-CUP-16', vendorId: 'V-004', vendorProductCode: 'MDG-CUP-16Z', barcode: '005566778899',
    name: '16oz Clear Plastic Cups', category: 'supplies',
    uom: 'case', isCatchWeight: false, minShelfLifeDays: 0,
    splitQty: null, childSku: null,
    price: 45.00, reorder: 50, velocity: 'Medium', location: 'D-09',
    predictedDemand: 250, trend: 'up', seasonalityInsight: 'Summer Event Season',
    lots: [{ lotId: 'LOT-F', qty: 150, actualWeight: null, expiry: '', receivedDate: '2026-03-01T08:00:00Z', supplierId: 'SUP-005', receivedTemp: null, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 28.00 }],
  },
  {
    id: 7, sku: 'FRZ-SALM-01', vendorId: 'V-001', vendorProductCode: 'GCP-SALM-ATC', barcode: '009988776655',
    name: 'Atlantic Salmon Portions 6oz', category: 'seafood',
    uom: 'case', isCatchWeight: true, minShelfLifeDays: 10,
    splitQty: null, childSku: null,
    price: 145.00, reorder: 8, velocity: 'Medium', location: 'FRZ-A-02-1',
    predictedDemand: 12, trend: 'stable',
    lots: [
      { lotId: 'LOT-G-CRITICAL', qty: 14, actualWeight: 252.0, expiry: '2026-05-27', receivedDate: '2026-05-22T07:00:00Z', supplierId: 'SUP-002', receivedTemp: 32, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 110.00 },
      { lotId: 'LOT-G2', qty: 20, actualWeight: 360.0, expiry: '2026-06-20', receivedDate: '2026-05-23T07:00:00Z', supplierId: 'SUP-002', receivedTemp: 32, qcHold: false, qcHoldReason: null, qcHoldDate: null, cost: 110.00 },
    ],
  },
];

// ── Per-location stock for each item (added for C4 Transfer Orders) ──────────
const LOCATION_STOCK_SEED = {
  1: { 'LOC-A': { physical: 3,  allocated: 1  }, 'LOC-B': { physical: 1,  allocated: 0 }, 'LOC-C': { physical: 1,  allocated: 0 } },
  2: { 'LOC-A': { physical: 8,  allocated: 2  }, 'LOC-B': { physical: 5,  allocated: 1 }, 'LOC-C': { physical: 2,  allocated: 0 } },
  3: { 'LOC-A': { physical: 26, allocated: 8  }, 'LOC-B': { physical: 18, allocated: 4 }, 'LOC-C': { physical: 7,  allocated: 2 } },
  4: { 'LOC-A': { physical: 18, allocated: 5  }, 'LOC-B': { physical: 8,  allocated: 3 }, 'LOC-C': { physical: 4,  allocated: 1 } },
  5: { 'LOC-A': { physical: 10, allocated: 3  }, 'LOC-B': { physical: 5,  allocated: 2 }, 'LOC-C': { physical: 3,  allocated: 0 } },
  6: { 'LOC-A': { physical: 80, allocated: 15 }, 'LOC-B': { physical: 45, allocated: 10 }, 'LOC-C': { physical: 25, allocated: 5 } },
  7: { 'LOC-A': { physical: 18, allocated: 5  }, 'LOC-B': { physical: 10, allocated: 3 }, 'LOC-C': { physical: 6,  allocated: 1 } },
};
const initialInventory = initialMockData.map(item => ({
  ...item,
  locationStock: LOCATION_STOCK_SEED[item.id] ?? {},
}));

// ── Seed transfer orders ───────────────────────────────────────────────────────
const INIT_TRANSFERS = [
  {
    id: 'TRF-2026-001', status: 'Completed',
    fromLoc: 'LOC-A', toLoc: 'LOC-B',
    createdDate: '2026-05-13', dispatchDate: '2026-05-14', completedDate: '2026-05-15',
    initiatedBy: 'Maria Santos', approvedBy: 'David Kim',
    notes: 'Regular stock rebalancing — Tampa North running low on dry goods and supplies.',
    lines: [
      { sku: 'DRY-RICE-05-BAG', name: 'Jasmine Rice 50lb (Bag)', qty: 5,  unitCost: 35.00 },
      { sku: 'SUP-CUP-16',      name: '16oz Clear Plastic Cups', qty: 20, unitCost: 45.00 },
    ],
  },
  {
    id: 'TRF-2026-002', status: 'In Transit',
    fromLoc: 'LOC-A', toLoc: 'LOC-C',
    createdDate: '2026-05-24', dispatchDate: '2026-05-25', eta: '2026-05-27',
    initiatedBy: 'Carlos Rivera', approvedBy: 'David Kim',
    notes: 'St. Pete opening week fill — proteins and produce prioritized.',
    lines: [
      { sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20', qty: 8, unitCost: 85.50 },
      { sku: 'PRO-TOMA-01', name: 'Roma Tomatoes',             qty: 6, unitCost: 24.00 },
    ],
  },
  {
    id: 'TRF-2026-003', status: 'In Transit',
    fromLoc: 'LOC-B', toLoc: 'LOC-A',
    createdDate: '2026-05-25', dispatchDate: '2026-05-26', eta: '2026-05-27',
    initiatedBy: 'James Hebert', approvedBy: 'Maria Santos',
    notes: 'Overstock return from North Tampa — excess from last week\'s PO delivery.',
    lines: [
      { sku: 'DAI-MILK-02', name: 'Whole Milk 1 Gal (4pk)',       qty: 10, unitCost: 18.00  },
      { sku: 'FRZ-SALM-01', name: 'Atlantic Salmon Portions 6oz', qty: 5,  unitCost: 145.00 },
    ],
  },
  {
    id: 'TRF-2026-004', status: 'Draft',
    fromLoc: 'LOC-C', toLoc: 'LOC-A',
    createdDate: '2026-05-27',
    initiatedBy: 'Carlos Rivera',
    notes: 'Weekly rebalancing from St. Pete — weekend excess.',
    lines: [
      { sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20', qty: 3, unitCost: 85.50 },
      { sku: 'DAI-MILK-02', name: 'Whole Milk 1 Gal (4pk)',    qty: 5, unitCost: 18.00  },
    ],
  },
  {
    id: 'TRF-2026-005', status: 'Cancelled',
    fromLoc: 'LOC-A', toLoc: 'LOC-B',
    createdDate: '2026-05-20', cancelledDate: '2026-05-21',
    initiatedBy: 'Maria Santos',
    notes: 'Cancelled — LOC-B confirmed sufficient stock after cycle count.',
    lines: [
      { sku: 'FRZ-SALM-01', name: 'Atlantic Salmon Portions 6oz', qty: 6, unitCost: 145.00 },
    ],
  },
];

// ─────────────────────────────────────────────
// TRANSFER ORDERS TAB
// ─────────────────────────────────────────────
function TransfersTab({ transfers, setTransfers, inventory, setInventory }) {
  const [filter, setFilter]       = useState('all');
  const [selectedId, setSelectedId] = useState('TRF-2026-002');
  const [showCreate, setShowCreate] = useState(false);
  const [newTrf, setNewTrf]       = useState({ fromLoc: 'LOC-A', toLoc: 'LOC-B', notes: '', lines: [{ sku: '', qty: 1 }] });
  const [toast, setToast]         = useState(null);

  const LOCS = LOCATIONS.filter(l => l.id !== 'all');

  const STATUS_META = {
    'Draft':      { color: 'text-gray-300',    bg: 'bg-gray-700/50',    border: 'border-gray-600/40',    dot: 'bg-gray-500'    },
    'In Transit': { color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400'   },
    'Completed':  { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    'Cancelled':  { color: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    dot: 'bg-rose-400'    },
  };

  const FILTERS = ['all', 'Draft', 'In Transit', 'Completed', 'Cancelled'];
  const filtered  = filter === 'all' ? transfers : transfers.filter(t => t.status === filter);
  const selected  = transfers.find(t => t.id === selectedId) ?? null;
  const trfValue  = t => t.lines.reduce((s, l) => s + l.qty * l.unitCost, 0);

  const inTransit      = transfers.filter(t => t.status === 'In Transit');
  const completedMonth = transfers.filter(t => t.status === 'Completed');
  const inTransitVal   = inTransit.reduce((s, t) => s + trfValue(t), 0);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const locMeta = id => LOCATIONS.find(l => l.id === id);

  // ── Dispatch: Draft → In Transit ──────────────────────────────────────────
  const handleDispatch = () => {
    if (!selected) return;
    setTransfers(prev => prev.map(t =>
      t.id === selectedId ? { ...t, status: 'In Transit', dispatchDate: '2026-05-27', eta: '2026-05-28' } : t
    ));
    setInventory(prev => prev.map(item => {
      const line = selected.lines.find(l => l.sku === item.sku);
      if (!line || !item.locationStock?.[selected.fromLoc]) return item;
      const ls = item.locationStock[selected.fromLoc];
      return { ...item, locationStock: { ...item.locationStock, [selected.fromLoc]: { ...ls, allocated: ls.allocated + line.qty } } };
    }));
    showToast(`${selectedId} dispatched — stock committed at ${locMeta(selected.fromLoc)?.name}`);
  };

  // ── Receive: In Transit → Completed ───────────────────────────────────────
  const handleReceive = () => {
    if (!selected) return;
    setTransfers(prev => prev.map(t =>
      t.id === selectedId ? { ...t, status: 'Completed', completedDate: '2026-05-27', approvedBy: 'System' } : t
    ));
    setInventory(prev => prev.map(item => {
      const line = selected.lines.find(l => l.sku === item.sku);
      if (!line) return item;
      const newLS = { ...(item.locationStock || {}) };
      const fromLS = newLS[selected.fromLoc];
      const toLS   = newLS[selected.toLoc];
      if (fromLS) newLS[selected.fromLoc] = { physical: Math.max(0, fromLS.physical - line.qty), allocated: Math.max(0, fromLS.allocated - line.qty) };
      if (toLS)   newLS[selected.toLoc]   = { ...toLS, physical: toLS.physical + line.qty };
      else        newLS[selected.toLoc]   = { physical: line.qty, allocated: 0 };
      return { ...item, locationStock: newLS };
    }));
    showToast(`${selectedId} received — stock updated at ${locMeta(selected.toLoc)?.name}`);
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancelTrf = () => {
    setTransfers(prev => prev.map(t =>
      t.id === selectedId ? { ...t, status: 'Cancelled', cancelledDate: '2026-05-27' } : t
    ));
    showToast(`${selectedId} cancelled`);
  };

  // ── Create Transfer ───────────────────────────────────────────────────────
  const handleCreate = () => {
    const validLines = newTrf.lines.filter(l => l.sku && Number(l.qty) > 0);
    if (newTrf.fromLoc === newTrf.toLoc || !validLines.length) return;
    const skuMap = {};
    inventory.forEach(i => { skuMap[i.sku] = i; });
    const nextNum = String(transfers.length + 1).padStart(3, '0');
    const id = `TRF-2026-0${nextNum}`;
    const newRecord = {
      id, status: 'Draft',
      fromLoc: newTrf.fromLoc, toLoc: newTrf.toLoc,
      createdDate: '2026-05-27', initiatedBy: 'You',
      notes: newTrf.notes,
      lines: validLines.map(l => ({
        sku: l.sku, name: skuMap[l.sku]?.name || l.sku,
        qty: Number(l.qty), unitCost: skuMap[l.sku]?.price || 0,
      })),
    };
    setTransfers(prev => [...prev, newRecord]);
    setSelectedId(id);
    setShowCreate(false);
    setNewTrf({ fromLoc: 'LOC-A', toLoc: 'LOC-B', notes: '', lines: [{ sku: '', qty: 1 }] });
    showToast(`${id} created as Draft`);
  };

  const skuOptions = inventory.map(i => ({ value: i.sku, label: `${i.sku} — ${i.name}` }));

  return (
    <div className="space-y-4 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl shadow-xl backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-300 font-medium">{toast}</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Transfers', value: transfers.length, sub: 'all time', color: 'text-cyan-400', Icon: ArrowRightLeft },
          { label: 'In Transit', value: inTransit.length, sub: `$${inTransitVal.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})} value`, color: 'text-amber-400', Icon: Truck },
          { label: 'Completed', value: completedMonth.length, sub: 'this period', color: 'text-emerald-400', Icon: PackageCheck },
          { label: 'Locations', value: 3, sub: 'active facilities', color: 'text-violet-400', Icon: MapPin },
        ].map(({ label, value, sub, color, Icon }) => (
          <div key={label} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter row + Create */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === f
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-gray-300'
            }`}>
            {f === 'all' ? `All (${transfers.length})` : `${f} (${transfers.filter(t => t.status === f).length})`}
          </button>
        ))}
        <button onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold transition-all">
          <Plus className="w-3.5 h-3.5" /> New Transfer
        </button>
      </div>

      {/* Split: List + Detail */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Left: Transfer List */}
        <div className="md:col-span-2 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">No transfers match this filter.</div>
          )}
          {filtered.map(t => {
            const sm = STATUS_META[t.status] ?? STATUS_META['Draft'];
            const fLoc = locMeta(t.fromLoc);
            const tLoc = locMeta(t.toLoc);
            const val  = trfValue(t);
            return (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedId === t.id
                    ? 'bg-cyan-500/10 border-cyan-500/40'
                    : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/70'
                }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-200">{t.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sm.bg} ${sm.color} ${sm.border} border`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${sm.dot} mr-1`} />
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <span className={fLoc?.color}>{fLoc?.name}</span>
                  <MoveRight className="w-3 h-3 text-gray-600" />
                  <span className={tLoc?.color}>{tLoc?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t.lines.length} SKU{t.lines.length !== 1 ? 's' : ''}</span>
                  <span className="text-gray-400 font-semibold">${val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Detail Panel */}
        <div className="md:col-span-3">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm p-8">Select a transfer to view details.</div>
          ) : (() => {
            const sm   = STATUS_META[selected.status] ?? STATUS_META['Draft'];
            const fLoc = locMeta(selected.fromLoc);
            const tLoc = locMeta(selected.toLoc);
            const val  = trfValue(selected);
            const steps = ['Draft', 'In Transit', 'Completed'];
            const stepIdx = steps.indexOf(selected.status);
            return (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 space-y-4">

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-100">{selected.id}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${fLoc?.bg} border ${fLoc?.color}`}>
                        <MapPin className="w-3 h-3" />{fLoc?.name}
                      </div>
                      <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${tLoc?.bg} border ${tLoc?.color}`}>
                        <MapPin className="w-3 h-3" />{tLoc?.name}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${sm.bg} ${sm.color} ${sm.border}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${sm.dot} mr-1`} />
                    {selected.status}
                  </span>
                </div>

                {/* Progress bar (skip for Cancelled) */}
                {selected.status !== 'Cancelled' && (
                  <div className="flex items-center gap-0">
                    {steps.map((step, i) => (
                      <React.Fragment key={step}>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          i <= stepIdx ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-800/60 text-gray-600'
                        }`}>
                          {i < stepIdx ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <span className="w-3 h-3 rounded-full border border-current inline-flex items-center justify-center text-[9px]">{i+1}</span>}
                          {step}
                        </div>
                        {i < steps.length - 1 && <div className={`h-px flex-1 mx-1 ${i < stepIdx ? 'bg-cyan-500/40' : 'bg-gray-700'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    ['Initiated By', selected.initiatedBy || '—'],
                    ['Approved By', selected.approvedBy || 'Pending'],
                    ['Created', selected.createdDate || '—'],
                    selected.status === 'Completed'  ? ['Completed', selected.completedDate]
                    : selected.status === 'Cancelled' ? ['Cancelled', selected.cancelledDate]
                    : selected.status === 'In Transit' ? ['ETA', selected.eta || '—']
                    : ['Dispatch Date', 'Not yet dispatched'],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-gray-900/40 rounded-lg px-3 py-2">
                      <div className="text-gray-600 mb-0.5">{k}</div>
                      <div className="text-gray-300 font-semibold">{v}</div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {selected.notes && (
                  <div className="text-xs text-gray-400 bg-gray-900/30 rounded-lg px-3 py-2 italic">"{selected.notes}"</div>
                )}

                {/* Line Items */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transfer Lines</div>
                  <div className="space-y-1">
                    {selected.lines.map((line, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-900/40 rounded-lg px-3 py-2 text-xs">
                        <div>
                          <span className="text-gray-200 font-semibold">{line.name}</span>
                          <span className="text-gray-600 ml-2">{line.sku}</span>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <span className="text-gray-400">{line.qty} units</span>
                          <span className="text-gray-300 font-bold w-20 text-right">
                            ${(line.qty * line.unitCost).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-3 py-2 text-xs border-t border-gray-700/50 mt-1">
                      <span className="text-gray-500 font-semibold">Total Transfer Value</span>
                      <span className="text-cyan-300 font-bold text-sm">${val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-700/40">
                  {selected.status === 'Draft' && (
                    <>
                      <button onClick={handleDispatch}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition-all">
                        <Truck className="w-3.5 h-3.5" /> Dispatch Transfer
                      </button>
                      <button onClick={handleCancelTrf}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold transition-all">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {selected.status === 'In Transit' && (
                    <>
                      <button onClick={handleReceive}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold transition-all">
                        <PackageCheck className="w-3.5 h-3.5" /> Confirm Receipt
                      </button>
                      <button onClick={handleCancelTrf}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold transition-all">
                        <X className="w-3.5 h-3.5" /> Report Issue
                      </button>
                    </>
                  )}
                  {(selected.status === 'Completed' || selected.status === 'Cancelled') && (
                    <span className="text-xs text-gray-600 italic">No actions available — transfer is {selected.status.toLowerCase()}.</span>
                  )}
                </div>

              </div>
            );
          })()}
        </div>
      </div>

      {/* Create Transfer Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700/80 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-cyan-400" /> New Transfer Order</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>

            {/* From / To */}
            <div className="grid grid-cols-2 gap-3">
              {[['fromLoc', 'From Location'], ['toLoc', 'To Location']].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <select value={newTrf[field]} onChange={e => setNewTrf(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500">
                    {LOCS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {newTrf.fromLoc === newTrf.toLoc && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">Source and destination cannot be the same location.</div>
            )}

            {/* Lines */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transfer Lines</div>
              <div className="space-y-2">
                {newTrf.lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={line.sku} onChange={e => setNewTrf(p => ({ ...p, lines: p.lines.map((l, j) => j === i ? { ...l, sku: e.target.value } : l) }))}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500">
                      <option value="">— Select SKU —</option>
                      {skuOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input type="number" min="1" value={line.qty} onChange={e => setNewTrf(p => ({ ...p, lines: p.lines.map((l, j) => j === i ? { ...l, qty: e.target.value } : l) }))}
                      className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 text-center focus:outline-none focus:border-cyan-500" />
                    {newTrf.lines.length > 1 && (
                      <button onClick={() => setNewTrf(p => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))} className="text-rose-500 hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => setNewTrf(p => ({ ...p, lines: [...p.lines, { sku: '', qty: 1 }] }))}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1"><Plus className="w-3 h-3" /> Add line</button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
              <input value={newTrf.notes} onChange={e => setNewTrf(p => ({ ...p, notes: e.target.value }))}
                placeholder="Reason for transfer…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500" />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 bg-gray-800 border border-gray-700 rounded-lg transition-all">Cancel</button>
              <button onClick={handleCreate}
                disabled={newTrf.fromLoc === newTrf.toLoc || !newTrf.lines.some(l => l.sku && Number(l.qty) > 0)}
                className="px-4 py-2 text-xs font-semibold text-cyan-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Create Draft Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────
const getTotalStock    = lots => lots?.reduce((a, l) => a + l.qty, 0) ?? 0;
const getAvailableStock = lots => lots?.reduce((a, l) => l.qcHold ? a : a + l.qty, 0) ?? 0;

const getEarliestExpiry = lots => {
  if (!lots?.length) return null;
  const dates = lots.filter(l => l.expiry && !l.qcHold).map(l => new Date(l.expiry));
  if (!dates.length) return null;
  return new Date(Math.min(...dates)).toISOString().split('T')[0];
};

const daysUntilExpiry = dateString => {
  if (!dateString) return Infinity;
  return (new Date(dateString) - new Date()) / 86400000;
};

const isAtRisk = dateString => daysUntilExpiry(dateString) <= 30;
const isExpired = dateString => dateString && daysUntilExpiry(dateString) <= 0;

// Lot-level COGS: sum(qty * cost) across all lots
const getLotValuation = lots => lots?.reduce((a, l) => a + l.qty * l.cost, 0) ?? 0;

const PAGE_SIZE = 50;

// ─────────────────────────────────────────────
// CUSTOMER PURCHASE MAP  (SKU → regular buyers)
// Used by the Expiry Dashboard to surface who
// to target with field alerts / quick orders.
// ─────────────────────────────────────────────
const CUSTOMER_BUYS = {
  'FRZ-BEEF-01': [
    { id:'CUST-101', name:'Metro Diner & Grill',   rep:'J. Hebert',    avgQty:8,  lastOrder:'2026-05-18', phone:'(504) 555-1001', email:'james@metrodiner.com' },
    { id:'CUST-103', name:'Golden Wok Restaurant', rep:'M. Collins',   avgQty:4,  lastOrder:'2026-05-15', phone:'(504) 555-1005', email:'linda@goldenwok.com' },
    { id:'CUST-105', name:'Bella Italia',           rep:'J. Hebert',    avgQty:5,  lastOrder:'2026-05-10', phone:'(504) 555-1012', email:'marco@bellaitalia.com' },
    { id:'CUST-107', name:'Downtown YMCA',          rep:'T. Fontenot',  avgQty:3,  lastOrder:'2026-05-12', phone:'(504) 555-1014', email:'karen@downtownymca.org' },
  ],
  'PRO-TOMA-01': [
    { id:'CUST-101', name:'Metro Diner & Grill',   rep:'J. Hebert',    avgQty:6,  lastOrder:'2026-05-20', phone:'(504) 555-1001', email:'james@metrodiner.com' },
    { id:'CUST-102', name:'Sunrise Bistro',         rep:'M. Collins',   avgQty:4,  lastOrder:'2026-05-19', phone:'(504) 555-1002', email:'info@sunrisebistro.com' },
    { id:'CUST-108', name:'Parkway Deli',           rep:'T. Fontenot',  avgQty:8,  lastOrder:'2026-05-21', phone:'(504) 555-1009', email:'orders@parkwaydeli.com' },
  ],
  'DAI-MILK-02': [
    { id:'CUST-101', name:'Metro Diner & Grill',   rep:'J. Hebert',    avgQty:10, lastOrder:'2026-05-22', phone:'(504) 555-1001', email:'james@metrodiner.com' },
    { id:'CUST-104', name:'The Rustic Table',       rep:'M. Collins',   avgQty:6,  lastOrder:'2026-05-20', phone:'(504) 555-1008', email:'sara@rustictable.com' },
    { id:'CUST-109', name:'Lakeside Café',          rep:'J. Hebert',    avgQty:4,  lastOrder:'2026-05-18', phone:'(504) 555-1015', email:'orders@lakesidecafe.com' },
  ],
  'FRZ-SALM-01': [
    { id:'CUST-103', name:'Golden Wok Restaurant', rep:'M. Collins',   avgQty:3,  lastOrder:'2026-05-17', phone:'(504) 555-1005', email:'linda@goldenwok.com' },
    { id:'CUST-105', name:'Bella Italia',           rep:'J. Hebert',    avgQty:5,  lastOrder:'2026-05-14', phone:'(504) 555-1012', email:'marco@bellaitalia.com' },
    { id:'CUST-110', name:'The Fish House',         rep:'T. Fontenot',  avgQty:4,  lastOrder:'2026-05-15', phone:'(504) 555-1020', email:'orders@thefishhouse.com' },
  ],
};

// ─────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────
function DeleteConfirmModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className={`${UI.glassModal} w-full max-w-md p-6`}>
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20">
            <Trash2 className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100 mb-1">Delete SKU</h3>
            <p className="text-gray-400 text-sm">
              Permanently delete <span className="text-gray-200 font-semibold">{item.name}</span> and all {item.lots.length} associated lot record{item.lots.length !== 1 ? 's' : ''}? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className={UI.btnSecondary}>Cancel</button>
          <button onClick={onConfirm} className={UI.btnDanger}><Trash2 className="w-4 h-4" /> Delete SKU</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SORTABLE COLUMN HEADER
// ─────────────────────────────────────────────
function SortHeader({ label, field, sortConfig, onSort }) {
  const isActive = sortConfig.field === field;
  return (
    <th className={`${UI.th} cursor-pointer hover:text-gray-300 transition-colors`} onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {isActive
          ? sortConfig.dir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-cyan-500" />
            : <ChevronDown className="w-3 h-3 text-cyan-500" />
          : <ChevronsUpDown className="w-3 h-3 text-gray-600" />
        }
      </span>
    </th>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────
// RECALL SIMULATION — lot-level forward + backward trace
// ─────────────────────────────────────────────
const RECALL_TRACE = {
  'LOT-A': {
    lotId:'LOT-A', sku:'FRZ-BEEF-01', itemName:'Premium Ground Beef 80/20',
    supplierName:'Gulf Coast Proteins', supplierContact:'Maria Santos',
    supplierPhone:'(504) 555-0101', supplierEmail:'maria@gulfcoast.com',
    poNumber:'PO-AP-0881', receivedDate:'2026-05-01', receivedTemp:34, receivedBy:'J. Morales',
    expiryDate:'2026-06-15', uom:'case', receivedQty:20, remainingQty:4,
    category:'meat', hazardLevel:'HIGH', recallClass:'Class I',
    recallReason:"Potential E. coli O157:H7 contamination. Supplier Gulf Coast Proteins issued voluntary recall on 2026-05-22 following a positive environmental swab at their processing facility. All product from production run GCP-052026-A is under recall.",
    dispatches:[
      {orderId:'ORD-4821',customer:'Metro Diner & Grill',        contact:'James Tran',     phone:'(504) 555-1001',email:'james@metrodiner.com',      deliveredDate:'2026-05-03',qty:3,notified:false,returned:false},
      {orderId:'ORD-4825',customer:'Golden Wok Restaurant',      contact:'Linda Chen',     phone:'(504) 555-1005',email:'linda@goldenwok.com',        deliveredDate:'2026-05-05',qty:4,notified:false,returned:false},
      {orderId:'ORD-4828',customer:'The Rustic Table',           contact:'Sara Webb',      phone:'(504) 555-1008',email:'sara@rustictable.com',       deliveredDate:'2026-05-08',qty:2,notified:false,returned:false},
      {orderId:'ORD-4832',customer:'Bella Italia',               contact:'Marco Russo',    phone:'(504) 555-1012',email:'marco@bellaitalia.com',      deliveredDate:'2026-05-10',qty:5,notified:false,returned:false},
      {orderId:'ORD-4834',customer:'Downtown YMCA',              contact:'Karen Fields',   phone:'(504) 555-1014',email:'karen@downtownymca.org',     deliveredDate:'2026-05-12',qty:2,notified:false,returned:false},
    ],
  },
  'LOT-B': {
    lotId:'LOT-B', sku:'FRZ-BEEF-01', itemName:'Premium Ground Beef 80/20',
    supplierName:'Gulf Coast Proteins', supplierContact:'Maria Santos',
    supplierPhone:'(504) 555-0101', supplierEmail:'maria@gulfcoast.com',
    poNumber:'PO-AP-0881', receivedDate:'2026-05-08', receivedTemp:35, receivedBy:'T. Baptiste',
    expiryDate:'2026-07-01', uom:'case', receivedQty:25, remainingQty:25,
    category:'meat', hazardLevel:'HIGH', recallClass:'Class I',
    recallReason:"Same Gulf Coast Proteins voluntary recall. LOT-B received one week after LOT-A from production run GCP-052026-A. Supplier confirmed the full run is affected.",
    dispatches:[],
  },
  'LOT-D': {
    lotId:'LOT-D', sku:'PRO-TOMA-01', itemName:'Roma Tomatoes',
    supplierName:'Sunshine Produce Co.', supplierContact:'Dave Kim',
    supplierPhone:'(813) 555-0202', supplierEmail:'dave@sunshinepc.com',
    poNumber:'PO-AP-0883', receivedDate:'2026-05-18', receivedTemp:52, receivedBy:'J. Morales',
    expiryDate:new Date(Date.now()+15*86400000).toISOString().split('T')[0],
    uom:'case', receivedQty:12, remainingQty:12,
    category:'produce', hazardLevel:'MEDIUM', recallClass:'Class II',
    recallReason:"Temperature excursion at receiving — internal temp 52°F exceeded 41°F cold-chain requirement. Lot on QC hold pending lab results. Precautionary recall due to potential Salmonella growth during excursion window.",
    dispatches:[],
  },
  'LOT-C': {
    lotId:'LOT-C', sku:'DRY-RICE-05', itemName:'Jasmine Rice 50lb (Pallet)',
    supplierName:'Metro Dry Goods', supplierContact:'Tom Reyes',
    supplierPhone:'(504) 555-0404', supplierEmail:'tom@metrodrygoods.com',
    poNumber:'PO-AP-0885', receivedDate:'2026-01-10', receivedTemp:null, receivedBy:'R. Ortega',
    expiryDate:'2027-12-01', uom:'pallet', receivedQty:5, remainingQty:5,
    category:'dry goods', hazardLevel:'LOW', recallClass:'Class III',
    recallReason:"Supplier labeling error — net weight stated as 50 lb but actual weight 48.5 lb. FDA notification required for mislabeling. Product is safe for consumption; recall is administrative.",
    dispatches:[
      {orderId:'ORD-4819',customer:'Northgate Mall Food Court',  contact:'Dana Price',     phone:'(504) 555-1019',email:'dprice@northgatemall.com',   deliveredDate:'2026-02-14',qty:1,notified:false,returned:false},
    ],
  },
  'LOT-C-SPLIT': {
    lotId:'LOT-C-SPLIT', sku:'DRY-RICE-05-BAG', itemName:'Jasmine Rice 50lb (Bag)',
    supplierName:'Metro Dry Goods', supplierContact:'Tom Reyes',
    supplierPhone:'(504) 555-0404', supplierEmail:'tom@metrodrygoods.com',
    poNumber:'PO-AP-0885', receivedDate:'2026-01-10', receivedTemp:null, receivedBy:'R. Ortega',
    expiryDate:'2027-12-01', uom:'bag', receivedQty:200, remainingQty:600,
    category:'dry goods', hazardLevel:'LOW', recallClass:'Class III',
    recallReason:"Split from LOT-C pallet. Same Metro Dry Goods labeling error. All split bags are included in the parent recall.",
    dispatches:[
      {orderId:'ORD-4820',customer:'Harbor View Hotel',              contact:'Guest Services', phone:'(504) 555-1020',email:'purchasing@harborview.com',  deliveredDate:'2026-02-20',qty:12,notified:false,returned:false},
      {orderId:'ORD-4823',customer:'Pines Cafeteria',                contact:'Terri Mack',    phone:'(504) 555-1003',email:'tmack@pinescafe.org',         deliveredDate:'2026-03-05',qty:8, notified:false,returned:false},
      {orderId:'ORD-4827',customer:"St. Mary's Hospital Cafeteria",  contact:'Mark Boudin',   phone:'(504) 555-1027',email:'mboudin@stmarys.org',         deliveredDate:'2026-03-18',qty:15,notified:false,returned:false},
      {orderId:'ORD-4829',customer:'Parkway Deli',                   contact:'Yusuf Ali',     phone:'(504) 555-1009',email:'yali@parkwaydeli.com',         deliveredDate:'2026-04-02',qty:6, notified:false,returned:false},
      {orderId:'ORD-4835',customer:'Maple Leaf Diner',               contact:'Carol Stanton', phone:'(504) 555-1015',email:'carol@mapleleafdiner.com',     deliveredDate:'2026-04-15',qty:10,notified:false,returned:false},
    ],
  },
  'LOT-E': {
    lotId:'LOT-E', sku:'DAI-MILK-02', itemName:'Whole Milk 1 Gal (4pk)',
    supplierName:'Dairy Fresh Distributors', supplierContact:'Pam Lewis',
    supplierPhone:'(985) 555-0303', supplierEmail:'pam@dairyfresh.com',
    poNumber:'PO-AP-0883', receivedDate:'2026-05-20', receivedTemp:36, receivedBy:'T. Baptiste',
    expiryDate:'2026-06-05', uom:'case', receivedQty:8, remainingQty:8,
    category:'dairy', hazardLevel:'MEDIUM', recallClass:'Class II',
    recallReason:"Undeclared allergen — supplier reformulation introduced vitamin D3 derived from lanolin. Potential allergenic risk for wool/lanolin-sensitive consumers. FDA allergen recall required.",
    dispatches:[],
  },
  'LOT-F': {
    lotId:'LOT-F', sku:'SUP-CUP-16', itemName:'16oz Clear Plastic Cups',
    supplierName:'Metro Dry Goods', supplierContact:'Tom Reyes',
    supplierPhone:'(504) 555-0404', supplierEmail:'tom@metrodrygoods.com',
    poNumber:'PO-AP-0885', receivedDate:'2026-03-01', receivedTemp:null, receivedBy:'R. Ortega',
    expiryDate:'', uom:'case', receivedQty:150, remainingQty:150,
    category:'supplies', hazardLevel:'LOW', recallClass:'Class III',
    recallReason:"BPA content disclosure required by state regulation effective 2026-04-01. Existing stock requires updated labeling. No health hazard identified.",
    dispatches:[],
  },
};

// DEMAND HISTORY  — 12 weeks of synthetic OUT scan data per item ID
// Week 0 = 12 weeks ago, Week 11 = most recent completed week
// ─────────────────────────────────────────────────────────────────────────────
const DEMAND_HISTORY = {
  // Jasmine Rice 50lb Pallet — slow mover, steady
  1:  [2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 2],
  // Jasmine Rice 50lb Bag — high mover, slight uptrend
  2:  [8, 9, 10, 9, 10, 11, 10, 12, 11, 13, 12, 14],
  // Premium Ground Beef — high mover, strong summer uptrend
  3:  [12, 13, 14, 14, 15, 16, 15, 17, 18, 20, 21, 22],
  // Roma Tomatoes — produce, high velocity, seasonal spike building
  4:  [10, 11, 12, 13, 13, 14, 14, 15, 16, 18, 19, 21],
  // Whole Milk 1 Gal — dairy, steady high volume
  5:  [18, 19, 18, 20, 19, 21, 20, 19, 21, 20, 19, 20],
  // 16oz Clear Cups — supplies, declining as operator switched brands
  6:  [8, 8, 7, 7, 7, 6, 6, 6, 5, 5, 4, 4],
};

// Lead times by category (days from PO → receipt)
const LEAD_TIMES = {
  'dry goods': 5, 'meat': 2, 'produce': 1, 'dairy': 2, 'supplies': 7,
};

// ── Forecast helpers ──────────────────────────────────────────────────────────
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const computeForecast = (item, history) => {
  const h = history || [];
  const v4w  = avg(h.slice(-4));   // 4-week velocity (cases/week)
  const v8w  = avg(h.slice(-8));   // 8-week velocity
  const v12w = avg(h);             // 12-week velocity
  const atp  = getAvailableStock(item.lots);

  const trend = v4w > v8w * 1.12 ? 'up'
              : v4w < v8w * 0.88 ? 'down'
              : 'stable';

  const daysRemaining = v4w > 0 ? Math.round((atp / v4w) * 7) : 999;

  const proj30d = Math.round(v4w * 4.33); // 30-day projected demand

  const leadTime   = LEAD_TIMES[item.category] || 5;
  // Safety stock = 1.5× demand during lead time
  const safetyStock = Math.round(v4w * (leadTime / 7) * 1.5);
  const recoQty    = Math.max(0, proj30d + safetyStock - atp);
  const recoValue  = parseFloat((recoQty * (item.cost || item.price * 0.6)).toFixed(2));

  const urgency = daysRemaining < 7  ? 'critical'
                : daysRemaining < 14 ? 'warning'
                : 'ok';

  return { v4w, v8w, v12w, trend, daysRemaining, proj30d, recoQty, recoValue, urgency, atp, leadTime };
};

// ── SVG Sparkline helper ──────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#06b6d4', width = 120, height = 36 }) => {
  if (!data || data.length < 2) return null;
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = `M ${pts.join(' L ')}`;
  const area = `M ${pts[0]} L ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]}
        r="3" fill={color} />
    </svg>
  );
};

export default function InventoryModule() {
  const { settings, draftReorderPOs, addDraftReorderPO, quickCreateAction, clearQuickCreateAction, activeUser, logAudit, activeLocation, apiInventory, refreshInventory } = useKernal();
  // Loss Prevention: when strict mode is on and the user isn't an admin,
  // Library lot edits are locked and the scanner requires a linked PO/order id.
  const isAdmin          = activeUser?.role === 'admin';
  const strictMode       = !!settings.features?.strictInventoryControl;
  // Feature-flag visibility
  const catchWeightEnabled   = settings.features?.catchWeightItems !== false;
  const frozenEnabled        = settings.features?.frozenFoods !== false;
  const refrigeratedEnabled  = settings.features?.refrigeratedFoods !== false;
  const lotTrackingEnabled   = settings.features?.lotTracking !== false;
  const barcodeScanEnabled   = settings.features?.barcodeScanning !== false;
  const caseSplittingEnabled = settings.features?.caseSplitting !== false;
  const reorderAutoEnabled   = settings.features?.reorderAutomation !== false;
  const multiLocationEnabled = settings.features?.multiLocation !== false;
  const libraryLocked = strictMode && !isAdmin;

  // Quick Create: respond to sidebar "New SKU" trigger
  useEffect(() => {
    if (quickCreateAction === 'new-sku') {
      setIsItemModalOpen(true);
      clearQuickCreateAction();
    }
  }, [quickCreateAction, clearQuickCreateAction]);
  const fefoEnabled       = settings.features.fefoEnforcement;
  const fsmaEnabled       = settings.features.fsmaTraceability;
  const customerPricing   = settings.features.customerPricing;

  const [inventory, setInventory]       = useState(DEMO_MODE ? initialInventory : []);
  const [transfers, setTransfers]       = useState(DEMO_MODE ? INIT_TRANSFERS : []);

  // ── Generic API error toast ───────────────────────────────────
  const [apiToast, setApiToast] = useState(null);
  const showApiToast = (msg) => { setApiToast(msg); setTimeout(() => setApiToast(null), 4000); };

  // ── Map a backend inventory+products row → frontend item model ─
  const mapApiItem = (row) => ({
    id:            row.id,                                      // inventory UUID — for api.inventory.*
    _productId:    row.product_id,                              // product UUID — for api.products.*
    name:          row.products?.name          || '',
    sku:           row.products?.sku           || '',
    barcode:       '',
    category:      row.products?.category      || '',
    uom:           row.products?.unit_of_measure || 'case',
    basePrice:     Number(row.products?.price_per_unit) || 0,
    price:         Number(row.products?.price_per_unit) || 0,
    costBasis:     Number(row.products?.cost_per_unit)  || 0,
    unitCost:      Number(row.products?.cost_per_unit)  || 0,
    physicalStock: Number(row.quantity_on_hand)   || 0,
    allocatedStock:Number(row.quantity_reserved)  || 0,
    reorderPoint:  Number(row.reorder_point)      || 0,
    reorderQty:    Number(row.reorder_qty)        || 0,
    location:      row.location_id               || '',
    isCatchWeight: false,
    leadTimeDays:  3, avgDailyUsage: 0,
    velocity: 'Medium', trend: 'stable', predictedDemand: 0,
    lots: row.lot_number ? [{
      lotId:        row.lot_number,
      qty:          Number(row.quantity_on_hand) || 0,
      qcHold:       false,
      expiry:       row.expiry_date || null,
      cost:         Number(row.products?.cost_per_unit) || 0,
      supplier:     null,
      receivedDate: null,
    }] : [],
    locationStock: {},
    specs: { origin: '', allergens: '', shelfLife: '', storage: '', description: row.products?.description || '' },
  });

  // ── Seed inventory from live API whenever apiInventory updates ─
  useEffect(() => {
    if (DEMO_MODE || !apiInventory?.length) return;
    setInventory(apiInventory.map(mapApiItem));
  }, [apiInventory]); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeTab, setActiveTab]       = useState('inventory');
  const [generatedPOs,  setGeneratedPOs]  = useState({});    // { sku: poNumber } — tracks which SKUs have a PO in flight
  const [reorderToast,  setReorderToast]  = useState(null);  // { msg, count }
  const [poDraft, setPoDraft]           = useState([]);   // { item, qty, value }
  const [forecastFilter, setForecastFilter] = useState('all'); // all | risk | ok
  const [lotAttOpen, setLotAttOpen]         = useState(null);  // lotId or null
  const [lotModalTab, setLotModalTab]       = useState('docs'); // 'docs' | 'history'

  // ── Recall simulation state ────────────────────────────────────────────────
  const [recallLotId,    setRecallLotId]    = useState('');
  const [recallResult,   setRecallResult]   = useState(null);
  const [recallRunning,  setRecallRunning]  = useState(false);
  const [recallView,     setRecallView]     = useState('summary');
  const [recallNotified, setRecallNotified] = useState({});
  const [recallReturned, setRecallReturned] = useState({});
  const [recallSimDate,  setRecallSimDate]  = useState('');

  const handleRunRecall = () => {
    if (!recallLotId) return;
    setRecallRunning(true);
    setRecallNotified({});
    setRecallReturned({});
    setTimeout(() => {
      setRecallResult(RECALL_TRACE[recallLotId] || null);
      setRecallView('summary');
      setRecallSimDate(new Date().toLocaleString());
      setRecallRunning(false);
    }, 1400);
  };
  const [traceQuery, setTraceQuery]     = useState('');
  const [traceResult, setTraceResult]   = useState(null);

  // ── Expiry Dashboard state ────────────────────────────────────────────────
  const [expiryFilter,         setExpiryFilter]         = useState('all');
  const [expiryExpanded,       setExpiryExpanded]       = useState(null);
  const [expiryPromo,          setExpiryPromo]          = useState(() => new Set());
  const [expiryAlerts,         setExpiryAlerts]         = useState(() => new Set());
  const [expiryOrders,         setExpiryOrders]         = useState(() => new Set());
  const [expiryInternalAlerts, setExpiryInternalAlerts] = useState(() => new Set());
  const [expiryToast,          setExpiryToast]          = useState(null);

  // Filtering
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Sorting
  const [sortConfig, setSortConfig]     = useState({ field: 'name', dir: 'asc' });

  // Pagination
  const [page, setPage]                 = useState(1);

  // Modal states
  const [isBarcodeToolOpen, setIsBarcodeToolOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null); // item to confirm-delete

  // Inline editing
  const [editingId, setEditingId]       = useState(null);
  const [editForm, setEditForm]         = useState({});

  // Library — full item master detail editor state
  const [librarySelectedId, setLibrarySelectedId] = useState(null);
  const [libraryDraft, setLibraryDraft] = useState(null);     // working copy of the selected item
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCatFilter, setLibraryCatFilter] = useState('All');

  // Add item form — full item master shape used by Procurement (vendor/cost),
  // Reorder Center (reorder qty + lead time), Pack & Weigh + Invoice Builder
  // (catch-weight pricing), and optionally an initial stock receipt.
  const emptyNewItem = () => ({
    name: '', sku: '', barcode: '', category: 'dry goods', uom: 'case',
    location: '', reorderPoint: 10, reorderQty: 30, price: 0, cost: 0,
    minShelfLifeDays: 0, leadTimeDays: 3,
    preferredVendorName: '', vendorProductCode: '',
    // Catch-weight fields, used only when isCatchWeight is true
    isCatchWeight: false, pricePerLb: 0, avgWeightPerCase: 0, weightVariancePct: 8,
    // Initial receipt fields, used only when receiveNow is true
    receiveNow: false,
    initialQty: 0, initialLotId: '', initialSupplier: '', initialExpiry: '',
  });
  const [newItemForm, setNewItemForm]   = useState(emptyNewItem());

  // ── Location-aware inventory slice ───────
  // When a specific warehouse is selected, filter to items with stock there and
  // expose per-location physical/allocated on each item for display purposes.
  const locInventory = useMemo(() => {
    if (activeLocation === 'all') return inventory;
    return inventory.filter(item =>
      (item.locationStock?.[activeLocation]?.physical ?? 0) > 0
    );
  }, [inventory, activeLocation]);

  // ── Sorting handler ──────────────────────
  const handleSort = field => {
    setSortConfig(prev =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    );
    setPage(1);
  };

  // ── Filtered + sorted data ───────────────
  const processedData = useMemo(() => {
    const q = search.toLowerCase();
    let data = locInventory.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchCat    = categoryFilter === 'All' || item.category === categoryFilter;
      return matchSearch && matchCat;
    });

    data = [...data].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.field) {
        case 'name':      aVal = a.name; bVal = b.name; break;
        case 'category':  aVal = a.category; bVal = b.category; break;
        case 'stock':     aVal = getAvailableStock(a.lots); bVal = getAvailableStock(b.lots); break;
        case 'location':  aVal = a.location; bVal = b.location; break;
        case 'expiry':
          aVal = getEarliestExpiry(a.lots) || '9999';
          bVal = getEarliestExpiry(b.lots) || '9999';
          break;
        default: aVal = a.name; bVal = b.name;
      }
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [locInventory, search, categoryFilter, sortConfig]);

  // ── Pagination ───────────────────────────
  const totalPages  = Math.max(1, Math.ceil(processedData.length / PAGE_SIZE));
  const pagedData   = processedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Valuation (lot-level cost) ───────────
  const totalValuation = useMemo(() =>
    locInventory.reduce((sum, item) => sum + getLotValuation(item.lots), 0),
  [locInventory]);

  const heldValuation = useMemo(() =>
    locInventory.reduce((sum, item) =>
      sum + item.lots.filter(l => l.qcHold).reduce((a, l) => a + l.qty * l.cost, 0), 0),
  [locInventory]);

  // ── QC Toggle ────────────────────────────
  const toggleQCHold = (itemId, lotId) => {
    setInventory(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        lots: item.lots.map(l =>
          l.lotId === lotId
            ? { ...l, qcHold: !l.qcHold, qcHoldDate: !l.qcHold ? new Date().toISOString() : null }
            : l
        ),
      };
    }));
  };

  // ── CRUD ─────────────────────────────────
  const handleDeleteItem = item => setDeleteTarget(item);
  const confirmDelete    = () => {
    const target = deleteTarget;
    setInventory(prev => prev.filter(i => i.id !== target.id));
    setDeleteTarget(null);
    if (!DEMO_MODE && target._productId) {
      api.products.delete(target._productId)
        .catch(err => showApiToast(`Delete failed: ${err.message}`));
    }
  };

  const handleEditClick = item => { setEditingId(item.id); setEditForm({ ...item }); };
  const handleSaveEdit  = () => {
    const editTarget = inventory.find(i => i.id === editingId);
    setInventory(prev => prev.map(item =>
      item.id === editingId
        ? { ...item, name: editForm.name, sku: editForm.sku, uom: editForm.uom, category: editForm.category, reorder: parseInt(editForm.reorder) || 0, location: editForm.location, minShelfLifeDays: parseInt(editForm.minShelfLifeDays) || 0, isCatchWeight: editForm.isCatchWeight }
        : item
    ));
    setEditingId(null);
    if (!DEMO_MODE && editTarget?._productId) {
      api.products.update(editTarget._productId, {
        name:            editForm.name,
        category:        editForm.category,
        unit_of_measure: editForm.uom,
      }).catch(err => showApiToast(`Save failed: ${err.message}`));
      api.inventory.update(editingId, {
        reorder_point: parseInt(editForm.reorder) || 0,
        location_id:   editForm.location || null,
      }).catch(err => showApiToast(`Save failed: ${err.message}`));
    }
  };

  const handleAddItem = e => {
    e.preventDefault();
    const f = newItemForm;
    const price = parseFloat(f.price) || 0;
    const cost  = parseFloat(f.cost)  || 0;
    const reorderPoint = parseInt(f.reorderPoint) || 0;
    const reorderQty   = parseInt(f.reorderQty)   || 0;

    // Catch-weight pricing block (only used if isCatchWeight)
    const cwBlock = f.isCatchWeight ? {
      pricePerLb:        parseFloat(f.pricePerLb) || 0,
      avgWeightPerCase:  parseFloat(f.avgWeightPerCase) || 0,
      weightVariancePct: parseFloat(f.weightVariancePct) || 8,
    } : {};

    // Optional initial stock receipt — create a single lot record
    const initialQty = parseInt(f.initialQty) || 0;
    const initialLot = (f.receiveNow && initialQty > 0) ? [{
      lotId:  f.initialLotId || `LOT-${Date.now().toString().slice(-5)}`,
      qty:    initialQty,
      qcHold: false,
      expiry: f.initialExpiry || null,
      cost:   cost,
      supplier: f.initialSupplier || f.preferredVendorName || null,
      receivedDate: new Date().toISOString().slice(0, 10),
    }] : [];

    const item = {
      id: Date.now(),
      name: f.name, sku: f.sku, barcode: f.barcode,
      category: f.category, uom: f.uom,
      basePrice: price, price, costBasis: cost, unitCost: cost,
      physicalStock: initialQty, allocatedStock: 0,
      reorderPoint, reorderQty,
      leadTimeDays: parseInt(f.leadTimeDays) || 3,
      avgDailyUsage: 0,
      preferredVendorId:   f.preferredVendorName ? `V-${f.preferredVendorName.slice(0, 4).toUpperCase()}` : null,
      preferredVendorName: f.preferredVendorName,
      vendorProductCode:   f.vendorProductCode,
      location: f.location,
      minShelfLifeDays: parseInt(f.minShelfLifeDays) || 0,
      isCatchWeight: f.isCatchWeight,
      ...cwBlock,
      velocity: 'Medium', trend: 'stable', predictedDemand: 0,
      lots: initialLot,
      specs: { origin: '', allergens: '', shelfLife: '', storage: '', description: '' },
    };
    setInventory(prev => [...prev, item]);
    logAudit({
      moduleId: 'inventory',
      action: 'sku.create',
      entityType: 'sku', entityId: item.sku,
      summary: `Registered new SKU: ${item.name}${initialQty > 0 ? ` with ${initialQty} ${item.uom} initial stock` : ''}`,
      before: null,
      after: { sku: item.sku, name: item.name, initialQty },
      severity: 'info',
    });
    setIsItemModalOpen(false);
    setNewItemForm(emptyNewItem());
    if (!DEMO_MODE) {
      api.products.create({
        sku:             f.sku,
        name:            f.name,
        description:     f.specs?.description || '',
        category:        f.category,
        unit_of_measure: f.uom,
        price_per_unit:  price  || null,
        cost_per_unit:   cost   || null,
      }).then(prod => api.inventory.create({
        product_id:      prod.id,
        quantity_on_hand: initialQty,
        reorder_point:   reorderPoint || null,
        reorder_qty:     reorderQty   || null,
        lot_number:      (f.receiveNow && initialQty > 0) ? (f.initialLotId || null) : null,
        expiry_date:     (f.receiveNow && initialQty > 0) ? (f.initialExpiry || null) : null,
      }).then(inv => {
        // Swap temp numeric id for real UUIDs
        setInventory(prev => prev.map(i =>
          i.id === item.id ? { ...i, id: inv.id, _productId: prod.id } : i
        ));
        refreshInventory();
      })).catch(err => {
        setInventory(prev => prev.filter(i => i.id !== item.id));
        showApiToast(`Failed to save new SKU: ${err.message}`);
      });
    }
  };

  // ─────────────────────────────────────────
  // EXPORT CSV
  // ─────────────────────────────────────────
  const exportInventoryCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'UOM', 'Location', 'Total Stock', 'Available Stock', 'On QC Hold', 'Reorder Point', 'Reorder Qty', 'Unit Cost', 'Unit Price', 'Earliest Expiry'];
    const rows = processedData.map(item => {
      const total     = getTotalStock(item.lots);
      const available = getAvailableStock(item.lots);
      const onHold    = total - available;
      const expiry    = getEarliestExpiry(item.lots) || '';
      return [
        item.sku,
        item.name,
        item.category,
        item.uom,
        item.location || '',
        total,
        available,
        onHold,
        item.reorderPoint ?? '',
        item.reorderQty   ?? '',
        item.cost  != null ? item.cost.toFixed(2)  : '',
        item.price != null ? item.price.toFixed(2) : '',
        expiry,
      ];
    });
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  const tabs = [
    { id: 'inventory',   Icon: Package,        label: 'Current Stock' },
    { id: 'library',     Icon: BookOpen,        label: 'Library' },
    { id: 'qc',          Icon: Lock,            label: 'Quality Control' },
    { id: 'recall',      Icon: AlertOctagon,    label: 'Recall Simulation' },
    { id: 'reports',     Icon: ShieldCheck,     label: 'Compliance & Reports' },
    ...(lotTrackingEnabled   ? [{ id: 'expiry',    Icon: AlertTriangle,  label: 'Expiry Dashboard' }] : []),
    ...(multiLocationEnabled ? [{ id: 'transfers', Icon: ArrowRightLeft, label: 'Transfers' }]        : []),
  ];

  return (
    <div className={UI.page}>

      {/* ── MAIN ── */}
      <main className="flex flex-col h-screen overflow-hidden">

        {/* HEADER */}
        <header className={`${UI.glassHeader} p-6`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Inventory Operations</h1>
              <p className={UI.subheading}>Manage stock, QC holds, slotting, and case splits.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {barcodeScanEnabled && (
              <button onClick={() => setIsBarcodeToolOpen(true)} className={UI.btnSecondary}>
                <Barcode className="w-4 h-4" /> Scanner Tool
              </button>
              )}
              {activeTab === 'inventory' && (
              <button onClick={exportInventoryCSV} className={UI.btnSecondary} title="Export current stock view as CSV">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              )}
              <button onClick={() => setIsItemModalOpen(true)} className={UI.btnPrimary}>
                <Plus className="w-4 h-4" /> Add SKU
              </button>
            </div>
          </div>

          {/* TABS */}
          <div id="kernal-module-tabs" className="flex border-b border-gray-800 overflow-x-auto">
            {tabs.map(({ id, Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={activeTab === id ? UI.tabActive : UI.tabInactive}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-6 bg-gray-950">

          {/* ══ TAB: INVENTORY ══ */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">

              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-3 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text" placeholder="Search SKU or name…"
                    className={`${UI.input} pl-10`}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
                <select className={`${UI.select} max-w-[180px]`} value={categoryFilter}
                  onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                  <option value="All">All Categories</option>
                  <option value="meat">Meat</option>
                  <option value="produce">Produce</option>
                  <option value="dairy">Dairy</option>
                  {frozenEnabled && <option value="frozen">Frozen</option>}
                  <option value="dry goods">Dry Goods</option>
                  <option value="supplies">Supplies</option>
                </select>
                <span className="text-gray-600 text-sm ml-auto">
                  {processedData.length} SKU{processedData.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              {activeLocation !== 'all' && (() => {
                const locMeta = LOCATIONS.find(l => l.id === activeLocation);
                return (
                  <div className={`mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border ${locMeta?.bg || 'bg-cyan-500/10'} border-current/20`}>
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${locMeta?.color || 'text-cyan-400'}`} />
                    <span className={`text-xs font-semibold ${locMeta?.color || 'text-cyan-400'}`}>
                      {locMeta?.name} — {locInventory.length} SKU{locInventory.length !== 1 ? 's' : ''} with stock at this location
                    </span>
                  </div>
                );
              })()}
              <div className={`${UI.card} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className={UI.tableHead}>
                      <tr>
                        <SortHeader label="Item" field="name" sortConfig={sortConfig} onSort={handleSort} />
                        <SortHeader label="Category" field="category" sortConfig={sortConfig} onSort={handleSort} />
                        <SortHeader label={activeLocation === 'all' ? 'Available Stock' : `Stock — ${LOCATIONS.find(l=>l.id===activeLocation)?.short}`} field="stock" sortConfig={sortConfig} onSort={handleSort} />
                        <SortHeader label="Next Expiry" field="expiry" sortConfig={sortConfig} onSort={handleSort} />
                        <SortHeader label="Location" field="location" sortConfig={sortConfig} onSort={handleSort} />
                        <th className={UI.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedData.map(item => {
                        const avail    = getAvailableStock(item.lots);
                        const total    = getTotalStock(item.lots);
                        const expiry   = getEarliestExpiry(item.lots);
                        const hasHolds = avail < total;
                        const isEditing = editingId === item.id;

                        if (isEditing) {
                          return (
                            <tr key={item.id} className="bg-cyan-500/5 border-b border-gray-800">
                              <td className="p-3">
                                <input className={`${UI.inputSm} w-full mb-2`} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Item Name" />
                                <div className="flex gap-2">
                                  <input className={`${UI.inputSm} w-2/3`} value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} placeholder="SKU" />
                                  <select className={`${UI.inputSm} w-1/3`} value={editForm.uom} onChange={e => setEditForm({ ...editForm, uom: e.target.value })}>
                                    <option value="case">Case</option><option value="pallet">Pallet</option><option value="bag">Bag</option><option value="each">Each</option>
                                  </select>
                                </div>
                              </td>
                              <td className="p-3">
                                <select className={UI.inputSm} value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                                  <option value="meat">Meat</option><option value="produce">Produce</option><option value="dairy">Dairy</option>{frozenEnabled && <option value="frozen">Frozen</option>}<option value="dry goods">Dry Goods</option><option value="supplies">Supplies</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <span className="text-gray-500 text-xs">Managed via scanner</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-gray-500 text-xs">Min:</span>
                                  <input type="number" className={`${UI.inputSm} w-16`} value={editForm.reorder} onChange={e => setEditForm({ ...editForm, reorder: e.target.value })} />
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 text-xs">SLA:</span>
                                  <input type="number" className={`${UI.inputSm} w-16`} value={editForm.minShelfLifeDays} onChange={e => setEditForm({ ...editForm, minShelfLifeDays: e.target.value })} />
                                  <span className="text-gray-500 text-xs">days</span>
                                </div>
                                {catchWeightEnabled && (
                                <div className="flex items-center gap-2 mt-2">
                                  <input type="checkbox" id={`cw-${item.id}`} checked={!!editForm.isCatchWeight} onChange={e => setEditForm({ ...editForm, isCatchWeight: e.target.checked })} className="accent-cyan-500" />
                                  <label htmlFor={`cw-${item.id}`} className="text-xs text-gray-400">Catch Weight</label>
                                </div>
                                )}
                              </td>
                              <td className="p-3">
                                <input className={`${UI.inputSm} w-full`} value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="Bin/Aisle" />
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <button onClick={handleSaveEdit} className="p-1.5 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-md border border-emerald-400/20 transition-colors" title="Save"><Save className="w-4 h-4" /></button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-md border border-gray-700 transition-colors" title="Cancel"><XCircle className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        const rowClass = isExpired(expiry)
                          ? UI.tableRowAlert
                          : UI.tableRow;

                        return (
                          <tr key={item.id} className={rowClass}>
                            <td className={UI.td}>
                              <div className="font-bold text-gray-100 flex items-center gap-2">
                                {item.name}
                                {item.isCatchWeight && (
                                  <span className={`${UI.badgeAmber} text-[10px]`}><Weight className="w-2.5 h-2.5" /> CW</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{item.sku}</span>
                                <span className="text-gray-600 text-xs">{item.uom}</span>
                                {item.splitQty && <span className="text-xs text-cyan-500/70">→ splits into {item.splitQty} {item.childSku}</span>}
                              </div>
                              {activeLocation === 'all' && item.locationStock && (
                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                  {LOCATIONS.filter(l => l.id !== 'all').map(loc => {
                                    const ls = item.locationStock[loc.id];
                                    if (!ls || ls.physical === 0) return null;
                                    const locAvail = ls.physical - ls.allocated;
                                    return (
                                      <span key={loc.id} className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold ${loc.bg} ${loc.color}`}>
                                        {loc.short}: {locAvail}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className={UI.td}>
                              <span className={`${UI.badgeZinc} capitalize`}>{item.category}</span>
                            </td>
                            <td className={UI.td}>
                              {activeLocation !== 'all' && item.locationStock?.[activeLocation] ? (() => {
                                const ls = item.locationStock[activeLocation];
                                const locAvail = ls.physical - ls.allocated;
                                const locMeta  = LOCATIONS.find(l => l.id === activeLocation);
                                return (
                                  <div>
                                    <div className="flex items-baseline gap-1.5 mb-1">
                                      <span className={`font-bold text-xl ${locAvail <= item.reorder ? 'text-rose-400' : 'text-gray-100'}`}>{locAvail}</span>
                                      <span className="text-gray-500 text-xs">/ {ls.physical} on-hand</span>
                                    </div>
                                    <div className={`text-[10px] font-medium ${locMeta?.color || 'text-cyan-400'}`}>{locMeta?.short} only</div>
                                    {ls.allocated > 0 && <div className="text-[10px] text-gray-500">{ls.allocated} allocated</div>}
                                  </div>
                                );
                              })() : (
                              <div className="flex items-baseline gap-1.5 mb-1">
                                <span className={`font-bold text-xl ${avail <= item.reorder ? 'text-rose-400' : 'text-gray-100'}`}>{avail}</span>
                                <span className="text-gray-500 text-xs">/ {total} total {item.uom}s</span>
                              </div>
                              )}
                              {activeLocation === 'all' && hasHolds && (
                                <div className={UI.badgeRose}><Lock className="w-3 h-3" /> {total - avail} on QC Hold</div>
                              )}
                              {reorderAutoEnabled && activeLocation === 'all' && avail <= item.reorder && avail > 0 && (
                                <div className={`${UI.badgeAmber} mt-1`}><AlertCircle className="w-3 h-3" /> Below reorder ({item.reorder})</div>
                              )}
                              {activeLocation === 'all' && avail === 0 && total === 0 && (
                                <div className={UI.badgeRose}><AlertCircle className="w-3 h-3" /> No stock</div>
                              )}
                            </td>
                            <td className={UI.td}>
                              {expiry ? (
                                <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${isExpired(expiry) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : isAtRisk(expiry) ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                                  <Calendar className="w-3 h-3" />
                                  {isExpired(expiry) ? 'EXPIRED' : expiry}
                                  {isAtRisk(expiry) && !isExpired(expiry) && ` · ${Math.ceil(daysUntilExpiry(expiry))}d`}
                                </div>
                              ) : (
                                <span className="text-gray-600 text-xs">—</span>
                              )}
                              {fefoEnabled && (() => {
                              const fefoLot = [...item.lots].filter(l => !l.qcHold && l.expiry)
                                .sort((a,b) => new Date(a.expiry)-new Date(b.expiry))[0];
                              return fefoLot ? (
                                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                                  <ArrowRight className="w-2.5 h-2.5" /> FEFO: {fefoLot.lotId}
                                </div>
                              ) : null;
                            })()}
                            {item.minShelfLifeDays > 0 && (
                                <div className="text-gray-600 text-xs mt-1">SLA: {item.minShelfLifeDays}d min</div>
                              )}
                            </td>
                            <td className={UI.td}>
                              <div className={`font-bold ${item.location.toLowerCase().includes('truck') ? 'text-blue-400 flex items-center gap-1' : 'text-gray-200'}`}>
                                {item.location.toLowerCase().includes('truck') && <Truck className="w-3.5 h-3.5" />}
                                {item.location}
                              </div>
                            </td>
                            <td className={UI.td}>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setLibrarySelectedId(item.id);
                                    setLibraryDraft(JSON.parse(JSON.stringify(item)));
                                    setActiveTab('library');
                                  }}
                                  className={`${UI.btnIcon} text-gray-500 hover:text-cyan-500 hover:bg-cyan-500/10`}
                                  title="Edit in Library"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteItem(item)} className={`${UI.btnIcon} text-gray-500 hover:text-rose-400 hover:bg-rose-500/10`} title="Delete SKU">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {pagedData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-600">
                            No items match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-950">
                    <span className="text-xs text-gray-500">
                      Page {page} of {totalPages} · {processedData.length} SKUs
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className={`${UI.btnIcon} text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30`}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className={`${UI.btnIcon} text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30`}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: LIBRARY — full item master editor ══ */}
          {activeTab === 'library' && (() => {
            // Resolve the selected item (live, not the draft, for stable references)
            const selectedItem = inventory.find(i => i.id === librarySelectedId) || null;
            const draft = libraryDraft;
            const isDirty = selectedItem && draft && JSON.stringify(selectedItem) !== JSON.stringify(draft);

            // ── DETAIL EDITOR — when an item is selected ──
            if (selectedItem && draft) {
              const setD  = (k, v) => setLibraryDraft(prev => ({ ...prev, [k]: v }));
              const setDS = (k, v) => setLibraryDraft(prev => ({ ...prev, specs: { ...(prev.specs || {}), [k]: v } }));
              const updateLot   = (idx, patch) => setLibraryDraft(prev => ({ ...prev, lots: prev.lots.map((l, i) => i === idx ? { ...l, ...patch } : l) }));
              const deleteLot   = (idx)        => setLibraryDraft(prev => ({ ...prev, lots: prev.lots.filter((_, i) => i !== idx) }));
              const addLot      = () => setLibraryDraft(prev => ({
                ...prev,
                lots: [...(prev.lots || []), {
                  lotId: `LOT-${Date.now().toString().slice(-5)}`, qty: 0, qcHold: false,
                  expiry: null, cost: prev.costBasis || prev.unitCost || 0,
                  supplier: prev.preferredVendorName || null,
                  receivedDate: new Date().toISOString().slice(0, 10),
                }],
              }));

              const physicalStock  = (draft.lots || []).reduce((s, l) => s + (Number(l.qty) || 0), 0);
              const heldStock      = (draft.lots || []).filter(l => l.qcHold).reduce((s, l) => s + (Number(l.qty) || 0), 0);
              const available      = physicalStock - heldStock - (Number(draft.allocatedStock) || 0);
              const valuation      = (draft.lots || []).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0), 0);
              const cwImplied      = (Number(draft.pricePerLb) || 0) * (Number(draft.avgWeightPerCase) || 0);
              const cwSanityOff    = draft.isCatchWeight && cwImplied > 0 && Number(draft.price) > 0
                && Math.abs(cwImplied - Number(draft.price)) / Number(draft.price) > 0.1;

              const handleSave = () => {
                const prevPhysical = selectedItem.physicalStock || 0;
                setInventory(prev => prev.map(i => {
                  if (i.id !== draft.id) return i;
                  const phys = (draft.lots || []).reduce((s, l) => s + (Number(l.qty) || 0), 0);
                  return { ...draft, physicalStock: phys };
                }));
                // Audit: roll up the change set as a single event with before/after diff
                const before = { name: selectedItem.name, price: selectedItem.price, costBasis: selectedItem.costBasis, lots: selectedItem.lots?.length, physicalStock: selectedItem.physicalStock };
                const after  = { name: draft.name, price: draft.price, costBasis: draft.costBasis, lots: draft.lots?.length, physicalStock };
                const qtyDelta = (physicalStock - prevPhysical);
                logAudit({
                  moduleId: 'inventory',
                  action: 'library.save',
                  entityType: 'sku', entityId: draft.sku || String(draft.id),
                  summary: `Saved Library edits to ${draft.name}${qtyDelta !== 0 ? ` (stock ${qtyDelta > 0 ? '+' : ''}${qtyDelta} ${draft.uom || ''})` : ''}`,
                  before, after,
                  severity: Math.abs(qtyDelta) > 10 ? 'warning' : Math.abs(qtyDelta) > 0 ? 'notice' : 'info',
                });
                setLibraryDraft({ ...draft, physicalStock });
                if (!DEMO_MODE && draft._productId) {
                  api.products.update(draft._productId, {
                    name:            draft.name,
                    category:        draft.category,
                    unit_of_measure: draft.uom,
                    price_per_unit:  Number(draft.price)     || null,
                    cost_per_unit:   Number(draft.costBasis) || null,
                    description:     draft.specs?.description || '',
                  }).catch(err => showApiToast(`Save failed: ${err.message}`));
                  if (qtyDelta !== 0) {
                    api.inventory.adjust(draft.id, {
                      delta:  qtyDelta,
                      reason: 'manual_library_edit',
                    }).catch(err => showApiToast(`Stock adjust failed: ${err.message}`));
                  } else {
                    api.inventory.update(draft.id, {
                      reorder_point: Number(draft.reorderPoint) || null,
                      reorder_qty:   Number(draft.reorderQty)   || null,
                      location_id:   draft.location             || null,
                    }).catch(err => showApiToast(`Save failed: ${err.message}`));
                  }
                }
              };

              const handleDeleteItem = () => setDeleteTarget(selectedItem);

              return (
                <div className="space-y-5">
                  {/* Locked banner — appears when strict mode is on and current user isn't admin */}
                  {libraryLocked && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                      <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-rose-300">Read-only — Strict inventory control is active</p>
                        <p className="text-xs text-gray-400 mt-0.5">Only admins can edit item master records. Stock moves must go through PO receipts or customer-order dispatch. Toggle off in <span className="text-rose-300">Loss Prevention → Lockdown</span>.</p>
                      </div>
                    </div>
                  )}
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <button onClick={() => { setLibrarySelectedId(null); setLibraryDraft(null); }} className={`${UI.btnGhost} px-2 py-2`} title="Back to Library">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold text-gray-100 truncate">{draft.name || '(Unnamed item)'}</h2>
                          {draft.isCatchWeight && (
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">Catch Weight</span>
                          )}
                          {isDirty && (
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse">Unsaved Changes</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{draft.sku} · {draft.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleDeleteItem} disabled={libraryLocked} className={`${UI.btnDanger} ${libraryLocked ? 'opacity-40 cursor-not-allowed' : ''}`}><Trash2 className="w-4 h-4" /> Delete</button>
                      <button onClick={handleSave} disabled={!isDirty || libraryLocked} className={`${UI.btnPrimary} ${(!isDirty || libraryLocked) ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                    </div>
                  </div>

                  {/* KPI strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Physical Stock</p><p className="text-2xl font-black text-gray-100 mt-1">{physicalStock} <span className="text-sm text-gray-500">{draft.uom}</span></p></div>
                    <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Allocated</p><p className="text-2xl font-black text-amber-400 mt-1">{draft.allocatedStock || 0}</p></div>
                    <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Available</p><p className={`text-2xl font-black mt-1 ${reorderAutoEnabled && available <= (draft.reorderPoint || 0) ? 'text-rose-400' : 'text-emerald-400'}`}>{available}</p></div>
                    <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Lot Valuation</p><p className="text-2xl font-black text-cyan-400 mt-1">${valuation.toFixed(2)}</p></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* IDENTITY */}
                    <div className={UI.cardPad}>
                      <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-cyan-500" /> Identity</h3>
                      <div className="space-y-3">
                        <div>
                          <label className={UI.label}>Item Name</label>
                          <input className={UI.input} value={draft.name || ''} onChange={e => setD('name', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={UI.label}>SKU</label><input className={`${UI.input} font-mono`} value={draft.sku || ''} onChange={e => setD('sku', e.target.value)} /></div>
                          <div><label className={UI.label}>Barcode (UPC)</label><input className={UI.input} value={draft.barcode || ''} onChange={e => setD('barcode', e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={UI.label}>Category</label>
                            <select className={UI.select} value={draft.category} onChange={e => setD('category', e.target.value)}>
                              <option value="meat">Meat</option><option value="poultry">Poultry</option><option value="produce">Produce</option><option value="dairy">Dairy</option>{frozenEnabled && <option value="frozen">Frozen</option>}<option value="bakery">Bakery</option><option value="dry goods">Dry Goods</option><option value="supplies">Supplies</option>
                            </select>
                          </div>
                          <div>
                            <label className={UI.label}>UoM</label>
                            <select className={UI.select} value={draft.uom} onChange={e => setD('uom', e.target.value)}>
                              <option value="case">Case</option><option value="pallet">Pallet</option><option value="bag">Bag</option><option value="jug">Jug</option><option value="pack">Pack</option><option value="each">Each</option>
                            </select>
                          </div>
                          <div><label className={UI.label}>Default Bin</label><input className={UI.input} value={draft.location || ''} onChange={e => setD('location', e.target.value)} /></div>
                        </div>
                      </div>
                    </div>

                    {/* PRICING */}
                    <div className={UI.cardPad}>
                      <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-cyan-500" /> Pricing</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={UI.label}>Sale Price (per UoM)</label><input type="number" step="0.01" className={UI.input} value={draft.price ?? 0} onChange={e => { const v = parseFloat(e.target.value) || 0; setLibraryDraft(prev => ({ ...prev, price: v, basePrice: v })); }} /></div>
                          <div><label className={UI.label}>Cost Basis (per UoM)</label><input type="number" step="0.01" className={UI.input} value={draft.costBasis ?? draft.unitCost ?? 0} onChange={e => { const v = parseFloat(e.target.value) || 0; setLibraryDraft(prev => ({ ...prev, costBasis: v, unitCost: v })); }} /></div>
                        </div>
                        {catchWeightEnabled && (
                        <label className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700 cursor-pointer">
                          <input type="checkbox" checked={!!draft.isCatchWeight} onChange={e => setD('isCatchWeight', e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                          <div className="flex-1">
                            <p className="font-bold text-gray-300 text-sm">Catch Weight Item</p>
                            <p className="text-xs text-gray-500">Sold by case, billed by actual pound captured at Pack &amp; Weigh.</p>
                          </div>
                        </label>
                        )}
                        {draft.isCatchWeight && (
                          <div className="ml-3 pl-3 border-l-2 border-cyan-500/40 space-y-3">
                            <p className="text-xs text-cyan-400 font-bold">Catch-Weight Pricing</p>
                            <div className="grid grid-cols-3 gap-3">
                              <div><label className={UI.label}>$ / lb</label><input type="number" step="0.01" className={UI.input} value={draft.pricePerLb ?? 0} onChange={e => setD('pricePerLb', parseFloat(e.target.value) || 0)} /></div>
                              <div><label className={UI.label}>Avg lb / case</label><input type="number" step="0.1" className={UI.input} value={draft.avgWeightPerCase ?? 0} onChange={e => setD('avgWeightPerCase', parseFloat(e.target.value) || 0)} /></div>
                              <div><label className={UI.label}>Variance %</label><input type="number" className={UI.input} value={draft.weightVariancePct ?? 8} onChange={e => setD('weightVariancePct', parseFloat(e.target.value) || 8)} /></div>
                            </div>
                            {cwImplied > 0 && (
                              <p className={`text-xs ${cwSanityOff ? 'text-amber-400' : 'text-gray-500'}`}>
                                Implied case price: <strong>${cwImplied.toFixed(2)}</strong>
                                {cwSanityOff && ' — differs from Sale Price by more than 10%'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SOURCING */}
                    <div className={UI.cardPad}>
                      <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-cyan-500" /> Sourcing</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={UI.label}>Preferred Vendor</label><input className={UI.input} value={draft.preferredVendorName || ''} onChange={e => setD('preferredVendorName', e.target.value)} /></div>
                          <div><label className={UI.label}>Vendor Product Code</label><input className={UI.input} value={draft.vendorProductCode || ''} onChange={e => setD('vendorProductCode', e.target.value)} /></div>
                        </div>
                        <div className={`grid gap-3 ${reorderAutoEnabled ? 'grid-cols-3' : 'grid-cols-1'}`}>
                          <div><label className={UI.label}>Lead Time (days)</label><input type="number" className={UI.input} value={draft.leadTimeDays ?? 3} onChange={e => setD('leadTimeDays', parseInt(e.target.value) || 0)} /></div>
                          {reorderAutoEnabled && <div><label className={UI.label}>Reorder Point</label><input type="number" className={UI.input} value={draft.reorderPoint ?? 0} onChange={e => setD('reorderPoint', parseInt(e.target.value) || 0)} /></div>}
                          {reorderAutoEnabled && <div><label className={UI.label}>Reorder Qty</label><input type="number" className={UI.input} value={draft.reorderQty ?? 0} onChange={e => setD('reorderQty', parseInt(e.target.value) || 0)} /></div>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={UI.label}>Min Shelf Life SLA (days)</label><input type="number" className={UI.input} value={draft.minShelfLifeDays ?? 0} onChange={e => setD('minShelfLifeDays', parseInt(e.target.value) || 0)} /></div>
                          <div><label className={UI.label}>Avg Daily Usage</label><input type="number" step="0.1" className={UI.input} value={draft.avgDailyUsage ?? 0} onChange={e => setD('avgDailyUsage', parseFloat(e.target.value) || 0)} /></div>
                        </div>
                      </div>
                    </div>

                    {/* SPECIFICATIONS */}
                    <div className={UI.cardPad}>
                      <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-500" /> Specifications</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={UI.label}>Origin</label><input className={UI.input} value={draft.specs?.origin || ''} onChange={e => setDS('origin', e.target.value)} placeholder="e.g. Omaha, NE" /></div>
                          <div><label className={UI.label}>Allergens</label><input className={UI.input} value={draft.specs?.allergens || ''} onChange={e => setDS('allergens', e.target.value)} placeholder="e.g. Milk, Soy" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className={UI.label}>Shelf Life</label><input className={UI.input} value={draft.specs?.shelfLife || ''} onChange={e => setDS('shelfLife', e.target.value)} placeholder="e.g. 6 months (Frozen)" /></div>
                          <div><label className={UI.label}>Storage</label><input className={UI.input} value={draft.specs?.storage || ''} onChange={e => setDS('storage', e.target.value)} placeholder="e.g. 0°F or below" /></div>
                        </div>
                        <div>
                          <label className={UI.label}>Description</label>
                          <textarea rows={3} className={UI.input} value={draft.specs?.description || ''} onChange={e => setDS('description', e.target.value)} placeholder="Product description for spec sheet" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COMPLIANCE — full width, read-only product-level record */}
                  {(() => {
                    const comp = ALLERGEN_DATA[draft.sku];
                    const allergenStatusPill = s =>
                      s === 'contains'    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'  :
                      s === 'may_contain' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                            'bg-gray-800 text-gray-600 border-gray-700';
                    const allergenStatusLabel = s =>
                      s === 'contains'    ? 'CONTAINS'    :
                      s === 'may_contain' ? 'MAY CONTAIN' : 'Free';

                    const hasContainsLib   = comp && !comp.nonFood && BIG_9.some(a => comp.allergens[a.id] === 'contains');
                    const hasMayContainLib = comp && !comp.nonFood && BIG_9.some(a => comp.allergens[a.id] === 'may_contain');

                    return (
                      <div className={UI.cardPad}>
                        <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-cyan-500" /> FDA Compliance
                          <span className="text-[10px] font-normal text-gray-500 ml-1">— read-only product record · open a lot for full nutrition label</span>
                        </h3>

                        {!comp ? (
                          <p className="text-sm text-gray-500 italic">No compliance data on file for SKU <span className="font-mono text-gray-400">{draft.sku}</span>.</p>
                        ) : comp.nonFood ? (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-800 border border-gray-700 text-xs">
                            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-cyan-400">Non-Food Supply Item</p>
                              <p className="text-gray-400 mt-0.5">FDA allergen declarations and Nutrition Facts are not applicable. {comp.certifications.join(' · ')}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Warning banner */}
                            {hasContainsLib && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-bold">Contains Major Allergen(s)</span>
                                <span className="text-rose-300/70">— required on all customer-facing labels and invoices</span>
                              </div>
                            )}
                            {!hasContainsLib && hasMayContainLib && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-bold">May Contain Allergen(s)</span>
                                <span className="text-amber-300/70">— advisory disclosure required</span>
                              </div>
                            )}
                            {!hasContainsLib && !hasMayContainLib && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-bold">Free From All Big 9 Allergens</span>
                              </div>
                            )}

                            {/* Allergen grid */}
                            <div className="grid grid-cols-5 gap-1.5">
                              {BIG_9.map(a => (
                                <div key={a.id} className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center ${allergenStatusPill(comp.allergens[a.id])}`}>
                                  <span className="text-[9px] font-bold leading-tight">{a.label}</span>
                                  <span className="text-[8px] mt-0.5 opacity-75">{allergenStatusLabel(comp.allergens[a.id])}</span>
                                </div>
                              ))}
                            </div>

                            {/* Origin + certs */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-gray-500">Origin:</span>
                              <span className="text-gray-300 font-medium">{comp.countryOfOrigin}</span>
                              {comp.certifications.map(c => (
                                <span key={c} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* LOTS — full width */}
                  <div className={UI.cardPad}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><Package className="w-4 h-4 text-cyan-500" /> Lots <span className="text-xs text-gray-500 font-normal">({(draft.lots || []).length})</span>{libraryLocked && <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded">Locked</span>}</h3>
                      <button onClick={addLot} disabled={libraryLocked} className={`${UI.btnSecondary} ${libraryLocked ? 'opacity-40 cursor-not-allowed' : ''}`}><Plus className="w-3.5 h-3.5" /> Add Lot</button>
                    </div>
                    {(draft.lots || []).length === 0 ? (
                      <p className="text-center text-gray-500 italic text-sm py-6">No lots — item is at zero stock. Click "Add Lot" or receive against a PO.</p>
                    ) : (
                      <div className="border border-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-950/60 border-b border-gray-800">
                            <tr>
                              <th className={UI.th}>Lot ID</th>
                              <th className={`${UI.th} text-right`}>Qty</th>
                              <th className={UI.th}>Expiry</th>
                              <th className={UI.th}>Supplier</th>
                              <th className={`${UI.th} text-right`}>Cost</th>
                              <th className={`${UI.th} text-center`}>QC Hold</th>
                              <th className={UI.th}></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/60">
                            {(draft.lots || []).map((l, idx) => (
                              <tr key={idx} className={`hover:bg-gray-800/30 ${l.qcHold ? 'bg-rose-500/5' : ''}`}>
                                <td className="px-3 py-2"><input disabled={libraryLocked} className={`${UI.inputSm} w-full font-mono text-xs ${libraryLocked ? 'opacity-60' : ''}`} value={l.lotId || ''} onChange={e => updateLot(idx, { lotId: e.target.value })} /></td>
                                <td className="px-3 py-2"><input disabled={libraryLocked} type="number" min="0" className={`${UI.inputSm} w-20 text-right ${libraryLocked ? 'opacity-60' : ''}`} value={l.qty ?? 0} onChange={e => updateLot(idx, { qty: parseInt(e.target.value) || 0 })} /></td>
                                <td className="px-3 py-2"><input disabled={libraryLocked} type="date" className={`${UI.inputSm} w-full ${libraryLocked ? 'opacity-60' : ''}`} value={l.expiry || ''} onChange={e => updateLot(idx, { expiry: e.target.value })} /></td>
                                <td className="px-3 py-2"><input disabled={libraryLocked} className={`${UI.inputSm} w-full ${libraryLocked ? 'opacity-60' : ''}`} value={l.supplier || ''} onChange={e => updateLot(idx, { supplier: e.target.value })} placeholder="—" /></td>
                                <td className="px-3 py-2"><input disabled={libraryLocked} type="number" step="0.01" className={`${UI.inputSm} w-24 text-right ${libraryLocked ? 'opacity-60' : ''}`} value={l.cost ?? 0} onChange={e => updateLot(idx, { cost: parseFloat(e.target.value) || 0 })} /></td>
                                <td className="px-3 py-2 text-center">
                                  <button disabled={libraryLocked} onClick={() => updateLot(idx, { qcHold: !l.qcHold })} className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${l.qcHold ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'} ${libraryLocked ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                    {l.qcHold ? 'On Hold' : 'Clear'}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button disabled={libraryLocked} onClick={() => deleteLot(idx)} className={`text-gray-500 hover:text-rose-400 p-1 ${libraryLocked ? 'opacity-40 cursor-not-allowed' : ''}`}><Trash2 className="w-3.5 h-3.5" /></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Save reinforcement bar */}
                  {isDirty && (
                    <div className="sticky bottom-4 flex justify-end gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md">
                      <span className="text-xs text-amber-300 self-center mr-2">You have unsaved changes</span>
                      <button onClick={() => setLibraryDraft(JSON.parse(JSON.stringify(selectedItem)))} className={UI.btnGhost}>Discard</button>
                      <button onClick={handleSave} className={UI.btnPrimary}><Save className="w-4 h-4" /> Save Changes</button>
                    </div>
                  )}
                </div>
              );
            }

            // ── GRID VIEW — when no item is selected ──
            const categories = ['All', ...Array.from(new Set(inventory.map(i => i.category))).sort()];
            const visibleItems = inventory.filter(i => {
              const q = librarySearch.toLowerCase();
              const matchSearch = !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
              const matchCat    = libraryCatFilter === 'All' || i.category === libraryCatFilter;
              return matchSearch && matchCat;
            }).sort((a, b) => a.name.localeCompare(b.name));

            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2"><BookOpen className="w-5 h-5 text-cyan-500" /> Inventory Library</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Full item master — click any SKU to edit all details (pricing, sourcing, lots, specs).</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input value={librarySearch} onChange={e => setLibrarySearch(e.target.value)} placeholder="Search SKU or name…" className={`${UI.input} pl-9 w-64`} />
                    </div>
                    <select value={libraryCatFilter} onChange={e => setLibraryCatFilter(e.target.value)} className={`${UI.select} w-auto`}>
                      {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
                    </select>
                    <button onClick={() => setIsItemModalOpen(true)} className={UI.btnPrimary}><Plus className="w-4 h-4" /> Add SKU</button>
                  </div>
                </div>

                {visibleItems.length === 0 ? (
                  <div className={`${UI.cardPad} text-center text-gray-500 italic`}>No items match this filter.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleItems.map(item => {
                      const available = getAvailableStock(item.lots);
                      const earliest  = getEarliestExpiry(item.lots);
                      const stockState = available <= 0 ? 'rose' : (reorderAutoEnabled && available <= (item.reorderPoint || 0)) ? 'amber' : 'emerald';
                      const stockMap = {
                        rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
                        amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      };
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setLibrarySelectedId(item.id); setLibraryDraft(JSON.parse(JSON.stringify(item))); }}
                          className={`${UI.cardPad} text-left transition-colors hover:border-cyan-500/40`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-100 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{item.sku}</p>
                            </div>
                            {item.isCatchWeight && <span className="shrink-0 text-[9px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">CW</span>}
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                            <div>
                              <p className="text-gray-500 text-[10px] uppercase">Stock</p>
                              <p className={`font-bold px-1.5 py-0.5 rounded border inline-block ${stockMap[stockState]}`}>{available} {item.uom}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-[10px] uppercase">Category</p>
                              <p className="text-gray-200 capitalize">{item.category}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-[10px] uppercase">Price</p>
                              <p className="text-gray-200 font-bold">${(item.price ?? 0).toFixed(2)}{item.isCatchWeight ? '/case' : ''}</p>
                            </div>
                          </div>
                          {earliest && (
                            <p className="text-[10px] text-gray-500 mt-2">Earliest expiry: {earliest}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══ TAB: QUALITY CONTROL ══ */}
          {activeTab === 'qc' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-rose-300">Lot Quarantines & Holds</h3>
                  <p className="text-sm text-rose-400/70 mt-0.5">Held lots are excluded from ATP calculations and bypassed by the FEFO picking algorithm.</p>
                </div>
              </div>

              <div className={`${UI.card} overflow-hidden`}>
                <table className="w-full text-left text-sm">
                  <thead className={UI.tableHead}>
                    <tr>
                      <th className={UI.th}>Item</th>
                      <th className={UI.th}>Lot ID</th>
                      <th className={UI.th}>Qty</th>
                      <th className={UI.th}>Received</th>
                      <th className={UI.th}>Temp at Dock</th>
                      <th className={UI.th}>Hold Reason</th>
                      <th className={UI.th}>Status</th>
                      {fefoEnabled && <th className={UI.th}>Pick Order</th>}
                      <th className={`${UI.th} text-right`}>Action</th>
                      <th className={`${UI.th} text-right`}>Docs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.flatMap(item => {
                      // FEFO: earliest-expiry non-held lot is the pick lot
                      const fefoLot = fefoEnabled
                        ? [...item.lots].filter(l => !l.qcHold && l.expiry)
                            .sort((a,b) => new Date(a.expiry) - new Date(b.expiry))[0]
                        : null;
                      return item.lots.map(lot => (
                        <tr key={`${item.id}-${lot.lotId}`} className={lot.qcHold ? 'bg-rose-950/20 border-b border-gray-800' : UI.tableRow}>
                          <td className={UI.td}>
                            <div className="font-bold text-gray-100">{item.name}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">{item.sku}</div>
                          </td>
                          <td className={UI.td}><span className="font-mono font-bold text-gray-300">{lot.lotId}</span></td>
                          <td className={UI.td}><span className="font-semibold">{lot.qty}</span> <span className="text-gray-500">{item.uom}</span>
                            {item.isCatchWeight && lot.actualWeight && (
                              <div className="text-xs text-cyan-500 mt-0.5">{lot.actualWeight} lbs</div>
                            )}
                          </td>
                          <td className={UI.td}>
                            <div className="text-xs text-gray-400">{lot.receivedDate ? new Date(lot.receivedDate).toLocaleDateString() : '—'}</div>
                            <div className="text-xs text-gray-600">{lot.supplierId}</div>
                          </td>
                          <td className={UI.td}>
                            {lot.receivedTemp != null
                              ? <span className={`inline-flex items-center gap-1 text-xs font-bold ${lot.receivedTemp > 40 ? 'text-rose-400' : 'text-emerald-400'}`}><Thermometer className="w-3 h-3" /> {lot.receivedTemp}°F</span>
                              : <span className="text-gray-600 text-xs">N/A</span>
                            }
                          </td>
                          <td className={UI.td}>
                            {lot.qcHoldReason
                              ? <span className="text-xs text-rose-300">{lot.qcHoldReason}</span>
                              : <span className="text-gray-600 text-xs">—</span>
                            }
                          </td>
                          <td className={UI.td}>
                            {lot.qcHold
                              ? <span className={UI.badgeRose}><Lock className="w-3 h-3" /> QC HOLD</span>
                              : <span className={UI.badgeEmerald}><CheckCircle2 className="w-3 h-3" /> CLEARED</span>
                            }
                          </td>
                          {fefoEnabled && (
                            <td className={UI.td}>
                              {fefoLot && fefoLot.lotId === lot.lotId && !lot.qcHold
                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                                    <ArrowRight className="w-2.5 h-2.5" /> FEFO PICK
                                  </span>
                                : <span className="text-gray-700 text-xs">—</span>
                              }
                            </td>
                          )}
                          <td className={`${UI.td} text-right`}>
                            <button
                              onClick={() => toggleQCHold(item.id, lot.lotId)}
                              className={lot.qcHold ? UI.btnSecondary : UI.btnDanger}>
                              {lot.qcHold ? <><CheckCircle2 className="w-3 h-3" /> Release</> : <><Lock className="w-3 h-3" /> Hold</>}
                            </button>
                          </td>
                          <td className={`${UI.td} text-right`}>
                            <button
                              onClick={() => setLotAttOpen(lot.lotId)}
                              className={`${UI.btnSecondary} text-xs py-1`}
                              title="Docs, Compliance & Chain of Custody"
                            >
                              <Paperclip className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ TAB: WAREHOUSE OPS ══ */}
          {activeTab === 'recall' && (() => {
            const hazardColors = {
              HIGH:   { badge:'bg-rose-500 text-white', border:'border-rose-500/40', text:'text-rose-400', glow:'bg-rose-500/10' },
              MEDIUM: { badge:'bg-amber-400 text-gray-950', border:'border-amber-400/40', text:'text-amber-400', glow:'bg-amber-400/10' },
              LOW:    { badge:'bg-sky-400 text-gray-950', border:'border-sky-400/30', text:'text-sky-400', glow:'bg-sky-400/10' },
            };
            const r = recallResult;
            const allLots = Object.keys(RECALL_TRACE);
            const dispatchedQty = r ? r.dispatches.reduce((s,d)=>s+d.qty,0) : 0;
            const notifiedCount = r ? r.dispatches.filter(d=>recallNotified[d.orderId]).length : 0;
            const returnedCount = r ? r.dispatches.filter(d=>recallReturned[d.orderId]).length : 0;
            const hc = r ? hazardColors[r.hazardLevel] : null;
            const recallViews = [
              { id:'summary',       label:'Impact Summary' },
              { id:'notifications', label:'Customer Notifications' },
              { id:'custody',       label:'Chain of Custody' },
              { id:'fda',           label:'FDA Report (21 CFR 7)' },
              { id:'letter',        label:'Recall Notice Letter' },
            ];
            return (
              <div className="space-y-5">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                      <AlertOctagon className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-100 text-lg">Recall Simulation</h2>
                      <p className="text-xs text-gray-500">Select a lot to trace its full distribution chain and generate FDA-ready recall documentation.</p>
                    </div>
                  </div>
                  {r && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
                      <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                      Simulated {recallSimDate}
                    </div>
                  )}
                </div>

                {/* ── Lot selector ── */}
                <div className={`${UI.card} p-5`}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Step 1 — Select Lot to Recall</p>
                  <div className="flex gap-3 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs text-gray-500 mb-1">Lot ID</label>
                      <select value={recallLotId} onChange={e => { setRecallLotId(e.target.value); setRecallResult(null); }}
                        className={UI.select}>
                        <option value="">— Choose a lot —</option>
                        {allLots.map(lid => {
                          const t = RECALL_TRACE[lid];
                          return <option key={lid} value={lid}>{lid} — {t.itemName} ({t.hazardLevel})</option>;
                        })}
                      </select>
                    </div>
                    {recallLotId && !recallResult && (
                      <div className="text-xs text-gray-400 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                        <p className="font-bold text-gray-200">{RECALL_TRACE[recallLotId].itemName}</p>
                        <p>Supplier: {RECALL_TRACE[recallLotId].supplierName}</p>
                        <p>Received: {RECALL_TRACE[recallLotId].receivedDate} · Qty: {RECALL_TRACE[recallLotId].receivedQty} {RECALL_TRACE[recallLotId].uom}</p>
                      </div>
                    )}
                    <button
                      onClick={handleRunRecall}
                      disabled={!recallLotId || recallRunning}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20">
                      {recallRunning
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Tracing…</>
                        : <><AlertOctagon className="w-4 h-4" /> {recallResult ? 'Re-Simulate' : 'Simulate Recall'}</>
                      }
                    </button>
                  </div>
                </div>

                {/* ── Results ── */}
                {r && (() => {
                  return (
                    <div className={`border-2 rounded-2xl overflow-hidden ${hc.border}`}>

                      {/* Result header bar */}
                      <div className={`${hc.glow} border-b ${hc.border} px-6 py-4 flex items-center justify-between flex-wrap gap-3`}>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${hc.badge}`}>
                            <AlertOctagon className="w-3.5 h-3.5" /> {r.hazardLevel} — {r.recallClass}
                          </span>
                          <div>
                            <p className="font-black text-gray-100 text-base">{r.itemName}</p>
                            <p className="text-xs text-gray-400">Lot <span className="font-mono font-bold text-gray-200">{r.lotId}</span> · SKU {r.sku} · Supplier: {r.supplierName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Customers to Notify</p>
                            <p className={`text-2xl font-black ${hc.text}`}>{r.dispatches.length}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Units Dispatched</p>
                            <p className="text-2xl font-black text-gray-100">{dispatchedQty}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Still in Warehouse</p>
                            <p className="text-2xl font-black text-gray-100">{r.remainingQty}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sub-nav */}
                      <div className="bg-gray-900 border-b border-gray-800 flex overflow-x-auto">
                        {recallViews.map(v => (
                          <button key={v.id} onClick={() => setRecallView(v.id)}
                            className={`px-5 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${recallView === v.id ? 'text-rose-400 border-b-2 border-rose-400 bg-rose-500/5' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>
                            {v.label}
                          </button>
                        ))}
                      </div>

                      <div className="bg-gray-900/50 p-6">

                        {/* ── VIEW: IMPACT SUMMARY ── */}
                        {recallView === 'summary' && (
                          <div className="space-y-5">
                            {/* KPI row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                { label:'Total Received',      value:`${r.receivedQty} ${r.uom}`,         sub:'From supplier',              color:'text-gray-100' },
                                { label:'Dispatched to Market',value:`${dispatchedQty} ${r.uom}`,          sub:`Across ${r.dispatches.length} customers`, color:hc.text },
                                { label:'Remaining in House',  value:`${r.remainingQty} ${r.uom}`,         sub:'Quarantine immediately',     color:'text-cyan-400' },
                                { label:'Notifications Sent',  value:`${notifiedCount} / ${r.dispatches.length}`, sub:'Track below',         color:'text-emerald-400' },
                              ].map(k => (
                                <div key={k.label} className={`${UI.card} p-4`}>
                                  <p className="text-xs text-gray-500 font-medium mb-1">{k.label}</p>
                                  <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                                  <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
                                </div>
                              ))}
                            </div>

                            {/* Recall reason */}
                            <div className={`rounded-xl border p-4 ${hc.glow} ${hc.border}`}>
                              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                                <FileWarning className="w-3.5 h-3.5" /> Recall Reason / Health Hazard Assessment
                              </p>
                              <p className="text-sm text-gray-200 leading-relaxed">{r.recallReason}</p>
                            </div>

                            {/* Backward trace — supplier chain */}
                            <div className={`${UI.card} p-5`}>
                              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Backward Trace — Source Chain</p>
                              <div className="flex items-start gap-0">
                                {/* Supplier node */}
                                <div className="flex flex-col items-center gap-1 mr-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center"><Building2 className="w-4 h-4 text-gray-400" /></div>
                                  <div className="w-0.5 flex-1 bg-gray-700 min-h-[40px]" />
                                </div>
                                <div className="flex-1 mb-4">
                                  <p className="font-bold text-gray-200 text-sm">{r.supplierName}</p>
                                  <p className="text-xs text-gray-500">{r.supplierContact} · {r.supplierPhone} · {r.supplierEmail}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-0">
                                {/* PO node */}
                                <div className="flex flex-col items-center gap-1 mr-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center"><FileText className="w-4 h-4 text-gray-400" /></div>
                                  <div className="w-0.5 flex-1 bg-gray-700 min-h-[40px]" />
                                </div>
                                <div className="flex-1 mb-4">
                                  <p className="font-bold text-gray-200 text-sm">PO: <span className="font-mono text-cyan-400">{r.poNumber}</span></p>
                                  <p className="text-xs text-gray-500">Purchase order associated with this delivery</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-0">
                                {/* Receiving node */}
                                <div className="flex flex-col items-center gap-1 mr-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div>
                                  <div className="w-0.5 flex-1 bg-gray-700 min-h-[40px]" />
                                </div>
                                <div className="flex-1 mb-4">
                                  <p className="font-bold text-gray-200 text-sm">Received at Warehouse</p>
                                  <p className="text-xs text-gray-500">
                                    Date: {r.receivedDate} · Received by: {r.receivedBy}
                                    {r.receivedTemp && ` · Temp: ${r.receivedTemp}°F`}
                                    {r.receivedTemp && r.receivedTemp > 41 && <span className="text-rose-400 font-bold ml-1"> ⚠ TEMP EXCURSION</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-0">
                                {/* Lot node */}
                                <div className="flex flex-col items-center gap-1 mr-2">
                                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${hc.glow} border-current`}>
                                    <AlertOctagon className={`w-4 h-4 ${hc.text}`} />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className={`font-black text-sm ${hc.text}`}>Lot {r.lotId} — RECALLED</p>
                                  <p className="text-xs text-gray-500">{r.receivedQty} {r.uom} received · Expiry: {r.expiryDate || 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Immediate actions checklist */}
                            <div className={`${UI.card} p-5`}>
                              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Immediate Action Checklist</p>
                              <div className="space-y-2">
                                {[
                                  { done: true,  text: `Quarantine ${r.remainingQty} ${r.uom} of Lot ${r.lotId} in warehouse — do not pick or ship` },
                                  { done: false, text: `Contact supplier ${r.supplierName} to confirm recall scope and obtain written notice` },
                                  { done: false, text: `Notify all ${r.dispatches.length} affected customer${r.dispatches.length !== 1?'s':''} (see Customer Notifications tab)` },
                                  { done: false, text: `File FDA recall notification per 21 CFR Part 7 (see FDA Report tab)` },
                                  { done: false, text: `Arrange product return or destruction — document lot disposition` },
                                  { done: false, text: `Initiate RTV with ${r.supplierName} for warehouse stock and returned units` },
                                  { done: false, text: `Update internal records and close lot in ERM` },
                                ].map((item, i) => (
                                  <div key={i} className="flex items-start gap-3">
                                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'border-2 border-gray-600'}`}>
                                      {item.done && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <p className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{item.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── VIEW: CUSTOMER NOTIFICATIONS ── */}
                        {recallView === 'notifications' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-200">Customer Notification Tracker</p>
                                <p className="text-xs text-gray-500 mt-0.5">{notifiedCount} of {r.dispatches.length} notified · {returnedCount} returns confirmed</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`text-xs px-3 py-1 rounded-full font-bold ${notifiedCount === r.dispatches.length ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                  {notifiedCount === r.dispatches.length ? '✓ All Notified' : `${r.dispatches.length - notifiedCount} Pending`}
                                </div>
                              </div>
                            </div>

                            {r.dispatches.length === 0 ? (
                              <div className={`${UI.card} p-10 text-center`}>
                                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                <p className="font-bold text-gray-200">No customers to notify</p>
                                <p className="text-sm text-gray-500 mt-1">This lot was never dispatched. Only warehouse quarantine is required.</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {r.dispatches.map(d => {
                                  const isNotified = !!recallNotified[d.orderId];
                                  const isReturned = !!recallReturned[d.orderId];
                                  return (
                                    <div key={d.orderId} className={`${UI.card} p-4 transition-all ${isNotified ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-gray-100">{d.customer}</p>
                                            <span className="font-mono text-xs text-gray-500">{d.orderId}</span>
                                            {isNotified && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400"><CheckCircle className="w-3 h-3" /> Notified</span>}
                                            {isReturned && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-sky-400/20 text-sky-400"><Package className="w-3 h-3" /> Returned</span>}
                                          </div>
                                          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{d.contact}</span>
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>
                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Delivered {d.deliveredDate}</span>
                                            <span className="font-bold text-gray-300">{d.qty} {r.uom} received</span>
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                          <button
                                            onClick={() => setRecallNotified(prev => ({ ...prev, [d.orderId]: !isNotified }))}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isNotified ? 'bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400' : 'bg-gray-800 text-gray-300 hover:bg-emerald-500/20 hover:text-emerald-400 border border-gray-700'}`}>
                                            {isNotified ? <><CheckCircle className="w-3.5 h-3.5" /> Notified</> : <><Phone className="w-3.5 h-3.5" /> Mark Notified</>}
                                          </button>
                                          {isNotified && (
                                            <button
                                              onClick={() => setRecallReturned(prev => ({ ...prev, [d.orderId]: !isReturned }))}
                                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isReturned ? 'bg-sky-400/20 text-sky-400' : 'bg-gray-800 text-gray-400 hover:bg-sky-400/20 hover:text-sky-400 border border-gray-700'}`}>
                                              <Package className="w-3.5 h-3.5" /> {isReturned ? 'Return Confirmed' : 'Confirm Return'}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── VIEW: CHAIN OF CUSTODY ── */}
                        {recallView === 'custody' && (
                          <div className="space-y-4">
                            <p className="font-bold text-gray-200">Full Chain of Custody — Lot {r.lotId}</p>
                            <div className="space-y-0">
                              {/* Timeline events */}
                              {[
                                {
                                  date: r.receivedDate, event: 'Received at Warehouse',
                                  detail: `${r.receivedQty} ${r.uom} received from ${r.supplierName} via PO ${r.poNumber}. Temp: ${r.receivedTemp ? r.receivedTemp+'°F' : 'N/A'}. Received by: ${r.receivedBy}.`,
                                  icon: Package, color: 'text-cyan-400', dot: 'bg-cyan-500',
                                },
                                ...r.dispatches.map(d => ({
                                  date: d.deliveredDate, event: `Dispatched — ${d.customer}`,
                                  detail: `Order ${d.orderId}: ${d.qty} ${r.uom} delivered to ${d.customer}. Contact: ${d.contact} (${d.phone}).`,
                                  icon: Truck, color: 'text-gray-400', dot: 'bg-gray-600',
                                })),
                                {
                                  date: new Date().toISOString().split('T')[0], event: 'Recall Initiated (Simulation)',
                                  detail: `Recall simulated at ${recallSimDate}. ${r.remainingQty} ${r.uom} remain in warehouse pending quarantine. ${r.dispatches.length} customer notification${r.dispatches.length !== 1?'s':''} required.`,
                                  icon: AlertOctagon, color: hc.text, dot: r.hazardLevel === 'HIGH' ? 'bg-rose-500' : r.hazardLevel === 'MEDIUM' ? 'bg-amber-400' : 'bg-sky-400',
                                },
                              ].sort((a,b) => a.date.localeCompare(b.date)).map((ev, i, arr) => (
                                <div key={i} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${ev.dot}`} />
                                    {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-gray-700 my-1 min-h-[24px]" />}
                                  </div>
                                  <div className="pb-5 flex-1">
                                    <div className="flex items-center gap-2">
                                      <ev.icon className={`w-3.5 h-3.5 ${ev.color}`} />
                                      <span className="text-xs text-gray-500 font-mono">{ev.date}</span>
                                      <span className={`font-bold text-sm ${ev.color}`}>{ev.event}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 ml-5">{ev.detail}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── VIEW: FDA REPORT ── */}
                        {recallView === 'fda' && (() => {
                          const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-gray-200">FDA Recall Report — 21 CFR Part 7</p>
                                <ExportButton />
                              </div>
                              <div className="bg-white text-gray-900 rounded-xl p-8 text-sm space-y-5 shadow-inner">
                                <div className="text-center border-b-2 border-gray-900 pb-4">
                                  <p className="text-lg font-black uppercase tracking-widest">Recall Notification</p>
                                  <p className="text-sm">Submitted pursuant to 21 CFR Part 7 — Enforcement Policy</p>
                                  <p className="text-xs text-gray-500 mt-1">Date: {today}</p>
                                </div>
                                {[
                                  { label:'1. Recalling Firm', value:`${COMPANY_INFO.name}\n${COMPANY_INFO.address}\n${COMPANY_INFO.city}\nPhone: ${COMPANY_INFO.phone}\nFDA Registration #: ${COMPANY_INFO.fdaRegId}` },
                                  { label:'2. Product Description', value:`${r.itemName}
SKU: ${r.sku}
Lot Number: ${r.lotId}
Expiration Date: ${r.expiryDate || 'N/A'}
Unit of Measure: ${r.uom}
Product Category: ${r.category}` },
                                  { label:'3. Reason for Recall', value:r.recallReason },
                                  { label:'4. Recall Classification', value:`${r.recallClass}
${r.hazardLevel === 'HIGH' ? 'Class I: Reasonable probability that use will cause serious adverse health consequences or death.' : r.hazardLevel === 'MEDIUM' ? 'Class II: Use may cause temporary adverse health consequences; probability of serious adverse health consequences is remote.' : 'Class III: Use not likely to cause any adverse health consequences.'}` },
                                  { label:'5. Supplier / Manufacturer', value:`${r.supplierName}
Contact: ${r.supplierContact}
Phone: ${r.supplierPhone}
Email: ${r.supplierEmail}
Linked PO: ${r.poNumber}
Date Received: ${r.receivedDate}` },
                                  { label:'6. Distribution Pattern', value:`Product distributed to ${r.dispatches.length} customer location${r.dispatches.length !== 1?'s':''} across the New Orleans metropolitan area.
${r.dispatches.map(d=>`• ${d.customer} — ${d.qty} ${r.uom} — Delivered ${d.deliveredDate}`).join('\n') || '• No external distribution. Product remains in warehouse.'}` },
                                  { label:'7. Quantity Distributed', value:`Total received: ${r.receivedQty} ${r.uom}
Total dispatched: ${dispatchedQty} ${r.uom}
Remaining in warehouse: ${r.remainingQty} ${r.uom}` },
                                  { label:'8. Action Taken / Proposed', value:`• Warehouse stock (${r.remainingQty} ${r.uom}) quarantined immediately upon recall initiation.
• All ${r.dispatches.length} affected customer${r.dispatches.length !== 1?'s':''} contacted via phone and email.
• Return-to-vendor (RTV) initiated with ${r.supplierName}.
• Product to be destroyed or returned to supplier per FDA guidance.` },
                                  { label:'9. Effectiveness Checks', value:`Kernel Food Distribution will conduct follow-up contact with all notified customers within 72 hours to confirm product has been removed from service. Disposition records will be maintained for a minimum of 2 years per 21 CFR 7.59.` },
                                ].map(field => (
                                  <div key={field.label} className="space-y-1">
                                    <p className="font-black text-xs uppercase tracking-widest text-gray-500">{field.label}</p>
                                    <p className="whitespace-pre-line text-sm text-gray-800 pl-3 border-l-2 border-gray-200">{field.value}</p>
                                  </div>
                                ))}
                                <div className="border-t-2 border-gray-900 pt-4 grid grid-cols-2 gap-12">
                                  <div><div className="border-b-2 border-gray-900 mb-1 h-8" /><p className="text-xs text-gray-500">Authorized Signatory &amp; Title</p></div>
                                  <div><div className="border-b-2 border-gray-900 mb-1 h-8" /><p className="text-xs text-gray-500">Date</p></div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* ── VIEW: RECALL NOTICE LETTER ── */}
                        {recallView === 'letter' && (() => {
                          const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-gray-200">Recall Notice Letter — Send to Each Customer</p>
                                <ExportButton />
                              </div>
                              <div className="bg-white text-gray-900 rounded-xl p-10 text-sm space-y-5 shadow-inner leading-relaxed">
                                <div>
                                  <p className="font-black text-lg">{COMPANY_INFO.name}</p>
                                  <p className="text-gray-500 text-xs">{COMPANY_INFO.address} · {COMPANY_INFO.city}</p>
                                  <p className="text-gray-500 text-xs">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
                                </div>
                                <p className="text-xs text-gray-500">{today}</p>
                                <div>
                                  <p className="font-bold">[Customer Name]</p>
                                  <p className="text-gray-500 text-xs">[Customer Address]</p>
                                </div>
                                <p className="font-black text-base uppercase tracking-wide text-rose-600">⚠ URGENT: Voluntary Product Recall Notice</p>
                                <p>Dear [Customer Contact Name],</p>
                                <p>We are writing to inform you of a voluntary recall of the following product that was delivered to your facility by Kernel Food Distribution LLC:</p>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1">
                                  <p><strong>Product:</strong> {r.itemName}</p>
                                  <p><strong>SKU:</strong> {r.sku}</p>
                                  <p><strong>Lot Number:</strong> {r.lotId}</p>
                                  <p><strong>Expiration Date:</strong> {r.expiryDate || 'N/A'}</p>
                                  <p><strong>Quantity Delivered:</strong> [QTY] {r.uom}</p>
                                  <p><strong>Delivery Date:</strong> [DELIVERY DATE]</p>
                                  <p><strong>Your Order Reference:</strong> [ORDER ID]</p>
                                </div>
                                <div>
                                  <p className="font-bold mb-1">Reason for Recall:</p>
                                  <p>{r.recallReason}</p>
                                </div>
                                <div>
                                  <p className="font-bold mb-1">What You Should Do Immediately:</p>
                                  <ol className="list-decimal pl-5 space-y-1">
                                    <li><strong>Stop using and serving</strong> this product immediately.</li>
                                    <li><strong>Quarantine</strong> all remaining product from the above lot number — do not discard until instructed.</li>
                                    <li><strong>Contact us</strong> at (504) 555-9100 or purchasing@kernaldist.com to arrange product return and credit within <strong>48 hours</strong> of receiving this notice.</li>
                                    <li><strong>Do not return</strong> product to store shelves or use in food preparation until you receive written clearance from us.</li>
                                  </ol>
                                </div>
                                <p>Kernel Food Distribution will arrange pickup of all recalled product at no cost to you. A full credit or replacement will be issued upon return. We sincerely apologize for any inconvenience this recall may cause.</p>
                                <p>This recall is being conducted in accordance with FDA regulations (21 CFR Part 7). If you have any questions or require additional documentation, please do not hesitate to contact us.</p>
                                <div className="pt-4 space-y-1">
                                  <p>Sincerely,</p>
                                  <div className="border-b border-gray-400 w-48 my-4" />
                                  <p className="font-bold">Quality Assurance &amp; Compliance</p>
                                  <p>Kernel Food Distribution LLC</p>
                                  <p className="text-gray-500">(504) 555-9100 · purchasing@kernaldist.com</p>
                                </div>
                              </div>
                              {r.dispatches.length > 0 && (
                                <div className={`${UI.card} p-4`}>
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Send to each of these {r.dispatches.length} customers:</p>
                                  <div className="space-y-2">
                                    {r.dispatches.map(d => (
                                      <div key={d.orderId} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-800 last:border-0">
                                        <span className="font-bold text-gray-200">{d.customer}</span>
                                        <span className="text-gray-500">{d.contact}</span>
                                        <span className="text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</span>
                                        <span className="text-gray-500">{d.qty} {r.uom} · {d.deliveredDate}</span>
                                        <span className={`font-bold ${recallNotified[d.orderId] ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {recallNotified[d.orderId] ? '✓ Notified' : '⚠ Pending'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })()}

          {/* ══ TAB: REPORTS ══ */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className={UI.cardPadded}>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-500" /> Total Inventory Value</div>
                  <div className="text-4xl font-bold text-gray-100">${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-gray-600 mt-2">Calculated at lot-level cost. Includes QC-held lots.</p>
                </div>
                <div className={UI.cardPadded}>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-rose-400" /> Value on QC Hold</div>
                  <div className="text-4xl font-bold text-rose-400">${heldValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-gray-600 mt-2">Financially isolated — excluded from ATP and sales.</p>
                </div>
                <div className={UI.cardPadded}>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-cyan-500" /> At-Risk Value (≤30d)</div>
                  <div className="text-4xl font-bold text-cyan-500">
                    ${inventory.reduce((sum, item) =>
                        sum + item.lots.filter(l => !l.qcHold && isAtRisk(l.expiry) && !isExpired(l.expiry)).reduce((a, l) => a + l.qty * l.cost, 0), 0
                      ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Available lots expiring within 30 days.</p>
                </div>
              </div>

              {/* Lot-level detail */}
              <div className={`${UI.card} overflow-hidden`}>
                <div className="p-4 border-b border-gray-800"><h3 className="font-bold text-gray-200">Lot-Level Valuation Detail</h3></div>
                <table className="w-full text-left text-sm">
                  <thead className={UI.tableHead}>
                    <tr>
                      <th className={UI.th}>Item</th>
                      <th className={UI.th}>Lot</th>
                      <th className={UI.th}>Qty</th>
                      <th className={UI.th}>Unit Cost</th>
                      <th className={UI.th}>Lot Value</th>
                      <th className={UI.th}>Expiry</th>
                      <th className={UI.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.flatMap(item =>
                      item.lots.map(lot => (
                        <tr key={`${item.id}-${lot.lotId}`} className={lot.qcHold ? 'bg-rose-950/20 border-b border-gray-800' : UI.tableRow}>
                          <td className={UI.td}><div className="font-semibold text-gray-200">{item.name}</div><div className="text-xs text-gray-500 font-mono">{item.sku}</div></td>
                          <td className={UI.td}><span className="font-mono text-gray-400">{lot.lotId}</span></td>
                          <td className={UI.td}>{lot.qty} {item.uom}{item.isCatchWeight && lot.actualWeight ? <div className="text-xs text-cyan-500">{lot.actualWeight} lbs</div> : null}</td>
                          <td className={UI.td}>${lot.cost.toFixed(2)}</td>
                          <td className={UI.td}><span className="font-bold text-gray-100">${(lot.qty * lot.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></td>
                          <td className={UI.td}>
                            {lot.expiry
                              ? <span className={`text-xs font-medium ${isExpired(lot.expiry) ? 'text-rose-400' : isAtRisk(lot.expiry) ? 'text-cyan-500' : 'text-gray-400'}`}>{lot.expiry}</span>
                              : <span className="text-gray-600 text-xs">N/A</span>
                            }
                          </td>
                          <td className={UI.td}>
                            {lot.qcHold
                              ? <span className={UI.badgeRose}><Lock className="w-3 h-3" /> HELD</span>
                              : <span className={UI.badgeEmerald}><CheckCircle2 className="w-3 h-3" /> AVAILABLE</span>
                            }
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* ══ TAB: FSMA TRACEABILITY ══ */}
          
          {activeTab === 'expiry' && (() => {
            const showExpiryToast = (msg, type = 'info') => {
              setExpiryToast({ msg, type });
              setTimeout(() => setExpiryToast(null), 4500);
            };

            // Build flat list of all at-risk lots (not QC-held, not expired, expiry within 30d)
            const atRiskRows = [];
            inventory.forEach(item => {
              (item.lots || []).forEach(lot => {
                if (!lot.expiry || lot.qcHold) return;
                const d = daysUntilExpiry(lot.expiry);
                if (d > 30 || d <= 0) return;
                atRiskRows.push({
                  item,
                  lot,
                  daysLeft: Math.ceil(d),
                  cogsAtRisk: lot.qty * (lot.cost || 0),
                  customers: CUSTOMER_BUYS[item.sku] || [],
                });
              });
            });
            atRiskRows.sort((a, b) => a.daysLeft - b.daysLeft);

            const bucket = d => d <= 1 ? 'critical' : d <= 3 ? 'urgent' : d <= 7 ? 'warning' : 'watch';
            const bucketConfig = {
              critical: { label: 'Critical', sub: '≤ 1 day',   color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30',   dot: 'bg-rose-500'   },
              urgent:   { label: 'Urgent',   sub: '≤ 3 days',  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500' },
              warning:  { label: 'Warning',  sub: '≤ 7 days',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  dot: 'bg-amber-500'  },
              watch:    { label: 'Watch',    sub: '≤ 30 days', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   dot: 'bg-blue-500'   },
            };

            const stats = { critical: { count: 0, cogs: 0 }, urgent: { count: 0, cogs: 0 }, warning: { count: 0, cogs: 0 }, watch: { count: 0, cogs: 0 } };
            atRiskRows.forEach(r => { const b = bucket(r.daysLeft); stats[b].count++; stats[b].cogs += r.cogsAtRisk; });

            const displayRows = expiryFilter === 'all' ? atRiskRows : atRiskRows.filter(r => bucket(r.daysLeft) === expiryFilter);
            const fmt = v => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            return (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-black text-gray-100 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" /> Lot Expiry Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Proactive write-off prevention — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> FEFO Enforced at Pick
                  </span>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(bucketConfig).map(([key, bc]) => {
                    const s = stats[key];
                    const active = expiryFilter === key;
                    return (
                      <button key={key}
                        onClick={() => setExpiryFilter(active ? 'all' : key)}
                        className={`text-left p-4 rounded-xl border transition-all ${active ? `${bc.bg} ${bc.border}` : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${bc.dot}`} />
                          <span className={`text-xs font-bold uppercase tracking-wide ${active ? bc.color : 'text-gray-400'}`}>{bc.label}</span>
                          <span className="text-xs text-gray-600 ml-auto">{bc.sub}</span>
                        </div>
                        <p className={`text-2xl font-black ${active ? bc.color : 'text-gray-100'}`}>{s.count}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fmt(s.cogs)} at risk</p>
                      </button>
                    );
                  })}
                </div>

                {/* FEFO info banner */}
                <div className="flex items-start gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-400">
                    <span className="text-cyan-400 font-semibold">FEFO at pick:</span> Lots below are automatically pulled first on outbound orders.
                    Use field alerts and quick orders to proactively move product through your best-fit customers before write-off.
                    QC-held lots are excluded from this view.
                  </p>
                </div>

                {/* Filter row */}
                {expiryFilter !== 'all' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Filtering by:</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${bucketConfig[expiryFilter].bg} ${bucketConfig[expiryFilter].border} ${bucketConfig[expiryFilter].color}`}>
                      {bucketConfig[expiryFilter].label}
                    </span>
                    <button onClick={() => setExpiryFilter('all')} className="text-xs text-gray-500 hover:text-gray-300 underline ml-1">Clear filter</button>
                  </div>
                )}

                {/* Table */}
                {displayRows.length === 0 ? (
                  <div className="text-center py-16 text-gray-600 border border-gray-800 rounded-xl">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500/40" />
                    <p className="font-semibold text-gray-400">No lots in this expiry window</p>
                    <p className="text-sm mt-1">All active inventory is within safe shelf-life range.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-900/60">
                          <th className={UI.th}>Status</th>
                          <th className={UI.th}>SKU / Product</th>
                          <th className={UI.th}>Lot ID</th>
                          <th className={UI.th}>Qty</th>
                          <th className={UI.th}>COGS at Risk</th>
                          <th className={UI.th}>Expiry Date</th>
                          <th className={UI.th}>Days Left</th>
                          <th className={UI.th}>Buyers</th>
                          <th className={UI.th}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map(({ item, lot, daysLeft, cogsAtRisk, customers }) => {
                          const b = bucket(daysLeft);
                          const bc = bucketConfig[b];
                          const isExpanded   = expiryExpanded === lot.lotId;
                          const isPromo      = expiryPromo.has(lot.lotId);
                          const internalSent = expiryInternalAlerts.has(lot.lotId);

                          return (
                            <React.Fragment key={lot.lotId}>
                              <tr className={`border-b border-gray-800/60 hover:bg-gray-800/20 transition-colors ${isExpanded ? 'bg-gray-800/10' : ''}`}>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${bc.bg} ${bc.border} ${bc.color}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${bc.dot}`} />
                                    {bc.label.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-gray-100 text-sm">{item.name}</p>
                                  <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-sm text-gray-300">{lot.lotId}</span>
                                    {isPromo && (
                                      <span className="text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">PROMO</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-300 font-semibold">
                                  {lot.qty} <span className="text-gray-600 text-xs font-normal">{item.uom}s</span>
                                </td>
                                <td className={`px-4 py-3 font-bold ${bc.color}`}>{fmt(cogsAtRisk)}</td>
                                <td className="px-4 py-3 text-gray-300 text-sm tabular-nums">{lot.expiry}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xl font-black tabular-nums ${daysLeft <= 1 ? 'text-rose-400' : daysLeft <= 3 ? 'text-orange-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-blue-400'}`}>
                                    {daysLeft}
                                  </span>
                                  <span className="text-gray-600 text-xs ml-1">d</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-gray-400 bg-gray-800 rounded-full px-2 py-0.5 font-semibold">
                                    {customers.length} buyer{customers.length !== 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => setExpiryExpanded(isExpanded ? null : lot.lotId)}
                                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors whitespace-nowrap ${isExpanded ? 'bg-gray-700 text-gray-200 border-gray-600' : 'text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'}`}>
                                    {isExpanded ? '▲ Close' : '▼ Actions'}
                                  </button>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="border-b border-gray-800/40 bg-gray-900/50">
                                  <td colSpan={9} className="px-6 py-5">
                                    <div className="space-y-5">

                                      {/* Lot-level actions */}
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Lot-Level Actions</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <button
                                            onClick={() => {
                                              setExpiryPromo(prev => {
                                                const n = new Set(prev);
                                                isPromo ? n.delete(lot.lotId) : n.add(lot.lotId);
                                                return n;
                                              });
                                              showExpiryToast(
                                                isPromo ? `Promo flag removed from ${lot.lotId}` : `${lot.lotId} marked Promo Eligible — visible to field reps on order entry`,
                                                'promo'
                                              );
                                            }}
                                            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${isPromo ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-500/40 hover:text-yellow-400'}`}>
                                            <Tag className="w-3.5 h-3.5" />
                                            {isPromo ? '✓ Promo Eligible' : 'Mark Promo Eligible'}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setExpiryInternalAlerts(prev => { const n = new Set(prev); n.add(lot.lotId); return n; });
                                              showExpiryToast(
                                                `Internal alert dispatched — ${lot.lotId} (${item.name}) expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. COGS: ${fmt(cogsAtRisk)}.`,
                                                'internal'
                                              );
                                            }}
                                            disabled={internalSent}
                                            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${internalSent ? 'bg-gray-700/50 border-gray-700 text-gray-500 cursor-default' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-400'}`}>
                                            <Bell className="w-3.5 h-3.5" />
                                            {internalSent ? '✓ Alert Sent' : 'Send Internal Alert'}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Per-customer targeted actions */}
                                      <div>
                                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">
                                          Regular Buyers — Target for Quick Move
                                        </p>
                                        {customers.length > 0 ? (
                                          <div className="space-y-2">
                                            {customers.map(cust => {
                                              const ck = `${lot.lotId}::${cust.id}`;
                                              const custAlerted = expiryAlerts.has(ck);
                                              const custOrdered = expiryOrders.has(ck);
                                              return (
                                                <div key={cust.id} className="flex items-center gap-4 p-3 bg-gray-800/60 border border-gray-700/60 rounded-xl flex-wrap">
                                                  <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-100 text-sm">{cust.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                      Rep: <span className="text-gray-300">{cust.rep}</span>
                                                      {' · '}Avg: <span className="text-gray-300">{cust.avgQty} {item.uom}s</span>
                                                      {' · '}Last order: <span className="text-gray-300">{cust.lastOrder}</span>
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                    <button
                                                      onClick={() => {
                                                        setExpiryAlerts(prev => { const n = new Set(prev); n.add(ck); return n; });
                                                        showExpiryToast(
                                                          `Field alert → ${cust.rep} / ${cust.name}: "${item.name}" (${lot.lotId}) expires in ${daysLeft}d — suggest ordering ${cust.avgQty} ${item.uom}s.`,
                                                          'alert'
                                                        );
                                                      }}
                                                      disabled={custAlerted}
                                                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${custAlerted ? 'bg-gray-700/50 border-gray-700 text-gray-500 cursor-default' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'}`}>
                                                      <Bell className="w-3 h-3" />
                                                      {custAlerted ? '✓ Alerted' : 'Field Alert'}
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setExpiryOrders(prev => { const n = new Set(prev); n.add(ck); return n; });
                                                        showExpiryToast(
                                                          `Quick order created — ${cust.name} · ${cust.avgQty}× ${item.name} (${lot.lotId}) · ${fmt(cust.avgQty * item.price)} · Ready for rep approval.`,
                                                          'order'
                                                        );
                                                      }}
                                                      disabled={custOrdered}
                                                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${custOrdered ? 'bg-gray-700/50 border-gray-700 text-gray-500 cursor-default' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                                      <ShoppingCart className="w-3 h-3" />
                                                      {custOrdered ? '✓ Order Created' : 'Quick Order'}
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-600 italic p-3 bg-gray-900 rounded-lg border border-gray-800">
                                            No regular buyers on record for {item.sku}. Consider a promo flag to surface it on field-rep order screens.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Toast */}
                {expiryToast && (
                  <div className={`fixed bottom-8 right-8 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md text-sm max-w-sm
                    ${expiryToast.type === 'alert'    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      expiryToast.type === 'order'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      expiryToast.type === 'promo'    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}>
                    {expiryToast.type === 'alert'  ? <Bell size={15} className="shrink-0 mt-0.5" /> :
                     expiryToast.type === 'order'  ? <ShoppingCart size={15} className="shrink-0 mt-0.5" /> :
                     expiryToast.type === 'promo'  ? <Tag size={15} className="shrink-0 mt-0.5" /> :
                                                     <Bell size={15} className="shrink-0 mt-0.5" />}
                    <span className="font-semibold leading-snug">{expiryToast.msg}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'transfers' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                <ArrowRightLeft className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-cyan-300">Inter-Location Transfer Orders</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Move inventory between Tampa Main (LOC-A), Tampa North (LOC-B), and St. Petersburg (LOC-C). Dispatching a transfer commits stock at the source; confirming receipt moves it to the destination.</p>
                </div>
              </div>
              <TransfersTab
                transfers={transfers}
                setTransfers={setTransfers}
                inventory={inventory}
                setInventory={setInventory}
              />
            </div>
          )}

        </div>
      </main>

      {/* ── ADD SKU MODAL ── */}
      {isItemModalOpen && (() => {
        const f = newItemForm;
        const setF = (k, v) => setNewItemForm(prev => ({ ...prev, [k]: v }));
        // Catch-weight invariant guidance: basePrice ≈ pricePerLb × avgWeightPerCase
        const cwImplied = (parseFloat(f.pricePerLb) || 0) * (parseFloat(f.avgWeightPerCase) || 0);
        const cwSanityOff = f.isCatchWeight && cwImplied > 0 && parseFloat(f.price) > 0
          && Math.abs(cwImplied - parseFloat(f.price)) / parseFloat(f.price) > 0.1;
        return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${UI.glassModal} w-full max-w-2xl flex flex-col max-h-[92vh]`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-700 shrink-0">
              <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2"><Plus className="text-cyan-500" /> Add New SKU</h2>
              <button onClick={() => setIsItemModalOpen(false)} className="text-gray-500 hover:text-gray-300"><X /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* ── Identity ── */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-1">Identity</h3>
                <div>
                  <label className={UI.label}>Item Name *</label>
                  <input required type="text" value={f.name} onChange={e => setF('name', e.target.value)} className={UI.input} placeholder="e.g. Organic Carrots 25lb" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={UI.label}>SKU *</label>
                    <input required type="text" value={f.sku} onChange={e => setF('sku', e.target.value)} className={UI.input} placeholder="PRO-CAR-01" />
                  </div>
                  <div>
                    <label className={UI.label}>Barcode (UPC)</label>
                    <input type="text" value={f.barcode} onChange={e => setF('barcode', e.target.value)} className={UI.input} placeholder="Scan or type…" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={UI.label}>Category</label>
                    <select value={f.category} onChange={e => setF('category', e.target.value)} className={UI.select}>
                      <option value="meat">Meat</option><option value="poultry">Poultry</option><option value="produce">Produce</option><option value="dairy">Dairy</option>{frozenEnabled && <option value="frozen">Frozen</option>}<option value="bakery">Bakery</option><option value="dry goods">Dry Goods</option><option value="supplies">Supplies</option>
                    </select>
                  </div>
                  <div>
                    <label className={UI.label}>UoM</label>
                    <select value={f.uom} onChange={e => setF('uom', e.target.value)} className={UI.select}>
                      <option value="case">Case</option><option value="pallet">Pallet</option><option value="bag">Bag</option><option value="jug">Jug</option><option value="pack">Pack</option><option value="each">Each</option>
                    </select>
                  </div>
                  <div>
                    <label className={UI.label}>Default Bin</label>
                    <input type="text" value={f.location} onChange={e => setF('location', e.target.value)} className={UI.input} placeholder="e.g. Cooler-2" />
                  </div>
                </div>
              </div>

              {/* ── Pricing ── */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-1">Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={UI.label}>Sale Price (per UoM)</label>
                    <input type="number" step="0.01" value={f.price} onChange={e => setF('price', e.target.value)} className={UI.input} />
                  </div>
                  <div>
                    <label className={UI.label}>Cost Basis (per UoM)</label>
                    <input type="number" step="0.01" value={f.cost} onChange={e => setF('cost', e.target.value)} className={UI.input} placeholder="What you pay vendor" />
                  </div>
                </div>
                {catchWeightEnabled && (
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <input type="checkbox" id="cw-new" checked={f.isCatchWeight} onChange={e => setF('isCatchWeight', e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                  <div className="flex-1">
                    <label htmlFor="cw-new" className="font-bold text-gray-300 text-sm cursor-pointer">Catch Weight Item</label>
                    <p className="text-xs text-gray-500">Sold by case, billed by actual pound weight captured at Pack &amp; Weigh.</p>
                  </div>
                </div>
                )}
                {f.isCatchWeight && (
                  <div className="ml-6 pl-3 border-l-2 border-cyan-500/40 space-y-3">
                    <p className="text-xs text-cyan-400 font-bold">Catch-Weight Pricing</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={UI.label}>Price / lb *</label>
                        <input type="number" step="0.01" required={f.isCatchWeight} value={f.pricePerLb} onChange={e => setF('pricePerLb', e.target.value)} className={UI.input} placeholder="8.55" />
                      </div>
                      <div>
                        <label className={UI.label}>Avg lb / case *</label>
                        <input type="number" step="0.1" required={f.isCatchWeight} value={f.avgWeightPerCase} onChange={e => setF('avgWeightPerCase', e.target.value)} className={UI.input} placeholder="10.0" />
                      </div>
                      <div>
                        <label className={UI.label}>Variance Tol (%)</label>
                        <input type="number" step="1" value={f.weightVariancePct} onChange={e => setF('weightVariancePct', e.target.value)} className={UI.input} placeholder="8" />
                      </div>
                    </div>
                    {cwImplied > 0 && (
                      <p className={`text-xs ${cwSanityOff ? 'text-amber-400' : 'text-gray-500'}`}>
                        Implied case price: <strong>${cwImplied.toFixed(2)}</strong>
                        {cwSanityOff && ' — differs from Sale Price by more than 10%, check your numbers'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Sourcing ── */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-1">Sourcing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={UI.label}>Preferred Vendor</label>
                    <input type="text" value={f.preferredVendorName} onChange={e => setF('preferredVendorName', e.target.value)} className={UI.input} placeholder="e.g. Gulf Coast Proteins" />
                  </div>
                  <div>
                    <label className={UI.label}>Vendor Product Code</label>
                    <input type="text" value={f.vendorProductCode} onChange={e => setF('vendorProductCode', e.target.value)} className={UI.input} placeholder="e.g. GCP-BEEF-8020" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={UI.label}>Lead Time (days)</label>
                    <input type="number" value={f.leadTimeDays} onChange={e => setF('leadTimeDays', e.target.value)} className={UI.input} placeholder="3" />
                  </div>
                  <div>
                    <label className={UI.label}>Reorder Point</label>
                    <input type="number" required value={f.reorderPoint} onChange={e => setF('reorderPoint', e.target.value)} className={UI.input} />
                  </div>
                  <div>
                    <label className={UI.label}>Reorder Qty</label>
                    <input type="number" value={f.reorderQty} onChange={e => setF('reorderQty', e.target.value)} className={UI.input} />
                  </div>
                </div>
                <div>
                  <label className={UI.label}>Min Shelf Life SLA (days)</label>
                  <input type="number" value={f.minShelfLifeDays} onChange={e => setF('minShelfLifeDays', e.target.value)} className={UI.input} placeholder="0 = no SLA" />
                </div>
              </div>

              {/* ── Receive Initial Stock ── */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-1">Initial Stock (optional)</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <input type="checkbox" id="recv-now" checked={f.receiveNow} onChange={e => setF('receiveNow', e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                  <div className="flex-1">
                    <label htmlFor="recv-now" className="font-bold text-gray-300 text-sm cursor-pointer">Receive initial stock on save</label>
                    <p className="text-xs text-gray-500">Creates a starting lot so the SKU isn't immediately at zero. Skip if stock will arrive via a PO.</p>
                  </div>
                </div>
                {f.receiveNow && (
                  <div className="ml-6 pl-3 border-l-2 border-cyan-500/40 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={UI.label}>Initial Quantity *</label>
                        <input type="number" required={f.receiveNow} min="1" value={f.initialQty} onChange={e => setF('initialQty', e.target.value)} className={UI.input} placeholder={f.uom === 'case' ? 'cases' : f.uom} />
                      </div>
                      <div>
                        <label className={UI.label}>Lot ID</label>
                        <input type="text" value={f.initialLotId} onChange={e => setF('initialLotId', e.target.value)} className={UI.input} placeholder="Auto-generated if blank" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={UI.label}>Supplier</label>
                        <input type="text" value={f.initialSupplier} onChange={e => setF('initialSupplier', e.target.value)} className={UI.input} placeholder={f.preferredVendorName || 'e.g. Gulf Coast Proteins'} />
                      </div>
                      <div>
                        <label className={UI.label}>Expiry Date</label>
                        <input type="date" value={f.initialExpiry} onChange={e => setF('initialExpiry', e.target.value)} className={UI.input} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-700 shrink-0 bg-gray-900/60">
              <button type="button" onClick={() => setIsItemModalOpen(false)} className={UI.btnSecondary}>Cancel</button>
              <button type="submit" onClick={handleAddItem} className={UI.btnPrimary}>
                <Save className="w-4 h-4" /> {f.receiveNow ? `Register SKU + Receive ${f.initialQty || 0}` : 'Register SKU'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── API ERROR TOAST ── */}
      {apiToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-2.5 shadow-xl backdrop-blur-md text-sm font-medium pointer-events-none">
          <AlertCircle className="w-4 h-4 shrink-0" />{apiToast}
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <DeleteConfirmModal item={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {/* ── BARCODE SCANNER ── */}
      {isBarcodeToolOpen && (
        <BarcodeScannerTool inventory={inventory} setInventory={setInventory} onClose={() => setIsBarcodeToolOpen(false)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BARCODE SCANNER TOOL
// Fixes applied:
//   • SLA validation blocks receive if expiry fails minShelfLifeDays
//   • ATP validation blocks OUT staging if qty > available stock
//   • Catch weight entry for isCatchWeight items
//   • Immutable lot update (no direct mutation)
// ─────────────────────────────────────────────
function BarcodeScannerTool({ inventory, setInventory, onClose }) {
  const [step, setStep]               = useState('BIN');
  const [binLocation, setBinLocation] = useState('');
  const [stagedChanges, setStagedChanges] = useState([]);

  const [mode, setMode]               = useState('OUT');
  const [quantity, setQuantity]       = useState(1);
  const [actualWeight, setActualWeight] = useState('');
  const [scanInput, setScanInput]     = useState('');
  const [scanResult, setScanResult]   = useState(null);
  const [scanError, setScanError]     = useState('');

  const [newLotId, setNewLotId]       = useState('');
  const [newExpiry, setNewExpiry]     = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newTemp, setNewTemp]         = useState('');
  const [reasonCode, setReasonCode]   = useState('Order Fulfillment');
  const [minShelfAlert, setMinShelfAlert] = useState(null);

  const [slaAlert, setSlaAlert]       = useState(null);

  const { settings } = useKernal();
  const fefoEnabled = settings.features.fefoEnforcement;

  const inputRef = useRef(null);

  const handleScanSubmit = e => {
    e.preventDefault();
    setScanError('');
    setSlaAlert(null);
    setMinShelfAlert(null);
    if (!scanInput.trim()) return;

    const trimmed  = scanInput.trim();
    const item     = inventory.find(i => i.barcode === trimmed || i.sku.toLowerCase() === trimmed.toLowerCase());

    if (!item) {
      setScanResult({ success: false, query: trimmed });
      setScanInput('');
      return;
    }

    const parsedQty = parseInt(quantity, 10) || 1;

    // ── SPLIT validation ─────────────────
    if (mode === 'SPLIT' && !item.childSku) {
      setScanError(`${item.name} has no child SKU defined — cannot split.`);
      setScanInput('');
      return;
    }

    // ── RECEIVE (IN) validations ─────────
    if (mode === 'IN') {
      if (!newLotId || !newExpiry) {
        setScanError('Lot ID and expiry date are required for receiving.');
        setScanInput('');
        return;
      }

      // SLA check
      if (item.minShelfLifeDays > 0) {
        const shelfLife = daysUntilExpiry(newExpiry);
        if (shelfLife < item.minShelfLifeDays) {
          setSlaAlert({
            item,
            received: Math.floor(shelfLife),
            required: item.minShelfLifeDays,
            expiry: newExpiry,
          });
          setScanInput('');
          return; // Block — do not stage
        }
      }

      // Catch weight required
      if (item.isCatchWeight && !actualWeight) {
        setScanError(`${item.name} is a catch-weight item. Enter actual weight (lbs) before scanning.`);
        setScanInput('');
        return;
      }
    }

    // ── OUT / SPLIT: ATP stock check ─────
    if (mode === 'OUT' || mode === 'SPLIT') {
      const atp = getAvailableStock(item.lots);
      // Also subtract already-staged OUT quantities for this item
      const alreadyStaged = stagedChanges
        .filter(c => c.itemId === item.id && (c.action === 'OUT' || c.action === 'SPLIT'))
        .reduce((a, c) => a + c.qty, 0);
      const effectiveAtp = atp - alreadyStaged;

      if (parsedQty > effectiveAtp) {
        setScanError(`Insufficient ATP stock. Available: ${effectiveAtp} ${item.uom}. Requested: ${parsedQty}.`);
        setScanInput('');
        return;
      }

      // ── Minimum shelf life at pick (FEFO lot) ──────────────────────────
      if (fefoEnabled && item.minShelfLifeDays > 0) {
        const fefoLot = [...item.lots]
          .filter(l => !l.qcHold && l.expiry)
          .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))[0];
        if (fefoLot) {
          const remaining = daysUntilExpiry(fefoLot.expiry);
          if (remaining < item.minShelfLifeDays) {
            setMinShelfAlert({
              item,
              lotId:    fefoLot.lotId,
              expiry:   fefoLot.expiry,
              remaining: Math.floor(remaining),
              required:  item.minShelfLifeDays,
            });
            setScanInput('');
            return; // Block pick — FEFO lot fails customer shelf life requirement
          }
        }
      }
    }

    const transaction = {
      id:          Date.now(),
      itemId:      item.id,
      name:        item.name,
      sku:         item.sku,
      action:      mode,
      qty:         parsedQty,
      actualWeight: item.isCatchWeight && mode === 'IN' ? parseFloat(actualWeight) || null : null,
      lotId:       mode === 'IN' ? newLotId : 'FEFO Auto-Pick',
      expiry:      mode === 'IN' ? newExpiry : null,
      supplierId:  mode === 'IN' ? newSupplier : null,
      receivedTemp: mode === 'IN' ? (parseFloat(newTemp) || null) : null,
      reasonCode:  mode === 'IN' ? 'Receiving' : mode === 'SPLIT' ? 'UoM Conversion' : reasonCode,
      childSku:    item.childSku,
      splitQty:    item.splitQty,
      isCatchWeight: item.isCatchWeight,
      minShelfLifeDays: item.minShelfLifeDays,
    };

    setStagedChanges(prev => [...prev, transaction]);
    setScanResult({ success: true, item, action: mode, qty: parsedQty });
    setScanInput('');
    if (inputRef.current) inputRef.current.focus();
  };

  const removeStaged = id => setStagedChanges(prev => prev.filter(c => c.id !== id));

  const handleConfirmChanges = () => {
    // Fire API adjust calls for each staged change (live mode only)
    if (!DEMO_MODE) {
      stagedChanges.forEach(change => {
        const item = inventory.find(i => i.id === change.itemId);
        if (!item) return;
        const delta = change.action === 'IN' ? change.qty : -change.qty;
        api.inventory.adjust(item.id, {
          delta,
          reason: change.reasonCode || change.action,
        }).catch(() => {}); // Silent — optimistic state already applied
      });
    }

    setInventory(prev => {
      let updated = prev.map(item => ({ ...item, lots: item.lots.map(l => ({ ...l })) }));

      stagedChanges.forEach(change => {
        const idx = updated.findIndex(i => i.id === change.itemId);
        if (idx < 0) return;
        const item = { ...updated[idx] };

        if (change.action === 'IN') {
          const lotIdx = item.lots.findIndex(l => l.lotId === change.lotId);
          if (lotIdx >= 0) {
            // Immutable update — no direct mutation
            item.lots = item.lots.map((l, i) =>
              i === lotIdx ? { ...l, qty: l.qty + change.qty } : l
            );
          } else {
            item.lots = [...item.lots, {
              lotId:        change.lotId,
              qty:          change.qty,
              actualWeight: change.actualWeight,
              expiry:       change.expiry,
              receivedDate: new Date().toISOString(),
              supplierId:   change.supplierId || 'UNKNOWN',
              receivedTemp: change.receivedTemp,
              qcHold:       false,
              qcHoldReason: null,
              qcHoldDate:   null,
              cost:         item.lots[0]?.cost ?? 0, // inherit most recent lot cost
            }];
          }
          item.location = binLocation.toUpperCase();

        } else if (change.action === 'OUT' || change.action === 'SPLIT') {
          let remaining = change.qty;
          // FEFO sort: earliest expiry first, QC holds excluded
          const available = [...item.lots]
            .filter(l => !l.qcHold)
            .sort((a, b) => new Date(a.expiry || '2099-01-01') - new Date(b.expiry || '2099-01-01'));
          const held = item.lots.filter(l => l.qcHold);

          let earliestExpiryUsed = null;
          const consumed = [];
          const updatedAvailable = [];

          for (const lot of available) {
            if (remaining <= 0) { updatedAvailable.push(lot); continue; }
            if (!earliestExpiryUsed) earliestExpiryUsed = lot.expiry;
            if (lot.qty > remaining) {
              updatedAvailable.push({ ...lot, qty: lot.qty - remaining });
              remaining = 0;
            } else {
              remaining -= lot.qty;
              // lot fully consumed — not pushed to updated
            }
          }

          item.lots = [...updatedAvailable, ...held];

          // SPLIT: credit child SKU
          if (change.action === 'SPLIT' && change.childSku) {
            const childIdx = updated.findIndex(i => i.sku === change.childSku);
            if (childIdx >= 0) {
              const child = { ...updated[childIdx] };
              const addedUnits = change.qty * change.splitQty;
              child.lots = [...child.lots, {
                lotId:        `SPLIT-${new Date().toISOString().split('T')[0]}-${Date.now()}`,
                qty:          addedUnits,
                actualWeight: null,
                expiry:       earliestExpiryUsed,
                receivedDate: new Date().toISOString(),
                supplierId:   'SPLIT',
                receivedTemp: null,
                qcHold:       false,
                qcHoldReason: null,
                qcHoldDate:   null,
                cost:         child.lots[0]?.cost ?? 0,
              }];
              child.location = binLocation.toUpperCase();
              updated[childIdx] = child;
            }
          }
        }

        updated[idx] = item;
      });

      return updated;
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${UI.glassModal} w-full max-w-4xl flex flex-col h-[85vh]`}>

        {/* Scanner header */}
        <div className={`flex justify-between items-center p-5 border-b border-gray-700`}>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Barcode className="text-cyan-500" /> Warehouse Scanner
            {step !== 'BIN' && <span className="text-sm font-normal text-gray-400 ml-1">· Bin: <span className="text-cyan-500 font-bold">{binLocation.toUpperCase()}</span></span>}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><X /></button>
        </div>

        {/* STEP 1: BIN */}
        {step === 'BIN' && (
          <div className="p-12 flex flex-col items-center justify-center flex-1 text-center">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-full mb-6">
              <MapPin className="w-16 h-16 text-cyan-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-1">Scan Bin Location</h2>
            <p className="text-gray-500 text-sm mb-6">All transactions this session will be applied to this bin.</p>
            <form onSubmit={e => { e.preventDefault(); if (binLocation.trim()) setStep('SCAN'); }} className="w-full max-w-sm">
              <input
                type="text" value={binLocation} onChange={e => setBinLocation(e.target.value)}
                placeholder="e.g. A-12"
                className={`${UI.input} text-center text-2xl font-bold uppercase tracking-widest py-4`}
                autoFocus
              />
              <button type="submit" disabled={!binLocation.trim()} className={`${UI.btnPrimary} w-full justify-center mt-4 py-3 disabled:opacity-40`}>
                Proceed to Scanning
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: SCAN */}
        {step === 'SCAN' && (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Ledger */}
            <div className="w-full md:w-5/12 border-r border-gray-800 p-5 flex flex-col bg-gray-950/50">
              <h3 className="font-bold text-gray-300 mb-3 flex items-center justify-between">
                Session Ledger
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{stagedChanges.length} items</span>
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {stagedChanges.length === 0 && (
                  <div className="text-gray-600 text-sm text-center py-8">No transactions staged yet.</div>
                )}
                {[...stagedChanges].reverse().map(c => (
                  <div key={c.id} className={`bg-gray-900 border rounded-lg p-3 text-sm flex justify-between items-start gap-2 ${c.action === 'SPLIT' ? 'border-cyan-500/20' : c.action === 'IN' ? 'border-emerald-400/20' : 'border-gray-700'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-200 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.reasonCode}</div>
                      {c.isCatchWeight && c.actualWeight && <div className="text-xs text-cyan-500 mt-0.5">{c.actualWeight} lbs</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`font-bold text-right text-sm ${c.action === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.action === 'IN' ? '+' : '−'}{c.qty}
                        {c.action === 'SPLIT' && <div className="text-xs text-cyan-500">+{c.qty * c.splitQty} child</div>}
                      </div>
                      <button onClick={() => removeStaged(c.id)} className="p-1 text-gray-600 hover:text-rose-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scan panel */}
            <div className="w-full md:w-7/12 p-5 flex flex-col overflow-y-auto">
              {/* Mode tabs */}
              <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-lg border border-gray-700">
                {[
                  { id: 'OUT',   label: 'Pick (OUT)',    color: 'text-rose-400' },
                  { id: 'IN',    label: 'Receive (IN)',  color: 'text-emerald-400' },
                  ...(caseSplittingEnabled ? [{ id: 'SPLIT', label: 'Split Case', color: 'text-cyan-500', Icon: SplitSquareHorizontal }] : []),
                ].map(({ id, label, color, Icon: ModeIcon }) => (
                  <button key={id} onClick={() => { setMode(id); setScanError(''); setSlaAlert(null); setMinShelfAlert(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-bold text-sm rounded transition-colors ${mode === id ? `bg-gray-700 ${color} shadow-sm` : 'text-gray-500 hover:text-gray-300'}`}>
                    {ModeIcon && <ModeIcon className="w-4 h-4" />}{label}
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={UI.label}>Qty {mode === 'SPLIT' ? '(parent units)' : ''}</label>
                    <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className={UI.input} />
                  </div>
                  {mode === 'IN' && (
                    <div className="flex-1">
                      <label className={UI.label}>Lot ID</label>
                      <input type="text" value={newLotId} onChange={e => setNewLotId(e.target.value)} className={UI.input} placeholder="LOT-XXXX" />
                    </div>
                  )}
                </div>

                {mode === 'IN' && (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className={UI.label}>Expiry Date</label>
                        <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} className={UI.input} />
                      </div>
                      <div className="flex-1">
                        <label className={UI.label}>Supplier ID</label>
                        <input type="text" value={newSupplier} onChange={e => setNewSupplier(e.target.value)} className={UI.input} placeholder="SUP-001" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className={UI.label}><Thermometer className="w-3 h-3 inline mr-1" />Receiving Temp (°F)</label>
                        <input type="number" step="0.1" value={newTemp} onChange={e => setNewTemp(e.target.value)} className={UI.input} placeholder="e.g. 34" />
                      </div>
                      <div className="flex-1">
                        <label className={UI.label}><Weight className="w-3 h-3 inline mr-1" />Actual Weight (lbs) <span className="text-cyan-500">CW only</span></label>
                        <input type="number" step="0.1" value={actualWeight} onChange={e => setActualWeight(e.target.value)} className={UI.input} placeholder="e.g. 412.5" />
                      </div>
                    </div>
                  </>
                )}

                {mode === 'OUT' && (
                  <div>
                    <label className={UI.label}>Reason Code</label>
                    <select value={reasonCode} onChange={e => setReasonCode(e.target.value)} className={UI.select}>
                      <option>Order Fulfillment</option>
                      <option>Damaged</option>
                      <option>Expired</option>
                      <option>Miscount / Adjustment</option>
                      <option>Quality Disposal</option>
                    </select>
                  </div>
                )}
              </div>

              {/* SLA Alert — Receive blocked */}
              {slaAlert && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
                  <div className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-rose-400" /> SLA Violation — Receive Blocked</div>
                  <p><strong>{slaAlert.item.name}</strong> requires a minimum shelf life of <strong>{slaAlert.required} days</strong>. The scanned lot expires <strong>{slaAlert.expiry}</strong> — only <strong>{slaAlert.received} days</strong> remaining. Contact your supplier to resolve before receiving.</p>
                  <button onClick={() => setSlaAlert(null)} className="mt-2 text-xs underline text-rose-400 hover:text-rose-300">Dismiss</button>
                </div>
              )}

              {/* Min Shelf Life Alert — Pick blocked */}
              {minShelfAlert && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Min Shelf Life Violation — Pick Blocked
                  </div>
                  <p>
                    <strong>{minShelfAlert.item.name}</strong> requires a minimum of{' '}
                    <strong>{minShelfAlert.required} days</strong> remaining shelf life.
                    {' '}The FEFO lot <strong>{minShelfAlert.lotId}</strong> expires{' '}
                    <strong>{minShelfAlert.expiry}</strong> —{' '}
                    only <strong>{minShelfAlert.remaining} days</strong> remaining.
                  </p>
                  <p className="mt-1 text-rose-400/70 text-xs">Do not pick this item. Flag for internal use or markdown.</p>
                  <button onClick={() => setMinShelfAlert(null)} className="mt-2 text-xs underline text-rose-400 hover:text-rose-300">Dismiss</button>
                </div>
              )}

              {/* Error */}
              {scanError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  {scanError}
                </div>
              )}

              {/* Scan feedback */}
              {scanResult && (
                <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 border ${scanResult.success ? 'bg-emerald-400/5 border-emerald-400/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                  {scanResult.success
                    ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Staged: {scanResult.action} {scanResult.qty}× {scanResult.item.name}</>
                    : <><AlertCircle className="w-4 h-4 shrink-0" /> No match found for "{scanResult.query}"</>
                  }
                </div>
              )}

              {/* Scan input */}
              <form onSubmit={handleScanSubmit}>
                <input
                  ref={inputRef}
                  type="text" value={scanInput} onChange={e => setScanInput(e.target.value)}
                  placeholder="Scan UPC or type SKU…"
                  className={`${UI.input} text-center text-lg tracking-widest py-5 border-2`}
                  autoFocus
                />
              </form>

              <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
                <button onClick={() => setStep('BIN')} className={UI.btnGhost}>Change Bin</button>
                <button onClick={() => setStep('SUMMARY')} disabled={stagedChanges.length === 0}
                  className={`${UI.btnPrimary} disabled:opacity-40`}>
                  Review ({stagedChanges.length}) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY */}
        {step === 'SUMMARY' && (
          <div className="p-6 flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Confirm Ledger</h2>
            <div className="flex-1 overflow-auto border border-gray-800 rounded-xl mb-4 bg-gray-950/50">
              <table className="w-full text-sm text-left">
                <thead className={UI.tableHead}>
                  <tr>
                    <th className={UI.th}>Item</th>
                    <th className={UI.th}>Action</th>
                    <th className={UI.th}>Lot</th>
                    <th className={`${UI.th} text-right`}>Net Change</th>
                  </tr>
                </thead>
                <tbody>
                  {stagedChanges.map(tx => (
                    <tr key={tx.id} className={UI.tableRow}>
                      <td className={UI.td}>
                        <div className="font-bold text-gray-200">{tx.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{tx.sku}</div>
                      </td>
                      <td className={UI.td}><span className="text-gray-400">{tx.reasonCode}</span></td>
                      <td className={UI.td}><span className="font-mono text-gray-400 text-xs">{tx.lotId}</span></td>
                      <td className={`${UI.td} text-right font-bold`}>
                        <span className={tx.action === 'IN' ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.action === 'IN' ? '+' : '−'}{tx.qty} {tx.action === 'SPLIT' && `(+${tx.qty * tx.splitQty} child)`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep('SCAN')} className={UI.btnSecondary}>← Back</button>
              <button onClick={handleConfirmChanges} className={UI.btnPrimary}>
                <Save className="w-4 h-4" /> Apply Ledger
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Lot Attachments Modal ─────────────────────────────────────────── */}
      {lotAttOpen && (() => {
        // Find which item+lot this belongs to for the label
        let lotLabel = lotAttOpen;
        let foundItem = null;
        for (const item of inventory) {
          const lot = item.lots.find(l => l.lotId === lotAttOpen);
          if (lot) { lotLabel = `${item.name} — Lot ${lot.lotId}`; foundItem = item; break; }
        }
        const compliance = foundItem ? ALLERGEN_DATA[foundItem.sku] : null;
        const hasContains   = compliance && BIG_9.some(a => compliance.allergens[a.id] === 'contains');
        const hasMayContain = compliance && BIG_9.some(a => compliance.allergens[a.id] === 'may_contain');

        const allergenPill = (status) => {
          if (status === 'contains')    return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
          if (status === 'may_contain') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
          return 'bg-gray-800 text-gray-600 border border-gray-700';
        };
        const allergenLabel = (status) => {
          if (status === 'contains')    return 'CONTAINS';
          if (status === 'may_contain') return 'MAY CONTAIN';
          return 'Free';
        };

        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" onClick={() => setLotAttOpen(null)} />
            <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
                <Paperclip className="w-4 h-4 text-cyan-500" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-100">Lot Details</p>
                  <p className="text-xs text-gray-500">{lotLabel}</p>
                </div>
                <button onClick={() => setLotAttOpen(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Tab bar */}
              <div className="flex border-b border-gray-800 overflow-x-auto">
                {[['docs', 'Documents'], ['history', 'Change History'], ['coc', 'Chain of Custody'], ['compliance', 'Compliance']].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setLotModalTab(id)}
                    className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                      lotModalTab === id
                        ? 'text-cyan-400 border-b-2 border-cyan-500 -mb-px'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {lotModalTab === 'docs' ? (
                  <AttachmentsPanel
                    recordId={lotAttOpen}
                    recordLabel={lotLabel}
                    isDark={true}
                    uploaderName={activeUser?.name || 'You'}
                  />
                ) : lotModalTab === 'history' ? (
                  <RecordHistory
                    entityIds={lotAttOpen}
                    label={lotLabel}
                    isDark={true}
                    mode="full"
                  />
                ) : lotModalTab === 'coc' ? (
                  <RecordHistory
                    entityIds={lotAttOpen}
                    label={lotLabel}
                    isDark={true}
                    mode="coc"
                  />
                ) : (() => {
                  // ── Compliance Tab ──────────────────────────────────────────
                  if (!compliance) return (
                    <div className="py-10 text-center text-gray-500 text-sm">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                      No compliance data on file for this SKU.
                    </div>
                  );
                  if (compliance.nonFood) return (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-800 border border-gray-700">
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-cyan-400 text-xs">Non-Food Supply Item</p>
                          <p className="text-gray-400 text-[11px] mt-0.5">FDA allergen declarations and Nutrition Facts are not applicable to non-food packaging and supply items.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-gray-500">Origin:</span>
                        <span className="text-gray-200 font-medium">{compliance.countryOfOrigin}</span>
                        {compliance.certifications.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">{c}</span>
                        ))}
                      </div>
                    </div>
                  );
                  const n = compliance.nutrition;
                  const dvPct = (val, dv) => dv ? Math.round(val / dv * 100) : null;
                  const DAILY_VALUES = { totalFat:78, satFat:20, cholesterol:300, sodium:2300, totalCarbs:275, fiber:28, addedSugars:50, protein:50, vitD:20, calcium:1300, iron:18, potassium:4700 };

                  return (
                    <div className="space-y-4 text-xs">

                      {/* Allergen warning banner */}
                      {hasContains && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-rose-400 text-xs">Contains Major Allergens</p>
                            <p className="text-rose-300/70 text-[11px] mt-0.5">
                              This product contains FDA Big 9 allergens. Ensure proper labeling for all downstream customers.
                            </p>
                          </div>
                        </div>
                      )}
                      {!hasContains && hasMayContain && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-400 text-xs">May Contain Allergens</p>
                            <p className="text-amber-300/70 text-[11px] mt-0.5">Cross-contamination risk noted. Advisory disclosure required.</p>
                          </div>
                        </div>
                      )}
                      {!hasContains && !hasMayContain && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="font-bold text-emerald-400 text-xs">Free From All Big 9 Allergens</p>
                        </div>
                      )}

                      {/* Origin + Certs */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-gray-500">Origin:</span>
                        <span className="text-gray-200 font-medium">{compliance.countryOfOrigin}</span>
                        {compliance.certifications.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">{c}</span>
                        ))}
                      </div>

                      {/* Big 9 Allergen Matrix */}
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">FDA Big 9 Allergen Declarations</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {BIG_9.map(a => (
                            <div key={a.id} className={`flex flex-col items-center justify-center p-2 rounded-lg text-center ${allergenPill(compliance.allergens[a.id])}`}>
                              <span className="text-[9px] font-bold leading-tight">{a.label}</span>
                              <span className="text-[8px] mt-0.5 opacity-80">{allergenLabel(compliance.allergens[a.id])}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* FDA Nutrition Facts Panel */}
                      <div className="border-2 border-gray-400 rounded overflow-hidden">
                        {/* Header */}
                        <div className="bg-gray-800 px-3 py-2 border-b-4 border-gray-400">
                          <p className="text-gray-100 font-black text-lg leading-none">Nutrition Facts</p>
                          <p className="text-gray-400 text-[10px] mt-1">{n.servingsPerContainer} servings per container</p>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-gray-300 text-[11px] font-semibold">Serving size</span>
                            <span className="text-gray-100 font-bold text-sm">{n.servingSize}</span>
                          </div>
                        </div>
                        {/* Calories */}
                        <div className="bg-gray-800 px-3 py-2 border-b-4 border-gray-400 flex items-end justify-between">
                          <div>
                            <p className="text-gray-400 text-[10px]">Amount per serving</p>
                            <p className="text-gray-100 font-black text-sm">Calories</p>
                          </div>
                          <p className="text-gray-100 font-black text-4xl leading-none">{n.calories}</p>
                        </div>
                        {/* DV header */}
                        <div className="bg-gray-800 px-3 py-1 border-b border-gray-600 flex justify-end">
                          <span className="text-gray-400 text-[9px]">% Daily Value*</span>
                        </div>
                        {/* Nutrient rows */}
                        {[
                          { label:'Total Fat',        val:`${n.totalFat}g`,       dv: dvPct(n.totalFat,    DAILY_VALUES.totalFat),   bold:true  },
                          { label:'  Saturated Fat',  val:`${n.satFat}g`,         dv: dvPct(n.satFat,      DAILY_VALUES.satFat)               },
                          { label:'  Trans Fat',      val:`${n.transFat}g`,       dv: null                                                     },
                          { label:'Cholesterol',      val:`${n.cholesterol}mg`,   dv: dvPct(n.cholesterol, DAILY_VALUES.cholesterol), bold:true  },
                          { label:'Sodium',           val:`${n.sodium}mg`,        dv: dvPct(n.sodium,      DAILY_VALUES.sodium),      bold:true  },
                          { label:'Total Carbohydrate',val:`${n.totalCarbs}g`,    dv: dvPct(n.totalCarbs,  DAILY_VALUES.totalCarbs),  bold:true  },
                          { label:'  Dietary Fiber',  val:`${n.fiber}g`,          dv: dvPct(n.fiber,       DAILY_VALUES.fiber)                  },
                          { label:'  Total Sugars',   val:`${n.sugars}g`,         dv: null                                                     },
                          { label:'    Incl. Added Sugars', val:`${n.addedSugars}g`, dv: dvPct(n.addedSugars, DAILY_VALUES.addedSugars)         },
                          { label:'Protein',          val:`${n.protein}g`,        dv: null,                                          bold:true  },
                        ].map((row, i) => (
                          <div key={i} className={`flex items-center justify-between px-3 py-1 border-b border-gray-700 bg-gray-850 ${row.bold ? '' : 'pl-5'}`}>
                            <span className={`text-[10px] ${row.bold ? 'font-bold text-gray-200' : 'text-gray-400'}`}>{row.label}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-300">{row.val}</span>
                              {row.dv != null && <span className="text-[10px] font-bold text-gray-200 w-8 text-right">{row.dv}%</span>}
                            </div>
                          </div>
                        ))}
                        {/* Vitamins/Minerals */}
                        <div className="border-t-4 border-gray-400 bg-gray-800 px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          {[
                            { label:'Vitamin D', val:n.vitD,   unit:'mcg', dv:DAILY_VALUES.vitD    },
                            { label:'Calcium',   val:n.calcium, unit:'mg', dv:DAILY_VALUES.calcium  },
                            { label:'Iron',      val:n.iron,    unit:'mg', dv:DAILY_VALUES.iron     },
                            { label:'Potassium', val:n.potassium,unit:'mg',dv:DAILY_VALUES.potassium },
                          ].map(m => (
                            <div key={m.label} className="flex items-center justify-between">
                              <span className="text-[9px] text-gray-400">{m.label} {m.val}{m.unit}</span>
                              <span className="text-[9px] font-bold text-gray-300">{dvPct(m.val, m.dv) ?? 0}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-gray-800 px-3 py-2 border-t border-gray-600">
                          <p className="text-gray-600 text-[9px]">*The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
