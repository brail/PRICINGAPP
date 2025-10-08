/**
 * Parameters Refactored per Pricing Calculator v0.2
 * Componente refactorizzato che usa i nuovi context e hooks
 * MANTIENE LA STESSA UI/UX del componente originale
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { useParameterManager } from "../hooks/useParameterManager";
import { CURRENCIES } from "../types";
import "./Parameters.css";

const ParametersRefactored: React.FC = () => {
  // Hook per la gestione dei parametri
  const {
    currentParams,
    parameterSets,
    activeParameterSet,
    loading,
    error,
    saving,
    autoSaving,
    updateParameterWithValidation,
    updateParametersWithValidation,
    loadParameterSets,
    loadAndApplyParameterSet,
    createSetFromCurrentParams,
    applyParameterSet,
    duplicateSetWithNewName,
    setDefaultParameterSet,
    deleteParameterSet,
    clearError,
  } = useParameterManager();

  // Stato locale per UI
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  const [duplicatingSet, setDuplicatingSet] = useState<any>(null);
  const [newSetDescription, setNewSetDescription] = useState("");
  const [duplicateSetDescription, setDuplicateSetDescription] = useState("");

  // Carica i set di parametri all'avvio
  useEffect(() => {
    loadParameterSets();
  }, [loadParameterSets]);

  // Gestione creazione nuovo set
  const handleCreateSet = async () => {
    try {
      await createSetFromCurrentParams(newSetDescription);
      setShowCreateDialog(false);
      setNewSetDescription("");
    } catch (error) {
      console.error("Errore nella creazione set:", error);
    }
  };

  // Gestione duplicazione set
  const handleDuplicateSet = async () => {
    try {
      await duplicateSetWithNewName(duplicatingSet.id, duplicateSetDescription);
      setShowDuplicateDialog(false);
      setDuplicateSetDescription("");
      setDuplicatingSet(null);
    } catch (error) {
      console.error("Errore nella duplicazione set:", error);
    }
  };

  // Gestione eliminazione set
  const handleDeleteSet = async (setId: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questo set di parametri?")) {
      try {
        await deleteParameterSet(setId);
      } catch (error) {
        console.error("Errore nell'eliminazione set:", error);
      }
    }
  };

  // Gestione impostazione set come default
  const handleSetDefault = async (setId: number) => {
    try {
      await setDefaultParameterSet(setId);
    } catch (error) {
      console.error("Errore nell'impostazione set di default:", error);
    }
  };

  // Gestione caricamento set
  const handleLoadSet = async (setId: number) => {
    try {
      await loadAndApplyParameterSet(setId);
    } catch (error) {
      console.error("Errore nel caricamento set:", error);
    }
  };

  // Gestione aggiornamento parametro
  const handleParameterChange = (key: string, value: any) => {
    try {
      updateParameterWithValidation(key as any, value);
    } catch (error) {
      console.error("Errore validazione parametro:", error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestione Parametri
      </Typography>

      {/* Parametri attuali */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Parametri Attuali
        </Typography>
        
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 2 }}>
          {/* Quality Control */}
          <TextField
            label="Quality Control (%)"
            type="number"
            value={currentParams.qualityControlPercent}
            onChange={(e) => handleParameterChange("qualityControlPercent", parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 0, max: 100, step: 0.1 }}
          />

          {/* Dazio */}
          <TextField
            label="Dazio (%)"
            type="number"
            value={currentParams.duty}
            onChange={(e) => handleParameterChange("duty", parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 0, max: 100, step: 0.1 }}
          />

          {/* Margine Ottimale */}
          <TextField
            label="Margine Ottimale (%)"
            type="number"
            value={currentParams.optimalMargin}
            onChange={(e) => handleParameterChange("optimalMargin", parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 0, max: 100, step: 0.1 }}
          />

          {/* Tasso di Cambio */}
          <TextField
            label="Tasso di Cambio"
            type="number"
            value={currentParams.exchangeRate}
            onChange={(e) => handleParameterChange("exchangeRate", parseFloat(e.target.value) || 1)}
            fullWidth
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          {/* Costo Trasporto e Assicurazione */}
          <TextField
            label="Costo Trasporto e Assicurazione"
            type="number"
            value={currentParams.transportInsuranceCost}
            onChange={(e) => handleParameterChange("transportInsuranceCost", parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
          />

          {/* Costi Accessori Italia */}
          <TextField
            label="Costi Accessori Italia"
            type="number"
            value={currentParams.italyAccessoryCosts}
            onChange={(e) => handleParameterChange("italyAccessoryCosts", parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
          />

          {/* Strumenti */}
          <TextField
            label="Strumenti"
            type="number"
            value={currentParams.tools}
            onChange={(e) => handleParameterChange("tools", parseFloat(e.target.value) || 0)}
            fullWidth
            inputProps={{ min: 0, step: 0.1 }}
          />

          {/* Moltiplicatore Retail */}
          <TextField
            label="Moltiplicatore Retail"
            type="number"
            value={currentParams.retailMultiplier}
            onChange={(e) => handleParameterChange("retailMultiplier", parseFloat(e.target.value) || 1)}
            fullWidth
            inputProps={{ min: 1, step: 0.01 }}
          />

          {/* Valuta Acquisto */}
          <FormControl fullWidth>
            <InputLabel>Valuta Acquisto</InputLabel>
            <Select
              value={currentParams.purchaseCurrency}
              onChange={(e) => handleParameterChange("purchaseCurrency", e.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <MenuItem key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Valuta Vendita */}
          <FormControl fullWidth>
            <InputLabel>Valuta Vendita</InputLabel>
            <Select
              value={currentParams.sellingCurrency}
              onChange={(e) => handleParameterChange("sellingCurrency", e.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <MenuItem key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Pulsanti azione */}
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
            disabled={saving}
          >
            Salva come Nuovo Set
          </Button>
        </Box>
      </Paper>

      {/* Set di parametri esistenti */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Set di Parametri Salvati
        </Typography>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {parameterSets.length === 0 && !loading && (
          <Typography color="text.secondary" sx={{ textAlign: "center", p: 2 }}>
            Nessun set di parametri salvato
          </Typography>
        )}

        {parameterSets.length > 0 && (
          <List>
            {parameterSets.map((set) => (
              <ListItem key={set.id} divider>
                <ListItemText
                  primary={set.description}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Quality Control: {set.quality_control_percent}% | 
                        Dazio: {set.duty}% | 
                        Margine: {set.optimal_margin}% | 
                        Tasso: {set.exchange_rate}
                      </Typography>
                      {set.is_default && (
                        <Chip
                          label="Default"
                          size="small"
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleLoadSet(set.id)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDuplicatingSet(set);
                        setShowDuplicateDialog(true);
                      }}
                      disabled={loading}
                    >
                      <DuplicateIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleSetDefault(set.id)}
                      disabled={loading || set.is_default}
                    >
                      {set.is_default ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSet(set.id)}
                      disabled={loading || set.is_default}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Dialog per creazione nuovo set */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Salva Nuovo Set di Parametri</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Descrizione"
            fullWidth
            variant="outlined"
            value={newSetDescription}
            onChange={(e) => setNewSetDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Annulla</Button>
          <Button
            onClick={handleCreateSet}
            variant="contained"
            disabled={!newSetDescription.trim() || saving}
          >
            {saving ? "Salvando..." : "Salva"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per duplicazione set */}
      <Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)}>
        <DialogTitle>Duplica Set di Parametri</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nuova Descrizione"
            fullWidth
            variant="outlined"
            value={duplicateSetDescription}
            onChange={(e) => setDuplicateSetDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicateDialog(false)}>Annulla</Button>
          <Button
            onClick={handleDuplicateSet}
            variant="contained"
            disabled={!duplicateSetDescription.trim() || saving}
          >
            {saving ? "Duplicando..." : "Duplica"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Errori */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={clearError}>
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

export default ParametersRefactored;
