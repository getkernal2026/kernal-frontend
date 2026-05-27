import React from 'react';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// KERNAL SHARED MODAL SYSTEM
//
// <Modal isOpen onClose title icon maxWidth wide hideHeader>
//   children
// </Modal>
//
// maxWidth: Tailwind max-w-* string, default 'max-w-2xl'
// wide:     shorthand for max-w-4xl (overrides maxWidth)
// hideHeader: renders no title bar (for custom-header modals)
// scrollBody: wraps children in overflow-y-auto flex-1 px-6 py-5 (Procurement style)
// ─────────────────────────────────────────────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = 'max-w-2xl',
  wide = false,
  hideHeader = false,
  scrollBody = false,
}) {
  if (!isOpen) return null;

  const sizeClass = wide ? 'max-w-4xl' : maxWidth;

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full ${sizeClass} flex flex-col max-h-[90vh] overflow-hidden`}>
        {!hideHeader && (
          <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
            <h3 className="font-bold text-gray-100 flex items-center gap-3 text-sm uppercase tracking-widest">
              {Icon && <Icon className="w-5 h-5 text-cyan-500" />}
              {title}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {scrollBody
          ? <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
          : children
        }
      </div>
    </div>
  );
}

// ── Low-level primitives (used by Accounting + CRM compound modals) ──────────
export function ModalOverlay({ children }) {
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      {children}
    </div>
  );
}
// Alias for backwards compatibility
export const Overlay = ModalOverlay;

export function ModalBox({ children, wide, maxW }) {
  const sizeClass = wide ? 'max-w-3xl' : (maxW || 'max-w-lg');
  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full ${sizeClass}`}>
      {children}
    </div>
  );
}

export function ModalHeader({ title, icon: Icon, onClose }) {
  return (
    <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
      <h3 className="font-bold text-gray-100 flex items-center gap-2 text-sm uppercase tracking-widest">
        {Icon && <Icon className="w-4 h-4 text-cyan-500" />}
        {title}
      </h3>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

// ── Document-view modal header (light/white document panels) ─────────────────
export function DocModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl flex-shrink-0">
      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-widest">{title}</h3>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default Modal;
