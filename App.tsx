
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { sql, pool } from './db';
import { appCache } from './cache';
import { User, Schedule, AppView, AppNotification } from './types';
import { Icons } from './icons';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminPortal } from './pages/AdminPortal';
import { DocViewer } from './components/DocViewer';
import { NotificationsSidebar } from './components/NotificationsSidebar';
import { Toast, ToastType } from './components/Toast';

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const processSchedules = (scheds: any[]) => {
    return scheds.map((s: any) => {
      let dateVal = s.date;
      if (dateVal instanceof Date) {
        const y = dateVal.getUTCFullYear();
        const m = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateVal.getUTCDate()).padStart(2, '0');
        dateVal = `${y}-${m}-${d}`;
      } else if (typeof dateVal === 'string') {
        dateVal = dateVal.split('T')[0];
      }
      return {
        id: s.id,
        category: s.category,
        course: s.course,
        title: s.title,
        date: dateVal || '',
        time: s.time || '00:00',
        type: s.type,
        location: s.location,
        instructions: s.instructions,
        createdAt: Number(s.created_at_timestamp || Date.now()),
        attachment: s.attachment,
        attachmentType: s.attachment_type,
        attachmentName: s.attachment_name
      } as any;
    });
  };

  const fetchAllData = useCallback(async () => {
    const email = localStorage.getItem('class_sync_session_email');
    setIsRefreshing(true);
    
    try {
      const fetchPromises: Promise<any>[] = [
        sql`SELECT id, category, course, title, date, time, type, location, instructions, attachment_name, attachment_type, created_at_timestamp, attachment FROM schedules ORDER BY date ASC, time ASC`,
        sql`SELECT course_code, icon_data FROM custom_icons`
      ];

      if (email) {
        fetchPromises.push(sql`SELECT id, title, message, category, is_read, created_at FROM notifications WHERE user_email = ${email} ORDER BY created_at DESC LIMIT 50`);
        fetchPromises.push(sql`SELECT COUNT(*) FROM notifications WHERE user_email = ${email} AND is_read = FALSE`);
      }

      const results = await Promise.all(fetchPromises);
      
      const processed = processSchedules(results[0]);
      setSchedules(processed);
      appCache.set('schedules', processed, 60000);

      const iconMap: Record<string, string> = {};
      results[1].forEach((i: any) => { if (i.course_code) iconMap[i.course_code] = i.icon_data; });
      setCustomIcons(iconMap);
      appCache.set('custom_icons', results[1], 300000);

      if (email && results[2]) {
        setNotifications(results[2] as AppNotification[]);
        appCache.set(`notifs_${email}`, results[2], 10000);
        setUnreadCount(parseInt(results[3][0]?.count || "0"));
      }
    } catch (e) {
      console.error("Fetch Error:", e);
      showToast("Sync Error: Institutional Network unstable.", "error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const email = localStorage.getItem('class_sync_session_email');
    if (!email) return;

    const interval = setInterval(() => {
      sql`SELECT COUNT(*) FROM notifications WHERE user_email = ${email} AND is_read = FALSE`.then(res => {
        const count = parseInt(res[0]?.count || "0");
        if (count !== unreadCount) {
          setUnreadCount(count);
          if (isNotificationsOpen || currentView === 'dashboard') {
            sql`SELECT id, title, message, category, is_read, created_at FROM notifications WHERE user_email = ${email} ORDER BY created_at DESC LIMIT 50`.then(notifs => {
              setNotifications(notifs as AppNotification[]);
              appCache.set(`notifs_${email}`, notifs, 10000);
            });
          }
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [unreadCount, isNotificationsOpen, currentView]);

  useEffect(() => {
    const initApp = async () => {
      const email = localStorage.getItem('class_sync_session_email');
      
      const cachedSchedules = appCache.get<Schedule[]>('schedules');
      const cachedIcons = appCache.get<any[]>('custom_icons');
      const cachedUser = email ? appCache.get<User>(`user_${email}`) : null;

      if (cachedSchedules) setSchedules(cachedSchedules);
      if (cachedIcons) {
        const iconMap: Record<string, string> = {};
        cachedIcons.forEach(i => { if (i.course_code) iconMap[i.course_code] = i.icon_data; });
        setCustomIcons(iconMap);
      }
      if (cachedUser) {
        setCurrentUser(cachedUser);
        if (cachedUser.is_admin) setIsAdmin(true);
      }

      if (cachedSchedules || !email) {
        setIsInitializing(false);
      }

      if (email) {
        try {
          const [user] = await sql`SELECT email, name, is_admin FROM users WHERE email = ${email} LIMIT 1`;
          if (user) {
            const userData = { ...user, is_admin: !!user.is_admin } as any;
            setCurrentUser(userData);
            appCache.set(`user_${email}`, userData, 3600000);
            if (user.is_admin) setIsAdmin(true);
            if (currentView === 'login' || currentView === 'signup') setCurrentView('dashboard');
          } else if (email === 'admin@gmail.com') {
            setIsAdmin(true);
            if (currentView === 'login' || currentView === 'signup') setCurrentView('dashboard');
          } else if (!cachedUser) {
            setCurrentView('login');
          }
        } catch (e) {
          if (!cachedUser) setCurrentView('login');
        }
      } else {
        setCurrentView('login');
      }

      setIsInitializing(false);
      fetchAllData();
    };

    initApp();
  }, [fetchAllData]);

  const handleSignOut = () => {
    localStorage.removeItem('class_sync_session_email');
    appCache.clear();
    setCurrentUser(null);
    setIsAdmin(false);
    setCurrentView('login');
    setIsMenuOpen(false);
    showToast("Session Terminated", "info");
  };

  const markAllNotificationsAsRead = async () => {
    const email = localStorage.getItem('class_sync_session_email');
    if (!email) return;
    
    setUnreadCount(0);
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, is_read: true }));
      appCache.set(`notifs_${email}`, updated, 10000);
      return updated;
    });

    try {
      await sql`UPDATE notifications SET is_read = TRUE WHERE user_email = ${email} AND is_read = FALSE`;
    } catch (e) {
      console.error("Mark Read Error:", e);
    }
  };

  const isAuth = !!(currentUser || isAdmin);

  if (isInitializing) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1115]">
       <div className="w-16 h-16 ai-gradient-bg rounded-[1.2rem] flex items-center justify-center text-white shadow-2xl animate-pulse">
         <Icons.Calendar />
       </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative pb-8">
      {isRefreshing && (
        <div className="fixed top-0 left-0 w-full h-1 z-[2000] overflow-hidden opacity-50">
          <div className="h-full ai-gradient-bg skeleton"></div>
        </div>
      )}

      {isAuth && (
        <div className="max-w-[1440px] w-full mx-auto px-6 pt-8 md:pt-12 flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
            <div className="w-12 h-12 bg-white/5 rounded-[12px] border border-white/10 flex items-center justify-center text-white shadow-sm transition-all group-hover:bg-white/10">
              <Icons.Calendar />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">100L ICH</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Institutional Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setIsNotificationsOpen(true); if (unreadCount > 0) markAllNotificationsAsRead(); }} 
              className="relative w-12 h-12 flex items-center justify-center rounded-[12px] bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all btn-feedback"
            >
              <Icons.Bell />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full ring-2 ring-[#0f1115] flex items-center justify-center text-[9px] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-[12px] bg-white text-black hover:bg-slate-200 transition-all shadow-sm btn-feedback">
              <Icons.Menu />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6">
        {!isAuth ? (
          <div className="flex flex-col flex-1">
            {currentView === 'login' && <Login setCurrentUser={setCurrentUser} setIsAdmin={setIsAdmin} setCurrentView={setCurrentView} />}
            {currentView === 'signup' && <Signup setCurrentUser={setCurrentUser} setCurrentView={setCurrentView} />}
          </div>
        ) : (
          <div className="animate-fade-in">
            {currentView === 'dashboard' && (
              <Dashboard 
                schedules={schedules} 
                isAdmin={isAdmin} 
                customIcons={customIcons} 
                fetchAllData={fetchAllData} 
                setViewingDoc={setViewingDoc}
                onEditRequest={(s) => {
                  setEditingSchedule(s);
                  setCurrentView('admin_portal');
                }}
                showToast={showToast}
              />
            )}
            {currentView === 'history' && (
              <History 
                schedules={schedules} 
                isAdmin={isAdmin} 
                customIcons={customIcons} 
                fetchAllData={fetchAllData} 
                setViewingDoc={setViewingDoc}
                onEditRequest={(s) => {
                  setEditingSchedule(s);
                  setCurrentView('admin_portal');
                }}
                showToast={showToast}
              />
            )}
            {currentView === 'profile' && currentUser && <Profile currentUser={currentUser} setCurrentUser={setCurrentUser} />}
            {currentView === 'admin_portal' && isAdmin && (
              <AdminPortal 
                customIcons={customIcons} 
                setCustomIcons={setCustomIcons} 
                fetchAllData={fetchAllData} 
                setCurrentView={setCurrentView}
                editingSchedule={editingSchedule}
                setEditingSchedule={setEditingSchedule}
                showToast={showToast}
              />
            )}
          </div>
        )}
      </main>

      {/* Responsive Menu Panel */}
      <div className={`fixed inset-0 z-[1000] transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} />
        <div className={`absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[#161a22] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-white/10`}>
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 ai-gradient-bg rounded-[8px] flex items-center justify-center text-white"><Icons.Shield /></div>
              <span className="text-sm font-bold tracking-tight text-white">System Command</span>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-[12px] text-slate-400 hover:text-white transition-all">
              <Icons.X />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-2 overflow-y-auto">
            <button onClick={() => { setCurrentView('dashboard'); setIsMenuOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-[12px] text-xs font-bold transition-all ${currentView === 'dashboard' ? 'bg-white text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <Icons.Calendar />
              <span className="uppercase tracking-widest text-[9px] font-black">Timeline</span>
            </button>
            <button onClick={() => { setCurrentView('history'); setIsMenuOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-[12px] text-xs font-bold transition-all ${currentView === 'history' ? 'bg-white text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <Icons.History />
              <span className="uppercase tracking-widest text-[9px] font-black">History Archive</span>
            </button>
            {isAdmin ? (
              <button onClick={() => { setCurrentView('admin_portal'); setIsMenuOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-[12px] text-xs font-bold transition-all ${currentView === 'admin_portal' ? 'bg-white text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icons.Shield />
                <span className="uppercase tracking-widest text-[9px] font-black">Admin Terminal</span>
              </button>
            ) : (
              <button onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }} className={`flex items-center gap-4 w-full p-4 rounded-[12px] text-xs font-bold transition-all ${currentView === 'profile' ? 'bg-white text-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icons.Shield />
                <span className="uppercase tracking-widest text-[9px] font-black">Identity</span>
              </button>
            )}
          </div>
          <div className="p-8 border-t border-white/5 bg-black/20">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-white/10 rounded-[12px] flex items-center justify-center text-white font-bold text-lg border border-white/10 shrink-0">{currentUser?.name.charAt(0) || 'A'}</div>
               <div className="min-w-0">
                 <p className="text-sm font-bold text-white truncate tracking-tight">{currentUser?.name || 'Academic'}</p>
                 <p className="text-[10px] font-black text-slate-500 truncate uppercase tracking-widest">{currentUser?.email || 'Student'}</p>
               </div>
             </div>
             <button onClick={handleSignOut} className="w-full h-12 bg-white/5 border border-white/10 text-rose-500 rounded-[12px] text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2 btn-feedback">
               <Icons.X /> Terminate Session
             </button>
          </div>
        </div>
      </div>

      <DocViewer viewingDoc={viewingDoc} setViewingDoc={setViewingDoc} />
      <NotificationsSidebar isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onMarkAllRead={markAllNotificationsAsRead} />
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};
