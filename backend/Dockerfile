# Backend + Docs multi-stage Dockerfile

FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY database ./database

# Production runtime using ts-node (resolves TS path aliases at runtime)
FROM node:20-alpine AS api
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app /app

EXPOSE 3001
CMD ["node","-r","ts-node/register","-r","tsconfig-paths/register","src/server.ts"]

# Build and serve typedoc docs
FROM node:20-alpine AS docs
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app /app
RUN npx typedoc --entryPointStrategy expand --entryPoints src --tsconfig tsconfig.json --out docs
EXPOSE 8080
CMD ["npx","http-server","docs","-p","8080","--silent"]



