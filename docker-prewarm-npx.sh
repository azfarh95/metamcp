#!/bin/sh
# [sentinel-patch] Pre-warm the npx cache before the backend spawns STDIO servers.
#
# A recreated container starts with an empty ~/.npm. The backend then spawns every
# `npx -y <pkg>` server at once; several cold installs race on the shared npx cache
# and on time, some children exit during connect, and serverErrorTracker marks them
# ERROR in the DB after MCP_MAX_ATTEMPTS crashes (default 1) -- they stay down until
# someone resets them. Installing each package once, serially, before the backend
# starts means every spawn after this hits a warm cache.
#
# Best effort: a failure here is logged and startup continues.
# METAMCP_NPX_PREWARM=false disables it; METAMCP_NPX_PREWARM_TIMEOUT caps each package (s).

[ "${METAMCP_NPX_PREWARM:-true}" = "false" ] && exit 0
per_pkg_timeout=${METAMCP_NPX_PREWARM_TIMEOUT:-120}

# First non-flag argument of each npx STDIO server is its package spec.
pkgs=$(psql "$DATABASE_URL" -At -c "
  SELECT DISTINCT (
    SELECT a FROM unnest(s.args) WITH ORDINALITY AS u(a, i)
    WHERE a NOT LIKE '-%' ORDER BY i LIMIT 1
  )
  FROM mcp_servers s
  WHERE s.type = 'STDIO' AND s.command = 'npx'") || {
    echo "npx pre-warm: could not list servers, skipping"
    exit 0
}

for pkg in $pkgs; do
    started=$(date +%s)
    # Same package list as `npx -y <pkg>`, so it fills the same _npx cache entry,
    # but runs `node -e 0` instead of the server's bin.
    if timeout "$per_pkg_timeout" npm exec --yes --package="$pkg" -- node -e 0 >/dev/null 2>&1; then
        echo "npx pre-warm: $pkg ready ($(( $(date +%s) - started ))s)"
    else
        echo "npx pre-warm: $pkg failed or timed out after ${per_pkg_timeout}s (continuing)"
    fi
done
exit 0
