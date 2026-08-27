param(
  [string]$InstallDir = "$PSScriptRoot\..\bin\ffmpeg"
)

$ErrorActionPreference = "Stop"

Write-Host "== Bar Radio Engine: FFmpeg Windows installer =="

if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
  Write-Host "FFmpeg ja esta disponivel no PATH."
  ffmpeg -version | Select-Object -First 1
  exit 0
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Write-Host "FFmpeg nao encontrado no PATH."
Write-Host "Instale pelo winget, Chocolatey, ou baixe em https://www.gyan.dev/ffmpeg/builds/"
Write-Host "Depois configure config/ffmpeg.json executablePath ou adicione ffmpeg ao PATH."
Write-Host "Diretorio preparado: $InstallDir"
