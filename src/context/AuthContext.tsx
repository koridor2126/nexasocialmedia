import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types.js';
import { api, authStorage } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  register: (payload: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    confirm_password?: string;
    avatar_url?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const storedToken = authStorage.getToken();
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Auth token invalid or session expired:', err);
      authStorage.removeToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { identifier: string; password: string }) => {
    const res = await api.login(credentials);
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (payload: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    confirm_password?: string;
    avatar_url?: string;
    role?: string;
  }) => {
    const res = await api.register(payload);
    authStorage.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    authStorage.removeToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser
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
