/**
 * Pricing Calculator v0.2 - Toast Notification System
 * Sistema globale di notifiche toast per feedback rapido
 */

import React, { useState, useEffect } from "react";
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  SlideProps,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
} from "@mui/icons-material";

export interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ToastNotificationProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

// Animazione slide per i toast
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const ToastNotificationComponent: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
}) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle />;
      case "error":
        return <Error />;
      case "warning":
        return <Warning />;
      case "info":
        return <Info />;
      default:
        return <Info />;
    }
  };

  const getSeverity = () => {
    switch (notification.type) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={notification.persistent ? null : notification.duration || 4000}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={{
        mb: 2,
        mr: 2,
      }}
    >
      <Alert
        severity={getSeverity() as any}
        icon={getIcon()}
        onClose={handleClose}
        action={
          notification.action ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="button"
                onClick={notification.action.onClick}
                sx={{
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.75rem",
                }}
              >
                {notification.action.label}
              </Typography>
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{ ml: 1 }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ ml: 1 }}
            >
              <Close fontSize="small" />
            </IconButton>
          )
        }
        sx={{
          minWidth: 300,
          maxWidth: 500,
          "& .MuiAlert-message": {
            width: "100%",
          },
        }}
      >
        <AlertTitle sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
          {notification.title}
        </AlertTitle>
        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
          {notification.message}
        </Typography>
      </Alert>
    </Snackbar>
  );
};

export default ToastNotificationComponent;
