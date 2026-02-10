@echo off
echo 🚀 Iniciando Caribe Digital CR System (V2.0)...
echo.

echo [1/2] Iniciando Backend Service...
start "BACKEND" cmd /c "cd /d %~dp0backend && npm run start:dev"

echo [2/2] Iniciando Frontend Client...
start "FRONTEND" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Servicios inicializados en ventanas separadas.
echo ➜ Backend: http://localhost:3000
echo ➜ Frontend: http://localhost:5173
pause
