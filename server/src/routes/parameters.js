/**
 * Parameter Routes per Pricing Calculator v0.2
 * Routes per la gestione dei parametri e set di parametri
 */

const express = require("express");
const router = express.Router();
const ParameterController = require("../controllers/parameterController");
const ParameterService = require("../services/parameterService");
const { authenticateToken } = require("../middleware/auth");
const {
  validateParameterSet,
  validateParameterId,
  validateParameterSetsOrder,
} = require("../middleware/validation");

// Inizializza servizi e controller
const parameterService = new ParameterService();
const parameterController = new ParameterController(parameterService);

// Middleware di autenticazione per le route che lo richiedono
// (non per tutte le route)

// Route per parametri attuali
router.get("/params", (req, res) => {
  parameterController.getCurrentParams(req, res);
});

router.put("/params", (req, res) => {
  parameterController.updateParams(req, res);
});

// Route per parametri attivi dell'utente (richiedono autenticazione)
router.get("/active-parameters", authenticateToken, (req, res) => {
  parameterController.getActiveParameters(req, res);
});

router.post("/active-parameters/load/:setId", authenticateToken, (req, res) => {
  parameterController.loadActiveParameterSet(req, res);
});

// Route per set di parametri (richiedono autenticazione)
router.get("/parameter-sets", authenticateToken, (req, res) => {
  parameterController.getParameterSets(req, res);
});

router.get(
  "/parameter-sets/:id",
  authenticateToken,
  validateParameterId,
  (req, res) => {
    parameterController.getParameterSetById(req, res);
  }
);

router.post(
  "/parameter-sets/:id/load",
  authenticateToken,
  validateParameterId,
  (req, res) => {
    parameterController.loadParameterSet(req, res);
  }
);

router.post(
  "/parameter-sets",
  authenticateToken,
  validateParameterSet,
  (req, res) => {
    parameterController.createParameterSet(req, res);
  }
);

router.put(
  "/parameter-sets/:id",
  authenticateToken,
  validateParameterId,
  validateParameterSet,
  (req, res) => {
    parameterController.updateParameterSet(req, res);
  }
);

router.delete(
  "/parameter-sets/:id",
  authenticateToken,
  validateParameterId,
  (req, res) => {
    parameterController.deleteParameterSet(req, res);
  }
);

router.post(
  "/parameter-sets/:id/set-default",
  authenticateToken,
  validateParameterId,
  (req, res) => {
    parameterController.setDefaultParameterSet(req, res);
  }
);

router.put(
  "/parameter-sets/order",
  authenticateToken,
  validateParameterSetsOrder,
  (req, res) => {
    parameterController.updateParameterSetsOrder(req, res);
  }
);

module.exports = router;
