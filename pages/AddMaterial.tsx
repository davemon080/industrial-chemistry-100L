
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Material } from '../types';
import { ArrowLeft, X, Upload, FileText, Loader2, CheckCircle2, CloudUpload } from 'lucide-react';

interface Props { 
  user: User; 
  onUpload: (item: Omit<Material, 'id' | 'uploadedAt'>) => Promise<void>;
}

const AddMaterial: React.FC<Props> = ({ user, onUpload }) => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'READING' | 'ENCODING' | 'TRANSMITTING' | 'COMPLETE'>('IDLE');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 100 * 1024 * 1024) {
      alert("File is too large. 100MB limit.");
      return;
    }
    setSelectedFile(file);
    setStatus('IDLE');
    setProgress(0);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 50);
          setProgress(percent);
          setStatus('READING');
        }
      };

      reader.readAsDataURL(file);
      reader.onload = () => {
        setProgress(60);
        setStatus('ENCODING');
        resolve(reader.result as string);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handlePublish = async () => {
    if (!selectedFile || !code) return;
    setIsProcessing(true);

    try {
      // Simulate real processing before sending to background
      const base64Data = await fileToBase64(selectedFile);
      
      // Simulate transmitting phase for UI
      setStatus('TRANSMITTING');
      for (let i = 65; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 100));
        setProgress(i);
      }
      
      setStatus('COMPLETE');
      
      // Send to background sync engine
      onUpload({
        courseCode: code,
        title: selectedFile.name,
        pdfUrl: base64Data,
        uploadedBy: user.matricNumber
      });

      // Quick navigate back while background continues
      setTimeout(() => navigate(`/courses/${code}`), 500);
    } catch (err) {
      alert("Processing failed.");
      setIsProcessing(false);
      setStatus('IDLE');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 md:px-12">
        <button 
          onClick={() => navigate(`/courses/${code}`)}
          className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="google-font text-xl font-bold text-gray-900">Publish Resource</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 max-w-2xl mx-auto w-full">
        <div className="w-full text-center mb-12">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-50/50">
            <CloudUpload size={32} />
          </div>
          <h1 className="google-font text-4xl font-black text-gray-900 mb-2">New Module Uplink</h1>
          <p className="text-gray-400 font-medium">Add a PDF asset to the {code} hub repository.</p>
        </div>

        {status === 'IDLE' ? (
          <div className="w-full relative group">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="border-4 border-dashed border-gray-100 rounded-[64px] p-20 text-center bg-gray-50 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-all shadow-inner">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <Upload className="text-blue-600" size={28} />
              </div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {selectedFile ? selectedFile.name : 'Tap to select PDF'}
              </p>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Maximum 100MB File Size</p>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-gray-100 rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                   {status === 'COMPLETE' ? <CheckCircle2 size={24} /> : <Loader2 size={24} className="animate-spin" />}
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                     {status === 'READING' && 'Indexing Local File'}
                     {status === 'ENCODING' && 'Generating Digital Signature'}
                     {status === 'TRANSMITTING' && 'Transmitting to Cloud'}
                     {status === 'COMPLETE' && 'Module Prepared'}
                   </p>
                   <p className="text-lg font-bold text-gray-900 truncate max-w-[200px]">{selectedFile?.name}</p>
                 </div>
               </div>
               <span className="text-3xl font-black text-gray-900 tabular-nums">{progress}%</span>
             </div>

             <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden mb-4">
               <div 
                 className="h-full bg-blue-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                 style={{ width: `${progress}%` }}
               />
             </div>
             <p className="text-center text-xs text-gray-400 font-medium">Do not close this window during processing.</p>
          </div>
        )}

        <div className="w-full mt-12 space-y-4">
          <button
            onClick={handlePublish}
            disabled={!selectedFile || isProcessing}
            className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center"
          >
            {isProcessing ? 'Processing...' : 'Publish to Hub'}
          </button>
          <button
            onClick={() => navigate(`/courses/${code}`)}
            disabled={isProcessing}
            className="w-full py-5 text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:text-gray-900 transition-colors"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMaterial;
