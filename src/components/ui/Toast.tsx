import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { useToast, ToastItem } from '@/lib/ToastContext';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const icons = {
    info: <Info className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />,
    error: <AlertOctagon className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />,
  };

  const borders = {
    info: 'border-status-info-border bg-white',
    success: 'border-status-success-border bg-white',
    warning: 'border-status-warning-border bg-white',
    error: 'border-status-danger-border bg-white',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border p-3.5 shadow-modal transition-all animate-in fade-in slide-in-from-bottom-2',
        borders[toast.variant]
      )}
      role="status"
    >
      {icons[toast.variant]}
      <div className="flex-1 space-y-0.5 pr-2">
        {toast.title && (
          <h6 className="text-xs font-semibold text-charcoal">{toast.title}</h6>
        )}
        <p className="text-xs text-charcoal-muted leading-relaxed">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-charcoal-light hover:text-charcoal p-0.5 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
