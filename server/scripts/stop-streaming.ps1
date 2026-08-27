$ErrorActionPreference = "Continue"

Write-Host "Parando processos Node da Bar Streaming Engine..."
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force
Write-Host "Solicitacao de parada enviada."
