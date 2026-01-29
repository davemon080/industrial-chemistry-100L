
import React, { useState, useMemo, useRef } from 'react';
import { ScheduleEvent, Course, EventType, UserPreferences, User, Attachment } from '../types';
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubscribed = user.subscription?.status === 'active';
  const isRep = user.role === 'rep';

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('class');
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationType, setLocationType] = useState<'physical' | 'online'>('physical');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionType, setSubmissionType] = useState<'physical' | 'online'>('online');
  const [submissionLocation, setSubmissionLocation] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<Attachment | null>(null);
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
      setEditingEvent(event); 
      setTitle(event.title); 
      setType(event.type); 
      setCourseId(event.courseId);
      setDate(event.date); 
      setTime(event.time); 
      setLocation(event.location);
      setLocationType(event.isVirtual ? 'online' : 'physical');
      setMeetingLink(event.meetingLink || '');
      setSubmissionLink(event.submissionLink || '');
      setSubmissionType(event.submissionType || 'online');
      setSubmissionLocation(event.submissionLocation || '');
      setAssignmentFile(event.assignmentFile || null);
      setDescription(event.description);
    } else { 
      setTitle(''); 
      setType('class'); 
      setCourseId(courses[0]?.id || ''); 
      setDate(selectedDay || todayStr); 
      setTime('');
      setLocation('');
      setLocationType('physical');
      setMeetingLink('');
      setSubmissionLink('');
      setSubmissionType('online');
      setSubmissionLocation('');
      setAssignmentFile(null);
      setDescription(''); 
      setEditingEvent(null);
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAssignmentFile({
        name: file.name,
        url: event.target?.result as string,
        timestamp: Date.now()
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Remove this event from the master schedule for everyone?')) {
      onUpdateEvents(events.filter(e => e.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: ScheduleEvent = {
      id: editingEvent?.id || `event_${Date.now()}`,
      title, 
      type, 
      courseId, 
      date, 
      time, 
      location: type === 'assignment' 
        ? (submissionType === 'physical' ? `Submit: ${submissionLocation}` : 'Online Submission')
        : (locationType === 'online' ? 'Online Portal' : location), 
      isVirtual: locationType === 'online' || type === 'assignment' && submissionType === 'online',
      submissionType: type === 'assignment' ? submissionType : undefined,
      submissionLocation: type === 'assignment' && submissionType === 'physical' ? submissionLocation : undefined,
      assignmentFile: type === 'assignment' ? (assignmentFile || undefined) : undefined,
      meetingLink: (type === 'class' || type === 'test' || type === 'exam') && locationType === 'online' ? meetingLink : undefined,
      submissionLink: type === 'assignment' && submissionType === 'online' ? submissionLink : undefined,
      description,
    };
    onUpdateEvents(editingEvent ? events.map(ev => ev.id === editingEvent.id ? newEvent : ev) : [...events, newEvent]);
    setIsModalOpen(false);
  };

  const filteredEvents = useMemo(() => {
    let list = events;
    if (selectedDay) {
      list = events.filter(e => e.date === selectedDay);
    } else if (!showAllEvents && viewMode === 'agenda') {
      list = events.filter(e => e.date === todayStr);
    }
    return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time));
  }, [events, todayStr, showAllEvents, viewMode, selectedDay]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, ScheduleEvent[]> = {};
    filteredEvents.forEach(event => {
      if (!groups[event.date]) groups[event.date] = [];
      groups[event.date].push(event);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
  }, [filteredEvents]);

  const getEventTheme = (type: EventType) => {
    switch (type) {
      case 'exam': return { color: 'bg-rose-500', label: 'Examination', icon: '📝' };
      case 'test': return { color: 'bg-amber-500', label: 'Assessment', icon: '⏱️' };
      case 'assignment': return { color: 'bg-emerald-500', label: 'Deadline', icon: '📎' };
      default: return { color: 'bg-indigo-600', label: 'Lecture', icon: '🏛️' };
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const d = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    if (dateStr === tomorrowStr) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleOpenFile = (file: Attachment) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${file.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 relative h-full pb-20">
      {!isSubscribed && (
        <RestrictedAccess 
          title="Master Schedule Locked" 
          description="A Pro membership is required to access your academic calendar and automated course reminders." 
        />
      )}

      <div className={!isSubscribed ? 'blur-md pointer-events-none grayscale opacity-60 transition-all duration-700' : ''}>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 px-2">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] block mb-2">Academic Timeline</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              {viewMode === 'agenda' ? (selectedDay ? 'Filtered Agenda' : (showAllEvents ? 'Master Schedule' : "Today's Agenda")) : 'Calendar View'}
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-2">
              {selectedDay ? formatDateLabel(selectedDay) : (viewMode === 'agenda' ? todayDisplay : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-1.5 bg-slate-100 rounded-2xl flex shadow-inner">
              <button 
                onClick={() => { setViewMode('agenda'); setSelectedDay(null); }} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'agenda' && !selectedDay ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Agenda
              </button>
              <button 
                onClick={() => setViewMode('calendar')} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Calendar
              </button>
            </div>
            {isRep && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-2xl">
                 <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Rep Controls Enabled</span>
              </div>
            )}
          </div>
        </header>

        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-6 md:p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                 <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Today</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={() => changeMonth(1)} className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-4">{day}</div>))}
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`pad-${idx}`} className="aspect-square bg-slate-50/30 rounded-2xl md:rounded-[2.5rem]" />;
                const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dayStr);
                const isToday = dayStr === todayStr;
                return (
                  <button 
                    key={dayStr} 
                    onClick={() => { setSelectedDay(dayStr); setViewMode('agenda'); }}
                    className={`relative aspect-square rounded-2xl md:rounded-[2.5rem] border p-3 flex flex-col transition-all group/day ${isToday ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                  >
                    <span className={`text-[11px] font-black ${isToday ? 'text-indigo-600' : 'text-slate-400 group-hover/day:text-indigo-400'}`}>{day.getDate()}</span>
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {dayEvents.slice(0, 3).map(e => (
                        <div key={e.id} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${getEventTheme(e.type).color}`} />
                      ))}
                      {dayEvents.length > 3 && <div className="text-[8px] font-black text-slate-300">+{dayEvents.length - 3}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-12 pb-24 relative">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Timeline Stack</h3>
                {!selectedDay && (
                  <button 
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                  >
                    {showAllEvents ? 'Show Today Only' : 'View Master Schedule'}
                  </button>
                )}
                {selectedDay && (
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="h-px flex-1 bg-slate-100 ml-8 hidden sm:block" />
            </div>

            {groupedEvents.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Timeline is Clear</h3>
                <p className="text-slate-400 font-bold mt-2 text-sm">No events scheduled.</p>
              </div>
            ) : (
              groupedEvents.map(([dateKey, dayEvents]) => (
                <div key={dateKey} className="space-y-6">
                  <div className="flex items-center gap-4 sticky top-4 z-20">
                     <span className="bg-slate-900 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                       {formatDateLabel(dateKey)}
                     </span>
                     <div className="h-px flex-1 bg-slate-200/50" />
                  </div>
                  <div className="space-y-6">
                    {dayEvents.map((event) => {
                      const theme = getEventTheme(event.type);
                      const reminderActive = userReminders[event.id];
                      return (
                        <div key={event.id} className="relative group/card animate-in slide-in-from-bottom-2 duration-300">
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[2rem] ${theme.color}`} />
                          <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase text-white shadow-sm ${theme.color}`}>
                                    {theme.label}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.courseId} • {event.type === 'assignment' ? 'DEADLINE' : 'TIME'}: {event.time}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{event.title}</h3>
                                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    {event.isVirtual ? 'Virtual Portal' : event.location}
                                  </div>
                                  <p className="line-clamp-1">{event.description}</p>
                                </div>
                                
                                <div className="flex flex-wrap gap-3 mt-4">
                                  {event.type === 'class' && event.meetingLink && (
                                    <a 
                                      href={event.meetingLink} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                    >
                                      Join Lecture
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                  )}

                                  {event.type === 'assignment' && (
                                    <>
                                      {event.assignmentFile && (
                                        <button 
                                          onClick={() => handleOpenFile(event.assignmentFile!)}
                                          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                                        >
                                          View Task Brief
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        </button>
                                      )}
                                      {event.submissionType === 'online' && event.submissionLink && (
                                        <a 
                                          href={event.submissionLink} target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                        >
                                          Submit Online
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </a>
                                      )}
                                      {event.submissionType === 'physical' && (
                                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                          Physical Submission
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {(event.type === 'test' || event.type === 'exam') && event.meetingLink && (
                                    <a 
                                      href={event.meetingLink} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                                    >
                                      Start Assessment
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </a>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isRep && (
                                  <>
                                    <button 
                                      onClick={() => handleOpenModal(event)} 
                                      className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all hover:bg-white hover:border-indigo-100"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteEvent(event.id)} 
                                      className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-rose-300 hover:text-rose-500 transition-all hover:bg-rose-50 hover:border-rose-100"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => onToggleReminder(event.id)} 
                                  className={`p-4 rounded-2xl border transition-all active:scale-95 ${reminderActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 border-indigo-600' : 'bg-slate-50 text-slate-300 border-slate-100 hover:text-indigo-600 hover:bg-white hover:border-indigo-100'}`}
                                >
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isRep && (
        <button 
          onClick={() => handleOpenModal()} 
          className="fixed bottom-28 right-6 md:bottom-12 md:right-12 w-20 h-20 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all group border-8 border-white"
        >
          <svg className="w-10 h-10 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {/* Event Modal for Course Reps */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-950/40 backdrop-blur-md overflow-hidden">
          <div className="bg-white w-full max-w-2xl md:rounded-[3.5rem] rounded-t-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-12 flex flex-col max-h-[95vh]">
            <div className="p-8 md:p-12 border-b border-slate-50 flex items-center justify-between shrink-0">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{editingEvent ? 'Edit Entry' : 'Post to Timeline'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-6 overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                    <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold appearance-none outline-none focus:bg-white transition-all">
                      <option value="class">Lecture</option>
                      <option value="test">Assessment</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam">Final Exam</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Course Code</label>
                    <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold appearance-none outline-none focus:bg-white transition-all">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Entry Title</label>
                  <input required placeholder="E.g. Mid-term Assessment" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:bg-white transition-all" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{type === 'assignment' ? 'Deadline Date' : 'Date'}</label>
                    <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{type === 'assignment' ? 'Deadline Time' : 'Time'}</label>
                    <input type="time" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>

                {/* Conditional Fields for Assignments */}
                {type === 'assignment' && (
                  <div className="space-y-6 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assignment File (Image or PDF)</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 border-4 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer"
                      >
                         <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                           {assignmentFile ? assignmentFile.name : 'Upload Assignment Task'}
                         </p>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Submission Mode</label>
                      <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button type="button" onClick={() => setSubmissionType('physical')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${submissionType === 'physical' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Physical</button>
                        <button type="button" onClick={() => setSubmissionType('online')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${submissionType === 'online' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Online</button>
                      </div>
                    </div>

                    {submissionType === 'physical' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Submission Venue</label>
                        <input required placeholder="E.g. HOD's Office, Hall 4" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={submissionLocation} onChange={(e) => setSubmissionLocation(e.target.value)} />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Submission Portal Link</label>
                        <input required placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional Fields for Lectures and Assessments */}
                {(type === 'class' || type === 'test' || type === 'exam') && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location Type</label>
                      <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button type="button" onClick={() => setLocationType('physical')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${locationType === 'physical' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Physical</button>
                        <button type="button" onClick={() => setLocationType('online')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${locationType === 'online' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Online</button>
                      </div>
                    </div>
                    {locationType === 'physical' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Venue / Lecture Hall</label>
                        <input required placeholder="E.g. Hall A, 2nd Floor" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{type === 'class' ? 'Class Meeting Link' : 'Assessment Portal Link'}</label>
                        <input required placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Additional Details</label>
                  <textarea placeholder="Outline requirements, materials, or prep instructions..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-24 resize-none outline-none focus:bg-white transition-all" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-indigo-600 shadow-2xl transition-all active:scale-[0.98]">
                {editingEvent ? 'Apply Revisions' : 'Deploy to Master Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
