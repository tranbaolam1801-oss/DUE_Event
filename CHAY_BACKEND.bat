@echo off
title EventFlow - Backend API Server
echo ===================================================
echo     DANG KHOI CHAY EVENTFLOW BACKEND API
echo     Cong: http://localhost:3001
echo ===================================================
echo.
cd /d "%~dp0"
if exist "backend" cd backend
npm start
pause
