
import React from 'react';
import { Lightbulb, BookOpen, Info, ShieldCheck } from 'lucide-react';

const Guide: React.FC = () => {
  const guides = [
    {
      title: 'Registration Basics',
      icon: <Info className="text-blue-600" />,
      content: 'Ensure you complete your course registration before the 2nd week of lectures. Check your portal for any outstanding fees.'
    },
    {
      title: 'Study Tips',
      icon: <Lightbulb className="text-yellow-500" />,
      content: 'Focus on MATH101 and CHM101 early as they form the foundation for Industrial Chemistry. Form study groups of 3-5 students.'
    },
    {
      title: 'Lab Safety',
      icon: <ShieldCheck className="text-green-600" />,
      content: 'For CHM107 and PHY107, always wear your lab coat, goggles, and closed-toe shoes. Safety is priority in ICH.'
    },
    {
      title: 'Exam Preparation',
      icon: <BookOpen className="text-purple-600" />,
      content: 'Past questions are available in the course repository. Start reviewing at least 4 weeks before finals.'
    }
  ];

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="google-font text-3xl font-bold text-gray-900">Student Guide</h1>
        <p className="text-gray-500 mt-1">Everything you need to navigate 100L</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {guides.map((guide, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-start space-x-6">
            <div className="bg-gray-50 p-4 rounded-3xl">
              {guide.icon}
            </div>
            <div>
              <h3 className="google-font text-xl font-bold text-gray-900 mb-2">{guide.title}</h3>
              <p className="text-gray-500 leading-relaxed">{guide.content}</p>
            </div>
          </div>
        ))}

        <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-200 mt-4">
          <h3 className="google-font text-2xl font-bold mb-2">Need direct help?</h3>
          <p className="opacity-90 mb-6 italic text-sm">"Success in Industrial Chemistry starts with diligence and the right resources."</p>
          <div className="flex space-x-2">
            <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-bold transition-all">
              Contact Rep
            </button>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg">
              Visit Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
