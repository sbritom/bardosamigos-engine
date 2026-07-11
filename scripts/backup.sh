#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

BACKUP_DIR="server/backups/bar-radio-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "== Backup Bar Radio =="
cp -a config "$BACKUP_DIR/config" 2>/dev/null || true
cp -a server/cache "$BACKUP_DIR/cache" 2>/dev/null || true
cp -a server/storage/media/covers "$BACKUP_DIR/covers" 2>/dev/null || true
cp -a server/storage/media/cache "$BACKUP_DIR/media-cache" 2>/dev/null || true
cp -a server/playlists "$BACKUP_DIR/playlists" 2>/dev/null || true
npm run deploy:backup >/dev/null || true

echo "Backup created at $BACKUP_DIR"
