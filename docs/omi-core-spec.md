# OMI-CORE-v0 Specification

## Normative Grammar and Invariants for the Omicron Object Model Kernel

**Specification ID:** OMI-CORE-v0
**Version:** 0.1
**Canonical root:** `Ο-ffff-127--/48`

---

## 1. Notation

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

---

## 2. Omicron Operators

### 2.1 Canonical Operators

A conforming implementation MUST treat the following two Unicode codepoints as the canonical machine operators:

| Codepoint | Glyph | Name | Role |
|-----------|-------|------|------|
| `U+039F` | `Ο` | Greek Capital Letter Omicron | Cardinal boundary operator |
| `U+03BF` | `ο` | Greek Small Letter Omicron | Chiral execution operator |

### 2.2 Operator Semantics

`Ο` (cardinal) MUST denote:

- boundary establishment
- subnet containment
- scope closure
- frame demarcation

`ο` (chiral) MUST denote:

- local execution
- state transition
- runtime evaluation
- pairwise rotation

### 2.3 Readable Aliases

A conforming implementation SHOULD recognize the following ASCII aliases and normalize them to the canonical Omicron operators:

| Input | Normalized to |
|-------|---------------|
| `omi-` prefix | `ο` |
| `OMI-` prefix | `Ο` |
| `-imo` suffix | (removed) |
| `-IMO` suffix | (removed) |

A conforming implementation MUST NOT treat `omi-` or `-imo` as canonical machine operators. They are programmer-interface aliases only.

---

## 3. OMI-CIDR Address Grammar

### 3.1 Address Form

An OMI-CIDR address SHALL have the form:

```
<p;operator> <address-body> [ "/" <prefix> ]
```

Where:

- `<operator>` is `Ο` or `ο`
- `<address-body>` is a hyphen-separated sequence of up to 8 hextets (16-bit hexadecimal values)
- `<prefix>` is an integer in the range `0..128`

The operator and address body MUST be concatenated without a separator.

### 3.2 Hextets

Each hextet SHALL be expressed as a hexadecimal string of 1 to 4 case-insensitive digits.

Leading zeros MAY be omitted. Implementations MUST zero-pad on expansion.

### 3.3 Zero Compression

The double-hyphen `--` in the address body MUST be treated as zero compression, functionally equivalent to IPv6 `::`.

Zero compression SHALL expand to the minimum number of zero hextets required to produce exactly 8 hextets total.

Only one instance of `--` per address body is defined by this specification. Behavior with multiple `--` is implementation-defined.

### 3.4 Register Expansion

A conforming implementation MUST:

- parse an address body into exactly 8 hextets
- zero-pad partial addresses that contain fewer than 8 hextets and no `--`
- expand `--` to the required number of zero hextets
- reject address bodies that, after expansion, contain more than 8 hextets (segment overflow)

### 3.5 Prefix Width

The prefix width `N` in `/N` SHALL be an integer in the range `0..128`.

The prefix SHALL scope the first `N` bits of the expanded 128-bit address.

The following prefix lengths are RECOMMENDED:

| Prefix | Interpretation |
|--------|---------------|
| `/48` | Canonical local frame |
| `/64` | Local execution subnet |
| `/80` | Device/process scope |
| `/96` | Opcode lane |
| `/112` | Mask lane |
| `/128` | Fully specified endpoint |

---

## 4. Canonical Local Frame

### 4.1 Frame Identity

The canonical local frame SHALL be:

```
Ο-ffff-127--/48
```

Expanded form:

```
Ο-ffff-0127-0000-0000-0000-0000-0000-0000/48
```

### 4.2 Frame Root Segments

The canonical expanded segments SHALL be:

```
["ffff", "127", "0", "0", "0", "0", "0", "0"]
```

Addresses that match these segments (case-insensitive hex comparison) SHALL be considered local context.

### 4.3 Local Context Validation

A conforming implementation MUST verify local context by comparing each segment of the expanded address against the canonical root segments. An address is local only if all 8 expanded segments match.

---

## 5. Cons Cell Primitives

### 5.1 Cell Construction

A conforming implementation MUST provide a cons-like pair constructor:

```text
cons(car, cdr) → { car, cdr }
```

The returned cell MUST be immutable (frozen or equivalent).

### 5.2 Cell Accessors

A conforming implementation MUST provide:

```text
car(cell) → car value
cdr(cell) → cdr value
```

### 5.3 Interpretation

In OMI-CIDR context:

- `car` SHOULD represent the address header, boundary, operator, or control
- `cdr` SHOULD represent the payload, continuation, vector, or body

---

## 6. Delta Law Evaluator

### 6.1 Definition

The delta law evaluator SHALL be defined as:

```
δ_C(x) = (rotl(x, 1) ⊕ rotl(x, 3) ⊕ rotr(x, 2) ⊕ C) & 0xFFFF
```

Where:

- `rotl(x, n)` is a left rotation of a 16-bit value by n bits
- `rotr(x, n)` is a right rotation of a 16-bit value by n bits
- `⊕` is bitwise XOR
- `& 0xFFFF` is a 16-bit mask

### 6.2 v0 Frame Constant

The v0 frame constant SHALL be:

```
C₀ = 0x5A3C
```

An implementation MAY support alternative frame constants derived from operator, prefix, step, stride, or mask, provided the derivation is deterministic.

### 6.3 Period-8 Invariant

A conforming implementation MUST verify that `δ_C` has a period of exactly 8 for any starting value:

```
δ_C⁸(x) = x
```

This MUST hold for at least the following test seeds: `0x0000`, `0xFFFF`, `0x1234`, `0x4321`, `0xABCD`, `0x5A3C`.

### 6.4 Central Inversion Relation

The delta constant `C` SHALL also function as the central inversion mirror constant:

```
Inv_C(x) = x ⊕ C
```

The relation SHALL hold:

```
Inv_C(Inv_C(x)) = x
```

---

## 7. Sexagesimal Notation

### 7.1 Step Value

A sexagesimal step SHALL be encoded as the token `stepN` where `N` is an integer.

The sexagesimal step value `N` MUST be in the range `0..59` inclusive.

Values outside this range MUST be rejected.

### 7.2 Slot Value

A runtime slot SHALL be encoded as the token `slotN` where `N` is an integer.

### 7.3 Valid Strides

The following slot values SHALL be recognized as valid factorial strides:

| Slot | Stride | Interpretation |
|------|--------|---------------|
| `120` | 5! | Sexagesimal / 600-cell vertex layer |
| `720` | 6! | Orientation mirror cycle |
| `5040` | 7! | Master replay ring |

Slot values not in this set MAY be accepted as valid but MUST NOT be treated as factorial strides.

### 7.4 Fractional Ratio

A fractional ratio MAY be derived as:

```
ratio = step / 60
```

This ratio is OPTIONAL and advisory only.

---

## 8. Factorial Runtime Lattice

### 8.1 Factorial Weights

The runtime SHOULD define the following factorial lattice weights:

| Layer | Weight | Interpretation |
|-------|--------|---------------|
| `0!` | 1 | Empty-cons identity / unit frame |
| `1!` | 1 | First scalar normalization |
| `2!` | 2 | Polarity pair (chiral/cardinal) |
| `3!` | 6 | Octahedral 3D selector |
| `4!` | 24 | 24-cell matrix |
| `5!` | 120 | Sexagesimal high-density track |
| `6!` | 720 | Orientation mirror / GC promote sweep |
| `7!` | 5040 | Master replay ring buffer |

### 8.2 Shared Memory

A conforming implementation SHOULD provide a `SharedArrayBuffer(5040 × 8)` or equivalent memory abstraction with 5040 addressable slots of 8 bytes each.

### 8.3 Lifecycle

If a tick counter is provided:

- At `tick % 720 === 0`: a promote sweep MAY be triggered
- At `tick % 5040 === 0`: a hard reset MAY be triggered

The 5040 hard reset MUST clear the memory ring state. The 720 promote sweep MAY prune or compact entries.

---

## 9. Empty-Cons Identity

### 9.1 The Law

A conforming implementation MUST recognize the empty-cons identity law:

```
()! = ()
```

Where `()` represents the empty cons (nil, null, zero-frame) and `()!` represents the factorial closure applied to the empty cons.

### 9.2 Syntactic Distinction

A conforming implementation MUST treat `()` and `()!` as distinct expressions at the syntactic level, even though they evaluate to the same value.

### 9.3 Numeric Counterpart

A conforming implementation MAY also recognize the numeric counterpart:

```
0! = 1
```

### 9.4 Nil-Terminator Token

If the token `0!` appears as a suffix segment in an address or identifier:

- The evaluator SHOULD stop continuation traversal
- The structural memory weight SHOULD be exactly 1
- The CDR payload SHOULD be null or empty
- The CAR metadata SHOULD be preserved

---

## 10. Token Format

### 10.1 Canonical Token Layout

A canonical OMI-CIDR token SHALL follow the layout:

```
<operator>-<address>/<prefix>-0x<opcode>-mask<N>-slot<N>[-step<N>][-<payload>]
```

Where:

| Component | Required | Description |
|-----------|----------|-------------|
| `<operator>` | yes | `Ο` or `ο` |
| `<address>` | yes | 1-8 hextets, may use `--` |
| `<prefix>` | yes | CIDR prefix integer 0..128 |
| `0x<opcode>` | yes | Hex opcode value |
| `mask<N>` | yes | Mask order 0..3 |
| `slot<N>` | yes | Runtime slot number |
| `step<N>` | no | Sexagesimal step 0..59 |
| `<payload>` | no | URL-safe base64 payload |

### 10.2 Opcode Range

Opcode values SHOULD be in the range `0x00..0x3F`.

### 10.3 Mask Range

The mask order `N` SHOULD be `0..3`, where:

| Mask | Polynomial order |
|------|-----------------|
| `0` | Constant |
| `1` | Linear |
| `2` | Quadratic |
| `3` | Cubic |

### 10.4 Base64 Payload

If present, the payload SHOULD be URL-safe base64 (`-` replaces `+`, `_` replaces `/`).

A conforming implementation MUST decode the base64 payload into a `Float32Array`. The decoded payload represents polynomial coefficients or vector data.

---

## 11. Period-8 Prime Ideal Relation

### 11.1 Prime Factor

The delta law's period-8 orbit is linked to the prime factor 73.

A conforming implementation SHOULD recognize 73 as the smallest prime whose decimal expansion has period 8.

### 11.2 Central Inversion Constant

The central inversion constant `0x5A3C` SHALL be used as the default v0 constant.

The selection of `0x5A3C` is not arbitrary. It is derived such that:

- `0x5A3C ⊕ 0x5A3C = 0x0000` (self-inverse under XOR)
- The `2¹⁶` state space splits into exact period-8 orbits under `δ_C`

---

## 12. Error Conditions

A conforming implementation MUST reject the following:

| Condition | Error |
|-----------|-------|
| Empty token | "Empty Token" |
| Missing operator | "Missing Invariant Omicron Operator" |
| Missing opcode | "Missing opcode" |
| Segment overflow ( > 8 expanded hextets) | Thrown from zero-compression |
| Invalid prefix (`N < 0` or `N > 128`) | "CIDR prefix width boundary must be an integer 0..128" |
| Sexagesimal step `N < 0` or `N > 59` | Invalid step |
| Non-local address under `evaluateOmicronTape` | `valid: false` |
| Malformed base64 payload | Undefined (may return null payload) |

---

## 13. Browser Projection

### 13.1 DOM Attributes

A conforming implementation SHOULD use the following `data-*` attributes for browser projection:

```html
data-omi-type="cidr-vertex"
data-omi-astronomy="sexagesimal-digit"
data-omi-operator="cardinal|chiral"
data-omi-phase="chiral-origin|central-mirror"
data-omi-lattice="0-factorial|3-octahedral|7-replay-ring"
data-omi-cell="active-stream|null-terminator"
data-omi-stride="120|720|5040"
data-omi-step="0..59"
data-fixed-point="true"
```

### 13.2 CSSOM Selectors

A conforming implementation SHOULD support CSS attribute selectors for runtime styling:

```css
[data-omi-type="cidr-vertex"] { }
[data-omi-astronomy="sexagesimal-digit"] { }
[data-omi-phase="chiral-origin"] { }
[data-omi-phase="central-mirror"] { }
[id*="-step15"] { }
[id*="-step59"] { }
[id*="-slot720-"] { }
[id*="-slot120-"] { }
[id*="-slot5040-"] { }
[id*="-0x5a3c-"] { }
[id$="-0!"] { }
[data-fixed-point="true"] { }
```

### 13.3 Rendering Constraints

The browser projection layer is a view onto the Omi object model. A conforming implementation MUST NOT require the browser projection layer to evaluate core semantics. The notation, address grammar, and evaluator SHALL remain independent of the display surface.

---

## 14. Implementation Requirements Summary

### 14.1 MUST

- Recognize `Ο` and `ο` as canonical operators
- Parse OMI-CIDR addresses to 8 hextets
- Expand `--` zero compression
- Support prefix lengths `/0` through `/128`
- Recognize `Ο-ffff-127--/48` as canonical local frame
- Validate sexagesimal steps `0..59`
- Validate factorial strides `120`, `720`, `5040`
- Provide `cons`, `car`, `cdr` primitives
- Implement 16-bit `δ_C` evaluator with period-8 verification
- Reject segment overflow
- Reject invalid sexagesimal steps
- Reject malformed CIDR addresses
- Distinguish `()` from `()!` syntactically

### 14.2 SHOULD

- Support `omi-` and `-imo` as readable aliases
- Normalize aliases to canonical Omicron operator form
- Provide `SharedArrayBuffer(5040 × 8)` memory abstraction
- Provide CSSOM projection attributes and selectors
- Expose diagnostics: stride, step, slot, fractional ratio
- Verify period-8 across a range of test seeds
- Use URL-safe base64 for payload encoding

### 14.3 MUST NOT

- Treat `omi-` or `-imo` as canonical machine operators
- Use `?` trigraph patterns as canonical address syntax
- Accept sexagesimal step values outside `0..59`
- Accept more than 8 expanded hextets
- Treat runtime SharedArrayBuffer state as source authority
- Collapse `()` and `()!` into the same syntax

---

## 15. Conformance Tests

A conforming implementation MUST pass the following test categories:

| Category | Tests |
|----------|-------|
| Operator recognition | `Ο` prefix, `ο` prefix, `ο` suffix, `Ο` suffix |
| CIDR parsing | 8-hextet expansion, `--` zero-compression, `/48` local frame, `/128` endpoint |
| Error rejection | Empty token, missing operator, segment overflow, invalid prefix, external address |
| Delta evaluator | Period-8 orbit (multiple seeds), reversibility |
| Sexagesimal | Valid step15/step59, reject step65/slot999, stride validation, payload decode |
| Cons primitives | `cons`/`car`/`cdr` round-trip, immutability, null safety |
| Empty-cons identity | `0!` weight-1 intercept, fixed-point short-circuit, syntactic distinction |
| Central inversion | Reversible bit-flip, gate detection, Float64Array CDR |
| Factorial lattice | Layer weight extraction, fixed-point detection, Horner transformation |
| Browser projection | CSSOM selectors, DOM attributes, event handling |

---

## Appendix A: Reference Implementation Files

The reference implementation that this specification is derived from is located at:

| File | Role |
|------|------|
| `src/omi/omicron-kernel.js` | OMI-CIDR kernel and delta evaluator |
| `src/omi/sexagesimal-kernel.js` | Sexagesimal parsing and stride validation |
| `src/omi/inversion-kernel.js` | Central inversion gate and prime-ideal tracking |
| `src/omi/lisp-kernel.js` | S-expression nil-terminator and empty-cons identity |
| `src/omi/lattice-kernel.js` | Factorial lattice weights and fixed-point short-circuit |
| `public/bidi.html` | Browser projection surface with all kernel wiring |
| `test/omicron-kernel.test.js` | Kernel tests |
| `test/omicron-cidr.test.js` | CIDR-v0 structural tests |
| `test/omicron-cidr-128.test.js` | 128-bit CIDR standard tests |
| `test/omicron-sexagesimal.test.js` | Sexagesimal kernel tests |
| `test/omicron-inversion.test.js` | Central inversion tests |
| `test/lisp-nil.test.js` | Lisp nil-terminator tests |
| `test/factorial-lattice.test.js` | Factorial lattice tests |

## Appendix B: Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-05-29 | Initial specification derived from OMI-WP-v0.1 white paper |
