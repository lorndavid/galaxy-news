# Image Management

## Overview

Images are stored in **MinIO** (S3-compatible object storage) with metadata in SQLite via Prisma.

## Upload Flow

```
Admin selects file
  → Frontend validates (type, size)
  → API receives multipart upload
  → Backend validates MIME type
  → MinIO stores object
  → Media record created in SQLite
  → Returns URL + metadata to admin
```

## Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

## Image Folders

| Folder | Usage |
|--------|-------|
| articles | Article featured images + gallery |
| categories | Category header images |
| authors | Author avatars |
| ads | Advertisement banners |
| site | Logo, favicon |

## Per-Image Metadata

Each gallery image can have independent:
- **Title** — heading for the image
- **Description** — detailed text
- **Alt text** — accessibility
- **Caption** — credit/note below image
- **Crop position** — center, top, bottom, left, right

## Image Component

The `NewsImage.vue` component provides:
- Consistent aspect ratios (16:9, 4:3, 1:1)
- Lazy loading with IntersectionObserver
- Skeleton loading state
- Error fallback
- Configurable crop position via `object-position`
- Hover scale animation (disabled on touch)

### Usage

```vue
<NewsImage
  :src="article.featuredImage"
  :alt="article.title"
  aspect-ratio="16/9"
  crop-position="center"
  variant="standard"
  :width="640"
/>
```

### Variants

| Variant | Use Case |
|---------|----------|
| hero | Large hero images |
| standard | Default card images |
| compact | Smaller grid cards |
| thumbnail | Sidebar thumbnails |
| full | Full-width article images |

## Responsive Behavior

Images use `object-fit: cover` to maintain consistent dimensions regardless of original aspect ratio. The `cropPosition` property controls what part of the image remains visible.

## Fallback Chain

```
MinIO object URL
  → Local disk fallback (backend/uploads)
  → Default logo image (/assets/img/logo/logo1.png)
```
