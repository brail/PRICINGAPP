/**
 * Pricing Calculator v0.3.0 - Login Form Component
 * Form di login multi-provider con Material-UI
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
import CustomButton from "../CustomButton";
import ProviderButton from "./ProviderButton";
import { Visibility, VisibilityOff, Person, Lock } from "@mui/icons-material";
import { useAuth, AuthProvider } from "../../contexts/AuthContext";
import Logo from "../Logo";

interface LoginFormProps {}

const LoginForm: React.FC<LoginFormProps> = () => {
  const {
    login,
    loginWithLDAP,
    loginWithGoogle,
    handleOAuthCallback,
    isLoading,
    error,
    clearError,
    getAvailableProviders,
  } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [availableProviders, setAvailableProviders] = useState<AuthProvider[]>(
    []
  );
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Carica provider disponibili all'avvio
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providers = await getAvailableProviders();
        setAvailableProviders(providers);
        // Non selezionare automaticamente un provider
      } catch (error) {
        console.error("Errore nel caricamento dei provider:", error);
      }
    };

    loadProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Rimuovo getAvailableProviders dalle dipendenze per evitare loop infinito

  // Gestione callback OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens = urlParams.get("tokens");
    const error = urlParams.get("error");

    if (tokens) {
      // Gestisci callback OAuth
      handleOAuthCallback(tokens);
      // Pulisci URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      // Gestisci errori OAuth
      const errorMessages: Record<string, string> = {
        oauth_error: "Errore durante l'autenticazione OAuth",
        oauth_failed: "Autenticazione OAuth fallita",
      };
      setValidationErrors({
        general: errorMessages[error] || "Errore di autenticazione",
      });
      // Pulisci URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Pulisci errori di validazione quando l'utente inizia a digitare
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: "" }));
      }

      // Pulisci errori di autenticazione
      if (error) {
        clearError();
      }
    };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = "Username è obbligatorio";
    }

    if (!formData.password) {
      errors.password = "Password è obbligatoria";
    } else if (formData.password.length < 6) {
      errors.password = "Password deve essere di almeno 6 caratteri";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      switch (selectedProvider) {
        case "local":
          await login(formData.username, formData.password);
          break;
        case "ldap":
          await loginWithLDAP(formData.username, formData.password);
          break;
        default:
          throw new Error("Provider non supportato");
      }
    } catch (error) {
      // L'errore è gestito dal context
      console.error("Errore nel login:", error);
    }
  };

  const handleProviderClick = (providerId: string) => {
    if (providerId === "google") {
      loginWithGoogle();
    } else {
      setSelectedProvider(providerId);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#F0F0F0",
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E0E0E0",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Logo variant="black" size="large" />
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              color="primary"
              sx={{
                mt: 2,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 500,
              }}
            >
              PRICING CALCULATOR
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Accedi al tuo account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {validationErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationErrors.general}
            </Alert>
          )}

          {/* Provider Selection */}
          {availableProviders.length > 0 && (
            <Box sx={{ mb: 3 }}>
              {availableProviders.map((provider) => (
                <ProviderButton
                  key={provider.id}
                  provider={provider}
                  onClick={() => handleProviderClick(provider.id)}
                  disabled={isLoading}
                />
              ))}
            </Box>
          )}

          {/* Divider */}
          {selectedProvider &&
            availableProviders.find((p) => p.id === selectedProvider)
              ?.requiresPassword && (
              <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
                <Divider sx={{ flexGrow: 1 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ px: 2 }}
                >
                  oppure
                </Typography>
                <Divider sx={{ flexGrow: 1 }} />
              </Box>
            )}

          {/* Form per provider che richiedono password */}
          {selectedProvider &&
            availableProviders.find((p) => p.id === selectedProvider)
              ?.requiresPassword && (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChange("username")}
                  error={!!validationErrors.username}
                  helperText={validationErrors.username}
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  disabled={isLoading}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={isLoading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <CustomButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                  className="full-width"
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Accedi"
                  )}
                </CustomButton>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    opacity: 0.7,
                  }}
                >
                  v0.3.0
                </Typography>
              </form>
            )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;
