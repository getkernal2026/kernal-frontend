import React from 'react';
import { Printer, Download } from 'lucide-react';
import { UI } from '../ui.js';

// ─────────────────────────────────────────────────────────────────────────────
// TODAY — shared date string
// ─────────────────────────────────────────────────────────────────────────────
export const TODAY = new Date().toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// Maps a status string to the right badge color automatically.
// Usage: <StatusBadge status="Active" />
//        <StatusBadge status="Pending" className="ml-2" />
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CLASS = {
  // Customer / account
  'Active':              UI.badgeEmerald,
  'Inactive':            UI.badgeZinc,
  'On Hold':             UI.badgeRose,
  // PO / procurement
  'Draft':               UI.badgeZinc,
  'Approved':            UI.badgeCyan,
  'Sent':                UI.badgeSky,
  'Partially Received':  UI.badgeViolet,
  'Received':            UI.badgeEmerald,
  'Cancelled':           UI.badgeRose,
  // Orders / B2B
  'Pending':             UI.badgeSky,
  'Pending Approval':    UI.badgeAmber,
  'Pending Review':      UI.badgeAmber,
  'Fulfilled':           UI.badgeEmerald,
  'Processing':          UI.badgeSky,
  // Tasks
  'Completed':           UI.badgeEmerald,
  'In Progress':         UI.badgeSky,
  // Tickets
  'Open':                UI.badgeAmber,
  'Resolved':            UI.badgeZinc,
  'Escalated':           UI.badgeRose,
  // Priority
  'Critical':            UI.badgeRose,
  'High':                UI.badgeRose,
  'Medium':              UI.badgeAmber,
  'Low':                 UI.badgeEmerald,
  // Finance
  'Paid':                UI.badgeEmerald,
  'Overdue':             UI.badgeRose,
  'Partial':             UI.badgeAmber,
  'Voided':              UI.badgeZinc,
  // Standing orders
  'Paused':              UI.badgeZinc,
};

export function StatusBadge({ status, className = '' }) {
  const cls = STATUS_CLASS[status] || UI.badgeZinc;
  return <span className={`${cls} ${className}`}>{status}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PrintButton
// Calls window.print(). Use label prop to override text.
// variant: 'dark' (default, for dark panels) | 'light' (for white doc panels)
// ─────────────────────────────────────────────────────────────────────────────
export function PrintButton({ label = 'Print', icon: Icon = Printer, variant = 'dark', onClick, className = '' }) {
  const handler = onClick || (() => window.print());
  const base = variant === 'light'
    ? 'inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-600 transition-colors'
    : 'inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 transition-colors';
  return (
    <button onClick={handler} className={`${base} ${className}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

// Convenience alias for recall / inventory print buttons
export function ExportButton({ label = 'Print / Export', ...props }) {
  return <PrintButton label={label} icon={Download} {...props} />;
}
