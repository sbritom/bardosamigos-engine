#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

BACKUP_DIR="${1:-}"
if [[ -z "$BACKUP_DIR" || ! -d "$BACKUP_DIR" ]]; then
  echo "Usage: scripts/restore.sh <backup-directory>"
  exit 1
fi

echo "== Restore Bar Radio =="
echo "Stopping service before restore."
sudo systemctl stop bar-radio || true

cp -a "$BACKUP_DIR/config/." config/ 2>/dev/null || true
cp -a "$BACKUP_DIR/cache/." server/cache/ 2>/dev/null || true
cp -a "$BACKUP_DIR/covers/." server/storage/media/covers/ 2>/dev/null || true
cp -a "$BACKUP_DIR/media-cache/." server/storage/media/cache/ 2>/dev/null || true
cp -a "$BACKUP_DIR/playlists/." server/playlists/ 2>/dev/null || true

sudo systemctl start bar-radio || true
npm run deploy:health
