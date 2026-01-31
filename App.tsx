
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, Material, ScheduleItem } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import AddMaterial from './pages/AddMaterial';
import Schedule from './pages/Schedule';
import AddSchedule from './pages/AddSchedule';
import EditSchedule from './pages/EditSchedule';
import Guide from './pages/Guide';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';
import { Bell, RefreshCw, WifiOff } from 'lucide-react';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ich_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [cachedMaterials, setCachedMaterials] = useState<Record<string, Material[]>>(() => {
    const saved = localStorage.getItem('ich_materials_cache');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [cachedSchedules, setCachedSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('ich_schedules_cache');
    return saved ? JSON.parse(saved) : [];
  });

  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [syncError, setSyncError] = useState<boolean>(false);
  const [pendingMaterials, setPendingMaterials] = useState<Material[]>([]);
  const [pendingSchedules, setPendingSchedules] = useState<ScheduleItem[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('ich_materials_cache', JSON.stringify(cachedMaterials));
  }, [cachedMaterials]);

  useEffect(() => {
    localStorage.setItem('ich_schedules_cache', JSON.stringify(cachedSchedules));
  }, [cachedSchedules]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ich_current_user', JSON.stringify(userData));
    navigate('/courses');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ich_current_user');
    localStorage.removeItem('ich_materials_cache');
    localStorage.removeItem('ich_schedules_cache');
    navigate('/login');
  };

  const refreshMaterials = useCallback(async (courseCode: string) => {
    setIsGlobalSyncing(true);
    setSyncError(false);
    try {
      const freshData = await dbService.getMaterials(courseCode);
      setCachedMaterials(prev => ({ ...prev, [courseCode]: freshData }));
    } catch (err) {
      console.error("Background material sync failed", err);
      setSyncError(true);
    } finally {
      setIsGlobalSyncing(false);
    }
  }, []);

  const refreshSchedules = useCallback(async () => {
    setIsGlobalSyncing(true);
    setSyncError(false);
    try {
      const freshData = await dbService.getSchedules();
      setCachedSchedules(freshData);
    } catch (err) {
      console.error("Background schedule sync failed", err);
      setSyncError(true);
    } finally {
      setIsGlobalSyncing(false);
    }
  }, []);

  const startMaterialUpload = useCallback(async (item: Omit<Material, 'id' | 'uploadedAt'>) => {
    const tempId = `temp-${Date.now()}`;
    const newItem: Material = {
      ...item,
      id: tempId,
      uploadedAt: new Date().toISOString(),
      isSyncing: true
    };

    setPendingMaterials(prev => [newItem, ...prev]);
    setIsGlobalSyncing(true);

    try {
      await dbService.addMaterial(item);
      await refreshMaterials(item.courseCode);
      setPendingMaterials(prev => prev.filter(p => p.id !== tempId));
    } catch (err) {
      alert("Upload failed. We'll keep trying in the background.");
      setPendingMaterials(prev => prev.filter(p => p.id !== tempId));
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [refreshMaterials]);

  const startScheduleUpload = useCallback(async (item: Omit<ScheduleItem, 'id'>) => {
    const tempId = `temp-${Date.now()}`;
    const newItem: ScheduleItem = {
      ...item,
      id: tempId,
      isSyncing: true
    };

    setPendingSchedules(prev => [newItem, ...prev]);
    setIsGlobalSyncing(true);

    try {
      await dbService.addSchedule(item);
      await refreshSchedules();
      setPendingSchedules(prev => prev.filter(p => p.id !== tempId));
    } catch (err) {
      setPendingSchedules(prev => prev.filter(p => p.id !== tempId));
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [refreshSchedules]);

  const startScheduleUpdate = useCallback(async (id: string, item: Omit<ScheduleItem, 'id'>) => {
    setIsGlobalSyncing(true);
    try {
      await dbService.updateSchedule(id, item);
      await refreshSchedules();
    } catch (err) {
      console.error("Update failed", err);
      throw err;
    } finally {
      setIsGlobalSyncing(false);
    }
  }, [refreshSchedules]);

  const startScheduleDelete = useCallback(async (id: string) => {
    setIsGlobalSyncing(true);
    try {
      const success = await dbService.deleteSchedule(id);
      if (success) {
        setCachedSchedules(prev => prev.filter(s => s.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Delete failed", err);
      return false;
    } finally {
      setIsGlobalSyncing(false);
    }
  }, []);

  const showNav = user && !['/login', '/register'].includes(location.pathname);
  const mainTabs = ['/courses', '/schedule', '/guide', '/settings'];
  const showHeaderIcons = user && mainTabs.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0">
      {showHeaderIcons && (
        <div className="fixed top-6 right-6 z-[70] flex items-center space-x-3 animate-fade-in">
          {syncError ? (
            <div className="flex items-center space-x-2 bg-amber-500 text-white px-4 py-2.5 rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-widest animate-pulse">
              <WifiOff size={14} />
              <span>Offline Mode</span>
            </div>
          ) : isGlobalSyncing && (
            <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right duration-500">
              <RefreshCw size={14} className="animate-spin" />
              <span>Updating Hub</span>
            </div>
          )}
          <button 
            className="p-2.5 bg-white border border-gray-100 rounded-2xl shadow-xl text-gray-500 hover:text-blue-600 transition-all group active:scale-90"
            onClick={() => alert('Check your connection if updates are not appearing.')}
          >
            <div className="relative">
              <Bell size={18} className="group-hover:rotate-12 transition-transform" />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 border-2 border-white rounded-full ${syncError ? 'bg-amber-500' : 'bg-blue-600'}`}></span>
            </div>
          </button>
        </div>
      )}

      <main className="flex-grow w-full">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/courses" />} />
          <Route path="/register" element={!user ? <Register onRegister={handleLogin} /> : <Navigate to="/courses" />} />
          
          <Route path="/courses" element={user ? <CourseList user={user} /> : <Navigate to="/login" />} />
          <Route 
            path="/courses/:code" 
            element={user ? (
              <CourseDetail 
                user={user} 
                cachedMaterials={cachedMaterials} 
                pendingMaterials={pendingMaterials} 
                onRefresh={refreshMaterials}
                syncError={syncError}
                onDeleteLocal={(id, code) => setCachedMaterials(prev => ({
                  ...prev,
                  [code]: prev[code].filter(m => m.id !== id)
                }))}
              />
            ) : <Navigate to="/login" />} 
          />
          <Route path="/courses/:code/add" element={user ? <AddMaterial user={user} onUpload={startMaterialUpload} /> : <Navigate to="/login" />} />
          
          <Route 
            path="/schedule" 
            element={user ? (
              <Schedule 
                user={user} 
                cachedSchedules={cachedSchedules} 
                pendingSchedules={pendingSchedules} 
                onRefresh={refreshSchedules}
                syncError={syncError}
                onDelete={startScheduleDelete}
              />
            ) : <Navigate to="/login" />} 
          />
          <Route path="/schedule/add" element={user ? <AddSchedule user={user} onAdd={startScheduleUpload} /> : <Navigate to="/login" />} />
          <Route path="/schedule/edit/:id" element={user ? <EditSchedule user={user} cachedSchedules={cachedSchedules} onUpdate={startScheduleUpdate} /> : <Navigate to="/login" />} />
          
          <Route path="/guide" element={user ? <Guide /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          
          <Route path="/" element={<Navigate to={user ? "/courses" : "/login"} />} />
        </Routes>
      </main>

      {showNav && <Navigation />}
    </div>
  );
};

export default App;
