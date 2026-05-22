'use client';

export default function ConfirmDialog({
  isOpen, title, description, confirmText = 'Confirm', cancelText = 'Cancel',
  variant = 'danger', onConfirm, onCancel, loading, extraContent,
}) {
  if (!isOpen) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50'
      : 'px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-[#181818] border border-neutral-800/80 rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/80">
          <h2 className="text-base font-bold text-slate-100">{title}</h2>
          <button
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={onCancel}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
          {extraContent && <div className="mt-4">{extraContent}</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-800/80">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-[#242424] hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={confirmBtnClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
