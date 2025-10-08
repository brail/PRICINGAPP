/**
 * Pricing Calculator v0.2 - Toast Notification Hook
 * Hook globale per gestire le notifiche toast
 */

import { useState, useCallback } from "react";
import { ToastNotification } from "../components/ToastNotification";

interface UseToastNotificationReturn {
  notifications: ToastNotification[];
  showToast: (notification: Omit<ToastNotification, "id">) => void;
  showSuccess: (
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ) => void;
  showError: (
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ) => void;
  showWarning: (
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ) => void;
  showInfo: (
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastIdCounter = 0;

export const useToastNotification = (): UseToastNotificationReturn => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const showToast = useCallback(
    (notification: Omit<ToastNotification, "id">) => {
      const id = `toast_${++toastIdCounter}_${Date.now()}`;
      const newNotification: ToastNotification = {
        ...notification,
        id,
        duration: notification.duration || 4000,
      };

      setNotifications((prev) => {
        // Limita a 5 toast contemporanei
        const limited = prev.slice(-4);
        return [...limited, newNotification];
      });

      // Auto-remove dopo la durata specificata (se non persistent)
      if (!notification.persistent) {
        setTimeout(() => {
          removeToast(id);
        }, notification.duration || 4000);
      }
    },
    []
  );

  const showSuccess = useCallback(
    (
      title: string,
      message: string,
      options: Partial<ToastNotification> = {}
    ) => {
      showToast({
        type: "success",
        title,
        message,
        duration: 3000,
        ...options,
      });
    },
    [showToast]
  );

  const showError = useCallback(
    (
      title: string,
      message: string,
      options: Partial<ToastNotification> = {}
    ) => {
      showToast({
        type: "error",
        title,
        message,
        duration: 6000,
        ...options,
      });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (
      title: string,
      message: string,
      options: Partial<ToastNotification> = {}
    ) => {
      showToast({
        type: "warning",
        title,
        message,
        duration: 5000,
        ...options,
      });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (
      title: string,
      message: string,
      options: Partial<ToastNotification> = {}
    ) => {
      showToast({
        type: "info",
        title,
        message,
        duration: 4000,
        ...options,
      });
    },
    [showToast]
  );

  const removeToast = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAll,
  };
};
