import React, { useState, useCallback, useRef, useEffect } from "react";
import { CalculationMode } from "../types";
import { pricingApi } from "../services/api";
import { LoadingStates, useLoadingState } from "./LoadingStates";
import {
  useBusinessErrorHandler,
  createBusinessError,
} from "../hooks/useBusinessErrorHandler";
import { useNotification } from "../contexts/NotificationContext";
import CompactErrorHandler from "./CompactErrorHandler";
import * as ExcelJS from "exceljs";
import "./BatchCalculator.css";

interface BatchResult {
  input: number;
  output: number;
  purchasePrice: number;
  sellingPrice: number;
  margin: number;
  purchaseCurrency: string;
  sellingCurrency: string;
}

interface BatchCalculatorProps {
  params: any;
  onCalculate: (
    mode: CalculationMode,
    input: number
  ) => Promise<{
    purchasePrice: number;
    sellingPrice: number;
    margin: number;
    purchaseCurrency: string;
    sellingCurrency: string;
  }>;
}

const BatchCalculator: React.FC<BatchCalculatorProps> = ({
  params,
  onCalculate,
}) => {
  const [calculationMode, setCalculationMode] =
    useState<CalculationMode>("purchase");
  const [inputMethod, setInputMethod] = useState<"paste" | "upload">("paste");
  const [inputData, setInputData] = useState<number[] | number[][]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Business error handler
  const { errors, addError, removeError, clearErrors } =
    useBusinessErrorHandler();

  // Notification system
  const { showSuccess, showError, showInfo } = useNotification();

  // Hook per gestire stati di loading professionali
  const { isLoading, loadingMessage, startLoading, stopLoading } =
    useLoadingState();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Funzione per pulire i valori numerici rimuovendo simboli di valuta e caratteri non numerici
  const cleanNumericValue = useCallback((value: string): number => {
    // Rimuove simboli di valuta comuni e caratteri non numerici
    const cleaned = value
      .replace(/[€$£¥₹₽₩₪₦₡₨₴₸₺₼₾₿]/g, "") // Simboli di valuta
      .replace(/[^\d.,\-+]/g, "") // Solo numeri, virgole, punti, segni
      .replace(/,/g, ".") // Converte virgole in punti per i decimali
      .trim();

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }, []);

  // Parser per copia-incolla
  const parsePasteData = useCallback(
    (text: string): number[] | number[][] => {
      if (!text.trim()) return [];

      // Rimuove spazi extra e divide per righe
      const lines = text.trim().split(/\r?\n/);

      // Controlla se ogni riga ha due valori (per calcolo margine)
      // Prima controlla se è formato Excel (separato da tab)
      const hasTwoColumnsExcel = lines.every((line) => {
        const values = line.split(/\t/).filter((v) => v.trim());
        return values.length === 2;
      });

      // Poi controlla se è formato con altri separatori (semicolon, spazio)
      // MA solo se NON è una singola colonna di valori
      const hasTwoColumnsOther = lines.every((line) => {
        const values = line.split(/[;\s]+/).filter((v) => v.trim());
        return values.length === 2;
      });

      // Controlla se è una singola colonna (ogni riga ha un solo valore)
      const isSingleColumn = lines.every((line) => {
        const values = line.split(/[;\t\s]+/).filter((v) => v.trim());
        return values.length === 1;
      });

      // Determina se ha due colonne (priorità al formato Excel)
      const hasTwoColumns = hasTwoColumnsExcel || hasTwoColumnsOther;

      // Debug: log per capire cosa sta succedendo
      console.log("Debug parsePasteData:", {
        lines: lines.length,
        isSingleColumn,
        hasTwoColumns,
        hasTwoColumnsExcel,
        hasTwoColumnsOther,
        calculationMode,
        firstLine: lines[0],
        firstLineValues: lines[0]
          ? lines[0].split(/[;\t\s]+/).filter((v) => v.trim())
          : [],
      });

      if (hasTwoColumns && calculationMode === "margin") {
        // CORRETTO: Due colonne per calcolo margine
        const pairs: number[][] = [];

        for (const line of lines) {
          // Usa il separatore appropriato (tab per Excel, altri per formato manuale)
          const values = hasTwoColumnsExcel
            ? line.split(/\t/).filter((v) => v.trim())
            : line.split(/[;\s]+/).filter((v) => v.trim());

          if (values.length === 2) {
            const pair = values.map((value) => cleanNumericValue(value));
            pairs.push(pair);
          }
        }

        console.log("Debug: returning pairs", pairs.length, "pairs");
        return pairs;
      } else if (!hasTwoColumns && calculationMode !== "margin") {
        // CORRETTO: Singola colonna per calcoli acquisto/vendita
        const numbers: number[] = [];

        for (const line of lines) {
          // Gestisce separatori multipli (punto e virgola, tab, spazio)
          const values = line.split(/[;\t\s]+/).filter((v) => v.trim());

          for (const value of values) {
            const num = cleanNumericValue(value);
            if (num > 0) {
              numbers.push(num);
            }
          }
        }

        console.log("Debug: returning numbers", numbers.length, "numbers");
        return numbers;
      } else {
        // ERRORE: Formato non compatibile con la modalità selezionata
        console.log("Debug: formato non compatibile", {
          hasTwoColumns,
          calculationMode,
          isSingleColumn,
        });
        return []; // Restituisce array vuoto per indicare errore
      }
    },
    [calculationMode, cleanNumericValue, addError, clearErrors]
  );

  // Gestione copia-incolla
  const handlePasteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setPasteText(text);
      const parsed = parsePasteData(text);
      setInputData(parsed);

      if (parsed.length === 0 && text.trim()) {
        // Determina il tipo di errore specifico
        if (calculationMode === "margin") {
          addError(
            createBusinessError.validation(
              "Per il calcolo margine sono necessarie due colonne (acquisto; vendita)",
              "inputData",
              [
                "Inserisci due colonne separate da punto e virgola",
                "Formato: prezzo_acquisto; prezzo_vendita",
                "Esempio: 25.50; 45.99",
              ]
            )
          );
        } else {
          addError(
            createBusinessError.validation(
              "Per il calcolo acquisto/vendita è necessaria una sola colonna",
              "inputData",
              [
                "Inserisci una sola colonna di valori",
                "Formato: prezzo_acquisto o prezzo_vendita",
                "Esempio: 25.50",
              ]
            )
          );
        }
      } else {
        clearErrors();
      }
    },
    [parsePasteData, calculationMode, addError, clearErrors]
  );

  // Validazione automatica quando cambia la modalità di calcolo
  useEffect(() => {
    if (pasteText.trim() && inputMethod === "paste") {
      // Rivalida i dati esistenti quando cambia la modalità
      const parsed = parsePasteData(pasteText);
      setInputData(parsed);

      if (parsed.length === 0 && pasteText.trim()) {
        // Determina il tipo di errore specifico
        if (calculationMode === "margin") {
          addError(
            createBusinessError.validation(
              "Per il calcolo margine sono necessarie due colonne (acquisto; vendita)",
              "inputData",
              [
                "Inserisci due colonne separate da punto e virgola",
                "Formato: prezzo_acquisto; prezzo_vendita",
                "Esempio: 25.50; 45.99",
              ]
            )
          );
        } else {
          addError(
            createBusinessError.validation(
              "Per il calcolo acquisto/vendita è necessaria una sola colonna",
              "inputData",
              [
                "Inserisci una sola colonna di valori",
                "Formato: prezzo_acquisto o prezzo_vendita",
                "Esempio: 25.50",
              ]
            )
          );
        }
      } else {
        clearErrors();
      }
    }
  }, [
    calculationMode,
    pasteText,
    inputMethod,
    parsePasteData,
    addError,
    clearErrors,
  ]);

  // Gestione upload file
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadedFile(file);
      clearErrors();

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          if (!data) return;

          let jsonData: any[] = [];

          // Determina il tipo di file e leggi di conseguenza
          if (file.name.toLowerCase().endsWith(".csv")) {
            // Per file CSV, leggi come testo e converti in array
            const csvText = data as string;
            const lines = csvText.split("\n");
            jsonData = lines.map((line) => {
              // Gestisce virgole e punti e virgola come separatori
              const separator = line.includes(";") ? ";" : ",";
              return line.split(separator).map((cell) => cell.trim());
            });
          } else {
            // Per file Excel - usa ExcelJS
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data as ArrayBuffer);
            const worksheet = workbook.getWorksheet(1);
            if (worksheet) {
              jsonData = [];
              worksheet.eachRow((row, rowNumber) => {
                const rowData: any[] = [];
                row.eachCell((cell, colNumber) => {
                  rowData[colNumber - 1] = cell.value;
                });
                jsonData.push(rowData);
              });
            }
          }

          // Funzione per rilevare se una riga contiene solo intestazioni (testo)
          const isHeaderRow = (row: any): boolean => {
            if (!Array.isArray(row)) return false;
            return row.every((cell: any) => {
              const str = String(cell).trim();
              return str === "" || isNaN(Number(str)) || str === "undefined";
            });
          };

          // Funzione per rilevare se una riga è vuota
          const isEmptyRow = (row: any): boolean => {
            if (!Array.isArray(row)) return true;
            return row.every(
              (cell: any) => !cell || String(cell).trim() === ""
            );
          };

          // Rimuovi intestazioni e righe vuote
          const cleanData = jsonData
            .filter((row: any) => !isEmptyRow(row) && !isHeaderRow(row))
            .map((row: any) => {
              if (Array.isArray(row)) {
                // Rimuovi celle vuote dall'inizio e dalla fine
                const trimmedRow = row.filter(
                  (cell: any) =>
                    cell !== undefined && String(cell).trim() !== ""
                );
                return trimmedRow;
              }
              return row;
            })
            .filter((row: any) => row && row.length > 0);

          console.log("Dati puliti dal file Excel:", cleanData);

          // Converte in numeri
          const numericData = cleanData
            .map((row: any) => {
              if (Array.isArray(row)) {
                // Se è un array (due colonne), converte entrambi i valori
                if (row.length >= 2) {
                  const val1 = cleanNumericValue(String(row[0]));
                  const val2 = cleanNumericValue(String(row[1]));
                  return [val1, val2];
                } else if (row.length === 1) {
                  // Se è una singola colonna, converte solo il primo valore
                  return cleanNumericValue(String(row[0]));
                }
              } else {
                // Se è un singolo valore
                return cleanNumericValue(String(row));
              }
              return null;
            })
            .filter((item: any) => item !== null && item !== 0);

          if (numericData.length === 0) {
            addError(
              createBusinessError.validation(
                "Nessun dato numerico valido trovato nel file",
                "file",
                [
                  "Verifica che il file contenga valori numerici",
                  "Assicurati che i dati siano nella prima colonna",
                  "Formato supportato: .xlsx, .csv",
                ]
              )
            );
            return;
          }

          // Determina se sono coppie o singoli valori
          const hasTwoColumns = numericData.every((item: any) =>
            Array.isArray(item)
          );

          if (hasTwoColumns && calculationMode === "margin") {
            // Due colonne per calcolo margine - CORRETTO
            setInputData(numericData as number[][]);
            console.log("Dati Excel caricati:", numericData.length, "coppie");
          } else if (!hasTwoColumns && calculationMode !== "margin") {
            // Singola colonna per calcoli acquisto/vendita - CORRETTO
            setInputData(numericData as number[]);
            console.log("Dati Excel caricati:", numericData.length, "valori");
          } else if (hasTwoColumns && calculationMode !== "margin") {
            // ERRORE: Due colonne per calcolo acquisto/vendita
            addError(
              createBusinessError.validation(
                "Per il calcolo acquisto/vendita è necessaria una sola colonna nel file",
                "file",
                [
                  "Rimuovi la seconda colonna dal file",
                  "Mantieni solo i valori di acquisto o vendita",
                  "Oppure cambia modalità in 'Margine'",
                ]
              )
            );
          } else if (!hasTwoColumns && calculationMode === "margin") {
            // ERRORE: Una colonna per calcolo margine
            addError(
              createBusinessError.validation(
                "Per il calcolo margine sono necessarie due colonne nel file",
                "file",
                [
                  "Aggiungi una seconda colonna con i prezzi di vendita",
                  "Formato: prezzo_acquisto; prezzo_vendita",
                  "Oppure cambia modalità in 'Acquisto' o 'Vendita'",
                ]
              )
            );
          }
        } catch (error) {
          console.error("Errore nel parsing del file Excel:", error);
          addError(
            createBusinessError.system(
              "Errore nel leggere il file. Assicurati che sia un file .xlsx o .csv valido.",
              "Errore di parsing Excel"
            )
          );
        }
      };

      // Leggi il file come testo per CSV o come ArrayBuffer per Excel
      if (file.name.toLowerCase().endsWith(".csv")) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    },
    [calculationMode, cleanNumericValue, addError, clearErrors]
  );

  // Calcolo batch
  const handleBatchCalculate = useCallback(async () => {
    if (inputData.length === 0) {
      addError(
        createBusinessError.validation(
          "Inserisci almeno un valore",
          "inputData",
          [
            "Incolla i dati nell'area di testo",
            "Oppure carica un file Excel/CSV",
            "Formato: un valore per riga",
          ]
        )
      );
      return;
    }

    if (inputData.length > 500) {
      addError(
        createBusinessError.validation(
          "Massimo 500 valori consentiti",
          "inputData",
          [
            "Riduci il numero di valori",
            "Dividi i calcoli in batch più piccoli",
            "Limite: 500 valori per batch",
          ]
        )
      );
      return;
    }

    try {
      startLoading("Preparazione calcolo batch...", 0);
      setIsCalculating(true);
      clearErrors();

      const batchResults: BatchResult[] = [];

      if (calculationMode === "margin" && Array.isArray(inputData[0])) {
        // Gestione calcolo margine con due colonne
        for (const pair of inputData as number[][]) {
          const [purchasePrice, sellingPrice] = pair;

          // Usa il nuovo endpoint per calcolare il margine
          const marginResult = await pricingApi.calculateMargin(
            purchasePrice,
            sellingPrice
          );

          batchResults.push({
            input: sellingPrice, // Usa il prezzo di vendita come input principale
            output: marginResult.companyMargin * 100, // Converti in percentuale
            purchasePrice: marginResult.purchasePrice,
            sellingPrice: marginResult.retailPrice,
            margin: marginResult.companyMargin * 100, // Converti in percentuale
            purchaseCurrency: marginResult.purchaseCurrency,
            sellingCurrency: marginResult.sellingCurrency,
          });
        }
      } else {
        // Gestione calcoli normali (acquisto/vendita)
        for (const input of inputData as number[]) {
          // Usa la funzione onCalculate che ora restituisce tutti i dati
          const result = await onCalculate(calculationMode, input);

          batchResults.push({
            input,
            output:
              calculationMode === "purchase"
                ? result.sellingPrice
                : calculationMode === "selling"
                ? result.purchasePrice
                : result.margin,
            purchasePrice: result.purchasePrice,
            sellingPrice: result.sellingPrice,
            margin: result.margin,
            purchaseCurrency: result.purchaseCurrency,
            sellingCurrency: result.sellingCurrency,
          });
        }
      }

      setResults(batchResults);

      // Notifica di successo
      showSuccess(
        "Calcolo batch completato",
        `${batchResults.length} calcoli eseguiti con successo`
      );
    } catch (err) {
      addError(
        createBusinessError.calculation("Errore durante il calcolo batch", {
          inputDataLength: inputData.length,
          calculationMode,
          timestamp: new Date().toISOString(),
        })
      );
      console.error("Batch calculation error:", err);
    } finally {
      stopLoading();
      setIsCalculating(false);
    }
  }, [
    inputData,
    calculationMode,
    onCalculate,
    startLoading,
    stopLoading,
    addError,
    clearErrors,
  ]);

  // Export Excel
  const handleExportExcel = useCallback(async () => {
    if (results.length === 0) return;

    try {
      // Crea un nuovo workbook con ExcelJS
      const workbook = new ExcelJS.Workbook();

      // Crea il primo foglio "Risultati Calcolo"
      const resultsSheet = workbook.addWorksheet("Risultati Calcolo");

      // Imposta le intestazioni
      resultsSheet.columns = [
        { header: "DAZIO", key: "duty", width: 12 },
        { header: "PREZZO ACQUISTO", key: "purchasePrice", width: 18 },
        { header: "PREZZO VENDITA", key: "sellingPrice", width: 18 },
        { header: "MARGINE", key: "margin", width: 12 },
      ];

      // Formatta prima le intestazioni (riga 1)
      const headerRow = resultsSheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD3D3D3" },
        };
      });

      // Aggiungi i dati
      results.forEach((result) => {
        const row = resultsSheet.addRow({
          duty: (params.duty || 0) / 100,
          purchasePrice: result.purchasePrice,
          sellingPrice: result.sellingPrice,
          margin: result.margin / 100,
        });

        // Formatta le celle dati
        row.eachCell((cell, colNumber) => {
          // Formattazione dati
          if (colNumber === 1) {
            // Dazio - percentuale
            cell.numFmt = "0.00%";
          } else if (colNumber === 2) {
            // Prezzo Acquisto - valuta
            cell.numFmt = `"${params.purchaseCurrency}" #,##0.00`;
          } else if (colNumber === 3) {
            // Prezzo Vendita - valuta
            cell.numFmt = `"${params.sellingCurrency}" #,##0.00`;
          } else if (colNumber === 4) {
            // Margine - percentuale
            cell.numFmt = "0.00%";
          }

          // Evidenziazione rimossa per richiesta utente
        });
      });

      // Crea il secondo foglio "Parametri"
      const parametersSheet = workbook.addWorksheet("Parametri");

      // Aggiungi le informazioni di testa
      parametersSheet.addRow([
        "Data e ora elaborazione:",
        new Date().toLocaleString("it-IT"),
      ]);
      parametersSheet.addRow([
        "Parametri utilizzati:",
        params.description || "Parametri predefiniti",
      ]);

      // Aggiungi il tipo di calcolo eseguito
      let calculationType = "";
      if (calculationMode === "purchase") {
        calculationType = "Da prezzo vendita a prezzo acquisto";
      } else if (calculationMode === "selling") {
        calculationType = "Da prezzo acquisto a prezzo vendita";
      } else if (calculationMode === "margin") {
        calculationType = "Calcolo margine da prezzo acquisto e vendita";
      }

      parametersSheet.addRow(["Tipo di calcolo:", calculationType]);
      parametersSheet.addRow([]); // Riga vuota
      parametersSheet.addRow(["PARAMETRO", "VALORE"]); // Intestazioni tabella

      // Aggiungi i parametri
      const parametersData = [
        ["Valuta Acquisto", params.purchaseCurrency],
        ["Valuta Vendita", params.sellingCurrency],
        ["Controllo Qualità (%)", params.qualityControlPercent / 100],
        ["Costo Trasporto e Assicurazione", params.transportInsuranceCost],
        ["Dazio (%)", params.duty / 100],
        ["Tasso di Cambio", params.exchangeRate],
        ["Costi Accessori Italia", params.italyAccessoryCosts],
        ["Tools", params.tools],
        ["Moltiplicatore Azienda", params.companyMultiplier],
        ["Moltiplicatore Retail", params.retailMultiplier],
        ["Margine Ottimale (%)", params.optimalMargin / 100],
      ];

      parametersData.forEach(([paramName, value]) => {
        parametersSheet.addRow([paramName, value]);
      });

      // Formatta il foglio parametri
      parametersSheet.columns = [{ width: 25 }, { width: 20 }];

      // Formatta le prime tre righe (data, nome parametri e tipo calcolo)
      for (let row = 1; row <= 3; row++) {
        const excelRow = parametersSheet.getRow(row);
        excelRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6E6FA" },
          };
        });
      }

      // Formatta le intestazioni della tabella (riga 5)
      const parametersHeaderRow = parametersSheet.getRow(5);
      parametersHeaderRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD3D3D3" },
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Formatta le righe dei parametri (dalla riga 6 in poi)
      for (let row = 6; row <= parametersSheet.rowCount; row++) {
        const excelRow = parametersSheet.getRow(row);
        const paramName = excelRow.getCell(1).value as string;
        const valueCell = excelRow.getCell(2);

        // Formatta la cella chiave (nome parametro)
        excelRow.getCell(1).font = { bold: true };
        excelRow.getCell(1).border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        // Formatta la cella valore
        valueCell.alignment = { horizontal: "right" };
        valueCell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        // Formattazione specifica per tipo di parametro
        if (paramName.includes("(%)") || paramName === "Margine Ottimale (%)") {
          valueCell.numFmt = "0.00%";
        } else if (paramName.includes("Costo") || paramName === "Tools") {
          let currency = "";
          if (paramName.includes("Costo Trasporto") || paramName === "Tools") {
            currency = params.purchaseCurrency;
          } else if (paramName.includes("Costi Accessori")) {
            currency = params.sellingCurrency;
          }
          if (currency) {
            valueCell.numFmt = `"${currency}" #,##0.00`;
          }
        } else if (
          paramName === "Tasso di Cambio" ||
          paramName.includes("Moltiplicatore")
        ) {
          valueCell.numFmt = "#,##0.00";
        }
      }

      // Genera il nome del file con timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const fileName = `risultati_calcolo_${timestamp}.xlsx`;

      // Scarica il file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      console.log("File Excel esportato:", fileName);
    } catch (error) {
      console.error("Errore nell'export Excel:", error);
      addError(
        createBusinessError.system(
          "Errore nell'export del file Excel",
          "Errore di esportazione Excel"
        )
      );
    }
  }, [results, params, calculationMode, addError]);

  // Reset
  const handleReset = useCallback(() => {
    setInputData([]);
    setResults([]);
    setPasteText("");
    setUploadedFile(null);
    clearErrors();
  }, [clearErrors]);

  return (
    <div className="batch-calculator">
      {/* Loading Overlay per calcoli batch */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LoadingStates
            type="progress"
            message={loadingMessage}
            fullScreen={true}
          />
        </div>
      )}

      <div className="batch-header">
        <h3>Calcolo Batch</h3>
        <p>Calcola più valori contemporaneamente</p>
      </div>

      {/* Selezione modalità di calcolo */}
      <div className="batch-mode-selection">
        <label>Modalità di calcolo:</label>
        <div className="mode-buttons">
          <button
            className={`mode-btn ${
              calculationMode === "purchase" ? "active" : ""
            }`}
            onClick={() => setCalculationMode("purchase")}
          >
            Acquisto → Vendita
          </button>
          <button
            className={`mode-btn ${
              calculationMode === "selling" ? "active" : ""
            }`}
            onClick={() => setCalculationMode("selling")}
          >
            Vendita → Acquisto
          </button>
          <button
            className={`mode-btn ${
              calculationMode === "margin" ? "active" : ""
            }`}
            onClick={() => setCalculationMode("margin")}
          >
            Calcolo Margine
          </button>
        </div>
      </div>

      {/* Selezione metodo di input */}
      <div className="batch-input-method">
        <label>Metodo di input:</label>
        <div className="input-method-buttons">
          <button
            className={`method-btn ${inputMethod === "paste" ? "active" : ""}`}
            onClick={() => setInputMethod("paste")}
          >
            Copia-Incolla
          </button>
          <button
            className={`method-btn ${inputMethod === "upload" ? "active" : ""}`}
            onClick={() => setInputMethod("upload")}
          >
            Upload Excel
          </button>
        </div>
      </div>

      {/* Area input dati */}
      <div className="batch-input-area">
        {inputMethod === "paste" && (
          <div className="paste-input">
            <label>
              {calculationMode === "margin"
                ? "Incolla due colonne (acquisto; vendita) - una coppia per riga:"
                : calculationMode === "purchase"
                ? "Incolla i prezzi di acquisto (uno per riga):"
                : "Incolla i prezzi di vendita (uno per riga):"}
            </label>
            <textarea
              value={pasteText}
              onChange={handlePasteChange}
              placeholder={
                calculationMode === "margin"
                  ? "Copia due colonne da Excel oppure:\n10;20\n15;25\n20;30"
                  : calculationMode === "purchase"
                  ? "Copia una colonna da Excel oppure:\n10\n15\n20"
                  : "Copia una colonna da Excel oppure:\n10\n15\n20"
              }
              rows={6}
            />
            {inputData.length > 0 && (
              <div className="data-preview">
                <strong>
                  Dati riconosciuti ({inputData.length}{" "}
                  {calculationMode === "margin" ? "coppie" : "valori"}):
                </strong>
                <div className="preview-values">
                  {inputData.slice(0, 10).map((value, index) => (
                    <span key={index} className="preview-value">
                      {Array.isArray(value)
                        ? `${value[0]} ; ${value[1]}`
                        : value}
                    </span>
                  ))}
                  {inputData.length > 10 && <span>...</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {inputMethod === "upload" && (
          <div className="upload-input">
            <label>Carica file Excel/CSV (.xlsx, .csv):</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <button
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedFile ? uploadedFile.name : "Seleziona File"}
            </button>
            {uploadedFile && (
              <div className="file-info">
                <p>File selezionato: {uploadedFile.name}</p>
                <p>Dimensione: {(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Errori */}
      {/* Compact Error Handler */}
      {errors.map((businessError) => (
        <CompactErrorHandler
          key={businessError.id}
          error={businessError}
          onDismiss={() => removeError(businessError.id)}
          onRetry={handleBatchCalculate}
        />
      ))}

      {/* Azioni */}
      <div className="batch-actions">
        <button
          className="btn btn-primary"
          onClick={handleBatchCalculate}
          disabled={isCalculating || inputData.length === 0}
        >
          {isCalculating ? "Calcolando..." : "Calcola Batch"}
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          Pulisci
        </button>
        {results.length > 0 && (
          <button className="btn btn-success" onClick={handleExportExcel}>
            Esporta Excel
          </button>
        )}
      </div>

      {/* Risultati */}
      {results.length > 0 && (
        <div className="batch-results">
          <h4>Risultati ({results.length} calcoli)</h4>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Valuta Acquisto</th>
                  <th>Prezzo Acquisto</th>
                  <th>Valuta Vendita</th>
                  <th>Prezzo Vendita</th>
                  <th>Margine (%)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td>{result.purchaseCurrency}</td>
                    <td>{result.purchasePrice.toFixed(2)}</td>
                    <td>{result.sellingCurrency}</td>
                    <td>{result.sellingPrice.toFixed(2)}</td>
                    <td>{result.margin.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchCalculator;
