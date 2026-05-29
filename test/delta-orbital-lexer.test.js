import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deltaC, generateDeltaCOrbit, extractLL, isFanoPoint,
  verifyOrbitLexer, isOrbitLexerValid, fanoIntercept,
  fanoIntersectionPoint, fanoResolutionSteps,
  parseOmiAddressToSegments, makeOmiAddress,
  orbitPhaseFromPosition, deltaCEight, isPeriodEight,
  formatBitboard, FANO_LINES, SEGMENT_LAYOUT,
  FANO_POINTS, FANO_RESOLUTION_MAX, ORBIT_PERIOD,
  CHIRAL_DELIMITER, CARDINAL_DELIMITER, DELTA_C_CONSTANT,
  extractTruthRow, fanoTruthResolver, fanoTruthResolverClassic,
  verifyTruthRow, deltaCOrbitDistance, TRANSYLVANIA_PLANE_B,
  transylvaniaTicketCount, transylvaniaMatchTwo,
  GENESIS_BOOT_ADDRESS, GENESIS_SEGMENTS, makeGenesisFrame,
  makeGenesisTarget, verifyInstructionPipeline,
  bootstrapSystemKernel, computeBootRingIndex, computeBootPhase,
  GENESIS_REPLAY_RING_INDEX, GENESIS_EPOCH,
  GENESIS_ORBIT_EPOCH, GENESIS_ORBIT_PHASE, GENESIS_B_DIGIT,
  SAB_BOOT_SLOT
} from '../src/omi/delta-orbital-lexer.js';

test('Δ_C: single step is 16-bit', () => {
  const result = deltaC(0x0500);
  assert.ok(result >= 0 && result <= 0xFFFF);
});

test('Δ_C: different seeds produce different orbits', () => {
  const a = deltaC(0x0500);
  const b = deltaC(0x0600);
  assert.notEqual(a, b);
});

test('Δ_C: constant 0x5A3C matches canonical', () => {
  assert.equal(DELTA_C_CONSTANT, 0x5A3C);
});

test('Δ_C: period-8 property holds', () => {
  for (const seed of [0x0000, 0x0001, 0x0500, 0xFFFF, 0x5A3C, 0x03BF, 0x039F]) {
    assert.ok(isPeriodEight(seed), `period-8 failed for seed 0x${seed.toString(16)}`);
  }
});

test('Δ_C: orbit has exactly 8 positions for period-8 cycle', () => {
  const orbit = generateDeltaCOrbit(0x0500, 9);
  assert.equal(orbit[0], orbit[8]);
});

test('Δ_C: orbit from seed reaches back after 8 steps', () => {
  const seed = 0x0500;
  const back = deltaCEight(seed);
  assert.equal(back, seed);
});

test('Δ_C: orbit positions are distinct for non-degenerate seed', () => {
  const orbit = generateDeltaCOrbit(0x0001, 8);
  const uniq = new Set(orbit);
  assert.ok(uniq.size >= 2);
});

test('Δ_C: generateDeltaCOrbit custom length', () => {
  const orbit = generateDeltaCOrbit(0x0500, 17);
  assert.equal(orbit.length, 17);
  assert.equal(orbit[0], orbit[8]);
  assert.equal(orbit[0], orbit[16]);
});

test('Orbital Lexer: valid canonical instruction returns 0', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyOrbitLexer(S), 0);
  assert.ok(isOrbitLexerValid(S));
});

test('Orbital Lexer: valid with different LL returns 0', () => {
  const S = parseOmiAddressToSegments('omi-1a00-03bf-ffff-2b1a-2f1a-0000-039f-1aff/48');
  assert.ok(S);
  assert.equal(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: LL coherence breach returns nonzero', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f06-0002-039f-05ff/48');
  assert.ok(S);
  assert.notEqual(verifyOrbitLexer(S), 0);
  assert.equal(isOrbitLexerValid(S), false);
});

test('Orbital Lexer: S1 chiral delimiter corruption returns nonzero', () => {
  const S = parseOmiAddressToSegments('omi-0500-03be-000c-2b05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.notEqual(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: S6 cardinal delimiter corruption returns nonzero', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039e-05ff/48');
  assert.ok(S);
  assert.notEqual(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: free variables pass through unpenalized', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-cafe-2b05-2f05-beef-039f-05ff/48');
  assert.ok(S);
  assert.equal(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: zero LL with matching constants returns 0', () => {
  const S = parseOmiAddressToSegments('omi-0000-03bf-0000-2b00-2f00-0000-039f-00ff/48');
  assert.ok(S);
  assert.equal(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: max LL with matching constants returns 0', () => {
  const S = parseOmiAddressToSegments('omi-ff00-03bf-0000-2bff-2fff-0000-039f-ffff/48');
  assert.ok(S);
  assert.equal(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: S0 low byte nonzero returns nonzero', () => {
  const S = parseOmiAddressToSegments('omi-0501-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  assert.ok(S);
  assert.notEqual(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: S7 low byte not 0xFF returns nonzero', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05fe/48');
  assert.ok(S);
  assert.notEqual(verifyOrbitLexer(S), 0);
});

test('Orbital Lexer: all-zero instruction returns nonzero', () => {
  assert.notEqual(verifyOrbitLexer(new Uint16Array(8).fill(0)), 0);
});

test('Fano: fanoIntercept of same value returns 0', () => {
  assert.equal(fanoIntercept(0x0500, 0x0500), 0);
});

test('Fano: fanoIntercept of 0x00 and 0xFF is bounded by 15', () => {
  const steps = fanoIntercept(0x0000, 0x00FF);
  assert.ok(steps === -1 || (steps >= 0 && steps <= FANO_RESOLUTION_MAX));
});

test('Fano: fanoResolutionSteps bound is exactly 15 for distinct Fano points', () => {
  for (let LL1 = 1; LL1 <= 7; LL1++) {
    for (let LL2 = 1; LL2 <= 7; LL2++) {
      if (LL1 === LL2) {
        assert.equal(fanoResolutionSteps(LL1, LL2), 0);
      } else {
        assert.equal(fanoResolutionSteps(LL1, LL2), 15);
      }
    }
  }
});

test('Fano: fanoIntersectionPoint for same point returns 0', () => {
  assert.equal(fanoIntersectionPoint(3, 3), 0);
});

test('Fano: fanoIntersectionPoint for non-Fano values returns 0', () => {
  assert.equal(fanoIntersectionPoint(0, 1), 0);
  assert.equal(fanoIntersectionPoint(1, 8), 0);
  assert.equal(fanoIntersectionPoint(0, 0), 0);
});

test('Fano: fanoIntersectionPoint resolves distinct Fano points', () => {
  const p = fanoIntersectionPoint(1, 2);
  assert.ok(p >= 1 && p <= 7);
});

test('Fano: isFanoPoint correctly identifies valid points', () => {
  assert.ok(isFanoPoint(1));
  assert.ok(isFanoPoint(7));
  assert.equal(isFanoPoint(0), false);
  assert.equal(isFanoPoint(8), false);
  assert.equal(isFanoPoint(-1), false);
  assert.equal(isFanoPoint(3.5), false);
});

test('Fano: FANO_LINES has 7 entries with 3 points each', () => {
  assert.equal(FANO_LINES.length, 7);
  for (const line of FANO_LINES) {
    assert.equal(line.points.length, 3);
    assert.ok(line.id >= 1 && line.id <= 7);
    assert.equal(typeof line.name, 'string');
  }
});

test('Orbit Phase: divmod(0) gives epoch=0, phase=0', () => {
  const { epoch, phase } = orbitPhaseFromPosition(0);
  assert.equal(epoch, 0);
  assert.equal(phase, 0);
});

test('Orbit Phase: divmod(36) gives epoch=1, phase=0', () => {
  const { epoch, phase } = orbitPhaseFromPosition(36);
  assert.equal(epoch, 1);
  assert.equal(phase, 0);
});

test('Orbit Phase: divmod(5040) gives epoch=140, phase=0', () => {
  const { epoch, phase } = orbitPhaseFromPosition(5040);
  assert.equal(epoch, 140);
  assert.equal(phase, 0);
});

test('Orbit Phase: divmod(37) gives epoch=1, phase=1', () => {
  const { epoch, phase } = orbitPhaseFromPosition(37);
  assert.equal(epoch, 1);
  assert.equal(phase, 1);
});

test('Format: parseOmiAddressToSegments round-trips through makeOmiAddress', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  const addr = makeOmiAddress(S);
  const S2 = parseOmiAddressToSegments(addr);
  assert.deepEqual(S, S2);
});

test('Format: null input returns null', () => {
  assert.equal(parseOmiAddressToSegments(''), null);
});

test('Format: non-omi prefix returns null', () => {
  assert.equal(parseOmiAddressToSegments('abc-0500-03bf-0000-2b00-2f00-0000-039f-00ff/48'), null);
});

test('Format: formatBitboard splits into hi/lo 64-bit', () => {
  const S = new Uint16Array([0x0500, 0x03BF, 0x000C, 0x2B05, 0x2F05, 0x0002, 0x039F, 0x05FF]);
  const bb = formatBitboard(S);
  assert.equal(typeof bb.hi, 'bigint');
  assert.equal(typeof bb.lo, 'bigint');
  assert.equal(bb.hi, (BigInt(0x0500) << 48n) | (BigInt(0x03BF) << 32n) |
                       (BigInt(0x000C) << 16n) | BigInt(0x2B05));
  assert.equal(bb.lo, (BigInt(0x2F05) << 48n) | (BigInt(0x0002) << 32n) |
                       (BigInt(0x039F) << 16n) | BigInt(0x05FF));
});

test('Constants: delimiters match canonical values', () => {
  assert.equal(CHIRAL_DELIMITER, 0x03BF);
  assert.equal(CARDINAL_DELIMITER, 0x039F);
});

test('Constants: FANO_POINTS is 7', () => {
  assert.equal(FANO_POINTS, 7);
});

test('Constants: FANO_RESOLUTION_MAX is 15', () => {
  assert.equal(FANO_RESOLUTION_MAX, 15);
});

test('Constants: ORBIT_PERIOD is 8', () => {
  assert.equal(ORBIT_PERIOD, 8);
});

test('SEGMENT_LAYOUT: has 8 entries with correct roles', () => {
  const keys = Object.keys(SEGMENT_LAYOUT);
  assert.equal(keys.length, 8);
  assert.equal(SEGMENT_LAYOUT.S0.role, 'LL00');
  assert.equal(SEGMENT_LAYOUT.S1.symbol, 'ο');
  assert.equal(SEGMENT_LAYOUT.S2.type, 'payload-ray-x');
  assert.equal(SEGMENT_LAYOUT.S3.operator, '+');
  assert.equal(SEGMENT_LAYOUT.S4.operator, '/');
  assert.equal(SEGMENT_LAYOUT.S5.type, 'payload-ray-y');
  assert.equal(SEGMENT_LAYOUT.S6.symbol, 'Ο');
  assert.equal(SEGMENT_LAYOUT.S7.role, 'LLff');
});

test('extractLL: extracts from canonical instruction', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  const ll = extractLL(S);
  assert.equal(ll.L0, 0x05);
  assert.equal(ll.L3, 0x05);
  assert.equal(ll.L4, 0x05);
  assert.equal(ll.L7, 0x05);
  assert.ok(ll.allEqual);
  assert.equal(ll.LL, 0x05);
});

test('extractLL: detects LL mismatch', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f06-0002-039f-05ff/48');
  const ll = extractLL(S);
  assert.equal(ll.allEqual, false);
});

test('Truth Row: extractTruthRow from valid frame returns LL, NN, MM', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  const row = extractTruthRow(S);
  assert.ok(row);
  assert.equal(row.LL, 0x05);
  assert.equal(row.NN, 0x000C);
  assert.equal(row.MM, 0x0002);
});

test('Truth Row: extractTruthRow returns null for invalid frame', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f06-0002-039f-05ff/48');
  assert.equal(extractTruthRow(S), null);
});

test('Truth Row: extractTruthRow 40-bit BigInt packing', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  const row = extractTruthRow(S);
  const expected = (BigInt(0x05) << 32n) | (BigInt(0x000C) << 16n) | BigInt(0x0002);
  assert.equal(row.row, expected);
});

test('Truth Row: extractTruthRow key is deterministic', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  const row = extractTruthRow(S);
  assert.equal(row.key, 0x05 * 0x100000000 + 0x000C * 0x10000 + 0x0002);
});

test('Truth Row: fanoTruthResolver with same NN and MM returns 0', () => {
  assert.equal(fanoTruthResolver(1, 0x1234, 0x1234), 0);
});

test('Truth Row: fanoTruthResolver with non-Fano LL returns -1', () => {
  assert.equal(fanoTruthResolver(0, 0x1234, 0x5678), -1);
  assert.equal(fanoTruthResolver(8, 0x1234, 0x5678), -1);
});

test('Truth Row: fanoTruthResolver bounded by 15 for valid Fano point', () => {
  const steps = fanoTruthResolver(1, 0x0500, 0x0002);
  assert.ok(steps === -1 || (steps >= 0 && steps < 15));
});

test('Truth Row: verifyTruthRow validates end-to-end pipeline', () => {
  const S = parseOmiAddressToSegments('omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48');
  const S_bad = parseOmiAddressToSegments('omi-0500-03bf-000c-2b04-2f05-0002-039f-05ff/48');

  const valid = verifyTruthRow(S);
  const invalid = verifyTruthRow(S_bad);

  assert.equal(typeof valid, 'boolean');
  assert.equal(invalid, false);
});

test('Truth Row: verifyTruthRow returns false for null S', () => {
  assert.equal(verifyTruthRow(new Uint16Array(8).fill(0)), false);
});

test('Truth Row: deltaCOrbitDistance on same value is 0', () => {
  assert.equal(deltaCOrbitDistance(0x0500, 0x0500), 0);
});

test('Truth Row: deltaCOrbitDistance on consecutive Δ_C values is 1', () => {
  const a = 0x0500;
  const b = deltaC(a);
  assert.equal(deltaCOrbitDistance(a, b), 1);
});

test('Truth Row: deltaCOrbitDistance period-8 cycle length', () => {
  const a = 0x0001;
  const b = deltaC(deltaC(deltaC(deltaC(a))));
  assert.equal(deltaCOrbitDistance(a, b), 4);
});

test('Transylvania: plane B has 7 lines with points 8-14', () => {
  assert.equal(TRANSYLVANIA_PLANE_B.length, 7);
  for (const line of TRANSYLVANIA_PLANE_B) {
    assert.ok(line.id >= 8 && line.id <= 14);
    assert.equal(line.points.length, 3);
    for (const p of line.points) {
      assert.ok(p >= 8 && p <= 14);
    }
  }
});

test('Transylvania: ticket count is 14', () => {
  assert.equal(transylvaniaTicketCount(), 14);
});

test('Transylvania: matchTwo guarantees 2-of-3 for [1,2,4] (all in plane A)', () => {
  const result = transylvaniaMatchTwo([1, 2, 4]);
  assert.ok(result.match);
  assert.ok(result.line >= 1 && result.line <= 7);
});

test('Transylvania: matchTwo guarantees 2-of-3 for [8,9,11] (all in plane B)', () => {
  const result = transylvaniaMatchTwo([8, 9, 11]);
  assert.ok(result.match);
  assert.ok(result.line >= 8 && result.line <= 14);
});

test('Transylvania: matchTwo guarantees 2-of-3 for [1,8,9] (split across planes)', () => {
  const result = transylvaniaMatchTwo([1, 8, 9]);
  assert.ok(result.match);
  assert.ok(result.line >= 1 && result.line <= 14);
});

test('Transylvania: matchTwo fails for [1,8,15] (15 out of range)', () => {
  assert.equal(transylvaniaMatchTwo([1, 8, 15]), null);
});

test('Transylvania: matchTwo needs exactly 3 numbers', () => {
  assert.equal(transylvaniaMatchTwo([1, 2]), null);
  assert.equal(transylvaniaMatchTwo([1, 2, 3, 4]), null);
});

test('Transylvania: matchTwo rejects out-of-range values', () => {
  assert.equal(transylvaniaMatchTwo([0, 1, 2]), null);
  assert.equal(transylvaniaMatchTwo([1, 2, 15]), null);
});

test('Transylvania: matchTwo reports matching line', () => {
  const result = transylvaniaMatchTwo([1, 2, 3]);
  assert.ok(result.match);
  assert.ok(result.points.length === 3);
  assert.ok(result.points.includes(1));
  assert.ok(result.points.includes(2));
  assert.ok(result.points.includes(3));
});

test('Boot: GENESIS_BOOT_ADDRESS is 0x7C00', () => {
  assert.equal(GENESIS_BOOT_ADDRESS, 0x7C00);
});

test('Boot: GENESIS_SEGMENTS frame is valid under Gate 1', () => {
  assert.ok(GENESIS_SEGMENTS);
  assert.equal(verifyOrbitLexer(GENESIS_SEGMENTS), 0);
});

test('Boot: GENESIS_SEGMENTS has correct LL=0x01', () => {
  const { LL } = extractLL(GENESIS_SEGMENTS);
  assert.equal(LL, 0x01);
});

test('Boot: GENESIS_SEGMENTS S2 = 0x7C00', () => {
  assert.equal(GENESIS_SEGMENTS[2], 0x7C00);
});

test('Boot: makeGenesisTarget computes MM from 0x7C00 via Δ_C', () => {
  const MM = makeGenesisTarget(0x01, 0x7C00);
  assert.ok(MM >= 0 && MM <= 0xFFFF);
  assert.equal(typeof MM, 'number');
});

test('Boot: makeGenesisTarget(0x01, 0x7C00) resolves in 1 step', () => {
  const MM = makeGenesisTarget(0x01, 0x7C00);
  const steps = fanoTruthResolver(0x01, 0x7C00, MM);
  assert.equal(steps, 1);
});

test('Boot: makeGenesisFrame returns valid frame for each LL=1..7', () => {
  for (let LL = 1; LL <= 7; LL++) {
    const frame = makeGenesisFrame(LL, 0x7C00);
    assert.ok(frame);
    assert.equal(isOrbitLexerValid(frame.S), true);
  }
});

test('Boot: makeGenesisFrame returns null for non-Fano LL', () => {
  assert.equal(makeGenesisFrame(0, 0x7C00), null);
  assert.equal(makeGenesisFrame(8, 0x7C00), null);
});

test('Boot: computeBootRingIndex from 0x7C00 is 1504', () => {
  assert.equal(computeBootRingIndex(0x7C00), 1504);
});

test('Boot: GENESIS_REPLAY_RING_INDEX is 1504', () => {
  assert.equal(GENESIS_REPLAY_RING_INDEX, 1504);
});

test('Boot: GENESIS_EPOCH is 64', () => {
  assert.equal(GENESIS_EPOCH, 64);
});

test('Boot: computeBootPhase from 0x7C00', () => {
  const phase = computeBootPhase(0x7C00);
  assert.equal(phase.ringIndex, 1504);
  assert.equal(phase.epoch, 64);
  assert.equal(phase.orbitEpoch, 1);
  assert.equal(phase.orbitPhase, 28);
});

test('Boot: GENESIS_ORBIT_PHASE is 28', () => {
  assert.equal(GENESIS_ORBIT_PHASE, 28);
});

test('Boot: GENESIS_B_DIGIT is 9 (B[28 % 8] = B[4])', () => {
  assert.equal(GENESIS_B_DIGIT, 9);
});

test('Boot: SAB_BOOT_SLOT is 1504', () => {
  assert.equal(SAB_BOOT_SLOT, 1504);
});

test('Boot: verifyInstructionPipeline Gate 1 rejects malformed frame', () => {
  const S_bad = parseOmiAddressToSegments('omi-0500-03bf-000c-2b04-2f05-0002-039f-05ff/48');
  const result = verifyInstructionPipeline(S_bad);
  assert.equal(result.valid, false);
  assert.ok(result.reason.includes('GATE_1'));
});

test('Boot: verifyInstructionPipeline Gate 2 rejects non-convergent row', () => {
  const S = new Uint16Array([0x0100, 0x03BF, 0xDEAD, 0x2B01, 0x2F01, 0xBEEF, 0x039F, 0x01FF]);
  const result = verifyInstructionPipeline(S);
  assert.equal(result.valid, false);
  assert.ok(result.reason.includes('GATE_2'));
});

test('Boot: verifyInstructionPipeline passes genesis frame', () => {
  const result = verifyInstructionPipeline(GENESIS_SEGMENTS);
  assert.ok(result.valid);
  assert.ok(result.receipt.steps >= 0);
  assert.ok(result.receipt.steps < 15);
});

test('Boot: bootstrapSystemKernel from SAB at 0x7C00', () => {
  const sab = new SharedArrayBuffer(0x7C10);
  const view = new Uint16Array(sab);
  for (let i = 0; i < 8; i++) {
    view[(0x7C00 / 2) + i] = GENESIS_SEGMENTS[i];
  }
  const boot = bootstrapSystemKernel(sab, 0x7C00);
  assert.ok(boot.success);
  assert.equal(boot.status, 'SYSTEM_FLOW_STATE_ACTIVE');
  assert.equal(boot.lens, 0x01);
  assert.ok(boot.steps >= 0);
  assert.equal(boot.ringIndex, 1504);
});

test('Boot: bootstrapSystemKernel rejects malformed boot sector', () => {
  const sab = new SharedArrayBuffer(0x7C10);
  const result = bootstrapSystemKernel(sab, 0x7C00);
  assert.equal(result.success, false);
});

test('Boot: bootstrapSystemKernel rejects insufficient memory', () => {
  const small = new ArrayBuffer(16);
  const result = bootstrapSystemKernel(small, 0x7C00);
  assert.equal(result.success, false);
  assert.ok(result.error.includes('INSUFFICIENT'));
});

test('Boot: fanoTruthResolver with genesis MM returns step 1', () => {
  const result = verifyInstructionPipeline(GENESIS_SEGMENTS);
  assert.ok(result.valid);
  assert.equal(result.receipt.steps, 1);
});

test('Boot: fanoTruthResolverClassic still works for classic formula', () => {
  assert.equal(fanoTruthResolverClassic(1, 0x1234, 0x1234), 0);
  assert.equal(fanoTruthResolverClassic(0, 0x1234, 0x5678), -1);
});

test('Boot: verifyInstructionPipeline packedRow includes steps in bits 40-47', () => {
  const result = verifyInstructionPipeline(GENESIS_SEGMENTS);
  const steps = result.receipt.steps;
  const extracted = Number((result.receipt.packedRow >> 40n) & 0xFFn);
  assert.equal(extracted, steps);
});
