'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { docService } from '@/services/api';
import { App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

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
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  // 1. Hydration Effect: Chạy đúng 1 lần khi ứng dụng khởi động
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('pbl5_token');
      if (!token) {
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        const res = await docService.getProfile();
        setUser(res.data);
      } catch (err) {
        // Token hết hạn hoặc lỗi mạng
        localStorage.removeItem('pbl5_token');
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchUser();
  }, []);

  // 2. Route Protection Effect: Lắng nghe pathname và user state để điều hướng
  useEffect(() => {
    if (!initialized) return;

    const token = localStorage.getItem('pbl5_token');
    const isPublicPath = pathname === '/login' || pathname === '/' || pathname === '/register';

    if (!token) {
      if (!isPublicPath) {
        router.push('/login');
      }
    } else {
      // Có token
      if (user && isPublicPath) {
        router.push('/dashboard');
      }
      // Nếu có token mà chưa có user (đang fetchUser), ta không làm gì, chỉ việc chờ.
    }
  }, [pathname, user, initialized, router]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await docService.login(email, pass);
      // Lưu token lại ngay
      localStorage.setItem('pbl5_token', res.access_token);
      
      // Fetch profile mới nhất
      const profileRes = await docService.getProfile();
      setUser(profileRes.data);
      
      message.success('Chào mừng bạn quay trở lại!');
      // XÓA BỎ router.push('/dashboard') Ở ĐÂY ĐỂ TRÁNH DOUBLE NAVIGATE
    } catch (err) {
      throw err; // Ném lỗi ra để LoginPage catch và show message
    }
  };

  const logout = () => {
    localStorage.removeItem('pbl5_token');
    setUser(null);
    queryClient.clear();
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
