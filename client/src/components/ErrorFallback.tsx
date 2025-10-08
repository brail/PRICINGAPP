/**
 * Componenti di fallback per stati di errore specifici
 */

import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import {
  Refresh,
  WifiOff,
  CloudOff,
  Error as ErrorIcon,
  Warning,
} from "@mui/icons-material";

interface ErrorFallbackProps {
  error?: Error;
  retry?: () => void;
  isLoading?: boolean;
  type?: "network" | "api" | "general" | "loading";
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  retry,
  isLoading = false,
  type = "general",
}) => {
  if (isLoading) {
    return <LoadingFallback />;
  }

  const getErrorConfig = () => {
    switch (type) {
      case "network":
        return {
          icon: <WifiOff sx={{ fontSize: 48, color: "warning.main" }} />,
          title: "Connessione persa",
          message: "Verifica la tua connessione internet e riprova.",
          severity: "warning" as const,
        };
      case "api":
        return {
          icon: <CloudOff sx={{ fontSize: 48, color: "error.main" }} />,
          title: "Errore del server",
          message: "Il server non risponde. Riprova tra qualche momento.",
          severity: "error" as const,
        };
      default:
        return {
          icon: <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />,
          title: "Errore imprevisto",
          message: "Si è verificato un errore. Riprova o ricarica la pagina.",
          severity: "error" as const,
        };
    }
  };

  const config = getErrorConfig();

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        textAlign: "center",
        bgcolor: "grey.50",
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      <Box sx={{ mb: 2 }}>{config.icon}</Box>

      <Typography variant="h6" gutterBottom color="text.primary">
        {config.title}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        {config.message}
      </Typography>

      {error && (
        <Alert severity={config.severity} sx={{ mb: 2, textAlign: "left" }}>
          <Typography variant="caption">{error.message}</Typography>
        </Alert>
      )}

      {retry && (
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={retry}
          size="small"
        >
          Riprova
        </Button>
      )}
    </Paper>
  );
};

export const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      p: 3,
    }}
  >
    <CircularProgress size={40} sx={{ mb: 2 }} />
    <Typography variant="body2" color="text.secondary">
      Caricamento...
    </Typography>
  </Box>
);

export const SkeletonFallback: React.FC<{ lines?: number }> = ({
  lines = 3,
}) => (
  <Box sx={{ p: 2 }}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="rectangular"
        height={20}
        sx={{ mb: 1, borderRadius: 1 }}
        animation="wave"
      />
    ))}
  </Box>
);

export const EmptyStateFallback: React.FC<{
  title: string;
  message: string;
  action?: React.ReactNode;
}> = ({ title, message, action }) => (
  <Paper
    elevation={0}
    sx={{
      p: 4,
      textAlign: "center",
      bgcolor: "grey.50",
      border: "1px dashed",
      borderColor: "grey.300",
    }}
  >
    <Typography variant="h6" gutterBottom color="text.secondary">
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      {message}
    </Typography>
    {action}
  </Paper>
);

export default ErrorFallback;
