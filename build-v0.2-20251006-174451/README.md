# 🚀 Pricing Calculator v0.2

<div align="center">
  <h3>Calcolatrice Prezzi Avanzata</h3>
  <p>Applicazione web completa per il calcolo dei prezzi con sistema multi-utente e funzionalità avanzate</p>
  
  ![Version](https://img.shields.io/badge/version-0.2.0--dev-blue.svg)
  ![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
  ![React](https://img.shields.io/badge/react-18.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
  ![Status](https://img.shields.io/badge/status-development-orange.svg)
</div>

---

## ✨ Funzionalità

- **🔄 Calcolo bidirezionale**: Prezzo acquisto ↔ Prezzo vendita
- **👥 Sistema multi-utente**: Autenticazione JWT con ruoli (Admin/User)
- **📊 Gestione parametri**: Set di configurazione personalizzabili
- **🌍 Supporto multivaluta**: Calcoli in diverse valute
- **📱 UI moderna**: Material-UI con design responsive
- **🔐 Sicurezza avanzata**: JWT, bcrypt, logging strutturato
- **🐳 Deploy Docker**: Configurazione completa per produzione

## 🏗️ Architettura

```
PRICINGAPP/
├── server/                 # Backend Node.js/Express
│   ├── index.js           # Server principale
│   ├── database.js        # Gestione database SQLite
│   ├── package.json       # Dipendenze backend
│   └── env.example        # Configurazione ambiente
├── client/                # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/    # Componenti React
│   │   ├── services/      # Servizi API
│   │   ├── types/         # Tipi TypeScript
│   │   └── ...
│   ├── package.json       # Dipendenze frontend
│   └── env.example        # Configurazione ambiente
├── docker/                # Configurazioni Docker
├── package.json           # Script principali
└── README.md             # Documentazione
```

## 🚀 Quick Start

### **Installazione**

```bash
git clone <repository-url>
cd PRICINGAPP
npm run install-all
```

### **Configurazione**

```bash
cp server/env.example server/.env
cp client/env.example client/.env
```

### **Avvio**

```bash
npm run dev
```

**URLs**:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`
- Health Check: `http://localhost:5001/api/health`

### **Deploy Docker**

```bash
docker-compose up -d
```

## 📚 Documentazione Completa

Per informazioni dettagliate su:

- **Configurazione avanzata**
- **API Reference**
- **Deploy in produzione**
- **Troubleshooting**
- **Architettura**

👉 **[Vai alla Documentazione Completa](./docs/README.md)**

## 🔄 Script Disponibili

```bash
npm run dev              # Sviluppo locale
npm run dev:network      # Sviluppo con accesso rete
npm run build            # Build produzione
npm run install-all      # Installa dipendenze
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:5001/api/health

# Test frontend
cd client && npm test
```

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'feat: add amazing feature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 📞 Supporto

- **Issues**: GitHub Issues
- **Documentazione**: `/docs/`
- **Logs**: `server/logs/`

---

<div align="center">
  <p>Realizzato con ❤️ dal team Pricing Calculator</p>
  <p>Versione 0.2.0-dev - 2025</p>
</div>
