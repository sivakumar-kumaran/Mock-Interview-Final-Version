import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: <CheckCircle size={18} className="text-emerald-500 dark:text-emerald-400" />
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-300',
      icon: <AlertCircle size={18} className="text-rose-500 dark:text-rose-400" />
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-300',
      icon: <AlertTriangle size={18} className="text-amber-500 dark:text-amber-400" />
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      icon: <Info size={18} className="text-blue-500 dark:text-blue-400" />
    }
  };

  const style = styles[type] || styles.success;

  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border glass-panel shadow-premium-hover transition-all duration-300 animate-slide-up ${style.bg} ${style.text}`}>
      <div>{style.icon}</div>
      <p className="text-sm font-semibold pr-2 leading-tight">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
