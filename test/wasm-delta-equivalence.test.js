import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  deltaC, fanoTruthResolver, makeGenesisTarget,
  verifyOrbitLexer, isOrbitLexerValid, generateDeltaCOrbit,
  fanoIntercept, fanoIntersectionPoint, DELTA_C_CONSTANT, GENESIS_SEGMENTS
} from '../src/omi/delta-orbital-lexer.js';
import {
  initWasm, isWasmLoaded,
  w_deltaC, w_fanoTruthResolver, w_makeGenesisTarget,
  w_verifyOrbitLexer, w_verifyOrbitLexerQuadratic,
  w_generateDeltaCOrbit, w_fanoIntercept, w_fanoIntersectionPoint
} from '../src/omi/wasm-delta-loader.js';

const JS_IMPLS = {
  deltaC: (x, C) => deltaC(x, C ?? DELTA_C_CONSTANT),
  fanoTruthResolver: (LL, NN, MM) => fanoTruthResolver(LL, NN, MM),
  makeGenesisTarget: (LL, NN) => makeGenesisTarget(LL, NN),
  fanoIntercept: (a, b, C) => fanoIntercept(a, b, C ?? DELTA_C_CONSTANT),
  fanoIntersectionPoint: (LL1, LL2) => fanoIntersectionPoint(LL1, LL2)
};

before(async () => {
  await initWasm();
});

describe('WASM Delta-C equivalence', () => {
  it('deltaC: 100 random values match', () => {
    for (let i = 0; i < 100; i++) {
      const x = (Math.random() * 65536) | 0;
      const C = (Math.random() * 65536) | 0;
      assert.equal(w_deltaC(x, C), JS_IMPLS.deltaC(x, C));
    }
  });

  it('deltaC canonical constant matches', () => {
    for (let x = 0; x < 256; x++) {
      assert.equal(w_deltaC(x, DELTA_C_CONSTANT), JS_IMPLS.deltaC(x, DELTA_C_CONSTANT));
    }
  });

  it('deltaC: period-8 verification on small set', () => {
    const C = 0x5A3C;
    for (let x = 0; x < 32; x++) {
      let a = w_deltaC(x, C);
      let b = JS_IMPLS.deltaC(x, C);
      assert.equal(a, b);
    }
  });
});

describe('WASM fanoTruthResolver equivalence', () => {
  it('all Fano LL (1-7) with canonical boot address', () => {
    for (let LL = 1; LL <= 7; LL++) {
      const MM = JS_IMPLS.makeGenesisTarget(LL, 0x7C00);
      const jsSteps = JS_IMPLS.fanoTruthResolver(LL, 0x7C00, MM);
      const wsSteps = w_fanoTruthResolver(LL, 0x7C00, MM);
      assert.equal(wsSteps, jsSteps);
    }
  });

  it('non-Fano LL returns -1', () => {
    for (let LL = 0; LL <= 8; LL += 8) {
      assert.equal(w_fanoTruthResolver(LL, 0x1234, 0x5678), -1);
    }
  });

  it('same NN and MM returns 0', () => {
    for (let LL = 1; LL <= 7; LL++) {
      assert.equal(w_fanoTruthResolver(LL, 0xABCD, 0xABCD), 0);
    }
  });

  it('100 random Fano truth rows match', () => {
    for (let i = 0; i < 100; i++) {
      const LL = ((Math.random() * 7) | 0) + 1;
      const NN = (Math.random() * 65536) | 0;
      const MM = (Math.random() * 65536) | 0;
      const js = JS_IMPLS.fanoTruthResolver(LL, NN, MM);
      const ws = w_fanoTruthResolver(LL, NN, MM);
      assert.equal(ws, js);
    }
  });
});

describe('WASM makeGenesisTarget equivalence', () => {
  it('all Fano LL produce matching MM', () => {
    for (let LL = 1; LL <= 7; LL++) {
      const js = JS_IMPLS.makeGenesisTarget(LL, 0x7C00);
      const ws = w_makeGenesisTarget(LL, 0x7C00);
      assert.equal(ws, js);
    }
  });

  it('non-Fano LL returns 0 from WASM', () => {
    assert.equal(w_makeGenesisTarget(0, 0x7C00), 0);
  });
});

describe('WASM fanoIntercept equivalence', () => {
  it('same value returns 0', () => {
    assert.equal(w_fanoIntercept(0x1234, 0x1234), 0);
  });

  it('100 random pairs match', () => {
    for (let i = 0; i < 100; i++) {
      const a = (Math.random() * 65536) | 0;
      const b = (Math.random() * 65536) | 0;
      const C = (Math.random() * 65536) | 0;
      assert.equal(w_fanoIntercept(a, b, C), JS_IMPLS.fanoIntercept(a, b, C));
    }
  });
});

describe('WASM fanoIntersectionPoint equivalence', () => {
  it('all Fano pairs match', () => {
    for (let LL1 = 1; LL1 <= 7; LL1++) {
      for (let LL2 = 1; LL2 <= 7; LL2++) {
        assert.equal(
          w_fanoIntersectionPoint(LL1, LL2),
          JS_IMPLS.fanoIntersectionPoint(LL1, LL2)
        );
      }
    }
  });
});

describe('WASM verifyOrbitLexer equivalence', () => {
  it('genesis frame is valid in both', () => {
    const S = GENESIS_SEGMENTS;
    assert.equal(w_verifyOrbitLexer(S), 0);
    assert.equal(w_verifyOrbitLexerQuadratic(S), 0);
  });

  it('malformed frame fails in both', () => {
    const bad = new Uint16Array([0x0500, 0x03BF, 0x000C, 0x2B04, 0x2F05, 0x0002, 0x039F, 0x05FF]);
    const wsErr = w_verifyOrbitLexer(bad);
    const jsErr = verifyOrbitLexer(bad);
    assert.notEqual(wsErr, 0);
    assert.equal(isOrbitLexerValid(bad), false);
  });

  it('chiral delimiter mismatch caught in WASM', () => {
    const bad = new Uint16Array([0x0100, 0xDEAD, 0x000C, 0x2B01, 0x2F01, 0x0002, 0x039F, 0x01FF]);
    assert.notEqual(w_verifyOrbitLexer(bad), 0);
  });

  it('cardinal delimiter mismatch caught in WASM', () => {
    const bad = new Uint16Array([0x0100, 0x03BF, 0x000C, 0x2B01, 0x2F01, 0x0002, 0xBEEF, 0x01FF]);
    assert.notEqual(w_verifyOrbitLexer(bad), 0);
  });

  it('LL mismatch across segments detected in both', () => {
    const bad = new Uint16Array([0x0100, 0x03BF, 0x7C00, 0x2B02, 0x2F01, 0x1434, 0x039F, 0x01FF]);
    const wsErr = w_verifyOrbitLexer(bad);
    const jsErr = verifyOrbitLexer(bad);
    assert.notEqual(wsErr, 0);
    assert.notEqual(jsErr, 0);
  });
});
