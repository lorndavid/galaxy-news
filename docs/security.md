# Security Practices

## Authentication

- JWT tokens with short-lived access tokens (15 min default)
- Refresh tokens with longer expiry (7 days)
- Tokens stored in httpOnly cookies (recommended) or localStorage
- Password hashing with bcrypt

## Authorization

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | Full access, user management |
| ADMIN | Full content access |
| EDITOR | Article create/edit, limited settings |
| AUTHOR | Own articles only |

## Input Validation

- All API inputs validated with Zod schemas
- Content sanitization for HTML (whitelist of safe tags)
- File upload validation (MIME type, size limits)

## SQL Injection

- Prevented by Prisma ORM (parameterized queries)
- No raw SQL in user-facing code

## XSS Protection

- HTML content sanitized on backend
- Vue.js auto-escapes template expressions
- CSP headers recommended for production

## CORS

Configured via `FRONTEND_URL` and `ADMIN_URL` environment variables. Only trusted origins allowed.

## Secrets Management

- JWT_SECRET: Never exposed in frontend code
- MinIO credentials: Backend only
- Telegram bot token: Stored encrypted, never exposed publicly
- Database file: Accessible only to backend service

## File Upload Security

- MIME type validation (JPEG, PNG, WebP only)
- File size limits enforced
- Object keys stored in database, not user-controlled
- Images served through MinIO proxy (no direct file system access)

## Rate Limiting

- Public API: 30-second TTL cache on read endpoints
- Admin API: No rate limiting (internal use)
- Contact/Newsletter: Server-side validation

## Production Checklist

- [ ] Change default JWT_SECRET
- [ ] Change default MinIO credentials
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Remove default admin account or change password
- [ ] Enable Redis authentication
- [ ] Restrict MinIO access
- [ ] Set secure cookie flags
- [ ] Enable CSP headers
