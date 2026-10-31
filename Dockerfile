# --- Build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Injectée au build (Vite l'inline dans le bundle). "/api" = même origine, proxifiée par nginx en prod.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Runtime ---
FROM nginx:alpine
# curl : requis par le healthcheck du compose (INFRASTRUCTURE.md §7), absent de nginx:alpine
RUN apk add --no-cache curl
COPY --from=build /app/dist /usr/share/nginx/html
# La config nginx (SPA fallback + proxy /api/) est montée par le docker-compose du repo back.

EXPOSE 80
