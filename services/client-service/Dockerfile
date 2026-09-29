FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY services/client-service ./services/client-service

RUN pnpm install --filter=client-service... --frozen-lockfile
RUN pnpm --filter=@gym/shared build
RUN pnpm --filter=client-service build

FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/package.json
COPY services/client-service/package.json ./services/client-service/package.json

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN pnpm install --filter=client-service... --frozen-lockfile --prod

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/client-service/dist ./services/client-service/dist

WORKDIR /app/services/client-service

EXPOSE 3002

CMD ["node", "dist/index.js"]