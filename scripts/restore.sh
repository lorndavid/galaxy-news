#!/bin/sh
# ============================================================
# PostgreSQL Restore Script for Galaxy TV V4K
# ============================================================
# Restores the database from a backup file.
#
# Usage:
#   List available backups:
#     docker compose run --rm backup sh -c 'ls -lh /backups/galaxy_tv_*.sql.gz'
#
#   Restore latest backup:
#     docker compose run --rm backup sh -c 'gunzip -c /backups/LATEST_FILE.sql.gz | psql -U $POSTGRES_USER -d $POSTGRES_DB'
#
#   Restore specific backup:
#     docker compose run --rm backup sh -c 'gunzip -c /backups/galaxy_tv_YYYYMMDD_HHMMSS.sql.gz | psql -U $POSTGRES_USER -d $POSTGRES_DB'
# ============================================================

set -e

BACKUP_DIR="/backups"

echo "════════════════════════════════════════════"
echo "  PostgreSQL Restore"
echo "════════════════════════════════════════════"

# ── List available backups ──
echo ""
echo "Available backups:"
echo "──────────────────"
ls -lhS "${BACKUP_DIR}"/galaxy_tv_*.sql.gz 2>/dev/null || echo "  No backups found!"
echo ""

# ── Find latest backup ──
LATEST=$(ls -t "${BACKUP_DIR}"/galaxy_tv_*.sql.gz 2>/dev/null | head -1)

if [ -z "${LATEST}" ]; then
  echo "❌ No backup files found in ${BACKUP_DIR}"
  exit 1
fi

echo "Latest backup: $(basename "${LATEST}")"
echo "Size: $(du -h "${LATEST}" | cut -f1)"
echo ""
echo "⚠️  WARNING: This will OVERWRITE the current database!"
echo "    Press Enter to continue, or Ctrl+C to abort."
read -r

# ── Restore ──
echo ""
echo "Restoring from: $(basename "${LATEST}")"
gunzip -c "${LATEST}" | psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --quiet

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ Restore complete!"
echo "════════════════════════════════════════════"
