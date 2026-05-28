#!/bin/sh
# ============================================================================
# OMI PROTOCOL: AUTOMATED DEPLOYMENT SELECTION & SMOKE TEST UTILITY
# File Target: scripts/smoke.sh
# Validation Target: omi-core-gateway (Port 8080 Isolation Boundary)
# ============================================================================

set -e

echo "================================================================="
echo "LAUNCHING OMI CORE GATEWAY ISOLATION BOUNDARY SMOKE TEST"
echo "================================================================="

echo "[1/4] Orchestrating multi-stage container build infrastructure..."
docker compose down --volumes --remove-orphans > /dev/null 2>&1 || true
docker compose up --build -d omi-kernel-node

echo "[2/4] Awaiting hardware healthcheck endpoint stabilization..."
TIMEOUT=15
COUNTER=0
STATUS="starting"
while [ "$STATUS" != "healthy" ]; do
    if [ $COUNTER -gt $TIMEOUT ]; then
        echo " -> Error: Container failed to reach healthy status within ${TIMEOUT}s limit."
        docker compose logs omi-kernel-node
        exit 1
    fi
    sleep 1
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' omi-core-gateway 2>/dev/null || echo "starting")
    COUNTER=$((COUNTER + 1))
done
echo " -> Success: Container health check reports optimal execution status."

echo "[3/4] Intercepting cross-origin isolation headers via port 8080..."
HEADERS=$(curl -sI http://localhost:8080/)

COOP=$(echo "$HEADERS" | grep -i "Cross-Origin-Opener-Policy:" || true)
COEP=$(echo "$HEADERS" | grep -i "Cross-Origin-Embedder-Policy:" || true)

if [ -z "$COOP" ] || [ -z "$COEP" ]; then
    echo " -> ERROR: Mandatory security headers are missing or blocked!"
    echo "    SharedArrayBuffer allocation will fail inside production browsers."
    exit 1
fi
echo " -> [Pass] COOP verified: $COOP"
echo " -> [Pass] COEP verified: $COEP"

echo "[4/4] Tearing down the validated test environment mesh..."
docker compose down --volumes > /dev/null 2>&1

echo "================================================================="
echo "OMI MULTI-STAGE COPROCESSOR SMOKE TEST: COMPLIANT & DEPLOYABLE"
echo "================================================================="
exit 0
