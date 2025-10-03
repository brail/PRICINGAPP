/**
 * Authentication Routes per Pricing Calculator v0.2
 * Gestisce login, registrazione e gestione utenti
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
  authenticateToken,
  requireAdmin,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../middleware/auth");

// Inizializza il modello User
let userModel;

const initUserModel = (db) => {
  userModel = new User(db);
};

// Middleware per inizializzare il modello User
router.use((req, res, next) => {
  if (!userModel) {
    const db = req.app.locals.db;
    initUserModel(db);
  }
  next();
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username e password sono richiesti" });
    }

    // Trova l'utente
    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

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
    console.error("Errore nel login:", error);
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
      console.error("Errore nella registrazione:", error);
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
    console.error("Errore nel refresh token:", error);
    res.status(401).json({ error: "Refresh token non valido" });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // Rimuovi password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Errore nel recupero profilo:", error);
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
      console.error("Errore nell'aggiornamento profilo:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
});

// GET /api/auth/users
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.json({ users });
  } catch (error) {
    console.error("Errore nel recupero utenti:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// PUT /api/auth/users/:id
router.put("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, role, is_active } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID utente non valido" });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Nessun campo da aggiornare" });
    }

    await userModel.update(userId, updateData);

    res.json({ message: "Utente aggiornato con successo" });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Username o email già esistenti" });
    } else {
      console.error("Errore nell'aggiornamento utente:", error);
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
      console.error("Errore nell'eliminazione utente:", error);
      res.status(500).json({ error: "Errore interno del server" });
    }
  }
);

module.exports = { router, initUserModel };
