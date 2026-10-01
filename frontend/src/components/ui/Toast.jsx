import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store/uiStore';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]',
  error: 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]',
  warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]',
  info: 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0284C7]',
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(true);
  const Icon = ICONS[toast.type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 200);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      className={cn(
        'toast-item flex items-start gap-3 px-4 py-3 rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.10)] min-w-72 max-w-sm',
        COLORS[toast.type],
        !visible && 'opacity-0 transition-opacity duration-200',
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-[#0F172A] leading-snug">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-xs text-[#475569] leading-snug mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 200); }}
        className="flex-shrink-0 text-[#94A3B8] hover:text-[#475569] p-0.5 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
