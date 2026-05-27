import { useState, useMemo, useCallback } from 'react';
import { useKernal } from './KernalContext.jsx';
import { MOCK_INVENTORY } from './shared/mockInventory.js';
import { DEMO_MODE } from './lib/demoMode.js';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  ShoppingCart, Package, BarChart3, Settings2, ChevronDown, ChevronUp,
  Plus, RefreshCw, Send, Zap, X, Check, Clock, Layers,
  ArrowRight, Sparkles, Brain, Activity,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────────────────────────────────────
const UI = {
  card:        'bg-gray-900 border border-gray-800 rounded-xl',
  glassHeader: 'bg-gray-950/80 backdrop-blur border-b border-gray-800',
  btn:         'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
  btnPrimary:  'bg-violet-600 hover:bg-violet-500 text-white',
  btnGhost:    'bg-gray-800 hover:bg-gray-700 text-gray-300',
  btnEmerald:  'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/20',
  btnAmber:    'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20',
  input:       'bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-violet-500',
  select:      'bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-violet-500',
};

const fmt$ = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// DEMAND CONFIG  — per-SKU settings (velocity + reorder parameters)
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_DEMAND_CONFIG = [
  { sku:'FRZ-BEEF-01', vendor:'Gulf Coast Proteins', avgDaily:8.4,  leadDays:3, minStock:40,  maxStock:200, safetyStock:25, unitCost:12.50, trend:'up'     },
  { sku:'FRZ-CHKN-02', vendor:'Gulf Coast Proteins', avgDaily:12.2, leadDays:3, minStock:60,  maxStock:300, safetyStock:36, unitCost:8.20,  trend:'stable'  },
  { sku:'FRZ-SALM-01', vendor:'Gulf Coast Proteins', avgDaily:4.1,  leadDays:4, minStock:20,  maxStock:100, safetyStock:16, unitCost:22.80, trend:'up'     },
  { sku:'PRO-TOMA-01', vendor:'Sunshine Produce',    avgDaily:18.5, leadDays:2, minStock:40,  maxStock:180, safetyStock:37, unitCost:1.20,  trend:'down'   },
  { sku:'PRO-LETT-02', vendor:'Sunshine Produce',    avgDaily:14.2, leadDays:2, minStock:30,  maxStock:150, safetyStock:28, unitCost:0.85,  trend:'stable'  },
  { sku:'PRO-AVOC-03', vendor:'Sunshine Produce',    avgDaily:9.8,  leadDays:3, minStock:25,  maxStock:120, safetyStock:29, unitCost:0.95,  trend:'up'     },
  { sku:'DAI-MILK-02', vendor:'Dairy Fresh Co.',     avgDaily:22.4, leadDays:2, minStock:50,  maxStock:200, safetyStock:45, unitCost:2.40,  trend:'stable'  },
  { sku:'DAI-CHSE-03', vendor:'Dairy Fresh Co.',     avgDaily:6.8,  leadDays:3, minStock:20,  maxStock:100, safetyStock:20, unitCost:6.80,  trend:'stable'  },
  { sku:'DRY-RICE-05', vendor:'Metro Dry Goods',     avgDaily:5.2,  leadDays:5, minStock:30,  maxStock:200, safetyStock:26, unitCost:1.80,  trend:'stable'  },
  { sku:'DRY-OIL-11',  vendor:'Metro Dry Goods',     avgDaily:3.8,  leadDays:5, minStock:20,  maxStock:120, safetyStock:19, unitCost:4.20,  trend:'down'   },
  { sku:'BAK-BRD-07',  vendor:'Southern Bakery',     avgDaily:16.4, leadDays:1, minStock:20,  maxStock:120, safetyStock:16, unitCost:1.50,  trend:'up'     },
  { sku:'SUP-CUP-16',  vendor:'National Supply Co.', avgDaily:2.1,  leadDays:7, minStock:50,  maxStock:400, safetyStock:15, unitCost:0.08,  trend:'stable'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY DEMAND HISTORY + FORECAST  (last 6 months actual + 3 months projected)
// ─────────────────────────────────────────────────────────────────────────────
const MONTHS_LABELS = ['Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];

const MONTHLY_DEMAND = {
  'FRZ-BEEF-01': { actual:[210,225,195,230,248,255], forecast:[268,280,275] },
  'FRZ-CHKN-02': { actual:[348,362,310,365,375,378], forecast:[380,395,388] },
  'FRZ-SALM-01': { actual:[100,112,95,118,124,128],  forecast:[138,145,140] },
  'PRO-TOMA-01': { actual:[610,575,510,548,560,572],  forecast:[555,540,530] },
  'PRO-LETT-02': { actual:[420,412,380,428,435,440],  forecast:[445,452,448] },
  'PRO-AVOC-03': { actual:[265,280,248,290,300,305],  forecast:[320,335,328] },
  'DAI-MILK-02': { actual:[720,695,645,680,690,695],  forecast:[700,710,705] },
  'DAI-CHSE-03': { actual:[195,204,188,208,210,212],  forecast:[215,218,216] },
  'DRY-RICE-05': { actual:[148,155,142,158,160,162],  forecast:[164,166,165] },
  'DRY-OIL-11':  { actual:[130,125,118,122,118,115],  forecast:[112,110,108] },
  'BAK-BRD-07':  { actual:[468,490,420,498,504,510],  forecast:[522,538,530] },
  'SUP-CUP-16':  { actual:[55,58,52,60,62,65],        forecast:[65,66,66]   },
};

// Seasonal context labels
const SEASONAL_NOTE = {
  'FRZ-BEEF-01': 'Summer BBQ season driving +15% uplift Jun–Aug',
  'FRZ-CHKN-02': 'Stable year-round with slight summer uptick',
  'FRZ-SALM-01': 'Summer seafood demand peaking — up 20% Jun–Jul',
  'PRO-TOMA-01': 'Post-peak: summer heat softens fresh tomato demand slightly',
  'PRO-LETT-02': 'Stable spring/summer cycle — consistent demand',
  'PRO-AVOC-03': 'Avocado peak season Jun–Jul, driving +25% uplift',
  'DAI-MILK-02': 'Low seasonality — demand consistent within 5%',
  'DAI-CHSE-03': 'Slight summer softening — school foodservice accounts reduced',
  'DRY-RICE-05': 'Minimal seasonality — commodity staple',
  'DRY-OIL-11':  'Slight demand softening — summer menu shifts away from fried items',
  'BAK-BRD-07':  'Summer uptick from sandwich volume at school/corporate accounts',
  'SUP-CUP-16':  'Stable supply item — replenishment driven by par levels only',
};

// ─────────────────────────────────────────────────────────────────────────────
// AI MARKET SIGNALS  — external factors feeding the demand model
// ─────────────────────────────────────────────────────────────────────────────
const AI_SIGNALS = [
  {
    id: 's1', type: 'event', icon: '🏟️',
    title: 'Bucs Preseason — Home Games',
    date: 'Jul 12 – Aug 22',
    impact: '+18–22%', direction: 'up',
    skus: ['FRZ-BEEF-01', 'FRZ-CHKN-02', 'BAK-BRD-07'],
    detail: 'Armature Works, Datz, Bern\'s Steakhouse, and 11 other Route-A/B accounts within 3 miles of Raymond James Stadium increase protein and bun orders 18–22% during home-game weeks. Pattern confirmed across 2 prior seasons.',
  },
  {
    id: 's2', type: 'event', icon: '🎆',
    title: 'Independence Day (Jul 4)',
    date: 'Jul 1–5 window',
    impact: '+32–40%', direction: 'up',
    skus: ['FRZ-BEEF-01', 'PRO-TOMA-01', 'BAK-BRD-07'],
    detail: 'Historical order data: Jul 1–5 protein demand runs 28–42% above baseline. Burger-forward SKUs (beef, buns, tomatoes) peak on Jul 3–4. 8 accounts have confirmed Jul 3 catering events this year.',
  },
  {
    id: 's3', type: 'weather', icon: '🌡️',
    title: 'Heat Wave Forecast — Tampa Bay',
    date: 'Jun 1 – Aug 31',
    impact: '+12–18%', direction: 'up',
    skus: ['FRZ-SALM-01', 'PRO-AVOC-03', 'DAI-MILK-02'],
    detail: 'Extended heat forecast (93–98°F, 14+ consecutive days) drives summer seafood and fresh produce demand. Outdoor patio dining at coastal accounts peaks in early summer before rainy season suppresses it.',
  },
  {
    id: 's4', type: 'event', icon: '🎓',
    title: 'School Year End — K-12 Accounts',
    date: 'Jun 6 (last day)',
    impact: '−12–18%', direction: 'down',
    skus: ['DAI-MILK-02', 'DAI-CHSE-03', 'BAK-BRD-07'],
    detail: '6 K-12 foodservice accounts reduce orders by 40–60% from Jun 6 through Aug 18. Net impact on portfolio: −12–18% for dairy and bakery SKUs through the summer.',
  },
  {
    id: 's5', type: 'trend', icon: '📈',
    title: 'Protein Category Demand Trend',
    date: 'Trailing 90 days',
    impact: '+8%/mo', direction: 'up',
    skus: ['FRZ-BEEF-01', 'FRZ-CHKN-02', 'FRZ-SALM-01'],
    detail: '90-day order velocity shows consistent protein category growth: +3 net new accounts, +8% average monthly order size. Confidence high — trend observed across both Route A and Route B customers.',
  },
  {
    id: 's6', type: 'trend', icon: '📉',
    title: 'Tomato Wholesale Price Softening',
    date: 'Jun – Jul',
    impact: '−6–10%', direction: 'down',
    skus: ['PRO-TOMA-01'],
    detail: 'Salinas Valley harvest glut causing a 12% drop in wholesale Roma tomato prices. Two accounts (Oxford Exchange, The Refinery) have indicated they may source spot market this summer. AI recommends reducing order quantity to avoid overstocking at depressed demand.',
  },
  {
    id: 's7', type: 'weather', icon: '⛈️',
    title: 'Florida Rainy Season Begins',
    date: 'Jun 15 – Sep 30',
    impact: '±5%', direction: 'neutral',
    skus: ['PRO-LETT-02', 'PRO-AVOC-03'],
    detail: 'Florida rainy season (daily afternoon storms) reduces outdoor patio dining at 8 Route-C accounts. Rough offset by increased indoor/delivery volume. Net effect small — AI models this as ±5% variance rather than a directional change.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI FORECAST DATA  — per-SKU prediction with confidence + factor attribution
// ─────────────────────────────────────────────────────────────────────────────
const AI_FORECAST = {
  'FRZ-BEEF-01': {
    baseQty: 268, aiQty: 312, confidence: 'High', confidencePct: 87,
    factors: { seasonality: 35, events: 30, trend: 25, weather: 10 },
    vsRuleBased: '+44',
    rationale: "Bucs preseason opener (Jul 12) plus Independence Day spike will push protein demand well above the seasonal baseline. Route-A accounts near Raymond James confirmed +22% catering increases. This is the highest-conviction AI uplift this cycle.",
    urgency: 'Order by Jun 28',
  },
  'FRZ-CHKN-02': {
    baseQty: 380, aiQty: 402, confidence: 'High', confidencePct: 91,
    factors: { seasonality: 40, trend: 30, events: 20, weather: 10 },
    vsRuleBased: '+22',
    rationale: 'Consistent demand trend + summer uptick + Bucs-adjacent catering. Chicken shows the lowest forecast variance of any protein SKU — high confidence. AI adds a modest uplift above rule-based driven by event signal.',
    urgency: 'Routine reorder',
  },
  'FRZ-SALM-01': {
    baseQty: 138, aiQty: 158, confidence: 'Medium', confidencePct: 74,
    factors: { seasonality: 50, weather: 30, trend: 15, events: 5 },
    vsRuleBased: '+20',
    rationale: 'Summer seafood peak coincides with heat wave forecast — fresh/frozen fish demand spikes at coastal patio accounts. Confidence medium due to inherent catch supply variability; a poor catch week can swing actual demand ±15%.',
    urgency: 'Order Jun 25–27',
  },
  'PRO-TOMA-01': {
    baseQty: 555, aiQty: 518, confidence: 'High', confidencePct: 82,
    factors: { seasonality: 45, trend: 30, weather: 15, events: 10 },
    vsRuleBased: '−37',
    rationale: 'Wholesale price softening combined with school-year-end account reductions. Two accounts signaled they may source spot market. AI recommends ordering 7% below rule-based to avoid holding excess inventory at a period of softening demand.',
    urgency: 'Reduce order',
  },
  'PRO-AVOC-03': {
    baseQty: 320, aiQty: 348, confidence: 'Medium', confidencePct: 71,
    factors: { seasonality: 60, weather: 20, events: 15, trend: 5 },
    vsRuleBased: '+28',
    rationale: 'Avocado peak season (Jun–Jul) coincides with outdoor dining season and heat wave, both driving guacamole and avocado toast demand. Confidence medium — Florida weather can disrupt the outdoor dining signal.',
    urgency: 'Order Jun 24',
  },
  'DAI-MILK-02': {
    baseQty: 700, aiQty: 682, confidence: 'High', confidencePct: 94,
    factors: { trend: 50, seasonality: 30, events: 15, weather: 5 },
    vsRuleBased: '−18',
    rationale: 'School year end removes 6 K-12 accounts from weekly rotation from Jun 6 onward. AI recommends a 2.6% reduction to avoid accumulating excess dairy during the summer drawdown period. Revert to full quantity in August.',
    urgency: 'Slight reduction',
  },
  'BAK-BRD-07': {
    baseQty: 522, aiQty: 568, confidence: 'High', confidencePct: 88,
    factors: { events: 40, trend: 30, seasonality: 20, weather: 10 },
    vsRuleBased: '+46',
    rationale: "Independence Day + Bucs preseason are the two biggest burger-bun demand events of the year. Armature Works alone ordered +240 packs during last year's Bucs opener week. This is the largest AI uplift vs rule-based in the baked goods category.",
    urgency: 'Order Jun 24 (1-day lead)',
  },
  'DAI-CHSE-03': {
    baseQty: 215, aiQty: 200, confidence: 'Medium', confidencePct: 68,
    factors: { seasonality: 45, events: 35, trend: 20, weather: 0 },
    vsRuleBased: '−15',
    rationale: 'School year end removes cheese-heavy lunch accounts (6 K-12 sites). Summer softening pattern observed in 2 of the past 3 years. Confidence medium — one large new corporate account could offset school reductions.',
    urgency: 'Reduce slightly',
  },
  'DRY-RICE-05': {
    baseQty: 164, aiQty: 166, confidence: 'High', confidencePct: 95,
    factors: { trend: 60, seasonality: 25, events: 10, weather: 5 },
    vsRuleBased: '+2',
    rationale: 'Commodity staple with minimal forecast variance across all signal types. AI closely matches rule-based — this is a case where simple min/max is already near-optimal. High confidence, negligible delta.',
    urgency: 'Routine reorder',
  },
  'DRY-OIL-11': {
    baseQty: 112, aiQty: 106, confidence: 'Medium', confidencePct: 73,
    factors: { seasonality: 50, trend: 35, events: 10, weather: 5 },
    vsRuleBased: '−6',
    rationale: 'Summer menu shifts away from fried items at key accounts — grills replace fryers in summer operations at 4 accounts. Confirms the existing downward trend. AI recommends modest reduction to stay lean heading into summer.',
    urgency: 'Slight reduction',
  },
  'PRO-LETT-02': {
    baseQty: 445, aiQty: 448, confidence: 'High', confidencePct: 89,
    factors: { trend: 45, seasonality: 35, weather: 15, events: 5 },
    vsRuleBased: '+3',
    rationale: 'Very stable demand — summer salad season roughly offsets the rainy-season outdoor dining reduction. AI adds a marginal +3 unit buffer above rule-based to account for catering event salad demand.',
    urgency: 'Routine reorder',
  },
  'SUP-CUP-16': {
    baseQty: 65, aiQty: 65, confidence: 'High', confidencePct: 98,
    factors: { trend: 70, seasonality: 20, events: 5, weather: 5 },
    vsRuleBased: '0',
    rationale: 'Supply item driven purely by par-level replenishment — no external signal meaningfully affects cup consumption. AI matches rule-based exactly. This SKU is a control case showing the model correctly ignores noise.',
    urgency: 'Routine reorder',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────
function computeItemStatus(cfg, currentStock) {
  const doh = cfg.avgDaily > 0 ? currentStock / cfg.avgDaily : 999;
  const rop = cfg.avgDaily * cfg.leadDays + cfg.safetyStock;
  if (currentStock <= 0)               return { status: 'Stockout',    urgency: 0 };
  if (doh <= cfg.leadDays)             return { status: 'Critical',    urgency: 1 };
  if (currentStock <= rop)             return { status: 'Reorder Now', urgency: 2 };
  if (currentStock <= cfg.minStock * 1.25) return { status: 'Low',     urgency: 3 };
  if (currentStock >= cfg.maxStock * 0.9)  return { status: 'Overstocked', urgency: 5 };
  return { status: 'OK', urgency: 4 };
}

const STATUS_STYLE = {
  'Stockout':    { bg:'bg-rose-500/15',   text:'text-rose-400',   border:'border-rose-500/30',   dot:'bg-rose-500'    },
  'Critical':    { bg:'bg-rose-500/10',   text:'text-rose-400',   border:'border-rose-500/25',   dot:'bg-rose-400'    },
  'Reorder Now': { bg:'bg-amber-500/10',  text:'text-amber-400',  border:'border-amber-500/25',  dot:'bg-amber-400'   },
  'Low':         { bg:'bg-yellow-500/10', text:'text-yellow-400', border:'border-yellow-500/20', dot:'bg-yellow-400'  },
  'OK':          { bg:'bg-emerald-500/8', text:'text-emerald-400',border:'border-emerald-500/15',dot:'bg-emerald-500' },
  'Overstocked': { bg:'bg-cyan-500/8',    text:'text-cyan-400',   border:'border-cyan-500/15',   dot:'bg-cyan-400'    },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.OK;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function TrendIcon({ trend }) {
  if (trend === 'up')     return <TrendingUp   className="w-3.5 h-3.5 text-emerald-400" />;
  if (trend === 'down')   return <TrendingDown  className="w-3.5 h-3.5 text-rose-400"   />;
  return                         <Minus         className="w-3.5 h-3.5 text-gray-500"   />;
}

function DohCell({ doh, leadDays }) {
  const color = doh <= 0 ? 'text-rose-500' : doh <= leadDays ? 'text-rose-400' : doh <= 7 ? 'text-amber-400' : doh <= 14 ? 'text-yellow-400' : 'text-emerald-400';
  return (
    <div className="text-center">
      <span className={`font-mono font-extrabold text-base ${color}`}>{doh <= 0 ? '0' : fmtN(doh)}</span>
      <span className="text-[9px] text-gray-600 block">days</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG DEMAND CHART
// ─────────────────────────────────────────────────────────────────────────────
function DemandChart({ sku }) {
  const data = MONTHLY_DEMAND[sku];
  if (!data) return <div className="text-gray-600 text-xs p-4">No forecast data available.</div>;

  const all  = [...data.actual, ...data.forecast];
  const maxV = Math.max(...all) * 1.15;
  const W = 540, H = 160, PAD_L = 44, PAD_B = 28, PAD_T = 12, PAD_R = 16;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_B - PAD_T;
  const n = all.length;
  const barW = (chartW / n) * 0.6;
  const gap  = chartW / n;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(f => ({
    val: Math.round(maxV * f),
    y: PAD_T + chartH * (1 - f),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
      {/* Y grid lines */}
      {yTicks.map(t => (
        <g key={t.val}>
          <line x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y} stroke="#1f2937" strokeWidth="1" />
          <text x={PAD_L - 6} y={t.y + 4} textAnchor="end" fontSize="9" fill="#4b5563">{t.val}</text>
        </g>
      ))}

      {/* Bars */}
      {all.map((v, i) => {
        const isForecast = i >= data.actual.length;
        const barH = (v / maxV) * chartH;
        const x = PAD_L + i * gap + gap * 0.2;
        const y = PAD_T + chartH - barH;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={barH}
              fill={isForecast ? '#7c3aed' : '#10b981'}
              opacity={isForecast ? 0.55 : 0.8}
              rx="3"
            />
            {/* Forecast hatch */}
            {isForecast && (
              <rect x={x} y={y} width={barW} height={barH}
                fill="url(#hatch)" opacity={0.3} rx="3" />
            )}
            <text x={x + barW / 2} y={H - PAD_B + 12} textAnchor="middle" fontSize="9" fill="#6b7280">
              {MONTHS_LABELS[i]}
            </text>
          </g>
        );
      })}

      {/* Trend line overlay (actual only) */}
      {data.actual.length > 1 && (() => {
        const pts = data.actual.map((v, i) => {
          const x = PAD_L + i * gap + gap * 0.2 + barW / 2;
          const y = PAD_T + chartH - (v / maxV) * chartH;
          return `${x},${y}`;
        }).join(' ');
        return <polyline points={pts} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6" />;
      })()}

      {/* Forecast line */}
      {data.forecast.length > 0 && (() => {
        const startIdx = data.actual.length - 1;
        const allPts = [data.actual[startIdx], ...data.forecast].map((v, i) => {
          const idx = startIdx + i;
          const x = PAD_L + idx * gap + gap * 0.2 + barW / 2;
          const y = PAD_T + chartH - (v / maxV) * chartH;
          return `${x},${y}`;
        }).join(' ');
        return <polyline points={allPts} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.8" />;
      })()}

      {/* Legend */}
      <rect x={PAD_L} y={H - 10} width={8} height={8} fill="#10b981" opacity="0.8" rx="1" />
      <text x={PAD_L + 12} y={H - 3} fontSize="9" fill="#6b7280">Actual</text>
      <rect x={PAD_L + 60} y={H - 10} width={8} height={8} fill="#7c3aed" opacity="0.55" rx="1" />
      <text x={PAD_L + 74} y={H - 3} fontSize="9" fill="#6b7280">Forecast</text>

      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#fff" strokeWidth="1.5" />
        </pattern>
      </defs>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: REPLENISHMENT QUEUE
// ─────────────────────────────────────────────────────────────────────────────
function QueueTab({ enriched, onAddToPO, addedToPO }) {
  const [filter,  setFilter]  = useState('All');
  const [sortBy,  setSortBy]  = useState('urgency');

  const STATUS_FILTERS = ['All','Stockout','Critical','Reorder Now','Low','OK','Overstocked'];

  const rows = useMemo(() => {
    let list = filter === 'All' ? enriched : enriched.filter(r => r.status === filter);
    list = [...list].sort((a, b) => {
      if (sortBy === 'urgency')  return a.urgency - b.urgency;
      if (sortBy === 'doh')      return a.doh - b.doh;
      if (sortBy === 'sku')      return a.sku.localeCompare(b.sku);
      return 0;
    });
    return list;
  }, [enriched, filter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
              filter === f
                ? 'bg-violet-600 text-white border-violet-500'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
            }`}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-1 opacity-60">
                {enriched.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`${UI.select} text-xs`}>
            <option value="urgency">Urgency</option>
            <option value="doh">Days on Hand</option>
            <option value="sku">SKU</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`${UI.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-gray-800/20">
                <th className="text-left px-4 py-2.5">SKU / Product</th>
                <th className="text-center px-3 py-2.5 w-20">Days on Hand</th>
                <th className="text-right px-3 py-2.5 w-28">Current Stock</th>
                <th className="text-right px-3 py-2.5 w-28">Reorder Point</th>
                <th className="text-right px-3 py-2.5 w-24">Daily Usage</th>
                <th className="text-center px-3 py-2.5 w-28">Status</th>
                <th className="text-right px-3 py-2.5 w-24">Suggest Qty</th>
                <th className="text-right px-3 py-2.5 w-28" />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isAdded = addedToPO.has(r.sku);
                return (
                  <tr key={r.sku} className={`border-t border-gray-800/60 hover:bg-gray-800/20 transition-colors ${r.urgency <= 1 ? 'bg-rose-500/2' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TrendIcon trend={r.trend} />
                        <div>
                          <p className="font-mono text-xs text-gray-500">{r.sku}</p>
                          <p className="font-medium text-gray-200 text-sm leading-tight">{r.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><DohCell doh={r.doh} leadDays={r.leadDays} /></td>
                    <td className="px-3 py-3 text-right font-mono text-gray-300">{r.currentStock}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-500">{Math.round(r.rop)}</td>
                    <td className="px-3 py-3 text-right text-gray-400">{fmtN(r.avgDaily)}/day</td>
                    <td className="px-3 py-3 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-violet-400">
                      {r.suggestedQty > 0 ? `+${r.suggestedQty}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {r.suggestedQty > 0 && (
                        isAdded
                          ? <span className="text-xs text-emerald-400 flex items-center justify-end gap-1"><Check className="w-3 h-3" /> Added</span>
                          : <button onClick={() => onAddToPO(r.sku)} className={`${UI.btn} ${UI.btnAmber} py-1 text-[11px]`}>
                              <ShoppingCart className="w-3 h-3" /> Add to PO
                            </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: DEMAND FORECAST
// ─────────────────────────────────────────────────────────────────────────────
function ForecastTab({ enriched }) {
  const [selectedSku, setSelectedSku] = useState(enriched[0]?.sku || '');
  const item = useMemo(() => enriched.find(r => r.sku === selectedSku), [enriched, selectedSku]);
  const data = MONTHLY_DEMAND[selectedSku];

  const vel30 = data ? Math.round(data.actual.slice(-1)[0]) : 0;
  const vel90 = data ? Math.round((data.actual.slice(-3).reduce((a,b)=>a+b,0)) / 3) : 0;
  const proj30 = data ? Math.round(data.forecast[0]) : 0;

  return (
    <div className="space-y-4">
      {/* SKU picker */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1">Select SKU</label>
          <select value={selectedSku} onChange={e => setSelectedSku(e.target.value)} className={`${UI.select} min-w-[260px]`}>
            {enriched.map(r => (
              <option key={r.sku} value={r.sku}>{r.sku} · {r.name}</option>
            ))}
          </select>
        </div>
        {item && <div className="mt-4"><StatusBadge status={item.status} /></div>}
      </div>

      {item && (
        <>
          {/* Velocity stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'May Actual (units)',   val: vel30,              sub:'last full month',        color:'text-emerald-400' },
              { label:'3-Month Avg',          val: vel90,              sub:'monthly average',         color:'text-cyan-400'    },
              { label:'Jun Forecast',         val: proj30,             sub:'projected demand',        color:'text-violet-400'  },
              { label:'Days on Hand',         val: fmtN(item.doh),     sub:`reorder point: ${Math.round(item.rop)} units`, color: item.doh <= item.leadDays ? 'text-rose-400' : item.doh <= 7 ? 'text-amber-400' : 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className={`${UI.card} p-4`}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className={`font-mono font-extrabold text-xl mt-1 ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className={`${UI.card} p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-200 text-sm">Demand History + 3-Month Forecast</h3>
              <div className="flex items-center gap-1.5">
                <TrendIcon trend={item.trend} />
                <span className={`text-xs font-bold ${item.trend === 'up' ? 'text-emerald-400' : item.trend === 'down' ? 'text-rose-400' : 'text-gray-500'}`}>
                  {item.trend === 'up' ? 'Trending up' : item.trend === 'down' ? 'Trending down' : 'Stable demand'}
                </span>
              </div>
            </div>
            <DemandChart sku={selectedSku} />
          </div>

          {/* Seasonal & settings info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${UI.card} p-4`}>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seasonal Context</h4>
              <p className="text-sm text-gray-300">{SEASONAL_NOTE[selectedSku] || 'No seasonal notes.'}</p>
            </div>
            <div className={`${UI.card} p-4`}>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Replenishment Parameters</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Avg Daily Usage',  `${fmtN(item.avgDaily)} units/day`],
                  ['Lead Time',        `${item.leadDays} days`],
                  ['Reorder Point',    `${Math.round(item.rop)} units`],
                  ['Safety Stock',     `${item.safetyStock} units`],
                  ['Min Stock',        `${item.minStock} units`],
                  ['Max Stock',        `${item.maxStock} units`],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-800 pb-1.5">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold text-gray-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SUGGESTED POs
// ─────────────────────────────────────────────────────────────────────────────
function SuggestedPOsTab({ enriched, addedToPO, onAddToPO, showToast }) {
  const [generated, setGenerated] = useState(new Set());
  const [expanded, setExpanded] = useState(null);

  // Items that need ordering (Critical / Reorder Now / Low) or were manually added
  const needOrder = useMemo(() =>
    enriched.filter(r => ['Stockout','Critical','Reorder Now','Low'].includes(r.status) || addedToPO.has(r.sku)),
    [enriched, addedToPO]
  );

  // Group by vendor
  const byVendor = useMemo(() => {
    const map = {};
    needOrder.forEach(r => {
      if (!map[r.vendor]) map[r.vendor] = [];
      map[r.vendor].push(r);
    });
    return Object.entries(map).sort((a,b) => a[0].localeCompare(b[0]));
  }, [needOrder]);

  const handleGenerate = (vendor) => {
    setGenerated(prev => new Set([...prev, vendor]));
    const items = byVendor.find(([v]) => v === vendor)?.[1] || [];
    const total = items.reduce((s, r) => s + r.suggestedQty * r.unitCost, 0);
    showToast(`PO generated for ${vendor} — ${items.length} items, ${fmt$(total)}`, 'success');
  };

  const handleGenerateAll = () => {
    const allVendors = byVendor.map(([v]) => v);
    setGenerated(new Set(allVendors));
    showToast(`${allVendors.length} purchase orders generated and sent to Procurement`, 'success');
  };

  if (needOrder.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <p className="font-bold text-gray-300">All stocked up</p>
        <p className="text-sm text-gray-500 mt-1">No items currently below reorder point.</p>
      </div>
    );
  }

  const totalItems = needOrder.length;
  const totalCost  = needOrder.reduce((s, r) => s + r.suggestedQty * r.unitCost, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-violet-400 font-bold">{byVendor.length} vendors</span>
          <span className="text-gray-400">{totalItems} line items</span>
          <span className="font-mono font-bold text-gray-200">Est. {fmt$(totalCost)}</span>
        </div>
        <button onClick={handleGenerateAll} className={`${UI.btn} ${UI.btnPrimary}`}>
          <Zap className="w-3.5 h-3.5" /> Generate All POs
        </button>
      </div>

      {/* Vendor groups */}
      {byVendor.map(([vendor, items]) => {
        const isExpanded = expanded === vendor;
        const isGenerated = generated.has(vendor);
        const groupCost = items.reduce((s, r) => s + r.suggestedQty * r.unitCost, 0);
        return (
          <div key={vendor} className={`${UI.card} overflow-hidden ${isGenerated ? 'opacity-60' : ''}`}>
            {/* Vendor header */}
            <div
              className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => setExpanded(isExpanded ? null : vendor)}
            >
              <Package className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-200">{vendor}</p>
                <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} · Est. {fmt$(groupCost)}</p>
              </div>
              <div className="flex items-center gap-2">
                {isGenerated
                  ? <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold"><Check className="w-3.5 h-3.5" /> PO Generated</span>
                  : <button
                      onClick={e => { e.stopPropagation(); handleGenerate(vendor); }}
                      className={`${UI.btn} ${UI.btnEmerald}`}
                    >
                      <Send className="w-3 h-3" /> Generate PO
                    </button>
                }
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </div>

            {/* Line items */}
            {isExpanded && (
              <div className="border-t border-gray-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-600 uppercase bg-gray-800/30">
                      <th className="text-left px-4 py-2">SKU</th>
                      <th className="text-left px-4 py-2">Product</th>
                      <th className="text-center px-3 py-2 w-20">Status</th>
                      <th className="text-right px-3 py-2 w-24">On Hand</th>
                      <th className="text-right px-3 py-2 w-24">Order Qty</th>
                      <th className="text-right px-3 py-2 w-24">Unit Cost</th>
                      <th className="text-right px-3 py-2 w-28">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.sku} className="border-t border-gray-800/40 hover:bg-gray-800/20">
                        <td className="px-4 py-2.5 font-mono text-gray-500">{r.sku}</td>
                        <td className="px-4 py-2.5 text-gray-300">{r.name}</td>
                        <td className="px-3 py-2.5 text-center"><StatusBadge status={r.status} /></td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-400">{r.currentStock}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-violet-400">+{r.suggestedQty}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-400">{fmt$(r.unitCost)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-200">{fmt$(r.suggestedQty * r.unitCost)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-700 bg-gray-800/20 font-bold">
                      <td colSpan={6} className="px-4 py-2.5 text-xs text-gray-400">Vendor Total</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">{fmt$(groupCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: MIN/MAX SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTab({ config, onSave }) {
  const [editing, setEditing] = useState(null); // sku being edited
  const [draft, setDraft] = useState({});

  const startEdit = (cfg) => {
    setEditing(cfg.sku);
    setDraft({ ...cfg });
  };

  const saveEdit = () => {
    onSave(draft);
    setEditing(null);
    setDraft({});
  };

  const f = (field, val) => setDraft(p => ({ ...p, [field]: Number(val) }));

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Reorder Point is calculated automatically as <span className="text-violet-400 font-mono">(Avg Daily × Lead Days) + Safety Stock</span>.
        Edit these fields to tune the replenishment engine for each SKU.
      </p>

      <div className={`${UI.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-gray-800/20">
                <th className="text-left px-4 py-2.5">SKU / Product</th>
                <th className="text-right px-3 py-2.5 w-24">Min Stock</th>
                <th className="text-right px-3 py-2.5 w-24">Max Stock</th>
                <th className="text-right px-3 py-2.5 w-28">Safety Stock</th>
                <th className="text-right px-3 py-2.5 w-24">Lead Days</th>
                <th className="text-right px-3 py-2.5 w-28">Reorder Pt.</th>
                <th className="text-right px-3 py-2.5 w-24">Avg Daily</th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {config.map(cfg => {
                const rop  = Math.round(cfg.avgDaily * cfg.leadDays + cfg.safetyStock);
                const isEd = editing === cfg.sku;
                const d    = isEd ? draft : cfg;
                const dRop = Math.round(d.avgDaily * d.leadDays + d.safetyStock);

                return (
                  <tr key={cfg.sku} className={`border-t border-gray-800/60 ${isEd ? 'bg-violet-500/5' : 'hover:bg-gray-800/20'} transition-colors`}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-500">{cfg.sku}</p>
                      <p className="text-gray-300 text-xs mt-0.5">{cfg.vendor}</p>
                    </td>
                    {isEd ? (
                      <>
                        <td className="px-3 py-2"><input type="number" value={d.minStock}    onChange={e=>f('minStock',e.target.value)}    className={`${UI.input} w-20 text-right text-xs py-1`} /></td>
                        <td className="px-3 py-2"><input type="number" value={d.maxStock}    onChange={e=>f('maxStock',e.target.value)}    className={`${UI.input} w-20 text-right text-xs py-1`} /></td>
                        <td className="px-3 py-2"><input type="number" value={d.safetyStock} onChange={e=>f('safetyStock',e.target.value)} className={`${UI.input} w-24 text-right text-xs py-1`} /></td>
                        <td className="px-3 py-2"><input type="number" value={d.leadDays}    onChange={e=>f('leadDays',e.target.value)}    className={`${UI.input} w-20 text-right text-xs py-1`} /></td>
                        <td className="px-3 py-2 text-right font-mono text-violet-400 font-bold">{dRop}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{fmtN(cfg.avgDaily)}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setEditing(null)} className={`${UI.btn} ${UI.btnGhost} py-1 text-[11px]`}><X className="w-3 h-3" /></button>
                            <button onClick={saveEdit} className={`${UI.btn} ${UI.btnPrimary} py-1 text-[11px]`}><Check className="w-3 h-3" /> Save</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3 text-right font-mono text-gray-300">{cfg.minStock}</td>
                        <td className="px-3 py-3 text-right font-mono text-gray-300">{cfg.maxStock}</td>
                        <td className="px-3 py-3 text-right font-mono text-gray-300">{cfg.safetyStock}</td>
                        <td className="px-3 py-3 text-right font-mono text-gray-300">{cfg.leadDays}d</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-violet-400">{rop}</td>
                        <td className="px-3 py-3 text-right text-gray-500">{fmtN(cfg.avgDaily)}/day</td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => startEdit(cfg)} className={`${UI.btn} ${UI.btnGhost} py-1 text-[11px]`}>
                            <Settings2 className="w-3 h-3" /> Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// TAB: AI INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────
function AIInsightsTab({ enriched, onAddToPO, addedToPO }) {
  const [expandedSku, setExpandedSku] = useState(null);
  const [signalFilter, setSignalFilter] = useState('All');
  const [sortField, setSortField] = useState('delta');

  const SIGNAL_TYPE_STYLE = {
    event:   { bg:'bg-violet-500/10', text:'text-violet-400',  border:'border-violet-500/20', label:'Event'   },
    weather: { bg:'bg-cyan-500/10',   text:'text-cyan-400',    border:'border-cyan-500/20',   label:'Weather' },
    trend:   { bg:'bg-emerald-500/10',text:'text-emerald-400', border:'border-emerald-500/20',label:'Trend'   },
  };

  const CONF_STYLE = {
    High:   { bg:'bg-emerald-500/10', text:'text-emerald-400', border:'border-emerald-500/20' },
    Medium: { bg:'bg-amber-500/10',   text:'text-amber-400',   border:'border-amber-500/20'  },
    Low:    { bg:'bg-rose-500/10',    text:'text-rose-400',    border:'border-rose-500/20'   },
  };

  const FACTOR_COLORS = {
    seasonality: 'bg-cyan-500',
    events:      'bg-violet-500',
    trend:       'bg-emerald-500',
    weather:     'bg-amber-500',
  };

  const filteredSignals = signalFilter === 'All'
    ? AI_SIGNALS
    : AI_SIGNALS.filter(s => s.type === signalFilter);

  const recommendations = useMemo(() => {
    return enriched.map(r => {
      const ai = AI_FORECAST[r.sku] || {
        baseQty: 0, aiQty: 0, confidence: 'Low', confidencePct: 50,
        factors: {}, vsRuleBased: '0', rationale: 'No AI forecast data available for this SKU.',
        urgency: 'Routine reorder',
      };
      const raw = ai.vsRuleBased.replace('−', '-');
      const delta = parseInt(raw, 10) || 0;
      return { ...r, ai, delta };
    }).sort((a, b) => {
      if (sortField === 'delta')      return Math.abs(b.delta) - Math.abs(a.delta);
      if (sortField === 'confidence') return b.ai.confidencePct - a.ai.confidencePct;
      return a.sku.localeCompare(b.sku);
    });
  }, [enriched, sortField]);

  const avgConf = Math.round(
    Object.values(AI_FORECAST).reduce((s, f) => s + f.confidencePct, 0) / Object.keys(AI_FORECAST).length
  );
  const aiWins = Object.values(AI_FORECAST).filter(f => Math.abs(parseInt(f.vsRuleBased, 10) || 0) > 5).length;

  return (
    <div className="space-y-5">

      {/* ── Model KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Forecast Accuracy',       val:'91.6%',   sub:'1 − MAPE (8.4% mean abs. error)',       color:'text-emerald-400' },
          { label:'Avg Confidence Score',    val:`${avgConf}%`, sub:'across all tracked SKUs',           color:'text-violet-400' },
          { label:'Active Market Signals',   val:AI_SIGNALS.length, sub:'driving current recommendations', color:'text-cyan-400' },
          { label:'Model Training Data',     val:'847',     sub:'order events · 18 months history',      color:'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-800/50 rounded-lg px-3 py-2.5 border border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</p>
            <p className={`font-mono font-extrabold text-xl mt-0.5 ${k.color}`}>{k.val}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Win-rate banner ── */}
      <div className="flex items-center gap-3 bg-violet-500/8 border border-violet-500/20 rounded-xl px-4 py-3">
        <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-bold text-violet-300">AI outperforms rule-based min/max on {aiWins} of 12 SKUs this cycle</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Rule-based systems use static reorder points. Kernel's model layers seasonal patterns, Tampa event calendars, weather forecasts,
            and order-velocity trends — recommending quantities closer to actual demand than any competitor can offer.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono font-black text-2xl text-violet-300">{aiWins}/12</p>
          <p className="text-[9px] text-gray-500">SKUs improved</p>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* Left: Market Signals */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Market Signals
            </h3>
            <div className="flex gap-1 flex-wrap">
              {['All', 'event', 'weather', 'trend'].map(f => (
                <button key={f} onClick={() => setSignalFilter(f)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                    signalFilter === f
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-500'
                  }`}>
                  {f === 'All' ? 'All' : SIGNAL_TYPE_STYLE[f].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredSignals.map(sig => {
              const ts = SIGNAL_TYPE_STYLE[sig.type];
              return (
                <div key={sig.id} className={`rounded-xl border p-3 ${ts.bg} ${ts.border}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{sig.icon}</span>
                      <div>
                        <p className={`text-xs font-bold ${ts.text}`}>{sig.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{sig.date}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-black shrink-0 ${
                      sig.direction === 'up' ? 'text-emerald-400' :
                      sig.direction === 'down' ? 'text-rose-400' : 'text-gray-400'
                    }`}>
                      {sig.direction === 'up' ? '↑' : sig.direction === 'down' ? '↓' : '↕'} {sig.impact}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{sig.detail}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sig.skus.map(s => (
                      <span key={s} className="text-[9px] font-mono bg-gray-900/60 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">{s}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Recommendations */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-violet-400" /> AI Buying Recommendations
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Sort:</span>
              <select value={sortField} onChange={e => setSortField(e.target.value)} className={`${UI.select} text-xs py-1`}>
                <option value="delta">Δ vs Rule-Based</option>
                <option value="confidence">Confidence</option>
                <option value="sku">SKU</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {recommendations.map(r => {
              const { ai, delta } = r;
              const cs = CONF_STYLE[ai.confidence] || CONF_STYLE.Low;
              const isExpanded = expandedSku === r.sku;
              const deltaAbs = Math.abs(delta);
              const isUp = delta > 0;
              const isDown = delta < 0;
              const deltaColor = isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-gray-500';
              const deltaLabel = isUp ? `+${delta}` : delta === 0 ? '±0' : `${delta}`;

              return (
                <div key={r.sku} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  {/* Row header */}
                  <button
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-800/40 transition-colors"
                    onClick={() => setExpandedSku(isExpanded ? null : r.sku)}
                  >
                    {/* SKU + name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] text-gray-500">{r.sku}</span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cs.bg} ${cs.text} ${cs.border}`}>
                          <Activity className="w-2.5 h-2.5" /> {ai.confidencePct}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-200 truncate leading-tight mt-0.5">{r.name}</p>
                    </div>

                    {/* Rule-based → AI qty */}
                    <div className="text-right shrink-0">
                      <div className="text-[9px] text-gray-600 mb-1">Rule-based → AI rec</div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-mono text-xs text-gray-400">{ai.baseQty}</span>
                        <ArrowRight className="w-3 h-3 text-gray-600" />
                        <span className="font-mono text-xs font-bold text-violet-300">{ai.aiQty}</span>
                        <span className={`font-mono text-[11px] font-black ${deltaColor}`}>({deltaLabel})</span>
                      </div>
                    </div>

                    {/* Urgency chip */}
                    <div className="shrink-0 hidden sm:block w-32 text-right">
                      <span className="text-[9px] text-gray-500 leading-snug">{ai.urgency}</span>
                    </div>

                    {isExpanded
                      ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    }
                  </button>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 px-4 py-3 bg-gray-900/70 space-y-3">

                      {/* AI Rationale */}
                      <div className="flex items-start gap-2.5 bg-violet-500/5 border border-violet-500/15 rounded-lg p-3">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-300 leading-relaxed">{ai.rationale}</p>
                      </div>

                      {/* Signal attribution bars */}
                      <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Signal Attribution</p>
                        <div className="space-y-2">
                          {Object.entries(ai.factors).map(([factor, pct]) => (
                            <div key={factor} className="flex items-center gap-2.5">
                              <span className="text-[10px] text-gray-400 w-24 capitalize font-medium">{factor}</span>
                              <div className="flex-1 bg-gray-800 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${FACTOR_COLORS[factor] || 'bg-gray-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                          {deltaAbs > 0
                            ? `AI recommends ${Math.abs(delta)} unit${Math.abs(delta) !== 1 ? 's' : ''} ${isUp ? 'more' : 'less'} than rule-based`
                            : 'AI matches rule-based — no adjustment needed'
                          }
                        </span>
                        <button
                          onClick={() => onAddToPO(r.sku)}
                          disabled={addedToPO.has(r.sku)}
                          className={`${UI.btn} ${addedToPO.has(r.sku) ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : UI.btnPrimary}`}
                        >
                          {addedToPO.has(r.sku)
                            ? <><Check className="w-3 h-3" /> Added</>
                            : <><ShoppingCart className="w-3 h-3" /> Use AI qty ({ai.aiQty})</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────
export default function DemandPlanningModule() {
  const { activeUser } = useKernal();
  const [activeTab, setActiveTab] = useState('queue');
  const [config, setConfig] = useState(DEMO_MODE ? INITIAL_DEMAND_CONFIG : []);
  const [addedToPO, setAddedToPO] = useState(new Set());
  const [toast, setToast] = useState(null);

  const canWrite = activeUser && ['admin','manager','accountant'].includes(activeUser.role);

  const showToast = useCallback((msg, type='success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Build enriched rows by joining config with live inventory stock
  const invMap = useMemo(() =>
    Object.fromEntries(MOCK_INVENTORY.map(i => [i.sku, i])),
    []
  );

  const enriched = useMemo(() => {
    return config.map(cfg => {
      const inv = invMap[cfg.sku];
      const currentStock = inv ? Math.max(0, (inv.physicalStock || 0) - (inv.allocatedStock || 0)) : 0;
      const rop = cfg.avgDaily * cfg.leadDays + cfg.safetyStock;
      const doh = cfg.avgDaily > 0 ? currentStock / cfg.avgDaily : 999;
      const { status, urgency } = computeItemStatus(cfg, currentStock);
      const suggestedQty = status !== 'OK' && status !== 'Overstocked'
        ? Math.max(0, cfg.maxStock - currentStock)
        : 0;
      return {
        ...cfg,
        name:         inv?.name  || cfg.sku,
        category:     inv?.category || '—',
        currentStock,
        rop,
        doh,
        status,
        urgency,
        suggestedQty,
      };
    });
  }, [config, invMap]);

  // KPIs
  const nCritical  = enriched.filter(r => r.status === 'Stockout' || r.status === 'Critical').length;
  const nReorder   = enriched.filter(r => r.status === 'Reorder Now').length;
  const avgDoh     = enriched.reduce((s,r) => s + Math.min(r.doh, 60), 0) / enriched.length;
  const suggestedN = enriched.filter(r => r.suggestedQty > 0).length;

  const handleSaveConfig = (updated) => {
    setConfig(prev => prev.map(c => c.sku === updated.sku ? { ...c, ...updated } : c));
    showToast(`Settings saved for ${updated.sku}`);
  };

  const handleAddToPO = (sku) => {
    setAddedToPO(prev => new Set([...prev, sku]));
    showToast(`${sku} added to suggested POs`);
  };

  const TABS = [
    { id:'queue',   label:'Replenishment Queue', Icon: AlertTriangle, badge: nCritical + nReorder || null },
    { id:'ai',      label:'AI Insights',         Icon: Sparkles,      badge: null, highlight: true        },
    { id:'forecast',label:'Demand Forecast',     Icon: BarChart3                                          },
    { id:'pos',     label:'Suggested POs',       Icon: ShoppingCart,  badge: suggestedN || null           },
    { id:'settings',label:'Min/Max Settings',    Icon: Settings2                                          },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className={`${UI.glassHeader} px-6 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h1 className="font-extrabold text-gray-100 text-lg leading-none">Demand Planning</h1>
              <p className="text-xs text-gray-500 mt-0.5">Velocity-based replenishment · AI demand prediction · Auto-suggested POs</p>
            </div>
          </div>
          <button onClick={() => showToast('Velocity recalculated from last 30 days of orders')} className={`${UI.btn} ${UI.btnGhost}`}>
            <RefreshCw className="w-3.5 h-3.5" /> Recalculate
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label:'Critical / Stockout',  val: nCritical,             color: nCritical > 0 ? 'text-rose-400' : 'text-emerald-400', sub:'need immediate order'         },
            { label:'Reorder Now',          val: nReorder,              color: nReorder > 0  ? 'text-amber-400' : 'text-emerald-400', sub:'below reorder point'          },
            { label:'Avg Days on Hand',     val: `${fmtN(avgDoh)}d`,    color:'text-cyan-400',    sub:'across all tracked SKUs'              },
            { label:'POs Ready to Generate',val: suggestedN,            color:'text-violet-400',  sub:'items with suggested qty'             },
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
      <div id="kernal-module-tabs" className="border-b border-gray-800 bg-gray-950 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? t.highlight ? 'border-violet-500 text-violet-400' : 'border-emerald-500 text-emerald-400'
                  : t.highlight ? 'border-transparent text-violet-500/70 hover:text-violet-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.highlight && activeTab !== t.id && (
                <span className="bg-violet-500/20 text-violet-300 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-violet-500/30 ml-0.5">AI</span>
              )}
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
        {activeTab === 'queue'    && <QueueTab       enriched={enriched} onAddToPO={handleAddToPO} addedToPO={addedToPO} />}
        {activeTab === 'ai'       && <AIInsightsTab  enriched={enriched} onAddToPO={handleAddToPO} addedToPO={addedToPO} />}
        {activeTab === 'forecast' && <ForecastTab    enriched={enriched} />}
        {activeTab === 'pos'      && <SuggestedPOsTab enriched={enriched} addedToPO={addedToPO} onAddToPO={handleAddToPO} showToast={showToast} />}
        {activeTab === 'settings' && <SettingsTab    config={config} onSave={handleSaveConfig} />}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl font-bold text-xs border backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        }`}>
          <CheckCircle2 className="w-4 h-4" /> {toast.message}
        </div>
      )}
    </div>
  );
}
