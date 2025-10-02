/**
 * ===========================================
 * PRICING CALCULATOR v0.2 - API Service
 * ===========================================
 *
 * Servizio per le chiamate API al backend
 * Gestisce configurazione dinamica degli endpoint e autenticazione
 *
 * @version 0.2.0-dev
 * @author Pricing Calculator Team
 * @since 2024
 */

import axios from "axios";
import {
  CalculationParams,
  SellingPriceCalculation,
  PurchasePriceCalculation,
  ExchangeRates,
} from "../types";

// ===========================================
// CONFIGURAZIONE API
// ===========================================

// Configurazione dinamica dell'URL dell'API
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Configurazione API caricata

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor per aggiungere token di autenticazione
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire errori e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await api.post("/api/auth/refresh", {
            refreshToken,
          });

          const newToken = response.data.token;
          localStorage.setItem("token", newToken);

          // Riprova la richiesta originale
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh fallito, logout
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const pricingApi = {
  // Ottieni parametri attuali
  getParams: async (): Promise<CalculationParams> => {
    const response = await api.get("/api/params");
    return response.data;
  },

  // Aggiorna parametri
  updateParams: async (
    params: Partial<CalculationParams>
  ): Promise<CalculationParams> => {
    const response = await api.put("/api/params", params);
    return response.data;
  },

  // Calcola prezzo di vendita
  calculateSellingPrice: async (
    purchasePrice: number,
    currency: string
  ): Promise<SellingPriceCalculation> => {
    const response = await api.post("/api/calculate-selling", {
      purchasePrice,
      currency,
    });
    return response.data;
  },

  // Calcola prezzo di acquisto
  calculatePurchasePrice: async (
    retailPrice: number,
    currency: string
  ): Promise<PurchasePriceCalculation> => {
    const response = await api.post("/api/calculate-purchase", {
      retailPrice,
      currency,
    });
    return response.data;
  },

  // Ottieni tassi di cambio
  getExchangeRates: async (): Promise<ExchangeRates> => {
    const response = await api.get("/api/exchange-rates");
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get("/api/health");
    return response.data;
  },

  // API per i set di parametri
  // Ottieni tutti i set di parametri
  getParameterSets: async (): Promise<any[]> => {
    const response = await api.get("/api/parameter-sets");
    return response.data;
  },

  // Ottieni un set di parametri per ID
  getParameterSetById: async (id: number): Promise<any> => {
    const response = await api.get(`/api/parameter-sets/${id}`);
    return response.data;
  },

  // Carica un set di parametri come attuale
  loadParameterSet: async (
    id: number
  ): Promise<{ message: string; params: CalculationParams }> => {
    const response = await api.post(`/api/parameter-sets/${id}/load`);
    return response.data;
  },

  // Crea un nuovo set di parametri
  createParameterSet: async (params: any): Promise<any> => {
    const response = await api.post("/api/parameter-sets", params);
    return response.data;
  },

  // Aggiorna un set di parametri
  updateParameterSet: async (id: number, params: any): Promise<any> => {
    const response = await api.put(`/api/parameter-sets/${id}`, params);
    return response.data;
  },

  // Elimina un set di parametri
  deleteParameterSet: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/parameter-sets/${id}`);
    return response.data;
  },

  // Imposta un set di parametri come default
  setDefaultParameterSet: async (id: number): Promise<any> => {
    const response = await api.post(`/api/parameter-sets/${id}/set-default`);
    return response.data;
  },

  // Aggiorna l'ordine dei set di parametri
  updateParameterSetsOrder: async (
    parameterSets: any[]
  ): Promise<{ message: string }> => {
    const response = await api.put("/api/parameter-sets/order", {
      parameterSets,
    });
    return response.data;
  },

  // ===========================================
  // API DI AUTENTICAZIONE
  // ===========================================

  // Login utente
  login: async (username: string, password: string) => {
    const response = await api.post("/api/auth/login", {
      username,
      password,
    });
    return response.data;
  },

  // Registrazione utente
  register: async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
      confirmPassword,
    });
    return response.data;
  },

  // Logout utente
  logout: async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },

  // Ottieni informazioni utente corrente
  getCurrentUser: async () => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  // Aggiorna profilo utente
  updateProfile: async (userData: any) => {
    const response = await api.put("/api/auth/me", userData);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const response = await api.post("/api/auth/refresh", { refreshToken });
    return response.data;
  },

  // Ottieni tutti gli utenti (solo admin)
  getUsers: async () => {
    const response = await api.get("/api/auth/users");
    return response.data;
  },

  // Aggiorna utente (solo admin)
  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(`/api/auth/users/${userId}`, userData);
    return response.data;
  },

  // Elimina utente permanentemente (solo admin)
  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/auth/users/${userId}`);
    return response.data;
  },

  // Disattiva/attiva utente (solo admin)
  toggleUserStatus: async (userId: number) => {
    const response = await api.patch(`/api/auth/users/${userId}/toggle-status`);
    return response.data;
  },

  // Cambia password per l'utente corrente
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const response = await api.patch("/api/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Cambia password per un utente specifico (solo admin)
  changeUserPassword: async (
    userId: number,
    newPassword: string,
    confirmPassword: string
  ) => {
    const response = await api.patch(
      `/api/auth/users/${userId}/change-password`,
      {
        newPassword,
        confirmPassword,
      }
    );
    return response.data;
  },

  // Metodo generico per chiamate API
  get: async (url: string, config?: any) => {
    return api.get(url, config);
  },

  post: async (url: string, data?: any, config?: any) => {
    return api.post(url, data, config);
  },

  put: async (url: string, data?: any, config?: any) => {
    return api.put(url, data, config);
  },

  delete: async (url: string, config?: any) => {
    return api.delete(url, config);
  },
};

export default api;
