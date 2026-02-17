
import React, { useState, useMemo } from 'react';
import { Schedule } from '../types';
import { sql } from '../db';
import { appCache } from '../cache';
import { ScheduleCard } from '../components/ScheduleCard';
import { Icons } from '../icons';
import { formatDateLocal, parseDatabaseDate } from '../helpers';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastType } from '../components/Toast';

export const History: React.FC<{
  schedules: Schedule[];
  isAdmin: boolean;
  customIcons: Record<string, string>;
  fetchAllData: () => void;
  setViewingDoc: (s: Schedule) => void;
  onEditRequest: (s: Schedule) => void;
  showToast: (msg: string, type?: ToastType) => void;
}> = ({ schedules, isAdmin, customIcons, fetchAllData, setViewingDoc, onEditRequest, showToast }) => {
  const [selectedDate, setSelectedDate] = useState<string>(formatDateLocal(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const todayStr = useMemo(() => formatDateLocal(new Date()), []);

  // Filter schedules for the SPECIFIC selected date (Old or New as requested)
  const daySchedules = useMemo(() => {
    return schedules
      .filter(s => s.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [schedules, selectedDate]);

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
      showToast("Archive Record Purged", "success");
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
    return schedules.filter(s => s.date === dStr);
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none uppercase">Archive Browser</h2>
           <p className="text-slate-500 font-medium text-base max-w-xl">Browse historical and future institutional records by date.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classes</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
             <div className="w-2 h-2 rounded-full bg-rose-500"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Full Screen Calendar View */}
        <div className="lg:col-span-8">
          <div className="bg-[#161a22] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
              <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm">
                {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 transition-all flex items-center justify-center btn-feedback"><Icons.ChevronLeft /></button>
                <button onClick={() => { setCalendarMonth(new Date()); setSelectedDate(todayStr); }} className="px-6 h-12 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg btn-feedback">Today</button>
                <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 transition-all flex items-center justify-center btn-feedback"><Icons.ChevronRight /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-white/5 bg-black/10">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                <div key={d} className="py-5 text-center text-[10px] font-black text-slate-500 tracking-widest">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[120px]">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="border-r border-b border-white/5 bg-black/[0.02] last:border-r-0" />;
                
                const dStr = formatDateLocal(date);
                const events = getEventsForDate(date);
                const isSelected = dStr === selectedDate;
                const isToday = dStr === todayStr;
                const isPast = dStr < todayStr;

                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDate(dStr)}
                    className={`border-r border-b border-white/5 p-3 hover:bg-white/[0.04] transition-all cursor-pointer last:border-r-0 relative group ${isSelected ? 'bg-white/[0.08]' : ''}`} 
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-black w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg' : isSelected ? 'bg-white text-black' : isPast ? 'text-slate-600' : 'text-slate-400 group-hover:text-white'}`}>
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                      {events.slice(0, 4).map(e => (
                        <div 
                          key={e.id} 
                          className={`w-1.5 h-1.5 rounded-full ${e.category === 'assignment' ? 'bg-rose-500' : e.category === 'activity' ? 'bg-indigo-500' : 'bg-blue-500'} ${isPast ? 'opacity-40' : 'opacity-100'}`} 
                        />
                      ))}
                      {events.length > 4 && <div className="text-[8px] font-black text-slate-600">+{events.length - 4}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Detail View */}
        <div className="lg:col-span-4 space-y-6">
           <div className="sticky top-8 space-y-6">
              <div className="google-card p-6 bg-blue-600/5 border-blue-500/20">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Selected Ledger</h4>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl">
                    <span className="text-xl font-black leading-none">{parseDatabaseDate(selectedDate).getDate()}</span>
                    <span className="text-[8px] font-black uppercase mt-0.5">{parseDatabaseDate(selectedDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white tracking-tight">{parseDatabaseDate(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-0.5">{daySchedules.length} Activity Entries</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {daySchedules.length > 0 ? (
                  daySchedules.map(s => (
                    <ScheduleCard 
                      key={s.id} 
                      schedule={s} 
                      isAdmin={isAdmin} 
                      customIcons={customIcons} 
                      onEdit={onEditRequest} 
                      onDelete={setDeleteId} 
                      onViewDoc={setViewingDoc} 
                    />
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-slate-600">
                    <div className="w-12 h-12 mb-4 opacity-10"><Icons.Terminal /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest">No Records Found</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => !isDeleting && setDeleteId(null)} 
        onConfirm={confirmDelete} 
        title="Delete Archived Record" 
        message="This historic record will be purged from the archive permanently."
        isLoading={isDeleting}
      />
    </div>
  );
};
