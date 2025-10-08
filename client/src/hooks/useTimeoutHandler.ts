/**
 * Pricing Calculator v0.2 - Timeout Handler Hook
 * Hook per gestire timeout delle operazioni con feedback
 */

import { useState, useCallback, useRef } from "react";

interface TimeoutHandlerOptions {
  timeout: number;
  onTimeout?: () => void;
  onSuccess?: () => void;
  warningThreshold?: number; // Percentuale del timeout per mostrare warning
}

interface TimeoutHandlerReturn {
  isTimedOut: boolean;
  isWarning: boolean;
  timeRemaining: number;
  startTimeout: () => void;
  clearTimeout: () => void;
  reset: () => void;
  withTimeout: <T>(operation: Promise<T>) => Promise<T>;
}

export const useTimeoutHandler = (options: TimeoutHandlerOptions): TimeoutHandlerReturn => {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startTimeout = useCallback(() => {
    setIsTimedOut(false);
    setIsWarning(false);
    setTimeRemaining(options.timeout);
    startTimeRef.current = Date.now();
    
    // Timeout principale
    timeoutRef.current = setTimeout(() => {
      setIsTimedOut(true);
      if (options.onTimeout) {
        options.onTimeout();
      }
    }, options.timeout);
    
    // Warning timeout (se specificato)
    if (options.warningThreshold) {
      const warningTime = options.timeout * (options.warningThreshold / 100);
      warningTimeoutRef.current = setTimeout(() => {
        setIsWarning(true);
      }, warningTime);
    }
    
    // Aggiorna tempo rimanente ogni secondo
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, options.timeout - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setIsTimedOut(true);
        if (options.onTimeout) {
          options.onTimeout();
        }
      }
    }, 1000);
  }, [options]);

  const clearTimeoutHandler = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsTimedOut(false);
    setIsWarning(false);
    setTimeRemaining(0);
  }, []);

  const reset = useCallback(() => {
    clearTimeoutHandler();
    setIsTimedOut(false);
    setIsWarning(false);
    setTimeRemaining(0);
  }, [clearTimeoutHandler]);

  const withTimeout = useCallback(async <T>(operation: Promise<T>): Promise<T> => {
    startTimeout();
    
    try {
      const result = await operation;
      clearTimeoutHandler();
      if (options.onSuccess) {
        options.onSuccess();
      }
      return result;
    } catch (error) {
      clearTimeoutHandler();
      throw error;
    }
  }, [startTimeout, clearTimeoutHandler, options]);

  return {
    isTimedOut,
    isWarning,
    timeRemaining,
    startTimeout,
    clearTimeout: clearTimeoutHandler,
    reset,
    withTimeout,
  };
};
