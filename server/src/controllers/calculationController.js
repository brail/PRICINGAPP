/**
 * Calculation Controller per Pricing Calculator v0.2
 * Gestisce i calcoli di prezzi e margini
 */

const { loggers } = require("../../utils/logger");

class CalculationController {
  constructor(calculationService) {
    this.calculationService = calculationService;
  }

  /**
   * Calcola prezzo di vendita da prezzo di acquisto
   */
  async calculateSellingPrice(req, res) {
    try {
      const { purchasePrice } = req.body;
      const params = req.params || {};

      const result = await this.calculationService.calculateSellingPrice(
        purchasePrice,
        params
      );

      // Log del calcolo
      loggers.calculation.selling(purchasePrice, result, params);

      res.json({
        ...result,
        purchaseCurrency: params.purchaseCurrency,
        sellingCurrency: params.sellingCurrency,
        params,
      });
    } catch (error) {
      loggers.error(error, { context: "calculateSellingPrice" });
      res
        .status(500)
        .json({ error: "Errore nel calcolo del prezzo di vendita" });
    }
  }

  /**
   * Calcola prezzo di acquisto da prezzo di vendita
   */
  async calculatePurchasePrice(req, res) {
    try {
      const { retailPrice } = req.body;
      const params = req.params || {};

      const result = await this.calculationService.calculatePurchasePrice(
        retailPrice,
        params
      );

      // Log del calcolo
      loggers.calculation.purchase(retailPrice, result, params);

      res.json({
        ...result,
        purchaseCurrency: params.purchaseCurrency,
        sellingCurrency: params.sellingCurrency,
        params,
      });
    } catch (error) {
      loggers.error(error, { context: "calculatePurchasePrice" });
      res
        .status(500)
        .json({ error: "Errore nel calcolo del prezzo di acquisto" });
    }
  }

  /**
   * Calcola margine da due prezzi (acquisto e vendita)
   */
  async calculateMargin(req, res) {
    try {
      const { purchasePrice, retailPrice } = req.body;
      const params = req.params || {};

      const result = await this.calculationService.calculateMargin(
        purchasePrice,
        retailPrice,
        params
      );

      // Log del calcolo
      loggers.calculation.margin(
        purchasePrice,
        retailPrice,
        result.companyMargin,
        params
      );

      res.json({
        purchasePrice,
        retailPrice,
        landedCost: result.landedCost,
        wholesalePrice: result.wholesalePrice,
        companyMargin: result.companyMargin,
        purchaseCurrency: params.purchaseCurrency,
        sellingCurrency: params.sellingCurrency,
        params,
      });
    } catch (error) {
      loggers.error(error, { context: "calculateMargin" });
      res.status(500).json({ error: "Errore nel calcolo del margine" });
    }
  }

  /**
   * Ottieni tassi di cambio
   */
  async getExchangeRates(req, res) {
    try {
      const rates = await this.calculationService.getExchangeRates();
      res.json(rates);
    } catch (error) {
      loggers.error(error, { context: "getExchangeRates" });
      res
        .status(500)
        .json({ error: "Errore nel recupero dei tassi di cambio" });
    }
  }
}

module.exports = CalculationController;
