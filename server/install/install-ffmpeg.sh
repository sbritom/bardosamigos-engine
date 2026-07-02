#!/usr/bin/env bash
set -euo pipefail

echo "== Bar Radio Engine: FFmpeg Ubuntu installer =="

if command -v ffmpeg >/dev/null 2>&1; then
  echo "FFmpeg ja esta instalado."
  ffmpeg -version | head -n 1
  exit 0
fi

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y ffmpeg
else
  echo "apt-get nao encontrado. Instale FFmpeg manualmente para sua distribuicao."
  exit 1
fi
