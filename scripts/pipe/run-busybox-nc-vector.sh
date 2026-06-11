#!/bin/sh
# run-busybox-nc-vector.sh
# Send a frame via BusyBox nc TCP and compare receipt against expected.
# nc receives frame to temp file, then omi-pipe reads from file.

set -e

FRAME="$1"
EXPECTED="$2"

if ! command -v nc >/dev/null 2>&1; then
    echo "  SKIP [busybox-nc] nc not found"
    exit 0
fi

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

NAME=$(basename "$FRAME" .omi)
PORT=7777
TMP_RECV="/tmp/omi-pipe-nc-recv-$$"
TMP_OUT="/tmp/omi-pipe-nc-out-$$"
TMP_ERR="/tmp/omi-pipe-nc-err-$$"

# Start nc listener, writing received data to temp file
# Using OpenBSD netcat: nc -l -p PORT
> "$TMP_RECV"
nc -l -p "$PORT" > "$TMP_RECV" 2>/dev/null &
PID=$!
sleep 0.2

# Send frame via TCP
cat "$FRAME" | nc -q 0 127.0.0.1 "$PORT" 2>/dev/null || true
sleep 0.3
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true

# Feed received data through omi-pipe
./bin/omi-pipe < "$TMP_RECV" > "$TMP_OUT" 2> "$TMP_ERR" || true

EXP_OUT="$EXPECTED/$NAME.receipt"
EXP_ERR="$EXPECTED/$NAME.stderr"

scripts/pipe/compare-receipt.sh "$TMP_OUT" "$TMP_ERR" "$EXP_OUT" "$EXP_ERR"
RC=$?

rm -f "$TMP_RECV" "$TMP_OUT" "$TMP_ERR"

if [ "$RC" -eq 0 ]; then
    echo "  PASS [busybox-nc/$NAME] receipt matches expected"
else
    echo "  FAIL [busybox-nc/$NAME] receipt differs"
    exit 1
fi
