import React, { useState, useEffect } from "react";
import { pricingApi } from "../services/api";
import {
  CalculationParams,
  SellingPriceCalculation,
  PurchasePriceCalculation,
  CURRENCIES,
} from "../types";
import "./Calculator.css";

type CalculationMode = "purchase" | "selling" | "margin";

const Calculator: React.FC = () => {
  const [params, setParams] = useState<CalculationParams>({
    purchaseCurrency: "EUR",
    sellingCurrency: "EUR",
    qualityControlPercent: 5,
    transportInsuranceCost: 0,
    duty: 0,
    exchangeRate: 1,
    italyAccessoryCosts: 0,
    companyMultiplier: 1.5,
    retailMultiplier: 2.0,
    optimalMargin: 25,
  });

  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [retailPrice, setRetailPrice] = useState<string>("");
  const [mode, setMode] = useState<CalculationMode>("purchase");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [calculation, setCalculation] = useState<
    SellingPriceCalculation | PurchasePriceCalculation | null
  >(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Carica parametri iniziali
  useEffect(() => {
    loadParams();
  }, []);

  const loadParams = async () => {
    try {
      const currentParams = await pricingApi.getParams();
      setParams(currentParams);
    } catch (err) {
      setError("Errore nel caricamento dei parametri");
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    const currencyInfo = CURRENCIES.find((c) => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;

    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(currency, symbol);
  };

  const calculateFromPurchase = async () => {
    if (!purchasePrice || isNaN(Number(purchasePrice))) return;

    setLoading(true);
    setError("");

    try {
      const result = await pricingApi.calculateSellingPrice(
        Number(purchasePrice),
        params.sellingCurrency
      );
      setCalculation(result);
      // Aggiorna il campo retail price con il risultato del calcolo
      setRetailPrice(result.retailPrice.toFixed(2));
    } catch (err) {
      setError("Errore nel calcolo del prezzo di vendita");
    } finally {
      setLoading(false);
    }
  };

  const calculateFromSelling = async () => {
    if (!retailPrice || isNaN(Number(retailPrice))) return;

    setLoading(true);
    setError("");

    try {
      const result = await pricingApi.calculatePurchasePrice(
        Number(retailPrice),
        params.sellingCurrency
      );
      setCalculation(result);
      // Aggiorna il campo purchase price con il risultato del calcolo
      setPurchasePrice(result.purchasePrice.toFixed(2));
    } catch (err) {
      setError("Errore nel calcolo del prezzo di acquisto");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePriceChange = (value: string) => {
    setPurchasePrice(value);
    setMode("purchase");
    // Se c'è un calcolo precedente e l'utente modifica il prezzo di acquisto,
    // pulisci il prezzo di vendita per permettere un nuovo calcolo
    if (calculation) {
      setRetailPrice("");
    }
  };

  const handleRetailPriceChange = (value: string) => {
    setRetailPrice(value);
    setMode("selling");
    // Se c'è un calcolo precedente e l'utente modifica il prezzo di vendita,
    // pulisci il prezzo di acquisto per permettere un nuovo calcolo
    if (calculation) {
      setPurchasePrice("");
    }
  };

  const handlePurchasePriceBlur = () => {
    // Formatta il valore con sempre due decimali quando l'utente perde il focus
    const numericValue = parseFloat(purchasePrice);
    if (!isNaN(numericValue)) {
      setPurchasePrice(numericValue.toFixed(2));
    }
  };

  const handleRetailPriceBlur = () => {
    // Formatta il valore con sempre due decimali quando l'utente perde il focus
    const numericValue = parseFloat(retailPrice);
    if (!isNaN(numericValue)) {
      setRetailPrice(numericValue.toFixed(2));
    }
  };

  const handleCalculate = async () => {
    if (purchasePrice && !isNaN(Number(purchasePrice))) {
      await calculateFromPurchase();
    } else if (retailPrice && !isNaN(Number(retailPrice))) {
      await calculateFromSelling();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCalculate();
    }
  };

  const clearAll = () => {
    setPurchasePrice("");
    setRetailPrice("");
    setCalculation(null);
    setError("");
  };

  // Funzione per determinare il colore del margine basato sulla differenza con il margine ottimale
  const getMarginColor = (
    companyMargin: number,
    optimalMargin: number
  ): string => {
    const marginPercent = companyMargin * 100;
    const difference = marginPercent - optimalMargin;

    if (difference > 0) {
      // Margine maggiore del margine ottimale - verde più intenso
      return "margin-excellent";
    } else if (difference >= -2) {
      // Margine uguale o minore fino a 2 punti percentuali - verde normale
      return "margin-good";
    } else if (difference >= -3) {
      // Margine da 2 a 3 punti percentuali sotto l'ottimale - giallo
      return "margin-warning";
    } else {
      // Margine minore di 3 punti o più sotto l'ottimale - rosso
      return "margin-danger";
    }
  };

  return (
    <div className="calculator">
      <div className="calculator-header">
        <h2>Calcolatrice Prezzi</h2>
        <p className="text-muted">
          Inserisci un prezzo di acquisto per calcolare il prezzo retail, oppure
          inserisci un prezzo retail per calcolare il prezzo di acquisto
          necessario.
        </p>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Input Unificato */}
      <div className="input-card">
        <h3>Calcolo Prezzi</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Prezzo di acquisto ({params.purchaseCurrency})
            </label>
            <input
              type="number"
              className="form-input"
              value={purchasePrice}
              onChange={(e) => handlePurchasePriceChange(e.target.value)}
              onBlur={handlePurchasePriceBlur}
              onKeyDown={handleKeyPress}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Prezzo retail ({params.sellingCurrency})
            </label>
            <input
              type="number"
              className="form-input"
              value={retailPrice}
              onChange={(e) => handleRetailPriceChange(e.target.value)}
              onBlur={handleRetailPriceBlur}
              onKeyDown={handleKeyPress}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Margine Aziendale */}
        {calculation && (
          <div
            className={`margin-display ${getMarginColor(
              calculation.companyMargin,
              params.optimalMargin
            )}`}
          >
            <div className="margin-item">
              <span className="margin-label">Margine Aziendale:</span>
              <span className="margin-value">
                {(calculation.companyMargin * 100).toFixed(2)}% (richiesto:{" "}
                {params.optimalMargin}%)
              </span>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleCalculate}
          disabled={loading || (!purchasePrice && !retailPrice)}
        >
          {loading ? <span className="loading"></span> : "Calcola"}
        </button>
      </div>

      {/* Risultati Dettagliati */}
      {calculation && (
        <div className="results-card">
          <div className="results-header">
            <h3>Dettaglio Calcolo</h3>
            <div className="results-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Nascondi Dettagli" : "Mostra Dettagli"}
              </button>
              <button className="btn btn-secondary" onClick={clearAll}>
                Pulisci Tutto
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="results-grid">
              {mode === "purchase" && "retailPrice" in calculation && (
                <>
                  <div className="result-item">
                    <span className="result-label">Prezzo di acquisto:</span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.purchasePrice,
                        calculation.purchaseCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Quality Control (
                      {calculation.params.qualityControlPercent}
                      %):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.qualityControlCost,
                        calculation.purchaseCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Prezzo con Q.C.:</span>
                    <span className="result-value">
                      {formatCurrency(
                        "priceWithQC" in calculation
                          ? calculation.priceWithQC
                          : 0,
                        calculation.purchaseCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Trasporto + Assicurazione:
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.transportInsuranceCost,
                        calculation.purchaseCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Prezzo con trasporto:</span>
                    <span className="result-value">
                      {formatCurrency(
                        "priceWithTransport" in calculation
                          ? calculation.priceWithTransport
                          : 0,
                        calculation.purchaseCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Dazio ({calculation.params.duty}%):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.dutyCost,
                        calculation.purchaseCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Prezzo con dazio:</span>
                    <span className="result-value">
                      {formatCurrency(
                        "priceWithDuty" in calculation
                          ? calculation.priceWithDuty
                          : 0,
                        calculation.purchaseCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Costi accessori Italia:
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.italyAccessoryCosts,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Valore Landed:</span>
                    <span className="result-value">
                      {formatCurrency(
                        "landedCost" in calculation
                          ? calculation.landedCost
                          : 0,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Prezzo aziendale (×{calculation.params.companyMultiplier}
                      ):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.wholesalePrice,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item highlight">
                    <span className="result-label">
                      Prezzo retail finale (×
                      {calculation.params.retailMultiplier}
                      ):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        isNaN(calculation.retailPrice)
                          ? 0
                          : calculation.retailPrice,
                        calculation.sellingCurrency
                      )}{" "}
                      (
                      {formatCurrency(
                        isNaN(calculation.retailPriceRaw)
                          ? 0
                          : calculation.retailPriceRaw ||
                              calculation.retailPrice,
                        calculation.sellingCurrency
                      )}
                      )
                    </span>
                  </div>
                </>
              )}

              {mode === "selling" && "purchasePrice" in calculation && (
                <>
                  <div className="result-item highlight">
                    <span className="result-label">Prezzo retail:</span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.retailPrice,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Prezzo aziendale (÷{calculation.params.retailMultiplier}):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.wholesalePrice,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Prezzo senza moltiplicatori (÷
                      {calculation.params.companyMultiplier}):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        "landedCost" in calculation
                          ? calculation.landedCost
                          : 0,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Costi accessori Italia:
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.italyAccessoryCosts,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Prezzo senza accessori:
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        "priceWithoutAccessories" in calculation
                          ? calculation.priceWithoutAccessories
                          : 0,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Dazio ({calculation.params.duty}%):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.dutyCost,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Prezzo senza dazio:</span>
                    <span className="result-value">
                      {formatCurrency(
                        "priceWithoutDuty" in calculation
                          ? calculation.priceWithoutDuty
                          : 0,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Trasporto + Assicurazione:
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.transportInsuranceCost,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Prezzo senza trasporto:
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        "priceWithoutTransport" in calculation
                          ? calculation.priceWithoutTransport
                          : 0,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">
                      Quality Control (
                      {calculation.params.qualityControlPercent}
                      %):
                    </span>
                    <span className="result-value">
                      {formatCurrency(
                        calculation.qualityControlCost,
                        calculation.sellingCurrency
                      )}
                    </span>
                  </div>
                  <div className="result-item highlight">
                    <span className="result-label">Prezzo di acquisto:</span>
                    <span className="result-value">
                      {formatCurrency(
                        isNaN(calculation.purchasePrice)
                          ? 0
                          : calculation.purchasePrice,
                        calculation.purchaseCurrency
                      )}{" "}
                      (
                      {formatCurrency(
                        isNaN(
                          "purchasePriceRaw" in calculation
                            ? calculation.purchasePriceRaw
                            : calculation.purchasePrice
                        )
                          ? 0
                          : "purchasePriceRaw" in calculation
                          ? calculation.purchasePriceRaw
                          : calculation.purchasePrice,
                        calculation.purchaseCurrency
                      )}
                      )
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calculator;
