import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, Package, MapPin, AlertTriangle, CheckCircle,
  ChevronRight, ClipboardList, LogOut, User, Navigation,
  FileSignature, PackageOpen, LayoutDashboard, Smartphone,
  Activity, Wand2, Clock, Wifi, WifiOff, RefreshCw,
  Camera, Image as ImageIcon, X, Aperture, ScanBarcode,
  Barcode, MessageSquare, Weight, Thermometer, ChevronDown,
  AlertCircle, CheckCircle2, Lock, Box, Route as RouteIcon,
  Map as MapIcon, Save, ShieldCheck, DollarSign, Send, Receipt,
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, BarChart2, Gauge, Paperclip,
} from 'lucide-react';
import { useKernal, LOCATIONS } from './KernalContext.jsx';
import { MapView, INIT_ROUTES } from './GPSDispatchModule.jsx';

import { UI } from './ui.js';

import { TODAY, StatusBadge, PrintButton, ExportButton } from './shared/components.jsx';
import AttachmentsPanel from './shared/AttachmentsPanel.jsx';
import { DEMO_MODE } from './lib/demoMode.js';

// ─────────────────────────────────────────────
// KERNAL DESIGN SYSTEM — UI_CLASSES
// Matches InventoryModule.jsx token set exactly.
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// DOMAIN CONSTANTS
// ─────────────────────────────────────────────
const OSD_REASONS = [
  'Damaged in Transit',
  'Temperature Excursion',
  'Wrong Item Delivered',
  'Expired at Delivery',
  'Quality Rejected by Customer',
  'Short Shipped',
];

const TEMP_THRESHOLDS = {
  frozen:       10,   // °F — above this = excursion
  refrigerated: 41,   // °F
  dairy:        41,   // °F
  dry:          null, // no threshold
};

// ─────────────────────────────────────────────
// CORRECTED MOCK DATA
// Additions vs original:
//   • timeWindow on every order
//   • items now carry lotId, isCatchWeight, unitCost, unitPrice, tempCategory
//   • actualWeight starts null — filled during Pack & Weigh
// ─────────────────────────────────────────────
const MOCK_PACKED_ORDERS = [
  {
    id: 'SO-9901', customer: "Joe's Steakhouse", address: '123 Main St',
    route: 'Route-12', status: 'Packed', totalWeightLbs: 450,
    timeWindow: '08:00–10:00',
    location: { x: 20, y: 30 },
    items: [
      { sku: 'FRZ-BEEF-01', lotId: 'LOT-A', name: 'Ground Beef 80/20', qty: 10, actualWeight: null, isCatchWeight: true,  tempCategory: 'refrigerated', unitCost: 65.00, unitPrice: 85.50, pricePerLb: 8.55, avgWeightPerCase: 10.0 },
      { sku: 'DRY-RICE-05', lotId: 'LOT-C', name: 'Jasmine Rice 50lb',  qty:  1, actualWeight: null, isCatchWeight: false, tempCategory: 'dry',          unitCost: 23.75, unitPrice: 35.00 },
    ],
  },
  {
    id: 'SO-9903', customer: 'Downtown Diner', address: '456 Oak Ave',
    route: 'Route-12', status: 'Packed', totalWeightLbs: 80,
    timeWindow: '10:00–12:00',
    location: { x: 35, y: 80 },
    items: [
      { sku: 'FRZ-BEEF-01', lotId: 'LOT-B', name: 'Ground Beef 80/20', qty: 2, actualWeight: null, isCatchWeight: true, tempCategory: 'refrigerated', unitCost: 67.50, unitPrice: 85.50, pricePerLb: 8.55, avgWeightPerCase: 10.0 },
    ],
  },
  {
    id: 'SO-9902', customer: 'Beach Bistro', address: '789 Ocean Dr',
    route: 'Route-03', status: 'Packed', totalWeightLbs: 200,
    timeWindow: '09:00–11:00',
    location: { x: 80, y: 40 },
    items: [
      { sku: 'PLT-CHICK-05', lotId: 'LOT-G', name: 'Chicken Breasts', qty: 10, actualWeight: null, isCatchWeight: true, tempCategory: 'refrigerated', unitCost: 55.00, unitPrice: 72.00, pricePerLb: 6.00, avgWeightPerCase: 7.0 },
    ],
  },
  {
    id: 'SO-9904', customer: 'City Hospital Cafe', address: '100 Health Blvd',
    route: 'Route-03', status: 'Packed', totalWeightLbs: 150,
    timeWindow: '07:00–09:00',
    location: { x: 65, y: 70 },
    items: [
      { sku: 'DRY-RICE-05', lotId: 'LOT-C', name: 'Jasmine Rice 50lb', qty: 3, actualWeight: null, isCatchWeight: false, tempCategory: 'dry',          unitCost: 23.75, unitPrice: 35.00 },
      { sku: 'FRZ-VEG-02',  lotId: 'LOT-H', name: 'Mixed Peas',        qty: 5, actualWeight: null, isCatchWeight: false, tempCategory: 'frozen',        unitCost: 18.00, unitPrice: 26.00 },
    ],
  },
  // ── Pre-delivered demo orders — show up in the Bill Delivery banner ───────
  // Pack & Weigh was already completed for these and the orders left the dock.
  // They sit "Delivered, unbilled" until a dispatcher hits the Bill button.
  {
    id: 'SO-9895', customer: 'Magnolia Bistro', address: '2031 St Charles Ave',
    route: 'Route-12', status: 'Delivered', totalWeightLbs: 240,
    timeWindow: '08:00–10:00',
    location: { x: 40, y: 45 },
    billed: false,
    items: [
      // Ground beef: 10 cases ordered, actual delivered 103.4 lb (within +3.4% variance — clean)
      { sku: 'FRZ-BEEF-01', lotId: 'LOT-A', name: 'Ground Beef 80/20', qty: 10, actualWeight: 103.4, isCatchWeight: true, tempCategory: 'refrigerated', unitCost: 65.00, unitPrice: 85.50, pricePerLb: 8.55, avgWeightPerCase: 10.0 },
      // Non-CW line bundled in
      { sku: 'BAK-BUN-01', lotId: 'LOT-BB-1', name: 'Brioche Burger Buns (12pk)', qty: 6, actualWeight: null, isCatchWeight: false, tempCategory: 'dry', unitCost: 6.20, unitPrice: 8.75 },
    ],
  },
  {
    id: 'SO-9896', customer: 'Garden District Grill', address: '1455 Prytania St',
    route: 'Route-12', status: 'Delivered', totalWeightLbs: 380,
    timeWindow: '09:30–11:30',
    location: { x: 55, y: 60 },
    billed: false,
    items: [
      // Chicken: 12 cases @ ~7 lb/case = ~84 lb estimated, actual 81.7 lb (-2.7% — clean)
      { sku: 'PLT-CHICK-05', lotId: 'LOT-CH-1', name: 'Jumbo Chicken Breasts', qty: 12, actualWeight: 81.7, isCatchWeight: true, tempCategory: 'refrigerated', unitCost: 55.00, unitPrice: 72.00, pricePerLb: 6.00, avgWeightPerCase: 7.0 },
      // Ground beef: 8 cases @ ~10 lb/case = ~80 lb estimated, actual 86.2 lb (+7.75% — within ±8% tolerance)
      { sku: 'FRZ-BEEF-01', lotId: 'LOT-A', name: 'Ground Beef 80/20', qty: 8, actualWeight: 86.2, isCatchWeight: true, tempCategory: 'refrigerated', unitCost: 65.00, unitPrice: 85.50, pricePerLb: 8.55, avgWeightPerCase: 10.0 },
      { sku: 'PRO-TOMA-01', lotId: 'LOT-T-1', name: 'Roma Tomatoes 25lb', qty: 4, actualWeight: null, isCatchWeight: false, tempCategory: 'refrigerated', unitCost: 15.00, unitPrice: 22.00 },
    ],
  },
];

const MOCK_FLEET = [
  { truckId: 'TRK-01', driver: 'Marcus T.', capacityLbs: 10000, status: 'Available', currentLocation: { x: 50, y: 50 }, tempZones: ['Refrigerated', 'Dry'],          assignedOrders: [] },
  { truckId: 'TRK-02', driver: 'Sarah J.',  capacityLbs: 15000, status: 'Available', currentLocation: { x: 50, y: 50 }, tempZones: ['Frozen', 'Refrigerated', 'Dry'], assignedOrders: [] },
];

const WAREHOUSE_LOC = { x: 50, y: 50 };

// ─────────────────────────────────────────────
// ROUTE PROFITABILITY CONSTANTS & HELPERS
// ─────────────────────────────────────────────
const ROUTE_COST_CONFIG = {
  fuelRatePerMile:   0.22,   // $/mile — diesel + maintenance blended rate
  driverRatePerHour: 28.00,  // $/hr — fully-loaded (wage + payroll burden)
  avgSpeedMph:       22,     // urban last-mile average
  mapScale:          0.40,   // map units → miles (1 grid unit ≈ 0.40 mi)
};

// Revenue, COGS, and gross margin per stop
const calcOrderRevenue = order =>
  order.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

const calcOrderCOGS = order =>
  order.items.reduce((s, i) => s + i.qty * i.unitCost, 0);

const calcOrderGrossMargin = order =>
  calcOrderRevenue(order) - calcOrderCOGS(order);

const calcOrderGrossMarginPct = order => {
  const rev = calcOrderRevenue(order);
  return rev > 0 ? (calcOrderGrossMargin(order) / rev) * 100 : 0;
};

// Straight-line distance between two map points → miles
const mapDist = (a, b) => {
  const dx = (b.x - a.x) * ROUTE_COST_CONFIG.mapScale;
  const dy = (b.y - a.y) * ROUTE_COST_CONFIG.mapScale;
  return Math.sqrt(dx * dx + dy * dy);
};

// Total route miles: warehouse → stop1 → stop2 → ... → warehouse
const calcRouteMiles = stops => {
  if (!stops.length) return 0;
  let total = mapDist(WAREHOUSE_LOC, stops[0].location);
  for (let i = 1; i < stops.length; i++)
    total += mapDist(stops[i - 1].location, stops[i].location);
  total += mapDist(stops[stops.length - 1].location, WAREHOUSE_LOC);
  return total;
};

// Leg miles for a single stop (distance from previous stop or warehouse)
const calcStopLegMiles = (stops, idx) => {
  const from = idx === 0 ? WAREHOUSE_LOC : stops[idx - 1].location;
  return mapDist(from, stops[idx].location);
};

const calcRouteFuelCost   = stops => calcRouteMiles(stops) * ROUTE_COST_CONFIG.fuelRatePerMile;
const calcRouteDriverCost = stops =>
  (calcRouteMiles(stops) / ROUTE_COST_CONFIG.avgSpeedMph) * ROUTE_COST_CONFIG.driverRatePerHour;

// Margin color tier
const marginTier = pct =>
  pct >= 25 ? 'emerald' : pct >= 10 ? 'cyan' : pct >= 0 ? 'amber' : 'rose';

const marginBadgeClass = pct => {
  const t = marginTier(pct);
  return {
    emerald: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
    cyan:    'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
    amber:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    rose:    'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  }[t];
};

const fmt$ = n => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });



// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const orderHasCatchWeight = order =>
  order.items.some(i => i.isCatchWeight);

const orderRequiresTempCheck = order =>
  order.items.some(i => i.tempCategory !== 'dry');

const getColdestCategory = order => {
  if (order.items.some(i => i.tempCategory === 'frozen'))       return 'frozen';
  if (order.items.some(i => i.tempCategory === 'refrigerated')) return 'refrigerated';
  if (order.items.some(i => i.tempCategory === 'dairy'))        return 'dairy';
  return 'dry';
};

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
// ── Embedded Fleet Map ────────────────────────────────────────────────────────
// Self-contained wrapper that owns its own animation tick so the dispatcher
// view can show the live Leaflet map without polluting DispatcherDashboard state.
function EmbeddedFleetMap({ isDark }) {
  const { activeLocation } = useKernal();
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    const embeddedMapIntervalHandle = setInterval(() => setTick(prev => prev + 1), 2000);
    return () => clearInterval(embeddedMapIntervalHandle);
  }, []);
  const visibleRoutes = activeLocation === 'all'
    ? INIT_ROUTES
    : INIT_ROUTES.filter(r => r.locationId === activeLocation);
  const locMeta = LOCATIONS.find(l => l.id === activeLocation);
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-2 py-2 flex items-center gap-2 shrink-0 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-emerald-400">Live · {visibleRoutes.length} truck{visibleRoutes.length !== 1 ? 's' : ''} active</span>
        {activeLocation !== 'all' && locMeta && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${locMeta.bg} ${locMeta.color}`}>
            {locMeta.short}
          </span>
        )}
        <span className="text-xs text-gray-500">Powered by Fleet Intelligence · Traccar telemetry</span>
      </div>
      <div className="flex-1 min-h-0">
        <MapView
          routes={visibleRoutes}
          tick={tick}
          isDark={isDark}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}

export default function LogisticsModule() {
  const { settings, activeUser } = useKernal();
  const catchWeightEnabled     = settings.features.catchWeightItems;
  const coldChainEnabled       = settings.features.refrigeratedFoods || settings.features.frozenFoods;
  const routeOptEnabled        = settings.features.routeOptimization;
  const etaEnabled             = settings.features.etaNotifications;
  const deliveryWindowsEnabled = settings.features?.deliveryWindows !== false;
  const signatureEnabled       = settings.features?.signatureCapture !== false;
  const photoDeliveryEnabled   = settings.features?.osdPhotoEvidence !== false;
  // Role view: drivers always start in driver view; dispatchers/managers/admins in dispatcher view.
  // Managers and admins may switch freely; drivers are locked to driver view only.
  const isDriver = activeUser?.role === 'driver';
  const [role, setRole] = useState(() => isDriver ? 'driver' : 'dispatcher');
  const [orders, setOrders] = useState(DEMO_MODE ? MOCK_PACKED_ORDERS : []);
  const [fleet,  setFleet]  = useState(DEMO_MODE ? MOCK_FLEET : []);

  const [isOnline, setIsOnline] = useState(true);

  // Sync queue — persisted to localStorage so it survives tab close
  const [syncQueue, setSyncQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('kernal_logistics_syncqueue');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem('kernal_logistics_syncqueue', JSON.stringify(syncQueue)); }
    catch (e) { console.warn('[Kernel] Could not persist sync queue:', e); }
  }, [syncQueue]);

  const [notifications, setNotifications] = useState([]);

  // ETA notification dispatcher
  const triggerETANotification = order => {
    if (!etaEnabled) return;          // feature flag gate
    const n = {
      id: Date.now() + Math.random(),
      customer: order.customer,
      message: `Your wholesale delivery from Kernel Foods is next! ETA ~15 min. Track: kernal-track.app/${order.id}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications(prev => [...prev, n]);
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== n.id)), 8000);
  };

  // Flush sync queue when coming back online
  useEffect(() => {
    if (!isOnline || syncQueue.length === 0) return;
    const timer = setTimeout(() => {
      syncQueue.forEach(action => {
        console.log(`%c[KERNAL SYNC] POD synced → ${action.orderId}`, 'color:#a855f7;font-weight:bold');
        if (action.payloads) {
          console.log('%c[MOD 4→MOD 1] INVENTORY PAYLOAD:', 'color:#eab308;font-weight:bold', JSON.stringify(action.payloads.inventoryPayload, null, 2));
          console.log('%c[MOD 4→MOD 2] ACCOUNTING PAYLOAD:', 'color:#10b981;font-weight:bold', JSON.stringify(action.payloads.accountingPayload, null, 2));
        }
      });
      setSyncQueue([]);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isOnline, syncQueue]);

  return (
    <div className={`${UI.page} flex flex-col`}>

      {/* ── HEADER ── */}
      <header className={`${UI.glassHeader} px-4 py-3 flex justify-between items-center z-10 relative`}>
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-lg">
            <Truck className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <span className="font-bold text-gray-100 text-lg">Kernel</span>
            <span className="text-gray-500 text-sm ml-2 hidden sm:inline">/ Delivery Operations</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Network simulator */}
          <button
            onClick={() => setIsOnline(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              isOnline
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
            }`}
            title="Simulate network connectivity"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            {syncQueue.length > 0 && (
              <span className="bg-cyan-500 text-gray-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                {syncQueue.length}
              </span>
            )}
          </button>

          {/* Role toggle — drivers are locked to driver view; managers/admins/dispatchers can switch */}
          {!isDriver && (
            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
              {[
                { id: 'dispatcher', Icon: LayoutDashboard, label: 'Dispatcher' },
                { id: 'driver',     Icon: Smartphone,      label: 'Driver' },
              ].map(({ id, Icon, label }) => (
                <button key={id} onClick={() => setRole(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                    role === id ? 'bg-cyan-500 text-gray-950' : 'text-gray-400 hover:text-gray-200'
                  }`}>
                  <Icon className="w-4 h-4 hidden sm:block" />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-hidden flex justify-center relative">
        {role === 'dispatcher'
          ? <DispatcherDashboard orders={orders} setOrders={setOrders} fleet={fleet} setFleet={setFleet} triggerETANotification={triggerETANotification} />
          : <DriverApp orders={orders} setOrders={setOrders} fleet={fleet} isOnline={isOnline} syncQueue={syncQueue} setSyncQueue={setSyncQueue} triggerETANotification={triggerETANotification} />
        }

        {/* ETA Toast Notifications */}
        <div className="absolute bottom-6 right-6 z-50 space-y-3 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="bg-gray-900 border border-cyan-500/30 shadow-2xl rounded-xl p-4 w-80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Auto-ETA SMS Sent
                </span>
                <span className="text-[10px] text-gray-500">{n.timestamp}</span>
              </div>
              <p className="text-sm font-bold text-gray-100">{n.customer}</p>
              <div className="mt-2 bg-gray-800 rounded-lg p-2.5 border border-gray-700">
                <p className="text-xs text-gray-400 italic leading-relaxed">"{n.message}"</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// DISPATCHER DASHBOARD
// ─────────────────────────────────────────────
function DispatcherDashboard({ orders, setOrders, fleet, setFleet, triggerETANotification }) {
  const { settings, addPendingInvoice, activeUser, activeLocation } = useKernal();
  const routeOptEnabled    = settings.features.routeOptimization;
  const locMeta = LOCATIONS.find(l => l.id === activeLocation);
  const etaEnabled         = settings.features.etaNotifications;
  const catchWeightEnabled = settings.features.catchWeightItems;
  const coldChainEnabled   = settings.features.refrigeratedFoods || settings.features.frozenFoods;

  const [viewMode, setViewMode]           = useState('planning');
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [packWeighTarget, setPackWeighTarget] = useState(null); // truck pending dispatch
  const [billDeliveryTarget, setBillDeliveryTarget] = useState(null); // order awaiting billing
  const [stopSequence, setStopSequence]         = useState([]);    // ordered list of order IDs for selected truck
  const [profitView, setProfitView]             = useState(false); // toggle profitability panel
  const [delivAttOpen, setDelivAttOpen]         = useState(null);  // orderId whose attachments modal is open

  const selectedTruck = fleet.find(t => t.truckId === selectedTruckId);
  const packedOrders  = orders.filter(o => o.status === 'Packed');

  // Keep stopSequence in sync with selectedTruck's assignedOrders
  // Preserve manual reordering; append new; remove deassigned
  React.useEffect(() => {
    if (!selectedTruck) { setStopSequence([]); return; }
    setStopSequence(prev => {
      const existing = prev.filter(id => selectedTruck.assignedOrders.includes(id));
      const added    = selectedTruck.assignedOrders.filter(id => !prev.includes(id));
      return [...existing, ...added];
    });
  }, [selectedTruckId, selectedTruck?.assignedOrders?.length]);

  // Move a stop up (-1) or down (+1) in sequence
  const moveStop = (idx, dir) =>
    setStopSequence(prev => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });

  // ── Route economics (live, recalculates on every sequence change) ──────────
  const manifestedStops = stopSequence
    .map(id => orders.find(o => o.id === id))
    .filter(Boolean);

  const routeMiles       = calcRouteMiles(manifestedStops);
  const routeFuelCost    = calcRouteFuelCost(manifestedStops);
  const routeDriverCost  = calcRouteDriverCost(manifestedStops);
  const routeRevenue     = manifestedStops.reduce((s, o) => s + calcOrderRevenue(o), 0);
  const routeCOGS        = manifestedStops.reduce((s, o) => s + calcOrderCOGS(o), 0);
  const routeGrossMargin = routeRevenue - routeCOGS;
  const routeNetMargin   = routeGrossMargin - routeFuelCost - routeDriverCost;
  const routeGMPct       = routeRevenue > 0 ? (routeGrossMargin / routeRevenue) * 100 : 0;
  const routeNMPct       = routeRevenue > 0 ? (routeNetMargin  / routeRevenue) * 100 : 0;

  // ── Greedy bin-packing optimizer (fixed) ────────────────
  // Handles orders with and without time windows.
  // Time-windowed orders sorted by deadline and given priority.
  // Remaining orders sorted heaviest-first for better packing.
  const handleAutoOptimize = () => {
    const workingOrders = orders.map(o => ({ ...o, items: o.items.map(i => ({ ...i })) }));
    const workingFleet  = fleet.map(t => ({ ...t, assignedOrders: [...t.assignedOrders] }));

    const available   = workingFleet.filter(t => t.status === 'Available');
    const unassigned  = workingOrders
      .filter(o => o.status === 'Packed')
      .sort((a, b) => {
        if (a.timeWindow && b.timeWindow) return a.timeWindow.localeCompare(b.timeWindow);
        if (a.timeWindow) return -1;
        if (b.timeWindow) return  1;
        return b.totalWeightLbs - a.totalWeightLbs; // heaviest first improves packing
      });

    // Track weight per truck during assignment
    const truckWeights = {};
    available.forEach(t => {
      truckWeights[t.truckId] = orders
        .filter(o => t.assignedOrders.includes(o.id))
        .reduce((s, o) => s + o.totalWeightLbs, 0);
    });

    const resultOrders = workingOrders.map(o => ({ ...o }));

    unassigned.forEach(order => {
      for (const truck of available) {
        if (truckWeights[truck.truckId] + order.totalWeightLbs <= truck.capacityLbs) {
          const idx = resultOrders.findIndex(o => o.id === order.id);
          resultOrders[idx] = { ...resultOrders[idx], status: 'Manifested', assignedTruck: truck.truckId };
          truck.assignedOrders.push(order.id);
          truckWeights[truck.truckId] += order.totalWeightLbs;
          break;
        }
      }
    });

    setOrders(resultOrders);
    setFleet(workingFleet);
  };

  const handleAssignOrder = orderId => {
    if (!selectedTruck) return;
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'Manifested', assignedTruck: selectedTruck.truckId } : o
    ));
    setFleet(prev => prev.map(t =>
      t.truckId === selectedTruck.truckId
        ? { ...t, assignedOrders: [...t.assignedOrders, orderId] }
        : t
    ));
  };

  // Dispatch: intercept if any manifested order contains catch-weight items needing Pack & Weigh
  const handleDispatchClick = () => {
    if (!selectedTruck || selectedTruck.assignedOrders.length === 0) return;
    const manifestedOrders = orders.filter(o =>
      selectedTruck.assignedOrders.includes(o.id) && o.status === 'Manifested'
    );
    const needsWeigh = catchWeightEnabled && manifestedOrders.some(orderHasCatchWeight);
    if (needsWeigh) {
      setPackWeighTarget(selectedTruck); // open Pack & Weigh modal
    } else {
      executDispatch(selectedTruck, orders);
    }
  };

  // Final dispatch after Pack & Weigh confirmed
  const executDispatch = (truck, currentOrders) => {
    setOrders(currentOrders.map(o =>
      truck.assignedOrders.includes(o.id) && o.status === 'Manifested'
        ? { ...o, status: 'Out for Delivery' }
        : o
    ));
    const firstId    = truck.assignedOrders[0];
    const firstOrder = currentOrders.find(o => o.id === firstId);
    if (firstOrder) triggerETANotification(firstOrder);
    setFleet(prev => prev.map(t =>
      t.truckId === truck.truckId ? { ...t, status: 'Dispatched' } : t
    ));
    setSelectedTruckId(null);
    setPackWeighTarget(null);
  };

  const getTruckWeight = truck =>
    orders.filter(o => truck.assignedOrders.includes(o.id)).reduce((s, o) => s + o.totalWeightLbs, 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 flex flex-col h-[calc(100vh-64px)] overflow-hidden">

      {/* Pack & Weigh Modal */}
      {packWeighTarget && (
        <PackAndWeighModal
          truck={packWeighTarget}
          orders={orders}
          onConfirm={weighedOrders => {
            setOrders(weighedOrders);
            executDispatch(packWeighTarget, weighedOrders);
          }}
          onCancel={() => setPackWeighTarget(null)}
        />
      )}

      {/* Bill Delivery Modal */}
      {billDeliveryTarget && (
        <BillDeliveryModal
          order={billDeliveryTarget}
          onConfirm={(invoiceDraft) => {
            const taxLines = invoiceDraft.lines;
            const invoiceItems = taxLines.map(l => l.isCatchWeight
              ? {
                  sku: l.sku, description: l.name, isCatchWeight: true,
                  casesOrdered: l.casesOrdered,
                  actualWeight: l.actualWeight,
                  estimatedWeight: l.estimatedWeight,
                  pricePerLb: l.pricePerLb,
                  uom: 'lb',
                  // For backwards compatibility with non-CW invoice math:
                  qty: l.actualWeight || l.estimatedWeight,
                  unitPrice: l.pricePerLb,
                  total: l.lineTotal,
                }
              : {
                  sku: l.sku, description: l.name, isCatchWeight: false,
                  uom: 'case',
                  qty: l.qty, unitPrice: l.unitPrice, total: l.lineTotal,
                }
            );
            addPendingInvoice({
              id: `INV-${Date.now().toString().slice(-5)}`,
              source: 'Logistics',
              customer: billDeliveryTarget.customer,
              orderId: billDeliveryTarget.id,
              date: TODAY,
              dueDate: '',                       // Accounting will compute from default terms
              items: invoiceItems,
              subtotal: invoiceDraft.subtotal,
              taxRate: invoiceDraft.taxRate,
              tax: invoiceDraft.tax,
              freight: 0,
              amount: invoiceDraft.total,
              paid: 0,
              status: 'Open',
              glCode: '4000',
              notes: `Auto-generated from delivered order ${billDeliveryTarget.id}.`,
            });
            // Mark the order as billed
            setOrders(prev => prev.map(o =>
              o.id === billDeliveryTarget.id ? { ...o, billed: true, billedAt: new Date().toISOString() } : o
            ));
            setBillDeliveryTarget(null);
          }}
          onCancel={() => setBillDeliveryTarget(null)}
        />
      )}

      {/* Billable Deliveries banner — surfaces delivered orders ready to bill */}
      {(() => {
        const billable = orders.filter(o => (o.status === 'Delivered' || o.status === 'Delivered (Partial)') && !o.billed);
        if (billable.length === 0) return null;
        return (
          <div className="mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3 shrink-0">
            <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-300">{billable.length} delivery {billable.length === 1 ? 'is' : 'are'} ready to bill</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {billable.slice(0, 3).map(o => `${o.id} (${o.customer})`).join(' · ')}{billable.length > 3 ? ` · +${billable.length - 3} more` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {billable.slice(0, 2).map(o => (
                <React.Fragment key={o.id}>
                  <button onClick={() => setBillDeliveryTarget(o)} className={`${UI.btnPrimary} text-xs py-1.5`}>
                    <DollarSign className="w-3.5 h-3.5" /> Bill {o.id}
                  </button>
                  <button onClick={() => setDelivAttOpen(o.id)} className={`${UI.btnSecondary} text-xs py-1.5`}>
                    <Paperclip className="w-3.5 h-3.5" /> Docs
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })()}

      {/* View tabs */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xl font-bold text-gray-100 hidden md:block">Dispatcher Command Center</h2>
        <div className="flex border-b border-gray-800">
          {[
            { id: 'planning',  Icon: LayoutDashboard, label: 'Route Planning' },
            { id: 'tracking',  Icon: MapIcon,          label: 'Live GPS Tracking' },
          ].map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setViewMode(id)}
              className={viewMode === id ? UI.tabActive : UI.tabInactive}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'planning' ? (
        <div className="flex flex-col md:flex-row gap-5 flex-1 overflow-hidden">

          {/* ── Fleet Panel ── */}
          <div className={`w-full md:w-1/3 flex flex-col ${UI.card} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
              <h2 className="font-bold text-gray-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-500" /> Fleet
              </h2>
              {routeOptEnabled && (
                <button onClick={handleAutoOptimize} className={UI.btnPrimary} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Wand2 className="w-3 h-3" /> Optimize All
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {fleet.map(truck => {
                const weight      = getTruckWeight(truck);
                const utilization = Math.min(100, Math.round((weight / truck.capacityLbs) * 100));
                const isSelected  = selectedTruckId === truck.truckId;
                const dispatched  = truck.status === 'Dispatched';

                return (
                  <div key={truck.truckId}
                    onClick={() => !dispatched && setSelectedTruckId(truck.truckId)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      dispatched  ? 'opacity-50 cursor-not-allowed border-gray-800 bg-gray-900' :
                      isSelected  ? 'border-cyan-500 bg-cyan-500/5 shadow-md ring-1 ring-cyan-500/30' :
                                    'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-100 text-lg">{truck.truckId}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />{truck.driver}
                        </p>
                      </div>
                      <span className={dispatched ? UI.badgeAmber : UI.badgeEmerald}>
                        {truck.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Load Capacity</span>
                        <span>{weight.toLocaleString()} / {truck.capacityLbs.toLocaleString()} lbs</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${utilization > 90 ? 'bg-rose-500' : utilization > 70 ? 'bg-cyan-500' : 'bg-emerald-400'}`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {truck.tempZones.map(z => (
                        <span key={z} className={UI.badgeZinc} style={{ fontSize: '10px' }}>{z}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Orders / Route Panel ── */}
          <div className={`w-full md:w-2/3 flex flex-col ${UI.card} overflow-hidden`}>
            {selectedTruck && selectedTruck.status !== 'Dispatched' ? (
              <>
                <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-lg text-gray-100 flex items-center gap-2">
                      <RouteIcon className="w-5 h-5 text-cyan-500" /> Manifest: {selectedTruck.truckId}
                    </h2>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {manifestedStops.length > 0
                        ? <>{manifestedStops.length} stop{manifestedStops.length !== 1 ? 's' : ''} · {routeMiles.toFixed(1)} mi est.</>
                        : 'Assign packed orders, then dispatch.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {manifestedStops.length > 0 && (
                      <button
                        onClick={() => setProfitView(v => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          profitView
                            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" /> Profitability
                      </button>
                    )}
                    <button onClick={handleDispatchClick}
                      disabled={selectedTruck.assignedOrders.length === 0}
                      className={`${UI.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}>
                      <Truck className="w-4 h-4" /> Dispatch
                    </button>
                  </div>
                </div>

                {/* ── Route Profitability Summary ─────────────────────────────── */}
                {profitView && manifestedStops.length > 0 && (
                  <div className="border-b border-gray-800 bg-gray-950/60 px-5 py-4">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-3">
                      {[
                        { label: 'Revenue',      value: fmt$(routeRevenue),    sub: null,                      color: 'text-gray-100' },
                        { label: 'COGS',         value: fmt$(routeCOGS),       sub: null,                      color: 'text-gray-400' },
                        { label: 'Gross Margin', value: fmt$(routeGrossMargin), sub: routeGMPct.toFixed(1)+'%', color: routeGrossMargin >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                        { label: 'Fuel Cost',    value: fmt$(routeFuelCost),   sub: routeMiles.toFixed(1)+' mi', color: 'text-amber-400' },
                        { label: 'Driver Cost',  value: fmt$(routeDriverCost), sub: (routeMiles/ROUTE_COST_CONFIG.avgSpeedMph).toFixed(1)+'h est.', color: 'text-amber-400' },
                        { label: 'Net Margin',   value: (routeNetMargin < 0 ? '-' : '') + fmt$(routeNetMargin), sub: routeNMPct.toFixed(1)+'%', color: routeNetMargin >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                      ].map(({ label, value, sub, color }) => (
                        <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-center">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
                          <p className={`text-sm font-black ${color}`}>{value}</p>
                          {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Gauge className="w-3 h-3" />
                      <span>Fuel @ ${ROUTE_COST_CONFIG.fuelRatePerMile}/mi · Driver @ ${ROUTE_COST_CONFIG.driverRatePerHour}/hr · {ROUTE_COST_CONFIG.avgSpeedMph} mph avg</span>
                    </div>
                  </div>
                )}

                {/* ── Sequenced stop list with margin indicators ─────────────── */}
                {manifestedStops.length > 0 && (
                  <div className="px-5 py-4 border-b border-gray-800 bg-gray-950/50 shrink-0">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ClipboardList className="w-3.5 h-3.5" /> Stop Sequence — drag to reorder
                    </h3>
                    <div className="space-y-1.5">
                      {manifestedStops.map((o, idx) => {
                        const gm    = calcOrderGrossMargin(o);
                        const gmPct = calcOrderGrossMarginPct(o);
                        const legMi = calcStopLegMiles(manifestedStops, idx).toFixed(1);
                        return (
                          <div key={o.id} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                            {/* Sequence number */}
                            <span className="text-[10px] font-black text-gray-600 w-5 text-center shrink-0">{idx + 1}</span>

                            {/* Reorder buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button onClick={() => moveStop(idx, -1)} disabled={idx === 0}
                                className="p-0.5 rounded text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => moveStop(idx, 1)} disabled={idx === manifestedStops.length - 1}
                                className="p-0.5 rounded text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Order info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-gray-500 text-[10px]">{o.id}</span>
                                <span className="font-semibold text-gray-200 text-sm truncate">{o.customer}</span>
                              </div>
                              <div className="text-[10px] text-gray-600 mt-0.5 flex items-center gap-1.5">
                                <MapPin className="w-2.5 h-2.5" />{legMi} mi leg
                                {catchWeightEnabled && orderHasCatchWeight(o) && <><Weight className="w-2.5 h-2.5 text-cyan-500 ml-1" /><span className="text-cyan-600">CW</span></>}
                              </div>
                            </div>

                            {/* Margin badge */}
                            <div className="text-right shrink-0">
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${marginBadgeClass(gmPct)}`}>
                                {gmPct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                {fmt$(gm)}
                              </div>
                              <div className="text-[10px] text-gray-600 mt-0.5">{gmPct.toFixed(0)}% GM</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {catchWeightEnabled && manifestedStops.some(o => orderHasCatchWeight(o)) && (
                      <p className="text-xs text-cyan-500 flex items-center gap-1.5 mt-3">
                        <Weight className="w-3.5 h-3.5" /> Catch-weight items present — Pack &amp; Weigh required before dispatch.
                      </p>
                    )}
                  </div>
                )}

                {/* Available packed orders */}
                <div className="p-5 flex-1 overflow-y-auto">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Available Packed Orders</h3>
                  <table className="w-full text-left text-sm">
                    <thead className={UI.tableHead}>
                      <tr>
                        <th className={UI.th}>Order</th>
                        <th className={UI.th}>Customer</th>
                        <th className={UI.th}>Window</th>
                        {catchWeightEnabled && <th className={UI.th}>Weight</th>}
                        <th className={UI.th}>Margin</th>
                        <th className={UI.th}>Flags</th>
                        <th className={UI.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {packedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={catchWeightEnabled ? 7 : 6} className="py-10 text-center text-gray-600">
                            <PackageOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            No packed orders available.
                          </td>
                        </tr>
                      ) : packedOrders.map(order => (
                        <tr key={order.id} className={UI.tableRow}>
                          <td className={UI.td}><span className="font-mono text-gray-400 text-xs">{order.id}</span></td>
                          <td className={UI.td}>
                            <div className="font-semibold text-gray-100">{order.customer}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />{order.route} · {order.address}
                            </div>
                          </td>
                          <td className={UI.td}>
                            {deliveryWindowsEnabled && order.timeWindow && <span className={UI.badgeAmber}><Clock className="w-3 h-3" />{order.timeWindow}</span>}
                          </td>
                          {catchWeightEnabled && <td className={UI.td}>
                            <span className="font-semibold">{order.totalWeightLbs.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs ml-1">lbs</span>
                          </td>}
                          <td className={UI.td}>
                            {(() => {
                              const gm  = calcOrderGrossMargin(order);
                              const pct = calcOrderGrossMarginPct(order);
                              return (
                                <div>
                                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${marginBadgeClass(pct)}`}>
                                    {pct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                    {fmt$(gm)}
                                  </div>
                                  <div className="text-[10px] text-gray-600 mt-0.5">{pct.toFixed(0)}% GM</div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className={UI.td}>
                            {catchWeightEnabled && orderHasCatchWeight(order)    && <span className={`${UI.badgeAmber} mr-1`}><Weight className="w-3 h-3" /> CW</span>}
                            {coldChainEnabled   && orderRequiresTempCheck(order) && <span className={UI.badgeBlue}><Thermometer className="w-3 h-3" /> Cold</span>}
                          </td>
                          <td className={UI.td}>
                            <button onClick={() => handleAssignOrder(order.id)} className={UI.btnSecondary} style={{ padding: '4px 10px', fontSize: '12px' }}>
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-gray-950/30">
                <Truck className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold text-gray-500">No Truck Selected</h2>
                <p className="text-sm mt-2 text-center max-w-xs">Select an available truck from the fleet panel to begin building a manifest.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmbeddedFleetMap isDark={true} />
      )}

      {/* Delivery Attachments Modal */}
      {delivAttOpen && (() => {
        const order = orders.find(o => o.id === delivAttOpen);
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" onClick={() => setDelivAttOpen(null)} />
            <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
                <Paperclip className="w-4 h-4 text-cyan-500" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-100">Delivery Documents</p>
                  <p className="text-xs text-gray-500">{delivAttOpen}{order ? ` · ${order.customer}` : ''}</p>
                </div>
                <button onClick={() => setDelivAttOpen(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Panel */}
              <div className="p-4">
                <AttachmentsPanel
                  recordId={delivAttOpen}
                  recordLabel={delivAttOpen}
                  isDark={true}
                  uploaderName={activeUser?.name || 'You'}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────
// PACK & WEIGH MODAL
// Intercepts dispatch when catch-weight items are present.
// Dispatcher enters actual lb weight per line item.
// Dispatch is blocked until every catch-weight entry is filled.
// ─────────────────────────────────────────────
function PackAndWeighModal({ truck, orders, onConfirm, onCancel }) {
  // Build flat list of all catch-weight line items across this truck's manifested orders
  const cwItems = orders
    .filter(o => truck.assignedOrders.includes(o.id) && o.status === 'Manifested')
    .flatMap(o => o.items
      .filter(i => i.isCatchWeight)
      .map(i => ({ ...i, orderId: o.id, customer: o.customer }))
    );

  const [weights, setWeights] = useState(() => {
    const init = {};
    cwItems.forEach(i => { init[`${i.orderId}-${i.sku}`] = ''; });
    return init;
  });

  const allFilled = Object.values(weights).every(w => w !== '' && parseFloat(w) > 0);

  const handleConfirm = () => {
    // Write actual weights back into the orders before dispatch
    const updatedOrders = orders.map(o => {
      if (!truck.assignedOrders.includes(o.id)) return o;
      return {
        ...o,
        items: o.items.map(item => {
          const key = `${o.id}-${item.sku}`;
          return item.isCatchWeight && weights[key]
            ? { ...item, actualWeight: parseFloat(weights[key]) }
            : item;
        }),
      };
    });
    onConfirm(updatedOrders);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${UI.glassModal} w-full max-w-lg flex flex-col max-h-[85vh]`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Weight className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-100 text-lg">Pack &amp; Weigh</h2>
              <p className="text-gray-500 text-xs mt-0.5">Enter actual lb weight for all catch-weight items before dispatch.</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 transition-colors"><X /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-3 flex-1">
          {cwItems.map(item => {
            const key = `${item.orderId}-${item.sku}`;
            const avgLbPerCase = Number(item.avgWeightPerCase) || 0;
            const pricePerLb   = Number(item.pricePerLb) || 0;
            const estWeight    = item.qty * avgLbPerCase;
            const varianceTol  = item.weightVariancePct ?? 8; // fallback ±8%
            const actual       = parseFloat(weights[key]) || 0;
            const variance     = estWeight > 0 ? ((actual - estWeight) / estWeight) * 100 : 0;
            const variantOK    = Math.abs(variance) <= varianceTol;
            const variantWarn  = !variantOK && Math.abs(variance) <= varianceTol * 2;
            const lineBill     = actual * pricePerLb;
            return (
              <div key={key} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-100">{item.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{item.sku} · {item.customer}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Lot: <span className="font-mono text-gray-500">{item.lotId}</span></div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={UI.badgeAmber}>{item.qty} cases ordered</div>
                    {avgLbPerCase > 0 && <div className="text-[10px] text-gray-500 mt-1">est. ~{estWeight.toFixed(1)} lb @ ${pricePerLb.toFixed(2)}/lb</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`${UI.label} mb-0 whitespace-nowrap`}>Actual Weight (lbs):</label>
                  <input
                    type="number" step="0.1" min="0"
                    placeholder={estWeight > 0 ? estWeight.toFixed(1) : 'e.g. 412.5'}
                    value={weights[key]}
                    onChange={e => setWeights(prev => ({ ...prev, [key]: e.target.value }))}
                    className={`${UI.input} text-right font-bold`}
                  />
                </div>
                {actual > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700/60 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Avg / case</p>
                      <p className="font-bold text-gray-200 mt-0.5">{(actual / item.qty).toFixed(1)} lb</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Variance</p>
                      <p className={`font-bold mt-0.5 ${variantOK ? 'text-emerald-400' : variantWarn ? 'text-amber-400' : 'text-rose-400'}`}>
                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        <span className="block text-[9px] text-gray-500 font-normal">tol ±{varianceTol}%</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Will bill</p>
                      <p className="font-bold text-cyan-400 mt-0.5">${lineBill.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t border-gray-700 flex justify-between items-center">
          <button onClick={onCancel} className={UI.btnSecondary}>Cancel</button>
          <button onClick={handleConfirm} disabled={!allFilled}
            className={`${UI.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <Truck className="w-4 h-4" /> Confirm &amp; Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BILL DELIVERY MODAL
// Build an invoice draft from a delivered order. Catch-weight lines use
// actualWeight × pricePerLb; other lines use qty × unitPrice. Push the
// draft into the KernalContext pendingInvoices queue for Accounting to
// consume. Mark the order as billed so it stops appearing in the banner.
// ─────────────────────────────────────────────
function BillDeliveryModal({ order, onConfirm, onCancel }) {
  // Build invoice lines from the order items
  const lines = order.items.map(it => {
    const isCW = !!it.isCatchWeight;
    const pricePerLb = Number(it.pricePerLb) || 0;
    const avgLbPerCase = Number(it.avgWeightPerCase) || 0;
    const actual = Number(it.actualWeight) || 0;
    const estimated = it.qty * avgLbPerCase;
    if (isCW && pricePerLb > 0) {
      const billedWeight = actual > 0 ? actual : estimated;
      return {
        sku: it.sku, name: it.name, isCatchWeight: true,
        casesOrdered: it.qty, actualWeight: actual || null, estimatedWeight: estimated,
        pricePerLb, lineTotal: billedWeight * pricePerLb,
        // Flag if estimating vs using actual
        usingEstimate: actual === 0,
      };
    }
    return {
      sku: it.sku, name: it.name, isCatchWeight: false,
      qty: it.qty, unitPrice: it.unitPrice || 0,
      lineTotal: it.qty * (it.unitPrice || 0),
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxRate = 9.45;
  const tax = Math.round(subtotal * taxRate) / 100;
  const total = subtotal + tax;
  const cwLines = lines.filter(l => l.isCatchWeight);
  const totalCwWeight = cwLines.reduce((s, l) => s + (l.actualWeight || l.estimatedWeight || 0), 0);
  const anyEstimates = cwLines.some(l => l.usingEstimate);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${UI.glassModal} w-full max-w-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <DollarSign className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-100 text-lg">Bill Delivery — {order.id}</h2>
              <p className="text-gray-500 text-xs mt-0.5">Generate invoice for {order.customer} from delivered weights.</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {anyEstimates && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>One or more catch-weight lines are missing actual weights — falling back to estimated weight. The invoice will need to be adjusted once actuals are captured.</span>
            </div>
          )}

          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-950 border-b border-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] text-gray-500 font-bold uppercase tracking-wider">Item</th>
                  <th className="px-3 py-2 text-right text-[10px] text-gray-500 font-bold uppercase tracking-wider">Detail</th>
                  <th className="px-3 py-2 text-right text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="px-3 py-3">
                      <div className="font-bold text-gray-100 text-sm">{l.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{l.sku}</div>
                      {l.isCatchWeight && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase tracking-wider">
                          <Weight className="w-2.5 h-2.5" /> Catch weight
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-gray-300">
                      {l.isCatchWeight ? (
                        <>
                          <div>{l.casesOrdered} cases ordered</div>
                          <div className={`mt-0.5 ${l.usingEstimate ? 'text-amber-400' : 'text-emerald-400'} font-bold`}>
                            {l.usingEstimate ? `~${l.estimatedWeight.toFixed(1)} lb est` : `${l.actualWeight.toFixed(1)} lb actual`}
                          </div>
                          <div className="text-gray-500 mt-0.5">@ ${l.pricePerLb.toFixed(2)}/lb</div>
                        </>
                      ) : (
                        <>
                          <div>{l.qty} × ${l.unitPrice.toFixed(2)}</div>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-gray-100">${l.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cwLines.length > 0 && (
            <div className="text-xs text-gray-500 px-1">
              <Weight className="w-3 h-3 inline mr-1" /> {totalCwWeight.toFixed(1)} lb billed across {cwLines.length} catch-weight {cwLines.length === 1 ? 'line' : 'lines'}.
            </div>
          )}

          <div className="border-t border-gray-700 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-gray-200">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Sales Tax ({taxRate}%)</span><span className="text-gray-200">${tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-800"><span className="text-gray-200">Invoice Total</span><span className="text-cyan-400">${total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 flex justify-between items-center shrink-0">
          <button onClick={onCancel} className={UI.btnSecondary}>Cancel</button>
          <button onClick={() => onConfirm({ lines, subtotal, tax, taxRate, total })} className={UI.btnPrimary}>
            <Send className="w-4 h-4" /> Push to Accounting
          </button>
        </div>
      </div>
    </div>
  );
}

// LiveTrackingMap removed — replaced by EmbeddedFleetMap (Leaflet via Fleet Intelligence module)

// ─────────────────────────────────────────────
// DRIVER APP (mobile-optimized)
// ─────────────────────────────────────────────
function DriverApp({ orders, setOrders, fleet, isOnline, syncQueue, setSyncQueue, triggerETANotification }) {
  const { settings } = useKernal();
  const catchWeightEnabled = settings.features.catchWeightItems;
  const coldChainEnabled   = settings.features.refrigeratedFoods || settings.features.frozenFoods;
  const [activeDriverTruck, setActiveDriverTruck] = useState(null);
  const [activeStopId,      setActiveStopId]      = useState(null);
  const [showReturn,        setShowReturn]        = useState(false);
  const [signInTime,        setSignInTime]        = useState('');
  const [paymentData,       setPaymentData]       = useState({});

  const dispatchedTrucks = fleet.filter(t => t.status === 'Dispatched');

  if (!activeDriverTruck) {
    return (
      <div className="w-full max-w-md mx-auto bg-gray-950 h-[calc(100vh-64px)] overflow-y-auto border-x border-gray-800 flex flex-col">
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 p-8 text-center">
          <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-cyan-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Driver Login</h2>
          <p className="text-gray-500 mt-1">Select your assigned vehicle</p>
        </div>
        <div className="p-4 flex-1 space-y-3">
          {dispatchedTrucks.length === 0 ? (
            <div className={`${UI.cardPadded} text-center`}>
              <AlertTriangle className="w-10 h-10 text-cyan-500 mx-auto mb-3" />
              <p className="text-gray-300 font-medium">No trucks currently dispatched.</p>
              <p className="text-sm text-gray-500 mt-2">Check back once the dispatcher finalizes manifests.</p>
            </div>
          ) : dispatchedTrucks.map(truck => (
            <button key={truck.truckId} onClick={() => setActiveDriverTruck(truck.truckId)}
              className={`w-full ${UI.card} p-5 flex items-center justify-between hover:border-cyan-500/40 transition-colors`}>
              <div className="text-left">
                <h3 className="font-bold text-xl text-gray-100">{truck.truckId}</h3>
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  <Package className="w-4 h-4" />{truck.assignedOrders.length} Stops
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const truckDetails  = fleet.find(t => t.truckId === activeDriverTruck);
  const routeOrders   = orders.filter(o => truckDetails.assignedOrders.includes(o.id));
  const activeStop    = orders.find(o => o.id === activeStopId);

  // Return-flow helpers
  const fmtMoney    = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const orderInvoice = o => o.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const allStopsDone = routeOrders.length > 0 && routeOrders.every(o => o.status.includes('Delivered') || o.status.includes('Failed'));
  const getPay       = id => paymentData[id] || { cash: 0, checkAmt: 0, checkNum: '' };
  const setPay       = (id, field, val) => setPaymentData(prev => ({ ...prev, [id]: { ...getPay(id), [field]: val } }));
  const totalCash    = routeOrders.reduce((s, o) => s + (getPay(o.id).cash   || 0), 0);
  const totalChecks  = routeOrders.reduce((s, o) => s + (getPay(o.id).checkAmt || 0), 0);

  // ── DRIVER RETURN / SIGN-IN SCREEN ──────────────────────────────────────────
  if (showReturn) {
    return (
      <div className="w-full max-w-md mx-auto bg-gray-950 h-[calc(100vh-64px)] overflow-y-auto border-x border-gray-800 flex flex-col">
        <div className={`${UI.glassHeader} px-4 py-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Return &amp; Sign-In</p>
            <h2 className="font-bold text-lg text-gray-100 flex items-center gap-2 mt-0.5">
              <Truck className="w-5 h-5 text-cyan-500" />{activeDriverTruck}
            </h2>
          </div>
          <button onClick={() => setShowReturn(false)} className="text-gray-500 hover:text-gray-300 p-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* Sign-in time */}
          <div className={`${UI.card} p-4 flex items-center gap-4`}>
            <div className="flex-1">
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1">Return Sign-In Time</label>
              <input type="time" value={signInTime} onChange={e => setSignInTime(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 w-full" />
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-500">Truck</p>
              <p className="text-sm font-bold text-gray-300">{activeDriverTruck}</p>
            </div>
          </div>

          {/* Payment collection per stop */}
          <div className={`${UI.card} overflow-hidden`}>
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-200">Payment Collection</p>
              <p className="text-xs text-gray-500">{routeOrders.length} stops</p>
            </div>
            <div className="divide-y divide-gray-800/60">
              {routeOrders.map(order => {
                const pay     = getPay(order.id);
                const invoice = orderInvoice(order);
                const isDone  = order.status.includes('Delivered');
                const isFail  = order.status.includes('Failed');
                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-100">{order.customer}</p>
                        <p className="text-xs text-gray-500 font-mono">{order.id}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">Invoice</p>
                        <p className="text-sm font-bold text-gray-200">{fmtMoney(invoice)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isFail  ? 'bg-rose-500/15 text-rose-400' :
                        isDone  ? 'bg-emerald-500/15 text-emerald-400' :
                                  'bg-amber-500/15 text-amber-400'}`}>
                        {order.status}
                      </span>
                    </div>
                    {!isFail && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Cash</label>
                          <input type="number" min="0" step="0.01" value={pay.cash || ''} placeholder="0.00"
                            onChange={e => setPay(order.id, 'cash', parseFloat(e.target.value) || 0)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Check $</label>
                          <input type="number" min="0" step="0.01" value={pay.checkAmt || ''} placeholder="0.00"
                            onChange={e => setPay(order.id, 'checkAmt', parseFloat(e.target.value) || 0)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Check #</label>
                          <input type="text" value={pay.checkNum} placeholder="—"
                            onChange={e => setPay(order.id, 'checkNum', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500" />
                        </div>
                      </div>
                    )}
                    {isFail && (
                      <p className="text-xs text-gray-600 italic">No payment — delivery failed</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className={`${UI.card} p-4 grid grid-cols-3 gap-4`}>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Cash</p>
              <p className="text-lg font-black text-gray-200 mt-0.5">{fmtMoney(totalCash)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Checks</p>
              <p className="text-lg font-black text-gray-200 mt-0.5">{fmtMoney(totalChecks)}</p>
            </div>
            <div>
              <p className="text-xs text-cyan-400 uppercase tracking-wide">Total</p>
              <p className="text-lg font-black text-cyan-400 mt-0.5">{fmtMoney(totalCash + totalChecks)}</p>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => {
              setShowReturn(false);
              setActiveDriverTruck(null);
              alert(`Route complete for ${activeDriverTruck}.\nSigned in at ${signInTime || 'now'}.\nTotal collected: ${fmtMoney(totalCash + totalChecks)}\n\nData sent to Accounting → Daily Close-out.`);
            }}
            className={`${UI.btnPrimary} w-full py-3 text-base font-black`}
          >
            ✓ Complete Route &amp; Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-gray-950 h-[calc(100vh-64px)] overflow-hidden border-x border-gray-800 flex flex-col relative">

      {/* Driver header */}
      <div className={`${UI.glassHeader} px-4 py-4 flex items-center justify-between`}>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Route</p>
          <h2 className="font-bold text-lg text-gray-100 flex items-center gap-2 mt-0.5">
            <Truck className="w-5 h-5 text-cyan-500" />{activeDriverTruck}
          </h2>
        </div>
        {!activeStopId && (
          <button onClick={() => setActiveDriverTruck(null)} className="text-gray-500 hover:text-gray-300 p-2 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sync status banners */}
      {!isOnline && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-500 text-xs font-bold px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" /> Offline — {syncQueue.length} action{syncQueue.length !== 1 ? 's' : ''} queued locally
        </div>
      )}
      {isOnline && syncQueue.length > 0 && (
        <div className="bg-emerald-400/10 border-b border-emerald-400/20 text-emerald-400 text-xs font-bold px-4 py-2 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Syncing {syncQueue.length} pending action{syncQueue.length !== 1 ? 's' : ''}…
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative">
        {activeStopId && activeStop ? (
          <DriverPODScreen
            order={activeStop}
            onClose={() => setActiveStopId(null)}
            onComplete={(updatedOrder, payloads) => {
              setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
              setActiveStopId(null);

              // Capture COD payment from POD into paymentData for Driver Return screen
              if (updatedOrder.paymentCollected) {
                const p = updatedOrder.paymentCollected;
                setPaymentData(prev => ({
                  ...prev,
                  [updatedOrder.id]: { cash: p.cash || 0, checkAmt: p.checkAmt || 0, checkNum: p.checkNum || '' },
                }));
              }

              // Trigger ETA for the next undelivered stop
              const currentIdx  = truckDetails.assignedOrders.indexOf(updatedOrder.id);
              for (let i = currentIdx + 1; i < truckDetails.assignedOrders.length; i++) {
                const nextOrder = orders.find(o => o.id === truckDetails.assignedOrders[i]);
                if (nextOrder && nextOrder.status === 'Out for Delivery') {
                  triggerETANotification(nextOrder);
                  break;
                }
              }

              if (isOnline) {
                console.log(`%c[KERNAL LIVE] POD submitted → ${updatedOrder.id}`, 'color:#3b82f6;font-weight:bold');
                if (payloads) {
                  console.log('%c[MOD 4→MOD 1] INVENTORY PAYLOAD:', 'color:#eab308;font-weight:bold', JSON.stringify(payloads.inventoryPayload, null, 2));
                  console.log('%c[MOD 4→MOD 2] ACCOUNTING PAYLOAD:', 'color:#10b981;font-weight:bold', JSON.stringify(payloads.accountingPayload, null, 2));
                }
              } else {
                setSyncQueue(prev => [...prev, { orderId: updatedOrder.id, timestamp: new Date().toISOString(), payloads }]);
              }
            }}
          />
        ) : (
          <div className="p-4 space-y-3 pb-24">
            <div className="px-2 mb-5">
              <h3 className="text-xl font-bold text-gray-100">Today's Stops</h3>
              <p className="text-gray-500 text-sm mt-1">
                {routeOrders.filter(o => o.status === 'Out for Delivery').length} remaining
              </p>
            </div>

            {routeOrders.map((order, idx) => {
              const done = order.status.includes('Delivered') || order.status.includes('Failed');
              return (
                <div key={order.id}
                  onClick={() => !done && setActiveStopId(order.id)}
                  className={`${UI.card} p-4 relative overflow-hidden transition-all ${done ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-500/30 active:scale-[0.98]'}`}>
                  {done && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {order.status}
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${done ? 'bg-gray-800 text-gray-500' : 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-lg font-bold ${done ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                        {order.customer}
                      </h4>
                      <p className="text-gray-500 text-sm mt-1 flex items-start gap-1">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />{order.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {deliveryWindowsEnabled && order.timeWindow && <span className={UI.badgeAmber}><Clock className="w-3 h-3" />{order.timeWindow}</span>}
                        {catchWeightEnabled && orderHasCatchWeight(order)    && <span className={UI.badgeAmber}><Weight className="w-3 h-3" /> CW</span>}
                        {coldChainEnabled   && orderRequiresTempCheck(order) && <span className={UI.badgeBlue}><Thermometer className="w-3 h-3" /> Cold Chain</span>}
                      </div>
                      {!done && (
                        <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {order.items.reduce((s, i) => s + i.qty, 0)} items · {order.totalWeightLbs} lbs
                          </span>
                          <span className="text-cyan-500 font-bold text-sm flex items-center gap-1">
                            Open Stop <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          {/* Return to Warehouse — appears when all stops are done */}
          {allStopsDone && (
            <div className="pt-2 pb-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4 text-center">
                <p className="text-emerald-400 font-bold text-sm">✓ All Stops Complete</p>
                <p className="text-gray-500 text-xs mt-1">Ready to return to warehouse</p>
              </div>
              <button
                onClick={() => setShowReturn(true)}
                className={`${UI.btnPrimary} w-full py-3 text-base font-black`}
              >
                🚛 Return to Warehouse &amp; Sign In
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DRIVER POD SCREEN
// Improvements vs original:
//   • Temperature check for cold-chain orders (with threshold alert)
//   • OS&D reason code per refused line item
//   • Lot-level scan — one scan per line item (not one per order)
//   • OS&D payload now includes lotId, reasonCode, unitCost, unitPrice
// ─────────────────────────────────────────────
function DriverPODScreen({ order, onClose, onComplete }) {
  const { settings } = useKernal();
  const coldChainEnabled    = settings.features.refrigeratedFoods || settings.features.frozenFoods;
  const codEnabled          = settings.features.codCollections;
  const catchWeightEnabled  = settings.features.catchWeightItems;
  const lotTrackingEnabled  = settings.features.lotTracking;
  const osdPhotoEnabled     = settings.features.osdPhotoEvidence;
  const tempLogEnabled      = settings.features.temperatureLogging;
  const signatureEnabled    = settings.features?.signatureCapture !== false;
  const deliveryWindowsEnabled = settings.features?.deliveryWindows !== false;
  const photoDeliveryEnabled   = settings.features?.osdPhotoEvidence !== false;
  // Line item state: tracks refusedQty, reason, photoCaptured per SKU
  const [lineItems, setLineItems] = useState(() => {
    const s = {};
    order.items.forEach(item => {
      s[item.sku] = { ...item, refusedQty: 0, reason: OSD_REASONS[0], photoCaptured: false };
    });
    return s;
  });

  // Lot-level scan: one boolean per item (keyed by sku)
  const [scannedLots, setScannedLots] = useState(() => {
    const s = {};
    order.items.forEach(item => { s[item.sku] = false; });
    return s;
  });
  const [activeScanSku,   setActiveScanSku]   = useState(null);
  const [activeCameraSku, setActiveCameraSku] = useState(null);
  const [signature,       setSignature]       = useState(false);

  // ── NEW: GPS check-in step ───────────────────────────────────────────────────
  const [podStep,     setPodStep]     = useState('checkin'); // 'checkin' | 'form'
  const [checkingIn,  setCheckingIn]  = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkInCoords, setCheckInCoords] = useState(null);

  // ── NEW: Delivery confirmation photo ────────────────────────────────────────
  const [deliveryPhotoCaptured, setDeliveryPhotoCaptured] = useState(false);
  const [showDeliveryCamera,    setShowDeliveryCamera]    = useState(false);

  // ── NEW: Signature canvas ────────────────────────────────────────────────────
  const signatureCanvasRef = useRef(null);
  const isDrawingRef       = useRef(false);
  const lastPosRef         = useRef({ x: 0, y: 0 });

  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches && e.touches.length > 0) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(e, canvas);
  };

  const drawStroke = (e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2.5;
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPosRef.current = pos;
    if (!signature) setSignature(true);
  };

  const stopDraw = () => { isDrawingRef.current = false; };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setSignature(false);
  };

  // GPS check-in handler
  const handleCheckIn = () => {
    setCheckingIn(true);
    setTimeout(() => {
      const lat = (27.94 + Math.random() * 0.05).toFixed(4);
      const lng = (82.44 + Math.random() * 0.05).toFixed(4);
      setCheckInCoords({ lat, lng });
      setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCheckInDone(true);
      setCheckingIn(false);
    }, 2200);
  };

  // Temperature check for cold-chain orders
  const needsTempCheck   = tempLogEnabled || (coldChainEnabled && orderRequiresTempCheck(order));
  const coldestCategory  = getColdestCategory(order);
  const tempThreshold    = TEMP_THRESHOLDS[coldestCategory];
  const [deliveryTemp,   setDeliveryTemp]     = useState('');
  const tempValue        = parseFloat(deliveryTemp);
  const tempExcursion    = needsTempCheck && deliveryTemp !== '' && tempThreshold !== null && tempValue > tempThreshold;
  const tempMissing      = needsTempCheck && deliveryTemp === '';

  // ── COD Payment Collection ──────────────────────────────────────────────────
  const invoiceTotal   = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const [paymentType,  setPaymentType]  = useState('none');   // 'none' | 'cash' | 'check'
  const [cashAmount,   setCashAmount]   = useState('');
  const [checkAmount,  setCheckAmount]  = useState('');
  const [checkNumber,  setCheckNumber]  = useState('');
  const paymentIncomplete = codEnabled && (
    (paymentType === 'cash'  && !cashAmount)  ||
    (paymentType === 'check' && (!checkAmount || !checkNumber))
  );

  const hasExceptions    = Object.values(lineItems).some(i => i.refusedQty > 0) || tempExcursion;
  const allRefused       = Object.values(lineItems).every(i => i.refusedQty === i.qty);
  const missingEvidence  = osdPhotoEnabled && Object.values(lineItems).some(i => i.refusedQty > 0 && !i.photoCaptured);
  const missingScans     = lotTrackingEnabled && Object.values(scannedLots).some(v => !v);

  // ── Handlers ────────────────────────────
  const handleRefusedChange = (sku, delta) => {
    setLineItems(prev => {
      const item       = prev[sku];
      const newRefused = Math.max(0, Math.min(item.qty, item.refusedQty + delta));
      return { ...prev, [sku]: { ...item, refusedQty: newRefused, photoCaptured: newRefused === 0 ? false : item.photoCaptured } };
    });
  };

  const handleReasonChange = (sku, reason) => {
    setLineItems(prev => ({ ...prev, [sku]: { ...prev[sku], reason } }));
  };

  const capturePhoto = () => {
    if (!activeCameraSku) return;
    setLineItems(prev => ({ ...prev, [activeCameraSku]: { ...prev[activeCameraSku], photoCaptured: true } }));
    setActiveCameraSku(null);
  };

  const simulateLotScan = () => {
    if (!activeScanSku) return;
    setScannedLots(prev => ({ ...prev, [activeScanSku]: true }));
    setActiveScanSku(null);
  };

  // ── POD Submission ───────────────────────
  const handleSubmitPOD = () => {
    let payloads = null;

    const refusedItems = Object.values(lineItems).filter(i => i.refusedQty > 0);

    // Build exception items — now includes lotId, reasonCode, unitCost, unitPrice
    const exceptionItems = refusedItems.map(i => ({
      sku:              i.sku,
      lotId:            i.lotId,
      qtyRefused:       i.refusedQty,
      reasonCode:       i.reason,
      qcHold:           true,
      evidenceAttached: i.photoCaptured,
      unitCost:         i.unitCost,
      unitPrice:        i.unitPrice,
    }));

    // Add temperature excursion as an exception if applicable
    if (tempExcursion) {
      exceptionItems.push({
        sku:         'ALL',
        lotId:       'ALL',
        qtyRefused:  0,
        reasonCode:  'Temperature Excursion',
        qcHold:      false,
        evidenceAttached: false,
        recordedTempF: tempValue,
        thresholdF:    tempThreshold,
      });
    }

    if (exceptionItems.length > 0) {
      payloads = {
        inventoryPayload: {
          action:    'RESTOCK_EXCEPTION_HOLD',
          timestamp: new Date().toISOString(),
          orderId:   order.id,
          items:     exceptionItems.filter(i => i.sku !== 'ALL').map(i => ({
            sku:        i.sku,
            lotId:      i.lotId,          // ← lot-level traceability
            qtyRefused: i.qtyRefused,
            reasonCode: i.reasonCode,     // ← OS&D reason for QC routing
            qcHold:     i.qcHold,
          })),
        },
        accountingPayload: {
          action:    'CREDIT_MEMO_GENERATION',
          timestamp: new Date().toISOString(),
          orderId:   order.id,
          customer:  order.customer,
          items:     exceptionItems.filter(i => i.sku !== 'ALL').map(i => ({
            sku:             i.sku,
            lotId:           i.lotId,
            qtyToCredit:     i.qtyRefused,
            reasonCode:      i.reasonCode,
            unitPrice:       i.unitPrice,   // ← for credit amount calculation
            creditAmount:    +(i.qtyRefused * i.unitPrice).toFixed(2),
            evidenceAttached: i.evidenceAttached,
          })),
          tempExcursionNote: tempExcursion
            ? `Delivery temp recorded at ${tempValue}°F (threshold: ${tempThreshold}°F)`
            : null,
        },
      };
    }

    let finalStatus = 'Delivered';
    if (allRefused)       finalStatus = 'Delivery Failed (Refused)';
    else if (hasExceptions) finalStatus = 'Delivered (Partial)';

    const paymentCollected = paymentType !== 'none' ? {
      type:     paymentType,
      cash:     paymentType === 'cash'  ? (parseFloat(cashAmount)  || 0) : 0,
      checkAmt: paymentType === 'check' ? (parseFloat(checkAmount) || 0) : 0,
      checkNum: paymentType === 'check' ? checkNumber : '',
      amount:   paymentType === 'cash'  ? (parseFloat(cashAmount)  || 0) : (parseFloat(checkAmount) || 0),
    } : null;

    onComplete(
      { ...order, status: finalStatus, deliveryTempF: needsTempCheck ? tempValue : null, paymentCollected },
      payloads
    );
  };

  // ── Submit button state ──────────────────
  const canSubmit = (!signatureEnabled || signature) && (!photoDeliveryEnabled || deliveryPhotoCaptured) && !missingEvidence && !missingScans && !tempMissing && !paymentIncomplete;

  const submitLabel = () => {
    if (photoDeliveryEnabled && !deliveryPhotoCaptured) return { Icon: Camera, text: 'Delivery Photo Required' };
    if (tempMissing)            return { Icon: Thermometer,  text: 'Temperature Required' };
    if (lotTrackingEnabled && missingScans)   return { Icon: ScanBarcode, text: 'Missing Lot Scans' };
    if (osdPhotoEnabled && missingEvidence)   return { Icon: Camera,      text: 'Missing Photo Evidence' };
    if (!signature)             return { Icon: FileSignature, text: 'Signature Required' };
    if (paymentIncomplete)      return { Icon: DollarSign,   text: 'Enter Payment Amount' };
    if (hasExceptions)          return { Icon: AlertTriangle, text: 'Complete with Exceptions' };
    return                             { Icon: CheckCircle,  text: 'Complete Delivery' };
  };
  const { Icon: SubmitIcon, text: submitText } = submitLabel();

  // ── GPS Check-In Step ──────────────────────────────────────────────────────
  if (podStep === 'checkin') {
    return (
      <div className="absolute inset-0 bg-gray-950 flex flex-col z-20">
        {/* Header */}
        <div className={`${UI.glassHeader} px-4 py-3 flex items-center justify-between`}>
          <button onClick={onClose} className="text-cyan-500 font-bold text-sm">← Back</button>
          <h3 className="font-bold text-gray-100">Arriving at Stop</h3>
          <div className="w-12"/>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          {/* Stop info */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-100">{order.customer}</h2>
            <p className="text-gray-400 mt-2 flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0"/>{order.address}
            </p>
            <span className={`${UI.badgeAmber} inline-flex mt-3`}><Clock className="w-3 h-3"/>{order.timeWindow}</span>
          </div>

          {/* GPS animation / status */}
          {!checkInDone ? (
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Outer ping rings */}
                {checkingIn && <>
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-ping"/>
                  <div className="absolute inset-4 rounded-full border-2 border-cyan-400/40 animate-ping" style={{ animationDelay: '0.3s' }}/>
                </>}
                <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-colors ${
                  checkingIn ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-gray-800 border-gray-700'}`}>
                  <Navigation className={`w-10 h-10 transition-colors ${checkingIn ? 'text-cyan-400' : 'text-gray-500'}`}/>
                </div>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className={`px-10 py-4 rounded-2xl text-lg font-black flex items-center gap-3 transition-all ${
                  checkingIn
                    ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/30 cursor-not-allowed'
                    : 'bg-cyan-500 text-gray-950 active:scale-95'}`}>
                {checkingIn ? (
                  <><RefreshCw className="w-5 h-5 animate-spin"/> Acquiring GPS…</>
                ) : (
                  <><MapPin className="w-5 h-5"/> Check In at This Stop</>
                )}
              </button>
              {checkingIn && (
                <p className="text-xs text-gray-500 animate-pulse">Getting location fix…</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-400"/>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">Checked In ✓</p>
                <p className="text-sm text-gray-400 mt-1">{checkInTime}</p>
                <p className="text-xs font-mono text-gray-600 mt-0.5">
                  {checkInCoords?.lat}°N, {checkInCoords?.lng}°W
                </p>
              </div>
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-5 py-3 text-xs text-gray-400 text-center">
                <span className="text-gray-300 font-semibold">{order.id}</span> · Arrival confirmed &amp; synced to dispatch
              </div>
            </div>
          )}
        </div>

        {checkInDone && (
          <div className="p-5">
            <button onClick={() => setPodStep('form')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2 transition-colors">
              Start Delivery <ChevronRight className="w-5 h-5"/>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gray-950 flex flex-col z-20 overflow-hidden">

      {/* ── Lot Scan Overlay ── */}
      {activeScanSku && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <button onClick={() => setActiveScanSku(null)} className="text-white p-2 bg-gray-800 rounded-full"><X className="w-6 h-6" /></button>
            <div className="text-white text-sm font-bold bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <ScanBarcode className="w-4 h-4 text-cyan-500" />
              <span className="text-cyan-500">Scan Lot: {lineItems[activeScanSku]?.lotId}</span>
            </div>
            <div className="w-10" />
          </div>
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-64 h-48 border-2 border-cyan-500/30 rounded-xl flex items-center justify-center bg-cyan-500/5 relative">
              <Barcode className="w-32 h-32 text-white/10" />
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_12px_rgba(251,191,36,1)]" />
            </div>
          </div>
          <div className="pb-12 pt-4 flex justify-center">
            <button onClick={simulateLotScan} className={`${UI.btnPrimary} px-8 py-4 text-base`}>
              <ScanBarcode className="w-5 h-5" /> Simulate Scan
            </button>
          </div>
        </div>
      )}

      {/* ── Camera Overlay ── */}
      {activeCameraSku && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <button onClick={() => setActiveCameraSku(null)} className="text-white p-2 bg-gray-800 rounded-full"><X className="w-6 h-6" /></button>
            <div className="text-white text-sm font-bold bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-rose-400">OS&amp;D Evidence Photo</span>
            </div>
            <div className="w-10" />
          </div>
          <div className="flex-1 flex items-center justify-center p-8 relative">
            <div className="absolute top-1/4 left-8  w-12 h-12 border-t-4 border-l-4 border-white opacity-40" />
            <div className="absolute top-1/4 right-8 w-12 h-12 border-t-4 border-r-4 border-white opacity-40" />
            <div className="absolute bottom-1/4 left-8  w-12 h-12 border-b-4 border-l-4 border-white opacity-40" />
            <div className="absolute bottom-1/4 right-8 w-12 h-12 border-b-4 border-r-4 border-white opacity-40" />
            <div className="text-white/20 flex flex-col items-center"><Camera className="w-16 h-16 mb-2" /><p>Simulated Viewfinder</p></div>
          </div>
          <div className="pb-12 pt-4 flex justify-center">
            <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center active:scale-95 transition-transform">
              <Aperture className="w-8 h-8 text-gray-800" />
            </button>
          </div>
        </div>
      )}

      {/* ── Delivery Confirmation Camera Overlay ── */}
      {showDeliveryCamera && (
        <div className="absolute inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center">
            <button onClick={() => setShowDeliveryCamera(false)} className="text-white p-2 bg-gray-800 rounded-full"><X className="w-6 h-6" /></button>
            <div className="text-white text-sm font-bold bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400">Delivery Confirmation Photo</span>
            </div>
            <div className="w-10" />
          </div>
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {/* Corner bracket guides */}
            <div className="absolute top-1/4 left-8  w-12 h-12 border-t-4 border-l-4 border-cyan-400 opacity-70" />
            <div className="absolute top-1/4 right-8 w-12 h-12 border-t-4 border-r-4 border-cyan-400 opacity-70" />
            <div className="absolute bottom-1/4 left-8  w-12 h-12 border-b-4 border-l-4 border-cyan-400 opacity-70" />
            <div className="absolute bottom-1/4 right-8 w-12 h-12 border-b-4 border-r-4 border-cyan-400 opacity-70" />
            <div className="text-white/20 flex flex-col items-center gap-2">
              <Camera className="w-16 h-16" />
              <p className="text-sm">Point at placed goods at dock</p>
            </div>
          </div>
          <div className="pb-12 pt-4 flex justify-center">
            <button
              onClick={() => { setDeliveryPhotoCaptured(true); setShowDeliveryCamera(false); }}
              className="w-20 h-20 bg-cyan-500 rounded-full border-4 border-cyan-300 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_24px_rgba(6,182,212,0.4)]"
            >
              <Aperture className="w-8 h-8 text-gray-950" />
            </button>
          </div>
        </div>
      )}

      {/* POD Header */}
      <div className={`${UI.glassHeader} px-4 py-3 flex items-center justify-between`}>
        <button onClick={onClose} className="text-cyan-500 font-bold text-sm">← Back</button>
        <h3 className="font-bold text-gray-100">Stop Detail</h3>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Customer Info */}
        <div className={UI.cardPadded}>
          <h2 className="text-2xl font-bold text-gray-100">{order.customer}</h2>
          <p className="text-gray-500 flex items-start gap-2 mt-2">
            <Navigation className="w-5 h-5 shrink-0 mt-0.5 text-gray-600" />{order.address}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="font-mono text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">{order.id}</span>
            {deliveryWindowsEnabled && order.timeWindow && <span className={UI.badgeAmber}><Clock className="w-3 h-3" />{order.timeWindow}</span>}
          </div>
        </div>

        {/* ── Delivery Confirmation Photo ── */}
        {photoDeliveryEnabled && <div className={UI.cardPadded}>
          <h3 className="font-bold text-gray-100 flex items-center gap-2 mb-3">
            <Camera className="w-5 h-5 text-cyan-500" /> Delivery Confirmation Photo
          </h3>
          {deliveryPhotoCaptured ? (
            <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Photo captured ✓</p>
                  <p className="text-xs text-gray-500 mt-0.5">Delivery confirmation on file</p>
                </div>
              </div>
              <button
                onClick={() => setDeliveryPhotoCaptured(false)}
                className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
              >
                Retake
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeliveryCamera(true)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 text-cyan-400 font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/10 active:scale-[0.98] transition-all"
            >
              <Camera className="w-5 h-5" /> Take Delivery Photo
            </button>
          )}
        </div>}

        {/* ── Temperature Verification ── */}
        {needsTempCheck && (
          <div className={`${UI.card} p-4`}>
            <h3 className="font-bold text-gray-100 flex items-center gap-2 mb-3">
              <Thermometer className="w-5 h-5 text-blue-400" /> Cold Chain Verification
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Record product temperature at point of delivery.
              {tempThreshold && ` Threshold: ${tempThreshold}°F for ${coldestCategory} items.`}
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number" step="0.1" placeholder="e.g. 38"
                value={deliveryTemp}
                onChange={e => setDeliveryTemp(e.target.value)}
                className={`${UI.input} max-w-[120px] text-center text-xl font-bold`}
              />
              <span className="text-gray-400 font-bold text-lg">°F</span>
              {deliveryTemp !== '' && (
                tempExcursion
                  ? <span className={UI.badgeRose}><AlertTriangle className="w-3 h-3" /> EXCURSION — {tempValue}°F exceeds {tempThreshold}°F limit</span>
                  : <span className={UI.badgeEmerald}><CheckCircle2 className="w-3 h-3" /> Within Range</span>
              )}
            </div>
            {tempExcursion && (
              <p className="text-xs text-rose-400 mt-2">
                Temperature excursion will be flagged in the POD and reported to QC. Delivery may still proceed — customer acceptance required.
              </p>
            )}
          </div>
        )}

        {/* ── Line Items Review ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-gray-100">Line Items</h3>
            {hasExceptions && <span className={UI.badgeRose}><AlertTriangle className="w-3 h-3" /> Exceptions Noted</span>}
          </div>

          <div className="space-y-3">
            {Object.values(lineItems).map(item => (
              <div key={item.sku} className={`${UI.card} p-4 border transition-colors ${item.refusedQty > 0 ? 'border-rose-500/30 bg-rose-950/10' : 'border-gray-800'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-100">{item.name}</h4>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{item.sku}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Lot: <span className="font-mono text-gray-500">{item.lotId}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Ordered</p>
                    <p className="text-xl font-bold text-gray-100">{item.qty}</p>
                    {catchWeightEnabled && item.isCatchWeight && item.actualWeight && (
                      <p className="text-xs text-cyan-500 mt-0.5">{item.actualWeight} lbs</p>
                    )}
                  </div>
                </div>

                {/* Refused quantity stepper */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <span className="text-sm font-semibold text-gray-400">Refused at dock:</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleRefusedChange(item.sku, -1)} disabled={item.refusedQty === 0}
                      className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 text-gray-300 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors font-bold">
                      −
                    </button>
                    <span className={`font-bold text-xl w-6 text-center ${item.refusedQty > 0 ? 'text-rose-400' : 'text-gray-100'}`}>
                      {item.refusedQty}
                    </span>
                    <button onClick={() => handleRefusedChange(item.sku, 1)} disabled={item.refusedQty === item.qty}
                      className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 text-gray-300 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors font-bold">
                      +
                    </button>
                  </div>
                </div>

                {/* OS&D reason code + photo evidence */}
                {item.refusedQty > 0 && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-rose-500/20">
                    <div>
                      <label className={UI.label}>OS&amp;D Reason</label>
                      <select value={item.reason} onChange={e => handleReasonChange(item.sku, e.target.value)} className={UI.select}>
                        {OSD_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400">Photo Evidence Required</span>
                      {osdPhotoEnabled && item.photoCaptured ? (
                        <div className={`${UI.badgeEmerald} gap-2`}>
                          <ImageIcon className="w-3 h-3" /> Photo Attached
                          <button onClick={() => setLineItems(prev => ({ ...prev, [item.sku]: { ...prev[item.sku], photoCaptured: false } }))}
                            className="ml-1 text-emerald-400 hover:text-emerald-300 border-l border-emerald-400/30 pl-2">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setActiveCameraSku(item.sku)} className={UI.btnDanger} style={{ padding: '4px 10px', fontSize: '12px' }}>
                          <Camera className="w-3.5 h-3.5" /> Capture
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Lot-Level Scan ── */}
        {lotTrackingEnabled && <div className={UI.cardPadded}>
          <h3 className="font-bold text-gray-100 flex items-center gap-2 mb-3">
            <ScanBarcode className="w-5 h-5 text-cyan-500" /> Lot Verification
          </h3>
          <p className="text-xs text-gray-500 mb-3">Scan the barcode for each lot to confirm delivery against the manifest.</p>
          <div className="space-y-2">
            {order.items.map(item => (
              <div key={item.sku} className={`flex items-center justify-between p-3 rounded-lg border ${scannedLots[item.sku] ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-gray-800 border-gray-700'}`}>
                <div>
                  <div className="font-semibold text-gray-200 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">Lot: {item.lotId}</div>
                </div>
                {scannedLots[item.sku] ? (
                  <span className={UI.badgeEmerald}><CheckCircle2 className="w-3 h-3" /> Scanned</span>
                ) : (
                  <button onClick={() => setActiveScanSku(item.sku)} className={UI.btnSecondary} style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <ScanBarcode className="w-3.5 h-3.5" /> Scan
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>}

        {/* ── Signature ── */}
        {signatureEnabled && <div className={UI.cardPadded}>
          <h3 className="font-bold text-gray-100 flex items-center gap-2 mb-3">
            <FileSignature className="w-5 h-5 text-cyan-500" /> Customer Signature
          </h3>
          <div className={`rounded-xl overflow-hidden border-2 transition-colors ${signature ? 'border-emerald-400/40' : 'border-gray-700'}`}>
            <canvas
              ref={signatureCanvasRef}
              width={320}
              height={160}
              className="w-full block bg-gray-900 touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={drawStroke}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={drawStroke}
              onTouchEnd={stopDraw}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            {signature ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Signature captured
              </span>
            ) : (
              <span className="text-xs text-gray-500">Sign above with finger or mouse</span>
            )}
            {signature && (
              <button
                onClick={clearSignature}
                className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded-lg px-3 py-1 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>}

        {/* ── COD Payment Collection ── */}
        {codEnabled && <div className={UI.cardPadded}>
          <h3 className="font-bold text-gray-100 flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-cyan-500" /> Payment Collection
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Invoice total: <span className="text-gray-300 font-semibold">${invoiceTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            &nbsp;· Select payment type if collecting COD
          </p>

          {/* Payment type toggle */}
          <div className="flex gap-2 mb-4">
            {[['none','No Payment'],['cash','Cash'],['check','Check']].map(([val,label]) => (
              <button key={val} onClick={() => { setPaymentType(val); setCashAmount(''); setCheckAmount(''); setCheckNumber(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  paymentType === val
                    ? val === 'none'  ? 'bg-gray-700 border-gray-600 text-gray-200'
                    : val === 'cash'  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    :                   'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Cash entry */}
          {paymentType === 'cash' && (
            <div>
              <label className={UI.label}>Cash Amount Received</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold text-lg">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  className={`${UI.input} text-lg font-bold`}
                  autoFocus />
              </div>
              {cashAmount && Math.abs(parseFloat(cashAmount) - invoiceTotal) > 0.01 && (
                <p className="text-xs text-cyan-400 mt-2">
                  Variance: ${(parseFloat(cashAmount) - invoiceTotal).toFixed(2)} from invoice total
                </p>
              )}
            </div>
          )}

          {/* Check entry */}
          {paymentType === 'check' && (
            <div className="space-y-3">
              <div>
                <label className={UI.label}>Check Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold text-lg">$</span>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={checkAmount}
                    onChange={e => setCheckAmount(e.target.value)}
                    className={`${UI.input} text-lg font-bold`}
                    autoFocus />
                </div>
              </div>
              <div>
                <label className={UI.label}>Check Number</label>
                <input type="text" placeholder="e.g. 1042"
                  value={checkNumber}
                  onChange={e => setCheckNumber(e.target.value)}
                  className={UI.input} />
              </div>
              {checkAmount && checkNumber && (
                <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                  <span className="text-cyan-400 text-sm font-semibold">
                    ✓ Check #{checkNumber} · ${parseFloat(checkAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentType === 'none' && (
            <p className="text-xs text-gray-600 italic">Account billed on net terms — no COD collection required.</p>
          )}
        </div>}
      </div>

      {/* ── Floating Submit ── */}
      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <button
          onClick={handleSubmitPOD}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors ${
            !canSubmit      ? 'bg-gray-800 text-gray-600 cursor-not-allowed' :
            hasExceptions   ? 'bg-cyan-500 text-gray-950 hover:bg-cyan-400' :
                              'bg-emerald-500 text-white hover:bg-emerald-400'
          }`}
        >
          <SubmitIcon className="w-5 h-5" />{submitText}
        </button>
      </div>
    </div>
  );
}
