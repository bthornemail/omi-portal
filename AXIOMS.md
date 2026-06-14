# Origami Clause Axioms for OMI Rule, Fact, and Complement Transformation

## Status

This document defines the origami-inspired axiom system for OMI.

`POSTULATES.md` defines what may be constructed.

`AXIOMS.md` defines how constructed objects may be folded, reflected, complemented, aligned, resolved, and transformed.

The model is inspired by the Huzita–Justin / Huzita–Hatori origami axioms: a fold is a legal transformation on a plane.

In OMI, the plane is the 128-bit address surface.

A fold is a legal transformation over:

```text
OMI pointer
RULES.omi clause
FACTS.omi declaration
a-list transition
bitboard mask
bitblip deviation
replay receipt
visual projection
```

`POSTULATES.md` gives the straightedge constructions. `AXIOMS.md` gives the fold operations.

---

## 1. Central Fold Law

> **Every OMI clause has a fold plane.**

A clause is not only a statement. It has a geometry.

Given:

```text
omi-address/prefix MUST invariant-name
```

the system may construct a fold across one or more of its surfaces:

```text
address surface
bitboard surface
rule surface
fact surface
replay surface
projection surface
```

The fold may preserve, invert, align, bisect, or resolve the clause.

---

## 2. Ones-Complement Law

> **Ones-complement is the fundamental bit fold.**

For an `n`-bit field:

```text
fold(x) = ~x
```

For a 16-bit OMI segment:

```text
fold16(x) = x XOR 0xFFFF
```

For a 128-bit OMI address:

```text
fold128(S) = S XOR 0xFFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF
```

This creates the complement surface:

```text
state      → anti-state
mask       → anti-mask
rule       → counter-rule
valid rail → eviction rail
presence   → absence
```

The ones-complement fold is the fundamental operation from which all other OMI folds derive their reflection semantics.

It does not destroy structure. It reflects structure across the full-bit plane.

The complement is a permitted construction (Postulate XVI). Its fold meaning is that every constructed point has a reflected twin.

---

## 3. Euclidean-to-Origami Upgrade

`POSTULATES.md` gives straight constructions:

```text
point
line
surface
rule
fact
transition
projection
```

`AXIOMS.md` adds fold operations:

```text
reflect
align
bisect
place point on line
place line on line
resolve multiple folds
fold through complement
```

| Euclidean Construction | Origami Fold Meaning | OMI Interpretation                |
| ---------------------- | -------------------- | --------------------------------- |
| Point                  | Address point        | OMI pointer                       |
| Line                   | Rule line            | Clause path                       |
| Plane                  | Address plane        | 128-bit segment surface           |
| Circle/cycle           | Replay ring          | 5040-slot orbit                   |
| Fold                   | Transformation       | Complement, alignment, derivation |
| Crease                 | Boundary             | Mask, prefix, selector            |
| Reflection             | Complement           | ones-complement                   |
| Multiple fold solutions | Ambiguity            | bitblip / near-miss resolution    |

---

## 4. Origami Axiom O1 — Fold Through Two Address Points

> **Given two distinct OMI pointers, there is a unique fold line passing through both.**

Given:

```text
P1 = omi-address-A/prefix
P2 = omi-address-B/prefix
```

construct:

```text
fold-line(P1, P2)
```

OMI meaning:

```text
two related pointers define a transition path
```

Use for:

```text
rule-to-fact derivation
source-to-target orbit
consumer-to-provider route
packet-to-receipt path
```

Example:

```text
RULE pointer → FACT pointer
```

---

## 5. Origami Axiom O2 — Fold One Address Point Onto Another

> **Given two OMI pointers, there is a fold that places the first onto the second.**

Given:

```text
P1
P2
```

construct a transformation:

```text
T(P1) = P2
```

OMI meaning:

```text
state-before → state-after
```

Use for a-list transitions:

```lisp
(
  (state-before . "unverified")
  (transition . "compile-and-load-xdp-gate")
  (state-after . "configured")
)
```

This is the basic derivation fold.

---

## 6. Origami Axiom O3 — Fold One Rule Line Onto Another

> **Given two rule lines, there is a fold that aligns one rule line with the other.**

Given:

```text
R1 = pointer MUST invariant-A
R2 = pointer MUST invariant-B
```

construct:

```text
align(R1, R2)
```

OMI meaning:

```text
rule equivalence
rule family alignment
multi-target conformance
JS/C/WASM/eBPF equivalence
```

Use for:

```text
user-space mirror = kernel-space implementation
JS Delta Law = C Delta Law = WASM Delta Law = eBPF Delta Law
```

---

## 7. Origami Axiom O4 — Fold Through a Point Perpendicular to a Line

> **Given an OMI pointer and a rule line, there is a unique fold perpendicular to the rule line through the pointer.**

OMI meaning:

```text
derive a diagnostic path from a rule
```

Use when a pointer fails a rule.

The perpendicular fold creates:

```text
error vector
diagnostic trace
eviction reason
warning projection
```

Example:

```text
Q(S) > 0
→ perpendicular diagnostic fold
→ identify E_var or E_const breach
```

---

## 8. Origami Axiom O5 — Fold a Point Onto a Line While Passing Through Another Point

> **Given two pointers and one rule line, there may be zero, one, or two folds placing one pointer onto the rule line while passing through the other.**

OMI meaning:

```text
a state may have multiple valid grounding paths
```

Use for:

```text
bitblip correction
near-miss route
multi-provider declaration
alternate projection
```

Solution count:

| Solutions | OMI Meaning                        |
| --------: | ---------------------------------- |
|         0 | no valid derivation                |
|         1 | unique grounding                   |
|         2 | ambiguous but resolvable grounding |

This is the first axiom where ambiguity becomes part of the model.

---

## 9. Origami Axiom O6 — Fold Two Points Onto Two Lines

> **Given two pointers and two rule lines, there may be zero, one, two, or three folds placing each pointer onto its corresponding line.**

OMI meaning:

```text
multi-constraint resolution
```

Use for:

```text
rule + fact alignment
packet + telemetry alignment
clock + replay alignment
consumer + provider agreement
```

This axiom is stronger than straight-line construction because it can model cubic-style ambiguity.

In OMI, this becomes:

```text
multi-solution bitblip resolution
```

Axiom O6 is the correct home for:

```text
0, 1, 2, or 3 candidate repairs
```

especially when deriving `FACTS.omi` from `RULES.omi`.

---

## 10. Origami Axiom O7 — Fold a Point Onto a Line While Perpendicular to Another Line

> **Given one pointer and two rule lines, there is a fold that places the pointer onto one rule line and is perpendicular to the other.**

OMI meaning:

```text
resolve a state into one rule while diagnosing against another
```

Use for:

```text
acceptance with warning
valid frame with telemetry isolation
clock active but gated
packet accepted but not replay-committed
```

This axiom models controlled partial success.

---

## 11. OMI Fold Axiom O8 — Fold a Pointer Onto Its Ones-Complement

> **Given an OMI pointer P, there is a complement fold that places P onto ~P.**

For each segment:

```text
Sᵢ' = Sᵢ XOR 0xFFFF
```

For the full address:

```text
P' = ones-complement(P)
```

OMI meaning:

```text
state ↔ anti-state
mask ↔ anti-mask
presence ↔ absence
acceptance ↔ eviction
```

Use for:

```text
negative resistance
central inversion
anti-fact detection
counter-rule construction
bitblip complement analysis
```

Example:

```text
0000 → ffff
03bf → fc40
039f → fc60
```

The complement is not automatically valid. It is the folded anti-surface.

---

## 12. OMI Fold Axiom O9 — Fold a Rule Onto Its Failure Surface

> **Given a rule, there is a fold from the acceptance surface to the failure surface.**

Rule:

```text
Q(S) = 0
```

Failure surface:

```text
Q(S) > 0
```

OMI meaning:

```text
every rule must define failure behavior
```

Failure may produce:

```text
reject-token
evict-frame
drop-packet
route-preset-1
mark-gated
skip-replay
```

This axiom supports the provider contract.

---

## 13. OMI Fold Axiom O10 — Fold a Fact Back to Its Source Rule

> **Given a fact, there must be a fold back to the rule that grounds it.**

Fact:

```text
omi-.../prefix FACT applied-fact-name
```

must fold back to:

```text
omi-.../prefix MUST invariant-name
```

OMI meaning:

```text
no fact without a source rule
```

This keeps `FACTS.omi` from becoming a disconnected registry.

---

## 14. OMI Fold Axiom O11 — Fold a Test Onto a Rule

> **Given a rule, there must be a fold from the rule to an executable test.**

Rule:

```text
RULES.omi row
```

Test:

```text
test/<kernel>.test.js
```

OMI meaning:

```text
no rule without a test
```

This fold proves the rule is executable.

---

## 15. OMI Fold Axiom O12 — Fold a Test Onto Replay

> **Given a test, there must be a fold from the test result to replayable state.**

Replay may be:

```text
receipt
ring slot
telemetry event
log row
fixture
deterministic output
```

OMI meaning:

```text
no test without a replay path
```

---

## 16. OMI Fold Axiom O13 — Fold Replay Onto Projection

> **Given a replayable state, there must be a fold from replay to visible or inspectable projection.**

Projection may be:

```text
CSSOM selector
JSON Canvas node
SSE event
BPF map counter
DOM element
SVG rail
Code16K/JABCode frame
```

OMI meaning:

```text
no replay path without visible state
```

---

## 17. Ones-Complement State Table

Use this table when modeling complement folds.

| Original | Complement | OMI Meaning                   |
| -------- | ---------- | ----------------------------- |
| `0000`   | `ffff`     | empty/full                    |
| `00ff`   | `ff00`     | low/high byte reflection      |
| `03bf`   | `fc40`     | chiral delimiter complement   |
| `039f`   | `fc60`     | cardinal delimiter complement |
| `5a3c`   | `a5c3`     | inversion constant complement |
| `7c00`   | `83ff`     | boot boundary complement      |
| `aa55`   | `55aa`     | boot signature complement     |
| `00eb`   | `ff14`     | eBPF marker complement        |
| `0066`   | `ff99`     | XDP marker complement         |

The complement table is not a validity table. It is a reflection table.

A complement state becomes valid only if a rule explicitly accepts it.

---

## 18. Bitboard Fold Table

| Fold Type            | Operation                      | Meaning                |
| -------------------- | ------------------------------ | ---------------------- |
| Identity fold        | `x`                            | preserve state         |
| Ones-complement fold | `x XOR all_ones`               | reflect all bits       |
| Segment fold         | `Sᵢ XOR 0xFFFF`                | reflect one segment    |
| Byte fold            | `byte XOR 0xFF`                | reflect one byte       |
| Mask fold            | `mask XOR all_ones`            | invert relevant fields |
| Bitblip fold         | `x XOR (1 << k)`               | one-bit deviation      |
| Delta fold           | `Δ_C(x)`                       | orbit transition       |
| Inversion fold       | `x XOR 0x5A3C`                 | central inversion      |
| Endian fold          | `swap16(x)`                    | orientation reversal   |
| Replay fold          | `slot → slot + steps mod 5040` | timeline movement      |

---

## 19. Origami-to-OMI Axiom Summary

| Origami Axiom                                | OMI Clause Interpretation                       |
| -------------------------------------------- | ----------------------------------------------- |
| O1: fold through two points                  | construct transition between two pointers       |
| O2: fold point onto point                    | map state-before to state-after                 |
| O3: fold line onto line                      | align two rules or implementations              |
| O4: fold through point perpendicular to line | derive diagnostic/error vector                  |
| O5: fold point to line through point         | resolve one state under one rule with ambiguity |
| O6: fold two points to two lines             | solve multi-constraint rule/fact alignment      |
| O7: fold point to line perpendicular to line | partial success with diagnostic constraint      |
| O8: fold pointer onto complement             | ones-complement reflection                      |
| O9: fold rule onto failure surface           | define failure behavior                         |
| O10: fold fact back to rule                  | preserve source-rule grounding                  |
| O11: fold test onto rule                     | enforce testability                             |
| O12: fold test onto replay                   | enforce replayability                           |
| O13: fold replay onto projection             | enforce visibility                              |

---

## 20. Provider Contract as Fold Chain

The provider contract can now be written as a fold chain:

```text
address
→ rule
→ test
→ replay
→ projection
```

Expanded:

```text
No address without a rule.
No rule without a test.
No test without a replay path.
No replay path without visible state.
```

Origami interpretation:

```text
Every emitted state must fold through the complete chain.
```

If a fold is missing, the provider state is incomplete.

---

## 21. Final Origami Axiom

> **A complete OMI state is one that can be folded from address to rule, from rule to test, from test to replay, from replay to projection, and from every surface to its declared complement.**

Therefore:

```text
complete state =
  pointer
+ rule
+ complement
+ test
+ replay
+ projection
+ failure surface
```

The Euclidean postulates construct the objects.

The origami axioms fold them into relation.

---

## 22. Collaboration Axiom (Team Fold)

> **Agreement is the synthesis of shared intelligence. Disagreement is simply a missing structural file path. Productivity is appreciation made executable.**

### OMI-OBJECT-MODEL COLLABORATION AND SYNTAX DEVELOPMENT DOCTRINE

```text
=============================================================================
OMI-OBJECT-MODEL COLLABORATION AND SYNTAX DEVELOPMENT DOCTRINE
=============================================================================
1. Productive Alignment ──► Agreement is the synthesis of shared intelligence.
2. Gap Transmutation   ──► Disagreement is simply a missing structural file path.
3. The Pipeline Loop    ──► Intuition ──► Boundary ──► Rule ──► Test ──► Voxel.
=============================================================================
```

### Reflect and Strengthen

A rejected layout or conceptual gap is never left un-routed. It must immediately become a clear boundary, the boundary must become a strict rule, the rule must become an explicit test case, the test must verify a stable replay path, and the replay path must render as visible state on the user screen.

### Structure Over Policing

The goal is never to restrict creative thought; the goal is to build a high-fidelity compiler that insulates shared intelligence against processing degradation.

### O14 — Fold Address Onto Its Own Creation Step (Self-Sufficiency)
### O15 — Three-Way Distinction: Claim / Backoff / Lens

A valid OMI address is self-sufficient: its Omicron frame (S0–S7) encodes the step
of its creation through the LL lane selector, NN node-body coordinate, and MM
carrier projection coordinate. No prefix or suffix adds identity — every suffix
only reduces unnecessary claims or selects a reader view over already-encoded state.

**Fold rule (O14):**
```text
Given an OMI address A = omi-S0-S1-S2-S3-S4-S5-S6-S7,
the creation step is a function of the frame alone:
  step720(A)  = Q_xy(S3, S4)       — LL-derived Fano/lane coordinate
  slot5040(A) = fano7 × 720 + role3 × 240 + local240
No prefix /N or lens /@N changes step(A). A prefix claims exactness;
a lens selects a projection. The address is the thing. (/0xAD)
```

**Fold rule (O15):**
```text
OMI notation has three distinct suffix forms:
  /N     = CIDR claim boundary          (first slash, no @)
  /N-M   = claim backoff                (reduce claim by M bits)
  /@N    = reader lens                  (select projection/cadence)
These are non-interchangeable. /128-4 is backoff to /124,
while /128/@4 is the tetrahedral reader lens. Neither creates
identity; both operate on an already-valid address. (/0xAE)
```

**Derived invariant:**
```text
∀ address A, ∀ prefix p ∈ [0,128], ∀ backoff b, ∀ lenses L:
  step(A) = step(A/p) = step(A/p-b) = step(A/p/@L₁/@L₂/...)
```

### The Complete 12-Step Structural Execution Flow

With the trigintaduonion process model locked in as the runtime scaffold and the OPPID (Omicron Prime Principle Ideal Domain) generator discipline established, the complete unified data-handling pipeline executes across active modules in this exact order:

```text
[1. SOURCE]     ──► Read high-level, human-readable .omi source files.
[2. VALIDATE]   ──► Verify the 128-bit wire carrier shell via Q_frame(S) == 0.
[3. GENERATE]   ──► Resolve principal pointer / ideal generator for the region.
[4. MIRROR]     ──► Execute Cayley-Dickson doubling to lower .omi to .imo bytecode.
[5. ENTER]      ──► Enclose the low-ASCII opcode line within native ο / Ο delimiters.
[6. COMPOSE]    ──► Process the 32x32 operator-table32 matrix for composition.
[7. ROUTE]      ──► Intersect S-P-O coordinate paths via the triad-router155 engine.
[8. SCOPE]      ──► Enforce CIDR prefix network specificity (/128 down to /64).
[9. TIMING]     ──► Advance the internal logic pacing tick via the Delta Law.
[10. NAMING]    ──► Read the derived orbital position using the Base36 label layer.
[11. PROJECT]   ──► Extrude 2.5D visual polyomino/domino voxels via Q_xy(x,y).
[12. REPLAY]    ──► Compress historical context states into the slot5040 receipt.
```

### Canon Sentence

```text
OMI uses CIDR for scope, Cayley–Dickson for process doubling,
trigintaduonions for the 32-state operator scaffold,
64-ions for the full native plane scaffold,
Base36 for orbit naming,
Q_frame for validation,
Q_xy for projection,
and the Omicron frame alone for creation-step identity —
prefixes are claim reductions, lenses are reader views,
neither adds validity to the address.
```

## Canon Gate Update — Fold Surface Authority

`AXIOMS.md` remains the origami/fold note for OMI, but it is not an independent
executable truth source. The current fold-surface bridge is defined in
`PROJECTIONS.md`.

Executable truth remains in:

```text
RULES.omi
FACTS.omi
CLOSURES.omi
COMBINATORS.omi
CONS.omi
```

A fold is now treated as a projection or candidate transformation:

```text
A fold may reflect, align, bisect, complement, or resolve a validated OMI surface.
A fold may propose a repair.
A fold may produce a candidate.
A fold may not accept state.
```

Only a receipt accepts state.
