#!/usr/bin/env sh
# Arranca el entorno de pruebas de Ghost (macOS / Linux).
set -e
cd "$(dirname "$0")"
env_value() { grep "^$1=" .env | head -n1 | cut -d= -f2-; }

echo ""
echo " === Ghost - entorno de pruebas (Ghost $(env_value GHOST_VERSION)) ==="
echo ""
echo " Arrancando contenedores. La primera vez descarga las imagenes y puede tardar unos minutos..."
docker compose rm -f -s seed >/dev/null 2>&1 || true
docker compose up -d

echo ""
echo " Esperando a Ghost y cargando los datos de prueba si es la primera vez..."
docker compose wait seed >/dev/null 2>&1 || true
echo ""
docker compose logs --no-log-prefix seed

GHOST_URL=$(env_value GHOST_URL)
echo ""
echo " ------------------------------------------------------------"
echo "  Sitio publico .......... $GHOST_URL"
echo "  Administracion ......... $GHOST_URL/ghost"
echo "  Correo (Mailpit) ....... http://localhost:$(env_value MAILPIT_PORT)"
echo "  Base de datos (Adminer)  http://localhost:$(env_value ADMINER_PORT)"
echo "  Usuarios y contrasenas:  ver README.md"
echo " ------------------------------------------------------------"
