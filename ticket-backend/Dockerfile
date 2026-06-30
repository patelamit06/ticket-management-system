# syntax=docker/dockerfile:1

# -------- Stage 1: build --------
# Compiles TypeScript -> dist/ and generates the Prisma client (generated/prisma).
FROM node:22-bookworm-slim AS builder

# bcrypt is a native module; build tools guarantee a clean compile if no prebuilt
# binary matches. openssl is required by Prisma's query engine.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# pnpm via corepack (lockfile in repo is pnpm-lock.yaml)
RUN corepack enable

WORKDIR /app

# Copy only what install needs first, so Docker can cache the dependency layer.
# prisma/ and prisma.config.ts are copied early because the "postinstall" script
# runs `prisma generate`, which reads prisma/schema.prisma.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build.
COPY . .
RUN pnpm prisma:generate && pnpm build

# -------- Stage 2: runtime --------
FROM node:22-bookworm-slim AS runner

# openssl for Prisma; curl for the container HEALTHCHECK.
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Copy the fully-built app from the builder. We keep the full node_modules so the
# Prisma CLI (migrate deploy) and ts-node (seed) are available at runtime.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

# Health endpoint defined in src/app.controller.ts -> GET /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:3001/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]
