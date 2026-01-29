
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Course, Module, Attachment, User } from '../types';
import RestrictedAccess from '../components/RestrictedAccess';
import { summarizeModule } from '../services/geminiService';

const MAX_FILE_SIZE_MB = 100;

interface CourseDetailProps {
  courses: Course[];
  onUpdateCourse: (updatedCourse: Course) => void;
  user: User;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courses, onUpdateCourse, user }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = courses.find(c => c.id === courseId);

  // PDF Viewing States
  const [viewingPdf, setViewingPdf] = useState<{ att: Attachment; mod: Module } | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  // Management States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'packaging' | 'storing'>('idle');
  
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubscribed = user.subscription?.status === 'active';
  const isRep = user.role === 'rep';

  // Cleanup Blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!course) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-300 mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      </div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight">Registry Not Found</h2>
      <Link to="/" className="mt-4 text-indigo-600 font-bold hover:underline text-sm">Return Home</Link>
    </div>
  );

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Archived';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  };

  const convertToBlob = async (dataUrl: string): Promise<string> => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error("Blob conversion failed", e);
      return dataUrl;
    }
  };

  const handleDownload = async (att: Attachment) => {
    const url = await convertToBlob(att.url);
    const link = document.createElement('a');
    link.href = url;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleOpenExternal = async (att: Attachment) => {
    const url = await convertToBlob(att.url);
    window.open(url, '_blank');
  };

  const openPdf = async (att: Attachment, mod: Module) => {
    setIsPdfLoading(true);
    if (blobUrl) URL.revokeObjectURL(blobUrl);

    try {
      const newUrl = await convertToBlob(att.url);
      setBlobUrl(newUrl);
      setViewingPdf({ att, mod });
      document.body.style.overflow = 'hidden';
    } catch (e) {
      alert("Reader initialization failed.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const closeReader = () => {
    setViewingPdf(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    document.body.style.overflow = 'auto';
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      if (file.type !== 'application/pdf') return;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`${file.name} exceeds 100MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingFiles(prev => [...prev, { 
          name: file.name, 
          url: event.target?.result as string,
          timestamp: Date.now() // Capturing exact upload timestamp
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOpenAdd = () => {
    setEditingModule(null); setModuleTitle(''); setModuleDescription(''); setPendingFiles([]);
    setIsUploadModalOpen(true);
  };

  const handleOpenEdit = (mod: Module) => {
    setEditingModule(mod); setModuleTitle(mod.title); setModuleDescription(mod.description);
    setPendingFiles(mod.attachments || []);
    setIsUploadModalOpen(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm("Permanently remove this module?")) return;
    const updatedModules = (course.modules || []).filter(m => m.id !== moduleId);
    onUpdateCourse({ ...course, modules: updatedModules });
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setIsProcessing(true);
    setProcessingStatus('packaging');

    setTimeout(async () => {
      setProcessingStatus('storing');
      const moduleData: Module = {
        id: editingModule ? editingModule.id : `mod_${Date.now()}`,
        title: moduleTitle,
        description: moduleDescription,
        content: moduleDescription,
        videos: editingModule ? editingModule.videos : [],
        attachments: pendingFiles.map(f => ({
          ...f,
          timestamp: f.timestamp || Date.now() // Ensure every PDF has a timestamp
        }))
      };
      let updatedModules = editingModule 
        ? (course.modules || []).map(m => m.id === editingModule.id ? moduleData : m)
        : [...(course.modules || []), moduleData];

      try {
        await onUpdateCourse({ ...course, modules: updatedModules });
        setIsUploadModalOpen(false);
      } catch (err) {
        alert("Persistence Error: Storage limit reached.");
      } finally {
        setIsProcessing(false);
        setProcessingStatus('idle');
      }
    }, 600);
  };

  const handleSummarize = async (moduleId: string, content: string) => {
    if (!isSubscribed) return;
    setSummarizingId(moduleId);
    const summary = await summarizeModule(content);
    const updatedModules = (course.modules || []).map(m => 
      m.id === moduleId ? { ...m, description: summary } : m
    );
    onUpdateCourse({ ...course, modules: updatedModules });
    setSummarizingId(null);
  };

  return (
    <div className="animate-in fade-in duration-700 relative pb-32 md:pb-20 overflow-x-hidden">
      {!isSubscribed && user.role === 'student' && (
        <RestrictedAccess title="Materials Locked" description="Course modules and PDF materials are reserved for Pro members." />
      )}

      {/* Immersive PDF Reader */}
      {viewingPdf && blobUrl && (
        <div className="fixed inset-0 bg-slate-950 z-[110] flex flex-col lg:flex-row animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
          <div className="flex-1 flex flex-col h-full bg-slate-900">
            <header className="h-20 lg:h-24 bg-slate-900/90 px-4 md:px-8 flex items-center justify-between border-b border-white/5 backdrop-blur-2xl shrink-0">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-[12px] shrink-0 shadow-lg shadow-indigo-500/20">PDF</div>
                <div className="min-w-0">
                  <h3 className="text-white font-black text-xs md:text-sm lg:text-base truncate leading-none mb-1.5">{viewingPdf.att.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{viewingPdf.mod.title}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">{formatTimestamp(viewingPdf.att.timestamp)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button 
                  onClick={() => handleOpenExternal(viewingPdf!.att)}
                  className="p-3 bg-white/5 text-slate-300 rounded-xl hover:text-white hover:bg-white/10 transition-all hidden sm:flex items-center justify-center"
                  title="Open in Browser"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </button>
                <button 
                  onClick={() => handleDownload(viewingPdf!.att)}
                  className="p-3 bg-white/5 text-slate-300 rounded-xl hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                  title="Download File"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button onClick={closeReader} className="px-5 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-xl">
                  Close
                </button>
              </div>
            </header>
            <div className="flex-1 relative bg-slate-900">
              <iframe src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="Reader" />
            </div>
          </div>
          <aside className="hidden lg:flex w-96 flex-col border-l border-white/5 bg-slate-950 p-10 overflow-y-auto no-scrollbar">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">Course Context</span>
            <h4 className="text-2xl font-black text-white tracking-tight mb-6 leading-tight">{viewingPdf.mod.title}</h4>
            <div className="space-y-6">
              <p className="text-slate-400 text-sm font-bold leading-relaxed">{viewingPdf.mod.description}</p>
              <div className="pt-8 border-t border-white/5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-4">Metadata</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Status</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Verified</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Date</span>
                    <span className="text-[10px] font-black text-white uppercase">{new Date(viewingPdf.att.timestamp || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main UI */}
      <div className={`transition-all duration-700 ${(!isSubscribed && user.role === 'student') ? 'blur-3xl pointer-events-none grayscale scale-105' : ''}`}>
        <header className="mb-12 md:mb-20">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 hover:text-indigo-600 transition-all group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </Link>
          <div className="space-y-6">
            <div className="flex items-center flex-wrap gap-3">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-100">{course.id}</span>
              <span className="text-slate-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                {course.instructor}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] lg:leading-[0.85]">
              Curriculum<br/><span className="text-indigo-600">Materials</span>
            </h1>
          </div>
        </header>

        <section className="space-y-12">
           <div className="flex items-center justify-between gap-6">
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] whitespace-nowrap">Academic Stack</h2>
             <div className="h-px flex-1 bg-slate-200/60" />
           </div>

           {(course.modules || []).length === 0 ? (
             <div className="py-24 md:py-40 text-center bg-white rounded-[3rem] border border-slate-200/60 shadow-sm px-6">
               <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8 mx-auto">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Stack is Empty</h3>
               {isRep && <p className="text-slate-400 font-bold mt-3 text-sm">Deploy the first module to sync with students.</p>}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
               {course.modules.map((module) => (
                 <div key={module.id} className="bg-white rounded-[3rem] border border-slate-200/70 p-6 md:p-8 flex flex-col shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                    {isRep && (
                      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button onClick={() => handleOpenEdit(module)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-xl transition-all active:scale-90"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => handleDeleteModule(module.id)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-rose-300 hover:text-rose-500 shadow-xl transition-all active:scale-90"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    )}

                    <div className="space-y-6 relative z-10 flex-1">
                      <div className="w-16 h-16 bg-indigo-50/50 rounded-[1.75rem] flex items-center justify-center text-indigo-600 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{module.title}</h3>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed line-clamp-4">{module.description}</p>
                        
                        {isSubscribed && !summarizingId && (
                          <button onClick={() => handleSummarize(module.id, module.content || module.description)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-700 tracking-widest mt-4 transition-all hover:gap-3">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            AI Synopsis
                          </button>
                        )}
                        {summarizingId === module.id && (
                          <div className="flex items-center gap-2 mt-4">
                            <div className="w-3 h-3 border-2 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Optimizing...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-10 space-y-4 relative z-10">
                      {(module.attachments || []).length > 0 && (
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">Documents</span>
                      )}
                      {(module.attachments || []).map((att, attIdx) => (
                        <div key={attIdx} className="flex flex-col gap-2 group/file">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openPdf(att, module)} 
                              className="flex-1 flex items-center justify-between p-4 md:p-5 bg-slate-50 hover:bg-indigo-600 border border-slate-100 hover:border-indigo-600 rounded-[1.5rem] transition-all duration-300 group/btn min-w-0 shadow-sm"
                            >
                              <div className="flex flex-col items-start min-w-0">
                                <span className="text-[10px] font-black text-slate-700 group-hover/btn:text-white truncate uppercase tracking-tight">{att.name}</span>
                                <span className="text-[8px] font-bold text-slate-400 group-hover/btn:text-indigo-200 mt-1 uppercase tracking-widest">{formatTimestamp(att.timestamp)}</span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              </div>
                            </button>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button 
                                onClick={() => handleOpenExternal(att)}
                                className="p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all shadow-sm active:scale-90"
                                title="Open External"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               ))}
             </div>
           )}
        </section>
      </div>

      {isRep && (
        <button onClick={handleOpenAdd} className="fixed bottom-28 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all group border-4 border-white">
          <svg className="w-8 h-8 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[120] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <div className="bg-white w-full max-w-2xl md:rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-500 max-h-[95vh] overflow-y-auto no-scrollbar relative">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Content Manager</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{editingModule ? 'Edit Content' : 'Publish Content'}</h2>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <form onSubmit={handleSubmitModule} className="space-y-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Module Identity</label>
                  <input required placeholder="E.g. Advanced Organic Chemistry" className="w-full p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-[1.75rem] font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lesson Brief</label>
                  <textarea placeholder="Summarize the core topics covered..." className="w-full p-5 md:p-6 bg-slate-50 border border-slate-200 rounded-[1.75rem] font-bold h-40 outline-none resize-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all" value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">PDF Resources</label>
                   <div onClick={() => fileInputRef.current?.click()} className="p-10 border-2 border-dashed border-slate-200 rounded-[1.75rem] flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer hover:bg-white hover:border-indigo-400 transition-all group shadow-inner">
                    <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all mb-4 shadow-sm">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Tap to Upload Materials</p>
                    <p className="text-[8px] font-bold text-slate-300 mt-2 uppercase">PDF Only • Max 100MB</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" multiple onChange={handleFiles} />
                  </div>
                </div>
              </div>

              {pendingFiles.length > 0 && (
                <div className="space-y-3 p-6 bg-indigo-50/40 rounded-[2rem] border border-indigo-100/50">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block px-1">Queue ({pendingFiles.length})</span>
                  <div className="grid grid-cols-1 gap-3">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-indigo-100/50 animate-in slide-in-from-left duration-300">
                        <div className="flex flex-col min-w-0 max-w-[80%]">
                          <span className="text-[11px] font-black text-indigo-950 truncate uppercase tracking-tight">{f.name}</span>
                          <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Ready for Sync</span>
                        </div>
                        <button type="button" onClick={() => setPendingFiles(p => p.filter((_, idx) => idx !== i))} className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M6 18L18 6" /></svg></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-95 group overflow-hidden relative">
                <span className="relative z-10 flex items-center justify-center gap-4">
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                      {processingStatus === 'packaging' ? 'Compressing...' : 'Syncing...'}
                    </>
                  ) : (
                    <>
                      {editingModule ? 'Update Module' : 'Deploy Module'}
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                  )}
                </span>
                {isProcessing && <div className="absolute inset-0 bg-indigo-600 animate-pulse" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {isPdfLoading && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
           <div className="relative w-24 h-24 mb-10">
             <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
             <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent" />
             <div className="absolute inset-4 bg-indigo-600/10 rounded-full animate-pulse" />
           </div>
           <h3 className="text-2xl font-black text-white tracking-widest uppercase leading-tight mb-2">Decrypting Core</h3>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Optimizing Content Stream</p>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
