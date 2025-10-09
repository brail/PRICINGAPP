import React, { useState, useEffect, useCallback, memo } from "react";
import { pricingApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useParameterManager } from "../hooks/useParameterManager";
import {
  useBusinessErrorHandler,
  createBusinessError,
} from "../hooks/useBusinessErrorHandler";
import { useNotification } from "../contexts/NotificationContext";
import { LoadingStates } from "./LoadingStates";
import CompactErrorHandler from "./CompactErrorHandler";
import {
  CalculationParams,
  SellingPriceCalculation,
  PurchasePriceCalculation,
  CURRENCIES,
} from "../types";
import BatchCalculator from "./BatchCalculator";
import Button from "./Button";
import Card from "./Card";
import LoadingSpinner from "./LoadingSpinner";
import "./Calculator.css";

type CalculationMode = "purchase" | "selling" | "margin";

const Calculator: React.FC = memo(() => {
  const { user } = useAuth();

  // Usa ParameterContext invece di stato locale
  const {
    currentParams: params,
    parameterSets,
    loading: paramsLoading,
    loadParameterSets,
    loadParameterSet,
  } = useParameterManager();

  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [retailPrice, setRetailPrice] = useState<string>("");
  const [purchasePriceLocked, setPurchasePriceLocked] =
    useState<boolean>(false);
  const [retailPriceLocked, setRetailPriceLocked] = useState<boolean>(false);
  const [mode, setMode] = useState<CalculationMode>("purchase");
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string>(""); // Sostituito da BusinessErrorHandler

  // Business error handler
  const { errors, addError, removeError, clearErrors } =
    useBusinessErrorHandler();

  // Notification system
  const { showSuccess } = useNotification();

  const [calculation, setCalculation] = useState<
    SellingPriceCalculation | PurchasePriceCalculation | null
  >(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [selectedParameterSetId, setSelectedParameterSetId] = useState<
    number | null
  >(null);
  // Stato per mostrare i dettagli dei parametri (rimosso - non utilizzato)
  // const [showParameterDetails, setShowParameterDetails] = useState(false);

  // Funzioni per gestire i parametri per utente (ora gestite da ParameterContext)
  const loadUserParameters = useCallback((): CalculationParams | null => {
    if (user) {
      const userSavedParams = localStorage.getItem(`userParams_${user.id}`);
      if (userSavedParams) {
        return JSON.parse(userSavedParams);
      }
    }
    return null;
  }, [user]);

  // Funzione per caricare i parametri di default (ora gestita da ParameterContext)

  const loadParams = useCallback(async () => {
    try {
      // Prima prova a caricare i parametri salvati per questo utente
      const userParams = loadUserParameters();
      if (userParams) {
        // I parametri utente sono gestiti dal ParameterContext
        setSelectedParameterSetId(null); // Parametri personalizzati dell'utente
        return;
      }

      // Se non ci sono parametri salvati per l'utente, carica i parametri globali
      // I parametri sono già caricati dal ParameterContext

      // DISABILITATO: Auto-selezione che interferiva con la selezione manuale
      // if (parameterSets.length > 0) {
      //   const matchingSet = parameterSets.find((set) => {
      //     return (
      //       set.purchase_currency === params.purchaseCurrency &&
      //       set.selling_currency === params.sellingCurrency &&
      //       set.quality_control_percent === params.qualityControlPercent &&
      //       set.transport_insurance_cost === params.transportInsuranceCost &&
      //       set.duty === params.duty &&
      //       set.exchange_rate === params.exchangeRate &&
      //       set.italy_accessory_costs === params.italyAccessoryCosts &&
      //       set.company_multiplier === params.companyMultiplier &&
      //       set.retail_multiplier === params.retailMultiplier &&
      //       set.optimal_margin === params.optimalMargin
      //     );
      //   });

      //   if (matchingSet) {
      //     setSelectedParameterSetId(matchingSet.id);
      //     // Parametri caricati da set salvato
      //   } else {
      //     // Parametri personalizzati
      //   }
      // }
    } catch (err) {
      console.error("Errore nel caricamento dei parametri:", err);
      addError(
        createBusinessError.system("Errore nel caricamento dei parametri")
      );
    }
  }, [loadUserParameters, addError]);

  // Carica parametri iniziali e set di parametri
  useEffect(() => {
    loadParameterSets();
  }, [loadParameterSets]);

  // Carica i parametri quando cambia l'utente (ora gestiti da ParameterContext)
  useEffect(() => {
    if (user) {
      loadParams();
    }
    // I parametri di default sono gestiti dal ParameterContext
  }, [user, loadParams]);

  // Aggiorna la selezione del set quando i parametri cambiano
  // DISABILITATO: Questo useEffect causava problemi di auto-selezione
  // che interferiva con la selezione manuale dell'utente
  // useEffect(() => {
  //   if (parameterSets.length > 0 && params) {
  //     const matchingSet = parameterSets.find((set) => {
  //       return (
  //         set.purchase_currency === params.purchaseCurrency &&
  //         set.selling_currency === params.sellingCurrency &&
  //         set.quality_control_percent === params.qualityControlPercent &&
  //         set.transport_insurance_cost === params.transportInsuranceCost &&
  //         set.duty === params.duty &&
  //         set.exchange_rate === params.exchangeRate &&
  //         set.italy_accessory_costs === params.italyAccessoryCosts &&
  //         set.tools === params.tools &&
  //         set.company_multiplier === params.companyMultiplier &&
  //         set.retail_multiplier === params.retailMultiplier &&
  //         set.optimal_margin === params.optimalMargin
  //       );
  //     });

  //     if (matchingSet) {
  //       // Parametri caricati da set salvato
  //       if (matchingSet.id !== selectedParameterSetId) {
  //         setSelectedParameterSetId(matchingSet.id);
  //       }
  //     } else {
  //       // Parametri personalizzati
  //       setSelectedParameterSetId(null);
  //     }
  //   }
  // }, [params, parameterSets, selectedParameterSetId]);

  const handleParameterSetChange = async (parameterSetId: number) => {
    if (!parameterSetId) {
      return; // Non fare nulla se non è selezionato un set valido
    }

    try {
      // Usa il ParameterContext per caricare il set
      await loadParameterSet(parameterSetId);
      // Mantieni la selezione manuale dell'utente
      setSelectedParameterSetId(parameterSetId);
      clearErrors();
    } catch (err) {
      addError(
        createBusinessError.system(
          "Errore nel caricamento del set di parametri"
        )
      );
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
    clearErrors();

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
      // Notifica di successo
      showSuccess(
        "Calcolo completato",
        `Prezzo di vendita calcolato: ${result.retailPrice.toFixed(2)} ${
          result.sellingCurrency
        }`
      );
    } catch (err) {
      addError(
        createBusinessError.calculation(
          "Errore nel calcolo del prezzo di vendita"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateFromSelling = async () => {
    if (!retailPrice || isNaN(Number(retailPrice))) return;

    setLoading(true);
    clearErrors();

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
      // Notifica di successo
      showSuccess(
        "Calcolo completato",
        `Prezzo di acquisto calcolato: ${result.purchasePrice.toFixed(2)} ${
          result.purchaseCurrency
        }`
      );
    } catch (err) {
      addError(
        createBusinessError.calculation(
          "Errore nel calcolo del prezzo di acquisto"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Funzione per calcoli batch
  const handleBatchCalculate = useCallback(
    async (
      mode: CalculationMode,
      input: number
    ): Promise<{
      purchasePrice: number;
      sellingPrice: number;
      margin: number;
      purchaseCurrency: string;
      sellingCurrency: string;
    }> => {
      try {
        if (mode === "purchase") {
          const result = await pricingApi.calculateSellingPrice(
            input,
            params.sellingCurrency
          );
          return {
            purchasePrice: result.purchasePrice,
            sellingPrice: result.retailPrice,
            margin: result.companyMargin * 100, // Converti in percentuale
            purchaseCurrency: result.purchaseCurrency,
            sellingCurrency: result.sellingCurrency,
          };
        } else if (mode === "selling") {
          const result = await pricingApi.calculatePurchasePrice(
            input,
            params.sellingCurrency
          );
          return {
            purchasePrice: result.purchasePrice,
            sellingPrice: result.retailPrice,
            margin: result.companyMargin * 100, // Converti in percentuale
            purchaseCurrency: result.purchaseCurrency,
            sellingCurrency: result.sellingCurrency,
          };
        } else {
          // Per il calcolo del margine, assumiamo che input sia il prezzo di vendita
          const result = await pricingApi.calculatePurchasePrice(
            input,
            params.sellingCurrency
          );
          return {
            purchasePrice: result.purchasePrice,
            sellingPrice: result.retailPrice,
            margin: result.companyMargin * 100, // Converti in percentuale
            purchaseCurrency: result.purchaseCurrency,
            sellingCurrency: result.sellingCurrency,
          };
        }
      } catch (err) {
        console.error("Batch calculation error:", err);
        throw err;
      }
    },
    [params.sellingCurrency]
  );

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

  // Funzione per arrotondare il prezzo retail finale (stessa logica del server)
  const roundRetailPrice = (price: number): number => {
    if (isNaN(price) || !isFinite(price) || price <= 0) {
      return 0;
    }

    // Se il prezzo è molto piccolo (meno di 10), arrotonda a 9.9
    if (price < 10) {
      return 9.9;
    }

    const integerPart = Math.floor(price);
    const decimalPart = price - integerPart;
    const tens = Math.floor(integerPart / 10) * 10;

    // Calcola la parte finale (cifra unità + decimale)
    const finalPart = (integerPart % 10) + decimalPart;

    if (finalPart >= 0.0 && finalPart <= 2.4) {
      // Arrotonda alla decina precedente + 9.9
      return Math.max(9.9, tens - 10 + 9.9);
    } else if (finalPart >= 2.5 && finalPart <= 7.4) {
      // Arrotonda alla decina corrente + 4.9
      return tens + 4.9;
    } else if (finalPart >= 7.5 && finalPart <= 9.9) {
      // Arrotonda alla decina corrente + 9.9
      return tens + 9.9;
    } else {
      // Fallback (non dovrebbe mai arrivare qui)
      return tens + 4.9;
    }
  };

  // Gestore per le freccette del retail price (step di 5.00)
  const handleRetailPriceArrowKey = (direction: "up" | "down") => {
    if (retailPriceLocked) return;

    const currentValue = parseFloat(retailPrice) || 0;

    // Prima arrotonda usando la logica del server
    const roundedCurrentValue = roundRetailPrice(currentValue);

    // Poi aggiungi o sottrai 5.0
    const step = direction === "up" ? 5.0 : -5.0;
    const newValue = roundedCurrentValue + step;

    // Arrotonda nuovamente usando la logica del server
    const finalValue = roundRetailPrice(newValue);

    setRetailPrice(finalValue.toFixed(2));
    setMode("selling");

    // Se il purchase price è bloccato, calcola automaticamente il margine
    if (purchasePriceLocked) {
      setTimeout(() => calculateMarginFromLockedPrice(), 100);
    }
  };

  const handleCalculate = async () => {
    try {
      // Pulisci errori precedenti
      clearErrors();

      // Validazione input
      if (!purchasePrice && !retailPrice) {
        addError(
          createBusinessError.validation(
            "Per procedere con il calcolo, inserisci almeno un prezzo (acquisto o vendita)",
            "prezzo",
            [
              "💡 Inserisci il prezzo di acquisto per calcolare il prezzo di vendita",
              "💡 Inserisci il prezzo di vendita per calcolare il prezzo di acquisto",
              "💡 Oppure inserisci entrambi per calcolare il margine aziendale",
            ]
          )
        );
        return;
      }

      if (purchasePrice && isNaN(Number(purchasePrice))) {
        addError(
          createBusinessError.validation(
            "Il prezzo di acquisto deve essere un valore numerico valido",
            "purchasePrice",
            [
              "💡 Inserisci solo numeri (es: 25.50)",
              "💡 Usa il punto come separatore decimale",
              "💡 Evita caratteri speciali o lettere",
            ]
          )
        );
        return;
      }

      if (retailPrice && isNaN(Number(retailPrice))) {
        addError(
          createBusinessError.validation(
            "Il prezzo di vendita deve essere un valore numerico valido",
            "retailPrice",
            [
              "💡 Inserisci solo numeri (es: 45.99)",
              "💡 Usa il punto come separatore decimale",
              "💡 Evita caratteri speciali o lettere",
            ]
          )
        );
        return;
      }

      // Se c'è un prezzo bloccato, calcola il margine
      if (purchasePriceLocked || retailPriceLocked) {
        await calculateMarginFromLockedPrice();
      } else if (purchasePrice && !isNaN(Number(purchasePrice))) {
        await calculateFromPurchase();
      } else if (retailPrice && !isNaN(Number(retailPrice))) {
        await calculateFromSelling();
      }
    } catch (error: any) {
      console.error("Errore nel calcolo:", error);

      // Crea errore business-specific
      addError(
        createBusinessError.calculation(
          error.message || "Errore durante il calcolo",
          {
            purchasePrice,
            retailPrice,
            mode,
            timestamp: new Date().toISOString(),
          }
        )
      );

      // setError("Errore durante il calcolo"); // Sostituito da BusinessErrorHandler
    }
  };

  // Gestore specifico per le freccette del purchase price
  // const handlePurchasePriceKeyDown = (e: React.KeyboardEvent) => {
  //   if (e.key === "Enter") {
  //     handleCalculate();
  //   } else if (e.key === "ArrowUp") {
  //     e.preventDefault();
  //     handlePurchasePriceArrowKey("up");
  //   } else if (e.key === "ArrowDown") {
  //     e.preventDefault();
  //     handlePurchasePriceArrowKey("down");
  //   }
  // };

  // Gestore specifico per le freccette del retail price
  const handleRetailPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCalculate();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleRetailPriceArrowKey("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleRetailPriceArrowKey("down");
    }
  };

  const clearAll = () => {
    setPurchasePrice("");
    setRetailPrice("");
    setCalculation(null);
    clearErrors();
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
      try {
        // Usa il nuovo endpoint per calcolare il margine
        const marginResult = await pricingApi.calculateMargin(
          Number(purchasePrice),
          Number(retailPrice)
        );

        // Crea un oggetto di calcolo personalizzato per il margine
        const marginCalculation = {
          purchasePrice: marginResult.purchasePrice,
          retailPrice: marginResult.retailPrice,
          landedCost: marginResult.landedCost,
          wholesalePrice: marginResult.wholesalePrice,
          companyMargin: marginResult.companyMargin,
          purchaseCurrency: marginResult.purchaseCurrency,
          sellingCurrency: marginResult.sellingCurrency,
          params: marginResult.params,
          // Mantieni i dettagli del calcolo per compatibilità
          qualityControlCost: 0,
          priceWithQC: 0,
          transportInsuranceCost: 0,
          priceWithTransport: 0,
          dutyCost: 0,
          priceWithDuty: 0,
          italyAccessoryCosts: 0,
          retailPriceRaw: marginResult.retailPrice,
        };

        setCalculation(marginCalculation);
      } catch (err) {
        addError(
          createBusinessError.calculation("Errore nel calcolo del margine")
        );
      }
    } else if (
      retailPriceLocked &&
      purchasePrice &&
      !isNaN(Number(purchasePrice))
    ) {
      // Retail price è bloccato
      try {
        // Usa il nuovo endpoint per calcolare il margine
        const marginResult = await pricingApi.calculateMargin(
          Number(purchasePrice),
          Number(retailPrice)
        );

        // Crea un oggetto di calcolo personalizzato per il margine
        const marginCalculation = {
          purchasePrice: marginResult.purchasePrice,
          retailPrice: marginResult.retailPrice,
          landedCost: marginResult.landedCost,
          wholesalePrice: marginResult.wholesalePrice,
          companyMargin: marginResult.companyMargin,
          purchaseCurrency: marginResult.purchaseCurrency,
          sellingCurrency: marginResult.sellingCurrency,
          params: marginResult.params,
          // Mantieni i dettagli del calcolo per compatibilità
          qualityControlCost: 0,
          priceWithQC: 0,
          transportInsuranceCost: 0,
          priceWithTransport: 0,
          dutyCost: 0,
          priceWithDuty: 0,
          italyAccessoryCosts: 0,
          retailPriceRaw: marginResult.retailPrice,
        };

        setCalculation(marginCalculation);
      } catch (err) {
        addError(
          createBusinessError.calculation("Errore nel calcolo del margine")
        );
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
          Inserisci un prezzo per calcolare l'altro automaticamente
        </p>
      </div>

      {/* Sistema errori vecchio disabilitato - sostituito da BusinessErrorHandler */}
      {/* {error && <div className="error">{error}</div>} */}

      {/* Compact Error Handler */}
      {errors.map((businessError) => (
        <CompactErrorHandler
          key={businessError.id}
          error={businessError}
          onDismiss={() => removeError(businessError.id)}
          onRetry={handleCalculate}
        />
      ))}

      {/* Layout principale con focus sui prezzi */}
      <div className="calculator-main-layout">
        {/* Sezione principale - Form prezzi */}
        <Card variant="elevated" padding="lg">
          <div className="input-card-header">
            <h3>Calcolo Prezzi</h3>
            <Button variant="secondary" onClick={clearAll}>
              Pulisci
            </Button>
          </div>

          <div className="price-form-grid">
            <div className="price-input-group">
              <label className="form-label">
                Prezzo di acquisto ({params.purchaseCurrency})
              </label>
              <div className="input-with-lock">
                <input
                  type="number"
                  className={`form-input ${
                    purchasePriceLocked ? "locked" : ""
                  }`}
                  value={purchasePrice}
                  onChange={(e) => handlePurchasePriceChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCalculate();
                    }
                  }}
                  onWheel={(e) => e.preventDefault()}
                  onFocus={(e) => {
                    e.target.addEventListener(
                      "wheel",
                      (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      },
                      { passive: false }
                    );
                  }}
                  onBlur={(e) => {
                    handlePurchasePriceBlur();
                    e.target.removeEventListener("wheel", (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    });
                  }}
                  placeholder="0.00"
                  step="0.10"
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
            <div className="price-input-group">
              <label className="form-label">
                Prezzo retail ({params.sellingCurrency})
              </label>
              <div className="input-with-lock">
                <input
                  type="number"
                  className={`form-input ${retailPriceLocked ? "locked" : ""}`}
                  value={retailPrice}
                  onChange={(e) => handleRetailPriceChange(e.target.value)}
                  onKeyDown={handleRetailPriceKeyDown}
                  onWheel={(e) => e.preventDefault()}
                  onFocus={(e) => {
                    e.target.addEventListener(
                      "wheel",
                      (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      },
                      { passive: false }
                    );
                  }}
                  onBlur={(e) => {
                    handleRetailPriceBlur();
                    e.target.removeEventListener("wheel", (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    });
                  }}
                  placeholder="0.00"
                  step="5.00"
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

          <Button
            variant="primary"
            onClick={handleCalculate}
            disabled={loading || (!purchasePrice && !retailPrice)}
          >
            {loading ? (
              <LoadingSpinner size="sm" color="white" />
            ) : purchasePriceLocked || retailPriceLocked ? (
              "Calcola Margine"
            ) : (
              "Calcola"
            )}
          </Button>
        </Card>

        {/* Preview in tempo reale - DISABILITATO TEMPORANEAMENTE */}
        {/* 
        {params && (
          <RealtimePreview
            inputValue={purchasePrice ? Number(purchasePrice) : null}
            calculationType="purchase"
            params={params}
            onCalculate={async (value) => {
              const result = await pricingApi.calculateSellingPrice(
                value,
                params.sellingCurrency
              );
              return result;
            }}
            enabled={!purchasePriceLocked && !retailPriceLocked}
            showDetails={false}
          />
        )}
        */}

        {/* Sidebar con parametri compatti */}
        <div className="sidebar-section">
          {/* Selezione Template Prezzi */}
          <Card variant="outlined" padding="md">
            <h4>Parametri</h4>
            <div className="form-group">
              <label className="form-label">Template Prezzi:</label>
              <select
                className="form-select"
                value={selectedParameterSetId || ""}
                onChange={(e) =>
                  handleParameterSetChange(Number(e.target.value))
                }
                disabled={paramsLoading}
              >
                {parameterSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.description}
                  </option>
                ))}
              </select>
              {paramsLoading && (
                <LoadingStates
                  type="inline"
                  message="Caricamento parametri..."
                  size="small"
                  color="primary"
                />
              )}
            </div>
          </Card>

          {/* Dettagli Template Prezzi Caricato - Compatti */}
          {params && (
            <Card variant="outlined" padding="md">
              <div className="parameter-summary">
                <div className="parameter-item-compact">
                  <span className="parameter-label">Valuta:</span>
                  <span className="parameter-value">
                    {params.purchaseCurrency} → {params.sellingCurrency}
                  </span>
                </div>
                <div className="parameter-item-compact">
                  <span className="parameter-label">Target:</span>
                  <span className="parameter-value">
                    {params.optimalMargin}%
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Risultati Dettagliati */}
      {calculation && (
        <Card variant="elevated" padding="lg">
          <div className="results-header">
            <h3>Dettaglio Calcolo</h3>
            <div className="results-actions">
              <Button
                variant="primary"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Nascondi Dettagli" : "Mostra Dettagli"}
              </Button>
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
                    <span className="result-label">Tools:</span>
                    <span className="result-value">
                      {formatCurrency(params.tools, params.purchaseCurrency)}
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
                    <span className="result-label">
                      Prezzo con Q.C. e Tools:
                    </span>
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
                      Prezzo aziendale (×
                      {calculation.params.companyMultiplier.toFixed(2)}
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
                      {calculation.params.companyMultiplier.toFixed(2)}):
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
                    <span className="result-label">Tools:</span>
                    <span className="result-value">
                      {formatCurrency(params.tools, params.purchaseCurrency)}
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
        </Card>
      )}

      {/* Sezione Calcolo Batch */}
      <BatchCalculator
        params={params}
        onCalculate={handleBatchCalculate as any}
      />
    </div>
  );
});

Calculator.displayName = "Calculator";

export default Calculator;
