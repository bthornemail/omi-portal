#!/bin/sh
# run-socat-vector.sh
# Send a frame via socat forked EXEC and compare receipt against expected.
# socat EXEC merges pipe stdout and stderr over TCP, so we use merged comparison.

set -e

FRAME="$1"
EXPECTED="$2"

if ! command -v socat >/dev/null 2>&1; then
    echo "  SKIP [socat] socat not found"
    exit 0
fi

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

NAME=$(basename "$FRAME" .omi)
PORT=7779
TMP_COMBINED=$(mktemp /tmp/omi-pipe-socat-combined-XXXXXX)

# Start socat forked listener in background.
# pipe stdout + stderr both go to the TCP client (merged by socat EXEC).
socat TCP-LISTEN:"$PORT",reuseaddr,fork EXEC:./bin/omi-pipe,stderr 2>/dev/null &
PID=$!
sleep 0.2

# Connect as client: send frame, read combined response.
socat - TCP:127.0.0.1:"$PORT" < "$FRAME" > "$TMP_COMBINED" 2>/dev/null || true
sleep 0.2
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true

EXP_OUT="$EXPECTED/$NAME.receipt"
EXP_ERR="$EXPECTED/$NAME.stderr"

scripts/pipe/compare-receipt-merged.sh "$TMP_COMBINED" "$EXP_OUT" "$EXP_ERR"
RC=$?

rm -f "$TMP_COMBINED"

if [ "$RC" -eq 0 ]; then
    echo "  PASS [socat/$NAME] receipt matches expected"
else
    echo "  FAIL [socat/$NAME] receipt differs"
    exit 1
fi
