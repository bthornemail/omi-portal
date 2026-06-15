# Tetragrammatron Polyharmonic Governor — Index

Status: filed reference outline  
Layer: dev-docs source/reference  
Scope: navigation map for the tetragrammatron dev-docs

## Documents

| # | Document | Type | Core Subject |
|---|----------|------|-------------|
| 1 | [`README.md`](README.md) | folder overview | Face map, eMMC layout, key invariants |
| 2 | [`polyharmonic-governor-axis.md`](polyharmonic-governor-axis.md) | reference synthesis | Three clocks, four offsets, five governor modes, 5-cell timing frame |
| 3 | [`tetragrammatron-meta-memory-automaton.md`](tetragrammatron-meta-memory-automaton.md) | reference draft | Implementation bridge: atomic kernel, cosmic orbit, RRGGBBAA seeds, triad dispatch, CONS lookup |
| 4 | [`configuration-witness-ladder.md`](configuration-witness-ladder.md) | reference synthesis | Incidence architecture of Q_xy = 60x² + 16xy + 4y²; Miquel, Möbius, Möbius–Kantor, Klein witnesses; 11-cell overseer; Perles warning; QuQuart sieve; harmonic governor |
| 5 | [`tetragrammatron.canvas`](tetragrammatron.canvas) | JSON Canvas | 4-bit carry lookahead adder substrate |
| 6 | [`index.html`](index.html) | standalone UI | Tetragrammatron Explorer — interactive 4-bit CLA simulation |

## Conceptual Layers

```
                    ┌──────────────────────┐
                    │  configuration-witness│
                    │  -ladder.md           │
                    │  (incidence geometry)  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  polyharmonic-        │
                    │  governor-axis.md     │
                    │  (clocks/offsets/     │
                    │   governors)          │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  tetragrammatron-     │
                    │  meta-memory-         │
                    │  automaton.md         │
                    │  (implementation)     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  README.md            │
                    │  (face map, layouts,  │
                    │   invariants)         │
                    └──────────────────────┘
```

## Key Map

| Concept | Primary Document | Section |
|---------|-----------------|---------|
| Tetragrammatron frame (12-face triakis tetrahedron) | `README.md` | Tetragrammatron Frame |
| Three clocks (Atomic / Spectral / Cosmic) | `polyharmonic-governor-axis.md` | Three Clocks |
| Four visible offsets (FS, GS, RS, US) | `polyharmonic-governor-axis.md` | Four Visible Offsets |
| Five governors (FACTS–CONS, p=-1..3) | `polyharmonic-governor-axis.md` | Five Polyharmonic Governors |
| Miquel configuration (8₃ 6₄) as Tetragrammatron card frame | `configuration-witness-ladder.md` | §1 — Tetragrammatron Controller |
| QuQuart edge-space C(4,2) = 6 | `configuration-witness-ladder.md` | §1 — QuQuarts and the Miquel Sieve |
| Pasch / complete quadrangle as single-QuQuart skeleton | `configuration-witness-ladder.md` | §1 — QuQuarts and the Miquel Sieve |
| Polybius 4×4 frame as interpreter field | `configuration-witness-ladder.md` | §1 — QuQuarts and the Miquel Sieve |
| Möbius tetrads (8₄) as 4y² atomic clock | `configuration-witness-ladder.md` | §2 — Atomic Logic Clock |
| Möbius–Kantor (8₃ 8₃) as 16xy bridge | `configuration-witness-ladder.md` | §3 — Bridge Plane |
| Klein (60₁₅) as 60x² cosmic orbit | `configuration-witness-ladder.md` | §4 — Cosmic Orbit |
| 11-cell overseer (5 hidden + 6 gauge-pair planes) | `configuration-witness-ladder.md` | §5 — The 11-Cell Overseer |
| Perles configuration as realizability warning | `configuration-witness-ladder.md` | §5 — The Perles Configuration |
| Harmonic governor — Miquel incidence sieve | `configuration-witness-ladder.md` | §1 — QuQuarts / §7 |
| Atomic Kernel / Delta Law / Orbit | `tetragrammatron-meta-memory-automaton.md` | §§2–3 |
| RRGGBBAA seeds and CONS monotonic lookup | `tetragrammatron-meta-memory-automaton.md` | §§6, 9 |
| Triad Dispatch secondary index | `tetragrammatron-meta-memory-automaton.md` | §11 |
| eMMC image layout (5040×8 payload) | `README.md` | eMMC Image Size Formula |
| 4-bit CLA adder substrate | `tetragrammatron.canvas`, `index.html` | — |

## Canonical Invariants

- Five canonical roots: `RULES.omi`, `FACTS.omi`, `CLOSURES.omi`, `COMBINATORS.omi`, `CONS.omi`
- Generated `vectors/*.omi` are proxy configs, not a sixth root
- The receipt is the acceptance boundary
- Projection is not authority
- Incidence validity does not guarantee rational realization (Perles)
- Lower Omicron frame validation and POS graph behavior are preserved
- WordNet synset cells remain semantic centroid identity
