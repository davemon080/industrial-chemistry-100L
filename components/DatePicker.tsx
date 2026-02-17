
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../icons';
import { formatDateLocal, parseDatabaseDate } from '../helpers';

export const DatePicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
  darkMode?: boolean;
  label?: string;
  inline?: boolean;
}> = ({ value, onChange, label = "Select Date", inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Strictly follow agnostic local midnight parsing for the view state
  const [viewDate, setViewDate] = useState(value ? parseDatabaseDate(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inline) {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [inline]);

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: startDay }, (_, i) => null);

  const handleDateSelect = (day: number) => {
    const selected = new Date(year, month, day);
    onChange(formatDateLocal(selected));
    if (!inline) setIsOpen(false);
  };

  const formattedDate = value ? parseDatabaseDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : label;

  const CalendarUI = (
    <div className={`${inline ? 'w-full' : 'absolute left-0 top-[105%] z-[110] w-full sm:w-[300px] shadow-2xl'} rounded-[12px] p-4 border transition-all bg-[#161a22] border-white/10 text-white ${!inline && 'animate-fade-in'}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-500">
          {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(viewDate)}
        </h4>
        <div className="flex gap-1">
          <button type="button" onClick={() => setViewDate(new Date(year, month - 1))} className="p-1.5 rounded-[8px] transition-all border border-white/5 hover:bg-white/5"><Icons.ChevronLeft /></button>
          <button type="button" onClick={() => setViewDate(new Date(year, month + 1))} className="p-1.5 rounded-[8px] transition-all border border-white/5 hover:bg-white/5"><Icons.ChevronRight /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[9px] font-black text-slate-600 mb-1">{d}</div>
        ))}
        {[...padding, ...days].map((day, idx) => {
          if (!day) return <div key={`p-${idx}`} />;
          const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = value === dayStr;
          const isToday = formatDateLocal(new Date()) === dayStr;

          return (
            <button 
              key={idx} 
              type="button" 
              onClick={() => handleDateSelect(day)} 
              className={`aspect-square flex items-center justify-center rounded-[6px] text-xs font-bold transition-all ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : isToday 
                    ? 'border border-blue-600/50 text-blue-400 font-black'
                    : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        {CalendarUI}
      </div>
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 px-6 rounded-[12px] font-bold text-left text-base flex items-center justify-between border transition-all bg-black/20 border-white/10 text-white shadow-sm focus:ring-2 focus:ring-blue-600"
      >
        <span className={`text-sm ${!value ? 'text-slate-500' : ''}`}>{formattedDate}</span>
        <div className="text-blue-500 scale-75"><Icons.Calendar /></div>
      </button>
      {isOpen && CalendarUI}
    </div>
  );
};
