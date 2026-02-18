
import React, { useState } from 'react';
import { Schedule, COURSES } from '../types';
import { Icons } from '../icons';
import { formatTo12Hr, getStatusInfo, parseDatabaseDate, formatDateLocal } from '../helpers';

export const ScheduleCard: React.FC<{ 
  schedule: Schedule; 
  isAdmin: boolean; 
  customIcons: Record<string, string>;
  onEdit: (s: Schedule) => void;
  onDelete: (id: string) => void;
  onViewDoc: (s: Schedule) => void;
  viewDate?: string; // The date currently being viewed in the dashboard/history
}> = ({ schedule, isAdmin, customIcons, onEdit, onDelete, onViewDoc, viewDate }) => {
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const isOnline = schedule.type === 'Online';
  const isAssignment = schedule.category === 'assignment';
  const isActivity = schedule.category === 'activity';

  // Contextual Logic for Assignments
  const isViewingGivenDate = isAssignment && viewDate === schedule.givenDate;
  const isViewingDueDate = isAssignment && viewDate === schedule.date;
  
  // Default status for classes/activities
  const status = getStatusInfo(schedule.date, schedule.time, schedule.type);

  // Styling based on category and context
  let accentColor = isAssignment ? 'text-rose-400' : isActivity ? 'text-indigo-400' : 'text-blue-400';
  let accentBg = isAssignment ? 'bg-rose-500/10' : isActivity ? 'bg-indigo-500/10' : 'bg-blue-500/10';
  let barColor = isAssignment ? 'bg-rose-500' : isActivity ? 'bg-indigo-500' : 'bg-blue-500';

  // Override styling if viewing the "Assigned" state of an assignment
  if (isViewingGivenDate) {
    accentColor = 'text-emerald-400';
    accentBg = 'bg-emerald-500/10';
    barColor = 'bg-emerald-500';
  }

  const isLive = status?.label === 'Live Now';
  const hasMultipleAttachments = (schedule.attachments?.length || 0) > 1;
  const hasLongComments = schedule.instructions && schedule.instructions.length > 120;

  // Calculate days difference for assignments
  const getDaysDiff = () => {
    if (!schedule.givenDate || !schedule.date) return null;
    const start = parseDatabaseDate(schedule.givenDate).getTime();
    const end = parseDatabaseDate(schedule.date).getTime();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const daysDiff = getDaysDiff();

  return (
    <div className="google-card p-6 flex flex-col h-full animate-fade-in relative group overflow-hidden">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${barColor} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-wrap gap-2">
          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${accentBg} ${accentColor} border border-white/5`}>
            {isViewingGivenDate ? 'ASSIGNED' : isViewingDueDate ? 'DEADLINE' : schedule.category}
          </div>
          
          {isAssignment && daysDiff !== null && (
            <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-400 border border-white/5">
              {daysDiff} Day Window
            </div>
          )}

          {!isAssignment && status && (
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
              <Icons.Edit />
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
               {isAssignment ? <Icons.File /> : <Icons.Calendar />}
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
        {/* Date Logic */}
        <div className="flex items-start gap-4">
           <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:${accentColor} transition-colors`}>
             <Icons.Calendar />
           </div>
           <div className="min-w-0 space-y-2">
             {schedule.givenDate && (
                <div className={isViewingGivenDate ? 'ring-2 ring-emerald-500/20 p-2 rounded-lg -ml-2' : ''}>
                   <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isViewingGivenDate ? 'text-emerald-500' : 'text-slate-500'}`}>Assigned On</p>
                   <p className="text-xs font-bold text-slate-300">
                     {parseDatabaseDate(schedule.givenDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                   </p>
                </div>
             )}
             <div className={isViewingDueDate ? 'ring-2 ring-rose-500/20 p-2 rounded-lg -ml-2' : ''}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isViewingDueDate ? 'text-rose-500' : 'text-blue-500'}`}>{isAssignment ? 'Submission Date' : 'Event Date'}</p>
                <p className="text-xs font-bold text-white tracking-tight">
                  {parseDatabaseDate(schedule.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                {!isAssignment && <p className="text-[11px] font-medium text-slate-500">Starts at {formatTo12Hr(schedule.time)}</p>}
                {isAssignment && isViewingGivenDate && (
                  <p className="text-[11px] font-medium text-emerald-500/80">Available for submission</p>
                )}
             </div>
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

        {/* Instructions / Comments Section */}
        {schedule.instructions && (
          <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] transition-all duration-300">
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lecturer's Comments</span>
                </div>
                {hasLongComments && (
                  <button 
                    onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                    className="text-[8px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    {isCommentsExpanded ? 'Show Less' : 'Show More'}
                    <div className={`transition-transform duration-300 ${isCommentsExpanded ? 'rotate-180' : ''}`}>
                      <Icons.ChevronLeft />
                    </div>
                  </button>
                )}
             </div>
             <p className={`text-xs text-slate-400 font-medium leading-relaxed italic ${!isCommentsExpanded ? 'line-clamp-3' : ''}`}>
               "{schedule.instructions}"
             </p>
          </div>
        )}
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
            {isAssignment ? 'Institutional Task' : 'In-Person Session'}
          </div>
        )}
        
        {(schedule.attachments?.length || 0) > 0 && (
          <button 
            onClick={() => onViewDoc(schedule)} 
            className="w-full h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all btn-feedback shadow-sm relative"
          >
             <Icons.File /> 
             {hasMultipleAttachments ? `Study Materials (${schedule.attachments?.length})` : 'Study Materials'}
             {hasMultipleAttachments && (
                <div className="absolute top-1 right-1 px-2 py-0.5 bg-blue-600 rounded-full text-[8px] text-white font-black uppercase tracking-widest shadow-sm">
                  Gallery
                </div>
             )}
          </button>
        )}
      </div>
    </div>
  );
};
