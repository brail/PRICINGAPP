#!/bin/bash

# ===========================================
# PRICING CALCULATOR v0.2 - Deploy Production
# ===========================================

set -e

echo "🚀 Deploy Pricing Calculator v0.2 in Produzione"
echo "================================================"

# Configurazione
SERVER="luke.febos.local"
APP_NAME="pricing-calculator"
APP_PATH="/opt/$APP_NAME"
NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifica connessione SSH
print_status "Verificando connessione SSH a $SERVER..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER "echo 'Connessione SSH OK'" > /dev/null 2>&1; then
    print_error "Impossibile connettersi a $SERVER via SSH"
    print_error "Assicurati che:"
    print_error "1. Il server sia raggiungibile"
    print_error "2. La chiave SSH sia configurata"
    print_error "3. Docker sia installato sul server"
    exit 1
fi
print_success "Connessione SSH verificata"

# Crea directory sul server
print_status "Creando directory $APP_PATH sul server..."
ssh $SERVER "sudo mkdir -p $APP_PATH && sudo chown \$(whoami):\$(whoami) $APP_PATH"

# Copia file sul server
print_status "Copiando file sul server..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'client/build' \
    --exclude 'server/logs' \
    --exclude '*.log' \
    ./ $SERVER:$APP_PATH/

# Build e deploy sul server
print_status "Building e deployando applicazione..."
ssh $SERVER "cd $APP_PATH && \
    echo '🐳 Building Docker images...' && \
    docker compose -f docker-compose.production.yml build && \
    echo '🛑 Fermando container esistenti...' && \
    docker compose -f docker-compose.production.yml down || true && \
    echo '🚀 Avviando applicazione...' && \
    docker compose -f docker-compose.production.yml up -d"

# Configura nginx
print_status "Configurando nginx..."
ssh $SERVER "sudo cp $APP_PATH/nginx/nginx-production.conf $NGINX_CONFIG && \
    sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/ && \
    sudo nginx -t && \
    sudo systemctl reload nginx"

# Verifica deploy
print_status "Verificando deploy..."
sleep 10

# Test health check
if curl -f -s "http://$SERVER/pricingapp/health" > /dev/null; then
    print_success "Health check OK"
else
    print_warning "Health check fallito, verificando logs..."
    ssh $SERVER "cd $APP_PATH && docker compose -f docker-compose.production.yml logs --tail=20"
fi

# Test API
if curl -f -s "http://$SERVER/pricingapp/api/health" > /dev/null; then
    print_success "API health check OK"
else
    print_warning "API health check fallito"
fi

# Mostra status finale
print_status "Status finale dei container:"
ssh $SERVER "cd $APP_PATH && docker compose -f docker-compose.production.yml ps"

echo ""
print_success "🎉 Deploy completato!"
echo ""
echo "📱 Applicazione disponibile su:"
echo "   Frontend: http://$SERVER/pricingapp"
echo "   API:      http://$SERVER/pricingapp/api"
echo "   Health:   http://$SERVER/pricingapp/health"
echo ""
echo "📊 Comandi utili:"
echo "   Logs:     ssh $SERVER 'cd $APP_PATH && docker compose -f docker-compose.production.yml logs -f'"
echo "   Status:   ssh $SERVER 'cd $APP_PATH && docker compose -f docker-compose.production.yml ps'"
echo "   Restart:  ssh $SERVER 'cd $APP_PATH && docker compose -f docker-compose.production.yml restart'"
echo "   Stop:     ssh $SERVER 'cd $APP_PATH && docker compose -f docker-compose.production.yml down'"
echo ""
