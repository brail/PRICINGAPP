import React, { useState, useEffect } from "react";
import { LoadingStates, useLoadingState } from "./LoadingStates";
import {
  useBusinessErrorHandler,
  createBusinessError,
} from "../hooks/useBusinessErrorHandler";
import { useNotification } from "../contexts/NotificationContext";
import CompactErrorHandler from "./CompactErrorHandler";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { pricingApi } from "../services/api";
import { useParameterManager } from "../hooks/useParameterManager";
import { CURRENCIES } from "../types";
import ParameterSetWizard from "./ParameterSetWizard";
import EditParameterSetForm from "./EditParameterSetForm";
import DuplicateParameterSetForm from "./DuplicateParameterSetForm";
import "./Parameters.css";

// Componente per gli elementi sortabili
interface SortableItemProps {
  set: any;
  onClick: (id: number) => void;
  expandedCards: Set<number>;
  saving: boolean;
  startDuplicatingParameterSet: (set: any) => void;
  handleLoadParameterSet: (id: number) => void;
  startEditingParameterSet: (set: any) => void;
  startDeleteParameterSet: (set: any) => void;
  handleSetDefaultParameterSet: (id: number) => void;
  editingParameterSet: any | null;
  setEditingParameterSet: (set: any | null) => void;
  handleUpdateParameterSet: () => void;
  cancelEditingParameterSet: () => void;
  handleWheelPrevent: (e: React.WheelEvent<HTMLInputElement>) => void;
  handleFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleEditSave: (data: any) => Promise<void>;
  duplicatingParameterSet: any | null;
  handleDuplicateSave: (data: any) => Promise<void>;
  cancelDuplicatingParameterSet: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  set,
  onClick,
  expandedCards,
  saving,
  startDuplicatingParameterSet,
  handleLoadParameterSet,
  startEditingParameterSet,
  startDeleteParameterSet,
  handleSetDefaultParameterSet,
  editingParameterSet,
  setEditingParameterSet,
  handleUpdateParameterSet,
  cancelEditingParameterSet,
  handleWheelPrevent,
  handleFocus,
  handleBlur,
  handleEditSave,
  duplicatingParameterSet,
  handleDuplicateSave,
  cancelDuplicatingParameterSet,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: set.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div className="parameter-set-container">
      <div
        ref={setNodeRef}
        style={style}
        className={`parameter-set-card ${isDragging ? "dragging" : ""}`}
        onClick={() => onClick(set.id)}
      >
        <div className="parameter-set-header">
          <div className="drag-handle" {...attributes} {...listeners}>
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
              <strong>Quality Control:</strong> {set.quality_control_percent}%
            </p>
            <p>
              <strong>Trasporto + Assicurazione:</strong>{" "}
              {set.transport_insurance_cost}
            </p>
            <p>
              <strong>Dazio:</strong> {set.duty}%
            </p>
            <p>
              <strong>Tasso di Cambio:</strong> {set.exchange_rate}
            </p>
            <p>
              <strong>Costi Accessori Italia:</strong>{" "}
              {set.italy_accessory_costs}
            </p>
            <p>
              <strong>Tools:</strong> {set.tools}
            </p>
            <p>
              <strong>Moltiplicatore Retail:</strong> {set.retail_multiplier}
            </p>
            <p>
              <strong>Margine ottimale:</strong> {set.optimal_margin}%
            </p>
          </div>
        )}
      </div>

      {/* Form di modifica posizionato sotto la card specifica */}
      {editingParameterSet && editingParameterSet.id === set.id && (
        <EditParameterSetForm
          parameterSet={editingParameterSet}
          onSave={handleEditSave}
          onCancel={cancelEditingParameterSet}
          saving={saving}
        />
      )}

      {/* Form di duplicazione posizionato sotto la card specifica */}
      {duplicatingParameterSet && duplicatingParameterSet.id === set.id && (
        <DuplicateParameterSetForm
          parameterSet={duplicatingParameterSet}
          onSave={handleDuplicateSave}
          onCancel={cancelDuplicatingParameterSet}
          saving={saving}
        />
      )}
    </div>
  );
};

const Parameters: React.FC = () => {
  // Funzione helper per disabilitare lo scroll del mouse sui campi numerici
  const handleWheelPrevent = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEditSave = async (data: any) => {
    try {
      setSaving(true);
      clearErrors();

      // Usa il ParameterContext per aggiornare il set
      await updateParameterSet(editingParameterSet.id, data);
      showSuccess("Parametri aggiornati", "Set di parametri aggiornato con successo!");
      setEditingParameterSet(null);
    } catch (err: any) {
      addError(
        createBusinessError.system(
          err.message || "Errore nell'aggiornamento del set di parametri",
          "Errore di aggiornamento parametri"
        )
      );
      throw err; // Rilancia l'errore per il form
    } finally {
      setSaving(false);
    }
  };

  // Funzione per disabilitare lo scroll quando il campo è attivo
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      { passive: false }
    );
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.removeEventListener("wheel", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  };

  // const [params, setParams] = useState<CalculationParams>({
  //   purchaseCurrency: "EUR",
  //   sellingCurrency: "EUR",
  //   qualityControlPercent: 5,
  //   transportInsuranceCost: 0,
  //   duty: 0,
  //   exchangeRate: 1,
  //   italyAccessoryCosts: 0,
  //   tools: 0,
  //   companyMultiplier: 1.33, // Calcolato dinamicamente da optimalMargin
  //   retailMultiplier: 2.0,
  //   optimalMargin: 25,
  // });

  // const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string>("");

  // Business error handler
  const { errors, addError, removeError, clearErrors } =
    useBusinessErrorHandler();
  
  // Notification system
  const { showSuccess, showError, showInfo } = useNotification();

  // Hook per gestire stati di loading professionali
  const { isLoading, loadingMessage, startLoading, stopLoading } =
    useLoadingState();

  // Usa ParameterContext invece di stato locale
  const {
    parameterSets,
    loadParameterSets,
    loadParameterSet,
    updateParameterSet,
    deleteParameterSet,
    reorderParameterSets,
  } = useParameterManager();
  const [showWizard, setShowWizard] = useState(false);
  const [editingParameterSet, setEditingParameterSet] = useState<any | null>(
    null
  );
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [duplicatingParameterSet, setDuplicatingParameterSet] = useState<
    any | null
  >(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [parameterSetToDelete, setParameterSetToDelete] = useState<any | null>(
    null
  );

  useEffect(() => {
    loadSettings();
    // loadExchangeRates();
    // loadParameterSets(); // Ora gestito da ParameterContext
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // const currentParams = await pricingApi.getParams(); // Commentato per v0.2 - gestito dal Calculator
    } catch (err) {
      addError(
        createBusinessError.system(
          "Errore nel caricamento delle impostazioni",
          "Errore di caricamento parametri"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // const loadExchangeRates = async () => {
  //   try {
  //     const rates = await pricingApi.getExchangeRates();
  //     setExchangeRates(rates);
  //   } catch (err) {
  //     console.error("Errore nel caricamento dei tassi di cambio:", err);
  //   }
  // };

  // const handleSave = async () => {
  //   try {
  //     setSaving(true);
  //     setError("");
  //     setSuccess("");

  //     await pricingApi.updateParams(params);
  //     setSuccess("Impostazioni salvate con successo!");

  //     // Pulisci il messaggio di successo dopo 3 secondi
  //     setTimeout(() => setSuccess(""), 3000);
  //   } catch (err) {
  //     setError("Errore nel salvataggio delle impostazioni");
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // const handleReset = () => {
  //   setParams({
  //     purchaseCurrency: "EUR",
  //     sellingCurrency: "EUR",
  //     qualityControlPercent: 5,
  //     transportInsuranceCost: 0,
  //     duty: 0,
  //     exchangeRate: 1,
  //     italyAccessoryCosts: 0,
  //     tools: 0,
  //     companyMultiplier: 1.5,
  //     retailMultiplier: 2.0,
  //     optimalMargin: 25,
  //   });
  //   setError("");
  //   setSuccess("");
  // };

  // const formatExchangeRate = (rate: number): string => {
  //   return rate.toFixed(4);
  // };

  // const getCurrencyName = (code: string): string => {
  //   const currency = CURRENCIES.find((c) => c.code === code);
  //   return currency ? currency.name : code;
  // };

  // Funzioni per la gestione dei set di parametri (ora gestite da ParameterContext)

  // Configura i sensori per il drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Gestisce il drag and drop per riordinare i set di parametri
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parameterSets.findIndex((item) => item.id === active.id);
      const newIndex = parameterSets.findIndex((item) => item.id === over.id);

      // Crea il nuovo array riordinato
      const newItems = arrayMove(parameterSets, oldIndex, newIndex);

      // Usa il ParameterContext per riordinare
      await reorderParameterSets(newItems);
    }
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

  const handleWizardSave = async (data: any) => {
    try {
      setSaving(true);
      clearErrors();

      await pricingApi.createParameterSet(data);
      showSuccess("Parametri creati", "Set di parametri creato con successo!");
      setShowWizard(false);
      loadParameterSets();
    } catch (err: any) {
      addError(
        createBusinessError.system(
          err.message || "Errore nella creazione del set di parametri",
          "Errore di creazione parametri"
        )
      );
      throw err; // Rilancia l'errore per il wizard
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateSave = async (data: any) => {
    try {
      setSaving(true);
      clearErrors();

      await pricingApi.createParameterSet(data);
      showSuccess("Parametri duplicati", "Set di parametri duplicato con successo!");
      setDuplicatingParameterSet(null);
      loadParameterSets();
    } catch (err: any) {
      addError(
        createBusinessError.system(
          err.message || "Errore nella duplicazione del set di parametri",
          "Errore di duplicazione parametri"
        )
      );
      throw err; // Rilancia l'errore per il form
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateParameterSet = async () => {
    if (!editingParameterSet) return;

    // Validazione del form
    const validationErrors = validateEditForm();
    if (validationErrors.length > 0) {
      addError(
        createBusinessError.validation(
          "Errore di validazione: " + validationErrors.join(", "),
          "form",
          [
            "Compila tutti i campi obbligatori",
            "Verifica che i valori siano numerici",
            "Controlla i formati delle valute",
          ]
        )
      );
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
      showSuccess("Parametri aggiornati", "Set di parametri aggiornato con successo");
      setEditingParameterSet(null);
      await loadParameterSets();
    } catch (err: any) {
      addError(
        createBusinessError.system(
          err.response?.data?.error ||
            "Errore nell'aggiornamento del set di parametri",
          "Errore di aggiornamento parametri"
        )
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
      // Usa il ParameterContext per eliminare il set
      await deleteParameterSet(parameterSetToDelete.id);
      showSuccess("Parametri eliminati", "Set di parametri eliminato con successo");
      setShowDeleteConfirm(false);
      setParameterSetToDelete(null);
    } catch (err: any) {
      addError(
        createBusinessError.system(
          err.response?.data?.error ||
            "Errore nell'eliminazione del set di parametri",
          "Errore di eliminazione parametri"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLoadParameterSet = async (id: number) => {
    try {
      startLoading("Caricamento parametri...", 0);
      setSaving(true);

      // Simula progresso
      setTimeout(() => startLoading("Applicazione parametri...", 50), 200);

      // Usa il ParameterContext per caricare il set
      await loadParameterSet(id);

      setTimeout(() => startLoading("Completamento...", 100), 300);

      showSuccess("Parametri caricati", "Set di parametri caricato con successo");
    } catch (err: any) {
      addError(
        createBusinessError.system(
          err.response?.data?.error ||
            "Errore nel caricamento del set di parametri",
          "Errore di caricamento parametri"
        )
      );
    } finally {
      stopLoading();
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
      addError(
        createBusinessError.system(
          err.response?.data?.error ||
            "Errore nell'impostazione del set di parametri come default",
          "Errore di impostazione default"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const startDuplicatingParameterSet = (set: any) => {
    // Chiudi tutti gli altri form prima di aprire quello di duplicazione
    setEditingParameterSet(null);
    setDuplicatingParameterSet(set);
  };

  const cancelDuplicatingParameterSet = () => {
    setDuplicatingParameterSet(null);
  };

  const startEditingParameterSet = (parameterSet: any) => {
    // Chiudi tutti gli altri form prima di aprire quello di modifica
    setDuplicatingParameterSet(null);
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
        <LoadingStates
          type="skeleton"
          message="Caricamento parametri..."
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="parameters">
      {/* Loading Overlay per caricamento parametri */}
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

      <div className="parameters-header">
        <h2>Parametri</h2>
        <p className="text-muted">
          Configura i parametri di calcolo per la calcolatrice prezzi.
        </p>
      </div>

      {/* Compact Error Handler */}
      {errors.map((businessError) => (
        <CompactErrorHandler
          key={businessError.id}
          error={businessError}
          onDismiss={() => removeError(businessError.id)}
        />
      ))}
      {success && <div className="success">{success}</div>}

      <div className="parameters-grid">
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
              onWheel={handleWheelPrevent}
              value={params.qualityControlPercent}
              onChange={(e) =>
                setParams({
                  ...params,
                  qualityControlPercent: Number(e.target.value),
                })
              }
              onWheel={handleWheelPrevent}
              onFocus={handleFocus}
              onBlur={handleBlur}
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
              onWheel={handleWheelPrevent}
              value={params.transportInsuranceCost}
              onChange={(e) =>
                setParams({
                  ...params,
                  transportInsuranceCost: Number(e.target.value),
                })
              }
              onWheel={handleWheelPrevent}
              onFocus={handleFocus}
              onBlur={handleBlur}
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
              onWheel={handleWheelPrevent}
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
              onWheel={handleWheelPrevent}
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
              onWheel={handleWheelPrevent}
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
              onWheel={handleWheelPrevent}
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
              onWheel={handleWheelPrevent}
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
              onWheel={handleWheelPrevent}
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
              onWheel={handleWheelPrevent}
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
        <div className="parameters-card">
          <div className="parameters-card-header">
            <h3>Gestione Set di Parametri</h3>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!showWizard) {
                  // Chiudi tutti gli altri form prima di aprire il wizard
                  setEditingParameterSet(null);
                  setDuplicatingParameterSet(null);
                }
                setShowWizard(!showWizard);
              }}
            >
              {showWizard ? "Annulla" : "Crea Nuovo Set"}
            </button>
          </div>

          <div className="parameter-sets-management">
            {/* Lista Set di Parametri */}
            <div className="parameter-sets-list">
              <h4>Set di Parametri Esistenti</h4>
              {parameterSets.length === 0 ? (
                <p className="text-muted">Nessun set di parametri trovato.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={parameterSets.map((set) => set.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="parameter-sets-grid">
                      {parameterSets.map((set) => (
                        <SortableItem
                          key={set.id}
                          set={set}
                          onClick={toggleCardExpansion}
                          expandedCards={expandedCards}
                          saving={saving}
                          startDuplicatingParameterSet={
                            startDuplicatingParameterSet
                          }
                          handleLoadParameterSet={handleLoadParameterSet}
                          startEditingParameterSet={startEditingParameterSet}
                          startDeleteParameterSet={startDeleteParameterSet}
                          handleSetDefaultParameterSet={
                            handleSetDefaultParameterSet
                          }
                          editingParameterSet={editingParameterSet}
                          setEditingParameterSet={setEditingParameterSet}
                          handleUpdateParameterSet={handleUpdateParameterSet}
                          cancelEditingParameterSet={cancelEditingParameterSet}
                          handleWheelPrevent={handleWheelPrevent}
                          handleFocus={handleFocus}
                          handleBlur={handleBlur}
                          handleEditSave={handleEditSave}
                          duplicatingParameterSet={duplicatingParameterSet}
                          handleDuplicateSave={handleDuplicateSave}
                          cancelDuplicatingParameterSet={
                            cancelDuplicatingParameterSet
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Wizard per Creare Nuovo Set */}
            {showWizard && (
              <ParameterSetWizard
                onSave={handleWizardSave}
                onCancel={() => setShowWizard(false)}
                saving={saving}
              />
            )}

            {/* Form di modifica rimosso - ora è posizionato sotto ogni card */}
            {false && (
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
            // onClick={loadExchangeRates}
            disabled={loading}
          >
            {loading ? <span className="loading"></span> : "Aggiorna Tassi"}
          </button>
        </div> */}
      </div>

      {/* Azioni */}
      {/* Azioni di salvataggio - Temporaneamente nascoste */}
      {/* <div className="parameters-actions">
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
      {/* <div className="parameters-info">
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

export default Parameters;
