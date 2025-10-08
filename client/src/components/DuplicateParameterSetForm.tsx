import React, { useState, useCallback, useEffect } from "react";
import "./DuplicateParameterSetForm.css";

interface DuplicateParameterSetFormProps {
  parameterSet: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const DuplicateParameterSetForm: React.FC<DuplicateParameterSetFormProps> = ({
  parameterSet,
  onSave,
  onCancel,
  saving = false,
}) => {
  const [description, setDescription] = useState(
    `${parameterSet.description} (Copia)`
  );
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setDescription(`${parameterSet.description} (Copia)`);
    setValidationError("");
  }, [parameterSet]);

  const handleDescriptionChange = useCallback(
    (value: string) => {
      setDescription(value);
      if (validationError) {
        setValidationError("");
      }
    },
    [validationError]
  );

  const validateDescription = useCallback(() => {
    if (!description.trim()) {
      setValidationError("La descrizione è obbligatoria");
      return false;
    }
    if (description.trim().length < 3) {
      setValidationError("La descrizione deve essere di almeno 3 caratteri");
      return false;
    }
    setValidationError("");
    return true;
  }, [description]);

  const handleSave = async () => {
    if (!validateDescription()) {
      return;
    }

    try {
      const dataToSave = {
        description: description.trim(),
        purchase_currency: parameterSet.purchase_currency,
        selling_currency: parameterSet.selling_currency,
        quality_control_percent: parameterSet.quality_control_percent,
        transport_insurance_cost: parameterSet.transport_insurance_cost,
        duty: parameterSet.duty,
        exchange_rate: parameterSet.exchange_rate,
        italy_accessory_costs: parameterSet.italy_accessory_costs,
        tools: parameterSet.tools,
        retail_multiplier: parameterSet.retail_multiplier,
        optimal_margin: parameterSet.optimal_margin,
      };

      await onSave(dataToSave);
    } catch (error) {
      console.error("Errore nella duplicazione:", error);
    }
  };

  return (
    <div className="duplicate-parameter-set-form">
      <div className="duplicate-form-header">
        <h4>Duplica Set di Parametri</h4>
        <p className="duplicate-form-subtitle">
          Stai duplicando: <strong>{parameterSet.description}</strong>
        </p>
      </div>

      <div className="duplicate-form-content">
        <div className="duplicate-form-section">
          <h5>Nuova Descrizione</h5>
          <div className="duplicate-form-group">
            <label className="duplicate-form-label">Nome del nuovo set *</label>
            <input
              type="text"
              className={`duplicate-form-input ${
                validationError ? "error" : ""
              }`}
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Es. Set Standard EUR-USD (Copia)"
              autoFocus
            />
            {validationError && (
              <div className="duplicate-form-error">{validationError}</div>
            )}
            <div className="duplicate-form-help">
              Scegli un nome univoco per il nuovo set di parametri
            </div>
          </div>
        </div>

        <div className="duplicate-form-section">
          <h5>Parametri che verranno duplicati</h5>
          <div className="duplicate-preview">
            <div className="duplicate-preview-grid">
              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">Valute:</span>
                <span className="duplicate-preview-value">
                  {parameterSet.purchase_currency} →{" "}
                  {parameterSet.selling_currency}
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">
                  Quality Control:
                </span>
                <span className="duplicate-preview-value">
                  {parameterSet.quality_control_percent}%
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">
                  Trasporto + Assicurazione:
                </span>
                <span className="duplicate-preview-value">
                  {parameterSet.transport_insurance_cost}
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">Dazio:</span>
                <span className="duplicate-preview-value">
                  {parameterSet.duty}%
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">Cambio:</span>
                <span className="duplicate-preview-value">
                  {parameterSet.exchange_rate}
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">
                  Accessori Italia:
                </span>
                <span className="duplicate-preview-value">
                  {parameterSet.italy_accessory_costs}
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">Tools:</span>
                <span className="duplicate-preview-value">
                  {parameterSet.tools}
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">
                  Moltiplicatore Retail:
                </span>
                <span className="duplicate-preview-value">
                  {parameterSet.retail_multiplier}x
                </span>
              </div>

              <div className="duplicate-preview-item">
                <span className="duplicate-preview-label">
                  Margine Ottimale:
                </span>
                <span className="duplicate-preview-value">
                  {parameterSet.optimal_margin}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {description && (
          <div className="duplicate-form-section">
            <h5>✅ Anteprima</h5>
            <div className="duplicate-summary">
              <div className="duplicate-summary-item">
                <span className="duplicate-summary-label">Set Originale:</span>
                <span className="duplicate-summary-value">
                  {parameterSet.description}
                </span>
              </div>
              <div className="duplicate-summary-item">
                <span className="duplicate-summary-label">Nuovo Set:</span>
                <span className="duplicate-summary-value">{description}</span>
              </div>
              <div className="duplicate-summary-item">
                <span className="duplicate-summary-label">Parametri:</span>
                <span className="duplicate-summary-value">
                  {parameterSet.purchase_currency} →{" "}
                  {parameterSet.selling_currency}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="duplicate-form-footer">
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
          disabled={saving || !!validationError}
        >
          {saving ? "Duplicazione..." : "Duplica Set"}
        </button>
      </div>
    </div>
  );
};

export default DuplicateParameterSetForm;
