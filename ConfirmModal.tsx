
import React, { useMemo } from 'react';
import { Icons } from '../icons';
import { AppNotification } from '../types';

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

// Fixed: Moved NotificationItem outside and typed as React.FC to allow 'key' prop when mapping
const NotificationItem: React.FC<{ n: AppNotification }> = ({ n }) => (
  <div 
    className={`relative p-5 rounded-2xl border transition-all duration-500 animate-fade-in group ${
      n.is_read 
        ? 'bg-white/[0.02] border-white/[0.03] opacity-50' 
        : 'bg-white/[0.07] border-white/10 shadow-lg border-l-4 border-l-blue-500'
    }`}
  >
    {!n.is_read && (
      <span className="absolute top-5 right-5 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
    )}
    
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-1.5 h-1.5 rounded-full ${
        n.category === 'assignment' ? 'bg-rose-500' : 
        n.category === 'activity' ? 'bg-indigo-500' : 'bg-blue-500'
      }`} />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
        {n.category || 'System'}
      </span>
    </div>

    <h4 className={`text-sm font-bold leading-tight mb-2 tracking-tight ${n.is_read ? 'text-slate-400' : 'text-white'}`}>
      {n.title}
    </h4>
    
    <p className={`text-[11px] leading-relaxed font-medium mb-3 ${n.is_read ? 'text-slate-600' : 'text-slate-400'}`}>
      {n.message}
    </p>
    
    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.03]">
      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
        {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
      </span>
      {!n.is_read && (
        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          New Update
        </span>
      )}
    </div>
  </div>
);

export const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({ isOpen, onClose, notifications, onMarkAllRead }) => {
  const { unread, read } = useMemo(() => {
    return {
      unread: notifications.filter(n => !n.is_read),
      read: notifications.filter(n => n.is_read)
    };
  }, [notifications]);

  return (
    <div className={`fixed inset-0 z-[1100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0f1115] shadow-2xl transition-transform duration-500 cubic-bezier(0.2, 0, 0, 1) transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-white/10`}>
        
        <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-blue-500 shadow-inner">
              <Icons.Bell />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase">Signals</h3>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-0.5">Network Communications</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 text-slate-500 rounded-xl hover:text-white hover:bg-white/10 transition-all flex items-center justify-center border border-white/5 btn-feedback">
            <Icons.X />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {unread.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">New Arrivals</span>
                <button 
                  onClick={onMarkAllRead}
                  className="text-[9px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  Clear All <Icons.Refresh />
                </button>
              </div>
              <div className="space-y-3">
                {unread.map(n => <NotificationItem key={n.id} n={n} />)}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div className="space-y-4">
              <div className="px-1">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Archived Signals</span>
              </div>
              <div className="space-y-3">
                {read.map(n => <NotificationItem key={n.id} n={n} />)}
              </div>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-30">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-dashed border-white/20">
                <Icons.Bell />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">No Active Signals</h4>
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                The timeline is currently quiet. Institutional updates will manifest here.
              </p>
            </div>
          )}
        </div>

        <footer className="p-6 border-t border-white/5 bg-black/10 text-center">
          <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">Institutional Hub v1.0.4</p>
        </footer>
      </div>
    </div>
  );
};
