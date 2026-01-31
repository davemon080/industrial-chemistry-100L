
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ScheduleItem } from '../types';
import { COURSE_LIST, DAYS_OF_WEEK } from '../constants';
import { ArrowLeft, Monitor, Globe, Clock, MapPin, Send, LayoutGrid } from 'lucide-react';

interface Props { 
  user: User; 
  onAdd: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
}

const AddSchedule: React.FC<Props> = ({ user, onAdd }) => {
  const navigate = useNavigate();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedVenue = `[${formData.type}] ${formData.venue}`;
    
    // Background publication
    onAdd({
      day: formData.day,
      courseCode: formData.courseCode,
      startTime: formData.startTime,
      endTime: formData.endTime,
      venue: formattedVenue,
      isOnline: formData.isOnline,
      link: formData.isOnline ? formData.link : null,
      eventDate: formData.eventDate || null
    });

    // Instant redirect
    navigate('/schedule');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <div className="h-20 border-b border-gray-100 flex items-center justify-between px-6 bg-white">
        <button onClick={() => navigate('/schedule')} className="p-3 text-gray-400 hover:text-gray-900 rounded-full transition-all">
          <ArrowLeft size={24} />
        </button>
        <h2 className="google-font text-xl font-bold text-gray-900">Configure Sync</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 md:p-12">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8 bg-white p-10 md:p-14 rounded-[64px] shadow-2xl animate-in zoom-in-95 duration-400">
          <div className="text-center md:text-left mb-10">
            <h3 className="google-font text-4xl font-black text-gray-900 mb-2">Init Interface</h3>
            <p className="text-gray-400 text-sm font-medium">Broadcast a new temporal synchronization point.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Modality</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 font-bold appearance-none"
              >
                <option value="CLASS">Class</option>
                <option value="TEST">Test</option>
                <option value="EXAM">Exam</option>
                <option value="TUTORIAL">Tutorial</option>
                <option value="ASSIGNMENT">Assignment</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Specific Date</label>
              <input 
                type="date"
                value={formData.eventDate}
                onChange={e => setFormData({...formData, eventDate: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 font-bold"
              />
            </div>
          </div>

          {!formData.eventDate && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Weekly Day</label>
              <select 
                value={formData.day}
                onChange={e => setFormData({...formData, day: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] outline-none focus:ring-4 focus:ring-blue-100 font-bold appearance-none"
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Environment</label>
            <div className="flex p-2 bg-gray-50 border border-gray-100 rounded-[32px]">
              <button type="button" onClick={() => setFormData({...formData, isOnline: false})}
                className={`flex-1 py-4 rounded-[26px] text-[10px] font-black uppercase transition-all flex items-center justify-center ${!formData.isOnline ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}>
                <Monitor size={16} className="mr-2" /> Local
              </button>
              <button type="button" onClick={() => setFormData({...formData, isOnline: true})}
                className={`flex-1 py-4 rounded-[26px] text-[10px] font-black uppercase transition-all flex items-center justify-center ${formData.isOnline ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}>
                <Globe size={16} className="mr-2" /> Cloud
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Module</label>
            <select 
              value={formData.courseCode}
              onChange={e => setFormData({...formData, courseCode: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] outline-none font-bold"
            >
              {COURSE_LIST.map(course => (
                <option key={course.code} value={course.code}>{course.code} — {course.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Initiate</label>
              <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Terminate</label>
              <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              {formData.isOnline ? 'Protocol Link (URL)' : 'Spatial Coordinate (Venue)'}
            </label>
            <input 
              type={formData.isOnline ? 'url' : 'text'}
              placeholder={formData.isOnline ? "https://..." : "e.g. Science LT 1"}
              value={formData.isOnline ? formData.link : formData.venue}
              onChange={e => setFormData({...formData, [formData.isOnline ? 'link' : 'venue']: e.target.value})}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] font-bold"
            />
          </div>

          <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center space-x-3">
            <Send size={24} />
            <span>Publish Transmission</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSchedule;
