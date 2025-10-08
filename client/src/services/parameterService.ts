/**
 * Parameter Service per Pricing Calculator v0.2
 * Servizio specializzato per la gestione dei parametri
 */

import { pricingApi } from "./api";
import { CalculationParams } from "../types";
import { ParameterSet } from "../contexts/ParameterContext";

export class ParameterService {
  /**
   * Ottiene i parametri attuali dal server
   */
  async getCurrentParams(): Promise<CalculationParams> {
    try {
      const response = await pricingApi.getParams();
      return response;
    } catch (error) {
      console.error("Errore nel recupero parametri attuali:", error);
      throw new Error("Errore nel recupero dei parametri attuali");
    }
  }

  /**
   * Aggiorna i parametri attuali sul server
   */
  async updateCurrentParams(
    params: Partial<CalculationParams>
  ): Promise<CalculationParams> {
    try {
      const response = await pricingApi.updateParams(params);
      return response;
    } catch (error) {
      console.error("Errore nell'aggiornamento parametri:", error);
      throw new Error("Errore nell'aggiornamento dei parametri");
    }
  }

  /**
   * Ottiene tutti i set di parametri
   */
  async getParameterSets(): Promise<ParameterSet[]> {
    try {
      const response = await pricingApi.getParameterSets();
      return response;
    } catch (error) {
      console.error("Errore nel recupero set di parametri:", error);
      throw new Error("Errore nel recupero dei set di parametri");
    }
  }

  /**
   * Ottiene un set di parametri per ID
   */
  async getParameterSetById(id: number): Promise<ParameterSet> {
    try {
      const response = await pricingApi.getParameterSetById(id);
      return response;
    } catch (error) {
      console.error("Errore nel recupero set di parametri:", error);
      throw new Error("Errore nel recupero del set di parametri");
    }
  }

  /**
   * Carica un set di parametri come attivo
   */
  async loadParameterSet(setId: number): Promise<{
    params: CalculationParams;
    setId: number;
    description: string;
  }> {
    try {
      const response = await pricingApi.loadParameterSet(setId);
      return {
        params: response.params,
        setId: setId,
        description: `Set ${setId}`, // Non abbiamo la descrizione dall'API
      };
    } catch (error) {
      console.error("Errore nel caricamento set di parametri:", error);
      throw new Error("Errore nel caricamento del set di parametri");
    }
  }

  /**
   * Crea un nuovo set di parametri
   */
  async createParameterSet(
    set: Omit<ParameterSet, "id" | "created_at" | "updated_at">
  ): Promise<ParameterSet> {
    try {
      const response = await pricingApi.createParameterSet(set);
      return response;
    } catch (error) {
      console.error("Errore nella creazione set di parametri:", error);
      throw new Error("Errore nella creazione del set di parametri");
    }
  }

  /**
   * Aggiorna un set di parametri
   */
  async updateParameterSet(
    id: number,
    set: Partial<ParameterSet>
  ): Promise<ParameterSet> {
    try {
      const response = await pricingApi.updateParameterSet(id, set);
      return response;
    } catch (error) {
      console.error("Errore nell'aggiornamento set di parametri:", error);
      throw new Error("Errore nell'aggiornamento del set di parametri");
    }
  }

  /**
   * Elimina un set di parametri
   */
  async deleteParameterSet(id: number): Promise<void> {
    try {
      await pricingApi.deleteParameterSet(id);
    } catch (error) {
      console.error("Errore nell'eliminazione set di parametri:", error);
      throw new Error("Errore nell'eliminazione del set di parametri");
    }
  }

  /**
   * Imposta un set di parametri come default
   */
  async setDefaultParameterSet(id: number): Promise<void> {
    try {
      await pricingApi.setDefaultParameterSet(id);
    } catch (error) {
      console.error("Errore nell'impostazione set di default:", error);
      throw new Error("Errore nell'impostazione del set di default");
    }
  }

  /**
   * Aggiorna l'ordine dei set di parametri
   */
  async updateParameterSetsOrder(sets: ParameterSet[]): Promise<void> {
    try {
      await pricingApi.updateParameterSetsOrder(sets);
    } catch (error) {
      console.error("Errore nell'aggiornamento ordine set:", error);
      throw new Error(
        "Errore nell'aggiornamento dell'ordine dei set di parametri"
      );
    }
  }

  /**
   * Duplica un set di parametri
   */
  async duplicateParameterSet(
    id: number,
    newDescription: string
  ): Promise<ParameterSet> {
    try {
      // Prima ottieni il set originale
      const originalSet = await this.getParameterSetById(id);

      // Crea una copia con la nuova descrizione
      const duplicatedSet = await this.createParameterSet({
        ...originalSet,
        description: newDescription,
        is_default: false,
      });

      return duplicatedSet;
    } catch (error) {
      console.error("Errore nella duplicazione set di parametri:", error);
      throw new Error("Errore nella duplicazione del set di parametri");
    }
  }

  /**
   * Valida i parametri prima del salvataggio
   */
  validateParameters(params: Partial<CalculationParams>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validazioni per ogni campo
    if (params.qualityControlPercent !== undefined) {
      if (
        params.qualityControlPercent < 0 ||
        params.qualityControlPercent > 100
      ) {
        errors.push("Quality Control deve essere tra 0 e 100");
      }
    }

    if (params.duty !== undefined) {
      if (params.duty < 0 || params.duty > 100) {
        errors.push("Dazio deve essere tra 0 e 100");
      }
    }

    if (params.optimalMargin !== undefined) {
      if (params.optimalMargin < 0 || params.optimalMargin > 100) {
        errors.push("Margine ottimale deve essere tra 0 e 100");
      }
    }

    if (params.transportInsuranceCost !== undefined) {
      if (params.transportInsuranceCost < 0) {
        errors.push("Costo trasporto e assicurazione deve essere positivo");
      }
    }

    if (params.italyAccessoryCosts !== undefined) {
      if (params.italyAccessoryCosts < 0) {
        errors.push("Costi accessori Italia devono essere positivi");
      }
    }

    if (params.tools !== undefined) {
      if (params.tools < 0) {
        errors.push("Strumenti devono essere positivi");
      }
    }

    if (params.exchangeRate !== undefined) {
      if (params.exchangeRate <= 0) {
        errors.push("Tasso di cambio deve essere positivo");
      }
    }

    if (params.retailMultiplier !== undefined) {
      if (params.retailMultiplier < 1) {
        errors.push("Moltiplicatore retail deve essere almeno 1");
      }
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
   * Converte un set di parametri in CalculationParams
   */
  convertSetToParams(set: ParameterSet): CalculationParams {
    return {
      purchaseCurrency: set.purchase_currency,
      sellingCurrency: set.selling_currency,
      qualityControlPercent: set.quality_control_percent,
      transportInsuranceCost: set.transport_insurance_cost,
      duty: set.duty,
      exchangeRate: set.exchange_rate,
      italyAccessoryCosts: set.italy_accessory_costs,
      tools: set.tools,
      retailMultiplier: set.retail_multiplier,
      optimalMargin: set.optimal_margin,
      companyMultiplier: set.company_multiplier,
    };
  }

  /**
   * Converte CalculationParams in formato per il server
   */
  convertParamsToSet(
    params: CalculationParams,
    description: string,
    isDefault: boolean = false
  ): Omit<ParameterSet, "id" | "created_at" | "updated_at"> {
    return {
      description,
      purchase_currency: params.purchaseCurrency,
      selling_currency: params.sellingCurrency,
      quality_control_percent: params.qualityControlPercent,
      transport_insurance_cost: params.transportInsuranceCost,
      duty: params.duty,
      exchange_rate: params.exchangeRate,
      italy_accessory_costs: params.italyAccessoryCosts,
      tools: params.tools,
      retail_multiplier: params.retailMultiplier,
      optimal_margin: params.optimalMargin,
      company_multiplier: params.companyMultiplier,
      is_default: isDefault,
      order_index: 0, // Sarà impostato dal server
    };
  }
}

// Istanza singleton del servizio
export const parameterService = new ParameterService();
