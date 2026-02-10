
Write-Host "🚀 Iniciando Caribe Digital CR System (V2.0)..."
Write-Host "Starting Backend Service..."
Start-Process powershell -ArgumentList "-NoExit", "-File", "START_BACKEND.ps1"

Write-Host "Starting Frontend Client..."
Start-Process powershell -ArgumentList "-NoExit", "-File", "START_FRONTEND.ps1"

Write-Host "✅ Servicios inicializados."
