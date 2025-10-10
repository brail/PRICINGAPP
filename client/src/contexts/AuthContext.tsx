/**
 * Pricing Calculator v0.2 - Authentication Context
 * Gestione stato autenticazione globale
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { pricingApi } from "../services/api";

// Tipi per l'autenticazione
export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user" | "demo";
  created_at?: string;
  last_login?: string;
  preferences?: Record<string, any>;
  auth_provider?: "local" | "ldap" | "google";
  provider_user_id?: string;
  provider_metadata?: Record<string, any>;
}

export interface AuthProvider {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
  requiresPassword: boolean;
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
  loginWithLDAP: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  handleOAuthCallback: (tokens: string) => void;
  register: (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  getAvailableProviders: () => Promise<AuthProvider[]>;
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
    error: null,
  });

  const [availableProviders, setAvailableProviders] = useState<AuthProvider[]>(
    []
  );

  // Carica lo stato di autenticazione dal localStorage all'avvio
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
          // Verifica se il token è ancora valido
          try {
            const response = await pricingApi.get("/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });

            setAuthState({
              user: response.data.user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            // Token non valido, prova con refresh token
            if (refreshToken) {
              try {
                const refreshResponse = await pricingApi.post("/auth/refresh", {
                  refreshToken,
                });

                const newToken = refreshResponse.data.accessToken;
                localStorage.setItem("token", newToken);

                setAuthState({
                  user: JSON.parse(userStr),
                  token: newToken,
                  refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                });
              } catch (refreshError) {
                // Refresh fallito, logout
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                setAuthState((prev) => ({ ...prev, isLoading: false }));
              }
            } else {
              // Nessun refresh token, logout
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setAuthState((prev) => ({ ...prev, isLoading: false }));
            }
          }
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Errore nel caricamento stato autenticazione:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  // Funzione di login locale (admin)
  const login = async (username: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await pricingApi.post("/auth/login", {
        username,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Salva nel localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Errore durante il login";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Funzione di login LDAP
  const loginWithLDAP = async (username: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await pricingApi.post("/auth/ldap", {
        username,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Salva nel localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Errore durante il login LDAP";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Funzione di login Google (redirect)
  const loginWithGoogle = () => {
    window.location.href = `${
      process.env.REACT_APP_API_URL || "http://localhost:5001"
    }/auth/google`;
  };

  // Gestione callback OAuth
  const handleOAuthCallback = (tokens: string) => {
    try {
      const tokenData = JSON.parse(decodeURIComponent(tokens));
      const { user, accessToken, refreshToken } = tokenData;

      // Salva nel localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        token: accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Errore nel parsing dei token OAuth:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Errore durante l'autenticazione OAuth",
      }));
    }
  };

  // Funzione di registrazione
  const register = async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await pricingApi.post("/auth/register", {
        username,
        email,
        password,
        confirmPassword,
      });

      const { user, token, refreshToken } = response.data;

      // Salva nel localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Errore durante la registrazione";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Funzione di logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  // Funzione per refresh dell'autenticazione
  const refreshAuth = async () => {
    try {
      const refreshToken = authState.refreshToken;
      if (!refreshToken) {
        throw new Error("Nessun refresh token disponibile");
      }

      const response = await pricingApi.post("/auth/refresh", {
        refreshToken,
      });

      const { accessToken } = response.data;
      localStorage.setItem("token", accessToken);

      setAuthState((prev) => ({
        ...prev,
        token: accessToken,
      }));
    } catch (error) {
      console.error("Errore nel refresh dell'autenticazione:", error);
      logout();
    }
  };

  // Funzione per aggiornare i dati utente
  const updateUser = async (userData: Partial<User>) => {
    try {
      await pricingApi.put("/auth/me", userData);

      const updatedUser = { ...authState.user, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser as User,
      }));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Errore nell'aggiornamento del profilo";
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Funzione per pulire gli errori
  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  // Funzione per ottenere provider disponibili
  const getAvailableProviders = async (): Promise<AuthProvider[]> => {
    try {
      const response = await pricingApi.get("/auth/providers");
      const providers = response.data.providers;
      // Non modifichiamo lo stato globale qui per evitare loop infiniti
      return providers;
    } catch (error) {
      console.error("Errore nel caricamento dei provider:", error);
      return [];
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    loginWithLDAP,
    loginWithGoogle,
    handleOAuthCallback,
    register,
    logout,
    refreshAuth,
    updateUser,
    clearError,
    getAvailableProviders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook per usare il context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve essere usato all'interno di un AuthProvider");
  }
  return context;
};

export default AuthContext;
