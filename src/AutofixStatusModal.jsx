// AutofixStatusModal.jsx
// Floating bottom-right modal for the user-initiated AutoFix flow.
//
// Flow:
//   1. ErrorReporter fires `kernalAutofixStarted` with { bugId, module, errorMessage }
//   2. Modal shows a confirmation prompt ("A crash was detected. Run AutoFix?")
//   3. User clicks "Run AutoFix" → POST /api/v1/bugs/:id/autofix → transitions to progress view
//   4. Progress view polls GET /api/v1/bugs/:id/status every 5s
//   5. Auto-dismisses 6s after reaching a terminal state
//   6. If autofix was already run (409), show a "already ran" notice instead

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase.js';

const API_BASE = import.meta.env.VITE_API_URL || 'https://kernal-backend-production.up.railway.app';

// ── Step definitions ───────────────────────────────────────────────────────────
const STEPS = [
  {
    key:      'captured',
    label:    'Bug captured',
    detail:   'Error report received and logged.',
    triggers: ['queued', 'analyzing'],
  },
  {
    key:      'analyzing',
    label:    'Analyzing code',
    detail:   'Reading the affected source file…',
    triggers: ['analyzing'],
  },
  {
    key:      'patching',
    label:    'Generating patch',
    detail:   'AI is writing a fix for this error…',
    triggers: ['patching', 'generating_patch'],
  },
  {
    key:      'pr',
    label:    'Opening pull request',
    detail:   'Committing patch and opening a PR…',
    triggers: ['opening_pr', 'pr_open', 'pr_review'],
  },
  {
    key:      'deployed',
    label:    'Fix deployed',
    detail:   'Patch merged and deployed automatically.',
    triggers: ['deployed'],
    terminal: true,
    success:  true,
  },
  {
    key:      'review',
    label:    'Awaiting review',
    detail:   'Patch needs a quick review before deploy.',
    triggers: ['pr_review'],
    terminal: true,
    success:  true,
  },
  {
    key:      'failed',
    label:    'Could not auto-patch',
    detail:   'Our team has been notified.',
    triggers: ['failed', 'no_change', 'unresolvable', 'capped'],
    terminal: true,
    success:  false,
  },
];

function resolveStep(status) {
  if (!status) return 0;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].triggers.includes(status)) return i;
  }
  return 0;
}

// ── Spinner SVG ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'kaf-spin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="#6b7280" strokeWidth="2" strokeDasharray="22" strokeDashoffset="8" />
    </svg>
  );
}

// ── Shared CSS ────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes kaf-spin { to { transform: rotate(360deg); } }
  @keyframes kaf-slidein {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .kaf-modal {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    width: 320px;
    background: #1c1c1e;
    border: 1px solid #2d2d30;
    border-radius: 14px;
    padding: 18px 20px 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    animation: kaf-slidein 0.25s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #e5e5ea;
  }
  .kaf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .kaf-title {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.01em;
  }
  .kaf-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 20px;
    background: #2563eb22;
    color: #60a5fa;
    border: 1px solid #2563eb55;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .kaf-badge.success { background: #16a34a22; color: #4ade80; border-color: #16a34a55; }
  .kaf-badge.failed  { background: #dc262622; color: #f87171; border-color: #dc262655; }
  .kaf-badge.warn    { background: #d9770622; color: #fb923c; border-color: #d9770655; }
  .kaf-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    margin-left: 8px;
  }
  .kaf-close:hover { color: #9ca3af; }

  /* ── Confirmation prompt ── */
  .kaf-confirm-body {
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.5;
    margin-bottom: 14px;
  }
  .kaf-confirm-error {
    font-size: 11px;
    color: #6b7280;
    background: #27272a;
    border-radius: 6px;
    padding: 6px 8px;
    margin-bottom: 14px;
    word-break: break-word;
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .kaf-btn-row {
    display: flex;
    gap: 8px;
  }
  .kaf-btn {
    flex: 1;
    padding: 7px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s;
  }
  .kaf-btn:disabled { opacity: 0.5; cursor: default; }
  .kaf-btn-primary {
    background: #2563eb;
    color: #fff;
  }
  .kaf-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .kaf-btn-ghost {
    background: #27272a;
    color: #9ca3af;
  }
  .kaf-btn-ghost:hover:not(:disabled) { background: #3f3f46; }

  /* ── Progress steps ── */
  .kaf-steps { display: flex; flex-direction: column; gap: 8px; }
  .kaf-step {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    opacity: 0.35;
    transition: opacity 0.3s;
  }
  .kaf-step.active  { opacity: 1; }
  .kaf-step.done    { opacity: 0.6; }
  .kaf-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3f3f46;
    margin-top: 4px;
    flex-shrink: 0;
    transition: background 0.3s;
  }
  .kaf-step.active .kaf-dot  { background: #3b82f6; }
  .kaf-step.done   .kaf-dot  { background: #22c55e; }
  .kaf-step.failed .kaf-dot  { background: #ef4444; }
  .kaf-step-label  { font-size: 12px; font-weight: 500; color: #d1d5db; }
  .kaf-step.active .kaf-step-label { color: #fff; }
  .kaf-step-detail { font-size: 11px; color: #6b7280; margin-top: 1px; }
  .kaf-pr-link {
    display: inline-block;
    margin-top: 12px;
    font-size: 11px;
    color: #60a5fa;
    text-decoration: none;
  }
  .kaf-pr-link:hover { text-decoration: underline; }
  .kaf-dismiss-note {
    margin-top: 10px;
    font-size: 10px;
    color: #4b5563;
    text-align: right;
  }
  .kaf-already-ran {
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.5;
    margin-bottom: 10px;
  }
`;

// ── Main component ─────────────────────────────────────────────────────────────
// phase: 'confirm' | 'progress' | 'already_ran'
export default function AutofixStatusModal() {
  const [phase,        setPhase]        = useState('confirm');
  const [visible,      setVisible]      = useState(false);
  const [bugId,        setBugId]        = useState(null);
  const [moduleName,   setModuleName]   = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stepIndex,    setStepIndex]    = useState(0);
  const [prUrl,        setPrUrl]        = useState(null);
  const [dismissed,    setDismissed]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  const pollRef    = useRef(null);
  const dismissRef = useRef(null);

  // ── Stop polling ──────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Schedule auto-dismiss ─────────────────────────────────────────────────
  const scheduleDismiss = useCallback(() => {
    if (dismissRef.current) return;
    dismissRef.current = setTimeout(() => {
      setVisible(false);
      setBugId(null);
      setStepIndex(0);
      setPrUrl(null);
      setDismissed(false);
      dismissRef.current = null;
    }, 6000);
  }, []);

  // ── Poll status endpoint ──────────────────────────────────────────────────
  const poll = useCallback(async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch(`${API_BASE}/api/v1/bugs/${id}/status`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const body = await res.json();
      const idx  = resolveStep(body.autofix_status);
      setStepIndex(idx);
      if (body.autofix_pr_url) setPrUrl(body.autofix_pr_url);
      if (STEPS[idx]?.terminal) {
        stopPolling();
        scheduleDismiss();
      }
    } catch { /* silent */ }
  }, [stopPolling, scheduleDismiss]);

  // ── Listen for custom event from ErrorReporter ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const { bugId: id, module: mod, errorMessage: errMsg } = e.detail || {};
      if (!id) return;
      // Clean up any existing state
      stopPolling();
      if (dismissRef.current) { clearTimeout(dismissRef.current); dismissRef.current = null; }
      setBugId(id);
      setModuleName(mod || 'Unknown module');
      setErrorMessage(errMsg || '');
      setStepIndex(0);
      setPrUrl(null);
      setDismissed(false);
      setPhase('confirm');
      setVisible(true);
    };
    window.addEventListener('kernalAutofixStarted', handler);
    return () => {
      window.removeEventListener('kernalAutofixStarted', handler);
      stopPolling();
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [poll, stopPolling]);

  // ── User confirms: call POST /:id/autofix ────────────────────────────────
  const handleRunAutofix = useCallback(async () => {
    if (!bugId || submitting) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setSubmitting(false); return; }
      const res = await fetch(`${API_BASE}/api/v1/bugs/${bugId}/autofix`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 409) {
        // Already ran — show info state
        setPhase('already_ran');
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setSubmitting(false);
        return;
      }
      // Transition to progress view and start polling
      setPhase('progress');
      setStepIndex(0);
      setSubmitting(false);
      poll(bugId);
      pollRef.current = setInterval(() => poll(bugId), 5000);
    } catch {
      setSubmitting(false);
    }
  }, [bugId, submitting, poll]);

  // ── Dismiss ────────────────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    stopPolling();
    if (dismissRef.current) { clearTimeout(dismissRef.current); dismissRef.current = null; }
  }, [stopPolling]);

  if (!visible || dismissed) return null;

  const currentStep = STEPS[stepIndex];
  const isTerminal  = !!currentStep?.terminal;
  const isSuccess   = !!currentStep?.success;

  return (
    <>
      <style>{STYLES}</style>

      <div className="kaf-modal" role="dialog" aria-live="polite">
        {/* ── Confirmation prompt ── */}
        {phase === 'confirm' && (
          <>
            <div className="kaf-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span className="kaf-title">Crash Detected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="kaf-badge warn">Action needed</span>
                <button className="kaf-close" onClick={handleDismiss} aria-label="Dismiss">×</button>
              </div>
            </div>
            <div className="kaf-confirm-body">
              An error occurred in <strong style={{ color: '#e5e5ea' }}>{moduleName}</strong>. Would you like AutoPatch to attempt an automatic fix?
            </div>
            {errorMessage && (
              <div className="kaf-confirm-error">{errorMessage}</div>
            )}
            <div className="kaf-btn-row">
              <button className="kaf-btn kaf-btn-ghost" onClick={handleDismiss} disabled={submitting}>
                Dismiss
              </button>
              <button className="kaf-btn kaf-btn-primary" onClick={handleRunAutofix} disabled={submitting}>
                {submitting ? 'Starting…' : 'Run AutoPatch'}
              </button>
            </div>
          </>
        )}

        {/* ── Progress tracker ── */}
        {phase === 'progress' && (
          <>
            <div className="kaf-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!isTerminal && <Spinner />}
                <span className="kaf-title">AutoPatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`kaf-badge${isTerminal ? (isSuccess ? ' success' : ' failed') : ''}`}>
                  {isTerminal ? (isSuccess ? 'Done' : 'Failed') : 'Working'}
                </span>
                <button className="kaf-close" onClick={handleDismiss} aria-label="Dismiss">×</button>
              </div>
            </div>

            <div className="kaf-steps">
              {STEPS.map((step, i) => {
                if (step.terminal && i !== stepIndex) return null;
                const isDone   = i < stepIndex;
                const isActive = i === stepIndex;
                const isFailed = isActive && !isSuccess && isTerminal;
                return (
                  <div
                    key={step.key}
                    className={`kaf-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}${isFailed ? ' failed' : ''}`}
                  >
                    <span className="kaf-dot" />
                    <div>
                      <div className="kaf-step-label">{step.label}</div>
                      {isActive && <div className="kaf-step-detail">{step.detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {prUrl && (
              <a className="kaf-pr-link" href={prUrl} target="_blank" rel="noopener noreferrer">
                View pull request →
              </a>
            )}

            {isTerminal && (
              <div className="kaf-dismiss-note">Dismissing automatically…</div>
            )}
          </>
        )}

        {/* ── Already ran ── */}
        {phase === 'already_ran' && (
          <>
            <div className="kaf-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>ℹ️</span>
                <span className="kaf-title">AutoPatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="kaf-badge warn">Already ran</span>
                <button className="kaf-close" onClick={handleDismiss} aria-label="Dismiss">×</button>
              </div>
            </div>
            <div className="kaf-already-ran">
              AutoPatch has already been run for this bug. Each bug can only be auto-patched once to prevent unnecessary AI usage.
            </div>
            <div className="kaf-btn-row">
              <button className="kaf-btn kaf-btn-ghost" onClick={handleDismiss}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
