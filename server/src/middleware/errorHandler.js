/**
 * Error Handler Middleware per Pricing Calculator v0.2
 * Gestione centralizzata degli errori
 */

const { logger, loggers } = require("../../utils/logger");

/**
 * Middleware per gestione errori centralizzata
 */
const errorHandler = (err, req, res, next) => {
  // Log dell'errore
  loggers.error(err, {
    context: "errorHandler",
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Gestione errori specifici
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Errore di validazione",
      details: err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Non autorizzato",
      message: "Token di accesso non valido o scaduto",
    });
  }

  if (err.name === "ForbiddenError") {
    return res.status(403).json({
      error: "Accesso negato",
      message: "Non hai i permessi per eseguire questa operazione",
    });
  }

  if (err.name === "NotFoundError") {
    return res.status(404).json({
      error: "Risorsa non trovata",
      message: err.message,
    });
  }

  if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(400).json({
      error: "Violazione vincolo unicità",
      message: "Un record con questi dati esiste già",
    });
  }

  if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
    return res.status(400).json({
      error: "Violazione vincolo chiave esterna",
      message: "Impossibile eseguire l'operazione a causa di dipendenze",
    });
  }

  // Errore generico del server
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Errore interno del server";

  res.status(statusCode).json({
    error: "Errore del server",
    message:
      process.env.NODE_ENV === "production"
        ? "Si è verificato un errore interno"
        : message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

/**
 * Middleware per gestire route non trovate
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route non trovata: ${req.method} ${req.url}`);
  error.name = "NotFoundError";
  error.statusCode = 404;
  next(error);
};

/**
 * Middleware per gestire errori di parsing JSON
 */
const jsonErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "JSON non valido",
      message: "Il corpo della richiesta non contiene JSON valido",
    });
  }
  next(err);
};

/**
 * Middleware per gestire errori di timeout
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const error = new Error("Timeout della richiesta");
      error.statusCode = 408;
      next(error);
    });
    next();
  };
};

/**
 * Middleware per gestire errori di rate limiting
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.statusCode === 429) {
    return res.status(429).json({
      error: "Troppe richieste",
      message: "Hai superato il limite di richieste. Riprova più tardi.",
      retryAfter: err.retryAfter,
    });
  }
  next(err);
};

/**
 * Middleware per logging delle richieste
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };

    if (res.statusCode >= 400) {
      loggers.error(new Error(`HTTP ${res.statusCode}`), logData);
    } else {
      logger.info("HTTP Request", logData);
    }
  });

  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  jsonErrorHandler,
  timeoutHandler,
  rateLimitErrorHandler,
  requestLogger,
};
