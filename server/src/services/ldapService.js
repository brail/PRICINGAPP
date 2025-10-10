/**
 * Pricing Calculator v0.3.0 - LDAP Service
 * Servizio per autenticazione LDAP/Active Directory
 */

const ldap = require("ldapjs");
const { logger } = require("../utils/logger");
const EncryptionService = require("../utils/encryption");

class LdapService {
  constructor() {
    this.encryptionService = new EncryptionService();
    this.config = {
      url: process.env.LDAP_URL,
      bindDN: this.getBindDN(),
      bindPassword: this.getBindPassword(),
      searchBase: process.env.LDAP_SEARCH_BASE,
      searchFilter:
        process.env.LDAP_SEARCH_FILTER || "(sAMAccountName={{username}})",
      adminGroup: process.env.LDAP_ADMIN_GROUP,
      domain: process.env.LDAP_DOMAIN,
    };
  }

  /**
   * Ottiene il Bind DN, supportando sia credenziali in chiaro che crittografate
   */
  getBindDN() {
    // Prova prima le credenziali crittografate
    if (process.env.LDAP_BIND_DN_ENCRYPTED) {
      try {
        const encryptedData = JSON.parse(process.env.LDAP_BIND_DN_ENCRYPTED);
        const decrypted = this.encryptionService.decrypt(encryptedData);
        if (decrypted) {
          logger.info("Usando credenziali LDAP crittografate");
          return decrypted;
        }
      } catch (error) {
        logger.warn(
          "Errore decrittografia Bind DN, fallback a credenziali in chiaro"
        );
      }
    }

    // Fallback a credenziali in chiaro
    return process.env.LDAP_BIND_DN;
  }

  /**
   * Ottiene la password Bind, supportando sia credenziali in chiaro che crittografate
   */
  getBindPassword() {
    // Prova prima le credenziali crittografate
    if (process.env.LDAP_BIND_PASSWORD_ENCRYPTED) {
      try {
        const encryptedData = JSON.parse(
          process.env.LDAP_BIND_PASSWORD_ENCRYPTED
        );
        const decrypted = this.encryptionService.decrypt(encryptedData);
        if (decrypted) {
          return decrypted;
        }
      } catch (error) {
        logger.warn(
          "Errore decrittografia Bind Password, fallback a credenziali in chiaro"
        );
      }
    }

    // Fallback a credenziali in chiaro
    return process.env.LDAP_BIND_PASSWORD;
  }

  /**
   * Autentica un utente tramite LDAP
   * @param {string} username - Username dell'utente
   * @param {string} password - Password dell'utente
   * @returns {Promise<Object>} Dati utente LDAP
   */
  async authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
      const client = ldap.createClient({
        url: this.config.url,
        timeout: 10000,
        connectTimeout: 10000,
      });

      client.on("error", (err) => {
        logger.error("LDAP Client Error", {
          error: err.message,
          context: "LdapService.authenticateUser",
          username,
        });
        client.destroy();
        reject(new Error(`Errore connessione LDAP: ${err.message}`));
      });

      client.on("connect", () => {
        logger.info("Connesso al server LDAP", { username });

        // Prima facciamo bind con l'account di servizio
        client.bind(this.config.bindDN, this.config.bindPassword, (err) => {
          if (err) {
            logger.error("Bind fallito con account di servizio", {
              username,
              error: err.message,
            });
            client.destroy();
            return reject(new Error(`Errore bind LDAP: ${err.message}`));
          }

          logger.info("Bind riuscito con account di servizio", { username });

          // Cerca l'utente
          const searchFilter = this.config.searchFilter.replace(
            "{{username}}",
            username
          );
          const opts = {
            filter: searchFilter,
            scope: "sub",
            attributes: [
              "sAMAccountName",
              "cn",
              "mail",
              "memberOf",
              "displayName",
              "userPrincipalName",
              "givenName",
              "sn",
            ],
          };

          client.search(this.config.searchBase, opts, (err, res) => {
            if (err) {
              logger.error("Ricerca utente fallita", {
                username,
                error: err.message,
              });
              client.destroy();
              return reject(new Error(`Errore ricerca utente: ${err.message}`));
            }

            let userFound = false;

            res.on("searchEntry", (entry) => {
              userFound = true;
              const userDN = entry.objectName;

              // Converti il DN in stringa
              const userDNString = userDN.toString();

              // Ora proviamo a fare bind con le credenziali dell'utente
              client.bind(userDNString, password, (err) => {
                if (err) {
                  logger.error("Autenticazione utente fallita", {
                    username,
                    error: err.message,
                  });
                  client.destroy();
                  return reject(new Error("Credenziali non valide"));
                }

                logger.info("Autenticazione utente riuscita", { username });

                // Estrai attributi utente
                const userData = this.extractUserAttributes(entry);
                client.unbind(() => {
                  resolve(userData);
                });
              });
            });

            res.on("error", (err) => {
              logger.error("Errore durante ricerca", {
                username,
                error: err.message,
              });
              client.destroy();
              reject(new Error(`Errore ricerca: ${err.message}`));
            });

            res.on("end", (result) => {
              if (result.status !== 0) {
                logger.error("Ricerca completata con errore", {
                  username,
                  status: result.status,
                });
                client.destroy();
                return reject(
                  new Error(`Ricerca fallita con status: ${result.status}`)
                );
              }

              if (!userFound) {
                logger.error("Utente non trovato", { username });
                client.destroy();
                return reject(new Error("Utente non trovato"));
              }
            });
          });
        });
      });

      // Timeout per l'intera operazione
      setTimeout(() => {
        logger.error("Timeout connessione LDAP", { username });
        client.destroy();
        reject(new Error("Timeout connessione LDAP"));
      }, 30000);
    });
  }

  /**
   * Estrae gli attributi utente dall'entry LDAP
   * @param {Object} entry - Entry LDAP
   * @returns {Object} Dati utente estratti
   */
  extractUserAttributes(entry) {
    const getAttribute = (attrName) => {
      if (entry.attributes && entry.attributes[attrName]) {
        const attr = entry.attributes[attrName];
        return attr.values ? attr.values : Array.isArray(attr) ? attr : [attr];
      }
      return null;
    };

    const getAttributeByName = (attrName) => {
      if (entry.attributes) {
        for (const [key, attr] of Object.entries(entry.attributes)) {
          if (attr.type === attrName) {
            return attr.values ? attr.values : [attr];
          }
        }
      }
      return null;
    };

    const sAMAccountName =
      getAttribute("sAMAccountName") || getAttributeByName("sAMAccountName");
    const cn = getAttribute("cn") || getAttributeByName("cn");
    const mail = getAttribute("mail") || getAttributeByName("mail");
    const displayName =
      getAttribute("displayName") || getAttributeByName("displayName");
    const userPrincipalName =
      getAttribute("userPrincipalName") ||
      getAttributeByName("userPrincipalName");
    const givenName =
      getAttribute("givenName") || getAttributeByName("givenName");
    const sn = getAttribute("sn") || getAttributeByName("sn");
    const memberOf = getAttribute("memberOf") || getAttributeByName("memberOf");

    return {
      username: sAMAccountName ? sAMAccountName[0] : null,
      email: mail ? mail[0] : userPrincipalName ? userPrincipalName[0] : null,
      displayName: displayName ? displayName[0] : cn ? cn[0] : null,
      givenName: givenName ? givenName[0] : null,
      surname: sn ? sn[0] : null,
      groups: memberOf || [],
      userPrincipalName: userPrincipalName ? userPrincipalName[0] : null,
    };
  }

  /**
   * Determina il ruolo utente basato sui gruppi LDAP
   * @param {Array} memberOf - Gruppi di appartenenza
   * @returns {string} Ruolo utente
   */
  determineUserRole(memberOf) {
    if (!memberOf || !Array.isArray(memberOf)) {
      return "user";
    }

    // Controlla se l'utente appartiene al gruppo admin
    const adminGroup = this.config.adminGroup;
    if (adminGroup && memberOf.some((group) => group.includes(adminGroup))) {
      return "admin";
    }

    // Controlla gruppi admin comuni
    const adminGroups = [
      "Domain Admins",
      "Enterprise Admins",
      "Pricing-Admins",
    ];
    if (
      memberOf.some((group) =>
        adminGroups.some((adminGroup) => group.includes(adminGroup))
      )
    ) {
      return "admin";
    }

    return "user";
  }
}

module.exports = LdapService;
