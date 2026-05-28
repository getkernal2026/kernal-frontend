import React, { useState, useCallback } from 'react';
import {
  ArrowLeftRight, CheckCircle, XCircle, AlertTriangle, Clock,
  RefreshCw, Send, ChevronDown, ChevronRight, Plus, Wifi, WifiOff,
  FileText, ArrowDown, ArrowUp, Activity, Link2, Package, Truck,
  DollarSign, Filter, Download, AlertCircle, MoreHorizontal
} from 'lucide-react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';
import { DEMO_MODE } from './lib/demoMode.js';

const fmtMoney = v => '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Document type metadata ────────────────────────────────────────────────────
const DOC_META = {
  '850': { label: 'Purchase Order',   bg: 'rgba(6,182,212,.15)',   text: '#22d3ee' },
  '856': { label: 'Advance Ship Ntc', bg: 'rgba(167,139,250,.15)', text: '#a78bfa' },
  '810': { label: 'Invoice',          bg: 'rgba(52,211,153,.15)',  text: '#34d399' },
  '214': { label: 'Ship Status',      bg: 'rgba(245,158,11,.15)',  text: '#fbbf24' },
  '997': { label: 'Functional Ack',   bg: 'rgba(113,113,122,.15)', text: '#a1a1aa' },
};

function DocChip({ type }) {
  const m = DOC_META[type] || DOC_META['997'];
  return (
    <span style={{ background: m.bg, color: m.text }}
      className="text-xs font-bold px-2 py-0.5 rounded font-mono">
      {type}
    </span>
  );
}

// ── Trading Partners ──────────────────────────────────────────────────────────
const INIT_PARTNERS = [
  { id: 'TP001', name: 'Sysco Food Services',  qualifier: '01', isaId: '002243577', duns: '007026394', status: 'active',   docTypes: ['850','856','810','214'], connection: 'AS2',  lastActivity: '2026-05-26 08:14', pendingIn: 2, pendingOut: 3, errors: 0, ackRequired: true,  testMode: false },
  { id: 'TP002', name: 'US Foods',             qualifier: '01', isaId: '005440108', duns: '004937174', status: 'active',   docTypes: ['850','856','810','214'], connection: 'AS2',  lastActivity: '2026-05-25 15:42', pendingIn: 1, pendingOut: 2, errors: 1, ackRequired: true,  testMode: false },
  { id: 'TP003', name: 'Gordon Food Service',  qualifier: '01', isaId: '006955098', duns: '003987425', status: 'active',   docTypes: ['850','810'],             connection: 'FTP',  lastActivity: '2026-05-24 11:20', pendingIn: 1, pendingOut: 1, errors: 0, ackRequired: false, testMode: false },
  { id: 'TP004', name: 'Publix Super Markets', qualifier: '01', isaId: '003478956', duns: '009231567', status: 'active',   docTypes: ['850','856','810','214'], connection: 'AS2',  lastActivity: '2026-05-26 09:55', pendingIn: 0, pendingOut: 2, errors: 0, ackRequired: true,  testMode: false },
  { id: 'TP005', name: 'Walmart Stores',       qualifier: '01', isaId: '001002765', duns: '002090236', status: 'inactive', docTypes: ['850','856','810','214'], connection: 'AS2',  lastActivity: '2026-05-10 14:30', pendingIn: 0, pendingOut: 0, errors: 2, ackRequired: true,  testMode: true  },
];

// ── Inbound 850 Purchase Orders ───────────────────────────────────────────────
const INIT_850 = [
  {
    id: 'EDI-850-0091', partnerId: 'TP001', partnerRef: 'SC-PO-229847',
    received: '2026-05-26 08:14', deliveryDate: '2026-05-28',
    shipTo: 'Sysco Tampa DC — 5715 Benjamin Rd, Tampa FL 33634',
    status: 'pending_map', total: 4280.00,
    lines: [
      { seq: 1, partnerItem: 'SYS-100482', ourSku: 'FRZ-BEEF-01',  desc: 'Ground Beef 80/20 10lb',      qty: 20, uom: 'CS', unitPrice:  89.00, total: 1780.00, mapped: true  },
      { seq: 2, partnerItem: 'SYS-203847', ourSku: 'PLT-CHICK-05', desc: 'Chicken Breast 40lb Case',    qty: 15, uom: 'CS', unitPrice:  92.00, total: 1380.00, mapped: true  },
      { seq: 3, partnerItem: 'SYS-009321', ourSku: 'DAI-CHE-02',   desc: 'American Cheese Sliced 5lb', qty: 12, uom: 'CS', unitPrice:  47.50, total:  570.00, mapped: true  },
      { seq: 4, partnerItem: 'SYS-441200', ourSku: 'DRY-OIL-5G',   desc: 'Vegetable Oil 5 Gal Jug',   qty:  6, uom: 'EA', unitPrice:  91.67, total:  550.00, mapped: true  },
    ],
  },
  {
    id: 'EDI-850-0090', partnerId: 'TP002', partnerRef: 'USF-PO-884412',
    received: '2026-05-25 15:42', deliveryDate: '2026-05-27',
    shipTo: 'US Foods Tampa — 4205 E 10th Ave, Tampa FL 33605',
    status: 'processed', kernalSo: 'SO-9901', total: 2150.00,
    lines: [
      { seq: 1, partnerItem: 'USF-D-4421', ourSku: 'DAI-MILK-02', desc: 'Whole Milk 1 Gal',        qty: 48, uom: 'EA', unitPrice:  4.25, total:  204.00, mapped: true },
      { seq: 2, partnerItem: 'USF-P-7710', ourSku: 'PRO-TOMA-01', desc: 'Roma Tomatoes 25lb',      qty: 30, uom: 'CS', unitPrice: 28.50, total:  855.00, mapped: true },
      { seq: 3, partnerItem: 'USF-BK-22',  ourSku: 'BAK-BUN-01',  desc: 'Brioche Burger Buns 12pk', qty: 40, uom: 'CS', unitPrice: 18.25, total:  730.00, mapped: true },
      { seq: 4, partnerItem: 'USF-R-0091', ourSku: 'DRY-RICE-05', desc: 'Jasmine Rice 50lb Bag',   qty:  8, uom: 'BG', unitPrice: 45.13, total:  361.00, mapped: true },
    ],
  },
  {
    id: 'EDI-850-0089', partnerId: 'TP003', partnerRef: 'GFS-2026-44201',
    received: '2026-05-24 11:20', deliveryDate: '2026-05-27',
    shipTo: 'Gordon Food Service — 2200 Calumet Ave, Valparaiso IN 46383',
    status: 'error', errorMsg: 'Line 1: Partner item# GFS-OIL-XL5 has no matching Kernel SKU — manual mapping required before order can be created.',
    total: 1890.00,
    lines: [
      { seq: 1, partnerItem: 'GFS-OIL-XL5', ourSku: null,          desc: 'Vegetable Oil 5 Gallon Jug', qty: 18, uom: 'EA', unitPrice: 52.50, total:  945.00, mapped: false },
      { seq: 2, partnerItem: 'GFS-R-44',     ourSku: 'DRY-RICE-05', desc: 'Jasmine Rice 50lb',          qty: 10, uom: 'BG', unitPrice: 45.50, total:  455.00, mapped: true  },
      { seq: 3, partnerItem: 'GFS-CHE-12',   ourSku: 'DAI-CHE-02',  desc: 'American Cheese 5lb',        qty: 10, uom: 'CS', unitPrice: 49.00, total:  490.00, mapped: true  },
    ],
  },
  {
    id: 'EDI-850-0088', partnerId: 'TP001', partnerRef: 'SC-PO-229840',
    received: '2026-05-24 09:05', deliveryDate: '2026-05-26',
    shipTo: 'Sysco Tampa DC — 5715 Benjamin Rd, Tampa FL 33634',
    status: 'processed', kernalSo: 'SO-9893', total: 8640.00,
    lines: [
      { seq: 1, partnerItem: 'SYS-100482', ourSku: 'FRZ-BEEF-01',  desc: 'Ground Beef 80/20 10lb',   qty: 40, uom: 'CS', unitPrice:  89.00, total: 3560.00, mapped: true },
      { seq: 2, partnerItem: 'SYS-203847', ourSku: 'PLT-CHICK-05', desc: 'Chicken Breast 40lb Case', qty: 30, uom: 'CS', unitPrice:  92.00, total: 2760.00, mapped: true },
      { seq: 3, partnerItem: 'SYS-009321', ourSku: 'DAI-CHE-02',   desc: 'American Cheese 5lb',      qty: 24, uom: 'CS', unitPrice:  49.17, total: 1180.00, mapped: true },
      { seq: 4, partnerItem: 'SYS-441200', ourSku: 'DRY-OIL-5G',   desc: 'Vegetable Oil 5 Gal',      qty: 12, uom: 'EA', unitPrice:  95.00, total: 1140.00, mapped: true },
    ],
  },
  {
    id: 'EDI-850-0087', partnerId: 'TP002', partnerRef: 'USF-PO-884390',
    received: '2026-05-25 09:11', deliveryDate: '2026-05-28',
    shipTo: 'US Foods Tampa — 4205 E 10th Ave, Tampa FL 33605',
    status: 'pending_map', total: 960.00,
    lines: [
      { seq: 1, partnerItem: 'USF-P-7710', ourSku: 'PRO-TOMA-01', desc: 'Roma Tomatoes 25lb',       qty: 20, uom: 'CS', unitPrice: 28.50, total: 570.00, mapped: true },
      { seq: 2, partnerItem: 'USF-D-4421', ourSku: 'DAI-MILK-02', desc: 'Whole Milk 1 Gal',         qty: 36, uom: 'EA', unitPrice:  4.25, total: 153.00, mapped: true },
      { seq: 3, partnerItem: 'USF-BK-22',  ourSku: 'BAK-BUN-01',  desc: 'Brioche Burger Buns 12pk', qty: 13, uom: 'CS', unitPrice: 18.23, total: 237.00, mapped: true },
    ],
  },
  {
    id: 'EDI-850-0086', partnerId: 'TP004', partnerRef: 'PBX-20260522-0034',
    received: '2026-05-22 10:30', deliveryDate: '2026-05-26',
    shipTo: 'Publix Distribution — 3300 Publix Corporate Pkwy, Lakeland FL 33811',
    status: 'processed', kernalSo: 'SO-9895', total: 3420.00,
    lines: [
      { seq: 1, partnerItem: 'PBX-BF-001', ourSku: 'FRZ-BEEF-01',  desc: 'Ground Beef 80/20 10lb',   qty: 24, uom: 'CS', unitPrice:  89.00, total: 2136.00, mapped: true },
      { seq: 2, partnerItem: 'PBX-CK-005', ourSku: 'PLT-CHICK-05', desc: 'Chicken Breast 40lb Case', qty:  8, uom: 'CS', unitPrice:  92.00, total:  736.00, mapped: true },
      { seq: 3, partnerItem: 'PBX-CH-002', ourSku: 'DAI-CHE-02',   desc: 'American Cheese 5lb',       qty: 11, uom: 'CS', unitPrice:  49.82, total:  548.00, mapped: true },
    ],
  },
  {
    id: 'EDI-850-0085', partnerId: 'TP003', partnerRef: 'GFS-2026-44188',
    received: '2026-05-23 14:05', deliveryDate: '2026-05-26',
    shipTo: 'Gordon Food Service — 2200 Calumet Ave, Valparaiso IN 46383',
    status: 'pending_map', total: 2710.00,
    lines: [
      { seq: 1, partnerItem: 'GFS-BF-010', ourSku: 'FRZ-BEEF-01',  desc: 'Ground Beef 80/20 10lb',   qty: 18, uom: 'CS', unitPrice:  89.00, total: 1602.00, mapped: true },
      { seq: 2, partnerItem: 'GFS-CK-40',  ourSku: 'PLT-CHICK-05', desc: 'Chicken Breast 40lb Case', qty: 12, uom: 'CS', unitPrice:  92.33, total: 1108.00, mapped: true },
    ],
  },
];

// ── Outbound Queue ────────────────────────────────────────────────────────────
const INIT_OUTBOUND = [
  { id: 'EDI-856-0047', type: '856', partnerId: 'TP001', ref: 'SO-9893',  partnerPo: 'SC-PO-229840',      created: '2026-05-26 09:30', status: 'ready',  detail: { shipDate: '2026-05-26', carrier: 'Gulf Coast Freight', proNum: 'GCF-20260526-4401', lines: 4, total: 8640.00 } },
  { id: 'EDI-856-0046', type: '856', partnerId: 'TP004', ref: 'SO-9895',  partnerPo: 'PBX-20260522-0034', created: '2026-05-25 16:45', status: 'sent',   detail: { shipDate: '2026-05-25', carrier: 'Gulf Coast Freight', proNum: 'GCF-20260525-4398', lines: 3, total: 3420.00 } },
  { id: 'EDI-856-0045', type: '856', partnerId: 'TP002', ref: 'SO-9901',  partnerPo: 'USF-PO-884412',     created: '2026-05-25 08:00', status: 'ready',  detail: { shipDate: '2026-05-25', carrier: 'Gulf Coast Freight', proNum: 'GCF-20260525-4391', lines: 4, total: 2150.00 } },
  { id: 'EDI-810-0083', type: '810', partnerId: 'TP001', ref: 'INV-511',  partnerPo: 'SC-PO-229840',      created: '2026-05-26 10:00', status: 'ready',  detail: { invoiceDate: '2026-05-26', dueDate: '2026-06-25', lines: 4, total: 8640.00 } },
  { id: 'EDI-810-0082', type: '810', partnerId: 'TP002', ref: 'INV-510',  partnerPo: 'USF-PO-884412',     created: '2026-05-25 17:00', status: 'error',  errorMsg: 'Partner 997 rejection: GS06 group control number mismatch. Resequence and resubmit.', detail: { invoiceDate: '2026-05-25', dueDate: '2026-06-24', lines: 4, total: 2150.00 } },
  { id: 'EDI-810-0081', type: '810', partnerId: 'TP004', ref: 'INV-509',  partnerPo: 'PBX-20260522-0034', created: '2026-05-25 16:50', status: 'sent',   detail: { invoiceDate: '2026-05-25', dueDate: '2026-06-24', lines: 3, total: 3420.00 } },
  { id: 'EDI-810-0080', type: '810', partnerId: 'TP003', ref: 'INV-508',  partnerPo: 'GFS-2026-44188',    created: '2026-05-24 16:00', status: 'sent',   detail: { invoiceDate: '2026-05-24', dueDate: '2026-06-23', lines: 2, total: 2710.00 } },
  { id: 'EDI-214-0039', type: '214', partnerId: 'TP001', ref: 'SO-9893',  partnerPo: 'SC-PO-229840',      created: '2026-05-26 11:15', status: 'ready',  detail: { event: 'AF', eventDesc: 'Out for Delivery', location: 'Tampa, FL',    carrier: 'Gulf Coast Freight' } },
  { id: 'EDI-214-0038', type: '214', partnerId: 'TP004', ref: 'SO-9895',  partnerPo: 'PBX-20260522-0034', created: '2026-05-25 14:30', status: 'sent',   detail: { event: 'D1', eventDesc: 'Delivered',        location: 'Lakeland, FL', carrier: 'Gulf Coast Freight' } },
  { id: 'EDI-214-0037', type: '214', partnerId: 'TP002', ref: 'SO-9901',  partnerPo: 'USF-PO-884412',     created: '2026-05-25 07:45', status: 'sent',   detail: { event: 'X1', eventDesc: 'Picked Up',         location: 'Tampa, FL',    carrier: 'Gulf Coast Freight' } },
];

// ── Transaction Log ───────────────────────────────────────────────────────────
const INIT_LOG = [
  { id: 'TXN-001', ts: '2026-05-26 11:15', type: '214', dir: 'out', partnerId: 'TP001', ref: 'EDI-214-0039',    status: 'queued',   ack: null           },
  { id: 'TXN-002', ts: '2026-05-26 10:00', type: '810', dir: 'out', partnerId: 'TP001', ref: 'EDI-810-0083',    status: 'queued',   ack: null           },
  { id: 'TXN-003', ts: '2026-05-26 09:30', type: '856', dir: 'out', partnerId: 'TP001', ref: 'EDI-856-0047',    status: 'queued',   ack: null           },
  { id: 'TXN-004', ts: '2026-05-26 08:14', type: '850', dir: 'in',  partnerId: 'TP001', ref: 'EDI-850-0091',    status: 'received', ack: '997 Accepted' },
  { id: 'TXN-005', ts: '2026-05-25 17:00', type: '810', dir: 'out', partnerId: 'TP002', ref: 'EDI-810-0082',    status: 'error',    ack: '997 Rejected' },
  { id: 'TXN-006', ts: '2026-05-25 16:50', type: '810', dir: 'out', partnerId: 'TP004', ref: 'EDI-810-0081',    status: 'sent',     ack: '997 Accepted' },
  { id: 'TXN-007', ts: '2026-05-25 16:45', type: '856', dir: 'out', partnerId: 'TP004', ref: 'EDI-856-0046',    status: 'sent',     ack: '997 Accepted' },
  { id: 'TXN-008', ts: '2026-05-25 15:42', type: '850', dir: 'in',  partnerId: 'TP002', ref: 'EDI-850-0090',    status: 'received', ack: '997 Accepted' },
  { id: 'TXN-009', ts: '2026-05-25 14:30', type: '214', dir: 'out', partnerId: 'TP004', ref: 'EDI-214-0038',    status: 'sent',     ack: null           },
  { id: 'TXN-010', ts: '2026-05-25 09:11', type: '850', dir: 'in',  partnerId: 'TP002', ref: 'EDI-850-0087',    status: 'received', ack: '997 Accepted' },
  { id: 'TXN-011', ts: '2026-05-25 08:00', type: '856', dir: 'out', partnerId: 'TP002', ref: 'EDI-856-0045',    status: 'queued',   ack: null           },
  { id: 'TXN-012', ts: '2026-05-24 11:20', type: '850', dir: 'in',  partnerId: 'TP003', ref: 'EDI-850-0089',    status: 'error',    ack: '997 Accepted' },
  { id: 'TXN-013', ts: '2026-05-24 09:05', type: '850', dir: 'in',  partnerId: 'TP001', ref: 'EDI-850-0088',    status: 'received', ack: '997 Accepted' },
  { id: 'TXN-014', ts: '2026-05-24 16:00', type: '810', dir: 'out', partnerId: 'TP003', ref: 'EDI-810-0080',    status: 'sent',     ack: null           },
  { id: 'TXN-015', ts: '2026-05-23 14:05', type: '850', dir: 'in',  partnerId: 'TP003', ref: 'EDI-850-0085',    status: 'received', ack: '997 Accepted' },
  { id: 'TXN-016', ts: '2026-05-23 16:05', type: '810', dir: 'out', partnerId: 'TP001', ref: 'INV-507',         status: 'sent',     ack: '997 Accepted' },
  { id: 'TXN-017', ts: '2026-05-23 15:30', type: '856', dir: 'out', partnerId: 'TP001', ref: 'SO-9888',         status: 'sent',     ack: '997 Accepted' },
  { id: 'TXN-018', ts: '2026-05-22 10:30', type: '850', dir: 'in',  partnerId: 'TP004', ref: 'EDI-850-0086',    status: 'received', ack: '997 Accepted' },
  { id: 'TXN-019', ts: '2026-05-21 14:20', type: '214', dir: 'out', partnerId: 'TP001', ref: 'SO-9885',         status: 'sent',     ack: null           },
  { id: 'TXN-020', ts: '2026-05-21 11:00', type: '850', dir: 'in',  partnerId: 'TP001', ref: 'SC-PO-229801',    status: 'received', ack: '997 Accepted' },
];

// ── Helper ────────────────────────────────────────────────────────────────────
let soCounter = 9910;
const nextSo = () => `SO-${++soCounter}`;

// ── Main Component ────────────────────────────────────────────────────────────
export default function EDIModule() {
  const { can, showToast } = useKernal();
  const access = can('edi');

  const [tab, setTab]             = useState('dashboard');
  const [pos850, setPos850]       = useState(DEMO_MODE ? INIT_850 : []);
  const [outbound, setOutbound]   = useState(DEMO_MODE ? INIT_OUTBOUND : []);
  const [partners]                = useState(DEMO_MODE ? INIT_PARTNERS : []);
  const [txnLog, setTxnLog]       = useState(DEMO_MODE ? INIT_LOG : []);
  const [selected850, setSelected850] = useState(null);
  const [logDirFilter, setLogDirFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [outboundTypeFilter, setOutboundTypeFilter] = useState('all');
  const [expandedPartner, setExpandedPartner] = useState(null);
  const [inboundFilter, setInboundFilter] = useState('all');

  const partnerName = useCallback(id => {
    const p = INIT_PARTNERS.find(x => x.id === id);
    return p ? p.name : id;
  }, []);

  // Map 850 to Kernel order
  const handleMapToOrder = useCallback((poId) => {
    const soNum = nextSo();
    setPos850(prev => prev.map(p => p.id !== poId ? p : { ...p, status: 'processed', kernalSo: soNum }));
    const po = pos850.find(p => p.id === poId);
    setTxnLog(prev => [{
      id: `TXN-NEW-${Date.now()}`, ts: new Date().toISOString().slice(0,16).replace('T',' '),
      type: '850', dir: 'in', partnerId: po?.partnerId || '', ref: poId, status: 'received', ack: '997 Accepted'
    }, ...prev]);
    showToast(`${poId} mapped → ${soNum} created`);
  }, [pos850, showToast]);

  // Fix error on 850
  const handleFix850 = useCallback((poId) => {
    setPos850(prev => prev.map(p => p.id !== poId ? p : {
      ...p, status: 'pending_map', errorMsg: undefined,
      lines: p.lines.map(l => l.ourSku ? l : { ...l, ourSku: 'DRY-OIL-5G', mapped: true })
    }));
    showToast('Item mapped to DRY-OIL-5G — ready to create order');
  }, [showToast]);

  // Send outbound document
  const handleSend = useCallback((docId) => {
    setOutbound(prev => prev.map(d => d.id !== docId ? d : { ...d, status: 'sent' }));
    const doc = outbound.find(d => d.id === docId);
    setTxnLog(prev => [{
      id: `TXN-NEW-${Date.now()}`, ts: new Date().toISOString().slice(0,16).replace('T',' '),
      type: doc?.type || '???', dir: 'out', partnerId: doc?.partnerId || '', ref: docId, status: 'sent', ack: null
    }, ...prev]);
    showToast(`${docId} transmitted to ${partnerName(doc?.partnerId)}`);
  }, [outbound, showToast, partnerName]);

  // Retry errored outbound
  const handleRetry = useCallback((docId) => {
    setOutbound(prev => prev.map(d => d.id !== docId ? d : { ...d, status: 'ready', errorMsg: undefined }));
    showToast(`${docId} queued for retransmission`);
  }, [showToast]);

  // Send all ready outbound
  const handleSendAll = useCallback(() => {
    const readyIds = outbound.filter(d => d.status === 'ready').map(d => d.id);
    if (!readyIds.length) { showToast('No documents in ready queue'); return; }
    setOutbound(prev => prev.map(d => d.status === 'ready' ? { ...d, status: 'sent' } : d));
    const now = new Date().toISOString().slice(0,16).replace('T',' ');
    const newEntries = readyIds.map((id, i) => {
      const doc = outbound.find(d => d.id === id);
      return { id: `TXN-BULK-${Date.now()}-${i}`, ts: now, type: doc?.type || '?', dir: 'out', partnerId: doc?.partnerId || '', ref: id, status: 'sent', ack: null };
    });
    setTxnLog(prev => [...newEntries, ...prev]);
    showToast(`${readyIds.length} document${readyIds.length !== 1 ? 's' : ''} transmitted`);
  }, [outbound, showToast]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = {
    todayTxns:    txnLog.filter(t => t.ts.startsWith('2026-05-26')).length,
    pendingIn:    pos850.filter(p => p.status === 'pending_map').length,
    pendingOut:   outbound.filter(d => d.status === 'ready').length,
    errors:       pos850.filter(p => p.status === 'error').length + outbound.filter(d => d.status === 'error').length,
    activePartners: partners.filter(p => p.status === 'active').length,
  };

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filtered850 = inboundFilter === 'all' ? pos850
    : pos850.filter(p => p.status === inboundFilter);

  const filteredOut = outbound
    .filter(d => outboundTypeFilter === 'all' || d.type === outboundTypeFilter);

  const filteredLog = txnLog
    .filter(t => logDirFilter  === 'all' || t.dir  === logDirFilter)
    .filter(t => logTypeFilter === 'all' || t.type === logTypeFilter);

  // ── Tabs config ────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inbound',   label: `Inbound 850 (${pos850.filter(p => p.status === 'pending_map').length} pending)` },
    { id: 'outbound',  label: `Outbound Queue (${outbound.filter(d => d.status === 'ready').length} ready)` },
    { id: 'log',       label: 'Transaction Log' },
    { id: 'partners',  label: 'Trading Partners' },
  ];

  // ── Status badge ───────────────────────────────────────────────────────────
  function StatusPill({ status }) {
    const map = {
      pending_map: { label: 'Pending Map',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
      processed:   { label: 'Processed',    cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
      error:       { label: 'Error',        cls: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
      ready:       { label: 'Ready',        cls: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
      sent:        { label: 'Sent',         cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
      queued:      { label: 'Queued',       cls: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
      received:    { label: 'Received',     cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    };
    const s = map[status] || { label: status, cls: 'bg-zinc-500/10 text-zinc-400' };
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Dashboard
  // ────────────────────────────────────────────────────────────────────────────
  function renderDashboard() {
    return (
      <div className="space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Today\'s Transactions', value: kpis.todayTxns,       color: 'text-cyan-400'    },
            { label: 'Pending Inbound (850)', value: kpis.pendingIn,        color: 'text-amber-400'   },
            { label: 'Outbound Ready',         value: kpis.pendingOut,      color: 'text-violet-400'  },
            { label: 'Active Errors',          value: kpis.errors,          color: kpis.errors > 0 ? 'text-rose-400' : 'text-emerald-400' },
            { label: 'Active Partners',        value: kpis.activePartners,  color: 'text-emerald-400' },
          ].map(k => (
            <div key={k.label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
              <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
              <div className="text-xs text-gray-400 mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Partner health */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Partner Health</div>
            <div className="space-y-3">
              {partners.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'active' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-200 truncate">{p.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.pendingIn > 0  && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">{p.pendingIn} in</span>}
                        {p.pendingOut > 0 && <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded font-medium">{p.pendingOut} out</span>}
                        {p.errors > 0     && <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-medium">{p.errors} err</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{p.connection}</span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-xs text-gray-500">{p.docTypes.join(' · ')}</span>
                      {p.testMode && <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0 rounded font-medium">TEST</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Recent Activity</div>
            <div className="space-y-2">
              {txnLog.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 ${t.dir === 'in' ? 'text-cyan-400' : 'text-violet-400'}`}>
                    {t.dir === 'in' ? <ArrowDown size={13}/> : <ArrowUp size={13}/>}
                  </div>
                  <DocChip type={t.type} />
                  <span className="text-xs text-gray-400 truncate flex-1">{partnerName(t.partnerId)}</span>
                  <span className="text-xs font-mono text-gray-500 flex-shrink-0">{t.ts.slice(11)}</span>
                  {t.status === 'error'  && <AlertCircle size={13} className="text-rose-400 flex-shrink-0"/>}
                  {t.status === 'sent'   && <CheckCircle  size={13} className="text-emerald-400 flex-shrink-0"/>}
                  {t.status === 'queued' && <Clock        size={13} className="text-violet-400 flex-shrink-0"/>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System status */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">System Status</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'AS2 Gateway',      ok: true,  detail: 'Connected · TLS 1.3' },
              { label: 'FTP/SFTP Server',  ok: true,  detail: 'Connected · Port 22' },
              { label: 'ISA Interchange',  ok: true,  detail: 'ISA ID: KERNAL-ERP-01' },
              { label: 'GS Group Control', ok: true,  detail: 'Seq: 00084 · Active' },
            ].map(s => (
              <div key={s.label} className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex-shrink-0 ${s.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {s.ok ? <Wifi size={15}/> : <WifiOff size={15}/>}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-200">{s.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Inbound 850s
  // ────────────────────────────────────────────────────────────────────────────
  function renderInbound() {
    return (
      <div className="flex gap-4 h-full min-h-0" style={{ minHeight: 520 }}>
        {/* Left: PO list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          {/* Filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { v: 'all',         label: 'All' },
              { v: 'pending_map', label: 'Pending' },
              { v: 'processed',   label: 'Done' },
              { v: 'error',       label: 'Error' },
            ].map(f => (
              <button key={f.v} onClick={() => setInboundFilter(f.v)}
                className={`text-xs px-3 py-1 rounded-full font-semibold border transition-colors ${
                  inboundFilter === f.v
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto">
            {filtered850.map(po => (
              <button key={po.id} onClick={() => setSelected850(po.id === selected850 ? null : po.id)}
                className={`text-left p-3 rounded-xl border transition-colors ${
                  selected850 === po.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-gray-800/60 border-gray-700 hover:border-gray-600'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-gray-300">{po.id}</span>
                  <StatusPill status={po.status} />
                </div>
                <div className="text-xs text-gray-400 truncate">{partnerName(po.partnerId)}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-500">{po.lines.length} lines</span>
                  <span className="text-xs font-bold text-gray-300">{fmtMoney(po.total)}</span>
                </div>
                <div className="text-xs text-gray-600 mt-0.5">Rcvd {po.received}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: PO detail */}
        <div className="flex-1 min-w-0">
          {!selected850 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
              <FileText size={32} />
              <span className="text-sm">Select a purchase order to review</span>
            </div>
          ) : (() => {
            const po = pos850.find(p => p.id === selected850);
            if (!po) return null;
            return (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black text-gray-100">{po.id}</span>
                      <StatusPill status={po.status} />
                    </div>
                    <div className="text-sm text-gray-400">Partner PO: <span className="font-mono text-gray-300">{po.partnerRef}</span></div>
                    <div className="text-sm text-gray-500 mt-0.5">{partnerName(po.partnerId)}</div>
                  </div>
                  {po.status === 'pending_map' && (
                    <button onClick={() => handleMapToOrder(po.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                      <Link2 size={14}/> Map to Order
                    </button>
                  )}
                  {po.status === 'error' && (
                    <button onClick={() => handleFix850(po.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-bold px-4 py-2 rounded-lg border border-amber-500/30 transition-colors">
                      <RefreshCw size={14}/> Fix &amp; Map
                    </button>
                  )}
                  {po.status === 'processed' && (
                    <div className="flex-shrink-0 flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                      <CheckCircle size={15}/> Kernel {po.kernalSo}
                    </div>
                  )}
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Received',      value: po.received },
                    { label: 'Requested Del', value: po.deliveryDate },
                    { label: 'Ship To',       value: po.shipTo },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-0.5">{m.label}</div>
                      <div className="text-xs font-semibold text-gray-300">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Error banner */}
                {po.status === 'error' && (
                  <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                    <AlertTriangle size={15} className="text-rose-400 flex-shrink-0 mt-0.5"/>
                    <p className="text-xs text-rose-300">{po.errorMsg}</p>
                  </div>
                )}

                {/* Line items */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Line Items</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {['#', 'Partner Item#', 'Kernel SKU', 'Description', 'Qty', 'UoM', 'Unit Price', 'Total'].map(h => (
                          <th key={h} className="text-left text-gray-500 font-semibold pb-2 pr-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {po.lines.map(l => (
                        <tr key={l.seq} className="border-b border-gray-800">
                          <td className="py-2 pr-3 text-gray-500">{l.seq}</td>
                          <td className="py-2 pr-3 font-mono text-gray-300">{l.partnerItem}</td>
                          <td className="py-2 pr-3">
                            {l.mapped
                              ? <span className="font-mono text-cyan-400">{l.ourSku}</span>
                              : <span className="text-rose-400 font-semibold">⚠ Not mapped</span>}
                          </td>
                          <td className="py-2 pr-3 text-gray-300">{l.desc}</td>
                          <td className="py-2 pr-3 text-gray-300 text-right">{l.qty}</td>
                          <td className="py-2 pr-3 text-gray-400">{l.uom}</td>
                          <td className="py-2 pr-3 text-gray-300 text-right">{fmtMoney(l.unitPrice)}</td>
                          <td className="py-2 text-gray-200 font-semibold text-right">{fmtMoney(l.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={7} className="pt-3 text-right font-bold text-gray-400">Total</td>
                        <td className="pt-3 text-right font-black text-gray-100">{fmtMoney(po.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Outbound Queue
  // ────────────────────────────────────────────────────────────────────────────
  function renderOutbound() {
    const readyCount = filteredOut.filter(d => d.status === 'ready').length;
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {[
              { v: 'all', label: 'All' },
              { v: '856', label: '856 ASN' },
              { v: '810', label: '810 Invoice' },
              { v: '214', label: '214 Status' },
            ].map(f => (
              <button key={f.v} onClick={() => setOutboundTypeFilter(f.v)}
                className={`text-xs px-3 py-1 rounded-full font-semibold border transition-colors ${
                  outboundTypeFilter === f.v
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1"/>
          {readyCount > 0 && (
            <button onClick={handleSendAll}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold px-4 py-1.5 rounded-lg transition-colors">
              <Send size={13}/> Send All Ready ({readyCount})
            </button>
          )}
        </div>

        {/* Outbound list */}
        <div className="space-y-2">
          {filteredOut.map(doc => (
            <div key={doc.id} className={`bg-gray-800/60 border rounded-xl p-4 ${
              doc.status === 'error' ? 'border-rose-500/30' : 'border-gray-700'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  <DocChip type={doc.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-sm font-bold text-gray-200">{doc.id}</span>
                    <StatusPill status={doc.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <span className="font-semibold text-gray-300">{partnerName(doc.partnerId)}</span>
                    <span className="text-gray-600">·</span>
                    <span>Kernel ref: <span className="font-mono text-gray-300">{doc.ref}</span></span>
                    <span className="text-gray-600">·</span>
                    <span>Partner PO: <span className="font-mono text-gray-300">{doc.partnerPo}</span></span>
                  </div>
                  {/* Detail by type */}
                  {doc.type === '856' && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                      <span><Truck size={11} className="inline mr-1"/>{doc.detail.carrier}</span>
                      <span>PRO: <span className="font-mono">{doc.detail.proNum}</span></span>
                      <span>{doc.detail.lines} lines · {fmtMoney(doc.detail.total)}</span>
                    </div>
                  )}
                  {doc.type === '810' && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                      <span><DollarSign size={11} className="inline"/>{fmtMoney(doc.detail.total)}</span>
                      <span>Inv date: {doc.detail.invoiceDate}</span>
                      <span>Due: {doc.detail.dueDate}</span>
                    </div>
                  )}
                  {doc.type === '214' && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                      <span>Status code: <span className="font-mono font-bold text-gray-300">{doc.detail.event}</span></span>
                      <span className="text-gray-300">{doc.detail.eventDesc}</span>
                      <span>{doc.detail.location}</span>
                    </div>
                  )}
                  {doc.status === 'error' && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-300">
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5"/>
                      <span>{doc.errorMsg}</span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-600">{doc.created.slice(11)}</span>
                  {doc.status === 'ready' && (
                    <button onClick={() => handleSend(doc.id)}
                      className="flex items-center gap-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-cyan-500/25 transition-colors">
                      <Send size={11}/> Send
                    </button>
                  )}
                  {doc.status === 'error' && (
                    <button onClick={() => handleRetry(doc.id)}
                      className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/25 transition-colors">
                      <RefreshCw size={11}/> Retry
                    </button>
                  )}
                  {doc.status === 'sent' && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      <CheckCircle size={13}/> Sent
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Transaction Log
  // ────────────────────────────────────────────────────────────────────────────
  function renderLog() {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-semibold">Direction:</span>
            {[{ v:'all', l:'All'}, {v:'in', l:'Inbound'}, {v:'out', l:'Outbound'}].map(f => (
              <button key={f.v} onClick={() => setLogDirFilter(f.v)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                  logDirFilter === f.v ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {f.l}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-semibold">Type:</span>
            {['all','850','856','810','214','997'].map(f => (
              <button key={f} onClick={() => setLogTypeFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                  logTypeFilter === f ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 ml-auto">{filteredLog.length} transactions</div>
        </div>

        {/* Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/50">
                {['Date / Time','Type','Dir','Partner','Reference','Status','Ack / 997'].map(h => (
                  <th key={h} className="text-left text-gray-500 font-semibold px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLog.map(t => (
                <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-gray-400">{t.ts}</td>
                  <td className="px-4 py-2.5"><DocChip type={t.type} /></td>
                  <td className="px-4 py-2.5">
                    <span className={`flex items-center gap-1 font-semibold ${t.dir === 'in' ? 'text-cyan-400' : 'text-violet-400'}`}>
                      {t.dir === 'in' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
                      {t.dir === 'in' ? 'IN' : 'OUT'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-300">{partnerName(t.partnerId)}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-400">{t.ref}</td>
                  <td className="px-4 py-2.5"><StatusPill status={t.status} /></td>
                  <td className="px-4 py-2.5">
                    {t.ack ? (
                      <span className={`text-xs font-semibold ${t.ack.includes('Reject') ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {t.ack}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Trading Partners
  // ────────────────────────────────────────────────────────────────────────────
  function renderPartners() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">{partners.filter(p => p.status === 'active').length} active · {partners.length} total</div>
          {access === 'full' && (
            <button className="flex items-center gap-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-cyan-500/25 transition-colors">
              <Plus size={12}/> Add Partner
            </button>
          )}
        </div>

        <div className="space-y-3">
          {partners.map(p => (
            <div key={p.id} className={`bg-gray-800/60 border rounded-xl overflow-hidden transition-colors ${
              p.errors > 0 ? 'border-rose-500/30' : 'border-gray-700'}`}>
              {/* Partner header row */}
              <button className="w-full text-left p-4"
                onClick={() => setExpandedPartner(expandedPartner === p.id ? null : p.id)}>
                <div className="flex items-center gap-4">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.status === 'active' ? 'bg-emerald-400' : 'bg-gray-600'}`}/>
                  {/* Name + ID */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-100">{p.name}</span>
                      {p.testMode && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0 rounded font-semibold">TEST MODE</span>}
                      {p.status === 'inactive' && <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0 rounded font-semibold">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500 font-mono">ISA: {p.isaId}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500 font-mono">DUNS: {p.duns}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{p.connection}</span>
                    </div>
                  </div>
                  {/* Doc types */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {p.docTypes.map(dt => <DocChip key={dt} type={dt} />)}
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {p.pendingIn  > 0 && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">{p.pendingIn} in</span>}
                    {p.pendingOut > 0 && <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-semibold">{p.pendingOut} out</span>}
                    {p.errors     > 0 && <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-semibold">{p.errors} err</span>}
                  </div>
                  {expandedPartner === p.id ? <ChevronDown size={15} className="text-gray-500 flex-shrink-0"/> : <ChevronRight size={15} className="text-gray-500 flex-shrink-0"/>}
                </div>
              </button>

              {/* Expanded detail */}
              {expandedPartner === p.id && (
                <div className="border-t border-gray-700 bg-gray-900/40 p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    {[
                      { label: 'Connection Type',   value: p.connection },
                      { label: 'ISA Qualifier',      value: p.qualifier },
                      { label: 'Last Activity',      value: p.lastActivity },
                      { label: 'Functional Ack (997)', value: p.ackRequired ? 'Required' : 'Not Required' },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="text-xs text-gray-500 mb-1">{f.label}</div>
                        <div className="text-sm font-semibold text-gray-200">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Enabled Document Types</div>
                    <div className="flex gap-2">
                      {['850','856','810','214','997'].map(dt => (
                        <div key={dt} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold ${
                          p.docTypes.includes(dt)
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-gray-800 text-gray-600 border-gray-700'}`}>
                          {p.docTypes.includes(dt) ? <CheckCircle size={11}/> : <XCircle size={11}/>}
                          {dt}
                        </div>
                      ))}
                    </div>
                  </div>
                  {access === 'full' && (
                    <div className="flex gap-2">
                      <button className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold px-3 py-1.5 rounded-lg transition-colors">Edit Configuration</button>
                      <button className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold px-3 py-1.5 rounded-lg transition-colors">Send Test Transaction</button>
                      <button className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold px-3 py-1.5 rounded-lg transition-colors">View Item Map</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Root render ─────────────────────────────────────────────────────────────
  if (access === 'none') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-500">
        <XCircle size={28}/>
        <p className="text-sm">You don't have permission to access EDI Integration.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-100 flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-cyan-400"/> EDI Integration
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            850 Purchase Orders · 856 Advance Ship Notices · 810 Invoices · 214 Shipment Status
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <Wifi size={13}/> AS2 Online
        </div>
      </div>

      {/* Tab bar */}
      <div id="kernal-module-tabs" className="flex gap-1 border-b border-gray-700 -mb-2 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'inbound'   && renderInbound()}
        {tab === 'outbound'  && renderOutbound()}
        {tab === 'log'       && renderLog()}
        {tab === 'partners'  && renderPartners()}
      </div>
    </div>
  );
}
