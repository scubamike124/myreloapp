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
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts || npm install --ignore-scripts
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

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

USER reelo
EXPOSE 3000
VOLUME ["/app/.data"]

# The platform can poll this; it answers 200 as soon as the server is serving.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
