/**
 * Pricing Calculator v0.2 - Progress Tracker Hook
 * Hook per tracciare il progresso di operazioni lunghe con ETA
 */

import { useState, useCallback, useRef } from "react";

interface ProgressTrackerOptions {
  total: number;
  onComplete?: () => void;
  onProgress?: (progress: number, eta: number) => void;
  updateInterval?: number;
}

interface ProgressTrackerReturn {
  progress: number;
  percentage: number;
  eta: number;
  isComplete: boolean;
  isRunning: boolean;
  start: () => void;
  update: (current: number) => void;
  complete: () => void;
  reset: () => void;
  getFormattedETA: () => string;
}

export const useProgressTracker = (
  options: ProgressTrackerOptions
): ProgressTrackerReturn => {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [eta, setEta] = useState(0);

  const startTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateETA = useCallback((current: number, total: number): number => {
    if (current === 0) return 0;

    const elapsed = Date.now() - startTimeRef.current;
    const rate = current / elapsed; // items per millisecond
    const remaining = total - current;

    return remaining / rate; // milliseconds
  }, []);

  const formatETA = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return "Completato";

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  const start = useCallback(() => {
    setProgress(0);
    setIsRunning(true);
    setIsComplete(false);
    setEta(0);
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();
  }, []);

  const update = useCallback(
    (current: number) => {
      if (!isRunning) return;

      setProgress(current);
      const newEta = calculateETA(current, options.total);
      setEta(newEta);

      const percentage = Math.min(100, (current / options.total) * 100);

      if (options.onProgress) {
        options.onProgress(percentage, newEta);
      }

      lastUpdateRef.current = Date.now();
    },
    [isRunning, options.total, calculateETA, options.onProgress]
  );

  const complete = useCallback(() => {
    setIsRunning(false);
    setIsComplete(true);
    setProgress(options.total);
    setEta(0);

    if (options.onComplete) {
      options.onComplete();
    }
  }, [options.total, options.onComplete]);

  const reset = useCallback(() => {
    setProgress(0);
    setIsRunning(false);
    setIsComplete(false);
    setEta(0);
    startTimeRef.current = 0;
    lastUpdateRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const getFormattedETA = useCallback(() => {
    return formatETA(eta);
  }, [eta, formatETA]);

  return {
    progress,
    percentage: Math.min(100, (progress / options.total) * 100),
    eta,
    isComplete,
    isRunning,
    start,
    update,
    complete,
    reset,
    getFormattedETA,
  };
};
