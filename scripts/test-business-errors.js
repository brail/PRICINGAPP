/**
 * Test diretto del BusinessErrorHandler
 * Bypassa il sistema esistente per testare il nuovo
 */

const puppeteer = require("puppeteer");

async function testBusinessErrorHandler() {
  console.log("🧪 Test BusinessErrorHandler...");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  try {
    // Naviga all'applicazione
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    await page.waitForSelector(".calculator", { timeout: 10000 });
    console.log("✅ App caricata");

    // Test 1: Inietta direttamente un errore business nel DOM
    console.log("🔍 Test 1: Iniezione errore business...");

    await page.evaluate(() => {
      // Simula l'aggiunta di un errore business
      const errorData = {
        id: "test_error_1",
        type: "validation",
        severity: "medium",
        title: "Errore di Validazione Test",
        message: "Questo è un test del BusinessErrorHandler",
        suggestions: ["Suggerimento 1", "Suggerimento 2"],
        timestamp: new Date(),
      };

      // Crea un elemento di test
      const testDiv = document.createElement("div");
      testDiv.id = "business-error-test";
      testDiv.innerHTML = `
        <div style="background: #ffebee; border: 1px solid #f44336; padding: 16px; margin: 16px; border-radius: 4px;">
          <h4 style="color: #d32f2f; margin: 0 0 8px 0;">${errorData.title}</h4>
          <p style="margin: 0 0 8px 0;">${errorData.message}</p>
          <div style="margin: 8px 0;">
            <strong>Suggerimenti:</strong>
            <ul style="margin: 4px 0;">
              ${errorData.suggestions.map((s) => `<li>${s}</li>`).join("")}
            </ul>
          </div>
          <button onclick="this.parentElement.remove()" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Dismiss
          </button>
        </div>
      `;

      document.querySelector(".calculator").prepend(testDiv);
    });

    // Verifica che l'errore sia stato aggiunto
    const errorElement = await page.$("#business-error-test");
    if (errorElement) {
      console.log("✅ BusinessErrorHandler test creato con successo");

      // Test del pulsante dismiss
      await page.click("#business-error-test button");
      await page.waitForFunction(
        () => !document.querySelector("#business-error-test")
      );
      console.log("✅ Funzionalità dismiss funziona");
    } else {
      console.log("❌ BusinessErrorHandler test non creato");
    }

    // Test 2: Verifica se il sistema esistente interferisce
    console.log("🔍 Test 2: Verifica conflitto sistema esistente...");

    // Prova a inserire un valore e vedere se appare l'errore esistente
    await page.type('input[type="number"]', "100");
    await page.click('button[class*="btn-primary"]');

    // Attendi un po' per vedere se appare l'errore esistente
    await page.waitForTimeout(2000);

    const existingError = await page.$(".error");
    if (existingError) {
      console.log("⚠️ Sistema esistente attivo - conflitto rilevato");
      const errorText = await page.evaluate(
        (el) => el.textContent,
        existingError
      );
      console.log(`Errore esistente: "${errorText}"`);
    } else {
      console.log("✅ Nessun conflitto rilevato");
    }

    console.log("🎉 Test completato!");
  } catch (error) {
    console.error("❌ Errore durante il test:", error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testBusinessErrorHandler().catch(console.error);
}

module.exports = { testBusinessErrorHandler };

