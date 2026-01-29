
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Course, Module, Attachment, User } from '../types';
import RestrictedAccess from '../components/RestrictedAccess';

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
  const [viewingPdf, setViewingPdf] = useState<Attachment | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  // Management States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubscribed = user.subscription?.status === 'active';
  const isRep = user.role === 'rep';

  // Cleanup blob URLs to prevent memory leaks
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
    if (!ts) return 'Unknown Date';
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
      if (dataUrl.startsWith('blob:')) return dataUrl;
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
  };

  const handleOpenExternal = async (att: Attachment) => {
    setIsPdfLoading(true);
    try {
      const url = await convertToBlob(att.url);
      window.open(url, '_blank');
    } catch (e) {
      alert("Could not open external viewer.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const openPdf = async (att: Attachment) => {
    setIsPdfLoading(true);
    if (blobUrl) URL.revokeObjectURL(blobUrl);

    try {
      const newUrl = await convertToBlob(att.url);
      setBlobUrl(newUrl);
      setViewingPdf(att);
      document.body.style.overflow = 'hidden'; // Lock scrolling
    } catch (e) {
      alert("Reader failed to initialize.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const closeReader = () => {
    setViewingPdf(null);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      if (file.type !== 'application/pdf') return;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`${file.name} exceeds 100MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingFiles(prev => [...prev, { 
          name: file.name, 
          url: event.target?.result as string,
          timestamp: Date.now() 
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
    if (!window.confirm("Permanently remove this module and all attached PDFs?")) return;
    const updatedModules = (course.modules || []).filter(m => m.id !== moduleId);
    onUpdateCourse({ ...course, modules: updatedModules });
  };

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setIsProcessing(true);

    setTimeout(async () => {
      const moduleData: Module = {
        id: editingModule ? editingModule.id : `mod_${Date.now()}`,
        title: moduleTitle,
        description: moduleDescription,
        content: moduleDescription,
        videos: editingModule ? editingModule.videos : [],
        attachments: pendingFiles
      };
      let updatedModules = editingModule 
        ? (course.modules || []).map(m => m.id === editingModule.id ? moduleData : m)
        : [...(course.modules || []), moduleData];

      await onUpdateCourse({ ...course, modules: updatedModules });
      setIsProcessing(false);
      setIsUploadModalOpen(false);
    }, 800);
  };

  return (
    <div className="animate-in fade-in duration-700 relative pb-32">
      {!isSubscribed && user.role === 'student' && (
        <RestrictedAccess title="Curriculum Locked" description="Course modules and PDF repositories are reserved for Pro members." />
      )}

      {/* 
          IMMERSIVE PDF READER 
          This is designed to be fixed to the viewport (directly on body) with no containers.
          It provides a clean, full-screen reading environment.
      */}
      {viewingPdf && blobUrl && (
        <div className="fixed inset-0 bg-slate-950 z-[2000] flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
          {/* Header */}
          <header className="h-16 md:h-20 bg-slate-900/95 backdrop-blur-xl px-4 md:px-10 flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-indigo-500/20">PDF</div>
              <div className="min-w-0">
                <h3 className="text-white font-black text-sm md:text-base truncate uppercase tracking-tight leading-none">{viewingPdf.name}</h3>
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1.5 hidden xs:block">Reading Mode • {formatTimestamp(viewingPdf.timestamp)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => handleOpenExternal(viewingPdf)} 
                className="p-3 bg-white/5 text-slate-300 rounded-xl hover:text-white transition-all border border-white/10 hover:bg-white/10"
                title="Open Externally"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </button>
              <button 
                onClick={() => handleDownload(viewingPdf)} 
                className="p-3 bg-white/5 text-slate-300 rounded-xl hover:text-white transition-all border border-white/10 hover:bg-white/10"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <button 
                onClick={closeReader} 
                className="px-6 py-3 md:px-8 md:py-3.5 bg-white text-slate-900 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all shadow-xl active:scale-95"
              >
                Exit
              </button>
            </div>
          </header>

          {/* PDF Viewer - Pure Iframe directly on the body background */}
          <div className="flex-1 w-full bg-slate-900 relative">
            <iframe 
              src={`${blobUrl}#toolbar=1&navpanes=0`} 
              className="absolute inset-0 w-full h-full border-none" 
              title="Full Screen PDF Content"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Main Course Details Page */}
      <div className={(!isSubscribed && user.role === 'student') ? 'blur-2xl pointer-events-none grayscale' : ''}>
        <header className="mb-14">
          <Link to="/" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 hover:text-indigo-600 transition-colors group">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M15 19l-7-7 7-7" /></svg>
            </div>
            Registry
          </Link>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">{course.id}</span>
              <span className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em]">{course.instructor}</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">
              Module<br/><span className="text-indigo-600">Materials</span>
            </h1>
          </div>
        </header>

        <section className="space-y-12">
           <div className="flex items-center justify-between">
             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Resource Stack</h2>
             <div className="h-px flex-1 bg-slate-100 mx-10 hidden sm:block" />
           </div>

           {(course.modules || []).length === 0 ? (
             <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm px-6">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Archive Empty</h3>
               {isRep && <p className="text-slate-400 font-bold mt-2">Publish your first learning module below.</p>}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
               {course.modules.map((module) => (
                 <div key={module.id} className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-10 flex flex-col shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    {isRep && (
                      <div className="absolute top-8 right-8 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        <button onClick={() => handleOpenEdit(module)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:scale-90"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => handleDeleteModule(module.id)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-rose-300 hover:text-rose-500 shadow-sm transition-all active:scale-90"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    )}

                    <div className="flex-1 space-y-6">
                      <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-3">{module.title}</h3>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed line-clamp-3">{module.description}</p>
                      </div>
                    </div>

                    {/* PDF Action Area */}
                    <div className="mt-12 space-y-4">
                      {(module.attachments || []).map((att, attIdx) => (
                        <div key={attIdx} className="space-y-2">
                           {/* Primary View Button (Internal immersive) */}
                           <div className="flex gap-2">
                             <button 
                                onClick={() => openPdf(att)} 
                                className="flex-1 flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-600 border border-slate-100 hover:border-indigo-600 rounded-2xl transition-all group/btn min-w-0 shadow-sm"
                              >
                                <div className="flex items-col items-start min-w-0">
                                  <span className="text-[11px] font-black text-slate-700 group-hover/btn:text-white truncate uppercase tracking-tight">{att.name}</span>
                                  <span className="text-[8px] font-black text-slate-400 group-hover/btn:text-indigo-200 mt-1 uppercase tracking-widest">{formatTimestamp(att.timestamp)}</span>
                                </div>
                                <svg className="w-4 h-4 text-slate-300 group-hover/btn:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                             </button>
                             {/* External View Button */}
                             <button 
                               onClick={() => handleOpenExternal(att)} 
                               className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                               title="View Externally"
                             >
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                             </button>
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

      {/* Floating Action Button for Reps */}
      {isRep && (
        <button onClick={handleOpenAdd} className="fixed bottom-28 right-6 md:bottom-12 md:right-12 w-20 h-20 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all group border-8 border-white">
          <svg className="w-10 h-10 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {/* Management Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[150] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <div className="bg-white w-full max-w-2xl md:rounded-[3.5rem] p-8 md:p-14 shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[95vh] overflow-y-auto no-scrollbar relative">
            <div className="flex justify-between items-start mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">{editingModule ? 'Update Module' : 'Push Module'}</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmitModule} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identity</label>
                  <input required placeholder="E.g. Cell Biology Fundamentals" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-lg focus:bg-white transition-all outline-none" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Module Digest</label>
                  <textarea placeholder="Outline learning objectives..." className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-bold h-36 outline-none resize-none focus:bg-white transition-all" value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} />
                </div>
                <div onClick={() => fileInputRef.current?.click()} className="p-12 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer hover:bg-white hover:border-indigo-400 transition-all group shadow-inner">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-300 group-hover:text-indigo-500 mb-4 shadow-sm transition-colors">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest text-center group-hover:text-indigo-900 transition-colors">Drop Lecture Slides (PDF)</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" multiple onChange={handleFiles} />
                </div>
              </div>
              {pendingFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-3 p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-indigo-100">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-indigo-950 truncate uppercase tracking-tight">{f.name}</span>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Staged</span>
                      </div>
                      <button type="button" onClick={() => setPendingFiles(p => p.filter((_, idx) => idx !== i))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6" /></svg></button>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-[0.98]">
                {isProcessing ? 'Deploying...' : (editingModule ? 'Confirm Changes' : 'Deploy Module')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Loading Portal */}
      {isPdfLoading && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[3000] flex flex-col items-center justify-center p-8 text-center">
           <div className="w-14 h-14 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-8" />
           <h3 className="text-2xl font-black text-white tracking-[0.3em] uppercase animate-pulse">Initializing Portal</h3>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
