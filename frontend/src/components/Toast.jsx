import { useState, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} className="text-terminal-green" />,
  error: <AlertCircle size={16} className="text-terminal-red" />,
  info: <Info size={16} className="text-terminal-accent" />,
};

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast flex items-start gap-3 p-3 rounded-lg border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
          }}
        >
          <span className="shrink-0 mt-0.5">{ICONS[toast.type]}</span>
          <p className="text-sm text-terminal-text flex-1 leading-snug">
            {toast.message}
          </p>
          <button
            onClick={() => onRemove(toast.id)}
            className="shrink-0 text-terminal-muted hover:text-terminal-text transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
