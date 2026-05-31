import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useRealtimeTable
 *
 * Subscribes to Supabase Realtime for a single table scoped to the current
 * tenant. Fires `onInsert`, `onUpdate`, and `onDelete` callbacks so callers
 * can merge events into their own state without owning the subscription lifecycle.
 *
 * @param {object} opts
 * @param {string}   opts.table        - Supabase table name (e.g. 'orders')
 * @param {string}   opts.tenantId     - Tenant UUID used as the channel filter
 * @param {function} [opts.onInsert]   - (newRow) => void
 * @param {function} [opts.onUpdate]   - (newRow, oldRow) => void
 * @param {function} [opts.onDelete]   - (oldRow) => void
 * @param {boolean}  [opts.enabled]    - Set false to skip subscribing (default: true)
 *
 * @example
 * useRealtimeTable({
 *   table: 'orders',
 *   tenantId,
 *   onInsert: (row) => setRows(prev => [row, ...prev]),
 *   onUpdate: (row) => setRows(prev => prev.map(r => r.id === row.id ? row : r)),
 *   onDelete: (row) => setRows(prev => prev.filter(r => r.id !== row.id)),
 * });
 */
export function useRealtimeTable({
  table,
  tenantId,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}) {
  // Keep latest callbacks in refs so the subscription closure never goes stale
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  useEffect(() => { onInsertRef.current = onInsert; }, [onInsert]);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);

  useEffect(() => {
    if (!enabled || !table || !tenantId) return;

    const channelName = `realtime:${table}:${tenantId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;
          if (eventType === 'INSERT' && onInsertRef.current) {
            onInsertRef.current(newRow);
          } else if (eventType === 'UPDATE' && onUpdateRef.current) {
            onUpdateRef.current(newRow, oldRow);
          } else if (eventType === 'DELETE' && onDeleteRef.current) {
            onDeleteRef.current(oldRow);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn(`[useRealtimeTable] channel error on ${channelName}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, tenantId, enabled]);
}

/**
 * useRealtimeRows
 *
 * Higher-level convenience hook: manages a rows array and keeps it
 * in sync with Realtime events. Returns [rows, setRows] so the caller
 * can seed or replace the array (e.g. after a fetch).
 *
 * Merge strategy: INSERT prepends, UPDATE replaces by `id`, DELETE removes by `id`.
 * Pass `idField` if your table uses a different PK column name.
 *
 * @param {object} opts - Same as useRealtimeTable, plus:
 * @param {any[]}  [opts.initialRows]  - Seed rows (default: [])
 * @param {string} [opts.idField]      - Primary key field name (default: 'id')
 * @returns {[any[], function]}  [rows, setRows]
 */
export function useRealtimeRows({
  table,
  tenantId,
  enabled = true,
  initialRows = [],
  idField = 'id',
}) {
  const [rows, setRows] = useState(initialRows);

  const onInsert = useCallback(
    (row) => setRows((prev) => {
      if (prev.some((r) => r[idField] === row[idField])) return prev; // dedupe
      return [row, ...prev];
    }),
    [idField]
  );

  const onUpdate = useCallback(
    (row) => setRows((prev) =>
      prev.map((r) => (r[idField] === row[idField] ? { ...r, ...row } : r))
    ),
    [idField]
  );

  const onDelete = useCallback(
    (row) => setRows((prev) => prev.filter((r) => r[idField] !== row[idField])),
    [idField]
  );

  useRealtimeTable({ table, tenantId, enabled, onInsert, onUpdate, onDelete });

  return [rows, setRows];
}
