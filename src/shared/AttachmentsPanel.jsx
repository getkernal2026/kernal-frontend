/**
 * AttachmentsPanel — reusable document attachment widget.
 *
 * Props:
 *   recordId   {string}  — the record this panel belongs to (e.g. 'PO-AP-0881')
 *   recordLabel {string} — human label shown in the empty state
 *   isDark     {boolean}
 *   compact    {boolean} — slimmer layout for sidebars/drawers (default false)
 *   uploaderName {string} — name to stamp on newly uploaded files
 *
 * Reads/writes via useKernal() → attachments, addAttachment, removeAttachment, getAttachments.
 *
 * Real file upload: FileReader reads bytes → stores dataUrl in context.
 * Mock attachments have dataUrl=null and render a placeholder preview.
 */

import { useState, useRef, useCallback } from 'react';
import { useKernal } from '../KernalContext.jsx';

// ── File-type helpers ─────────────────────────────────────────────────────────
function mimeCategory(mimeType = '') {
  if (mimeType === 'application/pdf')           return 'pdf';
  if (mimeType.startsWith('image/'))            return 'image';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (mimeType.includes('sheet') || mimeType.includes('excel'))   return 'sheet';
  return 'file';
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1_048_576)  return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType, size = 16 }) {
  const cat = mimeCategory(mimeType);
  const s = size;
  if (cat === 'pdf') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
    </svg>
  );
  if (cat === 'image') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
  if (cat === 'doc') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  );
  // generic
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

// ── Tag badge ─────────────────────────────────────────────────────────────────
const TAG_COLORS = {
  'COA':         'bg-emerald-500/15 text-emerald-400',
  'HACCP Log':   'bg-emerald-500/15 text-emerald-400',
  'USDA COA':    'bg-emerald-500/15 text-emerald-400',
  'Inspection':  'bg-amber-500/15   text-amber-400',
  'Temp Log':    'bg-blue-500/15    text-blue-400',
  'Signed POD':  'bg-violet-500/15  text-violet-400',
  'Weight Ticket':'bg-violet-500/15 text-violet-400',
  'Contract':    'bg-cyan-500/15    text-cyan-400',
  'Credit App':  'bg-orange-500/15  text-orange-400',
  'Terms':       'bg-gray-500/15    text-gray-400',
};
const TAG_FALLBACK = 'bg-gray-700/60 text-gray-400';
function TagBadge({ tag }) {
  if (!tag) return null;
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${TAG_COLORS[tag] || TAG_FALLBACK}`}>
      {tag}
    </span>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────
function PreviewModal({ attachment, isDark, onClose }) {
  const cat = mimeCategory(attachment.mimeType);
  const panelCls = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200';
  const textCls  = isDark ? 'text-gray-100' : 'text-gray-900';
  const subCls   = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/85 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${panelCls}`} style={{ maxHeight: '88vh' }}>
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${isDark ? 'border-gray-800' : 'border-slate-100'} shrink-0`}>
          <FileTypeIcon mimeType={attachment.mimeType} size={18} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${textCls}`}>{attachment.name}</p>
            <p className={`text-[11px] ${subCls}`}>
              {formatBytes(attachment.size)} · Uploaded by {attachment.uploadedBy} · {attachment.uploadedAt}
            </p>
          </div>
          <TagBadge tag={attachment.tag} />
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 ml-2 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-950/30" style={{ minHeight: 300 }}>
          {attachment.dataUrl && cat === 'image' && (
            <img src={attachment.dataUrl} alt={attachment.name}
              className="max-w-full max-h-full rounded-lg shadow-xl object-contain" />
          )}
          {attachment.dataUrl && cat === 'pdf' && (
            <embed src={attachment.dataUrl} type="application/pdf"
              className="w-full rounded" style={{ height: '70vh' }} />
          )}
          {!attachment.dataUrl && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <FileTypeIcon mimeType={attachment.mimeType} size={48} />
              <div>
                <p className={`text-sm font-semibold mb-1 ${textCls}`}>{attachment.name}</p>
                <p className={`text-xs ${subCls}`}>
                  This is a demo attachment — no actual file is stored.
                </p>
                <p className={`text-xs mt-1 ${subCls}`}>
                  Upload a real file to preview it inline.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AttachmentsPanel({ recordId, recordLabel = 'this record', isDark, compact = false, uploaderName = 'You' }) {
  const { getAttachments, addAttachment, removeAttachment } = useKernal();
  const files = getAttachments(recordId);

  const [dragging, setDragging]     = useState(false);
  const [previewing, setPreviewing] = useState(null); // attachment being previewed
  const [uploading, setUploading]   = useState(false);
  const inputRef = useRef(null);

  // Style tokens
  const panelBg   = isDark ? 'bg-gray-900/40' : 'bg-white';
  const borderCls = isDark ? 'border-gray-800' : 'border-slate-200';
  const textCls   = isDark ? 'text-gray-100' : 'text-gray-900';
  const subCls    = isDark ? 'text-gray-500' : 'text-gray-400';
  const rowHover  = isDark ? 'hover:bg-gray-800/60' : 'hover:bg-slate-50';
  const dropBg    = dragging
    ? (isDark ? 'bg-cyan-500/10 border-cyan-500/60' : 'bg-cyan-50 border-cyan-400')
    : (isDark ? 'bg-gray-800/30 border-gray-700 hover:border-gray-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300');

  // ── Process dropped/selected files ────────────────────────────────────────
  const processFiles = useCallback((fileList) => {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    setUploading(true);
    let done = 0;
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const id = `att-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        const now = new Date().toLocaleString('en-US', {
          year:'numeric', month:'2-digit', day:'2-digit',
          hour:'2-digit', minute:'2-digit', hour12: false,
        }).replace(',', '');
        addAttachment(recordId, {
          id,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          dataUrl: e.target.result,
          uploadedBy: uploaderName,
          uploadedAt: now,
          tag: null,
          isMock: false,
        });
        done++;
        if (done === arr.length) setUploading(false);
      };
      reader.onerror = () => { done++; if (done === arr.length) setUploading(false); };
      reader.readAsDataURL(file);
    });
  }, [recordId, addAttachment, uploaderName]);

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    processFiles(e.dataTransfer.files);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onInputChange = (e) => processFiles(e.target.files);

  return (
    <div className={compact ? '' : `rounded-xl border ${borderCls} ${panelBg} overflow-hidden`}>
      {/* Header */}
      {!compact && (
        <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCls}`}>
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span className={`text-sm font-bold ${textCls}`}>Attachments</span>
            {files.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400">{files.length}</span>
            )}
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Upload
          </button>
        </div>
      )}

      <div className={compact ? '' : 'p-4 space-y-4'}>
        {/* Existing files */}
        {files.length > 0 && (
          <div className={`space-y-1 ${compact ? 'mb-3' : ''}`}>
            {files.map(att => (
              <div key={att.id}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${rowHover}`}
                onClick={() => setPreviewing(att)}
              >
                {/* Thumbnail or icon */}
                <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-gray-800/50">
                  {att.dataUrl && mimeCategory(att.mimeType) === 'image'
                    ? <img src={att.dataUrl} alt="" className="w-full h-full object-cover" />
                    : <FileTypeIcon mimeType={att.mimeType} size={18} />
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${textCls}`}>{att.name}</p>
                  <p className={`text-[10px] ${subCls}`}>
                    {formatBytes(att.size)} · {att.uploadedBy} · {att.uploadedAt}
                  </p>
                </div>
                {/* Tag */}
                <TagBadge tag={att.tag} />
                {/* Remove */}
                <button
                  onClick={e => { e.stopPropagation(); removeAttachment(recordId, att.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-1 shrink-0"
                  title="Remove attachment"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer select-none ${compact ? 'py-3' : 'py-6'} ${dropBg}`}
        >
          {uploading ? (
            <p className={`text-xs ${subCls}`}>Uploading…</p>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={dragging ? 'text-cyan-400' : 'text-gray-600'}>
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              <p className={`text-xs font-medium ${dragging ? 'text-cyan-400' : subCls}`}>
                {dragging ? 'Drop to attach' : `Drop files or click to upload`}
              </p>
              {!compact && (
                <p className={`text-[10px] ${subCls}`}>PDFs, images, or any file · Stored in-session</p>
              )}
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onInputChange}
        />

        {/* Compact header (if compact, show title + count inline) */}
        {compact && files.length === 0 && (
          <p className={`text-xs text-center ${subCls} mt-1`}>No attachments yet for {recordLabel}</p>
        )}
      </div>

      {/* Preview modal */}
      {previewing && (
        <PreviewModal
          attachment={previewing}
          isDark={isDark}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
