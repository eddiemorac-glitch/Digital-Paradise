# Darwin Godel Diagnostic: Dependency Security Check
# Objective: Identify vulnerabilities in frontend dependencies.

$ErrorActionPreference = "Continue" # Don't stop on audit errors (they return non-zero exit codes)

function Log-Info { param($msg) Write-Host "INFO: $msg" -ForegroundColor Cyan }
function Log-Warn { param($msg) Write-Host "WARN: $msg" -ForegroundColor Yellow }
function Log-Error { param($msg) Write-Host "FAIL: $msg" -ForegroundColor Red }
function Log-Success { param($msg) Write-Host "PASS: $msg" -ForegroundColor Green }

Log-Info "Starting Security Audit (Phase 6.3)..."

# 1. NPM Audit
Log-Info "Running 'npm audit'..."
$auditResults = npm audit --json | ConvertFrom-Json

if ($auditResults.metadata.vulnerabilities.total -gt 0) {
    Log-Warn "Vulnerabilities Found:"
    Log-Warn "  - Critical: $($auditResults.metadata.vulnerabilities.critical)"
    Log-Warn "  - High: $($auditResults.metadata.vulnerabilities.high)"
    Log-Warn "  - Moderate: $($auditResults.metadata.vulnerabilities.moderate)"
    Log-Warn "  - Low: $($auditResults.metadata.vulnerabilities.low)"
    
    if ($auditResults.metadata.vulnerabilities.critical -gt 0) {
        Log-Error "CRITICAL vulnerabilities detected. Immediate action required."
        Write-Host "Recommendation: Run 'npm audit fix --force' carefully." -ForegroundColor White
        exit 1
    }
    else {
        Log-Warn "Non-critical vulnerabilities present. Schedule update."
        exit 0
    }
}
else {
    Log-Success "No known vulnerabilities found. Dependencies are clean."
    exit 0
}
