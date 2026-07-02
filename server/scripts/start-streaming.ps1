$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\..\.."
Set-Location $root

Write-Host "Iniciando Bar Streaming Engine..."
npm run stream
