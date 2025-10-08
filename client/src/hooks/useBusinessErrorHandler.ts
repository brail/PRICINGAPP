import { useState, useCallback, useRef } from "react";
import { BusinessError } from "../components/CompactErrorHandler";

interface UseBusinessErrorHandlerReturn {
  errors: BusinessError[];
  addError: (error: Omit<BusinessError, "id" | "timestamp">) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  getErrorsByType: (type: BusinessError["type"]) => BusinessError[];
  getErrorsBySeverity: (severity: BusinessError["severity"]) => BusinessError[];
}

export const useBusinessErrorHandler = (): UseBusinessErrorHandlerReturn => {
  const [errors, setErrors] = useState<BusinessError[]>([]);
  const errorIdCounter = useRef(0);

  const addError = useCallback(
    (errorData: Omit<BusinessError, "id" | "timestamp">) => {
      const id = `error_${++errorIdCounter.current}_${Date.now()}`;
      const newError: BusinessError = {
        ...errorData,
        id,
        timestamp: new Date(),
      };

      setErrors((prev) => {
        // Evita duplicati basati su tipo e messaggio
        const isDuplicate = prev.some(
          (existing) =>
            existing.type === newError.type &&
            existing.message === newError.message &&
            existing.severity === newError.severity
        );

        if (isDuplicate) {
          return prev;
        }

        return [...prev, newError];
      });
    },
    []
  );

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;
  const hasCriticalErrors = errors.some(
    (error) => error.severity === "critical"
  );

  const getErrorsByType = useCallback(
    (type: BusinessError["type"]) => {
      return errors.filter((error) => error.type === type);
    },
    [errors]
  );

  const getErrorsBySeverity = useCallback(
    (severity: BusinessError["severity"]) => {
      return errors.filter((error) => error.severity === severity);
    },
    [errors]
  );

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    hasCriticalErrors,
    getErrorsByType,
    getErrorsBySeverity,
  };
};

// Utility functions per creare errori business-specific
export const createBusinessError = {
  validation: (
    message: string,
    field?: string,
    suggestions?: string[]
  ): Omit<BusinessError, "id" | "timestamp"> => ({
    type: "validation",
    severity: "medium",
    title: "Dati non validi",
    message,
    details: field ? `Campo interessato: ${field}` : undefined,
    suggestions: suggestions || [
      "Compila tutti i campi obbligatori",
      "Inserisci valori numerici validi",
      "Verifica il formato dei dati",
    ],
  }),

  calculation: (
    message: string,
    context?: Record<string, any>
  ): Omit<BusinessError, "id" | "timestamp"> => ({
    type: "calculation",
    severity: "high",
    title: "Errore di calcolo",
    message,
    context,
    suggestions: [
      "Inserisci valori numerici positivi",
      "Verifica i parametri di calcolo",
      "Prova con valori diversi",
    ],
  }),

  network: (
    message: string,
    retryAction?: () => void
  ): Omit<BusinessError, "id" | "timestamp"> => ({
    type: "network",
    severity: "high",
    title: "Errore di connessione",
    message,
    suggestions: [
      "Verifica la tua connessione internet",
      "Attendi qualche secondo e riprova",
      "Se il problema persiste, contatta il supporto tecnico",
    ],
    actions: retryAction
      ? [{ label: "🔄 Riprova ora", action: retryAction }]
      : undefined,
  }),

  business: (
    message: string,
    businessRule?: string
  ): Omit<BusinessError, "id" | "timestamp"> => ({
    type: "business",
    severity: "high",
    title: "Regola aziendale",
    message,
    details: businessRule ? `Regola applicata: ${businessRule}` : undefined,
    suggestions: [
      "Verifica i parametri aziendali configurati",
      "Controlla le regole di business attive",
      "Contatta l'amministratore per assistenza",
    ],
  }),

  system: (
    message: string,
    technicalDetails?: string
  ): Omit<BusinessError, "id" | "timestamp"> => ({
    type: "system",
    severity: "critical",
    title: "Errore di sistema",
    message,
    details: technicalDetails,
    suggestions: [
      "Ricarica la pagina per ripristinare lo stato",
      "Attendi qualche minuto e riprova",
      "Se il problema persiste, contatta il supporto tecnico",
    ],
  }),
};
