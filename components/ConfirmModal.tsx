
import React from 'react';
import { Icons } from '../icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={isLoading ? undefined : onClose} />
      <div className="relative bg-[#161a22] w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-fade-in border border-white/10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-rose-500/20">
          <div className="scale-125">
            {isLoading ? <Icons.Loader /> : <Icons.Trash />}
          </div>
        </div>
        
        <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">{title}</h3>
        
        <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10 px-4">
          {message}
        </p>
        
        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="w-full h-14 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-900/20 hover:bg-rose-700 disabled:opacity-50 transition-all btn-feedback flex items-center justify-center gap-3"
          >
            {isLoading ? <Icons.Loader /> : 'Confirm Purge'}
          </button>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="w-full h-14 bg-white/5 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all border border-white/5 disabled:opacity-30"
          >
            Cancel
          </button>
        </div>
        
        <p className="mt-8 text-[9px] font-bold text-slate-600 uppercase tracking-widest">Administrator Protocol Active</p>
      </div>
    </div>
  );
};
