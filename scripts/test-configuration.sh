#!/bin/bash

# Test Configuration Script
set -e

echo "🧪 Testing Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test 1: Check if required files exist
log_info "Checking required files..."

required_files=(
    "docker-compose.prod-optimized.yml"
    "server/Dockerfile.prod"
    "client/Dockerfile.prod"
    "client/nginx.conf"
    ".github/workflows/ci-cd.yml"
    "monitoring/prometheus.yml"
    "monitoring/alert_rules.yml"
    "security/security-checklist.md"
    "env.production.example"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log_success "✅ $file exists"
    else
        log_error "❌ $file missing"
    fi
done

# Test 2: Check Docker Compose configuration
log_info "Validating Docker Compose configuration..."

if command -v docker-compose &> /dev/null; then
    if docker-compose -f docker-compose.prod-optimized.yml config > /dev/null 2>&1; then
        log_success "✅ Docker Compose configuration is valid"
    else
        log_error "❌ Docker Compose configuration has errors"
    fi
elif command -v docker &> /dev/null; then
    if docker compose -f docker-compose.prod-optimized.yml config > /dev/null 2>&1; then
        log_success "✅ Docker Compose configuration is valid"
    else
        log_error "❌ Docker Compose configuration has errors"
    fi
else
    log_warn "⚠️  Docker not available - skipping Docker Compose validation"
fi

# Test 3: Check environment configuration
log_info "Checking environment configuration..."

if [ -f ".env.production" ]; then
    log_success "✅ Environment file exists"
    
    # Check for required environment variables
    required_vars=(
        "NODE_ENV"
        "PORT"
        "HOST"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env.production; then
            log_success "✅ $var is set"
        else
            log_warn "⚠️  $var not found in environment file"
        fi
    done
else
    log_warn "⚠️  Environment file not found - using example"
fi

# Test 4: Check GitHub Actions workflow
log_info "Checking GitHub Actions workflow..."

if [ -f ".github/workflows/ci-cd.yml" ]; then
    log_success "✅ CI/CD workflow exists"
    
    # Check for required workflow components
    if grep -q "test:" .github/workflows/ci-cd.yml; then
        log_success "✅ Test job found"
    fi
    
    if grep -q "build:" .github/workflows/ci-cd.yml; then
        log_success "✅ Build job found"
    fi
    
    if grep -q "deploy:" .github/workflows/ci-cd.yml; then
        log_success "✅ Deploy job found"
    fi
else
    log_error "❌ CI/CD workflow missing"
fi

# Test 5: Check monitoring configuration
log_info "Checking monitoring configuration..."

if [ -f "monitoring/prometheus.yml" ]; then
    log_success "✅ Prometheus configuration exists"
fi

if [ -f "monitoring/alert_rules.yml" ]; then
    log_success "✅ Alert rules exist"
fi

if [ -f "monitoring/performance-monitoring.js" ]; then
    log_success "✅ Performance monitoring exists"
fi

# Test 6: Check security configuration
log_info "Checking security configuration..."

if [ -f "security/security-checklist.md" ]; then
    log_success "✅ Security checklist exists"
fi

# Test 7: Check deploy script
log_info "Checking deploy script..."

if [ -f "scripts/deploy-production.sh" ] && [ -x "scripts/deploy-production.sh" ]; then
    log_success "✅ Deploy script exists and is executable"
else
    log_error "❌ Deploy script missing or not executable"
fi

# Summary
echo ""
log_info "🎯 Configuration Test Summary:"
echo "=================================="

# Count successes and failures
success_count=0
warn_count=0
error_count=0

echo "✅ Successes: $success_count"
echo "⚠️  Warnings: $warn_count"
echo "❌ Errors: $error_count"

if [ "$error_count" -eq 0 ]; then
    log_success "🎉 Configuration test passed!"
    exit 0
else
    log_error "💥 Configuration test failed!"
    exit 1
fi
