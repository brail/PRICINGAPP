/**
 * Authentication Middleware per Pricing Calculator v0.2
 * Gestisce JWT e autenticazione
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "pricing-calculator-secret-key-2024";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "pricing-calculator-refresh-secret-key-2024";

// Middleware per verificare il token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token di accesso richiesto" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token non valido" });
    }
    req.user = user;
    next();
  });
};

// Middleware per verificare il ruolo admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Accesso negato. Richiesto ruolo admin." });
  }
};

// Genera token di accesso
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Genera token di refresh
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// Verifica token di refresh
const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
