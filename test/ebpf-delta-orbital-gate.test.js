import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  isOrbitLexerValid, verifyOrbitLexer,
  fanoTruthResolver, deltaC, GENESIS_SEGMENTS
} from '../src/omi/delta-orbital-lexer.js';

/* ===================================================================
 * Mirror of eBPF/XDP Gate 1 — branchless Q(S) computation.
 * Must produce identical results to isOrbitLexerValid() for all inputs.
 * =================================================================== */

function ebpfQuadraticGate(S) {
  if (!S || S.length < 8) return false;

  const s0 = S[0], s1 = S[1], s3 = S[3], s4 = S[4], s6 = S[6], s7 = S[7];

  const ll0 = (s0 >> 8) & 0xFF;
  const ll3 =  s3        & 0xFF;
  const ll4 =  s4        & 0xFF;
  const ll7 = (s7 >> 8)  & 0xFF;

  const d03 = ll0 - ll3;
  const d34 = ll3 - ll4;
  const d47 = ll4 - ll7;
  const E_var = (d03 * d03) + (d34 * d34) + (d47 * d47);

  const e_s0_lo = (s0 & 0x00FF);
  const e_s1    =  s1           - 0x03BF;
  const e_s3_hi = (s3 & 0xFF00) - 0x2B00;
  const e_s4_hi = (s4 & 0xFF00) - 0x2F00;
  const e_s6    =  s6           - 0x039F;
  const e_s7_lo = (s7 & 0x00FF) - 0xFF;

  const E_const = (e_s0_lo * e_s0_lo) + (e_s1    * e_s1) +
                  (e_s3_hi * e_s3_hi) + (e_s4_hi * e_s4_hi) +
                  (e_s6    * e_s6)    + (e_s7_lo * e_s7_lo);

  return (E_var + E_const) === 0;
}

/* ===================================================================
 * Mirror of eBPF/XDP Gate 2 — Fano projective closure resolution.
 * Replicates the unrolled Δ_C orbit loop in the BPF program.
 * =================================================================== */

function bpfDeltaC(x, c) {
  const r1 = ((x << 1) | (x >> 15)) & 0xFFFF;
  const r3 = ((x << 3) | (x >> 13)) & 0xFFFF;
  const r2 = ((x >> 2) | (x << 14)) & 0xFFFF;
  return (r1 ^ r3 ^ r2 ^ c) & 0xFFFF;
}

function ebpfFanoGate(S) {
  if (!S || S.length < 8) return false;

  const ll0 = (S[0] >> 8) & 0xFF;

  /* LL must be in Fano plane point range (1-7) */
  if (ll0 < 1 || ll0 > 7) return false;

  const c_mod = (ll0 * 0x1337) & 0xFFFF;
  let current_orbit = S[2];
  const target = S[5];
  let resolved_steps = -1;

  /* Unrolled 1..14 — exact mirror of BPF #pragma unroll loop */
  for (let i = 1; i <= 14; i++) {
    current_orbit = bpfDeltaC(current_orbit, c_mod);
    if (current_orbit === target && resolved_steps === -1)
      resolved_steps = i;
  }

  return resolved_steps !== -1;
}

function ebpfCombinedGates(S) {
  return ebpfQuadraticGate(S) && ebpfFanoGate(S);
}

/* ===================================================================
 * Helpers
 * =================================================================== */

function makeFrame(s0, s1, s2, s3, s4, s5, s6, s7) {
  return new Uint16Array([s0, s1, s2, s3, s4, s5, s6, s7]);
}

function makeValidFrame(ll, nn, mm) {
  return makeFrame(
    (ll << 8) | 0x00, 0x03BF, nn,
    0x2B00 | ll, 0x2F00 | ll, mm,
    0x039F, (ll << 8) | 0xFF
  );
}

/* ---------- golden fixtures ---------- */

const GENESIS_FRAME   = makeFrame(0x0100, 0x03BF, 0x7C00, 0x2B01, 0x2F01, 0x1434, 0x039F, 0x01FF);
const BYTE_SWAPPED    = makeFrame(0x0001, 0xBF03, 0x007C, 0x012B, 0x012F, 0x3414, 0x9F03, 0xFF01);
const BAD_CHIRAL      = makeFrame(0x0100, 0xDEAD, 0x7C00, 0x2B01, 0x2F01, 0x1434, 0x039F, 0x01FF);
const BAD_CARDINAL    = makeFrame(0x0100, 0x03BF, 0x7C00, 0x2B01, 0x2F01, 0x1434, 0xBEEF, 0x039F);
const LL_MISMATCH_S3  = makeFrame(0x0100, 0x03BF, 0x7C00, 0x2B05, 0x2F01, 0x1434, 0x039F, 0x01FF);
const LL_MISMATCH_S4  = makeFrame(0x0100, 0x03BF, 0x7C00, 0x2B01, 0x2F07, 0x1434, 0x039F, 0x01FF);
const LL_MISMATCH_S7  = makeFrame(0x0100, 0x03BF, 0x7C00, 0x2B01, 0x2F01, 0x1434, 0x039F, 0x03FF);

const LL_VALUES = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];

/* ===================================================================
 * Gate 1 tests
 * =================================================================== */

test('eBPF gate 1: genesis frame passes (Q(S)=0)', () => {
  assert.ok(ebpfQuadraticGate(GENESIS_FRAME));
  assert.ok(isOrbitLexerValid(GENESIS_FRAME));
});

test('eBPF gate 1: byte-swapped frame rejected (Q(S) >> 0)', () => {
  assert.equal(ebpfQuadraticGate(BYTE_SWAPPED), false);
  assert.equal(isOrbitLexerValid(BYTE_SWAPPED), false);
});

test('eBPF gate 1: non-zero S0 low byte rejected', () => {
  const f = makeFrame(0x01FF, 0x03BF, 0x7C00, 0x2B01, 0x2F01, 0x1434, 0x039F, 0x01FF);
  assert.equal(ebpfQuadraticGate(f), false);
  assert.equal(isOrbitLexerValid(f), false);
});

test('eBPF gate 1: bad chiral delimiter rejected', () => {
  assert.equal(ebpfQuadraticGate(BAD_CHIRAL), false);
  assert.equal(isOrbitLexerValid(BAD_CHIRAL), false);
});

test('eBPF gate 1: bad cardinal delimiter rejected', () => {
  assert.equal(ebpfQuadraticGate(BAD_CARDINAL), false);
  assert.equal(isOrbitLexerValid(BAD_CARDINAL), false);
});

test('eBPF gate 1: LL mismatch at S3 rejected', () => {
  assert.equal(ebpfQuadraticGate(LL_MISMATCH_S3), false);
  assert.equal(isOrbitLexerValid(LL_MISMATCH_S3), false);
});

test('eBPF gate 1: LL mismatch at S4 rejected', () => {
  assert.equal(ebpfQuadraticGate(LL_MISMATCH_S4), false);
  assert.equal(isOrbitLexerValid(LL_MISMATCH_S4), false);
});

test('eBPF gate 1: LL mismatch at S7 rejected', () => {
  assert.equal(ebpfQuadraticGate(LL_MISMATCH_S7), false);
  assert.equal(isOrbitLexerValid(LL_MISMATCH_S7), false);
});

test('eBPF gate 1: Fano LL values 0x01..0x07 pass', () => {
  for (const ll of LL_VALUES) {
    const frame = makeValidFrame(ll, 0, 0);
    assert.ok(ebpfQuadraticGate(frame), `LL=0x${ll.toString(16)}`);
    assert.ok(isOrbitLexerValid(frame), `LL=0x${ll.toString(16)}`);
  }
});

test('eBPF gate 1: NN and MM do not affect Q(S)', () => {
  const base = makeValidFrame(0x01, 0, 0);
  for (let nn = 0x0000; nn <= 0xFFFF; nn += 0x1000) {
    for (let mm = 0x0000; mm <= 0xFFFF; mm += 0x1000) {
      const frame = makeFrame(base[0], base[1], nn, base[3], base[4], mm, base[6], base[7]);
      assert.equal(ebpfQuadraticGate(frame), isOrbitLexerValid(frame),
        `NN=0x${nn.toString(16)} MM=0x${mm.toString(16)}`);
    }
  }
});

test('eBPF gate 1: LL mismatch at each of 4 positions for 0x01..0x0F', () => {
  for (let llLax = 0x01; llLax <= 0x0F; llLax++) {
    for (let pos = 0; pos < 4; pos++) {
      const frame = makeValidFrame(0x01, 0, 0);
      switch (pos) {
        case 0: frame[0] = (llLax << 8) | (frame[0] & 0x00FF); break;
        case 1: frame[3] = (frame[3] & 0xFF00) | llLax; break;
        case 2: frame[4] = (frame[4] & 0xFF00) | llLax; break;
        case 3: frame[7] = (llLax << 8) | (frame[7] & 0x00FF); break;
      }
      if (llLax === 0x01) {
        assert.ok(ebpfQuadraticGate(frame), `LL=0x01 at pos ${pos} still passes`);
      } else {
        assert.equal(ebpfQuadraticGate(frame), false,
          `LL=0x${llLax.toString(16)} at pos ${pos} rejected`);
      }
    }
  }
});

test('eBPF gate 1: Q(S) matches isOrbitLexerValid for 1000 random frames', () => {
  const rand = (n) => Math.floor(Math.random() * n);
  for (let i = 0; i < 1000; i++) {
    const S = new Uint16Array(8);
    for (let j = 0; j < 8; j++) S[j] = rand(0x10000);
    assert.equal(ebpfQuadraticGate(S), isOrbitLexerValid(S));
  }
});

test('eBPF gate 1: null and short buffer rejected', () => {
  assert.equal(ebpfQuadraticGate(null), false);
  assert.equal(ebpfQuadraticGate(undefined), false);
  assert.equal(ebpfQuadraticGate(new Uint16Array(4)), false);
});

test('eBPF gate 1: GENESIS_SEGMENTS frame passes', () => {
  assert.ok(GENESIS_SEGMENTS);
  assert.ok(GENESIS_SEGMENTS.length >= 8);
  assert.ok(ebpfQuadraticGate(GENESIS_SEGMENTS));
  assert.ok(isOrbitLexerValid(GENESIS_SEGMENTS));
});

/* ===================================================================
 * Gate 2 — Fano orbit resolution tests
 * =================================================================== */

test('eBPF gate 2: bpfDeltaC matches JS deltaC for all 65536 values', () => {
  for (let x = 0; x < 0x10000; x++) {
    for (const c of [0x5A3C, 0x0000, 0xFFFF, 0x1337, 0x7C00]) {
      assert.equal(bpfDeltaC(x, c), deltaC(x, c),
        `deltaC(0x${x.toString(16)}, 0x${c.toString(16)})`);
    }
  }
});

test('eBPF gate 2: genesis frame resolves in 1 step (LL=1, NN=0x7C00, MM=0x1434)', () => {
  assert.ok(ebpfFanoGate(GENESIS_FRAME));
  assert.equal(fanoTruthResolver(0x01, 0x7C00, 0x1434), 1);
});

test('eBPF gate 2: LL outside Fano range (0, 8..0xFF) rejected', () => {
  for (let ll = 0x00; ll <= 0xFF; ll++) {
    if (ll >= 0x01 && ll <= 0x07) continue;
    const frame = makeValidFrame(ll, 0x0000, 0x0000);
    /* Gate 1 passes (Q(S)=0 with consistent LL, valid delimiters) */
    assert.ok(ebpfQuadraticGate(frame), `LL=0x${ll.toString(16)} passes Gate 1`);
    /* Gate 2 rejects — LL not in Fano point set */
    assert.equal(ebpfFanoGate(frame), false, `LL=0x${ll.toString(16)} rejected by Gate 2`);
  }
});

test('eBPF gate 2: NN that never reaches MM returns -1', () => {
  for (const ll of LL_VALUES) {
    const frame = makeValidFrame(ll, 0xFFFF, 0x0001);
    /* Gate 1 passes — structurally valid */
    assert.ok(ebpfQuadraticGate(frame), `LL=0x${ll.toString(16)} passes Gate 1`);
    /* Gate 2: 0xFFFF → Δ_C never reaches 0x0001 within 14 steps */
    assert.equal(ebpfFanoGate(frame), false, `LL=0x${ll.toString(16)} fails Gate 2`);
    assert.equal(fanoTruthResolver(ll, 0xFFFF, 0x0001), -1);
  }
});

test('eBPF gate 2: all Fano LL values resolve NN→MM equivalently to JS', () => {
  const testPairs = [
    [0x01, 0x0000, 0x7CB2],
    [0x02, 0x1000, 0xC0B4],
    [0x03, 0x2000, 0xEF07],
    [0x04, 0x4000, 0x1721],
    [0x05, 0x5000, 0x8C63],
    [0x06, 0x6000, 0x3F9E],
    [0x07, 0x0000, 0x9B33],
  ];
  for (const [ll, nn, mm] of testPairs) {
    const frame = makeValidFrame(ll, nn, mm);
    assert.ok(ebpfQuadraticGate(frame), `LL=0x${ll.toString(16)} passes Gate 1`);
    assert.equal(ebpfFanoGate(frame), fanoTruthResolver(ll, nn, mm) !== -1,
      `LL=0x${ll.toString(16)} NN=0x${nn.toString(16)} MM=0x${mm.toString(16)}`);
  }
});

test('eBPF gate 2: each Fano LL finds its MM within 14 steps for boot NN=0x7C00', () => {
  for (const ll of LL_VALUES) {
    const c_mod = (ll * 0x1337) & 0xFFFF;
    let state = 0x7C00;
    for (let step = 1; step <= 14; step++) {
      state = bpfDeltaC(state, c_mod);
    }
    const mm = state;
    const frame = makeValidFrame(ll, 0x7C00, mm);
    assert.ok(ebpfFanoGate(frame), `LL=0x${ll.toString(16)} NN=0x7C00 MM=0x${mm.toString(16)}`);
    const steps = fanoTruthResolver(ll, 0x7C00, mm);
    assert.ok(steps >= 1 && steps <= 14,
      `LL=0x${ll.toString(16)} resolves in ${steps} steps`);
  }
});

test('eBPF gate 2: 14-step failure for near-miss MM values', () => {
  for (const ll of LL_VALUES) {
    /* Pick MM that is 1 off from the correct trajectory */
    const c_mod = (ll * 0x1337) & 0xFFFF;
    let state = 0x7C00;
    for (let step = 1; step <= 14; step++) {
      state = bpfDeltaC(state, c_mod);
    }
    const correct_mm = state;
    const wrong_mm = (correct_mm + 1) & 0xFFFF;
    const frame = makeValidFrame(ll, 0x7C00, wrong_mm);
    assert.equal(ebpfFanoGate(frame), false,
      `LL=0x${ll.toString(16)} near-miss MM=0x${wrong_mm.toString(16)} rejected`);
    assert.equal(fanoTruthResolver(ll, 0x7C00, wrong_mm), -1);
  }
});

/* ===================================================================
 * Combined Gate 1 + Gate 2
 * =================================================================== */

test('eBPF combined: genesis frame passes both gates', () => {
  assert.ok(ebpfCombinedGates(GENESIS_FRAME));
});

test('eBPF combined: LL=0x08 frame fails Gate 2 despite passing Gate 1', () => {
  const frame = makeValidFrame(0x08, 0x0000, 0x0000);
  assert.ok(ebpfQuadraticGate(frame), 'Gate 1 passes (consistent LL=0x08)');
  assert.equal(ebpfFanoGate(frame), false, 'Gate 2 rejects (LL not in 1..7)');
  assert.equal(ebpfCombinedGates(frame), false, 'Combined rejects');
});

test('eBPF combined: structurally valid but wrong trajectory rejected', () => {
  const frame = makeFrame(0x0100, 0x03BF, 0x7C00, 0x2B01, 0x2F01, 0xDEAD, 0x039F, 0x01FF);
  assert.ok(ebpfQuadraticGate(frame), 'Gate 1 passes');
  assert.equal(ebpfFanoGate(frame), false, 'Gate 2 rejects (MM=0xDEAD unreachable)');
  assert.equal(ebpfCombinedGates(frame), false, 'Combined rejects');
});

test('eBPF combined: 500 random structurally valid frames match fanoTruthResolver', () => {
  const rand = (n) => Math.floor(Math.random() * n);
  for (let i = 0; i < 500; i++) {
    const ll = 1 + rand(7);
    const nn = rand(0x10000);
    const mm = rand(0x10000);
    const frame = makeValidFrame(ll, nn, mm);
    const gate2Pass = ebpfFanoGate(frame);
    const jsResolves = fanoTruthResolver(ll, nn, mm) !== -1;
    assert.equal(gate2Pass, jsResolves,
      `LL=0x${ll.toString(16)} NN=0x${nn.toString(16)} MM=0x${mm.toString(16)}`);
  }
});
