import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';
import { Overlay, ModalBox, ModalHeader } from './shared/Modal.jsx';
import { TODAY } from './shared/components.jsx';
import { MOCK_INVENTORY } from './shared/mockInventory.js';
import { REP_RATES, MONTHLY_HISTORY, calcOrderCommission, QUALIFYING_STATUSES } from './shared/commissionData.js';
import { DEMO_MODE } from './lib/demoMode.js';
import { api } from './lib/api.js';
import { supabase } from './lib/supabase.js';

import {
  Home, Map as MapIcon, Building2, ShoppingCart, MapPin, TrendingUp,
  Search, Plus, Minus, X, Check, ChevronRight, ChevronLeft, ArrowRight,
  Phone, Mail, Calendar, Clock, AlertCircle, AlertTriangle, CheckCircle2,
  Package, Truck, DollarSign, CreditCard, FileText, PenTool, Camera,
  Star, Heart, Target, Award, Zap, Lightbulb, Filter, RefreshCcw,
  Edit2, Trash2, Send, Eye, Navigation, Route, Sparkles, MessageSquare,
  Tag, Receipt, BookOpen, Wifi, WifiOff, UploadCloud, ArrowUpDown,
  Activity, ChevronDown, UserPlus, FileSignature, ShieldAlert,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — James Wilson's territory, New Orleans metro
// ─────────────────────────────────────────────────────────────────────────────

const REP = { id: 'U009', name: 'James Wilson', initials: 'JW', territory: 'New Orleans Metro', deviceLocation: { x: 38, y: 45 } };

// 8 customer accounts. Coords are 0-100 relative to the territory map.
const INITIAL_CUSTOMERS = [
  {
    id: 'CUST-501', name: "Joe's Steakhouse Downtown", type: 'Restaurant',
    address: '825 Canal St', city: 'New Orleans, LA 70112',
    contact: { name: 'Joseph Miller', title: 'Owner', phone: '(504) 555-0100', email: 'joe@joessteak.com' },
    location: { x: 30, y: 40 }, route: 'Route-12', deliveryDays: 'Tue / Thu',
    status: 'Active', healthScore: 92, creditLimit: 50000, availableCredit: 12500,
    arBalance: 37500, arAging: { current: 22000, days30: 15500, days60: 0, days90: 0 }, creditHold: false,
    ytdSpend: 145000, lastOrderDate: '2026-05-21', lastOrderTotal: 1842.50,
    avgOrderValue: 1200, ordersThisMonth: 9, lastVisitDate: '2026-05-18',
    contractPricing: { 3: 79.00 },
    orderGuide: [
      { sku: 'FRZ-BEEF-01', avgQty: 8, lastQty: 6, cadenceDays: 7, lastOrderedDate: '2026-05-21' },
      { sku: 'BAK-BUN-01',  avgQty: 4, lastQty: 4, cadenceDays: 7, lastOrderedDate: '2026-05-21' },
      { sku: 'DAI-CHE-02',  avgQty: 3, lastQty: 3, cadenceDays: 14, lastOrderedDate: '2026-05-14' },
      { sku: 'PRO-TOMA-01', avgQty: 2, lastQty: 2, cadenceDays: 7, lastOrderedDate: '2026-05-21' },
      { sku: 'PRO-LET-01',  avgQty: 3, lastQty: 3, cadenceDays: 7, lastOrderedDate: '2026-05-21' },
    ],
  },
  {
    id: 'CUST-503', name: 'Sunset Diner & Grill', type: 'Restaurant',
    address: '4012 Magazine St', city: 'New Orleans, LA 70115',
    contact: { name: 'Maria Sanchez', title: 'GM', phone: '(504) 555-0203', email: 'maria@sunsetdiner.com' },
    location: { x: 70, y: 60 }, route: 'Route-08', deliveryDays: 'Mon / Wed / Fri',
    status: 'At Risk', healthScore: 38, creditLimit: 15000, availableCredit: 0,
    arBalance: 15000, arAging: { current: 0, days30: 0, days60: 5000, days90: 10000 }, creditHold: true,
    ytdSpend: 4500, lastOrderDate: '2026-04-22', lastOrderTotal: 320.00,
    avgOrderValue: 300, ordersThisMonth: 0, lastVisitDate: '2026-05-08',
    contractPricing: {}, orderGuide: [
      { sku: 'PROT-002',    avgQty: 2, lastQty: 2, cadenceDays: 14, lastOrderedDate: '2026-04-22' },
      { sku: 'DRY-RICE-05', avgQty: 1, lastQty: 1, cadenceDays: 30, lastOrderedDate: '2026-04-22' },
    ],
    alerts: [
      { type: 'churn', text: 'No orders in 32 days. Last order down 73% vs. trend.' },
      { type: 'credit', text: '$15,000 outstanding — $10K in 90+ aging. Credit hold in effect.' },
      { type: 'competitor', text: 'Driver reported competitor truck on site 2 weeks ago.' },
    ],
  },
  {
    id: 'CUST-505', name: 'Magnolia Bistro', type: 'Restaurant',
    address: '2031 St Charles Ave', city: 'New Orleans, LA 70130',
    contact: { name: 'Henri Boudreaux', title: 'Chef-Owner', phone: '(504) 555-0305', email: 'henri@magnoliabistro.com' },
    location: { x: 52, y: 38 }, route: 'Route-12', deliveryDays: 'Tue / Fri',
    status: 'Active', healthScore: 84, creditLimit: 40000, availableCredit: 28000,
    arBalance: 12000, arAging: { current: 12000, days30: 0, days60: 0, days90: 0 }, creditHold: false,
    ytdSpend: 98500, lastOrderDate: '2026-05-19', lastOrderTotal: 2840.00,
    avgOrderValue: 950, ordersThisMonth: 7, lastVisitDate: '2026-05-19',
    contractPricing: {}, orderGuide: [
      { sku: 'PROT-003', avgQty: 4, lastQty: 4, cadenceDays: 7, lastOrderedDate: '2026-05-19' },
      { sku: 'PROT-010', avgQty: 2, lastQty: 3, cadenceDays: 14, lastOrderedDate: '2026-05-12' },
      { sku: 'DAI-MILK-02', avgQty: 6, lastQty: 6, cadenceDays: 7, lastOrderedDate: '2026-05-19' },
      { sku: 'DAI-BUT-01', avgQty: 2, lastQty: 2, cadenceDays: 14, lastOrderedDate: '2026-05-12' },
    ],
  },
  {
    id: 'CUST-507', name: 'Riverside Tavern', type: 'Bar & Grill',
    address: '1500 Decatur St', city: 'New Orleans, LA 70116',
    contact: { name: 'Tony Russo', title: 'Owner', phone: '(504) 555-0407', email: 'tony@riversidetavern.com' },
    location: { x: 22, y: 55 }, route: 'Route-14', deliveryDays: 'Mon / Thu',
    status: 'Active', healthScore: 71, creditLimit: 25000, availableCredit: 18500,
    arBalance: 6500, arAging: { current: 6500, days30: 0, days60: 0, days90: 0 }, creditHold: false,
    ytdSpend: 62800, lastOrderDate: '2026-05-20', lastOrderTotal: 985.00,
    avgOrderValue: 720, ordersThisMonth: 6, lastVisitDate: '2026-05-02',
    contractPricing: {}, orderGuide: [
      { sku: 'FRZ-BEEF-01', avgQty: 4, lastQty: 4, cadenceDays: 7, lastOrderedDate: '2026-05-20' },
      { sku: 'BAK-BUN-01',  avgQty: 3, lastQty: 3, cadenceDays: 7, lastOrderedDate: '2026-05-20' },
      { sku: 'DRY-OIL-5G',  avgQty: 1, lastQty: 1, cadenceDays: 21, lastOrderedDate: '2026-05-06' },
    ],
    alerts: [
      { type: 'visit', text: 'No visit in 23 days — your standard cadence is 14 days.' },
    ],
  },
  {
    id: 'CUST-509', name: 'Crescent Café', type: 'Café',
    address: '7220 St Charles Ave', city: 'New Orleans, LA 70118',
    contact: { name: 'Bella Tran', title: 'Owner', phone: '(504) 555-0510', email: 'bella@crescentcafe.com' },
    location: { x: 78, y: 30 }, route: 'Route-09', deliveryDays: 'Wed',
    status: 'Active', healthScore: 88, creditLimit: 12000, availableCredit: 11200,
    arBalance: 800, arAging: { current: 800, days30: 0, days60: 0, days90: 0 }, creditHold: false,
    ytdSpend: 28400, lastOrderDate: '2026-05-22', lastOrderTotal: 415.00,
    avgOrderValue: 380, ordersThisMonth: 4, lastVisitDate: '2026-05-15',
    contractPricing: {}, orderGuide: [
      { sku: 'DAI-MILK-02', avgQty: 8, lastQty: 8, cadenceDays: 7, lastOrderedDate: '2026-05-22' },
      { sku: 'DAI-BUT-01',  avgQty: 1, lastQty: 1, cadenceDays: 14, lastOrderedDate: '2026-05-15' },
      { sku: 'BAK-BUN-01',  avgQty: 2, lastQty: 2, cadenceDays: 7, lastOrderedDate: '2026-05-22' },
    ],
  },
  {
    id: 'CUST-511', name: 'The Garden District Grill', type: 'Restaurant',
    address: '1455 Prytania St', city: 'New Orleans, LA 70130',
    contact: { name: 'Patricia Goldman', title: 'GM', phone: '(504) 555-0611', email: 'patricia@gdgrill.com' },
    location: { x: 58, y: 65 }, route: 'Route-12', deliveryDays: 'Mon / Wed / Fri',
    status: 'Active', healthScore: 95, creditLimit: 75000, availableCredit: 52000,
    arBalance: 23000, arAging: { current: 23000, days30: 0, days60: 0, days90: 0 }, creditHold: false,
    ytdSpend: 218000, lastOrderDate: '2026-05-22', lastOrderTotal: 3420.00,
    avgOrderValue: 1850, ordersThisMonth: 12, lastVisitDate: '2026-05-20',
    contractPricing: { 3: 75.50, 45: 28.00 }, orderGuide: [
      { sku: 'FRZ-BEEF-01', avgQty: 12, lastQty: 14, cadenceDays: 3, lastOrderedDate: '2026-05-22' },
      { sku: 'PROT-002',    avgQty: 8, lastQty: 8, cadenceDays: 3, lastOrderedDate: '2026-05-22' },
      { sku: 'PROT-003',    avgQty: 4, lastQty: 4, cadenceDays: 7, lastOrderedDate: '2026-05-17' },
      { sku: 'DAI-MILK-02', avgQty: 10, lastQty: 10, cadenceDays: 3, lastOrderedDate: '2026-05-22' },
      { sku: 'PRO-LET-01',  avgQty: 6, lastQty: 6, cadenceDays: 3, lastOrderedDate: '2026-05-22' },
      { sku: 'PRO-TOMA-01', avgQty: 4, lastQty: 4, cadenceDays: 3, lastOrderedDate: '2026-05-22' },
    ],
  },
  {
    id: 'CUST-513', name: 'Bywater Brewhouse', type: 'Brewpub',
    address: '3000 Royal St', city: 'New Orleans, LA 70117',
    contact: { name: 'Marcus Webb', title: 'Owner', phone: '(504) 555-0713', email: 'marcus@bywaterbrew.com' },
    location: { x: 18, y: 70 }, route: 'Route-14', deliveryDays: 'Tue / Sat',
    status: 'Active', healthScore: 78, creditLimit: 20000, availableCredit: 14500,
    arBalance: 5500, arAging: { current: 5500, days30: 0, days60: 0, days90: 0 }, creditHold: false,
    ytdSpend: 41200, lastOrderDate: '2026-05-21', lastOrderTotal: 680.00,
    avgOrderValue: 540, ordersThisMonth: 5, lastVisitDate: '2026-05-07',
    contractPricing: {}, orderGuide: [
      { sku: 'FRZ-BEEF-01', avgQty: 3, lastQty: 3, cadenceDays: 7, lastOrderedDate: '2026-05-21' },
      { sku: 'PROT-010',    avgQty: 2, lastQty: 2, cadenceDays: 14, lastOrderedDate: '2026-05-14' },
      { sku: 'BAK-BUN-01',  avgQty: 2, lastQty: 2, cadenceDays: 7, lastOrderedDate: '2026-05-21' },
    ],
  },
  {
    id: 'CUST-515', name: 'Audubon Catering Co.', type: 'Catering',
    address: '6400 Magazine St', city: 'New Orleans, LA 70118',
    contact: { name: 'Diane Lefebvre', title: 'Director of Ops', phone: '(504) 555-0815', email: 'diane@auduboncatering.com' },
    location: { x: 85, y: 50 }, route: 'Route-09', deliveryDays: 'Variable',
    status: 'Active', healthScore: 82, creditLimit: 45000, availableCredit: 31000,
    arBalance: 14000, arAging: { current: 9000, days30: 5000, days60: 0, days90: 0 }, creditHold: false,
    ytdSpend: 92500, lastOrderDate: '2026-05-18', lastOrderTotal: 2200.00,
    avgOrderValue: 1400, ordersThisMonth: 5, lastVisitDate: '2026-04-28',
    contractPricing: {}, orderGuide: [
      { sku: 'PROT-010',    avgQty: 6, lastQty: 6, cadenceDays: 14, lastOrderedDate: '2026-05-18' },
      { sku: 'PROT-003',    avgQty: 4, lastQty: 4, cadenceDays: 14, lastOrderedDate: '2026-05-18' },
      { sku: 'PRO-TOMA-01', avgQty: 3, lastQty: 3, cadenceDays: 14, lastOrderedDate: '2026-05-18' },
      { sku: 'DAI-CHE-02',  avgQty: 2, lastQty: 2, cadenceDays: 14, lastOrderedDate: '2026-05-18' },
    ],
    alerts: [
      { type: 'visit', text: 'No visit in 26 days — large account, scheduled cadence is monthly.' },
    ],
  },
];

// Past orders — keyed by customerId for fast lookup, but also flat for filtering
const INITIAL_ORDERS = [
  // Joe's Steakhouse — recent history
  { id: 'ORD-9821', customerId: 'CUST-501', date: '2026-05-21', deliveryDate: '2026-05-23', status: 'Out for Delivery',  total: 1842.50, items: [{ sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb', qty:6, unitPrice:168.00 }, { sku:'BAK-BUN-01', description:'Brioche Burger Buns 12pk', qty:4, unitPrice:38.00 }, { sku:'PRO-TOMA-01', description:'Roma Tomatoes 25lb', qty:2, unitPrice:32.00 }, { sku:'PRO-LET-01', description:'Iceberg Lettuce 24ct', qty:3, unitPrice:41.00 }, { sku:'SVC-DELIVERY', description:'Delivery Fee', qty:1, unitPrice:35.00 }] },
  { id: 'ORD-9788', customerId: 'CUST-501', date: '2026-05-14', deliveryDate: '2026-05-16', status: 'Delivered',          total: 1620.00, items: [{ sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb', qty:6, unitPrice:168.00 }, { sku:'BAK-BUN-01', description:'Brioche Burger Buns 12pk', qty:4, unitPrice:38.00 }, { sku:'DAI-CHE-02', description:'American Cheese 5lb', qty:3, unitPrice:48.00 }, { sku:'PRO-TOMA-01', description:'Roma Tomatoes 25lb', qty:2, unitPrice:32.00 }] },
  { id: 'ORD-9712', customerId: 'CUST-501', date: '2026-05-07', deliveryDate: '2026-05-09', status: 'Delivered',          total: 1745.00, items: [{ sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb', qty:7, unitPrice:168.00 }, { sku:'BAK-BUN-01', description:'Brioche Burger Buns 12pk', qty:4, unitPrice:38.00 }, { sku:'PRO-LET-01', description:'Iceberg Lettuce 24ct', qty:3, unitPrice:41.00 }] },
  // Magnolia Bistro
  { id: 'ORD-9810', customerId: 'CUST-505', date: '2026-05-19', deliveryDate: '2026-05-21', status: 'Delivered',          total: 2840.00, items: [{ sku:'PROT-003', description:'Atlantic Salmon Fillet 5lb', qty:4, unitPrice:92.00 }, { sku:'PROT-010', description:'Shrimp Jumbo 16/20 ct 5lb', qty:3, unitPrice:108.00 }, { sku:'DAI-MILK-02', description:'Whole Milk 1 Gal 4pk', qty:6, unitPrice:26.50 }, { sku:'DAI-BUT-01', description:'Butter Unsalted 1lb 36ct', qty:2, unitPrice:72.00 }] },
  // Riverside Tavern
  { id: 'ORD-9815', customerId: 'CUST-507', date: '2026-05-20', deliveryDate: '2026-05-22', status: 'Picking',            total: 985.00, items: [{ sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb', qty:4, unitPrice:168.00 }, { sku:'BAK-BUN-01', description:'Brioche Burger Buns 12pk', qty:3, unitPrice:38.00 }, { sku:'DRY-OIL-5G', description:'Vegetable Oil 5 Gal', qty:1, unitPrice:46.00 }] },
  // Crescent Café
  { id: 'ORD-9824', customerId: 'CUST-509', date: '2026-05-22', deliveryDate: '2026-05-24', status: 'Submitted',          total: 415.00, items: [{ sku:'DAI-MILK-02', description:'Whole Milk 1 Gal 4pk', qty:8, unitPrice:26.50 }, { sku:'BAK-BUN-01', description:'Brioche Burger Buns 12pk', qty:2, unitPrice:38.00 }] },
  // Garden District Grill
  { id: 'ORD-9822', customerId: 'CUST-511', date: '2026-05-22', deliveryDate: '2026-05-24', status: 'Picking',            total: 3420.00, items: [{ sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb', qty:14, unitPrice:168.00 }, { sku:'PROT-002', description:'Chicken Breast 40lb', qty:8, unitPrice:132.00 }, { sku:'DAI-MILK-02', description:'Whole Milk 1 Gal 4pk', qty:10, unitPrice:26.50 }] },
  // Bywater Brewhouse
  { id: 'ORD-9819', customerId: 'CUST-513', date: '2026-05-21', deliveryDate: '2026-05-24', status: 'Submitted',          total: 680.00, items: [{ sku:'FRZ-BEEF-01', description:'Ground Beef 80/20 10lb', qty:3, unitPrice:168.00 }, { sku:'BAK-BUN-01', description:'Brioche Burger Buns 12pk', qty:2, unitPrice:38.00 }] },
  // Audubon Catering
  { id: 'ORD-9805', customerId: 'CUST-515', date: '2026-05-18', deliveryDate: '2026-05-20', status: 'Delivered',          total: 2200.00, items: [{ sku:'PROT-010', description:'Shrimp Jumbo 16/20 ct 5lb', qty:6, unitPrice:108.00 }, { sku:'PROT-003', description:'Atlantic Salmon Fillet 5lb', qty:4, unitPrice:92.00 }, { sku:'PRO-TOMA-01', description:'Roma Tomatoes 25lb', qty:3, unitPrice:32.00 }] },
];

// Activity log — visits, calls, emails, notes per customer
const INITIAL_ACTIVITIES = [
  { id: 'A-1', customerId: 'CUST-501', date: '2026-05-21', type: 'visit',   note: 'Quick stop — chef happy with last delivery. Discussed Q3 promo pricing.' },
  { id: 'A-2', customerId: 'CUST-501', date: '2026-05-18', type: 'visit',   note: 'Met with Joseph. Wants to add steak tartare to the menu — needs hand-cut tenderloin sourcing.' },
  { id: 'A-3', customerId: 'CUST-501', date: '2026-05-14', type: 'call',    note: 'Confirmed Thursday delivery window. AP cut check #4421 for $1,620.' },
  { id: 'A-4', customerId: 'CUST-503', date: '2026-05-08', type: 'visit',   note: 'Maria not on site. Left voicemail with Joey behind the bar. AR concern flagged.' },
  { id: 'A-5', customerId: 'CUST-503', date: '2026-04-29', type: 'email',   note: 'Sent past-due statement. No reply.' },
  { id: 'A-6', customerId: 'CUST-505', date: '2026-05-19', type: 'visit',   note: 'Henri walked me through new spring menu. Locking in salmon volume +25% for Q3.' },
  { id: 'A-7', customerId: 'CUST-507', date: '2026-05-02', type: 'visit',   note: 'Tony asked about the new craft buns. Sample pack delivered.' },
  { id: 'A-8', customerId: 'CUST-509', date: '2026-05-15', type: 'visit',   note: 'Bella mentioned expanding hours — milk volume will likely go up.' },
  { id: 'A-9', customerId: 'CUST-511', date: '2026-05-20', type: 'visit',   note: 'Quarterly review with Patricia. Renewing contract pricing for beef + lettuce.' },
  { id: 'A-10', customerId: 'CUST-513', date: '2026-05-07', type: 'visit',  note: 'Toured new walk-in cooler. Confirmed they can handle larger drops if we want to consolidate.' },
  { id: 'A-11', customerId: 'CUST-515', date: '2026-04-28', type: 'visit',  note: 'Diane discussed wedding-season volume ramp. Expect 30% lift starting June.' },
];

// Leads / prospects
const INITIAL_LEADS = [
  { id: 'LEAD-001', name: 'New Harbor Hotel',        type: 'Hospitality', location: { x: 45, y: 35 }, address: '500 Riverwalk Way',     contact: 'David Chen',     phone: '(504) 555-1001', email: 'david@newharborhotel.com', estValue: 120000, stage: 'Qualified', notes: 'Opening Aug 2026 — 180 rooms, in-house restaurant + banquet. Met with David at Restaurant Show.', addedDate: '2026-04-15' },
  { id: 'LEAD-002', name: 'Bayside Seafood',          type: 'Restaurant',  location: { x: 80, y: 20 }, address: '2100 Lakeshore Dr',    contact: 'Anna Kowalski',  phone: '(504) 555-1002', email: 'anna@bayside.com',          estValue: 65000,  stage: 'Proposed',  notes: 'Sent pricing proposal Apr 30. Currently with Sysco — contract expires Aug 1.', addedDate: '2026-04-02' },
  { id: 'LEAD-003', name: 'Marina Bay Resort',        type: 'Hospitality', location: { x: 92, y: 38 }, address: '8900 Lakeshore Dr',    contact: 'Robert Kim',      phone: '(504) 555-1003', email: 'robert@marinabay.com',      estValue: 240000, stage: 'New',       notes: 'Cold prospect. Drove past — they have a Sysco truck onsite Tue + Fri.', addedDate: '2026-05-19' },
  { id: 'LEAD-004', name: 'Bourbon Street Tavern',    type: 'Bar & Grill', location: { x: 28, y: 32 }, address: '741 Bourbon St',       contact: 'Frank DiNapoli', phone: '(504) 555-1004', email: 'frank@bourbontavern.com',   estValue: 45000,  stage: 'New',       notes: 'Walked in last week. Frank receptive, asked for sample pack of burger buns.', addedDate: '2026-05-15' },
  { id: 'LEAD-005', name: 'The Quarter Kitchen',      type: 'Restaurant',  location: { x: 35, y: 28 }, address: '320 Chartres St',      contact: 'Jules Beaumont',  phone: '(504) 555-1005', email: 'jules@thequarter.com',     estValue: 80000,  stage: 'Qualified', notes: 'Currently with US Foods. Opening 2nd location in fall — they want a single distributor.', addedDate: '2026-04-25' },
];

// Today's plan — sequence of stops for the rep
const TODAY_PLAN = [
  { customerId: 'CUST-511', window: '9:00 AM',  purpose: 'Quarterly review follow-up', estimatedDuration: 45 },
  { customerId: 'CUST-505', window: '10:30 AM', purpose: 'Take new order',             estimatedDuration: 30 },
  { customerId: 'CUST-507', window: '11:30 AM', purpose: 'Cadence check — overdue',    estimatedDuration: 30 },
  { customerId: 'CUST-515', window: '1:30 PM',  purpose: 'Catering volume planning',   estimatedDuration: 60 },
  { customerId: 'CUST-503', window: '3:00 PM',  purpose: 'AR conversation + recovery', estimatedDuration: 30 },
  { customerId: 'CUST-501', window: '4:00 PM',  purpose: 'Confirm Thursday delivery',  estimatedDuration: 20 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt$ = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(Number(n) || 0);
const fmtCompact = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
};
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
const daysSince = (d) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d + 'T12:00:00').getTime();
  return Math.floor(diff / (24*60*60*1000));
};

const ORDER_STATUS_STYLE = {
  'Submitted':         'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Picking':           'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Picked':            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Out for Delivery':  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Delivered':         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Cancelled':         'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Change Pending':    'bg-amber-500/10 text-amber-400 border-amber-500/20',
};
function OrderStatusBadge({ status }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${ORDER_STATUS_STYLE[status] || ORDER_STATUS_STYLE.Submitted}`}>{status}</span>;
}

const HEALTH_COLOR = (score) => score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-cyan-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400';
const HEALTH_BG = (score) => score >= 80 ? 'bg-emerald-500/10' : score >= 60 ? 'bg-cyan-500/10' : score >= 40 ? 'bg-amber-500/10' : 'bg-rose-500/10';

const LEAD_STAGE_STYLE = {
  'New':       'bg-gray-700 text-gray-300 border-gray-600',
  'Qualified': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Proposed':  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Won':       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Lost':      'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

// SKU lookup — module-level stub kept for reference; real lookup defined inside component
// so it can access live apiProducts in production mode

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function FieldSalesPortal() {
  const { submitApprovalRequest, approvalRequests, quickCreateAction, clearQuickCreateAction, activeUser,
          apiCustomers, apiOrders, apiProducts, apiInventory, refreshOrders } = useKernal();

  // SKU lookup: uses live apiProducts in production, MOCK_INVENTORY in demo
  const itemFromSku = useCallback((sku) => {
    if (DEMO_MODE) return MOCK_INVENTORY.find(i => i.sku === sku) || null;
    return (apiProducts || []).find(i => i.sku === sku) || null;
  }, [apiProducts]);

  // Derive active rep identity from the logged-in user rather than the hardcoded constant,
  // so switching users in the header correctly updates the rep identity shown in Field Sales.
  const activeRep = activeUser
    ? { ...REP, id: activeUser.id, name: activeUser.name,
        initials: activeUser.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() }
    : REP;

  // ── GPS tracking state ───────────────────────────────────────────────────────
  const [gpsStatus,       setGpsStatus]       = useState('idle');   // idle | active | error
  const [gpsPosition,     setGpsPosition]     = useState(null);     // { lat, lng, accuracy, heading, speed }
  const [liveRepPositions,setLiveRepPositions]= useState({});       // keyed by truck_id (REP-{userId})
  const [realtimeStatus,  setRealtimeStatus]  = useState('idle');   // idle | live | error
  const gpsWatchIdRef    = useRef(null);
  const gpsLastPostRef   = useRef(0);

  // ── GPS watchPosition: start on mount, post every 10 s ──────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('error'); return; }

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        setGpsStatus('active');
        setGpsPosition({ lat: latitude, lng: longitude, accuracy, heading, speed });

        if (!DEMO_MODE) {
          const now = Date.now();
          if (now - gpsLastPostRef.current < 10_000) return;   // 10-s throttle
          gpsLastPostRef.current = now;
          api.logistics.repLocation({
            lat:        latitude,
            lng:        longitude,
            heading:    heading   ?? null,
            speed_mph:  speed != null ? speed * 2.23694 : null,  // m/s → mph
            accuracy_m: accuracy  ?? null,
          }).catch(() => {/* silent — GPS pings are best-effort */});
        }
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      if (gpsWatchIdRef.current != null) navigator.geolocation.clearWatch(gpsWatchIdRef.current);
    };
  }, []);

  // ── REST seed: load current rep positions on mount (production only) ─────────
  useEffect(() => {
    if (DEMO_MODE) return;
    api.logistics.repLocations()
      .then(res => {
        const map = {};
        (res.data || []).forEach(loc => { map[loc.truck_id] = loc; });
        setLiveRepPositions(map);
      })
      .catch(() => {/* non-fatal */});
  }, []);

  // ── Supabase Realtime: live rep position updates ─────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('field-sales-rep-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations' }, (payload) => {
        const loc = payload.new;
        if (!loc?.truck_id?.startsWith('REP-')) return;   // ignore truck rows
        setLiveRepPositions(prev => ({ ...prev, [loc.truck_id]: loc }));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED')                           setRealtimeStatus('live');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('error');
      });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Quick Create: "New Order" from sidebar — jump to Order Entry (customer picker first)
  useEffect(() => {
    if (quickCreateAction === 'new-order') {
      setSection('orderEntry');
      setCartCustomerId(null);
      clearQuickCreateAction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickCreateAction]);

  // Top-level section state machine
  const [section, setSection] = useState('today');          // today / map / accounts / orderEntry / leads / performance
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedOrderId,    setSelectedOrderId]    = useState(null);
  const [selectedLeadId,     setSelectedLeadId]     = useState(null);
  const [showPayment,        setShowPayment]        = useState(false);
  const [showAddLead,        setShowAddLead]        = useState(false);
  const [showChangeRequest,  setShowChangeRequest]  = useState(false);

  // Data state
  const [customers,  setCustomers]   = useState(DEMO_MODE ? INITIAL_CUSTOMERS : []);
  const [orders,     setOrders]      = useState(DEMO_MODE ? INITIAL_ORDERS : []);
  const [leads,      setLeads]       = useState(DEMO_MODE ? INITIAL_LEADS : []);
  const [activities, setActivities]  = useState(DEMO_MODE ? INITIAL_ACTIVITIES : []);
  const [payments,   setPayments]    = useState([]);     // collected payments
  const [cart,       setCart]        = useState({});     // sku -> { qty, unitPrice, customPrice? }
  const [cartCustomerId, setCartCustomerId] = useState(null);

  const [isOffline,  setIsOffline]   = useState(false);
  const [outbox,     setOutbox]      = useState([]);
  const [toast,      setToast]       = useState(null);
  const [apiToast,   setApiToast]    = useState(null);
  const showApiToast = (msg) => { setApiToast(msg); setTimeout(() => setApiToast(null), 4000); };

  // ── Backend status map: backend lowercase → FSP display ──────────────────
  const STATUS_MAP = { draft:'Submitted', confirmed:'Submitted', picking:'Picking',
    picked:'Picking', shipped:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled' };

  // ── Map backend customer row → FSP customer shape ─────────────────────────
  const mapApiCustomer = (row) => ({
    id:              row.id,
    name:            row.name || '',
    type:            row.customer_type || 'Restaurant',
    address:         row.address_line1 || '',
    city:            `${row.city || ''}, ${row.state || ''} ${row.zip || ''}`.trim(),
    contact: {
      name:  row.primary_contact_name  || '',
      title: row.primary_contact_title || '',
      phone: row.phone || '',
      email: row.email || '',
    },
    location:        { x: 50, y: 50 },   // map coords — not in backend, default to center
    route:           row.route || '',
    deliveryDays:    row.delivery_days || '',
    status:          row.is_active ? 'Active' : 'Inactive',
    healthScore:     row.health_score || 75,
    creditLimit:     Number(row.credit_limit) || 0,
    availableCredit: Number(row.available_credit ?? Math.max(0, Number(row.credit_limit) - Number(row.ar_balance || 0))) || 0,
    arBalance:       Number(row.ar_balance || row.ar_balance_total || 0),
    arAging:         row.ar_aging || { current: Number(row.ar_balance || 0), days30: 0, days60: 0, days90: 0 },
    creditHold:      !!row.credit_hold,
    ytdSpend:        Number(row.ytd_spend) || 0,
    lastOrderDate:   row.last_order_date || null,
    lastOrderTotal:  Number(row.last_order_total) || 0,
    avgOrderValue:   Number(row.avg_order_value) || 0,
    ordersThisMonth: Number(row.orders_this_month) || 0,
    lastVisitDate:   row.last_visit_date || null,
    contractPricing: {},
    orderGuide:      [],
    alerts:          [],
  });

  // ── Map backend order row → FSP order shape ───────────────────────────────
  const mapApiOrder = (row) => ({
    id:           row.id,
    customerId:   row.customer_id,
    date:         row.order_date || row.created_at?.split('T')[0] || TODAY,
    deliveryDate: row.requested_delivery_date || row.order_date || TODAY,
    status:       STATUS_MAP[row.status] || row.status || 'Submitted',
    total:        Number(row.total_amount) || 0,
    items: (row.order_items || []).map(li => ({
      sku:         li.products?.sku || li.product_id || '',
      description: li.products?.name || '',
      qty:         Number(li.quantity_ordered) || 0,
      unitPrice:   Number(li.unit_price) || 0,
    })),
    createdBy: row.created_by || '',
  });

  // ── Seed customers from CRM (live mode only) ──────────────────────────────
  // Use api.crm.customers.list() directly — it returns CRM-enriched fields
  // (credit_hold, health_score, ar_balance, etc.) that apiCustomers may lack.
  useEffect(() => {
    if (DEMO_MODE) return;
    api.crm.customers.list({ limit: 500 })
      .then(r => {
        const rows = r.data || [];
        if (rows.length) setCustomers(rows.map(mapApiCustomer));
        else if (apiCustomers?.length) setCustomers(apiCustomers.map(mapApiCustomer));
      })
      .catch(() => {
        // Fallback to context customers if CRM endpoint fails
        if (apiCustomers?.length) setCustomers(apiCustomers.map(mapApiCustomer));
      });
  }, []);

  // ── Seed orders from apiOrders (live mode only) ───────────────────────────
  useEffect(() => {
    if (DEMO_MODE || !apiOrders?.length) return;
    setOrders(apiOrders.map(mapApiOrder));
  }, [apiOrders]);

  // ── Seed leads + activities from API (live mode only) ─────────────────────
  useEffect(() => {
    if (DEMO_MODE) return;
    api.crm.leads.list({ limit: 200 })
      .then(r => {
        if (r.data?.length) setLeads(r.data.map(l => ({
          id:               l.id,
          name:             l.name || '',
          contactName:      l.contact_name || '',
          phone:            l.phone || '',
          address:          l.address || '',
          estimatedMonthly: Number(l.estimated_monthly) || 0,
          stage:            l.stage || 'New',
          addedDate:        l.added_date || l.created_at?.slice(0, 10) || '',
          _apiId:           l.id,
        })));
      }).catch(() => {});
    api.crm.notes.listAll({ limit: 500 })
      .then(r => {
        if (r.data?.length) setActivities(r.data.map(n => ({
          id:         n.id,
          customerId: n.customer_id,
          date:       n.created_at?.slice(0, 10) || '',
          type:       n.type || 'note',
          note:       n.content || n.note || '',
        })));
      }).catch(() => {});
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Apply post-pick change-request approval decisions back to the order
  const appliedChangeRef = useRef(new Set());
  useEffect(() => {
    approvalRequests.forEach(req => {
      if (req.flowType !== 'order_change_request') return;
      if (req.status !== 'approved' && req.status !== 'rejected') return;
      if (appliedChangeRef.current.has(req.id)) return;
      const orderId = req.payload?.orderId;
      if (!orderId) return;
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        if (req.status === 'approved' && Array.isArray(req.payload.changes)) {
          // Apply each change to the order's items
          let newItems = [...o.items];
          req.payload.changes.forEach(c => {
            const idx = newItems.findIndex(i => i.sku === c.sku);
            if (c.action === 'add' && idx === -1) {
              const inv = itemFromSku(c.sku);
              newItems.push({ sku: c.sku, description: c.description, qty: c.toQty, unitPrice: inv ? (inv.basePrice ?? inv.base_price ?? 0) : 0 });
            } else if (c.action === 'remove' && idx >= 0) {
              newItems.splice(idx, 1);
            } else if (c.action === 'change' && idx >= 0) {
              newItems[idx] = { ...newItems[idx], qty: c.toQty };
            }
          });
          const newTotal = newItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
          return { ...o, items: newItems, total: newTotal, status: o.status === 'Change Pending' ? 'Picking' : o.status };
        }
        if (req.status === 'rejected') {
          return { ...o, status: o.status === 'Change Pending' ? 'Picking' : o.status };
        }
        return o;
      }));
      appliedChangeRef.current.add(req.id);
    });
  }, [approvalRequests]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedCustomerId) || null, [customers, selectedCustomerId]);
  const selectedOrder    = useMemo(() => orders.find(o => o.id === selectedOrderId) || null, [orders, selectedOrderId]);
  const selectedLead     = useMemo(() => leads.find(l => l.id === selectedLeadId) || null, [leads, selectedLeadId]);
  const cartCustomer     = useMemo(() => customers.find(c => c.id === cartCustomerId) || null, [customers, cartCustomerId]);

  const cartItems = useMemo(() => Object.entries(cart).map(([sku, data]) => {
    const inv = itemFromSku(sku);
    const description = inv?.name || sku;
    const unitPrice = Number(data.customPrice ?? data.unitPrice) || 0;
    return { sku, description, qty: data.qty, unitPrice, total: data.qty * unitPrice };
  }), [cart]);

  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + i.total, 0), [cartItems]);
  const cartCommission = cartTotal * 0.025;  // 2.5% mock commission rate

  const ordersForCustomer = useCallback((cid) => orders.filter(o => o.customerId === cid).sort((a, b) => b.date.localeCompare(a.date)), [orders]);
  const activitiesForCustomer = useCallback((cid) => activities.filter(a => a.customerId === cid).sort((a, b) => b.date.localeCompare(a.date)), [activities]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const openCustomer = (cid) => { setSelectedCustomerId(cid); setSection('accounts'); };

  const startNewOrderForCustomer = (cid) => {
    setCartCustomerId(cid);
    setCart({});
    setSection('orderEntry');
  };

  const addCartItem = (sku, qty = 1) => {
    setCart(prev => {
      const existing = prev[sku];
      if (existing) return { ...prev, [sku]: { ...existing, qty: existing.qty + qty } };
      const inv = itemFromSku(sku);
      const cust = cartCustomer;
      const contractPrice = cust?.contractPricing && cust.contractPricing[inv?.id];
      const unitPrice = contractPrice ?? inv?.basePrice ?? inv?.base_price ?? 0;
      return { ...prev, [sku]: { qty, unitPrice } };
    });
  };
  const removeCartItem = (sku) => setCart(prev => {
    const c = { ...prev };
    if (!c[sku]) return c;
    if (c[sku].qty <= 1) delete c[sku];
    else c[sku] = { ...c[sku], qty: c[sku].qty - 1 };
    return c;
  });
  const clearCartItem = (sku) => setCart(prev => { const c = { ...prev }; delete c[sku]; return c; });

  const submitOrder = () => {
    if (!cartCustomerId || cartItems.length === 0) return;
    const newOrderId = `ORD-${9900 + orders.length}`;
    const newOrder = {
      id: newOrderId,
      customerId: cartCustomerId,
      date: TODAY,
      deliveryDate: TODAY,
      status: 'Submitted',
      total: cartTotal,
      items: cartItems.map(i => ({ sku: i.sku, description: i.description, qty: i.qty, unitPrice: i.unitPrice })),
      createdBy: activeRep.name,
    };
    // Optimistic update
    setOrders(prev => [newOrder, ...prev]);
    setCart({});
    showToast(`Order ${newOrderId} submitted — ${fmt$(cartTotal)}`);
    setSelectedOrderId(newOrderId);
    setSelectedCustomerId(cartCustomerId);
    setCartCustomerId(null);
    setSection('accounts');

    if (!DEMO_MODE) {
      // Build items with product_id looked up by SKU from apiProducts
      const productsBySku = Object.fromEntries((apiProducts || []).map(p => [p.sku, p.id]));
      const apiItems = cartItems
        .map(i => ({
          product_id:       productsBySku[i.sku] || null,
          quantity_ordered: i.qty,
          unit_price:       i.unitPrice,
        }))
        .filter(i => i.product_id);  // only submit items we can resolve

      api.orders.create({
        customer_id: cartCustomerId,
        order_date:  TODAY,
        items:       apiItems,
      }).then(created => {
        // Swap the optimistic temp id with the real backend id
        setOrders(prev => prev.map(o =>
          o.id === newOrderId ? { ...o, id: created.id } : o
        ));
        setSelectedOrderId(created.id);
        refreshOrders();
      }).catch(err => {
        showApiToast(`Order saved locally — sync failed: ${err.message}`);
      });
    }
  };

  const directEditOrder = (orderId, newItems) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const total = newItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
      return { ...o, items: newItems, total };
    }));
    showToast('Order updated');
  };

  const requestPostPickChange = ({ orderId, changes, reason }) => {
    const o = orders.find(x => x.id === orderId);
    if (!o) return;
    const cust = customers.find(c => c.id === o.customerId);
    submitApprovalRequest({
      flowType: 'order_change_request',
      title: `Order change — ${orderId} — ${cust?.name || ''}`,
      summary: `${changes.length} change${changes.length === 1 ? '' : 's'} requested on an order already in ${o.status}.`,
      threshold: 0,
      payload: {
        orderId,
        customerId: o.customerId,
        customerName: cust?.name || '',
        currentStatus: o.status,
        deliveryDate: o.deliveryDate,
        changes,
        reason,
      },
    });
    // Mark the order as having a pending change so the UI reflects it
    setOrders(prev => prev.map(x => x.id === orderId ? { ...x, status: 'Change Pending' } : x));
    showToast('Change request submitted to warehouse manager', 'info');
  };

  const recordPayment = ({ customerId, method, amount, reference, allocations }) => {
    const newPayment = {
      id: `PMT-${Date.now()}`,
      customerId, method, amount: Number(amount), reference, allocations,
      collectedAt: new Date().toISOString(),
      collectedBy: activeRep.name,
    };
    setPayments(prev => [newPayment, ...prev]);
    // Update customer AR balance + aging
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      let remaining = Number(amount);
      const aging = { ...c.arAging };
      ['days90','days60','days30','current'].forEach(bucket => {
        if (remaining <= 0) return;
        const apply = Math.min(remaining, aging[bucket]);
        aging[bucket] -= apply;
        remaining -= apply;
      });
      return { ...c, arBalance: Math.max(0, c.arBalance - Number(amount)), availableCredit: c.availableCredit + Number(amount), arAging: aging };
    }));
    showToast(`Payment of ${fmt$(amount)} collected from ${customers.find(c=>c.id===customerId)?.name}`);
    setShowPayment(false);
  };

  const addLead = (lead) => {
    const id = `LEAD-${String(leads.length + 1).padStart(3, '0')}`;
    setLeads(prev => [{ id, addedDate: TODAY, stage: 'New', ...lead }, ...prev]);
    showToast(`Lead "${lead.name}" added to pipeline`);
    setShowAddLead(false);
  };
  const updateLeadStage = (leadId, stage) => setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage } : l));

  const logActivity = (customerId, type, note) => {
    setActivities(prev => [{ id: `A-${Date.now()}`, customerId, date: TODAY, type, note }, ...prev]);
    setCustomers(prev => prev.map(c => c.id === customerId && type === 'visit' ? { ...c, lastVisitDate: TODAY } : c));
    showToast(`${type[0].toUpperCase() + type.slice(1)} logged`);

    if (!DEMO_MODE) {
      api.crm.notes.create(customerId, { content: note, type })
        .catch(err => showApiToast(`Activity saved locally — sync failed: ${err.message}`));
    }
  };

  // KPIs for "My Performance"
  const mtdRevenue = useMemo(() => orders
    .filter(o => o.status === 'Delivered' || o.status === 'Out for Delivery')
    .reduce((s, o) => s + o.total, 0), [orders]);
  const mtdCommission = mtdRevenue * 0.025;
  const mtdOrders = orders.filter(o => o.status !== 'Cancelled').length;
  const quotaTarget = 60000;
  const quotaProgress = Math.min(100, (mtdRevenue / quotaTarget) * 100);
  const visitsThisWeek = activities.filter(a => a.type === 'visit' && daysSince(a.date) <= 7).length;

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top header bar */}
      <div className={`${UI.glassHeader} px-6 py-3 flex items-center justify-between gap-4 shrink-0`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-sm shrink-0">{activeRep.initials}</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-100 truncate">{activeRep.name}</p>
            <p className="text-xs text-gray-500 truncate">Field Sales · {activeRep.territory}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* GPS status badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            gpsStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            gpsStatus === 'error'  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                     'bg-gray-700/50 text-gray-500 border-gray-700'
          }`}>
            <Navigation className="w-3 h-3" />
            {gpsStatus === 'active' ? 'GPS Live' : gpsStatus === 'error' ? 'GPS Off' : 'GPS…'}
          </span>
          {outbox.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold">
              <UploadCloud className="w-3 h-3" /> {outbox.length} queued
            </span>
          )}
          <button
            onClick={() => setIsOffline(v => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
              isOffline ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isOffline ? <><WifiOff className="w-3 h-3" /> Offline</> : <><Wifi className="w-3 h-3" /> Online</>}
          </button>
        </div>
      </div>

      {/* Section nav */}
      <div className="px-4 py-2 border-b border-gray-800 bg-gray-900/40 flex items-center gap-1 overflow-x-auto shrink-0">
        {[
          { id: 'today',       label: 'Today',         icon: Home },
          { id: 'map',         label: 'Map',           icon: MapIcon },
          { id: 'accounts',    label: 'Accounts',      icon: Building2 },
          { id: 'orderEntry',  label: 'New Order',     icon: ShoppingCart },
          { id: 'leads',       label: 'Leads',         icon: MapPin },
          { id: 'performance', label: 'My Performance', icon: TrendingUp },
        ].map(s => {
          const Icon = s.icon;
          const isActive = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setSection(s.id); setSelectedOrderId(null); setSelectedLeadId(null); }}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" /> {s.label}
            </button>
          );
        })}
      </div>

      {/* Section content */}
      <div className={section === 'map' ? 'flex-1 overflow-hidden flex flex-col min-h-0' : 'flex-1 overflow-auto'}>
        {section === 'today'       && <TodaySection customers={customers} todayPlan={TODAY_PLAN} mtdRevenue={mtdRevenue} mtdCommission={mtdCommission} mtdOrders={mtdOrders} quotaTarget={quotaTarget} quotaProgress={quotaProgress} visitsThisWeek={visitsThisWeek} orders={orders} openCustomer={openCustomer} onStartOrder={startNewOrderForCustomer} activeRep={activeRep} />}
        {section === 'map'         && <MapSection customers={customers} leads={leads} rep={activeRep} gpsPosition={gpsPosition} gpsStatus={gpsStatus} liveRepPositions={liveRepPositions} realtimeStatus={realtimeStatus} openCustomer={openCustomer} onAddLead={() => setShowAddLead(true)} onSelectLead={(id) => { setSelectedLeadId(id); setSection('leads'); }} />}
        {section === 'accounts'    && (
          selectedCustomer
            ? <AccountDetailSection customer={selectedCustomer} orders={ordersForCustomer(selectedCustomer.id)} activities={activitiesForCustomer(selectedCustomer.id)} onBack={() => setSelectedCustomerId(null)} onStartOrder={() => startNewOrderForCustomer(selectedCustomer.id)} onCollectPayment={() => setShowPayment(true)} onOpenOrder={(oid) => { setSelectedOrderId(oid); }} selectedOrder={selectedOrder} onCloseOrder={() => setSelectedOrderId(null)} onLogActivity={(type, note) => logActivity(selectedCustomer.id, type, note)} onDirectEditOrder={directEditOrder} onRequestChange={() => setShowChangeRequest(true)} setCustomers={setCustomers} showToast={showToast} />
            : <AccountsListSection customers={customers} onSelect={(cid) => setSelectedCustomerId(cid)} />
        )}
        {section === 'orderEntry'  && <OrderEntrySection customers={customers} cartCustomer={cartCustomer} cart={cart} cartItems={cartItems} cartTotal={cartTotal} cartCommission={cartCommission} onPickCustomer={setCartCustomerId} onAddItem={addCartItem} onRemoveItem={removeCartItem} onClearItem={clearCartItem} onSubmit={submitOrder} onClearCart={() => setCart({})} apiProducts={apiProducts} apiInventory={apiInventory} />}
        {section === 'leads'       && (
          selectedLead
            ? <LeadDetailSection lead={selectedLead} onBack={() => setSelectedLeadId(null)} onUpdateStage={(stage) => updateLeadStage(selectedLead.id, stage)} onConvert={() => { showToast(`Converting ${selectedLead.name} to active customer…`, 'info'); }} />
            : <LeadsSection leads={leads} onSelect={setSelectedLeadId} onAddLead={() => setShowAddLead(true)} />
        )}
        {section === 'performance' && <PerformanceSection mtdRevenue={mtdRevenue} mtdCommission={mtdCommission} mtdOrders={mtdOrders} quotaTarget={quotaTarget} quotaProgress={quotaProgress} visitsThisWeek={visitsThisWeek} customers={customers} orders={orders} repName={activeRep.name} />}
      </div>

      {/* API error toast */}
      {apiToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-rose-900/90 border border-rose-500/40 text-rose-200 text-sm px-4 py-2 rounded-lg shadow-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />{apiToast}
        </div>
      )}

      {/* Modals */}
      {showPayment && selectedCustomer && (
        <PaymentModal customer={selectedCustomer} onClose={() => setShowPayment(false)} onSubmit={recordPayment} />
      )}
      {showAddLead && (
        <AddLeadModal rep={REP} onClose={() => setShowAddLead(false)} onSubmit={addLead} />
      )}
      {showChangeRequest && selectedOrder && (
        <ChangeRequestModal order={selectedOrder} customer={customers.find(c => c.id === selectedOrder.customerId)} onClose={() => setShowChangeRequest(false)} onSubmit={(payload) => { requestPostPickChange(payload); setShowChangeRequest(false); }} apiProducts={apiProducts} apiInventory={apiInventory} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[60] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl font-bold text-xs border backdrop-blur-md ${
          toast.type === 'warning' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
          toast.type === 'info'    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
                                      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        }`}>
          <CheckCircle2 className="w-4 h-4" /> {toast.message}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: TODAY (dashboard / home)
// ─────────────────────────────────────────────────────────────────────────────
function TodaySection({ customers, todayPlan, mtdRevenue, mtdCommission, mtdOrders, quotaTarget, quotaProgress, visitsThisWeek, orders, openCustomer, onStartOrder, activeRep }) {
  // Action queue: gather alerts across accounts
  const alerts = useMemo(() => {
    const list = [];
    customers.forEach(c => {
      (c.alerts || []).forEach(a => list.push({ customer: c, ...a }));
    });
    return list;
  }, [customers]);

  // Recent orders
  const recentOrders = useMemo(() => orders.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5), [orders]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Good morning, {activeRep.name.split(' ')[0]}.</h2>
        <p className="text-sm text-gray-500 mt-0.5">Here's your day in {activeRep.territory}.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile label="MTD Sales" value={fmt$(mtdRevenue)} sub={`Quota ${fmtCompact(quotaTarget)}`} color="cyan" />
        <KPITile label="Quota Progress" value={`${quotaProgress.toFixed(0)}%`} sub={quotaProgress >= 100 ? 'Target hit' : `${fmt$(quotaTarget - mtdRevenue)} to go`} color="emerald" />
        <KPITile label="Commission MTD" value={fmt$(mtdCommission)} sub="2.5% of sales" color="violet" />
        <KPITile label="Visits This Week" value={String(visitsThisWeek)} sub="across territory" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Plan */}
        <div className={`${UI.card} lg:col-span-2 overflow-hidden`}>
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-200 flex items-center gap-2"><Route className="w-4 h-4 text-cyan-500" /> Today's Route — {todayPlan.length} stops</h3>
            <span className="text-xs text-gray-500">~6h of activity</span>
          </div>
          <div className="divide-y divide-gray-800/60">
            {todayPlan.map((stop, i) => {
              const c = customers.find(x => x.id === stop.customerId);
              if (!c) return null;
              return (
                <button key={i} onClick={() => openCustomer(c.id)} className="w-full text-left px-5 py-3 hover:bg-gray-800/40 transition-colors flex items-start gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-bold border border-cyan-500/30">{i + 1}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-500">{stop.window}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${c.creditHold ? 'bg-rose-500/10 text-rose-400' : 'bg-gray-800 text-gray-400'}`}>{c.status}</span>
                    </div>
                    <p className="font-bold text-gray-100">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stop.purpose} · {stop.estimatedDuration}min</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mt-2" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Action queue */}
        <div className={`${UI.card} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="font-bold text-gray-200 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-400" /> Action Queue</h3>
          </div>
          <div className="divide-y divide-gray-800/60 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-5 text-sm text-gray-500 italic text-center">No alerts. You're caught up.</div>
            ) : alerts.map((a, i) => {
              const iconColor = a.type === 'credit' ? 'text-rose-400' : a.type === 'churn' ? 'text-amber-400' : a.type === 'competitor' ? 'text-violet-400' : 'text-cyan-400';
              const Icon = a.type === 'credit' ? ShieldAlert : a.type === 'churn' ? AlertTriangle : a.type === 'competitor' ? Target : Clock;
              return (
                <button key={i} onClick={() => openCustomer(a.customer.id)} className="w-full text-left p-4 hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-100">{a.customer.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.text}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className={`${UI.card} overflow-hidden`}>
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-200 flex items-center gap-2"><Package className="w-4 h-4 text-cyan-500" /> Recent Orders</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800"><tr>
            <th className={UI.th}>Order</th>
            <th className={UI.th}>Customer</th>
            <th className={UI.th}>Date</th>
            <th className={UI.th}>Status</th>
            <th className={`${UI.th} text-right`}>Total</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-800/50">
            {recentOrders.map(o => {
              const c = customers.find(x => x.id === o.customerId);
              return (
                <tr key={o.id} onClick={() => c && openCustomer(c.id)} className="hover:bg-gray-800/30 transition-colors cursor-pointer">
                  <td className={UI.td}><span className="font-mono text-xs text-cyan-400">{o.id}</span></td>
                  <td className={UI.td}>{c?.name || o.customerId}</td>
                  <td className={UI.td}>{fmtDate(o.date)}</td>
                  <td className={UI.td}><OrderStatusBadge status={o.status} /></td>
                  <td className={`${UI.td} text-right font-bold`}>{fmt$(o.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPITile({ label, value, sub, color = 'cyan' }) {
  const map = {
    cyan:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    violet:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
    rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return (
    <div className={`${UI.card} p-4`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-2xl font-black text-gray-100 mt-1">{value}</p>
      {sub && <p className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block border ${map[color]}`}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: MAP  — Leaflet live GPS map
// ─────────────────────────────────────────────────────────────────────────────

// Default center: New Orleans metro
const NEW_ORLEANS = [29.9511, -90.0715];

function SalesRepLiveMap({ gpsPosition, liveRepPositions, repId, repName, customers, leads, openCustomer, onSelectLead }) {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const youMarkerRef    = useRef(null);
  const repMarkersRef   = useRef({});   // truck_id → L.marker
  const customerMarkersRef = useRef({}); // cust.id → L.marker

  // ── Init Leaflet once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;
    if (!window.L) return;

    const L = window.L;
    const center = gpsPosition ? [gpsPosition.lat, gpsPosition.lng] : NEW_ORLEANS;
    const map = L.map(mapContainerRef.current, { center, zoom: 13, zoomControl: true });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // ── "YOU" pulsing marker ─────────────────────────────────────────────────
    const youIcon = L.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#06b6d4;border:3px solid #0e7490;box-shadow:0 0 0 4px rgba(6,182,212,0.35);position:relative;">
               <div style="position:absolute;inset:0;border-radius:50%;background:#06b6d4;animation:ping 1.5s ease-in-out infinite;opacity:0.5;"></div>
             </div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    if (!document.getElementById('fsp-leaflet-ping')) {
      const style = document.createElement('style');
      style.id = 'fsp-leaflet-ping';
      style.textContent = `@keyframes ping{0%{transform:scale(1);opacity:.6}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}`;
      document.head.appendChild(style);
    }

    const youMarker = L.marker(center, { icon: youIcon, zIndexOffset: 1000 })
      .bindPopup(`<b style="color:#06b6d4">YOU</b><br><span style="color:#9ca3af;font-size:11px">${repName}</span>`)
      .addTo(map);
    youMarkerRef.current = youMarker;

    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // run once

  // ── Update "YOU" marker when gpsPosition changes ──────────────────────────
  useEffect(() => {
    if (!mapRef.current || !youMarkerRef.current || !gpsPosition) return;
    const ll = [gpsPosition.lat, gpsPosition.lng];
    youMarkerRef.current.setLatLng(ll);
    mapRef.current.panTo(ll, { animate: true, duration: 1 });
  }, [gpsPosition]);

  // ── Other reps markers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    const myTruckId = `REP-${repId}`;

    Object.values(liveRepPositions).forEach(loc => {
      if (loc.truck_id === myTruckId) return;   // skip self
      const ll = [parseFloat(loc.lat), parseFloat(loc.lng)];
      const initials = (loc.driver_name || 'R').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:#0891b2;border:2px solid #06b6d4;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.5)">${initials}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      });
      if (repMarkersRef.current[loc.truck_id]) {
        repMarkersRef.current[loc.truck_id].setLatLng(ll);
      } else {
        repMarkersRef.current[loc.truck_id] = L.marker(ll, { icon })
          .bindPopup(`<b style="color:#06b6d4">${loc.driver_name || 'Rep'}</b>`)
          .addTo(mapRef.current);
      }
    });
  }, [liveRepPositions, repId]);

  // ── Customer markers (only if they have real geocoded lat/lng) ─────────────
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    customers.forEach(c => {
      if (!c.lat || !c.lng) return;   // skip if not geocoded
      if (customerMarkersRef.current[c.id]) return;
      const color = c.creditHold ? '#f43f5e' : c.status === 'At Risk' ? '#f59e0b' : '#10b981';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid #111827;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.5)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>`,
        iconSize: [28, 28], iconAnchor: [14, 14],
      });
      customerMarkersRef.current[c.id] = L.marker([c.lat, c.lng], { icon })
        .bindPopup(`<b style="color:#e5e7eb">${c.name}</b><br><span style="color:#9ca3af;font-size:11px">${fmtCompact(c.ytdSpend)} YTD</span>`)
        .on('click', () => openCustomer(c.id))
        .addTo(mapRef.current);
    });
  }, [customers, openCustomer]);

  return (
    <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
  );
}

function MapSection({ customers, leads, rep, gpsPosition, gpsStatus, liveRepPositions, realtimeStatus, openCustomer, onAddLead, onSelectLead }) {
  const [filter, setFilter] = useState('all');
  const [leafletReady, setLeafletReady] = useState(!!window.L);

  // Lazy-load Leaflet CSS + JS if not already present
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  const otherReps = Object.values(liveRepPositions).filter(loc => loc.truck_id !== `REP-${rep.id}`);

  return (
    <div className="h-full flex flex-col">
      {/* Header toolbar */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2"><MapIcon className="w-4 h-4 text-cyan-500" /> Live Territory Map</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {customers.length} accounts · {leads.length} leads
            {otherReps.length > 0 && ` · ${otherReps.length} rep${otherReps.length > 1 ? 's' : ''} in field`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Realtime badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            realtimeStatus === 'live'  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            realtimeStatus === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                         'bg-gray-700/50 text-gray-500 border-gray-700'
          }`}>
            <Activity className="w-3 h-3" />
            {realtimeStatus === 'live' ? 'Realtime' : realtimeStatus === 'error' ? 'RT Error' : 'Connecting…'}
          </span>
          {[
            { id: 'all',           label: 'All' },
            { id: 'accounts',      label: 'Accounts' },
            { id: 'leads',         label: 'Leads' },
            { id: 'at-risk',       label: 'At Risk' },
            { id: 'overdue-visit', label: 'Overdue' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-200 border border-transparent hover:bg-gray-800/60'}`}>
              {f.label}
            </button>
          ))}
          <button onClick={onAddLead} className={UI.btnPrimary}><Plus className="w-4 h-4" /> Add Lead</button>
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative min-h-0" style={{ minHeight: '480px' }}>
        {/* GPS status overlay if no position yet */}
        {gpsStatus !== 'active' && !gpsPosition && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-950/80 backdrop-blur-sm pointer-events-none">
            <Navigation className={`w-8 h-8 mb-2 ${gpsStatus === 'error' ? 'text-rose-400' : 'text-cyan-400 animate-pulse'}`} />
            <p className="text-sm font-bold text-gray-300">{gpsStatus === 'error' ? 'GPS unavailable — allow location access' : 'Acquiring GPS…'}</p>
            <p className="text-xs text-gray-500 mt-1">Map will center on your position once GPS locks</p>
          </div>
        )}

        {leafletReady ? (
          <SalesRepLiveMap
            gpsPosition={gpsPosition}
            liveRepPositions={liveRepPositions}
            repId={rep.id}
            repName={rep.name}
            customers={customers}
            leads={leads}
            openCustomer={openCustomer}
            onSelectLead={onSelectLead}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-sm animate-pulse">Loading map…</div>
          </div>
        )}

        {/* Other reps panel */}
        {otherReps.length > 0 && (
          <div className="absolute top-4 right-4 z-[9999] bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl p-3 shadow-2xl min-w-[180px]">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3 text-cyan-500" /> Reps in Field</p>
            {otherReps.map(loc => {
              const initials = (loc.driver_name || 'R').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
              const mins = Math.floor((Date.now() - new Date(loc.updated_at).getTime()) / 60000);
              return (
                <div key={loc.truck_id} className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">{initials}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-200 truncate">{loc.driver_name || loc.truck_id}</p>
                    <p className="text-[10px] text-gray-500">{mins < 2 ? 'Just now' : `${mins}m ago`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[9999] bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg p-3 text-xs space-y-1.5 shadow-2xl">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500" /><span className="text-gray-300">You (live GPS)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-700" /><span className="text-gray-300">Other rep</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-gray-300">Active account</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-gray-300">At risk</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-gray-300">Credit hold</span></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ACCOUNTS LIST
// ─────────────────────────────────────────────────────────────────────────────
function AccountsListSection({ customers, onSelect }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastOrder');  // lastOrder | name | ytdSpend | health
  const sorted = useMemo(() => {
    const list = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'name')      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'ytdSpend')  return [...list].sort((a, b) => b.ytdSpend - a.ytdSpend);
    if (sortBy === 'health')    return [...list].sort((a, b) => b.healthScore - a.healthScore);
    return [...list].sort((a, b) => (b.lastOrderDate || '').localeCompare(a.lastOrderDate || ''));
  }, [customers, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2"><Building2 className="w-5 h-5 text-cyan-500" /> Accounts <span className="text-sm text-gray-500 font-normal">({customers.length})</span></h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…" className={`${UI.input} pl-9 w-64`} />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`${UI.select} w-auto`}>
            <option value="lastOrder">Sort: Last Order</option>
            <option value="name">Sort: Name</option>
            <option value="ytdSpend">Sort: YTD Spend</option>
            <option value="health">Sort: Health Score</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map(c => {
          const arPct = c.creditLimit > 0 ? (c.arBalance / c.creditLimit) * 100 : 0;
          const visitGap = daysSince(c.lastVisitDate);
          return (
            <button key={c.id} onClick={() => onSelect(c.id)} className={`${UI.cardPad} text-left hover:border-cyan-500/40 transition-colors`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-100 truncate">{c.name}</p>
                    {c.creditHold && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">HOLD</span>}
                  </div>
                  <p className="text-xs text-gray-500">{c.type} · {c.address}</p>
                </div>
                <div className={`text-right shrink-0`}>
                  <p className={`text-2xl font-black ${HEALTH_COLOR(c.healthScore)}`}>{c.healthScore}</p>
                  <p className="text-[9px] text-gray-500 uppercase">health</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase">YTD</p>
                  <p className="font-bold text-gray-200">{fmtCompact(c.ytdSpend)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase">Last Order</p>
                  <p className="font-bold text-gray-200">{fmtDate(c.lastOrderDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase">A/R</p>
                  <p className={`font-bold ${arPct > 80 ? 'text-rose-400' : arPct > 50 ? 'text-amber-400' : 'text-gray-200'}`}>{fmtCompact(c.arBalance)}</p>
                </div>
              </div>
              {visitGap > 14 && (
                <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Last visit {visitGap}d ago</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ACCOUNT DETAIL (drilldown)
// ─────────────────────────────────────────────────────────────────────────────
function AccountDetailSection({ customer, orders, activities, onBack, onStartOrder, onCollectPayment, onOpenOrder, selectedOrder, onCloseOrder, onLogActivity, onDirectEditOrder, onRequestChange, setCustomers, showToast }) {
  const [tab, setTab] = useState('overview');   // overview | orders | guide | activity | contacts
  const [activityNote, setActivityNote] = useState('');
  const [activityType, setActivityType] = useState('visit');

  const editableStatuses = ['Submitted'];

  // Order detail subview takes over
  if (selectedOrder) {
    return <OrderDetailView order={selectedOrder} customer={customer} onBack={onCloseOrder} onDirectEdit={onDirectEditOrder} onRequestChange={onRequestChange} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className={`${UI.btnGhost} px-2 py-2`} title="Back to accounts"><ChevronLeft className="w-4 h-4" /></button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-100 truncate">{customer.name}</h2>
              {customer.creditHold && <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">CREDIT HOLD</span>}
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${customer.status === 'Active' ? UI.badgeEmerald : UI.badgeAmber}`}>{customer.status}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{customer.id} · {customer.address}, {customer.city} · {customer.route}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`tel:${customer.contact.phone}`} className={UI.btnSecondary}><Phone className="w-4 h-4" /> Call</a>
          <button onClick={() => onLogActivity('visit', `Check-in at ${customer.name}`)} className={UI.btnSecondary}><Navigation className="w-4 h-4" /> Check In</button>
          <button onClick={onCollectPayment} className={UI.btnSecondary}><DollarSign className="w-4 h-4" /> Collect Payment</button>
          <button onClick={onStartOrder} className={UI.btnPrimary}><ShoppingCart className="w-4 h-4" /> New Order</button>
        </div>
      </div>

      {/* Alerts banner */}
      {customer.alerts && customer.alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          {customer.alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`${UI.card} p-4`}>
          <div className="flex items-center justify-between"><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Health</p><Heart className={`w-3.5 h-3.5 ${HEALTH_COLOR(customer.healthScore)}`} /></div>
          <p className={`text-2xl font-black mt-1 ${HEALTH_COLOR(customer.healthScore)}`}>{customer.healthScore}</p>
        </div>
        <div className={`${UI.card} p-4`}>
          <div className="flex items-center justify-between"><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">YTD Spend</p><TrendingUp className="w-3.5 h-3.5 text-cyan-400" /></div>
          <p className="text-2xl font-black text-gray-100 mt-1">{fmtCompact(customer.ytdSpend)}</p>
        </div>
        <div className={`${UI.card} p-4`}>
          <div className="flex items-center justify-between"><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">A/R Balance</p><CreditCard className="w-3.5 h-3.5 text-amber-400" /></div>
          <p className="text-2xl font-black text-gray-100 mt-1">{fmt$(customer.arBalance)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">of {fmt$(customer.creditLimit)} limit</p>
        </div>
        <div className={`${UI.card} p-4`}>
          <div className="flex items-center justify-between"><p className="text-[10px] uppercase text-gray-500 tracking-wider font-bold">Avg Order</p><Package className="w-3.5 h-3.5 text-violet-400" /></div>
          <p className="text-2xl font-black text-gray-100 mt-1">{fmtCompact(customer.avgOrderValue)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{customer.ordersThisMonth} orders MTD</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div id="kernal-module-tabs" className="flex gap-1 border-b border-gray-800">
        {[
          { id: 'overview', label: 'Overview',    icon: Eye },
          { id: 'orders',   label: 'Orders',      icon: Package, count: orders.length },
          { id: 'guide',    label: 'Order Guide', icon: BookOpen, count: customer.orderGuide.length },
          { id: 'activity', label: 'Activity',    icon: Activity, count: activities.length },
          { id: 'contacts', label: 'Contact',     icon: Phone },
        ].map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive ? 'border-cyan-500 text-cyan-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-200'
            }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
              {typeof t.count === 'number' && t.count > 0 && (
                <span className={`px-1.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-cyan-500/15 text-cyan-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={UI.cardPad}>
            <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-cyan-500" /> A/R Aging</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Current', value: customer.arAging.current, color: 'text-gray-200' },
                { label: '30 days', value: customer.arAging.days30,  color: customer.arAging.days30 > 0 ? 'text-amber-400' : 'text-gray-200' },
                { label: '60 days', value: customer.arAging.days60,  color: customer.arAging.days60 > 0 ? 'text-orange-400' : 'text-gray-200' },
                { label: '90+',     value: customer.arAging.days90,  color: customer.arAging.days90 > 0 ? 'text-rose-400' : 'text-gray-200' },
              ].map(b => (
                <div key={b.label} className="bg-gray-800/30 border border-gray-800 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">{b.label}</p>
                  <p className={`font-bold text-sm mt-1 ${b.color}`}>{fmtCompact(b.value)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Total outstanding: <strong className={customer.creditHold ? 'text-rose-400' : 'text-gray-200'}>{fmt$(customer.arBalance)}</strong></p>
          </div>
          <div className={UI.cardPad}>
            <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-500" /> Delivery & Route</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Route</span><span className="font-mono text-gray-200">{customer.route}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery days</span><span className="text-gray-200">{customer.deliveryDays}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Last delivery</span><span className="text-gray-200">{fmtDate(customer.lastOrderDate)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Last visit</span><span className="text-gray-200">{fmtDate(customer.lastVisitDate)} ({daysSince(customer.lastVisitDate)}d ago)</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className={`${UI.card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800"><tr>
              <th className={UI.th}>Order #</th>
              <th className={UI.th}>Date</th>
              <th className={UI.th}>Delivery</th>
              <th className={UI.th}>Items</th>
              <th className={UI.th}>Status</th>
              <th className={`${UI.th} text-right`}>Total</th>
              <th className={UI.th}></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic">No orders for this account yet.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className={UI.td}><span className="font-mono text-xs text-cyan-400">{o.id}</span></td>
                  <td className={UI.td}>{fmtDate(o.date)}</td>
                  <td className={UI.td}>{fmtDate(o.deliveryDate)}</td>
                  <td className={UI.td}>{o.items.length}</td>
                  <td className={UI.td}><OrderStatusBadge status={o.status} /></td>
                  <td className={`${UI.td} text-right font-bold`}>{fmt$(o.total)}</td>
                  <td className={UI.td}><button onClick={() => onOpenOrder(o.id)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold">Open →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'guide' && (
        <div className={UI.cardPad}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-500" /> Customer Order Guide</h3>
            <span className="text-xs text-gray-500">{customer.orderGuide.length} items</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800">
              <th className={UI.th}>SKU</th>
              <th className={UI.th}>Product</th>
              <th className={`${UI.th} text-right`}>Avg Qty</th>
              <th className={`${UI.th} text-right`}>Last Qty</th>
              <th className={UI.th}>Cadence</th>
              <th className={UI.th}>Last Ordered</th>
              <th className={UI.th}></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {customer.orderGuide.map((g, i) => {
                const inv = itemFromSku(g.sku);
                const overdue = daysSince(g.lastOrderedDate) > g.cadenceDays;
                return (
                  <tr key={i} className="hover:bg-gray-800/30">
                    <td className={UI.td}><span className="font-mono text-xs text-gray-400">{g.sku}</span></td>
                    <td className={UI.td}><span className="text-gray-200">{inv?.name || g.sku}</span></td>
                    <td className={`${UI.td} text-right text-gray-200`}>{g.avgQty}</td>
                    <td className={`${UI.td} text-right text-gray-300`}>{g.lastQty}</td>
                    <td className={UI.td}><span className="text-gray-400 text-xs">every {g.cadenceDays}d</span></td>
                    <td className={UI.td}>
                      <span className={overdue ? 'text-amber-400' : 'text-gray-400'}>
                        {fmtDate(g.lastOrderedDate)} ({daysSince(g.lastOrderedDate)}d){overdue && ' · overdue'}
                      </span>
                    </td>
                    <td className={UI.td}>
                      <button onClick={() => { setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, orderGuide: c.orderGuide.filter((_, idx) => idx !== i) } : c)); showToast(`Removed ${inv?.name || g.sku} from guide`, 'info'); }} className="text-gray-500 hover:text-rose-400 p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-3">
          {/* Quick add */}
          <div className={`${UI.cardPad}`}>
            <h4 className="font-bold text-gray-200 text-sm mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-500" /> Log Activity</h4>
            <div className="flex gap-2">
              <select value={activityType} onChange={e => setActivityType(e.target.value)} className={`${UI.select} w-32`}>
                <option value="visit">Visit</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="note">Note</option>
              </select>
              <input value={activityNote} onChange={e => setActivityNote(e.target.value)} placeholder="What happened?" className={`${UI.input} flex-1`} />
              <button onClick={() => { if (activityNote.trim()) { onLogActivity(activityType, activityNote.trim()); setActivityNote(''); } }} className={UI.btnPrimary} disabled={!activityNote.trim()}>
                <Send className="w-3.5 h-3.5" /> Log
              </button>
            </div>
          </div>
          {/* Timeline */}
          <div className={`${UI.card} overflow-hidden`}>
            <div className="divide-y divide-gray-800/60">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-gray-500 italic">No activity logged yet.</div>
              ) : activities.map(a => {
                const Icon = a.type === 'visit' ? Navigation : a.type === 'call' ? Phone : a.type === 'email' ? Mail : MessageSquare;
                const color = a.type === 'visit' ? 'text-emerald-400' : a.type === 'call' ? 'text-cyan-400' : a.type === 'email' ? 'text-violet-400' : 'text-gray-400';
                return (
                  <div key={a.id} className="p-4 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gray-800 ${color} flex items-center justify-center shrink-0`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className={`uppercase font-bold ${color}`}>{a.type}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500">{fmtDate(a.date)} ({daysSince(a.date)}d ago)</span>
                      </div>
                      <p className="text-sm text-gray-200">{a.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className={UI.cardPad}>
          <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-cyan-500" /> Primary Contact</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold">
              {customer.contact.name.split(' ').map(p => p[0]).join('').slice(0,2)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-100">{customer.contact.name}</p>
              <p className="text-xs text-gray-500">{customer.contact.title}</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <a href={`tel:${customer.contact.phone}`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-cyan-500/30 hover:bg-gray-800/40">
                  <Phone className="w-4 h-4 text-cyan-500" /><span className="text-gray-200">{customer.contact.phone}</span>
                </a>
                <a href={`mailto:${customer.contact.email}`} className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-cyan-500/30 hover:bg-gray-800/40">
                  <Mail className="w-4 h-4 text-cyan-500" /><span className="text-gray-200 truncate">{customer.contact.email}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL VIEW (drilldown inside Account Detail)
// ─────────────────────────────────────────────────────────────────────────────
function OrderDetailView({ order, customer, onBack, onDirectEdit, onRequestChange }) {
  const canDirectEdit = order.status === 'Submitted';
  const [items, setItems] = useState(order.items);
  const [dirty, setDirty] = useState(false);

  // Keep local items in sync if the order changes externally (approval applied)
  useEffect(() => { setItems(order.items); setDirty(false); }, [order]);

  const updateQty = (idx, qty) => { setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(0, Number(qty) || 0) } : it)); setDirty(true); };
  const removeItem = (idx) => { setItems(prev => prev.filter((_, i) => i !== idx)); setDirty(true); };
  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  const saveEdits = () => { onDirectEdit(order.id, items.filter(i => i.qty > 0)); setDirty(false); };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className={`${UI.btnGhost} px-2 py-2`}><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-100"><span className="font-mono text-cyan-400">{order.id}</span> · {customer?.name}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Placed {fmtDate(order.date)} · Delivery {fmtDate(order.deliveryDate)}</p>
        </div>
      </div>

      {/* Edit hint */}
      <div className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
        canDirectEdit ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
        order.status === 'Change Pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
        'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
      }`}>
        {canDirectEdit ? (
          <><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>Order hasn't started picking — you can edit items and quantities directly.</span></>
        ) : order.status === 'Change Pending' ? (
          <><Clock className="w-4 h-4 shrink-0 mt-0.5" /><span>A change request is pending warehouse manager approval. Changes will apply once approved.</span></>
        ) : (
          <><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>Order is already in <strong>{order.status}</strong> — any changes require warehouse manager approval before they're applied.</span></>
        )}
      </div>

      {/* Items */}
      <div className={`${UI.card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800"><tr>
            <th className={UI.th}>SKU</th>
            <th className={UI.th}>Description</th>
            <th className={`${UI.th} text-right w-32`}>Qty</th>
            <th className={`${UI.th} text-right`}>Unit Price</th>
            <th className={`${UI.th} text-right`}>Line Total</th>
            <th className={UI.th}></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-800/50">
            {items.map((it, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30">
                <td className={UI.td}><span className="font-mono text-xs text-gray-400">{it.sku}</span></td>
                <td className={UI.td}>{it.description}</td>
                <td className={`${UI.td} text-right`}>
                  {canDirectEdit ? (
                    <input type="number" min="0" value={it.qty} onChange={e => updateQty(idx, e.target.value)} className={`${UI.inputSm} w-20 text-right`} />
                  ) : (
                    <span className="text-gray-200 font-bold">{it.qty}</span>
                  )}
                </td>
                <td className={`${UI.td} text-right text-gray-300`}>{fmt$(it.unitPrice)}</td>
                <td className={`${UI.td} text-right font-bold text-gray-100`}>{fmt$(it.qty * it.unitPrice)}</td>
                <td className={UI.td}>
                  {canDirectEdit && (
                    <button onClick={() => removeItem(idx)} className="text-gray-500 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-700"><td colSpan={4} className={`${UI.td} text-right font-bold`}>Order Total</td><td className={`${UI.td} text-right text-cyan-400 font-black text-base`}>{fmt$(total)}</td><td></td></tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {canDirectEdit && dirty && (
          <button onClick={saveEdits} className={UI.btnPrimary}><Check className="w-4 h-4" /> Save Changes</button>
        )}
        {!canDirectEdit && order.status !== 'Change Pending' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
          <button onClick={onRequestChange} className={UI.btnPrimary}><Send className="w-4 h-4" /> Request Change</button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: ORDER ENTRY (new order)
// ─────────────────────────────────────────────────────────────────────────────
function OrderEntrySection({ customers, cartCustomer, cart, cartItems, cartTotal, cartCommission, onPickCustomer, onAddItem, onRemoveItem, onClearItem, onSubmit, onClearCart, apiProducts, apiInventory }) {
  const [filter, setFilter] = useState('guide');  // guide | all | categoryName
  const [search, setSearch] = useState('');

  if (!cartCustomer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-100 mb-1 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-cyan-500" /> New Order</h2>
        <p className="text-sm text-gray-500 mb-4">Pick a customer to start an order.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customers.map(c => (
            <button key={c.id} onClick={() => onPickCustomer(c.id)} disabled={c.creditHold} className={`${UI.cardPad} text-left transition-colors ${c.creditHold ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/40'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-100">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.type} · {c.address}</p>
                </div>
                {c.creditHold && <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">HOLD</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div><p className="text-gray-500 text-[10px] uppercase">Last Order</p><p className="font-bold text-gray-200">{fmtDate(c.lastOrderDate)}</p></div>
                <div><p className="text-gray-500 text-[10px] uppercase">Avg</p><p className="font-bold text-gray-200">{fmtCompact(c.avgOrderValue)}</p></div>
                <div><p className="text-gray-500 text-[10px] uppercase">Credit Avail.</p><p className="font-bold text-gray-200">{fmtCompact(c.availableCredit)}</p></div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const guideSkus = new Set(cartCustomer.orderGuide.map(g => g.sku));
  // In production, enrich apiProducts with quantity_on_hand from apiInventory
  const invByProductId = DEMO_MODE ? {} : Object.fromEntries(
    (apiInventory || []).map(inv => [inv.product_id, inv])
  );
  const liveCatalog = DEMO_MODE ? MOCK_INVENTORY : (apiProducts || []).map(p => {
    const inv = invByProductId[p.id];
    return inv ? {
      ...p,
      physicalStock:  Number(inv.quantity_on_hand) || 0,
      allocatedStock: Number(inv.quantity_reserved) || 0,
    } : p;
  });
  const catalog = liveCatalog.filter(item => {
    if (filter === 'guide' && !guideSkus.has(item.sku)) return false;
    if (search && !(item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Catalog */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-cyan-500" /> New Order — {cartCustomer.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Available credit: <strong className="text-gray-200">{fmt$(cartCustomer.availableCredit)}</strong></p>
          </div>
          <button onClick={() => onPickCustomer(null)} className={UI.btnGhost}>Switch Customer</button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilter('guide')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'guide' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:bg-gray-800/60 border border-transparent'}`}>
            <BookOpen className="w-3.5 h-3.5 inline mr-1" /> Their Guide ({cartCustomer.orderGuide.length})
          </button>
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === 'all' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:bg-gray-800/60 border border-transparent'}`}>
            Full Catalog
          </button>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or name…" className={`${UI.input} pl-9 w-64`} />
          </div>
        </div>

        <div className="space-y-2">
          {catalog.length === 0 && <div className={`${UI.cardPad} text-center text-gray-500 italic`}>No items match.</div>}
          {catalog.map(item => {
            const inCart = cart[item.sku];
            // In live mode apiProducts come from the products table and don't carry
            // inventory fields — fall back to quantity_on_hand / allocated_quantity
            // (populated once migration 030 is run) or a safe default of 0.
            const stock = (item.physicalStock ?? item.quantity_on_hand ?? 0)
                        - (item.allocatedStock ?? item.allocated_quantity ?? 0);
            const inGuide = guideSkus.has(item.sku);
            const guideRow = cartCustomer.orderGuide.find(g => g.sku === item.sku);
            const contractPrice = cartCustomer.contractPricing?.[item.id];
            const price = contractPrice ?? item.basePrice;
            return (
              <div key={item.id} className={`${UI.cardPad} flex items-center justify-between gap-4`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-100">{item.name}</p>
                    {inGuide && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">ON GUIDE</span>}
                    {contractPrice && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">CONTRACT</span>}
                    {item.promo && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">PROMO</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">{item.sku}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-bold text-gray-200 text-base">{fmt$(price)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stock > 30 ? 'bg-emerald-500/10 text-emerald-400' : stock > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {stock > 0 ? `${stock} in stock` : 'OUT'}
                    </span>
                    {guideRow && <span className="text-gray-500 text-[10px]">Suggested: {guideRow.avgQty}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {inCart ? (
                    <div className="flex items-center gap-1 bg-gray-800/40 border border-gray-700 rounded-lg p-1">
                      <button onClick={() => onRemoveItem(item.sku)} className="p-1 hover:bg-gray-700 rounded"><Minus className="w-3.5 h-3.5 text-gray-400" /></button>
                      <span className="w-7 text-center font-bold text-sm text-gray-100">{inCart.qty}</span>
                      <button onClick={() => onAddItem(item.sku)} className="p-1 hover:bg-gray-700 rounded"><Plus className="w-3.5 h-3.5 text-gray-400" /></button>
                    </div>
                  ) : (
                    <button onClick={() => onAddItem(item.sku, guideRow?.avgQty || 1)} disabled={stock <= 0} className={`${UI.btnPrimary} text-xs py-1.5 ${stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className={`${UI.card} sticky top-4 self-start overflow-hidden`}>
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-cyan-500" /> Cart ({cartItems.length})</h3>
          {cartItems.length > 0 && <button onClick={onClearCart} className="text-xs text-gray-500 hover:text-rose-400">Clear</button>}
        </div>
        {cartItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500 italic text-sm">Cart is empty</div>
        ) : (
          <div className="divide-y divide-gray-800/50 max-h-96 overflow-y-auto">
            {cartItems.map(ci => (
              <div key={ci.sku} className="px-5 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-200 truncate">{ci.description}</p>
                  <p className="text-xs text-gray-500">{ci.qty} × {fmt$(ci.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-gray-200">{fmt$(ci.total)}</span>
                  <button onClick={() => onClearItem(ci.sku)} className="text-gray-500 hover:text-rose-400 p-1"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-5 border-t border-gray-800 space-y-3 bg-gray-950/60">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-200 font-bold">{fmt$(cartTotal)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Est. commission (2.5%)</span><span className="text-violet-400 font-bold">{fmt$(cartCommission)}</span></div>
          {cartCustomer.creditHold && (
            <div className="text-xs p-2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Customer on credit hold — order will require approval.
            </div>
          )}
          <button onClick={onSubmit} disabled={cartItems.length === 0} className={`w-full justify-center ${UI.btnPrimary} ${cartItems.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <Send className="w-4 h-4" /> Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: LEADS
// ─────────────────────────────────────────────────────────────────────────────
function LeadsSection({ leads, onSelect, onAddLead }) {
  const byStage = useMemo(() => ({
    'New':       leads.filter(l => l.stage === 'New'),
    'Qualified': leads.filter(l => l.stage === 'Qualified'),
    'Proposed':  leads.filter(l => l.stage === 'Proposed'),
    'Won':       leads.filter(l => l.stage === 'Won'),
    'Lost':      leads.filter(l => l.stage === 'Lost'),
  }), [leads]);

  const totalPipeline = leads.filter(l => !['Won','Lost'].includes(l.stage)).reduce((s, l) => s + l.estValue, 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-500" /> Leads & Prospects</h2>
          <p className="text-sm text-gray-500 mt-0.5">{leads.length} leads · {fmtCompact(totalPipeline)}/yr in pipeline</p>
        </div>
        <button onClick={onAddLead} className={UI.btnPrimary}><Plus className="w-4 h-4" /> Add Lead</button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {['New','Qualified','Proposed','Won','Lost'].map(stage => (
          <div key={stage} className={`${UI.card} flex flex-col`} style={{ minHeight: '300px' }}>
            <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${LEAD_STAGE_STYLE[stage]}`}>{stage}</span>
              <span className="text-xs text-gray-500 font-bold">{byStage[stage].length}</span>
            </div>
            <div className="p-2 space-y-2 overflow-y-auto flex-1">
              {byStage[stage].length === 0 ? (
                <p className="text-[11px] text-gray-600 italic text-center py-4">None</p>
              ) : byStage[stage].map(l => (
                <button key={l.id} onClick={() => onSelect(l.id)} className="w-full text-left p-2.5 rounded-lg bg-gray-800/40 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/30 transition-colors">
                  <p className="text-sm font-bold text-gray-100 truncate">{l.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{l.type}</p>
                  <p className="text-xs text-cyan-400 font-bold mt-1">{fmtCompact(l.estValue)}/yr</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadDetailSection({ lead, onBack, onUpdateStage, onConvert }) {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className={`${UI.btnGhost} px-2 py-2`}><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-100 truncate">{lead.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${LEAD_STAGE_STYLE[lead.stage]}`}>{lead.stage}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{lead.id} · {lead.type} · {lead.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile label="Est. Annual Value" value={fmtCompact(lead.estValue)} color="cyan" />
        <KPITile label="Stage" value={lead.stage} color={lead.stage === 'Won' ? 'emerald' : lead.stage === 'Lost' ? 'rose' : 'cyan'} />
        <KPITile label="Added" value={fmtDate(lead.addedDate)} sub={`${daysSince(lead.addedDate)}d ago`} color="violet" />
        <KPITile label="Type" value={lead.type} color="amber" />
      </div>

      <div className={`${UI.cardPad}`}>
        <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-cyan-500" /> Contact</h3>
        <div className="space-y-2 text-sm">
          <p><strong className="text-gray-300">{lead.contact}</strong></p>
          <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"><Phone className="w-3.5 h-3.5" /> {lead.phone}</a>
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"><Mail className="w-3.5 h-3.5" /> {lead.email}</a>
        </div>
      </div>

      {lead.notes && (
        <div className={`${UI.cardPad}`}>
          <h3 className="font-bold text-gray-200 text-sm mb-2">Notes</h3>
          <p className="text-sm text-gray-300 italic">{lead.notes}</p>
        </div>
      )}

      <div className={`${UI.cardPad}`}>
        <h3 className="font-bold text-gray-200 text-sm mb-3">Move to Stage</h3>
        <div className="flex gap-2 flex-wrap">
          {['New','Qualified','Proposed','Won','Lost'].map(s => (
            <button key={s} onClick={() => onUpdateStage(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${lead.stage === s ? LEAD_STAGE_STYLE[s] : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
        {lead.stage === 'Won' && (
          <button onClick={onConvert} className={`mt-3 ${UI.btnPrimary}`}><UserPlus className="w-4 h-4" /> Convert to Active Customer</button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMISSION STATEMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CommissionStatementModal({ repName, period, orders, onClose }) {
  const repRate = REP_RATES[repName] ?? { rate: 0.025, territory: '—' };

  const qualifyingOrders = useMemo(() =>
    orders.filter(o => QUALIFYING_STATUSES.has(o.status)),
  [orders]);

  const orderBreakdowns = useMemo(() =>
    qualifyingOrders.map(o => ({ order: o, ...calcOrderCommission(o, repName) })),
  [qualifyingOrders, repName]);

  const totalRevenue    = orderBreakdowns.reduce((s, b) => s + b.orderTotal, 0);
  const totalCommission = orderBreakdowns.reduce((s, b) => s + b.commissionTotal, 0);

  // Aggregate by category across all orders
  const byCategory = useMemo(() => {
    const map = {};
    orderBreakdowns.forEach(b => {
      b.byCategory.forEach(cat => {
        if (!map[cat.name]) map[cat.name] = { revenue: 0, baseComm: 0, bonusComm: 0, commission: 0, baseRate: cat.baseRate, bonusRate: cat.bonusRate, totalRate: cat.totalRate };
        map[cat.name].revenue    += cat.revenue;
        map[cat.name].baseComm   += cat.baseComm  ?? 0;
        map[cat.name].bonusComm  += cat.bonusComm ?? 0;
        map[cat.name].commission += cat.commission;
      });
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.commission - a.commission);
  }, [orderBreakdowns]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="font-bold text-gray-100 text-base">Commission Statement</h2>
            <p className="text-xs text-gray-500 mt-0.5">{repName} · {repRate.territory} · {period}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Print Statement
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Qualified Revenue</div>
              <div className="text-xl font-black text-gray-100">{fmt$(totalRevenue)}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{qualifyingOrders.length} orders</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Base Rate</div>
              <div className="text-xl font-black text-gray-100">{(repRate.rate * 100).toFixed(1)}%</div>
              <div className="text-[10px] text-gray-600 mt-0.5">+ category bonus added per item</div>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
              <div className="text-xs text-violet-400 uppercase tracking-wider mb-1">Commission Earned</div>
              <div className="text-xl font-black text-violet-300">{fmt$(totalCommission)}</div>
              <div className="text-[10px] text-violet-600 mt-0.5">effective {totalRevenue > 0 ? ((totalCommission/totalRevenue)*100).toFixed(2) : '0.00'}%</div>
            </div>
          </div>

          {/* Order-level breakdown */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Breakdown</h3>
            <div className="rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-900/80 text-gray-500 border-b border-gray-800">
                    <th className="text-left px-4 py-2.5">Order</th>
                    <th className="text-left px-4 py-2.5">Customer</th>
                    <th className="text-left px-4 py-2.5">Date</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-right px-4 py-2.5">Revenue</th>
                    <th className="text-right px-4 py-2.5">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {orderBreakdowns.map(({ order, orderTotal, commissionTotal: oc }) => (
                    <tr key={order.id} className="border-t border-gray-800/60 hover:bg-gray-800/30">
                      <td className="px-4 py-2.5 font-mono text-cyan-400 font-bold">{order.id}</td>
                      <td className="px-4 py-2.5 text-gray-300">{order.customerId}</td>
                      <td className="px-4 py-2.5 text-gray-500">{fmtDate(order.date)}</td>
                      <td className="px-4 py-2.5"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-300">{fmt$(orderTotal)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-violet-400">{fmt$(oc)}</td>
                    </tr>
                  ))}
                  {qualifyingOrders.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-600 text-sm italic">No qualifying orders this period.</td></tr>
                  )}
                </tbody>
                <tfoot className="border-t border-gray-700 bg-gray-900/60">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-xs font-bold text-gray-400">TOTAL</td>
                    <td className="px-4 py-3 text-right font-bold font-mono text-gray-200">{fmt$(totalRevenue)}</td>
                    <td className="px-4 py-3 text-right font-bold font-mono text-violet-300">{fmt$(totalCommission)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* By-category summary */}
          {byCategory.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">By Product Category</h3>
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-900/80 text-gray-500 border-b border-gray-800">
                      <th className="text-left px-4 py-2.5">Category</th>
                      <th className="text-right px-4 py-2.5">Base</th>
                      <th className="text-right px-4 py-2.5">Bonus</th>
                      <th className="text-right px-4 py-2.5">Effective</th>
                      <th className="text-right px-4 py-2.5">Revenue</th>
                      <th className="text-right px-4 py-2.5">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCategory.map(cat => (
                      <tr key={cat.name} className="border-t border-gray-800/60">
                        <td className="px-4 py-2.5 text-gray-300 font-medium">{cat.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-400">{(cat.baseRate * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-400">+{(cat.bonusRate * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-200">{(cat.totalRate * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-300">{fmt$(cat.revenue)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-violet-400">{fmt$(cat.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer note */}
          <p className="text-[10px] text-gray-600 text-center">
            Commission is calculated on invoiced / delivered orders only. Cancelled and pending orders are excluded.
            Category bonus rates are added on top of the rep's base rate. Non-commissionable items (Services) earn 0% regardless of base.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────
function PerformanceSection({ mtdRevenue, mtdCommission, mtdOrders, quotaTarget, quotaProgress, visitsThisWeek, customers, orders, repName }) {
  const [showStatement, setShowStatement] = useState(false);

  // Top accounts by YTD spend
  const topAccounts = [...customers].sort((a, b) => b.ytdSpend - a.ytdSpend).slice(0, 5);

  // Leaderboard
  const leaderboard = [
    { name: 'Sofia Castillo', territory: 'Baton Rouge',        mtd: 78400, you: false },
    { name: 'Marcus Chen',    territory: 'Lafayette',          mtd: 65200, you: false },
    { name: repName,          territory: REP_RATES[repName]?.territory || '—', mtd: mtdRevenue, you: true },
    { name: 'Priya Anand',    territory: 'Slidell',            mtd: 41800, you: false },
    { name: 'Joey DeLuca',    territory: 'Metairie',           mtd: 38500, you: false },
  ].sort((a, b) => b.mtd - a.mtd).map((r, i) => ({ ...r, rank: i + 1 }));

  // Commission breakdown for qualifying orders
  const orderBreakdowns = useMemo(() => {
    const qualifying = orders.filter(o => QUALIFYING_STATUSES.has(o.status));
    return qualifying.map(o => ({ order: o, ...calcOrderCommission(o, repName) }));
  }, [orders, repName]);

  const totalCommission = orderBreakdowns.reduce((s, b) => s + b.commissionTotal, 0);

  // By-category aggregate
  const byCategory = useMemo(() => {
    const map = {};
    orderBreakdowns.forEach(b => {
      b.byCategory.forEach(cat => {
        if (!map[cat.name]) map[cat.name] = { revenue: 0, baseComm: 0, bonusComm: 0, commission: 0, baseRate: cat.baseRate, bonusRate: cat.bonusRate, totalRate: cat.totalRate };
        map[cat.name].revenue    += cat.revenue;
        map[cat.name].baseComm   += cat.baseComm  ?? 0;
        map[cat.name].bonusComm  += cat.bonusComm ?? 0;
        map[cat.name].commission += cat.commission;
      });
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.commission - a.commission);
  }, [orderBreakdowns]);

  const totalBaseComm  = orderBreakdowns.reduce((s, b) => s + (b.baseTotal  ?? 0), 0);
  const totalBonusComm = orderBreakdowns.reduce((s, b) => s + (b.bonusTotal ?? 0), 0);

  // 6-month history (May = current live data)
  const history = useMemo(() => {
    const hist = (MONTHLY_HISTORY[repName] || []).slice();
    const mayIdx = hist.findIndex(h => h.month === 'May 2026');
    if (mayIdx >= 0) {
      hist[mayIdx] = { ...hist[mayIdx], revenue: mtdRevenue, commission: totalCommission };
    }
    return hist;
  }, [repName, mtdRevenue, totalCommission]);

  const maxCommission = Math.max(...history.map(h => h.commission || 0), 1);
  const repRate = REP_RATES[repName] ?? { rate: 0.025 };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-500" /> My Performance</h2>
        <button
          onClick={() => setShowStatement(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-sm font-semibold"
        >
          <FileText className="w-4 h-4" /> Monthly Statement
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile label="MTD Revenue"    value={fmt$(mtdRevenue)}      color="cyan" />
        <KPITile label="Commission MTD" value={fmt$(totalCommission)}  sub={`${fmt$(totalBaseComm)} base + ${fmt$(totalBonusComm)} bonus`} color="violet" />
        <KPITile label="Orders MTD"     value={String(mtdOrders)}     color="amber" />
        <KPITile label="Visits This Wk" value={String(visitsThisWeek)} color="emerald" />
      </div>

      {/* Quota progress */}
      <div className={UI.cardPad}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><Target className="w-4 h-4 text-cyan-500" /> Monthly Quota</h3>
          <span className="text-xs text-gray-500">{fmt$(mtdRevenue)} of {fmt$(quotaTarget)}</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${quotaProgress >= 100 ? 'bg-emerald-500' : quotaProgress >= 70 ? 'bg-cyan-500' : 'bg-amber-500'} transition-all`} style={{ width: `${Math.min(100, quotaProgress)}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {quotaProgress >= 100 ? `🎉 Target hit — ${fmt$(mtdRevenue - quotaTarget)} over.` : `${(100 - quotaProgress).toFixed(0)}% to go (${fmt$(quotaTarget - mtdRevenue)})`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Commission breakdown by order */}
        <div className={`${UI.card} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-violet-400" /> Commission by Order</h3>
            <span className="text-xs text-violet-400 font-bold">{fmt$(totalCommission)}</span>
          </div>
          {orderBreakdowns.length === 0 ? (
            <div className="p-5 text-sm text-gray-600 italic text-center">No qualifying orders yet this month.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className={UI.th}>Order</th>
                  <th className={UI.th}>Customer</th>
                  <th className={`${UI.th} text-right`}>Revenue</th>
                  <th className={`${UI.th} text-right`}>Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {orderBreakdowns.map(({ order, orderTotal, commissionTotal: oc }) => (
                  <tr key={order.id} className="hover:bg-gray-800/30">
                    <td className={UI.td}><span className="font-mono text-cyan-400">{order.id}</span></td>
                    <td className={UI.td}><span className="text-gray-300 text-[11px]">{order.customerId}</span></td>
                    <td className={`${UI.td} text-right text-gray-400 font-mono`}>{fmt$(orderTotal)}</td>
                    <td className={`${UI.td} text-right font-bold font-mono text-violet-400`}>{fmt$(oc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* By category */}
        <div className={`${UI.card} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-gray-800">
            <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-500" /> Commission by Category</h3>
          </div>
          {byCategory.length === 0 ? (
            <div className="p-5 text-sm text-gray-600 italic text-center">No data yet.</div>
          ) : (
            <div className="p-4 space-y-3">
              {byCategory.map(cat => {
                const pct = totalCommission > 0 ? (cat.commission / totalCommission) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-medium">{cat.name}</span>
                      <span className="text-violet-400 font-bold">{fmt$(cat.commission)} <span className="text-gray-600 font-normal">@ {(cat.totalRate*100).toFixed(1)}% <span className="text-emerald-700">({(cat.baseRate*100).toFixed(1)}%+{(cat.bonusRate*100).toFixed(1)}%)</span></span></span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6-month history */}
      <div className={`${UI.card} overflow-hidden`}>
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-500" /> Commission History — Last 6 Months</h3>
        </div>
        <div className="p-5 flex items-end gap-3 h-36">
          {history.map(h => {
            const barH = h.commission ? Math.max(8, (h.commission / maxCommission) * 100) : 4;
            const isCurrent = h.month.startsWith('May 2026');
            return (
              <div key={h.month} className="flex-1 flex flex-col items-center gap-1.5">
                <span className={`text-[10px] font-bold ${isCurrent ? 'text-violet-400' : 'text-gray-500'}`}>{h.commission ? fmt$(h.commission) : '…'}</span>
                <div className="w-full flex items-end" style={{ height: 64 }}>
                  <div
                    className={`w-full rounded-t-md ${isCurrent ? 'bg-violet-500' : 'bg-gray-700'} transition-all`}
                    style={{ height: `${barH}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-600 truncate w-full text-center">{h.month.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top accounts */}
        <div className={`${UI.card} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-gray-800"><h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /> Top Accounts (YTD)</h3></div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800/50">
              {topAccounts.map((c, i) => (
                <tr key={c.id} className="hover:bg-gray-800/30">
                  <td className={`${UI.td} w-8`}><span className="text-gray-500 font-mono">#{i+1}</span></td>
                  <td className={UI.td}><span className="text-gray-200 font-bold">{c.name}</span></td>
                  <td className={`${UI.td} text-right text-cyan-400 font-bold`}>{fmtCompact(c.ytdSpend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leaderboard */}
        <div className={`${UI.card} overflow-hidden`}>
          <div className="px-5 py-3 border-b border-gray-800"><h3 className="font-bold text-gray-200 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Team Leaderboard (MTD)</h3></div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800/50">
              {leaderboard.map(r => (
                <tr key={r.name} className={`${r.you ? 'bg-cyan-500/5' : ''} hover:bg-gray-800/30`}>
                  <td className={`${UI.td} w-8`}><span className={`font-mono ${r.rank <= 3 ? 'text-amber-400 font-bold' : 'text-gray-500'}`}>#{r.rank}</span></td>
                  <td className={UI.td}>
                    <span className={r.you ? 'text-cyan-400 font-bold' : 'text-gray-200'}>{r.name}{r.you && ' (you)'}</span>
                    <span className="block text-[10px] text-gray-500">{r.territory}</span>
                  </td>
                  <td className={`${UI.td} text-right text-gray-200 font-bold`}>{fmtCompact(r.mtd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showStatement && (
        <CommissionStatementModal
          repName={repName}
          period="May 2026"
          orders={orders}
          onClose={() => setShowStatement(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────────────────
function PaymentModal({ customer, onClose, onSubmit }) {
  const [method, setMethod] = useState('check');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  // Mock: pretend the AR balance is split into invoices for allocation
  const mockInvoices = [
    { id: `INV-${customer.id.slice(-3)}A`, date: '2026-04-21', amount: customer.arAging.days30 || customer.arAging.current * 0.4, paid: 0 },
    { id: `INV-${customer.id.slice(-3)}B`, date: '2026-05-01', amount: customer.arAging.current * 0.6, paid: 0 },
  ].filter(inv => inv.amount > 0);
  const [allocations, setAllocations] = useState(mockInvoices.map(inv => ({ id: inv.id, applied: 0 })));

  const setAllocation = (id, v) => setAllocations(prev => prev.map(a => a.id === id ? { ...a, applied: Math.max(0, Number(v) || 0) } : a));
  const totalAllocated = allocations.reduce((s, a) => s + a.applied, 0);
  const remaining = Number(amount) - totalAllocated;
  const canSubmit = Number(amount) > 0 && method && (method === 'cash' || reference.trim());

  return (
    <Overlay>
      <ModalBox wide>
        <ModalHeader title="Collect Payment" icon={DollarSign} onClose={onClose} />
        <div className="p-6 space-y-4">
          <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Customer</p>
              <p className="font-bold text-gray-100">{customer.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Outstanding</p>
              <p className="font-bold text-rose-400">{fmt$(customer.arBalance)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['cash','check','card'].map(m => (
              <button key={m} onClick={() => setMethod(m)} className={`px-3 py-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-1 ${method === m ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-gray-800/30 text-gray-400 border-gray-800 hover:bg-gray-800/60'}`}>
                {m === 'cash' && <DollarSign className="w-4 h-4" />}
                {m === 'check' && <Receipt className="w-4 h-4" />}
                {m === 'card' && <CreditCard className="w-4 h-4" />}
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={UI.label}>Amount *</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className={UI.input} placeholder="0.00" />
            </div>
            <div>
              <label className={UI.label}>{method === 'check' ? 'Check #' : method === 'card' ? 'Auth #' : 'Reference (optional)'}</label>
              <input value={reference} onChange={e => setReference(e.target.value)} className={UI.input} placeholder={method === 'check' ? 'e.g. 4421' : 'Optional'} />
            </div>
          </div>

          {mockInvoices.length > 0 && (
            <div>
              <label className={UI.label}>Apply to Invoices</label>
              <div className="border border-gray-800 rounded-lg divide-y divide-gray-800/60">
                {mockInvoices.map(inv => {
                  const alloc = allocations.find(a => a.id === inv.id);
                  return (
                    <div key={inv.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-mono text-gray-300">{inv.id}</p>
                        <p className="text-xs text-gray-500">{fmtDate(inv.date)} · {fmt$(inv.amount)} due</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Apply</span>
                        <input type="number" step="0.01" min="0" max={inv.amount} value={alloc?.applied || ''} onChange={e => setAllocation(inv.id, e.target.value)} className={`${UI.inputSm} w-24 text-right`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {Number(amount) > 0 && (
                <p className={`text-xs mt-2 ${Math.abs(remaining) < 0.01 ? 'text-emerald-400' : remaining > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  Allocated {fmt$(totalAllocated)} of {fmt$(amount)} · Unapplied {fmt$(remaining)}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={onClose} className={UI.btnGhost}>Cancel</button>
            <button onClick={() => onSubmit({ customerId: customer.id, method, amount, reference, allocations })} disabled={!canSubmit} className={`${UI.btnPrimary} ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Receipt className="w-4 h-4" /> Record Payment
            </button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function AddLeadModal({ rep, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', type: 'Restaurant', address: '', contact: '', phone: '', email: '', estValue: 0, notes: '' });
  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const canSubmit = form.name.trim() && form.address.trim();

  return (
    <Overlay>
      <ModalBox>
        <ModalHeader title="Capture New Lead" icon={MapPin} onClose={onClose} />
        <div className="p-6 space-y-3">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-300 flex items-start gap-2">
            <Navigation className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Pinning at your current location ({rep.deviceLocation.x}, {rep.deviceLocation.y}). You can adjust after saving.</span>
          </div>
          <div>
            <label className={UI.label}>Business Name *</label>
            <input value={form.name} onChange={e => setF('name', e.target.value)} className={UI.input} placeholder="e.g. Bayou Café" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={UI.label}>Type</label>
              <select value={form.type} onChange={e => setF('type', e.target.value)} className={UI.select}>
                {['Restaurant','Bar & Grill','Brewpub','Café','Hospitality','Catering','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={UI.label}>Est. Annual Value</label>
              <input type="number" min="0" value={form.estValue} onChange={e => setF('estValue', e.target.value)} className={UI.input} placeholder="50000" />
            </div>
          </div>
          <div>
            <label className={UI.label}>Address *</label>
            <input value={form.address} onChange={e => setF('address', e.target.value)} className={UI.input} placeholder="Street address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={UI.label}>Primary Contact</label>
              <input value={form.contact} onChange={e => setF('contact', e.target.value)} className={UI.input} placeholder="Name" />
            </div>
            <div>
              <label className={UI.label}>Phone</label>
              <input value={form.phone} onChange={e => setF('phone', e.target.value)} className={UI.input} placeholder="(504) 555-…" />
            </div>
          </div>
          <div>
            <label className={UI.label}>Email</label>
            <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} className={UI.input} placeholder="contact@..." />
          </div>
          <div>
            <label className={UI.label}>Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setF('notes', e.target.value)} className={UI.input} placeholder="Why is this a good lead? Any context?" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={onClose} className={UI.btnGhost}>Cancel</button>
            <button onClick={() => onSubmit({ ...form, location: { x: rep.deviceLocation.x, y: rep.deviceLocation.y }, estValue: Number(form.estValue) })} disabled={!canSubmit} className={`${UI.btnPrimary} ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Plus className="w-4 h-4" /> Save Lead
            </button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

function ChangeRequestModal({ order, customer, onClose, onSubmit, apiProducts, apiInventory }) {
  // Allow the user to mark line items for: change qty, remove, or add a new sku
  const [proposed, setProposed] = useState(order.items.map(i => ({ ...i, newQty: i.qty, remove: false })));
  const [newSku, setNewSku] = useState('');
  const [additions, setAdditions] = useState([]);   // [{sku, description, qty}]
  const [reason, setReason] = useState('');

  const updateQty = (idx, v) => setProposed(prev => prev.map((it, i) => i === idx ? { ...it, newQty: Math.max(0, Number(v) || 0) } : it));
  const toggleRemove = (idx) => setProposed(prev => prev.map((it, i) => i === idx ? { ...it, remove: !it.remove, newQty: it.remove ? it.qty : 0 } : it));
  const addNew = () => {
    const inv = itemFromSku(newSku);
    if (!inv) return;
    setAdditions(prev => [...prev, { sku: inv.sku, description: inv.name, qty: 1 }]);
    setNewSku('');
  };
  const updateAddQty = (idx, v) => setAdditions(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, Number(v) || 1) } : it));
  const removeAddition = (idx) => setAdditions(prev => prev.filter((_, i) => i !== idx));

  const changes = useMemo(() => {
    const list = [];
    proposed.forEach((it) => {
      if (it.remove)       list.push({ action: 'remove', sku: it.sku, description: it.description, fromQty: it.qty, toQty: 0 });
      else if (it.newQty !== it.qty) list.push({ action: 'change', sku: it.sku, description: it.description, fromQty: it.qty, toQty: it.newQty });
    });
    additions.forEach(a => list.push({ action: 'add', sku: a.sku, description: a.description, fromQty: null, toQty: a.qty }));
    return list;
  }, [proposed, additions]);

  const canSubmit = changes.length > 0 && reason.trim();

  return (
    <Overlay>
      <ModalBox wide>
        <ModalHeader title="Request Order Change" icon={Send} onClose={onClose} />
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Order <strong className="font-mono">{order.id}</strong> is in <strong>{order.status}</strong>. This request will go to the warehouse manager for approval.</span>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 text-sm mb-2">Existing Items</h4>
            <div className="border border-gray-800 rounded-lg divide-y divide-gray-800/60">
              {proposed.map((it, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-200">{it.description}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{it.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Was {it.qty}</span>
                    <ArrowRight className="w-3 h-3 text-gray-600" />
                    <input type="number" min="0" disabled={it.remove} value={it.newQty} onChange={e => updateQty(idx, e.target.value)} className={`${UI.inputSm} w-16 text-right`} />
                    <button onClick={() => toggleRemove(idx)} className={`p-1.5 rounded ${it.remove ? 'bg-rose-500/20 text-rose-400' : 'text-gray-500 hover:text-rose-400'}`} title="Remove from order">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-200 text-sm mb-2">Add Items</h4>
            <div className="flex gap-2 mb-2">
              <select value={newSku} onChange={e => setNewSku(e.target.value)} className={`${UI.select} flex-1`}>
                <option value="">Pick a SKU to add…</option>
                {(DEMO_MODE ? MOCK_INVENTORY : (() => {
                  const invMap = Object.fromEntries((apiInventory || []).map(inv => [inv.product_id, inv]));
                  return (apiProducts || []).map(p => {
                    const inv = invMap[p.id];
                    return inv ? { ...p, physicalStock: Number(inv.quantity_on_hand) || 0 } : p;
                  });
                })()).filter(i => !order.items.some(it => it.sku === i.sku) && !additions.some(a => a.sku === i.sku)).map(i => (
                  <option key={i.id} value={i.sku}>{i.sku} — {i.name}</option>
                ))}
              </select>
              <button onClick={addNew} disabled={!newSku} className={`${UI.btnSecondary} ${!newSku ? 'opacity-40 cursor-not-allowed' : ''}`}><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            {additions.length > 0 && (
              <div className="border border-gray-800 rounded-lg divide-y divide-gray-800/60">
                {additions.map((a, idx) => (
                  <div key={idx} className="px-4 py-2 flex items-center gap-3 bg-emerald-500/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-200">{a.description}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{a.sku}</p>
                    </div>
                    <input type="number" min="1" value={a.qty} onChange={e => updateAddQty(idx, e.target.value)} className={`${UI.inputSm} w-16 text-right`} />
                    <button onClick={() => removeAddition(idx)} className="text-gray-500 hover:text-rose-400 p-1"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={UI.label}>Reason for change *</label>
            <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className={UI.input} placeholder="Customer called to swap chicken for salmon and add more buns…" />
          </div>

          <div className="text-xs text-gray-500 italic">
            {changes.length === 0 ? 'No changes proposed yet.' : `${changes.length} change${changes.length === 1 ? '' : 's'} will be sent for approval.`}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
            <button onClick={onClose} className={UI.btnGhost}>Cancel</button>
            <button onClick={() => onSubmit({ orderId: order.id, changes, reason })} disabled={!canSubmit} className={`${UI.btnPrimary} ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <Send className="w-4 h-4" /> Submit Change Request
            </button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}
