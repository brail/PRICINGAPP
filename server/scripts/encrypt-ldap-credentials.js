#!/usr/bin/env node

/**
 * Script per crittografare le credenziali LDAP
 * Uso: node scripts/encrypt-ldap-credentials.js
 */

require("dotenv").config({ path: "./.env" });
const EncryptionService = require("../src/utils/encryption");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const encryptionService = new EncryptionService();

async function encryptCredentials() {
  console.log("🔐 Crittografia Credenziali LDAP Service Account");
  console.log("================================================\n");

  try {
    // Chiedi le credenziali
    const bindDN = await question("Inserisci il Bind DN del service account: ");
    const bindPassword = await question(
      "Inserisci la password del service account: ",
      true
    );

    if (!bindDN || !bindPassword) {
      console.error("❌ Bind DN e password sono richiesti!");
      process.exit(1);
    }

    // Crittografa le credenziali
    const encrypted = encryptionService.encryptLdapCredentials(
      bindDN,
      bindPassword
    );

    console.log("\n✅ Credenziali crittografate con successo!");
    console.log("\n📋 Aggiungi queste variabili al tuo file .env:");
    console.log("===============================================");
    console.log(`LDAP_BIND_DN_ENCRYPTED='${JSON.stringify(encrypted.bindDN)}'`);
    console.log(
      `LDAP_BIND_PASSWORD_ENCRYPTED='${JSON.stringify(encrypted.bindPassword)}'`
    );
    console.log("\n⚠️  IMPORTANTE:");
    console.log(
      "- Rimuovi le variabili LDAP_BIND_DN e LDAP_BIND_PASSWORD dal .env"
    );
    console.log("- Le credenziali sono crittografate con la chiave JWT_SECRET");
    console.log("- Mantieni JWT_SECRET sicuro e non condividerlo");
  } catch (error) {
    console.error("❌ Errore durante la crittografia:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function question(prompt, hidden = false) {
  return new Promise((resolve) => {
    if (hidden) {
      // Per input automatico, usa readline normale
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    } else {
      rl.question(prompt, resolve);
    }
  });
}

// Esegui lo script
encryptCredentials();
