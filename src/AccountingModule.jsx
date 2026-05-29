import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useKernal, LOCATIONS } from './KernalContext.jsx';
import { UI } from './ui.js';

import { Modal, ModalOverlay, Overlay, ModalBox, ModalHeader, DocModalHeader } from './shared/Modal.jsx';

import { TODAY, StatusBadge, PrintButton, ExportButton } from './shared/components.jsx';
import { DEMO_MODE } from './lib/demoMode.js';
import { api } from './lib/api.js';

import {
  LayoutDashboard, Building2, Users, CheckSquare, Landmark, BarChart3,
  Plus, Edit2, Trash2, X, Search, Printer, Check, DollarSign,
  ArrowUpRight, ArrowDownLeft, FileText, AlertCircle, CheckCircle2,
  Clock, TrendingUp, TrendingDown, Calendar, Ban, ChevronRight,
  Save, RefreshCcw, Download, Package, CreditCard, Receipt, Zap,
  ChevronDown, Eye, Send, Filter, ShoppingCart,
  Layers, AlertTriangle, XCircle, CheckCheck, ScanLine,
  ChevronUp, Star, Percent, Settings2, Activity, MapPin,
  Lock, Unlock, UserCheck, ClipboardCheck, BadgeDollarSign,
  Wallet, Banknote, Link as LinkIcon, CircleDollarSign, RefreshCw,
} from 'lucide-react';

import {
  REP_RATES, CATEGORY_RATES, MONTHLY_HISTORY, YTD_COMMISSION,
  calcOrderCommission, QUALIFYING_STATUSES, DEFAULT_COMMISSION_RATE,
} from './shared/commissionData.js';

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


// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const GL_ACCOUNTS = [
  { code: '1000', name: 'Cash – Operating',       type: 'Asset'     },
  { code: '1001', name: 'Cash – Payroll',          type: 'Asset'     },
  { code: '1100', name: 'Accounts Receivable',     type: 'Asset'     },
  { code: '1200', name: 'Inventory',               type: 'Asset'     },
  { code: '2000', name: 'Accounts Payable',        type: 'Liability' },
  { code: '4000', name: 'Sales Revenue',           type: 'Revenue'   },
  { code: '5000', name: 'Cost of Goods Sold',      type: 'COGS'      },
  { code: '6100', name: 'Fuel & Delivery',         type: 'Expense'   },
  { code: '6200', name: 'Vehicle Maintenance',     type: 'Expense'   },
  { code: '6300', name: 'Warehouse Supplies',      type: 'Expense'   },
  { code: '6400', name: 'Office Supplies',         type: 'Expense'   },
  { code: '6500', name: 'Utilities',               type: 'Expense'   },
  { code: '6600', name: 'Insurance',               type: 'Expense'   },
  { code: '6700', name: 'Payroll',                 type: 'Expense'   },
  { code: '6900', name: 'Miscellaneous',           type: 'Expense'   },
];

const INIT_VENDORS = [
  { id: 'V001', name: 'US Foods Distribution',  contact: 'Mike Reyes',    phone: '312-555-0102', email: 'mreyes@usfoods.com',  address: '100 Industrial Blvd, Chicago IL 60601',        terms: 'Net 30', balance: 12450.00 },
  { id: 'V002', name: 'Sysco Corporation',       contact: 'Sarah Kim',     phone: '713-555-0203', email: 'skim@sysco.com',       address: '200 Sysco Ave, Houston TX 77077',               terms: 'Net 30', balance: 8920.50  },
  { id: 'V003', name: 'Gordon Food Service',     contact: 'Tom Walsh',     phone: '616-555-0304', email: 'twalsh@gfs.com',       address: '333 Fulton Ave, Grand Rapids MI 49508',         terms: 'Net 15', balance: 3200.00  },
  { id: 'V004', name: 'FleetPride Parts',        contact: 'Ana Rivera',    phone: '214-555-0405', email: 'arivera@fleetpride.com','address': '500 Fleet St, Dallas TX 75201',              terms: 'Net 15', balance: 1450.00  },
  { id: 'V005', name: 'City Utilities',          contact: 'Billing Dept',  phone: '312-555-0506', email: 'billing@cityutils.com', address: '1 Utility Plaza, Chicago IL 60602',           terms: 'Due on Receipt', balance: 620.00  },
];

const INIT_BANK_ACCOUNTS = [
  { id: 'BA001', name: 'First National – Operating', number: '****4521', balance: 84320.15,  bank: 'First National Bank', routing: '071000013', type: 'Checking'    },
  { id: 'BA002', name: 'Regions – Business Savings', number: '****6644', balance: 38750.00,  bank: 'Regions Bank',        routing: '062000019', type: 'Savings'     },
  { id: 'BA003', name: 'Chase – Credit Line',        number: '****9901', balance: -14200.00, bank: 'JPMorgan Chase',      routing: '021000021', type: 'Credit Line', creditLimit: 75000.00 },
];

const INIT_CHECKS = [
  { id: 'CHK-1042', num: 1042, date: '2026-05-10', payee: 'US Foods Distribution', amount: 4500.00, memo: 'PO-088 – Beef & Chicken Products',   accountId: 'BA001', status: 'Cleared',      glCode: '5000' },
  { id: 'CHK-1043', num: 1043, date: '2026-05-12', payee: 'Sysco Corporation',      amount: 2100.00, memo: 'PO-089 – Dairy & Produce',           accountId: 'BA001', status: 'Outstanding', glCode: '5000' },
  { id: 'CHK-1044', num: 1044, date: '2026-05-15', payee: 'FleetPride Parts',       amount: 850.00,  memo: 'Vehicle brake repair – Truck 3',      accountId: 'BA001', status: 'Cleared',      glCode: '6200' },
  { id: 'CHK-1045', num: 1045, date: '2026-05-18', payee: 'City Utilities',         amount: 620.00,  memo: 'May electricity – Warehouse',         accountId: 'BA001', status: 'Outstanding', glCode: '6500' },
  { id: 'CHK-1046', num: 1046, date: '2026-05-20', payee: 'Gordon Food Service',    amount: 1800.00, memo: 'PO-091 – Frozen & Dry Items',          accountId: 'BA001', status: 'Outstanding', glCode: '5000' },
];

// ─── Billing customers — used by Invoice Builder customer picker ──────────────
const BILLING_CUSTOMERS = [
  { id: 'CUST-101', name: 'Metro Restaurant Group',  contact: 'Patricia Lopez',  email: 'ap@metrorestaurants.com',    phone: '(504) 555-2010', address: '2200 Magazine St',     city: 'New Orleans, LA 70130', terms: 'Net 30', taxRate: 9.45 },
  { id: 'CUST-102', name: 'Downtown Catering Co.',   contact: 'Marcus Hill',     email: 'billing@downtowncatering.com', phone: '(504) 555-2120', address: '450 Poydras St #14',   city: 'New Orleans, LA 70112', terms: 'Net 30', taxRate: 9.45 },
  { id: 'CUST-103', name: 'Harbor View Hotel',        contact: 'Yvette Tran',     email: 'finance@harborviewhotel.com',  phone: '(504) 555-2305', address: '88 Riverwalk Way',    city: 'New Orleans, LA 70130', terms: 'Net 15', taxRate: 9.45 },
  { id: 'CUST-104', name: 'Sunset Bistro Chain',      contact: 'Diego Alvarez',   email: 'ap@sunsetbistro.com',          phone: '(504) 555-2440', address: '901 Carrollton Ave',  city: 'New Orleans, LA 70118', terms: 'Net 30', taxRate: 9.45 },
  { id: 'CUST-105', name: 'City School District',     contact: 'Karen O’Neil',  email: 'foodservices@nolacsd.gov',     phone: '(504) 555-2580', address: '3520 General Taylor St', city: 'New Orleans, LA 70125', terms: 'Net 45', taxRate: 0.00 },
  { id: 'CUST-106', name: 'Bayou Grill & Pub',        contact: 'Steven Marek',    email: 'steven@bayougrill.com',        phone: '(504) 555-2611', address: '714 Decatur St',       city: 'New Orleans, LA 70130', terms: 'Net 15', taxRate: 9.45 },
  { id: 'CUST-107', name: 'Crescent City Catering',   contact: 'Renee Boudreaux', email: 'ar@crescentcatering.com',      phone: '(504) 555-2790', address: '5500 Tchoupitoulas St', city: 'New Orleans, LA 70115', terms: 'Net 30', taxRate: 9.45 },
];

// ─── Invoice catalog — quick-add line items ──────────────────────────────────
// Catch-weight items use `isCatchWeight: true`, `pricePerLb`, and `avgWeightPerCase`.
// The Invoice Builder swaps these into per-lb pricing when added to a line.
const INVOICE_CATALOG = [
  { sku: 'FRZ-BEEF-01',  description: 'Ground Beef 80/20 10lb Case',          uom: 'case', unitPrice: 168.00, isCatchWeight: true, pricePerLb: 8.55, avgWeightPerCase: 10.0 },
  { sku: 'PLT-CHICK-05', description: 'Jumbo Chicken Breasts (case)',         uom: 'case', unitPrice:  72.00, isCatchWeight: true, pricePerLb: 6.00, avgWeightPerCase:  7.0 },
  { sku: 'PROT-002',     description: 'Chicken Breast Boneless 40lb',         uom: 'case', unitPrice: 132.00 },
  { sku: 'PROT-003',     description: 'Atlantic Salmon Fillet 5lb',           uom: 'case', unitPrice:  92.00 },
  { sku: 'PROT-010',     description: 'Shrimp Jumbo 16/20 ct 5lb Block',      uom: 'case', unitPrice: 108.00 },
  { sku: 'DAI-MILK-02',  description: 'Whole Milk 1 Gal 4pk',                 uom: 'case', unitPrice:  26.50 },
  { sku: 'DAI-CHE-02',   description: 'American Cheese 5lb',                  uom: 'case', unitPrice:  48.00 },
  { sku: 'DAI-BUT-01',   description: 'Butter Unsalted 1lb 36ct',             uom: 'case', unitPrice:  72.00 },
  { sku: 'PRO-TOMA-01',  description: 'Roma Tomatoes 25lb Case',              uom: 'case', unitPrice:  32.00 },
  { sku: 'PRO-LET-01',   description: 'Iceberg Lettuce 24ct',                 uom: 'case', unitPrice:  41.00 },
  { sku: 'BAK-BUN-01',   description: 'Brioche Burger Buns 12pk',             uom: 'case', unitPrice:  38.00 },
  { sku: 'DRY-RICE-05',  description: 'Jasmine Rice 50lb Bag',                uom: 'bag',  unitPrice:  52.00 },
  { sku: 'DRY-OIL-5G',   description: 'Vegetable Oil 5 Gal',                  uom: 'pail', unitPrice:  46.00 },
  { sku: 'SVC-DELIVERY', description: 'Delivery Service Fee',                 uom: 'ea',   unitPrice:  35.00 },
  { sku: 'SVC-FUEL',     description: 'Fuel Surcharge',                       uom: 'ea',   unitPrice:  18.00 },
];

// ─── Payment Methods — stored ACH / card-on-file per customer ────────────────
const INIT_PAYMENT_METHODS = [
  { id: 'PM-001', customerId: 'CUST-101', customerName: 'Metro Restaurant Group',  type: 'ach',  label: 'Checking ****4521', bank: 'First National Bank',  routing: '****1122', last4: '4521', verified: true,  isDefault: true,  addedAt: '2026-03-15' },
  { id: 'PM-002', customerId: 'CUST-101', customerName: 'Metro Restaurant Group',  type: 'card', label: 'Visa ****8834',      brand: 'Visa',               last4: '8834', expiry: '09/28', verified: true,  isDefault: false, addedAt: '2026-04-02' },
  { id: 'PM-003', customerId: 'CUST-102', customerName: 'Downtown Catering Co.',   type: 'ach',  label: 'Checking ****7788', bank: 'Regions Bank',         routing: '****4433', last4: '7788', verified: true,  isDefault: true,  addedAt: '2026-02-20' },
  { id: 'PM-004', customerId: 'CUST-103', customerName: 'Harbor View Hotel',       type: 'card', label: 'Mastercard ****2211', brand: 'Mastercard',         last4: '2211', expiry: '12/27', verified: true,  isDefault: true,  addedAt: '2026-04-18' },
  { id: 'PM-005', customerId: 'CUST-105', customerName: 'City School District',    type: 'ach',  label: 'Checking ****9934', bank: 'Chase Business',        routing: '****5566', last4: '9934', verified: true,  isDefault: true,  addedAt: '2026-01-10' },
  { id: 'PM-006', customerId: 'CUST-105', customerName: 'City School District',    type: 'card', label: 'Amex ****5566',      brand: 'Amex',               last4: '5566', expiry: '07/29', verified: false, isDefault: false, addedAt: '2026-05-01' },
  { id: 'PM-007', customerId: 'CUST-106', customerName: 'Bayou Grill & Pub',       type: 'ach',  label: 'Checking ****3310', bank: 'Whitney Bank',          routing: '****9988', last4: '3310', verified: true,  isDefault: true,  addedAt: '2026-03-28' },
];

// ─── Payment transactions — portal-initiated and manual payments ─────────────
const INIT_PAYMENT_TRANSACTIONS = [
  { id: 'PAY-001', customerId: 'CUST-101', customerName: 'Metro Restaurant Group', methodId: 'PM-001', methodLabel: 'ACH ****4521',       methodType: 'ach',  amount: 2750.00, status: 'Settled',    appliedTo: 'INV-501', settledAt: '2026-05-05', initiatedAt: '2026-05-03', processorRef: 'ACH-20260503-4521',  note: 'Monthly balance payment',     failReason: null },
  { id: 'PAY-002', customerId: 'CUST-102', customerName: 'Downtown Catering Co.',  methodId: 'PM-003', methodLabel: 'ACH ****7788',       methodType: 'ach',  amount: 1850.00, status: 'Settled',    appliedTo: 'INV-502', settledAt: '2026-05-08', initiatedAt: '2026-05-06', processorRef: 'ACH-20260506-7788',  note: '',                            failReason: null },
  { id: 'PAY-003', customerId: 'CUST-101', customerName: 'Metro Restaurant Group', methodId: 'PM-002', methodLabel: 'Visa ****8834',      methodType: 'card', amount: 3400.00, status: 'Processing', appliedTo: null,      settledAt: null,         initiatedAt: '2026-05-25', processorRef: 'CARD-20260525-8834', note: 'INV-503 payment pending',     failReason: null },
  { id: 'PAY-004', customerId: 'CUST-103', customerName: 'Harbor View Hotel',      methodId: 'PM-004', methodLabel: 'Mastercard ****2211', methodType: 'card', amount: 880.00,  status: 'Failed',     appliedTo: null,      settledAt: null,         initiatedAt: '2026-05-20', processorRef: 'CARD-20260520-2211', note: '',                            failReason: 'Insufficient funds — card declined' },
  { id: 'PAY-005', customerId: 'CUST-105', customerName: 'City School District',   methodId: 'PM-005', methodLabel: 'ACH ****9934',       methodType: 'ach',  amount: 4200.00, status: 'Settled',    appliedTo: 'INV-505', settledAt: '2026-05-12', initiatedAt: '2026-05-10', processorRef: 'ACH-20260510-9934',  note: 'PO #78412 full payment',      failReason: null },
  { id: 'PAY-006', customerId: 'CUST-106', customerName: 'Bayou Grill & Pub',      methodId: 'PM-007', methodLabel: 'ACH ****3310',       methodType: 'ach',  amount: 1910.05, status: 'Settled',    appliedTo: 'INV-506', settledAt: '2026-05-15', initiatedAt: '2026-05-13', processorRef: 'ACH-20260513-3310',  note: '',                            failReason: null },
  { id: 'PAY-007', customerId: 'CUST-102', customerName: 'Downtown Catering Co.',  methodId: 'PM-003', methodLabel: 'ACH ****7788',       methodType: 'ach',  amount: 650.00,  status: 'Pending',    appliedTo: null,      settledAt: null,         initiatedAt: '2026-05-26', processorRef: null,                 note: 'Queued for next ACH batch',   failReason: null },
];

// ─── Open invoices shown in the Pay Portal (customer-facing view) ────────────
const PORTAL_OPEN_INVOICES = [
  { id: 'INV-503', customerId: 'CUST-101', customerName: 'Metro Restaurant Group', amount: 3400.00, dueDate: '2026-06-02', daysUntilDue: 6 },
  { id: 'INV-508', customerId: 'CUST-101', customerName: 'Metro Restaurant Group', amount: 1250.00, dueDate: '2026-06-15', daysUntilDue: 19 },
  { id: 'INV-509', customerId: 'CUST-102', customerName: 'Downtown Catering Co.',  amount: 650.00,  dueDate: '2026-06-05', daysUntilDue: 9 },
  { id: 'INV-510', customerId: 'CUST-103', customerName: 'Harbor View Hotel',      amount: 880.00,  dueDate: '2026-05-30', daysUntilDue: -1 },
  { id: 'INV-511', customerId: 'CUST-103', customerName: 'Harbor View Hotel',      amount: 1120.00, dueDate: '2026-06-10', daysUntilDue: 14 },
  { id: 'INV-512', customerId: 'CUST-105', customerName: 'City School District',   amount: 6800.00, dueDate: '2026-06-20', daysUntilDue: 24 },
  { id: 'INV-513', customerId: 'CUST-106', customerName: 'Bayou Grill & Pub',      amount: 945.50,  dueDate: '2026-05-31', daysUntilDue: 0 },
];

// Helper: build a printable line items list from a customer + cart
const buildInvoiceLineItems = (rows) =>
  rows.filter(r => r.description && Number(r.qty) > 0).map(r => ({
    sku: r.sku || '',
    description: r.description,
    uom: r.uom || 'ea',
    qty: Number(r.qty),
    unitPrice: Number(r.unitPrice) || 0,
    total: Number(r.qty) * (Number(r.unitPrice) || 0),
  }));

const INIT_INVOICES = [
  {
    id: 'INV-501', date: '2026-05-01', dueDate: '2026-05-31',
    customerId: 'CUST-101', customer: 'Metro Restaurant Group',
    billTo: { address: '2200 Magazine St', city: 'New Orleans, LA 70130', contact: 'Patricia Lopez', email: 'ap@metrorestaurants.com' },
    terms: 'Net 30', source: 'B2B', glCode: '4000', notes: 'Weekly protein order — Route A',
    items: [
      { sku: 'FRZ-BEEF-01', description: 'Ground Beef 80/20 10lb Chub', uom: 'case', qty: 24, unitPrice: 168.00, total: 4032.00 },
      { sku: 'PROT-002',    description: 'Chicken Breast Boneless 40lb', uom: 'case', qty: 18, unitPrice: 132.00, total: 2376.00 },
      { sku: 'DAI-CHE-02',  description: 'American Cheese 5lb',          uom: 'case', qty: 20, unitPrice:  48.00, total:  960.00 },
      { sku: 'BAK-BUN-01',  description: 'Brioche Burger Buns 12pk',     uom: 'case', qty: 22, unitPrice:  38.00, total:  836.00 },
    ],
    subtotal: 8204.00, taxRate: 9.45, tax: 246.00, freight: 0.00, amount: 8450.00,
    paid: 0, status: 'Overdue',
  },
  {
    id: 'INV-502', date: '2026-05-05', dueDate: '2026-06-04',
    customerId: 'CUST-102', customer: 'Downtown Catering Co.',
    billTo: { address: '450 Poydras St #14', city: 'New Orleans, LA 70112', contact: 'Marcus Hill', email: 'billing@downtowncatering.com' },
    terms: 'Net 30', source: 'Manual', glCode: '4000', notes: 'Spring event — corporate luncheon',
    items: [
      { sku: 'PROT-010',    description: 'Shrimp Jumbo 16/20 ct 5lb Block', uom: 'case', qty: 12, unitPrice: 108.00, total: 1296.00 },
      { sku: 'PROT-003',    description: 'Atlantic Salmon Fillet 5lb',       uom: 'case', qty: 10, unitPrice:  92.00, total:  920.00 },
      { sku: 'PRO-LET-01',  description: 'Iceberg Lettuce 24ct',             uom: 'case', qty: 14, unitPrice:  41.00, total:  574.00 },
      { sku: 'SVC-DELIVERY',description: 'Delivery Service Fee',             uom: 'ea',   qty:  1, unitPrice:  35.00, total:   35.00 },
    ],
    subtotal: 2825.00, taxRate: 9.45, tax: 267.00, freight: 108.00, amount: 3200.00,
    paid: 0, status: 'Open',
  },
  {
    id: 'INV-503', date: '2026-04-20', dueDate: '2026-05-20',
    customerId: 'CUST-103', customer: 'Harbor View Hotel',
    billTo: { address: '88 Riverwalk Way', city: 'New Orleans, LA 70130', contact: 'Yvette Tran', email: 'finance@harborviewhotel.com' },
    terms: 'Net 15', source: 'B2B', glCode: '4000', notes: 'Monthly banquet supplies — paid in full',
    items: [
      { sku: 'FRZ-BEEF-01', description: 'Ground Beef 80/20 10lb Chub',     uom: 'case', qty: 40, unitPrice: 168.00, total: 6720.00 },
      { sku: 'PROT-010',    description: 'Shrimp Jumbo 16/20 ct 5lb Block', uom: 'case', qty: 30, unitPrice: 108.00, total: 3240.00 },
      { sku: 'DAI-BUT-01',  description: 'Butter Unsalted 1lb 36ct',        uom: 'case', qty: 18, unitPrice:  72.00, total: 1296.00 },
      { sku: 'PRO-TOMA-01', description: 'Roma Tomatoes 25lb Case',         uom: 'case', qty: 12, unitPrice:  32.00, total:  384.00 },
    ],
    subtotal: 11640.00, taxRate: 9.45, tax: 1100.00, freight: 60.00, amount: 12800.00,
    paid: 12800.00, status: 'Paid',
  },
  {
    id: 'INV-504', date: '2026-05-08', dueDate: '2026-06-07',
    customerId: 'CUST-104', customer: 'Sunset Bistro Chain',
    billTo: { address: '901 Carrollton Ave', city: 'New Orleans, LA 70118', contact: 'Diego Alvarez', email: 'ap@sunsetbistro.com' },
    terms: 'Net 30', source: 'Field Sales', glCode: '4000', notes: 'Multi-location restock — Sales Rep: J. Park',
    items: [
      { sku: 'DAI-MILK-02', description: 'Whole Milk 1 Gal 4pk',          uom: 'case', qty: 60, unitPrice:  26.50, total: 1590.00 },
      { sku: 'DAI-CHE-02',  description: 'American Cheese 5lb',           uom: 'case', qty: 30, unitPrice:  48.00, total: 1440.00 },
      { sku: 'DRY-OIL-5G',  description: 'Vegetable Oil 5 Gal',           uom: 'pail', qty: 22, unitPrice:  46.00, total: 1012.00 },
      { sku: 'DRY-RICE-05', description: 'Jasmine Rice 50lb Bag',         uom: 'bag',  qty: 24, unitPrice:  52.00, total: 1248.00 },
    ],
    subtotal: 5290.00, taxRate: 9.45, tax: 250.00, freight: 60.00, amount: 5600.00,
    paid: 2000.00, status: 'Partial',
  },
  {
    id: 'INV-506', date: '2026-05-22', dueDate: '2026-06-05',
    customerId: 'CUST-106', customer: 'Bayou Grill & Pub',
    billTo: { address: '714 Decatur St', city: 'New Orleans, LA 70130', contact: 'Steven Marek', email: 'steven@bayougrill.com' },
    terms: 'Net 15', source: 'Logistics', glCode: '4000',
    notes: 'Auto-generated from delivered order SO-9893. Catch-weight lines billed by actual lb captured at Pack & Weigh.',
    orderId: 'SO-9893',
    items: [
      // Catch-weight beef: 12 cases ordered, 124.6 lb actual @ $8.55/lb = $1065.33
      { sku: 'FRZ-BEEF-01', description: 'Ground Beef 80/20 10lb Case', uom: 'lb', isCatchWeight: true,
        casesOrdered: 12, actualWeight: 124.6, estimatedWeight: 120.0, pricePerLb: 8.55,
        qty: 124.6, unitPrice: 8.55, total: 1065.33 },
      // Catch-weight chicken: 8 cases ordered, 54.8 lb actual @ $6.00/lb = $328.80
      { sku: 'PLT-CHICK-05', description: 'Jumbo Chicken Breasts', uom: 'lb', isCatchWeight: true,
        casesOrdered: 8, actualWeight: 54.8, estimatedWeight: 56.0, pricePerLb: 6.00,
        qty: 54.8, unitPrice: 6.00, total: 328.80 },
      // Non-catch lines
      { sku: 'BAK-BUN-01', description: 'Brioche Burger Buns 12pk', uom: 'case', qty: 6, unitPrice: 38.00, total: 228.00 },
      { sku: 'PRO-LET-01', description: 'Iceberg Lettuce 24ct',     uom: 'case', qty: 3, unitPrice: 41.00, total: 123.00 },
    ],
    subtotal: 1745.13, taxRate: 9.45, tax: 164.92, freight: 0.00, amount: 1910.05,
    paid: 0, status: 'Open',
  },
  {
    id: 'INV-505', date: '2026-05-15', dueDate: '2026-06-14',
    customerId: 'CUST-105', customer: 'City School District',
    billTo: { address: '3520 General Taylor St', city: 'New Orleans, LA 70125', contact: 'Karen O’Neil', email: 'foodservices@nolacsd.gov' },
    terms: 'Net 45', source: 'Manual', glCode: '4000', notes: 'Bid contract #SC-2026-091 — tax exempt',
    items: [
      { sku: 'PROT-002',    description: 'Chicken Breast Boneless 40lb', uom: 'case', qty: 80, unitPrice: 132.00, total: 10560.00 },
      { sku: 'DAI-MILK-02', description: 'Whole Milk 1 Gal 4pk',         uom: 'case', qty: 120,unitPrice:  26.50, total:  3180.00 },
      { sku: 'BAK-BUN-01',  description: 'Brioche Burger Buns 12pk',     uom: 'case', qty: 90, unitPrice:  38.00, total:  3420.00 },
      { sku: 'PRO-TOMA-01', description: 'Roma Tomatoes 25lb Case',      uom: 'case', qty: 50, unitPrice:  32.00, total:  1600.00 },
      { sku: 'DRY-RICE-05', description: 'Jasmine Rice 50lb Bag',        uom: 'bag',  qty: 60, unitPrice:  52.00, total:  3120.00 },
      { sku: 'SVC-DELIVERY',description: 'Delivery Service Fee',         uom: 'ea',   qty:  4, unitPrice:  30.00, total:   120.00 },
    ],
    subtotal: 22000.00, taxRate: 0.00, tax: 0.00, freight: 0.00, amount: 22000.00,
    paid: 0, status: 'Open',
  },
];

const INIT_EXPENSES = [
  { id: 'EXP-001', date: '2026-05-02', vendor: 'FleetPride Parts',  description: 'Truck 2 oil change & filter',     glCode: '6200', amount: 185.00,  accountId: 'BA001' },
  { id: 'EXP-002', date: '2026-05-05', vendor: 'Shell Station',     description: 'Fleet fuel – week of 5/5',         glCode: '6100', amount: 1240.00, accountId: 'BA001' },
  { id: 'EXP-003', date: '2026-05-10', vendor: 'Office Depot',      description: 'Printer paper, pens, staples',     glCode: '6400', amount: 95.50,   accountId: 'BA001' },
  { id: 'EXP-004', date: '2026-05-15', vendor: 'City Utilities',    description: 'Warehouse electricity – May',      glCode: '6500', amount: 620.00,  accountId: 'BA001' },
  { id: 'EXP-005', date: '2026-05-18', vendor: 'Zurich Insurance',  description: 'Fleet insurance premium Q2',       glCode: '6600', amount: 3200.00, accountId: 'BA001' },
];

// ── AP Purchase Orders — tied to INIT_VENDORS by vendorId ────────────────────
// These POs make up each vendor's "balance" figure.
// line items included so the PO document view shows full detail.
const INIT_AP_POS = [
  // ── US Foods Distribution (V001) — balance $12,450 ──────────────────────────
  {
    poNumber: 'PO-AP-0881', vendorId: 'V001', vendorName: 'US Foods Distribution',
    orderedDate: '2026-05-01', deliveryDate: '2026-05-04', status: 'Sent',
    total: 8200.00, paid: 0, notes: 'Weekly protein order — Route A & B',
    items: [
      { vendorProductCode:'USF-BEEF-8020', sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb Chub', uom:'case', qty:40, unitCost:128.00 },
      { vendorProductCode:'USF-CHK-BRKST', sku:'PROT-002',    description:'Chicken Breast Boneless 40lb', uom:'case', qty:30, unitCost:98.00  },
      { vendorProductCode:'USF-POR-TNDR',  sku:'PROT-005',    description:'Pork Tenderloin 10lb avg',    uom:'case', qty:20, unitCost:95.00  },
    ],
  },
  {
    poNumber: 'PO-AP-0882', vendorId: 'V001', vendorName: 'US Foods Distribution',
    orderedDate: '2026-05-08', deliveryDate: '2026-05-11', status: 'Partially Received',
    total: 4250.00, paid: 0, notes: 'Frozen seafood — Harbor View Hotel order',
    items: [
      { vendorProductCode:'USF-SHR-JBO',  sku:'PROT-010', description:'Shrimp Jumbo 16/20 ct 5lb Block', uom:'case', qty:30, unitCost:76.00  },
      { vendorProductCode:'USF-COD-FIL',  sku:'PROT-011', description:'Cod Fillet IQF 10lb',             uom:'case', qty:25, unitCost:98.00  },
    ],
  },
  // ── Sysco Corporation (V002) — balance $8,920.50 ─────────────────────────────
  {
    poNumber: 'PO-AP-0883', vendorId: 'V002', vendorName: 'Sysco Corporation',
    orderedDate: '2026-05-06', deliveryDate: '2026-05-08', status: 'Approved',
    total: 5450.00, paid: 0, notes: 'Dairy & produce standing order',
    items: [
      { vendorProductCode:'SYS-MLK-WHL',  sku:'DAI-MILK-02', description:'Whole Milk 1 Gal 4pk',          uom:'case', qty:80, unitCost:18.50 },
      { vendorProductCode:'SYS-BUT-UNS',  sku:'DAI-BUT-01',  description:'Butter Unsalted 1lb 36ct',      uom:'case', qty:40, unitCost:53.00 },
      { vendorProductCode:'SYS-TOM-RMA',  sku:'PRO-TOMA-01', description:'Roma Tomatoes 25lb Case',       uom:'case', qty:50, unitCost:20.00 },
      { vendorProductCode:'SYS-LET-ICE',  sku:'PRO-LET-01',  description:'Iceberg Lettuce 24ct',          uom:'case', qty:40, unitCost:29.00 },
    ],
  },
  {
    poNumber: 'PO-AP-0884', vendorId: 'V002', vendorName: 'Sysco Corporation',
    orderedDate: '2026-05-12', deliveryDate: '2026-05-15', status: 'Sent',
    total: 3470.50, paid: 0, notes: 'Dry goods & disposables restock',
    items: [
      { vendorProductCode:'SYS-RCE-JAS',  sku:'DRY-RICE-05', description:'Jasmine Rice 50lb Bag',         uom:'bag',  qty:30, unitCost:36.00  },
      { vendorProductCode:'SYS-OIL-CAN',  sku:'DRY-OIL-01',  description:'Canola Oil 1 Gal 6ct',          uom:'case', qty:20, unitCost:69.50  },
      { vendorProductCode:'SYS-CUP-16Z',  sku:'SUP-CUP-16',  description:'16oz Plastic Cups 50ct Sleeve', uom:'case', qty:15, unitCost:46.00  },
    ],
  },
  // ── Gordon Food Service (V003) — balance $3,200 ───────────────────────────────
  {
    poNumber: 'PO-AP-0885', vendorId: 'V003', vendorName: 'Gordon Food Service',
    orderedDate: '2026-05-15', deliveryDate: '2026-05-18', status: 'Sent',
    total: 3200.00, paid: 0, notes: 'Frozen & dry items — weekly',
    items: [
      { vendorProductCode:'GFS-SAL-ATL',  sku:'PROT-003', description:'Atlantic Salmon Fillet 5lb',  uom:'case', qty:20, unitCost:63.00 },
      { vendorProductCode:'GFS-FLR-APF',  sku:'DRY-FLR-01', description:'All-Purpose Flour 50lb', uom:'bag',  qty:20, unitCost:29.00 },
      { vendorProductCode:'GFS-SUG-GRN',  sku:'DRY-SUG-01', description:'Granulated Sugar 50lb', uom:'bag',  qty:10, unitCost:43.00 },
    ],
  },
  // ── FleetPride Parts (V004) — balance $1,450 ──────────────────────────────────
  {
    poNumber: 'PO-AP-0886', vendorId: 'V004', vendorName: 'FleetPride Parts',
    orderedDate: '2026-05-10', deliveryDate: '2026-05-13', status: 'Approved',
    total: 1450.00, paid: 0, notes: 'Fleet maintenance parts — Trucks 2, 3 & 5',
    items: [
      { vendorProductCode:'FP-BRK-PAD',  sku:'FLT-BRK-01', description:'Brake Pads (set of 4)',      uom:'set', qty:4, unitCost:185.00 },
      { vendorProductCode:'FP-OIL-FLT',  sku:'FLT-OIL-01', description:'Oil Filter – Freightliner',  uom:'ea',  qty:6, unitCost:45.00  },
      { vendorProductCode:'FP-WPR-BLD',  sku:'FLT-WPR-01', description:'Wiper Blade Set',            uom:'set', qty:5, unitCost:38.00  },
      { vendorProductCode:'FP-CLT-KIT',  sku:'FLT-CLT-01', description:'Coolant Flush Kit',          uom:'kit', qty:3, unitCost:95.00  },
      { vendorProductCode:'FP-AIR-FLT',  sku:'FLT-AIR-01', description:'Air Filter – Diesel Engine', uom:'ea',  qty:4, unitCost:62.50  },
    ],
  },
  // ── City Utilities (V005) — balance $620 ──────────────────────────────────────
  {
    poNumber: 'INV-UTL-0501', vendorId: 'V005', vendorName: 'City Utilities',
    orderedDate: '2026-05-01', deliveryDate: '2026-05-31', status: 'Sent',
    total: 620.00, paid: 0, notes: 'Warehouse electricity — May 2026',
    items: [
      { vendorProductCode:'CU-ELEC-MAY', sku:'UTL-ELEC', description:'Electricity Usage — 50,000 sq ft Warehouse (May 2026)', uom:'mo', qty:1, unitCost:620.00 },
    ],
  },
];


// ─── Goods Receipts — physical receiving records tied to POs ──────────────────
const INIT_GOODS_RECEIPTS = [
  {
    grId: 'GR-001', poNumber: 'PO-AP-0881',
    receivedDate: '2026-05-04', receivedBy: 'M. Johnson',
    notes: 'Full receipt — all temp logs within spec',
    lines: [
      { sku: 'FRZ-BEEF-01', description: 'Ground Beef 80/20 10lb Chub', qtyOrdered: 40, qtyReceived: 40, unitCost: 128.00 },
      { sku: 'PROT-002',    description: 'Chicken Breast Boneless 40lb', qtyOrdered: 30, qtyReceived: 30, unitCost: 98.00  },
      { sku: 'PROT-005',    description: 'Pork Tenderloin 10lb avg',    qtyOrdered: 20, qtyReceived: 20, unitCost: 95.00  },
    ],
  },
  {
    grId: 'GR-002', poNumber: 'PO-AP-0882',
    receivedDate: '2026-05-11', receivedBy: 'D. Tran',
    notes: '8 cases shrimp short-shipped — noted on BOL, driver confirmed',
    lines: [
      { sku: 'PROT-010', description: 'Shrimp Jumbo 16/20 ct 5lb Block', qtyOrdered: 30, qtyReceived: 22, unitCost: 76.00 },
      { sku: 'PROT-011', description: 'Cod Fillet IQF 10lb',             qtyOrdered: 25, qtyReceived: 25, unitCost: 98.00 },
    ],
  },
  {
    grId: 'GR-003', poNumber: 'PO-AP-0883',
    receivedDate: '2026-05-08', receivedBy: 'M. Johnson',
    notes: 'Full receipt — dairy temp 38°F, produce inspected OK',
    lines: [
      { sku: 'DAI-MILK-02', description: 'Whole Milk 1 Gal 4pk',     qtyOrdered: 80, qtyReceived: 80, unitCost: 18.50 },
      { sku: 'DAI-BUT-01',  description: 'Butter Unsalted 1lb 36ct', qtyOrdered: 40, qtyReceived: 40, unitCost: 53.00 },
      { sku: 'PRO-TOMA-01', description: 'Roma Tomatoes 25lb Case',   qtyOrdered: 50, qtyReceived: 50, unitCost: 20.00 },
      { sku: 'PRO-LET-01',  description: 'Iceberg Lettuce 24ct',      qtyOrdered: 40, qtyReceived: 40, unitCost: 29.00 },
    ],
  },
  {
    grId: 'GR-004', poNumber: 'PO-AP-0886',
    receivedDate: '2026-05-13', receivedBy: 'C. Ruiz',
    notes: 'All fleet parts received and cross-checked against packing list',
    lines: [
      { sku: 'FLT-BRK-01', description: 'Brake Pads (set of 4)',      qtyOrdered: 4, qtyReceived: 4, unitCost: 185.00 },
      { sku: 'FLT-OIL-01', description: 'Oil Filter – Freightliner',  qtyOrdered: 6, qtyReceived: 6, unitCost: 45.00  },
      { sku: 'FLT-WPR-01', description: 'Wiper Blade Set',            qtyOrdered: 5, qtyReceived: 5, unitCost: 38.00  },
      { sku: 'FLT-CLT-01', description: 'Coolant Flush Kit',          qtyOrdered: 3, qtyReceived: 3, unitCost: 95.00  },
      { sku: 'FLT-AIR-01', description: 'Air Filter – Diesel Engine', qtyOrdered: 4, qtyReceived: 4, unitCost: 62.50  },
    ],
  },
  // PO-AP-0884 (Sysco dry goods) — not yet received
  // PO-AP-0885 (Gordon Food) — not yet received
];

// ─── Vendor Bills — AP invoices received from suppliers ───────────────────────
const INIT_VENDOR_BILLS = [
  {
    billId: 'VBILL-001', billNumber: 'USF-INV-88210',
    poNumber: 'PO-AP-0881', vendorId: 'V001', vendorName: 'US Foods Distribution',
    billDate: '2026-05-05', dueDate: '2026-06-04', status: 'Pending',
    notes: '',
    lines: [
      { sku: 'FRZ-BEEF-01', description: 'Ground Beef 80/20 10lb Chub', qtyBilled: 40, unitPrice: 128.00 },
      { sku: 'PROT-002',    description: 'Chicken Breast Boneless 40lb', qtyBilled: 30, unitPrice: 98.00  },
      { sku: 'PROT-005',    description: 'Pork Tenderloin 10lb avg',    qtyBilled: 20, unitPrice: 95.00  },
    ],
  },
  {
    billId: 'VBILL-002', billNumber: 'USF-INV-88215',
    poNumber: 'PO-AP-0882', vendorId: 'V001', vendorName: 'US Foods Distribution',
    billDate: '2026-05-12', dueDate: '2026-06-11', status: 'Pending',
    notes: 'Billing full ordered qty — short ship dispute pending',
    lines: [
      { sku: 'PROT-010', description: 'Shrimp Jumbo 16/20 ct 5lb Block', qtyBilled: 30, unitPrice: 76.00 },
      { sku: 'PROT-011', description: 'Cod Fillet IQF 10lb',             qtyBilled: 25, unitPrice: 98.00 },
    ],
  },
  {
    billId: 'VBILL-003', billNumber: 'SYS-INV-20883',
    poNumber: 'PO-AP-0883', vendorId: 'V002', vendorName: 'Sysco Corporation',
    billDate: '2026-05-09', dueDate: '2026-06-08', status: 'Pending',
    notes: 'Market price adjustment applied to Roma Tomatoes',
    lines: [
      { sku: 'DAI-MILK-02', description: 'Whole Milk 1 Gal 4pk',     qtyBilled: 80, unitPrice: 18.50 },
      { sku: 'DAI-BUT-01',  description: 'Butter Unsalted 1lb 36ct', qtyBilled: 40, unitPrice: 53.00 },
      { sku: 'PRO-TOMA-01', description: 'Roma Tomatoes 25lb Case',   qtyBilled: 50, unitPrice: 21.80 },
      { sku: 'PRO-LET-01',  description: 'Iceberg Lettuce 24ct',      qtyBilled: 40, unitPrice: 29.00 },
    ],
  },
  {
    billId: 'VBILL-004', billNumber: 'FP-INV-4421',
    poNumber: 'PO-AP-0886', vendorId: 'V004', vendorName: 'FleetPride Parts',
    billDate: '2026-05-14', dueDate: '2026-05-29', status: 'Pending',
    notes: '',
    lines: [
      { sku: 'FLT-BRK-01', description: 'Brake Pads (set of 4)',      qtyBilled: 4, unitPrice: 185.00 },
      { sku: 'FLT-OIL-01', description: 'Oil Filter – Freightliner',  qtyBilled: 6, unitPrice: 45.00  },
      { sku: 'FLT-WPR-01', description: 'Wiper Blade Set',            qtyBilled: 5, unitPrice: 38.00  },
      { sku: 'FLT-CLT-01', description: 'Coolant Flush Kit',          qtyBilled: 3, unitPrice: 95.00  },
      { sku: 'FLT-AIR-01', description: 'Air Filter – Diesel Engine', qtyBilled: 4, unitPrice: 62.50  },
    ],
  },
  // PO-AP-0884 — no bill yet (pending receipt)
  // PO-AP-0885 — no bill yet (pending invoice)
];

// ─── Three-Way Match Engine ───────────────────────────────────────────────────
const PRICE_TOLERANCE_PCT = 0.02; // 2% variance allowed

const runMatchEngine = (po, gr, bill) => {
  if (!gr)   return { status: 'pending_receipt',  exceptions: ['No goods receipt on file for this PO'] };
  if (!bill) return { status: 'pending_invoice',  exceptions: ['No vendor bill received for this PO'] };

  const exceptions = [];

  for (const poLine of po.items) {
    const grLine   = gr.lines.find(l => l.sku === poLine.sku);
    const billLine = bill.lines.find(l => l.sku === poLine.sku);

    if (!grLine)   { exceptions.push(`${poLine.sku} missing from goods receipt`); continue; }
    if (!billLine) { exceptions.push(`${poLine.sku} missing from vendor bill`);   continue; }

    // Quantity: invoiced qty must equal received qty
    if (billLine.qtyBilled !== grLine.qtyReceived) {
      const diff = billLine.qtyBilled - grLine.qtyReceived;
      exceptions.push({
        type: 'qty', sku: poLine.sku, desc: poLine.description,
        detail: `Billed ${billLine.qtyBilled} ${poLine.uom || 'ea'} / Received ${grLine.qtyReceived} ${poLine.uom || 'ea'} (${diff > 0 ? '+' : ''}${diff})`,
      });
    }

    // Price: invoice price vs PO price within tolerance
    const priceDiff = Math.abs(billLine.unitPrice - poLine.unitCost) / poLine.unitCost;
    if (priceDiff > PRICE_TOLERANCE_PCT) {
      const diffAmt = billLine.unitPrice - poLine.unitCost;
      exceptions.push({
        type: 'price', sku: poLine.sku, desc: poLine.description,
        detail: `Billed $${billLine.unitPrice.toFixed(2)} / PO $${poLine.unitCost.toFixed(2)} (${diffAmt > 0 ? '+' : ''}$${Math.abs(diffAmt).toFixed(2)}, ${(priceDiff * 100).toFixed(1)}%)`,
      });
    }
  }

  if (exceptions.length === 0) return { status: 'matched', exceptions: [] };

  const hasQty   = exceptions.some(e => e.type === 'qty');
  const hasPrice = exceptions.some(e => e.type === 'price');
  if (hasQty && hasPrice) return { status: 'multi_exception', exceptions };
  if (hasQty)             return { status: 'qty_variance',    exceptions };
  return                         { status: 'price_variance',  exceptions };
};


// ═══════════════════════════════════════════════════════════════════════════════
// GENERAL LEDGER — Chart of Accounts + Seed Journal Entries
// ═══════════════════════════════════════════════════════════════════════════════

const CHART_OF_ACCOUNTS = [
  // ── ASSETS ──────────────────────────────────────────────────────────────────
  { id:'1010', name:'Cash — Operating Checking',  type:'asset',     subtype:'current',   normal:'debit',  grp:'Cash & Bank'    },
  { id:'1020', name:'Cash — Payroll Checking',    type:'asset',     subtype:'current',   normal:'debit',  grp:'Cash & Bank'    },
  { id:'1030', name:'Cash — Reserve',             type:'asset',     subtype:'current',   normal:'debit',  grp:'Cash & Bank'    },
  { id:'1200', name:'Accounts Receivable',        type:'asset',     subtype:'current',   normal:'debit',  grp:'Receivables'    },
  { id:'1300', name:'Inventory — Food Products',  type:'asset',     subtype:'current',   normal:'debit',  grp:'Inventory'      },
  { id:'1400', name:'Prepaid Expenses',           type:'asset',     subtype:'current',   normal:'debit',  grp:'Other Current'  },
  { id:'1600', name:'Vehicles & Fleet Equipment', type:'asset',     subtype:'fixed',     normal:'debit',  grp:'Fixed Assets'   },
  { id:'1610', name:'Accumulated Depreciation',   type:'asset',     subtype:'fixed',     normal:'credit', grp:'Fixed Assets'   },
  // ── LIABILITIES ─────────────────────────────────────────────────────────────
  { id:'2000', name:'Accounts Payable',           type:'liability', subtype:'current',   normal:'credit', grp:'Payables'       },
  { id:'2100', name:'Accrued Liabilities',        type:'liability', subtype:'current',   normal:'credit', grp:'Accrued'        },
  { id:'2500', name:'Equipment Loan Payable',     type:'liability', subtype:'long-term', normal:'credit', grp:'Long-Term Debt' },
  // ── EQUITY ──────────────────────────────────────────────────────────────────
  { id:'3000', name:"Owner's Equity",             type:'equity',    subtype:'equity',    normal:'credit', grp:'Equity'         },
  { id:'3100', name:'Retained Earnings',          type:'equity',    subtype:'equity',    normal:'credit', grp:'Equity'         },
  // ── REVENUE ─────────────────────────────────────────────────────────────────
  { id:'4000', name:'Sales Revenue',              type:'revenue',   subtype:'revenue',   normal:'credit', grp:'Revenue'        },
  { id:'4100', name:'Delivery & Freight Revenue', type:'revenue',   subtype:'revenue',   normal:'credit', grp:'Revenue'        },
  // ── COGS ────────────────────────────────────────────────────────────────────
  { id:'5000', name:'Cost of Goods Sold',         type:'cogs',      subtype:'cogs',      normal:'debit',  grp:'COGS'           },
  { id:'5100', name:'Inbound Freight',            type:'cogs',      subtype:'cogs',      normal:'debit',  grp:'COGS'           },
  // ── OPERATING EXPENSES ───────────────────────────────────────────────────────
  { id:'6100', name:'Fuel & Transportation',      type:'expense',   subtype:'opex',      normal:'debit',  grp:'Operating Exp.' },
  { id:'6200', name:'Fleet Maintenance',          type:'expense',   subtype:'opex',      normal:'debit',  grp:'Operating Exp.' },
  { id:'6300', name:'Payroll & Benefits',         type:'expense',   subtype:'opex',      normal:'debit',  grp:'Operating Exp.' },
  { id:'6400', name:'Office Supplies',            type:'expense',   subtype:'opex',      normal:'debit',  grp:'Operating Exp.' },
  { id:'6500', name:'Utilities',                  type:'expense',   subtype:'opex',      normal:'debit',  grp:'Operating Exp.' },
  { id:'6600', name:'Insurance',                  type:'expense',   subtype:'opex',      normal:'debit',  grp:'Operating Exp.' },
  { id:'6700', name:'Depreciation',               type:'expense',   subtype:'opex',      normal:'debit',  grp:'Operating Exp.' },
];

// Helper: account lookup
const acct = id => CHART_OF_ACCOUNTS.find(a => a.id === id) || { id, name: id, type: 'unknown' };

// Journal Entry builder
const je = (jeId, date, description, source, sourceRef, lines) =>
  ({ jeId, date, description, source, sourceRef, lines, posted: true });

const dr = (id, amt) => ({ accountId: id, accountName: acct(id).name, debit: amt, credit: 0 });
const cr = (id, amt) => ({ accountId: id, accountName: acct(id).name, debit: 0, credit: amt });

const SEED_JOURNAL_ENTRIES = [
  // ── Opening Balance — April 30, 2026 ─────────────────────────────────────
  je('JE-OB-001','2026-04-30','Opening Balance — Beginning of May 2026','SYS','OB',
    [ dr('1010',117920.15), dr('1020',35000.00), dr('1030',55000.00),
      dr('1300',145000.00), dr('1400',12000.00), dr('1600',425000.00),
      cr('1610',85000.00),  cr('2500',280000.00), cr('3000',300000.00),
      cr('3100',124920.15) ]),

  // ── AR — Customer Invoices ────────────────────────────────────────────────
  je('JE-AR-001','2026-05-01','Invoice INV-501 — Metro Restaurant Group','AR','INV-501',
    [ dr('1200',8450.00), cr('4000',8450.00) ]),
  je('JE-AR-002','2026-05-05','Invoice INV-502 — Downtown Catering Co.','AR','INV-502',
    [ dr('1200',3200.00), cr('4000',3200.00) ]),
  je('JE-AR-003','2026-04-20','Invoice INV-503 — Harbor View Hotel (Apr)','AR','INV-503',
    [ dr('1200',12800.00), cr('4000',12800.00) ]),
  je('JE-AR-004','2026-05-15','Payment INV-503 — Harbor View Hotel','AR','INV-503-PMT',
    [ dr('1010',12800.00), cr('1200',12800.00) ]),
  je('JE-AR-005','2026-05-08','Invoice INV-504 — Sunset Bistro Chain','AR','INV-504',
    [ dr('1200',5600.00), cr('4000',5600.00) ]),
  je('JE-AR-006','2026-05-18','Partial Payment INV-504 — Sunset Bistro','AR','INV-504-PMT',
    [ dr('1010',2000.00), cr('1200',2000.00) ]),
  je('JE-AR-007','2026-05-15','Invoice INV-505 — City School District','AR','INV-505',
    [ dr('1200',22000.00), cr('4000',22000.00) ]),
  je('JE-AR-008','2026-05-16','Delivery Surcharges — Week of 5/13','AR','DEL-WK20',
    [ dr('1200',9600.00), cr('4100',9600.00) ]),

  // ── AP — Vendor Bills (auto-posted from AP Match) ─────────────────────────
  je('JE-AP-001','2026-05-05','Vendor Bill VBILL-001 — US Foods Proteins','AP','VBILL-001',
    [ dr('5000',8200.00), cr('2000',8200.00) ]),
  je('JE-AP-002','2026-05-12','Vendor Bill VBILL-002 — US Foods Seafood','AP','VBILL-002',
    [ dr('5000',4730.00), cr('2000',4730.00) ]),
  je('JE-AP-003','2026-05-09','Vendor Bill VBILL-003 — Sysco Dairy & Produce','AP','VBILL-003',
    [ dr('5000',5540.00), cr('2000',5540.00) ]),
  je('JE-AP-004','2026-05-14','Vendor Bill VBILL-004 — FleetPride Parts','AP','VBILL-004',
    [ dr('6200',1450.00), cr('2000',1450.00) ]),

  // ── AP Payments — Checks Written ─────────────────────────────────────────
  je('JE-CHK-001','2026-05-10','CHK-1042 — US Foods Distribution (AP Payment)','CHK','CHK-1042',
    [ dr('2000',4500.00), cr('1010',4500.00) ]),
  je('JE-CHK-002','2026-05-12','CHK-1043 — Sysco Corporation (AP Payment)','CHK','CHK-1043',
    [ dr('2000',2100.00), cr('1010',2100.00) ]),
  je('JE-CHK-003','2026-05-20','CHK-1046 — Gordon Food Service (AP Payment)','CHK','CHK-1046',
    [ dr('2000',1800.00), cr('1010',1800.00) ]),

  // ── Direct Expense Disbursements ──────────────────────────────────────────
  je('JE-EXP-001','2026-05-02','EXP-001 — Truck 2 Oil Change & Filter','EXP','EXP-001',
    [ dr('6200',185.00), cr('1010',185.00) ]),
  je('JE-EXP-002','2026-05-05','EXP-002 — Fleet Fuel (Week of 5/5)','EXP','EXP-002',
    [ dr('6100',1240.00), cr('1010',1240.00) ]),
  je('JE-EXP-003','2026-05-10','EXP-003 — Office Supplies (Office Depot)','EXP','EXP-003',
    [ dr('6400',95.50), cr('1010',95.50) ]),
  je('JE-EXP-004','2026-05-15','EXP-004 — Warehouse Electricity (May)','EXP','EXP-004',
    [ dr('6500',620.00), cr('1010',620.00) ]),
  je('JE-EXP-005','2026-05-18','EXP-005 — Fleet Insurance Premium Q2','EXP','EXP-005',
    [ dr('6600',3200.00), cr('1010',3200.00) ]),
  je('JE-EXP-006','2026-05-15','CHK-1044 — Truck 3 Brake Repair (FleetPride)','CHK','CHK-1044',
    [ dr('6200',850.00), cr('1010',850.00) ]),
  je('JE-EXP-007','2026-05-18','CHK-1045 — City Utilities (May Electricity)','CHK','CHK-1045',
    [ dr('6500',620.00), cr('1010',620.00) ]),

  // ── Payroll ───────────────────────────────────────────────────────────────
  je('JE-PAY-001','2026-05-09','Payroll Run — Week ending 5/9','PAY','PAY-WK19',
    [ dr('6300',14250.00), cr('1020',14250.00) ]),
  je('JE-PAY-002','2026-05-23','Payroll Run — Week ending 5/23','PAY','PAY-WK21',
    [ dr('6300',14250.00), cr('1020',14250.00) ]),

  // ── Adjusting Entries ─────────────────────────────────────────────────────
  je('JE-ADJ-001','2026-05-31','Monthly Depreciation — Fleet & Equipment','ADJ','DEP-MAY26',
    [ dr('6700',3500.00), cr('1610',3500.00) ]),
];

// ── Financial Statement Period Definitions & Mock Data (B3) ──────────────────
const FS_PERIODS = [
  { id:'may26', label:"May '26", full:'Month Ended May 31, 2026',          pyId:'may25', pyLabel:'May 2025' },
  { id:'apr26', label:"Apr '26", full:'Month Ended April 30, 2026',         pyId:'apr25', pyLabel:'Apr 2025' },
  { id:'q126',  label:"Q1 '26",  full:'Three Months Ended March 31, 2026',  pyId:'q125',  pyLabel:'Q1 2025'  },
  { id:'ytd26', label:"YTD '26", full:'Five Months Ended May 31, 2026',     pyId:'ytd25', pyLabel:'YTD 2025' },
];

// P&L account-level figures for non-live periods and all prior-year comparatives.
// 'may26' is excluded — it is always computed live from journalEntries.
const FS_MOCK_PL = {
  // ── Current Year ──────────────────────────────────────────────────────────
  apr26: {'4000':50800,'4100':3900, '5000':14800,'5100':0,
          '6100':1100,'6200':1950,'6300':27000,'6400':88,'6500':1100,'6600':3200,'6700':3500},
  q126:  {'4000':152400,'4100':24800, '5000':50900,'5100':0,
          '6100':3400,'6200':6100,'6300':81000,'6400':280,'6500':3400,'6600':9600,'6700':10500},
  ytd26: {'4000':253650,'4100':42200, '5000':82500,'5100':0,
          '6100':5780,'6200':10535,'6300':136500,'6400':463.50,'6500':5880,'6600':16000,'6700':17500},
  // ── Prior Year (same-period comparatives) ─────────────────────────────────
  may25: {'4000':44200,'4100':7900, '5000':13200,'5100':0,
          '6100':1040,'6200':1750,'6300':24000,'6400':82,'6500':960,'6600':2800,'6700':3200},
  apr25: {'4000':41500,'4100':7200, '5000':11800,'5100':0,
          '6100':960,'6200':1600,'6300':22500,'6400':76,'6500':880,'6600':2800,'6700':3200},
  q125:  {'4000':130200,'4100':20700, '5000':42600,'5100':0,
          '6100':2900,'6200':5200,'6300':67500,'6400':240,'6500':2800,'6600':8400,'6700':9600},
  ytd25: {'4000':215900,'4100':35800, '5000':69800,'5100':0,
          '6100':4900,'6200':8600,'6300':114000,'6400':398,'6500':4640,'6600':14000,'6700':16000},
};

// Balance Sheet comparison: always Dec 31, 2025 (prior fiscal year-end) in second column.
// Assets = 702,300 | L+E = 702,300 ✓
const FS_BS_DEC31_2025 = {
  '1010':92800,'1020':28000,'1030':45000,
  '1200':31000,'1300':140000,'1400':11500,
  '1600':425000,'1610':71000,
  '2000':14200,'2100':10800,'2500':280000,
  '3000':300000,'3100':97300,
};

// ── Reconciliation seed data ──────────────────────────────────────────────────
// BA001 Operating Checking — April 2026 (Completed, all cleared, balanced)
// Opening $72,000 → Closing $81,500 (net +$9,500)
const APRIL_CHECKING_ITEMS = [
  { id: 'RCK-01', date: '2026-04-02', description: 'CHK-1038 – US Foods Distribution',  type: 'debit',  amount: 3800.00,  cleared: true },
  { id: 'RCK-02', date: '2026-04-05', description: 'Deposit – Metro Restaurant Group',   type: 'credit', amount: 8450.00,  cleared: true },
  { id: 'RCK-03', date: '2026-04-08', description: 'CHK-1039 – Sysco Corporation',       type: 'debit',  amount: 2100.00,  cleared: true },
  { id: 'RCK-04', date: '2026-04-12', description: 'EXP – Fleet Fuel (Apr)',             type: 'debit',  amount: 1240.00,  cleared: true },
  { id: 'RCK-05', date: '2026-04-15', description: 'Deposit – Harbor View Hotel',        type: 'credit', amount: 12800.00, cleared: true },
  { id: 'RCK-06', date: '2026-04-20', description: 'CHK-1040 – FleetPride Parts',        type: 'debit',  amount: 850.00,   cleared: true },
  { id: 'RCK-07', date: '2026-04-22', description: 'EXP – Commercial Insurance Q2',      type: 'debit',  amount: 2535.00,  cleared: true },
  { id: 'RCK-08', date: '2026-04-28', description: 'Deposit – Sunset Bistro Chain',      type: 'credit', amount: 2000.00,  cleared: true },
  { id: 'RCK-09', date: '2026-04-29', description: 'Transfer Out – Savings Reserve',     type: 'debit',  amount: 3200.00,  cleared: true },
  { id: 'RCK-10', date: '2026-04-30', description: 'Bank Fee – Apr Maintenance',         type: 'debit',  amount: 25.00,    cleared: true },
];

// BA001 Operating Checking — May 2026 (In Progress, mix cleared/outstanding)
// Opening $81,500 → Closing $84,320.15 (net +$2,820.15 when all cleared)
const MAY_CHECKING_ITEMS = [
  { id: 'MCK-01', date: '2026-05-02', description: 'Deposit – Metro Restaurant Group',   type: 'credit', amount: 9450.15,  cleared: true  },
  { id: 'MCK-02', date: '2026-05-05', description: 'Deposit – Harbor View Hotel',        type: 'credit', amount: 5670.00,  cleared: true  },
  { id: 'MCK-03', date: '2026-05-07', description: 'CHK-1042 – US Foods Distribution',  type: 'debit',  amount: 4500.00,  cleared: true  },
  { id: 'MCK-04', date: '2026-05-09', description: 'Payroll Transfer – WK19',            type: 'debit',  amount: 5000.00,  cleared: true  },
  { id: 'MCK-05', date: '2026-05-12', description: 'CHK-1043 – Sysco Corporation',       type: 'debit',  amount: 2100.00,  cleared: true  },
  { id: 'MCK-06', date: '2026-05-15', description: 'CHK-1044 – FleetPride Parts',        type: 'debit',  amount: 850.00,   cleared: true  },
  { id: 'MCK-07', date: '2026-05-18', description: 'EFT – Insurance Auto-Pay',           type: 'debit',  amount: 430.00,   cleared: true  },
  { id: 'MCK-08', date: '2026-05-20', description: 'Deposit – Crescent City Catering',   type: 'credit', amount: 3000.00,  cleared: false },
  { id: 'MCK-09', date: '2026-05-22', description: 'CHK-1045 – City Utilities',          type: 'debit',  amount: 620.00,   cleared: false },
  { id: 'MCK-10', date: '2026-05-24', description: 'CHK-1046 – Gordon Food Service',     type: 'debit',  amount: 1800.00,  cleared: false },
  { id: 'MCK-11', date: '2026-05-31', description: 'Bank Fee – May Maintenance',         type: 'debit',  amount: 30.00,    cleared: true  },
];

// BA002 Business Savings — April 2026 (Completed)
// Opening $35,000 → Closing $38,750 (net +$3,750)
const APRIL_SAVINGS_ITEMS = [
  { id: 'RSV-01', date: '2026-04-03', description: 'Transfer In – Operating Acct',       type: 'credit', amount: 3200.00, cleared: true },
  { id: 'RSV-02', date: '2026-04-15', description: 'Transfer Out – Emergency Draw',      type: 'debit',  amount: 200.00,  cleared: true },
  { id: 'RSV-03', date: '2026-04-30', description: 'Monthly Interest Credit',            type: 'credit', amount: 750.00,  cleared: true },
];

// BA003 Chase Credit Line — April 2026 (In Progress)
// Opening -$12,000 owed → Closing -$14,200 owed (net -$2,200 more debt)
// Cleared so far: balance = -12,000 + 2,000 - (1,840+380+940+345) = -13,505
// Outstanding: 920 charge - 225 payment = net 695 → full balance: -14,200
const APRIL_CREDIT_ITEMS = [
  { id: 'RCL-01', date: '2026-04-05', description: 'Charge – Shell Fleet Fuel Card',     type: 'debit',  amount: 1840.00, cleared: true  },
  { id: 'RCL-02', date: '2026-04-08', description: 'Payment – ACH Transfer',             type: 'credit', amount: 2000.00, cleared: true  },
  { id: 'RCL-03', date: '2026-04-12', description: 'Charge – Office Depot Supplies',     type: 'debit',  amount: 380.00,  cleared: true  },
  { id: 'RCL-04', date: '2026-04-18', description: 'Charge – Amazon Business Acct',      type: 'debit',  amount: 920.00,  cleared: false },
  { id: 'RCL-05', date: '2026-04-22', description: 'Charge – Maintenance Supplies',      type: 'debit',  amount: 940.00,  cleared: true  },
  { id: 'RCL-06', date: '2026-04-25', description: 'Finance Charge – Apr Interest',      type: 'debit',  amount: 345.00,  cleared: true  },
  { id: 'RCL-07', date: '2026-04-28', description: 'Payment – ACH Transfer',             type: 'credit', amount: 225.00,  cleared: false },
];

const INIT_RECONCILIATIONS = [
  { id: 'REC-CHK-APR', accountId: 'BA001', period: 'April 2026',  openingBalance:  72000.00,  closingDate: '2026-04-30', closingBalance:  81500.00, status: 'Completed',   items: APRIL_CHECKING_ITEMS },
  { id: 'REC-CHK-MAY', accountId: 'BA001', period: 'May 2026',    openingBalance:  81500.00,  closingDate: '2026-05-31', closingBalance:  84320.15, status: 'In Progress', items: MAY_CHECKING_ITEMS   },
  { id: 'REC-SAV-APR', accountId: 'BA002', period: 'April 2026',  openingBalance:  35000.00,  closingDate: '2026-04-30', closingBalance:  38750.00, status: 'Completed',   items: APRIL_SAVINGS_ITEMS  },
  { id: 'REC-CL-APR',  accountId: 'BA003', period: 'April 2026',  openingBalance: -12000.00,  closingDate: '2026-04-30', closingBalance: -14200.00, status: 'In Progress', items: APRIL_CREDIT_ITEMS   },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ─── Customer Profitability — SKU cost basis ──────────────────────────────────
// Unit costs sourced from AP POs; fallback COGS rate by category prefix.
const SKU_COST_RATES = {
  // Protein items (~72% COGS / 28% gross margin) — wholesale meat & seafood
  'FRZ-':   0.72, 'PLT-':  0.72, 'PROT-': 0.72,
  // Dairy (~70% COGS / 30% margin)
  'DAI-':   0.70,
  // Produce (~62% COGS / 38% margin) — fresh produce typically higher margin
  'PRO-':   0.62,
  // Bakery (~67% COGS / 33% margin)
  'BAK-':   0.67,
  // Dry goods (~69% COGS / 31% margin)
  'DRY-':   0.69,
  // Services — delivery fees, fuel surcharges (~24% COGS / 76% margin)
  'SVC-':   0.24,
};
const FALLBACK_COGS_RATE = 0.70;

const skuCogsRate = (sku) => {
  const prefix = Object.keys(SKU_COST_RATES).find(p => sku.startsWith(p));
  return prefix ? SKU_COST_RATES[prefix] : FALLBACK_COGS_RATE;
};

// Mock prior-period (April 2026) revenue for trend indicators
const PRIOR_PERIOD_REVENUE = {
  'CUST-101': 6200.00,
  'CUST-102': 2800.00,
  'CUST-103': 9400.00,
  'CUST-104': 4100.00,
  'CUST-105': 18500.00,
  'CUST-106': 1400.00,
  'CUST-107': 0,
};

// Estimated delivery cost per invoice (per-stop blended rate: fuel + driver time)
const DELIVERY_COST_PER_STOP = 75.00;

function numberToWords(n) {
  const ones = ['','one','two','three','four','five','six','seven','eight','nine',
    'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  const dollars = Math.floor(Math.abs(n));
  const cents = Math.round((Math.abs(n) - dollars) * 100);
  function cvtHundreds(num) {
    let r = '';
    if (num >= 100) { r += ones[Math.floor(num / 100)] + ' hundred '; num %= 100; }
    if (num >= 20)  { r += tens[Math.floor(num / 10)] + ' '; num %= 10; }
    if (num > 0)    { r += ones[num] + ' '; }
    return r;
  }
  function cvt(num) {
    if (num === 0) return '';
    if (num < 1000) return cvtHundreds(num);
    if (num < 1_000_000) return cvt(Math.floor(num / 1000)) + 'thousand ' + cvtHundreds(num % 1000);
    return cvt(Math.floor(num / 1_000_000)) + 'million ' + cvt(num % 1_000_000);
  }
  const words = cvt(dollars).trim() || 'zero';
  return words.charAt(0).toUpperCase() + words.slice(1) + ` and ${String(cents).padStart(2, '0')}/100`;
}

function ageDays(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86_400_000);
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// ─── MODAL WRAPPERS ───────────────────────────────────────────────────────────
// ─── STATUS BADGE HELPER ──────────────────────────────────────────────────────
function InvoiceBadge({ status }) {
  const map = { Paid: UI.badgeGreen, Open: UI.badgeBlue, Overdue: UI.badgeRed, Partial: UI.badgeAmber };
  return <span className={map[status] ?? UI.badgeGray}>{status}</span>;
}
function CheckBadge({ status }) {
  const map = { Cleared: UI.badgeGreen, Outstanding: UI.badgeAmber, Void: UI.badgeGray };
  return <span className={map[status] ?? UI.badgeGray}>{status}</span>;
}

// ── Driver Close-out Data (fed from Logistics driver return sign-ins) ──────────
const CLOSEOUT_DRIVERS = [
  {
    id:'D01', name:'Marcus T.', vehicle:'Truck 04', departureTime:'6:45 AM', returnTime:'3:12 PM', status:'reconciled',
    stops:[
      {id:'s1',  customer:'Metro Diner & Grill',     orderId:'ORD-4821', invoiceAmt:847.50,  deliveryStatus:'delivered', cashCollected:0,      checkCollected:847.50,  checkNumber:'1042', notes:''},
      {id:'s2',  customer:'Harbor View Hotel',       orderId:'ORD-4822', invoiceAmt:2340.00, deliveryStatus:'delivered', cashCollected:0,      checkCollected:2340.00, checkNumber:'8871', notes:''},
      {id:'s3',  customer:'Pines Cafeteria',         orderId:'ORD-4823', invoiceAmt:615.75,  deliveryStatus:'partial',   cashCollected:0,      checkCollected:543.00,  checkNumber:'0219', notes:'Missing romaine'},
      {id:'s4',  customer:'Sunrise Bistro',          orderId:'ORD-4824', invoiceAmt:392.20,  deliveryStatus:'delivered', cashCollected:392.20, checkCollected:0,       checkNumber:'',     notes:''},
      {id:'s5',  customer:'Golden Wok Restaurant',   orderId:'ORD-4825', invoiceAmt:1104.00, deliveryStatus:'returned',  cashCollected:0,      checkCollected:0,       checkNumber:'',     notes:'Business closed'},
    ],
  },
  {
    id:'D02', name:'Darnell W.', vehicle:'Truck 07', departureTime:'7:00 AM', returnTime:null, status:'out',
    stops:[
      {id:'s6',  customer:'Cliffside Country Club',        orderId:'ORD-4826', invoiceAmt:3210.00, deliveryStatus:'pending', cashCollected:0, checkCollected:0, checkNumber:'', notes:''},
      {id:'s7',  customer:"St. Mary's Hospital Cafeteria", orderId:'ORD-4827', invoiceAmt:4875.50, deliveryStatus:'pending', cashCollected:0, checkCollected:0, checkNumber:'', notes:''},
      {id:'s8',  customer:'The Rustic Table',              orderId:'ORD-4828', invoiceAmt:728.00,  deliveryStatus:'pending', cashCollected:0, checkCollected:0, checkNumber:'', notes:''},
      {id:'s9',  customer:'Parkway Deli',                  orderId:'ORD-4829', invoiceAmt:445.30,  deliveryStatus:'pending', cashCollected:0, checkCollected:0, checkNumber:'', notes:''},
      {id:'s10', customer:'Eastside Elementary',           orderId:'ORD-4830', invoiceAmt:1560.00, deliveryStatus:'pending', cashCollected:0, checkCollected:0, checkNumber:'', notes:''},
      {id:'s11', customer:'TGI Weekdays',                  orderId:'ORD-4831', invoiceAmt:892.00,  deliveryStatus:'pending', cashCollected:0, checkCollected:0, checkNumber:'', notes:''},
    ],
  },
  {
    id:'D03', name:'Sofia R.', vehicle:'Van 02', departureTime:'7:15 AM', returnTime:'2:30 PM', status:'reconciled',
    stops:[
      {id:'s12', customer:'Bella Italia',      orderId:'ORD-4832', invoiceAmt:934.00,  deliveryStatus:'delivered', cashCollected:0,      checkCollected:934.00,  checkNumber:'5541', notes:''},
      {id:'s13', customer:'The Corner Bakery', orderId:'ORD-4833', invoiceAmt:287.50,  deliveryStatus:'delivered', cashCollected:287.50, checkCollected:0,       checkNumber:'',     notes:''},
      {id:'s14', customer:'Downtown YMCA',     orderId:'ORD-4834', invoiceAmt:2100.00, deliveryStatus:'delivered', cashCollected:0,      checkCollected:2100.00, checkNumber:'0087', notes:''},
      {id:'s15', customer:'Maple Leaf Diner',  orderId:'ORD-4835', invoiceAmt:519.80,  deliveryStatus:'delivered', cashCollected:519.80, checkCollected:0,       checkNumber:'',     notes:''},
    ],
  },
  {
    id:'D04', name:'James P.', vehicle:'Truck 11', departureTime:'6:30 AM', returnTime:'4:05 PM', status:'reconciled',
    stops:[
      {id:'s16', customer:'Northgate Mall Food Court',  orderId:'ORD-4836', invoiceAmt:5640.00, deliveryStatus:'delivered', cashCollected:0,      checkCollected:5640.00, checkNumber:'3301', notes:''},
      {id:'s17', customer:'Riverside Senior Center',    orderId:'ORD-4837', invoiceAmt:1820.00, deliveryStatus:'partial',   cashCollected:0,      checkCollected:1620.00, checkNumber:'7744', notes:'Temp log — product returned'},
      {id:'s18', customer:'Harbor Heights Bar & Grill', orderId:'ORD-4838', invoiceAmt:678.30,  deliveryStatus:'delivered', cashCollected:678.30, checkCollected:0,       checkNumber:'',     notes:''},
      {id:'s19', customer:'University Commons',         orderId:'ORD-4839', invoiceAmt:3200.00, deliveryStatus:'delivered', cashCollected:0,      checkCollected:3200.00, checkNumber:'0556', notes:''},
    ],
  },
];

function coDriverTotals(driver) {
  const cash        = driver.stops.reduce((s,st) => s + st.cashCollected,  0);
  const checks      = driver.stops.reduce((s,st) => s + st.checkCollected, 0);
  const invoiced    = driver.stops.reduce((s,st) => s + st.invoiceAmt,     0);
  const undelivered = driver.stops
    .filter(st => st.deliveryStatus === 'returned')
    .reduce((s,st) => s + st.invoiceAmt, 0);
  return { cash, checks, collected: cash + checks, invoiced, undelivered };
}

function CoDriverBadge({ status }) {
  const map = {
    out:        'bg-cyan-500/15 text-cyan-400',
    returned:   'bg-amber-500/15 text-amber-400',
    reconciled: 'bg-emerald-500/15 text-emerald-400',
  };
  const labels = { out:'On Route', returned:'Returned', reconciled:'Reconciled' };
  const dotMap = { out:'bg-cyan-400 animate-pulse', returned:'bg-amber-400', reconciled:'bg-emerald-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || map.out}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status] || dotMap.out}`} />
      {labels[status] || status}
    </span>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AccountingModule() {
  const { settings, pendingInvoices, consumePendingInvoices, quickCreateAction, clearQuickCreateAction, logAudit, activeUser, activeLocation } = useKernal();
  // Permission gates: full write for accountant/admin; managers can approve/view; others read-only
  const canWrite   = ['admin', 'accountant'].includes(activeUser?.role);
  const canApprove = ['admin', 'manager', 'accountant'].includes(activeUser?.role);

  // Quick Create: "New Invoice" from sidebar — switch to Customers & AR tab + open Invoice Builder
  useEffect(() => {
    if (quickCreateAction === 'new-invoice') {
      setTab('customers');
      resetInvBuilder();
      setInvBuilderCatalogSearch('');
      setModal({ type: 'invBuilder' });
      clearQuickCreateAction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickCreateAction]);
  const codEnabled               = settings.features.codCollections;
  const commissionTrackingEnabled = settings.features?.commissionTracking !== false;
  // ── core state ──────────────────────────────────────────────────────────────
  const [tab, setTab]               = useState('dashboard');
  // Daily Close-out reconciliation state
  const [closeoutRoutes,  setCloseoutRoutes]  = useState(DEMO_MODE ? CLOSEOUT_DRIVERS : []);
  const [closeoutLoading, setCloseoutLoading] = useState(false);
  const [verifiedStops,  setVerifiedStops]  = useState({});   // { [stopId]: true }
  const [signedRoutes,   setSignedRoutes]   = useState({});   // { [driverId]: true }
  const [expandedDriver, setExpandedDriver] = useState(null); // driverId string
  const [vendors, setVendors]       = useState(DEMO_MODE ? INIT_VENDORS : []);
  const [bankAccounts, setBankAccounts] = useState(DEMO_MODE ? INIT_BANK_ACCOUNTS : []);
  const [checks, setChecks]         = useState(DEMO_MODE ? INIT_CHECKS : []);
  const [invoices, setInvoices]     = useState(DEMO_MODE ? INIT_INVOICES : []);

  // ── API error toast ──────────────────────────────────────────────────────────
  const [apiToast, setApiToast] = useState(null);
  const showApiToast = (msg) => { setApiToast(msg); setTimeout(() => setApiToast(null), 4000); };

  // ── Map API invoice row → local shape ────────────────────────────────────────
  const mapApiInvoice = (row) => ({
    _id:        row.id,
    id:         row.invoice_number,
    date:       row.issue_date || TODAY,
    dueDate:    row.due_date   || '',
    customerId: row.customer_id   || null,
    customer:   row.customer_name || '',
    billTo: {
      address: row.bill_to_address || '',
      city:    row.bill_to_city    || '',
      contact: row.bill_to_name    || '',
      email:   row.bill_to_email   || '',
    },
    terms:    row.payment_terms || 'Net 30',
    source:   row.source        || 'Manual',
    glCode:   row.gl_code       || '4000',
    notes:    row.notes         || '',
    items:    (row.invoice_line_items || []).map(li => ({
      _lineId:         li.id,
      sku:             li.sku              || '',
      description:     li.description      || '',
      uom:             li.uom              || 'ea',
      qty:             Number(li.quantity) || 0,
      unitPrice:       Number(li.unit_price) || 0,
      total:           Number(li.line_total)  || 0,
      isCatchWeight:   !!li.is_catch_weight,
      pricePerLb:      li.price_per_lb     ? Number(li.price_per_lb)     : undefined,
      casesOrdered:    li.cases_ordered    ? Number(li.cases_ordered)    : undefined,
      actualWeight:    li.actual_weight    ? Number(li.actual_weight)    : undefined,
      estimatedWeight: li.estimated_weight ? Number(li.estimated_weight) : undefined,
    })),
    subtotal: Number(row.subtotal)    || 0,
    taxRate:  Number(row.tax_rate)    || 0,
    tax:      Number(row.tax)         || 0,
    freight:  Number(row.freight)     || 0,
    amount:   Number(row.total)       || 0,
    paid:     Number(row.paid_amount) || 0,
    status:   row.status              || 'Open',
    orderId:  row.order_id            || null,
  });

  // ── Row mappers — bank accounts / checks / expenses ──────────────────────────
  const mapApiBankAccount = (r) => ({
    _id:         r.id,
    id:          r.id,
    name:        r.name,
    number:      r.number      || '',
    balance:     Number(r.balance) || 0,
    bank:        r.bank        || '',
    routing:     r.routing     || '',
    type:        r.type        || 'Checking',
    creditLimit: r.credit_limit != null ? Number(r.credit_limit) : undefined,
  });

  const mapApiCheck = (r) => ({
    _id:       r.id,
    id:        `CHK-${r.check_number}`,
    num:       r.check_number,
    date:      r.check_date,
    payee:     r.payee,
    amount:    Number(r.amount),
    memo:      r.memo    || '',
    accountId: r.account_id || '',
    status:    r.status  || 'Outstanding',
    glCode:    r.gl_code || '',
  });

  const mapApiExpense = (r) => ({
    _id:         r.id,
    id:          r.id,
    date:        r.expense_date,
    description: r.description,
    amount:      Number(r.amount),
    accountId:   r.account_id || '',
    vendor:      r.vendor     || '',
    category:    r.category   || '',
    glCode:      r.gl_code    || '',
  });

  // ── Seed invoices from API on mount ──────────────────────────────────────────
  useEffect(() => {
    if (DEMO_MODE) return;
    api.accounting.invoices.list({ limit: 500 })
      .then(r => { if (r.data?.length) setInvoices(r.data.map(mapApiInvoice)); })
      .catch(() => {});
  }, []);

  // ── Fetch bank accounts, checks, expenses on mount ───────────────────────────
  useEffect(() => {
    if (DEMO_MODE) return;
    api.accounting.bankAccounts.list()
      .then(r => { const rows = r?.data || r; if (Array.isArray(rows) && rows.length) setBankAccounts(rows.map(mapApiBankAccount)); })
      .catch(() => {});
    api.accounting.checks.list({ limit: 500 })
      .then(r => { if (r?.data?.length) setChecks(r.data.map(mapApiCheck)); })
      .catch(() => {});
    api.accounting.expenses.list({ limit: 500 })
      .then(r => { if (r?.data?.length) setExpenses(r.data.map(mapApiExpense)); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load today's close-out routes from API ────────────────────────────────
  const loadCloseoutRoutes = useCallback((date) => {
    if (DEMO_MODE) return;
    setCloseoutLoading(true);
    api.closeout.list(date || null)
      .then(routes => {
        if (!Array.isArray(routes)) return;
        setCloseoutRoutes(routes);
        // Hydrate verifiedStops + signedRoutes from persisted DB state
        const newVerified = {};
        const newSigned   = {};
        for (const r of routes) {
          if (r.status === 'reconciled') newSigned[r.id] = true;
          for (const s of r.stops || []) {
            if (s.verified) newVerified[s.id] = true;
          }
        }
        setVerifiedStops(newVerified);
        setSignedRoutes(newSigned);
      })
      .catch(() => {})
      .finally(() => setCloseoutLoading(false));
  }, []);

  useEffect(() => { loadCloseoutRoutes(); }, [loadCloseoutRoutes]);

  // ── Chart of Accounts — live state (falls back to GL_ACCOUNTS seed in DEMO) ─
  const [glAccounts, setGlAccounts] = useState(GL_ACCOUNTS);

  useEffect(() => {
    if (DEMO_MODE) return;
    api.gl.accounts.list({ limit: 500 })
      .then(r => {
        if (r.data?.length) {
          setGlAccounts(r.data.map(a => ({
            code: a.account_code,
            name: a.name,
            type: a.type,
          })));
        }
      })
      .catch(() => {});
  }, []);

  // ── Accounting Periods ────────────────────────────────────────────────────────
  const [glPeriods, setGlPeriods] = useState([]);

  useEffect(() => {
    if (DEMO_MODE) return;
    api.gl.periods.list({ limit: 24 })
      .then(r => { if (r.data) setGlPeriods(r.data); })
      .catch(() => {});
  }, []);

  // ── Vendor Bills (AP) — seed from API ────────────────────────────────────────
  const mapApiBill = (row) => ({
    _id:        row.id,
    billId:     row.id,
    billNumber: row.bill_number,
    poNumber:   row.po_number   || '',
    vendorId:   row.vendor_id   || '',
    vendorName: row.vendor_name,
    billDate:   row.bill_date,
    dueDate:    row.due_date    || '',
    status:     row.status,
    notes:      row.notes       || '',
    lines: (row.lines || []).map(l => ({
      sku:         l.sku          || '',
      description: l.description,
      qtyBilled:   Number(l.quantity  || 0),
      unitPrice:   Number(l.unit_cost || 0),
    })),
  });

  // ── Drain pending invoices pushed from Logistics (catch-weight billing) ──
  // The hand-off pattern: Logistics → addPendingInvoice(); useEffect here
  // picks them up, normalizes shape, computes a due date, and prepends them
  // to AR. Each pending invoice is consumed exactly once.
  useEffect(() => {
    if (pendingInvoices.length === 0) return;
    const drained = consumePendingInvoices();
    if (drained.length === 0) return;
    const normalized = drained.map(d => {
      // Find a matching billing customer record (best-effort by name) for billTo defaults
      const billCust = BILLING_CUSTOMERS.find(c => c.name === d.customer);
      // Compute due date if blank: invoice date + Net 30
      let dueDate = d.dueDate;
      if (!dueDate) {
        const dt = new Date(d.date + 'T12:00:00');
        dt.setDate(dt.getDate() + 30);
        dueDate = dt.toISOString().slice(0, 10);
      }
      return {
        id: d.id || `INV-${String(Date.now()).slice(-4)}`,
        date: d.date,
        dueDate,
        customer: d.customer,
        customerId: billCust?.id,
        billTo: billCust ? { address: billCust.address, city: billCust.city, contact: billCust.contact, email: billCust.email } : undefined,
        terms: billCust?.terms || 'Net 30',
        source: d.source || 'Logistics',
        glCode: d.glCode || '4000',
        notes: d.notes || '',
        items: d.items || [],
        subtotal: d.subtotal ?? 0,
        taxRate: d.taxRate ?? 0,
        tax: d.tax ?? 0,
        freight: d.freight ?? 0,
        amount: d.amount ?? 0,
        paid: 0,
        status: 'Open',
        orderId: d.orderId,
      };
    });
    setInvoices(prev => [...normalized, ...prev]);
  }, [pendingInvoices, consumePendingInvoices]);
  const [expenses, setExpenses]     = useState(DEMO_MODE ? INIT_EXPENSES : []);
  const [reconciliations, setReconciliations] = useState(DEMO_MODE ? INIT_RECONCILIATIONS : []);

  // ── Three-Way Match state ────────────────────────────────────────────────────
  const [goodsReceipts, setGoodsReceipts] = useState(DEMO_MODE ? INIT_GOODS_RECEIPTS : []);
  const [vendorBills,   setVendorBills]   = useState(DEMO_MODE ? INIT_VENDOR_BILLS : []);
  const [matchFilter,   setMatchFilter]   = useState('all');   // 'all'|'matched'|'exception'|'pending'
  const [matchDetailId, setMatchDetailId] = useState(null);    // poNumber of expanded row

  useEffect(() => {
    if (DEMO_MODE) return;
    api.gl.bills.list({ limit: 500 })
      .then(r => { if (r.data?.length) setVendorBills(r.data.map(mapApiBill)); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── filter/search state ─────────────────────────────────────────────────────
  const [vendorSearch, setVendorSearch]   = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('All');
  const [checkSearch, setCheckSearch]     = useState('');
  const [ledgerSearch, setLedgerSearch]   = useState('');
  const [activeReconcile, setActiveReconcile] = useState('REC-CHK-MAY');
  const [recAcctFilter, setRecAcctFilter]     = useState('All');
  const [reportTab, setReportTab]         = useState('ledger');
  const [profitCust, setProfitCust]       = useState(null);   // selected customer id for drilldown
  const [profitSort, setProfitSort]       = useState({ col: 'revenue', dir: 'desc' });
  const [profitFilter, setProfitFilter]   = useState('All');

  // ── payment processing state ─────────────────────────────────────────────────
  const [paymentMethods, setPaymentMethods]         = useState(DEMO_MODE ? INIT_PAYMENT_METHODS : []);
  const [paymentTxns,    setPaymentTxns]            = useState(DEMO_MODE ? INIT_PAYMENT_TRANSACTIONS : []);
  const [paySubTab,      setPaySubTab]              = useState('transactions'); // 'transactions'|'methods'|'portal'
  const [payTxnFilter,   setPayTxnFilter]           = useState('All');   // All|Settled|Processing|Pending|Failed
  const [payTxnSearch,   setPayTxnSearch]           = useState('');
  const [portalCustId,   setPortalCustId]           = useState('CUST-101');
  const [portalSelInvs,  setPortalSelInvs]          = useState([]);       // selected invoice IDs
  const [portalMethodId, setPortalMethodId]         = useState('');
  const [portalProcessing, setPortalProcessing]     = useState(null);    // null | 'animating' | 'done'
  const [addMethodModal, setAddMethodModal]         = useState(false);
  const [addMethodForm,  setAddMethodForm]          = useState({ custId: 'CUST-101', type: 'ach', bank: '', routing: '', accountNum: '', cardBrand: 'Visa', cardLast4: '', cardExpiry: '' });

  // ── commission settlement state ──────────────────────────────────────────────
  const [commSubTab, setCommSubTab] = useState('summary'); // 'summary' | 'settlement'
  const [settlementPeriods, setSettlementPeriods] = useState(() => {
    const repNames = Object.keys(REP_RATES);
    return [
      {
        id: 'SET-APR-2026', period: 'April 2026', month: 'Apr 2026', status: 'Paid',
        lockedAt: '2026-05-02', approvedBy: 'Admin', exportedAt: '2026-05-03',
        payrollSystem: 'ADP', payrollRef: 'ADP-2026-0503-COMM',
        reps: repNames.map(name => {
          const hist = MONTHLY_HISTORY[name] || [];
          const apr = hist.find(h => h.month === 'Apr 2026') || {};
          return { name, commission: apr.commission ?? 0, acknowledged: true, acknowledgedAt: '2026-05-02' };
        }),
      },
      {
        id: 'SET-MAY-2026', period: 'May 2026', month: 'May 2026', status: 'Open',
        lockedAt: null, approvedBy: null, exportedAt: null,
        payrollSystem: 'ADP', payrollRef: null,
        reps: repNames.map(name => {
          const hist = MONTHLY_HISTORY[name] || [];
          const may = hist.find(h => h.month === 'May 2026') || {};
          return { name, commission: may.commission ?? 0, acknowledged: false, acknowledgedAt: null };
        }),
      },
    ];
  });
  const [activeSettlementId, setActiveSettlementId] = useState('SET-MAY-2026');
  const [exportTarget, setExportTarget] = useState('ADP');
  const [exportFired, setExportFired] = useState(false);

  // ── modal state ─────────────────────────────────────────────────────────────
  const [modal, setModal] = useState({ type: null });
  const closeModal = useCallback(() => setModal({ type: null }), []);

  // ── vendor form state ────────────────────────────────────────────────────────
  const [vendorForm, setVendorForm] = useState({ id: '', name: '', contact: '', phone: '', email: '', address: '', terms: 'Net 30', balance: '' });
  const setVF = (k, v) => setVendorForm(prev => ({ ...prev, [k]: v }));

  // ── check form state ─────────────────────────────────────────────────────────
  const [checkForm, setCheckForm] = useState({ payee: '', amount: '', memo: '', accountId: 'BA001', date: TODAY, glCode: '5000' });
  const setCF = (k, v) => setCheckForm(prev => ({ ...prev, [k]: v }));

  // ── invoice form state (legacy quick-create — retained for compatibility) ────
  const [invForm, setInvForm] = useState({ customer: '', amount: '', dueDate: '', notes: '', glCode: '4000', source: 'Manual' });
  const setIF = (k, v) => setInvForm(prev => ({ ...prev, [k]: v }));

  // ── invoice BUILDER state — full line-item invoice ──────────────────────────
  const emptyInvLine = () => ({ sku: '', description: '', uom: 'case', qty: 1, unitPrice: 0 });
  const [invBuilder, setInvBuilder] = useState({
    customerId: '', date: TODAY, dueDate: '', terms: 'Net 30',
    source: 'Manual', glCode: '4000', taxRate: 9.45, freight: 0, notes: '',
    items: [emptyInvLine()],
  });
  const setIB = (k, v) => setInvBuilder(prev => ({ ...prev, [k]: v }));
  const setIBItem = (idx, k, v) => setInvBuilder(prev => {
    const items = prev.items.map((it, i) => i === idx ? { ...it, [k]: v } : it);
    return { ...prev, items };
  });
  const addIBLine = () => setInvBuilder(prev => ({ ...prev, items: [...prev.items, emptyInvLine()] }));
  const removeIBLine = (idx) => setInvBuilder(prev => ({
    ...prev,
    items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== idx) : prev.items,
  }));
  const addIBFromCatalog = (catalogItem) => setInvBuilder(prev => {
    // Replace last empty row if present; else append
    const items = [...prev.items];
    const lastIdx = items.length - 1;
    const isLastEmpty = items[lastIdx] && !items[lastIdx].description && !items[lastIdx].sku;
    // Catch-weight items: bill per pound. Default to 1 case = avgWeightPerCase lb,
    // unitPrice = pricePerLb. The qty field then represents pounds, not cases.
    const isCW = !!catalogItem.isCatchWeight;
    const newRow = isCW
      ? {
          sku: catalogItem.sku,
          description: `${catalogItem.description} (catch weight)`,
          uom: 'lb',
          qty: catalogItem.avgWeightPerCase || 1,        // default 1-case worth of lb
          unitPrice: catalogItem.pricePerLb || 0,
          isCatchWeight: true,
          pricePerLb: catalogItem.pricePerLb,
          avgWeightPerCase: catalogItem.avgWeightPerCase,
          casesOrdered: 1,
        }
      : { sku: catalogItem.sku, description: catalogItem.description, uom: catalogItem.uom, qty: 1, unitPrice: catalogItem.unitPrice };
    if (isLastEmpty) { items[lastIdx] = newRow; } else { items.push(newRow); }
    return { ...prev, items };
  });
  const resetInvBuilder = () => setInvBuilder({
    customerId: '', date: TODAY, dueDate: '', terms: 'Net 30',
    source: 'Manual', glCode: '4000', taxRate: 9.45, freight: 0, notes: '',
    items: [emptyInvLine()],
  });
  const [invBuilderCatalogSearch, setInvBuilderCatalogSearch] = useState('');

  // Derived totals for the builder
  const invBuilderSubtotal = useMemo(() => invBuilder.items.reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0), [invBuilder.items]);
  const invBuilderTax = useMemo(() =>
    Math.round(invBuilderSubtotal * (Number(invBuilder.taxRate) || 0)) / 100,
    [invBuilderSubtotal, invBuilder.taxRate]);
  const invBuilderTotal = useMemo(() =>
    invBuilderSubtotal + invBuilderTax + (Number(invBuilder.freight) || 0),
    [invBuilderSubtotal, invBuilderTax, invBuilder.freight]);

  // ── expense form state ────────────────────────────────────────────────────────
  const [expForm, setExpForm] = useState({ vendor: '', description: '', glCode: '6100', amount: '', accountId: 'BA001', date: TODAY });
  const setEF = (k, v) => setExpForm(prev => ({ ...prev, [k]: v }));

  // ── payment form state ────────────────────────────────────────────────────────
  const [payForm, setPayForm] = useState({ amount: '', date: TODAY, notes: '' });

  // ── bank account form state ───────────────────────────────────────────────────
  const [bankForm, setBankForm] = useState({ name: '', bank: '', number: '', routing: '', type: 'Checking', balance: '' });
  const setBF = (k, v) => setBankForm(prev => ({ ...prev, [k]: v }));

  // ── reconcile form ───────────────────────────────────────────────────────────
  const [recForm, setRecForm] = useState({ accountId: 'BA001', period: '', openingBalance: '', closingDate: '', closingBalance: '' });
  const setRF = (k, v) => setRecForm(prev => ({ ...prev, [k]: v }));

  // ── toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── derived values ────────────────────────────────────────────────────────────
  const totalCash    = useMemo(() => bankAccounts.reduce((s, a) => s + a.balance, 0), [bankAccounts]);
  const totalAR      = useMemo(() => invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (i.amount - i.paid), 0), [invoices]);
  const totalAP      = useMemo(() => vendors.reduce((s, v) => s + v.balance, 0), [vendors]);
  const overdueInv   = useMemo(() => invoices.filter(i => i.status === 'Overdue'), [invoices]);

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.toLowerCase();
    return vendors.filter(v => v.name.toLowerCase().includes(q) || v.contact.toLowerCase().includes(q));
  }, [vendors, vendorSearch]);

  const filteredInvoices = useMemo(() => {
    return invoiceFilter === 'All' ? invoices : invoices.filter(i => i.status === invoiceFilter);
  }, [invoices, invoiceFilter]);

  const filteredChecks = useMemo(() => {
    const q = checkSearch.toLowerCase();
    return checks.filter(c => c.payee.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.memo.toLowerCase().includes(q));
  }, [checks, checkSearch]);

  const allTransactions = useMemo(() => {
    const txns = [
      ...checks.filter(c => c.status !== 'Void').map(c => ({ id: c.id, date: c.date, description: `Check #${c.num} – ${c.payee}`, type: 'debit', amount: c.amount, account: bankAccounts.find(a => a.id === c.accountId)?.name ?? c.accountId, glCode: c.glCode })),
      ...expenses.map(e => ({ id: e.id, date: e.date, description: e.description, type: 'debit', amount: e.amount, account: bankAccounts.find(a => a.id === e.accountId)?.name ?? e.accountId, glCode: e.glCode })),
      ...invoices.filter(i => i.paid > 0).map(i => ({ id: i.id + '-pmt', date: i.date, description: `Payment – ${i.customer}`, type: 'credit', amount: i.paid, account: 'BA001', glCode: '4000' })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    if (!ledgerSearch) return txns;
    const q = ledgerSearch.toLowerCase();
    return txns.filter(t => t.description.toLowerCase().includes(q) || t.glCode.includes(q));
  }, [checks, expenses, invoices, bankAccounts, ledgerSearch]);

  // ── AP Aging ─────────────────────────────────────────────────────────────────
  const apAging = useMemo(() => {
    const buckets = { current: 0, d30: 0, d60: 0, d90: 0 };
    vendors.forEach((v, idx) => {
      // Deterministic "days outstanding" derived from vendor id — stable across renders
      const seed = v.id.split('').reduce((s, c) => s + c.charCodeAt(0), idx);
      const age = (seed * 17) % 91; // 0..90
      if (age <= 30)      buckets.current += v.balance;
      else if (age <= 60) buckets.d30     += v.balance;
      else if (age <= 90) buckets.d60     += v.balance;
      else                buckets.d90     += v.balance;
    });
    return buckets;
  }, [vendors]);

  // ── active reconciliation ─────────────────────────────────────────────────────
  const currentRec = useMemo(() => reconciliations.find(r => r.id === activeReconcile), [reconciliations, activeReconcile]);

  // ── HANDLERS ─────────────────────────────────────────────────────────────────

  const handleSaveVendor = useCallback((e) => {
    e.preventDefault();
    const form = vendorForm;
    if (form.id) {
      setVendors(prev => prev.map(v => v.id === form.id ? { ...v, ...form, balance: parseFloat(form.balance) || v.balance } : v));
      showToast('Vendor updated');
    } else {
      const newV = { ...form, id: `V${String(Date.now()).slice(-4)}`, balance: parseFloat(form.balance) || 0 };
      setVendors(prev => [...prev, newV]);
      showToast('Vendor created');
    }
    closeModal();
  }, [vendorForm, closeModal, showToast]);

  const handleDeleteVendor = useCallback((id) => {
    if (!canWrite) { showToast('Only accountants or admins can delete vendors', 'error'); return; }
    setVendors(prev => prev.filter(v => v.id !== id));
    showToast('Vendor removed', 'warning');
  }, [canWrite, showToast]);

  const handleWriteCheck = useCallback((e) => {
    e.preventDefault();
    if (!canWrite) { showToast('Only accountants or admins can write checks', 'error'); return; }
    const form = checkForm;
    const amt  = parseFloat(form.amount);
    if (!form.payee || !amt) return;
    const maxNum = checks.reduce((m, c) => Math.max(m, c.num), 1046);
    const nextNum = maxNum + 1;
    const acctId  = form.accountId;
    const newCheck = {
      id: `CHK-${nextNum}`, num: nextNum,
      date: form.date, payee: form.payee,
      amount: amt, memo: form.memo,
      accountId: acctId, glCode: form.glCode,
      status: 'Outstanding',
    };
    setChecks(prev => [newCheck, ...prev]);
    setBankAccounts(prev => prev.map(a => a.id === acctId ? { ...a, balance: a.balance - amt } : a));
    showToast(`Check #${nextNum} written for ${fmt(amt)}`);
    closeModal();

    if (!DEMO_MODE) {
      api.accounting.checks.create({
        check_number: nextNum,
        check_date:   form.date,
        payee:        form.payee,
        amount:       amt,
        memo:         form.memo  || null,
        account_id:   acctId     || null,
        gl_code:      form.glCode || null,
      }).then(r => {
        const row = r?.data || r;
        if (row?.id) setChecks(prev => prev.map(c => c.id === newCheck.id ? { ...mapApiCheck(row), id: newCheck.id, num: nextNum } : c));
        // Re-fetch bank balance to stay in sync
        api.accounting.bankAccounts.list()
          .then(res => { const rows = res?.data || res; if (Array.isArray(rows) && rows.length) setBankAccounts(rows.map(mapApiBankAccount)); })
          .catch(() => {});
      }).catch(() => {});
    }
  }, [checkForm, checks, closeModal, showToast]);

  const handleVoidCheck = useCallback((checkId) => {
    if (!canWrite) { showToast('Only accountants or admins can void checks', 'error'); return; }
    const chk = checks.find(c => c.id === checkId);
    if (!chk) return;
    setChecks(prev => prev.map(c => c.id === checkId ? { ...c, status: 'Void' } : c));
    setBankAccounts(prev => prev.map(a => a.id === chk.accountId && chk.status !== 'Void' ? { ...a, balance: a.balance + chk.amount } : a));
    logAudit({
      moduleId: 'accounting',
      action: 'check.voided',
      entityType: 'check',
      entityId: chk.id,
      summary: `Check #${chk.num} voided — ${fmt(chk.amount)} to ${chk.payee}`,
      before: { status: chk.status, amount: chk.amount },
      after:  { status: 'Void' },
      severity: 'warning',
    });
    showToast(`Check #${chk.num} voided`, 'warning');

    if (!DEMO_MODE && chk._id) {
      api.accounting.checks.updateStatus(chk._id, 'Void')
        .then(() => {
          api.accounting.bankAccounts.list()
            .then(res => { const rows = res?.data || res; if (Array.isArray(rows) && rows.length) setBankAccounts(rows.map(mapApiBankAccount)); })
            .catch(() => {});
        })
        .catch(() => {});
    }
  }, [checks, showToast, logAudit]);

  const handleCreateInvoice = useCallback((e) => {
    e.preventDefault();
    if (!canWrite) { showToast('Only accountants or admins can create invoices', 'error'); return; }
    const form = invForm;
    const amt  = parseFloat(form.amount);
    if (!form.customer || !amt) return;
    const newInv = {
      id: `INV-${String(Date.now()).slice(-3)}`, date: TODAY,
      dueDate: form.dueDate || '', customer: form.customer,
      amount: amt, paid: 0, status: 'Open',
      source: form.source, glCode: form.glCode, notes: form.notes,
    };
    setInvoices(prev => [newInv, ...prev]);
    showToast(`Invoice ${newInv.id} created`);
    closeModal();
  }, [invForm, closeModal, showToast]);

  // ── Build a full invoice from the line-item builder ─────────────────────────
  const handleCreateInvoiceFromBuilder = useCallback((e, opts = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!canWrite) { showToast('Only accountants or admins can create invoices', 'error'); return; }
    const b = invBuilder;
    const cust = BILLING_CUSTOMERS.find(c => c.id === b.customerId);
    const items = buildInvoiceLineItems(b.items);
    if (!cust || items.length === 0) {
      showToast('Pick a customer and add at least one line item', 'warning');
      return;
    }
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const tax = Math.round(subtotal * (Number(b.taxRate) || 0)) / 100;
    const freight = Number(b.freight) || 0;
    const total = subtotal + tax + freight;
    // Auto due date if blank: invoice date + terms days
    let dueDate = b.dueDate;
    if (!dueDate) {
      const m = /(\d+)/.exec(b.terms || '');
      const days = m ? parseInt(m[1], 10) : 30;
      const d = new Date(b.date);
      d.setDate(d.getDate() + days);
      dueDate = d.toISOString().slice(0, 10);
    }
    const newInv = {
      id: `INV-${String(Date.now()).slice(-4)}`,
      date: b.date, dueDate,
      customerId: cust.id, customer: cust.name,
      billTo: { address: cust.address, city: cust.city, contact: cust.contact, email: cust.email },
      terms: b.terms, source: b.source, glCode: b.glCode, notes: b.notes,
      items, subtotal, taxRate: Number(b.taxRate) || 0, tax, freight, amount: total,
      paid: 0, status: 'Open',
    };
    setInvoices(prev => [newInv, ...prev]);
    logAudit({
      moduleId: 'accounting',
      action: 'invoice.create',
      entityType: 'invoice',
      entityId: newInv.id,
      summary: `Created invoice ${newInv.id} for ${newInv.customer} (${fmt(total)})`,
      before: null,
      after:  { amount: total, customer: newInv.customer, lines: items.length },
      severity: total > 10000 ? 'warning' : 'info',
    });
    showToast(`Invoice ${newInv.id} created — ${fmt(total)}`);
    resetInvBuilder();
    if (opts.preview) {
      setModal({ type: 'viewInvoice', invoice: newInv });
    } else {
      closeModal();
    }

    // ── Live API: persist invoice + line items ────────────────────────────────
    if (!DEMO_MODE) {
      api.accounting.invoices.create({
        invoice_number:  newInv.id,
        customer_id:     cust._id || null,
        customer_name:   cust.name,
        source:          b.source || 'Manual',
        payment_terms:   b.terms  || 'Net 30',
        gl_code:         b.glCode || '4000',
        issue_date:      b.date,
        due_date:        dueDate,
        tax_rate:        Number(b.taxRate) || 0,
        freight:         Number(b.freight) || 0,
        bill_to_name:    cust.contact || '',
        bill_to_address: cust.address || '',
        bill_to_city:    cust.city    || '',
        bill_to_email:   cust.email   || '',
        notes:           b.notes || '',
        items: items.map(it => ({
          sku:        it.sku,
          description:it.description,
          uom:        it.uom,
          quantity:   it.qty,
          unit_price: it.unitPrice,
          line_total: it.total,
          is_catch_weight:  it.isCatchWeight  || false,
          price_per_lb:     it.pricePerLb     || null,
          cases_ordered:    it.casesOrdered   || null,
          actual_weight:    it.actualWeight   || null,
          estimated_weight: it.estimatedWeight|| null,
        })),
      }).then(created => {
        // UUID swap: replace the temp local id with the backend id
        setInvoices(prev => prev.map(i => i.id === newInv.id ? { ...i, _id: created.id } : i));
        // ── Auto-post GL journal entry: DR 1100 AR / CR 4000 Revenue ────────────
        api.gl.entries.create({
          entry_date:       b.date,
          description:      `AR — Invoice ${newInv.id} · ${cust.name}`,
          source:           'ar_invoice',
          reference_id:     created.id,
          reference_number: newInv.id,
          status:           'Posted',
          lines: [
            { account_code: '1100', account_name: 'Accounts Receivable', debit: total,  credit: 0,     description: `Invoice ${newInv.id}` },
            { account_code: b.glCode || '4000', account_name: glAccounts.find(g=>g.code===(b.glCode||'4000'))?.name || 'Sales Revenue', debit: 0, credit: total, description: `Invoice ${newInv.id}` },
          ],
        }).catch(() => {}); // GL post is best-effort — local state is source of truth
      }).catch(err => showApiToast(`Invoice saved locally — sync failed: ${err.message}`));
    }
  }, [invBuilder, closeModal, showToast, logAudit, glAccounts]);

  const handleRecordPayment = useCallback((e) => {
    e.preventDefault();
    if (!canApprove) { showToast('Only accountants, managers, or admins can record payments', 'error'); return; }
    const inv = modal.invoice;
    if (!inv) return;
    const pmt  = parseFloat(payForm.amount);
    if (!pmt) return;
    setInvoices(prev => prev.map(i => {
      if (i.id !== inv.id) return i;
      const newPaid   = Math.min(i.paid + pmt, i.amount);
      const newStatus = newPaid >= i.amount ? 'Paid' : 'Partial';
      return { ...i, paid: newPaid, status: newStatus };
    }));
    setBankAccounts(prev => prev.map(a => a.id === 'BA001' ? { ...a, balance: a.balance + pmt } : a));
    logAudit({
      moduleId: 'accounting',
      action: 'payment.record',
      entityType: 'payment',
      entityId: inv.id,
      summary: `Recorded payment ${fmt(pmt)} against ${inv.id} (${inv.customer})`,
      before: { paid: inv.paid, status: inv.status },
      after:  { paid: Math.min(inv.paid + pmt, inv.amount), status: inv.paid + pmt >= inv.amount ? 'Paid' : 'Partial' },
      severity: 'info',
    });
    showToast(`Payment of ${fmt(pmt)} recorded`);
    closeModal();

    // ── Live API: record payment ──────────────────────────────────────────────
    if (!DEMO_MODE && inv._id) {
      api.accounting.invoices.recordPayment(inv._id, pmt)
        .catch(err => showApiToast(`Payment saved locally — sync failed: ${err.message}`));
    }
  }, [modal.invoice, payForm.amount, closeModal, showToast, logAudit]);

  const handleCreateExpense = useCallback((e) => {
    e.preventDefault();
    const form = expForm;
    const amt  = parseFloat(form.amount);
    if (!form.vendor || !amt) return;
    const optimistic = { id: `EXP-${String(Date.now()).slice(-4)}`, ...form, amount: amt };
    setExpenses(prev => [optimistic, ...prev]);
    setBankAccounts(prev => prev.map(a => a.id === form.accountId ? { ...a, balance: a.balance - amt } : a));
    showToast(`Expense of ${fmt(amt)} recorded`);
    closeModal();

    if (!DEMO_MODE) {
      api.accounting.expenses.create({
        expense_date: form.date,
        description:  form.description,
        amount:       amt,
        account_id:   form.accountId || null,
        vendor:       form.vendor    || null,
        category:     form.category  || null,
        gl_code:      form.glCode    || null,
      }).then(r => {
        const row = r?.data || r;
        if (row?.id) setExpenses(prev => prev.map(x => x.id === optimistic.id ? mapApiExpense(row) : x));
        api.accounting.bankAccounts.list()
          .then(res => { const rows = res?.data || res; if (Array.isArray(rows) && rows.length) setBankAccounts(rows.map(mapApiBankAccount)); })
          .catch(() => {});
      }).catch(() => {});
    }
  }, [expForm, closeModal, showToast]);

  const handleAddBankAccount = useCallback((e) => {
    e.preventDefault();
    const form = bankForm;
    const bal  = parseFloat(form.balance) || 0;
    const optimistic = { ...form, id: `BA${String(Date.now()).slice(-4)}`, balance: bal };
    setBankAccounts(prev => [...prev, optimistic]);
    showToast('Bank account added');
    closeModal();

    if (!DEMO_MODE) {
      api.accounting.bankAccounts.create({
        name:         form.name,
        number:       form.number   || null,
        balance:      bal,
        bank:         form.bank     || null,
        routing:      form.routing  || null,
        type:         form.type     || 'Checking',
        credit_limit: form.creditLimit != null ? Number(form.creditLimit) : null,
      }).then(r => {
        const row = r?.data || r;
        if (row?.id) setBankAccounts(prev => prev.map(a => a.id === optimistic.id ? mapApiBankAccount(row) : a));
      }).catch(() => {});
    }
  }, [bankForm, closeModal, showToast]);

  const handleStartReconcile = useCallback((e) => {
    e.preventDefault();
    const form = recForm;
    // Build line items from checks + expenses for that account
    const items = [
      ...checks.filter(c => c.accountId === form.accountId && c.status !== 'Void').map(c => ({
        id: c.id, date: c.date, description: `Check #${c.num} – ${c.payee}`, type: 'debit', amount: c.amount, cleared: false,
      })),
      ...expenses.filter(x => x.accountId === form.accountId).map(x => ({
        id: x.id, date: x.date, description: x.description, type: 'debit', amount: x.amount, cleared: false,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    const newRec = {
      id: `REC-${Date.now()}`, accountId: form.accountId, period: form.period,
      openingBalance: parseFloat(form.openingBalance) || 0,
      closingDate: form.closingDate, closingBalance: parseFloat(form.closingBalance) || 0,
      status: 'In Progress', items,
    };
    setReconciliations(prev => [newRec, ...prev]);
    setActiveReconcile(newRec.id);
    showToast('Reconciliation started');
    closeModal();
  }, [recForm, checks, expenses, closeModal, showToast]);

  const toggleRecLineItem = useCallback((recId, itemId) => {
    setReconciliations(prev => prev.map(r => {
      if (r.id !== recId) return r;
      return { ...r, items: r.items.map(it => it.id === itemId ? { ...it, cleared: !it.cleared } : it) };
    }));
  }, []);

  const handleCompleteReconciliation = useCallback((recId) => {
    setReconciliations(prev => prev.map(r => r.id === recId ? { ...r, status: 'Completed' } : r));
    showToast('Reconciliation completed');
  }, [showToast]);

  const handleImportStatement = useCallback((recId) => {
    setReconciliations(prev => prev.map(r => {
      if (r.id !== recId) return r;
      const unclearedCount = r.items.filter(i => !i.cleared).length;
      return { ...r, items: r.items.map(it => ({ ...it, cleared: true })) };
    }));
    const rec = reconciliations.find(r => r.id === recId);
    const n = rec ? rec.items.filter(i => !i.cleared).length : 0;
    showToast(`Statement imported — ${n} item${n !== 1 ? 's' : ''} matched`);
  }, [reconciliations, showToast]);

  // ── PRINT CHECK ────────────────────────────────────────────────────────────────
  const handlePrintCheck = useCallback(() => {
    const chk = modal.check;
    if (!chk) return;
    const ba  = bankAccounts.find(a => a.id === chk.accountId);
    const words = numberToWords(chk.amount);
    const printWin = window.open('', '_blank', 'width=800,height=400');
    printWin.document.write(`<!DOCTYPE html><html><head><title>Check #${chk.num}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; }
  .check-page { width: 7.5in; margin: 0 auto; }
  .stub { height: 1.1in; border: 1px solid #ccc; padding: 10px 16px; margin-bottom: 4px; font-size: 10px; display: flex; justify-content: space-between; align-items: flex-start; background: #fafafa; }
  .check { height: 2.5in; border: 2px solid #333; padding: 14px 20px; position: relative; box-sizing: border-box; }
  .check-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
  .company-name { font-weight: bold; font-size: 14px; }
  .company-addr { font-size: 9px; color: #555; line-height: 1.4; }
  .check-num { font-size: 13px; font-weight: bold; text-align: right; }
  .check-date { font-size: 11px; margin-top: 4px; }
  .payto-row { display: flex; align-items: center; gap: 10px; margin: 8px 0; border-bottom: 1px solid #333; padding-bottom: 4px; }
  .payto-label { font-size: 9px; font-weight: bold; white-space: nowrap; }
  .payto-name { font-size: 12px; font-weight: bold; flex: 1; }
  .amount-box { border: 2px solid #333; padding: 4px 10px; font-size: 14px; font-weight: bold; white-space: nowrap; }
  .words-row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
  .words-label { font-size: 9px; font-weight: bold; white-space: nowrap; }
  .words-line { flex: 1; border-bottom: 1px solid #333; font-size: 11px; padding-bottom: 2px; }
  .dollars-label { font-size: 9px; font-weight: bold; }
  .check-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
  .bank-info { font-size: 9px; color: #555; line-height: 1.5; }
  .sig-area { text-align: right; }
  .sig-line { border-top: 1px solid #333; width: 2.2in; margin-bottom: 4px; }
  .sig-label { font-size: 8px; color: #555; }
  .memo-label { font-size: 8px; color: #555; margin-top: 6px; }
  .micr { font-family: monospace; font-size: 13px; letter-spacing: 2px; margin-top: 8px; color: #222; border-top: 1px solid #ccc; padding-top: 4px; }
  @media print { .no-print { display: none; } body { padding: 0; } }
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:16px;">
  <button onclick="window.print()" style="padding:8px 20px;background:#f59e0b;border:none;font-weight:bold;cursor:pointer;border-radius:6px;">🖨 Print Check</button>
</div>
<div class="check-page">
  <!-- Stub Top -->
  <div class="stub">
    <div>
      <div style="font-weight:bold;font-size:11px;">${COMPANY_INFO.name}</div>
      <div style="font-size:9px;color:#555;">Check #${chk.num} &nbsp;|&nbsp; ${chk.date} &nbsp;|&nbsp; ${ba?.name ?? 'Account'}</div>
      <div style="font-size:9px;color:#555;margin-top:4px;">Payee: ${chk.payee}</div>
      <div style="font-size:9px;color:#555;">Memo: ${chk.memo}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:13px;font-weight:bold;">Amount</div>
      <div style="font-size:18px;font-weight:bold;">${chk.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
    </div>
  </div>
  <!-- The Check -->
  <div class="check">
    <div class="check-header">
      <div>
        <div class="company-name">${COMPANY_INFO.name}</div>
        <div class="company-addr">${COMPANY_INFO.address}, ${COMPANY_INFO.city}<br>${COMPANY_INFO.phone}</div>
      </div>
      <div>
        <div class="check-num">No. ${String(chk.num).padStart(4, '0')}</div>
        <div class="check-date">Date: ${chk.date}</div>
      </div>
    </div>
    <div class="payto-row">
      <span class="payto-label">PAY TO THE ORDER OF</span>
      <span class="payto-name">${chk.payee}</span>
      <span class="amount-box">$ ${chk.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
    <div class="words-row">
      <span class="words-label"></span>
      <span class="words-line">${words} .......................................................................</span>
      <span class="dollars-label">DOLLARS</span>
    </div>
    <div class="check-footer">
      <div class="bank-info">
        <strong>${ba?.bank ?? 'First National Bank'}</strong><br>
        Chicago Branch &nbsp;|&nbsp; Chicago, IL
      </div>
      <div class="sig-area">
        <div class="sig-line"></div>
        <div class="sig-label">AUTHORIZED SIGNATURE</div>
        <div class="memo-label">FOR: ${chk.memo}</div>
      </div>
    </div>
    <div class="micr">⑆${ba?.routing ?? '071000013'}⑆&nbsp;${ba?.number ?? '****4521'}&nbsp;&nbsp;⑈${String(chk.num).padStart(6, '0')}⑈</div>
  </div>
  <!-- Stub Bottom -->
  <div class="stub" style="margin-top:4px;">
    <div>
      <div style="font-weight:bold;font-size:11px;">${chk.payee} – Remittance Copy</div>
      <div style="font-size:9px;color:#555;">Check #${chk.num} &nbsp;|&nbsp; ${chk.date}</div>
      <div style="font-size:9px;color:#555;margin-top:4px;">Memo: ${chk.memo}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:9px;font-weight:bold;">Amount Enclosed</div>
      <div style="font-size:16px;font-weight:bold;">${chk.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
    </div>
  </div>
</div>
</body></html>`);
    printWin.document.close();
  }, [modal.check, bankAccounts]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: PAYMENT PROCESSING
  // ─────────────────────────────────────────────────────────────────────────────
  const renderPayments = () => {
    const fmt$ = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

    // ── KPI Calculations ──────────────────────────────────────────────────────
    const settled    = paymentTxns.filter(t => t.status === 'Settled');
    const processing = paymentTxns.filter(t => t.status === 'Processing');
    const pending    = paymentTxns.filter(t => t.status === 'Pending');
    const failed     = paymentTxns.filter(t => t.status === 'Failed');
    const collectedMTD = settled.reduce((s, t) => s + t.amount, 0);
    const processingAmt = processing.reduce((s, t) => s + t.amount, 0);
    const pendingAmt  = pending.reduce((s, t) => s + t.amount, 0);
    const failedAmt   = failed.reduce((s, t) => s + t.amount, 0);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const statusChip = (st) => {
      const map = {
        Settled:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
        Processing: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25',
        Pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/25',
        Failed:     'bg-rose-500/15 text-rose-400 border border-rose-500/25',
      };
      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[st] || 'bg-gray-700 text-gray-300'}`}>{st}</span>;
    };

    const methodIcon = (type) => type === 'ach'
      ? <Banknote className="w-3.5 h-3.5 text-cyan-400" />
      : <CreditCard className="w-3.5 h-3.5 text-violet-400" />;

    const handleRetry = (txnId) => {
      setPaymentTxns(prev => prev.map(t => t.id === txnId
        ? { ...t, status: 'Pending', failReason: null, processorRef: null, initiatedAt: TODAY, note: 'Retried' }
        : t));
      showToast('Payment queued for retry — will process in next ACH batch.', 'info');
    };

    const handleApply = (txnId) => {
      setPaymentTxns(prev => prev.map(t => t.id === txnId
        ? { ...t, appliedTo: `MANUAL-${t.id}` }
        : t));
      showToast('Payment marked as applied to AR.', 'success');
    };

    const handleSendLink = (inv) => {
      const cust = BILLING_CUSTOMERS.find(c => c.id === inv.customerId);
      const email = cust?.email || 'customer@email.com';
      showToast(`Pay link sent to ${email} → https://pay.kernal.io/inv/${inv.id}`, 'success');
    };

    const handleAddMethod = () => {
      const f = addMethodForm;
      const cust = BILLING_CUSTOMERS.find(c => c.id === f.custId);
      if (!cust) return;
      const newMethod = f.type === 'ach'
        ? { id: `PM-${Date.now()}`, customerId: f.custId, customerName: cust.name, type: 'ach', label: `Checking ****${f.accountNum.slice(-4)}`, bank: f.bank, routing: f.routing, last4: f.accountNum.slice(-4), verified: false, isDefault: false, addedAt: TODAY }
        : { id: `PM-${Date.now()}`, customerId: f.custId, customerName: cust.name, type: 'card', label: `${f.cardBrand} ****${f.cardLast4}`, brand: f.cardBrand, last4: f.cardLast4, expiry: f.cardExpiry, verified: false, isDefault: false, addedAt: TODAY };
      setPaymentMethods(prev => [...prev, newMethod]);
      setAddMethodModal(false);
      showToast(`Payment method added for ${cust.name} — pending micro-deposit verification.`, 'success');
    };

    const handlePortalPay = () => {
      if (!portalSelInvs.length || !portalMethodId) return;
      setPortalProcessing('animating');
      const method = paymentMethods.find(m => m.id === portalMethodId);
      const total = PORTAL_OPEN_INVOICES.filter(i => portalSelInvs.includes(i.id)).reduce((s, i) => s + i.amount, 0);
      const delay = method?.type === 'card' ? 1800 : 2800;
      setTimeout(() => {
        const newTxn = {
          id: `PAY-${String(Date.now()).slice(-4)}`,
          customerId: portalCustId,
          customerName: BILLING_CUSTOMERS.find(c => c.id === portalCustId)?.name || portalCustId,
          methodId: portalMethodId,
          methodLabel: method?.label || 'Unknown Method',
          methodType: method?.type || 'ach',
          amount: total,
          status: method?.type === 'card' ? 'Settled' : 'Processing',
          appliedTo: portalSelInvs.join(', '),
          settledAt: method?.type === 'card' ? TODAY : null,
          initiatedAt: TODAY,
          processorRef: method?.type === 'card' ? `CARD-${TODAY.replace(/-/g,'')}-${method.last4}` : null,
          note: `Portal payment: ${portalSelInvs.join(', ')}`,
          failReason: null,
        };
        setPaymentTxns(prev => [newTxn, ...prev]);
        setPortalProcessing('done');
        setPortalSelInvs([]);
      }, delay);
    };

    // ── Filtered transactions ─────────────────────────────────────────────────
    const filteredTxns = paymentTxns.filter(t => {
      if (payTxnFilter !== 'All' && t.status !== payTxnFilter) return false;
      if (payTxnSearch && !`${t.customerName} ${t.id} ${t.methodLabel}`.toLowerCase().includes(payTxnSearch.toLowerCase())) return false;
      return true;
    });

    // ── Portal invoices for selected customer ─────────────────────────────────
    const portalInvoices = PORTAL_OPEN_INVOICES.filter(i => i.customerId === portalCustId);
    const portalMethods  = paymentMethods.filter(m => m.customerId === portalCustId && m.verified);
    const portalTotal    = portalInvoices.filter(i => portalSelInvs.includes(i.id)).reduce((s, i) => s + i.amount, 0);
    const custWithMethods = [...new Set(paymentMethods.map(m => m.customerId))];

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2"><Wallet className="w-5 h-5 text-violet-400" /> Payment Processing</h2>
            <p className="text-sm text-gray-500 mt-0.5">ACH, card-on-file, pay portal, and automatic cash application</p>
          </div>
          <button onClick={() => setAddMethodModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Add Payment Method
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Collected MTD', value: fmt$(collectedMTD), count: `${settled.length} payments`, color: 'emerald', Icon: CheckCircle2 },
            { label: 'Processing',    value: fmt$(processingAmt), count: `${processing.length} in transit`, color: 'cyan',    Icon: RefreshCw },
            { label: 'Pending',       value: fmt$(pendingAmt),    count: `${pending.length} queued`,     color: 'amber',   Icon: Clock },
            { label: 'Failed',        value: fmt$(failedAmt),     count: `${failed.length} need retry`,  color: 'rose',    Icon: XCircle },
          ].map(({ label, value, count, color, Icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 text-${color}-400`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </div>
              <div className="text-xl font-bold text-gray-100">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{count}</div>
            </div>
          ))}
        </div>

        {/* Sub-tab nav */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {[
            { id: 'transactions', label: 'Transactions', Icon: Receipt },
            { id: 'methods',      label: 'Payment Methods', Icon: CreditCard },
            { id: 'portal',       label: 'Pay Portal', Icon: CircleDollarSign },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setPaySubTab(id); if (id === 'portal') { setPortalProcessing(null); setPortalSelInvs([]); } }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${paySubTab === id ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20 font-bold' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── TRANSACTIONS tab ── */}
        {paySubTab === 'transactions' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={payTxnSearch} onChange={e => setPayTxnSearch(e.target.value)} placeholder="Search customer, ID, method…" className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none" />
              </div>
              <div className="flex gap-1">
                {['All', 'Settled', 'Processing', 'Pending', 'Failed'].map(f => (
                  <button key={f} onClick={() => setPayTxnFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${payTxnFilter === f ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25' : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent'}`}>{f}</button>
                ))}
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                    {['Transaction', 'Customer', 'Method', 'Amount', 'Status', 'Applied To', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.map(t => (
                    <tr key={t.id} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.id}</td>
                      <td className="px-4 py-3 text-gray-200 font-medium">{t.customerName}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-gray-300">{methodIcon(t.methodType)}{t.methodLabel}</span>
                        {t.processorRef && <span className="block font-mono text-xs text-gray-600 mt-0.5">{t.processorRef}</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-100">{fmt$(t.amount)}</td>
                      <td className="px-4 py-3">
                        {statusChip(t.status)}
                        {t.failReason && <div className="text-xs text-rose-400 mt-1">{t.failReason}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.appliedTo || <span className="text-gray-600">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{t.settledAt || t.initiatedAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {t.status === 'Failed' && (
                            <button onClick={() => handleRetry(t.id)} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                          )}
                          {t.status === 'Settled' && !t.appliedTo && (
                            <button onClick={() => handleApply(t.id)} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Apply
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTxns.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500 text-sm">No transactions match the current filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAYMENT METHODS tab ── */}
        {paySubTab === 'methods' && (
          <div className="space-y-4">
            {BILLING_CUSTOMERS.filter(c => custWithMethods.includes(c.id)).map(cust => {
              const methods = paymentMethods.filter(m => m.customerId === cust.id);
              return (
                <div key={cust.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-gray-100">{cust.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{cust.email} · {cust.terms}</div>
                    </div>
                    <span className="text-xs text-gray-500">{methods.length} method{methods.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {methods.map(m => (
                      <div key={m.id} className={`relative flex items-start gap-3 p-3.5 rounded-xl border ${m.isDefault ? 'border-violet-500/30 bg-violet-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${m.type === 'ach' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-violet-500/10 text-violet-400'}`}>
                          {m.type === 'ach' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-200 text-sm">{m.label}</div>
                          {m.type === 'ach'
                            ? <div className="text-xs text-gray-500 mt-0.5">{m.bank} · Routing {m.routing}</div>
                            : <div className="text-xs text-gray-500 mt-0.5">Expires {m.expiry}</div>
                          }
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${m.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {m.verified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {m.verified ? 'Verified' : 'Pending Verification'}
                            </span>
                            {m.isDefault && <span className="text-xs text-violet-400 font-semibold">Default</span>}
                          </div>
                        </div>
                        <button onClick={() => setPaymentMethods(prev => prev.filter(pm => pm.id !== m.id))} className="text-gray-600 hover:text-rose-400 transition-colors mt-0.5">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => { setAddMethodForm(f => ({ ...f, custId: cust.id })); setAddMethodModal(true); }}
                      className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors text-sm">
                      <Plus className="w-4 h-4" /> Add Method
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PAY PORTAL tab ── */}
        {paySubTab === 'portal' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Customer + invoice selector */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" /> Customer</div>
                <select value={portalCustId} onChange={e => { setPortalCustId(e.target.value); setPortalSelInvs([]); setPortalMethodId(''); setPortalProcessing(null); }}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none">
                  {BILLING_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                </select>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300 flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> Open Invoices</span>
                  {portalInvoices.length > 0 && (
                    <button onClick={() => setPortalSelInvs(portalSelInvs.length === portalInvoices.length ? [] : portalInvoices.map(i => i.id))}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      {portalSelInvs.length === portalInvoices.length ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>
                {portalInvoices.length === 0
                  ? <div className="px-5 py-10 text-center text-gray-500 text-sm">No open invoices for this customer.</div>
                  : portalInvoices.map(inv => {
                    const sel = portalSelInvs.includes(inv.id);
                    const overdue = inv.daysUntilDue < 0;
                    const dueLabel = overdue
                      ? <span className="text-xs text-rose-400 font-semibold">{Math.abs(inv.daysUntilDue)}d overdue</span>
                      : inv.daysUntilDue === 0
                        ? <span className="text-xs text-amber-400 font-semibold">Due today</span>
                        : <span className="text-xs text-gray-500">Due in {inv.daysUntilDue}d</span>;
                    return (
                      <div key={inv.id} onClick={() => setPortalSelInvs(prev => sel ? prev.filter(id => id !== inv.id) : [...prev, inv.id])}
                        className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer border-b border-gray-800/60 last:border-b-0 transition-colors ${sel ? 'bg-violet-500/5' : 'hover:bg-gray-800/40'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${sel ? 'bg-violet-500 border-violet-500' : 'border-gray-600'}`}>
                          {sel && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-200 text-sm">{inv.id}</span>
                            {overdue && <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">{dueLabel} · <span className="text-xs text-gray-500">{inv.dueDate}</span></div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-100">{fmt$(inv.amount)}</div>
                          <button onClick={e => { e.stopPropagation(); handleSendLink(inv); }} className="mt-1 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                            <LinkIcon className="w-3 h-3" /> Send pay link
                          </button>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* Right: Payment summary + method + submit */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                <div className="text-sm font-semibold text-gray-300 flex items-center gap-2"><CircleDollarSign className="w-4 h-4 text-violet-400" /> Payment Summary</div>

                {portalSelInvs.length === 0
                  ? <div className="text-sm text-gray-500 py-3 text-center">Select invoices to pay</div>
                  : (
                    <div className="space-y-2">
                      {portalInvoices.filter(i => portalSelInvs.includes(i.id)).map(inv => (
                        <div key={inv.id} className="flex justify-between text-sm">
                          <span className="text-gray-400">{inv.id}</span>
                          <span className="font-semibold text-gray-200">{fmt$(inv.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-700 pt-2 flex justify-between">
                        <span className="font-bold text-gray-200">Total</span>
                        <span className="font-bold text-violet-300 text-lg">{fmt$(portalTotal)}</span>
                      </div>
                    </div>
                  )
                }

                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Payment Method</div>
                  {portalMethods.length === 0
                    ? <div className="text-sm text-amber-400 py-2">No verified methods on file — <button className="underline" onClick={() => setPaySubTab('methods')}>add one</button></div>
                    : (
                      <div className="space-y-2">
                        {portalMethods.map(m => (
                          <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${portalMethodId === m.id ? 'border-violet-500/40 bg-violet-500/8' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input type="radio" name="portalMethod" value={m.id} checked={portalMethodId === m.id} onChange={() => setPortalMethodId(m.id)} className="accent-violet-500" />
                            <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${m.type === 'ach' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-violet-500/10 text-violet-400'}`}>
                              {m.type === 'ach' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-200">{m.label}</div>
                              <div className="text-xs text-gray-500">{m.type === 'ach' ? `ACH · 2–3 business days` : 'Card · Instant'}</div>
                            </div>
                            {m.isDefault && <span className="ml-auto text-xs text-violet-400 font-semibold">Default</span>}
                          </label>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Process button or result */}
                {portalProcessing === null && (
                  <button
                    disabled={!portalSelInvs.length || !portalMethodId}
                    onClick={handlePortalPay}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500 text-white">
                    <Send className="w-4 h-4" /> Process Payment {portalSelInvs.length > 0 && portalTotal > 0 ? `· ${fmt$(portalTotal)}` : ''}
                  </button>
                )}
                {portalProcessing === 'animating' && (
                  <div className="w-full py-3 rounded-xl font-bold text-sm bg-violet-500/10 border border-violet-500/25 text-violet-300 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing…
                  </div>
                )}
                {portalProcessing === 'done' && (
                  <div className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Payment Submitted!
                  </div>
                )}
              </div>

              {/* Send pay link card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-violet-400" /> Pay Links</div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Send a one-click payment link directly to the customer's accounts-payable contact. Links expire after 30 days.</p>
                {portalInvoices.length === 0
                  ? <div className="text-xs text-gray-600">No open invoices for this customer.</div>
                  : portalInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-b-0">
                      <div>
                        <span className="text-sm font-semibold text-gray-300">{inv.id}</span>
                        <span className="ml-2 text-xs text-gray-500">{fmt$(inv.amount)}</span>
                      </div>
                      <button onClick={() => handleSendLink(inv)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 rounded-lg text-xs font-semibold transition-colors">
                        <Send className="w-3 h-3" /> Send Link
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Add Method Modal ── */}
        {addMethodModal && (
          <Overlay onClick={() => setAddMethodModal(false)}>
            <ModalBox onClick={e => e.stopPropagation()}>
              <ModalHeader title="Add Payment Method" onClose={() => setAddMethodModal(false)} />
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Customer</label>
                  <select value={addMethodForm.custId} onChange={e => setAddMethodForm(f => ({ ...f, custId: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none">
                    {BILLING_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Method Type</label>
                  <div className="flex gap-2">
                    {[{ id: 'ach', label: 'ACH Bank Account', Icon: Banknote }, { id: 'card', label: 'Credit / Debit Card', Icon: CreditCard }].map(({ id, label, Icon }) => (
                      <button key={id} onClick={() => setAddMethodForm(f => ({ ...f, type: id }))}
                        className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${addMethodForm.type === id ? 'border-violet-500/40 bg-violet-500/8 text-violet-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                        <Icon className="w-5 h-5" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                {addMethodForm.type === 'ach' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Bank Name</label>
                      <input value={addMethodForm.bank} onChange={e => setAddMethodForm(f => ({ ...f, bank: e.target.value }))} placeholder="e.g. First National Bank" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Routing Number</label>
                        <input value={addMethodForm.routing} onChange={e => setAddMethodForm(f => ({ ...f, routing: e.target.value }))} placeholder="9 digits" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Account Number</label>
                        <input value={addMethodForm.accountNum} onChange={e => setAddMethodForm(f => ({ ...f, accountNum: e.target.value }))} placeholder="Account number" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600" />
                      </div>
                    </div>
                    <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-3 text-xs text-cyan-400">
                      <strong>Micro-deposit verification:</strong> Two small deposits (usually $0.01–$0.99) will be sent within 1–2 business days. The customer confirms the amounts to activate the method.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Card Brand</label>
                        <select value={addMethodForm.cardBrand} onChange={e => setAddMethodForm(f => ({ ...f, cardBrand: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none">
                          {['Visa', 'Mastercard', 'Amex', 'Discover'].map(b => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Last 4 Digits</label>
                        <input value={addMethodForm.cardLast4} onChange={e => setAddMethodForm(f => ({ ...f, cardLast4: e.target.value.slice(0, 4) }))} placeholder="1234" maxLength={4} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Expiry (MM/YY)</label>
                      <input value={addMethodForm.cardExpiry} onChange={e => setAddMethodForm(f => ({ ...f, cardExpiry: e.target.value }))} placeholder="09/28" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm outline-none placeholder-gray-600" />
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setAddMethodModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-gray-200 text-sm font-semibold transition-colors">Cancel</button>
                  <button onClick={handleAddMethod} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">Save Method</button>
                </div>
              </div>
            </ModalBox>
          </Overlay>
        )}
      </div>
    );
  };

  // ── TABS ───────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'vendors',        label: 'Vendors & AP',   icon: Building2       },
    { id: 'customers',      label: 'Customers & AR', icon: Users           },
    { id: 'checks',         label: 'Checks',         icon: CreditCard      },
    { id: 'match',          label: 'AP Match',       icon: Layers          },
    { id: 'reconcile',      label: 'Reconciliation', icon: Landmark        },
    { id: 'closeout',       label: 'Daily Close-out', icon: DollarSign      },
    { id: 'reports',        label: 'Reports',        icon: BarChart3       },
    ...(commissionTrackingEnabled ? [{ id: 'commissions', label: 'Commissions', icon: Percent }] : []),
    { id: 'payments',       label: 'Payments',       icon: Wallet          },
  ];



  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: GENERAL LEDGER + FINANCIAL STATEMENTS
  // ─────────────────────────────────────────────────────────────────────────────
  const renderAPMatch = () => {
    // Build match rows from all POs in INIT_AP_POS
    const matchRows = INIT_AP_POS.map(po => {
      const gr   = goodsReceipts.find(g => g.poNumber === po.poNumber);
      const bill = vendorBills.find(b => b.poNumber === po.poNumber);
      // Three-way: PO ↔ GR ↔ Bill
      const result = runMatchEngine(po, gr, bill);
      return { po, gr, bill, result };
    });

    const filtered = matchRows.filter(row => {
      if (matchFilter === 'matched')   return row.result.status === 'matched';
      if (matchFilter === 'exception') return ['qty_variance','price_variance','multi_exception'].includes(row.result.status);
      if (matchFilter === 'pending')   return ['pending_receipt','pending_invoice'].includes(row.result.status);
      return true;
    });

    const kpi = {
      matched:   matchRows.filter(r => r.result.status === 'matched').length,
      exception: matchRows.filter(r => ['qty_variance','price_variance','multi_exception'].includes(r.result.status)).length,
      pending:   matchRows.filter(r => ['pending_receipt','pending_invoice'].includes(r.result.status)).length,
      approveAmt: matchRows.filter(r => r.result.status === 'matched' && r.bill)
        .reduce((s, r) => s + r.bill.lines.reduce((a, l) => a + l.qtyBilled * l.unitPrice, 0), 0),
    };

    const statusConfig = {
      matched:          { label: 'Matched',           badge: UI.badgeEmerald, dot: 'bg-emerald-400' },
      qty_variance:     { label: 'Qty Variance',      badge: UI.badgeAmber,   dot: 'bg-amber-400'   },
      price_variance:   { label: 'Price Variance',    badge: UI.badgeCyan,    dot: 'bg-cyan-400'    },
      multi_exception:  { label: 'Multi Exception',   badge: UI.badgeRose,    dot: 'bg-rose-400'    },
      pending_receipt:  { label: 'Pending Receipt',   badge: UI.badgeViolet,  dot: 'bg-violet-400'  },
      pending_invoice:  { label: 'Pending Invoice',   badge: UI.badgeZinc,    dot: 'bg-zinc-400'    },
    };

    // Detail panel for one PO
    const renderDetailPanel = (row) => {
      const { po, gr, bill, result } = row;
      const cfg = statusConfig[result.status] || statusConfig.matched;

      const allSkus = [...new Set([
        ...po.items.map(l => l.sku),
        ...(gr ? gr.lines.map(l => l.sku) : []),
        ...(bill ? bill.lines.map(l => l.sku) : []),
      ])];

      const lineStatus = (sku) => {
        const poLine   = po.items.find(l => l.sku === sku);
        const grLine   = gr   && gr.lines.find(l => l.sku === sku);
        const billLine = bill && bill.lines.find(l => l.sku === sku);
        if (!grLine || !billLine) return 'missing';
        const qtyOk  = billLine.qtyBilled === grLine.qtyReceived;
        const pricePct = Math.abs(billLine.unitPrice - (poLine?.unitCost || billLine.unitPrice)) / (poLine?.unitCost || billLine.unitPrice);
        const priceOk  = pricePct <= PRICE_TOLERANCE_PCT;
        if (qtyOk && priceOk) return 'ok';
        if (!qtyOk && !priceOk) return 'both';
        if (!qtyOk)   return 'qty';
        return 'price';
      };

      const lineIcon = (status) => {
        if (status === 'ok')      return <CheckCheck size={13} className="text-emerald-400 shrink-0" />;
        if (status === 'missing') return <XCircle    size={13} className="text-gray-500 shrink-0" />;
        return                           <AlertTriangle size={13} className="text-amber-400 shrink-0" />;
      };

      return (
        <div className="border border-gray-700 rounded-xl overflow-hidden mt-0.5">
          {/* Three columns */}
          <div className="grid grid-cols-3 divide-x divide-gray-700">
            {/* PO Column */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <FileText size={12} className="text-cyan-400" />
                </div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Purchase Order</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-gray-100">{po.poNumber}</p>
                <p className="text-gray-400">{po.vendorName}</p>
                <p className="text-gray-500">Ordered: {po.orderedDate}</p>
                <p className="text-gray-500">Expected: {po.deliveryDate}</p>
                <p className="font-semibold text-gray-200 mt-2 pt-2 border-t border-gray-700">Total: {fmt(po.total)}</p>
              </div>
              <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-800">
                {po.items.map((line, i) => {
                  const ls = lineStatus(line.sku);
                  return (
                    <div key={i} className="flex items-start gap-1.5">
                      {lineIcon(ls)}
                      <div className="min-w-0">
                        <p className="text-xs text-gray-300 truncate">{line.description}</p>
                        <p className="text-xs text-gray-500">{line.qty} {line.uom || 'ea'} × ${line.unitCost.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GR Column */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Package size={12} className="text-violet-400" />
                </div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wide">Goods Receipt</span>
              </div>
              {gr ? (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-gray-100">{gr.grId}</p>
                  <p className="text-gray-500">Received: {gr.receivedDate}</p>
                  <p className="text-gray-500">By: {gr.receivedBy}</p>
                  {gr.notes && <p className="text-gray-500 italic text-xs mt-1">{gr.notes}</p>}
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-800">
                    {allSkus.map((sku, i) => {
                      const grLine = gr.lines.find(l => l.sku === sku);
                      if (!grLine) return (
                        <div key={i} className="flex items-center gap-1.5">
                          <XCircle size={13} className="text-gray-600 shrink-0" />
                          <p className="text-xs text-gray-600 italic">Not on GR</p>
                        </div>
                      );
                      const ls = lineStatus(sku);
                      const diff = grLine.qtyReceived - grLine.qtyOrdered;
                      return (
                        <div key={i} className="flex items-start gap-1.5">
                          {lineIcon(ls)}
                          <div className="min-w-0">
                            <p className="text-xs text-gray-300 truncate">{grLine.description}</p>
                            <p className={`text-xs ${diff < 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                              Rcvd: {grLine.qtyReceived} {diff !== 0 && <span>({diff > 0 ? '+' : ''}{diff})</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center text-gray-600 text-xs gap-2">
                  <Package size={22} className="opacity-30" />
                  <p>No receipt recorded</p>
                </div>
              )}
            </div>

            {/* Bill Column */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Receipt size={12} className="text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Vendor Bill</span>
              </div>
              {bill ? (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-gray-100">{bill.billNumber}</p>
                  <p className="text-gray-500">Issued: {bill.billDate}</p>
                  <p className="text-gray-500">Due: {bill.dueDate}</p>
                  {bill.notes && <p className="text-gray-500 italic mt-1">{bill.notes}</p>}
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-800">
                    {allSkus.map((sku, i) => {
                      const billLine = bill.lines.find(l => l.sku === sku);
                      const poLine   = po.items.find(l => l.sku === sku);
                      if (!billLine) return (
                        <div key={i} className="flex items-center gap-1.5">
                          <XCircle size={13} className="text-gray-600 shrink-0" />
                          <p className="text-xs text-gray-600 italic">Not on bill</p>
                        </div>
                      );
                      const ls = lineStatus(sku);
                      const ext = billLine.qtyBilled * billLine.unitPrice;
                      const priceFlag = poLine && Math.abs(billLine.unitPrice - poLine.unitCost) / poLine.unitCost > PRICE_TOLERANCE_PCT;
                      return (
                        <div key={i} className="flex items-start gap-1.5">
                          {lineIcon(ls)}
                          <div className="min-w-0">
                            <p className="text-xs text-gray-300 truncate">{billLine.description}</p>
                            <p className={`text-xs ${priceFlag ? 'text-amber-400 font-semibold' : 'text-gray-500'}`}>
                              {billLine.qtyBilled} × ${billLine.unitPrice.toFixed(2)} = {fmt(ext)}
                              {priceFlag && ' ⚠'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="font-bold text-gray-200 pt-2 border-t border-gray-700 mt-2 text-xs">
                    Billed: {fmt(bill.lines.reduce((s, l) => s + l.qtyBilled * l.unitPrice, 0))}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center text-gray-600 text-xs gap-2">
                  <Receipt size={22} className="opacity-30" />
                  <p>No vendor bill received</p>
                </div>
              )}
            </div>
          </div>

          {/* Exceptions + Actions Footer */}
          <div className="border-t border-gray-700 px-4 py-3 bg-gray-900/40 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {result.exceptions.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCheck size={14} /> All lines matched within tolerance — ready for payment approval
                </div>
              ) : (
                <div className="space-y-1">
                  {result.exceptions.map((exc, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-300">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <span>{typeof exc === 'string' ? exc : `${exc.desc}: ${exc.detail}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {result.status === 'matched' && bill && (
                <button
                  onClick={() => {
                    setVendorBills(prev => prev.map(b => b.billId === bill.billId ? { ...b, status: 'Approved' } : b));
                    showToast(`${bill.billNumber} approved for payment`);
                    setMatchDetailId(null);
                    // ── Live API: update bill status + post GL entry ────────────
                    if (!DEMO_MODE) {
                      const billTotal = bill.lines
                        ? bill.lines.reduce((s, l) => s + (l.qtyBilled || l.quantity || 0) * (l.unitPrice || l.unit_cost || 0), 0)
                        : 0;
                      const expCode = po?.items?.[0]?.glCode || '5000';
                      const expName = glAccounts.find(g=>g.code===expCode)?.name || 'Cost of Goods Sold';
                      if (bill._id) {
                        api.gl.bills.updateStatus(bill._id, 'Approved').catch(() => {});
                      }
                      if (billTotal > 0) {
                        api.gl.entries.create({
                          entry_date:       new Date().toISOString().slice(0, 10),
                          description:      `AP — Bill ${bill.billNumber} · ${bill.vendorName}`,
                          source:           'ap_bill',
                          reference_number: bill.billNumber,
                          status:           'Posted',
                          lines: [
                            { account_code: expCode, account_name: expName, debit: billTotal, credit: 0, description: `Bill ${bill.billNumber}` },
                            { account_code: '2000', account_name: 'Accounts Payable', debit: 0, credit: billTotal, description: `Bill ${bill.billNumber}` },
                          ],
                        }).catch(() => {});
                      }
                    }
                  }}
                  className={UI.btnPrimary + ' text-xs px-3 py-1.5'}>
                  <CheckCheck size={13} /> Approve Payment
                </button>
              )}
              {['qty_variance','price_variance','multi_exception'].includes(result.status) && bill && (
                <>
                  <button
                    onClick={() => {
                      setVendorBills(prev => prev.map(b => b.billId === bill.billId ? { ...b, status: 'On Hold' } : b));
                      showToast(`${bill.billNumber} placed on hold`, 'warning');
                      setMatchDetailId(null);
                    }}
                    className={UI.btnSecondary + ' text-xs px-3 py-1.5'}>
                    <Clock size={13} /> Hold
                  </button>
                  <button
                    onClick={() => {
                      setVendorBills(prev => prev.map(b => b.billId === bill.billId ? { ...b, status: 'Disputed' } : b));
                      showToast(`${bill.billNumber} marked as disputed`, 'warning');
                      setMatchDetailId(null);
                    }}
                    className={UI.btnDanger + ' text-xs px-3 py-1.5'}>
                    <XCircle size={13} /> Dispute
                  </button>
                </>
              )}
              <button onClick={() => setMatchDetailId(null)} className="text-xs text-gray-500 hover:text-gray-300 px-2">
                Collapse
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-100 flex items-center gap-2">
              <Layers size={18} className="text-cyan-500" /> AP Three-Way Match
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Compare Purchase Order · Goods Receipt · Vendor Bill line by line</p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" /> ≤{(PRICE_TOLERANCE_PCT * 100).toFixed(0)}% price tolerance
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Auto-Matched',     value: kpi.matched,   sub: 'Ready to pay',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCheck   },
            { label: 'Exceptions',       value: kpi.exception, sub: 'Needs review',         color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: AlertTriangle },
            { label: 'Pending',          value: kpi.pending,   sub: 'Awaiting doc',         color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: Clock        },
            { label: 'Approved to Pay',  value: fmt(kpi.approveAmt), sub: 'Matched bills', color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    icon: CheckCircle2 },
          ].map(card => (
            <div key={card.label} className={`${UI.card} p-4 flex items-center gap-4 border ${card.border}`}>
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon size={18} className={card.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-600">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all',       label: `All (${matchRows.length})` },
            { id: 'matched',   label: `Matched (${kpi.matched})` },
            { id: 'exception', label: `Exceptions (${kpi.exception})` },
            { id: 'pending',   label: `Pending (${kpi.pending})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setMatchFilter(f.id)}
              className={matchFilter === f.id ? UI.tabActive + ' text-xs' : UI.tabInactive + ' text-xs'}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Match Table */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className={`${UI.card} p-10 text-center text-gray-600 text-sm`}>
              No purchase orders match this filter.
            </div>
          )}
          {filtered.map(row => {
            const { po, gr, bill, result } = row;
            const cfg  = statusConfig[result.status] || statusConfig.matched;
            const billTotal = bill ? bill.lines.reduce((s, l) => s + l.qtyBilled * l.unitPrice, 0) : null;
            const isOpen = matchDetailId === po.poNumber;

            // Per-bill status badge override
            const billStatus = bill?.status || null;
            const billStatusStyle = {
              'Approved':  UI.badgeEmerald,
              'On Hold':   UI.badgeAmber,
              'Disputed':  UI.badgeRose,
              'Pending':   UI.badgeZinc,
            }[billStatus] || UI.badgeZinc;

            return (
              <div key={po.poNumber}>
                <div
                  className={`${UI.card} px-4 py-3 flex items-center gap-4 cursor-pointer transition-colors ${isOpen ? 'ring-1 ring-cyan-500/40' : 'hover:bg-gray-800/60'}`}
                  onClick={() => setMatchDetailId(isOpen ? null : po.poNumber)}>

                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />

                  {/* PO Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-100">{po.poNumber}</span>
                      <span className="text-xs text-gray-400">{po.vendorName}</span>
                      {bill && <span className={`${billStatusStyle} text-xs`}>{bill.billNumber}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span>PO: {fmt(po.total)}</span>
                      {gr   && <span className="text-violet-400">GR: {gr.grId} ({gr.receivedDate})</span>}
                      {bill && <span className="text-emerald-400">Bill: {fmt(billTotal)} · Due {bill.dueDate}</span>}
                      {!gr  && <span className="text-gray-600 italic">No receipt</span>}
                      {!bill && <span className="text-gray-600 italic">No bill</span>}
                    </div>
                  </div>

                  {/* Match Badge */}
                  <span className={cfg.badge}>{cfg.label}</span>

                  {/* Exception count */}
                  {result.exceptions.length > 0 && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {result.exceptions.length} exception{result.exceptions.length !== 1 ? 's' : ''}
                    </span>
                  )}

                  {/* Bill workflow status */}
                  {bill && billStatus && billStatus !== 'Pending' && (
                    <span className={billStatusStyle + ' text-xs'}>{billStatus}</span>
                  )}

                  {/* Expand chevron */}
                  <ChevronRight size={15} className={`text-gray-600 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Detail */}
                {isOpen && renderDetailPanel(row)}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap pt-2 border-t border-gray-800">
          <div className="flex items-center gap-1.5"><CheckCheck size={12} className="text-emerald-400" /> Line matched</div>
          <div className="flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-400" /> Variance detected</div>
          <div className="flex items-center gap-1.5"><XCircle size={12} className="text-gray-500" /> Not present in doc</div>
          <div className="ml-auto">Tolerance: ±{(PRICE_TOLERANCE_PCT * 100).toFixed(0)}% price / exact qty</div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Cash',    value: fmt(totalCash),  sub: `${bankAccounts.length} accounts`, icon: Landmark,     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Accounts Receivable', value: fmt(totalAR), sub: `${invoices.filter(i=>i.status!=='Paid').length} open`, icon: ArrowUpRight, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { label: 'Accounts Payable',    value: fmt(totalAP), sub: `${vendors.length} vendors`,   icon: ArrowDownLeft, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
          { label: 'Net Position',  value: fmt(totalCash + totalAR - totalAP), sub: 'Cash + AR – AP', icon: TrendingUp, color: totalCash+totalAR-totalAP >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: totalCash+totalAR-totalAP >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
        ].map(kpi => (
          <div key={kpi.label} className={`${UI.cardPad} flex items-start gap-4`}>
            <div className={`p-2.5 rounded-xl ${kpi.bg}`}><kpi.icon className={`w-5 h-5 ${kpi.color}`} /></div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-black mt-0.5 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank Accounts */}
        <div className={UI.cardPad}>
          <h3 className={UI.sectionTitle}><Landmark className="w-4 h-4 text-cyan-500" /> Bank Accounts</h3>
          <div className="space-y-3">
            {bankAccounts.map(ba => (
              <div key={ba.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-200">{ba.name}</p>
                  <p className="text-xs text-gray-500">{ba.bank} · {ba.number}</p>
                </div>
                <p className="text-sm font-bold text-emerald-400">{fmt(ba.balance)}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { setBankForm({ name:'',bank:'',number:'',routing:'',type:'Checking',balance:'' }); setModal({ type:'bank' }); }} className={`${UI.btnGhost} mt-3 w-full justify-center`}>
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>

        {/* Overdue Invoices */}
        <div className={UI.cardPad}>
          <h3 className={UI.sectionTitle}><AlertCircle className="w-4 h-4 text-rose-400" /> Overdue Invoices <span className={UI.badgeRed}>{overdueInv.length}</span></h3>
          {overdueInv.length === 0
            ? <p className="text-sm text-gray-500">No overdue invoices.</p>
            : overdueInv.map(inv => (
              <div key={inv.id} className="py-2 border-b border-gray-800 last:border-0">
                <div className="flex justify-between">
                  <p className="text-sm font-semibold text-gray-200">{inv.customer}</p>
                  <p className="text-sm font-bold text-rose-400">{fmt(inv.amount - inv.paid)}</p>
                </div>
                <p className="text-xs text-gray-500">Due {fmtDate(inv.dueDate)} · {ageDays(inv.dueDate)}d overdue</p>
              </div>
            ))
          }
        </div>

        {/* Recent Transactions */}
        <div className={UI.cardPad}>
          <h3 className={UI.sectionTitle}><Receipt className="w-4 h-4 text-cyan-500" /> Recent Transactions</h3>
          <div className="space-y-2">
            {allTransactions.slice(0, 6).map(t => (
              <div key={t.id} className="flex justify-between items-center py-1.5 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-300 leading-tight">{t.description}</p>
                  <p className="text-[10px] text-gray-600">{fmtDate(t.date)}</p>
                </div>
                <p className={`text-xs font-bold ${t.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.type === 'credit' ? '+' : '–'}{fmt(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: VENDORS & AP
  // ─────────────────────────────────────────────────────────────────────────────
  const renderVendors = () => (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Vendor list */}
      <div className={UI.card}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-200 flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-500" /> Vendors</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input value={vendorSearch} onChange={e => { const v = e.target.value; setVendorSearch(v); }} placeholder="Search vendors…" className={`${UI.input} pl-8 w-48`} />
            </div>
            <button onClick={() => { setVendorForm({ id:'',name:'',contact:'',phone:'',email:'',address:'',terms:'Net 30',balance:'' }); setModal({ type:'vendor' }); }} className={UI.btnPrimary}>
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-800"><tr>
            {['Vendor','Contact','Terms','Balance Owed','Actions'].map(h => <th key={h} className={UI.th}>{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredVendors.map(v => (
              <tr key={v.id} className="hover:bg-gray-800/30 transition-colors">
                <td className={UI.td}>
                  <p className="font-semibold text-gray-200">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.email}</p>
                </td>
                <td className={UI.td}><span className="text-gray-400">{v.contact}</span></td>
                <td className={UI.td}><span className={UI.badgeBlue}>{v.terms}</span></td>
                <td className={UI.td}><span className={v.balance > 0 ? 'text-cyan-500 font-bold' : 'text-gray-400'}>{fmt(v.balance)}</span></td>
                <td className={UI.td}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ type:'viewVendor', vendor: v })} className={UI.btnGhost} title="View vendor"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setVendorForm({ ...v, balance: String(v.balance) }); setModal({ type:'vendor' }); }} className={UI.btnGhost} title="Edit vendor"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setCheckForm(prev => ({ ...prev, payee: v.name })); setModal({ type:'check' }); }} className={UI.btnGhost} title="Write check"><Printer className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteVendor(v.id)} className={UI.btnDanger} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expenses */}
      <div className={UI.card}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-200 flex items-center gap-2"><Receipt className="w-4 h-4 text-cyan-500" /> Expenses</h3>
          <button onClick={() => { setExpForm({ vendor:'',description:'',glCode:'6100',amount:'',accountId:'BA001',date:TODAY }); setModal({ type:'expense' }); }} className={UI.btnPrimary}>
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-800"><tr>
            {['Date','Vendor','Description','GL Code','Amount','Account',''].map(h => <th key={h} className={UI.th}>{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-800/50">
            {expenses.map(ex => {
              const glName = glAccounts.find(g => g.code === ex.glCode)?.name ?? ex.glCode;
              return (
                <tr key={ex.id} className="hover:bg-gray-800/30">
                  <td className={UI.td}>{fmtDate(ex.date)}</td>
                  <td className={UI.td}>{ex.vendor}</td>
                  <td className={UI.td}><span className="text-gray-300">{ex.description}</span></td>
                  <td className={UI.td}><span className={UI.badgeGray}>{ex.glCode} – {glName}</span></td>
                  <td className={UI.td}><span className="text-rose-400 font-bold">{fmt(ex.amount)}</span></td>
                  <td className={UI.td}><span className="text-gray-400 text-xs">{bankAccounts.find(a=>a.id===ex.accountId)?.name ?? ex.accountId}</span></td>
                  <td className={UI.td}>
                    <button onClick={() => setModal({ type:'viewExpense', expense: ex })} className={UI.btnGhost} title="View expense voucher">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Open Purchase Orders (from Procurement) ── */}
      <div className={UI.card}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-200 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-cyan-500" /> Open Purchase Orders
          </h3>
          <span className="text-xs text-gray-500">Match incoming vendor invoices against these POs</span>
        </div>
        {(() => {
          const openAPPOs = INIT_AP_POS.filter(p => !['Received','Cancelled'].includes(p.status));
          const statusColors = {
            'Draft':'text-gray-400 bg-gray-800 border-gray-700',
            'Approved':'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
            'Sent':'text-sky-400 bg-sky-400/10 border-sky-400/20',
            'Partially Received':'text-violet-400 bg-violet-400/10 border-violet-400/20',
            'Received':'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            'Cancelled':'text-rose-400 bg-rose-500/10 border-rose-500/20',
          };
          return (
            <table className="w-full">
              <thead className="border-b border-gray-800"><tr>
                {['PO Number','Vendor','Ordered','Req. Delivery','Status','PO Value','Balance Due',''].map(h => (
                  <th key={h} className={UI.th}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-800/50">
                {openAPPOs.map(po => {
                  const bal = po.total - po.paid;
                  return (
                    <tr key={po.poNumber} className="hover:bg-gray-800/30 transition-colors">
                      <td className={UI.td}>
                        <span className="font-mono text-xs font-bold text-cyan-500">{po.poNumber}</span>
                        {po.notes && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{po.notes}</p>}
                      </td>
                      <td className={UI.td}><span className="font-semibold text-gray-200">{po.vendorName}</span></td>
                      <td className={UI.td}><span className="text-gray-400 text-xs">{po.orderedDate}</span></td>
                      <td className={UI.td}><span className="text-gray-400 text-xs">{po.deliveryDate}</span></td>
                      <td className={UI.td}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusColors[po.status] || 'text-gray-400'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className={UI.td}><span className="font-bold text-gray-200">{fmt(po.total)}</span></td>
                      <td className={UI.td}>
                        <span className={bal > 0 ? 'font-bold text-cyan-500' : 'text-gray-500'}>
                          {bal > 0 ? fmt(bal) : '—'}
                        </span>
                      </td>
                      <td className={UI.td}>
                        <button onClick={() => setModal({ type:'viewAPPO', po })} className={UI.btnGhost} title="View purchase order">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: CUSTOMERS & AR
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCustomers = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className={UI.card}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-200 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-500" /> Customer Invoices (AR)</h3>
          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className="flex gap-1">
              {['All','Open','Overdue','Partial','Paid'].map(f => (
                <button key={f} onClick={() => setInvoiceFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${invoiceFilter === f ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent'}`}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => { resetInvBuilder(); setInvBuilderCatalogSearch(''); setModal({ type:'invBuilder' }); }} className={UI.btnPrimary}>
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-800"><tr>
            {['Invoice','Customer','Date','Due','Amount','Paid','Balance','Source','Status',''].map(h => <th key={h} className={UI.th}>{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-800/30">
                <td className={UI.td}><span className="font-mono text-xs text-gray-400">{inv.id}</span></td>
                <td className={UI.td}><span className="font-semibold text-gray-200">{inv.customer}</span></td>
                <td className={UI.td}>{fmtDate(inv.date)}</td>
                <td className={UI.td}>
                  <span className={inv.status === 'Overdue' ? 'text-rose-400 font-semibold' : 'text-gray-400'}>{fmtDate(inv.dueDate)}</span>
                </td>
                <td className={UI.td}><span className="font-bold text-gray-200">{fmt(inv.amount)}</span></td>
                <td className={UI.td}><span className="text-emerald-400">{fmt(inv.paid)}</span></td>
                <td className={UI.td}><span className={inv.amount - inv.paid > 0 ? 'text-cyan-500 font-bold' : 'text-gray-500'}>{fmt(inv.amount - inv.paid)}</span></td>
                <td className={UI.td}><span className={UI.badgeGray}>{inv.source}</span></td>
                <td className={UI.td}><InvoiceBadge status={inv.status} /></td>
                <td className={UI.td}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ type:'viewInvoice', invoice: inv })} className={UI.btnGhost} title="View invoice">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {inv.status !== 'Paid' && (
                      <button onClick={() => { setPayForm({ amount: String(inv.amount - inv.paid), date: TODAY, notes:'' }); setModal({ type:'payment', invoice: inv }); }} className={UI.btnPrimary}>
                        <DollarSign className="w-3.5 h-3.5" /> Pay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: CHECKS
  // ─────────────────────────────────────────────────────────────────────────────
  const renderChecks = () => (
    <div className="flex-1 overflow-auto p-6">
      <div className={UI.card}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-200 flex items-center gap-2"><CreditCard className="w-4 h-4 text-cyan-500" /> Check Register</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input value={checkSearch} onChange={e => { const v = e.target.value; setCheckSearch(v); }} placeholder="Search checks…" className={`${UI.input} pl-8 w-44`} />
            </div>
            <button onClick={() => { setCheckForm({ payee:'',amount:'',memo:'',accountId:'BA001',date:TODAY,glCode:'5000' }); setModal({ type:'check' }); }} className={UI.btnPrimary}>
              <Plus className="w-4 h-4" /> Write Check
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-800"><tr>
            {['Check #','Date','Payee','Memo','Amount','Account','Status','Actions'].map(h => <th key={h} className={UI.th}>{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-800/50">
            {filteredChecks.map(chk => (
              <tr key={chk.id} className={`hover:bg-gray-800/30 ${chk.status === 'Void' ? 'opacity-40' : ''}`}>
                <td className={UI.td}><span className="font-mono font-bold text-cyan-500">{chk.id}</span></td>
                <td className={UI.td}>{fmtDate(chk.date)}</td>
                <td className={UI.td}><span className="font-semibold text-gray-200">{chk.payee}</span></td>
                <td className={UI.td}><span className="text-gray-400 text-xs">{chk.memo}</span></td>
                <td className={UI.td}><span className="font-bold text-rose-400">{fmt(chk.amount)}</span></td>
                <td className={UI.td}><span className="text-gray-500 text-xs">{bankAccounts.find(a=>a.id===chk.accountId)?.number ?? chk.accountId}</span></td>
                <td className={UI.td}><CheckBadge status={chk.status} /></td>
                <td className={UI.td}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setModal({ type:'printCheck', check: chk })} className={UI.btnGhost} title="View / print check">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {chk.status !== 'Void' && (
                      <button onClick={() => handleVoidCheck(chk.id)} className={UI.btnDanger} title="Void check"><Ban className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: RECONCILIATION
  // ─────────────────────────────────────────────────────────────────────────────
  const renderReconciliation = () => {
    const rec        = currentRec;
    const acctInfo   = rec ? bankAccounts.find(a => a.id === rec.accountId) : null;
    const isCreditLine = acctInfo?.type === 'Credit Line';

    const cleared   = rec ? rec.items.filter(i =>  i.cleared) : [];
    const uncleared = rec ? rec.items.filter(i => !i.cleared) : [];
    const clearedDebits  = cleared.filter(i => i.type === 'debit' ).reduce((s, i) => s + i.amount, 0);
    const clearedCredits = cleared.filter(i => i.type === 'credit').reduce((s, i) => s + i.amount, 0);
    const clearedBalance = rec ? rec.openingBalance + clearedCredits - clearedDebits : 0;
    const difference     = rec ? clearedBalance - rec.closingBalance : 0;
    const isBalanced     = rec && Math.abs(difference) < 0.01;

    const filteredRecs = recAcctFilter === 'All'
      ? reconciliations
      : reconciliations.filter(r => bankAccounts.find(a => a.id === r.accountId)?.type === recAcctFilter);

    const acctTypeBadge = (type) => ({
      'Checking':    'bg-blue-500/10   text-blue-400',
      'Savings':     'bg-emerald-500/10 text-emerald-400',
      'Credit Line': 'bg-amber-500/10  text-amber-400',
    })[type] ?? 'bg-gray-700 text-gray-400';

    return (
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-cyan-500" />
            <div>
              <h2 className="font-bold text-gray-100">Bank Reconciliation</h2>
              <p className="text-xs text-gray-500">Match your records to the bank statement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['All', 'Checking', 'Savings', 'Credit Line'].map(f => (
              <button key={f} onClick={() => setRecAcctFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${recAcctFilter === f ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Account Summary Cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {bankAccounts.map(acct => {
            const acctRecs   = reconciliations.filter(r => r.accountId === acct.id);
            const lastRec    = acctRecs[0];
            const inProgress = acctRecs.find(r => r.status === 'In Progress');
            const isCL       = acct.type === 'Credit Line';
            const isActive   = lastRec && activeReconcile === lastRec.id;
            return (
              <div key={acct.id}
                onClick={() => { if (lastRec) { setActiveReconcile(lastRec.id); setRecAcctFilter('All'); } }}
                className={`${UI.cardPad} cursor-pointer transition-all border ${isActive ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-transparent hover:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acctTypeBadge(acct.type)}`}>{acct.type}</span>
                  <span className="text-[10px] text-gray-600">{acct.number}</span>
                </div>
                <p className="text-xs font-bold text-gray-300 truncate">{acct.name}</p>
                <p className={`text-lg font-black mt-1 ${isCL ? 'text-amber-400' : 'text-gray-100'}`}>
                  {isCL ? `(${fmt(Math.abs(acct.balance))})` : fmt(acct.balance)}
                </p>
                {isCL && acct.creditLimit && (
                  <p className="text-[10px] text-emerald-500 mt-0.5">{fmt(acct.creditLimit + acct.balance)} available</p>
                )}
                <p className={`text-[10px] mt-1.5 font-semibold ${inProgress ? 'text-amber-400' : 'text-emerald-500'}`}>
                  {inProgress ? '● Rec in progress' : '✓ Up to date'}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Rec selector + New ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <select value={activeReconcile} onChange={e => setActiveReconcile(e.target.value)} className={`${UI.select} flex-1`}>
            {filteredRecs.map(r => (
              <option key={r.id} value={r.id}>
                {r.period} · {bankAccounts.find(a => a.id === r.accountId)?.name} — {r.status}
              </option>
            ))}
          </select>
          <button onClick={() => { setRecForm({ accountId:'BA001',period:'',openingBalance:'',closingDate:'',closingBalance:'' }); setModal({ type:'reconcile' }); }} className={UI.btnPrimary}>
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {rec && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* ── Statement Info ────────────────────────────────────────────── */}
            <div className={`${UI.cardPad} lg:col-span-1 space-y-3`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-200 text-sm">Statement Info</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${acctTypeBadge(acctInfo?.type)}`}>{acctInfo?.type}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Account</p>
                <p className="text-sm font-semibold text-gray-200">{acctInfo?.name}</p>
                <p className="text-[10px] text-gray-600">{acctInfo?.number} · {acctInfo?.bank}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Period</p>
                <p className="text-sm font-semibold text-gray-200">{rec.period}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{isCreditLine ? 'Opening Balance Owed' : 'Opening Balance'}</p>
                <p className="text-sm font-bold text-gray-200">
                  {isCreditLine ? `(${fmt(Math.abs(rec.openingBalance))})` : fmt(rec.openingBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Closing Date</p>
                <p className="text-sm font-semibold text-gray-200">{fmtDate(rec.closingDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{isCreditLine ? 'Statement Balance Owed' : 'Statement Closing Balance'}</p>
                <p className="text-sm font-bold text-cyan-500">
                  {isCreditLine ? `(${fmt(Math.abs(rec.closingBalance))})` : fmt(rec.closingBalance)}
                </p>
              </div>
              {isCreditLine && acctInfo?.creditLimit && (
                <div>
                  <p className="text-xs text-gray-500">Credit Available</p>
                  <p className="text-sm font-bold text-emerald-400">{fmt(acctInfo.creditLimit + rec.closingBalance)}</p>
                  <p className="text-[10px] text-gray-600">of {fmt(acctInfo.creditLimit)} limit</p>
                </div>
              )}
              <div className="border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-500">{isCreditLine ? 'Calculated Balance Owed' : 'Cleared Balance'}</p>
                <p className={`text-lg font-black ${isBalanced ? 'text-emerald-400' : 'text-cyan-500'}`}>
                  {isCreditLine ? `(${fmt(Math.abs(clearedBalance))})` : fmt(clearedBalance)}
                </p>
                <p className={`text-xs font-bold mt-1 ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isBalanced ? '✓ Balanced' : `Difference: ${fmt(Math.abs(difference))}`}
                </p>
              </div>
              {uncleared.length > 0 && rec.status !== 'Completed' && (
                <button
                  onClick={() => handleImportStatement(rec.id)}
                  className={`${UI.btnGhost} w-full justify-center text-xs gap-1.5`}>
                  <Download className="w-3.5 h-3.5" /> Import Statement
                </button>
              )}
              {rec.status !== 'Completed' && (
                <button
                  onClick={() => handleCompleteReconciliation(rec.id)}
                  disabled={!isBalanced}
                  className={`${UI.btnPrimary} w-full justify-center ${!isBalanced ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <CheckCircle2 className="w-4 h-4" /> Mark Complete
                </button>
              )}
              {rec.status === 'Completed' && (
                <span className={`${UI.badgeGreen} w-full justify-center py-1.5`}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed
                </span>
              )}
            </div>

            {/* ── Line Items ────────────────────────────────────────────────── */}
            <div className={`${UI.card} lg:col-span-3`}>
              <div className="px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                <p className="text-sm font-bold text-gray-200">
                  Line Items <span className="text-gray-500 font-normal text-xs">({cleared.length}/{rec.items.length} cleared)</span>
                </p>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>{isCreditLine ? 'Charges:' : 'Cleared Debits:'} <strong className="text-rose-400">{fmt(clearedDebits)}</strong></span>
                  <span>{isCreditLine ? 'Payments:' : 'Cleared Credits:'} <strong className="text-emerald-400">{fmt(clearedCredits)}</strong></span>
                </div>
              </div>
              <div className="overflow-auto max-h-[540px]">
                <table className="w-full">
                  <thead className="border-b border-gray-800 sticky top-0 bg-gray-900">
                    <tr>
                      <th className={UI.th}>Clear</th>
                      <th className={UI.th}>Date</th>
                      <th className={UI.th}>Description</th>
                      <th className={UI.th}>{isCreditLine ? 'Charge / Payment' : 'Type'}</th>
                      <th className={UI.th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {/* Cleared section header */}
                    {cleared.length > 0 && (
                      <tr><td colSpan={5} className="px-4 py-1.5 bg-emerald-500/5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                          Cleared — {cleared.length} item{cleared.length !== 1 ? 's' : ''}
                        </span>
                      </td></tr>
                    )}
                    {cleared.map(item => (
                      <tr key={item.id} className="hover:bg-gray-800/30 transition-colors bg-emerald-500/5">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleRecLineItem(rec.id, item.id)}
                            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors bg-emerald-500 border-emerald-500">
                            <Check className="w-3 h-3 text-white" />
                          </button>
                        </td>
                        <td className={UI.td}>{fmtDate(item.date)}</td>
                        <td className={UI.td}><span className="text-gray-400 line-through decoration-gray-600">{item.description}</span></td>
                        <td className={UI.td}>
                          <span className={item.type === 'credit' ? UI.badgeGreen : UI.badgeRed}>
                            {isCreditLine ? (item.type === 'credit' ? 'payment' : 'charge') : item.type}
                          </span>
                        </td>
                        <td className={UI.td}>
                          <span className={item.type === 'credit' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {item.type === 'credit' ? '+' : '–'}{fmt(item.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Outstanding section header */}
                    {uncleared.length > 0 && (
                      <tr><td colSpan={5} className="px-4 py-1.5 bg-amber-500/5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                          Outstanding — {uncleared.length} item{uncleared.length !== 1 ? 's' : ''} · needs clearing
                        </span>
                      </td></tr>
                    )}
                    {uncleared.map(item => (
                      <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleRecLineItem(rec.id, item.id)}
                            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors border-gray-600 hover:border-cyan-500">
                          </button>
                        </td>
                        <td className={UI.td}>{fmtDate(item.date)}</td>
                        <td className={UI.td}><span className="text-gray-200">{item.description}</span></td>
                        <td className={UI.td}>
                          <span className={item.type === 'credit' ? UI.badgeGreen : UI.badgeRed}>
                            {isCreditLine ? (item.type === 'credit' ? 'payment' : 'charge') : item.type}
                          </span>
                        </td>
                        <td className={UI.td}>
                          <span className={item.type === 'credit' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {item.type === 'credit' ? '+' : '–'}{fmt(item.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: CUSTOMER PROFITABILITY REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCustomerProfitability = () => {
    // ── Compute per-customer profitability from invoices ──────────────────────
    const custMap = {};
    BILLING_CUSTOMERS.forEach(c => {
      custMap[c.id] = {
        id: c.id, name: c.name, contact: c.contact, terms: c.terms,
        invoices: [], revenue: 0, cogs: 0, grossProfit: 0, deliveryCost: 0,
        netContribution: 0, arBalance: 0, arOverdue: 0, invoiceCount: 0,
        categoryRev: { Protein: 0, Dairy: 0, Produce: 0, Bakery: 0, Dry: 0, Services: 0, Other: 0 },
      };
    });

    // Merge any dynamic invoices created this session
    const allInvoices = [...INIT_INVOICES, ...invoices.filter(i => !INIT_INVOICES.find(ii => ii.id === i.id))];

    allInvoices.forEach(inv => {
      const cid = inv.customerId;
      if (!custMap[cid]) return;
      const c = custMap[cid];
      c.invoices.push(inv);
      c.invoiceCount++;

      const lineItems = inv.items || [];
      let invRevenue = 0;
      let invCOGS    = 0;

      lineItems.forEach(line => {
        const lineRev  = line.total ?? (line.qty * line.unitPrice);
        const cogsRate = skuCogsRate(line.sku || '');
        invRevenue += lineRev;
        invCOGS    += lineRev * cogsRate;

        // Category breakdown
        const sku = line.sku || '';
        if      (sku.startsWith('FRZ-') || sku.startsWith('PLT-') || sku.startsWith('PROT-')) c.categoryRev.Protein   += lineRev;
        else if (sku.startsWith('DAI-'))                                                        c.categoryRev.Dairy     += lineRev;
        else if (sku.startsWith('PRO-'))                                                        c.categoryRev.Produce   += lineRev;
        else if (sku.startsWith('BAK-'))                                                        c.categoryRev.Bakery    += lineRev;
        else if (sku.startsWith('DRY-'))                                                        c.categoryRev.Dry       += lineRev;
        else if (sku.startsWith('SVC-'))                                                        c.categoryRev.Services  += lineRev;
        else                                                                                    c.categoryRev.Other     += lineRev;
      });

      // If no line items, fall back to subtotal
      if (!lineItems.length) { invRevenue = inv.subtotal || inv.amount || 0; invCOGS = invRevenue * FALLBACK_COGS_RATE; }

      const deliveryCost = DELIVERY_COST_PER_STOP;
      c.revenue        += invRevenue;
      c.cogs           += invCOGS;
      c.deliveryCost   += deliveryCost;
      c.arBalance      += (inv.amount - (inv.paid || 0));
      if (inv.status === 'Overdue') c.arOverdue += (inv.amount - (inv.paid || 0));
    });

    Object.values(custMap).forEach(c => {
      c.grossProfit      = c.revenue - c.cogs;
      c.grossMarginPct   = c.revenue > 0 ? (c.grossProfit / c.revenue) * 100 : 0;
      c.netContribution  = c.grossProfit - c.deliveryCost;
      c.netMarginPct     = c.revenue > 0 ? (c.netContribution / c.revenue) * 100 : 0;
      c.priorRevenue     = PRIOR_PERIOD_REVENUE[c.id] || 0;
      c.revTrend         = c.revenue - c.priorRevenue;
      c.revTrendPct      = c.priorRevenue > 0 ? ((c.revenue - c.priorRevenue) / c.priorRevenue) * 100 : null;
    });

    const rows = Object.values(custMap);

    // ── Filter ────────────────────────────────────────────────────────────────
    const filtered = rows.filter(c => {
      if (profitFilter === 'Active')   return c.invoiceCount > 0;
      if (profitFilter === 'Overdue')  return c.arOverdue > 0;
      if (profitFilter === 'Paid Up')  return c.invoiceCount > 0 && c.arBalance <= 0;
      return true;
    });

    // ── Sort ──────────────────────────────────────────────────────────────────
    const sorted = [...filtered].sort((a, b) => {
      const v = profitSort.col;
      const av = a[v] ?? 0, bv = b[v] ?? 0;
      return profitSort.dir === 'desc' ? bv - av : av - bv;
    });

    const toggleSort = col => setProfitSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }));
    const SortIcon = ({ col }) => profitSort.col === col
      ? (profitSort.dir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />)
      : null;

    // ── Totals for KPI strip ──────────────────────────────────────────────────
    const totRevenue   = rows.reduce((s, c) => s + c.revenue, 0);
    const totCOGS      = rows.reduce((s, c) => s + c.cogs, 0);
    const totGP        = totRevenue - totCOGS;
    const totGMPct     = totRevenue > 0 ? (totGP / totRevenue) * 100 : 0;
    const totAR        = rows.reduce((s, c) => s + c.arBalance, 0);
    const totNetContr  = rows.reduce((s, c) => s + c.netContribution, 0);
    const totNetPct    = totRevenue > 0 ? (totNetContr / totRevenue) * 100 : 0;
    const totDelivery  = rows.reduce((s, c) => s + c.deliveryCost, 0);

    // ── Selected customer drilldown data ─────────────────────────────────────
    const selCust = profitCust ? custMap[profitCust] : null;

    // ── Margin color helper ───────────────────────────────────────────────────
    const marginColor = pct => pct >= 30 ? 'text-emerald-400' : pct >= 20 ? 'text-cyan-400' : pct >= 10 ? 'text-amber-400' : 'text-rose-400';
    const marginBg    = pct => pct >= 30 ? 'bg-emerald-500/10 text-emerald-400' : pct >= 20 ? 'bg-cyan-500/10 text-cyan-400' : pct >= 10 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400';

    // ── Th helper ─────────────────────────────────────────────────────────────
    const Th = ({ col, children, right }) => (
      <th onClick={() => toggleSort(col)} className={`${UI.th} cursor-pointer select-none hover:text-cyan-400 transition-colors ${right ? 'text-right' : ''}`}>
        {children}<SortIcon col={col} />
      </th>
    );

    return (
      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-100">Customer Profitability</h2>
            <p className="text-xs text-gray-500 mt-0.5">Revenue · COGS · Gross Margin · Net Contribution — May 2026</p>
          </div>
          <div className="flex items-center gap-2">
            {['All','Active','Overdue','Paid Up'].map(f => (
              <button key={f} onClick={() => setProfitFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${profitFilter === f ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total Revenue',    value: fmt(totRevenue),                 sub: `${rows.filter(r=>r.invoiceCount>0).length} active accounts`, color: 'text-gray-100' },
            { label: 'Total COGS',       value: fmt(totCOGS),                    sub: `${(100 - totGMPct).toFixed(1)}% of revenue`,               color: 'text-rose-400'   },
            { label: 'Gross Profit',     value: fmt(totGP),                      sub: `${totGMPct.toFixed(1)}% blended margin`,                    color: 'text-emerald-400'},
            { label: 'AR Outstanding',   value: fmt(totAR),                      sub: `${rows.filter(r=>r.arOverdue>0).length} overdue accounts`,  color: 'text-amber-400'  },
            { label: 'Net Contribution', value: fmt(totNetContr),                sub: `${totNetPct.toFixed(1)}% after delivery costs`,             color: 'text-cyan-400'   },
          ].map(k => (
            <div key={k.label} className={`${UI.cardPad} space-y-0.5`}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{k.label}</p>
              <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-gray-600">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Main layout: table + drilldown ─────────────────────────────────── */}
        <div className={`flex gap-4 ${selCust ? 'items-start' : ''}`}>

          {/* ── Ranked table ─────────────────────────────────────────────────── */}
          <div className={`${UI.card} ${selCust ? 'flex-1 min-w-0' : 'w-full'} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className={`${UI.th} w-6`}>#</th>
                  <Th col="name">Customer</Th>
                  <Th col="revenue" right>Revenue</Th>
                  <Th col="cogs" right>COGS</Th>
                  <Th col="grossProfit" right>Gross Profit</Th>
                  <Th col="grossMarginPct" right>GM %</Th>
                  <Th col="deliveryCost" right>Delivery</Th>
                  <Th col="netContribution" right>Net Contrib.</Th>
                  <Th col="netMarginPct" right>NM %</Th>
                  <Th col="arBalance" right>AR Balance</Th>
                  <th className={UI.th}>Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sorted.map((c, idx) => {
                  const isSel = profitCust === c.id;
                  const hasActivity = c.invoiceCount > 0;
                  return (
                    <tr key={c.id}
                      onClick={() => setProfitCust(isSel ? null : c.id)}
                      className={`cursor-pointer transition-colors ${isSel ? 'bg-cyan-500/10' : 'hover:bg-gray-800/40'} ${!hasActivity ? 'opacity-40' : ''}`}>
                      <td className={`${UI.td} text-center`}>
                        <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                      </td>
                      <td className={UI.td}>
                        <div>
                          <p className={`font-semibold ${isSel ? 'text-cyan-400' : 'text-gray-200'}`}>{c.name}</p>
                          <p className="text-[10px] text-gray-600">{c.terms} · {c.invoiceCount} invoice{c.invoiceCount !== 1 ? 's' : ''}</p>
                        </div>
                      </td>
                      <td className={`${UI.td} text-right font-bold text-gray-100`}>{hasActivity ? fmt(c.revenue) : '—'}</td>
                      <td className={`${UI.td} text-right text-rose-400`}>{hasActivity ? fmt(c.cogs) : '—'}</td>
                      <td className={`${UI.td} text-right font-bold text-emerald-400`}>{hasActivity ? fmt(c.grossProfit) : '—'}</td>
                      <td className={`${UI.td} text-right`}>
                        {hasActivity
                          ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${marginBg(c.grossMarginPct)}`}>{c.grossMarginPct.toFixed(1)}%</span>
                          : '—'}
                      </td>
                      <td className={`${UI.td} text-right text-gray-400`}>{hasActivity ? fmt(c.deliveryCost) : '—'}</td>
                      <td className={`${UI.td} text-right font-bold ${c.netContribution >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>{hasActivity ? fmt(c.netContribution) : '—'}</td>
                      <td className={`${UI.td} text-right`}>
                        {hasActivity
                          ? <span className={`text-xs font-bold ${marginColor(c.netMarginPct)}`}>{c.netMarginPct.toFixed(1)}%</span>
                          : '—'}
                      </td>
                      <td className={`${UI.td} text-right`}>
                        {c.arBalance > 0
                          ? <span className={c.arOverdue > 0 ? 'text-rose-400 font-bold' : 'text-amber-400 font-semibold'}>{fmt(c.arBalance)}</span>
                          : <span className="text-emerald-400 text-xs font-bold">Current</span>}
                      </td>
                      <td className={UI.td}>
                        {c.revTrendPct !== null
                          ? (c.revTrendPct >= 0
                            ? <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-bold"><TrendingUp className="w-3 h-3" />+{c.revTrendPct.toFixed(0)}%</span>
                            : <span className="flex items-center gap-0.5 text-rose-400 text-xs font-bold"><TrendingDown className="w-3 h-3" />{c.revTrendPct.toFixed(0)}%</span>)
                          : <span className="text-gray-600 text-xs">New</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals footer */}
              <tfoot className="border-t-2 border-gray-700">
                <tr className="bg-gray-800/30">
                  <td className={UI.td} colSpan={2}><span className="font-black text-gray-300 text-xs uppercase tracking-wide">Totals</span></td>
                  <td className={`${UI.td} text-right font-black text-gray-100`}>{fmt(totRevenue)}</td>
                  <td className={`${UI.td} text-right font-black text-rose-400`}>{fmt(totCOGS)}</td>
                  <td className={`${UI.td} text-right font-black text-emerald-400`}>{fmt(totGP)}</td>
                  <td className={`${UI.td} text-right`}><span className={`text-xs font-black px-2 py-0.5 rounded-full ${marginBg(totGMPct)}`}>{totGMPct.toFixed(1)}%</span></td>
                  <td className={`${UI.td} text-right font-bold text-gray-400`}>{fmt(totDelivery)}</td>
                  <td className={`${UI.td} text-right font-black text-cyan-400`}>{fmt(totNetContr)}</td>
                  <td className={`${UI.td} text-right`}><span className={`text-xs font-black ${marginColor(totNetPct)}`}>{totNetPct.toFixed(1)}%</span></td>
                  <td className={`${UI.td} text-right font-black text-amber-400`}>{fmt(totAR)}</td>
                  <td className={UI.td}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Drilldown panel ──────────────────────────────────────────────── */}
          {selCust && (
            <div className={`${UI.card} w-80 flex-shrink-0 space-y-0 overflow-hidden`}>
              {/* Header */}
              <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/40">
                <div>
                  <p className="font-black text-gray-100 text-sm leading-tight">{selCust.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{selCust.contact} · {selCust.terms}</p>
                </div>
                <button onClick={() => setProfitCust(null)} className="text-gray-600 hover:text-gray-300 transition-colors mt-0.5"><X className="w-4 h-4"/></button>
              </div>

              {/* KPI mini-strip */}
              <div className="grid grid-cols-2 gap-px bg-gray-800/40">
                {[
                  { label: 'Revenue',      value: fmt(selCust.revenue),          color: 'text-gray-100'   },
                  { label: 'Gross Margin', value: `${selCust.grossMarginPct.toFixed(1)}%`, color: marginColor(selCust.grossMarginPct) },
                  { label: 'Net Contrib.', value: fmt(selCust.netContribution),  color: 'text-cyan-400'   },
                  { label: 'AR Balance',   value: fmt(selCust.arBalance),        color: selCust.arOverdue > 0 ? 'text-rose-400' : selCust.arBalance > 0 ? 'text-amber-400' : 'text-emerald-400' },
                ].map(k => (
                  <div key={k.label} className="px-4 py-3 bg-gray-900">
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{k.label}</p>
                    <p className={`text-base font-black mt-0.5 ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue by category */}
              {selCust.revenue > 0 && (
                <div className="px-4 py-3 border-t border-gray-800">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Revenue by Category</p>
                  <div className="space-y-1.5">
                    {Object.entries(selCust.categoryRev)
                      .filter(([, v]) => v > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, val]) => {
                        const pct = selCust.revenue > 0 ? (val / selCust.revenue) * 100 : 0;
                        const barColor = { Protein: 'bg-cyan-500', Dairy: 'bg-blue-500', Produce: 'bg-emerald-500', Bakery: 'bg-amber-500', Dry: 'bg-violet-500', Services: 'bg-gray-500', Other: 'bg-gray-600' }[cat] || 'bg-gray-600';
                        return (
                          <div key={cat}>
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-[10px] text-gray-400 font-medium">{cat}</span>
                              <span className="text-[10px] text-gray-500">{fmt(val)} · {pct.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Invoice history */}
              <div className="px-4 py-3 border-t border-gray-800">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Invoice History</p>
                {selCust.invoices.length === 0
                  ? <p className="text-xs text-gray-600 italic">No invoices on record</p>
                  : (
                    <div className="space-y-1.5">
                      {selCust.invoices.map(inv => {
                        const bal = inv.amount - (inv.paid || 0);
                        const statusColor = { Paid: 'text-emerald-400', Overdue: 'text-rose-400', Open: 'text-amber-400', Partial: 'text-cyan-400' }[inv.status] || 'text-gray-400';
                        return (
                          <div key={inv.id} className="flex items-center justify-between py-1 border-b border-gray-800/40 last:border-0">
                            <div>
                              <p className="text-xs text-gray-300 font-semibold">{inv.id}</p>
                              <p className="text-[10px] text-gray-600">{fmtDate(inv.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-200">{fmt(inv.amount)}</p>
                              <p className={`text-[10px] font-semibold ${statusColor}`}>{inv.status}{bal > 0 ? ` · ${fmt(bal)} due` : ''}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>

              {/* Month-over-month trend */}
              {selCust.priorRevenue > 0 && (
                <div className="px-4 py-3 border-t border-gray-800 bg-gray-800/20">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">vs. Prior Period (Apr)</p>
                  <div className="flex items-center gap-2">
                    {selCust.revTrend >= 0
                      ? <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      : <TrendingDown className="w-5 h-5 text-rose-400 flex-shrink-0" />}
                    <div>
                      <p className={`text-sm font-black ${selCust.revTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {selCust.revTrend >= 0 ? '+' : ''}{fmt(selCust.revTrend)}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        {selCust.revTrendPct !== null ? `${selCust.revTrendPct >= 0 ? '+' : ''}${selCust.revTrendPct.toFixed(1)}% from ${fmt(selCust.priorRevenue)}` : 'New customer'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer note ────────────────────────────────────────────────────── */}
        <p className="text-[10px] text-gray-700 text-center">
          COGS estimated from SKU category averages · Delivery cost ${DELIVERY_COST_PER_STOP}/stop blended rate · Click any row to view customer detail
        </p>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: COMMISSIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCommissions = () => {
    // Editable rate state — initialized from REP_RATES / CATEGORY_RATES
    // We store these in local component state via a useState initialized on first render.
    // (Declared here as closures over the outer useState hooks)
    const fmt$ = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(Number(n)||0);

    const repNames = Object.keys(REP_RATES);

    // Monthly commission per rep (May 2026 = current from history)
    const repSummaries = repNames.map(name => {
      const repData = REP_RATES[name];
      const hist    = MONTHLY_HISTORY[name] || [];
      const may     = hist.find(h => h.month === 'May 2026') || {};
      const ytd     = YTD_COMMISSION[name]  || { revenue: 0, commission: 0 };
      const prevMonth = hist.find(h => h.month === 'Apr 2026') || {};
      return {
        name,
        territory:    repData.territory,
        rate:         repData.rate,
        quota:        repData.quota,
        mtdRevenue:   may.revenue   ?? 0,
        mtdCommission: may.commission ?? 0,
        ytdRevenue:   ytd.revenue,
        ytdCommission: ytd.commission,
        prevCommission: prevMonth.commission ?? 0,
      };
    }).sort((a, b) => b.mtdCommission - a.mtdCommission);

    const totalMtdCommission = repSummaries.reduce((s, r) => s + r.mtdCommission, 0);
    const totalYtdCommission = repSummaries.reduce((s, r) => s + r.ytdCommission, 0);
    const totalMtdRevenue    = repSummaries.reduce((s, r) => s + r.mtdRevenue, 0);

    // ── Settlement helpers ────────────────────────────────────────────────────
    const activePeriod = settlementPeriods.find(p => p.id === activeSettlementId);
    const handleLockPeriod = () => {
      setSettlementPeriods(prev => prev.map(p => p.id === activeSettlementId
        ? { ...p, status: 'Locked', lockedAt: TODAY }
        : p));
    };
    const handleApprovePeriod = () => {
      setSettlementPeriods(prev => prev.map(p => p.id === activeSettlementId
        ? { ...p, status: 'Approved', approvedBy: activeUser?.name || 'Manager' }
        : p));
    };
    const handleAcknowledge = (repName) => {
      setSettlementPeriods(prev => prev.map(p => p.id === activeSettlementId
        ? { ...p, reps: p.reps.map(r => r.name === repName ? { ...r, acknowledged: true, acknowledgedAt: TODAY } : r) }
        : p));
    };
    const handleExport = () => {
      setSettlementPeriods(prev => prev.map(p => p.id === activeSettlementId
        ? { ...p, status: 'Paid', payrollSystem: exportTarget, exportedAt: TODAY, payrollRef: `${exportTarget}-${TODAY.replace(/-/g,'')}-COMM` }
        : p));
      setExportFired(true);
      setTimeout(() => setExportFired(false), 4000);
    };
    const statusBadge = (s) => ({
      Open:     'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      Locked:   'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      Approved: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
      Paid:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    }[s] || 'bg-gray-700/60 text-gray-400');

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-100">Sales Rep Commissions</h2>
            <p className="text-sm text-gray-500 mt-0.5">May 2026 · Auto-calculated from shipped & invoiced orders</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-sm font-semibold">
            <Download className="w-4 h-4" /> Export All Statements
          </button>
        </div>

        {/* Sub-tab nav */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {[
            { id: 'summary',    label: 'Summary & Rates',   icon: Percent          },
            { id: 'settlement', label: 'Payroll Settlement', icon: ClipboardCheck   },
          ].map(t => (
            <button key={t.id} onClick={() => setCommSubTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                commSubTab === t.id ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {commSubTab === 'summary' && <>
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'MTD Revenue (All Reps)', value: fmt$(totalMtdRevenue),    color: 'cyan' },
            { label: 'MTD Commission Total',   value: fmt$(totalMtdCommission), color: 'violet' },
            { label: 'YTD Commission Total',   value: fmt$(totalYtdCommission), color: 'emerald' },
          ].map(k => (
            <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{k.label}</p>
              <p className={`text-2xl font-black mt-1 ${k.color === 'cyan' ? 'text-cyan-400' : k.color === 'violet' ? 'text-violet-400' : 'text-emerald-400'}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* All-rep commission table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <Percent className="w-4 h-4 text-violet-400" />
            <h3 className="font-bold text-gray-200 text-sm">Rep Commission Summary — May 2026</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">Rank</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">Rep</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">Territory</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">Base Rate</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">MTD Revenue</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">MTD Commission</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">YTD Commission</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-500 uppercase">MoM</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {repSummaries.map((rep, i) => {
                const mom = rep.prevCommission > 0 ? ((rep.mtdCommission - rep.prevCommission) / rep.prevCommission * 100) : null;
                const quotaPct = rep.quota > 0 ? Math.min(100, (rep.mtdRevenue / rep.quota) * 100) : 0;
                return (
                  <tr key={rep.name} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`font-mono font-bold text-sm ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-700' : 'text-gray-600'}`}>#{i+1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-gray-100">{rep.name}</span>
                      <div className="mt-1 flex items-center gap-1">
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden w-20">
                          <div className={`h-full ${quotaPct >= 100 ? 'bg-emerald-500' : quotaPct >= 70 ? 'bg-cyan-500' : 'bg-amber-500'}`} style={{ width: `${quotaPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-600">{quotaPct.toFixed(0)}% quota</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-sm">{rep.territory}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-300">{(rep.rate * 100).toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-300">{fmt$(rep.mtdRevenue)}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-violet-400">{fmt$(rep.mtdCommission)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-400">{fmt$(rep.ytdCommission)}</td>
                    <td className="px-5 py-3 text-right">
                      {mom !== null && (
                        <span className={`text-xs font-bold flex items-center justify-end gap-0.5 ${mom >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {mom >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(mom).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 ml-auto">
                        <FileText className="w-3.5 h-3.5" /> Statement
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rate Configuration */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-cyan-500" />
            <h3 className="font-bold text-gray-200 text-sm">Rate Configuration</h3>
            <span className="text-xs text-gray-600 ml-1">Changes apply to future calculations</span>
          </div>
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Per-rep rates */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Base Rate by Rep</h4>
              <div className="space-y-2">
                {repSummaries.map(rep => (
                  <div key={rep.name} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-200 truncate">{rep.name}</p>
                      <p className="text-[10px] text-gray-500">{rep.territory}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        defaultValue={(rep.rate * 100).toFixed(1)}
                        className="w-16 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-gray-100 text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-category bonus rates */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category Bonus Rates</h4>
              <div className="mb-3 p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-[11px] text-emerald-400 leading-relaxed">
                <span className="font-bold">Additive model:</span> Bonus is added <em>on top of</em> the rep's base rate.
                A rep earning 2.5% base + 2.5% bonus earns 5.0% effective on that item.
                Set 0% bonus for low-margin items (e.g., cooking oil). Services always earn 0% regardless.
              </div>
              <div className="space-y-2">
                {CATEGORY_RATES.filter(c => c.category !== 'Services').map(cat => {
                  const tierColor = cat.marginTier === 'High' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                  : cat.marginTier === 'Medium' || cat.marginTier === 'Medium-high' || cat.marginTier === 'medium-high' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                  : 'text-gray-500 bg-gray-800/50 border-gray-700';
                  return (
                    <div key={cat.prefix} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-200">{cat.category}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${tierColor}`}>{cat.marginTier} margin</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{cat.prefix}* · base + <span className="text-emerald-400 font-bold">{(cat.bonusRate * 100).toFixed(1)}%</span> bonus</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-600">+</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="20"
                          defaultValue={(cat.bonusRate * 100).toFixed(1)}
                          className="w-16 bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-emerald-400 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </div>
                  );
                })}
                {/* Services non-commissionable row */}
                <div className="flex items-center gap-3 bg-gray-800/20 rounded-lg px-3 py-2.5 opacity-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-400">Services</p>
                    <p className="text-[10px] text-gray-600 font-mono">SVC-* · non-commissionable</p>
                  </div>
                  <span className="text-xs font-bold text-gray-600">0% always</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 flex items-center justify-between border-t border-gray-800/60 pt-4">
            <p className="text-xs text-gray-600">Rate changes are reflected in next month's commission calculations. Historical statements are not retroactively updated.</p>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-sm font-semibold">
              <Save className="w-4 h-4" /> Save Rates
            </button>
          </div>
        </div>

        {/* 6-month trend — all reps */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            <h3 className="font-bold text-gray-200 text-sm">Commission Trend — All Reps (Last 6 Months)</h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {repNames.map(name => {
                const hist = MONTHLY_HISTORY[name] || [];
                const max = Math.max(...hist.map(h => h.commission || 0), 1);
                return (
                  <div key={name}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-gray-300 w-28 truncate">{name.split(' ')[0]} {name.split(' ')[1]?.[0]}.</span>
                      <div className="flex-1 flex items-end gap-1" style={{ height: 28 }}>
                        {hist.map(h => {
                          const barH = h.commission ? Math.max(10, (h.commission / max) * 100) : 5;
                          const isMay = h.month === 'May 2026';
                          return (
                            <div key={h.month} title={`${h.month}: ${h.commission ? fmt$(h.commission) : 'In progress'}`} className="flex-1 flex items-end">
                              <div className={`w-full rounded-sm ${isMay ? 'bg-violet-500' : 'bg-gray-700'}`} style={{ height: `${barH}%` }} />
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-xs font-bold text-violet-400 w-20 text-right">{fmt$(hist.find(h => h.month === 'May 2026')?.commission || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1 mt-3 justify-end">
              {(MONTHLY_HISTORY['James Wilson'] || []).map(h => (
                <div key={h.month} className="flex-1 text-center text-[10px] text-gray-600">{h.month.split(' ')[0]}</div>
              ))}
            </div>
          </div>
        </div>
        </>}

        {/* ── PAYROLL SETTLEMENT SUB-TAB ── */}
        {commSubTab === 'settlement' && activePeriod && (
          <div className="space-y-5">
            {/* Period selector row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-gray-400">Period:</span>
              {settlementPeriods.map(p => (
                <button key={p.id} onClick={() => { setActiveSettlementId(p.id); setExportFired(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    activeSettlementId === p.id ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                  }`}>
                  {p.period}
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusBadge(p.status)}`}>{p.status}</span>
                </button>
              ))}
            </div>

            {/* Settlement KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Commission', value: fmt$(activePeriod.reps.reduce((s,r)=>s+r.commission,0)), icon: BadgeDollarSign, color: 'text-violet-400' },
                { label: 'Reps Acknowledged', value: `${activePeriod.reps.filter(r=>r.acknowledged).length} / ${activePeriod.reps.length}`, icon: UserCheck, color: 'text-emerald-400' },
                { label: 'Status', value: activePeriod.status, icon: ClipboardCheck, color: activePeriod.status==='Paid'?'text-emerald-400':activePeriod.status==='Approved'?'text-violet-400':activePeriod.status==='Locked'?'text-cyan-400':'text-amber-400' },
                { label: 'Payroll System', value: activePeriod.payrollSystem || exportTarget, icon: Download, color: 'text-cyan-400' },
              ].map(k => (
                <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{k.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
                  </div>
                  <k.icon className={`w-7 h-7 ${k.color} opacity-30`} />
                </div>
              ))}
            </div>

            {/* Workflow status bar */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <div className="flex items-center gap-0">
                {[
                  { label: 'Open',     step: 1, done: ['Open','Locked','Approved','Paid'].includes(activePeriod.status) },
                  { label: 'Locked',   step: 2, done: ['Locked','Approved','Paid'].includes(activePeriod.status) },
                  { label: 'Approved', step: 3, done: ['Approved','Paid'].includes(activePeriod.status) },
                  { label: 'Paid',     step: 4, done: ['Paid'].includes(activePeriod.status) },
                ].map((s, idx, arr) => (
                  <React.Fragment key={s.label}>
                    <div className={`flex flex-col items-center gap-1 shrink-0 ${s.done?'opacity-100':'opacity-30'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${s.done?'bg-violet-500/20 text-violet-400 border-violet-500':'bg-gray-800 text-gray-600 border-gray-700'}`}>
                        {s.done ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                      </div>
                      <span className={`text-xs font-semibold ${s.done?'text-violet-400':'text-gray-600'}`}>{s.label}</span>
                    </div>
                    {idx < arr.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${s.done && arr[idx+1].done?'bg-violet-500/40':'bg-gray-800'}`} />}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                {activePeriod.lockedAt   && <span>Locked {activePeriod.lockedAt}</span>}
                {activePeriod.approvedBy && <><span>·</span><span>Approved by {activePeriod.approvedBy}</span></>}
                {activePeriod.exportedAt && <><span>·</span><span>Exported {activePeriod.exportedAt} via {activePeriod.payrollSystem} · Ref: {activePeriod.payrollRef}</span></>}
              </div>
            </div>

            {/* Action buttons row */}
            <div className="flex gap-3 flex-wrap">
              {activePeriod.status === 'Open' && (
                <button onClick={handleLockPeriod}
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm font-semibold hover:bg-cyan-500/20 transition-colors">
                  <Lock className="w-4 h-4" /> Lock Period — {activePeriod.period}
                </button>
              )}
              {activePeriod.status === 'Locked' && (
                <button onClick={handleApprovePeriod}
                  className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-sm font-semibold hover:bg-violet-500/20 transition-colors">
                  <CheckCircle2 className="w-4 h-4" /> Approve for Payroll
                </button>
              )}
              {activePeriod.status === 'Approved' && (
                <div className="flex items-center gap-3">
                  <select value={exportTarget} onChange={e => setExportTarget(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-violet-500/50">
                    {['ADP', 'Gusto', 'Paychex', 'QuickBooks Payroll', 'CSV'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-semibold hover:bg-emerald-500/20 transition-colors">
                    <Download className="w-4 h-4" /> Export to {exportTarget}
                  </button>
                </div>
              )}
              {activePeriod.status === 'Open' && (
                <button onClick={() => handleLockPeriod()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-400 border border-gray-700 rounded-lg text-sm font-semibold hover:border-gray-600 transition-colors opacity-50 cursor-not-allowed">
                  <Unlock className="w-4 h-4" /> Unlock (no-op when already Open)
                </button>
              )}
            </div>

            {exportFired && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 flex items-center gap-3 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Commission data exported to {activePeriod.payrollSystem}</p>
                  <p className="text-xs text-emerald-300/70 mt-0.5">Reference: {activePeriod.payrollRef} · {activePeriod.reps.length} reps · {fmt$(activePeriod.reps.reduce((s,r)=>s+r.commission,0))} total</p>
                </div>
              </div>
            )}

            {/* Rep Statement Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-violet-400" />
                  <span className="font-bold text-gray-200 text-sm">Rep Settlement Statements — {activePeriod.period}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {activePeriod.reps.filter(r=>r.acknowledged).length} of {activePeriod.reps.length} acknowledged
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rep</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acknowledged</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {activePeriod.reps.map(rep => (
                    <tr key={rep.name} className="hover:bg-gray-800/30">
                      <td className="px-5 py-3 font-bold text-gray-100">{rep.name}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-violet-400">{fmt$(rep.commission)}</td>
                      <td className="px-5 py-3 text-center">
                        {rep.acknowledged
                          ? <span className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> Signed</span>
                          : <span className="text-amber-400 text-xs font-semibold">Pending</span>}
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-gray-500">{rep.acknowledgedAt || '—'}</td>
                      <td className="px-5 py-3 text-center">
                        {!rep.acknowledged ? (
                          <button onClick={() => handleAcknowledge(rep.name)}
                            className="px-3 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-xs font-semibold hover:bg-violet-500/20 transition-colors">
                            <UserCheck className="w-3 h-3 inline mr-1" />Acknowledge
                          </button>
                        ) : (
                          <button className="px-3 py-1.5 bg-gray-800 text-gray-500 rounded-lg text-xs font-semibold border border-gray-700">
                            <Download className="w-3 h-3 inline mr-1" />Statement
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-900/60 border-t border-gray-800">
                    <td className="px-5 py-3 text-xs text-gray-500 font-semibold">Total</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-violet-400">
                      {fmt$(activePeriod.reps.reduce((s,r)=>s+r.commission,0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payroll export preview */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-gray-200 text-sm">Payroll Export Preview — CSV Format</span>
              </div>
              <div className="p-4 font-mono text-xs text-gray-400 bg-gray-950/50 overflow-x-auto">
                <div className="text-gray-600 mb-1">{/* ADP / Gusto / Paychex compatible format */}</div>
                <div className="text-emerald-400/70">RepID,Name,Period,Commission,Status,ExportDate</div>
                {activePeriod.reps.map((rep, i) => (
                  <div key={rep.name}>{`REP-0${i+1},${rep.name},${activePeriod.period},${rep.commission.toFixed(2)},${activePeriod.status},${activePeriod.exportedAt || TODAY}`}</div>
                ))}
                <div className="mt-1 text-gray-600">{`TOTAL,,,,${activePeriod.reps.reduce((s,r)=>s+r.commission,0).toFixed(2)},`}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: REPORTS
  // ─────────────────────────────────────────────────────────────────────────────
  const renderReports = () => {
    const totalAssets      = totalCash + totalAR;
    const totalLiabilities = totalAP;
    const equity           = totalAssets - totalLiabilities;
    const totalInflow      = invoices.reduce((s, i) => s + i.paid, 0);
    const totalOutflow     = checks.filter(c=>c.status!=='Void').reduce((s,c)=>s+c.amount,0) + expenses.reduce((s,e)=>s+e.amount,0);

    return (
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Sub-tabs */}
        <div className="flex gap-2 border-b border-gray-800 pb-0">
          {[['ledger','Transaction Ledger'],['aging','AP Aging'],['balance','Cash Flow & Balance Sheet'],['profitability','Customer Profitability']].map(([id,label]) => (
            <button key={id} onClick={() => setReportTab(id)}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${reportTab === id ? 'border-cyan-500 text-cyan-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Transaction Ledger */}
        {reportTab === 'ledger' && (
          <div className={UI.card}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold text-gray-200">Transaction Ledger</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={ledgerSearch} onChange={e => { const v = e.target.value; setLedgerSearch(v); }} placeholder="Search…" className={`${UI.input} pl-8 w-44`} />
              </div>
            </div>
            <table className="w-full">
              <thead className="border-b border-gray-800"><tr>
                {['Date','Description','GL Code','Type','Amount','Account'].map(h=><th key={h} className={UI.th}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-800/50">
                {allTransactions.map(t => {
                  const glName = glAccounts.find(g=>g.code===t.glCode)?.name ?? t.glCode;
                  return (
                    <tr key={t.id} className="hover:bg-gray-800/30">
                      <td className={UI.td}>{fmtDate(t.date)}</td>
                      <td className={UI.td}><span className="text-gray-200">{t.description}</span></td>
                      <td className={UI.td}><span className={UI.badgeGray}>{t.glCode}</span><span className="text-gray-500 text-xs ml-1">{glName}</span></td>
                      <td className={UI.td}><span className={t.type==='credit' ? UI.badgeGreen : UI.badgeRed}>{t.type}</span></td>
                      <td className={UI.td}><span className={`font-bold ${t.type==='credit'?'text-emerald-400':'text-rose-400'}`}>{t.type==='credit'?'+':'–'}{fmt(t.amount)}</span></td>
                      <td className={UI.td}><span className="text-gray-500 text-xs">{t.account}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* AP Aging */}
        {reportTab === 'aging' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Current (0–30 days)',  value: apAging.current, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: '31–60 days',           value: apAging.d30,     color: 'text-cyan-500',   bg: 'bg-cyan-500/10'   },
                { label: '61–90 days',           value: apAging.d60,     color: 'text-orange-400',  bg: 'bg-orange-500/10'  },
                { label: '90+ days Overdue',     value: apAging.d90,     color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
              ].map(b => (
                <div key={b.label} className={`${UI.cardPad}`}>
                  <p className="text-xs text-gray-500 font-semibold">{b.label}</p>
                  <p className={`text-2xl font-black mt-1 ${b.color}`}>{fmt(b.value)}</p>
                </div>
              ))}
            </div>
            <div className={UI.card}>
              <div className="px-5 py-4 border-b border-gray-800"><h3 className="font-bold text-gray-200">Vendor AP Summary</h3></div>
              <table className="w-full">
                <thead className="border-b border-gray-800"><tr>
                  {['Vendor','Contact','Payment Terms','Balance Owed','Age'].map(h=><th key={h} className={UI.th}>{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-800/50">
                  {vendors.map(v => {
                    const age = v.id === 'V001' ? 18 : v.id === 'V002' ? 35 : v.id === 'V003' ? 12 : v.id === 'V004' ? 28 : 5;
                    const ageBadge = age <= 30 ? UI.badgeGreen : age <= 60 ? UI.badgeAmber : UI.badgeRed;
                    return (
                      <tr key={v.id} className="hover:bg-gray-800/30">
                        <td className={UI.td}><span className="font-semibold text-gray-200">{v.name}</span></td>
                        <td className={UI.td}>{v.contact}</td>
                        <td className={UI.td}><span className={UI.badgeBlue}>{v.terms}</span></td>
                        <td className={UI.td}><span className="font-bold text-cyan-500">{fmt(v.balance)}</span></td>
                        <td className={UI.td}><span className={ageBadge}>{age}d</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cash Flow & Balance Sheet */}
        {reportTab === 'balance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Sheet */}
            <div className={UI.cardPad}>
              <h3 className={`${UI.sectionTitle} mb-5`}><BarChart3 className="w-4 h-4 text-cyan-500" /> Balance Sheet</h3>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Assets</p>
                {[
                  { label: 'Cash & Bank Accounts (1000)', value: totalCash },
                  { label: 'Accounts Receivable (1100)',  value: totalAR   },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-800/60">
                    <span className="text-sm text-gray-300">{row.label}</span>
                    <span className="text-sm font-bold text-emerald-400">{fmt(row.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold">
                  <span className="text-sm text-gray-200">Total Assets</span>
                  <span className="text-sm text-emerald-400">{fmt(totalAssets)}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 mb-2">Liabilities</p>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-sm text-gray-300">Accounts Payable (2000)</span>
                  <span className="text-sm font-bold text-rose-400">{fmt(totalLiabilities)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span className="text-sm text-gray-200">Total Liabilities</span>
                  <span className="text-sm text-rose-400">{fmt(totalLiabilities)}</span>
                </div>
                <div className="flex justify-between py-3 mt-2 border-t-2 border-cyan-500/30">
                  <span className="text-base font-black text-gray-100">Net Equity</span>
                  <span className={`text-base font-black ${equity>=0?'text-emerald-400':'text-rose-400'}`}>{fmt(equity)}</span>
                </div>
              </div>
            </div>

            {/* Cash Flow */}
            <div className={UI.cardPad}>
              <h3 className={`${UI.sectionTitle} mb-5`}><TrendingUp className="w-4 h-4 text-cyan-500" /> Cash Flow Summary</h3>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Inflows</p>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-sm text-gray-300">Customer Payments Received</span>
                  <span className="text-sm font-bold text-emerald-400">+{fmt(totalInflow)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold">
                  <span className="text-sm text-gray-200">Total Inflows</span>
                  <span className="text-sm text-emerald-400">{fmt(totalInflow)}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4 mb-2">Outflows</p>
                {[
                  { label: 'Checks Issued', value: checks.filter(c=>c.status!=='Void').reduce((s,c)=>s+c.amount,0) },
                  { label: 'Expenses',      value: expenses.reduce((s,e)=>s+e.amount,0) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-gray-800/60">
                    <span className="text-sm text-gray-300">{row.label}</span>
                    <span className="text-sm font-bold text-rose-400">–{fmt(row.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold">
                  <span className="text-sm text-gray-200">Total Outflows</span>
                  <span className="text-sm text-rose-400">–{fmt(totalOutflow)}</span>
                </div>
                <div className="flex justify-between py-3 mt-2 border-t-2 border-cyan-500/30">
                  <span className="text-base font-black text-gray-100">Net Cash Flow</span>
                  <span className={`text-base font-black ${totalInflow-totalOutflow>=0?'text-emerald-400':'text-rose-400'}`}>{fmt(totalInflow-totalOutflow)}</span>
                </div>
              </div>
              {/* Per-account balances */}
              <div className="mt-6 space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Balances</p>
                {bankAccounts.map(ba => (
                  <div key={ba.id} className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <div>
                      <p className="text-sm text-gray-300 font-medium">{ba.name}</p>
                      <p className="text-xs text-gray-600">{ba.bank}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{fmt(ba.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportTab === 'profitability' && renderCustomerProfitability()}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MODALS
  // ─────────────────────────────────────────────────────────────────────────────
  const renderModals = () => {
    if (!modal.type) return null;

    // Vendor modal
    // ── View Vendor Detail ───────────────────────────────────────────────────────
    if (modal.type === 'viewVendor') {
      const v = modal.vendor;
      const vendorPOs = INIT_AP_POS.filter(p => p.vendorId === v.id);
      const openPOs   = vendorPOs.filter(p => p.status !== 'Received' && p.status !== 'Cancelled');
      const balanceFromPOs = openPOs.reduce((s, p) => s + (p.total - p.paid), 0);
      const statusColors = {
        'Draft':             'text-gray-500 bg-gray-100 border-gray-300',
        'Approved':          'text-cyan-700 bg-cyan-50 border-cyan-200',
        'Sent':              'text-sky-700 bg-sky-50 border-sky-200',
        'Partially Received':'text-violet-700 bg-violet-50 border-violet-200',
        'Received':          'text-emerald-700 bg-emerald-50 border-emerald-200',
        'Cancelled':         'text-rose-600 bg-rose-50 border-rose-200',
      };
      return (
        <Overlay>
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl flex-shrink-0">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-600" /> {v.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { closeModal(); setTimeout(() => { setCheckForm(prev => ({ ...prev, payee: v.name })); setModal({ type:'check' }); }, 100); }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white text-sm font-bold rounded-lg hover:bg-cyan-500 transition-colors">
                  <Printer className="w-3.5 h-3.5" /> Write Check
                </button>
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Vendor info + balance side by side */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs font-bold uppercase text-gray-400 mb-0.5">Contact</p><p className="font-semibold text-gray-800">{v.contact}</p></div>
                  <div><p className="text-xs font-bold uppercase text-gray-400 mb-0.5">Phone</p><p className="text-gray-700">{v.phone}</p></div>
                  <div><p className="text-xs font-bold uppercase text-gray-400 mb-0.5">Email</p><p className="text-gray-700">{v.email}</p></div>
                  <div><p className="text-xs font-bold uppercase text-gray-400 mb-0.5">Terms</p><p className="font-semibold text-gray-800">{v.terms}</p></div>
                  <div className="col-span-2"><p className="text-xs font-bold uppercase text-gray-400 mb-0.5">Address</p><p className="text-gray-600 text-xs">{v.address}</p></div>
                </div>
                <div className="border-2 border-gray-900 rounded-xl p-4 text-center flex flex-col justify-center">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Balance Owed</p>
                  <p className={`text-3xl font-black ${v.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(v.balance)}</p>
                  <p className="text-xs text-gray-400 mt-1">{openPOs.length} open PO{openPOs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* POs contributing to balance */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-cyan-600" /> Purchase Orders — Balance Breakdown
                  </h3>
                  <span className="text-xs text-gray-400">Showing {openPOs.length} open · {vendorPOs.length - openPOs.length} closed</span>
                </div>

                {openPOs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                    No open purchase orders for this vendor.
                  </div>
                ) : (
                  <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
                    <thead className="bg-gray-900 text-white">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">PO Number</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">Ordered</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">Delivery</th>
                        <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">Status</th>
                        <th className="px-4 py-2.5 text-right text-xs font-bold uppercase">PO Total</th>
                        <th className="px-4 py-2.5 text-right text-xs font-bold uppercase">Paid</th>
                        <th className="px-4 py-2.5 text-right text-xs font-bold uppercase">Balance</th>
                        <th className="px-4 py-2.5 text-center text-xs font-bold uppercase"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {openPOs.map((po, i) => {
                        const bal = po.total - po.paid;
                        return (
                          <tr key={po.poNumber} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-cyan-50 transition-colors`}>
                            <td className="px-4 py-3">
                              <p className="font-mono font-bold text-cyan-700 text-xs">{po.poNumber}</p>
                              {po.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{po.notes}</p>}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{po.orderedDate}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{po.deliveryDate}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[po.status] ?? 'text-gray-500'}`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(po.total)}</td>
                            <td className="px-4 py-3 text-right text-emerald-700 font-medium">{po.paid > 0 ? fmt(po.paid) : <span className="text-gray-300">—</span>}</td>
                            <td className="px-4 py-3 text-right font-black text-rose-600">{fmt(bal)}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => { closeModal(); setTimeout(() => setModal({ type:'viewAPPO', po }), 50); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-cyan-100 text-gray-700 hover:text-cyan-700 text-xs font-bold rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors">
                                <Eye className="w-3 h-3" /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={6} className="px-4 py-2.5 text-right text-xs font-black uppercase text-gray-600">Total Balance Due</td>
                        <td className="px-4 py-2.5 text-right font-black text-rose-600 text-sm">{fmt(balanceFromPOs)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* All POs if some are closed */}
              {vendorPOs.length > openPOs.length && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-400 hover:text-gray-600 font-semibold text-xs uppercase tracking-wide py-1">
                    Show {vendorPOs.length - openPOs.length} closed / received PO{vendorPOs.length - openPOs.length !== 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {vendorPOs.filter(p => p.status === 'Received' || p.status === 'Cancelled').map(po => (
                      <div key={po.poNumber} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                        <span className="font-mono font-bold text-gray-500">{po.poNumber}</span>
                        <span className="text-gray-400">{po.notes}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[po.status] ?? ''}`}>{po.status}</span>
                        <span className="font-bold text-gray-600">{fmt(po.total)}</span>
                        <button onClick={() => { closeModal(); setTimeout(() => setModal({ type:'viewAPPO', po }), 50); }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded font-bold transition-colors">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </Overlay>
      );
    }

    // ── View AP Purchase Order (full document from INIT_AP_POS) ────────────────────
    if (modal.type === 'viewAPPO') {
      const po = modal.po;
      const v  = INIT_VENDORS.find(v => v.id === po.vendorId);
      const subtotal = po.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
      const balance  = po.total - po.paid;
      const statusColors = {
        'Approved':          'text-cyan-700','Sent':'text-sky-600',
        'Partially Received':'text-violet-600','Received':'text-emerald-600',
        'Draft':'text-gray-500','Cancelled':'text-rose-600',
      };
      return (
        <Overlay>
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            {/* Action bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cyan-600" /> PO — {po.poNumber}
              </h2>
              <div className="flex items-center gap-2">
                <PrintButton variant="light" />
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-black text-gray-900">{COMPANY_INFO.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{COMPANY_INFO.address} · {COMPANY_INFO.city}</p>
                  <p className="text-sm text-gray-500">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
                </div>
                <div className="border-2 border-gray-900 rounded-xl p-4 text-right min-w-[210px]">
                  <p className="text-xl font-black text-gray-900 mb-3">PURCHASE ORDER</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-6"><span className="text-gray-500">PO Number</span><span className="font-bold">{po.poNumber}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Order Date</span><span className="font-bold">{po.orderedDate}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Req. Delivery</span><span className="font-bold text-cyan-700">{po.deliveryDate}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Status</span><span className={`font-bold ${statusColors[po.status] ?? 'text-gray-500'}`}>{po.status}</span></div>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-gray-900" />
              {/* Vendor + Ship-to */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Vendor / Ship From</p>
                  <p className="font-bold text-gray-900 text-base">{po.vendorName}</p>
                  {v && <>
                    <p className="text-sm text-gray-500">Attn: {v.contact}</p>
                    <p className="text-sm text-gray-500">{v.email} · {v.phone}</p>
                    <p className="text-xs text-gray-400 mt-1">Terms: {v.terms}</p>
                  </>}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Ship To / Bill To</p>
                  <p className="font-bold text-gray-900">{COMPANY_INFO.name}</p>
                  <p className="text-sm text-gray-500">{COMPANY_INFO.address}</p>
                  <p className="text-sm text-gray-500">New Orleans, LA 70123</p>
                  {po.notes && <p className="text-xs text-gray-400 italic mt-1">Note: {po.notes}</p>}
                </div>
              </div>
              {/* Line items */}
              <table className="w-full border border-gray-300 rounded-xl overflow-hidden text-sm">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase">Vendor Code</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase">Internal SKU</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase">Description</th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold uppercase">UOM</th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase">Qty</th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase">Unit Price</th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase">Extended</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-cyan-700 text-xs">{item.vendorProductCode}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-500 text-xs">{item.sku}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{item.description}</td>
                      <td className="px-3 py-2.5 text-center text-gray-500 text-xs uppercase">{item.uom}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900">{item.qty}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{fmt(item.unitCost)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900">{fmt(item.qty * item.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
                  {po.paid > 0 && <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">Payments Applied</span><span className="text-emerald-600 font-medium">– {fmt(po.paid)}</span></div>}
                  <div className="flex justify-between py-2 font-black text-base border-t-2 border-gray-900">
                    <span>Balance Due</span>
                    <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>{fmt(balance)}</span>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 space-y-1">
                <p>Reference PO Number <strong className="text-gray-600">{po.poNumber}</strong> on all invoices and remittance.</p>
                <p>Questions? Contact <strong className="text-gray-600">{COMPANY_INFO.email}</strong> · {COMPANY_INFO.phone}</p>
              </div>
              {/* Signature lines */}
              <div className="grid grid-cols-2 gap-12 pt-2">
                <div><div className="border-b-2 border-gray-900 mb-1 h-8"/><p className="text-xs text-gray-400">Authorized Buyer Signature &amp; Date</p></div>
                <div><div className="border-b-2 border-gray-900 mb-1 h-8"/><p className="text-xs text-gray-400">Vendor Acknowledgment &amp; Date</p></div>
              </div>
            </div>
          </div>
        </Overlay>
      );
    }

    // ── View Invoice (Customer AR document) ─────────────────────────────────────
    if (modal.type === 'viewInvoice') {
      const inv = modal.invoice;
      const balance = inv.amount - inv.paid;
      const statusColor = { Paid:'text-emerald-600', Open:'text-sky-600', Overdue:'text-rose-600', Partial:'text-cyan-600' }[inv.status] ?? 'text-gray-600';
      const hasItems = Array.isArray(inv.items) && inv.items.length > 0;
      const subtotal = hasItems
        ? (typeof inv.subtotal === 'number' ? inv.subtotal : inv.items.reduce((s, it) => s + ((Number(it.qty)||0) * (Number(it.unitPrice)||0)), 0))
        : inv.amount;
      const tax = typeof inv.tax === 'number' ? inv.tax : 0;
      const freight = typeof inv.freight === 'number' ? inv.freight : 0;
      return (
        <Overlay>
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
            {/* Action bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" /> Invoice — {inv.id}
              </h2>
              <div className="flex items-center gap-2">
                <PrintButton variant="light" />
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Document */}
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-black text-gray-900">{COMPANY_INFO.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{COMPANY_INFO.address}</p>
                  <p className="text-sm text-gray-500">{COMPANY_INFO.city}</p>
                  <p className="text-sm text-gray-500">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Tax ID: {COMPANY_INFO.taxId}</p>
                </div>
                <div className="border-2 border-gray-900 rounded-xl p-4 text-right min-w-[220px]">
                  <p className="text-xl font-black text-gray-900 mb-3">INVOICE</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Invoice #</span><span className="font-bold">{inv.id}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Date</span><span className="font-bold">{fmtDate(inv.date)}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Due Date</span><span className={`font-bold ${inv.status === 'Overdue' ? 'text-rose-600' : ''}`}>{fmtDate(inv.dueDate)}</span></div>
                    {inv.terms && <div className="flex justify-between gap-6"><span className="text-gray-500">Terms</span><span className="font-bold">{inv.terms}</span></div>}
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Status</span><span className={`font-bold ${statusColor}`}>{inv.status}</span></div>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-gray-900" />
              {/* Bill To */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
                  <p className="font-bold text-gray-900 text-lg">{inv.customer}</p>
                  {inv.billTo?.contact && <p className="text-sm text-gray-600">{inv.billTo.contact}</p>}
                  {inv.billTo?.address && <p className="text-sm text-gray-500">{inv.billTo.address}</p>}
                  {inv.billTo?.city && <p className="text-sm text-gray-500">{inv.billTo.city}</p>}
                  {inv.billTo?.email && <p className="text-sm text-gray-500 mt-1">{inv.billTo.email}</p>}
                </div>
                <div className="text-right text-xs text-gray-500 space-y-1">
                  <p><strong className="text-gray-700">Source:</strong> {inv.source}</p>
                  {inv.glCode && <p><strong className="text-gray-700">GL Account:</strong> {inv.glCode}</p>}
                  {inv.customerId && <p><strong className="text-gray-700">Account #:</strong> {inv.customerId}</p>}
                </div>
              </div>
              {/* Line items */}
              <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-xs uppercase w-20">SKU</th>
                    <th className="px-3 py-2 text-left font-bold text-xs uppercase">Description</th>
                    <th className="px-3 py-2 text-right font-bold text-xs uppercase w-16">Qty</th>
                    <th className="px-3 py-2 text-left font-bold text-xs uppercase w-14">UOM</th>
                    <th className="px-3 py-2 text-right font-bold text-xs uppercase w-24">Unit Price</th>
                    <th className="px-3 py-2 text-right font-bold text-xs uppercase w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hasItems ? inv.items.map((it, idx) => {
                    // Catch-weight lines render the cases-ordered + actual-lb breakdown
                    // so the customer can verify they're being billed by delivered weight.
                    if (it.isCatchWeight) {
                      const cases    = it.casesOrdered ?? '—';
                      const billedLb = it.actualWeight ?? it.estimatedWeight ?? Number(it.qty) ?? 0;
                      const usingEst = !it.actualWeight && it.estimatedWeight;
                      const ppl      = Number(it.pricePerLb) || 0;
                      const total    = billedLb * ppl;
                      return (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2 font-mono text-xs text-gray-500 align-top">{it.sku || '—'}</td>
                          <td className="px-3 py-2 text-gray-800 align-top">
                            <div>{it.description}</div>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-600 mt-0.5">Catch weight</div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 align-top">
                            <div className="text-gray-700">{cases} ca</div>
                            <div className={`text-[11px] mt-0.5 font-bold ${usingEst ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {Number(billedLb).toFixed(1)} lb{usingEst ? ' est' : ''}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs uppercase align-top">lb</td>
                          <td className="px-3 py-2 text-right text-gray-700 align-top">${ppl.toFixed(2)}/lb</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900 align-top">{fmt(total)}</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{it.sku || '—'}</td>
                        <td className="px-3 py-2 text-gray-800">{it.description}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{it.qty}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs uppercase">{it.uom || ''}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{fmt(it.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">{fmt((Number(it.qty)||0) * (Number(it.unitPrice)||0))}</td>
                      </tr>
                    );
                  }) : (
                    <tr className="bg-white">
                      <td className="px-3 py-3 font-mono text-xs text-gray-400">—</td>
                      <td className="px-3 py-3 text-gray-800" colSpan={4}>Food Service Products &amp; Supplies — {fmtDate(inv.date)}</td>
                      <td className="px-3 py-3 text-right font-bold text-gray-900">{fmt(inv.amount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
                  {tax > 0 && <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">Sales Tax{inv.taxRate ? ` (${inv.taxRate}%)` : ''}</span><span className="font-medium">{fmt(tax)}</span></div>}
                  {freight > 0 && <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">Freight / Other</span><span className="font-medium">{fmt(freight)}</span></div>}
                  <div className="flex justify-between py-1 border-b-2 border-gray-900 font-bold"><span className="text-gray-700">Invoice Total</span><span>{fmt(inv.amount)}</span></div>
                  {inv.paid > 0 && <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">Payments Applied</span><span className="font-medium text-emerald-600">– {fmt(inv.paid)}</span></div>}
                  <div className="flex justify-between py-2 font-black text-base">
                    <span>Balance Due</span><span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>{fmt(balance)}</span>
                  </div>
                </div>
              </div>
              {/* Remittance */}
              {inv.notes && (
                <div className="border-t border-gray-200 pt-3 text-xs text-gray-500">
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">Memo</p>
                  <p className="italic">{inv.notes}</p>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4 text-xs text-gray-400 space-y-1">
                <p>Please remit payment by <strong className="text-gray-600">{fmtDate(inv.dueDate)}</strong>. Reference invoice <strong className="text-gray-600">{inv.id}</strong> on all payments.</p>
                <p>Make checks payable to <strong className="text-gray-600">{COMPANY_INFO.name}</strong>. Questions? Contact <strong className="text-gray-600">{COMPANY_INFO.email}</strong> · {COMPANY_INFO.phone}</p>
              </div>
              {/* Pay now if unpaid */}
              {balance > 0 && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { closeModal(); setTimeout(() => { setPayForm({ amount: String(balance), date: TODAY, notes:'' }); setModal({ type:'payment', invoice: inv }); }, 100); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition-colors">
                    <DollarSign className="w-4 h-4" /> Record Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </Overlay>
      );
    }

    // ── View Expense (expense voucher) ───────────────────────────────────────────
    if (modal.type === 'viewExpense') {
      const ex = modal.expense;
      const glName = glAccounts.find(g => g.code === ex.glCode)?.name ?? ex.glCode;
      const acct = bankAccounts.find(a => a.id === ex.accountId);
      return (
        <Overlay>
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-600" /> Expense Voucher — {ex.id}
              </h2>
              <div className="flex items-center gap-2">
                <PrintButton variant="light" />
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-8 space-y-5">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xl font-black text-gray-900">{COMPANY_INFO.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{COMPANY_INFO.address} · {COMPANY_INFO.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Expense Voucher</p>
                  <p className="font-bold text-gray-900 text-lg">{ex.id}</p>
                </div>
              </div>
              <div className="border-t-2 border-gray-900" />
              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs font-bold uppercase text-gray-400 mb-1">Date</p><p className="font-semibold text-gray-900">{fmtDate(ex.date)}</p></div>
                <div><p className="text-xs font-bold uppercase text-gray-400 mb-1">Vendor / Payee</p><p className="font-semibold text-gray-900">{ex.vendor}</p></div>
                <div><p className="text-xs font-bold uppercase text-gray-400 mb-1">GL Account</p><p className="font-semibold text-gray-900">{ex.glCode} — {glName}</p></div>
                <div><p className="text-xs font-bold uppercase text-gray-400 mb-1">Paid From</p><p className="font-semibold text-gray-900">{acct?.name ?? ex.accountId}</p></div>
              </div>
              {/* Description box */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-bold uppercase text-gray-400 mb-1">Description / Memo</p>
                <p className="text-sm text-gray-800 font-medium">{ex.description}</p>
              </div>
              {/* Amount */}
              <div className="flex justify-end">
                <div className="border-2 border-gray-900 rounded-xl px-6 py-4 text-right">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Total Expense</p>
                  <p className="text-3xl font-black text-gray-900">{fmt(ex.amount)}</p>
                </div>
              </div>
              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-12">
                <div><div className="border-b-2 border-gray-900 mb-1 h-8" /><p className="text-xs text-gray-400">Approved By &amp; Date</p></div>
                <div><div className="border-b-2 border-gray-900 mb-1 h-8" /><p className="text-xs text-gray-400">Received By &amp; Date</p></div>
              </div>
            </div>
          </div>
        </Overlay>
      );
    }

    // ── View Purchase Order (AP document) ────────────────────────────────────────
    if (modal.type === 'viewPO') {
      const po = modal.po;
      const mockLineItems = {
        'PO-2024-0881': [
          { vendorProductCode:'GCP-SHR-1620', sku:'PROT-001', description:'Gulf Shrimp 16/20 ct 5lb Block', uom:'case', qty:20, unitCost:42.50 },
          { vendorProductCode:'GCP-CHK-BNL',  sku:'PROT-002', description:'Chicken Breast Boneless 10lb',   uom:'case', qty:40, unitCost:28.75 },
        ],
        'PO-2024-0882': [
          { vendorProductCode:'SPC-TOM-RMA', sku:'PRO-TOMA-01', description:'Roma Tomatoes 25lb Case',   uom:'case', qty:30, unitCost:18.00 },
          { vendorProductCode:'SPC-POT-RST', sku:'PRO-POT-01',  description:'Russet Potatoes 50lb Bag', uom:'bag',  qty:50, unitCost:22.00 },
        ],
        'PO-2024-0879': [
          { vendorProductCode:'DFD-CRM-1QT', sku:'DAI-CRM-01', description:'Heavy Cream 1QT / 12ct',      uom:'case', qty:24, unitCost:36.00 },
          { vendorProductCode:'DFD-BUT-UNS', sku:'DAI-BUT-01', description:'Butter Unsalted 1lb / 36ct',  uom:'case', qty:48, unitCost:52.00 },
        ],
      };
      const items = mockLineItems[po.poNumber] || [];
      const subtotal = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
      const balance  = po.total - po.paid;
      const statusColors = { 'Approved':'text-cyan-700','Sent':'text-sky-600','Partially Received':'text-violet-600','Received':'text-emerald-600','Draft':'text-gray-500','Cancelled':'text-rose-600' };
      return (
        <Overlay>
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cyan-600" /> Purchase Order — {po.poNumber}
              </h2>
              <div className="flex items-center gap-2">
                <PrintButton variant="light" />
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-black text-gray-900">{COMPANY_INFO.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{COMPANY_INFO.address} · {COMPANY_INFO.city}</p>
                  <p className="text-sm text-gray-500">{COMPANY_INFO.phone} · {COMPANY_INFO.email}</p>
                </div>
                <div className="border-2 border-gray-900 rounded-xl p-4 text-right min-w-[200px]">
                  <p className="text-xl font-black text-gray-900 mb-3">PURCHASE ORDER</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-6"><span className="text-gray-500">PO Number</span><span className="font-bold">{po.poNumber}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Order Date</span><span className="font-bold">{po.ordered}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Req. Delivery</span><span className="font-bold text-cyan-700">{po.delivery}</span></div>
                    <div className="flex justify-between gap-6"><span className="text-gray-500">Status</span><span className={`font-bold ${statusColors[po.status] ?? 'text-gray-500'}`}>{po.status}</span></div>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-gray-900" />
              {/* Vendor / Ship-to */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Vendor / Ship From</p>
                  <p className="font-bold text-gray-900 text-lg">{po.vendor}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Ship To / Bill To</p>
                  <p className="font-bold text-gray-900">{COMPANY_INFO.name}</p>
                  <p className="text-sm text-gray-500">{COMPANY_INFO.address}</p>
                  <p className="text-sm text-gray-500">New Orleans, LA 70123</p>
                </div>
              </div>
              {/* Line items */}
              {items.length > 0 ? (
                <table className="w-full border border-gray-300 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-gray-900 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-xs uppercase">#</th>
                      <th className="px-3 py-2 text-left font-bold text-xs uppercase">Vendor Code</th>
                      <th className="px-3 py-2 text-left font-bold text-xs uppercase">Internal SKU</th>
                      <th className="px-3 py-2 text-left font-bold text-xs uppercase">Description</th>
                      <th className="px-3 py-2 text-center font-bold text-xs uppercase">UOM</th>
                      <th className="px-3 py-2 text-right font-bold text-xs uppercase">Qty</th>
                      <th className="px-3 py-2 text-right font-bold text-xs uppercase">Unit Price</th>
                      <th className="px-3 py-2 text-right font-bold text-xs uppercase">Extended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2.5 text-gray-400 text-xs">{i+1}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-cyan-700 text-xs">{item.vendorProductCode}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-500 text-xs">{item.sku}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-900">{item.description}</td>
                        <td className="px-3 py-2.5 text-center text-gray-500 text-xs uppercase">{item.uom}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-gray-900">{item.qty}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{fmt(item.unitCost)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-gray-900">{fmt(item.qty * item.unitCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-gray-200">Line item detail available in the Procurement module.</div>
              )}
              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-60 space-y-1 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">PO Total</span><span className="font-medium">{fmt(po.total)}</span></div>
                  {po.paid > 0 && <div className="flex justify-between py-1 border-b border-gray-200"><span className="text-gray-500">Invoiced / Paid</span><span className="font-medium text-emerald-600">{fmt(po.paid)}</span></div>}
                  <div className="flex justify-between py-2 font-black text-base border-t-2 border-gray-900">
                    <span>Balance Due</span><span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>{fmt(balance)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 text-xs text-gray-400">
                <p>Reference PO Number <strong className="text-gray-600">{po.poNumber}</strong> on all invoices and correspondence.</p>
              </div>
            </div>
          </div>
        </Overlay>
      );
    }

    if (modal.type === 'vendor') return (
      <Overlay>
        <ModalBox>
          <ModalHeader title={vendorForm.id ? 'Edit Vendor' : 'New Vendor'} icon={Building2} onClose={closeModal} />
          <form onSubmit={handleSaveVendor} className="p-6 space-y-4 overflow-auto">
            <div><label className={UI.label}>Company Name *</label>
              <input required className={UI.input} value={vendorForm.name} onChange={e=>{const v=e.target.value;setVF('name',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Contact Person</label>
                <input className={UI.input} value={vendorForm.contact} onChange={e=>{const v=e.target.value;setVF('contact',v);}} /></div>
              <div><label className={UI.label}>Phone</label>
                <input className={UI.input} value={vendorForm.phone} onChange={e=>{const v=e.target.value;setVF('phone',v);}} /></div>
            </div>
            <div><label className={UI.label}>Email</label>
              <input type="email" className={UI.input} value={vendorForm.email} onChange={e=>{const v=e.target.value;setVF('email',v);}} /></div>
            <div><label className={UI.label}>Address</label>
              <input className={UI.input} value={vendorForm.address} onChange={e=>{const v=e.target.value;setVF('address',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Payment Terms</label>
                <select className={UI.select} value={vendorForm.terms} onChange={e=>{const v=e.target.value;setVF('terms',v);}}>
                  {['Due on Receipt','Net 15','Net 30','Net 45','Net 60'].map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className={UI.label}>Current Balance Owed</label>
                <input type="number" step="0.01" min="0" className={UI.input} value={vendorForm.balance} onChange={e=>{const v=e.target.value;setVF('balance',v);}} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
              <button type="submit" className={UI.btnPrimary}><Save className="w-4 h-4" /> {vendorForm.id ? 'Update' : 'Create'} Vendor</button>
            </div>
          </form>
        </ModalBox>
      </Overlay>
    );

    // Write Check modal
    if (modal.type === 'check') return (
      <Overlay>
        <ModalBox>
          <ModalHeader title="Write Check" icon={CreditCard} onClose={closeModal} />
          <form onSubmit={handleWriteCheck} className="p-6 space-y-4 overflow-auto">
            <div><label className={UI.label}>Pay To *</label>
              <input required className={UI.input} placeholder="Payee name" value={checkForm.payee} onChange={e=>{const v=e.target.value;setCF('payee',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Amount *</label>
                <input required type="number" step="0.01" min="0.01" className={UI.input} placeholder="0.00" value={checkForm.amount} onChange={e=>{const v=e.target.value;setCF('amount',v);}} /></div>
              <div><label className={UI.label}>Date</label>
                <input type="date" className={UI.input} value={checkForm.date} onChange={e=>{const v=e.target.value;setCF('date',v);}} /></div>
            </div>
            <div><label className={UI.label}>Memo / Description</label>
              <input className={UI.input} placeholder="PO number, invoice reference…" value={checkForm.memo} onChange={e=>{const v=e.target.value;setCF('memo',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Bank Account</label>
                <select className={UI.select} value={checkForm.accountId} onChange={e=>{const v=e.target.value;setCF('accountId',v);}}>
                  {bankAccounts.map(a=><option key={a.id} value={a.id}>{a.name} ({fmt(a.balance)})</option>)}
                </select></div>
              <div><label className={UI.label}>GL Code</label>
                <select className={UI.select} value={checkForm.glCode} onChange={e=>{const v=e.target.value;setCF('glCode',v);}}>
                  {glAccounts.map(g=><option key={g.code} value={g.code}>{g.code} – {g.name}</option>)}
                </select></div>
            </div>
            {checkForm.amount && <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-sm text-gray-400 italic">
              "{numberToWords(parseFloat(checkForm.amount) || 0)} Dollars"
            </div>}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
              <button type="submit" className={UI.btnPrimary}><Check className="w-4 h-4" /> Write Check</button>
            </div>
          </form>
        </ModalBox>
      </Overlay>
    );

    // Print Check preview modal
    if (modal.type === 'printCheck') {
      const chk = modal.check;
      const ba  = bankAccounts.find(a => a.id === chk.accountId);
      return (
        <Overlay>
          <ModalBox wide>
            <ModalHeader title={`Print Check #${chk.num}`} icon={Printer} onClose={closeModal} />
            <div className="p-6 overflow-auto">
              {/* Check preview */}
              <div className="bg-white text-black rounded-xl p-6 font-sans text-sm max-w-2xl mx-auto border-2 border-gray-200">
                {/* Stub */}
                <div className="flex justify-between items-start border border-gray-300 bg-gray-50 p-3 rounded mb-1 text-xs">
                  <div>
                    <p className="font-bold text-sm">{COMPANY_INFO.name}</p>
                    <p className="text-gray-500">Check #{chk.num} &nbsp;·&nbsp; {chk.date} &nbsp;·&nbsp; {ba?.name}</p>
                    <p className="text-gray-500 mt-1">Memo: {chk.memo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-xl font-black">{fmt(chk.amount)}</p>
                  </div>
                </div>
                {/* The Check */}
                <div className="border-2 border-gray-800 p-5 rounded mb-1">
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="font-black text-base">KERNAL FOOD DISTRIBUTION</p>
                      <p className="text-xs text-gray-500">1234 Warehouse Blvd · Chicago, IL 60601 · (312) 555-0100</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-base">No. {String(chk.num).padStart(4,'0')}</p>
                      <p className="text-xs">Date: {chk.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-2 mb-2">
                    <span className="text-xs font-bold whitespace-nowrap">PAY TO THE ORDER OF</span>
                    <span className="flex-1 font-bold text-base">{chk.payee}</span>
                    <span className="border-2 border-gray-800 px-4 py-1 font-black text-base whitespace-nowrap">$ {chk.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="flex-1 border-b border-gray-800 text-sm pb-1">{numberToWords(chk.amount)} .....</span>
                    <span className="text-xs font-bold">DOLLARS</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                      <p className="font-bold text-gray-700">{ba?.bank ?? 'First National Bank'}</p>
                      <p>Chicago, IL</p>
                    </div>
                    <div className="text-right">
                      <div className="border-t-2 border-gray-800 w-48 mb-1" />
                      <p className="text-xs">AUTHORIZED SIGNATURE</p>
                      <p className="text-xs text-gray-400 mt-1">FOR: {chk.memo}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-300 font-mono text-sm tracking-widest text-gray-700">
                    ⑆{ba?.routing ?? '071000013'}⑆ {ba?.number ?? '****4521'} &nbsp; ⑈{String(chk.num).padStart(6,'0')}⑈
                  </div>
                </div>
                {/* Bottom stub */}
                <div className="flex justify-between items-start border border-gray-300 bg-gray-50 p-3 rounded text-xs">
                  <div>
                    <p className="font-bold">{chk.payee} – Remittance Copy</p>
                    <p className="text-gray-500">Check #{chk.num} &nbsp;·&nbsp; {chk.date}</p>
                    <p className="text-gray-500 mt-1">Memo: {chk.memo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Amount Enclosed</p>
                    <p className="text-lg font-black">{fmt(chk.amount)}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <button onClick={handlePrintCheck} className={UI.btnPrimary}><Printer className="w-4 h-4" /> Open Print Dialog</button>
                <button onClick={closeModal} className={UI.btnGhost}>Close</button>
              </div>
            </div>
          </ModalBox>
        </Overlay>
      );
    }

    // ── Invoice Builder modal (full line-item invoice) ─────────────────────────
    if (modal.type === 'invBuilder') {
      const cust = BILLING_CUSTOMERS.find(c => c.id === invBuilder.customerId);
      const filteredCatalog = INVOICE_CATALOG.filter(c => {
        const q = invBuilderCatalogSearch.toLowerCase();
        if (!q) return true;
        return c.sku.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      });
      return (
        <Overlay>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden">
            <ModalHeader title="Invoice Builder" icon={FileText} onClose={closeModal} />
            <form onSubmit={handleCreateInvoiceFromBuilder} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Top section: customer + meta */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className={UI.label}>Bill To *</label>
                  <select required className={UI.select} value={invBuilder.customerId} onChange={e => {
                    const id = e.target.value;
                    const c = BILLING_CUSTOMERS.find(x => x.id === id);
                    setInvBuilder(prev => ({ ...prev, customerId: id, terms: c?.terms || prev.terms, taxRate: c?.taxRate ?? prev.taxRate }));
                  }}>
                    <option value="">Select customer…</option>
                    {BILLING_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {cust && (
                    <div className="mt-2 p-3 rounded-lg border border-gray-800 bg-gray-800/40 text-xs text-gray-300 space-y-0.5">
                      <p className="font-bold text-gray-200">{cust.name}</p>
                      <p className="text-gray-400">{cust.contact} · {cust.email}</p>
                      <p className="text-gray-500">{cust.address}, {cust.city}</p>
                      <p className="text-gray-500">{cust.phone}</p>
                    </div>
                  )}
                </div>
                <div className="col-span-6 grid grid-cols-2 gap-3">
                  <div>
                    <label className={UI.label}>Invoice Date</label>
                    <input type="date" className={UI.input} value={invBuilder.date} onChange={e=>setIB('date', e.target.value)} />
                  </div>
                  <div>
                    <label className={UI.label}>Due Date</label>
                    <input type="date" className={UI.input} value={invBuilder.dueDate} onChange={e=>setIB('dueDate', e.target.value)} placeholder="Auto from terms" />
                  </div>
                  <div>
                    <label className={UI.label}>Terms</label>
                    <select className={UI.select} value={invBuilder.terms} onChange={e=>setIB('terms', e.target.value)}>
                      {['Due on Receipt','Net 15','Net 30','Net 45','Net 60'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={UI.label}>Source</label>
                    <select className={UI.select} value={invBuilder.source} onChange={e=>setIB('source', e.target.value)}>
                      {['Manual','B2B','Field Sales','Logistics'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={UI.label}>GL Code</label>
                    <select className={UI.select} value={invBuilder.glCode} onChange={e=>setIB('glCode', e.target.value)}>
                      {glAccounts.filter(g=>g.type==='Revenue').map(g=><option key={g.code} value={g.code}>{g.code} – {g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={UI.label}>Tax Rate (%)</label>
                    <input type="number" step="0.01" min="0" className={UI.input} value={invBuilder.taxRate} onChange={e=>setIB('taxRate', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/40 flex items-center justify-between">
                  <h4 className="font-bold text-gray-200 text-sm flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-cyan-500" /> Line Items
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                      <input placeholder="Quick-add from catalog…" value={invBuilderCatalogSearch} onChange={e=>setInvBuilderCatalogSearch(e.target.value)} className={`${UI.inputSm} pl-8 w-60`} />
                    </div>
                    <button type="button" onClick={addIBLine} className={UI.btnSecondary}>
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </div>
                </div>
                {invBuilderCatalogSearch && filteredCatalog.length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-800 bg-gray-900/60 max-h-32 overflow-y-auto">
                    {filteredCatalog.slice(0, 6).map(c => (
                      <button type="button" key={c.sku}
                        onClick={() => { addIBFromCatalog(c); setInvBuilderCatalogSearch(''); }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-cyan-500/10 text-left text-sm">
                        <span className="text-gray-200 flex items-center gap-2 min-w-0">
                          <span className="text-gray-500 font-mono text-xs">{c.sku}</span>
                          <span className="truncate">{c.description}</span>
                          {c.isCatchWeight && (
                            <span className="text-[9px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">CW</span>
                          )}
                        </span>
                        <span className="text-cyan-400 font-semibold shrink-0">
                          {c.isCatchWeight ? `${fmt(c.pricePerLb)} / lb` : `${fmt(c.unitPrice)} / ${c.uom}`}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <table className="w-full">
                  <thead className="bg-gray-950/60 border-b border-gray-800">
                    <tr>
                      <th className={`${UI.th} w-24`}>SKU</th>
                      <th className={UI.th}>Description</th>
                      <th className={`${UI.th} w-20`}>UOM</th>
                      <th className={`${UI.th} w-20 text-right`}>Qty</th>
                      <th className={`${UI.th} w-28 text-right`}>Unit Price</th>
                      <th className={`${UI.th} w-28 text-right`}>Line Total</th>
                      <th className={`${UI.th} w-10`}></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {invBuilder.items.map((it, idx) => {
                      const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
                      return (
                        <tr key={idx} className="hover:bg-gray-800/30">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <input className={`${UI.inputSm} w-full font-mono`} value={it.sku} placeholder="SKU" onChange={e=>setIBItem(idx,'sku',e.target.value)} />
                              {it.isCatchWeight && (
                                <span className="text-[9px] uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded shrink-0" title="Catch weight — billed per pound">CW</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2"><input className={`${UI.inputSm} w-full`} value={it.description} placeholder="Description" onChange={e=>setIBItem(idx,'description',e.target.value)} /></td>
                          <td className="px-3 py-2"><input className={`${UI.inputSm} w-full`} value={it.uom} onChange={e=>setIBItem(idx,'uom',e.target.value)} /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" min="0" className={`${UI.inputSm} w-full text-right`} value={it.qty} onChange={e=>setIBItem(idx,'qty',e.target.value)} /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" min="0" className={`${UI.inputSm} w-full text-right`} value={it.unitPrice} onChange={e=>setIBItem(idx,'unitPrice',e.target.value)} /></td>
                          <td className="px-3 py-2 text-right font-bold text-gray-200 text-sm">{fmt(lineTotal)}</td>
                          <td className="px-2 py-2 text-center">
                            <button type="button" onClick={()=>removeIBLine(idx)} className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10" title="Remove row" disabled={invBuilder.items.length === 1}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes + totals */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-7">
                  <label className={UI.label}>Notes / Memo</label>
                  <textarea rows={3} className={UI.input} placeholder="Internal memo or remittance instructions…" value={invBuilder.notes} onChange={e=>setIB('notes', e.target.value)} />
                </div>
                <div className="col-span-5">
                  <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span className="text-gray-200 font-semibold">{fmt(invBuilderSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Tax ({invBuilder.taxRate}%)</span>
                      <span className="text-gray-200 font-semibold">{fmt(invBuilderTax)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <label className="text-xs">Freight / Other</label>
                      <input type="number" step="0.01" min="0" className={`${UI.inputSm} w-28 text-right`} value={invBuilder.freight} onChange={e=>setIB('freight', e.target.value)} />
                    </div>
                    <div className="border-t border-gray-700 my-2" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-300 font-bold">Total Due</span>
                      <span className="text-cyan-400 font-black text-xl">{fmt(invBuilderTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
                <button type="button" onClick={(e)=>handleCreateInvoiceFromBuilder(e, { preview: true })} className={UI.btnSecondary}>
                  <Eye className="w-4 h-4" /> Save &amp; Preview
                </button>
                <button type="submit" className={UI.btnPrimary}>
                  <Send className="w-4 h-4" /> Create Invoice
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      );
    }

    // Invoice modal
    if (modal.type === 'invoice') return (
      <Overlay>
        <ModalBox>
          <ModalHeader title="New Customer Invoice" icon={FileText} onClose={closeModal} />
          <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 overflow-auto">
            <div><label className={UI.label}>Customer Name *</label>
              <input required className={UI.input} placeholder="Business name" value={invForm.customer} onChange={e=>{const v=e.target.value;setIF('customer',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Invoice Amount *</label>
                <input required type="number" step="0.01" min="0.01" className={UI.input} value={invForm.amount} onChange={e=>{const v=e.target.value;setIF('amount',v);}} /></div>
              <div><label className={UI.label}>Due Date</label>
                <input type="date" className={UI.input} value={invForm.dueDate} onChange={e=>{const v=e.target.value;setIF('dueDate',v);}} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>GL Code</label>
                <select className={UI.select} value={invForm.glCode} onChange={e=>{const v=e.target.value;setIF('glCode',v);}}>
                  {glAccounts.filter(g=>g.type==='Revenue').map(g=><option key={g.code} value={g.code}>{g.code} – {g.name}</option>)}
                </select></div>
              <div><label className={UI.label}>Source</label>
                <select className={UI.select} value={invForm.source} onChange={e=>{const v=e.target.value;setIF('source',v);}}>
                  {['Manual','B2B','Field Sales','Logistics'].map(s=><option key={s}>{s}</option>)}
                </select></div>
            </div>
            <div><label className={UI.label}>Notes</label>
              <input className={UI.input} placeholder="Optional notes…" value={invForm.notes} onChange={e=>{const v=e.target.value;setIF('notes',v);}} /></div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
              <button type="submit" className={UI.btnPrimary}><Send className="w-4 h-4" /> Create Invoice</button>
            </div>
          </form>
        </ModalBox>
      </Overlay>
    );

    // Record Payment modal
    if (modal.type === 'payment') {
      const inv = modal.invoice;
      return (
        <Overlay>
          <ModalBox>
            <ModalHeader title="Record Payment" icon={DollarSign} onClose={closeModal} />
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 overflow-auto">
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 space-y-1">
                <p className="text-sm font-bold text-gray-200">{inv?.customer}</p>
                <p className="text-xs text-gray-400">Invoice {inv?.id} · Total {fmt(inv?.amount)} · Outstanding {fmt((inv?.amount??0)-(inv?.paid??0))}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={UI.label}>Payment Amount *</label>
                  <input required type="number" step="0.01" min="0.01" className={UI.input} value={payForm.amount} onChange={e=>{const v=e.target.value;setPayForm(prev=>({...prev,amount:v}));}} /></div>
                <div><label className={UI.label}>Payment Date</label>
                  <input type="date" className={UI.input} value={payForm.date} onChange={e=>{const v=e.target.value;setPayForm(prev=>({...prev,date:v}));}} /></div>
              </div>
              <div><label className={UI.label}>Notes</label>
                <input className={UI.input} placeholder="Check #, wire reference…" value={payForm.notes} onChange={e=>{const v=e.target.value;setPayForm(prev=>({...prev,notes:v}));}} /></div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
                <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
                <button type="submit" className={UI.btnPrimary}><CheckCircle2 className="w-4 h-4" /> Record Payment</button>
              </div>
            </form>
          </ModalBox>
        </Overlay>
      );
    }

    // Expense modal
    if (modal.type === 'expense') return (
      <Overlay>
        <ModalBox>
          <ModalHeader title="Record Expense" icon={Receipt} onClose={closeModal} />
          <form onSubmit={handleCreateExpense} className="p-6 space-y-4 overflow-auto">
            <div><label className={UI.label}>Vendor / Payee *</label>
              <input required className={UI.input} placeholder="Who was paid?" value={expForm.vendor} onChange={e=>{const v=e.target.value;setEF('vendor',v);}} /></div>
            <div><label className={UI.label}>Description *</label>
              <input required className={UI.input} placeholder="What was purchased?" value={expForm.description} onChange={e=>{const v=e.target.value;setEF('description',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Amount *</label>
                <input required type="number" step="0.01" min="0.01" className={UI.input} value={expForm.amount} onChange={e=>{const v=e.target.value;setEF('amount',v);}} /></div>
              <div><label className={UI.label}>Date</label>
                <input type="date" className={UI.input} value={expForm.date} onChange={e=>{const v=e.target.value;setEF('date',v);}} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>GL Code</label>
                <select className={UI.select} value={expForm.glCode} onChange={e=>{const v=e.target.value;setEF('glCode',v);}}>
                  {glAccounts.filter(g=>g.type==='Expense'||g.type==='COGS').map(g=><option key={g.code} value={g.code}>{g.code} – {g.name}</option>)}
                </select></div>
              <div><label className={UI.label}>Pay From Account</label>
                <select className={UI.select} value={expForm.accountId} onChange={e=>{const v=e.target.value;setEF('accountId',v);}}>
                  {bankAccounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select></div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
              <button type="submit" className={UI.btnPrimary}><Save className="w-4 h-4" /> Save Expense</button>
            </div>
          </form>
        </ModalBox>
      </Overlay>
    );

    // Add Bank Account modal
    if (modal.type === 'bank') return (
      <Overlay>
        <ModalBox>
          <ModalHeader title="Add Bank Account" icon={Landmark} onClose={closeModal} />
          <form onSubmit={handleAddBankAccount} className="p-6 space-y-4 overflow-auto">
            <div><label className={UI.label}>Account Nickname *</label>
              <input required className={UI.input} placeholder="e.g. Chase – Operating" value={bankForm.name} onChange={e=>{const v=e.target.value;setBF('name',v);}} /></div>
            <div><label className={UI.label}>Bank Name *</label>
              <input required className={UI.input} placeholder="e.g. JPMorgan Chase" value={bankForm.bank} onChange={e=>{const v=e.target.value;setBF('bank',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Account Number (last 4) *</label>
                <input required maxLength={4} className={UI.input} placeholder="1234" value={bankForm.number} onChange={e=>{const v=e.target.value;setBF('number',v);}} /></div>
              <div><label className={UI.label}>Routing Number</label>
                <input className={UI.input} placeholder="9 digits" value={bankForm.routing} onChange={e=>{const v=e.target.value;setBF('routing',v);}} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Account Type</label>
                <select className={UI.select} value={bankForm.type} onChange={e=>{const v=e.target.value;setBF('type',v);}}>
                  {['Checking','Savings'].map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div><label className={UI.label}>Starting Balance</label>
                <input type="number" step="0.01" min="0" className={UI.input} placeholder="0.00" value={bankForm.balance} onChange={e=>{const v=e.target.value;setBF('balance',v);}} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
              <button type="submit" className={UI.btnPrimary}><Save className="w-4 h-4" /> Add Account</button>
            </div>
          </form>
        </ModalBox>
      </Overlay>
    );

    // New Reconciliation modal
    if (modal.type === 'reconcile') return (
      <Overlay>
        <ModalBox>
          <ModalHeader title="Start Reconciliation" icon={Landmark} onClose={closeModal} />
          <form onSubmit={handleStartReconcile} className="p-6 space-y-4 overflow-auto">
            <div><label className={UI.label}>Bank Account *</label>
              <select required className={UI.select} value={recForm.accountId} onChange={e=>{const v=e.target.value;setRF('accountId',v);}}>
                {bankAccounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select></div>
            <div><label className={UI.label}>Period Label *</label>
              <input required className={UI.input} placeholder="e.g. May 2026" value={recForm.period} onChange={e=>{const v=e.target.value;setRF('period',v);}} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={UI.label}>Opening Balance *</label>
                <input required type="number" step="0.01" className={UI.input} placeholder="0.00" value={recForm.openingBalance} onChange={e=>{const v=e.target.value;setRF('openingBalance',v);}} /></div>
              <div><label className={UI.label}>Statement Closing Balance *</label>
                <input required type="number" step="0.01" className={UI.input} placeholder="0.00" value={recForm.closingBalance} onChange={e=>{const v=e.target.value;setRF('closingBalance',v);}} /></div>
            </div>
            <div><label className={UI.label}>Statement Closing Date *</label>
              <input required type="date" className={UI.input} value={recForm.closingDate} onChange={e=>{const v=e.target.value;setRF('closingDate',v);}} /></div>
            <div className="bg-gray-800/50 rounded-lg px-4 py-3 text-xs text-gray-400">
              <Zap className="w-3.5 h-3.5 text-cyan-500 inline mr-1.5" />
              Line items will be auto-populated from checks and expenses for the selected account.
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
              <button type="button" onClick={closeModal} className={UI.btnGhost}>Cancel</button>
              <button type="submit" className={UI.btnPrimary}><RefreshCcw className="w-4 h-4" /> Start Reconciliation</button>
            </div>
          </form>
        </ModalBox>
      </Overlay>
    );

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  // ── DAILY CLOSE-OUT — interactive Samantha reconciliation view ─────────────────
  function renderCloseout() {
    const fmtC = n => '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

    const toggleVerify = (stopId, routeId) => {
      const nextVal = !verifiedStops[stopId];
      setVerifiedStops(prev => ({ ...prev, [stopId]: nextVal }));
      if (!DEMO_MODE) {
        api.closeout.updateStop(routeId, stopId, { verified: nextVal })
          .catch(() => setVerifiedStops(prev => ({ ...prev, [stopId]: !nextVal }))); // rollback on error
      }
    };

    const toggleSignOff = (routeId) => {
      const isSigned = !!signedRoutes[routeId];
      if (isSigned) {
        // Undo sign-off
        setSignedRoutes(prev => ({ ...prev, [routeId]: false }));
        if (!DEMO_MODE) {
          api.closeout.undoSignOff(routeId)
            .then(updated => setCloseoutRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...updated, stops: r.stops } : r)))
            .catch(() => setSignedRoutes(prev => ({ ...prev, [routeId]: true })));
        }
      } else {
        // Sign off
        setSignedRoutes(prev => ({ ...prev, [routeId]: true }));
        if (!DEMO_MODE) {
          api.closeout.signOff(routeId)
            .then(updated => setCloseoutRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...updated, stops: r.stops } : r)))
            .catch(() => setSignedRoutes(prev => ({ ...prev, [routeId]: false })));
        }
      }
    };

    const allStopsVerified = (driver) =>
      driver.stops.filter(s => s.deliveryStatus !== 'returned' && s.deliveryStatus !== 'pending')
        .every(s => verifiedStops[s.id]);

    // Map API snake_case stop fields to camelCase for coDriverTotals + display
    const normalizeStop = s => ({
      ...s,
      cashCollected:  Number(s.cash_collected  ?? s.cashCollected  ?? 0),
      checkCollected: Number(s.check_collected ?? s.checkCollected ?? 0),
      checkNumber:    s.check_number ?? s.checkNumber ?? '',
      invoiceAmt:     Number(s.invoice_amt ?? s.invoiceAmt ?? 0),
      deliveryStatus: s.delivery_status ?? s.deliveryStatus ?? 'pending',
    });
    const normalizeRoute = r => ({ ...r, stops: (r.stops || []).map(normalizeStop) });
    const routes = closeoutRoutes.map(normalizeRoute);

    // Deposit only counts signed-off routes
    const signedDrivers   = routes.filter(d => signedRoutes[d.id]);
    const pendingDrivers  = routes.filter(d => d.status === 'out');
    const totalCash_c     = signedDrivers.reduce((s,d)=>s+coDriverTotals(d).cash,0);
    const totalChecks_c   = signedDrivers.reduce((s,d)=>s+coDriverTotals(d).checks,0);
    const totalDeposit    = totalCash_c + totalChecks_c;
    const totalInvoiced   = routes.reduce((s,d)=>s+coDriverTotals(d).invoiced,0);
    const totalReturned   = routes.filter(d=>d.status!=='out').reduce((s,d)=>s+coDriverTotals(d).undelivered,0);
    const checkItems = signedDrivers.flatMap(d =>
      d.stops.filter(s=>s.checkNumber&&s.checkCollected>0).map(s=>({driver:d.driver_name||d.name,...s}))
    );

    const payTypeLabel = stop => {
      if (stop.cashCollected  > 0) return { label:'Cash',  cls:'bg-emerald-500/15 text-emerald-400' };
      if (stop.checkCollected > 0) return { label:'Check', cls:'bg-cyan-500/15 text-cyan-400' };
      if (stop.deliveryStatus === 'returned') return { label:'N/A — Returned', cls:'bg-rose-500/15 text-rose-400' };
      return { label:'Net Terms', cls:'bg-gray-700/60 text-gray-400' };
    };

    return (
      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={UI.sectionTitle}><DollarSign className="w-4 h-4 text-cyan-500" /> Daily Close-out</h2>
            <p className="text-sm text-gray-400 mt-0.5">Verify driver collections · sign off routes · prepare deposit</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Routes Signed Off</p>
            <p className="text-2xl font-black text-cyan-400">{Object.values(signedRoutes).filter(Boolean).length} / {closeoutRoutes.filter(d=>d.status!=='out').length}</p>
          </div>
        </div>

        {pendingDrivers.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">{pendingDrivers.map(d=>d.name.split(' ')[0]).join(', ')} still on route — their totals are excluded until they return.</p>
          </div>
        )}

        {/* ── Per-Driver Reconciliation Cards ── */}
        {closeoutLoading && <div className="text-center py-8 text-gray-500 text-sm">Loading today's routes…</div>}
        <div className="space-y-4">
          {routes.map(driver => {
            const t         = coDriverTotals(driver);
            const isOut     = driver.status === 'out';
            const isSigned  = !!signedRoutes[driver.id];
            const canSign   = !isOut && allStopsVerified(driver) && !isSigned;
            const isExpanded= expandedDriver === driver.id;
            const verCount  = driver.stops.filter(s => verifiedStops[s.id]).length;
            const eligCount = driver.stops.filter(s => s.deliveryStatus !== 'returned' && s.deliveryStatus !== 'pending').length;

            return (
              <div key={driver.id} className={`${UI.card} overflow-hidden transition-all ${isSigned ? 'border-emerald-500/30' : ''}`}>
                {/* Driver summary row */}
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-bold text-gray-100">{driver.driver_name || driver.name}</p>
                      <CoDriverBadge status={driver.status} />
                      {isSigned && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400">✓ Signed Off</span>}
                    </div>
                    <p className="text-xs text-gray-500">{driver.vehicle} · {driver.stops.length} stops · Dep. {driver.departureTime}{driver.returnTime ? ` · Ret. ${driver.returnTime}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Collected</p>
                      <p className="text-sm font-black text-cyan-400">{isOut ? '—' : fmtC(t.collected)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Verified</p>
                      <p className={`text-sm font-black ${isOut ? 'text-gray-600' : eligCount > 0 && verCount === eligCount ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {isOut ? '—' : `${verCount}/${eligCount}`}
                      </p>
                    </div>
                    {!isOut && (
                      <button
                        onClick={() => setExpandedDriver(isExpanded ? null : driver.id)}
                        className={`${UI.btnSecondary} text-xs px-3 py-1.5`}>
                        {isExpanded ? 'Collapse' : 'Review Stops'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded stop-level detail */}
                {isExpanded && !isOut && (
                  <div className="border-t border-gray-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-950/40">
                          <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">Customer</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">Order</th>
                          <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">Invoice</th>
                          {codEnabled && <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">Payment Type</th>}
                          {codEnabled && <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">Amount</th>}
                          {codEnabled && <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">Check #</th>}
                          <th className="text-left px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">Verify</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driver.stops.map(stop => {
                          const pt         = payTypeLabel(stop);
                          const isVerified = !!verifiedStops[stop.id];
                          const collected  = stop.cashCollected + stop.checkCollected;
                          const canVerify  = stop.deliveryStatus !== 'returned' && stop.deliveryStatus !== 'pending';
                          return (
                            <tr key={stop.id} className={`border-b border-gray-800/50 transition-colors ${isVerified ? 'bg-emerald-500/5' : 'hover:bg-gray-800/30'}`}>
                              <td className="px-4 py-3 text-gray-100 font-medium">{stop.customer}</td>
                              <td className="px-4 py-3 text-gray-400 text-xs font-mono">{stop.orderId}</td>
                              <td className="px-4 py-3 text-gray-200">{fmtC(stop.invoiceAmt)}</td>
                              {codEnabled && <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${pt.cls}`}>{pt.label}</span>
                              </td>}
                              {codEnabled && <td className="px-4 py-3 font-semibold text-gray-200">
                                {collected > 0 ? fmtC(collected) : <span className="text-gray-600">—</span>}
                              </td>}
                              {codEnabled && <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                                {stop.checkNumber ? `#${stop.checkNumber}` : <span className="text-gray-700">—</span>}
                              </td>}
                              <td className="px-4 py-3">
                                {canVerify ? (
                                  <button
                                    onClick={() => toggleVerify(stop.id, driver.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                      isVerified
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400'
                                    }`}>
                                    {isVerified ? '✓ Verified' : 'Verify'}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-600 italic">N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Notes row */}
                    {driver.stops.some(s => s.notes) && (
                      <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/20">
                        <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Driver Notes</p>
                        {driver.stops.filter(s=>s.notes).map(s=>(
                          <p key={s.id} className="text-xs text-gray-500"><span className="text-gray-400">{s.customer}:</span> {s.notes}</p>
                        ))}
                      </div>
                    )}

                    {/* Sign-off action */}
                    <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between bg-gray-900/40">
                      <div className="text-xs text-gray-500">
                        {canSign
                          ? 'All collectible stops verified — ready to sign off.'
                          : isSigned
                            ? `Route signed off by Samantha · ${fmtC(t.collected)} added to deposit.`
                            : `Verify all ${eligCount} stop${eligCount!==1?'s':''} before signing off.`
                        }
                      </div>
                      <button
                        onClick={() => toggleSignOff(driver.id)}
                        disabled={!canSign && !isSigned}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                          isSigned
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400'
                            : 'bg-emerald-500 border-emerald-600 text-gray-950 hover:bg-emerald-400'
                        }`}>
                        {isSigned ? '✓ Signed Off — Undo' : 'Sign Off Route'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Deposit Summary (only signed-off routes) ── */}
        {codEnabled && <div className="bg-gray-900 rounded-xl border border-cyan-500/20 p-6">
          <p className="text-xs text-cyan-500 font-semibold uppercase tracking-widest mb-1">Deposit Summary</p>
          <p className="text-xs text-gray-500 mb-5">Only includes routes signed off by Samantha</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-800">
            <div className="text-center py-4 md:py-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total Cash</p>
              <p className="text-4xl font-black text-gray-100">{fmtC(totalCash_c)}</p>
            </div>
            <div className="text-center py-4 md:py-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total Checks</p>
              <p className="text-4xl font-black text-gray-100">{fmtC(totalChecks_c)}</p>
              <p className="text-xs text-gray-500 mt-1">{checkItems.length} check{checkItems.length!==1?'s':''}</p>
            </div>
            <div className="text-center py-4 md:py-0">
              <p className="text-xs text-cyan-400 uppercase tracking-wide mb-2">Total Deposit</p>
              <p className="text-4xl font-black text-cyan-400">{fmtC(totalDeposit)}</p>
            </div>
          </div>
        </div>}

        {/* Check Register */}
        {codEnabled && checkItems.length > 0 && (
          <div className={`${UI.card} overflow-hidden`}>
            <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-200">Check Register</p>
              <p className="text-xs text-gray-500">{checkItems.length} checks · {fmtC(totalChecks_c)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60">
                    {['Driver','Customer','Order #','Check #','Amount'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-xs text-gray-500 uppercase tracking-wide font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checkItems.map((item,i)=>(
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{item.driver}</td>
                      <td className="px-4 py-2.5 text-gray-200">{item.customer}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">{item.orderId}</td>
                      <td className="px-4 py-2.5 text-gray-300 font-mono font-semibold">#{item.checkNumber}</td>
                      <td className="px-4 py-2.5 text-gray-200 font-semibold">{fmtC(item.checkCollected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-4">
          <button className={UI.btnSecondary}><Printer className="w-4 h-4" /> Print Summary</button>
          <button className={UI.btnSecondary}><FileText className="w-4 h-4" /> Export CSV</button>
          {codEnabled && <button
            disabled={totalDeposit === 0}
            className={`${UI.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}>
            <DollarSign className="w-4 h-4" /> Prepare Deposit — {fmtC(totalDeposit)}
          </button>}
        </div>
      </div>
    );
  }

  return (
    <div className={UI.page}>
      {/* ── Module Header ── */}
      <div className="shrink-0 bg-gray-900/60 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-500" /> Accounting
          </h1>
          <p className="text-xs text-gray-500">AP · AR · Checks · Reconciliation · Reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Cash Position</p>
            <p className="text-xl font-black text-emerald-400">{fmt(totalCash)}</p>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div id="kernal-module-tabs" className="shrink-0 flex border-b border-gray-800 bg-gray-900/30 px-2 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
              tab === t.id
                ? 'border-cyan-500 text-cyan-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {tab === 'dashboard' && renderDashboard()}
      {tab === 'vendors'   && renderVendors()}
      {tab === 'customers' && renderCustomers()}
      {tab === 'checks'    && renderChecks()}
      {tab === 'match'     && renderAPMatch()}
      {tab === 'reconcile' && renderReconciliation()}
      {tab === 'closeout'  && renderCloseout()}
      {tab === 'reports'      && renderReports()}
      {tab === 'commissions'  && commissionTrackingEnabled && renderCommissions()}
      {tab === 'payments'     && renderPayments()}

      {/* ── Modals ── */}
      {renderModals()}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest border backdrop-blur-md transition-all ${
          toast.type === 'warning'
            ? 'bg-cyan-600/10 text-cyan-500 border-cyan-600/30'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          <CheckCircle2 size={16} /> {toast.msg}
        </div>
      )}

      {/* ── API Sync Error Toast ── */}
      {apiToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-900/90 border border-rose-500/40 text-rose-200 text-sm px-4 py-2 rounded-lg shadow-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />{apiToast}
        </div>
      )}
    </div>
  );
}
