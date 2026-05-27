// ── Warehouse Operations + WMS Module ─────────────────────────────────────────
// Tab 1: Fulfillment — original kanban (Pending → Picking → Packed → Shipped)
// Tab 2: Floor Map   — zone/aisle/bay grid with utilization heat map
// Tab 3: Putaway     — task queue for received inventory → suggested slot
// Tab 4: Pick Tasks  — wave pick lists, route-optimized by location sequence
// Tab 5: By Location — inventory at every slot with filter/search

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';
import { TODAY, StatusBadge } from './shared/components.jsx';
import { MOCK_INVENTORY, INVENTORY_BY_ID } from './shared/mockInventory.js';
import { DEMO_MODE } from './lib/demoMode.js';

import {
  PackageSearch, Truck, PackageCheck, ClipboardList, Search,
  AlertTriangle, Scale, Barcode, X, Check, Clock, ArrowRight,
  User, CheckCircle2, RefreshCcw, MapPin, Layers, ArrowDownToLine,
  Route, ListOrdered, Thermometer, Box, ChevronDown, ChevronUp,
  CheckSquare, Square, Navigation2, Inbox, Move, TriangleAlert,
  Warehouse, Eye, Filter, ArrowUpDown, Scan, ArrowLeft,
  MoveRight, Loader2, ShieldCheck, Hash, Package, AlertCircle,
} from 'lucide-react';

// ─── ZONE CONFIG ──────────────────────────────────────────────────────────────
const ZONES = {
  FRZ: {
    label: 'Frozen',    short: 'FRZ',
    temp:  '0°F / -18°C',
    aisles: ['A', 'B'],
    accent: 'cyan',
    bg:     'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text:   'text-cyan-400',
    dot:    'bg-cyan-500',
    headerBg: 'bg-cyan-500/15',
    categories: ['meat', 'poultry', 'seafood'],
  },
  CLR: {
    label: 'Cooler',    short: 'CLR',
    temp:  '38°F / 3°C',
    aisles: ['C', 'D'],
    accent: 'blue',
    bg:     'bg-blue-500/10',
    border: 'border-blue-500/30',
    text:   'text-blue-400',
    dot:    'bg-blue-400',
    headerBg: 'bg-blue-500/15',
    categories: ['dairy', 'produce', 'bakery'],
  },
  DRY: {
    label: 'Dry',       short: 'DRY',
    temp:  'Ambient',
    aisles: ['E', 'F', 'G'],
    accent: 'amber',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/30',
    text:   'text-amber-400',
    dot:    'bg-amber-500',
    headerBg: 'bg-amber-500/15',
    categories: ['dry goods', 'spices', 'beverages', 'condiments'],
  },
  STG: {
    label: 'Staging',   short: 'STG',
    temp:  'Ambient',
    aisles: [],
    accent: 'gray',
    bg:     'bg-gray-700/20',
    border: 'border-gray-700',
    text:   'text-gray-400',
    dot:    'bg-gray-500',
    headerBg: 'bg-gray-800',
    categories: [],
  },
};

// Putaway rule: category → zone
const PUTAWAY_ZONE = {
  'meat':      'FRZ',
  'poultry':   'FRZ',
  'seafood':   'FRZ',
  'dairy':     'CLR',
  'produce':   'CLR',
  'bakery':    'CLR',
  'dry goods': 'DRY',
  'spices':    'DRY',
  'beverages': 'DRY',
  'condiments':'DRY',
};

// Location sort order for pick route optimization
const ZONE_SORT = { FRZ: 0, CLR: 1, DRY: 2, STG: 3 };

const BAYS        = ['01', '02', '03', '04', '05'];
const SLOTS       = [1, 2, 3];
const SLOT_LABEL  = { 1: 'Floor', 2: 'Mid', 3: 'Top' };
// capacity (qty units) per slot by zone
const SLOT_CAP    = { FRZ: 60, CLR: 200, DRY: 80, STG: 150 };

// ─── LOCATION STOCK ───────────────────────────────────────────────────────────
// Keyed by locationId → array of stock lines
const INITIAL_STOCK = {
  // FRZ-A: Ground Beef
  'FRZ-A-01-1': [{ inventoryId: 3,   sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20',   lotId: 'LOT-A',     qty: 30, expiry: '2026-06-15' }],
  'FRZ-A-01-2': [{ inventoryId: 3,   sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20',   lotId: 'LOT-B',     qty: 25, expiry: '2026-06-20' }],
  'FRZ-A-02-1': [{ inventoryId: 3,   sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20',   lotId: 'LOT-A',     qty: 5,  expiry: '2026-06-15' }],
  'FRZ-A-03-1': [],  // reserved for putaway PUT-001
  'FRZ-A-03-2': [{ inventoryId: 45,  sku: 'FRZ-RIB-02',  name: 'Prime Rib Roast 8 lb',       lotId: 'LOT-RIB-1', qty: 18, expiry: '2026-08-10' }],
  'FRZ-A-04-1': [{ inventoryId: 88,  sku: 'FRZ-STRIP-01',name: 'NY Strip Steak 12 oz',        lotId: 'LOT-STR-1', qty: 42, expiry: '2026-07-20' }],
  'FRZ-A-04-2': [{ inventoryId: 88,  sku: 'FRZ-STRIP-01',name: 'NY Strip Steak 12 oz',        lotId: 'LOT-STR-2', qty: 38, expiry: '2026-08-01' }],
  'FRZ-A-05-1': [{ inventoryId: 88,  sku: 'FRZ-STRIP-01',name: 'NY Strip Steak 12 oz',        lotId: 'LOT-STR-1', qty: 10, expiry: '2026-07-20' }],
  // FRZ-B: Chicken
  'FRZ-B-01-1': [{ inventoryId: 112, sku: 'PLT-CHICK-05',name: 'Jumbo Chicken Breasts',       lotId: 'LOT-CH-1',  qty: 40, expiry: '2026-07-01' }],
  'FRZ-B-01-2': [{ inventoryId: 112, sku: 'PLT-CHICK-05',name: 'Jumbo Chicken Breasts',       lotId: 'LOT-CH-1',  qty: 40, expiry: '2026-07-01' }],
  'FRZ-B-02-1': [{ inventoryId: 112, sku: 'PLT-CHICK-05',name: 'Jumbo Chicken Breasts',       lotId: 'LOT-CH-2',  qty: 60, expiry: '2026-07-15' }],
  'FRZ-B-02-2': [{ inventoryId: 112, sku: 'PLT-CHICK-05',name: 'Jumbo Chicken Breasts',       lotId: 'LOT-CH-2',  qty: 60, expiry: '2026-07-15' }],
  'FRZ-B-03-1': [{ inventoryId: 112, sku: 'PLT-CHICK-05',name: 'Jumbo Chicken Breasts',       lotId: 'LOT-CH-2',  qty: 20, expiry: '2026-07-15' }],
  'FRZ-B-04-1': [],  // reserved for putaway PUT-002
  // CLR-C: Dairy
  'CLR-C-01-1': [{ inventoryId: 5,   sku: 'DAI-MILK-02', name: 'Whole Milk 1 Gal',            lotId: 'LOT-MLK-1', qty: 120, expiry: '2026-06-05' }],
  'CLR-C-01-2': [{ inventoryId: 5,   sku: 'DAI-MILK-02', name: 'Whole Milk 1 Gal',            lotId: 'LOT-MLK-2', qty: 140, expiry: '2026-06-12' }],
  'CLR-C-02-1': [{ inventoryId: 205, sku: 'DAI-CHE-02',  name: 'American Cheese Slices 5 lb', lotId: 'LOT-CHE-1', qty: 45,  expiry: '2026-07-10' }],
  'CLR-C-02-2': [{ inventoryId: 205, sku: 'DAI-CHE-02',  name: 'American Cheese Slices 5 lb', lotId: 'LOT-CHE-2', qty: 45,  expiry: '2026-07-25' }],
  'CLR-C-03-1': [],  // reserved for putaway PUT-003
  'CLR-C-04-1': [{ inventoryId: 205, sku: 'DAI-CHE-02',  name: 'American Cheese Slices 5 lb', lotId: 'LOT-CHE-1', qty: 12,  expiry: '2026-07-10' }],
  // CLR-D: Produce + Bakery
  'CLR-D-01-1': [{ inventoryId: 4,   sku: 'PRO-TOMA-01', name: 'Roma Tomatoes 25lb',          lotId: 'LOT-T-1',   qty: 35,  expiry: '2026-06-01' }],
  'CLR-D-01-2': [{ inventoryId: 4,   sku: 'PRO-TOMA-01', name: 'Roma Tomatoes 25lb',          lotId: 'LOT-T-2',   qty: 37,  expiry: '2026-06-08' }],
  'CLR-D-02-1': [{ inventoryId: 201, sku: 'BAK-BUN-01',  name: 'Brioche Burger Buns 12 pk',   lotId: 'LOT-BUN-1', qty: 50,  expiry: '2026-05-28' }],
  'CLR-D-02-2': [{ inventoryId: 201, sku: 'BAK-BUN-01',  name: 'Brioche Burger Buns 12 pk',   lotId: 'LOT-BUN-2', qty: 60,  expiry: '2026-06-04' }],
  'CLR-D-03-1': [{ inventoryId: 4,   sku: 'PRO-TOMA-01', name: 'Roma Tomatoes 25lb',          lotId: 'LOT-T-2',   qty: 15,  expiry: '2026-06-08' }],
  // DRY-E: Rice + Oil
  'DRY-E-01-1': [{ inventoryId: 1,   sku: 'DRY-RICE-05', name: 'Jasmine Rice 50lb (Pallet)',   lotId: 'LOT-C',     qty: 5,   expiry: '2027-12-01' }],
  'DRY-E-02-1': [{ inventoryId: 99,  sku: 'DRY-OIL-5G',  name: 'Vegetable Oil 5 Gal',         lotId: 'LOT-OIL-1', qty: 20,  expiry: '2027-06-01' }],
  'DRY-E-02-2': [{ inventoryId: 99,  sku: 'DRY-OIL-5G',  name: 'Vegetable Oil 5 Gal',         lotId: 'LOT-OIL-2', qty: 23,  expiry: '2027-12-01' }],
  'DRY-E-03-1': [],  // reserved for putaway PUT-004 (done)
  'DRY-E-04-1': [{ inventoryId: 99,  sku: 'DRY-OIL-5G',  name: 'Vegetable Oil 5 Gal',         lotId: 'LOT-OIL-1', qty: 8,   expiry: '2027-06-01' }],
  // DRY-F: Dry goods
  'DRY-F-01-1': [{ inventoryId: null, sku: 'DRY-SALT-01', name: 'Kosher Salt 50lb',            lotId: 'LOT-SAL-1', qty: 40,  expiry: '2028-01-01' }],
  'DRY-F-01-2': [{ inventoryId: null, sku: 'DRY-SALT-01', name: 'Kosher Salt 50lb',            lotId: 'LOT-SAL-1', qty: 20,  expiry: '2028-01-01' }],
  'DRY-F-02-1': [{ inventoryId: null, sku: 'DRY-PEP-01',  name: 'Black Pepper 5lb',            lotId: 'LOT-PEP-1', qty: 35,  expiry: '2027-06-01' }],
  'DRY-F-03-1': [{ inventoryId: null, sku: 'DRY-SUG-01',  name: 'Granulated Sugar 50lb',       lotId: 'LOT-SUG-1', qty: 18,  expiry: '2028-06-01' }],
  'DRY-F-04-1': [{ inventoryId: null, sku: 'DRY-FLOUR-01',name: 'All-Purpose Flour 50lb',      lotId: 'LOT-FLR-1', qty: 22,  expiry: '2027-09-01' }],
  'DRY-F-05-1': [{ inventoryId: null, sku: 'DRY-CORN-01', name: 'Corn Starch 25lb',            lotId: 'LOT-CRN-1', qty: 14,  expiry: '2028-03-01' }],
  // DRY-G: mostly empty (new aisle, being stocked)
  'DRY-G-01-1': [{ inventoryId: null, sku: 'DRY-VINE-01', name: 'White Wine Vinegar 1 Gal',    lotId: 'LOT-VIN-1', qty: 24,  expiry: '2029-01-01' }],
  'DRY-G-02-1': [{ inventoryId: null, sku: 'DRY-SOY-01',  name: 'Soy Sauce 1 Gal',             lotId: 'LOT-SOY-1', qty: 16,  expiry: '2028-08-01' }],
  // Staging
  'STG-RCV-01': [{ inventoryId: 3,   sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20',   lotId: 'LOT-NEW-1', qty: 50,  expiry: '2026-08-01' }],
  'STG-RCV-02': [{ inventoryId: 112, sku: 'PLT-CHICK-05',name: 'Jumbo Chicken Breasts',       lotId: 'LOT-NEW-2', qty: 100, expiry: '2026-08-15' }],
  'STG-SHP-01': [{ inventoryId: 3,   sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20',   lotId: 'LOT-B',     qty: 5,   expiry: '2026-06-20' }],
};

// ─── GENERATE ALL LOCATIONS ───────────────────────────────────────────────────
function buildLocations(stockMap) {
  const locs = [];
  Object.entries(ZONES).forEach(([zoneId, zone]) => {
    if (zoneId === 'STG') {
      // Staging: 5 receiving + 5 shipping positions
      ['RCV', 'SHP'].forEach(type => {
        for (let i = 1; i <= 5; i++) {
          const id = `STG-${type}-0${i}`;
          const contents = stockMap[id] || [];
          const cap = SLOT_CAP.STG;
          const occupied = contents.reduce((s, c) => s + c.qty, 0);
          locs.push({ id, zone: 'STG', aisle: type, bay: String(i).padStart(2, '0'), slot: 1, capacity: cap, occupied, contents, type });
        }
      });
    } else {
      zone.aisles.forEach(aisle => {
        BAYS.forEach(bay => {
          SLOTS.forEach(slot => {
            const id = `${zoneId}-${aisle}-${bay}-${slot}`;
            const contents = stockMap[id] || [];
            const cap = SLOT_CAP[zoneId];
            const occupied = contents.reduce((s, c) => s + c.qty, 0);
            locs.push({ id, zone: zoneId, aisle, bay, slot, capacity: cap, occupied, contents });
          });
        });
      });
    }
  });
  return locs;
}

// ─── PUTAWAY TASKS ────────────────────────────────────────────────────────────
const INITIAL_PUTAWAY = [
  { id: 'PUT-001', receiptId: 'PO-AP-0881', inventoryId: 3,   sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20', lotId: 'LOT-NEW-1', qty: 50,  category: 'meat',      suggestedZone: 'FRZ', suggestedLoc: 'FRZ-A-03-1', status: 'Pending',     assignedTo: null,      receivedAt: `${TODAY} 08:14` },
  { id: 'PUT-002', receiptId: 'PO-AP-0882', inventoryId: 112, sku: 'PLT-CHICK-05',name: 'Jumbo Chicken Breasts',    lotId: 'LOT-NEW-2', qty: 100, category: 'poultry',   suggestedZone: 'FRZ', suggestedLoc: 'FRZ-B-04-1', status: 'In Progress', assignedTo: 'Mark S.', receivedAt: `${TODAY} 09:30` },
  { id: 'PUT-003', receiptId: 'PO-AP-0883', inventoryId: 5,   sku: 'DAI-MILK-02', name: 'Whole Milk 1 Gal',         lotId: 'LOT-MLK-3', qty: 300, category: 'dairy',     suggestedZone: 'CLR', suggestedLoc: 'CLR-C-03-1', status: 'Pending',     assignedTo: null,      receivedAt: `${TODAY} 10:05` },
  { id: 'PUT-004', receiptId: 'PO-AP-0881', inventoryId: 1,   sku: 'DRY-RICE-05', name: 'Jasmine Rice 50lb Pallet',  lotId: 'LOT-RIC-2', qty: 30,  category: 'dry goods', suggestedZone: 'DRY', suggestedLoc: 'DRY-E-03-1', status: 'Done',        assignedTo: 'Ana R.',  receivedAt: `${TODAY} 07:45`, completedAt: `${TODAY} 08:30` },
  { id: 'PUT-005', receiptId: 'PO-AP-0883', inventoryId: 99,  sku: 'DRY-OIL-5G',  name: 'Vegetable Oil 5 Gal',      lotId: 'LOT-OIL-3', qty: 60,  category: 'dry goods', suggestedZone: 'DRY', suggestedLoc: 'DRY-F-01-3', status: 'Pending',     assignedTo: null,      receivedAt: `${TODAY} 10:20` },
];

// ─── PICK TASKS ───────────────────────────────────────────────────────────────
// Lines sorted by location route order (FRZ→CLR→DRY, then aisle→bay→slot)
const INITIAL_PICK_TASKS = [
  {
    id: 'PICK-001', orderId: 'SO-9901', customer: "Joe's Steakhouse – Downtown",
    route: 'Route-12', status: 'Open', picker: null, priority: 'urgent',
    lines: [
      { lineId: 1, sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef 80/20', location: 'FRZ-A-01-1', zone: 'FRZ', lotId: 'LOT-A', qtyReq: 5, done: false },
      { lineId: 2, sku: 'FRZ-RIB-02',  name: 'Prime Rib Roast 8 lb',      location: 'FRZ-A-03-2', zone: 'FRZ', lotId: 'LOT-RIB-1', qtyReq: 2, done: false },
    ],
  },
  {
    id: 'PICK-002', orderId: 'SO-9902', customer: 'Beach Bistro',
    route: 'Route-03', status: 'Active', picker: 'Mark S.', priority: 'normal',
    lines: [
      { lineId: 1, sku: 'PLT-CHICK-05', name: 'Jumbo Chicken Breasts', location: 'FRZ-B-01-1', zone: 'FRZ', lotId: 'LOT-CH-1', qtyReq: 10, done: true },
    ],
  },
  {
    id: 'PICK-003', orderId: 'SO-9903', customer: 'City Convention Center',
    route: 'Route-08', status: 'Open', picker: null, priority: 'normal',
    lines: [
      { lineId: 1, sku: 'FRZ-RIB-02',   name: 'Prime Rib Roast 8 lb',  location: 'FRZ-A-03-2', zone: 'FRZ', lotId: 'LOT-RIB-1', qtyReq: 12, done: false },
      { lineId: 2, sku: 'FRZ-STRIP-01', name: 'NY Strip Steak 12 oz',   location: 'FRZ-A-04-1', zone: 'FRZ', lotId: 'LOT-STR-1', qtyReq: 6,  done: false },
    ],
  },
  {
    id: 'PICK-004', orderId: 'SO-9904', customer: 'Sunset Bistro Chain',
    route: 'Route-03', status: 'Active', picker: 'Jess M.', priority: 'urgent',
    lines: [
      { lineId: 1, sku: 'FRZ-BEEF-01',  name: 'Premium Ground Beef 80/20', location: 'FRZ-A-01-2', zone: 'FRZ', lotId: 'LOT-B',    qtyReq: 8, done: false },
      { lineId: 2, sku: 'PLT-CHICK-05', name: 'Jumbo Chicken Breasts',     location: 'FRZ-B-01-2', zone: 'FRZ', lotId: 'LOT-CH-1', qtyReq: 4, done: true  },
    ],
  },
  {
    id: 'PICK-005', orderId: 'SO-9888', customer: 'Hotel Central',
    route: 'Route-05', status: 'Complete', picker: 'Ana R.', priority: 'normal',
    lines: [
      { lineId: 1, sku: 'FRZ-RIB-02',   name: 'Prime Rib Roast 8 lb',  location: 'FRZ-A-03-2', zone: 'FRZ', lotId: 'LOT-RIB-1', qtyReq: 5, done: true },
      { lineId: 2, sku: 'FRZ-STRIP-01', name: 'NY Strip Steak 12 oz',   location: 'FRZ-A-04-1', zone: 'FRZ', lotId: 'LOT-STR-1', qtyReq: 3, done: true },
    ],
  },
];

const PICKERS = ['Mark S.', 'Ana R.', 'Tom K.', 'Jess M.'];

// ─── ORIGINAL KANBAN DATA ─────────────────────────────────────────────────────
const INIT_ORDERS = [
  { id: 'SO-9901', customer: "Joe's Steakhouse – Downtown", route: 'Route-12', status: 'Pending', timePlaced: '10:23 AM', urgent: true,  picker: null,      items: [{ inventoryId: 3, qty: 5 }, { inventoryId: 45, qty: 2 }] },
  { id: 'SO-9902', customer: 'Beach Bistro',                route: 'Route-03', status: 'Picking', timePlaced: '09:15 AM', urgent: false, picker: 'Mark S.', items: [{ inventoryId: 112, qty: 10 }] },
  { id: 'SO-9888', customer: 'Hotel Central',               route: 'Route-05', status: 'Packed',  timePlaced: '08:00 AM', urgent: false, picker: 'Ana R.',  items: [{ inventoryId: 45, qty: 5 }, { inventoryId: 88, qty: 3 }] },
  { id: 'SO-9875', customer: 'Riverside Grill',             route: 'Route-12', status: 'Shipped', timePlaced: '07:30 AM', urgent: false, picker: 'Tom K.',  items: [{ inventoryId: 3, qty: 3 }, { inventoryId: 88, qty: 2 }] },
  { id: 'SO-9903', customer: 'City Convention Center',      route: 'Route-08', status: 'Pending', timePlaced: '10:45 AM', urgent: false, picker: null,      items: [{ inventoryId: 45, qty: 12 }, { inventoryId: 88, qty: 6 }] },
  { id: 'SO-9904', customer: 'Sunset Bistro Chain',         route: 'Route-03', status: 'Picking', timePlaced: '09:50 AM', urgent: true,  picker: 'Jess M.', items: [{ inventoryId: 3, qty: 8 }, { inventoryId: 112, qty: 4 }] },
];

const COLUMNS = [
  { status: 'Pending',  title: 'Pending',         icon: ClipboardList, accent: 'border-sky-500/40',     headerColor: 'text-sky-400'     },
  { status: 'Picking',  title: 'Active Picking',  icon: PackageSearch, accent: 'border-cyan-500/40',   headerColor: 'text-cyan-500'    },
  { status: 'Packed',   title: 'Packed / Ready',  icon: PackageCheck,  accent: 'border-emerald-500/40', headerColor: 'text-emerald-400' },
  { status: 'Shipped',  title: 'Shipped',         icon: Truck,         accent: 'border-gray-600/40',    headerColor: 'text-gray-400'    },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function utilPct(loc) {
  if (!loc.capacity) return 0;
  return Math.round((loc.occupied / loc.capacity) * 100);
}

function utilColor(pct) {
  if (pct === 0)  return 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600';
  if (pct < 40)   return 'bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-400';
  if (pct < 70)   return 'bg-cyan-500/15 border-cyan-500/30 hover:border-cyan-400';
  if (pct < 90)   return 'bg-amber-500/20 border-amber-500/40 hover:border-amber-400';
  return           'bg-rose-500/20 border-rose-500/40 hover:border-rose-400';
}

function utilTextColor(pct) {
  if (pct === 0)  return 'text-gray-600';
  if (pct < 40)   return 'text-emerald-400';
  if (pct < 70)   return 'text-cyan-400';
  if (pct < 90)   return 'text-amber-400';
  return           'text-rose-400';
}

function sortLocId(id) {
  // 'FRZ-A-01-1' → [0, 0, 1, 1] for sort comparison
  const parts = id.split('-');
  const z = ZONE_SORT[parts[0]] ?? 9;
  const a = parts[1] ? parts[1].charCodeAt(0) : 0;
  const b = parseInt(parts[2] || '0', 10);
  const s = parseInt(parts[3] || '0', 10);
  return [z, a, b, s];
}

// ─── KANBAN COLUMN ────────────────────────────────────────────────────────────
function KanbanColumn({ col, orders, searchQuery, onUpdateStatus, onOpenPacking }) {
  const visible = orders.filter(o =>
    o.status === col.status &&
    (o.customer.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery))
  );
  return (
    <div className={`flex flex-col bg-gray-900/60 border ${col.accent} rounded-xl overflow-hidden h-full min-w-[280px] max-w-xs flex-shrink-0`}>
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className={`flex items-center gap-2 text-sm font-bold ${col.headerColor}`}>
          <col.icon className="w-4 h-4" />{col.title}
        </div>
        <span className="bg-gray-800 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">{visible.length}</span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {visible.length === 0 && <p className="text-center text-xs text-gray-600 py-8">No orders in this queue.</p>}
        {visible.map(order => (
          <div key={order.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors border-l-[3px] ${order.urgent ? 'border-l-rose-500' : col.status === 'Shipped' ? 'border-l-gray-600' : 'border-l-cyan-500'}`}>
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono text-xs font-bold text-cyan-500">{order.id}</span>
              <div className="flex items-center gap-1.5">
                {order.urgent && <span className={UI.badgeRose}>Urgent</span>}
                <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" />{order.timePlaced}</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-200 truncate mb-1">{order.customer}</p>
            <div className="flex items-center justify-between mb-3">
              <span className={UI.badgeSky}>{order.route}</span>
              <span className="text-xs text-gray-500">{order.items.reduce((s, i) => s + i.qty, 0)} items</span>
            </div>
            {order.picker && <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400"><User className="w-3 h-3" />{order.picker}</div>}
            <div className="pt-3 border-t border-gray-800">
              {col.status === 'Pending' && <button onClick={() => onUpdateStatus(order.id, 'Picking')} className={`${UI.btnPrimary} w-full justify-center`}>Start Picking <ArrowRight className="w-4 h-4" /></button>}
              {col.status === 'Picking' && <button onClick={() => onOpenPacking(order)} className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-500/30 text-cyan-500 text-sm font-bold rounded-lg transition-colors w-full"><Scale className="w-4 h-4" /> Pack &amp; Weigh</button>}
              {col.status === 'Packed'  && <button onClick={() => onUpdateStatus(order.id, 'Shipped')} className={UI.btnEmerald}><Truck className="w-4 h-4" /> Ship to Route</button>}
              {col.status === 'Shipped' && <span className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold py-2"><Check className="w-4 h-4" /> Completed</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FLOOR MAP TAB ────────────────────────────────────────────────────────────
function FloorMapTab({ locations }) {
  const [selectedLoc, setSelectedLoc] = useState(null);

  const locById = useMemo(() => Object.fromEntries(locations.map(l => [l.id, l])), [locations]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = locations.filter(l => l.zone !== 'STG').length;
    const occupied = locations.filter(l => l.zone !== 'STG' && l.occupied > 0).length;
    const full = locations.filter(l => l.zone !== 'STG' && utilPct(l) >= 90).length;
    const byZone = {};
    ['FRZ', 'CLR', 'DRY'].forEach(z => {
      const zl = locations.filter(l => l.zone === z);
      const totalQty = zl.reduce((s, l) => s + l.occupied, 0);
      const usedSlots = zl.filter(l => l.occupied > 0).length;
      byZone[z] = { slots: zl.length, usedSlots, totalQty };
    });
    return { total, occupied, full, byZone };
  }, [locations]);

  const selected = selectedLoc ? locById[selectedLoc] : null;

  return (
    <div className="p-6 space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={UI.cardPad}>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Total Slots</p>
          <p className="text-2xl font-black text-gray-100 mt-1">{stats.total}</p>
        </div>
        <div className={UI.cardPad}>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">In Use</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{stats.occupied} <span className="text-sm font-normal text-gray-500">({Math.round(stats.occupied/stats.total*100)}%)</span></p>
        </div>
        <div className={UI.cardPad}>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Near Full (&gt;90%)</p>
          <p className={`text-2xl font-black mt-1 ${stats.full > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.full}</p>
        </div>
        <div className={UI.cardPad}>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Available</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{stats.total - stats.occupied}</p>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Map area */}
        <div className="flex-1 space-y-4">
          {/* Utilization legend */}
          <div className="flex items-center gap-3 flex-wrap text-[10px] text-gray-500 font-semibold uppercase tracking-widest">
            <span className="text-gray-400 font-bold">Utilization:</span>
            {[['Empty', 'bg-gray-800/50 border-gray-700/50'], ['&lt;40%', 'bg-emerald-500/20 border-emerald-500/40'], ['40–70%', 'bg-cyan-500/20 border-cyan-500/40'], ['70–90%', 'bg-amber-500/25 border-amber-500/50'], ['Full', 'bg-rose-500/20 border-rose-500/40']].map(([label, cls]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded border ${cls}`} />
                <span dangerouslySetInnerHTML={{ __html: label }} />
              </div>
            ))}
          </div>

          {/* Zone blocks */}
          {['FRZ', 'CLR', 'DRY'].map(zoneId => {
            const zone = ZONES[zoneId];
            return (
              <div key={zoneId} className={`border ${zone.border} rounded-xl overflow-hidden`}>
                {/* Zone header */}
                <div className={`${zone.headerBg} px-4 py-2.5 border-b ${zone.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Thermometer className={`w-3.5 h-3.5 ${zone.text}`} />
                    <span className={`text-sm font-black ${zone.text}`}>{zone.label} Zone</span>
                    <span className="text-[10px] text-gray-500 font-medium">{zone.temp}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{stats.byZone[zoneId]?.usedSlots}/{stats.byZone[zoneId]?.slots} slots</span>
                    <span>{stats.byZone[zoneId]?.totalQty?.toLocaleString()} units on hand</span>
                  </div>
                </div>

                {/* Aisle grid */}
                <div className="p-4 flex gap-4 overflow-x-auto">
                  {zone.aisles.map(aisle => (
                    <div key={aisle} className="flex flex-col gap-1 min-w-[100px]">
                      <div className={`text-center text-[10px] font-black ${zone.text} uppercase tracking-widest mb-1`}>Aisle {aisle}</div>
                      {BAYS.map(bay => {
                        // Show bay as a single cell; slots shown on click
                        const bayLocs = SLOTS.map(s => locById[`${zoneId}-${aisle}-${bay}-${s}`]).filter(Boolean);
                        const totalOcc = bayLocs.reduce((s, l) => s + l.occupied, 0);
                        const totalCap = bayLocs.reduce((s, l) => s + l.capacity, 0);
                        const pct = totalCap ? Math.round((totalOcc / totalCap) * 100) : 0;
                        const isSelected = bayLocs.some(l => l.id === selectedLoc);
                        return (
                          <button
                            key={bay}
                            onClick={() => {
                              // select first slot of this bay
                              const firstLoc = bayLocs[0];
                              if (firstLoc) setSelectedLoc(prev => prev === firstLoc.id ? null : firstLoc.id);
                            }}
                            className={`relative border rounded-lg px-3 py-2 text-center transition-all cursor-pointer ${
                              isSelected ? `ring-2 ring-offset-1 ring-offset-gray-950 ring-${zone.accent}-500 ` : ''
                            } ${utilColor(pct)}`}
                            title={`Bay ${aisle}${bay} — ${pct}% full`}
                          >
                            <div className="text-[10px] font-bold text-gray-400">{bay}</div>
                            <div className={`text-[10px] font-black ${utilTextColor(pct)}`}>{pct}%</div>
                            {/* Slot indicators */}
                            <div className="flex items-center justify-center gap-0.5 mt-1">
                              {bayLocs.map(l => (
                                <div key={l.id} className={`w-1.5 h-1.5 rounded-full ${l.occupied > 0 ? zone.dot : 'bg-gray-700'}`} title={SLOT_LABEL[l.slot]} />
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Staging strip */}
          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2.5 border-b border-gray-700 flex items-center gap-2">
              <ArrowDownToLine className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-black text-gray-400">Staging</span>
              <span className="text-[10px] text-gray-600 ml-auto">Receiving docks · Shipping lanes</span>
            </div>
            <div className="p-4 flex gap-3 overflow-x-auto">
              {['RCV', 'SHP'].map(type => (
                <div key={type} className="flex gap-2 items-center">
                  <span className="text-[10px] text-gray-600 font-semibold uppercase shrink-0">{type === 'RCV' ? 'Recv' : 'Ship'}:</span>
                  {[1,2,3,4,5].map(n => {
                    const id = `STG-${type}-0${n}`;
                    const loc = locById[id];
                    const pct = loc ? utilPct(loc) : 0;
                    return (
                      <button
                        key={n}
                        onClick={() => setSelectedLoc(prev => prev === id ? null : id)}
                        className={`border rounded-lg px-3 py-2 text-center text-[10px] font-bold transition-all ${
                          selectedLoc === id ? 'ring-2 ring-gray-500 ring-offset-1 ring-offset-gray-950 ' : ''
                        } ${utilColor(pct)}`}
                        title={id}
                      >
                        <div className="text-gray-400">{n}</div>
                        <div className={utilTextColor(pct)}>{pct}%</div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="w-72 shrink-0">
            <div className={`${UI.card} sticky top-4`}>
              <div className={`px-4 py-3 border-b border-gray-800 flex items-center justify-between`}>
                <div>
                  <div className={`font-mono text-sm font-black ${ZONES[selected.zone]?.text || 'text-gray-300'}`}>{selected.id}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {ZONES[selected.zone]?.label} · {SLOT_LABEL[selected.slot] || selected.aisle} shelf · Cap {selected.capacity}
                  </div>
                </div>
                <button onClick={() => setSelectedLoc(null)} className="text-gray-600 hover:text-gray-300 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              {/* Slots in same bay */}
              {selected.zone !== 'STG' && (
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Bay Slots</div>
                  <div className="space-y-1">
                    {SLOTS.map(s => {
                      const slotLoc = locById[`${selected.zone}-${selected.aisle}-${selected.bay}-${s}`];
                      if (!slotLoc) return null;
                      const pct = utilPct(slotLoc);
                      return (
                        <button
                          key={s}
                          onClick={() => setSelectedLoc(slotLoc.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                            slotLoc.id === selected.id ? 'bg-gray-700 ring-1 ring-cyan-500/50' : 'hover:bg-gray-800'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${slotLoc.occupied > 0 ? ZONES[selected.zone]?.dot : 'bg-gray-700'}`} />
                          <span className="font-semibold text-gray-300">{SLOT_LABEL[s]}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-1 overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : pct > 0 ? 'bg-emerald-500' : 'bg-gray-700'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`font-bold ${utilTextColor(pct)}`}>{pct}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contents */}
              <div className="px-4 py-3">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                  Contents — {selected.occupied}/{selected.capacity} {selected.zone === 'FRZ' || selected.zone === 'CLR' ? 'cases' : 'units'}
                </div>
                {selected.contents.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-600 italic">Empty slot</div>
                ) : (
                  <div className="space-y-2">
                    {selected.contents.map((item, i) => (
                      <div key={i} className="bg-gray-800/50 rounded-lg p-2.5">
                        <div className="font-semibold text-xs text-gray-200 leading-tight">{item.name}</div>
                        <div className="font-mono text-[10px] text-gray-500 mt-0.5">{item.sku}</div>
                        <div className="flex items-center justify-between mt-1.5 text-[10px]">
                          <span className="text-cyan-400 font-bold">Lot: {item.lotId}</span>
                          <span className="text-gray-400">{item.qty} units</span>
                        </div>
                        <div className="text-[10px] text-gray-600 mt-0.5">Exp: {item.expiry}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-72 shrink-0">
            <div className={`${UI.card} flex flex-col items-center justify-center py-16 text-center`}>
              <MapPin className="w-8 h-8 text-gray-700 mb-3" />
              <p className="text-sm font-semibold text-gray-500">Click any bay</p>
              <p className="text-xs text-gray-600 mt-1">to view slot contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PUTAWAY TAB ─────────────────────────────────────────────────────────────
function PutawayTab({ tasks, setTasks }) {
  const [overrideLoc, setOverrideLoc] = useState({});

  const stats = useMemo(() => ({
    pending:    tasks.filter(t => t.status === 'Pending').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    done:       tasks.filter(t => t.status === 'Done').length,
  }), [tasks]);

  const assignTask = (id, picker) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'In Progress', assignedTo: picker } : t));
  };
  const completeTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Done', completedAt: `${TODAY} ${new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}` } : t));
  };

  const STATUS_STYLE = {
    'Pending':     'bg-sky-500/10 text-sky-400 border-sky-500/30',
    'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Done':        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Pending</p><p className="text-2xl font-black text-sky-400 mt-1">{stats.pending}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">In Progress</p><p className="text-2xl font-black text-amber-400 mt-1">{stats.inProgress}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Done Today</p><p className="text-2xl font-black text-emerald-400 mt-1">{stats.done}</p></div>
      </div>

      {/* Putaway rules */}
      <div className={`${UI.card} p-4`}>
        <div className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-cyan-500" /> Putaway Rules</div>
        <div className="flex flex-wrap gap-2">
          {[['Meat / Poultry / Seafood', 'FRZ', 'cyan'], ['Dairy / Produce / Bakery', 'CLR', 'blue'], ['Dry Goods / Spices / Beverages', 'DRY', 'amber']].map(([cats, zone, color]) => (
            <div key={zone} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-${color}-500/8 border-${color}-500/25 text-${color}-300`}>
              <span className={`w-2 h-2 rounded-full ${ZONES[zone].dot}`} />
              {cats} → <span className={`font-black ${ZONES[zone].text}`}>{ZONES[zone].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task table */}
      <div className={UI.card}>
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-200 flex items-center gap-2"><ArrowDownToLine className="w-4 h-4 text-cyan-500" /> Putaway Queue</span>
          <span className="text-xs text-gray-500">{tasks.filter(t => t.status !== 'Done').length} open</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/40">
                {['Task', 'Receipt', 'SKU / Item', 'Lot', 'Qty', 'Suggested Location', 'Assigned To', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {tasks.map(task => {
                const zone = ZONES[task.suggestedZone];
                const isDone = task.status === 'Done';
                const loc = overrideLoc[task.id] || task.suggestedLoc;
                return (
                  <tr key={task.id} className={`hover:bg-gray-800/30 transition-colors ${isDone ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono font-bold text-cyan-500">{task.id}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-[10px]">{task.receiptId}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-200 leading-tight">{task.name}</div>
                      <div className="font-mono text-[10px] text-gray-500">{task.sku}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{task.lotId}</td>
                    <td className="px-4 py-3 font-bold text-gray-200">{task.qty}</td>
                    <td className="px-4 py-3">
                      {isDone ? (
                        <span className="font-mono text-[10px] text-gray-500">{loc}</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-1 rounded border ${zone?.bg} ${zone?.border} ${zone?.text}`}>
                            <MapPin className="w-2.5 h-2.5" />{loc}
                          </span>
                          <input
                            type="text"
                            value={overrideLoc[task.id] || ''}
                            onChange={e => setOverrideLoc(prev => ({ ...prev, [task.id]: e.target.value }))}
                            placeholder="Override…"
                            className="w-24 bg-gray-800 border border-gray-700 text-gray-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {task.assignedTo || <span className="text-gray-600 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[task.status]}`}>{task.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {!isDone && (
                        <div className="flex items-center gap-1.5">
                          {task.status === 'Pending' && (
                            <select
                              className="bg-gray-800 border border-gray-700 text-gray-300 text-[10px] rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                              defaultValue=""
                              onChange={e => { if (e.target.value) assignTask(task.id, e.target.value); }}
                            >
                              <option value="" disabled>Assign…</option>
                              {PICKERS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          )}
                          {task.status === 'In Progress' && (
                            <button onClick={() => completeTask(task.id)} className={`${UI.btnEmerald} py-1 text-[10px]`}>
                              <Check className="w-3 h-3" /> Done
                            </button>
                          )}
                        </div>
                      )}
                      {isDone && task.completedAt && (
                        <span className="text-[10px] text-gray-600">✓ {task.completedAt}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PICK TASKS TAB ───────────────────────────────────────────────────────────
function PickTasksTab({ tasks, setTasks }) {
  const [expanded, setExpanded] = useState({});
  const [search, setSearch]   = useState('');

  const stats = useMemo(() => ({
    open:     tasks.filter(t => t.status === 'Open').length,
    active:   tasks.filter(t => t.status === 'Active').length,
    complete: tasks.filter(t => t.status === 'Complete').length,
    urgent:   tasks.filter(t => t.priority === 'urgent' && t.status !== 'Complete').length,
  }), [tasks]);

  const filtered = useMemo(() => tasks.filter(t =>
    !search || t.orderId.includes(search) || t.customer.toLowerCase().includes(search.toLowerCase())
  ), [tasks, search]);

  const toggleLine = (taskId, lineId) => {
    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t,
      lines: t.lines.map(l => l.lineId !== lineId ? l : { ...l, done: !l.done }),
    }));
  };

  const startPick = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Active', picker: PICKERS[0] } : t));
    setExpanded(prev => ({ ...prev, [taskId]: true }));
  };

  const completePick = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Complete' } : t));
  };

  const STATUS_STYLE = {
    'Open':     'text-sky-400 bg-sky-500/10 border-sky-500/30',
    'Active':   'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'Complete': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Open</p><p className="text-2xl font-black text-sky-400 mt-1">{stats.open}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Active</p><p className="text-2xl font-black text-amber-400 mt-1">{stats.active}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Completed</p><p className="text-2xl font-black text-emerald-400 mt-1">{stats.complete}</p></div>
        <div className={UI.cardPad}><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Urgent Open</p><p className={`text-2xl font-black mt-1 ${stats.urgent > 0 ? 'text-rose-400' : 'text-gray-500'}`}>{stats.urgent}</p></div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order or customer…" className={`${UI.input} pl-9`} />
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {filtered.map(task => {
          const isExpanded = !!expanded[task.id];
          const doneCount = task.lines.filter(l => l.done).length;
          const allDone = doneCount === task.lines.length;
          const zone = ZONES['FRZ']; // most picks are frozen; just for color accent

          return (
            <div key={task.id} className={`${UI.card} overflow-hidden`}>
              {/* Task header */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => setExpanded(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
              >
                <div className={`shrink-0 w-1 self-stretch rounded-full ${task.priority === 'urgent' ? 'bg-rose-500' : 'bg-cyan-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-cyan-500">{task.id}</span>
                    <span className="text-xs text-gray-400 font-mono">→ {task.orderId}</span>
                    {task.priority === 'urgent' && <span className={UI.badgeRose}>Urgent</span>}
                  </div>
                  <div className="text-sm font-semibold text-gray-200 truncate">{task.customer}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                    <span>{task.route}</span>
                    {task.picker && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{task.picker}</span>}
                    <span className="flex items-center gap-1"><Route className="w-2.5 h-2.5" />Route-optimized</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Progress */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-20 bg-gray-800 rounded-full h-1.5">
                      <div className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${task.lines.length ? (doneCount / task.lines.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">{doneCount}/{task.lines.length}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[task.status]}`}>{task.status}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              {/* Expanded pick list */}
              {isExpanded && (
                <div className="border-t border-gray-800">
                  {/* Column headers */}
                  <div className="grid grid-cols-[32px_1fr_auto_auto_auto_auto] gap-3 px-5 py-2 bg-gray-900/50 text-[10px] uppercase tracking-widest text-gray-600 font-bold border-b border-gray-800">
                    <span></span>
                    <span>Item</span>
                    <span>Location</span>
                    <span>Lot</span>
                    <span>Qty</span>
                    <span>Done</span>
                  </div>
                  {task.lines.map((line, idx) => {
                    const lineZone = ZONES[line.zone];
                    return (
                      <div
                        key={line.lineId}
                        className={`grid grid-cols-[32px_1fr_auto_auto_auto_auto] gap-3 items-center px-5 py-3 border-b border-gray-800/50 last:border-0 transition-colors ${line.done ? 'bg-emerald-500/5 opacity-60' : 'hover:bg-gray-800/20'}`}
                      >
                        <div className={`text-[10px] font-bold text-gray-600 text-center`}>{idx + 1}</div>
                        <div>
                          <div className={`text-xs font-semibold ${line.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>{line.name}</div>
                          <div className="font-mono text-[10px] text-gray-600">{line.sku}</div>
                        </div>
                        <div className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-1 rounded border ${lineZone?.bg} ${lineZone?.border} ${lineZone?.text}`}>
                          <MapPin className="w-2.5 h-2.5" />{line.location}
                        </div>
                        <div className="font-mono text-[10px] text-gray-500">{line.lotId}</div>
                        <div className="text-xs font-bold text-gray-300 text-right">{line.qtyReq}</div>
                        <button
                          onClick={() => task.status !== 'Open' && toggleLine(task.id, line.lineId)}
                          disabled={task.status === 'Open'}
                          className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                            line.done
                              ? 'text-emerald-400'
                              : task.status === 'Open' ? 'text-gray-700 cursor-not-allowed' : 'text-gray-600 hover:text-cyan-400'
                          }`}
                        >
                          {line.done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}

                  {/* Footer actions */}
                  <div className="px-5 py-3 flex items-center justify-between bg-gray-900/30">
                    <span className="text-[10px] text-gray-600 flex items-center gap-1.5">
                      <Navigation2 className="w-3 h-3 text-cyan-500" />
                      Picks routed: FRZ-A → FRZ-B → CLR → DRY
                    </span>
                    <div className="flex items-center gap-2">
                      {task.status === 'Open' && (
                        <button onClick={() => startPick(task.id)} className={UI.btnPrimary}>
                          <Route className="w-3.5 h-3.5" /> Start Pick
                        </button>
                      )}
                      {task.status === 'Active' && allDone && (
                        <button onClick={() => completePick(task.id)} className={UI.btnEmerald}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete Pick
                        </button>
                      )}
                      {task.status === 'Complete' && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Pick complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── INVENTORY BY LOCATION TAB ────────────────────────────────────────────────
function InventoryByLocationTab({ locations }) {
  const [zoneFilter, setZoneFilter]   = useState('all');
  const [aisleFilter, setAisleFilter] = useState('all');
  const [search, setSearch]           = useState('');
  const [sortCol, setSortCol]         = useState('location');
  const [sortDir, setSortDir]         = useState('asc');

  // Flatten all stock lines with location info
  const rows = useMemo(() => {
    const all = [];
    locations.forEach(loc => {
      if (loc.contents.length === 0) {
        all.push({ ...loc, item: null, empty: true });
      } else {
        loc.contents.forEach(item => {
          all.push({ ...loc, item, empty: false });
        });
      }
    });
    return all;
  }, [locations]);

  const allAisles = useMemo(() => {
    const set = new Set(locations.map(l => l.aisle));
    return Array.from(set).sort();
  }, [locations]);

  const filtered = useMemo(() => rows.filter(r => {
    if (zoneFilter !== 'all' && r.zone !== zoneFilter) return false;
    if (aisleFilter !== 'all' && r.aisle !== aisleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchLoc  = r.id.toLowerCase().includes(q);
      const matchItem = r.item?.name?.toLowerCase().includes(q) || r.item?.sku?.toLowerCase().includes(q) || r.item?.lotId?.toLowerCase().includes(q);
      if (!matchLoc && !matchItem) return false;
    }
    return true;
  }), [rows, zoneFilter, aisleFilter, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av, bv;
      if (sortCol === 'location') {
        const as = sortLocId(a.id), bs = sortLocId(b.id);
        for (let i = 0; i < 4; i++) { if (as[i] !== bs[i]) return sortDir === 'asc' ? as[i] - bs[i] : bs[i] - as[i]; }
        return 0;
      }
      if (sortCol === 'sku')     { av = a.item?.sku || ''; bv = b.item?.sku || ''; }
      if (sortCol === 'qty')     { av = a.item?.qty || 0;  bv = b.item?.qty || 0; }
      if (sortCol === 'expiry')  { av = a.item?.expiry || '9999'; bv = b.item?.expiry || '9999'; }
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return copy;
  }, [filtered, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortBtn = ({ col, label }) => (
    <button onClick={() => toggleSort(col)} className={`flex items-center gap-1 hover:text-gray-300 transition-colors ${sortCol === col ? 'text-cyan-400' : 'text-gray-500'}`}>
      {label}<ArrowUpDown className="w-3 h-3" />
    </button>
  );

  // Count stats
  const totalQty = useMemo(() => filtered.reduce((s, r) => s + (r.item?.qty || 0), 0), [filtered]);
  const emptySlots = useMemo(() => filtered.filter(r => r.empty).length, [filtered]);

  return (
    <div className="p-6 space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search location, SKU, lot…" className={`${UI.input} pl-9`} />
        </div>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className={`${UI.select} w-auto`}>
          <option value="all">All zones</option>
          {Object.entries(ZONES).map(([k, z]) => <option key={k} value={k}>{z.label}</option>)}
        </select>
        <select value={aisleFilter} onChange={e => setAisleFilter(e.target.value)} className={`${UI.select} w-auto`}>
          <option value="all">All aisles</option>
          {allAisles.map(a => <option key={a} value={a}>Aisle {a}</option>)}
        </select>
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-3">
          <span>{sorted.length} rows</span>
          <span className="text-gray-600">·</span>
          <span>{totalQty.toLocaleString()} total units</span>
          <span className="text-gray-600">·</span>
          <span>{emptySlots} empty slots</span>
        </div>
      </div>

      <div className={UI.card}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/40">
                <th className="text-left px-4 py-2.5"><SortBtn col="location" label="Location" /></th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Zone</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Slot</th>
                <th className="text-left px-4 py-2.5"><SortBtn col="sku" label="SKU" /></th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Item</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Lot</th>
                <th className="text-right px-4 py-2.5"><SortBtn col="qty" label="Qty" /></th>
                <th className="text-left px-4 py-2.5"><SortBtn col="expiry" label="Expiry" /></th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Util</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {sorted.map((row, i) => {
                const zone = ZONES[row.zone];
                const pct = utilPct(row);
                return (
                  <tr key={`${row.id}-${i}`} className={`hover:bg-gray-800/30 transition-colors ${row.empty ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-2.5 font-mono font-bold text-[11px] text-gray-300">{row.id}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${zone?.bg} ${zone?.border} ${zone?.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${zone?.dot}`} />
                        {zone?.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{row.zone !== 'STG' ? SLOT_LABEL[row.slot] || '—' : row.aisle}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-gray-500">{row.item?.sku || <span className="text-gray-700 italic">Empty</span>}</td>
                    <td className="px-4 py-2.5 text-gray-300 max-w-[160px] truncate">{row.item?.name || ''}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-cyan-400">{row.item?.lotId || ''}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-200">{row.item?.qty?.toLocaleString() || ''}</td>
                    <td className="px-4 py-2.5">
                      {row.item?.expiry ? (
                        <span className={`text-[10px] font-semibold ${new Date(row.item.expiry) < new Date(Date.now() + 14*86400e3) ? 'text-rose-400' : 'text-gray-500'}`}>
                          {row.item.expiry}
                        </span>
                      ) : ''}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 bg-gray-800 rounded-full h-1">
                          <div className={`h-full rounded-full ${pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : pct > 0 ? 'bg-emerald-500' : 'bg-gray-700'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold w-8 text-right ${utilTextColor(pct)}`}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ASSOCIATE PORTAL ─────────────────────────────────────────────────────────
export default function WarehouseModule() {
  const [activeTab, setActiveTab]              = useState('fulfillment');
  const [orders, setOrders]                    = useState(DEMO_MODE ? INIT_ORDERS : []);
  const [searchQuery, setSearchQuery]          = useState('');
  const [packingModalOrder, setPackingModalOrder] = useState(null);
  const [packingData, setPackingData]          = useState({});
  const [toast, setToast]                      = useState(null);

  const [locationStock, setLocationStock]      = useState(DEMO_MODE ? INITIAL_STOCK : {});
  const locations = useMemo(() => buildLocations(locationStock), [locationStock]);

  // Lifted task state — shared across tabs + associate portal
  const [pickTasks,    setPickTasks]    = useState(DEMO_MODE ? INITIAL_PICK_TASKS : []);
  const [putawayTasks, setPutawayTasks] = useState(DEMO_MODE ? INITIAL_PUTAWAY : []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  }, []);

  const openPackingModal = useCallback((order) => {
    const initialData = {};
    order.items.forEach(item => {
      const inv = MOCK_INVENTORY.find(i => i.id === item.inventoryId);
      if (!inv) return;
      initialData[item.inventoryId] = {
        lotId:        inv.lots.find(l => !l.qcHold)?.lotId ?? '',
        actualWeight: inv.isCatchWeight ? '' : null,
        qtyPicked:    item.qty,
      };
    });
    setPackingData(initialData);
    setPackingModalOrder(order);
  }, []);

  const submitPackingForm = useCallback(() => {
    for (const item of packingModalOrder.items) {
      const inv  = MOCK_INVENTORY.find(i => i.id === item.inventoryId);
      if (!inv) continue;
      const data = packingData[item.inventoryId];
      if (inv.isCatchWeight && !data?.actualWeight) { showToast(`Enter actual weight for ${inv.name}`, 'warning'); return; }
      if (!data?.lotId) { showToast(`Select a Lot ID for ${inv.name}`, 'warning'); return; }
    }
    updateOrderStatus(packingModalOrder.id, 'Packed');
    showToast(`${packingModalOrder.id} packed and ready`);
    setPackingModalOrder(null);
  }, [packingModalOrder, packingData, updateOrderStatus, showToast]);

  const counts = COLUMNS.reduce((acc, col) => {
    acc[col.status] = orders.filter(o => o.status === col.status).length;
    return acc;
  }, {});

  const TABS = [
    { id: 'fulfillment', label: 'Fulfillment',           icon: PackageSearch  },
    { id: 'floormap',    label: 'Floor Map',              icon: Warehouse      },
    { id: 'putaway',     label: 'Putaway',                icon: ArrowDownToLine},
    { id: 'picktasks',   label: 'Pick Tasks',             icon: ListOrdered    },
    { id: 'bylocation',  label: 'Inventory by Location',  icon: MapPin         },
  ];

  return (
    <div className={UI.page}>
      {/* ── Module Header ── */}
      <div className="shrink-0 bg-gray-900/60 border-b border-gray-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl">
            <Warehouse className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-100">Warehouse Operations</h1>
            <p className="text-xs text-gray-500">WMS · Pick → Pack → Ship · Zone/Aisle/Bay/Slot</p>
          </div>
        </div>

        {/* Stats pills (fulfillment only) */}
        {activeTab === 'fulfillment' && (
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="hidden lg:flex items-center gap-2">
              {COLUMNS.map(col => (
                <div key={col.status} className="flex items-center gap-1.5 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-1.5">
                  <col.icon className={`w-3.5 h-3.5 ${col.headerColor}`} />
                  <span className="text-xs font-bold text-gray-300">{counts[col.status]}</span>
                </div>
              ))}
            </div>
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input type="text" placeholder="Search orders or customers…" className={`${UI.input} pl-8`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div id="kernal-module-tabs" className="shrink-0 flex items-center gap-1 px-6 pt-3 border-b border-gray-800 bg-gray-900/40 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? 'text-cyan-400 border-cyan-500 bg-cyan-500/5'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'fulfillment' && (
          <div className="overflow-x-auto p-6 h-full">
            <div className="flex gap-4 h-full items-start min-w-max">
              {COLUMNS.map(col => (
                <KanbanColumn key={col.status} col={col} orders={orders} searchQuery={searchQuery} onUpdateStatus={updateOrderStatus} onOpenPacking={openPackingModal} />
              ))}
            </div>
          </div>
        )}
        {activeTab === 'floormap'   && <FloorMapTab locations={locations} />}
        {activeTab === 'putaway'    && <PutawayTab tasks={putawayTasks} setTasks={setPutawayTasks} />}
        {activeTab === 'picktasks'  && <PickTasksTab tasks={pickTasks} setTasks={setPickTasks} />}
        {activeTab === 'bylocation' && <InventoryByLocationTab locations={locations} />}
      </main>

      {/* ── Pack & Weigh Modal ── */}
      {packingModalOrder && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-800 shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-100 flex items-center gap-2"><Scale className="w-4 h-4 text-cyan-500" /> Pack Order: <span className="text-cyan-500 font-mono">{packingModalOrder.id}</span></h2>
                <p className="text-xs text-gray-400 mt-0.5">{packingModalOrder.customer} · Enter weights and assign lot numbers</p>
              </div>
              <button onClick={() => setPackingModalOrder(null)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {packingModalOrder.items.map(item => {
                const inv = MOCK_INVENTORY.find(i => i.id === item.inventoryId);
                if (!inv) return null;
                return (
                  <div key={item.inventoryId} className={`border rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center ${inv.isCatchWeight ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-gray-800 bg-gray-800/30'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-200 text-sm">{inv.name}</h4>
                        {inv.isCatchWeight && <span className={UI.badgeCyan}>Catch-Weight</span>}
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-1">{inv.sku}</p>
                      <p className="text-sm mt-2 text-gray-400">Req. qty: <span className="text-cyan-500 font-black text-base">{item.qty}</span></p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 md:w-[420px] shrink-0">
                      <div className="flex-1">
                        <label className={UI.label}><Barcode className="w-3 h-3 inline mr-1" />Lot ID</label>
                        <select className={UI.select} value={packingData[item.inventoryId]?.lotId ?? ''} onChange={e => { const v = e.target.value; const id = item.inventoryId; setPackingData(prev => ({ ...prev, [id]: { ...prev[id], lotId: v } })); }}>
                          <option value="" disabled>Choose lot…</option>
                          {inv.lots.filter(l => !l.qcHold).map(lot => <option key={lot.lotId} value={lot.lotId}>{lot.lotId} · exp {lot.expiry} · qty {lot.qty}</option>)}
                        </select>
                      </div>
                      {inv.isCatchWeight ? (
                        <div className="w-32 shrink-0">
                          <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1"><Scale className="w-3 h-3 inline mr-1" />Total lbs</label>
                          <input type="number" min="0" step="0.1" placeholder={`~${(inv.avgWeightPerCase || 10) * item.qty}`} className="w-full bg-gray-900 border-2 border-cyan-500/40 text-gray-100 placeholder-gray-600 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors" value={packingData[item.inventoryId]?.actualWeight ?? ''} onChange={e => { const v = e.target.value; const id = item.inventoryId; setPackingData(prev => ({ ...prev, [id]: { ...prev[id], actualWeight: v } })); }} />
                        </div>
                      ) : (
                        <div className="w-32 flex items-end pb-1"><span className="text-xs text-gray-600 italic">No weight req.</span></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-500"><AlertTriangle className="w-3.5 h-3.5 text-cyan-500 shrink-0" />Invoice totals recalculate from actual weights</div>
              <div className="flex gap-3">
                <button onClick={() => setPackingModalOrder(null)} className={UI.btnGhost}>Cancel</button>
                <button onClick={submitPackingForm} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"><Check className="w-4 h-4" /> Mark as Packed</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest border backdrop-blur-md transition-all ${toast.type === 'warning' ? 'bg-cyan-600/10 text-cyan-500 border-cyan-600/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
          <CheckCircle2 className="w-4 h-4" /> {toast.msg}
        </div>
      )}
    </div>
  );
}
