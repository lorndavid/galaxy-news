# Galaxy TV V4K — News Platform Documentation

Professional editorial news platform built with Vue 3 + Express.js + SQLite.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for production stack)
- pnpm or npm

### Development

```bash
# Install dependencies
cd frontend && npm install
cd ../admin && npm install
cd ../backend && npm install

# Setup database
cd backend
cp .env.example .env
npx prisma migrate dev
npx prisma db seed

# Start services
cd backend && npm run dev      # API on :4000
cd frontend && npm run dev     # Public site on :5173
cd admin && npm run dev        # Admin CMS on :5174
```

### Docker (Full Stack)

```bash
docker compose up -d
```

- Frontend: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000
- MinIO Console: http://localhost:9001

## Default Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@galaxy-tv.kh | admin123 | SUPER_ADMIN |

## Documentation Index

| Document | Description |
|----------|-------------|
| [System Architecture](./system-architecture.md) | High-level architecture and data flow |
| [Frontend Architecture](./frontend-architecture.md) | Vue 3 components, layouts, design system |
| [Backend Architecture](./backend-architecture.md) | Express.js API, services, middleware |
| [Database](./database.md) | Prisma schema, tables, migrations |
| [API Reference](./api-reference.md) | All REST endpoints |
| [Homepage Layout System](./homepage-layout-system.md) | Editorial grid engine documentation |
| [Multi-Image Content](./multi-image-content.md) | Per-image metadata system |
| [Image Management](./image-management.md) | MinIO upload, cropping, metadata |
| [Admin Guide](./admin-guide.md) | Complete admin user manual |
| [Deployment](./deployment.md) | Production deployment guide |
| [Environment](./environment.md) | All environment variables |
| [Security](./security.md) | Security practices |
| [Troubleshooting](./troubleshooting.md) | Common issues and solutions |
