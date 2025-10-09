import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import CustomButton from "../CustomButton";
import { Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { pricingApi } from "../../services/api";
import {
  useBusinessErrorHandler,
  createBusinessError,
} from "../../hooks/useBusinessErrorHandler";
import ErrorListHandler from "../ErrorListHandler";
import { useNotification } from "../../contexts/NotificationContext";

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
  const { addError, clearErrors, errors, removeError } =
    useBusinessErrorHandler();
  const { showSuccess } = useNotification();
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
  const [success, setSuccess] = useState<string | null>(null);

  const isAdminChangingOtherUser = userId !== undefined;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearErrors();
    setSuccess(null);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!isAdminChangingOtherUser && !formData.currentPassword) {
      addError(
        createBusinessError.validation(
          "La password corrente è obbligatoria per motivi di sicurezza."
        )
      );
      return false;
    }
    if (!formData.newPassword) {
      addError(
        createBusinessError.validation(
          "La nuova password è obbligatoria per completare l'operazione."
        )
      );
      return false;
    }
    if (formData.newPassword.length < 6) {
      addError(
        createBusinessError.validation(
          "La nuova password deve essere di almeno 6 caratteri per motivi di sicurezza."
        )
      );
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      addError(
        createBusinessError.validation(
          "Le password inserite non coincidono. Verifica e riprova."
        )
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      clearErrors();
      setSuccess(null);

      if (isAdminChangingOtherUser) {
        // Admin che cambia la password di un altro utente
        await pricingApi.changeUserPassword(
          userId,
          formData.newPassword,
          formData.confirmPassword
        );
        setSuccess("Password aggiornata con successo");
        showSuccess(
          "Password aggiornata",
          `La password per ${username} è stata aggiornata con successo.`
        );
      } else {
        // Utente che cambia la propria password
        await pricingApi.changePassword(
          formData.currentPassword,
          formData.newPassword,
          formData.confirmPassword
        );
        setSuccess("Password aggiornata con successo");
        showSuccess(
          "Password aggiornata",
          "La tua password è stata aggiornata con successo."
        );
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
      addError(
        createBusinessError.network(
          "Impossibile aggiornare la password. Verifica i dati inseriti e riprova."
        )
      );
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
      clearErrors();
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
          <ErrorListHandler errors={errors} onDismiss={removeError} />

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
                  <CustomButton
                    size="sm"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                  </CustomButton>
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
                <CustomButton
                  size="sm"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                </CustomButton>
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
                <CustomButton
                  size="sm"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                </CustomButton>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <CustomButton onClick={handleClose} disabled={loading}>
          Annulla
        </CustomButton>
        <CustomButton onClick={handleSubmit} variant="primary" disabled={loading}>
          {loading ? "Aggiornamento..." : "Aggiorna Password"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
