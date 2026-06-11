#!/bin/sh
# run-omi-acceptance-stdin-vector.sh
# OMI acceptance stdin baseline: feed frame via stdin, compare against expected.
# Usage: run-omi-acceptance-stdin-vector.sh <name>
#   Frames:  test/pipe-omi-acceptance/frames/<name>.omi
#   Expected: test/pipe-omi-acceptance/expected/<name>.{receipt,stderr}

set -e

NAME="$1"
DIR="test/pipe-omi-acceptance"
FRAME="$DIR/frames/$NAME.omi"
EXPECTED="$DIR/expected"

if [ ! -f "$FRAME" ]; then
    echo "  SKIP (frame not found: $FRAME)"
    exit 0
fi

TMP_OUT="/tmp/omi-pipe-accept-out-$$"
TMP_ERR="/tmp/omi-pipe-accept-err-$$"

./bin/omi-pipe < "$FRAME" > "$TMP_OUT" 2> "$TMP_ERR" || true

EXP_OUT="$EXPECTED/$NAME.receipt"
EXP_ERR="$EXPECTED/$NAME.stderr"

scripts/pipe/compare-receipt.sh "$TMP_OUT" "$TMP_ERR" "$EXP_OUT" "$EXP_ERR"
RC=$?

rm -f "$TMP_OUT" "$TMP_ERR"

if [ "$RC" -eq 0 ]; then
    echo "  PASS [accept/$NAME] receipt matches expected"
else
    echo "  FAIL [accept/$NAME] receipt differs"
    exit 1
fi
