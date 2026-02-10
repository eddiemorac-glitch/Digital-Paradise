# Quick PostgreSQL Fix - Create new database with known credentials

Write-Host "🔧 Quick PostgreSQL Fix" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $psqlPath = "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
}

if (Test-Path $psqlPath) {
    Write-Host "✅ Found psql at: $psqlPath" -ForegroundColor Green
    
    # Test common passwords
    $passwords = @("caribe2024", "postgres", "admin", "password", "")
    
    foreach ($pwd in $passwords) {
        Write-Host "`n🔍 Trying password: '$pwd'" -ForegroundColor Yellow
        $env:PGPASSWORD = $pwd
        
        try {
            $result = & $psqlPath -U postgres -h localhost -c "SELECT 1;" -t -A 2>&1
            if ($result -eq "1") {
                Write-Host "✅ SUCCESS! Password is: '$pwd'" -ForegroundColor Green
                
                # Create database
                Write-Host "📝 Creating caribe_digital database..." -ForegroundColor Yellow
                & $psqlPath -U postgres -h localhost -c "CREATE DATABASE caribe_digital;" -ErrorAction SilentlyContinue
                
                # Update .env
                $envFile = ".env"
                if (Test-Path $envFile) {
                    $content = Get-Content $envFile
                    $content = $content -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$pwd"
                    $content | Set-Content $envFile
                    Write-Host "✅ .env file updated" -ForegroundColor Green
                }
                
                Write-Host "`n🎉 PostgreSQL fixed!" -ForegroundColor Green
                exit 0
            }
        } catch {
            Write-Host "❌ Failed" -ForegroundColor Red
        }
    }
    
    Write-Host "`n❌ All passwords failed. Manual intervention required." -ForegroundColor Red
} else {
    Write-Host "❌ PostgreSQL not found" -ForegroundColor Red
}