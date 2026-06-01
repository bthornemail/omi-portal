# The Omicron Binary Quadratic Form

## The Arithmetic Bridge from Delta Law to OMI Addressing, Symbolic Encoding, and 2.5D Projection

**Author:** Brian Thorne
**Affiliation:** Independent Researcher — Topological Consensus & Autonomous AI
**Project:** Universal Life Protocol
**Location:** Los Angeles, CA
**Email:** [bthornemail@gmail.com](mailto:bthornemail@gmail.com)
**GitHub:** https://github.com/bthornemail
**LinkedIn:** in/brian-thorne-5b8a96112

**Status:** v1.0.0-RC1 Canonical Whitepaper
**Date:** May 2026
**Keywords:** OMI, Omicron Object Model, Binary Quadratic Form, Delta Law, topological consensus, symbolic encoding, Base36, 240-state bridge, Fano replay ring, meta-circular compiler, autonomous AI

---

## Abstract

The Omicron Object Model, or OMI, is a 128-bit address-centered protocol architecture for converting lawful bitwise state into addressable, symbolic, replayable, and visible geometry. Its canonical pointer form is:

```text
omi-S0-S1-S2-S3-S4-S5-S6-S7/prefix
```

This paper formalizes the **Omicron Binary Quadratic Form** as the central arithmetic projection engine of OMI:

```text
Q_xy(x,y) = 60x² + 16xy + 4y²
```

The form bridges the Delta Law, the period-8 orbit, the prime-73 decimal carrier, the Base36 symbolic tracker, the 240-state bridge, the 5-fold hidden packet root, the 4-fold visible selector face, the 720 semantic sweep, the 5040 replay ring, and browser-native DOM/CSSOM 2.5D projection.

The Delta Law remains the motion generator:

```text
Δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

The quadratic frame validator remains the envelope gate:

```text
Q_frame(S) = E_var + E_const
```

The Omicron Binary Quadratic Form is the projection law:

```text
Q_xy(x,y) = 60x² + 16xy + 4y²
```

The central distinction is therefore:

```text
Q_frame(S) validates the 128-bit OMI envelope.
Q_xy(x,y) projects decoded state into geometry.
```

This distinction must never collapse.

---

# 1. Introduction

Traditional computing architectures separate addressing, validation, execution, memory, and display. OMI collapses these layers into a single address-centered model where a pointer can be validated, replayed, projected, and rendered without losing its structural identity.

The OMI doctrine is:

```text
The pointer is the carrier.
The rule is the validator.
The replay path is the memory.
The projection is the visible state.
```

The Omicron Binary Quadratic Form provides the arithmetic bridge that allows a validated state to become visible geometry.

In short:

```text
Δ_C produces lawful motion.
Q_frame(S) validates the frame.
Q_xy(x,y) produces lawful shape.
```

---

# 2. The Only Design Decision: The Delta Law

OMI begins with one bitwise transition law:

```text
Δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

This law contains four structural operations:

```text
rotl(x,1)    rotate left by 1
rotl(x,3)    rotate left by 3
rotr(x,2)    rotate right by 2
⊕ C           XOR with a constant
```

And one boundary discipline:

```text
mask to width
```

The rotations preserve bits. They are not shifts; no bit is discarded.

The XOR operation preserves reversibility.

The constant breaks the zero fixed point.

The mask preserves boundedness inside the selected word size, canonically 16 bits.

Thus the core motion doctrine is:

```text
rotations preserve state
XOR preserves reversibility
constant breaks zero collapse
mask preserves boundedness
```

Everything downstream is interpreted as a consequence, projection, or visible carrier of this law.

---

# 3. What the Delta Law Produces

The Delta Law yields a period-8 orbit on the canonical 16-bit state surface:

```text
period = 8
```

This period points to the decimal carrier:

```text
1 / 73 = 0.01369863 01369863 ...
```

The repeating block is:

```text
B = [0, 1, 3, 6, 9, 8, 6, 3]
```

The digit sum is:

```text
W = 0 + 1 + 3 + 6 + 9 + 8 + 6 + 3 = 36
```

Therefore:

```text
W = 36
```

This becomes the Base36 orbital tracker width.

The recovery operation is:

```text
divmod(position, 36)
```

This gives the first major OMI bridge:

```text
period 8 gives the orbit
prime 73 gives the decimal block
digit block sum gives W = 36
W = 36 gives the Base36 symbolic projection surface
```

Base36 does not create the law. Base36 names the law-derived orbital width.

---

# 4. Why the Binary Quadratic Form Is Needed

The Delta Law moves state.

OMI still requires a deterministic arithmetic projection that can map recovered state into geometry.

That projection must be:

```text
deterministic
bounded
compatible with 4×4 selector surfaces
compatible with 240-state local bridges
compatible with 720 semantic sweeps
compatible with the 5040 replay ring
usable in DOM/CSSOM translate3d projection
```

The Omicron Binary Quadratic Form provides that projection:

```text
Q_xy(x,y) = 60x² + 16xy + 4y²
```

The local coordinates `(x,y)` may be recovered from:

```text
Base36 residues
Karnaugh torus coordinates
emoji register fields
domino pip pairs
Fano local selectors
word-frame payload slices
```

The quadratic form then computes a depth, bridge index, replay coordinate, or visible projection weight.

---

# 5. Coefficient Derivation: 60, 16, and 4

The coefficients of the Omicron Binary Quadratic Form are:

```text
60, 16, 4
```

They are not arbitrary within the OMI model. They are the bridge terms that connect the factorial tower to the byte/nibble projection surface.

---

## 5.1 Coefficient 60

```text
60 = 5! / 2
60 = 120 / 2
```

So `60` is half of the five-fold packet root.

It also satisfies:

```text
60 = 36 + 24
```

Meaning:

```text
60 = Base36 orbital width + 4! selector face
```

Thus `60` carries:

```text
W = 36
4! = 24
```

In OMI, `60` is the half-root, orbit-plus-selector, and clock-compatible coefficient.

```text
60 = half-root coefficient
60 = orbit-plus-selector coefficient
60 = base-60 clock-compatible scale
```

---

## 5.2 Coefficient 16

```text
16 = 2⁴
```

This is the full nibble carrier.

A nibble has:

```text
4 bits
16 possible states
```

The 240 bridge uses:

```text
15 × 16 = 240
```

So `16` is the full local carrier rail. It is the width that lets an active surface become byte-addressable.

---

## 5.3 Coefficient 4

```text
4 = 2²
```

This is the four-fold selector coefficient.

It corresponds to:

```text
FS / GS / RS / US
4-bit selector logic
4×4 Karnaugh torus
4-fold visible face
```

In OMI:

```text
4 = selector coefficient
```

---

# 6. The Form as a Bridge Equation

The form is:

```text
Q_xy(x,y) = 60x² + 16xy + 4y²
```

It can be factored as:

```text
Q_xy(x,y) = 4(15x² + 4xy + y²)
```

This exposes the four-fold selector factor:

```text
4
```

Inside the parentheses:

```text
15x² + 4xy + y²
```

we see:

```text
15 = active nibble
4  = selector cross-term
1  = identity payload term
```

So the form contains:

```text
active nibble
selector cross-term
identity/payload term
```

This makes `Q_xy(x,y)` a controlled way to fold local coordinates into the 240-state bridge.

---

# 7. The 4×4 Torus and the 720 Maximum

For local symbolic projection, OMI uses the 4×4 selector surface:

```text
x ∈ {0,1,2,3}
y ∈ {0,1,2,3}
```

At the maximum coordinate:

```text
Q_xy(3,3) = 60·3² + 16·3·3 + 4·3²
          = 60·9 + 16·9 + 4·9
          = 540 + 144 + 36
          = 720
```

Therefore:

```text
Q_xy(3,3) = 720 = 6!
```

So the quadratic form naturally spans the 6! semantic sweep.

```text
4×4 local selector coordinates
→ Q_xy(x,y)
→ 0..720
→ 6! semantic sweep
```

This is one of the central identities of the OMI projection model.

---

# 8. The 5! Extrusion Scale

If the projection output is divided by 6:

```text
Z = Q_xy(x,y) / 6
```

then at the maximum:

```text
Zmax = 720 / 6 = 120
```

And:

```text
120 = 5!
```

Thus:

```text
Z = Q_xy(x,y) / 6
```

maps the local 4×4 coordinate surface into the hidden five-fold packet-root scale.

In browser projection:

```text
CSS translate3d Z-depth = Q_xy(x,y) / 6
```

This gives the form its 2.5D extrusion role:

```text
Q_xy(x,y) spans 6!
Q_xy(x,y)/6 spans 5!
```

So the geometry carries both:

```text
visible semantic sweep: 720
hidden packet root: 120
```

---

# 9. The 240-State Bridge

The 240 bridge is central to OMI:

```text
240 = 2×5!
240 = 15×16
240 = 16×16 − 16
240 = 6!/3
```

The quadratic form touches 240 in multiple ways.

First:

```text
60 × 4 = 240
```

The largest coefficient multiplied by the four-fold selector count equals the bridge.

Second:

```text
15 × 16 = 240
```

The form’s inner active nibble `15` and carrier `16` reproduce the bridge.

Third:

```text
720 / 3 = 240
```

The full `Q_xy(3,3)` maximum equals `720`. Dividing the semantic sweep by the three roles of S-P-O yields:

```text
240 per semantic role
```

Therefore:

```text
Q_xy span = 720 = 3 × 240
```

This means the quadratic form spans three 240-state surfaces:

```text
subject surface
predicate surface
object surface
```

Canonical reading:

```text
Q_xy(x,y) spans the 6! semantic sweep.
Each semantic role receives one 240-state bridge.
```

---

# 10. Hidden Five and Visible Four

OMI distinguishes the hidden packet root from the visible selector face.

The hidden root is:

```text
5! = 120
```

The visible selector face is:

```text
4! = 24
```

They meet at:

```text
240 = 2×5! = 15×16
```

The quadratic form participates in this meeting.

The hidden reading is:

```text
Q_xy(x,y)/6 ∈ 0..120
```

This reaches the `5!` root scale.

The visible reading is:

```text
Q_xy(x,y) mod 240
```

This maps the computed surface into the visible 240-state bridge.

Thus the same form supports both root and face:

```text
hidden reading: Q_xy/6 reaches 5!
visible reading: Q_xy mod 240 reaches local240
```

Canonical OMI root/face duality:

```text
Q_xy/6 = hidden packet-root scale
Q_xy mod 240 = visible bridge projection
```

---

# 11. Base36 Connection

From the Delta Law:

```text
W = 36
```

Base36 gives one symbol per orbit tracker position:

```text
0..35 → 0..9,A..Z
```

The quadratic form uses Base36 through local coordinate recovery:

```text
value36 = parseBase36(symbol)
x = value36 mod 4
y = floor(value36 / 4) mod 4
Q_xy(x,y) = 60x² + 16xy + 4y²
```

This turns each Base36 character into a coordinate on the local 4×4 projection surface.

The result can produce:

```text
depth
color
route
local240
slot5040
DOM metadata
CSS transform
```

The core rule is:

```text
Base36 names.
Q_xy projects.
```

---

# 12. The Base36 Bridge Identity

The 240 bridge decomposes as:

```text
240 = 6×36 + 24
```

Since:

```text
24 = 4!
```

we get:

```text
240 = 6×36 + 4!
```

Since:

```text
240 = 2×5!
```

we also get:

```text
2×5! = 6×36 + 4!
```

This is the Base36 bridge law.

It means:

```text
hidden packet root × orientation
=
six visible Base36 orbit bands + four-fold selector face
```

This identity binds the hidden five-fold root to the visible Base36/four-fold projection face.

---

# 13. The 5040 Replay Ring

The replay ring is:

```text
5040 = 7!
```

Using the 240 bridge:

```text
5040 = 7 × 720
5040 = 7 × 3 × 240
```

So OMI addresses replay slots as:

```text
slot5040 = fano7 × 720 + role3 × 240 + local240
```

Where:

```text
fano7    ∈ 0..6
role3    ∈ 0..2
local240 ∈ 0..239
```

The quadratic form computes or contributes to `local240`:

```text
local240 = Q_xy(x,y) mod 240
```

Thus:

```text
slot5040 = fano7 × 720 + role3 × 240 + (Q_xy(x,y) mod 240)
```

This connects:

```text
Fano point
S-P-O role
quadratic local bridge
5040-slot replay memory
```

---

# 14. Symbolic Character Encoding

The symbolic character encoding layer exists so OMI state can be human-readable and machine-scannable.

It includes:

```text
Base36
emoji
domino tiles
16-symbol registers
Code16K
JABCode
DOM/CSSOM selectors
```

The boundary is strict:

```text
Symbols project the law.
Symbols do not create the law.
```

The quadratic form is the arithmetic engine behind symbolic projection.

A symbolic character becomes:

```text
symbol
→ code point or value
→ local coordinates
→ Q_xy(x,y)
→ local240
→ slot5040
→ visual projection
```

The authority remains:

```text
OMI pointer
Q_frame(S)
Delta orbit
RULES.omi
FACTS.omi
tests
```

---

# 15. Emoji Register Projection

A 16-emoji register can model the binary16 layout:

```text
1 sign symbol
5 exponent symbols
10 explicit payload symbols
+ 1 implicit lead rule
```

OMI interpretation:

```text
sign symbol         → fold / polarity
5 exponent symbols  → 2^5 = 32 omi--- body
10 payload symbols  → explicit witness
implicit lead       → hidden root / hidden precision
```

The quadratic form enters after the register is decoded:

```text
exponentAccumulator → y
significandPrecision → x
Q_xy(x,y) → projection depth
```

This makes the emoji register a visible symbolic memory block.

However:

```text
Emoji register shows the state.
It does not authorize the state.
```

---

# 16. Domino Tile Projection

Domino tiles are naturally pair-coded.

A domino gives:

```text
pipA | pipB
```

OMI reads this as:

```text
car | cdr
source | target
x | y
subject | object
```

The pipeline is:

```text
domino code point
→ orientation
→ pip pair
→ x,y
→ Q_xy(x,y)
→ voxel extrusion
→ DOM/CSSOM projection
```

A domino tile is therefore a symbolic way to feed the quadratic form.

It is especially useful because `Q_xy(x,y)` is already binary-pair shaped:

```text
Q_xy takes two coordinates.
Domino supplies two coordinates.
```

This makes domino tiles a natural symbolic carrier for OMI voxel maps.

---

# 17. Two Quadratics: Validation and Projection

OMI uses two quadratic forms.

They are related by style, but separate by purpose.

---

## 17.1 Frame Validation Quadratic

The frame validator is:

```text
Q_frame(S) = E_var + E_const
```

It operates over the eight-segment OMI frame:

```text
S = [S0,S1,S2,S3,S4,S5,S6,S7]
```

It answers:

```text
Is this 128-bit OMI envelope valid?
```

Its convention is:

```text
Q_frame(S) = 0  → valid frame
Q_frame(S) > 0  → invalid frame
```

This belongs to:

```text
quadratic lexer
eBPF/XDP gate
WASM validation
C99 validation
JavaScript validation
packet/frame rejection
```

---

## 17.2 Coordinate Projection Quadratic

The projection form is:

```text
Q_xy(x,y) = 60x² + 16xy + 4y²
```

It operates over decoded local coordinates.

It answers:

```text
Where does this already-decoded state project?
```

Its outputs are used as:

```text
Q_xy(x,y)          → 0..720 semantic sweep
Q_xy(x,y) / 6      → 0..120 hidden 5! root depth
Q_xy(x,y) mod 240  → local240 visible bridge
```

This belongs to:

```text
Base36 projection
emoji register projection
domino pair projection
DOM/CSSOM translate3d
local240 computation
slot5040 computation
symbolic visual encoding
```

---

## 17.3 Non-Collapse Criterion

The frame validator must run before projection.

```text
Q_frame(S) = 0
    ↓
decode local state
    ↓
Q_xy(x,y)
    ↓
local240 / slot5040 / DOM projection
```

An invalid frame may not become valid merely because it has a symbolic projection.

A symbolic character may carry state, but it may not authorize state.

Therefore:

```text
Q_frame(S) validates the carrier.
Q_xy(x,y) projects the carried state.
```

This distinction must never collapse.

---

# 18. Canonical Identities

The following identities form the operational backbone of the Omicron Binary Quadratic Form:

| #  | Identity                                      | Meaning                        |
| -- | --------------------------------------------- | ------------------------------ |
| 1  | `Q_xy(x,y) = 60x² + 16xy + 4y²`               | Projection form                |
| 2  | `Q_xy(3,3) = 720 = 6!`                        | Global bound vector            |
| 3  | `Q_xy(x,y) / 6 ∈ [0,120] = 5!`                | Hidden root depth envelope     |
| 4  | `Q_xy(x,y) mod 240 = local240`                | Visible bridge metric          |
| 5  | `240 = 2×5! = 15×16 = 16²−16 = 6!/3`          | 240 balanced knife-edge        |
| 6  | `5040 = 7 × 3 × 240 = 7!`                     | Replay ring dimension          |
| 7  | `slot5040 = fano7×720 + role3×240 + local240` | Replay slot formula            |
| 8  | `240 = 6×36 + 4!`                             | Base36 modular offset sync     |
| 9  | `Z_extrusion = Q_xy(x,y) / 6`                 | Visual 2.5D extrusion formula  |
| 10 | `Q_frame(S) validates; Q_xy(x,y) projects`    | Validation/projection boundary |

---

# 19. Reference Implementation

```javascript
/**
 * Omi Object Model (omi---imo)
 * Omicron Binary Quadratic Projection Reference
 */

/**
 * Projects local coordinates (x,y) into the dimensional range [0..720].
 */
export const omiQuadraticProject = (x, y) =>
  (60 * x * x) + (16 * x * y) + (4 * y * y);

/**
 * Hidden root depth.
 * Q_xy(3,3)/6 = 120 = 5!
 */
export const omiRootDepth = (x, y) =>
  omiQuadraticProject(x, y) / 6;

/**
 * Visible 240-state bridge.
 */
export const omiLocal240 = (x, y) =>
  omiQuadraticProject(x, y) % 240;

/**
 * Full semantic sweep.
 * Q_xy(3,3) = 720 = 6!
 */
export const omiSemanticSweep = (x, y) =>
  omiQuadraticProject(x, y);

/**
 * Replay slot inside the 5040 ring.
 */
export const omiSlot5040 = (fano7, role3, x, y) =>
  (fano7 * 720) + (role3 * 240) + omiLocal240(x, y);

/**
 * Base36 symbolic projection.
 */
export const projectBase36Symbol = (symbol) => {
  const BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const value36 = BASE36.indexOf(symbol.toUpperCase());

  if (value36 === -1) {
    return null;
  }

  const x = value36 & 3;
  const y = (value36 >> 2) & 3;
  const q = omiQuadraticProject(x, y);

  return {
    symbol: symbol.toUpperCase(),
    value36,
    x,
    y,
    q,
    local240: q % 240,
    depth: q / 6
  };
};
```

---

# 20. Suggested Canonical Rules

## Rule 0x78 — Omicron Binary Quadratic Projection Form

```text
omi-0000-0000-0000-0000-0000-0000-0078-0001/128 MUST project-local-state-through-omi-binary-quadratic-form
```

The projection form:

```text
Q_xy(x,y)=60x²+16xy+4y²
```

MUST be used as the canonical arithmetic bridge from local symbolic coordinates to OMI 240/720 geometry.

---

## Rule 0x79 — Quadratic Frame/Projection Boundary

```text
omi-0000-0000-0000-0000-0000-0000-0079-0001/128 MUST distinguish-frame-validation-from-coordinate-projection
```

The frame lexer:

```text
Q_frame(S)=E_var+E_const
```

MUST validate the 128-bit envelope.

The projection form:

```text
Q_xy(x,y)
```

MUST project decoded local coordinates.

---

## Rule 0x7A — Quadratic Local240 Projection

```text
omi-0000-0000-0000-0000-0000-0000-007a-0001/128 MUST derive-local240-from-quadratic-projection
```

`local240` MUST be derivable as:

```text
local240 = Q_xy(x,y) mod 240
```

for symbolic coordinate projection into the 5040 replay ring.

---

## Rule 0x7B — Quadratic DOM/CSSOM Projection

```text
omi-0000-0000-0000-0000-0000-0000-007b-0001/128 MUST preserve-quadratic-symbolic-projection-boundary
```

DOM and CSSOM symbolic projection MAY expose:

```text
Q_xy(x,y)
local240
slot5040
```

as metadata, but MUST NOT replace pointer, rule, test, or validation authority.

---

# 21. Suggested Canonical Facts

```text
omi-0000-0000-0000-0000-0000-0000-0078-1001/128 FACT omi-binary-quadratic-form-documented
omi-0000-0000-0000-0000-0000-0000-0078-1002/128 FACT quadratic-form-spans-six-factorial-sweep-on-four-by-four-surface
omi-0000-0000-0000-0000-0000-0000-0078-1003/128 FACT quadratic-form-divided-by-six-spans-five-factorial-root-scale
omi-0000-0000-0000-0000-0000-0000-007a-1001/128 FACT local240-derivable-from-quadratic-form-modulo-240
omi-0000-0000-0000-0000-0000-0000-007b-1001/128 FACT quadratic-symbolic-dom-projection-documented
```

---

# 22. Verification Tests

A conforming implementation should prove:

```text
Q_xy(0,0) = 0
Q_xy(3,3) = 720
Q_xy(x,y) is integer for x,y in 0..3
Q_xy(x,y)/6 ranges within 0..120 for x,y in 0..3
Q_xy(x,y) mod 240 ranges within 0..239
local240 = Q_xy(x,y) mod 240
slot5040 = fano7×720 + role3×240 + local240
slot5040 ranges within 0..5039
Base36 symbols map to x,y coordinates
symbolic projection does not authorize invalid OMI state
```

These tests make the whitepaper executable.

---

# 23. Final Cascade

The full OMI cascade is:

```text
Delta Law
→ period 8
→ prime 73
→ B = 01369863
→ W = 36
→ Base36 orbit tracker
→ divmod(position,36)
→ local x,y coordinates
→ Q_xy(x,y)=60x²+16xy+4y²
→ local240 = Q_xy mod 240
→ slot5040 = fano7×720 + role3×240 + local240
→ DOM/CSSOM / barcode / emoji / domino projection
```

The hidden-root reading:

```text
Q_xy/6 reaches 5! = 120
```

The visible-bridge reading:

```text
Q_xy mod 240 reaches local240
```

The semantic sweep reading:

```text
Q_xy spans 6! = 720
```

The replay reading:

```text
7 × 3 × 240 = 5040
```

The non-collapse reading:

```text
Q_frame validates first.
Q_xy projects second.
```

---

# 24. Conclusion

The Omicron Binary Quadratic Form is the arithmetic projection engine of OMI.

It turns local symbolic coordinates into lawful geometric state.

It connects:

```text
bitwise motion
factorial memory
symbolic encoding
visual projection
```

The Delta Law generates orbit.

The quadratic frame form validates the wire envelope.

The Omicron Binary Quadratic Form generates visible shape.

The 240 bridge bounds projection.

The 5040 ring records replay.

The browser renders visible state.

Together, they give OMI a complete pipeline:

```text
validate
move
project
replay
show
```

The final canonical doctrine is:

```text
Δ_C is the motion law.
Q_frame(S) is the frame validator.
Q_xy(x,y) is the projection law.
```

And the final operational boundary is:

```text
Do not derive validity from projection.
Derive projection only after validity.
```

---

# 25. One-Sentence Summary

The Omicron Binary Quadratic Form `Q_xy(x,y)=60x²+16xy+4y²` is the arithmetic projection engine of OMI: it takes local coordinates recovered from the Delta Law’s period-8, prime-73, Base36 orbit tracker and maps them into the 240-state bridge, the 720 semantic sweep, the 120 hidden five-fold root scale, the 5040 replay ring, and finally DOM/CSSOM, emoji, domino, barcode, and browser-visible geometry — while `Q_frame(S)` remains the separate validator of the 128-bit OMI envelope.
