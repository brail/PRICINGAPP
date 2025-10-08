/**
 * Parameter Controller per Pricing Calculator v0.2
 * Gestisce i parametri di calcolo e i set di parametri
 */

const { loggers } = require("../../utils/logger");

class ParameterController {
  constructor(parameterService) {
    this.parameterService = parameterService;
  }

  /**
   * Ottieni parametri attuali
   */
  async getCurrentParams(req, res) {
    try {
      const params = await this.parameterService.getCurrentParams();
      res.json(params);
    } catch (error) {
      loggers.error(error, { context: "getCurrentParams" });
      res.status(500).json({ error: "Errore nel recupero dei parametri" });
    }
  }

  /**
   * Ottieni parametri attivi per l'utente corrente
   */
  async getActiveParameters(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Utente non autenticato" });
      }

      const result = await this.parameterService.getActiveParameters(userId);
      res.json(result);
    } catch (error) {
      loggers.error(error, { context: "getActiveParameters" });
      res
        .status(500)
        .json({ error: "Errore nel recupero dei parametri attivi" });
    }
  }

  /**
   * Carica un set di parametri come attivo per l'utente
   */
  async loadActiveParameterSet(req, res) {
    try {
      const userId = req.user?.id;
      const { setId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Utente non autenticato" });
      }

      const result = await this.parameterService.loadActiveParameterSet(
        userId,
        setId
      );
      res.json(result);
    } catch (error) {
      loggers.error(error, { context: "loadActiveParameterSet" });
      res
        .status(500)
        .json({ error: "Errore nel caricamento del set di parametri" });
    }
  }

  /**
   * Aggiorna parametri attuali
   */
  async updateParams(req, res) {
    try {
      const updatedParams = await this.parameterService.updateParams(req.body);
      res.json(updatedParams);
    } catch (error) {
      loggers.error(error, { context: "updateParams" });
      res
        .status(500)
        .json({ error: "Errore nell'aggiornamento dei parametri" });
    }
  }

  /**
   * Ottieni tutti i set di parametri
   */
  async getParameterSets(req, res) {
    try {
      const parameterSets = await this.parameterService.getAllParameterSets();
      res.json(parameterSets);
    } catch (error) {
      loggers.error(error, { context: "getParameterSets" });
      res
        .status(500)
        .json({ error: "Errore nel recupero dei set di parametri" });
    }
  }

  /**
   * Ottieni un set di parametri per ID
   */
  async getParameterSetById(req, res) {
    try {
      const { id } = req.params;
      const parameterSet = await this.parameterService.getParameterSetById(id);

      if (parameterSet) {
        res.json(parameterSet);
      } else {
        res.status(404).json({ error: "Set di parametri non trovato" });
      }
    } catch (error) {
      loggers.error(error, { context: "getParameterSetById" });
      res
        .status(500)
        .json({ error: "Errore nel recupero del set di parametri" });
    }
  }

  /**
   * Carica un set di parametri come attuale
   */
  async loadParameterSet(req, res) {
    try {
      const { id } = req.params;
      const result = await this.parameterService.loadParameterSet(id);
      res.json(result);
    } catch (error) {
      loggers.error(error, { context: "loadParameterSet" });
      res
        .status(500)
        .json({ error: "Errore nel caricamento del set di parametri" });
    }
  }

  /**
   * Crea un nuovo set di parametri
   */
  async createParameterSet(req, res) {
    try {
      const newParameterSet = await this.parameterService.createParameterSet(
        req.body
      );
      res.status(201).json(newParameterSet);
    } catch (error) {
      if (error.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({
          error: "Un set di parametri con questa descrizione esiste già",
        });
      } else {
        loggers.error(error, { context: "createParameterSet" });
        res
          .status(500)
          .json({ error: "Errore nella creazione del set di parametri" });
      }
    }
  }

  /**
   * Aggiorna un set di parametri
   */
  async updateParameterSet(req, res) {
    try {
      const { id } = req.params;
      const updatedParameterSet =
        await this.parameterService.updateParameterSet(id, req.body);
      res.json(updatedParameterSet);
    } catch (error) {
      loggers.error(error, { context: "updateParameterSet" });
      res
        .status(500)
        .json({ error: "Errore nell'aggiornamento del set di parametri" });
    }
  }

  /**
   * Elimina un set di parametri
   */
  async deleteParameterSet(req, res) {
    try {
      const { id } = req.params;
      const result = await this.parameterService.deleteParameterSet(id);

      if (result.deletedRows > 0) {
        res.json({ message: "Set di parametri eliminato con successo" });
      } else {
        res.status(404).json({ error: "Set di parametri non trovato" });
      }
    } catch (error) {
      loggers.error(error, { context: "deleteParameterSet" });
      res
        .status(500)
        .json({ error: "Errore nell'eliminazione del set di parametri" });
    }
  }

  /**
   * Imposta un set di parametri come default
   */
  async setDefaultParameterSet(req, res) {
    try {
      const { id } = req.params;
      const result = await this.parameterService.setDefaultParameterSet(id);
      res.json(result);
    } catch (error) {
      loggers.error(error, { context: "setDefaultParameterSet" });
      res.status(500).json({
        error: "Errore nell'impostazione del set di parametri come default",
      });
    }
  }

  /**
   * Aggiorna l'ordine dei set di parametri
   */
  async updateParameterSetsOrder(req, res) {
    try {
      const { parameterSets } = req.body;

      if (!parameterSets || !Array.isArray(parameterSets)) {
        return res.status(400).json({ error: "Lista parametri non valida" });
      }

      await this.parameterService.updateParameterSetsOrder(parameterSets);
      res.json({ message: "Ordine aggiornato con successo" });
    } catch (error) {
      loggers.error(error, { context: "updateParameterSetsOrder" });
      res.status(500).json({ error: "Errore nell'aggiornamento dell'ordine" });
    }
  }
}

module.exports = ParameterController;
