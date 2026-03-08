import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastContainer, ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (type: ToastType, message: string, details?: string) => void;
  showSuccess: (message: string, details?: string) => void;
  showError: (message: string, details?: string) => void;
  showInfo: (message: string, details?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, details?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, type, message, details };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((message: string, details?: string) => {
    addToast('success', message, details);
  }, [addToast]);

  const showError = useCallback((message: string, details?: string) => {
    addToast('error', message, details);
  }, [addToast]);

  const showInfo = useCallback((message: string, details?: string) => {
    addToast('info', message, details);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, showSuccess, showError, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
