import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, FlureErrorCode } from '../types';
import { api, ApiError } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  allDemoUsers: User[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, birth_date: string) => Promise<{ user_id: string; message: string }>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  toast: { message: string; type: 'success' | 'error' | 'info'; code?: FlureErrorCode } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info', code?: FlureErrorCode) => void;
  hideToast: () => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  unreadNotifsCount: number;
  fetchNotificationsCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>('feed');
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; code?: FlureErrorCode } | null>(null);

  // Pre-configured demo users for quick switching
  const [allDemoUsers] = useState<User[]>([
    {
      id: 'user_rizky',
      email: 'rizky@flure.app',
      birth_date: '1998-05-14',
      gender: 'male',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      account_status: 'active',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user_nadia',
      email: 'nadia@flure.app',
      birth_date: '2000-11-22',
      gender: 'female',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      account_status: 'active',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user_alex',
      email: 'alex@flure.app',
      birth_date: '1995-03-10',
      gender: 'non_binary',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      account_status: 'active',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user_admin',
      email: 'admin@flure.app',
      birth_date: '1992-08-01',
      gender: 'prefer_not_to_say',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      account_status: 'active',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', code?: FlureErrorCode) => {
    setToast({ message, type, code });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Default initial login as Rizky
  useEffect(() => {
    setCurrentUser(allDemoUsers[0]);
  }, []);

  const fetchNotificationsCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await api.getNotifications(currentUser.id);
      const unread = (res.notifications || []).filter((n) => !n.is_read).length;
      setUnreadNotifsCount(unread);
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchNotificationsCount();
    }
  }, [currentUser, fetchNotificationsCount]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      setCurrentUser(res.user);
      setActiveScreen('feed');
      showToast(`Selamat datang kembali, ${res.user.email}!`, 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Login gagal.', 'error');
      }
      throw err;
    }
  };

  const register = async (email: string, password: string, birth_date: string) => {
    try {
      const res = await api.register({ email, password, birth_date });
      showToast('Registrasi berhasil! Silakan lengkapi profil Anda.', 'success');
      return res;
    } catch (err: any) {
      if (err instanceof ApiError) {
        showToast(err.message, 'error', err.code);
      } else {
        showToast('Registrasi gagal.', 'error');
      }
      throw err;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveScreen('login');
    showToast('Sesi Anda telah diakhiri.', 'info');
  };

  const switchUser = async (userId: string) => {
    const found = allDemoUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      showToast(`Beralih akun ke ${found.email} (${found.role.toUpperCase()})`, 'info');
      fetchNotificationsCount();
    } else {
      try {
        const res = await api.getUserProfile(currentUser?.id || 'user_rizky', userId);
        setCurrentUser(res.user);
        showToast(`Beralih akun ke ${res.user.email}`, 'info');
      } catch (err) {
        showToast('Gagal beralih akun.', 'error');
      }
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getUserProfile(currentUser.id, currentUser.id);
      setCurrentUser(res.user);
    } catch (err) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        allDemoUsers,
        login,
        register,
        logout,
        switchUser,
        refreshProfile,
        toast,
        showToast,
        hideToast,
        activeScreen,
        setActiveScreen,
        unreadNotifsCount,
        fetchNotificationsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
