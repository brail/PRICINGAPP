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

import axios, { AxiosError } from "axios";
import {
  CalculationParams,
  SellingPriceCalculation,
  PurchasePriceCalculation,
  ExchangeRates,
} from "../types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createBusinessError } from "../hooks/useBusinessErrorHandler";

// ===========================================
// CONFIGURAZIONE API
// ===========================================

// Configurazione dinamica dell'URL dell'API
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Configurazione retry
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry su errori di rete o 5xx
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  },
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Funzione per retry automatico
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    const axiosError = error as AxiosError;

    if (retries > 0 && RETRY_CONFIG.retryCondition(axiosError)) {
      console.warn(
        `Retry attempt ${RETRY_CONFIG.maxRetries - retries + 1}/${
          RETRY_CONFIG.maxRetries
        }`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_CONFIG.retryDelay)
      );
      return retryRequest(requestFn, retries - 1);
    }

    throw error;
  }
};

// Funzione per gestione errori API
const handleApiError = (error: AxiosError): Error => {
  if (error.response) {
    // Errore del server
    const status = error.response.status;
    const message = (error.response.data as any)?.message || error.message;

    switch (status) {
      case 400:
        return new Error(`Richiesta non valida: ${message}`);
      case 401:
        return new Error("Non autorizzato. Effettua il login.");
      case 403:
        return new Error("Accesso negato.");
      case 404:
        return new Error("Risorsa non trovata.");
      case 500:
        return new Error("Errore del server. Riprova più tardi.");
      default:
        return new Error(`Errore del server (${status}): ${message}`);
    }
  } else if (error.request) {
    // Errore di rete
    return new Error(
      "Errore di connessione. Verifica la tua connessione internet."
    );
  } else {
    // Altro errore
    return new Error(`Errore imprevisto: ${error.message}`);
  }
};

// Funzione helper per convertire errori API in BusinessError
export const createApiBusinessError = (error: AxiosError) => {
  if (error.response) {
    const status = error.response.status;
    const message = (error.response.data as any)?.message || error.message;

    switch (status) {
      case 400:
        return createBusinessError.validation(
          `Richiesta non valida: ${message}`,
          "api",
          ["Verifica i dati inseriti", "Controlla i formati richiesti"]
        );
      case 401:
        return createBusinessError.business(
          "Non autorizzato. Effettua il login.",
          "Sessione scaduta"
        );
      case 403:
        return createBusinessError.business(
          "Accesso negato.",
          "Permessi insufficienti"
        );
      case 404:
        return createBusinessError.system("Risorsa non trovata.", "Errore 404");
      case 500:
        return createBusinessError.system(
          "Errore del server. Riprova più tardi.",
          "Errore server interno"
        );
      default:
        return createBusinessError.system(
          `Errore del server (${status}): ${message}`,
          "Errore server"
        );
    }
  } else if (error.request) {
    return createBusinessError.network(
      "Errore di connessione. Verifica la tua connessione internet.",
      () => window.location.reload()
    );
  } else {
    return createBusinessError.system(
      `Errore imprevisto: ${error.message}`,
      "Errore imprevisto"
    );
  }
};

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

    // Gestione timeout e errori di rete
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || !error.response) {
      // Se è la richiesta iniziale di verifica token, non fare retry
      if (originalRequest.url?.includes('/auth/me') && !originalRequest._retry) {
        console.warn("Timeout durante verifica token. Logout automatico...");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        return Promise.reject(handleApiError(error));
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          // Timeout esplicito per il refresh
          const response = await api.post("/auth/refresh", {
            refreshToken,
          }, {
            timeout: 8000,
          });

          const newToken = response.data.accessToken;
          localStorage.setItem("token", newToken);

          // Riprova la richiesta originale
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        // Refresh fallito o timeout, logout
        console.warn("Refresh token fallito. Logout automatico...");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        // Evita redirect infiniti se siamo già sulla pagina di login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
      }
    }

    console.error("API Error:", error);
    const handledError = handleApiError(error);
    return Promise.reject(handledError);
  }
);

export const pricingApi = {
  // Metodi HTTP generici per autenticazione
  get: async (url: string, config?: any) => {
    return await api.get(url, config);
  },

  post: async (url: string, data?: any, config?: any) => {
    return await api.post(url, data, config);
  },

  put: async (url: string, data?: any, config?: any) => {
    return await api.put(url, data, config);
  },

  delete: async (url: string, config?: any) => {
    return await api.delete(url, config);
  },

  // Ottieni parametri attuali
  getParams: async (): Promise<CalculationParams> => {
    const response = await api.get("/params");
    return response.data;
  },

  // Aggiorna parametri
  updateParams: async (
    params: Partial<CalculationParams>
  ): Promise<CalculationParams> => {
    const response = await api.put("/params", params);
    return response.data;
  },

  // Calcola prezzo di vendita
  calculateSellingPrice: async (
    purchasePrice: number,
    currency: string
  ): Promise<SellingPriceCalculation> => {
    return retryRequest(async () => {
      const response = await api.post("/calculate-selling", {
        purchasePrice,
        currency,
      });
      return response.data;
    });
  },

  // Calcola prezzo di acquisto
  calculatePurchasePrice: async (
    retailPrice: number,
    currency: string
  ): Promise<PurchasePriceCalculation> => {
    return retryRequest(async () => {
      const response = await api.post("/calculate-purchase", {
        retailPrice,
        currency,
      });
      return response.data;
    });
  },

  // Calcola margine da due prezzi (acquisto e vendita)
  calculateMargin: async (
    purchasePrice: number,
    retailPrice: number
  ): Promise<{
    purchasePrice: number;
    retailPrice: number;
    landedCost: number;
    wholesalePrice: number;
    companyMargin: number;
    purchaseCurrency: string;
    sellingCurrency: string;
    params: CalculationParams;
  }> => {
    const response = await api.post("/calculate-margin", {
      purchasePrice,
      retailPrice,
    });
    return response.data;
  },

  // ===== NUOVE API PER GESTIONE CENTRALIZZATA PARAMETRI =====

  // Ottieni parametri attivi per l'utente corrente
  getActiveParameters: async (): Promise<{
    params: CalculationParams;
    setId: number;
    description: string;
    source: "saved" | "default" | "first_available";
  }> => {
    const response = await api.get("/active-parameters");
    return response.data;
  },

  // Carica un set di parametri come attivo per l'utente
  loadActiveParameterSet: async (
    setId: number
  ): Promise<{
    message: string;
    params: CalculationParams;
    setId: number;
    description: string;
  }> => {
    const response = await api.post(`/active-parameters/load/${setId}`);
    return response.data;
  },

  // Ottieni tassi di cambio
  getExchangeRates: async (): Promise<ExchangeRates> => {
    const response = await api.get("/exchange-rates");
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get("/health");
    return response.data;
  },

  // API per i set di parametri
  // Ottieni tutti i set di parametri
  getParameterSets: async (): Promise<any[]> => {
    const response = await api.get("/parameter-sets");
    return response.data;
  },

  // Ottieni un set di parametri per ID
  getParameterSetById: async (id: number): Promise<any> => {
    const response = await api.get(`/parameter-sets/${id}`);
    return response.data;
  },

  // Carica un set di parametri come attuale
  loadParameterSet: async (
    id: number
  ): Promise<{ message: string; params: CalculationParams }> => {
    const response = await api.post(`/parameter-sets/${id}/load`);
    return response.data;
  },

  // Crea un nuovo set di parametri
  createParameterSet: async (params: any): Promise<any> => {
    const response = await api.post("/parameter-sets", params);
    return response.data;
  },

  // Aggiorna un set di parametri
  updateParameterSet: async (id: number, params: any): Promise<any> => {
    const response = await api.put(`/parameter-sets/${id}`, params);
    return response.data;
  },

  // Elimina un set di parametri
  deleteParameterSet: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/parameter-sets/${id}`);
    return response.data;
  },

  // Imposta un set di parametri come default
  setDefaultParameterSet: async (id: number): Promise<any> => {
    const response = await api.post(`/parameter-sets/${id}/set-default`);
    return response.data;
  },

  // Aggiorna l'ordine dei set di parametri
  updateParameterSetsOrder: async (
    parameterSets: any[]
  ): Promise<{ message: string }> => {
    const response = await api.put("/parameter-sets/order", {
      parameterSets,
    });
    return response.data;
  },

  // ===========================================
  // API DI AUTENTICAZIONE
  // ===========================================

  // Login utente
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/login", {
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
    const response = await api.post("/auth/register", {
      username,
      email,
      password,
      confirmPassword,
    });
    return response.data;
  },

  // Logout utente
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Ottieni informazioni utente corrente
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Aggiorna profilo utente
  updateProfile: async (userData: any) => {
    const response = await api.put("/auth/me", userData);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string) => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  // Ottieni tutti gli utenti (solo admin)
  getUsers: async () => {
    const response = await api.get("/auth/users");
    return response.data;
  },

  // Aggiorna utente (solo admin)
  updateUser: async (userId: number, userData: any) => {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  // Elimina utente (solo admin)
  deleteUser: async (userId: number) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  // Cambia password utente corrente
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const response = await api.put("/auth/me/password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Cambia password di un altro utente (solo admin)
  changeUserPassword: async (
    userId: number,
    newPassword: string,
    confirmPassword: string
  ) => {
    const response = await api.put(`/auth/users/${userId}/password`, {
      newPassword,
      confirmPassword,
    });
    return response.data;
  },
};

export default api;
