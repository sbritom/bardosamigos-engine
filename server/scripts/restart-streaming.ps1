$ErrorActionPreference = "Stop"

& "$PSScriptRoot\stop-streaming.ps1"
Start-Sleep -Seconds 2
& "$PSScriptRoot\start-streaming.ps1"
