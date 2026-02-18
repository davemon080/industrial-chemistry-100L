
import React, { useState } from 'react';
import { User, AppView, CURRENT_APP_SESSION_ID } from '../types';
import { sql } from '../db';
import { Icons } from '../icons';

interface SignupProps {
  setCurrentUser: (u: User) => void;
  setCurrentView: (v: AppView) => void;
}

export const Signup: React.FC<SignupProps> = ({ setCurrentUser, setCurrentView }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const check = await sql`SELECT email FROM users WHERE email = ${email}`;
      if (check.length > 0) { 
        setError('An account with this email already exists.'); 
        return; 
      }
      await sql`INSERT INTO users (email, name, password, active_session_id) VALUES (${email}, ${name}, ${password}, ${CURRENT_APP_SESSION_ID})`;
      localStorage.setItem('class_sync_session_email', email);
      setCurrentUser({ email, name, is_admin: false } as any);
      setCurrentView('dashboard');
    } catch (err) { 
      setError('Registration failed. Please try again.'); 
    }
  };

  return (
    <section className="flex-1 flex items-center justify-center py-12 animate-fade-in px-6">
      <div className="w-full max-w-md google-card p-10 sm:p-12 text-center">
        <div className="w-14 h-14 google-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-blue-100">
          <Icons.Shield />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Create Student Account</h2>
        <p className="text-slate-500 font-medium text-sm mb-10">Join ClassSync for effortless scheduling.</p>
        
        <form onSubmit={handleSignup} className="space-y-5 text-left">
          {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 ml-1 uppercase tracking-wider">Full name</label>
            <input 
              type="text" 
              required 
              placeholder="John Doe"
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 ml-1 uppercase tracking-wider">Institutional email</label>
            <input 
              type="email" 
              required 
              placeholder="student@university.edu"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400" 
            />
          </div>
          
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-600 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Min. 6 characters"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 pr-14 font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2"
              >
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>
          
          <button className="w-full h-14 google-primary text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-98 transition-all mt-4">
            Register Now
          </button>
          
          <div className="pt-8 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Already have an account? <button type="button" onClick={() => setCurrentView('login')} className="google-text-primary hover:underline font-bold">Sign in</button>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};
