/**
 * Componente per indicare lo stato offline
 */

import React from "react";
import {
  Box,
  Alert,
  Typography,
  Slide,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CustomButton from "./CustomButton";
import { WifiOff, Refresh } from "@mui/icons-material";
import { useOfflineSupport } from "../hooks/useOfflineSupport";

const OfflineIndicator: React.FC = () => {
  const { isOffline, lastOnlineTime, retryConnection } = useOfflineSupport();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!isOffline) return null;

  return (
    <Slide direction="down" in={isOffline} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          p: isMobile ? 1 : 2,
        }}
      >
        <Alert
          severity="warning"
          icon={<WifiOff />}
          action={
            <CustomButton variant="outline" size="sm" onClick={retryConnection}>
              <Refresh />
              Riprova
            </CustomButton>
          }
          sx={{
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Connessione persa
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lastOnlineTime
                ? `Ultima connessione: ${lastOnlineTime.toLocaleTimeString()}`
                : "Verifica la tua connessione internet"}
            </Typography>
          </Box>
        </Alert>
      </Box>
    </Slide>
  );
};

export default OfflineIndicator;
