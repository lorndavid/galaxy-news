# Galaxy TV V4K — News Platform

A modern, production-grade news platform for **Galaxy TV V4K** (galaxytv4k.online).
Cambodian digital news with Khmer, English, and Chinese language support.

```
Professional newsroom design + real database + CDN image storage + automated backups
```

---

## Architecture

```text
                    ┌─────────────────────┐
                    │     INTERNET         │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │   CLOUDFLARE CDN    │  DNS + SSL + Tunnel
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │  CLOUDFLARE TUNNEL  │  Routes domains to your PC/VPS
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │     NGINX PROXY     │  Frontend :3000, Admin :3001
                    └──────────┬──────────┘
                               ▼
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
   │  VUE FRONTEND   │ │  VUE ADMIN  │ │  EXPRESS API    │
   │  (public site)  │ │  (CMS)      │ │  (REST backend) │
   └─────────────────┘ └─────────────┘ └────────┬────────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                     │  POSTGRESQL  │  │    REDIS      │  │ CLOUDFLARE R2│
                     │  (database)  │  │  (cache)      │  │ (images)     │
                     └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Vue 3, TypeScript, Vite, Vue Router, Pinia, Axios |
| Admin | Vue 3, TypeScript, Vite, Tailwind CSS, TipTap rich text editor |
| Backend | Node.js, Express, TypeScript, Prisma ORM, Zod validation, JWT auth |
| Database | **PostgreSQL 17** (Docker) |
| Cache | **Redis 7** (Docker) with in-memory fallback |
| Storage | **Cloudflare R2** (S3-compatible) with local disk fallback |
| Deployment | Docker Compose, Cloudflare Tunnel |

---

## Services (Docker Compose)

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | Public news website (nginx + Vue 3 SPA) |
| `admin` | 3001 | Editorial CMS dashboard (nginx + Vue 3 SPA) |
| `backend` | 4000 | REST API (Express + Prisma) |
| `postgres` | 5432 | PostgreSQL 17 database |
| `redis` | 6379 | API cache (AOF persistence) |
| `backup` | — | Automated daily PostgreSQL backups |

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Cloudflare account](https://dash.cloudflare.com/) with a domain
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

### 1. Clone & configure

```bash
git clone <repo-url> && cd <project>
cp .env.example .env
# Edit .env — fill in your R2 credentials and PostgreSQL password
```

### 2. Start everything

```bash
docker compose up -d postgres redis
sleep 15
docker compose exec backend npx prisma generate
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
docker compose up -d --build
```

### 3. Set up Cloudflare Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create galaxytv
cloudflared tunnel route dns galaxytv www.galaxytv4k.online
cloudflared tunnel route dns galaxytv admin.galaxytv4k.online
cloudflared tunnel route dns galaxytv api.galaxytv4k.online
```

### 4. Start the tunnel

```bash
cloudflared tunnel run galaxytv
```

### 5. Open your site

| URL | What |
|-----|------|
| https://www.galaxytv4k.online | Public website |
| https://admin.galaxytv4k.online | Admin dashboard |
| https://api.galaxytv4k.online/health | API health check |

**Admin login:** `superadmin@navatra.tv` / `admin123`

---

## Environment Variables

```env
# ── PostgreSQL ──
POSTGRES_DB=galaxy_tv
POSTGRES_USER=galaxy_admin
POSTGRES_PASSWORD=your-strong-password-here

# ── JWT ──
JWT_SECRET=your-random-64-char-string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7

# ── Cloudflare R2 (image storage) ──
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=news-media
R2_PUBLIC_URL=https://media.galaxytv4k.online

# ── Domain URLs ──
PUBLIC_SITE_URL=https://www.galaxytv4k.online
FRONTEND_URL=https://www.galaxytv4k.online
ADMIN_URL=https://admin.galaxytv4k.online
```

---

## Database

PostgreSQL runs in Docker with persistent volumes. The backend auto-runs
migrations and seeds on every boot (safe upserts).

### Demo users

| Email | Password | Role |
|-------|----------|------|
| superadmin@navatra.tv | admin123 | SUPER_ADMIN |
| admin@navatra.tv | admin123 | ADMIN |
| editor@navatra.tv | editor123 | EDITOR |
| author@navatra.tv | author123 | AUTHOR |

### Schema

Key models: `User`, `Article`, `Category`, `Tag`, `Media`, `Advertisement`,
`SiteSettings`, `HomepageSection`, `NavigationItem`, `Comment`, `ViewLog`,
`TelegramPublication`, `ActivityLog`, `ContactMessage`, `NewsletterSubscriber`

All indexes are defined in `backend/prisma/schema.prisma`.

---

## REST API

Base URL: `/api/v1`

Every endpoint returns:
```json
{ "success": true, "data": {}, "message": "Optional" }
```

### Public endpoints

```
GET  /settings                  Site name, logo, social links
GET  /categories                Active categories
GET  /tags                      All tags
GET  /articles                  Paginated (q, category, tag, sort, page)
GET  /articles/breaking         Breaking news
GET  /articles/featured         Featured articles
GET  /articles/latest           Latest articles
GET  /articles/popular          Most viewed
GET  /articles/:slug            Single article (increments views)
GET  /articles/:slug/related    Related articles
GET  /categories/:slug/articles Category listing
GET  /authors/:id/articles      Author listing
GET  /homepage/sections         Homepage layout config
GET  /navigation                Navigation menu
GET  /ticker                    Live news ticker
GET  /ads/:position             Advertisements
GET  /sitemap.xml               SEO sitemap
```

### Auth

```
POST /auth/login     → { user, accessToken } + httpOnly refresh cookie
POST /auth/refresh   → rotates refresh token
POST /auth/logout    → revokes refresh token
GET  /auth/me        → current user
```

### Admin (Bearer token, role-gated)

```
Articles:    GET/POST/PATCH/DELETE /admin/articles
Categories:  GET/POST/PATCH/DELETE /admin/categories
Tags:        GET/POST/PATCH/DELETE /admin/tags
Media:       GET/POST/DELETE /admin/media
Users:       GET/POST/PATCH/DELETE /admin/users (ADMIN+)
Comments:    GET/PATCH/DELETE /admin/comments
Settings:    GET/PUT /admin/settings
Homepage:    GET/PUT /admin/homepage/sections
Navigation:  GET/POST/PATCH/DELETE /admin/navigation
Telegram:    GET/PUT /admin/settings/telegram, POST /test, /discover, /send
```

---

## Image System

Images are stored in **Cloudflare R2** (S3-compatible object storage).

### Upload flow

```
Admin uploads → Backend validates (MIME, size) → R2 storage
  → sharp generates variants (thumbnail, small, medium, large)
  → Metadata saved to PostgreSQL
  → Frontend displays via /media proxy (same domain, no CORS)
```

### Media proxy

All images are served through `/media/*` on the backend domain — no
cross-origin issues, Redis caching, ETag support, 304 Not Modified.

```
Browser → www.galaxytv4k.online/media/articles/photo.jpg
  → nginx → backend → R2 (or Redis cache) → image
```

---

## Caching

### 3-tier caching (images)

| Tier | TTL | Behavior |
|------|-----|----------|
| Browser | 30 days | Cache-Control: immutable + ETag/304 |
| Redis | 24 hours | Binary cache (skip >5MB images) |
| R2 Origin | — | Fetched only on cache miss |

### API caching

Public GET endpoints are cached in Redis (30s TTL) with:
- Request coalescing (dedup concurrent identical requests)
- Generation-based stale-write protection
- Targeted invalidation on admin mutations (not full flush)

### Cache invalidation

```
Admin creates/updates/deletes article
  → Redis clears: latest, popular, category feed, article detail, sitemap
  → Next public request fetches fresh data from PostgreSQL
```

---

## Performance Optimizations

### Backend
- ✅ Response compression (gzip) — 79% reduction on API responses
- ✅ Lightweight article serializer — skips full HTML content in list endpoints
- ✅ Request logging with response times + slow query detection (>200ms)
- ✅ Request ID tracking (X-Request-Id header) for distributed tracing
- ✅ Redis cache with generation-based stale-write protection
- ✅ Database indexes on all hot query paths

### Frontend
- ✅ Route-level lazy loading (all views)
- ✅ Global article link prefetching on hover (instant navigation)
- ✅ IntersectionObserver animations (v-reveal directive)
- ✅ Lazy-loaded images with skeleton placeholders
- ✅ Design tokens (CSS variables) system
- ✅ Mobile-first responsive design

### Infrastructure
- ✅ Multi-stage Docker builds with layer caching
- ✅ Production-only node_modules in runtime images
- ✅ Comprehensive .dockerignore (smaller build context)
- ✅ HEALTHCHECK on all services
- ✅ nginx server_tokens hidden

---

## Monitoring

```
GET /health       → Full health (database, redis, r2 status)
GET /api/live     → Liveness probe (always 200 if process running)
GET /api/ready    → Readiness probe (200 only if DB reachable)
```

### Request logging

Every request is logged with:
- Unique request ID (UUID)
- Method, URL, status code
- Response time (ms)
- Slow request flag (>500ms)
- Client IP and user agent

---

## Backups

Automated PostgreSQL backups run daily at 02:00 UTC via the `backup` service.

```bash
# List backups
docker compose exec backup ls -lh /backups/

# Manual backup
docker compose run --rm backup sh -c '/usr/local/bin/backup.sh'

# Restore latest
docker compose run --rm backup sh -c 'gunzip -c /backups/$(ls -t /backups/galaxy_tv_*.sql.gz | head -1 | xargs basename) | psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB'
```

Backups are compressed (gzip), stored for 30 days, and auto-pruned.

---

## Daily Commands

```bash
# Start everything
docker compose up -d

# After code changes
docker compose up -d --build

# Start tunnel (separate terminal)
cloudflared tunnel run galaxytv

# View logs
docker compose logs -f backend
docker compose logs -f backup

# Stop everything
docker compose down

# Stop but keep data (volumes persist)
docker compose down
```

---

## Folder Structure

```text
project/
├── frontend/             Public news website (Vue 3)
│   ├── src/
│   │   ├── components/   Layout, cards, editorial grids, ads
│   │   ├── views/        Home, Article, Category, Search, News
│   │   ├── composables/  useSeo, useReveal, usePrefetch, useTheme
│   │   ├── services/     API clients
│   │   ├── stores/       Pinia (settings, categories)
│   │   ├── styles/       Design tokens, responsive system
│   │   └── router/       Lazy-loaded routes
│   ├── Dockerfile
│   └── nginx.conf
│
├── admin/                Editorial CMS (Vue 3 + Tailwind)
│   ├── src/
│   │   ├── views/        Dashboard, Articles, Categories, Media, Settings
│   │   ├── components/   TipTap editor, modals, image uploader
│   │   ├── services/     API clients
│   │   └── stores/       Pinia (auth, toast)
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/              REST API (Express + Prisma)
│   ├── src/
│   │   ├── controllers/  HTTP handlers (public + admin)
│   │   ├── services/     Business logic
│   │   ├── middleware/    Auth, cache, rate limit, request logger
│   │   ├── lib/          Prisma, Redis, R2, logger
│   │   ├── routes/       REST routes + media proxy
│   │   └── validators/   Zod schemas
│   ├── prisma/
│   │   ├── schema.prisma Database schema
│   │   ├── seed.ts       Demo data
│   │   └── migrations/   PostgreSQL migrations
│   └── Dockerfile
│
├── scripts/              backup.sh, restore.sh
├── cloudflared/          Tunnel config
├── docs/                 Documentation
├── backups/              PostgreSQL backups (gitignored)
├── docker-compose.yml    All 6 services
├── .env                  Environment config (gitignored)
└── .env.example          Template
```

---

## Documentation

| File | Description |
|------|-------------|
| `docs/README.md` | Project overview |
| `docs/system-architecture.md` | Architecture diagrams |
| `docs/homepage-layout-system.md` | 10 editorial layouts |
| `docs/admin-guide.md` | Complete admin manual |
| `docs/api-reference.md` | All REST endpoints |
| `docs/multi-image-content.md` | Per-image metadata guide |
| `docs/image-management.md` | R2 + NewsImage component |
| `docs/database.md` | All tables and fields |
| `docs/deployment.md` | Deployment guide |
| `docs/environment.md` | All env variables |
| `docs/security.md` | Security practices |
| `docs/troubleshooting.md` | Common issues + fixes |
| `docs/GUIDE-DEPLOY.md` | Step-by-step deployment |
| `docs/deployment-local-docker.md` | Docker + Tunnel setup |

---

## License

Private — Galaxy TV V4K
