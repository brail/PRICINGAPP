/**
 * Calculation Service per Pricing Calculator v0.2
 * Business logic per i calcoli di prezzi e margini
 */

const axios = require("axios");
const { loggers } = require("../../utils/logger");

class CalculationService {
  constructor(parameterService = null) {
    // Cache per i tassi di cambio (aggiornati ogni ora)
    this.exchangeRates = {};
    this.lastExchangeUpdate = 0;
    this.parameterService = parameterService;
  }

  /**
   * Ottieni parametri attuali
   */
  get currentParams() {
    return this.parameterService ? this.parameterService.currentParams : null;
  }

  /**
   * Funzione per calcolare dinamicamente il companyMultiplier
   */
  calculateCompanyMultiplier(optimalMargin) {
    if (optimalMargin <= 0 || optimalMargin >= 100) {
      return 1; // Valore di fallback per margini non validi
    }
    const multiplier = 1 / (1 - optimalMargin / 100);
    return Math.round(multiplier * 100) / 100; // Tronca a 2 cifre decimali
  }

  /**
   * Funzione per arrotondare il prezzo retail finale
   */
  roundRetailPrice(price) {
    if (isNaN(price) || !isFinite(price) || price <= 0) {
      return 0;
    }

    // Se il prezzo è molto piccolo (meno di 10), arrotonda a 9.9
    if (price < 10) {
      return 9.9;
    }

    const integerPart = Math.floor(price);
    const decimalPart = price - integerPart;
    const tens = Math.floor(integerPart / 10) * 10;

    // Calcola la parte finale (cifra unità + decimale)
    const finalPart = (integerPart % 10) + decimalPart;

    if (finalPart >= 0.0 && finalPart <= 2.4) {
      // Arrotonda alla decina precedente + 9.9
      return Math.max(9.9, tens - 10 + 9.9);
    } else if (finalPart >= 2.5 && finalPart <= 7.4) {
      // Arrotonda alla decina corrente + 4.9
      return tens + 4.9;
    } else if (finalPart >= 7.5 && finalPart <= 9.9) {
      // Arrotonda alla decina corrente + 9.9
      return tens + 9.9;
    } else {
      // Fallback (non dovrebbe mai arrivare qui)
      return tens + 4.9;
    }
  }

  /**
   * Funzione per arrotondare il prezzo di acquisto per difetto alla prima cifra decimale
   */
  roundPurchasePrice(price) {
    if (isNaN(price) || !isFinite(price)) {
      return 0;
    }

    // Arrotonda per difetto alla prima cifra decimale
    // Esempio: 21.43 -> 21.40, 21.49 -> 21.40
    return Math.floor(price * 10) / 10;
  }

  /**
   * Funzione per arrotondare a due decimali
   */
  roundUpToTwoDecimals(num) {
    if (isNaN(num) || !isFinite(num)) {
      return "0.00";
    }
    return (Math.ceil(num * 100) / 100).toFixed(2);
  }

  /**
   * Funzione per convertire valuta
   */
  async convertCurrency(amount, fromCurrency, toCurrency, exchangeRate = null) {
    if (fromCurrency === toCurrency) return amount;

    // Se viene fornito un exchangeRate esplicito, usalo come tasso di cambio diretto
    if (exchangeRate !== null && exchangeRate !== undefined) {
      // L'exchangeRate rappresenta il tasso da purchaseCurrency a sellingCurrency
      // Quindi:
      // - Da purchaseCurrency a sellingCurrency: moltiplica per exchangeRate
      // - Da sellingCurrency a purchaseCurrency: dividi per exchangeRate

      // Se stiamo convertendo da purchaseCurrency a sellingCurrency
      if (fromCurrency === toCurrency) return amount;

      // Per ora assumiamo che exchangeRate sia sempre il tasso da purchaseCurrency a sellingCurrency
      // Quindi per convertire da sellingCurrency a purchaseCurrency dividiamo
      return amount / exchangeRate;
    }

    // Altrimenti usa i tassi di cambio dall'API
    const rates = await this.getExchangeRates();
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // Converti prima in EUR, poi nella valuta target
    const eurAmount = fromCurrency === "EUR" ? amount : amount / fromRate;
    return toCurrency === "EUR" ? eurAmount : eurAmount * toRate;
  }

  /**
   * Funzione per ottenere i tassi di cambio
   */
  async getExchangeRates() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (
      now - this.lastExchangeUpdate < oneHour &&
      Object.keys(this.exchangeRates).length > 0
    ) {
      return this.exchangeRates;
    }

    try {
      // Usando exchangerate-api.com (gratuito)
      const response = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/EUR"
      );
      this.exchangeRates = response.data.rates;
      this.lastExchangeUpdate = now;
      return this.exchangeRates;
    } catch (error) {
      loggers.error(error, { context: "getExchangeRates" });
      // Fallback con tassi fissi
      return {
        EUR: 1,
        USD: 1.08,
        GBP: 0.85,
        JPY: 160.5,
      };
    }
  }

  /**
   * Calcolo prezzo di vendita da prezzo di acquisto
   */
  async calculateSellingPrice(purchasePrice, params) {
    const {
      qualityControlPercent,
      transportInsuranceCost,
      duty,
      exchangeRate,
      italyAccessoryCosts,
      tools,
      retailMultiplier,
      optimalMargin,
    } = params;

    // Calcola dinamicamente il companyMultiplier
    const companyMultiplier = this.calculateCompanyMultiplier(optimalMargin);

    // 1. Quality Control + Tools
    const qualityControlCost = purchasePrice * (qualityControlPercent / 100);
    const priceWithQC = purchasePrice + qualityControlCost + tools;

    // 2. Trasporto + Assicurazione
    const priceWithTransport = priceWithQC + transportInsuranceCost;

    // 3. Dazio
    const dutyCost = priceWithTransport * (duty / 100);
    const priceWithDuty = priceWithTransport + dutyCost;

    // 4. Converti in valuta di vendita
    const priceWithDutyInSellingCurrency = priceWithDuty / exchangeRate;

    // 5. Costi accessori Italia
    const landedCost = priceWithDutyInSellingCurrency + italyAccessoryCosts;

    // 6. Moltiplicatore aziendale
    const wholesalePrice = landedCost * companyMultiplier;

    // 7. Moltiplicatore retail
    const retailPriceRaw = wholesalePrice * retailMultiplier;
    const retailPrice = this.roundRetailPrice(retailPriceRaw);

    // 8. Calcola il margine reale
    const companyMargin = (wholesalePrice - landedCost) / wholesalePrice;

    return {
      purchasePrice,
      qualityControlCost,
      priceWithQC,
      transportInsuranceCost,
      priceWithTransport,
      dutyCost,
      priceWithDuty,
      italyAccessoryCosts,
      landedCost,
      wholesalePrice,
      retailPrice,
      retailPriceRaw,
      companyMargin,
    };
  }

  /**
   * Calcolo prezzo di acquisto da prezzo di vendita
   */
  async calculatePurchasePrice(retailPrice, params) {
    const {
      italyAccessoryCosts,
      duty,
      transportInsuranceCost,
      qualityControlPercent,
      tools,
      retailMultiplier,
      exchangeRate,
      optimalMargin,
    } = params;

    // Calcola dinamicamente il companyMultiplier
    const companyMultiplier = this.calculateCompanyMultiplier(optimalMargin);

    // 1. Rimuovi moltiplicatore retail
    const wholesalePrice = retailPrice / retailMultiplier;

    // 2. Rimuovi moltiplicatore aziendale
    const landedCost = wholesalePrice / companyMultiplier;

    // 3. Rimuovi costi accessori Italia
    const priceWithoutAccessories = landedCost - italyAccessoryCosts;

    // 4. Rimuovi dazio
    const priceWithoutDuty = priceWithoutAccessories / (1 + duty / 100);
    const dutyCost = priceWithoutAccessories - priceWithoutDuty;

    // 5. Converti prezzo senza dazio nella valuta di acquisto
    const priceWithoutDutyInPurchasingCurrency =
      priceWithoutDuty * exchangeRate;

    // 6. Rimuovi trasporto + assicurazione
    const priceWithoutTransport =
      priceWithoutDutyInPurchasingCurrency - transportInsuranceCost;

    // 7. Rimuovi quality control
    const purchasePriceBeforeTools =
      priceWithoutTransport / (1 + qualityControlPercent / 100);
    const qualityControlCost = priceWithoutTransport - purchasePriceBeforeTools;

    // 8. Rimuovi tools (ultimo passaggio dopo quality control)
    const purchasePriceRaw = purchasePriceBeforeTools - tools;
    const purchasePrice = this.roundPurchasePrice(purchasePriceRaw);

    // 9. Calcola il margine reale
    const companyMargin = (wholesalePrice - landedCost) / wholesalePrice;

    return {
      retailPrice, // Nel calcolo inverso, retailPrice è l'input dell'utente
      retailPriceRaw: retailPrice, // Nel calcolo inverso, retailPrice è l'input
      wholesalePrice,
      landedCost,
      italyAccessoryCosts,
      priceWithoutAccessories,
      dutyCost,
      priceWithoutDuty,
      transportInsuranceCost,
      priceWithoutTransport,
      qualityControlCost,
      purchasePrice, // Prezzo arrotondato
      purchasePriceRaw, // Prezzo finale senza arrotondamento
      companyMargin,
    };
  }

  /**
   * Calcola margine da due prezzi (acquisto e vendita)
   */
  async calculateMargin(purchasePrice, retailPrice, params) {
    // Calcola landedCost dal prezzo di acquisto
    const sellingResult = await this.calculateSellingPrice(
      purchasePrice,
      params
    );

    // Calcola wholesalePrice dal prezzo di vendita
    const purchaseResult = await this.calculatePurchasePrice(
      retailPrice,
      params
    );

    const landedCost = sellingResult.landedCost;
    const wholesalePrice = purchaseResult.wholesalePrice;
    const companyMargin = (wholesalePrice - landedCost) / wholesalePrice;

    return {
      landedCost,
      wholesalePrice,
      companyMargin,
    };
  }
}

module.exports = CalculationService;
