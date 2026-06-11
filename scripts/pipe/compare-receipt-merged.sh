#!/bin/sh
# compare-receipt-merged.sh
# Like compare-receipt.sh but compares combined (stdout+stderr) merged output
# against expected stdout + expected stderr merged. Used for transports that
# cannot separate stdout from stderr (e.g., socat EXEC).

set -e

ACTUAL_COMBINED="$1"
EXPECTED_OUT="$2"
EXPECTED_ERR="$3"

# Normalize: strip summary lines and input= fields
normalize() {
    grep -v 'omi-pipe-summary' | sed 's/;input=.*$//'
}

norm_actual=$(normalize < "$ACTUAL_COMBINED")
norm_expected=$( { [ -f "$EXPECTED_OUT" ] && cat "$EXPECTED_OUT"; [ -f "$EXPECTED_ERR" ] && cat "$EXPECTED_ERR"; } | normalize)

if [ "$norm_actual" != "$norm_expected" ]; then
    echo "  FAIL receipt mismatch (merged mode)"
    echo "  --- actual (combined) ---"
    echo "$norm_actual"
    echo "  --- expected (combined) ---"
    echo "$norm_expected"
    exit 1
fi
exit 0
