/**
 * Hook per supporto offline base
 */

import { useState, useEffect, useCallback } from "react";

interface UseOfflineSupportReturn {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineTime: Date | null;
  retryConnection: () => void;
}

export const useOfflineSupport = (): UseOfflineSupportReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineTime(new Date());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  const retryConnection = useCallback(() => {
    // Prova a fare una richiesta di test per verificare la connessione
    fetch("/api/health", {
      method: "HEAD",
      cache: "no-cache",
      mode: "no-cors",
    })
      .then(() => {
        setIsOnline(true);
        setLastOnlineTime(new Date());
      })
      .catch(() => {
        // Connessione ancora non disponibile
        console.log("Connessione non ancora disponibile");
      });
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineTime,
    retryConnection,
  };
};

export default useOfflineSupport;
