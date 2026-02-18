
import React, { useState, useMemo } from 'react';
import { Schedule, ViewMode } from '../types';
import { sql } from '../db';
import { appCache } from '../cache';
import { ScheduleCard } from '../components/ScheduleCard';
import { Icons } from '../icons';
import { formatDateLocal, parseDatabaseDate } from '../helpers';
import { ConfirmModal } from '../components/ConfirmModal';
import { SkeletonCard } from '../components/SkeletonCard';
import { ToastType } from '../components/Toast';

export const Dashboard: React.FC<{
  schedules: Schedule[];
  isAdmin: boolean;
  customIcons: Record<string, string>;
  fetchAllData: () => void;
  setViewingDoc: (s: Schedule) => void;
  onEditRequest: (s: Schedule) => void;
  showToast: (msg: string, type?: ToastType) => void;
}> = ({ schedules, isAdmin, customIcons, fetchAllData, setViewingDoc, onEditRequest, showToast }) => {
  const [selectedDate, setSelectedDate] = useState<string | 'All'>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const todayStr = useMemo(() => formatDateLocal(new Date()), []);
  const isLoading = schedules.length === 0;

  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => {
        if (selectedDate === 'All') {
          // Show unscheduled items or future/today items
          const hasNoDate = !s.date && !s.givenDate;
          const isFutureOrToday = (s.date && s.date >= todayStr) || (s.givenDate && s.givenDate >= todayStr);
          return hasNoDate || isFutureOrToday;
        }

        // Check if viewed date matches assigned OR due date
        return s.date === selectedDate || (s.givenDate === selectedDate);
      })
      .sort((a, b) => {
        // Sort items with no date to the bottom
        if (!a.date && b.date) return 1;
        if (a.date && !b.date) return -1;
        
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [schedules, selectedDate, todayStr]);

  const timelineDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(formatDateLocal(d));
    }
    return dates;
  }, []);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i, 12, 0, 0, 0));
    return days;
  }, [calendarMonth]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await sql`DELETE FROM schedules WHERE id = ${deleteId}`;
      appCache.delete('schedules');
      showToast("Academic Artifact Purged", "success");
      fetchAllData();
      setDeleteId(null);
    } catch (e) {
      showToast("Purge Failed: Network Conflict.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dStr = formatDateLocal(date);
    return schedules.filter(s => s.date === dStr || s.givenDate === dStr);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">The Timeline</h2>
           <p className="text-slate-500 font-medium text-base max-w-xl">Unified academic hub for the 100L collective.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all btn-feedback ${viewMode === 'list' ? 'bg-white text-black' : 'text-slate-500'}`}>List</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all btn-feedback ${viewMode === 'calendar' ? 'bg-white text-black' : 'text-slate-500'}`}>Grid</button>
          </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-10">
          <div className="overflow-x-auto no-scrollbar pb-6 flex items-center gap-3 snap-x -mx-4 px-4">
             <button 
               onClick={() => setSelectedDate('All')} 
               className={`flex-shrink-0 snap-start w-20 h-20 rounded-2xl flex flex-col items-center justify-center border transition-all btn-feedback ${selectedDate === 'All' ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}
             >
                <span className="text-[9px] font-black uppercase mb-1 tracking-widest opacity-60">Master</span>
                <span className="text-sm font-black">ALL</span>
             </button>
             {timelineDates.map(d => {
               const date = parseDatabaseDate(d);
               const isSelected = selectedDate === d;
               const isToday = d === todayStr;
               const hasEvents = getEventsForDate(date).length > 0;
               return (
                 <button key={d} onClick={() => setSelectedDate(d)} className={`flex-shrink-0 snap-start w-20 h-20 rounded-2xl flex flex-col items-center justify-center border relative transition-all btn-feedback ${isSelected ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}>
                   {hasEvents && !isSelected && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                   <span className={`text-[9px] font-black uppercase mb-0.5 tracking-widest ${isToday ? 'text-blue-500' : 'opacity-60'}`}>
                     {isToday ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                   </span>
                   <span className="text-xl font-black">{date.getDate()}</span>
                   <span className="text-[9px] font-bold uppercase opacity-40 mt-0.5">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                 </button>
               );
             })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
             ) : (
                filteredSchedules.map(s => (
                  <ScheduleCard 
                    key={`${s.id}-${selectedDate}`} 
                    schedule={s} 
                    isAdmin={isAdmin} 
                    customIcons={customIcons} 
                    onEdit={onEditRequest} 
                    onDelete={setDeleteId} 
                    onViewDoc={setViewingDoc} 
                    viewDate={selectedDate === 'All' ? undefined : selectedDate}
                  />
                ))
             )}
             
             {!isLoading && filteredSchedules.length === 0 && (
               <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-slate-600">
                 <div className="w-12 h-12 mb-6 text-slate-700"><Icons.Calendar /></div>
                 <h4 className="text-xl font-bold text-white tracking-tight">Timeline Static</h4>
                 <p className="text-xs font-medium mt-1 opacity-60">No future academic events detected.</p>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="bg-[#161a22] border border-white/10 rounded-3xl overflow-hidden shadow-sm animate-fade-in relative">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">
              {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 transition-all flex items-center justify-center"><Icons.ChevronLeft /></button>
              <button onClick={() => setCalendarMonth(new Date())} className="px-4 h-10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white border border-white/10 rounded-lg">Today</button>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 transition-all flex items-center justify-center"><Icons.ChevronRight /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-white/5 bg-black/10">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="py-4 text-center text-[9px] font-black text-slate-500 tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[140px]">
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="border-r border-b border-white/5 bg-black/5 last:border-r-0" />;
              const events = getEventsForDate(date);
              const dStr = formatDateLocal(date);
              const isToday = dStr === todayStr;
              return (
                <div 
                  key={i} 
                  className="border-r border-b border-white/5 p-4 hover:bg-white/5 transition-all cursor-pointer last:border-r-0 group relative overflow-hidden" 
                  onClick={() => { setSelectedDate(dStr); setViewMode('list'); }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-white'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {events.slice(0, 3).map(e => (
                      <div 
                        key={`${e.id}-${dStr}`} 
                        className={`h-2 rounded-full ${e.category === 'assignment' ? (e.givenDate === dStr ? 'bg-emerald-500' : 'bg-rose-500') : e.category === 'activity' ? 'bg-indigo-500' : 'bg-blue-500'}`} 
                        title={e.title || (e.course && e.course.toUpperCase())} 
                      />
                    ))}
                    {events.length > 3 && <div className="text-[8px] font-black text-slate-600 text-center mt-1">+{events.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => !isDeleting && setDeleteId(null)} 
        onConfirm={confirmDelete} 
        title="Delete Record" 
        message="This artifact will be purged from the institutional timeline. This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
};
