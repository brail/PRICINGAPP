/**
 * Parameter Service per Pricing Calculator v0.2
 * Business logic per la gestione dei parametri e set di parametri
 */

const {
  getAllParameterSets,
  getParameterSetById,
  getDefaultParameterSet,
  createParameterSet,
  updateParameterSet,
  deleteParameterSet,
  setDefaultParameterSet,
  updateParameterSetsOrder,
} = require("../../database");

class ParameterService {
  constructor() {
    // Parametri attuali (caricati dal database)
    this.currentParams = {
      purchaseCurrency: "USD",
      sellingCurrency: "EUR",
      qualityControlPercent: 5,
      transportInsuranceCost: 2.3,
      duty: 8,
      exchangeRate: 1.07,
      italyAccessoryCosts: 1,
      tools: 1.0,
      companyMultiplier: 1.33, // Calcolato dinamicamente da optimalMargin (25%)
      retailMultiplier: 2.48,
      optimalMargin: 25,
    };
  }

  /**
   * Carica i parametri dal database
   */
  async loadParametersFromDatabase() {
    try {
      const defaultSet = await getDefaultParameterSet();
      if (defaultSet) {
        this.currentParams = {
          purchaseCurrency: defaultSet.purchase_currency,
          sellingCurrency: defaultSet.selling_currency,
          qualityControlPercent: defaultSet.quality_control_percent,
          transportInsuranceCost: defaultSet.transport_insurance_cost,
          duty: defaultSet.duty,
          exchangeRate: defaultSet.exchange_rate,
          italyAccessoryCosts: defaultSet.italy_accessory_costs,
          tools: defaultSet.tools,
          companyMultiplier: this.calculateCompanyMultiplier(
            defaultSet.optimal_margin
          ),
          retailMultiplier: defaultSet.retail_multiplier,
          optimalMargin: defaultSet.optimal_margin,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calcola dinamicamente il companyMultiplier
   */
  calculateCompanyMultiplier(optimalMargin) {
    if (optimalMargin <= 0 || optimalMargin >= 100) {
      return 1; // Valore di fallback per margini non validi
    }
    const multiplier = 1 / (1 - optimalMargin / 100);
    return Math.round(multiplier * 100) / 100; // Tronca a 2 cifre decimali
  }

  /**
   * Converte un ParameterSet in CalculationParams
   */
  convertParameterSetToParams(parameterSet) {
    return {
      purchaseCurrency: parameterSet.purchase_currency,
      sellingCurrency: parameterSet.selling_currency,
      qualityControlPercent: parameterSet.quality_control_percent,
      transportInsuranceCost: parameterSet.transport_insurance_cost,
      duty: parameterSet.duty,
      exchangeRate: parameterSet.exchange_rate,
      italyAccessoryCosts: parameterSet.italy_accessory_costs,
      tools: parameterSet.tools,
      companyMultiplier: parameterSet.company_multiplier,
      retailMultiplier: parameterSet.retail_multiplier,
      optimalMargin: parameterSet.optimal_margin,
    };
  }

  /**
   * Ottiene il set di parametri attivo per un utente
   */
  async getUserActiveParameterSet(userId) {
    return new Promise((resolve, reject) => {
      const db = require("../../database").db;
      db.get(
        "SELECT active_parameter_set_id FROM users WHERE id = ?",
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row?.active_parameter_set_id || null);
          }
        }
      );
    });
  }

  /**
   * Imposta il set di parametri attivo per un utente
   */
  async setUserActiveParameterSet(userId, setId) {
    return new Promise((resolve, reject) => {
      const db = require("../../database").db;
      db.run(
        "UPDATE users SET active_parameter_set_id = ? WHERE id = ?",
        [setId, userId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Ottieni parametri attuali
   */
  async getCurrentParams() {
    return this.currentParams;
  }

  /**
   * Imposta parametri attuali (per compatibilità con il sistema esistente)
   */
  setCurrentParams(params) {
    this.currentParams = { ...this.currentParams, ...params };
  }

  /**
   * Ottieni parametri attivi per l'utente corrente
   */
  async getActiveParameters(userId) {
    // 1. Prova a caricare il set salvato per l'utente
    const savedSetId = await this.getUserActiveParameterSet(userId);
    if (savedSetId) {
      const parameterSet = await getParameterSetById(savedSetId);
      if (parameterSet) {
        const activeParams = this.convertParameterSetToParams(parameterSet);
        return {
          params: activeParams,
          setId: parameterSet.id,
          description: parameterSet.description,
          source: "saved",
        };
      }
    }

    // 2. Fallback: usa il set di default
    const defaultSet = await getDefaultParameterSet();
    if (defaultSet) {
      const activeParams = this.convertParameterSetToParams(defaultSet);
      return {
        params: activeParams,
        setId: defaultSet.id,
        description: defaultSet.description,
        source: "default",
      };
    }

    // 3. Fallback: usa il primo set disponibile
    const allSets = await getAllParameterSets();
    if (allSets.length > 0) {
      const firstSet = allSets[0];
      const activeParams = this.convertParameterSetToParams(firstSet);
      return {
        params: activeParams,
        setId: firstSet.id,
        description: firstSet.description,
        source: "first_available",
      };
    }

    throw new Error("Nessun set di parametri disponibile");
  }

  /**
   * Carica un set di parametri come attivo per l'utente
   */
  async loadActiveParameterSet(userId, setId) {
    const parameterSet = await getParameterSetById(setId);
    if (!parameterSet) {
      throw new Error("Set di parametri non trovato");
    }

    // Salva il set come attivo per l'utente
    await this.setUserActiveParameterSet(userId, setId);

    // Aggiorna i parametri globali (per compatibilità)
    const activeParams = this.convertParameterSetToParams(parameterSet);
    this.currentParams = activeParams;

    return {
      message: "Set di parametri caricato con successo",
      params: activeParams,
      setId: parameterSet.id,
      description: parameterSet.description,
    };
  }

  /**
   * Aggiorna parametri attuali
   */
  async updateParams(params) {
    const {
      purchaseCurrency,
      sellingCurrency,
      qualityControlPercent,
      transportInsuranceCost,
      duty,
      exchangeRate,
      italyAccessoryCosts,
      tools,
      retailMultiplier,
      optimalMargin,
    } = params;

    if (purchaseCurrency !== undefined)
      this.currentParams.purchaseCurrency = purchaseCurrency;
    if (sellingCurrency !== undefined)
      this.currentParams.sellingCurrency = sellingCurrency;
    if (qualityControlPercent !== undefined)
      this.currentParams.qualityControlPercent = Math.max(
        0,
        qualityControlPercent
      );
    if (transportInsuranceCost !== undefined)
      this.currentParams.transportInsuranceCost = Math.max(
        0,
        transportInsuranceCost
      );
    if (duty !== undefined) this.currentParams.duty = Math.max(0, duty);
    if (exchangeRate !== undefined)
      this.currentParams.exchangeRate = Math.max(0.001, exchangeRate);
    if (italyAccessoryCosts !== undefined)
      this.currentParams.italyAccessoryCosts = Math.max(0, italyAccessoryCosts);
    if (tools !== undefined) this.currentParams.tools = Math.max(0, tools);
    if (retailMultiplier !== undefined)
      this.currentParams.retailMultiplier = Math.max(0.1, retailMultiplier);
    if (optimalMargin !== undefined)
      this.currentParams.optimalMargin = Math.max(
        0,
        Math.min(100, optimalMargin)
      );

    // Calcola dinamicamente il companyMultiplier
    this.currentParams.companyMultiplier = this.calculateCompanyMultiplier(
      this.currentParams.optimalMargin
    );

    return this.currentParams;
  }

  /**
   * Ottieni tutti i set di parametri
   */
  async getAllParameterSets() {
    return await getAllParameterSets();
  }

  /**
   * Ottieni un set di parametri per ID
   */
  async getParameterSetById(id) {
    return await getParameterSetById(id);
  }

  /**
   * Carica un set di parametri come attuale
   */
  async loadParameterSet(id) {
    const parameterSet = await getParameterSetById(id);
    if (parameterSet) {
      // Aggiorna i parametri attuali
      this.currentParams = {
        purchaseCurrency: parameterSet.purchase_currency,
        sellingCurrency: parameterSet.selling_currency,
        qualityControlPercent: parameterSet.quality_control_percent,
        transportInsuranceCost: parameterSet.transport_insurance_cost,
        duty: parameterSet.duty,
        exchangeRate: parameterSet.exchange_rate,
        italyAccessoryCosts: parameterSet.italy_accessory_costs,
        tools: parameterSet.tools,
        companyMultiplier: parameterSet.company_multiplier,
        retailMultiplier: parameterSet.retail_multiplier,
        optimalMargin: parameterSet.optimal_margin,
      };
      return {
        message: "Parametri caricati con successo",
        params: this.currentParams,
      };
    } else {
      throw new Error("Set di parametri non trovato");
    }
  }

  /**
   * Crea un nuovo set di parametri
   */
  async createParameterSet(params) {
    const {
      description,
      purchaseCurrency,
      sellingCurrency,
      qualityControlPercent,
      transportInsuranceCost,
      duty,
      exchangeRate,
      italyAccessoryCosts,
      tools,
      retailMultiplier,
      optimalMargin,
    } = params;

    // Validazione
    if (!description) {
      throw new Error("Descrizione è obbligatoria");
    }

    const newParameterSet = await createParameterSet({
      description,
      purchase_currency: purchaseCurrency,
      selling_currency: sellingCurrency,
      quality_control_percent: qualityControlPercent,
      transport_insurance_cost: transportInsuranceCost,
      duty,
      exchange_rate: exchangeRate,
      italy_accessory_costs: italyAccessoryCosts,
      tools,
      company_multiplier: this.calculateCompanyMultiplier(optimalMargin),
      retail_multiplier: retailMultiplier,
      optimal_margin: optimalMargin,
    });

    return newParameterSet;
  }

  /**
   * Aggiorna un set di parametri
   */
  async updateParameterSet(id, params) {
    const {
      description,
      purchaseCurrency,
      sellingCurrency,
      qualityControlPercent,
      transportInsuranceCost,
      duty,
      exchangeRate,
      italyAccessoryCosts,
      tools,
      retailMultiplier,
      optimalMargin,
    } = params;

    const updatedParameterSet = await updateParameterSet(id, {
      description,
      purchase_currency: purchaseCurrency,
      selling_currency: sellingCurrency,
      quality_control_percent: qualityControlPercent,
      transport_insurance_cost: transportInsuranceCost,
      duty,
      exchange_rate: exchangeRate,
      italy_accessory_costs: italyAccessoryCosts,
      tools,
      company_multiplier: this.calculateCompanyMultiplier(optimalMargin),
      retail_multiplier: retailMultiplier,
      optimal_margin: optimalMargin,
    });

    return updatedParameterSet;
  }

  /**
   * Elimina un set di parametri
   */
  async deleteParameterSet(id) {
    return await deleteParameterSet(id);
  }

  /**
   * Imposta un set di parametri come default
   */
  async setDefaultParameterSet(id) {
    return await setDefaultParameterSet(id);
  }

  /**
   * Aggiorna l'ordine dei set di parametri
   */
  async updateParameterSetsOrder(parameterSets) {
    return await updateParameterSetsOrder(parameterSets);
  }
}

module.exports = ParameterService;
