import { useState, useMemo } from 'react';
import { useKernal } from './KernalContext.jsx';
import {
  Tag, BookOpen, FileText, Calculator, Plus,
  X, ChevronDown, ChevronUp, Calendar, Users, TrendingDown,
  TrendingUp, Check, Shield, Zap, ArrowRight, Search,
  DollarSign, Sparkles, RefreshCw, AlertTriangle,
} from 'lucide-react';

// Rolldown TDZ fix
const COMPANY_INFO = { name: 'Gulf Coast Foodservice LLC' };

const TODAY_STR = '2026-05-27';

const UI = {
  card:       'bg-gray-900 border border-gray-800 rounded-xl',
  btn:        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
  btnPrimary: 'bg-amber-500 hover:bg-amber-400 text-gray-950',
  btnGhost:   'bg-gray-800 hover:bg-gray-700 text-gray-300',
  btnEmerald: 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/20',
  input:      'bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 w-full',
  select:     'bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 w-full',
  label:      'block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1',
};

const fmt$ = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE DATA
// ─────────────────────────────────────────────────────────────────────────────
const CATALOG = [
  { sku:'FRZ-BEEF-01',  name:'Premium Ground Beef 80/20',     basePrice:85.50,   uom:'case'   },
  { sku:'PLT-CHICK-05', name:'Jumbo Chicken Breasts',          basePrice:42.00,   uom:'case'   },
  { sku:'DAI-MILK-02',  name:'Whole Milk 1 Gal',              basePrice:4.50,    uom:'unit'   },
  { sku:'PRO-TOMA-01',  name:'Roma Tomatoes 25lb',             basePrice:22.00,   uom:'case'   },
  { sku:'DRY-RICE-05',  name:'Jasmine Rice 50lb (Pallet)',     basePrice:1200.00, uom:'pallet' },
  { sku:'DAI-CHE-02',   name:'American Cheese Slices (5 lb)',  basePrice:18.50,   uom:'pack'   },
  { sku:'DRY-OIL-5G',   name:'Vegetable Oil 5 Gal',           basePrice:42.00,   uom:'jug'    },
  { sku:'BAK-BUN-01',   name:'Brioche Burger Buns (12 pk)',    basePrice:8.75,    uom:'pack'   },
];

const CUSTOMERS = [
  { id:'C-101', name:'Armature Works',          segment:'High Volume',  book:'PB-002' },
  { id:'C-102', name:"Bern's Steakhouse",       segment:'Fine Dining',  book:'PB-003' },
  { id:'C-103', name:'Columbia Restaurant',     segment:'Contract',     book:'PB-004' },
  { id:'C-104', name:'Oxford Exchange',         segment:'Contract',     book:'PB-004' },
  { id:'C-105', name:"Eddie V's Prime Seafood", segment:'Fine Dining',  book:'PB-003' },
  { id:'C-106', name:'Datz Tampa',              segment:'Standard',     book:'PB-001' },
  { id:'C-107', name:'The Refinery',            segment:'Standard',     book:'PB-001' },
  { id:'C-108', name:'Mise en Place',           segment:'Fine Dining',  book:'PB-003' },
  { id:'C-109', name:'Ulele',                   segment:'High Volume',  book:'PB-002' },
  { id:'C-110', name:'Dockside Diner',          segment:'Standard',     book:'PB-001' },
  { id:'C-111', name:'Steelbach',              segment:'Standard',     book:'PB-001' },
  { id:'C-112', name:'The Capital Grille',     segment:'Fine Dining',  book:'PB-003' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRICE BOOKS
// ─────────────────────────────────────────────────────────────────────────────
const INIT_PRICE_BOOKS = [
  {
    id:'PB-001', name:'Standard', isDefault:true,
    description:'Default pricing for all unassigned accounts — catalog base prices apply.',
    color:'text-gray-300', bg:'bg-gray-500/10', border:'border-gray-600/40', accent:'border-l-gray-500',
    overrides:[],
  },
  {
    id:'PB-002', name:'Preferred', isDefault:false,
    description:'Reduced rates for high-frequency, high-volume accounts — lower margin, higher velocity.',
    color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/25', accent:'border-l-emerald-500',
    overrides:[
      { sku:'FRZ-BEEF-01',  name:'Premium Ground Beef 80/20',    basePrice:85.50, bookPrice:80.00 },
      { sku:'PLT-CHICK-05', name:'Jumbo Chicken Breasts',         basePrice:42.00, bookPrice:39.00 },
      { sku:'DAI-MILK-02',  name:'Whole Milk 1 Gal',             basePrice:4.50,  bookPrice:4.25  },
      { sku:'BAK-BUN-01',   name:'Brioche Burger Buns (12 pk)',   basePrice:8.75,  bookPrice:8.25  },
    ],
  },
  {
    id:'PB-003', name:'Premium', isDefault:false,
    description:'Fine dining & catering accounts — specialty cuts at above-standard pricing.',
    color:'text-amber-400', bg:'bg-amber-500/10', border:'border-amber-500/25', accent:'border-l-amber-500',
    overrides:[
      { sku:'FRZ-BEEF-01',  name:'Premium Ground Beef 80/20',    basePrice:85.50, bookPrice:88.00 },
      { sku:'PLT-CHICK-05', name:'Jumbo Chicken Breasts',         basePrice:42.00, bookPrice:44.00 },
      { sku:'DAI-CHE-02',   name:'American Cheese Slices (5 lb)', basePrice:18.50, bookPrice:19.50 },
    ],
  },
  {
    id:'PB-004', name:'Contract', isDefault:false,
    description:'Long-term supply agreements — 90-day locked rates with minimum weekly commitments.',
    color:'text-violet-400', bg:'bg-violet-500/10', border:'border-violet-500/25', accent:'border-l-violet-500',
    overrides:[
      { sku:'FRZ-BEEF-01',  name:'Premium Ground Beef 80/20',    basePrice:85.50,   bookPrice:78.00   },
      { sku:'PLT-CHICK-05', name:'Jumbo Chicken Breasts',         basePrice:42.00,   bookPrice:36.50   },
      { sku:'DAI-MILK-02',  name:'Whole Milk 1 Gal',             basePrice:4.50,    bookPrice:4.00    },
      { sku:'DRY-RICE-05',  name:'Jasmine Rice 50lb (Pallet)',    basePrice:1200.00, bookPrice:1100.00 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACTS
// ─────────────────────────────────────────────────────────────────────────────
const INIT_CONTRACTS = [
  { id:'CTR-001', customerId:'C-103', customer:'Columbia Restaurant',   sku:'FRZ-BEEF-01',  skuName:'Premium Ground Beef 80/20', basePrice:85.50, contractPrice:78.00, minWeeklyQty:20, startDate:'2026-01-01', endDate:'2026-09-30', status:'Active',   notes:'Annual agreement — 20 cases/week guaranteed' },
  { id:'CTR-002', customerId:'C-103', customer:'Columbia Restaurant',   sku:'DAI-MILK-02',  skuName:'Whole Milk 1 Gal',          basePrice:4.50,  contractPrice:4.00,  minWeeklyQty:80, startDate:'2026-01-01', endDate:'2026-09-30', status:'Active',   notes:'Part of annual Columbia agreement' },
  { id:'CTR-003', customerId:'C-104', customer:'Oxford Exchange',       sku:'FRZ-BEEF-01',  skuName:'Premium Ground Beef 80/20', basePrice:85.50, contractPrice:79.00, minWeeklyQty:12, startDate:'2026-03-01', endDate:'2026-05-31', status:'Expiring', notes:'Q2 contract — under renewal review' },
  { id:'CTR-004', customerId:'C-104', customer:'Oxford Exchange',       sku:'PLT-CHICK-05', skuName:'Jumbo Chicken Breasts',     basePrice:42.00, contractPrice:37.00, minWeeklyQty:8,  startDate:'2026-06-01', endDate:'2026-11-30', status:'Upcoming', notes:'Q3/Q4 renewal — signed May 15' },
  { id:'CTR-005', customerId:'C-102', customer:"Bern's Steakhouse",    sku:'FRZ-BEEF-01',  skuName:'Premium Ground Beef 80/20', basePrice:85.50, contractPrice:82.00, minWeeklyQty:30, startDate:'2026-02-01', endDate:'2026-07-31', status:'Active',   notes:'Semi-annual — 30 cases/week min, premium cut' },
  { id:'CTR-006', customerId:'C-109', customer:'Ulele',                sku:'PRO-TOMA-01',  skuName:'Roma Tomatoes 25lb',        basePrice:22.00, contractPrice:19.50, minWeeklyQty:15, startDate:'2026-04-01', endDate:'2026-08-31', status:'Active',   notes:'Summer season produce contract' },
  { id:'CTR-007', customerId:'C-101', customer:'Armature Works',       sku:'FRZ-BEEF-01',  skuName:'Premium Ground Beef 80/20', basePrice:85.50, contractPrice:76.00, minWeeklyQty:50, startDate:'2025-10-01', endDate:'2026-03-31', status:'Expired',  notes:'Winter contract — not renewed; moved to Preferred book' },
  { id:'CTR-008', customerId:'C-112', customer:'The Capital Grille',   sku:'PLT-CHICK-05', skuName:'Jumbo Chicken Breasts',     basePrice:42.00, contractPrice:38.00, minWeeklyQty:10, startDate:'2026-07-01', endDate:'2026-12-31', status:'Upcoming', notes:'H2 contract — awaiting final signature' },
];

// ─────────────────────────────────────────────────────────────────────────────
// VOLUME TIERS
// ─────────────────────────────────────────────────────────────────────────────
const INIT_VOLUME_TIERS = [
  { sku:'FRZ-BEEF-01',  name:'Premium Ground Beef 80/20',    basePrice:85.50,   uom:'case',   tiers:[{minQty:1, maxQty:9,   price:85.50},{minQty:10,maxQty:24, price:82.00},{minQty:25,maxQty:null,price:78.50}] },
  { sku:'PLT-CHICK-05', name:'Jumbo Chicken Breasts',         basePrice:42.00,   uom:'case',   tiers:[{minQty:1, maxQty:11,  price:42.00},{minQty:12,maxQty:29, price:40.00},{minQty:30,maxQty:null,price:37.50}] },
  { sku:'DAI-MILK-02',  name:'Whole Milk 1 Gal',             basePrice:4.50,    uom:'unit',   tiers:[{minQty:1, maxQty:49,  price:4.50}, {minQty:50,maxQty:99,  price:4.30}, {minQty:100,maxQty:null,price:4.10}] },
  { sku:'DRY-OIL-5G',   name:'Vegetable Oil 5 Gal',          basePrice:42.00,   uom:'jug',    tiers:[{minQty:1, maxQty:5,   price:42.00},{minQty:6, maxQty:11,  price:40.00},{minQty:12,maxQty:null,price:37.00}] },
  { sku:'BAK-BUN-01',   name:'Brioche Burger Buns (12 pk)',   basePrice:8.75,    uom:'pack',   tiers:[{minQty:1, maxQty:11,  price:8.75}, {minQty:12,maxQty:23,  price:8.40}, {minQty:24,maxQty:null,price:8.00}]  },
  { sku:'PRO-TOMA-01',  name:'Roma Tomatoes 25lb',            basePrice:22.00,   uom:'case',   tiers:[{minQty:1, maxQty:9,   price:22.00},{minQty:10,maxQty:19,  price:21.00},{minQty:20,maxQty:null,price:19.50}] },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROMOTIONS
// ─────────────────────────────────────────────────────────────────────────────
const INIT_PROMOS = [
  { id:'PROMO-001', name:'May Produce Clearance',       sku:'PRO-TOMA-01', skuName:'Roma Tomatoes 25lb',          basePrice:22.00, promoPrice:18.50, startDate:'2026-05-20', endDate:'2026-05-31', minQty:8,  allCustomers:true,  priceBookId:null,    status:'Active',   enabled:true,  description:'Move excess Roma inventory before summer price softening.' },
  { id:'PROMO-002', name:'Dairy Bundle — Preferred',    sku:'DAI-MILK-02',  skuName:'Whole Milk 1 Gal',            basePrice:4.50,  promoPrice:4.00,  startDate:'2026-05-15', endDate:'2026-05-31', minQty:24, allCustomers:false, priceBookId:'PB-002', status:'Active',   enabled:true,  description:'Milk at near-cost for Preferred accounts — increases basket size.' },
  { id:'PROMO-003', name:'Summer Protein Push',         sku:'PLT-CHICK-05', skuName:'Jumbo Chicken Breasts',       basePrice:42.00, promoPrice:37.50, startDate:'2026-06-01', endDate:'2026-06-30', minQty:5,  allCustomers:true,  priceBookId:null,    status:'Upcoming', enabled:true,  description:'Drive chicken volume ahead of summer grilling season.' },
  { id:'PROMO-004', name:"Independence Day Bun Deal",   sku:'BAK-BUN-01',   skuName:'Brioche Burger Buns (12 pk)', basePrice:8.75,  promoPrice:7.50,  startDate:'2026-07-01', endDate:'2026-07-05', minQty:12, allCustomers:true,  priceBookId:null,    status:'Upcoming', enabled:true,  description:'Holiday window — incentivize pre-orders for Jul 4 catering events.' },
  { id:'PROMO-005', name:'Spring Beef Clearance',       sku:'FRZ-BEEF-01',  skuName:'Premium Ground Beef 80/20',   basePrice:85.50, promoPrice:78.00, startDate:'2026-04-01', endDate:'2026-04-15', minQty:10, allCustomers:true,  priceBookId:null,    status:'Expired',  enabled:false, description:'Cleared excess inventory — expired.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRICE RESOLUTION ENGINE
// Hierarchy: Contract > (best of Price Book vs Volume Tier) > Base
// Promotion overlays if it beats the resolved price
// ─────────────────────────────────────────────────────────────────────────────
function resolvePrice(customerId, sku, qty, contracts, promos, priceBooks) {
  const item = CATALOG.find(c => c.sku === sku);
  if (!item) return null;
  const base = item.basePrice;
  const customer = CUSTOMERS.find(c => c.id === customerId);

  // 1. Volume tier
  const tierGroup = INIT_VOLUME_TIERS.find(t => t.sku === sku);
  let tierResult = null;
  if (tierGroup && qty > 0) {
    const tier = tierGroup.tiers.find(t => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty));
    if (tier && tier.price < base) {
      const rangeLabel = tier.maxQty ? `${tier.minQty}–${tier.maxQty}` : `${tier.minQty}+`;
      tierResult = { price: tier.price, label: `${rangeLabel} ${item.uom}s` };
    }
  }

  // 2. Price book override
  let bookResult = null;
  if (customer) {
    const book = priceBooks.find(b => b.id === customer.book);
    if (book) {
      const override = book.overrides.find(o => o.sku === sku);
      if (override) bookResult = { price: override.bookPrice, bookName: book.name };
    }
  }

  // 3. Active contract (lowest active price wins)
  let contractResult = null;
  const activeCtrs = contracts.filter(c =>
    c.customerId === customerId && c.sku === sku &&
    c.status === 'Active' && c.startDate <= TODAY_STR && c.endDate >= TODAY_STR
  );
  if (activeCtrs.length > 0) {
    const best = activeCtrs.reduce((a, b) => a.contractPrice < b.contractPrice ? a : b);
    contractResult = { price: best.contractPrice, id: best.id, endDate: best.endDate };
  }

  // 4. Active promotion (must meet min qty + customer scope)
  let promoResult = null;
  const activePromos = promos.filter(p =>
    p.sku === sku && p.status === 'Active' && p.enabled && qty >= p.minQty &&
    (p.allCustomers || (customer && p.priceBookId === customer.book))
  );
  if (activePromos.length > 0) {
    const best = activePromos.reduce((a, b) => a.promoPrice < b.promoPrice ? a : b);
    promoResult = { price: best.promoPrice, name: best.name, endDate: best.endDate, minQty: best.minQty };
  }

  // Resolution
  let resolved = base;
  let resolvedBy = 'base';

  if (contractResult) {
    resolved = contractResult.price;
    resolvedBy = 'contract';
  } else {
    const candidates = [bookResult?.price, tierResult?.price].filter(p => p != null);
    if (candidates.length > 0) {
      resolved = Math.min(...candidates);
      resolvedBy = resolved === bookResult?.price && bookResult ? 'book' : 'tier';
      // If tied, prefer book
      if (bookResult && tierResult && bookResult.price === tierResult.price) resolvedBy = 'book';
    }
  }

  if (promoResult && promoResult.price < resolved) {
    resolved = promoResult.price;
    resolvedBy = 'promo';
  }

  return { base, resolved, resolvedBy, savings: base - resolved, savingsPct: ((base - resolved) / base * 100), tierResult, bookResult, contractResult, promoResult };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS STYLES
// ─────────────────────────────────────────────────────────────────────────────
const CSTATUS = {
  Active:   { bg:'bg-emerald-500/10', text:'text-emerald-400', border:'border-emerald-500/20', dot:'bg-emerald-500' },
  Expiring: { bg:'bg-amber-500/10',   text:'text-amber-400',   border:'border-amber-500/20',   dot:'bg-amber-400'   },
  Upcoming: { bg:'bg-cyan-500/10',    text:'text-cyan-400',    border:'border-cyan-500/20',     dot:'bg-cyan-400'    },
  Expired:  { bg:'bg-gray-800/50',    text:'text-gray-500',    border:'border-gray-700',        dot:'bg-gray-600'    },
};
const PSTATUS = {
  Active:   { bg:'bg-emerald-500/10', text:'text-emerald-400', border:'border-emerald-500/20' },
  Upcoming: { bg:'bg-cyan-500/10',    text:'text-cyan-400',    border:'border-cyan-500/20'    },
  Expired:  { bg:'bg-gray-800/30',    text:'text-gray-500',    border:'border-gray-700'       },
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PRICE BOOKS
// ─────────────────────────────────────────────────────────────────────────────
function PriceBooksTab({ priceBooks }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-500">{priceBooks.length} price books · {CUSTOMERS.length} accounts assigned</p>
        <button className={`${UI.btn} ${UI.btnPrimary}`}><Plus className="w-3 h-3" /> New Price Book</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {priceBooks.map(book => {
          const bookCustomers = CUSTOMERS.filter(c => c.book === book.id);
          const isExpanded = expandedId === book.id;
          return (
            <div key={book.id} className={`${UI.card} overflow-hidden border-l-4 ${book.accent}`}>
              <button className="w-full text-left px-4 py-4 hover:bg-gray-800/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : book.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-black text-base ${book.color}`}>{book.name}</span>
                      {book.isDefault && <span className="text-[9px] font-bold bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">DEFAULT</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{book.description}</p>
                    <div className="flex items-center gap-4 mt-2.5 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {bookCustomers.length} account{bookCustomers.length !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {book.overrides.length} SKU override{book.overrides.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 mt-1" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-800">
                  {/* Assigned accounts */}
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className={UI.label}>Assigned Accounts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bookCustomers.length === 0
                        ? <span className="text-xs text-gray-600">No accounts assigned</span>
                        : bookCustomers.map(c => (
                          <span key={c.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${book.bg} ${book.border} ${book.color}`}>
                            {c.name}
                          </span>
                        ))
                      }
                    </div>
                  </div>

                  {/* SKU overrides */}
                  <div className="px-4 py-3">
                    <p className={UI.label}>SKU Price Overrides</p>
                    {book.overrides.length === 0
                      ? <p className="text-xs text-gray-600">No overrides — all accounts use catalog base prices.</p>
                      : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-[9px] text-gray-600 uppercase tracking-wider">
                              <th className="text-left pb-2">SKU / Product</th>
                              <th className="text-right pb-2 w-20">Base</th>
                              <th className="text-right pb-2 w-24">Book Price</th>
                              <th className="text-right pb-2 w-14">Δ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/60">
                            {book.overrides.map(o => {
                              const delta = ((o.bookPrice - o.basePrice) / o.basePrice * 100);
                              const isDiscount = delta < 0;
                              return (
                                <tr key={o.sku}>
                                  <td className="py-1.5">
                                    <span className="font-mono text-[9px] text-gray-500 block">{o.sku}</span>
                                    <span className="text-gray-200">{o.name}</span>
                                  </td>
                                  <td className="text-right font-mono text-gray-500 py-1.5">{fmt$(o.basePrice)}</td>
                                  <td className="text-right font-mono font-bold text-gray-100 py-1.5">{fmt$(o.bookPrice)}</td>
                                  <td className={`text-right font-mono font-black py-1.5 ${isDiscount ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )
                    }
                    <button className={`${UI.btn} ${UI.btnGhost} mt-2 text-[10px]`}><Plus className="w-2.5 h-2.5" /> Add Override</button>
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

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CONTRACTS
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_ORDER = { Active: 0, Expiring: 1, Upcoming: 2, Expired: 3 };

function ContractsTab({ contracts, setContracts, showToast }) {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId]   = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm] = useState({ customerId:'', sku:'', contractPrice:'', minWeeklyQty:'', startDate:'', endDate:'', notes:'' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts
      .filter(c =>
        (statusFilter === 'All' || c.status === statusFilter) &&
        (!q || c.customer.toLowerCase().includes(q) || c.sku.toLowerCase().includes(q) || c.skuName.toLowerCase().includes(q))
      )
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  }, [contracts, search, statusFilter]);

  const handleAdd = () => {
    if (!form.customerId || !form.sku || !form.contractPrice) {
      showToast('Customer, SKU and Contract Price are required', 'error'); return;
    }
    const cust = CUSTOMERS.find(c => c.id === form.customerId);
    const catItem = CATALOG.find(c => c.sku === form.sku);
    const status = form.startDate && form.startDate > TODAY_STR ? 'Upcoming' : 'Active';
    setContracts(prev => [{
      id: `CTR-${String(prev.length + 9).padStart(3,'0')}`,
      customerId: form.customerId, customer: cust?.name || '',
      sku: form.sku, skuName: catItem?.name || form.sku,
      basePrice: catItem?.basePrice || 0,
      contractPrice: parseFloat(form.contractPrice),
      minWeeklyQty: parseInt(form.minWeeklyQty) || 0,
      startDate: form.startDate || TODAY_STR,
      endDate: form.endDate || '',
      notes: form.notes, status,
    }, ...prev]);
    setForm({ customerId:'', sku:'', contractPrice:'', minWeeklyQty:'', startDate:'', endDate:'', notes:'' });
    setShowForm(false);
    showToast(`Contract created for ${cust?.name}`);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-36 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 w-full" placeholder="Search customer or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['All','Active','Expiring','Upcoming','Expired'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${statusFilter === s ? 'bg-amber-500 text-gray-950 border-amber-400' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'}`}>
            {s}{s !== 'All' && <span className="ml-1 opacity-60">{contracts.filter(c=>c.status===s).length}</span>}
          </button>
        ))}
        <button onClick={() => setShowForm(v => !v)} className={`${UI.btn} ${UI.btnPrimary} ml-auto`}>
          {showForm ? <><X className="w-3 h-3" /> Cancel</> : <><Plus className="w-3 h-3" /> New Contract</>}
        </button>
      </div>

      {/* New Contract Form */}
      {showForm && (
        <div className="bg-gray-900 border border-amber-500/25 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> New Contract</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className={UI.label}>Customer</label>
              <select className={UI.select} value={form.customerId} onChange={e => setForm(f => ({...f, customerId:e.target.value}))}>
                <option value="">Select customer…</option>
                {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={UI.label}>SKU</label>
              <select className={UI.select} value={form.sku} onChange={e => setForm(f => ({...f, sku:e.target.value}))}>
                <option value="">Select SKU…</option>
                {CATALOG.map(c => <option key={c.sku} value={c.sku}>{c.sku} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={UI.label}>Contract Price</label>
              <input type="number" step="0.01" className={UI.input} placeholder="0.00" value={form.contractPrice} onChange={e => setForm(f => ({...f, contractPrice:e.target.value}))} />
            </div>
            <div>
              <label className={UI.label}>Min Weekly Qty</label>
              <input type="number" className={UI.input} placeholder="0" value={form.minWeeklyQty} onChange={e => setForm(f => ({...f, minWeeklyQty:e.target.value}))} />
            </div>
            <div>
              <label className={UI.label}>Start Date</label>
              <input type="date" className={UI.input} value={form.startDate} onChange={e => setForm(f => ({...f, startDate:e.target.value}))} />
            </div>
            <div>
              <label className={UI.label}>End Date</label>
              <input type="date" className={UI.input} value={form.endDate} onChange={e => setForm(f => ({...f, endDate:e.target.value}))} />
            </div>
          </div>
          <div className="mb-3">
            <label className={UI.label}>Notes</label>
            <input className={UI.input} placeholder="Optional notes…" value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} />
          </div>
          {form.contractPrice && form.sku && (() => {
            const catItem = CATALOG.find(c => c.sku === form.sku);
            if (!catItem) return null;
            const delta = ((parseFloat(form.contractPrice) - catItem.basePrice) / catItem.basePrice * 100);
            return (
              <p className={`text-xs mb-3 font-semibold ${delta < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Base price: {fmt$(catItem.basePrice)} → Contract: {fmt$(parseFloat(form.contractPrice) || 0)} ({delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs base)
              </p>
            );
          })()}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className={`${UI.btn} ${UI.btnGhost}`}>Cancel</button>
            <button onClick={handleAdd} className={`${UI.btn} ${UI.btnPrimary}`}><Check className="w-3 h-3" /> Save Contract</button>
          </div>
        </div>
      )}

      {/* Contracts table */}
      <div className={`${UI.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-gray-800/20">
                <th className="text-left px-4 py-2.5">Customer</th>
                <th className="text-left px-3 py-2.5">SKU</th>
                <th className="text-right px-3 py-2.5 w-24">Base</th>
                <th className="text-right px-3 py-2.5 w-28">Contract Price</th>
                <th className="text-right px-3 py-2.5 w-16">Δ</th>
                <th className="text-center px-3 py-2.5 w-36">Valid Through</th>
                <th className="text-center px-3 py-2.5 w-16">Min/wk</th>
                <th className="text-center px-3 py-2.5 w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const st = CSTATUS[c.status] || CSTATUS.Expired;
                const delta = ((c.contractPrice - c.basePrice) / c.basePrice * 100);
                const isExpanded = expandedId === c.id;
                return (
                  <>
                    <tr key={c.id} className={`border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors cursor-pointer ${c.status === 'Expired' ? 'opacity-50' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                      <td className="px-4 py-2.5 font-medium text-gray-200">{c.customer}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-[10px] text-gray-500 block">{c.sku}</span>
                        <span className="text-xs text-gray-400">{c.skuName}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-500 text-xs">{fmt$(c.basePrice)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-100">{fmt$(c.contractPrice)}</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-black text-xs ${delta < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-gray-400">{c.endDate || '—'}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-gray-400 text-xs">{c.minWeeklyQty || '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {c.status}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${c.id}-exp`} className="border-t border-gray-800/40">
                        <td colSpan={8} className="px-4 py-2.5 bg-gray-900/60">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-gray-500" /> {c.startDate} → {c.endDate}</span>
                            <span className="text-xs text-gray-500">Contract ID: <span className="font-mono">{c.id}</span></span>
                            {c.notes && <span className="text-xs text-gray-400 flex-1">📝 {c.notes}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-600">No contracts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: VOLUME TIERS
// ─────────────────────────────────────────────────────────────────────────────
function VolumeTab() {
  const [expandedSku, setExpandedSku] = useState(null);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{INIT_VOLUME_TIERS.length} SKUs with quantity break pricing</p>
      {INIT_VOLUME_TIERS.map(group => {
        const isExpanded = expandedSku === group.sku;
        const maxDiscount = ((group.basePrice - Math.min(...group.tiers.map(t => t.price))) / group.basePrice * 100);
        return (
          <div key={group.sku} className={UI.card + ' overflow-hidden'}>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-800/30 transition-colors flex items-center gap-3"
              onClick={() => setExpandedSku(isExpanded ? null : group.sku)}>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-gray-500">{group.sku}</span>
                  <span className="text-gray-200 font-medium text-sm">{group.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                  <span>{group.tiers.length} tiers</span>
                  <span>Base: <span className="text-gray-300 font-mono">{fmt$(group.basePrice)}/{group.uom}</span></span>
                  <span className="text-emerald-400 font-bold">Max discount: {maxDiscount.toFixed(1)}%</span>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {isExpanded && (
              <div className="border-t border-gray-800 px-4 py-4">
                <div className="space-y-3">
                  {group.tiers.map((tier, i) => {
                    const savings = ((group.basePrice - tier.price) / group.basePrice * 100);
                    const barPct = Math.max(10, 100 - savings * 3);
                    const isBasePrice = tier.price === group.basePrice;
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-28 text-right">
                          <span className="font-mono text-xs text-gray-400">
                            {tier.maxQty ? `${tier.minQty}–${tier.maxQty}` : `${tier.minQty}+`} {group.uom}s
                          </span>
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-full h-7 relative overflow-hidden">
                          <div
                            className={`h-7 rounded-full transition-all flex items-center ${isBasePrice ? 'bg-gray-700' : 'bg-emerald-500/30 border border-emerald-500/40'}`}
                            style={{ width: `${barPct}%` }}
                          >
                            <span className={`px-3 font-mono font-bold text-xs whitespace-nowrap ${isBasePrice ? 'text-gray-400' : 'text-emerald-300'}`}>
                              {fmt$(tier.price)}/{group.uom}
                            </span>
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          {isBasePrice
                            ? <span className="text-xs text-gray-600">base</span>
                            : <span className="text-xs font-black text-emerald-400">−{savings.toFixed(1)}%</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-600 mt-3">
                  Tier pricing applies to all accounts unless a Price Book override or Contract rate takes precedence.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PROMOTIONS
// ─────────────────────────────────────────────────────────────────────────────
function PromosTab({ promos, setPromos, showToast }) {
  const grouped = useMemo(() => {
    const order = ['Active', 'Upcoming', 'Expired'];
    return order.map(s => ({ status: s, items: promos.filter(p => p.status === s) })).filter(g => g.items.length > 0);
  }, [promos]);

  const toggleEnabled = (id) => {
    setPromos(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    const promo = promos.find(p => p.id === id);
    showToast(promo ? `${promo.name} ${promo.enabled ? 'disabled' : 'enabled'}` : 'Updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-500">
          {promos.filter(p => p.status === 'Active' && p.enabled).length} active · {promos.filter(p => p.status === 'Upcoming').length} upcoming
        </p>
        <button className={`${UI.btn} ${UI.btnPrimary}`}><Plus className="w-3 h-3" /> New Promotion</button>
      </div>

      {grouped.map(group => {
        const ps = PSTATUS[group.status];
        return (
          <div key={group.status}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${ps.text}`}>
              {group.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {group.status}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map(promo => {
                const delta = ((promo.promoPrice - promo.basePrice) / promo.basePrice * 100);
                return (
                  <div key={promo.id} className={`${UI.card} p-4 ${promo.status === 'Expired' ? 'opacity-50' : ''} border ${ps.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${ps.text}`}>{promo.name}</span>
                          <span className="font-mono text-[9px] text-gray-600">{promo.id}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{promo.description}</p>
                      </div>
                      {promo.status !== 'Expired' && (
                        <button onClick={() => toggleEnabled(promo.id)}
                          className={`shrink-0 w-8 h-5 rounded-full transition-colors relative ${promo.enabled ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${promo.enabled ? 'left-3.5' : 'left-0.5'}`} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                      <div>
                        <span className="text-gray-600">SKU</span>
                        <span className="block font-mono text-gray-400">{promo.sku}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Discount</span>
                        <span className="block font-bold text-emerald-400">{fmt$(promo.promoPrice)} ({delta.toFixed(1)}%)</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Window</span>
                        <span className="block text-gray-300">{promo.startDate} → {promo.endDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Scope</span>
                        <span className={`block font-semibold ${promo.allCustomers ? 'text-cyan-400' : 'text-violet-400'}`}>
                          {promo.allCustomers ? 'All Customers' : 'Preferred Book Only'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Min Qty</span>
                        <span className="block font-mono text-gray-300">{promo.minQty} units</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Base → Promo</span>
                        <span className="block font-mono text-gray-400">{fmt$(promo.basePrice)} → <span className="text-emerald-300 font-bold">{fmt$(promo.promoPrice)}</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PRICE SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────
function SimulatorTab({ contracts, promos, priceBooks }) {
  const [custId, setCustId]   = useState('');
  const [sku, setSku]         = useState('');
  const [qty, setQty]         = useState('');
  const [result, setResult]   = useState(null);
  const [resolved, setResolved] = useState(false);

  const handleResolve = () => {
    const q = parseInt(qty) || 0;
    const r = resolvePrice(custId, sku, q, contracts, promos, priceBooks);
    setResult(r);
    setResolved(true);
  };

  const reset = () => { setCustId(''); setSku(''); setQty(''); setResult(null); setResolved(false); };

  const STEP_CONFIG = [
    {
      key: 'tier',
      label: 'Volume Tier',
      icon: <TrendingDown className="w-3.5 h-3.5" />,
      getValue: r => r.tierResult,
      getLabel: r => r.tierResult ? `${fmt$(r.tierResult.price)} — ${r.tierResult.label}` : (parseInt(qty) > 0 ? 'No tier discount at this quantity' : 'Enter quantity to check'),
      color: 'text-cyan-400',
    },
    {
      key: 'book',
      label: 'Price Book',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      getValue: r => r.bookResult,
      getLabel: r => r.bookResult ? `${fmt$(r.bookResult.price)} — ${r.bookResult.bookName} book` : (custId ? 'No override in assigned book' : 'Select customer'),
      color: 'text-amber-400',
    },
    {
      key: 'contract',
      label: 'Contract',
      icon: <Shield className="w-3.5 h-3.5" />,
      getValue: r => r.contractResult,
      getLabel: r => r.contractResult ? `${fmt$(r.contractResult.price)} — ${r.contractResult.id} valid through ${r.contractResult.endDate}` : 'No active contract for this customer + SKU',
      color: 'text-violet-400',
    },
    {
      key: 'promo',
      label: 'Promotion',
      icon: <Zap className="w-3.5 h-3.5" />,
      getValue: r => r.promoResult,
      getLabel: r => r.promoResult ? `${fmt$(r.promoResult.price)} — ${r.promoResult.name} (exp ${r.promoResult.endDate})` : 'No active promotion applies',
      color: 'text-rose-400',
    },
  ];

  const resolvedByLabel = { base:'Base Price', contract:'Contract', book:'Price Book', tier:'Volume Tier', promo:'Promotion' };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-violet-300">Price Resolution Engine</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
            Select a customer, SKU, and quantity to see the full price resolution chain — from base price through volume tiers, price book overrides, active contracts, and live promotions. The engine shows exactly which rule wins and why.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={UI.label}>Customer</label>
          <select className={UI.select} value={custId} onChange={e => { setCustId(e.target.value); setResult(null); setResolved(false); }}>
            <option value="">Select customer…</option>
            {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {custId && (() => {
            const c = CUSTOMERS.find(x => x.id === custId);
            const b = INIT_PRICE_BOOKS.find(b => b.id === c?.book);
            return b ? <p className={`text-[10px] mt-1 font-semibold ${b.color}`}>Book: {b.name}</p> : null;
          })()}
        </div>
        <div>
          <label className={UI.label}>SKU</label>
          <select className={UI.select} value={sku} onChange={e => { setSku(e.target.value); setResult(null); setResolved(false); }}>
            <option value="">Select SKU…</option>
            {CATALOG.map(c => <option key={c.sku} value={c.sku}>{c.sku} — {c.name}</option>)}
          </select>
          {sku && (() => {
            const item = CATALOG.find(c => c.sku === sku);
            return item ? <p className="text-[10px] mt-1 text-gray-500">Base: <span className="font-mono text-gray-300">{fmt$(item.basePrice)}</span></p> : null;
          })()}
        </div>
        <div>
          <label className={UI.label}>Quantity</label>
          <input type="number" min="1" className={UI.input} placeholder="Enter qty…" value={qty}
            onChange={e => { setQty(e.target.value); setResult(null); setResolved(false); }} />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleResolve} disabled={!custId || !sku || !qty}
          className={`${UI.btn} ${UI.btnPrimary} ${(!custId || !sku || !qty) ? 'opacity-40 cursor-not-allowed' : ''}`}>
          <Calculator className="w-3.5 h-3.5" /> Resolve Price
        </button>
        {resolved && <button onClick={reset} className={`${UI.btn} ${UI.btnGhost}`}><RefreshCw className="w-3 h-3" /> Reset</button>}
      </div>

      {/* Resolution Chain */}
      {result && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Resolution Chain</p>

          {/* Base */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-800/40 border border-gray-700 rounded-lg">
            <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 flex-1">Base Price</span>
            <span className="font-mono text-sm text-gray-300">{fmt$(result.base)}</span>
            {result.resolvedBy === 'base' && <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">APPLIED</span>}
          </div>

          {STEP_CONFIG.map(step => {
            const hasValue = step.getValue(result) !== null;
            const isApplied = result.resolvedBy === step.key;
            return (
              <div key={step.key} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
                isApplied
                  ? 'bg-emerald-500/8 border-emerald-500/25'
                  : hasValue
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-gray-900/30 border-gray-800 opacity-50'
              }`}>
                <span className={`${step.color} shrink-0`}>{step.icon}</span>
                <span className="text-xs text-gray-400 w-24 shrink-0">{step.label}</span>
                <span className={`text-xs flex-1 ${hasValue ? (isApplied ? 'text-emerald-300' : step.color) : 'text-gray-600'}`}>
                  {step.getLabel(result)}
                </span>
                {isApplied && <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">APPLIED</span>}
              </div>
            );
          })}

          {/* Result */}
          <div className="mt-2 p-4 bg-amber-500/8 border-2 border-amber-500/30 rounded-xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Effective Price</p>
                <p className="text-3xl font-black text-amber-300 font-mono mt-0.5">{fmt$(result.resolved)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Resolved by: <span className="font-bold text-amber-400">{resolvedByLabel[result.resolvedBy]}</span>
                  {' · '}{parseInt(qty)} × {fmt$(result.resolved)} = <span className="font-mono font-bold text-gray-200">{fmt$(result.resolved * parseInt(qty))}</span> order total
                </p>
              </div>
              {result.savings > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Savings vs Base</p>
                  <p className="text-xl font-black text-emerald-400 font-mono">{fmt$(result.savings)}/unit</p>
                  <p className="text-xs text-emerald-500 font-bold">{result.savingsPct.toFixed(1)}% below list</p>
                  <p className="text-xs text-emerald-600 font-mono">{fmt$(result.savings * parseInt(qty))} saved on this order</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────
export default function PricingModule() {
  const { activeUser, logAudit } = useKernal();

  const [activeTab,  setActiveTab]  = useState('books');
  const [priceBooks, setPriceBooks] = useState(INIT_PRICE_BOOKS);
  const [contracts,  setContracts]  = useState(INIT_CONTRACTS);
  const [promos,     setPromos]     = useState(INIT_PROMOS);
  const [toast,      setToast]      = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const canWrite = ['admin', 'manager', 'accountant'].includes(activeUser?.role);

  // KPIs
  const activeContracts = contracts.filter(c => c.status === 'Active').length;
  const expiringContracts = contracts.filter(c => c.status === 'Expiring').length;
  const activePromos = promos.filter(p => p.status === 'Active' && p.enabled).length;
  const totalOverrides = priceBooks.reduce((s, b) => s + b.overrides.length, 0);

  const TABS = [
    { id:'books',    label:'Price Books',    Icon: BookOpen,   badge: null },
    { id:'contracts',label:'Contracts',      Icon: FileText,   badge: expiringContracts > 0 ? expiringContracts : null },
    { id:'volume',   label:'Volume Tiers',   Icon: TrendingDown, badge: null },
    { id:'promos',   label:'Promotions',     Icon: Zap,        badge: activePromos > 0 ? activePromos : null },
    { id:'simulator',label:'Price Simulator',Icon: Calculator, badge: null, highlight: true },
  ];

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="bg-gray-950/80 backdrop-blur border-b border-gray-800 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-amber-400" />
            <div>
              <h1 className="font-extrabold text-gray-100 text-lg leading-none">Pricing Engine</h1>
              <p className="text-xs text-gray-500 mt-0.5">Price books · Contract pricing · Volume tiers · Promotional pricing</p>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label:'Price Books',        val: priceBooks.length,    color:'text-amber-400',   sub:'active pricing tiers'        },
            { label:'Active Contracts',   val: activeContracts,       color: activeContracts > 0 ? 'text-emerald-400' : 'text-gray-500', sub: expiringContracts > 0 ? `${expiringContracts} expiring soon` : 'no contracts expiring' },
            { label:'SKU Overrides',      val: totalOverrides,        color:'text-violet-400',  sub:'across all price books'      },
            { label:'Live Promotions',    val: activePromos,          color: activePromos > 0 ? 'text-rose-400' : 'text-gray-500', sub:'currently active'            },
          ].map(k => (
            <div key={k.label} className="bg-gray-800/50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</p>
              <p className={`font-mono font-extrabold text-lg mt-0.5 ${k.color}`}>{k.val}</p>
              <p className="text-[9px] text-gray-600 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-800 bg-gray-950 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? t.highlight ? 'border-violet-500 text-violet-400' : 'border-amber-500 text-amber-400'
                  : t.highlight ? 'border-transparent text-violet-500/60 hover:text-violet-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge != null && (
                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/25 ml-0.5">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {activeTab === 'books'     && <PriceBooksTab priceBooks={priceBooks} />}
        {activeTab === 'contracts' && <ContractsTab  contracts={contracts} setContracts={setContracts} showToast={showToast} />}
        {activeTab === 'volume'    && <VolumeTab />}
        {activeTab === 'promos'    && <PromosTab promos={promos} setPromos={setPromos} showToast={showToast} />}
        {activeTab === 'simulator' && <SimulatorTab contracts={contracts} promos={promos} priceBooks={priceBooks} />}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl font-bold text-xs border backdrop-blur-md ${
          toast.type === 'error'
            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
