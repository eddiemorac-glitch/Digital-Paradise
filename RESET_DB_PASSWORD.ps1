
# RESET_DB_PASSWORD.ps1
# Run this as Administrator to reset the Postgres password

Write-Host "🔒 Caribe Digital - Database Password Reset Tool" -ForegroundColor Cyan
Write-Host "------------------------------------------------"

# Check for Admin privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ Error: You must run this script as Administrator!" -ForegroundColor Red
    Write-Host "👉 Right-click this file and select 'Run with PowerShell', then accept the Admin prompt." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Define paths
$pgPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$pgData = "C:\Program Files\PostgreSQL\16\data"
$pgHba = "$pgData\pg_hba.conf"
$pgHbaBak = "$pgData\pg_hba.conf.bak"

if (-not (Test-Path $pgPath)) {
    Write-Host "❌ PostgreSQL not found at $pgPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

# 1. Backup pg_hba.conf
Write-Host "📦 Backing up configuration..."
Copy-Item $pgHba -Destination $pgHbaBak -Force

# 2. Set to TRUST mode
Write-Host "🔓 Temporarily enabling passwordless access..."
$hbaContent = Get-Content $pgHba
$newContent = $hbaContent -replace "scram-sha-256", "trust" -replace "md5", "trust"
Set-Content $pgHba -Value $newContent

# 3. Reload Config
Write-Host "🔄 Reloading Postgres configuration..."
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" reload -D $pgData

# 4. Wait for reload
Start-Sleep -Seconds 2

# 5. Reset Password
Write-Host "🔑 Resetting 'postgres' password to 'postgres'..."
& $pgPath -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Password successfully reset!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Failed to reset password." -ForegroundColor Yellow
}

# 6. Restore Config
Write-Host "🔒 Restoring security configuration..."
Copy-Item $pgHbaBak -Destination $pgHba -Force

# 7. Reload Config Again
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" reload -D $pgData

Write-Host "------------------------------------------------"
Write-Host "🎉 DONE! The backend should now work." -ForegroundColor Green
Read-Host "Press Enter to finish"
