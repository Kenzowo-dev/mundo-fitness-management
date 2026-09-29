FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY services/membership-service ./services/membership-service

RUN pnpm install --filter=membership-service... --frozen-lockfile
RUN pnpm --filter=@gym/shared build
RUN pnpm --filter=membership-service build

FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/package.json
COPY services/membership-service/package.json ./services/membership-service/package.json

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN pnpm install --filter=membership-service... --frozen-lockfile --prod

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/membership-service/dist ./services/membership-service/dist

WORKDIR /app/services/membership-service

EXPOSE 3003

CMD ["node", "dist/index.js"]