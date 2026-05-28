#!/usr/bin/env bash
# ==============================================================================
# create-omi: OMI Protocol Workspace Scaffolding Utility
# Usage: create-omi [project-directory]
# If no directory is given, scaffolds in the current directory.
# ==============================================================================
set -euo pipefail

OMI_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-.}"
TARGET="$(realpath -m "$TARGET")"

if [ -f "$TARGET/package.json" ]; then
  echo "[create-omi] Error: target already contains a package.json: $TARGET" >&2
  exit 1
fi

mkdir -p "$TARGET"
mkdir -p "$TARGET/src" "$TARGET/test" "$TARGET/scripts" "$TARGET/public"

echo "[create-omi] Scaffolding OMI workspace in: $TARGET"

# package.json
cat > "$TARGET/package.json" << 'PKGJSON'
{
  "name": "omi-platform-workspace",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "node --test test/*.test.js",
    "start": "node src/server.js"
  },
  "dependencies": {},
  "devDependencies": {
    "vite": "^6.4.2",
    "terser": "^5.31.0"
  }
}
PKGJSON

# Makefile
cp "$OMI_ROOT/Makefile" "$TARGET/Makefile"

# omi.config.json
cp "$OMI_ROOT/omi.config.json" "$TARGET/omi.config.json"

# nginx.conf
cp "$OMI_ROOT/nginx.conf" "$TARGET/nginx.conf"

# Dockerfile.softmmu
if [ -f "$OMI_ROOT/Dockerfile.softmmu" ]; then
  cp "$OMI_ROOT/Dockerfile.softmmu" "$TARGET/Dockerfile.softmmu"
fi

# docker-compose.yml
cat > "$TARGET/docker-compose.yml" << 'DOCKCOMP'
services:
  omi-kernel-node:
    build:
      context: .
      dockerfile: Dockerfile.softmmu
      target: runtime
    container_name: omi-core-gateway
    restart: always
    volumes:
      - shared-bus:/tmp/omi-bus
    ports:
      - "8080:80"
    labels:
      omi.context-root: "omi-ffff-127-0-0-1"
      omi.memory-stride: "40320B"

  qemu-system-emulators:
    build:
      context: .
      dockerfile: Dockerfile.softmmu
      target: emulator
    container_name: omi-qemu-matrix
    restart: on-failure
    depends_on:
      - omi-kernel-node
    security_opt:
      - apparmor:unconfined
    devices:
      - "/dev/kvm:/dev/kvm"
    volumes:
      - shared-bus:/tmp/omi-bus

volumes:
  shared-bus:
    driver: local
DOCKCOMP

# Vite config
cat > "$TARGET/vite.config.js" << 'VITECFG'
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
    rollupOptions: {
      input: "index.html",
      output: {
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  }
})
VITECFG

# index.html (Vite entry + consumer UI)
cat > "$TARGET/index.html" << 'INDEXHTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omi Unified Workspace Canvas</title>
  <style>
    body { background: #07080b; color: #00ffcc; font-family: monospace; padding: 20px; margin: 0; }
    .chiral-node { fill: rgba(0,255,204,0.05); stroke: #00ffcc; stroke-width: 1.5px; transition: transform 0.1s linear; }
    .chiral-node:hover { transform: scale(1.2); fill: rgba(255,0,85,0.2); stroke: #ff0055; }
    h1 { font-size: 18px; font-weight: 400; }
    svg { border: 1px solid #1a2a3a; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Omicron Core Client Surface</h1>
  <svg id="omi-ffff-127-0-0-1" width="800" height="400">
    <g id="omi-ffff-127-0-0-1-0x02-snub-left-NOUN-VERB">
      <circle id="omi-ffff-127-0-0-1-0x02-snub-left-NOUN-VERB-slot720-YmFzZTY0"
              class="chiral-node" cx="100" cy="100" r="15" />
    </g>
  </svg>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
INDEXHTML

# src/main.js
cat > "$TARGET/src/main.js" << 'MAINJS'
const CANONICAL_ROOT = "omi-ffff-127-0-0-1";
const sharedMemoryBuffer = new SharedArrayBuffer(5040 * 8);

const omiWorker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
omiWorker.postMessage({ type: 'INIT_MEMORY_BUFFER', buffer: sharedMemoryBuffer });

omiWorker.onmessage = (event) => {
  if (event.data.type === 'CLOCK_CYCLE_UPDATE') {
    const { targetSlotIndex, computedZDepth } = event.data;
    const targetElement = document.querySelector(`[id*="-slot${targetSlotIndex}-"]`);
    if (targetElement) {
      targetElement.setAttribute('transform', `translate3d(0, 0, ${computedZDepth}px)`);
    }
  }
};

console.log(`[Omi UI Core] bound to root target: ${CANONICAL_ROOT}`);
MAINJS

# src/worker.js
cp "$OMI_ROOT/src/worker.js" "$TARGET/src/worker.js"

# src/server.js
cp "$OMI_ROOT/src/server.js" "$TARGET/src/server.js"

# test/integration.test.js
cp "$OMI_ROOT/test/integration.test.js" "$TARGET/test/integration.test.js"

cp "$OMI_ROOT/test/chiral-fifo.test.js" "$TARGET/test/chiral-fifo.test.js"
cp "$OMI_ROOT/test/chiral-lexer.test.js" "$TARGET/test/chiral-lexer.test.js"
cp "$OMI_ROOT/test/trigraph-preprocessor.test.js" "$TARGET/test/trigraph-preprocessor.test.js"
cp "$OMI_ROOT/test/place-value-interpreter.test.js" "$TARGET/test/place-value-interpreter.test.js"

mkdir -p "$TARGET/src/runtime" "$TARGET/src/omi"
cp "$OMI_ROOT/src/runtime/chiral-fifo-engine.js" "$TARGET/src/runtime/chiral-fifo-engine.js"
cp "$OMI_ROOT/src/omi/chiral-lexer.js" "$TARGET/src/omi/chiral-lexer.js"
cp "$OMI_ROOT/src/omi/trigraph-preprocessor.js" "$TARGET/src/omi/trigraph-preprocessor.js"
cp "$OMI_ROOT/src/omi/place-value-interpreter.js" "$TARGET/src/omi/place-value-interpreter.js"

echo "[create-omi] Installing dependencies..."
cd "$TARGET" && npm ci --quiet 2>/dev/null || npm install --quiet 2>/dev/null

echo "[create-omi] Done. Scaffolded OMI workspace at: $TARGET"
echo ""
echo "  cd $TARGET"
echo "  make test       # run tests"
echo "  make compile    # build production bundle"
echo "  npm run start   # start Node.js proxy on :8080"
echo "  npm run dev     # start Vite dev server"
