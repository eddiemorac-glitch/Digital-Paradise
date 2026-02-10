$url = "https://download.osgeo.org/postgis/windows/pg16/postgis-bundle-pg16-x64-3.4.2-1.exe"
$outPath = "$env:TEMP\postgis_installer.exe"

Write-Host "🌐 Downloading PostGIS Bundle..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $outPath

Write-Host "⚙️ Installing PostGIS silently..." -ForegroundColor Cyan
# Silent mode usually /S for these NSIS installers
$p = Start-Process -FilePath $outPath -ArgumentList "/S" -PassThru -Wait

Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan
Remove-Item $outPath

if ($p.ExitCode -eq 0) {
    Write-Host "✅ PostGIS Installation Triggered Successfully." -ForegroundColor Green
} else {
    Write-Host "⚠️ Installation finished with Exit Code: $($p.ExitCode)" -ForegroundColor Yellow
}
