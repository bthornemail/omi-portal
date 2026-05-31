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
STATE_DIR="${OMI_ROOT}/.cron-state"
STATE_FILE="${STATE_DIR}/state.journal"
TIMESTAMP_HEX=$(printf '%04x' "$(date +%s | tail -c 5)")

mkdir -p "${STATE_DIR}"

# Append state frame to journal (not to FACTS.omi — that is version controlled)
echo "omi-0000-0000-0000-0000-13b0-0036-0000-${TIMESTAMP_HEX}/120 MUST cron-update-state" >> "${STATE_FILE}"

# Trim journal to last 60 entries
tail -n 60 "${STATE_FILE}" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "${STATE_FILE}"

echo "[Omi Cron Frame] Wrote state marker ${TIMESTAMP_HEX} to state journal"

# Signal any listening process via tmpfs
SHM_SIGNAL="/dev/shm/omi-cron-tick"
echo "${TIMESTAMP_HEX}" > "${SHM_SIGNAL}"
echo "[Omi Cron Frame] Signaled ${SHM_SIGNAL}"
