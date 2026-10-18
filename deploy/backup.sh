#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${DB_PATH:?DB_PATH doit désigner la base SQLite}"
REMOTE="${REMOTE:-scw:louiseetjulien-sauvegardes}"
KEEP_DAYS="${KEEP_DAYS:-30}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

file="$tmp/mariage-$(date +%F).db"
sqlite3 "$DB_PATH" ".backup '$file'"

if [ "$(sqlite3 "$file" 'PRAGMA integrity_check;')" != ok ]; then
  echo "La copie de $DB_PATH est corrompue, envoi annulé" >&2
  exit 1
fi

gzip "$file"
rclone copy "$file.gz" "$REMOTE"
rclone delete "$REMOTE" --include 'mariage-*.db.gz' --min-age "${KEEP_DAYS}d"
