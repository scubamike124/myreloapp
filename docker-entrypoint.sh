#!/bin/sh
# Runs as root so it can fix ownership of the mounted volume, then drops to
# the unprivileged app user before starting the server. Needed because a
# platform volume (Railway, etc.) mounts over /app/.data at container start,
# replacing whatever ownership the image set at build time — the chown in
# the Dockerfile only ever applied to the image layer, not the real mount.
set -e
chown -R reelo:nodejs /app/.data
exec su reelo -s /bin/sh -c "exec node server.js"
