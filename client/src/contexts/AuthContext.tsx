/**
 * Pricing Calculator v0.2 - Authentication Context
 * Gestione stato autenticazione globale
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pricingApi } from '../services/api';

// Tipi per l'autenticazione
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  created_at?: string;
  last_login?: string;
  preferences?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Carica lo stato di autenticazione dal localStorage all'avvio
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          
          // Verifica se il token è ancora valido
          try {
            const response = await pricingApi.get('/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });

            setAuthState({
              user: response.data.user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } catch (error) {
            // Token non valido, prova con refresh token
            if (refreshToken) {
              try {
                const refreshResponse = await pricingApi.post('/auth/refresh', {
                  refreshToken
                });

                const newToken = refreshResponse.data.token;
                localStorage.setItem('token', newToken);

                setAuthState({
                  user: JSON.parse(userStr),
                  token: newToken,
                  refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                });
              } catch (refreshError) {
                // Refresh fallito, logout
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                setAuthState(prev => ({ ...prev, isLoading: false }));
              }
            } else {
              // Nessun refresh token, logout
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setAuthState(prev => ({ ...prev, isLoading: false }));
            }
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Errore nel caricamento stato autenticazione:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  // Funzione di login
  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await pricingApi.post('/auth/login', {
        username,
        password
      });

      const { user, token, refreshToken } = response.data;

      // Salva nel localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Errore durante il login';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw new Error(errorMessage);
    }
  };

  // Funzione di registrazione
  const register = async (username: string, email: string, password: string, confirmPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await pricingApi.post('/auth/register', {
        username,
        email,
        password,
        confirmPassword
      });

      const { user, token, refreshToken } = response.data;

      // Salva nel localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Errore durante la registrazione';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw new Error(errorMessage);
    }
  };

  // Funzione di logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };

  // Funzione per refresh dell'autenticazione
  const refreshAuth = async () => {
    try {
      const refreshToken = authState.refreshToken;
      if (!refreshToken) {
        throw new Error('Nessun refresh token disponibile');
      }

      const response = await pricingApi.post('/auth/refresh', {
        refreshToken
      });

      const { token } = response.data;
      localStorage.setItem('token', token);

      setAuthState(prev => ({
        ...prev,
        token
      }));
    } catch (error) {
      console.error('Errore nel refresh dell\'autenticazione:', error);
      logout();
    }
  };

  // Funzione per aggiornare i dati utente
  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await pricingApi.put('/auth/me', userData);
      
      const updatedUser = { ...authState.user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Errore nell\'aggiornamento del profilo';
      setAuthState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw new Error(errorMessage);
    }
  };

  // Funzione per pulire gli errori
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook per usare il context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};

export default AuthContext;
