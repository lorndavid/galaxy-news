# System Architecture

## Overview

Galaxy TV V4K is a professional news platform with three separate applications sharing a common backend API.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER / EDITOR                            │
│                          │       │                              │
│                    Browser     Browser                          │
│                          │       │                              │
└──────────────────────────┼───────┼──────────────────────────────┘
                           │       │
                    ┌──────▼──┐ ┌──▼───────┐
                    │Public   │ │ Admin    │
                    │Frontend │ │ CMS      │
                    │(Vue 3)  │ │ (Vue 3)  │
                    └────┬────┘ └────┬─────┘
                         │           │
                    ┌────▼───────────▼─────┐
                    │    Express.js API     │
                    │    (Node.js/TS)       │
                    └──┬────────┬────────┬──┘
                       │        │        │
              ┌────────▼──┐ ┌──▼────┐ ┌─▼──────────┐
              │  SQLite   │ │ Redis │ │   MinIO    │
              │ (Prisma)  │ │ Cache │ │  (Media)   │
              └───────────┘ └───────┘ └────────────┘
```

## Application Architecture

### Frontend (Public Website)
- **Framework**: Vue 3 + TypeScript + Vite
- **State**: Pinia stores (settings, locale, categories)
- **Routing**: Vue Router with language prefix support (/kh, /en, /zh)
- **Styling**: Scoped CSS with design tokens (CSS custom properties)
- **Editorial Engine**: 10 layout components with smart fallback

### Admin CMS
- **Framework**: Vue 3 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide icons
- **Features**: Article CRUD, Category CRUD, Homepage Builder, Media Library, Settings, Telegram Publishing

### Backend API
- **Runtime**: Node.js + Express.js + TypeScript
- **ORM**: Prisma with SQLite
- **Auth**: JWT (access + refresh tokens)
- **Image Storage**: MinIO (S3-compatible) with local disk fallback
- **Caching**: Redis with in-memory fallback
- **Queue**: Telegram auto-publishing

## Data Flow

```
Admin → API → Validation → Prisma → SQLite → Response → Frontend
                                         ↕
                                        Redis (cache)
                                         ↕
                                        MinIO (images)
```

## Language System

Three languages supported with fallback chain:
1. **Khmer (kh)** — Primary/default
2. **English (en)** — Fallback for Chinese
3. **Chinese (zh)** — Falls back to English

Content fields per article: `title`, `titleEn`, `titleZh`, `excerpt`, `excerptEn`, `excerptZh`, `content`, `contentEn`, `contentZh`

## Homepage Section Model

Each homepage section has:
- `key` — unique identifier (hero, video, cat-{slug}, etc.)
- `label` — display name
- `enabled` — show/hide toggle
- `sortOrder` — section ordering
- `config` — JSON with layout options (layoutType, columns, sidebar, articleLimit)

## Security

- JWT authentication for admin routes
- Role-based access control (SUPER_ADMIN, ADMIN, EDITOR, AUTHOR)
- Input validation with Zod schemas
- File upload validation (type, size)
- CORS configuration
- SQL injection prevention via Prisma parameterized queries
- XSS protection via content sanitization
