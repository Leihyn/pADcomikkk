import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface User {
  accountId: string;
  username: string;
  bio: string;
  avatar: string | null;
  role: string;
  balance?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: (accountId: string, publicKey?: string) => Promise<void>;
  disconnectWallet: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('comic_pad_token');
    const savedUser = localStorage.getItem('comic_pad_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      verifyToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  // Verify token validity
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${tokenToVerify}` }
        }
      );
      if (!response.data.success) {
        disconnectWallet();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      disconnectWallet();
    }
  };

  // Connect wallet
  const connectWallet = async (accountId: string, publicKey?: string) => {
    try {
      setIsLoading(true);

      const response = await axios.post(`${API_URL}/auth/connect`, {
        accountId,
        publicKey
      });

      if (response.data.success) {
        const { user: newUser, token: newToken } = response.data.data;
        
        setUser(newUser);
        setToken(newToken);
        
        // Save to localStorage
        localStorage.setItem('comic_pad_token', newToken);
        localStorage.setItem('comic_pad_user', JSON.stringify(newUser));
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('comic_pad_token');
    localStorage.removeItem('comic_pad_user');
  };

  // Update profile
  const updateProfile = async (data: Partial<User>) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        localStorage.setItem('comic_pad_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (!token) return;

    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedUser = response.data.data;
        setUser(updatedUser);
        localStorage.setItem('comic_pad_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    connectWallet,
    disconnectWallet,
    updateProfile,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}