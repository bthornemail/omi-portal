# Face 5 — orbit resolves truth

**Projective Resolver — δ_C_LL State Transitions (Ceiling k < 15)**

## 🟢 What

After a frame passes Gate 1 (Q(S) = 0), the **projective resolver** answers: *does this frame's antecedent (NN) transition to its consequent (MM) within the Fano resolution bound?*

The resolver iterates the **delta-C law** — a period-8 bitwise rotation operator parameterized by a Fano point LL:

```
δ_C(x) = rotl(x,1) ⊕ rotl(x,3) ⊕ rotr(x,2) ⊕ C
C = LL × 0x1337      (standard resolver)
C = 0x5A3A ⊕ LL×0x0101  (classic resolver, bitwise mirror)
```

Starting from seed NN, each step applies δ_C_LL. If the orbit reaches MM **in fewer than 15 steps** (the Fano ceiling), the frame is accepted. If it diverges beyond 14 steps, the frame is dropped — it describes an impossible trajectory.

```
NN ──δ_C_LL──►  step 1  ──δ_C_LL──►  step 2  ──...──►  MM (k steps, k < 15)
```

The 7 Fano points (LL = 1..7) define 7 distinct delta-C constants, each producing a unique orbit family.

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/omi/delta-orbital-lexer.js` | `deltaC(x, c)` — core transition; `fanoTruthResolver(LL, NN, MM)` — step loop with k < 15 ceiling; `fanoIntercept(a, b)` — orbit convergence distance; `makeGenesisTarget(LL, NN)` — compute expected MM |
| `src/omi/inversion-kernel.js` | `OmiCentralInversionKernel` — inversion mirror `Inv(x) = x ⊕ 0x5A3C`, period-8 verification |
| `src/omi/sexagesimal-kernel.js` | `OmiSexagesimalKernel` — projective suffix evaluation for sexagesimal clock steps, reciprocal ratio pairs |
| `src/omi/ring-indexer.js` | Packs step count into receipt (`48-bit provenance \| 8-bit steps \| 8-bit LL \| 16-bit NN \| 16-bit MM`) |
| `src/omi/sliderule-kernel.js` | `OmiSexagesimalSlideRuleKernel` — projective network evaluation (ULA, LAN, boot) |

### The delta-C law

```javascript
export function deltaC(x, c = 0x5A3C) {
  const x16 = x & 0xFFFF;
  // rotl(x,1) — left rotate by 1 bit
  const t1 = ((x16 << 1) | (x16 >>> 15)) & 0xFFFF;
  // rotl(x,3) — left rotate by 3 bits
  const t3 = ((x16 << 3) | (x16 >>> 13)) & 0xFFFF;
  // rotr(x,2) — right rotate by 2 bits
  const t2 = ((x16 >>> 2) | (x16 << 14)) & 0xFFFF;
  return (t1 ^ t3 ^ t2 ^ (c & 0xFFFF)) & 0xFFFF;
}
```

### The Fano resolution loop

```javascript
export function fanoTruthResolver(LL, NN, MM) {
  const C = (LL & 0xFF) * 0x1337;  // LL-parameterized constant
  let state = NN & 0xFFFF;
  for (let k = 0; k < 15; k++) {
    if (state === (MM & 0xFFFF)) return k;  // converged in k steps
    state = deltaC(state, C);
  }
  return -1;  // did not converge within ceiling
}
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/delta-orbital-lexer.test.js` | delta-C period-8, fanoTruthResolver convergence for all 7 LL values, genesis target computation |
| `test/omicron-inversion.test.js` | Inversion mirror period-8, prime ideal 73 symmetry |
| `test/omicron-sexagesimal.test.js` | Sexagesimal digit bound (0–59), factorial stride (120/720/5040), reciprocal symmetry |
| `test/ring-indexer.test.js` | Receipt packing with step count, genesis bootstrap at slot 1504 |
| `test/wasm-delta-equivalence.test.js` | WASM delta-C matches JS for 100 random values |
| `test/sliderule-sync.test.js` | Slide rule projective evaluation (ULA, boot, atomic substrate) |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x64**: Recursive resolution MUST close in ≤14 steps; >14 MUST drop
- **Rule 0x6F**: Central inversion `Inv(x) = x ⊕ 0x5A3C` MUST be the bitwise mirror

### Extension points

- **New resolver variant**: Implement a resolver with a different C-constant formula. The `fanoTruthResolver` function signature `(LL, NN, MM) → steps` is the stable interface — swap implementations without changing callers.
- **Custom ceiling**: Adjust `FANO_RESOLUTION_MAX` (currently 14) for non-standard Fano planes. Must remain < 15 to preserve the 4-bit step field in the 64-bit receipt.
- **Reciprocal ratio pair**: Add new projective suffix pairs to the sexagesimal kernel for alternative clock geometries.

### Performance constraints

- Worst case: 14 iterations of delta-C = 14 × (3 rotates + 3 XORs + 1 AND) ≈ 100 CPU cycles.
- All orbit computation is integer-only — no floating point.
- The `fanoTruthResolver` is called once per ingested frame on the hot path. For the genesis frame (LL=1, NN=0x7C00), convergence takes exactly 1 step.
