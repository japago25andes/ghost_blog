@echo off
cd /d "%~dp0"
docker compose down
echo.
echo  Contenedores detenidos. Los datos se conservan (para borrarlos usa reset.bat).
timeout /t 5 >nul
