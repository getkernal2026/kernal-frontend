// ── Kernel API Client ─────────────────────────────────────────────────────────
// Thin wrapper around the Railway backend. Attaches the Supabase JWT on every
// request so the backend's requireAuth middleware can verify it.
//
// NEVER import supabaseAdmin / service_role key here. The frontend only ever
// holds the anon-key Supabase client for auth token retrieval.

import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL || 'https://kernal-backend-production.up.railway.app';

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function authFetch(path, options = {}) {
  // Grab the current session JWT (null if not signed in)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

// ── API surface ───────────────────────────────────────────────────────────────
export const api = {
  // Health (no auth required)
  health: {
    check: () => authFetch('/health'),
    db:    () => authFetch('/health/db'),
  },

  products: {
    list:   (params = {}) => authFetch(`/api/v1/products${qs(params)}`),
    get:    (id)           => authFetch(`/api/v1/products/${id}`),
    create: (body)         => authFetch('/api/v1/products', { method: 'POST',   body: JSON.stringify(body) }),
    update: (id, body)     => authFetch(`/api/v1/products/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: (id)           => authFetch(`/api/v1/products/${id}`, { method: 'DELETE' }),
  },

  inventory: {
    list:   (params = {}) => authFetch(`/api/v1/inventory${qs(params)}`),
    get:    (id)           => authFetch(`/api/v1/inventory/${id}`),
    create: (body)         => authFetch('/api/v1/inventory', { method: 'POST',   body: JSON.stringify(body) }),
    update: (id, body)     => authFetch(`/api/v1/inventory/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    adjust: (id, body)     => authFetch(`/api/v1/inventory/${id}/adjust`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (id)           => authFetch(`/api/v1/inventory/${id}`, { method: 'DELETE' }),
  },

  customers: {
    list:   (params = {}) => authFetch(`/api/v1/customers${qs(params)}`),
    get:    (id)           => authFetch(`/api/v1/customers/${id}`),
    create: (body)         => authFetch('/api/v1/customers', { method: 'POST',   body: JSON.stringify(body) }),
    update: (id, body)     => authFetch(`/api/v1/customers/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: (id)           => authFetch(`/api/v1/customers/${id}`, { method: 'DELETE' }),
  },

  orders: {
    list:         (params = {}) => authFetch(`/api/v1/orders${qs(params)}`),
    get:          (id)           => authFetch(`/api/v1/orders/${id}`),
    create:       (body)         => authFetch('/api/v1/orders', { method: 'POST',   body: JSON.stringify(body) }),
    update:       (id, body)     => authFetch(`/api/v1/orders/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    updateStatus: (id, status)   => authFetch(`/api/v1/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    addItem:      (id, body)     => authFetch(`/api/v1/orders/${id}/items`, { method: 'POST',   body: JSON.stringify(body) }),
    deleteItem:   (id, itemId)   => authFetch(`/api/v1/orders/${id}/items/${itemId}`, { method: 'DELETE' }),
  },

  // ── Admin (requires admin role) ───────────────────────────────────────────
  admin: {
    // Tenant
    getTenant:    ()             => authFetch('/api/v1/admin/tenant'),
    updateTenant: (body)         => authFetch('/api/v1/admin/tenant', { method: 'PATCH', body: JSON.stringify(body) }),

    // Users
    listUsers:    ()             => authFetch('/api/v1/admin/users'),
    inviteUser:   (body)         => authFetch('/api/v1/admin/users/invite', { method: 'POST',   body: JSON.stringify(body) }),
    updateUser:   (id, body)     => authFetch(`/api/v1/admin/users/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    deactivateUser: (id)         => authFetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' }),

    // B2B Portal Customers — tenant admins manage portal access here
    b2bCustomers: {
      list:          ()          => authFetch('/api/v1/admin/b2b-customers'),
      create:        (body)      => authFetch('/api/v1/admin/b2b-customers', { method: 'POST',   body: JSON.stringify(body) }),
      update:        (id, body)  => authFetch(`/api/v1/admin/b2b-customers/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
      resetPassword: (id, pwd)   => authFetch(`/api/v1/admin/b2b-customers/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password: pwd }) }),
      deactivate:    (id)        => authFetch(`/api/v1/admin/b2b-customers/${id}`, { method: 'DELETE' }),
    },
  },

  // ── B2B Customer Portal ───────────────────────────────────────────────────
  // All calls require a logged-in B2B customer (Supabase session with a
  // b2b_customer_profiles row). The JWT is attached automatically by authFetch.
  b2b: {
    me:      ()           => authFetch('/api/v1/b2b/me'),
    catalog: (params = {}) => authFetch(`/api/v1/b2b/catalog${qs(params)}`),

    orders: {
      list:   (params = {}) => authFetch(`/api/v1/b2b/orders${qs(params)}`),
      create: (body)         => authFetch('/api/v1/b2b/orders', { method: 'POST', body: JSON.stringify(body) }),
    },

    returns: {
      list:   (params = {}) => authFetch(`/api/v1/b2b/returns${qs(params)}`),
      create: (body)         => authFetch('/api/v1/b2b/returns', { method: 'POST', body: JSON.stringify(body) }),
    },

    standingOrders: {
      list:   ()             => authFetch('/api/v1/b2b/standing-orders'),
      create: (body)         => authFetch('/api/v1/b2b/standing-orders', { method: 'POST',   body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/b2b/standing-orders/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
      delete: (id)           => authFetch(`/api/v1/b2b/standing-orders/${id}`, { method: 'DELETE' }),
    },

    invoices: {
      list: () => authFetch('/api/v1/b2b/invoices'),
    },
  },

  // ── CRM ──────────────────────────────────────────────────────────────────
  crm: {
    customers: {
      list:   (params = {}) => authFetch(`/api/v1/crm/customers${qs(params)}`),
      get:    (id)           => authFetch(`/api/v1/crm/customers/${id}`),
      create: (body)         => authFetch('/api/v1/crm/customers', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/crm/customers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id)           => authFetch(`/api/v1/crm/customers/${id}`, { method: 'DELETE' }),
    },

    contacts: {
      list:   (customerId)              => authFetch(`/api/v1/crm/customers/${customerId}/contacts`),
      create: (customerId, body)        => authFetch(`/api/v1/crm/customers/${customerId}/contacts`, { method: 'POST',  body: JSON.stringify(body) }),
      update: (customerId, id, body)    => authFetch(`/api/v1/crm/customers/${customerId}/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (customerId, id)          => authFetch(`/api/v1/crm/customers/${customerId}/contacts/${id}`, { method: 'DELETE' }),
    },

    tickets: {
      list:   (customerId)           => authFetch(`/api/v1/crm/customers/${customerId}/tickets`),
      create: (customerId, body)     => authFetch(`/api/v1/crm/customers/${customerId}/tickets`, { method: 'POST',  body: JSON.stringify(body) }),
      update: (customerId, id, body) => authFetch(`/api/v1/crm/customers/${customerId}/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },

    tasks: {
      list:   (customerId)           => authFetch(`/api/v1/crm/customers/${customerId}/tasks`),
      create: (customerId, body)     => authFetch(`/api/v1/crm/customers/${customerId}/tasks`, { method: 'POST',  body: JSON.stringify(body) }),
      update: (customerId, id, body) => authFetch(`/api/v1/crm/customers/${customerId}/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },

    notes: {
      list:   (customerId)       => authFetch(`/api/v1/crm/customers/${customerId}/notes`),
      create: (customerId, body) => authFetch(`/api/v1/crm/customers/${customerId}/notes`, { method: 'POST', body: JSON.stringify(body) }),
    },

    nps: {
      list:   (customerId)       => authFetch(`/api/v1/crm/customers/${customerId}/nps`),
      create: (customerId, body) => authFetch(`/api/v1/crm/customers/${customerId}/nps`, { method: 'POST', body: JSON.stringify(body) }),
    },

    documents: {
      list:   (customerId)       => authFetch(`/api/v1/crm/customers/${customerId}/documents`),
      create: (customerId, body) => authFetch(`/api/v1/crm/customers/${customerId}/documents`, { method: 'POST', body: JSON.stringify(body) }),
      delete: (customerId, id)   => authFetch(`/api/v1/crm/customers/${customerId}/documents/${id}`, { method: 'DELETE' }),
    },

    playbooks: {
      list:   (params = {}) => authFetch(`/api/v1/crm/playbooks${qs(params)}`),
      create: (body)         => authFetch('/api/v1/crm/playbooks', { method: 'POST', body: JSON.stringify(body) }),

      // Customer enrollment
      enroll:  (customerId, body)         => authFetch(`/api/v1/crm/customers/${customerId}/playbooks`, { method: 'POST',  body: JSON.stringify(body) }),
      update:  (customerId, id, body)     => authFetch(`/api/v1/crm/customers/${customerId}/playbooks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      unenroll:(customerId, id)           => authFetch(`/api/v1/crm/customers/${customerId}/playbooks/${id}`, { method: 'DELETE' }),
    },
  },

  // ── Procurement ──────────────────────────────────────────────────────────
  procurement: {
    vendors: {
      list:   (params = {}) => authFetch(`/api/v1/procurement/vendors${qs(params)}`),
      get:    (id)           => authFetch(`/api/v1/procurement/vendors/${id}`),
      create: (body)         => authFetch('/api/v1/procurement/vendors', { method: 'POST',   body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/procurement/vendors/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
      delete: (id)           => authFetch(`/api/v1/procurement/vendors/${id}`, { method: 'DELETE' }),
    },
    purchaseOrders: {
      list:         (params = {}) => authFetch(`/api/v1/procurement/purchase-orders${qs(params)}`),
      get:          (id)           => authFetch(`/api/v1/procurement/purchase-orders/${id}`),
      create:       (body)         => authFetch('/api/v1/procurement/purchase-orders', { method: 'POST',   body: JSON.stringify(body) }),
      update:       (id, body)     => authFetch(`/api/v1/procurement/purchase-orders/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
      updateStatus: (id, status)   => authFetch(`/api/v1/procurement/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
      cancel:       (id)           => authFetch(`/api/v1/procurement/purchase-orders/${id}`, { method: 'DELETE' }),
      addLine:      (id, body)     => authFetch(`/api/v1/procurement/purchase-orders/${id}/lines`, { method: 'POST',   body: JSON.stringify(body) }),
      updateLine:   (id, lineId, body) => authFetch(`/api/v1/procurement/purchase-orders/${id}/lines/${lineId}`, { method: 'PATCH', body: JSON.stringify(body) }),
      deleteLine:   (id, lineId)   => authFetch(`/api/v1/procurement/purchase-orders/${id}/lines/${lineId}`, { method: 'DELETE' }),
    },
  },

  // ── Accounting ────────────────────────────────────────────────────────────
  accounting: {
    invoices: {
      list:         (params = {}) => authFetch(`/api/v1/accounting/invoices${qs(params)}`),
      get:          (id)           => authFetch(`/api/v1/accounting/invoices/${id}`),
      create:       (body)         => authFetch('/api/v1/accounting/invoices', { method: 'POST',  body: JSON.stringify(body) }),
      update:       (id, body)     => authFetch(`/api/v1/accounting/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      updateStatus: (id, status)   => authFetch(`/api/v1/accounting/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
      recordPayment:(id, amount)   => authFetch(`/api/v1/accounting/invoices/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ amount }) }),
      addLine:      (id, body)     => authFetch(`/api/v1/accounting/invoices/${id}/lines`, { method: 'POST',  body: JSON.stringify(body) }),
      deleteLine:   (id, lineId)   => authFetch(`/api/v1/accounting/invoices/${id}/lines/${lineId}`, { method: 'DELETE' }),
    },
  },

  // ── Logistics ─────────────────────────────────────────────────────────────
  logistics: {
    routes: {
      list:         (params = {}) => authFetch(`/api/v1/logistics/routes${qs(params)}`),
      get:          (id)           => authFetch(`/api/v1/logistics/routes/${id}`),
      create:       (body)         => authFetch('/api/v1/logistics/routes', { method: 'POST',  body: JSON.stringify(body) }),
      updateStatus: (id, status, extra = {}) => authFetch(`/api/v1/logistics/routes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) }),
    },
    stops: {
      add:    (routeId, body)           => authFetch(`/api/v1/logistics/routes/${routeId}/stops`, { method: 'POST',  body: JSON.stringify(body) }),
      update: (routeId, stopId, body)   => authFetch(`/api/v1/logistics/routes/${routeId}/stops/${stopId}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (routeId, stopId)         => authFetch(`/api/v1/logistics/routes/${routeId}/stops/${stopId}`, { method: 'DELETE' }),
    },
  },

  // ── GL / Chart of Accounts / Journal Entries / AP Bills ──────────────────
  gl: {
    accounts: {
      list:   (params = {}) => authFetch(`/api/v1/gl/accounts${qs(params)}`),
      create: (body)         => authFetch('/api/v1/gl/accounts', { method: 'POST',  body: JSON.stringify(body) }),
      update: (code, body)   => authFetch(`/api/v1/gl/accounts/${code}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
    periods: {
      list:  (params = {}) => authFetch(`/api/v1/gl/periods${qs(params)}`),
      close: (id)           => authFetch(`/api/v1/gl/periods/${id}/close`, { method: 'POST', body: JSON.stringify({}) }),
    },
    entries: {
      list:   (params = {}) => authFetch(`/api/v1/gl/entries${qs(params)}`),
      get:    (id)           => authFetch(`/api/v1/gl/entries/${id}`),
      create: (body)         => authFetch('/api/v1/gl/entries', { method: 'POST',  body: JSON.stringify(body) }),
      void:   (id, reason)   => authFetch(`/api/v1/gl/entries/${id}/void`, { method: 'POST', body: JSON.stringify({ void_reason: reason }) }),
    },
    bills: {
      list:          (params = {}) => authFetch(`/api/v1/gl/bills${qs(params)}`),
      get:           (id)           => authFetch(`/api/v1/gl/bills/${id}`),
      create:        (body)         => authFetch('/api/v1/gl/bills', { method: 'POST',  body: JSON.stringify(body) }),
      updateStatus:  (id, status)   => authFetch(`/api/v1/gl/bills/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
      recordPayment: (id, amount)   => authFetch(`/api/v1/gl/bills/${id}/payment`, { method: 'POST', body: JSON.stringify({ amount }) }),
    },
  },

  // ── Pricing Engine ────────────────────────────────────────────────────────
  pricing: {
    priceBooks: {
      list:          (params = {}) => authFetch(`/api/v1/pricing/price-books${qs(params)}`),
      create:        (body)         => authFetch('/api/v1/pricing/price-books', { method: 'POST',   body: JSON.stringify(body) }),
      update:        (id, body)     => authFetch(`/api/v1/pricing/price-books/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
      addOverride:   (id, body)     => authFetch(`/api/v1/pricing/price-books/${id}/overrides`, { method: 'POST',   body: JSON.stringify(body) }),
      deleteOverride:(id, oid)      => authFetch(`/api/v1/pricing/price-books/${id}/overrides/${oid}`, { method: 'DELETE' }),
    },
    contracts: {
      list:   (params = {}) => authFetch(`/api/v1/pricing/contracts${qs(params)}`),
      create: (body)         => authFetch('/api/v1/pricing/contracts', { method: 'POST',   body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/pricing/contracts/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
      delete: (id)           => authFetch(`/api/v1/pricing/contracts/${id}`, { method: 'DELETE' }),
    },
    promotions: {
      list:   (params = {}) => authFetch(`/api/v1/pricing/promotions${qs(params)}`),
      create: (body)         => authFetch('/api/v1/pricing/promotions', { method: 'POST',   body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/pricing/promotions/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    },
    volumeTiers: {
      list:   (params = {}) => authFetch(`/api/v1/pricing/volume-tiers${qs(params)}`),
      upsert: (body)         => authFetch('/api/v1/pricing/volume-tiers', { method: 'POST',   body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/pricing/volume-tiers/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    },
  },

  // ── WMS ──────────────────────────────────────────────────────────────────
  wms: {
    tasks: {
      list:   (params = {}) => authFetch(`/api/v1/wms/tasks${qs(params)}`),
      get:    (id)           => authFetch(`/api/v1/wms/tasks/${id}`),
      create: (body)         => authFetch('/api/v1/wms/tasks', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/wms/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
  },

  // ── Loss Prevention ───────────────────────────────────────────────────────
  lp: {
    incidents: {
      list:   (params = {}) => authFetch(`/api/v1/lp/incidents${qs(params)}`),
      create: (body)         => authFetch('/api/v1/lp/incidents', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/lp/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
    tempReadings: {
      list:   (params = {}) => authFetch(`/api/v1/lp/temp-readings${qs(params)}`),
      create: (body)         => authFetch('/api/v1/lp/temp-readings', { method: 'POST', body: JSON.stringify(body) }),
    },
    pacaRejections: {
      list:   (params = {}) => authFetch(`/api/v1/lp/paca-rejections${qs(params)}`),
      create: (body)         => authFetch('/api/v1/lp/paca-rejections', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/lp/paca-rejections/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
    pacaDisputes: {
      list:   (params = {}) => authFetch(`/api/v1/lp/paca-disputes${qs(params)}`),
      create: (body)         => authFetch('/api/v1/lp/paca-disputes', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/lp/paca-disputes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
  },

  // ── Warehouse ─────────────────────────────────────────────────────────────
  warehouse: {
    fulfillment: {
      list:   (params = {}) => authFetch(`/api/v1/warehouse/fulfillment${qs(params)}`),
      create: (body)         => authFetch('/api/v1/warehouse/fulfillment', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/warehouse/fulfillment/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
    locationStock: {
      list:   (params = {}) => authFetch(`/api/v1/warehouse/location-stock${qs(params)}`),
      upsert: (body)         => authFetch('/api/v1/warehouse/location-stock', { method: 'POST', body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/warehouse/location-stock/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
    putaway: {
      list:   (params = {}) => authFetch(`/api/v1/warehouse/putaway${qs(params)}`),
      create: (body)         => authFetch('/api/v1/warehouse/putaway', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/warehouse/putaway/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
    picks: {
      list:   (params = {}) => authFetch(`/api/v1/warehouse/picks${qs(params)}`),
      create: (body)         => authFetch('/api/v1/warehouse/picks', { method: 'POST',  body: JSON.stringify(body) }),
      update: (id, body)     => authFetch(`/api/v1/warehouse/picks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    },
  },

  // ── Approvals ─────────────────────────────────────────────────────────────
  approvals: {
    list:   (params = {}) => authFetch(`/api/v1/approvals${qs(params)}`),
    create: (body)         => authFetch('/api/v1/approvals', { method: 'POST',  body: JSON.stringify(body) }),
    update: (id, body)     => authFetch(`/api/v1/approvals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },

  // ── NL Query ──────────────────────────────────────────────────────────────
  nlquery: {
    query: (q) => authFetch('/api/v1/nlquery', { method: 'POST', body: JSON.stringify({ query: q }) }),
  },

  // ── Driver Close-out / Daily Reconciliation ───────────────────────────────
  closeout: {
    list:           (date)               => authFetch(`/api/v1/closeout${date ? `?date=${date}` : ''}`),
    get:            (routeId)            => authFetch(`/api/v1/closeout/${routeId}`),
    create:         (body)               => authFetch('/api/v1/closeout', { method: 'POST', body: JSON.stringify(body) }),
    updateRoute:    (routeId, body)      => authFetch(`/api/v1/closeout/${routeId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    updateStop:     (routeId, stopId, body) => authFetch(`/api/v1/closeout/${routeId}/stops/${stopId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    signOff:        (routeId, body)      => authFetch(`/api/v1/closeout/${routeId}/signoff`, { method: 'POST', body: JSON.stringify(body || {}) }),
    undoSignOff:    (routeId)            => authFetch(`/api/v1/closeout/${routeId}/signoff`, { method: 'DELETE' }),
    depositSummary: (date)               => authFetch(`/api/v1/closeout/deposit-summary${date ? `?date=${date}` : ''}`),
  },

  // ── Custom Reports ────────────────────────────────────────────────────────
  reports: {
    // Fetch live rows for a data source
    source:      (src)       => authFetch(`/api/v1/reports/sources/${src}`),
    // Saved report definitions
    listSaved:   ()           => authFetch('/api/v1/reports/saved'),
    save:        (body)       => authFetch('/api/v1/reports/saved', { method: 'POST',   body: JSON.stringify(body) }),
    update:      (id, body)   => authFetch(`/api/v1/reports/saved/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),
    deleteSaved: (id)         => authFetch(`/api/v1/reports/saved/${id}`, { method: 'DELETE' }),
  },

  // ── Superadmin (requires superadmin role) ─────────────────────────────────
  superadmin: {
    // Stats
    getStats:       ()           => authFetch('/api/v1/superadmin/stats'),

    // Tenants
    listTenants:    ()           => authFetch('/api/v1/superadmin/tenants'),
    createTenant:   (body)       => authFetch('/api/v1/superadmin/tenants', { method: 'POST',   body: JSON.stringify(body) }),
    updateTenant:   (id, body)   => authFetch(`/api/v1/superadmin/tenants/${id}`, { method: 'PATCH',  body: JSON.stringify(body) }),

    // Users (cross-tenant)
    listUsers:      (params = {}) => authFetch(`/api/v1/superadmin/users${qs(params)}`),
    inviteUser:     (body)        => authFetch('/api/v1/superadmin/users/invite', { method: 'POST', body: JSON.stringify(body) }),
    updateUser:     (id, body)    => authFetch(`/api/v1/superadmin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    resetPassword:  (id, password) => authFetch(`/api/v1/superadmin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),

    // Billing
    getInvoices:    (tenantId)   => authFetch(`/api/v1/superadmin/tenants/${tenantId}/invoices`),
    attachBilling:  (tenantId, body) => authFetch(`/api/v1/superadmin/tenants/${tenantId}/billing/attach`, { method: 'POST', body: JSON.stringify(body) }),
    cancelBilling:  (tenantId)   => authFetch(`/api/v1/superadmin/tenants/${tenantId}/billing/cancel`, { method: 'DELETE' }),
  },
};
