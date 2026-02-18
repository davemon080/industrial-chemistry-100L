
import React, { useEffect } from 'react';
import { Icons } from '../icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500';

  return (
    <div className={`fixed bottom-6 md:bottom-8 left-4 right-4 md:left-auto md:right-8 z-[5000] flex items-center gap-3 px-4 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-white shadow-2xl animate-fade-in ${bgColor}`}>
      <div className="shrink-0 scale-90 md:scale-100">
        {type === 'success' ? <Icons.Check /> : type === 'error' ? <Icons.X /> : <Icons.Bell />}
      </div>
      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest flex-1">
        {message}
      </p>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity p-1">
        <Icons.X />
      </button>
    </div>
  );
};
