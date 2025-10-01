const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Percorso del database
const dbPath = path.join(__dirname, "pricing.db");

// Crea connessione al database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Errore nell'apertura del database:", err.message);
  } else {
    console.log("Connesso al database SQLite.");
  }
});

// Inizializza il database e crea le tabelle
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Crea tabella per i set di parametri
      db.run(
        `
        CREATE TABLE IF NOT EXISTS parameter_sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL UNIQUE,
          purchase_currency TEXT NOT NULL,
          selling_currency TEXT NOT NULL,
          quality_control_percent REAL NOT NULL,
          transport_insurance_cost REAL NOT NULL,
          duty REAL NOT NULL,
          exchange_rate REAL NOT NULL,
          italy_accessory_costs REAL NOT NULL,
          tools REAL NOT NULL,
          company_multiplier REAL NOT NULL,
          retail_multiplier REAL NOT NULL,
          optimal_margin REAL NOT NULL,
          is_default BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error(
              "Errore nella creazione della tabella parameter_sets:",
              err.message
            );
            reject(err);
          } else {
            console.log("Tabella parameter_sets creata o già esistente.");

            // Aggiungi colonna is_default se non esiste (migrazione)
            db.run(
              `ALTER TABLE parameter_sets ADD COLUMN is_default BOOLEAN DEFAULT 0`,
              (alterErr) => {
                if (
                  alterErr &&
                  !alterErr.message.includes("duplicate column name")
                ) {
                  console.error(
                    "Errore nell'aggiunta della colonna is_default:",
                    alterErr
                  );
                } else if (!alterErr) {
                  console.log(
                    "Colonna is_default aggiunta alla tabella parameter_sets."
                  );
                }
                resolve();
              }
            );
          }
        }
      );
    });
  });
};

// Funzione per calcolare dinamicamente il companyMultiplier
const calculateCompanyMultiplier = (optimalMargin) => {
  if (optimalMargin <= 0 || optimalMargin >= 100) {
    return 1; // Valore di fallback per margini non validi
  }
  return 1 / (1 - optimalMargin / 100);
};

// Seeding del database con parametri default
const seedDatabase = () => {
  return new Promise((resolve, reject) => {
    // Parametri default
    const optimalMargin = 25;
    const defaultParams = {
      description: "Parametri Default",
      purchase_currency: "USD",
      selling_currency: "EUR",
      quality_control_percent: 5,
      transport_insurance_cost: 2.3,
      duty: 8,
      exchange_rate: 1.07,
      italy_accessory_costs: 1,
      tools: 1.0,
      company_multiplier: calculateCompanyMultiplier(optimalMargin),
      retail_multiplier: 2.48,
      optimal_margin: optimalMargin,
    };

    // Controlla se esiste già un set con descrizione "Parametri Default"
    db.get(
      "SELECT id FROM parameter_sets WHERE description = ?",
      [defaultParams.description],
      (err, row) => {
        if (err) {
          console.error(
            "Errore nel controllo dei parametri default:",
            err.message
          );
          reject(err);
        } else if (!row) {
          // Inserisce i parametri default se non esistono
          db.run(
            `
            INSERT INTO parameter_sets (
              description, purchase_currency, selling_currency,
              quality_control_percent, transport_insurance_cost, duty,
              exchange_rate, italy_accessory_costs, tools, company_multiplier,
              retail_multiplier, optimal_margin, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              defaultParams.description,
              defaultParams.purchase_currency,
              defaultParams.selling_currency,
              defaultParams.quality_control_percent,
              defaultParams.transport_insurance_cost,
              defaultParams.duty,
              defaultParams.exchange_rate,
              defaultParams.italy_accessory_costs,
              defaultParams.tools,
              defaultParams.company_multiplier,
              defaultParams.retail_multiplier,
              defaultParams.optimal_margin,
              1, // is_default = true
            ],
            function (err) {
              if (err) {
                console.error(
                  "Errore nell'inserimento dei parametri default:",
                  err.message
                );
                reject(err);
              } else {
                console.log("Parametri default inseriti con ID:", this.lastID);
                resolve();
              }
            }
          );
        } else {
          console.log("Parametri default già esistenti.");
          resolve();
        }
      }
    );
  });
};

// Funzioni CRUD per i set di parametri

// Ottieni tutti i set di parametri
const getAllParameterSets = () => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM parameter_sets ORDER BY created_at DESC",
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

// Ottieni un set di parametri per ID
const getParameterSetById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM parameter_sets WHERE id = ?", [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Ottieni il set di parametri default
const getDefaultParameterSet = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM parameter_sets WHERE is_default = 1", (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Crea un nuovo set di parametri
const createParameterSet = (params) => {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO parameter_sets (
        description, purchase_currency, selling_currency,
        quality_control_percent, transport_insurance_cost, duty,
        exchange_rate, italy_accessory_costs, tools, company_multiplier,
        retail_multiplier, optimal_margin, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        params.description,
        params.purchase_currency,
        params.selling_currency,
        params.quality_control_percent,
        params.transport_insurance_cost,
        params.duty,
        params.exchange_rate,
        params.italy_accessory_costs,
        params.tools,
        params.company_multiplier,
        params.retail_multiplier,
        params.optimal_margin,
        params.is_default || 0,
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...params });
        }
      }
    );
  });
};

// Aggiorna un set di parametri
const updateParameterSet = (id, params) => {
  return new Promise((resolve, reject) => {
    db.run(
      `
      UPDATE parameter_sets SET
        description = ?, purchase_currency = ?, selling_currency = ?,
        quality_control_percent = ?, transport_insurance_cost = ?, duty = ?,
        exchange_rate = ?, italy_accessory_costs = ?, tools = ?, company_multiplier = ?,
        retail_multiplier = ?, optimal_margin = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        params.description,
        params.purchase_currency,
        params.selling_currency,
        params.quality_control_percent,
        params.transport_insurance_cost,
        params.duty,
        params.exchange_rate,
        params.italy_accessory_costs,
        params.tools,
        params.company_multiplier,
        params.retail_multiplier,
        params.optimal_margin,
        id,
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...params });
        }
      }
    );
  });
};

// Elimina un set di parametri
const deleteParameterSet = (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM parameter_sets WHERE id = ?", [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ deletedRows: this.changes });
      }
    });
  });
};

// Imposta un set di parametri come default
const setDefaultParameterSet = (id) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Prima rimuovi il flag default da tutti i set
      db.run("UPDATE parameter_sets SET is_default = 0", (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Poi imposta il set specificato come default
        db.run(
          "UPDATE parameter_sets SET is_default = 1 WHERE id = ?",
          [id],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ id, isDefault: this.changes > 0 });
            }
          }
        );
      });
    });
  });
};

// Chiudi la connessione al database
const closeDatabase = () => {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error("Errore nella chiusura del database:", err.message);
      } else {
        console.log("Connessione al database chiusa.");
      }
      resolve();
    });
  });
};

module.exports = {
  db,
  initDatabase,
  seedDatabase,
  getAllParameterSets,
  getParameterSetById,
  getDefaultParameterSet,
  createParameterSet,
  updateParameterSet,
  deleteParameterSet,
  setDefaultParameterSet,
  closeDatabase,
};
