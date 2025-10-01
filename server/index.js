const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

// Importa il modulo database
const {
  initDatabase,
  seedDatabase,
  getAllParameterSets,
  getParameterSetById,
  getDefaultParameterSet,
  createParameterSet,
  updateParameterSet,
  deleteParameterSet,
  setDefaultParameterSet,
  updateParameterSetsOrder,
} = require("./database");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione parametri attuali (caricati dal database)
let currentParams = {
  purchaseCurrency: "USD",
  sellingCurrency: "EUR",
  qualityControlPercent: 5,
  transportInsuranceCost: 2.3,
  duty: 8,
  exchangeRate: 1.07,
  italyAccessoryCosts: 1,
  tools: 1.0,
  companyMultiplier: 1.33, // Calcolato dinamicamente da optimalMargin (25%)
  retailMultiplier: 2.48,
  optimalMargin: 25,
};

// Cache per i tassi di cambio (aggiornati ogni ora)
let exchangeRates = {};
let lastExchangeUpdate = 0;

// Funzione per caricare i parametri dal database
const loadParametersFromDatabase = async () => {
  try {
    const defaultSet = await getDefaultParameterSet();
    if (defaultSet) {
      currentParams = {
        purchaseCurrency: defaultSet.purchase_currency,
        sellingCurrency: defaultSet.selling_currency,
        qualityControlPercent: defaultSet.quality_control_percent,
        transportInsuranceCost: defaultSet.transport_insurance_cost,
        duty: defaultSet.duty,
        exchangeRate: defaultSet.exchange_rate,
        italyAccessoryCosts: defaultSet.italy_accessory_costs,
        tools: defaultSet.tools,
        companyMultiplier: calculateCompanyMultiplier(
          defaultSet.optimal_margin
        ),
        retailMultiplier: defaultSet.retail_multiplier,
        optimalMargin: defaultSet.optimal_margin,
      };
      console.log("Parametri caricati dal database:", currentParams);
    }
  } catch (error) {
    console.error("Errore nel caricamento dei parametri dal database:", error);
  }
};

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

// Funzione per calcolare dinamicamente il companyMultiplier
function calculateCompanyMultiplier(optimalMargin) {
  if (optimalMargin <= 0 || optimalMargin >= 100) {
    return 1; // Valore di fallback per margini non validi
  }
  const multiplier = 1 / (1 - optimalMargin / 100);
  return Math.round(multiplier * 100) / 100; // Tronca a 2 cifre decimali
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
async function calculateSellingPrice(purchasePrice, params = currentParams) {
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
  const companyMultiplier = calculateCompanyMultiplier(optimalMargin);

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
async function calculatePurchasePrice(retailPrice, params = currentParams) {
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
  const companyMultiplier = calculateCompanyMultiplier(optimalMargin);

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
  const purchasePriceBeforeTools =
    priceWithoutTransport / (1 + qualityControlPercent / 100);
  const qualityControlCost = priceWithoutTransport - purchasePriceBeforeTools;

  // 8. Rimuovi tools (ultimo passaggio dopo quality control)
  const purchasePriceRaw = purchasePriceBeforeTools - tools;
  const purchasePrice = roundPurchasePrice(purchasePriceRaw);

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

// API Routes

// Ottieni parametri attuali
app.get("/api/params", (req, res) => {
  res.json(currentParams);
});

// Aggiorna parametri attuali
app.put("/api/params", (req, res) => {
  const {
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

  if (purchaseCurrency !== undefined)
    currentParams.purchaseCurrency = purchaseCurrency;
  if (sellingCurrency !== undefined)
    currentParams.sellingCurrency = sellingCurrency;
  if (qualityControlPercent !== undefined)
    currentParams.qualityControlPercent = Math.max(0, qualityControlPercent);
  if (transportInsuranceCost !== undefined)
    currentParams.transportInsuranceCost = Math.max(0, transportInsuranceCost);
  if (duty !== undefined) currentParams.duty = Math.max(0, duty);
  if (exchangeRate !== undefined)
    currentParams.exchangeRate = Math.max(0.001, exchangeRate);
  if (italyAccessoryCosts !== undefined)
    currentParams.italyAccessoryCosts = Math.max(0, italyAccessoryCosts);
  if (tools !== undefined) currentParams.tools = Math.max(0, tools);
  if (retailMultiplier !== undefined)
    currentParams.retailMultiplier = Math.max(0.1, retailMultiplier);
  if (optimalMargin !== undefined)
    currentParams.optimalMargin = Math.max(0, Math.min(100, optimalMargin));

  // Calcola dinamicamente il companyMultiplier
  currentParams.companyMultiplier = calculateCompanyMultiplier(
    currentParams.optimalMargin
  );

  res.json(currentParams);
});

// Calcola prezzo di vendita
app.post("/api/calculate-selling", async (req, res) => {
  try {
    const { purchasePrice } = req.body;
    const params = { ...currentParams };

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
    const params = { ...currentParams };

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

// API CRUD per i set di parametri

// Ottieni tutti i set di parametri
app.get("/api/parameter-sets", async (req, res) => {
  try {
    const parameterSets = await getAllParameterSets();
    res.json(parameterSets);
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero dei set di parametri" });
  }
});

// Ottieni un set di parametri per ID
app.get("/api/parameter-sets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const parameterSet = await getParameterSetById(id);
    if (parameterSet) {
      res.json(parameterSet);
    } else {
      res.status(404).json({ error: "Set di parametri non trovato" });
    }
  } catch (error) {
    res.status(500).json({ error: "Errore nel recupero del set di parametri" });
  }
});

// Carica un set di parametri come attuale
app.post("/api/parameter-sets/:id/load", async (req, res) => {
  try {
    const { id } = req.params;
    const parameterSet = await getParameterSetById(id);
    if (parameterSet) {
      // Aggiorna i parametri attuali
      currentParams = {
        purchaseCurrency: parameterSet.purchase_currency,
        sellingCurrency: parameterSet.selling_currency,
        qualityControlPercent: parameterSet.quality_control_percent,
        transportInsuranceCost: parameterSet.transport_insurance_cost,
        duty: parameterSet.duty,
        exchangeRate: parameterSet.exchange_rate,
        italyAccessoryCosts: parameterSet.italy_accessory_costs,
        tools: parameterSet.tools,
        companyMultiplier: parameterSet.company_multiplier,
        retailMultiplier: parameterSet.retail_multiplier,
        optimalMargin: parameterSet.optimal_margin,
      };
      res.json({
        message: "Parametri caricati con successo",
        params: currentParams,
      });
    } else {
      res.status(404).json({ error: "Set di parametri non trovato" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nel caricamento del set di parametri" });
  }
});

// Crea un nuovo set di parametri
app.post("/api/parameter-sets", async (req, res) => {
  try {
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

    // Validazione
    if (!description) {
      return res.status(400).json({ error: "Descrizione è obbligatoria" });
    }

    const newParameterSet = await createParameterSet({
      description,
      purchase_currency: purchaseCurrency,
      selling_currency: sellingCurrency,
      quality_control_percent: qualityControlPercent,
      transport_insurance_cost: transportInsuranceCost,
      duty,
      exchange_rate: exchangeRate,
      italy_accessory_costs: italyAccessoryCosts,
      tools,
      company_multiplier: calculateCompanyMultiplier(optimalMargin),
      retail_multiplier: retailMultiplier,
      optimal_margin: optimalMargin,
    });

    res.status(201).json(newParameterSet);
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({
        error: "Un set di parametri con questa descrizione esiste già",
      });
    } else {
      res
        .status(500)
        .json({ error: "Errore nella creazione del set di parametri" });
    }
  }
});

// Aggiorna l'ordine dei set di parametri
app.put("/api/parameter-sets/order", async (req, res) => {
  try {
    const { parameterSets } = req.body;

    if (!parameterSets || !Array.isArray(parameterSets)) {
      return res.status(400).json({ error: "Lista parametri non valida" });
    }

    await updateParameterSetsOrder(parameterSets);
    res.json({ message: "Ordine aggiornato con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'ordine:", error);
    res.status(500).json({ error: "Errore nell'aggiornamento dell'ordine" });
  }
});

// Aggiorna un set di parametri
app.put("/api/parameter-sets/:id", async (req, res) => {
  try {
    const { id } = req.params;
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

    const updatedParameterSet = await updateParameterSet(id, {
      description,
      purchase_currency: purchaseCurrency,
      selling_currency: sellingCurrency,
      quality_control_percent: qualityControlPercent,
      transport_insurance_cost: transportInsuranceCost,
      duty,
      exchange_rate: exchangeRate,
      italy_accessory_costs: italyAccessoryCosts,
      tools,
      company_multiplier: calculateCompanyMultiplier(optimalMargin),
      retail_multiplier: retailMultiplier,
      optimal_margin: optimalMargin,
    });

    res.json(updatedParameterSet);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nell'aggiornamento del set di parametri" });
  }
});

// Elimina un set di parametri
app.delete("/api/parameter-sets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteParameterSet(id);

    if (result.deletedRows > 0) {
      res.json({ message: "Set di parametri eliminato con successo" });
    } else {
      res.status(404).json({ error: "Set di parametri non trovato" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Errore nell'eliminazione del set di parametri" });
  }
});

// Imposta un set di parametri come default
app.post("/api/parameter-sets/:id/set-default", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await setDefaultParameterSet(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Errore nell'impostazione del set di parametri come default",
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Inizializza il database e avvia il server
const startServer = async () => {
  try {
    // Inizializza il database
    await initDatabase();
    console.log("Database inizializzato con successo");

    // Seeding del database
    await seedDatabase();
    console.log("Seeding del database completato");

    // Carica i parametri dal database
    await loadParametersFromDatabase();
    console.log("Parametri caricati dal database");

    // Avvia il server
    app.listen(PORT, () => {
      console.log(`Server in esecuzione sulla porta ${PORT}`);
    });
  } catch (error) {
    console.error("Errore nell'inizializzazione del server:", error);
    process.exit(1);
  }
};

// Avvia il server
startServer();
