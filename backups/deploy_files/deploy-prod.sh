#!/bin/bash

# ===========================================
# PRICING CALCULATOR v0.1 - Deploy Produzione
# ===========================================

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni di logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Variabili
APP_NAME="Pricing Calculator v0.1"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="backups"

# Opzioni
CLEAN_BUILD=false
SHOW_LOGS=false
SKIP_TESTS=false

# Parsing degli argomenti
for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            echo "Uso: $0 [opzioni]"
            echo "Opzioni:"
            echo "  --clean        Pulisce immagini e volumi Docker esistenti"
            echo "  --logs         Mostra i log dopo il deploy"
            echo "  --skip-tests   Salta i test di funzionalità"
            echo "  --help         Mostra questo messaggio di aiuto"
            exit 0
            ;;
        *)
            warn "Opzione sconosciuta: $arg"
            shift
            ;;
    esac
done

log "🚀 Avvio deploy di produzione $APP_NAME..."

# Verifica prerequisiti
log "Verifica prerequisiti..."

if ! command -v docker &> /dev/null; then
    error "Docker non è installato!"
fi

if ! docker compose version &> /dev/null; then
    error "Docker Compose non è installato!"
fi

# Verifica file di configurazione
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    error "File $DOCKER_COMPOSE_FILE non trovato!"
fi

log "✅ Prerequisiti verificati"

# Backup automatico
log "Creazione backup automatico..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pricing-calculator-prod-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.git --exclude=backups --exclude="*.log" . > /dev/null 2>&1
log "✅ Backup creato: $BACKUP_FILE"

# Pulisci container esistenti
log "Pulizia container esistenti..."
docker compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans || true

# Se richiesto, pulisci immagini e volumi
if [ "$CLEAN_BUILD" = true ]; then
    log "Pulizia immagini e volumi Docker..."
    docker rmi pricing-calculator-backend-prod pricing-calculator-frontend-prod 2>/dev/null || true
    docker volume rm pricing-calculator_backend_data_prod 2>/dev/null || true
fi

# Build e avvio dei servizi
log "Build e avvio dei servizi di produzione..."
docker compose -f "$DOCKER_COMPOSE_FILE" up --build -d

# Verifica lo stato dei servizi
log "Verifica stato dei servizi..."
docker compose -f "$DOCKER_COMPOSE_FILE" ps

# Attendi che i servizi siano healthy
log "Attesa che i servizi diventino healthy (max 180s)..."
docker compose -f "$DOCKER_COMPOSE_FILE" wait --timeout 180

if [ $? -eq 0 ]; then
    log "✅ Tutti i servizi sono healthy!"
else
    error "❌ Alcuni servizi non sono diventati healthy in tempo. Controlla i log."
fi

# Test di funzionalità (se non saltati)
if [ "$SKIP_TESTS" = false ]; then
    log "Esecuzione test di funzionalità..."
    
    # Test backend
    info "Test backend API..."
    if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
        log "✅ Backend API funzionante"
    else
        error "❌ Backend API non risponde"
    fi
    
    # Test frontend
    info "Test frontend..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "✅ Frontend funzionante"
    else
        error "❌ Frontend non risponde"
    fi
    
    log "✅ Tutti i test superati"
fi

# Mostra i log se richiesto
if [ "$SHOW_LOGS" = true ]; then
    log "Visualizzazione log in tempo reale (premi Ctrl+C per uscire)..."
    docker compose -f "$DOCKER_COMPOSE_FILE" logs -f
fi

# Informazioni finali
log "🎉 Deploy di produzione $APP_NAME completato con successo!"
echo ""
info "📋 Informazioni di accesso:"
info "   Frontend: http://localhost"
info "   Backend API: http://localhost:5001"
info "   Health Check Frontend: http://localhost/health"
info "   Health Check Backend: http://localhost:5001/api/health"
echo ""
info "📊 Comandi utili:"
info "   Visualizza log: docker compose -f $DOCKER_COMPOSE_FILE logs -f"
info "   Ferma servizi: docker compose -f $DOCKER_COMPOSE_FILE down"
info "   Riavvia servizi: docker compose -f $DOCKER_COMPOSE_FILE restart"
info "   Stato servizi: docker compose -f $DOCKER_COMPOSE_FILE ps"
echo ""
info "💾 Backup salvato in: $BACKUP_FILE"
