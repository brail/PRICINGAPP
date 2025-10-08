/**
 * Hook per gestione errori e retry mechanisms
 */

import React, { useState, useCallback, useRef } from "react";

interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRetry?: (attempt: number) => void;
}

interface UseErrorHandlerReturn {
  error: Error | null;
  isLoading: boolean;
  retryCount: number;
  execute: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  clearError: () => void;
  isRetrying: boolean;
}

export const useErrorHandler = (
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn => {
  const { maxRetries = 3, retryDelay = 1000, onError, onRetry } = options;

  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const execute = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn();
        setRetryCount(0);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Errore sconosciuto");
        setError(error);
        onError?.(error);

        // Retry logic
        if (retryCount < maxRetries) {
          setIsRetrying(true);
          onRetry?.(retryCount + 1);

          return new Promise((resolve) => {
            timeoutRef.current = setTimeout(async () => {
              setRetryCount((prev) => prev + 1);
              setIsRetrying(false);
              const retryResult = await execute(asyncFn);
              resolve(retryResult);
            }, retryDelay);
          });
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [retryCount, maxRetries, retryDelay, onError, onRetry]
  );

  return {
    error,
    isLoading,
    retryCount,
    execute,
    clearError,
    isRetrying,
  };
};

/**
 * Hook per gestione errori di rete
 */
export const useNetworkErrorHandler = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState<Error | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setNetworkError(null);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setNetworkError(new Error("Connessione internet persa"));
  }, []);

  // Listener per eventi di rete
  React.useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    networkError,
    isOffline: !isOnline,
  };
};

/**
 * Hook per debounce di funzioni
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
};

export default useErrorHandler;
