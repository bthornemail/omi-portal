# OMI Ququart Interpretation Machine

## Core Distinction

OMI is not a quantum computer.

OMI is a ququart-style interpretation machine.

It does not create physical quantum superposition.

It organizes lawful digital interpretation through a four-state register:

```text
source -> notation -> reading -> receipt
```

The ket notation:

```text
|omi---imo>
```

names the closed interpretation register: the source-preserving boundary through which readings may rotate and return.

---

## The Four-State OMI Register

| State | Name      | Role                                    |
|-------|-----------|------------------------------------------|
| `|0>` | Source    | Versioned binary truth                   |
| `|1>` | Notation  | Declared reading surface / lens          |
| `|2>` | Reading   | Active interpretation route              |
| `|3>` | Receipt   | Accepted fixed point                     |

The closure:

```text
|omi---imo>
```

is not a physical superposition of these states.

It is the register itself.

It is the interpretation boundary that preserves the source while allowing lawful readings to rotate, validate, and return.

---

## OMI Basis vs Quantum Basis

| Aspect        | Quantum ququart            | OMI interpretive ququart                |
|---------------|----------------------------|-----------------------------------------|
| Basis states  | Physical quantum states    | Lawful interpretation states            |
| Superposition | Physical amplitude mixture | Multiple candidate readings             |
| Measurement   | Observational collapse     | Receipt validation                      |
| Entanglement  | Correlated quantum systems | Closure / receipt correlation           |
| Decoherence   | Environmental noise        | Fragment loss, drift, missing context   |
| Recovery      | Quantum error correction   | MCRSGSP reconstruction and proof replay |
| Idempotence   | Projection behavior        | `R(R(S)) = R(S)`                        |

The analogy is structural.

It is not a claim that OMI performs quantum computation.

---

## Interpretive Superposition

Before receipt, a binary source may admit several lawful candidate readings.

The same source may be read as:

```text
text
address
instruction
proof
graph
route
nomogram
rewrite table
receipt
```

These readings are not different sources.

They are different interpretations of the same source.

OMI does not require the source to mutate.

It requires the reading to be declared, routed, validated, and receipted.

Thus interpretive superposition means:

```text
one source
many possible lawful readings
one accepted receipt
```

---

## Receipt as Measurement

In OMI, measurement is not visual observation.

Measurement is receipt.

A reader may recognize a projection.

A resolver may promote a candidate.

Only a receipt accepts a lawful interpretation.

The receipt collapses the interpretive register into an accepted fixed point:

```text
source -> notation -> reading -> validation -> receipt
```

Once accepted, replaying the same lawful rewrite must return the same accepted identity.

This is the idempotent receipt law:

```text
R(R(S)) = R(S)
```

Where:

```text
S  = versioned binary source
R  = lawful routed rewrite operator
R(S) = accepted receipted interpretation
```

---

## Receipt Replay Stability

The core invariant is Receipt Replay Stability:

```text
same source
same notation
same reading
same result
-> same receipt
```

Replaying the same interpretation pipeline against the same source authority produces the same receipt commitment.

OMI does not compute by mutating the source. It computes by replaying a declared interpretation route until the receipt commitment is stable.

---

## Ququart Arithmetic

OMI finite spaces repeatedly appear as powers of four.

```text
16      = 4^2
64      = 4^3
256     = 4^4
1024    = 4^5
65536   = 4^8
```

In OMI terms:

```text
16 states  = two-ququart coordinate surface
64 states  = three-ququart coordinate surface
256 states = four-ququart coordinate surface
1024       = five-ququart local rewrite ring
65536      = eight-ququart reference space
```

This does not make the system quantum.

It means the interpretation geometry is naturally ququart-structured.

OMI uses four-state interpretation coordinates to build larger finite rewrite surfaces.

---

## Closure Correlation

The carried closure variable:

```text
C
```

is not physical entanglement.

It is closure correlation.

It records path history across the orbit.

Each rewrite leaves a witness.

Each witness constrains future interpretation.

In this sense, OMI states can be correlated by:

```text
shared source
shared route
shared closure
shared proof
shared receipt
```

This is causal, replayable, and inspectable.

It is not nonlocal quantum action.

---

## Degradation and Recovery

The environment may degrade.

Fragments may be missing.

Routes may be incomplete.

Projections may disappear.

MCRSGSP provides candidate recovery:

```text
fragments -> reconstruction -> causal closure -> proof replay -> candidate
```

OMI then decides acceptance:

```text
candidate -> validation -> receipt
```

The source identity survives because the receipt can be replayed back to the same idempotent interpretation.

The system does not depend on a perfect environment.

It depends on enough lawful structure to recover the accepted reading.

---

## The Canon Lifecycle

The OMI execution cycle replaces the transactional database commit with a deterministic proof loop.

1. Mount versioned source platform.
2. Evaluate candidate-reading set.
3. Route through declared notation and Omi-Nomogram scale.
4. Produce result commitment.
5. Emit receipt binding source, notation, reading, and result.
6. Replay the same route to confirm receipt stability.

The source remains untouched, the reading rotates, and the receipt provides a replayable, tamper-evident commitment to the accepted interpretation.

---

## Reference Implementation

- Runtime anchor: `src/omi/ququart-machine.ts`
- Test anchor: `test/ququart-machine.test.ts`
- Status: deterministic structural model, not quantum computation

---

## Canon Statement

OMI is a ququart-style interpretation machine: a four-state symbolic register in which a versioned binary source is read through notation, interpreted through a lawful route, and accepted by receipt. It is not a quantum computer. It uses ket-like notation to describe finite interpretation states, not physical quantum states. The source remains; the reading changes; the receipt returns as the idempotent fixed point.

---

## Short Form

```text
OMI is not quantum.
OMI is ququart-structured interpretation.
```

## Shortest Form

```text
|omi---imo> = the receipted closure of interpretation
```

or:

```text
source -> notation -> reading -> receipt
```
