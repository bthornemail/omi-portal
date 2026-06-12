# OMI Doctrine

## Part I — Root Doctrine

## 1. Status

This is the canonical root doctrine for OMI.

The root [MANIFESTO.md](MANIFESTO.md) gives the orientation. This file states the doctrine: the invariant ontology, the rewrite topology, and the boundary between doctrine and derived mathematics.

OMI is not a database. It is a versioned rewrite register.

Compact form:

```text
OMI is not a database. It is a rewrite register.
```

The doctrine is the collapse. Gauge tables, factorial towers, the 240 bridge, the 5040 ring, Miquel configurations, 20736 hyper-configurations, Fano selectors, quadratic laws, and error-correcting lattices are consequences of the doctrine, not the doctrine itself.

## 2. The OMI Collapse

The history of computing advances through the collapse of artificial distinctions.

Lisp collapsed:

```text
program <-> object
```

The artifact of this collapse is the S-expression. Code may be treated as data. Data may be treated as code.

POSIX collapsed:

```text
storage <-> communication
```

The artifact of this collapse is the file descriptor. A file, pipe, terminal, device, or socket may all be accessed through the same interface.

OMI collapses:

```text
representation <-> interpretation
```

The artifact of this collapse is the rewrite surface. The same binary source may be interpreted through multiple lawful readings without changing the source itself.

## 3. The OMI Principle

The binary source remains.

The reading changes.

Computation is the lawful rewrite of interpretation rather than the mutation of data.

Traditional systems treat computation as mutation:

```text
input
  |
transformation
  |
output
```

OMI treats computation as reinterpretation:

```text
source
  |
notation
  |
reading
  |
receipt
```

The source remains unchanged. The reading rotates. The rewrite is the computation.

## 4. Notation as Cipher

A notation declares how a surface shall be read.

A cipher declares how a surface shall be transformed.

OMI removes the distinction:

```text
notation as cipher
cipher as notation
```

A cipher is any lawful transformation of interpretation. A notation is any lawful declaration of interpretation.

The same binary surface may be viewed through multiple lawful readings without changing the source itself.

Shortest form:

```text
OMI is notation as cipher and cipher as notation.
```

## 5. Rewrite Topology

The database view says:

```text
address -> data
```

The OMI view says:

```text
address -> rewrite context
```

or more precisely:

```text
address -> interpretation surface
```

The address is not where information is stored. The address is where interpretation begins.

Canonical flow:

```text
source
-> notation
-> interpretation
-> validation
-> receipt
```

The register form is:

```text
source of truth -> rewrite table -> routed interpretation -> receipt
```

The object is not stored data. The object is the lawful transformation of a declared binary source of truth.

Traditional computing stores values and computes transformations.

OMI registers transformations and computes values.

The binary source of truth remains fixed. Meaning emerges from the declared rewrite path through the register.

## 6. Strict Architecture Pipeline

OMI separates the invariant ontology from its mathematical instantiation:

```text
Level 5: Implementations  - gauge tables, 240 bridge, 20736 hyper-configuration
Level 4: Addressing       - omi---imo, slash-path routing, frame buffers
Level 3: Topology         - projective closure, Fano coordinates
Level 2: Dynamics         - canonical Delta_C orbit steps
Level 1: Surface          - representation <-> interpretation
Level 0: Doctrine         - notation <-> cipher
```

Level 0 is the ontological core: meaning and mechanism are not separate. A representation does not contain inherent semantic truth; it contains structural truth that must be unlocked by an active reading context.

Level 1 is the material interface. Text streams and binary arrays are coordinate surfaces. Control codes, byte-order marks, direction markers, and frame headers are operational switches that rotate the lens.

Level 2 is the kinematic operator. Rotation preserves information through state transitions. The carried closure witness records path history.

Level 3 is the topological boundary. Finite computational spaces are wheels with projective closure.

Level 4 is the protocol wire. Addressing is the execution of a path.

Level 5 is the mathematical substrate. Specific lattices, gnomons, bridges, rings, selectors, and hyper-configurations are implementation choices. They can evolve without changing the doctrine.

Part I is the root doctrine. It states the invariant collapse.

Part II is the consequence layer. It explains how the doctrine unfolds into rewrite registers, rotation laws, projective closure, addressing, nomogram scales, pipe proofs, and receipts.

Future implementations may revise Part II without changing Part I.

## Part II — Doctrinal Consequences

## 7. Binary Sources of Truth

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

## 8. No Database Layer

OMI should avoid pretending it is a database.

It is closer to:

```text
versioned source
rewrite table
ring register
nomogram scale
receipt machine
rewrite topology
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

## 9. Rewrite Surface

A rewrite surface is a binary source viewed through an active notation.

Examples include:

```text
ASCII
Unicode
UTF-EBCDIC
BiDi
BOM markers
frame headers
control characters
routing declarations
floating-point exponent fields
Lisp nil
```

These structures are not primarily carrying data. They are carrying interpretation.

They do not necessarily change data. They change how data is read. OMI therefore treats them as computational operators.

## 10. Rotation Instead of Mutation

A shift discards information.

A rotation preserves information.

The canonical law is:

```text
Delta_C(x) = rotl(x,1) xor rotl(x,3) xor rotr(x,2) xor C
```

where `C` is the carried closure witness of the orbit.

Nothing falls off the edge. The edge returns through the orbit.

Every orbit leaves a witness. Every rewrite contributes to future rewrites.

## 11. Projective Closure

Finite computational spaces possess closure.

A wheel of sixteen states contains:

```text
15 active states
1 closure state
```

A wheel of eight states contains:

```text
7 active states
1 closure state
```

The closure state is not absent. It is the projective center through which the orbit returns.

OMI reads nested state spaces as nested projective closures:

```text
0x00..0x0F  -> 4-bit closure
0x00..0x1F  -> 32-state control/operator closure
0x00..0x7F  -> 128-character ASCII closure
0x00..0xFF  -> 256-byte closure
```

Each level contains the previous level as a coordinate frame.

## 12. Lisp Nil and Closure

In Lisp:

```lisp
nil == ()
```

The empty list is simultaneously:

```text
atom
list
```

OMI treats closure the same way. Closure is simultaneously inside and outside the system.

The `0x00` cell and the `0000` state are not nothing. They are closure.

## 13. Sign, Exponent, Significand

Floating-point formats expose a reusable structural pattern:

```text
sign
exponent
significand
```

Under OMI, the same pattern can be read as:

```text
selector
address
payload
```

or:

```text
notation
context
surface
```

or:

```text
omi
path
imo
```

The binary layout remains. The declared reading changes.

## 14. BiDi Mode

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

## 15. The Slash Path

The `/---/` path is where rerouting happens.

The address identity remains:

```text
omi---imo
```

Then the slash path declares how to read it:

```text
omi-<frame>-imo/<control>/<scale>/<relation>/<unit>
```

The slash path is not storage. It is interpretation routing.

## 16. Omi-Nomogram

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

## 17. Control Characters

ASCII control characters are rewrite operators.

They are not merely non-printing characters.

Historically they altered the state of a receiver.

OMI restores this interpretation.

In conventional language, control codes were thirty-two non-printing characters. In OMI, control codes become transformation operators rather than textual characters.

Control characters are operational geometry.

## 18. Unicode

Unicode is not merely a character set.

Unicode is a rewrite manifold.

Planes, surrogates, private-use ranges, direction markers, byte-order marks, and framing operators define lawful transitions between interpretations of the same binary source.

Rows are blocks. Code points are points. Relationships are incidences.

The table is no longer merely a lookup structure. It becomes a rewrite structure.

## 19. Downward Execution Flow

When an application verifies a transaction or routes an agent state, it may begin with a Level 5 implementation rule.

The runtime compiles that rule downward:

```text
Level 5 implementation rule
-> Level 4 operational address route
-> Level 3 discrete coordinate wheel
-> Level 2 information-preserving rotation
-> Level 1 stream boundary and control surface
-> Level 0 notation-cipher invariant
```

The final check is doctrinal: the underlying binary platform did not need to mutate. The system generated a receipt showing that the interpretive framework transitioned lawfully.

## 20. Upward Invariant Flow

When a node receives a packet, it does not need to trust Level 5 application meaning first.

It validates upward:

```text
source identity
-> rotation law
-> projective boundary
-> address route
-> implementation meaning
-> lawful receipt
```

If the structural math holds as a valid projection, the node may issue a lawful receipt. Higher-order meaning is accepted because the lower-level rewrite path is valid.

## 21. Pipe Stack

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

## 22. Doctrine Statement

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
