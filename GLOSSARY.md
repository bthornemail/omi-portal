# OMI Protocol Glossary

This glossary defines the shared vocabulary for OMI Portal and the Omicron Object Model.

OMI terms are grouped around one central pattern:

```text
OMI pointer → rule → kernel → test → projection
```

An OMI object is not only a string, node, packet, file, or visual element. It is an addressable state with a validation rule and a replay path.

---

## 1. Core Concepts

### OMI

**OMI** means **Omicron Object Model**.

It is a canonical object-addressing layer for browser surfaces, memory surfaces, packet surfaces, graph surfaces, semantic surfaces, and visual protocol projections.

OMI unifies:

```text
addressing
validation
runtime state
semantic meaning
visual projection
telemetry
```

### OMI Pointer

An **OMI pointer** is a reference address in canonical form:

```text
omi-<S0>-<S1>-<S2>-<S3>-<S4>-<S5>-<S6>-<S7>/<prefix>
```

Each `S` segment is a 16-bit hexadecimal word.

Together:

```text
8 × 16 bits = 128 bits
```

An OMI pointer can identify:

```text
a packet
a rule
a DOM element
a JSON Canvas node
a memory receipt
a symbolic fact
a QEMU clock state
a telemetry event
a Code16K or JABCode visual frame
```

### `omi-*`

The **`omi-*` family** is the hyphen-delimited identity-token family used by:

```text
DOM ids
data-omi attributes
CSSOM selectors
packet-like routing metadata
JSON Canvas node ids
telemetry records
rule pointers
```

Example:

```text
omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48
```

### OMI Address Frame

An **OMI address frame** is the full 128-bit instruction word represented as eight 16-bit segments.

```text
S = [S0, S1, S2, S3, S4, S5, S6, S7]
```

The same frame can be treated as:

```text
a lexer input
an IPv6 source address
a replay receipt source
a symbolic payload envelope
a visual selector target
```

### Prefix Scope

The suffix after `/` is the OMI prefix scope.

Common scopes:

| Prefix | Meaning                                         |
| -----: | ----------------------------------------------- |
|  `/48` | Canonical local runtime frame                   |
|  `/80` | Rule-family or ABI boundary                     |
|  `/96` | Gateway, translation, or mapped-prefix boundary |
| `/112` | Narrow rule/register boundary                   |
| `/128` | Exact object pointer                            |

### Canonical Local Context Root

The canonical local context root is:

```text
omi-ffff-127-0-0-1
```

This is the OMI spelling of IPv4-mapped loopback:

```text
::ffff:127.0.0.1
```

### Deprecated Shorthand

The older shorthand:

```text
omi-8-127-0-0-1
```

is accepted for compatibility and normalized to:

```text
omi-ffff-127-0-0-1
```

### CIDR Projection

**CIDR projection** is the use of IP-style prefix containment as a route-table, subtree, and rule-boundary language for OMI atoms.

An OMI pointer can therefore behave like both:

```text
an object id
and
a prefix-addressed route
```

---

## 2. Operators and Delimiters

### Omicron

**Omicron** is the name-family behind the OMI operator space.

OMI uses two important Greek forms:

| Symbol | Codepoint | Role                       |
| ------ | --------: | -------------------------- |
| `ο`    |    U+03BF | Chiral execution operator  |
| `Ο`    |    U+039F | Cardinal boundary operator |

### Chiral Operator `ο`

The lowercase omicron `ο` is the chiral execution operator.

In the canonical quadratic lexer, its delimiter is:

```text
0x03BF
```

### Cardinal Operator `Ο`

The uppercase omicron `Ο` is the cardinal enclosure or closure operator.

In the canonical quadratic lexer, its delimiter is:

```text
0x039F
```

### CBOS

**CBOS** means **Chiral/Cardinal Boundary Operator Surface**.

The CBOS pair gives OMI a structural opening/closing logic:

```text
0x03BF  → chiral delimiter
0x039F  → cardinal delimiter
```

### Empty Cons Identity

The expression:

```text
()! = ()
```

means the empty cons execution closes to itself.

The distinction:

```text
() ≠ ()!
```

preserves the difference between a value and an execution form.

---

## 3. Binary Quadratic Lexer

### Binary Quadratic Meta-Mask Lexer

The **Binary Quadratic Meta-Mask Lexer** validates fixed-width instruction words as points on an algebraic surface.

It is governed by:

```text
Q(S) = 0  → valid instruction
Q(S) > 0  → malformed instruction
```

### `Q(S)`

`Q(S)` is the quadratic error function over the eight-segment OMI instruction word.

It combines:

```text
E_var   → variable coherence error
E_const → constant alignment error
```

So:

```text
Q(S) = E_var + E_const
```

### `E_var`

`E_var` verifies that the repeated `LL` selector is coherent across the frame.

```text
L0 = S0 >> 8
L3 = S3 & 0x00FF
L4 = S4 & 0x00FF
L7 = S7 >> 8
```

The coherence rule is:

```text
L0 = L3 = L4 = L7
```

### `E_const`

`E_const` verifies the fixed structural delimiters:

```text
S0 low byte = 0x00
S1 = 0x03BF
S3 high byte = 0x2B
S4 high byte = 0x2F
S6 = 0x039F
S7 low byte = 0xFF
```

### Free Variables

The fields:

```text
S2 = NNNN
S5 = MMMM
```

are free payload variables.

They do not contribute to `Q(S)`.

Once the frame is valid, they can carry:

```text
memory slots
symbolic payloads
barcode traversal data
clock state
neural state
network state
```

---

## 4. Delta, Orbit, and Fano Terms

### Δ_C

`Δ_C` is the Delta Law transition function:

```text
Δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

It is the core bitwise transition law used by OMI orbit logic.

### Canonical Inversion Constant

The canonical 16-bit OMI inversion constant is:

```text
C = 0x5A3C
```

### Delta Law Signature

The 64-bit eBPF/XDP signature pipeline uses a related Delta Law signature form:

```text
rotl1 ⊕ rotl3 ⊕ rotr2 ⊕ 0x1337C0DE
```

### Fano Plane

The **Fano plane** is the seven-point projective plane:

```text
PG(2,2)
```

In OMI, `LL` values from `0x01` through `0x07` identify Fano selector points.

### Fano Point

A **Fano point** is one of the seven projective selector positions used to bind instruction rays, scheduling phases, and symbolic relations.

### Fano Lottery Bound

The **Fano lottery bound** is the maximum number of Δ_C steps required to resolve an orbit intersection:

```text
Steps_max = 15
```

This comes from:

```text
2 × period 8 − 1 = 15
```

### Orbit Lexer

The **orbit lexer** extends the quadratic lexer.

The quadratic lexer proves the frame envelope:

```text
Q(S) = 0
```

The orbit lexer proves bounded projective motion:

```text
fano_intercept(N, M, C) ≥ 0
```

---

## 5. Addressing and Network Terms

### IPv6 Source Address Frame

OMI can treat an IPv6 source address as the 128-bit instruction frame.

```text
IPv6 source address → uint16[8] → OMI frame
```

### Wire Profile

The **wire profile** defines how packet bytes map into OMI segment space.

In Ethernet + IPv6 framing, the IPv6 source address begins at byte offset:

```text
0x16
```

### NAT64

**NAT64** is an IPv6-to-IPv4 translation mechanism.

The well-known NAT64 prefix is:

```text
64:ff9b::/96
```

In OMI, this may be represented as an optical/browser address boundary:

```text
iframe id="omi-64:ff9b::/96"
```

### Embedded IPv4

An **embedded IPv4** address is stored in the final 32 bits of a NAT64 address.

```text
first 96 bits → NAT64 prefix
last 32 bits  → IPv4 address
```

### WAN Telemetry

**WAN telemetry** is the OMI runtime layer that measures propagation between tunnel and edge nodes.

It may include:

```text
HTTP round-trip time
packet validation latency
ping latency
packet loss
availability
SSE stream state
```

### SSE

**SSE** means **Server-Sent Events**.

OMI uses SSE streams for live browser telemetry surfaces such as WAN metrics and packet status.

---

## 6. eBPF and Kernel Terms

### eBPF

**eBPF** is a Linux kernel execution environment for safe, verified programs.

In OMI, eBPF is used to validate or sign packets before user-space allocation.

### XDP

**XDP** means **eXpress Data Path**.

It is a high-performance eBPF hook at the network driver boundary.

### XDP Gate

An **XDP gate** is an eBPF program that decides whether a packet should pass, drop, or be redirected.

Common outcomes:

```text
XDP_PASS
XDP_DROP
XDP_TX
```

### eBPF/XDP Signature Gate

The **eBPF/XDP signature gate** computes packet signatures using the Delta Law and records validated packet counts in a BPF telemetry map.

### BPF Map

A **BPF map** is a kernel-space data structure used to share state between an eBPF program and user space.

In OMI, BPF maps may carry:

```text
packet counters
signature statistics
telemetry snapshots
cluster verification state
```

### Cluster Signature Gateway

The **Cluster Signature Gateway** is the user-space bridge between eBPF maps and OMI runtime memory.

It mirrors kernel-space Delta Law signatures using JavaScript `BigInt` and can synchronize results into SharedArrayBuffer-backed telemetry.

---

## 7. Memory and Runtime Terms

### SharedArrayBuffer

A **SharedArrayBuffer** is a shared memory block used for concurrent runtime state.

OMI uses several SAB shapes.

### `SharedArrayBuffer(128)`

A 128-byte pre-header or state table used by small register and pre-header surfaces.

### `SharedArrayBuffer(5040 * 8)`

A factorial replay ring used for sequencing, receipts, BiDi bridge state, and timeline slots.

```text
5040 slots × 8 bytes = 40320 bytes
```

### Factorial Replay Ring

The **factorial replay ring** is the 5040-slot memory ring.

```text
5040 = 7!
```

It records bounded OMI execution receipts.

### Receipt

A **receipt** is a packed 64-bit runtime proof record.

Canonical shape:

```text
provenance:16 | steps:8 | LL:8 | NN:16 | MM:16
```

### Provenance

**Provenance** is the upper metadata field in a receipt.

It identifies epoch, source, or runtime origin.

### Epoch

An **epoch** is a wraparound counter for the replay ring.

It prevents silent overwrite ambiguity when the 5040-slot ring cycles.

### 720 Promote Sweep

The **720 promote sweep** is a lifecycle boundary for pruning, promoting, or reclassifying volatile state.

```text
720 = 6!
```

### 5040 Hard Reset

The **5040 hard reset** is the full replay-ring boundary.

```text
5040 = 7!
```

It marks a complete cycle through the master Fano permutation space.

---

## 8. Lisp and File Terms

### `*.omi` File

An **`.omi` file** is a dual-envelope binary-to-text container.

It uses:

```text
car → header/pre-header/control side
cdr → payload/remainder/vector side
```

### `car`

`car` is the header side of an OMI transit cell.

It may carry:

```text
route
byte order
polarity
control metadata
```

### `cdr`

`cdr` is the payload side of an OMI transit cell.

It may carry:

```text
remainder
vector data
semantic body
binary payload
```

### Cons

A **cons** is the paired cell structure:

```text
(car . cdr)
```

In OMI, cons logic can map into memory, syntax, geometry, and page framing.

---

## 9. Object Surfaces

### DOM

The **DOM** is the browser runtime element tree.

In OMI, DOM elements may carry OMI pointers as `id` values or dataset attributes.

### CSSOM

The **CSSOM** is the browser selector and style-rule surface.

OMI uses CSSOM selectors to project protocol state visually.

Example:

```css
[id$="-00eb-0066/112"] {
  stroke: #ffaa00;
}
```

### JSDOM

**JSDOM** is a server/test mirror for DOM and CSSOM semantics.

It is useful for test environments but is not required as a runtime dependency.

### JSON Canvas

**JSON Canvas** is a graph serialization surface for OMI nodes, compiled POS atoms, WordNet atoms, and visual protocol projections.

### A-Frame

**A-Frame** is a 3D GUI surface used for WordNet, Prolog, semantic, or geometric projections.

### CodeMirror 6

**CodeMirror 6** is a text transaction surface used for BiDi, DataView, and editor bridge experiments.

### BiDi Bridge

The **BiDi bridge** links bidirectional text/editor state with OMI memory and visual surfaces.

---

## 10. Barcode, Optical, and Page Terms

### Code16K

**Code16K** is a stacked linear barcode family.

In OMI, Code16K can frame document headers, state summaries, or OMI page boundaries.

### JABCode

**JABCode** is a color matrix barcode family.

In OMI, JABCode can frame document body state or chromatic runtime payloads.

### Optical Page Frame

An **optical page frame** is a web page structured so that its header/body/boundary can be scanned or validated as protocol state.

Example pattern:

```text
Code16K DOM header
JABCode DOM body SVG
NAT64 iframe boundary
```

### Page Framer

The **Page Framer** is the OMI canvas kernel that binds Code16K, JABCode, and NAT64 iframe boundaries into a single page-level protocol envelope.

---

## 11. Semantic and WordNet Terms

### WordNet

**WordNet** is a lexical database of synsets and semantic relations.

OMI uses WordNet-style facts as stable semantic addressing material.

### Synset

A **synset** is a set of synonymous terms representing a concept.

### Synset Centroid

A **synset centroid** is a deterministic semantic identity derived from a WordNet lookup and relation facts.

### 5-Cell Active Cells

The **5-cell active cells** form a base semantic simplex.

Typical roles:

```text
lemma
hypernym
hyponym
part/whole
opposition
```

### 24-Cell Active Cells

The **24-cell active cells** represent expanded synset facets used for stable semantic addressing.

### Prolog WordNet Broker

The **Prolog WordNet broker** is a deterministic JavaScript fact broker over local `vendor/prolog/wn_*.pl` files.

It is not a live Prolog runtime in v1.

### Fano Token

A **Fano token** is an `omi-fano-*` packet-style token that binds timing point, storage tier, WordNet operator, synset ids, features, slot, and payload.

### Symbolic Inference Engine

The **symbolic inference engine** performs direct identity unification and transitive Horn-clause resolution over packed OMI truth rows.

---

## 12. Channels and Ports

### FS

**FS** means **File Separator** or **Frame/Storage surface**.

It is associated with open content classes and file-like state.

### GS

**GS** means **Group Separator** or **Graph/Global surface**.

It is associated with grouped operators and global graph state.

### RS

**RS** means **Record Separator** or **Relation/Control surface**.

It is associated with predicate and control descriptors.

### US

**US** means **Unit Separator** or **Unit/Codepoint surface**.

It is associated with terminal descriptors and small unit states.

### POS Graph Channel

The **POS graph channel** is the preserved graph transform mapping for part-of-speech structures.

### OMI Port Projection

The **OMI port projection** maps UPOS classes into FS/GS/RS/US-style surfaces for canonical metadata addressing.

---

## 13. Tetragrammaton and Scheduling Terms

### Tetragrammaton

The **Tetragrammaton** is OMI's four-role structural node model:

```text
Text
Link
Group
File
```

It maps typed object roles into a Fano-plane and base-60 scheduling space.

### TypedOmiNode

A **TypedOmiNode** is an OMI node with a structural type such as:

```text
Text
Link
Group
File
```

### Tetragrammaton Scheduler

The **Tetragrammaton Scheduler** sequences TypedOmiNodes across:

```text
7 Fano points
12 regular divisors of 60
```

### Base-60 Chronometer

The **base-60 chronometer** is the sexagesimal scheduling layer.

One hour can be divided into clean regular sections:

```text
60, 30, 20, 15, 12, 10, 6, 5, 4, 3, 2, 1 minutes
```

### Regular Divisors of 60

The regular divisors of 60 are:

```text
1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60
```

These form OMI's cron scheduling basis.

---

## 14. QEMU and Clock Terms

### QEMU

**QEMU** is a machine emulator and virtualizer.

OMI uses QEMU concepts for hardware modeling, SoftMMU testing, clock trees, and multi-architecture verification.

### QOM

**QOM** means **QEMU Object Model**.

It is QEMU's object system for devices, buses, clocks, and other machine components.

### TYPE_CLOCK

**TYPE_CLOCK** is QEMU's clock object type.

OMI models it as an addressable clock-tree state.

### QEMU Clock Period

A QEMU clock state is represented by an integer period.

The unit is:

```text
2^-32 nanoseconds
```

### Gated Clock

A **gated clock** is inactive.

In QEMU clock modeling:

```text
period = 0
```

means the clock is gated or disabled.

### Clock Tree

A **clock tree** is a network of clock sources, device inputs, and device outputs.

OMI maps clock-tree state into validated clock objects and Canvas presets.

---

## 15. Neural, HGV, and Polytopic Terms

### HGV

**HGV** means **Hybrid Vector Gauge**.

It is the OMI layer connecting barycentric event selection to float allocation and perceptron-style activation.

### Layer 9

**Layer 9** is the 2-of-5 barycentric event layer.

It uses five bits with exactly two active bits.

### 2-of-5 Barycentric Event

A **2-of-5 barycentric event** is a five-bit vector with exactly two active positions.

There are ten canonical positions.

### Layer 10

**Layer 10** is the numeric allocation layer.

It may allocate float32, binary64, BCD, or related numeric state.

### binary64

**binary64** is IEEE 754 double-precision floating point.

It has:

```text
1 sign bit
11 exponent bits
52 explicit significand bits
53 bits of significand precision including hidden bit
bias = 1023
```

### HGV Perceptron

The **HGV Perceptron** maps Layer 9 events into Layer 10 binary64 allocation and then into step or sigmoid activation output.

### Polytopic Neural Kernel

The **Polytopic Neural Kernel** expands `n=6` truth tables into geometric projections such as:

```text
64-row truth table
5-cell
24-cell
600-cell
120-cell count
```

---

## 16. Precision and Notation Terms

### binary16

**binary16** is IEEE 754 half precision.

OMI uses it in canvas color and compact precision controllers.

### binary32

**binary32** is IEEE 754 single precision.

OMI uses float32-style allocation in some Layer 10 numeric states.

### binary64

**binary64** is IEEE 754 double precision.

OMI uses it in HGV perceptron and clock/numeric state models.

### binary256

**binary256** is octuple precision.

OMI uses binary256-style exponent handling in octuple and bit-sliced precision kernels.

### Wallis Multiple

A **Wallis multiple** is an integer-side positional multiplier used in OMI's notation layer.

It is associated with powers or multiples of 60 on the left side of a positional boundary.

### Neugebauer Fraction

A **Neugebauer fraction** is a base-60 fractional notation term.

OMI uses it for semicolon/comma positional fractions such as:

```text
29;31,50
```

### 59 Ceiling

The **59 ceiling** is the rule that base-60 fractional components must not exceed 59.

### Hex-N to Hex-(N-1)

**Hex-N to Hex-(N-1)** is the canonical safe wording for current/prior hexadecimal step encapsulation.

Avoid embedding literal `-0x` notation in production selector grammar or stylesheet comments.

---

## 17. Consumer and Provider Terms

### Consumer

A **consumer** reads, receives, views, scans, or verifies OMI state.

A consumer asks:

```text
What pointer is this?
What rule validates it?
What emitted it?
Can it be replayed?
What does it project visually or telemetrically?
```

### Provider

A **provider** emits OMI-compatible state.

A provider must supply:

```text
OMI pointer
rule binding
implementation
test
projection
failure behavior
```

### Provider Contract

The provider contract is:

```text
No address without a rule.
No rule without a test.
No test without a replay path.
No replay path without visible or inspectable state.
```

### Projection

A **projection** is the visible, telemetry, memory, or document representation of an OMI state.

Examples:

```text
CSSOM selector
JSON Canvas node
SSE telemetry event
Code16K header
JABCode body
QEMU clock object
BPF map counter
```

---

## 18. Verification Terms

### Invariant

An **invariant** is a condition that must remain true across parsing, execution, replay, projection, or deployment.

### Regression Suite

The **regression suite** is the complete test set proving that OMI implementation behavior still matches the rules.

### Green Baseline

A **green baseline** is a fully passing test/build state.

Example release baseline:

```text
934/934 tests passing
166 production modules built
```

### Rule Pointer

A **rule pointer** is an OMI address that identifies an invariant.

Example:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
```

### Visual Anchor

A **visual anchor** is a DOM, CSSOM, Canvas, or SVG element whose ID or dataset attribute carries an OMI pointer.

### Failure Behavior

**Failure behavior** defines what happens when a state violates its rule.

Examples:

```text
return false
reject token
evict frame
drop packet
route to warning preset
mark as gated
```

---

## 19. Color and Canvas Terms

### Canvas Preset

A **Canvas preset** is a single-character JSON Canvas color code.

Common OMI meanings:

| Preset | Typical Meaning                               |
| -----: | --------------------------------------------- |
|  `"1"` | Warning / red / invalid / evicted             |
|  `"3"` | Transition / yellow / middle state            |
|  `"4"` | Healthy / green / synchronized                |
|  `"5"` | Valid / cyan / accepted                       |
|  `"6"` | Purple / high-precision / special active rail |

### Chromatic Bridge

A **chromatic bridge** maps numeric, symbolic, or precision state into visual color state.

### Negative Resistance

**Negative resistance** is a reflection or inversion state that routes to a purple-style preset in several OMI visual models.

---

## 20. Documentation Terms

### `README.md`

The consumer/provider entry document.

It should explain:

```text
what OMI is
why to use it
how consumers read it
how providers emit it
how to build and verify it
```

### `ONTOLOGY.md`

The conceptual foundation document.

It should explain:

```text
what kind of thing OMI is
why addresses act as validated ontology
how the quadratic lexer and orbit law define validity
```

### `GLOSSARY.md`

The shared vocabulary document.

It should define all terms without requiring the reader to understand every subsystem first.

### `RULES.omi`

The normative invariant directory.

It defines protocol-level MUST rules.

### `FACTS.omi`

The applied system fact registry.

It binds rules to concrete physical, runtime, telemetry, visual, and deployment facts.

---

## 21. Short Reference Pattern

Every new OMI subsystem should be documented with this pattern:

```text
Term:
Definition:
Pointer:
Rule:
Source:
Test:
Projection:
Failure behavior:
Consumer use:
Provider use:
```

Example:

```text
Term: eBPF/XDP Signature Gate
Definition: Kernel-space packet signature validator.
Pointer: omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
Rule: initialize-xdp-packet-parsing-gates
Source: src/ebpf/ebpf-pipeline.bpf.c
Test: test/ebpf-pipeline.test.js
Projection: CSSOM eBPF telemetry rail, BPF map counter
Failure behavior: XDP_DROP
Consumer use: trust packet state before user-space allocation
Provider use: emit signed cluster packets and telemetry counters
```
