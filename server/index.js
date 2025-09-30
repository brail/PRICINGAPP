const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione default parametri
let defaultParams = {
  purchaseCurrency: "USD",
  sellingCurrency: "EUR",
  qualityControlPercent: 5, // percentuale quality control
  transportInsuranceCost: 2.3, // costo trasporto + assicurazione
  duty: 8, // dazio
  exchangeRate: 1.07, // cambio
  italyAccessoryCosts: 1, // costi accessori Italia
  companyMultiplier: 2.08, // moltiplicatore aziendale
  retailMultiplier: 2.48, // moltiplicatore retail
  optimalMargin: 25, // margine ottimale in percentuale
};

// Cache per i tassi di cambio (aggiornati ogni ora)
let exchangeRates = {};
let lastExchangeUpdate = 0;

// Funzione per ottenere i tassi di cambio
async function getExchangeRates() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (
    now - lastExchangeUpdate < oneHour &&
    Object.keys(exchangeRates).length > 0
  ) {
    return exchangeRates;
  }

  try {
    // Usando exchangerate-api.com (gratuito)
    const response = await axios.get(
      "https://api.exchangerate-api.com/v4/latest/EUR"
    );
    exchangeRates = response.data.rates;
    lastExchangeUpdate = now;
    return exchangeRates;
  } catch (error) {
    console.error("Errore nel recupero tassi di cambio:", error);
    // Fallback con tassi fissi
    return {
      EUR: 1,
      USD: 1.08,
      GBP: 0.85,
      JPY: 160.5,
    };
  }
}

// Funzione per arrotondare il prezzo retail finale
function roundRetailPrice(price) {
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

// Funzione per arrotondare il prezzo di acquisto per difetto alla prima cifra decimale
function roundPurchasePrice(price) {
  if (isNaN(price) || !isFinite(price)) {
    return 0;
  }

  // Arrotonda per difetto alla prima cifra decimale
  // Esempio: 21.43 -> 21.40, 21.49 -> 21.40
  return Math.floor(price * 10) / 10;
}

function roundUpToTwoDecimals(num) {
  if (isNaN(num) || !isFinite(num)) {
    return "0.00";
  }
  return (Math.ceil(num * 100) / 100).toFixed(2);
}

// Funzione per convertire valuta
async function convertCurrency(
  amount,
  fromCurrency,
  toCurrency,
  exchangeRate = null
) {
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
  const rates = await getExchangeRates();
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Converti prima in EUR, poi nella valuta target
  const eurAmount = fromCurrency === "EUR" ? amount : amount / fromRate;
  return toCurrency === "EUR" ? eurAmount : eurAmount * toRate;
}

// Calcolo prezzo di vendita da prezzo di acquisto
async function calculateSellingPrice(purchasePrice, params) {
  const {
    qualityControlPercent,
    transportInsuranceCost,
    duty,
    exchangeRate,
    italyAccessoryCosts,
    companyMultiplier,
    retailMultiplier,
  } = params;

  // 1. Quality Control
  const qualityControlCost = purchasePrice * (qualityControlPercent / 100);
  const priceWithQC = purchasePrice + qualityControlCost;

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
  console.log("Retail price raw:", retailPriceRaw);
  const retailPrice = roundRetailPrice(retailPriceRaw);
  console.log("Retail price rounded:", retailPrice);

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

// Calcolo prezzo di acquisto da prezzo di vendita
async function calculatePurchasePrice(retailPrice, params) {
  const {
    italyAccessoryCosts,
    duty,
    transportInsuranceCost,
    qualityControlPercent,
    companyMultiplier,
    retailMultiplier,
    exchangeRate,
  } = params;

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
  const priceWithoutDutyInPurchasingCurrency = priceWithoutDuty * exchangeRate;

  // 6. Rimuovi trasporto + assicurazione
  const priceWithoutTransport =
    priceWithoutDutyInPurchasingCurrency - transportInsuranceCost;

  // 7. Rimuovi quality control
  const purchasePriceRaw =
    priceWithoutTransport / (1 + qualityControlPercent / 100);
  const purchasePrice = roundPurchasePrice(purchasePriceRaw);
  const qualityControlCost = priceWithoutTransport - purchasePrice;

  // 8. Calcola il margine reale
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
    purchasePrice,
    purchasePriceRaw,
    companyMargin,
  };
}

// API Routes

// Ottieni parametri attuali
app.get("/api/params", (req, res) => {
  res.json(defaultParams);
});

// Aggiorna parametri
app.put("/api/params", (req, res) => {
  const {
    purchaseCurrency,
    sellingCurrency,
    qualityControlPercent,
    transportInsuranceCost,
    duty,
    exchangeRate,
    italyAccessoryCosts,
    companyMultiplier,
    retailMultiplier,
    optimalMargin,
  } = req.body;

  if (purchaseCurrency !== undefined)
    defaultParams.purchaseCurrency = purchaseCurrency;
  if (sellingCurrency !== undefined)
    defaultParams.sellingCurrency = sellingCurrency;
  if (qualityControlPercent !== undefined)
    defaultParams.qualityControlPercent = Math.max(0, qualityControlPercent);
  if (transportInsuranceCost !== undefined)
    defaultParams.transportInsuranceCost = Math.max(0, transportInsuranceCost);
  if (duty !== undefined) defaultParams.duty = Math.max(0, duty);
  if (exchangeRate !== undefined)
    defaultParams.exchangeRate = Math.max(0.001, exchangeRate);
  if (italyAccessoryCosts !== undefined)
    defaultParams.italyAccessoryCosts = Math.max(0, italyAccessoryCosts);
  if (companyMultiplier !== undefined)
    defaultParams.companyMultiplier = Math.max(0.1, companyMultiplier);
  if (retailMultiplier !== undefined)
    defaultParams.retailMultiplier = Math.max(0.1, retailMultiplier);
  if (optimalMargin !== undefined)
    defaultParams.optimalMargin = Math.max(0, Math.min(100, optimalMargin));

  res.json(defaultParams);
});

// Calcola prezzo di vendita
app.post("/api/calculate-selling", async (req, res) => {
  try {
    const { purchasePrice } = req.body;
    const params = { ...defaultParams };

    // Converti prezzo di acquisto in valuta di vendita usando il tasso di cambio
    //const purchasePriceInSellingCurrency = purchasePrice * params.exchangeRate;
    const result = await calculateSellingPrice(purchasePrice, params);

    res.json({
      ...result,
      purchaseCurrency: params.purchaseCurrency,
      sellingCurrency: params.sellingCurrency,
      params,
    });
  } catch (error) {
    res.status(500).json({ error: "Errore nel calcolo del prezzo di vendita" });
  }
});

// Calcola prezzo di acquisto
app.post("/api/calculate-purchase", async (req, res) => {
  try {
    const { retailPrice } = req.body;
    const params = { ...defaultParams };

    const result = await calculatePurchasePrice(retailPrice, params);

    res.json({
      ...result,
      purchaseCurrency: params.purchaseCurrency,
      sellingCurrency: params.sellingCurrency,
      params,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nel calcolo del prezzo di acquisto" });
  }
});

// Ottieni tassi di cambio
app.get("/api/exchange-rates", async (req, res) => {
  try {
    const rates = await getExchangeRates();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero dei tassi di cambio" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});
