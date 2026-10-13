@echo off
cd /d "%~dp0"
for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"

echo.
echo  === Ghost - entorno de pruebas (Ghost %GHOST_VERSION%) ===
echo.
echo  Arrancando contenedores. La primera vez descarga las imagenes y puede tardar unos minutos...
docker compose rm -f -s seed >nul 2>&1
docker compose up -d
if errorlevel 1 (
  echo.
  echo  No se pudo arrancar. Asegurate de que Docker Desktop esta abierto.
  pause
  exit /b 1
)

echo.
echo  Esperando a Ghost y cargando los datos de prueba si es la primera vez...
docker compose wait seed >nul 2>&1
echo.
docker compose logs --no-log-prefix seed

echo.
echo  ------------------------------------------------------------
echo   Sitio publico .......... %GHOST_URL%
echo   Administracion ......... %GHOST_URL%/ghost
echo   Correo (Mailpit) ....... http://localhost:%MAILPIT_PORT%
echo   Base de datos (Adminer)  http://localhost:%ADMINER_PORT%
echo   Usuarios y contrasenas:  ver README.md
echo  ------------------------------------------------------------
start %GHOST_URL%/ghost
timeout /t 8 >nul
