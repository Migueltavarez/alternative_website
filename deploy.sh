#!/bin/bash
# Deploy script — sube cambios al VPS y reconstruye el contenedor
set -e

VPS="root@46.224.116.91"
REMOTE_DIR="/opt/alt3d"

echo "==> Empaquetando proyecto..."
git archive --format=tar.gz HEAD > /tmp/alt3d.tar.gz

echo "==> Subiendo al VPS..."
scp /tmp/alt3d.tar.gz $VPS:/opt/

echo "==> Extrayendo y reconstruyendo..."
ssh $VPS "
  rm -rf $REMOTE_DIR
  mkdir -p $REMOTE_DIR
  tar xzf /opt/alt3d.tar.gz -C $REMOTE_DIR
  rm /opt/alt3d.tar.gz
  # Restaurar .env.production (no va en git)
  cp /opt/alt3d_env/.env.production $REMOTE_DIR/.env.production 2>/dev/null || echo 'Aviso: restaura .env.production manualmente'
  cd $REMOTE_DIR
  docker compose build
  docker compose up -d
  docker compose exec -T app node node_modules/prisma/build/index.js db push --skip-generate
"

echo "==> Deploy completado"
rm /tmp/alt3d.tar.gz
