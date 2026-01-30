
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Material } from '../types';
import { dbService } from '../services/dbService';
import { COURSE_LIST } from '../constants';
import { ArrowLeft, FileText, Download, Trash2, Edit, Plus, ExternalLink, X, Loader2, BookOpen, Clock, User as UserIcon, ShieldAlert } from 'lucide-react';

interface Props { user: User; }

const CourseDetail: React.FC<Props> = ({ user }) => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const course = COURSE_LIST.find(c => c.code === code);

  const fetchMaterials = async () => {
    if (!code) return;
    setIsLoading(true);
    try {
      const data = await dbService.getMaterials(code);
      setMaterials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, [code]);

  if (!course) {
    return <div className="p-20 text-center text-2xl font-black text-gray-400">COURSE NOT FOUND</div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !code) return;
    setIsProcessing(true);

    try {
      // Dummy URL for demonstration - in production this would be an S3/Cloudinary URL
      const demoUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");

      if (editingMaterial) {
        const success = await dbService.updateMaterial(editingMaterial.id, fileName, demoUrl);
        if (success) await fetchMaterials();
      } else {
        const result = await dbService.addMaterial({
          courseCode: code,
          title: fileName,
          pdfUrl: demoUrl,
          uploadedBy: user.matricNumber
        });
        if (result) await fetchMaterials();
      }
      closeModals();
    } catch (err) {
      alert("Operation failed. Check connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Permanently delete this module?')) {
      const success = await dbService.deleteMaterial(id);
      if (success) setMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  const closeModals = () => {
    setIsUploadOpen(false);
    setEditingMaterial(null);
    setSelectedFile(null);
  };

  const openExternalPdf = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full animate-fade-in bg-gray-50 min-h-screen pb-32">
      {/* Header Section */}
      <div className="w-full bg-white border-b border-gray-200 p-6 md:p-12 relative">
        <button 
          onClick={() => navigate('/courses')}
          className="flex items-center text-gray-400 hover:text-blue-600 transition-all mb-8 group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to hub</span>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="google-font text-5xl md:text-7xl font-black tracking-tighter text-gray-900 leading-none mb-4">
              {course.code}
            </h1>
            <p className="text-xl md:text-2xl font-medium text-gray-500">{course.title}</p>
          </div>

          {user.isCourseRep && (
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-blue-600 text-white px-8 py-5 rounded-[24px] hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-100 flex items-center space-x-3 font-bold"
            >
              <Plus size={24} />
              <span>UPLOAD MODULE</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Flowing Directly on Body */}
      <div className="w-full px-6 md:px-12 py-12">
        <div className="flex items-center space-x-3 mb-12">
          <BookOpen className="text-blue-600" size={24} />
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Course Repository</h2>
        </div>

        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center py-32 opacity-50">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Synchronizing materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-32 bg-white/50 rounded-[40px] border border-gray-100">
            <ShieldAlert size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No materials uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="group relative flex flex-col items-center text-center p-6 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 rounded-[32px] transition-all duration-300 border border-transparent hover:border-gray-100">
                <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center text-red-500 mb-4 group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-2 px-2" title={m.title}>
                  {m.title}
                </h3>
                
                <div className="flex items-center space-x-3 text-[9px] font-bold text-gray-400 uppercase tracking-tighter mb-6">
                  <span className="flex items-center"><UserIcon size={10} className="mr-1" /> {m.uploadedBy.split('/').pop()}</span>
                </div>

                <div className="mt-auto w-full flex flex-col space-y-2">
                  <button 
                    onClick={() => openExternalPdf(m.pdfUrl)}
                    className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                  >
                    <ExternalLink size={12} />
                    <span>View</span>
                  </button>
                  
                  <div className="flex space-x-1">
                    <a 
                      href={m.pdfUrl} 
                      download={m.title}
                      className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center"
                    >
                      <Download size={12} className="mr-1" />
                    </a>
                    {user.isCourseRep && (
                      <>
                        <button 
                          onClick={() => setEditingMaterial(m)}
                          className="flex-1 bg-orange-50 text-orange-600 py-2 rounded-xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center"
                          title="Replace File"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal (Upload / Replace) */}
      {(isUploadOpen || editingMaterial) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={() => !isProcessing && closeModals()}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[40px] p-10 md:p-16 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
               onClick={closeModals}
               className="absolute top-8 right-8 p-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            
            <div className="mb-10 text-center">
              <h3 className="google-font text-4xl font-black mb-2">
                {editingMaterial ? 'REPLACE MODULE' : 'NEW MODULE'}
              </h3>
              <p className="text-gray-400 font-medium">The system will use the actual file name.</p>
            </div>
            
            <form onSubmit={handleAction} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] block text-center">Select Document</label>
                <div className="border-2 border-dashed border-gray-200 rounded-[32px] p-16 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isProcessing}
                  />
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform text-blue-600">
                    <Plus size={32} />
                  </div>
                  <p className="text-lg font-bold text-gray-900 truncate px-4">
                    {selectedFile ? selectedFile.name : 'Choose PDF'}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isProcessing || !selectedFile}
                  className="w-full bg-blue-600 text-white py-6 rounded-[24px] font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : (editingMaterial ? 'UPDATE FILE' : 'CONFIRM UPLOAD')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
