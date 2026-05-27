import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';
import { DEMO_MODE } from './lib/demoMode.js';

import {
  Link2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock,
  ChevronRight, ChevronDown, ArrowRight, ArrowLeftRight, ArrowLeft,
  Download, Upload, Settings, Zap, Globe, FileText, AlertTriangle,
  Play, Pause, RotateCcw, Eye, EyeOff, X, Check, Plus,
  TrendingUp, Activity, Database, Plug, Unplug,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — mock data
// ─────────────────────────────────────────────────────────────────────────────

const KERNAL_ACCOUNTS = [
  { code: '1000', name: 'Cash — Operating',         type: 'Asset'     },
  { code: '1100', name: 'Cash — Payroll',            type: 'Asset'     },
  { code: '1200', name: 'Accounts Receivable',       type: 'Asset'     },
  { code: '1400', name: 'Inventory Asset',           type: 'Asset'     },
  { code: '1500', name: 'Prepaid Expenses',          type: 'Asset'     },
  { code: '2100', name: 'Accounts Payable',          type: 'Liability' },
  { code: '2200', name: 'Accrued Liabilities',       type: 'Liability' },
  { code: '2300', name: 'Sales Tax Payable',         type: 'Liability' },
  { code: '3100', name: 'Owner Equity',              type: 'Equity'    },
  { code: '4100', name: 'Revenue — Food Sales',      type: 'Revenue'   },
  { code: '4200', name: 'Revenue — Delivery Fees',  type: 'Revenue'   },
  { code: '4900', name: 'Revenue — Misc',            type: 'Revenue'   },
  { code: '5100', name: 'COGS — Food Products',      type: 'COGS'      },
  { code: '5200', name: 'COGS — Freight In',         type: 'COGS'      },
  { code: '6100', name: 'Payroll Expense',           type: 'Expense'   },
  { code: '6200', name: 'Fuel & Vehicle',            type: 'Expense'   },
  { code: '6300', name: 'Rent & Facilities',         type: 'Expense'   },
  { code: '6400', name: 'Insurance',                 type: 'Expense'   },
  { code: '6500', name: 'Utilities',                 type: 'Expense'   },
  { code: '6900', name: 'Miscellaneous Expense',     type: 'Expense'   },
];

const QBO_ACCOUNTS = [
  { id: 'qbo-1',  name: 'Checking',                       type: 'Bank'            },
  { id: 'qbo-2',  name: 'Savings',                        type: 'Bank'            },
  { id: 'qbo-3',  name: 'Accounts Receivable (A/R)',      type: 'Accounts Receivable' },
  { id: 'qbo-4',  name: 'Inventory Asset',                type: 'Other Current Asset' },
  { id: 'qbo-5',  name: 'Prepaid Expenses',               type: 'Other Current Asset' },
  { id: 'qbo-6',  name: 'Accounts Payable (A/P)',         type: 'Accounts Payable' },
  { id: 'qbo-7',  name: 'Sales Tax Payable',              type: 'Other Current Liability' },
  { id: 'qbo-8',  name: 'Opening Balance Equity',         type: 'Equity'          },
  { id: 'qbo-9',  name: 'Sales of Product Income',        type: 'Income'          },
  { id: 'qbo-10', name: 'Delivery Income',                type: 'Income'          },
  { id: 'qbo-11', name: 'Other Income',                   type: 'Other Income'    },
  { id: 'qbo-12', name: 'Cost of Goods Sold',             type: 'Cost of Goods Sold' },
  { id: 'qbo-13', name: 'Freight & Shipping Costs',       type: 'Cost of Goods Sold' },
  { id: 'qbo-14', name: 'Payroll Expenses',               type: 'Expense'         },
  { id: 'qbo-15', name: 'Auto',                           type: 'Expense'         },
  { id: 'qbo-16', name: 'Rent or Lease',                  type: 'Expense'         },
  { id: 'qbo-17', name: 'Insurance',                      type: 'Expense'         },
  { id: 'qbo-18', name: 'Utilities',                      type: 'Expense'         },
  { id: 'qbo-19', name: 'Miscellaneous',                  type: 'Expense'         },
  { id: '',       name: '— Not mapped —',                 type: ''                },
];

const XERO_ACCOUNTS = [
  { id: 'xero-1',  name: 'Business Bank Account',         type: 'Bank'            },
  { id: 'xero-2',  name: 'Trade Debtors',                 type: 'Current Asset'   },
  { id: 'xero-3',  name: 'Inventory',                     type: 'Current Asset'   },
  { id: 'xero-4',  name: 'Prepayments',                   type: 'Current Asset'   },
  { id: 'xero-5',  name: 'Trade Creditors',               type: 'Current Liability' },
  { id: 'xero-6',  name: 'GST',                           type: 'Current Liability' },
  { id: 'xero-7',  name: 'Retained Earnings',             type: 'Equity'          },
  { id: 'xero-8',  name: 'Sales',                         type: 'Revenue'         },
  { id: 'xero-9',  name: 'Delivery Revenue',              type: 'Revenue'         },
  { id: 'xero-10', name: 'Other Revenue',                 type: 'Revenue'         },
  { id: 'xero-11', name: 'Cost of Sales',                 type: 'Direct Costs'    },
  { id: 'xero-12', name: 'Freight & Courier',             type: 'Direct Costs'    },
  { id: 'xero-13', name: 'Wages & Salaries',              type: 'Expense'         },
  { id: 'xero-14', name: 'Motor Vehicle Expenses',        type: 'Expense'         },
  { id: 'xero-15', name: 'Rent',                          type: 'Expense'         },
  { id: 'xero-16', name: 'Insurance',                     type: 'Expense'         },
  { id: 'xero-17', name: 'Utilities',                     type: 'Expense'         },
  { id: 'xero-18', name: 'General Expenses',              type: 'Expense'         },
  { id: '',        name: '— Not mapped —',                type: ''                },
];

// Default account mapping (Kernel code → external account id)
const DEFAULT_MAPPING_QBO = {
  '1000': 'qbo-1', '1100': 'qbo-2', '1200': 'qbo-3', '1400': 'qbo-4',
  '1500': 'qbo-5', '2100': 'qbo-6', '2200': '',      '2300': 'qbo-7',
  '3100': 'qbo-8', '4100': 'qbo-9', '4200': 'qbo-10','4900': 'qbo-11',
  '5100': 'qbo-12','5200': 'qbo-13','6100': 'qbo-14','6200': 'qbo-15',
  '6300': 'qbo-16','6400': 'qbo-17','6500': 'qbo-18','6900': 'qbo-19',
};
const DEFAULT_MAPPING_XERO = {
  '1000': 'xero-1', '1100': 'xero-1', '1200': 'xero-2', '1400': 'xero-3',
  '1500': 'xero-4', '2100': 'xero-5', '2200': '',       '2300': 'xero-6',
  '3100': 'xero-7', '4100': 'xero-8', '4200': 'xero-9', '4900': 'xero-10',
  '5100': 'xero-11','5200': 'xero-12','6100': 'xero-13','6200': 'xero-14',
  '6300': 'xero-15','6400': 'xero-16','6500': 'xero-17','6900': 'xero-18',
};

const SYNC_OBJECTS = [
  { id: 'invoices',   label: 'Invoices',          desc: 'Customer invoices and credit memos',          icon: FileText,   defaultDir: 'push',  defaultFreq: 'realtime', critical: true  },
  { id: 'payments',   label: 'Payments Received',  desc: 'Customer payment postings',                   icon: TrendingUp, defaultDir: 'push',  defaultFreq: 'realtime', critical: true  },
  { id: 'bills',      label: 'Vendor Bills (AP)',  desc: 'PO-linked vendor bills',                      icon: Download,   defaultDir: 'push',  defaultFreq: 'daily',    critical: true  },
  { id: 'billpay',    label: 'Bill Payments',      desc: 'Check and ACH payments to vendors',           icon: Upload,     defaultDir: 'push',  defaultFreq: 'daily',    critical: false },
  { id: 'customers',  label: 'Customers',          desc: 'Customer master — name, address, terms',      icon: Globe,      defaultDir: 'both',  defaultFreq: 'daily',    critical: false },
  { id: 'vendors',    label: 'Vendors / Suppliers',desc: 'Vendor master — contact, payment terms',      icon: Database,   defaultDir: 'both',  defaultFreq: 'daily',    critical: false },
  { id: 'items',      label: 'Products / Items',   desc: 'SKU catalog and pricing for QB/Xero items',  icon: Activity,   defaultDir: 'push',  defaultFreq: 'daily',    critical: false },
  { id: 'expenses',   label: 'Expense Transactions',desc: 'Credit card and misc expense entries',       icon: Zap,        defaultDir: 'push',  defaultFreq: 'daily',    critical: false },
];

const MOCK_SYNC_LOG = [
  {
    id: 'sync-001', date: '2026-05-26', time: '06:00', trigger: 'Scheduled',
    durationMs: 11800, status: 'success',
    counts: { invoices: 47, payments: 18, bills: 12, billpay: 6, customers: 2, vendors: 0, items: 5, expenses: 3 },
    errors: [],
  },
  {
    id: 'sync-002', date: '2026-05-25', time: '06:00', trigger: 'Scheduled',
    durationMs: 13200, status: 'success',
    counts: { invoices: 43, payments: 15, bills: 9, billpay: 4, customers: 1, vendors: 1, items: 0, expenses: 2 },
    errors: [],
  },
  {
    id: 'sync-003', date: '2026-05-24', time: '06:00', trigger: 'Scheduled',
    durationMs: 18400, status: 'partial',
    counts: { invoices: 51, payments: 22, bills: 11, billpay: 5, customers: 3, vendors: 0, items: 7, expenses: 4 },
    errors: [
      { object: 'invoices', record: 'INV-4821', message: 'Customer "Harbor Hotel" not found in QuickBooks. Create customer first or re-map.' },
      { object: 'items',    record: 'PRO-LET-01', message: 'Duplicate SKU detected in QB — item exists under two names. Resolve in QB before re-syncing.' },
    ],
  },
  {
    id: 'sync-004', date: '2026-05-23', time: '06:00', trigger: 'Scheduled',
    durationMs: 10900, status: 'success',
    counts: { invoices: 38, payments: 14, bills: 8, billpay: 3, customers: 0, vendors: 0, items: 0, expenses: 1 },
    errors: [],
  },
  {
    id: 'sync-005', date: '2026-05-22', time: '14:32', trigger: 'Manual (admin)',
    durationMs: 8100, status: 'success',
    counts: { invoices: 12, payments: 5, bills: 0, billpay: 0, customers: 4, vendors: 2, items: 8, expenses: 0 },
    errors: [],
  },
  {
    id: 'sync-006', date: '2026-05-19', time: '06:00', trigger: 'Scheduled',
    durationMs: 15600, status: 'error',
    counts: { invoices: 0, payments: 0, bills: 0, billpay: 0, customers: 0, vendors: 0, items: 0, expenses: 0 },
    errors: [
      { object: 'connection', record: '—', message: 'OAuth token expired. QuickBooks session timed out after 60-day inactivity limit. Reconnect to resume.' },
    ],
  },
];

const SYNC_STEPS_QBO = [
  { label: 'Authenticating with QuickBooks Online',   ms: 600  },
  { label: 'Fetching QB account list',                ms: 500  },
  { label: 'Syncing invoices',                        ms: 900,  count: '47 records' },
  { label: 'Syncing payments received',               ms: 700,  count: '18 records' },
  { label: 'Syncing vendor bills',                    ms: 700,  count: '12 records' },
  { label: 'Syncing bill payments',                   ms: 500,  count: '6 records'  },
  { label: 'Syncing customer master',                 ms: 400,  count: '2 updated'  },
  { label: 'Syncing product/item catalog',            ms: 400,  count: '5 records'  },
  { label: 'Verifying GL account balances',           ms: 600  },
  { label: 'Finalising and closing session',          ms: 400  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtMs   = (ms) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
const totalRecords = (counts) => Object.values(counts).reduce((s, n) => s + n, 0);

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH MODAL — simulates the QB / Xero OAuth popup
// ─────────────────────────────────────────────────────────────────────────────
function OAuthModal({ platform, onSuccess, onClose }) {
  const [phase, setPhase] = useState('redirect'); // redirect | authorizing | success | error
  const isQBO = platform === 'qbo';
  const color = isQBO ? 'text-[#2CA01C]' : 'text-[#13b5ea]';
  const bgColor = isQBO ? 'bg-[#2CA01C]/10 border-[#2CA01C]/25' : 'bg-[#13b5ea]/10 border-[#13b5ea]/25';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('authorizing'), 1400);
    const t2 = setTimeout(() => setPhase('success'), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase === 'success') {
      const t = setTimeout(onSuccess, 900);
      return () => clearTimeout(t);
    }
  }, [phase, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-black border ${bgColor} ${color}`}>
              {isQBO ? 'QB' : 'X'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-100">{isQBO ? 'QuickBooks Online' : 'Xero'}</p>
              <p className="text-xs text-gray-500">OAuth 2.0 Authorization</p>
            </div>
          </div>
          {phase !== 'success' && (
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-6 text-center space-y-4">
          {phase === 'redirect' && (
            <>
              <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 mx-auto flex items-center justify-center">
                <Globe className="w-7 h-7 text-gray-400 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-200">Opening {isQBO ? 'QuickBooks' : 'Xero'} sign-in…</p>
                <p className="text-xs text-gray-500 mt-1">You'll be redirected to authorize Kernel ERM</p>
              </div>
            </>
          )}
          {phase === 'authorizing' && (
            <>
              <div className="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 mx-auto flex items-center justify-center">
                <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-200">Authorizing access…</p>
                <p className="text-xs text-gray-500 mt-1">Requesting permission to read and write financial data</p>
              </div>
              <div className="space-y-1.5 text-left">
                {['Read and write invoices','Read and write bills & payments','Read accounts & chart of accounts','Read customers & vendors'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {s}
                  </div>
                ))}
              </div>
            </>
          )}
          {phase === 'success' && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400">Connected!</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isQBO ? 'Gulf Coast Foodservice LLC — QBO Plus' : 'Gulf Coast Foodservice — Xero Starter'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC PROGRESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SyncProgressModal({ platform, onClose }) {
  const [step, setStep]       = useState(0);
  const [done, setDone]       = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let current = 0;
    let totalMs = 0;
    const timers = [];
    SYNC_STEPS_QBO.forEach((s, i) => {
      totalMs += s.ms;
      const t = setTimeout(() => { setStep(i + 1); }, totalMs);
      timers.push(t);
    });
    const done_t = setTimeout(() => setDone(true), totalMs + 300);
    timers.push(done_t);
    const ticker = setInterval(() => setElapsed(e => e + 100), 100);
    return () => { timers.forEach(clearTimeout); clearInterval(ticker); };
  }, []);

  const totalMs = SYNC_STEPS_QBO.reduce((s, st) => s + st.ms, 0);
  const progress = Math.min(100, (elapsed / (totalMs + 300)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${done ? '' : 'animate-spin'}`} />
            <p className="text-sm font-bold text-gray-100">{done ? 'Sync complete' : 'Syncing with QuickBooks Online…'}</p>
          </div>
          {done && (
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-6 space-y-5">
          {/* Progress bar */}
          <div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${done ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-500">{fmtMs(elapsed)}</span>
              <span className="text-[10px] text-gray-500">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-2">
            {SYNC_STEPS_QBO.map((s, i) => {
              const state = i < step ? 'done' : i === step && !done ? 'active' : 'pending';
              return (
                <div key={i} className={`flex items-center gap-3 text-xs transition-opacity ${state === 'pending' ? 'opacity-30' : 'opacity-100'}`}>
                  {state === 'done'   && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {state === 'active' && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
                  {state === 'pending'&& <div className="w-4 h-4 rounded-full border border-gray-700 shrink-0" />}
                  <span className={state === 'done' ? 'text-gray-400' : state === 'active' ? 'text-gray-100 font-bold' : 'text-gray-600'}>{s.label}</span>
                  {state === 'done' && s.count && <span className="ml-auto text-emerald-500 font-bold">{s.count}</span>}
                </div>
              );
            })}
          </div>

          {/* Done summary */}
          {done && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Sync successful
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['47','Invoices'],['18','Payments'],['12','Bills'],['5','Items']].map(([n, l]) => (
                  <div key={l} className="bg-gray-900/60 rounded-lg p-2">
                    <p className="text-base font-black text-gray-100">{n}</p>
                    <p className="text-[10px] text-gray-500">{l}</p>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full mt-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CONNECT
// ─────────────────────────────────────────────────────────────────────────────
function ConnectTab({ connection, onConnect, onDisconnect, onSyncNow }) {
  const [oauthTarget, setOauthTarget] = useState(null); // 'qbo' | 'xero'

  const handleOAuthSuccess = useCallback(() => {
    onConnect(oauthTarget);
    setOauthTarget(null);
  }, [oauthTarget, onConnect]);

  const PlatformCard = ({ id, name, tagline, color, tagBg, features, companyName, plan }) => {
    const isActive   = connection.active === id;
    const isDisabled = connection.active && connection.active !== id;
    return (
      <div className={`${UI.card} p-5 relative flex flex-col gap-4 transition-all ${isActive ? 'border-emerald-500/40' : ''} ${isDisabled ? 'opacity-50' : ''}`}>
        {isActive && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
            </span>
          </div>
        )}
        {/* Logo block */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border ${tagBg} ${color}`}>
            {id === 'qbo' ? 'QB' : 'X'}
          </div>
          <div>
            <p className="font-black text-gray-100 text-base">{name}</p>
            <p className="text-xs text-gray-500">{tagline}</p>
          </div>
        </div>

        {/* Connected state */}
        {isActive ? (
          <div className="space-y-3">
            <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Company</span>
                <span className="font-bold text-gray-200">{companyName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Plan</span>
                <span className="font-bold text-gray-200">{plan}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Connected since</span>
                <span className="font-bold text-gray-200">Jan 15, 2026</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Last sync</span>
                <span className="font-bold text-emerald-400">Today at 06:00 AM · 89 records</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Token expires</span>
                <span className="font-bold text-amber-400">Jul 15, 2026 (refresh auto)</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onSyncNow} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-semibold hover:bg-cyan-500/20 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Sync Now
              </button>
              <button onClick={() => onDisconnect(id)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-colors">
                <Unplug className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-1.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              disabled={isDisabled}
              onClick={() => !isDisabled && setOauthTarget(id)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-800 text-gray-600 border-gray-700'
                  : `bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700`
              }`}
            >
              <Plug className="w-4 h-4" /> Connect {name}
            </button>
            {isDisabled && (
              <p className="text-[10px] text-center text-gray-600">Disconnect the active integration first</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Explainer banner */}
      <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-4 flex items-start gap-3">
        <Link2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400 leading-relaxed">
          Connect Kernel ERM to your existing bookkeeping platform. Invoices, payments, and bills sync automatically — your accountant keeps working in the tool they know while operations run in Kernel.
          <span className="text-gray-500"> Only one platform can be active at a time.</span>
        </div>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlatformCard
          id="qbo"
          name="QuickBooks Online"
          tagline="Most common for US food distributors"
          color="text-[#2CA01C]"
          tagBg="bg-[#2CA01C]/10 border-[#2CA01C]/25"
          companyName="Gulf Coast Foodservice LLC"
          plan="QuickBooks Online Plus"
          features={[
            'Invoices, credit memos, and payments',
            'Vendor bills and bill payments',
            'Customer and vendor master sync',
            'Product/item catalog and pricing',
            'Chart of accounts mapping',
            'Real-time or scheduled sync',
          ]}
        />
        <PlatformCard
          id="xero"
          name="Xero"
          tagline="Popular in Australia, UK, Canada, NZ"
          color="text-[#13b5ea]"
          tagBg="bg-[#13b5ea]/10 border-[#13b5ea]/25"
          companyName="Gulf Coast Foodservice — Xero Starter"
          plan="Xero Starter"
          features={[
            'Invoices and credit notes to Xero',
            'Bills and purchase orders',
            'Bank feed reconciliation support',
            'Contacts (customers + suppliers)',
            'Chart of accounts and tracking',
            'Real-time or scheduled sync',
          ]}
        />
      </div>

      {/* Coming soon */}
      <div className={UI.card}>
        <div className="px-5 py-3 border-b border-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Integrations — Roadmap</p>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Sage Intacct',   sub: 'Mid-market accounting' },
            { name: 'NetSuite',        sub: 'Enterprise ERP sync'   },
            { name: 'FreshBooks',      sub: 'Small business billing' },
            { name: 'Wave',            sub: 'Free accounting'       },
          ].map(p => (
            <div key={p.name} className="bg-gray-800/40 border border-gray-800 rounded-xl p-3 opacity-50 text-center">
              <p className="text-sm font-bold text-gray-400">{p.name}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{p.sub}</p>
              <span className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-600 border border-gray-700">Coming soon</span>
            </div>
          ))}
        </div>
      </div>

      {oauthTarget && (
        <OAuthModal platform={oauthTarget} onSuccess={handleOAuthSuccess} onClose={() => setOauthTarget(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SYNC RULES
// ─────────────────────────────────────────────────────────────────────────────
function SyncRulesTab({ connection, syncConfig, setSyncConfig, onSyncNow }) {
  const isConnected = !!connection.active;
  const platformName = connection.active === 'qbo' ? 'QuickBooks' : 'Xero';

  const toggle = (id, field, val) =>
    setSyncConfig(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const DIR_OPTIONS = [
    { value: 'push', label: 'Kernel → ' + platformName, icon: ArrowRight },
    { value: 'pull', label: platformName + ' → Kernel', icon: ArrowLeft  },
    { value: 'both', label: 'Bidirectional',              icon: ArrowLeftRight },
  ];

  const FREQ_OPTIONS = [
    { value: 'realtime', label: 'Real-time' },
    { value: 'hourly',   label: 'Hourly'    },
    { value: 'daily',    label: 'Daily (6 AM)' },
    { value: 'manual',   label: 'Manual only' },
  ];

  if (!isConnected) {
    return (
      <div className={`${UI.cardPad} text-center py-12`}>
        <Plug className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="font-bold text-gray-500">No platform connected</p>
        <p className="text-sm text-gray-600 mt-1">Connect QuickBooks or Xero on the Connect tab first</p>
      </div>
    );
  }

  const enabledCount = Object.values(syncConfig).filter(c => c.enabled).length;

  return (
    <div className="space-y-5">
      {/* Header strip */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-200">{platformName} — Sync Rules</p>
          <p className="text-xs text-gray-500 mt-0.5">{enabledCount} of {SYNC_OBJECTS.length} objects enabled · Changes saved automatically</p>
        </div>
        <button onClick={onSyncNow} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-semibold hover:bg-cyan-500/20 transition-colors">
          <RefreshCw className="w-4 h-4" /> Sync Now
        </button>
      </div>

      {/* Object table */}
      <div className={`${UI.card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className={`${UI.th} w-8`}></th>
              <th className={UI.th}>Object</th>
              <th className={UI.th}>Direction</th>
              <th className={UI.th}>Frequency</th>
              <th className={`${UI.th} text-center`}>Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {SYNC_OBJECTS.map(obj => {
              const cfg = syncConfig[obj.id] || { enabled: false, dir: obj.defaultDir, freq: obj.defaultFreq };
              const Icon = obj.icon;
              return (
                <tr key={obj.id} className={`transition-colors ${cfg.enabled ? 'hover:bg-gray-800/30' : 'opacity-40 hover:opacity-60'}`}>
                  <td className="px-4 py-3">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-200 text-sm">{obj.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{obj.desc}</p>
                    {obj.critical && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-1 inline-block">Core</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {DIR_OPTIONS.map(d => {
                        const DirIcon = d.icon;
                        const active = cfg.dir === d.value;
                        return (
                          <button
                            key={d.value}
                            onClick={() => toggle(obj.id, 'dir', d.value)}
                            title={d.label}
                            className={`p-1.5 rounded-md border text-xs transition-colors ${active ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-gray-800/40 text-gray-600 border-gray-700 hover:text-gray-400'}`}
                          >
                            <DirIcon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {DIR_OPTIONS.find(d => d.value === cfg.dir)?.label}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={cfg.freq}
                      onChange={e => toggle(obj.id, 'freq', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {FREQ_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggle(obj.id, 'enabled', !cfg.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${cfg.enabled ? 'bg-cyan-500 border-cyan-500' : 'bg-gray-700 border-gray-600'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${cfg.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Conflict resolution policy */}
      <div className={UI.cardPad}>
        <h3 className="font-bold text-gray-200 text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Conflict Resolution Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'Invoices & Bills',  rule: 'Kernel wins — QB/Xero is updated to match', color: 'cyan'    },
            { label: 'Customers & Vendors',rule: 'Most recently updated wins',                color: 'amber'   },
            { label: 'Chart of Accounts', rule: 'QB/Xero wins — Kernel mapping updates',      color: 'violet'  },
          ].map(c => (
            <div key={c.label} className="bg-gray-800/40 border border-gray-800 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-300">{c.label}</p>
              <p className="text-[11px] text-gray-500 mt-1">{c.rule}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ACCOUNT MAPPING
// ─────────────────────────────────────────────────────────────────────────────
function AccountMappingTab({ connection, mapping, setMapping, showToast }) {
  const isConnected = !!connection.active;
  const isQBO = connection.active === 'qbo';
  const externalAccounts = isQBO ? QBO_ACCOUNTS : XERO_ACCOUNTS;
  const platformName = isQBO ? 'QuickBooks Online' : 'Xero';
  const [filter, setFilter] = useState('all');
  const [saved, setSaved] = useState(false);

  const TYPES = ['all', 'Asset', 'Liability', 'Equity', 'Revenue', 'COGS', 'Expense'];

  const filtered = useMemo(() =>
    KERNAL_ACCOUNTS.filter(a => filter === 'all' || a.type === filter),
  [filter]);

  const unmappedCount = KERNAL_ACCOUNTS.filter(a => !mapping[a.code]).length;

  const handleAutoMap = () => {
    const defaults = isQBO ? DEFAULT_MAPPING_QBO : DEFAULT_MAPPING_XERO;
    setMapping(defaults);
    showToast('Auto-mapped ' + Object.values(defaults).filter(Boolean).length + ' accounts');
  };

  const handleSave = () => {
    setSaved(true);
    showToast('Account mapping saved');
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className={`${UI.cardPad} text-center py-12`}>
        <Plug className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="font-bold text-gray-500">No platform connected</p>
        <p className="text-sm text-gray-600 mt-1">Connect QuickBooks or Xero on the Connect tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-bold text-gray-200">Account Mapping — Kernel GL → {platformName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {unmappedCount > 0
              ? <span className="text-amber-400">{unmappedCount} accounts unmapped — transactions may not post correctly</span>
              : <span className="text-emerald-400">All accounts mapped ✓</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAutoMap} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 text-xs font-semibold hover:bg-gray-700 transition-colors">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Auto-map
          </button>
          <button onClick={handleSave} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${saved ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'}`}>
            {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> : <><Check className="w-3.5 h-3.5" /> Save Mapping</>}
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-1 flex-wrap">
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filter === t ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 border border-transparent hover:bg-gray-800/60'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Mapping table */}
      <div className={`${UI.card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className={UI.th}>Kernel GL Account</th>
              <th className={UI.th}>Type</th>
              <th className="px-4 py-2.5 text-left">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> {platformName} Account
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(acct => {
              const mapped = mapping[acct.code];
              const extAcct = externalAccounts.find(e => e.id === mapped);
              const isMapped = mapped && mapped !== '';
              return (
                <tr key={acct.code} className={`hover:bg-gray-800/30 transition-colors ${!isMapped ? 'bg-amber-500/3' : ''}`}>
                  <td className="px-4 py-2.5">
                    <p className="font-bold text-gray-200 text-sm">{acct.name}</p>
                    <p className="text-[10px] text-gray-600 font-mono">{acct.code}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{acct.type}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={mapped || ''}
                      onChange={e => setMapping(prev => ({ ...prev, [acct.code]: e.target.value }))}
                      className={`w-full bg-gray-800 border rounded-md px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isMapped ? 'border-gray-700' : 'border-amber-500/40'}`}
                    >
                      {externalAccounts.map(e => (
                        <option key={e.id} value={e.id}>{e.name}{e.type ? ` (${e.type})` : ''}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-600 text-center">
        Account mapping controls how Kernel transactions post to your {platformName} books. Unmapped accounts will appear in {platformName} as "Undeposited Funds" until resolved.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SYNC LOG
// ─────────────────────────────────────────────────────────────────────────────
function SyncLogTab({ connection, syncLog, onSyncNow }) {
  const [expanded, setExpanded] = useState(null);
  const isConnected = !!connection.active;

  const STATUS_STYLE = {
    success: { pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', icon: CheckCircle2, iconCls: 'text-emerald-400' },
    partial:  { pill: 'bg-amber-500/10  text-amber-400  border-amber-500/25',  icon: AlertCircle,  iconCls: 'text-amber-400'  },
    error:    { pill: 'bg-rose-500/10   text-rose-400   border-rose-500/25',   icon: XCircle,      iconCls: 'text-rose-400'   },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-200">Sync History</p>
          <p className="text-xs text-gray-500 mt-0.5">Last 30 days · {syncLog.length} runs logged</p>
        </div>
        {isConnected && (
          <button onClick={onSyncNow} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-semibold hover:bg-cyan-500/20 transition-colors">
            <RefreshCw className="w-4 h-4" /> Sync Now
          </button>
        )}
      </div>

      {/* Log */}
      <div className={`${UI.card} overflow-hidden divide-y divide-gray-800/50`}>
        {syncLog.map(run => {
          const style = STATUS_STYLE[run.status];
          const StatusIcon = style.icon;
          const isOpen = expanded === run.id;
          const total = totalRecords(run.counts);

          return (
            <div key={run.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : run.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-800/30 transition-colors text-left"
              >
                <StatusIcon className={`w-4 h-4 shrink-0 ${style.iconCls}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-gray-200">{fmtDate(run.date)} at {run.time}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.pill}`}>
                      {run.status === 'partial' ? `Partial (${run.errors.length} error${run.errors.length > 1 ? 's' : ''})` : run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtMs(run.durationMs)}</span>
                    <span>·</span>
                    <span>{total} records synced</span>
                    <span>·</span>
                    <span>{run.trigger}</span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 pt-1 space-y-3">
                  {/* Record breakdown */}
                  {total > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(run.counts).filter(([,n]) => n > 0).map(([k, n]) => (
                        <div key={k} className="bg-gray-800/50 border border-gray-800 rounded-lg p-2 text-center">
                          <p className="text-sm font-black text-gray-100">{n}</p>
                          <p className="text-[10px] text-gray-500 capitalize">{k}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Errors */}
                  {run.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Errors requiring attention</p>
                      {run.errors.map((e, i) => (
                        <div key={i} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-rose-300 capitalize">{e.object} · <span className="font-mono">{e.record}</span></p>
                            <p className="text-xs text-gray-400 mt-0.5">{e.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {run.status === 'success' && run.errors.length === 0 && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Clean run — no errors or conflicts
                    </p>
                  )}
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
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────
export default function IntegrationsModule() {
  const { showToast, can } = useKernal();

  const [tab, setTab] = useState('connect');

  const [connection, setConnection] = useState({
    active: 'qbo',  // pre-connected for demo
  });

  const initSyncConfig = () => {
    const cfg = {};
    SYNC_OBJECTS.forEach(o => {
      cfg[o.id] = { enabled: o.critical, dir: o.defaultDir, freq: o.defaultFreq };
    });
    return cfg;
  };

  const [syncConfig, setSyncConfig] = useState(initSyncConfig);
  const [mapping, setMapping]       = useState(DEFAULT_MAPPING_QBO);
  const [syncLog, setSyncLog]       = useState(DEMO_MODE ? MOCK_SYNC_LOG : []);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // When connection changes, reset mapping defaults
  const handleConnect = useCallback((platform) => {
    setConnection({ active: platform });
    setMapping(platform === 'qbo' ? DEFAULT_MAPPING_QBO : DEFAULT_MAPPING_XERO);
    if (showToast) showToast(`Connected to ${platform === 'qbo' ? 'QuickBooks Online' : 'Xero'} — Gulf Coast Foodservice`, 'success');
    setTab('sync');
  }, [showToast]);

  const handleDisconnect = useCallback((platform) => {
    setConnection({ active: null });
    if (showToast) showToast(`Disconnected from ${platform === 'qbo' ? 'QuickBooks Online' : 'Xero'}`, 'info');
  }, [showToast]);

  const handleSyncNow = () => {
    if (!connection.active) return;
    setShowSyncModal(true);
  };

  const handleSyncDone = () => {
    setShowSyncModal(false);
    // Prepend a new synthetic success run
    const newRun = {
      id: `sync-${Date.now()}`,
      date: '2026-05-26', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      trigger: 'Manual (admin)', durationMs: 11800, status: 'success',
      counts: { invoices: 47, payments: 18, bills: 12, billpay: 6, customers: 2, vendors: 0, items: 5, expenses: 3 },
      errors: [],
    };
    setSyncLog(prev => [newRun, ...prev]);
    if (showToast) showToast('Sync complete — 93 records pushed to QuickBooks');
  };

  const TABS = [
    { id: 'connect', label: 'Connect',        icon: Plug       },
    { id: 'sync',    label: 'Sync Rules',      icon: Settings   },
    { id: 'mapping', label: 'Account Mapping', icon: ArrowLeftRight },
    { id: 'log',     label: 'Sync Log',        icon: Clock, badge: syncLog.filter(r => r.status !== 'success').length || null },
  ];

  const platformName = connection.active === 'qbo' ? 'QuickBooks Online' : connection.active === 'xero' ? 'Xero' : null;

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-800 bg-gray-900/60 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cyan-500" />
              <h1 className="text-lg font-bold text-gray-100">Integrations</h1>
              {platformName && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {platformName} connected
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Bookkeeping sync · QuickBooks Online · Xero</p>
          </div>
          {connection.active && (
            <button onClick={handleSyncNow} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm font-semibold hover:bg-cyan-500/20 transition-colors">
              <RefreshCw className="w-4 h-4" /> Sync Now
            </button>
          )}
        </div>

        {/* Tab nav */}
        <div id="kernal-module-tabs" className="flex gap-1 mt-4">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 border border-transparent'}`}>
                <Icon className="w-4 h-4" />
                {t.label}
                {t.badge ? (
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black flex items-center justify-center border border-amber-500/30">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === 'connect' && (
          <ConnectTab connection={connection} onConnect={handleConnect} onDisconnect={handleDisconnect} onSyncNow={handleSyncNow} />
        )}
        {tab === 'sync' && (
          <SyncRulesTab connection={connection} syncConfig={syncConfig} setSyncConfig={setSyncConfig} onSyncNow={handleSyncNow} />
        )}
        {tab === 'mapping' && (
          <AccountMappingTab connection={connection} mapping={mapping} setMapping={setMapping} showToast={showToast || (() => {})} />
        )}
        {tab === 'log' && (
          <SyncLogTab connection={connection} syncLog={syncLog} onSyncNow={handleSyncNow} />
        )}
      </div>

      {showSyncModal && (
        <SyncProgressModal platform={connection.active} onClose={handleSyncDone} />
      )}
    </div>
  );
}
