import { useState, useMemo } from 'react';
import {
  Key, Zap, Activity, Terminal,
  Plus, Trash2, Copy, Eye, EyeOff, RotateCcw,
  CheckCircle, XCircle, AlertCircle, Clock,
  ChevronDown, ChevronRight, Globe, Lock,
  Code2, Send, RefreshCw, Filter, ExternalLink,
  Shield, BookOpen, Braces, Play,
} from 'lucide-react';
import { useKernal } from './KernalContext.jsx';

// ── Local Company Info (Rolldown IIFE TDZ fix) ───────────────────────────────
const COMPANY_INFO = {
  name:    'Kernal Food Distribution LLC',
  email:   'purchasing@kernaldist.com',
  apiBase: 'https://api.kernaldist.com',
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const ALL_SCOPES = [
  { id: 'orders:read',      label: 'orders:read',      desc: 'Read orders and order items'           },
  { id: 'orders:write',     label: 'orders:write',     desc: 'Create and update orders'              },
  { id: 'inventory:read',   label: 'inventory:read',   desc: 'Read inventory levels and SKUs'        },
  { id: 'inventory:write',  label: 'inventory:write',  desc: 'Adjust inventory quantities'           },
  { id: 'customers:read',   label: 'customers:read',   desc: 'Read customer accounts and contacts'   },
  { id: 'customers:write',  label: 'customers:write',  desc: 'Create and update customer records'    },
  { id: 'invoices:read',    label: 'invoices:read',    desc: 'Read invoices and line items'          },
  { id: 'invoices:write',   label: 'invoices:write',   desc: 'Create and update invoices'            },
  { id: 'payments:read',    label: 'payments:read',    desc: 'Read payment transactions'             },
  { id: 'products:read',    label: 'products:read',    desc: 'Read product catalog and pricing'      },
  { id: 'reports:read',     label: 'reports:read',     desc: 'Export reports and analytics data'     },
  { id: 'webhooks:write',   label: 'webhooks:write',   desc: 'Manage webhook endpoints'              },
];

const ALL_WEBHOOK_EVENTS = [
  { id: 'order.created',      label: 'order.created',      desc: 'A new sales order is submitted'            },
  { id: 'order.shipped',      label: 'order.shipped',      desc: 'An order is marked out for delivery'       },
  { id: 'order.delivered',    label: 'order.delivered',    desc: 'An order is confirmed delivered'           },
  { id: 'order.cancelled',    label: 'order.cancelled',    desc: 'An order is cancelled'                     },
  { id: 'invoice.created',    label: 'invoice.created',    desc: 'A new invoice is generated'                },
  { id: 'invoice.paid',       label: 'invoice.paid',       desc: 'An invoice is fully paid'                  },
  { id: 'invoice.overdue',    label: 'invoice.overdue',    desc: 'An invoice passes its due date unpaid'     },
  { id: 'payment.received',   label: 'payment.received',   desc: 'A payment is received and applied'         },
  { id: 'inventory.low_stock',label: 'inventory.low_stock',desc: 'An SKU drops below its reorder point'      },
  { id: 'inventory.adjusted', label: 'inventory.adjusted', desc: 'A manual inventory adjustment is made'     },
  { id: 'customer.created',   label: 'customer.created',   desc: 'A new customer account is added'           },
  { id: 'customer.updated',   label: 'customer.updated',   desc: 'A customer record is modified'             },
];

const INIT_API_KEYS = [
  {
    id: 'key_live_4f8a', name: 'Production Integration',
    key: 'krn_live_4f8a9b2c1d3e5f6a7b8c9d0e1f2a3b4c',
    masked: 'krn_live_4f8a••••••••••••••••••••9d0e1f2a3b4c',
    scopes: ['orders:read', 'inventory:read', 'customers:read', 'invoices:read'],
    env: 'live', status: 'active',
    createdAt: '2026-01-15', lastUsed: '2026-05-27', requests: 14822,
  },
  {
    id: 'key_live_7e2b', name: 'Accounting Sync',
    key: 'krn_live_7e2b8a1f9c4d2e5b6a7c8d9e0f1a2b3c',
    masked: 'krn_live_7e2b••••••••••••••••••••9e0f1a2b3c',
    scopes: ['invoices:read', 'invoices:write', 'payments:read'],
    env: 'live', status: 'active',
    createdAt: '2026-02-20', lastUsed: '2026-05-26', requests: 3210,
  },
  {
    id: 'key_test_2c9e', name: 'Dev Sandbox',
    key: 'krn_test_2c9e5d4a8b1f3e6c7a9d0b2e4f6a8c1d',
    masked: 'krn_test_2c9e••••••••••••••••••••0b2e4f6a8c1d',
    scopes: ['orders:read', 'orders:write', 'inventory:read', 'inventory:write', 'customers:read', 'customers:write'],
    env: 'test', status: 'active',
    createdAt: '2026-03-10', lastUsed: '2026-05-25', requests: 892,
  },
  {
    id: 'key_live_9a1c', name: 'Legacy BI Export',
    key: 'krn_live_9a1c3e7b2d5f8a4c6b9e1d3f5a7c9b2e',
    masked: 'krn_live_9a1c••••••••••••••••••••1d3f5a7c9b2e',
    scopes: ['reports:read'],
    env: 'live', status: 'revoked',
    createdAt: '2025-11-01', lastUsed: '2026-04-12', requests: 45,
    revokedAt: '2026-05-01',
  },
];

const INIT_WEBHOOKS = [
  {
    id: 'wh_001', name: 'Metro ERP Receiver',
    url: 'https://erp.metrorestaurant.com/kernal/events',
    events: ['order.created', 'order.shipped', 'invoice.paid'],
    status: 'active', secret: 'whsec_••••••••',
    createdAt: '2026-02-01', lastDelivery: '2026-05-27T08:41:00',
    successRate: 98.4, totalDeliveries: 1842,
  },
  {
    id: 'wh_002', name: 'Zapier Automation',
    url: 'https://hooks.zapier.com/hooks/catch/kernal/abc123',
    events: ['inventory.low_stock', 'order.created'],
    status: 'active', secret: 'whsec_••••••••',
    createdAt: '2026-03-14', lastDelivery: '2026-05-27T07:58:00',
    successRate: 99.1, totalDeliveries: 624,
  },
  {
    id: 'wh_003', name: 'Custom BI Ingest',
    url: 'https://api.custombi.io/ingest/kernal',
    events: ['invoice.created', 'invoice.paid', 'payment.received'],
    status: 'failing', secret: 'whsec_••••••••',
    createdAt: '2026-04-20', lastDelivery: '2026-05-26T23:12:00',
    successRate: 61.2, totalDeliveries: 98,
    failReason: 'HTTP 503 — Service Unavailable',
  },
  {
    id: 'wh_004', name: 'Internal Alert Tool',
    url: 'https://alerts.internaltool.local/kernal',
    events: ['order.created', 'order.shipped', 'inventory.low_stock', 'invoice.overdue'],
    status: 'disabled', secret: 'whsec_••••••••',
    createdAt: '2026-01-05', lastDelivery: '2026-05-10T14:22:00',
    successRate: 100, totalDeliveries: 210,
  },
];

const INIT_EVENT_LOG = [
  { id:'evt_001', type:'api',     method:'GET',  endpoint:'/v1/orders',           keyId:'key_live_4f8a', keyName:'Production Integration', statusCode:200, latencyMs:48,  ts:'2026-05-27T08:43:12', ip:'52.14.22.89'   },
  { id:'evt_002', type:'webhook', event:'order.created',   webhookId:'wh_001', webhookName:'Metro ERP Receiver', statusCode:200, latencyMs:312, ts:'2026-05-27T08:41:00', attempt:1 },
  { id:'evt_003', type:'api',     method:'GET',  endpoint:'/v1/inventory',        keyId:'key_live_4f8a', keyName:'Production Integration', statusCode:200, latencyMs:61,  ts:'2026-05-27T08:40:55', ip:'52.14.22.89'   },
  { id:'evt_004', type:'webhook', event:'inventory.low_stock', webhookId:'wh_002', webhookName:'Zapier Automation', statusCode:200, latencyMs:198, ts:'2026-05-27T07:58:22', attempt:1 },
  { id:'evt_005', type:'api',     method:'POST', endpoint:'/v1/invoices',         keyId:'key_live_7e2b', keyName:'Accounting Sync',        statusCode:201, latencyMs:134, ts:'2026-05-27T07:55:10', ip:'34.201.18.44'  },
  { id:'evt_006', type:'api',     method:'GET',  endpoint:'/v1/invoices/INV-506', keyId:'key_live_7e2b', keyName:'Accounting Sync',        statusCode:200, latencyMs:39,  ts:'2026-05-27T07:54:58', ip:'34.201.18.44'  },
  { id:'evt_007', type:'webhook', event:'invoice.paid',    webhookId:'wh_003', webhookName:'Custom BI Ingest',  statusCode:503, latencyMs:5001,ts:'2026-05-26T23:12:00', attempt:3 },
  { id:'evt_008', type:'api',     method:'GET',  endpoint:'/v1/customers',        keyId:'key_live_4f8a', keyName:'Production Integration', statusCode:200, latencyMs:55,  ts:'2026-05-26T22:10:05', ip:'52.14.22.89'   },
  { id:'evt_009', type:'api',     method:'GET',  endpoint:'/v1/orders?status=open',keyId:'key_test_2c9e',keyName:'Dev Sandbox',            statusCode:200, latencyMs:72,  ts:'2026-05-26T18:34:22', ip:'192.168.1.55'  },
  { id:'evt_010', type:'api',     method:'POST', endpoint:'/v1/orders',           keyId:'key_test_2c9e', keyName:'Dev Sandbox',            statusCode:422, latencyMs:22,  ts:'2026-05-26T18:33:48', ip:'192.168.1.55'  },
  { id:'evt_011', type:'webhook', event:'order.shipped',   webhookId:'wh_001', webhookName:'Metro ERP Receiver', statusCode:200, latencyMs:287, ts:'2026-05-26T16:22:10', attempt:1 },
  { id:'evt_012', type:'webhook', event:'invoice.paid',    webhookId:'wh_003', webhookName:'Custom BI Ingest',  statusCode:503, latencyMs:5001,ts:'2026-05-26T15:55:00', attempt:2 },
];

// ── API Explorer endpoint catalog ─────────────────────────────────────────────
const API_RESOURCES = [
  {
    id: 'orders', label: 'Orders', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20',
    endpoints: [
      { method:'GET',   path:'/v1/orders',           summary:'List orders',             params:'status, customer_id, from_date, to_date, limit, offset', response:'{ data: Order[], total, page }' },
      { method:'GET',   path:'/v1/orders/{id}',       summary:'Get order',               params:'id (path)', response:'Order object with line items' },
      { method:'POST',  path:'/v1/orders',            summary:'Create order',            body:'{ customer_id, items: [{sku_id, qty, unit_price}], notes? }', response:'Created Order object' },
      { method:'PATCH', path:'/v1/orders/{id}',       summary:'Update order',            params:'id (path)', body:'{ status?, notes? }', response:'Updated Order object' },
      { method:'DELETE',path:'/v1/orders/{id}/cancel',summary:'Cancel order',            params:'id (path)', body:'{ reason }', response:'{ success: true }' },
    ],
  },
  {
    id: 'inventory', label: 'Inventory', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
    endpoints: [
      { method:'GET',   path:'/v1/inventory',            summary:'List SKUs',           params:'category, location_id, low_stock, limit, offset', response:'{ data: SKU[], total }' },
      { method:'GET',   path:'/v1/inventory/{sku_id}',   summary:'Get SKU',             params:'sku_id (path)', response:'SKU object with lot data' },
      { method:'GET',   path:'/v1/inventory/{sku_id}/lots', summary:'List lots for SKU', params:'sku_id (path)', response:'{ data: Lot[] }' },
      { method:'POST',  path:'/v1/inventory/adjust',     summary:'Create adjustment',   body:'{ sku_id, qty_delta, reason, location_id }', response:'AdjustmentRecord object' },
    ],
  },
  {
    id: 'customers', label: 'Customers', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20',
    endpoints: [
      { method:'GET',   path:'/v1/customers',           summary:'List customers',      params:'status, limit, offset', response:'{ data: Customer[], total }' },
      { method:'GET',   path:'/v1/customers/{id}',      summary:'Get customer',        params:'id (path)', response:'Customer object with contacts' },
      { method:'POST',  path:'/v1/customers',           summary:'Create customer',     body:'{ name, email, phone, address, terms, credit_limit }', response:'Created Customer' },
      { method:'PATCH', path:'/v1/customers/{id}',      summary:'Update customer',     params:'id (path)', body:'Partial customer fields', response:'Updated Customer' },
    ],
  },
  {
    id: 'invoices', label: 'Invoices', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
    endpoints: [
      { method:'GET',   path:'/v1/invoices',            summary:'List invoices',       params:'status, customer_id, from_date, to_date, limit', response:'{ data: Invoice[], total }' },
      { method:'GET',   path:'/v1/invoices/{id}',       summary:'Get invoice',         params:'id (path)', response:'Invoice object with line items and payments' },
      { method:'POST',  path:'/v1/invoices',            summary:'Create invoice',      body:'{ customer_id, items, due_date, notes? }', response:'Created Invoice' },
      { method:'POST',  path:'/v1/invoices/{id}/payments', summary:'Apply payment',    params:'id (path)', body:'{ amount, method, reference }', response:'Payment record' },
    ],
  },
  {
    id: 'webhooks', label: 'Webhooks', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20',
    endpoints: [
      { method:'GET',   path:'/v1/webhooks',            summary:'List webhook endpoints', params:'status', response:'{ data: Webhook[] }' },
      { method:'POST',  path:'/v1/webhooks',            summary:'Register webhook',       body:'{ url, events: string[], description? }', response:'Webhook object with secret' },
      { method:'PATCH', path:'/v1/webhooks/{id}',       summary:'Update webhook',         params:'id (path)', body:'{ url?, events?, status? }', response:'Updated Webhook' },
      { method:'DELETE',path:'/v1/webhooks/{id}',       summary:'Delete webhook',         params:'id (path)', response:'{ success: true }' },
      { method:'POST',  path:'/v1/webhooks/{id}/test',  summary:'Send test event',        params:'id (path)', body:'{ event }', response:'Delivery attempt result' },
    ],
  },
];

const METHOD_COLORS = {
  GET:    { bg:'bg-emerald-500/15', text:'text-emerald-400', border:'border-emerald-500/25' },
  POST:   { bg:'bg-blue-500/15',    text:'text-blue-400',    border:'border-blue-500/25'   },
  PATCH:  { bg:'bg-amber-500/15',   text:'text-amber-400',   border:'border-amber-500/25'  },
  DELETE: { bg:'bg-rose-500/15',    text:'text-rose-400',    border:'border-rose-500/25'   },
};

// ── Helper: status code color ─────────────────────────────────────────────────
function statusColor(code) {
  if (code >= 200 && code < 300) return 'text-emerald-400';
  if (code >= 400 && code < 500) return 'text-amber-400';
  return 'text-rose-400';
}

function fmtTs(ts) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });
}

// ═══ Sub-tab: API Keys ════════════════════════════════════════════════════════
function ApiKeysTab({ isDark }) {
  const [keys, setKeys]               = useState(INIT_API_KEYS);
  const [revealId, setRevealId]       = useState(null);
  const [copiedId, setCopiedId]       = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [revokeId, setRevokeId]       = useState(null);
  const [newCreated, setNewCreated]   = useState(null); // { key, name } after creation
  const [form, setForm]               = useState({ name: '', env: 'live', scopes: [] });

  const panelBg  = isDark ? 'bg-gray-800/50'  : 'bg-white';
  const border   = isDark ? 'border-gray-700/60' : 'border-slate-200';
  const subText  = isDark ? 'text-gray-400'   : 'text-gray-500';

  const copyKey = (key, id) => {
    navigator.clipboard?.writeText(key).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmRevoke = (id) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status:'revoked', revokedAt: new Date().toISOString().slice(0,10) } : k));
    setRevokeId(null);
  };

  const toggleScope = (sid) => {
    setForm(f => ({
      ...f,
      scopes: f.scopes.includes(sid) ? f.scopes.filter(s => s !== sid) : [...f.scopes, sid],
    }));
  };

  const createKey = () => {
    if (!form.name.trim() || form.scopes.length === 0) return;
    const rand = () => Math.random().toString(36).slice(2);
    const rawKey = `krn_${form.env}_${rand()}${rand()}${rand()}`;
    const masked = rawKey.slice(0, 12) + '••••••••••••••••••••' + rawKey.slice(-8);
    const newKey = {
      id: `key_${form.env}_${rand().slice(0,4)}`,
      name: form.name.trim(),
      key: rawKey,
      masked,
      scopes: [...form.scopes],
      env: form.env,
      status: 'active',
      createdAt: new Date().toISOString().slice(0,10),
      lastUsed: '—',
      requests: 0,
    };
    setKeys(prev => [newKey, ...prev]);
    setNewCreated({ key: rawKey, name: newKey.name });
    setShowModal(false);
    setForm({ name:'', env:'live', scopes:[] });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>API Keys</h3>
          <p className={`text-xs mt-0.5 ${subText}`}>Authenticate REST API requests using Bearer tokens. Store keys securely — they cannot be retrieved after creation.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New API Key
        </button>
      </div>

      {/* Key created banner */}
      {newCreated && (
        <div className={`rounded-xl border ${isDark ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} p-4`}>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-400">API key created — copy it now</p>
              <p className={`text-xs mt-0.5 ${subText}`}>This is the only time the full key will be shown. Store it in a secure secrets manager.</p>
              <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                <span className="flex-1 truncate">{newCreated.key}</span>
                <button onClick={() => copyKey(newCreated.key, '__new')} className="shrink-0 hover:text-cyan-400 transition-colors">
                  {copiedId === '__new' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <button onClick={() => setNewCreated(null)} className={`text-xs ${subText} hover:text-gray-300`}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Keys table */}
      <div className={`rounded-xl border ${border} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              <th className="px-4 py-2.5 text-left">Name</th>
              <th className="px-4 py-2.5 text-left">Key</th>
              <th className="px-4 py-2.5 text-left">Scopes</th>
              <th className="px-4 py-2.5 text-left">Env</th>
              <th className="px-4 py-2.5 text-left">Last Used</th>
              <th className="px-4 py-2.5 text-right">Requests</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'}`}>
            {keys.map(k => (
              <tr key={k.id} className={`${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors ${k.status === 'revoked' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className={`font-medium text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{k.name}</div>
                  {k.status === 'revoked' && (
                    <span className="text-xs text-rose-400">Revoked {k.revokedAt}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1.5 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="max-w-[180px] truncate">{revealId === k.id ? k.key : k.masked}</span>
                    {k.status === 'active' && (<>
                      <button onClick={() => setRevealId(revealId === k.id ? null : k.id)} className="hover:text-cyan-400 transition-colors">
                        {revealId === k.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => copyKey(k.key, k.id)} className="hover:text-cyan-400 transition-colors">
                        {copiedId === k.id ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </>)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {k.scopes.slice(0, 3).map(s => (
                      <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{s}</span>
                    ))}
                    {k.scopes.length > 3 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>+{k.scopes.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    k.env === 'live'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>{k.env}</span>
                </td>
                <td className={`px-4 py-3 text-xs ${subText}`}>{k.lastUsed}</td>
                <td className={`px-4 py-3 text-xs text-right tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{k.requests.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {k.status === 'active' && (
                    <button
                      onClick={() => setRevokeId(k.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                    >Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revoke confirm modal */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl border p-6 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Revoke API Key?</h4>
                <p className={`text-xs ${subText}`}>{keys.find(k => k.id === revokeId)?.name}</p>
              </div>
            </div>
            <p className={`text-xs mb-5 ${subText}`}>Revoking this key will immediately block all requests using it. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRevokeId(null)} className={`text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200' : 'border-gray-200 text-gray-500 hover:text-gray-700'} transition-colors`}>Cancel</button>
              <button onClick={() => confirmRevoke(revokeId)} className="text-xs px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors">Revoke Key</button>
            </div>
          </div>
        </div>
      )}

      {/* New key modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-slate-100'} flex items-center justify-between`}>
              <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Create API Key</h4>
              <button onClick={() => setShowModal(false)} className={`${subText} hover:text-gray-200`}><XCircle className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Key Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Production Integration"
                  className={`w-full text-sm px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-white border-slate-200 text-gray-800 placeholder-gray-400'} outline-none focus:border-cyan-500`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Environment</label>
                <div className="flex gap-2">
                  {['live','test'].map(env => (
                    <button
                      key={env}
                      onClick={() => setForm(f => ({ ...f, env }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        form.env === env
                          ? (env === 'live' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/15 border-amber-500/40 text-amber-400')
                          : (isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-slate-200 text-gray-500 hover:border-slate-300')
                      }`}
                    >{env === 'live' ? 'Live' : 'Test / Sandbox'}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Scopes <span className={`${subText} font-normal`}>({form.scopes.length} selected)</span></label>
                <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/40' : 'border-slate-200 bg-gray-50'} divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'} max-h-48 overflow-y-auto`}>
                  {ALL_SCOPES.map(s => (
                    <label key={s.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'} transition-colors`}>
                      <input
                        type="checkbox"
                        checked={form.scopes.includes(s.id)}
                        onChange={() => toggleScope(s.id)}
                        className="accent-cyan-500"
                      />
                      <div>
                        <span className={`text-xs font-mono font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{s.label}</span>
                        <span className={`ml-2 text-xs ${subText}`}>{s.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-800' : 'border-slate-100'} flex justify-end gap-2`}>
              <button onClick={() => setShowModal(false)} className={`text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200' : 'border-gray-200 text-gray-500'} transition-colors`}>Cancel</button>
              <button
                onClick={createKey}
                disabled={!form.name.trim() || form.scopes.length === 0}
                className="text-xs px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold transition-colors"
              >Create Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ Sub-tab: API Explorer ════════════════════════════════════════════════════
function ApiExplorerTab({ isDark }) {
  const [activeResource, setActiveResource] = useState('orders');
  const [expandedPath, setExpandedPath]     = useState(null);
  const [tryResult, setTryResult]           = useState({}); // path -> result string

  const resource = API_RESOURCES.find(r => r.id === activeResource);
  const subText  = isDark ? 'text-gray-400' : 'text-gray-500';

  const MOCK_RESPONSES = {
    '/v1/orders':    `{\n  "data": [\n    { "id": "SO-9890", "customer_id": "CUST-101", "status": "open", "total": 2340.00, "created_at": "2026-05-27T08:10:00Z" },\n    { "id": "SO-9891", "customer_id": "CUST-102", "status": "picking", "total": 1890.00, "created_at": "2026-05-27T07:55:00Z" }\n  ],\n  "total": 24,\n  "page": 1\n}`,
    '/v1/inventory': `{\n  "data": [\n    { "sku_id": "PRO-TOMA-01", "name": "Roma Tomatoes 25lb", "qty_on_hand": 182, "qty_available": 144, "reorder_point": 50 },\n    { "sku_id": "DAI-MILK-02", "name": "Whole Milk 1 Gal", "qty_on_hand": 240, "qty_available": 198, "reorder_point": 60 }\n  ],\n  "total": 341\n}`,
    '/v1/customers': `{\n  "data": [\n    { "id": "CUST-101", "name": "Metro Restaurant Group", "status": "active", "balance_due": 8450.00 },\n    { "id": "CUST-102", "name": "Downtown Catering Co.", "status": "active", "balance_due": 3200.00 }\n  ],\n  "total": 11\n}`,
    '/v1/invoices':  `{\n  "data": [\n    { "id": "INV-501", "customer_id": "CUST-101", "total": 8450.00, "status": "overdue", "due_date": "2026-05-15" },\n    { "id": "INV-502", "customer_id": "CUST-102", "total": 3200.00, "status": "open", "due_date": "2026-06-05" }\n  ],\n  "total": 42\n}`,
    '/v1/webhooks':  `{\n  "data": [\n    { "id": "wh_001", "url": "https://erp.metrorestaurant.com/kernal/events", "status": "active", "events": ["order.created", "order.shipped"] }\n  ],\n  "total": 4\n}`,
  };

  const tryEndpoint = (path) => {
    const baseKey = Object.keys(MOCK_RESPONSES).find(k => path.startsWith(k)) || path;
    const resp = MOCK_RESPONSES[baseKey] || `{ "message": "OK" }`;
    setTryResult(prev => ({ ...prev, [path]: resp }));
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left sidebar */}
      <div className={`w-44 shrink-0 rounded-xl border ${isDark ? 'border-gray-700/60 bg-gray-800/40' : 'border-slate-200 bg-gray-50'} overflow-hidden`}>
        <div className={`px-3 py-2.5 border-b ${isDark ? 'border-gray-700/60' : 'border-slate-200'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${subText}`}>Resources</p>
        </div>
        <div className="p-1.5 space-y-0.5">
          {API_RESOURCES.map(r => (
            <button
              key={r.id}
              onClick={() => { setActiveResource(r.id); setExpandedPath(null); }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                activeResource === r.id
                  ? `${r.bg} ${r.color} font-medium`
                  : (isDark ? 'text-gray-400 hover:bg-gray-700/40 hover:text-gray-200' : 'text-gray-500 hover:bg-white hover:text-gray-700')
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeResource === r.id ? r.color.replace('text-','bg-') : (isDark ? 'bg-gray-600' : 'bg-gray-300')}`} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: endpoint list */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Globe className={`w-3.5 h-3.5 ${subText}`} />
          <span className={`text-xs font-mono ${subText}`}>{COMPANY_INFO.apiBase}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>v1</span>
        </div>

        <div className={`rounded-xl border ${isDark ? 'border-gray-700/60' : 'border-slate-200'} overflow-hidden divide-y ${isDark ? 'divide-gray-700/40' : 'divide-slate-100'}`}>
          {resource.endpoints.map(ep => {
            const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
            const isExpanded = expandedPath === ep.path;
            const tried = tryResult[ep.path];
            return (
              <div key={ep.path}>
                <button
                  onClick={() => setExpandedPath(isExpanded ? null : ep.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border w-14 text-center shrink-0 ${mc.bg} ${mc.text} ${mc.border}`}>{ep.method}</span>
                  <span className={`font-mono text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} flex-1`}>{ep.path}</span>
                  <span className={`text-xs ${subText} mr-2`}>{ep.summary}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ${subText} transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className={`px-4 pb-4 space-y-3 ${isDark ? 'bg-gray-900/60' : 'bg-gray-50/80'}`}>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {ep.params && (
                        <div>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${subText}`}>Parameters</p>
                          <p className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{ep.params}</p>
                        </div>
                      )}
                      {ep.body && (
                        <div>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${subText}`}>Request Body</p>
                          <p className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{ep.body}</p>
                        </div>
                      )}
                      <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${subText}`}>Response</p>
                        <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{ep.response}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => tryEndpoint(ep.path)}
                        className="flex items-center gap-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Play className="w-3 h-3" /> Try it
                      </button>
                      <span className={`text-[10px] ${subText}`}>Runs against sandbox data</span>
                    </div>
                    {tried && (
                      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-white'} overflow-hidden`}>
                        <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-slate-100 bg-gray-50'}`}>
                          <Braces className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] font-semibold text-emerald-400">200 OK</span>
                          <span className={`ml-auto text-[10px] ${subText}`}>application/json</span>
                        </div>
                        <pre className={`text-[10px] font-mono px-3 py-2 overflow-x-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{tried}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══ Sub-tab: Webhooks ════════════════════════════════════════════════════════
function WebhooksTab({ isDark }) {
  const [webhooks, setWebhooks]   = useState(INIT_WEBHOOKS);
  const [showModal, setShowModal] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testedId, setTestedId]   = useState(null);
  const [form, setForm]           = useState({ name:'', url:'', events:[] });

  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const border  = isDark ? 'border-gray-700/60' : 'border-slate-200';

  const toggleStatus = (id) => {
    setWebhooks(prev => prev.map(w => w.id === id
      ? { ...w, status: w.status === 'disabled' ? 'active' : 'disabled' }
      : w
    ));
  };

  const deleteWebhook = (id) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const testWebhook = (id) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      setTestedId(id);
      setTimeout(() => setTestedId(null), 3000);
    }, 1400);
  };

  const toggleEvent = (eid) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(eid) ? f.events.filter(e => e !== eid) : [...f.events, eid],
    }));
  };

  const createWebhook = () => {
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) return;
    const newWh = {
      id: `wh_${Date.now()}`,
      name: form.name.trim(),
      url: form.url.trim(),
      events: [...form.events],
      status: 'active',
      secret: 'whsec_••••••••',
      createdAt: new Date().toISOString().slice(0,10),
      lastDelivery: '—',
      successRate: null,
      totalDeliveries: 0,
    };
    setWebhooks(prev => [newWh, ...prev]);
    setShowModal(false);
    setForm({ name:'', url:'', events:[] });
  };

  const statusMeta = {
    active:   { bg:'bg-emerald-500/15', text:'text-emerald-400', label:'Active'   },
    failing:  { bg:'bg-rose-500/15',    text:'text-rose-400',    label:'Failing'  },
    disabled: { bg:'bg-gray-700/40',    text:'text-gray-400',    label:'Disabled' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Webhooks</h3>
          <p className={`text-xs mt-0.5 ${subText}`}>Receive real-time POST requests when events occur in Kernal. Each delivery includes a signature header for verification.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Webhook
        </button>
      </div>

      <div className="space-y-3">
        {webhooks.map(w => {
          const sm = statusMeta[w.status] || statusMeta.disabled;
          return (
            <div key={w.id} className={`rounded-xl border ${border} p-4 ${isDark ? 'bg-gray-800/30' : 'bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{w.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sm.bg} ${sm.text}`}>{sm.label}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-mono text-xs mb-2 ${subText}`}>
                    <Globe className="w-3 h-3" />
                    <span className="truncate">{w.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {w.events.map(ev => (
                      <span key={ev} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{ev}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className={`text-[10px] ${subText}`}>Total deliveries</p>
                      <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{w.totalDeliveries.toLocaleString()}</p>
                    </div>
                    {w.successRate !== null && (
                      <div>
                        <p className={`text-[10px] ${subText}`}>Success rate</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-20 h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                              className={`h-full rounded-full ${w.successRate >= 95 ? 'bg-emerald-500' : w.successRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width:`${w.successRate}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${w.successRate >= 95 ? 'text-emerald-400' : w.successRate >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>{w.successRate}%</span>
                        </div>
                      </div>
                    )}
                    {w.lastDelivery !== '—' && (
                      <div>
                        <p className={`text-[10px] ${subText}`}>Last delivery</p>
                        <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{fmtTs(w.lastDelivery)}</p>
                      </div>
                    )}
                  </div>
                  {w.status === 'failing' && w.failReason && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-xs text-rose-400">{w.failReason}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => testWebhook(w.id)}
                    disabled={testingId === w.id || w.status === 'disabled'}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                      testedId === w.id
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : (isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600' : 'border-slate-200 text-gray-500 hover:border-slate-300')
                    }`}
                  >
                    {testingId === w.id
                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                      : testedId === w.id
                        ? <CheckCircle className="w-3 h-3" />
                        : <Send className="w-3 h-3" />
                    }
                    {testingId === w.id ? 'Sending…' : testedId === w.id ? 'Sent' : 'Test'}
                  </button>
                  <button
                    onClick={() => toggleStatus(w.id)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200' : 'border-slate-200 text-gray-500 hover:text-gray-700'}`}
                  >{w.status === 'disabled' ? 'Enable' : 'Disable'}</button>
                  <button
                    onClick={() => deleteWebhook(w.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  ><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add webhook modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'} overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-slate-100'} flex items-center justify-between`}>
              <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Add Webhook Endpoint</h4>
              <button onClick={() => setShowModal(false)} className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}><XCircle className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Production ERP Receiver"
                  className={`w-full text-sm px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-white border-slate-200 text-gray-800 placeholder-gray-400'} outline-none focus:border-cyan-500`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Endpoint URL</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://yourapp.com/webhooks/kernal"
                  className={`w-full text-sm px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-600' : 'bg-white border-slate-200 text-gray-800 placeholder-gray-400'} outline-none focus:border-cyan-500`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Events to subscribe <span className={`font-normal ${subText}`}>({form.events.length} selected)</span></label>
                <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/40' : 'border-slate-200 bg-gray-50'} divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'} max-h-44 overflow-y-auto`}>
                  {ALL_WEBHOOK_EVENTS.map(ev => (
                    <label key={ev.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'} transition-colors`}>
                      <input
                        type="checkbox"
                        checked={form.events.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        className="accent-cyan-500"
                      />
                      <div>
                        <span className={`text-xs font-mono font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{ev.label}</span>
                        <span className={`ml-2 text-xs ${subText}`}>{ev.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className={`rounded-lg px-3 py-2.5 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'} flex items-start gap-2`}>
                <Lock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>A signing secret will be generated automatically. Use it to verify <code className="font-mono">X-Kernal-Signature</code> headers.</p>
              </div>
            </div>
            <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-800' : 'border-slate-100'} flex justify-end gap-2`}>
              <button onClick={() => setShowModal(false)} className={`text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'} transition-colors`}>Cancel</button>
              <button
                onClick={createWebhook}
                disabled={!form.name.trim() || !form.url.trim() || form.events.length === 0}
                className="text-xs px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-gray-950 font-semibold transition-colors"
              >Register Endpoint</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ Sub-tab: Event Log ═══════════════════════════════════════════════════════
function EventLogTab({ isDark }) {
  const [events]                        = useState(INIT_EVENT_LOG);
  const [typeFilter, setTypeFilter]     = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedEvt, setExpandedEvt]   = useState(null);

  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const border  = isDark ? 'border-gray-700/60' : 'border-slate-200';

  const filtered = useMemo(() => events.filter(e => {
    if (typeFilter !== 'All' && e.type !== typeFilter) return false;
    if (statusFilter === 'Success' && e.statusCode >= 300) return false;
    if (statusFilter === 'Error' && e.statusCode < 300) return false;
    return true;
  }), [events, typeFilter, statusFilter]);

  const MOCK_PAYLOADS = {
    'evt_001': `GET /v1/orders\nAuthorization: Bearer krn_live_4f8a••••\n\nResponse 200 OK (48ms)\n{ "data": [...], "total": 24 }`,
    'evt_002': `POST https://erp.metrorestaurant.com/kernal/events\nX-Kernal-Signature: sha256=abc123••••\nContent-Type: application/json\n\n{\n  "event": "order.created",\n  "id": "SO-9898",\n  "customer_id": "CUST-103",\n  "total": 6580.00,\n  "created_at": "2026-05-27T08:41:00Z"\n}`,
    'evt_007': `POST https://api.custombi.io/ingest/kernal\nX-Kernal-Signature: sha256=def456••••\nContent-Type: application/json\n\n{\n  "event": "invoice.paid",\n  "id": "INV-503",\n  "amount_paid": 12800.00,\n  "paid_at": "2026-05-26T23:00:00Z"\n}\n\nResponse: HTTP 503 Service Unavailable (5001ms)\nAttempt 3 of 3 — marking endpoint as failing`,
    'evt_010': `POST /v1/orders\nAuthorization: Bearer krn_test_2c9e••••\n\n{\n  "customer_id": "CUST-999",\n  "items": []\n}\n\nResponse 422 Unprocessable Entity (22ms)\n{ "error": "customer_id not found", "items": "must not be empty" }`,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Event Log</h3>
          <p className={`text-xs mt-0.5 ${subText}`}>Unified log of API calls and webhook deliveries. Retained for 30 days.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-slate-200 text-gray-600'} outline-none`}
          >
            {['All','api','webhook'].map(v => <option key={v} value={v}>{v === 'All' ? 'All types' : v === 'api' ? 'API calls' : 'Webhooks'}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-slate-200 text-gray-600'} outline-none`}
          >
            {['All','Success','Error'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className={`rounded-xl border ${border} overflow-hidden`}>
        <table className="w-full text-xs">
          <thead>
            <tr className={`${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'} font-medium`}>
              <th className="px-4 py-2.5 text-left">Time</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-left">Endpoint / Event</th>
              <th className="px-4 py-2.5 text-left">Source</th>
              <th className="px-4 py-2.5 text-right">Status</th>
              <th className="px-4 py-2.5 text-right">Latency</th>
              <th className="px-4 py-2.5 text-right" />
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'}`}>
            {filtered.map(ev => {
              const isExpanded = expandedEvt === ev.id;
              const sc = statusColor(ev.statusCode);
              return (<>
                <tr
                  key={ev.id}
                  className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} ${isExpanded ? (isDark ? 'bg-gray-800/40' : 'bg-cyan-50/50') : ''}`}
                  onClick={() => setExpandedEvt(isExpanded ? null : ev.id)}
                >
                  <td className={`px-4 py-2.5 tabular-nums ${subText}`}>{fmtTs(ev.ts)}</td>
                  <td className="px-4 py-2.5">
                    {ev.type === 'api'
                      ? <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-violet-400" /><span className="text-violet-400 font-medium">API</span></span>
                      : <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /><span className="text-amber-400 font-medium">Webhook</span></span>
                    }
                  </td>
                  <td className={`px-4 py-2.5 font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {ev.type === 'api'
                      ? <><span className={`${METHOD_COLORS[ev.method]?.text || 'text-gray-400'} font-bold mr-1.5`}>{ev.method}</span>{ev.endpoint}</>
                      : ev.event
                    }
                  </td>
                  <td className={`px-4 py-2.5 ${subText} max-w-[160px] truncate`}>
                    {ev.type === 'api' ? ev.keyName : ev.webhookName}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${sc}`}>{ev.statusCode}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${ev.latencyMs > 2000 ? 'text-rose-400' : ev.latencyMs > 500 ? 'text-amber-400' : subText}`}>{ev.latencyMs}ms</td>
                  <td className="px-4 py-2.5 text-right">
                    <ChevronRight className={`w-3 h-3 ml-auto ${subText} transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${ev.id}-exp`}>
                    <td colSpan={7} className={`px-4 pb-3 pt-0 ${isDark ? 'bg-gray-900/60' : 'bg-gray-50/80'}`}>
                      <pre className={`text-[10px] font-mono rounded-lg px-3 py-2.5 border whitespace-pre-wrap ${isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-slate-200 text-gray-700'}`}>
                        {MOCK_PAYLOADS[ev.id] || `${ev.type === 'api' ? ev.method + ' ' + ev.endpoint : 'POST ' + (INIT_WEBHOOKS.find(w => w.id === ev.webhookId)?.url || ev.webhookId)}\n\nStatus: ${ev.statusCode}\nLatency: ${ev.latencyMs}ms`}
                      </pre>
                    </td>
                  </tr>
                )}
              </>);
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className={`py-10 text-center text-sm ${subText}`}>No events match the current filters.</div>
        )}
      </div>
    </div>
  );
}

// ═══ Main Module ══════════════════════════════════════════════════════════════
export default function DeveloperAPIModule() {
  const { isDark } = useKernal();
  const [tab, setTab] = useState('keys');

  const TABS = [
    { id: 'keys',     label: 'API Keys',     Icon: Key      },
    { id: 'explorer', label: 'API Explorer', Icon: Terminal },
    { id: 'webhooks', label: 'Webhooks',     Icon: Zap      },
    { id: 'log',      label: 'Event Log',    Icon: Activity },
  ];

  const surface  = isDark ? 'bg-gray-900'      : 'bg-white';
  const border   = isDark ? 'border-gray-800'  : 'border-slate-200';
  const subText  = isDark ? 'text-gray-400'    : 'text-gray-500';

  // Summary stats
  const liveKeys    = INIT_API_KEYS.filter(k => k.status === 'active' && k.env === 'live').length;
  const activeWhs   = INIT_WEBHOOKS.filter(w => w.status === 'active').length;
  const failingWhs  = INIT_WEBHOOKS.filter(w => w.status === 'failing').length;
  const todayReqs   = INIT_EVENT_LOG.filter(e => e.ts.startsWith('2026-05-27')).length;

  return (
    <div className={`h-full flex flex-col gap-0 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>

      {/* Header */}
      <div className={`px-6 py-4 border-b ${border} flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">Developer API</h2>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 ml-1`}>v1</span>
          </div>
          <p className={`text-xs mt-0.5 ${subText}`}>REST API, webhooks, and event log for {COMPANY_INFO.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-[10px] ${subText}`}>Base URL</p>
            <p className="text-xs font-mono text-cyan-400">{COMPANY_INFO.apiBase}</p>
          </div>
          <a
            href="#"
            onClick={e => e.preventDefault()}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600' : 'border-slate-200 text-gray-500 hover:border-slate-300'} transition-colors`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Docs
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div className={`px-6 py-3 border-b ${border} flex items-center gap-6`}>
        {[
          { label:'Live API keys',       val: liveKeys,    color:'text-emerald-400' },
          { label:'Active webhooks',     val: activeWhs,   color:'text-cyan-400'    },
          { label:'Failing webhooks',    val: failingWhs,  color: failingWhs > 0 ? 'text-rose-400' : subText },
          { label:"Today's API requests",val: todayReqs,   color:'text-violet-400'  },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`text-xl font-bold tabular-nums ${s.color}`}>{s.val}</span>
            <span className={`text-xs ${subText}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className={`px-6 pt-3 border-b ${border} flex gap-0`}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors mr-1 ${
              tab === t.id
                ? 'border-cyan-500 text-cyan-400'
                : `border-transparent ${subText} hover:text-gray-200`
            }`}
          >
            <t.Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === 'keys'     && <ApiKeysTab     isDark={isDark} />}
        {tab === 'explorer' && <ApiExplorerTab isDark={isDark} />}
        {tab === 'webhooks' && <WebhooksTab    isDark={isDark} />}
        {tab === 'log'      && <EventLogTab    isDark={isDark} />}
      </div>
    </div>
  );
}
