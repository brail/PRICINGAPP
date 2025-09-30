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
};

export default api;
