/**
 * Migration 007: Add Name Fields
 * Aggiunge campi first_name e last_name alla tabella users
 */

async function up(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const addNameColumnsSQL = `
        ALTER TABLE users ADD COLUMN first_name TEXT;
        ALTER TABLE users ADD COLUMN last_name TEXT;
      `;

      db.run(addNameColumnsSQL, (err) => {
        if (err) {
          console.error("Error adding name columns:", err);
          return reject(err);
        }
        console.log("✅ Migrazione 007 completata: campi nome e cognome aggiunti.");
        resolve();
      });
    });
  });
}

async function down(db) {
  return new Promise((resolve, reject) => {
    // SQLite non supporta DROP COLUMN diretto per più colonne in una singola ALTER TABLE.
    // Per un rollback completo, si dovrebbe ricreare la tabella.
    // Per semplicità, qui non implementiamo un down completo.
    console.warn("⚠️ Rollback della migrazione 007 non implementato completamente.");
    resolve();
  });
}

module.exports = { up, down };
