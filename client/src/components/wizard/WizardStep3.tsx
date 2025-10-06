import React, { useMemo } from "react";
import { WizardFormData } from "../../hooks/useParameterSetWizard";

interface WizardStep3Props {
  data: {
    retailMultiplier: number | "";
    optimalMargin: number | "";
  };
  errors: Record<string, string>;
  onUpdate: (data: Partial<WizardStep3Props["data"]>) => void;
  formData: WizardFormData;
}

const WizardStep3: React.FC<WizardStep3Props> = ({
  data,
  errors,
  onUpdate,
  formData,
}) => {
  const handleInputChange = (
    field: keyof WizardStep3Props["data"],
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

  // Calcolo di esempio per mostrare l'anteprima
  const exampleCalculation = useMemo(() => {
    if (!data.retailMultiplier || !formData.step2.exchangeRate) {
      return null;
    }

    const purchasePrice = 100; // Prezzo di esempio
    const qualityControl = Number(formData.step2.qualityControlPercent) || 0;
    const transportInsurance =
      Number(formData.step2.transportInsuranceCost) || 0;
    const duty = Number(formData.step2.duty) || 0;
    const exchangeRate = Number(formData.step2.exchangeRate) || 1;
    const italyAccessoryCosts = Number(formData.step2.italyAccessoryCosts) || 0;
    const tools = Number(formData.step2.tools) || 0;
    const retailMultiplier = Number(data.retailMultiplier) || 1;

    // Calcolo del prezzo di vendita
    const qcCost = purchasePrice * (qualityControl / 100);
    const totalCost =
      purchasePrice + qcCost + transportInsurance + italyAccessoryCosts + tools;
    const dutyCost = totalCost * (duty / 100);
    const totalCostWithDuty = totalCost + dutyCost;
    const costInSellingCurrency = totalCostWithDuty * exchangeRate;
    const retailPrice = costInSellingCurrency * retailMultiplier;

    // Calcolo del margine
    const margin = ((retailPrice - costInSellingCurrency) / retailPrice) * 100;

    return {
      purchasePrice,
      totalCost: costInSellingCurrency,
      retailPrice,
      margin,
      isOptimal: data.optimalMargin
        ? Math.abs(margin - Number(data.optimalMargin)) < 5
        : false,
    };
  }, [data, formData.step2]);

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Moltiplicatori e Margini</h2>
      <p className="wizard-step-description">
        Definisci i moltiplicatori finali e il margine ottimale per completare
        la configurazione.
      </p>

      <div className="wizard-form-section">
        <h4>📊 Moltiplicatori di Vendita</h4>

        <div className="wizard-form-group">
          <label className="wizard-form-label">Moltiplicatore Retail *</label>
          <input
            type="number"
            className={`wizard-form-input ${
              errors.retailMultiplier ? "error" : ""
            }`}
            value={data.retailMultiplier}
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
          {errors.retailMultiplier && (
            <div className="wizard-form-error">{errors.retailMultiplier}</div>
          )}
          <div className="wizard-form-help">
            Moltiplicatore applicato al costo totale per ottenere il prezzo
            retail
          </div>
        </div>
      </div>

      <div className="wizard-form-section">
        <h4>🎯 Margine Ottimale</h4>

        <div className="wizard-form-group">
          <label className="wizard-form-label">Margine Ottimale (%) *</label>
          <input
            type="number"
            className={`wizard-form-input ${
              errors.optimalMargin ? "error" : ""
            }`}
            value={data.optimalMargin}
            onChange={(e) => handleInputChange("optimalMargin", e.target.value)}
            onWheel={handleWheelPrevent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            min="0"
            max="100"
            step="0.1"
            placeholder="Es. 60"
          />
          {errors.optimalMargin && (
            <div className="wizard-form-error">{errors.optimalMargin}</div>
          )}
          <div className="wizard-form-help">
            Margine percentuale ottimale che vuoi ottenere (0-100%)
          </div>
        </div>
      </div>

      {/* Anteprima del calcolo */}
      {exampleCalculation && (
        <div className="wizard-preview">
          <h4>🧮 Anteprima Calcolo</h4>
          <p
            style={{ fontSize: "14px", color: "#6c757d", marginBottom: "16px" }}
          >
            Esempio con prezzo di acquisto di {exampleCalculation.purchasePrice}{" "}
            {formData.step1.purchaseCurrency}:
          </p>

          <div className="wizard-preview-item">
            <span className="wizard-preview-label">Costo Totale:</span>
            <span className="wizard-preview-value">
              {exampleCalculation.totalCost.toFixed(2)}{" "}
              {formData.step1.sellingCurrency}
            </span>
          </div>

          <div className="wizard-preview-item">
            <span className="wizard-preview-label">Prezzo Retail:</span>
            <span className="wizard-preview-value">
              {exampleCalculation.retailPrice.toFixed(2)}{" "}
              {formData.step1.sellingCurrency}
            </span>
          </div>

          <div className="wizard-preview-item">
            <span className="wizard-preview-label">Margine Attuale:</span>
            <span
              className={`wizard-preview-value ${
                exampleCalculation.isOptimal ? "text-success" : "text-warning"
              }`}
            >
              {exampleCalculation.margin.toFixed(1)}%
              {exampleCalculation.isOptimal && " ✓"}
            </span>
          </div>

          {data.optimalMargin && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">Margine Target:</span>
              <span className="wizard-preview-value">
                {data.optimalMargin}%
              </span>
            </div>
          )}

          {data.optimalMargin && !exampleCalculation.isOptimal && (
            <div className="wizard-preview-item">
              <span className="wizard-preview-label">Differenza:</span>
              <span className="wizard-preview-value">
                {Math.abs(
                  exampleCalculation.margin - Number(data.optimalMargin)
                ).toFixed(1)}
                %
              </span>
            </div>
          )}
        </div>
      )}

      {/* Riepilogo finale */}
      <div
        className="wizard-preview"
        style={{ marginTop: "24px", background: "#e8f5e8" }}
      >
        <h4>✅ Riepilogo Finale</h4>
        <div className="wizard-preview-item">
          <span className="wizard-preview-label">Nome Set:</span>
          <span className="wizard-preview-value">
            {formData.step1.description}
          </span>
        </div>
        <div className="wizard-preview-item">
          <span className="wizard-preview-label">Valute:</span>
          <span className="wizard-preview-value">
            {formData.step1.purchaseCurrency} → {formData.step1.sellingCurrency}
          </span>
        </div>
        <div className="wizard-preview-item">
          <span className="wizard-preview-label">Moltiplicatore Retail:</span>
          <span className="wizard-preview-value">{data.retailMultiplier}x</span>
        </div>
        <div className="wizard-preview-item">
          <span className="wizard-preview-label">Margine Target:</span>
          <span className="wizard-preview-value">{data.optimalMargin}%</span>
        </div>
      </div>
    </div>
  );
};

export default WizardStep3;
