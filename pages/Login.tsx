
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { GraduationCap, Loader2 } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [matricNumber, setMatricNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!matricNumber || !password) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    try {
      const user = await dbService.login(matricNumber, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Check your matric number.');
      }
    } catch (err) {
      setError('Connection error. Please check your internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30">
      <div className="w-full animate-fade-in">
        <div className="mb-12">
          <div className="inline-flex p-5 bg-blue-600 text-white rounded-[24px] mb-6 shadow-xl shadow-blue-100">
            <GraduationCap size={40} strokeWidth={2.5} />
          </div>
          <h1 className="google-font text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
            ICH Student Hub
          </h1>
          <p className="text-gray-400 mt-4 text-xl md:text-2xl font-medium">
            Excellence in Chemistry, Digital by Design.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-sm border border-red-100 animate-shake">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Matric Number</label>
              <input
                type="text"
                placeholder="2025/PS/ICH/..."
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                className="w-full px-8 py-5 bg-white border border-gray-200 rounded-[28px] focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none font-medium text-lg shadow-sm"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-8 py-5 bg-white border border-gray-200 rounded-[28px] focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none font-medium text-lg shadow-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-64 py-5 bg-blue-600 text-white rounded-[28px] font-bold hover:bg-blue-700 transform transition-all active:scale-[0.98] shadow-2xl shadow-blue-200 flex items-center justify-center text-xl"
            >
              {isLoading ? <Loader2 className="animate-spin h-7 w-7" /> : 'Sign In Now'}
            </button>
            <p className="text-gray-500 font-medium">
              New here?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-8 decoration-2">
                Create Account
              </Link>
            </p>
          </div>
        </form>
      </div>
      
      {/* Expansive background decoration */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 w-[800px] h-[800px] bg-indigo-400/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
    </div>
  );
};

export default Login;
