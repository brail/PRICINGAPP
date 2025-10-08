/**
 * useParameterManager Hook per Pricing Calculator v0.2
 * Hook specializzato per la gestione dei parametri
 */

import { useCallback } from "react";
import { useParameterContext } from "../contexts/ParameterContext";
import { CalculationParams } from "../types";

export const useParameterManager = () => {
  const {
    currentParams,
    parameterSets,
    activeParameterSet,
    loading,
    error,
    saving,
    autoSaving,
    updateParameter,
    updateParameters,
    loadCurrentParams,
    saveCurrentParams,
    loadParameterSets,
    loadParameterSet,
    createParameterSet,
    updateParameterSet,
    deleteParameterSet,
    duplicateParameterSet,
    setDefaultParameterSet,
    reorderParameterSets,
    clearError,
    resetToDefaults,
  } = useParameterContext();

  // Aggiorna un singolo parametro con validazione
  const updateParameterWithValidation = useCallback(
    (key: keyof CalculationParams, value: any) => {
      // Validazioni specifiche per tipo
      switch (key) {
        case "qualityControlPercent":
        case "duty":
        case "optimalMargin":
          if (value < 0 || value > 100) {
            throw new Error(`${key} deve essere tra 0 e 100`);
          }
          break;
        case "transportInsuranceCost":
        case "italyAccessoryCosts":
        case "tools":
          if (value < 0) {
            throw new Error(`${key} deve essere positivo`);
          }
          break;
        case "exchangeRate":
          if (value <= 0) {
            throw new Error("Tasso di cambio deve essere positivo");
          }
          break;
        case "retailMultiplier":
          if (value < 1) {
            throw new Error("Moltiplicatore retail deve essere almeno 1");
          }
          break;
      }

      updateParameter(key, value);
    },
    [updateParameter]
  );

  // Aggiorna più parametri con validazione
  const updateParametersWithValidation = useCallback(
    (params: Partial<CalculationParams>) => {
      // Valida ogni parametro
      Object.entries(params).forEach(([key, value]) => {
        updateParameterWithValidation(key as keyof CalculationParams, value);
      });
    },
    [updateParameterWithValidation]
  );

  // Carica un set di parametri e aggiorna i parametri attuali
  const loadAndApplyParameterSet = useCallback(
    async (setId: number) => {
      try {
        await loadParameterSet(setId);
      } catch (error) {
        console.error("Errore nel caricamento set di parametri:", error);
        throw error;
      }
    },
    [loadParameterSet]
  );

  // Crea un nuovo set dai parametri attuali
  const createSetFromCurrentParams = useCallback(
    async (description: string, isDefault: boolean = false) => {
      try {
        const newSet = await createParameterSet({
          description,
          purchase_currency: currentParams.purchaseCurrency,
          selling_currency: currentParams.sellingCurrency,
          quality_control_percent: currentParams.qualityControlPercent,
          transport_insurance_cost: currentParams.transportInsuranceCost,
          duty: currentParams.duty,
          exchange_rate: currentParams.exchangeRate,
          italy_accessory_costs: currentParams.italyAccessoryCosts,
          tools: currentParams.tools,
          retail_multiplier: currentParams.retailMultiplier,
          optimal_margin: currentParams.optimalMargin,
          company_multiplier: currentParams.companyMultiplier,
          is_default: isDefault,
          order_index: parameterSets.length,
        });

        return newSet;
      } catch (error) {
        console.error(
          "Errore nella creazione set dai parametri attuali:",
          error
        );
        throw error;
      }
    },
    [currentParams, parameterSets.length, createParameterSet]
  );

  // Applica un set di parametri ai parametri attuali
  const applyParameterSet = useCallback(
    (set: any) => {
      updateParameters({
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
      });
    },
    [updateParameters]
  );

  // Duplica un set con una nuova descrizione
  const duplicateSetWithNewName = useCallback(
    async (setId: number, newDescription: string) => {
      try {
        const duplicatedSet = await duplicateParameterSet(
          setId,
          newDescription
        );
        return duplicatedSet;
      } catch (error) {
        console.error("Errore nella duplicazione set:", error);
        throw error;
      }
    },
    [duplicateParameterSet]
  );

  // Verifica se i parametri sono stati modificati
  const hasUnsavedChanges = useCallback(() => {
    // Implementa logica per verificare se ci sono modifiche non salvate
    return false; // Placeholder
  }, []);

  // Salva automaticamente se ci sono modifiche
  const autoSaveIfNeeded = useCallback(async () => {
    if (hasUnsavedChanges()) {
      try {
        await saveCurrentParams();
      } catch (error) {
        console.error("Errore nell'auto-save:", error);
      }
    }
  }, [hasUnsavedChanges, saveCurrentParams]);

  // Reset ai parametri di default
  const resetToDefaultParams = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  // Ottiene il set di parametri attivo
  const getActiveParameterSet = useCallback(() => {
    return activeParameterSet;
  }, [activeParameterSet]);

  // Ottiene tutti i set di parametri ordinati
  const getOrderedParameterSets = useCallback(() => {
    return [...parameterSets].sort((a, b) => a.order_index - b.order_index);
  }, [parameterSets]);

  // Ottiene il set di default
  const getDefaultParameterSet = useCallback(() => {
    return parameterSets.find((set) => set.is_default);
  }, [parameterSets]);

  return {
    // Stato
    currentParams,
    parameterSets,
    activeParameterSet,
    loading,
    error,
    saving,
    autoSaving,

    // Azioni base
    updateParameter,
    updateParameters,
    loadCurrentParams,
    saveCurrentParams,
    loadParameterSets,
    loadParameterSet,
    createParameterSet,
    updateParameterSet,
    deleteParameterSet,
    duplicateParameterSet,
    setDefaultParameterSet,
    reorderParameterSets,
    clearError,
    resetToDefaults,

    // Azioni avanzate
    updateParameterWithValidation,
    updateParametersWithValidation,
    loadAndApplyParameterSet,
    createSetFromCurrentParams,
    applyParameterSet,
    duplicateSetWithNewName,
    hasUnsavedChanges,
    autoSaveIfNeeded,
    resetToDefaultParams,
    getActiveParameterSet,
    getOrderedParameterSets,
    getDefaultParameterSet,
  };
};
