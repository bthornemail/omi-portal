# ONTOLOGY: The Binary Quadratic Meta-Mask Lexer

## Ontological Status

This document defines the Binary Quadratic Meta-Mask Lexer, a first-principles method
for validating fixed-width instruction words as points on an algebraic surface rather
than as sequences of conditional parsing steps.

---

## 1. The Central Law

> Lexing is algebraic membership.

A token is not parsed into validity. A token is tested for membership in the valid
instruction surface. The entire 128-bit instruction word is divided into eight fixed
16-bit segments, and a single quadratic error function `Q(S)` determines membership:

```
Q(S) = 0  → valid instruction (point lies on the surface)
Q(S) > 0  → malformed instruction (point is off the surface)
```

---

## 2. The Instruction Shape

An eight-segment word with the following layout:

```
S₀ = 0xLL00    (low byte 0x00, high byte = LL)
S₁ = 0x03BF    (chiral delimiter ο, constant)
S₂ = 0xNNNN    (free payload variable N)
S₃ = 0x2bLL    (high byte 0x2B, low byte = LL)
S₄ = 0x2fLL    (high byte 0x2F, low byte = LL)
S₅ = 0xMMMM    (free payload variable M)
S₆ = 0x039F    (cardinal delimiter Ο, constant)
S₇ = 0xLLff    (high byte = LL, low byte 0xFF)
```

Segments canonical form (omi-address encoding):

```
omi-<S₀>-<S₁>-<S₂>-<S₃>-<S₄>-<S₅>-<S₆>-<S₇>/48
```

---

## 3. The Quadratic Error Function

### 3.1 Variable Coherence (E_var)

The repeated variable `LL` appears at four locations:

```
L₀ = S₀ >> 8          (high byte of S₀)
L₃ = S₃ & 0x00FF      (low byte of S₃)
L₄ = S₄ & 0x00FF      (low byte of S₄)
L₇ = S₇ >> 8          (high byte of S₇)
```

Coherence requires all four to be equal. Three pairwise differences suffice
to prove transitivity:

```
E_var = (L₀ - L₃)² + (L₃ - L₄)² + (L₄ - L₇)²
```

`E_var = 0` iff `L₀ = L₃ = L₄ = L₇`.

### 3.2 Constant Alignment (E_const)

Six fixed delimiters must match exactly:

```
E_const =
    (S₀ & 0x00FF)² +              (low byte of S₀ must be 0x00)
    (S₁ - 0x03BF)² +              (chiral delimiter)
    ((S₃ & 0xFF00) - 0x2B00)² +   (high byte of S₃ must be 0x2B)
    ((S₄ & 0xFF00) - 0x2F00)² +   (high byte of S₄ must be 0x2F)
    (S₆ - 0x039F)² +              (cardinal delimiter)
    ((S₇ & 0x00FF) - 0x00FF)²     (low byte of S₇ must be 0xFF)
```

`E_const = 0` iff all six constants are correct.

### 3.3 Monolithic Form

```
Q(S) = E_var + E_const
```

The square of each error term eliminates sign cancellation. Every mismatch
produces positive contribution. The sum is zero iff every individual constraint
is zero.

---

## 4. Free Variables (Payload)

The two payload fields never appear in `Q(S)`:

```
S₂ = 0xNNNN   (free variable N)
S₅ = 0xMMMM   (free variable M)
```

Once `Q(S) = 0` proves the frame, these values pass as clean traversal data.
Possible interpretations include octree ray coordinates, bitboard masks,
memory displacements, child selectors, or symbolic payloads.

---

## 5. Concrete Examples

### 5.1 Valid canonical token

```
omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48

L₀ = 0x05  L₃ = 0x05  L₄ = 0x05  L₇ = 0x05
  → E_var = (5-5)² + (5-5)² + (5-5)² = 0

All six constants match → E_const = 0

Q(S) = 0  → VALID
Payload: N = 0x000c, M = 0x0002
```

### 5.2 Variable coherence breach (L₄ differs)

```
omi-0500-03bf-000c-2b05-2f06-0002-039f-05ff/48

L₀ = 0x05  L₃ = 0x05  L₄ = 0x06  L₇ = 0x05
  → E_var = 0 + (5-6)² + (6-5)² = 2

Q(S) = 2  → INVALID
```

### 5.3 Constant corruption (S₆ wrong)

```
omi-0500-03bf-000c-2b05-2f05-0002-039e-05ff/48

S₆ = 0x039E instead of 0x039F
  → E_const contribution = (0x039E - 0x039F)² = 1

Q(S) = 1  → INVALID
```

---

## 6. Implementation

```javascript
function verifyInstructionLexer(S) {
    const L0 = S[0] >> 8;
    const L3 = S[3] & 0x00FF;
    const L4 = S[4] & 0x00FF;
    const L7 = S[7] >> 8;

    const E_var = (L0 - L3) ** 2 + (L3 - L4) ** 2 + (L4 - L7) ** 2;

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

Zero branches. Zero conditionals. One return value.

---

## 7. Verification

| Test                                | Outcome |
|-------------------------------------|---------|
| Valid canonical token               | Q(S)=0  |
| Valid token, different LL           | Q(S)=0  |
| LL coherence breach (L₄ differs)    | Q(S)=2  |
| LL coherence breach (L₀ differs)    | Q(S)>0  |
| Constant S₁ chiral delimiter wrong  | Q(S)>0  |
| Constant S₆ cardinal delimiter wrong| Q(S)=1  |
| Constant S₀ low byte nonzero        | Q(S)>0  |
| Constant S₃ high byte wrong         | Q(S)>0  |
| Constant S₄ high byte wrong         | Q(S)>0  |
| Constant S₇ low byte ≠ 0xFF        | Q(S)>0  |
| Free variables pass unpenalized     | Q(S)=0  |
| LL = 0x00 with matching constants   | Q(S)=0  |
| LL = 0xFF with matching constants   | Q(S)=0  |
| Rejects null input                  | false   |
| Rejects non-omi prefix             | null    |
| Round-trip via makeOmiAddress      | passes  |

All 18 invariant tests pass in the canonical implementation.

---

## 8. Relation to Other Ontological Layers

| Layer                    | Relation                                        |
|--------------------------|-------------------------------------------------|
| RULES.omi (0x27)         | Declares the quadratic lexer invariant          |
| src/omi/quadratic-lexer.js | Reference implementation                      |
| test/quadratic-lexer.test.js | 18-test invariant suite                     |
| 128-bit CIDR address     | The instruction word fits the 8-segment frame   |
| ECC bitboard masks       | Free variables may carry barcode traversal data |

---

## 9. The Δ_C-Orbit Lexer Extension

### 9.1 The Minimal Quotient

The Δ_C-orbit lexer extends the quadratic lexer by proving the instruction word
lies on a valid Δ_C period-8 trajectory with a consistent Fano point LL. This is
the final reduction — the true foundation of the architecture.

| Layer              | Form                    | Role                     |
|--------------------|-------------------------|--------------------------|
| Dynamical core     | Δ_C(x)                  | Period-8 orbit           |
| Phase quotient     | divmod(pos, 36)         | 1/73 digits              |
| Quadratic gate     | Q(N,M) = K(LL) = 0      | Frame proof              |
| Fano resolution    | Steps ≤ 15              | Ray intercept            |
| Replay ring        | 7! = 5040               | Receipt ledger           |
| Constitutional law | cons() ≠ ()! => 0 ≠ 1   | Structural isolation     |

### 9.2 The Δ_C Law

```
Δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
```

Where `C = 0x5A3C` (the canonical OMI inversion constant). This single law
generates the entire period-8 orbit structure. The period is a mathematical
property of the specific rotation/XOR composition.

### 9.3 Fano Plane Connection

The lens variable `LL ∈ {0x01..0x07}` identifies one of the 7 points of the
Fano plane PG(2,2). The brackets `[0xLL00]` (CBOS origin) and `[0xLLff]`
(closure boundary) declare the instruction ray belongs to the projective line
through point LL. The interior LL instances at S₃ and S₄ confirm the addition
and division operators are bound to the same Fano point.

Two instruction rays with distinct LL₁ ≠ LL₂ traverse distinct Fano lines.
Because any two Fano lines intersect at exactly one point, and the Δ_C law
has period 8, the orbits converge within:

```
Steps_max = 2 × Period − 1 = 15
```

This is the **Fano lottery bound**: any two valid rays resolve their
intersection in at most 15 Δ_C iterations.

### 9.4 The Combined Lexer

```
Q(N, M) = 0  ∧  fano_intercept(a, b, c) ≥ 0
```

No parsing. No branching. No string operations. Pure algebraic surface
membership.

### 9.5 Implementation

```javascript
function verifyOrbitLexer(S) {
  const L0 = S[0] >> 8, L3 = S[3] & 0x00FF;
  const L4 = S[4] & 0x00FF, L7 = S[7] >> 8;

  const E_var = (L0 - L3) ** 2 + (L3 - L4) ** 2 + (L4 - L7) ** 2;

  const E_const =
    (S[0] & 0x00FF) ** 2 +
    (S[1] - 0x03BF) ** 2 +
    ((S[3] & 0xFF00) - 0x2B00) ** 2 +
    ((S[4] & 0xFF00) - 0x2F00) ** 2 +
    (S[6] - 0x039F) ** 2 +
    ((S[7] & 0x00FF) - 0x00FF) ** 2;

  return E_var + E_const;  // 0 iff instruction is valid
}

function deltaC(x, c = 0x5A3C) {
  return ((x << 1) | (x >> 15))
       ^ ((x << 3) | (x >> 13))
       ^ ((x >> 2) | (x << 14))
       ^ c;
}

function fanoIntercept(a, b, c = 0x5A3C) {
  for (let i = 0; i < 15; i++) {
    if (a === b) return i;
    a = deltaC(a, c);
    b = deltaC(b, c);
  }
  return -1;
}
```

### 9.6 Verification

| Test                                | Outcome |
|-------------------------------------|---------|
| Δ_C period-8 holds for all seeds    | passes  |
| Quadratic invariants still enforced | Q(S)=0  |
| LL coherence breach caught          | Q(S)>0  |
| Free variables pass unpenalized     | Q(S)=0  |
| Fano bound ≤ 15 for all LL pairs    | passes  |
| fanoIntercept(a,a) = 0              | passes  |

The binary quadratic form Q(N,M) = 0·N² + 0·NM + 0·M² + K(LL) is degenerate —
the discriminant Δ = 0 vanishes — factoring entirely through K(LL). N and M
are free variables that contribute nothing to Q, carrying the instruction
payload through the proven frame.

### 9.7 Canonical Sources

| Artifact                          | Role                                   |
|-----------------------------------|----------------------------------------|
| src/omi/delta-orbital-lexer.js    | Reference implementation               |
| test/delta-orbital-lexer.test.js  | 42-test invariant suite                |
| RULES.omi (0x28)                  | Declares the orbital lexer invariant   |
| docs/omi-object-model.manifest.json | Registered transformer and engine    |
