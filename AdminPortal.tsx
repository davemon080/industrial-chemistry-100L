
import React, { useState } from 'react';
import { User, AppView, ADMIN_CREDENTIALS, CURRENT_APP_SESSION_ID } from '../types';
import { sql } from '../db';
import { Icons } from '../icons';

interface LoginProps {
  setCurrentUser: (u: User) => void;
  setIsAdmin: (b: boolean) => void;
  setCurrentView: (v: AppView) => void;
}

export const Login: React.FC<LoginProps> = ({ setCurrentUser, setIsAdmin, setCurrentView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isAdminMode) {
        if (email === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
          localStorage.setItem('class_sync_session_email', email);
          setIsAdmin(true);
          setCurrentView('admin_portal');
        } else {
          setError('Unauthorized administrator access.');
        }
        return;
      }

      const [user] = await sql`SELECT * FROM users WHERE email = ${email} AND password = ${password} LIMIT 1`;
      if (user) {
        await sql`UPDATE users SET active_session_id = ${CURRENT_APP_SESSION_ID} WHERE email = ${email}`;
        localStorage.setItem('class_sync_session_email', email);
        setCurrentUser({ ...user, is_admin: !!user.is_admin } as any);
        setCurrentView('dashboard');
      } else {
        setError('Incorrect credentials.');
      }
    } catch (err) {
      setError('System unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex-1 flex items-center justify-center py-12 animate-fade-in">
      <div className="w-full max-w-sm google-card p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 ai-gradient-bg"></div>
        <div className="w-16 h-16 ai-gradient-bg rounded-[12px] flex items-center justify-center text-white mx-auto mb-8 shadow-xl">
          <Icons.Shield />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">
          {isAdminMode ? 'Terminal' : 'ICH100L'}
        </h2>
        <p className="text-slate-500 font-medium text-sm mb-10">
          Sync identity to access hub.
        </p>
        
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          {error && <div className="p-4 bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-rose-500/20">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 ml-1 uppercase tracking-widest">Institution Email</label>
            <input 
              type="email" 
              required 
              disabled={isLoading}
              placeholder="name@university.edu"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full h-12 bg-black/20 border border-white/10 rounded-[12px] px-5 font-bold text-white transition-all placeholder:text-slate-600 outline-none focus:border-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 ml-1 uppercase tracking-widest">Security Key</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                disabled={isLoading}
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full h-12 bg-black/20 border border-white/10 rounded-[12px] px-5 pr-14 font-bold text-white transition-all placeholder:text-slate-600 outline-none focus:border-blue-500" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-2"
              >
                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
              </button>
            </div>
          </div>
          
          <button 
            disabled={isLoading}
            className="w-full h-12 bg-white text-black rounded-[12px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-200 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : 'Login'}
          </button>
          
          <div className="pt-8 space-y-4 text-center border-t border-white/5">
            {!isAdminMode && (
              <p className="text-xs text-slate-500 font-medium">
                Unregistered? <button type="button" onClick={() => setCurrentView('signup')} className="text-blue-500 hover:underline font-black">Register</button>
              </p>
            )}
            <button 
              type="button" 
              onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }} 
              className="text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
            >
              {isAdminMode ? 'Student Hub' : 'Admin Terminal'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
