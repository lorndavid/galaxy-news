#!/bin/sh
# ============================================================
# Automated PostgreSQL Backup Script for Galaxy TV V4K
# ============================================================
# Runs daily inside a Docker container.
# Backups are stored in the shared volume: /backups
# Each backup is named: galaxy_tv_YYYYMMDD_HHMMSS.sql.gz
# Keeps the last 30 backups (auto-prunes older ones).
#
# Usage (manual):
#   docker compose run --rm backup
#
# Scheduled:
#   Runs automatically at 2:00 AM UTC every day via cron.
# ============================================================

set -e

# ── Configuration ──
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/galaxy_tv_${TIMESTAMP}.sql.gz"
KEEP_DAYS=30

echo "════════════════════════════════════════════"
echo "  PostgreSQL Backup — ${TIMESTAMP}"
echo "════════════════════════════════════════════"

# ── Create backup directory if it doesn't exist ──
mkdir -p "${BACKUP_DIR}"

# ── Run pg_dump and compress ──
echo "[1/3] Dumping database..."
pg_dump \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -F p \
  | gzip > "${BACKUP_FILE}"

# ── Verify the backup ──
FILESIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null || echo "0")
if [ "${FILESIZE}" -lt 100 ]; then
  echo "❌ ERROR: Backup file is too small (${FILESIZE} bytes) — something went wrong!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

echo "[2/3] Backup created: ${BACKUP_FILE}"
echo "       Size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# ── Prune old backups ──
echo "[3/3] Pruning backups older than ${KEEP_DAYS} days..."
find "${BACKUP_DIR}" -name "galaxy_tv_*.sql.gz" -mtime +${KEEP_DAYS} -delete -print 2>/dev/null | while read -r f; do
  echo "  Deleted: $(basename "$f")"
done

# ── Summary ──
TOTAL=$(find "${BACKUP_DIR}" -name "galaxy_tv_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
echo ""
echo "════════════════════════════════════════════"
echo "  ✅ Backup complete!"
echo "  File: ${BACKUP_FILE}"
echo "  Size: $(du -h "${BACKUP_FILE}" | cut -f1)"
echo "  Total backups: ${TOTAL}"
echo "  Total size: ${TOTAL_SIZE}"
echo "════════════════════════════════════════════"
