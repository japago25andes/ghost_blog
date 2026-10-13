#!/usr/bin/env sh
# Detiene el entorno de pruebas de Ghost (los datos se conservan).
cd "$(dirname "$0")"
docker compose down
echo ""
echo " Contenedores detenidos. Los datos se conservan (para borrarlos usa ./reset.sh)."
