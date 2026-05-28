#!/bin/bash
# ============================================================================
# OMI TRI-TIER ESP32 HARDWARE BRIDGE
# Maps ESP32 Web Serial CDC-ACM bytes into OMI address space via named pipe.
# Usage: ./scripts/esp32-bridge.sh [fifo_path]
#   Default fifo_path: /tmp/omi-esp32.fifo
# ============================================================================
set -e

FIFO="${1:-/tmp/omi-esp32.fifo}"
SAB_DEV="${SAB_DEV:-/dev/shm/omi-sab-5040}"
TICK=0

echo "=== OMI ESP32 HARDWARE BRIDGE ==="
echo "FIFO  : $FIFO"
echo "SAB   : $SAB_DEV (SharedArrayBuffer mirror)"

# Create the named pipe for ESP32 byte streaming
if [ ! -p "$FIFO" ]; then
  rm -f "$FIFO"
  mkfifo "$FIFO"
  echo " -> Created FIFO at $FIFO"
fi

# Allocate shared memory mirror (5040 * 8 = 40320 bytes)
if [ ! -f "$SAB_DEV" ]; then
  dd if=/dev/zero bs=40320 count=1 of="$SAB_DEV" 2>/dev/null
  echo " -> Allocated SAB mirror at $SAB_DEV (40320 bytes)"
fi

echo " -> Listening for ESP32 byte frames on FIFO..."
echo "    Pipe data in with:  echo 'raw_hex_bytes' > $FIFO"
echo "    Or from ESP32 serial: cat /dev/ttyUSB0 > $FIFO"
echo ""

# Read loop: consumes hex byte frames from FIFO, writes to SAB mirror
while true; do
  if read -r line < "$FIFO"; then
    TICK=$(( (TICK + 1) % 5040 ))
    OFFSET=$(( TICK * 8 ))

    # Write to shared memory mirror at current tick slot
    printf "%s" "$line" | dd of="$SAB_DEV" bs=1 seek="$OFFSET" count=8 conv=notrunc 2>/dev/null

    # Emit OMI-formatted address for this frame
    echo "tick=$TICK slot=$OFFSET addr=omi-ffff-127-0-0-1-0x01-esp32-$(hostname)-slot$TICK"
  fi
done
