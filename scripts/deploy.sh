#!/bin/bash
# ============================================================================
# OMI DEPLOY: Push to any remote host (VPS, laptop, edge node)
# Usage: ./scripts/deploy.sh <host> [remote_dir]
#   host       - SSH alias or user@host (default: large)
#   remote_dir - target path (default: /root/omi-portal)
# ============================================================================
set -e

REMOTE="${1:-large}"
REMOTE_DIR="${2:-/root/omi-portal}"
LOCAL_DIR="/root/omi-portal"

echo "=== OMI DEPLOY TO $REMOTE:$REMOTE_DIR ==="

# 1. Rsync project (exclude bulky/non-essential)
echo "[1/5] Syncing project..."
rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude .opencode \
  --exclude vendor/prolog \
  "$LOCAL_DIR/" "$REMOTE:$REMOTE_DIR/"

# 2. Bootstrap fresh Debian server (if debian-bootstrap.sh exists on target)
echo "[2/5] Running bootstrap..."
ssh "$REMOTE" "if [ -x $REMOTE_DIR/scripts/debian-bootstrap.sh ]; then $REMOTE_DIR/scripts/debian-bootstrap.sh; else echo ' -> skipping bootstrap (not Debian or already bootstrapped)'; fi"

# 3. Start SSE proxy server via systemd or direct node
echo "[3/5] Starting OMI SSE server..."
ssh "$REMOTE" "systemctl start omi-sse 2>/dev/null || nohup node $REMOTE_DIR/scripts/omi-sse-server.js > /var/log/omi-sse.log 2>&1 &"
sleep 1

# 4. Health check
echo "[4/5] Health check..."
HEALTH=$(ssh "$REMOTE" "curl -s http://localhost:8080/ 2>/dev/null" || echo '{"status":"unreachable"}')
echo " -> $HEALTH"

# 5. Verify COOP/COEP headers on SSE stream
echo "[5/5] Verifying COOP/COEP..."
HEADERS=$(ssh "$REMOTE" "curl -sI http://localhost:8080/omi-stream 2>/dev/null" || true)
COOP=$(echo "$HEADERS" | grep -i "Cross-Origin-Opener-Policy:" || echo " MISSING")
COEP=$(echo "$HEADERS" | grep -i "Cross-Origin-Embedder-Policy:" || echo " MISSING")
echo " -> COOP: $COOP"
echo " -> COEP: $COEP"

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "SSE stream: http://$(ssh "$REMOTE" "curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print \$1}'"):8080/omi-stream"
