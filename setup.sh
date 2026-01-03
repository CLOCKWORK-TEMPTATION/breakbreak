#!/bin/bash
# Setup script for Break Break application

echo "🚀 Setting up Break Break Application"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

step() {
    echo -e "${GREEN}▶ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
step "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 20.x or higher."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    warning "pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v psql &> /dev/null; then
    warning "PostgreSQL client not found. Make sure PostgreSQL is installed."
fi

echo ""
step "Installing dependencies..."
pnpm install

echo ""
step "Setting up environment variables..."

# Backend .env
if [ ! -f "apps/backend/.env" ]; then
    cp apps/backend/.env.example apps/backend/.env
    echo "✓ Created apps/backend/.env from example"
    warning "Please update apps/backend/.env with your database credentials"
else
    echo "✓ apps/backend/.env already exists"
fi

# Frontend .env.local
if [ ! -f "apps/frontend/.env.local" ]; then
    cp apps/frontend/.env.example apps/frontend/.env.local
    echo "✓ Created apps/frontend/.env.local from example"
else
    echo "✓ apps/frontend/.env.local already exists"
fi

echo ""
step "Setting up database..."
echo ""
echo "Database setup instructions:"
echo "1. Make sure PostgreSQL is running"
echo "2. Create the database: createdb breakapp_db"
echo "3. Enable PostGIS: psql breakapp_db -c \"CREATE EXTENSION IF NOT EXISTS postgis;\""
echo "4. Enable UUID: psql breakapp_db -c \"CREATE EXTENSION IF NOT EXISTS \\\"uuid-ossp\\\";\""
echo ""
read -p "Have you set up the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    step "Generating Prisma client..."
    cd apps/backend
    npx prisma generate
    
    echo ""
    step "Running database migrations..."
    npx prisma migrate dev --name init
    
    cd ../..
else
    warning "Skipping database setup. Run migrations manually later:"
    echo "  cd apps/backend"
    echo "  npx prisma generate"
    echo "  npx prisma migrate dev --name init"
fi

echo ""
step "Building applications..."
pnpm build

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "To start development:"
echo "  pnpm dev"
echo ""
echo "Individual services:"
echo "  Backend:  cd apps/backend && pnpm dev    (http://localhost:3000)"
echo "  Frontend: cd apps/frontend && pnpm dev   (http://localhost:3001)"
echo ""
