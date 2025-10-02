import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography } from '@mui/material';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Calculator from "./components/Calculator";
import Settings from "./components/Settings";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import UserDashboard from "./components/auth/UserDashboard";
import UserManagement from "./components/auth/UserManagement";
import AuthenticatedApp from "./components/auth/AuthenticatedApp";
import "./App.css";

// Tema Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Componente per la gestione dell'autenticazione
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Typography variant="h6" color="white">
          Caricamento...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return <AuthenticatedApp />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
