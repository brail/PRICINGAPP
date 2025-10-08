/**
 * BatchCalculator Refactored per Pricing Calculator v0.2
 * Componente refactorizzato che usa i nuovi context e hooks
 * MANTIENE LA STESSA UI/UX del componente originale
 */

import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  Calculate as CalculateIcon,
} from "@mui/icons-material";
import { useCalculation } from "../hooks/useCalculation";
import { useParameterManager } from "../hooks/useParameterManager";
import { CURRENCIES } from "../types";
import "./BatchCalculator.css";

interface BatchItem {
  id: string;
  description: string;
  purchasePrice: number;
  retailPrice: number;
  calculatedRetailPrice?: number;
  calculatedPurchasePrice?: number;
  margin?: number;
  error?: string;
}

const BatchCalculatorRefactored: React.FC = () => {
  // Hooks per calcoli e parametri
  const {
    calculateSellingWithValidation,
    calculatePurchaseWithValidation,
    calculateMarginWithValidation,
    formatPrice,
    formatPercentage,
  } = useCalculation();

  const { currentParams } = useParameterManager();

  // Stato locale
  const [items, setItems] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    description: "",
    purchasePrice: "",
    retailPrice: "",
  });

  // Aggiunge un nuovo elemento
  const handleAddItem = () => {
    if (!newItem.description.trim()) {
      setError("La descrizione è obbligatoria");
      return;
    }

    const purchasePrice = parseFloat(newItem.purchasePrice) || 0;
    const retailPrice = parseFloat(newItem.retailPrice) || 0;

    if (purchasePrice <= 0 && retailPrice <= 0) {
      setError("Inserire almeno un prezzo valido");
      return;
    }

    const item: BatchItem = {
      id: Date.now().toString(),
      description: newItem.description,
      purchasePrice,
      retailPrice,
    };

    setItems([...items, item]);
    setNewItem({ description: "", purchasePrice: "", retailPrice: "" });
    setShowAddDialog(false);
    setError(null);
  };

  // Rimuove un elemento
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calcola tutti gli elementi
  const handleCalculateAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          try {
            let calculatedRetailPrice: number | undefined;
            let calculatedPurchasePrice: number | undefined;
            let margin: number | undefined;

            // Se abbiamo prezzo di acquisto, calcola prezzo di vendita
            if (item.purchasePrice > 0) {
              const result = await calculateSellingWithValidation(item.purchasePrice);
              calculatedRetailPrice = result.retailPrice;
            }

            // Se abbiamo prezzo di vendita, calcola prezzo di acquisto
            if (item.retailPrice > 0) {
              const result = await calculatePurchaseWithValidation(item.retailPrice);
              calculatedPurchasePrice = result.purchasePrice;
            }

            // Se abbiamo entrambi, calcola il margine
            if (item.purchasePrice > 0 && item.retailPrice > 0) {
              const result = await calculateMarginWithValidation(item.purchasePrice, item.retailPrice);
              margin = result.companyMargin;
            }

            return {
              ...item,
              calculatedRetailPrice,
              calculatedPurchasePrice,
              margin,
              error: undefined,
            };
          } catch (error) {
            return {
              ...item,
              error: error instanceof Error ? error.message : "Errore nel calcolo",
            };
          }
        })
      );

      setItems(updatedItems);
    } catch (error) {
      setError("Errore nel calcolo batch");
      console.error("Errore nel calcolo batch:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pulisce tutti i risultati
  const handleClearResults = () => {
    setItems(
      items.map((item) => ({
        ...item,
        calculatedRetailPrice: undefined,
        calculatedPurchasePrice: undefined,
        margin: undefined,
        error: undefined,
      }))
    );
  };

  // Pulisce tutti gli elementi
  const handleClearAll = () => {
    setItems([]);
    setError(null);
  };

  // Esporta i risultati in CSV
  const handleExportCSV = () => {
    const headers = [
      "Descrizione",
      "Prezzo Acquisto",
      "Prezzo Vendita",
      "Prezzo Vendita Calcolato",
      "Prezzo Acquisto Calcolato",
      "Margine",
      "Errore",
    ];

    const csvContent = [
      headers.join(","),
      ...items.map((item) =>
        [
          `"${item.description}"`,
          item.purchasePrice,
          item.retailPrice,
          item.calculatedRetailPrice || "",
          item.calculatedPurchasePrice || "",
          item.margin ? formatPercentage(item.margin) : "",
          item.error ? `"${item.error}"` : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `batch_calculation_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Calcolo Batch
      </Typography>

      {/* Controlli */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
          >
            Aggiungi Elemento
          </Button>
          <Button
            variant="contained"
            startIcon={<CalculateIcon />}
            onClick={handleCalculateAll}
            disabled={items.length === 0 || loading}
          >
            {loading ? "Calcolando..." : "Calcola Tutto"}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearResults}
            disabled={items.length === 0}
          >
            Pulisci Risultati
          </Button>
          <Button
            variant="outlined"
            onClick={handleClearAll}
            disabled={items.length === 0}
          >
            Pulisci Tutto
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={items.length === 0}
          >
            Esporta CSV
          </Button>
        </Box>
      </Paper>

      {/* Tabella risultati */}
      {items.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Descrizione</TableCell>
                  <TableCell align="right">Prezzo Acquisto</TableCell>
                  <TableCell align="right">Prezzo Vendita</TableCell>
                  <TableCell align="right">Prezzo Vendita Calcolato</TableCell>
                  <TableCell align="right">Prezzo Acquisto Calcolato</TableCell>
                  <TableCell align="right">Margine</TableCell>
                  <TableCell align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">
                      {item.purchasePrice > 0 ? formatPrice(item.purchasePrice, currentParams.purchaseCurrency) : "-"}
                    </TableCell>
                    <TableCell align="right">
                      {item.retailPrice > 0 ? formatPrice(item.retailPrice, currentParams.sellingCurrency) : "-"}
                    </TableCell>
                    <TableCell align="right">
                      {item.calculatedRetailPrice ? (
                        formatPrice(item.calculatedRetailPrice, currentParams.sellingCurrency)
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {item.calculatedPurchasePrice ? (
                        formatPrice(item.calculatedPurchasePrice, currentParams.purchaseCurrency)
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {item.margin !== undefined ? (
                        <Chip
                          label={formatPercentage(item.margin)}
                          color={item.margin > 0.2 ? "success" : item.margin > 0.1 ? "warning" : "error"}
                          size="small"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveItem(item.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Messaggio quando non ci sono elementi */}
      {items.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            Nessun elemento aggiunto. Clicca "Aggiungi Elemento" per iniziare.
          </Typography>
        </Paper>
      )}

      {/* Dialog per aggiungere elemento */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aggiungi Elemento</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Descrizione"
              fullWidth
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            />
            <TextField
              label="Prezzo di Acquisto"
              type="number"
              fullWidth
              value={newItem.purchasePrice}
              onChange={(e) => setNewItem({ ...newItem, purchasePrice: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Prezzo di Vendita"
              type="number"
              fullWidth
              value={newItem.retailPrice}
              onChange={(e) => setNewItem({ ...newItem, retailPrice: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Annulla</Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            disabled={!newItem.description.trim()}
          >
            Aggiungi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Errori */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default BatchCalculatorRefactored;
