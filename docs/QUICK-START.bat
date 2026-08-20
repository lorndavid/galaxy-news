@echo off
REM ============================================================
REM Galaxy TV V4K — Quick Start (Windows)
REM Double-click this file or run in Command Prompt
REM ============================================================

echo.
echo ====================================
echo  Galaxy TV V4K - Starting Services
echo ====================================
echo.

REM Check Docker is running
echo [1/6] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo Docker is ready.

REM Navigate to project directory
echo.
echo [2/6] Navigating to project...
cd /d "%~dp0"
echo Current directory: %CD%

REM Check .env exists
echo.
echo [3/6] Checking configuration...
if not exist ".env" (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env file with notepad!
    echo You need to fill in:
    echo   - POSTGRES_PASSWORD (any strong password)
    echo   - R2_ACCOUNT_ID (from Cloudflare R2)
    echo   - R2_ACCESS_KEY_ID (from Cloudflare R2)
    echo   - R2_SECRET_ACCESS_KEY (from Cloudflare R2)
    echo   - JWT_SECRET (run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
    echo.
    notepad .env
    echo.
    echo Press any key after you've saved .env...
    pause >nul
)

REM Start PostgreSQL + Redis
echo.
echo [4/6] Starting database and cache...
docker compose up -d postgres redis
echo Waiting for services to become healthy...
timeout /t 20 /nobreak >nul

REM Setup database
echo.
echo [5/6] Setting up database...
docker compose exec backend npx prisma generate
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

REM Build and start everything
echo.
echo [6/6] Building and starting all services...
docker compose up -d --build

echo.
echo ====================================
echo  Galaxy TV V4K is now running!
echo ====================================
echo.
echo  Website:  http://localhost:3000
echo  Admin:    http://localhost:3001
echo  API:      http://localhost:4000
echo.
echo  Admin Login:
echo    Email:    admin@galaxytv4k.online
echo    Password: admin123
echo.
echo  To expose via your domain (galaxytv4k.online):
echo    1. Install cloudflared
echo    2. Run: cloudflared tunnel login
echo    3. Run: cloudflared tunnel create galaxytv
echo    4. Run: cloudflared tunnel run galaxytv
echo.
echo  See docs/DEPLOY-GUIDE.md for full instructions.
echo.
pause
