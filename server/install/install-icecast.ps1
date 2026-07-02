param(
  [string]$InstallDir = "$PSScriptRoot\..\bin\icecast"
)

$ErrorActionPreference = "Stop"

Write-Host "== Bar Radio Engine: Icecast Windows installer =="

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

if (Get-Command icecast -ErrorAction SilentlyContinue) {
  Write-Host "Icecast ja esta disponivel no PATH."
  exit 0
}

Write-Host "Icecast nao encontrado no PATH."
Write-Host "Baixe o instalador Windows em https://icecast.org/download/"
Write-Host "Copie ou aponte o executavel para: $InstallDir"
Write-Host "Configuracao pronta em server/config/icecast.xml"
