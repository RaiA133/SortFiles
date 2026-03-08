import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  details?: string;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastItem({ toast, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-black dark:bg-green-900/20 dark:border-green-800 dark:text-green-100',
    error: 'bg-red-50 border-red-200 text-black dark:bg-red-900/20 dark:border-red-800 dark:text-red-100',
    info: 'bg-blue-50 border-blue-200 text-black dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-md animate-in slide-in-from-right opacity-100 ${colors[toast.type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{toast.message}</p>
        {toast.details && (
          <details className="mt-1">
            <summary className="text-xs opacity-75 cursor-pointer hover:opacity-100">Show details</summary>
            <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-auto max-h-32 whitespace-pre-wrap break-all">
              {toast.details}
            </pre>
          </details>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 opacity-100 hover:bg-black/10 rounded p-0.5 transition-colors"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
