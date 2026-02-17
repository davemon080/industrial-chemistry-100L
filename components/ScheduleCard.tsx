
import React from 'react';
import { Schedule, COURSES } from '../types';
import { Icons } from '../icons';
import { formatTo12Hr, getStatusInfo, parseDatabaseDate } from '../helpers';

export const ScheduleCard: React.FC<{ 
  schedule: Schedule; 
  isAdmin: boolean; 
  customIcons: Record<string, string>;
  onEdit: (s: Schedule) => void;
  onDelete: (id: string) => void;
  onViewDoc: (s: Schedule) => void;
}> = ({ schedule, isAdmin, customIcons, onEdit, onDelete, onViewDoc }) => {
  const isOnline = schedule.type === 'Online';
  const status = getStatusInfo(schedule.date, schedule.time, schedule.type);
  const isAssignment = schedule.category === 'assignment';
  const isActivity = schedule.category === 'activity';
  
  const accentColor = isAssignment ? 'text-rose-400' : isActivity ? 'text-indigo-400' : 'text-blue-400';
  const accentBg = isAssignment ? 'bg-rose-500/10' : isActivity ? 'bg-indigo-500/10' : 'bg-blue-500/10';
  const barColor = isAssignment ? 'bg-rose-500' : isActivity ? 'bg-indigo-500' : 'bg-blue-500';

  const isLive = status?.label === 'Live Now';

  return (
    <div className="google-card p-6 flex flex-col h-full animate-fade-in relative group overflow-hidden">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${barColor} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-wrap gap-2">
          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${accentBg} ${accentColor} border border-white/5`}>
            {schedule.category}
          </div>
          {status && (
            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${status.color} border border-white/5`}>
              {status.label}
            </div>
          )}
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(schedule)} 
              className="p-2 text-slate-500 hover:text-blue-400 bg-white/5 rounded-xl transition-all btn-feedback"
              title="Edit Schedule"
            >
              <Icons.Save />
            </button>
            <button 
              onClick={() => onDelete(schedule.id)} 
              className="p-2 text-slate-500 hover:text-rose-500 bg-white/5 rounded-xl transition-all btn-feedback"
              title="Delete Schedule"
            >
              <Icons.Trash />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 shrink-0 bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-3 shadow-inner group-hover:bg-white/10 transition-colors mt-0.5">
           {schedule.course && customIcons[schedule.course] ? (
             <img src={customIcons[schedule.course]} className="w-full h-full object-contain" alt="course" />
           ) : (
             <div className={`w-full h-full flex items-center justify-center ${accentColor}`}>
               <Icons.Calendar />
             </div>
           )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white text-xl leading-tight tracking-tight whitespace-normal break-words">
            {isActivity ? schedule.title : (schedule.course ? COURSES[schedule.course] : 'General Event')}
          </h3>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1.5">
            {schedule.course || 'Institutional Event'}
          </p>
        </div>
      </div>

      <div className="space-y-4 flex-grow">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-blue-400 transition-colors">
             <Icons.Calendar />
           </div>
           <div className="min-w-0">
             <p className="text-xs font-bold text-white tracking-tight">
               {parseDatabaseDate(schedule.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
             </p>
             <p className="text-[11px] font-medium text-slate-500">Starts at {formatTo12Hr(schedule.time)}</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 group-hover:text-emerald-400 transition-colors">
             {isOnline ? <Icons.ExternalLink /> : <Icons.Shield />}
           </div>
           <div className="min-w-0 flex-1 overflow-hidden">
             <p className="text-xs font-bold text-white truncate">{isOnline ? 'Online Meeting' : schedule.location}</p>
             <p className="text-[11px] font-medium text-slate-500 truncate">{isOnline ? 'Network Hub' : 'Physical Location'}</p>
           </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {isOnline ? (
          <a 
            href={schedule.location} 
            target="_blank" 
            rel="noreferrer" 
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all btn-feedback shadow-lg ${isLive ? 'live-pulse-red text-white shadow-rose-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10'}`}
          >
             {isLive ? (
               <>
                 <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                 Live Now
               </>
             ) : (
               <>
                 <Icons.ExternalLink /> Join Class
               </>
             )}
          </a>
        ) : (
          <div className="w-full h-14 bg-white/5 border border-white/5 text-slate-600 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest cursor-default">
            In-Person Session
          </div>
        )}
        
        {schedule.attachment && (
          <button 
            onClick={() => onViewDoc(schedule)} 
            className="w-full h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all btn-feedback shadow-sm"
          >
             <Icons.File /> Study Materials
          </button>
        )}
      </div>
    </div>
  );
};
