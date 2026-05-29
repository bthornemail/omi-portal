#!/bin/sh
# ============================================================================
# OMI CI Test Runner — multi-stage pipeline for production release
# Usage: ./scripts/ci-test.sh [--qemu] [--smoke] [--all]
#   --qemu    run QEMU cross-arch tests
#   --smoke   run Docker smoke test after build
#   --all     full pipeline: unit → build → qemu → smoke
# ============================================================================
set -e

MODE="${1:-all}"
echo "=== OMI CI Test Pipeline ==="

# 1. Unit tests (native)
run_unit() {
  echo "--- [1/4] Unit Tests ---"
  npm ci --ignore-scripts
  npm test
  echo " -> [PASS] All unit tests pass"
}

# 2. Production build
run_build() {
  echo "--- [2/4] Production Build ---"
  npm run build
  echo " -> [PASS] Build produces $(ls -1 dist/assets/*.js 2>/dev/null | wc -l) modules"
}

# 3. QEMU cross-arch tests
run_qemu() {
  echo "--- [3/4] QEMU Multi-Arch Tests ---"

  if ! command -v docker >/dev/null 2>&1; then
    echo " -> SKIP: docker not available"
    return 0
  fi

  # Run tests on each target platform via QEMU user-mode
  for platform in linux/amd64 linux/arm64; do
    echo " -> Testing on ${platform}..."
    if docker run --rm --platform "$platform" \
      -v "$(pwd):/test" -w /test \
      "node:24-alpine" \
      sh -c "apk add --no-cache build-base >/dev/null && npm ci --ignore-scripts --quiet && make test-c99-core && find test -maxdepth 1 -name '*.test.js' ! -name 'softmmu-system.test.js' -print | sort | xargs node --test" 2>/dev/null; then
      echo " -> [PASS] ${platform} tests pass"
    else
      echo " -> [FAIL] ${platform} tests failed"
      exit 1
    fi
  done

  echo " -> All QEMU cross-arch tests pass"
}

# 4. Docker smoke test
run_smoke() {
  echo "--- [4/4] Docker Smoke Test ---"

  if ! command -v docker >/dev/null 2>&1; then
    echo " -> SKIP: docker not available"
    return 0
  fi

  # Build and run smoke test
  docker compose down --volumes --remove-orphans 2>/dev/null || true
  docker compose up --build -d omi-kernel-node 2>/dev/null || {
    # Fallback: build directly
    docker build -t omi-portal-smoke -f Dockerfile --target runtime .
    docker run -d --name omi-smoke -p 8080:80 omi-portal-smoke
  }

  # Wait for health
  TIMEOUT=15
  COUNTER=0
  while [ "$(docker inspect --format='{{.State.Health.Status}}' omi-smoke 2>/dev/null || echo starting)" != "healthy" ]; do
    if [ $COUNTER -gt $TIMEOUT ]; then
      echo " -> ERROR: smoke container unhealthy"
      docker logs omi-smoke 2>/dev/null || true
      exit 1
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
  done

  # Verify COOP/COEP headers
  HEADERS=$(curl -sI http://localhost:8080/ 2>/dev/null || true)
  echo "$HEADERS" | grep -qi "Cross-Origin-Opener-Policy.*same-origin" || {
    echo " -> ERROR: COOP header missing"
    exit 1
  }
  echo "$HEADERS" | grep -qi "Cross-Origin-Embedder-Policy.*require-corp" || {
    echo " -> ERROR: COEP header missing"
    exit 1
  }

  docker rm -f omi-smoke 2>/dev/null || true
  echo " -> [PASS] Smoke test — COOP/COEP verified"
}

case "$MODE" in
  unit)    run_unit ;;
  build)   run_build ;;
  qemu)    run_unit; run_build; run_qemu ;;
  smoke)   run_build; run_smoke ;;
  all|*)
    run_unit
    run_build
    run_qemu
    run_smoke
    ;;
esac

echo "=== OMI CI Pipeline Complete ==="
exit 0
