/**
 * Pricing Calculator v0.2 - Notification Context
 * Context globale per le notifiche toast e feedback
 */

import React, { createContext, useContext, ReactNode } from "react";
import { useToastNotification } from "../hooks/useToastNotification";
import { ToastNotification } from "../components/ToastNotification";

interface NotificationContextType {
  showSuccess: (title: string, message: string, options?: Partial<ToastNotification>) => void;
  showError: (title: string, message: string, options?: Partial<ToastNotification>) => void;
  showWarning: (title: string, message: string, options?: Partial<ToastNotification>) => void;
  showInfo: (title: string, message: string, options?: Partial<ToastNotification>) => void;
  showToast: (notification: Omit<ToastNotification, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const toastNotification = useToastNotification();

  const contextValue: NotificationContextType = {
    showSuccess: toastNotification.showSuccess,
    showError: toastNotification.showError,
    showWarning: toastNotification.showWarning,
    showInfo: toastNotification.showInfo,
    showToast: toastNotification.showToast,
    removeToast: toastNotification.removeToast,
    clearAll: toastNotification.clearAll,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
