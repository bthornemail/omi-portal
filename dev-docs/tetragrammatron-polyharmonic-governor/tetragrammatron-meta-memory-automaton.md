# Tetragrammatron Meta-Memory Automaton

## Implementation-Facing Synthesis of the Hidden 5! OMI Bridge

Status: filed reference draft  
Layer: dev-docs source/reference  
Current implementation: five-factor CONS/RRGGBBAA router

This document records the Tetragrammatron Meta-Memory Automaton as it exists in the current repository. It is not a new canonical root. It is a reference bridge from the conceptual automaton language to the actual code paths, declarations, generated vectors, and verification gates.

Related reference:

```text
polyharmonic-governor-axis.md
```

That document names the five-factor interpretation layer as the
**Tetragrammatron Polyharmonic Governor**. It is a reference synthesis only and
does not add a sixth root or runtime API.

The current implementation uses five canonical OMI factors:

```text
RULES.omi
FACTS.omi
CLOSURES.omi
COMBINATORS.omi
CONS.omi
```

There is no canonical `BOOTVECTORS.omi`, no first-class `TEST` keyword, and no `?` native lowering. Generated semantic router vectors live under `vectors/`, not `dist/`, because `dist/` is build output and may be deleted.

---

## 1. Actual Code Anchors

The automaton bridges local motion, orbit recovery, semantic routing, and declarative reduction through these files:

```text
src/omilog/atomic-kernel.js
  deltaTick()
  encodeLowerChirality()
  encodeUpperChirality()
  evaluateAtomicDual()

src/omilog/cosmic-orbit.js
  digmod36()
  recoverCosmicOrbit()
  applyCosmeticReaderLens()

src/canvas/rrggbbaa-orbit.js
  recoverRRGGBBAAOrbit()
  composeRRGGBBAAOrbit()
  isAAModeSwitch()

src/omilog/router-seeds.js
  composeRRGGBBAA()
  parseRRGGBBAA()
  encodePreBootAddress()
  parsePreBootAddress()
  generatePosSeeds()
  generateFeatureSeeds()
  generateWordNetPrologSeeds()
  validateMonotonicConsLookup()
  resolveProxySeedThroughCons()

src/omilog/triad-dispatch.js
  triad155FromSegments()
  evaluateTriadDispatch()
  deriveTriadDispatch()
  auditConsTriadDispatch()

src/omi/tetragrammatron-polyharmonic-governor.js
  exports reference-only clocks, offsets, governors, and lookup helpers
  does not validate frames, accept receipts, or alter compiler lowering

scripts/generate-router-seeds.js
  writes vectors/pos.omi
  writes vectors/features.omi
  writes vectors/pl.omi
  supports --check drift detection

scripts/audit-cons-triad-dispatch.js
  audits CONS.omi monotonic RRGGBBAA order
  audits secondary triad dispatch metadata

test/router-seeds.test.js
  verifies address round-trip
  verifies POS AA low-byte routing
  verifies feature AA high-byte routing
  verifies WordNet centroid preservation
  verifies CONS monotonic lookup order

test/triad-dispatch.test.js
  verifies prefix3 triad determinism
  verifies full8 diagnostic mode
  verifies Real/Imaginary plane isolation
  verifies compileOmiParsedWithTriadDispatch()
  verifies the formal CONS triad audit
```

The Makefile wires the route as:

```text
generate-router-seeds
compile-router-seeds
verify-router-seeds
audit-cons-triad-dispatch
verify-safe -> verify-router-seeds
```

---

## 2. Foundational Automaton

The lower motion engine is the Delta Law:

```text
deltaTick(x) = rotl(x,1) ^ rotl(x,3) ^ rotr(x,2) ^ C
```

In code, this is implemented in `src/omilog/atomic-kernel.js`. The tests in `test/atomic-kernel.test.js` verify period-8 behavior and lower/upper chirality projections.

The lower structural frame is bounded by the Omicron pair:

```text
0x03BF / 0x039F
```

That pair, not `0xBF` alone, is the structural frame signature:

```text
0x03BF = little omicron = chiral entry
0x039F = big Omicron    = cardinal closure
```

The compiler mirrors that boundary in `src/omilog/omi-imo-compiler.js`, where compiled `.imo` records wrap with little/big Omicron delimiters.

---

## 3. Delta-Orbit Bridge

The orbit side is implemented through `digmod36()` and the RRGGBBAA color-orbit helpers:

```text
seed32 = 0xRRGGBBAA
orbit  = floor(seed32 / 36)
offset = seed32 mod 36
```

The offset is always in:

```text
0..35
```

Therefore decimal `37` / `0x25` remains available as the AA mode-switch sentinel. This behavior is implemented in:

```text
src/canvas/rrggbbaa-orbit.js
  isAAModeSwitch()
```

and verified by:

```text
test/rrggbbaa-orbit.test.js
```

Doctrine:

```text
0..35 are Base36 offsets.
36 is the orbit width marker.
37 is the Omicron mode-switch sentinel.
```

---

## 4. Hidden 5! Ladder

The hidden `5! = 120` ladder is the five canonical declaration set:

| Factor | Source | Compiled | Keyword | Role | Governor | Exponent |
| --- | --- | --- | --- | --- | --- | ---: |
| 1 | `RULES.omi` | `RULES.imo` | `MUST` | normative obligations | Geometric / Genesis | `p=0` |
| 2 | `FACTS.omi` | `FACTS.imo` | `FACT` | grounded implementation facts | Harmonic | `p=-1` |
| 3 | `CLOSURES.omi` | `CLOSURES.imo` | `CLOSE` | sealed boundaries | Arithmetic | `p=1` |
| 4 | `COMBINATORS.omi` | `COMBINATORS.imo` | `COMBINE` | lawful composition | Quadratic | `p=2` |
| 5 | `CONS.omi` | `CONS.imo` | `CONS` | structural reduction and lookup | Cubic / Qubic | `p=3` |

The factor order remains the existing compiler/document order. The governor
exponents describe interpretation roles; they do not reorder source authority.

The compiler keyword map in `src/omilog/omi-imo-compiler.js` currently lowers:

```text
MUST     -> !
FACT     -> =
EQUALS   -> =
CLOSE    -> )
COMBINE  -> +
CONS     -> .
```

The parser keyword set in `src/omi/omi-parser.js` does not include `TEST`.

---

## 5. Polyharmonic Governor Axis

The hidden `5!` ladder can also be read as the
**Tetragrammatron Polyharmonic Governor**.

This does not change the implementation. It names the interpretive role of the
five existing roots:

```text
FACTS       p=-1  harmonic inverse ground
RULES       p=0   geometric Genesis pivot
CLOSURES    p=1   arithmetic sequential seal
COMBINATORS p=2   quadratic relational composition
CONS        p=3   cubic object projection
```

FACTS and CONS are inverse projections in the circular model:

```text
FACTS <-> CONS
```

RULES form the equality pivot between inverse ground and forward object
projection. CLOSURES provide monotone sequence. COMBINATORS provide the
quadratic bridge. CONS gives the accepted relation runtime body.

The governor axis is read through four visible offsets:

```text
0x0001
0x0010
0x0100
0x1000
```

These offsets correspond to the visible ququart lanes. They do not replace the
five roots. The fifth governor is the hidden Genesis equality frame.

---

## 6. CONS as Monotonic Meta-Memory

`CONS.omi` is the canonical monotonic RRGGBBAA lookup table for upper-reader routing. The current table begins at:

```text
CONS.omi
  CONS RRGGBBAA MONOTONIC ROUTER LOOKUP TABLE (Rule 0xCF)
```

The implemented lookup records are sorted by primary key:

```text
0x00000001  cons-rrggbbaa-pos-adj
0x00000008  cons-rrggbbaa-pos-noun
0x00000010  cons-rrggbbaa-pos-verb
0x01000000  cons-rrggbbaa-feature-mood
0x01000100  cons-rrggbbaa-feature-tense
0x02000008  cons-rrggbbaa-wordnet-canvas
```

The rule is:

```text
CONS keys are monotonic.
CONS bindings are non-linear.
```

Semantic aliases and relinks live inside each `omi- / -imo` source block. They do not reorder the primary key sequence.

This is enforced in code by:

```text
validateMonotonicConsLookup()
extractConsRRGGBBAALookups()
resolveProxySeedThroughCons()
```

and tested by:

```text
test/router-seeds.test.js
```

---

## 7. Canonical 8-Segment Router Address Packing

The current router/pre-boot address form is:

```text
omi-S0-S1-S2-S3-S4-S5-S6-S7/128
```

Implemented by:

```text
encodePreBootAddress()
parsePreBootAddress()
```

Packing:

| Segment | Value | Meaning |
| --- | --- | --- |
| `S0` | `0000` | zero-frame origin |
| `S1` | `03bf` | little omicron chiral entry |
| `S2` | `7c00` | pre-boot sequence root |
| `S3` | `RRGG` | red + green channel bytes |
| `S4` | `BBFF` | blue byte + flags byte |
| `S5` | `HHLL` | feature high byte + AA/POS low byte |
| `S6` | `039f` | big Omicron cardinal closure |
| `S7` | `GGff` | upper-reader generator byte + closure byte |

Generator byte:

```text
0x7C = lower structural generator
0x7D = tangent reader generator
0x7E = orientation/lens generator
0x7F = template/world generator
```

Example:

```text
#FF0000
AA low byte = 0x25
feature high byte = 0x00
flags = 0x00
generator = 0x7D
```

Packed address:

```text
omi-0000-03bf-7c00-ff00-0000-0025-039f-7dff/128
```

---

## 8. Generated Router Seeds Under vectors/

The generated router seed configs are:

```text
vectors/pos.omi
vectors/features.omi
vectors/pl.omi
```

Compiled forms are sibling files:

```text
vectors/pos.imo
vectors/features.imo
vectors/pl.imo
```

These files are generated by `scripts/generate-router-seeds.js` and verified by `make verify-router-seeds`.

They are traversable proxy configs, not canonical roots:

```text
POS:
  AA low byte maps to Universal POS tags from src/pos-tags.js.

Features:
  AA high byte maps to Universal Features listed in the manifest.

WordNet-Prolog:
  seed bridge preserves WordNet centroid identity from src/wordnet/relation-space.js.
```

The route is:

```text
RRGGBBAA
-> AA selector
-> POS / Features / WordNet-Prolog seed
-> CONS lookup
-> upper reader generator
```

---

## 9. Lower and Upper Plane Boundary

The lower plane is structural:

```text
Omicron frame
Delta Law
Q_frame
Q_xy
RRGGBB
terminating fractions
Miquel RGB incidence
Fano replay
```

The upper plane is reader-side:

```text
AA attachment
0x7D tangent reader
0x7E orientation/lens reader
0x7F template/world reader
unicode-bidi
preset colors
POS / Features / WordNet routing
repeating fractions
```

Boundary:

```text
Lower bodies validate.
Upper readers interpret.
CONS reduces both to one canonical pointer.
```

Generated router seeds must never replace:

```text
Q_frame
Q_xy
Delta Law
lower Omicron frame validation
POS graph behavior
WordNet synset centroid authority
```

---

## 10. Five-Factor Distribution of Test Meaning

Test-vector meaning is distributed through the five factors:

```text
RULES:
  declares the obligation being tested

FACTS:
  grounds implementation availability

CLOSURES:
  seals the reduction boundary

COMBINATORS:
  composes POS, Features, WordNet, and domain sources

CONS:
  indexes the canonical RRGGBBAA reduction
```

This keeps the test suite self-describing without creating a sixth declaration authority.

```text
Tests prove code.
Five factors encode test meaning.
CONS makes it replayable.
```

---

## 11. Triad Dispatch Secondary Index

Triad Dispatch is now implemented as an opt-in compiler-side metadata pass. It is not the primary lookup authority.

Canonical function:

```text
triad155 = (low(S0) + low(S1) + low(S2)) mod 155
```

Canonical mode:

```text
prefix3
```

Diagnostic mode:

```text
full8
```

The default pre-boot root:

```text
omi-0000-03bf-7c00-...
```

derives:

```text
(0x00 + 0xBF + 0x00) mod 155 = 36
```

Branch heuristic:

```text
coreMax = max(S3, S4, S5)

coreMax <  0x8000 -> Real Plane A
coreMax >= 0x8000 -> Imaginary Plane B
```

Compiler hook:

```text
compileOmiParsed(parsed)
  unchanged by default

compileOmiParsedWithTriadDispatch(parsed)
  returns the normal compiled .imo payload plus triadDispatch metadata
```

Boundary:

```text
Triad Dispatch routes.
Triad Dispatch does not validate.
Triad Dispatch does not reorder CONS primary RRGGBBAA keys.
```

---

## 12. Implemented Rule Range

The current repository implements five router rules:

```text
0xCB MUST map-wlog-pointers-to-five-factors-via-rrggbbaa-seeds
0xCC MUST map-aa-lower-byte-to-universal-pos-tags-for-semantic-routing
0xCD MUST map-aa-high-byte-to-universal-features-bitfield
0xCE MUST resolve-aa-pos-pointers-through-wordnet-prolog-bridge
0xCF MUST treat-cons-as-sole-rrggbbaa-lookup-table-for-upper-readers
```

There is no current `0xD0` rule. The monotonic-key / non-linear-binding doctrine is represented by Rule `0xCF`, the closure:

```text
cons-rrggbbaa-lookup-monotonic-closure
```

and the test assertions in `test/router-seeds.test.js`.

The triad dispatch extension uses:

```text
0xD1 MUST derive-triad-dispatch-as-secondary-cons-index-mod-one-hundred-fifty-five
0xD2 MUST preserve-rrggbbaa-monotonic-primary-order-when-triad-dispatch-is-added
0xD3 MUST route-triad-branch-plane-without-validating-lower-body
```

---

## 13. Verification Criteria

The current verification surface is:

| Assertion | Verification |
| --- | --- |
| Delta Law period-8 | `test/atomic-kernel.test.js` |
| Orbit modulus | `test/cosmic-orbit.test.js` and `test/rrggbbaa-orbit.test.js` |
| RRGGBBAA seed round-trip | `test/router-seeds.test.js` |
| AA=0x25 mode switch | `test/rrggbbaa-orbit.test.js` |
| Router seed generation | `scripts/generate-router-seeds.js --check` |
| Generated vector compile | `make compile-router-seeds` |
| No sixth root / no TEST lowering | `test/omi-parser.test.js` and `test/omilog-compiler.test.js` |
| CONS monotonicity | `test/router-seeds.test.js` |
| Triad secondary index | `test/triad-dispatch.test.js` |
| CONS triad audit | `scripts/audit-cons-triad-dispatch.js --require-source-blocks` |
| OPPID five-root canon | `scripts/oppid-coherence-check.js` |

Primary gate:

```bash
make verify-safe
```

Full test sweep:

```bash
npm test
```

Build:

```bash
npm run build
```

---

## 14. Final Implementation Synthesis

The Tetragrammatron Meta-Memory Automaton bridges Atomic Kernel Delta Logic and Cosmic Orbit Recovery through the hidden 5! ladder.

The actual implementation is:

```text
Atomic Delta ticks.
Cosmic 36 orbits.
Omicron frames.
RRGGBBAA seeds.
vectors/*.omi provide generated proxy seeds.
Triad Dispatch provides secondary modulo-155 lanes.
CONS.omi performs monotonic lookup.
The five canonical roots remain the only declaration authority.
```

One-line canon:

```text
The current OMI implementation routes Delta motion, RRGGBBAA orbit recovery, POS tags, Universal Features, WordNet-Prolog bridge seeds, and Triad Dispatch secondary lanes through the five canonical factors, with CONS.omi as the sole monotonic RRGGBBAA lookup table and vectors/*.omi as generated proxy configs rather than root authority.
```
