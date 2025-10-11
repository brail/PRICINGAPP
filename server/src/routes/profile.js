/**
 * Pricing Calculator v0.3.1 - Profile Routes
 * Gestione profili utente e cambio email con verifica
 */

const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");
const EmailService = require("../services/emailService");

function createProfileRoutes(userModel) {
  const router = express.Router();
  const emailService = new EmailService();

  /**
   * GET /profile
   * Ottieni profilo utente corrente
   */
  router.get("/profile", authenticateToken, async (req, res) => {
    try {
      const profile = await userModel.getProfile(req.user.id);

      // Rimuovi campi sensibili
      delete profile.password;
      delete profile.email_verification_token;
      delete profile.email_verification_expires;

      res.json({ profile });
    } catch (error) {
      logger.error("Failed to get profile", {
        userId: req.user.id,
        error: error.message,
      });
      res.status(500).json({ error: "Errore nel recupero del profilo" });
    }
  });

  /**
   * PUT /profile
   * Aggiorna profilo utente (first_name, last_name, phone, avatar_url, timezone, locale, bio)
   */
        router.put("/profile", authenticateToken, async (req, res) => {
          try {
            const { first_name, last_name, phone, avatar_url, timezone, locale, bio } = req.body;

      // Validazione base
      if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
        return res.status(400).json({ error: "Formato telefono non valido" });
      }

      if (bio && bio.length > 500) {
        return res
          .status(400)
          .json({ error: "Bio troppo lunga (max 500 caratteri)" });
      }

      if (locale && !["it", "en", "de", "fr", "es"].includes(locale)) {
        return res.status(400).json({ error: "Lingua non supportata" });
      }

      // Aggiorna profilo
            await userModel.updateProfile(req.user.id, {
              first_name,
              last_name,
              phone,
              avatar_url,
              timezone,
              locale,
              bio,
            });

      // Recupera profilo aggiornato
      const updatedProfile = await userModel.getProfile(req.user.id);
      delete updatedProfile.password;
      delete updatedProfile.email_verification_token;
      delete updatedProfile.email_verification_expires;

      logger.info("Profile updated", {
        userId: req.user.id,
        username: req.user.username,
      });

      res.json({
        message: "Profilo aggiornato con successo",
        profile: updatedProfile,
      });
    } catch (error) {
      logger.error("Failed to update profile", {
        userId: req.user.id,
        error: error.message,
      });
      res.status(500).json({ error: "Errore nell'aggiornamento del profilo" });
    }
  });

  /**
   * POST /profile/email
   * Richiedi cambio email (invia email di verifica)
   */
  router.post("/profile/email", authenticateToken, async (req, res) => {
    try {
      const { newEmail } = req.body;

      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ error: "Email non valida" });
      }

      // Verifica che la nuova email non sia già in uso
      try {
        const existingUser = await userModel.findByEmail(newEmail);
        if (existingUser && existingUser.id !== req.user.id) {
          return res
            .status(400)
            .json({ error: "Email già in uso da un altro utente" });
        }
      } catch (error) {
        // Email non trovata, va bene
      }

      // Genera token di verifica
      const token = emailService.generateVerificationToken();

      // Salva email pending e token
      await userModel.initEmailChange(req.user.id, newEmail, token);

      // Invia email di verifica
      const currentUser = await userModel.findById(req.user.id);
      await emailService.sendEmailVerification(currentUser, newEmail, token);

      logger.info("Email change requested", {
        userId: req.user.id,
        oldEmail: currentUser.email,
        newEmail,
      });

      res.json({
        message:
          "Email di verifica inviata. Controlla la tua nuova casella email.",
        emailPending: newEmail,
      });
    } catch (error) {
      logger.error("Failed to initiate email change", {
        userId: req.user.id,
        error: error.message,
      });
      res
        .status(500)
        .json({ error: "Errore nell'invio dell'email di verifica" });
    }
  });

  /**
   * GET /profile/verify-email
   * Verifica e conferma cambio email
   */
  router.get("/profile/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: "Token mancante" });
      }

      // Verifica token e aggiorna email
      await userModel.verifyEmailChange(token);

      logger.info("Email change verified", { token });

      res.json({
        message: "Email aggiornata con successo!",
        success: true,
      });
    } catch (error) {
      logger.error("Failed to verify email change", {
        error: error.message,
      });

      if (error.message === "Token non valido") {
        return res.status(400).json({ error: "Token non valido" });
      }
      if (error.message === "Token scaduto") {
        return res
          .status(400)
          .json({ error: "Token scaduto. Richiedi un nuovo cambio email." });
      }

      res.status(500).json({ error: "Errore nella verifica dell'email" });
    }
  });

  return router;
}

module.exports = createProfileRoutes;
