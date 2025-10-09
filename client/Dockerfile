# Multi-stage build per frontend React
FROM node:18-alpine AS builder

# Installa dipendenze di build
RUN apk add --no-cache python3 make g++

# Imposta directory di lavoro
WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --silent

# Copia sorgenti (solo dalla directory client)
COPY . .

# Build dell'applicazione
RUN npm run build

# Stage di produzione
FROM nginx:alpine

# Installa dumb-init per gestione segnali
RUN apk add --no-cache dumb-init

# Copia build dell'applicazione
COPY --from=builder /app/build /usr/share/nginx/html

# Copia configurazione Nginx ottimizzata per Docker
COPY nginx-docker.conf /etc/nginx/nginx.conf

# Crea directory necessarie con permessi corretti
RUN mkdir -p /var/log/nginx /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /tmp && \
    chmod 755 /tmp && \
    chmod 755 /var/log/nginx && \
    chmod 755 /var/cache/nginx

# Esponi porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Usa dumb-init per gestione segnali
ENTRYPOINT ["dumb-init", "--"]

# Avvia Nginx
CMD ["nginx", "-g", "daemon off;"]
