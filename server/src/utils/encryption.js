/**
 * Pricing Calculator v0.3.0 - Encryption Utilities
 * Utilità per crittografare/decrittografare credenziali sensibili
 */

const crypto = require("crypto");

class EncryptionService {
  constructor() {
    // Chiave di crittografia derivata da JWT_SECRET
    this.algorithm = "aes-256-cbc";
    this.key = this.deriveKey(process.env.JWT_SECRET || "default-secret");
  }

  deriveKey(secret) {
    return crypto.scryptSync(secret, "ldap-credentials-salt", 32);
  }

  encrypt(text) {
    if (!text) return null;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
    };
  }

  decrypt(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) return null;

    try {
      const iv = Buffer.from(encryptedData.iv, "hex");
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Errore decrittografia:", error);
      return null;
    }
  }

  // Metodo per crittografare credenziali LDAP
  encryptLdapCredentials(bindDN, bindPassword) {
    return {
      bindDN: this.encrypt(bindDN),
      bindPassword: this.encrypt(bindPassword),
    };
  }

  // Metodo per decrittografare credenziali LDAP
  decryptLdapCredentials(encryptedCredentials) {
    return {
      bindDN: this.decrypt(encryptedCredentials.bindDN),
      bindPassword: this.decrypt(encryptedCredentials.bindPassword),
    };
  }
}

module.exports = EncryptionService;
