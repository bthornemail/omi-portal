# The OMI Address Ontology and Binary Quadratic Meta-Mask Lexer

## Ontological Status

This document defines the foundational ontology of OMI: how meaning, validity, runtime state, and visual projection are unified through fixed-width addressable reference pointers.

OMI does not treat addresses as passive labels. An OMI address is a structural pointer into a validated state space.

At the lowest layer, an OMI token is a 128-bit instruction frame. At higher layers, the same address form can identify a rule, packet, memory receipt, symbolic fact, clock state, DOM element, JSON Canvas node, telemetry event, or optical page boundary.

The core claim is:

> **Every meaningful state should have an address.
> Every address should have a rule.
> Every rule should have a test.
> Every test should be replayable.
> Every replayable state should be visible.**

---

## 1. Central Law

> **Lexing is algebraic membership.**

A token is not parsed into validity. A token is tested for membership in a valid instruction surface.

The 128-bit instruction word is divided into eight fixed 16-bit segments:

```text
S = [S₀, S₁, S₂, S₃, S₄, S₅, S₆, S₇]
```

A single quadratic error function determines whether the instruction belongs to the valid surface:

```text
Q(S) = 0  → valid instruction
Q(S) > 0  → malformed instruction
```

This makes validation algebraic instead of procedural.

There is no grammar walk, no conditional parse tree, and no symbolic repair pass at the lexer boundary. The instruction either lies on the surface or it does not.

---

## 2. OMI Address as Reference Pointer

The canonical OMI address form is:

```text
omi-<S₀>-<S₁>-<S₂>-<S₃>-<S₄>-<S₅>-<S₆>-<S₇>/<prefix>
```

Each segment is a 16-bit hexadecimal word.

Together:

```text
8 segments × 16 bits = 128 bits
```

The prefix scopes the pointer:

```text
/48   local canonical runtime frame
/80   rule-family or ABI boundary
/96   gateway, translation, or mapped-prefix boundary
/112  narrow rule/register boundary
/128  exact state pointer
```

An OMI address can refer to:

| Role                  | Meaning                             |
| --------------------- | ----------------------------------- |
| Instruction frame     | A 128-bit execution token           |
| Rule pointer          | A FACTS.omi or RULES.omi invariant  |
| Runtime receipt       | A packed ring-buffer state          |
| DOM/CSSOM node        | A browser-visible protocol state    |
| JSON Canvas node      | A visual knowledge object           |
| eBPF/XDP packet state | A kernel-space pass/drop event      |
| QEMU clock state      | A clock-tree period or gated source |
| WAN telemetry event   | A network propagation measurement   |
| Optical frame         | A Code16K/JABCode page boundary     |

Thus:

```text
OMI pointer = address + rule + runtime interpretation + projection surface
```

---

## 3. The Instruction Shape

The canonical binary quadratic lexer uses this eight-segment structure:

```text
S₀ = 0xLL00    low byte 0x00, high byte = LL
S₁ = 0x03BF    chiral delimiter ο
S₂ = 0xNNNN    free payload variable N
S₃ = 0x2bLL    high byte 0x2B, low byte = LL
S₄ = 0x2fLL    high byte 0x2F, low byte = LL
S₅ = 0xMMMM    free payload variable M
S₆ = 0x039F    cardinal delimiter Ο
S₇ = 0xLLff    high byte = LL, low byte 0xFF
```

Canonical address form:

```text
omi-LL00-03bf-NNNN-2bLL-2fLL-MMMM-039f-LLff/48
```

Example:

```text
omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48
```

Here:

```text
LL = 0x05
N  = 0x000c
M  = 0x0002
```

The repeated `LL` field binds the instruction to a single projective selector.

---

## 4. The Quadratic Error Function

The lexer evaluates two error surfaces:

```text
Q(S) = E_var + E_const
```

Where:

```text
E_var   = variable coherence error
E_const = constant alignment error
```

The instruction is valid iff both vanish.

---

## 5. Variable Coherence

The variable `LL` appears in four places:

```text
L₀ = S₀ >> 8
L₃ = S₃ & 0x00FF
L₄ = S₄ & 0x00FF
L₇ = S₇ >> 8
```

Coherence requires:

```text
L₀ = L₃ = L₄ = L₇
```

Three pairwise differences are sufficient:

```text
E_var = (L₀ - L₃)² + (L₃ - L₄)² + (L₄ - L₇)²
```

Therefore:

```text
E_var = 0 iff L₀ = L₃ = L₄ = L₇
```

Any mismatch produces positive error.

---

## 6. Constant Alignment

The fixed delimiters must match exactly:

```text
E_const =
    (S₀ & 0x00FF)² +
    (S₁ - 0x03BF)² +
    ((S₃ & 0xFF00) - 0x2B00)² +
    ((S₄ & 0xFF00) - 0x2F00)² +
    (S₆ - 0x039F)² +
    ((S₇ & 0x00FF) - 0x00FF)²
```

Therefore:

```text
E_const = 0 iff all delimiter constants are correct
```

The square of each term prevents cancellation. Every mismatch contributes positive error.

---

## 7. Monolithic Surface Membership

The full lexer is:

```text
Q(S) = E_var + E_const
```

Therefore:

```text
Q(S) = 0 iff every variable and constant constraint is satisfied
Q(S) > 0 iff at least one constraint fails
```

This is the Binary Quadratic Meta-Mask Lexer.

It is called a "meta-mask" because it replaces a sequence of branch checks with one algebraic membership surface.

---

## 8. Free Payload Variables

The payload fields do not appear in `Q(S)`:

```text
S₂ = NNNN
S₅ = MMMM
```

They are free traversal variables.

Once the frame is proven valid, `N` and `M` may carry:

| Payload Use       | Example                             |
| ----------------- | ----------------------------------- |
| Memory offset     | Ring slot or displacement           |
| Fano ray          | Source/target orbit values          |
| Barcode traversal | Code16K/JABCode state               |
| Symbolic fact     | Subject/predicate/object payload    |
| Network state     | NAT64 embedded address component    |
| Clock state       | QEMU TYPE_CLOCK period component    |
| Neural state      | Layer 9 / Layer 10 activation field |

The lexer proves the envelope. The payload travels inside the proven envelope.

---

## 9. Concrete Examples

### 9.1 Valid Canonical Token

```text
omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48
```

Variable coherence:

```text
L₀ = 0x05
L₃ = 0x05
L₄ = 0x05
L₇ = 0x05
```

Therefore:

```text
E_var = 0
```

All constants match:

```text
E_const = 0
```

Final result:

```text
Q(S) = 0 → VALID
```

Payload:

```text
N = 0x000c
M = 0x0002
```

---

### 9.2 Variable Coherence Breach

```text
omi-0500-03bf-000c-2b05-2f06-0002-039f-05ff/48
```

Here:

```text
L₀ = 0x05
L₃ = 0x05
L₄ = 0x06
L₇ = 0x05
```

Therefore:

```text
E_var = (5-5)² + (5-6)² + (6-5)²
E_var = 0 + 1 + 1
E_var = 2
```

Final result:

```text
Q(S) = 2 → INVALID
```

---

### 9.3 Constant Corruption

```text
omi-0500-03bf-000c-2b05-2f05-0002-039e-05ff/48
```

Here:

```text
S₆ = 0x039E
expected S₆ = 0x039F
```

Therefore:

```text
E_const contribution = (0x039E - 0x039F)² = 1
```

Final result:

```text
Q(S) = 1 → INVALID
```

---

## 10. Reference Implementation

```javascript
export function verifyInstructionLexer(S) {
  if (!S || S.length !== 8) return false;

  const L0 = S[0] >> 8;
  const L3 = S[3] & 0x00FF;
  const L4 = S[4] & 0x00FF;
  const L7 = S[7] >> 8;

  const E_var =
    (L0 - L3) ** 2 +
    (L3 - L4) ** 2 +
    (L4 - L7) ** 2;

  const E_const =
    (S[0] & 0x00FF) ** 2 +
    (S[1] - 0x03BF) ** 2 +
    ((S[3] & 0xFF00) - 0x2B00) ** 2 +
    ((S[4] & 0xFF00) - 0x2F00) ** 2 +
    (S[6] - 0x039F) ** 2 +
    ((S[7] & 0x00FF) - 0x00FF) ** 2;

  return (E_var + E_const) === 0;
}
```

The implementation returns a Boolean, but the underlying ontology is an error surface.

A diagnostic implementation may return:

```javascript
{
  valid: Q === 0,
  Q,
  E_var,
  E_const
}
```

---

## 11. Δ_C-Orbit Extension

The quadratic lexer proves the envelope. The Δ_C-orbit lexer proves the trajectory.

The transition law is:

```text
Δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

The canonical 16-bit OMI inversion constant is:

```text
C = 0x5A3C
```

The Δ_C law produces a bounded orbit used to resolve Fano-plane relationships.

---

## 12. Fano Plane Connection

The lens variable:

```text
LL ∈ {0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07}
```

identifies one of the seven points of the Fano plane:

```text
PG(2,2)
```

The frame brackets:

```text
S₀ = 0xLL00
S₇ = 0xLLff
```

declare the ray boundary.

The interior locations:

```text
S₃ = 0x2bLL
S₄ = 0x2fLL
```

bind the operator rail to the same Fano point.

Because every two Fano lines intersect, the orbit resolution is bounded:

```text
Steps_max = 2 × Period − 1 = 15
```

This is the Fano lottery bound.

---

## 13. Combined Orbit Lexer

The combined condition is:

```text
Q(S) = 0 ∧ fano_intercept(N, M, C) ≥ 0
```

Where:

```text
Q(S)=0
```

proves the envelope, and:

```text
fano_intercept(...)
```

proves the bounded orbit relationship.

Reference shape:

```javascript
function deltaC(x, c = 0x5A3C) {
  x &= 0xFFFF;

  const rotl1 = ((x << 1) | (x >>> 15)) & 0xFFFF;
  const rotl3 = ((x << 3) | (x >>> 13)) & 0xFFFF;
  const rotr2 = ((x >>> 2) | (x << 14)) & 0xFFFF;

  return (rotl1 ^ rotl3 ^ rotr2 ^ c) & 0xFFFF;
}

function fanoIntercept(a, b, c = 0x5A3C) {
  a &= 0xFFFF;
  b &= 0xFFFF;

  for (let i = 0; i < 15; i++) {
    if (a === b) return i;
    a = deltaC(a, c);
    b = deltaC(b, c);
  }

  return -1;
}
```

---

## 14. eBPF/XDP Ontology

At the kernel boundary, OMI uses the same ontology:

```text
packet → address frame → algebraic gate → pass/drop
```

The eBPF/XDP layer exists to enforce OMI validity before user-space allocation.

The conceptual pipeline is:

```text
raw packet
→ XDP hook
→ IPv6 source-address extraction
→ 128-bit OMI frame
→ Q(S)=0 gate
→ Δ_C/Fano trajectory check
→ XDP_PASS / XDP_DROP
```

The 64-bit eBPF signature pipeline extends this with a Delta Law signature:

```text
rotl1 ⊕ rotl3 ⊕ rotr2 ⊕ 0x1337C0DE
```

This produces a kernel-space packet signature that can be mirrored in user space using `BigInt`.

Thus, OMI's ontology is not only symbolic. It is executable at the network driver layer.

---

## 15. Replay Ring Ontology

Once an instruction is accepted, its result can be packed into a 64-bit receipt:

```text
provenance:16 | steps:8 | LL:8 | NN:16 | MM:16
```

These receipts live in a factorial replay ring:

```text
5040 = 7!
```

The ring is the runtime memory of validated instruction history.

A valid state can therefore move through:

```text
OMI address
→ algebraic proof
→ orbit proof
→ packed receipt
→ replay ring
→ visual or telemetry projection
```

---

## 16. Visual Ontology

OMI addresses may be projected into DOM and CSSOM.

Example:

```html
<section id="omi-0000-0000-0000-0000-0000-0000-00eb-0066/112"></section>
```

CSS can then resolve the address:

```css
[id$="-00eb-0066/112"] {
  stroke: #ffaa00;
}
```

This means visual style is not arbitrary decoration. It is a projection of validated protocol state.

A Canvas node, DOM element, SVG group, telemetry rail, or page iframe can all carry the same pointer form.

---

## 17. Consumer and Provider Ontology

OMI has two audiences.

### Consumer

A consumer reads or receives OMI state.

The consumer asks:

```text
What pointer is this?
What rule validates it?
What runtime emitted it?
Can I replay or verify it?
What visual/telemetry state does it project?
```

### Provider

A provider emits OMI state.

The provider must supply:

```text
address pointer
rule binding
implementation
test
projection
failure behavior
```

The provider contract is:

```text
No address without a rule.
No rule without a test.
No test without a replay path.
No replay path without a visible or inspectable state.
```

---

## 18. Relation to Other Ontological Layers

| Layer                            | Relation                               |
| -------------------------------- | -------------------------------------- |
| `RULES.omi`                      | Declares normative invariants          |
| `FACTS.omi`                      | Declares applied physical/system facts |
| `src/omi/quadratic-lexer.js`     | Reference quadratic lexer              |
| `src/omi/delta-orbital-lexer.js` | Reference Δ_C/Fano orbit lexer         |
| `src/omi/ring-indexer.js`        | Replay receipt storage                 |
| `src/ebpf/`                      | Kernel-space packet enforcement        |
| `src/canvas/`                    | Visual and optical projection          |
| `public/bidi.css`                | CSSOM address-pointer rendering        |
| `test/`                          | Replayable proof suite                 |
| `docs/`                          | Human-readable protocol layers         |

---

## 19. Verification Matrix

| Invariant                                | Expected Outcome |
| ---------------------------------------- | ---------------- |
| Valid canonical token                    | `Q(S)=0`         |
| Valid token with different coherent `LL` | `Q(S)=0`         |
| `LL` coherence breach                    | `Q(S)>0`         |
| Chiral delimiter wrong                   | `Q(S)>0`         |
| Cardinal delimiter wrong                 | `Q(S)>0`         |
| Low byte of `S₀` nonzero                 | `Q(S)>0`         |
| High byte of `S₃` wrong                  | `Q(S)>0`         |
| High byte of `S₄` wrong                  | `Q(S)>0`         |
| Low byte of `S₇` not `0xFF`              | `Q(S)>0`         |
| Free variables changed                   | `Q(S)=0`         |
| `LL=0x00` with matching constants        | `Q(S)=0`         |
| `LL=0xFF` with matching constants        | `Q(S)=0`         |
| Null input                               | rejected         |
| Non-OMI prefix                           | rejected         |
| Round-trip via address builder           | passes           |
| Δ_C period property                      | passes           |
| Fano bound ≤ 15                          | passes           |
| eBPF mirror agrees with JS mirror        | passes           |
| Replay receipt unpacks correctly         | passes           |

---

## 20. Canonical Sources

| Artifact                           | Role                               |
| ---------------------------------- | ---------------------------------- |
| `src/omi/quadratic-lexer.js`       | Binary quadratic surface reference |
| `test/quadratic-lexer.test.js`     | Quadratic lexer invariant suite    |
| `src/omi/delta-orbital-lexer.js`   | Δ_C/Fano orbit reference           |
| `test/delta-orbital-lexer.test.js` | Orbit lexer invariant suite        |
| `src/omi/ring-indexer.js`          | 5040-slot replay ring              |
| `src/ebpf/ebpf-pipeline.bpf.c`     | 64-bit eBPF/XDP signature gate     |
| `src/omi/cluster-packet-kernel.js` | User-space eBPF/SAB bridge         |
| `public/bidi.css`                  | Address-pointer visual projection  |
| `RULES.omi`                        | Normative rule directory           |
| `docs/01-physical/FACTS.omi`       | Physical/system fact registry      |

---

## 21. Final Ontological Statement

OMI is not primarily a parser, database, graphics engine, or network protocol.

OMI is an address ontology.

Its core object is the addressable validated state:

```text
OMI state = pointer + rule + proof + receipt + projection
```

The Binary Quadratic Meta-Mask Lexer proves that an instruction belongs to the valid surface.

The Δ_C-orbit lexer proves that the instruction participates in bounded projective motion.

The replay ring records the proof.

The CSSOM, JSON Canvas, telemetry stream, or optical page frame projects the proof.

Therefore:

> **OMI turns addresses into executable, replayable, visible ontology.**
