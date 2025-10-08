#!/usr/bin/env node

/**
 * Test CRUD Completo per Pricing Calculator v0.2
 * Verifica tutte le funzioni CRUD dei parametri
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5001/api";
let authToken = null;

// Colori per output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log("🔐 Testando autenticazione...", "blue");
    const response = await axios.post(`${BASE_URL}/login`, {
      username: "admin",
      password: "admin123",
    });

    authToken = response.data.token;
    log("✅ Autenticazione riuscita", "green");
    return true;
  } catch (error) {
    log(`❌ Errore autenticazione: ${error.message}`, "red");
    return false;
  }
}

async function testGetCurrentParams() {
  try {
    log("\n📊 Test 1: Lettura parametri correnti", "blue");
    const response = await axios.get(`${BASE_URL}/params`);
    log(
      `✅ Parametri correnti: duty=${response.data.duty}, optimalMargin=${response.data.optimalMargin}`,
      "green"
    );
    return response.data;
  } catch (error) {
    log(`❌ Errore lettura parametri: ${error.message}`, "red");
    return null;
  }
}

async function testGetParameterSets() {
  try {
    log("\n📋 Test 2: Lista set di parametri", "blue");
    const response = await axios.get(`${BASE_URL}/parameter-sets`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`✅ Trovati ${response.data.length} set di parametri`, "green");
    return response.data;
  } catch (error) {
    log(`❌ Errore lettura set: ${error.message}`, "red");
    return [];
  }
}

async function testCreateParameterSet() {
  try {
    log("\n➕ Test 3: Creazione nuovo set", "blue");
    const newSet = {
      description: "Test Set CRUD",
      purchase_currency: "USD",
      selling_currency: "EUR",
      quality_control_percent: 5,
      transport_insurance_cost: 2.5,
      duty: 10,
      exchange_rate: 1.1,
      italy_accessory_costs: 0.5,
      tools: 1,
      retail_multiplier: 2.5,
      optimal_margin: 30,
      company_multiplier: 1.5,
      is_default: false,
      order_index: 999,
    };

    const response = await axios.post(`${BASE_URL}/parameter-sets`, newSet, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    log(`✅ Set creato con ID: ${response.data.id}`, "green");
    return response.data;
  } catch (error) {
    log(`❌ Errore creazione set: ${error.message}`, "red");
    if (error.response) {
      log(`   Dettagli: ${JSON.stringify(error.response.data)}`, "yellow");
    }
    return null;
  }
}

async function testUpdateParameterSet(setId) {
  try {
    log("\n✏️ Test 4: Modifica set di parametri", "blue");
    const updateData = {
      description: "Test Set CRUD - Modificato",
      duty: 15,
      optimal_margin: 35,
      purchase_currency: "EUR",
    };

    const response = await axios.put(
      `${BASE_URL}/parameter-sets/${setId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    log(
      `✅ Set modificato: duty=${response.data.duty}, optimalMargin=${response.data.optimal_margin}`,
      "green"
    );
    return response.data;
  } catch (error) {
    log(`❌ Errore modifica set: ${error.message}`, "red");
    if (error.response) {
      log(`   Status: ${error.response.status}`, "yellow");
      log(`   Dettagli: ${JSON.stringify(error.response.data)}`, "yellow");
    }
    return null;
  }
}

async function testLoadParameterSet(setId) {
  try {
    log("\n🔄 Test 5: Caricamento set di parametri", "blue");
    const response = await axios.post(
      `${BASE_URL}/parameter-sets/${setId}/load`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    log(`✅ Set caricato: ${response.data.message}`, "green");
    return response.data;
  } catch (error) {
    log(`❌ Errore caricamento set: ${error.message}`, "red");
    return null;
  }
}

async function testCalculation() {
  try {
    log("\n🧮 Test 6: Calcolo con parametri aggiornati", "blue");
    const response = await axios.post(`${BASE_URL}/calculate-selling`, {
      purchasePrice: 100,
    });

    log(
      `✅ Calcolo riuscito: retailPrice=${response.data.retailPrice}`,
      "green"
    );
    return response.data;
  } catch (error) {
    log(`❌ Errore calcolo: ${error.message}`, "red");
    return null;
  }
}

async function testDeleteParameterSet(setId) {
  try {
    log("\n🗑️ Test 7: Eliminazione set di parametri", "blue");
    const response = await axios.delete(`${BASE_URL}/parameter-sets/${setId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    log(`✅ Set eliminato: ${response.data.message}`, "green");
    return true;
  } catch (error) {
    log(`❌ Errore eliminazione set: ${error.message}`, "red");
    return false;
  }
}

async function runAllTests() {
  log(
    `${colors.bold}🧪 TEST CRUD COMPLETO - PRICING CALCULATOR v0.2${colors.reset}`,
    "blue"
  );
  log("=".repeat(60), "blue");

  // Test 1: Autenticazione
  const authSuccess = await login();
  if (!authSuccess) {
    log("❌ Test interrotti: autenticazione fallita", "red");
    return;
  }

  // Test 2: Lettura parametri
  const currentParams = await testGetCurrentParams();

  // Test 3: Lista set
  const parameterSets = await testGetParameterSets();

  // Test 4: Creazione set
  const newSet = await testCreateParameterSet();
  if (!newSet) {
    log("❌ Test interrotti: creazione set fallita", "red");
    return;
  }

  // Test 5: Modifica set (PROBLEMA IDENTIFICATO)
  const updatedSet = await testUpdateParameterSet(newSet.id);
  if (!updatedSet) {
    log(
      "⚠️ Modifica set fallita - questo è il problema da risolvere",
      "yellow"
    );
  }

  // Test 6: Caricamento set
  await testLoadParameterSet(newSet.id);

  // Test 7: Calcolo
  await testCalculation();

  // Test 8: Eliminazione set
  await testDeleteParameterSet(newSet.id);

  log("\n" + "=".repeat(60), "blue");
  log(`${colors.bold}🎯 TEST COMPLETATI${colors.reset}`, "green");
  log(
    "Verifica i risultati sopra per identificare eventuali problemi",
    "yellow"
  );
}

// Esegui i test
runAllTests().catch(console.error);
