import React from "react";

interface WizardStep2Props {
  data: {
    qualityControlPercent: number | "";
    transportInsuranceCost: number | "";
    duty: number | "";
    exchangeRate: number | "";
    italyAccessoryCosts: number | "";
    tools: number | "";
  };
  errors: Record<string, string>;
  onUpdate: (data: Partial<WizardStep2Props["data"]>) => void;
}

const WizardStep2: React.FC<WizardStep2Props> = ({
  data,
  errors,
  onUpdate,
}) => {
  const handleInputChange = (
    field: keyof WizardStep2Props["data"],
    value: string
  ) => {
    const numValue = value === "" ? "" : Number(value);
    onUpdate({ [field]: numValue });
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

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Costi e Tasse</h2>
      <p className="wizard-step-description">
        Configura tutti i costi e le tasse che influenzano il calcolo del prezzo
        finale.
      </p>

      <div className="wizard-form-section">
        <h4>🔍 Quality Control e Controlli</h4>

        <div className="wizard-form-group">
          <label className="wizard-form-label">Quality Control (%) *</label>
          <input
            type="number"
            className={`wizard-form-input ${
              errors.qualityControlPercent ? "error" : ""
            }`}
            value={data.qualityControlPercent}
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
          {errors.qualityControlPercent && (
            <div className="wizard-form-error">
              {errors.qualityControlPercent}
            </div>
          )}
          <div className="wizard-form-help">
            Percentuale di quality control applicata al prezzo di acquisto
          </div>
        </div>
      </div>

      <div className="wizard-form-section">
        <h4>🚚 Trasporto e Logistica</h4>

        <div className="wizard-form-row">
          <div className="wizard-form-group">
            <label className="wizard-form-label">
              Trasporto + Assicurazione *
            </label>
            <input
              type="number"
              className={`wizard-form-input ${
                errors.transportInsuranceCost ? "error" : ""
              }`}
              value={data.transportInsuranceCost}
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
            {errors.transportInsuranceCost && (
              <div className="wizard-form-error">
                {errors.transportInsuranceCost}
              </div>
            )}
            <div className="wizard-form-help">
              Costo fisso di trasporto e assicurazione
            </div>
          </div>

          <div className="wizard-form-group">
            <label className="wizard-form-label">Dazio (%) *</label>
            <input
              type="number"
              className={`wizard-form-input ${errors.duty ? "error" : ""}`}
              value={data.duty}
              onChange={(e) => handleInputChange("duty", e.target.value)}
              onWheel={handleWheelPrevent}
              onFocus={handleFocus}
              onBlur={handleBlur}
              min="0"
              step="0.1"
              placeholder="Es. 8"
            />
            {errors.duty && (
              <div className="wizard-form-error">{errors.duty}</div>
            )}
            <div className="wizard-form-help">
              Percentuale di dazio applicata
            </div>
          </div>
        </div>
      </div>

      <div className="wizard-form-section">
        <h4>💱 Cambio e Accessori</h4>

        <div className="wizard-form-row">
          <div className="wizard-form-group">
            <label className="wizard-form-label">Tasso di Cambio *</label>
            <input
              type="number"
              className={`wizard-form-input ${
                errors.exchangeRate ? "error" : ""
              }`}
              value={data.exchangeRate}
              onChange={(e) =>
                handleInputChange("exchangeRate", e.target.value)
              }
              onWheel={handleWheelPrevent}
              onFocus={handleFocus}
              onBlur={handleBlur}
              min="0.0001"
              step="0.0001"
              placeholder="Es. 1.07"
            />
            {errors.exchangeRate && (
              <div className="wizard-form-error">{errors.exchangeRate}</div>
            )}
            <div className="wizard-form-help">
              Tasso di cambio da valuta acquisto a valuta vendita
            </div>
          </div>

          <div className="wizard-form-group">
            <label className="wizard-form-label">
              Costi Accessori Italia *
            </label>
            <input
              type="number"
              className={`wizard-form-input ${
                errors.italyAccessoryCosts ? "error" : ""
              }`}
              value={data.italyAccessoryCosts}
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
            {errors.italyAccessoryCosts && (
              <div className="wizard-form-error">
                {errors.italyAccessoryCosts}
              </div>
            )}
            <div className="wizard-form-help">
              Costi accessori specifici per l'Italia
            </div>
          </div>
        </div>

        <div className="wizard-form-group">
          <label className="wizard-form-label">Tools *</label>
          <input
            type="number"
            className={`wizard-form-input ${errors.tools ? "error" : ""}`}
            value={data.tools}
            onChange={(e) => handleInputChange("tools", e.target.value)}
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            step="0.01"
            placeholder="Es. 1.0"
          />
          {errors.tools && (
            <div className="wizard-form-error">{errors.tools}</div>
          )}
          <div className="wizard-form-help">
            Costo tools in valuta di acquisto
          </div>
        </div>
      </div>

      {/* Preview dei costi */}
      {(data.qualityControlPercent !== "" ||
        data.transportInsuranceCost !== "" ||
        data.duty !== "" ||
        data.exchangeRate !== "" ||
        data.italyAccessoryCosts !== "" ||
        data.tools !== "") && (
        <div className="wizard-preview">
          <h4>💰 Riepilogo Costi</h4>
          {data.qualityControlPercent !== "" && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">Quality Control:</span>
              <span className="wizard-preview-value">
                {data.qualityControlPercent}%
              </span>
            </div>
          )}
          {data.transportInsuranceCost !== "" && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">
                Trasporto + Assicurazione:
              </span>
              <span className="wizard-preview-value">
                {data.transportInsuranceCost}
              </span>
            </div>
          )}
          {data.duty !== "" && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">Dazio:</span>
              <span className="wizard-preview-value">{data.duty}%</span>
            </div>
          )}
          {data.exchangeRate !== "" && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">Tasso di Cambio:</span>
              <span className="wizard-preview-value">{data.exchangeRate}</span>
            </div>
          )}
          {data.italyAccessoryCosts !== "" && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">Accessori Italia:</span>
              <span className="wizard-preview-value">
                {data.italyAccessoryCosts}
              </span>
            </div>
          )}
          {data.tools !== "" && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">Tools:</span>
              <span className="wizard-preview-value">{data.tools}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WizardStep2;
