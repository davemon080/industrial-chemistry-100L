
import React, { useState } from 'react';
import { User } from '../types';
import { sql } from '../db';
import { Icons } from '../icons';

interface ProfileProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser, setCurrentUser }) => {
  const [newName, setNewName] = useState(currentUser.name);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleNameUpdate = async () => {
    try {
      await sql`UPDATE users SET name = ${newName} WHERE email = ${currentUser.email}`;
      setCurrentUser(prev => prev ? { ...prev, name: newName } : null);
      alert("Name updated.");
    } catch (err) {
      alert("Failed to update name.");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (newPassword !== confirmPassword) { setPwdError('Passwords do not match.'); return; }
    try {
      const [user] = await sql`SELECT password FROM users WHERE email = ${currentUser.email} LIMIT 1`;
      if (user.password !== oldPassword) { setPwdError('Incorrect current password.'); return; }
      await sql`UPDATE users SET password = ${newPassword} WHERE email = ${currentUser.email}`;
      setPwdSuccess('Security key updated.');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { setPwdError('Update failed.'); }
  };

  return (
    <section className="animate-fade-in max-w-4xl mx-auto py-10 space-y-8">
      <div className="google-card p-10 sm:p-14 flex flex-col lg:flex-row gap-12 items-start">
        <div className="shrink-0 flex flex-col items-center w-full lg:w-auto">
          <div className="w-32 h-32 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center text-5xl font-bold shadow-xl mb-6">
            {currentUser.name.charAt(0)}
          </div>
          <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
            Student
          </div>
        </div>
        
        <div className="flex-1 space-y-10 w-full">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Account Settings</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Personalize your academic workspace</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-semibold focus:bg-white focus:border-blue-600 outline-none transition-all" 
                />
              </div>
              <button 
                onClick={handleNameUpdate} 
                className="h-14 px-8 w-full sm:w-auto google-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-50 hover:bg-blue-700 transition-all"
              >
                Save
              </button>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 space-y-6">
            <h3 className="text-xl font-semibold text-slate-900">Security Credentials</h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-sm">
              {pwdError && <div className="p-4 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">{pwdError}</div>}
              {pwdSuccess && <div className="p-4 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl border border-emerald-100">{pwdSuccess}</div>}
              
              <div className="relative">
                <input type={showPwd1 ? "text" : "password"} placeholder="Current Security Key" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 pr-14 font-semibold outline-none focus:border-blue-600 transition-all" />
                <button type="button" onClick={() => setShowPwd1(!showPwd1)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2">{showPwd1 ? <Icons.EyeOff /> : <Icons.Eye />}</button>
              </div>

              <div className="relative">
                <input type={showPwd2 ? "text" : "password"} placeholder="New Security Key" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 pr-14 font-semibold outline-none focus:border-blue-600 transition-all" />
                <button type="button" onClick={() => setShowPwd2(!showPwd2)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2">{showPwd2 ? <Icons.EyeOff /> : <Icons.Eye />}</button>
              </div>

              <button className="w-full h-14 google-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-50 hover:scale-[1.01] active:scale-98 transition-all">
                Update Key
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
