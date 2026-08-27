#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ICECAST_CONFIG="$ROOT/server/config/icecast.xml"
FFMPEG_CONFIG="$ROOT/config/ffmpeg.json"
MUSIC_FOLDER="$ROOT/server/radio/music"
LOGS_FOLDER="$ROOT/server/logs"
PORT="${ICECAST_PORT:-8000}"
FAILED=0

check() {
  local name="$1"
  local command="$2"
  if eval "$command"; then
    echo "[OK] $name"
  else
    echo "[PENDENTE] $name"
    FAILED=1
  fi
}

echo "== Validacao da infraestrutura de streaming =="

check "Icecast config" "[ -f '$ICECAST_CONFIG' ]"
check "FFmpeg config" "[ -f '$FFMPEG_CONFIG' ]"
check "Music folder" "[ -d '$MUSIC_FOLDER' ]"
check "Logs folder" "[ -d '$LOGS_FOLDER' ]"
check "FFmpeg installed" "command -v ffmpeg >/dev/null 2>&1"
check "Icecast installed" "command -v icecast2 >/dev/null 2>&1 || command -v icecast >/dev/null 2>&1"
check "Porta $PORT livre" "! (command -v ss >/dev/null 2>&1 && ss -ltn | grep -q ':$PORT ')"

if [ "$FAILED" -ne 0 ]; then
  echo "Validacao concluida com pendencias."
  exit 1
fi

echo "Validacao concluida com sucesso."
