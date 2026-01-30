
import React from 'react';
import { DAYS_OF_WEEK } from '../constants';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

const Schedule: React.FC = () => {
  // Mock data for 100L ICH schedule
  const scheduleData = [
    { day: 'Monday', courses: [{ code: 'CHM101', time: '08:00 - 10:00', venue: 'LT1' }, { code: 'BIO101', time: '12:00 - 14:00', venue: 'B02' }] },
    { day: 'Tuesday', courses: [{ code: 'PHY101', time: '10:00 - 12:00', venue: 'Physics Lab' }, { code: 'GST101', time: '14:00 - 16:00', venue: 'Auditorium' }] },
    { day: 'Wednesday', courses: [{ code: 'MATH101', time: '09:00 - 11:00', venue: 'Math Hall' }, { code: 'CHM107', time: '13:00 - 16:00', venue: 'Chemistry Lab' }] },
    { day: 'Thursday', courses: [{ code: 'COS101', time: '10:00 - 12:00', venue: 'CS Lab' }, { code: 'BIO107', time: '14:00 - 17:00', venue: 'Bio Lab' }] },
    { day: 'Friday', courses: [{ code: 'PHY107', time: '09:00 - 12:00', venue: 'Physics Lab' }] },
  ];

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="google-font text-3xl font-bold text-gray-900">Lecture Schedule</h1>
        <p className="text-gray-500 mt-1">Don't miss a class - Weekly timetable</p>
      </header>

      <div className="space-y-6">
        {scheduleData.map((item) => (
          <div key={item.day} className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
            <div className="bg-blue-50 px-6 py-4 flex items-center">
              <CalendarIcon size={18} className="text-blue-600 mr-2" />
              <h3 className="google-font font-bold text-blue-900">{item.day}</h3>
            </div>
            <div className="p-2">
              {item.courses.map((course, idx) => (
                <div key={idx} className={`p-4 flex items-center justify-between ${idx !== item.courses.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-gray-700">
                      {course.code.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{course.code}</h4>
                      <div className="flex items-center text-xs text-gray-400 mt-1 space-x-3">
                        <span className="flex items-center"><Clock size={12} className="mr-1" /> {course.time}</span>
                        <span className="flex items-center"><MapPin size={12} className="mr-1" /> {course.venue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schedule;
