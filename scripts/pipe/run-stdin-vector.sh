#!/bin/sh
# run-stdin-vector.sh
# Baseline: send a frame via stdin and compare against expected receipt.
# Usage: run-stdin-vector.sh <frame-file> <expected-dir>
#
# Example:
#   run-stdin-vector.sh test/pipe-network/frames/accept-basic.omi test/pipe-network/expected/

set -e

FRAME="$1"
EXPECTED="$2"

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

NAME=$(basename "$FRAME" .omi)
TMP_OUT=$(mktemp /tmp/omi-pipe-stdout-XXXXXX)
TMP_ERR=$(mktemp /tmp/omi-pipe-stderr-XXXXXX)

./bin/omi-pipe < "$FRAME" > "$TMP_OUT" 2> "$TMP_ERR" || true

EXP_OUT="$EXPECTED/$NAME.receipt"
EXP_ERR="$EXPECTED/$NAME.stderr"

scripts/pipe/compare-receipt.sh "$TMP_OUT" "$TMP_ERR" "$EXP_OUT" "$EXP_ERR"
RC=$?

rm -f "$TMP_OUT" "$TMP_ERR"

if [ "$RC" -eq 0 ]; then
    echo "  PASS [stdin/$NAME] receipt matches expected"
else
    echo "  FAIL [stdin/$NAME] receipt differs"
    exit 1
fi
