# Documentation Surfaces

## Relationship Between `omi-portal` and `o---o`

This repository, `omi-portal`, is the OMI implementation and collaboration application surface.

The companion documentation repository, `o---o`, is the abstract protocol and derivation surface.

The boundary is:

```text
omi-portal = implementation / collaboration application surface
o---o      = abstract protocol / documentation / derivation surface
```

Short doctrine:

```text
o---o abstracts the doctrine.
omi-portal proves and exercises the doctrine.
```

---

## 1. Role of `omi-portal`

`omi-portal` asks:

```text
How do people collaborate through OMI?
```

It is the place for:

```text
browser surfaces
object inbox
request-for-collaboration UI
runtime kernels
RULES.omi
FACTS.omi
CLOSURES.omi
COMBINATORS.omi
CONS.omi
CONFIGURATIONS.omi
SSE/WebSocket/MQTT bridges
ESP32, QEMU, x86_64, and browser target implementations
tests, fixtures, telemetry, receipts, and projections
```

The purpose of `omi-portal` is to make the protocol usable as a living collaboration machine.

---

## 2. Role of `o---o`

`o---o` asks:

```text
What is the OMI protocol?
```

It is the place for:

```text
canonical doctrine
address grammar
Horn-clause derivation model
schema definitions
protocol architecture
document-based collaboration
abstract memory surfaces
self-enclosed omi---imo documents
```

Examples of `o---o` artifacts:

```text
OMI_ADDRESS_DERIVATION_PROTOCOL.md
OMI_DECLARATIVE_LOOKUP_TABLE_PROTOCOL.md
schemas/
canonical protocol notes
abstract derivation records
```

The purpose of `o---o` is to make the protocol inspectable, forkable, teachable, and documentable.

---

## 3. Boundary Rule

The two repositories must not collapse into each other.

```text
The documentation repo defines the protocol.
The portal repo instantiates the protocol.
Neither replaces the other.
```

`omi-portal` should not become an unstructured transcript archive.

`o---o` should not become the main runtime application.

Instead:

```text
omi-portal keeps the implementation surface executable.
o---o keeps the abstract surface clean.
```

---

## 4. Root Workspace Doctrine

`omi-portal` is the implementation root.

It should preserve:

```text
existing POS graph channel behavior
WordNet synset cells as semantic centroid identity
OMI projection and indexing as a bridge layer
POSTULATES → AXIOMS → DECLARATIONS ordering
RULES → FACTS → CLOSURES → COMBINATORS → CONS lookup-table discipline
```

The portal is where abstract doctrine becomes:

```text
working code
browser state
runtime memory
network events
kernel gates
telemetry
visual projections
receipts
```

---

## 5. Declarative Lookup Table Bridge

The bridge between the repositories is the OMI declarative lookup table model:

```text
RULES constrain.
FACTS declare.
CLOSURES bound.
COMBINATORS transform.
CONS folds.
CONFIGURATIONS bind runtime.
Receipts accept.
```

In `o---o`, this is protocol doctrine.

In `omi-portal`, this is executable root material.

The current strict native identity and route model is:

```text
omi---imo
omi-<frame>-imo/<control>/<scale>/<relation>/<unit>
ο<ffff><127><0><0><1>Ο
```

Meaning:

```text
omi---imo = binary rewrite identity
/---/ = routed interpretation path
?---? = external payload or stream attachment
frame = route boundary
control = gauge row / machine scope
scale = predicate, POS, synset, geometry, or reader scale
relation = Horn-clause edge, incidence relation, or receipt path
unit = feature, slot, measurement, or continuation
ο / Ο = chiral entry and cardinal closure
```

CIDR-like `/N` claims and `/@N` reader lenses are adapter/reduction surfaces. They do not create native identity.

---

## 6. Collaboration Surface Relationship

`omi-portal` supports application-based collaboration.

`o---o` supports document-based collaboration.

Application collaboration means:

```text
people can submit, inspect, route, accept, export, and replay OMI objects through a working surface
```

Document collaboration means:

```text
people can inspect, edit, fork, and refine the protocol itself
```

Together:

```text
omi-portal is the public collaboration application surface.
o---o is the abstract self-enclosed OMI document surface.
```

---

## 7. Non-Collapse Doctrine

```text
Projection is not authority.
Implementation is not doctrine.
Doctrine is not proof.
Proof is not collaboration.
Collaboration is not possession.
Receipt accepts.
```

`o---o` may define a rule.

`omi-portal` must prove it through executable implementation, tests, projections, and receipts.

`omi-portal` may reveal new implementation facts.

`o---o` may later absorb those facts as doctrine only after they are named, bounded, and reduced into canonical documents.

---

## 8. Canonical Repo Map

```text
omi-portal
  concrete implementation
  object inbox
  browser surfaces
  runtime kernels
  lookup tables
  live collaboration

o---o
  abstract protocol
  derivation grammar
  schemas
  documentation surfaces
  document collaboration
```

One-line canon:

```text
omi-portal is the living OMI collaboration machine; o---o is the abstract OMI memory/protocol book.
```
