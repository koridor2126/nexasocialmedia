import React from 'react';
import { useApp } from '../../context/AppContext.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastProps {
  message?: string;
  type?: 'success' | 'error' | 'info';
  isVisible?: boolean;
  onClose?: () => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {/* Render standalone prop-based toast if provided and visible */}
        {isVisible && message && (
          <motion.div
            key="standalone-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md ${
              type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-100/50'
                : type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-100/50'
                : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              {type !== 'success' && type !== 'error' && <Info className="w-5 h-5 text-indigo-600 shrink-0" />}
              <p className="text-xs sm:text-sm font-medium leading-snug truncate-2-lines">{message}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {/* Render context toasts */}
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md ${
                isSuccess
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-100/50'
                  : isError
                  ? 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-100/50'
                  : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-600 shrink-0" />}
                <p className="text-xs sm:text-sm font-medium leading-snug truncate-2-lines">{toast.message}</p>
              </div>
              <button
                id={`toast-close-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const Toast = ToastContainer;

