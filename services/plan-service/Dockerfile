FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY services/plan-service ./services/plan-service

RUN pnpm install --filter=plan-service... --frozen-lockfile
RUN pnpm --filter=@gym/shared build
RUN pnpm --filter=plan-service build

FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/package.json
COPY services/plan-service/package.json ./services/plan-service/package.json

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN pnpm install --filter=plan-service... --frozen-lockfile --prod

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/plan-service/dist ./services/plan-service/dist

WORKDIR /app/services/plan-service

EXPOSE 3005

CMD ["node", "dist/index.js"]