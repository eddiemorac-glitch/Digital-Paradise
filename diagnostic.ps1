# ==========================================
# CARIBE DIGITAL CR - SYSTEM DIAGNOSTIC v6.0
# ==========================================
# Author: Sentinel-7
# Purpose: Instant Health Check for Backend, Frontend, and Infrastructure.

$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Print-Header($text) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " $text" -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan
}

function Print-Status($item, $status, $details) {
    $color = if ($status -eq "OK" -or $status -eq "UP") { "Green" } else { "Red" }
    Write-Host "[$status] $item" -ForegroundColor $color -NoNewline
    if ($details) { Write-Host " - $details" -ForegroundColor Gray } else { Write-Host "" }
}

Clear-Host
Print-Header "SYSTEM DIAGNOSTIC INITIATED..."

# 1. DOCKER CHECK
# ------------------------------------------
Print-Header "INFRASTRUCTURE (DOCKER)"
$dockerStats = docker ps --format "{{.Names}} - {{.Status}}"
if ($dockerStats) {
    $dockerStats | ForEach-Object {
        Print-Status $_.Split("-")[0].Trim() "UP" $_.Split("-")[1].Trim()
    }
}
else {
    Print-Status "Docker Engine" "DOWN" "No running containers found!"
}

# 2. BACKEND CHECK
# ------------------------------------------
Print-Header "BACKEND (NestJS)"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    if ($response.status -eq "ok") {
        Print-Status "Health API" "OK" "Response Time: $($response.response_time_ms)ms"
        Print-Status "Database" $response.services.database.ToUpper()
        Print-Status "Redis Cache" $response.services.cache.ToUpper()
        Print-Status "System" "UP" "Mem: $($response.system.memory_rss_mb)MB | Uptime: $($response.system.uptime_seconds)s"
    }
    else {
        Print-Status "Health API" "FAIL" "Status returned: $($response.status)"
    }
}
catch {
    Print-Status "Backend Connection" "DOWN" "Could not connect to http://localhost:3000"
}

# 3. FRONTEND CHECK
# ------------------------------------------
Print-Header "FRONTEND (Vite/React)"
try {
    $req = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 5
    if ($req.StatusCode -eq 200) {
        Print-Status "Web Server" "OK" "Running on Port 5173"
    }
    else {
        Print-Status "Web Server" "WARN" "Status Code: $($req.StatusCode)"
    }
}
catch {
    Print-Status "Frontend Connection" "DOWN" "Could not connect to http://localhost:5173"
}

Print-Header "DIAGNOSTIC COMPLETE"
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
