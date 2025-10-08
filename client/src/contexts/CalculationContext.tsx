/**
 * Calculation Context per Pricing Calculator v0.2
 * Gestione centralizzata dei calcoli
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { pricingApi } from "../services/api";
import { useParameterContext } from "./ParameterContext";
import {
  CalculationParams,
  SellingPriceCalculation,
  PurchasePriceCalculation,
} from "../types";

// Tipi per i calcoli
export type CalculationMode = "purchase" | "selling" | "margin";

export interface CalculationResult {
  selling?: SellingPriceCalculation;
  purchase?: PurchasePriceCalculation;
  margin?: {
    companyMargin: number;
    purchasePrice: number;
    retailPrice: number;
  };
}

// Stato del context
interface CalculationContextState {
  // Risultati calcoli
  calculation: CalculationResult | null;

  // Input utente
  purchasePrice: string;
  retailPrice: string;

  // Stato di blocco
  purchasePriceLocked: boolean;
  retailPriceLocked: boolean;

  // Modalità di calcolo
  mode: CalculationMode;

  // Stato di caricamento
  loading: boolean;

  // Errori
  error: string | null;

  // Dettagli
  showDetails: boolean;
}

// Azioni del context
interface CalculationContextActions {
  // Gestione input
  setPurchasePrice: (price: string) => void;
  setRetailPrice: (price: string) => void;
  setPurchasePriceLocked: (locked: boolean) => void;
  setRetailPriceLocked: (locked: boolean) => void;
  setMode: (mode: CalculationMode) => void;

  // Calcoli
  calculateSelling: (purchasePrice: number) => Promise<SellingPriceCalculation>;
  calculatePurchase: (retailPrice: number) => Promise<PurchasePriceCalculation>;
  calculateMargin: (purchasePrice: number, retailPrice: number) => Promise<any>;
  performCalculation: () => Promise<void>;

  // Gestione dettagli
  setShowDetails: (show: boolean) => void;

  // Utility
  clearCalculation: () => void;
  clearError: () => void;
  resetInputs: () => void;
}

// Context completo
interface CalculationContextType
  extends CalculationContextState,
    CalculationContextActions {}

// Creazione del context
const CalculationContext = createContext<CalculationContextType | undefined>(
  undefined
);

// Provider del context
interface CalculationProviderProps {
  children: ReactNode;
}

export const CalculationProvider: React.FC<CalculationProviderProps> = ({
  children,
}) => {
  const { currentParams } = useParameterContext();

  // Stato del context
  const [state, setState] = useState<CalculationContextState>({
    calculation: null,
    purchasePrice: "",
    retailPrice: "",
    purchasePriceLocked: false,
    retailPriceLocked: false,
    mode: "purchase",
    loading: false,
    error: null,
    showDetails: false,
  });

  // Aggiorna prezzo di acquisto
  const setPurchasePrice = useCallback((price: string) => {
    setState((prev) => ({ ...prev, purchasePrice: price }));
  }, []);

  // Aggiorna prezzo di vendita
  const setRetailPrice = useCallback((price: string) => {
    setState((prev) => ({ ...prev, retailPrice: price }));
  }, []);

  // Aggiorna stato di blocco prezzo acquisto
  const setPurchasePriceLocked = useCallback((locked: boolean) => {
    setState((prev) => ({ ...prev, purchasePriceLocked: locked }));
  }, []);

  // Aggiorna stato di blocco prezzo vendita
  const setRetailPriceLocked = useCallback((locked: boolean) => {
    setState((prev) => ({ ...prev, retailPriceLocked: locked }));
  }, []);

  // Aggiorna modalità di calcolo
  const setMode = useCallback((mode: CalculationMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  // Calcola prezzo di vendita
  const calculateSelling = useCallback(
    async (purchasePrice: number): Promise<SellingPriceCalculation> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const result = await pricingApi.calculateSellingPrice(
          purchasePrice,
          currentParams.sellingCurrency
        );
        setState((prev) => ({ ...prev, loading: false }));
        return result;
      } catch (error) {
        console.error("Errore nel calcolo prezzo di vendita:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Errore nel calcolo del prezzo di vendita",
        }));
        throw error;
      }
    },
    [currentParams.sellingCurrency]
  );

  // Calcola prezzo di acquisto
  const calculatePurchase = useCallback(
    async (retailPrice: number): Promise<PurchasePriceCalculation> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const result = await pricingApi.calculatePurchasePrice(
          retailPrice,
          currentParams.sellingCurrency
        );
        setState((prev) => ({ ...prev, loading: false }));
        return result;
      } catch (error) {
        console.error("Errore nel calcolo prezzo di acquisto:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Errore nel calcolo del prezzo di acquisto",
        }));
        throw error;
      }
    },
    [currentParams.sellingCurrency]
  );

  // Calcola margine
  const calculateMargin = useCallback(
    async (purchasePrice: number, retailPrice: number) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const result = await pricingApi.calculateMargin(
          purchasePrice,
          retailPrice
        );
        setState((prev) => ({ ...prev, loading: false }));
        return result;
      } catch (error) {
        console.error("Errore nel calcolo margine:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Errore nel calcolo del margine",
        }));
        throw error;
      }
    },
    []
  );

  // Esegue il calcolo in base alla modalità
  const performCalculation = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let result: CalculationResult = {};

      switch (state.mode) {
        case "purchase":
          if (state.retailPrice && !isNaN(parseFloat(state.retailPrice))) {
            const purchaseResult = await calculatePurchase(
              parseFloat(state.retailPrice)
            );
            result.purchase = purchaseResult;
          }
          break;

        case "selling":
          if (state.purchasePrice && !isNaN(parseFloat(state.purchasePrice))) {
            const sellingResult = await calculateSelling(
              parseFloat(state.purchasePrice)
            );
            result.selling = sellingResult;
          }
          break;

        case "margin":
          if (
            state.purchasePrice &&
            state.retailPrice &&
            !isNaN(parseFloat(state.purchasePrice)) &&
            !isNaN(parseFloat(state.retailPrice))
          ) {
            const marginResult = await calculateMargin(
              parseFloat(state.purchasePrice),
              parseFloat(state.retailPrice)
            );
            result.margin = marginResult;
          }
          break;
      }

      setState((prev) => ({
        ...prev,
        calculation: result,
        loading: false,
      }));
    } catch (error) {
      console.error("Errore nel calcolo:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Errore nel calcolo",
      }));
    }
  }, [
    state.mode,
    state.purchasePrice,
    state.retailPrice,
    calculateSelling,
    calculatePurchase,
    calculateMargin,
  ]);

  // Aggiorna stato dettagli
  const setShowDetails = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showDetails: show }));
  }, []);

  // Pulisce il calcolo
  const clearCalculation = useCallback(() => {
    setState((prev) => ({ ...prev, calculation: null }));
  }, []);

  // Pulisce gli errori
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Reset degli input
  const resetInputs = useCallback(() => {
    setState((prev) => ({
      ...prev,
      purchasePrice: "",
      retailPrice: "",
      purchasePriceLocked: false,
      retailPriceLocked: false,
      calculation: null,
      error: null,
    }));
  }, []);

  // Valore del context
  const contextValue: CalculationContextType = {
    ...state,
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
  };

  return (
    <CalculationContext.Provider value={contextValue}>
      {children}
    </CalculationContext.Provider>
  );
};

// Hook per usare il context
export const useCalculationContext = (): CalculationContextType => {
  const context = useContext(CalculationContext);
  if (context === undefined) {
    throw new Error(
      "useCalculationContext must be used within a CalculationProvider"
    );
  }
  return context;
};

export default CalculationContext;
