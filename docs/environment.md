# Environment Variables

## Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | production/development |
| PORT | No | 4000 | API server port |
| DATABASE_URL | Yes | file:./dev.db | SQLite database path |
| JWT_SECRET | Yes | — | Secret for JWT signing |
| JWT_ACCESS_TTL | No | 24h | Access token lifetime |
| JWT_REFRESH_TTL_DAYS | No | 1 | Refresh token lifetime (days) |
| REDIS_URL | No | redis://localhost:6379 | Redis connection |
| MINIO_ENDPOINT | No | localhost | MinIO server |
| MINIO_PORT | No | 9000 | MinIO port |
| MINIO_USE_SSL | No | false | MinIO TLS |
| MINIO_ACCESS_KEY | No | navatra | MinIO username |
| MINIO_SECRET_KEY | No | navatra_dev_secret | MinIO password |
| MINIO_BUCKET | No | news-media | MinIO bucket name |
| MINIO_PUBLIC_URL | No | /minio | Public proxy URL |
| FRONTEND_URL | No | http://localhost:5173 | CORS origin |
| ADMIN_URL | No | http://localhost:5174 | CORS origin |
| TELEGRAM_API_BASE | No | https://api.telegram.org | Telegram API |
| PUBLIC_SITE_URL | No | http://localhost:3000 | Public URL for links |

## Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Yes | Backend API URL (e.g., http://localhost:4000/api) |

## Admin

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Yes | Backend API URL (e.g., http://localhost:4000/api) |

## Docker Compose

Root `.env` file controls shared settings:

| Variable | Default | Description |
|----------|---------|-------------|
| FRONTEND_URL | http://localhost:3000 | Public frontend URL |
| ADMIN_URL | http://localhost:3001 | Admin panel URL |
| PUBLIC_SITE_URL | http://localhost:3000 | Site URL for Telegram |
| MINIO_ACCESS_KEY | navatra | MinIO username |
| MINIO_SECRET_KEY | navatra_dev_secret | MinIO password |
| JWT_SECRET | change-me | JWT signing secret |

## Security Notes

- Never commit `.env` files to version control
- Generate JWT_SECRET with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Use strong MinIO credentials in production
- Set FRONTEND_URL and ADMIN_URL to your actual domain in production
