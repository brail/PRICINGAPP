/**
 * ===========================================
 * PRICING CALCULATOR v0.3.1 - Server (Enhanced Profiles)
 * ===========================================
 *
 * Express.js server per l'applicazione Pricing Calculator
 * Architettura modulare con supporto multi-provider per autenticazione
 * e gestione profili utente arricchiti
 *
 * @version 0.3.1
 * @author Pricing Calculator Team
 * @since 2024
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Importa il sistema di logging
const { logger, loggers } = require("./utils/logger");

// Importa il modulo database
const { initDatabase, seedDatabase } = require("./database");

// Importa le route
const { router: authRoutes, initUserModel } = require("./routes/auth");
const createCalculationRoutes = require("./src/routes/calculations");
const createParameterRoutes = require("./src/routes/parameters");
const createProfileRoutes = require("./src/routes/profile");

// Importa Passport
const {
  passport,
  initializeUserModel: initPassportUserModel,
} = require("./src/config/passport");

// Importa middleware
const {
  errorHandler,
  notFoundHandler,
  jsonErrorHandler,
  requestLogger,
} = require("./src/middleware/errorHandler");

// Importa servizi
const ParameterService = require("./src/services/parameterService");
const CalculationService = require("./src/services/calculationService");

// ===========================================
// CONFIGURAZIONE SERVER
// ===========================================

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

// Configurazione CORS dinamica
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

// ===========================================
// MIDDLEWARE GLOBALI
// ===========================================

// CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session per Passport (necessario per OAuth)
app.use(
  session({
    secret: process.env.JWT_SECRET || "pricing-calculator-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // In production, set to true se usi HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 ore - evita cookie scaduti che causano blocchi
      httpOnly: true, // Previene accesso JavaScript ai cookie
      sameSite: 'lax' // Protezione CSRF
    },
    // Pulisci automaticamente le sessioni scadute
    rolling: true, // Rinnova il cookie ad ogni richiesta
  })
);

// Inizializza Passport
app.use(passport.initialize());
app.use(passport.session());

// Logging delle richieste
app.use(requestLogger);

// Gestione errori JSON
app.use(jsonErrorHandler);

// ===========================================
// INIZIALIZZAZIONE SERVIZI
// ===========================================

// Inizializza servizi
const parameterService = new ParameterService();
const calculationService = new CalculationService(parameterService);

// ===========================================
// ROUTES
// ===========================================

// Route di autenticazione
app.use("/auth", authRoutes);

// Route per calcoli
const calculationRoutes = createCalculationRoutes(
  parameterService,
  calculationService
);
app.use("/", calculationRoutes);

// Route per parametri
const parameterRoutes = createParameterRoutes(parameterService);
app.use("/", parameterRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test endpoint per verificare la connessione
app.get("/api/test-connection", (req, res) => {
  res.json({
    message: "Connessione riuscita!",
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    userAgent: req.get("User-Agent"),
  });
});

// ===========================================
// INIZIALIZZAZIONE E AVVIO SERVER
// ===========================================

/**
 * Inizializza il database e avvia il server
 * @async
 * @function startServer
 */
const startServer = async () => {
  try {
    console.log("🚀 Avvio Pricing Calculator v0.3.1 (Enhanced Profiles)...");
    console.log(`📊 Ambiente: ${NODE_ENV}`);
    console.log(`🌐 Host: ${HOST}`);
    console.log(`🔌 Porta: ${PORT}`);
    console.log(`🔗 Origini consentite: ${allowedOrigins.join(", ")}`);

    // Inizializza il database
    await initDatabase();
    console.log("✅ Database inizializzato con successo");

    // Imposta il database in app.locals per le routes
    app.locals.db = require("./database").db;

    // Inizializza il modello User
    initUserModel(require("./database").db);
    console.log("✅ Modello User inizializzato");

    // Inizializza Passport User Model
    initPassportUserModel(require("./database").db);
    console.log("✅ Passport User Model inizializzato");

    // Seeding del database
    await seedDatabase();
    console.log("✅ Seeding del database completato");

    // Seeding utenti di default
    const User = require("./src/models/User");
    const userModel = new User(require("./database").db);
    await userModel.initTable();
    await userModel.seedDefaultUsers();
    logger.info("Seeding utenti completato");

    // Rendi userModel disponibile alle routes
    app.locals.userModel = userModel;

    // Inizializza profile routes
    const profileRoutes = createProfileRoutes(userModel);
    app.use("/", profileRoutes);
    console.log("✅ Profile routes inizializzate");

    // Carica i parametri dal database
    await parameterService.loadParametersFromDatabase();
    logger.info("Parametri caricati dal database");

    // ===========================================
    // GESTIONE ERRORI (dopo tutte le route)
    // ===========================================

    // Route non trovata
    app.use(notFoundHandler);

    // Gestione errori centralizzata
    app.use(errorHandler);

    console.log("✅ Middleware di gestione errori inizializzato");

    // Log di avvio sistema
    loggers.system.startup();

    // Avvia il server
    app.listen(PORT, HOST, () => {
      logger.info("Server avviato con successo", {
        port: PORT,
        host: HOST,
        environment: NODE_ENV,
      });

      if (NODE_ENV === "development") {
        console.log("🎉 Server avviato con successo!");
        console.log(`📍 URL locale: http://localhost:${PORT}`);
        console.log(`🌍 URL rete: http://[IP_LOCALE]:${PORT}`);
        console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
        console.log("📝 Logs disponibili in console e file");
      }
    });
  } catch (error) {
    loggers.error(error, { context: "serverInitialization" });
    process.exit(1);
  }
};

// Gestione graceful shutdown
process.on("SIGTERM", () => {
  loggers.system.shutdown();
  process.exit(0);
});

process.on("SIGINT", () => {
  loggers.system.shutdown();
  process.exit(0);
});

// Avvia il server
startServer();
