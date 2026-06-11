#!/bin/sh
# run-ncat-vector.sh
# Send a frame via ncat TCP and compare receipt against expected.
# ncat receives frame to temp file, then omi-pipe reads from file.

set -e

FRAME="$1"
EXPECTED="$2"

if ! command -v ncat >/dev/null 2>&1; then
    echo "  SKIP [ncat] ncat not found"
    exit 0
fi

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

NAME=$(basename "$FRAME" .omi)
PORT=7778
TMP_RECV="/tmp/omi-pipe-ncat-recv-$$"
TMP_OUT="/tmp/omi-pipe-ncat-out-$$"
TMP_ERR="/tmp/omi-pipe-ncat-err-$$"

# Start ncat listener, writing received data to temp file
> "$TMP_RECV"
ncat -l -p "$PORT" > "$TMP_RECV" 2>/dev/null &
PID=$!
sleep 0.2

# Send frame via ncat client
ncat --send-only -w 1 127.0.0.1 "$PORT" < "$FRAME" 2>/dev/null || true
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
    echo "  PASS [ncat/$NAME] receipt matches expected"
else
    echo "  FAIL [ncat/$NAME] receipt differs"
    exit 1
fi
