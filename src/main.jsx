import { StrictMode, useState, Suspense, Component, useMemo, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';

import { KernalProvider, useKernal, ROLES, LOCATIONS, PLANS, ADDONS } from './KernalContext.jsx';
import { captureError, addBreadcrumb, setAppContext, initGlobalHandlers } from './ErrorReporter.js';

// ── Sentry ────────────────────────────────────────────────────────────────────
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    // Don't send errors in development unless DSN is explicitly set
    enabled: !!import.meta.env.VITE_SENTRY_DSN,
  });
}
// MOCK_INVENTORY import removed — GlobalSearch uses live API data

import SuperAdminModule         from './SuperAdminModule.jsx';
import InventoryModule          from './InventoryModule.jsx';
import LogisticsModule          from './LogisticsModule.jsx';
import ProcurementModule        from './ProcurementModule.jsx';
import B2BPortalModule          from './B2BPortalModule.jsx';
import FieldSalesPortal         from './FieldSalesPortal.jsx';
import ERMCustomerSuccessModule from './ERMCustomerSuccessModule.jsx';
import AccountingModule         from './AccountingModule.jsx';
import WarehouseModule          from './WarehouseModule.jsx';
import ApprovalsModule          from './ApprovalsModule.jsx';
import LossPreventionModule     from './LossPreventionModule.jsx';
import SettingsModule           from './SettingsModule.jsx';
import UserManagementModule     from './UserManagementModule.jsx';
import IntegrationsModule       from './IntegrationsModule.jsx';
import GLModule                 from './GLModule.jsx';
import DemandPlanningModule     from './DemandPlanningModule.jsx';
import GPSDispatchModule        from './GPSDispatchModule.jsx';
import CustomReportModule       from './CustomReportModule.jsx';
import EDIModule                from './EDIModule.jsx';
import PricingModule            from './PricingModule.jsx';
import DeveloperAPIModule       from './DeveloperAPIModule.jsx';
import EcommerceModule          from './EcommerceModule.jsx';
import LandedCostModule         from './LandedCostModule.jsx';
import MobileWMSModule          from './MobileWMSModule.jsx';
import NLQueryModule            from './NLQueryModule.jsx';
// AutofixStatusModal removed — autofix feature disabled

import {
  Package, Truck, ShoppingCart, Building2, MapPin, Contact2, DollarSign,
  Layers, Inbox, Settings as SettingsIcon, Users as UsersIcon,
  ChevronsLeft, ChevronsRight, Menu, X, Plus, FileText, UserPlus, ShieldAlert,
  Search, ChevronRight, Clock, Link2, BookOpen, TrendingUp, Navigation, BarChart3, ArrowLeftRight,
  Tag, Code2, ShoppingBag, Anchor, Smartphone, Sparkles, HelpCircle,
} from 'lucide-react';

import OnboardingTour, { TOURS, tourStorage } from './OnboardingTour.jsx';

// STATIC_SEARCH_RECORDS removed — GlobalSearch now uses live apiCustomers, apiOrders, apiInventory, apiProducts

// Type display metadata — icon + color palette per record type
const TYPE_META = {
  customer: { label:'Customer', color:'text-cyan-400',    bg:'bg-cyan-500/15',    Icon: Contact2    },
  invoice:  { label:'Invoice',  color:'text-emerald-400', bg:'bg-emerald-500/15', Icon: FileText    },
  order:    { label:'Order',    color:'text-violet-400',  bg:'bg-violet-500/15',  Icon: Truck       },
  sku:      { label:'SKU',      color:'text-amber-400',   bg:'bg-amber-500/15',   Icon: Package     },
  po:       { label:'PO',       color:'text-blue-400',    bg:'bg-blue-500/15',    Icon: ShoppingCart },
  vendor:   { label:'Vendor',   color:'text-orange-400',  bg:'bg-orange-500/15',  Icon: Building2   },
  user:     { label:'User',     color:'text-gray-400',    bg:'bg-gray-700/60',    Icon: UsersIcon   },
  approval: { label:'Approval', color:'text-rose-400',    bg:'bg-rose-500/15',    Icon: Inbox       },
};

const MODULE_LABELS = {
  inventory:'Inventory', warehouse:'Warehouse', logistics:'Delivery Operations', gps:'Fleet Intelligence',
  crm:'CRM', b2b:'B2B Portal', field:'Field Sales',
  procurement:'Procurement', accounting:'Accounting',
  approvals:'Approvals', lossPrevention:'Compliance & Risk',
  settings:'Settings', users:'Users', integrations:'Integrations', gl:'General Ledger', demand:'Demand Planning',
  reports:'Report Builder',
  edi:'EDI Integration',
  developer:'Developer API',
  ecommerce:'eCommerce',
  landedcost:'Landed Cost',
  mobilewms:'Mobile WMS',
  nlquery:'Ask Kernel',
};

// ── Global Search component ────────────────────────────────────────────────────
function GlobalSearch({ isDark, onNavigate, onClose, recentSearches, onAddRecent }) {
  const { users, approvalRequests, apiCustomers, apiOrders, apiInventory, apiProducts,
          apiVendors, apiPurchaseOrders, apiInvoices } = useKernal();
  const [query, setQuery]   = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 30); }, []);

  // Build full live index from real API data — no mock/static records
  const allRecords = useMemo(() => {
    // ── Customers (from CRM) ───────────────────────────────────────────────────
    const customerRecords = (apiCustomers || []).map(c => ({
      id:       c.id,
      type:     'customer',
      title:    c.name,
      sub:      [c.address, c.city, c.payment_terms].filter(Boolean).join(' · '),
      module:   'crm',
      keywords: [c.id, c.name, c.email || '', c.phone || '', c.city || '', c.address || ''],
    }));

    // ── Orders (from Field Sales / any module) ─────────────────────────────────
    const orderRecords = (apiOrders || []).map(o => ({
      id:       o.order_number || o.id,
      type:     'order',
      title:    `${o.order_number || o.id} · ${o.customers?.name || 'Unknown Customer'}`,
      sub:      `${o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : ''} · ${o.total_amount != null ? `$${Number(o.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}`,
      module:   'field',
      keywords: [o.order_number || '', o.id, o.customers?.name || '', o.status || ''],
    }));

    // ── SKUs — prefer inventory rows (have stock data), fill in from products ──
    const invProductIds = new Set((apiInventory || []).map(r => r.product_id));
    const skuRecords = [
      ...(apiInventory || []).map(r => ({
        id:       r.products?.sku || r.product_id,
        type:     'sku',
        title:    r.products?.name || r.product_id,
        sub:      `${r.products?.sku || ''} · ${r.products?.unit_of_measure || ''} · ${Math.max(0, Number(r.quantity_on_hand) - Number(r.quantity_reserved))} avail`,
        module:   'inventory',
        keywords: [r.products?.sku || '', r.products?.name || '', r.products?.category || '', r.location_id || ''],
      })),
      // Products that don't have an inventory row yet
      ...(apiProducts || []).filter(p => !invProductIds.has(p.id)).map(p => ({
        id:       p.sku,
        type:     'sku',
        title:    p.name,
        sub:      `${p.sku} · ${p.unit_of_measure || ''} · 0 avail`,
        module:   'inventory',
        keywords: [p.sku, p.name, p.category || ''],
      })),
    ];

    // ── Vendors ───────────────────────────────────────────────────────────────
    const vendorRecords = (apiVendors || []).map(v => ({
      id:       v.id,
      type:     'vendor',
      title:    v.name,
      sub:      [v.category, v.contact_name, v.payment_terms].filter(Boolean).join(' · '),
      module:   'procurement',
      keywords: [v.id, v.name, v.category || '', v.contact_name || '', v.email || '', v.phone || ''],
    }));

    // ── Purchase Orders ───────────────────────────────────────────────────────
    const poRecords = (apiPurchaseOrders || []).map(po => ({
      id:       po.po_number || po.id,
      type:     'po',
      title:    `${po.po_number || po.id} · ${po.vendor_name || 'Unknown Vendor'}`,
      sub:      `${po.status || ''} · ${po.total != null ? `$${Number(po.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}`,
      module:   'procurement',
      keywords: [po.po_number || '', po.id, po.vendor_name || '', po.status || ''],
    }));

    // ── Invoices ──────────────────────────────────────────────────────────────
    const invoiceRecords = (apiInvoices || []).map(inv => ({
      id:       inv.invoice_number || inv.id,
      type:     'invoice',
      title:    `${inv.invoice_number || inv.id} · ${inv.customer_name || 'Unknown Customer'}`,
      sub:      `${inv.status || ''} · ${inv.total != null ? `$${Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}`,
      module:   'accounting',
      keywords: [inv.invoice_number || '', inv.id, inv.customer_name || '', inv.status || ''],
    }));

    // ── Users ─────────────────────────────────────────────────────────────────
    const userRecords = (users || []).map(u => ({
      id:       u.id,
      type:     'user',
      title:    u.name,
      sub:      `${ROLES[u.role]?.label || u.role} · ${u.active ? 'Active' : 'Inactive'}`,
      module:   'users',
      keywords: [u.id, u.name, u.role, u.email || ''],
    }));

    // ── Approvals ─────────────────────────────────────────────────────────────
    const approvalRecords = (approvalRequests || []).map(r => ({
      id:       r.id,
      type:     'approval',
      title:    r.title,
      sub:      `${r.flowType?.replace(/_/g,' ')} · ${r.status}`,
      module:   'approvals',
      keywords: [r.id, r.title, r.flowType || '', r.status || ''],
    }));

    return [
      ...customerRecords, ...orderRecords, ...skuRecords,
      ...vendorRecords, ...poRecords, ...invoiceRecords,
      ...userRecords, ...approvalRecords,
    ];
  }, [apiCustomers, apiOrders, apiInventory, apiProducts,
      apiVendors, apiPurchaseOrders, apiInvoices,
      users, approvalRequests]);

  // Score + filter
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/).filter(Boolean);
    return allRecords.map(rec => {
      const haystack = [rec.id, rec.title, rec.sub, ...(rec.keywords || [])].join(' ').toLowerCase();
      let score = 0;
      if (rec.id.toLowerCase() === q)                  score += 200;
      else if (rec.id.toLowerCase().startsWith(q))     score += 150;
      if (rec.title.toLowerCase() === q)               score += 100;
      else if (rec.title.toLowerCase().startsWith(q))  score +=  80;
      else if (rec.title.toLowerCase().includes(q))    score +=  50;
      words.forEach(w => { if (haystack.includes(w)) score += 10; });
      return score > 0 ? { ...rec, score } : null;
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 28);
  }, [query, allRecords]);

  useEffect(() => { setCursor(0); }, [results]);

  const doNavigate = useCallback((rec) => {
    if (query.trim()) onAddRecent(query.trim());
    onNavigate(rec.module);
    onClose();
  }, [query, onNavigate, onClose, onAddRecent]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape')    { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && results[cursor]) doNavigate(results[cursor]);
  }, [results, cursor, doNavigate, onClose]);

  // Grouped display (type order matters)
  const TYPE_ORDER = ['customer','invoice','order','sku','po','vendor','user','approval'];
  const grouped = TYPE_ORDER
    .map(type => ({ type, items: results.filter(r => r.type === type) }))
    .filter(g => g.items.length > 0);

  // Style tokens
  const panelCls    = isDark ? 'bg-gray-900 border-gray-700/80' : 'bg-white border-slate-200';
  const dividerCls  = isDark ? 'border-gray-800' : 'border-slate-100';
  const inputCls    = isDark ? 'text-gray-100 placeholder-gray-600' : 'text-gray-900 placeholder-gray-400';
  const rowHover    = isDark ? 'hover:bg-gray-800/60' : 'hover:bg-slate-50';
  const rowActive   = isDark ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : 'bg-cyan-50 border-l-2 border-cyan-500';
  const sectionCls  = isDark ? 'text-gray-600' : 'text-gray-400';
  const subCls      = isDark ? 'text-gray-500' : 'text-gray-400';
  const kbdCls      = isDark ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200';

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden ${panelCls}`} style={{ maxHeight:'72vh' }}>

        {/* Search input */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${dividerCls}`}>
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search customers, orders, invoices, SKUs, vendors…"
            className={`flex-1 bg-transparent text-base outline-none ${inputCls}`}
          />
          {query
            ? <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"><X className="w-4 h-4"/></button>
            : <kbd className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded border ${kbdCls}`}>Esc</kbd>
          }
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight:'calc(72vh - 108px)' }}>

          {/* Empty state — quick access + recents */}
          {!query && (
            <div className="px-4 py-4 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${sectionCls}`}>Recent</p>
                  {recentSearches.slice(0, 4).map(s => (
                    <button key={s} onClick={() => setQuery(s)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${rowHover}`}>
                      <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{s}</span>
                    </button>
                  ))}
                </div>
              )}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${sectionCls}`}>Quick Access</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:'Inventory',   Icon:Package,      module:'inventory',   sub:'SKUs, lots, stock levels'  },
                    { label:'CRM',         Icon:Contact2,     module:'crm',         sub:'Customers & accounts'      },
                    { label:'Accounting',  Icon:DollarSign,   module:'accounting',  sub:'Invoices, GL, AP/AR'       },
                    { label:'Procurement', Icon:ShoppingCart, module:'procurement', sub:'POs, vendors, receiving'   },
                    { label:'Approvals',   Icon:Inbox,        module:'approvals',   sub:'Pending decisions'         },
                    { label:'Field Sales', Icon:MapPin,       module:'field',       sub:'Accounts, orders, leads'   },
                  ].map(({ label, Icon, module, sub }) => (
                    <button key={module} onClick={() => { onNavigate(module); onClose(); }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors border ${isDark ? 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <Icon className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
                        <p className={`text-[10px] truncate ${subCls}`}>{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No results */}
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
              <Search className="w-8 h-8 text-gray-700" />
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No results for &ldquo;{query}&rdquo;</p>
              <p className={`text-xs ${subCls}`}>Try an order ID (SO-9891), customer name, SKU code, or invoice number</p>
            </div>
          )}

          {/* Grouped results */}
          {query && results.length > 0 && (
            <div className="py-1">
              {grouped.map(group => {
                const meta = TYPE_META[group.type] || { label: group.type, color:'text-gray-400', bg:'bg-gray-700', Icon:Search };
                const RecIcon = meta.Icon;
                return (
                  <div key={group.type}>
                    <p className={`px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest ${sectionCls}`}>
                      {meta.label}s <span className="font-normal opacity-50">{group.items.length}</span>
                    </p>
                    {group.items.map(rec => {
                      const flatIdx = results.indexOf(rec);
                      const isActive = flatIdx === cursor;
                      return (
                        <button
                          key={rec.id}
                          onClick={() => doNavigate(rec)}
                          onMouseEnter={() => setCursor(flatIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isActive ? rowActive : rowHover}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                            <RecIcon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{rec.title}</p>
                            <p className={`text-xs truncate ${subCls}`}>{rec.sub}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                              {MODULE_LABELS[rec.module] || rec.module}
                            </span>
                            {isActive && <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t ${dividerCls} px-4 py-2 flex items-center gap-4`}>
          {[['↑↓','navigate'],['↵','open'],['Esc','close']].map(([key, hint]) => (
            <div key={key} className="flex items-center gap-1">
              <kbd className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${kbdCls}`}>{key}</kbd>
              <span className={`text-[10px] ${sectionCls}`}>{hint}</span>
            </div>
          ))}
          {results.length > 0 && (
            <span className={`ml-auto text-[10px] ${sectionCls}`}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// All tabs in render order — visibility gated by permission
const ALL_TABS = [
  { id: 'inventory',   label: 'Inventory',    Icon: Package,      Component: InventoryModule          },
  { id: 'demand',      label: 'Demand Planning', Icon: TrendingUp, Component: DemandPlanningModule     },
  { id: 'warehouse',   label: 'Warehouse',    Icon: Layers,       Component: WarehouseModule          },
  { id: 'logistics',   label: 'Delivery Operations', Icon: Truck,        Component: LogisticsModule          },
  { id: 'gps',         label: 'Fleet Intelligence',  Icon: Navigation,   Component: GPSDispatchModule        },
  { id: 'crm',         label: 'CRM',          Icon: Contact2,     Component: ERMCustomerSuccessModule },
  { id: 'b2b',         label: 'B2B Portal',   Icon: Building2,    Component: B2BPortalModule          },
  { id: 'field',       label: 'Field Sales',  Icon: MapPin,       Component: FieldSalesPortal         },
  { id: 'pricing',     label: 'Pricing Engine', Icon: Tag,        Component: PricingModule            },
  { id: 'procurement', label: 'Procurement',  Icon: ShoppingCart, Component: ProcurementModule        },
  { id: 'accounting',  label: 'Accounting',   Icon: DollarSign,   Component: AccountingModule         },
  { id: 'gl',          label: 'General Ledger', Icon: BookOpen,   Component: GLModule                 },
  { id: 'approvals',      label: 'Approvals',       Icon: Inbox,        Component: ApprovalsModule          },
  { id: 'lossPrevention', label: 'Compliance & Risk', Icon: ShieldAlert,  Component: LossPreventionModule     },
  { id: 'settings',       label: 'Settings',        Icon: SettingsIcon, Component: SettingsModule           },
  { id: 'users',          label: 'Users',           Icon: UsersIcon,    Component: UserManagementModule     },
  { id: 'integrations',   label: 'Integrations',    Icon: Link2,        Component: IntegrationsModule       },
  { id: 'reports',        label: 'Report Builder',  Icon: BarChart3,       Component: CustomReportModule       },
  { id: 'edi',            label: 'EDI Integration', Icon: ArrowLeftRight,  Component: EDIModule                },
  { id: 'developer',     label: 'Developer API',   Icon: Code2,           Component: DeveloperAPIModule       },
  { id: 'ecommerce',    label: 'eCommerce',        Icon: ShoppingBag,     Component: EcommerceModule          },
  { id: 'landedcost',   label: 'Landed Cost',      Icon: Anchor,          Component: LandedCostModule         },
  { id: 'mobilewms',   label: 'Mobile WMS',       Icon: Smartphone,      Component: MobileWMSModule          },
  { id: 'nlquery',     label: 'Ask Kernel',       Icon: Sparkles,        Component: NLQueryModule            },
];

// Sidebar grouping — keep the order of ALL_TABS as the canonical sequence;
// MODULE_GROUPS just adds the visual cluster headers.
const MODULE_GROUPS = [
  { id: 'operations', label: 'Operations', tabIds: ['inventory', 'demand', 'warehouse', 'mobilewms', 'logistics', 'gps'] },
  { id: 'sales',      label: 'Sales',      tabIds: ['crm', 'b2b', 'field', 'pricing'] },
  { id: 'finance',    label: 'Finance',    tabIds: ['procurement', 'landedcost', 'accounting', 'gl', 'approvals'] },
  { id: 'admin',      label: 'Admin',      tabIds: ['lossPrevention', 'settings', 'users'] },
  { id: 'intelligence', label: 'Intelligence', tabIds: ['nlquery', 'reports'] },
  { id: 'platform',   label: 'Platform',   tabIds: ['integrations', 'edi', 'developer', 'ecommerce'] },
];

// ── Theme icons ───────────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}
function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── Location switcher dropdown ────────────────────────────────────────────────
function LocationSwitcher({ isDark }) {
  const { activeLocation, setActiveLocation } = useKernal();
  const [open, setOpen] = useState(false);
  const loc = LOCATIONS.find(l => l.id === activeLocation) || LOCATIONS[0];

  const borderCls   = isDark ? 'border-gray-700/50' : 'border-[#e2e8f0]';
  const dropdownBg  = 'bg-gray-900 border-gray-800';
  const hoverRowCls = 'hover:bg-gray-800 transition-colors';

  return (
    <div id="kernal-location-switcher" className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${borderCls} hover:bg-gray-800/40 transition-colors`}
      >
        <MapPin className={`w-3.5 h-3.5 shrink-0 ${loc.color}`} />
        <span className={`hidden sm:inline text-xs font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{loc.short}</span>
        <ChevronDown />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden z-50 ${dropdownBg}`}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2 border-b border-gray-800">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Warehouse Location</p>
          </div>
          {LOCATIONS.map(l => {
            const isActive = l.id === activeLocation;
            return (
              <button
                key={l.id}
                onClick={() => { setActiveLocation(l.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 ${hoverRowCls} ${isActive ? 'bg-gray-800/70' : ''}`}
              >
                <MapPin className={`w-4 h-4 shrink-0 ${l.color}`} />
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold text-gray-200 truncate">{l.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{l.address}</div>
                </div>
                {isActive && <span className={`text-[10px] font-bold shrink-0 ${l.color}`}>●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── User switcher dropdown ────────────────────────────────────────────────────
function UserSwitcher({ isDark }) {
  const { users, activeUser, setActiveUserId, logout, authUser } = useKernal();
  const [open, setOpen] = useState(false);

  const roleData = ROLES[activeUser?.role] || { label: activeUser?.role, color: 'text-cyan-400', bg: 'bg-cyan-500/15' };
  const initials = activeUser?.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || '??';

  const borderCls = isDark ? 'border-gray-700/50' : 'border-[#e2e8f0]';
  const dropdownBg = 'bg-gray-900 border-gray-800';

  return (
    <div id="kernal-user-switcher" className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border ${borderCls} hover:bg-gray-800/40 transition-colors`}
      >
        {/* Avatar */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${roleData.bg} ${roleData.color}`}>
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-semibold text-gray-100 leading-none">{activeUser?.name}</div>
          <div className={`text-[10px] leading-none mt-0.5 ${roleData.color}`}>{roleData.label}</div>
        </div>
        <ChevronDown />
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden z-50 ${dropdownBg}`}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2 border-b border-gray-800">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Switch User</p>
          </div>
          {users.filter(u => u.active).map(u => {
            const rd = ROLES[u.role] || { label: u.role, color: 'text-gray-400', bg: 'bg-gray-700' };
            const ini = u.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
            const isMe = u.id === activeUser?.id;
            return (
              <button
                key={u.id}
                onClick={() => { setActiveUserId(u.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-800 transition-colors ${isMe ? 'bg-gray-800/60' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${rd.bg} ${rd.color}`}>
                  {ini}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs font-medium text-gray-200">{u.name}</div>
                  <div className={`text-[10px] ${rd.color}`}>{rd.label}</div>
                </div>
                {isMe && <span className="text-[10px] text-cyan-400 font-semibold">●</span>}
              </button>
            );
          })}
          {/* Sign out — only shown when a real Supabase session is active */}
          {authUser && (
            <div className="border-t border-gray-800">
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-800 transition-colors text-rose-400"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="text-xs font-semibold">Sign out</span>
                <span className="text-[10px] text-gray-500 ml-auto truncate max-w-[120px]">{authUser.email}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Access Denied placeholder ─────────────────────────────────────────────────
function AccessDenied({ tabLabel }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
      <div className="text-5xl opacity-30">🔒</div>
      <p className="text-lg font-semibold text-gray-400">{tabLabel}</p>
      <p className="text-sm text-gray-600">You don't have permission to access this module.<br/>Contact your admin to request access.</p>
    </div>
  );
}

// ── Locked Module overlay ─────────────────────────────────────────────────────
// Shown when a module exists but is outside the tenant's current plan/add-ons.
function LockedModule({ tab }) {
  const { settings } = useKernal();
  const currentPlan = settings.plan || 'enterprise';
  const isAddon = ADDONS[tab.id] !== undefined;
  const addonDef = ADDONS[tab.id];

  // Which plan unlocks this module?
  const unlockingPlan = Object.entries(PLANS).find(([, p]) => p.modules.includes(tab.id))?.[0];
  const planDef = unlockingPlan ? PLANS[unlockingPlan] : null;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Lock badge */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-3xl">
            {isAddon ? addonDef.icon : '🔓'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">{tab.label}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isAddon ? 'Available as an add-on' : `Included in ${planDef?.label || 'higher'} plan`}
            </p>
          </div>
        </div>

        {/* Plan/add-on card */}
        <div className={`bg-gray-900 border rounded-xl p-5 space-y-4 ${isAddon ? 'border-teal-500/30' : (planDef?.border || 'border-cyan-500/30')}`}>
          {isAddon ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-100">{addonDef.label} Add-on</span>
                <span className="text-sm font-bold text-teal-400">{addonDef.price}</span>
              </div>
              <p className="text-sm text-gray-400">{addonDef.description}</p>
            </>
          ) : planDef ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planDef.bg} ${planDef.color}`}>{planDef.label}</span>
                  <span className="text-sm font-bold text-gray-100">Plan</span>
                </div>
                <span className={`text-sm font-bold ${planDef.color}`}>{planDef.price}</span>
              </div>
              <p className="text-sm text-gray-400">{planDef.description}</p>
            </>
          ) : null}

          {/* Current plan context */}
          <div className="pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-600">
              Your current plan: <span className={`font-semibold ${PLANS[currentPlan]?.color || 'text-gray-400'}`}>{PLANS[currentPlan]?.label || currentPlan}</span>
            </p>
          </div>

          {/* CTA */}
          <button className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${isAddon ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20' : (planDef?.bg?.replace('/15','/10') || 'bg-cyan-500/10') + ' ' + (planDef?.color || 'text-cyan-400') + ' border ' + (planDef?.border || 'border-cyan-500/20') + ' hover:opacity-80'}`}>
            Contact Kernel to Upgrade ↗
          </button>
        </div>

        <p className="text-xs text-gray-700 text-center mt-4">
          Reach out to your Kernel account manager to enable this module.
        </p>
      </div>
    </div>
  );
}

// ── Quick Create button (sidebar header) ──────────────────────────────────────
// A "+ New" button that opens a popover menu. Each item navigates to the target
// module's tab and fires a one-shot quickCreateAction signal. The target module
// watches the signal and opens its create-modal on receive.
function QuickCreateButton({ isDark, collapsed, can, onSelectTab }) {
  const { fireQuickCreate } = useKernal();
  const [open, setOpen] = useState(false);

  const items = [
    { id: 'new-sku',      label: 'New SKU',      tab: 'inventory',  Icon: Package,      mod: 'inventory'  },
    { id: 'new-po',       label: 'New PO',       tab: 'procurement', Icon: ShoppingCart, mod: 'procurement' },
    { id: 'new-customer', label: 'New Customer', tab: 'crm',         Icon: UserPlus,     mod: 'crm'        },
    { id: 'new-invoice',  label: 'New Invoice',  tab: 'accounting',  Icon: FileText,     mod: 'accounting' },
    { id: 'new-order',    label: 'New Order',    tab: 'field',       Icon: ShoppingCart, mod: 'field'      },
  ].filter(i => can(i.mod) !== 'none' && can(i.mod) !== 'driver');

  if (items.length === 0) return null;

  const triggerCls = isDark
    ? 'bg-cyan-500 text-gray-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
    : 'bg-cyan-500 text-white hover:bg-cyan-400';

  return (
    <div id="kernal-quickcreate-btn" className="relative px-3 pt-3 pb-1">
      <button
        onClick={() => setOpen(o => !o)}
        title={collapsed ? 'Quick Create' : undefined}
        className={`${triggerCls} w-full flex items-center ${collapsed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-2'} rounded-lg text-sm font-bold transition-colors`}
      >
        <Plus className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
        {!collapsed && <span>New</span>}
      </button>
      {open && (
        <>
          {/* click-outside backdrop */}
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-40" />
          <div className={`absolute ${collapsed ? 'left-full ml-2 top-3' : 'left-3 right-3 top-full mt-1'} z-50 rounded-lg shadow-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#e2e8f0]'} overflow-hidden`}>
            {items.map(i => {
              const Icon = i.Icon;
              return (
                <button
                  key={i.id}
                  onClick={() => { onSelectTab(i.tab); fireQuickCreate(i.id); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-[#0f172a] hover:bg-[#eef2f7]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="font-medium">{i.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────
function SidebarNavItem({ tab, isActive, collapsed, badge, onClick, isDark, isLocked }) {
  const Icon = tab.Icon;
  const activeBg   = isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40' : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/40';
  const inactiveBg = isDark
    ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/70 border-transparent'
    : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#eef2f7] border-transparent';
  const lockedBg   = isDark
    ? 'text-gray-600 hover:text-gray-400 hover:bg-gray-800/40 border-transparent opacity-60'
    : 'text-[#94a3b8] hover:text-[#64748b] hover:bg-[#f1f5f9] border-transparent opacity-60';
  return (
    <button
      onClick={onClick}
      title={collapsed ? (isLocked ? `${tab.label} — Upgrade required` : tab.label) : undefined}
      className={[
        'group relative w-full flex items-center rounded-lg text-sm font-medium transition-colors border-l-2',
        collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
        isLocked ? lockedBg : (isActive ? `${activeBg} font-bold` : inactiveBg),
      ].join(' ')}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span className="truncate flex-1 text-left">{tab.label}</span>}
      {/* Lock icon for paywalled modules */}
      {isLocked && !collapsed && (
        <span className="text-[9px] font-bold text-gray-600 border border-gray-700 rounded px-1 py-0.5 leading-none shrink-0">PRO</span>
      )}
      {isLocked && collapsed && (
        <span className="absolute top-0.5 right-0.5 text-[8px] leading-none">🔒</span>
      )}
      {!isLocked && !collapsed && badge > 0 && (
        <span className="px-1.5 py-0 rounded-full text-[10px] font-bold bg-amber-500 text-gray-950 leading-tight">{badge}</span>
      )}
      {!isLocked && collapsed && badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
      )}
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ isDark, collapsed, onToggleCollapse, visibleTabs, activeTabId, onSelectTab, pendingForMe, mobileOpen, onCloseMobile, can, isModuleUnlocked }) {
  const sidebarBg = isDark
    ? 'bg-gray-950 border-gray-800'
    : 'bg-white border-[#e2e8f0]';
  const wordmarkSub = isDark ? 'text-gray-400' : 'text-[#64748b]';
  const groupLabel  = isDark ? 'text-gray-500' : 'text-[#94a3b8]';
  const toggleBtn = isDark
    ? 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/70'
    : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#eef2f7]';
  const visibleIds = new Set(visibleTabs.map(t => t.id));

  // Width: 224px expanded / 64px collapsed on desktop; 256px in mobile overlay
  const desktopWidth = collapsed ? 'md:w-16' : 'md:w-56';
  const mobileTranslate = mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div onClick={onCloseMobile} className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-40 md:hidden" />
      )}
      <aside
        className={[
          'fixed md:relative inset-y-0 left-0 z-50 flex flex-col w-64',
          desktopWidth,
          mobileTranslate,
          'border-r transition-all duration-200 ease-out',
          sidebarBg,
        ].join(' ')}
      >
        {/* Brand + collapse toggle */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 h-14 border-b ${isDark ? 'border-gray-800' : 'border-[#e2e8f0]'} shrink-0`}>
          {!collapsed && (
            <span id="kernal-brand" className="text-cyan-500 font-black tracking-tight text-lg whitespace-nowrap">
              KERNAL<span className={`${wordmarkSub} font-light`}> ERP</span>
            </span>
          )}
          {collapsed && (
            <span className="text-cyan-500 font-black tracking-tight text-lg">K</span>
          )}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${toggleBtn} ${collapsed ? 'absolute top-3.5 right-2' : ''}`}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className={`md:hidden flex items-center justify-center w-7 h-7 rounded-lg ${toggleBtn}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Create */}
        <QuickCreateButton isDark={isDark} collapsed={collapsed} can={can} onSelectTab={onSelectTab} />

        {/* Nav groups */}
        <nav id="kernal-sidebar-nav" className="flex-1 overflow-y-auto py-3">
          {MODULE_GROUPS.map((group, gi) => {
            const groupTabs = group.tabIds
              .map(id => ALL_TABS.find(t => t.id === id))
              .filter(t => t && visibleIds.has(t.id));
            if (groupTabs.length === 0) return null;
            return (
              <div key={group.id} className={gi > 0 ? 'mt-4' : ''}>
                {!collapsed && (
                  <div className={`px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest ${groupLabel}`}>
                    {group.label}
                  </div>
                )}
                {collapsed && gi > 0 && (
                  <div className={`mx-3 mb-1.5 border-t ${isDark ? 'border-gray-800' : 'border-[#e2e8f0]'}`} />
                )}
                <div className={collapsed ? 'flex flex-col gap-1 px-2' : 'flex flex-col gap-0.5 px-2'}>
                  {groupTabs.map(tab => (
                    <SidebarNavItem
                      key={tab.id}
                      tab={tab}
                      isActive={tab.id === activeTabId}
                      collapsed={collapsed}
                      badge={tab.id === 'approvals' ? pendingForMe : 0}
                      onClick={() => { onSelectTab(tab.id); onCloseMobile(); }}
                      isDark={isDark}
                      isLocked={!isModuleUnlocked(tab.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer — version + collapse hint */}
        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-[#e2e8f0]'} px-3 py-2.5 text-[10px] ${groupLabel}`}>
          {collapsed ? (
            <span className="block text-center font-bold">v1</span>
          ) : (
            <span>Kernel ERP · v1.0</span>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function KernalShell() {
  const { can, activeUser, activeUserId, settings, pendingApprovalsForUser, isModuleUnlocked } = useKernal();
  // ── Hash-based deep linking ──────────────────────────────────────────────────
  // kernal-frontend.vercel.app/#mobilewms  → opens Mobile WMS directly
  // Any valid module id works:  /#logistics  /#inventory  /#accounting  etc.
  const getInitialModule = () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && ALL_TABS.some(t => t.id === hash)) return hash;
    return 'inventory';
  };

  const [active, setActive]  = useState(getInitialModule);
  const [isDark, setIsDark]  = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeTourId, setActiveTourId]   = useState(null);
  const [helpOpen, setHelpOpen]           = useState(false);

  // ── Error reporter: boot global handlers once, inject context on every render ──
  useEffect(() => { initGlobalHandlers(); }, []);
  useEffect(() => {
    setAppContext({
      userRole:       activeUser?.role       || 'unknown',
      userName:       activeUser?.name       || 'unknown',
      activeModule:   active,
      activeLocation: settings?.business?.state || 'unknown',
    });
  });

  // ── Breadcrumb: record every module navigation ────────────────────────────────
  const handleNavigate = useCallback((tabId) => {
    const tab = ALL_TABS.find(t => t.id === tabId);
    addBreadcrumb('navigation', `navigate → ${tab?.label || tabId}`);
    // Keep URL hash in sync so users can bookmark / share direct module links
    window.location.hash = tabId;
    setActive(tabId);
  }, []);

  // ⌘K / Ctrl+K — open / close global search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-trigger welcome tour on first load
  useEffect(() => {
    if (!tourStorage.isDone('welcome')) {
      const t = setTimeout(() => setActiveTourId('welcome'), 900);
      return () => clearTimeout(t);
    }
  }, []);

  // Auto-trigger module-specific tour on first visit to that module
  useEffect(() => {
    if (activeTourId) return; // don't interrupt an active tour
    const moduleTourEntry = Object.entries(TOURS).find(([, t]) => t.moduleId === active);
    if (moduleTourEntry && !tourStorage.isDone(moduleTourEntry[0])) {
      const t = setTimeout(() => setActiveTourId(moduleTourEntry[0]), 600);
      return () => clearTimeout(t);
    }
  }, [active, activeTourId]);

  const addRecentSearch = useCallback((q) => {
    if (!q) return;
    setRecentSearches(prev => [q, ...prev.filter(s => s !== q)].slice(0, 6));
  }, []);

  // Badge: how many approvals are awaiting the active user
  const pendingForMe = pendingApprovalsForUser(activeUserId)?.length || 0;

  const isAdminOrManager = ['admin', 'manager'].includes(activeUser?.role);

  // Build visible tab list.
  // Locked modules (outside plan/addOns) are shown to admin/manager as grayed
  // upsell entries but hidden from regular users to avoid confusion.
  const visibleTabs = ALL_TABS.filter(tab => {
    const perm     = can(tab.id);
    const unlocked = isModuleUnlocked(tab.id);
    // Master kill switch from Settings → Module Visibility
    if (settings.modules?.[tab.id] === false) return false;
    // Locked but admin/manager can still see it (as a paywall entry)
    if (!unlocked) return isAdminOrManager;
    // Unlocked but user has no permission → hide
    return perm !== 'none';
  });

  // If current active tab is no longer visible, default to first visible
  const activeTab = visibleTabs.find(t => t.id === active) || visibleTabs[0];

  const topBarBg = isDark ? 'bg-gray-900/80 border-gray-800' : 'border-[#e2e8f0]';
  const topBarStyle = isDark
    ? {}
    : { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' };
  const toggleBtn = isDark
    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border-gray-700/50'
    : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#e8edf3] border-[#e2e8f0]';
  const wordmarkSub = isDark ? 'text-gray-400' : 'text-[#64748b]';

  return (
    <div
      className={`${isDark ? 'kernal-dark' : 'kernal-light'} flex h-screen overflow-hidden`}
      style={{ background: isDark ? '#030712' : '#f1f5f9' }}
    >
      <Sidebar
        isDark={isDark}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        visibleTabs={visibleTabs}
        activeTabId={activeTab?.id}
        onSelectTab={handleNavigate}
        pendingForMe={pendingForMe}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        can={can}
        isModuleUnlocked={isModuleUnlocked}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Slim top bar — mobile hamburger + active-module label + theme + user */}
        <header
          id="kernal-topbar"
          className={`border-b sticky top-0 z-30 ${topBarBg} shrink-0`}
          style={topBarStyle}
        >
          <div className="flex items-center gap-3 px-4 h-12 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className={`md:hidden flex items-center justify-center w-8 h-8 rounded-lg border ${toggleBtn}`}
            >
              <Menu className="w-4 h-4" />
            </button>
            {/* Mobile wordmark (sidebar is hidden); active module label on desktop */}
            <span className="md:hidden text-cyan-500 font-black tracking-tight text-base whitespace-nowrap">
              KERNAL<span className={`${wordmarkSub} font-light`}> ERP</span>
            </span>
            <div className="hidden md:flex items-center gap-2 min-w-0 flex-1">
              {activeTab?.Icon && <activeTab.Icon className="w-4 h-4 text-cyan-500 shrink-0" />}
              <span className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-[#0f172a]'} truncate`}>{activeTab?.label}</span>
            </div>
            <div className="flex-1 md:flex-none" />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsDark(d => !d)}
                title={isDark ? 'Light mode' : 'Dark mode'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${toggleBtn}`}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
                <span className="hidden lg:inline">{isDark ? 'Light' : 'Dark'}</span>
              </button>
              <button
                id="kernal-search-btn"
                onClick={() => setSearchOpen(true)}
                title="Global search (⌘K)"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${toggleBtn}`}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-gray-500">Search…</span>
                <kbd className={`hidden lg:inline text-[9px] font-mono px-1 py-0.5 rounded border ${isDark ? 'bg-gray-800/60 border-gray-700/60 text-gray-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>⌘K</kbd>
              </button>

              {/* Help & Tours button */}
              <div className="relative">
                <button
                  onClick={() => setHelpOpen(o => !o)}
                  title="Help & Tours"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${toggleBtn}`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Help</span>
                </button>
                {helpOpen && (
                  <>
                    <div onClick={() => setHelpOpen(false)} className="fixed inset-0 z-40" />
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-2xl overflow-hidden z-50 bg-gray-900 border-gray-800">
                      <div className="px-3 py-2 border-b border-gray-800">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tours & Help</p>
                      </div>
                      <button
                        onClick={() => { setActiveTourId('welcome'); setHelpOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Welcome Tour</span>
                      </button>
                      {Object.entries(TOURS).filter(([, t]) => t.moduleId === active).map(([id, t]) => (
                        <button
                          key={id}
                          onClick={() => { setActiveTourId(id); setHelpOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                          <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>{t.label} Tour</span>
                        </button>
                      ))}
                      <div className="border-t border-gray-800 mt-1 pt-1 pb-1">
                        <button
                          onClick={() => { tourStorage.resetAll(); setHelpOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-600 hover:bg-gray-800/50 hover:text-gray-400 transition-colors"
                        >
                          Reset all tours
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {settings.features?.multiLocation !== false && <LocationSwitcher isDark={isDark} />}
              <UserSwitcher isDark={isDark} />
            </div>
          </div>
        </header>

        <main id="kernal-main" className="flex-1 overflow-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>}>
            {ALL_TABS.map(tab => {
              const perm      = can(tab.id);
              const unlocked  = isModuleUnlocked(tab.id);
              const isVisible = visibleTabs.find(t => t.id === tab.id);
              return (
                <div key={tab.id} style={{ display: activeTab?.id === tab.id ? 'block' : 'none' }}>
                  {!isVisible
                    ? <AccessDenied tabLabel={tab.label} />
                    : !unlocked
                      ? <LockedModule tab={tab} />
                      : (
                        <ModuleErrorBoundary key={tab.id} label={tab.label}>
                          <tab.Component userPermission={perm} />
                        </ModuleErrorBoundary>
                      )
                  }
                </div>
              );
            })}
          </Suspense>
        </main>
      </div>

      {/* Global Search overlay — rendered outside the scrollable column so it sits above everything */}
      {searchOpen && (
        <GlobalSearch
          isDark={isDark}
          onNavigate={handleNavigate}
          onClose={() => setSearchOpen(false)}
          recentSearches={recentSearches}
          onAddRecent={addRecentSearch}
        />
      )}

      {/* Onboarding tour overlay */}
      {activeTourId && (
        <OnboardingTour
          key={activeTourId}
          tourId={activeTourId}
          onComplete={() => setActiveTourId(null)}
          onSkip={() => setActiveTourId(null)}
        />
      )}

      {/* autofix removed */}
    </div>
  );
}

const ADMIN_ROLES = new Set(['admin', 'manager', 'superadmin']);

function AutofixActiveBanner({ role }) {
  return null; // autofix feature disabled
  const [activeCount, setActiveCount] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!ADMIN_ROLES.has(role)) return;

    const check = async () => {
      try {
        const { supabase } = await import('./lib/supabase.js');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(
          `${API_BASE_BANNER}/api/v1/bugs?status=investigating&limit=50`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (!res.ok) return;
        const body = await res.json();
        const active = (body.data || []).filter(b =>
          ['analyzing', 'patching', 'generating_patch', 'opening_pr', 'pr_open'].includes(b.autofix_status)
        );
        setActiveCount(active.length);
      } catch { /* silent */ }
    };

    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [role]);

  if (!ADMIN_ROLES.has(role) || !visible || activeCount === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9990,
      background: 'linear-gradient(90deg, #1e3a5f 0%, #1a3050 100%)',
      borderTop: '1px solid #2563eb44',
      padding: '7px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          display: 'inline-block',
          width: 8, height: 8, borderRadius: '50%',
          background: '#3b82f6',
          boxShadow: '0 0 6px #3b82f6',
          animation: 'kab-pulse 1.4s ease-in-out infinite',
        }} />
        <style>{`@keyframes kab-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 500 }}>
          AutoPatch: {activeCount} job{activeCount !== 1 ? 's' : ''} running
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#4b6fa5', fontSize: 16, lineHeight: 1, padding: 0,
        }}
        aria-label="Dismiss banner"
      >×</button>
    </div>
  );
}

// ── Per-module error boundary ─────────────────────────────────────────────────
// Wraps each individual module so a crash in one never takes down the rest.
class ModuleErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, reportId: null, reportSent: false, reportSending: false };
    this.reset = this.reset.bind(this);
    this._copyTimeout = null;
    this._mounted = false;
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidMount()   { this._mounted = true; }
  componentWillUnmount(){ this._mounted = false; }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo, reportSending: true });
    console.error(`[Kernel] Module "${this.props.label}" crashed:`, error, errorInfo?.componentStack);
    captureError({ error, moduleName: this.props.label, type: 'crash' }).then(report => {
      if (this._mounted) {
        this.setState({ reportId: report.id, reportSent: report.sent, reportSending: false });
      }
    }).catch(() => {
      if (this._mounted) this.setState({ reportSending: false });
    });
  }
  reset() { this.setState({ error: null, errorInfo: null, reportId: null, reportSent: false, reportSending: false }); }
  copyReport() {
    const { reportId } = this.state;
    const err = this.state.error;
    const text = [
      'KERNAL CRASH REPORT',
      '===================',
      `Report ID:  ${reportId || 'pending'}`,
      `Build:      Build66`,
      `Module:     ${this.props.label}`,
      `Error Type: ${err?.name || 'Error'}`,
      `Message:    ${err?.message || String(err)}`,
      '',
      'Stack Trace:',
      err?.stack || '(no stack trace available)',
    ].join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  }
  render() {
    if (this.state.error) {
      const { reportSending, reportSent, reportId } = this.state;
      const err = this.state.error;
      return (
        <div style={{ padding: '48px 32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: 360 }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(244,63,94,.3)', borderRadius: 14, padding: '24px 28px', maxWidth: 560, width: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Module error</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(244,63,94,.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,.2)' }}>
                {this.props.label}
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, lineHeight: 1.6 }}>
              This module encountered an unexpected error. The rest of Kernel is unaffected — navigate to any other module normally.
            </p>

            {/* Report delivery status */}
            <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid', ...(
              reportSending ? { background: 'rgba(59,130,246,.07)', borderColor: 'rgba(59,130,246,.2)' } :
              reportSent    ? { background: 'rgba(52,211,153,.07)', borderColor: 'rgba(52,211,153,.2)' } :
                              { background: 'rgba(251,191,36,.07)', borderColor: 'rgba(251,191,36,.2)' }
            )}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color:
                reportSending ? '#60a5fa' : reportSent ? '#34d399' : '#fbbf24'
              }}>
                {reportSending ? '⏳ Sending crash report…' :
                 reportSent    ? `✓ Report sent automatically (${reportId})` :
                                 `⚠ Report saved locally (${reportId || '…'}) — no webhook configured`}
              </div>
              {!reportSending && !reportSent && (
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  Go to Settings → Error Reporting to configure automatic delivery.
                </div>
              )}
            </div>

            {/* Error details (collapsed) */}
            <details style={{ marginBottom: 16 }}>
              <summary style={{ fontSize: 11, color: '#4b5563', cursor: 'pointer', userSelect: 'none', marginBottom: 6 }}>
                Show error details
              </summary>
              <pre style={{ fontSize: 11, color: '#9ca3af', background: '#080e18', padding: '10px 12px', borderRadius: 6, overflow: 'auto', maxHeight: 180, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '6px 0 0', border: '1px solid #1f2937' }}>
                {`${err?.name}: ${err?.message}\n\n${err?.stack || ''}`}
              </pre>
            </details>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={this.reset}
                style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ↺ Reload {this.props.label}
              </button>
              <button onClick={() => this.copyReport()}
                style={{ background: 'rgba(107,114,128,.1)', border: '1px solid #374151', color: '#9ca3af', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Copy Report
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen() {
  const { login } = useKernal();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authErr } = await login(email.trim(), password);
      if (authErr) setError(authErr.message);
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#030712', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: 380, padding: '40px 36px', borderRadius: 16,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Logo / wordmark */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            marginBottom: 16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Kernel</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Enterprise Resource Planning</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" autoFocus
              placeholder="you@company.com"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 14px',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
                fontSize: 14, outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 8,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(6,182,212,0.4)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              color: 'white', fontSize: 14, fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#374151' }}>
          Kernel ERP · Secure access via Supabase Auth
        </p>
      </div>
    </div>
  );
}

// ── Force Password Change ─────────────────────────────────────────────────────
// Shown when authUser.user_metadata.must_change_password === true.
// Uses the client-side Supabase SDK to update the password and clear the flag,
// which triggers onAuthStateChange and refreshes authUser automatically.
function ForcePasswordChange({ authUser }) {
  const [pwd, setPwd]   = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr]   = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (pwd.length < 8)  return setErr('Password must be at least 8 characters.');
    if (pwd !== conf)    return setErr('Passwords do not match.');
    setBusy(true);
    try {
      const { supabase: sb } = await import('./lib/supabase.js');
      const { error } = await sb.auth.updateUser({
        password: pwd,
        data: { must_change_password: false },
      });
      if (error) throw error;
      // authUser will refresh via onAuthStateChange → re-render with normal app
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#030712', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#111827', border: '1px solid #374151', borderRadius: 12,
        padding: '2rem', width: '100%', maxWidth: 400,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🔒</p>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Set Your Password
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 8 }}>
            Welcome! You need to create a new password before continuing.
          </p>
          <p style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
            Signed in as <span style={{ color: '#d1d5db' }}>{authUser?.email}</span>
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
              New Password
            </label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              style={{
                width: '100%', background: '#1f2937', border: '1px solid #374151',
                color: '#fff', borderRadius: 6, padding: '10px 12px', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={conf}
              onChange={(e) => setConf(e.target.value)}
              required
              placeholder="Re-enter password"
              style={{
                width: '100%', background: '#1f2937', border: '1px solid #374151',
                color: '#fff', borderRadius: 6, padding: '10px 12px', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {err && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{err}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              background: busy ? '#1d4ed8' : '#2563eb', color: '#fff', border: 'none',
              borderRadius: 6, padding: '11px 0', fontSize: 14, fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.8 : 1,
            }}
          >
            {busy ? 'Saving…' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Auth Gate — shows spinner → login → app ───────────────────────────────────
function AuthGate() {
  const { authLoading, authUser } = useKernal();

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#030712', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(6,182,212,0.2)',
          borderTopColor: '#06b6d4',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authUser) return <LoginScreen />;

  // Force password change if the flag is set (new accounts created by superadmin)
  if (authUser.user_metadata?.must_change_password === true) {
    return <ForcePasswordChange authUser={authUser} />;
  }

  // Superadmin users get the owner portal — not the normal app
  if (authUser.user_metadata?.role === 'superadmin') {
    return (
      <SuperAdminModule
        authUser={authUser}
        onSignOut={async () => {
          const { supabase } = await import('./lib/supabase.js');
          await supabase.auth.signOut();
        }}
      />
    );
  }

  return <KernalShell />;
}

// ── App-level fallback (last resort — catches KernalProvider / KernalShell crashes) ──
class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '48px', fontFamily: 'system-ui, sans-serif', background: '#030712', minHeight: '100vh', color: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Kernel encountered a critical error</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Please reload the page to restart the application.</p>
          <pre style={{ fontSize: 12, color: '#4b5563', background: '#0d1117', padding: '14px 18px', borderRadius: 8, maxWidth: 640, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid #1f2937' }}>
            {String(this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Reload Kernel
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Service Worker registration (PWA install support) ────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failure is non-fatal — app works fine without it
    });
  });
}

// ── Root ──────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <KernalProvider>
        <AuthGate />
      </KernalProvider>
    </AppErrorBoundary>
  </StrictMode>
);
