#!/bin/sh
# compare-receipt.sh
# Compare canonical OmiPipe receipt fields, ignoring transport-specific noise.
# Usage: compare-receipt.sh <actual-stdout> <actual-stderr> <expected-stdout> <expected-stderr>
#
# Canonical fields compared:
#   status (accepted/reject/repair)
#   scope, accept-seal, seal-byte, gauge-cell, nomogram, nomogram-scale
#   frame-bytes, control, relation, unit
#   car, cdr, cid, repair-cid
#
# Ignored:
#   input=  (contains raw input line, quotes differ per transport)
#   omi-pipe-summary (aggregate line, not frame-level)
#   timing, PID, port, transport banners

set -e

ACTUAL_OUT="$1"
ACTUAL_ERR="$2"
EXPECTED_OUT="$3"
EXPECTED_ERR="$4"

fail=0

# Normalize: strip summary lines and input= fields
normalize() {
    grep -v 'omi-pipe-summary' | sed 's/;input=.*$//' | sed 's/;input=.*//'
}

compare_output() {
    local label="$1"
    local actual="$2"
    local expected="$3"
    local norm_actual; norm_actual=$(normalize < "$actual")
    local norm_expected; norm_expected=$(normalize < "$expected")
    if [ "$norm_actual" != "$norm_expected" ]; then
        echo "  FAIL [$label] receipt mismatch"
        echo "  --- actual ---"
        echo "$norm_actual"
        echo "  --- expected ---"
        echo "$norm_expected"
        return 1
    fi
    return 0
}

if [ -f "$EXPECTED_OUT" ]; then
    compare_output "stdout" "$ACTUAL_OUT" "$EXPECTED_OUT" || fail=1
fi

if [ -f "$EXPECTED_ERR" ]; then
    compare_output "stderr" "$ACTUAL_ERR" "$EXPECTED_ERR" || fail=1
fi

if [ "$fail" -ne 0 ]; then
    exit 1
fi
exit 0
