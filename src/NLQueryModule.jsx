import React, { useState, useRef, useEffect } from 'react';
import { useKernal } from './KernalContext.jsx';
import {
  Sparkles, Send, Clock, TrendingUp, Package, DollarSign,
  Truck, Users, ShoppingCart, AlertTriangle, ChevronRight,
  BarChart3, Table2, Zap, RefreshCw, X,
} from 'lucide-react';

// ─── Suggested queries ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { label: 'Top 10 customers by gross margin last month', icon: TrendingUp },
  { label: 'Which SKUs had more than 3 stockout events in Q1?', icon: Package },
  { label: 'Open invoices over 45 days', icon: DollarSign },
  { label: 'Deliveries scheduled for today', icon: Truck },
  { label: 'Best-selling products this week', icon: BarChart3 },
  { label: 'Inventory below reorder point', icon: AlertTriangle },
  { label: 'Pending purchase orders by supplier', icon: ShoppingCart },
  { label: 'Revenue by month — last 6 months', icon: TrendingUp },
  { label: 'Top customers by order frequency', icon: Users },
  { label: 'Show me all overdue invoices', icon: DollarSign },
];

// ─── Query engine — maps NL patterns to structured results ───────────────────

function buildResult(raw) {
  const q = raw.toLowerCase();

  // ── Revenue / sales by month ───────────────────────────────────────────────
  if (/(revenue|sales).*(month|6 month|quarter|trend)|(month|6 month).*(revenue|sales)/i.test(raw)) {
    return {
      type: 'chart',
      title: 'Monthly Revenue — Last 6 Months',
      subtitle: 'All locations · Gross invoiced sales',
      source: 'Accounting · Invoices',
      rows: [
        { label: 'Dec 25', value: 284100 },
        { label: 'Jan 26', value: 301450 },
        { label: 'Feb 26', value: 268900 },
        { label: 'Mar 26', value: 318750 },
        { label: 'Apr 26', value: 335200 },
        { label: 'May 26', value: 312600, partial: true },
      ],
      note: 'May 26 is month-to-date (partial)',
    };
  }

  // ── Top customers by gross margin ─────────────────────────────────────────
  if (/(top|best).*(customer).*(margin|profit)|(customer).*(margin|profit)/i.test(raw) ||
      /(gross margin).*(customer)/i.test(raw)) {
    return {
      type: 'table',
      title: 'Top Customers by Gross Margin',
      subtitle: 'Last 30 days · All locations',
      source: 'Accounting · CRM',
      columns: ['Customer', 'Revenue', 'COGS', 'Gross Margin', 'GM %'],
      rows: [
        ['City School District',    '$62,100', '$40,370', '$21,730', '35.0%'],
        ['Metro Restaurant Group',  '$48,250', '$31,700', '$16,550', '34.3%'],
        ['Harbor View Hotel',       '$38,900', '$25,960', '$12,940', '33.3%'],
        ['Sunset Bistro Chain',     '$29,400', '$19,820', ' $9,580', '32.6%'],
        ['Crescent City Catering',  '$22,800', '$15,510', ' $7,290', '32.0%'],
        ['Downtown Catering Co.',   '$18,600', '$12,750', ' $5,850', '31.5%'],
        ['Bayou Grill & Pub',       '$14,200', ' $9,800', ' $4,400', '31.0%'],
        ['Pelican Bay Food Service','$11,050', ' $7,700', ' $3,350', '30.3%'],
      ],
    };
  }

  // ── Top customers by order frequency ─────────────────────────────────────
  if (/(top|best).*(customer).*(order|frequen|volume)|(customer).*(order frequen)/i.test(raw)) {
    return {
      type: 'table',
      title: 'Top Customers by Order Frequency',
      subtitle: 'Last 90 days · All locations',
      source: 'Logistics · CRM',
      columns: ['Customer', 'Orders', 'Avg Order Value', 'Last Order', 'Status'],
      rows: [
        ['City School District',    '38', '$1,634', 'May 24, 2026', 'Active'],
        ['Metro Restaurant Group',  '29', '$1,664', 'May 25, 2026', 'Active'],
        ['Harbor View Hotel',       '24', '$1,621', 'May 22, 2026', 'Active'],
        ['Sunset Bistro Chain',     '19', '$1,547', 'May 21, 2026', 'Active'],
        ['Downtown Catering Co.',   '17', '$1,094', 'May 20, 2026', 'Active'],
        ['Crescent City Catering',  '14', '$1,629', 'May 18, 2026', 'Active'],
        ['Bayou Grill & Pub',       '12', '$1,183', 'May 15, 2026', 'Active'],
      ],
    };
  }

  // ── Stockout events ────────────────────────────────────────────────────────
  if (/stockout|stock.?out|out of stock|zero stock/i.test(raw)) {
    return {
      type: 'table',
      title: 'SKUs with Stockout Events — Q1 2026',
      subtitle: 'Defined as: on-hand = 0 for ≥ 1 day',
      source: 'Inventory · Demand Planning',
      columns: ['SKU', 'Description', 'Stockout Events', 'Total Days OOS', 'Last Event'],
      rows: [
        ['FRZ-SALM-01',  'Salmon Fillet IQF (10 lb)',        '6', '11 days', 'Mar 18, 2026'],
        ['DAI-CHE-02',   'Cheddar Cheese 5 lb block',        '5', '8 days',  'Feb 28, 2026'],
        ['SKU-1042',     'Roma Tomatoes (25 lb case)',        '4', '6 days',  'Mar 5, 2026'],
        ['PLT-CHICK-05', 'Chicken Breast IQF (40 lb)',        '4', '5 days',  'Jan 22, 2026'],
        ['SKU-1055',     'Jalapeños (10 lb bag)',             '3', '4 days',  'Feb 14, 2026'],
        ['FRZ-BEEF-01',  'Ground Beef 80/20 (10 lb)',         '3', '3 days',  'Mar 29, 2026'],
      ],
      highlight: row => parseInt(row[2]) >= 4 ? 'warn' : null,
    };
  }

  // ── Best-selling / top products ────────────────────────────────────────────
  if (/(best.sell|top.*(product|sku|item)|most.*(order|sold))/i.test(raw)) {
    return {
      type: 'table',
      title: 'Best-Selling SKUs This Week',
      subtitle: 'May 20 – May 26, 2026 · All locations',
      source: 'Inventory · Logistics',
      columns: ['SKU', 'Description', 'Units Sold', 'Revenue', 'Category'],
      rows: [
        ['DAI-MILK-02',  'Whole Milk (1 gal case)',         '412', '$8,240', 'Dairy'],
        ['SKU-1011',     'Iceberg Lettuce (24 ct case)',    '388', '$5,820', 'Produce'],
        ['FRZ-BEEF-01',  'Ground Beef 80/20 (10 lb)',       '271', '$5,420', 'Frozen'],
        ['SKU-1042',     'Roma Tomatoes (25 lb case)',      '263', '$4,730', 'Produce'],
        ['PLT-CHICK-05', 'Chicken Breast IQF (40 lb)',      '218', '$8,720', 'Frozen'],
        ['SKU-1012',     'Romaine Hearts (3-pk case)',      '196', '$3,920', 'Produce'],
        ['FRZ-SALM-01',  'Salmon Fillet IQF (10 lb)',       '142', '$7,100', 'Frozen'],
        ['DAI-CHE-02',   'Cheddar Cheese 5 lb block',       '134', '$2,680', 'Dairy'],
      ],
    };
  }

  // ── Open / overdue invoices ────────────────────────────────────────────────
  if (/(open invoice|unpaid invoice|outstanding invoice)/i.test(raw) && !/overdue/i.test(raw)) {
    return {
      type: 'table',
      title: 'Open Invoices',
      subtitle: 'All outstanding · Not yet paid',
      source: 'Accounting',
      columns: ['Invoice', 'Customer', 'Amount', 'Due Date', 'Days Open', 'Status'],
      rows: [
        ['INV-502', 'Downtown Catering Co.',    '$3,200',  'May 22, 2026',  '4 days',  'Open'],
        ['INV-504', 'Sunset Bistro Chain',       '$5,600',  'May 20, 2026',  '6 days',  'Partial'],
        ['INV-506', 'Crescent City Catering',    '$2,100',  'May 15, 2026', '11 days',  'Open'],
        ['INV-501', 'Metro Restaurant Group',    '$8,450',  'Apr 28, 2026', '28 days',  'Overdue'],
        ['INV-508', 'Bayou Grill & Pub',          '$1,875',  'Apr 20, 2026', '36 days',  'Overdue'],
        ['INV-505', 'Garden District Grill',     '$4,320',  'Apr 10, 2026', '46 days',  'Overdue'],
        ['INV-509', 'Magnolia Bistro',            '$3,100',  'Mar 28, 2026', '59 days',  'Overdue'],
      ],
      highlight: row => parseInt(row[4]) > 30 ? 'danger' : parseInt(row[4]) > 10 ? 'warn' : null,
    };
  }

  // ── Overdue invoices ───────────────────────────────────────────────────────
  if (/overdue|past due|45.day|late invoice/i.test(raw)) {
    return {
      type: 'table',
      title: 'Overdue Invoices',
      subtitle: 'Past due date · Sorted by age',
      source: 'Accounting',
      columns: ['Invoice', 'Customer', 'Amount', 'Due Date', 'Days Overdue', 'Balance'],
      rows: [
        ['INV-509', 'Magnolia Bistro',            '$3,100',  'Mar 28, 2026', '59 days', '$3,100'],
        ['INV-505', 'Garden District Grill',     '$4,320',  'Apr 10, 2026', '46 days', '$4,320'],
        ['INV-508', 'Bayou Grill & Pub',          '$1,875',  'Apr 20, 2026', '36 days', '$1,875'],
        ['INV-501', 'Metro Restaurant Group',    '$8,450',  'Apr 28, 2026', '28 days', '$8,450'],
      ],
      kpis: [
        { label: 'Total Overdue', value: '$17,745', color: '#fb7185' },
        { label: 'Accounts',      value: '4',       color: '#fb7185' },
        { label: 'Oldest',        value: '59 days', color: '#fbbf24' },
      ],
      highlight: row => parseInt(row[4]) > 45 ? 'danger' : 'warn',
    };
  }

  // ── Inventory below reorder ────────────────────────────────────────────────
  if (/(below reorder|reorder point|low stock|low inventory|reorder)/i.test(raw)) {
    return {
      type: 'table',
      title: 'Inventory Below Reorder Point',
      subtitle: 'On-hand ≤ reorder threshold · Live',
      source: 'Inventory',
      columns: ['SKU', 'Description', 'On Hand', 'Reorder Pt', 'Suggested Qty', 'Preferred Vendor'],
      rows: [
        ['FRZ-SALM-01',  'Salmon Fillet IQF (10 lb)',      '8',  '20', '60',  'Sysco Corporation'],
        ['DAI-CHE-02',   'Cheddar Cheese 5 lb block',      '12', '25', '80',  'Sysco Corporation'],
        ['SKU-1043',     'Beefsteak Tomatoes (25 lb)',      '14', '30', '120', 'Rancho Verde Dist.'],
        ['PLT-CHICK-05', 'Chicken Breast IQF (40 lb)',      '18', '30', '90',  'Sysco Corporation'],
        ['SKU-1055',     'Jalapeños (10 lb bag)',           '22', '40', '160', 'Rancho Verde Dist.'],
      ],
      highlight: () => 'warn',
    };
  }

  // ── Pending POs ────────────────────────────────────────────────────────────
  if (/(pending|open|outstanding).*(po|purchase order)|(purchase order).*(pending|open)/i.test(raw)) {
    return {
      type: 'table',
      title: 'Pending Purchase Orders by Supplier',
      subtitle: 'Not yet received · All locations',
      source: 'Procurement',
      columns: ['PO', 'Supplier', 'Lines', 'Total Value', 'Expected Arrival', 'Status'],
      rows: [
        ['PO-4481', 'Rancho Verde Distributors', '3', '$14,200', 'May 28, 2026', 'Pending'],
        ['PO-4490', 'Southwest Produce Co.',     '2', ' $8,650', 'May 30, 2026', 'Partial'],
        ['PO-4493', 'Sysco Corporation',         '5', '$22,400', 'Jun 2, 2026',  'Pending'],
        ['PO-4495', 'Gulf Coast Seafood',        '2', ' $6,800', 'Jun 3, 2026',  'Pending'],
        ['PO-4497', 'Dairyland Foods Inc.',      '4', '$11,300', 'Jun 5, 2026',  'Pending'],
      ],
      kpis: [
        { label: 'Open POs',     value: '5',       color: '#60a5fa' },
        { label: 'Total Value',  value: '$63,350', color: '#fbbf24' },
        { label: 'Avg Lead Time', value: '6 days',  color: '#9ca3af' },
      ],
    };
  }

  // ── Today's deliveries ─────────────────────────────────────────────────────
  if (/(deliver|route|dispatch).*(today|now|schedule)|(today).*(deliver|route)/i.test(raw) ||
      /schedule.*deliver/i.test(raw)) {
    return {
      type: 'table',
      title: "Today's Scheduled Deliveries",
      subtitle: 'May 26, 2026 · All routes',
      source: 'Logistics · GPS Dispatch',
      columns: ['Route', 'Driver', 'Stops', 'Dept Time', 'Status', 'ETA'],
      rows: [
        ['RT-001', 'James Moreau',    '6', '6:00 AM', 'Completed', '—'],
        ['RT-002', 'Linda Tran',      '8', '6:30 AM', 'In Transit', 'On time'],
        ['RT-003', 'Carlos Reyes',    '5', '7:00 AM', 'In Transit', 'Delayed +22 min'],
        ['RT-004', 'Dana Broussard',  '9', '7:30 AM', 'In Transit', 'On time'],
        ['RT-005', 'Marcus Webb',     '4', '8:00 AM', 'Loading',    '—'],
        ['RT-006', 'Priya Nair',      '7', '9:00 AM', 'Pending',    '—'],
      ],
      highlight: row => row[5] === 'Delayed +22 min' ? 'warn' : null,
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    type: 'unknown',
    query: raw,
  };
}

// ─── Bar chart SVG ────────────────────────────────────────────────────────────
function BarChart({ rows }) {
  const maxVal = Math.max(...rows.map(r => r.value));
  const W = 580, H = 160, BAR_W = Math.min(56, Math.floor((W - 60) / rows.length) - 8), PAD = 8;
  const step = (W - 60) / rows.length;

  const fmt = v => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      {/* Y gridlines */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct}
          x1={40} y1={H - H * pct + 8} x2={W - 10} y2={H - H * pct + 8}
          stroke="#1f2937" strokeWidth="1" />
      ))}
      {/* Bars */}
      {rows.map((row, i) => {
        const barH = Math.max(4, Math.round((row.value / maxVal) * (H - 20)));
        const x = 40 + i * step + (step - BAR_W) / 2;
        const y = H - barH + 8;
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH}
              fill={row.partial ? 'rgba(59,130,246,.35)' : 'rgba(59,130,246,.75)'}
              rx={4} />
            {/* Value label */}
            <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle"
              fill="#9ca3af" fontSize="9" fontWeight="600">{fmt(row.value)}</text>
            {/* X label */}
            <text x={x + BAR_W / 2} y={H + 22} textAnchor="middle"
              fill={row.partial ? '#60a5fa' : '#6b7280'} fontSize="10">{row.label}</text>
          </g>
        );
      })}
      {/* Y axis */}
      <line x1={40} y1={8} x2={40} y2={H + 8} stroke="#1f2937" strokeWidth="1" />
      {/* Y labels */}
      {[0, 0.5, 1].map(pct => (
        <text key={pct} x={36} y={H - H * pct + 12} textAnchor="end"
          fill="#4b5563" fontSize="9">{fmt(maxVal * pct)}</text>
      ))}
    </svg>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────
const ROW_HIGHLIGHT = {
  warn:   { background: 'rgba(251,191,36,.04)',  border: '1px solid rgba(251,191,36,.12)'   },
  danger: { background: 'rgba(244,63,94,.04)',   border: '1px solid rgba(244,63,94,.12)'    },
};

function ResultCard({ result }) {
  if (result.type === 'unknown') {
    return (
      <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <AlertTriangle size={14} color="#fbbf24" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Query not recognized</span>
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
          Try rephrasing. Example: "Top customers by gross margin", "Open invoices over 45 days", or "Inventory below reorder point".
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 12, padding: '18px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{result.title}</span>
          {result.type === 'chart' && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(59,130,246,.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.2)' }}>Chart</span>
          )}
          {result.type === 'table' && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(52,211,153,.1)', color: '#34d399', border: '1px solid rgba(52,211,153,.2)' }}>Table</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>{result.subtitle}</span>
          {result.source && (
            <span style={{ fontSize: 10, color: '#4b5563', background: '#111827', padding: '1px 7px', borderRadius: 4, border: '1px solid #1f2937' }}>
              Source: {result.source}
            </span>
          )}
        </div>
      </div>

      {/* KPI row */}
      {result.kpis && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {result.kpis.map((k, i) => (
            <div key={i} style={{ background: '#080e18', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 14px', minWidth: 100 }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {result.type === 'chart' && (
        <div style={{ background: '#080e18', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px' }}>
          <BarChart rows={result.rows} />
          {result.note && (
            <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>* {result.note}</div>
          )}
        </div>
      )}

      {/* Table */}
      {result.type === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {result.columns.map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid #1f2937', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, ri) => {
                const hl = result.highlight ? result.highlight(row) : null;
                return (
                  <tr key={ri} style={hl ? ROW_HIGHLIGHT[hl] : {}}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: '7px 10px', color: ci === 0 ? '#e2e8f0' : '#9ca3af', borderBottom: '1px solid #111827', whiteSpace: 'nowrap', fontWeight: ci === 0 ? 600 : 400 }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Thinking animation ───────────────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#0d1117', border: '1px solid #1f2937', borderRadius: 12, width: 'fit-content' }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#60a5fa',
            animation: `nlq-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: '#6b7280' }}>Querying your data…</span>
      <style>{`
        @keyframes nlq-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.0); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function NLQueryModule() {
  const { can } = useKernal();
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [history, setHistory]   = useState([]);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const submit = (raw) => {
    const q = (raw || input).trim();
    if (!q || thinking) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setHistory(prev => [q, ...prev.filter(h => h !== q)].slice(0, 8));
    setThinking(true);
    const delay = 900 + Math.random() * 800;
    setTimeout(() => {
      const result = buildResult(q);
      setThinking(false);
      setMessages(prev => [...prev, { role: 'assistant', result }]);
    }, delay);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const clearAll = () => { setMessages([]); setThinking(false); };

  const isEmpty = messages.length === 0 && !thinking;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', padding: '24px 28px', maxWidth: 900, gap: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Sparkles size={18} color="#a78bfa" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Ask Kernal</h2>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(167,139,250,.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,.25)' }}>AI · Beta</span>
          {messages.length > 0 && (
            <button onClick={clearAll} style={{ marginLeft: 'auto', background: 'none', border: '1px solid #1f2937', borderRadius: 6, color: '#6b7280', fontSize: 11, padding: '3px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={11} /> Clear
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
          Ask any question about your operations, customers, inventory, or finances in plain English.
        </p>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>

        {/* Empty state */}
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 28 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(167,139,250,.12)', border: '1px solid rgba(167,139,250,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Sparkles size={22} color="#a78bfa" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>What do you want to know?</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Ask about customers, inventory, invoices, deliveries, or revenue.</div>
            </div>
            <div style={{ width: '100%', maxWidth: 640 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Try asking</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => submit(s.label)}
                    style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, padding: '7px 12px', color: '#9ca3af', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color .15s, color .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,.4)'; e.currentTarget.style.color = '#c4b5fd'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f2937';              e.currentTarget.style.color = '#9ca3af';  }}>
                    <s.icon size={11} color="#6b7280" /> {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message thread */}
        {!isEmpty && messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ background: 'rgba(167,139,250,.15)', border: '1px solid rgba(167,139,250,.25)', borderRadius: '12px 12px 4px 12px', padding: '10px 16px', maxWidth: '70%', fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                  {msg.text}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={11} color="#a78bfa" />
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Kernal AI</span>
                </div>
                <ResultCard result={msg.result} />
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(167,139,250,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={11} color="#a78bfa" />
              </div>
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Kernal AI</span>
            </div>
            <ThinkingBubble />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* History chips */}
      {history.length > 0 && (
        <div style={{ flexShrink: 0, display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid #0f172a', marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: '#374151', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> Recent:</span>
          {history.map((h, i) => (
            <button key={i} onClick={() => submit(h)}
              style={{ background: '#080e18', border: '1px solid #1f2937', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, background: '#0d1117', border: '1px solid #1f2937', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', transition: 'border-color .15s' }}
        onFocus={() => {}} onBlur={() => {}}>
        <Sparkles size={14} color="#4b5563" style={{ flexShrink: 0 }} />
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask anything about your business data…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 13, placeholder: '#4b5563' }} />
        <button onClick={() => submit()}
          disabled={!input.trim() || thinking}
          style={{ background: input.trim() && !thinking ? 'rgba(167,139,250,.2)' : '#0a0f1a', border: `1px solid ${input.trim() && !thinking ? 'rgba(167,139,250,.35)' : '#1f2937'}`, borderRadius: 8, color: input.trim() && !thinking ? '#a78bfa' : '#374151', padding: '6px 12px', cursor: input.trim() && !thinking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, transition: 'all .15s' }}>
          <Send size={12} /> Ask
        </button>
      </div>
    </div>
  );
}
