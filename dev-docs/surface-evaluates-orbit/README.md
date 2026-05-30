# Face 4 — surface evaluates orbit

**Algebraic Filter — Q(S) = E_var + E_const = 0 Branchless Zero-Sum Surface**

## 🟢 What

This face is the **first gate** in the OMI dual-gate pipeline. It answers: *does this 128-bit instruction frame have structural integrity?*

The filter computes a **quadratic error surface** Q(S) — a branchless sum of squared differences that must equal exactly zero for a frame to pass. If Q(S) > 0, the frame is rejected at the NIC boundary (or its software equivalent) before any routing or state transition occurs.

```
Q(S) = E_var + E_const

E_var = (L0 - L3)^2 + (L3 - L4)^2 + (L4 - L7)^2    [LL coherence]
E_const = S0[low]^2 + (S1 - CHIRAL)^2 + (S3[high] - 0x2B)^2
        + (S4[high] - 0x2F)^2 + (S6 - CARDINAL)^2 + (S7[low] - 0xFF)^2

Q(S) = 0 → PASS
Q(S) > 0 → DROP (structural violation)
```

Because Q(S) uses only squares (no conditionals, no branches), it can be evaluated in an eBPF/XDP kernel program or in the JavaScript lexer with identical results.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/omi/delta-orbital-lexer.js` | `verifyOrbitLexer(S)` — computes Q(S); `extractTruthRow(S)` — extracts LL, NN, MM from validated frame |
| `src/omi/quadratic-lexer.js` | `verifyInstructionLexer(S)` — structural mirror of `verifyOrbitLexer` for the 8-segment instruction path |
| `src/omi/boolean-kernel.js` | `OmiBooleanKernelEngine` — evaluates truth-table bytes (0x03 = true, 0xBF = false) after gate pass |
| `src/omi/chiral-lexer.js` | `OmiSymmetricalChiralLexer` — validates omi→imo tape symmetry, opcode parity |
| `src/omi/trigraph-preprocessor.js` | `OmiTrigraphPreprocessor` — `??-` trigraph inversion applied before lexer |
| `src/omi/ebpf/delta_orbital_gate.bpf.c` | eBPF/XDP kernel implementation of Q(S) at the NIC boundary |

### Code path — Gate 1 pass

```javascript
// verifyOrbitLexer returns 0 for valid frame
const S = parseOmiAddressToSegments("omi-0100-03bf-7c00-...");
if (verifyOrbitLexer(S) !== 0) { /* DROP */ }

// On pass, extract the truth row for Gate 2:
const { LL, NN, MM } = extractTruthRow(S);
// LL = Fano lens (0x01..0x07)
// NN = antecedent
// MM = consequent (δ_C_LL(NN) after k < 15 steps)
```

### Key invariants

```javascript
// CHIRAL_DELIMITER — must be exactly 0x03BF
// CARDINAL_DELIMITER — must be exactly 0x039F
// S3 high byte — must be 0x2B (arithmetic operator marker)
// S4 high byte — must be 0x2F (arithmetic operator marker)
// S7 low byte — must be 0xFF (closure)
// S0 low byte — must be 0x00 (CBOS low byte)
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/delta-orbital-lexer.test.js` | Q(S)=0 for genesis frame, Q(S)>0 for byte-swapped/corrupted, LL coherence at each position |
| `test/boolean-kernel.test.js` | True-byte (0x03) vs false-byte (0xBF) detection, truth table |
| `test/chiral-lexer.test.js` | omi-to-imo tape symmetry, opcode range 0x00–0x3F |
| `test/trigraph-preprocessor.test.js` | `??-` polarity inversion, payload scalar |
| `test/quadratic-lexer.test.js` | Instruction lexer structural validation mirror |
| `test/wasm-delta-equivalence.test.js` | WASM vs JS verifyOrbitLexer equivalence |

## 🔴 Extend

### FACTS.omi rules

- Covered by the structural matrix in `FACTS.omi` — no explicit rule number for Q(S)=0; it is the foundational invariant.

### Extension points

- **New constant fields**: Add a term to `E_const` for any new invariant byte position. Must also update the eBPF gate.
- **Soft Q(S) threshold**: For diagnostic modes, log frames with Q(S) below a configurable epsilon instead of dropping.
- **Dual-gate pipeline**: Insert a custom gate between Q(S)=0 and the Fano resolver by overriding `verifyInstructionPipeline` in `delta-orbital-lexer.js`.

### Performance constraints

- Q(S) uses 6 integer squares + 3 integer subtractions — ~12 CPU cycles on x86-64.
- eBPF implementation passes 1000 random frames in <2ms in user-space test harness.
- `extractTruthRow` is O(1) — 3 bit masks and a BigInt pack.
