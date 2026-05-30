// AutofixStatusModal.jsx
// Floating modal that appears whenever ErrorReporter fires 'kernalAutofixStarted'.
// Polls GET /api/v1/bugs/:id/status every 5 s and walks through a step timeline.
// Auto-dismisses 6 s after the fix reaches a terminal state.

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase.js';

const API_BASE = import.meta.env.VITE_API_URL || 'https://kernal-backend-production.up.railway.app';

// ── Step definitions ───────────────────────────────────────────────────────────
// Each step activates when autofix_status matches one of `triggers`.
// terminal:true steps stop polling and start the dismiss countdown.
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
  // Walk backwards — later steps win on overlapping triggers
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].triggers.includes(status)) return i;
  }
  return 0;
}

// ── Spinner SVG ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'kaf-spin 0.8s linear infinite' }}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="#6b7280" strokeWidth="2" strokeDasharray="22" strokeDashoffset="8" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AutofixStatusModal() {
  const [visible,    setVisible]    = useState(false);
  const [bugId,      setBugId]      = useState(null);
  const [stepIndex,  setStepIndex]  = useState(0);
  const [prUrl,      setPrUrl]      = useState(null);
  const [dismissed,  setDismissed]  = useState(false);

  const pollRef    = useRef(null);
  const dismissRef = useRef(null);

  // ── Stop polling ─────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Schedule auto-dismiss after terminal state ────────────────────────────
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
      const id = e.detail?.bugId;
      if (!id) return;
      // Reset
      stopPolling();
      if (dismissRef.current) { clearTimeout(dismissRef.current); dismissRef.current = null; }
      setBugId(id);
      setStepIndex(0);
      setPrUrl(null);
      setDismissed(false);
      setVisible(true);
      // Immediate poll then interval
      poll(id);
      pollRef.current = setInterval(() => poll(id), 5000);
    };
    window.addEventListener('kernalAutofixStarted', handler);
    return () => {
      window.removeEventListener('kernalAutofixStarted', handler);
      stopPolling();
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [poll, stopPolling]);

  if (!visible || dismissed) return null;

  const currentStep = STEPS[stepIndex];
  const isTerminal  = !!currentStep?.terminal;
  const isSuccess   = !!currentStep?.success;

  return (
    <>
      {/* Keyframe injected once */}
      <style>{`
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
      `}</style>

      <div className="kaf-modal" role="status" aria-live="polite">
        {/* Header */}
        <div className="kaf-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isTerminal && <Spinner />}
            <span className="kaf-title">AutoPatch</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`kaf-badge${isTerminal ? (isSuccess ? ' success' : ' failed') : ''}`}>
              {isTerminal ? (isSuccess ? 'Done' : 'Failed') : 'Working'}
            </span>
            <button className="kaf-close" onClick={() => { setDismissed(true); stopPolling(); }} aria-label="Dismiss">×</button>
          </div>
        </div>

        {/* Step list */}
        <div className="kaf-steps">
          {STEPS.filter(s => !['review', 'failed'].includes(s.key) || STEPS.indexOf(s) === stepIndex).map((step, i) => {
            // Skip the terminal-only steps unless they're the current one
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

        {/* PR link */}
        {prUrl && (
          <a className="kaf-pr-link" href={prUrl} target="_blank" rel="noopener noreferrer">
            View pull request →
          </a>
        )}

        {/* Auto-dismiss notice */}
        {isTerminal && (
          <div className="kaf-dismiss-note">Dismissing automatically…</div>
        )}
      </div>
    </>
  );
}
