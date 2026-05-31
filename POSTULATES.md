# Euclidean Construction Postulates for OMI Rule and Fact Derivation

## Status

This document defines the constructive postulates of OMI.

A postulate is a permitted construction. It states what may be drawn, extended, connected, projected, derived, or grounded inside the OMI system.

This document sits between `ONTOLOGY.md` and `AXIOMS.md`.

```text
ONTOLOGY.md     explains what OMI is.
POSTULATES.md   explains what OMI permits us to construct.
AXIOMS.md       explains how constructed objects may be folded, reflected, and transformed.
DECLARATIONS.md explains how RULES.omi clauses become FACTS.omi rows.
RULES.omi       stores normative declarations.
FACTS.omi       stores grounded declarations.
```

`POSTULATES.md` is Euclid-inspired: it defines construction permissions, not every rule.

---

## 1. Euclidean Analogy

Euclid begins by defining points, lines, and circles, then states what constructions are permitted.

OMI begins with address pointers, clauses, masks, receipts, and projections.

The equivalent OMI stack is:

| Euclidean Role | OMI Role                          |
| -------------- | --------------------------------- |
| Point          | OMI pointer                       |
| Line           | Rule path or state transition     |
| Circle         | Bounded replay/orbit cycle        |
| Plane          | Address/prefix surface            |
| Construction   | Derived declaration               |
| Proposition    | Rule/fact theorem proven by tests |
| Diagram        | CSSOM/Canvas/telemetry projection |

Therefore:

```text
OMI postulate = permitted construction over addressable state
```

---

## 2. Central Postulate

> **From any valid OMI pointer, a rule path may be constructed.**

An OMI pointer is not only a label. It is a constructible point in the protocol space.

Given:

```text
omi-S0-S1-S2-S3-S4-S5-S6-S7/prefix
```

the system may construct:

```text
rule binding
state transition
bitboard mask
bitblip policy
test path
replay receipt
visible projection
```

This central postulate is the foundation of provider conformance.

---

## 3. Postulate I — Address Point Construction

> **An OMI pointer may be constructed from eight 16-bit segments and a prefix.**

Canonical form:

```text
omi-<S0>-<S1>-<S2>-<S3>-<S4>-<S5>-<S6>-<S7>/<prefix>
```

Requirements:

```text
S0..S7 are hexadecimal segment fields
prefix scopes the pointer
the pointer is stable enough to cite, test, and project
```

Provider obligation:

```text
Do not emit state without an address pointer.
```

Consumer interpretation:

```text
The pointer is the point from which inspection begins.
```

---

## 4. Postulate II — Rule Line Construction

> **Between an OMI pointer and an invariant name, a rule line may be drawn.**

Canonical form:

```text
<omi-pointer> MUST <invariant-name>
```

Example:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112 MUST initialize-xdp-packet-parsing-gates
```

This constructs a rule line:

```text
pointer → obligation
```

Provider obligation:

```text
No address without a rule.
```

Consumer interpretation:

```text
The rule tells me what this pointer is obligated to mean.
```

---

## 5. Postulate III — Fact Grounding Construction

> **A normative rule may be grounded as an applied fact when a concrete runtime state satisfies it.**

Rule:

```text
omi-.../prefix MUST invariant-name
```

Derived fact:

```text
omi-.../prefix FACT applied-fact-name
```

This constructs:

```text
rule obligation → grounded state
```

Provider obligation:

```text
Do not declare a fact unless the implementation and test exist.
```

Consumer interpretation:

```text
The fact says where the rule is actually grounded.
```

---

## 6. Postulate IV — State Transition Construction

> **A rule-to-fact derivation may be expressed as an a-list state transition.**

Canonical a-list:

```lisp
(
  (rule . "omi-.../prefix MUST invariant-name")
  (state-before . "unverified")
  (transition . "derive-applied-fact")
  (state-after . "configured")
  (fact . "omi-.../prefix FACT applied-fact-name")
)
```

This constructs the line of motion from rule to fact.

Provider obligation:

```text
Show how the fact was derived.
```

Consumer interpretation:

```text
The a-list shows the transition, not just the result.
```

---

## 7. Postulate V — Bitboard Mask Construction

> **From a rule pointer, a bitboard mask may be constructed over the relevant address fields.**

Example pointer:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
```

Relevant fields:

```text
S6 = 0x00eb
S7 = 0x0066
```

Segment mask:

```text
[0000,0000,0000,0000,0000,0000,ffff,ffff]
```

This constructs:

```text
address field → mask → match condition
```

Provider obligation:

```text
State which bits matter.
```

Consumer interpretation:

```text
The bitboard tells me what is actually being tested.
```

---

## 8. Postulate VI — Bitblip Correction Construction

> **From a bitboard mask and expected value, a bitblip policy may be constructed.**

A bitblip is a small bit-level deviation.

Example:

```text
expected: 00eb-0066
actual:   00eb-0067
delta:    0000-0001
distance: 1 bit
```

Possible policies:

```text
accept-exact
correct-single
evict-single
correct-up-to-2
evict-over-2
warn-near-miss
drop-packet
skip-replay
route-preset-1
```

This constructs:

```text
near miss → correction or eviction behavior
```

Provider obligation:

```text
Define failure behavior.
```

Consumer interpretation:

```text
The bitblip policy tells me whether the system repairs, rejects, warns, or drops.
```

---

## 9. Postulate VII — Proof Path Construction

> **For every rule line, a test path may be constructed.**

A rule is complete only when it has a proof path:

```text
RULES.omi row
→ implementation
→ test
→ expected pass/fail result
```

Example:

```text
quadratic-lexer-invariant
→ src/omi/quadratic-lexer.js
→ test/quadratic-lexer.test.js
```

Provider obligation:

```text
No rule without a test.
```

Consumer interpretation:

```text
The test proves the rule is executable, not decorative.
```

---

## 10. Postulate VIII — Replay Path Construction

> **For every accepted state, a replay path may be constructed.**

A replay path may be:

```text
packed receipt
ring slot
telemetry event
log row
deterministic test fixture
```

Canonical OMI receipt:

```text
provenance:16 | steps:8 | LL:8 | NN:16 | MM:16
```

Replay ring:

```text
5040 = 7!
```

Provider obligation:

```text
No test without a replay path.
```

Consumer interpretation:

```text
The replay path lets me re-check what happened.
```

---

## 11. Postulate IX — Visible Projection Construction

> **For every replayable state, a visible or inspectable projection may be constructed.**

Projection may be:

```text
CSSOM selector
JSON Canvas node
SSE telemetry event
BPF map counter
DOM element
SVG rail
Code16K header
JABCode body
log row
```

Example CSSOM projection:

```css
[id$="-00eb-0066/112"] {
  stroke: #ffaa00;
}
```

Provider obligation:

```text
No replay path without visible state.
```

Consumer interpretation:

```text
The state must be inspectable somewhere.
```

---

## 12. Postulate X — Algebraic Membership Construction

> **A valid instruction surface may be constructed by the equation Q(S)=0.**

The Binary Quadratic Meta-Mask Lexer constructs validity as surface membership:

```text
Q(S) = E_var + E_const
```

Result:

```text
Q(S) = 0 → accepted
Q(S) > 0 → rejected
```

Provider obligation:

```text
Do not replace algebraic membership with ad hoc parsing at the lexer boundary.
```

Consumer interpretation:

```text
The frame is valid because it lies on the surface, not because a parser guessed it.
```

---

## 13. Postulate XI — Orbit Construction

> **From a valid instruction frame, a bounded Δ_C orbit may be constructed.**

Delta law:

```text
Δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

Fano bound:

```text
0 ≤ k < 15
```

This constructs:

```text
valid frame → bounded projective motion
```

Provider obligation:

```text
If a rule claims orbit validity, prove bounded convergence.
```

Consumer interpretation:

```text
The orbit proves the frame moves lawfully through the state space.
```

---

## 14. Postulate XII — Kernel Boundary Construction

> **A packet-validity construction may be moved to the kernel boundary.**

OMI may enforce validity through eBPF/XDP:

```text
raw packet
→ XDP hook
→ OMI frame or signature
→ pass/drop result
```

Provider obligation:

```text
Kernel enforcement must mirror the user-space rule.
```

Consumer interpretation:

```text
Packets are rejected before user-space allocation when kernel enforcement is active.
```

---

## 15. Postulate XIII — Clock Construction

> **A clock state may be constructed as an addressable period and gating condition.**

QEMU-style clock period:

```text
integer period in units of 2^-32 ns
```

Gated state:

```text
period = 0
```

This constructs:

```text
clock period → clock state → projection
```

Provider obligation:

```text
Expose period and gating state explicitly.
```

Consumer interpretation:

```text
A clock is inspectable when its period and active/gated state are addressable.
```

---

## 16. Postulate XIV — Optical Frame Construction

> **A page may be constructed as a scannable protocol state.**

A page may contain:

```text
Code16K header
JABCode body
NAT64 iframe boundary
OMI-addressed DOM nodes
CSSOM visual rails
```

This constructs:

```text
web page → protocol envelope → scannable state
```

Provider obligation:

```text
A page projection should preserve the OMI pointer.
```

Consumer interpretation:

```text
The page is not only rendered; it can also be inspected as protocol state.
```

---

## 17. Postulate XV — Declaration Construction

> **Every grounded fact may be declared by a derivation expression.**

Declaration expression:

```text
rule clause
+ axiom family
+ state transition
+ bitboard
+ bitblip
+ proof path
+ projection
```

This constructs:

```text
RULES.omi row → FACTS.omi row
```

Provider obligation:

```text
Do not add FACTS.omi rows without derivation context.
```

Consumer interpretation:

```text
The fact is understandable because its derivation is inspectable.
```

---

## 18. Postulate XVI — Complement Construction

> **For any OMI pointer, mask, rule, or fact, a ones-complement anti-surface may be constructed.**

Ones-complement fold for a 16-bit segment:

```text
Sᵢ' = Sᵢ XOR 0xFFFF
```

For the full 128-bit address:

```text
P' = P XOR FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF-FFFF
```

This constructs:

```text
state → anti-state
mask → anti-mask
acceptance → eviction
presence → absence
```

The complement is not automatically valid. It is a permitted construction that becomes valid only when a rule explicitly accepts it.

Provider obligation:

```text
Do not assume complement validity without a rule.
```

Consumer interpretation:

```text
The complement surface exists by construction; its validity is a separate question.
```

---

## 19. Euclidean-Style Summary

OMI's constructive postulates can be summarized as:

```text
1.  Construct an address point.
2.  Draw a rule line from pointer to invariant.
3.  Ground a rule line as a fact.
4.  Express the grounding as an a-list transition.
5.  Derive a bitboard mask.
6.  Define a bitblip policy.
7.  Attach a proof path.
8.  Attach a replay path.
9.  Attach a visible projection.
10. Accept frames by Q(S)=0.
11. Extend valid frames through bounded Δ_C/Fano orbits.
12. Move packet validity to the kernel boundary when possible.
13. Represent clocks as addressable period/gating states.
14. Represent pages as scannable protocol envelopes.
15. Declare facts through derivation expressions.
16. Construct complement anti-surfaces by ones-complement.
```

---

## 20. Relationship to DECLARATIONS.md

`POSTULATES.md` and `DECLARATIONS.md` both exist, but they do different jobs.

```text
POSTULATES.md   → permitted constructions
DECLARATIONS.md → derivation templates
```

In other words:

```text
POSTULATES.md tells what may be constructed.
DECLARATIONS.md tells how to write the construction down.
```

Example:

```text
Postulate: From a rule, a grounded fact may be constructed.
Declaration: Here is the a-list, bitboard, bitblip, test, and projection for that fact.
```

---

## 21. Final Postulate

> **Whatever OMI can validate, it must be able to address; whatever it can address, it must be able to declare; whatever it declares, it must be able to test; whatever it tests, it must be able to replay; whatever it replays, it must be able to show.**

Therefore:

```text
construction = pointer + rule + proof + replay + projection
```

This is the constructive foundation of the OMI protocol.

The complete document order:

```text
README.md
ONTOLOGY.md
POSTULATES.md
AXIOMS.md
DECLARATIONS.md
GLOSSARY.md
RULES.omi
FACTS.omi
```
