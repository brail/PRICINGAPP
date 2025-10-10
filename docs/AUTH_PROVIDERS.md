# Sistema di Autenticazione Multi-Provider v0.3.0

Questa documentazione descrive il sistema di autenticazione multi-provider implementato in Pricing Calculator v0.3.0.

## Panoramica

Il sistema supporta tre tipi di autenticazione:

1. **Local Auth** - Solo per amministratori (password nel database)
2. **LDAP/Active Directory** - Autenticazione aziendale
3. **Google OAuth2** - Autenticazione social

## Architettura

### Pattern Utilizzato
- **Passport.js** per gestione strategie di autenticazione
- **Just-in-Time (JIT) Provisioning** per utenti esterni
- **Strategy Pattern** per provider intercambiabili

### Componenti Principali

#### Backend
- `server/src/config/passport.js` - Configurazione Passport
- `server/src/services/authService.js` - Logica business autenticazione
- `server/src/models/User.js` - Modello utente esteso
- `server/src/routes/auth.js` - Endpoint API

#### Frontend
- `client/src/contexts/AuthContext.tsx` - Context React per auth
- `client/src/components/auth/LoginForm.tsx` - Form login multi-provider
- `client/src/components/auth/ProviderButton.tsx` - Bottoni provider
- `client/src/components/auth/AuthCallback.tsx` - Gestione callback OAuth

## Configurazione

### Variabili d'Ambiente

```env
# Provider Configuration
ENABLE_LOCAL_AUTH=true
ENABLE_LDAP_AUTH=false
ENABLE_GOOGLE_AUTH=false

# LDAP Configuration
LDAP_URL=ldap://localhost:389
LDAP_BIND_DN=cn=admin,dc=example,dc=com
LDAP_BIND_CREDENTIALS=admin_password
LDAP_SEARCH_BASE=dc=example,dc=com
LDAP_SEARCH_FILTER=(uid={{username}})

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

### Database Schema

```sql
-- Nuove colonne aggiunte alla tabella users
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';
ALTER TABLE users ADD COLUMN provider_user_id TEXT;
ALTER TABLE users ADD COLUMN provider_metadata TEXT;
```

## Provider di Autenticazione

### 1. Local Auth (Admin Only)

**Uso**: Solo per amministratori di sistema
**Configurazione**: `ENABLE_LOCAL_AUTH=true`
**Endpoint**: `POST /api/auth/login`

```javascript
// Esempio di login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});
```

**Sicurezza**:
- Solo utenti con `role='admin'` e `auth_provider='local'` possono usare questo metodo
- Password hashate con bcrypt
- Rate limiting applicato

### 2. LDAP/Active Directory

**Uso**: Autenticazione aziendale
**Configurazione**: `ENABLE_LDAP_AUTH=true`
**Endpoint**: `POST /api/auth/ldap`

```javascript
// Esempio di login LDAP
const response = await fetch('/api/auth/ldap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john.doe',
    password: 'password123'
  })
});
```

**Mapping Ruoli**:
- `Domain Admins` → `admin`
- `Pricing-Admins` → `admin`
- `Pricing-Demo` → `demo`
- Altri gruppi → `user`

**JIT Provisioning**:
- Utente creato automaticamente al primo login
- Metadati LDAP salvati in `provider_metadata`
- Gruppi AD mappati ai ruoli applicazione

### 3. Google OAuth2

**Uso**: Autenticazione social
**Configurazione**: `ENABLE_GOOGLE_AUTH=true`
**Endpoint**: `GET /api/auth/google`

```javascript
// Redirect a Google
window.location.href = '/api/auth/google';

// Callback gestito automaticamente
// Redirect a: /auth/callback?tokens=...
```

**Flusso OAuth**:
1. Utente clicca "Login with Google"
2. Redirect a Google OAuth
3. Google reindirizza a `/api/auth/google/callback`
4. Server genera JWT e reindirizza al frontend
5. Frontend gestisce token e autentica utente

## API Endpoints

### Autenticazione

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login locale (admin) |
| POST | `/api/auth/ldap` | Login LDAP |
| GET | `/api/auth/google` | Redirect Google OAuth |
| GET | `/api/auth/google/callback` | Callback Google OAuth |
| GET | `/api/auth/providers` | Lista provider disponibili |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/me` | Profilo utente corrente |

### Gestione Utenti (Admin)

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/auth/users` | Lista utenti |
| PUT | `/api/auth/users/:id` | Aggiorna utente |
| DELETE | `/api/auth/users/:id` | Elimina utente |
| PUT | `/api/auth/me/password` | Cambia password |

## JIT Provisioning

### Come Funziona

1. **Primo Login**: Utente esterno fa login con provider
2. **Verifica Esistenza**: Sistema cerca utente per `provider_user_id`
3. **Creazione Automatica**: Se non esiste, crea nuovo utente
4. **Mapping Ruoli**: Assegna ruolo basato su gruppi/metadati
5. **Salvataggio Metadati**: Salva informazioni provider in `provider_metadata`

### Esempio LDAP

```javascript
// Dati ricevuti da LDAP
const ldapUser = {
  uid: 'john.doe',
  mail: 'john.doe@company.com',
  memberOf: ['CN=Pricing-Admins,OU=Groups,DC=company,DC=com']
};

// Utente creato automaticamente
const localUser = {
  id: 123,
  username: 'john.doe',
  email: 'john.doe@company.com',
  role: 'admin', // Mappato da Pricing-Admins
  auth_provider: 'ldap',
  provider_user_id: 'john.doe',
  provider_metadata: JSON.stringify({
    ldapGroups: ['CN=Pricing-Admins,OU=Groups,DC=company,DC=com'],
    lastLdapSync: '2025-01-27T10:30:00Z'
  })
};
```

## Sicurezza

### Best Practices Implementate

1. **Validazione Provider**: Solo provider configurati sono accessibili
2. **Rate Limiting**: Limite tentativi login per IP
3. **Audit Logging**: Tutti i tentativi di login sono loggati
4. **JWT Security**: Token con scadenza breve (15 min) + refresh token
5. **Password Policy**: Solo per local auth, hashate con bcrypt
6. **CORS**: Configurazione restrittiva per origini consentite

### Logging e Monitoring

```javascript
// Esempi di log generati
loggers.auth.info('Authentication successful', {
  username: 'john.doe',
  provider: 'ldap',
  role: 'admin',
  ip: '192.168.1.100'
});

loggers.auth.warn('Authentication failed', {
  username: 'invalid.user',
  provider: 'ldap',
  reason: 'Invalid credentials',
  ip: '192.168.1.100'
});
```

## Troubleshooting

### Problemi Comuni

#### 1. LDAP Connection Failed
```
Error: LDAP connection failed
```
**Soluzioni**:
- Verifica `LDAP_URL` sia raggiungibile
- Controlla `LDAP_BIND_DN` e `LDAP_BIND_CREDENTIALS`
- Verifica firewall e porte (389/636)

#### 2. Google OAuth Error
```
Error: redirect_uri_mismatch
```
**Soluzioni**:
- Verifica `GOOGLE_CALLBACK_URL` in Google Cloud Console
- Controlla che corrisponda esattamente alla configurazione
- Assicurati che l'app sia pubblicata o l'utente sia in test users

#### 3. JIT Provisioning Failed
```
Error: Failed to create user from provider
```
**Soluzioni**:
- Verifica che il database abbia le colonne necessarie
- Controlla i permessi di scrittura database
- Verifica che email/username non siano già esistenti

#### 4. Provider Not Available
```
Error: Provider not enabled
```
**Soluzioni**:
- Verifica variabili d'ambiente `ENABLE_*_AUTH`
- Controlla configurazione provider
- Verifica dipendenze installate

### Debug Mode

Abilita debug per logging dettagliato:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Test Provider

Usa il container Docker per test LDAP:

```bash
# Avvia ambiente di test
docker-compose -f docker-compose.testing.yml up

# Test LDAP
curl -X POST http://localhost:5001/api/auth/ldap \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

## Aggiungere Nuovi Provider

### 1. Installare Dipendenza

```bash
npm install passport-new-provider
```

### 2. Configurare Strategy

```javascript
// server/src/config/passport.js
passport.use('new-provider', new NewProviderStrategy({
  // configurazione provider
}, async (req, profile, done) => {
  // logica autenticazione
}));
```

### 3. Aggiungere Endpoint

```javascript
// server/src/routes/auth.js
router.post("/new-provider", passport.authenticate('new-provider', { session: false }));
```

### 4. Aggiornare Frontend

```javascript
// client/src/contexts/AuthContext.tsx
const loginWithNewProvider = async (credentials) => {
  // logica login
};
```

### 5. Configurare Environment

```env
ENABLE_NEW_PROVIDER_AUTH=true
NEW_PROVIDER_CLIENT_ID=your_client_id
NEW_PROVIDER_CLIENT_SECRET=your_client_secret
```

## Migration da v0.2.0

### 1. Backup Database

```bash
cp server/data/pricing.db server/data/pricing.db.backup
```

### 2. Eseguire Migration

```bash
cd server
node -e "
const { db } = require('./database');
const migration = require('./src/migrations/003_add_auth_providers');
migration.up(db).then(() => {
  console.log('Migration completed');
  process.exit(0);
});
"
```

### 3. Aggiornare Configurazione

```env
# Aggiungere nuove variabili
ENABLE_LOCAL_AUTH=true
ENABLE_LDAP_AUTH=false
ENABLE_GOOGLE_AUTH=false
```

### 4. Test Funzionalità

```bash
# Test login admin esistente
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test provider disponibili
curl http://localhost:5001/api/auth/providers
```

## Performance e Scalabilità

### Ottimizzazioni Implementate

1. **Connection Pooling**: Per connessioni LDAP
2. **Caching**: Metadati provider in memoria
3. **Lazy Loading**: Provider caricati solo quando necessari
4. **Async Operations**: Tutte le operazioni I/O sono asincrone

### Metriche da Monitorare

- Tempo di risposta per provider
- Tasso di successo autenticazione
- Numero di JIT provisioning
- Errori per provider

### Scaling Considerations

- **Load Balancer**: Configurare sticky sessions per OAuth
- **Database**: Considerare replica read per query utenti
- **LDAP**: Usare multiple istanze per alta disponibilità
- **Caching**: Implementare Redis per sessioni e metadati

## Supporto e Contributi

Per problemi o domande:

1. Controlla questa documentazione
2. Verifica i log dell'applicazione
3. Apri una issue nel repository
4. Consulta la documentazione Passport.js

---

**Versione**: 0.3.0  
**Ultimo aggiornamento**: 27 Gennaio 2025  
**Autore**: Pricing Calculator Team
