# AGENTS

This repository is the root OMI Portal workspace. Treat it as the canonical implementation branch.

## Ground Rules

- Preserve the existing POS graph channel behavior.
- Preserve WordNet synset cells as semantic centroid identity.
- Add OMI projection and indexing as a bridge layer, not as a replacement for existing graph semantics.
- Keep `dev-docs/` as source/reference material. Do not copy transcript content wholesale into canonical docs.
- Treat `demos/` as reference-only snapshots unless a root artifact is truly missing.
- Do not rewrite `chat.history.html`.

## Core Axioms (OMI = Omicron Object Model)

- **Ο** (U+039F) = cardinal boundary operator / zero-frame / subnet containment
- **ο** (U+03BF) = chiral execution operator / local cons transition
- `Ο-<car>-<cdr>` = Omi cons pair (car = control/boundary, cdr = payload/continuation)
- `δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C` = bitwise cons transition (period-8)
- `--` = zero compression (IPv6 `::`-style)
- `/N` = CIDR prefix scope (0–128, `/48` canonical local frame)
- `60` = sexagesimal place-value clock (Hellenistic digit bound 0–59)
- `240 = 4×60` public projection lattice
- `360 = 6×60` orientation field
- `720 = 2×360` / `6!` mirrored orientation
- `5040 = 7!` master Fano permutation cycle
- `Inv(x) = x ⊕ 0x5A3C` = central inversion bitwise mirror (balanced symmetry under prime ideal 73)
- `()! = ()` = empty-cons identity law (the fixed point); `0! = 1` is the numeric form
- `() ≠ ()!` = syntactic distinction between value (state) and operation (transition)
- `!` = execution suffix / cons closure trigger
- Factorial lattice: `0!→1→2!→2→3!→6→4!→24→5!→120→6!→720→7!→5040`

## Current Canonical Roots

- Address root: `ffff-127-0-0-1` (no `omi-` alias; canonical is `ffff-127--/48`)
- Main framework doc: `docs/omi-object-model.md`
- Manifest: `docs/omi-object-model.manifest.json`
- GUI files: `public/document.html`, `public/aframe.html`, `public/bidi.html`
- CIDR kernel: `src/omi/omicron-kernel.js`
- Sexagesimal kernel: `src/omi/sexagesimal-kernel.js`
- Inversion kernel: `src/omi/inversion-kernel.js`
- Lisp kernel: `src/omi/lisp-kernel.js`
- Lattice kernel: `src/omi/lattice-kernel.js`

## Implementation Expectations

- Prefer reusable source modules under `src/` over inline GUI-only logic.
- Keep browser GUIs lightweight and wired to exported helpers.
- Use native DOM `dataset` and CSSOM selectors as the filtering/display source of truth when possible.
- Keep speculative WebRTC, CoTURN, HNSW, CodeMirror, Prolog runtime, and WebGL surfaces clearly labeled unless they are implemented locally.
- Add tests for parser, manifest, and deterministic indexing changes.

## Verification

Run these before handing off implementation changes:

```bash
npm test
npm run build
```

For GUI changes, also run Vite and smoke the affected public page:

```bash
npm run dev
```

## Production Pipeline

For a full CI/CD pipeline verification (multi-arch QEMU tests, Docker smoke test):

```bash
make test                   # unit tests
make docker-build           # multi-arch buildx bake (requires Docker + QEMU binfmt)
make qemu-test              # QEMU cross-arch tests via Docker
make release-dry-run patch  # dry-run release (no push)
make release patch          # full release (tag, multi-arch build, push to GHCR)
```

### CI Pipeline (GitHub Actions)

- `.github/workflows/ci.yml` — on push/PR to main: unit tests + QEMU multi-arch matrix (linux/amd64, arm64, arm/v7) + Docker smoke test with COOP/COEP verification
- `.github/workflows/release.yml` — on `v*` tag: multi-arch bake and push to container registry with provenance attestation + GitHub Release

### Docker Architecture

- `Dockerfile` — Multi-stage: `base` (npm ci) → `test` (npm test) → `builder` (npm run build) → `runtime` (nginx, non-root `omi` user, COOP/COEP, HEALTHCHECK)
- `Dockerfile.qemu` — Multi-arch test container for `--platform linux/amd64|arm64|arm/v7`
- `docker-bake.hcl` — Buildx bake matrix with GHA cache, provenance attestation, and release tag variants
- `Dockerfile.softmmu` — QEMU full-system emulator suite (x86_64, i386, aarch64, riscv64, ppc64, mips64)
