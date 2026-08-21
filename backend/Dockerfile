# ============================================================
# Galaxy TV V4K — Backend (Express + Prisma + PostgreSQL)
# ============================================================
# Multi-stage build. Build context is repo ROOT (docker-compose.yml).
# Layer cache: deps stage is cached until package.json changes.
# ============================================================

FROM node:20-slim AS base
WORKDIR /app

# ── Stage 1: Install dependencies (cached layer) ─────────────
FROM base AS deps
COPY backend/package.json ./package.json
RUN npm install --no-audit --no-fund \
    && npm cache clean --force

# ── Stage 2: Build (compile + generate) ──────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./backend/
COPY assets/ ./assets/
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# ── Stage 3: Production runtime (smallest image) ─────────────
FROM base AS runtime
ENV NODE_ENV=production

# Prisma query engine + R2 TLS need OpenSSL
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
       openssl libssl3 ca-certificates curl \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Production-only node_modules
COPY --from=deps /app/node_modules ./node_modules

# Compiled output
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/src ./src
COPY --from=build /app/assets ./assets

# Local upload fallback storage
RUN mkdir -p /app/uploads
VOLUME /app/uploads
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -sf http://localhost:4000/health || exit 1

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && node dist/server.js"]
