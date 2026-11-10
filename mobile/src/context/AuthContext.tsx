import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { STORAGE_KEYS } from '../config';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.setToken(storedToken);
      }
    } catch (e) {
      console.error('Error cargando sesión:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { user: loggedUser, token: authToken } = res.data;
      setUser(loggedUser);
      setToken(authToken);
      api.setToken(authToken);

      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedUser));
    } else {
      throw new Error(res.message || 'Error al iniciar sesión');
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string; role?: string }) => {
    const res: any = await api.post('/auth/register', data);
    if (res.success && res.data) {
      const { user: registeredUser, token: authToken } = res.data;
      setUser(registeredUser);
      setToken(authToken);
      api.setToken(authToken);

      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(registeredUser));
    } else {
      throw new Error(res.message || 'Error en el registro');
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    api.setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  };

  const updateProfile = async (data: Partial<User>) => {
    const res: any = await api.put('/auth/me', data);
    if (res.success && res.data) {
      const updated = { ...user, ...res.data };
      setUser(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    } else {
      throw new Error(res.message || 'Error actualizando perfil');
    }
  };

  const refreshProfile = async () => {
    try {
      const res: any = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Error refrescando perfil:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

