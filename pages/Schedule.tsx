
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScheduleItem, User } from '../types';
import { COURSE_LIST, DAYS_OF_WEEK } from '../constants';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3,
  Video, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Sparkles, 
  ExternalLink,
  Paperclip,
  Activity,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';

interface Props {
  user: User;
  cachedSchedules: ScheduleItem[];
  pendingSchedules: ScheduleItem[];
  onRefresh: () => Promise<void>;
  syncError?: boolean;
  onDelete: (id: string) => Promise<boolean>;
}

const EVENT_TYPES: Record<string, any> = {
  'CLASS': { label: 'Class', color: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100' },
  'TEST': { label: 'Test', color: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-100' },
  'EXAM': { label: 'Exam', color: 'bg-red-600', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-100' },
  'TUTORIAL': { label: 'Tutorial', color: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-100' },
  'ASSIGNMENT': { label: 'Assignment', color: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-100' },
};

const Schedule: React.FC<Props> = ({ user, cachedSchedules, pendingSchedules, onRefresh, onDelete }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  /**
   * Helper to get local YYYY-MM-DD string.
   * This is critical: we use local methods to generate the string that matches
   * what the HTML5 date input produces, ensuring strict alignment.
   */
  const getLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseVenueData = (venueStr: string) => {
    const match = venueStr.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) return { type: match[1], venue: match[2] };
    return { type: 'CLASS', venue: venueStr };
  };

  const filteredItems = useMemo(() => {
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
    const dateStr = getLocalDateStr(selectedDate);
    
    const filterFn = (item: ScheduleItem) => {
      // If item has a specific date, it ONLY shows on that date string.
      // We compare strings "2025-10-31" === "2025-10-31" to avoid timezone drift.
      if (item.eventDate) {
        return item.eventDate === dateStr;
      }
      // If no specific date, it shows on its recurring weekly day.
      return item.day === dayName;
    };

    const dbItems = cachedSchedules.filter(filterFn);
    const pendingItems = pendingSchedules.filter(filterFn);

    return [...pendingItems, ...dbItems].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, cachedSchedules, pendingSchedules]);

  const isLiveNow = (item: ScheduleItem) => {
    const now = new Date();
    const todayStr = getLocalDateStr(now);
    const selectedStr = getLocalDateStr(selectedDate);
    
    if (selectedStr !== todayStr) return false;
    
    const currentHM = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    return currentHM >= startTotal && currentHM <= endTotal;
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const success = await onDelete(itemToDelete.id);
      if (success) {
        setItemToDelete(null);
      } else {
        alert("Delete operation failed. Please check your connectivity.");
      }
    } catch (err) {
      alert("An unexpected error occurred during deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col pb-24 md:pb-0">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-6 md:px-12 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <Sparkles size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Academic Sync</span>
              </div>
              <h1 className="google-font text-3xl font-black text-gray-900 tracking-tighter">My Schedule</h1>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
              <button onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d);
              }} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft size={20} /></button>
              <button 
                onClick={() => setSelectedDate(new Date())}
                className="px-5 py-2.5 bg-white text-blue-600 text-[10px] font-black uppercase rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-all"
              >
                Today
              </button>
              <button onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d);
              }} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>

          {/* Date Selector Strip */}
          <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {[-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map(offset => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const isActive = getLocalDateStr(d) === getLocalDateStr(selectedDate);
              const isToday = getLocalDateStr(d) === getLocalDateStr(new Date());
              
              return (
                <button 
                  key={offset}
                  onClick={() => setSelectedDate(d)}
                  className={`flex-shrink-0 w-16 py-4 rounded-[28px] border transition-all duration-300 flex flex-col items-center justify-center ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 -translate-y-1' 
                      : isToday 
                        ? 'bg-blue-50 border-blue-100 text-blue-600' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase mb-1">{DAYS_OF_WEEK[d.getDay()].substring(0, 3)}</span>
                  <span className="text-xl font-black">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Schedule Feed */}
      <main className="flex-grow p-6 md:p-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="google-font text-2xl font-black text-gray-900 flex items-center">
              <CalendarDays className="mr-3 text-blue-600" size={24} />
              {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <div className="px-5 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-widest">
              {filteredItems.length} Sessions Found
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-100 rounded-[56px] p-24 text-center flex flex-col items-center animate-fade-in">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-8">
                <Clock size={48} />
              </div>
              <h3 className="google-font text-2xl font-black text-gray-900 mb-3">Clear Horizons</h3>
              <p className="text-gray-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">No scheduled activities detected for this temporal coordinate.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredItems.map(item => {
                const live = isLiveNow(item);
                const { type, venue } = parseVenueData(item.venue);
                const config = EVENT_TYPES[type] || EVENT_TYPES['CLASS'];
                const syncing = item.isSyncing;

                return (
                  <div 
                    key={item.id}
                    className={`group bg-white p-8 md:p-10 rounded-[48px] border transition-all duration-500 relative flex flex-col shadow-sm hover:shadow-2xl hover:scale-[1.01] ${
                      live ? 'border-blue-400 ring-4 ring-blue-50' : 'border-gray-100'
                    } ${syncing ? 'animate-pulse cursor-wait opacity-60' : ''}`}
                  >
                    <div className={`absolute top-0 left-0 w-2 h-full transition-colors rounded-l-[48px] ${config.color}`}></div>
                    
                    {live && (
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 animate-[shimmer_2s_infinite_linear]"></div>
                    )}

                    <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center transition-all ${
                          live ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 
                          `${config.light} ${config.text} ${config.border}`
                        }`}>
                          {live && <Activity size={10} className="mr-2 animate-pulse" />}
                          {live ? 'Live Now' : config.label}
                        </span>
                        {item.eventDate && (
                          <span className="px-4 py-2 rounded-full bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest">
                            Fixed Date: {item.eventDate}
                          </span>
                        )}
                      </div>

                      {user.isCourseRep && !syncing && (
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                          <button 
                            onClick={() => navigate(`/schedule/edit/${item.id}`)}
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => setItemToDelete(item)}
                            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                      <div className="flex-grow">
                        <h4 className="google-font text-4xl font-black text-gray-900 mb-2 leading-none tracking-tight">
                          {item.courseCode}
                        </h4>
                        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
                          {COURSE_LIST.find(c => c.code === item.courseCode)?.title}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${
                          live ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-50 text-blue-600 border border-gray-100'
                        }`}>
                          <Clock size={24} />
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Time Block</p>
                          <p className="text-2xl font-black text-gray-900 tabular-nums leading-none">
                            {item.startTime} <span className="text-gray-200">—</span> {item.endTime}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-gray-50 pt-8 mt-auto">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                          {item.isOnline ? <Video size={20} /> : <MapPin size={20} />}
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-300 uppercase mb-0.5">
                            {item.isOnline ? 'Online Protocol' : 'Spatial Coordinate'}
                          </p>
                          <p className="text-lg font-black text-gray-900 truncate max-w-[200px]">
                            {item.isOnline ? 'Virtual Hub' : venue}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {item.attachmentUrl && (
                          <a 
                            href={item.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 rounded-[24px] transition-all group/asset shadow-sm"
                            title="Inspect Material"
                          >
                            <Paperclip size={20} className="group-hover/asset:rotate-12 transition-transform" />
                          </a>
                        )}

                        {item.isOnline && item.link ? (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95"
                          >
                            Join Session <ExternalLink size={14} className="ml-3" />
                          </a>
                        ) : !item.isOnline ? (
                          <div className="px-8 py-4 bg-gray-100 text-gray-400 rounded-[24px] font-black text-[10px] uppercase tracking-widest border border-gray-200/50">
                            Physical Attendance
                          </div>
                        ) : (
                          <div className="px-8 py-4 bg-amber-50 text-amber-600 rounded-[24px] font-black text-[10px] uppercase tracking-widest border border-amber-100 flex items-center">
                            Link Pending
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Functional Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setItemToDelete(null)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={40} />
            </div>
            <h3 className="google-font text-2xl font-black text-gray-900 mb-2">Delete This Session?</h3>
            <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
              This will remove <span className="font-bold text-gray-900">{itemToDelete.courseCode}</span> from the database permanently. All students will lose access to this entry.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setItemToDelete(null)} 
                disabled={isDeleting}
                className="py-5 bg-gray-100 text-gray-600 font-black rounded-3xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={isDeleting}
                className="py-5 bg-red-600 text-white font-black rounded-3xl text-xs uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Delete Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {user.isCourseRep && (
        <button 
          onClick={() => navigate('/schedule/add')}
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-[100] p-6 bg-blue-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group ring-8 ring-white"
        >
          <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default Schedule;
