# 📝 Changelog

Tutte le modifiche significative a questo progetto saranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e questo progetto aderisce a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0-dev] - 2025-10-02

### 🧹 **Pulizia e Ottimizzazione**

#### **Aggiunto**

- Sistema di logging strutturato con Winston
- Logging per autenticazione, calcoli e errori
- Gestione graceful shutdown del server
- Documentazione completa in `/docs/`
- Changelog per tracciare le modifiche

#### **Modificato**

- Aggiornato server da v0.1 a v0.2
- Sostituiti tutti i `console.log` con logging strutturato
- Riorganizzata la documentazione
- Ottimizzato README principale
- Aggiornato .gitignore per escludere file di log

#### **Rimosso**

- File backup `UserDashboard.tsx.backup`
- Dipendenze non utilizzate: `date-fns`, `framer-motion`, `recharts`
- Console.log residui nel codice

#### **Sicurezza**

- Logging strutturato per audit trail
- Gestione errori centralizzata
- File di log esclusi dal version control

### 🔧 **Miglioramenti Tecnici**

#### **Backend**

- Implementato sistema di logging con Winston
- Logging per tutte le operazioni di autenticazione
- Logging per calcoli prezzi con parametri
- Gestione errori strutturata
- Logs separati per errori e informazioni generali

#### **Frontend**

- Rimosse dipendenze non utilizzate
- Bundle size ridotto
- Codice più pulito e ottimizzato

#### **Documentazione**

- Creata directory `/docs/` per documentazione completa
- README principale semplificato e aggiornato
- Documentazione dettagliata per sviluppatori
- Guida troubleshooting completa

### 📊 **Metriche**

#### **Bundle Size**

- Riduzione ~40MB di dipendenze non utilizzate
- Bundle frontend più leggero
- Tempo di installazione ridotto

#### **Logging**

- Logs strutturati in JSON
- Rotazione automatica dei file di log
- Livelli di log configurabili
- Audit trail completo per sicurezza

---

## [0.1.0] - 2024

### 🚀 **Release Iniziale**

#### **Aggiunto**

- Calcolo prezzi bidirezionale
- Sistema di autenticazione base
- Gestione parametri
- Supporto multivaluta
- Interfaccia utente responsive
- Deploy Docker
- Documentazione base

---

## 📋 **Legenda**

- 🧹 **Pulizia e Ottimizzazione**: Miglioramenti al codice e alla struttura
- 🔧 **Miglioramenti Tecnici**: Modifiche tecniche e architetturali
- 🚀 **Nuove Funzionalità**: Funzionalità completamente nuove
- 🐛 **Bug Fix**: Correzioni di bug
- 🔒 **Sicurezza**: Miglioramenti di sicurezza
- 📊 **Performance**: Ottimizzazioni di performance
- 📚 **Documentazione**: Aggiornamenti alla documentazione
- 🧪 **Testing**: Miglioramenti ai test
