# Configurazione Google OAuth2 per Pricing Calculator v0.3.0

Questa guida ti aiuterà a configurare l'autenticazione Google OAuth2 per l'applicazione Pricing Calculator.

## Prerequisiti

- Account Google con accesso a Google Cloud Console
- Dominio verificato (opzionale, ma raccomandato per produzione)

## Passo 1: Creare un Progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Clicca su "Select a project" in alto
3. Clicca su "New Project"
4. Inserisci:
   - **Nome progetto**: `pricing-calculator-auth`
   - **Organizzazione**: (se applicabile)
5. Clicca "Create"

## Passo 2: Abilitare Google+ API

1. Nel menu laterale, vai su "APIs & Services" > "Library"
2. Cerca "Google+ API"
3. Clicca su "Google+ API" e poi "Enable"

## Passo 3: Configurare OAuth Consent Screen

1. Vai su "APIs & Services" > "OAuth consent screen"
2. Scegli "External" (per utenti esterni) o "Internal" (solo per la tua organizzazione)
3. Compila i campi obbligatori:
   - **App name**: `Pricing Calculator`
   - **User support email**: La tua email
   - **Developer contact information**: La tua email
4. Clicca "Save and Continue"
5. Nella sezione "Scopes", clicca "Add or Remove Scopes"
6. Aggiungi questi scope:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
7. Clicca "Update" e poi "Save and Continue"
8. Nella sezione "Test users" (se hai scelto External), aggiungi le email di test
9. Clicca "Save and Continue"

## Passo 4: Creare Credenziali OAuth 2.0

1. Vai su "APIs & Services" > "Credentials"
2. Clicca "Create Credentials" > "OAuth 2.0 Client IDs"
3. Scegli "Web application"
4. Inserisci:
   - **Name**: `Pricing Calculator Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (per development)
     - `https://yourdomain.com` (per production)
   - **Authorized redirect URIs**:
     - `http://localhost:5001/api/auth/google/callback` (per development)
     - `https://yourdomain.com/api/auth/google/callback` (per production)
5. Clicca "Create"
6. **IMPORTANTE**: Copia il **Client ID** e **Client Secret** - li userai nella configurazione

## Passo 5: Configurare l'Applicazione

### File .env

Aggiungi queste variabili al tuo file `.env`:

```env
# Google OAuth Configuration
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

### Per Produzione

```env
# Google OAuth Configuration (Production)
ENABLE_GOOGLE_AUTH=true
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

## Passo 6: Testare la Configurazione

1. Avvia l'applicazione:
   ```bash
   npm run dev
   ```

2. Vai su `http://localhost:3000/login`

3. Dovresti vedere un bottone "Login with Google"

4. Clicca il bottone e verifica che:
   - Vieni reindirizzato a Google
   - Puoi fare login con il tuo account Google
   - Vieni reindirizzato indietro all'applicazione
   - Sei autenticato correttamente

## Troubleshooting

### Errore: "redirect_uri_mismatch"

- Verifica che l'URI di redirect nel file `.env` corrisponda esattamente a quello configurato in Google Cloud Console
- Assicurati che non ci siano spazi extra o caratteri speciali

### Errore: "access_denied"

- Verifica che l'applicazione sia pubblicata o che l'utente sia nella lista dei test users
- Controlla che gli scope richiesti siano configurati correttamente

### Errore: "invalid_client"

- Verifica che Client ID e Client Secret siano corretti
- Assicurati che le credenziali siano per il progetto giusto

### L'applicazione non si avvia

- Verifica che tutte le dipendenze siano installate:
  ```bash
  cd server && npm install
  ```
- Controlla i log del server per errori specifici

## Sicurezza

### Per Produzione

1. **Usa HTTPS**: Google OAuth richiede HTTPS in produzione
2. **Rotazione delle chiavi**: Cambia periodicamente Client Secret
3. **Limitare domini**: Configura solo i domini autorizzati
4. **Monitoraggio**: Abilita logging e monitoraggio in Google Cloud Console

### Best Practices

- Non committare mai Client Secret nel codice
- Usa variabili d'ambiente per tutte le configurazioni sensibili
- Implementa rate limiting per prevenire abusi
- Logga tutti i tentativi di autenticazione per audit

## Configurazione Avanzata

### Personalizzazione Scopes

Se hai bisogno di accesso a più dati Google, puoi aggiungere scope aggiuntivi:

```javascript
// In passport.js
passport.use('google', new GoogleStrategy({
  // ... altre configurazioni
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly']
}));
```

### Mapping Ruoli Personalizzato

Puoi personalizzare come vengono assegnati i ruoli agli utenti Google:

```javascript
// In authService.js
mapGoogleUserToRole(googleProfile) {
  const email = googleProfile.emails[0].value;
  
  // Esempio: admin se email termina con @company.com
  if (email.endsWith('@company.com')) {
    return 'admin';
  }
  
  return 'user';
}
```

## Supporto

Per problemi specifici:

1. Controlla i log dell'applicazione
2. Verifica la configurazione in Google Cloud Console
3. Consulta la [documentazione ufficiale Google OAuth2](https://developers.google.com/identity/protocols/oauth2)
4. Apri una issue nel repository del progetto
