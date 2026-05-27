import { useState, useMemo } from 'react';
import {
  ShoppingBag, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock,
  Plus, Package, Truck, ExternalLink, ChevronDown, ChevronRight,
  ArrowDownToLine, ToggleLeft, ToggleRight, Filter, Search,
  TrendingUp, BarChart2, Globe, Tag, Zap, Send, Activity,
  CircleCheck, CircleDot,
} from 'lucide-react';
import { useKernal } from './KernalContext.jsx';
import { DEMO_MODE } from './lib/demoMode.js';

// ── Local Company Info (Rolldown IIFE TDZ fix) ────────────────────────────────
const COMPANY_INFO = {
  name:    'Kernel Food Distribution LLC',
  email:   'purchasing@kernaldist.com',
};

// ── Channel connection data ───────────────────────────────────────────────────
const INIT_CHANNELS = [
  {
    id: 'shopify',
    platform: 'Shopify',
    shopHandle: 'kernal-foods.myshopify.com',
    plan: 'Shopify Plus',
    status: 'connected',
    lastSync: '2026-05-27T08:30:00',
    productsSynced: 42,
    ordersImported: 187,
    pendingOrders: 3,
    revenueThisMonth: 24810.00,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    syncSettings: { inventory: true, pricing: true, orders: true, fulfillment: true },
  },
  {
    id: 'amazon',
    platform: 'Amazon Business',
    shopHandle: 'Seller ID: A1B2KFD4E5F6G7',
    plan: 'Amazon Business Prime',
    status: 'connected',
    lastSync: '2026-05-27T07:45:00',
    productsSynced: 28,
    ordersImported: 94,
    pendingOrders: 1,
    revenueThisMonth: 11340.00,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    syncSettings: { inventory: true, pricing: false, orders: true, fulfillment: false },
  },
  {
    id: 'woocommerce',
    platform: 'WooCommerce',
    shopHandle: 'kernaldist.com/shop',
    plan: '—',
    status: 'available',
    lastSync: null,
    productsSynced: 0,
    ordersImported: 0,
    pendingOrders: 0,
    revenueThisMonth: 0,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    syncSettings: { inventory: false, pricing: false, orders: false, fulfillment: false },
  },
];

// ── Catalog products ──────────────────────────────────────────────────────────
const INIT_CATALOG = [
  { id: 'cat_001', sku: 'FRZ-BEEF-01',  name: 'Ground Beef 80/20 — 10lb Case',  category: 'Proteins',  unitPrice: 85.50,  channels: { shopify: 'live',      amazon: 'live'    }, shopifyHandle: 'ground-beef-8020',    asin: 'B08FRZ001', lastSynced: '2026-05-27T08:30:00', inStock: true  },
  { id: 'cat_002', sku: 'PLT-CHICK-05', name: 'Chicken Thighs Boneless — 5lb',  category: 'Proteins',  unitPrice: 42.00,  channels: { shopify: 'live',      amazon: 'live'    }, shopifyHandle: 'chicken-thighs-5lb',  asin: 'B08PLT005', lastSynced: '2026-05-27T08:30:00', inStock: true  },
  { id: 'cat_003', sku: 'PRO-TOMA-01',  name: 'Roma Tomatoes 25lb Case',        category: 'Produce',   unitPrice: 22.00,  channels: { shopify: 'live',      amazon: 'draft'   }, shopifyHandle: 'roma-tomatoes-25lb',  asin: null,        lastSynced: '2026-05-27T08:30:00', inStock: true  },
  { id: 'cat_004', sku: 'DAI-MILK-02',  name: 'Whole Milk 1 Gallon',            category: 'Dairy',     unitPrice: 4.50,   channels: { shopify: 'live',      amazon: 'unlisted'}, shopifyHandle: 'whole-milk-1gal',     asin: null,        lastSynced: '2026-05-27T08:30:00', inStock: true  },
  { id: 'cat_005', sku: 'DRY-RICE-05',  name: 'Long Grain White Rice 50lb',     category: 'Dry Goods', unitPrice: 32.00,  channels: { shopify: 'live',      amazon: 'live'    }, shopifyHandle: 'white-rice-50lb',     asin: 'B08DRY005', lastSynced: '2026-05-27T08:30:00', inStock: true  },
  { id: 'cat_006', sku: 'DAI-CHE-02',   name: 'Shredded Mozzarella 5lb Bag',    category: 'Dairy',     unitPrice: 18.50,  channels: { shopify: 'live',      amazon: 'error'   }, shopifyHandle: 'mozz-shredded-5lb',  asin: 'B08DAI006', lastSynced: '2026-05-26T14:20:00', inStock: true  },
  { id: 'cat_007', sku: 'DRY-OIL-5G',   name: 'Canola Oil 35lb Jug',            category: 'Dry Goods', unitPrice: 42.00,  channels: { shopify: 'draft',     amazon: 'live'    }, shopifyHandle: null,                  asin: 'B08OIL007', lastSynced: '2026-05-27T07:45:00', inStock: true  },
  { id: 'cat_008', sku: 'BAK-BUN-01',   name: 'Brioche Burger Buns 12ct',       category: 'Bakery',    unitPrice: 8.75,   channels: { shopify: 'unlisted',  amazon: 'unlisted'}, shopifyHandle: null,                  asin: null,        lastSynced: null,                  inStock: false },
  { id: 'cat_009', sku: 'FRZ-SALM-01',  name: 'Atlantic Salmon Fillet 4-6oz',   category: 'Seafood',   unitPrice: 94.00,  channels: { shopify: 'live',      amazon: 'live'    }, shopifyHandle: 'salmon-fillet-4-6oz', asin: 'B08SAL009', lastSynced: '2026-05-27T08:30:00', inStock: false },
  { id: 'cat_010', sku: 'PRO-LETT-01',  name: 'Romaine Hearts 24ct Case',       category: 'Produce',   unitPrice: 28.00,  channels: { shopify: 'live',      amazon: 'draft'   }, shopifyHandle: 'romaine-hearts-24ct', asin: null,        lastSynced: '2026-05-27T08:30:00', inStock: true  },
];

// ── Inbound orders from channels ──────────────────────────────────────────────
const INIT_CHANNEL_ORDERS = [
  { id: 'SH-88210', channel: 'shopify',  customerName: 'Riverside Diner',       email: 'orders@riversidediner.com',     items: [{ sku:'FRZ-BEEF-01', qty:3 }, { sku:'PLT-CHICK-05', qty:2 }], total:  341.50, status: 'new',       placedAt: '2026-05-27T08:12:00', kernalSO: null                    },
  { id: 'SH-88211', channel: 'shopify',  customerName: 'Oak Street Kitchen',    email: 'chef@oakstreetkitchen.com',     items: [{ sku:'DRY-RICE-05', qty:4 }, { sku:'DAI-CHE-02', qty:2 }],  total:  165.00, status: 'new',       placedAt: '2026-05-27T07:55:00', kernalSO: null                    },
  { id: 'SH-88208', channel: 'shopify',  customerName: 'The Patty Shack',       email: 'thm@pattyshack.com',            items: [{ sku:'FRZ-BEEF-01', qty:5 }, { sku:'BAK-BUN-01', qty:10 }], total:  515.00, status: 'imported',  placedAt: '2026-05-26T19:30:00', kernalSO: 'SO-9912'               },
  { id: 'AMZ-4419882', channel: 'amazon', customerName: 'Sunrise Cafe',         email: 'purchasing@sunrisecafe.biz',    items: [{ sku:'DRY-OIL-5G', qty:6 }],                                 total:  252.00, status: 'new',       placedAt: '2026-05-27T06:44:00', kernalSO: null                    },
  { id: 'SH-88205', channel: 'shopify',  customerName: 'City Sandwich Co.',     email: 'ops@citysandwich.co',           items: [{ sku:'PLT-CHICK-05', qty:4 }, { sku:'PRO-LETT-01', qty:2 }], total:  224.00, status: 'imported',  placedAt: '2026-05-26T14:10:00', kernalSO: 'SO-9908'               },
  { id: 'SH-88203', channel: 'shopify',  customerName: 'Harbor Bowl + Grill',   email: 'stock@harborbowl.com',          items: [{ sku:'FRZ-SALM-01', qty:2 }, { sku:'PRO-TOMA-01', qty:3 }], total:  254.00, status: 'fulfilled', placedAt: '2026-05-25T11:20:00', kernalSO: 'SO-9902', trackingNum: '1Z999AA10123456784' },
  { id: 'AMZ-4418771', channel: 'amazon', customerName: 'North End Bistro',     email: 'orders@northendbistro.com',     items: [{ sku:'FRZ-BEEF-01', qty:2 }, { sku:'DRY-RICE-05', qty:2 }], total:  235.00, status: 'fulfilled', placedAt: '2026-05-25T09:05:00', kernalSO: 'SO-9900', trackingNum: '1Z999BB10198765432' },
  { id: 'SH-88199', channel: 'shopify',  customerName: 'The Breakfast Table',   email: 'buyer@breakfasttable.net',      items: [{ sku:'DAI-MILK-02', qty:20 }],                                total:   90.00, status: 'fulfilled', placedAt: '2026-05-24T16:45:00', kernalSO: 'SO-9895', trackingNum: '1Z999CC10234567890' },
];

// ── Sync log ──────────────────────────────────────────────────────────────────
const INIT_SYNC_LOG = [
  { id:'sl_001', ts:'2026-05-27T08:30:00', channel:'shopify', type:'inventory_push',   status:'success', records:42, detail:'Inventory levels pushed for 42 products'              },
  { id:'sl_002', ts:'2026-05-27T08:30:00', channel:'shopify', type:'order_pull',       status:'success', records:3,  detail:'3 new orders imported from Shopify'                    },
  { id:'sl_003', ts:'2026-05-27T08:30:00', channel:'shopify', type:'pricing_push',     status:'success', records:42, detail:'Prices updated on 42 Shopify listings'                 },
  { id:'sl_004', ts:'2026-05-27T07:45:00', channel:'amazon',  type:'inventory_push',   status:'success', records:28, detail:'Inventory quantities updated on 28 Amazon listings'    },
  { id:'sl_005', ts:'2026-05-27T07:45:00', channel:'amazon',  type:'order_pull',       status:'success', records:1,  detail:'1 new order imported from Amazon Business'             },
  { id:'sl_006', ts:'2026-05-27T07:45:00', channel:'amazon',  type:'listing_sync',     status:'warning', records:1,  detail:'1 listing error: DAI-CHE-02 — ASIN suppressed by Amazon (pricing policy)' },
  { id:'sl_007', ts:'2026-05-26T20:00:00', channel:'shopify', type:'fulfillment_push', status:'success', records:2,  detail:'Fulfillment & tracking pushed for SO-9902, SO-9908'    },
  { id:'sl_008', ts:'2026-05-26T08:30:00', channel:'shopify', type:'inventory_push',   status:'success', records:42, detail:'Inventory levels pushed for 42 products'              },
  { id:'sl_009', ts:'2026-05-26T08:30:00', channel:'amazon',  type:'inventory_push',   status:'error',   records:0,  detail:'Sync failed: Amazon SP-API rate limit exceeded — retrying in 30 min' },
  { id:'sl_010', ts:'2026-05-26T09:00:00', channel:'amazon',  type:'inventory_push',   status:'success', records:28, detail:'Retry successful — inventory pushed for 28 listings'   },
];

const CHANNEL_META = {
  shopify: { label:'Shopify', color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/25', dot:'bg-emerald-400' },
  amazon:  { label:'Amazon Business', color:'text-amber-400',  bg:'bg-amber-500/10',  border:'border-amber-500/25',  dot:'bg-amber-400'  },
};

const STATUS_META = {
  live:      { label:'Live',      bg:'bg-emerald-500/15', text:'text-emerald-400' },
  draft:     { label:'Draft',     bg:'bg-amber-500/15',   text:'text-amber-400'   },
  unlisted:  { label:'Not Listed',bg:'bg-gray-700/40',    text:'text-gray-400'    },
  error:     { label:'Error',     bg:'bg-rose-500/15',    text:'text-rose-400'    },
};

const ORDER_STATUS_META = {
  new:       { label:'New',       bg:'bg-blue-500/15',    text:'text-blue-400',    Icon: CircleDot    },
  imported:  { label:'Imported',  bg:'bg-violet-500/15',  text:'text-violet-400',  Icon: ArrowDownToLine },
  fulfilled: { label:'Fulfilled', bg:'bg-emerald-500/15', text:'text-emerald-400', Icon: CircleCheck  },
};

const SYNC_TYPE_LABELS = {
  inventory_push:   'Inventory Push',
  order_pull:       'Order Pull',
  pricing_push:     'Pricing Push',
  listing_sync:     'Listing Sync',
  fulfillment_push: 'Fulfillment Push',
};

function fmtTs(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

// ── Shopify SVG logo ──────────────────────────────────────────────────────────
function ShopifyLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 109 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M95.5 23.4c-.1-.7-.7-1.1-1.2-1.1-.5 0-9.7-.7-9.7-.7s-6.4-6.4-7.1-7.1c-.7-.7-2-.5-2.5-.3l-3.5 1.1c-2.1-6-5.8-11.5-12.2-11.5h-.6C57.1 2.1 55.2.8 53 .8c-16.5.1-24.4 20.6-26.8 31.1l-11.5 3.6c-3.6 1.1-3.7 1.2-4.2 4.6L.5 109.6l75 14.1 40.6-8.8L95.5 23.4zM69.2 18.1l-5.7 1.8c0-.5 0-1-.1-1.5-.5-7.3-2-10.9-4.2-13.1 4 1.2 7.3 6.3 10 12.8zM52.7 5.9c.3.1.6.2.9.4-3.4 3.2-5.7 8.4-6.5 16.5l-8.7 2.7C40.5 17.6 46.3 6.4 52.7 5.9zM47 56c0 0 3.8 1 8.4 1 3.5 0 7.8-.9 11.6-3.9 0 0 1.4 9.1-9 14.5-10.3 5.5-19.7-4.1-19.7-4.1L47 56z" fill="#95BF47"/>
      <path d="M94.3 22.3c-.5 0-9.7-.7-9.7-.7s-6.4-6.4-7.1-7.1c-.3-.3-.6-.4-.9-.4l-4.7 96.6 40.6-8.8-17-79.3c-.1-.6-.7-1-1.2-.3z" fill="#5E8E3E"/>
      <path d="M59.4 42.4l-5 14.9s-4.4-2.3-9.8-2.3c-7.9 0-8.3 5-8.3 6.2 0 6.8 17.7 9.4 17.7 25.3 0 12.5-7.9 20.6-18.6 20.6-12.8 0-19.3-8-19.3-8l3.4-11.3s6.7 5.8 12.4 5.8c3.7 0 5.2-2.9 5.2-5 0-8.9-14.5-9.3-14.5-23.8 0-12.3 8.8-24.1 26.6-24.1 6.8-.1 10.2 2 10.2 1.7z" fill="#fff"/>
    </svg>
  );
}

// ── Amazon Business SVG icon (simplified) ─────────────────────────────────────
function AmazonLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="12" fill="#FF9900"/>
      <text x="50" y="68" textAnchor="middle" fill="white" fontSize="52" fontWeight="bold" fontFamily="Arial, sans-serif">a</text>
      <path d="M20 72 Q50 84 80 72" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M76 68 L83 72 L78 76" fill="white"/>
    </svg>
  );
}

// ── Sub-tab: Channels ─────────────────────────────────────────────────────────
function ChannelsTab({ isDark }) {
  const [channels, setChannels] = useState(DEMO_MODE ? INIT_CHANNELS : []);
  const [syncing, setSyncing]   = useState(null);
  const [toast, setToast]       = useState(null);

  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const border  = isDark ? 'border-gray-700/60' : 'border-slate-200';

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSync = (id) => {
    setSyncing(id);
    setTimeout(() => {
      setSyncing(null);
      setChannels(prev => prev.map(c => c.id === id
        ? { ...c, lastSync: new Date().toISOString() }
        : c
      ));
      notify(`${INIT_CHANNELS.find(c => c.id === id)?.platform} sync complete`);
    }, 2200);
  };

  const toggleSetting = (channelId, key) => {
    setChannels(prev => prev.map(c => c.id === channelId
      ? { ...c, syncSettings: { ...c.syncSettings, [key]: !c.syncSettings[key] } }
      : c
    ));
  };

  return (
    <div className="space-y-4">
      {/* Mini-toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          <CheckCircle className="w-4 h-4" />{toast.msg}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {channels.map(ch => {
          const isConnected = ch.status === 'connected';
          const isSyncing   = syncing === ch.id;
          return (
            <div key={ch.id} className={`rounded-xl border ${isDark ? 'bg-gray-800/40' : 'bg-white'} ${ch.status === 'available' ? (isDark ? 'border-gray-700/40 opacity-60' : 'border-slate-200 opacity-60') : border} p-5 flex flex-col gap-4`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {ch.id === 'shopify' ? <ShopifyLogo size={28} /> : ch.id === 'amazon' ? <AmazonLogo size={28} /> : <Globe className="w-7 h-7 text-violet-400" />}
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{ch.platform}</p>
                    <p className={`text-[10px] font-mono ${subText}`}>{ch.shopHandle}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  isConnected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700/40 text-gray-400'
                }`}>{isConnected ? 'Connected' : 'Available'}</span>
              </div>

              {/* Stats */}
              {isConnected && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label:'Products synced', val: ch.productsSynced },
                    { label:'Orders imported',  val: ch.ordersImported },
                    { label:'Pending orders',   val: ch.pendingOrders, highlight: ch.pendingOrders > 0 },
                    { label:'Revenue (MTD)',     val: `$${ch.revenueThisMonth.toLocaleString('en-US', {minimumFractionDigits:2})}` },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg px-3 py-2 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                      <p className={`text-[10px] ${subText}`}>{s.label}</p>
                      <p className={`text-sm font-bold tabular-nums ${s.highlight ? 'text-blue-400' : (isDark ? 'text-gray-100' : 'text-gray-800')}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sync settings */}
              {isConnected && (
                <div className={`rounded-lg border ${isDark ? 'border-gray-700/40' : 'border-slate-100'} divide-y ${isDark ? 'divide-gray-700/40' : 'divide-slate-100'}`}>
                  {Object.entries(ch.syncSettings).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-1.5">
                      <span className={`text-xs capitalize ${subText}`}>{key.replace('_', ' ')}</span>
                      <button onClick={() => toggleSetting(ch.id, key)}>
                        {enabled
                          ? <ToggleRight className={`w-5 h-5 ${ch.id === 'shopify' ? 'text-emerald-400' : 'text-amber-400'}`} />
                          : <ToggleLeft  className="w-5 h-5 text-gray-600" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto">
                {isConnected ? (<>
                  <button
                    onClick={() => handleSync(ch.id)}
                    disabled={isSyncing}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${isDark ? 'border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white' : 'border-slate-200 text-gray-600 hover:border-slate-300'}`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing…' : 'Sync Now'}
                  </button>
                  <p className={`text-[10px] ${subText}`}>Last: {fmtTs(ch.lastSync)}</p>
                </>) : (
                  <button
                    onClick={() => notify(`${ch.platform} OAuth flow would open here`, 'success')}
                    className="flex-1 text-xs py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold transition-colors"
                  >Connect</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Combined stats strip */}
      <div className={`rounded-xl border ${border} ${isDark ? 'bg-gray-800/30' : 'bg-white'} p-4`}>
        <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Combined Channel Performance — May 2026</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label:'Total orders',    val:'281', sub:'+12% vs Apr', color:'text-violet-400' },
            { label:'Channel revenue', val:'$36,150',sub:'Shopify 69% · Amazon 31%', color:'text-emerald-400' },
            { label:'Products active', val:'56',   sub:'across 2 channels', color:'text-cyan-400' },
            { label:'Avg order value', val:'$128.65',sub:'↑ $14 vs prior month', color:'text-amber-400' },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className={`text-xs ${isDark ? 'text-gray-100' : 'text-gray-700'} font-medium`}>{s.label}</p>
              <p className={`text-[10px] ${subText}`}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-tab: Catalog Sync ─────────────────────────────────────────────────────
function CatalogTab({ isDark }) {
  const [catalog, setCatalog] = useState(DEMO_MODE ? INIT_CATALOG : []);
  const [search, setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [syncing, setSyncing] = useState(null);
  const [toast, setToast]     = useState(null);

  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const border  = isDark ? 'border-gray-700/60' : 'border-slate-200';

  const categories = ['All', ...Array.from(new Set(INIT_CATALOG.map(p => p.category)))];

  const filtered = useMemo(() => catalog.filter(p => {
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [catalog, catFilter, search]);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleSyncProduct = (id, channel) => {
    setSyncing(`${id}-${channel}`);
    setTimeout(() => {
      setSyncing(null);
      setCatalog(prev => prev.map(p => p.id === id
        ? { ...p, channels: { ...p.channels, [channel]: 'live' }, lastSynced: new Date().toISOString() }
        : p
      ));
      notify('Product synced successfully');
    }, 1400);
  };

  return (
    <div className="space-y-3">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium bg-emerald-500 text-white">
          <CheckCircle className="w-4 h-4" />{toast}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 flex-1 max-w-xs px-3 py-1.5 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
          <Search className={`w-3.5 h-3.5 ${subText} shrink-0`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products or SKUs…"
            className={`flex-1 text-xs bg-transparent outline-none ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
          />
        </div>
        <div className="flex gap-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                catFilter === c
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : (isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200' : 'border-slate-200 text-gray-500 hover:text-gray-700')
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl border ${border} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              <th className="px-4 py-2.5 text-left">Product</th>
              <th className="px-4 py-2.5 text-left">Category</th>
              <th className="px-4 py-2.5 text-right">Unit Price</th>
              <th className="px-4 py-2.5 text-center">Shopify</th>
              <th className="px-4 py-2.5 text-center">Amazon</th>
              <th className="px-4 py-2.5 text-left">Last Synced</th>
              <th className="px-4 py-2.5 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'}`}>
            {filtered.map(p => (
              <tr key={p.id} className={`${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                <td className="px-4 py-3">
                  <p className={`font-medium text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{p.name}</p>
                  <p className={`text-[10px] font-mono ${subText}`}>{p.sku}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{p.category}</span>
                </td>
                <td className={`px-4 py-3 text-right text-sm tabular-nums font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>${p.unitPrice.toFixed(2)}</td>
                {['shopify','amazon'].map(channel => {
                  const st = STATUS_META[p.channels[channel]] || STATUS_META.unlisted;
                  const sid = `${p.id}-${channel}`;
                  return (
                    <td key={channel} className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>{st.label}</span>
                        {(p.channels[channel] === 'draft' || p.channels[channel] === 'unlisted' || p.channels[channel] === 'error') && (
                          <button
                            onClick={() => handleSyncProduct(p.id, channel)}
                            disabled={syncing === sid}
                            className={`text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50`}
                          >{syncing === sid ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : 'Sync →'}</button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className={`px-4 py-3 text-xs ${subText}`}>{fmtTs(p.lastSynced)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-medium ${p.inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {p.inStock ? 'In Stock' : 'OOS'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sub-tab: Orders ────────────────────────────────────────────────────────────
function OrdersTab({ isDark }) {
  const [orders, setOrders]       = useState(DEMO_MODE ? INIT_CHANNEL_ORDERS : []);
  const [statusFilter, setFilter] = useState('All');
  const [expanded, setExpanded]   = useState(null);
  const [importing, setImporting] = useState(null);
  const [toast, setToast]         = useState(null);

  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const border  = isDark ? 'border-gray-700/60' : 'border-slate-200';

  const skuMap = Object.fromEntries(INIT_CATALOG.map(p => [p.sku, p.name]));

  const filtered = useMemo(() => orders.filter(o =>
    statusFilter === 'All' || o.status === statusFilter
  ), [orders, statusFilter]);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleImport = (id) => {
    setImporting(id);
    setTimeout(() => {
      setImporting(null);
      const soNum = `SO-${9920 + Math.floor(Math.random() * 10)}`;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status:'imported', kernalSO: soNum } : o));
      notify(`Order ${id} imported as ${soNum}`);
    }, 1600);
  };

  const newCount = orders.filter(o => o.status === 'new').length;

  return (
    <div className="space-y-3">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium bg-emerald-500 text-white">
          <CheckCircle className="w-4 h-4" />{toast}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {['All','new','imported','fulfilled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : (isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200' : 'border-slate-200 text-gray-500 hover:text-gray-700')
              }`}
            >
              {s === 'All' ? 'All' : ORDER_STATUS_META[s]?.label}
              {s === 'new' && newCount > 0 && (
                <span className="ml-1.5 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">{newCount}</span>
              )}
            </button>
          ))}
        </div>
        {newCount > 0 && (
          <button
            onClick={() => {
              orders.filter(o => o.status === 'new').forEach(o => handleImport(o.id));
            }}
            className="flex items-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-400 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" /> Import All New ({newCount})
          </button>
        )}
      </div>

      {/* Orders list */}
      <div className={`rounded-xl border ${border} overflow-hidden divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'}`}>
        {filtered.map(o => {
          const cm = CHANNEL_META[o.channel];
          const sm = ORDER_STATUS_META[o.status];
          const isExp = expanded === o.id;
          return (
            <div key={o.id}>
              <button
                onClick={() => setExpanded(isExp ? null : o.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} ${isExp ? (isDark ? 'bg-gray-800/40' : 'bg-cyan-50/40') : ''}`}
              >
                {/* Channel badge */}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${cm.bg} ${cm.color} ${cm.border}`}>{cm.label.replace(' Business','')}</span>
                {/* Order ID */}
                <span className={`font-mono text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} w-28 shrink-0`}>{o.id}</span>
                {/* Customer */}
                <span className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'} flex-1 truncate`}>{o.customerName}</span>
                {/* Items summary */}
                <span className={`text-xs ${subText} w-36 truncate hidden md:block`}>{o.items.map(i => `${i.qty}× ${i.sku}`).join(', ')}</span>
                {/* Total */}
                <span className={`text-sm font-semibold tabular-nums w-20 text-right ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>${o.total.toFixed(2)}</span>
                {/* Status */}
                <div className={`flex items-center gap-1 w-28 justify-end`}>
                  <sm.Icon className={`w-3.5 h-3.5 ${sm.text}`} />
                  <span className={`text-xs font-semibold ${sm.text}`}>{sm.label}</span>
                </div>
                {/* Date */}
                <span className={`text-xs ${subText} w-20 text-right shrink-0`}>{fmtDate(o.placedAt)}</span>
                <ChevronDown className={`w-3.5 h-3.5 ${subText} transition-transform shrink-0 ${isExp ? 'rotate-180' : ''}`} />
              </button>

              {isExp && (
                <div className={`px-4 pb-4 pt-1 space-y-3 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/80'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${subText}`}>Order Items</p>
                      <div className={`rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/40' : 'border-slate-200 bg-white'} divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'}`}>
                        {o.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2">
                            <div>
                              <p className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{skuMap[item.sku] || item.sku}</p>
                              <p className={`text-[10px] font-mono ${subText}`}>{item.sku}</p>
                            </div>
                            <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>×{item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${subText}`}>Customer</p>
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{o.customerName}</p>
                        <p className={`text-xs ${subText}`}>{o.email}</p>
                      </div>
                      {o.kernalSO && (
                        <div>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${subText}`}>Kernel Sales Order</p>
                          <p className="text-xs font-mono text-cyan-400 font-semibold">{o.kernalSO}</p>
                        </div>
                      )}
                      {o.trackingNum && (
                        <div>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${subText}`}>Tracking Number</p>
                          <p className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{o.trackingNum}</p>
                        </div>
                      )}
                      {o.status === 'new' && (
                        <button
                          onClick={() => handleImport(o.id)}
                          disabled={importing === o.id}
                          className="w-full flex items-center justify-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
                        >
                          {importing === o.id
                            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing…</>
                            : <><ArrowDownToLine className="w-3.5 h-3.5" /> Import to Kernel</>
                          }
                        </button>
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

// ── Sub-tab: Sync Log ──────────────────────────────────────────────────────────
function SyncLogTab({ isDark }) {
  const [channelFilter, setChannelFilter] = useState('All');

  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const border  = isDark ? 'border-gray-700/60' : 'border-slate-200';

  const filtered = useMemo(() =>
    INIT_SYNC_LOG.filter(e => channelFilter === 'All' || e.channel === channelFilter)
  , [channelFilter]);

  const statusIcon = (s) => {
    if (s === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    if (s === 'warning') return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
    return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {['All','shopify','amazon'].map(c => {
          const cm = CHANNEL_META[c];
          return (
            <button
              key={c}
              onClick={() => setChannelFilter(c)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize transition-colors ${
                channelFilter === c
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : (isDark ? 'border-gray-700 text-gray-400 hover:text-gray-200' : 'border-slate-200 text-gray-500 hover:text-gray-700')
              }`}
            >{c === 'All' ? 'All Channels' : cm?.label}</button>
          );
        })}
      </div>

      <div className={`rounded-xl border ${border} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
              <th className="px-4 py-2.5 text-left">Time</th>
              <th className="px-4 py-2.5 text-left">Channel</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-right">Records</th>
              <th className="px-4 py-2.5 text-left">Detail</th>
              <th className="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-slate-100'}`}>
            {filtered.map(e => {
              const cm = CHANNEL_META[e.channel] || CHANNEL_META.shopify;
              return (
                <tr key={e.id} className={`${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-4 py-2.5 text-xs tabular-nums ${subText}`}>{fmtTs(e.ts)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cm.bg} ${cm.color} ${cm.border}`}>{cm.label.replace(' Business','')}</span>
                  </td>
                  <td className={`px-4 py-2.5 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{SYNC_TYPE_LABELS[e.type] || e.type}</td>
                  <td className={`px-4 py-2.5 text-right text-xs tabular-nums font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{e.records}</td>
                  <td className={`px-4 py-2.5 text-xs ${e.status === 'error' ? 'text-rose-400' : e.status === 'warning' ? 'text-amber-400' : subText} max-w-xs`}>{e.detail}</td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex justify-center">{statusIcon(e.status)}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══ Main Module ══════════════════════════════════════════════════════════════
export default function EcommerceModule() {
  const { isDark } = useKernal();
  const [tab, setTab] = useState('channels');

  const TABS = [
    { id: 'channels', label: 'Channels',     Icon: Globe         },
    { id: 'catalog',  label: 'Catalog Sync', Icon: Package       },
    { id: 'orders',   label: 'Order Import', Icon: ArrowDownToLine},
    { id: 'synclog',  label: 'Sync Log',     Icon: Activity      },
  ];

  const border  = isDark ? 'border-gray-800'  : 'border-slate-200';
  const subText = isDark ? 'text-gray-400'    : 'text-gray-500';

  // Header stats
  const newOrders   = INIT_CHANNEL_ORDERS.filter(o => o.status === 'new').length;
  const totalOrders = INIT_CHANNEL_ORDERS.length;
  const activeProducts = INIT_CATALOG.filter(p => p.channels.shopify === 'live' || p.channels.amazon === 'live').length;
  const syncErrors = INIT_SYNC_LOG.filter(e => e.status === 'error').length;
  const syncWarnings = INIT_SYNC_LOG.filter(e => e.status === 'warning').length;

  return (
    <div className={`h-full flex flex-col ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>

      {/* Header */}
      <div className={`px-6 py-4 border-b ${border} flex items-center justify-between`}>
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold">eCommerce & Marketplace</h2>
          </div>
          <p className={`text-xs mt-0.5 ${subText}`}>Shopify and Amazon Business channel connectors for {COMPANY_INFO.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {newOrders > 0 && (
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400`}>
              <ArrowDownToLine className="w-3.5 h-3.5" />
              {newOrders} new order{newOrders > 1 ? 's' : ''} to import
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className={`px-6 py-3 border-b ${border} flex items-center gap-6`}>
        {[
          { label:'Active channels',   val: 2,             color:'text-emerald-400' },
          { label:'New orders',        val: newOrders,     color: newOrders > 0 ? 'text-blue-400' : subText },
          { label:'Products active',   val: activeProducts, color:'text-violet-400' },
          { label:'Sync issues',       val: syncErrors + syncWarnings, color: (syncErrors + syncWarnings) > 0 ? 'text-amber-400' : subText },
          { label:'MTD channel revenue', val:'$36,150',    color:'text-cyan-400' },
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
            {t.id === 'orders' && newOrders > 0 && (
              <span className="ml-0.5 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">{newOrders}</span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === 'channels' && <ChannelsTab isDark={isDark} />}
        {tab === 'catalog'  && <CatalogTab  isDark={isDark} />}
        {tab === 'orders'   && <OrdersTab   isDark={isDark} />}
        {tab === 'synclog'  && <SyncLogTab  isDark={isDark} />}
      </div>
    </div>
  );
}
