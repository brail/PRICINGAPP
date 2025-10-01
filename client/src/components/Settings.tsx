import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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
    tools: 0,
    companyMultiplier: 1.33, // Calcolato dinamicamente da optimalMargin
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
  const [duplicatingParameterSet, setDuplicatingParameterSet] = useState<
    any | null
  >(null);
  const [duplicateDescription, setDuplicateDescription] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [parameterSetToDelete, setParameterSetToDelete] = useState<any | null>(
    null
  );
  const [newParameterSet, setNewParameterSet] = useState<{
    description: string;
    purchaseCurrency: string;
    sellingCurrency: string;
    qualityControlPercent: string | number;
    transportInsuranceCost: string | number;
    duty: string | number;
    exchangeRate: string | number;
    italyAccessoryCosts: string | number;
    tools: string | number;
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
    tools: "",
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
      tools: 0,
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

  // Gestisce il drag and drop per riordinare i set di parametri
  const handleDragEnd = async (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(parameterSets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setParameterSets(items);

    try {
      await pricingApi.updateParameterSetsOrder(items);
      setSuccess("Ordine aggiornato con successo");
    } catch (err) {
      setError("Errore nell'aggiornamento dell'ordine");
      // Ripristina l'ordine originale in caso di errore
      await loadParameterSets();
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
      tools: "",
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
      newParameterSet.tools === "" ||
      newParameterSet.tools === null ||
      newParameterSet.tools === undefined
    ) {
      errors.push("Tools è obbligatorio");
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
      editingParameterSet?.tools === "" ||
      editingParameterSet?.tools === null ||
      editingParameterSet?.tools === undefined ||
      isNaN(Number(editingParameterSet?.tools))
    ) {
      errors.push("Tools è obbligatorio");
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
        tools: Number(newParameterSet.tools),
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
        tools: Number(editingParameterSet.tools),
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

  const startDeleteParameterSet = (set: any) => {
    setParameterSetToDelete(set);
    setShowDeleteConfirm(true);
  };

  const cancelDeleteParameterSet = () => {
    setShowDeleteConfirm(false);
    setParameterSetToDelete(null);
  };

  const confirmDeleteParameterSet = async () => {
    if (!parameterSetToDelete) return;

    try {
      setSaving(true);
      await pricingApi.deleteParameterSet(parameterSetToDelete.id);
      setSuccess("Set di parametri eliminato con successo");
      setShowDeleteConfirm(false);
      setParameterSetToDelete(null);
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

  const startDuplicatingParameterSet = (set: any) => {
    setDuplicatingParameterSet(set);
    setDuplicateDescription(`${set.description} (Copia)`);
  };

  const cancelDuplicatingParameterSet = () => {
    setDuplicatingParameterSet(null);
    setDuplicateDescription("");
  };

  const validateDuplicateDescription = () => {
    if (!duplicateDescription.trim()) {
      return "Descrizione è obbligatoria";
    }

    const existingSet = parameterSets.find(
      (set) =>
        set.description.toLowerCase() === duplicateDescription.toLowerCase()
    );

    if (existingSet) {
      return "Una descrizione con questo nome esiste già";
    }

    return null;
  };

  const handleDuplicateParameterSet = async () => {
    const validationError = validateDuplicateDescription();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!duplicatingParameterSet) return;

    try {
      setSaving(true);

      // Crea il nuovo set con tutti i parametri del set originale
      const duplicatedSet = {
        description: duplicateDescription,
        purchaseCurrency: duplicatingParameterSet.purchase_currency,
        sellingCurrency: duplicatingParameterSet.selling_currency,
        qualityControlPercent: duplicatingParameterSet.quality_control_percent,
        transportInsuranceCost:
          duplicatingParameterSet.transport_insurance_cost,
        duty: duplicatingParameterSet.duty,
        exchangeRate: duplicatingParameterSet.exchange_rate,
        italyAccessoryCosts: duplicatingParameterSet.italy_accessory_costs,
        tools: duplicatingParameterSet.tools,
        retailMultiplier: duplicatingParameterSet.retail_multiplier,
        optimalMargin: duplicatingParameterSet.optimal_margin,
      };

      await pricingApi.createParameterSet(duplicatedSet);
      setSuccess("Set di parametri duplicato con successo");
      cancelDuplicatingParameterSet();
      await loadParameterSets();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Errore nella duplicazione del set di parametri"
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
            <label className="form-label">Tools</label>
            <input
              type="number"
              className="form-input"
              value={params.tools}
              onChange={(e) =>
                setParams({
                  ...params,
                  tools: Number(e.target.value),
                })
              }
              min="0"
              step="0.01"
            />
            <small className="form-help">
              Costo tools in valuta di acquisto
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
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="parameter-sets">
                    {(provided) => (
                      <div
                        className="parameter-sets-grid"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {parameterSets.map((set, index) => (
                          <Draggable
                            key={set.id}
                            draggableId={set.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`parameter-set-card ${
                                  snapshot.isDragging ? "dragging" : ""
                                }`}
                                onClick={() => toggleCardExpansion(set.id)}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="parameter-set-header">
                                  <div className="drag-handle">
                                    <span>⋮⋮</span>
                                  </div>
                                  <h5>{set.description}</h5>
                                  <div className="parameter-set-actions">
                                    <button
                                      className="btn btn-sm btn-info"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startDuplicatingParameterSet(set);
                                      }}
                                      disabled={saving}
                                      title="Duplica questo set di parametri"
                                    >
                                      Duplica
                                    </button>
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
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startDeleteParameterSet(set);
                                      }}
                                      disabled={saving || set.is_default}
                                    >
                                      Elimina
                                    </button>
                                    <button
                                      className="btn btn-sm btn-star"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetDefaultParameterSet(set.id);
                                      }}
                                      disabled={saving}
                                      title={
                                        set.is_default
                                          ? "Set di parametri predefinito"
                                          : "Imposta come predefinito"
                                      }
                                      data-is-default={set.is_default ? "true" : "false"}
                                    >
                                      {set.is_default ? "⭐" : "☆"}
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
                                      <strong>Tools:</strong> {set.tools}
                                    </p>
                                    <p>
                                      <strong>Moltiplicatore Retail:</strong>{" "}
                                      {set.retail_multiplier}
                                    </p>
                                    <p>
                                      <strong>Margine ottimale:</strong>{" "}
                                      {set.optimal_margin}%
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                    <label className="form-label">Tools *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newParameterSet.tools}
                      onChange={(e) =>
                        setNewParameterSet({
                          ...newParameterSet,
                          tools:
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

            {/* Form per Duplicare Set Esistente */}
            {duplicatingParameterSet && (
              <div className="duplicate-parameter-set-form">
                <h4>Duplica Set di Parametri</h4>
                <p>
                  Stai duplicando:{" "}
                  <strong>{duplicatingParameterSet.description}</strong>
                </p>
                <div className="form-row">
                  <label htmlFor="duplicate-description">
                    Nuova Descrizione *
                  </label>
                  <input
                    type="text"
                    id="duplicate-description"
                    value={duplicateDescription}
                    onChange={(e) => setDuplicateDescription(e.target.value)}
                    placeholder="Inserisci una descrizione univoca"
                    className={validateDuplicateDescription() ? "error" : ""}
                  />
                  {validateDuplicateDescription() && (
                    <span className="error-message">
                      {validateDuplicateDescription()}
                    </span>
                  )}
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={cancelDuplicatingParameterSet}
                    disabled={saving}
                  >
                    Annulla
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleDuplicateParameterSet}
                    disabled={saving || !!validateDuplicateDescription()}
                  >
                    {saving ? "Duplicazione..." : "Duplica Set"}
                  </button>
                </div>
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
                    <label className="form-label">Tools *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editingParameterSet.tools}
                      onChange={(e) =>
                        setEditingParameterSet({
                          ...editingParameterSet,
                          tools:
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

      {/* Dialog di Conferma Eliminazione */}
      {showDeleteConfirm && parameterSetToDelete && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Conferma Eliminazione</h3>
            </div>
            <div className="modal-body">
              <p>
                Sei sicuro di voler eliminare il set di parametri{" "}
                <strong>"{parameterSetToDelete.description}"</strong>?
              </p>
              <p className="warning-text">
                ⚠️ Questa azione non può essere annullata.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={cancelDeleteParameterSet}
                disabled={saving}
              >
                Annulla
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDeleteParameterSet}
                disabled={saving}
              >
                {saving ? "Eliminazione..." : "Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
