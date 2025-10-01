import axios from "axios";
import {
  CalculationParams,
  SellingPriceCalculation,
  PurchasePriceCalculation,
  ExchangeRates,
} from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor per gestire errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const pricingApi = {
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
    const response = await api.post("/calculate-selling", {
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
    const response = await api.post("/calculate-purchase", {
      retailPrice,
      currency,
    });
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
  updateParameterSetsOrder: async (parameterSets: any[]): Promise<{ message: string }> => {
    const response = await api.put("/parameter-sets/order", { parameterSets });
    return response.data;
  },
};

export default api;
