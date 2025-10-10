/**
 * User Model per Pricing Calculator v0.2
 * Gestisce gli utenti del sistema
 */

const bcrypt = require("bcrypt");
const { loggers } = require("../utils/logger");

class User {
  constructor(db) {
    this.db = db;
  }

  // Crea la tabella users se non esiste
  async initTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'demo')),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        preferences TEXT DEFAULT '{}',
        auth_provider TEXT DEFAULT 'local',
        provider_user_id TEXT,
        provider_metadata TEXT
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createTableSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Crea un nuovo utente
  async create(userData) {
    const {
      username,
      email,
      password,
      role = "user",
      authProvider = "local",
      providerUserId = null,
      providerMetadata = null,
    } = userData;

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const sql = `
      INSERT INTO users (username, email, password, role, auth_provider, provider_user_id, provider_metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        [
          username,
          email,
          hashedPassword,
          role,
          authProvider,
          providerUserId,
          providerMetadata,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              username,
              email,
              role,
              authProvider,
              providerUserId,
              providerMetadata,
            });
          }
        }
      );
    });
  }

  // Trova utente per username
  async findByUsername(username) {
    const sql = "SELECT * FROM users WHERE username = ? AND is_active = 1";

    return new Promise((resolve, reject) => {
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Trova utente per ID
  async findById(id) {
    const sql = "SELECT * FROM users WHERE id = ? AND is_active = 1";

    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Trova utente per provider e provider_user_id
  async findByProviderUserId(provider, providerUserId) {
    const sql =
      "SELECT * FROM users WHERE auth_provider = ? AND provider_user_id = ? AND is_active = 1";

    return new Promise((resolve, reject) => {
      this.db.get(sql, [provider, providerUserId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Trova o crea utente da provider (JIT Provisioning)
  async findOrCreateFromProvider(providerData) {
    const {
      provider,
      providerUserId,
      username,
      email,
      role = "user",
      metadata = null,
    } = providerData;

    try {
      // Cerca utente esistente
      let user = await this.findByProviderUserId(provider, providerUserId);

      if (user) {
        // Aggiorna ultimo login e metadati se necessario
        await this.updateLastLogin(user.id);
        if (metadata) {
          await this.update(user.id, {
            provider_metadata: JSON.stringify(metadata),
          });
        }
        return user;
      }

      // Cerca per email se esiste già un utente con questa email
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        // Aggiorna utente esistente con provider info
        await this.update(existingUser.id, {
          auth_provider: provider,
          provider_user_id: providerUserId,
          provider_metadata: metadata ? JSON.stringify(metadata) : null,
        });
        return await this.findById(existingUser.id);
      }

      // Crea nuovo utente
      const newUser = await this.create({
        username,
        email,
        role,
        authProvider: provider,
        providerUserId,
        providerMetadata: metadata ? JSON.stringify(metadata) : null,
      });

      return await this.findById(newUser.id);
    } catch (error) {
      logger.error(error, {
        context: "findOrCreateFromProvider",
        provider,
        providerUserId,
      });
      throw error;
    }
  }

  // Trova utente per email
  async findByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = ? AND is_active = 1";

    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Verifica password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Aggiorna ultimo login
  async updateLastLogin(id) {
    const sql = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";

    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Ottieni tutti gli utenti
  async getAll() {
    const sql =
      "SELECT id, username, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC";

    return new Promise((resolve, reject) => {
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Aggiorna utente
  async update(id, userData) {
    const fields = [];
    const values = [];

    if (userData.username) {
      fields.push("username = ?");
      values.push(userData.username);
    }
    if (userData.email) {
      fields.push("email = ?");
      values.push(userData.email);
    }
    if (userData.role) {
      fields.push("role = ?");
      values.push(userData.role);
    }
    if (userData.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(userData.is_active ? 1 : 0);
    }
    if (userData.password) {
      fields.push("password = ?");
      values.push(userData.password);
    }
    if (userData.auth_provider) {
      fields.push("auth_provider = ?");
      values.push(userData.auth_provider);
    }
    if (userData.provider_user_id) {
      fields.push("provider_user_id = ?");
      values.push(userData.provider_user_id);
    }
    if (userData.provider_metadata) {
      fields.push("provider_metadata = ?");
      values.push(userData.provider_metadata);
    }

    if (fields.length === 0) {
      throw new Error("Nessun campo da aggiornare");
    }

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, values, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Elimina utente (soft delete)
  async delete(id) {
    const sql = "UPDATE users SET is_active = 0 WHERE id = ?";

    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Elimina utente (hard delete)
  async hardDelete(id) {
    const sql = "DELETE FROM users WHERE id = ?";

    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Seeding utenti di default
  async seedDefaultUsers() {
    try {
      // Controlla se esistono già utenti
      const existingUsers = await this.getAll();
      if (existingUsers.length > 0) {
        loggers.system.startup();
        return;
      }

      // Crea utente admin
      await this.create({
        username: "admin",
        email: "admin@pricing.com",
        password: "admin123",
        role: "admin",
      });

      // Crea utente demo
      await this.create({
        username: "demo",
        email: "demo@pricing.com",
        password: "demo123",
        role: "demo",
      });

      loggers.system.startup();
    } catch (error) {
      loggers.error(error, { context: "seedDefaultUsers" });
    }
  }
}

module.exports = User;
