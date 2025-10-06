#!/bin/bash

# 🚀 Script di Deploy v0.2 - Pricing Calculator
# Questo script crea un pacchetto completo per il deploy in produzione

set -e

echo "🚀 Inizio deploy Pricing Calculator v0.2..."

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verifica che siamo nella directory corretta
if [ ! -f "package.json" ]; then
    error "Esegui questo script dalla root del progetto"
fi

# Verifica che git sia pulito
if [ -n "$(git status --porcelain)" ]; then
    warning "Ci sono modifiche non committate. Vuoi continuare? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        error "Deploy annullato"
    fi
fi

# Crea directory temporanea per il build
BUILD_DIR="build-v0.2-$(date +%Y%m%d-%H%M%S)"
log "Creazione directory build: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copia tutti i file necessari
log "Copia file del progetto..."
cp -r client server nginx docker-compose.production.yml deploy-production.sh "$BUILD_DIR/"
cp README.md CHANGELOG.md "$BUILD_DIR/" 2>/dev/null || true

# Copia file di configurazione
log "Copia file di configurazione..."
cp -r docs "$BUILD_DIR/" 2>/dev/null || true

# Crea file di versione
echo "v0.2.0" > "$BUILD_DIR/VERSION"
echo "$(date)" > "$BUILD_DIR/BUILD_DATE"

# Build del client
log "Build del client React..."
cd client
npm ci --silent
npm run build
cd ..

# Copia il build del client
log "Copia build del client..."
cp -r client/build "$BUILD_DIR/client/"

# Installa dipendenze del server
log "Installazione dipendenze server..."
cd server
npm ci --silent --production
cd ..

# Crea archivio tar.gz
ARCHIVE_NAME="pricing-calculator-v0.2-$(date +%Y%m%d-%H%M%S).tar.gz"
log "Creazione archivio: $ARCHIVE_NAME"
tar -czf "$ARCHIVE_NAME" -C "$BUILD_DIR" .

# Pulisci directory temporanea
rm -rf "$BUILD_DIR"

# Calcola hash per verifica integrità
HASH=$(shasum -a 256 "$ARCHIVE_NAME" | cut -d' ' -f1)
echo "$HASH" > "${ARCHIVE_NAME}.sha256"

success "Deploy package creato: $ARCHIVE_NAME"
success "Hash SHA256: $HASH"

echo ""
echo "📦 Pacchetto pronto per il deploy!"
echo "   File: $ARCHIVE_NAME"
echo "   Hash: ${ARCHIVE_NAME}.sha256"
echo ""
echo "🔧 Per deploy in produzione:"
echo "   1. Trasferisci $ARCHIVE_NAME sul server"
echo "   2. Estrai: tar -xzf $ARCHIVE_NAME"
echo "   3. Verifica hash: shasum -a 256 -c ${ARCHIVE_NAME}.sha256"
echo "   4. Esegui: ./deploy-production.sh"
echo ""
echo "✅ Deploy package v0.2.0 completato!"
