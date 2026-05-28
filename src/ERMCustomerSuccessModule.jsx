import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';

import { Modal, ModalOverlay, Overlay, ModalBox, ModalHeader, DocModalHeader } from './shared/Modal.jsx';
import AttachmentsPanel from './shared/AttachmentsPanel.jsx';
import RecordHistory from './shared/RecordHistory.jsx';

import { TODAY, StatusBadge, PrintButton, ExportButton } from './shared/components.jsx';

import { MOCK_INVENTORY, INVENTORY_BY_ID, INVENTORY_BY_SKU } from './shared/mockInventory.js';
import { DEMO_MODE } from './lib/demoMode.js';
import { api } from './lib/api.js';

import {
  Search, ArrowLeft, Save, Settings, TrendingUp, TrendingDown, Package, Truck, User, RefreshCw,
  DollarSign, AlertCircle, CheckCircle2, Building, Calendar, CreditCard,
  Plus, Trash2, X, Sparkles, Phone, Mail, FileText, Activity, HeartPulse,
  Target, ArrowRight, PieChart, UserPlus, File, UploadCloud, DownloadCloud,
  MapPin, Briefcase, Contact2, Ticket, Workflow, Zap, ListTodo, CheckSquare,
  Square, Clock, MessageSquare, Smile, Meh, Frown, Send, Unlock,
  BarChart3, Award, ChevronDown, ChevronUp, Users,
  BadgeDollarSign, Percent, Receipt,
} from 'lucide-react';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_PLAYBOOKS = [
  { id: 'pb-1', name: 'Collections Escalation (90+ Days)', trigger: 'A/R > 90 Days',              action: 'Suspend B2B, Alert Finance'               },
  { id: 'pb-2', name: 'QBR Reminders',                     trigger: '90 days since last meeting',  action: 'Create Task, Email Rep'                   },
  { id: 'pb-3', name: 'Churn Risk Watchlist',               trigger: 'Health Score < 50',           action: 'Weekly Alert to VP'                       },
  { id: 'pb-4', name: 'New Account Onboarding',             trigger: 'Account created',             action: 'Send Welcome Sequence, 7-day check-in'    },
];

const MOCK_CUSTOMERS = [
  {
    id: 'CUST-501', name: "Joe's Steakhouse – Downtown", dba: "Joe's Downtown",
    taxId: 'XX-XXXX123', industry: 'Restaurant & Hospitality',
    address: { street: '123 Prime Ave', city: 'Tampa', state: 'FL', zip: '33602' },
    contacts: [
      { id: 'c1', name: 'Joseph Miller',  title: 'Owner',     phone: '(813) 555-0100', email: 'joe@joessteak.com',    isPrimary: true,  portalStatus: 'Active'      },
      { id: 'c2', name: 'Amanda Smith',   title: 'Head Chef', phone: '(813) 555-0102', email: 'kitchen@joessteak.com', isPrimary: false, portalStatus: 'Not Invited' },
    ],
    status: 'Active', healthScore: 92, churnRisk: 'Low',
    creditLimit: 50000, availableCredit: 12500, terms: 'Net-30',
    route: 'Route-12', deliveryDays: [2, 4],
    b2bPortalAccess: true, b2bProfileId: null, lastLogin: '2026-04-22T08:15:00Z',
    arAging: { current: 37500, days30: 0, days60: 0, days90: 0 }, creditHold: false,
    contractPricing: { '3': 79.00 },
    analytics: { ytdSpend: 145000, lytdSpend: 120000, deliverySuccessRate: 98.5,
      topSkus: [{ sku: 'FRZ-BEEF-01', name: 'Premium Ground Beef', qtyYtd: 850 }, { sku: 'DRY-RICE-50', name: 'Jasmine Rice 50lb', qtyYtd: 120 }] },
    npsData: { score: 65, history: [{ id: 'nps-1', date: '2026-03-10', score: 9, comment: 'Love the new b2b portal. Very easy to use.' }] },
    aiInsights: [
      { id: 1, type: 'opportunity', text: 'Due for re-order of Premium Ground Beef within 48 hours based on standard 14-day cycle.' },
      { id: 2, type: 'action',      text: "Cross-sell opportunity: Pitch 'Roma Tomatoes 25lb' — highly complementary to their recent volume." },
    ],
    activePlaybooks: [{ id: 'pb-2', name: 'QBR Reminders', status: 'Active', enrolledDate: '2026-01-15' }],
    whitespaceAnalysis: [
      { id: 1, category: 'Proteins (Beef/Pork)',  status: 'purchasing', peerAdoption: 98, estValue: null },
      { id: 2, category: 'Dry Goods & Pantry',    status: 'purchasing', peerAdoption: 88, estValue: null },
      { id: 3, category: 'Fresh Produce',         status: 'whitespace', peerAdoption: 92, recommendedSku: 'PRO-TOMA-01', recommendedName: 'Roma Tomatoes 25lb',      estValue: 14500 },
      { id: 4, category: 'Dairy & Eggs',          status: 'whitespace', peerAdoption: 75, recommendedSku: 'DAI-MILK-02', recommendedName: 'Whole Milk 1 Gal',         estValue:  5200 },
    ],
    recentActivity: [
      { id: 1, date: '2026-04-21', type: 'call',  note: 'Quarterly check-in. Chef is very happy with driver courtesy.' },
      { id: 2, date: '2026-04-15', type: 'email', note: 'Sent updated Q2 promotional pricing sheet.' },
    ],
    standingOrders: [
      { id: 'SO-TPL-001', name: 'Weekly Protein Run',   frequency: 'Weekly',    dayOfWeek: 2, nextGenDate: '2026-05-27', status: 'Active', items: 2 },
      { id: 'SO-TPL-002', name: 'Bi-Weekly Dry Goods',  frequency: 'Bi-weekly', dayOfWeek: 4, nextGenDate: '2026-06-04', status: 'Paused', items: 1 },
    ],
    tasks: [
      { id: 'tsk-1', title: 'Call Head Chef to pitch seasonal produce line', dueDate: '2026-04-25', type: 'Call', priority: 'High',   status: 'Pending'   },
      { id: 'tsk-2', title: 'Verify contract pricing update for Beef',        dueDate: '2026-04-18', type: 'Task', priority: 'Normal', status: 'Completed' },
    ],
    documents: [
      { id: 'doc-1', name: 'Master_Service_Agreement_2025.pdf', type: 'Contract',   date: '2025-01-12', size: '2.4 MB'  },
      { id: 'doc-2', name: 'Tax_Exempt_Cert_FL.pdf',            type: 'Compliance', date: '2025-01-14', size: '800 KB'  },
    ],
    tickets: [
      { id: 'TKT-1049', date: '2026-04-19', type: 'Portal Help', priority: 'Low',    status: 'Resolved', subject: 'Password reset assistance', description: "Chef Amanda couldn't login. Sent reset link." },
    ],
  },
  {
    id: 'CUST-502', name: 'City Hospital Cafe', dba: 'City Healthcare Food Services',
    taxId: 'XX-XXXX888', industry: 'Healthcare / Institution',
    address: { street: '400 Medical Center Dr', city: 'Tampa', state: 'FL', zip: '33612' },
    contacts: [
      { id: 'c3', name: 'Dr. Sarah Jenkins', title: 'Director of Operations', phone: '(813) 555-4000', email: 'sjenkins@cityhospital.org', isPrimary: true,  portalStatus: 'Not Invited' },
      { id: 'c4', name: 'Accounts Payable',   title: 'Billing',               phone: '(813) 555-4099', email: 'ap@cityhospital.org',         isPrimary: false, portalStatus: 'Not Invited' },
    ],
    status: 'Active', healthScore: 68, churnRisk: 'Medium', pricingTier: 'preferred',
    creditLimit: 100000, availableCredit: 98000, terms: 'Net-60',
    route: 'Route-03', deliveryDays: [1, 3, 5],
    b2bPortalAccess: false, b2bProfileId: null, lastLogin: null,
    arAging: { current: 1000, days30: 1000, days60: 0, days90: 0 }, creditHold: false,
    contractPricing: {},
    analytics: { ytdSpend: 85000, lytdSpend: 82000, deliverySuccessRate: 94.2,
      topSkus: [{ sku: 'PLT-CHICK-05', name: 'Jumbo Chicken Breasts', qtyYtd: 600 }, { sku: 'DAI-MILK-02', name: 'Whole Milk 1 Gal', qtyYtd: 1200 }] },
    npsData: { score: -15, history: [{ id: 'nps-2', date: '2026-04-12', score: 4, comment: 'Deliveries have been late twice this month.' }] },
    aiInsights: [
      { id: 1, type: 'risk',   text: 'Delivery success dropped by 3% this month. Frequent dock refusals reported by Logistics.' },
      { id: 2, type: 'action', text: 'Web portal access is disabled. Onboarding could reduce manual order entry time by 2 hours/week.' },
    ],
    activePlaybooks: [],
    whitespaceAnalysis: [
      { id: 1, category: 'Proteins (Poultry)',    status: 'purchasing', peerAdoption: 95, estValue: null },
      { id: 2, category: 'Dairy & Eggs',          status: 'purchasing', peerAdoption: 98, estValue: null },
      { id: 3, category: 'Proteins (Beef/Pork)',  status: 'whitespace', peerAdoption: 60, recommendedSku: 'FRZ-BEEF-01', recommendedName: 'Premium Ground Beef 80/20', estValue: 18000 },
      { id: 4, category: 'Fresh Produce',         status: 'whitespace', peerAdoption: 90, recommendedSku: 'PRO-TOMA-01', recommendedName: 'Roma Tomatoes 25lb',         estValue: 15000 },
    ],
    recentActivity: [
      { id: 1, date: '2026-04-20', type: 'meeting', note: 'On-site visit to discuss receiving dock bottleneck.'            },
      { id: 2, date: '2026-04-02', type: 'call',    note: 'Handled invoice dispute regarding a short-shipped chicken case.' },
    ],
    standingOrders: [],
    tasks: [{ id: 'tsk-3', title: 'Follow up on receiving dock bottleneck meeting', dueDate: '2026-04-22', type: 'Email', priority: 'High', status: 'Pending' }],
    documents: [{ id: 'doc-3', name: 'Delivery_SLA_Addendum.docx', type: 'Logistics', date: '2026-03-01', size: '1.1 MB' }],
    tickets: [
      { id: 'TKT-1088', date: '2026-04-22', type: 'OS&D (Returns)', priority: 'High',   status: 'Open',     subject: 'Refused Chicken Delivery', description: 'Pallet arrived above temperature parameters. Driver logged refusal. Pending credit memo.' },
      { id: 'TKT-1002', date: '2026-04-01', type: 'Billing',         priority: 'Normal', status: 'Resolved', subject: 'Invoice mismatch',          description: 'Corrected contract pricing mismatch for Milk.' },
    ],
  },
  {
    id: 'CUST-503', name: 'Sunset Diner & Grill', dba: 'Sunset Diner',
    taxId: 'XX-XXXX456', industry: 'Restaurant & Hospitality',
    address: { street: '8900 Gulf Blvd', city: 'St. Pete Beach', state: 'FL', zip: '33706' },
    contacts: [
      { id: 'c5', name: 'Mike Roberts', title: 'Owner/Operator', phone: '(727) 555-8900', email: 'mike@sunsetdiner.com', isPrimary: true, portalStatus: 'Suspended' },
    ],
    status: 'Inactive', healthScore: 24, churnRisk: 'High', pricingTier: 'standard',
    creditLimit: 15000, availableCredit: 0, terms: 'COD',
    route: 'Route-05', deliveryDays: [1, 5],
    b2bPortalAccess: false, b2bProfileId: null, lastLogin: '2025-11-10T14:20:00Z',
    arAging: { current: 0, days30: 0, days60: 5000, days90: 10000 }, creditHold: true,
    contractPricing: { '45': 30.00, '78': 19.50 },
    analytics: { ytdSpend: 4500, lytdSpend: 34000, deliverySuccessRate: 88.0,
      topSkus: [{ sku: 'PRO-TOMA-01', name: 'Roma Tomatoes 25lb', qtyYtd: 105 }] },
    npsData: { score: -80, history: [{ id: 'nps-3', date: '2026-02-05', score: 2, comment: 'Prices are too high and driver was rude.' }] },
    aiInsights: [
      { id: 1, type: 'risk',   text: 'Account severely past due. $10,000 sitting in 90+ days aging bucket.'  },
      { id: 2, type: 'action', text: 'Halt all pending deliveries. Escalate to collections team immediately.' },
    ],
    activePlaybooks: [
      { id: 'pb-1', name: 'Collections Escalation (90+ Days)', status: 'Triggered', enrolledDate: '2026-03-20' },
      { id: 'pb-3', name: 'Churn Risk Watchlist',               status: 'Active',    enrolledDate: '2026-04-01' },
    ],
    whitespaceAnalysis: [
      { id: 1, category: 'Fresh Produce',        status: 'purchasing', peerAdoption: 85, estValue: null },
      { id: 2, category: 'Proteins (Beef/Pork)', status: 'whitespace', peerAdoption: 95, recommendedSku: 'FRZ-BEEF-01', recommendedName: 'Premium Ground Beef 80/20', estValue: 8000 },
      { id: 3, category: 'Dry Goods & Pantry',   status: 'whitespace', peerAdoption: 80, recommendedSku: 'DRY-RICE-50', recommendedName: 'Jasmine Rice 50lb',          estValue: 3500 },
    ],
    recentActivity: [
      { id: 1, date: '2026-04-18', type: 'email', note: 'Final notice sent regarding outstanding 90-day balance.'     },
      { id: 2, date: '2026-04-10', type: 'call',  note: 'Left voicemail for owner requesting immediate callback.' },
    ],
    standingOrders: [],
    tasks: [{ id: 'tsk-4', title: 'Check status of collections account hold', dueDate: '2026-04-20', type: 'Task', priority: 'Critical', status: 'Pending' }],
    documents: [],
    tickets: [{ id: 'TKT-0912', date: '2026-03-20', type: 'Billing', priority: 'Critical', status: 'Open', subject: 'Collections Escalation', description: 'Moved to 90+ days past due. Locked portal access.' }],
  },
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' }, { id: 7, label: 'Sun' },
];

// ─── CUSTOMER REBATE SEED DATA ────────────────────────────────────────────────
const INIT_CUSTOMER_PROGRAMS = [
  {
    id: 'CRP-001',
    name: 'Q2 2026 Volume Growth Rebate',
    type: 'volume_growth',        // volume_growth | back_allowance | promo_fund
    description: 'Earn $0.50 per case on Proteins when Q2 spend exceeds $120k',
    category: 'Proteins',
    rateType: 'per_unit',         // per_unit | pct
    rateValue: 0.50,
    thresholdSpend: 120000,
    period: 'Q2 2026',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'Active',
    enrolledCustomers: ['CUST-501'],
  },
  {
    id: 'CRP-002',
    name: 'Annual Loyalty Back-Allowance',
    type: 'back_allowance',
    description: '2% back-allowance on all purchases for accounts spending $200k+ annually',
    category: 'All',
    rateType: 'pct',
    rateValue: 2.0,
    thresholdSpend: 200000,
    period: 'FY 2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'Active',
    enrolledCustomers: ['CUST-501'],
  },
  {
    id: 'CRP-003',
    name: 'Healthcare Promo Fund — Q2',
    type: 'promo_fund',
    description: '1.5% promotional allowance for Healthcare/Institutional accounts',
    category: 'All',
    rateType: 'pct',
    rateValue: 1.5,
    thresholdSpend: null,
    period: 'Q2 2026',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'Active',
    enrolledCustomers: ['CUST-502'],
  },
  {
    id: 'CRP-004',
    name: 'Q1 2026 Growth Rebate',
    type: 'volume_growth',
    description: '$0.35/case on Dairy for Q1 2026 purchases over $60k',
    category: 'Dairy',
    rateType: 'per_unit',
    rateValue: 0.35,
    thresholdSpend: 60000,
    period: 'Q1 2026',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    status: 'Closed',
    enrolledCustomers: ['CUST-502'],
  },
];

const INIT_CUSTOMER_ACCRUALS = [
  {
    id: 'CAC-001', programId: 'CRP-001', customerId: 'CUST-501',
    customerName: "Joe's Steakhouse – Downtown",
    ytdSpend: 145000, ytdUnits: 850,
    accruedAmount: 382.50,   // 765 qualifying units × $0.50 (spend threshold met)
    lastUpdated: '2026-05-20',
    status: 'Active',
  },
  {
    id: 'CAC-002', programId: 'CRP-002', customerId: 'CUST-501',
    customerName: "Joe's Steakhouse – Downtown",
    ytdSpend: 145000, ytdUnits: null,
    accruedAmount: 2900.00,  // $145k × 2% (threshold not yet met — tracked, pending)
    lastUpdated: '2026-05-20',
    status: 'Pending',       // threshold not yet met (needs $200k)
  },
  {
    id: 'CAC-003', programId: 'CRP-003', customerId: 'CUST-502',
    customerName: 'City Hospital Cafe',
    ytdSpend: 85000, ytdUnits: null,
    accruedAmount: 1275.00,  // $85k × 1.5%
    lastUpdated: '2026-05-20',
    status: 'Active',
  },
  {
    id: 'CAC-004', programId: 'CRP-004', customerId: 'CUST-502',
    customerName: 'City Hospital Cafe',
    ytdSpend: 72000, ytdUnits: 480,
    accruedAmount: 168.00,   // 480 × $0.35
    lastUpdated: '2026-03-31',
    status: 'Closed',
  },
];

const INIT_CREDIT_MEMOS = [
  {
    id: 'CRM-REBATE-001', accrualId: 'CAC-004', programId: 'CRP-004',
    customerId: 'CUST-502', customerName: 'City Hospital Cafe',
    programName: 'Q1 2026 Growth Rebate',
    amount: 168.00,
    issuedDate: '2026-04-05',
    appliedDate: '2026-04-15',
    status: 'Applied',
    notes: 'Applied to invoice INV-2026-0892',
  },
  {
    id: 'CRM-REBATE-002', accrualId: 'CAC-001', programId: 'CRP-001',
    customerId: 'CUST-501', customerName: "Joe's Steakhouse – Downtown",
    programName: 'Q2 2026 Volume Growth Rebate',
    amount: 382.50,
    issuedDate: '2026-05-21',
    appliedDate: null,
    status: 'Issued',
    notes: 'Pending customer account application',
  },
  {
    id: 'CRM-REBATE-003', accrualId: 'CAC-003', programId: 'CRP-003',
    customerId: 'CUST-502', customerName: 'City Hospital Cafe',
    programName: 'Healthcare Promo Fund — Q2',
    amount: 1275.00,
    issuedDate: null,
    appliedDate: null,
    status: 'Draft',
    notes: '',
  },
];

// ─── SALES ANALYTICS MOCK DATA ───────────────────────────────────────────────
const MONTHLY_REVENUE = [
  { month: 'Dec', revenue: 42800, cogs: 30700, orders: 18, newAccounts: 1 },
  { month: 'Jan', revenue: 48200, cogs: 34600, orders: 21, newAccounts: 2 },
  { month: 'Feb', revenue: 45600, cogs: 32700, orders: 19, newAccounts: 0 },
  { month: 'Mar', revenue: 52100, cogs: 37300, orders: 24, newAccounts: 3 },
  { month: 'Apr', revenue: 51400, cogs: 36800, orders: 23, newAccounts: 1 },
  { month: 'May', revenue: 53650, cogs: 38400, orders: 22, newAccounts: 2, partial: true },
];

const CATEGORY_MIX = [
  { name: 'Protein',    pct: 44, color: 'bg-cyan-500',    textColor: 'text-cyan-400',    revenue: 23606 },
  { name: 'Dairy',      pct: 19, color: 'bg-blue-500',    textColor: 'text-blue-400',    revenue: 10194 },
  { name: 'Produce',    pct: 14, color: 'bg-emerald-500', textColor: 'text-emerald-400', revenue: 7511  },
  { name: 'Bakery',     pct: 11, color: 'bg-amber-500',   textColor: 'text-amber-400',   revenue: 5902  },
  { name: 'Dry Goods',  pct:  8, color: 'bg-violet-500',  textColor: 'text-violet-400',  revenue: 4292  },
  { name: 'Services',   pct:  4, color: 'bg-gray-500',    textColor: 'text-gray-400',    revenue: 2145  },
];

const SALES_REPS = [
  { id: 'REP-01', name: 'J. Park',      territory: 'Uptown / Garden District', quota: 55000, mtd: 42800, priorMtd: 38200, accounts: 12, orders: 18, commission: 1070, commRate: 2.5 },
  { id: 'REP-02', name: 'M. Torres',    territory: 'CBD / French Quarter',     quota: 60000, mtd: 38200, priorMtd: 41500, accounts:  9, orders: 14, commission:  955, commRate: 2.5 },
  { id: 'REP-03', name: 'L. Nguyen',    territory: 'Mid-City / Lakeview',      quota: 45000, mtd: 36100, priorMtd: 33800, accounts:  8, orders: 11, commission:  903, commRate: 2.5 },
  { id: 'REP-04', name: 'D. Boudreaux', territory: 'West Bank / Algiers',      quota: 40000, mtd: 22400, priorMtd: 28900, accounts:  6, orders:  9, commission:  560, commRate: 2.5 },
];

const TOP_PRODUCTS = [
  { sku: 'PROT-002',    name: 'Chicken Breast Boneless 40lb', cat: 'Protein',   mtdRev: 15444, margin: 28.0, orders: 8,  units: 198, trend:  12 },
  { sku: 'FRZ-BEEF-01', name: 'Ground Beef 80/20 10lb',       cat: 'Protein',   mtdRev: 10752, margin: 23.8, orders: 11, units:  64, trend:   5 },
  { sku: 'PROT-010',    name: 'Shrimp Jumbo 16/20 ct 5lb',    cat: 'Protein',   mtdRev:  5832, margin: 29.6, orders:  6, units:  54, trend:  -3 },
  { sku: 'DAI-MILK-02', name: 'Whole Milk 1 Gal 4pk',         cat: 'Dairy',     mtdRev:  4770, margin: 30.2, orders:  9, units: 180, trend:   8 },
  { sku: 'DRY-RICE-05', name: 'Jasmine Rice 50lb Bag',        cat: 'Dry Goods', mtdRev:  4368, margin: 30.8, orders:  5, units:  84, trend:  18 },
  { sku: 'BAK-BUN-01',  name: 'Brioche Burger Buns 12pk',     cat: 'Bakery',    mtdRev:  4294, margin: 32.9, orders:  7, units: 113, trend:   2 },
  { sku: 'PROT-003',    name: 'Atlantic Salmon Fillet 5lb',   cat: 'Protein',   mtdRev:  3680, margin: 31.5, orders:  4, units:  40, trend:  -8 },
  { sku: 'DAI-CHE-02',  name: 'American Cheese 5lb',          cat: 'Dairy',     mtdRev:  2880, margin: 33.3, orders:  6, units:  60, trend:   1 },
  { sku: 'PRO-TOMA-01', name: 'Roma Tomatoes 25lb Case',      cat: 'Produce',   mtdRev:  1984, margin: 37.5, orders:  5, units:  62, trend: -12 },
  { sku: 'DRY-OIL-5G',  name: 'Vegetable Oil 5 Gal',         cat: 'Dry Goods', mtdRev:  1012, margin: 32.6, orders:  3, units:  22, trend:   4 },
];

const ANALYTICS_CUSTOMERS = [
  { id: 'CUST-105', name: 'City School District',   segment: 'Institutional', rep: 'L. Nguyen',    mtdRev: 22000, priorRev: 18500, orders: 4, avgOrder:  5500, lastOrder: '2026-05-15', health: 88 },
  { id: 'CUST-103', name: 'Harbor View Hotel',       segment: 'Hotel',         rep: 'J. Park',      mtdRev: 11640, priorRev:  9400, orders: 1, avgOrder: 11640, lastOrder: '2026-04-20', health: 91 },
  { id: 'CUST-101', name: 'Metro Restaurant Group',  segment: 'Restaurant',    rep: 'J. Park',      mtdRev:  8204, priorRev:  6200, orders: 1, avgOrder:  8204, lastOrder: '2026-05-01', health: 72 },
  { id: 'CUST-104', name: 'Sunset Bistro Chain',     segment: 'Restaurant',    rep: 'M. Torres',    mtdRev:  5290, priorRev:  4100, orders: 1, avgOrder:  5290, lastOrder: '2026-05-08', health: 65 },
  { id: 'CUST-102', name: 'Downtown Catering Co.',   segment: 'Catering',      rep: 'M. Torres',    mtdRev:  2825, priorRev:  2800, orders: 1, avgOrder:  2825, lastOrder: '2026-05-05', health: 78 },
  { id: 'CUST-106', name: 'Bayou Grill & Pub',       segment: 'Restaurant',    rep: 'D. Boudreaux', mtdRev:  1745, priorRev:  1400, orders: 1, avgOrder:  1745, lastOrder: '2026-05-22', health: 60 },
  { id: 'CUST-107', name: 'Crescent City Catering',  segment: 'Catering',      rep: 'D. Boudreaux', mtdRev:     0, priorRev:     0, orders: 0, avgOrder:     0, lastOrder: null,          health: 55 },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt$  = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const fmtPct = (v) => `${v.toFixed(1)}%`;

// ─── KERNAL DESIGN SYSTEM ─────────────────────────────────────────────────────
// FIX #8: Added const UI token object for design system consistency.
const healthBadge = (score) => {
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (score >= 50) return 'bg-cyan-600/10 text-cyan-500 border border-cyan-600/20';
  return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
};

// FIX #1–#5: All modals use fixed inset-0 (not absolute) so they cover the
// full viewport regardless of which container the module is embedded in.
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ERMCustomerSuccessModule() {
  const [view, setView]                       = useState('dashboard');
  const [analyticsTab, setAnalyticsTab]       = useState('overview');
  const [analyticsSort, setAnalyticsSort]     = useState({ col: 'mtdRev', dir: 'desc' });
  const [prodSort, setProdSort]               = useState({ col: 'mtdRev', dir: 'desc' });
  const [repSort, setRepSort]                 = useState({ col: 'mtd', dir: 'desc' });
  const {
    settings,
    requiresApproval, submitApprovalRequest, approvalRequests,
    quickCreateAction, clearQuickCreateAction,
    activeUser, logAudit,
  } = useKernal();

  // Quick Create: "New Customer" from sidebar
  useEffect(() => {
    if (quickCreateAction === 'new-customer') {
      setIsAddModalOpen(true);
      clearQuickCreateAction();
    }
  }, [quickCreateAction, clearQuickCreateAction]);
  const customerPricingEnabled = settings.features.customerPricing;
  const creditTermsEnabled     = settings.features?.creditTerms !== false;
  const pricingTiers = settings.pricing?.tiers || [];
  const tierMeta = (tierId) => pricingTiers.find(t => t.id === tierId) || { label: tierId, color: 'text-gray-400', bg: 'bg-gray-700/60' };
  const [customers, setCustomers]             = useState(DEMO_MODE ? MOCK_CUSTOMERS : []);
  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [editedCustomer, setEditedCustomer]   = useState(null);
  const [toast, setToast]                     = useState(null);

  const [contactModal,  setContactModal]  = useState({ isOpen: false, mode: 'add', contact: null });
  const [ticketModal,   setTicketModal]   = useState({ isOpen: false, ticket: null });
  const [playbookModal, setPlaybookModal] = useState({ isOpen: false });
  const [taskModal,     setTaskModal]     = useState({ isOpen: false, task: null });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ── B2B Portal setup state (live mode only) ───────────────────────────────
  // portalSetupOpen: id of the customer whose inline setup form is showing
  const [portalSetupOpen,   setPortalSetupOpen]   = useState(null);
  const [portalSetupForm,   setPortalSetupForm]    = useState({ email: '', password: '' });
  const [portalSetupSaving, setPortalSetupSaving]  = useState(false);
  const [portalSetupError,  setPortalSetupError]   = useState(null);

  // ── Customer Rebate state ─────────────────────────────────────────────────
  const [customerPrograms, setCustomerPrograms] = useState(DEMO_MODE ? INIT_CUSTOMER_PROGRAMS : []);
  const [customerAccruals, setCustomerAccruals] = useState(DEMO_MODE ? INIT_CUSTOMER_ACCRUALS : []);
  const [creditMemos, setCreditMemos]           = useState(DEMO_MODE ? INIT_CREDIT_MEMOS : []);
  const [rebateSubTab, setRebateSubTab]         = useState('programs'); // 'programs'|'accruals'|'memos'
  const [rebateProgramFilter, setRebateProgramFilter] = useState('Active');
  const [rebateMemoFilter, setRebateMemoFilter]       = useState('All');

  const freshId = () => `CUST-${Math.floor(Math.random() * 9000) + 1000}`;
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '', dba: '', industry: 'Restaurant & Hospitality', id: freshId(),
    creditLimit: 10000, terms: 'Net-30',
    address: { street: '', city: '', state: '', zip: '' },
    contactName: '', contactEmail: '', contactPhone: '', documents: [],
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Approval workflow integration (credit release / account change / discount) ─
  const [creditReleaseModal, setCreditReleaseModal] = useState({ open: false, customer: null });
  const [discountModal, setDiscountModal] = useState({ open: false, customer: null });
  const [pendingAccountChange, setPendingAccountChange] = useState(null); // { customer, changes, reason }
  const [crReason, setCrReason] = useState('');
  const [discountForm, setDiscountForm] = useState({ skuScope: '', discountPct: '', expiresOn: '', reason: '' });

  const appliedApprovalRef = useRef(new Set());
  useEffect(() => {
    approvalRequests.forEach(req => {
      if (!['credit_release','account_change','discount_override'].includes(req.flowType)) return;
      if (req.status !== 'approved') return;
      if (appliedApprovalRef.current.has(req.id)) return;
      const customerId = req.payload?.customerId;
      if (!customerId) return;
      setCustomers(prev => prev.map(c => {
        if (c.id !== customerId) return c;
        if (req.flowType === 'credit_release') {
          return { ...c, creditHold: false };
        }
        if (req.flowType === 'account_change' && Array.isArray(req.payload.changes)) {
          const patch = {};
          req.payload.changes.forEach(ch => {
            if (ch.fieldKey === 'creditLimit')      patch.creditLimit = Number(ch.toRaw);
            else if (ch.fieldKey === 'terms')       patch.terms = ch.toRaw;
            else if (ch.fieldKey === 'pricingTier') patch.pricingTier = ch.toRaw;
          });
          return { ...c, ...patch };
        }
        if (req.flowType === 'discount_override') {
          const note = `${req.payload.discountPct}% off ${req.payload.skuScope || 'all SKUs'} through ${req.payload.expiresOn || 'TBD'}`;
          return {
            ...c,
            recentActivity: [
              { id: Date.now(), date: TODAY, type: 'pricing', note: `Discount override approved: ${note}` },
              ...(c.recentActivity || []),
            ],
          };
        }
        return c;
      }));
      appliedApprovalRef.current.add(req.id);
    });
  }, [approvalRequests]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) &&
           (statusFilter === 'All' || c.status === statusFilter);
  }), [customers, searchQuery, statusFilter]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const openDetail = useCallback((customer) => {
    setSelectedCustomerId(customer.id);
    setEditedCustomer(JSON.parse(JSON.stringify(customer)));
    setView('detail');
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedCustomerId(null);
    setEditedCustomer(null);
    setContactModal({ isOpen: false, mode: 'add', contact: null });
    setTicketModal({ isOpen: false, ticket: null });
    setPlaybookModal({ isOpen: false });
    setTaskModal({ isOpen: false, task: null });
    setView('dashboard');
  }, []);

  // ── Save handlers ───────────────────────────────────────────────────────────
  const handleSaveCustomer = useCallback(() => {
    console.log('TRANSMITTING CUSTOMER PAYLOAD:', JSON.stringify(editedCustomer, null, 2));
    if (!editedCustomer) return;
    const original = customers.find(c => c.id === editedCustomer.id);
    // Build a list of significant changes that should require approval
    const changes = [];
    if (original) {
      // Credit limit change
      const oldLimit = Number(original.creditLimit) || 0;
      const newLimit = Number(editedCustomer.creditLimit) || 0;
      if (oldLimit !== newLimit) {
        changes.push({
          field: 'Credit Limit',
          fieldKey: 'creditLimit',
          from: `$${oldLimit.toLocaleString()}`,
          to:   `$${newLimit.toLocaleString()}`,
          fromRaw: oldLimit, toRaw: newLimit,
          pctChange: oldLimit > 0 ? Math.abs((newLimit - oldLimit) / oldLimit) * 100 : (newLimit > 0 ? 100 : 0),
        });
      }
      // Payment terms change
      if ((original.terms || '') !== (editedCustomer.terms || '')) {
        changes.push({
          field: 'Payment Terms',
          fieldKey: 'terms',
          from: original.terms || '—',
          to: editedCustomer.terms || '—',
          fromRaw: original.terms, toRaw: editedCustomer.terms,
        });
      }
      // Pricing tier change
      if ((original.pricingTier || '') !== (editedCustomer.pricingTier || '')) {
        changes.push({
          field: 'Pricing Tier',
          fieldKey: 'pricingTier',
          from: original.pricingTier || '—',
          to: editedCustomer.pricingTier || '—',
          fromRaw: original.pricingTier, toRaw: editedCustomer.pricingTier,
        });
      }
    }
    const maxPct = Math.max(0, ...changes.map(c => c.pctChange || 0));
    const significant = changes.length > 0 && (changes.some(c => c.fieldKey !== 'creditLimit') || requiresApproval('account_change', maxPct));
    if (significant) {
      // Stage the changes; show the reason modal before submitting
      setPendingAccountChange({ customer: editedCustomer, original, changes });
      return;
    }
    setCustomers(prev => prev.map(c => c.id === editedCustomer.id ? editedCustomer : c));
    logAudit({
      moduleId: 'crm',
      action: 'customer.updated',
      entityType: 'customer',
      entityId: editedCustomer.id,
      summary: `Account profile updated for ${editedCustomer.name}`,
      before: original ? { name: original.name, terms: original.terms, creditLimit: original.creditLimit } : null,
      after:  { name: editedCustomer.name, terms: editedCustomer.terms, creditLimit: editedCustomer.creditLimit },
      severity: 'info',
    });
    showToast('Account profile updated successfully.');
  }, [editedCustomer, customers, requiresApproval, showToast, logAudit]);

  const submitAccountChangeRequest = (reason) => {
    if (!pendingAccountChange) return;
    const { customer, changes } = pendingAccountChange;
    const maxPct = Math.max(0, ...changes.map(c => c.pctChange || 0));
    submitApprovalRequest({
      flowType: 'account_change',
      title: `Account change — ${customer.name}`,
      summary: `${changes.length} field${changes.length === 1 ? '' : 's'} changed${maxPct ? ` (max ${maxPct.toFixed(0)}% delta)` : ''}.`,
      threshold: maxPct,
      payload: {
        customerId: customer.id,
        customerName: customer.name,
        changes: changes.map(c => ({ field: c.field, fieldKey: c.fieldKey, from: c.from, to: c.to, toRaw: c.toRaw })),
        reason,
      },
    });
    setPendingAccountChange(null);
    showToast('Account change submitted for approval', 'info');
    // Revert in-flight edits to original so the customer record matches stored state
    const original = customers.find(c => c.id === customer.id);
    if (original) setEditedCustomer(JSON.parse(JSON.stringify(original)));
  };

  const submitCreditReleaseRequest = (reason) => {
    const cust = creditReleaseModal.customer;
    if (!cust) return;
    submitApprovalRequest({
      flowType: 'credit_release',
      title: `Release credit hold — ${cust.name}`,
      summary: 'Sales rep is requesting credit hold be lifted so customer can resume ordering.',
      threshold: 0,
      payload: {
        customerId: cust.id,
        customerName: cust.name,
        currentBalance: (cust.arAging?.days30 || 0) + (cust.arAging?.days60 || 0) + (cust.arAging?.days90 || 0),
        reason: reason || 'No reason provided',
      },
    });
    setCreditReleaseModal({ open: false, customer: null });
    setCrReason('');
    showToast('Credit release request submitted for approval', 'info');
  };

  const submitDiscountRequest = () => {
    const cust = discountModal.customer;
    if (!cust) return;
    const pct = Number(discountForm.discountPct) || 0;
    submitApprovalRequest({
      flowType: 'discount_override',
      title: `Discount override — ${cust.name} — ${pct}% on ${discountForm.skuScope || 'all SKUs'}`,
      summary: `${pct}% off ${discountForm.skuScope || 'all SKUs'}${discountForm.expiresOn ? ` through ${discountForm.expiresOn}` : ''}.`,
      threshold: pct,
      payload: {
        customerId: cust.id,
        customerName: cust.name,
        skuScope: discountForm.skuScope,
        discountPct: pct,
        expiresOn: discountForm.expiresOn,
        reason: discountForm.reason,
      },
    });
    setDiscountModal({ open: false, customer: null });
    setDiscountForm({ skuScope: '', discountPct: '', expiresOn: '', reason: '' });
    showToast('Discount override submitted for approval', 'info');
  };

  const handleCreateCustomer = useCallback((e) => {
    e.preventDefault();
    const f = newCustomerForm;
    const newRecord = {
      id: f.id, name: f.name, dba: f.dba || f.name, taxId: 'Pending',
      industry: f.industry, address: f.address,
      contacts: [{ id: `c-${Math.random().toString(36).substr(2,9)}`, name: f.contactName || 'Primary Contact',
        title: 'Main Contact', phone: f.contactPhone, email: f.contactEmail, isPrimary: true, portalStatus: 'Not Invited' }],
      status: 'Active', healthScore: 100, churnRisk: 'Low', pricingTier: 'standard',
      creditLimit: Number(f.creditLimit), availableCredit: Number(f.creditLimit),
      terms: f.terms, route: 'Pending', deliveryDays: [], b2bPortalAccess: false, b2bProfileId: null, lastLogin: null,
      arAging: { current: 0, days30: 0, days60: 0, days90: 0 }, contractPricing: {},
      analytics: { ytdSpend: 0, lytdSpend: 0, deliverySuccessRate: 100, topSkus: [] },
      npsData: { score: 0, history: [] },
      aiInsights: [{ id: 1, type: 'action', text: 'New account created. Needs B2B portal setup and route assignment.' }],
      activePlaybooks: [{ id: 'pb-4', name: 'New Account Onboarding', status: 'Active', enrolledDate: TODAY }],
      whitespaceAnalysis: [],
      recentActivity: [{ id: 1, date: TODAY, type: 'activity', note: 'Account provisioned in ERM.' }],
      tasks: [{ id: `tsk-${Date.now()}`, title: 'Call primary contact to introduce portal', dueDate: TODAY, type: 'Call', priority: 'High', status: 'Pending' }],
      documents: f.documents || [], tickets: [],
    };
    setCustomers(prev => [newRecord, ...prev]);
    setIsAddModalOpen(false);
    setNewCustomerForm({ name: '', dba: '', industry: 'Restaurant & Hospitality', id: freshId(),
      creditLimit: 10000, terms: 'Net-30', address: { street: '', city: '', state: '', zip: '' },
      contactName: '', contactEmail: '', contactPhone: '', documents: [] });
    showToast('New customer account created.');
  }, [newCustomerForm, showToast]);

  // ── SALES ANALYTICS DASHBOARD ─────────────────────────────────────────────
  const renderAnalytics = () => {
    // ── Shared helpers ────────────────────────────────────────────────────────
    const maxRev   = Math.max(...MONTHLY_REVENUE.map(m => m.revenue));
    const totMtd   = ANALYTICS_CUSTOMERS.reduce((s, c) => s + c.mtdRev, 0);
    const totPrior = ANALYTICS_CUSTOMERS.reduce((s, c) => s + c.priorRev, 0);
    const totOrders = ANALYTICS_CUSTOMERS.reduce((s, c) => s + c.orders, 0);
    const avgOrder  = totOrders > 0 ? totMtd / totOrders : 0;
    const mom       = totPrior > 0 ? ((totMtd - totPrior) / totPrior) * 100 : 0;

    const sortedCusts = [...ANALYTICS_CUSTOMERS].sort((a, b) => {
      const av = a[analyticsSort.col] ?? 0, bv = b[analyticsSort.col] ?? 0;
      return analyticsSort.dir === 'desc' ? bv - av : av - bv;
    });
    const sortedProds = [...TOP_PRODUCTS].sort((a, b) => {
      const av = a[prodSort.col] ?? 0, bv = b[prodSort.col] ?? 0;
      return prodSort.dir === 'desc' ? bv - av : av - bv;
    });
    const sortedReps = [...SALES_REPS].sort((a, b) => {
      const av = a[repSort.col] ?? 0, bv = b[repSort.col] ?? 0;
      return repSort.dir === 'desc' ? bv - av : av - bv;
    });

    const toggleSort = (getter, setter, col) =>
      setter(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }));

    const SortIcon = ({ state, col }) => state.col === col
      ? (state.dir === 'desc'
          ? <ChevronDown className="w-3 h-3 inline ml-0.5 opacity-70" />
          : <ChevronUp   className="w-3 h-3 inline ml-0.5 opacity-70" />)
      : null;

    const marginBadge = pct =>
      pct >= 32 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
      pct >= 27 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20';

    const quotaColor = pct =>
      pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-cyan-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';

    const Trend = ({ val, showPct = false, suffix = '' }) => {
      if (val === null || val === undefined) return <span className="text-gray-600 text-xs">—</span>;
      const pos = val >= 0;
      return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
          {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {pos ? '+' : ''}{showPct ? val.toFixed(1) + '%' : val + suffix}
        </span>
      );
    };

    const TABS = [
      { id: 'overview',  label: 'Overview'      },
      { id: 'customers', label: 'By Customer'   },
      { id: 'products',  label: 'By Product'    },
      { id: 'reps',      label: 'By Rep'        },
      { id: 'trends',    label: 'Trends'        },
    ];

    return (
      <div className="flex flex-col h-full bg-gray-950">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className={`${UI.glassHeader} px-8 py-5 flex justify-between items-center shrink-0`}>
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3 tracking-wide">
              <BarChart3 className="w-6 h-6 text-cyan-500" /> Sales Analytics
            </h1>
            <p className="text-gray-500 text-sm mt-1">Revenue · Margin · Quota · Trends — May 2026 (MTD)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('dashboard')}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors">
              ← Accounts
            </button>
          </div>
        </div>

        {/* ── Sub-tab nav ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1 px-8 pt-4 pb-0 border-b border-gray-800 shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setAnalyticsTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${analyticsTab === t.id ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">

          {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {analyticsTab === 'overview' && (<>
            {/* KPI strip */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'MTD Revenue',     value: fmt$(totMtd),           sub: 'May 2026',                                    color: 'text-gray-100'    },
                { label: 'vs. Prior Month', value: `${mom >= 0 ? '+' : ''}${mom.toFixed(1)}%`, sub: `from ${fmt$(totPrior)} in Apr`, color: mom >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                { label: 'Orders This Month', value: totOrders,            sub: `avg ${fmt$(avgOrder)} / order`,               color: 'text-cyan-400'    },
                { label: 'Active Accounts',  value: ANALYTICS_CUSTOMERS.filter(c => c.orders > 0).length,
                                                                            sub: `of ${ANALYTICS_CUSTOMERS.length} total`,     color: 'text-gray-100'    },
              ].map(k => (
                <div key={k.label} className={`${UI.cardPad} space-y-0.5`}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{k.label}</p>
                  <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-gray-600">{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Bar chart + category mix */}
            <div className="grid grid-cols-3 gap-4">
              {/* Monthly revenue bars */}
              <div className={`${UI.cardPad} col-span-2`}>
                <p className={UI.sectionTitle + ' mb-4'}><TrendingUp className="w-4 h-4 text-cyan-500" /> 6-Month Revenue Trend</p>
                <div className="flex items-end gap-3 h-36">
                  {MONTHLY_REVENUE.map(m => {
                    const heightPct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
                    const gp = m.revenue - m.cogs;
                    const gpPct = ((gp / m.revenue) * 100).toFixed(0);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative w-full flex flex-col items-center">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap shadow-xl">
                              <p className="font-bold text-gray-100">{fmt$(m.revenue)}</p>
                              <p className="text-emerald-400">GP: {gpPct}%</p>
                              <p className="text-gray-500">{m.orders} orders</p>
                            </div>
                            <div className="w-2 h-2 bg-gray-800 border-b border-r border-gray-700 rotate-45 -mt-1" />
                          </div>
                          {/* Bar */}
                          <div className="w-full rounded-t-md transition-all"
                            style={{ height: `${Math.max(heightPct * 1.2, 4)}px`, background: m.partial ? 'linear-gradient(to top, rgba(6,182,212,0.5), rgba(6,182,212,0.2))' : 'rgba(6,182,212,0.8)' }} />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">{m.month}</span>
                        {m.partial && <span className="text-[8px] text-cyan-600 font-bold">MTD</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-500/80" /><span className="text-[10px] text-gray-500">Revenue</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-500/30 border border-dashed border-cyan-600/50" /><span className="text-[10px] text-gray-500">Partial month</span></div>
                </div>
              </div>

              {/* Category mix */}
              <div className={UI.cardPad}>
                <p className={UI.sectionTitle + ' mb-4'}><PieChart className="w-4 h-4 text-cyan-500" /> Revenue Mix (MTD)</p>
                <div className="space-y-2.5">
                  {CATEGORY_MIX.map(c => (
                    <div key={c.name}>
                      <div className="flex justify-between mb-0.5">
                        <span className={`text-xs font-semibold ${c.textColor}`}>{c.name}</span>
                        <span className="text-xs text-gray-500">{c.pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top customers overview */}
            <div className={UI.card}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <h3 className={UI.sectionTitle}><Award className="w-4 h-4 text-cyan-500" /> Top Accounts by Revenue</h3>
                <button onClick={() => setAnalyticsTab('customers')} className="text-xs text-cyan-500 hover:text-cyan-400 font-semibold">View all →</button>
              </div>
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    {['#','Account','Segment','MTD Revenue','vs. Prior','Orders','Health'].map(h => <th key={h} className={UI.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {ANALYTICS_CUSTOMERS.filter(c => c.orders > 0).sort((a,b) => b.mtdRev - a.mtdRev).map((c, i) => {
                    const chg = c.priorRev > 0 ? ((c.mtdRev - c.priorRev) / c.priorRev) * 100 : null;
                    return (
                      <tr key={c.id} className="hover:bg-gray-800/30">
                        <td className={UI.td}><span className="text-xs font-bold text-gray-500">{i + 1}</span></td>
                        <td className={UI.td}><p className="font-semibold text-gray-200">{c.name}</p><p className="text-[10px] text-gray-600">{c.rep}</p></td>
                        <td className={UI.td}><span className={UI.badgeGray}>{c.segment}</span></td>
                        <td className={`${UI.td} font-bold text-gray-100`}>{fmt$(c.mtdRev)}</td>
                        <td className={UI.td}><Trend val={chg} showPct /></td>
                        <td className={UI.td}><span className="text-gray-400">{c.orders}</span></td>
                        <td className={UI.td}><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${healthBadge(c.health)}`}>{c.health}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

          {/* ══ BY CUSTOMER ═══════════════════════════════════════════════════ */}
          {analyticsTab === 'customers' && (
            <div className={UI.card}>
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className={UI.sectionTitle}><Users className="w-4 h-4 text-cyan-500" /> Customer Revenue Ranking</h3>
                <span className="text-xs text-gray-600">Click column headers to sort</span>
              </div>
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className={UI.th}>#</th>
                    {[
                      ['name','Account'], ['segment','Segment'], ['mtdRev','MTD Revenue'],
                      ['priorRev','Prior Month'], ['orders','Orders'], ['avgOrder','Avg Order'],
                      ['health','Health'],
                    ].map(([col, label]) => (
                      <th key={col} onClick={() => toggleSort(analyticsSort, setAnalyticsSort, col)}
                        className={`${UI.th} cursor-pointer hover:text-cyan-400 transition-colors`}>
                        {label}<SortIcon state={analyticsSort} col={col} />
                      </th>
                    ))}
                    <th className={UI.th}>Rep</th>
                    <th className={UI.th}>Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {sortedCusts.map((c, i) => {
                    const chg = c.priorRev > 0 ? ((c.mtdRev - c.priorRev) / c.priorRev) * 100 : null;
                    return (
                      <tr key={c.id} className={`hover:bg-gray-800/30 ${c.orders === 0 ? 'opacity-40' : ''}`}>
                        <td className={`${UI.td} text-center text-xs font-bold text-gray-500`}>{i + 1}</td>
                        <td className={UI.td}><p className="font-semibold text-gray-200">{c.name}</p><p className="text-[10px] text-gray-600">{c.id}</p></td>
                        <td className={UI.td}><span className={UI.badgeGray}>{c.segment}</span></td>
                        <td className={`${UI.td} font-bold text-gray-100`}>{c.orders > 0 ? fmt$(c.mtdRev) : '—'}</td>
                        <td className={UI.td}>{c.priorRev > 0 ? fmt$(c.priorRev) : '—'}</td>
                        <td className={UI.td}>{c.orders > 0 ? <Trend val={chg} showPct /> : '—'}</td>
                        <td className={UI.td}>{c.orders > 0 ? <span className="text-gray-300">{c.orders}</span> : '—'}</td>
                        <td className={UI.td}>{c.avgOrder > 0 ? fmt$(c.avgOrder) : '—'}</td>
                        <td className={UI.td}><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${healthBadge(c.health)}`}>{c.health}</span></td>
                        <td className={UI.td}><span className="text-xs text-gray-400">{c.rep}</span></td>
                        <td className={UI.td}><span className="text-xs text-gray-500">{c.lastOrder ?? '—'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ══ BY PRODUCT ════════════════════════════════════════════════════ */}
          {analyticsTab === 'products' && (<>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Top SKU Revenue',   value: fmt$(TOP_PRODUCTS[0]?.mtdRev ?? 0), sub: TOP_PRODUCTS[0]?.name ?? '—', color: 'text-gray-100' },
                { label: 'Highest Margin SKU', value: fmtPct(Math.max(...TOP_PRODUCTS.map(p=>p.margin))),
                                                                                        sub: TOP_PRODUCTS.reduce((a,b)=>b.margin>a.margin?b:a).name, color: 'text-emerald-400' },
                { label: 'Margin Watch',        value: TOP_PRODUCTS.filter(p=>p.margin<28).length + ' SKUs',
                                                                                        sub: 'below 28% gross margin', color: 'text-amber-400' },
              ].map(k => (
                <div key={k.label} className={`${UI.cardPad}`}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{k.label}</p>
                  <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 truncate">{k.sub}</p>
                </div>
              ))}
            </div>

            <div className={UI.card}>
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className={UI.sectionTitle}><Package className="w-4 h-4 text-cyan-500" /> Top Products — MTD Performance</h3>
                <span className="text-xs text-gray-600">Click column headers to sort</span>
              </div>
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className={UI.th}>#</th>
                    {[
                      ['name','Product'], ['cat','Category'], ['mtdRev','MTD Revenue'],
                      ['units','Units Sold'], ['orders','Orders'], ['margin','Gross Margin %'], ['trend','MoM Trend'],
                    ].map(([col, label]) => (
                      <th key={col} onClick={() => toggleSort(prodSort, setProdSort, col)}
                        className={`${UI.th} cursor-pointer hover:text-cyan-400 transition-colors`}>
                        {label}<SortIcon state={prodSort} col={col} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {sortedProds.map((p, i) => (
                    <tr key={p.sku} className="hover:bg-gray-800/30">
                      <td className={`${UI.td} text-center text-xs font-bold text-gray-500`}>{i + 1}</td>
                      <td className={UI.td}>
                        <p className="font-semibold text-gray-200">{p.name}</p>
                        <p className="text-[10px] font-mono text-gray-600">{p.sku}</p>
                      </td>
                      <td className={UI.td}><span className={UI.badgeGray}>{p.cat}</span></td>
                      <td className={`${UI.td} font-bold text-gray-100`}>{fmt$(p.mtdRev)}</td>
                      <td className={UI.td}><span className="text-gray-400">{p.units.toLocaleString()}</span></td>
                      <td className={UI.td}><span className="text-gray-400">{p.orders}</span></td>
                      <td className={UI.td}>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${marginBadge(p.margin)}`}>
                          {p.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className={UI.td}><Trend val={p.trend} suffix="%" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Margin watch — flag SKUs below threshold */}
            {TOP_PRODUCTS.some(p => p.margin < 28) && (
              <div className={`${UI.cardPad} border border-amber-500/20 bg-amber-500/5`}>
                <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Margin Watch — SKUs below 28% gross margin
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOP_PRODUCTS.filter(p => p.margin < 28).map(p => (
                    <div key={p.sku} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <span className="text-xs font-semibold text-gray-200">{p.name}</span>
                      <span className="text-xs font-bold text-amber-400">{p.margin.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>)}

          {/* ══ BY REP ════════════════════════════════════════════════════════ */}
          {analyticsTab === 'reps' && (<>
            {/* Rep scorecards */}
            <div className="grid grid-cols-2 gap-4">
              {sortedReps.map((rep, i) => {
                const quotaPct = rep.quota > 0 ? (rep.mtd / rep.quota) * 100 : 0;
                const momChg   = rep.priorMtd > 0 ? ((rep.mtd - rep.priorMtd) / rep.priorMtd) * 100 : null;
                const projectedFull = rep.mtd * (31 / 25); // scale to full month
                return (
                  <div key={rep.id} className={UI.card}>
                    <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-sm font-black text-cyan-400">
                          {rep.name.split(' ')[0][0]}{rep.name.split(' ')[1]?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-100">{rep.name}</p>
                          <p className="text-[10px] text-gray-500">{rep.territory}</p>
                        </div>
                      </div>
                      {i === 0 && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"><Award className="w-3 h-3" /> #1 Rep</span>}
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      {/* Quota bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-400 font-semibold">Quota Attainment</span>
                          <span className={`font-black ${quotaPct >= 90 ? 'text-emerald-400' : quotaPct >= 70 ? 'text-cyan-400' : quotaPct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{quotaPct.toFixed(0)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${quotaColor(quotaPct)}`} style={{ width: `${Math.min(quotaPct, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                          <span>{fmt$(rep.mtd)} MTD</span>
                          <span>Goal: {fmt$(rep.quota)}</span>
                        </div>
                      </div>
                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Accounts', value: rep.accounts              },
                          { label: 'Orders',   value: rep.orders                },
                          { label: 'Commission', value: fmt$(rep.commission)    },
                          { label: 'vs. Apr',  value: <Trend val={momChg} showPct /> },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-800/40 rounded-lg px-2 py-2 text-center">
                            <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">{s.label}</p>
                            <p className="text-sm font-black text-gray-200 mt-0.5">{s.value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Projected */}
                      <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t border-gray-800">
                        <span>Projected full month</span>
                        <span className="font-bold text-gray-300">{fmt$(projectedFull)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leaderboard table */}
            <div className={UI.card}>
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className={UI.sectionTitle}><Award className="w-4 h-4 text-cyan-500" /> Rep Leaderboard — May 2026</h3>
              </div>
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className={UI.th}>Rank</th>
                    {[['name','Rep'],['territory','Territory'],['mtd','MTD Revenue'],['quota','Quota'],['orders','Orders'],['accounts','Accounts'],['commission','Commission']].map(([col, label]) => (
                      <th key={col} onClick={() => toggleSort(repSort, setRepSort, col)}
                        className={`${UI.th} cursor-pointer hover:text-cyan-400 transition-colors`}>
                        {label}<SortIcon state={repSort} col={col} />
                      </th>
                    ))}
                    <th className={UI.th}>Attainment</th>
                    <th className={UI.th}>vs. Apr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {sortedReps.map((rep, i) => {
                    const qPct = rep.quota > 0 ? (rep.mtd / rep.quota) * 100 : 0;
                    const momChg = rep.priorMtd > 0 ? ((rep.mtd - rep.priorMtd) / rep.priorMtd) * 100 : null;
                    return (
                      <tr key={rep.id} className="hover:bg-gray-800/30">
                        <td className={`${UI.td} text-center`}>
                          {i === 0 ? <Award className="w-4 h-4 text-amber-400 inline-block" /> : <span className="text-xs font-bold text-gray-500">{i + 1}</span>}
                        </td>
                        <td className={UI.td}><p className="font-semibold text-gray-200">{rep.name}</p></td>
                        <td className={UI.td}><span className="text-xs text-gray-500">{rep.territory}</span></td>
                        <td className={`${UI.td} font-bold text-gray-100`}>{fmt$(rep.mtd)}</td>
                        <td className={UI.td}><span className="text-gray-500">{fmt$(rep.quota)}</span></td>
                        <td className={UI.td}>{rep.orders}</td>
                        <td className={UI.td}>{rep.accounts}</td>
                        <td className={`${UI.td} text-emerald-400 font-semibold`}>{fmt$(rep.commission)}</td>
                        <td className={UI.td}>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${marginBadge(qPct)}`}>{qPct.toFixed(0)}%</span>
                        </td>
                        <td className={UI.td}><Trend val={momChg} showPct /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>)}

          {/* ══ TRENDS ════════════════════════════════════════════════════════ */}
          {analyticsTab === 'trends' && (<>
            {/* Revenue + gross profit dual bars */}
            <div className={UI.cardPad}>
              <p className={UI.sectionTitle + ' mb-5'}><TrendingUp className="w-4 h-4 text-cyan-500" /> Revenue & Gross Profit — 6 Months</p>
              <div className="flex items-end gap-4 h-48">
                {MONTHLY_REVENUE.map(m => {
                  const gp = m.revenue - m.cogs;
                  const gpPct = ((gp / m.revenue) * 100).toFixed(1);
                  const revH = maxRev > 0 ? (m.revenue / maxRev) * 160 : 0;
                  const gpH  = maxRev > 0 ? (gp       / maxRev) * 160 : 0;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full flex items-end justify-center gap-1" style={{ height: '160px' }}>
                        {/* Revenue bar */}
                        <div className="relative flex-1 rounded-t-md group/bar"
                          style={{ height: `${revH}px`, background: m.partial ? 'rgba(6,182,212,0.35)' : 'rgba(6,182,212,0.7)' }}>
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/bar:block z-10 pointer-events-none whitespace-nowrap">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-[10px] shadow-xl">
                              <p className="font-bold text-gray-100">{fmt$(m.revenue)}</p>
                              <p className="text-gray-500">{m.orders} orders</p>
                            </div>
                          </div>
                        </div>
                        {/* GP bar */}
                        <div className="relative flex-1 rounded-t-md group/bar"
                          style={{ height: `${gpH}px`, background: m.partial ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.6)' }}>
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/bar:block z-10 pointer-events-none whitespace-nowrap">
                            <div className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-[10px] shadow-xl">
                              <p className="font-bold text-emerald-400">{fmt$(gp)}</p>
                              <p className="text-gray-500">GP: {gpPct}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{m.month}</span>
                      {m.partial && <span className="text-[8px] text-cyan-600 font-bold">MTD</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-cyan-500/70" /><span className="text-[10px] text-gray-500">Revenue</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/60" /><span className="text-[10px] text-gray-500">Gross Profit</span></div>
              </div>
            </div>

            {/* MoM delta table */}
            <div className={UI.card}>
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className={UI.sectionTitle}><Calendar className="w-4 h-4 text-cyan-500" /> Month-over-Month Summary</h3>
              </div>
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    {['Month','Revenue','Gross Profit','GP %','Orders','New Accounts','MoM Revenue Δ','MoM GP Δ'].map(h => (
                      <th key={h} className={UI.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {MONTHLY_REVENUE.map((m, i) => {
                    const gp = m.revenue - m.cogs;
                    const gpPct = ((gp / m.revenue) * 100);
                    const prev = MONTHLY_REVENUE[i - 1];
                    const revDelta = prev ? ((m.revenue - prev.revenue) / prev.revenue) * 100 : null;
                    const gpDelta  = prev ? ((gp - (prev.revenue - prev.cogs)) / (prev.revenue - prev.cogs)) * 100 : null;
                    return (
                      <tr key={m.month} className={`hover:bg-gray-800/30 ${m.partial ? 'bg-cyan-500/5' : ''}`}>
                        <td className={UI.td}>
                          <span className={`font-bold ${m.partial ? 'text-cyan-400' : 'text-gray-200'}`}>{m.month} {m.partial ? '(MTD)' : "'"}{!m.partial && '26'}</span>
                        </td>
                        <td className={`${UI.td} font-bold text-gray-100`}>{fmt$(m.revenue)}</td>
                        <td className={`${UI.td} text-emerald-400 font-semibold`}>{fmt$(gp)}</td>
                        <td className={UI.td}>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${marginBadge(gpPct)}`}>{gpPct.toFixed(1)}%</span>
                        </td>
                        <td className={UI.td}>{m.orders}</td>
                        <td className={UI.td}>{m.newAccounts > 0 ? <span className="text-cyan-400 font-bold">+{m.newAccounts}</span> : <span className="text-gray-600">—</span>}</td>
                        <td className={UI.td}>{revDelta !== null ? <Trend val={revDelta} showPct /> : <span className="text-gray-600">—</span>}</td>
                        <td className={UI.td}>{gpDelta !== null ? <Trend val={gpDelta} showPct /> : <span className="text-gray-600">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Category trend bars stacked */}
            <div className={UI.cardPad}>
              <p className={UI.sectionTitle + ' mb-4'}><PieChart className="w-4 h-4 text-cyan-500" /> Category Mix — MTD</p>
              <div className="space-y-2">
                {CATEGORY_MIX.map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-400 w-20 shrink-0">{c.name}</span>
                    <div className="flex-1 h-5 bg-gray-800 rounded-md overflow-hidden">
                      <div className={`h-full ${c.color} flex items-center pl-2 transition-all`} style={{ width: `${c.pct}%` }}>
                        <span className="text-[10px] font-bold text-white/80">{c.pct >= 8 ? c.pct + '%' : ''}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-20 text-right">{fmt$(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>)}

        </div>
      </div>
    );
  };

  // ── CUSTOMER REBATES ────────────────────────────────────────────────────────
  const renderRebates = () => {
    const programTypeLabel = (t) => ({ volume_growth: 'Volume Growth', back_allowance: 'Back-Allowance', promo_fund: 'Promo Fund' }[t] || t);
    const programTypeBadge = (t) => ({
      volume_growth: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      back_allowance: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      promo_fund: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    }[t] || 'bg-gray-700/60 text-gray-400 border border-gray-700');

    const memoBadge = (s) => ({
      Applied: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      Issued:  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      Draft:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      Void:    'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    }[s] || 'bg-gray-700/60 text-gray-400');

    const accrualBadge = (s) => ({
      Active:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      Pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      Closed:  'bg-gray-700/60 text-gray-400 border border-gray-700',
    }[s] || 'bg-gray-700/60 text-gray-400');

    // KPI calculations
    const activePrograms = customerPrograms.filter(p => p.status === 'Active').length;
    const totalAccrued   = customerAccruals.filter(a => a.status === 'Active').reduce((s, a) => s + a.accruedAmount, 0);
    const draftMemos     = creditMemos.filter(m => m.status === 'Draft').length;
    const appliedYtd     = creditMemos.filter(m => m.status === 'Applied').reduce((s, m) => s + m.amount, 0);

    const filteredPrograms = customerPrograms.filter(p =>
      rebateProgramFilter === 'All' ? true : p.status === rebateProgramFilter
    );
    const filteredMemos = creditMemos.filter(m =>
      rebateMemoFilter === 'All' ? true : m.status === rebateMemoFilter
    );

    const handleIssueMemo = (accrual) => {
      const prog = customerPrograms.find(p => p.id === accrual.programId);
      const newMemo = {
        id: `CRM-REBATE-${String(creditMemos.length + 1).padStart(3, '0')}`,
        accrualId: accrual.id, programId: accrual.programId,
        customerId: accrual.customerId, customerName: accrual.customerName,
        programName: prog?.name || '—',
        amount: accrual.accruedAmount,
        issuedDate: TODAY, appliedDate: null, status: 'Issued', notes: '',
      };
      setCreditMemos(prev => [...prev, newMemo]);
      setCustomerAccruals(prev => prev.map(a => a.id === accrual.id ? { ...a, status: 'Closed' } : a));
      setRebateSubTab('memos');
      showToast(`Credit memo ${newMemo.id} issued for ${fmt$(accrual.accruedAmount)}`);
    };

    const handleApplyMemo = (memo) => {
      setCreditMemos(prev => prev.map(m => m.id === memo.id ? { ...m, status: 'Applied', appliedDate: TODAY } : m));
      showToast(`${memo.id} applied to ${memo.customerName}'s account`);
    };

    const handleVoidMemo = (memo) => {
      setCreditMemos(prev => prev.map(m => m.id === memo.id ? { ...m, status: 'Void' } : m));
      showToast(`${memo.id} voided`, 'warning');
    };

    return (
      <div className="flex flex-col h-full bg-gray-950">
        {/* Header */}
        <div className={`${UI.glassHeader} px-8 py-5 flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('dashboard')}
              className="p-2 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3 tracking-wide">
                <BadgeDollarSign className="w-6 h-6 text-cyan-500" /> Customer Rebate & Allowance Tracking
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage customer rebate programs, accruals, and credit memo issuance.</p>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-auto">
          {/* KPI Strip */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Programs',    value: activePrograms, icon: BadgeDollarSign, color: 'text-cyan-400',    sub: 'enrolled accounts'     },
              { label: 'Accrued This Period', value: fmt$(totalAccrued), icon: TrendingUp, color: 'text-emerald-400', sub: 'active accruals only'   },
              { label: 'Draft Memos',        value: draftMemos,     icon: Receipt,         color: 'text-amber-400',   sub: 'pending issuance'       },
              { label: 'Applied YTD',        value: fmt$(appliedYtd), icon: CheckCircle2,  color: 'text-violet-400',  sub: 'credit memos applied'   },
            ].map(k => (
              <div key={k.label} className={UI.card}>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{k.label}</p>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{k.sub}</p>
                  </div>
                  <k.icon className={`w-8 h-8 ${k.color} opacity-30`} />
                </div>
              </div>
            ))}
          </div>

          {/* Sub-tab navigation */}
          <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
            {[
              { id: 'programs', label: 'Programs', count: activePrograms },
              { id: 'accruals', label: 'Accruals',  count: customerAccruals.filter(a=>a.status==='Active').length },
              { id: 'memos',    label: 'Credit Memos', count: draftMemos || null },
            ].map(t => (
              <button key={t.id} onClick={() => setRebateSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  rebateSubTab === t.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300'
                }`}>
                {t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${rebateSubTab===t.id?'bg-cyan-500/20 text-cyan-400':'bg-gray-700 text-gray-400'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── PROGRAMS SUB-TAB ── */}
          {rebateSubTab === 'programs' && (
            <div>
              {/* Filter pills */}
              <div className="flex gap-2 mb-5">
                {['Active', 'Closed', 'All'].map(f => (
                  <button key={f} onClick={() => setRebateProgramFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      rebateProgramFilter === f
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                    }`}>{f}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredPrograms.map(prog => {
                  const enrolled = customerAccruals.filter(a => a.programId === prog.id);
                  const totalAccruedForProg = enrolled.reduce((s,a) => s + a.accruedAmount, 0);
                  return (
                    <div key={prog.id} className={`${UI.card} flex flex-col`}>
                      <div className="px-5 py-4 border-b border-gray-800 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${programTypeBadge(prog.type)}`}>
                              {programTypeLabel(prog.type)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              prog.status==='Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-700/60 text-gray-400 border border-gray-700'
                            }`}>{prog.status}</span>
                          </div>
                          <h3 className="font-bold text-gray-100 text-sm">{prog.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{prog.period} · {prog.category}</p>
                        </div>
                        <BadgeDollarSign className="w-5 h-5 text-cyan-500/50 shrink-0 mt-1" />
                      </div>
                      <div className="px-5 py-4 flex-1">
                        <p className="text-xs text-gray-400 mb-3">{prog.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            {prog.rateType === 'pct' ? `${prog.rateValue}% of spend` : `${fmt$(prog.rateValue)}/unit`}
                          </span>
                          {prog.thresholdSpend && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" /> Threshold: {fmt$(prog.thresholdSpend)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {enrolled.length} enrolled
                          </span>
                        </div>
                        {enrolled.length > 0 && (
                          <div className="border border-gray-800 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-900">
                                  <th className={`${UI.th} text-left`}>Customer</th>
                                  <th className={`${UI.th} text-right`}>YTD Spend</th>
                                  <th className={`${UI.th} text-right`}>Accrued</th>
                                  <th className={`${UI.th} text-center`}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {enrolled.map(acc => (
                                  <tr key={acc.id} className="hover:bg-gray-800/30">
                                    <td className={UI.td}><span className="font-medium text-gray-200">{acc.customerName}</span></td>
                                    <td className={`${UI.td} text-right font-mono text-gray-300`}>{fmt$(acc.ytdSpend)}</td>
                                    <td className={`${UI.td} text-right font-bold text-emerald-400 font-mono`}>{fmt$(acc.accruedAmount)}</td>
                                    <td className={`${UI.td} text-center`}>
                                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${accrualBadge(acc.status)}`}>{acc.status}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-900/60 border-t border-gray-800">
                                  <td className={`${UI.td} text-xs text-gray-500 font-semibold`} colSpan={2}>Program Total</td>
                                  <td className={`${UI.td} text-right font-bold text-cyan-400 font-mono`}>{fmt$(totalAccruedForProg)}</td>
                                  <td />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ACCRUALS SUB-TAB ── */}
          {rebateSubTab === 'accruals' && (
            <div>
              <div className={UI.card}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className={`${UI.th} text-left`}>Customer</th>
                        <th className={`${UI.th} text-left`}>Program</th>
                        <th className={`${UI.th} text-right`}>YTD Spend</th>
                        <th className={`${UI.th} text-right`}>Accrued</th>
                        <th className={`${UI.th} text-center`}>Status</th>
                        <th className={`${UI.th} text-center`}>Updated</th>
                        <th className={`${UI.th} text-center`}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerAccruals.map(acc => {
                        const prog = customerPrograms.find(p => p.id === acc.programId);
                        const alreadyMemo = creditMemos.some(m => m.accrualId === acc.id && m.status !== 'Void');
                        return (
                          <tr key={acc.id} className="hover:bg-gray-800/30">
                            <td className={UI.td}>
                              <span className="font-semibold text-gray-100">{acc.customerName}</span>
                              <div className="text-xs text-gray-500">{acc.customerId}</div>
                            </td>
                            <td className={UI.td}>
                              <span className="text-gray-300">{prog?.name || '—'}</span>
                              <div className="text-xs text-gray-500">{prog?.period || '—'}</div>
                            </td>
                            <td className={`${UI.td} text-right font-mono text-gray-300`}>{fmt$(acc.ytdSpend)}</td>
                            <td className={`${UI.td} text-right font-bold text-emerald-400 font-mono`}>{fmt$(acc.accruedAmount)}</td>
                            <td className={`${UI.td} text-center`}>
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${accrualBadge(acc.status)}`}>{acc.status}</span>
                            </td>
                            <td className={`${UI.td} text-center text-xs text-gray-500`}>{acc.lastUpdated}</td>
                            <td className={`${UI.td} text-center`}>
                              {acc.status === 'Active' && !alreadyMemo ? (
                                <button onClick={() => handleIssueMemo(acc)}
                                  className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-semibold hover:bg-cyan-500/20 transition-colors">
                                  Issue Memo
                                </button>
                              ) : (
                                <span className="text-xs text-gray-600">{alreadyMemo ? 'Memo Issued' : '—'}</span>
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
          )}

          {/* ── CREDIT MEMOS SUB-TAB ── */}
          {rebateSubTab === 'memos' && (
            <div>
              {/* Filter pills */}
              <div className="flex gap-2 mb-5">
                {['All', 'Draft', 'Issued', 'Applied', 'Void'].map(f => (
                  <button key={f} onClick={() => setRebateMemoFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      rebateMemoFilter === f
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                    }`}>{f}</button>
                ))}
              </div>
              <div className={UI.card}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className={`${UI.th} text-left`}>Memo #</th>
                        <th className={`${UI.th} text-left`}>Customer</th>
                        <th className={`${UI.th} text-left`}>Program</th>
                        <th className={`${UI.th} text-right`}>Amount</th>
                        <th className={`${UI.th} text-center`}>Status</th>
                        <th className={`${UI.th} text-center`}>Issued</th>
                        <th className={`${UI.th} text-center`}>Applied</th>
                        <th className={`${UI.th} text-center`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMemos.map(memo => (
                        <tr key={memo.id} className="hover:bg-gray-800/30">
                          <td className={`${UI.td} font-mono text-xs text-gray-400`}>{memo.id}</td>
                          <td className={UI.td}>
                            <span className="font-semibold text-gray-100">{memo.customerName}</span>
                          </td>
                          <td className={`${UI.td} text-gray-400 text-xs`}>{memo.programName}</td>
                          <td className={`${UI.td} text-right font-bold text-emerald-400 font-mono`}>{fmt$(memo.amount)}</td>
                          <td className={`${UI.td} text-center`}>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${memoBadge(memo.status)}`}>{memo.status}</span>
                          </td>
                          <td className={`${UI.td} text-center text-xs text-gray-500`}>{memo.issuedDate || '—'}</td>
                          <td className={`${UI.td} text-center text-xs text-gray-500`}>{memo.appliedDate || '—'}</td>
                          <td className={`${UI.td} text-center`}>
                            <div className="flex items-center justify-center gap-2">
                              {memo.status === 'Issued' && (
                                <button onClick={() => handleApplyMemo(memo)}
                                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
                                  Apply
                                </button>
                              )}
                              {(memo.status === 'Draft' || memo.status === 'Issued') && (
                                <button onClick={() => handleVoidMemo(memo)}
                                  className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold hover:bg-rose-500/20 transition-colors">
                                  Void
                                </button>
                              )}
                              {(memo.status === 'Applied' || memo.status === 'Void') && (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-900/60 border-t border-gray-800">
                        <td className={`${UI.td} text-xs text-gray-500 font-semibold`} colSpan={3}>Total Shown</td>
                        <td className={`${UI.td} text-right font-bold text-cyan-400 font-mono`}>
                          {fmt$(filteredMemos.reduce((s,m) => s + m.amount, 0))}
                        </td>
                        <td colSpan={4} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="flex flex-col h-full bg-gray-950 relative">
      {/* Header */}
      <div className={`${UI.glassHeader} px-8 py-5 flex justify-between items-center shrink-0`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3 tracking-wide">
            <Building className="w-6 h-6 text-cyan-500" /> Customer Success & Directory
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage enterprise accounts, B2B access, and contract pricing.</p>
        </div>
        <div id="kernal-module-tabs" className="flex items-center gap-2">
          <button onClick={() => setView('analytics')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors">
            <BarChart3 className="w-4 h-4" /> Sales Analytics
          </button>
          <button onClick={() => { setRebateSubTab('programs'); setView('rebates'); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 text-gray-400 hover:text-violet-400 hover:border-violet-500/40 transition-colors">
            <BadgeDollarSign className="w-4 h-4" /> Customer Rebates
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className={UI.btnPrimary}>
            <UserPlus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-auto">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search by ID or Account Name…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`${UI.input} pl-10`} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${UI.select} w-auto`}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className={`${UI.card} overflow-hidden`}>
          <table className="min-w-full divide-y divide-gray-800 text-sm">
            <thead className="bg-gray-900/80">
              <tr>
                {['Account','Health','Status','A/R Balance', ...(creditTermsEnabled ? ['Credit Utilization'] : []),'B2B Portal',''].map((h, i) => (
                  <th key={i} className={`${UI.th} ${i >= 3 ? (i === 3 ? 'text-right' : i >= (creditTermsEnabled ? 5 : 4) ? 'text-center' : '') : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredCustomers.map(customer => {
                const arBalance   = customer.creditLimit - customer.availableCredit;
                const utilPct     = (arBalance / customer.creditLimit) * 100;
                const isOverLimit = utilPct >= 100;
                return (
                  <tr key={customer.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className={UI.td}>
                      <div className="font-semibold text-gray-100">{customer.name}</div>
                      <div className="text-gray-500 text-xs">{customer.id}</div>
                    </td>
                    <td className={`${UI.td} text-center`}>
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border ${healthBadge(customer.healthScore)}`}>
                        {customer.healthScore}
                      </span>
                    </td>
                    <td className={UI.td}>
                      <span className={customer.status === 'Active' ? UI.badgeGreen : UI.badgeRed}>{customer.status}</span>
                      {customerPricingEnabled && (() => {
                        const tm = tierMeta(customer.pricingTier || 'standard');
                        return <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${tm.bg} ${tm.color}`}>{tm.label}</span>;
                      })()}
                    </td>
                    <td className={`${UI.td} text-right font-semibold text-gray-100`}>
                      {fmt$(arBalance)}
                      {creditTermsEnabled && customer.creditHold && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">HOLD</span>
                      )}
                    </td>
                    {creditTermsEnabled && (
                      <td className={UI.td}>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-800 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${isOverLimit ? 'bg-rose-500' : utilPct > 80 ? 'bg-cyan-500' : 'bg-cyan-500/60'}`}
                              style={{ width: `${Math.min(utilPct, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{utilPct.toFixed(0)}%</span>
                        </div>
                      </td>
                    )}
                    <td className={`${UI.td} text-center`}>
                      {customer.b2bPortalAccess
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400 inline-block" />
                        : <X className="w-5 h-5 text-gray-700 inline-block" />}
                    </td>
                    <td className={`${UI.td} text-right`}>
                      <button onClick={() => openDetail(customer)}
                        className="text-cyan-500 hover:text-cyan-400 font-medium text-xs uppercase tracking-widest hover:underline transition-colors">
                        Manage →
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-600 text-sm">No customers match your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Customer Modal ── FIX #1: fixed inset-0 ── */}
      {isAddModalOpen && (
        <ModalOverlay>
          <ModalBox maxW="max-w-2xl">
            <ModalHeader title="Create New Account" icon={UserPlus} onClose={() => setIsAddModalOpen(false)} />
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className={UI.label}>Account Name *</label>
                {/* FIX #7: All form inputs use functional updater setNewCustomerForm(prev => ...) */}
                <input type="text" required placeholder="Legal Entity Name" className={UI.input}
                  value={newCustomerForm.name}
                  onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, name: v})); }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={UI.label}>DBA (Storefront Name)</label>
                  <input type="text" placeholder="Doing Business As" className={UI.input}
                    value={newCustomerForm.dba}
                    onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, dba: v})); }} />
                </div>
                <div>
                  <label className={UI.label}>Industry Segment</label>
                  <select className={UI.select} value={newCustomerForm.industry}
                    onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, industry: v})); }}>
                    <option value="Restaurant & Hospitality">Restaurant & Hospitality</option>
                    <option value="Healthcare / Institution">Healthcare / Institution</option>
                    <option value="Education / School">Education / School</option>
                    <option value="Corporate Campus">Corporate Campus</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Primary Contact</label>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <input type="text" required placeholder="Contact Name" className={UI.input}
                    value={newCustomerForm.contactName}
                    onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, contactName: v})); }} />
                  <input type="tel" placeholder="Phone Number" className={UI.input}
                    value={newCustomerForm.contactPhone}
                    onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, contactPhone: v})); }} />
                </div>
                <input type="email" required placeholder="Email Address" className={UI.input}
                  value={newCustomerForm.contactEmail}
                  onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, contactEmail: v})); }} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                <div>
                  <label className={UI.label}>Account ID</label>
                  <input type="text" required className={`${UI.input} bg-gray-800/50`}
                    value={newCustomerForm.id}
                    onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, id: v})); }} />
                </div>
                <div>
                  {customerPricingEnabled && (
                    <div className="mb-4">
                      <label className={UI.label}>Pricing Tier</label>
                      <select
                        value={editedCustomer.pricingTier || 'standard'}
                        onChange={e => setEditedCustomer(prev => ({ ...prev, pricingTier: e.target.value }))}
                        className={UI.input}
                      >
                        {pricingTiers.map(t => (
                          <option key={t.id} value={t.id}>{t.label} — {Math.round((1 - t.multiplier) * 100)}% off list</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-600 mt-1">Tier discount is applied to all list prices on the B2B portal and sales orders.</p>
                    </div>
                  )}
                  <label className={UI.label}>Payment Terms</label>
                  <select className={UI.select} value={newCustomerForm.terms}
                    onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, terms: v})); }}>
                    {creditTermsEnabled && <option value="Net-30">Net-30</option>}
                    {creditTermsEnabled && <option value="Net-60">Net-60</option>}
                    {creditTermsEnabled && <option value="Net-90">Net-90</option>}
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>
              {creditTermsEnabled && (
              <div>
                <label className={UI.label}>Initial Credit Limit ($)</label>
                <input type="number" required min="0" step="1000" className={UI.input}
                  value={newCustomerForm.creditLimit}
                  onChange={e => { const v = e.target.value; setNewCustomerForm(prev => ({...prev, creditLimit: v})); }} />
              </div>
              )}

              {/* Document Upload */}
              <div className="pt-2">
                <label className={UI.label}>Initial Documents (Optional)</label>
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center hover:border-cyan-500/40 transition-colors">
                  <UploadCloud className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-xs text-gray-500">
                    Drag & drop or <label className="text-cyan-500 cursor-pointer hover:underline">
                      browse
                      <input type="file" multiple className="hidden" onChange={e => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        const newDocs = files.map(f => ({ id: `doc-${Math.random().toString(36).substr(2,9)}`, name: f.name, type: 'Upload', date: TODAY, size: (f.size/1024/1024).toFixed(2)+' MB' }));
                        setNewCustomerForm(prev => ({...prev, documents: [...(prev.documents||[]), ...newDocs]}));
                      }} />
                    </label>
                  </span>
                </div>
                {newCustomerForm.documents?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newCustomerForm.documents.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center text-xs p-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <File className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="truncate text-gray-300">{doc.name}</span>
                        </div>
                        <button type="button" onClick={() => setNewCustomerForm(prev => ({...prev, documents: prev.documents.filter(d => d.id !== doc.id)}))}
                          className="text-rose-400 hover:text-rose-300 ml-2"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className={UI.btnGhost}>Cancel</button>
                <button type="submit" className={UI.btnPrimary}>Provision Account</button>
              </div>
            </form>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  const renderDetail = () => {
    if (!editedCustomer) return null;
    const ec = editedCustomer; // alias for readability

    // FIX #6: All setEditedCustomer onChange handlers use functional updater
    const setField = (field, value) => setEditedCustomer(prev => ({...prev, [field]: value}));
    const setAddrField = (field, value) => setEditedCustomer(prev => ({...prev, address: {...prev.address, [field]: value}}));

    // ── Portal access toggle ─────────────────────────────────────────────────
    // DEMO_MODE: local-state toggle only.
    // Live mode turning ON: open the inline setup form (email + password).
    // Live mode turning OFF: call deactivate API if a profile ID is stored.
    const handleToggleB2B = async () => {
      if (DEMO_MODE) {
        setEditedCustomer(prev => ({...prev, b2bPortalAccess: !prev.b2bPortalAccess}));
        return;
      }
      if (ec.b2bPortalAccess) {
        // Disable: deactivate if we have a real profile
        if (ec.b2bProfileId) {
          try {
            await api.admin.b2bCustomers.deactivate(ec.b2bProfileId);
            setEditedCustomer(prev => ({...prev, b2bPortalAccess: false, b2bProfileId: null}));
            setCustomers(prev => prev.map(c => c.id === ec.id ? {...c, b2bPortalAccess: false, b2bProfileId: null} : c));
            showToast('Portal access deactivated.');
          } catch (e) {
            showToast(`Error: ${e.message}`, 'error');
          }
        } else {
          // Was toggled on without ever saving — just flip off
          setEditedCustomer(prev => ({...prev, b2bPortalAccess: false}));
        }
        setPortalSetupOpen(null);
      } else {
        // Enable: open the inline setup form, pre-fill from CRM data
        const primary = ec.contacts?.find(c => c.isPrimary);
        setPortalSetupForm({
          email:    primary?.email || '',
          password: '',
        });
        setPortalSetupError(null);
        setPortalSetupOpen(ec.id);
      }
    };

    // ── Submit portal setup form ─────────────────────────────────────────────
    // Convert CRM day IDs (1=Mon…7=Sun) to B2B schema (0=Sun, 1=Mon…6=Sat)
    const crmDayToB2B = (d) => d === 7 ? 0 : d;
    const handlePortalSetupSave = async (e) => {
      e.preventDefault();
      if (!portalSetupForm.email || portalSetupForm.password.length < 6) return;
      setPortalSetupSaving(true); setPortalSetupError(null);
      try {
        const res = await api.admin.b2bCustomers.create({
          email:            portalSetupForm.email,
          password:         portalSetupForm.password,
          display_name:     ec.dba || ec.name,
          credit_limit:     ec.creditLimit     || 0,
          available_credit: ec.availableCredit || 0,
          credit_hold:      ec.creditHold      || false,
          ar_aging_days90:  ec.arAging?.days90 || 0,
          payment_terms:    ec.terms           || 'Net-30',
          route:            ec.route           || null,
          delivery_days:    (ec.deliveryDays   || []).map(crmDayToB2B),
          pricing_tier:     ec.pricingTier     || 'standard',
          contract_pricing: {},
          order_guide_ids:  [],
        });
        const profileId = res.data.id;
        setEditedCustomer(prev => ({...prev, b2bPortalAccess: true, b2bProfileId: profileId}));
        setCustomers(prev => prev.map(c => c.id === ec.id ? {...c, b2bPortalAccess: true, b2bProfileId: profileId} : c));
        setPortalSetupOpen(null);
        showToast(`Portal access granted to ${portalSetupForm.email}`);
      } catch (err) {
        setPortalSetupError(err.message);
      } finally {
        setPortalSetupSaving(false);
      }
    };
    const handleRouteChange  = (v) => setField('route', v);
    const handleDayToggle    = (dayId) => setEditedCustomer(prev => {
      const days = prev.deliveryDays.includes(dayId)
        ? prev.deliveryDays.filter(d => d !== dayId)
        : [...prev.deliveryDays, dayId].sort();
      return {...prev, deliveryDays: days};
    });

    const handleRemoveContractPrice = (skuId) => setEditedCustomer(prev => {
      const p = {...prev.contractPricing}; delete p[skuId]; return {...prev, contractPricing: p};
    });
    const handleAddContractPrice = (e) => {
      e.preventDefault();
      const skuId = e.target.skuId.value;
      const price = parseFloat(e.target.price.value);
      if (skuId && !isNaN(price)) {
        setEditedCustomer(prev => ({...prev, contractPricing: {...prev.contractPricing, [skuId]: price}}));
        e.target.reset();
      }
    };

    const handleUploadVaultDoc = (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      const newDocs = files.map(f => ({ id: `doc-${Math.random().toString(36).substr(2,9)}`, name: f.name, type: 'Manual Upload', date: TODAY, size: (f.size/1024/1024).toFixed(2)+' MB' }));
      setEditedCustomer(prev => ({...prev, documents: [...(prev.documents||[]), ...newDocs]}));
    };
    const handleRemoveVaultDoc  = (docId) => setEditedCustomer(prev => ({...prev, documents: prev.documents.filter(d => d.id !== docId)}));
    const handleRemovePlaybook  = (pbId)  => setEditedCustomer(prev => ({...prev, activePlaybooks: prev.activePlaybooks.filter(p => p.id !== pbId)}));
    const handleResolveTicket   = (tId)   => setEditedCustomer(prev => ({...prev, tickets: prev.tickets.map(t => t.id === tId ? {...t, status:'Resolved'} : t)}));
    const handleToggleTask      = (tId)   => setEditedCustomer(prev => ({...prev, tasks: prev.tasks.map(t => t.id === tId ? {...t, status: t.status==='Pending'?'Completed':'Pending'} : t)}));

    const handleEnrollPlaybook = (e) => {
      e.preventDefault();
      const pb = MOCK_PLAYBOOKS.find(p => p.id === e.target.playbookId.value);
      if (!pb) return;
      setEditedCustomer(prev => ({...prev, activePlaybooks: [...(prev.activePlaybooks||[]), { id: pb.id, name: pb.name, status: 'Active', enrolledDate: TODAY }]}));
      setPlaybookModal({ isOpen: false });
      showToast(`Enrolled in: ${pb.name}`);
    };

    // FIX #4: Capture ticketModal.ticket before entering the functional updater
    const handleSaveTicket = (e) => {
      e.preventDefault();
      const ticket = ticketModal.ticket;
      setEditedCustomer(prev => {
        const newTicket = { ...ticket, id: ticket.id || `TKT-${Math.floor(Math.random()*9000)+1000}`, date: ticket.date || TODAY, status: 'Open' };
        return {...prev, tickets: [newTicket, ...(prev.tickets||[])]};
      });
      setTicketModal({ isOpen: false, ticket: null });
      showToast('Support ticket opened successfully.');
    };

    const handleSaveTask = (e) => {
      e.preventDefault();
      const task = taskModal.task;
      setEditedCustomer(prev => ({...prev, tasks: [{...task, id: task.id||`tsk-${Date.now()}`, status:'Pending'}, ...(prev.tasks||[])]}));
      setTaskModal({ isOpen: false, task: null });
      showToast('Task added to calendar.');
    };

    // FIX #5: Capture contactModal.contact and mode before the functional updater
    const handleSaveContact = (e) => {
      e.preventDefault();
      const contact = contactModal.contact;
      const mode    = contactModal.mode;
      setEditedCustomer(prev => {
        let contacts = [...prev.contacts];
        if (contact.isPrimary) contacts = contacts.map(c => ({...c, isPrimary: false}));
        if (mode === 'edit') contacts = contacts.map(c => c.id === contact.id ? contact : c);
        else contacts.push({...contact});
        return {...prev, contacts};
      });
      setContactModal({ isOpen: false, mode: 'add', contact: null });
    };
    const handleDeleteContact = (cId) => {
      setEditedCustomer(prev => ({...prev, contacts: prev.contacts.filter(c => c.id !== cId)}));
      setContactModal({ isOpen: false, mode: 'add', contact: null });
    };

    const handleSendPortalInvite = (contact) => {
      if (!ec.b2bPortalAccess) { showToast('Enable Web Portal Access for this account first.', 'warning'); return; }
      setEditedCustomer(prev => ({...prev, contacts: prev.contacts.map(c => c.id === contact.id ? {...c, portalStatus:'Invited (Pending)'} : c)}));
      showToast(`Setup email sent to ${contact.email}`);
    };

    const getActivityIcon = (type) => {
      if (['call','Call'].includes(type))    return <Phone className="w-3.5 h-3.5" />;
      if (['email','Email'].includes(type))  return <Mail  className="w-3.5 h-3.5" />;
      return <Activity className="w-3.5 h-3.5" />;
    };

    const arBalance  = ec.creditLimit - ec.availableCredit;
    const isSpendUp  = ec.analytics.ytdSpend > ec.analytics.lytdSpend;
    const spendPct   = ec.analytics.lytdSpend > 0
      ? (((ec.analytics.ytdSpend - ec.analytics.lytdSpend) / ec.analytics.lytdSpend) * 100).toFixed(1)
      : '0.0';

    return (
      <div className="flex flex-col h-full bg-gray-950 overflow-hidden text-sm">
        {/* ── Detail Header ── */}
        <div className={`${UI.glassHeader} px-6 py-4 flex justify-between items-center shrink-0 z-10`}>
          <div className="flex items-center gap-4">
            <button onClick={closeDetail} className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-gray-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-100 tracking-wide">{ec.name}</h2>
                <span className={ec.status === 'Active' ? UI.badgeGreen : UI.badgeRed}>{ec.status}</span>
                {creditTermsEnabled && ec.creditHold && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <AlertCircle className="w-3 h-3" /> Credit Hold
                  </span>
                )}
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${healthBadge(ec.healthScore)}`}>
                  <HeartPulse className="w-3 h-3" /> {ec.healthScore}
                </span>
                {customerPricingEnabled && (() => {
                  const tm = tierMeta(ec.pricingTier || 'standard');
                  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tm.bg} ${tm.color}`}>{tm.label} Pricing</span>;
                })()}
              </div>
              <p className="text-gray-500 text-xs">
                DBA: <span className="font-medium text-gray-300">{ec.dba}</span>
                {' · '}ID: {ec.id}{' · '}Terms: {ec.terms}{' · '}Risk:{' '}
                <span className={ec.churnRisk === 'High' ? 'text-rose-400 font-bold' : ec.churnRisk === 'Medium' ? 'text-cyan-500 font-bold' : 'text-emerald-400 font-bold'}>
                  {ec.churnRisk}
                </span>
              </p>
            </div>
          </div>
          <button onClick={handleSaveCustomer} className={UI.btnPrimary}>
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Organization Profile + Contacts */}
              <div className={UI.cardPad}>
                <h3 className={UI.sectionTitle}><Briefcase className="w-4 h-4 text-cyan-500" /> Organization Profile</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={UI.label}>Tax ID / EIN</label>
                      <input type="text" className={UI.inputSm} value={ec.taxId}
                        onChange={e => { const v = e.target.value; setField('taxId', v); }} />
                    </div>
                    <div>
                      <label className={UI.label}>Industry</label>
                      <input type="text" className={`${UI.inputSm} bg-gray-800/50`} value={ec.industry}
                        onChange={e => { const v = e.target.value; setField('industry', v); }} />
                    </div>
                  </div>

                  <div>
                    <label className={`${UI.label} flex items-center gap-1`}><MapPin className="w-3 h-3" /> Address</label>
                    <div className="space-y-2">
                      <input type="text" placeholder="Street Address" className={UI.inputSm} value={ec.address.street}
                        onChange={e => { const v = e.target.value; setAddrField('street', v); }} />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="City" className={`col-span-2 ${UI.inputSm}`} value={ec.address.city}
                          onChange={e => { const v = e.target.value; setAddrField('city', v); }} />
                        <input type="text" placeholder="Zip" className={UI.inputSm} value={ec.address.zip}
                          onChange={e => { const v = e.target.value; setAddrField('zip', v); }} />
                      </div>
                    </div>
                  </div>

                  {/* Stakeholders */}
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center mb-3">
                      <label className={`${UI.label} flex items-center gap-1 mb-0`}><Contact2 className="w-3 h-3" /> Stakeholders</label>
                      <button onClick={() => setContactModal({ isOpen: true, mode: 'add',
                        contact: { id: `c-${Math.random().toString(36).substr(2,9)}`, name:'', title:'', phone:'', email:'', isPrimary:false, portalStatus:'Not Invited' }})}
                        className="text-cyan-500 hover:text-cyan-400 text-xs font-bold flex items-center gap-1 transition-colors">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-3">
                      {ec.contacts.map(contact => (
                        <div key={contact.id} className="bg-gray-900 border border-gray-700/50 rounded-xl p-3 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-100 text-sm">{contact.name}</span>
                              {contact.isPrimary && <span className={UI.badgeSky}>Primary</span>}
                            </div>
                            <div className="text-xs text-gray-500 mb-2">{contact.title}</div>
                            <div className="text-xs text-gray-400 flex flex-col gap-0.5 mb-2">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-600" /> {contact.phone}</span>
                              <span className="flex items-center gap-1"><Mail  className="w-3 h-3 text-gray-600" /> {contact.email}</span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                contact.portalStatus === 'Active'           ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                contact.portalStatus === 'Suspended'        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                contact.portalStatus === 'Invited (Pending)'? 'bg-cyan-600/10 text-cyan-500 border-cyan-600/20' :
                                                                              'bg-gray-800 text-gray-500 border-gray-700'
                              }`}>
                                {contact.portalStatus}
                              </span>
                              {contact.portalStatus !== 'Active' && contact.portalStatus !== 'Suspended' && (
                                <button onClick={() => handleSendPortalInvite(contact)}
                                  className={`text-xs font-medium transition-colors ${ec.b2bPortalAccess ? 'text-cyan-500 hover:text-cyan-400' : 'text-gray-600 cursor-not-allowed'}`}>
                                  Send Invite
                                </button>
                              )}
                              {contact.portalStatus === 'Active' && (
                                <button onClick={() => handleSendPortalInvite(contact)} className="text-xs font-medium text-gray-500 hover:text-cyan-500 transition-colors">
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setContactModal({ isOpen:true, mode:'edit', contact:{...contact} })}
                            className="text-gray-600 hover:text-gray-400 p-1 transition-colors">
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Health */}
              {creditTermsEnabled && <div className={UI.cardPad}>
                <h3 className={UI.sectionTitle}><CreditCard className="w-4 h-4 text-cyan-500" /> Financial Health</h3>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>A/R Balance</span><span>Credit Limit</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-100 mb-2">
                  <span className="text-lg">{fmt$(arBalance)}</span>
                  <span>{fmt$(ec.creditLimit)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full ${(arBalance/ec.creditLimit) > 0.9 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                    style={{ width: `${Math.min((arBalance/ec.creditLimit)*100, 100)}%` }} />
                </div>
                <div className="pt-3 border-t border-gray-800">
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">A/R Aging</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[['Current', ec.arAging.current, false], ['1–30', ec.arAging.days30, true], ['31–60', ec.arAging.days60, true], ['60+', ec.arAging.days90, true]].map(([label, val, warn]) => (
                      <div key={label} className="bg-gray-800/50 border border-gray-800 rounded-lg p-2">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">{label}</div>
                        <div className={`font-bold text-xs ${warn && val > 0 ? (label === '60+' ? 'text-rose-400' : 'text-cyan-500') : 'text-gray-100'}`}>{fmt$(val)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Credit Hold Toggle */}
                <div className={`mt-3 pt-3 border-t border-gray-800 flex items-center justify-between rounded-lg px-3 py-2.5 ${ec.creditHold ? 'bg-rose-500/8 border border-rose-500/20' : 'bg-gray-800/30'}`}>
                  <div>
                    <div className={`font-semibold text-sm ${ec.creditHold ? 'text-rose-400' : 'text-gray-200'}`}>Credit Hold</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {ec.creditHold
                        ? 'Account blocked — B2B ordering disabled'
                        : ec.arAging.days90 > 0
                          ? `⚠ ${fmt$(ec.arAging.days90)} in 60+ days aging`
                          : 'No outstanding past-due balance'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Toggling ON (placing on hold) — direct, no approval needed
                      // Toggling OFF (releasing) — route through approval if the rule requires it
                      if (!ec.creditHold) {
                        setEditedCustomer(prev => ({ ...prev, creditHold: true }));
                        logAudit({
                          moduleId: 'crm',
                          action: 'credit.hold.set',
                          entityType: 'customer',
                          entityId: ec.id,
                          summary: `Credit hold placed on ${ec.name}`,
                          before: { creditHold: false },
                          after:  { creditHold: true },
                          severity: 'warning',
                        });
                        return;
                      }
                      const rule = settings.approvalRules?.credit_release;
                      if (settings.features.approvalWorkflows !== false && rule?.enabled) {
                        // Route through approval; open the reason modal
                        setCreditReleaseModal({ open: true, customer: ec });
                      } else {
                        setEditedCustomer(prev => ({ ...prev, creditHold: false }));
                        logAudit({
                          moduleId: 'crm',
                          action: 'credit.hold.released',
                          entityType: 'customer',
                          entityId: ec.id,
                          summary: `Credit hold released on ${ec.name}`,
                          before: { creditHold: true },
                          after:  { creditHold: false },
                          severity: 'notice',
                        });
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ec.creditHold ? 'bg-rose-500' : 'bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-gray-950 transition-transform ${ec.creditHold ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {ec.creditHold && settings.features.approvalWorkflows !== false && settings.approvalRules?.credit_release?.enabled && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Lifting this hold requires manager or accountant approval.</span>
                  </div>
                )}
                {/* Discount Override request button */}
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => { setDiscountForm({ skuScope: '', discountPct: '', expiresOn: '', reason: '' }); setDiscountModal({ open: true, customer: ec }); }}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Request Discount Override
                  </button>
                </div>
              </div>}

              {/* Platform Access */}
              <div className={UI.cardPad}>
                <h3 className={UI.sectionTitle}><Settings className="w-4 h-4 text-cyan-500" /> Platform Access</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-200 text-sm">Web Portal Access</div>
                        <div className="text-xs text-gray-500">
                          {ec.b2bPortalAccess
                            ? ec.lastLogin
                              ? `Last login: ${new Date(ec.lastLogin).toLocaleDateString()}`
                              : 'Active — no logins yet'
                            : 'Allow self-serve ordering via B2B Portal'}
                        </div>
                      </div>
                      <button onClick={handleToggleB2B}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ec.b2bPortalAccess ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-gray-950 transition-transform ${ec.b2bPortalAccess ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Inline portal setup form — appears when toggling ON in live mode */}
                    {!DEMO_MODE && portalSetupOpen === ec.id && (
                      <form onSubmit={handlePortalSetupSave} className="mt-3 p-3 rounded-lg bg-gray-800/60 border border-cyan-500/20 space-y-3">
                        <p className="text-xs text-cyan-400 font-medium">Set up portal login credentials</p>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Login Email</label>
                          <input required type="email" value={portalSetupForm.email}
                            onChange={e => setPortalSetupForm(f => ({...f, email: e.target.value}))}
                            placeholder="orders@customer.com"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Temporary Password <span className="text-gray-600">(min 6 characters)</span></label>
                          <input required type="password" value={portalSetupForm.password}
                            onChange={e => setPortalSetupForm(f => ({...f, password: e.target.value}))}
                            placeholder="Customer will change on first login"
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50" />
                        </div>
                        <p className="text-[10px] text-gray-600">Credit limit, payment terms, route, and delivery days will be pre-filled from this account.</p>
                        {portalSetupError && <p className="text-xs text-rose-400">{portalSetupError}</p>}
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setPortalSetupOpen(null)}
                            className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-400 text-xs hover:text-gray-200 transition-colors">
                            Cancel
                          </button>
                          <button type="submit" disabled={portalSetupSaving || portalSetupForm.password.length < 6}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500 text-gray-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-50 transition-colors">
                            {portalSetupSaving ? 'Creating…' : 'Grant Portal Access'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <label className={UI.label}>Assigned Route (Module 4)</label>
                    <input type="text" value={ec.route} onChange={e => handleRouteChange(e.target.value)} className={UI.input} />
                  </div>
                  <div>
                    <label className={UI.label}>Delivery Days</label>
                    <div className="flex gap-1.5">
                      {DAYS_OF_WEEK.map(day => (
                        <button key={day.id} onClick={() => handleDayToggle(day.id)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            ec.deliveryDays.includes(day.id)
                              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500'
                              : 'bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-800'}`}>
                          {day.label[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Standing Orders Summary */}
              {ec.standingOrders && (
                <div className={UI.cardPad}>
                  <h3 className={`${UI.sectionTitle} mb-3`}><RefreshCw className="w-4 h-4 text-cyan-500" /> Standing Orders</h3>
                  {ec.standingOrders.length === 0 ? (
                    <p className="text-xs text-gray-600 italic">No standing order templates for this account.</p>
                  ) : (
                    <div className="space-y-2">
                      {ec.standingOrders.map(so => (
                        <div key={so.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                          <div>
                            <div className="text-sm font-medium text-gray-200">{so.name}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{so.frequency} · Next: {so.nextGenDate} · {so.items} SKU{so.items !== 1 ? 's' : ''}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${so.status === 'Active' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}>
                            {so.status}
                          </span>
                        </div>
                      ))}
                      <p className="text-[10px] text-gray-600 pt-1">Managed in B2B Portal → Standing tab.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Revenue Trends */}
              <div className={UI.cardPad}>
                <h3 className={UI.sectionTitle}><TrendingUp className="w-4 h-4 text-cyan-500" /> Revenue Trends</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Spend YTD vs Prior Year</div>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-xl font-bold text-gray-100">{fmt$(ec.analytics.ytdSpend)}</span>
                      <span className={`text-xs font-bold mb-0.5 ${isSpendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isSpendUp ? '+' : ''}{spendPct}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[['This Year', ec.analytics.ytdSpend, ec.analytics.ytdSpend, 'bg-cyan-500'],
                        ['Last Year', ec.analytics.lytdSpend, ec.analytics.ytdSpend, 'bg-gray-600']].map(([label, val, max, color]) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-medium text-gray-300">{fmt$(val)}</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-sm h-1.5">
                            <div className={`${color} h-1.5 rounded-sm`} style={{ width: `${max > 0 ? (val/max)*100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Delivery Success Rate</span>
                      <span className={`font-bold text-sm ${ec.analytics.deliverySuccessRate < 95 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {fmtPct(ec.analytics.deliverySuccessRate)}
                      </span>
                    </div>
                    {ec.analytics.deliverySuccessRate < 95 && (
                      <div className="flex gap-2 items-start bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-xs mt-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>High rate of OS&D exceptions. Review receiving dock hours.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* AI Insights */}
              <div className="bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-900/30 rounded-xl p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles className="w-32 h-32 text-indigo-200" />
                </div>
                <h3 className="font-bold text-indigo-300 flex items-center gap-2 mb-4 text-sm uppercase tracking-widest relative z-10">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> AI Insights & Next Best Action
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {ec.aiInsights.map(insight => (
                    <div key={insight.id} className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 shadow-sm flex gap-3 items-start">
                      {insight.type === 'opportunity' && <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {insight.type === 'risk'        && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                      {insight.type === 'action'      && <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{insight.type}</div>
                        <p className="text-sm text-gray-300 leading-snug">{insight.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Automations */}
              <div className={UI.card}>
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
                  <div>
                    <h3 className={UI.sectionTitle}><Workflow className="w-4 h-4 text-cyan-500" /> Workflow Automations</h3>
                    <p className="text-xs text-gray-500 -mt-3">Active playbooks and automated triggers assigned to this account.</p>
                  </div>
                  <button onClick={() => setPlaybookModal({ isOpen: true })} className={UI.btnOutline}>
                    <Plus className="w-3.5 h-3.5" /> Enroll
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  {ec.activePlaybooks?.length > 0 ? ec.activePlaybooks.map(pb => {
                    const master = MOCK_PLAYBOOKS.find(m => m.id === pb.id);
                    return (
                      <div key={pb.id} className="flex justify-between items-center p-4 border border-gray-800 rounded-xl bg-gray-900/50 hover:border-cyan-500/30 transition-colors group">
                        <div className="flex gap-3 items-start">
                          <div className={`mt-0.5 p-1.5 rounded-lg ${pb.status==='Triggered' ? 'bg-rose-500/10 text-rose-400' : 'bg-cyan-500/10 text-cyan-500'}`}>
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-100 text-sm">{pb.name}</span>
                              <span className={pb.status==='Triggered' ? UI.badgeRed : UI.badgeGreen}>{pb.status}</span>
                            </div>
                            {master && <div className="text-xs text-gray-500"><span className="text-gray-400 font-medium">If:</span> {master.trigger} <span className="mx-1 text-gray-600">→</span> <span className="text-gray-400 font-medium">Then:</span> {master.action}</div>}
                            <div className="text-[10px] text-gray-600 mt-1">Enrolled: {pb.enrolledDate}</div>
                          </div>
                        </div>
                        <button onClick={() => handleRemovePlaybook(pb.id)} className="text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded-xl">
                      No active workflows assigned to this account.
                    </div>
                  )}
                </div>
              </div>

              {/* CSAT & NPS */}
              <div className={UI.card}>
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
                  <div>
                    <h3 className={UI.sectionTitle}><MessageSquare className="w-4 h-4 text-cyan-500" /> CSAT & NPS Engine</h3>
                    <p className="text-xs text-gray-500 -mt-3">Automated satisfaction polling via Module 3 & 4 triggers.</p>
                  </div>
                  <button onClick={() => showToast('NPS survey dispatched to primary contact.')} className={UI.btnOutline}>
                    <Send className="w-3.5 h-3.5" /> Trigger Survey
                  </button>
                </div>
                <div className="p-5 flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center justify-center min-w-[120px] p-4 bg-gray-800/50 border border-gray-800 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">NPS Score</div>
                    <div className={`text-4xl font-black ${ec.npsData.score>=50?'text-emerald-400':ec.npsData.score>0?'text-cyan-500':'text-rose-400'}`}>
                      {ec.npsData.score > 0 ? '+' : ''}{ec.npsData.score}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {ec.npsData.history?.length > 0 ? ec.npsData.history.map(nps => {
                      const isPromoter = nps.score >= 9;
                      const isPassive  = nps.score >= 7;
                      return (
                        <div key={nps.id} className="flex gap-3 items-start p-3 border border-gray-800 rounded-xl bg-gray-900/50">
                          <div className={`p-1.5 rounded-full shrink-0 ${isPromoter?'bg-emerald-500/10 text-emerald-400':isPassive?'bg-cyan-600/10 text-cyan-500':'bg-rose-500/10 text-rose-400'}`}>
                            {isPromoter ? <Smile className="w-4 h-4" /> : isPassive ? <Meh className="w-4 h-4" /> : <Frown className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-100 text-sm">Score: {nps.score}/10</span>
                              <span className="text-[10px] text-gray-600">• {nps.date}</span>
                            </div>
                            {nps.comment && <p className="text-sm text-gray-400 italic">"{nps.comment}"</p>}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-4 text-gray-600 text-xs border-2 border-dashed border-gray-800 rounded-xl">No NPS data collected yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Whitespace Analysis */}
              <div className={UI.card}>
                <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
                  <div>
                    <h3 className={UI.sectionTitle}><Target className="w-4 h-4 text-cyan-500" /> Category Whitespace Analysis</h3>
                    <p className="text-xs text-gray-500 -mt-3">Cross-sell gaps vs. lookalike account penetration rates.</p>
                  </div>
                  <div className={UI.badgeSky}>
                    <PieChart className="w-3.5 h-3.5" />
                    Est. Upsell: {fmt$(ec.whitespaceAnalysis.reduce((a,c)=>a+(c.estValue||0),0))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-900/80">
                      <tr>
                        {['Category','Status','Peer Adoption','Recommendation','Est. MRR',''].map((h,i)=>(
                          <th key={i} className={`${UI.th} ${i>=4?'text-right':''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {ec.whitespaceAnalysis.map(gap => (
                        <tr key={gap.id} className={`${gap.status==='whitespace'?'bg-cyan-600/5':''} hover:bg-gray-800/30 transition-colors`}>
                          <td className={UI.td}><span className="font-medium text-gray-100">{gap.category}</span></td>
                          <td className={UI.td}>
                            {gap.status==='purchasing'
                              ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                              : <span className={UI.badgeAmber}>Gap Detected</span>}
                          </td>
                          <td className={UI.td}>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-800 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${gap.peerAdoption>80?'bg-cyan-500':'bg-gray-600'}`} style={{width:`${gap.peerAdoption}%`}} />
                              </div>
                              <span className="text-xs text-gray-400">{gap.peerAdoption}%</span>
                            </div>
                          </td>
                          <td className={UI.td}>
                            {gap.status==='whitespace'
                              ? <div><div className="font-medium text-gray-100">{gap.recommendedName}</div><div className="text-[10px] text-gray-500">{gap.recommendedSku}</div></div>
                              : <span className="text-xs italic text-gray-600">Buying</span>}
                          </td>
                          <td className={`${UI.td} text-right font-medium text-gray-300`}>{gap.estValue ? fmt$(gap.estValue) : '—'}</td>
                          <td className={`${UI.td} text-right`}>
                            {gap.status==='whitespace' && (
                              <button className="text-cyan-500 hover:text-cyan-400 flex items-center justify-end gap-1 text-xs font-medium w-full transition-colors">
                                Pitch <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Support Tickets */}
              <div className={UI.card}>
                <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                  <h3 className={UI.sectionTitle}><Ticket className="w-4 h-4 text-cyan-500" /> Support Tickets & RMA</h3>
                  <button onClick={() => setTicketModal({ isOpen:true, ticket:{ type:'General Inquiry', priority:'Normal', subject:'', description:'' } })}
                    className={UI.btnSecondary}>
                    <Plus className="w-3.5 h-3.5" /> Open Ticket
                  </button>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {ec.tickets?.length > 0 ? ec.tickets.map(ticket => (
                    <div key={ticket.id} className="p-4 hover:bg-gray-800/20 transition-colors flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-100 text-sm">{ticket.subject}</span>
                          <span className={ticket.status==='Open' ? UI.badgeAmber : UI.badgeGreen}>{ticket.status}</span>
                          {ticket.priority==='Critical' && <span className="flex items-center gap-1 text-rose-400 text-[10px] font-bold uppercase"><AlertCircle className="w-3 h-3" /> Critical</span>}
                          {ticket.priority==='High'     && <span className="text-cyan-500 text-[10px] font-bold uppercase">High</span>}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="text-gray-400 font-mono">{ticket.id}</span>
                          <span>•</span><span>{ticket.date}</span>
                          <span>•</span><span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{ticket.type}</span>
                        </div>
                      </div>
                      {ticket.status==='Open' && (
                        <button onClick={() => handleResolveTicket(ticket.id)}
                          className="shrink-0 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg transition-colors">
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-600 text-sm">No support tickets logged for this account.</div>
                  )}
                </div>
              </div>

              {/* Tasks + Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={UI.card}>
                  <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                    <h3 className={UI.sectionTitle}><ListTodo className="w-4 h-4 text-cyan-500" /> Tasks & Follow-ups</h3>
                    <button onClick={() => setTaskModal({ isOpen:true, task:{ title:'', type:'Call', priority:'Normal', dueDate:TODAY } })}
                      className={UI.btnOutline}>
                      <Plus className="w-3.5 h-3.5" /> New Task
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {ec.tasks?.length > 0 ? ec.tasks.map(task => {
                      const done    = task.status==='Completed';
                      const overdue = !done && task.dueDate < TODAY;
                      return (
                        <div key={task.id} className={`flex items-start gap-3 p-3 border rounded-xl transition-colors ${done?'border-gray-800/50 bg-gray-900/20 opacity-60':'border-gray-800 bg-gray-900/50 hover:border-cyan-500/30'}`}>
                          <button onClick={() => handleToggleTask(task.id)}
                            className={`mt-0.5 shrink-0 transition-colors ${done?'text-emerald-400':'text-gray-600 hover:text-cyan-500'}`}>
                            {done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${done?'line-through text-gray-600':'text-gray-100'}`}>{task.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] uppercase font-bold tracking-wider">
                              <span className={`flex items-center gap-1 ${overdue?'text-rose-400':'text-gray-600'}`}>
                                <Clock className="w-3 h-3" /> {task.dueDate}{overdue&&' (Overdue)'}
                              </span>
                              <span className="text-gray-600 flex items-center gap-1">{getActivityIcon(task.type)} {task.type}</span>
                              {task.priority==='High'     && !done && <span className="text-cyan-500">High</span>}
                              {task.priority==='Critical' && !done && <span className="text-rose-400">Critical</span>}
                            </div>
                          </div>
                        </div>
                      );
                    }) : <div className="text-center py-6 text-gray-600 text-xs">No pending tasks for this account.</div>}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className={UI.cardPad}>
                  <h3 className={UI.sectionTitle}><FileText className="w-4 h-4 text-cyan-500" /> Activity Log</h3>
                  <div className="space-y-5">
                    {ec.recentActivity.map((act, idx) => (
                      <div key={act.id} className="relative pl-7">
                        {idx !== ec.recentActivity.length-1 && (
                          <div className="absolute top-5 left-[11px] bottom-[-22px] w-px bg-gray-800" />
                        )}
                        <div className="absolute top-1 left-0 w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                          {getActivityIcon(act.type)}
                        </div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{act.type}</span>
                          <span className="text-xs text-gray-600">{act.date}</span>
                        </div>
                        <p className="text-sm text-gray-400">{act.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contract Pricing */}
              <div className={`${UI.card} col-span-2`}>
                <div className="p-5 border-b border-gray-800">
                  <h3 className={UI.sectionTitle}><DollarSign className="w-4 h-4 text-cyan-500" /> Contract Pricing Manager</h3>
                  <p className="text-xs text-gray-500 -mt-3">Module 3 requires these overrides for accurate B2B portal cart totals.</p>
                </div>
                <div className="p-5 bg-gray-900/80 border-b border-gray-800">
                  <form onSubmit={handleAddContractPrice} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className={UI.label}>Select SKU to Override</label>
                      <select name="skuId" required className={UI.select}>
                        <option value="">— Select SKU from Master Inventory —</option>
                        {MOCK_INVENTORY.filter(inv => !ec.contractPricing[inv.id]).map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.sku} – {inv.name} (Base: {fmt$(inv.basePrice)})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className={UI.label}>Custom Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input name="price" type="number" step="0.01" required min="0" placeholder="0.00"
                          className={`${UI.input} pl-7`} />
                      </div>
                    </div>
                    <button type="submit" className={UI.btnSecondary}>
                      <Plus className="w-4 h-4" /> Add Rule
                    </button>
                  </form>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-900/50">
                      <tr>
                        {['Item','Base Price','Contract Price','Discount',''].map((h,i)=>(
                          <th key={i} className={`${UI.th} ${i>=1?'text-right':''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {Object.keys(ec.contractPricing).length===0 ? (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-600 text-sm">No contract pricing established. Customer pays standard list price.</td></tr>
                      ) : Object.entries(ec.contractPricing).map(([skuIdStr, contractPrice]) => {
                        const item = MOCK_INVENTORY.find(i => i.id === parseInt(skuIdStr,10));
                        if (!item) return null;
                        const discountPct = ((item.basePrice - contractPrice) / item.basePrice) * 100;
                        return (
                          <tr key={skuIdStr} className="hover:bg-gray-800/30 transition-colors">
                            <td className={UI.td}><div className="font-medium text-gray-100">{item.name}</div><div className="text-gray-500 text-xs">{item.sku}</div></td>
                            <td className={`${UI.td} text-right text-gray-600 line-through`}>{fmt$(item.basePrice)}</td>
                            <td className={`${UI.td} text-right font-bold text-emerald-400`}>{fmt$(contractPrice)}</td>
                            <td className={`${UI.td} text-right`}>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {discountPct.toFixed(1)}% Off
                              </span>
                            </td>
                            <td className={`${UI.td} text-right`}>
                              <button onClick={() => handleRemoveContractPrice(skuIdStr)} className="text-gray-600 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top SKUs + Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={UI.cardPad}>
                  <h3 className={UI.sectionTitle}><Package className="w-4 h-4 text-cyan-500" /> Top Purchased Items (YTD)</h3>
                  <div className="space-y-3">
                    {ec.analytics.topSkus.map((sku, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-gray-800 rounded-xl bg-gray-900/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold text-xs">
                            #{idx+1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-100">{sku.name}</div>
                            <div className="text-xs text-gray-500">{sku.sku}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-100">{sku.qtyYtd}</div>
                          <div className="text-xs text-gray-600">units YTD</div>
                        </div>
                      </div>
                    ))}
                    {ec.analytics.topSkus.length===0 && <div className="text-gray-600 text-sm text-center py-4">No order history available.</div>}
                  </div>
                </div>

                {/* Document Vault — powered by AttachmentsPanel */}
                <AttachmentsPanel
                  recordId={ec.id}
                  recordLabel={ec.name}
                  isDark={true}
                  uploaderName={activeUser?.name || 'You'}
                />

                {/* Account Change History */}
                <RecordHistory
                  entityIds={ec.id}
                  label={ec.name}
                  isDark={true}
                  mode="full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Task Modal ── FIX #2: fixed inset-0 ── */}
        {taskModal.isOpen && (
          <ModalOverlay>
            <ModalBox maxW="max-w-md">
              <ModalHeader title="Schedule New Task" icon={Calendar} onClose={() => setTaskModal({ isOpen:false, task:null })} />
              <form onSubmit={handleSaveTask} className="p-6 space-y-4">
                <div>
                  <label className={UI.label}>Task Description *</label>
                  <input type="text" required autoFocus placeholder="E.g., Call Chef regarding Q3 produce orders" className={UI.input}
                    value={taskModal.task.title}
                    onChange={e => { const v = e.target.value; setTaskModal(prev => ({...prev, task:{...prev.task, title:v}})); }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={UI.label}>Task Type</label>
                    <select className={UI.select} value={taskModal.task.type}
                      onChange={e => { const v = e.target.value; setTaskModal(prev => ({...prev, task:{...prev.task, type:v}})); }}>
                      <option value="Call">Phone Call</option><option value="Email">Email</option>
                      <option value="Meeting">Meeting</option><option value="Task">To-Do Item</option>
                    </select>
                  </div>
                  <div>
                    <label className={UI.label}>Priority</label>
                    <select className={UI.select} value={taskModal.task.priority}
                      onChange={e => { const v = e.target.value; setTaskModal(prev => ({...prev, task:{...prev.task, priority:v}})); }}>
                      <option value="Low">Low</option><option value="Normal">Normal</option>
                      <option value="High">High</option><option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={UI.label}>Due Date *</label>
                  <input type="date" required className={UI.input} value={taskModal.task.dueDate}
                    onChange={e => { const v = e.target.value; setTaskModal(prev => ({...prev, task:{...prev.task, dueDate:v}})); }} />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                  <button type="button" onClick={() => setTaskModal({isOpen:false,task:null})} className={UI.btnGhost}>Cancel</button>
                  <button type="submit" className={UI.btnPrimary}>Save to Calendar</button>
                </div>
              </form>
            </ModalBox>
          </ModalOverlay>
        )}

        {/* ── Ticket Modal ── FIX #3: fixed inset-0 ── */}
        {ticketModal.isOpen && (
          <ModalOverlay>
            <ModalBox>
              <ModalHeader title="Open Support Ticket / RMA" icon={Ticket} onClose={() => setTicketModal({isOpen:false,ticket:null})} />
              <form onSubmit={handleSaveTicket} className="p-6 space-y-4">
                <div>
                  <label className={UI.label}>Subject *</label>
                  <input type="text" required placeholder="Brief description of the issue" className={UI.input}
                    value={ticketModal.ticket.subject}
                    onChange={e => { const v = e.target.value; setTicketModal(prev => ({...prev, ticket:{...prev.ticket, subject:v}})); }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={UI.label}>Ticket Type</label>
                    <select className={UI.select} value={ticketModal.ticket.type}
                      onChange={e => { const v = e.target.value; setTicketModal(prev => ({...prev, ticket:{...prev.ticket, type:v}})); }}>
                      <option value="OS&D (Returns)">OS&D (Over, Short, Damaged)</option>
                      <option value="Billing">Billing Dispute</option>
                      <option value="Portal Help">Web Portal Support</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className={UI.label}>Priority</label>
                    <select className={UI.select} value={ticketModal.ticket.priority}
                      onChange={e => { const v = e.target.value; setTicketModal(prev => ({...prev, ticket:{...prev.ticket, priority:v}})); }}>
                      <option value="Low">Low</option><option value="Normal">Normal</option>
                      <option value="High">High</option><option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={UI.label}>Detailed Description *</label>
                  <textarea required rows={4} placeholder="Provide details, related order numbers, and steps taken…" className={`${UI.input} resize-none`}
                    value={ticketModal.ticket.description}
                    onChange={e => { const v = e.target.value; setTicketModal(prev => ({...prev, ticket:{...prev.ticket, description:v}})); }} />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                  <button type="button" onClick={() => setTicketModal({isOpen:false,ticket:null})} className={UI.btnGhost}>Cancel</button>
                  <button type="submit" className={UI.btnPrimary}>Submit Ticket</button>
                </div>
              </form>
            </ModalBox>
          </ModalOverlay>
        )}

        {/* ── Contact Modal ── FIX #4: fixed inset-0 ── */}
        {contactModal.isOpen && (
          <ModalOverlay>
            <ModalBox maxW="max-w-md">
              <ModalHeader title={contactModal.mode==='edit'?'Edit Stakeholder':'Add Stakeholder'} icon={Contact2} onClose={() => setContactModal({isOpen:false,mode:'add',contact:null})} />
              <form onSubmit={handleSaveContact} className="p-6 space-y-4">
                <div>
                  <label className={UI.label}>Full Name *</label>
                  <input type="text" required className={UI.input} value={contactModal.contact.name}
                    onChange={e => { const v = e.target.value; setContactModal(prev => ({...prev, contact:{...prev.contact, name:v}})); }} />
                </div>
                <div>
                  <label className={UI.label}>Job Title</label>
                  <input type="text" className={UI.input} value={contactModal.contact.title}
                    onChange={e => { const v = e.target.value; setContactModal(prev => ({...prev, contact:{...prev.contact, title:v}})); }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={UI.label}>Email *</label>
                    <input type="email" required className={UI.input} value={contactModal.contact.email}
                      onChange={e => { const v = e.target.value; setContactModal(prev => ({...prev, contact:{...prev.contact, email:v}})); }} />
                  </div>
                  <div>
                    <label className={UI.label}>Phone</label>
                    <input type="tel" className={UI.input} value={contactModal.contact.phone}
                      onChange={e => { const v = e.target.value; setContactModal(prev => ({...prev, contact:{...prev.contact, phone:v}})); }} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={contactModal.contact.isPrimary} className="rounded border-gray-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                    onChange={e => { const v = e.target.checked; setContactModal(prev => ({...prev, contact:{...prev.contact, isPrimary:v}})); }} />
                  <span className="text-sm text-gray-300 font-medium">Set as Primary Contact</span>
                </label>
                <div className="pt-4 flex justify-between items-center border-t border-gray-800">
                  {contactModal.mode==='edit'
                    ? <button type="button" onClick={() => handleDeleteContact(contactModal.contact.id)} className={UI.btnDanger}><Trash2 className="w-4 h-4" /> Remove</button>
                    : <div />}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setContactModal({isOpen:false,mode:'add',contact:null})} className={UI.btnGhost}>Cancel</button>
                    <button type="submit" className={UI.btnPrimary}>{contactModal.mode==='edit'?'Save Changes':'Add Stakeholder'}</button>
                  </div>
                </div>
              </form>
            </ModalBox>
          </ModalOverlay>
        )}

        {/* ── Playbook Modal ── FIX #5: fixed inset-0 ── */}
        {playbookModal.isOpen && (
          <ModalOverlay>
            <ModalBox>
              <ModalHeader title="Enroll in Workflow" icon={Workflow} onClose={() => setPlaybookModal({isOpen:false})} />
              <form onSubmit={handleEnrollPlaybook} className="p-6 space-y-4">
                <div>
                  <label className={UI.label}>Select Playbook to Assign</label>
                  <select name="playbookId" required className={UI.select}>
                    <option value="">— Select a Workflow —</option>
                    {MOCK_PLAYBOOKS.filter(pb => !(ec.activePlaybooks||[]).find(a => a.id===pb.id)).map(pb => (
                      <option key={pb.id} value={pb.id}>{pb.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 p-3 rounded-xl text-xs">
                  <Zap className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                  <p>Enrolling an account in a playbook allows the system to monitor data thresholds and execute automated actions on your behalf.</p>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-800">
                  <button type="button" onClick={() => setPlaybookModal({isOpen:false})} className={UI.btnGhost}>Cancel</button>
                  <button type="submit" className={UI.btnPrimary}>Enroll Account</button>
                </div>
              </form>
            </ModalBox>
          </ModalOverlay>
        )}
      </div>
    );
  };

  // FIX #3: Removed constraining outer wrapper (max-w-7xl / max-h-[900px] / bg-slate-200).
  // Module now fills the full tab area in the ERM preview, matching all other modules.
  return (
    <div className={UI.page}>
      {view === 'rebates' ? renderRebates() : view === 'analytics' ? renderAnalytics() : view === 'dashboard' ? renderDashboard() : renderDetail()}
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest border backdrop-blur-md transition-all duration-300 ${
          toast.type === 'warning' ? 'bg-cyan-600/10 text-cyan-500 border-cyan-600/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          <CheckCircle2 size={18} /> {toast.message}
        </div>
      )}

      {/* ── Approval workflow modals ───────────────────────────────────── */}
      {creditReleaseModal.open && (
        <Overlay>
          <ModalBox>
            <ModalHeader title="Request Credit Hold Release" icon={Unlock} onClose={() => { setCreditReleaseModal({ open:false, customer:null }); setCrReason(''); }} />
            <div className="p-6 space-y-4">
              <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                <p className="font-bold text-gray-100">{creditReleaseModal.customer?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Account is currently on hold — lifting it allows B2B ordering to resume.</p>
              </div>
              <div>
                <label className={UI.label}>Reason for Release *</label>
                <textarea
                  rows={3}
                  className={UI.input}
                  placeholder="e.g. Customer paid $10,000 toward 60+ days past due — Check #7421"
                  value={crReason}
                  onChange={e => setCrReason(e.target.value)}
                />
              </div>
              <div className="text-xs text-gray-500 italic">
                This request will go to the Approvals inbox for sign-off by an accountant, manager, or admin.
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
                <button onClick={() => { setCreditReleaseModal({ open:false, customer:null }); setCrReason(''); }} className={UI.btnSecondary}>Cancel</button>
                <button
                  onClick={() => submitCreditReleaseRequest(crReason)}
                  disabled={!crReason.trim()}
                  className={`${UI.btnPrimary} ${!crReason.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Send className="w-4 h-4" /> Submit for Approval
                </button>
              </div>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {discountModal.open && (
        <Overlay>
          <ModalBox>
            <ModalHeader title="Request Discount Override" icon={DollarSign} onClose={() => setDiscountModal({ open:false, customer:null })} />
            <div className="p-6 space-y-4">
              <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                <p className="font-bold text-gray-100">{discountModal.customer?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={UI.label}>Discount % *</label>
                  <input type="number" min="0" max="100" step="0.5" className={UI.input}
                    value={discountForm.discountPct}
                    onChange={e => setDiscountForm(f => ({ ...f, discountPct: e.target.value }))} />
                </div>
                <div>
                  <label className={UI.label}>Expires</label>
                  <input type="date" className={UI.input}
                    value={discountForm.expiresOn}
                    onChange={e => setDiscountForm(f => ({ ...f, expiresOn: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={UI.label}>Scope</label>
                <input className={UI.input} placeholder="e.g. All dairy SKUs, or specific SKU"
                  value={discountForm.skuScope}
                  onChange={e => setDiscountForm(f => ({ ...f, skuScope: e.target.value }))} />
              </div>
              <div>
                <label className={UI.label}>Business Justification *</label>
                <textarea rows={2} className={UI.input} placeholder="Why this discount? Competitive bid? Volume commitment?"
                  value={discountForm.reason}
                  onChange={e => setDiscountForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
              {Number(discountForm.discountPct) > (settings.approvalRules?.discount_override?.threshold || 0) && (
                <div className="text-xs text-amber-400 italic flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Above {settings.approvalRules?.discount_override?.threshold}% threshold — will be routed for manager approval.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
                <button onClick={() => setDiscountModal({ open:false, customer:null })} className={UI.btnSecondary}>Cancel</button>
                <button
                  onClick={submitDiscountRequest}
                  disabled={!discountForm.discountPct || !discountForm.reason.trim()}
                  className={`${UI.btnPrimary} ${(!discountForm.discountPct || !discountForm.reason.trim()) ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Send className="w-4 h-4" /> Submit for Approval
                </button>
              </div>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {pendingAccountChange && (
        <Overlay>
          <ModalBox>
            <ModalHeader title="Account Change — Approval Required" icon={FileText} onClose={() => setPendingAccountChange(null)} />
            <div className="p-6 space-y-4">
              <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                <p className="font-bold text-gray-100">{pendingAccountChange.customer.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">The following changes need manager sign-off before they take effect:</p>
              </div>
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
                    {pendingAccountChange.changes.map((c, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-300 font-semibold">{c.field}</td>
                        <td className="px-3 py-2 text-gray-500"><s>{c.from}</s></td>
                        <td className="px-3 py-2 font-bold text-cyan-400">{c.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <label className={UI.label}>Reason</label>
                <textarea
                  rows={2}
                  className={UI.input}
                  placeholder="Why is this change needed?"
                  value={crReason}
                  onChange={e => setCrReason(e.target.value)}
                />
              </div>
              <div className="text-xs text-gray-500 italic">
                Your edits will be reverted locally until the change is approved in the Approvals inbox.
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
                <button onClick={() => setPendingAccountChange(null)} className={UI.btnSecondary}>Cancel</button>
                <button onClick={() => { submitAccountChangeRequest(crReason); setCrReason(''); }} className={UI.btnPrimary}>
                  <Send className="w-4 h-4" /> Submit for Approval
                </button>
              </div>
            </div>
          </ModalBox>
        </Overlay>
      )}
    </div>
  );
}

// KERNAL_CRM_MODULE_MARKER_XYZ789
