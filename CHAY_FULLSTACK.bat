@echo off
setlocal
title EventFlow - Fullstack
cd /d "%~dp0"
echo [1/3] Kiem tra backend va database...
cd backend
if not exist node_modules call npm ci
if errorlevel 1 goto error
if not exist .env copy .env.example .env >nul
if not exist prisma\dev.db type nul > prisma\dev.db
call npx prisma generate
if errorlevel 1 goto error
call npx prisma db push --skip-generate
if errorlevel 1 goto error
call npm run db:init
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
cd ..\frontend
echo [2/3] Build website...
if not exist node_modules call npm ci
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
cd ..
echo [3/3] Khoi dong API va website...
start "EventFlow Backend" /D "%~dp0backend" cmd /k "npm start"
start "EventFlow Website" /D "%~dp0frontend" cmd /k "npm run preview -- --host 0.0.0.0 --port 5173 --strictPort"
echo May chu: http://localhost:5173/
echo May khac cung mang Wi-Fi/LAN: http://172.36.38.75:5173/
echo Neu cong dang duoc dung, dong cua so EventFlow cu roi chay lai.
exit /b 0
:error
echo Loi khoi dong. Doc thong bao phia tren, khong xoa database hoac localStorage.
pause
exit /b 1
