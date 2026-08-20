# Galaxy TV V4K — Local Docker Deployment Guide
## Complete Step-by-Step: Frontend + Admin + Backend + PostgreSQL + Redis + Cloudflare R2 + Cloudflare Tunnel

---

## Architecture Overview

```
                    INTERNET
                       │
                       ▼
                  Cloudflare DNS
                       │
                 Cloudflare Tunnel
                       │
                       ▼
              YOUR WINDOWS PC (Docker Desktop)
                       │
                 ┌─────┼─────┬──────────┐
                 ▼     ▼     ▼          ▼
              Frontend Admin  Backend   Cloudflare R2
              :3000   :3001  :4000      (external)
                                │
                          ┌─────┼─────┐
                          ▼           ▼
                       PostgreSQL    Redis
                       :5432         :6379
```

**Domain mapping:**
| Domain | → | Local Port |
|--------|---|------------|
| `www.galaxytv4k.online` | → | `localhost:3000` (Vue frontend) |
| `admin.galaxytv4k.online` | → | `localhost:3001` (Vue admin) |
| `api.galaxytv4k.online` | → | `localhost:4000` (Express API) |
| `media.galaxytv4k.online` | → | Cloudflare R2 (images) |

---

## PHASE 0: Prerequisites

### 0.1 Install Required Software

| Software | Download | Purpose |
|----------|----------|---------|
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ | Container runtime |
| **Node.js 20+** | https://nodejs.org/ | Local dev (optional) |
| **Git** | https://git-scm.com/ | Source control |
| **Cloudflare account** | https://dash.cloudflare.com/ | DNS + Tunnel + R2 storage |

### 0.2 Verify Docker Desktop is Running

Open a terminal (Git Bash on Windows) and run:
```bash
docker --version
docker compose version
```

Both should show version numbers. If not, start Docker Desktop from the Start Menu.

---

## PHASE 1: Cloudflare R2 Setup (Image Storage)

### 1.1 Create R2 Bucket

1. Log in to **Cloudflare Dashboard**: https://dash.cloudflare.com/
2. Click **R2** in the left sidebar
3. Click **Create bucket**
4. Name: `news-media`
5. Location: **Auto** (let Cloudflare choose closest)
6. Click **Create bucket**

### 1.2 Enable Public Access

1. Click on the `news-media` bucket
2. Go to **Settings** tab
3. Scroll to **Public access**
4. Click **Allow Access**
5. Copy the R2.dev URL (looks like `https://news-media.<your-account-id>.r2.dev`)

**OR** (recommended) set up a custom domain:
1. In **Settings** → **Public access** → **Custom domain**
2. Enter: `media.galaxytv4k.online`
3. Click **Connect domain**
4. Cloudflare will auto-create the DNS record

### 1.3 Create API Token (for backend to upload images)

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use template: **R2 Object Read & Write**
4. Permissions: `Object Read & Write`
5. Resources: `Include → Specific bucket → news-media`
6. Click **Continue to summary** → **Create Token**
7. **Copy the Access Key ID and Secret Access Key** — you won't see them again!

### 1.4 Get Your Account ID

1. Go to **Cloudflare Dashboard** → **R2** → **Overview**
2. Your **Account ID** is shown in the right sidebar (or at `dash.cloudflare.com` under the URL)

---

## PHASE 2: Cloudflare Tunnel Setup (Expose Local Services)

### 2.1 Install cloudflared

**Windows:**
```bash
# Download and install from:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
# Or use winget:
winget install cloudflare.cloudflared
```

**Verify installation:**
```bash
cloudflared --version
```

### 2.2 Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser. Select your domain `galaxytv4k.online` and authorize. A certificate is saved to `~/.cloudflared/cert.pem`.

### 2.3 Create the Tunnel

```bash
cloudflared tunnel create galaxytv
```

This creates a tunnel ID and credentials file at `~/.cloudflared/<tunnel-id>.json`.

**Save your tunnel ID** — you'll need it.

### 2.4 Route DNS (Create subdomains)

```bash
# Route www subdomain
cloudflared tunnel route dns galaxytv www.galaxytv4k.online

# Route admin subdomain
cloudflared tunnel route dns galaxytv admin.galaxytv4k.online

# Route api subdomain
cloudflared tunnel route dns galaxytv api.galaxytv4k.online

# Route root domain
cloudflared tunnel route dns galaxytv galaxytv4k.online
```

### 2.5 Configure the Tunnel

Copy the tunnel ID into the config file:
```bash
# Edit cloudflared/config.yml
# Replace 'galaxytv' with your actual tunnel ID
```

Or create it directly:
```bash
# Windows: create config in %USERPROFILE%\.cloudflared\config.yml
# Mac/Linux: ~/.cloudflared/config.yml
```

Content:
```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: ~/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: api.galaxytv4k.online
    service: http://localhost:4000
  - hostname: admin.galaxytv4k.online
    service: http://localhost:3001
  - hostname: www.galaxytv4k.online
    service: http://localhost:3000
  - hostname: galaxytv4k.online
    service: http://localhost:3000
  - service: http_status:404
```

---

## PHASE 3: Configure Environment Variables

### 3.1 Create the `.env` file

Create a `.env` file in the project root (same directory as `docker-compose.yml`):

```env
# PostgreSQL
POSTGRES_DB=galaxy_tv
POSTGRES_USER=galaxy_admin
POSTGRES_PASSWORD=your-strong-password-here

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=news-media
R2_PUBLIC_URL=https://media.galaxytv4k.online

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
JWT_SECRET=your-long-random-jwt-secret

# Domain URLs
FRONTEND_URL=https://www.galaxytv4k.online
ADMIN_URL=https://admin.galaxytv4k.online
PUBLIC_SITE_URL=https://www.galaxytv4k.online
```

### 3.2 Generate a JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output and paste it as the `JWT_SECRET` value.

---

## PHASE 4: Update Prisma for PostgreSQL

The Prisma schema has already been updated to use PostgreSQL. You need to:

### 4.1 Reset the database

Since we're switching from SQLite to PostgreSQL, existing migrations need to be regenerated:

```bash
cd backend

# Delete old SQLite migrations
rm -rf prisma/migrations

# Generate fresh PostgreSQL migration
npx prisma migrate dev --name init
```

### 4.2 Verify the migration

```bash
# Should connect to PostgreSQL (it must be running)
npx prisma db push
```

---

## PHASE 5: Build and Run Everything

### 5.1 Start PostgreSQL and Redis first

```bash
docker compose up -d postgres redis
```

Wait for healthy status:
```bash
docker compose ps
```

Both `postgres` and `redis` should show `healthy`.

### 5.2 Apply Database Migration

With PostgreSQL running:
```bash
cd backend
# Set DATABASE_URL for local Prisma (points to Docker PostgreSQL)
export DATABASE_URL="postgresql://galaxy_admin:your-strong-password-here@localhost:5432/galaxy_tv"

# Reset and apply all migrations
npx prisma migrate reset --force

# Seed demo data
npx prisma db seed
```

### 5.3 Build and Start All Services

```bash
# From project root
docker compose up -d --build
```

This will:
1. Build the backend image (Node.js + Prisma)
2. Build the frontend image (Vue + nginx)
3. Build the admin image (Vue + nginx)
4. Start all 5 services: postgres, redis, backend, frontend, admin

### 5.4 Verify Everything is Running

```bash
docker compose ps
```

Expected output:
```
NAME              STATUS          PORTS
galaxy-postgres   running (healthy) 127.0.0.1:5432->5432/tcp
galaxy-redis      running (healthy) 127.0.0.1:6379->6379/tcp
backend           running          127.0.0.1:4000->4000/tcp
frontend          running          127.0.0.1:3000->80/tcp
admin             running          127.0.0.1:3001->80/tcp
```

### 5.5 Test Health Endpoint

```bash
curl http://localhost:4000/health
```

Expected:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "dependencies": {
      "database": "ok",
      "redis": "ok",
      "r2": "ok"
    }
  }
}
```

---

## PHASE 6: Access Locally

### 6.1 Public Website
- **Local:** http://localhost:3000
- **Via Tunnel:** https://www.galaxytv4k.online

### 6.2 Admin Dashboard
- **Local:** http://localhost:3001
- **Via Tunnel:** https://admin.galaxytv4k.online

Default admin credentials (from seed):
- **Email:** admin@galaxytv4k.online
- **Password:** admin123 (change this immediately!)

### 6.3 API
- **Local:** http://localhost:4000/api/v1
- **Via Tunnel:** https://api.galaxytv4k.online/api/v1

---

## PHASE 7: Start Cloudflare Tunnel

### 7.1 Start the Tunnel

```bash
cloudflared tunnel run galaxytv
```

### 7.2 Test Your Domain

Open your browser and visit:
- https://www.galaxytv4k.online
- https://admin.galaxytv4k.online

---

## PHASE 8: Post-Setup Configuration

### 8.1 Upload Logo via Admin

1. Go to https://admin.galaxytv4k.online
2. Login
3. Go to **Settings** → **General**
4. Upload your logo (it will be stored in R2)
5. Set site name to **Galaxy TV V4K**
6. Set default language
7. Save

### 8.2 Configure Homepage Layouts

1. Go to **Homepage Builder**
2. Set layout for each category section:
   - National News → **Editorial Hero**
   - Politics → **Editorial Split**
   - International → **Magazine Mosaic**
   - etc.
3. Set article limits per section
4. Reorder sections as needed
5. Save

### 8.3 Configure Telegram (Optional)

1. Go to **Settings** → **Integrations** → **Telegram**
2. Enter bot token from @BotFather
3. Add chat destinations
4. Set Site URL to `https://www.galaxytv4k.online`
5. Test connection
6. Enable auto-publish

---

## PHASE 9: Docker Compose Commands Reference

```bash
# Start everything
docker compose up -d

# Start with rebuild (after code changes)
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f admin

# Stop everything
docker compose down

# Stop and remove volumes (full reset)
docker compose down -v

# Check status
docker compose ps

# Restart a single service
docker compose restart backend

# View backend logs (last 100 lines)
docker compose logs --tail 100 backend
```

---

## PHASE 10: Common Troubleshooting

### "DATABASE_URL connection refused"
- Make sure PostgreSQL is running: `docker compose ps`
- Check password matches between `.env` and `DATABASE_URL`
- Wait for health check: `docker compose logs postgres`

### "R2 upload failed"
- Check R2 credentials in `.env`
- Verify bucket `news-media` exists in Cloudflare R2 dashboard
- Check R2 API token permissions

### "Cloudflare Tunnel shows 502"
- Make sure Docker services are running: `docker compose ps`
- Test locally first: `curl http://localhost:3000`
- Check tunnel config: `cloudflared tunnel info galaxytv`

### "Images not loading"
- Check `R2_PUBLIC_URL` in `.env` matches your actual R2 URL
- For custom domain: verify DNS is configured in Cloudflare
- Check browser console for CORS or mixed-content errors

### "Port already in use"
```bash
# Find what's using the port
netstat -ano | findstr :3000
# Kill the process or change ports in docker-compose.yml
```

---

## PHASE 11: Production Checklist

Before going live:

- [ ] Change default admin password
- [ ] Set strong `JWT_SECRET`
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Configure R2 public URL with custom domain
- [ ] Set `PUBLIC_SITE_URL` to your domain
- [ ] Set `FRONTEND_URL` and `ADMIN_URL` to your domains
- [ ] Configure CORS for your domains
- [ ] Enable HTTPS (Cloudflare Tunnel provides this automatically)
- [ ] Upload site logo and favicon
- [ ] Configure homepage sections and layouts
- [ ] Test article CRUD flow end-to-end
- [ ] Test image upload → R2 → display
- [ ] Test language switching (KH/EN/ZH)
- [ ] Test Telegram integration
- [ ] Test mobile responsive layout
- [ ] Set Cloudflare Tunnel to run on system startup

---

## PHASE 12: Auto-Start Tunnel on Windows

To run the tunnel automatically:

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: **At log on**
4. Action: **Start a program**
5. Program: `C:\Program Files\cloudflared\cloudflared.exe`
6. Arguments: `tunnel run --config C:\Users\YOU\.cloudflared\config.yml galaxytv`

Or create a batch file:
```batch
@echo off
cloudflared tunnel run galaxytv
```

---

## Quick Reference: Service URLs

| Service | Local URL | Production URL |
|---------|-----------|----------------|
| Website | http://localhost:3000 | https://www.galaxytv4k.online |
| Admin | http://localhost:3001 | https://admin.galaxytv4k.online |
| API | http://localhost:4000 | https://api.galaxytv4k.online |
| Images | (R2) | https://media.galaxytv4k.online |
| PostgreSQL | localhost:5432 | (internal only) |
| Redis | localhost:6379 | (internal only) |

---

## Quick Reference: First-Time Setup Sequence

```bash
# 1. Configure R2 (Phase 1) via Cloudflare Dashboard
# 2. Install cloudflared + create tunnel (Phase 2)
# 3. Create .env file (Phase 3)
# 4. Start database + redis
docker compose up -d postgres redis
# 5. Apply database migrations
cd backend && npx prisma migrate reset --force && npx prisma db seed
# 6. Build and start everything
docker compose up -d --build
# 7. Start tunnel
cloudflared tunnel run galaxytv
# 8. Open your website
# https://www.galaxytv4k.online
```
