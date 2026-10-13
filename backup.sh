#!/usr/bin/env sh
# Copia de seguridad de la base de datos y del contenido de Ghost en ./backups
set -e
cd "$(dirname "$0")"
FECHA=$(date +%Y%m%d-%H%M)
mkdir -p backups

echo " 1/2 Base de datos..."
docker compose exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --databases "$MYSQL_DATABASE" 2>/dev/null' > "backups/ghost-db-$FECHA.sql"

echo " 2/2 Contenido (imagenes, temas, archivos)..."
docker compose run --rm --no-deps -T -v "$(pwd)/backups:/backup" --entrypoint tar ghost czf "/backup/ghost-content-$FECHA.tar.gz" -C /var/lib/ghost/content .

echo ""
echo " Listo. Copias guardadas en ./backups:"
ls -1 backups | grep "$FECHA"
