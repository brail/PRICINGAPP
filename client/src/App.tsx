import React, { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, CircularProgress } from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ParameterProvider } from "./contexts/ParameterContext";
import { CalculationProvider } from "./contexts/CalculationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingFallback } from "./components/ErrorFallback";
import OfflineIndicator from "./components/OfflineIndicator";
import "./App.css";

// Lazy loading dei componenti
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const AuthenticatedApp = lazy(
  () => import("./components/auth/AuthenticatedApp")
);

// Tema Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

// Componente per la gestione dell'autenticazione
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect automatico alla calcolatrice solo dopo il primo login
  // Non fare redirect se l'utente è già su una pagina autenticata
  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasRedirected) {
      // Solo se l'utente è sulla pagina di login o sulla root
      if (location.pathname === "/" || location.pathname === "/login") {
        setHasRedirected(true);
        navigate("/");
      } else {
        // Se è già su una pagina autenticata, non fare redirect
        setHasRedirected(true);
      }
    }
  }, [isAuthenticated, isLoading, hasRedirected, navigate, location.pathname]);

  // Reset del flag quando l'utente fa logout
  useEffect(() => {
    if (!isAuthenticated) {
      setHasRedirected(false);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
              background: "#F0F0F0",
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <LoginForm />
      </Suspense>
    );
  }

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <AuthenticatedApp />
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OfflineIndicator />
      <ErrorBoundary>
        <AuthProvider>
          <ParameterProvider>
            <CalculationProvider>
              <AppContent />
            </CalculationProvider>
          </ParameterProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
