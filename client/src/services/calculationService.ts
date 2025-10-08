/**
 * Calculation Service per Pricing Calculator v0.2
 * Servizio specializzato per i calcoli
 */

import { pricingApi } from "./api";
import {
  CalculationParams,
  SellingPriceCalculation,
  PurchasePriceCalculation,
} from "../types";

export class CalculationService {
  /**
   * Calcola prezzo di vendita da prezzo di acquisto
   */
  async calculateSelling(
    purchasePrice: number,
    params: CalculationParams
  ): Promise<SellingPriceCalculation> {
    try {
      if (purchasePrice <= 0) {
        throw new Error("Il prezzo di acquisto deve essere positivo");
      }

      const response = await pricingApi.calculateSellingPrice(
        purchasePrice,
        params.sellingCurrency
      );
      return response;
    } catch (error) {
      console.error("Errore nel calcolo prezzo di vendita:", error);
      throw new Error("Errore nel calcolo del prezzo di vendita");
    }
  }

  /**
   * Calcola prezzo di acquisto da prezzo di vendita
   */
  async calculatePurchase(
    retailPrice: number,
    params: CalculationParams
  ): Promise<PurchasePriceCalculation> {
    try {
      if (retailPrice <= 0) {
        throw new Error("Il prezzo di vendita deve essere positivo");
      }

      const response = await pricingApi.calculatePurchasePrice(
        retailPrice,
        params.sellingCurrency
      );
      return response;
    } catch (error) {
      console.error("Errore nel calcolo prezzo di acquisto:", error);
      throw new Error("Errore nel calcolo del prezzo di acquisto");
    }
  }

  /**
   * Calcola margine da prezzo di acquisto e prezzo di vendita
   */
  async calculateMargin(
    purchasePrice: number,
    retailPrice: number,
    params: CalculationParams
  ): Promise<any> {
    try {
      if (purchasePrice <= 0 || retailPrice <= 0) {
        throw new Error("I prezzi devono essere positivi");
      }

      if (purchasePrice >= retailPrice) {
        throw new Error(
          "Il prezzo di acquisto deve essere inferiore al prezzo di vendita"
        );
      }

      const response = await pricingApi.calculateMargin(
        purchasePrice,
        retailPrice
      );
      return response;
    } catch (error) {
      console.error("Errore nel calcolo margine:", error);
      throw new Error("Errore nel calcolo del margine");
    }
  }

  /**
   * Valida i parametri per i calcoli
   */
  validateCalculationParams(params: CalculationParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validazioni per i calcoli
    if (
      params.qualityControlPercent < 0 ||
      params.qualityControlPercent > 100
    ) {
      errors.push("Quality Control deve essere tra 0 e 100");
    }

    if (params.duty < 0 || params.duty > 100) {
      errors.push("Dazio deve essere tra 0 e 100");
    }

    if (params.optimalMargin < 0 || params.optimalMargin > 100) {
      errors.push("Margine ottimale deve essere tra 0 e 100");
    }

    if (params.transportInsuranceCost < 0) {
      errors.push("Costo trasporto e assicurazione deve essere positivo");
    }

    if (params.italyAccessoryCosts < 0) {
      errors.push("Costi accessori Italia devono essere positivi");
    }

    if (params.tools < 0) {
      errors.push("Strumenti devono essere positivi");
    }

    if (params.exchangeRate <= 0) {
      errors.push("Tasso di cambio deve essere positivo");
    }

    if (params.retailMultiplier < 1) {
      errors.push("Moltiplicatore retail deve essere almeno 1");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calcola il company multiplier dai parametri
   */
  calculateCompanyMultiplier(optimalMargin: number): number {
    if (optimalMargin <= 0) return 1;
    return 1 / (1 - optimalMargin / 100);
  }

  /**
   * Formatta un prezzo per la visualizzazione
   */
  formatPrice(price: number, currency: string = "EUR"): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  /**
   * Formatta una percentuale per la visualizzazione
   */
  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  /**
   * Calcola il margine di profitto
   */
  calculateProfitMargin(purchasePrice: number, sellingPrice: number): number {
    if (sellingPrice <= 0) return 0;
    return (sellingPrice - purchasePrice) / sellingPrice;
  }

  /**
   * Calcola il markup
   */
  calculateMarkup(purchasePrice: number, sellingPrice: number): number {
    if (purchasePrice <= 0) return 0;
    return (sellingPrice - purchasePrice) / purchasePrice;
  }

  /**
   * Arrotonda un prezzo secondo le regole di business
   */
  roundRetailPrice(price: number): number {
    if (isNaN(price) || !isFinite(price) || price <= 0) {
      return 0;
    }

    if (price < 10) {
      return 9.9;
    }

    const integerPart = Math.floor(price);
    const decimalPart = price - integerPart;
    const tens = Math.floor(integerPart / 10) * 10;

    const finalPart = (integerPart % 10) + decimalPart;

    if (finalPart >= 0.0 && finalPart <= 2.4) {
      return Math.max(9.9, tens - 10 + 9.9);
    } else if (finalPart >= 2.5 && finalPart <= 7.4) {
      return tens + 4.9;
    } else if (finalPart >= 7.5 && finalPart <= 9.9) {
      return tens + 9.9;
    } else {
      return tens + 4.9;
    }
  }

  /**
   * Arrotonda un prezzo di acquisto per difetto
   */
  roundPurchasePrice(price: number): number {
    if (isNaN(price) || !isFinite(price)) {
      return 0;
    }
    return Math.floor(price * 10) / 10;
  }

  /**
   * Valida un prezzo
   */
  validatePrice(price: number): { isValid: boolean; error?: string } {
    if (isNaN(price)) {
      return {
        isValid: false,
        error: "Il prezzo deve essere un numero valido",
      };
    }

    if (!isFinite(price)) {
      return {
        isValid: false,
        error: "Il prezzo deve essere un numero finito",
      };
    }

    if (price < 0) {
      return { isValid: false, error: "Il prezzo non può essere negativo" };
    }

    if (price === 0) {
      return {
        isValid: false,
        error: "Il prezzo deve essere maggiore di zero",
      };
    }

    return { isValid: true };
  }

  /**
   * Ottiene i tassi di cambio
   */
  async getExchangeRates(): Promise<any> {
    try {
      const response = await pricingApi.getExchangeRates();
      return response;
    } catch (error) {
      console.error("Errore nel recupero tassi di cambio:", error);
      throw new Error("Errore nel recupero dei tassi di cambio");
    }
  }

  /**
   * Calcola il costo totale di acquisto
   */
  calculateTotalPurchaseCost(
    purchasePrice: number,
    params: CalculationParams
  ): {
    qualityControlCost: number;
    priceWithQC: number;
    transportInsuranceCost: number;
    priceWithTransport: number;
    dutyCost: number;
    priceWithDuty: number;
    priceWithDutyInSellingCurrency: number;
    landedCost: number;
  } {
    const qualityControlCost =
      purchasePrice * (params.qualityControlPercent / 100);
    const priceWithQC = purchasePrice + qualityControlCost + params.tools;
    const priceWithTransport = priceWithQC + params.transportInsuranceCost;
    const dutyCost = priceWithTransport * (params.duty / 100);
    const priceWithDuty = priceWithTransport + dutyCost;
    const priceWithDutyInSellingCurrency = priceWithDuty / params.exchangeRate;
    const landedCost =
      priceWithDutyInSellingCurrency + params.italyAccessoryCosts;

    return {
      qualityControlCost,
      priceWithQC,
      transportInsuranceCost: params.transportInsuranceCost,
      priceWithTransport,
      dutyCost,
      priceWithDuty,
      priceWithDutyInSellingCurrency,
      landedCost,
    };
  }

  /**
   * Calcola il prezzo di vendita finale
   */
  calculateFinalSellingPrice(
    landedCost: number,
    params: CalculationParams
  ): {
    wholesalePrice: number;
    retailPrice: number;
    retailPriceRaw: number;
    companyMargin: number;
  } {
    const companyMultiplier = this.calculateCompanyMultiplier(
      params.optimalMargin
    );
    const wholesalePrice = landedCost * companyMultiplier;
    const retailPriceRaw = wholesalePrice * params.retailMultiplier;
    const retailPrice = this.roundRetailPrice(retailPriceRaw);
    const companyMargin = (wholesalePrice - landedCost) / wholesalePrice;

    return {
      wholesalePrice,
      retailPrice,
      retailPriceRaw,
      companyMargin,
    };
  }
}

// Istanza singleton del servizio
export const calculationService = new CalculationService();
