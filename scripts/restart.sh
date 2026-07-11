#!/usr/bin/env bash
set -euo pipefail

echo "== Restart Bar Radio =="
sudo systemctl restart icecast2 || echo "icecast2 service not restarted."
sudo systemctl restart bar-radio || echo "bar-radio service not restarted."
sudo systemctl status bar-radio --no-pager || true
