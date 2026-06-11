#!/bin/sh
# run-mcrsgsp-stdin-vector.sh
# MCRSGSP stdin baseline: feed frame via stdin, compare receipt against expected.
# Usage: run-mcrsgsp-stdin-vector.sh <frame-file> <expected-dir>

set -e

FRAME="$1"
EXPECTED="$2"

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

NAME=$(basename "$FRAME" .omi)
TMP_OUT="/tmp/omi-pipe-mcrsgsp-out-$$"
TMP_ERR="/tmp/omi-pipe-mcrsgsp-err-$$"

./bin/omi-pipe < "$FRAME" > "$TMP_OUT" 2> "$TMP_ERR" || true

EXP_OUT="$EXPECTED/$NAME.receipt"
EXP_ERR="$EXPECTED/$NAME.stderr"

scripts/pipe/compare-receipt.sh "$TMP_OUT" "$TMP_ERR" "$EXP_OUT" "$EXP_ERR"
RC=$?

rm -f "$TMP_OUT" "$TMP_ERR"

if [ "$RC" -eq 0 ]; then
    echo "  PASS [mcrsgsp/$NAME] receipt matches expected"
else
    echo "  FAIL [mcrsgsp/$NAME] receipt differs"
    exit 1
fi
