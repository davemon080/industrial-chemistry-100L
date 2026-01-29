import React, { useState } from 'react';
import CourseCard from '../components/CourseCard';
import { Course, User, Notification } from '../types';

interface DashboardProps {
  courses: Course[];
  user: User;
  notifications: Notification[];
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ courses, user, notifications, onAddCourse, onUpdateCourse, onDeleteCourse }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newInstructor, setNewInstructor] = useState('');

  const isSubscribed = user.subscription?.status === 'active';
  const isRep = user.role === 'rep';

  const resetForm = () => {
    setNewCourseId('');
    setNewCourseTitle('');
    setNewInstructor('');
    setEditingCourse(null);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setNewCourseId(course.id);
    setNewCourseTitle(course.title);
    setNewInstructor(course.instructor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Permanently remove ${id}?`)) {
      setIsDeletingId(id);
      // Simulate API delay for UX feedback
      await new Promise(r => setTimeout(r, 600));
      onDeleteCourse(id);
      setIsDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId.trim() || !newCourseTitle.trim()) return;
    setIsProcessing(true);

    // Simulate process
    await new Promise(r => setTimeout(r, 800));

    if (editingCourse) {
      onUpdateCourse({
        ...editingCourse,
        id: newCourseId.toUpperCase().replace(/\s+/g, ''),
        title: newCourseTitle,
        instructor: newInstructor || 'Staff Faculty'
      });
    } else {
      const newCourse: Course = {
        id: newCourseId.toUpperCase().replace(/\s+/g, ''),
        title: newCourseTitle,
        instructor: newInstructor || 'Staff Faculty',
        thumbnail: '',
        progress: 0,
        modules: []
      };
      onAddCourse(newCourse);
    }
    
    setIsProcessing(false);
    resetForm();
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="mb-14 px-2">
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.25em]">
            {user.role === 'rep' ? 'Course Rep Hub' : 'Student Organizer'}
          </span>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              Hi, <span className="text-indigo-600">{user.name.split(' ')[0]}</span>
            </h1>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex flex-col">
          {courses.map((course) => (
            <div key={course.id} className={`relative group transition-opacity ${isDeletingId === course.id ? 'opacity-50 grayscale' : ''}`}>
              <CourseCard course={course} />
              
              {isDeletingId === course.id && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
                   <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {isRep && !isDeletingId && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.preventDefault(); handleOpenEdit(course); }}
                    className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleDelete(course.id); }}
                    className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isRep && (
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="fixed bottom-28 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-950/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingCourse ? 'Edit Course' : 'Register Course'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <input required placeholder="Course Code" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase" value={newCourseId} onChange={(e) => setNewCourseId(e.target.value)} />
                <input required placeholder="Full Course Title" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} />
              </div>
              <button type="submit" disabled={isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-indigo-700 shadow-xl disabled:opacity-50">
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </div>
                ) : (editingCourse ? 'Apply Changes' : 'Deploy to Registry')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;