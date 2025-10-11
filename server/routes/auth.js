/**
 * Authentication Routes per Pricing Calculator v0.3.0
 * Gestisce login multi-provider, registrazione e gestione utenti
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../src/models/User");
const AuthService = require("../src/services/authService");
const { passport, initializeUserModel } = require("../src/config/passport");
const {
  authenticateToken,
  requireAdmin,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../middleware/auth");
const { loggers } = require("../utils/logger");

// Inizializza il modello User e AuthService
let userModel;
let authService;

const initServices = (db) => {
  userModel = new User(db);
  authService = new AuthService(userModel);
};

// Middleware per inizializzare i servizi
router.use((req, res, next) => {
  if (!userModel || !authService) {
    const db = req.app.locals.db;
    initServices(db);
    console.log("✅ Auth services initialized");
  }
  next();
});

// Middleware semplificato - rimuovo l'inizializzazione Passport problematica

// POST /api/auth/login - VERSIONE SEMPLIFICATA PER DEBUG
router.post("/login", async (req, res) => {
  try {
    console.log("Login endpoint called");
    const { username, password } = req.body;
    console.log("Username:", username);

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username e password sono richiesti" });
    }

    // Verifica che l'utente possa usare local auth
    const validation = await authService.validateAdminLocalAuth(username);
    if (!validation.valid) {
      return res.status(401).json({
        error: "Autenticazione locale disponibile solo per amministratori",
      });
    }

    const user = validation.user;

    // Verifica la password
    const isValidPassword = await userModel.verifyPassword(
      password,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Aggiorna ultimo login
    await userModel.updateLastLogin(user.id);

    // Genera token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Rimuovi password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login effettuato con successo",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// POST /api/auth/ldap (LDAP authentication)
router.post("/ldap", async (req, res, next) => {
  if (process.env.ENABLE_LDAP_AUTH !== "true") {
    return res.status(501).json({ error: "Autenticazione LDAP non abilitata" });
  }

  // Usa direttamente il servizio LDAP invece di Passport
  try {
    console.log("🔍 LDAP endpoint called, userModel:", !!userModel);
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username e password sono richiesti" });
    }

    // Importa il servizio LDAP
    const LdapService = require("../src/services/ldapService");
    const ldapService = new LdapService();

    // Autentica utente tramite LDAP
    const ldapUserData = await ldapService.authenticateUser(username, password);

    // Estrai informazioni utente da LDAP
    const ldapUser = {
      provider: "ldap",
      providerUserId: ldapUserData.username,
      username: ldapUserData.username,
      email: ldapUserData.email,
      displayName: ldapUserData.displayName,
      groups: ldapUserData.groups,
      metadata: {
        ldapGroups: ldapUserData.groups,
        displayName: ldapUserData.displayName,
        givenName: ldapUserData.givenName,
        surname: ldapUserData.surname,
        userPrincipalName: ldapUserData.userPrincipalName,
        lastLdapSync: new Date().toISOString(),
      },
    };

    // Determina ruolo basato sui gruppi AD
    const role = ldapService.determineUserRole(ldapUser.groups);

    // JIT Provisioning - crea istanza User direttamente
    const User = require("../src/models/User");
    const userModelInstance = new User(req.app.locals.db);

    const localUser = await userModelInstance.findOrCreateFromProvider({
      provider: "ldap",
      providerUserId: ldapUser.providerUserId,
      username: ldapUser.username,
      email: ldapUser.email,
      role,
      metadata: ldapUser.metadata,
    });

    // Genera token
    const accessToken = generateAccessToken(localUser);
    const refreshToken = generateRefreshToken(localUser);

    // Rimuovi password dalla risposta
    const { password: _, ...userWithoutPassword } = localUser;

    authService.logAuthEvent("login_success", {
      username: localUser.username,
      provider: "ldap",
      role: localUser.role,
      ip: req.ip,
    });

    res.json({
      message: "Login LDAP effettuato con successo",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    authService.logAuthEvent("provider_error", {
      provider: "ldap",
      error: error.message,
      ip: req.ip,
    });
    return res
      .status(401)
      .json({ error: error.message || "Credenziali non valide" });
  }
});

// GET /api/auth/google (Google OAuth redirect)
router.get("/google", (req, res, next) => {
  if (process.env.ENABLE_GOOGLE_AUTH !== "true") {
    return res
      .status(501)
      .json({ error: "Autenticazione Google non abilitata" });
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
});

// GET /api/auth/google/callback (Google OAuth callback)
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      authService.logAuthEvent("provider_error", {
        provider: "google",
        error: err.message,
        ip: req.ip,
      });
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=oauth_error`
      );
    }

    if (!user) {
      authService.logAuthEvent("login_failed", {
        provider: "google",
        reason: info?.message || "Authentication failed",
        ip: req.ip,
      });
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=oauth_failed`
      );
    }

    // Genera token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    authService.logAuthEvent("login_success", {
      username: user.username,
      provider: "google",
      role: user.role,
      ip: req.ip,
    });

    // Redirect al frontend con i token
    const tokens = encodeURIComponent(
      JSON.stringify({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_provider: user.auth_provider,
        },
      })
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?tokens=${tokens}`);
  })(req, res, next);
});

// GET /api/auth/providers (Lista provider disponibili)
router.get("/providers", (req, res) => {
  try {
    const providers = authService.getAvailableProviders();
    res.json({ providers });
  } catch (error) {
    loggers.error(error, { context: "getProviders" });
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email e password sono richiesti" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "La password deve essere di almeno 6 caratteri" });
    }

    // Crea l'utente
    const newUser = await userModel.create({
      username,
      email,
      password,
      role,
    });

    res.status(201).json({
      message: "Utente creato con successo",
      user: newUser,
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Username o email già esistenti" });
    } else {
      loggers.error(error, { context: "register", username, email });
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token richiesto" });
    }

    // Verifica il refresh token
    const decoded = await verifyRefreshToken(refreshToken);

    // Trova l'utente
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Utente non trovato" });
    }

    // Genera nuovi token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    loggers.error(error, { context: "refreshToken" });
    res.status(401).json({ error: "Refresh token non valido" });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // Assicurati che userModel sia inizializzato
    if (!userModel) {
      const User = require("../src/models/User");
      userModel = new User(req.app.locals.db);
    }

    const user = await userModel.getProfile(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // Rimuovi campi sensibili dalla risposta
    const {
      password,
      email_verification_token,
      email_verification_expires,
      ...userWithoutSensitiveData
    } = user;

    res.json({
      user: userWithoutSensitiveData,
    });
  } catch (error) {
    loggers.error(error, { context: "getProfile", userId: req.user.id });
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// PUT /api/auth/me
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Nessun campo da aggiornare" });
    }

    await userModel.update(req.user.id, updateData);

    // Recupera l'utente aggiornato
    const updatedUser = await userModel.findById(req.user.id);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: "Profilo aggiornato con successo",
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Username o email già esistenti" });
    } else {
      loggers.error(error, { context: "updateProfile", userId: req.user.id });
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
});

// GET /api/auth/users
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Assicurati che userModel sia inizializzato
    if (!userModel) {
      const User = require("../src/models/User");
      userModel = new User(req.app.locals.db);
    }

    const users = await userModel.getAll();

    // Arricchisci i dati utente con le informazioni del profilo
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          const profile = await userModel.getProfile(user.id);
          return {
            ...user,
            first_name: profile.first_name || null,
            last_name: profile.last_name || null,
            phone: profile.phone || null,
            avatar_url: profile.avatar_url || null,
            timezone: profile.timezone || null,
            locale: profile.locale || null,
            bio: profile.bio || null,
            profile_updated_at: profile.profile_updated_at || null,
            email_verified_at: profile.email_verified_at || null,
            auth_provider: profile.auth_provider || "local",
            provider_user_id: profile.provider_user_id || null,
          };
        } catch (profileError) {
          // Se il profilo non esiste, restituisci l'utente base con campi null
          return {
            ...user,
            first_name: null,
            last_name: null,
            phone: null,
            avatar_url: null,
            timezone: null,
            locale: null,
            bio: null,
            profile_updated_at: null,
            email_verified_at: null,
            auth_provider: user.auth_provider || "local",
            provider_user_id: user.provider_user_id || null,
          };
        }
      })
    );

    res.json({ users: enrichedUsers });
  } catch (error) {
    loggers.error(error, { context: "getUsers", adminId: req.user.id });
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// PUT /api/auth/users/:id
router.put("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const {
      username,
      email,
      role,
      is_active,
      first_name,
      last_name,
      phone,
      avatar_url,
      timezone,
      locale,
      bio,
    } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID utente non valido" });
    }

    // Assicurati che userModel sia inizializzato
    if (!userModel) {
      const User = require("../src/models/User");
      userModel = new User(req.app.locals.db);
    }

    // Ottieni informazioni utente per verificare il provider
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const isExternalProvider = user.auth_provider && user.auth_provider !== "local";

    // Aggiorna dati base utente (solo per utenti locali)
    const updateData = {};
    if (!isExternalProvider) {
      // Per utenti locali: tutti i campi sono modificabili
      if (username) updateData.username = username;
      if (email) updateData.email = email;
    }
    // Per tutti gli utenti: ruolo e stato sono sempre modificabili da admin
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length > 0) {
      await userModel.update(userId, updateData);
    }

    // Aggiorna dati profilo (logica basata sul provider)
    const profileData = {};
    if (!isExternalProvider) {
      // Per utenti locali: tutti i campi profilo sono modificabili
      if (first_name !== undefined) profileData.first_name = first_name;
      if (last_name !== undefined) profileData.last_name = last_name;
      if (avatar_url !== undefined) profileData.avatar_url = avatar_url;
    }
    // Per tutti gli utenti: questi campi sono sempre modificabili
    if (phone !== undefined) profileData.phone = phone;
    if (timezone !== undefined) profileData.timezone = timezone;
    if (locale !== undefined) profileData.locale = locale;
    if (bio !== undefined) profileData.bio = bio;

    if (Object.keys(profileData).length > 0) {
      await userModel.updateProfile(userId, profileData);
    }

    if (
      Object.keys(updateData).length === 0 &&
      Object.keys(profileData).length === 0
    ) {
      return res.status(400).json({ error: "Nessun campo da aggiornare" });
    }

    res.json({ message: "Utente aggiornato con successo" });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Username o email già esistenti" });
    } else {
      loggers.error(error, {
        context: "updateUser",
        adminId: req.user.id,
        targetUserId: userId,
      });
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
});

// POST /api/auth/users (Creazione utente)
router.post("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role = "user",
      first_name,
      last_name,
      phone,
      avatar_url,
      timezone = "Europe/Rome",
      locale = "it",
      bio,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email e password sono obbligatori",
      });
    }

    // Assicurati che userModel sia inizializzato
    if (!userModel) {
      const User = require("../src/models/User");
      userModel = new User(req.app.locals.db);
    }

    // Crea utente base
    const userData = {
      username,
      email,
      password,
      role,
      auth_provider: "local",
    };

    const newUser = await userModel.create(userData);

    // Aggiorna profilo se ci sono dati aggiuntivi
    const profileData = {};
    if (first_name) profileData.first_name = first_name;
    if (last_name) profileData.last_name = last_name;
    if (phone) profileData.phone = phone;
    if (avatar_url) profileData.avatar_url = avatar_url;
    if (timezone) profileData.timezone = timezone;
    if (locale) profileData.locale = locale;
    if (bio) profileData.bio = bio;

    if (Object.keys(profileData).length > 0) {
      await userModel.updateProfile(newUser.id, profileData);
    }

    res.status(201).json({
      message: "Utente creato con successo",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Username o email già esistenti" });
    } else {
      loggers.error(error, {
        context: "createUser",
        adminId: req.user.id,
      });
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
});

// DELETE /api/auth/users/:id
router.delete(
  "/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID utente non valido" });
      }

      // Non permettere di eliminare se stesso
      if (userId === req.user.id) {
        return res
          .status(400)
          .json({ error: "Non puoi eliminare il tuo account" });
      }

      await userModel.hardDelete(userId);

      res.json({ message: "Utente eliminato con successo" });
    } catch (error) {
      loggers.error(error, {
        context: "deleteUser",
        adminId: req.user.id,
        targetUserId: userId,
      });
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
);

// PUT /api/auth/me/password - Cambia password utente corrente
router.put("/me/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Validazione
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Le password non coincidono" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "La password deve essere di almeno 6 caratteri" });
    }

    // Verifica password corrente
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Password corrente non corretta" });
    }

    // Hash della nuova password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna password
    await userModel.update(userId, { password: hashedNewPassword });

    res.json({ message: "Password aggiornata con successo" });
  } catch (error) {
    loggers.error(error, { context: "changePassword", userId: req.user.id });
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// PUT /api/auth/users/:id/password - Cambia password di un altro utente (solo admin)
router.put(
  "/users/:id/password",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword, confirmPassword } = req.body;

      // Validazione
      if (!newPassword || !confirmPassword) {
        return res
          .status(400)
          .json({ error: "Tutti i campi sono obbligatori" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Le password non coincidono" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "La password deve essere di almeno 6 caratteri" });
      }

      // Verifica che l'utente esista
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Hash della nuova password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Aggiorna password
      await userModel.update(userId, { password: hashedNewPassword });

      res.json({ message: "Password aggiornata con successo" });
    } catch (error) {
      loggers.error(error, {
        context: "changeUserPassword",
        adminId: req.user.id,
        targetUserId: userId,
      });
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
);

module.exports = { router, initUserModel: initServices };
