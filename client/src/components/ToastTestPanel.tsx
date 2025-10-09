/**
 * Pricing Calculator v0.2 - Toast Test Panel
 * Componente per testare le notifiche toast
 */

import React from "react";
import { Box, Typography, Paper, Stack, Divider } from "@mui/material";
import CustomButton from "./CustomButton";
import { useNotification } from "../contexts/NotificationContext";

const ToastTestPanel: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, clearAll } =
    useNotification();

  console.log("🧪 ToastTestPanel - Hook caricato:", {
    showSuccess: typeof showSuccess,
    showError: typeof showError,
    showWarning: typeof showWarning,
    showInfo: typeof showInfo,
    clearAll: typeof clearAll,
  });

  const handleSuccess = () => {
    console.log("🔔 Test Success Toast - Inizio");
    showSuccess(
      "Operazione completata",
      "Il calcolo è stato eseguito con successo!",
      {
        duration: 3000,
        action: {
          label: "Visualizza",
          onClick: () => console.log("Visualizza dettagli"),
        },
      }
    );
    console.log("🔔 Test Success Toast - Completato");
  };

  const handleError = () => {
    showError(
      "Errore di calcolo",
      "Impossibile completare l'operazione richiesta",
      {
        duration: 6000,
        persistent: true,
        action: {
          label: "Riprova",
          onClick: () => console.log("Riprova operazione"),
        },
      }
    );
  };

  const handleWarning = () => {
    showWarning("Attenzione", "I parametri potrebbero non essere ottimali", {
      duration: 5000,
    });
  };

  const handleInfo = () => {
    showInfo("Informazione", "Nuova versione disponibile con miglioramenti", {
      duration: 4000,
      action: {
        label: "Aggiorna",
        onClick: () => console.log("Avvia aggiornamento"),
      },
    });
  };

  const handleMultiple = () => {
    showSuccess("Prima notifica", "Questa è la prima notifica");
    setTimeout(
      () => showWarning("Seconda notifica", "Questa è la seconda"),
      500
    );
    setTimeout(() => showInfo("Terza notifica", "Questa è la terza"), 1000);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        m: 2,
        maxWidth: 600,
        mx: "auto",
        mt: 4,
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        🧪 Test Panel - Toast Notifications
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Test Singoli
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <CustomButton
              variant="success"
              onClick={handleSuccess}
            >
              ✅ Success Toast
            </CustomButton>
            <CustomButton
              variant="danger"
              onClick={handleError}
            >
              ❌ Error Toast
            </CustomButton>
            <CustomButton
              variant="warning"
              onClick={handleWarning}
            >
              ⚠️ Warning Toast
            </CustomButton>
            <CustomButton
              variant="info"
              onClick={handleInfo}
            >
              ℹ️ Info Toast
            </CustomButton>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" gutterBottom>
            Test Multipli
          </Typography>
          <Stack direction="row" spacing={2}>
            <CustomButton variant="outline" onClick={handleMultiple}>
              🔄 Multiple Toasts
            </CustomButton>
            <CustomButton
              variant="secondary"
              onClick={clearAll}
            >
              🗑️ Clear All
            </CustomButton>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="body2" color="text.secondary">
            <strong>Istruzioni:</strong>
            <br />
            • Clicca sui pulsanti per testare diversi tipi di notifiche
            <br />
            • Le notifiche appaiono in basso a destra
            <br />
            • Success: 3 secondi, Error: 6 secondi, Warning: 5 secondi, Info: 4
            secondi
            <br />
            • Alcune notifiche hanno azioni cliccabili
            <br />
            • "Multiple Toasts" mostra 3 notifiche in sequenza
            <br />• "Clear All" rimuove tutte le notifiche attive
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ToastTestPanel;
