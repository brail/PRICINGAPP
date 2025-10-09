#!/bin/bash

# ===========================================
# PRICING CALCULATOR v0.2 - DEPLOY PRODUCTION
# ===========================================

set -e  # Exit on any error

echo "🚀 Starting Pricing Calculator v0.2 Production Deploy..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="luke.febos.local"
API_PORT="5001"
FRONTEND_PORT="80"
DATABASE_PATH="/opt/docker/pricingapp_data/database"
LOGS_PATH="/opt/docker/pricingapp_data/logs"
STATIC_PATH="/opt/docker/pricingapp_data/static"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  API Port: $API_PORT"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  Database Path: $DATABASE_PATH"
echo "  Logs Path: $LOGS_PATH"
echo "  Static Path: $STATIC_PATH"
echo ""

# Create production environment files
echo -e "${YELLOW}📝 Creating production environment files...${NC}"

# Frontend environment
cat > client/.env.production << EOF
REACT_APP_API_URL=http://backend:5001/api
PUBLIC_URL=/pricingapp
HOST=0.0.0.0
EOF

# Backend environment
cat > server/.env.production << EOF
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
DATABASE_PATH=./pricing.db
FRONTEND_URL=http://$DOMAIN/pricingapp
ALLOWED_ORIGINS=http://$DOMAIN
JWT_SECRET=pricing-calculator-jwt-secret-2025-production
JWT_REFRESH_SECRET=pricing-calculator-refresh-secret-2025-production
LOG_LEVEL=info
EOF

echo -e "${GREEN}✅ Environment files created${NC}"

# Create directories for persistent volumes
echo -e "${YELLOW}📁 Creating persistent volume directories...${NC}"
sudo mkdir -p $DATABASE_PATH $LOGS_PATH $STATIC_PATH
sudo chown -R $USER:$USER $DATABASE_PATH $LOGS_PATH $STATIC_PATH
echo -e "${GREEN}✅ Directories created${NC}"

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose -f docker-compose.production.yml down || true

# Remove old images to force rebuild
echo -e "${YELLOW}🗑️ Removing old images...${NC}"
docker rmi pricingapp-frontend pricingapp-backend || true

# Build and start services
echo -e "${YELLOW}🔨 Building and starting services...${NC}"
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check if containers are running
if docker ps | grep -q "pricing-calculator-nginx"; then
    echo -e "${GREEN}✅ Nginx container is running${NC}"
else
    echo -e "${RED}❌ Nginx container is not running${NC}"
    exit 1
fi

if docker ps | grep -q "pricing-calculator-backend"; then
    echo -e "${GREEN}✅ Backend container is running${NC}"
else
    echo -e "${RED}❌ Backend container is not running${NC}"
    exit 1
fi

if docker ps | grep -q "pricing-calculator-frontend"; then
    echo -e "${GREEN}✅ Frontend container is running${NC}"
else
    echo -e "${RED}❌ Frontend container is not running${NC}"
    exit 1
fi

# Test API connectivity
echo -e "${YELLOW}🔗 Testing API connectivity...${NC}"
if curl -s http://localhost/pricingapp/ > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
fi

# Test static files
echo -e "${YELLOW}📄 Testing static files...${NC}"
if curl -s http://localhost/static/js/main.*.js > /dev/null; then
    echo -e "${GREEN}✅ Static files are accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Static files may not be accessible (this is normal if not built yet)${NC}"
fi

# Final status
echo -e "${BLUE}📊 Final Status:${NC}"
docker compose -f docker-compose.production.yml ps

echo ""
echo -e "${GREEN}🎉 Deploy completed successfully!${NC}"
echo -e "${BLUE}🌐 Application URL: http://$DOMAIN/pricingapp/${NC}"
echo -e "${BLUE}🔑 Default credentials:${NC}"
echo -e "${BLUE}   Admin: admin / admin123${NC}"
echo -e "${BLUE}   Demo: demo / demo123${NC}"
echo ""
echo -e "${YELLOW}📝 To view logs:${NC}"
echo -e "${YELLOW}   docker compose -f docker-compose.production.yml logs -f${NC}"
echo ""
echo -e "${YELLOW}🛑 To stop:${NC}"
echo -e "${YELLOW}   docker compose -f docker-compose.production.yml down${NC}"