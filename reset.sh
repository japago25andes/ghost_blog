#!/usr/bin/env sh
# Borra todos los datos y vuelve a crear el estado inicial con los datos de prueba.
set -e
cd "$(dirname "$0")"
echo ""
echo " === REINICIAR GHOST AL ESTADO INICIAL ==="
echo ""
echo " Se BORRARAN todos los posts, usuarios, miembros, imagenes y correos"
echo " y se volveran a crear los datos de prueba originales."
printf " Continuar? [s/N] "
read -r respuesta
case "$respuesta" in
  s|S) ;;
  *) echo " Cancelado."; exit 0 ;;
esac

docker compose down -v
./iniciar.sh
