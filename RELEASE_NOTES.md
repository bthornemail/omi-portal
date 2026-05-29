# OMI Portal v0.3.0 — Production Release Pipeline

## Summary

Production-grade multi-arch container release pipeline with full QEMU cross-architecture verification. The Omicron Object Model kernel is complete with 5 core modules (CIDR, sexagesimal, inversion, lisp, lattice), specification docs, and a GitHub Actions CI/CD pipeline that builds and tests across linux/amd64, linux/arm64, and linux/arm/v7.

**324 tests pass, 0 fail. Build produces 169 modules.**

## What's New

- **OMI Kernel (5 modules)** — CIDR-v0 address parser, 16-bit delta evaluator, sexagesimal stride lattice, central inversion mirror, S-expression nil-terminator, factorial lattice weights
- **Specification Docs** — `docs/omi-whitepaper.md` (first-principles white paper), `docs/omi-core-spec.md` (normative specification)
- **Dockerfile** — Multi-stage production build with test stage, non-root user, buildx multi-arch ARG, OCI labels, COOP/COEP healthcheck
- **Dockerfile.qemu** — QEMU user-mode test container for cross-architecture validation
- **docker-bake.hcl** — Buildx bake matrix with GHA cache and provenance attestation
- **GitHub Actions CI** — Unit tests + QEMU multi-arch matrix (linux/amd64, arm64, arm/v7) + Docker smoke test
- **GitHub Actions Release** — Tagged multi-arch image push to GHCR, attestation, GitHub Release
- **Release Automation** — `scripts/release.sh` handles version bump, tagging, multi-arch bake, and release creation
- **Makefile** — Updated with `docker-build`, `docker-push`, `release`, `qemu-setup`, `qemu-test` targets

## Pipeline Architecture

```
Commit/PR → CI (unit + QEMU matrix + smoke)
                              ↓
Tag push → Release (multi-arch bake + push + attestation + GitHub Release)
                              ↓
Consumer → docker pull ghcr.io/anomalyco/omi-portal:latest
```

## Test Results

```
ℹ tests 324
ℹ pass  324
ℹ fail  0
```

## Quick Start

```bash
# Clone and develop
git clone https://github.com/anomalyco/omi-portal.git
cd omi-portal
make compile        # npm ci + build
make test           # run unit tests

# Docker
make stage          # compose up with nginx runtime
make smoke          # verify COOP/COEP headers

# Multi-arch QEMU tests
make qemu-test      # run tests on linux/amd64 + linux/arm64 via QEMU

# Release (tag, build, push)
make release minor  # bump minor, build multi-arch, push to GHCR
```

## Multi-Arch Images

- `ghcr.io/anomalyco/omi-portal:latest` (linux/amd64, linux/arm64, linux/arm/v7)
- `ghcr.io/anomalyco/omi-portal-test:latest` (QEMU test images)

## Architectural Invariants

- `Ο` opens the frame
- `--` compresses zero hextets
- `/48` anchors the local frame
- `δ_C(x)` is the period-8 delta evaluator
- `Inv(x) = x ⊕ 0x5A3C` is the one instruction
- `()! = ()` is the empty-cons fixed point
- SAB(5040×8) is the runtime memory ring
- The browser is the projection surface
