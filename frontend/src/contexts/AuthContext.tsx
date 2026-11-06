import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole, VALID_USER_ROLES } from '../types';
import { mockUsers } from '../data/mockData';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';

interface AuthContextType {
  currentUser: User;
  authenticated: boolean;
  loading: boolean;
  switchUser: (role: UserRole) => Promise<void> | void;
  loginWithEmail: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const guest: User = { id: '', email: '', fullName: '', department: '', role: 'BTC' };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(guest);
  const [loading, setLoading] = useState(true);

  const acceptUser = (user: User) => {
    if (!VALID_USER_ROLES.includes(user.role) || user.isActive === false) {
      throw new Error('Tài khoản chưa được phân quyền');
    }
    setCurrentUser({ ...user, department: user.department || '' });
  };

  useEffect(() => {
    let active = true;
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then((result) => {
        if (active) acceptUser(result.data);
      })
      .catch((err: any) => {
        if (!active) return;
        // Chỉ xóa token khi server trả về 401 (token hết hạn/sai)
        // Không xóa khi lỗi mạng hoặc timeout
        const isAuthError =
          err?.message?.includes('Token hết hạn') ||
          err?.message?.includes('token không hợp lệ') ||
          err?.message?.includes('Chưa đăng nhập') ||
          err?.message?.includes('401');
        if (isAuthError) removeAuthToken();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = () => {
    removeAuthToken();
    setCurrentUser(guest);
  };

  const loginWithEmail = async (email: string, password: string, remember = true) => {
    const { data } = await api.login(email.trim(), password);
    acceptUser(data.user);
    setAuthToken(data.token, remember);
  };

  // Chuyển đổi vai trò kiểm thử: Thực hiện xác thực thật với tài khoản của vai trò đó,
  // nhận Token mới từ Backend và cập nhật quyền hạn thực tế cho toàn bộ ứng dụng.
  const switchUser = async (role: UserRole) => {
    if (import.meta.env.PROD) throw new Error('Chuyển vai trò thử nghiệm không khả dụng trên Production');
    const target = mockUsers.find((u) => u.role === role);
    if (!target) return;
    try {
      const { data } = await api.login(target.email, '123456');
      setAuthToken(data.token, true);
      acceptUser(data.user);

      // Cập nhật lịch sử tài khoản
      try {
        const raw = localStorage.getItem('eventflow_accounts_history') || '[]';
        const list = JSON.parse(raw);
        const now = new Date().toISOString();
        const idx = list.findIndex((x: any) => x.email.toLowerCase() === target.email.toLowerCase());
        if (idx >= 0) list[idx].lastLogin = now;
        else list.push({ email: target.email, lastLogin: now });
        list.sort((a: any, b: any) => b.lastLogin.localeCompare(a.lastLogin));
        localStorage.setItem('eventflow_accounts_history', JSON.stringify(list));
      } catch {}

      // Tải lại trang chủ để toàn bộ Contexts, RBAC và dữ liệu tải lại theo token mới
      window.location.href = '/';
    } catch (err: any) {
      console.error('Lỗi khi chuyển vai trò kiểm thử:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authenticated: Boolean(currentUser.id),
        loading,
        switchUser,
        loginWithEmail,
        logout,
        allUsers: import.meta.env.DEV ? mockUsers : [],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
