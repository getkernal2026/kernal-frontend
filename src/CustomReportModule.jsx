import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';
import { api } from './lib/api.js';
import {
  BarChart3, Plus, X, Save, Download, Filter, Package, Users, Truck,
  ShoppingCart, Building2, DollarSign, Star, BookOpen, ChevronUp, ChevronDown,
  Zap, Layers, Check, Trash2, RefreshCw, AlertCircle,
} from 'lucide-react';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// ─── Data Sources ─────────────────────────────────────────────────────────────
// Each source has: label, icon, color, bg, description, fields[], rows[]
// Field types: 'string' | 'number' | 'date' | 'enum'

const DATA_SOURCES = {
  invoices: {
    label: 'Invoices & AR',
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    description: 'Sales invoices with customer, amount, status, and aging',
    fields: [
      { id: 'invoice_id',    label: 'Invoice #',        type: 'string' },
      { id: 'customer_name', label: 'Customer',          type: 'string' },
      { id: 'route',         label: 'Route',             type: 'enum',   options: ['Route 1','Route 2','Route 3','Route 4'] },
      { id: 'date',          label: 'Invoice Date',      type: 'date'   },
      { id: 'due_date',      label: 'Due Date',          type: 'date'   },
      { id: 'amount',        label: 'Amount',            type: 'number' },
      { id: 'paid',          label: 'Paid',              type: 'number' },
      { id: 'balance',       label: 'Balance Owed',      type: 'number' },
      { id: 'status',        label: 'Status',            type: 'enum',   options: ['Open','Paid','Overdue','Partial'] },
      { id: 'terms',         label: 'Terms',             type: 'enum',   options: ['Net 15','Net 30','Net 45'] },
      { id: 'aging_days',    label: 'Aging (Days)',      type: 'number' },
    ],
    rows: [
      { invoice_id:'INV-501', customer_name:'Metro Restaurant Group',  route:'Route 2', date:'2026-04-15', due_date:'2026-05-15', amount:8450.00,  paid:0,        balance:8450.00,  status:'Overdue', terms:'Net 30', aging_days:41 },
      { invoice_id:'INV-502', customer_name:'Downtown Catering Co.',   route:'Route 1', date:'2026-05-01', due_date:'2026-05-31', amount:3200.00,  paid:0,        balance:3200.00,  status:'Open',    terms:'Net 30', aging_days:25 },
      { invoice_id:'INV-503', customer_name:'Harbor View Hotel',       route:'Route 1', date:'2026-04-20', due_date:'2026-05-05', amount:12800.00, paid:12800.00, balance:0,        status:'Paid',    terms:'Net 15', aging_days:0  },
      { invoice_id:'INV-504', customer_name:'Sunset Bistro Chain',     route:'Route 3', date:'2026-05-08', due_date:'2026-06-07', amount:5600.00,  paid:2000.00,  balance:3600.00,  status:'Partial', terms:'Net 30', aging_days:18 },
      { invoice_id:'INV-505', customer_name:'City School District',    route:'Route 4', date:'2026-04-28', due_date:'2026-06-12', amount:22000.00, paid:0,        balance:22000.00, status:'Open',    terms:'Net 45', aging_days:28 },
      { invoice_id:'INV-506', customer_name:'Bayou Grill & Pub',       route:'Route 2', date:'2026-05-12', due_date:'2026-05-27', amount:1910.05,  paid:0,        balance:1910.05,  status:'Overdue', terms:'Net 15', aging_days:29 },
      { invoice_id:'INV-507', customer_name:'Crescent City Catering',  route:'Route 3', date:'2026-05-20', due_date:'2026-06-19', amount:4340.00,  paid:0,        balance:4340.00,  status:'Open',    terms:'Net 30', aging_days:6  },
      { invoice_id:'INV-508', customer_name:'Metro Restaurant Group',  route:'Route 2', date:'2026-05-05', due_date:'2026-06-04', amount:9200.00,  paid:9200.00,  balance:0,        status:'Paid',    terms:'Net 30', aging_days:0  },
      { invoice_id:'INV-509', customer_name:'Harbor View Hotel',       route:'Route 1', date:'2026-05-14', due_date:'2026-05-29', amount:15600.00, paid:0,        balance:15600.00, status:'Overdue', terms:'Net 15', aging_days:27 },
      { invoice_id:'INV-510', customer_name:'Downtown Catering Co.',   route:'Route 1', date:'2026-05-18', due_date:'2026-06-17', amount:2870.00,  paid:0,        balance:2870.00,  status:'Open',    terms:'Net 30', aging_days:8  },
      { invoice_id:'INV-511', customer_name:'Bayou Grill & Pub',       route:'Route 2', date:'2026-05-22', due_date:'2026-06-06', amount:2240.00,  paid:0,        balance:2240.00,  status:'Open',    terms:'Net 15', aging_days:4  },
      { invoice_id:'INV-512', customer_name:'City School District',    route:'Route 4', date:'2026-05-10', due_date:'2026-06-24', amount:18500.00, paid:18500.00, balance:0,        status:'Paid',    terms:'Net 45', aging_days:0  },
    ],
  },

  inventory: {
    label: 'Inventory & SKUs',
    icon: Package,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    description: 'Current stock levels, reorder status, and cost basis per SKU',
    fields: [
      { id: 'sku',            label: 'SKU',             type: 'string' },
      { id: 'description',    label: 'Description',     type: 'string' },
      { id: 'category',       label: 'Category',        type: 'enum',   options: ['Protein','Dairy','Produce','Bakery','Dry Goods'] },
      { id: 'qty_on_hand',    label: 'Qty On Hand',     type: 'number' },
      { id: 'min_stock',      label: 'Min Stock',       type: 'number' },
      { id: 'unit_cost',      label: 'Unit Cost',       type: 'number' },
      { id: 'total_value',    label: 'Total Value',     type: 'number' },
      { id: 'days_supply',    label: 'Days Supply',     type: 'number' },
      { id: 'reorder_status', label: 'Reorder Status',  type: 'enum',   options: ['OK','Low','Reorder Now','Critical','Stockout','Overstocked'] },
      { id: 'vendor',         label: 'Vendor',          type: 'string' },
    ],
    rows: [
      { sku:'FRZ-BEEF-01',  description:'Ground Beef 80/20 10lb',    category:'Protein',   qty_on_hand:142, min_stock:40,  unit_cost:168.00, total_value:23856, days_supply:14, reorder_status:'OK',          vendor:'Gulf Coast Proteins'  },
      { sku:'PLT-CHICK-05', description:'Jumbo Chicken Breasts',     category:'Protein',   qty_on_hand:8,   min_stock:25,  unit_cost:72.00,  total_value:576,   days_supply:2,  reorder_status:'Critical',    vendor:'Gulf Coast Proteins'  },
      { sku:'PROT-002',     description:'Chicken Breast Boneless',   category:'Protein',   qty_on_hand:31,  min_stock:20,  unit_cost:132.00, total_value:4092,  days_supply:6,  reorder_status:'Low',         vendor:'Gulf Coast Proteins'  },
      { sku:'PROT-003',     description:'Atlantic Salmon 5lb',       category:'Protein',   qty_on_hand:0,   min_stock:15,  unit_cost:92.00,  total_value:0,     days_supply:0,  reorder_status:'Stockout',    vendor:'Gulf Coast Proteins'  },
      { sku:'PROT-010',     description:'Shrimp Jumbo 16/20',        category:'Protein',   qty_on_hand:19,  min_stock:20,  unit_cost:108.00, total_value:2052,  days_supply:4,  reorder_status:'Reorder Now', vendor:'Gulf Coast Proteins'  },
      { sku:'DAI-MILK-02',  description:'Whole Milk 1 Gal 4pk',      category:'Dairy',     qty_on_hand:88,  min_stock:30,  unit_cost:26.50,  total_value:2332,  days_supply:18, reorder_status:'OK',          vendor:'Dairy Fresh Co.'      },
      { sku:'DAI-CHE-02',   description:'American Cheese 5lb',       category:'Dairy',     qty_on_hand:22,  min_stock:20,  unit_cost:48.00,  total_value:1056,  days_supply:5,  reorder_status:'Low',         vendor:'Dairy Fresh Co.'      },
      { sku:'DAI-BUT-01',   description:'Butter Unsalted 36ct',      category:'Dairy',     qty_on_hand:65,  min_stock:20,  unit_cost:72.00,  total_value:4680,  days_supply:22, reorder_status:'OK',          vendor:'Dairy Fresh Co.'      },
      { sku:'PRO-TOMA-01',  description:'Roma Tomatoes 25lb',        category:'Produce',   qty_on_hand:34,  min_stock:15,  unit_cost:32.00,  total_value:1088,  days_supply:7,  reorder_status:'OK',          vendor:'Sunshine Produce'     },
      { sku:'PRO-LET-01',   description:'Iceberg Lettuce 24ct',      category:'Produce',   qty_on_hand:12,  min_stock:20,  unit_cost:41.00,  total_value:492,   days_supply:3,  reorder_status:'Reorder Now', vendor:'Sunshine Produce'     },
      { sku:'BAK-BUN-01',   description:'Brioche Burger Buns 12pk',  category:'Bakery',    qty_on_hand:195, min_stock:30,  unit_cost:38.00,  total_value:7410,  days_supply:31, reorder_status:'Overstocked', vendor:'Southern Bakery'      },
      { sku:'DRY-RICE-05',  description:'Jasmine Rice 50lb Bag',     category:'Dry Goods', qty_on_hand:47,  min_stock:15,  unit_cost:52.00,  total_value:2444,  days_supply:19, reorder_status:'OK',          vendor:'Metro Dry Goods'      },
    ],
  },

  customers: {
    label: 'Customer Summary',
    icon: Users,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    description: 'Customer revenue, AR balance, and order history YTD',
    fields: [
      { id: 'customer_name',    label: 'Customer',           type: 'string' },
      { id: 'route',            label: 'Route',              type: 'enum',   options: ['Route 1','Route 2','Route 3','Route 4'] },
      { id: 'terms',            label: 'Terms',              type: 'enum',   options: ['Net 15','Net 30','Net 45'] },
      { id: 'revenue_ytd',      label: 'Revenue YTD',        type: 'number' },
      { id: 'order_count',      label: 'Orders',             type: 'number' },
      { id: 'ar_balance',       label: 'AR Balance',         type: 'number' },
      { id: 'ar_overdue',       label: 'AR Overdue',         type: 'number' },
      { id: 'last_order_date',  label: 'Last Order',         type: 'date'   },
      { id: 'avg_order',        label: 'Avg Order Value',    type: 'number' },
      { id: 'gross_margin_pct', label: 'Gross Margin %',     type: 'number' },
    ],
    rows: [
      { customer_name:'Metro Restaurant Group',  route:'Route 2', terms:'Net 30', revenue_ytd:52400,  order_count:12, ar_balance:8450,  ar_overdue:8450,  last_order_date:'2026-05-05', avg_order:4367, gross_margin_pct:28.2 },
      { customer_name:'Downtown Catering Co.',   route:'Route 1', terms:'Net 30', revenue_ytd:28300,  order_count:8,  ar_balance:6070,  ar_overdue:0,     last_order_date:'2026-05-18', avg_order:3538, gross_margin_pct:30.1 },
      { customer_name:'Harbor View Hotel',       route:'Route 1', terms:'Net 15', revenue_ytd:95200,  order_count:18, ar_balance:15600, ar_overdue:15600, last_order_date:'2026-05-14', avg_order:5289, gross_margin_pct:31.4 },
      { customer_name:'Sunset Bistro Chain',     route:'Route 3', terms:'Net 30', revenue_ytd:41800,  order_count:9,  ar_balance:3600,  ar_overdue:0,     last_order_date:'2026-05-08', avg_order:4644, gross_margin_pct:27.8 },
      { customer_name:'City School District',    route:'Route 4', terms:'Net 45', revenue_ytd:182000, order_count:22, ar_balance:22000, ar_overdue:0,     last_order_date:'2026-05-10', avg_order:8273, gross_margin_pct:24.1 },
      { customer_name:'Bayou Grill & Pub',       route:'Route 2', terms:'Net 15', revenue_ytd:18200,  order_count:14, ar_balance:4150,  ar_overdue:1910,  last_order_date:'2026-05-22', avg_order:1300, gross_margin_pct:32.6 },
      { customer_name:'Crescent City Catering',  route:'Route 3', terms:'Net 30', revenue_ytd:22100,  order_count:6,  ar_balance:4340,  ar_overdue:0,     last_order_date:'2026-05-20', avg_order:3683, gross_margin_pct:29.5 },
    ],
  },

  purchase_orders: {
    label: 'Purchase Orders',
    icon: ShoppingCart,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    description: 'POs with vendor, status, amounts, and receiving details',
    fields: [
      { id: 'po_id',        label: 'PO #',             type: 'string' },
      { id: 'vendor',       label: 'Vendor',           type: 'enum',   options: ['US Foods Distribution','Sysco Corporation','Gordon Food Service','FleetPride Parts','City Utilities'] },
      { id: 'date',         label: 'PO Date',          type: 'date'   },
      { id: 'due_date',     label: 'Expected Date',    type: 'date'   },
      { id: 'amount',       label: 'Amount',           type: 'number' },
      { id: 'received_pct', label: '% Received',       type: 'number' },
      { id: 'status',       label: 'Status',           type: 'enum',   options: ['Draft','Approved','Sent','Partially Received','Received','Closed'] },
      { id: 'terms',        label: 'Terms',            type: 'enum',   options: ['Net 15','Net 30','Due on Receipt'] },
      { id: 'line_items',   label: 'Line Items',       type: 'number' },
    ],
    rows: [
      { po_id:'PO-AP-0881', vendor:'US Foods Distribution', date:'2026-05-01', due_date:'2026-05-10', amount:8200,  received_pct:100, status:'Received',           terms:'Net 30',         line_items:4 },
      { po_id:'PO-AP-0882', vendor:'US Foods Distribution', date:'2026-05-08', due_date:'2026-05-18', amount:4250,  received_pct:60,  status:'Partially Received', terms:'Net 30',         line_items:3 },
      { po_id:'PO-AP-0883', vendor:'Sysco Corporation',     date:'2026-05-05', due_date:'2026-05-15', amount:5450,  received_pct:100, status:'Received',           terms:'Net 30',         line_items:5 },
      { po_id:'PO-AP-0884', vendor:'Sysco Corporation',     date:'2026-05-12', due_date:'2026-05-22', amount:3470,  received_pct:0,   status:'Sent',               terms:'Net 30',         line_items:2 },
      { po_id:'PO-AP-0885', vendor:'Gordon Food Service',   date:'2026-05-10', due_date:'2026-05-20', amount:3200,  received_pct:0,   status:'Sent',               terms:'Net 15',         line_items:3 },
      { po_id:'PO-AP-0886', vendor:'FleetPride Parts',      date:'2026-05-15', due_date:'2026-05-30', amount:1450,  received_pct:0,   status:'Approved',           terms:'Net 15',         line_items:2 },
      { po_id:'PO-AP-0887', vendor:'City Utilities',        date:'2026-05-01', due_date:'2026-05-01', amount:620,   received_pct:0,   status:'Sent',               terms:'Due on Receipt', line_items:1 },
      { po_id:'PO-AP-0888', vendor:'US Foods Distribution', date:'2026-04-20', due_date:'2026-04-30', amount:9100,  received_pct:100, status:'Closed',             terms:'Net 30',         line_items:6 },
      { po_id:'PO-AP-0889', vendor:'Sysco Corporation',     date:'2026-04-15', due_date:'2026-04-25', amount:6200,  received_pct:100, status:'Closed',             terms:'Net 30',         line_items:4 },
    ],
  },

  deliveries: {
    label: 'Deliveries',
    icon: Truck,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    description: 'Route performance, driver stats, and on-time metrics',
    fields: [
      { id: 'date',            label: 'Date',             type: 'date'   },
      { id: 'route_id',        label: 'Route',            type: 'enum',   options: ['Route 1','Route 2','Route 3','Route 4'] },
      { id: 'driver',          label: 'Driver',           type: 'string' },
      { id: 'stops_planned',   label: 'Stops Planned',    type: 'number' },
      { id: 'stops_completed', label: 'Stops Done',       type: 'number' },
      { id: 'on_time_pct',     label: 'On-Time %',        type: 'number' },
      { id: 'total_cases',     label: 'Cases',            type: 'number' },
      { id: 'total_weight',    label: 'Weight (lbs)',     type: 'number' },
      { id: 'total_value',     label: 'Invoice Value',    type: 'number' },
      { id: 'fuel_used',       label: 'Fuel (gal)',       type: 'number' },
      { id: 'status',          label: 'Status',           type: 'enum',   options: ['Scheduled','In Progress','Completed','Partial'] },
    ],
    rows: [
      { date:'2026-05-26', route_id:'Route 1', driver:'Marcus T.', stops_planned:6, stops_completed:6, on_time_pct:100, total_cases:148, total_weight:4820, total_value:28400, fuel_used:22, status:'Completed' },
      { date:'2026-05-26', route_id:'Route 2', driver:'Sofia R.',  stops_planned:5, stops_completed:4, on_time_pct:80,  total_cases:112, total_weight:3640, total_value:21300, fuel_used:18, status:'Partial'   },
      { date:'2026-05-26', route_id:'Route 3', driver:'James P.',  stops_planned:7, stops_completed:7, on_time_pct:100, total_cases:196, total_weight:6210, total_value:34800, fuel_used:31, status:'Completed' },
      { date:'2026-05-23', route_id:'Route 4', driver:'Marcus T.', stops_planned:4, stops_completed:4, on_time_pct:75,  total_cases:88,  total_weight:2980, total_value:19200, fuel_used:15, status:'Completed' },
      { date:'2026-05-23', route_id:'Route 1', driver:'Sofia R.',  stops_planned:6, stops_completed:6, on_time_pct:100, total_cases:165, total_weight:5120, total_value:31200, fuel_used:24, status:'Completed' },
      { date:'2026-05-23', route_id:'Route 2', driver:'James P.',  stops_planned:5, stops_completed:5, on_time_pct:100, total_cases:130, total_weight:4100, total_value:24500, fuel_used:20, status:'Completed' },
      { date:'2026-05-22', route_id:'Route 3', driver:'Marcus T.', stops_planned:7, stops_completed:6, on_time_pct:86,  total_cases:178, total_weight:5640, total_value:29800, fuel_used:28, status:'Partial'   },
      { date:'2026-05-22', route_id:'Route 4', driver:'Sofia R.',  stops_planned:4, stops_completed:4, on_time_pct:100, total_cases:92,  total_weight:3080, total_value:22100, fuel_used:16, status:'Completed' },
    ],
  },

  vendors: {
    label: 'Vendors & Spend',
    icon: Building2,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    description: 'Vendor spend, AP balance, and performance metrics',
    fields: [
      { id: 'vendor',          label: 'Vendor',              type: 'string' },
      { id: 'category',        label: 'Category',            type: 'enum',   options: ['Food','Parts','Utilities'] },
      { id: 'spend_ytd',       label: 'Spend YTD',           type: 'number' },
      { id: 'ap_balance',      label: 'AP Balance',          type: 'number' },
      { id: 'po_count',        label: 'PO Count',            type: 'number' },
      { id: 'terms',           label: 'Terms',               type: 'enum',   options: ['Net 15','Net 30','Due on Receipt'] },
      { id: 'on_time_pct',     label: 'On-Time Delivery %',  type: 'number' },
      { id: 'fill_rate_pct',   label: 'Fill Rate %',         type: 'number' },
      { id: 'score',           label: 'Vendor Score',        type: 'number' },
    ],
    rows: [
      { vendor:'US Foods Distribution', category:'Food',      spend_ytd:128400, ap_balance:12450, po_count:18, terms:'Net 30',          on_time_pct:94,  fill_rate_pct:98,  score:91  },
      { vendor:'Sysco Corporation',     category:'Food',      spend_ytd:89200,  ap_balance:8920,  po_count:14, terms:'Net 30',          on_time_pct:88,  fill_rate_pct:95,  score:86  },
      { vendor:'Gordon Food Service',   category:'Food',      spend_ytd:42100,  ap_balance:3200,  po_count:8,  terms:'Net 15',          on_time_pct:92,  fill_rate_pct:97,  score:89  },
      { vendor:'FleetPride Parts',      category:'Parts',     spend_ytd:14800,  ap_balance:1450,  po_count:6,  terms:'Net 15',          on_time_pct:85,  fill_rate_pct:100, score:82  },
      { vendor:'City Utilities',        category:'Utilities', spend_ytd:7440,   ap_balance:620,   po_count:5,  terms:'Due on Receipt',  on_time_pct:100, fill_rate_pct:100, score:100 },
    ],
  },
};

// ─── Pre-built Templates ──────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'overdue-ar',
    name: 'Overdue Invoice Aging',
    description: 'All invoices past due, sorted by days outstanding',
    category: 'Finance',
    source: 'invoices',
    fields: ['invoice_id','customer_name','route','due_date','amount','balance','status','aging_days'],
    filters: [{ id:'f1', field:'status', operator:'is', value:'Overdue' }],
    sortField: 'aging_days', sortDir: 'desc',
  },
  {
    id: 'customer-revenue',
    name: 'Customer Revenue Ranking',
    description: 'All customers sorted by YTD revenue with margin',
    category: 'Sales',
    source: 'customers',
    fields: ['customer_name','route','revenue_ytd','order_count','avg_order','gross_margin_pct','ar_balance'],
    filters: [],
    sortField: 'revenue_ytd', sortDir: 'desc',
  },
  {
    id: 'low-stock',
    name: 'Low Stock & Critical SKUs',
    description: 'SKUs that need reordering or have hit critical levels',
    category: 'Operations',
    source: 'inventory',
    fields: ['sku','description','category','qty_on_hand','min_stock','days_supply','reorder_status','unit_cost'],
    filters: [
      { id:'f1', field:'reorder_status', operator:'is not', value:'OK' },
      { id:'f2', field:'reorder_status', operator:'is not', value:'Overstocked' },
    ],
    sortField: 'days_supply', sortDir: 'asc',
  },
  {
    id: 'open-ap',
    name: 'Open Purchase Orders',
    description: 'POs still pending delivery or partial receipt',
    category: 'Finance',
    source: 'purchase_orders',
    fields: ['po_id','vendor','date','due_date','amount','received_pct','status','terms'],
    filters: [
      { id:'f1', field:'status', operator:'is not', value:'Closed' },
      { id:'f2', field:'status', operator:'is not', value:'Received' },
    ],
    sortField: 'due_date', sortDir: 'asc',
  },
  {
    id: 'delivery-perf',
    name: 'Delivery Performance',
    description: 'On-time rate and case counts by route and driver',
    category: 'Operations',
    source: 'deliveries',
    fields: ['date','route_id','driver','stops_planned','stops_completed','on_time_pct','total_cases','total_value','status'],
    filters: [],
    sortField: 'date', sortDir: 'desc',
  },
  {
    id: 'vendor-spend',
    name: 'Vendor Spend & Score',
    description: 'YTD spend and performance scores per vendor',
    category: 'Procurement',
    source: 'vendors',
    fields: ['vendor','category','spend_ytd','ap_balance','po_count','on_time_pct','fill_rate_pct','score'],
    filters: [],
    sortField: 'spend_ytd', sortDir: 'desc',
  },
  {
    id: 'high-ar',
    name: 'High AR Balance Customers',
    description: 'Customers with significant outstanding balances',
    category: 'Finance',
    source: 'customers',
    fields: ['customer_name','route','terms','ar_balance','ar_overdue','revenue_ytd','last_order_date'],
    filters: [{ id:'f1', field:'ar_balance', operator:'>', value:'1000' }],
    sortField: 'ar_balance', sortDir: 'desc',
  },
  {
    id: 'inventory-value',
    name: 'Inventory Value by SKU',
    description: 'Total stock value and supply days per item',
    category: 'Operations',
    source: 'inventory',
    fields: ['category','sku','description','qty_on_hand','unit_cost','total_value','days_supply','vendor'],
    filters: [],
    sortField: 'total_value', sortDir: 'desc',
  },
];

// ─── Filter operators by field type ──────────────────────────────────────────
const OPERATORS = {
  string: ['contains', 'equals', 'starts with', 'not contains'],
  number: ['=', '>', '<', '>=', '<=', '≠'],
  date:   ['before', 'after', 'equals'],
  enum:   ['is', 'is not'],
};

// ─── Fields that render as currency ──────────────────────────────────────────
const CURRENCY_FIELDS = new Set([
  'amount','paid','balance','revenue_ytd','ar_balance','ar_overdue','avg_order',
  'spend_ytd','ap_balance','unit_cost','total_value',
]);
const PCT_FIELDS = new Set([
  'on_time_pct','fill_rate_pct','received_pct','gross_margin_pct',
]);

// ─── Status badge colours ─────────────────────────────────────────────────────
const STATUS_COLORS = {
  'Open':               'bg-blue-500/10   text-blue-400',
  'Paid':               'bg-emerald-500/10 text-emerald-400',
  'Overdue':            'bg-rose-500/10   text-rose-400',
  'Partial':            'bg-amber-500/10  text-amber-400',
  'Completed':          'bg-emerald-500/10 text-emerald-400',
  'In Progress':        'bg-cyan-500/10   text-cyan-400',
  'Scheduled':          'bg-gray-700       text-gray-400',
  'Received':           'bg-emerald-500/10 text-emerald-400',
  'Sent':               'bg-blue-500/10   text-blue-400',
  'Approved':           'bg-cyan-500/10   text-cyan-400',
  'Draft':              'bg-gray-700       text-gray-400',
  'Closed':             'bg-gray-700       text-gray-500',
  'Partially Received': 'bg-amber-500/10  text-amber-400',
  'OK':                 'bg-emerald-500/10 text-emerald-400',
  'Low':                'bg-amber-500/10  text-amber-400',
  'Reorder Now':        'bg-orange-500/10 text-orange-400',
  'Critical':           'bg-rose-500/10   text-rose-400',
  'Stockout':           'bg-rose-600/15   text-rose-300',
  'Overstocked':        'bg-purple-500/10 text-purple-400',
};

const CATEGORY_COLORS = {
  Finance:     'bg-emerald-500/10 text-emerald-400',
  Sales:       'bg-cyan-500/10    text-cyan-400',
  Operations:  'bg-amber-500/10   text-amber-400',
  Procurement: 'bg-blue-500/10    text-blue-400',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CustomReportModule() {
  const { can } = useKernal();
  const access = can('reports');

  const [view,           setView]           = useState('templates');
  const [source,         setSource]         = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters,        setFilters]        = useState([]);
  const [sortField,      setSortField]      = useState('');
  const [sortDir,        setSortDir]        = useState('desc');
  const [results,        setResults]        = useState(null);
  const [savedReports,   setSavedReports]   = useState([]);
  const [reportName,     setReportName]     = useState('');
  const [hasRun,         setHasRun]         = useState(false);

  // ── Live-data state ─────────────────────────────────────────────────────────
  const [sourceRows,     setSourceRows]     = useState(null);  // fetched rows for current source
  const [sourceLoading,  setSourceLoading]  = useState(false);
  const [sourceError,    setSourceError]    = useState(null);
  const [savedLoading,   setSavedLoading]   = useState(false);
  const [saveInFlight,   setSaveInFlight]   = useState(false);
  const abortRef = useRef(null);

  // ── Load saved reports on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (DEMO_MODE) return;
    setSavedLoading(true);
    api.reports.listSaved()
      .then(data => {
        setSavedReports(data.map(r => ({
          id:        r.id,
          name:      r.name,
          source:    r.source,
          fields:    r.fields  || [],
          filters:   r.filters || [],
          sortField: r.sort_field || '',
          sortDir:   r.sort_dir   || 'desc',
          rowCount:  r.last_row_count ?? 0,
          createdAt: new Date(r.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
        })));
      })
      .catch(err => console.warn('[Reports] Failed to load saved reports:', err))
      .finally(() => setSavedLoading(false));
  }, []);

  // ── Fetch source rows when source changes (live mode) ──────────────────────
  useEffect(() => {
    if (!source || DEMO_MODE) {
      setSourceRows(null);
      return;
    }
    if (abortRef.current) abortRef.current = false;
    setSourceLoading(true);
    setSourceError(null);
    setSourceRows(null);
    setResults(null);
    setHasRun(false);
    let cancelled = false;
    api.reports.source(source)
      .then(rows => { if (!cancelled) setSourceRows(rows); })
      .catch(err  => { if (!cancelled) setSourceError(err.message || 'Failed to load data'); })
      .finally(()  => { if (!cancelled) setSourceLoading(false); });
    return () => { cancelled = true; };
  }, [source]);

  const fmt     = n => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n ?? 0);
  const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
  const fmtVal  = (val, fid) => {
    if (val == null || val === '') return '—';
    if (CURRENCY_FIELDS.has(fid)) return fmt(val);
    if (PCT_FIELDS.has(fid))      return `${val}%`;
    return Number.isInteger(val) ? val.toLocaleString() : typeof val === 'number' ? val.toFixed(1) : String(val);
  };

  const ds = source ? DATA_SOURCES[source] : null;
  const visibleFields = ds
    ? (selectedFields.length > 0 ? selectedFields : ds.fields.map(f => f.id))
    : [];

  // ── Load a template / saved report into builder ──────────────────────────
  const loadTemplate = useCallback((tmpl) => {
    setSource(tmpl.source);
    setSelectedFields([...tmpl.fields]);
    setFilters(tmpl.filters.map(f => ({ ...f })));
    setSortField(tmpl.sortField || '');
    setSortDir(tmpl.sortDir || 'desc');
    setResults(null);
    setHasRun(false);
    setReportName(tmpl.name || '');
    setView('builder');
  }, []);

  // ── Select a source (resets everything) ──────────────────────────────────
  const selectSource = useCallback((key) => {
    const src = DATA_SOURCES[key];
    setSource(key);
    setSelectedFields(src.fields.map(f => f.id));
    setFilters([]);
    setSortField(src.fields[0]?.id || '');
    setSortDir('asc');
    setResults(null);
    setHasRun(false);
    setReportName('');
  }, []);

  const toggleField = useCallback((id) => {
    setSelectedFields(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // ── Filters ──────────────────────────────────────────────────────────────
  const addFilter = useCallback(() => {
    if (!ds) return;
    const firstField = ds.fields[0];
    setFilters(prev => [
      ...prev,
      { id: `f${Date.now()}`, field: firstField.id, operator: OPERATORS[firstField.type][0], value: '' },
    ]);
  }, [ds]);

  const updateFilter = useCallback((id, key, val) => {
    setFilters(prev => prev.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [key]: val };
      if (key === 'field' && ds) {
        const fdef = ds.fields.find(fd => fd.id === val);
        if (fdef) { updated.operator = OPERATORS[fdef.type][0]; updated.value = ''; }
      }
      return updated;
    }));
  }, [ds]);

  const removeFilter = useCallback((id) => setFilters(prev => prev.filter(f => f.id !== id)), []);

  // ── Run report ────────────────────────────────────────────────────────────
  const runReport = useCallback(() => {
    if (!ds) return;
    // Live mode: use fetched rows; demo mode: use hardcoded seed rows
    let rows = [...((!DEMO_MODE && sourceRows) ? sourceRows : ds.rows)];

    // Apply every filter that has a value
    for (const f of filters) {
      if (!f.field || f.value === '' || f.value == null) continue;
      const fdef = ds.fields.find(fd => fd.id === f.field);
      if (!fdef) continue;
      rows = rows.filter(row => {
        const val = row[f.field];
        const fv  = f.value;
        if (fdef.type === 'string') {
          const s = String(val ?? '').toLowerCase();
          const q = fv.toLowerCase();
          if (f.operator === 'contains')     return s.includes(q);
          if (f.operator === 'equals')       return s === q;
          if (f.operator === 'starts with')  return s.startsWith(q);
          if (f.operator === 'not contains') return !s.includes(q);
        }
        if (fdef.type === 'number') {
          const n = Number(val), v = Number(fv);
          if (f.operator === '=')  return n === v;
          if (f.operator === '>')  return n > v;
          if (f.operator === '<')  return n < v;
          if (f.operator === '>=') return n >= v;
          if (f.operator === '<=') return n <= v;
          if (f.operator === '≠')  return n !== v;
        }
        if (fdef.type === 'date') {
          if (f.operator === 'before') return val < fv;
          if (f.operator === 'after')  return val > fv;
          if (f.operator === 'equals') return val === fv;
        }
        if (fdef.type === 'enum') {
          if (f.operator === 'is')     return val === fv;
          if (f.operator === 'is not') return val !== fv;
        }
        return true;
      });
    }

    // Sort
    if (sortField) {
      rows.sort((a, b) => {
        const av = a[sortField], bv = b[sortField];
        if (typeof av === 'number' && typeof bv === 'number')
          return sortDir === 'desc' ? bv - av : av - bv;
        return sortDir === 'desc'
          ? String(bv).localeCompare(String(av))
          : String(av).localeCompare(String(bv));
      });
    }

    setResults(rows);
    setHasRun(true);
  }, [ds, filters, sortField, sortDir]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveReport = useCallback(async () => {
    if (!source || !reportName.trim() || saveInFlight) return;
    const rowCount = results?.length ?? 0;

    if (DEMO_MODE) {
      setSavedReports(prev => [{
        id: `RPT-${Date.now()}`,
        name: reportName.trim(),
        source,
        fields: [...selectedFields],
        filters: filters.map(f => ({ ...f })),
        sortField,
        sortDir,
        createdAt: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
        rowCount,
      }, ...prev]);
      return;
    }

    // Live mode — persist to backend
    setSaveInFlight(true);
    try {
      const created = await api.reports.save({
        name:           reportName.trim(),
        source,
        fields:         [...selectedFields],
        filters:        filters.map(f => ({ ...f })),
        sort_field:     sortField || null,
        sort_dir:       sortDir,
        last_row_count: rowCount,
      });
      setSavedReports(prev => [{
        id:        created.id,
        name:      created.name,
        source:    created.source,
        fields:    created.fields  || [],
        filters:   created.filters || [],
        sortField: created.sort_field || '',
        sortDir:   created.sort_dir   || 'desc',
        rowCount:  created.last_row_count ?? 0,
        createdAt: new Date(created.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
      }, ...prev]);
    } catch (err) {
      console.error('[Reports] Save failed:', err);
    } finally {
      setSaveInFlight(false);
    }
  }, [source, reportName, selectedFields, filters, sortField, sortDir, results, saveInFlight]);

  // ── Delete saved report ────────────────────────────────────────────────────
  const deleteReport = useCallback(async (id) => {
    setSavedReports(prev => prev.filter(r => r.id !== id)); // optimistic
    if (!DEMO_MODE) {
      try {
        await api.reports.deleteSaved(id);
      } catch (err) {
        console.error('[Reports] Delete failed:', err);
      }
    }
  }, []);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    if (!results || !ds) return;
    const cols = visibleFields;
    const headers = cols.map(id => ds.fields.find(f => f.id === id)?.label || id);
    const csvRows = [
      headers.join(','),
      ...results.map(row =>
        cols.map(id => {
          const v = row[id];
          const s = v == null ? '' : String(v);
          return s.includes(',') ? `"${s}"` : s;
        }).join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${reportName || 'report'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, ds, visibleFields, reportName]);

  if (access === 'none') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-5xl opacity-30">🔒</div>
        <p className="text-gray-400 font-semibold">Access Denied</p>
        <p className="text-sm text-gray-600">Contact your admin to request access to Report Builder.</p>
      </div>
    );
  }

  const VIEW_TABS = [
    { id: 'templates', label: 'Templates',      Icon: Star     },
    { id: 'builder',   label: 'Report Builder', Icon: Filter   },
    { id: 'saved',     label: savedReports.length > 0 ? `Saved (${savedReports.length})` : 'Saved', Icon: BookOpen },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0 bg-gray-950">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-cyan-500" />
          <div>
            <h1 className="font-black text-gray-100 text-base">Report Builder</h1>
            <p className="text-xs text-gray-500">Ad-hoc cross-module queries — no code required</p>
          </div>
        </div>
        <div id="kernal-module-tabs" className="flex items-center gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
          {VIEW_TABS.map(tab => {
            const Icon = tab.Icon;
            return (
              <button key={tab.id} onClick={() => setView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  view === tab.id
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TEMPLATES ──────────────────────────────────────────────────────── */}
      {view === 'templates' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-200">Pre-Built Report Templates</h2>
            <p className="text-xs text-gray-500 mt-1">Click any template to open it in the builder — then adjust filters, columns, and sort before running.</p>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {TEMPLATES.map(tmpl => {
              const SrcMeta = DATA_SOURCES[tmpl.source];
              const SrcIcon = SrcMeta.icon;
              return (
                <button key={tmpl.id} onClick={() => loadTemplate(tmpl)}
                  className="text-left p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${SrcMeta.bg}`}>
                      <SrcIcon className={`w-4 h-4 ${SrcMeta.color}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[tmpl.category] || 'bg-gray-700 text-gray-400'}`}>
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-200 group-hover:text-cyan-300 transition-colors leading-snug">{tmpl.name}</p>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{tmpl.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-600">
                    <span>{SrcMeta.label}</span>
                    <span>·</span>
                    <span>{tmpl.fields.length} cols</span>
                    {tmpl.filters.length > 0 && <><span>·</span><span>{tmpl.filters.length} filter{tmpl.filters.length !== 1 ? 's' : ''}</span></>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start from scratch */}
          <div className="mt-6 p-4 rounded-xl border border-dashed border-gray-700 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">Build a Custom Report from Scratch</p>
              <p className="text-xs text-gray-500">Choose any data source, pick your columns, and add filters.</p>
            </div>
            <button onClick={() => { setSource(null); setView('builder'); }}
              className="ml-auto shrink-0 px-4 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/25 transition-colors">
              Open Builder →
            </button>
          </div>
        </div>
      )}

      {/* ── BUILDER ────────────────────────────────────────────────────────── */}
      {view === 'builder' && (
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* Source picker (shown when no source selected) */}
          {!source && (
            <div className="flex-1 overflow-auto p-6">
              <h2 className="text-sm font-bold text-gray-200 mb-1">Choose a Data Source</h2>
              <p className="text-xs text-gray-500 mb-5">Select the dataset you want to query</p>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(DATA_SOURCES).map(([key, src]) => {
                  const Icon = src.icon;
                  return (
                    <button key={key} onClick={() => selectSource(key)}
                      className="text-left p-5 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${src.bg}`}>
                        <Icon className={`w-5 h-5 ${src.color}`} />
                      </div>
                      <p className="text-sm font-bold text-gray-200 group-hover:text-cyan-300 transition-colors">{src.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{src.description}</p>
                      <p className="text-[10px] text-gray-600 mt-2">{src.fields.length} fields</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Source selected — builder + results */}
          {source && ds && (
            <div className="flex-1 overflow-hidden flex flex-col">

              {/* Breadcrumb bar */}
              <div className="px-6 py-2.5 border-b border-gray-800 flex items-center gap-3 shrink-0 bg-gray-900/40">
                {React.createElement(ds.icon, { className: `w-4 h-4 ${ds.color} shrink-0` })}
                <span className="text-xs font-bold text-gray-300">{ds.label}</span>
                <span className="text-gray-700">·</span>
                <button onClick={() => { setSource(null); setResults(null); setHasRun(false); }}
                  className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">Change source</button>
                <div className="ml-auto flex items-center gap-2">
                  <input
                    value={reportName}
                    onChange={e => setReportName(e.target.value)}
                    placeholder="Report name…"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 w-44"
                  />
                  <button onClick={saveReport} disabled={!reportName.trim() || saveInFlight}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      reportName.trim() && !saveInFlight
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-400'
                        : 'opacity-40 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-500'
                    }`}>
                    {saveInFlight
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                      : <><Save className="w-3.5 h-3.5" /> Save</>
                    }
                  </button>
                  <button onClick={runReport}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 text-gray-950 text-xs font-bold hover:bg-cyan-400 transition-colors shadow-sm shadow-cyan-500/20">
                    <Zap className="w-3.5 h-3.5" /> Run Report
                  </button>
                </div>
              </div>

              {/* 3-pane layout: Fields | Filters+Sort | Results */}
              <div className="flex-1 overflow-hidden flex">

                {/* Left sidebar: Columns + Filters + Sort */}
                <div className="w-68 shrink-0 border-r border-gray-800 overflow-auto flex flex-col" style={{ width: '17rem' }}>

                  {/* Columns */}
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-300">Columns</p>
                      <div className="flex gap-2 text-[10px]">
                        <button onClick={() => setSelectedFields(ds.fields.map(f => f.id))} className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">All</button>
                        <button onClick={() => setSelectedFields([])} className="text-gray-500 hover:text-gray-400 transition-colors">None</button>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      {ds.fields.map(field => {
                        const isOn = selectedFields.includes(field.id);
                        return (
                          <label key={field.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors">
                            <button onClick={() => toggleField(field.id)}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isOn ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600 hover:border-cyan-400'}`}>
                              {isOn && <Check className="w-2.5 h-2.5 text-gray-950" strokeWidth={3} />}
                            </button>
                            <span className="text-xs text-gray-300 flex-1">{field.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              field.type === 'number' ? 'bg-blue-500/10 text-blue-400' :
                              field.type === 'date'   ? 'bg-violet-500/10 text-violet-400' :
                              field.type === 'enum'   ? 'bg-amber-500/10 text-amber-400' :
                              'bg-gray-700 text-gray-500'
                            }`}>{field.type}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-300">Filters</p>
                      <button onClick={addFilter}
                        className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    {filters.length === 0 && (
                      <p className="text-[10px] text-gray-600 italic">No filters — showing all {ds.rows.length} records</p>
                    )}
                    <div className="space-y-2">
                      {filters.map((filter, idx) => {
                        const fdef = ds.fields.find(f => f.id === filter.field);
                        const ops  = fdef ? OPERATORS[fdef.type] : [];
                        return (
                          <div key={filter.id} className="space-y-1">
                            {idx > 0 && <p className="text-[9px] font-bold text-gray-600 pl-1">AND</p>}
                            <div className="bg-gray-800/60 rounded-lg p-2 space-y-1.5">
                              <div className="flex items-center gap-1">
                                <select value={filter.field} onChange={e => updateFilter(filter.id, 'field', e.target.value)}
                                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300 outline-none">
                                  {ds.fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </select>
                                <button onClick={() => removeFilter(filter.id)} className="text-gray-600 hover:text-rose-400 transition-colors shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <select value={filter.operator} onChange={e => updateFilter(filter.id, 'operator', e.target.value)}
                                  className="w-24 shrink-0 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-400 outline-none">
                                  {ops.map(op => <option key={op} value={op}>{op}</option>)}
                                </select>
                                {fdef?.type === 'enum' ? (
                                  <select value={filter.value} onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-300 outline-none">
                                    <option value="">— pick —</option>
                                    {fdef.options.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                ) : fdef?.type === 'date' ? (
                                  <input type="date" value={filter.value} onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-300 outline-none" />
                                ) : (
                                  <input value={filter.value} onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                                    placeholder="value…"
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-300 outline-none" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="p-4">
                    <p className="text-xs font-bold text-gray-300 mb-2">Sort</p>
                    <div className="flex gap-2">
                      <select value={sortField} onChange={e => setSortField(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none">
                        <option value="">— no sort —</option>
                        {ds.fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                      <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                        title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
                        className="px-2 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-cyan-400 transition-colors shrink-0">
                        {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-600 mt-1.5">
                      {sortField ? `${ds.fields.find(f => f.id === sortField)?.label} · ${sortDir === 'desc' ? 'Highest first' : 'Lowest first'}` : 'Click column headers in results to sort'}
                    </p>
                  </div>
                </div>

                {/* Results pane */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Loading spinner while fetching source rows */}
                  {sourceLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                      <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                      <p className="text-sm text-gray-400">Loading {ds.label} data…</p>
                    </div>
                  )}
                  {/* Source fetch error */}
                  {!sourceLoading && sourceError && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <p className="text-sm font-semibold text-gray-300">Failed to load data</p>
                      <p className="text-xs text-gray-500">{sourceError}</p>
                      <button onClick={() => setSource(s => s)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                        Retry
                      </button>
                    </div>
                  )}
                  {!hasRun && !sourceLoading && !sourceError ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-300">Ready to run</p>
                        <p className="text-sm text-gray-500 mt-1">Configure columns, filters, and sort — then click <strong className="text-gray-300">Run Report</strong>.</p>
                        <p className="text-xs text-gray-600 mt-2">
                          {visibleFields.length} column{visibleFields.length !== 1 ? 's' : ''} ·{' '}
                          {filters.filter(f => f.value).length} filter{filters.filter(f => f.value).length !== 1 ? 's' : ''} active ·{' '}
                          {DEMO_MODE ? ds.rows.length : (sourceRows?.length ?? '…')} source records
                        </p>
                      </div>
                      <button onClick={runReport}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-gray-950 font-bold hover:bg-cyan-400 transition-colors">
                        <Zap className="w-4 h-4" /> Run Report
                      </button>
                    </div>
                  ) : results && !sourceLoading && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      {/* Results toolbar */}
                      <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-3 shrink-0 flex-wrap">
                        <span className="text-xs font-bold text-gray-300">
                          {results.length} row{results.length !== 1 ? 's' : ''}
                        </span>
                        {/* Active filter chips */}
                        <div className="flex gap-1 flex-wrap">
                          {filters.filter(f => f.value).map(f => {
                            const lbl = ds.fields.find(fd => fd.id === f.field)?.label;
                            return (
                              <span key={f.id}
                                className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-0.5 font-semibold">
                                {lbl} {f.operator} {f.value}
                              </span>
                            );
                          })}
                        </div>
                        <div className="ml-auto flex gap-2">
                          <button onClick={runReport}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors">
                            <Zap className="w-3 h-3" /> Re-run
                          </button>
                          <button onClick={exportCSV}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors">
                            <Download className="w-3 h-3" /> Export CSV
                          </button>
                        </div>
                      </div>

                      {/* Results table */}
                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="border-b border-gray-800 sticky top-0 bg-gray-900/95 backdrop-blur-sm">
                            <tr>
                              {visibleFields.map(fid => {
                                const fdef    = ds.fields.find(f => f.id === fid);
                                const isSorted = sortField === fid;
                                return (
                                  <th key={fid}
                                    onClick={() => {
                                      setSortField(fid);
                                      setSortDir(d => isSorted ? (d === 'desc' ? 'asc' : 'desc') : 'desc');
                                    }}
                                    className="px-4 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px] cursor-pointer hover:text-cyan-400 transition-colors whitespace-nowrap select-none">
                                    {fdef?.label || fid}
                                    {isSorted && <span className="ml-1 text-cyan-400">{sortDir === 'desc' ? '↓' : '↑'}</span>}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/50">
                            {results.length === 0 ? (
                              <tr>
                                <td colSpan={visibleFields.length} className="px-4 py-12 text-center text-gray-500">
                                  No records match the current filters.
                                </td>
                              </tr>
                            ) : results.map((row, ri) => (
                              <tr key={ri} className="hover:bg-gray-800/30 transition-colors">
                                {visibleFields.map(fid => {
                                  const val  = row[fid];
                                  const fdef = ds.fields.find(f => f.id === fid);

                                  // Status/enum badge
                                  if (fid === 'status' || fid === 'reorder_status') {
                                    const sc = STATUS_COLORS[val] || 'bg-gray-700 text-gray-400';
                                    return (
                                      <td key={fid} className="px-4 py-2.5">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc}`}>{val ?? '—'}</span>
                                      </td>
                                    );
                                  }
                                  // % fields
                                  if (PCT_FIELDS.has(fid)) {
                                    const pct = Number(val);
                                    const cls = pct >= 90 ? 'text-emerald-400 font-semibold' : pct >= 70 ? 'text-amber-400' : 'text-rose-400';
                                    return <td key={fid} className={`px-4 py-2.5 tabular-nums ${cls}`}>{val != null ? `${val}%` : '—'}</td>;
                                  }
                                  // Currency
                                  if (CURRENCY_FIELDS.has(fid)) {
                                    return <td key={fid} className="px-4 py-2.5 tabular-nums text-gray-200 font-semibold">{val != null ? fmt(val) : '—'}</td>;
                                  }
                                  // Date
                                  if (fdef?.type === 'date') {
                                    return <td key={fid} className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{fmtDate(val)}</td>;
                                  }
                                  // Number
                                  if (typeof val === 'number') {
                                    return <td key={fid} className="px-4 py-2.5 tabular-nums text-gray-300">{val.toLocaleString()}</td>;
                                  }
                                  // Default string
                                  return <td key={fid} className="px-4 py-2.5 text-gray-300">{val ?? '—'}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SAVED REPORTS ──────────────────────────────────────────────────── */}
      {view === 'saved' && (
        <div className="flex-1 overflow-auto p-6">
          {savedLoading ? (
            <div className="flex items-center justify-center h-32 gap-3 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading saved reports…</span>
            </div>
          ) : savedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400">No saved reports yet</p>
                <p className="text-xs text-gray-600 mt-1">Build a report, give it a name, and click Save.</p>
              </div>
              <button onClick={() => setView('builder')} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Open Builder →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-gray-200 mb-4">Saved Reports ({savedReports.length})</h2>
              {savedReports.map(rpt => {
                const src  = DATA_SOURCES[rpt.source];
                const Icon = src?.icon || BarChart3;
                return (
                  <div key={rpt.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${src?.bg || 'bg-gray-800'}`}>
                      <Icon className={`w-5 h-5 ${src?.color || 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-200">{rpt.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {src?.label} · {rpt.fields.length} column{rpt.fields.length !== 1 ? 's' : ''} · {rpt.filters.length} filter{rpt.filters.length !== 1 ? 's' : ''} · {rpt.rowCount} row{rpt.rowCount !== 1 ? 's' : ''} · saved {rpt.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => loadTemplate(rpt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/25 transition-colors">
                        <Zap className="w-3 h-3" /> Load
                      </button>
                      <button onClick={() => deleteReport(rpt.id)}
                        title="Delete saved report"
                        className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
