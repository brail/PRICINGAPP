# Pricing Calculator v0.3.0 - Multi-Provider Authentication

🎉 **Nuova versione con supporto per Active Directory, LDAP e Google OAuth2!**

## 🚀 Novità Principali

### ✨ Sistema di Autenticazione Multi-Provider
- **Active Directory/LDAP** - Integrazione completa con infrastruttura aziendale
- **Google OAuth2** - Login rapido con account Google
- **Local Auth** - Solo per amministratori (sicurezza rafforzata)
- **Just-in-Time Provisioning** - Creazione automatica utenti al primo login

### 🔒 Sicurezza Migliorata
- Solo amministratori possono usare autenticazione locale
- Rate limiting su endpoint di autenticazione
- Audit logging completo per tutti i tentativi di login
- Mapping automatico ruoli da gruppi AD

### 🎨 UI Modernizzata
- Bottoni provider dinamici e responsive
- Gestione automatica callback OAuth
- Design system aggiornato per multi-provider
- Feedback utente migliorato

## 🛠️ Quick Start

### 1. Installazione Dipendenze

```bash
# Backend
cd server && npm install

# Frontend (se necessario)
cd client && npm install
```

### 2. Configurazione Ambiente

Copia il file di configurazione:

```bash
cp server/.env.example server/.env
```

Configura i provider desiderati:

```env
# Abilita provider (almeno uno deve essere true)
ENABLE_LOCAL_AUTH=true
ENABLE_LDAP_AUTH=false
ENABLE_GOOGLE_AUTH=false

# Per LDAP (opzionale)
LDAP_URL=ldap://your-ad-server:389
LDAP_BIND_DN=cn=service-account,ou=services,dc=company,dc=com
LDAP_BIND_CREDENTIALS=your-service-password
LDAP_SEARCH_BASE=dc=company,dc=com

# Per Google OAuth (opzionale)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

### 3. Avvio Applicazione

```bash
# Sviluppo
npm run dev

# O separatamente
npm run server  # Backend su porta 5001
npm run client  # Frontend su porta 3000
```

### 4. Test Autenticazione

```bash
# Test automatico di tutti i provider
node scripts/test-auth-providers.js

# Test manuale
curl http://localhost:5001/api/auth/providers
```

## 🐳 Testing con Docker

Per testare LDAP senza configurare un server AD:

```bash
# Avvia ambiente di test completo
docker-compose -f docker-compose.testing.yml up

# Accedi a phpLDAPadmin
open http://localhost:8080
# Login: cn=admin,dc=pricing,dc=test / admin123

# Test utenti LDAP
# - admin / admin123 (ruolo: admin)
# - testuser / test123 (ruolo: user)
# - demouser / demo123 (ruolo: demo)
```

## 📚 Configurazione Provider

### Active Directory/LDAP

1. **Configura variabili ambiente**:
   ```env
   ENABLE_LDAP_AUTH=true
   LDAP_URL=ldap://your-ad-server:389
   LDAP_BIND_DN=cn=service-account,ou=services,dc=company,dc=com
   LDAP_BIND_CREDENTIALS=your-service-password
   LDAP_SEARCH_BASE=dc=company,dc=com
   LDAP_SEARCH_FILTER=(sAMAccountName={{username}})
   ```

2. **Mapping ruoli** (automatico):
   - `Domain Admins` → `admin`
   - `Pricing-Admins` → `admin`
   - `Pricing-Demo` → `demo`
   - Altri gruppi → `user`

3. **Test connessione**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/ldap \
     -H "Content-Type: application/json" \
     -d '{"username":"your-username","password":"your-password"}'
   ```

### Google OAuth2

1. **Crea progetto Google Cloud**:
   - Vai su [Google Cloud Console](https://console.cloud.google.com/)
   - Crea nuovo progetto
   - Abilita Google+ API
   - Configura OAuth consent screen

2. **Crea credenziali OAuth2**:
   - Vai su "APIs & Services" > "Credentials"
   - Crea "OAuth 2.0 Client ID"
   - Aggiungi redirect URI: `http://localhost:5001/api/auth/google/callback`

3. **Configura ambiente**:
   ```env
   ENABLE_GOOGLE_AUTH=true
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
   ```

4. **Test OAuth**:
   ```bash
   # Apri nel browser
   open http://localhost:5001/api/auth/google
   ```

## 🔧 Troubleshooting

### Problemi Comuni

#### LDAP Connection Failed
```bash
# Verifica connessione
telnet your-ldap-server 389

# Test configurazione
node -e "
const ldap = require('ldapjs');
const client = ldap.createClient({url: 'ldap://your-server:389'});
client.bind('your-bind-dn', 'your-password', (err) => {
  console.log(err ? 'Failed' : 'Success');
  process.exit(0);
});
"
```

#### Google OAuth Error
- Verifica `GOOGLE_CALLBACK_URL` in Google Cloud Console
- Controlla che l'app sia pubblicata o l'utente sia in test users
- Verifica che Client ID e Secret siano corretti

#### Provider Not Available
```bash
# Verifica provider disponibili
curl http://localhost:5001/api/auth/providers

# Controlla log server
tail -f server/logs/combined.log
```

### Debug Mode

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📖 Documentazione Completa

- **[Auth Providers Guide](docs/AUTH_PROVIDERS.md)** - Architettura e configurazione completa
- **[Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)** - Guida dettagliata Google Cloud
- **[Changelog](CHANGELOG.md)** - Tutte le modifiche v0.3.0

## 🔄 Migration da v0.2.0

### 1. Backup Database
```bash
cp server/data/pricing.db server/data/pricing.db.backup
```

### 2. Install Dependencies
```bash
cd server && npm install
```

### 3. Run Migration
```bash
node -e "
const { db } = require('./database');
const migration = require('./src/migrations/003_add_auth_providers');
migration.up(db).then(() => {
  console.log('Migration completed');
  process.exit(0);
});
"
```

### 4. Configure Environment
```env
ENABLE_LOCAL_AUTH=true
ENABLE_LDAP_AUTH=false
ENABLE_GOOGLE_AUTH=false
```

### 5. Test
```bash
node scripts/test-auth-providers.js
```

## 🎯 Prossimi Passi

1. **Configura provider esterni** (LDAP/Google) per il tuo ambiente
2. **Testa autenticazione** con utenti reali
3. **Configura mapping ruoli** personalizzato se necessario
4. **Monitora log** per audit e troubleshooting
5. **Deploy in produzione** con configurazione sicura

## 🆘 Supporto

- **Documentazione**: `docs/` directory
- **Test Script**: `scripts/test-auth-providers.js`
- **Docker Testing**: `docker-compose.testing.yml`
- **Logs**: `server/logs/` directory

---

**Versione**: 0.3.0  
**Data**: 27 Gennaio 2025  
**Breaking Changes**: Sì - vedi [Changelog](CHANGELOG.md) per dettagli
