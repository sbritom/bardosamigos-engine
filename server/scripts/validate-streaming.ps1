$ErrorActionPreference = "Continue"

$root = Resolve-Path "$PSScriptRoot\..\.."
$icecastConfig = Join-Path $root "server\config\icecast.xml"
$ffmpegConfig = Join-Path $root "config\ffmpeg.json"
$musicFolder = Join-Path $root "server\radio\music"
$logsFolder = Join-Path $root "server\logs"
$port = 8000

Write-Host "== Validacao da infraestrutura de streaming =="

$checks = @()

$checks += [pscustomobject]@{ Name = "Icecast config"; Ok = Test-Path $icecastConfig; Detail = $icecastConfig }
$checks += [pscustomobject]@{ Name = "FFmpeg config"; Ok = Test-Path $ffmpegConfig; Detail = $ffmpegConfig }
$checks += [pscustomobject]@{ Name = "Music folder"; Ok = Test-Path $musicFolder; Detail = $musicFolder }
$checks += [pscustomobject]@{ Name = "Logs folder"; Ok = Test-Path $logsFolder; Detail = $logsFolder }
$checks += [pscustomobject]@{ Name = "FFmpeg installed"; Ok = [bool](Get-Command ffmpeg -ErrorAction SilentlyContinue); Detail = "ffmpeg no PATH ou config/ffmpeg.json" }
$checks += [pscustomobject]@{ Name = "Icecast installed"; Ok = [bool](Get-Command icecast -ErrorAction SilentlyContinue); Detail = "icecast no PATH ou instalacao manual" }

$portBusy = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
$checks += [pscustomobject]@{ Name = "Porta $port livre"; Ok = -not [bool]$portBusy; Detail = "Icecast usa porta $port" }

foreach ($check in $checks) {
  $mark = if ($check.Ok) { "OK" } else { "PENDENTE" }
  Write-Host "[$mark] $($check.Name) - $($check.Detail)"
}

if ($checks.Where({ -not $_.Ok }).Count -gt 0) {
  Write-Host "Validacao concluida com pendencias."
  exit 1
}

Write-Host "Validacao concluida com sucesso."
