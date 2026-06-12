# OMI Doctrine Addendum: Not a Database, but a Rewrite Register

## 1. Purpose

OMI is not a database. It is a versioned rewrite register.

Compact form: OMI is not a database. It is a rewrite register.

OMI does not store data like a database.

A database says:

```text
address -> stored value
```

OMI says:

```text
source of truth -> rewrite table -> routed interpretation -> receipt
```

The object is not stored data. The object is the lawful transformation of a declared binary source of truth.

Traditional computing stores values and computes transformations.

OMI stores transformations and computes values.

The binary source of truth remains fixed. Meaning emerges from the declared rewrite path through the register.

## 2. Binary Sources of Truth

An OMI source of truth can be a binary bitboard.

That bitboard is versioned. It is not treated as mutable database state. It is treated as a declared rewrite surface.

The bitboard can be loaded into memory as:

```text
omi---imo
```

where:

```text
omi---imo = binary rewrite identity
/---/     = routed interpretation path
?---?     = external payload or stream attachment
```

The identity is stable, but the route can change.

## 3. No Database Layer

OMI should avoid pretending it is a database.

It is closer to:

```text
versioned source
rewrite table
ring register
nomogram scale
receipt machine
```

A database asks:

```text
What value is stored here?
```

OMI asks:

```text
What lawful rewrite is declared here?
```

That is the boundary.

## 4. Meta-Circular Bitblips

The primitive unit is not a record. The primitive unit is a bitblip:

```text
a small binary transition
inside a rotating rewrite table
```

A bitblip does not carry meaning by itself. It gains meaning through:

```text
Omicron notation
frame header
slash path
nomogram scale
receipt
```

This makes OMI meta-circular. The table rewrites interpretation. The interpretation selects the table.

## 5. BiDi Mode

BiDi mode is not only text direction.

In OMI, BiDi means two-directional interpretation:

```text
omi -> imo
imo -> omi
```

or:

```text
CAR -> CDR
CDR -> CAR
```

The same bitboard can be read forward, backward, mirrored, or folded. The data does not need to change. Only the declared route changes.

## 6. The Slash Path

The `/---/` path is where rerouting happens.

The address identity remains:

```text
omi---imo
```

Then the slash path declares how to read it:

```text
omi---imo/<frame>/<control>/<scale>/<relation>/<unit>
```

The slash path is not storage. It is interpretation routing.

## 7. Omi-Nomogram

Omi-Nomogram is the runtime scale selector. It is the equivalent of a slide-rule scale table.

The binary source of truth stays fixed. The selected scale tells the runtime how to interpret the distance, relation, or transformation.

Canonical scale surface:

```text
0x30 identity / unity
0x31 C/D multiply-divide
0x32 A/B square-root
0x33 K cube-root
0x34 folded pi scale
0x35 reciprocal scale
0x36 sine/cosine
0x37 tangent/cotangent
0x38 small-angle / degree-radian
0x39 Pythagorean
0x3A log10
0x3B natural log / exponential
0x3C sexagesimal gate
0x3D arbitrary powers
0x3E quadratic / gnomon
0x3F LFSR / period / replay
```

The scale does not store the result. The scale declares how the result is read.

## 8. Rewrite Geometry

OMI does not begin with data. OMI begins with interpretation.

Traditional computing treats memory as data stored at an address:

```text
RAM[address] = value
```

OMI treats memory as a rewrite relationship:

```text
OMI[orbit,address] = rewrite
```

The fundamental operation is not storage. The fundamental operation is transformation.

The pipe stack follows the same doctrine:

```text
source
-> carrier
-> reconstruction
-> causal proof
-> RS proof
-> acceptance
-> receipt
```

There is no database commit in this chain. The system proves relations and accepts receipts.

## 9. Control Codes as Operators

The ASCII control range:

```text
0x00..0x1F
```

is usually described as thirty-two non-printing characters. OMI treats them as rewrite operators.

Historically, control codes were protocol operations. They described transitions before they became invisible text artifacts.

OMI restores this interpretation: control codes become transformation operators rather than textual characters.

## 10. Printable Characters as Projections

The printable ASCII range:

```text
0x20..0x7F
```

is the visible projection of rewrite operations acting on a finite address space.

The visible character is only the displayed form. The rewrite relation is the underlying structure.

## 11. Rotation and Closure

Traditional systems frequently use shifts. Shifts discard information.

OMI uses rotations. A rotation preserves information. Nothing falls off the edge; the state moves around the wheel.

The canonical transition law is:

```text
Delta_C(x) = rotl(x,1) xor rotl(x,3) xor rotr(x,2) xor C
```

where `C` is the closure variable carried forward through the orbit.

Every orbit leaves a witness. Every rewrite contributes to future rewrites.

## 12. Incidence View

An ASCII table is usually taught as a lookup table. OMI treats it as an incidence system.

Rows are blocks. Code points are points. Relationships are incidences.

The table is no longer merely a lookup structure. It becomes a rewrite structure.

## 13. Doctrine

OMI is not:

```text
a database
a file system
a key-value store
a normal memory table
```

OMI is:

```text
a versioned binary source of truth
loaded as a rewrite table
routed through declared frame headers
interpreted through nomogram scales
accepted only by receipt
```

One-line canon:

```text
OMI does not store data; it preserves versioned sources of truth as binary rewrite tables, then uses Omicron identity, slash-path routing, BiDi interpretation, and Omi-Nomogram scales to produce lawful receipts.
```
