# Stage 1: Build the frontend with pnpm
FROM node:22-alpine AS builder

# Enable corepack and use the project's pnpm version
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

# Copy package files and workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json

# Install dependencies (including dev deps for build)
RUN pnpm install --filter=frontend... --frozen-lockfile

# Copy frontend source
COPY frontend ./frontend

# Build the frontend
WORKDIR /app/frontend
RUN pnpm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]