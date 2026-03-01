import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole, LoginCredentials, RegisterData } from '@/types';
import { mockDataStore } from '@/lib/db/mockData';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isCoordinator: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('unischedule_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          createdAt: new Date(parsedUser.createdAt),
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('unischedule_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check for default coordinator account
      if (credentials.email === 'admin@gmail.com' && credentials.password === '123456') {
        const adminUser = await mockDataStore.getUserByEmail('admin@gmail.com');
        if (adminUser) {
          setUser(adminUser);
          localStorage.setItem('unischedule_user', JSON.stringify(adminUser));
          return { success: true };
        }
      }

      // Check for other users
      const existingUser = await mockDataStore.getUserByEmail(credentials.email);
      if (existingUser) {
        // In a real app, we'd verify the password hash here
        setUser(existingUser);
        localStorage.setItem('unischedule_user', JSON.stringify(existingUser));
        return { success: true };
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if email already exists
      const existingUser = await mockDataStore.getUserByEmail(data.email);
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }

      // Create new student user
      const newUser = await mockDataStore.createUser({
        email: data.email,
        name: data.name,
        role: 'student' as UserRole,
        department: data.department,
        level: data.level,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuidv4()}`,
      });

      setUser(newUser);
      localStorage.setItem('unischedule_user', JSON.stringify(newUser));
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('unischedule_user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    isCoordinator: user?.role === 'coordinator',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
