# ============================================================
# Galaxy TV V4K — Admin Dashboard (Vue 3 + Vite + nginx)
# ============================================================
# Multi-stage build for layer caching.
# ============================================================

# ── Stage 1: Install dependencies (cached layer) ─────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# ── Stage 2: Build Vue app ───────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# ── Stage 3: Production nginx ────────────────────────────────
FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i 's/^http {/http {\n    server_tokens off;/' /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -sf http://localhost/ || wget -qO- http://localhost/ || exit 1
