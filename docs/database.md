# Database Documentation

## Overview

Galaxy TV V4K uses **SQLite** via **Prisma ORM** for structured data storage.

## Tables

### User
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| name | String | Display name |
| email | String (unique) | Login email |
| passwordHash | String | bcrypt hash |
| role | String | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR |
| avatar | String? | Avatar URL |
| isActive | Boolean | Account enabled |

### Article
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| title | String | Khmer title (required) |
| titleEn | String? | English title |
| titleZh | String? | Chinese title |
| slug | String (unique) | URL slug |
| excerpt | String? | Short description |
| excerptEn | String? | English excerpt |
| excerptZh | String? | Chinese excerpt |
| content | String | Khmer HTML content |
| contentEn | String? | English content |
| contentZh | String? | Chinese content |
| featuredImage | String? | Featured image URL |
| categoryId | Int (FK) | Category reference |
| authorId | Int (FK) | Author reference |
| status | String | DRAFT, PUBLISHED, SCHEDULED, ARCHIVED |
| isFeatured | Boolean | Featured flag |
| isBreaking | Boolean | Breaking news flag |
| views | Int | View counter |
| galleryColumns | Int | Gallery grid columns (2-4) |
| publishedAt | DateTime? | Publication date |

### ArticleImage
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| articleId | Int (FK) | Article reference |
| mediaId | Int (FK) | Media reference |
| altText | String? | Accessibility text |
| caption | String? | Image caption |
| title | String? | Per-image title |
| description | String? | Per-image description |
| cropPosition | String? | center/top/bottom/left/right |
| sortOrder | Int | Display order |

### Category
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| name | String | Khmer name |
| nameEn | String? | English name |
| nameZh | String? | Chinese name |
| slug | String (unique) | URL slug |
| description | String? | Khmer description |
| descriptionEn | String? | English description |
| descriptionZh | String? | Chinese description |
| color | String? | Category accent color |
| isActive | Boolean | Visible on site |
| sortOrder | Int | Display order |

### Media
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| objectKey | String? | MinIO object key |
| url | String | Image URL |
| fileName | String | Original filename |
| width | Int? | Image width (px) |
| height | Int? | Image height (px) |
| format | String? | jpg, png, webp |
| size | Int? | File size (bytes) |
| altText | String? | Default alt text |
| caption | String? | Default caption |
| folder | String | articles, categories, ads, etc. |

### SiteSettings
Single-row table for all site configuration including theme, ticker, Telegram, fonts, social links.

### HomepageSection
| Column | Type | Description |
|--------|------|-------------|
| id | Int (PK) | Auto-increment |
| key | String (unique) | Section identifier |
| label | String | Display name |
| enabled | Boolean | Visible on homepage |
| sortOrder | Int | Section order |
| config | String? | JSON: layoutType, columns, sidebar, articleLimit |

### Advertisement
Banner ad management with position, device targeting, and priority.

### NavigationItem
Menu items with type (home, category, page, link), sort order, and active status.

## Relationships

```
User ──< Article (author)
Category ──< Article
Article ──< ArticleTag >── Tag
Article ──< ArticleImage >── Media
Article ──< Comment
Article ──< ViewLog
Article ──< TelegramPublication
User ──< Media (creator)
```

## Indexes

Key indexes for performance:
- `Article`: slug, status+publishedAt, categoryId, authorId, views, isFeatured, isBreaking
- `Category`: slug, isActive+sortOrder
- `Advertisement`: position+isActive, position+device+isActive
- `ViewLog`: viewedAt, articleId+viewedAt

## Migrations

All migrations are in `backend/prisma/migrations/`. Run with:
```bash
npx prisma migrate dev       # Development
npx prisma migrate deploy    # Production
```

## Backup

SQLite database file: `backend/dev.db` (or `/app/data/dev.db` in Docker)

```bash
# Copy the file
cp backend/dev.db backup-$(date +%Y%m%d).db

# Docker
docker compose cp backend:/app/data/dev.db ./backup.db
```
