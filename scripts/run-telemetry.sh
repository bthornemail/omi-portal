#!/bin/bash
# ============================================================================
# OMI TELEMETRY: WAN Latency Probe + EventSource Stream
# Launches the latency probe daemon on the tunnel core node.
# ============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROBE_SCRIPT="$SCRIPT_DIR/wan-latency-probe.js"
PID_FILE="/tmp/omi-wan-probe.pid"
LOG_FILE="/tmp/omi-wan-probe.log"
PROBE_PORT="${PROBE_PORT:-8082}"

case "${1:-start}" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "[OMI Telemetry] Probe already running (PID $(cat "$PID_FILE"))"
      exit 0
    fi
    echo "[OMI Telemetry] Starting WAN latency probe on port $PROBE_PORT..."
    nohup node "$PROBE_SCRIPT" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "[OMI Telemetry] Started (PID $(cat "$PID_FILE"))"
    echo "[OMI Telemetry] Log: $LOG_FILE"
    echo "[OMI Telemetry] SSE: http://74.208.190.29:$PROBE_PORT/wan-metrics"
    echo "[OMI Telemetry] Dashboard: http://74.208.190.29:$PROBE_PORT/wan-dashboard.html"
    ;;
  stop)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      echo "[OMI Telemetry] Stopping probe (PID $PID)..."
      kill "$PID" 2>/dev/null || true
      rm -f "$PID_FILE"
      echo "[OMI Telemetry] Stopped"
    else
      echo "[OMI Telemetry] No probe running"
    fi
    ;;
  status)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "[OMI Telemetry] Probe running (PID $(cat "$PID_FILE"))"
      curl -s http://74.208.190.29:$PROBE_PORT/wan-status 2>/dev/null || echo "  (not responding)"
    else
      echo "[OMI Telemetry] Probe not running"
    fi
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
