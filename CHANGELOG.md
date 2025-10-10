# Changelog

Tutte le modifiche significative a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-01-27

### Added

- **Sistema di Autenticazione Multi-Provider**

  - Supporto per Active Directory/LDAP con JIT provisioning
  - Integrazione Google OAuth2 per autenticazione social
  - Autenticazione locale limitata ai soli amministratori
  - Passport.js per gestione strategie di autenticazione
  - Mapping automatico ruoli da gruppi AD a ruoli applicazione

- **Just-in-Time (JIT) Provisioning**

  - Creazione automatica utenti al primo login con provider esterni
  - Sincronizzazione metadati da LDAP/Google
  - Gestione conflitti email esistenti
  - Audit trail completo per provisioning

- **UI Multi-Provider**

  - ProviderButton component per bottoni autenticazione
  - LoginForm aggiornato con selezione provider dinamica
  - AuthCallback component per gestione OAuth redirect
  - Design responsive per tutti i provider

- **Infrastruttura Testing**

  - Docker Compose per ambiente LDAP di test
  - Container OpenLDAP con utenti pre-configurati
  - phpLDAPadmin per gestione utenti test
  - Script di seeding automatico

- **Documentazione Completa**

  - Guida setup Google Cloud Console OAuth2
  - Documentazione architettura auth providers
  - Troubleshooting guide per problemi comuni
  - Esempi configurazione per tutti i provider

### Changed

- **Database Schema**

  - Aggiunte colonne `auth_provider`, `provider_user_id`, `provider_metadata`
  - Password ora opzionale per utenti esterni
  - Migration automatica per utenti esistenti

- **Sicurezza Rafforzata**

  - Solo admin possono usare autenticazione locale
  - Rate limiting su endpoint autenticazione
  - Audit logging per tutti i tentativi di login
  - Validazione provider abilitati

- **API Estese**

  - `GET /api/auth/providers` - Lista provider disponibili
  - `POST /api/auth/ldap` - Endpoint autenticazione LDAP
  - `GET /api/auth/google` - Redirect Google OAuth
  - `GET /api/auth/google/callback` - Callback OAuth

### Technical

- **Backend Dependencies**

  - `passport@^0.7.0` - Framework autenticazione
  - `passport-local@^1.0.0` - Strategy locale
  - `passport-ldapauth@^3.0.1` - Strategy LDAP
  - `passport-google-oauth20@^2.0.0` - Strategy Google
  - `express-session@^1.18.0` - Session management

- **Architettura**

  - Strategy Pattern per provider intercambiabili
  - Service Layer per logica business autenticazione
  - Middleware modulare per validazione provider
  - Context React esteso per multi-provider

### Breaking Changes

- **Autenticazione Locale**

  - Solo utenti admin possono usare login con password
  - Utenti esistenti mantengono accesso locale
  - Nuovi utenti devono usare provider esterni

- **Database Migration**

  - Richiesta migrazione schema per nuove colonne
  - Backup automatico prima della migrazione
  - Rollback supportato per emergenze

### Migration Guide

Per aggiornare da v0.2.0 a v0.3.0:

1. **Backup Database**
   ```bash
   cp server/data/pricing.db server/data/pricing.db.backup
   ```

2. **Install Dependencies**
   ```bash
   cd server && npm install
   ```

3. **Configure Environment**
   ```env
   ENABLE_LOCAL_AUTH=true
   ENABLE_LDAP_AUTH=false
   ENABLE_GOOGLE_AUTH=false
   ```

4. **Run Migration**
   ```bash
   node -e "require('./src/migrations/003_add_auth_providers').up(require('./database').db)"
   ```

5. **Test Authentication**
   ```bash
   curl http://localhost:5001/api/auth/providers
   ```

### Performance

- **Ottimizzazioni LDAP**
  - Connection pooling per connessioni LDAP
  - Caching metadati provider
  - Lazy loading provider

- **Bundle Size**
  - +45KB per dipendenze Passport
  - +12KB per componenti UI multi-provider
  - Tree shaking per import ottimizzati

## [0.2.0] - 2024-12-19

### Added

- **Help System integrato**

  - HelpPanel component con modal collassabile
  - 5 FAQ complete sui calcoli prezzi
  - 3 guide step-by-step (Primo Calcolo, Crea Template, Calcolo Batch)
  - Sezione "Inizia Qui" per nuovi utenti
  - Contatto supporto integrato
  - Design responsive ottimizzato per mobile

- **Design System standardizzato**

  - CustomButton component (risolve conflitti Material-UI)
  - Card, Form, Input, Modal, Alert components uniformi
  - Palette colori e spacing coerenti
  - Typography e shadows professionali
  - Mobile-first responsive design

- **Sistema di notifiche migliorato**
  - Toast notifications globali
  - Progress tracking per operazioni lunghe
  - Timeout handling per operazioni bloccate

### Changed

- **Terminologia standardizzata**

  - "Tools" → "Stampi" (terminologia italiana)
  - "Quality Control" → "Controllo Qualità"
  - "Retail Price" → "Prezzo vendita al dettaglio"
  - Etichette uniformi tra modalità di calcolo
  - BatchCalculator terminologia aggiornata

- **Ottimizzazione mobile**

  - HelpPanel responsive design (768px, 480px breakpoints)
  - Touch-friendly bottoni e accordion
  - Font sizes ottimizzati per mobile
  - Spacing e padding migliorati
  - Menu mobile pulito e funzionale

- **Navigazione migliorata**
  - Icona "Parametri" cambiata da Settings a Tune
  - Testo navigation in maiuscolo
  - Help button integrato nella toolbar

### Removed

- **Componenti di test rimossi**
  - ToastTestPanel.tsx eliminato
  - DesignSystemTest.tsx eliminato
  - Route /test-toast e /design-system-test rimosse
  - Menu desktop e mobile puliti

### Fixed

- **Conflitti Material-UI risolti**

  - CustomButton component per React Router
  - Navigation styling per AppBar
  - BatchCalculator button styles

- **Error handling migliorato**
  - BusinessErrorHandler sostituito con CompactErrorHandler
  - Gestione errori coerente in tutta l'applicazione
  - Toast notifications per feedback immediato

### Performance

- Bundle size ottimizzato (-59B, -519 lines nette)
- Import inutilizzati rimossi
- Build production pulita
- ESLint warnings minimizzati

## [0.1.0] - 2024-12-18

### Added

- **Applicazione base**

  - Calculator component per calcoli prezzi
  - Parameters component per gestione template
  - BatchCalculator per calcoli multipli
  - UserManagement per gestione utenti (admin)
  - Autenticazione JWT
  - Database SQLite3

- **Funzionalità core**
  - Calcolo bidirezionale (acquisto ↔ vendita)
  - Template prezzi salvabili
  - Calcolo batch con export Excel
  - Gestione utenti e ruoli
  - Responsive design base

### Technical

- React + TypeScript frontend
- Node.js + Express backend
- SQLite3 database
- Docker containerization
- CI/CD con GitHub Actions

---

## Versioning Strategy

Questo progetto utilizza [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes, API incompatibili
- **MINOR** (0.1.0): Nuove funzionalità, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Branch Strategy

- **main**: Branch principale, sempre stabile e deployabile
- **develop**: Branch di sviluppo per integrazione feature
- **feature/\***: Branch per nuove funzionalità
- **hotfix/\***: Branch per fix urgenti

### Release Process

1. Sviluppo su branch feature
2. Pull Request → develop
3. Merge develop → main
4. Tag della versione
5. GitHub Release automatico
6. Deploy in produzione
