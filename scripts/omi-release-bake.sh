#!/usr/bin/env bash
# ============================================================================
# OMI PROTOCOL - CRYPTOGRAPHIC SNAPSHOT & METRIC PACKER
# File Target: scripts/omi-release-bake.sh
# ============================================================================

set -euo pipefail

RELEASE_TAG="v0.2.0"
OUTPUT_DIR="build-artifacts"

echo "[Omi Release] Compacting production compilation artifacts for ${RELEASE_TAG}..."
mkdir -p "${OUTPUT_DIR}"

# 1. Compress the 166 standalone code-split distribution chunks
tar -czf "${OUTPUT_DIR}/omi-portal-dist-${RELEASE_TAG}.tar.gz" dist/ public/

# 2. Bundle the core project specifications and rules manifests
tar -czf "${OUTPUT_DIR}/omi-protocol-specs-${RELEASE_TAG}.tar.gz" docs/ RULES.omi

# 3. Compute absolute SHA256 cryptographic signatures matching Rule 0x110
cd "${OUTPUT_DIR}"
sha256sum *.tar.gz > "SHA256SUMS.${RELEASE_TAG}.txt"

echo "============================================================================"
echo "OMI PROTOCOL SUITE: ARCHIVE CHECKSUMS GENERATED"
cat "SHA256SUMS.${RELEASE_TAG}.txt"
echo "============================================================================"
