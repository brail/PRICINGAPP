# ===========================================
# PRICING CALCULATOR v0.1 - Frontend Dockerfile
# ===========================================

# Build stage
FROM node:18-alpine as build

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm ci

# Copia il codice sorgente
COPY . .

# Build dell'applicazione
RUN npm run build

# Production stage
FROM nginx:alpine

# Copia la build dallo stage precedente
COPY --from=build /app/build /usr/share/nginx/html

# Copia la configurazione nginx personalizzata
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Espone la porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Comando di avvio
CMD ["nginx", "-g", "daemon off;"]
