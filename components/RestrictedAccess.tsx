
import React from 'react';
import { Link } from 'react-router-dom';

interface RestrictedAccessProps {
  title: string;
  description: string;
}

const RestrictedAccess: React.FC<RestrictedAccessProps> = ({ title, description }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-50/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-12 text-center relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl" />
        
        <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mb-8 mx-auto shadow-sm">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">{title}</h2>
        <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10">{description}</p>

        <Link 
          to="/settings" 
          className="block w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          Activate Membership • ₦1,000
        </Link>
        
        <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
          30-Day Pro Access Included
        </p>
      </div>
    </div>
  );
};

export default RestrictedAccess;
