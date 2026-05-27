import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';

// ── Tour definitions ──────────────────────────────────────────────────────────
// step.targetId  = DOM element id to spotlight. null = centered modal, no spotlight.
// step.position  = 'right' | 'left' | 'top' | 'bottom' | null (centered)
export const TOURS = {

  // ── WELCOME ────────────────────────────────────────────────────────────────
  welcome: {
    label: 'Welcome to Kernel',
    moduleId: null,
    steps: [
      {
        targetId: 'kernal-brand',
        position: 'right',
        title: 'Welcome to Kernel ERM 👋',
        body: "You're on the most complete ERP platform built for food distribution. Let's take 2 minutes to show you where everything lives.",
        tip: 'Press → or click Next to continue',
      },
      {
        targetId: 'kernal-quickcreate-btn',
        position: 'right',
        title: 'Quick Create',
        body: "Tap + New from anywhere in the app to instantly create a new SKU, purchase order, customer, or invoice — without leaving your current view.",
      },
      {
        targetId: 'kernal-sidebar-nav',
        position: 'right',
        title: '24 Integrated Modules',
        body: "Every function of your distribution business is here — Operations, Sales, Finance, Compliance, and Intelligence. All modules share the same live data.",
      },
      {
        targetId: 'kernal-search-btn',
        position: 'bottom',
        title: 'Global Search  ⌘K',
        body: "Find any record instantly — customers, orders, invoices, SKUs, vendors — by pressing ⌘K or clicking here. No more hunting through menus.",
      },
      {
        targetId: 'kernal-user-switcher',
        position: 'bottom',
        title: "You're all set! ✓",
        body: "Your name and role appear here. Each team member only sees what their role permits. Head to the Users module to add team members or adjust permissions.",
      },
    ],
  },

  // ── OPERATIONS ─────────────────────────────────────────────────────────────
  inventory: {
    label: 'Inventory',
    moduleId: 'inventory',
    steps: [
      {
        targetId: null,
        position: null,
        title: '📦  Inventory Management',
        body: "Your master product catalog — every SKU you stock, across all warehouses. Kernel tracks physical stock, allocated units (reserved for open orders), and available quantity in real time.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Product Table & Stock Levels',
        body: "Each row is a SKU with live stock counts. Rows in amber or red are at or below reorder point. Click any row to see lot details, expiry dates, cost history, and lot-level traceability.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Search, Filter & Export',
        body: "Search by SKU, name, barcode, or category. Filter by warehouse or stock status. Use the Export button to pull a CSV of your current catalog at any time.",
      },
      {
        targetId: 'kernal-quickcreate-btn',
        position: 'right',
        title: 'Add New Products',
        body: "Click + New → New SKU to add a product. You can also bulk-import via CSV. Every new SKU is immediately available in Procurement, Logistics, and Accounting.",
      },
    ],
  },

  demand: {
    label: 'Demand Planning',
    moduleId: 'demand',
    steps: [
      {
        targetId: null,
        position: null,
        title: '📈  Demand Planning',
        body: "Kernel's AI analyzes your sales velocity, seasonal patterns, and supplier lead times to generate buying recommendations before you run out — and flag items you're likely to overstock.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Buying Recommendations',
        body: "Each row is an AI-generated reorder suggestion. The recommended order quantity accounts for your current stock, open purchase orders, forecasted demand, and your target days-of-supply.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Tabs, Filters & AI Insights',
        body: "Switch tabs for AI Insights (buying rationale and AI uplift vs. rule-based), Demand Forecast (SKU-level projections), Suggested POs (ready-to-send purchase orders), and Min/Max Settings. Filter the Replenishment Queue by status — Stockout, Critical, Reorder Now — to focus on what needs ordering today.",
      },
    ],
  },

  warehouse: {
    label: 'Warehouse Management',
    moduleId: 'warehouse',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🏭  Warehouse Management',
        body: "Manage every physical workflow in your warehouse — receiving inbound shipments, putaway to bin locations, pick and pack for outbound orders — all without paper.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Task Queue',
        body: "The task queue shows every pending warehouse action: receiving tasks (inbound POs), putaway tasks, pick tasks (open orders to fulfill), and packing tasks ready for dispatch.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Putaway, Pick Tasks & Floor Map',
        body: "Switch to the Putaway tab to direct associates to the correct bin location after a shipment is received — each task shows the suggested zone and slot. Pick Tasks assigns outbound order picking jobs. The Floor Map tab gives a visual overview of zone utilization across your warehouse.",
      },
    ],
  },

  mobilewms: {
    label: 'Mobile WMS',
    moduleId: 'mobilewms',
    steps: [
      {
        targetId: null,
        position: null,
        title: '📱  Mobile WMS',
        body: "The Mobile WMS app puts Kernel in your warehouse associates' hands. They scan barcodes to receive shipments, confirm putaway, and pick orders — no desktop required.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Scanner Interface',
        body: "The mobile interface is optimized for handheld scanners and smartphones. Associates see only their assigned tasks — receive, putaway, or pick — with scan-to-confirm at each step to prevent errors.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Session & Device Management',
        body: "Assign devices to associates from this view. Each scan session is logged against the associate's user ID, creating a complete audit trail of every warehouse movement.",
      },
    ],
  },

  logistics: {
    label: 'Delivery Operations',
    moduleId: 'logistics',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🚚  Delivery Operations',
        body: "Manage everything after picking — route assignment, driver dispatch, proof of delivery, and real-time order status for every customer. Drivers interact with Kernel directly from their phone.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Dispatch Board',
        body: "Today's routes are shown at the top — how many stops are assigned, which drivers are out, and which deliveries are completed, in progress, or have exceptions (missed stops, damage reports).",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Dispatcher & Driver Views',
        body: "The Dispatcher view has Route Planning (assign stops to drivers, optimize stop sequences) and Live GPS Tracking (real-time vehicle positions with stop-by-stop progress). Switch to the Driver view to see the mobile dispatch interface — exactly how drivers see their assigned stops, capture signatures, and log exceptions from their phone.",
      },
    ],
  },

  gps: {
    label: 'Fleet Intelligence',
    moduleId: 'gps',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🛰️  Fleet Intelligence',
        body: "See exactly where every truck is, right now. Fleet Intelligence combines live GPS tracking with AI-powered route optimization to reduce miles driven and improve on-time delivery rates.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Live Map & Vehicle Status',
        body: "Each vehicle on the map shows its current location, speed, assigned route, and driver. Click any vehicle to see today's completed stops, remaining stops, and estimated arrival at each customer.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Route Optimization & Reporting',
        body: "The Route Optimizer tab recalculates the most efficient stop sequence based on traffic, time windows, and vehicle capacity. The Reports tab shows miles per route, idle time, and fuel efficiency.",
      },
    ],
  },

  // ── SALES ──────────────────────────────────────────────────────────────────
  crm: {
    label: 'CRM',
    moduleId: 'crm',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🤝  Customer Relationship Management',
        body: "Every customer account, contact, purchase history, credit limit, and health score lives here. Kernel tracks customer behavior automatically — you always know who your best accounts are.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Account Health Scores',
        body: "Each customer has a health score (0–100) calculated from payment timing, order frequency, and AR aging. Accounts in the red need proactive outreach before they become collections problems.",
      },
      {
        targetId: 'kernal-quickcreate-btn',
        position: 'right',
        title: 'Add New Customers',
        body: "Use + New → New Customer to add an account. Set their payment terms, credit limit, and delivery preferences — these flow automatically into every order they place through the B2B portal or field sales.",
      },
    ],
  },

  b2b: {
    label: 'B2B Portal',
    moduleId: 'b2b',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🏢  B2B Customer Portal',
        body: "Give your customers a self-service ordering portal. They log in, browse your current catalog with their contract pricing, place orders, and track delivery status — without calling or emailing your team.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Portal Orders Feed',
        body: "Orders placed through the B2B portal appear here in real time. Each order shows the customer, order total, requested delivery date, and status. Portal orders flow directly into the fulfillment workflow.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Catalog, Standing Orders & Account',
        body: "Use the Catalog tab to let customers browse your full product list with their contract pricing applied. The Standing tab manages recurring orders — set up a weekly or scheduled delivery that auto-generates without manual re-entry. The Account tab shows the customer's order history, open invoices, and delivery preferences.",
      },
    ],
  },

  field: {
    label: 'Field Sales',
    moduleId: 'field',
    steps: [
      {
        targetId: null,
        position: null,
        title: '📍  Field Sales',
        body: "Your outside sales reps use the Field Sales app to manage their territory, log customer visits, place orders on the spot, and track prospects — all from their phone while on the road.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Rep Activity & Pipeline',
        body: "See every sales rep's open opportunities, recently placed orders, and scheduled visits. The pipeline view tracks each prospect from first contact through their first order.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Accounts, Orders & Leads',
        body: "Switch between the Accounts tab (active customers by rep), Orders tab (orders placed in the field today), and Leads tab (prospects being worked). Reps sync automatically when back on WiFi.",
      },
    ],
  },

  pricing: {
    label: 'Pricing Engine',
    moduleId: 'pricing',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🏷️  Pricing Engine',
        body: "Manage every pricing rule in one place — customer-specific tiers, contract pricing, volume discounts, and promotional markdowns. All pricing is enforced automatically at order entry.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Price Books & Customer Tiers',
        body: "Each price book is a set of rules that applies to a group of customers. Assign a customer to a tier and their pricing updates immediately across all order channels — portal, field sales, and phone.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Contracts, Promotions & Price Simulator',
        body: "For customers with negotiated contract prices, use the Contracts tab to lock specific item prices for a date range. The Promotions tab manages time-limited markdowns and special offers across customer segments. The Price Simulator lets you model any pricing change and see the margin impact before applying it.",
      },
    ],
  },

  // ── FINANCE ────────────────────────────────────────────────────────────────
  procurement: {
    label: 'Procurement',
    moduleId: 'procurement',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🛒  Procurement',
        body: "Create and manage purchase orders, track vendor performance, and process receiving. Every PO is linked to the inventory receiving workflow — when a shipment arrives, stock levels update automatically.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Purchase Orders',
        body: "All active POs are listed with status — Draft, Pending Approval, Sent, Partially Received, or Closed. Click any PO to see line items, expected delivery, receiving history, and vendor contact.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Three-Way Matching',
        body: "Kernel automatically matches what was ordered vs. received vs. billed. Discrepancies are flagged before you approve payment — catching billing errors before they cost you money.",
      },
    ],
  },

  landedcost: {
    label: 'Landed Cost',
    moduleId: 'landedcost',
    steps: [
      {
        targetId: null,
        position: null,
        title: '⚓  Landed Cost',
        body: "The Landed Cost module allocates import duties, freight charges, broker fees, and tariffs to the true per-unit cost of every SKU. Know your real margin on imported goods, not just the invoice price.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Shipment Cost Allocation',
        body: "Each inbound shipment shows the vendor invoice cost plus all additional charges — freight, customs duties, port fees. Kernel prorates each charge across the SKUs in the shipment by weight or value.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Allocation Methods',
        body: "Choose how landed costs are allocated: by line value, by weight, or by volume. Different methods apply to different charge types — freight is usually by weight, duties by value.",
      },
    ],
  },

  accounting: {
    label: 'Accounting',
    moduleId: 'accounting',
    steps: [
      {
        targetId: null,
        position: null,
        title: '💰  Accounting',
        body: "Customer invoicing, payments, daily cash close-out, and AR aging — all in one place. Invoices are generated automatically from delivered orders, so there's no manual re-entry.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Invoice List & AR Status',
        body: "All customer invoices appear here with real-time status — Open, Partial, Paid, or Overdue. The summary bar shows today's total AR balance and the overdue amount that needs collection action.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Close-Out, Payments, AP Match & Reports',
        body: "Switch tabs for Payments (ACH and card collections), Daily Close-Out (match driver cash to route manifests), AP Match (three-way PO vs. receipt vs. vendor invoice to catch billing errors), and Reports (AR aging, P&L, and cash flow). The General Ledger module handles your full chart of accounts.",
      },
    ],
  },

  gl: {
    label: 'General Ledger',
    moduleId: 'gl',
    steps: [
      {
        targetId: null,
        position: null,
        title: '📒  General Ledger',
        body: "Full double-entry accounting. The GL records every financial transaction as a journal entry across your chart of accounts, automatically generating your P&L and balance sheet.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Journal Entries & Chart of Accounts',
        body: "The main view shows your chart of accounts with running balances. Every invoice, payment, PO, and payroll entry posts here automatically. You can also create manual adjusting entries.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Periods, Trial Balance & Financials',
        body: "The Periods tab manages your fiscal calendar — lock a period to prevent further posting once reconciled. The Trial Balance tab shows debit/credit totals by account for any period. For P&L, Balance Sheet, and Cash Flow statements, use the Reports tab in the Accounting module.",
      },
    ],
  },

  approvals: {
    label: 'Approvals',
    moduleId: 'approvals',
    steps: [
      {
        targetId: null,
        position: null,
        title: '✅  Approvals Workflow',
        body: "Any action that exceeds a threshold — a large purchase order, a credit hold release, a discounted invoice — is routed to the right approver automatically. Nothing falls through the cracks.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Your Approval Queue',
        body: "This is your personal queue of items waiting for your decision. Each item shows what it is, who submitted it, the amount or impact, and the deadline (if any). Click to review the full detail and approve or reject.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Approval Rules',
        body: "Approval rules are configured in Settings → Approvals. You define the threshold, the flow type (PO approval, credit release, etc.), and which roles must approve. Rules can require one approver or a chain.",
      },
    ],
  },

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  lossPrevention: {
    label: 'Compliance & Risk',
    moduleId: 'lossPrevention',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🛡️  Compliance & Risk',
        body: "Stay audit-ready at all times. This module covers FDA FSMA traceability, PACA produce compliance, allergen management, cold chain monitoring, and a complete audit journal of every system action.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'FSMA Traceability',
        body: "For every lot of food in your system, Kernel tracks the full chain of custody from supplier to customer — the Key Data Elements (KDEs) and Critical Tracking Events (CTEs) required by FSMA Rule 204.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'PACA, Allergens & Audit Log',
        body: "Switch tabs for PACA dispute tracking (produce payment deadlines), allergen management (Big 9 labeling compliance), cold chain temperature logs, and the immutable audit journal for every data change.",
      },
    ],
  },

  settings: {
    label: 'Settings',
    moduleId: 'settings',
    steps: [
      {
        targetId: null,
        position: null,
        title: '⚙️  Settings',
        body: "Configure every aspect of Kernel for your business — company profile, feature flags, module visibility, approval rules, and your subscription plan. Changes take effect immediately for all users.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Company Profile',
        body: "Your business name, address, tax ID, and FDA registration number are used on every printed document — POs, invoices, recall letters. Update them here once and they update everywhere.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Feature Flags, Modules & Roles',
        body: "Use the Feature Toggles tab to enable or disable specific capabilities. Module Visibility controls which tabs appear in the sidebar. Role Profiles sets the default permissions for each job type.",
      },
    ],
  },

  users: {
    label: 'User Management',
    moduleId: 'users',
    steps: [
      {
        targetId: null,
        position: null,
        title: '👥  User Management',
        body: "Add team members, assign roles, and control exactly what each person can see and do. Kernel supports built-in roles (Admin, Manager, Dispatcher, Driver, Accountant, Sales Rep, Warehouse Staff, Buyer) plus per-user permission overrides.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Team Roster',
        body: "The user list shows every team member with their role, last login, and active status. Click any user to edit their role, change their email, or apply per-user permission overrides.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Roles & Permission Overrides',
        body: "Each role has a default permission set defined in Settings → Role Profiles. In User Management, you can grant or restrict individual permissions for any user on top of their role defaults.",
      },
    ],
  },

  // ── INTELLIGENCE ───────────────────────────────────────────────────────────
  nlquery: {
    label: 'Ask Kernel',
    moduleId: 'nlquery',
    steps: [
      {
        targetId: null,
        position: null,
        title: '✨  Ask Kernel — AI Query Engine',
        body: "Ask any question about your business in plain English and get an instant, accurate answer backed by your live data. No SQL, no reports, no waiting — just ask.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Natural Language Questions',
        body: 'Try questions like: "What\'s our margin on the Tampa route this week?", "Which customers haven\'t ordered in 30 days?", or "What\'s our current inventory value for frozen beef?" — Kernel answers immediately.',
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Query History & Pinned Answers',
        body: "Your recent queries are saved in history. Pin any answer to your dashboard for quick access. Complex queries can be saved as named reports in the Report Builder module.",
      },
    ],
  },

  reports: {
    label: 'Report Builder',
    moduleId: 'reports',
    steps: [
      {
        targetId: null,
        position: null,
        title: '📊  Report Builder',
        body: "Build custom reports from any data in Kernel — inventory, sales, AR aging, delivery performance, purchasing — and schedule them to arrive in your inbox automatically. No SQL required.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Report Library',
        body: "The report library shows all saved reports — your custom ones and Kernel's built-in templates. Click any report to run it instantly with the latest data, or edit it to change fields, filters, or grouping.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Build, Schedule & Export',
        body: "Click + New Report to drag-and-drop fields from any module into a custom view. Set a schedule (daily, weekly, monthly) and Kernel emails the report as CSV or PDF automatically.",
      },
    ],
  },

  // ── PLATFORM ───────────────────────────────────────────────────────────────
  integrations: {
    label: 'Integrations',
    moduleId: 'integrations',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🔌  Integrations Hub',
        body: "Connect Kernel to the tools you already use. 40+ pre-built connectors including QuickBooks, Salesforce, major 3PLs, and payment processors — all configured with OAuth, no middleware required.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Connected Apps',
        body: "Each connected integration shows its sync status, last successful run, and the number of records synced. A red status means the connection needs attention — click it to see the error and reconnect.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Add & Configure Connectors',
        body: "Click + Add Integration to browse the connector catalog. Each connector walks you through OAuth authorization — no API keys to copy or paste. Sync direction and field mapping are configurable.",
      },
    ],
  },

  edi: {
    label: 'EDI Integration',
    moduleId: 'edi',
    steps: [
      {
        targetId: null,
        position: null,
        title: '↔️  EDI Integration',
        body: "Exchange 850 (Purchase Orders), 856 (Advance Ship Notices), 810 (Invoices), and 214 (Shipment Status) documents automatically with retail chains, co-ops, and trading partners.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'EDI Document Queue',
        body: "All inbound and outbound EDI transactions appear here. Inbound 850s (customer POs) become Kernel orders automatically. Outbound 810s (invoices) are generated from delivered orders and transmitted on schedule.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Trading Partners & Acknowledgements',
        body: "The Trading Partners tab manages your EDI connections per partner — ISA/GS identifiers, transmission schedules, and document types. The 997 Functional Acknowledgement is handled automatically.",
      },
    ],
  },

  developer: {
    label: 'Developer API',
    moduleId: 'developer',
    steps: [
      {
        targetId: null,
        position: null,
        title: '</>  Developer API',
        body: "Build custom integrations, automate workflows, and connect Kernel to any system using the REST API, webhooks, and OAuth app platform. Full documentation is available in-platform.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'API Keys & Apps',
        body: "Create and manage API credentials here. Each key has a scope (read-only or read-write), a name, and a last-used timestamp. Rotate or revoke keys instantly if a credential is compromised.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Webhooks & API Docs',
        body: "The Webhooks tab lets you subscribe to real-time events (order created, invoice paid, stock below reorder) and push them to any URL. The API Docs tab is the full OpenAPI reference, interactive and always current.",
      },
    ],
  },

  ecommerce: {
    label: 'eCommerce',
    moduleId: 'ecommerce',
    steps: [
      {
        targetId: null,
        position: null,
        title: '🛍️  eCommerce Sync',
        body: "Connect Shopify, WooCommerce, Amazon, and other marketplace channels to Kernel. Online orders flow directly into the fulfillment workflow, inventory deducts in real time, and shipping updates push back to the channel.",
      },
      {
        targetId: 'kernal-main',
        position: null,
        title: 'Channel Orders Feed',
        body: "All incoming orders from connected channels appear here, tagged by source. Each order shows channel, customer, items ordered, payment status, and current fulfillment status in Kernel.",
      },
      {
        targetId: 'kernal-topbar',
        position: 'bottom',
        title: 'Channel Settings & Catalog Sync',
        body: "The Channels tab manages each connected store — sync frequency, order import rules, and inventory export settings. The Catalog Sync tab maps your Kernel SKUs to the product IDs in each channel.",
      },
    ],
  },

};

// ── localStorage helpers ──────────────────────────────────────────────────────
export const tourStorage = {
  isDone:   (id) => { try { return !!localStorage.getItem(`kernal_tour_${id}`);            } catch { return false; } },
  markDone: (id) => { try { localStorage.setItem(`kernal_tour_${id}`, '1');                } catch {}               },
  resetAll: ()   => { try { Object.keys(TOURS).forEach(id => localStorage.removeItem(`kernal_tour_${id}`)); } catch {} },
};

// ── Layout constants ──────────────────────────────────────────────────────────
const TOOLTIP_W   = 340;
const PADDING     = 12;    // spotlight padding around target
const GAP         = 16;    // gap between spotlight edge and tooltip
const TOOLTIP_H   = 230;   // estimated tooltip height (used for viewport clamping)
const MARGIN      = 10;    // minimum distance from viewport edges

// ── Position calculator ───────────────────────────────────────────────────────
// Returns { style, caretStyle } with auto-flip when space is insufficient.
function calcPosition(rect, preferredPos, winW, winH) {
  // No target or no position preference → centered modal
  if (!rect || !preferredPos) {
    return {
      style:      { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: TOOLTIP_W },
      caretStyle: null,
    };
  }

  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;

  const spaceRight  = winW - rect.right  - GAP;
  const spaceLeft   = rect.left          - GAP;
  const spaceBelow  = winH - rect.bottom - GAP;
  const spaceAbove  = rect.top           - GAP;

  // Auto-flip to the side with more room if preferred side is too tight
  let pos = preferredPos;
  if (pos === 'right'  && spaceRight < TOOLTIP_W + MARGIN && spaceLeft  > spaceRight)  pos = 'left';
  if (pos === 'left'   && spaceLeft  < TOOLTIP_W + MARGIN && spaceRight > spaceLeft)   pos = 'right';
  if (pos === 'bottom' && spaceBelow < TOOLTIP_H          && spaceAbove > spaceBelow)  pos = 'top';
  if (pos === 'top'    && spaceAbove < TOOLTIP_H          && spaceBelow > spaceAbove)  pos = 'bottom';

  const base = { position: 'fixed', width: TOOLTIP_W };
  const caretBase = { position: 'absolute', width: 0, height: 0 };

  if (pos === 'right') {
    const left = Math.min(rect.right + GAP, winW - TOOLTIP_W - MARGIN);
    const top  = Math.max(MARGIN, Math.min(cy - TOOLTIP_H / 2, winH - TOOLTIP_H - MARGIN));
    return {
      style:      { ...base, left, top },
      caretStyle: { ...caretBase, left: -8, top: 24, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid #1e293b' },
    };
  }

  if (pos === 'left') {
    const right = winW - rect.left + GAP;
    const top   = Math.max(MARGIN, Math.min(cy - TOOLTIP_H / 2, winH - TOOLTIP_H - MARGIN));
    return {
      style:      { ...base, right, top },
      caretStyle: { ...caretBase, right: -8, top: 24, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '8px solid #1e293b' },
    };
  }

  if (pos === 'bottom') {
    const top  = Math.min(rect.bottom + GAP, winH - TOOLTIP_H - MARGIN);
    const left = Math.max(MARGIN, Math.min(cx - TOOLTIP_W / 2, winW - TOOLTIP_W - MARGIN));
    const caretX = Math.max(MARGIN, Math.min(cx - left - 8, TOOLTIP_W - 28));
    return {
      style:      { ...base, left, top },
      caretStyle: { ...caretBase, left: caretX, top: -8, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #1e293b' },
    };
  }

  // top — use actual `top` CSS, clamp so tooltip is never above the viewport
  if (pos === 'top') {
    const top  = Math.max(MARGIN, rect.top - GAP - TOOLTIP_H);
    const left = Math.max(MARGIN, Math.min(cx - TOOLTIP_W / 2, winW - TOOLTIP_W - MARGIN));
    const caretX = Math.max(MARGIN, Math.min(cx - left - 8, TOOLTIP_W - 28));
    return {
      style:      { ...base, left, top },
      caretStyle: { ...caretBase, left: caretX, bottom: -8, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #1e293b' },
    };
  }

  // Fallback — centered
  return {
    style:      { ...base, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' },
    caretStyle: null,
  };
}

// ── OnboardingTour ────────────────────────────────────────────────────────────
export default function OnboardingTour({ tourId, onComplete, onSkip }) {
  const tour = TOURS[tourId];
  const [step,  setStep]  = useState(0);
  const [rect,  setRect]  = useState(null);
  const [ready, setReady] = useState(false);

  // Stable ref so keyboard handler never reads stale closures
  const ref = useRef({});
  ref.current = { step, tour, tourId, onComplete, onSkip };

  // ── Measure target element ──────────────────────────────────────────────────
  const measure = useCallback(() => {
    const { tour, step } = ref.current;
    const s = tour?.steps[step];
    if (!s?.targetId) { setRect(null); return; }
    const el = document.getElementById(s.targetId);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setRect(el.getBoundingClientRect());
  }, []);

  useLayoutEffect(() => {
    setReady(false);
    const t = setTimeout(() => { measure(); setReady(true); }, 140);
    return () => clearTimeout(t);
  }, [step, measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const { step, tour, tourId, onComplete, onSkip } = ref.current;
      const isLast = step === (tour?.steps.length ?? 0) - 1;
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT')) {
        e.preventDefault();
        if (isLast) { tourStorage.markDone(tourId); onComplete?.(); }
        else setStep(s => s + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep(s => Math.max(0, s - 1));
      } else if (e.key === 'Escape') {
        tourStorage.markDone(tourId);
        onSkip?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // reads from ref, no deps needed

  if (!tour || !ready) return null;

  const currentStep = tour.steps[step];
  const isLast  = step === tour.steps.length - 1;
  const isFirst = step === 0;
  const winW    = window.innerWidth;
  const winH    = window.innerHeight;

  const handleNext = () => {
    if (isLast) { tourStorage.markDone(tourId); onComplete?.(); }
    else setStep(s => s + 1);
  };
  const handleBack = () => { if (!isFirst) setStep(s => s - 1); };
  const handleSkip = () => { tourStorage.markDone(tourId); onSkip?.(); };

  // ── Spotlight geometry ──────────────────────────────────────────────────────
  const spot = rect ? {
    x: rect.left - PADDING,
    y: rect.top  - PADDING,
    w: rect.width  + PADDING * 2,
    h: rect.height + PADDING * 2,
  } : null;

  const { style: cardStyle, caretStyle } = calcPosition(
    rect,
    currentStep?.position ?? null,
    winW,
    winH,
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Pointer-blocking quadrants (dark areas are non-interactive) ── */}
      {spot ? (
        <>
          <div style={{ position:'fixed', left:0, top:0, right:0, height: Math.max(0, spot.y), zIndex:9000, cursor:'default' }} />
          <div style={{ position:'fixed', left:0, top: spot.y + spot.h, right:0, bottom:0, zIndex:9000, cursor:'default' }} />
          <div style={{ position:'fixed', left:0, top: spot.y, width: Math.max(0, spot.x), height: spot.h, zIndex:9000, cursor:'default' }} />
          <div style={{ position:'fixed', left: spot.x + spot.w, top: spot.y, right:0, height: spot.h, zIndex:9000, cursor:'default' }} />
        </>
      ) : (
        <div style={{ position:'fixed', inset:0, zIndex:9000, cursor:'default' }} />
      )}

      {/* ── Dark overlay via box-shadow (spotlight area stays transparent) ── */}
      {spot ? (
        <div style={{
          position:      'fixed',
          left:          spot.x,
          top:           spot.y,
          width:         spot.w,
          height:        spot.h,
          borderRadius:  10,
          zIndex:        9001,
          pointerEvents: 'none',
          boxShadow:     '0 0 0 9999px rgba(0,0,0,0.72)',
          transition:    'left .22s ease, top .22s ease, width .22s ease, height .22s ease',
        }} />
      ) : (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9001, pointerEvents:'none' }} />
      )}

      {/* ── Cyan highlight ring ── */}
      {spot && (
        <div style={{
          position:      'fixed',
          left:          spot.x,
          top:           spot.y,
          width:         spot.w,
          height:        spot.h,
          borderRadius:  10,
          border:        '2px solid rgba(6,182,212,0.85)',
          boxShadow:     '0 0 0 4px rgba(6,182,212,0.16)',
          zIndex:        9002,
          pointerEvents: 'none',
          transition:    'left .22s ease, top .22s ease, width .22s ease, height .22s ease',
        }} />
      )}

      {/* ── Tooltip card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...cardStyle,
          zIndex:       9005,
          background:   '#1e293b',
          border:       '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          boxShadow:    '0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(6,182,212,0.1)',
          padding:      '18px 18px 14px',
          userSelect:   'none',
          fontFamily:   'Arial, sans-serif',
        }}
      >
        {/* Caret arrow */}
        {caretStyle && <div style={caretStyle} />}

        {/* Header row: label pill + step counter + close */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#06b6d4', textTransform:'uppercase', letterSpacing:'0.08em', background:'rgba(6,182,212,0.1)', padding:'2px 8px', borderRadius:20 }}>
            {tour.label}
          </span>
          <span style={{ fontSize:11, color:'#475569', marginLeft:'auto', flexShrink:0 }}>
            {step + 1} / {tour.steps.length}
          </span>
          <button
            onClick={handleSkip}
            title="Close"
            style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'2px', lineHeight:1, display:'flex', alignItems:'center', flexShrink:0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Title */}
        <p style={{ fontSize:15, fontWeight:700, color:'#f1f5f9', lineHeight:1.3, margin:'0 0 8px' }}>
          {currentStep?.title}
        </p>

        {/* Body */}
        <p style={{ fontSize:13.5, color:'#94a3b8', lineHeight:1.6, margin:`0 0 ${currentStep?.tip ? 8 : 14}px` }}>
          {currentStep?.body}
        </p>

        {/* Tip */}
        {currentStep?.tip && (
          <p style={{ fontSize:11.5, color:'#0891b2', marginBottom:12, fontStyle:'italic' }}>
            {currentStep.tip}
          </p>
        )}

        {/* Progress dots */}
        <div style={{ display:'flex', gap:4, marginBottom:12 }}>
          {tour.steps.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              title={`Step ${i + 1}`}
              style={{
                width:        i === step ? 20 : 6,
                height:       6,
                borderRadius: 3,
                cursor:       'pointer',
                flexShrink:   0,
                background:   i === step ? '#06b6d4' : (i < step ? '#0e7490' : '#334155'),
                transition:   'all .2s ease',
              }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {!isFirst && (
            <button onClick={handleBack}
              style={{ fontSize:13, color:'#94a3b8', background:'rgba(255,255,255,0.05)', border:'1px solid #334155', borderRadius:7, padding:'6px 14px', cursor:'pointer', fontFamily:'Arial,sans-serif', flexShrink:0 }}>
              ← Back
            </button>
          )}
          <div style={{ flex:1 }} />
          {!isLast && (
            <button onClick={handleSkip}
              style={{ fontSize:12, color:'#475569', background:'none', border:'none', cursor:'pointer', fontFamily:'Arial,sans-serif', textDecoration:'underline', flexShrink:0 }}>
              Skip
            </button>
          )}
          <button onClick={handleNext}
            style={{ fontSize:13, fontWeight:700, color:'#030712', background:'#06b6d4', border:'none', borderRadius:7, padding:'7px 18px', cursor:'pointer', fontFamily:'Arial,sans-serif', flexShrink:0, whiteSpace:'nowrap' }}>
            {isLast ? 'Got it ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  );
}
