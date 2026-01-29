
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Notification } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  notifications: Notification[];
  onMarkRead: () => void;
  onClear: () => void;
}

const NavItems = [
  { 
    label: 'Home', 
    path: '/', 
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  { 
    label: 'Schedule', 
    path: '/schedule', 
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  },
  { 
    label: 'Community', 
    path: '/community', 
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  { 
    label: 'Settings', 
    path: '/settings', 
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  },
];

const Layout: React.FC<LayoutProps> = ({ user, onLogout, notifications, onMarkRead, onClear }) => {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const isCurrent = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden font-inter">
      {/* Top Bar for Desktop */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[60] flex items-center gap-4">
        <button 
          onClick={() => setIsNotifOpen(true)}
          className="relative text-slate-400 hover:text-indigo-600 transition-all p-2 bg-white rounded-xl shadow-sm border border-slate-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 border-2 border-white rounded-full text-[7px] font-black text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
              ES
            </div>
            <div className="leading-tight">
              <span className="font-black text-xl text-slate-900 block">EduStream</span>
              <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{user.role === 'rep' ? 'COURSE REP' : 'STUDENT'}</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {NavItems.map((item) => {
            const active = isCurrent(item.path);
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon(active)}
                <span className="font-bold tracking-tight text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{user.name}</p>
              <button onClick={onLogout} className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:underline">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 pb-32 md:pb-8 relative">
        <div className="max-w-6xl mx-auto px-4 py-8 md:px-12 md:py-12">
          <Outlet />
        </div>
      </main>

      {/* Notifications Sidebar */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)} />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Alerts</h2>
              <button onClick={() => setIsNotifOpen(false)} className="text-slate-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-20 font-bold uppercase tracking-widest">No notifications</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-2xl border ${n.isRead ? 'bg-white border-slate-100' : 'bg-indigo-50 border-indigo-100'}`}>
                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{n.title}</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] z-[60]">
        <nav className="bg-white/95 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-2 flex justify-around items-center shadow-2xl ring-1 ring-black/5">
          {NavItems.map((item) => {
            const active = isCurrent(item.path);
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400'}`}
              >
                {item.icon(active)}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
