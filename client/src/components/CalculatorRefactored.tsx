/**
 * Calculator Refactored per Pricing Calculator v0.2
 * Componente refactorizzato che usa i nuovi context e hooks
 * MANTIENE LA STESSA UI/UX del componente originale
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import { useCalculation } from "../hooks/useCalculation";
import { useParameterManager } from "../hooks/useParameterManager";
import { CURRENCIES } from "../types";
import "./Calculator.css";

const CalculatorRefactored: React.FC = () => {
  // Hooks per calcoli e parametri
  const {
    calculation,
    purchasePrice,
    retailPrice,
    purchasePriceLocked,
    retailPriceLocked,
    mode,
    loading,
    error,
    showDetails,
    setPurchasePriceWithValidation,
    setRetailPriceWithValidation,
    setPurchasePriceLocked,
    setRetailPriceLocked,
    changeMode,
    executeCalculation,
    clearAll,
    getCalculationResult,
    canCalculate,
    getMargin,
    getFinalPrice,
    formatPrice,
    formatPercentage,
  } = useCalculation();

  const {
    currentParams,
    parameterSets,
    activeParameterSet,
    loading: paramsLoading,
    saving,
    autoSaving,
    loadParameterSet,
  } = useParameterManager();

  // Stato locale per UI
  const [showParameterDetails, setShowParameterDetails] = useState(false);

  // Carica i set di parametri all'avvio
  useEffect(() => {
    // I set di parametri vengono caricati automaticamente dal ParameterContext
  }, []);

  // Gestione cambio modalità
  const handleModeChange = (newMode: "purchase" | "selling" | "margin") => {
    changeMode(newMode);
  };

  // Gestione input prezzo acquisto
  const handlePurchasePriceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setPurchasePriceWithValidation(event.target.value);
    } catch (error) {
      console.error("Errore validazione prezzo acquisto:", error);
    }
  };

  // Gestione input prezzo vendita
  const handleRetailPriceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setRetailPriceWithValidation(event.target.value);
    } catch (error) {
      console.error("Errore validazione prezzo vendita:", error);
    }
  };

  // Gestione caricamento set di parametri
  const handleParameterSetChange = async (setId: number) => {
    try {
      await loadParameterSet(setId);
    } catch (error) {
      console.error("Errore nel caricamento set di parametri:", error);
    }
  };

  // Ottiene il risultato del calcolo
  const result = getCalculationResult();
  const margin = getMargin();
  const finalPrice = getFinalPrice();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Calcolatore Prezzi
      </Typography>

      {/* Selezione modalità */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Modalità di Calcolo
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Button
            variant={mode === "purchase" ? "contained" : "outlined"}
            onClick={() => handleModeChange("purchase")}
            sx={{ flex: "1 1 200px" }}
          >
            Da Vendita ad Acquisto
          </Button>
          <Button
            variant={mode === "selling" ? "contained" : "outlined"}
            onClick={() => handleModeChange("selling")}
            sx={{ flex: "1 1 200px" }}
          >
            Da Acquisto a Vendita
          </Button>
          <Button
            variant={mode === "margin" ? "contained" : "outlined"}
            onClick={() => handleModeChange("margin")}
            sx={{ flex: "1 1 200px" }}
          >
            Calcolo Margine
          </Button>
        </Box>
      </Paper>

      {/* Input prezzi */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Prezzi
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <TextField
            label="Prezzo di Acquisto"
            type="number"
            value={purchasePrice}
            onChange={handlePurchasePriceChange}
            disabled={purchasePriceLocked}
            sx={{ flex: "1 1 300px" }}
            InputProps={{
              endAdornment: (
                <FormControlLabel
                  control={
                    <Switch
                      checked={purchasePriceLocked}
                      onChange={(e) => setPurchasePriceLocked(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Blocca"
                  labelPlacement="start"
                />
              ),
            }}
          />
          <TextField
            label="Prezzo di Vendita"
            type="number"
            value={retailPrice}
            onChange={handleRetailPriceChange}
            disabled={retailPriceLocked}
            sx={{ flex: "1 1 300px" }}
            InputProps={{
              endAdornment: (
                <FormControlLabel
                  control={
                    <Switch
                      checked={retailPriceLocked}
                      onChange={(e) => setRetailPriceLocked(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Blocca"
                  labelPlacement="start"
                />
              ),
            }}
          />
        </Box>

        {/* Pulsanti azione */}
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            onClick={executeCalculation}
            disabled={!canCalculate() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Calcolando..." : "Calcola"}
          </Button>
          <Button variant="outlined" onClick={clearAll}>
            Pulisci
          </Button>
        </Box>
      </Paper>

      {/* Risultati */}
      {result && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Risultato
          </Typography>

          {finalPrice && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h5" color="primary">
                {formatPrice(finalPrice, currentParams.sellingCurrency)}
              </Typography>
            </Box>
          )}

          {margin !== null && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Margine: ${formatPercentage(margin)}`}
                color={
                  margin > 0.2 ? "success" : margin > 0.1 ? "warning" : "error"
                }
                variant="outlined"
              />
            </Box>
          )}

          <Button
            variant="text"
            onClick={() => setShowParameterDetails(!showParameterDetails)}
          >
            {showParameterDetails ? "Nascondi" : "Mostra"} Dettagli
          </Button>

          {showParameterDetails && result && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Dettagli Calcolo
              </Typography>
              {/* Qui andrebbero i dettagli del calcolo */}
            </Box>
          )}
        </Paper>
      )}

      {/* Selezione set di parametri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Set di Parametri
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Seleziona Set di Parametri</InputLabel>
          <Select
            value={activeParameterSet?.id || ""}
            onChange={(e) => handleParameterSetChange(Number(e.target.value))}
            disabled={paramsLoading}
          >
            {parameterSets.map((set) => (
              <MenuItem key={set.id} value={set.id}>
                {set.description} {set.is_default && "(Default)"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Parametri attuali */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Parametri Attuali
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: "1 1 200px" }}
          >
            Quality Control: {currentParams.qualityControlPercent}%
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: "1 1 200px" }}
          >
            Dazio: {currentParams.duty}%
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: "1 1 200px" }}
          >
            Margine: {currentParams.optimalMargin}%
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: "1 1 200px" }}
          >
            Tasso: {currentParams.exchangeRate}
          </Typography>
        </Box>
      </Paper>

      {/* Errori */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Indicatori di stato */}
      {(saving || autoSaving) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {autoSaving ? "Salvataggio automatico..." : "Salvataggio..."}
        </Alert>
      )}
    </Box>
  );
};

export default CalculatorRefactored;
