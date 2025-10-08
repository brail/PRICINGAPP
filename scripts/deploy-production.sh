#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Starting Production Deployment..."

# Configuration
COMPOSE_FILE="docker-compose.prod-optimized.yml"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root"
   exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Create backup directory
log_info "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup current database
if [ -f "./server/pricing.db" ]; then
    log_info "Backing up database..."
    cp ./server/pricing.db "$BACKUP_DIR/pricing.db"
fi

# Backup current logs
if [ -d "./server/logs" ]; then
    log_info "Backing up logs..."
    cp -r ./server/logs "$BACKUP_DIR/logs"
fi

# Check environment file
if [ ! -f "$ENV_FILE" ]; then
    log_warn "Environment file $ENV_FILE not found, using example..."
    if [ -f "env.production.example" ]; then
        cp env.production.example "$ENV_FILE"
        log_warn "Please update $ENV_FILE with your production values"
    else
        log_error "No environment file found"
        exit 1
    fi
fi

# Pull latest images
log_info "Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull

# Build images
log_info "Building images..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Start services
log_info "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 30

# Check service health
log_info "Checking service health..."

# Check backend health
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    log_info "✅ Backend is healthy"
else
    log_error "❌ Backend health check failed"
    exit 1
fi

# Check frontend health
if curl -f http://localhost/health > /dev/null 2>&1; then
    log_info "✅ Frontend is healthy"
else
    log_error "❌ Frontend health check failed"
    exit 1
fi

# Check nginx health
if curl -f http://localhost/pricingapp/health > /dev/null 2>&1; then
    log_info "✅ Nginx is healthy"
else
    log_error "❌ Nginx health check failed"
    exit 1
fi

# Show running containers
log_info "Running containers:"
docker-compose -f "$COMPOSE_FILE" ps

# Show logs
log_info "Recent logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

log_info "🎉 Production deployment completed successfully!"
log_info "Backup created at: $BACKUP_DIR"
log_info "Application is available at: http://localhost"

# Optional: Clean up old images
read -p "Do you want to clean up old Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cleaning up old images..."
    docker image prune -f
fi

log_info "Deployment script completed!"
