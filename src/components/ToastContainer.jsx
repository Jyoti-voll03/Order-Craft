import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className="pointer-events-auto bg-navy-900 text-white rounded-xl p-4 shadow-xl border border-slate-700/80 flex items-start gap-3 animate-toast"
          >
            <div
              className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isWarning
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isWarning ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold tracking-wide text-white">
                {t.title}
              </p>
              {t.description && (
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {t.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
