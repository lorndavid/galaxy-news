# Deployment Guide

## Architecture

```
┌─────────────────────────────────────┐
│            Vercel / CDN             │
├─────────────────┬───────────────────┤
│  Public Frontend│  Admin Frontend   │
│  (Vue 3 SPA)   │  (Vue 3 SPA)     │
└────────┬────────┴────────┬──────────┘
         │                 │
         └────────┬────────┘
                  │ API calls
         ┌────────▼────────┐
         │  Persistent     │
         │  Server / VPS   │
         ├─────────────────┤
         │  Express API    │
         │  SQLite DB      │
         │  Redis Cache    │
         │  MinIO Storage  │
         └─────────────────┘
```

**Important**: SQLite, Redis, and MinIO are NOT suitable for serverless (Vercel). They require a persistent server/VPS.

## Development

```bash
# Start all three services
cd backend && npm run dev     # API on :4000
cd frontend && npm run dev    # Public on :5173
cd admin && npm run dev       # Admin on :5174
```

## Docker Deployment

```bash
# Full stack
docker compose up -d

# Services:
# - backend (Express API)     → :4000
# - frontend (Public site)    → :3000
# - admin (CMS)               → :3001
# - redis (Cache)             → :6379
# - minio (Object storage)    → :9000/:9001
```

## Production VPS Deployment

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
git clone <repo-url> /opt/galaxy-tv
cd /opt/galaxy-tv
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with production values:
# - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
# - MINIO_ACCESS_KEY / MINIO_SECRET_KEY (use strong passwords)
# - FRONTEND_URL / ADMIN_URL (your domains)
# - PUBLIC_SITE_URL
```

### 3. Start Stack

```bash
docker compose -f docker-compose.yml up -d
```

### 4. SSL/HTTPS

Use Nginx reverse proxy with Let's Encrypt:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;  # Frontend
    }

    location /admin/ {
        proxy_pass http://localhost:3001;  # Admin
    }

    location /api/ {
        proxy_pass http://localhost:4000;  # API
    }

    location /minio/ {
        proxy_pass http://localhost:9000;  # MinIO
    }
}
```

## Vercel Deployment (Frontend + Admin Only)

### Frontend

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
```

Environment variable:
```
VITE_API_URL=https://api.yourdomain.com/api
```

### Admin

```json
{
  "buildCommand": "cd admin && npm run build",
  "outputDirectory": "admin/dist",
  "framework": "vite"
}
```

Environment variable:
```
VITE_API_URL=https://api.yourdomain.com/api
```

### API (on VPS)

The backend must run on a persistent server. Frontend communicates via `VITE_API_URL`.

## Database Backup

```bash
# Backup SQLite
docker compose exec backend cp /app/data/dev.db /app/data/backup-$(date +%Y%m%d).db

# Export from container
docker compose cp backend:/app/data/dev.db ./backup-$(date +%Y%m%d).db
```

## Environment Variables

See [environment.md](./environment.md) for complete list.

## Monitoring

- **Health check**: `GET /health` — returns service status
- **Redis**: Check connection with `redis-cli ping`
- **MinIO**: Console at `http://your-server:9001`
