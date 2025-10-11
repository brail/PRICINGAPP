/**
 * Passport Configuration per Pricing Calculator v0.3.0
 * Configurazione strategie di autenticazione: Local, LDAP, Google OAuth2
 */

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { loggers } = require("../utils/logger");
const LdapService = require("../services/ldapService");

// Inizializza il modello User
let userModel;

const initUserModel = (db) => {
  const User = require("../models/User");
  userModel = new User(db);
};

// Serializzazione utente per sessioni
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializzazione utente dalle sessioni
passport.deserializeUser(async (id, done) => {
  try {
    if (!userModel) {
      return done(new Error("User model not initialized"));
    }
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Strategy Local (solo per admin)
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      try {
        if (!userModel) {
          return done(new Error("User model not initialized"));
        }

        // Verifica che l'utente sia admin per usare local auth
        const user = await userModel.findByUsername(username);
        if (!user) {
          logger.info(`Local auth failed: user not found`, {
            username,
            ip: req.ip,
          });
          return done(null, false, { message: "Credenziali non valide" });
        }

        // Solo admin possono usare local auth
        if (user.role !== "admin" || user.auth_provider !== "local") {
          logger.info(`Local auth denied: insufficient privileges`, {
            username,
            role: user.role,
            provider: user.auth_provider,
            ip: req.ip,
          });
          return done(null, false, {
            message:
              "Autenticazione locale disponibile solo per amministratori",
          });
        }

        // Verifica password
        const isValidPassword = await userModel.verifyPassword(
          password,
          user.password
        );
        if (!isValidPassword) {
          logger.info(`Local auth failed: invalid password`, {
            username,
            ip: req.ip,
          });
          return done(null, false, { message: "Credenziali non valide" });
        }

        // Aggiorna ultimo login
        await userModel.updateLastLogin(user.id);

        logger.info(`Local auth successful`, {
          username,
          role: user.role,
          ip: req.ip,
        });
        return done(null, user);
      } catch (error) {
        loggers.error(error, { context: "local-strategy", username });
        return done(error, null);
      }
    }
  )
);

// Strategy LDAP/Active Directory (Custom)
if (process.env.ENABLE_LDAP_AUTH === "true") {
  const ldapService = new LdapService();

  passport.use(
    "ldap",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, username, password, done) => {
        try {
          if (!userModel) {
            return done(new Error("User model not initialized"));
          }

          // Autentica utente tramite LDAP
          console.log(
            `[LDAP Strategy] Attempting authentication for: ${username}`
          );
          const ldapUserData = await ldapService.authenticateUser(
            username,
            password
          );
          console.log(
            `[LDAP Strategy] Authentication successful, user data:`,
            ldapUserData
          );

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
              sn: ldapUserData.surname, // Usa 'sn' per compatibilità con il modello User
              surname: ldapUserData.surname,
              userPrincipalName: ldapUserData.userPrincipalName,
              lastLdapSync: new Date().toISOString(),
            },
          };

          // Determina ruolo basato sui gruppi AD
          const role = ldapService.determineUserRole(ldapUser.groups);

          // JIT Provisioning
          const localUser = await userModel.findOrCreateFromProvider({
            provider: "ldap",
            providerUserId: ldapUser.providerUserId,
            username: ldapUser.username,
            email: ldapUser.email,
            role,
            metadata: ldapUser.metadata,
          });

          logger.info(`LDAP auth successful`, {
            username: ldapUser.username,
            role,
            groups: ldapUser.groups.length,
            ip: req.ip,
          });

          return done(null, localUser);
        } catch (error) {
          loggers.error(error, {
            context: "ldap-strategy",
            username,
          });
          return done(null, false, { message: error.message });
        }
      }
    )
  );
}

// Strategy Google OAuth2
if (process.env.ENABLE_GOOGLE_AUTH === "true") {
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          if (!userModel) {
            return done(new Error("User model not initialized"));
          }

          // Estrai informazioni utente da Google
          const googleUser = {
            provider: "google",
            providerUserId: profile.id,
            username: profile.emails[0].value.split("@")[0], // Usa parte prima di @ come username
            email: profile.emails[0].value,
            displayName: profile.displayName,
            metadata: {
              googleId: profile.id,
              name: profile.name,
              picture: profile.photos[0]?.value,
              locale: profile._json.locale,
              lastGoogleSync: new Date().toISOString(),
            },
          };

          // Per Google, tutti gli utenti sono 'user' di default
          // Gli admin devono essere promossi manualmente
          const role = "user";

          // JIT Provisioning
          const localUser = await userModel.findOrCreateFromProvider({
            provider: "google",
            providerUserId: googleUser.providerUserId,
            username: googleUser.username,
            email: googleUser.email,
            role,
            metadata: googleUser.metadata,
          });

          logger.info(`Google auth successful`, {
            username: googleUser.username,
            email: googleUser.email,
            ip: "oauth", // IP non disponibile per OAuth
          });

          return done(null, localUser);
        } catch (error) {
          loggers.error(error, {
            context: "google-strategy",
            googleId: profile.id,
          });
          return done(error, null);
        }
      }
    )
  );
}

// Middleware per inizializzare userModel
const initializeUserModel = (db) => {
  initUserModel(db);
  return (req, res, next) => {
    if (!userModel) {
      initUserModel(db);
    }
    next();
  };
};

module.exports = {
  passport,
  initializeUserModel,
};
