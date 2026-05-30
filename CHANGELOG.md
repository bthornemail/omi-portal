# Changelog

## v0.0.2 (2026-05-30)

### Release
- v0.0.2 — multi-arch: linux/amd64, linux/arm64, linux/arm/v7
- Full CI pipeline: unit → build → QEMU cross-arch → smoke
- OMI kernel: CIDR-v0, sexagesimal, inversion, lisp, lattice, hypergraph canvas
- 644 tests passing, 0 failing; build transforms 166 modules

---

# Changelog

## v0.0.1 (2026-05-29)

### Release
- v0.0.1 — multi-arch: linux/amd64, linux/arm64, linux/arm/v7
- Full CI pipeline: unit → build → QEMU cross-arch → smoke
- OMI kernel: CIDR-v0, sexagesimal, inversion, lisp, lattice
- 324+ tests passing, 0 failing (initial release baseline)

### Current State (v0.0.1, post-release additions)
- 619 tests, 0 failures; build produces 166 modules
- 4 execution targets: JS, C99, WASM, eBPF/XDP
- 7 protocol layers: Physical → Transport → Geometric → Algebraic → Projective → Atomic → Telemetry
- RULES.omi through rule 0x57; bidi.css 47 selector groups
- Ring overwrite policy (OW-1 through OW-5); IPv6 wire profile (profile.net.v0)
- WAN latency telemetry: SSE probe daemon port 8082, /wan-metrics, /wan-dashboard.html

---

# Changelog

## v0.3.0 (2026-05-29) — Production Release Pipeline

### OMI Kernel — 5 Core Modules
- `src/omi/omicron-kernel.js` — CIDR-v0 address parser, 16-bit delta evaluator (period-8), cons/car/cdr
- `src/omi/sexagesimal-kernel.js` — Hellenistic sexagesimal stride lattice with slot/step extraction
- `src/omi/inversion-kernel.js` — Central inversion `Inv(x) = x ⊕ 0x5A3C`, period-8/prime-73 tracking
- `src/omi/lisp-kernel.js` — S-expression nil-terminator, `()! = ()` empty-cons identity
- `src/omi/lattice-kernel.js` — Factorial lattice weights 0!–7!, fixed-point short-circuit

### Specification Docs
- `docs/omi-whitepaper.md` — First-principles white paper (4 axioms, 16 sections)
- `docs/omi-core-spec.md` — Normative MUST/SHOULD specification (RFC 2119)

### Production CI/CD Pipeline
- `Dockerfile` — Multi-stage: test → builder → nginx runtime with non-root user
- `Dockerfile.qemu` — Multi-arch QEMU user-mode test container (amd64, arm64, arm/v7)
- `docker-bake.hcl` — Buildx bake matrix with GHA cache, provenance attestation
- `scripts/ci-test.sh` — Full pipeline: unit → build → QEMU cross-arch → smoke
- `scripts/release.sh` — Tag, build multi-arch, push, GitHub Release
- `scripts/qemu-setup.sh` — QEMU binfmt registration for CI runners
- `.github/workflows/ci.yml` — CI: unit, QEMU multi-arch matrix, Docker smoke
- `.github/workflows/release.yml` — Release: multi-arch push, attestation, GitHub Release
- `Makefile` — Updated with docker-bake, release, qemu-setup targets

### Tests
- 324 tests, 0 failures (historic baseline; current: 619)
- 169 modules transformed in build (historic; current: 166)
- QEMU cross-arch validated on linux/amd64, linux/arm64, linux/arm/v7

### Breaking Changes
- None. Backward compat preserved. Canonical root: `ffff-127--/48`

---

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
