import React from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export interface BusinessError {
  id: string;
  type: "validation" | "calculation" | "network" | "business" | "system";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  details?: string;
  suggestions?: string[];
  context?: Record<string, any>;
  actions?: {
    label: string;
    action: () => void;
    variant?: "contained" | "outlined" | "text";
  }[];
  timestamp: Date;
}

interface CompactErrorHandlerProps {
  error: BusinessError;
  onDismiss?: (id: string) => void;
  onRetry?: () => void;
}

const CompactErrorHandler: React.FC<CompactErrorHandlerProps> = ({
  error,
  onDismiss,
  onRetry,
}) => {
  if (!error) return null;

  const getSeverityColor = (severity: BusinessError["severity"]) => {
    switch (severity) {
      case "critical":
        return { bg: "#ffebee", border: "#f44336", text: "#d32f2f" };
      case "high":
        return { bg: "#fff3e0", border: "#ff9800", text: "#f57c00" };
      case "medium":
        return { bg: "#e3f2fd", border: "#2196f3", text: "#1976d2" };
      case "low":
        return { bg: "#e8f5e8", border: "#4caf50", text: "#388e3c" };
      default:
        return { bg: "#f5f5f5", border: "#9e9e9e", text: "#616161" };
    }
  };

  const getTypeLabel = (type: BusinessError["type"]) => {
    switch (type) {
      case "validation":
        return "Validazione";
      case "calculation":
        return "Calcolo";
      case "network":
        return "Rete";
      case "business":
        return "Business";
      case "system":
        return "Sistema";
      default:
        return "Errore";
    }
  };

  const colors = getSeverityColor(error.severity);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1,
        p: 1,
        borderRadius: 1,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        animation: "fadeIn 0.2s ease-out",
        "@keyframes fadeIn": {
          "0%": { opacity: 0, transform: "translateY(-3px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                fontSize: "0.8rem",
                color: colors.text,
                flex: 1,
                minWidth: 0,
              }}
            >
              {error.title}
            </Typography>
            <Chip
              label={getTypeLabel(error.type)}
              size="small"
              sx={{
                fontSize: "0.65rem",
                height: "16px",
                backgroundColor: "rgba(255,255,255,0.8)",
                border: `1px solid ${colors.border}`,
              }}
            />
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontSize: "0.75rem",
              mb: error.suggestions?.length ? 0.5 : 0,
              color: colors.text,
              lineHeight: 1.3,
            }}
          >
            {error.message}
          </Typography>

          {error.suggestions && error.suggestions.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              {error.suggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  size="small"
                  sx={{
                    fontSize: "0.65rem",
                    height: "16px",
                    backgroundColor: "rgba(255,255,255,0.9)",
                    border: `1px solid ${colors.border}`,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,1)",
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            flexShrink: 0,
          }}
        >
          {error.actions?.map((action, index) => (
            <Button
              key={index}
              size="small"
              variant="outlined"
              onClick={action.action}
              sx={{
                fontSize: "0.65rem",
                padding: "1px 4px",
                height: "18px",
                minWidth: "auto",
                backgroundColor: "rgba(255,255,255,0.9)",
                border: `1px solid ${colors.border}`,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,1)",
                },
              }}
            >
              {action.label}
            </Button>
          ))}
          {onRetry && (
            <Button
              size="small"
              variant="outlined"
              onClick={onRetry}
              sx={{
                fontSize: "0.65rem",
                padding: "1px 4px",
                height: "18px",
                minWidth: "auto",
                backgroundColor: "rgba(255,255,255,0.9)",
                border: `1px solid ${colors.border}`,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,1)",
                },
              }}
            >
              Riprova
            </Button>
          )}
          {onDismiss && (
            <IconButton
              size="small"
              onClick={() => onDismiss(error.id)}
              sx={{
                width: "18px",
                height: "18px",
                backgroundColor: "rgba(255,255,255,0.9)",
                border: `1px solid ${colors.border}`,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,1)",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: "0.7rem" }} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default CompactErrorHandler;
