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
    label: 'Dashboard', 
    path: '/', 
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`}>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    )
  },
  { 
    label: 'Schedule', 
    path: '/schedule', 
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`}>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    )
  },
  { 
    label: 'Settings', 
    path: '/settings', 
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`}>
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
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Bar */}
      <div className="md:hidden glass-panel fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 border-b border-slate-200">
        <span className="font-bold text-lg tracking-tight">EduStream</span>
        <button onClick={() => setIsNotifOpen(true)} className="relative p-2 text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
        <div className="p-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-indigo-100 shadow-xl">E</div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900 leading-none">EduStream</h1>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 block">Pro Hub</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-6 space-y-1.5 mt-4">
          {NavItems.map((item) => {
            const active = isCurrent(item.path);
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-premium ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon(active)}
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-8">
          <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
            <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-200 object-cover shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <button onClick={onLogout} className="flex items-center gap-1.5 text-[10px] text-rose-500 font-bold uppercase tracking-wider hover:underline">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 pt-20 md:pt-0 pb-32 md:pb-0 custom-scrollbar">
        <div className="max-w-6xl mx-auto px-6 py-8 md:px-12 md:py-16">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] z-[60]">
        <nav className="glass-panel rounded-[2.5rem] p-2 flex justify-around items-center shadow-2xl border border-white/50">
          {NavItems.map((item) => {
            const active = isCurrent(item.path);
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center justify-center w-14 h-14 rounded-[2rem] transition-premium ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
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