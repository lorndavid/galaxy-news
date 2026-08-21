# ============================================================
# Galaxy TV V4K — Complete Deployment Guide
# Everything runs on YOUR PC via Docker + Cloudflare Tunnel
# ============================================================
#
# Architecture:
#
#   Internet users
#        |
#        v
#   Cloudflare (SSL + CDN)
#        |
#   Cloudflare Tunnel (outbound from your PC)
#        |
#   YOUR WINDOWS PC (Docker Desktop)
#        |
#   +-----------+-----------+-----------+
#   |           |           |           |
#   v           v           v           v
# Frontend   Admin      Backend     PostgreSQL
# (nginx)    (nginx)    (Express)   + Redis
# port 3000  port 3001  port 4000
#        |
#        v
#   Cloudflare R2 (images)
#
# ============================================================


# ============================================================
# PART 1: PREREQUISITES — Install These First
# ============================================================

# Step 1: Install Docker Desktop
#   Download: https://www.docker.com/products/docker-desktop/
#   Install it → restart PC → open Docker Desktop → wait until it says "Running"
#
# Step 2: Install Git
#   Download: https://git-scm.com/download/win
#   Install with default settings
#
# Step 3: Install Node.js (for local dev/testing only)
#   Download: https://nodejs.org/ (LTS version)
#   Install with default settings
#
# Step 4: Install Cloudflare Tunnel (cloudflared)
#   Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
#   Choose "Windows amd64" → install it
#
# Verify all installed — open "Git Bash" terminal:
#   docker --version        → should show Docker version
#   git --version           → should show git version
#   node --version          → should show v20+
#   cloudflared --version   → should show version


# ============================================================
# PART 2: CLOUDFLARE TUNNEL — Already Configured
# ============================================================

# You said the tunnel is already configured. Verify it works:
#
# Open Git Bash and run:
#   cloudflared tunnel list
#
# You should see a tunnel named "galaxytv" with a tunnel ID.
#
# If NOT, run these commands:
#   cloudflared tunnel login
#   (browser opens → select your galaxytv4k.online domain)
#
#   cloudflared tunnel create galaxytv
#   (saves credentials to ~/.cloudflared/galaxytv.json)
#
#   cloudflared tunnel route dns galaxytv www.galaxytv4k.online
#   cloudflared tunnel route dns galaxytv admin.galaxytv4k.online
#   cloudflared tunnel route dns galaxytv api.galaxytv4k.online
#   cloudflared tunnel route dns galaxytv media.galaxytv4k.online
#
# Verify DNS routes:
#   cloudflared tunnel route dns galaxytv
#   (should list all 4 subdomains)


# ============================================================
# PART 3: CLOUDFLARE R2 — Already Configured
# ============================================================

# You said R2 is already configured. You need these 3 values:
#
# 1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
# 2. Create a token (or copy existing one)
# 3. You need:
#    - Account ID (from R2 dashboard right sidebar)
#    - Access Key ID
#    - Secret Access Key
#
# Also verify your bucket:
# 1. Go to R2 → your bucket "news-media"
# 2. Settings → check "Public Access" is enabled
# 3. Note your public URL (either custom domain or R2.dev URL)


# ============================================================
# PART 4: CREATE YOUR .env FILE
# ============================================================

# Open the project root folder and create/edit .env file:
#
# Replace these values with your REAL ones:
#
# POSTGRES_PASSWORD     → any strong password (you choose it)
# JWT_SECRET            → run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# R2_ACCOUNT_ID         → from Cloudflare Dashboard → R2
# R2_ACCESS_KEY_ID      → from R2 API Tokens
# R2_SECRET_ACCESS_KEY  → from R2 API Tokens
#
# All other values can stay as-is.


# ============================================================
# PART 5: START EVERYTHING (First Time)
# ============================================================

# Open Git Bash in the project root folder.
#
# Step 1: Start PostgreSQL + Redis first (database needs to be ready)
#   docker compose up -d postgres redis
#
# Wait 15 seconds for PostgreSQL to initialize:
#   docker compose ps
#   (postgres and redis should show "healthy")
#
# Step 2: Generate Prisma client (connects to PostgreSQL)
#   docker compose exec backend npx prisma generate
#
# Step 3: Create all database tables
#   docker compose exec backend npx prisma migrate deploy
#
# Step 4: Fill the database with demo content (articles, categories, etc.)
#   docker compose exec backend npx prisma db seed
#
# Step 5: Build and start ALL services
#   docker compose up -d --build
#
# Wait 2-3 minutes for Docker to build the images.
# Check everything is running:
#   docker compose ps
#
# You should see:
#   galaxy-postgres    running (healthy)
#   galaxy-redis       running (healthy)
#   galaxy-backend     running (healthy)
#   galaxy-frontend    running
#   galaxy-admin       running
#
# Step 6: Test locally FIRST (before tunnel)
#   Open browser: http://localhost:3000     ← Website
#   Open browser: http://localhost:3001     ← Admin
#   Open browser: http://localhost:4000/health  ← API health check


# ============================================================
# PART 6: START CLOUDFLARE TUNNEL (makes site public)
# ============================================================

# Make sure your .cloudflared/config.yml is in place:
#
#   tunnel: galaxytv
#   credentials-file: ~/.cloudflared/galaxytv.json
#
#   ingress:
#     - hostname: api.galaxytv4k.online
#       service: http://localhost:4000
#     - hostname: admin.galaxytv4k.online
#       service: http://localhost:3001
#     - hostname: www.galaxytv4k.online
#       service: http://localhost:3000
#     - hostname: galaxytv4k.online
#       service: http://localhost:3000
#     - service: http_status:404
#
# Start the tunnel (open a NEW Git Bash window):
#   cloudflared tunnel run galaxytv
#
# NOW your website is live:
#   https://www.galaxytv4k.online    ← Public website
#   https://admin.galaxytv4k.online  ← Admin dashboard
#   https://api.galaxytv4k.online    ← API
#
# Share the link with anyone — they can open it on any device!
# Phone, tablet, laptop — anywhere in the world.


# ============================================================
# PART 7: FIRST-TIME ADMIN SETUP
# ============================================================
#
# 1. Open https://admin.galaxytv4k.online
# 2. Login (check seed data for credentials, usually admin/admin123)
# 3. Go to Settings → upload your logo, set site name to "Galaxy TV V4K"
# 4. Go to Categories → verify/create your categories
# 5. Go to Articles → create your first article
# 6. Go to Homepage Builder → configure which sections to show
# 7. Go to Navigation → set up your menu items
#
# Open https://www.galaxytv4k.online to see the public site!


# ============================================================
# PART 8: DAILY COMMANDS (Starting After First Time)
# ============================================================
#
# When you want to start everything:
#   docker compose up -d
#   cloudflared tunnel run galaxytv
#   (keep this terminal open)
#
# When you want to stop everything:
#   Ctrl+C in the cloudflared terminal
#   docker compose down
#
# When you make code changes and need to rebuild:
#   docker compose up -d --build
#
# When you want to see logs:
#   docker compose logs -f backend     ← API logs
#   docker compose logs -f frontend    ← Website logs
#   docker compose logs -f             ← All logs
#
# When you want to reset database:
#   docker compose exec backend npx prisma migrate reset --force
#   docker compose exec backend npx prisma db seed
#
# When you want to check status:
#   docker compose ps


# ============================================================
# PART 9: AUTO-START ON WINDOWS BOOT (Optional)
# ============================================================
#
# To auto-start Docker + Tunnel when you turn on your PC:
#
# 1. Create a file called "start-galaxy.bat" on your Desktop:
#
# @echo off
# echo Starting Galaxy TV V4K...
# docker compose up -d
# timeout /t 30
# cloudflared tunnel run galaxytv
#
# 2. Press Win+R → type: shell:startup → press Enter
# 3. Put a shortcut to "start-galaxy.bat" in that folder
# 4. Now it auto-starts when you log in to Windows


# ============================================================
# PART 10: TROUBLESHOOTING
# ============================================================
#
# PROBLEM: "docker: command not found"
#   → Docker Desktop is not running. Open it and wait for "Running" status.
#
# PROBLEM: "Cannot connect to the Docker daemon"
#   → Start Docker Desktop. Wait 1-2 minutes.
#
# PROBLEM: PostgreSQL keeps restarting
#   → Check password: docker compose logs postgres
#   → Make sure POSTGRES_PASSWORD in .env matches DATABASE_URL
#
# PROBLEM: "P1001: Can't reach database server"
#   → PostgreSQL not ready yet. Wait 30 seconds and try again.
#
# PROBLEM: Frontend shows "Error connecting to server"
#   → Backend not running. Check: docker compose ps
#   → If backend is restarting: docker compose logs backend
#
# PROBLEM: Tunnel shows "Failed to connect"
#   → Make sure cloudflared is logged in: cloudflared tunnel list
#   → If not, re-run: cloudflared tunnel login
#
# PROBLEM: Domain shows "Error 1001" on Cloudflare
#   → Tunnel not running. Start it: cloudflared tunnel run galaxytv
#   → Or DNS not routed. Check: cloudflared tunnel route dns galaxytv
#
# PROBLEM: Images not loading
#   → Check R2 bucket public access is enabled
#   → Check R2_PUBLIC_URL in .env matches your actual R2 URL
#
# PROBLEM: Port already in use
#   → Stop other services using those ports:
#     netstat -ano | findstr :3000
#     taskkill /PID <process_id> /F
#
# RESET EVERYTHING:
#   docker compose down -v     ← removes all data too!
#   docker compose up -d postgres redis
#   docker compose exec backend npx prisma migrate reset --force
#   docker compose exec backend npx prisma db seed
#   docker compose up -d --build
