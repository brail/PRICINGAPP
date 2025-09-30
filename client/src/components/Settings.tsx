import React, { useState, useEffect } from "react";
import { pricingApi } from "../services/api";
import { CalculationParams, CURRENCIES, ExchangeRates } from "../types";
import "./Settings.css";

const Settings: React.FC = () => {
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

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    loadSettings();
    loadExchangeRates();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const currentParams = await pricingApi.getParams();
      setParams(currentParams);
    } catch (err) {
      setError("Errore nel caricamento delle impostazioni");
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeRates = async () => {
    try {
      const rates = await pricingApi.getExchangeRates();
      setExchangeRates(rates);
    } catch (err) {
      console.error("Errore nel caricamento dei tassi di cambio:", err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await pricingApi.updateParams(params);
      setSuccess("Impostazioni salvate con successo!");

      // Pulisci il messaggio di successo dopo 3 secondi
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Errore nel salvataggio delle impostazioni");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setParams({
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
    setError("");
    setSuccess("");
  };

  const formatExchangeRate = (rate: number): string => {
    return rate.toFixed(4);
  };

  const getCurrencyName = (code: string): string => {
    const currency = CURRENCIES.find((c) => c.code === code);
    return currency ? currency.name : code;
  };

  if (loading) {
    return (
      <div className="settings">
        <div className="loading-container">
          <div className="loading"></div>
          <p>Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>Impostazioni</h2>
        <p className="text-muted">
          Configura i parametri di calcolo per la calcolatrice prezzi.
        </p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="settings-grid">
        {/* Parametri di Calcolo */}
        <div className="settings-card">
          <h3>Parametri di Calcolo</h3>

          <div className="form-group">
            <label className="form-label">Valuta acquisto</label>
            <select
              className="form-select"
              value={params.purchaseCurrency}
              onChange={(e) =>
                setParams({ ...params, purchaseCurrency: e.target.value })
              }
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <small className="form-help">
              Valuta utilizzata per il prezzo di acquisto
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Valuta vendita</label>
            <select
              className="form-select"
              value={params.sellingCurrency}
              onChange={(e) =>
                setParams({ ...params, sellingCurrency: e.target.value })
              }
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <small className="form-help">
              Valuta utilizzata per il prezzo di vendita
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              Percentuale Quality Control (%)
            </label>
            <input
              type="number"
              className="form-input"
              value={params.qualityControlPercent}
              onChange={(e) =>
                setParams({
                  ...params,
                  qualityControlPercent: Number(e.target.value),
                })
              }
              min="0"
              max="100"
              step="0.1"
            />
            <small className="form-help">
              Percentuale di quality control applicata al prezzo di acquisto
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">
              Costo trasporto + assicurazione
            </label>
            <input
              type="number"
              className="form-input"
              value={params.transportInsuranceCost}
              onChange={(e) =>
                setParams({
                  ...params,
                  transportInsuranceCost: Number(e.target.value),
                })
              }
              min="0"
              step="0.01"
            />
            <small className="form-help">
              Costo fisso di trasporto e assicurazione
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Dazio (%)</label>
            <input
              type="number"
              className="form-input"
              value={params.duty}
              onChange={(e) =>
                setParams({ ...params, duty: Number(e.target.value) })
              }
              min="0"
              max="100"
              step="0.1"
            />
            <small className="form-help">Percentuale di dazio applicata</small>
          </div>

          <div className="form-group">
            <label className="form-label">Tasso di cambio</label>
            <input
              type="number"
              className="form-input"
              value={params.exchangeRate}
              onChange={(e) =>
                setParams({ ...params, exchangeRate: Number(e.target.value) })
              }
              min="0.001"
              step="0.0001"
            />
            <small className="form-help">
              Tasso di cambio da valuta acquisto a valuta vendita
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Costi accessori Italia</label>
            <input
              type="number"
              className="form-input"
              value={params.italyAccessoryCosts}
              onChange={(e) =>
                setParams({
                  ...params,
                  italyAccessoryCosts: Number(e.target.value),
                })
              }
              min="0"
              step="0.01"
            />
            <small className="form-help">
              Costi accessori specifici per l'Italia
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Moltiplicatore aziendale</label>
            <input
              type="number"
              className="form-input"
              value={params.companyMultiplier}
              onChange={(e) =>
                setParams({
                  ...params,
                  companyMultiplier: Number(e.target.value),
                })
              }
              min="0.1"
              step="0.1"
            />
            <small className="form-help">
              Moltiplicatore per il prezzo aziendale
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Moltiplicatore retail</label>
            <input
              type="number"
              className="form-input"
              value={params.retailMultiplier}
              onChange={(e) =>
                setParams({
                  ...params,
                  retailMultiplier: Number(e.target.value),
                })
              }
              min="0.1"
              step="0.1"
            />
            <small className="form-help">
              Moltiplicatore per il prezzo retail finale
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Margine ottimale (%)</label>
            <input
              type="number"
              className="form-input"
              value={params.optimalMargin}
              onChange={(e) =>
                setParams({
                  ...params,
                  optimalMargin: Number(e.target.value),
                })
              }
              min="0"
              max="100"
              step="0.1"
            />
            <small className="form-help">Margine aziendale ottimale</small>
          </div>
        </div>

        {/* Tassi di Cambio */}
        <div className="settings-card">
          <h3>Tassi di Cambio</h3>
          <p className="text-muted mb-4">
            Tassi di cambio aggiornati automaticamente (base: EUR)
          </p>

          <div className="exchange-rates">
            {Object.entries(exchangeRates)
              .filter(([code]) => CURRENCIES.some((c) => c.code === code))
              .map(([code, rate]) => (
                <div key={code} className="exchange-rate-item">
                  <div className="rate-info">
                    <span className="rate-code">{code}</span>
                    <span className="rate-name">{getCurrencyName(code)}</span>
                  </div>
                  <span className="rate-value">{formatExchangeRate(rate)}</span>
                </div>
              ))}
          </div>

          <button
            className="btn btn-outline mt-4"
            onClick={loadExchangeRates}
            disabled={loading}
          >
            {loading ? <span className="loading"></span> : "Aggiorna Tassi"}
          </button>
        </div>
      </div>

      {/* Azioni */}
      <div className="settings-actions">
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={saving}
        >
          Ripristina Default
        </button>
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <span className="loading"></span>
              Salvataggio...
            </>
          ) : (
            "Salva Impostazioni"
          )}
        </button>
      </div>

      {/* Informazioni */}
      <div className="settings-info">
        <h4>Come funziona il calcolo</h4>
        <div className="calculation-steps">
          <div className="step">
            <span className="step-number">1</span>
            <div className="step-content">
              <strong>Prezzo di acquisto</strong>
              <p>Il prezzo base del prodotto</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <div className="step-content">
              <strong>+ Quality Control</strong>
              <p>Percentuale di quality control applicata</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <div className="step-content">
              <strong>+ Trasporto + Assicurazione</strong>
              <p>Costo fisso di trasporto e assicurazione</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <div className="step-content">
              <strong>+ Dazio</strong>
              <p>Percentuale di dazio applicata</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">5</span>
            <div className="step-content">
              <strong>+ Costi accessori Italia</strong>
              <p>Costi accessori specifici per l'Italia</p>
            </div>
          </div>
          <div className="step">
            <span className="step-number">6</span>
            <div className="step-content">
              <strong>× Moltiplicatore aziendale</strong>
              <p>Moltiplicatore per il prezzo aziendale</p>
            </div>
          </div>
          <div className="step final">
            <span className="step-number">7</span>
            <div className="step-content">
              <strong>× Moltiplicatore retail</strong>
              <p>Prezzo retail finale per il cliente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
