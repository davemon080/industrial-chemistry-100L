
import React, { useState, useMemo } from 'react';
import { GuidePost } from '../types';
import { sql } from '../db';
import { Icons } from '../icons';
import { ConfirmModal } from '../components/ConfirmModal';

interface GuideProps {
  guidePosts: GuidePost[];
  isAdmin: boolean;
  fetchAllData: () => void;
  setViewingDoc: (post: any) => void;
}

export const Guide: React.FC<GuideProps> = ({ guidePosts, isAdmin, fetchAllData, setViewingDoc }) => {
  const [guideSearchQuery, setGuideSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchResults = useMemo(() => {
    if (!guideSearchQuery || guideSearchQuery.length < 2) return [];
    const q = guideSearchQuery.toLowerCase();
    return guidePosts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)).slice(0, 10);
  }, [guidePosts, guideSearchQuery]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await sql`DELETE FROM guide_posts WHERE id = ${deleteId}`;
      fetchAllData();
      setDeleteId(null);
    } catch (err) {
      alert("Purge failed. Connection unstable.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-12 pb-12">
      <header className="flex flex-col items-center text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-none">Institutional Resources</h2>
        <p className="text-slate-500 font-medium max-w-xl text-sm md:text-base">Official ICH documentation, manuals, and academic artifacts.</p>
        <div className="mt-8 w-full max-w-xl relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"><Icons.Search /></div>
          <input 
            type="text" 
            placeholder="Query artifacts or manuals..." 
            value={guideSearchQuery} 
            onChange={e => setGuideSearchQuery(e.target.value)} 
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 font-bold text-white outline-none focus:border-blue-600 transition-all shadow-sm placeholder:text-slate-600" 
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c212b] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 animate-fade-in">
              {searchResults.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => { setGuideSearchQuery(''); document.getElementById(`post-${p.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} 
                  className="w-full text-left p-5 hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                >
                  <h5 className="font-bold text-white text-sm tracking-tight">{p.title}</h5>
                  <p className="text-[10px] text-slate-500 line-clamp-1 italic uppercase tracking-wider font-black mt-1">{p.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="space-y-8 max-w-4xl mx-auto py-8">
        {guidePosts.map(post => (
          <div key={post.id} id={`post-${post.id}`} className="google-card p-8 md:p-12 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-20 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-8">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{new Date(post.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
              {isAdmin && (
                <button 
                  onClick={() => setDeleteId(post.id)} 
                  className="p-3 bg-white/5 text-slate-500 hover:text-rose-500 rounded-xl transition-all btn-feedback"
                >
                  <Icons.Trash />
                </button>
              )}
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black text-white mb-6 tracking-tight">{post.title}</h3>
            <p className="text-base text-slate-400 font-medium leading-relaxed mb-10 whitespace-pre-wrap">{post.content}</p>
            
            <div className="flex flex-wrap gap-4 border-t border-white/5 pt-10">
              {post.attachment && (
                <button 
                  onClick={() => setViewingDoc({ attachment: post.attachment, attachmentType: post.attachmentType, attachmentName: post.attachmentName })} 
                  className="inline-flex items-center gap-3 px-8 h-14 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all btn-feedback shadow-lg"
                >
                   <Icons.File /> Access Document
                </button>
              )}
              {post.link && (
                <a 
                  href={post.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-3 px-8 h-14 bg-white/5 text-white border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all btn-feedback"
                >
                  External Portal <Icons.ExternalLink />
                </a>
              )}
            </div>
          </div>
        ))}
        
        {guidePosts.length === 0 && (
          <div className="text-center py-32 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-3xl text-slate-700">
            <div className="scale-125 mb-6"><Icons.File /></div>
            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Knowledge Base Empty</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => !isDeleting && setDeleteId(null)} 
        onConfirm={confirmDelete} 
        title="Purge Artifact" 
        message="This academic resource will be removed from the institutional repository. This action is terminal."
        isLoading={isDeleting}
      />
    </div>
  );
};
