@echo off
REM ============================================================
REM Galaxy TV V4K — Quick Start Script (Windows)
REM Double-click this file to start everything
REM ============================================================

echo =========================================
echo   Galaxy TV V4K — Starting All Services
echo =========================================
echo.

REM Check Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop is not running!
    echo    Please open Docker Desktop and wait until it says "Running".
    pause
    exit /b 1
)
echo ✅ Docker is running

REM Check .env exists
if not exist .env (
    echo ❌ .env file not found!
    echo    Please create .env file. See .env.example for template.
    pause
    exit /b 1
)
echo ✅ .env file found

echo.
echo Step 1: Starting PostgreSQL + Redis...
docker compose up -d postgres redis
echo    Waiting for databases...
timeout /t 15 /nobreak >nul

echo.
echo Step 2: Running database setup...
docker compose exec -T backend npx prisma generate 2>nul
docker compose exec -T backend npx prisma migrate deploy 2>nul

echo.
echo Step 3: Building and starting all services...
docker compose up -d --build

echo.
echo =========================================
echo   ✅ All Services Started!
echo =========================================
echo.
echo   Website:  http://localhost:3000
echo   Admin:    http://localhost:3001
echo   API:      http://localhost:4000/health
echo.
echo   Public (via tunnel):
echo   Website:  https://www.galaxytv4k.online
echo   Admin:    https://admin.galaxytv4k.online
echo.
echo   To start tunnel, open NEW terminal:
echo   cloudflared tunnel run galaxytv
echo.

REM Open browser
start http://localhost:3000

pause
