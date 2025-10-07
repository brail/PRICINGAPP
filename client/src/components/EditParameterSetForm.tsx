import React, { useState, useCallback } from "react";
import { CURRENCIES } from "../types";
import "./EditParameterSetForm.css";

interface EditParameterSetFormProps {
  parameterSet: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const EditParameterSetForm: React.FC<EditParameterSetFormProps> = ({
  parameterSet,
  onSave,
  onCancel,
  saving = false,
}) => {
  const [formData, setFormData] = useState({
    description: parameterSet.description || "",
    purchaseCurrency: parameterSet.purchase_currency || "",
    sellingCurrency: parameterSet.selling_currency || "",
    qualityControlPercent: parameterSet.quality_control_percent || "",
    transportInsuranceCost: parameterSet.transport_insurance_cost || "",
    duty: parameterSet.duty || "",
    exchangeRate: parameterSet.exchange_rate || "",
    italyAccessoryCosts: parameterSet.italy_accessory_costs || "",
    tools: parameterSet.tools || "",
    retailMultiplier: parameterSet.retail_multiplier || "",
    optimalMargin: parameterSet.optimal_margin || "",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [activeSection, setActiveSection] = useState<string>("basic");

  const handleInputChange = useCallback(
    (field: string, value: string | number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    },
    [validationErrors]
  );

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!formData.description.trim()) {
      errors.description = "Descrizione è obbligatoria";
    }

    if (!formData.purchaseCurrency) {
      errors.purchaseCurrency = "Valuta acquisto è obbligatoria";
    }

    if (!formData.sellingCurrency) {
      errors.sellingCurrency = "Valuta vendita è obbligatoria";
    }

    if (formData.purchaseCurrency === formData.sellingCurrency) {
      errors.sellingCurrency =
        "La valuta vendita deve essere diversa da quella di acquisto";
    }

    if (
      formData.qualityControlPercent === "" ||
      Number(formData.qualityControlPercent) < 0
    ) {
      errors.qualityControlPercent =
        "Quality Control deve essere un numero positivo";
    }

    if (
      formData.transportInsuranceCost === "" ||
      Number(formData.transportInsuranceCost) < 0
    ) {
      errors.transportInsuranceCost =
        "Trasporto + Assicurazione deve essere un numero positivo";
    }

    if (formData.duty === "" || Number(formData.duty) < 0) {
      errors.duty = "Dazio deve essere un numero positivo";
    }

    if (formData.exchangeRate === "" || Number(formData.exchangeRate) <= 0) {
      errors.exchangeRate = "Cambio deve essere un numero positivo";
    }

    if (
      formData.italyAccessoryCosts === "" ||
      Number(formData.italyAccessoryCosts) < 0
    ) {
      errors.italyAccessoryCosts =
        "Costi accessori Italia deve essere un numero positivo";
    }

    if (formData.tools === "" || Number(formData.tools) < 0) {
      errors.tools = "Tools deve essere un numero positivo";
    }

    if (
      formData.retailMultiplier === "" ||
      Number(formData.retailMultiplier) <= 0
    ) {
      errors.retailMultiplier =
        "Moltiplicatore retail deve essere un numero positivo";
    }

    if (
      formData.optimalMargin === "" ||
      Number(formData.optimalMargin) < 0 ||
      Number(formData.optimalMargin) > 100
    ) {
      errors.optimalMargin = "Margine ottimale deve essere tra 0 e 100";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const dataToSave = {
        description: formData.description.trim(),
        purchase_currency: formData.purchaseCurrency,
        selling_currency: formData.sellingCurrency,
        quality_control_percent: Number(formData.qualityControlPercent),
        transport_insurance_cost: Number(formData.transportInsuranceCost),
        duty: Number(formData.duty),
        exchange_rate: Number(formData.exchangeRate),
        italy_accessory_costs: Number(formData.italyAccessoryCosts),
        tools: Number(formData.tools),
        retail_multiplier: Number(formData.retailMultiplier),
        optimal_margin: Number(formData.optimalMargin),
      };

      await onSave(dataToSave);
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
    }
  };

  const handleWheelPrevent = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

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

  const sections = [
    { id: "basic", title: "Informazioni Base", icon: "" },
    { id: "costs", title: "Costi e Tasse", icon: "" },
    { id: "multipliers", title: "Moltiplicatori", icon: "" },
  ];

  const renderBasicSection = () => (
    <div className="edit-form-section">
      <h4>Informazioni Base</h4>

      <div className="edit-form-group">
        <label className="edit-form-label">Descrizione *</label>
        <input
          type="text"
          className={`edit-form-input ${
            validationErrors.description ? "error" : ""
          }`}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Nome del set di parametri"
        />
        {validationErrors.description && (
          <div className="edit-form-error">{validationErrors.description}</div>
        )}
      </div>

      <div className="edit-form-row">
        <div className="edit-form-group">
          <label className="edit-form-label">Valuta Acquisto *</label>
          <select
            className={`edit-form-select ${
              validationErrors.purchaseCurrency ? "error" : ""
            }`}
            value={formData.purchaseCurrency}
            onChange={(e) =>
              handleInputChange("purchaseCurrency", e.target.value)
            }
          >
            <option value="">Seleziona valuta</option>
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          {validationErrors.purchaseCurrency && (
            <div className="edit-form-error">
              {validationErrors.purchaseCurrency}
            </div>
          )}
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">Valuta Vendita *</label>
          <select
            className={`edit-form-select ${
              validationErrors.sellingCurrency ? "error" : ""
            }`}
            value={formData.sellingCurrency}
            onChange={(e) =>
              handleInputChange("sellingCurrency", e.target.value)
            }
          >
            <option value="">Seleziona valuta</option>
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          {validationErrors.sellingCurrency && (
            <div className="edit-form-error">
              {validationErrors.sellingCurrency}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCostsSection = () => (
    <div className="edit-form-section">
      <h4>Costi e Tasse</h4>

      <div className="edit-form-row">
        <div className="edit-form-group">
          <label className="edit-form-label">Quality Control (%) *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.qualityControlPercent ? "error" : ""
            }`}
            value={formData.qualityControlPercent}
            onChange={(e) =>
              handleInputChange("qualityControlPercent", e.target.value)
            }
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            step="0.1"
            placeholder="Es. 5"
          />
          {validationErrors.qualityControlPercent && (
            <div className="edit-form-error">
              {validationErrors.qualityControlPercent}
            </div>
          )}
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">Trasporto + Assicurazione *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.transportInsuranceCost ? "error" : ""
            }`}
            value={formData.transportInsuranceCost}
            onChange={(e) =>
              handleInputChange("transportInsuranceCost", e.target.value)
            }
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            step="0.01"
            placeholder="Es. 2.3"
          />
          {validationErrors.transportInsuranceCost && (
            <div className="edit-form-error">
              {validationErrors.transportInsuranceCost}
            </div>
          )}
        </div>
      </div>

      <div className="edit-form-row">
        <div className="edit-form-group">
          <label className="edit-form-label">Dazio (%) *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.duty ? "error" : ""
            }`}
            value={formData.duty}
            onChange={(e) => handleInputChange("duty", e.target.value)}
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            step="0.1"
            placeholder="Es. 8"
          />
          {validationErrors.duty && (
            <div className="edit-form-error">{validationErrors.duty}</div>
          )}
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">Cambio *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.exchangeRate ? "error" : ""
            }`}
            value={formData.exchangeRate}
            onChange={(e) => handleInputChange("exchangeRate", e.target.value)}
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0.0001"
            step="0.0001"
            placeholder="Es. 1.07"
          />
          {validationErrors.exchangeRate && (
            <div className="edit-form-error">
              {validationErrors.exchangeRate}
            </div>
          )}
        </div>
      </div>

      <div className="edit-form-row">
        <div className="edit-form-group">
          <label className="edit-form-label">Costi Accessori Italia *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.italyAccessoryCosts ? "error" : ""
            }`}
            value={formData.italyAccessoryCosts}
            onChange={(e) =>
              handleInputChange("italyAccessoryCosts", e.target.value)
            }
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            step="0.01"
            placeholder="Es. 1"
          />
          {validationErrors.italyAccessoryCosts && (
            <div className="edit-form-error">
              {validationErrors.italyAccessoryCosts}
            </div>
          )}
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">Tools *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.tools ? "error" : ""
            }`}
            value={formData.tools}
            onChange={(e) => handleInputChange("tools", e.target.value)}
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            step="0.01"
            placeholder="Es. 1.0"
          />
          {validationErrors.tools && (
            <div className="edit-form-error">{validationErrors.tools}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMultipliersSection = () => (
    <div className="edit-form-section">
      <h4>Moltiplicatori e Margini</h4>

      <div className="edit-form-row">
        <div className="edit-form-group">
          <label className="edit-form-label">Moltiplicatore Retail *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.retailMultiplier ? "error" : ""
            }`}
            value={formData.retailMultiplier}
            onChange={(e) =>
              handleInputChange("retailMultiplier", e.target.value)
            }
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0.01"
            step="0.01"
            placeholder="Es. 2.5"
          />
          {validationErrors.retailMultiplier && (
            <div className="edit-form-error">
              {validationErrors.retailMultiplier}
            </div>
          )}
        </div>

        <div className="edit-form-group">
          <label className="edit-form-label">Margine Ottimale (%) *</label>
          <input
            type="number"
            className={`edit-form-input ${
              validationErrors.optimalMargin ? "error" : ""
            }`}
            value={formData.optimalMargin}
            onChange={(e) => handleInputChange("optimalMargin", e.target.value)}
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            max="100"
            step="0.1"
            placeholder="Es. 60"
          />
          {validationErrors.optimalMargin && (
            <div className="edit-form-error">
              {validationErrors.optimalMargin}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "basic":
        return renderBasicSection();
      case "costs":
        return renderCostsSection();
      case "multipliers":
        return renderMultipliersSection();
      default:
        return renderBasicSection();
    }
  };

  return (
    <div className="edit-parameter-set-form">
      <div className="edit-form-header">
        <h4>Modifica Set di Parametri</h4>
        <p className="edit-form-subtitle">
          Modifica i parametri per: <strong>{parameterSet.description}</strong>
        </p>
      </div>

      <div className="edit-form-navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`edit-form-nav-btn ${
              activeSection === section.id ? "active" : ""
            }`}
            onClick={() => setActiveSection(section.id)}
            disabled={saving}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-title">{section.title}</span>
          </button>
        ))}
      </div>

      <div className="edit-form-content">{renderActiveSection()}</div>

      <div className="edit-form-footer">
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Annulla
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salva Modifiche"}
        </button>
      </div>
    </div>
  );
};

export default EditParameterSetForm;
