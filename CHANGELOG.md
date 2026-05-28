# Changelog

## v1.5.0-chiral-release (2026-05-28) — Closed Core Runtime Milestone

### Notation Engine (new)
- `src/omi/chiral-lexer.js` — symmetrical `omi-*` → `*-imo` tape validation
- `src/omi/trigraph-preprocessor.js` — C11 `??-` trigraph mapping, polarity inversion
- `src/omi/place-value-interpreter.js` — trigraph tally → polynomial degree 0–3

### Browser Surface (changed)
- `public/bidi.html` — chiral notation stream surface with CSSOM selectors, dual-proxy SSE failover, 2.5D transform projection

### Infrastructure (new)
- `Makefile` — compile/test/stage/boot-<arch> targets
- `src/worker.js` — DOM.WebWorker 60Hz SAB ring clock
- `src/server.js` — Node.js proxy with COOP/COEP
- `src/main.js` — worker + main thread init
- `omi.config.json` — partition register map
- `docker-compose.yml` — multi-service deployment
- `scripts/create-omi.sh` — workspace scaffolding

### Projection & Routing (new)
- `src/runtime/chiral-fifo-engine.js` — POSIX FIFO, FFT phase energy
- `src/web/semantic-memory-broker.js` — Prolog+HNSW+polytope clock
- `src/web/tri-tier-network.js` — 16-byte transit frame routing

### Deployment (new)
- `scripts/omi-dual-proxy.js` — dual-stack central tunnel (74.208.190.29:8080)
- `scripts/omi-sse-server.js` — zero-dep SSE edge proxy (69.48.202.32:8080)
- `scripts/debian-bootstrap.sh` — UFW + nginx + systemd
- `scripts/esp32-bridge.sh` — FIFO serial → SAB bridge
- `scripts/deploy.sh` — rsync + bootstrap + smoke test

### Tests
- 262 tests, 0 failures, 3344ms
- 181 modules transformed in build

### Breaking Changes
- None. Backward compat preserved for old `omi-8-` and `local-` prefixes.

---

## v1.4.0 — Triplicate Projection & Boot Compiler

- Triplicate projection engine with centroid coefficients
- Boot compiler with MBR sector parsing (0xAA55 validation)
- SoftMMU full-system QEMU emulation (4 arch targets)
- Semantic memory broker (Prolog + HNSW orchestration)
- Tri-tier network engine (16-byte transit frames)

## v1.3.0 — Polytope SAB & WebGL Bridge

- SAB(5040×8) with factorial strides
- WebGL geometry bridge with HUD
- Code-split build (7 output chunks)

## v1.2.0 — BiDi CodeMirror Bridge

- CM6 Unicode BiDi control flow parser
- Clock timeline (5040-cycle SAB tick)
- DataView polarity/endian extraction

## v1.1.0 — Distributed Protocol Layer

- 9 distributed modules (erasure, gossip, anti-entropy, etc.)
- WebRTC transport + CoTURN proxy
- HNSW vector index + WordNet centroid space
- Prolog broker for semantic routing

## v1.0.0 — Initial Canonical Build

- Core parser (omi-* token structure)
- CSSOM projection surface
- POS graph channel integration
- A-Frame visualization
- Canonical addressing (`omi-ffff-127-0-0-1`)
