import React from "react";
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton,
  Fade,
  Chip,
} from "@mui/material";
import { CloudSync } from "@mui/icons-material";

interface LoadingStatesProps {
  type?: "spinner" | "skeleton" | "progress" | "inline" | "button";
  message?: string;
  progress?: number;
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "success" | "error";
  fullScreen?: boolean;
  inline?: boolean;
}

/**
 * Componente per stati di caricamento professionali
 * Segue le best practices UX/UI per loading states
 */
export const LoadingStates: React.FC<LoadingStatesProps> = ({
  type = "spinner",
  message,
  progress,
  size = "medium",
  color = "primary",
  fullScreen = false,
  inline = false,
}) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return 20;
      case "large":
        return 60;
      default:
        return 40;
    }
  };

  const getMessage = () => {
    if (message) return message;

    switch (type) {
      case "skeleton":
        return "Preparando contenuto...";
      case "progress":
        return "Elaborazione in corso...";
      case "inline":
        return "Caricamento...";
      default:
        return "Caricamento...";
    }
  };

  const renderSpinner = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        ...(fullScreen && {
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(255, 255, 255, 0.9)",
          zIndex: 9999,
          justifyContent: "center",
        }),
        ...(inline && {
          flexDirection: "row",
          gap: 1,
        }),
      }}
    >
      <CircularProgress
        size={getSize()}
        color={color}
        thickness={4}
        sx={{
          animation: "pulse 2s ease-in-out infinite",
          "@keyframes pulse": {
            "0%": { opacity: 1 },
            "50%": { opacity: 0.5 },
            "100%": { opacity: 1 },
          },
        }}
      />
      <Typography
        variant={inline ? "caption" : "body2"}
        color="text.secondary"
        sx={{
          fontWeight: 500,
          textAlign: "center",
          maxWidth: inline ? "none" : 200,
        }}
      >
        {getMessage()}
      </Typography>
    </Box>
  );

  const renderProgress = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "100%",
        ...(fullScreen && {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          zIndex: 9999,
          minWidth: 300,
        }),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CloudSync color={color} />
        <Typography variant="body1" fontWeight={500}>
          {getMessage()}
        </Typography>
      </Box>

      <LinearProgress
        variant={progress !== undefined ? "determinate" : "indeterminate"}
        value={progress}
        color={color}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: "grey.200",
          "& .MuiLinearProgress-bar": {
            borderRadius: 3,
          },
        }}
      />

      {progress !== undefined && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ width: "100%" }}>
      <Skeleton
        variant="rectangular"
        height={60}
        sx={{ mb: 2, borderRadius: 1 }}
        animation="wave"
      />
      <Skeleton
        variant="text"
        width="80%"
        height={24}
        sx={{ mb: 1 }}
        animation="wave"
      />
      <Skeleton
        variant="text"
        width="60%"
        height={20}
        sx={{ mb: 2 }}
        animation="wave"
      />
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Skeleton
          variant="rectangular"
          width={80}
          height={32}
          animation="wave"
        />
        <Skeleton
          variant="rectangular"
          width={100}
          height={32}
          animation="wave"
        />
      </Box>
    </Box>
  );

  const renderInline = () => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 0.5,
      }}
    >
      <CircularProgress size={16} color={color} thickness={4} />
      <Typography variant="caption" color="text.secondary">
        {getMessage()}
      </Typography>
    </Box>
  );

  const renderButton = () => (
    <Chip
      icon={<CircularProgress size={16} color="inherit" />}
      label={getMessage()}
      color={color}
      variant="outlined"
      size="small"
      sx={{
        "& .MuiChip-icon": {
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
        },
      }}
    />
  );

  const renderContent = () => {
    switch (type) {
      case "skeleton":
        return renderSkeleton();
      case "progress":
        return renderProgress();
      case "inline":
        return renderInline();
      case "button":
        return renderButton();
      default:
        return renderSpinner();
    }
  };

  return (
    <Fade in timeout={300}>
      {renderContent()}
    </Fade>
  );
};

/**
 * Componente per skeleton loading specifico per parametri
 */
export const ParameterSkeleton: React.FC = () => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
    <Box
      sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}
    >
      <Skeleton variant="rectangular" height={56} animation="wave" />
      <Skeleton variant="rectangular" height={56} animation="wave" />
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
      <Skeleton variant="rectangular" height={40} animation="wave" />
      <Skeleton variant="rectangular" height={40} animation="wave" />
      <Skeleton variant="rectangular" height={40} animation="wave" />
    </Box>
  </Box>
);

/**
 * Componente per skeleton loading specifico per calcoli
 */
export const CalculationSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="40%" height={28} sx={{ mb: 3 }} />
    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
      <Skeleton
        variant="rectangular"
        width={120}
        height={48}
        animation="wave"
      />
      <Skeleton
        variant="rectangular"
        width={120}
        height={48}
        animation="wave"
      />
    </Box>
    <Skeleton variant="rectangular" height={200} animation="wave" />
  </Box>
);

/**
 * Hook per gestire stati di loading
 */
export const useLoadingState = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");
  const [progress, setProgress] = React.useState<number | undefined>(undefined);

  const startLoading = (message: string, progressValue?: number) => {
    setLoadingMessage(message);
    setProgress(progressValue);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setLoadingMessage("");
    setProgress(undefined);
  };

  const updateProgress = (value: number) => {
    setProgress(value);
  };

  const updateMessage = (message: string) => {
    setLoadingMessage(message);
  };

  return {
    isLoading,
    loadingMessage,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
  };
};

export default LoadingStates;
