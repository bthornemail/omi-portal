# OMI Protocol v1.5.0-chiral-release — Closed Core Runtime Milestone

## Summary

The notation runtime is closed. Every layer from raw trigraph preprocessor through symmetrical chiral lexer, place-value interpreter, SAB polytope memory, boot compiler, semantic routing mediator, tri-tier network engine, and dual-stack SSE proxy deployment is implemented, tested (262 pass, 0 fail), and build-verified (181 modules, 5 code-split chunks).

## What's New

- **Symmetrical Chiral Turing Tape** — `OmiSymmetricalChiralLexer` validates `omi-*` to `*-imo` boundary sequences with zero-escape metadata tagging.
- **C-Preprocessor Trigraph & Place-Value Interpreter** — `??-` trigraph tally resolves polynomial degree (0=Constant, 1=Linear, 2=Quadratic, 3=Cubic FS).
- **Browser Projection Surface** — `public/bidi.html` renders live SSE stream tokens through CSSOM attribute selectors, applying 2.5D translate3d transforms.
- **Hardware-in-the-Loop (HIL) Stress Test** — Virtio/NBD concurrent contention verified at 1.4% degradation (below 5% threshold).
- **Dual-Stack SSE Proxy Cluster** — Deployed on `69.48.202.32` (Debian 13 edge) and `74.208.190.29` (central tunnel), both serving COOP/COEP headers.
- **create-omi Scaffolding** — One-command workspace bootstrap: `bash scripts/create-omi.sh my-project`
- **QEMU SoftMMU Boot Matrix** — Cross-arch boot validation for x86_64, i386, riscv64, aarch64, ppc64.

## Changelog

### Architectural Notation Simplification
- Eliminated `omi-8-` and `local-` prefix segments
- Canonical root: `omi-ffff-127-0-0-1` (::/48 block)
- Backward compat preserved; old tokens normalized silently

### Notation Engine — 3 new modules, 26 new tests
- `src/omi/chiral-lexer.js` — symmetrical tape validation, base64 Float32Array decode (8 tests)
- `src/omi/trigraph-preprocessor.js` — C11 `??-` → `~` mapping, polarity scalar inversion (6 tests)
- `src/omi/place-value-interpreter.js` — trigraph tally → polynomial degree, SAB Float64 read (12 tests)

### Browser Surface
- `public/bidi.html` — replaces baseline CM6 client with chiral notation stream surface
- CSSOM selectors: `[id*="-0x02-left-"]`, `[id*="-??-??-??-"]` drive stroke/fill/filter without JS
- Dual-proxy SSE failover connects to both edge nodes simultaneously

### Infrastructure — 7 new files
- `Makefile` — `make compile`, `make test`, `make stage`, `make boot-<arch>`
- `src/worker.js` — DOM.WebWorker 60Hz SAB ring clock
- `src/server.js` — Node.js `/health` + COOP/COEP
- `src/main.js` — WebWorker + main thread init
- `omi.config.json` — content/context partition registers
- `docker-compose.yml` — multi-service (kernel + QEMU matrix)
- `scripts/create-omi.sh` — workspace scaffolding

### Projection & Routing — 4 modules, 41 new tests
- `src/runtime/chiral-fifo-engine.js` — POSIX FIFO, FFT phase energy, left/right chirality (10 tests)
- `src/web/semantic-memory-broker.js` — Prolog + HNSW + polytope clock orchestration (9 tests)
- `src/web/tri-tier-network.js` — 16-byte transit frames, slot routing (10 tests)
- `test/integration.test.js` — 13 workspace invariant tests

### Deployment
- `scripts/omi-dual-proxy.js` — dual-stack central tunnel (74.208.190.29:8080)
- `scripts/omi-sse-server.js` — zero-dep SSE edge proxy (69.48.202.32:8080)
- `scripts/debian-bootstrap.sh` — UFW + nginx + systemd
- `scripts/esp32-bridge.sh` — FIFO serial → SAB bridge
- `scripts/deploy.sh` — rsync + bootstrap + smoke test
- Both VPS instances updated, services verified live

## Test Results

```
ℹ tests 262
ℹ suites 11
ℹ pass 262
ℹ fail 0
ℹ duration_ms 3344
```

## Build Output

```
dist/assets/main-*.js                       3.30 kB
dist/assets/bidi-*.js                       3.69 kB
dist/assets/index-*.js                      9.69 kB
dist/assets/semantic-memory-broker-*.js    16.39 kB
dist/assets/semantic-text-editor-*.js     497.19 kB
dist/assets/graphics-erasure-engine-*.js    0.15 kB
dist/assets/aframe-*.js                  5204.93 kB
```

## Verifying the Release

```bash
git tag v1.5.0-chiral-release
make stage
./scripts/smoke.sh
```

## Architectural Invariants

- omi opens the frame
- ??- counts the mask degree
- SAB carries coefficient state
- SSE streams live updates
- CSSOM renders structural meaning
- The browser becomes the projection surface
