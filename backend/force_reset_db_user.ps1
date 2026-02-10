$ErrorActionPreference = "Stop"

Write-Host "🔄 Attempting to reset 'devuser' password on local PostgreSQL..." -ForegroundColor Cyan

# Try standard locations for psql
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $psqlPath = "psql" # Hope it's in PATH
}

$env:PGPASSWORD = "postgres" # Try default password first

try {
    # 1. Check if we can connect as postgres
    Write-Host "1. Testing connection as 'postgres'..."
    & $psqlPath -U postgres -h localhost -c "SELECT 1;" 2>&1 | Out-Null
    Write-Host "   ✅ Connection successful." -ForegroundColor Green
    
    # 2. Update devuser password
    Write-Host "2. Updating 'devuser' password to 'devpassword'..."
    $sql = "ALTER USER devuser WITH PASSWORD 'devpassword';"
    & $psqlPath -U postgres -h localhost -c $sql
    Write-Host "   ✅ Password updated." -ForegroundColor Green

    # 3. Create database if not exists
    Write-Host "3. Creating database 'caribe_digital' if missing..."
    $sqlDb = "SELECT 'CREATE DATABASE caribe_digital' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'caribe_digital')\gexec"
    & $psqlPath -U postgres -h localhost -c $sqlDb
    Write-Host "   ✅ Database check complete." -ForegroundColor Green

}
catch {
    Write-Host "❌ Failed to connect or update. Detailed error:" -ForegroundColor Red
    Write-Host $_
    
    Write-Host "`n⚠️  MANUAL INTERVENTION REQUIRED ⚠️" -ForegroundColor Yellow
    Write-Host "The local PostgreSQL password for 'postgres' is NOT 'postgres'."
    Write-Host "Please update the .env file with the correct password or run this SQL manually:"
    Write-Host "ALTER USER devuser WITH PASSWORD 'devpassword';" -ForegroundColor Cyan
}
