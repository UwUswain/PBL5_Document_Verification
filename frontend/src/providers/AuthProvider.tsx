'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { docService } from '@/services/api';
import { message } from 'antd';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('pbl5_token');
      const isPublicPath = pathname === '/login';

      if (!token) {
        if (!isPublicPath) router.push('/login');
        setLoading(false);
        return;
      }

      try {
        // Giả sử có endpoint getProfile, nếu chưa có tôi sẽ tạm thời mock từ localStorage
        // hoặc dùng dữ liệu từ token. Hiện tại tôi sẽ lấy từ API nếu có.
        const res = await docService.getProfile(); 
        setUser(res.data);
        if (isPublicPath) router.push('/dashboard');
      } catch (err) {
        console.error('Auth Init Error:', err);
        localStorage.removeItem('pbl5_token');
        if (!isPublicPath) router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await docService.login(email, pass);
      localStorage.setItem('pbl5_token', res.data.access_token);
      // Lấy profile ngay sau khi login
      const profileRes = await docService.getProfile();
      setUser(profileRes.data);
      message.success('Chào mừng bạn quay trở lại!');
      router.push('/dashboard');
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('pbl5_token');
    setUser(null);
    router.push('/login');
    message.info('Đã đăng xuất khỏi hệ thống');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
