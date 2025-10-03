import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { pricingApi } from "../../services/api";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: number; // Se specificato, è per un admin che cambia la password di un altro utente
  username?: string; // Nome utente per il titolo del dialog
  onSuccess?: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
  userId,
  username,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdminChangingOtherUser = userId !== undefined;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!isAdminChangingOtherUser && !formData.currentPassword) {
      setError("La password corrente è obbligatoria");
      return false;
    }
    if (!formData.newPassword) {
      setError("La nuova password è obbligatoria");
      return false;
    }
    if (formData.newPassword.length < 6) {
      setError("La nuova password deve essere di almeno 6 caratteri");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Le password non coincidono");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (isAdminChangingOtherUser) {
        // Admin che cambia la password di un altro utente
        await pricingApi.changeUserPassword(
          userId,
          formData.newPassword,
          formData.confirmPassword
        );
        setSuccess("Password aggiornata con successo");
      } else {
        // Utente che cambia la propria password
        await pricingApi.changePassword(
          formData.currentPassword,
          formData.newPassword,
          formData.confirmPassword
        );
        setSuccess("Password aggiornata con successo");
      }

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Callback di successo
      if (onSuccess) {
        onSuccess();
      }

      // Chiudi dialog dopo 2 secondi
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Errore nel cambio password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Lock color="primary" />
          <Typography variant="h6">
            {isAdminChangingOtherUser
              ? `Cambia Password - ${username || "Utente"}`
              : "Cambia Password"}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {!isAdminChangingOtherUser && (
            <TextField
              fullWidth
              label="Password Corrente"
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) =>
                handleInputChange("currentPassword", e.target.value)
              }
              sx={{ mb: 2 }}
              required
              InputProps={{
                endAdornment: (
                  <Button
                    size="small"
                    onClick={() => togglePasswordVisibility("current")}
                    sx={{ minWidth: "auto", p: 0.5 }}
                  >
                    {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                  </Button>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            label="Nuova Password"
            type={showPasswords.new ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => handleInputChange("newPassword", e.target.value)}
            sx={{ mb: 2 }}
            required
            helperText="Minimo 6 caratteri"
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => togglePasswordVisibility("new")}
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                </Button>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Conferma Nuova Password"
            type={showPasswords.confirm ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            required
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={() => togglePasswordVisibility("confirm")}
                  sx={{ minWidth: "auto", p: 0.5 }}
                >
                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                </Button>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annulla
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
        >
          {loading ? "Aggiornamento..." : "Aggiorna Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
