# Debian-slim (not alpine) because Prisma's query engine needs a full
# OpenSSL install; alpine lacks the OpenSSL 3 compat layer and the
# schema engine crashes at runtime.
#
# Build context is the repo ROOT (see docker-compose.yml) so the seed's
# demo images (assets/img/...) are included for seeded articles.
FROM node:20-slim AS base
WORKDIR /app

# Backend package has no own lockfile (workspace deps are hoisted at root),
# so install from package.json instead of npm ci.
FROM base AS deps
COPY backend/package.json ./package.json
RUN npm install --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./backend/
COPY assets/ ./assets/
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
# Prisma's query engine + R2 TLS require updated OpenSSL/libssl3
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates curl && update-ca-certificates && rm -rf /var/lib/apt/lists/*
# node_modules was installed at /app (deps stage) — copy from there.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/package.json ./package.json
# The seed imports ../src/constants from prisma/seed.ts, so src must be present.
COPY --from=build /app/backend/src ./src
# Seed demo images (the seed copies them into /app/uploads/seed).
COPY --from=build /app/assets ./assets
# Local upload fallback storage (persisted via docker volume)
RUN mkdir -p /app/uploads
VOLUME /app/uploads
EXPOSE 4000
# Apply migrations and seed demo data (all upserts, so re-running is
# safe on every boot), then start the API. DATABASE_URL points at the
# persistent sqlite volume, so data survives container restarts.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && node dist/server.js"]
