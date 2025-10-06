import React from "react";
import { useParameterSetWizard } from "../hooks/useParameterSetWizard";
import WizardStep1 from "./wizard/WizardStep1";
import WizardStep2 from "./wizard/WizardStep2";
import WizardStep3 from "./wizard/WizardStep3";
import "./ParameterSetWizard.css";

interface ParameterSetWizardProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const ParameterSetWizard: React.FC<ParameterSetWizardProps> = ({
  onSave,
  onCancel,
  saving = false,
}) => {
  const {
    currentStep,
    formData,
    validationErrors,
    stepTitles,
    nextStep,
    prevStep,
    updateFormData,
    resetWizard,
    getFinalFormData,
    isFirstStep,
    isLastStep,
  } = useParameterSetWizard();

  const handleSave = async () => {
    try {
      const finalData = getFinalFormData();
      await onSave(finalData);
      resetWizard();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
    }
  };

  const handleCancel = () => {
    resetWizard();
    onCancel();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WizardStep1
            data={formData.step1}
            errors={validationErrors}
            onUpdate={(data) => updateFormData("step1", data)}
          />
        );
      case 2:
        return (
          <WizardStep2
            data={formData.step2}
            errors={validationErrors}
            onUpdate={(data) => updateFormData("step2", data)}
          />
        );
      case 3:
        return (
          <WizardStep3
            data={formData.step3}
            errors={validationErrors}
            onUpdate={(data) => updateFormData("step3", data)}
            formData={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="parameter-wizard">
      {/* Header con progress bar */}
      <div className="wizard-header">
        <div className="wizard-progress">
          {stepTitles.map((title, index) => (
            <div
              key={index + 1}
              className={`wizard-step ${
                currentStep === index + 1 ? "active" : ""
              } ${currentStep > index + 1 ? "completed" : ""}`}
            >
              <div className="step-number">
                {currentStep > index + 1 ? "✓" : index + 1}
              </div>
              <div className="step-title">{title}</div>
            </div>
          ))}
        </div>
        <div className="wizard-step-indicator">
          Step {currentStep} di {stepTitles.length}
        </div>
      </div>

      {/* Contenuto del wizard */}
      <div className="wizard-content">{renderCurrentStep()}</div>

      {/* Footer con navigazione */}
      <div className="wizard-footer">
        <div className="wizard-footer-left">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            Annulla
          </button>
        </div>

        <div className="wizard-footer-right">
          {!isFirstStep && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={prevStep}
              disabled={saving}
            >
              Indietro
            </button>
          )}

          {!isLastStep ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={nextStep}
              disabled={saving}
            >
              Avanti
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Crea Set di Parametri"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParameterSetWizard;
