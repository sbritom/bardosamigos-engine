#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "== Bar Radio install =="
command -v node >/dev/null || { echo "Node.js not found"; exit 1; }
command -v npm >/dev/null || { echo "NPM not found"; exit 1; }
command -v git >/dev/null || { echo "Git not found"; exit 1; }
command -v curl >/dev/null || { echo "Curl not found"; exit 1; }
command -v ffmpeg >/dev/null || echo "Warning: FFmpeg not found"
command -v icecast2 >/dev/null || command -v icecast >/dev/null || echo "Warning: Icecast not found"
command -v systemctl >/dev/null || echo "Warning: systemd not found"

mkdir -p server/logs server/backups server/cache server/storage/media/covers server/storage/media/cache
npm install --include=optional
npm run build
npm run deploy:health

echo "Install check finished."
echo "To install systemd service: sudo cp scripts/bar-radio.service /etc/systemd/system/bar-radio.service"
