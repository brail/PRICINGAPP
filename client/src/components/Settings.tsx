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

  // Stati per la gestione dei set di parametri
  const [parameterSets, setParameterSets] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingParameterSet, setEditingParameterSet] = useState<any | null>(
    null
  );
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [newParameterSet, setNewParameterSet] = useState<{
    description: string;
    purchaseCurrency: string;
    sellingCurrency: string;
    qualityControlPercent: string | number;
    transportInsuranceCost: string | number;
    duty: string | number;
    exchangeRate: string | number;
    italyAccessoryCosts: string | number;
    companyMultiplier: string | number;
    retailMultiplier: string | number;
    optimalMargin: string | number;
  }>({
    description: "",
    purchaseCurrency: "",
    sellingCurrency: "",
    qualityControlPercent: "",
    transportInsuranceCost: "",
    duty: "",
    exchangeRate: "",
    italyAccessoryCosts: "",
    companyMultiplier: "",
    retailMultiplier: "",
    optimalMargin: "",
  });

  useEffect(() => {
    loadSettings();
    loadExchangeRates();
    loadParameterSets();
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

  // Funzioni per la gestione dei set di parametri
  const loadParameterSets = async () => {
    try {
      const sets = await pricingApi.getParameterSets();
      setParameterSets(sets);
    } catch (err) {
      setError("Errore nel caricamento dei set di parametri");
    }
  };

  const resetCreateForm = () => {
    setNewParameterSet({
      description: "",
      purchaseCurrency: "",
      sellingCurrency: "",
      qualityControlPercent: "",
      transportInsuranceCost: "",
      duty: "",
      exchangeRate: "",
      italyAccessoryCosts: "",
      companyMultiplier: "",
      retailMultiplier: "",
      optimalMargin: "",
    });
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!newParameterSet.description.trim()) {
      errors.push("Descrizione è obbligatoria");
    }

    if (!newParameterSet.purchaseCurrency) {
      errors.push("Valuta acquisto è obbligatoria");
    }

    if (!newParameterSet.sellingCurrency) {
      errors.push("Valuta vendita è obbligatoria");
    }

    if (
      newParameterSet.qualityControlPercent === "" ||
      newParameterSet.qualityControlPercent === null ||
      newParameterSet.qualityControlPercent === undefined
    ) {
      errors.push("Quality Control (%) è obbligatorio");
    }

    if (
      newParameterSet.transportInsuranceCost === "" ||
      newParameterSet.transportInsuranceCost === null ||
      newParameterSet.transportInsuranceCost === undefined
    ) {
      errors.push("Trasporto + Assicurazione è obbligatorio");
    }

    if (
      newParameterSet.duty === "" ||
      newParameterSet.duty === null ||
      newParameterSet.duty === undefined
    ) {
      errors.push("Dazio (%) è obbligatorio");
    }

    if (
      newParameterSet.exchangeRate === "" ||
      newParameterSet.exchangeRate === null ||
      newParameterSet.exchangeRate === undefined
    ) {
      errors.push("Cambio è obbligatorio");
    }

    if (
      newParameterSet.italyAccessoryCosts === "" ||
      newParameterSet.italyAccessoryCosts === null ||
      newParameterSet.italyAccessoryCosts === undefined
    ) {
      errors.push("Costi accessori Italia è obbligatorio");
    }

    if (
      newParameterSet.companyMultiplier === "" ||
      newParameterSet.companyMultiplier === null ||
      newParameterSet.companyMultiplier === undefined
    ) {
      errors.push("Moltiplicatore aziendale è obbligatorio");
    }

    if (
      newParameterSet.retailMultiplier === "" ||
      newParameterSet.retailMultiplier === null ||
      newParameterSet.retailMultiplier === undefined
    ) {
      errors.push("Moltiplicatore retail è obbligatorio");
    }

    if (
      newParameterSet.optimalMargin === "" ||
      newParameterSet.optimalMargin === null ||
      newParameterSet.optimalMargin === undefined
    ) {
      errors.push("Margine ottimale (%) è obbligatorio");
    }

    return errors;
  };

  const validateEditForm = () => {
    const errors: string[] = [];

    if (!editingParameterSet?.description?.trim()) {
      errors.push("Descrizione è obbligatoria");
    }

    if (!editingParameterSet?.purchase_currency) {
      errors.push("Valuta acquisto è obbligatoria");
    }

    if (!editingParameterSet?.selling_currency) {
      errors.push("Valuta vendita è obbligatoria");
    }

    if (
      editingParameterSet?.quality_control_percent === "" ||
      editingParameterSet?.quality_control_percent === null ||
      editingParameterSet?.quality_control_percent === undefined ||
      isNaN(Number(editingParameterSet?.quality_control_percent))
    ) {
      errors.push("Quality Control (%) è obbligatorio");
    }

    if (
      editingParameterSet?.transport_insurance_cost === "" ||
      editingParameterSet?.transport_insurance_cost === null ||
      editingParameterSet?.transport_insurance_cost === undefined ||
      isNaN(Number(editingParameterSet?.transport_insurance_cost))
    ) {
      errors.push("Trasporto + Assicurazione è obbligatorio");
    }

    if (
      editingParameterSet?.duty === "" ||
      editingParameterSet?.duty === null ||
      editingParameterSet?.duty === undefined ||
      isNaN(Number(editingParameterSet?.duty))
    ) {
      errors.push("Dazio (%) è obbligatorio");
    }

    if (
      editingParameterSet?.exchange_rate === "" ||
      editingParameterSet?.exchange_rate === null ||
      editingParameterSet?.exchange_rate === undefined ||
      isNaN(Number(editingParameterSet?.exchange_rate))
    ) {
      errors.push("Cambio è obbligatorio");
    }

    if (
      editingParameterSet?.italy_accessory_costs === "" ||
      editingParameterSet?.italy_accessory_costs === null ||
      editingParameterSet?.italy_accessory_costs === undefined ||
      isNaN(Number(editingParameterSet?.italy_accessory_costs))
    ) {
      errors.push("Costi accessori Italia è obbligatorio");
    }

    if (
      editingParameterSet?.company_multiplier === "" ||
      editingParameterSet?.company_multiplier === null ||
      editingParameterSet?.company_multiplier === undefined ||
      isNaN(Number(editingParameterSet?.company_multiplier))
    ) {
      errors.push("Moltiplicatore aziendale è obbligatorio");
    }

    if (
      editingParameterSet?.retail_multiplier === "" ||
      editingParameterSet?.retail_multiplier === null ||
      editingParameterSet?.retail_multiplier === undefined ||
      isNaN(Number(editingParameterSet?.retail_multiplier))
    ) {
      errors.push("Moltiplicatore retail è obbligatorio");
    }

    if (
      editingParameterSet?.optimal_margin === "" ||
      editingParameterSet?.optimal_margin === null ||
      editingParameterSet?.optimal_margin === undefined ||
      isNaN(Number(editingParameterSet?.optimal_margin))
    ) {
      errors.push("Margine ottimale (%) è obbligatorio");
    }

    return errors;
  };

  const handleCreateParameterSet = async () => {
    // Validazione del form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError("Errore di validazione: " + validationErrors.join(", "));
      return;
    }

    try {
      setSaving(true);

      // Converti valori in numeri (ora sappiamo che non sono vuoti)
      const parameterSetToCreate = {
        description: newParameterSet.description,
        purchaseCurrency: newParameterSet.purchaseCurrency,
        sellingCurrency: newParameterSet.sellingCurrency,
        qualityControlPercent: Number(newParameterSet.qualityControlPercent),
        transportInsuranceCost: Number(newParameterSet.transportInsuranceCost),
        duty: Number(newParameterSet.duty),
        exchangeRate: Number(newParameterSet.exchangeRate),
        italyAccessoryCosts: Number(newParameterSet.italyAccessoryCosts),
        companyMultiplier: Number(newParameterSet.companyMultiplier),
        retailMultiplier: Number(newParameterSet.retailMultiplier),
        optimalMargin: Number(newParameterSet.optimalMargin),
      };

      await pricingApi.createParameterSet(parameterSetToCreate);
      setSuccess("Set di parametri creato con successo");
      resetCreateForm();
      setShowCreateForm(false);
      await loadParameterSets();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Errore nella creazione del set di parametri"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateParameterSet = async () => {
    if (!editingParameterSet) return;

    // Validazione del form
    const validationErrors = validateEditForm();
    if (validationErrors.length > 0) {
      setError("Errore di validazione: " + validationErrors.join(", "));
      return;
    }

    try {
      setSaving(true);

      // Converti i dati da snake_case a camelCase per il backend
      const parameterSetToUpdate = {
        description: editingParameterSet.description,
        purchaseCurrency: editingParameterSet.purchase_currency,
        sellingCurrency: editingParameterSet.selling_currency,
        qualityControlPercent: Number(
          editingParameterSet.quality_control_percent
        ),
        transportInsuranceCost: Number(
          editingParameterSet.transport_insurance_cost
        ),
        duty: Number(editingParameterSet.duty),
        exchangeRate: Number(editingParameterSet.exchange_rate),
        italyAccessoryCosts: Number(editingParameterSet.italy_accessory_costs),
        companyMultiplier: Number(editingParameterSet.company_multiplier),
        retailMultiplier: Number(editingParameterSet.retail_multiplier),
        optimalMargin: Number(editingParameterSet.optimal_margin),
      };

      await pricingApi.updateParameterSet(
        editingParameterSet.id,
        parameterSetToUpdate
      );
      setSuccess("Set di parametri aggiornato con successo");
      setEditingParameterSet(null);
      await loadParameterSets();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Errore nell'aggiornamento del set di parametri"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParameterSet = async (id: number) => {
    if (
      !window.confirm("Sei sicuro di voler eliminare questo set di parametri?")
    ) {
      return;
    }

    try {
      setSaving(true);
      await pricingApi.deleteParameterSet(id);
      setSuccess("Set di parametri eliminato con successo");
      await loadParameterSets();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Errore nell'eliminazione del set di parametri"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLoadParameterSet = async (id: number) => {
    try {
      setSaving(true);
      const result = await pricingApi.loadParameterSet(id);
      setParams(result.params);
      setSuccess("Set di parametri caricato con successo");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Errore nel caricamento del set di parametri"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultParameterSet = async (id: number) => {
    try {
      setSaving(true);
      await pricingApi.setDefaultParameterSet(id);
      setSuccess("Set di parametri impostato come default");
      await loadParameterSets();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Errore nell'impostazione del set di parametri come default"
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditingParameterSet = (parameterSet: any) => {
    setEditingParameterSet({ ...parameterSet });
  };

  const cancelEditingParameterSet = () => {
    setEditingParameterSet(null);
  };

  const toggleCardExpansion = (id: number) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(id)) {
      newExpandedCards.delete(id);
    } else {
      newExpandedCards.add(id);
    }
    setExpandedCards(newExpandedCards);
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
        {/* Parametri di Calcolo - Temporaneamente nascosto */}
        {/* <div className="settings-card">
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
        </div> */}

        {/* Gestione Set di Parametri */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>Gestione Set di Parametri</h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!showCreateForm) {
                  resetCreateForm();
                }
                setShowCreateForm(!showCreateForm);
              }}
            >
              {showCreateForm ? "Annulla" : "Crea Nuovo Set"}
            </button>
          </div>

          <div className="parameter-sets-management">
            {/* Lista Set di Parametri */}
            <div className="parameter-sets-list">
              <h4>Set di Parametri Esistenti</h4>
              {parameterSets.length === 0 ? (
                <p className="text-muted">Nessun set di parametri trovato.</p>
              ) : (
                <div className="parameter-sets-grid">
                  {parameterSets.map((set) => (
                    <div 
                      key={set.id} 
                      className="parameter-set-card"
                      onClick={() => toggleCardExpansion(set.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="parameter-set-header">
                        <h5>
                          {!!set.is_default && (
                            <span className="default-star">⭐</span>
                          )}
                          {set.description}
                        </h5>
                        <div className="parameter-set-actions">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadParameterSet(set.id);
                            }}
                            disabled={saving}
                          >
                            Carica
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingParameterSet(set);
                            }}
                            disabled={saving}
                          >
                            Modifica
                          </button>
                          {!set.is_default && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefaultParameterSet(set.id);
                              }}
                              disabled={saving}
                            >
                              ⭐ Default
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteParameterSet(set.id);
                            }}
                            disabled={saving || set.is_default}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                      {expandedCards.has(set.id) && (
                        <div className="parameter-set-details">
                          <p>
                            <strong>Valute:</strong> {set.purchase_currency} →{" "}
                            {set.selling_currency}
                          </p>
                          <p>
                            <strong>Quality Control:</strong>{" "}
                            {set.quality_control_percent}%
                          </p>
                          <p>
                            <strong>Trasporto + Assicurazione:</strong>{" "}
                            {set.transport_insurance_cost}
                          </p>
                          <p>
                            <strong>Dazio:</strong> {set.duty}%
                          </p>
                          <p>
                            <strong>Tasso di Cambio:</strong>{" "}
                            {set.exchange_rate}
                          </p>
                          <p>
                            <strong>Costi Accessori Italia:</strong>{" "}
                            {set.italy_accessory_costs}
                          </p>
                          <p>
                            <strong>Moltiplicatori:</strong> Aziendale:{" "}
                            {set.company_multiplier}, Retail:{" "}
                            {set.retail_multiplier}
                          </p>
                          <p>
                            <strong>Margine ottimale:</strong>{" "}
                            {set.optimal_margin}%
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form per Creare Nuovo Set */}
            {showCreateForm && (
              <div className="new-parameter-set-form">
                <h4>Crea Nuovo Set di Parametri</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Descrizione *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newParameterSet.description}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          description: e.target.value,
                        })
                      }
                      placeholder="Nome del set di parametri"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valuta acquisto *</label>
                    <select
                      className="form-select"
                      value={newParameterSet.purchaseCurrency}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          purchaseCurrency: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleziona valuta</option>
                      {CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valuta vendita *</label>
                    <select
                      className="form-select"
                      value={newParameterSet.sellingCurrency}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          sellingCurrency: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleziona valuta</option>
                      {CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quality Control (%) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.qualityControlPercent}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          qualityControlPercent:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Trasporto + Assicurazione *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.transportInsuranceCost}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          transportInsuranceCost:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Dazio (%) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.duty}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          duty:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cambio *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.exchangeRate}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          exchangeRate:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Costi accessori Italia *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.italyAccessoryCosts}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          italyAccessoryCosts:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Moltiplicatore aziendale *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.companyMultiplier}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          companyMultiplier:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0.1"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Moltiplicatore retail *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.retailMultiplier}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          retailMultiplier:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0.1"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Margine ottimale (%) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.optimalMargin}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          optimalMargin:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleCreateParameterSet}
                  disabled={saving || validateForm().length > 0}
                >
                  {saving ? "Creazione..." : "Crea Set di Parametri"}
                </button>
              </div>
            )}

            {/* Form per Modificare Set Esistente */}
            {editingParameterSet && (
              <div className="edit-parameter-set-form">
                <h4>
                  Modifica Set di Parametri: {editingParameterSet.description}
                </h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Descrizione *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingParameterSet.description}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          description: e.target.value,
                        })
                      }
                      placeholder="Nome del set di parametri"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valuta acquisto *</label>
                    <select
                      className="form-select"
                      value={editingParameterSet.purchase_currency}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          purchase_currency: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleziona valuta</option>
                      {CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valuta vendita *</label>
                    <select
                      className="form-select"
                      value={editingParameterSet.selling_currency}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          selling_currency: e.target.value,
                        })
                      }
                    >
                      <option value="">Seleziona valuta</option>
                      {CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quality Control (%) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.quality_control_percent}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          quality_control_percent:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Trasporto + Assicurazione *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.transport_insurance_cost}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          transport_insurance_cost:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Dazio (%) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.duty}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          duty:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cambio *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.exchange_rate}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          exchange_rate:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Costi accessori Italia *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.italy_accessory_costs}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          italy_accessory_costs:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Moltiplicatore aziendale *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.company_multiplier}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          company_multiplier:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0.1"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      Moltiplicatore retail *
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.retail_multiplier}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          retail_multiplier:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0.1"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Margine ottimale (%) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.optimal_margin}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          optimal_margin:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateParameterSet}
                    disabled={saving || validateEditForm().length > 0}
                  >
                    {saving ? "Aggiornamento..." : "Aggiorna Set"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={cancelEditingParameterSet}
                    disabled={saving}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tassi di Cambio - Temporaneamente nascosto */}
        {/* <div className="settings-card">
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
        </div> */}
      </div>

      {/* Azioni */}
      {/* Azioni di salvataggio - Temporaneamente nascoste */}
      {/* <div className="settings-actions">
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
      </div> */}

      {/* Informazioni - Temporaneamente nascosto */}
      {/* <div className="settings-info">
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
      </div> */}
    </div>
  );
};

export default Settings;
