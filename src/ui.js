// ─────────────────────────────────────────────────────────────────────────────
// KERNAL DESIGN SYSTEM — Canonical UI tokens
// Single source of truth. Import this everywhere; never re-define locally.
// ─────────────────────────────────────────────────────────────────────────────

export const UI = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  page:          'min-h-screen bg-gray-950 text-gray-100 font-sans',
  pageFixed:     'flex flex-col h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden selection:bg-cyan-500/30',
  sidebar:       'w-full md:w-64 bg-gray-950 border-r border-gray-800 flex flex-col hidden md:flex',
  card:          'bg-gray-900 border border-gray-800 rounded-xl',
  cardPadded:    'bg-gray-900 border border-gray-800 rounded-xl p-5',
  cardPad:       'bg-gray-900/50 border border-gray-800 rounded-xl shadow-lg p-5',
  glassModal:    'bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl',
  glassHeader:   'bg-gray-900/80 backdrop-blur-md border-b border-gray-800',
  tableHead:     'bg-gray-950 border-b border-gray-800',
  tableRow:      'border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors',
  tableRowAlert: 'border-b border-gray-800/60 bg-rose-950/30',

  // ── Typography ────────────────────────────────────────────────────────────
  heading:       'text-gray-100 font-bold',
  subheading:    'text-gray-400 text-sm',
  label:         'text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block',
  th:            'px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 select-none',
  td:            'px-4 py-4 text-sm text-gray-200',
  sectionTitle:  'flex items-center gap-2 text-sm font-bold text-gray-300 mb-4',

  // ── Inputs ────────────────────────────────────────────────────────────────
  input:         'w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-colors',
  select:        'w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-colors',
  inputSm:       'bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-colors',

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnPrimary:    'inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-gray-950 font-bold rounded-lg hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20',
  btnSecondary:  'inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition-colors border border-gray-700',
  btnDanger:     'inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600 transition-colors',
  btnGhost:      'inline-flex items-center gap-2 px-3 py-2 text-gray-400 font-medium rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors',
  btnIcon:       'p-1.5 rounded-md transition-colors',
  btnEmerald:    'inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-400 transition-colors',

  // ── Badges ────────────────────────────────────────────────────────────────
  // Semantic aliases (use these in StatusBadge)
  badgeEmerald:  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  badgeRose:     'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20',
  badgeCyan:     'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20',
  badgeSky:      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20',
  badgeAmber:    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20',
  badgeZinc:     'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700',
  badgeViolet:   'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20',
  // Legacy aliases (keep old module code working without edits)
  badgeGreen:    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  badgeRed:      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20',
  badgeBlue:     'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20',
  badgeGray:     'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700',
  badgeActive:   'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  badgeInactive: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700',

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabActive:     'flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-2 border-cyan-500 text-cyan-500 bg-cyan-500/5 whitespace-nowrap transition-colors',
  tabInactive:   'flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 whitespace-nowrap transition-colors',

  // ── Scanner modes (Inventory only) ────────────────────────────────────────
  modeOut:       'flex-1 py-2 font-bold text-sm rounded transition-colors',
  modeIn:        'flex-1 py-2 font-bold text-sm rounded transition-colors',
  modeSplit:     'flex-1 flex items-center justify-center gap-1 py-2 font-bold text-sm rounded transition-colors',
};

export default UI;
