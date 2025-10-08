/**
 * Calculation Routes per Pricing Calculator v0.2
 * Routes per i calcoli di prezzi e margini
 */

const express = require("express");
const router = express.Router();
const CalculationController = require("../controllers/calculationController");
const CalculationService = require("../services/calculationService");
const { validateCalculationParams } = require("../middleware/validation");

// Le istanze dei servizi vengono passate dal server principale
// Questa funzione restituisce le routes con le istanze dei servizi
const createCalculationRoutes = (parameterService, calculationService) => {
  const calculationController = new CalculationController(calculationService);

  // Middleware per validazione
  router.use(validateCalculationParams);

  // Route per calcoli
  router.post("/calculate-selling", (req, res) => {
    calculationController.calculateSellingPrice(req, res);
  });

  router.post("/calculate-purchase", (req, res) => {
    calculationController.calculatePurchasePrice(req, res);
  });

  router.post("/calculate-margin", (req, res) => {
    calculationController.calculateMargin(req, res);
  });

  router.get("/exchange-rates", (req, res) => {
    calculationController.getExchangeRates(req, res);
  });

  return router;
};

module.exports = createCalculationRoutes;
