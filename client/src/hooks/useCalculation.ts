/**
 * useCalculation Hook per Pricing Calculator v0.2
 * Hook specializzato per i calcoli
 */

import { useCallback, useEffect } from "react";
import { useCalculationContext } from "../contexts/CalculationContext";
import { useParameterContext } from "../contexts/ParameterContext";
import { CalculationMode } from "../contexts/CalculationContext";

export const useCalculation = () => {
  const {
    calculation,
    purchasePrice,
    retailPrice,
    purchasePriceLocked,
    retailPriceLocked,
    mode,
    loading,
    error,
    showDetails,
    setPurchasePrice,
    setRetailPrice,
    setPurchasePriceLocked,
    setRetailPriceLocked,
    setMode,
    calculateSelling,
    calculatePurchase,
    calculateMargin,
    performCalculation,
    setShowDetails,
    clearCalculation,
    clearError,
    resetInputs,
  } = useCalculationContext();

  const { currentParams } = useParameterContext();

  // Calcola automaticamente quando cambiano i parametri
  useEffect(() => {
    if (purchasePrice && mode === "selling") {
      performCalculation();
    } else if (retailPrice && mode === "purchase") {
      performCalculation();
    } else if (purchasePrice && retailPrice && mode === "margin") {
      performCalculation();
    }
  }, [currentParams, purchasePrice, retailPrice, mode, performCalculation]);

  // Calcola prezzo di vendita con validazione
  const calculateSellingWithValidation = useCallback(
    async (price: number) => {
      if (price <= 0) {
        throw new Error("Il prezzo di acquisto deve essere positivo");
      }

      try {
        const result = await calculateSelling(price);
        return result;
      } catch (error) {
        console.error("Errore nel calcolo prezzo di vendita:", error);
        throw error;
      }
    },
    [calculateSelling]
  );

  // Calcola prezzo di acquisto con validazione
  const calculatePurchaseWithValidation = useCallback(
    async (price: number) => {
      if (price <= 0) {
        throw new Error("Il prezzo di vendita deve essere positivo");
      }

      try {
        const result = await calculatePurchase(price);
        return result;
      } catch (error) {
        console.error("Errore nel calcolo prezzo di acquisto:", error);
        throw error;
      }
    },
    [calculatePurchase]
  );

  // Calcola margine con validazione
  const calculateMarginWithValidation = useCallback(
    async (purchasePrice: number, retailPrice: number) => {
      if (purchasePrice <= 0 || retailPrice <= 0) {
        throw new Error("I prezzi devono essere positivi");
      }

      if (purchasePrice >= retailPrice) {
        throw new Error(
          "Il prezzo di acquisto deve essere inferiore al prezzo di vendita"
        );
      }

      try {
        const result = await calculateMargin(purchasePrice, retailPrice);
        return result;
      } catch (error) {
        console.error("Errore nel calcolo margine:", error);
        throw error;
      }
    },
    [calculateMargin]
  );

  // Aggiorna prezzo di acquisto con validazione
  const setPurchasePriceWithValidation = useCallback(
    (price: string) => {
      const numericPrice = parseFloat(price);
      if (price && !isNaN(numericPrice) && numericPrice < 0) {
        throw new Error("Il prezzo non può essere negativo");
      }
      setPurchasePrice(price);
    },
    [setPurchasePrice]
  );

  // Aggiorna prezzo di vendita con validazione
  const setRetailPriceWithValidation = useCallback(
    (price: string) => {
      const numericPrice = parseFloat(price);
      if (price && !isNaN(numericPrice) && numericPrice < 0) {
        throw new Error("Il prezzo non può essere negativo");
      }
      setRetailPrice(price);
    },
    [setRetailPrice]
  );

  // Cambia modalità di calcolo
  const changeMode = useCallback(
    (newMode: CalculationMode) => {
      setMode(newMode);

      // Pulisce i risultati quando cambia modalità
      clearCalculation();
    },
    [setMode, clearCalculation]
  );

  // Blocca/sblocca prezzo di acquisto
  const togglePurchasePriceLock = useCallback(() => {
    setPurchasePriceLocked(!purchasePriceLocked);
  }, [purchasePriceLocked, setPurchasePriceLocked]);

  // Blocca/sblocca prezzo di vendita
  const toggleRetailPriceLock = useCallback(() => {
    setRetailPriceLocked(!retailPriceLocked);
  }, [retailPriceLocked, setRetailPriceLocked]);

  // Esegue calcolo in base alla modalità corrente
  const executeCalculation = useCallback(async () => {
    try {
      await performCalculation();
    } catch (error) {
      console.error("Errore nell'esecuzione calcolo:", error);
      throw error;
    }
  }, [performCalculation]);

  // Pulisce tutto e resetta
  const clearAll = useCallback(() => {
    resetInputs();
    clearCalculation();
    clearError();
  }, [resetInputs, clearCalculation, clearError]);

  // Ottiene il risultato del calcolo in base alla modalità
  const getCalculationResult = useCallback(() => {
    if (!calculation) return null;

    switch (mode) {
      case "selling":
        return calculation.selling;
      case "purchase":
        return calculation.purchase;
      case "margin":
        return calculation.margin;
      default:
        return null;
    }
  }, [calculation, mode]);

  // Verifica se può eseguire il calcolo
  const canCalculate = useCallback(() => {
    switch (mode) {
      case "selling":
        return (
          purchasePrice &&
          !isNaN(parseFloat(purchasePrice)) &&
          parseFloat(purchasePrice) > 0
        );
      case "purchase":
        return (
          retailPrice &&
          !isNaN(parseFloat(retailPrice)) &&
          parseFloat(retailPrice) > 0
        );
      case "margin":
        return (
          purchasePrice &&
          retailPrice &&
          !isNaN(parseFloat(purchasePrice)) &&
          !isNaN(parseFloat(retailPrice)) &&
          parseFloat(purchasePrice) > 0 &&
          parseFloat(retailPrice) > 0 &&
          parseFloat(purchasePrice) < parseFloat(retailPrice)
        );
      default:
        return false;
    }
  }, [mode, purchasePrice, retailPrice]);

  // Ottiene il margine dal risultato
  const getMargin = useCallback(() => {
    const result = getCalculationResult();
    if (result && "companyMargin" in result) {
      return result.companyMargin;
    }
    return null;
  }, [getCalculationResult]);

  // Ottiene il prezzo finale dal risultato
  const getFinalPrice = useCallback(() => {
    const result = getCalculationResult();
    if (result) {
      if (result && typeof result === 'object' && "retailPrice" in result) {
        return (result as any).retailPrice;
      } else if (result && typeof result === 'object' && "purchasePrice" in result) {
        return (result as any).purchasePrice;
      }
    }
    return null;
  }, [getCalculationResult]);

  // Formatta il prezzo per la visualizzazione
  const formatPrice = useCallback((price: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }, []);

  // Formatta la percentuale per la visualizzazione
  const formatPercentage = useCallback((value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  return {
    // Stato
    calculation,
    purchasePrice,
    retailPrice,
    purchasePriceLocked,
    retailPriceLocked,
    mode,
    loading,
    error,
    showDetails,

    // Azioni base
    setPurchasePrice,
    setRetailPrice,
    setPurchasePriceLocked,
    setRetailPriceLocked,
    setMode,
    calculateSelling,
    calculatePurchase,
    calculateMargin,
    performCalculation,
    setShowDetails,
    clearCalculation,
    clearError,
    resetInputs,

    // Azioni avanzate
    calculateSellingWithValidation,
    calculatePurchaseWithValidation,
    calculateMarginWithValidation,
    setPurchasePriceWithValidation,
    setRetailPriceWithValidation,
    changeMode,
    togglePurchasePriceLock,
    toggleRetailPriceLock,
    executeCalculation,
    clearAll,
    getCalculationResult,
    canCalculate,
    getMargin,
    getFinalPrice,
    formatPrice,
    formatPercentage,
  };
};
