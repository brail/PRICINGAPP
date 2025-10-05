# 🚀 Istruzioni Deploy Produzione

## 📋 **Prerequisiti Server**

Assicurati che il server `luke.febos.local` abbia:

- ✅ **Docker** installato e funzionante
- ✅ **Docker Compose** installato (versione moderna)
- ✅ **Nginx** installato e configurato
- ✅ **Accesso SSH** configurato
- ✅ **Porta 80** disponibile

## 🔧 **Verifica Prerequisiti**

```bash
# Connettiti al server
ssh luke.febos.local

# Verifica Docker
docker --version
docker compose version

# Verifica Nginx
nginx -v
systemctl status nginx
```

## 📁 **Deploy Automatico**

### **Opzione 1: Script Automatico (Raccomandato)**

```bash
# Dal tuo computer locale
cd /Users/brail/code/cursor/PRICINGAPP
./deploy-production.sh
```

### **Opzione 2: Deploy Manuale**

#### **Step 1: Copia File sul Server**

```bash
# Crea directory
ssh luke.febos.local "sudo mkdir -p /opt/pricing-calculator && sudo chown \$(whoami):\$(whoami) /opt/pricing-calculator"

# Copia file (escludendo node_modules e cache)
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'client/build' \
    --exclude 'server/logs' \
    --exclude '*.log' \
    ./ luke.febos.local:/opt/pricing-calculator/
```

#### **Step 2: Build e Deploy**

```bash
# Connettiti al server
ssh luke.febos.local

# Vai nella directory
cd /opt/pricing-calculator

# Build delle immagini
docker compose -f docker-compose.production.yml build

# Ferma container esistenti (se presenti)
docker compose -f docker-compose.production.yml down || true

# Avvia applicazione
docker compose -f docker-compose.production.yml up -d
```

#### **Step 3: Configura Nginx**

```bash
# Copia configurazione nginx
sudo cp /opt/pricing-calculator/nginx/nginx-production.conf /etc/nginx/sites-available/pricing-calculator

# Abilita sito
sudo ln -sf /etc/nginx/sites-available/pricing-calculator /etc/nginx/sites-enabled/

# Test configurazione
sudo nginx -t

# Riavvia nginx
sudo systemctl reload nginx
```

## 🧪 **Verifica Deploy**

### **Test Health Check**

```bash
# Health check nginx
curl http://luke.febos.local/pricingapp/health

# Health check API
curl http://luke.febos.local/pricingapp/api/health
```

### **Test Applicazione**

```bash
# Test calcolo
curl -X POST http://luke.febos.local/pricingapp/api/calculate-selling \
  -H "Content-Type: application/json" \
  -d '{"purchasePrice": 100}'
```

## 📊 **Gestione Applicazione**

### **Comandi Utili**

```bash
# Status container
docker compose -f docker-compose.production.yml ps

# Logs in tempo reale
docker compose -f docker-compose.production.yml logs -f

# Logs specifici
docker compose -f docker-compose.production.yml logs backend
docker compose -f docker-compose.production.yml logs frontend
docker compose -f docker-compose.production.yml logs nginx

# Riavvia servizi
docker compose -f docker-compose.production.yml restart

# Ferma applicazione
docker compose -f docker-compose.production.yml down

# Aggiorna applicazione
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

### **Monitoraggio**

```bash
# Uso risorse
docker stats

# Spazio disco
df -h

# Logs sistema
journalctl -u nginx -f
```

## 🔧 **Troubleshooting**

### **Problemi Comuni**

#### **Container non si avvia**

```bash
# Verifica logs
docker compose -f docker-compose.production.yml logs

# Verifica configurazione
docker compose -f docker-compose.production.yml config
```

#### **Nginx non funziona**

```bash
# Test configurazione
sudo nginx -t

# Verifica porte
sudo netstat -tlnp | grep :80

# Riavvia nginx
sudo systemctl restart nginx
```

#### **API non risponde**

```bash
# Verifica container backend
docker compose -f docker-compose.production.yml ps backend

# Test connessione interna
docker compose -f docker-compose.production.yml exec backend curl localhost:5001/api/health
```

## 📱 **URLs Finali**

- **Frontend**: http://luke.febos.local/pricingapp
- **API**: http://luke.febos.local/pricingapp/api
- **Health Check**: http://luke.febos.local/pricingapp/health

## 🔒 **Sicurezza**

### **Raccomandazioni**

1. **Cambia JWT Secret** in produzione
2. **Configura SSL** con Let's Encrypt
3. **Limita accessi** con firewall
4. **Backup regolari** del database
5. **Monitoraggio** con log rotation

### **SSL Setup (Opzionale)**

```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato
sudo certbot --nginx -d luke.febos.local

# Auto-renewal
sudo crontab -e
# Aggiungi: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

**Deploy completato!** 🎉

L'applicazione sarà disponibile su http://luke.febos.local/pricingapp
