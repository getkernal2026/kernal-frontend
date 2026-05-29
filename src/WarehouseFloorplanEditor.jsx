// ── Warehouse Floorplan Editor ─────────────────────────────────────────────────
// Lets admin / manager users define the physical warehouse layout:
//   Zone → Aisle → Bay → Bin
// Each bin generates a location_id (e.g. FRZ-A-01-1) used by stock records.

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';
import { DEMO_MODE } from './lib/demoMode.js';
import { api } from './lib/api.js';
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  Warehouse, LayoutGrid, Layers, Box, X, Save,
  AlertTriangle, Thermometer, Package, RefreshCcw,
} from 'lucide-react';

// ── Colour options for zones ──────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { id: 'cyan',   label: 'Cyan',   cls: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'   },
  { id: 'blue',   label: 'Blue',   cls: 'bg-blue-500/15 border-blue-500/30 text-blue-400'   },
  { id: 'amber',  label: 'Amber',  cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  { id: 'gray',   label: 'Gray',   cls: 'bg-gray-700/30 border-gray-600 text-gray-400'       },
  { id: 'green',  label: 'Green',  cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  { id: 'purple', label: 'Purple', cls: 'bg-violet-500/15 border-violet-500/30 text-violet-400'   },
  { id: 'rose',   label: 'Rose',   cls: 'bg-rose-500/15 border-rose-500/30 text-rose-400'   },
];

const ZONE_TYPES = [
  { id: 'frozen',  label: 'Frozen'  },
  { id: 'cooler',  label: 'Cooler'  },
  { id: 'dry',     label: 'Dry / Ambient' },
  { id: 'staging', label: 'Staging' },
  { id: 'other',   label: 'Other'   },
];

function colorCls(color) {
  return (COLOR_OPTIONS.find(c => c.id === color) || COLOR_OPTIONS[3]).cls;
}

// ── Type → icon ───────────────────────────────────────────────────────────────
function NodeIcon({ type, size = 'w-3.5 h-3.5' }) {
  const cls = `${size} shrink-0`;
  if (type === 'zone')  return <Warehouse  className={cls} />;
  if (type === 'aisle') return <LayoutGrid className={cls} />;
  if (type === 'bay')   return <Layers     className={cls} />;
  return                       <Box        className={cls} />;
}

// ── Empty-state placeholders ──────────────────────────────────────────────────
const EMPTY_ZONE_DEMO = [
  {
    id: 'demo-z1', type: 'zone', code: 'FRZ', label: 'Frozen', color: 'cyan',
    temp: '0°F / -18°C', zone_type: 'frozen', sort_order: 0,
  },
  {
    id: 'demo-z2', type: 'zone', code: 'CLR', label: 'Cooler', color: 'blue',
    temp: '38°F / 3°C', zone_type: 'cooler', sort_order: 1,
  },
  {
    id: 'demo-z3', type: 'zone', code: 'DRY', label: 'Dry', color: 'amber',
    temp: 'Ambient', zone_type: 'dry', sort_order: 2,
  },
  {
    id: 'demo-z4', type: 'zone', code: 'STG', label: 'Staging', color: 'gray',
    temp: 'Ambient', zone_type: 'staging', sort_order: 3,
  },
];

// ── Node form ─────────────────────────────────────────────────────────────────
function NodeForm({ mode, type, parentLabel, initial, onSave, onCancel, saving }) {
  const isZone  = type === 'zone';
  const isAisle = type === 'aisle';
  const isBay   = type === 'bay';
  const isBin   = type === 'bin';

  const [form, setForm] = useState({
    code:      initial?.code      || '',
    label:     initial?.label     || '',
    color:     initial?.color     || 'cyan',
    temp:      initial?.temp      || '',
    zone_type: initial?.zone_type || 'dry',
    capacity:  initial?.capacity  != null ? String(initial.capacity) : '',
    sort_order: initial?.sort_order != null ? String(initial.sort_order) : '0',
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const canSubmit = form.code.trim() && form.label.trim();

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-gray-100 flex items-center gap-2">
            <NodeIcon type={type} />
            {mode === 'add' ? 'Add' : 'Edit'} {type.charAt(0).toUpperCase() + type.slice(1)}
            {parentLabel && <span className="text-gray-500 font-normal text-xs">in {parentLabel}</span>}
          </h3>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Code */}
          <div>
            <label className={UI.label}>
              {isZone ? 'Zone Code' : isAisle ? 'Aisle Letter/Code' : isBay ? 'Bay Number/Code' : 'Slot/Level Code'}
              <span className="text-rose-400 ml-1">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder={isZone ? 'FRZ' : isAisle ? 'A' : isBay ? '01' : '1'}
              className={UI.input}
              maxLength={8}
            />
            <p className="text-[10px] text-gray-600 mt-1">
              {isBin
                ? 'Single identifier — location ID is built automatically from the hierarchy above'
                : 'Short uppercase identifier used in location addresses'}
            </p>
          </div>

          {/* Label */}
          <div>
            <label className={UI.label}>Display Label <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={form.label}
              onChange={e => set('label', e.target.value)}
              placeholder={isZone ? 'Frozen Zone' : isAisle ? 'Aisle A' : isBay ? 'Bay 01' : 'Floor Level'}
              className={UI.input}
            />
          </div>

          {/* Zone-specific */}
          {isZone && (
            <>
              <div>
                <label className={UI.label}>Zone Type</label>
                <select value={form.zone_type} onChange={e => set('zone_type', e.target.value)} className={UI.select}>
                  {ZONE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={UI.label}>Temperature</label>
                <input
                  type="text"
                  value={form.temp}
                  onChange={e => set('temp', e.target.value)}
                  placeholder="e.g. 0°F / -18°C or Ambient"
                  className={UI.input}
                />
              </div>
              <div>
                <label className={UI.label}>Colour Theme</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set('color', c.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${colorCls(c.id)} ${
                        form.color === c.id ? 'ring-2 ring-white/30 scale-105' : 'opacity-60 hover:opacity-90'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bin-specific */}
          {isBin && (
            <div>
              <label className={UI.label}>Capacity (units)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.capacity}
                onChange={e => set('capacity', e.target.value)}
                placeholder="e.g. 60"
                className={UI.input}
              />
              <p className="text-[10px] text-gray-600 mt-1">Max qty units this bin can hold (used for utilisation display)</p>
            </div>
          )}

          {/* Sort order */}
          <div>
            <label className={UI.label}>Sort Order</label>
            <input
              type="number"
              min="0"
              value={form.sort_order}
              onChange={e => set('sort_order', e.target.value)}
              className={UI.input}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-800">
          <button onClick={onCancel} className={UI.btnSecondary}>Cancel</button>
          <button
            onClick={() => onSave({
              code:       form.code.trim(),
              label:      form.label.trim(),
              color:      form.color,
              temp:       form.temp || null,
              zone_type:  form.zone_type || null,
              capacity:   form.capacity ? parseFloat(form.capacity) : null,
              sort_order: parseInt(form.sort_order) || 0,
            })}
            disabled={!canSubmit || saving}
            className={`${UI.btnPrimary} disabled:opacity-40`}
          >
            {saving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : mode === 'add' ? 'Add' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm delete dialog ─────────────────────────────────────────────────────
function DeleteConfirm({ node, onConfirm, onCancel, saving }) {
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-rose-500/30 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <h3 className="font-bold text-gray-100">Delete {node.type}?</h3>
        </div>
        <p className="text-sm text-gray-400">
          Deleting <span className="text-gray-200 font-medium">{node.label}</span> will also
          remove all nested {node.type === 'zone' ? 'aisles, bays, and bins' : node.type === 'aisle' ? 'bays and bins' : node.type === 'bay' ? 'bins' : 'this bin'}.
        </p>
        {node.location_id && (
          <p className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            Location ID: {node.location_id}
          </p>
        )}
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Bins with live stock cannot be deleted — move stock first.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className={UI.btnSecondary}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
          >
            {saving ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bin row ───────────────────────────────────────────────────────────────────
function BinRow({ bin, canEdit, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors group">
      <div className="flex items-center gap-2 min-w-0">
        <Box className="w-3 h-3 text-gray-600 shrink-0" />
        <div className="min-w-0">
          <span className="text-xs font-medium text-gray-300">{bin.label}</span>
          {bin.location_id && (
            <code className="ml-2 text-[10px] font-mono text-gray-600">{bin.location_id}</code>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {bin.capacity != null && (
          <span className="text-[10px] text-gray-600">cap: {bin.capacity}</span>
        )}
        {canEdit && (
          <div className="hidden group-hover:flex items-center gap-1">
            <button onClick={() => onEdit(bin)} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(bin)} className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bay card ──────────────────────────────────────────────────────────────────
function BayCard({ bay, bins, canEdit, onAdd, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 bg-gray-800/60 cursor-pointer hover:bg-gray-800 transition-colors group"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
          <Layers className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-300">{bay.label}</span>
          <span className="text-[10px] text-gray-600">{bins.length} bin{bins.length !== 1 ? 's' : ''}</span>
        </div>
        {canEdit && (
          <div className="hidden group-hover:flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => onAdd(bay)} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-cyan-400 transition-colors" title="Add bin">
              <Plus className="w-3 h-3" />
            </button>
            <button onClick={() => onEdit(bay)} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(bay)} className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="p-2 space-y-1">
          {bins.length === 0 ? (
            <p className="text-[10px] text-gray-700 italic px-2 py-1">No bins — add one to create storage locations</p>
          ) : (
            bins.map(bin => (
              <BinRow key={bin.id} bin={bin} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
          {canEdit && (
            <button
              onClick={() => onAdd(bay)}
              className="w-full flex items-center gap-1.5 justify-center px-3 py-1.5 text-[10px] text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/5 border border-dashed border-gray-800 hover:border-cyan-500/30 rounded-lg transition-all"
            >
              <Plus className="w-3 h-3" /> Add Bin
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Aisle section ─────────────────────────────────────────────────────────────
function AisleSection({ aisle, bays, bins, canEdit, onAddBay, onAddBin, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  const aisleBays = bays.filter(b => b.parent_id === aisle.id).sort((a, b) => (a.sort_order - b.sort_order) || a.code.localeCompare(b.code));

  return (
    <div className="border border-gray-700/60 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-gray-800/40 cursor-pointer hover:bg-gray-800/60 transition-colors group"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
          <LayoutGrid className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-sm font-semibold text-gray-200">{aisle.label}</span>
          <span className="text-xs text-gray-600">{aisleBays.length} bay{aisleBays.length !== 1 ? 's' : ''}</span>
        </div>
        {canEdit && (
          <div className="hidden group-hover:flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => onAddBay(aisle)} className="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-cyan-400 transition-colors" title="Add bay">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(aisle)} className="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(aisle)} className="p-1.5 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {aisleBays.length === 0 && (
            <p className="text-xs text-gray-700 italic col-span-full px-1">No bays in this aisle</p>
          )}
          {aisleBays.map(bay => (
            <BayCard
              key={bay.id}
              bay={bay}
              bins={bins.filter(b => b.parent_id === bay.id).sort((a, b) => (a.sort_order - b.sort_order) || a.code.localeCompare(b.code))}
              canEdit={canEdit}
              onAdd={onAddBin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {canEdit && (
            <button
              onClick={() => onAddBay(aisle)}
              className="flex items-center gap-1.5 justify-center p-3 text-xs text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/5 border border-dashed border-gray-800 hover:border-cyan-500/30 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bay
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Zone card ─────────────────────────────────────────────────────────────────
function ZoneCard({ zone, aisles, bays, bins, canEdit, onAddAisle, onAddBay, onAddBin, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  const clr = colorCls(zone.color);
  const zoneAisles = aisles.filter(a => a.parent_id === zone.id).sort((a, b) => (a.sort_order - b.sort_order) || a.code.localeCompare(b.code));
  const totalBins  = bins.filter(b => {
    const bay   = bays.find(y => y.id === b.parent_id);
    const aisle = bay ? aisles.find(a => a.id === bay.parent_id) : null;
    return aisle?.parent_id === zone.id;
  }).length;

  return (
    <div className={`border rounded-2xl overflow-hidden ${clr}`}>
      {/* Zone header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer group"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Warehouse className="w-4 h-4" />
          <div>
            <span className="font-bold text-sm">{zone.label}</span>
            <span className="ml-2 text-[10px] font-mono opacity-70">{zone.code}</span>
            {zone.temp && (
              <span className="ml-2 text-[10px] opacity-70">
                <Thermometer className="w-2.5 h-2.5 inline mr-0.5" />{zone.temp}
              </span>
            )}
          </div>
          <span className="text-[10px] opacity-50 ml-1">
            {zoneAisles.length} aisle{zoneAisles.length !== 1 ? 's' : ''} · {totalBins} bin{totalBins !== 1 ? 's' : ''}
          </span>
        </div>
        {canEdit && (
          <div className="hidden group-hover:flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => onAddAisle(zone)} className="p-1.5 rounded hover:bg-white/10 transition-colors opacity-60 hover:opacity-100" title="Add aisle">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(zone)} className="p-1.5 rounded hover:bg-white/10 transition-colors opacity-60 hover:opacity-100">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(zone)} className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400/70 hover:text-rose-400 transition-colors opacity-60 hover:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Zone body */}
      {open && (
        <div className="bg-gray-950/40 px-4 py-3 space-y-3">
          {zoneAisles.length === 0 && (
            <p className="text-xs text-gray-700 italic">No aisles — add one to start building this zone</p>
          )}
          {zoneAisles.map(aisle => (
            <AisleSection
              key={aisle.id}
              aisle={aisle}
              bays={bays}
              bins={bins}
              canEdit={canEdit}
              onAddBay={onAddBay}
              onAddBin={onAddBin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {canEdit && (
            <button
              onClick={() => onAddAisle(zone)}
              className="w-full flex items-center gap-2 justify-center py-2.5 text-xs text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/5 border border-dashed border-gray-800 hover:border-cyan-500/30 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Aisle
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WarehouseFloorplanEditor() {
  const { activeUser, showToast } = useKernal();

  const canEdit = !DEMO_MODE && (activeUser?.role === 'admin' || activeUser?.role === 'manager');

  // ── State ─────────────────────────────────────────────────────────────────
  const [nodes, setNodes]     = useState(DEMO_MODE ? EMPTY_ZONE_DEMO : []);
  const [loading, setLoading] = useState(!DEMO_MODE);

  // Modal state
  const [modal, setModal]     = useState(null);
  // { mode: 'add'|'edit', type: 'zone'|'aisle'|'bay'|'bin', parent: node|null, node: node|null }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]   = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    if (DEMO_MODE) return;
    setLoading(true);
    api.warehouse.floorplan.list()
      .then(res => setNodes(res.data || []))
      .catch(err => showToast?.(`Failed to load floor plan: ${err.message}`, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  // ── Derived hierarchy ─────────────────────────────────────────────────────
  const zones  = useMemo(() => nodes.filter(n => n.type === 'zone') .sort((a, b) => (a.sort_order - b.sort_order) || a.code.localeCompare(b.code)), [nodes]);
  const aisles = useMemo(() => nodes.filter(n => n.type === 'aisle'), [nodes]);
  const bays   = useMemo(() => nodes.filter(n => n.type === 'bay'),   [nodes]);
  const bins   = useMemo(() => nodes.filter(n => n.type === 'bin'),   [nodes]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const openAdd = (type, parent = null) => setModal({ mode: 'add', type, parent, node: null });
  const openEdit = (node) => setModal({ mode: 'edit', type: node.type, parent: null, node });

  const handleSave = useCallback(async (formData) => {
    if (DEMO_MODE) { setModal(null); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        const body = {
          type:      modal.type,
          parent_id: modal.parent?.id || null,
          ...formData,
        };
        const res = await api.warehouse.floorplan.create(body);
        setNodes(prev => [...prev, res.data]);
        showToast?.(`${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)} added.`);
      } else {
        const res = await api.warehouse.floorplan.update(modal.node.id, formData);
        setNodes(prev => prev.map(n => n.id === modal.node.id ? { ...n, ...res.data } : n));
        showToast?.('Changes saved.');
      }
      setModal(null);
    } catch (err) {
      showToast?.(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [modal, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || DEMO_MODE) { setDeleteTarget(null); return; }
    setSaving(true);
    try {
      const res = await api.warehouse.floorplan.delete(deleteTarget.id);
      // Remove deleted node and all its descendants
      const removed = new Set(res.deletedLocationIds || []);
      setNodes(prev => prev.filter(n => {
        if (n.id === deleteTarget.id) return false;
        // Remove all descendants by checking parent chain
        let cur = n;
        while (cur.parent_id) {
          if (cur.parent_id === deleteTarget.id || removed.has(cur.id)) return false;
          cur = prev.find(p => p.id === cur.parent_id) || { parent_id: null };
        }
        return true;
      }));
      // Reload to be safe (cascade delete from server)
      load();
      showToast?.(`${deleteTarget.label} deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast?.(err.message || 'Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, load, showToast]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 gap-2">
        <RefreshCcw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading floor plan…</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-cyan-500" /> Floor Plan Editor
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Define your warehouse layout. Location IDs are built from Zone → Aisle → Bay → Bin.
            {!canEdit && <span className="ml-2 text-amber-500">View only — admin/manager role required to edit.</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!DEMO_MODE && (
            <button onClick={load} className={UI.btnSecondary} title="Refresh">
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {canEdit && (
            <button onClick={() => openAdd('zone')} className={UI.btnPrimary}>
              <Plus className="w-3.5 h-3.5" /> Add Zone
            </button>
          )}
        </div>
      </div>

      {/* Demo banner */}
      {DEMO_MODE && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Demo mode — showing example layout. Changes are not persisted. Disable demo mode to manage your real floor plan.
        </div>
      )}

      {/* Empty state */}
      {zones.length === 0 && !DEMO_MODE && (
        <div className="text-center py-16 text-gray-600 space-y-3">
          <Warehouse className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm">No zones defined yet.</p>
          {canEdit ? (
            <button onClick={() => openAdd('zone')} className={UI.btnPrimary}>
              <Plus className="w-3.5 h-3.5" /> Add Your First Zone
            </button>
          ) : (
            <p className="text-xs">Contact your admin to set up the warehouse layout.</p>
          )}
        </div>
      )}

      {/* Zone cards */}
      <div className="space-y-4">
        {zones.map(zone => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            aisles={aisles}
            bays={bays}
            bins={bins}
            canEdit={canEdit}
            onAddAisle={z => openAdd('aisle', z)}
            onAddBay={a => openAdd('bay', a)}
            onAddBin={b => openAdd('bin', b)}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      {/* Location ID reference table */}
      {bins.length > 0 && (
        <div className={`${UI.cardPad} mt-4`}>
          <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-cyan-500" /> Generated Location IDs
            <span className="text-xs font-normal text-gray-600">({bins.length} bins)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
            {bins.filter(b => b.location_id).sort((a, b) => a.location_id?.localeCompare(b.location_id)).map(bin => (
              <div key={bin.id} className="px-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs">
                <code className="font-mono text-cyan-400">{bin.location_id}</code>
                <div className="text-[10px] text-gray-600 truncate">{bin.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <NodeForm
          mode={modal.mode}
          type={modal.type}
          parentLabel={modal.parent?.label}
          initial={modal.node}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          node={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
