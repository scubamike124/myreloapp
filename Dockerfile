# Reelo — production image.
#
# Multi-stage so the final image carries only the standalone server and its
# static assets, not the whole toolchain. node:sqlite needs Node >= 22.5; 24 is
# what the app is developed against.
#
# Build:  docker build -t reelo .
# Run:    docker run -p 3000:3000 --env-file .env.local -v reelo-data:/app/.data reelo
#
# The volume at /app/.data is what makes accounts and videos survive a restart.
# Without it, SQLite and stored media live only for the life of the container.

# --- deps: install once, cached until package files change --------------------
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

# --- build: compile the app ---------------------------------------------------
FROM node:24-slim AS build
WORKDIR /app
# next.config.ts's resolveBuildSha() falls back to `git rev-parse HEAD` when
# no BUILD_SHA-style env var is present at build time (see .dockerignore for
# why .git is even here to rev-parse) — node:24-slim has no git binary by
# default, so that fallback failed silently and /api/health reported
# "unknown" regardless of which commit was actually deployed.
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts || npm install --ignore-scripts
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `npm run build` now targets Cloudflare Workers (opennextjs-cloudflare) —
# it does not produce .next/standalone at all, which is what the run stage
# below actually copies out. Found live: every Railway deploy was silently
# building the wrong target, so the "app" running here was whatever stale
# artifact happened to exist, not the commit that was actually deployed.
# build:next is the plain `next build` that produces the standalone server
# this Dockerfile is built around.
#
# DOCKER_BUILD=1 is what next.config.ts checks to turn on `output:
# "standalone"` in the first place — without it, build:next still runs but
# never emits .next/standalone (that flag exists specifically because
# standalone is wrong for the Cloudflare/OpenNext target and must stay off
# there).
ENV DOCKER_BUILD=1
RUN npm run build:next

# --- run: the smallest thing that serves --------------------------------------
FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user, and give it ownership of the data directory so
# SQLite and media writes succeed.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs reelo \
  && mkdir -p /app/.data \
  && chown -R reelo:nodejs /app

# The standalone output already contains the server and its used dependencies.
COPY --from=build --chown=reelo:nodejs /app/.next/standalone ./
COPY --from=build --chown=reelo:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=reelo:nodejs /app/public ./public
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Stays root here on purpose — the entrypoint fixes /app/.data ownership
# (needed because a mounted volume replaces it at runtime) and then drops to
# the unprivileged `reelo` user itself before exec'ing the server.
EXPOSE 3000
# No VOLUME instruction here — Railway's builder rejects it ("use Railway
# Volumes instead"). Railway's own volume attachment mounts over /app/.data
# at runtime regardless; a plain `docker run -v reelo-data:/app/.data` (see
# the header comment) also works fine without the Docker VOLUME directive.

# The platform can poll this; it answers 200 as soon as the server is serving.
# Reads $PORT rather than hardcoding 3000 — hosts like Railway assign their
# own port and the server (honoring $PORT itself) listens there instead.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
