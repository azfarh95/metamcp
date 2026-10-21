#!/bin/sh
# CI smoke probe: for every npx STDIO server in the DB, spawn it and do an
# initialize -> tools/list round-trip over stdin/stdout. Runs INSIDE the app container
# (needs psql, npx, DATABASE_URL). Exits non-zero if any server fails or none are found.

rows=$(psql "$DATABASE_URL" -At -F '|' -c "
  SELECT name, array_to_string(args, ' ')
  FROM mcp_servers WHERE type = 'STDIO' AND command = 'npx' ORDER BY name") || {
    echo "probe: could not list servers"; exit 1
}
[ -n "$rows" ] || { echo "probe: no npx STDIO servers found"; exit 1; }

fail=0
for row in $rows; do
    name=${row%%|*}
    args=${row#*|}
    out=$(mktemp)
    # Delays keep stdin open until the server has replied; EOF would end it early.
    # $args is intentionally unquoted so it splits into argv.
    {
        printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"ci-smoke","version":"0"}}}'
        sleep 5
        printf '%s\n' '{"jsonrpc":"2.0","method":"notifications/initialized"}'
        printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
        sleep 8
    } | timeout 120 npx $args >"$out" 2>/dev/null
    if grep -q '"id":2' "$out" && grep -q '"tools"' "$out"; then
        echo "probe: $name OK ($(grep -o '"name"' "$out" | wc -l) name fields in reply)"
    else
        echo "probe: $name FAILED -- reply was:"
        head -c 1000 "$out"; echo
        fail=1
    fi
    rm -f "$out"
done
exit $fail
