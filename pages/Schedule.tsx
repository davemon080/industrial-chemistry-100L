
import React, { useState, useMemo } from 'react';
import { ScheduleEvent, Course, EventType, UserPreferences, User } from '../types';
import RestrictedAccess from '../components/RestrictedAccess';

interface ScheduleProps {
  events: ScheduleEvent[];
  courses: Course[];
  onUpdateEvents: (events: ScheduleEvent[]) => void;
  userReminders: Record<string, boolean>;
  onToggleReminder: (id: string) => void;
  preferences: UserPreferences;
  user: User;
}

type ViewMode = 'agenda' | 'calendar';

const Schedule: React.FC<ScheduleProps> = ({ events, courses, onUpdateEvents, userReminders, onToggleReminder, preferences, user }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isRepMode, setIsRepMode] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  const isSubscribed = user.subscription?.status === 'active';

  // Form states...
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('class');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todayDisplay = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleOpenModal = (event?: ScheduleEvent) => {
    if (event) {
      setEditingEvent(event); setTitle(event.title); setType(event.type); setCourseId(event.courseId);
      setDate(event.date); setTime(event.time); setLocation(event.location); setDescription(event.description);
    } else { 
      setTitle(''); setType('class'); setCourseId(courses[0]?.id || ''); setDate(todayStr); setTime('');
      setLocation(''); setDescription(''); setEditingEvent(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: ScheduleEvent = {
      id: editingEvent?.id || `event_${Date.now()}`,
      title, type, courseId, date, time, location, description,
    };
    onUpdateEvents(editingEvent ? events.map(ev => ev.id === editingEvent.id ? newEvent : ev) : [...events, newEvent]);
    setIsModalOpen(false);
  };

  const filteredEvents = useMemo(() => {
    let list = events;
    if (!showAllEvents && viewMode === 'agenda') {
      list = events.filter(e => e.date === todayStr);
    }
    return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
  }, [events, todayStr, showAllEvents, viewMode]);

  const getEventTheme = (type: EventType) => {
    switch (type) {
      case 'exam': return { color: 'bg-rose-500', label: 'Examination', icon: '📝' };
      case 'test': return { color: 'bg-amber-500', label: 'Assessment', icon: '⏱️' };
      case 'assignment': return { color: 'bg-emerald-500', label: 'Deadline', icon: '📎' };
      default: return { color: 'bg-indigo-600', label: 'Lecture', icon: '🏛️' };
    }
  };

  return (
    <div className="animate-in fade-in duration-700 relative h-full">
      {!isSubscribed && (
        <RestrictedAccess 
          title="Master Schedule Locked" 
          description="A Pro membership is required to access your academic calendar and automated course reminders." 
        />
      )}

      <div className={!isSubscribed ? 'blur-md pointer-events-none grayscale opacity-60 transition-all duration-700' : ''}>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] block">Academic Command Center</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {viewMode === 'agenda' ? (showAllEvents ? 'Master Schedule' : "Today's Agenda") : 'Academic Calendar'}
            </h1>
            <p className="text-slate-400 font-bold text-sm">
              {viewMode === 'agenda' ? todayDisplay : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-1 bg-slate-100 rounded-xl flex">
              <button onClick={() => setViewMode('agenda')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'agenda' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Agenda</button>
              <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Calendar</button>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
            <button onClick={() => setIsRepMode(!isRepMode)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isRepMode ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {isRepMode ? 'Exit Admin Mode' : 'Course Rep Mode'}
            </button>
          </div>
        </header>

        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-6 md:p-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={() => changeMonth(1)} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-4">{day}</div>))}
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`pad-${idx}`} className="aspect-square bg-slate-50/30 rounded-2xl md:rounded-[2rem]" />;
                const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dayStr);
                const isToday = dayStr === todayStr;
                return (
                  <div key={dayStr} className={`relative aspect-square rounded-2xl md:rounded-[2rem] border p-2 flex flex-col transition-all group/day ${isToday ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 bg-white'}`}>
                    <span className={`text-[10px] font-black ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day.getDate()}</span>
                    <div className="flex flex-wrap gap-1 mt-auto">{dayEvents.slice(0, 3).map(e => (<div key={e.id} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getEventTheme(e.type).color}`} />))}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-10 pb-24 relative">
            {filteredEvents.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Agenda is Clear</h3>
                <p className="text-slate-400 font-medium mt-2">No schedules detected.</p>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const theme = getEventTheme(event.type);
                const reminderActive = userReminders[event.id];
                return (
                  <div key={event.id} className="relative pl-12 md:pl-20">
                    <div className={`absolute left-2.5 md:left-6.5 top-10 w-4 h-4 rounded-full border-4 border-white shadow-md z-10 ${theme.color}`} />
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-200">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${theme.color}`}>{theme.label}</span>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{event.title}</h3>
                          <p className="text-slate-500 text-sm">{event.description}</p>
                        </div>
                        <button onClick={() => onToggleReminder(event.id)} className={`p-3 rounded-xl border ${reminderActive ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300'}`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
