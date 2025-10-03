# 🐳 Docker Deployment - Pricing Calculator v0.1

## 📋 Panoramica

Questa guida descrive come deployare l'applicazione Pricing Calculator v0.1 usando Docker e Docker Compose.

## 🏗️ Architettura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│    Frontend     │    │    Backend      │
│   (Port 8080)   │    │   (Port 80)     │    │   (Port 5001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Deploy Rapido

### Metodo 1: Script Automatico

```bash
# Deploy base
./deploy.sh

# Deploy con pulizia completa
./deploy.sh --clean

# Deploy con logs
./deploy.sh --logs
```

### Metodo 2: Docker Compose Manuale

```bash
# Build e avvio
docker-compose up --build -d

# Verifica status
docker-compose ps

# Visualizza logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🔧 Configurazione

### Variabili d'Ambiente

Le variabili sono configurate nel `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=5001
  - HOST=0.0.0.0
  - ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:80,http://127.0.0.1:80
```

### Volumi

- `backend_data`: Database SQLite persistente
- Configurazioni nginx montate come read-only

## 🌐 Accesso

Dopo il deploy:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost/health

## 🔍 Health Checks

### Backend

```bash
curl http://localhost:5001/api/health
```

### Frontend

```bash
curl http://localhost/health
```

## 📊 Monitoraggio

### Logs

```bash
# Tutti i servizi
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Status Container

```bash
docker-compose ps
```

### Utilizzo Risorse

```bash
docker stats
```

## 🛠️ Sviluppo

### Modalità Sviluppo

```bash
# Avvia solo il backend
docker-compose up backend

# Avvia con rebuild
docker-compose up --build backend
```

### Debug

```bash
# Accesso al container backend
docker-compose exec backend sh

# Accesso al container frontend
docker-compose exec frontend sh
```

## 🔒 Sicurezza

### Headers di Sicurezza

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Utente Non-Root

I container backend e frontend girano con utenti non-root per maggiore sicurezza.

## 📁 Struttura File

```
PRICINGAPP/
├── docker-compose.yml          # Configurazione principale
├── deploy.sh                   # Script di deploy
├── nginx/
│   └── nginx.conf             # Configurazione reverse proxy
├── server/
│   ├── Dockerfile             # Build backend
│   └── .dockerignore          # File da escludere
└── client/
    ├── Dockerfile             # Build frontend
    ├── nginx.conf             # Configurazione nginx frontend
    └── .dockerignore          # File da escludere
```

## 🚨 Troubleshooting

### Porta Occupata

```bash
# Trova processo che usa la porta
lsof -i :80
lsof -i :5001

# Termina processo
kill -9 <PID>
```

### Container Non Si Avvia

```bash
# Verifica logs
docker-compose logs <service_name>

# Rebuild completo
docker-compose down --rmi all --volumes
docker-compose up --build
```

### Database Corrotto

```bash
# Rimuovi volume database
docker-compose down -v
docker volume rm pricingapp_backend_data
docker-compose up --build
```

## 📈 Produzione

### Reverse Proxy Nginx

Per produzione, usa il profilo nginx:

```bash
docker-compose --profile production up -d
```

Questo avvia anche nginx come reverse proxy sulla porta 8080.

### SSL/HTTPS

Per HTTPS, modifica `nginx/nginx.conf` e aggiungi certificati SSL.

## 🔄 Aggiornamenti

### Deploy Nuova Versione

```bash
# Pull ultime modifiche
git pull

# Rebuild e restart
./deploy.sh --clean
```

### Backup Database

```bash
# Backup volume
docker run --rm -v pricingapp_backend_data:/data -v $(pwd):/backup alpine tar czf /backup/database-backup.tar.gz -C /data .
```

## 📞 Supporto

Per problemi o domande:

1. Verifica i logs: `docker-compose logs -f`
2. Controlla health checks
3. Verifica configurazione variabili d'ambiente
4. Consulta questa documentazione
