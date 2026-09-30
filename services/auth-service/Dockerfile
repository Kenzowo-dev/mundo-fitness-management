FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY services/auth-service ./services/auth-service

RUN pnpm install --filter=auth-service... --frozen-lockfile --fetch-timeout=600000
RUN pnpm --filter=@gym/shared build
RUN pnpm --filter=auth-service build

FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/package.json
COPY services/auth-service/package.json ./services/auth-service/package.json

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN pnpm install --filter=auth-service... --frozen-lockfile --prod --fetch-timeout=600000

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist

WORKDIR /app/services/auth-service

EXPOSE 3001

CMD ["node", "dist/index.js"]
