
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, ScheduleItem } from '../types';
import { COURSE_LIST, DAYS_OF_WEEK } from '../constants';
import { ArrowLeft, Monitor, Globe, Send, Clock, MapPin, LayoutGrid, Calendar } from 'lucide-react';

interface Props { 
  user: User; 
  cachedSchedules: ScheduleItem[];
  onUpdate: (id: string, item: Omit<ScheduleItem, 'id'>) => Promise<void>;
}

const EditSchedule: React.FC<Props> = ({ user, cachedSchedules, onUpdate }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState({
    day: DAYS_OF_WEEK[1],
    courseCode: COURSE_LIST[0].code,
    startTime: '08:00',
    endTime: '10:00',
    venue: '',
    type: 'CLASS',
    isOnline: false,
    link: '',
    eventDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const item = cachedSchedules.find(s => s.id === id);
    if (item) {
      // Parse type and venue from [TYPE] Venue
      const match = item.venue.match(/^\[(.*?)\]\s*(.*)$/);
      setFormData({
        day: item.day,
        courseCode: item.courseCode,
        startTime: item.startTime,
        endTime: item.endTime,
        venue: match ? match[2] : item.venue,
        type: match ? match[1] : 'CLASS',
        isOnline: item.isOnline || false,
        link: item.link || '',
        eventDate: item.eventDate || ''
      });
    } else {
      // If not found in cache, might need a refresh or just bail
      navigate('/schedule');
    }
  }, [id, cachedSchedules, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);

    const formattedVenue = `[${formData.type}] ${formData.venue}`;
    
    try {
      await onUpdate(id, {
        day: formData.day,
        courseCode: formData.courseCode,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formattedVenue,
        isOnline: formData.isOnline,
        link: formData.isOnline ? formData.link : null,
        eventDate: formData.eventDate || null
      });
      navigate('/schedule');
    } catch (err) {
      alert("Failed to update schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 bg-white shadow-sm z-10">
        <button onClick={() => navigate('/schedule')} className="p-3 text-gray-400 hover:text-gray-900 rounded-full transition-all">
          <ArrowLeft size={24} />
        </button>
        <h2 className="google-font text-xl font-bold text-gray-900 tracking-tight">Modify Hub Entry</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 md:p-12 pb-32">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8 bg-white p-10 md:p-14 rounded-[64px] shadow-2xl animate-in zoom-in-95 duration-400 border border-gray-100">
          <div className="text-center md:text-left mb-10">
            <h3 className="google-font text-4xl font-black text-gray-900 mb-2 tracking-tighter">Edit Sync Point</h3>
            <p className="text-gray-400 text-sm font-medium">Reconfigure temporal coordinates for this session.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Modality</label>
              <div className="relative">
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 font-bold appearance-none transition-all"
                >
                  <option value="CLASS">Class</option>
                  <option value="TEST">Test</option>
                  <option value="EXAM">Exam</option>
                  <option value="TUTORIAL">Tutorial</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <LayoutGrid size={18} />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Specific Date (Optional)</label>
              <div className="relative">
                <input 
                  type="date"
                  value={formData.eventDate}
                  onChange={e => setFormData({...formData, eventDate: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors ${formData.eventDate ? 'text-gray-300' : 'text-gray-400'}`}>Weekly Day</label>
            <div className="relative">
              <select 
                value={formData.day}
                onChange={e => setFormData({...formData, day: e.target.value})}
                disabled={!!formData.eventDate}
                className={`w-full px-6 py-4 border border-gray-100 rounded-[24px] outline-none font-bold appearance-none transition-all ${formData.eventDate ? 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'bg-gray-50 text-gray-900 focus:ring-4 focus:ring-blue-100'}`}
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Calendar size={18} />
              </div>
            </div>
            {formData.eventDate && (
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest ml-1">Fixed date active: weekly day ignored</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Environment</label>
            <div className="flex p-2 bg-gray-50 border border-gray-100 rounded-[32px]">
              <button type="button" onClick={() => setFormData({...formData, isOnline: false})}
                className={`flex-1 py-4 rounded-[26px] text-[10px] font-black uppercase transition-all flex items-center justify-center ${!formData.isOnline ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <Monitor size={16} className="mr-2" /> Local
              </button>
              <button type="button" onClick={() => setFormData({...formData, isOnline: true})}
                className={`flex-1 py-4 rounded-[26px] text-[10px] font-black uppercase transition-all flex items-center justify-center ${formData.isOnline ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <Globe size={16} className="mr-2" /> Cloud
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Course Module</label>
            <select 
              value={formData.courseCode}
              onChange={e => setFormData({...formData, courseCode: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] outline-none font-bold focus:ring-4 focus:ring-blue-100 transition-all"
            >
              {COURSE_LIST.map(course => (
                <option key={course.code} value={course.code}>{course.code} — {course.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Start Time</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={formData.startTime} 
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Clock size={18} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">End Time</label>
              <div className="relative">
                <input 
                  type="time" 
                  value={formData.endTime} 
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all" 
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Clock size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              {formData.isOnline ? 'Access Link (URL)' : 'Spatial Target (Venue)'}
            </label>
            <div className="relative">
              <input 
                type={formData.isOnline ? 'url' : 'text'}
                placeholder={formData.isOnline ? "https://meet.google.com/..." : "e.g. Science LT 1"}
                value={formData.isOnline ? formData.link : formData.venue}
                onChange={e => setFormData({...formData, [formData.isOnline ? 'link' : 'venue']: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                {formData.isOnline ? <Globe size={18} /> : <MapPin size={18} />}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <Send size={24} />
              <span>{isSubmitting ? 'Updating...' : 'Apply Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSchedule;
