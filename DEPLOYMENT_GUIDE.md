# 🚀 Pricing Calculator v0.2 - Deployment Guide

## 📋 **REQUISITI DI SISTEMA**

- **OS**: Linux (Ubuntu/Debian)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **RAM**: Minimo 2GB
- **Spazio**: Minimo 5GB liberi

## 🔧 **CONFIGURAZIONE SERVER**

### 1. **Directory di Produzione**
```bash
# Directory principale
/opt/docker/pricingapp_data/
├── database/     # Database SQLite
├── logs/         # Log dell'applicazione
└── static/       # File statici del frontend
```

### 2. **Permessi Directory**
```bash
sudo mkdir -p /opt/docker/pricingapp_data/{database,logs,static}
sudo chown -R $USER:$USER /opt/docker/pricingapp_data/
```

## 🚀 **PROCESSO DI DEPLOY**

### **Metodo Automatico (Raccomandato)**

```bash
# 1. Clona/aggiorna il repository
cd /home/brail/PRICINGAPP
git pull origin master

# 2. Esegui lo script di deploy
./deploy-production.sh
```

### **Metodo Manuale**

```bash
# 1. Ferma tutto
docker compose -f docker-compose.production.yml down

# 2. Pulisci tutto
docker system prune -a -f
sudo rm -rf /opt/docker/pricingapp_data

# 3. Ricostruisci
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d
```

## 📁 **STRUTTURA FILE CRITICI**

### **File di Configurazione**
- `deploy-production.sh` - Script di deploy automatico
- `docker-compose.production.yml` - Configurazione Docker
- `nginx/nginx-production.conf` - Configurazione Nginx

### **File .env (Creati automaticamente)**
- `client/.env.production` - Configurazione frontend
- `server/.env.production` - Configurazione backend

## 🔍 **VERIFICA DEPLOY**

### **Health Checks**
```bash
# Stato container
docker compose -f docker-compose.production.yml ps

# Log applicazione
docker compose -f docker-compose.production.yml logs -f

# Test API
curl http://localhost/pricingapp/api/health
```

### **URL di Accesso**
- **Frontend**: `http://luke.febos.local/pricingapp/`
- **API**: `http://luke.febos.local/pricingapp/api/`

## 🔑 **CREDENZIALI DEFAULT**

- **Admin**: `admin` / `admin123`
- **Demo**: `demo` / `demo123`

## 🛠️ **TROUBLESHOOTING**

### **Problemi Comuni**

1. **Container non si avviano**
   ```bash
   docker logs pricing-calculator-backend
   docker logs pricing-calculator-frontend
   docker logs pricing-calculator-nginx
   ```

2. **File statici non caricati**
   ```bash
   # Verifica che i file siano presenti
   docker exec pricing-calculator-frontend ls -la /usr/share/nginx/html/static/
   ```

3. **Errori CORS**
   - Verifica che `REACT_APP_API_URL=http://backend:5001/api`
   - Ricostruisci il frontend: `docker compose -f docker-compose.production.yml build --no-cache frontend`

4. **Database non accessibile**
   ```bash
   # Verifica permessi directory
   ls -la /opt/docker/pricingapp_data/database/
   ```

### **Reset Completo**
```bash
# Ferma tutto
docker compose -f docker-compose.production.yml down

# Rimuovi tutto
docker system prune -a -f
sudo rm -rf /opt/docker/pricingapp_data

# Riparti da zero
./deploy-production.sh
```

## 📊 **MONITORAGGIO**

### **Log Files**
- **Backend**: `/opt/docker/pricingapp_data/logs/`
- **Nginx**: `docker logs pricing-calculator-nginx`

### **Database**
- **File**: `/opt/docker/pricingapp_data/database/pricing.db`
- **Backup**: Copia il file `.db` per backup

## 🔄 **AGGIORNAMENTI**

### **Deploy Nuova Versione**
```bash
# 1. Aggiorna codice
git pull origin master

# 2. Ricostruisci solo se necessario
docker compose -f docker-compose.production.yml build --no-cache

# 3. Riavvia servizi
docker compose -f docker-compose.production.yml up -d
```

### **Rollback**
```bash
# Torna alla versione precedente
git checkout <commit-hash>
./deploy-production.sh
```

## ⚠️ **NOTE IMPORTANTI**

1. **Comunicazione Container**: Frontend → `backend:5001/api` (non localhost!)
2. **File Statici**: Serviti da Nginx, non dal container frontend
3. **Volumi Persistenti**: Database e log sono persistenti
4. **Health Checks**: Verificano automaticamente lo stato dei servizi

## 🆘 **SUPPORTO**

In caso di problemi:
1. Controlla i log: `docker compose -f docker-compose.production.yml logs`
2. Verifica lo stato: `docker compose -f docker-compose.production.yml ps`
3. Reset completo se necessario: `./deploy-production.sh`

---
**Ultimo aggiornamento**: 2025-10-09
**Versione**: v0.2.0
