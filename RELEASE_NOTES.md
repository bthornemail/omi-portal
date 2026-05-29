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
