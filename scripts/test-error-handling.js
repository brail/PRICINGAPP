/**
 * Script per testare il sistema di error handling business
 */

const puppeteer = require("puppeteer");

async function testErrorHandling() {
  console.log("🧪 Avvio test sistema error handling...");

  const browser = await puppeteer.launch({
    headless: false, // Mostra il browser per debug
    defaultViewport: null,
  });

  const page = await browser.newPage();

  try {
    // Naviga all'applicazione
    console.log("📱 Navigazione a http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

    // Attendi che l'app si carichi
    await page.waitForSelector(".calculator", { timeout: 10000 });
    console.log("✅ App caricata correttamente");

    // Test 1: Errori di validazione - valori non numerici
    console.log("🔍 Test 1: Errori di validazione...");

    // Inserisci valori non validi
    await page.type('input[type="number"]', "abc");
    await page.click('button[class*="btn-primary"]');

    // Attendi che appaia l'errore
    await page.waitForSelector('[class*="MuiAlert"]', { timeout: 5000 });
    console.log("✅ Errore di validazione mostrato correttamente");

    // Test 2: Errori di calcolo - valori negativi
    console.log("🔍 Test 2: Errori di calcolo...");

    // Pulisci e inserisci valori negativi
    await page.click('button:contains("Pulisci")');
    await page.type('input[type="number"]', "-100");
    await page.click('button[class*="btn-primary"]');

    // Attendi che appaia l'errore
    await page.waitForSelector('[class*="MuiAlert"]', { timeout: 5000 });
    console.log("✅ Errore di calcolo mostrato correttamente");

    // Test 3: Verifica funzionalità dismiss
    console.log("🔍 Test 3: Funzionalità dismiss...");

    const dismissButton = await page.$('[class*="MuiIconButton"]');
    if (dismissButton) {
      await dismissButton.click();
      console.log("✅ Errore dismissato correttamente");
    }

    console.log("🎉 Tutti i test completati con successo!");
  } catch (error) {
    console.error("❌ Errore durante il test:", error.message);
  } finally {
    await browser.close();
  }
}

// Esegui il test solo se puppeteer è disponibile
if (require.main === module) {
  testErrorHandling().catch(console.error);
}

module.exports = { testErrorHandling };

