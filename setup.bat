@echo off
SETLOCAL

echo.
echo ============================================================
echo   WhatsApp MCP — Windows Setup Script
echo ============================================================
echo.

:: ── Backend ─────────────────────────────────────────────────────────────────
echo [1/4] Installing backend dependencies...
cd /d "%~dp0app\backend"
call npm install
if %ERRORLEVEL% NEQ 0 (echo ERROR: npm install failed for backend & exit /b 1)

echo [2/4] Building backend (TypeScript)...
call npm run build
if %ERRORLEVEL% NEQ 0 (echo ERROR: tsc build failed for backend & exit /b 1)

:: Copy .env.example → .env if not exists
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo        .env created — EDIT app\backend\.env before starting!
)

:: ── Frontend ─────────────────────────────────────────────────────────────────
echo [3/4] Installing frontend dependencies...
cd /d "%~dp0app\frontend"
call npm install
if %ERRORLEVEL% NEQ 0 (echo ERROR: npm install failed for frontend & exit /b 1)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo        .env created — EDIT app\frontend\.env before starting!
)

:: ── MCP server ────────────────────────────────────────────────────────────────
echo [4/4] Installing whatsapp-mcp dependencies...
cd /d "%~dp0whatsapp-mcp"
call npm install
if %ERRORLEVEL% NEQ 0 (echo ERROR: npm install failed for whatsapp-mcp & exit /b 1)
call npm run build
if %ERRORLEVEL% NEQ 0 (echo ERROR: tsc build failed for whatsapp-mcp & exit /b 1)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo        .env created — EDIT whatsapp-mcp\.env before starting!
)

echo.
echo ============================================================
echo   Setup complete!
echo ============================================================
echo.
echo   NEXT STEPS:
echo   1. Edit app\backend\.env     — set MONGODB_URI and API_KEY
echo   2. Edit app\frontend\.env    — set VITE_API_BASE_URL and VITE_API_KEY
echo   3. Edit whatsapp-mcp\.env    — set BACKEND_URL and API_KEY
echo.
echo   START BACKEND:
echo     cd app\backend ^&^& node dist\remote.js
echo.
echo   START FRONTEND (dev):
echo     cd app\frontend ^&^& npm run dev
echo.
echo   OPEN QR PAGE:
echo     http://localhost:3000/auth/qr
echo ============================================================
echo.

ENDLOCAL
