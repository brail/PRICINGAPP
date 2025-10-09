# Changelog

Tutte le modifiche significative a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Principio 7 - Flexibility and Efficiency
- Principio 9 - Help Users Recognize Errors

### Changed

- Performance optimizations
- Advanced error handling

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
