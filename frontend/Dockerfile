# ============================================================
# Galaxy TV V4K — Frontend (Vue 3 + Vite + nginx)
# ============================================================
# Multi-stage build for layer caching:
#   1. deps  — install node_modules (cached when package.json unchanged)
#   2. build — compile Vue app
#   3. nginx — serve static files
# ============================================================

# ── Stage 1: Install dependencies (cached layer) ─────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package.json for faster dependency install
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

# ── Stage 2: Build Vue app ───────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install ALL deps (including dev) for TypeScript compilation
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy source (deps are already cached above)
COPY . .

# Build with production API base URL
ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# ── Stage 3: Production nginx ────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: hide nginx version
RUN sed -i 's/^http {/http {\n    server_tokens off;/' /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -sf http://localhost/ || wget -qO- http://localhost/ || exit 1
