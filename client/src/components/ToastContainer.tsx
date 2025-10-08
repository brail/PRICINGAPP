/**
 * Pricing Calculator v0.2 - Toast Container
 * Container globale per le notifiche toast
 */

import React from "react";
import { Box } from "@mui/material";
import { useNotification } from "../contexts/NotificationContext";
import ToastNotificationComponent from "./ToastNotification";

const ToastContainer: React.FC = () => {
  const { notifications, removeToast } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        maxWidth: "100vw",
        pointerEvents: "none",
        "& > *": {
          pointerEvents: "auto",
        },
      }}
    >
      {notifications.map((notification) => (
        <ToastNotificationComponent
          key={notification.id}
          notification={notification}
          onClose={removeToast}
        />
      ))}
    </Box>
  );
};

export default ToastContainer;
