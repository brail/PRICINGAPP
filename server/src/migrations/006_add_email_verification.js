/**
 * Migration 006: Add Email Verification System
 * Aggiunge colonne per gestire la verifica dell'email e il cambio email
 */

async function up(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Aggiungi colonne per sistema di verifica email
      const addEmailVerificationColumns = `
        ALTER TABLE users ADD COLUMN email_pending TEXT;
        ALTER TABLE users ADD COLUMN email_verification_token TEXT;
        ALTER TABLE users ADD COLUMN email_verification_expires DATETIME;
        ALTER TABLE users ADD COLUMN email_verified_at DATETIME;
      `;

      db.exec(addEmailVerificationColumns, (err) => {
        if (err) {
          console.error("Errore aggiunta colonne verifica email:", err);
          return reject(err);
        }

        // Marca le email esistenti come verificate (per utenti creati prima della migrazione)
        const markExistingEmailsVerified = `
          UPDATE users 
          SET email_verified_at = CURRENT_TIMESTAMP 
          WHERE email_verified_at IS NULL AND email IS NOT NULL;
        `;

        db.run(markExistingEmailsVerified, (err) => {
          if (err) {
            console.error("Errore marcatura email verificate:", err);
            return reject(err);
          }

          console.log("✅ Migrazione 006 completata: sistema verifica email");
          resolve();
        });
      });
    });
  });
}

async function down(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Rimuovi le colonne aggiunte
      const removeColumns = `
        ALTER TABLE users DROP COLUMN email_pending;
        ALTER TABLE users DROP COLUMN email_verification_token;
        ALTER TABLE users DROP COLUMN email_verification_expires;
        ALTER TABLE users DROP COLUMN email_verified_at;
      `;

      db.exec(removeColumns, (err) => {
        if (err) {
          console.error("Errore rimozione colonne verifica email:", err);
          return reject(err);
        }

        console.log("✅ Migrazione 006 rollback completato");
        resolve();
      });
    });
  });
}

module.exports = { up, down };
