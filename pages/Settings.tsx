
import React, { useState } from 'react';
import { User, UserPreferences, EventType, Subscription } from '../types';

interface SettingsProps {
  user: User;
  onLogout: () => void;
  preferences: UserPreferences;
  onUpdatePrefs: (p: UserPreferences) => void;
  onUpdateUser: (u: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout, preferences, onUpdatePrefs, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const isSubscribed = user.subscription?.status === 'active';

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, name, email, avatar });
    showStatus('Profile updated successfully');
  };

  const showStatus = (msg: string, isError = false) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const updateLeadTime = (type: EventType, value: number) => {
    onUpdatePrefs({
      ...preferences,
      defaultLeadTimes: {
        ...preferences.defaultLeadTimes,
        [type]: value
      }
    });
  };

  const toggleNotifications = () => {
    onUpdatePrefs({
      ...preferences,
      notificationsEnabled: !preferences.notificationsEnabled
    });
  };

  const handleSubscribe = () => {
    setIsProcessingPay(true);
    // Simulate transaction delay
    setTimeout(() => {
      const now = new Date();
      const expiry = new Date();
      expiry.setDate(now.getDate() + 30); // 30 Day subscription

      const newSub: Subscription = {
        status: 'active',
        expiryDate: expiry.toISOString(),
        lastPaymentDate: now.toISOString()
      };

      onUpdateUser({ ...user, subscription: newSub });
      setIsProcessingPay(false);
      showStatus('Subscription Activated Successfully!');
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="mb-12 px-2">
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] block mb-1">Preferences & Identity</span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Settings</h1>
      </header>

      {saveStatus && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl z-50 animate-in slide-in-from-bottom-4 ${saveStatus.includes('Error') ? 'bg-rose-500' : 'bg-emerald-500'}`}>
          {saveStatus}
        </div>
      )}

      <div className="space-y-8">
        {/* Subscription Panel - Featured at top */}
        <section className={`rounded-[2.5rem] border p-8 shadow-sm transition-all ${isSubscribed ? 'bg-white border-indigo-100' : 'bg-indigo-900 text-white border-indigo-950'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isSubscribed ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-900'}`}>
                  {isSubscribed ? 'Active Member' : 'EduStream Pro'}
                </span>
              </div>
              <h3 className={`text-2xl font-black tracking-tight ${isSubscribed ? 'text-slate-900' : 'text-white'}`}>
                {isSubscribed ? 'Subscription Valid' : 'Upgrade your experience'}
              </h3>
              <p className={`text-xs font-bold mt-1 max-w-sm ${isSubscribed ? 'text-slate-400' : 'text-indigo-200'}`}>
                {isSubscribed 
                  ? `Access expires on ${new Date(user.subscription!.expiryDate!).toLocaleDateString()}. Total fee: ₦1,000/month.` 
                  : 'Get restricted access to course modules, AI assistance, and master schedule for just ₦1,000/month.'}
              </p>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={isProcessingPay || isSubscribed}
              className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                isSubscribed 
                  ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed' 
                  : 'bg-white text-indigo-900 shadow-xl hover:scale-105 active:scale-95'
              }`}
            >
              {isProcessingPay ? (
                <>
                  <div className="w-3 h-3 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                isSubscribed ? 'Membership Active' : 'Pay ₦1,000 • 30 Days'
              )}
            </button>
          </div>
          
          {user.subscription?.status === 'expired' && (
            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center">Your membership has expired. Renew to restore access.</p>
            </div>
          )}
        </section>

        {/* Personal Details & Avatar */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 bg-indigo-600 rounded-full" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Personal Identity</h3>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group">
                <img src={avatar} alt={user.name} className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-50 shadow-xl object-cover transition-transform group-hover:scale-105" />
                <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 rounded-[2.5rem] cursor-pointer transition-opacity">
                   <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   <input type="file" className="hidden" onChange={(e) => {
                     if (e.target.files?.[0]) {
                       const url = URL.createObjectURL(e.target.files[0]);
                       setAvatar(url);
                     }
                   }} />
                </label>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                </div>
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Update Profile</button>
              </div>
            </div>
          </form>
        </section>

        {/* Academic Alerts Switch */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Curriculum Reminders</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Automatic alerts for classes and exams</p>
            </div>
            <button 
              onClick={toggleNotifications}
              className={`w-14 h-7 rounded-full p-1 transition-colors ${preferences.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${preferences.notificationsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          {preferences.notificationsEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
              {(Object.keys(preferences.defaultLeadTimes) as EventType[]).map((type) => (
                <div key={type} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{type}</span>
                    <span className="text-xs font-black text-indigo-600">{preferences.defaultLeadTimes[type]}m</span>
                  </div>
                  <input 
                    type="range" min="15" max="4320" step="15"
                    value={preferences.defaultLeadTimes[type]}
                    onChange={(e) => updateLeadTime(type, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-rose-50/50 rounded-[2.5rem] border border-rose-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Destructive Actions</h3>
              <p className="text-xs text-rose-400 font-medium mt-1">End your current session immediately</p>
            </div>
            <button onClick={onLogout} className="px-8 py-4 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200">Log Out</button>
          </div>
        </section>
      </div>

      <footer className="mt-16 text-center opacity-30">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">EduStream CORE v1.0.8</p>
      </footer>
    </div>
  );
};

export default Settings;
