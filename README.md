# Navatra 4K TV — News Platform

A modern, production-grade full-stack news platform rebuilt from the original
static HTML/CSS/JS website of **Navatra 4K TV** (a Cambodian digital news
channel). The public-facing visual identity — layout, grid, colors, typography,
cards, header, footer — is preserved from the original site, while the entire
underlying technology has been modernized into three connected applications.

```
Same visual identity + modern technology + real database + professional CMS
```

---

## Architecture

Three separate applications in one monorepo (npm workspaces):

```text
news-platform/
│
├── frontend/        Public news website  — Vue 3 + TypeScript + Vite + Pinia + Vue Router
├── admin/           Content management  — Vue 3 + TypeScript + Vite + Tailwind + TipTap
├── backend/         REST API + database — Node.js + Express + TypeScript + Prisma + SQLite
│
├── package.json     Workspace scripts
├── .env.example
├── docker-compose.yml
└── README.md
```

```text
                    ┌─────────────────────┐
                    │     PUBLIC USER      │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │     VUE FRONTEND    │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │   EXPRESS BACKEND   │
                    └─────────┬─┬─┬───────┘
                              │ │ │
                  ┌───────────┘ │ └────────────┐
                  ▼             ▼              ▼
              SQLite          Redis           MinIO
              Prisma          Cache        Object Storage
                  ▲                            ▲
                  │                            │
                  └──────────┬─────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   ADMIN VUE      │
                    │  PROFESSIONAL CMS │
                    └──────────────────┘
```

There is **one source of truth** (the database). Content created or edited in
the admin CMS appears on the public website immediately. No fake/static copies.

---

## Technology stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Vue Router, Pinia, Axios |
| Admin    | Vue 3, TypeScript, Vite, Vue Router, Pinia, Tailwind CSS, TipTap (rich text editor), Lucide icons |
| Backend  | Node.js, Express, TypeScript, Prisma ORM, **SQLite**, Zod validation, JWT auth, bcrypt, Helmet, CORS, rate limiting, structured logging (pino) |
| Cache    | **Redis** (Docker) — API/homepage caching with transparent in-memory fallback |
| Storage  | **MinIO** (Docker, S3-compatible) — media with server-side image variants (sharp). Falls back to local `/uploads` when unavailable |

---

## Folder structure

```text
backend/
├── src/
│   ├── config/        env validation
│   ├── controllers/   thin HTTP handlers (public + admin)
│   ├── services/      business logic
│   ├── routes/        REST route definitions
│   ├── middleware/    auth, RBAC, validation, upload, cache, rate limiting, errors
│   ├── validators/    Zod schemas
│   ├── lib/           prisma, logger, storage (MinIO/local), redis, auth/JWT
│   ├── utils/         ApiError, respond, paginate, slugify, sanitize
│   ├── app.ts         express app assembly (+ /health with dependency checks)
│   └── server.ts      bootstrap (+ MinIO bucket bootstrap)
├── prisma/
│   ├── schema.prisma
│   ├── dev.db         SQLite database file (gitignored)
│   └── seed.ts        demo data (categories, tags, articles, users, settings, ads)
└── uploads/           local image fallback storage (gitignored)

frontend/src/
├── components/        layout, article cards, sidebar, ads, common states
├── views/             Home, Article, Category, Search, Author, News list, About, Contact, 404
├── stores/            Pinia (settings, categories)
├── services/          typed API clients
├── composables/       useSeo (dynamic meta/OG tags)
├── router/
└── types/

admin/src/
├── layouts/           AdminLayout (sidebar + topbar)
├── views/             Login, Dashboard, Articles, Article editor, Categories, Tags,
│                      Media, Users, Comments, Messages, Ads, Settings, Activity, Profile
├── components/        ui kit (Modal, Toast, Pagination, StatusBadge, ConfirmDialog), TipTap editor
├── services/          typed API clients
├── stores/            Pinia (auth, toast)
└── router/            with auth guards + permission-based visibility
```

---

## Installation

Requirements: **Node.js ≥ 18** and npm.

```bash
npm install          # installs all workspaces (backend, frontend, admin)
```

### Environment variables

Copy the example files and fill in the values:

```bash
cp .env.example .env                 # root — used by docker-compose
cp backend/.env.example backend/.env # backend
```

`backend/.env`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"          # SQLite file database
JWT_SECRET=<long random string>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7

REDIS_URL=redis://localhost:6379      # Redis cache (Docker)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=navatra
MINIO_SECRET_KEY=navatra_dev_secret
MINIO_BUCKET=news-media
MINIO_PUBLIC_URL=/minio               # serve objects through the API proxy

FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

Never commit `.env` files. `JWT_SECRET`, `MINIO_SECRET_KEY` and Redis
credentials must stay server-side only.

---

## Database setup

SQLite needs no server — the file lives at `backend/prisma/dev.db`
(gitignored). Docker keeps it on a persistent volume so data survives
container restarts.

```bash
npm run prisma:migrate    # create & apply the SQLite schema
npm run prisma:seed       # insert demo data
```

The seed creates:

- **Users**: `superadmin@navatra.tv / admin123`, `admin@navatra.tv / admin123`,
  `editor@navatra.tv / editor123`, `author@navatra.tv / author123`
- **Categories**: ព័ត៌មានជាតិ, នយោបាយ, អន្តរជាតិ, បច្ចេកវិទ្យា, សុខភាព, កម្សាន្ត, កីឡា
- **Tags, articles, site settings, an advertisement, sample comments**

All seed data is clearly demo data — reset it anytime with `npm run prisma:seed`.

---

## Development

Run all three applications at once (backend :4000, frontend :5173, admin :5174):

```bash
npm run dev
```

Or individually:

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:admin
```

| App      | URL                          | Notes |
|----------|------------------------------|-------|
| Public   | http://localhost:5173        | Vite dev server, proxies `/api` → :4000 |
| Admin    | http://localhost:5174        | Vite dev server, proxies `/api` → :4000 |
| API      | http://localhost:4000/api/v1 | `/health` reports db/redis/minio status |

Optional: start Redis + MinIO for caching/media during local development:

```bash
docker compose up -d redis minio
```

Without them the app degrades gracefully: Redis caching falls back to an
in-memory cache and image uploads fall back to local disk. Everything still works.

---

## Production build

```bash
npm run build       # typechecks + builds backend, frontend, admin
npm run start       # runs the compiled backend (serves the API)
```

Built frontend/admin output goes to `frontend/dist` and `admin/dist`. Serve
them with any static host (or the provided nginx configs in Docker).

---

## Docker

```bash
docker compose up --build
```

- **SQLite** → `sqlite_data` named volume (file DB, not a network service)
- **Redis** → http://localhost:6379 (`redis_data` volume, AOF persistence)
- **MinIO** → API :9000, console :9001 (`minio_data` volume, `news-media` bucket)
- **Backend** → http://localhost:4000 (`uploads_data` volume for local fallback)
- **Public site** → http://localhost:3000
- **Admin CMS** → http://localhost:3001

The backend container runs `prisma migrate deploy` + `prisma db seed`
(idempotent) on startup, then starts the API. MinIO images are streamed
through the backend at `/minio/...` so the frontends never need direct
access to MinIO.

---

## REST API

Base URL: `/api/v1` — every endpoint returns a consistent envelope:

```json
{ "success": true, "data": { }, "message": "Optional message" }
```

### Public (no auth)

```
GET  /settings                     site name/logo/social links
GET  /categories                   active categories
GET  /tags                         all tags
GET  /articles                     paginated list (q, category, tag, sort, page…)
GET  /articles/breaking            breaking-news ticker items
GET  /articles/featured            featured articles (hero)
GET  /articles/latest              latest articles
GET  /articles/popular             most-viewed articles
GET  /articles/:slug               single article (increments views)
GET  /articles/:slug/related       related by category/tags
GET  /categories/:slug/articles    category listing (paginated)
GET  /authors/:id/articles         author listing (paginated)
GET  /ads/:position                active ads for a slot
POST /comments                     submit a comment (pending moderation)
POST /contact                      send a contact message
GET  /sitemap.xml                  SEO sitemap
GET  /robots.txt                   robots file
```

### Auth

```
POST /auth/login       { email, password } → { user, accessToken } + httpOnly refresh cookie
POST /auth/refresh     rotates the refresh token
POST /auth/logout      revokes the refresh token
GET  /auth/me          current user
PATCH /auth/me         update name / avatar / password
```

### Admin (Bearer token, role-gated)

```
GET    /admin/stats                  dashboard aggregates + recent activity
GET    /admin/activity               activity log            (ADMIN+)
GET/PUT /admin/settings              site settings           (ADMIN+)

GET    /admin/articles               list with q/status/category filters
GET    /admin/articles/:id
POST   /admin/articles               create (title, excerpt, content, categoryId, tags, image, status…)
PATCH  /admin/articles/:id           update any field / publish / schedule
DELETE /admin/articles/:id

GET    /admin/categories             categories CRUD (+ reorder)   (write: EDITOR+)
GET    /admin/tags                   tags CRUD                      (write: EDITOR+)

GET    /admin/media                  media library (paginated, folder filter)
POST   /admin/media/upload           multipart image upload (≤8MB, jpg/png/webp/gif/svg)
DELETE /admin/media/:id

GET    /admin/users                  user management           (ADMIN+)
POST/PATCH/DELETE /admin/users/:id

GET    /admin/comments               comment moderation (write: EDITOR+)
PATCH  /admin/comments/:id           approve / reject
DELETE /admin/comments/:id

GET    /admin/messages               contact messages          (ADMIN+)
DELETE /admin/messages/:id

GET    /admin/ads                    advertisement CRUD        (write: EDITOR+)

GET    /admin/settings/telegram            Telegram settings (token masked)     (ADMIN+)
PUT    /admin/settings/telegram            save & verify (getMe + every getChat) (ADMIN+)
POST   /admin/settings/telegram/test       test connection without saving       (ADMIN+)
POST   /admin/settings/telegram/discover   list chats the bot has seen (getUpdates) (ADMIN+)
GET    /admin/telegram/stats               published/pending/failed counts      (ADMIN+)
GET    /admin/articles/:id/telegram        publication status (per destination)
POST   /admin/articles/:id/telegram/send   queue a send / retry (force for resend)
```

### Permissions

- **SUPER_ADMIN / ADMIN** — everything.
- **EDITOR** — articles, categories, tags, media, comments, ads.
- **AUTHOR** — create/edit/delete only their own articles (enforced server-side).

---

## MinIO object storage

1. MinIO runs in Docker (`docker compose up -d minio`) and creates the
   `news-media` bucket on backend boot.
2. Objects are namespaced by folder: `articles/`, `categories/`, `authors/`,
   `ads/`, `gallery/`, `site/` (never one flat namespace).
3. On upload, the backend validates MIME/extension/size, then `sharp`
   generates **thumbnail (300w) · small (640w) · medium (1024w) ·
   large (1600w)** WebP variants alongside the original.
4. Metadata (id, fileName, objectKey, mimeType, size, width, height,
   altText, caption, folder, createdAt) is stored in SQLite — binary files
   never live in the database.
5. Objects are served through the API proxy at `/minio/<bucket>/<key>` so
   the public site and admin never need MinIO credentials.

Without MinIO configured, uploads transparently fall back to local disk
under `backend/uploads` — nothing breaks.

---

## Redis caching

- Public GET feeds (settings, categories, articles, homepage sections, ads)
  are cached in Redis with a short TTL.
- **Cache invalidation**: every non-GET admin request clears the public
  cache, so edits, publishes and deletions appear on the website immediately.
- **Failure handling**: if Redis is unavailable the middleware falls back to
  an in-memory cache and the app keeps serving from SQLite — Redis is an
  optimization, never a single point of failure. Errors are logged.

---

## Telegram auto-publishing

Publish articles to **any number of Telegram chats automatically** — channels,
supergroups, groups and private (personal) chats — image + caption + bilingual
inline buttons. Configure once in **Admin → ប្រព័ន្ធ → Telegram**:

1. Bot token from @BotFather.
2. **Chat destinations** — add as many as you need, each with its own type
   (Channel / Supergroup / Group / Personal) and on/off toggle. A personal
   destination is the chat id of a user who pressed Start on your bot.
3. **ស្វែងរក Chats** (Discover) — reads the bot's `getUpdates` and lists every
   chat it has seen (users who started it, groups and channels where it was
   added) so you can add them as destinations in one click.
4. **Site URL** — the public site URL used for the inline button links.
   Telegram **rejects localhost/private IPs**, so set your public https
   domain here (defaults to `PUBLIC_SITE_URL`).
5. **Save & Test Connection** — the backend calls `getMe` + `getChat` for
   EVERY destination and only persists when all pass (invalid values are
   never saved).
6. Toggle **ផ្សាយដោយស្វ័យប្រវត្តិ** to auto-publish new articles, and choose
   the button language mode (both / Khmer / English).

When an article is published the API enqueues a job on a Redis-backed queue
(`tgq:telegram`); the in-process worker sends `sendPhoto` to **every enabled
destination** with an HTML caption and two inline buttons that deep-link to
the language-prefixed article URLs:

```
🇰🇭 អានជាភាសាខ្មែរ   →  /kh/news/<slug>
🇬🇧 Read in English  →  /en/news/<slug>
```

- The image is fetched server-side from MinIO (never an arbitrary URL) and
  uploaded to Telegram as multipart — no public bucket needed, no SSRF.
- The article HTTP request never waits on Telegram; status (PENDING →
  PROCESSING → PUBLISHED / FAILED) is tracked **per destination** in
  `TelegramPublication` (one row per article+chat) and shown in the article
  editor with retry + resend per chat.
- Duplicate protection: a chat that already received the article is never
  sent again; resend requires explicit confirmation. Failures retry up to 3×
  with backoff (respecting Telegram's `retry_after`).
- The bot token is stored only in the SiteSettings row, masked in admin
  responses, never exposed to the public site, never logged, and never put
  in job payloads.

The E2E suite runs against an in-repo mock Telegram API:

```bash
npm run test:e2e:telegram
```

It points the backend at `mock-telegram` (a compose service) via
`TELEGRAM_API_BASE=http://mock-telegram:8448`, exercises the full
admin → publish → sendPhoto → language-URL flow, then restores the
real-API configuration. The regular `npm run test:e2e` skips it.

---

## Health checks

```
GET /health
```

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "dependencies": { "database": "ok", "redis": "ok", "minio": "ok" }
  }
}
```

Returns `503` only when the database is down. Redis/MinIO being down is
reported but the API keeps serving.

---

## Security

- Helmet security headers, permissive CORS only for configured origins
- Rate limiting on the API and stricter limits on auth routes
- JWT access tokens (short-lived) + rotating httpOnly refresh cookies
- bcrypt password hashing; passwords never serialized to clients
- Zod validation on every body/query/param; content sanitized server-side (XSS)
- RBAC enforced in middleware **and** in services (not only in the UI)
- File uploads restricted by MIME type and size; MinIO/Redis credentials
  are only ever read server-side
- Secrets only in environment variables, never in the repository

---

## SEO

- Semantic HTML and clean slugs
- Dynamic `<title>`, meta description, Open Graph, Twitter cards, canonical URL
  (per-view via `useSeo`)
- `/sitemap.xml` and `/robots.txt` generated by the API
- Article pages emit breadcrumb + article metadata; lazy-loaded images
- Public API only exposes published articles

---

## Performance

- Lazy-loaded router chunks for both Vue apps
- Lazy-loaded images, debounced search (no request per keystroke)
- Redis caching of hot public feeds with targeted invalidation
- API pagination everywhere + database indexes on hot fields
- Server-side image variants (sharp) so the frontend never ships originals
- Lightweight carousels (no heavy slider dependency) in the public site

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `PrismaClientInitializationError` | Check `DATABASE_URL` in `backend/.env` is `file:./dev.db`; run `npm run prisma:migrate` |
| `DATABASE_URL must start with file:` | A shell/env var is overriding the `.env` value — unset it or export `DATABASE_URL=file:./dev.db` |
| Redis errors in logs | The cache falls back to in-memory automatically — start Redis (`docker compose up -d redis`) to remove the noise |
| MinIO errors in logs | Uploads fall back to local disk — start MinIO (`docker compose up -d minio`) to use object storage |
| Images 404 | Without MinIO, uploads live in `backend/uploads` (volume in Docker). Confirm `/uploads/...` or `/minio/...` is proxied. |
| 401 on admin | Re-login (tokens expire in 15 min); the refresh cookie rotates automatically |
| Ports busy | Change `PORT` in `backend/.env`; update the Vite proxy targets in `frontend/vite.config.ts` / `admin/vite.config.ts` |
| Khmer text shows as `?` in terminals | Cosmetic — data is stored correctly (UTF-8); browsers render it fine |
