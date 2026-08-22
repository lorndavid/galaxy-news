# Facebook Live Stream Management

## Overview

The Live Stream system allows administrators to manage Facebook Live videos from the Admin Dashboard and display them on the public news website.

## Admin Workflow

1. **Admin Dashboard → Live Streams → Add Live Stream**
2. Paste a Facebook Live URL
3. Add Khmer/English title and description
4. Optionally upload a thumbnail image
5. Set schedule, status, visibility, homepage display
6. Preview → Publish/Activate

## Database

### LiveStream Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `titleKh` | String | Khmer title (required) |
| `titleEn` | String? | English title |
| `descriptionKh` | String? | Khmer description |
| `descriptionEn` | String? | English description |
| `facebookUrl` | String | Facebook Live/Video URL |
| `thumbnailUrl` | String? | Thumbnail image URL |
| `status` | String | DRAFT \| SCHEDULED \| LIVE \| ENDED \| DISABLED |
| `visibility` | String | HOMEPAGE \| PAGE_ONLY \| HIDDEN |
| `isHomepage` | Boolean | Show on homepage |
| `isFeatured` | Boolean | Featured stream |
| `displayOrder` | Int | Sort order |
| `startAt` | DateTime? | Scheduled start time |
| `endAt` | DateTime? | Scheduled end time |

## API Endpoints

### Admin (requires authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/live-streams` | List all streams |
| GET | `/api/admin/live-streams/:id` | Get one stream |
| POST | `/api/admin/live-streams` | Create stream |
| PATCH | `/api/admin/live-streams/:id` | Update stream |
| DELETE | `/api/admin/live-streams/:id` | Delete stream |
| PATCH | `/api/admin/live-streams/:id/status` | Change status |
| PATCH | `/api/admin/live-streams/:id/homepage` | Toggle homepage visibility |

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/live-streams` | All public streams |
| GET | `/api/v1/live-streams/active` | Currently active streams |
| GET | `/api/v1/live-streams/homepage` | Homepage featured stream |

## Facebook URL Handling

- Validates URL belongs to Facebook domains (`facebook.com`, `fb.watch`)
- Normalizes mobile URLs to desktop format
- Converts to Facebook embeddable format for iframe display
- Frontend and backend both validate URLs

## Security

- Only authenticated administrators can create/edit/delete streams
- Public users can only read published streams
- No raw HTML rendering (no `v-html` with admin content)
- Facebook URLs are validated against approved domains only

## Redis Caching

Public streams are cached for 30 seconds with targeted invalidation:
- `pub/api/v1/live-streams` — All public streams
- `pub/api/v1/live-streams/active` — Active streams
- `pub/api/v1/live-streams/homepage` — Homepage stream

Cache is invalidated when:
- Stream created/updated/deleted
- Status changed
- Homepage visibility changed

## Homepage Integration

When `isHomepage = true` AND `status = LIVE`, the stream appears on the homepage via the `LiveStreamBanner` component, displayed between the hero section and more news section.

## Frontend Pages

- `/live` — Dedicated live streams page showing active, upcoming, and past streams
- Homepage — Live banner for active homepage streams

## Effective Status

The backend calculates effective public status:
- If `startAt > now` → SCHEDULED
- If `endAt < now` → ENDED
- Otherwise → follows the stored status (LIVE, DRAFT, etc.)

## Responsive Design

- Live player uses 16:9 responsive aspect ratio
- Mobile: full-width player, stacked layout
- Desktop: full-width player with metadata below
- Reduced motion: animations disabled for the live dot indicator

## Troubleshooting

### Stream not showing on homepage
- Check `isHomepage = true`
- Check `status = LIVE`
- Check `visibility = HOMEPAGE`
- Flush Redis: `docker compose exec -T redis redis-cli FLUSHALL`

### Facebook player not loading
- Verify URL is a valid Facebook Live/Video URL
- Check if the video is still accessible on Facebook
- The fallback shows a message with a link to the Facebook page

### Cache not updating
- The 30s TTL will eventually expire
- Or manually flush: `docker compose exec -T redis redis-cli FLUSHALL`
