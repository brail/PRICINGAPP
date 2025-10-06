# ===========================================
# PRICING CALCULATOR v0.1 - Backend Dockerfile
# ===========================================

FROM node:18-alpine

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm ci --only=production

# Copia il codice sorgente
COPY . .

# Crea un utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs
RUN adduser -S pricing -u 1001

# Crea directory per il database e imposta i permessi
RUN mkdir -p /app/data && chown -R pricing:nodejs /app

# Cambia all'utente non-root
USER pricing

# Espone la porta
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando di avvio
CMD ["node", "index.js"]
