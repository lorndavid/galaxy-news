#!/bin/bash
# ============================================================
# Galaxy TV V4K — Quick Start Commands
# Copy-paste these ONE AT A TIME into Git Bash
# ============================================================

# === STEP 1: Verify Docker is working ===
docker --version
docker compose version

# === STEP 2: Navigate to your project ===
# (Replace with your actual project path)
cd ~/galaxytv4k
# or: cd C:/Users/YOUR_USERNAME/galaxytv4k

# === STEP 3: Create the .env file ===
cp .env.example .env
# Then edit .env with notepad:
notepad .env
# Fill in ALL values: POSTGRES_PASSWORD, R2 keys, JWT_SECRET, etc.

# === STEP 4: Generate JWT secret ===
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Copy the output and paste it as JWT_SECRET in .env

# === STEP 5: Start PostgreSQL + Redis ===
docker compose up -d postgres redis
sleep 15
docker compose ps
# Verify: both should show "healthy"

# === STEP 6: Setup database ===
docker compose exec backend npx prisma generate
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# === STEP 7: Build and start everything ===
docker compose up -d --build
sleep 30
docker compose ps
# Verify: all 5 services should show "running"

# === STEP 8: Test locally ===
curl http://localhost:4000/health
# Should return JSON with "status": "ok"

# Open in browser:
# http://localhost:3000      → Website
# http://localhost:3001      → Admin (admin@galaxytv4k.online / admin123)

# === STEP 9: Setup Cloudflare Tunnel (one-time) ===
cloudflared tunnel login
cloudflared tunnel create galaxytv
cloudflared tunnel route dns galaxytv www.galaxytv4k.online
cloudflared tunnel route dns galaxytv admin.galaxytv4k.online
cloudflared tunnel route dns galaxytv api.galaxytv4k.online

# === STEP 10: Start the tunnel ===
cloudflared tunnel run galaxytv

# === STEP 11: Open your real domain ===
# https://www.galaxytv4k.online      → Website
# https://admin.galaxytv4k.online    → Admin
# https://api.galaxytv4k.online/health → API

# ============================================================
# DAILY COMMANDS (copy these to restart everything)
# ============================================================

# Start:
docker compose up -d
# (then in another window): cloudflared tunnel run galaxytv

# Stop:
# Ctrl+C in the cloudflared window
docker compose down

# Restart after code changes:
docker compose up -d --build

# View logs:
docker compose logs -f backend

# Full reset (WARNING: deletes all data):
docker compose down -v
docker compose up -d postgres redis
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
docker compose up -d --build
