
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { UserPlus, Loader2 } from 'lucide-react';

interface Props {
  onRegister: (user: User) => void;
}

const Register: React.FC<Props> = ({ onRegister }) => {
  const [matricNumber, setMatricNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!matricNumber) {
      setError('Matric number is required');
      setIsLoading(false);
      return;
    }

    try {
      const user = await dbService.register(matricNumber);
      if (user) {
        onRegister(user);
      } else {
        setError('Matric number already registered or server error');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-gradient-to-tr from-indigo-50/50 via-white to-blue-50/30">
      <div className="w-full animate-fade-in">
        <div className="mb-12">
          <div className="inline-block p-5 bg-blue-50 text-blue-600 rounded-[24px] mb-6 shadow-xl shadow-blue-50">
            <UserPlus size={40} strokeWidth={2.5} />
          </div>
          <h1 className="google-font text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Join the Hub
          </h1>
          <p className="text-gray-400 mt-4 text-xl md:text-2xl font-medium">
            Start your journey as an Industrial Chemist today.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Enter your Matric Number</label>
            <input
              type="text"
              placeholder="e.g. 2025/PS/ICH/00XX"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value)}
              className="w-full px-8 py-5 bg-white border border-gray-200 rounded-[28px] focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none font-medium text-lg shadow-sm"
              disabled={isLoading}
            />
          </div>

          <div className="p-6 bg-blue-600 text-white rounded-[32px] shadow-2xl shadow-blue-100 flex items-start space-x-4">
            <div className="p-2 bg-white/20 rounded-xl mt-1">
              <Loader2 className="h-4 w-4 animate-pulse" />
            </div>
            <p className="text-sm font-medium leading-relaxed">
              <strong>Security Protocol:</strong> By default, your initial password is set to your Matric Number. You can customize this anytime in your profile settings.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-64 py-5 bg-blue-600 text-white rounded-[28px] font-bold hover:bg-blue-700 transform transition-all active:scale-[0.98] shadow-xl shadow-blue-100 flex items-center justify-center text-xl"
            >
              {isLoading ? <Loader2 className="animate-spin h-7 w-7" /> : 'Create Profile'}
            </button>
            <p className="text-gray-500 font-medium">
              Already joined?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-8 decoration-2">
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>
      
      {/* Decorative backdrop */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
};

export default Register;
