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
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
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
      // Estrai dati profilo da metadati provider (v0.3.1)
      let profileData = {};
      if (metadata) {
        // Google: estrai avatar, locale, nome e cognome
        if (provider === "google") {
          if (metadata.picture) {
            profileData.avatar_url = metadata.picture;
          }
          if (metadata.locale) {
            // Normalizza locale Google (es. it-IT -> it)
            profileData.locale = metadata.locale.split("-")[0];
          }
          if (metadata.given_name) {
            profileData.first_name = metadata.given_name;
          }
          if (metadata.family_name) {
            profileData.last_name = metadata.family_name;
          }
        }
        // LDAP: estrai nome e cognome da attributi LDAP
        if (provider === "ldap") {
          if (metadata.givenName) {
            profileData.first_name = metadata.givenName;
          }
          if (metadata.sn) {
            // surname
            profileData.last_name = metadata.sn;
          }
        }
      }

      // Cerca utente esistente
      let user = await this.findByProviderUserId(provider, providerUserId);

      if (user) {
        // Aggiorna ultimo login, metadati e profilo se necessario
        await this.updateLastLogin(user.id);
        if (metadata) {
          await this.update(user.id, {
            provider_metadata: JSON.stringify(metadata),
          });
        }
        // Aggiorna profilo con dati da provider (solo se non già impostati)
        if (Object.keys(profileData).length > 0) {
          await this.updateProfile(user.id, profileData);
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
        // Aggiorna profilo con dati da provider
        if (Object.keys(profileData).length > 0) {
          await this.updateProfile(existingUser.id, profileData);
        }
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

      // Imposta profilo iniziale con dati da provider
      if (Object.keys(profileData).length > 0) {
        await this.updateProfile(newUser.id, profileData);
      }

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

  // ==========================================
  // PROFILE MANAGEMENT METHODS (v0.3.1)
  // ==========================================

  /**
   * Aggiorna il profilo utente
   * @param {number} userId - ID utente
   * @param {object} profileData - Dati profilo (first_name, last_name, phone, avatar_url, timezone, locale, bio)
   */
  async updateProfile(userId, profileData) {
    const { first_name, last_name, phone, avatar_url, timezone, locale, bio } =
      profileData;

    const updates = [];
    const values = [];

    if (first_name !== undefined) {
      updates.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push("last_name = ?");
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (avatar_url !== undefined) {
      updates.push("avatar_url = ?");
      values.push(avatar_url);
    }
    if (timezone !== undefined) {
      updates.push("timezone = ?");
      values.push(timezone);
    }
    if (locale !== undefined) {
      updates.push("locale = ?");
      values.push(locale);
    }
    if (bio !== undefined) {
      updates.push("bio = ?");
      values.push(bio);
    }

    if (updates.length === 0) {
      return; // Nessun aggiornamento
    }

    updates.push("profile_updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

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

  /**
   * Inizia processo cambio email
   * @param {number} userId - ID utente
   * @param {string} newEmail - Nuova email
   * @param {string} token - Token di verifica
   */
  async initEmailChange(userId, newEmail, token) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    const sql = `
      UPDATE users 
      SET email_pending = ?, 
          email_verification_token = ?, 
          email_verification_expires = ?
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        [newEmail, token, expiresAt.toISOString(), userId],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Verifica e conferma cambio email
   * @param {string} token - Token di verifica
   */
  async verifyEmailChange(token) {
    const sql = `
      SELECT id, email_pending, email_verification_expires 
      FROM users 
      WHERE email_verification_token = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [token], (err, user) => {
        if (err) {
          return reject(err);
        }
        if (!user) {
          return reject(new Error("Token non valido"));
        }

        // Verifica scadenza token
        const expiresAt = new Date(user.email_verification_expires);
        if (expiresAt < new Date()) {
          return reject(new Error("Token scaduto"));
        }

        // Aggiorna email
        const updateSql = `
          UPDATE users 
          SET email = ?, 
              email_pending = NULL, 
              email_verification_token = NULL, 
              email_verification_expires = NULL,
              email_verified_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        this.db.run(updateSql, [user.email_pending, user.id], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(user.id);
          }
        });
      });
    });
  }

  /**
   * Ottieni profilo utente completo
   * @param {number} userId - ID utente
   */
  async getProfile(userId) {
    const sql = `
      SELECT id, username, email, role, is_active, created_at, last_login,
             phone, avatar_url, timezone, locale, bio, profile_updated_at,
             auth_provider, provider_user_id, email_verified_at,
             first_name, last_name, preferences
      FROM users 
      WHERE id = ?
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [userId], (err, user) => {
        if (err) {
          reject(err);
        } else if (!user) {
          reject(new Error("Utente non trovato"));
        } else {
          // Parse preferences JSON
          if (user.preferences) {
            try {
              user.preferences = JSON.parse(user.preferences);
            } catch (e) {
              user.preferences = {};
            }
          }
          resolve(user);
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

      // Crea utente admin locale con profilo completo
      const adminUser = await this.create({
        username: "admin",
        email: "admin@pricing.com",
        password: "PricingApp2025!!",
        role: "admin",
        auth_provider: "local"
      });

      // Aggiorna il profilo dell'admin con nome e cognome
      await this.updateProfile(adminUser.id, {
        first_name: "Admin",
        last_name: "Default",
        timezone: "Europe/Rome",
        locale: "it"
      });

      loggers.system.startup();
    } catch (error) {
      loggers.error(error, { context: "seedDefaultUsers" });
    }
  }
}

module.exports = User;
