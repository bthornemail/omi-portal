#!/usr/bin/env bash
# ============================================================================
# OMI PROTOCOL - AUTOMATED CRONTAB ENVIRONMENT TAPE GENERATOR
# File Target: scripts/omi-cron-frame.sh
# ============================================================================
# Usage: crontab entry:
#   */5 * * * * /path/to/omi-portal/scripts/omi-cron-frame.sh
# ============================================================================

set -euo pipefail

OMI_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FACTS_FILE="${OMI_ROOT}/docs/01-physical/FACTS.omi"
TIMESTAMP_HEX=$(printf '%04x' "$(date +%s | tail -c 5)")
TUNNEL_STATE_OCTET="0040"

echo "omi-0000-0000-0000-0000-13b0-0036-0000-${TIMESTAMP_HEX}/120 MUST cron-update-state" >> "${FACTS_FILE}"
echo "[Omi Cron Frame] Wrote state marker ${TIMESTAMP_HEX} to FACTS.omi"
