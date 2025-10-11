/**
 * Pricing Calculator v0.3.1 - Email Service
 * Servizio per invio email con supporto multi-ambiente
 * - Development: Ethereal Email (test account auto-generated)
 * - Production: SMTP reale (configurato tramite env vars)
 */

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { logger } = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.testAccount = null;
  }

  /**
   * Inizializza il transporter email
   * In development usa Ethereal, in production usa SMTP configurato
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      if (process.env.NODE_ENV === "production" && process.env.SMTP_HOST) {
        // Production: SMTP reale
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        logger.info("Email service initialized with production SMTP", {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
        });
      } else {
        // Development: Ethereal Email (test account)
        this.testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: this.testAccount.smtp.host,
          port: this.testAccount.smtp.port,
          secure: this.testAccount.smtp.secure,
          auth: {
            user: this.testAccount.user,
            pass: this.testAccount.pass,
          },
        });

        logger.info("Email service initialized with Ethereal test account", {
          user: this.testAccount.user,
          webUrl: "https://ethereal.email",
        });
      }

      this.initialized = true;
    } catch (error) {
      logger.error("Failed to initialize email service", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Genera un token sicuro per verifica email
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Invia email di verifica per cambio email
   * @param {object} user - Utente corrente
   * @param {string} newEmail - Nuova email da verificare
   * @param {string} token - Token di verifica
   */
  async sendEmailVerification(user, newEmail, token) {
    await this.initialize();

    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from:
        process.env.SMTP_FROM || '"Pricing Calculator" <noreply@pricing.app>',
      to: newEmail,
      subject: "Verifica il tuo nuovo indirizzo email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #1976d2; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0; 
            }
            .footer { 
              text-align: center; 
              color: #777; 
              font-size: 12px; 
              padding: 20px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pricing Calculator</h1>
            </div>
            <div class="content">
              <h2>Verifica il tuo nuovo indirizzo email</h2>
              <p>Ciao <strong>${user.username}</strong>,</p>
              <p>Hai richiesto di cambiare il tuo indirizzo email da:</p>
              <ul>
                <li><strong>Vecchia email:</strong> ${user.email}</li>
                <li><strong>Nuova email:</strong> ${newEmail}</li>
              </ul>
              <p>Per completare il cambio, clicca sul pulsante qui sotto entro 24 ore:</p>
              <div style="text-align: center;">
                <a href="${verifyUrl}" class="button">Verifica Nuova Email</a>
              </div>
              <p style="color: #777; font-size: 14px;">
                Se non hai richiesto questo cambio, ignora questa email.<br>
                Il tuo indirizzo email attuale rimarrà invariato.
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Link alternativo (copia/incolla nel browser):<br>
                ${verifyUrl}
              </p>
            </div>
            <div class="footer">
              <p>Pricing Calculator - Sistema di Gestione Prezzi</p>
              <p>Questa è un'email automatica, non rispondere.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Pricing Calculator - Verifica Email
        
        Ciao ${user.username},
        
        Hai richiesto di cambiare il tuo indirizzo email da ${user.email} a ${newEmail}.
        
        Per completare il cambio, apri questo link entro 24 ore:
        ${verifyUrl}
        
        Se non hai richiesto questo cambio, ignora questa email.
        
        ---
        Pricing Calculator
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      logger.info("Email verification sent", {
        to: newEmail,
        messageId: info.messageId,
      });

      // In development, mostra il link Ethereal per visualizzare l'email
      if (this.testAccount) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info("Email preview available at:", { url: previewUrl });
        console.log(
          `\n📧 Email di verifica inviata (Ethereal): ${previewUrl}\n`
        );
      }

      return info;
    } catch (error) {
      logger.error("Failed to send verification email", {
        to: newEmail,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Invia email di benvenuto per nuovi utenti JIT provisioned
   * @param {object} user - Utente appena creato
   */
  async sendWelcomeEmail(user) {
    await this.initialize();

    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const mailOptions = {
      from:
        process.env.SMTP_FROM || '"Pricing Calculator" <noreply@pricing.app>',
      to: user.email,
      subject: "Benvenuto in Pricing Calculator",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #1976d2; 
              color: white; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0; 
            }
            .footer { 
              text-align: center; 
              color: #777; 
              font-size: 12px; 
              padding: 20px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Benvenuto!</h1>
            </div>
            <div class="content">
              <h2>Il tuo account è stato creato</h2>
              <p>Ciao <strong>${user.username}</strong>,</p>
              <p>Il tuo account è stato creato automaticamente tramite ${
                user.auth_provider === "ldap" ? "Active Directory" : "Google"
              }.</p>
              <p>Puoi ora accedere all'applicazione Pricing Calculator con le tue credenziali aziendali.</p>
              <div style="text-align: center;">
                <a href="${appUrl}" class="button">Vai all'Applicazione</a>
              </div>
            </div>
            <div class="footer">
              <p>Pricing Calculator - Sistema di Gestione Prezzi</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Welcome email sent", {
        to: user.email,
        messageId: info.messageId,
      });

      if (this.testAccount) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`\n📧 Email benvenuto inviata (Ethereal): ${previewUrl}\n`);
      }

      return info;
    } catch (error) {
      logger.error("Failed to send welcome email", {
        to: user.email,
        error: error.message,
      });
      // Non fallire se l'email di benvenuto non viene inviata
      return null;
    }
  }
}

module.exports = EmailService;
