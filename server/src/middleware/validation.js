/**
 * Validation Middleware per Pricing Calculator v0.2
 * Middleware per validazione dei dati in input
 */

const { loggers } = require("../../utils/logger");

/**
 * Valida i parametri di calcolo
 */
const validateCalculationParams = (req, res, next) => {
  const { purchasePrice, retailPrice } = req.body;

  if (req.path.includes("/calculate-selling") && purchasePrice !== undefined) {
    if (isNaN(purchasePrice) || purchasePrice < 0) {
      return res.status(400).json({
        error: "Prezzo di acquisto deve essere un numero positivo",
      });
    }
  }

  if (req.path.includes("/calculate-purchase") && retailPrice !== undefined) {
    if (isNaN(retailPrice) || retailPrice < 0) {
      return res.status(400).json({
        error: "Prezzo retail deve essere un numero positivo",
      });
    }
  }

  if (req.path.includes("/calculate-margin")) {
    if (
      purchasePrice !== undefined &&
      (isNaN(purchasePrice) || purchasePrice < 0)
    ) {
      return res.status(400).json({
        error: "Prezzo di acquisto deve essere un numero positivo",
      });
    }
    if (retailPrice !== undefined && (isNaN(retailPrice) || retailPrice < 0)) {
      return res.status(400).json({
        error: "Prezzo retail deve essere un numero positivo",
      });
    }
  }

  next();
};

/**
 * Valida i parametri per la creazione/aggiornamento di un set di parametri
 */
const validateParameterSet = (req, res, next) => {
  const {
    description,
    purchaseCurrency,
    sellingCurrency,
    qualityControlPercent,
    transportInsuranceCost,
    duty,
    exchangeRate,
    italyAccessoryCosts,
    tools,
    retailMultiplier,
    optimalMargin,
  } = req.body;

  const errors = [];

  // Validazione descrizione
  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    errors.push("Descrizione è obbligatoria");
  }

  // Validazione valute
  if (!purchaseCurrency || typeof purchaseCurrency !== "string") {
    errors.push("Valuta acquisto è obbligatoria");
  }
  if (!sellingCurrency || typeof sellingCurrency !== "string") {
    errors.push("Valuta vendita è obbligatoria");
  }

  // Validazione percentuali
  if (qualityControlPercent !== undefined) {
    if (
      isNaN(qualityControlPercent) ||
      qualityControlPercent < 0 ||
      qualityControlPercent > 100
    ) {
      errors.push("Quality Control deve essere un numero tra 0 e 100");
    }
  }

  if (duty !== undefined) {
    if (isNaN(duty) || duty < 0 || duty > 100) {
      errors.push("Dazio deve essere un numero tra 0 e 100");
    }
  }

  if (optimalMargin !== undefined) {
    if (isNaN(optimalMargin) || optimalMargin < 0 || optimalMargin > 100) {
      errors.push("Margine ottimale deve essere un numero tra 0 e 100");
    }
  }

  // Validazione costi
  if (transportInsuranceCost !== undefined) {
    if (isNaN(transportInsuranceCost) || transportInsuranceCost < 0) {
      errors.push(
        "Costo trasporto e assicurazione deve essere un numero positivo"
      );
    }
  }

  if (italyAccessoryCosts !== undefined) {
    if (isNaN(italyAccessoryCosts) || italyAccessoryCosts < 0) {
      errors.push("Costi accessori Italia deve essere un numero positivo");
    }
  }

  if (tools !== undefined) {
    if (isNaN(tools) || tools < 0) {
      errors.push("Tools deve essere un numero positivo");
    }
  }

  // Validazione tassi e moltiplicatori
  if (exchangeRate !== undefined) {
    if (isNaN(exchangeRate) || exchangeRate <= 0) {
      errors.push("Tasso di cambio deve essere un numero positivo");
    }
  }

  if (retailMultiplier !== undefined) {
    if (isNaN(retailMultiplier) || retailMultiplier <= 0) {
      errors.push("Moltiplicatore retail deve essere un numero positivo");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Errori di validazione",
      details: errors,
    });
  }

  next();
};

/**
 * Valida l'ID del parametro
 */
const validateParameterId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
    return res.status(400).json({
      error: "ID parametro non valido",
    });
  }

  req.params.id = parseInt(id);
  next();
};

/**
 * Valida l'ordine dei set di parametri
 */
const validateParameterSetsOrder = (req, res, next) => {
  const { parameterSets } = req.body;

  if (!parameterSets || !Array.isArray(parameterSets)) {
    return res.status(400).json({
      error: "Lista parametri non valida",
    });
  }

  // Verifica che ogni elemento abbia un ID
  for (const paramSet of parameterSets) {
    if (!paramSet.id || isNaN(parseInt(paramSet.id))) {
      return res.status(400).json({
        error: "Ogni set di parametri deve avere un ID valido",
      });
    }
  }

  next();
};

module.exports = {
  validateCalculationParams,
  validateParameterSet,
  validateParameterId,
  validateParameterSetsOrder,
};
