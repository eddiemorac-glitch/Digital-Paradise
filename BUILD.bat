@echo off
REM ============================================
REM CARIBE DIGITAL CR - Deployment Script
REM ============================================
REM Este script prepara el proyecto para deploy
REM ============================================

echo.
echo ========================================
echo   CARIBE DIGITAL CR - Build Script
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    pause
    exit /b 1
)

echo [1/4] Instalando dependencias del backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la instalacion del backend
    pause
    exit /b 1
)

echo [2/4] Construyendo backend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo el build del backend
    pause
    exit /b 1
)

echo [3/4] Instalando dependencias del frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la instalacion del frontend
    pause
    exit /b 1
)

echo [4/4] Construyendo frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo el build del frontend
    pause
    exit /b 1
)

cd ..
echo.
echo ========================================
echo   BUILD COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Proximo paso: Configurar variables de entorno
echo   - Backend: backend/.env (usar backend/.env.example como referencia)
echo   - Frontend: Ya configurado para Vercel
echo.
echo Para deploy en Vercel:
echo   1. Push a GitHub
echo   2. Conectar repositorio en Vercel
echo   3. Configurar variables de entorno en Vercel
echo.
pause
