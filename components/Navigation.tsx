
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, CalendarDays, MapPinned, Settings2 } from 'lucide-react';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Courses', path: '/courses', icon: <LayoutGrid size={22} /> },
    { label: 'Schedule', path: '/schedule', icon: <CalendarDays size={22} /> },
    { label: 'Guide', path: '/guide', icon: <MapPinned size={22} /> },
    { label: 'Settings', path: '/settings', icon: <Settings2 size={22} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 md:h-20 bottom-nav-blur border-t border-gray-200/50 flex items-center justify-around px-2 z-50 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-all duration-300 relative ${
              isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full"></span>
            )}
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50/50' : 'transparent'}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
