#!/bin/bash
# ============================================================
# Galaxy TV V4K — Quick Start Script
# Run this in Git Bash from the project root folder
# ============================================================

set -e

echo "========================================="
echo "  Galaxy TV V4K — Starting All Services"
echo "========================================="
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker Desktop is not running!"
  echo "   Please open Docker Desktop and wait until it says 'Running'."
  exit 1
fi
echo "✅ Docker is running"

# Check .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "   Please create .env file in the project root."
  echo "   See .env.example for the template."
  exit 1
fi
echo "✅ .env file found"

# Check PostgreSQL password is set
if grep -q "change-me" .env 2>/dev/null; then
  echo "⚠️  WARNING: Your .env still has 'change-me' values!"
  echo "   Please update POSTGRES_PASSWORD and JWT_SECRET."
  echo ""
fi

echo ""
echo "Step 1: Starting PostgreSQL + Redis..."
docker compose up -d postgres redis
echo "   Waiting for databases to be healthy..."
sleep 10

# Wait for PostgreSQL to be healthy
echo "   Checking PostgreSQL health..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U galaxy_admin -d galaxy_tv > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "   ❌ PostgreSQL failed to start. Check: docker compose logs postgres"
    exit 1
  fi
  sleep 2
done

# Generate Prisma client
echo ""
echo "Step 2: Generating Prisma client..."
docker compose exec backend npx prisma generate 2>/dev/null || true

# Run migrations
echo ""
echo "Step 3: Running database migrations..."
docker compose exec backend npx prisma migrate deploy 2>/dev/null || echo "   (migrations may already be applied)"

# Build and start all services
echo ""
echo "Step 4: Building and starting all services..."
docker compose up -d --build

echo ""
echo "========================================="
echo "  ✅ All Services Started!"
echo "========================================="
echo ""
echo "Local URLs:"
echo "   Website:  http://localhost:3000"
echo "   Admin:    http://localhost:3001"
echo "   API:      http://localhost:4000/health"
echo ""
echo "Public URLs (via Cloudflare Tunnel):"
echo "   Website:  https://www.galaxytv4k.online"
echo "   Admin:    https://admin.galaxytv4k.online"
echo "   API:      https://api.galaxytv4k.online"
echo ""
echo "To start the tunnel, run in a NEW terminal:"
echo "   cloudflared tunnel run galaxytv"
echo ""
echo "To stop everything:"
echo "   docker compose down"
echo ""
