# Tetragrammatron Polyharmonic Governor Axis

Status: filed reference synthesis  
Layer: dev-docs source/reference  
Current implementation impact: documentation only

## Naming

Canonical name: **Tetragrammatron Polyharmonic Governor**.

The centrifugal-governor language is retained as an explanatory metaphor: the
governor regulates notation by feeding representation and operation back into
one another. It is a meta-circular centrifugal governor for OMI notation, not a
mechanical simulation and not a physics claim.

The polyharmonic name is preferred because the governor coordinates multiple
operation means over one source-preserving OMI frame.

Algebraic appendix terms: magma, quasigroupoid, quasi-generator.

Queryable reference metadata lives in:

```text
src/omi/tetragrammatron-polyharmonic-governor.js
```

That module exports frozen constants and deterministic lookups only. It does
not validate frames, accept receipts, or alter compiler lowering.

This document summarizes the Tetragrammatron polyharmonic governor model from
the current research conversation. It is not a new canonical root, not a
physics claim, not a runtime API, and not a request to add compiler keywords.
It is a compact interpretation guide for how the existing five OMI declaration
roots can be read as dimensional governors.

## Core Claim

The Tetragrammatron does not add five independent clocks.

It separates three clocks, four visible offsets, and five governor modes.

The observer sees offsets. The machine follows sequence. The governor compares
both sides of the equation. Receipt accepts only replay-stable readings.

## Three, Four, and Five

The model separates three different counts:

```text
3 clocks:
  Atomic Logic Clock
  Spectral Observer Clock
  Cosmic Orbit Clock

4 visible offsets:
  0x0001
  0x0010
  0x0100
  0x1000

5 governor modes:
  FACTS
  RULES
  CLOSURES
  COMBINATORS
  CONS
```

The four offsets are the visible ququart lanes. The fifth governor is the
hidden Genesis equality frame.

## Three Clocks

The timing surface has three computational clocks:

| Clock | Plane | Function |
| --- | --- | --- |
| Atomic Logic Clock | `4y²` | Low-plane carry, nibble, and local cell exactness. |
| Spectral Observer Clock | `16xy` | Bridge-plane projection and observer-frame comparison. |
| Cosmic Orbit Clock | `60x²` | High-plane periodic orbit and block closure. |

These names refine the earlier carry/frame/phase language:

```text
Carry Clock -> Atomic Logic Clock
Frame Clock -> Spectral Observer Clock
Phase Clock -> Cosmic Orbit Clock
```

## Four Visible Offsets

The visible timing offsets are:

```text
0x0001
0x0010
0x0100
0x1000
```

They are read as the FS/GS/RS/US lanes:

| Offset | Lane | Reading |
| --- | --- | --- |
| `0x0001` | FS | Source/frame seed lane. |
| `0x0010` | GS | Group/generator lane. |
| `0x0100` | RS | Relation/receipt lane. |
| `0x1000` | US | Unit/userspace lane. |

The four offsets are the visible ququart surface. They do not replace the five
governors.

## Five Polyharmonic Governors

The five governors use generalized-mean exponents as operation labels:

| Root | Exponent | Governor | Dimensional Role | Operational Question |
| --- | ---: | --- | --- | --- |
| `FACTS.omi` | `p=-1` | Harmonic Governor | Inverse ground / reciprocal constraint | What must be true beneath the object? |
| `RULES.omi` | `p=0` | Geometric / Genesis Governor | Equality pivot / hidden 5-cell center | What relation permits the transformation? |
| `CLOSURES.omi` | `p=1` | Arithmetic Governor | Sequential frame count / document clock | Has the path completed in order? |
| `COMBINATORS.omi` | `p=2` | Quadratic Governor | Binary quadratic relation surface | How do grounded terms compose? |
| `CONS.omi` | `p=3` | Cubic / Qubic Governor | Runtime object body / carrier extension | What object has the relation become? |

The exponent labels are computational operation modes. They are not physical
constants and do not create validation authority.

## Circular Inverse Rule

FACTS and CONS are inverse projections in the circular model:

```text
FACTS <-> CONS
```

FACTS read the object from below as reciprocal constraint.
CONS reads the relation from above as runtime body.

FACTS ask:

```text
What must be true beneath the object?
```

CONS asks:

```text
What object has this relation become?
```

RULES form the Genesis equality pivot between the inverse and forward readings.
CLOSURES provide monotone sequence. COMBINATORS provide the quadratic bridge.
CONS gives the accepted relation runtime body.

Readable as:

```text
FACTS ground.
RULES permit.
CLOSURES seal.
COMBINATORS compose.
CONS embodies.
```

Or in existing OMI canon:

```text
Rules declare.
Facts ground.
Closures seal.
Combinators compose.
CONS reduces.
```

## Dimensional Ladder

The governor axis gives the Tetragrammatron a computational dimensional ladder:

```text
p=-1  FACTS        point of ground / inverse constraint
p=0   RULES        Genesis equality / hidden center
p=1   CLOSURES     line of sequence / frame count
p=2   COMBINATORS  surface of relation / quadratic composition
p=3   CONS         volume of object / cubic runtime projection
```

The visible ququart gives four offsets. The governor axis gives the hidden
fifth point.

## 5-Cell Timing Frame

```text
4 visible offsets + 1 hidden Genesis governor = 5-cell timing frame
```

The hidden `5!` is the permutation space of the five governor positions. The
model reads the five canonical OMI roots as governor positions, not as new roots
or new runtime keywords.

## Boundary

This model is reference guidance for implementation thinking. It must preserve:

```text
lower Omicron frame validation
Q_frame before Q_xy projection
POS graph channel behavior
WordNet synset centroid identity
CONS as canonical reduction/lookup
vectors/*.omi as generated proxy configs
```

The polyharmonic governor axis explains how the five roots can be read. It does
not add a sixth root, rewrite `.omi` lowering, or replace current graph
semantics.
