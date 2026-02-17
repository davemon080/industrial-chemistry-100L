
import React from 'react';
import { Icons } from '../icons';

interface DocViewerProps {
  viewingDoc: any | null;
  setViewingDoc: (val: any | null) => void;
}

export const DocViewer: React.FC<DocViewerProps> = ({ viewingDoc, setViewingDoc }) => {
  if (!viewingDoc) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setViewingDoc(null)} />
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Icons.File /></div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 truncate max-w-xs">{viewingDoc.attachmentName || 'Material Preview'}</h4>
              <p className="text-xs font-medium text-slate-500">Course Resource</p>
            </div>
          </div>
          <button onClick={() => setViewingDoc(null)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 transition-all flex items-center justify-center"><Icons.X /></button>
        </header>
        <div className="flex-1 bg-slate-50 overflow-auto flex items-center justify-center p-6 sm:p-12">
          {viewingDoc.attachmentType?.includes('image') ? (
            <img src={viewingDoc.attachment} className="max-w-full max-h-full rounded-2xl shadow-xl border-4 border-white" alt="viewer" />
          ) : (
            <div className="text-center p-12 bg-white rounded-3xl shadow-md border border-slate-200 max-w-sm w-full">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8"><Icons.File /></div>
              <h5 className="text-xl font-bold mb-4 text-slate-900">Material ready</h5>
              <p className="text-slate-500 text-sm mb-10 leading-relaxed">This document is formatted for offline viewing and cannot be previewed in-browser.</p>
              <a href={viewingDoc.attachment} download={viewingDoc.attachmentName} className="inline-flex w-full px-8 h-12 bg-indigo-600 text-white rounded-xl text-sm font-bold items-center justify-center shadow-lg hover:bg-indigo-700 transition-all">Download Document</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
