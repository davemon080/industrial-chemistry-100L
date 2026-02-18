
import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="google-card p-6 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-2">
          <div className="w-16 h-5 skeleton rounded-lg"></div>
          <div className="w-20 h-5 skeleton rounded-lg"></div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 shrink-0 skeleton rounded-2xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-6 w-3/4 skeleton rounded-lg"></div>
          <div className="h-3 w-1/4 skeleton rounded-lg"></div>
        </div>
      </div>

      <div className="space-y-4 flex-grow">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl skeleton"></div>
           <div className="flex-1 space-y-1">
             <div className="h-4 w-1/2 skeleton rounded-md"></div>
             <div className="h-3 w-1/3 skeleton rounded-md"></div>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl skeleton"></div>
           <div className="flex-1 space-y-1">
             <div className="h-4 w-2/3 skeleton rounded-md"></div>
             <div className="h-3 w-1/2 skeleton rounded-md"></div>
           </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="w-full h-14 skeleton rounded-2xl"></div>
        <div className="w-full h-14 skeleton rounded-2xl"></div>
      </div>
    </div>
  );
};
