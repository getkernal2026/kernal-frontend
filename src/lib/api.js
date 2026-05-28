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
