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
├── backend/         REST API + database — Node.js + Express + TypeScript + Prisma + PostgreSQL
│
├── package.json     Workspace scripts
├── .env.example
├── docker-compose.yml
└── README.md
```

```text
Admin CMS  ──►  REST API  ──►  Prisma  ──►  PostgreSQL
                                        │
Public website  ◄──  REST API  ◄────────┘
```

There is **one source of truth** (the database). Content created or edited in
the admin CMS appears on the public website immediately. No fake/static copies.

---

## Technology stack

| Layer    | Technologies |
|----------|--------------|
| Frontend | Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Vue Router, Pinia, Axios |
| Admin    | Vue 3, TypeScript, Vite, Vue Router, Pinia, Tailwind CSS, TipTap (rich text editor), Lucide icons |
| Backend  | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Docker), Zod validation, JWT auth, bcrypt, Helmet, CORS, rate limiting, structured logging (pino) |
| Storage  | Cloudinary for images (optional — falls back to local `/uploads` when not configured) |

---

## Folder structure

```text
backend/
├── src/
│   ├── config/        env validation
│   ├── controllers/   thin HTTP handlers (public + admin)
│   ├── services/      business logic
│   ├── routes/        REST route definitions
│   ├── middleware/    auth, RBAC, validation, upload, rate limiting, errors
│   ├── validators/    Zod schemas
│   ├── lib/           prisma, logger, storage (Cloudinary/local), auth/JWT
│   ├── utils/         ApiError, respond, paginate, slugify, sanitize
│   ├── app.ts         express app assembly
│   └── server.ts      bootstrap
├── prisma/
│   ├── schema.prisma
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

Copy the example file and fill in the values:

```bash
cp .env.example .env        # root — used by docker-compose
cp backend/.env.example backend/.env
```

`backend/.env`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET=<long random string>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7

# Optional — without these, images are stored locally under backend/uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

Never commit `.env` files. `JWT_SECRET` and Cloudinary secrets must stay
server-side only.

---

## Database setup

The database is **PostgreSQL running in Docker** (no local DB install needed):

```bash
docker compose up -d db        # start PostgreSQL on localhost:5432 (healthy check included)
cp .env.example .env           # set POSTGRES_USER/PASSWORD/DB (root .env)
cp backend/.env.example backend/.env   # set DATABASE_URL etc.
```

Then apply the schema and insert demo data (from `backend/`):

```bash
npm run prisma:migrate    # create & apply the PostgreSQL schema
npm run prisma:seed       # insert demo data
```

The seed creates:

- **Users**: `superadmin@navatra.tv / admin123`, `admin@navatra.tv / admin123`,
  `editor@navatra.tv / editor123`, `author@navatra.tv / author123`
- **Categories**: ព័ត៌មានជាតិ, នយោបាយ, អន្តរជាតិ, បច្ចេកវិទ្យា, សុខភាព, កម្សាន្ត, កីឡា
- **Tags, articles, site settings, an advertisement, sample comments**

All seed data is clearly demo data — reset it anytime with
`npm run prisma:seed`.

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
| API      | http://localhost:4000/api/v1 | `/health` for a quick check |

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

- **PostgreSQL** → runs in the `db` container (data in the `postgres_data` named volume)
- **Backend** → http://localhost:4000 (uploads in a named volume)
- **Public site** → http://localhost:3000
- **Admin CMS** → http://localhost:3001

Set `JWT_SECRET` (and Cloudinary vars if used) in your environment or `.env`
before running. The backend container runs `prisma migrate deploy` on startup
and connects to the `db` service.

> Local dev mode (`npm run dev`) connects to the same Docker PostgreSQL on
> `localhost:5432` — so you can develop with hot-reload while the database
> lives in Docker. Don't run both `npm run dev` and the Docker stack at the
> same time: they both bind the API port 4000.

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

GET    /admin/media                  media library (paginated)
POST   /admin/media/upload           multipart image upload (≤5MB, jpg/png/webp/gif/svg)
DELETE /admin/media/:id

GET    /admin/users                  user management           (ADMIN+)
POST/PATCH/DELETE /admin/users/:id

GET    /admin/comments               comment moderation (write: EDITOR+)
PATCH  /admin/comments/:id           approve / reject
DELETE /admin/comments/:id

GET    /admin/messages               contact messages          (ADMIN+)
DELETE /admin/messages/:id

GET    /admin/ads                    advertisement CRUD        (write: EDITOR+)
```

### Permissions

- **SUPER_ADMIN / ADMIN** — everything.
- **EDITOR** — articles, categories, tags, media, comments, ads.
- **AUTHOR** — create/edit/delete only their own articles (enforced server-side).

---

## Cloudinary

1. Create a Cloudinary account and note `cloud_name`, `api_key`, `api_secret`.
2. Put them in `backend/.env`.
3. Uploads are then stored in Cloudinary (folder `navatra`); metadata (public id,
   dimensions, format, size, alt text) is saved in PostgreSQL.
4. Without credentials the app transparently falls back to local storage under
   `backend/uploads` — nothing breaks.

The Cloudinary secret is **never** exposed to the Vue frontends; only the
backend talks to Cloudinary.

---

## Security

- Helmet security headers, permissive CORS only for configured origins
- Rate limiting on the API and stricter limits on auth routes
- JWT access tokens (short-lived) + rotating httpOnly refresh cookies
- bcrypt password hashing; passwords never serialized to clients
- Zod validation on every body/query/param; content sanitized server-side (XSS)
- RBAC enforced in middleware **and** in services (not only in the UI)
- File uploads restricted by MIME type and size
- SQL injection prevented by the Prisma query layer
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
- API pagination everywhere + database indexes on hot fields
- Cloudinary auto-format/quality transformations when enabled
- Lightweight carousels (no heavy slider dependency) in the public site

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `PrismaClientInitializationError` | Start the DB first (`docker compose up -d db`); then run `npm run prisma:migrate`; check `DATABASE_URL` in `backend/.env` |
| `ECONNREFUSED 5432` | The PostgreSQL container isn't running — `docker compose up -d db`, then wait for it to be `healthy` |
| Prisma OpenSSL error in Docker | The backend image is `node:20-slim` with `openssl` installed and the schema declares `binaryTargets = ["native", "debian-openssl-3.0.x"]` — rebuild with `docker compose build backend` if you changed it |
| Seed fails | Run `npm run prisma:migrate` first, then `npm run prisma:seed` |
| Images 404 | Without Cloudinary, uploads live in `backend/uploads` (volume in Docker). Confirm `/uploads/...` is proxied. |
| 401 on admin | Re-login (tokens expire in 15 min); the refresh cookie rotates automatically |
| Ports busy | Change `PORT` in `backend/.env`; update the Vite proxy targets in `frontend/vite.config.ts` / `admin/vite.config.ts` |
| Khmer text shows as `?` in terminals | Cosmetic — data is stored correctly (UTF-8); browsers render it fine |
