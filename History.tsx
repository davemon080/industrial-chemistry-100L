
import React, { useState, useEffect } from 'react';
import { CourseCode, AppView, ScheduleCategory, ClassType, COURSES, MAX_FILE_SIZE, Schedule, Attachment } from '../types';
import { pool } from '../db';
import { appCache } from '../cache';
import { Icons } from '../icons';
import { DatePicker } from '../components/DatePicker';
import { AdminDatabaseExplorer } from './AdminDatabaseExplorer';
import { prepareAgnosticDate } from '../helpers';
import { ToastType } from '../components/Toast';

interface AdminPortalProps {
  customIcons: Record<string, string>;
  setCustomIcons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fetchAllData: () => void;
  setCurrentView: (v: AppView) => void;
  editingSchedule: Schedule | null;
  setEditingSchedule: (s: Schedule | null) => void;
  showToast: (msg: string, type?: ToastType) => void;
  totalUsers?: number;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ 
  customIcons, 
  setCustomIcons, 
  fetchAllData, 
  setCurrentView,
  editingSchedule,
  setEditingSchedule,
  showToast,
  totalUsers = 0
}) => {
  const [adminTab, setAdminTab] = useState<'create' | 'icons' | 'database'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newCategory, setNewCategory] = useState<ScheduleCategory>('class');
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState<CourseCode>('math101');
  const [newDate, setNewDate] = useState(''); // Due date
  const [givenDate, setGivenDate] = useState(''); // Assigned date
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<ClassType>('Physical');
  const [newLoc, setNewLoc] = useState('');
  const [newInst, setNewInst] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (editingSchedule) {
      setAdminTab('create');
      setNewCategory(editingSchedule.category);
      setNewTitle(editingSchedule.title || '');
      setNewCourse(editingSchedule.course || 'math101');
      setNewDate(editingSchedule.date || '');
      setGivenDate(editingSchedule.givenDate || '');
      setNewTime(editingSchedule.time);
      setNewType(editingSchedule.type);
      setNewLoc(editingSchedule.location);
      setNewInst(editingSchedule.instructions);
      setAttachments(editingSchedule.attachments || []);
    } else {
      setNewCategory('class');
      setNewTitle('');
      setNewDate('');
      setGivenDate('');
      setNewTime('');
      setNewType('Physical');
      setNewLoc('');
      setNewInst('');
      setAttachments([]);
    }
  }, [editingSchedule]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file: File) => {
      if (file.size > MAX_FILE_SIZE) { alert(`File ${file.name} exceeds institutional limit: 50MB`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment = { data: reader.result as string, type: file.type, name: file.name };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    const client = await pool.connect();
    
    try {
      const { agnosticDate, agnosticTime } = prepareAgnosticDate(newDate, newTime);
      const now = Date.now();
      const displayTitle = newCategory === 'activity' ? newTitle : `${COURSES[newCourse]}`;
      
      const attachmentJson = attachments.length > 0 ? JSON.stringify(attachments) : null;
      
      await client.query('BEGIN');

      // Explicitly convert empty strings to null to avoid constraint violations on mismatched DB schemas
      const finalDate = (agnosticDate && agnosticDate.trim() !== '') ? agnosticDate : null;
      const finalGivenDate = (newCategory === 'assignment' && givenDate && givenDate.trim() !== '') ? givenDate : null;

      if (editingSchedule) {
        await client.query(`
          UPDATE schedules 
          SET category = $1, course = $2, title = $3, date = $4, given_date = $5, time = $6, type = $7, location = $8, instructions = $9, attachment = $10
          WHERE id = $11
        `, [
          newCategory, 
          newCategory === 'activity' ? null : newCourse, 
          newTitle, 
          finalDate, 
          finalGivenDate,
          agnosticTime, 
          newType, 
          newLoc, 
          newInst, 
          attachmentJson,
          editingSchedule.id
        ]);

        // Dispath update notification to all users
        await client.query(`
          INSERT INTO notifications (user_email, title, message, category, is_read)
          SELECT email, $1, $2, $3, FALSE FROM users
        `, [
          displayTitle, 
          `Academic session refined: Institutional details for "${displayTitle}" have been updated.`, 
          newCategory
        ]);

      } else {
        await client.query(`
          INSERT INTO schedules (category, course, title, date, given_date, time, type, location, instructions, created_at_timestamp, attachment)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          newCategory, 
          newCategory === 'activity' ? null : newCourse, 
          newTitle, 
          finalDate, 
          finalGivenDate,
          agnosticTime, 
          newType, 
          newLoc, 
          newInst, 
          now, 
          attachmentJson
        ]);

        // Dispatch new record notification to all users
        await client.query(`
          INSERT INTO notifications (user_email, title, message, category, is_read)
          SELECT email, $1, $2, $3, FALSE FROM users
        `, [
          displayTitle, 
          `New academic session manifested: "${displayTitle}" is now active on the timeline.`, 
          newCategory
        ]);
      }

      await client.query('COMMIT');

      appCache.delete('schedules');
      const stats = appCache.getStats();
      stats.keys.forEach(key => { if (key.startsWith('notifs_')) appCache.delete(key); });

      showToast(editingSchedule ? "Record Updated" : "Timeline Synchronized", "success");
      setEditingSchedule(null);
      fetchAllData();
      setCurrentView('dashboard');
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error("Database Sync Error:", err);
      showToast(`Sync Error: ${err.message}`, "error");
    } finally {
      client.release();
      setIsSubmitting(false);
    }
  };

  const handleIconUpload = async (code: CourseCode, file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const blob = reader.result as string;
        await pool.query(`
          INSERT INTO custom_icons (course_code, icon_data) 
          VALUES ($1, $2)
          ON CONFLICT (course_code) DO UPDATE SET icon_data = EXCLUDED.icon_data
        `, [code, blob]);
        appCache.delete('custom_icons');
        setCustomIcons(prev => ({ ...prev, [code]: blob }));
        showToast(`${COURSES[code]} Branding Refreshed`, "success");
      } catch (e) { 
        showToast("Branding Refine Failed", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="animate-fade-in space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-white leading-none uppercase">
            {editingSchedule ? 'Edit Session' : 'Console'}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {editingSchedule ? 'Modify active academic record' : 'Timeline Orchestration'}
          </p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-[12px] border border-white/10 self-start overflow-x-auto no-scrollbar max-w-full">
          <button onClick={() => setAdminTab('create')} className={`px-4 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all btn-feedback shrink-0 ${adminTab === 'create' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>Orchestrator</button>
          <button onClick={() => setAdminTab('icons')} className={`px-4 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all btn-feedback shrink-0 ${adminTab === 'icons' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>Branding</button>
          <button onClick={() => setAdminTab('database')} className={`px-4 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all btn-feedback shrink-0 ${adminTab === 'database' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>Explorer</button>
        </div>
      </header>

      {adminTab === 'create' ? (
        <div className="space-y-8">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="google-card p-6 bg-blue-600/5 border-blue-500/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 ai-gradient-bg opacity-10 blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity"></div>
               <div className="flex items-center gap-4 relative z-10">
                 <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center shadow-inner">
                   <Icons.Shield />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered Accounts</p>
                   <h4 className="text-3xl font-black text-white leading-none mt-1">{totalUsers}</h4>
                 </div>
               </div>
               <div className="mt-4 flex items-center gap-2 relative z-10">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Institutional Pulse Active</span>
               </div>
            </div>
            {/* Additional stat slots can go here */}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            <fieldset disabled={isSubmitting} className="lg:col-span-8 space-y-6">
              <div className="google-card p-6 md:p-10 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 ai-gradient-bg text-white rounded-[12px] flex items-center justify-center shadow-lg">
                      {editingSchedule ? <Icons.Refresh /> : <Icons.Plus />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">{editingSchedule ? 'Modify Entry' : 'Create Entry'}</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Session parameters</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                      <div className="flex bg-black/20 p-1.5 rounded-[12px] border border-white/10 h-14">
                        {(['class', 'assignment', 'activity'] as const).map(cat => (
                          <button key={cat} type="button" onClick={() => setNewCategory(cat)} className={`flex-1 rounded-[8px] text-[9px] font-black uppercase tracking-widest transition-all btn-feedback ${newCategory === cat ? 'bg-white/10 text-white border border-white/10 shadow-sm' : 'text-slate-500'}`}>{cat}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modality</label>
                      <div className="flex bg-black/20 p-1.5 rounded-[12px] border border-white/10 h-14">
                        {(['Physical', 'Online'] as const).map(t => (
                          <button key={t} type="button" onClick={() => setNewType(t)} className={`flex-1 rounded-[8px] text-[9px] font-black uppercase tracking-widest transition-all btn-feedback ${newType === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                     {newCategory === 'activity' ? (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
                          <input type="text" required placeholder="Session Identifier" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full h-14 bg-black/20 border border-white/10 rounded-[12px] px-6 font-bold text-white transition-all placeholder:text-slate-600 outline-none focus:border-blue-500" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Course Code</label>
                          <select value={newCourse} onChange={e => setNewCourse(e.target.value as CourseCode)} className="w-full h-14 bg-black/20 border border-white/10 rounded-[12px] px-6 font-bold text-white transition-all cursor-pointer outline-none focus:border-blue-500">
                            {Object.entries(COURSES).map(([c, n]) => <option key={c} value={c as CourseCode} className="bg-[#161a22]">{c.toUpperCase()} — {n}</option>)}
                          </select>
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commencement</label>
                      <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full h-14 bg-black/20 border border-white/10 rounded-[12px] px-6 font-bold text-white transition-all outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{newType === 'Online' ? 'Meeting URL' : 'Campus Venue'}</label>
                      <input type="text" required placeholder={newType === 'Online' ? 'https://...' : 'Location Name'} value={newLoc} onChange={e => setNewLoc(e.target.value)} className="w-full h-14 bg-black/20 border border-white/10 rounded-[12px] px-6 font-bold text-white transition-all placeholder:text-slate-600 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-8 border-t border-white/5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lecturer's Comments / Description</label>
                    <textarea rows={4} placeholder="Write instructions or comments here..." value={newInst} onChange={e => setNewInst(e.target.value)} className="w-full p-6 bg-black/20 border border-white/10 rounded-[12px] font-bold text-white transition-all resize-none placeholder:text-slate-600 outline-none focus:border-blue-500" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Study Materials (Multi-Upload Support)</label>
                    <div className="flex flex-col gap-4">
                      <div className="relative h-24 border-2 border-dashed rounded-[12px] flex items-center justify-center transition-all group border-white/10 bg-black/20 hover:border-blue-500/30">
                        <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[8px] bg-white/5 text-slate-600 flex items-center justify-center transition-all"><Icons.File /></div>
                          <div>
                            <span className="text-xs font-bold text-white">Select Academic Artifacts</span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Multiple images or documents supported</span>
                          </div>
                        </div>
                      </div>

                      {attachments.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {attachments.map((att, idx) => (
                            <div key={idx} className="relative group bg-white/5 border border-white/10 rounded-[12px] p-3 flex items-center gap-3">
                              <div className="w-8 h-8 shrink-0 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center">
                                {att.type.includes('image') ? <Icons.Save /> : <Icons.File />}
                              </div>
                              <span className="text-[10px] font-bold text-white truncate max-w-full">{att.name}</span>
                              <button 
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <Icons.X />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 h-14 ai-gradient-bg text-white rounded-[12px] font-black text-[11px] uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 btn-feedback"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Synchronizing...
                      </div>
                    ) : (editingSchedule ? 'Push Update' : 'Push to Timeline')}
                  </button>
                  {editingSchedule && (
                    <button type="button" onClick={() => { setEditingSchedule(null); setCurrentView('dashboard'); }} className="h-14 px-8 bg-white/5 border border-white/10 text-slate-400 rounded-[12px] font-black text-[10px] uppercase tracking-widest hover:text-white transition-all btn-feedback">Cancel</button>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset disabled={isSubmitting} className="lg:col-span-4 space-y-6">
              <DatePicker 
                value={newDate} 
                onChange={setNewDate} 
                inline={true} 
                label={newCategory === 'assignment' ? "Submission Deadline" : "Session Date"} 
                darkMode={true} 
              />
              
              {newCategory === 'assignment' && (
                <DatePicker 
                  value={givenDate} 
                  onChange={setGivenDate} 
                  inline={true} 
                  label="Assigned / Given Date" 
                  darkMode={true} 
                />
              )}
              
              <div className="google-card p-8 bg-black/40 border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-48 h-48 ai-gradient-bg blur-[80px] rounded-full -mr-24 -mt-24 opacity-20"></div>
                 <div className="flex items-center gap-3 text-blue-400 mb-4 relative z-10">
                   <Icons.Shield />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">Protocol</h4>
                 </div>
                 <p className="text-xs text-slate-400 font-bold leading-relaxed relative z-10 opacity-80 mb-8">
                   {newCategory === 'assignment' 
                     ? 'Setting the "Assigned Date" allows the system to calculate the submission window for the students.'
                     : 'Classes and Activities are manifestation events on the institutional timeline. Dates are optional but recommended for visibility.'}
                 </p>
                 <div className="flex items-center gap-4 relative z-10 border-t border-white/5 pt-6">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Governance Active</span>
                 </div>
              </div>
            </fieldset>
          </form>
        </div>
      ) : adminTab === 'icons' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Object.keys(COURSES).map(c => (
            <div key={c} className="google-card p-6 flex flex-col items-center group text-center">
              <div className="w-16 h-16 mb-4 bg-white/5 rounded-[12px] border border-white/10 flex items-center justify-center p-3 group-hover:scale-105 transition-transform">
                {customIcons[c] ? <img src={customIcons[c]} className="w-full h-full object-contain" alt="course" /> : <Icons.Calendar />}
              </div>
              <div className="h-10 mb-6">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{c}</p>
                <h4 className="font-bold text-white text-[10px] leading-tight px-1">{COURSES[c as CourseCode]}</h4>
              </div>
              <label className="w-full">
                <div className="w-full h-10 bg-white/5 text-slate-400 rounded-[8px] flex items-center justify-center text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-white hover:text-black transition-all btn-feedback">Modify</div>
                <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleIconUpload(c as CourseCode, e.target.files[0])} />
              </label>
            </div>
          ))}
        </div>
      ) : (
        <AdminDatabaseExplorer onDataChange={fetchAllData} showToast={showToast} />
      )}
    </section>
  );
};
