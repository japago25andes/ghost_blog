@echo off
cd /d "%~dp0"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm"') do set FECHA=%%i
if not exist backups mkdir backups

echo.
echo  === Copia de seguridad de Ghost (%FECHA%) ===
echo.
echo  1/2 Base de datos (posts, usuarios, miembros, ajustes)...
docker compose exec -T db sh -c "mysqldump -uroot -p\"$MYSQL_ROOT_PASSWORD\" --single-transaction --databases \"$MYSQL_DATABASE\" 2>/dev/null" > "backups\ghost-db-%FECHA%.sql"
if errorlevel 1 (
  echo  Error al copiar la base de datos. Esta Ghost arrancado? Ejecuta iniciar.bat primero.
  pause
  exit /b 1
)

echo  2/2 Contenido (imagenes, temas, archivos subidos)...
docker compose run --rm --no-deps -T -v "%cd%\backups:/backup" --entrypoint tar ghost czf /backup/ghost-content-%FECHA%.tar.gz -C /var/lib/ghost/content .
if errorlevel 1 (
  echo  Error al copiar el contenido.
  pause
  exit /b 1
)

echo.
echo  Listo. Copias guardadas en la carpeta "backups":
dir /b backups\*%FECHA%*
timeout /t 6 >nul
