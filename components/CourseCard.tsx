
import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  // Determine color theme based on course prefix for the icon container
  const getPrefixTheme = (id: string) => {
    // Handle prefixes like CHM, COS, MTH, PHY, BIO, GST
    const prefixMatch = id.match(/^[A-Z]+/);
    const prefix = prefixMatch ? prefixMatch[0].toUpperCase() : '';

    switch (prefix) {
      case 'CHM': return { bg: 'bg-rose-50', text: 'text-rose-500', icon: '🧪' };
      case 'COS': return { bg: 'bg-indigo-50', text: 'text-indigo-500', icon: '💻' };
      case 'MTH': 
      case 'MATH': return { bg: 'bg-amber-50', text: 'text-amber-500', icon: '📐' };
      case 'PHY': return { bg: 'bg-sky-50', text: 'text-sky-500', icon: '🔭' };
      case 'BIO': return { bg: 'bg-emerald-50', text: 'text-emerald-500', icon: '🧬' };
      case 'GST': return { bg: 'bg-violet-50', text: 'text-violet-500', icon: '📝' };
      case 'ENG': return { bg: 'bg-orange-50', text: 'text-orange-500', icon: '📏' };
      case 'EEE': return { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: '⚡' };
      case 'CVE': return { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: '🏗️' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-500', icon: '📚' };
    }
  };

  const theme = getPrefixTheme(course.id);

  return (
    <Link 
      to={`/course/${course.id}`}
      className="group flex flex-col p-4 md:p-6 transition-all duration-300 hover:bg-slate-50 active:bg-slate-100 rounded-[2rem]"
    >
      <div className="flex items-center gap-6">
        {/* Icon Container */}
        <div className={`flex-shrink-0 w-16 h-16 ${theme.bg} rounded-[1.5rem] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-sm`}>
          <span className="text-2xl">{theme.icon}</span>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {course.id}
            </h3>
          </div>
          <p className="text-slate-500 font-bold text-sm truncate">
            {course.title}
          </p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
            {course.instructor || 'Staff Faculty'}
          </p>
        </div>

        {/* Arrow Indicator */}
        <div className="flex-shrink-0 text-slate-200 group-hover:text-indigo-600 transition-colors ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
