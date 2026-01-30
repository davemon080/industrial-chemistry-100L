
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, Page } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import Schedule from './pages/Schedule';
import Guide from './pages/Guide';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';
import { Bell } from 'lucide-react';

const App: React.FC = () => {
  // Initialize state directly from localStorage to prevent login-flash on reload
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ich_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ich_current_user', JSON.stringify(userData));
    navigate('/courses');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ich_current_user');
    navigate('/login');
  };

  const showNav = user && !['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0">
      {/* Global Notification Icon - Positioned relative to the whole body */}
      {showNav && (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50 animate-fade-in">
          <button 
            className="p-3 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-lg text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all group active:scale-95"
            onClick={() => alert('No new notifications')}
          >
            <div className="relative">
              <Bell size={20} className="md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 border-2 border-white rounded-full animate-pulse"></span>
            </div>
          </button>
        </div>
      )}

      {/* Main content area now fills the whole body width */}
      <main className="flex-grow w-full">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/courses" />} />
          <Route path="/register" element={!user ? <Register onRegister={handleLogin} /> : <Navigate to="/courses" />} />
          
          <Route path="/courses" element={user ? <CourseList user={user} /> : <Navigate to="/login" />} />
          <Route path="/courses/:code" element={user ? <CourseDetail user={user} /> : <Navigate to="/login" />} />
          <Route path="/schedule" element={user ? <Schedule /> : <Navigate to="/login" />} />
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
