import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// Declare Paystack for TypeScript
declare var PaystackPop: any;

// --- Types & Constants ---

type CourseCode = 'math101' | 'chm101' | 'chm107' | 'phy101' | 'phy107' | 'bio101' | 'bio107' | 'gst111' | 'cos101';
type ClassType = 'Physical' | 'Online';
type ViewMode = 'list' | 'calendar';
type AppView = 'dashboard' | 'profile' | 'login' | 'signup' | 'subscription' | 'admin_portal' | 'guide';
type ScheduleCategory = 'class' | 'assignment' | 'activity';

interface User {
  email: string;
  name: string;
  isSubscribed: boolean;
  expiryDate?: number;
  lastCheckedNotifications?: number;
  activeSessionId?: string; // Used to prevent multiple device logins
}

interface Schedule {
  id: string;
  category: ScheduleCategory;
  course?: CourseCode; 
  title?: string; 
  date: string; 
  givenDate?: string; 
  time: string; // Stored in 24h format HH:mm
  type: ClassType;
  location: string; 
  instructions: string;
  createdAt: number;
  attachment?: string; 
  attachmentType?: string;
  attachmentName?: string;
}

interface GuidePost {
  id: string;
  title: string;
  content: string;
  link?: string;
  attachment?: string;
  attachmentType?: string;
  attachmentName?: string;
  createdAt: number;
}

const COURSES: Record<CourseCode, string> = {
  math101: "General Mathematics I",
  chm101: "General Chemistry I",
  chm107: "Practical Chemistry I",
  phy101: "General Physics I",
  phy107: "Practical Physics I",
  bio101: "General Biology I",
  bio107: "Practical Biology I",
  gst111: "Communication in English I",
  cos101: "Introduction to Computer Science"
};

const PAYSTACK_PUBLIC_KEY = "pk_live_1bc5a10e4f9ed8ca685c5a699e85f22741cc3759";
const SUBSCRIPTION_PERIOD_DAYS = 31;

const ADMIN_CREDENTIALS = { username: 'admin@gmail.com', password: '1234' };
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

// Generate a unique ID for this specific browser session instance
const CURRENT_APP_SESSION_ID = Math.random().toString(36).substring(2, 15);

// --- Icons Component Set ---

const Icons = {
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ExternalLink: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  CreditCard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Terminal: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Loader: () => <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Clipboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
  File: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  AlertTriangle: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  BookOpen: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

// --- Helpers ---

const formatTo12Hr = (time24: string): string => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours);
  const m = minutes;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; 
  return `${h}:${m} ${ampm}`;
};

const getStatusInfo = (dateStr: string, timeStr: string) => {
  const now = new Date();
  const classTime = new Date(`${dateStr}T${timeStr}`);
  const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const classNormalized = new Date(classTime.getFullYear(), classTime.getMonth(), classTime.getDate());
  const diffTime = classNormalized.getTime() - todayNormalized.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = (classTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 0 && diffHours > -2) return { label: 'Live Now', color: 'bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-200' };
  if (diffHours <= -2) return { label: 'Past', color: 'bg-slate-100 text-slate-400 border-slate-200' };
  if (diffHours > 0 && diffHours < 1 && diffDays === 0) return { label: 'Starting Soon', color: 'bg-amber-500 text-white shadow-sm shadow-amber-200' };
  if (diffDays === 0) return { label: 'Today', color: 'bg-emerald-500 text-white shadow-sm shadow-emerald-100' };
  if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-indigo-500 text-white shadow-sm shadow-indigo-100' };
  return null;
};

const formatDateLocal = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- Custom Components ---

const DatePicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
  darkMode?: boolean;
  label?: string;
}> = ({ value, onChange, darkMode = false, label = "Select Date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: startDay }, (_, i) => null);

  const handleDateSelect = (day: number) => {
    const selected = new Date(year, month, day);
    const dateStr = formatDateLocal(selected);
    onChange(dateStr);
    setIsOpen(false);
  };

  const formattedDate = value ? new Date(value + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : label;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-16 px-6 rounded-[1.2rem] font-bold text-left text-base flex items-center justify-between border transition-all ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        } focus:ring-2 focus:ring-indigo-500 outline-none`}
      >
        <span className={!value ? 'text-slate-500' : ''}>{formattedDate}</span>
        <div className="text-indigo-500"><Icons.Calendar /></div>
      </button>

      {isOpen && (
        <div className={`absolute left-0 top-[105%] z-[110] w-full sm:w-[320px] rounded-[2rem] p-6 shadow-2xl animate-fade-in border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white shadow-indigo-900/10' : 'bg-white border-slate-100 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-sm uppercase tracking-widest">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)}</h4>
            <div className="flex gap-1">
              <button type="button" onClick={() => setViewDate(new Date(year, month - 1))} className={`p-2 rounded-xl transition-all border ${darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-50 hover:bg-slate-50'}`}><Icons.ChevronLeft /></button>
              <button type="button" onClick={() => setViewDate(new Date(year, month + 1))} className={`p-2 rounded-xl transition-all border ${darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-50 hover:bg-slate-50'}`}><Icons.ChevronRight /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 opacity-50">{d}</div>
            ))}
            {[...padding, ...days].map((day, idx) => {
              if (!day) return <div key={`p-${idx}`} />;
              const isSelected = value === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <button key={idx} type="button" onClick={() => handleDateSelect(day)} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-indigo-600 text-white' : darkMode ? 'hover:bg-slate-800' : 'hover:bg-indigo-50 text-slate-600'}`}>{day}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirm", isDanger = true }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 ${isDanger ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
          <Icons.AlertTriangle />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">{message}</p>
        <div className="flex flex-col gap-3 w-full">
           <button onClick={onConfirm} className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${isDanger ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>
             {confirmLabel}
           </button>
           <button onClick={onClose} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:bg-slate-50 transition-all border border-slate-100">
             Cancel
           </button>
        </div>
      </div>
    </div>
  );
};

const DocViewer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  attachment: string;
  type: string;
  name: string;
}> = ({ isOpen, onClose, attachment, type, name }) => {
  if (!isOpen) return null;
  const isPdf = type.includes('pdf');
  const isImage = type.includes('image');

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-12 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-white w-full max-w-6xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        <header className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Icons.File /></div>
             <div>
               <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none line-clamp-1">{name}</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Resource Viewer</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all"><Icons.X /></button>
        </header>
        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4">
           {isPdf ? (
             <embed src={attachment} type="application/pdf" className="w-full h-full rounded-2xl" />
           ) : isImage ? (
             <div className="w-full h-full flex items-center justify-center">
               <img src={attachment} alt={name} className="max-w-full max-h-full object-contain rounded-2xl shadow-lg" />
             </div>
           ) : (
             <div className="text-center p-12">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm"><Icons.File /></div>
                <h4 className="text-xl font-black text-slate-900">Format not viewable</h4>
                <p className="text-slate-400 font-medium mt-2">This file type is supported for download but cannot be previewed in-browser.</p>
                <a href={attachment} download={name} className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Download File</a>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const NotificationsSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  lastChecked: number;
  onViewDate: (date: string) => void;
}> = ({ isOpen, onClose, schedules, lastChecked, onViewDate }) => {
  const sorted = [...schedules].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <div 
        className={`fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div className={`fixed right-0 top-0 bottom-0 z-[1001] w-full max-w-md bg-white shadow-2xl transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Updates</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Notification Center</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-all">
            <Icons.X />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {sorted.length === 0 ? (
            <div className="text-center py-20">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 shadow-sm"><Icons.Bell /></div>
               <p className="text-sm font-bold text-slate-400">No new notifications.</p>
            </div>
          ) : (
            sorted.map(s => {
              const isNew = s.createdAt > lastChecked;
              const displayTitle = s.category === 'activity' ? s.title : (s.course ? COURSES[s.course] : 'General Update');
              return (
                <button 
                  key={s.id} 
                  onClick={() => { onViewDate(s.date); onClose(); }}
                  className={`w-full text-left p-5 rounded-3xl border transition-all relative group ${isNew ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-100/20' : 'bg-white/50 border-slate-100 opacity-70'}`}
                >
                  {isNew && <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      s.category === 'assignment' ? 'bg-rose-50 text-rose-600' : 
                      s.category === 'activity' ? 'bg-violet-50 text-violet-600' : 
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {s.category}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">{displayTitle}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{s.instructions || `A new ${s.category} has been scheduled for ${s.date} at ${formatTo12Hr(s.time)}`}</p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

// --- Sub-Components ---

const CourseIcon: React.FC<{ code?: CourseCode; category: ScheduleCategory; customIcons: Record<string, string>; size?: string }> = ({ code, category, customIcons, size = "h-10 w-10" }) => {
  if (category === 'activity') return (
     <div className={`${size} bg-violet-600 text-white rounded-xl flex items-center justify-center p-2 shadow-lg shadow-violet-100`}>
        <Icons.Star />
     </div>
  );
  
  const custom = code ? customIcons[code] : null;
  if (custom) return <img src={custom} alt={code} className={`${size} object-cover rounded-xl ring-1 ring-slate-100 shadow-sm`} />;
  return (
    <div className={`${size} bg-slate-50 border border-slate-100 text-indigo-600 rounded-xl flex items-center justify-center p-2 shadow-sm`}>
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </div>
  );
};

const ScheduleCard: React.FC<{ 
  schedule: Schedule; 
  isAdmin: boolean; 
  onDeleteClick: (id: string) => void; 
  onEdit: (schedule: Schedule) => void;
  onViewDoc: (s: Schedule) => void;
  customIcons: Record<string, string>;
  isSubscribed: boolean;
  expiryDate?: number;
}> = ({ schedule, isAdmin, onDeleteClick, onEdit, onViewDoc, customIcons, isSubscribed, expiryDate }) => {
  const isOnline = schedule.type === 'Online';
  const isAssignment = schedule.category === 'assignment';
  const isActivity = schedule.category === 'activity';
  const status = getStatusInfo(schedule.date, schedule.time);
  
  const isAccessRevoked = !isAdmin && (!isSubscribed || (expiryDate && expiryDate < Date.now()));

  if (isAccessRevoked) return (
    <div className="bg-slate-100/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 opacity-70 filter blur-[1.5px] min-h-[400px]">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300"><Icons.Lock /></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Content Locked</p>
      <button onClick={() => window.location.hash = '#subscription'} className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Upgrade to View</button>
    </div>
  );
  
  const themeClass = isAssignment ? 'border-l-rose-500 shadow-rose-900/5' : isActivity ? 'border-l-violet-500 shadow-violet-900/5' : 'border-l-emerald-500 shadow-emerald-900/5';
  const accentBg = isAssignment ? 'bg-rose-50' : isActivity ? 'bg-violet-50' : 'bg-emerald-50';
  const accentText = isAssignment ? 'text-rose-600' : isActivity ? 'text-violet-600' : 'text-emerald-600';
  const accentBorder = isAssignment ? 'border-rose-100' : isActivity ? 'border-violet-100' : 'border-emerald-100';

  const displayTitle = isActivity ? schedule.title : (schedule.course ? COURSES[schedule.course] : 'Untitled Session');

  return (
    <div className={`group relative bg-white rounded-[2.5rem] border-l-[6px] border border-slate-100 transition-all duration-500 animate-fade-in flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] ${themeClass}`}>
      <div className="p-6 flex justify-between items-start pb-4">
        <div className="flex flex-wrap gap-2">
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${accentBg} ${accentText} ${accentBorder}`}>
            {isAssignment ? 'Assignment' : isActivity ? 'Other Activity' : 'Class Session'}
          </div>
          {status && <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color}`}>{status.label}</div>}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(schedule)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Icons.Edit /></button>
            <button onClick={() => onDeleteClick(schedule.id)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Icons.Trash /></button>
          </div>
        )}
      </div>

      <div className="px-6 flex items-center gap-4 mb-6">
        <CourseIcon code={schedule.course} category={schedule.category} customIcons={customIcons} size="h-12 w-12" />
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 text-lg leading-tight truncate tracking-tight">{displayTitle}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{isActivity ? 'Event Details' : schedule.course}</p>
        </div>
      </div>

      <div className="px-6 space-y-3 mb-6 flex-grow">
        <div className={`p-4 rounded-2xl flex items-center gap-4 border ${accentBg} ${accentBorder}`}>
           <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${accentText}`}>
              {isAssignment ? <Icons.Clipboard /> : isActivity ? <Icons.Star /> : <Icons.Calendar />}
           </div>
           <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{isAssignment ? 'Due Date' : isActivity ? 'Activity Date' : 'Schedule'}</p>
              <p className="text-sm font-black text-slate-800">{new Date(schedule.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {formatTo12Hr(schedule.time)}</p>
           </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{isAssignment ? 'Submission Location' : 'Venue'}</p>
           {isOnline ? (
             <a href={schedule.location} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95">
                Join Online Class <Icons.ExternalLink />
             </a>
           ) : (
             <div className="flex items-center gap-2 text-slate-700">
                <div className={`w-1.5 h-1.5 rounded-full ${accentBg} border ${accentBorder} animate-pulse`} />
                <p className="text-xs font-bold leading-tight">{schedule.location}</p>
             </div>
           )}
        </div>

        {schedule.attachment && (
          <button onClick={() => onViewDoc(schedule)} className="w-full group/file flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300">
             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover/file:bg-indigo-600 group-hover/file:text-white transition-all"><Icons.File /></div>
             <div className="text-left flex-1 min-w-0">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Attached Resource</p>
                <p className="text-[11px] font-bold text-slate-700 truncate group-hover/file:text-indigo-700">{schedule.attachmentName || 'Resource_File'}</p>
             </div>
             <Icons.ChevronRight />
          </button>
        )}

        {schedule.instructions && (
          <div className="mt-4 flex items-start gap-3">
             <span className="text-indigo-400 mt-0.5"><Icons.Plus /></span>
             <p className="text-xs text-slate-500 font-medium italic leading-relaxed line-clamp-3 group-hover:line-clamp-none">
                {schedule.instructions}
             </p>
          </div>
        )}
      </div>

      <div className="px-6 py-5 mt-auto border-t border-slate-50 bg-slate-50/30 rounded-b-[2rem] flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{isOnline ? 'Remote' : 'Physical'}</p>
         </div>
         <span className="text-[9px] font-bold text-slate-300 uppercase">ID: {schedule.id.slice(0, 5)}</span>
      </div>
    </div>
  );
};

// --- Calendar View Component ---

const CalendarView: React.FC<{ 
  schedules: Schedule[]; 
  selectedDate: string; 
  onDateSelect: (date: string) => void;
}> = ({ schedules, selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth(); 
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate(); 
  const startDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1); 
  const padding = Array.from({ length: startDay }, (_, i) => null);
  
  const scheduleMap = useMemo(() => { 
    const map: Record<string, Schedule[]> = {}; 
    schedules.forEach(s => { 
      if (!map[s.date]) map[s.date] = []; 
      map[s.date].push(s); 
    }); 
    return map; 
  }, [schedules]);

  return (
    <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-12 border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-6">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200/50"><Icons.ChevronLeft /></button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200/50"><Icons.ChevronRight /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest pb-4 sm:pb-6">{d}</div>)}
        {[...padding, ...days].map((day, idx) => {
          if (!day) return <div key={`p-${idx}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr; 
          const count = scheduleMap[dateStr]?.length || 0; 
          const hasClasses = count > 0;
          return (
            <button key={dateStr} onClick={() => onDateSelect(dateStr)} className={`relative group aspect-square rounded-[1rem] sm:rounded-[1.5rem] flex flex-col items-center justify-center transition-all border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-110 z-10' : 'bg-white border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/20 shadow-sm'}`}>
              <span className="text-sm sm:text-base font-black">{day}</span>
              {hasClasses && <div className={`mt-1 sm:mt-2 flex items-center justify-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[8px] font-black tracking-tight leading-none min-w-[16px] sm:min-w-[20px] ${isSelected ? 'bg-white/20 text-white border border-white/20' : 'bg-indigo-600 text-white border border-indigo-500 shadow-lg shadow-indigo-100'}`}>{count}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- App Component ---

const App: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [guidePosts, setGuidePosts] = useState<GuidePost[]>([]);
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Physical' | 'Online'>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string | 'All'>('All');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [viewingDoc, setViewingDoc] = useState<Schedule | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteGuideId, setConfirmDeleteGuideId] = useState<string | null>(null);
  
  const [lastCheckedNotifications, setLastCheckedNotifications] = useState<number>(0);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

  // Search enhancement states
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Password Change States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Guide creation state
  const [guideTitle, setGuideTitle] = useState('');
  const [guideContent, setGuideContent] = useState('');
  const [guideLink, setGuideLink] = useState('');
  const [guideAttachment, setGuideAttachment] = useState<{ data: string, type: string, name: string } | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideSearchQuery, setGuideSearchQuery] = useState('');

  // Admin Portal States
  const [adminTab, setAdminTab] = useState<'create' | 'icons'>('create');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [newCategory, setNewCategory] = useState<ScheduleCategory>('class');
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState<CourseCode>('math101');
  const [newDate, setNewDate] = useState(''); 
  const [newGivenDate, setNewGivenDate] = useState(''); 
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<ClassType>('Physical');
  const [newLoc, setNewLoc] = useState('');
  const [newInst, setNewInst] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentData, setAttachmentData] = useState<{ data: string, type: string, name: string } | null>(null);

  useEffect(() => {
    const s = localStorage.getItem('class_sync_schedules');
    if (s) setSchedules(JSON.parse(s));
    const g = localStorage.getItem('class_sync_guide_posts');
    if (g) setGuidePosts(JSON.parse(g));
    const i = localStorage.getItem('class_sync_icons');
    if (i) setCustomIcons(JSON.parse(i));
    const u = localStorage.getItem('class_sync_current_user');
    if (u) {
      const parsed = JSON.parse(u);
      setCurrentUser(parsed);
      setLastCheckedNotifications(parsed.lastCheckedNotifications || 0);
    }

    const handleClickOutsideSearch = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, [isAdmin]);

  // Session check effect: Ensures that if another login happens elsewhere, current session is logged out
  useEffect(() => {
    if (!currentUser) return;
    
    const checkSession = () => {
      const users = JSON.parse(localStorage.getItem('class_sync_users') || '[]');
      const dbUser = users.find((u: User) => u.email === currentUser.email);
      
      if (dbUser && dbUser.activeSessionId && dbUser.activeSessionId !== CURRENT_APP_SESSION_ID) {
        alert("Your account has been logged in on another device. You will now be redirected to the login page.");
        handleSignOut();
      }
    };

    const interval = setInterval(checkSession, 3000);
    window.addEventListener('storage', checkSession); // Trigger on localstorage changes from other tabs
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkSession);
    };
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('class_sync_schedules', JSON.stringify(schedules));
    localStorage.setItem('class_sync_guide_posts', JSON.stringify(guidePosts));
    localStorage.setItem('class_sync_icons', JSON.stringify(customIcons));
    if (currentUser) {
      const u = { ...currentUser, lastCheckedNotifications };
      localStorage.setItem('class_sync_current_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('class_sync_current_user');
    }
  }, [schedules, guidePosts, customIcons, currentUser, lastCheckedNotifications]);

  useEffect(() => {
    if (editingSchedule) {
      setNewCategory(editingSchedule.category);
      setNewTitle(editingSchedule.title || '');
      setNewCourse(editingSchedule.course || 'math101'); 
      setNewDate(editingSchedule.date); 
      setNewGivenDate(editingSchedule.givenDate || '');
      setNewTime(editingSchedule.time);
      setNewType(editingSchedule.type); 
      setNewLoc(editingSchedule.location); 
      setNewInst(editingSchedule.instructions);
      setAdminTab('create'); 
      setCurrentView('admin_portal'); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingSchedule]);

  const timelineDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(formatDateLocal(d));
    }
    return dates;
  }, []);

  const activeDates = useMemo(() => new Set(schedules.map(s => s.date)), [schedules]);
  
  const unreadCount = useMemo(() => {
    if (!currentUser && !isAdmin) return 0;
    const refDate = lastCheckedNotifications;
    return schedules.filter(s => s.createdAt > refDate).length;
  }, [schedules, lastCheckedNotifications, currentUser, isAdmin]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) {
      setLastCheckedNotifications(Date.now());
    }
  };

  const scrollToPost = (id: string) => {
    const element = document.getElementById(`post-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsSearchFocused(false);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('class_sync_users') || '[]');
    if (users.find((u: any) => u.email === authEmail)) { setAuthError('This email address is already registered.'); return; }
    
    // Auto-login after signup with current session ID
    const newUser: User = { 
      email: authEmail, 
      name: authName, 
      isSubscribed: false, 
      lastCheckedNotifications: Date.now(),
      activeSessionId: CURRENT_APP_SESSION_ID
    };
    
    localStorage.setItem('class_sync_users', JSON.stringify([...users, { ...newUser, password: authPassword }]));
    setCurrentUser(newUser); 
    setLastCheckedNotifications(newUser.lastCheckedNotifications || 0);
    setCurrentView('dashboard'); 
    setIsMenuOpen(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('class_sync_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === authEmail && u.password === authPassword);
    
    if (userIndex !== -1) {
      const user = users[userIndex];
      
      // Update active session ID in "database"
      users[userIndex].activeSessionId = CURRENT_APP_SESSION_ID;
      localStorage.setItem('class_sync_users', JSON.stringify(users));
      
      const { password, ...safeUser } = users[userIndex]; 
      setCurrentUser(safeUser); 
      setLastCheckedNotifications(safeUser.lastCheckedNotifications || Date.now());
      setCurrentView('dashboard'); 
      setIsMenuOpen(false); 
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Please check your email and password.');
    }
  };

  const handleSignOut = () => {
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('class_sync_users') || '[]');
      const userIndex = users.findIndex((u: User) => u.email === currentUser.email);
      if (userIndex !== -1) {
        users[userIndex].activeSessionId = undefined; // Clear session on server/DB
        localStorage.setItem('class_sync_users', JSON.stringify(users));
      }
    }
    setCurrentUser(null);
    setIsAdmin(false);
    setCurrentView('login');
    setIsMenuOpen(false);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (newPassword !== confirmPassword) { setPwdError('New passwords do not match.'); return; }
    const users = JSON.parse(localStorage.getItem('class_sync_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === currentUser?.email);
    if (userIndex === -1 || users[userIndex].password !== oldPassword) {
      setPwdError('Current password provided is incorrect.');
      return;
    }
    users[userIndex].password = newPassword;
    localStorage.setItem('class_sync_users', JSON.stringify(users));
    setPwdSuccess('Password updated successfully.');
    setOldPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const handleSubscription = () => {
    if (!currentUser) return;
    
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: currentUser.email,
      amount: 300 * 100, // Monthly Subscription Price: 300 Naira
      currency: "NGN",
      ref: 'SYNC_' + Math.floor((Math.random() * 1000000000) + 1),
      callback: (response: any) => {
        if (response.status === "success") {
          const startTime = Date.now();
          const expiryTime = startTime + (SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000);
          
          const updatedUser = { ...currentUser, isSubscribed: true, expiryDate: expiryTime };
          setCurrentUser(updatedUser);
          
          const users = JSON.parse(localStorage.getItem('class_sync_users') || '[]');
          const userIndex = users.findIndex((u: any) => u.email === currentUser.email);
          if (userIndex !== -1) {
            users[userIndex].isSubscribed = true;
            users[userIndex].expiryDate = expiryTime;
            localStorage.setItem('class_sync_users', JSON.stringify(users));
          }
          setCurrentView('profile');
        } else {
          alert("Payment was not successful. Please try again.");
        }
      },
      onClose: () => {
        console.log("Paystack payment window closed.");
      }
    });
    handler.openIframe();
  };

  const getSubscriptionTimeLeft = (expiryDate?: number) => {
    if (!expiryDate) return null;
    const now = Date.now();
    const diff = expiryDate - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isExpired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, isExpired: false };
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredEmail = authEmail.trim().toLowerCase();
    const enteredPass = authPassword.trim();
    if (enteredEmail === ADMIN_CREDENTIALS.username.toLowerCase() && enteredPass === ADMIN_CREDENTIALS.password) {
      setIsAdmin(true); 
      setShowAdminLogin(false); 
      setAuthError(''); setAuthEmail(''); setAuthPassword(''); 
      setCurrentView('admin_portal');
      setLastCheckedNotifications(Date.now());
    } else {
      setAuthError('Invalid administrator credentials.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: any) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("The selected file exceeds the 200MB limit.");
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setter({ data: reader.result as string, type: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!newDate) { alert("Please select a valid date."); return; }
    setIsSubmitting(true);
    setTimeout(() => {
      const scheduleData: Omit<Schedule, 'id' | 'createdAt'> = {
        category: newCategory,
        course: newCategory === 'activity' ? undefined : newCourse,
        title: newCategory === 'activity' ? newTitle : undefined,
        date: newDate,
        givenDate: newCategory === 'assignment' ? newGivenDate : undefined,
        time: newTime,
        type: newType,
        location: newLoc,
        instructions: newInst,
        attachment: attachmentData?.data,
        attachmentType: attachmentData?.type,
        attachmentName: attachmentData?.name
      };
      if (editingSchedule) {
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? { ...s, ...scheduleData, createdAt: s.createdAt } : s).sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()));
        setEditingSchedule(null);
      } else {
        const added: Schedule = { id: crypto.randomUUID(), createdAt: Date.now(), ...scheduleData };
        setSchedules(prev => [added, ...prev].sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()));
      }
      setNewDate(''); setNewGivenDate(''); setNewTime(''); setNewLoc(''); setNewInst(''); setNewTitle('');
      setAttachmentData(null); setIsSubmitting(false); 
    }, 1500);
  };

  const handleGuideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideTitle || !guideContent) return;
    const newPost: GuidePost = {
      id: crypto.randomUUID(),
      title: guideTitle,
      content: guideContent,
      link: guideLink,
      attachment: guideAttachment?.data,
      attachmentType: guideAttachment?.type,
      attachmentName: guideAttachment?.name,
      createdAt: Date.now()
    };
    setGuidePosts(prev => [newPost, ...prev]);
    setGuideTitle(''); setGuideContent(''); setGuideLink(''); setGuideAttachment(null);
    setIsGuideModalOpen(false);
  };

  const handleIconUpload = (code: CourseCode, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setCustomIcons(prev => ({ ...prev, [code]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const filteredGuidePosts = useMemo(() => {
    if (!guideSearchQuery) return guidePosts;
    const query = guideSearchQuery.toLowerCase();
    return guidePosts.filter(p => p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query));
  }, [guidePosts, guideSearchQuery]);

  const searchResults = useMemo(() => {
    if (!guideSearchQuery || guideSearchQuery.length < 2) return [];
    const query = guideSearchQuery.toLowerCase();
    return guidePosts.filter(p => p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query)).slice(0, 8);
  }, [guidePosts, guideSearchQuery]);

  const filteredSchedules = useMemo(() => schedules.filter(s => (filter === 'All' || s.type === filter) && (selectedDate === 'All' || s.date === selectedDate)), [schedules, filter, selectedDate]);

  const timeLeft = useMemo(() => getSubscriptionTimeLeft(currentUser?.expiryDate), [currentUser?.expiryDate]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Inter'] selection:bg-indigo-100 flex flex-col relative overflow-x-hidden">
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100/80 h-20 px-4 sm:px-12 flex items-center justify-center">
        <div className="max-w-[1400px] w-full flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => { setCurrentView('dashboard'); setViewMode('list'); setIsMenuOpen(false); }}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:scale-105 transition-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
            <div className="hidden xs:block">
              <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none">ClassSync <span className="text-indigo-600">PRO</span></h1>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Academic Hub</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setCurrentView('dashboard')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>Schedule</button>
              <button onClick={() => setCurrentView('guide')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'guide' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>100L Guide</button>
              {isAdmin && <button onClick={() => setCurrentView('admin_portal')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'admin_portal' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}><Icons.Terminal /> Admin Portal</button>}
              {currentUser && !isAdmin && <button onClick={() => setCurrentView('profile')} className={`text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'profile' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'}`}>My Account</button>}
            </div>

            <div className="flex items-center gap-2">
               <button onClick={toggleNotifications} className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100">
                 <Icons.Bell />
                 {(currentUser || isAdmin) && unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>}
               </button>
               <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-slate-900 bg-white border border-slate-100 rounded-2xl shadow-sm">{isMenuOpen ? <Icons.X /> : <Icons.Menu />}</button>
            </div>

            <div className="hidden md:flex items-center gap-4">
               {isAdmin ? (
                  <button onClick={handleSignOut} className="px-5 py-2 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all">Sign Out</button>
               ) : currentUser ? (
                  <button onClick={handleSignOut} className="px-5 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all">Sign Out</button>
               ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentView('login')} className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sign In</button>
                    <button onClick={() => setCurrentView('signup')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Create Account</button>
                    <button onClick={() => setShowAdminLogin(true)} className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">Admin Login</button>
                  </div>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[110] bg-white transition-all duration-500 pt-28 px-8 flex flex-col gap-6 text-center ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'} md:hidden`}>
        <button onClick={() => { setCurrentView('dashboard'); setIsMenuOpen(false); }} className="text-3xl font-black text-slate-900">Schedule</button>
        <button onClick={() => { setCurrentView('guide'); setIsMenuOpen(false); }} className="text-3xl font-black text-slate-900">100L Guide</button>
        {isAdmin && <button onClick={() => { setCurrentView('admin_portal'); setIsMenuOpen(false); }} className="text-3xl font-black text-indigo-600">Admin Portal</button>}
        {currentUser && !isAdmin && <button onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }} className="text-3xl font-black text-slate-900">My Account</button>}
        <hr className="border-slate-100" />
        {isAdmin ? (
           <button onClick={handleSignOut} className="text-xl font-black text-rose-500 py-6 bg-rose-50 rounded-3xl">Sign Out</button>
        ) : currentUser ? (
           <button onClick={handleSignOut} className="text-xl font-black text-rose-500 py-6 bg-rose-50 rounded-3xl">Sign Out</button>
        ) : (
           <div className="flex flex-col gap-4">
              <button onClick={() => { setCurrentView('login'); setIsMenuOpen(false); }} className="text-xl font-black text-slate-900 py-6 border border-slate-100 rounded-3xl">Sign In</button>
              <button onClick={() => { setCurrentView('signup'); setIsMenuOpen(false); }} className="text-xl font-black text-white py-6 bg-slate-900 rounded-3xl shadow-xl">Create Account</button>
              <button onClick={() => { setIsMenuOpen(false); setShowAdminLogin(true); }} className="text-sm font-black text-indigo-600 uppercase tracking-widest mt-4">Administrative Access</button>
           </div>
        )}
      </div>

      <NotificationsSidebar isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} schedules={schedules} lastChecked={lastCheckedNotifications} onViewDate={(d) => { setSelectedDate(d); setCurrentView('dashboard'); }} />
      
      {viewingDoc && <DocViewer isOpen={!!viewingDoc} onClose={() => setViewingDoc(null)} attachment={viewingDoc.attachment!} type={viewingDoc.attachmentType!} name={viewingDoc.attachmentName!} />}

      {confirmDeleteId && <ConfirmationModal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={() => { setSchedules(prev => prev.filter(s => s.id !== confirmDeleteId)); setConfirmDeleteId(null); }} title="Remove Schedule Entry?" message="This action will permanently remove this session for all users." />}

      <main className="flex-1 flex flex-col">
        {/* VIEW: 100L Guide */}
        {currentView === 'guide' && (
          <div className="flex-1 flex flex-col animate-fade-in relative min-h-screen bg-white">
             <section className="pt-20 pb-16 px-6 sm:px-12 flex flex-col items-center sticky top-20 bg-white/95 backdrop-blur-md z-40 border-b border-slate-50">
                <div className="flex flex-col items-center gap-2 mb-8 text-center">
                   <h2 className="text-4xl font-black text-slate-900 tracking-tight">Student Guide</h2>
                   <p className="text-slate-400 font-medium text-sm">Access official information and academic resources.</p>
                </div>
                
                <div className="w-full max-w-2xl relative" ref={searchDropdownRef}>
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors duration-300">
                      <Icons.Search />
                   </div>
                   <input 
                      type="text" 
                      placeholder="Search guide topics..." 
                      value={guideSearchQuery}
                      onFocus={() => setIsSearchFocused(true)}
                      onChange={(e) => {
                        setGuideSearchQuery(e.target.value);
                        setIsSearchFocused(true);
                      }}
                      className="w-full h-18 pl-14 pr-8 bg-slate-50 border border-slate-100 rounded-full font-bold text-base shadow-sm focus:border-indigo-600 outline-none transition-all duration-300 placeholder:text-slate-300"
                   />
                   
                   {isSearchFocused && guideSearchQuery.length >= 2 && (
                     <div className="absolute left-0 right-0 top-full mt-3 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in z-50">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{searchResults.length} Results Found</span>
                           <button onClick={() => setIsSearchFocused(false)} className="text-slate-400 hover:text-slate-900"><Icons.X /></button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                           {searchResults.map(p => (
                             <button 
                                key={p.id} 
                                onClick={() => scrollToPost(p.id)}
                                className="w-full text-left p-6 hover:bg-indigo-50/50 transition-all border-b border-slate-50 last:border-0 group"
                             >
                                <h4 className="font-black text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">{p.title}</h4>
                                <p className="text-xs text-slate-400 line-clamp-1 italic">{p.content}</p>
                             </button>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </section>

             <section className="w-full pb-32">
                {filteredGuidePosts.map((post) => (
                   <div id={`post-${post.id}`} key={post.id} className="w-full px-6 sm:px-12 py-20 transition-all duration-300 border-b border-slate-100 hover:bg-slate-50/30">
                      <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-indigo-500" />
                             <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
                           </div>
                           {isAdmin && (
                              <button onClick={() => setConfirmDeleteGuideId(post.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Icons.Trash /></button>
                           )}
                        </div>
                        <h3 className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">{post.title}</h3>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed whitespace-pre-wrap mb-12">{post.content}</p>
                        
                        {post.attachment && (
                           <div className="mb-12 rounded-[2.5rem] overflow-hidden border border-slate-100 max-w-3xl bg-slate-50 flex items-center justify-center cursor-pointer group/img shadow-sm" onClick={() => setViewingDoc({ id: post.id, attachment: post.attachment, attachmentType: post.attachmentType, attachmentName: post.attachmentName } as any)}>
                              {post.attachmentType?.includes('image') ? (
                                 <img src={post.attachment} alt={post.title} className="w-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
                              ) : (
                                 <div className="py-24 flex flex-col items-center gap-4 text-slate-300">
                                    <Icons.File />
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{post.attachmentName}</span>
                                 </div>
                              )}
                           </div>
                        )}
                        {post.link && (
                           <a href={post.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-4 px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-indigo-100 shadow-xl">
                              View Full Document <Icons.ExternalLink />
                           </a>
                        )}
                      </div>
                   </div>
                ))}
             </section>

             {isAdmin && (
               <button 
                onClick={() => setIsGuideModalOpen(true)}
                className="fixed bottom-12 right-12 w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[150] ring-4 ring-white"
               >
                 <Icons.Plus />
               </button>
             )}
          </div>
        )}

        <div className={currentView === 'guide' ? 'hidden' : 'max-w-[1400px] w-full mx-auto px-4 sm:px-12 py-12'}>
          {/* VIEW: Dashboard */}
          {currentView === 'dashboard' && (
             <div className="animate-fade-in">
                <header className="mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                   <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Class Schedule</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Manage your academic sessions</p>
                   </div>
                   <div className="flex flex-wrap gap-4">
                      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        <button onClick={() => setViewMode('list')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>List View</button>
                        <button onClick={() => setViewMode('calendar')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Month View</button>
                      </div>
                      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                        {(['All', 'Physical', 'Online'] as const).map(f => (
                          <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 flex-shrink-0 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>{f}</button>
                        ))}
                      </div>
                   </div>
                </header>

                {viewMode === 'list' ? (
                   <div className="space-y-12">
                      <div className="overflow-x-auto no-scrollbar pb-6 flex items-center gap-4 px-4 snap-x">
                        <button onClick={() => setSelectedDate('All')} className={`flex-shrink-0 snap-start w-20 h-24 rounded-3xl flex flex-col items-center justify-center border transition-all ${selectedDate === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}>
                          <span className="text-[10px] font-black uppercase mb-1">Show</span><span className="text-sm font-black">All</span>
                        </button>
                        {timelineDates.map(d => {
                          const date = new Date(d + 'T12:00:00');
                          const isSelected = selectedDate === d;
                          const hasClasses = activeDates.has(d);
                          return (
                            <button key={d} onClick={() => setSelectedDate(d)} className={`flex-shrink-0 snap-start w-20 h-24 rounded-3xl flex flex-col items-center justify-center border relative transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-110 z-20' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}>
                              <span className="text-[10px] font-black uppercase mb-1 opacity-60">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                              <span className="text-xl font-black">{date.getDate()}</span>
                              <span className="text-[10px] font-black uppercase mt-1 opacity-60">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                              {hasClasses && !isSelected && <div className="absolute bottom-2 w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                        {filteredSchedules.map(s => <ScheduleCard key={s.id} schedule={s} isAdmin={isAdmin} onDeleteClick={setConfirmDeleteId} onEdit={setEditingSchedule} onViewDoc={setViewingDoc} customIcons={customIcons} isSubscribed={currentUser?.isSubscribed ?? false} expiryDate={currentUser?.expiryDate} />)}
                        {filteredSchedules.length === 0 && (
                          <div className="col-span-full py-32 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200"><Icons.Calendar /></div>
                            <h4 className="text-xl font-black text-slate-900">No scheduled sessions found for this day.</h4>
                          </div>
                        )}
                      </div>
                   </div>
                ) : (
                  <CalendarView schedules={schedules} selectedDate={selectedDate === 'All' ? '' : selectedDate} onDateSelect={(d) => { setSelectedDate(d); setViewMode('list'); }} />
                )}
             </div>
          )}

          {/* VIEW: Subscription */}
          {currentView === 'subscription' && (
            <section className="animate-fade-in max-w-4xl mx-auto py-12">
               <div className="bg-slate-900 rounded-[3.5rem] p-10 sm:p-20 text-white relative overflow-hidden shadow-3xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] -translate-y-1/2 translate-x-1/2 rounded-full" />
                  <div className="relative z-10 text-center max-w-2xl mx-auto">
                     <div className="inline-flex px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-8">Premium Membership</div>
                     <h2 className="text-5xl font-black tracking-tight mb-6">Upgrade to ClassSync <span className="text-indigo-500">Plus</span></h2>
                     <p className="text-slate-400 text-lg font-medium mb-12">Gain access to premium academic resources and comprehensive schedule details.</p>
                     
                     <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-12 mb-8">
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-2">31-Day Membership Plan</p>
                        <div className="flex items-center justify-center gap-2 mb-8">
                           <span className="text-6xl font-black">₦300</span>
                           <span className="text-slate-500 font-bold self-end mb-2">/ month</span>
                        </div>
                        <button onClick={handleSubscription} className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95">Pay via Paystack</button>
                     </div>
                     <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">Your subscription begins immediately after successful payment.</p>
                  </div>
               </div>
            </section>
          )}

          {/* VIEW: Profile */}
          {currentView === 'profile' && currentUser && (
             <section className="animate-fade-in max-w-5xl mx-auto py-12 space-y-12">
                <div className="bg-white rounded-[3.5rem] p-10 sm:p-16 border border-slate-100 shadow-2xl flex flex-col lg:flex-row gap-12 items-start">
                   <div className="shrink-0 flex flex-col items-center">
                      <div className="w-32 h-32 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl mb-6">{currentUser.name.charAt(0)}</div>
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${currentUser.isSubscribed && !timeLeft?.isExpired ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                         {currentUser.isSubscribed && !timeLeft?.isExpired ? 'Active Plus Member' : 'Standard Member'}
                      </div>
                   </div>
                   <div className="flex-1 space-y-10 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                           <h2 className="text-4xl font-black tracking-tight text-slate-900">{currentUser.name}</h2>
                           <p className="text-slate-400 text-lg font-medium">{currentUser.email}</p>
                        </div>
                        {(!currentUser.isSubscribed || timeLeft?.isExpired) && (
                          <button onClick={() => setCurrentView('subscription')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">Renew Subscription</button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Current Status</p>
                               <h4 className="text-2xl font-black mb-2 flex items-center gap-2">
                                  {currentUser.isSubscribed && !timeLeft?.isExpired ? 'Subscription Active' : 'Access Restricted'}
                                  {currentUser.isSubscribed && !timeLeft?.isExpired && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                               </h4>
                            </div>
                            
                            {currentUser.isSubscribed && !timeLeft?.isExpired && timeLeft && (
                               <div className="mt-8 space-y-4">
                                  <div className="flex justify-between items-end">
                                     <div className="flex items-center gap-2 text-indigo-600">
                                        <Icons.Clock />
                                        <span className="text-sm font-black">{timeLeft.days} days, {timeLeft.hours} hours remaining</span>
                                     </div>
                                     <span className="text-[10px] font-bold text-slate-400 italic">Valid until {new Date(currentUser.expiryDate!).toLocaleDateString()}</span>
                                  </div>
                                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-indigo-600 transition-all duration-1000" 
                                        style={{ width: `${Math.max(5, (timeLeft.days / SUBSCRIPTION_PERIOD_DAYS) * 100)}%` }}
                                     />
                                  </div>
                               </div>
                            )}
                         </div>
                         
                         <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center items-center text-center">
                            <Icons.Shield />
                            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Security</p>
                            <h4 className="text-xl font-black mt-1">Verified Member</h4>
                         </div>
                      </div>

                      <div className="pt-10 border-t border-slate-100">
                         <h3 className="text-2xl font-black mb-8 text-slate-900">Change Password</h3>
                         <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                            {pwdError && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black rounded-2xl">{pwdError}</div>}
                            {pwdSuccess && <div className="p-4 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-2xl">{pwdSuccess}</div>}
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Password</label>
                               <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                               <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all" />
                            </div>
                            <button className="w-full h-18 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Update Password</button>
                         </form>
                      </div>
                   </div>
                </div>
             </section>
          )}

          {/* VIEW: Admin Portal */}
          {currentView === 'admin_portal' && isAdmin && (
            <section className="animate-fade-in max-w-6xl mx-auto py-12">
              <div className="bg-slate-900 rounded-[3rem] p-10 text-white border border-slate-800 shadow-2xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"><Icons.Terminal /></div>
                        <h2 className="text-3xl font-black tracking-tight">{editingSchedule ? 'Edit Schedule Entry' : 'Administrator Control Panel'}</h2>
                     </div>
                     <div className="flex p-1 bg-slate-800 rounded-2xl border border-slate-700">
                        <button onClick={() => setAdminTab('create')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'create' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>Add/Edit</button>
                        <button onClick={() => setAdminTab('icons')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'icons' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}>Course Icons</button>
                     </div>
                  </div>

                  {adminTab === 'create' ? (
                    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-3 lg:col-span-3">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Category</label>
                        </div>
                        <div className="flex bg-slate-800 p-1 rounded-2xl h-16 border border-slate-700">
                          {(['class', 'assignment', 'activity'] as ScheduleCategory[]).map(cat => (
                            <button key={cat} type="button" onClick={() => setNewCategory(cat)} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${newCategory === cat ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-300'}`}>
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {newCategory === 'activity' ? (
                        <div className="space-y-2 lg:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activity Title</label>
                          <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Departmental Welcome" className="w-full h-16 px-6 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white outline-none focus:border-indigo-600 transition-all" />
                        </div>
                      ) : (
                        <div className="space-y-2 lg:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Subject</label>
                          <select value={newCourse} onChange={e => setNewCourse(e.target.value as CourseCode)} className="w-full h-16 px-6 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white outline-none focus:border-indigo-600 transition-all appearance-none">
                            {Object.entries(COURSES).map(([code, name]) => <option key={code} value={code}>{code.toUpperCase()} — {name}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scheduled Date</label>
                        <DatePicker value={newDate} onChange={setNewDate} darkMode label="Select Date" />
                      </div>

                      {newCategory === 'assignment' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned On (Optional)</label>
                          <DatePicker value={newGivenDate} onChange={setNewGivenDate} darkMode label="Assignment Date" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</label>
                        <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full h-16 px-6 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white outline-none focus:border-indigo-600 transition-all" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery Method</label>
                        <div className="flex bg-slate-800 p-1 rounded-2xl h-16 border border-slate-700">
                          {(['Physical', 'Online'] as ClassType[]).map(type => (
                            <button key={type} type="button" onClick={() => setNewType(type)} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all ${newType === type ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{newType === 'Online' ? 'Meeting URL' : 'Campus Location'}</label>
                        <input type="text" required value={newLoc} onChange={e => setNewLoc(e.target.value)} placeholder={newType === 'Online' ? 'https://meet.google.com/...' : 'e.g. Auditorium A'} className="w-full h-16 px-6 bg-slate-800 border border-slate-700 rounded-2xl font-bold text-white outline-none focus:border-indigo-600 transition-all" />
                      </div>

                      <div className="space-y-2 lg:col-span-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instructions & Details</label>
                        <textarea rows={3} value={newInst} onChange={e => setNewInst(e.target.value)} placeholder="Provide additional information for this session..." className="w-full p-6 bg-slate-800 border border-slate-700 rounded-3xl font-bold text-white outline-none focus:border-indigo-600 transition-all resize-none" />
                      </div>

                      <div className="space-y-2 lg:col-span-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attachment (Optional)</label>
                        <div className={`relative h-20 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all ${attachmentData ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-indigo-500/50'}`}>
                          <input type="file" onChange={(e) => handleFileUpload(e, setAttachmentData)} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <div className="flex items-center gap-3">
                            <div className={`${attachmentData ? 'text-emerald-500' : 'text-slate-500'}`}><Icons.File /></div>
                            <span className={`text-xs font-black uppercase tracking-widest ${attachmentData ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {attachmentData ? attachmentData.name : 'Click to upload supplementary file (Max 200MB)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-3 pt-4">
                        <button type="submit" disabled={isSubmitting} className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                          {isSubmitting ? <><Icons.Loader /> Saving Changes...</> : editingSchedule ? 'Save Changes' : 'Post to Schedule'}
                        </button>
                        {editingSchedule && (
                          <button type="button" onClick={() => {setEditingSchedule(null); setNewDate(''); setNewLoc(''); setNewInst(''); setNewTitle(''); setAttachmentData(null);}} className="w-full text-center mt-6 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500">Cancel Edit</button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {Object.keys(COURSES).map(c => (
                        <div key={c} className="p-8 bg-slate-800 rounded-[2.5rem] border border-slate-700 flex flex-col items-center group">
                          <CourseIcon code={c as CourseCode} category="class" customIcons={customIcons} size="h-20 w-20" />
                          <p className="text-[10px] font-black text-slate-500 uppercase mt-6 tracking-widest">{c}</p>
                          <h4 className="font-bold text-white mt-1 text-center h-12 flex items-center">{COURSES[c as CourseCode]}</h4>
                          <label className="mt-8 w-full">
                            <div className="w-full h-12 bg-slate-700 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg">
                              Replace Icon <input type="file" className="hidden" onChange={e => e.target.files && handleIconUpload(c as CourseCode, e.target.files[0])} />
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </section>
          )}

          {/* VIEW: Login */}
          {currentView === 'login' && (
            <section className="flex-1 flex items-center justify-center py-20 animate-fade-in">
              <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl">
                <div className="text-center mb-10">
                   <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Sign In</h2>
                   <p className="text-slate-400 font-medium text-sm">Welcome back to your academic portal.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                  {authError && <div className="p-5 bg-rose-50 text-rose-600 text-xs font-black rounded-3xl">{authError}</div>}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
                    <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Password</label>
                    <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-600" />
                  </div>
                  <button className="w-full h-18 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Sign In</button>
                  <p className="text-center text-xs font-bold text-slate-400 mt-8">Do not have an account? <button onClick={() => setCurrentView('signup')} className="text-indigo-600 hover:underline">Register now</button></p>
                </form>
              </div>
            </section>
          )}

          {/* VIEW: Signup */}
          {currentView === 'signup' && (
            <section className="flex-1 flex items-center justify-center py-20 animate-fade-in">
              <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl">
                <div className="text-center mb-10">
                   <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Create Account</h2>
                   <p className="text-slate-400 font-medium text-sm">Join the student community.</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-6">
                  {authError && <div className="p-5 bg-rose-50 text-rose-600 text-xs font-black rounded-3xl">{authError}</div>}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Full Name</label>
                    <input type="text" required value={authName} onChange={e => setAuthName(e.target.value)} className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email Address</label>
                    <input type="email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Password</label>
                    <input type="password" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-600" />
                  </div>
                  <button className="w-full h-18 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Create Account</button>
                  <p className="text-center text-xs font-bold text-slate-400 mt-8">Already have an account? <button onClick={() => setCurrentView('login')} className="text-indigo-600 hover:underline">Log in</button></p>
                </form>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-16 text-center mt-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">ClassSync Pro &copy; {new Date().getFullYear()} &mdash; Secure Payments via Paystack</p>
      </footer>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setShowAdminLogin(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-3xl overflow-hidden border border-slate-100">
             <div className="absolute top-0 right-0 p-8 text-indigo-500 opacity-20"><Icons.Terminal /></div>
             <div className="relative z-10">
               <div className="mb-10 text-center">
                 <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Admin Login</h3>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Administrative Verification Required</p>
               </div>
               <form onSubmit={handleAdminLogin} className="space-y-6">
                  {authError && <div className="p-4 bg-rose-50 text-rose-600 text-xs font-black rounded-2xl">{authError}</div>}
                  <input type="email" placeholder="Administrator Email" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-600 transition-all" />
                  <input type="password" placeholder="Access Code" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full h-18 px-8 bg-slate-50 border border-slate-100 rounded-3xl font-bold outline-none focus:border-indigo-600 transition-all" />
                  <button className="w-full h-18 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95">Enter Portal</button>
                  <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-600 transition-all mt-4">Cancel</button>
               </form>
             </div>
          </div>
        </div>
      )}

      {/* Guide Entry Modal */}
      {isGuideModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsGuideModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] p-10 sm:p-14 shadow-2xl my-auto">
             <div className="flex justify-between items-center mb-10 shrink-0">
               <h3 className="text-3xl font-black tracking-tighter">Add Guide Entry</h3>
               <button onClick={() => setIsGuideModalOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all"><Icons.X /></button>
             </div>
             <form onSubmit={handleGuideSubmit} className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post Title</label><input type="text" required value={guideTitle} onChange={e => setGuideTitle(e.target.value)} className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold outline-none focus:border-indigo-600" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content Body</label><textarea rows={4} required value={guideContent} onChange={e => setGuideContent(e.target.value)} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold outline-none resize-none focus:border-indigo-600" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">External Link (Optional)</label><input type="url" value={guideLink} onChange={e => setGuideLink(e.target.value)} className="w-full h-16 px-6 bg-slate-50 border border-slate-200 rounded-[1.2rem] font-bold outline-none focus:border-indigo-600" placeholder="https://..." /></div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Resource (Optional)</label>
                  <div className={`relative h-16 rounded-[1.2rem] border-2 border-dashed flex items-center justify-center transition-all ${guideAttachment ? 'border-emerald-500/50 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}`}>
                    <input type="file" onChange={(e) => handleFileUpload(e, setGuideAttachment)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="text-xs font-bold text-slate-400">{guideAttachment ? `✓ ${guideAttachment.name}` : "Click to add file"}</span>
                  </div>
                </div>
                <button className="w-full h-18 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all active:scale-95">Publish to Guide</button>
             </form>
          </div>
        </div>
      )}

      {confirmDeleteGuideId && (
        <ConfirmationModal 
          isOpen={!!confirmDeleteGuideId} 
          onClose={() => setConfirmDeleteGuideId(null)} 
          onConfirm={() => { setGuidePosts(prev => prev.filter(p => p.id !== confirmDeleteGuideId)); setConfirmDeleteGuideId(null); }} 
          title="Delete Guide Post?" 
          message="This will permanently delete this information from the student guide." 
        />
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .h-18 { height: 4.5rem; }`}</style>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
