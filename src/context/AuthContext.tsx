import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/api';
import { AuthService } from '../services/PetHealthService';
import { TokenStorage } from '../services/TokenStorage';
import { setOnAuthFailure } from '../services/apiClient';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await AuthService.getProfile();
      setUser(profile);
    } catch (err) {
      console.warn('Session invalid or expired:', err);
      await logout();
    }
  };

  useEffect(() => {
    // Interceptor hook for 401 unrecoverable refresh failure
    setOnAuthFailure(() => {
      setUser(null);
    });

    const initAuth = async () => {
      try {
        const tokens = await TokenStorage.getTokens();
        if (tokens?.access) {
          await refreshProfile();
        }
      } catch (e) {
        console.error('Failed to load initial auth state', e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshProfile,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
