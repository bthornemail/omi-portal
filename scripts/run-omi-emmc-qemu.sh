#!/bin/sh
set -eu

# Operator-controlled QEMU raw block carrier for the eMMC-shaped OMI state image.
# This attaches the deterministic image through QEMU's SD/raw drive surface; it is
# not a claim of hardware-accurate eMMC emulation.

IMAGE="${OMI_EMMC_IMAGE:-dist/omi-emmc-state.img}"
BOOT_ARTIFACT="${OMI_QEMU_BOOT_ARTIFACT:-dist/omi-boot-kernel.bin}"
QEMU_SYSTEM="${OMI_QEMU_SYSTEM:-qemu-system-aarch64}"
QEMU_MACHINE="${OMI_QEMU_MACHINE:-virt}"

if [ ! -f "$IMAGE" ]; then
  echo "Missing eMMC image: $IMAGE" >&2
  echo "Run: make emmc-state" >&2
  exit 1
fi

if [ ! -f "$BOOT_ARTIFACT" ]; then
  echo "Missing boot artifact: $BOOT_ARTIFACT" >&2
  echo "Set OMI_QEMU_BOOT_ARTIFACT to the existing raw OMI boot kernel." >&2
  exit 1
fi

echo "Launching QEMU raw block carrier for eMMC-shaped OMI state image: $IMAGE" >&2

exec "$QEMU_SYSTEM" \
  -machine "$QEMU_MACHINE" \
  -display none \
  -nographic \
  -kernel "$BOOT_ARTIFACT" \
  -drive "file=$IMAGE,format=raw,if=sd"
