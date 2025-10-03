# 📚 Pricing Calculator v0.2 - Documentazione

## 📋 **Indice**

- [Panoramica](#panoramica)
- [Installazione](#installazione)
- [Configurazione](#configurazione)
- [Sviluppo](#sviluppo)
- [Deploy](#deploy)
- [API](#api)
- [Architettura](#architettura)
- [Troubleshooting](#troubleshooting)

---

## 🎯 **Panoramica**

Pricing Calculator v0.2 è un'applicazione web completa per il calcolo dei prezzi con funzionalità avanzate:

### **Funzionalità Core**

- ✅ **Calcolo bidirezionale**: Prezzo acquisto ↔ Prezzo vendita
- ✅ **Sistema multi-utente**: Autenticazione JWT con ruoli (Admin/User)
- ✅ **Gestione parametri**: Set di configurazione personalizzabili
- ✅ **Supporto multivaluta**: Calcoli in diverse valute
- ✅ **UI moderna**: Material-UI con design responsive

### **Stack Tecnologico**

- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Node.js + Express + SQLite
- **Autenticazione**: JWT + bcrypt
- **Logging**: Winston (strutturato)
- **Deploy**: Docker + nginx

---

## 🚀 **Installazione**

### **Prerequisiti**

- Node.js >= 16.0.0
- npm >= 8.0.0
- Docker (opzionale)

### **Setup Locale**

```bash
# Clona il repository
git clone <repository-url>
cd PRICINGAPP

# Installa dipendenze
npm run install-all

# Configura ambiente
cp server/env.example server/.env
cp client/env.example client/.env

# Avvia in sviluppo
npm run dev
```

### **Setup con Docker**

```bash
# Build e avvio
docker-compose up -d

# Logs
docker-compose logs -f
```

---

## ⚙️ **Configurazione**

### **Variabili d'Ambiente**

#### **Server (.env)**

```env
NODE_ENV=development
PORT=5001
HOST=0.0.0.0
DATABASE_PATH=./pricing.db
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
LOG_LEVEL=info
```

#### **Client (.env)**

```env
REACT_APP_API_URL=http://localhost:5001/api
HOST=0.0.0.0
```

### **Configurazione Produzione**

```env
NODE_ENV=production
PORT=80
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
REACT_APP_API_URL=https://yourdomain.com/api
```

---

## 🛠️ **Sviluppo**

### **Script Disponibili**

```bash
# Sviluppo
npm run dev              # Avvia backend + frontend
npm run dev:network      # Avvia con accesso di rete
npm run server           # Solo backend
npm run client           # Solo frontend

# Build
npm run build            # Build frontend per produzione
npm run install-all      # Installa tutte le dipendenze
```

### **Struttura Progetto**

```
PRICINGAPP/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componenti React
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/             # File pubblici
├── server/                 # Backend Node.js
│   ├── routes/             # Route API
│   ├── models/             # Modelli database
│   ├── middleware/         # Middleware Express
│   ├── utils/              # Utility functions
│   └── logs/               # File di log
├── docs/                   # Documentazione
└── docker-compose.yml      # Configurazione Docker
```

### **Convenzioni Codice**

- **Naming**: camelCase per variabili, PascalCase per componenti
- **Git**: Conventional commits
- **Logging**: Winston con livelli strutturati
- **Errori**: Gestione centralizzata con logging

---

## 🐳 **Deploy**

### **Deploy Locale**

```bash
# Script automatico
./deploy.sh

# Manuale
docker-compose -f docker-compose.prod.yml up -d
```

### **Deploy Produzione**

```bash
# Script produzione
./deploy-prod.sh

# Configurazione nginx
cp nginx/nginx.conf /etc/nginx/sites-available/
```

### **Health Checks**

- **Backend**: `GET /api/health`
- **Frontend**: Accessibile su porta 3000
- **Database**: SQLite automatico

---

## 📡 **API**

### **Autenticazione**

```bash
POST /api/auth/login        # Login utente
POST /api/auth/register     # Registrazione utente
POST /api/auth/refresh      # Refresh token
GET  /api/auth/me          # Profilo utente
PUT  /api/auth/me          # Aggiorna profilo
```

### **Calcoli**

```bash
POST /api/calculate-selling   # Calcola prezzo vendita
POST /api/calculate-purchase  # Calcola prezzo acquisto
GET  /api/params             # Ottieni parametri
PUT  /api/params             # Aggiorna parametri
```

### **Gestione Utenti (Admin)**

```bash
GET    /api/auth/users       # Lista utenti
PUT    /api/auth/users/:id   # Aggiorna utente
DELETE /api/auth/users/:id   # Elimina utente
```

### **Utility**

```bash
GET /api/health             # Health check
GET /api/exchange-rates     # Tassi di cambio
```

---

## 🏗️ **Architettura**

### **Frontend**

- **React 18**: Hooks, Context API, Router
- **Material-UI**: Componenti UI moderni
- **TypeScript**: Type safety
- **Axios**: HTTP client

### **Backend**

- **Express.js**: Framework web
- **SQLite**: Database embedded
- **JWT**: Autenticazione stateless
- **Winston**: Logging strutturato

### **Sicurezza**

- **CORS**: Configurazione dinamica
- **JWT**: Token con refresh
- **bcrypt**: Hash password
- **Rate Limiting**: (da implementare)

---

## 🔧 **Troubleshooting**

### **Problemi Comuni**

#### **Server non si avvia**

```bash
# Verifica porta
lsof -i :5001

# Verifica database
ls -la server/pricing.db

# Logs dettagliati
tail -f server/logs/combined.log
```

#### **Frontend non si connette**

```bash
# Verifica API URL
echo $REACT_APP_API_URL

# Verifica CORS
curl -H "Origin: http://localhost:3000" http://localhost:5001/api/health
```

#### **Errori di autenticazione**

```bash
# Verifica JWT secret
echo $JWT_SECRET

# Verifica token
jwt decode <token>
```

### **Logs**

```bash
# Logs server
tail -f server/logs/combined.log

# Logs errori
tail -f server/logs/error.log

# Logs Docker
docker-compose logs -f
```

---

## 📞 **Supporto**

- **Issues**: GitHub Issues
- **Documentazione**: `/docs/`
- **Logs**: `server/logs/`
- **Health Check**: `/api/health`

---

**Versione**: 0.2.0-dev  
**Ultimo Aggiornamento**: Ottobre 2025  
**Team**: Pricing Calculator Development
