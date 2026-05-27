// ─── Kernal Error Reporter ────────────────────────────────────────────────────
// Singleton module. No React dependency — safe to call from anywhere.
//
// Captures crash reports and sends them to a configured webhook.
// Falls back to local storage when no webhook is set.
//
// Report structure gives a developer everything they need to reproduce
// and patch an issue without having to ask follow-up questions.

export const BUILD_VERSION = 'Build66';
const MAX_BREADCRUMBS     = 20;
const MAX_STORED_REPORTS  = 25;
const STORAGE_KEY_WEBHOOK = 'kernal_error_webhook';
const STORAGE_KEY_REPORTS = 'kernal_error_reports';

// ── Internal state ────────────────────────────────────────────────────────────
const state = {
  breadcrumbs:  [],          // Recent user actions — most recent last
  reports:      [],          // In-memory report log
  webhookUrl:   null,        // Configured POST endpoint
  appContext:   {},          // Injected by KernalShell (role, user, location)
  sessionStart: Date.now(),
  listeners:    [],          // Notify Settings panel when a new report arrives
};

// ── Session boot ──────────────────────────────────────────────────────────────
function msSince(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ${diff%60}s`;
  return `${Math.floor(diff/3600)}h ${Math.floor((diff%3600)/60)}m`;
}

// ── Breadcrumb trail ──────────────────────────────────────────────────────────
export function addBreadcrumb(category, message, data = {}) {
  state.breadcrumbs.push({
    ts:       new Date().toISOString(),
    category, // 'navigation' | 'action' | 'error' | 'system'
    message,
    data,
  });
  if (state.breadcrumbs.length > MAX_BREADCRUMBS) state.breadcrumbs.shift();
}

// ── App context injection ─────────────────────────────────────────────────────
// Called by KernalShell on every render so reports always have fresh context.
export function setAppContext(ctx) {
  state.appContext = { ...ctx };
}

// ── Webhook configuration ─────────────────────────────────────────────────────
export function configureWebhook(url) {
  state.webhookUrl = url || null;
  try {
    if (url) localStorage.setItem(STORAGE_KEY_WEBHOOK, url);
    else      localStorage.removeItem(STORAGE_KEY_WEBHOOK);
  } catch { /* storage blocked — fine */ }
}

export function getWebhookUrl() {
  if (state.webhookUrl) return state.webhookUrl;
  try { return localStorage.getItem(STORAGE_KEY_WEBHOOK) || null; }
  catch { return null; }
}

// ── Report builder ────────────────────────────────────────────────────────────
function buildReport({ error, moduleName, type = 'crash', extra = {} }) {
  const now = new Date();
  const webhook = getWebhookUrl();

  return {
    // Identity
    id:         `KER-${now.getTime().toString(36).toUpperCase()}`,
    build:      BUILD_VERSION,
    timestamp:  now.toISOString(),
    localTime:  now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' }),
    type,        // 'crash' | 'unhandled_rejection' | 'global_error' | 'test'

    // Module / location
    module: moduleName || 'Unknown',

    // Error details — everything the developer needs
    error: {
      message:   error?.message   || String(error),
      type:      error?.name      || 'Error',
      stack:     error?.stack     || '(no stack trace)',
      raw:       String(error),
    },

    // What the user was doing
    context: {
      userRole:        state.appContext.userRole        || 'unknown',
      userName:        state.appContext.userName        || 'unknown',
      activeModule:    state.appContext.activeModule    || moduleName || 'unknown',
      activeLocation:  state.appContext.activeLocation  || 'unknown',
      sessionDuration: msSince(state.sessionStart),
    },

    // Navigation trail — last 10 breadcrumbs
    trail: state.breadcrumbs.slice(-10).map(b => ({
      time:     b.ts.slice(11, 19),
      category: b.category,
      action:   b.message,
    })),

    // Browser fingerprint
    browser: {
      userAgent: navigator.userAgent,
      platform:  navigator.platform,
      language:  navigator.language,
      viewport:  `${window.innerWidth}×${window.innerHeight}`,
      online:    navigator.onLine,
    },

    // Metadata
    webhookConfigured: !!webhook,
    sent: false,
    ...extra,
  };
}

// ── Formatted text (for copy/paste or email body) ─────────────────────────────
export function formatReportAsText(report) {
  const trail = report.trail?.length
    ? report.trail.map(t => `  [${t.time}] ${t.category}: ${t.action}`).join('\n')
    : '  (no navigation trail)';

  return `╔══════════════════════════════════════════════════════╗
║           KERNAL AUTOMATED CRASH REPORT              ║
╚══════════════════════════════════════════════════════╝

Report ID:  ${report.id}
Build:      ${report.build}
Timestamp:  ${report.localTime}
Type:       ${report.type}

── MODULE ──────────────────────────────────────────────
Module:     ${report.module}
User:       ${report.context.userName}  (role: ${report.context.userRole})
Location:   ${report.context.activeLocation}
Session:    ${report.context.sessionDuration} since app load

── ERROR ───────────────────────────────────────────────
Type:    ${report.error.type}
Message: ${report.error.message}

Stack Trace:
${report.error.stack}

── WHAT THE USER WAS DOING ─────────────────────────────
(Most recent action last)
${trail}

── BROWSER ─────────────────────────────────────────────
${report.browser.userAgent}
Viewport: ${report.browser.viewport}
Platform: ${report.browser.platform}
Online:   ${report.browser.online}

── HOW TO REPRODUCE ────────────────────────────────────
1. Log in as role: ${report.context.userRole}
2. Navigate to module: ${report.module}
3. Follow trail above — last action before crash is listed at bottom

── RAW JSON (for developer) ────────────────────────────
${JSON.stringify(report, null, 2)}
`;
}

// ── Report sender ─────────────────────────────────────────────────────────────
function notifyListeners() {
  state.listeners.forEach(fn => { try { fn([...state.reports]); } catch {} });
}

export function onReportsChange(fn) {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter(l => l !== fn); };
}

export function getReports() { return [...state.reports]; }

export async function captureError({ error, moduleName, type = 'crash', extra = {} }) {
  const report = buildReport({ error, moduleName, type, extra });

  // Store in memory
  state.reports.unshift(report);
  if (state.reports.length > MAX_STORED_REPORTS) state.reports.pop();

  // Persist lightweight summary to localStorage for crash persistence
  try {
    const summaries = state.reports.slice(0, 10).map(r => ({
      id: r.id, build: r.build, localTime: r.localTime,
      module: r.module, message: r.error.message, sent: r.sent,
    }));
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(summaries));
  } catch { /* fine */ }

  // Attempt webhook delivery
  const webhook = getWebhookUrl();
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(report),
      });
      if (res.ok) {
        report.sent = true;
        notifyListeners();
      } else {
        console.warn(`[Kernal] Error reporter: webhook returned ${res.status}`);
      }
    } catch (e) {
      console.warn('[Kernal] Error reporter: webhook delivery failed —', e?.message);
    }
  }

  notifyListeners();
  return report;
}

// ── Persisted report summaries (survives page reload) ─────────────────────────
export function getStoredSummaries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── Window-level error handlers (non-React errors) ───────────────────────────
// Called once from main.jsx during app boot.
let _initialized = false;
export function initGlobalHandlers() {
  if (_initialized) return;
  _initialized = true;

  // Uncaught synchronous errors
  window.addEventListener('error', (event) => {
    // Ignore cross-origin script errors (no useful info available)
    if (!event.message || event.message === 'Script error.') return;
    captureError({
      error:      event.error || new Error(event.message),
      moduleName: 'Global (outside React)',
      type:       'global_error',
      extra: {
        filename: event.filename,
        lineno:   event.lineno,
        colno:    event.colno,
      },
    });
  });

  // Unhandled promise rejections (async crashes)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    captureError({
      error:      reason instanceof Error ? reason : new Error(String(reason)),
      moduleName: 'Global (async)',
      type:       'unhandled_rejection',
    });
  });

  addBreadcrumb('system', `App loaded — ${BUILD_VERSION}`);
}
