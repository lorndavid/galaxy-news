# Galaxy TV V4K — Production Deployment Guide

## Architecture

```
                         INTERNET
                             │
                             ▼
                      CLOUDFLARE
                   DNS / WAF / DDoS
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
           VERCEL         VERCEL       CLOUDFLARE
              │              │           TUNNEL
              │              │              │
       Public Frontend   Admin Frontend    VPS
       (www domain)      (admin domain)     │
                                      Docker Compose
                                             │
                           ┌─────────────────┼─────────────────┐
                           │                 │                 │
                           ▼                 ▼                 ▼
                       Express           PostgreSQL          Redis
                       Backend            Database           Cache
                           │
                           ├──────────────────────► R2
                           │                       Media
                           │
                           ▼
                         Backup
```

## DNS Records

| Subdomain | Type | Target | Purpose |
|-----------|------|--------|---------|
| `www` | CNAME | `cname.vercel-dns.com` | Frontend (Vercel) |
| `admin` | CNAME | `cname.vercel-dns.com` | Admin (Vercel) |
| `api` | CNAME | `<tunnel-id>.cfargotunnel.com` | API (Tunnel → VPS) |
| `media` | CNAME | `<r2-bucket>.r2.dev` | Images (Cloudflare R2) |

## Deployment Steps

### 1. Deploy Frontend to Vercel

```bash
# In Vercel Dashboard:
# 1. Import Git Repository
# 2. Framework Preset: Vite
# 3. Root Directory: frontend
# 4. Build Command: npm run build
# 5. Output Directory: dist

# Environment Variables (Vercel Dashboard → Settings → Environment Variables):
VITE_API_BASE=https://api.galaxytv4k.online
```

### 2. Deploy Admin to Vercel

```bash
# In Vercel Dashboard:
# 1. Import Git Repository (same repo, different project)
# 2. Framework Preset: Vite
# 3. Root Directory: admin
# 4. Build Command: npm run build
# 5. Output Directory: dist

# Environment Variables (Vercel Dashboard → Settings → Environment Variables):
VITE_API_BASE=https://api.galaxytv4k.online
```

### 3. Deploy Backend to VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone the repository
git clone <repo-url> && cd <project>

# Create .env from template
cp .env.example .env
# Edit .env with your production values:
#   POSTGRES_PASSWORD=<strong-password>
#   JWT_SECRET=<random-96-char-string>
#   R2_ACCOUNT_ID=<your-r2-account-id>
#   R2_ACCESS_KEY_ID=<your-r2-access-key>
#   R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
#   CLOUDFLARE_TUNNEL_TOKEN=<your-tunnel-token>

# Start backend infrastructure
docker compose -f docker-compose.prod.yml up -d postgres redis

# Wait for healthy
sleep 15

# Run migrations and seed
docker compose -f docker-compose.prod.yml exec backend npx prisma generate
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Verify health
curl -s http://localhost:4000/health
```

### 4. Configure Cloudflare Tunnel

```bash
# Install cloudflared on VPS
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create galaxytv

# Route DNS
cloudflared tunnel route dns galaxytv api.galaxytv4k.online

# Copy tunnel config (already in repo)
cp cloudflared/config.yml ~/.cloudflared/config.yml
# IMPORTANT: On Windows, use 127.0.0.1 instead of localhost in the config.
# Windows resolves localhost to IPv6 (::1) first, but Docker binds to
# IPv4 (127.0.0.1). Using localhost causes "database down" errors.

# Start tunnel (in production, use systemd or Docker)
cloudflared tunnel run galaxytv
```

### 5. Configure Cloudflare DNS

In Cloudflare Dashboard:

```
1. Add CNAME record: www → cname.vercel-dns.com (Proxy ON)
2. Add CNAME record: admin → cname.vercel-dns.com (Proxy ON)
3. Add CNAME record: api → <tunnel-id>.cfargotunnel.com (Proxy ON)
4. Add CNAME record: media → <bucket>.r2.dev (Proxy ON)
```

### 6. Configure Vercel Domains

In Vercel Dashboard:

```
Frontend project → Settings → Domains → Add: www.galaxytv4k.online
Admin project → Settings → Domains → Add: admin.galaxytv4k.online
```

## Environment Variables

### Vercel (Frontend + Admin)

| Variable | Value | Where |
|----------|-------|-------|
| `VITE_API_BASE` | `https://api.galaxytv4k.online` | Vercel Dashboard |

### VPS (Docker)

| Variable | Value | Where |
|----------|-------|-------|
| `POSTGRES_PASSWORD` | `<strong-password>` | `.env` |
| `JWT_SECRET` | `<random-96-char-string>` | `.env` |
| `R2_ACCOUNT_ID` | `<cloudflare-account-id>` | `.env` |
| `R2_ACCESS_KEY_ID` | `<r2-access-key>` | `.env` |
| `R2_SECRET_ACCESS_KEY` | `<r2-secret-key>` | `.env` |
| `FRONTEND_ORIGIN` | `https://www.galaxytv4k.online` | `.env` |
| `ADMIN_ORIGIN` | `https://admin.galaxytv4k.online` | `.env` |
| `CLOUDFLARE_TUNNEL_TOKEN` | `<tunnel-token>` | `.env` |

## Daily Commands

```bash
# Start everything (production)
docker compose -f docker-compose.prod.yml up -d

# After code changes
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f backend

# Stop everything
docker compose -f docker-compose.prod.yml down

# Backup database
docker compose -f docker-compose.prod.yml run --rm backup sh -c '/usr/local/bin/backup.sh'
```

## Rollback

```bash
# Revert to previous commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

## Testing Checklist

- [ ] `https://www.galaxytv4k.online` — frontend loads
- [ ] `https://admin.galaxytv4k.online` — admin loads
- [ ] `https://api.galaxytv4k.online/health` — API responds (all deps ok)
- [ ] Health check shows `database: ok`, `redis: ok`, `r2: ok`
- [ ] Login works (refresh token cookie)
- [ ] Article CRUD works
- [ ] Image upload works (R2)
- [ ] Image display works (media proxy or R2 direct)
- [ ] CORS headers correct
- [ ] No mixed-content errors
- [ ] Mobile responsive
