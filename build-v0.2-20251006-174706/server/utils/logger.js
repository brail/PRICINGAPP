/**
 * Pricing Calculator v0.2 - Logger Configuration
 * Sistema di logging strutturato con Winston
 */

const winston = require("winston");
const path = require("path");

// Configurazione formati
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Creazione logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "pricing-calculator" },
  transports: [
    // File per errori
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File per tutti i log
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Aggiungi console transport solo in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Metodi helper per logging strutturato
const loggers = {
  // Logging autenticazione
  auth: {
    login: (username, success = true, ip = null) => {
      logger.info("User login attempt", {
        username,
        success,
        ip,
        category: "auth",
      });
    },
    register: (username, email, success = true) => {
      logger.info("User registration attempt", {
        username,
        email,
        success,
        category: "auth",
      });
    },
    logout: (username) => {
      logger.info("User logout", {
        username,
        category: "auth",
      });
    },
  },

  // Logging calcoli
  calculation: {
    selling: (purchasePrice, result, params) => {
      logger.info("Selling price calculation", {
        purchasePrice,
        retailPrice: result.retailPrice,
        margin: result.companyMargin,
        category: "calculation",
      });
    },
    purchase: (retailPrice, result, params) => {
      logger.info("Purchase price calculation", {
        retailPrice,
        purchasePrice: result.purchasePrice,
        margin: result.companyMargin,
        category: "calculation",
      });
    },
  },

  // Logging errori
  error: (error, context = {}) => {
    logger.error("Application error", {
      message: error.message,
      stack: error.stack,
      ...context,
      category: "error",
    });
  },

  // Logging sistema
  system: {
    startup: () => {
      logger.info("Application startup", {
        version: process.env.npm_package_version || "0.2.0-dev",
        nodeVersion: process.version,
        category: "system",
      });
    },
    shutdown: () => {
      logger.info("Application shutdown", {
        category: "system",
      });
    },
  },
};

module.exports = { logger, loggers };
