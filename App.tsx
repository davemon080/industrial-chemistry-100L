import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import Settings from './pages/Settings';
import Schedule from './pages/Schedule';
import Layout from './components/Layout';
import { User, Course, ScheduleEvent, UserPreferences, Notification } from './types';
import { MOCK_COURSES } from './data/mockData';
import { getAllItems, saveItem, deleteItem } from './services/dbService';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [userReminders, setUserReminders] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('user_reminders');
    return saved ? JSON.parse(saved) : {};
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    notificationsEnabled: true,
    defaultLeadTimes: { class: 30, assignment: 1440, test: 120, exam: 2880 }
  });

  // Initial Load from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedCourses = await getAllItems<Course>('courses');
        const storedEvents = await getAllItems<ScheduleEvent>('events');
        
        setCourses(storedCourses.length > 0 ? storedCourses : MOCK_COURSES);
        setEvents(storedEvents);
        
        const savedPrefs = localStorage.getItem('user_prefs');
        if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
        
        const savedNotifs = localStorage.getItem('notifications');
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      } catch (e) {
        console.error("DB Load Error", e);
        setCourses(MOCK_COURSES);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('user_reminders', JSON.stringify(userReminders));
  }, [userReminders]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const addCourse = async (c: Course) => {
    setCourses(prev => [...prev, c]);
    await saveItem('courses', c);
  };

  const updateCourse = async (c: Course) => {
    setCourses(prev => prev.map(x => x.id === c.id ? c : x));
    await saveItem('courses', c);
  };

  const handleDeleteCourse = async (id: string) => {
    setCourses(prev => prev.filter(x => x.id !== id));
    await deleteItem('courses', id);
  };

  const updateEvents = async (newEvents: ScheduleEvent[]) => {
    setEvents(newEvents);
    // Cleanup deleted events from DB
    const currentEventIds = new Set(newEvents.map(e => e.id));
    const allStored = await getAllItems<ScheduleEvent>('events');
    for (const stored of allStored) {
      if (!currentEventIds.has(stored.id)) {
        await deleteItem('events', stored.id);
      }
    }
    // Save/Update new events
    for (const event of newEvents) {
      await saveItem('events', event);
    }
  };

  const toggleReminder = (eventId: string) => {
    setUserReminders(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Academic Data</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
      />
      <Route 
        path="/" 
        element={user ? (
          <Layout 
            user={user} 
            onLogout={handleLogout} 
            notifications={notifications} 
            onMarkRead={() => setNotifications(n => n.map(x => ({...x, isRead: true})))} 
            onClear={() => setNotifications([])} 
          />
        ) : (
          <Navigate to="/login" replace />
        )} 
      >
        <Route index element={
          <Dashboard 
            courses={courses} 
            user={user!} 
            notifications={notifications} 
            onAddCourse={addCourse} 
            onUpdateCourse={updateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        } />
        <Route path="schedule" element={
          <Schedule 
            events={events} 
            courses={courses} 
            onUpdateEvents={updateEvents} 
            userReminders={userReminders} 
            onToggleReminder={toggleReminder} 
            preferences={preferences} 
            user={user!} 
          />
        } />
        <Route path="settings" element={
          <Settings 
            user={user!} 
            onLogout={handleLogout} 
            preferences={preferences} 
            onUpdatePrefs={setPreferences} 
            onUpdateUser={(u) => { 
              setUser(u); 
              localStorage.setItem('user', JSON.stringify(u)); 
            }} 
          />
        } />
        <Route path="course/:courseId" element={<CourseDetail courses={courses} onUpdateCourse={updateCourse} user={user!} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;