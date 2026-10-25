#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/louiseetjulien}"
SERVICE="${SERVICE:-louiseetjulien}"

cd "$(dirname "$0")/.."

if [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" .env
fi

pnpm install --frozen-lockfile --prod=false
SKIP_TYPECHECK=1 NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}" pnpm build

mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude /.git \
  --exclude '/.env*' \
  --exclude '*.db' \
  --exclude '*.db-*' \
  ./ "$APP_DIR/"

cd "$APP_DIR"
pnpm db:deploy
sudo systemctl restart "$SERVICE"
