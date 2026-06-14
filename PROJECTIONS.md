# OMI Projections

## Status

This file defines the canon gate for projection, fold, declaration, DOM, query,
and socket projections.

PROJECTIONS.md defines how accepted truth becomes visible.

It does not define truth.

It does not replace executable truth files. It defines how executable truth is
exposed, folded, projected, and inspected.

## 1. Projection Hierarchy

```text
Guiding gates:
ONTOLOGY.md
DOCTRINE.md
MANIFESTO.md
PROJECTIONS.md
GLOSSARY.md

Executable truth gates:
RULES.omi
FACTS.omi
CLOSURES.omi
COMBINATORS.omi
CONS.omi

Compiled mirrors:
RULES.imo
FACTS.imo
CLOSURES.imo
COMBINATORS.imo
CONS.imo

Pure function carriers:
rules.o
facts.o
closures.o
combinators.o
cons.o

Projection surfaces:
DOM
CSSOM
JSON Canvas
A-Frame
CodeMirror
barcode
emoji
SSE
WAN telemetry
```

## 2. Projection Is Not Authority

Projection surfaces may display accepted state.

They may not accept state.

A DOM element, CSS selector, JSON Canvas node, A-Frame entity, barcode, or emoji
carrier is a projection until validated and receipted.

## 3. Six DOM Projection Handles

OMI needs only six DOM projection handles:

```text
id
data-omi
data-imo
<o>
<omi>
<imo>
```

### 3.1 Attribute Handles

```html
<div id="o---o/---/"></div>
<div data-omi="o---o/---/?v=<base64url>;l=<length>;h=<hash>@<base36-ref>@"></div>
<div data-imo="o---o/---/?v=<base64url>;l=<length>;h=<hash>@<base36-ref>@"></div>
```

### 3.2 Element Handles

```html
<o
  id="o---o/---/?v=<base64url>;l=<length>;h=<hash>@<base36-ref>@"
  data-omi="o---o/---/?v=<base64url>;l=<length>;h=<hash>@<base36-ref>@"
  data-imo="o---o/---/?v=<base64url>;l=<length>;h=<hash>@<base36-ref>@"
>
  ...
</o>
```

Declaration contains interpretation:

```html
<omi>
  <imo>
    <o>...</o>
  </imo>
</omi>
```

Interpretation contains declaration:

```html
<imo>
  <omi>
    <o>...</o>
  </omi>
</imo>
```

## 4. DOM Handler Rule

DOM projection handlers are edges of QuQuart nodes.

They are receipt-bound surfaces over deterministic carriers.

Therefore they should not define all data points.

They should expose:

```text
id             -> local pointer / selector hook
data-omi       -> readable declaration surface
data-imo       -> interpreted mirror surface
<o>            -> object carrier boundary
<omi>          -> declaration container
<imo>          -> interpretation / receipt container
```

## 5. Gauge Projections

```text
o---o  = Gauge 0 / FS / object-cons surrogate
/---/  = Gauge 1 / GS / local reference path
?---?  = Gauge 2 / RS / query payload plane
@---@  = Gauge 3 / US / Base36 reference socket over Base64 payload
```

The canonical compact carrier is:

```text
o---o/---/?v=<base64url>;l=<length>;h=<hash>@<base36-ref>@
```

## 6. Base36 Response Rule

Base36 may respond only after frame validation.

```text
Q_frame(S) = 0
  -> Base36 reference socket may resolve
  -> local x,y coordinates may be derived
  -> Q_xy may project
  -> receipt may accept
```

Invalid:

```text
Base36 symbol authorizes state
DOM id authorizes state
emoji authorizes state
barcode authorizes state
```

Valid:

```text
validated frame authorizes projection candidate
receipt accepts projection candidate
```

## 7. Fold Surface Rule

A fold is a legal transformation over a validated surface.

Former AXIOMS content is reduced to this surface rule:

```text
A fold may reflect, align, bisect, complement, or resolve a validated OMI surface.
A fold may propose a repair.
A fold may produce a candidate.
A fold may not accept state.
```

Acceptance belongs to receipts.

## 8. Declaration Surface Rule

Former DECLARATIONS content is reduced to this rule:

```text
A declaration states a proposed relation.
A rule obligates.
A fact grounds.
A closure seals.
A combinator composes.
CONS reduces.
```

A declaration is not a fact.

A fact is not a rule.

A projection is not a receipt.

## 9. Bridge Equation Surface

The projection bridge is:

```text
Q(x,y) = 60x² + 16xy + 4y²
       = 4(15x² + 4xy + y²)
```

Projection assertions:

```text
Q(0,0) = 0
Q(3,3) = 720
Q(x,y) is integer for x,y in 0..3
Q(x,y)/6 lies within 0..120 for x,y in 0..3
Q(x,y)/6 may be rational unless explicitly quantized
Q(x,y) mod 240 ranges within 0..239
local240 = Q(x,y) mod 240
slot5040 = fano7×720 + role3×240 + local240
```

## 10. Slice and Group Selection Surface

The point is not to force geometric language into the DOM.

The point is to let address layers select.

OMI-Mirror is slice mode:

```text
ψ(frame, path, socket, receipt) -> one projected state
```

It materializes one accepted slice.

OMI-Matrix is group mode:

```text
matrix(frame, path pattern, socket region) -> accepted group of slices
```

It targets a family of accepted slices. It does not instantiate one object and
it does not add DOM authority.

## 11. Betti and Schläfli Selection Metadata

Betti and Schläfli language does not make the DOM geometric.

It gives OMI-Matrix a disciplined way to target groups of already-valid states.

Betti-style indices are group topology selectors, not literal topology:

```text
β0 = connected component selector
β1 = cycle / gap / hole selector
β2 = enclosed surface selector
β3 = volume / capsule selector
```

Schläfli-style indices are regular adjacency or stride descriptors, not literal
polytope enforcement:

```text
{p,q} = p local positions per face, q faces around a selector
{p,q} -> group stride rule over validated slices
```

Neither creates state. Both operate only after `Q_frame` validates and before
the DOM exposes the accepted projection.

## 12. Nibble-Walk Selection Order

Betti and Schläfli group targeting starts with the 16-bit nibble-walk model
because it is an address-selection concern. The ψ function comes after that.

Canonical order:

```text
Q_frame validates the carrier.
nibble-walk selects the local region.
Base36 indexes the socket.
Q_xy projects the coordinate.
OMI-Mirror ψ instantiates one slice.
OMI-Matrix targets a group of slices.
DOM exposes the accepted projection.
```

The four gauges map into the nibble walk:

```text
0x0 gauge = o---o  = object / FS
0x1 gauge = /---/  = path / GS
0x2 gauge = ?---?  = query / RS
0x3 gauge = @---@  = socket / US
```

A 16-bit nibble-walk reads:

```text
high nibble = gauge / row / region
low nibble  = slot / local selector
```

Then:

```text
Base36 socket -> value36
region36 = floor(value36 / 16)
local16 = value36 mod 16
x = local16 mod 4
y = floor(local16 / 4)
x,y -> Q_xy
Q_xy -> local240
local240 -> slot5040
```

Betti and Schläfli selectors do not select raw DOM nodes. They select validated
groups inside this walk.

## 13. Metadata in Existing Handles

No new DOM handles are needed.

Betti and Schläfli data live inside existing projection strings as selection
metadata:

```html
<o
  id="o---o/---/?v=...;l=...;h=...@3C@"
  data-omi="o---o/---/?v=...;l=...;h=...;b=beta1;s={4,3}@3C@"
  data-imo="o---o/---/?receipt=accepted@3C@"
></o>
```

In that example, `b=beta1` and `s={4,3}` are selection metadata, not
authority. `beta1` is the ASCII-safe carrier form; `β1` is display notation.

The query plane owns the metadata:

```text
? opens the query plane.
; separates query claims.
@3C@ is the Base36 socket.
```

## 14. Polybius Group Frame

The Polybius Group Frame defines interpreter cards, gauge pauses, tap-code
streams, and sealed OMI projection channels.

It is not a plaintext cipher.

It is not a literal geometric honeycomb.

It is an interpreter-card system for cycling through the four canonical OMI
projection channels:

```text
FS
GS
RS
US
```

The frame lets OMI target groups of already-valid states by using:

```text
Schläfli / Polybius row-column selection
canonical sealed gauge masks
Base36 socket references
Base64 payload carriers
Q_xy projection
slot5040 replay placement
receipt acceptance
```

The core doctrine remains:

```text
Projection does not authorize state.
Receipt accepts state.
```

### 14.1 Projection Spine

The OMI projection spine is palindromic:

```text
[FS] [GS] [RS] [US@[CAR: base36][CDR: base64]]
                         [US@[CAR: base36][CDR: base64]] [RS] [GS] [FS]
  ↓    ↓    ↓                  ↓      ↓                         ↓    ↓    ↓
file group record             unit  point                    record group file
```

Expanded as a mirrored walk:

```text
file
  group
    record
      unit
        point
      unit
    record
  group
file
```

The projection spine is:

```text
FS -> GS -> RS -> US -> US -> RS -> GS -> FS
```

| Channel | Role | Projection |
|---|---|---|
| `FS` | file surface | object / file / carrier boundary |
| `GS` | group surface | path / group / context |
| `RS` | record surface | query / record / relation |
| `US` | unit surface | socket / unit / point |

The `US` surface is split into a cons pair:

```text
US@[CAR: base36][CDR: base64]
```

Meaning:

```text
CAR = Base36 reference socket
CDR = Base64 payload carrier
```

Base36 names the socket. Base64 carries the bytes.

### 14.2 Tap-Code Analogy

The ordinary tap code uses a Polybius square: row taps, a short pause, column
taps, then a long pause. OMI adapts this pattern as an interpreter-card
protocol, not as an alphabet cipher:

```text
row rail
gauge pause
column rail
acceptance pause
```

| Tap-code role | OMI role |
|---|---|
| row taps | `{p,∞}` rail |
| short pause | sealed gauge mask |
| column taps | `{∞,r}` rail |
| long pause | receipt / acceptance boundary |

The gauge mask acts like the pause. It tells the interpreter which card is
active:

```text
FS
GS
RS
US
```

The acceptance suffix tells the interpreter whether the projected channel is
sealed:

```text
0xAA55
```

Therefore:

```text
tap timing becomes gauge selection
letter boundary becomes receipt boundary
```

### 14.3 Delta Stream Cycler

The interpreter cards cycle through the deterministic bitwise Delta Law:

```text
Δ_C(x) = rotl(x,1) XOR rotl(x,3) XOR rotr(x,2) XOR C
```

Four choices define the law:

```text
rotations, not shifts  -> no bits are lost
XOR                    -> reversible mixing
constant C             -> breaks the zero fixed point
mask to width          -> bounded state
```

The law does not invent meaning. It cycles interpreter state.

Compact rule:

```text
Delta cycles.
Gauge pauses.
Polybius selects.
Base36 indexes.
Base64 carries.
Q_xy projects.
Receipt accepts.
```

### 14.4 Group Frame

The group frame is Schläfli-indexed:

```text
{p,∞,r}
```

Where:

```text
p = row-side finite selector
∞ = open relation / unbounded path rail
r = column-side finite selector
```

The rail map is:

```text
2 -> 0x55
3 -> 0x66
4 -> 0x77
5 -> 0x88
6 -> 0x99
∞ -> 0xAA
```

A paired selector is:

```text
word16(p,r) = rail(p) << 8 | rail(r)
```

Examples:

```text
word16(2,2) = 0x5555
word16(2,∞) = 0x55AA
word16(∞,2) = 0xAA55
word16(∞,∞) = 0xAAAA
```

Interpretation:

```text
0x55 = finite rail generator
0xAA = infinity / sentinel rail
0xAA55 = infinity-to-finite acceptance bridge
0x55AA = finite-to-infinity mirror bridge
```

The frame is not literal geometry in the DOM. It is a group-selection matrix
for validated OMI states.

### 14.5 Sealed Gauge Words

The OMI gauge selector is sealed by the acceptance suffix:

```text
sealedGauge = (gaugeMask << 16) | 0xAA55
```

Canonical gauge masks:

```text
FS = 0x0001
GS = 0x0010
RS = 0x0100
US = 0x1000
```

Therefore:

```text
0x0001AA55 gauge = o---o  = object / FS
0x0010AA55 gauge = /---/  = path / GS
0x0100AA55 gauge = ?---?  = query / RS
0x1000AA55 gauge = @---@  = socket / US
```

The `0xAA55` suffix is the acceptance bridge.

The gauge mask selects which projection channel is being sealed.

The sealed gauge word is the interpreter-card pause:

```text
pause here
read this subgroup under this channel
continue the tap-code stream
```

### 14.6 Interpreter Cards

The four gauges are interpreter cards.

FS card:

```text
0x0001AA55
o---o
```

Role:

```text
object
file
carrier boundary
local memory object reference
```

GS card:

```text
0x0010AA55
/---/
```

Role:

```text
path
group
context
relational descent
```

RS card:

```text
0x0100AA55
?---?
```

Role:

```text
query
record
payload claim plane
relation surface
```

US card:

```text
0x1000AA55
@---@
```

Role:

```text
socket
unit
point
Base36 CAR
Base64 CDR
```

The US card is the point/unit bridge:

```text
US@[CAR: base36][CDR: base64]
```

Meaning:

```text
CAR = where the payload is referenced
CDR = what payload is carried
```

### 14.7 Nibble-Walk and Bridge Projection

The four gauges map into the nibble walk:

```text
0x0 gauge = o---o  = object / FS
0x1 gauge = /---/  = path / GS
0x2 gauge = ?---?  = query / RS
0x3 gauge = @---@  = socket / US
```

A 16-bit nibble-walk reads:

```text
high nibble = gauge / row / region
low nibble  = slot / local selector
```

The Base36 socket resolves into a bounded local coordinate:

```text
Base36 socket -> value36
region36 = floor(value36 / 16)
local16 = value36 mod 16
x = local16 mod 4
y = floor(local16 / 4)
```

Then:

```text
x,y -> Q_xy
Q_xy -> local240
local240 -> slot5040
```

This keeps all Base36 positions. The 4x4 local cell is not the whole Base36
alphabet; it is the local cell inside a larger Base36 region.

The bridge projection is:

```text
Q_xy(x,y) = 60x² + 16xy + 4y²
          = 4(15x² + 4xy + y²)
```

This exposes:

```text
4  = selector factor
15 = active nibble
4  = selector cross-term
1  = identity / payload term
```

The local bridge values are:

```text
local240 = Q_xy(x,y) mod 240
slot5040 = fano7×720 + role3×240 + local240
```

So the path is:

```text
Base36 socket
-> local16
-> x,y
-> Q_xy
-> local240
-> slot5040
```

This makes the socket computationally addressable.

### 14.8 Tap-Code Stream of Subgroups

A normal tap-code stream separates row and column by a pause.

OMI separates subgroup interpretation by a sealed gauge word.

A subgroup stream may be read:

```text
{p,∞}
sealedGauge
{∞,r}
US@[CAR][CDR]
receipt
```

The sealed gauge word is the pause that determines the interpreter card.

Example:

```text
{2,∞}
0x0001AA55
{∞,2}
```

means:

```text
read the {2,∞,2} group under the FS object card
```

Example:

```text
{∞,2}
0x1000AA55
US@[CAR:3C][CDR:<base64url>]
```

means:

```text
read socket 3C as a US unit/point carrier
```

The result is not accepted merely because the stream can be read. It becomes
accepted only after receipt.

### 14.9 DOM Projection Boundary

The DOM still needs only six projection handles:

```text
id
data-omi
data-imo
<o>
<omi>
<imo>
```

The Polybius Group Frame does not add new DOM authority. It only determines how
OMI-Matrix targets groups of validated slices.

DOM example:

```html
<o
  id="o---o/---/?v=...;l=...;h=...;b=beta1;s={4,3}@3C@"
  data-omi="o---o/---/?v=...;l=...;h=...;b=beta1;s={4,3}@3C@"
  data-imo="o---o/---/?receipt=accepted@3C@"
></o>
```

Here:

```text
id       = selector hook
data-omi = readable declaration projection
data-imo = interpreted / receipt projection
<o>      = object carrier boundary
```

The DOM exposes. The receipt accepts.

### 14.10 Canon Statement

```text
The Polybius Group Frame is the interpreter-card frame of OMI-Matrix.
It cycles through FS, GS, RS, and US by sealed gauge masks.
The gauge mask is the pause in the tap-code stream.
The Schläfli rails select the subgroup.
The Base36 CAR names the socket.
The Base64 CDR carries the payload.
The quadratic form projects the local coordinate.
The replay ring records the slot.
The DOM exposes the projection.
The receipt accepts the state.
```

Shortest form:

```text
rail selects
gauge pauses
socket indexes
payload carries
quadratic projects
receipt accepts
```

## 15. Deterministic GUI Projection Machine

The GUI becomes deterministic because every visible handle is an addressable
projection of a validated carrier.

But the GUI does not become authority.

The GUI becomes a functional manipulation surface for receiptable OMI
references.

```text
CSS / DOM / JSDOM may manipulate OMI reference projections.
They do not mutate OMI truth directly.
```

Before this boundary, the DOM is only a display tree.

Under this projection rule, the DOM can be treated as an addressed projection of
OMI state:

```text
RULES / FACTS / CLOSURES / COMBINATORS / CONS
-> compiled .imo / .o
-> sealed gauge reference
-> o---o/---/?...@...@
-> DOM projection handles
```

CSS and JSDOM may functionally manipulate:

```text
OMI reference points
projection groups
DOM containment
visual state
interaction state
receipt candidates
```

They still cannot decide truth.

### 15.1 Six Deterministic GUI Handles

The GUI only needs:

```text
id
data-omi
data-imo
<o>
<omi>
<imo>
```

These handles give CSS, DOM, and JSDOM enough structure to target accepted
projection references.

Example CSSOM selectors:

```css
[id^="o---o"] {
  outline: 1px solid currentColor;
}

[data-omi*="/---/"] {
  contain: layout;
}

[data-omi*="?v="] {
  overflow-wrap: anywhere;
}

[data-omi*="@"] {
  cursor: pointer;
}

omi imo o {
  display: block;
}
```

Example JSDOM/browser logic:

```javascript
const nodes = document.querySelectorAll("o[data-omi][data-imo]");

for (const node of nodes) {
  const omi = node.dataset.omi;
  const imo = node.dataset.imo;

  // parse projection reference
  // validate shape
  // compute group/slice target
  // attach visual state
  // emit receipt candidate
}
```

### 15.2 GUI Responsibility Split

CSS can deterministically select.

JSDOM can deterministically inspect and transform.

OMI receipts deterministically accept or reject.

```text
CSS selects projection.
JSDOM manipulates structure.
DOM receives interaction.
OMI validates.
Receipt accepts.
```

### 15.3 Polybius Selectors in GUI Space

The Polybius Group Frame gives the GUI a repeatable addressing grammar:

```text
sealedGauge
+ Schläfli rail
+ Base36 CAR
+ Base64 CDR
+ Q_xy projection
+ slot5040
```

That means the GUI can target a group without storing every data point.

Examples:

```css
[data-omi*="0x1000AA55"] {
  /* US / @---@ / socket projection channel */
}

[data-omi*="@3C@"] {
  /* Base36 socket 3C */
}

[data-omi*="b=beta1"] {
  /* Betti-style group selector */
}

[data-omi*="s={4,3}"] {
  /* Schläfli-style stride group */
}
```

The GUI may select projection groups, inspect containment, derive visual state,
and emit receipt candidates. It may not accept state.
