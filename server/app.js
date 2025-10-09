const express = require("express");
const cors = require("cors");
const path = require("path");
const createCalculationRoutes = require("./src/routes/calculations");
const createParameterRoutes = require("./src/routes/parameters");
const { router: authRoutes, initUserModel } = require("./src/routes/auth");
const { requestLogger } = require("./src/middleware/errorHandler");
const ParameterService = require("./src/services/parameterService");
const CalculationService = require("./src/services/calculationService");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Initialize User model
initUserModel();

// Routes
const parameterService = new ParameterService();
const calculationService = new CalculationService(parameterService);

app.use("/api", createCalculationRoutes(parameterService, calculationService));
app.use("/api", createParameterRoutes(parameterService));
app.use("/", authRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
