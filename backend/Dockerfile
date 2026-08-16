# Debian-slim (not alpine) because Prisma's query engine needs a full
# OpenSSL install; alpine lacks the OpenSSL 3 compat layer and the
# schema engine crashes at runtime.
FROM node:20-slim AS base
WORKDIR /app

# Monorepo note: dependencies are hoisted at the workspace root, so this
# package has no own lockfile — install from package.json instead of npm ci.
FROM base AS deps
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
# Prisma's query engine requires OpenSSL at runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
# Local upload fallback storage (persisted via docker volume)
RUN mkdir -p /app/uploads
VOLUME /app/uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
