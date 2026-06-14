# OMI Object Model - Tetragrammatron Polyharmonic Governor

Status: filed reference folder  
Layer: dev-docs source/reference  
Scope: documentation and implementation orientation only

This folder collects the Tetragrammatron developer artifacts that were formerly
at the root of `dev-docs/`. It keeps them together as the reference surface for
the polyharmonic governor interpretation of the Omicron Object Model (OMI).

The chat transcript that motivated this pass remains provenance in
`../_temp/`. This folder records the reusable understanding, not the transcript
itself.

## Folder Artifacts

| Artifact | Role |
| --- | --- |
| [`polyharmonic-governor-axis.md`](polyharmonic-governor-axis.md) | Concise synthesis of the three clocks, four offsets, and five governor modes. |
| [`tetragrammatron-meta-memory-automaton.md`](tetragrammatron-meta-memory-automaton.md) | Implementation-facing bridge from the hidden 5! automaton to current code, generated vectors, and verification gates. |
| [`tetragrammatron.canvas`](tetragrammatron.canvas) | JSON Canvas layout for the 4-bit carry lookahead adder substrate. |
| [`index.html`](index.html) | Standalone Tetragrammatron Explorer for the interactive 4-bit CLA simulation. |

## Tetragrammatron Frame

The **Tetragrammatron** is the developer guide to the OMI protocol suite. Its
architecture mirrors a **triakis tetrahedron**: 12 visible faces arranged around
a hidden interpretive core.

```text
           TETRAGRAMMATRON
        12-face triakis tetrahedron

          face   face   face
            \     |     /
             \    |    /
              hidden governor
```

The current polyharmonic interpretation separates three related surfaces:

```text
Three clocks:
  Atomic Logic Clock      = 4y² low-plane carry/cell clock
  Spectral Observer Clock = 16xy bridge/projection clock
  Cosmic Orbit Clock      = 60x² high-plane orbit clock

Four visible offsets:
  0x0001 0x0010 0x0100 0x1000
  FS     GS     RS     US

Five governors:
  FACTS        p=-1 harmonic inverse ground
  RULES        p=0  geometric Genesis pivot
  CLOSURES     p=1  arithmetic sequence seal
  COMBINATORS  p=2  quadratic relation bridge
  CONS         p=3  cubic runtime object body
```

This is a reference-layer model. It does not replace POS graph channels,
WordNet synset centroid identity, lower Omicron frame validation, or existing
runtime graph semantics.

## Face Map

The broader developer guide still organizes the protocol through the dev-docs
face folders:

| Face | Folder | Layer | `src/` Core | `test/` Core |
| --- | --- | --- | --- | --- |
| 1 | `../signal-guards-boundary/` | Physical - ITF Clock Sync & Code39 Framing | `wan/`, `runtime/chiral-fifo-engine.js` | `wan-*.test.js`, `chiral-fifo.test.js` |
| 2 | `../ladder-ingests-frame/` | Data Link - 1D Ingestion Ladder (Codabar to Code93) | `omi/barcode-ecc-tables.js`, `omi/ecc-kernel.js` | `barcode-ecc.test.js` |
| 3 | `../plane-isolates-matrix/` | Topographic - 2D Matrix C0 Control Separation | `omi/quadratic-lexer.js`, `canvas/omicron-canvas.js` | `quadratic-lexer.test.js`, `canvas-spec.test.js` |
| 4 | `../surface-evaluates-orbit/` | Algebraic - Q(S)=0 Branchless Zero-Sum Surface | `omi/delta-orbital-lexer.js`, `omi/boolean-kernel.js` | `delta-orbital-lexer.test.js`, `boolean-kernel.test.js` |
| 5 | `../orbit-resolves-truth/` | Projective - delta_C_LL State Transitions (k<15) | `omi/delta-orbital-lexer.js`, `omi/ring-indexer.js` | `ring-indexer.test.js`, `wasm-delta-equivalence.test.js` |
| 6 | `../cursor-advances-ring/` | Atomic Ledger - Lock-Free CAS over 5040 Slots | `omi/ring-indexer.js`, `runtime/polytope-sab.js` | `ring-indexer.test.js`, `polytope-sab.test.js` |
| 7 | `../engine-unifies-fact/` | Inference Mesh - Prolog/WordNet Unification | `omi/prolog-inference.js`, `wordnet/` | `prolog-inference.test.js`, `wordnet-centroid.test.js` |
| 8 | `../bus-tracks-dividend/` | Hardware Metadata - 24-Bit Spare Dividend | `web/hardware-bus.js`, `web/tri-tier-network.js` | `hardware-bus.test.js`, `tri-tier-network.test.js` |
| 9 | `../normalizer-extracts-exponent/` | BFP Normalization - CLZ Exponent Detection | `canvas/omicron-canvas.js` | `bfp-canvas.test.js`, `fp16-canvas.test.js` |
| 10 | `../matrix-maps-nonogram/` | Nonogram NAT64 - 2x2 Fano Block Matrix | `omi/nonogram-resolver.js` | `nonogram-resolver.test.js`, `preset-color.test.js` |
| 11 | `../significand-encodes-chroma/` | Chromatic Recon - HSV to RGBA Exponential Alpha | `canvas/omicron-canvas.js` | `chromatic-rgba.test.js` |
| 12 | this folder | CLA substrate and Tetragrammatron explorer | `omi/cla-adder.js`, `canvas/omicron-canvas.js` | `cla-circuit.test.js`, `sexagesimal-cla.test.js` |
| 13 | this folder | BIJ - Bijective Two-Cube State Transition Kernel | `omi/bijective-cube-kernel.js` | `bijective-cube.test.js` |
| GC | `../_temp/` | Workspace inbox / garbage collection | - | - |

## Key Invariants

- Keep `dev-docs/_temp/` as provenance, not canonical docs.
- Preserve the five canonical declaration roots: `RULES.omi`, `FACTS.omi`,
  `CLOSURES.omi`, `COMBINATORS.omi`, and `CONS.omi`.
- Treat generated `vectors/*.omi` as proxy configs, not a sixth root.
- Preserve POS graph behavior and WordNet synset cells as semantic centroid
  identity.
- Keep projection language separate from validation authority: symbols project
  the law; they do not create the law.
