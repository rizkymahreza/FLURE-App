import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { FlureErrorCode } from '../types';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  code?: FlureErrorCode;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', code, onClose }) => {
  const getBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      default:
        return 'bg-white border-slate-200 text-slate-900';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-indigo-600 shrink-0" />;
    }
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 p-4 rounded-2xl border shadow-xl max-w-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${getBgColor()}`}
    >
      {getIcon()}
      <div className="flex-1 text-sm">
        {code && (
          <div className="font-mono text-xs font-semibold tracking-wider uppercase mb-1 opacity-80 text-slate-500">
            KODE: {code}
          </div>
        )}
        <div className="font-medium leading-relaxed">{message}</div>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-800 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
