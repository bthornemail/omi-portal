#!/bin/sh
# ============================================================================
# OMI QEMU Multi-Arch Setup — register binfmt for cross-architecture builds
# Usage: ./scripts/qemu-setup.sh [--install-qemu]
#   --install-qemu  also install QEMU packages (for bare CI runners)
# ============================================================================
set -e

INSTALL_QEMU=false
if [ "${1:-}" = "--install-qemu" ]; then
  INSTALL_QEMU=true
fi

echo "=== OMI QEMU Multi-Arch Setup ==="

# 1. Install QEMU if requested
if [ "$INSTALL_QEMU" = true ]; then
  echo "[1/3] Installing QEMU user-mode emulators..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq \
      qemu-user-static \
      qemu-user \
      binfmt-support
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache qemu-user-static qemu-user binfmt-support
  else
    echo "ERROR: No package manager found. Install QEMU manually."
    exit 1
  fi
else
  echo "[1/3] Skipping QEMU package install (assumes already installed)"
fi

# 2. Register binfmt interpreters via Docker (if available)
echo "[2/3] Registering QEMU binfmt via Docker..."
if command -v docker >/dev/null 2>&1; then
  docker run --privileged --rm tonistiigi/binfmt --install all 2>/dev/null || \
    docker run --privileged --rm multiarch/qemu-user-static --reset -p yes 2>/dev/null || \
    echo " -> WARNING: binfmt registration container failed; trying system-level..."
fi

# 3. Verify registered architectures
echo "[3/3] Verifying registered binfmt architectures..."
ARCHS="aarch64 arm riscv64"
MISSING=0
for arch in $ARCHS; do
  if grep -q "$arch" /proc/sys/fs/binfmt_misc/qemu-"$arch" 2>/dev/null || \
     [ -f /proc/sys/fs/binfmt_misc/qemu-"$arch" ]; then
    echo " -> [OK] qemu-$arch registered"
  else
    echo " -> [MISSING] qemu-$arch"
    MISSING=$((MISSING + 1))
  fi
done

# 4. Verify Docker buildx
echo "[4/4] Verifying Docker buildx..."
if docker buildx version >/dev/null 2>&1; then
  echo " -> [OK] buildx $(docker buildx version | cut -d' ' -f2)"
else
  echo " -> [WARNING] buildx not available; enabling..."
  docker buildx create --use --name omi-builder --driver docker-container 2>/dev/null || \
    docker buildx use omi-builder 2>/dev/null || true
fi

if [ "$MISSING" -gt 0 ]; then
  echo " -> WARNING: $MISSING arch(s) missing binfmt registration."
  echo "    Cross-arch QEMU builds may fall back to native only."
fi

echo "=== QEMU Setup Complete ==="
exit 0
