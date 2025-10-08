/**
 * Performance Monitoring for Pricing Calculator
 * Tracks key metrics for production monitoring
 */

const prometheus = require("prom-client");

// Create a Registry to register the metrics
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestsTotal = new prometheus.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const activeConnections = new prometheus.Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

const databaseConnections = new prometheus.Gauge({
  name: "database_connections",
  help: "Number of database connections",
  labelNames: ["state"],
});

const calculationDuration = new prometheus.Histogram({
  name: "calculation_duration_seconds",
  help: "Duration of price calculations in seconds",
  labelNames: ["calculation_type"],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
});

const parameterSetOperations = new prometheus.Counter({
  name: "parameter_set_operations_total",
  help: "Total number of parameter set operations",
  labelNames: ["operation", "status"],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseConnections);
register.registerMetric(calculationDuration);
register.registerMetric(parameterSetOperations);

// Middleware to track HTTP requests
const trackHttpRequest = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
};

// Function to track calculation performance
const trackCalculation = (calculationType) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = (Date.now() - start) / 1000;
      calculationDuration.labels(calculationType).observe(duration);
    });

    next();
  };
};

// Function to track parameter set operations
const trackParameterSetOperation = (operation) => {
  return (req, res, next) => {
    res.on("finish", () => {
      const status = res.statusCode < 400 ? "success" : "error";
      parameterSetOperations.labels(operation, status).inc();
    });

    next();
  };
};

// Function to update connection metrics
const updateConnectionMetrics = () => {
  // This would be implemented based on your connection tracking
  // For example, using a connection pool
  activeConnections.set(/* current active connections */);
  databaseConnections.labels("active").set(/* active DB connections */);
  databaseConnections.labels("idle").set(/* idle DB connections */);
};

// Update metrics every 30 seconds
setInterval(updateConnectionMetrics, 30000);

module.exports = {
  register,
  trackHttpRequest,
  trackCalculation,
  trackParameterSetOperation,
  updateConnectionMetrics,
};
