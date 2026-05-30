# OMI Object Model — Tetragrammatron

The **Tetragrammatron** is the developer's guide to the Omicron Object Model (OMI) protocol suite. Its architecture mirrors a **triakis tetrahedron** — 12 faces (11 protocol layers + 1 workspace inbox) arranged around a central tetrahedral core.

```
           ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
          █  TETRAGRAMMATRON  █
          █  12-face triakis  █
          █  tetrahedron      █
           ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
          ╱  ╲  ╱  ╲  ╱  ╲
        ╱      ╲      ╱      ╲
      ╱  Face 1  ╲  Face 2  ╱  ...
    ╱______________╲__________╱
```

Each face is a developer walkthrough for one protocol layer. Every document follows a three-tier progression:

| Tier | Reader | Covers |
|------|--------|--------|
| 🟢 **What** | Beginner | Conceptual overview, problem statement, ASCII diagrams |
| 🔵 **How** | Intermediate | Source file map, key code paths, data structures, test tour |
| 🔴 **Extend** | Expert | Extension points, edge cases, performance constraints, FACTS.omi rules |

## Face Map

| Face | Folder | Layer | `src/` Core | `test/` Core |
|------|--------|-------|-------------|--------------|
| 1 | `signal-guards-boundary/` | Physical — ITF Clock Sync & Code39 Framing | `wan/`, `runtime/chiral-fifo-engine.js` | `wan-*.test.js`, `chiral-fifo.test.js` |
| 2 | `ladder-ingests-frame/` | Data Link — 1D Ingestion Ladder (Codabar→Code93) | `omi/barcode-ecc-tables.js`, `omi/ecc-kernel.js` | `barcode-ecc.test.js` |
| 3 | `plane-isolates-matrix/` | Topographic — 2D Matrix C0 Control Separation | `omi/quadratic-lexer.js`, `canvas/omicron-canvas.js` | `quadratic-lexer.test.js`, `canvas-spec.test.js` |
| 4 | `surface-evaluates-orbit/` | Algebraic — Q(S)=0 Branchless Zero-Sum Surface | `omi/delta-orbital-lexer.js`, `omi/boolean-kernel.js` | `delta-orbital-lexer.test.js`, `boolean-kernel.test.js` |
| 5 | `orbit-resolves-truth/` | Projective — δ_C_LL State Transitions (k<15) | `omi/delta-orbital-lexer.js`, `omi/ring-indexer.js` | `ring-indexer.test.js`, `wasm-delta-equivalence.test.js` |
| 6 | `cursor-advances-ring/` | Atomic Ledger — Lock-Free CAS over 5040 Slots | `omi/ring-indexer.js`, `runtime/polytope-sab.js` | `ring-indexer.test.js`, `polytope-sab.test.js` |
| 7 | `engine-unifies-fact/` | Inference Mesh — Prolog/WordNet Unification | `omi/prolog-inference.js`, `wordnet/` | `prolog-inference.test.js`, `wordnet-centroid.test.js` |
| 8 | `bus-tracks-dividend/` | Hardware Metadata — 24-Bit Spare Dividend | `web/hardware-bus.js`, `web/tri-tier-network.js` | `hardware-bus.test.js`, `tri-tier-network.test.js` |
| 9 | `normalizer-extracts-exponent/` | BFP Normalization — CLZ Exponent Detection | `canvas/omicron-canvas.js` (BFP section) | `bfp-canvas.test.js`, `fp16-canvas.test.js` |
| 10 | `matrix-maps-nonogram/` | Nonogram NAT64 — 2x2 Fano Block Matrix | `omi/nonogram-resolver.js` | `nonogram-resolver.test.js`, `preset-color.test.js` |
| 11 | `significand-encodes-chroma/` | Chromatic Recon — HSV→RGBA Exponential Alpha | `canvas/omicron-canvas.js` (Chromatic section) | `chromatic-rgba.test.js` |
| 12 | `(root)` | CLA — 4-Bit Carry Lookahead Adder Substrate | `omi/cla-adder.js`, `canvas/omicron-canvas.js` (SexagesimalCLA) | `cla-circuit.test.js`, `sexagesimal-cla.test.js` |
| 13 | `(root)` | BIJ — Bijective Two-Cube State Transition Kernel | `omi/bijective-cube-kernel.js` | `bijective-cube.test.js` |
| GC | `_temp/` | Workspace inbox / garbage collection | — | — |

## How to Use This Guide

1. **Start at Face 1** and read through sequentially if you are new to the protocol.
2. **Jump to a specific face** if you need to understand or modify a particular layer.
3. **Cross-reference** with `docs/01-physical/FACTS.omi` for rule definitions and `docs/10-declaration/omi-object-model.manifest.json` for implementation status.
4. **Use `_temp/`** as a scratch workspace for draft notes, diagrams, or work-in-progress documents before they graduate to a canonical face.

## Key Invariants Across All Layers

- **Zero floating-point math** — all arithmetic uses integer bitboards, CLZ, and block floating-point exponents.
- **Branchless gates** — algebraic filters compute via sum-of-squares, never conditional branches.
- **5040-cycle master clock** — all timeline slots decompose as `tick % 5040` = `7!` Fano permutation cycle.
- **SharedArrayBuffer** — inter-module state passes through lock-free `Atomics` over SAB slots.
- **No notation mixing** — every hex token is a pure `omi-XXXX-.../48` CIDR string.


