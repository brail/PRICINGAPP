/**
 * Migration 003: Add Auth Providers Support
 * Aggiunge supporto per provider di autenticazione esterni
 */

const { loggers } = require("../utils/logger");

async function up(db) {
  return new Promise((resolve, reject) => {
    // Aggiungi colonne per auth provider
    const addColumnsSQL = `
      ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';
      ALTER TABLE users ADD COLUMN provider_user_id TEXT;
      ALTER TABLE users ADD COLUMN provider_metadata TEXT;
    `;

    db.exec(addColumnsSQL, (err) => {
      if (err) {
        // Se le colonne esistono già, ignora l'errore
        if (err.message.includes("duplicate column name")) {
          console.log("Colonne auth provider già esistenti, skip migration");
          resolve();
        } else {
          reject(err);
        }
      } else {
        console.log("Colonne auth provider aggiunte con successo");
        resolve();
      }
    });
  });
}

async function down(db) {
  return new Promise((resolve, reject) => {
    // SQLite non supporta DROP COLUMN, quindi creiamo una nuova tabella
    const migrationSQL = `
      -- Crea tabella temporanea senza le nuove colonne
      CREATE TABLE users_backup AS 
      SELECT id, username, email, password, role, is_active, created_at, last_login, preferences
      FROM users;
      
      -- Elimina tabella originale
      DROP TABLE users;
      
      -- Rinomina tabella backup
      ALTER TABLE users_backup RENAME TO users;
      
      -- Ricrea indici
      CREATE UNIQUE INDEX idx_users_username ON users(username);
      CREATE UNIQUE INDEX idx_users_email ON users(email);
    `;

    db.exec(migrationSQL, (err) => {
      if (err) {
        reject(err);
      } else {
        loggers.system.info("Colonne auth provider rimosse con successo");
        resolve();
      }
    });
  });
}

module.exports = { up, down };
