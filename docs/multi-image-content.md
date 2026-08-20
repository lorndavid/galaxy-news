# Multi-Image Content System

## Overview

Each article can have multiple gallery images with independent metadata. Every image has its own title, description, alt text, caption, and crop position.

## Per-Image Metadata

Each gallery image stores:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Heading displayed above the description |
| `description` | string | Detailed text for this specific image |
| `altText` | string | Accessibility text for screen readers |
| `caption` | string | Small text shown below the image |
| `cropPosition` | string | Object-position: center, top, bottom, left, right |
| `sortOrder` | number | Display order within the gallery |

## Database Schema

```prisma
model ArticleImage {
  id           Int      @id @default(autoincrement())
  articleId    Int
  mediaId      Int
  altText      String?
  caption      String?
  title        String?     // Per-image title
  description  String?     // Per-image description
  cropPosition String?     @default("center")
  sortOrder    Int         @default(0)
}
```

## Admin Workflow

### Adding Gallery Images

1. Open article editor (edit mode)
2. Scroll to **Gallery Images** section in the sidebar
3. Click **Add Image** → Select from media library
4. Configure each image:
   - Enter **title** (e.g., "Government meeting")
   - Enter **description** (e.g., "Officials discussed border policy...")
   - Enter **alt text** for accessibility
   - Enter **caption** (e.g., "Photo: News Team")
   - Select **crop position** (center, top, bottom, left, right)
5. Reorder images with up/down arrows
6. Save the article

### Grid Layout Selection

Choose how gallery images display in the article:
- **2 columns** — Side by side
- **3 columns** — Standard grid
- **4 columns** — Compact grid

## Frontend Rendering

Gallery images render in the article page with consistent aspect ratios (16:9 default). Each image shows:
- Image with specified crop position
- Title (if set)
- Description (if set)
- Caption (if set)

## Responsive Behavior

- **Desktop**: Multi-column grid (2-4 columns based on setting)
- **Tablet**: 2 columns
- **Mobile**: Single column, full-width images

## API Endpoints

```
GET    /api/admin/articles/:id/images          — List all images
POST   /api/admin/articles/:id/images          — Add image
PATCH  /api/admin/articles/:id/images/:imgId   — Update metadata
DELETE /api/admin/articles/:id/images/:imgId   — Remove image
```

## Image Storage

Images are stored in MinIO (S3-compatible) under the `articles` folder. The `ArticleImage` model links to a `Media` record which contains the actual URL and dimensions.

```
Article → ArticleImage → Media → MinIO Object
```
