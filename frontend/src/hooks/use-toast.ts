'use client';

import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`
            px-5 py-4 rounded-2xl shadow-xl text-sm font-medium animate-slide-up
            ${t.type === 'success' ? 'bg-emerald-500 text-black' : ''}
            ${t.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${t.type === 'info' ? 'bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text))]' : ''}
          `}
        >
          {t.type === 'success' && '✅ '}
          {t.type === 'error' && '❌ '}
          {t.type === 'info' && 'ℹ️ '}
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );

  return { toast, ToastContainer };
}
