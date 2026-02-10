# Darwin Godel Diagnostic: Frontend Health Check
# Objective: Verify React/Vite environment stability without user intervention.

$ErrorActionPreference = "Stop"

function Log-Info { param($msg) Write-Host "INFO: $msg" -ForegroundColor Cyan }
function Log-Success { param($msg) Write-Host "PASS: $msg" -ForegroundColor Green }
function Log-Error { param($msg) Write-Host "FAIL: $msg" -ForegroundColor Red }

try {
    Log-Info "Starting Frontend Verification (Phase 6.3)..."

    # 1. Environment Check
    $nodeVersion = node -v
    Log-Info "Node Version: $nodeVersion"
    
    if (-not (Test-Path "node_modules")) {
        Log-Error "node_modules missing. Please run 'npm install' first."
        exit 1
    }

    # 2. Linting (Static Code Analysis)
    Log-Info "Running Linter..."
    try {
        npm run lint
        Log-Success "Linting passed. Code style is consistent."
    }
    catch {
        Log-Error "Linting failed. Please fix style errors."
        # We continue even if lint fails, as build might still work, but we mark it.
        # Strict mode: exit 1
        exit 1
    }

    # 3. Production Build (Compilation)
    Log-Info "Running Production Build (Vite)..."
    $buildStart = Get-Date
    npm run build
    $buildTime = (Get-Date) - $buildStart
    Log-Success "Build successful in $($buildTime.TotalSeconds) seconds."

    # 4. Artifact Verification
    if (Test-Path "dist/index.html") {
        $size = (Get-Item "dist/index.html").Length
        Log-Success "Artifact 'dist/index.html' generated ($size bytes)."
    }
    else {
        throw "Build finished but 'dist/index.html' is missing."
    }

    Log-Success "Frontend Health Verified. System is clean."
    exit 0

}
catch {
    Log-Error "Verification Process Failed: $_"
    exit 1
}
