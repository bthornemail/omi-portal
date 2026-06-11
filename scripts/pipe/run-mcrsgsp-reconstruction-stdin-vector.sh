#!/bin/sh
# run-mcrsgsp-reconstruction-stdin-vector.sh
# MCRSGSP reconstruction stdin baseline: feed frame via stdin, compare against expected.
# Usage: run-mcrsgsp-reconstruction-stdin-vector.sh <name>
#   Frames:  test/pipe-mcrsgsp-reconstruction/frames/<name>.omi
#   Expected: test/pipe-mcrsgsp-reconstruction/expected/<name>.{receipt,stderr}

set -e

NAME="$1"
DIR="test/pipe-mcrsgsp-reconstruction"
FRAME="$DIR/frames/$NAME.omi"
EXPECTED="$DIR/expected"

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

TMP_OUT="/tmp/omi-pipe-rec-out-$$"
TMP_ERR="/tmp/omi-pipe-rec-err-$$"

./bin/omi-pipe < "$FRAME" > "$TMP_OUT" 2> "$TMP_ERR" || true

EXP_OUT="$EXPECTED/$NAME.receipt"
EXP_ERR="$EXPECTED/$NAME.stderr"

scripts/pipe/compare-receipt.sh "$TMP_OUT" "$TMP_ERR" "$EXP_OUT" "$EXP_ERR"
RC=$?

rm -f "$TMP_OUT" "$TMP_ERR"

if [ "$RC" -eq 0 ]; then
    echo "  PASS [reconstruct/$NAME] receipt matches expected"
else
    echo "  FAIL [reconstruct/$NAME] receipt differs"
    exit 1
fi
