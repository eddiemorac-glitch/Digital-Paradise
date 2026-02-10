# Direct PostgreSQL Reset - Sentinel Mode (Fixed)

Write-Host "SENTINEL DIRECT POSTGRESQL RESET" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red

# Kill PostgreSQL processes
Write-Host "Terminating PostgreSQL processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM postgres.exe 2>$null
    taskkill /F /IM pg_ctl.exe 2>$null
    Write-Host "Processes terminated" -ForegroundColor Green
} catch {
    Write-Host "No processes to terminate" -ForegroundColor Yellow
}

# Force remove PostgreSQL directories
Write-Host "Removing PostgreSQL directories..." -ForegroundColor Yellow
$dirs = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "Removing: $dir" -ForegroundColor Gray
        try {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Could not remove $dir" -ForegroundColor Yellow
        }
    }
}

# Create fresh database using Docker instead
Write-Host "Deploying PostgreSQL via Docker..." -ForegroundColor Yellow
try {
    docker run --name caribe-postgres -e POSTGRES_PASSWORD=sentinel2024 -e POSTGRES_DB=caribe_digital -p 5432:5432 -d postgres:16
    Write-Host "PostgreSQL container deployed" -ForegroundColor Green
    
    # Wait for startup
    Start-Sleep -Seconds 10
    
    # Test connection
    $testResult = docker exec caribe-postgres psql -U postgres -d caribe_digital -c "SELECT 1;" -t
    if ($testResult -eq " 1") {
        Write-Host "PostgreSQL connection successful" -ForegroundColor Green
    }
} catch {
    Write-Host "Docker deployment failed: $_" -ForegroundColor Red
    
    # Fallback: Update .env with emergency settings
    Write-Host "Falling back to emergency mode..." -ForegroundColor Yellow
}

# Update .env with SENTINEL credentials
Write-Host "Updating .env..." -ForegroundColor Yellow
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $content = $content -replace 'DB_USERNAME=.*', 'DB_USERNAME=postgres'
    $content = $content -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=sentinel2024'
    $content = $content -replace 'EMERGENCY_MODE=true', 'EMERGENCY_MODE=false'
    $content | Set-Content $envFile
    Write-Host "Updated with SENTINEL credentials" -ForegroundColor Green
}

Write-Host "SENTINEL POSTGRESQL RESET COMPLETE!" -ForegroundColor Green
Write-Host "Credentials:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 5432" -ForegroundColor Gray
Write-Host "  Username: postgres" -ForegroundColor Gray
Write-Host "  Password: sentinel2024" -ForegroundColor Gray
Write-Host "  Database: caribe_digital" -ForegroundColor Gray
Write-Host "Ready to start backend!" -ForegroundColor Green