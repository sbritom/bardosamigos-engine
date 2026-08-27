#!/usr/bin/env bash
set -euo pipefail

echo "== Start Bar Radio =="
sudo systemctl start icecast2 || echo "icecast2 service not started."
sudo systemctl start bar-radio || echo "bar-radio service not started."
sudo systemctl status bar-radio --no-pager || true
