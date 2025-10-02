# Pricing Calculator v0.1

<div align="center">
  <h3>🚀 Calcolatrice Prezzi Avanzata</h3>
  <p>Applicazione web completa per il calcolo dei prezzi con funzionalità bidirezionali e supporto multivaluta</p>
  
  ![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
  ![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
  ![React](https://img.shields.io/badge/react-18.0.0-blue.svg)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
</div>

---

## ✨ Funzionalità

- **🔄 Calcolo bidirezionale**: Calcola il prezzo di vendita dal prezzo di acquisto e viceversa
- **📊 Gestione margine**: Modifica il margine e aggiorna automaticamente i calcoli
- **🌍 Supporto multivaluta**: Calcoli in diverse valute con tassi di cambio aggiornati
- **📱 Interfaccia responsive**: Design minimale e ottimizzato per tutti i dispositivi
- **⚙️ Pagina impostazioni**: Configurazione parametri di calcolo (margine, IVA, spedizione)
- **💾 Gestione set di parametri**: Salva e carica diverse configurazioni di calcolo
- **🔧 Configurazione dinamica**: Supporto per variabili d'ambiente e deploy in produzione

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

## 🚀 Installazione e Avvio

### Prerequisiti

- Node.js >= 16.0.0
- npm >= 8.0.0

### 1. Clona il repository

```bash
git clone <repository-url>
cd PRICINGAPP
```

### 2. Installa le dipendenze

```bash
npm run install-all
```

### 3. Configura l'ambiente

```bash
# Copia i file di configurazione
cp server/env.example server/.env
cp client/env.example client/.env

# Modifica le configurazioni se necessario
nano server/.env
nano client/.env
```

### 4. Avvia l'applicazione

#### Sviluppo locale

```bash
npm run dev
```

#### Sviluppo con accesso di rete

```bash
npm run dev:network
```

Questo comando avvierà:

- **Backend** su `http://localhost:5001`
- **Frontend** su `http://localhost:3000`

## 🔧 Configurazione

### Variabili d'Ambiente

#### Server (.env)

```env
NODE_ENV=development
PORT=5001
HOST=0.0.0.0
DATABASE_PATH=./pricing.db
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Client (.env)

```env
REACT_APP_API_URL=http://localhost:5001/api
HOST=0.0.0.0
```

### Configurazione Produzione

Per il deploy in produzione, modifica le variabili d'ambiente:

```env
NODE_ENV=production
PORT=80
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
REACT_APP_API_URL=https://yourdomain.com/api
```

## 📡 API Endpoints

### Backend (Porta 5001)

#### Parametri

- `GET /api/params` - Ottieni parametri attuali
- `PUT /api/params` - Aggiorna parametri

#### Calcoli

- `POST /api/calculate-selling` - Calcola prezzo di vendita
- `POST /api/calculate-purchase` - Calcola prezzo di acquisto

#### Set di Parametri

- `GET /api/parameter-sets` - Lista set di parametri
- `POST /api/parameter-sets` - Crea nuovo set
- `PUT /api/parameter-sets/:id` - Aggiorna set
- `DELETE /api/parameter-sets/:id` - Elimina set
- `POST /api/parameter-sets/:id/set-default` - Imposta come default

#### Utility

- `GET /api/health` - Health check
- `GET /api/exchange-rates` - Tassi di cambio

## 🐳 Deploy con Docker

### Build e avvio

```bash
# Build delle immagini
docker-compose build

# Avvio dei servizi
docker-compose up -d

# Visualizza logs
docker-compose logs -f
```

### Configurazione Docker

Il progetto include:

- `Dockerfile` per backend e frontend
- `docker-compose.yml` per orchestrazione
- Configurazione nginx per reverse proxy

## 🧪 Testing

### Test API

```bash
# Health check
curl http://localhost:5001/api/health

# Test connessione
curl http://localhost:5001/api/test-connection
```

### Test Frontend

```bash
# Avvia in modalità test
npm run test
```

## 📊 Monitoraggio

### Health Check

- **Backend**: `GET /api/health`
- **Frontend**: Accessibile su porta 3000

### Logs

I logs sono disponibili in console durante lo sviluppo e nei container Docker in produzione.

## 🔄 Script Disponibili

- `npm run dev` - Avvia backend e frontend in modalità sviluppo
- `npm run dev:network` - Avvia con accesso di rete
- `npm run server` - Avvia solo il backend
- `npm run client` - Avvia solo il frontend
- `npm run build` - Compila il frontend per la produzione
- `npm run install-all` - Installa tutte le dipendenze

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 📞 Supporto

Per supporto e domande:

- Apri una issue su GitHub
- Contatta il team di sviluppo

---

<div align="center">
  <p>Realizzato con ❤️ dal team Pricing Calculator</p>
  <p>Versione 0.1.0 - 2024</p>
</div>
