import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingBag, Search, ClipboardList, History, AlertTriangle,
  CheckCircle2, CheckCircle, Plus, Minus, Info, LogOut,
  ChevronRight, Package, Scan, ScanBarcode, Camera, X,
  CreditCard, FileText, Truck, Clock, UserCircle, RotateCcw,
  FileWarning, Box, MapPin, PenTool, Sparkles, RefreshCw, Repeat, Pause, Play, Trash2, AlertCircle,
  Eye, EyeOff, Lock, Mail,
} from 'lucide-react';
import { useKernal } from './KernalContext.jsx';

import { UI } from './ui.js';

import { Modal, ModalOverlay, Overlay, ModalBox, ModalHeader, DocModalHeader } from './shared/Modal.jsx';

import { TODAY, StatusBadge, PrintButton, ExportButton } from './shared/components.jsx';

import { MOCK_INVENTORY, INVENTORY_BY_ID, INVENTORY_BY_SKU } from './shared/mockInventory.js';
import { DEMO_MODE } from './lib/demoMode.js';

// ─── Mock Customers ───────────────────────────────────────────────────────────
const DEMO_CUSTOMERS = [
  {
    id: 'CUST-501',
    name: "Joe's Steakhouse — Downtown",
    email: 'joe@joessteakhouse.com',
    password: 'demo123',
    creditLimit: 50000,
    availableCredit: 12500,
    creditHold: false,
    arAging: { days90: 0 },
    terms: 'Net-30',
    route: 'Route-12',
    deliveryDays: [2, 4],
    contractPricing: { 3: 79.00 },
    orderGuideIds: [3, 45],
    pricingTier: null,
    invoices: [
      { id: 'INV-1029', date: '2026-03-15', dueDate: '2026-04-14', amount: 1250.00, status: 'Overdue' },
      { id: 'INV-1045', date: '2026-04-01', dueDate: '2026-05-01', amount: 3400.00, status: 'Open' },
    ],
    initialOrders: [
      {
        id: 'SO-9882', date: '2026-04-20', total: 450.00, status: 'Shipped',
        lineItems: [
          { id: 3,  qty: 5, price: 79.00 },
          { id: 45, qty: 1, price: 35.00 },
        ],
      },
    ],
    initialReturns: [
      { id: 'RMA-1029', orderId: 'SO-9801', date: '2026-04-10', amount: 158.00, status: 'Credited' },
    ],
    initialStandingOrders: [
      {
        id: 'SO-TPL-001', name: 'Weekly Protein Run', frequency: 'Weekly', dayOfWeek: 2,
        nextGenDate: '2026-05-27', status: 'Active', items: [{ id: 3, qty: 10 }, { id: 45, qty: 5 }], createdDate: '2026-01-15',
      },
      {
        id: 'SO-TPL-002', name: 'Bi-Weekly Dry Goods', frequency: 'Bi-weekly', dayOfWeek: 4,
        nextGenDate: '2026-06-04', status: 'Paused', items: [{ id: 78, qty: 8 }], createdDate: '2026-02-03',
      },
    ],
  },
  {
    id: 'CUST-502',
    name: 'City School District',
    email: 'orders@cityschools.edu',
    password: 'demo123',
    creditLimit: 200000,
    availableCredit: 87500,
    creditHold: false,
    arAging: { days90: 0 },
    terms: 'Net-45',
    route: 'Route-7',
    deliveryDays: [1, 3, 5],
    contractPricing: { 45: 28.50, 78: 14.00 },
    orderGuideIds: [45, 78],
    pricingTier: null,
    invoices: [
      { id: 'INV-2110', date: '2026-04-10', dueDate: '2026-05-25', amount: 8420.00, status: 'Open' },
    ],
    initialOrders: [
      {
        id: 'SO-8801', date: '2026-04-18', total: 2340.00, status: 'Delivered',
        lineItems: [
          { id: 45, qty: 40, price: 28.50 },
          { id: 78, qty: 30, price: 14.00 },
        ],
      },
    ],
    initialReturns: [],
    initialStandingOrders: [
      {
        id: 'SO-TPL-010', name: 'Monday Produce Run', frequency: 'Weekly', dayOfWeek: 1,
        nextGenDate: '2026-06-01', status: 'Active', items: [{ id: 45, qty: 50 }, { id: 78, qty: 40 }], createdDate: '2026-01-20',
      },
    ],
  },
  {
    id: 'CUST-503',
    name: 'Harbor View Hotel',
    email: 'procurement@harborview.com',
    password: 'demo123',
    creditLimit: 100000,
    availableCredit: 0,
    creditHold: true,
    arAging: { days90: 14200 },
    terms: 'Net-30',
    route: 'Route-3',
    deliveryDays: [2, 5],
    contractPricing: {},
    orderGuideIds: [3, 45, 78],
    pricingTier: null,
    invoices: [
      { id: 'INV-3001', date: '2026-02-01', dueDate: '2026-03-03', amount: 14200.00, status: 'Overdue' },
      { id: 'INV-3015', date: '2026-03-15', dueDate: '2026-04-14', amount: 5300.00, status: 'Overdue' },
    ],
    initialOrders: [
      {
        id: 'SO-7720', date: '2026-02-14', total: 14200.00, status: 'Delivered',
        lineItems: [
          { id: 3, qty: 100, price: 85.00 },
          { id: 45, qty: 80, price: 35.00 },
        ],
      },
    ],
    initialReturns: [],
    initialStandingOrders: [],
  },
  {
    id: 'CUST-504',
    name: 'Bayou Grill & Pub',
    email: 'bayougrill@email.com',
    password: 'demo123',
    creditLimit: 25000,
    availableCredit: 24100,
    creditHold: false,
    arAging: { days90: 0 },
    terms: 'Net-15',
    route: 'Route-9',
    deliveryDays: [3, 6],
    contractPricing: { 205: 12.00 },
    orderGuideIds: [205, 3],
    pricingTier: null,
    invoices: [
      { id: 'INV-4002', date: '2026-05-10', dueDate: '2026-05-25', amount: 900.00, status: 'Open' },
    ],
    initialOrders: [
      {
        id: 'SO-6610', date: '2026-05-08', total: 900.00, status: 'Pending',
        lineItems: [
          { id: 205, qty: 20, price: 12.00 },
          { id: 3,   qty: 5,  price: 85.00 },
        ],
      },
    ],
    initialReturns: [],
    initialStandingOrders: [],
  },
];

const RETURN_REASONS = [
  'Damaged/Spoiled',
  'Wrong Item Delivered',
  'Missing from Delivery',
  'Quality Issue',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAvailableStock = (item, allOrders) => {
  const physical = item.lots
    .filter(l => !l.qcHold)
    .reduce((s, l) => s + l.qty, 0);

  const allocated = allOrders
    .filter(o => o.status === 'Pending' || o.status === 'Pending Approval')
    .reduce((s, o) => {
      const line = o.lineItems.find(li => li.id === item.id);
      return s + (line ? line.qty : 0);
    }, 0);

  return Math.max(0, physical - allocated);
};

const getItemPrice = (item, contractPricing = {}, tierMultiplier = 1.0) =>
  contractPricing[item.id] != null ? contractPricing[item.id] : item.price * tierMultiplier;

const getNextDeliveryDate = (deliveryDays = []) => {
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + i);
    if (deliveryDays.includes(candidate.getDay())) {
      return candidate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  }
  return 'Contact Dispatch';
};

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const customer = DEMO_CUSTOMERS.find(
        c => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password
      );
      setLoading(false);
      if (customer) {
        onLogin(customer);
      } else {
        setError('Invalid email or password. Try one of the demo accounts below.');
      }
    }, 700);
  };

  const quickFill = (customer) => {
    setEmail(customer.email);
    setPassword(customer.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Branding */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Box size={32} className="text-cyan-500" />
          <span className="text-3xl font-black uppercase tracking-widest text-cyan-500">Kernel</span>
        </div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">B2B Order Portal</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-100 tracking-wide">Sign In</h2>
          <p className="text-xs text-gray-500 mt-1">Enter your account credentials to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className={`${UI.input} pl-10`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`${UI.input} pl-10 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-400 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-gray-950 font-bold text-sm uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="px-6 pb-6 border-t border-gray-800 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">
            Demo accounts · all passwords: <span className="text-gray-500 font-mono">demo123</span>
          </p>
          <div className="space-y-2">
            {DEMO_CUSTOMERS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => quickFill(c)}
                className="w-full text-left px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-cyan-500/30 hover:bg-gray-900 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-200 group-hover:text-cyan-400 transition-colors truncate pr-2">{c.name}</span>
                  {c.creditHold && (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      Hold
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 font-mono mt-0.5 truncate">{c.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Real Barcode Scanner ─────────────────────────────────────────────────────
function RealBarcodeScanner({ onScan, onClose }) {
  const videoRef        = useRef(null);
  const streamRef       = useRef(null);
  const rafRef          = useRef(null);
  const onScanRef       = useRef(onScan);
  onScanRef.current     = onScan;

  const [camError, setCamError]     = useState('');
  const [supported, setSupported]   = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [manualVal, setManualVal]   = useState('');
  const [lastScan, setLastScan]     = useState('');

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
      setSupported(false);
      setManualMode(true);
      return;
    }

    let cancelled = false;
    const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'upc_a', 'code_39', 'data_matrix'] });

    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scan();
      } catch (err) {
        if (!cancelled) {
          setCamError('Camera access denied. Use manual entry below.');
          setManualMode(true);
        }
      }
    };

    const scan = () => {
      if (cancelled || !videoRef.current) return;
      detector.detect(videoRef.current).then(barcodes => {
        if (!cancelled && barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          setLastScan(code);
          onScanRef.current(code);
        }
        if (!cancelled) rafRef.current = requestAnimationFrame(scan);
      }).catch(() => {
        if (!cancelled) rafRef.current = requestAnimationFrame(scan);
      });
    };

    startCam();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const v = manualVal.trim();
    if (!v) return;
    setLastScan(v);
    setManualVal('');
    onScanRef.current(v);
  };

  return (
    <div className="flex flex-col bg-gray-950 relative rounded-2xl overflow-hidden">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <h3 className="text-cyan-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <ScanBarcode className="w-4 h-4" /> Barcode Scanner
        </h3>
        <button onClick={onClose} className="text-gray-400 bg-gray-900/80 p-2 rounded-full hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center px-6 py-16 overflow-hidden bg-gray-950" style={{ minHeight: 300 }}>
        {/* Live camera feed */}
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: supported && !manualMode ? 'block' : 'none' }}
        />
        {/* Darkening vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 40% at 50% 50%, transparent 0%, rgba(3,7,18,0.75) 100%)',
        }} />

        {/* Corner-bracket frame */}
        <div className="w-full max-w-sm aspect-square border border-cyan-500/30 rounded-3xl relative z-10 flex items-center justify-center">
          <div className="w-full h-0.5 bg-cyan-500 opacity-80 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          <div className="absolute top-0    left-0  w-12 h-12 border-t-4 border-l-4 border-cyan-500 rounded-tl-3xl -translate-x-px -translate-y-px" />
          <div className="absolute top-0    right-0 w-12 h-12 border-t-4 border-r-4 border-cyan-500 rounded-tr-3xl  translate-x-px -translate-y-px" />
          <div className="absolute bottom-0 left-0  w-12 h-12 border-b-4 border-l-4 border-cyan-500 rounded-bl-3xl -translate-x-px  translate-y-px" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-500 rounded-br-3xl  translate-x-px  translate-y-px" />

          {/* Camera error banner inside frame */}
          {camError && (
            <div className="absolute inset-x-4 top-4 bg-rose-500/90 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl text-center z-20">
              {camError}
            </div>
          )}
        </div>
      </div>

      {/* Bottom panel */}
      <div className="bg-gray-900 border-t border-gray-800 p-6 text-center space-y-4 z-10">
        {lastScan && (
          <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
            ✓ Scanned: <span className="font-mono">{lastScan}</span>
          </p>
        )}

        {!supported && (
          <p className="text-amber-400 text-xs font-medium">
            Camera barcode scanning isn't supported on this browser. Enter barcode manually below.
          </p>
        )}

        {/* Manual toggle */}
        {supported && !camError && (
          <button
            onClick={() => setManualMode(v => !v)}
            className="text-[11px] text-gray-500 hover:text-cyan-400 font-bold uppercase tracking-widest transition-colors"
          >
            {manualMode ? '← Use Camera' : 'Enter barcode manually'}
          </button>
        )}

        {/* Manual entry form */}
        {manualMode && (
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualVal}
              onChange={e => setManualVal(e.target.value)}
              placeholder="Enter barcode…"
              autoFocus
              className={`${UI.input} flex-1 text-sm`}
            />
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs uppercase tracking-widest px-5 rounded-xl transition-colors"
            >
              Add
            </button>
          </form>
        )}

        {!manualMode && supported && !camError && (
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            Point camera at product barcode to add to cart.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ item, cartQty, availableStock, onUpdate, contractPricing = {}, tierMultiplier = 1.0, customerPricingEnabled = false }) => {
  const isContract   = contractPricing[item.id] != null;
  const currentPrice = getItemPrice(item, contractPricing, tierMultiplier);

  return (
    <div className={`${UI.card} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden transition-colors hover:border-cyan-500/30`}>
      {isContract && (
        <div className="absolute top-4 -right-10 bg-cyan-500 text-gray-950 text-[9px] font-black tracking-widest uppercase px-10 py-1 rotate-45 shadow-sm">
          CONTRACT
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="pr-8 min-w-0">
            <h4 className="font-bold text-gray-100 text-lg tracking-wide truncate">{item.name}</h4>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-mono text-gray-500 uppercase tracking-widest">
              <span>SKU: {item.sku}</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>UOM: {item.uom}</span>
            </div>
          </div>
          {/* Mobile price */}
          <div className="text-right sm:hidden">
            {isContract ? (
              <div className="flex flex-col items-end">
                {customerPricingEnabled && tierMultiplier < 1.0 && <span className="text-[10px] text-gray-500 line-through font-mono">{fmt(item.price)}</span>}
                <span className="font-bold text-emerald-400 text-lg">{fmt(currentPrice)}</span>
              </div>
            ) : (
              <span className="font-bold text-gray-100 text-lg">{fmt(currentPrice)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={availableStock > 0 ? UI.badgeEmerald : UI.badgeRose}>
            {availableStock > 0 ? `${availableStock} In Stock` : 'Out of Stock'}
          </span>
          {item.isCatchWeight && (
            <span className={UI.badgeAmber}>
              <AlertTriangle size={11} /> Est. {item.avgWeightLbs} lbs
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-gray-800/50 sm:border-0 pt-4 sm:pt-0 mt-3 sm:mt-0">
        {/* Desktop price */}
        <div className="hidden sm:block text-right">
          {isContract ? (
            <div className="flex flex-col items-end">
              {customerPricingEnabled && tierMultiplier < 1.0 && <span className="text-xs text-gray-500 line-through font-mono">{fmt(item.price)}</span>}
              <span className="font-bold text-emerald-400 text-xl">{fmt(currentPrice)}</span>
            </div>
          ) : (
            <span className="font-bold text-gray-100 text-xl">{fmt(currentPrice)}</span>
          )}
        </div>

        <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => onUpdate(-1)}
            disabled={cartQty === 0}
            className="w-10 h-10 flex items-center justify-center bg-gray-900 rounded-lg text-gray-400 hover:text-cyan-500 hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            <Minus size={16} strokeWidth={3} />
          </button>
          <span className="w-14 text-center font-bold text-gray-100 text-lg">{cartQty}</span>
          <button
            onClick={() => onUpdate(1)}
            disabled={cartQty >= availableStock}
            className="w-10 h-10 flex items-center justify-center bg-cyan-500 rounded-lg text-gray-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 transition-colors"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Module ──────────────────────────────────────────────────────────────
export default function B2BPortalModule() {
  const { settings } = useKernal();
  const customerPricingEnabled = settings.features.customerPricing;
  const pricingTiers = settings.pricing?.tiers || [];

  // ── Auth state (all hooks BEFORE early return) ────────────────────────────
  const [currentCustomer, setCurrentCustomer] = useState(() => {
    try { const s = sessionStorage.getItem('kernel_b2b_session'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  // Per-customer tier
  const tierMultiplier = customerPricingEnabled && currentCustomer
    ? (pricingTiers.find(t => t.id === currentCustomer.pricingTier)?.multiplier ?? 1.0)
    : 1.0;
  const tierMeta = customerPricingEnabled && currentCustomer
    ? pricingTiers.find(t => t.id === currentCustomer.pricingTier)
    : null;

  // ── Per-customer derived state ────────────────────────────────────────────
  const orderGuideIds = currentCustomer?.orderGuideIds ?? [];

  const [activeTab, setActiveTab]                   = useState('guide');
  const [standingOrders, setStandingOrders]         = useState([]);
  const [showStandingModal, setShowStandingModal]   = useState(false);
  const [editingStanding, setEditingStanding]       = useState(null);
  const [cart, setCart]                             = useState({});
  const [searchQuery, setSearchQuery]               = useState('');
  const [orders, setOrders]                         = useState([]);
  const [returns, setReturns]                       = useState([]);
  const [historyView, setHistoryView]               = useState('orders');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen]           = useState(false);
  const [toastMessage, setToastMessage]             = useState(null);
  const [selectedInvoices, setSelectedInvoices]     = useState([]);
  const [returnModalOrder, setReturnModalOrder]     = useState(null);
  const [returnSelections, setReturnSelections]     = useState({});
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [hasSigned, setHasSigned]                   = useState(false);
  const [isDrawing, setIsDrawing]                   = useState(false);
  const canvasRef = useRef(null);

  // Re-init per-customer data when customer changes (login / session restore / switch)
  useEffect(() => {
    if (!currentCustomer) return;
    setOrders(currentCustomer.initialOrders || []);
    setReturns(currentCustomer.initialReturns || []);
    setStandingOrders(DEMO_MODE ? (currentCustomer.initialStandingOrders || []) : []);
    setCart({});
    setSelectedInvoices([]);
    setActiveTab('guide');
  }, [currentCustomer?.id]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = useCallback((customer) => {
    setCurrentCustomer(customer);
    try { sessionStorage.setItem('kernel_b2b_session', JSON.stringify(customer)); } catch {}
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentCustomer(null);
    setOrders([]); setReturns([]); setStandingOrders([]); setCart({});
    setSelectedInvoices([]); setHasSigned(false);
    try { sessionStorage.removeItem('kernel_b2b_session'); } catch {}
  }, []);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ── Cart ─────────────────────────────────────────────────────────────────
  const handleCartUpdate = useCallback((itemId, delta, stockLimit) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next    = current + delta;
      if (next < 0) return prev;
      if (next > stockLimit) {
        setTimeout(() => showToast('Maximum available stock reached.', 'error'), 0);
        return prev;
      }
      const updated = { ...prev, [itemId]: next };
      if (next === 0) delete updated[itemId];
      return updated;
    });
  }, [showToast]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const contractPricing = currentCustomer?.contractPricing ?? {};

  const cartSubtotal = useMemo(() =>
    Object.entries(cart).reduce((total, [id, qty]) => {
      const item = MOCK_INVENTORY.find(i => i.id === parseInt(id));
      return total + (item ? getItemPrice(item, contractPricing, tierMultiplier) * qty : 0);
    }, 0),
  [cart, contractPricing, tierMultiplier]);

  // ── Checkout ──────────────────────────────────────────────────────────────
  const onCreditHold = (currentCustomer?.creditHold || (currentCustomer?.arAging?.days90 ?? 0) > 0) ?? false;

  const handleCheckout = useCallback(() => {
    if (!currentCustomer) return;
    const exceedsCredit = cartSubtotal > currentCustomer.availableCredit;
    const lineItems = Object.entries(cart).map(([id, qty]) => {
      const item = MOCK_INVENTORY.find(i => i.id === parseInt(id));
      return { id: item.id, qty, price: getItemPrice(item, contractPricing, tierMultiplier) };
    });
    const newOrder = {
      id: `SO-${Math.floor(Math.random() * 9000) + 1000}`,
      date: new Date().toISOString().slice(0, 10),
      total: cartSubtotal,
      status: exceedsCredit ? 'Pending Approval' : 'Pending',
      lineItems,
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart({});
    setHasSigned(false);
    setShowCheckoutSuccess(exceedsCredit ? 'approval' : 'success');

    setTimeout(() => {
      setShowCheckoutSuccess(false);
      setActiveTab('history');
      setHistoryView('orders');
    }, 3000);
  }, [cart, cartSubtotal, currentCustomer, contractPricing, tierMultiplier]);

  // ── Returns ───────────────────────────────────────────────────────────────
  const handleReturnSelection = useCallback((itemId, field, value) => {
    setReturnSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  }, []);

  const submitReturn = useCallback(() => {
    const selected = Object.entries(returnSelections).filter(([, d]) => d.selected);
    if (selected.length === 0) {
      showToast('Please select at least one item to return.', 'error');
      return;
    }

    const returnTotal = selected.reduce(
      (s, [, d]) => s + (d.price || 0) * (d.qty || 1), 0
    );

    const rmaPayload = selected.map(([id, d]) => ({
      inventoryId: parseInt(id),
      action: 'RECEIVE_RETURN',
      newLot: {
        lotId: `RMA-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        qty: d.qty || 1,
        qcHold: true,
        reason: d.reason || RETURN_REASONS[0],
      },
    }));

    console.log('[Kernel → Inventory API] RMA QC Hold payload:', JSON.stringify(rmaPayload, null, 2));

    const newReturn = {
      id: `RMA-${Math.floor(Math.random() * 9000) + 1000}`,
      orderId: returnModalOrder.id,
      date: new Date().toISOString().slice(0, 10),
      amount: returnTotal,
      status: 'Pending Review',
    };

    setReturns(prev => [newReturn, ...prev]);
    setReturnModalOrder(null);
    setReturnSelections({});
    setHistoryView('returns');
    showToast(`Return ${newReturn.id} submitted for review.`, 'success');
  }, [returnSelections, returnModalOrder, showToast]);

  // ── Scanner ───────────────────────────────────────────────────────────────
  const handleBarcodeScan = useCallback((barcode) => {
    const item = MOCK_INVENTORY.find(i => i.barcode === barcode);
    if (item) {
      const stock = getAvailableStock(item, orders);
      handleCartUpdate(item.id, 1, stock);
      showToast(`${item.name} added to cart.`, 'success');
      setIsScannerOpen(false);
    } else {
      showToast('Barcode not found in catalog.', 'error');
    }
  }, [orders, handleCartUpdate, showToast]);

  // ── Signature Pad ─────────────────────────────────────────────────────────
  const getCanvasCoords = useCallback((e, canvas) => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { x, y } = getCanvasCoords(e, canvas);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [getCanvasCoords]);

  const draw = useCallback((e) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const { x, y } = getCanvasCoords(e, canvas);
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getCanvasCoords]);

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const clearSignature = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  const saveSignature = useCallback(() => {
    setSignatureModalOpen(false);
    setHasSigned(true);
  }, []);

  // ── Invoice toggle ────────────────────────────────────────────────────────
  const toggleInvoice = useCallback((invId) => {
    setSelectedInvoices(prev =>
      prev.includes(invId) ? prev.filter(id => id !== invId) : [...prev, invId]
    );
  }, []);

  // ── AUTH GUARD — must be after all hooks ──────────────────────────────────
  if (!currentCustomer) return <LoginScreen onLogin={handleLogin} />;

  const customerInvoices = currentCustomer.invoices || [];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={UI.page}>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-5 py-3.5 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 border backdrop-blur-md ${
            toastMessage.type === 'error'   ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
            toastMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                              'bg-cyan-600/20 text-cyan-500 border-cyan-600/30'
          }`}>
            {toastMessage.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {toastMessage.message}
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className={`${UI.glassHeader} p-5 sticky top-0 z-20 shadow-sm`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3 uppercase tracking-widest text-cyan-500">
              <Box size={24} className="text-cyan-500" />
              Kernel
            </h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">B2B Order Portal · {currentCustomer.name}</p>
            {customerPricingEnabled && tierMeta && (
              <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${tierMeta.bg} ${tierMeta.color}`}>
                {tierMeta.label} Pricing — {Math.round((1 - tierMeta.multiplier) * 100)}% off list
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-gray-950 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500 shadow-inner"
            >
              <Scan size={16} />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-rose-400 transition-colors p-2 bg-gray-900 rounded-full border border-gray-800"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Credit Hold Banner ──────────────────────────────────────────── */}
      {onCreditHold && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-5 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="text-rose-400 font-bold text-sm">Account on Credit Hold</span>
              <span className="text-rose-300/70 text-xs ml-3">
                {currentCustomer.creditHold
                  ? 'This account has been placed on hold by the finance team. New orders are blocked.'
                  : `This account has $${currentCustomer.arAging.days90.toLocaleString()} past due 60+ days. Please contact your sales rep to place orders.`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-32">

        {/* ════════════════════════════════════════════════════════════════
            ORDER GUIDE TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'guide' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-100 tracking-wide mb-2">Weekly Staples</h2>
              <p className="text-gray-500 text-sm">Your customized order guide for fast replenishment.</p>
            </div>
            <div className="space-y-4">
              {MOCK_INVENTORY.filter(item => orderGuideIds.includes(item.id)).map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  cartQty={cart[item.id] || 0}
                  availableStock={getAvailableStock(item, orders)}
                  onUpdate={delta => handleCartUpdate(item.id, delta, getAvailableStock(item, orders))}
                  contractPricing={contractPricing}
                  tierMultiplier={tierMultiplier}
                  customerPricingEnabled={customerPricingEnabled}
                />
              ))}
              {orderGuideIds.length === 0 && (
                <div className="text-center py-16 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                  <ClipboardList className="mx-auto text-gray-600 mb-5" size={48} />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No order guide items configured.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CATALOG TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'catalog' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-100 tracking-wide mb-4">Master Catalog</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, SKU, or category…"
                  className={`${UI.input} pl-12 text-base`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              {MOCK_INVENTORY.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  cartQty={cart[item.id] || 0}
                  availableStock={getAvailableStock(item, orders)}
                  onUpdate={delta => handleCartUpdate(item.id, delta, getAvailableStock(item, orders))}
                  contractPricing={contractPricing}
                  tierMultiplier={tierMultiplier}
                  customerPricingEnabled={customerPricingEnabled}
                />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            CART TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'cart' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-100 tracking-wide mb-8">Review Order</h2>

            {cartCount === 0 ? (
              <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                <ShoppingBag className="mx-auto text-gray-600 mb-5" size={56} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-6">Your cart is empty</p>
                <button
                  onClick={() => setActiveTab('guide')}
                  className="text-cyan-500 font-bold uppercase tracking-widest text-xs hover:text-cyan-400 transition-colors border border-cyan-500/30 px-6 py-3 rounded-lg hover:bg-cyan-500/5"
                >
                  Return to Order Guide
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Logistics card */}
                <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-5 shadow-inner">
                  <div className="bg-sky-500/10 p-3 rounded-xl text-sky-400 border border-sky-500/20 w-fit">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sky-400 tracking-wide text-lg">Logistics & Delivery</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2 text-sm text-sky-300/80">
                      <span className="flex items-center gap-2"><MapPin size={14} /> {currentCustomer.route}</span>
                      <span className="hidden sm:inline text-sky-500/50">·</span>
                      <span className="flex items-center gap-2"><Clock size={14} /> Cut-off: 4:00 PM</span>
                      <span className="hidden sm:inline text-sky-500/50">·</span>
                      <span className="font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded text-xs uppercase tracking-widest">
                        Est: {getNextDeliveryDate(currentCustomer.deliveryDays)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cross-sell banner */}
                {!cart[205] && (
                  <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/30 flex gap-4 items-start shadow-inner">
                    <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={24} />
                    <div>
                      <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-2">Recommended Add-on</p>
                      <p className="text-sm text-indigo-300/80 mb-4 leading-relaxed">
                        Accounts ordering <strong className="text-indigo-300">Ground Beef</strong> typically pair it with <strong className="text-indigo-300">Brioche Buns</strong>.
                      </p>
                      <button
                        onClick={() => {
                          const buns = MOCK_INVENTORY.find(i => i.id === 205);
                          if (buns) handleCartUpdate(205, 1, getAvailableStock(buns, orders));
                        }}
                        className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition shadow-md shadow-indigo-500/20"
                      >
                        + Add Brioche Buns
                      </button>
                    </div>
                  </div>
                )}

                {/* Cart line items */}
                <div className={`${UI.card} overflow-hidden`}>
                  <div className="p-4 border-b border-gray-800 bg-gray-900/80">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Order Contents</h3>
                  </div>
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = MOCK_INVENTORY.find(i => i.id === parseInt(id));
                    if (!item) return null;
                    const price = getItemPrice(item, contractPricing, tierMultiplier);
                    return (
                      <div key={id} className="p-5 border-b border-gray-800/50 last:border-0 flex justify-between items-center hover:bg-gray-900/50 transition-colors">
                        <div>
                          <p className="font-bold text-gray-200">{item.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-1">{qty} × {fmt(price)}</p>
                        </div>
                        <p className="font-bold text-emerald-400 text-lg tracking-wide">{fmt(qty * price)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Catch-weight notice */}
                {Object.keys(cart).some(id => MOCK_INVENTORY.find(i => i.id === parseInt(id))?.isCatchWeight) && (
                  <div className="bg-cyan-600/10 border border-cyan-600/20 rounded-xl p-4 flex gap-4 text-cyan-500">
                    <Info className="shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-medium leading-relaxed">
                      <strong className="uppercase tracking-widest text-xs mr-2">Catch-Weight Items:</strong>
                      The final invoice amount will be adjusted based on the exact weight picked by the warehouse team.
                    </p>
                  </div>
                )}

                {/* Summary & checkout */}
                <div className="bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800 p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-5">Order Summary</h3>
                  <div className="space-y-3 mb-6 text-sm font-mono">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal (Estimated)</span>
                      <span>{fmt(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Tax & Surcharges</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-100 pt-4 border-t border-gray-800 mt-2">
                      <span>Total</span>
                      <span className="text-emerald-400">{fmt(cartSubtotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => setSignatureModalOpen(true)}
                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-colors ${
                        hasSigned
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-gray-950 text-gray-400 hover:text-cyan-500 border-gray-800 hover:border-cyan-500/30 shadow-inner'
                      }`}
                    >
                      <PenTool size={16} />
                      {hasSigned ? 'Authorization Signed ✓' : 'Tap to E-Sign Authorization'}
                    </button>

                    <button
                      onClick={handleCheckout}
                      disabled={!hasSigned || onCreditHold}
                      className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${
                        onCreditHold
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 cursor-not-allowed'
                          : !hasSigned
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 shadow-cyan-500/20'
                      }`}
                    >
                      {onCreditHold ? <><AlertCircle size={16} /> Order Blocked — Credit Hold</> : <>Place Order <ChevronRight size={18} /></>}
                    </button>
                  </div>

                  {cartSubtotal > currentCustomer.availableCredit && (
                    <p className="text-center text-xs text-rose-400 mt-4 font-bold uppercase tracking-widest">
                      Order exceeds credit limit — will be routed for approval.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            HISTORY TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              <h2 className="text-3xl font-bold text-gray-100 tracking-wide">Order History</h2>
              <div className="flex bg-gray-900 border border-gray-800 p-1.5 rounded-xl w-full sm:w-auto shadow-inner">
                <button
                  onClick={() => setHistoryView('orders')}
                  className={`flex-1 sm:px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    historyView === 'orders' ? 'bg-gray-800 text-cyan-500 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Purchases
                </button>
                <button
                  onClick={() => setHistoryView('returns')}
                  className={`flex-1 sm:px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    historyView === 'returns' ? 'bg-gray-800 text-cyan-500 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Returns (RMA)
                </button>
              </div>
            </div>

            {historyView === 'orders' ? (
              <div className="space-y-4">
                {orders.length === 0 && (
                  <div className="text-center py-16 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                    <History className="mx-auto text-gray-600 mb-5" size={48} />
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No orders on record.</p>
                  </div>
                )}
                {orders.map(order => (
                  <div key={order.id} className={`${UI.card} p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:border-cyan-500/30 transition-colors`}>
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="font-bold text-lg text-gray-100 font-mono tracking-wide">{order.id}</h4>
                        <span className={
                          order.status === 'Pending'          ? UI.badgeSky    :
                          order.status === 'Pending Approval' ? UI.badgeAmber  :
                          order.status === 'Shipped'          ? UI.badgeEmerald :
                          order.status === 'Delivered'        ? UI.badgeEmerald :
                          UI.badgeAmber
                        }>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-500">
                        {order.date} · {order.lineItems?.length || 0} item{order.lineItems?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right w-full sm:w-auto flex justify-between sm:flex-col sm:items-end border-t border-gray-800/50 sm:border-0 pt-4 sm:pt-0 gap-3">
                      <span className="font-black text-emerald-400 text-xl tracking-wide">{fmt(order.total)}</span>
                      {(order.status === 'Shipped' || order.status === 'Delivered') && (
                        <button
                          onClick={() => {
                            setReturnModalOrder(order);
                            const init = {};
                            order.lineItems.forEach(li => {
                              init[li.id] = { selected: false, qty: li.qty, reason: RETURN_REASONS[0], price: li.price };
                            });
                            setReturnSelections(init);
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 flex items-center gap-1.5 transition-colors border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 rounded-lg"
                        >
                          <RotateCcw size={14} /> Request Return
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {returns.length === 0 ? (
                  <div className="text-center py-16 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                    <FileWarning className="mx-auto text-gray-600 mb-5" size={48} />
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No returns on record.</p>
                  </div>
                ) : (
                  returns.map(ret => (
                    <div key={ret.id} className={`${UI.card} p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:border-cyan-500/30 transition-colors`}>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="font-bold text-lg text-gray-100 font-mono tracking-wide">{ret.id}</h4>
                          <span className={
                            ret.status === 'Pending Review' ? UI.badgeAmber  :
                            ret.status === 'Approved'       ? UI.badgeSky    :
                            ret.status === 'Credited'       ? UI.badgeEmerald :
                            UI.badgeAmber
                          }>
                            {ret.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-500">
                          {ret.date} · Ref: {ret.orderId}
                        </p>
                      </div>
                      <div className="border-t border-gray-800/50 sm:border-0 pt-4 sm:pt-0 w-full sm:w-auto text-right">
                        <span className="font-black text-emerald-400 text-xl tracking-wide">+{fmt(ret.amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STANDING ORDERS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'standing' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-100 tracking-wide">Standing Orders</h2>
                <p className="text-gray-500 text-sm mt-1">Recurring templates generated automatically on schedule.</p>
              </div>
              <button
                onClick={() => { setEditingStanding({ id: null, name: '', frequency: 'Weekly', dayOfWeek: 2, items: [], status: 'Active' }); setShowStandingModal(true); }}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-colors"
              >
                <Plus size={16} /> New Template
              </button>
            </div>

            {standingOrders.length === 0 ? (
              <div className="text-center py-24 text-gray-600">
                <RefreshCw size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg">No Standing Orders</p>
                <p className="text-sm mt-2">Create a recurring template to automate replenishment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {standingOrders.map(so => {
                  const totalItems = so.items.reduce((s, i) => s + i.qty, 0);
                  const estValue = so.items.reduce((s, li) => {
                    const inv = MOCK_INVENTORY.find(i => i.id === li.id);
                    return s + (inv ? getItemPrice(inv, contractPricing, tierMultiplier) * li.qty : 0);
                  }, 0);
                  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                  return (
                    <div key={so.id} className={`${UI.card} p-6 flex items-start gap-5 ${so.status === 'Paused' ? 'opacity-60' : ''}`}>
                      <div className={`p-3 rounded-xl ${so.status === 'Active' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-800 text-gray-500'}`}>
                        <RefreshCw size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-gray-100 text-lg">{so.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${so.status === 'Active' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}>{so.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1 mb-3">
                          <span className="flex items-center gap-1"><Repeat size={12} /> {so.frequency} on {DAYS[so.dayOfWeek]}s</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> Next gen: {so.nextGenDate}</span>
                          <span className="flex items-center gap-1"><Package size={12} /> {totalItems} units · {fmt(estValue)} est.</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {so.items.map(li => {
                            const inv = MOCK_INVENTORY.find(i => i.id === li.id);
                            return inv ? (
                              <span key={li.id} className="bg-gray-800 text-gray-300 text-[10px] font-mono px-2 py-1 rounded-lg">{inv.name} × {li.qty}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => setStandingOrders(prev => prev.map(s => s.id === so.id ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' } : s))}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 text-xs font-bold transition-colors"
                        >
                          {so.status === 'Active' ? <Pause size={13} /> : <Play size={13} />}
                          {so.status === 'Active' ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => setStandingOrders(prev => prev.filter(s => s.id !== so.id))}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 hover:border-rose-500/40 text-gray-400 hover:text-rose-400 text-xs font-bold transition-colors"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── New Standing Order Modal ── */}
            {showStandingModal && editingStanding && (
              <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
                <div className={`${UI.glassModal} w-full max-w-lg`}>
                  <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <h3 className="font-bold text-gray-100 flex items-center gap-2">
                      <RefreshCw size={18} className="text-cyan-500" /> New Standing Order
                    </h3>
                    <button onClick={() => setShowStandingModal(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
                  </div>
                  <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Template Name</label>
                      <input type="text" value={editingStanding.name} placeholder="e.g. Weekly Protein Run"
                        onChange={e => setEditingStanding(prev => ({ ...prev, name: e.target.value }))}
                        className={UI.input} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Frequency</label>
                        <select value={editingStanding.frequency} onChange={e => setEditingStanding(prev => ({ ...prev, frequency: e.target.value }))} className={UI.input}>
                          <option>Weekly</option>
                          <option>Bi-weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Day of Week</label>
                        <select value={editingStanding.dayOfWeek} onChange={e => setEditingStanding(prev => ({ ...prev, dayOfWeek: Number(e.target.value) }))} className={UI.input}>
                          {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase tracking-widest block mb-2">Items & Quantities</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {MOCK_INVENTORY.map(inv => {
                          const existing = editingStanding.items.find(i => i.id === inv.id);
                          const qty = existing?.qty || 0;
                          return (
                            <div key={inv.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-2.5">
                              <span className="text-sm text-gray-200 font-medium truncate pr-4">{inv.name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => {
                                  const newQty = qty - 1;
                                  if (newQty <= 0) setEditingStanding(prev => ({ ...prev, items: prev.items.filter(i => i.id !== inv.id) }));
                                  else setEditingStanding(prev => ({ ...prev, items: prev.items.map(i => i.id === inv.id ? { ...i, qty: newQty } : i) }));
                                }} disabled={qty === 0} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:text-gray-100 disabled:opacity-30 transition-colors">
                                  <Minus size={12} strokeWidth={3} />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-gray-100">{qty}</span>
                                <button onClick={() => {
                                  if (existing) setEditingStanding(prev => ({ ...prev, items: prev.items.map(i => i.id === inv.id ? { ...i, qty: i.qty + 1 } : i) }));
                                  else setEditingStanding(prev => ({ ...prev, items: [...prev.items, { id: inv.id, qty: 1 }] }));
                                }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-500 text-gray-950 hover:bg-cyan-400 transition-colors">
                                  <Plus size={12} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 border-t border-gray-800 flex gap-3">
                    <button onClick={() => setShowStandingModal(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm font-bold hover:border-gray-500 transition-colors">Cancel</button>
                    <button
                      onClick={() => {
                        if (!editingStanding.name.trim() || editingStanding.items.length === 0) {
                          showToast('Please add a name and at least one item.', 'warning');
                          return;
                        }
                        const today = new Date();
                        const diff = (editingStanding.dayOfWeek - today.getDay() + 7) % 7 || 7;
                        const nextDate = new Date(today);
                        nextDate.setDate(today.getDate() + diff);
                        const newOrder = {
                          ...editingStanding,
                          id: 'SO-TPL-' + String(Date.now()).slice(-5),
                          createdDate: today.toISOString().slice(0, 10),
                          nextGenDate: nextDate.toISOString().slice(0, 10),
                        };
                        setStandingOrders(prev => [...prev, newOrder]);
                        setShowStandingModal(false);
                        showToast('Standing order template saved!', 'success');
                      }}
                      className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-sm font-bold transition-colors"
                    >
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            ACCOUNT / AP TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'account' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-100 tracking-wide mb-8">Account & Billing</h2>

            {/* Credit overview */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <CreditCard size={120} className="text-cyan-500 rotate-12" />
              </div>
              <div className="relative z-10">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Available Credit</p>
                <h3 className="text-5xl font-black text-gray-100 tracking-tighter mb-6">
                  ${currentCustomer.availableCredit.toLocaleString()}
                </h3>
                <div className="w-full bg-gray-950 rounded-full h-3 overflow-hidden mb-3 border border-gray-800 shadow-inner">
                  <div
                    className="bg-cyan-500 h-3 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                    style={{ width: `${Math.min(100, (currentCustomer.availableCredit / currentCustomer.creditLimit) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-gray-500">
                  <span>$0</span>
                  <span>Limit: ${currentCustomer.creditLimit.toLocaleString()} · Terms: {currentCustomer.terms}</span>
                </div>
              </div>
            </div>

            {/* Open invoices */}
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Open Invoices</h3>
            {customerInvoices.length === 0 && (
              <div className="text-center py-12 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800">
                <FileText className="mx-auto text-gray-600 mb-4" size={40} />
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No open invoices.</p>
              </div>
            )}
            <div className="space-y-4">
              {customerInvoices.map(inv => {
                const isSelected = selectedInvoices.includes(inv.id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => toggleInvoice(inv.id)}
                    className={`${UI.card} p-5 cursor-pointer flex items-center gap-5 transition-colors ${
                      isSelected ? 'border-cyan-500 bg-cyan-500/5' : 'hover:border-cyan-500/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-cyan-500 border-cyan-500 text-gray-950' : 'border-gray-700 bg-gray-950'
                    }`}>
                      {isSelected && <CheckCircle2 size={16} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-100 font-mono tracking-wide">{inv.id}</span>
                        <span className="font-bold text-gray-100">{fmt(inv.amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">Due: {inv.dueDate}</span>
                        <span className={inv.status === 'Overdue' ? UI.badgeRose : UI.badgeAmber}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedInvoices.length > 0 && (
              <div className="mt-8 bg-gray-900/80 p-6 rounded-2xl shadow-lg border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                    {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
                  </span>
                  <span className="font-black text-2xl text-emerald-400 tracking-wide">
                    {fmt(selectedInvoices.reduce((t, id) => t + (customerInvoices.find(i => i.id === id)?.amount || 0), 0))}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const total = selectedInvoices.reduce((t, id) => t + (customerInvoices.find(i => i.id === id)?.amount || 0), 0);
                    showToast(`Payment of ${fmt(total)} submitted.`, 'success');
                    setSelectedInvoices([]);
                  }}
                  className="w-full bg-emerald-500 text-gray-950 py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"
                >
                  <CreditCard size={18} /> Pay Selected Invoices
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          CHECKOUT SUCCESS OVERLAY
      ════════════════════════════════════════════════════════════════════ */}
      {showCheckoutSuccess && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${UI.glassModal} p-10 max-w-sm w-full text-center`}>
            {showCheckoutSuccess === 'approval' ? (
              <>
                <div className="w-20 h-20 bg-cyan-600/10 border border-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="text-cyan-500" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-3 tracking-wide">Approval Required</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  This order exceeded your available credit and was routed to your Account Manager for review.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-emerald-400" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-3 tracking-wide">Order Placed</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your order has been received and routed to the warehouse for fulfillment.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          RETURN (RMA) MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {returnModalOrder && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`${UI.glassModal} w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden`}>
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 flex-shrink-0">
              <h3 className="font-bold text-gray-100 flex items-center gap-3 text-sm uppercase tracking-widest">
                <RotateCcw size={18} className="text-cyan-500" />
                Request Return — {returnModalOrder.id}
              </h3>
              <button onClick={() => setReturnModalOrder(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-gray-950/50 space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Select the items you'd like to return and specify the reason.
              </p>
              {returnModalOrder.lineItems.map(li => {
                const item = MOCK_INVENTORY.find(i => i.id === li.id);
                const sel  = returnSelections[li.id] || {};
                return (
                  <div
                    key={li.id}
                    className={`border rounded-xl p-4 transition-colors ${
                      sel.selected ? 'border-cyan-500 bg-cyan-500/5' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex gap-4">
                      <input
                        type="checkbox"
                        checked={!!sel.selected}
                        onChange={e => handleReturnSelection(li.id, 'selected', e.target.checked)}
                        className="mt-1 w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-200 text-sm truncate">{item?.name || 'Unknown'}</p>
                        <p className="text-xs font-mono text-gray-500 mt-1">
                          Ordered: {li.qty} · {fmt(li.price)}/unit
                        </p>
                        {sel.selected && (
                          <div className="flex gap-3 mt-4">
                            <select
                              value={sel.qty || 1}
                              onChange={e => handleReturnSelection(li.id, 'qty', parseInt(e.target.value))}
                              className="text-sm bg-gray-950 border border-gray-800 text-gray-100 rounded-lg p-2 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none w-20 text-center font-mono"
                            >
                              {[...Array(li.qty)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                            <select
                              value={sel.reason || RETURN_REASONS[0]}
                              onChange={e => handleReturnSelection(li.id, 'reason', e.target.value)}
                              className="text-sm bg-gray-950 border border-gray-800 text-gray-100 rounded-lg p-2 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none flex-1"
                            >
                              {RETURN_REASONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-gray-800 bg-gray-900/80 rounded-b-2xl flex-shrink-0">
              <button
                onClick={submitReturn}
                className={`${UI.btnPrimary} w-full py-4 text-xs uppercase tracking-widest`}
              >
                Submit Return Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BARCODE SCANNER MODAL — real BarcodeDetector camera scanner
      ════════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="" icon={Camera} hideHeader>
        <RealBarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setIsScannerOpen(false)}
        />
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          SIGNATURE PAD MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={signatureModalOpen} onClose={() => setSignatureModalOpen(false)} title="E-Sign Authorization" icon={PenTool}>
        <div className="flex flex-col bg-gray-950/50">
          <div className="p-6">
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              By signing below you authorize this order and agree to the payment terms on your account.
            </p>
            <div className="border border-gray-700 rounded-2xl bg-gray-900/50 overflow-hidden relative shadow-inner" style={{ height: 250 }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={250}
                className="w-full h-full cursor-crosshair touch-none block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className="absolute bottom-4 left-6 text-gray-600 font-bold text-[10px] uppercase tracking-widest pointer-events-none">
                Sign here  ×  ___________________________
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-800 bg-gray-900/80 flex justify-between items-center">
            <button
              onClick={clearSignature}
              className="px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-rose-400 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={saveSignature}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-gray-950 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} /> Confirm Signature
            </button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION
      ════════════════════════════════════════════════════════════════════ */}
      <nav id="kernal-module-tabs" className="bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 fixed bottom-0 w-full z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex justify-around px-2">
          {[
            { id: 'guide',    label: 'Guide',    Icon: ClipboardList },
            { id: 'catalog',  label: 'Catalog',  Icon: Search },
            { id: 'cart',     label: 'Cart',     Icon: ShoppingBag, badge: cartCount },
            { id: 'standing', label: 'Standing', Icon: RefreshCw },
            { id: 'account',  label: 'Account',  Icon: UserCircle },
          ].map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={activeTab === id ? UI.tabActive : UI.tabInactive}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black min-w-[18px] px-1 flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-1.5">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
