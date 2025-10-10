# Sicurezza Credenziali LDAP - Pricing Calculator v0.3.0

Questa guida descrive le best practices per proteggere le credenziali del service account LDAP.

## 🔐 **Problema di Sicurezza**

Le credenziali LDAP sono attualmente salvate in chiaro nel file `.env`:

```env
LDAP_BIND_DN=CN=ServiceAccount,OU=Service Accounts,DC=febos,DC=local
LDAP_BIND_PASSWORD=password_in_chiaro
```

**Rischi:**

- Credenziali visibili in caso di compromissione del server
- Password in chiaro nei log di sistema
- Accesso non autorizzato al dominio Active Directory

## 🛡️ **Soluzioni Implementate**

### **1. Crittografia delle Credenziali**

Il sistema supporta ora la crittografia delle credenziali LDAP usando AES-256-GCM:

```javascript
// Le credenziali vengono crittografate con la chiave JWT_SECRET
const encrypted = encryptionService.encryptLdapCredentials(
  bindDN,
  bindPassword
);
```

### **2. Script di Crittografia**

Usa lo script dedicato per crittografare le credenziali:

```bash
cd server
node scripts/encrypt-ldap-credentials.js
```

**Output:**

```
🔐 Crittografia Credenziali LDAP Service Account
================================================

Inserisci il Bind DN del service account: CN=ServiceAccount,OU=Service Accounts,DC=febos,DC=local
Inserisci la password del service account: ********

✅ Credenziali crittografate con successo!

📋 Aggiungi queste variabili al tuo file .env:
===============================================
LDAP_BIND_DN_ENCRYPTED='{"encrypted":"...","iv":"...","authTag":"..."}'
LDAP_BIND_PASSWORD_ENCRYPTED='{"encrypted":"...","iv":"...","authTag":"..."}'
```

### **3. Configurazione Sicura**

**File `.env` aggiornato:**

```env
# Rimuovi queste righe (non sicure):
# LDAP_BIND_DN=CN=ServiceAccount,OU=Service Accounts,DC=febos,DC=local
# LDAP_BIND_PASSWORD=password_in_chiaro

# Aggiungi queste righe (sicure):
LDAP_BIND_DN_ENCRYPTED='{"encrypted":"...","iv":"...","authTag":"..."}'
LDAP_BIND_PASSWORD_ENCRYPTED='{"encrypted":"...","iv":"...","authTag":"..."}'
```

## 🔄 **Compatibilità e Fallback**

Il sistema supporta entrambe le modalità:

1. **Credenziali crittografate** (priorità alta)
2. **Credenziali in chiaro** (fallback per sviluppo)

```javascript
// Il servizio LDAP prova prima le credenziali crittografate
if (process.env.LDAP_BIND_DN_ENCRYPTED) {
  // Usa credenziali crittografate
  const decrypted = this.encryptionService.decrypt(encryptedData);
} else {
  // Fallback a credenziali in chiaro
  return process.env.LDAP_BIND_DN;
}
```

## 🚀 **Procedura di Migrazione**

### **Passo 1: Crea un Service Account**

1. Apri **Active Directory Users and Computers**
2. Crea un nuovo utente in `OU=Service Accounts`
3. Assegna password complessa e non scadente
4. Concedi permessi di lettura LDAP

### **Passo 2: Crittografa le Credenziali**

```bash
cd server
node scripts/encrypt-ldap-credentials.js
```

### **Passo 3: Aggiorna il File .env**

```env
# Rimuovi
LDAP_BIND_DN=luca.bagante@febos.local
LDAP_BIND_PASSWORD=Roxafebos22?

# Aggiungi
LDAP_BIND_DN_ENCRYPTED='{"encrypted":"...","iv":"...","authTag":"..."}'
LDAP_BIND_PASSWORD_ENCRYPTED='{"encrypted":"...","iv":"...","authTag":"..."}'
```

### **Passo 4: Testa la Configurazione**

```bash
# Testa la connessione LDAP
node test-ldap-custom.js

# Avvia il server
npm run dev
```

## 🔒 **Best Practices di Sicurezza**

### **1. Gestione delle Chiavi**

- **JWT_SECRET** deve essere unico e sicuro
- Non condividere mai la chiave di crittografia
- Usa chiavi diverse per sviluppo/produzione

### **2. Permessi Service Account**

```powershell
# Esempio di permessi minimi per service account
dsacls "CN=ServiceAccount,OU=Service Accounts,DC=febos,DC=local" /G "DOMAIN\ServiceAccount:RP;user"
```

### **3. Monitoraggio**

- Monitora i log di autenticazione LDAP
- Allerta per tentativi di accesso non autorizzati
- Rotazione periodica delle credenziali

### **4. Backup Sicuro**

```bash
# Backup del file .env (senza credenziali in chiaro)
cp .env .env.backup
```

## 🚨 **Troubleshooting**

### **Errore: "Errore decrittografia Bind DN"**

**Causa:** JWT_SECRET diverso o credenziali corrotte

**Soluzione:**

1. Verifica che JWT_SECRET sia identico
2. Ricripta le credenziali con lo script
3. Controlla la sintassi JSON

### **Errore: "Credenziali non valide"**

**Causa:** Service account disabilitato o password scaduta

**Soluzione:**

1. Verifica lo stato del service account in AD
2. Controlla i permessi LDAP
3. Testa le credenziali con strumenti LDAP

## 📋 **Checklist di Sicurezza**

- [ ] Service account creato con password complessa
- [ ] Credenziali crittografate con script dedicato
- [ ] Variabili LDAP_BIND_DN/PASSWORD rimosse dal .env
- [ ] JWT_SECRET sicuro e unico
- [ ] File .env escluso dal controllo versione
- [ ] Test di connessione LDAP completato
- [ ] Log di autenticazione monitorati
- [ ] Backup sicuro delle configurazioni

## 🔗 **Riferimenti**

- [Active Directory Service Accounts Best Practices](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/manage/service-accounts)
- [LDAP Security Guidelines](https://ldap.com/ldap-security-guidelines/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
