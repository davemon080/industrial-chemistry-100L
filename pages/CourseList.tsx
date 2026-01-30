
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSE_LIST } from '../constants';
import { ChevronRight, Sparkles } from 'lucide-react';
import { User } from '../types';

interface Props {
  user: User;
}

const CourseList: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-6">
      <header className="mb-10 animate-fade-in delay-100">
        <div className="flex items-center space-x-2 text-blue-600 mb-2">
          <Sparkles size={18} className="animate-pulse" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase">{getGreeting()}</span>
        </div>
        <h1 className="google-font text-4xl font-extrabold text-gray-900 leading-tight">
          Welcome back,<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            {user.matricNumber}
          </span>
        </h1>
        <p className="text-gray-500 mt-3 text-lg font-medium">
          Ready to dive into your 100L modules?
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {COURSE_LIST.map((course, index) => (
          <div
            key={course.code}
            onClick={() => navigate(`/courses/${course.code}`)}
            className="group bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center justify-between overflow-hidden relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
            
            <div className="relative z-10">
              <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase mb-1 block opacity-70">
                Course Module
              </span>
              <h3 className="google-font text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {course.code}
              </h3>
              <p className="text-gray-500 text-sm mt-1 font-medium group-hover:text-gray-700 transition-colors line-clamp-1">
                {course.title}
              </p>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all duration-300 shadow-sm">
              <ChevronRight size={24} strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-gradient-to-br from-gray-900 to-blue-900 rounded-[40px] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h4 className="google-font text-xl font-bold mb-2">Student Progress</h4>
          <p className="text-blue-100 text-sm mb-6 max-w-xs">You've accessed 4 out of 9 modules this week. Keep up the momentum!</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="w-[44%] h-full bg-blue-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseList;
