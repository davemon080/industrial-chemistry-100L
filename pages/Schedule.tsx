
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { ScheduleItem, User } from '../types';
import { COURSE_LIST, DAYS_OF_WEEK } from '../constants';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Loader2, 
  Globe, 
  Video, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  CalendarDays, 
  Sparkles, 
  RefreshCw 
} from 'lucide-react';

interface Props {
  user: User;
  cachedSchedules: ScheduleItem[];
  pendingSchedules: ScheduleItem[];
  onRefresh: () => Promise<void>;
  onDeleteLocal: (id: string) => void;
}

const EVENT_TYPES = [
  { id: 'CLASS', label: 'Class', color: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50' },
  { id: 'TEST', label: 'Test', color: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  { id: 'EXAM', label: 'Exam', color: 'bg-red-600', text: 'text-red-600', light: 'bg-red-50' },
  { id: 'TUTORIAL', label: 'Tutorial', color: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50' },
  { id: 'ASSIGNMENT', label: 'Assignment', color: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50' },
];

const Schedule: React.FC<Props> = ({ user, cachedSchedules, pendingSchedules, onRefresh, onDeleteLocal }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDeleting, setIsDeleting] = useState(false);

  // Background refresh on mount
  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const formatDateToLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseVenueData = (venueStr: string) => {
    const match = venueStr.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) return { type: match[1], venue: match[2] };
    return { type: 'CLASS', venue: venueStr };
  };

  const selectedDayItems = useMemo(() => {
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()];
    const dateStr = formatDateToLocalISO(selectedDate);
    
    const dbItems = cachedSchedules.filter(item => {
      if (item.eventDate) return item.eventDate === dateStr;
      return item.day === dayName;
    });

    const pendingItems = pendingSchedules.filter(item => {
      if (item.eventDate) return item.eventDate === dateStr;
      return item.day === dayName;
    });

    return [...pendingItems, ...dbItems].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, cachedSchedules, pendingSchedules]);

  const isOldActivity = (item: ScheduleItem) => {
    const now = new Date();
    const todayStr = formatDateToLocalISO(now);
    if (item.eventDate && item.eventDate < todayStr) return true;
    if (item.eventDate === todayStr || (!item.eventDate && DAYS_OF_WEEK[now.getDay()] === item.day)) {
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (item.endTime < currentHourMin) return true;
    }
    return false;
  };

  const isCurrentActivity = (item: ScheduleItem) => {
    const now = new Date();
    const todayStr = formatDateToLocalISO(now);
    const dayName = DAYS_OF_WEEK[now.getDay()];
    const isToday = item.eventDate === todayStr || (!item.eventDate && dayName === item.day);
    if (!isToday) return false;
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return item.startTime <= currentHourMin && item.endTime >= currentHourMin;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove sync point?")) {
      setIsDeleting(true);
      const success = await dbService.deleteSchedule(id);
      if (success) {
        onDeleteLocal(id);
      }
      setIsDeleting(false);
    }
  };

  const changeDay = (offset: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + offset);
    setSelectedDate(next);
  };

  return (
    <>
      {user.isCourseRep && (
        <button 
          onClick={() => navigate('/schedule/add')}
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-[100] p-5 bg-blue-600 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl group"
        >
          <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
        </button>
      )}

      <div className="h-screen flex flex-col bg-white overflow-hidden">
        <div className="flex-shrink-0 bg-white px-6 pt-6 pb-4 md:px-12 md:pt-8 md:pb-6 border-b border-gray-100 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Sparkles size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Temporal Hub</span>
                </div>
                <h1 className="google-font text-3xl font-black text-gray-900 tracking-tighter">Schedule</h1>
              </div>
              <div className="flex items-center space-x-2 bg-gray-100/50 p-1 rounded-[20px] border border-gray-100">
                <button onClick={() => changeDay(-1)} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronLeft size={18} /></button>
                <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2 bg-white text-blue-600 text-[10px] font-black uppercase rounded-xl shadow-sm">Today</button>
                <button onClick={() => changeDay(1)} className="p-2 hover:bg-white rounded-xl transition-all"><ChevronRight size={18} /></button>
              </div>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide no-scrollbar -mx-2 px-2">
              {[-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const date = new Date();
                date.setDate(date.getDate() + offset);
                const isSelected = formatDateToLocalISO(selectedDate) === formatDateToLocalISO(date);
                const isToday = formatDateToLocalISO(new Date()) === formatDateToLocalISO(date);
                return (
                  <button key={offset} onClick={() => setSelectedDate(date)} className={`flex-shrink-0 w-14 py-3 rounded-[24px] transition-all border ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : isToday ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-white border-gray-100 text-gray-400'}`}>
                    <span className="text-[8px] font-black uppercase mb-0.5">{DAYS_OF_WEEK[date.getDay()].substring(0, 3)}</span>
                    <span className="text-base font-black">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-32">
          <div className="max-w-4xl mx-auto w-full px-6 pt-8">
            <div className="flex items-end justify-between mb-8 animate-fade-in">
              <div>
                <h2 className="google-font text-3xl font-black text-gray-900 leading-none mb-2">{selectedDate.toLocaleDateString('default', { weekday: 'long' })}</h2>
                <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-white border border-gray-100 px-3 py-1.5 rounded-full inline-flex">
                  <CalendarDays size={12} className="mr-2 text-blue-500" />
                  {selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase shadow-md">
                {selectedDayItems.length} Sync Points
              </div>
            </div>

            {selectedDayItems.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-[50px] p-20 text-center flex flex-col items-center animate-fade-in">
                 <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6"><Clock size={40} /></div>
                 <h3 className="google-font text-xl font-black text-gray-900 mb-2">No data yet</h3>
                 <p className="text-gray-400 text-xs">Syncing with hub in background...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedDayItems.map((item) => {
                  const { type, venue } = parseVenueData(item.venue);
                  const typeConfig = EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];
                  const old = isOldActivity(item);
                  const isNow = isCurrentActivity(item);
                  const isSyncing = item.isSyncing;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`group bg-white p-6 md:p-8 rounded-[40px] border transition-all relative overflow-hidden flex flex-col ${
                        old ? 'opacity-60 bg-gray-50/50' : isNow ? 'border-blue-400 shadow-xl ring-1 ring-blue-100' : 'border-gray-100'
                      } ${isSyncing ? 'border-blue-200 animate-pulse' : ''}`}
                    >
                      {isNow && !old && <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 animate-[shimmer_2s_infinite_linear]"></div>}
                      <div className={`absolute top-0 left-0 w-2 h-full ${old ? 'bg-gray-300' : isSyncing ? 'bg-blue-300' : typeConfig.color}`}></div>
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center ${old ? 'bg-gray-200 text-gray-500' : isSyncing ? 'bg-blue-50 text-blue-400' : `${typeConfig.light} ${typeConfig.text}`}`}>
                            {isSyncing ? <RefreshCw size={10} className="mr-1.5 animate-spin" /> : old && <CheckCircle2 size={10} className="mr-1.5" />}
                            {isSyncing ? 'SYNCING' : old ? 'ARCHIVED' : typeConfig.label}
                          </span>
                        </div>
                        
                        {user.isCourseRep && !isSyncing && (
                          <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-white border border-gray-100 text-gray-400 hover:text-red-600 rounded-xl shadow-sm"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                        <div className="flex-grow">
                          <h4 className={`google-font text-3xl font-black mb-2 leading-none tracking-tight ${old ? 'text-gray-400' : isSyncing ? 'text-blue-500' : 'text-gray-900'}`}>{item.courseCode}</h4>
                          <p className={`text-[11px] font-bold uppercase tracking-widest ${old ? 'text-gray-300' : 'text-gray-400'}`}>{COURSE_LIST.find(c => c.code === item.courseCode)?.title}</p>
                        </div>
                        <div className="flex flex-col md:items-end space-y-3">
                          <div className="flex items-center text-gray-500 font-bold">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-3 ${old ? 'bg-gray-100 text-gray-300' : isNow ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-500'}`}><Clock size={20} /></div>
                            <div className="text-left md:text-right">
                              <p className="text-[8px] uppercase font-black text-gray-300 mb-0.5">TIME</p>
                              <p className="text-lg font-black">{item.startTime} - {item.endTime}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-500 font-bold">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mr-3 bg-gray-100/50 text-gray-400">{item.isOnline ? <Video size={18} /> : <MapPin size={18} />}</div>
                        <div>
                          <p className="text-[8px] uppercase font-black text-gray-300 mb-0.5">LOCUS</p>
                          <p className="text-base font-black truncate max-w-[200px]">{item.isOnline ? 'CLOUD SYNC' : venue}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Schedule;
