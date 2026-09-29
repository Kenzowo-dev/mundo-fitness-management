FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY services/report-service ./services/report-service

RUN pnpm install --filter=report-service... --frozen-lockfile
RUN pnpm --filter=@gym/shared build
RUN pnpm --filter=report-service build

FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/package.json
COPY services/report-service/package.json ./services/report-service/package.json

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
RUN pnpm install --filter=report-service... --frozen-lockfile --prod

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/report-service/dist ./services/report-service/dist

WORKDIR /app/services/report-service

EXPOSE 3006

CMD ["node", "dist/index.js"]