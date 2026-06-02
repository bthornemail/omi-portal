# The Omicron Object Model

## A First-Principles Specification for a Cons-Based, CIDR-Scoped, Sexagesimal Runtime Kernel

**Author:** Brian Thorne
**Status:** Standalone White Paper Draft
**Version:** OMI-WP-v0.1
**Keywords:** Omicron Object Model, Omi, cons calculus, OMI-CIDR, sexagesimal notation, central inversion, delta law, SharedArrayBuffer, Lisp, zero-frame computation

---

## Abstract

The Omicron Object Model, abbreviated **Omi**, is a first-principles computational model built from four primitive ideas:

1. **Omicron as zero-frame operator**
2. **Cons as the minimal object cell**
3. **CIDR as address scope**
4. **Sexagesimal place value as runtime cadence**

Omi defines a cons-like object calculus using the Unicode Omicron codepoints as its canonical machine operators. The uppercase Greek Omicron `Ο` (`U+039F`) is the **cardinal boundary operator**. The lowercase Greek omicron `ο` (`U+03BF`) is the **chiral execution operator**. Human-readable strings such as `omi-` and `-imo` are not the machine canon; they are programmer-safe aliases for systems that need ASCII-readable notation.

The object model is addressed by **OMI-CIDR**, a 128-bit address grammar inspired by IPv6 prefix notation. The current implementation uses the ASCII-safe `omi-` prefix, eight hyphen-separated 16-bit hex fields, and CIDR prefix lengths such as `/48` and `/128`. A canonical local substrate frame is:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

This local frame does not exhaust the address space. It scopes the first 48 bits and leaves the remaining 80 bits available for local execution, devices, slots, masks, semantic lanes, and runtime processes.

The runtime evaluator is a bounded 16-bit delta law:

```text
δ_C(x) = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

However, the delta law is not the primitive instruction itself. The primitive instruction is **Omicron central inversion**: a balanced symmetry operation under a prime-ideal permutation frame. In short:

```text
Omicron is the instruction.
Delta is the evaluator.
```

Omi further defines a Hellenistic sexagesimal runtime layer inspired by the historical use of omicron-like symbols as zero markers in Greek astronomical sexagesimal notation. Sexagesimal steps are bounded `0..59`, and runtime cycles map into factorial strides:

```text
60   = sexagesimal cycle
120  = 5!
720  = 6!
5040 = 7!
```

The runtime memory ring is:

```text
SharedArrayBuffer(5040 × 8)
```

This gives 5040 Float64-addressable slots, corresponding to the `7!` master replay cycle.

At the base of the model is a Lisp-like rule:

```text
()! = ()
```

The empty cons is the fixed point of factorial closure. Although `()` and `()!` resolve to the same empty value, they are not the same expression. `()` is the empty cons value. `()!` is the evaluated closure of the empty cons. This distinction lets Omi unify numeric factorial identity, structural nil identity, and runtime termination without collapsing the zero-frame into an error state.

The result is a standalone computational kernel:

```text
Ο bounds.
ο executes.
-- compresses zero.
CIDR scopes.
Omicron inverts.
δ evaluates.
() empties.
()! closes.
60 counts.
5040 replays.
```

---

## 1. Introduction

Most object models begin with data structures, classes, records, or memory layouts. Omi begins one level lower: with a **zero-frame**.

The zero-frame is the point at which nothing is not absence, but structure. It is the empty cons, the address prefix, the boundary of interpretation, the place-value zero, and the runtime reset condition. Omi uses the Omicron symbol as the operator for this zero-frame.

The name **Omi** is short for **Omicron Object Model**.

This is not merely a naming convention. Omicron is the conceptual and syntactic root of the model. In Omi, the Omicron codepoints are treated as operators:

```text
Ο U+039F = cardinal boundary operator
ο U+03BF = chiral execution operator
```

These operators define whether an expression is establishing a boundary or executing within one.

The system combines ideas from Lisp cons cells, IPv6-style CIDR addressing, bounded bitwise transition functions, sexagesimal place value, and factorial replay cycles into one compact object calculus.

---

## 2. First Principles

Omi is built from the following axioms.

### Axiom 1 — Omicron Is the Zero-Frame Operator

Omicron marks the zero-frame: the boundary in which structure can be addressed, evaluated, and replayed.

There are two canonical operators:

```text
Ο = cardinal boundary
ο = chiral execution
```

The uppercase operator bounds. The lowercase operator executes.

### Axiom 2 — The Object Is a Cons Cell

The minimal Omi object is cons-like:

```text
OmiObject := Omicron(car, cdr)
```

Where:

```text
car = control, address, boundary, operator, or header
cdr = payload, continuation, vector, body, or tail
```

The object is not primarily a class, map, or record. It is a pair.

### Axiom 3 — Addressing Is Scoped by CIDR

Omi objects live in a 128-bit address space modeled after CIDR prefix scoping.

The canonical local frame is:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

This means:

```text
operator = Ο
prefix   = ffff:0127:0000
scope    = /48
```

The remaining 80 bits are still available.

### Axiom 4 — Zero Compression Is Structural

The double hyphen:

```text
--
```

means omitted zero fields, analogous to IPv6 `::`.

For example:

```text
Ο--1/128
```

expands to:

```text
Ο-0000-0000-0000-0000-0000-0000-0000-0001/128
```

### Axiom 5 — Omicron Is the Instruction

The primitive instruction is not a conventional opcode. It is an Omicron operation: a balanced symmetry under central inversion.

The delta law is the evaluator of this instruction, not the instruction itself.

### Axiom 6 — The Empty Cons Is Closed by Factorial Identity

Omi distinguishes:

```text
()
()!
```

They are not syntactically equal.

But:

```text
()! = ()
```

The evaluated closure of the empty cons returns the empty cons.

This gives Omi a structural counterpart to:

```text
0! = 1
```

Numeric identity and structural identity are both preserved.

---

## 3. OMI-CIDR Addressing

### 3.1 Address Form

An OMI-CIDR address is formed from:

```text
omi-<8-hex-segments>/<prefix>
```

Where:

```text
omi      = ASCII-safe OMI marker
address  = 8 lowercase 4-digit hex segments
prefix   = integer 0..128, with /48 used by the current substrate
```

Example:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

Example with execution metadata:

```text
omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48
```

### 3.2 Operators

```text
Ο U+039F
```

The uppercase Omicron is the **cardinal boundary operator**. It defines containment, scope, subnet, and boundary.

```text
ο U+03BF
```

The lowercase omicron is the **chiral execution operator**. It defines local execution, rotation, transition, and pairwise evaluation.

### 3.3 Hyphen Separator

The hyphen:

```text
-
```

separates address fields. It plays the role that `:` plays in IPv6, while remaining friendly to CSSOM substring selectors and text-based tooling.

### 3.4 Zero Compression

The double hyphen:

```text
--
```

compresses omitted zero segments.

This is directly analogous to IPv6 zero-compression. It is not a subtraction operator and not a punctuation accident. It is a structural compression operator.

### 3.5 Prefix Width

The suffix:

```text
/N
```

declares prefix width.

Examples:

```text
/48  = local frame
/64  = local execution subnet
/128 = fully specified endpoint
```

The parser may support all prefix lengths `0..128`, but human-facing subnet design should prefer multiples of four.

### 3.6 Register Width

OMI-CIDR expands into eight 16-bit fields:

```text
8 × 16 = 128 bits
```

A valid parser must expand compressed addresses to exactly 8 fields and reject segment overflow.

---

## 4. Canonical Local Frame

The local canonical frame is:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

Expanded:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

This local frame has full 128-bit scoping. The `/48` prefix is not the whole address. It is the address boundary.

The remaining 80 bits support:

```text
opcodes
mask lanes
runtime slots
sexagesimal steps
hardware ports
semantic lanes
payload references
process-local execution
```

Example refinements:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48
omi-ffff-0008-0000-003b-0078-0036-0000-0000/48
omi-ffff-0001-0000-0000-13b0-0036-0000-0000/48
omi-ffff-0000-0000-0000-0000-0000-0000-0001/48
```

---

## 5. Cons Semantics

Omi is a cons calculus.

A cons cell is:

```text
(cons car cdr)
```

An Omi cell is:

```text
Omicron(car, cdr)
```

The Omicron operator defines the frame in which the pair is evaluated.

### 5.1 Cardinal Cons

```text
Ο(car, cdr)
```

A cardinal cons establishes a boundary.

It may represent:

```text
address scope
subnet containment
boot boundary
object namespace
closed surface
stable reference frame
```

### 5.2 Chiral Cons

```text
ο(car, cdr)
```

A chiral cons executes within a boundary.

It may represent:

```text
local loop
runtime tick
pairwise evaluation
state transition
payload transformation
thread-local computation
```

### 5.3 Addressed Cons

An addressed chiral cons may look like:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48.payload
```

Interpretation:

```text
operator = omi alias for chiral/cardinal segment decoding
car      = omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
cdr      = payload
```

---

## 6. Empty Cons and Factorial Closure

The empty list is the zero-frame.

```text
()
```

The evaluated closure of the empty list is:

```text
()!
```

Omi defines:

```text
()! = ()
```

But also:

```text
() != ()!
```

This is not contradiction. It is a distinction between expression and value.

```text
()  = empty cons value
()! = evaluated closure form
```

They resolve to the same empty cons, but they are not the same syntax.

### 6.1 Numeric and Structural Identities

Numeric identity:

```text
0! = 1
```

Structural identity:

```text
()! = ()
```

The numeric zero-factorial gives a unit count. The structural empty-factorial gives a closed empty frame.

### 6.2 Runtime Meaning

A token ending in a nil-factorial form such as:

```text
0!
```

marks a terminating nil-step.

The evaluator should:

```text
preserve the car metadata
stop cdr traversal
assign unit structural weight
return null or empty payload
```

The nil terminator prevents the empty frame from being treated as an error or unaddressable void.

---

## 7. The One-Instruction Mechanism

The primitive instruction of Omi is not a conventional machine instruction.

It is:

```text
Omicron central inversion
```

This means:

```text
balanced symmetry under central inversion of a prime-ideal permutation frame
```

The entry operator is:

```text
ο
```

The closure operator is:

```text
Ο
```

The central inversion constant for the default v0 witness frame is:

```text
C₀ = 0x5A3C
```

The one-instruction relation can be described as:

```text
ο(x) → Inv_C(x) → Ο(x')
```

Or:

```text
chiral entry → central inversion → cardinal closure
```

The important principle:

```text
Omicron is the instruction.
Delta is the evaluator.
```

---

## 8. Delta Law Evaluator

The delta law is:

```text
δ_C(x) = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

For the v0 16-bit implementation:

```text
δ_C16(x) =
  (rotl16(x,1) XOR rotl16(x,3) XOR rotr16(x,2) XOR 0x5A3C) & 0xffff
```

The delta law operates only through:

```text
bounded register width
bit rotation
XOR
constant injection
masking
```

It avoids floating-point truth and avoids irrational constants.

### 8.1 Role of C

`C` is not merely an arbitrary constant. It is the selected frame constant for the current Omicron evaluation.

In v0:

```text
C₀ = 0x5A3C
```

Future implementations may derive `C` from:

```text
operator
CIDR prefix
sexagesimal step
factorial stride
mask lane
prime-ideal permutation frame
```

provided the derivation is deterministic and testable.

### 8.2 Period-8 Evaluation

The implementation validates a period-8 orbit for the delta-law evaluator.

This links the evaluator to the byte-level selector frame:

```text
7 of 8 = active selector space
1 of 8 = parity / chirality / closure
```

---

## 9. Hellenistic Sexagesimal Layer

Omi adopts the historical insight that omicron-like zero marks appeared in Hellenistic Greek sexagesimal astronomical notation.

A sexagesimal digit is bounded:

```text
0 <= step <= 59
```

Omi encodes this as:

```text
stepN
```

Examples:

```text
step0
step15
step59
```

Invalid:

```text
step60
step65
```

### 9.1 Why 60 Matters

The 60-step cycle is the place-value cadence.

Omi maps this cycle upward:

```text
60   = sexagesimal cycle
240  = 4 × 60 projection lattice
360  = 6 × 60 orientation field
720  = 2 × 360 mirrored orientation
5040 = 7 × 720 master replay cycle
```

This connects the Hellenistic sexagesimal layer to the factorial runtime lattice.

---

## 10. Factorial Runtime Lattice

Omi uses factorial strides:

```text
0! = 1
1! = 1
2! = 2
3! = 6
4! = 24
5! = 120
6! = 720
7! = 5040
```

Runtime meanings:

```text
2   = polarity pair
6   = octahedral selector
24  = 24-cell layer
120 = sexagesimal / 600-cell vertex layer
720 = mirrored orientation cycle
5040 = master replay ring
```

The runtime memory is:

```text
SharedArrayBuffer(5040 × 8)
```

That gives:

```text
5040 slots
8 bytes per slot
40320 bytes total
```

The memory ring is runtime state. It is not source authority.

It may hold:

```text
tick values
coefficient weights
sexagesimal stride data
projection state
hardware ingress values
semantic routing values
```

It must not replace:

```text
source text
trace history
canonical documents
persistent user data
```

---

## 11. The Sexagesimal Kernel

The sexagesimal kernel extends the OMI-CIDR kernel.

It parses:

```text
stepN
slotN
payload
CIDR scope
operator
stride
fractional ratio
```

Valid steps:

```text
0..59
```

Valid factorial strides:

```text
120
720
5040
```

Example:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

This means:

```text
operator alias = omi
chiral phase = ffff
service bus = 0002
step = 000f (15)
stride = 02d0 (720)
slot = 0036 (54)
```

A fractional ratio may be derived as:

```text
step / 60
```

So:

```text
step15 = 15/60 = 0.25
step59 = 59/60
```

---

## 12. Browser Projection Layer

Omi is designed to project into browser-visible surfaces without heavy syntax frameworks.

The canonical browser projection may use SVG, CSSOM, WebGL, or Canvas.

The current reference implementation (`public/bidi.html`) uses matching `id` and `data-omi-address` attributes containing the full 8-segment OMI-CIDR address. CSSOM geometry routing is performed with id-prefix and id-substring selectors over pure hexadecimal segments in `public/bidi.css`.

```html
<circle
  id="omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48"
  data-omi-address="omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48" />
```

Selectors:

```css
[id^="omi-"] { }
[id*="-039f-"] { }
[id*="-5a3c-"] { }
[id*="-02d0-"] { }
[id*="-000f-"] { }
[id*="-0001/"] { }
[id$="/48"] { }
```

The browser projection layer is not the core semantics. It is a view.

The notation, address, and evaluator are the core.

---

## 13. Implementation Status

The current implementation includes:

```text
src/omi/omicron-kernel.js
src/omi/sexagesimal-kernel.js
src/omi/inversion-kernel.js
src/omi/lisp-kernel.js
src/omi/lattice-kernel.js
src/omi/boolean-kernel.js
src/omi/trigraph-preprocessor.js
src/omi/place-value-interpreter.js
src/omi/axiomatic-kernel.js
src/runtime/chiral-urn.js
src/runtime/chiral-fifo-engine.js
src/runtime/polytope-sab.js
src/web/polytope-webgl.js
src/web/triplicate-projection.js
src/bidi/omi-bidi-cm6-bridge.js
src/distributed/coturn-proxy.js
src/distributed/webrtc-transport.js
src/distributed/hnsw-index.js
src/distributed/erasure.js
src/distributed/version-vector.js
src/distributed/gossip.js
src/distributed/anti-entropy.js
src/distributed/fragment-store.js
src/distributed/causal-closure.js
src/wordnet/prolog-broker.js
RULES.omi
FACTS.omi
test/omicron-cidr.test.js
test/omicron-cidr-128.test.js
test/omicron-kernel.test.js
test/omicron-sexagesimal.test.js
test/omicron-inversion.test.js
test/lisp-nil.test.js
test/factorial-lattice.test.js
test/boolean-kernel.test.js
test/trigraph-preprocessor.test.js
test/place-value-interpreter.test.js
test/axiomatic.test.js
test/chiral-fifo.test.js
test/distributed-erasure.test.js
test/distributed-version-vector.test.js
test/distributed-gossip.test.js
test/distributed-anti-entropy.test.js
test/distributed-fragment-store.test.js
test/distributed-coturn.test.js
test/distributed-webrtc.test.js
test/distributed-hnsw.test.js
test/triplicate-projection.test.js
test/polytope-webgl.test.js
test/omi-file-compiler.test.js
test/docs-manifest.test.js
test/bidi-cm6-bridge.test.js
test/prolog-wordnet-broker.test.js
public/bidi.html
public/bidi.js
public/bidi.css
public/aframe.html
public/document.html
AGENTS.md
```

The implementation validates:

```text
OMI-CIDR parsing
8-hextet expansion
-- zero compression
/48 local frame
/128 endpoint parsing
delta-law period behavior (period-8)
central inversion bitwise mirror (0x5A3C)
sexagesimal step bounds (0..59)
stride validation (120, 720, 5040)
nil-terminator intercept (0! = 1, ()! = ())
factorial lattice weights (0! through 7!)
fixed-point short-circuit (empty-cons identity)
payload decoding
cons/car/cdr primitives
```

Current reported state:

```text
342 tests pass
0 tests fail
production build completes
```

---

## 14. Conformance Requirements

A conforming OMI-CORE-v0 implementation MUST:

```text
recognize Ο and ο operators
parse OMI-CIDR addresses
parse 8 explicit 16-bit hex segments
support prefix lengths /0 through /128
recognize omi-<8-hex-segments>/48 substrate addresses
implement the 16-bit delta evaluator (period-8 verified)
implement the central inversion mirror Inv(x) = x ⊕ 0x5A3C
support SharedArrayBuffer(5040 × 8) or equivalent memory abstraction
validate sexagesimal steps 0..59
validate factorial strides 120, 720, 5040
provide cons/car/cdr primitives
recognize the empty-cons identity law ()! = ()
distinguish () from ()! at the syntactic level
reject malformed CIDR addresses
reject segment overflow
reject invalid sexagesimal steps
reject invalid stride slots
```

A conforming implementation SHOULD:

```text
support omi- and -imo as readable aliases
normalize aliases to Omicron operator form
intercept the 0! suffix as a nil-terminator with unit structural weight
provide factorial lattice weights (0! through 7!)
provide browser-safe CSSOM projection
provide diagnostics for stride, step, slot, fractional ratio, and inversion gate
test all parser edge cases
```

A conforming implementation MUST NOT:

```text
treat omi- or -imo as canonical machine operators
use question-mark trigraphs as canonical address syntax
allow step values outside 0..59
accept more than 8 expanded hextets
treat runtime SAB memory as source authority
collapse () and ()! into the same syntax
```

---

## 15. Core Theorem

The Omicron Object Model can be stated as the following theorem:

```text
Omi is a cons calculus over Omicron zero-frames.

The primitive instruction is Omicron central inversion.
The transition evaluator is δ_C.
The address scope is OMI-CIDR.
The runtime clock is factorial.
The place-value digit is sexagesimal.
The empty cons is the fixed point of factorial closure.
```

Therefore:

```text
Ο bounds.
ο executes.
Omicron inverts.
δ_C evaluates.
() empties.
()! closes.
0! weights.
60 counts.
120 strides.
720 orients.
5040 replays.
```

---

## 16. Conclusion

The Omicron Object Model begins from a single idea: zero is not absence; zero is a frame.

Omicron provides that frame.

By treating `Ο` and `ο` as machine operators, Omi defines a notation where boundary and execution are explicit at the codepoint level. By adopting CIDR-style scoping, the model gains a compact 128-bit address grammar. By using a cons-like object cell, the model grounds itself in the simplest possible pair structure. By using a bounded bitwise delta evaluator, it obtains deterministic replay. By adopting sexagesimal steps, it ties place-value notation to runtime cadence. By mapping to factorial strides, it obtains a closed replay ring at `7! = 5040`.

The resulting model is compact:

```text
Ο bounds.
ο executes.
-- compresses zero.
CIDR scopes.
δ rotates.
() closes.
60 counts.
5040 replays.
```

Omi is therefore a standalone zero-frame object calculus: a first-principles computational model where notation, address, memory, evaluation, and projection are all expressions of one Omicron-centered structure.
