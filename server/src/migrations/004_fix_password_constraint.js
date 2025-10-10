/**
 * Migration 004: Fix Password Constraint for External Auth Providers
 * Rimuove il vincolo NOT NULL dalla colonna password per supportare provider esterni
 */

async function up(db) {
  return new Promise((resolve, reject) => {
    // SQLite non supporta ALTER COLUMN, quindi dobbiamo ricreare la tabella
    const migrationSQL = `
      -- Crea tabella temporanea con password nullable
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,  -- Rimosso NOT NULL
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'demo')),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        preferences TEXT DEFAULT '{}',
        auth_provider TEXT DEFAULT 'local',
        provider_user_id TEXT,
        provider_metadata TEXT
      );
      
      -- Copia dati esistenti
      INSERT INTO users_new (id, username, email, password, role, is_active, created_at, last_login, preferences, auth_provider, provider_user_id, provider_metadata)
      SELECT id, username, email, password, role, is_active, created_at, last_login, preferences, 
             COALESCE(auth_provider, 'local'), provider_user_id, provider_metadata
      FROM users;
      
      -- Elimina tabella originale
      DROP TABLE users;
      
      -- Rinomina tabella nuova
      ALTER TABLE users_new RENAME TO users;
      
      -- Ricrea indici
      CREATE UNIQUE INDEX idx_users_username ON users(username);
      CREATE UNIQUE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_auth_provider ON users(auth_provider);
      CREATE INDEX idx_users_provider_user_id ON users(provider_user_id);
    `;

    db.exec(migrationSQL, (err) => {
      if (err) {
        console.error("Errore nella migrazione 004:", err);
        reject(err);
      } else {
        console.log("✅ Migrazione 004 completata: vincolo password rimosso");
        resolve();
      }
    });
  });
}

async function down(db) {
  return new Promise((resolve, reject) => {
    // Rollback: ricrea tabella con password NOT NULL
    const rollbackSQL = `
      -- Crea tabella temporanea con password NOT NULL
      CREATE TABLE users_rollback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,  -- Ripristina NOT NULL
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'demo')),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        preferences TEXT DEFAULT '{}',
        auth_provider TEXT DEFAULT 'local',
        provider_user_id TEXT,
        provider_metadata TEXT
      );
      
      -- Copia solo utenti con password
      INSERT INTO users_rollback (id, username, email, password, role, is_active, created_at, last_login, preferences, auth_provider, provider_user_id, provider_metadata)
      SELECT id, username, email, password, role, is_active, created_at, last_login, preferences, auth_provider, provider_user_id, provider_metadata
      FROM users
      WHERE password IS NOT NULL;
      
      -- Elimina tabella corrente
      DROP TABLE users;
      
      -- Rinomina tabella rollback
      ALTER TABLE users_rollback RENAME TO users;
      
      -- Ricrea indici
      CREATE UNIQUE INDEX idx_users_username ON users(username);
      CREATE UNIQUE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_auth_provider ON users(auth_provider);
      CREATE INDEX idx_users_provider_user_id ON users(provider_user_id);
    `;

    db.exec(rollbackSQL, (err) => {
      if (err) {
        console.error("Errore nel rollback migrazione 004:", err);
        reject(err);
      } else {
        console.log("✅ Rollback migrazione 004 completato");
        resolve();
      }
    });
  });
}

module.exports = { up, down };
