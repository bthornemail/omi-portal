# OMI Portal v0.2.0 — Symmetrical Substrate Synchronization

## Summary

Complete deployment substrate lock with 6 new high-precision kernels spanning JAB Code scrambling, Code 16K multi-row framing, Hopf fibration projection, octonionic Fano object model, and tri-clamped sphere packing. All 25 administrative, deployment, and documentation files synchronized to v0.2.0.

**798 tests pass, 0 fail. Build produces 166 modules. Multi-arch: linux/amd64 + linux/arm64.**

## What's New Since v0.0.1

- **JAB Code LFSR Scrambler** — ISO/IEC 23634 primitive polynomial x^16+x^14+x^13+x^11+1, 8-bit mask-byte generation, 16-axis low/high nibble NBD partitioning (Rule 0xC8–0xCA)
- **Code 16K Multi-Row Alist Engine** — USS-16K starting symbol s=7(r-2)+m, modulo-107 weighted C1/C2 checks, odd parity character validation, Code Set A/B/C mapping to canvas presets (Rule 0xCB–0xCD)
- **Hopf Fibration Projector** — Complex S³→S² map p(z₀,z₁) = (2z₀z₁*, |z₀|²−|z₁|²) via integer fixed-point arithmetic, Clifford torus Villarceau nesting parametrization, unit 3-sphere perimeter gate (Rule 0xD4–0xD6)
- **Octonionic Fano Object Model** — Adams fibration S³↪S⁷→S⁴ (OmicronNode 24-Cell) + S⁷↪S¹⁵→S⁸ (Tetragrammatron DOM/CSSOM/JSDOM/Prolog WordNet), 8-point Fano plane XOR mask (Rule 0xD7–0xD9)
- **Tri-Clamped Sphere Packing** — Three Uint8Array(128) buffers for open-class lexical, closed-class inflectional, and functional pointer lanes, 107-symbol Code 16K ceiling, UTF-8/Base64/16K encoding routing (Rule 0xDA–0xDC)
- **FACTS.omi** — Expanded from 0xC1 to 0xDC (27 new rules covering chromatic, trans-dimensional, Hopf, octonion, and sphere packing invariants)
- **CI/CD** — 798 tests across 29 suites, Docker multi-arch bake (runtime + QEMU-test + stress + softmmu), COOP/COEP enforcement

## Pipeline Architecture

```
Ingress (IPv6 saddr / Code 16K / JAB Code / Hopf fiber)
  → Physical Guard/Carrier Decode
    → LFSR Scramble (Rule 0xC8) / NBD Bitplane Split (Rule 0xCA)
      → Code 16K Multi-Row Decode (Rule 0xCB-0xCD)
        → Hopf S³→S² Projection (Rule 0xD4-0xD6)
          → Octonion Fano Bundle (Rule 0xD7-0xD9)
            → Tri-Clamped Sphere Packing (Rule 0xDA-0xDC)
              → Single-Digit Preset "1"-"6" Canvas Output
```

## Quick Start

```bash
make test           # 798 unit tests
make test-all       # sequential segment validation
npm run build       # 166-module production build
make compile-local-docker-image  # multi-arch bake to local cache
```

---

# OMI Portal v0.0.1 — Monolithic Protocol Stack

## Summary

Production-grade multi-arch container release with complete 7-layer OMI protocol stack: Physical Signal Integrity → Transport Ladder → C0 Matrix Planes → Branchless Quadratic Zero-Sum Lexer → Transylvania Lottery Fano Resolution → Lock-Free CAS Ring Indexer → Live SSE Telemetry. Four execution targets (JS, C99, WASM, eBPF/XDP) produce byte-identical structural proofs.

**619 tests pass, 0 fail. Build produces 166 modules.**

## What's New

- **Δ_C-Orbit Lexer** — 128-bit instruction word with branchless quadratic error surface Q(S)=E_var+E_const, Fano plane projective binding, Transylvania lottery resolution (≤14 steps), boot anchor at 0x7c00
- **4 Execution Targets** — Reference (JS), Portable (C99), Executable (WASM), Kernel (eBPF/XDP) all produce identical outputs
- **eBPF/XDP Dual Gate** — IPv6 saddr-as-frame zero-copy extraction, Gate 1 Q(S)=0, Gate 2 manually unrolled Δ_C orbit (1474 bytes JIT-compiled)
- **Lock-Free Ring Indexer** — 64-bit slot packing (provenance:16|steps:8|LL:8|NN:16|MM:16), CAS cursor, epoch wraparound guard, OW-1 through OW-5 overwrite policy
- **IPv6 Wire Profile** — profile.net.v0: 128-bit source address IS the OMI frame, Ethernet offset 0x16, big-endian uint16_t[8], genesis address `0100:03bf:7c00:2b01:2f01:1434:039f:01ff`
- **WAN Latency Telemetry** — SSE probe daemon on port 8082, `/wan-metrics` stream, `/wan-dashboard.html` live dashboard, sub-millisecond edge-tunnel link
- **Barcode Carrier Taxonomy** — ITF/Code39 physical guards, 1D precision ladder (Codabar→Code128→Code16K→Code93), C0 matrix planes (Aztec/Maxi/JABCode/BeeTag)
- **RULES.omi** — 0x01 through 0x57 covering all algebraic, carrier, gate, wire profile, and telemetry invariants

## Pipeline Architecture

```
Ingress (IPv6 saddr / barcode / wire) → Physical Guard → Linear Decode → C0 Parse
                                                                                ↓
Live SSE Telemetry ← CAS Ring Receipt ← User-Space Handoff ← eBPF Gate 2: Δ_C ≤14 ← eBPF Gate 1: Q(S)=0
```

## Test Results

```
ℹ tests 619
ℹ suites 29
ℹ pass  619
ℹ fail  0
```

## Quick Start

```bash
# Develop
git clone <repo>
cd omi-portal
make compile        # npm ci + build
make test           # 619 unit tests

# Docker
make stage          # compose up with nginx runtime
make smoke          # verify COOP/COEP headers

# Multi-arch QEMU tests
make qemu-test      # cross-arch on amd64 + arm64 via QEMU

# eBPF gate
make compile-ebpf-gate
make test-ebpf-pipeline

# WAN telemetry (tunnel core)
make start-telemetry
# Open http://74.208.190.29:8082/wan-dashboard.html

# Release
make release patch  # bump semver, tag, build, push
```

## Multi-Arch Images

- linux/amd64, linux/arm64, linux/arm/v7
- Buildx bake matrix with GHA cache and provenance attestation

## Architectural Invariants

- `Ο` (U+039F) cardinal boundary / `ο` (U+03BF) chiral cons
- `δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C` (period-8)
- `Q(S) = E_var + E_const === 0` — sole structural validity predicate
- `Inv(x) = x ⊕ 0x5A3C` — central inversion mirror
- `()! = ()` — empty-cons fixed point
- `5040 = 7!` — master replay ring size
- SAB(5040×8) — runtime memory ring
- Browser is the projection surface
