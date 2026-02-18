
import React from 'react';
import { Icons } from '../icons';

export const EduSparkzPromo: React.FC = () => {
  const handleAction = () => {
    window.open('https://edu-sparkz.vercel.app', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="animate-fade-in w-full mb-8">
      <div 
        onClick={handleAction}
        className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:border-blue-500/30 hover:bg-white/10"
      >
        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full transition-opacity group-hover:opacity-40" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full transition-opacity group-hover:opacity-40" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h3 className="text-xl font-black text-white tracking-tight">EduSparkz</h3>
                <span className="inline-flex text-[9px] font-black bg-blue-600 px-2 py-0.5 rounded-full text-white uppercase tracking-widest animate-pulse">Official Partner</span>
              </div>
              <p className="text-sm font-medium text-slate-400 max-w-md leading-relaxed">
                Elevate your academic performance with our AI-powered study companion. Smarter notes, instant summaries, and collective intelligence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button className="h-12 px-8 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95 flex items-center gap-3">
              Explore Hub <Icons.ChevronRight />
            </button>
          </div>
        </div>
        
        {/* Progress line decoration */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
      </div>
    </div>
  );
};
