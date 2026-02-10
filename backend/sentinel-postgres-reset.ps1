# Direct PostgreSQL Reset - Sentinel Mode

Write-Host "🔧 SENTINEL DIRECT POSTGRESQL RESET" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red

# Kill PostgreSQL processes
Write-Host "🛑 Terminating PostgreSQL processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM postgres.exe 2>$null
    taskkill /F /IM pg_ctl.exe 2>$null
    Write-Host "✅ Processes terminated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No processes to terminate" -ForegroundColor Yellow
}

# Force remove PostgreSQL directories
Write-Host "🗑️  Removing PostgreSQL directories..." -ForegroundColor Yellow
$dirs = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:APPDATA\postgresql",
    "$env:LOCALAPPDATA\postgresql"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "Removing: $dir" -ForegroundColor Gray
        try {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "⚠️  Could not remove $dir" -ForegroundColor Yellow
        }
    }
}

# Clean registry
Write-Host "🧹 Cleaning registry entries..." -ForegroundColor Yellow
try {
    Remove-Item -Path "HKLM:\SOFTWARE\PostgreSQL" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "HKLM:\SOFTWARE\Wow6432Node\PostgreSQL" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Registry cleaned" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Registry cleanup incomplete" -ForegroundColor Yellow
}

# Download fresh PostgreSQL
Write-Host "⬇️  Downloading PostgreSQL 16..." -ForegroundColor Yellow
$url = "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe"
$installer = "$env:TEMP\postgresql-sentinel.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    Write-Host "✅ Download complete" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    exit 1
}

# Silent install with known credentials
Write-Host "🚀 Installing PostgreSQL with SENTINEL credentials..." -ForegroundColor Yellow
Write-Host "   Username: postgres" -ForegroundColor Gray
Write-Host "   Password: sentinel2024" -ForegroundColor Gray

$installArgs = @(
    "--mode", "unattended",
    "--unattendedmodeui", "none",
    "--superpassword", "sentinel2024",
    "--servicepassword", "sentinel2024",
    "--serviceaccount", "NT AUTHORITY\NetworkService",
    "--install_runtimes", "0"
)

try {
    Start-Process -FilePath $installer -ArgumentList $installArgs -Wait
    Write-Host "✅ PostgreSQL installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed: $_" -ForegroundColor Red
    exit 1
}

# Test installation
Write-Host "🧪 Testing SENTINEL installation..." -ForegroundColor Yellow
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $psqlPath = "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
}

if (Test-Path $psqlPath) {
    try {
        $env:PGPASSWORD = "sentinel2024"
        $result = & $psqlPath -U postgres -h localhost -c "SELECT version();" -t -A
        if ($result) {
            Write-Host "✅ PostgreSQL connection successful" -ForegroundColor Green
            
            # Create database
            & $psqlPath -U postgres -h localhost -c "CREATE DATABASE caribe_digital;" -ErrorAction SilentlyContinue
            Write-Host "✅ Database 'caribe_digital' created" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Connection test failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ psql.exe not found" -ForegroundColor Red
    exit 1
}

# Update .env with SENTINEL credentials
Write-Host "📝 Updating .env with SENTINEL credentials..." -ForegroundColor Yellow
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $content = $content -replace 'DB_USERNAME=.*', 'DB_USERNAME=postgres'
    $content = $content -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=sentinel2024'
    $content = $content -replace 'EMERGENCY_MODE=true', 'EMERGENCY_MODE=false'
    $content | Set-Content $envFile
    Write-Host "✅ .env updated with SENTINEL credentials" -ForegroundColor Green
}

# Cleanup
Remove-Item $installer -Force -ErrorAction SilentlyContinue

Write-Host "`n🎯 SENTINEL POSTGRESQL RESET COMPLETE!" -ForegroundColor Green
Write-Host "Credentials:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 5432" -ForegroundColor Gray
Write-Host "  Username: postgres" -ForegroundColor Gray
Write-Host "  Password: sentinel2024" -ForegroundColor Gray
Write-Host "  Database: caribe_digital" -ForegroundColor Gray
Write-Host "`n🚀 Ready to start backend!" -ForegroundColor Green