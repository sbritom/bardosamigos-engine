#!/usr/bin/env bash
set -euo pipefail

echo "Parando Bar Streaming Engine..."
pkill -f "server/src/stream.js" || true
