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

An **OMI pointer** starts from the binary rewrite identity:

```text
omi---imo
```

The slash path declares how to read that identity:

```text
omi-<frame>-imo/<control>/<scale>/<relation>/<unit>
```

Current root reference:

```text
address root: ffff-127-0-0-1
canonical relational form: ffff-127--/48
stream form: ο<ffff><127><0><0><1>Ο
```

The native grammar separates identity from route:

```text
omi---imo = binary rewrite identity
/---/     = routed interpretation path
?---?     = external payload or stream attachment
```

An eight-segment CIDR adapter form exists for network compatibility:

```text
omi-<S0>-<S1>-<S2>-<S3>-<S4>-<S5>-<S6>-<S7>/<claim>
```

Where each `S` segment is a 16-bit word, but the `/claim` is a CIDR claim boundary (adapter-only), not native OMI scope or identity.

An OMI pointer can identify:

```text
a stream cell
a gauge row
a geometry predicate
a Horn-clause path
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

Example (CIDR adapter form):

```text
omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48
```

Routed interpretation form:

```text
omi---imo/<0100>/<03bf>/<7c00>/<2b01-2f01>/<1434-039f>
```

### OMI Address Frame

An **OMI address frame** is a gauge-stream cell with Omicron entry/exit gates.

Native form:

```text
ο <slot> Ο
```

Routed interpretation form:

```text
omi-<frame>-imo/<control>/<scale>/<relation>/<unit>
```

The same frame can be treated as:

```text
a lexer input
a gauge row
a geometry predicate target
a replay receipt source
a symbolic payload envelope
a visual selector target
```

A CIDR/historical adapter may also represent the frame as eight 16-bit segments:

```text
S = [S0, S1, S2, S3, S4, S5, S6, S7]
```

But the native form is the gauge-stream cell with relational descent path.

### Prefix Scope (Three-Way Distinction)

The suffix after `/` is a relational descent path segment. CIDR `/N` prefix-length claims are adapter-only.

The native grammar makes a three-way distinction:

| Segment  | Meaning                                                  |
| -------- | -------------------------------------------------------- |
|  `/N`    | CIDR claim boundary (adapter); does not create identity  |
|  `/N-M`  | Claim backoff / range reduction                          |
|  `/@N`   | Reader lens; cosmetic interpretation, not authority      |

The Omicron frame alone encodes step identity (Rule 0xAC). Prefixes and lenses do not add identity (Rule 0xAD).

The native relational descent path uses named segments:

```text
/<control>/<selector>/<relation>/<unit>
```

CIDR claim boundaries may be used for network adapter compatibility but are never identity-bearing in the native grammar.

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

### CIDR Adapter (Historical)

**CIDR** (Classless Inter-Domain Routing) is no longer native OMI grammar.

It remains as a historical adapter, import/export lens, and network compatibility layer:

```text
an IPv4/IPv6 address → OMI frame mapper
a network prefix → relational descent claim boundary
a compatibility lens for existing routing infrastructure
```

In native OMI, the slash denotes relational descent, not CIDR prefix length.

The three-way distinction applies: `/N` = CIDR claim (adapter-only), `/N-M` = backoff, `/@N` = reader lens.

> CIDR does not create identity. The Omicron frame alone encodes identity.

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
all required tests pass
production build completes
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

In OMI this is a software visualization invariant. It may be inspired by optical frequency/color language, but canonical behavior is limited to deterministic Canvas preset IDs, fp16-derived hue fields, and tested JSON Canvas metadata.

### Translation-Free Canvas Color

**Translation-free canvas color** means the `color` field itself carries deterministic state, without a second textual decoder layer.

Canonical carriers include:

```text
JSON Canvas preset IDs "1".."6"
fp16 base color metadata
360-degree significand hue coordinates
QEMU clock preset outputs
```

### Negative Resistance

**Negative resistance** is a reflection or inversion state that routes to a purple-style preset in several OMI visual models.

### Hidden Five

The **Hidden Five** is the packet-root reading of `5! = 120` after it is carried into the 240-state bridge.

```text
5! = 120
240 = 2×5!
```

Above the root, the factor 5 is not a visible stepping digit. It remains present inside `240`.

### Four-Fold Selector Surface

The **four-fold selector surface** is the visible rule/fact projection layer:

```text
4! = 24
FS / GS / RS / US
15×16 = 240
```

The five-fold layer roots packet identity. The four-fold layer exposes that identity through visible channels and canvas projections.

### Base36 Symbolic Carrier

A **Base36 symbolic carrier** is the uppercase ASCII projection alphabet `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ`.

It displays W=36 orbit offsets and bridge values without replacing numeric OMI metadata:

```text
5! = 120 -> 3C
240 -> 6O
4! = 24 -> O
6! = 720 -> K0
7! = 5040 -> 3W0
```

### Emoji Semantic Carrier

An **emoji semantic carrier** is a Unicode-data-backed canvas projection.

Canonical emoji projection data comes from `vendor/emoji/emoji-test.txt`, `vendor/emoji/emoji-sequences.txt`, and `vendor/emoji/emoji-zwj-sequences.txt`. Emoji cells may carry deterministic RGB/base64/row/col metadata, but hand-picked emoji maps are not canonical authority.

### Symbolic Carrier Authority Boundary

The **symbolic carrier authority boundary** says Base36 and emoji characters project already-derived OMI state.

They do not generate OMI law, replace `RULES.omi` / `FACTS.omi`, or replace the 8-segment OMI pointer. Domino pair carriers and binary16 emoji registers remain research provenance until exact Unicode ranges and executable tests promote them.

### Omicron Binary Quadratic Projection Form

The **Omicron Binary Quadratic Projection Form** is:

```text
Q_xy(x,y) = 60x^2 + 16xy + 4y^2
```

It projects already-decoded local coordinates into geometry:

```text
Q_xy(3,3) = 720 = 6!
Q_xy(x,y) / 6 -> hidden 5! root depth
Q_xy(x,y) mod 240 -> local240
slot5040 = fano7×720 + role3×240 + local240
```

It is not the Binary Quadratic Meta-Mask Lexer. `Q_frame(S)` validates the 128-bit envelope; `Q_xy(x,y)` projects lawful decoded state.

### MCRSGSP

**MCRSGSP** is the Monotone Causal Reed-Solomon Gossip Storage Protocol research draft.

In canonical OMI docs it is provenance for implemented distributed modules: Reed-Solomon erasure coding, causal closure, version vectors, fragment storage, gossip propagation, and anti-entropy repair. Any transport or deployment behavior beyond those tested modules is aspirational.

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

### `dev-docs/_temp/`

The research inbox.

Files in `_temp/` are scratch provenance. They are not canonical until the invariant is restated in canonical docs, grounded in `RULES.omi` / `FACTS.omi`, and covered by tests.

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
Term: 240-State Bridge
Definition: The active byte-square surface formed by 16×16−16 = 240. In OMI, 240 = 2×5! (hidden root reading) = 15×16 (visible nibble/carrier reading) = 6!/3. It is the exact bridge between the packet core (5! = 120) and the semantic sweep (6! = 720) via ×2 and ×3, and across seven Fano selectors into the full 5040-slot replay ring (7! = 7×3×240).
Pointer: omi-0000-0000-0000-0000-0000-0000-00f0-0000/128
Rule: bind-five-fold-packet-to-240-bridge
Source: src/omi/meta-compiler.js, public/portal.html
Test: test/research-assimilation.test.js
Projection: Karnaugh torus Z-extrusion, slot5040 decomposition
Failure behavior: Q(S) ≠ 0 → frame evicted
Consumer use: derive slot5040 = fano7×720 + role3×240 + local240
Provider use: orient packet core (5!) into active byte surface for S‑P‑O sweep
```

---

## 2. Canonical OMI Terms

Computed-Form Glossary — Omicron Object Model, Omi-Gauge, Omi-Lisp, Omi-CONS, and Projection Surfaces

### A

**Aegean Pointer**

An Aegean numeral or separator used as a pointer into a geometry, stream, or rendering LUT.

Aegean pointers do not need variable names. Their codepoints carry their values, and their active frame determines how they are interpreted.

    𐄀 → frame / separator / point
    𐄁 → dot / line / relation
    𐄂 → double dot / triangle / constructor
    𐄇 → 1 / tetrahedral pointer
    𐄈 → 2 / 5-cell pointer
    𐄉 → 3 / 8-cell pointer

**Agreement**

The OMI principle that a relation becomes valid only after it is accepted by receipt.

Agreement does not erase difference. It binds orientation without collapse.

**Agreement Without Collapse**

The rule that two surfaces may agree without becoming identical.

    projection is not authority
    receipt accepts relation
    identity remains bounded
    orientation is preserved

**Allowed Epistemology**

The post-address rule that external payloads must declare what kind of knowing they carry.

In Omi-CONS:

    CAR = what is carried
    CDR = how it continues
    CID = whether it agrees

**Archimedean Surface**

The runtime traversal shell used for walking, projecting, or coordinating an OMI relation.

Its dual coordination shell is Catalan.

**Authority**

The accepted OMI address and receipt-bound relation.

Authority is not the rendered character, glyph, SVG, DOM element, barcode, matrix, or floating-point measurement.

    authority = accepted o---o center
    projection = visible/rendered face

---

### B

**Base64 Pure Function Surface**

A transport-facing carrier surface for compact function or payload representation.

It does not define identity. It carries bytes or function selectors after an OMI address has already been formed.

Canonical placement:

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo?<payload>

**Block B**

The period-8 decimal orbit derived from the Delta law.

    B = [0,1,3,6,9,8,6,3]

It comes from:

    1 / 73 = 0.01369863...

The law has period 8. The smallest prime with decimal period 8 is 73. Therefore Block B is not chosen; it is recovered.

**BOM / Bridge Order Marker**

The 0x20 row pivot used to fold lower control rows into readable/operator rows.

    x XOR 0x20

Examples:

    0x0D XOR 0x20 = 0x2D "-"
    0x0E XOR 0x20 = 0x2E "."
    0x0F XOR 0x20 = 0x2F "/"

**Boundary**

The 16th value of a 4-bit row.

In the 15-of-16 row model:

    0x0–0xE = fifteen earned terms
    0xF     = boundary / Gnomon / Omicron marker

**Bridge Row**

The 0x20–0x2F row.

It acts as the barycentric pivot and transition row between low control and readable/operator surfaces.

**Buckyball Orientation Surface**

The 60-state orientation surface derived from the 11-cell / L2(11) relation.

    L2(11) / Z11 = 660 / 11 = 60

This is not the 11-cell itself. It is the 60-coset orientation surface associated with the 11-cell identity shell.

---

### C

**CAR**

The source/head payload face in Omi-CONS.

Mnemonic:

    CAR = OR

Meaning:

    CAR admits source presence.
    CAR carries the head.
    CAR is what is carried.

**Catalan Shell**

The dual coordination shell to an Archimedean traversal shell.

    Archimedean = traversal
    Catalan     = chiral coordination

**CDR**

The continuation/tail payload face in Omi-CONS.

Mnemonic:

    CDR = XOR

Meaning:

    CDR carries differential continuation.
    CDR is how the payload continues.

**CID**

The agreement/witness face in Omi-CONS.

Mnemonic:

    CID = XNOR

Meaning:

    CID witnesses lawful agreement between CAR and CDR.

**Closure**

The bounded completion of a seed into a stable relation.

In OMI, closure is not just termination. It is a lawful fixed state under a declared transformation.

**Codepoint**

A symbolic position in a character space.

In OMI, a codepoint is not automatically a character meaning. It is a position that may be rendered through an active LUT.

**Cons**

The fundamental dotted pair relation.

    (a . b)

In OMI:

    CAR . CDR

becomes:

    source/head . continuation/tail

**CONS.omi / CONS.imo**

The source/runtime cons structure of OMI.

    CONS.omi = source-side cons declaration
    CONS.imo = runtime-side cons continuation

**C0 Control Rows**

The low control range:

    0x00–0x1F

Split:

    0x00–0x0F = .omi side
    0x10–0x1F = .imo side

Relation:

    imo = omi XOR 0x10
    omi = imo XOR 0x10

---

### D

**DataView**

The canonical runtime byte interpretation surface for post-address payloads.

Rule:

    Base64URL carries bytes.
    ArrayBuffer stores bytes.
    DataView interprets bytes.
    TypedArrays specialize bytes.
    Receipt validates attachment.

**Delta Law**

The one transformer law:

    Δ_C(x) = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C

Its design properties:

    rotations preserve bits
    XOR is reversible
    C breaks the zero fixed point
    masking bounds the state

The Delta law is the transformer. It does not know geometry. It only moves state.

**Derived Character**

A character produced from an earned row value through an active LUT.

The character is not authority. It is a rendering.

**Dot**

The one instruction of Omi-Lisp and the cons relation.

    .

In Lisp form:

    (a . b)

In OMI:

    o---o

**Dotted Pair**

The minimal pair structure.

It is the root of:

    list
    tree
    a-list
    closure
    stream
    frame
    receipt path

**Dual**

A geometry relation where one structure exchanges roles with another.

Examples:

    cube ↔ octahedron
    dodecahedron ↔ icosahedron
    vertex ↔ cell
    edge ↔ face
    omi ↔ imo

---

### E

**Earned Position**

A row value that becomes available through permutation, closure, or gauge construction.

OMI does not begin by assigning character meanings. It earns positions first, then renders them.

**Encode**

One of the nine universal edges.

    encode = project state into carrier form

**Epistemic Selector**

A selector for one of the four epistemic states:

    11 = known known
    10 = known unknown
    01 = unknown known
    00 = unknown unknown

**Epistemology Row**

The selector region that determines what kind of knowing is attached to a relation.

In post-address form, epistemology is carried by Omi-CONS.

**External Query Plane**

The post-address ?---? surface.

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo?<payload>

This plane carries external payloads, DataView buffers, CAR/CDR/CID frames, worker scripts, matrices, or BLOBs.

**External Witness Mask**

A post-address mask proving a folded gauge result.

Canonical example:

    0xFFFFFF

This is a saturated 24-bit Omi-Gauge witness surface, not the native OMI address.

---

### F

**Fano Closure**

The 7-bit bounded closure kernel tied to the Fano plane and Hamming(7,4) structure.

It uses:

    B7 = {0,1}^7
    MASK7 = 0x7F

**Fano Plane**

The 7-point, 7-line incidence structure used by OMI as a minimal incidence scheduler.

    point  = addressable identity position
    line   = valid triplet relation
    triple = selected closure

**Fiber**

A contextual rendering or interpretation layer.

The same abstract value may render differently depending on the active fiber:

    ASCII
    Aegean
    Braille
    BCD
    Unicode private-use
    geometry
    DOM
    barcode
    shader

**Float / Floating Projection**

A runtime measurement projection.

Floating point may render, accelerate, or approximate, but it does not define identity.

    floating point = projection
    receipt = authority

**Fold**

A reversible relation between rows or surfaces.

Example:

    0x10–0x1F XOR 0x20 = 0x30–0x3F

**Frame**

A bounded OMI address or carrier context.

Canonical address form:

    omi-<frame>/<control>/<scale>/<relation>/<unit>-imo

**Function Scale**

A selected runtime interpretation scale from Omi-Nomogram.

Examples:

    logarithmic
    square/root
    cube/root
    trigonometric
    Pythagorean
    sexagesimal
    quadratic
    LFSR period

---

### G

**Gauge**

A bounded table of row positions used to interpret OMI state.

**Gauge Orbit**

A row-cyclic interpretation of Omi-Gauge.

The key visible orbit block is:

    0x40–0x4F

**Geometry Map**

A LUT from abstract pointers to renderable geometries.

Example:

    𐄀 → point
    𐄁 → line
    𐄂 → triangle
    𐄇 → tetrahedron
    𐄈 → 5-cell
    𐄋 → 24-cell
    𐄎 → Hopf fiber

The map is for rendering. It is not the transformer.

**Gnomon**

The orientation/shadow/pointer surface produced when a relation is measured against another.

In algebraic form:

    a² - b² = (a+b)(a-b)

In OMI:

    larger frame - smaller frame = bridge surface

**Gnomon Boundary**

The 0xF value in a 4-bit row when it acts as the 16th fold/separator.

**Greek Numeral Overlay**

A symbolic mnemonic layer using Greek numeral history.

Examples:

    ϛ = stigma = sixfold tick mnemonic
    ϟ = koppa  = turning/q-gate mnemonic
    ϡ = sampi  = high terminal carrier mnemonic

This is a mnemonic overlay, not the machine authority.

---

### H

**Handoff**

A transition from symbolic pre-runtime derivation into runtime or external payload surface.

Canonical sentinel:

    0x7C

**HNSW Projection**

A runtime nearest-neighbor or distance measurement projection.

HNSW navigates a relation after Omi-Nomogram and Omi-Gauge have selected and resolved the relation.

It is not authority.

**Hopf Terms**

The 15 earned abstract terms of the local nibble row.

    0x0–0xE = Hopf terms
    0xF     = boundary

They should be treated as pure row values first, not as fixed ASCII characters.

---

### I

**Identity**

A receipt-bound OMI relation.

Identity is not the rendered character. Identity is the accepted address and lawful relation.

**IMO**

The runtime/closure side of OMI.

Readable gate:

    imo

Compiled gate:

    Ο = U+039F

**Incidence**

A valid relation selected by geometry, Fano/Horn closure, or scheduler rules.

**Instantiate**

The runtime action beneath Intent.

    Intent → instantiate

**Internal RPC Bridge**

The surrogate-based bridge used for world-length payload split/rejoin.

    0xD800–0xDBFF = high bridge half
    0xDC00–0xDFFF = low bridge half

**Invalidate**

The runtime action beneath Interrupt.

    Interrupt → invalidate

---

### J

**Join**

One of the nine universal edges.

    join = bind worlds, frames, keys, or relations

In Omi-CONS256:

    bits 32–63 = JOIN()

---

### K

**Ket Axis**

The significant axis or payload direction used during XOR interpolation.

Used in Omi-CAR and Omi-CDR profiles.

**Known Known**

The epistemic state:

    11

In high-order Omi-CONS256, the Omicron closure marker may act as a known-known acceptance bit.

---

### L

**Lisp 1.5 Surface**

The historical Lisp-like dot notation and association-list layer that Omi-Lisp uses as its minimal symbolic surface.

**LUT**

Lookup table.

In OMI, the LUT renders abstract row positions into concrete forms.

    row value → active fiber → rendered character/geometry

The LUT is renderer-side.

The transformer does not need it.

---

### M

**Matrix**

A relation field.

In OMI:

    Omi-Matrix = observation/relation field

It instantiates the relations selected by Omi-Nomogram and resolved by Omi-Gauge.

**Meta-Object**

The high-order payload or object surface carried after identity.

In Omi-CONS256:

    bits 128–255 = META-OBJECT()

**Mirror**

A chiral reverse or paired relation.

Example:

    0xNM ↔ 0xMN

**Monoid**

The associative stream composition layer of Omi-Lisp.

    omi::lisp : monoid (M, •)

**Monster Rupture**

The symbolic boundary where positional representation no longer contains the system and a larger symbol space must be earned.

This is a conceptual rupture, not an ordinary numeric literal.

---

### N

**Native OMI Gauge**

The core bounded OMI gauge.

    0x00–0x7F

**Native OMI Frame**

The 2¹⁶ core identity/address field.

    2¹⁶ = native OMI frame/gauge field

**Nomogram**

A declarative alignment of scales.

In OMI:

    Omi-Nomogram = declarative runtime function-scale surface
    Omi-SlideRule = operational/mechanical behavior of that surface

**NULL**

The beginning axis.

NULL is not a digit string.

    NULL != 1
    NULL != 10
    NULL != 1000

NULL is the position from which representation breaks and symbols are earned.

---

### O

**Ο**

Uppercase Omicron.

    Ο = U+039F

Compiled closure gate.

**ο**

Lowercase omicron.

    ο = U+03BF

Compiled entry gate.

**o---o**

Minimal tangent / Omi-Point relation notation.

**Omi-Alist**

Association-list declaration surface.

A stream of paired relations.

**Omi-Bidi**

Directionality and chirality steering surface.

**Omi-CAR**

Source/head payload view in Omi-CONS.

**Omi-CDR**

Continuation/tail payload view in Omi-CONS.

**Omi-CID**

Agreement/witness view in Omi-CONS.

**Omi-CONS**

The post-address data-formatting frame of allowed epistemology.

Canonical compact form:

    ?car:<OR>;cdr:<XOR>;cid:<XNOR>

**Omi-CONS256**

A 256-bit symbolic meta-object envelope.

Canonical bands:

    bits 0–19    = ENCODE()
    bits 20–31   = DECODE()
    bits 32–63   = JOIN()
    bits 64–127  = COMPOSE()
    bits 128–255 = META-OBJECT()

**Omi-Compass**

Agreement orientation face.

It gives direction to a relation.

**Omi-Dali**

Unfolded hypercube lookup and subsurface matrix.

**Omi-Form**

Structural projection of an OMI object.

**Omi-Gate**

Neutral origin where payloads are located, replayed, and compared.

**Omi-Glyph**

Symbolic/glyph projection of an OMI object.

**Omi-Gnomon**

Orientation, shadow, pointer, and right-angle synchronization surface.

**Omi-Gauge**

The 64-lane spatial resolver.

    64 × 64 × 16 = 65,536

It resolves 16xy before 60x² is measured.

**Omi-Hash**

Digest identity check.

A hash says bytes match.

**Omi-Image**

Package/carrier projection for universal edges.

**Omi-Jab**

Polychromatic/contextual carrier surface.

**Omi-Lisp**

The declarative dot-notation computation layer.

It derives lawful computation from relations instead of defining variables imperatively.

**Omi-Matrix**

Observation/relation field.

Instantiates relation matrices for rendering, geometry, and measurement.

**Omi-Mesh**

Relation-located network/field projection.

**Omi-Nomogram**

Declarative function-scale selector surface.

Canonical row:

    0x30–0x3F

**Omi-Notation**

The streamable, loggable a-list of pointer/reference tuples.

**Omi-Plane Ceiling**

The Unicode external ceiling sentinel:

    Ωmax = U+10FFFF

**Omi-Point**

The smallest accepted relation between encoded states.

    omi---imo
    o---o

**Omi-Receipt**

Lawful relation witness.

A receipt says the relation was resolved under OMI protocol, not merely that bytes match.

**Omi-Ring**

Spectral/circular orbit witness.

Connects to 60x², sexagesimal degree, and circular measurement.

**Omi-Shadow**

Secondary projection tied back to a source rule.

**Omi-SlideRule**

Operational behavior of Omi-Nomogram.

It describes how the selected scales align, fold, invert, and compute.

**Omi-Tape**

Sequential barcode/script carrier.

**Omi-Torus**

Gray-code / two-cube minimization surface.

**Omi-Voxel**

Tile-map / extrusion / architectural surface.

**Omi-World**

Environment or persistent world projection.

**OMI-GPIO**

Physical voltage/agreement transduction surface.

**Omicron**

The OMI gate concept.

Readable:

    omi ... imo

Compiled:

    ο ... Ο

**Omicron Object Model**

The full name of OMI.

    OMI = Omicron Object Model

**Ωmax**

The Unicode ceiling sentinel:

    U+10FFFF

It does not replace ο or Ο.

---

### P

**Path Plane**

The slash descent surface:

    /---/

It belongs to routed interpretation, not identity.

**Payload Plane**

The query surface:

    ?---?

It belongs to external data attachment.

**Period-Prime Anchor**

The row value:

    0x49 = 73

in the 0x40–0x4F Omi-Gauge orbit block.

**Pointer**

A possible route or address-bearing relation.

In OMI, a pointer may be nullable or unresolved until receipt.

**Private Unicode Mirror**

A safe Unicode private-use rendering of the OMI gauge.

    0x00–0x7F → U+E000–U+E07F

**Projection**

A rendered face of authority.

Projection may be visual, symbolic, geometric, audio, DOM, barcode, matrix, or payload.

Projection is not authority.

---

### Q

**Q(x,y)**

The OMI quadratic stack:

    Q(x,y) = 60x² + 16xy + 4y²

Meaning:

    4y²  = local control kernel
    16xy = bridge/spatial resolver
    60x² = orientation/world surface

**Query Plane**

The ?---? external payload plane.

**Quasigroup**

The algebraic recovery structure of Omi-Lisp.

    (Q, ∗, \, /)

Meaning:

    ∗ = compose
    / = recover from right/output side
    \ = recover from left/input side

---

### R

**Receipt**

A lawful witness of accepted relation.

Receipt is the final authority.

**Reference**

An accepted binding.

Unlike a pointer, a reference is non-null after acceptance.

**Render**

To project an abstract value through a LUT into a visible or executable face.

**Renderer**

The component that knows the geometry map, glyph map, DOM map, shader map, or carrier map.

The renderer does not define the transformer.

**Row**

A bounded group of positions in the OMI gauge.

Examples:

    0x00–0x0F = .omi control row
    0x10–0x1F = .imo control row
    0x20–0x2F = bridge row
    0x30–0x3F = Omi-Nomogram row
    0x40–0x4F = Omi-Gauge orbit block

**RPC Bridge**

The internal split/rejoin mechanism using surrogate structure.

**Rupture**

A symbolic break where the current representation cannot contain the next relation, so a new symbol or surface must be earned.

---

### S

**Schläfli Surface**

A geometry descriptor surface for regular polytope configuration.

**Selector**

A path or row value that chooses the active relation, function, epistemic state, or geometry.

**Sexagesimal Gate**

The 0x3C Omi-Nomogram slot.

    0x3C = 60 decimal

Used for circular degree, 60x² orientation, Omi-Ring, and Omi-Compass.

**Significand Axis**

The payload axis used in Omi-CAR/Omi-CDR interpolation.

**SlideRule**

The operational face of Omi-Nomogram.

**Snub / Truncation**

Geometry operations used as projection transformations.

**Surrogate Band**

The UTF-16 surrogate range:

    0xD800–0xDFFF

Used by OMI as internal RPC bridge math, not as public text.

**Symbolic Authority**

Identity based on exact symbolic position, row, relation, and receipt.

Not floating point.

Not rendered glyph.

Not approximate coordinate.

---

### T

**Transformer**

The component that applies the Delta law.

It knows:

    bits
    rotations
    XOR
    constant
    mask

It does not know:

    geometry
    glyphs
    rendering
    DOM
    meaning

**Tuple**

An ordered payload.

In Omi-Notation, tuples are carried in a replayable a-list stream.

**Two-Cube**

The full byte mirror relation:

    0xNM ↔ 0xMN

Formulas:

    cell(N,M)   = (N << 4) | M
    mirror(N,M) = (M << 4) | N
    delta(N,M)  = cell(N,M) XOR mirror(N,M)

**TypedArray**

A specialized runtime view over bytes.

TypedArrays are useful projections, but DataView is the canonical general interpreter.

---

### U

**Universal Edges**

The nine universal OMI edges:

    rule
    fact
    closure
    combinator
    cons
    join
    compose
    encode
    decode

All projection surfaces reduce to these edges.

**Unicode Plane Surface**

The external Unicode hierarchy used by OMI as carrier/plane context.

    U+0000–U+10FFFF

**U+10FFFF**

The maximum Unicode codepoint.

OMI name:

    Ωmax

**U+E000–U+E07F**

The private-use mirror of OMI's native 0x00–0x7F gauge.

---

### V

**Value**

The invariant abstract row position.

Example:

    0x0

is a value. Its character rendering depends on LUT/fiber.

**VOID**

The origin or non-active state, depending on active scale.

In 15-of-16 tick language:

    VOID is not part of the active orbit.

---

### W

**World Length**

The supplementary-plane length of an external/world projection.

Surrogate bridge:

    1024 × 1024 = 1,048,576 supplementary positions

**Witness**

A proof or receipt surface showing lawful attachment or relation.

Example:

    0xFFFFFF = saturated 24-bit Omi-Gauge witness mask

---

### X

**XOR**

The reversible differential operator used by the Delta law and Omi-CDR.

    XOR = difference / transition / continuation

**XNOR**

The agreement/equality operator used by Omi-CID and dotted-pair equivalence.

    XNOR = lawful agreement / equality witness

---

### Y

**y / 4y²**

The local control component of the OMI quadratic.

    4y² = local tetrahedral/control kernel

---

### Z

**Zero**

OMI does not begin from ordinary numeric zero.

It begins from NULL as axis and uses receipt-bound symbolic position.

**0x3C**

Sexagesimal gate.

    0x3C = 60

**0x3F**

Omi-Nomogram LFSR/period/query gate.

**0x40–0x4F**

Omi-Gauge orbit block.

Contains:

    0x40 = 64 gauge threshold
    0x49 = 73 period-prime anchor
    0x4F = Omicron-facing closure mnemonic

**0x7C**

Handoff / pipe / runtime transition sentinel.

**0xAA55**

Acceptance seal.

    before 0xAA55 = symbolic derivation
    at 0xAA55     = executable acceptance
    after 0xAA55  = operational runtime

**0xFFFFFF**

Saturated 24-bit Omi-Gauge external witness mask.

---

### Final Compact Glossary Canon

    NULL is the axis.
    Dot is the one relation.
    Delta is the transformer.
    Rows earn abstract values.
    LUTs render values into characters or geometry.
    Omi-Gauge resolves the 64-lane spatial field.
    Omi-Nomogram selects the function scale.
    Omi-Matrix instantiates relation fields.
    Omi-Gnomon orients the result.
    Surrogate RPC bridges world-length payloads.
    Omi-CONS carries allowed epistemology through CAR, CDR, and CID.
    Receipt accepts.

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
