FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ARG VITE_API_ROOT_URL
ARG VITE_KEYCLOAK_BACKEND_CLIENT_ID
ARG VITE_KEYCLOAK_CLIENT_ID
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_URL
RUN npm run build

FROM caddy:2-alpine
WORKDIR /srv

COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

ENV PORT=8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
