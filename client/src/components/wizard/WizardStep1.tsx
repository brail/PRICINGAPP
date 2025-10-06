import React from "react";
import { CURRENCIES } from "../../types";

interface WizardStep1Props {
  data: {
    description: string;
    purchaseCurrency: string;
    sellingCurrency: string;
  };
  errors: Record<string, string>;
  onUpdate: (data: Partial<WizardStep1Props["data"]>) => void;
}

const WizardStep1: React.FC<WizardStep1Props> = ({
  data,
  errors,
  onUpdate,
}) => {
  const handleInputChange = (
    field: keyof WizardStep1Props["data"],
    value: string
  ) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="wizard-step-content">
      <h2 className="wizard-step-title">Informazioni Base</h2>
      <p className="wizard-step-description">
        Inizia definendo il nome del set di parametri e le valute che
        utilizzerai per i calcoli.
      </p>

      <div className="wizard-form-section">
        <h4>📋 Dettagli del Set</h4>

        <div className="wizard-form-group">
          <label className="wizard-form-label">
            Nome del Set di Parametri *
          </label>
          <input
            type="text"
            className={`wizard-form-input ${errors.description ? "error" : ""}`}
            value={data.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Es. Set Standard EUR-USD"
            autoFocus
          />
          {errors.description && (
            <div className="wizard-form-error">{errors.description}</div>
          )}
          <div className="wizard-form-help">
            Scegli un nome descrittivo per identificare facilmente questo set di
            parametri
          </div>
        </div>
      </div>

      <div className="wizard-form-section">
        <h4>💱 Configurazione Valute</h4>

        <div className="wizard-form-row">
          <div className="wizard-form-group">
            <label className="wizard-form-label">Valuta di Acquisto *</label>
            <select
              className={`wizard-form-select ${
                errors.purchaseCurrency ? "error" : ""
              }`}
              value={data.purchaseCurrency}
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
            {errors.purchaseCurrency && (
              <div className="wizard-form-error">{errors.purchaseCurrency}</div>
            )}
            <div className="wizard-form-help">
              Valuta utilizzata per il prezzo di acquisto del prodotto
            </div>
          </div>

          <div className="wizard-form-group">
            <label className="wizard-form-label">Valuta di Vendita *</label>
            <select
              className={`wizard-form-select ${
                errors.sellingCurrency ? "error" : ""
              }`}
              value={data.sellingCurrency}
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
            {errors.sellingCurrency && (
              <div className="wizard-form-error">{errors.sellingCurrency}</div>
            )}
            <div className="wizard-form-help">
              Valuta utilizzata per il prezzo di vendita finale
            </div>
          </div>
        </div>
      </div>

      {/* Preview delle valute selezionate */}
      {data.purchaseCurrency && data.sellingCurrency && (
        <div className="wizard-preview">
          <h4>📊 Anteprima Configurazione</h4>
          <div className="wizard-preview-item">
            <span className="wizard-preview-label">Nome Set:</span>
            <span className="wizard-preview-value">
              {data.description || "Non specificato"}
            </span>
          </div>
          <div className="wizard-preview-item">
            <span className="wizard-preview-label">Valute:</span>
            <span className="wizard-preview-value">
              {data.purchaseCurrency} → {data.sellingCurrency}
            </span>
          </div>
          <div className="wizard-preview-item">
            <span className="wizard-preview-label">Tipo di Conversione:</span>
            <span className="wizard-preview-value">
              {data.purchaseCurrency === data.sellingCurrency
                ? "Stessa valuta (nessuna conversione)"
                : "Conversione di valuta richiesta"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WizardStep1;
