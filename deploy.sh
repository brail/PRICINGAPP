#!/bin/bash

# ===========================================
# PRICING CALCULATOR v0.1 - Deploy Script
# ===========================================

set -e

echo "🚀 Avvio deploy Pricing Calculator v0.1..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verifica Docker
if ! command -v docker &> /dev/null; then
    error "Docker non è installato!"
fi

if ! docker compose version &> /dev/null; then
    error "Docker Compose non è installato!"
fi

# Pulisci container esistenti
log "Pulizia container esistenti..."
docker compose down --remove-orphans || true

# Rimuovi immagini esistenti (opzionale)
if [ "$1" = "--clean" ]; then
    log "Rimozione immagini esistenti..."
    docker compose down --rmi all --volumes --remove-orphans || true
fi

# Build e avvio
log "Build e avvio dei servizi..."
docker compose up --build -d

# Attendi che i servizi siano pronti
log "Attesa avvio servizi..."
sleep 30

# Verifica health check
log "Verifica health check..."

# Backend
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    log "✅ Backend: OK"
else
    warn "⚠️  Backend: Health check fallito"
fi

# Frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    log "✅ Frontend: OK"
else
    warn "⚠️  Frontend: Health check fallito"
fi

# Mostra status
log "Status dei container:"
docker compose ps

log "🎉 Deploy completato!"
log "📍 Frontend: http://localhost"
log "📍 Backend API: http://localhost:5001"
log "📍 Health Check: http://localhost/health"

# Mostra logs se richiesto
if [ "$2" = "--logs" ]; then
    log "Mostrando logs..."
    docker compose logs -f
fi