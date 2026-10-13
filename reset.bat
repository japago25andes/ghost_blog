@echo off
cd /d "%~dp0"
echo.
echo  === REINICIAR GHOST AL ESTADO INICIAL ===
echo.
echo  Se BORRARAN todos los posts, usuarios, miembros, imagenes y correos
echo  y se volveran a crear los datos de prueba originales.
echo.
choice /c SN /m "  Continuar"
if errorlevel 2 exit /b 0

echo.
echo  Borrando contenedores y volumenes...
docker compose down -v
if errorlevel 1 (
  echo  No se pudo borrar. Asegurate de que Docker Desktop esta abierto.
  pause
  exit /b 1
)

call "%~dp0iniciar.bat"
