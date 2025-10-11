/**
 * Migration 005: Enhance User Profiles
 * Aggiunge campi per profili utente arricchiti: phone, avatar_url, timezone, locale, bio
 * Aggiorna ruolo demo ad user (rimozione ruolo demo)
 */

async function up(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Aggiungi nuove colonne per il profilo utente
      const addProfileColumns = `
        ALTER TABLE users ADD COLUMN phone TEXT;
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'Europe/Rome';
        ALTER TABLE users ADD COLUMN locale TEXT DEFAULT 'it';
        ALTER TABLE users ADD COLUMN bio TEXT;
        ALTER TABLE users ADD COLUMN profile_updated_at DATETIME;
      `;

      // Rimuovi il ruolo 'demo' e converti gli utenti demo in user
      const updateDemoUsers = `
        UPDATE users SET role = 'user' WHERE role = 'demo';
      `;

      // Esegui le query
      db.exec(addProfileColumns, (err) => {
        if (err) {
          console.error("Errore aggiunta colonne profilo:", err);
          return reject(err);
        }

        db.run(updateDemoUsers, (err) => {
          if (err) {
            console.error("Errore aggiornamento ruoli demo:", err);
            return reject(err);
          }

          console.log(
            "✅ Migrazione 005 completata: profili utente arricchiti"
          );
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
        ALTER TABLE users DROP COLUMN phone;
        ALTER TABLE users DROP COLUMN avatar_url;
        ALTER TABLE users DROP COLUMN timezone;
        ALTER TABLE users DROP COLUMN locale;
        ALTER TABLE users DROP COLUMN bio;
        ALTER TABLE users DROP COLUMN profile_updated_at;
      `;

      db.exec(removeColumns, (err) => {
        if (err) {
          console.error("Errore rimozione colonne profilo:", err);
          return reject(err);
        }

        console.log("✅ Migrazione 005 rollback completato");
        resolve();
      });
    });
  });
}

module.exports = { up, down };
