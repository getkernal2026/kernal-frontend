import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useKernal, LOCATIONS } from './KernalContext.jsx';
import { UI } from './ui.js';

import { Modal, ModalOverlay, Overlay, ModalBox, ModalHeader, DocModalHeader } from './shared/Modal.jsx';
import AttachmentsPanel from './shared/AttachmentsPanel.jsx';
import RecordHistory from './shared/RecordHistory.jsx';

import { TODAY, StatusBadge, PrintButton, ExportButton } from './shared/components.jsx';
import { DEMO_MODE } from './lib/demoMode.js';
import { api } from './lib/api.js';

import {
  ShoppingCart, Package, Truck, AlertTriangle, CheckCircle,
  XCircle, Clock, Plus, Search, Send, X,
  ChevronLeft, ChevronRight, Bot, ArrowRightLeft,
  FileText, DollarSign, Building2, Star, RotateCcw,
  Thermometer, Hash, BarChart3, Eye, Calendar, Printer,
  Clipboard, Minus, ChevronDown, ShoppingBag,
  Zap, RefreshCw, Paperclip, Award, TrendingUp, TrendingDown,
  MapPin, Percent, Receipt, BadgeDollarSign, Target,
} from 'lucide-react';

// Local copy — avoids Rolldown IIFE TDZ ordering issue with KernalContext
const COMPANY_INFO = {
  name:     'Kernel Food Distribution LLC',
  address:  '1800 Commerce Pkwy, Suite A',
  city:     'New Orleans, LA 70123',
  phone:    '(504) 555-9100',
  email:    'purchasing@kernaldist.com',
  taxId:    '72-1234567',
  fdaRegId: 'FD-2026-KFD-001',
};


// ─── Design System Tokens ─────────────────────────────────────────────────────
// ─── Domain Constants ─────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const PO_STATUSES = ['Draft', 'Approved', 'Sent', 'Partially Received', 'Received', 'Cancelled'];
const TEMP_OPTIONS = ['frozen', 'refrigerated', 'dairy', 'dry'];

// Temp thresholds (°F) for receiving validation
const TEMP_THRESHOLDS = { frozen: 10, refrigerated: 41, dairy: 41, dry: null };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = prefix =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// FIX #3: Timezone-safe SLA check — zeroes out time on both sides so date-input
// midnight UTC doesn't drift relative to local time, preventing off-by-one errors.
const daysUntilExpiry = dateStr => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${dateStr}T00:00:00`);
  return Math.floor((expiry - today) / 86400000);
};

const slaCheck = (expiryDate, minShelfLifeDays) => {
  const days = daysUntilExpiry(expiryDate);
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days < minShelfLifeDays) return 'fail';
  return 'pass';
};

const formatCurrency = n => `$${Number(n || 0).toFixed(2)}`;
const formatDate = d => (d ? new Date(d).toLocaleDateString() : '—');

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_VENDORS = [
  {
    vendorId: 'V-001', name: 'Gulf Coast Proteins', category: 'Proteins',
    contact: 'Maria Santos', email: 'maria@gulfcoast.com', phone: '(504) 555-0101',
    leadTimeDays: 3, paymentTerms: 'Net 30', rating: 4.8, preferredVendor: true, activeStatus: 'Active',
  },
  {
    vendorId: 'V-002', name: 'Sunshine Produce Co.', category: 'Produce',
    contact: 'Dave Kim', email: 'dave@sunshinepc.com', phone: '(813) 555-0202',
    leadTimeDays: 1, paymentTerms: 'Net 15', rating: 4.5, preferredVendor: true, activeStatus: 'Active',
  },
  {
    vendorId: 'V-003', name: 'Dairy Fresh Distributors', category: 'Dairy',
    contact: 'Pam Lewis', email: 'pam@dairyfresh.com', phone: '(985) 555-0303',
    leadTimeDays: 2, paymentTerms: 'Net 30', rating: 4.2, preferredVendor: false, activeStatus: 'Active',
  },
  {
    vendorId: 'V-004', name: 'Metro Dry Goods', category: 'Dry Goods',
    contact: 'Tom Reyes', email: 'tom@metrodrygoods.com', phone: '(504) 555-0404',
    leadTimeDays: 5, paymentTerms: 'Net 45', rating: 3.9, preferredVendor: false, activeStatus: 'Active',
  },
];

const INITIAL_POS = [
  {
    poNumber: 'PO-2024-0881', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    locationId: 'LOC-A',
    status: 'Sent', createdDate: '2024-06-10', expectedDelivery: '2024-06-13',
    freightCost: 125.00, surcharges: 0, taxes: 0,
    items: [
      {
        sku: 'PROT-001', description: 'Gulf Shrimp 16/20 ct 5lb', qty: 20, unitCost: 42.50,
        landedUnitCost: null, minShelfLifeDays: 14, isCatchWeight: true,
        tempCategory: 'frozen', receivedQty: 0,
      },
      {
        sku: 'PROT-002', description: 'Chicken Breast Boneless 10lb', qty: 40, unitCost: 28.75,
        landedUnitCost: null, minShelfLifeDays: 7, isCatchWeight: true,
        tempCategory: 'refrigerated', receivedQty: 0,
      },
    ],
  },
  {
    poNumber: 'PO-2024-0882', vendorId: 'V-002', vendorName: 'Sunshine Produce Co.',
    locationId: 'LOC-A',
    status: 'Approved', createdDate: '2024-06-11', expectedDelivery: '2024-06-12',
    freightCost: 55.00, surcharges: 10.00, taxes: 0,
    items: [
      {
        sku: 'PROD-007', description: 'Roma Tomatoes 25lb Case', qty: 30, unitCost: 18.00,
        landedUnitCost: null, minShelfLifeDays: 5, isCatchWeight: false,
        tempCategory: 'refrigerated', receivedQty: 0,
      },
      {
        sku: 'PROD-012', description: 'Russet Potatoes 50lb Bag', qty: 50, unitCost: 22.00,
        landedUnitCost: null, minShelfLifeDays: 30, isCatchWeight: false,
        tempCategory: 'dry', receivedQty: 0,
      },
    ],
  },
  {
    poNumber: 'PO-2024-0879', vendorId: 'V-003', vendorName: 'Dairy Fresh Distributors',
    locationId: 'LOC-B',
    status: 'Partially Received', createdDate: '2024-06-08', expectedDelivery: '2024-06-10',
    freightCost: 80.00, surcharges: 0, taxes: 4.50,
    items: [
      {
        sku: 'DAIRY-003', description: 'Heavy Cream 1QT / 12ct', qty: 24, unitCost: 36.00,
        landedUnitCost: 37.10, minShelfLifeDays: 10, isCatchWeight: false,
        tempCategory: 'dairy', receivedQty: 24,
      },
      {
        sku: 'DAIRY-008', description: 'Butter Unsalted 1lb / 36ct', qty: 48, unitCost: 52.00,
        landedUnitCost: null, minShelfLifeDays: 30, isCatchWeight: false,
        tempCategory: 'dairy', receivedQty: 0,
      },
    ],
  },
];

const INITIAL_AI_UPDATES = [
  {
    id: 'AI-001', type: 'REROUTE', severity: 'high',
    poNumber: 'PO-2024-0881', affectedSku: 'PROT-001',
    message: 'Gulf Coast Proteins flagged a potential 2-day delay on Shrimp 16/20 ct due to port congestion. Alternative: Bayou Seafood Co. can fulfill at $44.00/case with the same lead time.',
    suggestedVendorId: 'V-ALT-001', suggestedVendorName: 'Bayou Seafood Co.',
    suggestedUnitCost: 44.00, timestamp: '2024-06-11T08:15:00', status: 'pending',
    // FIX #6: minShelfLifeDays carried on AI update so rerouted items keep SLA constraint
    minShelfLifeDays: 14,
  },
  {
    id: 'AI-002', type: 'PRICE_CHANGE', severity: 'medium',
    poNumber: 'PO-2024-0882', affectedSku: 'PROD-007',
    message: 'Roma Tomato market price spiked 12% due to weather events in Mexico. Current PO cost $18.00 is below spot. Sunshine Produce may request an amendment.',
    suggestedUnitCost: 20.16, timestamp: '2024-06-11T09:30:00', status: 'pending',
  },
  {
    id: 'AI-003', type: 'AUTO_REORDER', severity: 'low',
    affectedSku: 'DAIRY-003', skuDescription: 'Heavy Cream 1QT / 12ct',
    message: 'Heavy Cream inventory at 8 cases — below reorder point of 20. Suggested PO: 48 cases (4 pallets) from Dairy Fresh Distributors at current contract price.',
    suggestedQty: 48, suggestedVendorId: 'V-003', suggestedVendorName: 'Dairy Fresh Distributors',
    suggestedUnitCost: 36.00, timestamp: '2024-06-11T10:00:00', status: 'pending',
    // FIX #6: minShelfLifeDays preserved so auto-generated PO items are SLA-aware
    minShelfLifeDays: 10,
  },
];

const INITIAL_RTVS = [
  {
    rtvId: 'RTV-001', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    poNumber: 'PO-2024-0875', createdDate: '2024-06-05',
    status: 'Authorized', reason: 'OS&D — Temperature Excursion at Receiving',
    items: [
      {
        sku: 'PROT-001', description: 'Gulf Shrimp 16/20 ct 5lb',
        qtyReturned: 5, unitCost: 42.50, landedUnitCost: 43.80,
        // FIX #7: creditAmount uses landedUnitCost when available
        creditAmount: 5 * 43.80,
      },
    ],
    authorizationCode: 'RMA-GC-9921',
  },
];

// ─── Vendor Scorecard History ────────────────────────────────────────────────
// Each record: one historical delivery. date = actual delivery, expected = promised date,
// orderDate = PO placed date. Used to compute on-time rate, fill rate, rejection rate, avg lead time.
const VENDOR_HISTORY = {
  'V-001': [ // Gulf Coast Proteins — Grade: A
    { orderDate:'2026-05-02', date:'2026-05-05', expected:'2026-05-05', ordered:30, received:30, rejected:1 },
    { orderDate:'2026-04-18', date:'2026-04-21', expected:'2026-04-21', ordered:30, received:30, rejected:0 },
    { orderDate:'2026-04-04', date:'2026-04-07', expected:'2026-04-07', ordered:28, received:28, rejected:0 },
    { orderDate:'2026-03-21', date:'2026-03-24', expected:'2026-03-24', ordered:30, received:30, rejected:1 },
    { orderDate:'2026-03-07', date:'2026-03-10', expected:'2026-03-10', ordered:30, received:30, rejected:0 },
    { orderDate:'2026-02-21', date:'2026-02-24', expected:'2026-02-24', ordered:28, received:28, rejected:1 },
    { orderDate:'2026-02-07', date:'2026-02-10', expected:'2026-02-10', ordered:32, received:32, rejected:1 },
    { orderDate:'2026-01-24', date:'2026-01-27', expected:'2026-01-27', ordered:30, received:30, rejected:0 },
  ],
  'V-002': [ // Sunshine Produce Co. — Grade: B
    { orderDate:'2026-05-04', date:'2026-05-05', expected:'2026-05-05', ordered:30, received:30, rejected:1 },
    { orderDate:'2026-04-20', date:'2026-04-22', expected:'2026-04-21', ordered:25, received:24, rejected:1 }, // late
    { orderDate:'2026-04-06', date:'2026-04-07', expected:'2026-04-07', ordered:30, received:30, rejected:0 },
    { orderDate:'2026-03-23', date:'2026-03-24', expected:'2026-03-24', ordered:28, received:28, rejected:1 },
    { orderDate:'2026-03-09', date:'2026-03-10', expected:'2026-03-10', ordered:27, received:26, rejected:1 },
    { orderDate:'2026-02-23', date:'2026-02-24', expected:'2026-02-24', ordered:30, received:30, rejected:1 },
    { orderDate:'2026-02-09', date:'2026-02-10', expected:'2026-02-10', ordered:30, received:26, rejected:0 },
  ],
  'V-003': [ // Dairy Fresh Distributors — Grade: C
    { orderDate:'2026-05-08', date:'2026-05-10', expected:'2026-05-10', ordered:30, received:28, rejected:1 },
    { orderDate:'2026-04-24', date:'2026-04-28', expected:'2026-04-26', ordered:30, received:28, rejected:1 }, // late
    { orderDate:'2026-04-10', date:'2026-04-12', expected:'2026-04-12', ordered:28, received:28, rejected:1 },
    { orderDate:'2026-03-27', date:'2026-03-30', expected:'2026-03-29', ordered:30, received:28, rejected:1 }, // late
    { orderDate:'2026-03-13', date:'2026-03-15', expected:'2026-03-15', ordered:32, received:30, rejected:1 },
    { orderDate:'2026-02-27', date:'2026-03-01', expected:'2026-03-01', ordered:30, received:28, rejected:0 },
  ],
  'V-004': [ // Metro Dry Goods — Grade: B
    { orderDate:'2026-05-14', date:'2026-05-19', expected:'2026-05-19', ordered:52, received:52, rejected:0 },
    { orderDate:'2026-04-30', date:'2026-05-05', expected:'2026-05-05', ordered:50, received:50, rejected:0 },
    { orderDate:'2026-04-16', date:'2026-04-21', expected:'2026-04-21', ordered:48, received:48, rejected:0 },
    { orderDate:'2026-04-02', date:'2026-04-09', expected:'2026-04-07', ordered:50, received:48, rejected:1 }, // late
    { orderDate:'2026-03-19', date:'2026-03-24', expected:'2026-03-24', ordered:50, received:50, rejected:0 },
    { orderDate:'2026-03-05', date:'2026-03-10', expected:'2026-03-10', ordered:50, received:50, rejected:0 },
    { orderDate:'2026-02-19', date:'2026-02-24', expected:'2026-02-24', ordered:50, received:49, rejected:1 },
    { orderDate:'2026-02-05', date:'2026-02-10', expected:'2026-02-10', ordered:50, received:40, rejected:0 },
  ],
};

const computeVendorScore = (vendorId, leadTimeDays) => {
  const records = VENDOR_HISTORY[vendorId] || [];
  if (records.length === 0) return null;

  const totalOrdered   = records.reduce((s, r) => s + r.ordered, 0);
  const totalReceived  = records.reduce((s, r) => s + r.received, 0);
  const totalRejected  = records.reduce((s, r) => s + r.rejected, 0);
  const onTimeCount    = records.filter(r => r.date <= r.expected).length;
  const avgDays        = records.reduce((s, r) => {
    const diff = (new Date(r.date) - new Date(r.orderDate)) / 86400000;
    return s + diff;
  }, 0) / records.length;

  const onTimeRate    = (onTimeCount / records.length) * 100;
  const fillRate      = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 100;
  const rejectionRate = totalReceived > 0 ? (totalRejected / totalReceived) * 100 : 0;
  const daysOver      = Math.max(0, avgDays - leadTimeDays);

  // Normalize each metric to 0–100 score
  const onTimeScore = onTimeRate;                                        // already 0-100%
  const fillScore   = Math.min(100, Math.max(0, (fillRate - 80) / 20 * 100)); // 80%=0, 100%=100
  const rejScore    = Math.max(0, 100 - rejectionRate * 10);            // 0%=100, 10%+=0
  const leadScore   = Math.max(0, 100 - daysOver * 20);                 // on-time=100, +5d over=0

  const composite = onTimeScore * 0.35 + fillScore * 0.35 + rejScore * 0.20 + leadScore * 0.10;

  const grade = composite >= 90 ? 'A' : composite >= 78 ? 'B' : composite >= 65 ? 'C' : composite >= 52 ? 'D' : 'F';

  const lastDelivery = [...records].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;

  return {
    onTimeRate, fillRate, rejectionRate, avgDays, composite,
    grade, totalDeliveries: records.length, lastDelivery,
  };
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const getStatusStyle = status => {
  const map = {
    'Draft':               'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-700/60 text-gray-300 border border-gray-600',
    'Pending Approval':    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20',
    // FIX #8: 'Approved' has its own distinct amber badge (was missing entirely)
    'Approved':            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
    'Sent':                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-400/10 text-sky-400 border border-sky-400/20',
    'Partially Received':  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-violet-400/10 text-violet-400 border border-violet-400/20',
    'Received':            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
    'Cancelled':           'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Pending Authorization': 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
    'Authorized':          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-400/10 text-sky-400 border border-sky-400/20',
    'Shipped':             'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-violet-400/10 text-violet-400 border border-violet-400/20',
    'Credit Received':     'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  };
  return map[status] || map['Draft'];
};

const SeverityBadge = ({ severity }) => {
  const styles = { high: UI.badgeRose, medium: UI.badgeAmber, low: UI.badgeEmerald };
  return <span className={styles[severity] || UI.badgeAmber}>{severity.toUpperCase()}</span>;
};

// ─── ModalWrapper ─────────────────────────────────────────────────────────────
// ─── ManualRequisitionModal (FIX #9: new component, was button with no handler) ──
// ─── Buyer Company Info (appears on generated POs) ───────────────────────────


// ─── Vendor Catalog ───────────────────────────────────────────────────────────
// Each entry = one item a specific vendor sells.
// internalSku → your client's SKU; vendorProductCode → what the vendor calls it.
const VENDOR_CATALOG = [
  // ── Gulf Coast Proteins (V-001) ──────────────────────────────────────────
  { vendorId:'V-001', vendorProductCode:'GCP-BEEF-8020', internalSku:'FRZ-BEEF-01',  description:'Ground Beef 80/20 5lb Chub',           uom:'case', lastPOPrice:85.50, isCatchWeight:true,  minShelfLifeDays:14, tempCategory:'refrigerated' },
  { vendorId:'V-001', vendorProductCode:'GCP-SHR-1620',  internalSku:'PROT-001',     description:'Gulf Shrimp 16/20 ct 5lb Block',        uom:'case', lastPOPrice:42.50, isCatchWeight:true,  minShelfLifeDays:14, tempCategory:'frozen' },
  { vendorId:'V-001', vendorProductCode:'GCP-CHK-BNL',   internalSku:'PROT-002',     description:'Chicken Breast Boneless 10lb',          uom:'case', lastPOPrice:28.75, isCatchWeight:true,  minShelfLifeDays:7,  tempCategory:'refrigerated' },
  { vendorId:'V-001', vendorProductCode:'GCP-SAL-ATL',   internalSku:'PROT-003',     description:'Atlantic Salmon Fillet 5lb',            uom:'case', lastPOPrice:62.00, isCatchWeight:true,  minShelfLifeDays:7,  tempCategory:'refrigerated' },
  { vendorId:'V-001', vendorProductCode:'GCP-POR-RIB',   internalSku:'PROT-004',     description:"Pork Baby Back Ribs 3-Down",            uom:'case', lastPOPrice:55.00, isCatchWeight:true,  minShelfLifeDays:10, tempCategory:'refrigerated' },
  // ── Sunshine Produce Co. (V-002) ─────────────────────────────────────────
  { vendorId:'V-002', vendorProductCode:'SPC-TOM-RMA',   internalSku:'PRO-TOMA-01',  description:'Roma Tomatoes 25lb Case',               uom:'case', lastPOPrice:18.00, isCatchWeight:false, minShelfLifeDays:5,  tempCategory:'refrigerated' },
  { vendorId:'V-002', vendorProductCode:'SPC-POT-RST',   internalSku:'PRO-POT-01',   description:'Russet Potatoes 50lb Bag',              uom:'bag',  lastPOPrice:22.00, isCatchWeight:false, minShelfLifeDays:30, tempCategory:'dry' },
  { vendorId:'V-002', vendorProductCode:'SPC-LET-ICE',   internalSku:'PRO-LET-01',   description:'Iceberg Lettuce 24ct',                  uom:'case', lastPOPrice:28.00, isCatchWeight:false, minShelfLifeDays:7,  tempCategory:'refrigerated' },
  { vendorId:'V-002', vendorProductCode:'SPC-YEL-ONI',   internalSku:'PRO-ONI-01',   description:'Yellow Onions 50lb Bag',                uom:'bag',  lastPOPrice:19.50, isCatchWeight:false, minShelfLifeDays:30, tempCategory:'dry' },
  { vendorId:'V-002', vendorProductCode:'SPC-BEL-PEP',   internalSku:'PRO-PEP-01',   description:'Bell Peppers Mixed 25lb Case',          uom:'case', lastPOPrice:35.00, isCatchWeight:false, minShelfLifeDays:7,  tempCategory:'refrigerated' },
  // ── Dairy Fresh Distributors (V-003) ─────────────────────────────────────
  { vendorId:'V-003', vendorProductCode:'DFD-MLK-WHL',   internalSku:'DAI-MILK-02',  description:'Whole Milk 1 Gal (4pk)',                uom:'case', lastPOPrice:18.00, isCatchWeight:false, minShelfLifeDays:10, tempCategory:'dairy' },
  { vendorId:'V-003', vendorProductCode:'DFD-CRM-1QT',   internalSku:'DAI-CRM-01',   description:'Heavy Cream 1QT / 12ct',                uom:'case', lastPOPrice:36.00, isCatchWeight:false, minShelfLifeDays:10, tempCategory:'dairy' },
  { vendorId:'V-003', vendorProductCode:'DFD-BUT-UNS',   internalSku:'DAI-BUT-01',   description:'Butter Unsalted 1lb / 36ct',            uom:'case', lastPOPrice:52.00, isCatchWeight:false, minShelfLifeDays:30, tempCategory:'dairy' },
  { vendorId:'V-003', vendorProductCode:'DFD-CHE-SHR',   internalSku:'DAI-MOZ-01',   description:'Shredded Mozzarella 5lb Bag',           uom:'bag',  lastPOPrice:24.50, isCatchWeight:false, minShelfLifeDays:14, tempCategory:'dairy' },
  { vendorId:'V-003', vendorProductCode:'DFD-CRM-CHE',   internalSku:'DAI-CRM-CH',   description:'Cream Cheese 3lb / 6ct',                uom:'case', lastPOPrice:42.00, isCatchWeight:false, minShelfLifeDays:21, tempCategory:'dairy' },
  // ── Metro Dry Goods (V-004) ───────────────────────────────────────────────
  { vendorId:'V-004', vendorProductCode:'MDG-RCE-JAS',   internalSku:'DRY-RICE-05',  description:'Jasmine Rice 50lb Bag',                 uom:'bag',  lastPOPrice:35.00, isCatchWeight:false, minShelfLifeDays:180,tempCategory:'dry' },
  { vendorId:'V-004', vendorProductCode:'MDG-CUP-16Z',   internalSku:'SUP-CUP-16',   description:'16oz Clear Plastic Cups / 50ct Sleeve', uom:'case', lastPOPrice:45.00, isCatchWeight:false, minShelfLifeDays:0,  tempCategory:'dry' },
  { vendorId:'V-004', vendorProductCode:'MDG-OIL-CAN',   internalSku:'DRY-OIL-01',   description:'Canola Oil 1 Gal / 6ct',                uom:'case', lastPOPrice:68.00, isCatchWeight:false, minShelfLifeDays:365,tempCategory:'dry' },
  { vendorId:'V-004', vendorProductCode:'MDG-FLR-APF',   internalSku:'DRY-FLR-01',   description:'All-Purpose Flour 50lb Bag',            uom:'bag',  lastPOPrice:28.00, isCatchWeight:false, minShelfLifeDays:365,tempCategory:'dry' },
  { vendorId:'V-004', vendorProductCode:'MDG-SUG-GRN',   internalSku:'DRY-SUG-01',   description:'Granulated Sugar 50lb Bag',             uom:'bag',  lastPOPrice:42.00, isCatchWeight:false, minShelfLifeDays:730,tempCategory:'dry' },
  { vendorId:'V-004', vendorProductCode:'MDG-BAG-SND',   internalSku:'SUP-BAG-01',   description:'Sandwich Bags 6x6 / 500ct',             uom:'case', lastPOPrice:32.00, isCatchWeight:false, minShelfLifeDays:0,  tempCategory:'dry' },
];

const ManualRequisitionModal = ({ vendors, onSubmit, onClose }) => {
  const [vendorId, setVendorId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [lines, setLines] = useState([
    { sku: '', description: '', qty: '', unitCost: '', minShelfLifeDays: '', isCatchWeight: false, tempCategory: 'refrigerated' },
  ]);
  const [errors, setErrors] = useState({});

  const addLine = () =>
    setLines(prev => [
      ...prev,
      { sku: '', description: '', qty: '', unitCost: '', minShelfLifeDays: '', isCatchWeight: false, tempCategory: 'refrigerated' },
    ]);

  const removeLine = idx => setLines(prev => prev.filter((_, i) => i !== idx));

  const updateLine = (idx, field, value) =>
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const validate = () => {
    const errs = {};
    if (!vendorId) errs.vendorId = 'Vendor is required';
    if (!expectedDelivery) errs.expectedDelivery = 'Delivery date is required';
    lines.forEach((l, i) => {
      if (!l.sku.trim()) errs[`sku_${i}`] = 'Required';
      if (!l.description.trim()) errs[`desc_${i}`] = 'Required';
      if (!l.qty || Number(l.qty) <= 0) errs[`qty_${i}`] = 'Must be > 0';
      if (!l.unitCost || Number(l.unitCost) <= 0) errs[`cost_${i}`] = 'Must be > 0';
      if (!l.minShelfLifeDays || Number(l.minShelfLifeDays) <= 0) errs[`sla_${i}`] = 'Required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const vendor = vendors.find(v => v.vendorId === vendorId);
    const newPO = {
      poNumber: generateId('PO'),
      vendorId,
      vendorName: vendor?.name || 'Unknown Vendor',
      status: 'Draft',
      createdDate: new Date().toISOString().slice(0, 10),
      expectedDelivery,
      freightCost: 0, surcharges: 0, taxes: 0,
      items: lines.map(l => ({
        sku: l.sku.trim(),
        description: l.description.trim(),
        qty: Number(l.qty),
        unitCost: Number(l.unitCost),
        landedUnitCost: null,
        minShelfLifeDays: Number(l.minShelfLifeDays),
        isCatchWeight: l.isCatchWeight,
        tempCategory: l.tempCategory,
        receivedQty: 0,
      })),
    };
    onSubmit(newPO);
  };

  return (
    <Modal isOpen={true} title="New Manual Requisition" onClose={onClose} wide>
      <div className="space-y-5">
        {/* Vendor + Delivery row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Vendor *</label>
            <select value={vendorId} onChange={e => setVendorId(e.target.value)} className={UI.input}>
              <option value="">— Select Vendor —</option>
              {vendors.map(v => (
                <option key={v.vendorId} value={v.vendorId}>{v.name}</option>
              ))}
            </select>
            {errors.vendorId && <p className="text-rose-400 text-xs mt-1">{errors.vendorId}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Expected Delivery *</label>
            <input
              type="date"
              value={expectedDelivery}
              onChange={e => setExpectedDelivery(e.target.value)}
              className={UI.input}
            />
            {errors.expectedDelivery && <p className="text-rose-400 text-xs mt-1">{errors.expectedDelivery}</p>}
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-300">Line Items</h3>
            <button onClick={addLine} className={`${UI.btnSecondary} text-xs py-1.5`}>
              <Plus size={13} /> Add Line
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 tracking-widest">LINE {idx + 1}</span>
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(idx)} className="text-rose-400 hover:text-rose-300 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">SKU *</label>
                    <input
                      value={line.sku}
                      onChange={e => updateLine(idx, 'sku', e.target.value)}
                      placeholder="e.g. PROT-001"
                      className={UI.input}
                    />
                    {errors[`sku_${idx}`] && <p className="text-rose-400 text-xs mt-1">{errors[`sku_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description *</label>
                    <input
                      value={line.description}
                      onChange={e => updateLine(idx, 'description', e.target.value)}
                      placeholder="Item description"
                      className={UI.input}
                    />
                    {errors[`desc_${idx}`] && <p className="text-rose-400 text-xs mt-1">{errors[`desc_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Qty (cases) *</label>
                    <input
                      type="number" min="1"
                      value={line.qty}
                      onChange={e => updateLine(idx, 'qty', e.target.value)}
                      placeholder="0"
                      className={UI.input}
                    />
                    {errors[`qty_${idx}`] && <p className="text-rose-400 text-xs mt-1">{errors[`qty_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Unit Cost *</label>
                    <input
                      type="number" min="0" step="0.01"
                      value={line.unitCost}
                      onChange={e => updateLine(idx, 'unitCost', e.target.value)}
                      placeholder="0.00"
                      className={UI.input}
                    />
                    {errors[`cost_${idx}`] && <p className="text-rose-400 text-xs mt-1">{errors[`cost_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Shelf Life (days) *</label>
                    <input
                      type="number" min="1"
                      value={line.minShelfLifeDays}
                      onChange={e => updateLine(idx, 'minShelfLifeDays', e.target.value)}
                      placeholder="e.g. 14"
                      className={UI.input}
                    />
                    {errors[`sla_${idx}`] && <p className="text-rose-400 text-xs mt-1">{errors[`sla_${idx}`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Temp Category</label>
                    <select
                      value={line.tempCategory}
                      onChange={e => updateLine(idx, 'tempCategory', e.target.value)}
                      className={UI.input}
                    >
                      {TEMP_OPTIONS.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`cw-${idx}`}
                    checked={line.isCatchWeight}
                    onChange={e => updateLine(idx, 'isCatchWeight', e.target.checked)}
                    className="rounded accent-cyan-500"
                  />
                  <label htmlFor={`cw-${idx}`} className="text-xs text-gray-400">
                    Catch Weight Item — priced by actual lb weight
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className={UI.btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} className={UI.btnPrimary}>
            <FileText size={15} /> Create Draft PO
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── ReceivingModal ───────────────────────────────────────────────────────────
const ReceivingModal = ({ po, onClose, onComplete }) => {
  // FIX #10: Pre-generate a Kernel Lot ID per line, surfaced and editable by clerk
  const initLines = () =>
    po.items.map(item => ({
      sku: item.sku,
      lotId: generateId('LOT'),          // pre-generated, editable
      supplierLotNumber: '',             // FIX #4: supplier batch # for traceability
      receivedQty: item.receivedQty > 0 ? String(item.receivedQty) : '',
      expiryDate: '',
      receivedTempF: '',                 // FIX #5: temp at receiving for cold chain audit
      slaResult: null,
    }));

  const [lines, setLines] = useState(initLines);
  const [submitError, setSubmitError] = useState('');

  const updateLine = (idx, field, value) => {
    setLines(prev =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const updated = { ...l, [field]: value };
        // Live SLA feedback whenever expiry changes — FIX #3 timezone-safe
        if (field === 'expiryDate' && value) {
          updated.slaResult = slaCheck(value, po.items[idx].minShelfLifeDays);
        }
        return updated;
      })
    );
  };

  const handleSubmit = () => {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const item = po.items[i];
      if (item.receivedQty >= item.qty) continue; // already fully received

      if (!l.receivedQty || Number(l.receivedQty) <= 0) {
        setSubmitError(`Line ${i + 1} (${item.sku}): received quantity is required.`);
        return;
      }
      if (!l.expiryDate) {
        setSubmitError(`Line ${i + 1} (${item.sku}): expiry date is required.`);
        return;
      }
      if (!l.receivedTempF) {
        setSubmitError(`Line ${i + 1} (${item.sku}): received temperature is required.`);
        return;
      }
      // FIX #3: SLA validated with timezone-safe helper
      const result = slaCheck(l.expiryDate, item.minShelfLifeDays);
      if (result === 'expired' || result === 'fail') {
        setSubmitError(
          `Line ${i + 1} (${item.sku}): Expiry fails the ${item.minShelfLifeDays}-day minimum shelf life. Reject or initiate RTV.`
        );
        return;
      }
    }
    setSubmitError('');
    onComplete(po.poNumber, lines);
  };

  return (
    <Modal isOpen={true} title={`Receive Against ${po.poNumber}`} onClose={onClose} wide>
      <div className="space-y-4">
        {/* PO summary bar */}
        <div className="bg-gray-800/40 rounded-lg px-4 py-3 flex flex-wrap gap-6 text-sm">
          <span>
            <span className="text-gray-500">Vendor:</span>{' '}
            <span className="text-gray-200 font-medium">{po.vendorName}</span>
          </span>
          <span>
            <span className="text-gray-500">Expected:</span>{' '}
            <span className="text-gray-200 font-medium">{formatDate(po.expectedDelivery)}</span>
          </span>
        </div>

        {po.items.map((item, idx) => {
          const l = lines[idx];
          const alreadyDone = item.receivedQty >= item.qty;
          const threshold = TEMP_THRESHOLDS[item.tempCategory];
          const tempOver = threshold !== null && l.receivedTempF !== '' && Number(l.receivedTempF) > threshold;

          return (
            <div
              key={item.sku}
              className={`border rounded-xl p-4 space-y-3 ${
                alreadyDone ? 'border-emerald-800/40 bg-emerald-900/10' : 'border-gray-700 bg-gray-800/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-200 text-sm">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.sku} · Ordered: {item.qty} · Prev. received: {item.receivedQty}
                    {item.isCatchWeight && (
                      <span className="ml-2 text-cyan-500 font-bold">[Catch Weight]</span>
                    )}
                  </p>
                </div>
                {alreadyDone && (
                  <span className={UI.badgeEmerald}>
                    <CheckCircle size={12} /> Complete
                  </span>
                )}
              </div>

              {!alreadyDone && (
                <div className="grid grid-cols-2 gap-3">
                  {/* FIX #10: Pre-generated Lot ID shown and editable */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      <Hash size={11} className="inline mr-1" />Kernel Lot ID
                      <span className="text-gray-600 font-normal ml-1">(auto-generated — edit if needed)</span>
                    </label>
                    <input
                      value={l.lotId}
                      onChange={e => updateLine(idx, 'lotId', e.target.value)}
                      className={UI.input}
                    />
                  </div>

                  {/* FIX #4: Supplier lot/batch number for food recall traceability */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Supplier Lot / Batch #
                      <span className="text-rose-400 ml-0.5">*</span>
                    </label>
                    <input
                      value={l.supplierLotNumber}
                      onChange={e => updateLine(idx, 'supplierLotNumber', e.target.value)}
                      placeholder="e.g. GC-LOT-9921"
                      className={UI.input}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Received Qty (cases) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number" min="0" max={item.qty}
                      value={l.receivedQty}
                      onChange={e => updateLine(idx, 'receivedQty', e.target.value)}
                      className={UI.input}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      Expiry Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={l.expiryDate}
                      onChange={e => updateLine(idx, 'expiryDate', e.target.value)}
                      className={UI.input}
                    />
                    {l.slaResult && (
                      <p
                        className={`text-xs mt-1 font-medium ${
                          l.slaResult === 'pass'
                            ? 'text-emerald-400'
                            : l.slaResult === 'fail'
                            ? 'text-rose-400'
                            : 'text-cyan-500'
                        }`}
                      >
                        {l.slaResult === 'pass'
                          ? `✓ Meets ${item.minShelfLifeDays}-day min shelf life`
                          : l.slaResult === 'fail'
                          ? `✗ Fails ${item.minShelfLifeDays}-day min shelf life`
                          : '✗ Product is already expired'}
                      </p>
                    )}
                  </div>

                  {/* FIX #5: Receiving temperature — mandatory for cold chain audit trail */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                      <Thermometer size={11} className="inline mr-1" />
                      Received Temp (°F) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number" step="0.1"
                      value={l.receivedTempF}
                      onChange={e => updateLine(idx, 'receivedTempF', e.target.value)}
                      placeholder={threshold !== null ? `Max ${threshold}°F` : 'Ambient'}
                      className={`${UI.input} ${tempOver ? 'border-rose-500 focus:border-rose-400' : ''}`}
                    />
                    {tempOver && (
                      <p className="text-rose-400 text-xs mt-1">
                        ⚠ Exceeds {item.tempCategory} threshold ({threshold}°F) — QC hold required
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {submitError && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
            <AlertTriangle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-rose-400 text-sm">{submitError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className={UI.btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} className={UI.btnPrimary}>
            <CheckCircle size={15} /> Confirm Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── LandedCostsModal ─────────────────────────────────────────────────────────
const LandedCostsModal = ({ po, onClose, onSave }) => {
  const [freight, setFreight] = useState(String(po.freightCost || 0));
  const [surcharges, setSurcharges] = useState(String(po.surcharges || 0));
  const [taxes, setTaxes] = useState(String(po.taxes || 0));

  const baseTotal = po.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const totalExtra = (Number(freight) || 0) + (Number(surcharges) || 0) + (Number(taxes) || 0);

  const allocations = po.items.map(item => {
    const lineTotal = item.qty * item.unitCost;
    const ratio = baseTotal > 0 ? lineTotal / baseTotal : 0;
    const extraPerUnit = item.qty > 0 ? (totalExtra * ratio) / item.qty : 0;
    return {
      ...item,
      allocationAmt: totalExtra * ratio,
      landedUnitCost: item.unitCost + extraPerUnit,
    };
  });

  const handleSave = () =>
    onSave(po.poNumber, {
      freightCost: Number(freight) || 0,
      surcharges: Number(surcharges) || 0,
      taxes: Number(taxes) || 0,
      items: allocations.map(a => ({ sku: a.sku, landedUnitCost: a.landedUnitCost })),
    });

  return (
    <Modal isOpen={true} title={`Landed Costs — ${po.poNumber}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Freight / Shipping', value: freight, set: setFreight },
            { label: 'Surcharges / Fuel', value: surcharges, set: setSurcharges },
            { label: 'Taxes / Duties', value: taxes, set: setTaxes },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
              <input
                type="number" min="0" step="0.01"
                value={value}
                onChange={e => set(e.target.value)}
                className={UI.input}
              />
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">Allocation by Line Value (proportional)</p>
          <div className="rounded-lg overflow-hidden border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60">
                <tr>
                  {['SKU', 'Description', 'Line Total', 'Allocation', 'Landed / Unit'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allocations.map((a, i) => (
                  <tr key={a.sku} className={`border-t border-gray-700 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{a.sku}</td>
                    <td className="px-3 py-2.5 text-gray-300 text-xs">{a.description}</td>
                    <td className="px-3 py-2.5 text-gray-200">{formatCurrency(a.qty * a.unitCost)}</td>
                    <td className="px-3 py-2.5 text-cyan-500">{formatCurrency(a.allocationAmt)}</td>
                    <td className="px-3 py-2.5 text-emerald-400 font-semibold">{formatCurrency(a.landedUnitCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-500">Total additional cost</span>
            <span className="font-bold text-cyan-500">{formatCurrency(totalExtra)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={UI.btnSecondary}>Cancel</button>
          <button onClick={handleSave} className={UI.btnPrimary}>
            <DollarSign size={15} /> Save Landed Costs
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── RTVModal ─────────────────────────────────────────────────────────────────
const RTVModal = ({ po, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  // FIX #7: Initialize line unitCost with landedUnitCost when available so credit is correct
  const [lines, setLines] = useState(
    po.items.map(item => ({
      sku: item.sku,
      description: item.description,
      selected: false,
      qtyReturn: '',
      effectiveCost: item.landedUnitCost || item.unitCost,
      rawUnitCost: item.unitCost,
      landedUnitCost: item.landedUnitCost,
    }))
  );

  const updateLine = (idx, field, value) =>
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));

  const selectedLines = lines.filter(l => l.selected);
  // FIX #7: totalCredit calculated from effectiveCost (landed when available)
  const totalCredit = selectedLines.reduce(
    (sum, l) => sum + (Number(l.qtyReturn) || 0) * l.effectiveCost,
    0
  );

  const handleSubmit = () => {
    if (!reason.trim()) { alert('Please enter a return reason.'); return; }
    if (selectedLines.length === 0) { alert('Select at least one line item to return.'); return; }
    for (const l of selectedLines) {
      if (!l.qtyReturn || Number(l.qtyReturn) <= 0) {
        alert(`Enter a return quantity for ${l.sku}.`); return;
      }
    }

    onSubmit({
      rtvId: generateId('RTV'),
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      poNumber: po.poNumber,
      createdDate: new Date().toISOString().slice(0, 10),
      status: 'Pending Authorization',
      reason,
      items: selectedLines.map(l => ({
        sku: l.sku,
        description: l.description,
        qtyReturned: Number(l.qtyReturn),
        unitCost: l.rawUnitCost,
        landedUnitCost: l.landedUnitCost,
        // FIX #7: credit uses landed cost when available
        creditAmount: (Number(l.qtyReturn) || 0) * l.effectiveCost,
      })),
      authorizationCode: null,
    });
  };

  return (
    <Modal isOpen={true} title={`Return to Vendor — ${po.poNumber}`} onClose={onClose} wide>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Return Reason *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Temperature excursion at receiving, product rejected by QC…"
            className={UI.input}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 mb-1">Select Line Items to Return</p>
          {lines.map((l, idx) => (
            <div
              key={l.sku}
              className={`border rounded-lg p-3 transition-colors ${
                l.selected ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-gray-700 bg-gray-800/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={l.selected}
                  onChange={e => updateLine(idx, 'selected', e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{l.description}</p>
                  <p className="text-xs text-gray-500">
                    {l.sku} · Cost: {formatCurrency(l.rawUnitCost)}
                    {l.landedUnitCost ? ` · Landed: ${formatCurrency(l.landedUnitCost)}` : ''}
                  </p>
                </div>
                {l.selected && (
                  <div className="w-28 flex-shrink-0">
                    <input
                      type="number" min="1"
                      value={l.qtyReturn}
                      onChange={e => updateLine(idx, 'qtyReturn', e.target.value)}
                      placeholder="Qty"
                      className={`${UI.input} py-1.5 text-sm`}
                    />
                  </div>
                )}
              </div>
              {l.selected && l.landedUnitCost && (
                <p className="text-xs text-cyan-500 mt-2 ml-7">
                  Credit calculated at landed cost: {formatCurrency(l.effectiveCost)}/unit
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-gray-800/60 rounded-lg p-4 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            Estimated Credit ({selectedLines.length} line{selectedLines.length !== 1 ? 's' : ''})
          </span>
          <span className="text-xl font-bold text-emerald-400">{formatCurrency(totalCredit)}</span>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={UI.btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} className={UI.btnPrimary}>
            <RotateCcw size={15} /> Submit RTV
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── PO Document Modal ────────────────────────────────────────────────────────
const PODocumentModal = ({ po, vendor, onClose, onSend }) => {
  const handlePrint = () => window.print();
  const subtotal = po.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const freight  = po.freightCost || 0;
  const taxes    = po.taxes       || 0;
  const total    = subtotal + freight + taxes;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-6 overflow-y-auto">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl my-4">

        {/* Modal action bar (not printed) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-600" /> Purchase Order — {po.poNumber}
          </h2>
          <div className="flex items-center gap-2">
            {po.status === 'Draft' && (
              <button onClick={() => { onSend(po.poNumber); onClose(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors">
                <Send size={14} /> Send to Vendor
              </button>
            )}
            <button onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors">
              <Printer size={14} /> Print / PDF
            </button>
            <button onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Document body */}
        <div className="p-8 space-y-6">

          {/* Header row: buyer info + PO meta */}
          <div className="flex justify-between items-start">
            {/* Buyer */}
            <div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{COMPANY_INFO.name}</p>
              <p className="text-sm text-gray-600 mt-1">{COMPANY_INFO.address}</p>
              <p className="text-sm text-gray-600">{COMPANY_INFO.city}</p>
              <p className="text-sm text-gray-600">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
              <p className="text-xs text-gray-400 mt-1">Tax ID: {COMPANY_INFO.taxId}</p>
            </div>
            {/* PO Meta box */}
            <div className="border-2 border-gray-900 rounded-xl p-4 text-right min-w-[220px]">
              <p className="text-xl font-black text-gray-900 mb-3">PURCHASE ORDER</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500 font-medium">PO Number</span>
                  <span className="font-bold">{po.poNumber}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500 font-medium">Order Date</span>
                  <span className="font-bold">{formatDate(po.createdDate)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500 font-medium">Req. Delivery</span>
                  <span className="font-bold text-cyan-700">{formatDate(po.expectedDelivery)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500 font-medium">Status</span>
                  <span className="font-bold">{po.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-900" />

          {/* Vendor block */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Vendor / Ship From</p>
              <p className="font-bold text-gray-900 text-lg">{po.vendorName}</p>
              {vendor && (
                <>
                  <p className="text-sm text-gray-600">Attn: {vendor.contact}</p>
                  <p className="text-sm text-gray-600">{vendor.email}</p>
                  <p className="text-sm text-gray-600">{vendor.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">Terms: {vendor.paymentTerms} · Lead: {vendor.leadTimeDays}d</p>
                </>
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Ship To / Bill To</p>
              <p className="font-bold text-gray-900 text-lg">{COMPANY_INFO.name}</p>
              <p className="text-sm text-gray-600">{COMPANY_INFO.address}</p>
              <p className="text-sm text-gray-600">{COMPANY_INFO.city}</p>
              <p className="text-sm text-gray-600">{COMPANY_INFO.phone}</p>
              {po.notes && <p className="text-xs text-gray-500 italic mt-1">Note: {po.notes}</p>}
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">#</th>
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">Vendor Code</th>
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">Internal SKU</th>
                <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wider">Description</th>
                <th className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wider">UOM</th>
                <th className="px-3 py-2 text-right font-bold text-xs uppercase tracking-wider">Qty</th>
                <th className="px-3 py-2 text-right font-bold text-xs uppercase tracking-wider">Unit Price</th>
                <th className="px-3 py-2 text-right font-bold text-xs uppercase tracking-wider">Extended</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">{i + 1}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-cyan-700 text-xs">{item.vendorProductCode || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-600 text-xs">{item.sku}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{item.description}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 text-xs uppercase">{item.uom || 'ea'}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-gray-900">{item.qty}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{formatCurrency(item.unitCost)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-gray-900">{formatCurrency(item.qty * item.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {freight > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Freight</span>
                  <span className="font-medium">{formatCurrency(freight)}</span>
                </div>
              )}
              {taxes > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-medium">{formatCurrency(taxes)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-black text-base border-t-2 border-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 space-y-1">
            <p>This purchase order constitutes a binding agreement subject to the terms and conditions of {COMPANY_INFO.name}.</p>
            <p>Please reference PO Number <strong className="text-gray-600">{po.poNumber}</strong> on all invoices, packing slips, and correspondence.</p>
            <p>Questions? Contact {COMPANY_INFO.email} · {COMPANY_INFO.phone}</p>
          </div>

          {/* Signature line */}
          <div className="grid grid-cols-2 gap-16 pt-4">
            <div>
              <div className="border-b-2 border-gray-900 mb-1 h-8" />
              <p className="text-xs text-gray-500">Authorized Buyer Signature &amp; Date</p>
            </div>
            <div>
              <div className="border-b-2 border-gray-900 mb-1 h-8" />
              <p className="text-xs text-gray-500">Vendor Acknowledgment &amp; Date</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Vendor Rebate Data ───────────────────────────────────────────────────────
const INIT_REBATE_AGREEMENTS = [
  {
    id: 'RBA-001', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    type: 'Volume Rebate', sku: 'FRZ-BEEF-01', skuName: 'Ground Beef 80/20',
    description: 'Earn $1.20/case on Ground Beef purchases exceeding 500 cases in Q2 2026.',
    period: 'Q2 2026', startDate: '2026-04-01', endDate: '2026-06-30',
    thresholdQty: 500, thresholdSpend: null, rateType: 'per_unit', rateValue: 1.20,
    currentQty: 423, currentSpend: 36166.50, status: 'Active',
  },
  {
    id: 'RBA-002', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    type: 'Bill-Back', sku: null, skuName: 'All Proteins',
    description: '2% bill-back on total spend exceeding $50,000 in Q2 2026.',
    period: 'Q2 2026', startDate: '2026-04-01', endDate: '2026-06-30',
    thresholdQty: null, thresholdSpend: 50000, rateType: 'pct', rateValue: 2.0,
    currentQty: null, currentSpend: 43820.00, status: 'Active',
  },
  {
    id: 'RBA-003', vendorId: 'V-002', vendorName: 'Sunshine Produce Co.',
    type: 'Promotional Allowance', sku: 'PRO-TOMA-01', skuName: 'Roma Tomatoes',
    description: '$0.80/case promotional allowance on Roma Tomatoes during the May–June produce push.',
    period: 'May–Jun 2026', startDate: '2026-05-01', endDate: '2026-06-30',
    thresholdQty: 0, thresholdSpend: null, rateType: 'per_unit', rateValue: 0.80,
    currentQty: 214, currentSpend: 5136.00, status: 'Active',
  },
  {
    id: 'RBA-004', vendorId: 'V-003', vendorName: 'Dairy Fresh Distributors',
    type: 'Volume Rebate', sku: 'DAI-MILK-02', skuName: 'Whole Milk 1 Gal',
    description: 'Earn $0.45/case on Whole Milk purchases exceeding 800 cases in Q2 2026.',
    period: 'Q2 2026', startDate: '2026-04-01', endDate: '2026-06-30',
    thresholdQty: 800, thresholdSpend: null, rateType: 'per_unit', rateValue: 0.45,
    currentQty: 672, currentSpend: 12096.00, status: 'Active',
  },
  {
    id: 'RBA-005', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    type: 'Bill-Back', sku: null, skuName: 'All Proteins',
    description: '1.5% bill-back on total spend exceeding $30,000 in Q1 2026.',
    period: 'Q1 2026', startDate: '2026-01-01', endDate: '2026-03-31',
    thresholdQty: null, thresholdSpend: 30000, rateType: 'pct', rateValue: 1.5,
    currentQty: null, currentSpend: 52167.00, status: 'Closed',
    earnedAmount: 782.51,
  },
  {
    id: 'RBA-006', vendorId: 'V-004', vendorName: 'Metro Dry Goods',
    type: 'Volume Rebate', sku: 'DRY-RICE-05', skuName: 'Jasmine Rice 50lb',
    description: 'Earn $8.00/pallet on Jasmine Rice purchases exceeding 50 pallets in Q3 2026.',
    period: 'Q3 2026', startDate: '2026-07-01', endDate: '2026-09-30',
    thresholdQty: 50, thresholdSpend: null, rateType: 'per_unit', rateValue: 8.00,
    currentQty: 0, currentSpend: 0, status: 'Upcoming',
  },
];

const INIT_REBATE_CLAIMS = [
  {
    id: 'RCL-001', agreementId: 'RBA-005', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    period: 'Q1 2026', amount: 782.51, status: 'Paid',
    submittedDate: '2026-04-05', paidDate: '2026-05-02',
    notes: 'Q1 bill-back claim — threshold exceeded by $22,167.',
  },
  {
    id: 'RCL-002', agreementId: 'RBA-003', vendorId: 'V-002', vendorName: 'Sunshine Produce Co.',
    period: 'May–Jun 2026 (partial)', amount: 171.20, status: 'Submitted',
    submittedDate: '2026-05-20', paidDate: null,
    notes: 'Mid-period claim on Roma Tomato promo allowance — 214 cases @ $0.80.',
  },
  {
    id: 'RCL-003', agreementId: 'RBA-001', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    period: 'Q2 2026 (accrual)', amount: 507.60, status: 'Draft',
    submittedDate: null, paidDate: null,
    notes: 'Draft — threshold not yet reached. Accrued on 423 cases. Submit when 500 reached.',
  },
  {
    id: 'RCL-004', agreementId: 'RBA-002', vendorId: 'V-001', vendorName: 'Gulf Coast Proteins',
    period: 'Q2 2026 (accrual)', amount: 876.40, status: 'Draft',
    submittedDate: null, paidDate: null,
    notes: 'Draft — spend threshold not yet reached. Accrued on $43,820 spend.',
  },
];

// ─── Rebates Tab Component ─────────────────────────────────────────────────────
function RebatesTab({ rebateAgreements, setRebateAgreements, rebateClaims, setRebateClaims }) {
  const [subTab, setSubTab]     = useState('agreements');
  const [agrFilter, setAgrFilter] = useState('active');
  const [selectedAgr, setSelectedAgr] = useState('RBA-001');
  const [claimFilter, setClaimFilter] = useState('all');
  const [toast, setToast]       = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const CLAIM_STATUS_META = {
    'Draft':     { color: 'text-gray-300',    bg: 'bg-gray-700/40',    border: 'border-gray-600/40' },
    'Submitted': { color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
    'Approved':  { color: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30' },
    'Paid':      { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  };

  const TYPE_META = {
    'Volume Rebate':          { color: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
    'Bill-Back':              { color: 'text-cyan-300',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30'   },
    'Promotional Allowance':  { color: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
  };

  const AGR_FILTER_OPTS = ['active', 'upcoming', 'closed', 'all'];

  const filteredAgrs = rebateAgreements.filter(a => {
    if (agrFilter === 'all') return true;
    return a.status.toLowerCase() === agrFilter;
  });

  const filteredClaims = claimFilter === 'all'
    ? rebateClaims
    : rebateClaims.filter(c => c.status === claimFilter);

  // Compute accrued value for an agreement
  const accrued = agr => {
    if (agr.rateType === 'per_unit') return agr.currentQty * agr.rateValue;
    if (agr.rateType === 'pct')      return agr.currentSpend * (agr.rateValue / 100);
    return 0;
  };

  const thresholdPct = agr => {
    if (agr.thresholdQty)   return Math.min(100, Math.round((agr.currentQty  / agr.thresholdQty)   * 100));
    if (agr.thresholdSpend) return Math.min(100, Math.round((agr.currentSpend / agr.thresholdSpend) * 100));
    return 100; // promo allowance — always earning
  };

  const thresholdMet = agr => thresholdPct(agr) >= 100;

  // KPIs
  const activeAgrs    = rebateAgreements.filter(a => a.status === 'Active');
  const totalAccrued  = activeAgrs.reduce((s, a) => s + accrued(a), 0);
  const paidYTD       = rebateClaims.filter(c => c.status === 'Paid').reduce((s, c) => s + c.amount, 0);
  const pendingClaims = rebateClaims.filter(c => c.status === 'Submitted').length;

  const handleGenerateClaim = agrId => {
    const agr = rebateAgreements.find(a => a.id === agrId);
    if (!agr) return;
    const existing = rebateClaims.find(c => c.agreementId === agrId && c.status === 'Draft');
    if (existing) { showToast(`Draft claim ${existing.id} already exists for ${agr.id}`); return; }
    const amt = accrued(agr);
    const nextId = `RCL-00${rebateClaims.length + 1}`;
    setRebateClaims(prev => [...prev, {
      id: nextId, agreementId: agr.id, vendorId: agr.vendorId, vendorName: agr.vendorName,
      period: agr.period, amount: parseFloat(amt.toFixed(2)), status: 'Draft',
      submittedDate: null, paidDate: null,
      notes: `Auto-generated claim — ${agr.type} on ${agr.skuName}. Accrued: $${amt.toFixed(2)}.`,
    }]);
    showToast(`${nextId} created as Draft claim for ${agr.id}`);
    setSubTab('claims');
  };

  const handleSubmitClaim = claimId => {
    setRebateClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'Submitted', submittedDate: '2026-05-27' } : c));
    showToast(`${claimId} submitted to vendor`);
  };

  const handleMarkPaid = claimId => {
    setRebateClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'Paid', paidDate: '2026-05-27' } : c));
    showToast(`${claimId} marked as Paid`);
  };

  const fmt = (n, decimals = 2) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl shadow-xl backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-300 font-medium">{toast}</span>
        </div>
      )}

      {/* Intro banner */}
      <div className="flex items-start gap-3 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
        <BadgeDollarSign className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-violet-300">Vendor Rebate Management</h3>
          <p className="text-xs text-gray-400 mt-0.5">Track volume rebates, bill-backs, and promotional allowances from your vendor agreements. Generate and submit claims when thresholds are met.</p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Agreements', value: activeAgrs.length,          sub: `of ${rebateAgreements.length} total`,     color: 'text-violet-400',  Icon: Receipt        },
          { label: 'Accrued This Period', value: `$${fmt(totalAccrued)}`,  sub: 'across active agreements',                color: 'text-amber-400',   Icon: TrendingUp     },
          { label: 'Pending Claims',    value: pendingClaims,              sub: 'submitted, awaiting payment',             color: 'text-cyan-400',    Icon: Target         },
          { label: 'Paid YTD',          value: `$${fmt(paidYTD)}`,         sub: 'received from vendors',                   color: 'text-emerald-400', Icon: BadgeDollarSign },
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

      {/* Sub-tab switcher */}
      <div className="flex gap-1 border-b border-gray-800 pb-0">
        {[['agreements','Agreements'], ['claims','Claims']].map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
              subTab === id
                ? 'border-violet-500 text-violet-300 bg-violet-500/10'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {label}
            {id === 'claims' && rebateClaims.filter(c => c.status === 'Draft').length > 0 && (
              <span className="ml-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {rebateClaims.filter(c => c.status === 'Draft').length} draft
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── AGREEMENTS SUB-TAB ─────────────────────────────────────────────── */}
      {subTab === 'agreements' && (
        <div className="space-y-3">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {AGR_FILTER_OPTS.map(f => (
              <button key={f} onClick={() => setAgrFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  agrFilter === f
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-gray-300'
                }`}>
                {f === 'all' ? `All (${rebateAgreements.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${rebateAgreements.filter(a => a.status.toLowerCase() === f).length})`}
              </button>
            ))}
          </div>

          {/* Agreement cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAgrs.map(agr => {
              const tm = TYPE_META[agr.type] ?? TYPE_META['Volume Rebate'];
              const pct = thresholdPct(agr);
              const met = thresholdMet(agr);
              const acc = accrued(agr);
              const isPromo = agr.type === 'Promotional Allowance';
              const hasDraft = rebateClaims.some(c => c.agreementId === agr.id && c.status === 'Draft');
              return (
                <div key={agr.id}
                  className={`bg-gray-800/40 border rounded-xl p-4 space-y-3 transition-all ${
                    selectedAgr === agr.id ? 'border-violet-500/50' : 'border-gray-700/50'
                  }`}
                  onClick={() => setSelectedAgr(agr.id)}>

                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">{agr.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tm.bg} ${tm.color} ${tm.border}`}>{agr.type}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-100">{agr.vendorName}</div>
                      <div className="text-xs text-gray-400">{agr.skuName} · {agr.period}</div>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                      agr.status === 'Active'   ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                      agr.status === 'Upcoming' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                                                  'bg-gray-700/50 text-gray-400 border-gray-600/40'
                    }`}>{agr.status}</div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed">{agr.description}</p>

                  {/* Progress bar (only for active non-upcoming) */}
                  {agr.status === 'Active' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {agr.thresholdQty
                            ? `${agr.currentQty.toLocaleString()} / ${agr.thresholdQty.toLocaleString()} cases`
                            : agr.thresholdSpend
                            ? `$${fmt(agr.currentSpend, 0)} / $${fmt(agr.thresholdSpend, 0)} spend`
                            : `${agr.currentQty.toLocaleString()} cases purchased`
                          }
                        </span>
                        <span className={`text-xs font-bold ${met || isPromo ? 'text-emerald-400' : pct >= 80 ? 'text-amber-400' : 'text-gray-400'}`}>
                          {isPromo ? 'Earning' : met ? '✓ Threshold Met' : `${pct}%`}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          met || isPromo ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-violet-500'
                        }`} style={{ width: `${isPromo ? 100 : pct}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Accrual row */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-700/40">
                    <div>
                      <div className="text-xs text-gray-600">
                        {agr.rateType === 'per_unit' ? `$${agr.rateValue}/unit` : `${agr.rateValue}% of spend`}
                      </div>
                      <div className={`text-sm font-bold ${agr.status === 'Active' ? 'text-amber-300' : 'text-gray-400'}`}>
                        {agr.status === 'Closed' ? `Earned: $${fmt(agr.earnedAmount ?? 0)}` : `Accrued: $${fmt(acc)}`}
                      </div>
                    </div>
                    {agr.status === 'Active' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleGenerateClaim(agr.id); }}
                        disabled={hasDraft}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <FileText className="w-3 h-3" />
                        {hasDraft ? 'Draft Exists' : 'Generate Claim'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CLAIMS SUB-TAB ────────────────────────────────────────────────── */}
      {subTab === 'claims' && (
        <div className="space-y-3">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'Draft', 'Submitted', 'Approved', 'Paid'].map(f => (
              <button key={f} onClick={() => setClaimFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  claimFilter === f
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-gray-300'
                }`}>
                {f === 'all' ? `All (${rebateClaims.length})` : `${f} (${rebateClaims.filter(c => c.status === f).length})`}
              </button>
            ))}
          </div>

          {/* Claims table */}
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700/60">
                  {['Claim ID', 'Agreement', 'Vendor', 'Period', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim, i) => {
                  const sm = CLAIM_STATUS_META[claim.status] ?? CLAIM_STATUS_META['Draft'];
                  return (
                    <tr key={claim.id} className={`border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                      <td className="px-4 py-3 font-mono font-bold text-gray-200">{claim.id}</td>
                      <td className="px-4 py-3 text-violet-300 font-semibold">{claim.agreementId}</td>
                      <td className="px-4 py-3 text-gray-300">{claim.vendorName}</td>
                      <td className="px-4 py-3 text-gray-400">{claim.period}</td>
                      <td className="px-4 py-3 font-bold text-amber-300">${fmt(claim.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sm.bg} ${sm.color} ${sm.border}`}>{claim.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {claim.status === 'Draft' && (
                            <button onClick={() => handleSubmitClaim(claim.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-semibold transition-all">
                              <Send className="w-3 h-3" /> Submit
                            </button>
                          )}
                          {claim.status === 'Submitted' && (
                            <button onClick={() => handleMarkPaid(claim.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold transition-all">
                              <CheckCircle className="w-3 h-3" /> Mark Paid
                            </button>
                          )}
                          {(claim.status === 'Approved' || claim.status === 'Paid') && (
                            <span className="text-gray-600 text-[11px] italic">
                              {claim.status === 'Paid' ? `Paid ${claim.paidDate}` : 'Awaiting payment'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredClaims.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">No claims match this filter.</div>
            )}
          </div>

          {/* Totals footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-xs">
            <span className="text-gray-500">{filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} shown</span>
            <div className="flex items-center gap-6">
              <span className="text-gray-400">Total shown: <span className="text-amber-300 font-bold">${fmt(filteredClaims.reduce((s, c) => s + c.amount, 0))}</span></span>
              <span className="text-gray-400">Paid YTD: <span className="text-emerald-300 font-bold">${fmt(paidYTD)}</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export default function ProcurementModule() {
  const {
    draftReorderPOs, removeDraftReorderPO,
    requiresApproval, submitApprovalRequest, approvalRequests,
    quickCreateAction, clearQuickCreateAction,
    logAudit, activeUser, can,
    activeLocation, settings,
  } = useKernal();
  // Full write access: admin, manager, or warehouse (view users can see but not mutate)
  const canWriteProcurement = can('procurement') === 'full';
  const vendorRebatesEnabled = settings.features?.vendorRebates !== false;
  const [activeTab, setActiveTab] = useState('dashboard');

  // Quick Create: jump to PO Builder when "New PO" is fired from sidebar
  useEffect(() => {
    if (quickCreateAction === 'new-po') {
      setActiveTab('builder');
      clearQuickCreateAction();
    }
  }, [quickCreateAction, clearQuickCreateAction]);
  const [purchaseOrders, setPurchaseOrders] = useState(DEMO_MODE ? INITIAL_POS : []);
  const [vendors,        setVendors]        = useState(DEMO_MODE ? INITIAL_VENDORS : []);
  const [apiToast,       setApiToast]       = useState(null);
  const showApiToast = (msg) => { setApiToast(msg); setTimeout(() => setApiToast(null), 4000); };

  // ── Lookup backend UUID by po_number (set by API on create) ───────────────
  // Each PO in live mode has a `_id` field holding the backend UUID.
  const poApiId = (poNumber) =>
    purchaseOrders.find(p => p.poNumber === poNumber)?._id || null;

  // ── Map backend vendor row → local vendor shape ───────────────────────────
  const mapApiVendor = (row) => ({
    _id:             row.id,
    vendorId:        row.id,          // use UUID as vendorId in live mode
    name:            row.name || '',
    category:        row.category || '',
    contact:         row.contact_name || '',
    email:           row.email || '',
    phone:           row.phone || '',
    leadTimeDays:    Number(row.lead_time_days) || 3,
    paymentTerms:    row.payment_terms || 'Net-30',
    rating:          Number(row.rating) || 0,
    preferredVendor: !!row.preferred_vendor,
    activeStatus:    row.is_active ? 'Active' : 'Inactive',
    notes:           row.notes || '',
  });

  // ── Map backend PO row → local PO shape ──────────────────────────────────
  const mapApiPO = (row) => ({
    _id:              row.id,           // backend UUID — for API calls
    poNumber:         row.po_number,
    vendorId:         row.vendor_id || '',
    vendorName:       row.vendor_name || '',
    locationId:       row.location_id || '',
    status:           row.status || 'Draft',
    createdDate:      row.created_date || row.created_at?.split('T')[0] || TODAY,
    expectedDelivery: row.expected_delivery || null,
    receivedDate:     row.received_date || null,
    freightCost:      Number(row.freight_cost) || 0,
    surcharges:       Number(row.surcharges) || 0,
    taxes:            Number(row.taxes) || 0,
    notes:            row.notes || '',
    items: (row.po_line_items || []).map(li => ({
      _lineId:          li.id,
      sku:              li.sku || '',
      vendorProductCode: li.vendor_product_code || '',
      description:      li.description || '',
      uom:              li.uom || 'case',
      qty:              Number(li.qty) || 0,
      receivedQty:      Number(li.received_qty) || 0,
      unitCost:         Number(li.unit_cost) || 0,
      landedUnitCost:   li.landed_unit_cost ? Number(li.landed_unit_cost) : null,
      tempCategory:     li.temp_category || 'dry',
      isCatchWeight:    !!li.is_catch_weight,
      minShelfLifeDays: Number(li.min_shelf_life_days) || 0,
    })),
  });

  // ── Seed vendors and POs from API on mount (live mode only) ──────────────
  useEffect(() => {
    if (DEMO_MODE) return;
    api.procurement.vendors.list({ limit: 200 })
      .then(r => setVendors((r.data || []).map(mapApiVendor)))
      .catch(() => {});
    api.procurement.purchaseOrders.list({ limit: 200 })
      .then(r => setPurchaseOrders((r.data || []).map(mapApiPO)))
      .catch(() => {});
  }, []);
  const [aiUpdates, setAiUpdates] = useState(DEMO_MODE ? INITIAL_AI_UPDATES : []);
  const [rtvs, setRtvs] = useState(DEMO_MODE ? INITIAL_RTVS : []);
  const [rebateAgreements, setRebateAgreements] = useState(DEMO_MODE ? INIT_REBATE_AGREEMENTS : []);
  const [rebateClaims, setRebateClaims]         = useState(DEMO_MODE ? INIT_REBATE_CLAIMS : []);

  // Modal targets
  const [receivingTarget, setReceivingTarget] = useState(null);
  const [landedCostsTarget, setLandedCostsTarget] = useState(null);
  const [rtvTarget, setRtvTarget] = useState(null);
  const [showManualReq, setShowManualReq] = useState(false);

  // PO list controls
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('All');
  const [poPage, setPoPage] = useState(0);

  // Vendor search + scorecard expand
  const [vendorSearch,       setVendorSearch]       = useState('');
  const [expandedScorecard,  setExpandedScorecard]  = useState(null);

  // ── PO Builder state ────────────────────────────────────────────────────────
  const [builderVendorId,    setBuilderVendorId]    = useState(null);
  const [builderCart,        setBuilderCart]        = useState([]);   // [{catalogItem, qty}]
  const [builderSearch,      setBuilderSearch]      = useState('');
  const [builderDelivery,    setBuilderDelivery]    = useState('');
  const [builderNotes,       setBuilderNotes]       = useState('');
  const [builderFreight,     setBuilderFreight]     = useState('');
  const [showPODoc,          setShowPODoc]          = useState(false);
  const [poDocTarget,        setPoDocTarget]        = useState(null);
  const [poAttachmentsOpen,  setPoAttachmentsOpen]  = useState(null); // poNumber or null
  const [poHistoryOpen,      setPoHistoryOpen]      = useState(null); // poNumber or null

  // ── AI Agent handlers ──────────────────────────────────────────────────────

  // FIX #1: handleRejectAiUpdate was entirely missing — caused ReferenceError crash
  // on "Discard" and "Keep Cancelled" buttons. Now defined correctly.
  const handleRejectAiUpdate = useCallback(
    id => setAiUpdates(prev => prev.filter(u => u.id !== id)),
    []
  );

  const handleAcceptAiUpdate = useCallback(
    update => {
      if (update.type === 'REROUTE') {
        setPurchaseOrders(prev =>
          prev.map(po => {
            if (po.poNumber !== update.poNumber) return po;
            return {
              ...po,
              vendorId: update.suggestedVendorId,
              vendorName: update.suggestedVendorName,
              items: po.items.map(item => {
                if (item.sku !== update.affectedSku) return item;
                return {
                  ...item,
                  unitCost: update.suggestedUnitCost,
                  landedUnitCost: null,
                  // FIX #6: spread preserves existing minShelfLifeDays — not dropped on reroute
                };
              }),
            };
          })
        );
        setAiUpdates(prev => prev.filter(u => u.id !== update.id));
      }

      if (update.type === 'PRICE_CHANGE') {
        setPurchaseOrders(prev =>
          prev.map(po => {
            if (po.poNumber !== update.poNumber) return po;
            return {
              ...po,
              items: po.items.map(item =>
                item.sku === update.affectedSku
                  ? { ...item, unitCost: update.suggestedUnitCost, landedUnitCost: null }
                  : item
              ),
            };
          })
        );
        setAiUpdates(prev => prev.filter(u => u.id !== update.id));
      }

      if (update.type === 'AUTO_REORDER') {
        const vendor = vendors.find(v => v.vendorId === update.suggestedVendorId);
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + (vendor?.leadTimeDays || 3));

        const newPO = {
          poNumber: generateId('PO'),
          vendorId: update.suggestedVendorId,
          vendorName: update.suggestedVendorName || vendor?.name || 'Unknown',
          status: 'Draft',
          createdDate: new Date().toISOString().slice(0, 10),
          expectedDelivery: deliveryDate.toISOString().slice(0, 10),
          freightCost: 0, surcharges: 0, taxes: 0,
          items: [{
            sku: update.affectedSku,
            description: update.skuDescription || update.affectedSku,
            qty: update.suggestedQty,
            unitCost: update.suggestedUnitCost || 0,
            landedUnitCost: null,
            // FIX #6: minShelfLifeDays from update context — not undefined/missing
            minShelfLifeDays: update.minShelfLifeDays || 7,
            isCatchWeight: false,
            tempCategory: 'refrigerated',
            receivedQty: 0,
          }],
        };

        // FIX #2: Functional updater prevents stale closure — no captured snapshot of state
        setPurchaseOrders(prev => [newPO, ...prev]);
        setAiUpdates(prev => prev.filter(u => u.id !== update.id));
      }
    },
    [vendors]
  );

  // ── PO handlers ───────────────────────────────────────────────────────────

  const handleUpdateStatus = useCallback(
    (poNumber, newStatus) => {
      setPurchaseOrders(prev => {
        const old = prev.find(po => po.poNumber === poNumber);
        if (old) {
          logAudit({
            moduleId: 'procurement',
            action: `po.${newStatus.toLowerCase().replace(/\s+/g, '.')}`,
            entityType: 'purchase_order',
            entityId: poNumber,
            summary: `PO ${poNumber} status changed: ${old.status} → ${newStatus}`,
            before: { status: old.status },
            after:  { status: newStatus },
            severity: newStatus === 'Cancelled' ? 'warning' : 'info',
          });
        }
        return prev.map(po => (po.poNumber === poNumber ? { ...po, status: newStatus } : po));
      });
      if (!DEMO_MODE) {
        const id = poApiId(poNumber);
        if (id) api.procurement.purchaseOrders.updateStatus(id, newStatus)
          .catch(err => showApiToast(`Status sync failed: ${err.message}`));
      }
    },
    [logAudit, purchaseOrders]
  );

  // ── Approval routing ─────────────────────────────────────────────────────
  // When Approve is pressed on a Draft PO, check the threshold first. If the
  // PO requires approval, submit a request and park the PO at 'Pending Approval'.
  // Otherwise advance to 'Approved' directly.
  const poTotal = (po) => {
    const items = po.items || [];
    return items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0) + (Number(po.freightCost) || 0);
  };

  const handleApproveOrRequest = useCallback((po) => {
    const total = poTotal(po);
    if (requiresApproval('po_approval', total)) {
      const req = submitApprovalRequest({
        flowType: 'po_approval',
        title: `${po.poNumber} — ${po.vendorName} — $${total.toFixed(2)}`,
        summary: `${po.items?.length || 0} line items totaling $${total.toFixed(2)}. Awaiting approval before send.`,
        threshold: total,
        payload: {
          poNumber: po.poNumber,
          vendorName: po.vendorName,
          vendorId: po.vendorId,
          total,
          items: (po.items || []).map(i => ({ sku: i.sku, description: i.description, qty: i.qty, unitCost: i.unitCost })),
        },
      });
      logAudit({
        moduleId: 'procurement',
        action: 'po.approval.requested',
        entityType: 'purchase_order',
        entityId: po.poNumber,
        summary: `PO ${po.poNumber} routed for approval — $${total.toFixed(2)} (${po.vendorName})`,
        before: { status: po.status },
        after:  { status: 'Pending Approval', approvalRequestId: req.id },
        severity: 'notice',
      });
      setPurchaseOrders(prev => prev.map(p =>
        p.poNumber === po.poNumber ? { ...p, status: 'Pending Approval', approvalRequestId: req.id } : p
      ));
    } else {
      handleUpdateStatus(po.poNumber, 'Approved');
    }
  }, [requiresApproval, submitApprovalRequest, handleUpdateStatus, logAudit]);

  // Apply approval decisions back to POs. Track which decisions we've
  // already applied so the effect doesn't loop or re-apply.
  const appliedDecisionsRef = useRef(new Set());
  useEffect(() => {
    approvalRequests.forEach(req => {
      if (req.flowType !== 'po_approval') return;
      if (req.status === 'pending' || req.status === 'changes_requested') return;
      if (appliedDecisionsRef.current.has(req.id)) return;
      const poNumber = req.payload?.poNumber;
      if (!poNumber) return;
      setPurchaseOrders(prev => prev.map(po => {
        if (po.poNumber !== poNumber) return po;
        if (req.status === 'approved')  return { ...po, status: 'Approved' };
        if (req.status === 'rejected')  return { ...po, status: 'Draft', rejectionNote: req.audit?.[req.audit.length - 1]?.note || '' };
        if (req.status === 'cancelled') return { ...po, status: 'Draft' };
        return po;
      }));
      appliedDecisionsRef.current.add(req.id);
    });
  }, [approvalRequests]);

  const handleReceivingComplete = useCallback(
    (poNumber, lines) => {
      let newStatus = null;
      setPurchaseOrders(prev =>
        prev.map(po => {
          if (po.poNumber !== poNumber) return po;
          const updatedItems = po.items.map((item, idx) => {
            const l = lines[idx];
            if (!l || item.receivedQty >= item.qty) return item;
            return { ...item, receivedQty: (item.receivedQty || 0) + Number(l.receivedQty) };
          });
          const allDone = updatedItems.every(i => i.receivedQty >= i.qty);
          const anyDone = updatedItems.some(i => (i.receivedQty || 0) > 0);
          newStatus = allDone ? 'Received' : anyDone ? 'Partially Received' : po.status;
          return { ...po, items: updatedItems, status: newStatus };
        })
      );
      setReceivingTarget(null);
      if (!DEMO_MODE && newStatus) {
        const id = poApiId(poNumber);
        if (id) {
          // Update received_qty on each line item
          const po = purchaseOrders.find(p => p.poNumber === poNumber);
          if (po) {
            lines.forEach((l, idx) => {
              const item = po.items[idx];
              if (item?._lineId && l?.receivedQty) {
                api.procurement.purchaseOrders.updateLine(id, item._lineId, {
                  received_qty: (item.receivedQty || 0) + Number(l.receivedQty),
                }).catch(() => {});
              }
            });
          }
          api.procurement.purchaseOrders.updateStatus(id, newStatus)
            .catch(err => showApiToast(`Receiving sync failed: ${err.message}`));
        }
      }
    },
    [purchaseOrders]
  );

  const handleLandedCostsSave = useCallback(
    (poNumber, data) => {
      setPurchaseOrders(prev =>
        prev.map(po => {
          if (po.poNumber !== poNumber) return po;
          return {
            ...po,
            freightCost: data.freightCost,
            surcharges: data.surcharges,
            taxes: data.taxes,
            items: po.items.map(item => {
              const a = data.items.find(i => i.sku === item.sku);
              return a ? { ...item, landedUnitCost: a.landedUnitCost } : item;
            }),
          };
        })
      );
      if (!DEMO_MODE) {
        const id = poApiId(poNumber);
        if (id) api.procurement.purchaseOrders.update(id, {
          freight_cost: data.freightCost,
          surcharges:   data.surcharges,
          taxes:        data.taxes,
        }).catch(err => showApiToast(`Landed costs sync failed: ${err.message}`));
      }
      setLandedCostsTarget(null);
    },
    []
  );

  const handleRTVSubmit = useCallback(rtv => {
    setRtvs(prev => [rtv, ...prev]);
    setRtvTarget(null);
  }, []);

  const handleManualReqSubmit = useCallback(newPO => {
    // FIX #2: Functional updater — no stale closure
    setPurchaseOrders(prev => [newPO, ...prev]);
    setShowManualReq(false);
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────

  // ── PO Builder helpers ──────────────────────────────────────────────────────
  const builderVendor = INITIAL_VENDORS.find(v => v.vendorId === builderVendorId);
  const builderCatalog = VENDOR_CATALOG.filter(item =>
    item.vendorId === builderVendorId &&
    (!builderSearch || item.description.toLowerCase().includes(builderSearch.toLowerCase()) ||
     item.vendorProductCode.toLowerCase().includes(builderSearch.toLowerCase()) ||
     item.internalSku.toLowerCase().includes(builderSearch.toLowerCase()))
  );
  const cartQty = (code) => {
    const entry = builderCart.find(e => e.catalogItem.vendorProductCode === code);
    return entry ? entry.qty : 0;
  };
  const setCartItem = (catalogItem, qty) => {
    setBuilderCart(prev => {
      const filtered = prev.filter(e => e.catalogItem.vendorProductCode !== catalogItem.vendorProductCode);
      return qty > 0 ? [...filtered, { catalogItem, qty }] : filtered;
    });
  };
  const builderSubtotal = builderCart.reduce((s, e) => s + e.qty * e.catalogItem.lastPOPrice, 0);
  const builderTotal    = builderSubtotal + Number(builderFreight || 0);

  const handleCheckout = () => {
    if (!builderVendorId || builderCart.length === 0) return;
    const newPO = {
      poNumber:        generateId('PO'),
      vendorId:        builderVendorId,
      vendorName:      builderVendor?.name || 'Unknown',
      status:          'Draft',
      createdDate:     new Date().toISOString().split('T')[0],
      expectedDelivery: builderDelivery || null,
      freightCost:     Number(builderFreight || 0),
      surcharges:      0,
      taxes:           0,
      notes:           builderNotes,
      items: builderCart.map((e, i) => ({
        sku:                e.catalogItem.internalSku,
        vendorProductCode:  e.catalogItem.vendorProductCode,
        description:        e.catalogItem.description,
        uom:                e.catalogItem.uom,
        qty:                e.qty,
        unitCost:           e.catalogItem.lastPOPrice,
        landedUnitCost:     null,
        minShelfLifeDays:   e.catalogItem.minShelfLifeDays,
        isCatchWeight:      e.catalogItem.isCatchWeight,
        tempCategory:       e.catalogItem.tempCategory,
        receivedQty:        0,
      })),
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    setPoDocTarget(newPO);
    setShowPODoc(true);
    // Reset builder
    setBuilderCart([]);
    setBuilderSearch('');
    setBuilderDelivery('');
    setBuilderNotes('');
    setBuilderFreight('');
    setBuilderVendorId(null);
    setActiveTab('pos');

    if (!DEMO_MODE) {
      api.procurement.purchaseOrders.create({
        vendor_id:         builderVendorId,
        vendor_name:       builderVendor?.name || 'Unknown',
        expected_delivery: builderDelivery || null,
        freight_cost:      Number(builderFreight || 0),
        notes:             builderNotes,
        items: newPO.items.map(i => ({
          sku:                i.sku,
          vendor_product_code: i.vendorProductCode,
          description:        i.description,
          uom:                i.uom,
          qty:                i.qty,
          unit_cost:          i.unitCost,
          temp_category:      i.tempCategory,
          is_catch_weight:    i.isCatchWeight,
          min_shelf_life_days: i.minShelfLifeDays,
        })),
      }).then(res => {
        const created = res.data;
        setPurchaseOrders(prev => prev.map(p =>
          p.poNumber === newPO.poNumber
            ? { ...p, _id: created.id, poNumber: created.po_number }
            : p
        ));
      }).catch(err => showApiToast(`PO saved locally — sync failed: ${err.message}`));
    }
  };

  const handleSendPO = (poNumber) => {
    setPurchaseOrders(prev => prev.map(p =>
      p.poNumber === poNumber ? { ...p, status: 'Sent' } : p
    ));
  };

  const openPOs = purchaseOrders.filter(po =>
    !['Received', 'Cancelled'].includes(po.status) &&
    (activeLocation === 'all' || !po.locationId || po.locationId === activeLocation)
  );
  const pendingAI = aiUpdates.filter(u => u.status === 'pending');
  const awaitingReceipt = purchaseOrders.filter(po =>
    ['Sent', 'Partially Received'].includes(po.status) &&
    (activeLocation === 'all' || !po.locationId || po.locationId === activeLocation)
  );
  const openRTVs = rtvs.filter(r => r.status !== 'Credit Received');

  const kpiCards = [
    { label: 'Open POs', value: openPOs.length, icon: ShoppingCart, color: 'text-cyan-500' },
    { label: 'Pending AI Actions', value: pendingAI.length, icon: Bot, color: 'text-sky-400' },
    { label: 'Awaiting Receipt', value: awaitingReceipt.length, icon: Truck, color: 'text-violet-400' },
    { label: 'Open RTVs', value: openRTVs.length, icon: RotateCcw, color: 'text-rose-400' },
  ];

  const filteredPOs = purchaseOrders.filter(po => {
    const q = poSearch.toLowerCase();
    const matchSearch =
      !q || po.poNumber.toLowerCase().includes(q) || po.vendorName.toLowerCase().includes(q);
    const matchStatus = poStatusFilter === 'All' || po.status === poStatusFilter;
    const matchLocation = activeLocation === 'all' || !po.locationId || po.locationId === activeLocation;
    return matchSearch && matchStatus && matchLocation;
  });
  const totalPOPages = Math.ceil(filteredPOs.length / PAGE_SIZE);
  const pagedPOs = filteredPOs.slice(poPage * PAGE_SIZE, (poPage + 1) * PAGE_SIZE);

  const filteredVendors = vendors.filter(v => {
    const q = vendorSearch.toLowerCase();
    return !q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard',       icon: BarChart3 },
    { id: 'builder',   label: 'PO Builder',      icon: ShoppingBag },
    { id: 'pos',       label: 'Purchase Orders', icon: ShoppingCart, count: openPOs.length + draftReorderPOs.length },
    { id: 'vendors',   label: 'Vendor Directory',icon: Building2 },
    { id: 'rtvs',      label: 'Returns (RTVs)',  icon: RotateCcw, count: openRTVs.length },
    ...(vendorRebatesEnabled ? [{ id: 'rebates', label: 'Rebates', icon: BadgeDollarSign, count: rebateClaims.filter(c => c.status === 'Draft').length || null }] : []),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={UI.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={`${UI.glassHeader} sticky top-0 z-40`}>
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <ShoppingCart size={18} className="text-cyan-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-100">Procurement</h1>
              <p className="text-xs text-gray-500">Purchase Orders · Vendors · Receiving · RTVs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingAI.length > 0 && (
              <span className={`${UI.badgeAmber} animate-pulse`}>
                <Bot size={12} /> {pendingAI.length} AI Action{pendingAI.length !== 1 ? 's' : ''}
              </span>
            )}
            {/* FIX #9: Manual Requisition button now has onClick handler → opens modal */}
            <button onClick={() => setShowManualReq(true)} className={UI.btnPrimary}>
              <Plus size={15} /> Manual Requisition
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-screen-2xl mx-auto px-6">
          <div id="kernal-module-tabs" className="flex items-center overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? UI.tabActive : UI.tabInactive}
              >
                <tab.icon size={15} />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-500 font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════════════
            DASHBOARD TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpiCards.map(card => (
                <div key={card.label} className={`${UI.card} p-5`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                      <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
                      <card.icon size={18} className={card.color} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Agent Inbox */}
            <div className={UI.card}>
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={17} className="text-cyan-500" />
                  <h2 className="font-bold text-gray-200">AI Agent Inbox</h2>
                </div>
                <span className="text-xs text-gray-500">{pendingAI.length} pending</span>
              </div>

              <div className="p-4 space-y-3">
                {pendingAI.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">All clear — no pending AI actions</p>
                  </div>
                ) : (
                  pendingAI.map(update => (
                    <div key={update.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <SeverityBadge severity={update.severity} />
                        <span className="text-xs font-bold text-gray-400 bg-gray-700/60 px-2 py-0.5 rounded">
                          {update.type.replace('_', ' ')}
                        </span>
                        {update.poNumber && (
                          <span className="text-xs text-gray-500 font-mono">{update.poNumber}</span>
                        )}
                        <span className="text-xs text-gray-600 ml-auto">
                          {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{update.message}</p>
                      {update.suggestedUnitCost !== undefined && (
                        <p className="text-xs text-cyan-500 mt-1.5 font-medium">
                          Suggested price: {formatCurrency(update.suggestedUnitCost)}/unit
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptAiUpdate(update)}
                          className={`${UI.btnPrimary} text-xs py-1.5`}
                        >
                          <CheckCircle size={13} /> Accept
                        </button>
                        {/* FIX #1: handleRejectAiUpdate now defined — no crash */}
                        <button
                          onClick={() => handleRejectAiUpdate(update.id)}
                          className={`${UI.btnSecondary} text-xs py-1.5`}
                        >
                          <X size={13} /> Discard
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent PO Activity */}
            <div className={UI.card}>
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="font-bold text-gray-200">Recent PO Activity</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {purchaseOrders.slice(0, 5).map(po => {
                  const value = po.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
                  return (
                    <div key={po.poNumber} className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-sm font-bold text-gray-200">{po.poNumber}</span>
                        <span className="text-gray-600">·</span>
                        <span className="text-sm text-gray-400 truncate">{po.vendorName}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm text-gray-300">{formatCurrency(value)}</span>
                        <span className={getStatusStyle(po.status)}>{po.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PO BUILDER TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'builder' && (
          <div className="space-y-6">

            {/* ── Step 1: Vendor selection ── */}
            {!builderVendorId && (
              <div>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-100">Select a Vendor</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose the vendor you want to place an order with. Only their catalog items will be shown.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {vendors.filter(v => v.activeStatus === 'Active').map(v => {
                    const itemCount = VENDOR_CATALOG.filter(c => c.vendorId === v.vendorId).length;
                    return (
                      <button key={v.vendorId}
                        onClick={() => setBuilderVendorId(v.vendorId)}
                        className="bg-gray-900 border border-gray-800 hover:border-cyan-500/50 hover:bg-gray-800/60 rounded-xl p-5 text-left transition-all group">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Building2 size={18} className="text-cyan-500" />
                          </div>
                          {v.preferredVendor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                              <Star size={10} /> Preferred
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-100 group-hover:text-cyan-400 transition-colors">{v.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{v.category}</p>
                        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                          <span>{itemCount} items</span>
                          <span className="text-cyan-500 font-medium">{v.paymentTerms} · {v.leadTimeDays}d lead</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 2: Catalog + Cart ── */}
            {builderVendorId && (
              <div className="flex gap-6 items-start">

                {/* Left: Catalog */}
                <div className="flex-1 min-w-0 space-y-4">

                  {/* Vendor header + back */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setBuilderVendorId(null); setBuilderCart([]); setBuilderSearch(''); }}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors">
                        <ChevronLeft size={16} />
                      </button>
                      <div>
                        <p className="font-bold text-gray-100 text-lg">{builderVendor?.name}</p>
                        <p className="text-xs text-gray-500">{builderVendor?.paymentTerms} · {builderVendor?.leadTimeDays}-day lead time · {builderVendor?.contact} ({builderVendor?.email})</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{builderCatalog.length} items shown</span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input value={builderSearch} onChange={e => setBuilderSearch(e.target.value)}
                      placeholder="Search items by name, vendor code, or SKU…"
                      className={`${UI.input} pl-9`} />
                  </div>

                  {/* Catalog items */}
                  <div className="space-y-2">
                    {builderCatalog.length === 0 && (
                      <div className="text-center py-12 text-gray-500">No items match your search.</div>
                    )}
                    {builderCatalog.map(item => {
                      const qty = cartQty(item.vendorProductCode);
                      return (
                        <div key={item.vendorProductCode}
                          className={`bg-gray-900 border rounded-xl p-4 flex items-center gap-4 transition-colors ${qty > 0 ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-gray-800 hover:border-gray-700'}`}>
                          {/* Item info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-xs font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">{item.vendorProductCode}</span>
                              <span className="font-mono text-xs text-gray-500">{item.internalSku}</span>
                              {item.isCatchWeight && <span className="text-xs text-amber-400 font-bold">CW</span>}
                            </div>
                            <p className="font-semibold text-gray-200 text-sm leading-snug">{item.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 uppercase">{item.uom}</span>
                              <span className="text-xs text-gray-500">Last PO: <span className="text-gray-300 font-medium">{formatCurrency(item.lastPOPrice)}</span></span>
                              {item.minShelfLifeDays > 0 && <span className="text-xs text-gray-500">Min shelf: {item.minShelfLifeDays}d</span>}
                              <span className={`text-xs font-medium ${item.tempCategory === 'frozen' ? 'text-sky-400' : item.tempCategory === 'refrigerated' || item.tempCategory === 'dairy' ? 'text-cyan-400' : 'text-gray-500'}`}>
                                {item.tempCategory}
                              </span>
                            </div>
                          </div>
                          {/* Qty stepper + add */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {qty > 0 ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => setCartItem(item, qty - 1)}
                                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors">
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number" min="1" value={qty}
                                  onChange={e => setCartItem(item, Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-14 text-center bg-gray-800 border border-cyan-500/40 text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                                <button onClick={() => setCartItem(item, qty + 1)}
                                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors">
                                  <Plus size={14} />
                                </button>
                                <button onClick={() => setCartItem(item, 0)}
                                  className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-400 transition-colors ml-1">
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setCartItem(item, 1)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-gray-950 font-bold rounded-lg hover:bg-cyan-400 transition-colors text-sm">
                                <Plus size={13} /> Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Cart sidebar */}
                <div className="w-80 flex-shrink-0 sticky top-24 space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                      <p className="font-bold text-gray-200 flex items-center gap-2">
                        <ShoppingCart size={15} className="text-cyan-500" /> Cart
                        {builderCart.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-500 font-bold">{builderCart.length}</span>
                        )}
                      </p>
                      {builderCart.length > 0 && (
                        <button onClick={() => setBuilderCart([])} className="text-xs text-gray-500 hover:text-rose-400 transition-colors">Clear</button>
                      )}
                    </div>

                    {builderCart.length === 0 && (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        <ShoppingCart size={28} className="mx-auto mb-2 text-gray-700" />
                        Add items from the catalog to get started.
                      </div>
                    )}

                    {builderCart.length > 0 && (
                      <div>
                        <div className="divide-y divide-gray-800">
                          {builderCart.map(entry => (
                            <div key={entry.catalogItem.vendorProductCode} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-mono text-cyan-500">{entry.catalogItem.vendorProductCode}</p>
                                  <p className="text-sm text-gray-200 font-medium leading-snug truncate">{entry.catalogItem.description}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{entry.qty} {entry.catalogItem.uom} × {formatCurrency(entry.catalogItem.lastPOPrice)}</p>
                                </div>
                                <span className="text-sm font-bold text-gray-100 flex-shrink-0">{formatCurrency(entry.qty * entry.catalogItem.lastPOPrice)}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order details */}
                        <div className="px-4 pb-4 pt-3 border-t border-gray-800 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Requested Delivery Date</label>
                            <input type="date" value={builderDelivery}
                              onChange={e => setBuilderDelivery(e.target.value)}
                              className={UI.input} />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Freight / Shipping Est.</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                              <input type="number" min="0" step="0.01" value={builderFreight}
                                onChange={e => setBuilderFreight(e.target.value)}
                                placeholder="0.00"
                                className={`${UI.input} pl-6`} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes / Special Instructions</label>
                            <textarea rows={2} value={builderNotes}
                              onChange={e => setBuilderNotes(e.target.value)}
                              placeholder="e.g. morning delivery preferred"
                              className={`${UI.input} resize-none`} />
                          </div>
                        </div>

                        {/* Totals + Checkout */}
                        <div className="px-4 pb-4 space-y-2">
                          <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal</span><span className="text-gray-200 font-medium">{formatCurrency(builderSubtotal)}</span>
                          </div>
                          {Number(builderFreight) > 0 && (
                            <div className="flex justify-between text-sm text-gray-400">
                              <span>Freight</span><span className="text-gray-200">{formatCurrency(Number(builderFreight))}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-base border-t border-gray-700 pt-2">
                            <span className="text-gray-200">Total</span><span className="text-cyan-400">{formatCurrency(builderTotal)}</span>
                          </div>
                          <button onClick={handleCheckout}
                            disabled={builderCart.length === 0}
                            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-gray-950 font-black rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                            <FileText size={15} /> Generate PO →
                          </button>
                          <p className="text-center text-xs text-gray-600">Creates a Draft PO · review before sending</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PURCHASE ORDERS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pos' && (
          <div className="space-y-4">

            {/* Location context banner */}
            {activeLocation !== 'all' && (() => {
              const locMeta = LOCATIONS.find(l => l.id === activeLocation);
              return (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${locMeta?.bg} border-current/20`}>
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${locMeta?.color}`} />
                  <span className={`text-xs font-semibold ${locMeta?.color}`}>
                    {locMeta?.name} — {filteredPOs.length} purchase order{filteredPOs.length !== 1 ? 's' : ''} for this location
                  </span>
                </div>
              );
            })()}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={poSearch}
                  onChange={e => { setPoSearch(e.target.value); setPoPage(0); }}
                  placeholder="Search by PO # or vendor…"
                  className={`${UI.input} pl-9`}
                />
              </div>
              <select
                value={poStatusFilter}
                onChange={e => { setPoStatusFilter(e.target.value); setPoPage(0); }}
                className={`${UI.input} w-auto min-w-[160px]`}
              >
                <option value="All">All Statuses</option>
                {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>


            {/* ── Auto-Reorder Draft POs ── */}
            {draftReorderPOs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-widest text-cyan-400">
                    Auto-Generated Draft POs ({draftReorderPOs.length})
                  </p>
                  <span className="text-xs text-gray-600">· Review, edit and send to vendor</span>
                </div>
                {draftReorderPOs.map(po => {
                  const totalValue = po.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
                  return (
                    <div key={po.poNumber} className={`${UI.card} p-4 border border-cyan-500/30 ring-1 ring-cyan-500/10`}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Zap size={16} className="text-cyan-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-100 text-sm font-mono">{po.poNumber}</span>
                              <span className="text-xs text-gray-400">{po.vendorName}</span>
                              <span className={UI.badgeCyan + ' text-xs gap-1'}>
                                <Zap size={9} /> AUTO REORDER
                              </span>
                              <span className={UI.badgeZinc + ' text-xs'}>Draft</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                              <span>{po.items.length} line{po.items.length > 1 ? 's' : ''}</span>
                              <span>Created: {po.createdDate}</span>
                              <span>Expected delivery: {po.expectedDelivery}</span>
                              <span className="text-cyan-400 font-semibold">
                                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} est.
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPurchaseOrders(prev => [{
                                ...po,
                                status: 'Approved',
                                source: undefined,
                                autoReorderSkus: undefined,
                              }, ...prev]);
                              removeDraftReorderPO(po.poNumber);
                            }}
                            className={UI.btnPrimary + ' text-xs px-3 py-1.5'}>
                            <CheckCircle size={12} /> Approve & Move to POs
                          </button>
                          <button
                            onClick={() => removeDraftReorderPO(po.poNumber)}
                            className={UI.btnGhost + ' text-xs px-2 py-1.5'}>
                            <X size={12} /> Dismiss
                          </button>
                        </div>
                      </div>

                      {/* Line items mini-table */}
                      <div className="mt-3 border-t border-gray-800 pt-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-600">
                              <th className="text-left py-1 pr-4">SKU</th>
                              <th className="text-left py-1 pr-4">Description</th>
                              <th className="text-right py-1 pr-4">Qty</th>
                              <th className="text-right py-1 pr-4">Unit Cost</th>
                              <th className="text-right py-1">Ext.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/50">
                            {po.items.map((line, li) => (
                              <tr key={li} className="text-gray-300">
                                <td className="py-1 pr-4 font-mono text-cyan-400">{line.sku}</td>
                                <td className="py-1 pr-4">{line.description}</td>
                                <td className="py-1 pr-4 text-right">{line.qty} {line.uom}</td>
                                <td className="py-1 pr-4 text-right">${line.unitCost.toFixed(2)}</td>
                                <td className="py-1 text-right font-semibold">${(line.qty * line.unitCost).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-gray-700">
                              <td colSpan={4} className="py-1 text-right text-gray-500 font-bold">Total</td>
                              <td className="py-1 text-right font-black text-gray-100">
                                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PO Cards */}
            <div className="space-y-3">
              {pagedPOs.length === 0 ? (
                <div className={`${UI.card} py-16 text-center`}>
                  <ShoppingCart size={32} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">No purchase orders match your filters</p>
                </div>
              ) : (
                pagedPOs.map(po => {
                  const totalValue = po.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
                  const hasLanded = po.items.some(i => i.landedUnitCost != null);
                  // 'Approved' means waiting to be sent — receiving should only happen after it's been Sent to the vendor
                  const canReceive = ['Sent', 'Partially Received'].includes(po.status);

                  return (
                    <div key={po.poNumber} className={`${UI.card} overflow-hidden`}>
                      {/* PO header row */}
                      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-gray-200">{po.poNumber}</span>
                          <span className={getStatusStyle(po.status)}>{po.status}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Approve/Request — full procurement access only */}
                          {po.status === 'Draft' && canWriteProcurement && (() => {
                            const needsApproval = requiresApproval('po_approval', totalValue);
                            return (
                              <button
                                onClick={() => handleApproveOrRequest(po)}
                                className={`${UI.btnPrimary} text-xs py-1.5`}
                                title={needsApproval ? `Total exceeds approval threshold — routes to Approvals inbox` : 'Approve PO for sending'}
                              >
                                {needsApproval
                                  ? <><Send size={13} /> Request Approval</>
                                  : <><CheckCircle size={13} /> Approve</>}
                              </button>
                            );
                          })()}
                          {po.status === 'Pending Approval' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock size={11} /> Awaiting Approval
                            </span>
                          )}
                          {po.status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(po.poNumber, 'Sent')}
                              className={`${UI.btnPrimary} text-xs py-1.5`}
                            >
                              <Send size={13} /> Send to Vendor
                            </button>
                          )}
                          {canReceive && (
                            <button
                              onClick={() => setReceivingTarget(po)}
                              className={`${UI.btnSecondary} text-xs py-1.5`}
                            >
                              <Package size={13} /> Receive
                            </button>
                          )}
                          <button
                            onClick={() => { setPoDocTarget(po); setShowPODoc(true); }}
                            className={`${UI.btnSecondary} text-xs py-1.5`}
                          >
                            <Eye size={13} /> View PO
                          </button>
                          <button
                            onClick={() => setPoAttachmentsOpen(p => p === po.poNumber ? null : po.poNumber)}
                            className={`${poAttachmentsOpen === po.poNumber ? UI.btnPrimary : UI.btnSecondary} text-xs py-1.5`}
                          >
                            <Paperclip size={13} /> Docs
                          </button>
                          <button
                            onClick={() => setPoHistoryOpen(p => p === po.poNumber ? null : po.poNumber)}
                            className={`${poHistoryOpen === po.poNumber ? UI.btnPrimary : UI.btnSecondary} text-xs py-1.5`}
                          >
                            <RotateCcw size={13} /> History
                          </button>
                          <button
                            onClick={() => setLandedCostsTarget(po)}
                            className={`${UI.btnSecondary} text-xs py-1.5`}
                          >
                            <DollarSign size={13} /> {hasLanded ? 'Edit Costs' : 'Landed Costs'}
                          </button>
                          {['Sent', 'Partially Received', 'Received'].includes(po.status) && (
                            <button
                              onClick={() => setRtvTarget(po)}
                              className={`${UI.btnSecondary} text-xs py-1.5`}
                            >
                              <RotateCcw size={13} /> RTV
                            </button>
                          )}
                          {po.status === 'Draft' && canWriteProcurement && (
                            <button
                              onClick={() => handleUpdateStatus(po.poNumber, 'Cancelled')}
                              className={`${UI.btnDanger} text-xs py-1.5`}
                            >
                              <XCircle size={13} /> Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PO meta */}
                      <div className="px-5 pb-3 flex flex-wrap gap-5 text-xs text-gray-500">
                        <span><Building2 size={11} className="inline mr-1" />{po.vendorName}</span>
                        <span><Clock size={11} className="inline mr-1" />Created: {formatDate(po.createdDate)}</span>
                        <span><Truck size={11} className="inline mr-1" />Expected: {formatDate(po.expectedDelivery)}</span>
                        <span className="text-gray-300 font-semibold ml-auto">
                          Total: {formatCurrency(totalValue)}
                        </span>
                      </div>

                      {/* Line items table */}
                      <div className="border-t border-gray-800 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-800/40">
                            <tr>
                              {['SKU', 'Description', 'Ordered', 'Received', 'Unit Cost', 'Landed / Unit', 'Min SLA'].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {po.items.map((item, i) => (
                              <tr
                                key={item.sku}
                                className={`border-t border-gray-800/60 ${i % 2 === 1 ? 'bg-gray-800/20' : ''}`}
                              >
                                <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.sku}</td>
                                <td className="px-4 py-3 text-gray-200">
                                  {item.description}
                                  {item.isCatchWeight && (
                                    <span className="ml-2 text-xs text-cyan-500 font-bold">[CW]</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-300">{item.qty}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={
                                      item.receivedQty >= item.qty
                                        ? 'text-emerald-400 font-bold'
                                        : 'text-gray-400'
                                    }
                                  >
                                    {item.receivedQty || 0}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-300">{formatCurrency(item.unitCost)}</td>
                                <td className="px-4 py-3">
                                  {item.landedUnitCost != null ? (
                                    <span className="text-cyan-500 font-semibold">
                                      {formatCurrency(item.landedUnitCost)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-600">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                  {item.minShelfLifeDays}d
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Attachments panel (toggled by Docs button) */}
                      {poAttachmentsOpen === po.poNumber && (
                        <div className="border-t border-gray-800 p-4">
                          <AttachmentsPanel
                            recordId={po.poNumber}
                            recordLabel={po.poNumber}
                            isDark={true}
                            uploaderName={activeUser?.name || 'You'}
                          />
                        </div>
                      )}

                      {/* History panel (toggled by History button) */}
                      {poHistoryOpen === po.poNumber && (
                        <div className="border-t border-gray-800 p-4">
                          <RecordHistory
                            entityIds={po.poNumber}
                            label={po.poNumber}
                            isDark={true}
                            mode="full"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPOPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {poPage * PAGE_SIZE + 1}–
                  {Math.min((poPage + 1) * PAGE_SIZE, filteredPOs.length)} of {filteredPOs.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPoPage(p => Math.max(0, p - 1))}
                    disabled={poPage === 0}
                    className={`${UI.btnSecondary} py-1.5 text-xs disabled:opacity-40`}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    onClick={() => setPoPage(p => Math.min(totalPOPages - 1, p + 1))}
                    disabled={poPage >= totalPOPages - 1}
                    className={`${UI.btnSecondary} py-1.5 text-xs disabled:opacity-40`}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VENDOR DIRECTORY TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'vendors' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
                placeholder="Search vendors by name or category…"
                className={`${UI.input} pl-9`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVendors.map(v => {
                const score = computeVendorScore(v.vendorId, v.leadTimeDays);
                const isOpen = expandedScorecard === v.vendorId;

                const gradeColor = score ? {
                  A: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
                  B: { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    border: 'border-cyan-500/30'    },
                  C: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30'   },
                  D: { bg: 'bg-orange-500/15',  text: 'text-orange-400',  border: 'border-orange-500/30'  },
                  F: { bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-rose-500/30'    },
                }[score.grade] : null;

                const metricColor = pct => pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-400' : 'bg-rose-500';
                const metricText  = pct => pct >= 90 ? 'text-emerald-400' : pct >= 75 ? 'text-amber-400' : 'text-rose-400';

                return (
                  <div key={v.vendorId} className={`${UI.card} overflow-hidden`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-200">{v.name}</h3>
                            {v.preferredVendor && (
                              <span className={UI.badgeAmber}><Star size={10} /> Preferred</span>
                            )}
                            <span className={v.activeStatus === 'Active' ? UI.badgeEmerald : UI.badgeRose}>
                              {v.activeStatus}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{v.category}</p>
                        </div>
                        {score && (
                          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${gradeColor.bg} ${gradeColor.border} shrink-0 ml-3`}>
                            <span className={`text-xl font-black leading-none ${gradeColor.text}`}>{score.grade}</span>
                            <span className="text-gray-600 text-[9px] leading-none mt-0.5">SCORE</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-gray-500">
                        <span><span className="text-gray-400">Contact:</span> {v.contact}</span>
                        <span><span className="text-gray-400">Terms:</span> {v.paymentTerms}</span>
                        <span><span className="text-gray-400">Email:</span> {v.email}</span>
                        <span><span className="text-gray-400">Lead Time:</span> {v.leadTimeDays}d</span>
                        <span className="col-span-2"><span className="text-gray-400">Phone:</span> {v.phone}</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                        <span className="text-gray-600">{v.vendorId}</span>
                        {score && (
                          <button
                            onClick={() => setExpandedScorecard(isOpen ? null : v.vendorId)}
                            className={`${UI.btnSecondary} text-xs py-1 gap-1.5`}
                          >
                            <BarChart3 size={12} />
                            {isOpen ? 'Hide Scorecard' : 'View Scorecard'}
                            <ChevronDown size={11} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Scorecard Panel ─────────────────────────────────────────── */}
                    {isOpen && score && (() => {
                      const metrics = [
                        {
                          label: 'On-Time Delivery',
                          value: score.onTimeRate,
                          display: `${score.onTimeRate.toFixed(1)}%`,
                          bar: score.onTimeRate,
                          tip: `${Math.round(score.onTimeRate / 100 * score.totalDeliveries)} of ${score.totalDeliveries} deliveries arrived on or before promised date`,
                        },
                        {
                          label: 'Fill Rate',
                          value: score.fillRate,
                          display: `${score.fillRate.toFixed(1)}%`,
                          bar: score.fillRate,
                          tip: 'Percentage of ordered quantity actually received',
                        },
                        {
                          label: 'Rejection Rate',
                          value: 100 - score.rejectionRate,
                          display: `${score.rejectionRate.toFixed(2)}%`,
                          bar: Math.max(0, 100 - score.rejectionRate * 5),
                          tip: 'Items rejected at receiving due to quality, temp excursion, or OS&D',
                          invert: true,
                        },
                        {
                          label: 'Avg Lead Time',
                          value: score.avgDays <= v.leadTimeDays ? 100 : 70,
                          display: `${score.avgDays.toFixed(1)} days`,
                          bar: Math.max(0, 100 - Math.max(0, score.avgDays - v.leadTimeDays) * 15),
                          tip: `Contracted lead time: ${v.leadTimeDays} days`,
                        },
                      ];

                      return (
                        <div className={`border-t border-gray-800 p-5 ${gradeColor.bg}`}>
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                              <Award size={16} className={gradeColor.text} />
                              <div>
                                <p className="text-xs font-bold text-gray-200">Vendor Performance Scorecard</p>
                                <p className="text-xs text-gray-500">Based on {score.totalDeliveries} deliveries · last delivery {score.lastDelivery}</p>
                              </div>
                            </div>
                            <div className={`text-right`}>
                              <p className={`text-2xl font-black ${gradeColor.text}`}>{score.composite.toFixed(0)}</p>
                              <p className="text-xs text-gray-600">/ 100</p>
                            </div>
                          </div>

                          {/* Metric rows */}
                          <div className="space-y-3">
                            {metrics.map(m => (
                              <div key={m.label}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-400">{m.label}</span>
                                  <div className="flex items-center gap-1.5">
                                    {m.invert
                                      ? (parseFloat(m.display) <= 2 ? <TrendingDown size={11} className="text-emerald-400" /> : <TrendingUp size={11} className="text-rose-400" />)
                                      : (m.bar >= 90 ? <TrendingUp size={11} className="text-emerald-400" /> : <TrendingDown size={11} className="text-rose-400" />)
                                    }
                                    <span className={`text-xs font-bold ${metricText(m.bar)}`}>{m.display}</span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${metricColor(m.bar)}`}
                                    style={{ width: `${Math.min(100, m.bar)}%` }}
                                  />
                                </div>
                                <p className="text-gray-700 text-[10px] mt-0.5">{m.tip}</p>
                              </div>
                            ))}
                          </div>

                          {/* Weight footnote */}
                          <p className="mt-4 text-gray-700 text-[10px]">
                            Composite score: On-Time (35%) · Fill Rate (35%) · Rejection (20%) · Lead Time (10%)
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            RTVs TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'rtvs' && (
          <div className="space-y-4">
            {rtvs.length === 0 ? (
              <div className={`${UI.card} py-16 text-center`}>
                <RotateCcw size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No returns on record</p>
              </div>
            ) : (
              rtvs.map(rtv => (
                <div key={rtv.rtvId} className={UI.card}>
                  <div className="px-5 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-200">{rtv.rtvId}</span>
                      <span className={getStatusStyle(rtv.status)}>{rtv.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>PO: <span className="text-gray-300 font-mono">{rtv.poNumber}</span></span>
                      <span className="text-gray-600">·</span>
                      <span>{rtv.vendorName}</span>
                      <span className="text-gray-600">·</span>
                      <span>{formatDate(rtv.createdDate)}</span>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    <p className="text-sm text-gray-400 italic">"{rtv.reason}"</p>
                    {rtv.authorizationCode && (
                      <p className="text-xs text-emerald-400">
                        Auth Code: <span className="font-mono font-bold">{rtv.authorizationCode}</span>
                      </p>
                    )}

                    <div className="rounded-lg overflow-hidden border border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800/60">
                          <tr>
                            {['SKU', 'Description', 'Qty Returned', 'Unit Cost', 'Landed Cost', 'Credit'].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rtv.items.map(item => (
                            <tr key={item.sku} className="border-t border-gray-700">
                              <td className="px-3 py-2.5 font-mono text-xs text-gray-400">{item.sku}</td>
                              <td className="px-3 py-2.5 text-gray-300">{item.description}</td>
                              <td className="px-3 py-2.5 text-gray-300">{item.qtyReturned}</td>
                              <td className="px-3 py-2.5 text-gray-400">{formatCurrency(item.unitCost)}</td>
                              <td className="px-3 py-2.5">
                                {item.landedUnitCost != null ? (
                                  <span className="text-cyan-500">{formatCurrency(item.landedUnitCost)}</span>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                              {/* FIX #7: creditAmount is based on landed cost — correct value shown */}
                              <td className="px-3 py-2.5 text-emerald-400 font-semibold">
                                {formatCurrency(item.creditAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Credit</span>
                      <span className="text-xl font-bold text-emerald-400">
                        {formatCurrency(rtv.items.reduce((s, i) => s + (i.creditAmount || 0), 0))}
                      </span>
                    </div>

                    {rtv.status === 'Pending Authorization' && (
                      <button
                        onClick={() =>
                          setRtvs(prev =>
                            prev.map(r =>
                              r.rtvId === rtv.rtvId
                                ? { ...r, status: 'Authorized', authorizationCode: generateId('RMA') }
                                : r
                            )
                          )
                        }
                        className={`${UI.btnPrimary} text-xs py-1.5`}
                      >
                        <CheckCircle size={13} /> Authorize Return
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            REBATES TAB
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'rebates' && vendorRebatesEnabled && (
          <div className="p-1">
            <RebatesTab
              rebateAgreements={rebateAgreements}
              setRebateAgreements={setRebateAgreements}
              rebateClaims={rebateClaims}
              setRebateClaims={setRebateClaims}
            />
          </div>
        )}

      </main>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showManualReq && (
        <ManualRequisitionModal
          vendors={vendors}
          onSubmit={handleManualReqSubmit}
          onClose={() => setShowManualReq(false)}
        />
      )}
      {receivingTarget && (
        <ReceivingModal
          po={receivingTarget}
          onClose={() => setReceivingTarget(null)}
          onComplete={handleReceivingComplete}
        />
      )}
      {landedCostsTarget && (
        <LandedCostsModal
          po={landedCostsTarget}
          onClose={() => setLandedCostsTarget(null)}
          onSave={handleLandedCostsSave}
        />
      )}
      {rtvTarget && (
        <RTVModal
          po={rtvTarget}
          onClose={() => setRtvTarget(null)}
          onSubmit={handleRTVSubmit}
        />
      )}
      {showPODoc && poDocTarget && (
        <PODocumentModal
          po={poDocTarget}
          vendor={vendors.find(v => v.vendorId === poDocTarget.vendorId)}
          onClose={() => { setShowPODoc(false); setPoDocTarget(null); }}
          onSend={handleSendPO}
        />
      )}
      {/* API error toast */}
      {apiToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-900/90 border border-rose-500/40 text-rose-200 text-sm px-4 py-2 rounded-lg shadow-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />{apiToast}
        </div>
      )}
    </div>
  );
}
