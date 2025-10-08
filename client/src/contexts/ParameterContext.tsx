/**
 * Parameter Context per Pricing Calculator v0.2
 * Gestione centralizzata dei parametri e set di parametri
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { pricingApi } from "../services/api";
import { CalculationParams } from "../types";

// Tipi per i set di parametri
export interface ParameterSet {
  id: number;
  description: string;
  purchase_currency: string;
  selling_currency: string;
  quality_control_percent: number;
  transport_insurance_cost: number;
  duty: number;
  exchange_rate: number;
  italy_accessory_costs: number;
  tools: number;
  retail_multiplier: number;
  optimal_margin: number;
  company_multiplier: number;
  is_default: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Stato del context
interface ParameterContextState {
  // Parametri attuali
  currentParams: CalculationParams;

  // Set di parametri
  parameterSets: ParameterSet[];
  activeParameterSet: ParameterSet | null;

  // Stato di caricamento
  loading: boolean;
  loadingParameterSets: boolean;

  // Errori
  error: string | null;
  parameterSetsError: string | null;

  // Stato di salvataggio
  saving: boolean;
  autoSaving: boolean;
}

// Azioni del context
interface ParameterContextActions {
  // Gestione parametri attuali
  updateParameter: (key: keyof CalculationParams, value: any) => void;
  updateParameters: (params: Partial<CalculationParams>) => void;
  loadCurrentParams: () => Promise<void>;
  saveCurrentParams: () => Promise<void>;

  // Gestione set di parametri
  loadParameterSets: () => Promise<void>;
  loadParameterSet: (setId: number) => Promise<void>;
  createParameterSet: (
    set: Omit<ParameterSet, "id" | "created_at" | "updated_at">
  ) => Promise<ParameterSet>;
  updateParameterSet: (
    id: number,
    set: Partial<ParameterSet>
  ) => Promise<ParameterSet>;
  deleteParameterSet: (id: number) => Promise<void>;
  duplicateParameterSet: (
    id: number,
    newDescription: string
  ) => Promise<ParameterSet>;
  setDefaultParameterSet: (id: number) => Promise<void>;
  reorderParameterSets: (sets: ParameterSet[]) => Promise<void>;

  // Utility
  clearError: () => void;
  resetToDefaults: () => void;
}

// Context completo
interface ParameterContextType
  extends ParameterContextState,
    ParameterContextActions {}

// Valori di default
const defaultParams: CalculationParams = {
  purchaseCurrency: "USD",
  sellingCurrency: "EUR",
  qualityControlPercent: 5,
  transportInsuranceCost: 2.3,
  duty: 8,
  exchangeRate: 1.07,
  italyAccessoryCosts: 1,
  tools: 1,
  companyMultiplier: 1.33,
  retailMultiplier: 2.48,
  optimalMargin: 25,
};

// Creazione del context
const ParameterContext = createContext<ParameterContextType | undefined>(
  undefined
);

// Provider del context
interface ParameterProviderProps {
  children: ReactNode;
}

export const ParameterProvider: React.FC<ParameterProviderProps> = ({
  children,
}) => {
  // Stato del context
  const [state, setState] = useState<ParameterContextState>({
    currentParams: defaultParams,
    parameterSets: [],
    activeParameterSet: null,
    loading: false,
    loadingParameterSets: false,
    error: null,
    parameterSetsError: null,
    saving: false,
    autoSaving: false,
  });

  // Carica parametri attuali dal server
  const loadCurrentParams = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const params = await pricingApi.getParams();
      setState((prev) => ({
        ...prev,
        currentParams: params,
        loading: false,
      }));
    } catch (error) {
      console.error("Errore nel caricamento parametri:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Errore nel caricamento dei parametri",
      }));
    }
  }, []);

  // Salva parametri attuali sul server
  const saveCurrentParams = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: null }));
      await pricingApi.updateParams(state.currentParams);
      setState((prev) => ({ ...prev, saving: false }));
    } catch (error) {
      console.error("Errore nel salvataggio parametri:", error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Errore nel salvataggio dei parametri",
      }));
    }
  }, [state.currentParams]);

  // Carica set di parametri
  const loadParameterSets = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        loadingParameterSets: true,
        parameterSetsError: null,
      }));
      const sets = await pricingApi.getParameterSets();
      setState((prev) => ({
        ...prev,
        parameterSets: sets,
        loadingParameterSets: false,
      }));
    } catch (error) {
      console.error("Errore nel caricamento set di parametri:", error);
      setState((prev) => ({
        ...prev,
        loadingParameterSets: false,
        parameterSetsError: "Errore nel caricamento dei set di parametri",
      }));
    }
  }, []);

  // Carica un set di parametri specifico
  const loadParameterSet = useCallback(async (setId: number) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await pricingApi.loadParameterSet(setId);

      // Aggiorna i parametri attuali con quelli del set
      setState((prev) => ({
        ...prev,
        currentParams: result.params,
        activeParameterSet: null, // Non abbiamo l'oggetto ParameterSet completo
        loading: false,
      }));
    } catch (error) {
      console.error("Errore nel caricamento set di parametri:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Errore nel caricamento del set di parametri",
      }));
    }
  }, []);

  // Crea un nuovo set di parametri
  const createParameterSet = useCallback(
    async (set: Omit<ParameterSet, "id" | "created_at" | "updated_at">) => {
      try {
        setState((prev) => ({ ...prev, saving: true, error: null }));
        const newSet = await pricingApi.createParameterSet(set);

        // Ricarica la lista dei set
        await loadParameterSets();

        setState((prev) => ({ ...prev, saving: false }));
        return newSet;
      } catch (error) {
        console.error("Errore nella creazione set di parametri:", error);
        setState((prev) => ({
          ...prev,
          saving: false,
          error: "Errore nella creazione del set di parametri",
        }));
        throw error;
      }
    },
    [loadParameterSets]
  );

  // Aggiorna un set di parametri
  const updateParameterSet = useCallback(
    async (id: number, set: Partial<ParameterSet>) => {
      try {
        setState((prev) => ({ ...prev, saving: true, error: null }));
        const updatedSet = await pricingApi.updateParameterSet(id, set);

        // Aggiorna la lista locale
        setState((prev) => ({
          ...prev,
          parameterSets: prev.parameterSets.map((s) =>
            s.id === id ? updatedSet : s
          ),
          saving: false,
        }));

        return updatedSet;
      } catch (error) {
        console.error("Errore nell'aggiornamento set di parametri:", error);
        setState((prev) => ({
          ...prev,
          saving: false,
          error: "Errore nell'aggiornamento del set di parametri",
        }));
        throw error;
      }
    },
    []
  );

  // Elimina un set di parametri
  const deleteParameterSet = useCallback(async (id: number) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: null }));
      await pricingApi.deleteParameterSet(id);

      // Rimuovi dalla lista locale
      setState((prev) => ({
        ...prev,
        parameterSets: prev.parameterSets.filter((s) => s.id !== id),
        saving: false,
      }));
    } catch (error) {
      console.error("Errore nell'eliminazione set di parametri:", error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Errore nell'eliminazione del set di parametri",
      }));
      throw error;
    }
  }, []);

  // Duplica un set di parametri
  const duplicateParameterSet = useCallback(
    async (id: number, newDescription: string) => {
      try {
        setState((prev) => ({ ...prev, saving: true, error: null }));
        const originalSet = state.parameterSets.find((s) => s.id === id);
        if (!originalSet) throw new Error("Set di parametri non trovato");

        const duplicatedSet = await pricingApi.createParameterSet({
          ...originalSet,
          description: newDescription,
          is_default: false,
        });

        // Ricarica la lista dei set
        await loadParameterSets();

        setState((prev) => ({ ...prev, saving: false }));
        return duplicatedSet;
      } catch (error) {
        console.error("Errore nella duplicazione set di parametri:", error);
        setState((prev) => ({
          ...prev,
          saving: false,
          error: "Errore nella duplicazione del set di parametri",
        }));
        throw error;
      }
    },
    [state.parameterSets, loadParameterSets]
  );

  // Imposta un set come default
  const setDefaultParameterSet = useCallback(async (id: number) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: null }));
      await pricingApi.setDefaultParameterSet(id);

      // Aggiorna la lista locale
      setState((prev) => ({
        ...prev,
        parameterSets: prev.parameterSets.map((s) => ({
          ...s,
          is_default: s.id === id,
        })),
        saving: false,
      }));
    } catch (error) {
      console.error("Errore nell'impostazione set di default:", error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Errore nell'impostazione del set di default",
      }));
      throw error;
    }
  }, []);

  // Riordina i set di parametri
  const reorderParameterSets = useCallback(async (sets: ParameterSet[]) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: null }));
      await pricingApi.updateParameterSetsOrder(sets);

      // Aggiorna la lista locale
      setState((prev) => ({
        ...prev,
        parameterSets: sets,
        saving: false,
      }));
    } catch (error) {
      console.error("Errore nel riordinamento set di parametri:", error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Errore nel riordinamento dei set di parametri",
      }));
      throw error;
    }
  }, []);

  // Aggiorna un singolo parametro
  const updateParameter = useCallback(
    (key: keyof CalculationParams, value: any) => {
      setState((prev) => ({
        ...prev,
        currentParams: {
          ...prev.currentParams,
          [key]: value,
        },
      }));
    },
    []
  );

  // Aggiorna più parametri
  const updateParameters = useCallback((params: Partial<CalculationParams>) => {
    setState((prev) => ({
      ...prev,
      currentParams: {
        ...prev.currentParams,
        ...params,
      },
    }));
  }, []);

  // Pulisce gli errori
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, parameterSetsError: null }));
  }, []);

  // Reset ai valori di default
  const resetToDefaults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentParams: defaultParams,
      activeParameterSet: null,
    }));
  }, []);

  // Auto-save con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.currentParams !== defaultParams) {
        setState((prev) => ({ ...prev, autoSaving: true }));
        saveCurrentParams().finally(() => {
          setState((prev) => ({ ...prev, autoSaving: false }));
        });
      }
    }, 2000); // Debounce di 2 secondi

    return () => clearTimeout(timeoutId);
  }, [state.currentParams, saveCurrentParams]);

  // Carica i dati iniziali
  useEffect(() => {
    loadCurrentParams();
    loadParameterSets();
  }, [loadCurrentParams, loadParameterSets]);

  // Valore del context
  const contextValue: ParameterContextType = {
    ...state,
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
  };

  return (
    <ParameterContext.Provider value={contextValue}>
      {children}
    </ParameterContext.Provider>
  );
};

// Hook per usare il context
export const useParameterContext = (): ParameterContextType => {
  const context = useContext(ParameterContext);
  if (context === undefined) {
    throw new Error(
      "useParameterContext must be used within a ParameterProvider"
    );
  }
  return context;
};

export default ParameterContext;
