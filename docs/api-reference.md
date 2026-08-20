# API Reference

Base URL: `http://localhost:4000/api`

## Public Endpoints

### Settings
```
GET /settings
```
Returns site settings (name, logo, theme, etc.)

### Categories
```
GET /categories
```
Returns all active categories.

### Tags
```
GET /tags
```
Returns all tags.

### Homepage Sections
```
GET /homepage/sections
```
Returns enabled homepage sections with layout config.

### Navigation
```
GET /navigation
```
Returns active navigation items.

### Live Ticker
```
GET /ticker
```
Returns ticker data (enabled, speed, articles).

### Advertisements
```
GET /ads/:position
```
Returns active ads for a position.

### Articles — List
```
GET /articles?page=1&pageSize=12&category=slug&tag=slug&q=search&sort=latest|popular
```

### Articles — Featured
```
GET /articles/featured?limit=5
```

### Articles — Latest
```
GET /articles/latest?limit=12
```

### Articles — Popular
```
GET /articles/popular?limit=5
```

### Articles — Breaking
```
GET /articles/breaking
```

### Article — By Slug
```
GET /articles/:slug
```
Returns single article with author, category, tags, images. Increments view count.

### Article — Related
```
GET /articles/:slug/related?limit=6
```
Returns related articles by category/tags.

### Category Articles
```
GET /categories/:slug/articles?page=1
```

### Author Articles
```
GET /authors/:id/articles?page=1&pageSize=12
```

### Comments
```
GET /comments?articleId=1
POST /comments { articleId, name, email, content }
```

### Contact
```
POST /contact { name, email, subject, message }
```

### Newsletter
```
POST /newsletter { email }
```

## Admin Endpoints

All admin endpoints require JWT authentication via `Authorization: Bearer <token>`.

### Auth
```
POST /auth/login { email, password }
POST /auth/refresh { refreshToken }
POST /auth/logout
GET /auth/me
```

### Articles CRUD
```
GET    /admin/articles?page=1&q=search&status=DRAFT
GET    /admin/articles/:id
POST   /admin/articles { title, titleEn, titleZh, content, ... }
PUT    /admin/articles/:id { ... }
DELETE /admin/articles/:id
```

### Article Images
```
GET    /admin/articles/:id/images
POST   /admin/articles/:id/images { mediaId, altText, caption, title, description, cropPosition, sortOrder }
PATCH  /admin/articles/:id/images/:imageId { altText, caption, title, description, cropPosition, sortOrder }
DELETE /admin/articles/:id/images/:imageId
```

### Categories CRUD
```
GET    /admin/categories
POST   /admin/categories { name, nameEn, nameZh, slug, description, ... }
PUT    /admin/categories/:id { ... }
DELETE /admin/categories/:id
```

### Homepage Builder
```
GET    /admin/homepage/sections
PUT    /admin/homepage/sections { sections: [{ key, enabled, label, config }] }
POST   /admin/homepage/sections/reorder { order: [{ key, sortOrder }] }
```

### Navigation Builder
```
GET    /admin/navigation
POST   /admin/navigation { label, type, value, ... }
PUT    /admin/navigation/:id { ... }
POST   /admin/navigation/reorder { order: [{ id, sortOrder }] }
DELETE /admin/navigation/:id
```

### Media Library
```
GET    /admin/media?page=1&pageSize=60&q=search
POST   /admin/media (multipart: file, altText, caption, folder)
DELETE /admin/media/:id
```

### Settings
```
GET    /admin/settings
PUT    /admin/settings { siteName, primaryColor, ... }
```

### Tags
```
GET    /admin/tags
POST   /admin/tags { name, nameEn }
DELETE /admin/tags/:id
```

### Users
```
GET    /admin/users
POST   /admin/users { name, email, password, role }
PUT    /admin/users/:id { ... }
DELETE /admin/users/:id
```

### Telegram
```
POST /admin/telegram/send/:articleId
GET  /admin/telegram/publications/:articleId
```

## Response Format

All responses follow:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Errors:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "...", "message": "..." }]
}
```

## Pagination

Paginated responses include:
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 12,
  "total": 100,
  "totalPages": 9
}
```
