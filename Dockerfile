# Pinned by digest (multi-platform index); bump it on purpose.
FROM docker.io/library/node:22-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d AS base
RUN npm install --global npm@12.2.1
WORKDIR /app
EXPOSE 3000

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS development
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl git \
    && rm -rf /var/lib/apt/lists/* \
    && chown -R node:node /app
USER node
CMD ["sleep", "infinity"]

FROM dependencies AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS production-dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS production
ENV NODE_ENV=production
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY assets ./assets
COPY docs ./docs
USER node
# /healthz is 503 until the photo list has loaded. No curl in this image, so
# the check uses Node. Podman ignores HEALTHCHECK in OCI-format images; in a
# Quadlet unit use HealthCmd= with the same command.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD ["node", "-e", "fetch('http://localhost:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "dist/index.js"]
