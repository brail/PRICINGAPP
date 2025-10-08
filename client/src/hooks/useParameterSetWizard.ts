import { useState, useCallback } from "react";
import { CURRENCIES } from "../types";

export interface WizardFormData {
  step1: {
    description: string;
    purchaseCurrency: string;
    sellingCurrency: string;
  };
  step2: {
    qualityControlPercent: number | "";
    transportInsuranceCost: number | "";
    duty: number | "";
    exchangeRate: number | "";
    italyAccessoryCosts: number | "";
    tools: number | "";
  };
  step3: {
    retailMultiplier: number | "";
    optimalMargin: number | "";
  };
}

const initialFormData: WizardFormData = {
  step1: {
    description: "",
    purchaseCurrency: "",
    sellingCurrency: "",
  },
  step2: {
    qualityControlPercent: "",
    transportInsuranceCost: "",
    duty: "",
    exchangeRate: "",
    italyAccessoryCosts: "",
    tools: "",
  },
  step3: {
    retailMultiplier: "",
    optimalMargin: "",
  },
};

export const useParameterSetWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const stepTitles = [
    "Informazioni Base",
    "Costi e Tasse",
    "Moltiplicatori e Margini",
  ];

  const validateStep1 = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!formData.step1.description.trim()) {
      errors.description = "Descrizione è obbligatoria";
    }

    if (!formData.step1.purchaseCurrency) {
      errors.purchaseCurrency = "Valuta acquisto è obbligatoria";
    }

    if (!formData.step1.sellingCurrency) {
      errors.sellingCurrency = "Valuta vendita è obbligatoria";
    }

    if (formData.step1.purchaseCurrency === formData.step1.sellingCurrency) {
      errors.sellingCurrency =
        "La valuta vendita deve essere diversa da quella di acquisto";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.step1]);

  const validateStep2 = useCallback(() => {
    const errors: Record<string, string> = {};

    if (
      formData.step2.qualityControlPercent === "" ||
      formData.step2.qualityControlPercent < 0
    ) {
      errors.qualityControlPercent =
        "Quality Control deve essere un numero positivo";
    }

    if (
      formData.step2.transportInsuranceCost === "" ||
      formData.step2.transportInsuranceCost < 0
    ) {
      errors.transportInsuranceCost =
        "Trasporto + Assicurazione deve essere un numero positivo";
    }

    if (formData.step2.duty === "" || formData.step2.duty < 0) {
      errors.duty = "Dazio deve essere un numero positivo";
    }

    if (
      formData.step2.exchangeRate === "" ||
      formData.step2.exchangeRate <= 0
    ) {
      errors.exchangeRate = "Cambio deve essere un numero positivo";
    }

    if (
      formData.step2.italyAccessoryCosts === "" ||
      formData.step2.italyAccessoryCosts < 0
    ) {
      errors.italyAccessoryCosts =
        "Costi accessori Italia deve essere un numero positivo";
    }

    if (formData.step2.tools === "" || formData.step2.tools < 0) {
      errors.tools = "Tools deve essere un numero positivo";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.step2]);

  const validateStep3 = useCallback(() => {
    const errors: Record<string, string> = {};

    if (
      formData.step3.retailMultiplier === "" ||
      formData.step3.retailMultiplier <= 0
    ) {
      errors.retailMultiplier =
        "Moltiplicatore retail deve essere un numero positivo";
    }

    if (
      formData.step3.optimalMargin === "" ||
      formData.step3.optimalMargin < 0 ||
      formData.step3.optimalMargin > 100
    ) {
      errors.optimalMargin = "Margine ottimale deve essere tra 0 e 100";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.step3]);

  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      default:
        return true;
    }
  }, [currentStep, validateStep1, validateStep2, validateStep3]);

  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      setValidationErrors({});
    }
  }, [validateCurrentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setValidationErrors({});
  }, []);

  const updateFormData = useCallback(
    (
      step: keyof WizardFormData,
      data: Partial<WizardFormData[keyof WizardFormData]>
    ) => {
      setFormData((prev) => ({
        ...prev,
        [step]: {
          ...prev[step],
          ...data,
        },
      }));
    },
    []
  );

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setValidationErrors({});
  }, []);

  const getFinalFormData = useCallback(() => {
    return {
      description: formData.step1.description,
      purchaseCurrency: formData.step1.purchaseCurrency,
      sellingCurrency: formData.step1.sellingCurrency,
      qualityControlPercent: Number(formData.step2.qualityControlPercent),
      transportInsuranceCost: Number(formData.step2.transportInsuranceCost),
      duty: Number(formData.step2.duty),
      exchangeRate: Number(formData.step2.exchangeRate),
      italyAccessoryCosts: Number(formData.step2.italyAccessoryCosts),
      tools: Number(formData.step2.tools),
      retailMultiplier: Number(formData.step3.retailMultiplier),
      optimalMargin: Number(formData.step3.optimalMargin),
    };
  }, [formData]);

  const getCurrencyName = useCallback((code: string) => {
    const currency = CURRENCIES.find((c) => c.code === code);
    return currency ? currency.name : code;
  }, []);

  return {
    currentStep,
    formData,
    validationErrors,
    stepTitles,
    nextStep,
    prevStep,
    updateFormData,
    resetWizard,
    getFinalFormData,
    getCurrencyName,
    validateCurrentStep,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === 3,
  };
};
