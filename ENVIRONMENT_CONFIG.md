# 🔧 Environment Configuration Guide

## 📋 **VARIABILI D'AMBIENTE CRITICHE**

### **Frontend (.env.production)**
```bash
REACT_APP_API_URL=http://backend:5001/api  # ⚠️ CRITICO: backend:5001, non localhost!
PUBLIC_URL=/pricingapp                      # ⚠️ CRITICO: per i file statici
HOST=0.0.0.0                               # Per accesso da rete
```

### **Backend (.env.production)**
```bash
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
DATABASE_PATH=./pricing.db
FRONTEND_URL=http://luke.febos.local/pricingapp
ALLOWED_ORIGINS=http://luke.febos.local
JWT_SECRET=pricing-calculator-jwt-secret-2025-production
JWT_REFRESH_SECRET=pricing-calculator-refresh-secret-2025-production
LOG_LEVEL=info
```

## 🚨 **ERRORI COMUNI E SOLUZIONI**

### **1. CORS Errors**
**Sintomo**: `Access to XMLHttpRequest at 'http://localhost:5001/api' has been blocked by CORS policy`

**Causa**: Frontend chiama `localhost:5001` invece di `backend:5001`

**Soluzione**:
```bash
# Verifica che REACT_APP_API_URL sia corretto
docker exec pricing-calculator-frontend env | grep REACT_APP_API_URL
# Dovrebbe mostrare: REACT_APP_API_URL=http://backend:5001/api

# Se non corretto, ricostruisci il frontend
docker compose -f docker-compose.production.yml build --no-cache frontend
```

### **2. File Statici 404**
**Sintomo**: `GET http://luke.febos.local/static/js/main.xxx.js 404 (Not Found)`

**Causa**: Nginx non trova i file statici

**Soluzione**:
```bash
# Verifica che i file siano presenti nel container frontend
docker exec pricing-calculator-frontend ls -la /usr/share/nginx/html/static/

# Se vuoti, ricostruisci il frontend
docker compose -f docker-compose.production.yml build --no-cache frontend
```

### **3. Database Read-Only**
**Sintomo**: `SQLITE_READONLY: attempt to write a readonly database`

**Causa**: Permessi directory database

**Soluzione**:
```bash
# Verifica permessi
ls -la /opt/docker/pricingapp_data/database/

# Correggi permessi
sudo chown -R $USER:$USER /opt/docker/pricingapp_data/
```

## 🔍 **VERIFICA CONFIGURAZIONE**

### **Test Comunicazione Container**
```bash
# Test API dal container frontend
docker exec pricing-calculator-frontend curl http://backend:5001/api/health

# Test file statici
curl http://luke.febos.local/static/js/main.*.js
```

### **Verifica Variabili d'Ambiente**
```bash
# Frontend
docker exec pricing-calculator-frontend env | grep REACT_APP

# Backend
docker exec pricing-calculator-backend env | grep NODE_ENV
```

## 📊 **ARCHITETTURA CORRETTA**

```
Browser → Nginx (porta 80) → Frontend Container
                ↓
         Backend Container (porta 5001)
                ↓
         Database SQLite
```

**Flusso Corretto**:
1. Browser → `http://luke.febos.local/pricingapp/`
2. Nginx → Frontend Container
3. Frontend → `http://backend:5001/api/` (comunicazione interna)
4. Backend → Database SQLite

## ⚠️ **CHECKLIST PRE-DEPLOY**

- [ ] File `deploy-production.sh` eseguibile
- [ ] Directory `/opt/docker/pricingapp_data/` creata
- [ ] Permessi directory corretti
- [ ] Repository aggiornato (`git pull origin master`)
- [ ] Nessun container in esecuzione
- [ ] Cache Docker pulita

## 🚀 **COMANDI RAPIDI**

```bash
# Deploy completo
./deploy-production.sh

# Reset completo
docker system prune -a -f && sudo rm -rf /opt/docker/pricingapp_data && ./deploy-production.sh

# Solo ricostruzione frontend
docker compose -f docker-compose.production.yml build --no-cache frontend

# Solo ricostruzione backend
docker compose -f docker-compose.production.yml build --no-cache backend

# Log in tempo reale
docker compose -f docker-compose.production.yml logs -f

# Stato servizi
docker compose -f docker-compose.production.yml ps
```

---
**Nota**: Questa configurazione è stata testata e funzionante per Pricing Calculator v0.2.0
