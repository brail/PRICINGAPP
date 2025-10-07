import React, { useState, useCallback, useRef } from "react";
import { CalculationMode } from "../types";
import { pricingApi } from "../services/api";
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
  const [inputMethod, setInputMethod] = useState<"paste" | "upload" | "manual">(
    "paste"
  );
  const [inputData, setInputData] = useState<number[] | number[][]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string>("");
  const [pasteText, setPasteText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualData, setManualData] = useState<number[]>([]);

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
        // Restituisci array di coppie per calcolo margine
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
      } else {
        // Restituisci array singolo per altri calcoli
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
      }
    },
    [calculationMode, cleanNumericValue]
  );

  // Gestione copia-incolla
  const handlePasteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setPasteText(text);
      const parsed = parsePasteData(text);
      setInputData(parsed);
      if (parsed.length === 0 && text.trim()) {
        setError("Nessun numero valido trovato");
      } else {
        setError("");
      }
    },
    [parsePasteData, calculationMode]
  );

  // Gestione upload file
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadedFile(file);
      setError("");

      // TODO: Implementare parsing file Excel
      // Per ora mostriamo solo il nome del file
      console.log("File caricato:", file.name);
    },
    []
  );

  // Gestione input manuale
  const handleManualDataChange = useCallback(
    (index: number, value: string) => {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0) {
        const newData = [...manualData];
        newData[index] = num;
        setManualData(newData);
        setInputData(newData.filter((n) => !isNaN(n)));
      }
    },
    [manualData]
  );

  const addManualRow = useCallback(() => {
    setManualData([...manualData, 0]);
  }, [manualData]);

  const removeManualRow = useCallback(
    (index: number) => {
      const newData = manualData.filter((_, i) => i !== index);
      setManualData(newData);
      setInputData(newData.filter((n) => !isNaN(n)));
    },
    [manualData]
  );

  // Calcolo batch
  const handleBatchCalculate = useCallback(async () => {
    if (inputData.length === 0) {
      setError("Inserisci almeno un valore");
      return;
    }

    if (inputData.length > 500) {
      setError("Massimo 500 valori consentiti");
      return;
    }

    setIsCalculating(true);
    setError("");

    try {
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
    } catch (err) {
      setError("Errore durante il calcolo batch");
      console.error("Batch calculation error:", err);
    } finally {
      setIsCalculating(false);
    }
  }, [inputData, calculationMode, onCalculate]);

  // Export Excel
  const handleExportExcel = useCallback(() => {
    if (results.length === 0) return;

    // TODO: Implementare export Excel
    console.log("Export Excel:", results);

    // Per ora mostriamo i dati in console in formato CSV
    const csvHeader =
      "Valuta Acquisto,Prezzo Acquisto,Valuta Vendita,Prezzo Vendita,Margine (%)";
    const csvRows = results.map(
      (result) =>
        `${result.purchaseCurrency},${result.purchasePrice.toFixed(2)},${
          result.sellingCurrency
        },${result.sellingPrice.toFixed(2)},${result.margin.toFixed(2)}%`
    );
    const csvContent = [csvHeader, ...csvRows].join("\n");

    console.log("CSV Content:");
    console.log(csvContent);
  }, [results]);

  // Reset
  const handleReset = useCallback(() => {
    setInputData([]);
    setResults([]);
    setPasteText("");
    setUploadedFile(null);
    setManualData([]);
    setError("");
  }, []);

  return (
    <div className="batch-calculator">
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
          <button
            className={`method-btn ${inputMethod === "manual" ? "active" : ""}`}
            onClick={() => setInputMethod("manual")}
          >
            Input Manuale
          </button>
        </div>
      </div>

      {/* Area input dati */}
      <div className="batch-input-area">
        {inputMethod === "paste" && (
          <div className="paste-input">
            <label>
              Incolla i dati (uno per riga o separati da punto e virgola ;):
            </label>
            <textarea
              value={pasteText}
              onChange={handlePasteChange}
              placeholder={
                calculationMode === "margin"
                  ? "Copia due colonne da Excel (acquisto e vendita) oppure usa: 10;20&#10;15;25&#10;20;30"
                  : "Esempio: 10;20;30 oppure 10&#10;20&#10;30"
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
            <label>Carica file Excel (.xlsx):</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
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

        {inputMethod === "manual" && (
          <div className="manual-input">
            <label>Inserisci i valori manualmente:</label>
            <div className="manual-values">
              {manualData.map((value, index) => (
                <div key={index} className="manual-row">
                  <input
                    type="number"
                    value={value || ""}
                    onChange={(e) =>
                      handleManualDataChange(index, e.target.value)
                    }
                    placeholder="Valore"
                    min="0"
                    step="0.01"
                  />
                  <button
                    className="remove-btn"
                    onClick={() => removeManualRow(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="add-btn" onClick={addManualRow}>
                + Aggiungi Valore
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Errori */}
      {error && <div className="batch-error">{error}</div>}

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
