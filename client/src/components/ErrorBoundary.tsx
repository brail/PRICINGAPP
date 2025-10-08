/**
 * Error Boundary per gestione errori React
 * Cattura errori JavaScript in qualsiasi parte dell'albero dei componenti
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Paper, Alert } from "@mui/material";
import { Refresh, BugReport } from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Aggiorna lo state per mostrare l'UI di fallback
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log dell'errore
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In un'app reale, qui invieresti l'errore a un servizio di logging
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // UI di fallback personalizzata
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            p: 3,
            bgcolor: "grey.50",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: "100%",
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: 3 }}>
              <BugReport sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
              <Typography variant="h4" gutterBottom color="error">
                Oops! Qualcosa è andato storto
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Si è verificato un errore imprevisto nell'applicazione. Non
                preoccuparti, i tuoi dati sono al sicuro.
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="subtitle2" gutterBottom>
                Dettagli errore:
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{ fontSize: "0.75rem" }}
              >
                {this.state.error?.message || "Errore sconosciuto"}
              </Typography>
            </Alert>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
                sx={{ minWidth: 120 }}
              >
                Riprova
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReload}
                sx={{ minWidth: 120 }}
              >
                Ricarica Pagina
              </Button>
            </Box>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <Box sx={{ mt: 3, textAlign: "left" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Stack Trace (solo in sviluppo):
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "grey.100",
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{ fontSize: "0.7rem", whiteSpace: "pre-wrap" }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
