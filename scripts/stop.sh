#!/usr/bin/env bash
set -euo pipefail

echo "== Stop Bar Radio =="
sudo systemctl stop bar-radio || echo "bar-radio service not stopped."
