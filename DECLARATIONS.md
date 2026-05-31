# Deriving FACTS.omi A-List State Transition Tables from RULES.omi

## Status

This document defines a repeatable template for deriving applied `FACTS.omi` rows from normative `RULES.omi` clauses.

The goal is to convert rule clauses into an executable state-transition table using:

```text
RULES.omi clause
→ axiom family
→ a-list row
→ bitboard mask
→ bitblip correction rule
→ FACTS.omi derived state
→ test and projection
```

This document is a derivation template. It does not replace `RULES.omi`, `FACTS.omi`, `AXIOMS.md`, or `ONTOLOGY.md`.

---

## 1. Central Derivation Law

> **A fact is a grounded rule transition.**

A rule says what must be true.

A fact says where that rule is grounded in the current system.

Therefore:

```text
RULES.omi = normative invariant space
FACTS.omi = applied runtime/physical/deployment space
```

The derivation path is:

```text
rule clause
→ state transition
→ observed or configured fact
```

---

## 2. Input Clause Shape

Every derivation starts from a `RULES.omi` row:

```text
<omi-address>/<prefix> MUST <invariant-name>
```

Example:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112 MUST initialize-xdp-packet-parsing-gates
```

This row contains:

| Field          | Meaning             |
| -------------- | ------------------- |
| OMI address    | structural subject  |
| prefix         | scope of obligation |
| modal          | rule force          |
| invariant name | behavior to enforce |

---

## 3. Output Fact Shape

A derived fact row should use this shape:

```text
<omi-address>/<prefix> FACT <fact-name>
```

Example:

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112 FACT xdp-packet-parsing-gate-configured
```

A derived fact should never simply repeat the rule name. It should state the concrete applied condition.

Bad:

```text
omi-.../112 FACT initialize-xdp-packet-parsing-gates
```

Better:

```text
omi-.../112 FACT xdp-packet-parsing-gate-configured
```

Best:

```text
omi-.../112 FACT xdp-packet-parsing-gate-configured-on-virbr0
```

---

## 4. A-List State Transition Form

Each derivation should be expressible as an association list:

```lisp
(
  (rule . <rule-pointer>)
  (modal . MUST)
  (invariant . <invariant-name>)
  (state-before . <input-state>)
  (transition . <transition-name>)
  (state-after . <derived-fact-state>)
  (bitboard . <mask>)
  (bitblip . <correction-policy>)
  (fact . <fact-pointer>)
  (test . <test-file>)
  (projection . <visible-output>)
)
```

Canonical abstract form:

```lisp
(
  (rule . "omi-.../prefix MUST invariant-name")
  (state-before . "unverified")
  (transition . "derive-applied-fact")
  (state-after . "configured")
  (fact . "omi-.../prefix FACT applied-fact-name")
)
```

---

## 5. State Transition Table Template

Use this table for every derived fact family:

| Column           | Description                              |
| ---------------- | ---------------------------------------- |
| `rule_id`        | Rule number, such as `0x12D`             |
| `rule_pointer`   | OMI address from `RULES.omi`             |
| `modal`          | Usually `MUST`                           |
| `invariant`      | Hyphenated invariant name                |
| `axiom_family`   | Clause family from `AXIOMS.md`           |
| `input_state`    | State before derivation                  |
| `transition`     | Operation that grounds the fact          |
| `output_state`   | State after derivation                   |
| `fact_pointer`   | OMI address used in `FACTS.omi`          |
| `fact_name`      | Concrete applied fact name               |
| `bitboard_mask`  | Segment/field mask used for validation   |
| `bitblip_policy` | Correction/eviction rule                 |
| `test`           | Test proving the transition              |
| `projection`     | CSSOM, telemetry, receipt, or log output |

---

## 6. Bitboard Derivation

A **bitboard** is the fixed-width mask used to extract or compare rule-bearing fields.

For an OMI frame:

```text
S = [S0,S1,S2,S3,S4,S5,S6,S7]
```

Each segment is 16 bits.

A bitboard mask declares which fields are structurally relevant.

Example for an eBPF packet parsing gate:

```text
rule pointer:
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112
```

Relevant fields:

```text
S6 = 0x00eb
S7 = 0x0066
prefix = /112
```

Bitboard mask:

```text
0000 0000 0000 0000 0000 0000 FFFF FFFF
```

or as segment mask:

```text
[0000,0000,0000,0000,0000,0000,ffff,ffff]
```

Match rule:

```text
(S6 == 0x00eb) ∧ (S7 == 0x0066)
```

---

## 7. Bitblip Derivation

A **bitblip** is a small bit-level deviation from an expected mask.

Bitblip handling defines what happens when an input is near the expected rule pointer but not exact.

Bitblip policy options:

| Policy            | Meaning                                         |
| ----------------- | ----------------------------------------------- |
| `accept-exact`    | Only exact bitboard match is valid              |
| `correct-single`  | One-bit deviation may be corrected              |
| `evict-single`    | One-bit deviation is rejected                   |
| `correct-up-to-2` | Up to two bit deviations may be repaired        |
| `evict-over-2`    | More than two bit deviations are rejected       |
| `warn-near-miss`  | Near miss routes to warning but does not commit |
| `drop-packet`     | Kernel/network failure path                     |
| `skip-replay`     | Do not write receipt                            |
| `route-preset-1`  | Visual warning projection                       |

Example:

```text
expected: 00eb-0066
actual:   00eb-0067
delta:    0000-0001
distance: 1 bit
policy:   evict-single
```

Result:

```text
state-after = rejected
fact = none
projection = warning or drop
```

---

## 8. Derivation Algorithm

Given a rule row:

```text
R = address/prefix MUST invariant
```

Derive a fact as follows:

```text
1. Parse address into eight 16-bit segments.
2. Determine prefix scope.
3. Identify constrained segments.
4. Build segment bitboard mask.
5. Identify axiom family.
6. Define input state.
7. Define transition operation.
8. Define output state.
9. Define exact-match condition.
10. Define bitblip correction/eviction policy.
11. Emit derived FACT row.
12. Attach test.
13. Attach projection.
```

Pseudocode:

```javascript
function deriveFactFromRule(rule) {
  const parsed = parseRule(rule);

  const bitboard = deriveBitboardMask(parsed.address, parsed.prefix);
  const axiom = classifyAxiomFamily(parsed.invariant);
  const transition = deriveTransition(parsed.invariant, axiom);
  const bitblipPolicy = deriveBitblipPolicy(axiom, parsed.prefix);

  return {
    rulePointer: parsed.pointer,
    modal: parsed.modal,
    invariant: parsed.invariant,
    axiomFamily: axiom,
    inputState: "unverified",
    transition,
    outputState: "configured",
    factPointer: parsed.pointer,
    factName: toAppliedFactName(parsed.invariant),
    bitboardMask: bitboard,
    bitblipPolicy,
    test: deriveTestName(parsed.invariant),
    projection: deriveProjection(parsed.pointer)
  };
}
```

---

## 9. A-List Template

Use this exact a-list template when documenting a derived fact:

```lisp
(
  (rule-id . "0x___")
  (rule-pointer . "omi-____-____-____-____-____-____-____-____/___")
  (modal . "MUST")
  (invariant . "________________________")
  (axiom-family . "________________________")

  (state-before . "unverified")
  (transition . "derive-applied-fact")
  (state-after . "configured")

  (segment-mask . "[____,____,____,____,____,____,____,____]")
  (expected-segments . "[____,____,____,____,____,____,____,____]")
  (bitboard-mask . "0x________________________________")
  (bitblip-policy . "accept-exact | correct-single | evict-single | evict-over-2")

  (fact-pointer . "omi-____-____-____-____-____-____-____-____/___")
  (fact-name . "________________________")

  (test . "test/________________.test.js")
  (projection . "cssom | json-canvas | sse | bpf-map | replay-ring | log")
  (failure-behavior . "reject-token | evict-frame | drop-packet | route-preset-1 | skip-replay")
)
```

---

## 10. Table Template

Use this markdown table for documentation:

| Field            | Value         |
| ---------------- | ------------- |
| Rule ID          | `0x___`       |
| Rule Pointer     | `omi-.../...` |
| Invariant        | `...`         |
| Axiom Family     | `...`         |
| Input State      | `unverified`  |
| Transition       | `...`         |
| Output State     | `configured`  |
| Fact Pointer     | `omi-.../...` |
| Fact Name        | `...`         |
| Segment Mask     | `[....]`      |
| Bitboard Mask    | `0x...`       |
| Bitblip Policy   | `...`         |
| Test             | `test/...`    |
| Projection       | `...`         |
| Failure Behavior | `...`         |

---

## 11. Example Derivation: eBPF XDP Gate

### Source Rule

```text
# [Rule 0x12D]: Ingress XDP Link-Layer Packet Parsing Gate
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112 MUST initialize-xdp-packet-parsing-gates
```

### Derived Fact

```text
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112 FACT xdp-packet-parsing-gate-configured
```

### A-List

```lisp
(
  (rule-id . "0x12D")
  (rule-pointer . "omi-0000-0000-0000-0000-0000-0000-00eb-0066/112")
  (modal . "MUST")
  (invariant . "initialize-xdp-packet-parsing-gates")
  (axiom-family . "kernel-enforcement")

  (state-before . "unverified")
  (transition . "compile-and-load-xdp-gate")
  (state-after . "configured")

  (segment-mask . "[0000,0000,0000,0000,0000,0000,ffff,ffff]")
  (expected-segments . "[0000,0000,0000,0000,0000,0000,00eb,0066]")
  (bitboard-mask . "0x000000000000000000000000ffffffff")
  (bitblip-policy . "evict-single")

  (fact-pointer . "omi-0000-0000-0000-0000-0000-0000-00eb-0066/112")
  (fact-name . "xdp-packet-parsing-gate-configured")

  (test . "test/ebpf-pipeline.test.js")
  (projection . "bpf-map + cssom")
  (failure-behavior . "drop-packet")
)
```

### Transition Table Row

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Rule ID          | `0x12D`                                           |
| Rule Pointer     | `omi-0000-0000-0000-0000-0000-0000-00eb-0066/112` |
| Invariant        | `initialize-xdp-packet-parsing-gates`             |
| Axiom Family     | `kernel-enforcement`                              |
| Input State      | `unverified`                                      |
| Transition       | `compile-and-load-xdp-gate`                       |
| Output State     | `configured`                                      |
| Fact Pointer     | `omi-0000-0000-0000-0000-0000-0000-00eb-0066/112` |
| Fact Name        | `xdp-packet-parsing-gate-configured`              |
| Segment Mask     | `[0000,0000,0000,0000,0000,0000,ffff,ffff]`       |
| Bitboard Mask    | `0x000000000000000000000000ffffffff`              |
| Bitblip Policy   | `evict-single`                                    |
| Test             | `test/ebpf-pipeline.test.js`                      |
| Projection       | `bpf-map + cssom`                                 |
| Failure Behavior | `drop-packet`                                     |

---

## 12. Example Derivation: Quadratic Lexer Rule

### Source Rule

```text
omi-0500-03bf-0000-2b05-2f05-0000-039f-05ff/48 MUST quadratic-lexer-invariant
```

### Derived Fact

```text
omi-0500-03bf-0000-2b05-2f05-0000-039f-05ff/48 FACT quadratic-lexer-reference-frame-verified
```

### A-List

```lisp
(
  (rule-id . "0x27")
  (rule-pointer . "omi-0500-03bf-0000-2b05-2f05-0000-039f-05ff/48")
  (modal . "MUST")
  (invariant . "quadratic-lexer-invariant")
  (axiom-family . "algebraic-membership")

  (state-before . "unverified")
  (transition . "evaluate-Q-of-S")
  (state-after . "valid-frame")

  (segment-mask . "[ff00,ffff,0000,ffff,ffff,0000,ffff,ffff]")
  (expected-segments . "[0500,03bf,free,2b05,2f05,free,039f,05ff]")
  (bitboard-mask . "0xff00ffff0000ffffffff0000ffffffff")
  (bitblip-policy . "evict-single")

  (fact-pointer . "omi-0500-03bf-0000-2b05-2f05-0000-039f-05ff/48")
  (fact-name . "quadratic-lexer-reference-frame-verified")

  (test . "test/quadratic-lexer.test.js")
  (projection . "replay-ring + diagnostic")
  (failure-behavior . "reject-token")
)
```

---

## 13. Example Derivation: Telemetry Isolation Rule

### Source Rule

```text
omi-0000-0000-0000-0000-0000-0000-7463-0001/128 MUST isolate-telemetry-from-replay-ring
```

### Derived Fact

```text
omi-0000-0000-0000-0000-0000-0000-7463-0001/128 FACT telemetry-stream-isolated-from-replay-ring
```

### A-List

```lisp
(
  (rule-id . "0x56")
  (rule-pointer . "omi-0000-0000-0000-0000-0000-0000-7463-0001/128")
  (modal . "MUST")
  (invariant . "isolate-telemetry-from-replay-ring")
  (axiom-family . "telemetry-isolation")

  (state-before . "metrics-unclassified")
  (transition . "route-metrics-to-isolated-sse-stream")
  (state-after . "telemetry-isolated")

  (segment-mask . "[ffff,ffff,ffff,ffff,ffff,ffff,ffff,ffff]")
  (expected-segments . "[0000,0000,0000,0000,0000,0000,7463,0001]")
  (bitboard-mask . "0xffffffffffffffffffffffffffffffff")
  (bitblip-policy . "accept-exact")

  (fact-pointer . "omi-0000-0000-0000-0000-0000-0000-7463-0001/128")
  (fact-name . "telemetry-stream-isolated-from-replay-ring")

  (test . "test/wan-telemetry.test.js")
  (projection . "sse")
  (failure-behavior . "skip-replay")
)
```

---

## 14. Bitboard Mask Rules by Prefix

Use this default derivation unless a rule overrides it.

| Prefix | Segment Mask                                                                            |
| -----: | --------------------------------------------------------------------------------------- |
|  `/48` | `[ffff,ffff,ffff,0000,0000,0000,0000,0000]` or rule-specific first three-segment family |
|  `/80` | `[ffff,ffff,ffff,ffff,ffff,0000,0000,0000]`                                             |
|  `/96` | `[ffff,ffff,ffff,ffff,ffff,ffff,0000,0000]`                                             |
| `/112` | `[ffff,ffff,ffff,ffff,ffff,ffff,ffff,0000]`                                             |
| `/120` | byte-specific narrowing of final segment                                                |
| `/128` | `[ffff,ffff,ffff,ffff,ffff,ffff,ffff,ffff]`                                             |

Important: many OMI rules use sparse symbolic masks, not plain CIDR masks. When a rule explicitly constrains non-contiguous segments, derive the mask from the comments and invariant name rather than prefix alone.

Example sparse mask:

```text
Quadratic lexer:
S0, S1, S3, S4, S6, S7 constrained
S2, S5 free
```

Mask:

```text
[ff00,ffff,0000,ffff,ffff,0000,ffff,ffff]
```

---

## 15. Bitblip Policies by Axiom Family

| Axiom Family         | Default Bitblip Policy                 |
| -------------------- | -------------------------------------- |
| algebraic-membership | `evict-single`                         |
| delta-orbit          | `evict-single`                         |
| barcode-ecc          | `correct-up-to-2`, then `evict-over-2` |
| telemetry-isolation  | `accept-exact`                         |
| kernel-enforcement   | `drop-packet`                          |
| browser-projection   | `warn-near-miss`                       |
| replay-ring          | `reject-warm-overwrite`                |
| clock-tree           | `mark-gated`                           |
| notation             | `evict-fractional-overflow`            |
| service-bus          | `accept-exact`                         |

---

## 16. Derived FACTS.omi Section Template

Use this format when writing the derived facts into `FACTS.omi`:

```text
# ============================================================================
# Derived Facts: <Subsystem Name>
# Source: RULES.omi <rule range>
# Derivation: <a-list transition table name>
# ============================================================================

# [Derived from Rule 0x___]
# Rule: <invariant-name>
# Transition: <state-before> -> <state-after>
# Bitboard: <segment-mask>
# Bitblip: <policy>
omi-....-....-....-....-....-....-....-..../prefix FACT <applied-fact-name>
```

Example:

```text
# ============================================================================
# Derived Facts: eBPF Packet Signature Gateway
# Source: RULES.omi 0x12D-0x12F
# Derivation: xdp-signature-gateway-a-list
# ============================================================================

# [Derived from Rule 0x12D]
# Rule: initialize-xdp-packet-parsing-gates
# Transition: unverified -> configured
# Bitboard: [0000,0000,0000,0000,0000,0000,ffff,ffff]
# Bitblip: evict-single
omi-0000-0000-0000-0000-0000-0000-00eb-0066/112 FACT xdp-packet-parsing-gate-configured
```

---

## 17. Machine-Readable JSON Template

For generated tooling, the a-list may also be represented as JSON:

```json
{
  "rule_id": "0x12D",
  "rule_pointer": "omi-0000-0000-0000-0000-0000-0000-00eb-0066/112",
  "modal": "MUST",
  "invariant": "initialize-xdp-packet-parsing-gates",
  "axiom_family": "kernel-enforcement",
  "state_before": "unverified",
  "transition": "compile-and-load-xdp-gate",
  "state_after": "configured",
  "segment_mask": ["0000", "0000", "0000", "0000", "0000", "0000", "ffff", "ffff"],
  "expected_segments": ["0000", "0000", "0000", "0000", "0000", "0000", "00eb", "0066"],
  "bitboard_mask": "0x000000000000000000000000ffffffff",
  "bitblip_policy": "evict-single",
  "fact_pointer": "omi-0000-0000-0000-0000-0000-0000-00eb-0066/112",
  "fact_name": "xdp-packet-parsing-gate-configured",
  "test": "test/ebpf-pipeline.test.js",
  "projection": ["bpf-map", "cssom"],
  "failure_behavior": "drop-packet"
}
```

---

## 18. Consumer Interpretation

A consumer reads a derived fact as:

```text
This rule has been grounded into an applied system state.
The bitboard says which address fields matter.
The bitblip policy says how deviations are handled.
The test says how the fact is verified.
The projection says where the fact becomes inspectable.
```

---

## 19. Provider Interpretation

A provider emits a derived fact only when:

```text
the rule exists
the address is stable
the implementation exists
the test passes
the failure behavior is defined
the projection is inspectable
```

This preserves the provider contract:

```text
No address without a rule.
No rule without a test.
No test without a replay path.
No replay path without visible state.
```

---

## 20. Final Derivation Statement

A `FACTS.omi` row derived from `RULES.omi` is complete only when it has:

```text
rule pointer
axiom family
state transition
bitboard mask
bitblip policy
fact pointer
test
projection
failure behavior
```

Therefore:

```text
derived fact = rule clause + state transition + bitboard + bitblip + proof path
```
