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
  const [purchasePriceLocked, setPurchasePriceLocked] =
    useState<boolean>(false);
  const [retailPriceLocked, setRetailPriceLocked] = useState<boolean>(false);
  const [mode, setMode] = useState<CalculationMode>("purchase");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [calculation, setCalculation] = useState<
    SellingPriceCalculation | PurchasePriceCalculation | null
  >(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [parameterSets, setParameterSets] = useState<any[]>([]);
  const [selectedParameterSetId, setSelectedParameterSetId] = useState<
    number | null
  >(null);
  const [loadingParameterSets, setLoadingParameterSets] = useState(false);

  // Carica parametri iniziali e set di parametri
  useEffect(() => {
    loadParams();
    loadParameterSets();
  }, []);

  const loadParams = async () => {
    try {
      const currentParams = await pricingApi.getParams();
      setParams(currentParams);
    } catch (err) {
      setError("Errore nel caricamento dei parametri");
    }
  };

  const loadParameterSets = async () => {
    try {
      setLoadingParameterSets(true);
      const sets = await pricingApi.getParameterSets();
      setParameterSets(sets);

      // Seleziona automaticamente il set "Parametri Default" se esiste
      const defaultSet = sets.find(
        (set) => set.description === "Parametri Default"
      );
      if (defaultSet) {
        setSelectedParameterSetId(defaultSet.id);
      }
    } catch (err) {
      setError("Errore nel caricamento dei set di parametri");
    } finally {
      setLoadingParameterSets(false);
    }
  };

  const handleParameterSetChange = async (parameterSetId: number) => {
    try {
      setLoadingParameterSets(true);
      const result = await pricingApi.loadParameterSet(parameterSetId);
      setParams(result.params);
      setSelectedParameterSetId(parameterSetId);
      setError("");
    } catch (err) {
      setError("Errore nel caricamento del set di parametri");
    } finally {
      setLoadingParameterSets(false);
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
      // Aggiorna il campo retail price con il risultato del calcolo solo se non è bloccato
      if (!retailPriceLocked) {
        setRetailPrice(result.retailPrice.toFixed(2));
      }
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
      // Aggiorna il campo purchase price con il risultato del calcolo solo se non è bloccato
      if (!purchasePriceLocked) {
        setPurchasePrice(result.purchasePrice.toFixed(2));
      }
    } catch (err) {
      setError("Errore nel calcolo del prezzo di acquisto");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePriceChange = (value: string) => {
    if (purchasePriceLocked) return; // Non modificare se bloccato
    setPurchasePrice(value);
    setMode("purchase");

    // Se il campo viene svuotato, sblocca automaticamente
    if (!value || isNaN(Number(value))) {
      setPurchasePriceLocked(false);
    }

    // NON pulire l'altro campo se è bloccato - deve mantenere il suo valore
    // Solo pulire se non c'è un lock attivo
    if (calculation && !retailPriceLocked) {
      setRetailPrice("");
    }
  };

  const handleRetailPriceChange = (value: string) => {
    if (retailPriceLocked) return; // Non modificare se bloccato
    setRetailPrice(value);
    setMode("selling");

    // Se il campo viene svuotato, sblocca automaticamente
    if (!value || isNaN(Number(value))) {
      setRetailPriceLocked(false);
    }

    // NON pulire l'altro campo se è bloccato - deve mantenere il suo valore
    // Solo pulire se non c'è un lock attivo
    if (calculation && !purchasePriceLocked) {
      setPurchasePrice("");
    }
  };

  const handlePurchasePriceBlur = () => {
    // Formatta il valore con sempre due decimali quando l'utente perde il focus
    const numericValue = parseFloat(purchasePrice);
    if (!isNaN(numericValue)) {
      setPurchasePrice(numericValue.toFixed(2));
    }

    // Se il retail price è bloccato, calcola automaticamente il margine
    if (retailPriceLocked && purchasePrice && !isNaN(Number(purchasePrice))) {
      calculateMarginFromLockedPrice();
    }
  };

  const handleRetailPriceBlur = () => {
    // Formatta il valore con sempre due decimali quando l'utente perde il focus
    const numericValue = parseFloat(retailPrice);
    if (!isNaN(numericValue)) {
      setRetailPrice(numericValue.toFixed(2));
    }

    // Se il purchase price è bloccato, calcola automaticamente il margine
    if (purchasePriceLocked && retailPrice && !isNaN(Number(retailPrice))) {
      calculateMarginFromLockedPrice();
    }
  };

  const handleCalculate = async () => {
    // Se c'è un prezzo bloccato, calcola il margine
    if (purchasePriceLocked || retailPriceLocked) {
      await calculateMarginFromLockedPrice();
    } else if (purchasePrice && !isNaN(Number(purchasePrice))) {
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

  const handlePurchasePriceLockToggle = () => {
    // Permetti di deselezionare il lock solo se il campo ha un valore valido
    if (
      purchasePriceLocked ||
      (purchasePrice && !isNaN(Number(purchasePrice)))
    ) {
      setPurchasePriceLocked(!purchasePriceLocked);
    }
  };

  const handleRetailPriceLockToggle = () => {
    // Permetti di deselezionare il lock solo se il campo ha un valore valido
    if (retailPriceLocked || (retailPrice && !isNaN(Number(retailPrice)))) {
      setRetailPriceLocked(!retailPriceLocked);
    }
  };

  // Funzione per calcolare il margine quando un prezzo è bloccato
  const calculateMarginFromLockedPrice = async () => {
    if (purchasePriceLocked && retailPrice && !isNaN(Number(retailPrice))) {
      // Purchase price è bloccato
      // landedCost = da calculateSellingPrice (con purchasePrice bloccato)
      // wholesalePrice = da calculatePurchasePrice (con retailPrice inserito nel form)
      try {
        // Calcola landedCost dal purchase price bloccato
        const sellingResult = await pricingApi.calculateSellingPrice(
          Number(purchasePrice),
          params.sellingCurrency
        );

        // Calcola wholesalePrice dal retail price inserito nel form
        const purchaseResult = await pricingApi.calculatePurchasePrice(
          Number(retailPrice),
          params.sellingCurrency
        );

        const retailPriceValue = Number(retailPrice);
        const landedCost = sellingResult.landedCost;
        const wholesalePrice = purchaseResult.wholesalePrice;
        const companyMargin = (wholesalePrice - landedCost) / wholesalePrice;

        // Crea un oggetto di calcolo personalizzato per il margine
        const marginCalculation = {
          ...sellingResult, // Usa sellingResult come base per mantenere i dettagli del calcolo diretto
          retailPrice: retailPriceValue,
          companyMargin: companyMargin,
        };

        setCalculation(marginCalculation);
      } catch (err) {
        setError("Errore nel calcolo del margine");
      }
    } else if (
      retailPriceLocked &&
      purchasePrice &&
      !isNaN(Number(purchasePrice))
    ) {
      // Retail price è bloccato
      // wholesalePrice = da calculatePurchasePrice (con retailPrice bloccato)
      // landedCost = da calculateSellingPrice (con purchasePrice inserito nel form)
      try {
        // Calcola wholesalePrice dal retail price bloccato
        const purchaseResult = await pricingApi.calculatePurchasePrice(
          Number(retailPrice),
          params.sellingCurrency
        );

        // Calcola landedCost dal purchase price inserito nel form
        const sellingResult = await pricingApi.calculateSellingPrice(
          Number(purchasePrice),
          params.sellingCurrency
        );

        const retailPriceValue = Number(retailPrice);
        const landedCost = sellingResult.landedCost;
        const wholesalePrice = purchaseResult.wholesalePrice;
        const companyMargin = (wholesalePrice - landedCost) / wholesalePrice;

        // Crea un oggetto di calcolo personalizzato per il margine
        const marginCalculation = {
          ...sellingResult, // Usa sellingResult come base per mantenere i dettagli del calcolo diretto
          retailPrice: retailPriceValue,
          companyMargin: companyMargin,
        };

        setCalculation(marginCalculation);
      } catch (err) {
        setError("Errore nel calcolo del margine");
      }
    }
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

        {/* Selezione Set di Parametri */}
        <div className="parameter-set-selector">
          <label className="form-label">Set di Parametri:</label>
          <select
            className="form-select"
            value={selectedParameterSetId || ""}
            onChange={(e) => handleParameterSetChange(Number(e.target.value))}
            disabled={loadingParameterSets}
          >
            <option value="">Seleziona un set di parametri...</option>
            {parameterSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.description}
              </option>
            ))}
          </select>
          {loadingParameterSets && (
            <span className="loading-text">Caricamento...</span>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Prezzo di acquisto ({params.purchaseCurrency})
            </label>
            <div className="input-with-lock">
              <input
                type="number"
                className={`form-input ${purchasePriceLocked ? "locked" : ""}`}
                value={purchasePrice}
                onChange={(e) => handlePurchasePriceChange(e.target.value)}
                onBlur={handlePurchasePriceBlur}
                onKeyDown={handleKeyPress}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={purchasePriceLocked}
              />
              <label className="lock-checkbox">
                <input
                  type="checkbox"
                  checked={purchasePriceLocked}
                  onChange={handlePurchasePriceLockToggle}
                  disabled={
                    (!purchasePrice || isNaN(Number(purchasePrice))) &&
                    !purchasePriceLocked
                  }
                />
                <span className="lock-icon">🔒</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              Prezzo retail ({params.sellingCurrency})
            </label>
            <div className="input-with-lock">
              <input
                type="number"
                className={`form-input ${retailPriceLocked ? "locked" : ""}`}
                value={retailPrice}
                onChange={(e) => handleRetailPriceChange(e.target.value)}
                onBlur={handleRetailPriceBlur}
                onKeyDown={handleKeyPress}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={retailPriceLocked}
              />
              <label className="lock-checkbox">
                <input
                  type="checkbox"
                  checked={retailPriceLocked}
                  onChange={handleRetailPriceLockToggle}
                  disabled={
                    (!retailPrice || isNaN(Number(retailPrice))) &&
                    !retailPriceLocked
                  }
                />
                <span className="lock-icon">🔒</span>
              </label>
            </div>
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
            <div className="margin-bar-container">
              <div className="margin-bar">
                <div
                  className="margin-bar-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, calculation.companyMargin * 100)
                    )}%`,
                  }}
                ></div>
                <div
                  className="margin-bar-target"
                  style={{
                    left: `${Math.min(
                      100,
                      Math.max(0, params.optimalMargin)
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="margin-bar-labels">
                <span>0%</span>
                <span className="target-label">
                  Target: {params.optimalMargin}%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleCalculate}
          disabled={loading || (!purchasePrice && !retailPrice)}
        >
          {loading ? (
            <span className="loading"></span>
          ) : purchasePriceLocked || retailPriceLocked ? (
            "Calcola Margine"
          ) : (
            "Calcola"
          )}
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
                            ? (calculation as any).purchasePriceRaw
                            : calculation.purchasePrice
                        )
                          ? 0
                          : "purchasePriceRaw" in calculation
                          ? (calculation as any).purchasePriceRaw
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
