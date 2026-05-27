import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import { api } from './lib/api.js';


// ── Company Information ───────────────────────────────────────────────────────
// Single source of truth. Referenced by PO documents, recall letters,
// invoice headers, and any printed output. Update here → updates everywhere.
export const COMPANY_INFO = {
  name:        'Kernel Food Distribution LLC',
  address:     '1800 Commerce Pkwy, Suite A',
  city:        'New Orleans, LA 70123',
  phone:       '(504) 555-9100',
  email:       'purchasing@kernaldist.com',
  taxId:       '72-1234567',
  fdaRegId:    'FD-2026-KFD-001',
};

// ── Warehouse Locations ───────────────────────────────────────────────────────
// Three Tampa-area distribution warehouses. The global location switcher in the
// top bar reads from here; all four modules use `activeLocation` to scope their
// views. `id: 'all'` is the consolidated / cross-location view.
export const LOCATIONS = [
  { id: 'all',   name: 'All Locations',  short: 'All',        address: 'Consolidated view',                color: 'text-cyan-400',    bg: 'bg-cyan-500/15'    },
  { id: 'LOC-A', name: 'Tampa Main',     short: 'Tampa Main', address: '5401 E Hillsborough Ave, Tampa',   color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { id: 'LOC-B', name: 'Tampa North',    short: 'N. Tampa',   address: '12800 N Nebraska Ave, Tampa',      color: 'text-violet-400',  bg: 'bg-violet-500/15'  },
  { id: 'LOC-C', name: 'St. Petersburg', short: 'St. Pete',   address: '2800 Gandy Blvd N, St. Pete',      color: 'text-amber-400',   bg: 'bg-amber-500/15'   },
];

// ── Pricing Plans ────────────────────────────────────────────────────────────
// Two core tiers + à la carte add-ons. 'enterprise' is the pilot default.
// Add-on modules are unlocked on any plan via settings.addOns array.
export const PLANS = {
  base: {
    label:       'Base',
    price:       '$299 / mo',
    color:       'text-sky-400',
    bg:          'bg-sky-500/15',
    border:      'border-sky-500/30',
    description: 'Core operations for growing distributors',
    modules: [
      'inventory','procurement','logistics','accounting',
      'crm','b2b','approvals','settings','users','reports',
    ],
  },
  enterprise: {
    label:       'Enterprise',
    price:       '$799 / mo',
    color:       'text-cyan-400',
    bg:          'bg-cyan-500/15',
    border:      'border-cyan-500/30',
    description: 'Full operations suite for established distributors',
    // All non-add-on modules
    modules: [
      'inventory','demand','warehouse','logistics','gps',
      'crm','b2b','field','pricing','procurement',
      'accounting','gl','approvals',
      'lossPrevention','settings','users',
      'nlquery','reports',
    ],
  },
};

// ── Add-on Modules ────────────────────────────────────────────────────────────
// Available à la carte on any plan. Keys match module IDs in main.jsx.
export const ADDONS = {
  mobilewms:    { label: 'Mobile WMS',       price: '$99 / mo',  icon: '📱', description: 'Handheld scanner app for warehouse associates — pick, pack, and receive on the floor.' },
  landedcost:   { label: 'Landed Cost',      price: '$79 / mo',  icon: '⚓', description: 'Allocate import duties, freight, and tariffs to landed unit cost per SKU.' },
  integrations: { label: 'Integrations Hub', price: '$79 / mo',  icon: '🔌', description: 'QuickBooks, Salesforce, and 40+ pre-built connectors via OAuth.' },
  edi:          { label: 'EDI Integration',  price: '$149 / mo', icon: '↔️', description: '850/856/810/214 EDI document exchange with trading partners.' },
  developer:    { label: 'Developer API',    price: '$99 / mo',  icon: '</>',description: 'REST API, webhooks, and OAuth app platform for custom integrations.' },
  ecommerce:    { label: 'eCommerce',        price: '$99 / mo',  icon: '🛍️', description: 'Shopify, WooCommerce, and marketplace sync — orders flow straight into Kernel.' },
};

// ── Module IDs (must match TABS ids in main.jsx) ─────────────────────────────
export const MODULE_IDS = [
  // Operations
  'inventory','demand','warehouse','mobilewms','logistics','gps',
  // Sales
  'crm','b2b','field','pricing',
  // Finance
  'procurement','landedcost','accounting','gl','approvals',
  // Admin
  'lossPrevention','settings','users',
  // Intelligence
  'nlquery','reports',
  // Platform
  'integrations','edi','developer','ecommerce',
];

// ── Approval flow registry ───────────────────────────────────────────────────
// Each flow type has a label, the human-facing description shown in approval
// detail views, and a noun for what gets approved. Approver roles and
// thresholds live in settings.approvalRules so they're editable.
export const APPROVAL_FLOW_TYPES = {
  po_approval: {
    label:       'Purchase Order Approval',
    description: 'PO total exceeds the threshold and requires approval before being sent to the vendor.',
    noun:        'Purchase Order',
    icon:        '🛒',
    sourceModule: 'procurement',
  },
  credit_release: {
    label:       'Credit Hold Release',
    description: 'A customer credit hold is being lifted. Requires sign-off from accounting or a manager.',
    noun:        'Credit Hold Release',
    icon:        '🔓',
    sourceModule: 'crm',
  },
  discount_override: {
    label:       'Discount Authorization',
    description: 'A discount or contract price override exceeds the authorized rate and needs manager approval.',
    noun:        'Discount Override',
    icon:        '💸',
    sourceModule: 'crm',
  },
  account_change: {
    label:       'Customer Account Change',
    description: 'A significant change to a customer account (credit limit, payment terms, pricing tier) requires manager sign-off.',
    noun:        'Account Change',
    icon:        '📝',
    sourceModule: 'crm',
  },
  order_change_request: {
    label:       'Order Change Request',
    description: 'A sales rep is requesting changes to an order that has already entered or completed picking. Requires warehouse manager sign-off.',
    noun:        'Order Change',
    icon:        '📦',
    sourceModule: 'field',
  },
};

// ── Default approval rules ───────────────────────────────────────────────────
// These get spread into DEFAULT_SETTINGS.approvalRules so they're editable in
// Settings → Approvals.
const DEFAULT_APPROVAL_RULES = {
  po_approval: {
    enabled: true,
    threshold: 5000,            // dollar threshold; PO total > this requires approval
    thresholdLabel: 'PO total above',
    thresholdUnit: '$',
    approverRoles: ['admin', 'manager'],
    requireComment: false,
  },
  credit_release: {
    enabled: true,
    threshold: 0,               // always — any release requires approval
    thresholdLabel: 'Any release requires approval',
    thresholdUnit: '',
    approverRoles: ['admin', 'manager', 'accountant'],
    requireComment: true,
  },
  discount_override: {
    enabled: true,
    threshold: 15,              // percent — discounts above this require approval
    thresholdLabel: 'Discount above',
    thresholdUnit: '%',
    approverRoles: ['admin', 'manager'],
    requireComment: true,
  },
  account_change: {
    enabled: true,
    threshold: 50,              // percent credit-limit change OR terms extension days
    thresholdLabel: 'Credit-limit change above',
    thresholdUnit: '%',
    approverRoles: ['admin', 'manager'],
    requireComment: false,
  },
  order_change_request: {
    enabled: true,
    threshold: 0,               // always — any post-pick change requires warehouse approval
    thresholdLabel: 'Post-pick changes always require approval',
    thresholdUnit: '',
    approverRoles: ['admin', 'manager', 'warehouse'],
    requireComment: true,
  },
};

// ── Role definitions ──────────────────────────────────────────────────────────
export const ROLES = {
  admin:      { label:'Admin',           color:'text-rose-400',    bg:'bg-rose-500/15' },
  manager:    { label:'Manager',         color:'text-cyan-400',    bg:'bg-cyan-500/15' },
  dispatcher: { label:'Dispatcher',      color:'text-sky-400',     bg:'bg-sky-500/15'  },
  driver:     { label:'Driver',          color:'text-amber-400',   bg:'bg-amber-500/15'},
  accountant: { label:'Accountant',      color:'text-emerald-400', bg:'bg-emerald-500/15'},
  sales:      { label:'Sales Rep',       color:'text-purple-400',  bg:'bg-purple-500/15'},
  warehouse:  { label:'Warehouse Staff', color:'text-orange-400',  bg:'bg-orange-500/15'},
  buyer:      { label:'Buyer/Purchaser', color:'text-teal-400',    bg:'bg-teal-500/15'  },
  customer_service: { label:'Customer Service', color:'text-indigo-400', bg:'bg-indigo-500/15' },
};

// ── Default permission matrix per role ───────────────────────────────────────
// Values: 'full' | 'view' | 'driver' | 'none'
// Covers all 24 module IDs. Stored as a constant for reset; live copy goes into
// roleProfiles state so admins can edit profiles at runtime.
export const ROLE_PERMISSIONS = {
  //               Operations ─────────────────────────────────────────────────────────────────────  Sales ───────────────────────────────────────────  Finance ────────────────────────────────────────────────────────  Admin ─────────────────────────────────────────────────  Intelligence ──────────  Platform ─────────────────────────────────────────
  //               inventory  demand     warehouse  mobilewms  logistics  gps        crm        b2b        field      pricing    procurement landedcost  accounting gl         approvals  lossPrev   settings   users      nlquery    reports    integrations edi        developer  ecommerce
  admin:           { inventory:'full',  demand:'full',  warehouse:'full',  mobilewms:'full',  logistics:'full',   gps:'full',   crm:'full',  b2b:'full',  field:'full',  pricing:'full',  procurement:'full',  landedcost:'full',  accounting:'full',  gl:'full',  approvals:'full',  lossPrevention:'full',  settings:'full',  users:'full',  nlquery:'full',  reports:'full',  integrations:'full',  edi:'full',  developer:'full',  ecommerce:'full'  },
  manager:         { inventory:'full',  demand:'full',  warehouse:'full',  mobilewms:'view',  logistics:'full',   gps:'full',   crm:'full',  b2b:'full',  field:'full',  pricing:'full',  procurement:'full',  landedcost:'full',  accounting:'view',  gl:'view',  approvals:'full',  lossPrevention:'view',  settings:'full',  users:'view',  nlquery:'full',  reports:'full',  integrations:'full',  edi:'full',  developer:'none',  ecommerce:'full'  },
  dispatcher:      { inventory:'view',  demand:'view',  warehouse:'view',  mobilewms:'none',  logistics:'full',   gps:'full',   crm:'none',  b2b:'none',  field:'none',  pricing:'none',  procurement:'none',  landedcost:'none',  accounting:'none',  gl:'none',  approvals:'view',  lossPrevention:'none',  settings:'none',  users:'none',  nlquery:'view',  reports:'view',  integrations:'none',  edi:'view',  developer:'none',  ecommerce:'none'  },
  driver:          { inventory:'none',  demand:'none',  warehouse:'none',  mobilewms:'none',  logistics:'driver', gps:'none',   crm:'none',  b2b:'none',  field:'none',  pricing:'none',  procurement:'none',  landedcost:'none',  accounting:'none',  gl:'none',  approvals:'none',  lossPrevention:'none',  settings:'none',  users:'none',  nlquery:'none',  reports:'none',  integrations:'none',  edi:'none',  developer:'none',  ecommerce:'none'  },
  accountant:      { inventory:'view',  demand:'view',  warehouse:'none',  mobilewms:'none',  logistics:'none',   gps:'view',   crm:'none',  b2b:'none',  field:'none',  pricing:'view',  procurement:'view',  landedcost:'full',  accounting:'full',  gl:'full',  approvals:'full',  lossPrevention:'view',  settings:'none',  users:'none',  nlquery:'full',  reports:'full',  integrations:'view',  edi:'view',  developer:'none',  ecommerce:'none'  },
  sales:           { inventory:'view',  demand:'view',  warehouse:'none',  mobilewms:'none',  logistics:'none',   gps:'none',   crm:'full',  b2b:'full',  field:'full',  pricing:'full',  procurement:'none',  landedcost:'none',  accounting:'none',  gl:'none',  approvals:'view',  lossPrevention:'none',  settings:'none',  users:'none',  nlquery:'full',  reports:'view',  integrations:'none',  edi:'none',  developer:'none',  ecommerce:'view'  },
  warehouse:       { inventory:'full',  demand:'view',  warehouse:'full',  mobilewms:'full',  logistics:'view',   gps:'view',   crm:'none',  b2b:'none',  field:'none',  pricing:'none',  procurement:'view',  landedcost:'none',  accounting:'none',  gl:'none',  approvals:'view',  lossPrevention:'view',  settings:'none',  users:'none',  nlquery:'view',  reports:'view',  integrations:'none',  edi:'none',  developer:'none',  ecommerce:'none'  },
  buyer:           { inventory:'full',  demand:'full',  warehouse:'view',  mobilewms:'none',  logistics:'view',   gps:'none',   crm:'view',  b2b:'view',  field:'none',  pricing:'view',  procurement:'full',  landedcost:'full',  accounting:'view',  gl:'view',  approvals:'full',  lossPrevention:'view',  settings:'none',  users:'none',  nlquery:'full',  reports:'full',  integrations:'view',  edi:'full',  developer:'none',  ecommerce:'none'  },
  customer_service:{ inventory:'view',  demand:'none',  warehouse:'none',  mobilewms:'none',  logistics:'view',   gps:'view',   crm:'full',  b2b:'full',  field:'view',  pricing:'view',  procurement:'none',  landedcost:'none',  accounting:'none',  gl:'none',  approvals:'view',  lossPrevention:'none',  settings:'none',  users:'none',  nlquery:'full',  reports:'view',  integrations:'none',  edi:'none',  developer:'none',  ecommerce:'view'  },
};

// ── Default business settings ─────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  business: {
    name:    'Metro Food Distribution',
    address: '1400 Industrial Blvd',
    city:    'Tampa',
    state:   'FL',
    zip:     '33605',
    phone:   '(813) 555-0100',
    email:   'ops@metrofood.com',
    ein:     '82-1234567',
    licenseNumber: 'FL-FD-2024-0047',
  },
  features: {
    refrigeratedFoods:  false,
    frozenFoods:        false,
    catchWeightItems:   true,
    codCollections:     true,
    lotTracking:        true,
    routeOptimization:  true,
    etaNotifications:   true,
    osdPhotoEvidence:   true,
    temperatureLogging: false,
    b2bPortalEnabled:   true,
    fieldSalesEnabled:  true,
    crmEnabled:         true,
    // ── Compliance & Traceability ──────────────────────────
    fefoEnforcement:    true,   // First Expired First Out — enforce pick order at lot selection
    fsmaTraceability:   true,   // FSMA Rule 204 — one-up/one-down lot traceability reports
    // ── Order Management ───────────────────────────────────
    standingOrders:     true,   // Recurring order templates in B2B Portal
    creditHoldEnforcement: true, // Credit hold flag blocks B2B ordering
    minShelfLifeEnforcement: true, // Block picks when FEFO lot < min shelf life days
    // ── Pricing ────────────────────────────────────────────
    customerPricing:    false,  // Customer-specific price tiers per account
    // ── Workflow ──────────────────────────────────────────
    approvalWorkflows:  true,   // Enable approval routing for POs, credit holds, discounts, account changes
    // ── Loss Prevention ───────────────────────────────────
    strictInventoryControl: false,  // When ON: scanner IN/OUT requires linked PO/order; Library lot edits admin-only for non-admins
    // ── Operations ────────────────────────────────────────
    multiLocation:     true,  // Multiple warehouse locations — location switcher + inter-location transfers
    barcodeScanning:   true,  // Barcode/scanner tool for inventory IN/OUT operations
    caseSplitting:     true,  // Split pallet/case SKUs into individual child units
    reorderAutomation: true,  // AI buying recommendations + automated reorder point alerts
    deliveryWindows:   true,  // Time-window commitments on delivery stops (e.g. 08:00–10:00)
    signatureCapture:  true,  // Customer signature capture on Proof of Delivery
    // ── Compliance ────────────────────────────────────────
    allergenManagement: true, // Allergen Recall tab in Compliance & Risk
    pacaCompliance:    true,  // PACA Compliance tab (licensed produce dealers only)
    // ── Finance ───────────────────────────────────────────
    creditTerms:       true,  // Net-terms credit — AR aging, credit holds, credit limits. Off = COD-only
    vendorRebates:     true,  // Vendor rebate and bill-back allowance tracking
    commissionTracking: true, // Sales rep commission calculation and payroll export
  },
  modules: {
    // Operations
    inventory:    true,
    demand:       true,
    warehouse:    true,
    mobilewms:    true,
    logistics:    true,
    gps:          true,
    // Sales
    crm:          true,
    b2b:          true,
    field:        true,
    pricing:      true,
    // Finance
    procurement:  true,
    landedcost:   true,
    accounting:   true,
    gl:           true,
    approvals:    true,
    // Admin (always on — but still toggleable)
    lossPrevention: true,
    settings:     true,
    users:        true,
    // Intelligence
    nlquery:      true,
    reports:      true,
    // Platform
    integrations: true,
    edi:          true,
    developer:    true,
    ecommerce:    true,
  },
  // ── Plan & licensing ──────────────────────────────────────────────────────
  // Pilot client: enterprise plan + all add-ons = full access, nothing locked.
  // Flip plan to 'base' and trim addOns to simulate a lower-tier tenant.
  plan:    'enterprise',
  addOns:  ['mobilewms','landedcost','integrations','edi','developer','ecommerce'],
  approvalRules: DEFAULT_APPROVAL_RULES,
  pricing: {
    tiers: [
      { id:'standard',  label:'Standard',  multiplier: 1.00, color:'text-gray-400',    bg:'bg-gray-700/60'       },
      { id:'preferred', label:'Preferred', multiplier: 0.95, color:'text-sky-400',     bg:'bg-sky-500/15'        },
      { id:'premium',   label:'Premium',   multiplier: 0.90, color:'text-purple-400',  bg:'bg-purple-500/15'     },
      { id:'contract',  label:'Contract',  multiplier: 0.85, color:'text-emerald-400', bg:'bg-emerald-500/15'    },
    ],
  },
};

// ── Initial user roster ───────────────────────────────────────────────────────
const INITIAL_USERS = [
  { id:'U001', name:'Carlos M.',   email:'carlos@metrofood.com',    role:'admin',            active:true, overrides:{} },
  { id:'U002', name:'Samantha K.', email:'samantha@metrofood.com',  role:'accountant',       active:true, overrides:{} },
  { id:'U003', name:'Marcus T.',   email:'marcus@metrofood.com',    role:'driver',           active:true, overrides:{} },
  { id:'U004', name:'Darnell W.',  email:'darnell@metrofood.com',   role:'driver',           active:true, overrides:{} },
  { id:'U005', name:'Sofia R.',    email:'sofia@metrofood.com',     role:'driver',           active:true, overrides:{} },
  { id:'U006', name:'James P.',    email:'james@metrofood.com',     role:'driver',           active:true, overrides:{} },
  { id:'U007', name:'Alex T.',     email:'alex@metrofood.com',      role:'dispatcher',       active:true, overrides:{} },
  { id:'U008', name:'Rachel B.',   email:'rachel@metrofood.com',    role:'warehouse',        active:true, overrides:{} },
  { id:'U009', name:'Jordan L.',   email:'jordan@metrofood.com',    role:'sales',            active:true, overrides:{} },
  { id:'U010', name:'Dana P.',     email:'dana@metrofood.com',      role:'manager',          active:true, overrides:{} },
  { id:'U011', name:'Victor H.',   email:'victor@metrofood.com',    role:'buyer',            active:true, overrides:{} },
  { id:'U012', name:'Maria C.',    email:'maria@metrofood.com',     role:'customer_service', active:true, overrides:{} },
];

// ── Initial seed approval requests — so the inbox isn't empty on first load ─
const NOW_ISO = new Date().toISOString();
const HOURS_AGO = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const INITIAL_APPROVAL_REQUESTS = [
  {
    id: 'APR-1001',
    flowType: 'po_approval',
    status: 'pending',
    requestedBy: 'U010',                // Dana P. (manager)
    requestedAt: HOURS_AGO(3),
    title: 'PO-7841 — US Foods Distribution — $8,420.00',
    summary: 'Weekly protein restock exceeds $5,000 threshold. 3 line items: ground beef, chicken breast, pork tenderloin.',
    threshold: 5000,
    payload: {
      poNumber: 'PO-7841',
      vendorName: 'US Foods Distribution',
      total: 8420.00,
      items: [
        { sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb', qty: 40, unitCost: 128.00 },
        { sku:'PROT-002',    description:'Chicken Breast Boneless 40lb', qty: 30, unitCost: 98.00 },
        { sku:'PROT-005',    description:'Pork Tenderloin 10lb avg',    qty: 20, unitCost: 35.50 },
      ],
    },
    audit: [
      { at: HOURS_AGO(3), userId: 'U010', action: 'submitted', note: 'Standard weekly order.' },
    ],
  },
  {
    id: 'APR-1002',
    flowType: 'credit_release',
    status: 'pending',
    requestedBy: 'U009',                // Jordan L. (sales)
    requestedAt: HOURS_AGO(8),
    title: "Release credit hold — Joe's Steakhouse Downtown",
    summary: 'Customer paid $10,000 toward 60+ days past due. Requests hold lifted to allow Friday delivery.',
    threshold: 0,
    payload: {
      customerId: 'CUST-503',
      customerName: "Joe's Steakhouse – Downtown",
      currentBalance: 5000,
      reason: 'Payment received yesterday — Check #7421 for $10,000. Customer wants to order for weekend service.',
    },
    audit: [
      { at: HOURS_AGO(8), userId: 'U009', action: 'submitted', note: 'Customer wants to order for weekend.' },
    ],
  },
  {
    id: 'APR-0999',
    flowType: 'discount_override',
    status: 'approved',
    requestedBy: 'U009',
    requestedAt: HOURS_AGO(48),
    decidedBy: 'U010',
    decidedAt: HOURS_AGO(46),
    title: 'Discount override — City Hospital Cafe — 18% on dairy line',
    summary: 'Bulk-rate quote for new institutional account. 18% off dairy SKUs through Q3.',
    threshold: 15,
    payload: {
      customerId: 'CUST-502',
      customerName: 'City Hospital Cafe',
      skuScope: 'Dairy category (all)',
      discountPct: 18,
      expiresOn: '2026-09-30',
      reason: 'Competitive bid against Sysco for Q3 contract — Dr. Jenkins requested matched pricing.',
    },
    audit: [
      { at: HOURS_AGO(48), userId: 'U009', action: 'submitted', note: 'Need to lock in before Friday quote deadline.' },
      { at: HOURS_AGO(46), userId: 'U010', action: 'approved',  note: 'Approved on the condition of 12-month contract minimum.' },
    ],
  },
];

const INITIAL_NOTIFICATIONS = [
  { id: 'N-001', type: 'approval_decision', message: 'Your discount override for City Hospital Cafe was approved by Dana P.', audience: ['U009'], readBy: [], createdAt: HOURS_AGO(46), link: { moduleId: 'approvals', recordId: 'APR-0999' } },
  { id: 'N-002', type: 'approval_pending',  message: 'PO-7841 ($8,420) needs your approval before being sent to US Foods.',     audience: ['U001','U010'], readBy: [], createdAt: HOURS_AGO(3), link: { moduleId: 'approvals', recordId: 'APR-1001' } },
  { id: 'N-003', type: 'approval_pending',  message: "Credit hold release requested for Joe's Steakhouse Downtown.",            audience: ['U001','U002','U010'], readBy: [], createdAt: HOURS_AGO(8), link: { moduleId: 'approvals', recordId: 'APR-1002' } },
];

// ── Seed audit log — 40 historical events spanning users, modules, severities ─
// Used by the Loss Prevention portal's Live Journal so it's not empty on first load.
const INITIAL_AUDIT_LOG = [
  // Inventory — high-signal shrinkage-relevant events
  { id: 'AUD-1040', at: HOURS_AGO(1),   userId: 'U008', userName: 'Rachel B.',   moduleId: 'inventory',    action: 'lot.qty.adjust',     entityType: 'lot', entityId: 'LOT-A',         summary: 'Adjusted Ground Beef LOT-A from 60 to 58 cases', before: { qty: 60 }, after: { qty: 58 }, severity: 'notice' },
  { id: 'AUD-1039', at: HOURS_AGO(2),   userId: 'U001', userName: 'Carlos M.',   moduleId: 'inventory',    action: 'sku.create',         entityType: 'sku', entityId: 'PRO-CAR-01',    summary: 'Registered new SKU: Organic Carrots 25lb', before: null, after: { sku: 'PRO-CAR-01', name: 'Organic Carrots 25lb' }, severity: 'info' },
  { id: 'AUD-1038', at: HOURS_AGO(3),   userId: 'U008', userName: 'Rachel B.',   moduleId: 'inventory',    action: 'qc.hold.release',    entityType: 'lot', entityId: 'LOT-CH-1',      summary: 'Released QC hold on Jumbo Chicken LOT-CH-1 — temp recheck passed', before: { qcHold: true }, after: { qcHold: false }, severity: 'info' },
  { id: 'AUD-1037', at: HOURS_AGO(4),   userId: 'U008', userName: 'Rachel B.',   moduleId: 'inventory',    action: 'scanner.in',         entityType: 'lot', entityId: 'LOT-OIL-2',     summary: 'Received 12 cases Vegetable Oil 5 Gal via barcode scanner (no linked PO)', before: { qty: 23 }, after: { qty: 35 }, severity: 'warning' },
  { id: 'AUD-1036', at: HOURS_AGO(6),   userId: 'U007', userName: 'Alex T.',     moduleId: 'inventory',    action: 'lot.delete',         entityType: 'lot', entityId: 'LOT-EXPIRED-1', summary: 'Deleted expired lot LOT-EXPIRED-1 (Brioche Buns, 4 cases, expired 5/15)', before: { qty: 4, expiry: '2026-05-15' }, after: null, severity: 'notice' },
  { id: 'AUD-1035', at: HOURS_AGO(8),   userId: 'U003', userName: 'Marcus T.',   moduleId: 'inventory',    action: 'scanner.out',        entityType: 'lot', entityId: 'LOT-T-2',       summary: 'Removed 2 cases Roma Tomatoes via scanner (reason: damaged on receipt)', before: { qty: 37 }, after: { qty: 35 }, severity: 'notice' },
  { id: 'AUD-1034', at: HOURS_AGO(22),  userId: 'U001', userName: 'Carlos M.',   moduleId: 'inventory',    action: 'lot.qty.adjust',     entityType: 'lot', entityId: 'LOT-CHE-2',     summary: 'Adjusted American Cheese LOT-CHE-2 from 45 to 42 (cycle count variance)', before: { qty: 45 }, after: { qty: 42 }, severity: 'warning' },

  // Procurement — PO lifecycle
  { id: 'AUD-1033', at: HOURS_AGO(5),   userId: 'U010', userName: 'Dana P.',     moduleId: 'procurement',  action: 'po.send',            entityType: 'po',  entityId: 'PO-AP-0884',    summary: 'Sent PO-AP-0884 to Sysco Corporation ($3,470.50)', before: { status: 'Draft' }, after: { status: 'Sent' }, severity: 'info' },
  { id: 'AUD-1032', at: HOURS_AGO(7),   userId: 'U008', userName: 'Rachel B.',   moduleId: 'procurement',  action: 'po.receive',         entityType: 'po',  entityId: 'PO-AP-0881',    summary: 'Received PO-AP-0881 from US Foods Distribution (full receipt, all 3 lines)', before: { status: 'Sent' }, after: { status: 'Received' }, severity: 'info' },
  { id: 'AUD-1031', at: HOURS_AGO(11),  userId: 'U010', userName: 'Dana P.',     moduleId: 'procurement',  action: 'po.receive.partial', entityType: 'po',  entityId: 'PO-AP-0882',    summary: 'Partially received PO-AP-0882 — 8 cases shrimp short-shipped', before: { status: 'Sent' }, after: { status: 'Partially Received' }, severity: 'notice' },
  { id: 'AUD-1030', at: HOURS_AGO(26),  userId: 'U010', userName: 'Dana P.',     moduleId: 'procurement',  action: 'po.cancel',          entityType: 'po',  entityId: 'PO-AP-0879',    summary: 'Cancelled PO-AP-0879 — Gulf Coast vendor out of stock', before: { status: 'Draft' }, after: { status: 'Cancelled' }, severity: 'notice' },

  // Logistics — Pack & Weigh + dispatch
  { id: 'AUD-1029', at: HOURS_AGO(2),   userId: 'U007', userName: 'Alex T.',     moduleId: 'logistics',    action: 'packWeigh.confirm',  entityType: 'order', entityId: 'SO-9895',     summary: 'Pack & Weigh confirmed: Ground Beef 10 cases → 103.4 lb (+3.4% variance)', before: null, after: { actualWeight: 103.4, variance: 3.4 }, severity: 'info' },
  { id: 'AUD-1028', at: HOURS_AGO(2),   userId: 'U007', userName: 'Alex T.',     moduleId: 'logistics',    action: 'dispatch',           entityType: 'truck', entityId: 'TRK-01',      summary: 'Dispatched TRK-01 (Marcus T.) — 2 stops on Route-12', before: { status: 'Available' }, after: { status: 'Dispatched' }, severity: 'info' },
  { id: 'AUD-1027', at: HOURS_AGO(3),   userId: 'U003', userName: 'Marcus T.',   moduleId: 'logistics',    action: 'pod.complete',       entityType: 'order', entityId: 'SO-9895',     summary: 'POD captured at Magnolia Bistro (signature on file)', before: { status: 'Out for Delivery' }, after: { status: 'Delivered' }, severity: 'info' },
  { id: 'AUD-1026', at: HOURS_AGO(3),   userId: 'U004', userName: 'Darnell W.',  moduleId: 'logistics',    action: 'osd.report',         entityType: 'order', entityId: 'SO-9882',     summary: 'OS&D reported: 1 case damaged (Brioche Buns) — photo evidence on file', before: null, after: { osd: 'damaged' }, severity: 'warning' },
  { id: 'AUD-1025', at: HOURS_AGO(5),   userId: 'U007', userName: 'Alex T.',     moduleId: 'logistics',    action: 'packWeigh.confirm',  entityType: 'order', entityId: 'SO-9896',     summary: 'Pack & Weigh: Chicken (-2.7%) + Beef (+7.75%) variance — within tolerance', before: null, after: { actualWeights: [81.7, 86.2] }, severity: 'notice' },

  // Accounting
  { id: 'AUD-1024', at: HOURS_AGO(4),   userId: 'U002', userName: 'Samantha K.', moduleId: 'accounting',   action: 'invoice.create',     entityType: 'invoice', entityId: 'INV-506',  summary: 'Invoice INV-506 created from Logistics delivery SO-9893 ($1,910.05)', before: null, after: { amount: 1910.05, customer: 'Bayou Grill & Pub' }, severity: 'info' },
  { id: 'AUD-1023', at: HOURS_AGO(7),   userId: 'U002', userName: 'Samantha K.', moduleId: 'accounting',   action: 'payment.record',     entityType: 'payment', entityId: 'PMT-091',  summary: 'Recorded payment $8,450 from Metro Restaurant Group — check #4421', before: null, after: { amount: 8450, method: 'check' }, severity: 'info' },
  { id: 'AUD-1022', at: HOURS_AGO(12),  userId: 'U002', userName: 'Samantha K.', moduleId: 'accounting',   action: 'check.write',        entityType: 'check', entityId: 'CHK-1046',    summary: 'Wrote check CHK-1046 to Gordon Food Service ($1,800)', before: null, after: { amount: 1800 }, severity: 'info' },
  { id: 'AUD-1021', at: HOURS_AGO(36),  userId: 'U002', userName: 'Samantha K.', moduleId: 'accounting',   action: 'reconcile.complete', entityType: 'reconcile', entityId: 'REC-2026-04', summary: 'Completed bank reconciliation — First National Operating ($84,320.15 cleared)', before: null, after: { difference: 0 }, severity: 'info' },

  // Approvals — decisions
  { id: 'AUD-1020', at: HOURS_AGO(46),  userId: 'U010', userName: 'Dana P.',     moduleId: 'approvals',    action: 'approve',            entityType: 'approval', entityId: 'APR-0999', summary: 'Approved discount override for City Hospital Cafe (18% on dairy line)', before: { status: 'pending' }, after: { status: 'approved' }, severity: 'info' },
  { id: 'AUD-1019', at: HOURS_AGO(73),  userId: 'U010', userName: 'Dana P.',     moduleId: 'approvals',    action: 'reject',             entityType: 'approval', entityId: 'APR-0987', summary: 'Rejected credit limit increase request for Sunset Diner ($15K → $40K)', before: { status: 'pending' }, after: { status: 'rejected' }, severity: 'notice' },

  // CRM
  { id: 'AUD-1018', at: HOURS_AGO(14),  userId: 'U009', userName: 'Jordan L.',   moduleId: 'crm',          action: 'credit.hold.set',    entityType: 'customer', entityId: 'CUST-503', summary: 'Placed Sunset Diner & Grill on credit hold (90+ aging $10K)', before: { creditHold: false }, after: { creditHold: true }, severity: 'notice' },
  { id: 'AUD-1017', at: HOURS_AGO(38),  userId: 'U009', userName: 'Jordan L.',   moduleId: 'crm',          action: 'customer.update',    entityType: 'customer', entityId: 'CUST-501', summary: 'Updated contact info for Joe\'s Steakhouse (phone change)', before: { phone: '(813)555-0100' }, after: { phone: '(504)555-0100' }, severity: 'info' },

  // Field Sales
  { id: 'AUD-1016', at: HOURS_AGO(4),   userId: 'U009', userName: 'Jordan L.',   moduleId: 'field',        action: 'order.submit',       entityType: 'order', entityId: 'ORD-9824',    summary: 'Submitted on-behalf order for Crescent Café ($415)', before: null, after: { amount: 415 }, severity: 'info' },
  { id: 'AUD-1015', at: HOURS_AGO(18),  userId: 'U009', userName: 'Jordan L.',   moduleId: 'field',        action: 'payment.collect',    entityType: 'payment', entityId: 'PMT-088',   summary: 'Collected cash payment $640 from Riverside Tavern', before: null, after: { method: 'cash', amount: 640 }, severity: 'info' },
  { id: 'AUD-1014', at: HOURS_AGO(28),  userId: 'U009', userName: 'Jordan L.',   moduleId: 'field',        action: 'lead.create',        entityType: 'lead', entityId: 'LEAD-004',      summary: 'Captured new lead: Bourbon Street Tavern at current location', before: null, after: { stage: 'New' }, severity: 'info' },

  // B2B Portal
  { id: 'AUD-1013', at: HOURS_AGO(6),   userId: 'U006', userName: 'James P.',    moduleId: 'b2b',          action: 'login.success',      entityType: 'session', entityId: 'SESSION-x',  summary: 'B2B portal login (Joe\'s Steakhouse Downtown)', before: null, after: null, severity: 'info' },

  // Users / Settings — admin actions
  { id: 'AUD-1012', at: HOURS_AGO(50),  userId: 'U001', userName: 'Carlos M.',   moduleId: 'users',        action: 'role.change',        entityType: 'user', entityId: 'U010',          summary: 'Promoted Dana P. from accountant to manager', before: { role: 'accountant' }, after: { role: 'manager' }, severity: 'warning' },
  { id: 'AUD-1011', at: HOURS_AGO(58),  userId: 'U001', userName: 'Carlos M.',   moduleId: 'settings',     action: 'feature.toggle',     entityType: 'feature', entityId: 'fefoEnforcement', summary: 'Enabled feature flag: FEFO Enforcement', before: { enabled: false }, after: { enabled: true }, severity: 'info' },

  // Older — last 10 days, for spread
  { id: 'AUD-1010', at: HOURS_AGO(72),  userId: 'U008', userName: 'Rachel B.',   moduleId: 'inventory',    action: 'scanner.out',        entityType: 'lot', entityId: 'LOT-CHE-1',     summary: 'Removed 3 cases American Cheese via scanner (reason: spoilage)', before: { qty: 48 }, after: { qty: 45 }, severity: 'notice' },
  { id: 'AUD-1009', at: HOURS_AGO(96),  userId: 'U007', userName: 'Alex T.',     moduleId: 'logistics',    action: 'route.optimize',     entityType: 'route', entityId: 'Route-12',    summary: 'AI-optimized Route-12 stop sequence (4 stops)', before: null, after: { stops: 4 }, severity: 'info' },
  { id: 'AUD-1008', at: HOURS_AGO(108), userId: 'U001', userName: 'Carlos M.',   moduleId: 'inventory',    action: 'lot.qty.adjust',     entityType: 'lot', entityId: 'LOT-OIL-1',     summary: 'Adjusted Vegetable Oil LOT-OIL-1 from 25 to 20 (manual cycle count)', before: { qty: 25 }, after: { qty: 20 }, severity: 'warning' },
  { id: 'AUD-1007', at: HOURS_AGO(132), userId: 'U008', userName: 'Rachel B.',   moduleId: 'inventory',    action: 'scanner.in',         entityType: 'lot', entityId: 'LOT-T-1',       summary: 'Received 20 cases Roma Tomatoes via scanner (linked PO-AP-0883)', before: { qty: 15 }, after: { qty: 35 }, severity: 'info' },
  { id: 'AUD-1006', at: HOURS_AGO(156), userId: 'U002', userName: 'Samantha K.', moduleId: 'accounting',   action: 'invoice.void',       entityType: 'invoice', entityId: 'INV-498',  summary: 'Voided invoice INV-498 — duplicate of INV-499', before: { status: 'Open' }, after: { status: 'Void' }, severity: 'warning' },
  { id: 'AUD-1005', at: HOURS_AGO(180), userId: 'U001', userName: 'Carlos M.',   moduleId: 'lossPrevention', action: 'lockdown.toggle',  entityType: 'setting', entityId: 'strictInventoryControl', summary: 'Disabled strict inventory control (was enabled earlier this week)', before: { enabled: true }, after: { enabled: false }, severity: 'warning' },
  { id: 'AUD-1004', at: HOURS_AGO(204), userId: 'U008', userName: 'Rachel B.',   moduleId: 'inventory',    action: 'scanner.in',         entityType: 'lot', entityId: 'LOT-BUN-3',     summary: 'Received 8 cases Brioche Buns via scanner (no linked PO)', before: null, after: { qty: 8 }, severity: 'warning' },
  { id: 'AUD-1003', at: HOURS_AGO(228), userId: 'U010', userName: 'Dana P.',     moduleId: 'procurement',  action: 'po.create',          entityType: 'po', entityId: 'PO-AP-0883',     summary: 'Built new PO-AP-0883 for Sysco Corporation ($5,450)', before: null, after: { amount: 5450 }, severity: 'info' },
  { id: 'AUD-1002', at: HOURS_AGO(264), userId: 'U007', userName: 'Alex T.',     moduleId: 'logistics',    action: 'packWeigh.confirm',  entityType: 'order', entityId: 'SO-9810',     summary: 'Pack & Weigh: Salmon 30 cases → 152.1 lb (+1.4% variance)', before: null, after: { actualWeight: 152.1 }, severity: 'info' },
  { id: 'AUD-1001', at: HOURS_AGO(300), userId: 'U001', userName: 'Carlos M.',   moduleId: 'users',        action: 'user.create',        entityType: 'user', entityId: 'U010',          summary: 'Created user account Dana P. (accountant)', before: null, after: { role: 'accountant' }, severity: 'info' },
];

// ── Context ───────────────────────────────────────────────────────────────────
const KernalContext = createContext(null);

export function KernalProvider({ children }) {
  // ── Supabase auth state ───────────────────────────────────────────────────
  const [authUser,    setAuthUser]    = useState(null);   // supabase User object
  const [authLoading, setAuthLoading] = useState(true);   // true until first session check resolves

  // Listen for login/logout events
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login  = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const logout = ()                => supabase.auth.signOut();

  // ── Live API data (populated once auth is ready) ──────────────────────────
  // These mirror the backend tables and are available to all modules via context.
  // Modules may still maintain their own enriched local state; these are the
  // ground-truth records from the DB.
  const [apiProducts,  setApiProducts]  = useState([]);
  const [apiInventory, setApiInventory] = useState([]);
  const [apiCustomers, setApiCustomers] = useState([]);
  const [apiOrders,    setApiOrders]    = useState([]);
  const [apiLoading,   setApiLoading]   = useState(false);
  const [apiError,     setApiError]     = useState(null);

  // Fetch core data once the user signs in
  useEffect(() => {
    if (!authUser) {
      // Clear API state on logout
      setApiProducts([]);
      setApiInventory([]);
      setApiCustomers([]);
      setApiOrders([]);
      return;
    }
    let cancelled = false;
    setApiLoading(true);
    setApiError(null);

    Promise.all([
      api.products.list({ limit: 500 }),
      api.inventory.list({ limit: 500 }),
      api.customers.list({ limit: 500 }),
      api.orders.list({ limit: 100 }),
    ])
      .then(([prod, inv, cust, ord]) => {
        if (cancelled) return;
        setApiProducts(prod.data  || []);
        setApiInventory(inv.data  || []);
        setApiCustomers(cust.data || []);
        setApiOrders(ord.data     || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[Kernel API] Initial data load failed:', err);
        setApiError(err.message);
      })
      .finally(() => { if (!cancelled) setApiLoading(false); });

    return () => { cancelled = true; };
  }, [authUser]);

  // Convenience refreshers for individual collections
  const refreshProducts  = () => api.products.list({ limit: 500 }).then(r => setApiProducts(r.data  || []));
  const refreshInventory = () => api.inventory.list({ limit: 500 }).then(r => setApiInventory(r.data || []));
  const refreshCustomers = () => api.customers.list({ limit: 500 }).then(r => setApiCustomers(r.data || []));
  const refreshOrders    = () => api.orders.list({ limit: 100 }).then(r => setApiOrders(r.data || []));

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [users,    setUsers]    = useState(INITIAL_USERS);
  // Live copy of role permission profiles — editable by admin at runtime
  const [roleProfiles, setRoleProfiles] = useState(() => ({ ...ROLE_PERMISSIONS }));
  const [draftReorderPOs, setDraftReorderPOs] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState(INITIAL_APPROVAL_REQUESTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  // ── Pending invoices — Logistics pushes a delivered-order invoice payload here,
  // Accounting drains it on mount and adds entries to its local AR state. ───
  const [pendingInvoices, setPendingInvoices] = useState([]);
  // ── Quick Create action — one-shot signal fired by the sidebar's "+ New" menu.
  // Each target module watches this and opens its create-modal when the action
  // matches, then calls clearQuickCreateAction. ─────────────────────────────
  const [activeLocation, setActiveLocation] = useState('all');
  const [quickCreateAction, setQuickCreateAction] = useState(null);
  // ── Audit log — append-only event stream for Loss Prevention. Modules emit
  // events via logAudit(); the Loss Prevention portal reads them. ─────────
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT_LOG);
  // ── Document Attachments — keyed by recordId (e.g. 'PO-AP-0881', 'CUST-101')
  // Each entry: { id, name, size, mimeType, dataUrl, uploadedBy, uploadedAt, tag }
  const [attachments, setAttachments] = useState(() => {
    const mock = (id, name, size, mimeType, uploadedBy, uploadedAt, tag) =>
      ({ id, name, size, mimeType, dataUrl: null, uploadedBy, uploadedAt, tag, isMock: true });
    return {
      // POs / Receiving
      'PO-AP-0881': [
        mock('att-001', 'US_Foods_COA_FrozenStrips_Lot22B.pdf', 284_210, 'application/pdf', 'Maria Chen', '2026-04-12 09:14', 'COA'),
        mock('att-002', 'Receiving_Inspection_PO-0881.jpg',     1_842_300, 'image/jpeg',       'Luis Vega',  '2026-04-12 11:02', 'Inspection'),
        mock('att-003', 'Temp_Log_Frozen_Apr12.pdf',            98_450,  'application/pdf', 'Luis Vega',  '2026-04-12 11:03', 'Temp Log'),
      ],
      'PO-AP-0882': [
        mock('att-004', 'Partial_Receiving_Photo_0882.jpg',     2_104_800, 'image/jpeg',       'Luis Vega',  '2026-04-28 14:20', 'Inspection'),
        mock('att-005', 'Sysco_COA_Dairy_Apr2026.pdf',          193_600, 'application/pdf', 'Maria Chen', '2026-04-28 14:25', 'COA'),
      ],
      'PO-AP-0883': [
        mock('att-006', 'Sysco_Produce_COA_May2026.pdf',        221_340, 'application/pdf', 'Maria Chen', '2026-05-03 08:50', 'COA'),
      ],
      // Deliveries / PODs
      'SO-9893': [
        mock('att-010', 'POD_SO-9893_Signed.jpg',               3_241_000, 'image/jpeg',       'D. Boudreaux', '2026-05-22 15:44', 'Signed POD'),
      ],
      'SO-9895': [
        mock('att-011', 'POD_SO-9895_WeightTicket.pdf',         88_100,  'application/pdf', 'D. Boudreaux', '2026-05-20 16:10', 'Weight Ticket'),
        mock('att-012', 'POD_SO-9895_Signed.jpg',              2_980_000, 'image/jpeg',       'D. Boudreaux', '2026-05-20 16:11', 'Signed POD'),
      ],
      'SO-9896': [
        mock('att-013', 'POD_SO-9896_CustomerSignature.jpg',   1_760_000, 'image/jpeg',       'J. Park',  '2026-05-21 14:33', 'Signed POD'),
      ],
      // Customers
      'CUST-101': [
        mock('att-020', 'Metro_Pricing_Agreement_2026.pdf',     410_500, 'application/pdf', 'Carlos M.',  '2026-01-08 10:00', 'Contract'),
      ],
      'CUST-105': [
        mock('att-021', 'School_District_Contract_FY2026.pdf', 1_024_000, 'application/pdf', 'Carlos M.',  '2025-07-01 09:00', 'Contract'),
        mock('att-022', 'Credit_Application_CUST-105.pdf',      340_200, 'application/pdf', 'Carlos M.',  '2025-06-28 14:15', 'Credit App'),
        mock('att-023', 'Net45_Approval_SchoolDistrict.pdf',    88_900,  'application/pdf', 'Carlos M.',  '2025-07-01 09:20', 'Terms'),
      ],
      'CUST-103': [
        mock('att-024', 'Harbor_View_Hotel_Contract_2026.pdf',  512_800, 'application/pdf', 'Carlos M.',  '2026-02-14 11:00', 'Contract'),
      ],
      // Lots / Inventory
      'LOT-FRZ-22B': [
        mock('att-030', 'COA_FrozenStrips_Lot22B_USDA.pdf',    302_400, 'application/pdf', 'Maria Chen', '2026-04-10 08:00', 'USDA COA'),
        mock('att-031', 'HACCP_Log_FrozenStrips_Apr2026.pdf',   178_200, 'application/pdf', 'Maria Chen', '2026-04-10 08:05', 'HACCP Log'),
      ],
      'LOT-DAI-09A': [
        mock('att-032', 'COA_Dairy_Lot09A_Apr2026.pdf',         211_300, 'application/pdf', 'Maria Chen', '2026-04-28 09:00', 'COA'),
      ],
    };
  });

  const addAttachment = (recordId, attachment) =>
    setAttachments(prev => ({
      ...prev,
      [recordId]: [...(prev[recordId] || []), attachment],
    }));

  const removeAttachment = (recordId, attachmentId) =>
    setAttachments(prev => ({
      ...prev,
      [recordId]: (prev[recordId] || []).filter(a => a.id !== attachmentId),
    }));

  const getAttachments = (recordId) => attachments[recordId] || [];

  const addDraftReorderPO = (po) =>
    setDraftReorderPOs(prev => {
      // Prevent duplicates by sku — replace if already queued
      const filtered = prev.filter(p => !p.items.some(i => po.items.some(pi => pi.sku === i.sku)));
      return [...filtered, po];
    });
  const removeDraftReorderPO = (poNumber) =>
    setDraftReorderPOs(prev => prev.filter(p => p.poNumber !== poNumber));
  const clearDraftReorderPOs = () => setDraftReorderPOs([]);

  // ── Pending invoices bridge (Logistics → Accounting) ───────────────────────
  // addPendingInvoice(invoiceObj) — Logistics pushes an invoice draft
  //   built from a delivered order. AccountingModule's effect drains the queue.
  // consumePendingInvoices() — returns the current pending list and clears it.
  const addPendingInvoice = (invoice) =>
    setPendingInvoices(prev => [...prev, { ...invoice, queuedAt: new Date().toISOString() }]);
  const consumePendingInvoices = () => {
    const drained = pendingInvoices;
    setPendingInvoices([]);
    return drained;
  };
  const removePendingInvoice = (id) =>
    setPendingInvoices(prev => prev.filter(p => p.id !== id));

  // ── Quick Create signal helpers ────────────────────────────────────────────
  const fireQuickCreate     = (action) => setQuickCreateAction(action);
  const clearQuickCreateAction = () => setQuickCreateAction(null);

  // ── Audit log API ──────────────────────────────────────────────────────────
  // Modules call logAudit({moduleId, action, entityType, entityId, summary,
  // before, after, severity}); user + timestamp + id auto-fill. Severity:
  // 'info' | 'notice' | 'warning' | 'critical'.
  const nextAuditId = () => {
    const max = auditLog.reduce((m, e) => {
      const n = parseInt(String(e.id).replace(/[^0-9]/g, ''), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 1040);
    return `AUD-${max + 1}`;
  };
  const logAudit = (evt) => {
    const user = users.find(u => u.id === activeUserId) || users[0];
    const event = {
      id: nextAuditId(),
      at: new Date().toISOString(),
      userId: user?.id,
      userName: user?.name || '—',
      severity: 'info',
      ...evt,
    };
    setAuditLog(prev => [event, ...prev]);
    return event;
  };
  // Filtered views used by the Loss Prevention portal
  const auditLogForUser = (userId) => auditLog.filter(e => e.userId === userId);
  const auditLogForModule = (moduleId) => auditLog.filter(e => e.moduleId === moduleId);
  const [activeUserId, setActiveUserId] = useState('U001'); // start as admin (Carlos)

  const activeUser = users.find(u => u.id === activeUserId) || users[0];

  // Deep-update a settings field: updateSetting('features.refrigeratedFoods', true)
  const updateSetting = (path, value) => {
    const keys = path.split('.');
    setSettings(prev => {
      const next = { ...prev };
      let node = next;
      for (let i = 0; i < keys.length - 1; i++) {
        node[keys[i]] = { ...node[keys[i]] };
        node = node[keys[i]];
      }
      node[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateUser = (userId, patch) =>
    setUsers(prev => prev.map(u => u.id !== userId ? u : { ...u, ...patch }));

  const addUser = (user) =>
    setUsers(prev => [...prev, { id: `U${String(prev.length + 1).padStart(3,'0')}`, overrides:{}, active:true, ...user }]);

  // Returns true if a module is included in the current plan or active add-ons.
  // Used by main.jsx to decide whether to render the real module or a locked overlay.
  const isModuleUnlocked = (moduleId) => {
    const plan    = settings.plan || 'enterprise';
    const addOns  = settings.addOns || [];
    const planDef = PLANS[plan];
    if (!planDef) return true; // unknown plan → open
    if (planDef.modules.includes(moduleId)) return true;
    if (addOns.includes(moduleId)) return true;
    return false;
  };

  // Update a role profile permission — admin only, takes effect immediately for all users with that role
  const updateRoleProfile = (role, moduleId, value) => {
    setRoleProfiles(prev => ({
      ...prev,
      [role]: { ...prev[role], [moduleId]: value },
    }));
  };

  // Reset a role profile to factory defaults
  const resetRoleProfile = (role) => {
    setRoleProfiles(prev => ({
      ...prev,
      [role]: { ...(ROLE_PERMISSIONS[role] || {}) },
    }));
  };

  // Resolve a user's effective permission for a module.
  // Priority: user.overrides → live roleProfiles → 'none'
  const getPermission = (userId, moduleId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'none';
    if (user.overrides && user.overrides[moduleId] !== undefined) return user.overrides[moduleId];
    return roleProfiles[user.role]?.[moduleId] ?? 'none';
  };

  // Shortcut for active user
  const can = (moduleId) => getPermission(activeUserId, moduleId);

  // ── Approval workflow API ───────────────────────────────────────────────────
  // Generate a stable request id without collisions.
  const nextApprovalId = () => {
    const max = approvalRequests.reduce((m, r) => {
      const n = parseInt(r.id.replace(/[^0-9]/g, ''), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 1000);
    return `APR-${max + 1}`;
  };
  const nextNotificationId = () => {
    const max = notifications.reduce((m, n) => {
      const num = parseInt(n.id.replace(/[^0-9]/g, ''), 10);
      return Number.isFinite(num) && num > m ? num : m;
    }, 0);
    return `N-${String(max + 1).padStart(3, '0')}`;
  };

  // Push an in-app notification. This is the mock "email hook" — every flow
  // that decides or submits an approval fires one of these so the UI badge
  // can surface activity to the right roles/users.
  const addNotification = (n) => {
    const note = {
      id: nextNotificationId(),
      type: n.type || 'info',
      message: n.message || '',
      audience: n.audience || [],     // user ids or role names
      readBy: [],
      createdAt: new Date().toISOString(),
      link: n.link || null,
    };
    setNotifications(prev => [note, ...prev]);
    return note;
  };

  // Resolve the user ids who should be notified for a given approval rule.
  // The audience is everyone with one of the approver roles.
  const resolveApproverUserIds = (rule) => {
    if (!rule || !rule.approverRoles) return [];
    return users.filter(u => u.active && rule.approverRoles.includes(u.role)).map(u => u.id);
  };

  // Submit a new approval request. Caller passes flowType, title, summary,
  // payload (free-form details for the detail view), and optional threshold.
  // Returns the created request.
  const submitApprovalRequest = ({ flowType, title, summary, payload, threshold }) => {
    const rule = settings.approvalRules?.[flowType];
    const newReq = {
      id: nextApprovalId(),
      flowType,
      status: 'pending',
      requestedBy: activeUserId,
      requestedAt: new Date().toISOString(),
      title: title || '',
      summary: summary || '',
      threshold: typeof threshold === 'number' ? threshold : (rule?.threshold ?? 0),
      payload: payload || {},
      audit: [
        { at: new Date().toISOString(), userId: activeUserId, action: 'submitted', note: '' },
      ],
    };
    setApprovalRequests(prev => [newReq, ...prev]);
    // Notify approvers
    const approverIds = resolveApproverUserIds(rule);
    const flowMeta = APPROVAL_FLOW_TYPES[flowType];
    addNotification({
      type: 'approval_pending',
      message: `${flowMeta?.label || 'Approval'} requested: ${title || newReq.id}`,
      audience: approverIds,
      link: { moduleId: 'approvals', recordId: newReq.id },
    });
    return newReq;
  };

  // Decide on an approval — 'approved', 'rejected', or 'changes_requested'.
  // Returns the updated request and fires a notification back to the requester.
  const decideApproval = (requestId, decision, note = '') => {
    let updated = null;
    setApprovalRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      updated = {
        ...r,
        status: decision,
        decidedBy: activeUserId,
        decidedAt: new Date().toISOString(),
        audit: [
          ...(r.audit || []),
          { at: new Date().toISOString(), userId: activeUserId, action: decision, note },
        ],
      };
      return updated;
    }));
    if (updated) {
      const deciderName = users.find(u => u.id === activeUserId)?.name || 'Reviewer';
      const verb = decision === 'approved' ? 'approved'
                 : decision === 'rejected' ? 'rejected'
                 : 'requested changes on';
      addNotification({
        type: 'approval_decision',
        message: `${deciderName} ${verb} "${updated.title}".${note ? ` Note: ${note}` : ''}`,
        audience: [updated.requestedBy],
        link: { moduleId: 'approvals', recordId: updated.id },
      });
      // Mirror to the central audit journal
      const audUser = users.find(u => u.id === activeUserId) || users[0];
      const audSev  = decision === 'rejected' ? 'warning' : decision === 'changes_requested' ? 'notice' : 'info';
      setAuditLog(prev => [{
        id: nextAuditId(),
        at: new Date().toISOString(),
        userId: audUser?.id,
        userName: audUser?.name || '—',
        moduleId: 'approvals',
        action: decision === 'approved' ? 'approve' : decision === 'rejected' ? 'reject' : 'request.changes',
        entityType: 'approval',
        entityId: updated.id,
        summary: `${verb.charAt(0).toUpperCase() + verb.slice(1)} approval: ${updated.title}`,
        before: { status: 'pending' },
        after:  { status: decision },
        severity: audSev,
      }, ...prev]);
    }
    return updated;
  };

  // Cancel a request you submitted. Withdraws it from the inbox.
  const cancelApprovalRequest = (requestId) => {
    setApprovalRequests(prev => prev.map(r => r.id !== requestId ? r : {
      ...r,
      status: 'cancelled',
      audit: [...(r.audit || []), { at: new Date().toISOString(), userId: activeUserId, action: 'cancelled', note: '' }],
    }));
  };

  // Filter helpers used by ApprovalsModule.
  const pendingApprovalsForUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    return approvalRequests.filter(r => {
      if (r.status !== 'pending') return false;
      const rule = settings.approvalRules?.[r.flowType];
      if (!rule) return false;
      return rule.approverRoles?.includes(user.role);
    });
  };
  const approvalsRequestedByUser = (userId) => approvalRequests.filter(r => r.requestedBy === userId);

  // Notification helpers.
  const notificationsForUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    return notifications.filter(n => {
      if (!n.audience || n.audience.length === 0) return true;
      // audience can contain user ids OR role names
      return n.audience.includes(userId) || n.audience.includes(user.role);
    });
  };
  const unreadNotificationCountForUser = (userId) =>
    notificationsForUser(userId).filter(n => !n.readBy.includes(userId)).length;
  const markNotificationRead = (notificationId, userId) =>
    setNotifications(prev => prev.map(n =>
      n.id !== notificationId || n.readBy.includes(userId) ? n : { ...n, readBy: [...n.readBy, userId] }
    ));
  const markAllNotificationsRead = (userId) =>
    setNotifications(prev => prev.map(n =>
      n.readBy.includes(userId) ? n : { ...n, readBy: [...n.readBy, userId] }
    ));

  // Update an approval rule. Path is just the flow type.
  const updateApprovalRule = (flowType, patch) => {
    setSettings(prev => ({
      ...prev,
      approvalRules: {
        ...prev.approvalRules,
        [flowType]: { ...prev.approvalRules[flowType], ...patch },
      },
    }));
  };

  // Does this flow type require approval at this threshold value?
  // Used by Procurement / CRM before they take the underlying action.
  const requiresApproval = (flowType, measuredValue = 0) => {
    if (!settings.features?.approvalWorkflows) return false;
    const rule = settings.approvalRules?.[flowType];
    if (!rule || !rule.enabled) return false;
    return Number(measuredValue) > Number(rule.threshold);
  };

  return (
    <KernalContext.Provider value={{
      // ── Auth ──────────────────────────────────────────────────────────────
      authUser, authLoading, login, logout,
      // ── Live API data ──────────────────────────────────────────────────────
      apiProducts, apiInventory, apiCustomers, apiOrders,
      apiLoading, apiError,
      refreshProducts, refreshInventory, refreshCustomers, refreshOrders,
      // ── App state ─────────────────────────────────────────────────────────
      settings, updateSetting,
      activeLocation, setActiveLocation,
      users, updateUser, addUser,
      activeUser, activeUserId, setActiveUserId,
      roleProfiles, updateRoleProfile, resetRoleProfile,
      getPermission, can, isModuleUnlocked,
      draftReorderPOs, addDraftReorderPO, removeDraftReorderPO, clearDraftReorderPOs,
      // Pending-invoice bridge (Logistics → Accounting)
      pendingInvoices, addPendingInvoice, consumePendingInvoices, removePendingInvoice,
      // Quick Create signal
      quickCreateAction, fireQuickCreate, clearQuickCreateAction,
      // Audit log
      auditLog, logAudit, auditLogForUser, auditLogForModule,
      // Approval workflow
      approvalRequests,
      submitApprovalRequest, decideApproval, cancelApprovalRequest,
      pendingApprovalsForUser, approvalsRequestedByUser,
      requiresApproval, updateApprovalRule,
      // Notifications
      notifications,
      notificationsForUser, unreadNotificationCountForUser,
      markNotificationRead, markAllNotificationsRead,
      // Document Attachments
      attachments, addAttachment, removeAttachment, getAttachments,
    }}>
      {children}
    </KernalContext.Provider>
  );
}

export function useKernal() {
  const ctx = useContext(KernalContext);
  if (!ctx) throw new Error('useKernal must be used inside KernalProvider');
  return ctx;
}
