#!/bin/sh
set -e

# Apply any pending Prisma migrations before the app starts. `migrate deploy` is
# idempotent — it only runs migrations that have not been applied yet, so it is
# safe to run on every container start / rolling restart.
echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy

# Seed runs only when RUN_SEED=true is set in the environment. The seed script is
# expected to be idempotent (upserts). Leave it off for normal deploys.
if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] RUN_SEED=true -> running prisma seed..."
  npx prisma db seed || echo "[entrypoint] seed failed (continuing)"
fi

echo "[entrypoint] Starting: $*"
exec "$@"
