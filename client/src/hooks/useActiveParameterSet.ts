import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { pricingApi } from "../services/api";
import { CalculationParams } from "../types";

export interface ParameterSet {
  id: number;
  description: string;
  is_default: number;
  purchase_currency: string;
  selling_currency: string;
  quality_control_percent: number;
  transport_insurance_cost: number;
  duty: number;
  exchange_rate: number;
  italy_accessory_costs: number;
  tools: number;
  company_multiplier: number;
  retail_multiplier: number;
  optimal_margin: number;
}

export interface ActiveParameterSetResponse {
  params: CalculationParams;
  setId: number;
  description: string;
  source: "saved" | "default" | "first_available";
}

export const useActiveParameterSet = () => {
  const { user } = useAuth();

  // Stato del set attivo
  const [activeParams, setActiveParams] = useState<CalculationParams | null>(
    null
  );
  const [activeSetId, setActiveSetId] = useState<number | null>(null);
  const [activeSetDescription, setActiveSetDescription] = useState<string>("");
  const [source, setSource] = useState<"saved" | "default" | "first_available">(
    "default"
  );

  // Stato di caricamento
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Lista di tutti i set disponibili
  const [availableSets, setAvailableSets] = useState<ParameterSet[]>([]);

  // Carica tutti i set di parametri dal backend
  const loadParameterSets = useCallback(async () => {
    if (!user) {
      setError("Utente non autenticato");
      return [];
    }

    try {
      const sets = await pricingApi.getParameterSets();
      setAvailableSets(sets);
      return sets;
    } catch (err: any) {
      // Se l'errore è 401, l'utente non è autenticato
      if (err.response?.status === 401) {
        setError("Utente non autenticato");
      } else {
        setError("Errore nel caricamento dei set di parametri");
      }
      throw err;
    }
  }, [user]);

  // Carica i parametri attivi per l'utente corrente
  const loadActiveParameters = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("Utente non autenticato");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response: ActiveParameterSetResponse =
        await pricingApi.getActiveParameters();

      setActiveParams(response.params);
      setActiveSetId(response.setId);
      setActiveSetDescription(response.description);
      setSource(response.source);

      console.log(
        `🎯 Parametri attivi caricati: ${response.description} (${response.source})`
      );
    } catch (err: any) {
      console.error("Errore nel caricamento dei parametri attivi:", err);
      // Se l'errore è 401, l'utente non è autenticato
      if (err.response?.status === 401) {
        setError("Utente non autenticato");
      } else {
        setError("Errore nel caricamento dei parametri attivi");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cambia il set attivo
  const changeActiveSet = useCallback(
    async (setId: number) => {
      if (!user) {
        setError("Utente non autenticato");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await pricingApi.loadActiveParameterSet(setId);

        setActiveParams(response.params);
        setActiveSetId(response.setId);
        setActiveSetDescription(response.description);
        setSource("saved");

        console.log(`✅ Set attivo cambiato: ${response.description}`);
      } catch (err: any) {
        console.error("Errore nel cambio del set attivo:", err);
        // Se l'errore è 401, l'utente non è autenticato
        if (err.response?.status === 401) {
          setError("Utente non autenticato");
        } else {
          setError("Errore nel cambio del set attivo");
        }
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Inizializzazione
  useEffect(() => {
    const initialize = async () => {
      if (!user) {
        setLoading(false);
        setError("Utente non autenticato");
        return;
      }

      try {
        // Carica i parametri attivi
        await loadActiveParameters();

        // Carica tutti i set disponibili
        await loadParameterSets();
      } catch (err: any) {
        console.error("Errore nell'inizializzazione:", err);
        // Se l'errore è 401, l'utente non è autenticato
        if (err.response?.status === 401) {
          setError("Utente non autenticato");
        }
      }
    };

    initialize();
  }, [user, loadActiveParameters, loadParameterSets]);

  return {
    // Stato
    activeParams,
    activeSetId,
    activeSetDescription,
    source,
    availableSets,
    loading,
    error,

    // Azioni
    changeActiveSet,
    loadActiveParameters,
    loadParameterSets,

    // Utilità
    isActiveSet: (setId: number) => activeSetId === setId,
    hasActiveParams: activeParams !== null,
  };
};
