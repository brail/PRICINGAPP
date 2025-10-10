/**
 * Authentication Service per Pricing Calculator v0.3.0
 * Gestisce autenticazione multi-provider e JIT provisioning
 */

const { logger } = require("../utils/logger");

class AuthService {
  constructor(userModel) {
    this.userModel = userModel;
  }

  /**
   * Valida se un utente può usare l'autenticazione locale
   * Solo gli admin possono usare local auth
   */
  async validateAdminLocalAuth(username) {
    try {
      const user = await this.userModel.findByUsername(username);
      if (!user) {
        return { valid: false, reason: "User not found" };
      }

      if (user.role !== "admin") {
        return { valid: false, reason: "Insufficient privileges" };
      }

      if (user.auth_provider !== "local") {
        return { valid: false, reason: "User not configured for local auth" };
      }

      return { valid: true, user };
    } catch (error) {
      logger.error(error, { context: "validateAdminLocalAuth", username });
      return { valid: false, reason: "Validation error" };
    }
  }

  /**
   * Provisioning Just-in-Time per utenti da provider esterni
   */
  async provisionUserJIT(providerData) {
    try {
      const {
        provider,
        providerUserId,
        username,
        email,
        role = "user",
        metadata = null,
      } = providerData;

      // Verifica che i dati richiesti siano presenti
      if (!provider || !providerUserId || !username || !email) {
        throw new Error("Missing required provider data");
      }

      // Usa il metodo del modello per JIT provisioning
      const user = await this.userModel.findOrCreateFromProvider({
        provider,
        providerUserId,
        username,
        email,
        role,
        metadata,
      });

      logger.info(`JIT provisioning successful`, {
        provider,
        providerUserId,
        username,
        email,
        role,
        isNewUser:
          !user.created_at ||
          new Date(user.created_at) > new Date(Date.now() - 60000), // Se creato negli ultimi 60 secondi
      });

      return user;
    } catch (error) {
      logger.error(error, { context: "provisionUserJIT", providerData });
      throw error;
    }
  }

  /**
   * Mappa i gruppi AD ai ruoli dell'applicazione
   */
  mapADGroupsToRole(groups) {
    if (!Array.isArray(groups)) {
      return "user";
    }

    // Gruppi che conferiscono privilegi admin
    const adminGroups = [
      "Domain Admins",
      "Enterprise Admins",
      "Pricing-Admins",
      "IT-Admins",
      "System-Admins",
    ];

    // Gruppi che conferiscono privilegi demo
    const demoGroups = ["Pricing-Demo", "Demo-Users", "Trial-Users"];

    // Controlla se l'utente appartiene a gruppi admin
    const hasAdminGroup = groups.some((group) =>
      adminGroups.some((adminGroup) =>
        group.toLowerCase().includes(adminGroup.toLowerCase())
      )
    );

    if (hasAdminGroup) {
      return "admin";
    }

    // Controlla se l'utente appartiene a gruppi demo
    const hasDemoGroup = groups.some((group) =>
      demoGroups.some((demoGroup) =>
        group.toLowerCase().includes(demoGroup.toLowerCase())
      )
    );

    if (hasDemoGroup) {
      return "demo";
    }

    return "user";
  }

  /**
   * Estrae informazioni utente da profilo LDAP
   */
  extractLDAPUserInfo(ldapProfile) {
    try {
      const groups = ldapProfile.memberOf || [];
      const role = this.mapADGroupsToRole(groups);

      return {
        provider: "ldap",
        providerUserId: ldapProfile.uid || ldapProfile.sAMAccountName,
        username: ldapProfile.uid || ldapProfile.sAMAccountName,
        email: ldapProfile.mail || ldapProfile.email,
        role,
        metadata: {
          ldapGroups: groups,
          displayName: ldapProfile.displayName || ldapProfile.cn,
          department: ldapProfile.department,
          title: ldapProfile.title,
          lastLdapSync: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(error, { context: "extractLDAPUserInfo", ldapProfile });
      throw new Error("Failed to extract LDAP user information");
    }
  }

  /**
   * Estrae informazioni utente da profilo Google
   */
  extractGoogleUserInfo(googleProfile) {
    try {
      return {
        provider: "google",
        providerUserId: googleProfile.id,
        username: googleProfile.emails[0].value.split("@")[0],
        email: googleProfile.emails[0].value,
        role: "user", // Google users sono sempre 'user' di default
        metadata: {
          googleId: googleProfile.id,
          name: googleProfile.name,
          picture: googleProfile.photos[0]?.value,
          locale: googleProfile._json.locale,
          verified: googleProfile.emails[0].verified,
          lastGoogleSync: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error(error, { context: "extractGoogleUserInfo", googleProfile });
      throw new Error("Failed to extract Google user information");
    }
  }

  /**
   * Ottiene la lista dei provider di autenticazione disponibili
   */
  getAvailableProviders() {
    const providers = [];

    // Local auth sempre disponibile
    providers.push({
      id: "local",
      name: "Local Admin",
      description: "Autenticazione locale per amministratori",
      enabled: process.env.ENABLE_LOCAL_AUTH === "true",
      icon: "admin_panel_settings",
      requiresPassword: true,
    });

    // LDAP auth
    if (process.env.ENABLE_LDAP_AUTH === "true" && process.env.LDAP_URL) {
      providers.push({
        id: "ldap",
        name: "Active Directory",
        description: "Autenticazione tramite Active Directory",
        enabled: true,
        icon: "business",
        requiresPassword: true,
      });
    }

    // Google OAuth
    if (
      process.env.ENABLE_GOOGLE_AUTH === "true" &&
      process.env.GOOGLE_CLIENT_ID
    ) {
      providers.push({
        id: "google",
        name: "Google",
        description: "Accedi con il tuo account Google",
        enabled: true,
        icon: "google",
        requiresPassword: false,
      });
    }

    return providers.filter((provider) => provider.enabled);
  }

  /**
   * Valida le credenziali per un provider specifico
   */
  async validateProviderCredentials(provider, credentials) {
    try {
      switch (provider) {
        case "local":
          return await this.validateAdminLocalAuth(credentials.username);

        case "ldap":
          // La validazione LDAP è gestita da Passport
          return { valid: true };

        case "google":
          // La validazione Google è gestita da OAuth2
          return { valid: true };

        default:
          return { valid: false, reason: "Unknown provider" };
      }
    } catch (error) {
      logger.error(error, {
        context: "validateProviderCredentials",
        provider,
      });
      return { valid: false, reason: "Validation error" };
    }
  }

  /**
   * Logga eventi di autenticazione per audit
   */
  logAuthEvent(event, details) {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...details,
    };

    switch (event) {
      case "login_success":
        logger.info("Authentication successful", logData);
        break;
      case "login_failed":
        logger.warn("Authentication failed", logData);
        break;
      case "provider_error":
        logger.error("Provider authentication error", logData);
        break;
      case "jit_provisioning":
        logger.info("JIT provisioning completed", logData);
        break;
      default:
        logger.info("Authentication event", logData);
    }
  }
}

module.exports = AuthService;
