import { useState, useMemo, useCallback } from 'react';
import { useKernal } from './KernalContext.jsx';
import {
  BookOpen, Plus, ChevronDown, ChevronRight, ChevronUp,
  Lock, Unlock, FileText, AlertTriangle, CheckCircle2,
  BarChart3, TrendingUp, X, Check, RefreshCw, Layers,
  ArrowUpDown, Edit3, Eye,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// UI CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const UI = {
  card:         'bg-gray-900 border border-gray-800 rounded-xl',
  glassHeader:  'bg-gray-950/80 backdrop-blur border-b border-gray-800',
  btn:          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
  btnPrimary:   'bg-violet-600 hover:bg-violet-500 text-white',
  btnGhost:     'bg-gray-800 hover:bg-gray-700 text-gray-300',
  btnDanger:    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20',
  btnEmerald:   'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/20',
  input:        'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500',
  select:       'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-violet-500',
  label:        'block text-xs font-bold text-gray-400 mb-1',
};

const fmt$ = (n) => n == null ? '—' : '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS  (balanced trial balance at 2,229,100)
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_ACCOUNTS = [
  // Assets — debit normal
  { id:'1010', num:'1010', name:'Cash – Operating',           type:'Asset',     sub:'Current',   normalBal:'debit',  balance:285400 },
  { id:'1020', num:'1020', name:'Cash – Payroll',             type:'Asset',     sub:'Current',   normalBal:'debit',  balance:48200  },
  { id:'1100', num:'1100', name:'Accounts Receivable',        type:'Asset',     sub:'Current',   normalBal:'debit',  balance:412000 },
  { id:'1200', num:'1200', name:'Inventory',                  type:'Asset',     sub:'Current',   normalBal:'debit',  balance:380000 },
  { id:'1300', num:'1300', name:'Prepaid Expenses',           type:'Asset',     sub:'Current',   normalBal:'debit',  balance:15800  },
  { id:'1600', num:'1600', name:'Fixed Assets – Equipment',   type:'Asset',     sub:'Fixed',     normalBal:'debit',  balance:620000 },
  { id:'1700', num:'1700', name:'Accum. Depreciation',        type:'Asset',     sub:'Contra',    normalBal:'credit', balance:145000 },
  // Liabilities — credit normal
  { id:'2000', num:'2000', name:'Accounts Payable',           type:'Liability', sub:'Current',   normalBal:'credit', balance:198000 },
  { id:'2100', num:'2100', name:'Accrued Liabilities',        type:'Liability', sub:'Current',   normalBal:'credit', balance:34500  },
  { id:'2200', num:'2200', name:'Sales Tax Payable',          type:'Liability', sub:'Current',   normalBal:'credit', balance:8960   },
  { id:'2300', num:'2300', name:'Notes Payable',              type:'Liability', sub:'Long-Term', normalBal:'credit', balance:180000 },
  // Equity — credit normal
  { id:'3000', num:'3000', name:"Owner's Capital",            type:'Equity',    sub:'',          normalBal:'credit', balance:850000 },
  { id:'3100', num:'3100', name:'Retained Earnings',          type:'Equity',    sub:'',          normalBal:'credit', balance:297240 },
  { id:'3200', num:'3200', name:"Owner's Draw",               type:'Equity',    sub:'Contra',    normalBal:'debit',  balance:0      },
  // Revenue — credit normal
  { id:'4000', num:'4000', name:'Product Sales',              type:'Revenue',   sub:'',          normalBal:'credit', balance:487200 },
  { id:'4100', num:'4100', name:'Delivery Revenue',           type:'Revenue',   sub:'',          normalBal:'credit', balance:24800  },
  { id:'4200', num:'4200', name:'Service Revenue',            type:'Revenue',   sub:'',          normalBal:'credit', balance:3400   },
  // COGS — debit normal
  { id:'5000', num:'5000', name:'Cost of Goods Sold',         type:'COGS',      sub:'',          normalBal:'debit',  balance:341040 },
  { id:'5100', num:'5100', name:'Freight In',                 type:'COGS',      sub:'',          normalBal:'debit',  balance:18200  },
  { id:'5200', num:'5200', name:'Inventory Variance',         type:'COGS',      sub:'',          normalBal:'debit',  balance:2840   },
  // Expenses — debit normal
  { id:'6000', num:'6000', name:'Salaries & Wages',           type:'Expense',   sub:'',          normalBal:'debit',  balance:62000  },
  { id:'6100', num:'6100', name:'Payroll Taxes',              type:'Expense',   sub:'',          normalBal:'debit',  balance:8400   },
  { id:'6200', num:'6200', name:'Rent & Utilities',           type:'Expense',   sub:'',          normalBal:'debit',  balance:12500  },
  { id:'6300', num:'6300', name:'Vehicle & Fleet',            type:'Expense',   sub:'',          normalBal:'debit',  balance:8200   },
  { id:'6400', num:'6400', name:'Insurance',                  type:'Expense',   sub:'',          normalBal:'debit',  balance:3400   },
  { id:'6500', num:'6500', name:'Office Supplies',            type:'Expense',   sub:'',          normalBal:'debit',  balance:1820   },
  { id:'6600', num:'6600', name:'Marketing & Advertising',    type:'Expense',   sub:'',          normalBal:'debit',  balance:2100   },
  { id:'6700', num:'6700', name:'Depreciation Expense',       type:'Expense',   sub:'',          normalBal:'debit',  balance:7200   },
];

// ─────────────────────────────────────────────────────────────────────────────
// FISCAL PERIODS
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_PERIODS = [
  { id:'FY26-01', label:'Jan 2026', status:'Closed', entries:28, posted:1842300 },
  { id:'FY26-02', label:'Feb 2026', status:'Closed', entries:24, posted:1714800 },
  { id:'FY26-03', label:'Mar 2026', status:'Closed', entries:31, posted:2015600 },
  { id:'FY26-04', label:'Apr 2026', status:'Closed', entries:26, posted:1938400 },
  { id:'FY26-05', label:'May 2026', status:'Open',   entries:17, posted:2229100 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK JOURNAL ENTRIES  (all for May 2026 / FY26-05)
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_JOURNALS = [
  {
    id:'JE-0001', date:'2026-05-01', period:'FY26-05',
    memo:'May payroll – week ending 5/1', ref:'PR-2026-05-01',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'6000', desc:'Salaries & wages',       debit:62000, credit:0     },
      { acct:'6100', desc:'Employer payroll tax',   debit:8400,  credit:0     },
      { acct:'1020', desc:'Net payroll disbursed',  debit:0,     credit:62000 },
      { acct:'2100', desc:'Payroll taxes payable',  debit:0,     credit:8400  },
    ],
  },
  {
    id:'JE-0002', date:'2026-05-02', period:'FY26-05',
    memo:'Inventory receipt – PO-AP-0881 Gulf Coast Proteins', ref:'PO-AP-0881',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'5000', desc:'COGS – proteins',           debit:24500, credit:0     },
      { acct:'5100', desc:'Freight in',                debit:1200,  credit:0     },
      { acct:'2000', desc:'AP – Gulf Coast Proteins',  debit:0,     credit:25700 },
    ],
  },
  {
    id:'JE-0003', date:'2026-05-05', period:'FY26-05',
    memo:'Invoice – INV-501 Metro Restaurant Group', ref:'INV-501',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'1100', desc:'AR – Metro Restaurant Group', debit:8450, credit:0    },
      { acct:'4000', desc:'Product sales',               debit:0,    credit:8000 },
      { acct:'4100', desc:'Delivery revenue',            debit:0,    credit:450  },
    ],
  },
  {
    id:'JE-0004', date:'2026-05-06', period:'FY26-05',
    memo:'Cash receipt – Harbor View Hotel INV-503', ref:'PMT-503',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'1010', desc:'Cash received',          debit:12800, credit:0     },
      { acct:'1100', desc:'AR – Harbor View Hotel', debit:0,     credit:12800 },
    ],
  },
  {
    id:'JE-0005', date:'2026-05-08', period:'FY26-05',
    memo:'Vendor payment – check #1042 Sunshine Produce', ref:'CHK-1042',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'2000', desc:'AP – Sunshine Produce', debit:31400, credit:0     },
      { acct:'1010', desc:'Cash disbursed',        debit:0,     credit:31400 },
    ],
  },
  {
    id:'JE-0006', date:'2026-05-08', period:'FY26-05',
    memo:'Inventory receipt – PO-AP-0882 Sunshine Produce', ref:'PO-AP-0882',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'5000', desc:'COGS – produce',        debit:38200, credit:0     },
      { acct:'2000', desc:'AP – Sunshine Produce', debit:0,     credit:38200 },
    ],
  },
  {
    id:'JE-0007', date:'2026-05-10', period:'FY26-05',
    memo:'Invoice – INV-505 City School District', ref:'INV-505',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'1100', desc:'AR – City School District', debit:22000, credit:0     },
      { acct:'4000', desc:'Product sales',              debit:0,     credit:20800 },
      { acct:'4100', desc:'Delivery revenue',           debit:0,     credit:1200  },
    ],
  },
  {
    id:'JE-0008', date:'2026-05-14', period:'FY26-05',
    memo:'May rent & utilities payment', ref:'RENT-MAY26',
    type:'Manual', status:'Posted', createdBy:'Admin',
    lines:[
      { acct:'6200', desc:'Warehouse rent',  debit:8500,  credit:0     },
      { acct:'6200', desc:'Utilities',       debit:4000,  credit:0     },
      { acct:'1010', desc:'Cash disbursed',  debit:0,     credit:12500 },
    ],
  },
  {
    id:'JE-0009', date:'2026-05-15', period:'FY26-05',
    memo:'Inventory receipt – PO-AP-0883 Metro Dry Goods', ref:'PO-AP-0883',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'5000', desc:'COGS – dry goods',       debit:42800, credit:0     },
      { acct:'5100', desc:'Freight in',             debit:2200,  credit:0     },
      { acct:'2000', desc:'AP – Metro Dry Goods',   debit:0,     credit:45000 },
    ],
  },
  {
    id:'JE-0010', date:'2026-05-16', period:'FY26-05',
    memo:'Cash receipt – Metro Restaurant Group INV-501 (overdue)', ref:'PMT-501',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'1010', desc:'Cash received',               debit:8450, credit:0    },
      { acct:'1100', desc:'AR – Metro Restaurant Group', debit:0,    credit:8450 },
    ],
  },
  {
    id:'JE-0011', date:'2026-05-18', period:'FY26-05',
    memo:'Invoice – INV-502 Downtown Catering Co.', ref:'INV-502',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'1100', desc:'AR – Downtown Catering',  debit:3200, credit:0    },
      { acct:'4000', desc:'Product sales',           debit:0,    credit:3000 },
      { acct:'4100', desc:'Delivery revenue',        debit:0,    credit:200  },
    ],
  },
  {
    id:'JE-0012', date:'2026-05-20', period:'FY26-05',
    memo:'Fleet fuel & vehicle maintenance – May', ref:'FLEET-MAY26',
    type:'Manual', status:'Posted', createdBy:'Admin',
    lines:[
      { acct:'6300', desc:'Fleet fuel',            debit:4800, credit:0    },
      { acct:'6300', desc:'Vehicle maintenance',   debit:3400, credit:0    },
      { acct:'1010', desc:'Cash',                  debit:0,    credit:8200 },
    ],
  },
  {
    id:'JE-0013', date:'2026-05-21', period:'FY26-05',
    memo:'Insurance premium – May 2026', ref:'INS-MAY26',
    type:'Manual', status:'Posted', createdBy:'Admin',
    lines:[
      { acct:'6400', desc:'General liability insurance', debit:3400, credit:0    },
      { acct:'1010', desc:'Cash',                        debit:0,    credit:3400 },
    ],
  },
  {
    id:'JE-0014', date:'2026-05-22', period:'FY26-05',
    memo:'Invoices – INV-504 Sunset Bistro · INV-506 Bayou Grill', ref:'INV-504/506',
    type:'System', status:'Posted', createdBy:'System',
    lines:[
      { acct:'1100', desc:'AR – Sunset Bistro Chain', debit:5600, credit:0    },
      { acct:'1100', desc:'AR – Bayou Grill & Pub',   debit:1910, credit:0    },
      { acct:'4000', desc:'Product sales',            debit:0,    credit:7000 },
      { acct:'4100', desc:'Delivery revenue',         debit:0,    credit:510  },
    ],
  },
  {
    id:'JE-0015', date:'2026-05-23', period:'FY26-05',
    memo:'Inventory variance – cycle count adjustment', ref:'ADJ-2026-05',
    type:'Manual', status:'Posted', createdBy:'Admin',
    lines:[
      { acct:'5200', desc:'Inventory variance',   debit:2840, credit:0    },
      { acct:'1200', desc:'Inventory – adj.',     debit:0,    credit:2840 },
    ],
  },
  {
    id:'JE-0016', date:'2026-05-24', period:'FY26-05',
    memo:'Monthly depreciation – May 2026', ref:'DEP-MAY26',
    type:'Manual', status:'Posted', createdBy:'Admin',
    lines:[
      { acct:'6700', desc:'Depreciation expense',  debit:7200, credit:0    },
      { acct:'1700', desc:'Accum. depreciation',   debit:0,    credit:7200 },
    ],
  },
  {
    id:'JE-0017', date:'2026-05-25', period:'FY26-05',
    memo:'Accrual – office supplies & marketing', ref:'ACCR-MAY26',
    type:'Manual', status:'Draft', createdBy:'Admin',
    lines:[
      { acct:'6500', desc:'Office supplies',        debit:1820, credit:0    },
      { acct:'6600', desc:'Marketing – digital ads',debit:2100, credit:0    },
      { acct:'2100', desc:'Accrued liabilities',    debit:0,    credit:3920 },
    ],
  },
];

const TYPE_ORDER = ['Asset','Liability','Equity','Revenue','COGS','Expense'];

const TYPE_COLOR = {
  Asset:     { text:'text-cyan-400',    bg:'bg-cyan-500/10',    border:'border-cyan-500/20'   },
  Liability: { text:'text-rose-400',    bg:'bg-rose-500/10',    border:'border-rose-500/20'   },
  Equity:    { text:'text-violet-400',  bg:'bg-violet-500/10',  border:'border-violet-500/20' },
  Revenue:   { text:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/20'},
  COGS:      { text:'text-amber-400',   bg:'bg-amber-500/10',   border:'border-amber-500/20'  },
  Expense:   { text:'text-orange-400',  bg:'bg-orange-500/10',  border:'border-orange-500/20' },
};

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const c = TYPE_COLOR[type] || TYPE_COLOR.Expense;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${c.bg} ${c.text} ${c.border}`}>
      {type}
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    Posted:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Draft:   'bg-amber-500/10 text-amber-400 border-amber-500/25',
    Void:    'bg-gray-700/40 text-gray-500 border-gray-600/25',
    Open:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    Closed:  'bg-zinc-700/40 text-zinc-400 border-zinc-600/25',
    Locked:  'bg-rose-500/10 text-rose-400 border-rose-500/25',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${map[status] || map.Draft}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW JOURNAL ENTRY MODAL
// ─────────────────────────────────────────────────────────────────────────────
function NewJEModal({ accounts, periodId, onSave, onClose }) {
  const today = '2026-05-25';
  const [date,    setDate]   = useState(today);
  const [memo,    setMemo]   = useState('');
  const [ref,     setRef]    = useState('');
  const [lines,   setLines]  = useState([
    { acct:'', desc:'', debit:'', credit:'' },
    { acct:'', desc:'', debit:'', credit:'' },
  ]);

  const setLine = useCallback((i, field, val) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  }, []);

  const addLine = () => setLines(prev => [...prev, { acct:'', desc:'', debit:'', credit:'' }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const totalDr = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCr = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced = Math.abs(totalDr - totalCr) < 0.005 && totalDr > 0;

  const handleSave = (status) => {
    if (!memo.trim()) return;
    if (!balanced && status === 'Posted') return;
    const je = {
      id: `JE-${String(Date.now()).slice(-4).padStart(4,'0')}`,
      date, period: periodId, memo, ref,
      type: 'Manual', status, createdBy: 'Admin',
      lines: lines
        .filter(l => l.acct && (parseFloat(l.debit)||0) + (parseFloat(l.credit)||0) > 0)
        .map(l => ({ acct: l.acct, desc: l.desc, debit: parseFloat(l.debit)||0, credit: parseFloat(l.credit)||0 })),
    };
    onSave(je);
    onClose();
  };

  const sortedAccts = [...accounts].sort((a,b) => a.num.localeCompare(b.num));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <h2 className="font-bold text-gray-100">New Journal Entry</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Meta row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={UI.label}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={UI.input} />
            </div>
            <div className="col-span-2">
              <label className={UI.label}>Memo / Description <span className="text-rose-500">*</span></label>
              <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Describe this entry…" className={UI.input} />
            </div>
          </div>
          <div>
            <label className={UI.label}>Reference / Source Document</label>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="INV-001, PO-0882, CHK-1055…" className={UI.input} />
          </div>

          {/* Lines table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={UI.label}>Journal Lines</label>
              <button onClick={addLine} className={`${UI.btn} ${UI.btnGhost} py-1`}>
                <Plus className="w-3 h-3" /> Add Line
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-800">
              {/* Column headers */}
              <div className="grid grid-cols-[180px_1fr_110px_110px_32px] gap-0 bg-gray-800/60 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Account</span><span>Description</span><span className="text-right">Debit</span><span className="text-right">Credit</span><span />
              </div>

              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[180px_1fr_110px_110px_32px] gap-0 border-t border-gray-800 px-3 py-2 items-center">
                  <select
                    value={line.acct}
                    onChange={e => setLine(i, 'acct', e.target.value)}
                    className="bg-transparent text-xs text-gray-200 border-0 focus:outline-none pr-1 w-full"
                  >
                    <option value="">— Select —</option>
                    {sortedAccts.map(a => (
                      <option key={a.id} value={a.id}>{a.num} · {a.name}</option>
                    ))}
                  </select>
                  <input
                    value={line.desc}
                    onChange={e => setLine(i, 'desc', e.target.value)}
                    placeholder="Line description"
                    className="bg-transparent text-xs text-gray-300 border-0 focus:outline-none w-full placeholder-gray-600"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={line.debit}
                    onChange={e => { setLine(i, 'debit', e.target.value); if (e.target.value) setLine(i, 'credit', ''); }}
                    placeholder="0.00"
                    className="bg-transparent text-xs text-right text-gray-200 border-0 focus:outline-none w-full placeholder-gray-600"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={line.credit}
                    onChange={e => { setLine(i, 'credit', e.target.value); if (e.target.value) setLine(i, 'debit', ''); }}
                    placeholder="0.00"
                    className="bg-transparent text-xs text-right text-gray-200 border-0 focus:outline-none w-full placeholder-gray-600"
                  />
                  <button onClick={() => removeLine(i)} disabled={lines.length <= 2}
                    className="text-gray-600 hover:text-rose-400 disabled:opacity-30 ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Totals row */}
              <div className={`grid grid-cols-[180px_1fr_110px_110px_32px] gap-0 border-t px-3 py-2 items-center
                ${balanced ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                <span className={`col-span-2 text-xs font-bold ${balanced ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {balanced ? '✓ Balanced' : `Difference: ${fmt$(Math.abs(totalDr - totalCr))}`}
                </span>
                <span className={`text-xs font-bold text-right ${balanced ? 'text-emerald-400' : 'text-amber-400'}`}>{fmt$(totalDr)}</span>
                <span className={`text-xs font-bold text-right ${balanced ? 'text-emerald-400' : 'text-amber-400'}`}>{fmt$(totalCr)}</span>
                <span />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3 shrink-0 bg-gray-950/40">
          <button onClick={onClose} className={`${UI.btn} ${UI.btnGhost}`}>Cancel</button>
          <button onClick={() => handleSave('Draft')} disabled={!memo.trim()}
            className={`${UI.btn} bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:opacity-40`}>
            Save Draft
          </button>
          <button onClick={() => handleSave('Posted')} disabled={!balanced || !memo.trim()}
            className={`${UI.btn} ${UI.btnPrimary} disabled:opacity-40`}>
            <Check className="w-3.5 h-3.5" /> Post Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────────────────────
function ChartOfAccountsTab({ accounts, onDrilldown }) {
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newAcct, setNewAcct] = useState({ num:'', name:'', type:'Expense', normalBal:'debit' });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(a => !q || a.num.includes(q) || a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
  }, [accounts, search]);

  const grouped = useMemo(() => {
    const map = {};
    TYPE_ORDER.forEach(t => { map[t] = []; });
    filtered.forEach(a => { if (map[a.type]) map[a.type].push(a); });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search accounts…"
          className={`${UI.input} max-w-xs`}
        />
        <div className="ml-auto">
          <button onClick={() => setShowNew(v => !v)} className={`${UI.btn} ${UI.btnPrimary}`}>
            <Plus className="w-3.5 h-3.5" /> New Account
          </button>
        </div>
      </div>

      {/* Inline new account form */}
      {showNew && (
        <div className="bg-gray-800/60 border border-violet-500/20 rounded-xl p-4 grid grid-cols-4 gap-3 items-end">
          <div>
            <label className={UI.label}>Account #</label>
            <input value={newAcct.num} onChange={e => setNewAcct(p => ({...p, num: e.target.value}))} placeholder="7000" className={UI.input} />
          </div>
          <div className="col-span-2">
            <label className={UI.label}>Account Name</label>
            <input value={newAcct.name} onChange={e => setNewAcct(p => ({...p, name: e.target.value}))} placeholder="Account name…" className={UI.input} />
          </div>
          <div>
            <label className={UI.label}>Type</label>
            <select value={newAcct.type} onChange={e => setNewAcct(p => ({...p, type: e.target.value}))} className={`${UI.select} w-full`}>
              {TYPE_ORDER.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-4 flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className={`${UI.btn} ${UI.btnGhost}`}>Cancel</button>
            <button onClick={() => setShowNew(false)} className={`${UI.btn} ${UI.btnPrimary}`}>
              <Check className="w-3 h-3" /> Add Account
            </button>
          </div>
        </div>
      )}

      {/* Account groups */}
      {TYPE_ORDER.map(type => {
        const accts = grouped[type];
        if (!accts.length) return null;
        const typeTotal = accts.reduce((s, a) => s + a.balance, 0);
        const c = TYPE_COLOR[type];
        return (
          <div key={type} className={`${UI.card} overflow-hidden`}>
            <div className={`px-4 py-2.5 flex items-center justify-between border-b border-gray-800 ${c.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${c.text}`}>{type}</span>
                <span className="text-xs text-gray-500">{accts.length} accounts</span>
              </div>
              <span className={`text-xs font-bold ${c.text}`}>{fmt$(typeTotal)}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left px-4 py-2 w-20">Acct #</th>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2 w-24 hidden sm:table-cell">Sub-type</th>
                  <th className="text-left px-4 py-2 w-20">Normal</th>
                  <th className="text-right px-4 py-2 w-32">Balance</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {accts.map(a => (
                  <tr key={a.id} onClick={() => onDrilldown(a)}
                    className="border-t border-gray-800/60 hover:bg-gray-800/40 cursor-pointer transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{a.num}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-200">{a.name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">{a.sub || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        a.normalBal === 'debit' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-violet-500/10 text-violet-400'
                      }`}>{a.normalBal.charAt(0).toUpperCase() + a.normalBal.slice(1)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-gray-100">{fmt$(a.balance)}</td>
                    <td className="px-4 py-2.5 text-gray-600 hover:text-cyan-400">
                      <Eye className="w-3.5 h-3.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: JOURNAL ENTRIES
// ─────────────────────────────────────────────────────────────────────────────
function JournalEntriesTab({ journals, accounts, period, periodStatus, onPost, onVoid, onAdd }) {
  const [expanded, setExpanded] = useState(null);
  const [filterType,   setFT] = useState('All');
  const [filterStatus, setFS] = useState('All');

  const acctMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a])), [accounts]);

  const filtered = useMemo(() => {
    return journals
      .filter(j => j.period === period)
      .filter(j => filterType   === 'All' || j.type   === filterType)
      .filter(j => filterStatus === 'All' || j.status === filterStatus)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [journals, period, filterType, filterStatus]);

  const periodLocked = periodStatus === 'Locked' || periodStatus === 'Closed';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterType} onChange={e => setFT(e.target.value)} className={`${UI.select} text-xs`}>
          {['All','System','Manual'].map(v => <option key={v}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFS(e.target.value)} className={`${UI.select} text-xs`}>
          {['All','Posted','Draft','Void'].map(v => <option key={v}>{v}</option>)}
        </select>
        <span className="text-xs text-gray-500">{filtered.length} entries</span>
        <div className="ml-auto">
          {!periodLocked && (
            <button onClick={onAdd} className={`${UI.btn} ${UI.btnPrimary}`}>
              <Plus className="w-3.5 h-3.5" /> New Entry
            </button>
          )}
          {periodLocked && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Lock className="w-3 h-3" /> Period closed — no new entries
            </span>
          )}
        </div>
      </div>

      {/* Entry list */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-600 text-sm">No journal entries match your filters.</div>
      )}

      {filtered.map(je => {
        const drTotal = je.lines.reduce((s, l) => s + l.debit, 0);
        const isOpen  = expanded === je.id;
        return (
          <div key={je.id} className={`${UI.card} overflow-hidden ${je.status === 'Void' ? 'opacity-50' : ''}`}>
            {/* Entry header row */}
            <div
              onClick={() => setExpanded(isOpen ? null : je.id)}
              className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
            >
              <span className="font-mono text-xs text-gray-400 w-20 shrink-0">{je.id}</span>
              <span className="text-xs text-gray-500 w-24 shrink-0">{je.date}</span>
              <span className="flex-1 text-sm font-medium text-gray-200 truncate">{je.memo}</span>
              {je.ref && <span className="text-xs text-gray-600 hidden sm:block">{je.ref}</span>}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                je.type === 'System' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'
              }`}>{je.type}</span>
              <StatusPill status={je.status} />
              <span className="font-mono text-sm font-bold text-gray-100 w-28 text-right shrink-0">{fmt$(drTotal)}</span>
              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
            </div>

            {/* Expanded lines */}
            {isOpen && (
              <div className="border-t border-gray-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-600 uppercase bg-gray-800/40">
                      <th className="text-left px-4 py-2">Account</th>
                      <th className="text-left px-4 py-2">Description</th>
                      <th className="text-right px-4 py-2 w-28">Debit</th>
                      <th className="text-right px-4 py-2 w-28">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {je.lines.map((ln, i) => {
                      const acct = acctMap[ln.acct];
                      return (
                        <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-800/20">
                          <td className="px-4 py-2 font-medium text-gray-300">
                            <span className="font-mono text-gray-500">{ln.acct}</span>
                            {acct && <span className="ml-2 text-gray-400">{acct.name}</span>}
                          </td>
                          <td className="px-4 py-2 text-gray-500">{ln.desc}</td>
                          <td className="px-4 py-2 text-right font-mono text-gray-200">{ln.debit  > 0 ? fmt$(ln.debit)  : ''}</td>
                          <td className="px-4 py-2 text-right font-mono text-gray-200">{ln.credit > 0 ? fmt$(ln.credit) : ''}</td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-gray-700 bg-gray-800/30 font-bold">
                      <td colSpan={2} className="px-4 py-2 text-xs text-gray-400">Total</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-400">{fmt$(je.lines.reduce((s,l)=>s+l.debit,0))}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-400">{fmt$(je.lines.reduce((s,l)=>s+l.credit,0))}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Entry actions */}
                {!periodLocked && (
                  <div className="px-4 py-3 border-t border-gray-800 flex gap-2 justify-end bg-gray-950/30">
                    {je.status === 'Draft' && (
                      <button onClick={() => onPost(je.id)} className={`${UI.btn} ${UI.btnEmerald}`}>
                        <Check className="w-3 h-3" /> Post Entry
                      </button>
                    )}
                    {je.status === 'Posted' && je.type === 'Manual' && (
                      <button onClick={() => onVoid(je.id)} className={`${UI.btn} ${UI.btnDanger}`}>
                        <X className="w-3 h-3" /> Void
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: GENERAL LEDGER (account drilldown)
// ─────────────────────────────────────────────────────────────────────────────
function GeneralLedgerTab({ accounts, journals, period }) {
  const [selectedAcct, setSelectedAcct] = useState('1100');

  const acct = useMemo(() => accounts.find(a => a.id === selectedAcct), [accounts, selectedAcct]);

  const ledgerLines = useMemo(() => {
    if (!acct) return [];
    const lines = [];
    journals
      .filter(j => j.period === period && j.status !== 'Void')
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(je => {
        je.lines.forEach(ln => {
          if (ln.acct === acct.id) {
            lines.push({ date: je.date, jeId: je.id, desc: je.memo || ln.desc, ref: je.ref, debit: ln.debit, credit: ln.credit });
          }
        });
      });

    // compute running balance
    const openingBal = acct.balance - lines.reduce((s, l) => s + l.debit - l.credit, 0);
    let running = openingBal;
    return lines.map(l => {
      if (acct.normalBal === 'debit') {
        running += l.debit - l.credit;
      } else {
        running += l.credit - l.debit;
      }
      return { ...l, running };
    });
  }, [acct, journals, period]);

  const openingBal = acct
    ? acct.balance - ledgerLines.reduce((s, l) => s + l.debit - l.credit, 0)
    : 0;

  return (
    <div className="space-y-4">
      {/* Account selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className={UI.label}>Account</label>
          <select value={selectedAcct} onChange={e => setSelectedAcct(e.target.value)} className={`${UI.select} min-w-[260px]`}>
            {[...accounts].sort((a,b) => a.num.localeCompare(b.num)).map(a => (
              <option key={a.id} value={a.id}>{a.num} · {a.name}</option>
            ))}
          </select>
        </div>
        {acct && (
          <div className="mt-4 flex items-center gap-3">
            <TypeBadge type={acct.type} />
            <span className="text-xs text-gray-500">Normal balance:</span>
            <span className={`text-xs font-bold ${acct.normalBal === 'debit' ? 'text-cyan-400' : 'text-violet-400'}`}>
              {acct.normalBal.charAt(0).toUpperCase() + acct.normalBal.slice(1)}
            </span>
          </div>
        )}
      </div>

      {acct && (
        <div className={`${UI.card} overflow-hidden`}>
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-800/30">
            <h3 className="font-bold text-gray-100">{acct.num} · {acct.name}</h3>
            <span className="font-mono text-sm font-bold text-gray-100">{fmt$(acct.balance)} balance</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-800/20">
                <th className="text-left px-4 py-2.5 w-28">Date</th>
                <th className="text-left px-4 py-2.5 w-24">Entry</th>
                <th className="text-left px-4 py-2.5">Description</th>
                <th className="text-right px-4 py-2.5 w-28">Debit</th>
                <th className="text-right px-4 py-2.5 w-28">Credit</th>
                <th className="text-right px-4 py-2.5 w-32">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              <tr className="border-t border-gray-800 bg-gray-800/20">
                <td className="px-4 py-2 text-xs text-gray-500">2026-05-01</td>
                <td className="px-4 py-2 text-xs text-gray-500">Opening</td>
                <td className="px-4 py-2 text-xs text-gray-400 italic">Opening balance – period start</td>
                <td className="px-4 py-2 text-right text-gray-500" />
                <td className="px-4 py-2 text-right text-gray-500" />
                <td className="px-4 py-2 text-right font-mono font-bold text-gray-300">{fmt$(openingBal)}</td>
              </tr>

              {ledgerLines.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-600 text-xs">No activity this period.</td></tr>
              )}

              {ledgerLines.map((l, i) => (
                <tr key={i} className="border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{l.date}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.jeId}</td>
                  <td className="px-4 py-2.5 text-gray-300 truncate max-w-xs">{l.desc}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-cyan-400">{l.debit  > 0 ? fmt$(l.debit)  : ''}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-violet-400">{l.credit > 0 ? fmt$(l.credit) : ''}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-gray-100">{fmt$(l.running)}</td>
                </tr>
              ))}

              {/* Closing balance */}
              <tr className="border-t-2 border-gray-700 bg-gray-800/30 font-bold">
                <td colSpan={3} className="px-4 py-2.5 text-xs text-gray-400 font-bold">Period-end balance</td>
                <td className="px-4 py-2.5 text-right font-mono text-cyan-400">
                  {fmt$(ledgerLines.reduce((s,l)=>s+l.debit,0))}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-violet-400">
                  {fmt$(ledgerLines.reduce((s,l)=>s+l.credit,0))}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-lg font-extrabold text-emerald-400">
                  {fmt$(acct.balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: TRIAL BALANCE
// ─────────────────────────────────────────────────────────────────────────────
function TrialBalanceTab({ accounts }) {
  const sorted = useMemo(() =>
    [...accounts].sort((a, b) => a.num.localeCompare(b.num)),
    [accounts]
  );

  const totalDr = accounts.reduce((s, a) => s + (a.normalBal === 'debit'  ? a.balance : 0), 0);
  const totalCr = accounts.reduce((s, a) => s + (a.normalBal === 'credit' ? a.balance : 0), 0);
  const balanced = Math.abs(totalDr - totalCr) < 1;

  return (
    <div className="space-y-4">
      {/* Balance indicator */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold ${
        balanced
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
          : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
      }`}>
        {balanced
          ? <><CheckCircle2 className="w-4 h-4" /> Trial balance is in balance — total debits equal total credits.</>
          : <><AlertTriangle className="w-4 h-4" /> Out of balance — difference of {fmt$(Math.abs(totalDr - totalCr))}. Review journal entries.</>
        }
      </div>

      <div className={`${UI.card} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-800/20">
          <h3 className="font-bold text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> Trial Balance — May 2026
          </h3>
          <span className="text-xs text-gray-500">As of May 25, 2026</span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-gray-800/20">
              <th className="text-left px-4 py-2.5 w-20">Acct #</th>
              <th className="text-left px-4 py-2.5">Account Name</th>
              <th className="text-left px-4 py-2.5 w-24 hidden sm:table-cell">Type</th>
              <th className="text-right px-4 py-2.5 w-36">Debit</th>
              <th className="text-right px-4 py-2.5 w-36">Credit</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_ORDER.map(type => {
              const typeAccts = sorted.filter(a => a.type === type && a.balance > 0);
              if (!typeAccts.length) return null;
              return typeAccts.map((a, i) => (
                <tr key={a.id} className={`border-t border-gray-800/40 hover:bg-gray-800/20 transition-colors`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{a.num}</td>
                  <td className="px-4 py-2.5 text-gray-300">{a.name}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell"><TypeBadge type={a.type} /></td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-200">
                    {a.normalBal === 'debit' ? fmt$(a.balance) : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-200">
                    {a.normalBal === 'credit' ? fmt$(a.balance) : ''}
                  </td>
                </tr>
              ));
            })}
            {/* Totals */}
            <tr className="border-t-2 border-gray-600 bg-gray-800/30">
              <td colSpan={3} className="px-4 py-3 font-extrabold text-gray-100">TOTALS</td>
              <td className={`px-4 py-3 text-right font-mono font-extrabold text-lg ${balanced ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt$(totalDr)}</td>
              <td className={`px-4 py-3 text-right font-mono font-extrabold text-lg ${balanced ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt$(totalCr)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Assets',      val: accounts.filter(a=>a.type==='Asset'&&a.normalBal==='debit').reduce((s,a)=>s+a.balance,0) - accounts.filter(a=>a.type==='Asset'&&a.normalBal==='credit').reduce((s,a)=>s+a.balance,0), color:'text-cyan-400' },
          { label:'Total Liabilities', val: accounts.filter(a=>a.type==='Liability').reduce((s,a)=>s+a.balance,0), color:'text-rose-400' },
          { label:'Total Revenue',     val: accounts.filter(a=>a.type==='Revenue').reduce((s,a)=>s+a.balance,0), color:'text-emerald-400' },
          { label:'Total Expenses',    val: accounts.filter(a=>['COGS','Expense'].includes(a.type)).reduce((s,a)=>s+a.balance,0), color:'text-amber-400' },
        ].map(s => (
          <div key={s.label} className={`${UI.card} p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`font-mono font-extrabold text-lg ${s.color}`}>{fmt$(s.val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PERIODS (Period Close)
// ─────────────────────────────────────────────────────────────────────────────
function PeriodsTab({ periods, journals, onClose, onReopen }) {
  const [confirm, setConfirm] = useState(null);

  const enriched = useMemo(() => periods.map(p => ({
    ...p,
    jeCount:  journals.filter(j => j.period === p.id).length,
    draftCount: journals.filter(j => j.period === p.id && j.status === 'Draft').length,
  })), [periods, journals]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Closing a period prevents new journal entries from being posted to it. Locked periods cannot be reopened without admin access.
        All Draft entries must be posted or voided before closing a period.
      </p>

      {confirm && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-amber-400">Close period: {periods.find(p => p.id === confirm)?.label}?</p>
            <p className="text-xs text-gray-500 mt-0.5">This will prevent any new or modified journal entries for this period.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirm(null)} className={`${UI.btn} ${UI.btnGhost}`}>Cancel</button>
            <button onClick={() => { onClose(confirm); setConfirm(null); }} className={`${UI.btn} bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/25`}>
              <Lock className="w-3 h-3" /> Close Period
            </button>
          </div>
        </div>
      )}

      <div className={`${UI.card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-gray-800/20">
              <th className="text-left px-4 py-3">Period</th>
              <th className="text-left px-4 py-3 w-24">Status</th>
              <th className="text-right px-4 py-3 w-24">Entries</th>
              <th className="text-right px-4 py-3 w-24">Drafts</th>
              <th className="text-right px-4 py-3 w-36">Total Posted</th>
              <th className="w-32 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {enriched.map(p => (
              <tr key={p.id} className="border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-200">{p.label}</td>
                <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                <td className="px-4 py-3 text-right text-gray-400">{p.jeCount || p.entries}</td>
                <td className="px-4 py-3 text-right">
                  {p.draftCount > 0
                    ? <span className="text-amber-400 font-bold">{p.draftCount}</span>
                    : <span className="text-gray-600">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-200">{fmt$(p.posted)}</td>
                <td className="px-4 py-3 text-right">
                  {p.status === 'Open' && (
                    <button
                      onClick={() => p.draftCount > 0 ? alert(`Resolve ${p.draftCount} draft entries before closing.`) : setConfirm(p.id)}
                      className={`${UI.btn} ${UI.btnGhost} py-1 text-[11px]`}
                    >
                      <Lock className="w-3 h-3" /> Close
                    </button>
                  )}
                  {p.status === 'Closed' && (
                    <button onClick={() => onReopen(p.id)} className={`${UI.btn} ${UI.btnGhost} py-1 text-[11px]`}>
                      <Unlock className="w-3 h-3" /> Reopen
                    </button>
                  )}
                  {p.status === 'Locked' && (
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT LEDGER DRILLDOWN MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AccountLedgerModal({ account, journals, onClose }) {
  const lines = useMemo(() => {
    const result = [];
    journals
      .filter(j => j.status !== 'Void')
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(je => je.lines.forEach(ln => {
        if (ln.acct === account.id) {
          result.push({ date: je.date, jeId: je.id, desc: je.memo, debit: ln.debit, credit: ln.credit });
        }
      }));
    let running = account.balance - result.reduce((s,l)=>s+l.debit-l.credit, 0);
    return result.map(l => {
      running += (account.normalBal === 'debit' ? l.debit - l.credit : l.credit - l.debit);
      return { ...l, running };
    });
  }, [account, journals]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{account.num} · <TypeBadge type={account.type} /></p>
            <h2 className="font-bold text-gray-100 mt-0.5">{account.name}</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-gray-300" /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase bg-gray-800/30 sticky top-0">
                <th className="text-left px-4 py-2.5 w-24">Date</th>
                <th className="text-left px-4 py-2.5">Description</th>
                <th className="text-right px-4 py-2.5 w-24">Debit</th>
                <th className="text-right px-4 py-2.5 w-24">Credit</th>
                <th className="text-right px-4 py-2.5 w-28">Balance</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-gray-800/40 hover:bg-gray-800/20">
                  <td className="px-4 py-2 text-xs text-gray-500">{l.date}</td>
                  <td className="px-4 py-2 text-gray-300 truncate">{l.desc}</td>
                  <td className="px-4 py-2 text-right font-mono text-cyan-400">{l.debit  > 0 ? fmt$(l.debit)  : ''}</td>
                  <td className="px-4 py-2 text-right font-mono text-violet-400">{l.credit > 0 ? fmt$(l.credit) : ''}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-gray-200">{fmt$(l.running)}</td>
                </tr>
              ))}
              {lines.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-xs">No transactions on file.</td></tr>}
              <tr className="border-t-2 border-gray-700 bg-gray-800/30 font-bold">
                <td colSpan={4} className="px-4 py-3 text-xs text-gray-400">Current Balance</td>
                <td className="px-4 py-3 text-right font-mono font-extrabold text-lg text-emerald-400">{fmt$(account.balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────
export default function GLModule() {
  const { activeUser } = useKernal();

  const [activeTab,    setActiveTab]    = useState('coa');
  const [accounts,     setAccounts]     = useState(INITIAL_ACCOUNTS);
  const [journals,     setJournals]     = useState(INITIAL_JOURNALS);
  const [periods,      setPeriods]      = useState(INITIAL_PERIODS);
  const [activePeriod, setActivePeriod] = useState('FY26-05');
  const [showNewJE,    setShowNewJE]    = useState(false);
  const [drilldown,    setDrilldown]    = useState(null); // account object

  const canWrite = activeUser && ['admin', 'manager', 'accountant'].includes(activeUser.role);

  const currentPeriod = useMemo(() => periods.find(p => p.id === activePeriod), [periods, activePeriod]);

  // KPIs
  const totalAssets     = accounts.filter(a => a.type === 'Asset' && a.normalBal === 'debit').reduce((s,a)=>s+a.balance,0)
                        - accounts.filter(a => a.type === 'Asset' && a.normalBal === 'credit').reduce((s,a)=>s+a.balance,0);
  const totalRevMTD     = accounts.filter(a => a.type === 'Revenue').reduce((s,a)=>s+a.balance,0);
  const totalExpMTD     = accounts.filter(a => ['COGS','Expense'].includes(a.type)).reduce((s,a)=>s+a.balance,0);
  const netIncomeMTD    = totalRevMTD - totalExpMTD;
  const draftCount      = journals.filter(j => j.status === 'Draft').length;

  // Actions
  const handlePost  = (jeId) => setJournals(p => p.map(j => j.id === jeId ? { ...j, status: 'Posted' } : j));
  const handleVoid  = (jeId) => setJournals(p => p.map(j => j.id === jeId ? { ...j, status: 'Void'   } : j));
  const handleAddJE = (je)   => setJournals(p => [je, ...p]);
  const handleClosePeriod  = (id) => setPeriods(p => p.map(pd => pd.id === id ? { ...pd, status: 'Closed' } : pd));
  const handleReopenPeriod = (id) => setPeriods(p => p.map(pd => pd.id === id ? { ...pd, status: 'Open'   } : pd));

  const TABS = [
    { id:'coa',  label:'Chart of Accounts', Icon: Layers    },
    { id:'je',   label:'Journal Entries',   Icon: FileText, badge: draftCount || null },
    { id:'gl',   label:'General Ledger',    Icon: BookOpen  },
    { id:'tb',   label:'Trial Balance',     Icon: BarChart3 },
    { id:'per',  label:'Periods',           Icon: Lock      },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className={`${UI.glassHeader} px-6 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <div>
              <h1 className="font-extrabold text-gray-100 text-lg leading-none">General Ledger</h1>
              <p className="text-xs text-gray-500 mt-0.5">Double-entry accounting · Source of truth</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Period selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Period:</span>
              <select
                value={activePeriod}
                onChange={e => setActivePeriod(e.target.value)}
                className={`${UI.select} text-xs`}
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.label} — {p.status}</option>
                ))}
              </select>
              <StatusPill status={currentPeriod?.status || 'Open'} />
            </div>

            {canWrite && currentPeriod?.status === 'Open' && (
              <button onClick={() => setShowNewJE(true)} className={`${UI.btn} ${UI.btnPrimary}`}>
                <Plus className="w-3.5 h-3.5" /> New Journal Entry
              </button>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label:'Total Assets',       val: fmt$(totalAssets),   color:'text-cyan-400'    },
            { label:'MTD Revenue',        val: fmt$(totalRevMTD),   color:'text-emerald-400' },
            { label:'MTD Expenses',       val: fmt$(totalExpMTD),   color:'text-amber-400'   },
            { label:'Net Income MTD',     val: fmt$(netIncomeMTD),  color: netIncomeMTD >= 0 ? 'text-emerald-400' : 'text-rose-400' },
          ].map(k => (
            <div key={k.label} className="bg-gray-800/50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</p>
              <p className={`font-mono font-extrabold text-base mt-0.5 ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-800 bg-gray-950 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge ? (
                <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/25">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {activeTab === 'coa'  && <ChartOfAccountsTab   accounts={accounts} onDrilldown={setDrilldown} />}
        {activeTab === 'je'   && <JournalEntriesTab    journals={journals} accounts={accounts} period={activePeriod} periodStatus={currentPeriod?.status} onPost={handlePost} onVoid={handleVoid} onAdd={() => setShowNewJE(true)} />}
        {activeTab === 'gl'   && <GeneralLedgerTab     accounts={accounts} journals={journals} period={activePeriod} />}
        {activeTab === 'tb'   && <TrialBalanceTab      accounts={accounts} />}
        {activeTab === 'per'  && <PeriodsTab           periods={periods} journals={journals} onClose={handleClosePeriod} onReopen={handleReopenPeriod} />}
      </div>

      {/* Modals */}
      {showNewJE && (
        <NewJEModal accounts={accounts} periodId={activePeriod} onSave={handleAddJE} onClose={() => setShowNewJE(false)} />
      )}
      {drilldown && (
        <AccountLedgerModal account={drilldown} journals={journals} onClose={() => setDrilldown(null)} />
      )}
    </div>
  );
}
