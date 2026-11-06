import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-16 md:bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-emerald-950 text-emerald-50 border-emerald-800',
            error: 'bg-rose-950 text-rose-50 border-rose-800',
            warning: 'bg-amber-950 text-amber-50 border-amber-800',
            info: 'bg-slate-900 text-slate-100 border-slate-700',
          };

          const iconColors = {
            success: 'text-emerald-400',
            error: 'text-rose-400',
            warning: 'text-amber-400',
            info: 'text-blue-400',
          };

          const icons = {
            success: <CheckCircle2 className={`w-4 h-4 shrink-0 ${iconColors.success}`} />,
            error: <AlertCircle className={`w-4 h-4 shrink-0 ${iconColors.error}`} />,
            warning: <AlertTriangle className={`w-4 h-4 shrink-0 ${iconColors.warning}`} />,
            info: <Info className={`w-4 h-4 shrink-0 ${iconColors.info}`} />,
          };

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg text-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${bgColors[toast.type]}`}
            >
              {icons[toast.type]}
              <div className="flex-1 min-w-0">
                {toast.title && <div className="font-semibold text-xs mb-0.5 tracking-wide uppercase opacity-90">{toast.title}</div>}
                <div className="text-xs leading-relaxed opacity-95">{toast.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded text-white"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
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
