FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

ENV npm_config_store_dir=/pnpm/store \
    npm_config_cache=/pnpm/cache

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY services/payment-service ./services/payment-service

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    --mount=type=cache,id=pnpm-cache,target=/pnpm/cache \
    pnpm install --filter=payment-service... --frozen-lockfile --fetch-timeout=600000 --network-concurrency=4
RUN pnpm --filter=@gym/shared build
RUN pnpm --filter=payment-service build

FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/package.json
COPY services/payment-service/package.json ./services/payment-service/package.json

ENV npm_config_store_dir=/pnpm/store \
    npm_config_cache=/pnpm/cache

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    --mount=type=cache,id=pnpm-cache,target=/pnpm/cache \
    pnpm install --filter=payment-service... --frozen-lockfile --prod --fetch-timeout=600000 --network-concurrency=4

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/payment-service/dist ./services/payment-service/dist

WORKDIR /app/services/payment-service

EXPOSE 3004

CMD ["node", "dist/index.js"]
