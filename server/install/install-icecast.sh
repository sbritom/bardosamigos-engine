#!/usr/bin/env bash
set -euo pipefail

echo "== Bar Radio Engine: Icecast Ubuntu installer =="

if command -v icecast2 >/dev/null 2>&1 || command -v icecast >/dev/null 2>&1; then
  echo "Icecast ja esta instalado."
  exit 0
fi

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y icecast2
  echo "Copie server/config/icecast.xml para /etc/icecast2/icecast.xml quando for ativar em producao."
else
  echo "apt-get nao encontrado. Instale Icecast manualmente para sua distribuicao."
  exit 1
fi
