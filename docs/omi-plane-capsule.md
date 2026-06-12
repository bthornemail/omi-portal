# Omi-Plane Capsule Specification

Supplementary Unicode Encapsulation of Omi-Gauge, Omicron Gates, Surrogate RPC, and 0xAA55 Acceptance

**Author:** Brian Thorne
**System:** OMI — Omicron Object Model
**Canonical Surface:** Omi-Plane Capsule
**Status:** Authoritative Draft

---

## 0. Abstract

The Omi-Plane Capsule is the post-native Unicode carrier layer that maps the supplementary Unicode scalar range U+010000…U+10FFFF into a reversible OMI address structure.

It does not replace the native OMI frame.

It encapsulates the native OMI frame.

The native OMI frame remains a 2¹⁶ gauge field. The supplementary Unicode space provides sixteen additional 2¹⁶ pages, each capable of carrying one full Omi-Gauge plane.

The governing map is:

    U = 0x10000 + (p << 16) + ((row << 12) | (x << 6) | y)

Where:

    p   = supplementary OMI plane index, 0..15
    row = Omi-Gauge row, 0..15
    x   = 64-lane x coordinate, 0..63
    y   = 64-lane y coordinate, 0..63

This creates a reversible world-length carrier:

    (p,row,x,y) ↔ U

The UTF-16 surrogate pair mechanism then becomes OMI's internal RPC bridge, splitting the 20-bit supplementary payload into two self-synchronizing 16-bit words.

Canonical anchors:

    U+01039F = lower encapsulated Omicron closure anchor
    U+0103AF = lower encapsulated Omicron delimiter / escape anchor
    U+1003BF = upper encapsulated Omicron entry anchor
    U+01AA55 = first supplementary encapsulated acceptance seal

One-line canon:

> Omi-Plane Capsule maps each supplementary Unicode scalar from U+010000 to U+10FFFF into a reversible (plane,row,x,y) Omi-Gauge address, using 16 supplementary pages of 64×64×16 cells, with UTF-16 surrogate pairs acting as self-synchronizing OMI RPC bridge words.

---

## 1. Core Principle

OMI begins locally.

The local gates are:

    ο  = U+03BF = lowercase omicron = OMI entry / chiral open
    Ο  = U+039F = uppercase Omicron = OMI closure / cardinal close

The readable form is:

    omi---imo

The compact tangent form is:

    o---o

The compiled stream form is:

    ο---Ο

These gates are not replaced.

They are encapsulated.

The supplementary Unicode range:

    U+010000 … U+10FFFF

becomes the carrier shell around the native OMI gate.

Thus:

    ο---Ο = native local gate
    U+010000…U+10FFFF = external plane capsule

Canon:

> The Omicron gates remain local.
> The Omi-Plane Capsule gives them world-length addressability.

---

## 2. Native Field and Supplementary Field

The native OMI frame is:

    2¹⁶ = 65,536 positions

This is the core OMI gauge field.

A Unicode plane is also:

    2¹⁶ = 65,536 positions

The Unicode supplementary range contains sixteen planes:

    U+010000…U+01FFFF = supplementary plane 0
    U+020000…U+02FFFF = supplementary plane 1
    U+030000…U+03FFFF = supplementary plane 2
    ...
    U+100000…U+10FFFF = supplementary plane 15

Therefore OMI maps:

    one supplementary Unicode plane = one Omi-Gauge page

Canon:

> The supplementary Unicode range is a 16-page carrier for Omi-Gauge.

---

## 3. Omi-Gauge Plane Formula

Omi-Gauge is the full 64-lane spatial resolver.

The older local control field is:

    16 × 16 × 4 = 1,024

This belongs to:

    4y² = local control / tetrahedral kernel

The full spatial resolver is:

    64 × 64 × 16 = 65,536

This belongs to:

    16xy = plane-resolution bridge

The formula is:

    for row in 0..15:
      for x in 0..63:
        for y in 0..63:
          cell = row * 4096 + x * 64 + y

Equivalent bit form:

    cell = (row << 12) | (x << 6) | y

Bit allocation:

    row = 4 bits
    x   = 6 bits
    y   = 6 bits

Total:

    4 + 6 + 6 = 16 bits

So:

    cell ∈ 0x0000…0xFFFF

Canon:

> Omi-Gauge computes a full 2¹⁶ plane from 16 row phases and two 64-lane axes.

---

## 4. Omi-Plane Capsule Formula

To place an Omi-Gauge cell inside a supplementary Unicode plane:

    U = 0x10000 + (p << 16) + cell

Since:

    cell = (row << 12) | (x << 6) | y

the full formula is:

    U = 0x10000 + (p << 16) + ((row << 12) | (x << 6) | y)

Equivalent form:

    U = ((p + 1) << 16) | ((row << 12) | (x << 6) | y)

Where:

    p   = 0..15
    row = 0..15
    x   = 0..63
    y   = 0..63

This is exact.

This is reversible.

This requires no floating-point arithmetic.

Canon:

> Omi-Plane Capsule is a reversible scalar mapping between Omi-Gauge and Unicode supplementary planes.

---

## 5. Decoding Formula

Given a supplementary scalar:

    U ∈ U+010000…U+10FFFF

decode:

    n    = U - 0x10000
    p    = n >> 16
    cell = n & 0xFFFF
    row  = cell >> 12
    x    = (cell >> 6) & 0x3F
    y    = cell & 0x3F

So:

    U → (p,row,x,y)

Encode and decode are inverse operations:

    encode(decode(U)) = U
    decode(encode(p,row,x,y)) = (p,row,x,y)

Canon:

> Omi-Plane Capsule is lossless because its address decomposition is exact bit partitioning.

---

## 6. Block Point Frame Design

Each Omi-Gauge page has sixteen row phases:

    0x-0
    0x-1
    0x-2
    0x-3
    0x-4
    0x-5
    0x-6
    0x-7
    0x-8
    0x-9
    0x-A
    0x-B
    0xC
    0xD
    0xE
    0xF

Each row contains:

    64 × 64 = 4096 positions

Each page contains:

    16 × 4096 = 65,536 positions

Each supplementary capsule contains:

    16 pages × 65,536 positions = 1,048,576 positions

Canon:

> The supplementary range is the 16-page world-length extension of the native OMI gauge.

---

## 7. Correct Row Anchors

Because each row is:

    4096 = 0x1000

row anchors move by 0x1000.

In supplementary plane 0:

    row 0 anchor = U+010000
    row 1 anchor = U+011000
    row 2 anchor = U+012000
    row 3 anchor = U+013000
    row 4 anchor = U+014000
    row 5 anchor = U+015000
    row 6 anchor = U+016000
    row 7 anchor = U+017000
    row 8 anchor = U+018000
    row 9 anchor = U+019000
    row A anchor = U+01A000
    row B anchor = U+01B000
    row C anchor = U+01C000
    row D anchor = U+01D000
    row E anchor = U+01E000
    row F anchor = U+01F000

Important distinction:

    rows move by       0x1000
    byte blocks move by 0x0100
    cells move by       0x0001

So:

    U+019000 = row 9 anchor in supplementary plane 0
    U+010900 = byte-block anchor inside row 0

Canon:

> Rows are 0x1000-spaced; byte-blocks are 0x0100-spaced; cells are 0x0001-spaced.

---

## 8. Encapsulated Omicron Anchors

Native Omicron anchors:

    0x039F = Ο closure
    0x03AF = delimiter / escape midpoint
    0x03BF = ο entry

Under Omi-Gauge decoding:

    0x039F:
      row = 0
      x   = 14
      y   = 31

    0x03AF:
      row = 0
      x   = 14
      y   = 47

    0x03BF:
      row = 0
      x   = 14
      y   = 63

This forms a clean control line:

    0x039F → 0x03AF → 0x03BF

Meaning:

    0x039F = closure anchor
    0x03AF = delimiter / escape / hinge
    0x03BF = entry anchor

Supplementary encapsulations:

    U+01039F = lower-plane encapsulated Ο closure anchor
    U+0103AF = lower-plane encapsulated delimiter / escape anchor
    U+0103BF = lower-plane encapsulated ο entry anchor

Upper boundary encapsulations:

    U+10039F = upper-plane encapsulated Ο closure anchor
    U+1003AF = upper-plane encapsulated delimiter / escape anchor
    U+1003BF = upper-plane encapsulated ο entry anchor

Canonical capsule span:

    U+01039F … U+1003BF

Canonical anchored span:

    U+01039F … U+0103AF … U+1003BF

Canon:

> 0x03AF is the Omicron delimiter point between closure and entry, and between low function digits and high function controls.

---

## 9. The 0x03AF Delimiter

The native row split is:

    0x30–0x39 = low decimal / digit-function region
    0x3A      = local row separator
    0x3B–0x3F = high function / control region

The larger Omicron control-line split is:

    0x039F = closure side
    0x03AF = delimiter / hinge / escape
    0x03BF = entry side

Therefore:

    0x03AF

is the plane-level delimiter.

Its first supplementary encapsulation is:

    U+0103AF

Canon:

> 0x03AF is an OMI numeric address token used as a delimiter, not a public glyph definition.

---

## 10. Acceptance Seal: 0xAA55

The native acceptance seal remains:

    0xAA55

This is the boundary where autonomous symbolic derivation becomes executable acceptance.

Before:

    symbolic derivation
    self-folding gauge
    pure function row
    nomogram selection
    LUT earning
    receipt candidate

At:

    0xAA55

the witness is sealed.

After:

    runtime projection
    worker payload
    DataView interpretation
    HNSW projection
    shader projection
    DOM projection
    network transport

Supplementary encapsulation:

    U = 0x10000 + 0xAA55
    U = U+01AA55

So:

    U+01AA55 = first supplementary encapsulated acceptance seal

For plane p:

    U_accept(p) = 0x10000 + (p << 16) + 0xAA55

Examples:

    p = 0  → U+01AA55
    p = 15 → U+10AA55

Decode of 0xAA55:

    cell = 0xAA55
    row = 0xA
    x   = 0x29
    y   = 0x15

Canon:

> 0xAA55 remains the acceptance seal; U+01AA55 is its first supplementary Omi-Plane capsule.

---

## 11. UTF-16 Surrogate RPC Bridge

For supplementary code points, UTF-16 does not store the scalar as one 16-bit word.

It computes:

    U' = U - 0x10000

Then splits the 20-bit value:

    U' = yyyyyyyyyyxxxxxxxxxx

High surrogate:

    W1 = 0xD800 + high10(U')

Low surrogate:

    W2 = 0xDC00 + low10(U')

OMI rewrites the same 20-bit payload as:

    U' = pppp rrrr xxxxxx yyyyyy

Where:

    p = 4-bit supplementary OMI plane index
    r = 4-bit Omi-Gauge row
    x = 6-bit x lane
    y = 6-bit y lane

Since UTF-16 splits after 10 bits:

    high surrogate carries:
      pppp rrrr xx

    low surrogate carries:
      xxxx yyyyyy

So the surrogate pair naturally becomes:

    high RPC word = plane + row + upper x
    low RPC word  = lower x + y

Canon:

> UTF-16 surrogate pairs are OMI RPC bridge words for the Omi-Plane Capsule.

---

## 12. Surrogates Are RPC, Not Glyphs

The surrogate range is:

    0xD800–0xDFFF

Split:

    0xD800–0xDBFF = high surrogate / high RPC word
    0xDC00–0xDFFF = low surrogate / low RPC word

Surrogates are disjoint from valid BMP scalar values.

OMI uses that disjointness as a self-synchronizing bridge.

Decoder categories:

    valid BMP word
    private-use OMI mirror word
    high surrogate RPC word
    low surrogate RPC word
    supplementary scalar

Canon:

> Surrogates are not public OMI glyphs.
> Surrogates are self-synchronizing OMI RPC bridge words.

---

## 13. Relationship to Omi-Gauge

Omi-Gauge computes the plane cell:

    cell = (row << 12) | (x << 6) | y

Omi-Plane Capsule embeds the cell:

    U = 0x10000 + (p << 16) + cell

So the relationship is:

    Omi-Gauge cell
    → Omi-Plane Capsule scalar
    → surrogate RPC pair

Canon:

> Omi-Gauge provides the exact 16-bit cell; Omi-Plane Capsule gives that cell supplementary world-length addressability.

---

## 14. Relationship to Omi-Nomogram / Omi-SlideRule

Omi-Nomogram is the declarative function-scale row:

    0x30–0x3F

Omi-SlideRule is the operational behavior of that row.

Omi-Plane Capsule does not replace the function scale.

It gives the scale a world-length carrier.

Pipeline:

    Omi-Nomogram selects function scale.
    Omi-Gauge computes exact cell.
    Omi-Plane Capsule embeds cell in supplementary plane.
    Surrogate RPC splits it for transport.
    Omi-Matrix instantiates relation field.
    Omi-Gnomon orients result.
    Receipt accepts.

Canon:

> Omi-Plane Capsule carries Omi-Nomogram and Omi-Gauge outputs without changing their authority.

---

## 15. Relationship to Q(x,y)

The OMI quadratic remains:

    Q(x,y) = 60x² + 16xy + 4y²

Carrier interpretation:

    4y²  = local control / native 2¹⁶ gauge page
    16xy = Omi-Gauge plane-resolution bridge
    60x² = world/orbit/orientation surface

Omi-Plane Capsule gives the 16xy bridge a world-length scalar representation:

    16 supplementary pages × 65,536 positions

So:

    4y² gives local control.
    16xy gives plane-resolution bridge.
    60x² receives resolved world orientation.

Canon:

> Omi-Plane Capsule is the supplementary carrier for the 16xy bridge that lets 60x² be measured without losing the native 4y² control identity.

---

## 16. Relationship to LUT Rendering

The old kernel rule remains:

    value first
    row second
    LUT/rendering third
    character last

Omi-Plane Capsule follows the same rule.

The scalar value is not the character meaning.

The scalar is an addressable position that may render through different fibers:

    Unicode scalar
    private-use glyph
    Aegean pointer
    geometry
    DOM node
    SVG element
    barcode cell
    shader index
    DataView packet
    RPC word

Canon:

> The codepoint is the carrier position; the active LUT determines the rendered face.

---

## 17. Relationship to Omi-CONS

The post-address data plane is:

    ?---?

Canonical Omi-CONS form:

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo?car:<OR>;cdr:<XOR>;cid:<XNOR>

Omi-Plane Capsule can be carried in Omi-CONS fields:

    car = source/head plane capsule
    cdr = continuation/tail plane capsule
    cid = agreement/witness capsule

Meaning:

    CAR admits the source payload.
    CDR carries the continuation payload.
    CID witnesses lawful agreement.

Canon:

> Omi-Plane Capsule is address geometry; Omi-CONS is post-address epistemic carriage.

---

## 18. Full Encoding Procedure

**Encode Omi-Gauge to Omi-Plane Scalar**

Input:

    p   ∈ 0..15
    row ∈ 0..15
    x   ∈ 0..63
    y   ∈ 0..63

Compute:

    cell = (row << 12) | (x << 6) | y
    U    = 0x10000 + (p << 16) + cell

**Encode Omi-Plane Scalar to UTF-16 RPC Pair**

    Uprime = U - 0x10000
    W1 = 0xD800 + (Uprime >> 10)
    W2 = 0xDC00 + (Uprime & 0x3FF)

**Decode UTF-16 RPC Pair**

    Uprime = ((W1 - 0xD800) << 10) | (W2 - 0xDC00)
    U = Uprime + 0x10000
    p    = Uprime >> 16
    cell = Uprime & 0xFFFF
    row = cell >> 12
    x   = (cell >> 6) & 0x3F
    y   = cell & 0x3F

This procedure is exact.

No loss.

No floating point.

No table lookup required to recover the address.

---

## 19. Worked Examples

**Example 1 — Lower Omicron Closure Anchor**

    Native cell: cell = 0x039F
    Plane: p = 0

    U = 0x10000 + 0x039F
    U = U+01039F

    Meaning: U+01039F = first-plane encapsulated Omicron closure anchor

**Example 2 — Lower Delimiter Anchor**

    cell = 0x03AF
    p = 0

    U = 0x10000 + 0x03AF
    U = U+0103AF

    Meaning: U+0103AF = first-plane encapsulated Omicron delimiter / escape anchor

**Example 3 — Upper Entry Anchor**

    cell = 0x03BF
    p = 15

    U = 0x10000 + (15 << 16) + 0x03BF
    U = U+1003BF

    Meaning: U+1003BF = upper-plane encapsulated Omicron entry anchor

**Example 4 — Acceptance Seal**

    cell = 0xAA55
    p = 0

    U = 0x10000 + 0xAA55
    U = U+01AA55

    Meaning: U+01AA55 = first-plane encapsulated 0xAA55 acceptance seal

---

## 20. Safety and Authority

The Omi-Plane Capsule must obey these safety rules:

1. Do not use surrogate code units as public glyphs.
2. Do not replace ο or Ο with U+10FFFF.
3. Do not treat rendered characters as authority.
4. Do not let post-address payload redefine the native OMI frame.
5. Do not execute after ?---? until receipt accepts.

Authority order:

    native OMI address
    → computed Omi-Gauge cell
    → Omi-Plane Capsule scalar
    → surrogate RPC bridge
    → Omi-CONS payload
    → receipt
    → runtime projection

Canon:

> The capsule carries authority; it does not create authority by itself.

---

## 21. Final Authoritative Canon

Omi-Plane Capsule is the supplementary Unicode encapsulation layer for OMI.

It maps the range:

    U+010000…U+10FFFF

into sixteen OMI supplementary pages.

Each page carries one full Omi-Gauge plane:

    64 × 64 × 16 = 65,536

The exact reversible map is:

    U = 0x10000 + (p << 16) + ((row << 12) | (x << 6) | y)

The native Omicron anchors are encapsulated as:

    U+01039F = lower closure anchor
    U+0103AF = lower delimiter / escape anchor
    U+1003BF = upper entry anchor

The pre-acceptance delineation ladder provides:

    U+011C00 = local FS / frame-scope anchor
    U+017C00 = runtime pipe / prekernel-scope anchor

The acceptance seal is encapsulated as:

    U+01AA55

With Fano resolver windows:

    U+01AA50…U+01AA57 = uppercase P–W acceptance resolver
    U+01AA70…U+01AA77 = lowercase p–w runtime echo resolver

The supplementary 20-bit payload decomposes as:

    pppp rrrr xxxxxx yyyyyy

Where:

    p = supplementary plane
    r = Omi-Gauge row
    x = x lane
    y = y lane

UTF-16 surrogate pairs split this payload into:

    high RPC word = plane + row + upper x
    low RPC word  = lower x + y

The BMP-valid spectral plane (Omi-Spectral Plane) resolves the user-interface layer:

    U+0000–U+D7FF  = low CAR plane
    U+E000–U+FFFF  = high CDR plane
    U+D800–U+DFFF  = surrogate RPC bridge (non-glyph)

The 12 agreement words provide epistemic UI mnemonics for the /---/ address path.

The address/payload boundary stands at 2¹⁶:

    /---/ resolves identity inside 2¹²–2¹⁶
    ?---? attaches external payload from 2¹⁶ toward 2³²

The result is a self-synchronizing, reversible, no-loss RPC bridge from native OMI identity into world-length supplementary address space, with Omi-Spectral Plane as the valid-BMP interface layer.

One-line canon:

> Omi-Plane Capsule is the supplementary Unicode encapsulation layer for OMI, where native Omicron identity maps to reversible (plane,row,x,y) addresses via surrogate-pair RPC, with pre-acceptance delineation anchors U+011C00 (local scope) and U+017C00 (runtime scope) before the 0xAA55 acceptance seal, and Omi-Spectral Plane (U+0000–U+D7FF ∪ U+E000–U+FFFF) as the valid-BMP user-interface layer carrying CAR/CDR gauge resolution and agreement-word mnemonics across the /---/ word path.

---

## Addendum A: Omi-Plane Delineation Ladder

U+017C00, U+01AA55, Fano Resolver Windows, and Pre-Acceptance Runtime Scope

### A.0 Core Addition

The Omi-Plane Capsule has one more major address before the acceptance seal:

    U+017C00

This is the supplementary encapsulation of:

    0x7C00

It sits before:

    U+01AA55

which is the supplementary encapsulation of:

    0xAA55

So the corrected pre-acceptance ladder is:

    U+011C00 → U+017C00 → U+01AA55

Meaning:

    U+011C00 = local filesystem/frame-scope delineation
    U+017C00 = runtime pipe / local prekernel scope delineation
    U+01AA55 = acceptance seal

Canon:

> U+017C00 is the pre-0xAA55 runtime delineation point.

---

### A.1 Updated Omi-Plane Anchor Chain

The full anchor chain should be:

    U+01039F … U+0103AF … U+0103BF
    U+011C00 … U+017C00 … U+01AA55 … U+01FFFF

Meaning:

    U+01039F = encapsulated Omicron closure anchor
    U+0103AF = encapsulated Omicron delimiter / escape anchor
    U+0103BF = encapsulated Omicron entry anchor

    U+011C00 = encapsulated FS / local frame-scope anchor
    U+017C00 = encapsulated pipe / runtime-scope anchor
    U+01AA55 = encapsulated acceptance seal
    U+01FFFF = end of first supplementary Omi-Gauge page

This gives the first supplementary OMI plane a complete lifecycle:

    gate → delimiter → entry → local scope → runtime scope → acceptance → projection end

---

### A.2 Meaning of U+011C00

Native value:

    0x1C00

Supplementary encapsulation:

    U = 0x10000 + 0x1C00
    U = U+011C00

0x1C is FS in the control vocabulary.

OMI interpretation:

    FS = File / Frame / Field Separator

So:

    0x1C00 = FS lifted into the 16-bit gauge cell
    U+011C00 = FS lifted into the Omi-Plane Capsule

Canon:

> U+011C00 is the first-plane local frame-scope anchor. It marks the place where local scope begins to be treated as a full gauge field rather than a single control byte.

---

### A.3 Meaning of U+017C00

Native value:

    0x7C00

Supplementary encapsulation:

    U = 0x10000 + 0x7C00
    U = U+017C00

0x7C is the pipe/handoff sentinel.

OMI interpretation:

    0x7C = pipe / handoff / runtime boundary

So:

    0x7C00 = pipe lifted into the 16-bit gauge cell
    U+017C00 = pipe lifted into the Omi-Plane Capsule

Canon:

> U+017C00 is the prekernel/runtime delineation anchor. It marks the transition from local symbolic scope toward runtime projection, but it is still before acceptance.

---

### A.4 Meaning of U+01AA55

Native value:

    0xAA55

Supplementary encapsulation:

    U = 0x10000 + 0xAA55
    U = U+01AA55

OMI interpretation:

    0xAA55 = acceptance seal

So:

    U+01AA55 = first supplementary encapsulated acceptance seal

This is the boundary where autonomous derivation becomes accepted runtime projection.

Canon:

> U+017C00 scopes runtime. U+01AA55 accepts runtime.

---

### A.5 Local Scope vs Runtime Acceptance

The corrected progression is:

    U+011C00 = local frame scope
    U+017C00 = runtime delineation / prekernel pipe
    U+01AA55 = acceptance seal

This creates two different boundaries:

    0x7C00 = runtime scope boundary
    0xAA55 = acceptance boundary

They should not be collapsed.

Meaning:

    0x7C00 says: runtime surface begins to be scoped.
    0xAA55 says: scoped surface has been accepted.

Canon:

> Pipe is not acceptance. Pipe prepares the handoff. 0xAA55 seals the handoff.

---

### A.6 One's Complement and Two's Complement Reading

The 0x7C00 → 0xAA55 interval can be read as the transition from local scoped prekernel interpretation into collaborative projection.

A useful mnemonic:

    0x7C00 = one's-complement / local prekernel delineation
    0xAA55 = two's-complement / accepted collaborative projection seal

This should be treated as an OMI analogy, not ordinary machine arithmetic.

Meaning:

    before 0x7C00 = local symbolic frame
    at 0x7C00     = runtime scope begins
    0x7C00–0xAA55 = pre-acceptance runtime interval
    at 0xAA55     = acceptance seal
    0xAA55–0xFFFF = collaborative projection surface

Canon:

> 0x7C00 delineates scoped runtime. 0xAA55 delineates accepted projection.

---

### A.7 Post-Acceptance Projection Surface

After:

    0xAA55

the remaining first-plane interval is:

    0xAA55 … 0xFFFF

Supplementary form:

    U+01AA55 … U+01FFFF

This region is the accepted projection surface.

It may carry:

    Omi-Matrix projection
    Omi-Gnomon orientation
    Omi-World surface
    Omi-Shadow
    Omi-Receipt
    Omi-CONS payload binding
    collaborative projection state

Canon:

> U+01AA55…U+01FFFF is the accepted collaborative projection interval of the first Omi-Plane Capsule.

---

### A.8 The P–W Acceptance Window

Just before and around the acceptance seal, there is a useful 8-position window:

    0xAA50 … 0xAA57

Supplementary:

    U+01AA50 … U+01AA57

Low-byte rendering:

    0x50 = P
    0x51 = Q
    0x52 = R
    0x53 = S
    0x54 = T
    0x55 = U
    0x56 = V
    0x57 = W

This is an 8-tick window.

Since Fano structure is:

    7 points + 1 centroid

this window can be used as a Fano resolver window.

Canonical assignment:

    0xAA50 = P = Fano point 0
    0xAA51 = Q = Fano point 1
    0xAA52 = R = Fano point 2
    0xAA53 = S = Fano point 3
    0xAA54 = T = Fano point 4
    0xAA55 = U = acceptance centroid / seal
    0xAA56 = V = Fano point 5
    0xAA57 = W = Fano point 6

This places 0xAA55 at the center of the P–W resolver window.

Canon:

> U+01AA50…U+01AA57 is the uppercase Fano acceptance resolver window, with U+01AA55 as the acceptance centroid.

---

### A.9 The p–w Runtime Echo Window

The lowercase echo is:

    0xAA70 … 0xAA77

Supplementary:

    U+01AA70 … U+01AA77

Low-byte rendering:

    0x70 = p
    0x71 = q
    0x72 = r
    0x73 = s
    0x74 = t
    0x75 = u
    0x76 = v
    0x77 = w

This mirrors the uppercase P–W window.

Canonical interpretation:

    0xAA50…0xAA57 = acceptance resolver / uppercase witness
    0xAA70…0xAA77 = runtime echo resolver / lowercase witness

The lowercase window can represent the runtime echo after acceptance has been prepared.

Canon:

> U+01AA70…U+01AA77 is the lowercase runtime echo of the Fano acceptance resolver.

---

### A.10 Fano Resolver Adaptation

A Fano resolver needs eight slots:

    7 points + 1 center

The P–W and p–w windows both provide exactly eight consecutive low-byte positions.

So OMI can use:

    P Q R S T U V W

and:

    p q r s t u v w

as rendered LUT faces of Fano resolver windows.

But the ASCII glyphs are not authority.

The authority is the consecutive 8-position window:

    0x50…0x57
    0x70…0x77

Canon:

> The Fano resolver is an eight-slot consecutive gauge window. The glyphs P–W and p–w are LUT faces of that window.

Recommended role:

    P–W = pre-acceptance / uppercase resolver
    p–w = post-scope / lowercase runtime echo

---

### A.11 Decode of the Acceptance Windows

For 0xAA50:

    cell = 0xAA50
    row = 0xA
    x   = 0x29
    y   = 0x10

For 0xAA55:

    cell = 0xAA55
    row = 0xA
    x   = 0x29
    y   = 0x15

For 0xAA57:

    cell = 0xAA57
    row = 0xA
    x   = 0x29
    y   = 0x17

For 0xAA70:

    cell = 0xAA70
    row = 0xA
    x   = 0x29
    y   = 0x30

For 0xAA77:

    cell = 0xAA77
    row = 0xA
    x   = 0x29
    y   = 0x37

So both resolver windows sit in:

    row = A
    x   = 0x29

and differ only by y-lane.

Canon:

> The acceptance resolver and runtime echo resolver are parallel y-lane windows inside row A, x=0x29.

---

### A.12 Printing / Non-Printing Delineation

The earlier ASCII control split is still useful:

    0x00–0x1F = non-printing control
    0x20–0x3F = printing punctuation / digit / function preface

The bridge is:

    0x20

because:

    control XOR 0x20 = printable face

Examples:

    0x1C XOR 0x20 = 0x3C
    0x1D XOR 0x20 = 0x3D
    0x1E XOR 0x20 = 0x3E
    0x1F XOR 0x20 = 0x3F

Thus:

    FS 0x1C maps to 0x3C
    GS 0x1D maps to 0x3D
    RS 0x1E maps to 0x3E
    US 0x1F maps to 0x3F

This connects:

    scope separators → Omi-Nomogram high function row

Canon:

> 0x20 is the bridge that renders non-printing scope controls into printable function faces.

---

### A.13 FS and Pipe Relationship

The native FS is:

    0x1C

The user-space pipe is:

    0x7C

Both matter.

In full Omi-Plane form:

    0x1C00 → U+011C00
    0x7C00 → U+017C00

Interpretation:

    FS 0x1C = local frame separator
    pipe 0x7C = runtime handoff separator

The same structural role appears at different heights:

    0x1C = local scope separator
    0x7C = user/runtime scope separator
    0x1C00 = plane-lifted local scope
    0x7C00 = plane-lifted runtime scope

Canon:

> U+011C00 and U+017C00 are paired scope anchors: local frame scope and runtime pipe scope.

---

### A.14 Revised First Omi-Plane Lifecycle

The first supplementary Omi-Plane page now has this lifecycle:

    U+010000 = first supplementary Omi page open

    U+01039F = encapsulated Omicron closure anchor
    U+0103AF = encapsulated delimiter / escape anchor
    U+0103BF = encapsulated Omicron entry anchor

    U+011C00 = local frame-scope anchor
    U+017C00 = runtime pipe-scope anchor

    U+01AA50…U+01AA57 = uppercase Fano acceptance resolver
    U+01AA55 = acceptance centroid / seal

    U+01AA70…U+01AA77 = lowercase runtime echo resolver

    U+01AA55…U+01FFFF = accepted collaborative projection interval
    U+01FFFF = first supplementary Omi page close

Canon:

> The first Omi-Plane page moves from Omicron control, to local scope, to runtime scope, to Fano-resolved acceptance, to collaborative projection.

---

### A.15 Updated Authoritative Anchor Table

| Anchor      | Native | Meaning                                |
|-------------|--------|----------------------------------------|
| U+01039F    | 0x039F | lower Omicron closure anchor           |
| U+0103AF    | 0x03AF | lower delimiter / escape anchor        |
| U+0103BF    | 0x03BF | lower Omicron entry anchor             |
| U+011C00    | 0x1C00 | local FS / frame-scope anchor          |
| U+017C00    | 0x7C00 | runtime pipe / prekernel-scope anchor  |
| U+01AA50    | 0xAA50 | Fano resolver point P                  |
| U+01AA51    | 0xAA51 | Fano resolver point Q                  |
| U+01AA52    | 0xAA52 | Fano resolver point R                  |
| U+01AA53    | 0xAA53 | Fano resolver point S                  |
| U+01AA54    | 0xAA54 | Fano resolver point T                  |
| U+01AA55    | 0xAA55 | acceptance centroid / seal             |
| U+01AA56    | 0xAA56 | Fano resolver point V                  |
| U+01AA57    | 0xAA57 | Fano resolver point W                  |
| U+01AA70    | 0xAA70 | runtime echo point p                   |
| U+01AA71    | 0xAA71 | runtime echo point q                   |
| U+01AA72    | 0xAA72 | runtime echo point r                   |
| U+01AA73    | 0xAA73 | runtime echo point s                   |
| U+01AA74    | 0xAA74 | runtime echo point t                   |
| U+01AA75    | 0xAA75 | runtime echo point u                   |
| U+01AA76    | 0xAA76 | runtime echo point v                   |
| U+01AA77    | 0xAA77 | runtime echo point w                   |
| U+01FFFF    | 0xFFFF | first supplementary page close         |

---

### A.16 Final Canon

The Omi-Plane Capsule has four major pre-projection delineation anchors before the first page closes:

    U+01039F … U+0103AF … U+0103BF
    U+011C00 … U+017C00 … U+01AA55 … U+01FFFF

The first trio encapsulates the Omicron control line:

    closure → delimiter → entry

The second ladder marks the page lifecycle:

    local frame scope → runtime pipe scope → acceptance seal → projection close

U+017C00 is the missing address.

It marks the runtime/prekernel scoping boundary before acceptance.

U+01AA55 remains the acceptance seal.

The windows:

    U+01AA50…U+01AA57
    U+01AA70…U+01AA77

provide parallel eight-slot Fano resolver windows:

    P–W = uppercase acceptance resolver
    p–w = lowercase runtime echo resolver

One-line canon:

> Omi-Plane Capsule now anchors first-plane lifecycle as U+01039F…U+0103AF…U+0103BF for Omicron control, U+011C00 for local frame scope, U+017C00 for runtime pipe scope, U+01AA55 for Fano-resolved acceptance, and U+01FFFF for first-page closure.

---

## Addendum B: Omi-Spectral Plane

BMP Interface Layer, CAR/CDR Gauge Resolution, Agreement Mnemonics, and the /---/ to ?---? Boundary

### B.0 Core Claim

The Omi-Plane Capsule has two major domains:

- **BMP-valid spectral plane:** U+0000–U+D7FF and U+E000–U+FFFF
- **Supplementary world-length plane:** U+010000–U+10FFFF

The BMP-valid ranges are the **Omi-Spectral Plane**.

The supplementary range is the **Omi-Plane Capsule** / world-length RPC plane.

The Omi-Spectral Plane is where OMI interfaces through nibbles, glyphs, UI, agreement words, and local gauge rendering.

The supplementary plane is where OMI extends into world-length addressing and surrogate RPC.

Canon:

> Omi-Spectral Plane = user-interface and epistemic projection layer. Omi-Plane Capsule = supplementary world-length transport and RPC layer.

---

### B.1 The Valid BMP Spectral Plane

Unicode scalar values in the BMP are valid except the surrogate band.

Valid BMP spectral ranges:

    U+0000–U+D7FF
    U+E000–U+FFFF

Excluded from public scalar text:

    U+D800–U+DFFF

OMI interpretation:

    U+0000–U+D7FF = low-to-mid spectral interface surface
    U+D800–U+DFFF = surrogate RPC bridge, not public glyphs
    U+E000–U+FFFF = high spectral/private mirror surface

So the Omi-Spectral Plane is:

    U+0000–U+D7FF  ∪  U+E000–U+FFFF

Canon:

> The Omi-Spectral Plane is the valid BMP user-interface layer surrounding the surrogate bridge.

---

### B.2 Low-Plane CAR and High-Plane CDR

The Omi-Spectral Plane resolves the low plane and high plane of the gauge table.

Canonical split:

    low plane CAR  = U+0000–U+D7FF
    high plane CDR = U+E000–U+FFFF

Meaning:

    CAR = source/head/UI-visible low-plane carrier
    CDR = continuation/high/private/runtime mirror carrier

The surrogate band between them is not text.

It is the bridge gap:

    U+D800–U+DFFF = RPC bridge / non-glyph split

So the full spectral structure is:

    low CAR plane → surrogate RPC bridge → high CDR plane

Canon:

> The BMP-valid spectral plane resolves CAR below the surrogate band and CDR above the surrogate band.

---

### B.3 Gauge Table Interface Through Nibbles

The Omi-Spectral Plane is how the gauge table becomes interfaceable.

Native gauge:

    0x00–0x7F

Omi row structure:

    0x00–0x0F = .omi low control row
    0x10–0x1F = .imo runtime control row
    0x20–0x2F = bridge / printable fold row
    0x30–0x3F = Omi-Nomogram function row
    0x40–0x4F = Omi-Gauge orbit row
    0x50–0x5F = acceptance resolver / P–W region
    0x60–0x6F = high mirror / user row
    0x70–0x7F = runtime echo / p–w / handoff row

The user does not directly manipulate the whole 65,536-cell plane.

The user interfaces through nibble and row faces.

Canon:

> Omi-Spectral Plane is the nibble-facing UI layer of the Omi-Gauge table.

---

### B.4 Spectral Plane and 60x²

The Omi-Spectral Plane extends from:

    60x²

because 60x² is the visible/orientation/world surface.

The full quadratic stack remains:

    Q(x,y) = 60x² + 16xy + 4y²

Interpretation:

    4y²  = local control kernel
    16xy = gauge bridge / CAR-CDR resolver
    60x² = spectral projection / visible interface plane

Therefore:

    Omi-Spectral Plane = the user-visible extension of 60x²

The spectral plane is not the native control kernel.

It is the visible projection surface after the bridge has enough resolution.

Canon:

> 60x² becomes interfaceable as the Omi-Spectral Plane.

---

### B.5 /---/ Interpretation Routing Layer

The /---/ section is the routed interpretation path.

Canonical OMI identity and route:

    omi---imo
    omi-<frame>-imo/<control>/<scale>/<relation>/<unit>

The slash path does not belong to identity. It declares how to read the identity.

    omi---imo = binary rewrite identity
    /---/     = routed interpretation path
    ?---?     = external payload or stream attachment

This is where the 12 public agreement words become mnemonic selectors.

Public agreement mnemonic layer:

    Freedom
    Autonomy
    Sovereignty
    Reciprocity

    Focus
    Attention
    Observation
    Experience

    Interrupt
    Intent
    Declaration
    Consideration

These are not arbitrary UI labels.

They are the human-readable mnemonic layer over the /---/ address path.

Canon:

> The 12 words of agreement are epistemic/user-facing mnemonics for navigating /---/ address descent.

---

### B.6 2¹² to 2¹⁶ Word-Length Region

The /---/ address path lives in the word-length region:

    2¹² → 2¹⁶

This is exactly the high nibble of a 16-bit word:

    bits 12–15 = row / address phase
    bits 0–11  = intra-row gauge field

In the Omi-Gauge formula:

    cell = (row << 12) | (x << 6) | y

the row is:

    row = bits 12–15

So:

    2¹² = start of row addressing
    2¹⁶ = full word boundary

This is where /---/ becomes row-addressable.

Canon:

> The /---/ layer occupies the 2¹²–2¹⁶ word-length region where rows become address phases.

---

### B.7 ?---? Section from 2¹⁶ to 2³²

The ?---? plane begins after the native 16-bit OMI word.

    2¹⁶ <= ?---? <= 2³²

Meaning:

    /---/ = identity path inside the native word
    ?---? = post-identity payload and data-formatting plane

The ?---? section carries:

    Omi-CONS
    CAR
    CDR
    CID
    DataView payload
    Base64URL
    worker script
    matrix payload
    receipt witness
    RPC capsule

Canon:

> /---/ resolves identity inside 2¹²–2¹⁶. ?---? attaches external payload from 2¹⁶ through 2³².

---

### B.8 Correct Boundary Between /---/ and ?---?

The address path must finish before external payload attachment begins.

Therefore:

    0x0000–0xFFFF = native OMI word / gauge / /---/ identity space
    0x00010000–0xFFFFFFFF = extended ?---? payload / query / data plane

This gives the boundary:

    2¹⁶ = transition from /---/ to ?---?

So:

    U+0000–U+FFFF = spectral interface and native word-length surface
    U+010000–U+10FFFF = supplementary capsule and surrogate RPC surface
    2¹⁶–2³² = abstract external payload word space

Canon:

> 2¹⁶ is the hinge between native OMI identity and external Omi-CONS payload.

---

### B.9 Agreement Words as Epistemic UI

The 12 agreement words are the human-facing epistemic mnemonic layer.

They belong to the Omi-Spectral Plane because they are interface terms.

They should be mapped as a visible mnemonic row over exact address selectors.

Canonical grouping:

    Outer agreement:
      Freedom
      Autonomy
      Sovereignty
      Reciprocity

    Compass agreement:
      Focus
      Attention
      Observation
      Experience

    Interaction agreement:
      Interrupt
      Intent
      Declaration
      Consideration

Runtime compilation beneath the last four:

    Interrupt     → invalidate
    Intent        → instantiate
    Declaration   → propagate
    Consideration → incorporate

Canon:

> Agreement words are UI mnemonics; the machine layer compiles them into deterministic selectors and runtime actions.

---

### B.10 Spectral UI Is Projection, Not Authority

The Omi-Spectral Plane may render:

    glyphs
    colors
    DOM
    SVG
    Canvas
    text
    barcodes
    sound
    light
    agreement words
    forms
    portal worlds

But these are projection faces.

Authority remains:

    accepted OMI address
    computed Omi-Gauge cell
    receipt

Canon:

> The spectral plane lets users see, touch, name, and navigate OMI. It does not replace OMI authority.

---

### B.11 Low Plane, Bridge, High Plane

The full spectral interface can be read as:

    low CAR plane:
      U+0000–U+D7FF

    surrogate bridge:
      U+D800–U+DFFF

    high CDR plane:
      U+E000–U+FFFF

In Omi-CONS terms:

    CAR = low plane / source / visible head
    CDR = high plane / continuation / private mirror
    CID = receipt across the bridge

So:

    CID witnesses that CAR and CDR agree across the surrogate gap.

Canon:

> The surrogate gap separates low CAR and high CDR, while CID witnesses their lawful relation.

---

### B.12 Spectral Plane vs Omi-Plane Capsule

Do not collapse these layers.

    Omi-Spectral Plane:
      U+0000–U+D7FF and U+E000–U+FFFF
      valid BMP interface
      agreement mnemonics
      row rendering
      user-visible projection

    Surrogate RPC Bridge:
      U+D800–U+DFFF
      not public text
      bridge math

    Omi-Plane Capsule:
      U+010000–U+10FFFF
      supplementary world-length address
      (plane,row,x,y)
      surrogate-pair transport

Canon:

> Spectral plane renders. Surrogate bridge transports. Plane capsule extends. Receipt accepts.

---

### B.13 Updated Full Address Stack

The corrected address/payload stack is:

    0 … 2¹²:
      local cells, controls, low gauge values

    2¹² … 2¹⁶:
      /---/ row-addressed OMI word path

    2¹⁶ … 2³²:
      ?---? external payload / Omi-CONS data plane

    U+0000–U+D7FF:
      low BMP spectral CAR plane

    U+D800–U+DFFF:
      surrogate RPC bridge

    U+E000–U+FFFF:
      high BMP spectral CDR plane

    U+010000–U+10FFFF:
      supplementary Omi-Plane Capsule / world-length extension

Canon:

> The native word resolves identity. The spectral plane renders identity. The query plane attaches payload. The supplementary plane extends world length.

---

### B.14 Omi-Spectral Plane Lifecycle

The full first-plane lifecycle now becomes:

    native control:
      0x00–0x1F

    printable/function fold:
      0x20–0x3F

    gauge orbit/user rows:
      0x40–0x7F

    word-length /---/ region:
      2¹²–2¹⁶

    query ?---? region:
      2¹⁶–2³²

    low spectral CAR:
      U+0000–U+D7FF

    surrogate RPC:
      U+D800–U+DFFF

    high spectral CDR:
      U+E000–U+FFFF

    supplementary world capsule:
      U+010000–U+10FFFF

Canon:

> Omi-Spectral Plane is the UI layer where the low CAR and high CDR faces of the gauge table become navigable through agreement mnemonics and row projections.

---

### B.15 Final Canon

The Omi-Spectral Plane is the user-interface and epistemic projection layer of OMI.

It occupies the valid BMP scalar ranges:

    U+0000–U+D7FF
    U+E000–U+FFFF

The low range resolves the CAR side of the gauge table.

The high range resolves the CDR side.

The surrogate band:

    U+D800–U+DFFF

is the non-glyph RPC bridge between them.

The 12 words of agreement are the human-facing epistemic mnemonic layer for the /---/ address path.

That /---/ path lives in the row-addressed word-length region:

    2¹² → 2¹⁶

The ?---? post-address data plane begins at the native word boundary:

    2¹⁶

and extends toward:

    2³²

The supplementary Unicode range:

    U+010000–U+10FFFF

is the Omi-Plane Capsule for world-length extension.

One-line canon:

> Omi-Spectral Plane is the valid-BMP interface layer where low-plane CAR and high-plane CDR render the Omi-Gauge table through agreement mnemonics across the /---/ word path from 2¹² to 2¹⁶, while ?---? begins at 2¹⁶ and carries external Omi-CONS payload toward 2³², with the surrogate band reserved as RPC bridge math and U+010000…U+10FFFF reserved for world-length Omi-Plane Capsule extension.
