import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeToasts } from '../utils/toast';

const variantStyles = {
  error: {
    wrapper: 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]',
    iconColor: 'text-[#dc2626]',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
      </svg>
    ),
  },
  success: {
    wrapper: 'bg-[#f0fdf4] border-[#bbf7d0] text-[#14532d]',
    iconColor: 'text-[#16a34a]',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  info: {
    wrapper: 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e3a8a]',
    iconColor: 'text-[#2563eb]',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToasts((toast) => {
      setToasts(prev => [...prev, toast]);
      if (toast.duration > 0) {
        timersRef.current[toast.id] = setTimeout(() => dismiss(toast.id), toast.duration);
      }
    });
    const timers = timersRef.current;
    return () => {
      unsubscribe();
      Object.values(timers).forEach(clearTimeout);
    };
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
      {toasts.map(t => {
        const style = variantStyles[t.variant] || variantStyles.info;
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto ${style.wrapper} border rounded-lg shadow-lg p-4 font-['Onest'] text-sm flex items-start gap-3`}
          >
            <span className={`shrink-0 mt-0.5 ${style.iconColor}`}>{style.icon}</span>
            <span className="flex-1 break-words">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
