// ─── Sales Rep Commission Data ───────────────────────────────────────────────
// Shared between FieldSalesPortal (My Performance / commission statement)
// and AccountingModule (Commissions tab — admin view, rate config, all-rep dashboard).
//
// ── Commission Model ──────────────────────────────────────────────────────────
// Total commission on a line = (rep base rate + category bonus rate) × line total
//
//   Rep base rate  — set per salesperson; applies to every item they sell.
//   Category bonus — additional % stacked on top of base; reflects item margin tier.
//                    A low-margin item (e.g., cooking oil) carries 0% bonus.
//                    A high-margin item (e.g., trash bags) may carry +3% bonus.
//
//   Example: rep base = 2.5%, item bonus = 2.5% → effective rate = 5.0% on that line.
//
//   Non-commissionable items (delivery/service fees) earn 0% regardless of base.

// Default flat base rate — applied when no rep-specific override exists
export const DEFAULT_COMMISSION_RATE = 0.025;

// Per-rep base commission rates. Keyed by rep display name.
// Managers can edit these live in AccountingModule → Commissions → Rate Config.
export const REP_RATES = {
  'James Wilson':   { rate: 0.025, territory: 'New Orleans Metro', quota: 60000,  ytdTarget: 720000 },
  'Sofia Castillo': { rate: 0.028, territory: 'Baton Rouge',        quota: 75000,  ytdTarget: 900000 },
  'Marcus Chen':    { rate: 0.025, territory: 'Lafayette',          quota: 65000,  ytdTarget: 780000 },
  'Priya Anand':    { rate: 0.030, territory: 'Slidell',            quota: 45000,  ytdTarget: 540000 },
  'Joey DeLuca':    { rate: 0.022, territory: 'Metairie',           quota: 40000,  ytdTarget: 480000 },
};

// Per-category bonus rates (additive on top of rep base rate).
//
//   bonusRate         — extra % commission earned on top of the rep's base rate.
//   nonCommissionable — true means the item earns 0% total (delivery fees, etc.)
//
// Margin tier guidance (adjust bonusRate to reflect actual product margins):
//   High margin   (25–40%+) → bonusRate 0.020–0.030
//   Medium margin (15–25%)  → bonusRate 0.005–0.015
//   Low margin    (<15%)    → bonusRate 0.000
export const CATEGORY_RATES = [
  { prefix: 'FRZ-',  category: 'Frozen Proteins', bonusRate: 0.005, marginTier: 'Medium'   },
  { prefix: 'PROT-', category: 'Fresh Proteins',  bonusRate: 0.010, marginTier: 'Medium'   },
  { prefix: 'PRO-',  category: 'Fresh Produce',   bonusRate: 0.025, marginTier: 'High'     },
  { prefix: 'DAI-',  category: 'Dairy Products',  bonusRate: 0.000, marginTier: 'Low'      },
  { prefix: 'DRY-',  category: 'Dry Goods',       bonusRate: 0.015, marginTier: 'Medium'   },
  { prefix: 'BAK-',  category: 'Bakery',          bonusRate: 0.020, marginTier: 'Medium'   },
  { prefix: 'SUP-',  category: 'Supplies',        bonusRate: 0.030, marginTier: 'High'     },
  { prefix: 'SVC-',  category: 'Services',        bonusRate: 0.000, marginTier: '—', nonCommissionable: true },
];

// Resolve base rate, bonus rate, and effective total rate for a given SKU and rep.
// Category bonus is ADDITIVE on top of rep base. Non-commissionable items return all zeros.
export function rateForSku(sku = '', repName = '') {
  const cat = CATEGORY_RATES.find(c => sku.startsWith(c.prefix));
  const repInfo = REP_RATES[repName];
  const baseRate = repInfo?.rate ?? DEFAULT_COMMISSION_RATE;

  if (cat?.nonCommissionable) {
    return { baseRate: 0, bonusRate: 0, totalRate: 0, category: cat.category, nonCommissionable: true };
  }

  const bonusRate = cat?.bonusRate ?? 0;
  return {
    baseRate,
    bonusRate,
    totalRate: baseRate + bonusRate,
    category: cat?.category ?? 'General',
    nonCommissionable: false,
  };
}

// Calculate commission for a single order.
// Returns { orderTotal, commissionTotal, baseTotal, bonusTotal, lines[], byCategory[] }
// Only call this for orders that qualify (status: 'Delivered' or 'Out for Delivery').
export function calcOrderCommission(order, repName) {
  let commissionTotal = 0;
  let orderTotal      = 0;
  let baseTotal       = 0;
  let bonusTotal      = 0;
  const byCategoryMap = {};

  const lines = (order.items || []).map(item => {
    const { baseRate, bonusRate, totalRate, category, nonCommissionable } = rateForSku(item.sku || '', repName);
    const lineTotal  = (item.qty || 0) * (item.unitPrice || 0);
    const baseComm   = lineTotal * baseRate;
    const bonusComm  = lineTotal * bonusRate;
    const commission = baseComm + bonusComm;

    commissionTotal += commission;
    orderTotal      += lineTotal;
    baseTotal       += baseComm;
    bonusTotal      += bonusComm;

    if (!byCategoryMap[category]) {
      byCategoryMap[category] = { revenue: 0, baseComm: 0, bonusComm: 0, commission: 0, baseRate, bonusRate, totalRate };
    }
    byCategoryMap[category].revenue    += lineTotal;
    byCategoryMap[category].baseComm   += baseComm;
    byCategoryMap[category].bonusComm  += bonusComm;
    byCategoryMap[category].commission += commission;

    return { ...item, lineTotal, baseRate, bonusRate, totalRate, baseComm, bonusComm, commission, category, nonCommissionable };
  });

  const byCategory = Object.entries(byCategoryMap).map(([name, d]) => ({ name, ...d }));

  return { orderTotal, commissionTotal, baseTotal, bonusTotal, lines, byCategory };
}

// Statuses that qualify for commission (invoiced / shipped)
export const QUALIFYING_STATUSES = new Set(['Delivered', 'Out for Delivery']);

// ── 6-month commission history per rep (Dec 2025 – May 2026) ─────────────────
// May 2026 = current month; null values are computed live from actual orders.
export const MONTHLY_HISTORY = {
  'James Wilson': [
    { month: 'Dec 2025', revenue: 45200, commission: 1130 },
    { month: 'Jan 2026', revenue: 48600, commission: 1215 },
    { month: 'Feb 2026', revenue: 52100, commission: 1303 },
    { month: 'Mar 2026', revenue: 55800, commission: 1395 },
    { month: 'Apr 2026', revenue: 61200, commission: 1530 },
    { month: 'May 2026', revenue: null,  commission: null },  // live
  ],
  'Sofia Castillo': [
    { month: 'Dec 2025', revenue: 68400, commission: 1915 },
    { month: 'Jan 2026', revenue: 71200, commission: 1994 },
    { month: 'Feb 2026', revenue: 73800, commission: 2066 },
    { month: 'Mar 2026', revenue: 76100, commission: 2131 },
    { month: 'Apr 2026', revenue: 74900, commission: 2097 },
    { month: 'May 2026', revenue: 78400, commission: 2195 },
  ],
  'Marcus Chen': [
    { month: 'Dec 2025', revenue: 58200, commission: 1455 },
    { month: 'Jan 2026', revenue: 61400, commission: 1535 },
    { month: 'Feb 2026', revenue: 59800, commission: 1495 },
    { month: 'Mar 2026', revenue: 63200, commission: 1580 },
    { month: 'Apr 2026', revenue: 62500, commission: 1563 },
    { month: 'May 2026', revenue: 65200, commission: 1630 },
  ],
  'Priya Anand': [
    { month: 'Dec 2025', revenue: 34100, commission: 1023 },
    { month: 'Jan 2026', revenue: 37200, commission: 1116 },
    { month: 'Feb 2026', revenue: 39800, commission: 1194 },
    { month: 'Mar 2026', revenue: 41500, commission: 1245 },
    { month: 'Apr 2026', revenue: 40200, commission: 1206 },
    { month: 'May 2026', revenue: 41800, commission: 1254 },
  ],
  'Joey DeLuca': [
    { month: 'Dec 2025', revenue: 36800, commission: 810 },
    { month: 'Jan 2026', revenue: 38400, commission: 845 },
    { month: 'Feb 2026', revenue: 37200, commission: 818 },
    { month: 'Mar 2026', revenue: 39100, commission: 860 },
    { month: 'Apr 2026', revenue: 37800, commission: 832 },
    { month: 'May 2026', revenue: 38500, commission: 847 },
  ],
};

// YTD commission totals (Jan–Apr 2026; May is in-progress)
export const YTD_COMMISSION = {
  'James Wilson':   { revenue: 217700, commission: 5443 },
  'Sofia Castillo': { revenue: 296800, commission: 8288 },
  'Marcus Chen':    { revenue: 246900, commission: 6173 },
  'Priya Anand':    { revenue: 158700, commission: 4761 },
  'Joey DeLuca':    { revenue: 152500, commission: 3355 },
};
