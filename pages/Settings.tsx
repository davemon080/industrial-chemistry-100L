
import React, { useState } from 'react';
import { User } from '../types';
import { dbService } from '../services/dbService';
import { LogOut, Lock, User as UserIcon, Bell, Shield, Loader2, ChevronRight } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const Settings: React.FC<Props> = ({ user, onLogout }) => {
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) return;
    
    setIsUpdating(true);
    try {
      const success = await dbService.updatePassword(user.matricNumber, newPassword);
      if (success) {
        setSuccess('Password updated successfully!');
        setNewPassword('');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      alert("Failed to update password.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 pb-24">
      <header className="mb-8">
        <h1 className="google-font text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 font-medium">Manage your ICH digital profile</p>
      </header>

      <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[32px] flex items-center justify-center text-blue-600 shadow-inner">
            <UserIcon size={48} />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="google-font text-2xl font-bold text-gray-900">{user.matricNumber}</h3>
            <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 ${
              user.isCourseRep ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.isCourseRep ? 'Course Representative' : 'ICH Student'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="google-font font-bold text-gray-900 flex items-center uppercase text-xs tracking-widest">
              <Lock size={16} className="mr-2 text-blue-600" />
              Security Settings
            </h4>
          </div>
          
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm border border-green-100 font-medium">
              {success}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">Change Password</label>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                disabled={isUpdating}
              />
              <button
                type="submit"
                disabled={newPassword.length < 4 || isUpdating}
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 flex items-center justify-center whitespace-nowrap"
              >
                {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden mb-6">
        <button className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-all group">
          <div className="flex items-center text-gray-700 font-bold">
            <Bell size={22} className="mr-4 text-gray-400 group-hover:text-blue-500 transition-colors" /> Push Notifications
          </div>
          <div className="w-12 h-6 bg-blue-600 rounded-full relative transition-colors">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
          </div>
        </button>
        <button className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-all group">
          <div className="flex items-center text-gray-700 font-bold">
            <Shield size={22} className="mr-4 text-gray-400 group-hover:text-blue-500 transition-colors" /> Privacy & Terms
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      </div>

      <button 
        onClick={onLogout}
        className="w-full px-8 py-6 bg-red-50 text-red-600 font-black rounded-[32px] hover:bg-red-100 transition-all flex items-center justify-center space-x-2 border border-red-100"
      >
        <LogOut size={22} />
        <span>LOG OUT OF SESSION</span>
      </button>
      
      <p className="text-center text-gray-400 text-[10px] font-black tracking-widest mt-12 uppercase">
        ICH Hub v1.0.4 • Powered by Neon SQL
      </p>
    </div>
  );
};

export default Settings;
