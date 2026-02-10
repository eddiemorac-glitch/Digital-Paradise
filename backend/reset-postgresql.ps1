# PostgreSQL Reset Script for Caribe Digital
# Will reinstall PostgreSQL with known credentials

Write-Host "🔄 PostgreSQL Reset - Caribe Digital" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: Must run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green

# Stop PostgreSQL service
Write-Host "`n🛑 Stopping PostgreSQL services..." -ForegroundColor Yellow
try {
    Stop-Service -Name "*postgresql*" -Force -ErrorAction SilentlyContinue
    Stop-Service -Name "*postgres*" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Services stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No services to stop" -ForegroundColor Yellow
}

# Remove existing PostgreSQL installations
Write-Host "`n🗑️  Removing existing PostgreSQL..." -ForegroundColor Yellow
$uninstallPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
)

foreach ($path in $uninstallPaths) {
    $postgresApps = Get-ItemProperty $path -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like "*PostgreSQL*" }
    foreach ($app in $postgresApps) {
        Write-Host "Removing: $($app.DisplayName)" -ForegroundColor Gray
        try {
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/x $($app.PSChildName) /quiet /qn" -Wait
        } catch {
            Write-Host "⚠️  Could not uninstall automatically" -ForegroundColor Yellow
        }
    }
}

# Clean up remaining directories
Write-Host "`n🧹 Cleaning directories..." -ForegroundColor Yellow
$dirsToClean = @(
    "C:\Program Files\PostgreSQL",
    "C:\Program Files (x86)\PostgreSQL",
    "$env:APPDATA\postgresql"
)

foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Write-Host "Removing: $dir" -ForegroundColor Gray
        try {
            Remove-Item -Path $dir -Recurse -Force
        } catch {
            Write-Host "⚠️  Could not remove $dir" -ForegroundColor Yellow
        }
    }
}

# Download and install PostgreSQL
Write-Host "`n⬇️  Downloading PostgreSQL 16..." -ForegroundColor Yellow
$url = "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe"
$installer = "$env:TEMP\postgresql-installer.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    Write-Host "✅ Download complete" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    exit 1
}

# Install PostgreSQL with known credentials
Write-Host "`n🚀 Installing PostgreSQL with credentials:" -ForegroundColor Yellow
Write-Host "   Username: postgres" -ForegroundColor Gray
Write-Host "   Password: caribe2024" -ForegroundColor Gray

$installArgs = @(
    "--mode", "unattended",
    "--unattendedmodeui", "none",
    "--superpassword", "caribe2024",
    "--servicepassword", "caribe2024",
    "--serviceaccount", "NT AUTHORITY\NetworkService"
)

try {
    Start-Process -FilePath $installer -ArgumentList $installArgs -Wait
    Write-Host "✅ PostgreSQL installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed: $_" -ForegroundColor Red
    exit 1
}

# Test installation
Write-Host "`n🧪 Testing installation..." -ForegroundColor Yellow
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $psqlPath = "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
}

if (Test-Path $psqlPath) {
    try {
        $env:PGPASSWORD = "caribe2024"
        & $psqlPath -U postgres -h localhost -c "SELECT version();" | Out-Null
        Write-Host "✅ PostgreSQL connection successful" -ForegroundColor Green
        
        # Create caribe_digital database
        & $psqlPath -U postgres -h localhost -c "CREATE DATABASE caribe_digital;" -ErrorAction SilentlyContinue
        Write-Host "✅ Database 'caribe_digital' ready" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Connection test failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ psql.exe not found" -ForegroundColor Red
    exit 1
}

# Update .env file
Write-Host "`n📝 Updating .env file..." -ForegroundColor Yellow
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $content = $content -replace 'DB_USERNAME=.*', 'DB_USERNAME=postgres'
    $content = $content -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=caribe2024'
    $content | Set-Content $envFile
    Write-Host "✅ .env file updated" -ForegroundColor Green
}

# Cleanup
Remove-Item $installer -Force -ErrorAction SilentlyContinue

Write-Host "`n🎉 PostgreSQL Reset Complete!" -ForegroundColor Green
Write-Host "Credentials:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 5432" -ForegroundColor Gray
Write-Host "  Username: postgres" -ForegroundColor Gray
Write-Host "  Password: caribe2024" -ForegroundColor Gray
Write-Host "  Database: caribe_digital" -ForegroundColor Gray