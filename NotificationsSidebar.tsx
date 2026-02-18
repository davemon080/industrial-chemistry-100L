
import React, { useState } from 'react';
import { Icons } from '../icons';
import { Schedule, Attachment } from '../types';

interface DocViewerProps {
  viewingDoc: Schedule | null;
  setViewingDoc: (val: Schedule | null) => void;
}

export const DocViewer: React.FC<DocViewerProps> = ({ viewingDoc, setViewingDoc }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!viewingDoc) return null;

  const items: Attachment[] = viewingDoc.attachments || [];
  const currentItem = items[activeIndex];
  const hasMultiple = items.length > 1;

  const next = () => setActiveIndex(prev => (prev + 1) % items.length);
  const prev = () => setActiveIndex(prev => (prev - 1 + items.length) % items.length);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setViewingDoc(null)} />
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Icons.File /></div>
            <div className="min-w-0">
              <h4 className="text-lg font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {currentItem?.name || 'Material Preview'}
              </h4>
              <p className="text-xs font-medium text-slate-500">
                {hasMultiple ? `Item ${activeIndex + 1} of ${items.length}` : 'Course Resource'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasMultiple && (
              <div className="flex gap-1 mr-4">
                <button onClick={prev} className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center"><Icons.ChevronLeft /></button>
                <button onClick={next} className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center"><Icons.ChevronRight /></button>
              </div>
            )}
            <button onClick={() => setViewingDoc(null)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-all flex items-center justify-center"><Icons.X /></button>
          </div>
        </header>

        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-6 sm:p-12 relative">
          {currentItem ? (
            currentItem.type.includes('image') ? (
              <div className="relative group max-h-full">
                 <img src={currentItem.data} className="max-w-full max-h-full rounded-2xl shadow-xl border-4 border-white object-contain" alt="viewer" />
                 {hasMultiple && (
                    <>
                      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md text-slate-900 rounded-full shadow-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.ChevronLeft /></button>
                      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md text-slate-900 rounded-full shadow-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.ChevronRight /></button>
                    </>
                 )}
              </div>
            ) : (
              <div className="text-center p-12 bg-white rounded-3xl shadow-md border border-slate-200 max-w-sm w-full">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8"><Icons.File /></div>
                <h5 className="text-xl font-bold mb-4 text-slate-900">Material ready</h5>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed">This document is formatted for offline viewing and cannot be previewed in-browser.</p>
                <a href={currentItem.data} download={currentItem.name} className="inline-flex w-full px-8 h-12 bg-indigo-600 text-white rounded-xl text-sm font-bold items-center justify-center shadow-lg hover:bg-indigo-700 transition-all">Download Document</a>
              </div>
            )
          ) : (
            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active content</div>
          )}
        </div>

        {hasMultiple && (
          <div className="p-4 bg-white border-t border-slate-100 flex gap-3 overflow-x-auto no-scrollbar justify-center shrink-0">
            {items.map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveIndex(idx)}
                className={`w-16 h-16 rounded-xl border-2 transition-all overflow-hidden shrink-0 ${idx === activeIndex ? 'border-indigo-600 scale-110 shadow-lg' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
              >
                {item.type.includes('image') ? (
                  <img src={item.data} className="w-full h-full object-cover" alt="thumb" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300"><Icons.File /></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
