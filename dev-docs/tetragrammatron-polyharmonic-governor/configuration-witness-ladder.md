# Configuration Witness Ladder — Incidence Architecture of the Binary Quadratic Form

Status: filed reference synthesis  
Layer: dev-docs source/reference  
Current implementation impact: documentation only; optional registry at `src/omi/configuration-registry.js`

## Purpose

This document names the geometric configuration witnesses for each term of the
OMI binary quadratic form `Q_xy(x,y) = 60x² + 16xy + 4y²` and explains the
Tetragrammatron's role as the OMI eleven-position overseer of the hidden
five-position governor frame.

These are not UI drawings or decoration. They are conserved incidence structures through which relations may be projected and replayed. A configuration witness does not create validity — the receipt accepts — but it provides a fixed combinatorial surface that any valid projection must satisfy.

The geometry here is not literal DOM geometry. It is a catalog of incidence invariants.

The ladder is pattern-first:

```text
the named configuration supplies an incidence type
the OMI term supplies an interpretive role
the fit is checked through degree and flag invariants
the shared count does not prove that the two structures are identical
```

The assignments below are OMI interpretation mappings. They are not claims
that the coefficients of `Q_xy` mathematically derive the named
configurations.

## The Full Ladder

```
Q_xy(x,y) = 60x² + 16xy + 4y²

4y²    → Möbius configuration / Möbius tetrads      (8₄)
16xy   → Möbius–Kantor configuration                 (8₃ 8₃)
60x²   → Klein configuration                         (60₁₅)

Interpreter controller:
nibble / gauge control → Miquel configuration        (8₃ 6₄)
```

## 1. Tetragrammatron Controller — Miquel Configuration (8₃ 6₄)

The Tetragrammatron is not merely "four gauges." Its declared open/sealed
gauge model has the incidence type of a Miquel configuration.

```
Miquel configuration = (8₃ 6₄)

8 points
6 circles
3 circles through each point
4 points on each circle
```

### Mapping

Four gauges: FS, GS, RS, US  
Two boundary states: sealed, open

**8 Miquel points (nibble cards 0x0–0x3, 0xC–0xF):**

| Card | Point |
|------|-------|
| 0x0  | sealed FS |
| 0x1  | sealed GS |
| 0x2  | sealed RS |
| 0x3  | sealed US |
| 0xC  | open FS |
| 0xD  | open GS |
| 0xE  | open RS |
| 0xF  | open US |

**6 Miquel circles (nibble cards 0x4–0x9):**

| Card | Circle | Members |
|------|--------|---------|
| 0x4  | FS–GS  | {sealed FS, open FS, sealed GS, open GS} |
| 0x5  | FS–RS  | {sealed FS, open FS, sealed RS, open RS} |
| 0x6  | FS–US  | {sealed FS, open FS, sealed US, open US} |
| 0x7  | GS–RS  | {sealed GS, open GS, sealed RS, open RS} |
| 0x8  | GS–US  | {sealed GS, open GS, sealed US, open US} |
| 0x9  | RS–US  | {sealed RS, open RS, sealed US, open US} |

**2 bridge cards (0xA–0xB):**

| Card | Role |
|------|------|
| 0xA  | bridge ∞→finite |
| 0xB  | bridge finite→∞ |

### Incidence check

Each point lies on exactly 3 circles:
- sealed FS ∈ {FS–GS, FS–RS, FS–US}
- open FS ∈ {FS–GS, FS–RS, FS–US}
- sealed GS ∈ {FS–GS, GS–RS, GS–US}
- etc.

Each circle contains exactly 4 points:
- FS–GS = {0x0, 0xC, 0x1, 0xD}
- etc.

```
8 points × 3 incidences = 24
6 circles × 4 incidences = 24
```

### Why this is the Tetragrammatron

The Tetragrammatron has four named structural directions (FS, GS, RS, US), each with two boundary states. Every interpreter step happens on a relation between two directions. The relation between two directions is one of the 6 circles.

The full 16-card interpreter is:
- 8 Miquel point cards
- 6 Miquel circle cards
- 2 dual bridge cards

### 16-cell connection

Four axes give ±FS, ±GS, ±RS, ±US = 8 signed vertices.  
Pairwise coordinate planes = C(4,2) = 6 central circles.

The Levi graph has 8 point-vertices, 6 circle-vertices, and 24 incidence edges. The interpreter is a walk on the Levi graph: point → circle → point → circle → receipt.

### Interpretive QuQuarts and the Miquel Sieve

OMI QuQuarts are deterministic four-state interpretation registers. They are
not quantum hardware and do not claim physical superposition.

The abstract Miquel incidence type can be constructed from two such registers
that share the same edge classes. The "6" in the Tetragrammatron is not six
levels; it is the six unordered pairs among four levels.

**One QuQuart** has four levels:

```
Q = {0, 1, 2, 3}
```

Its distinct pairwise edges are C(4,2) = 6:

```
01  02  03
12  13
23
```

This edge skeleton is the complete graph `K4`: four state positions and six
pairwise edges. This document uses it as an OMI edge frame; it does not require
the state register itself to be a geometric point-line realization.

**Two interpretive QuQuarts** sharing the same edge classes generate an
abstract `(8_3 6_4)` incidence structure. Let the two registers be:

```
A = {A0, A1, A2, A3}
B = {B0, B1, B2, B3}
```

Together they give 8 point-states. Each pairwise edge-class (i, j) defines one Miquel circle:

```
C01 = {A0, A1, B0, B1}
C02 = {A0, A2, B0, B2}
C03 = {A0, A3, B0, B3}
C12 = {A1, A2, B1, B2}
C13 = {A1, A3, B1, B3}
C23 = {A2, A3, B2, B3}
```

Each circle contains 4 points. Each point appears in 3 circles (each level participates in the three edges incident to it). Hence 8×3 = 6×4 = 24.

**Polybius frame.** The ordered pair `(A-level, B-level)` gives a `4 x 4 =
16`-cell Polybius square. This is the interpreter's raw ordered field. The
Miquel incidence rule tests whether a candidate preserves the six shared edge
classes.

The 16-cell ordered-pair field and the 16-card partition
`8 points + 6 circles + 2 bridges` have the same cardinality but are not
automatically the same set. Their correspondence is a declared OMI mapping,
not a consequence of both having 16 elements.

A non-Miquel pattern remains a candidate unless an implemented
Tetragrammatron law rejects it. This documentation does not create that
runtime behavior.

#### Tetragrammatron as balanced-incidence governor

The Tetragrammatron receives a proposed state from the circular slide / movie / interpreter stream and asks:

> Does this two-QuQuart state preserve the Miquel incidence pattern?

If yes, it is eligible for lawful carry-forward validation. If no, it remains
candidate, is delayed, or is rejected by the owning validation law.

The "harmony" is not primarily a sound metaphor. It is balanced incidence:

```
4 levels
6 edges
8 paired points
6 circles
24 incidences
8×3 = 6×4
```

That is the governing equality. The Tetragrammatron sieves the Polybius `4 x
4` frame through the six QuQuart edge classes. Incidence fit is necessary for
this witness, but it is not receipt acceptance.

#### Implementation form

```js
export const QUQUART_LEVELS = Object.freeze([0, 1, 2, 3]);

export const QUQUART_EDGES = Object.freeze([
  [0, 1], [0, 2], [0, 3],
  [1, 2], [1, 3],
  [2, 3],
]);

export function buildTwoQuQuartMiquel() {
  const points = [
    "A0", "A1", "A2", "A3",
    "B0", "B1", "B2", "B3",
  ];

  const circles = QUQUART_EDGES.map(([i, j]) => ({
    edge: `${i}${j}`,
    points: [`A${i}`, `A${j}`, `B${i}`, `B${j}`],
  }));

  return { points, circles };
}
```

Tests should verify:
- has 4 QuQuart levels
- has 6 QuQuart edges
- two QuQuarts produce 8 points
- six edge-classes produce 6 circles
- each circle has 4 points
- each point appears in 3 circles
- total incidences = 24
- a pure incidence checker rejects non-Miquel patterns, if implemented

## 2. Atomic Logic Clock (4y²) — Möbius Configuration / Möbius Tetrads (8₄)

The Möbius configuration consists of two mutually inscribed tetrahedra: each vertex of one tetrahedron lies on a face plane of the other, and vice versa.

```
Möbius configuration = (8₄)

8 points (vertices of two tetrahedra)
8 planes (faces of two tetrahedra)
4 planes through each point
4 points on each plane
```

### OMI pattern fit for 4y²

- 4 = tetrahedral face/vertex degree
- y² = low-plane self-dual atomic relation
- 8 = two tetrahedra × four vertices

### Levi graph

The Levi graph of the Möbius configuration is the 16-vertex hypercube graph Q4:
- 4 binary axes
- 16 local states
- 8 point side + 8 plane side
- 32 incidences

This makes it the declared OMI witness for the Atomic Logic Clock: a local
tetrahedral self-dual incidence clock.

### Significance

Möbius proved (1828) that if two tetrahedra have the property that seven of
their vertices lie on corresponding face planes of the other tetrahedron, then
the eighth vertex does as well. By projective duality, the corresponding
statement also applies to the face planes.

OMI uses this completion property as the fitted local-incidence witness; the
theorem does not derive the runtime clock.

## 3. Bridge Plane (16xy) — Möbius–Kantor Configuration (8₃ 8₃)

The Möbius–Kantor configuration consists of two mutually inscribed quadrilaterals in the complex projective plane.

```
Möbius–Kantor configuration = (8₃ 8₃)

8 points
8 lines
3 lines through each point
3 points on each line
```

### OMI pattern fit for 16xy

- 16 = 8 + 8 point/line dual carrier
- xy = cross-plane relation
- 3 = incidence degree across bridge

### Bridge character

This configuration is about mutual inscription: one quadrilateral is
inscribed in the other and conversely. OMI reads that reciprocal incidence as
an `xy` bridge relation. This is an interpretive fit, not an algebraic
derivation from the monomial.

It is not realizable as ordinary Euclidean point-line geometry, but becomes natural in complex projective geometry. This matters because the bridge plane is not the low atomic plane and not the high cosmic plane — it is a transition surface.

### Coordinates (Coxeter 1950)

Using ω = complex cube root of 1, the eight points are:

```
(1,0,0), (0,0,1), (ω, −1, 1), (−1, 0, 1),
(−1, ω², 1), (1, ω, 0), (0, 1, 0), (0, −1, 1)
```

These form the eight vertices and eight 3-edges of the complex polygon 3{3}3.

## 4. Cosmic Orbit (60x²) — Klein Configuration (60₁₅)

The Klein configuration (Felix Klein, 1870) relates to Kummer surfaces and consists of 60 points and 60 planes.

```
Klein configuration = (60₁₅)

60 points
60 planes
15 planes through each point
15 points on each plane
```

### OMI pattern fit for 60x²

- 60 = sexagesimal orbit count
- 15 = active nonzero nibble field (C(6,2) = 15 line pairs)
- x² = high-plane self-projection / point-plane dual high orbit

### Incidence

```
60 × 15 = 900 flags
60 × 15 = 900 flags  (self-dual)
```

### Line-pair structure

The 15 line pairs are:

```
12 13 14 15 16
23 24 25 26
34 35 36
45 46
56
```

= C(6,2) = 15

The 60 points are three concurrent lines forming an odd permutation. The 60 planes are three coplanar lines forming even permutations, obtained by reversing the last two digits in the points.

### Coordinate form (Hudson 1905)

60 points are given as sextuples of line-pair triples:

```
12-34-65   12-43-56   21-34-56   21-43-65   ...
```

With 6 labels, 15 pairwise relations, 60 points, and self-dual point/plane
incidence, the Klein configuration fits the declared cosmic high-plane role.
The matching `60` is a witness alignment, not proof that the orbit and the
classical configuration are identical.

## 5. The Eleven-Position Overseer and the Hidden Five-Position Frame

### Why the Tetragrammatron is the OMI eleven-position overseer

The Tetragrammatron stands over the hidden five-position frame as the
irregularity/rationality boundary controller.

```
Hidden 5-cell
  internal simplex root
  regular governor
  protected source of resolution

Six pairwise gauge planes
  FS–GS, FS–RS, FS–US
  GS–RS, GS–US, RS–US

eleven-position overseer
  5 hidden governor positions
  6 pairwise oversight planes
```

The cleanest structural reading:

```
5 + 6 = 11

5  = hidden simplex root
6  = C(4,2) pairwise Tetragrammatron gauge planes
```

This matches the Miquel controller: four gauges give `C(4,2) = 6` pairwise
circles. The five-position governor is the inner root; the six pairwise planes
are the observable oversight shell.

In this document, **11-cell** is an OMI name for that `5 + 6` oversight frame.
It is not a claim that the frame is the standard abstract regular 11-cell,
whose eleven cells are hemi-icosahedra.

### The Perles configuration as the boundary witness

The Perles configuration (1960s, Micha Perles) is the warning configuration that explains why the overseer is necessary.

```
Perles configuration

9 points
9 lines
mostly 3-incidence
one 4-point line
one 4-line point
irrational realization pressure
matroid obstruction
```

Key facts from the literature:
- it is a nine-point, nine-line incidence configuration
- every equivalent real projective realization requires irrational coordinates
- incidence validity therefore does not guarantee rational realization

This is exactly the type of error OMI must prevent. A renderer may draw something. A DOM may expose something. A peer may send something. A graph may appear connected. But that does not mean the state is canonically acceptable.

### Perles tells OMI

```
Realization is not authority.
Incidence must be checked.
Field of realization matters.
Projection can lie.
```

The runtime separates three questions:
1. **Incidence** — does the two-QuQuart candidate satisfy the declared Miquel type? Tetragrammatron validates this law.
2. **Projection** — can validated state be represented under the declared coordinate regime? Metatron projects without gaining authority.
3. **Receipt** — is the resulting replay-stable state accepted? Receipt owns this boundary.

A state may pass the Miquel incidence sieve but still fail projection under a chosen field or coordinate regime. That is why incidence alone is not acceptance. The receipt remains the final boundary.

That is why the receipt must remain the acceptance boundary.

### Canon

```
The Tetragrammatron is the OMI eleven-position overseer of the hidden
five-position governor.

The hidden five-position frame is the internal governor root.
The six pairwise gauge planes form the oversight shell.
Together they make the OMI 5+6 oversight frame.

The Perles configuration explains why the overseer is necessary:
valid incidence does not guarantee rational realization,
and projection is not authority.

Therefore Tetragrammatron validates declared incidence and lawful carry.
Metatron projects validated state.
Receipt accepts replay-stable state.
```

Shortest form:

```
5-cell hides.
6 gauge-pair planes oversee.
11-position frame oversees.
Perles warns.
Projection lies.
Receipt accepts.
```

## 6. Implementation Registry

If implemented, add a single declarative module:

```
src/omi/configuration-registry.js
```

It should export frozen incidence metadata only — no engine, no validation, no runtime authority.

```
export const OMI_CONFIGURATION_WITNESSES = Object.freeze({
  tetragrammatron: {
    name: "Miquel configuration",
    symbol: "(8_3 6_4)",
    points: 8,
    blocks: 6,
    pointDegree: 3,
    blockDegree: 4,
    flags: 24,
    role: "interpreter-card frame"
  },

  atomicLogicClock: {
    name: "Möbius configuration / Möbius tetrads",
    symbol: "(8_4)",
    points: 8,
    blocks: 8,
    pointDegree: 4,
    blockDegree: 4,
    flags: 32,
    role: "4y² atomic low-plane witness"
  },

  bridge16xy: {
    name: "Möbius–Kantor configuration",
    symbol: "(8_3 8_3)",
    points: 8,
    blocks: 8,
    pointDegree: 3,
    blockDegree: 3,
    flags: 24,
    role: "16xy bridge-plane witness"
  },

  cosmicOrbit60x2: {
    name: "Klein configuration",
    symbol: "(60_15)",
    points: 60,
    blocks: 60,
    pointDegree: 15,
    blockDegree: 15,
    flags: 900,
    role: "60x² cosmic high-plane witness"
  }
});
```

Tests should verify:
- Miquel flags = 8×3 = 6×4 = 24
- Möbius flags = 8×4 = 8×4 = 32
- Möbius–Kantor flags = 8×3 = 8×3 = 24
- Klein flags = 60×15 = 60×15 = 900
- All witnesses are projection metadata, not authority

## 7. Relationship to Existing Polyharmonic Governor

| Configuration | Clock | Term | Governor | QuQuart Role |
|---|---|---|---|---|
| K4 edge skeleton | — | — | — | single interpretive QuQuart edge frame |
| Miquel (8₃ 6₄) | interpreter controller | nibble/gauge | Geometric (p=0) | two QuQuarts, Miquel incidence sieve |
| Möbius tetrads (8₄) | Atomic Logic Clock | 4y² | Harmonic (p=-1) | low-plane atomic |
| Möbius–Kantor (8₃ 8₃) | Spectral Observer Clock | 16xy | Quadratic (p=2) | bridge-plane |
| Klein (60₁₅) | Cosmic Orbit Clock | 60x² | Cubic (p=3) | high-plane cosmic |

The Tetragrammatron polyharmonic governor (three clocks, four offsets, five governors) is the operational model. The configuration witness ladder is the incidence geometry that each clock term's valid projections must satisfy.

The Tetragrammatron is polyharmonic. Its Miquel controller exhibits balanced
incidence: 4 levels, 6 edges, 8 paired points, 6 circles, and 24 incidences,
with the governing equality `8 x 3 = 6 x 4`. This does not collapse the whole
governor into the `p=-1` Harmonic mode.

## Boundary

This document is reference guidance for implementation thinking. It must preserve:

```
Omicron lowering before Tetragrammatron validation
Q_frame before Q_xy projection
POS graph channel behavior
WordNet synset centroid identity
CONS as canonical reduction/lookup
the receipt as acceptance boundary
```

These configurations are not UI drawings. They are incidence witnesses for replayable projection. The receipt accepts.
