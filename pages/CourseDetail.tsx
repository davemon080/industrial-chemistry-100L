
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Material } from '../types';
import { dbService } from '../services/dbService';
import { COURSE_LIST } from '../constants';
import { ArrowLeft, Download, Trash2, Plus, X, Loader2, BookOpen, ShieldAlert, Maximize2, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

interface Props { 
  user: User; 
  cachedMaterials: Record<string, Material[]>;
  pendingMaterials: Material[]; 
  onRefresh: (code: string) => Promise<void>;
  syncError?: boolean;
  onDeleteLocal: (id: string, code: string) => void;
}

const CourseDetail: React.FC<Props> = ({ user, cachedMaterials, pendingMaterials, onRefresh, syncError, onDeleteLocal }) => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [viewingPdf, setViewingPdf] = useState<Material | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const course = COURSE_LIST.find(c => c.code === code);
  const materials = code ? cachedMaterials[code] || [] : [];

  useEffect(() => {
    if (code) onRefresh(code);
  }, [code, onRefresh]);

  const displayMaterials = [
    ...pendingMaterials.filter(p => p.courseCode === code),
    ...materials
  ];

  if (!course) {
    return <div className="p-20 text-center text-2xl font-black text-gray-400 uppercase tracking-widest">Course Not Found</div>;
  }

  const confirmDelete = async () => {
    if (!materialToDelete || !code) return;
    const id = materialToDelete.id;
    setDeletingIds(prev => new Set(prev).add(id));
    setMaterialToDelete(null);

    try {
      const success = await dbService.deleteMaterial(id);
      if (success) {
        onDeleteLocal(id, code);
      } else {
        alert("Failed to delete the material.");
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <>
      {user.isCourseRep && (
        <button 
          onClick={() => navigate(`/courses/${code}/add`)}
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-[100] p-5 bg-blue-600 text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl ring-4 ring-white group"
        >
          <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
        </button>
      )}

      <div className="w-full bg-white min-h-screen pb-40 relative">
        <div className="animate-fade-in">
          <div className="w-full bg-white px-6 py-8 md:px-12 md:py-12 border-b border-gray-100">
            <button 
              onClick={() => navigate('/courses')}
              className="flex items-center text-gray-400 hover:text-blue-600 transition-all mb-6 group"
            >
              <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hub Dashboard</span>
            </button>

            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="google-font text-5xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none">
                    {course.code}
                  </h1>
                  {syncError && (
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl" title="Viewing cached version. Check connection.">
                      <WifiOff size={24} />
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-sm md:text-lg font-medium tracking-tight uppercase">{course.title}</p>
              </div>
              
              {syncError && (
                <button 
                  onClick={() => code && onRefresh(code)}
                  className="mb-1 flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Retry Sync</span>
                </button>
              )}
            </div>
          </div>

          <div className="w-full max-w-7xl mx-auto">
            {materials.length === 0 && !pendingMaterials.length ? (
              <div className="py-24 text-center">
                <ShieldAlert size={48} className="mx-auto text-gray-100 mb-4" />
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {syncError ? 'Connection Timed Out' : 'Syncing Repository...'}
                </p>
                {syncError && (
                  <button onClick={() => code && onRefresh(code)} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold">Try Again</button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayMaterials.map((m) => {
                  const isDeleting = deletingIds.has(m.id);
                  const isSyncing = m.isSyncing;
                  
                  return (
                    <div 
                      key={m.id} 
                      className={`group flex items-start px-6 py-8 md:px-12 hover:bg-gray-50/50 transition-all ${isDeleting ? 'opacity-50 grayscale' : ''} ${isSyncing ? 'bg-blue-50/30' : ''}`}
                    >
                      <div 
                        className={`flex-shrink-0 mt-1.5 w-10 h-12 rounded-lg flex items-center justify-center cursor-pointer shadow-sm active:scale-90 transition-transform ${isSyncing ? 'bg-blue-200 animate-pulse' : 'bg-[#e53935]'}`}
                        onClick={() => !isDeleting && !isSyncing && setViewingPdf(m)}
                      >
                         <span className="text-[10px] font-black text-white leading-none">{isSyncing ? '...' : 'PDF'}</span>
                      </div>

                      <div className="ml-6 flex-grow">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                          <div 
                            className="cursor-pointer group/title"
                            onClick={() => !isDeleting && !isSyncing && setViewingPdf(m)}
                          >
                            <h3 className={`text-xl font-bold leading-tight mb-2 transition-colors ${isSyncing ? 'text-blue-600 italic' : 'text-gray-900 group-hover/title:text-blue-600'}`}>
                              {m.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-[#757575] font-medium">
                              {isSyncing ? (
                                <span className="flex items-center text-blue-500 animate-pulse">
                                  <RefreshCw size={14} className="mr-2 animate-spin" /> Uplinking...
                                </span>
                              ) : (
                                <>
                                  <span className="flex items-center"><BookOpen size={14} className="mr-2" /> {new Date(m.uploadedAt).toLocaleDateString('en-GB')}</span>
                                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] uppercase font-bold tracking-widest">{m.uploadedBy === user.matricNumber ? 'My Upload' : 'ICH Vault'}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {!isSyncing && (
                            <div className="flex items-center space-x-2 mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setViewingPdf(m)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                                <Maximize2 size={18} />
                              </button>
                              <a href={m.pdfUrl} download={m.title} className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all">
                                <Download size={18} />
                              </a>
                              {user.isCourseRep && (
                                <button onClick={() => setMaterialToDelete(m)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* PDF Viewer */}
        {viewingPdf && (
          <div className="fixed inset-0 z-[200] flex flex-col bg-white animate-in slide-in-from-bottom duration-500">
            <div className="w-full h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-12">
              <h2 className="text-sm md:text-lg font-bold text-gray-900 truncate">{viewingPdf.title}</h2>
              <button onClick={() => setViewingPdf(null)} className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="flex-grow bg-gray-100">
               <iframe src={`${viewingPdf.pdfUrl}#toolbar=1`} className="w-full h-full border-none" title={viewingPdf.title} />
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {materialToDelete && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setMaterialToDelete(null)}></div>
            <div className="relative bg-white w-full max-w-sm rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <AlertTriangle size={40} className="mx-auto mb-4 text-red-500" />
              <h3 className="google-font text-2xl font-black text-gray-900 mb-10">Delete this entry?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setMaterialToDelete(null)} className="py-4 bg-gray-100 text-gray-600 font-black rounded-2xl">Cancel</button>
                <button onClick={confirmDelete} className="py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CourseDetail;
