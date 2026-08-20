# Troubleshooting

## Common Issues

### API won't start

**Symptom**: Backend crashes on startup

**Check**:
1. Database exists: `ls backend/dev.db`
2. Migrations applied: `cd backend && npx prisma migrate status`
3. Environment variables set: `cat backend/.env`
4. Port 4000 available: `lsof -i :4000`

**Fix**:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Images not loading

**Symptom**: Broken images on public site

**Check**:
1. MinIO running: `docker compose ps minio`
2. Media records exist: Check admin Media Library
3. Object keys valid: Check MinIO console at :9001

**Fix**:
```bash
# Restart MinIO
docker compose restart minio

# Check MinIO bucket
docker compose exec minio mc ls local/
```

### Redis connection failed

**Symptom**: API works but no caching

**Check**:
1. Redis running: `docker compose ps redis`
2. Connection: `redis-cli ping`

**Fix**: API falls back to in-memory cache automatically. Redis is not critical for operation.

### Telegram not publishing

**Symptom**: Articles not sent to Telegram

**Check**:
1. Bot token configured in admin Settings
2. Chat ID configured
3. Article is published
4. Auto-publish enabled

**Fix**:
1. Go to Admin → Settings → Telegram
2. Verify bot token
3. Test with manual publish button on article page

### Frontend shows 404 for all routes

**Symptom**: All routes return page not found

**Check**:
1. Vue Router history mode configured
2. Server rewrite rules set

**Fix** (Nginx):
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Admin login fails

**Symptom**: Cannot log in to admin

**Check**:
1. Default credentials: admin@galaxy-tv.kh / admin123
2. Database seeded: Check User table

**Fix**:
```bash
cd backend
npx prisma db seed
```

### Database locked (SQLite)

**Symptom**: "database is locked" error

**Cause**: Multiple processes writing simultaneously

**Fix**:
- Ensure only one backend instance running
- Check Docker: `docker compose ps`
- Restart backend: `docker compose restart backend`

### Build fails

**Symptom**: TypeScript or Vite build errors

**Fix**:
```bash
# Frontend
cd frontend && rm -rf node_modules && npm install && npx vue-tsc --noEmit

# Admin
cd admin && rm -rf node_modules && npm install && npx vue-tsc --noEmit

# Backend
cd backend && rm -rf node_modules && npm install && npx tsc --noEmit
```

## Health Check

```bash
# API health
curl http://localhost:4000/health

# Redis
redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live
```
