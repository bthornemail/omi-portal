#!/bin/sh
# run-rs-proof-stdin-vector.sh
# OMI RS proof stdin baseline: feed frame via stdin, compare expected output.
# Usage: run-rs-proof-stdin-vector.sh <name>

set -e

NAME="$1"
DIR="test/pipe-rs-proof"
FRAME="$DIR/frames/$NAME.omi"
EXPECTED="$DIR/expected"

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

TMP_OUT="/tmp/omi-pipe-rs-out-$$"
TMP_ERR="/tmp/omi-pipe-rs-err-$$"

./bin/omi-pipe < "$FRAME" > "$TMP_OUT" 2> "$TMP_ERR" || true

EXP_OUT="$EXPECTED/$NAME.receipt"
EXP_ERR="$EXPECTED/$NAME.stderr"

scripts/pipe/compare-receipt.sh "$TMP_OUT" "$TMP_ERR" "$EXP_OUT" "$EXP_ERR"
RC=$?

rm -f "$TMP_OUT" "$TMP_ERR"

if [ "$RC" -eq 0 ]; then
    echo "  PASS [rs/$NAME] receipt matches expected"
else
    echo "  FAIL [rs/$NAME] receipt differs"
    exit 1
fi
