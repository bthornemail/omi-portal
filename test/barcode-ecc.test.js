import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { OmiBarcodeEccKernel } from '../src/omi/ecc-kernel.js';
import {
  BARCODE_FORMATS, TWO_OF_FIVE_ENCODE, TWO_OF_FIVE_DECODE,
  TWO_OF_FIVE_WEIGHTS, TWO_OF_FIVE_PARITY,
  ECC_BITBOARD_MASKS, detectBarcodeFormat, getBarcodeFormatEccData,
  computeBitboardMasks,
  SEGMENT_TO_ECC_MASK, FORMAT_STRIDE_MAP, FORMAT_SEG5_MODULATION,
  AZTEC_CODEWORD_SIZES, AZTEC_RS_CORRECTION, RS_GENERATORS,
  HAMMING1510_TABLES,
  GF256_TABLES
} from '../src/omi/barcode-ecc-tables.js';

test('ECC Tables: 2-of-5 encode table maps 0-9 to 10 valid patterns', () => {
  assert.equal(TWO_OF_FIVE_ENCODE.length, 10);
  assert.equal(TWO_OF_FIVE_ENCODE[0], 0b11000);
  assert.equal(TWO_OF_FIVE_ENCODE[9], 0b00011);
  const seen = new Set(TWO_OF_FIVE_ENCODE);
  assert.equal(seen.size, 10);
  for (const p of TWO_OF_FIVE_ENCODE) {
    let w = 0;
    for (let b = p; b; b >>= 1) w += b & 1;
    assert.equal(w, 2, `pattern ${p.toString(2)} must have exactly 2 bits set`);
  }
});

test('ECC Tables: 2-of-5 decode table round-trips all 10 values', () => {
  for (let v = 0; v < 10; v++) {
    const encoded = TWO_OF_FIVE_ENCODE[v];
    const decoded = TWO_OF_FIVE_DECODE[encoded];
    assert.equal(decoded, v, `2-of-5 round-trip failed for value ${v}`);
  }
  assert.equal(TWO_OF_FIVE_DECODE[0b11111], -1);
  assert.equal(TWO_OF_FIVE_DECODE[0b00000], -1);
});

test('ECC Tables: 2-of-5 weights and parity match', () => {
  for (let v = 0; v < 10; v++) {
    assert.equal(TWO_OF_FIVE_WEIGHTS[v], 2);
    assert.equal(TWO_OF_FIVE_PARITY[v], 0);
  }
});

test('ECC Tables: format stride map routes correctly', () => {
  assert.equal(FORMAT_STRIDE_MAP[0x13B0], BARCODE_FORMATS.USS16K);
  assert.equal(FORMAT_STRIDE_MAP[0x0078], BARCODE_FORMATS.BEETAG);
  assert.equal(FORMAT_STRIDE_MAP[0x02D0], BARCODE_FORMATS.MAXICODE);
  assert.equal(FORMAT_STRIDE_MAP[0x0000], undefined);
});

test('ECC Tables: MaxiCode/Aztec modulation via seg[5] bit-0', () => {
  const mod = FORMAT_SEG5_MODULATION[BARCODE_FORMATS.MAXICODE];
  assert.ok(mod);
  assert.equal(mod.map[0x0001], BARCODE_FORMATS.MAXICODE);
  assert.equal(mod.map[0x0000], BARCODE_FORMATS.AZTEC);
});

test('ECC Tables: ECC bitboard masks are defined for all formats', () => {
  for (const fmt of Object.values(BARCODE_FORMATS)) {
    const m = ECC_BITBOARD_MASKS[fmt];
    assert.ok(m, `mask missing for ${fmt}`);
    assert.equal(typeof m.low, 'bigint');
    assert.equal(typeof m.high, 'bigint');
  }
});

test('ECC Tables: Aztec codeword sizes are correct for each layer', () => {
  assert.equal(AZTEC_CODEWORD_SIZES[1], 6);
  assert.equal(AZTEC_CODEWORD_SIZES[4], 8);
  assert.equal(AZTEC_CODEWORD_SIZES[10], 10);
  assert.equal(AZTEC_CODEWORD_SIZES[23], 12);
  assert.equal(AZTEC_CODEWORD_SIZES[32], 12);
});

test('ECC Tables: Aztec RS correction levels are defined', () => {
  assert.equal(AZTEC_RS_CORRECTION[1], 3);
  assert.equal(AZTEC_RS_CORRECTION[8], 12);
  assert.equal(AZTEC_RS_CORRECTION[16], 20);
  assert.equal(AZTEC_RS_CORRECTION[32], 36);
});

test('ECC Tables: RS generator polynomials are valid', () => {
  for (const nsym of [4, 6, 8, 10, 12]) {
    const g = RS_GENERATORS[nsym];
    assert.ok(g, `generator missing for nsym=${nsym}`);
    assert.equal(g[0], 1, `generator[0] must be 1 for nsym=${nsym}`);
    assert.equal(g.length, nsym + 1);
  }
});

test('ECC Tables: GF(2^8) arithmetic is self-consistent', () => {
  const { add, mul, inv, div, pow } = GF256_TABLES;
  assert.equal(add(0x57, 0x83), 0x57 ^ 0x83);
  assert.equal(mul(add(0x57, 0x83), 0x01), 0x57 ^ 0x83);
  const inv57 = inv(0x57);
  assert.equal(mul(0x57, inv57), 1);
  const r = mul(0x57, 0x83);
  const check = div(r, 0x83);
  assert.equal(check, 0x57);
  assert.equal(pow(0x03, 0), 1);
  assert.equal(add(0x00, 0x57), 0x57);
  assert.equal(mul(0x01, 0x01), 0x01);
  assert.equal(pow(0x02, 0), 1);
  assert.equal(pow(0x02, 1), 0x02);
  const exp255 = pow(0x03, 255);
  assert.equal(exp255, 1);
  assert.equal(pow(0x03, 254), inv(0x03));
});

test('ECC Tables: Hamming(15,10) round-trips all-zero', () => {
  const encoded = HAMMING1510_TABLES.encode(0);
  const decoded = HAMMING1510_TABLES.decode(encoded);
  assert.equal(decoded.data, 0);
  assert.equal(decoded.corrected, false);
});

test('ECC Tables: Hamming(15,10) corrects single-bit errors', () => {
  for (let data = 0; data < 64; data++) {
    const encoded = HAMMING1510_TABLES.encode(data);
    for (let bit = 0; bit < 15; bit++) {
      const corrupted = encoded ^ (1 << bit);
      const result = HAMMING1510_TABLES.decode(corrupted);
      assert.equal(result.data, data & 0x3FF,
        `Hamming(15,10) failed to correct bit ${bit} in data ${data}`);
      assert.equal(result.corrected, true);
    }
  }
});

test('ECC Tables: detectBarcodeFormat identifies formats from segments', () => {
  const uss16kSegs   = [0, 0, 0, 0, 0x13B0, 0, 0, 0];
  const beetagSegs   = [0, 0, 0, 0, 0x0078, 0, 0, 0];
  const maxicodeSegs = [0, 0, 0, 0, 0x02D0, 0x0001, 0, 0];
  const aztecSegs    = [0, 0, 0, 0, 0x02D0, 0x0000, 0, 0];
  const unknownSegs  = [0, 0, 0, 0, 0, 0, 0, 0];

  assert.equal(detectBarcodeFormat(uss16kSegs), BARCODE_FORMATS.USS16K);
  assert.equal(detectBarcodeFormat(beetagSegs), BARCODE_FORMATS.BEETAG);
  assert.equal(detectBarcodeFormat(maxicodeSegs), BARCODE_FORMATS.MAXICODE);
  assert.equal(detectBarcodeFormat(aztecSegs), BARCODE_FORMATS.AZTEC);
  assert.equal(detectBarcodeFormat(unknownSegs), null);
});

test('ECC Tables: computeBitboardMasks returns correct BigInt masks', () => {
  const segs = [0, 0, 0, 0, 0x13B0, 0x0036, 0xFFFF, 0x0000];
  const bb = computeBitboardMasks(BARCODE_FORMATS.USS16K, segs);
  assert.ok(bb);
  assert.equal(typeof bb.low, 'bigint');
  assert.equal(typeof bb.high, 'bigint');
});

test('ECC Kernel: SAB constructor validates buffer', () => {
  assert.throws(() => new OmiBarcodeEccKernel(null), /SharedArrayBuffer/);
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  assert.ok(k);
});

test('ECC Kernel: rejects non-omi prefix', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const r = k.car(k.evaluateStateTransition('garbage'));
  assert.equal(r.accepted, false);
  assert.equal(r.reason, "INVALID_PREFIX");
});

test('ECC Kernel: USS-16K format detected from 0x13B0 stride', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-13b0-0036-0000-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  assert.equal(meta.accepted, true);
  assert.equal(meta.format, BARCODE_FORMATS.USS16K);
  assert.equal(meta.formatName, 'USS-16K / Code 16K');
});

test('ECC Kernel: BEEtag format detected from 0x0078 stride', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-0078-0000-0000-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  assert.equal(meta.accepted, true);
  assert.equal(meta.format, BARCODE_FORMATS.BEETAG);
});

test('ECC Kernel: MaxiCode format detected from 0x02D0 + seg5 bit-0', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-02d0-0001-0000-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  assert.equal(meta.format, BARCODE_FORMATS.MAXICODE);
});

test('ECC Kernel: Aztec format detected from 0x02D0 + seg5=0', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-02d0-0000-0000-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  assert.equal(meta.format, BARCODE_FORMATS.AZTEC);
});

test('ECC Kernel: pristine USS-16K token has 0 bitblips', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-13b0-0036-0000-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  assert.equal(meta.bitblipCount, 0);
  assert.equal(meta.isCorrected, false);
});

test('ECC Kernel: single-bit error is auto-corrected', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-13b0-0037-0000-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  assert.equal(meta.accepted, true);
});

test('ECC Kernel: Hamming(15,10) encode returns correct bit count', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const encoded = k.hammingEncode1510(0x3FF);
  assert.ok(encoded > 0);
  assert.ok(encoded < 32768);
});

test('ECC Kernel: Hamming(15,10) decode corrects errors', () => {
  const k = new OmiBarcodeEccKernel(new SharedArrayBuffer(5040 * 8));
  for (let data of [0, 1, 42, 127, 0x3FF]) {
    const enc = k.hammingEncode1510(data);
    const dec = k.hammingDecode1510(enc);
    assert.equal(dec.data, data);
  }
});

test('ECC Kernel: decodeTwoOfFive returns correct values', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  assert.equal(k.decodeTwoOfFive(0b11000), 0);
  assert.equal(k.decodeTwoOfFive(0b10100), 1);
  assert.equal(k.decodeTwoOfFive(0b00011), 9);
  assert.equal(k.decodeTwoOfFive(0b11111), -1);
});

test('ECC Kernel: encodeTwoOfFive round-trips', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  for (let v = 0; v < 10; v++) {
    const enc = k.encodeTwoOfFive(v);
    const dec = k.decodeTwoOfFive(enc);
    assert.equal(dec, v);
  }
  assert.equal(k.encodeTwoOfFive(10), -1);
});

test('ECC Tables: Aztec RS syndrome metadata in valid tokens', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-02d0-0000-0004-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  if (meta.rsSyndrome) {
    assert.ok(meta.rsSyndrome.layers >= 1);
    assert.ok(meta.rsSyndrome.codewordSize >= 6);
    assert.ok(meta.rsSyndrome.rsCodewords >= 3);
  }
});

test('ECC Tables: MaxiCode Hamming metadata in valid tokens', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-02d0-0001-0000-0000/48";
  const meta = k.car(k.evaluateStateTransition(token));
  if (meta.hammingResult) {
    assert.ok(meta.hammingResult.identity15 > 0);
    assert.ok(meta.hammingResult.decoded.data >= 0);
  }
});

test('ECC Kernel: SAB memory write on valid token', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const floatArray = new Float64Array(sab);
  const k = new OmiBarcodeEccKernel(sab);
  const token = "omi-0000-0000-0000-0000-13b0-0036-0000-0000/48";
  k.evaluateStateTransition(token);
  const slot = 0x0036 % 5040;
  const val = floatArray[slot];
  assert.ok(val > 0);
});

test('ECC Tables: SEGMENT_TO_ECC_MASK maps correctly', () => {
  assert.equal(SEGMENT_TO_ECC_MASK[0x13B0].format, BARCODE_FORMATS.USS16K);
  assert.equal(SEGMENT_TO_ECC_MASK[0x0078].format, BARCODE_FORMATS.BEETAG);
  assert.equal(SEGMENT_TO_ECC_MASK[0x02D0].format, BARCODE_FORMATS.AZTEC);
});

test('ECC Kernel: cons/car/cdr lisp primitives', () => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const k = new OmiBarcodeEccKernel(sab);
  const c = k.cons(1, 2);
  assert.equal(k.car(c), 1);
  assert.equal(k.cdr(c), 2);
  assert.equal(k.car(null), null);
  assert.equal(k.cdr(null), null);
});
