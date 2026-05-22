'use client';
import { useEffect } from 'react';

const toastStyles = {
  success: 'border-green-500/30',
  error:   'border-red-500/30',
  info:    'border-blue-500/30',
};

function ToastIcon({ type }) {
  if (type === 'success') {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-green-400">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
    );
  }
  if (type === 'error') {
    return (
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-red-400">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
    );
  }
  // info
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-blue-400">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
      </svg>
    </span>
  );
}

export function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#181818] text-white text-sm shadow-xl border border-neutral-800/80 cursor-pointer max-w-sm animate-[fadeInUp_0.25s_ease] ${toastStyles[toast.type]}`}
      onClick={() => onRemove(toast.id)}
    >
      <ToastIcon type={toast.type} />
      <span>{toast.message}</span>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
