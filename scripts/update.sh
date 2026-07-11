#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "== Bar Radio update =="
git pull --ff-only
npm install --include=optional
npm run build
npm run deploy:health
sudo systemctl restart bar-radio || echo "bar-radio service not restarted; systemd may be unavailable."
