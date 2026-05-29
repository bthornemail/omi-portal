import {
  BARCODE_FORMATS, BARCODE_FORMAT_NAMES,
  TWO_OF_FIVE_ENCODE, TWO_OF_FIVE_DECODE,
  TWO_OF_FIVE_WEIGHTS, TWO_OF_FIVE_PARITY,
  ECC_BITBOARD_MASKS, SEGMENT_TO_ECC_MASK,
  detectBarcodeFormat, getBarcodeFormatEccData,
  computeBitboardMasks,
  AZTEC_CODEWORD_SIZES, AZTEC_RS_CORRECTION,
  RS_GENERATORS, GF256_TABLES,
  HAMMING1510_TABLES,
  USS16K_CHARSET, USS16K_START_PATTERN, USS16K_STOP_PATTERN, USS16K_MODULO,
  FORMAT_SEGMENT_ROUTES
} from './barcode-ecc-tables.js';

export class OmiBarcodeEccKernel {
  constructor(sharedArrayBuffer) {
    if (!sharedArrayBuffer) throw new Error("[Omi ECC] SharedArrayBuffer target missing.");
    this.sab = sharedArrayBuffer;
    this.floatArray = new Float64Array(this.sab);
    this.bigIntArray = new BigInt64Array(this.sab);
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell ? cell.car : null; }
  cdr(cell) { return cell ? cell.cdr : null; }

  _packBitboards(segments) {
    let low = 0n;
    for (let i = 0; i < 4; i++) {
      low = (low << 16n) | BigInt(segments[i] & 0xFFFF);
    }
    let high = 0n;
    for (let i = 4; i < 8; i++) {
      high = (high << 16n) | BigInt(segments[i] & 0xFFFF);
    }
    return { low, high };
  }

  _popcount(n) {
    let count = 0;
    while (n > 0n) {
      if (n & 1n) count++;
      n >>= 1n;
    }
    return count;
  }

  _popcount32(n) {
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    return ((n + (n >>> 4)) & 0x0F0F0F0F) * 0x01010101 >>> 24;
  }

  _hammingWeight128(low, high) {
    return this._popcount(low) + this._popcount(high);
  }

  evaluateStateTransition(omiAddressString) {
    if (!omiAddressString || !omiAddressString.startsWith('omi-')) {
      return this.cons({ accepted: false, reason: "INVALID_PREFIX" }, null);
    }

    const parts = omiAddressString.split('/');
    const cleanIPv6 = parts[0].substring(4);
    const segments = cleanIPv6.split('-');

    if (segments.length < 8) {
      return this.cons({ accepted: false, reason: "MALFORMED_SEGMENTS" }, null);
    }

    const segNums = segments.map(s => parseInt(s, 16) || 0);
    const format = detectBarcodeFormat(segNums);

    const bb = this._packBitboards(segNums);

    const formatMasks = ECC_BITBOARD_MASKS;
    let activeFormat = format;
    let eccMaskLow = 0n;
    let eccMaskHigh = 0n;
    let maxBits = 0;

    if (format && formatMasks[format]) {
      eccMaskLow = formatMasks[format].low;
      eccMaskHigh = formatMasks[format].high;
      const ecc = getBarcodeFormatEccData(format);
      maxBits = ecc ? ecc.maxCorrectableBits : 2;
    }

    const syndromeLow = bb.low ^ eccMaskLow;
    const syndromeHigh = bb.high ^ eccMaskHigh;
    const bitblipCount = this._hammingWeight128(syndromeLow, syndromeHigh);
    const isCorrectable = bitblipCount <= maxBits;

    let correctedLow = bb.low;
    let correctedHigh = bb.high;

    if (isCorrectable && bitblipCount > 0) {
      correctedLow = bb.low ^ syndromeLow;
      correctedHigh = bb.high ^ syndromeHigh;
    }

    const seg4 = segNums[4] & 0xFFFF;
    const seg5 = segNums[5] & 0xFFFF;

    let twoOfFive = null;
    if (format === BARCODE_FORMATS.BEETAG || format === BARCODE_FORMATS.AZTEC) {
      const fiveBitGroup = (seg5 >> 1) & 0x1F;
      const decoded = TWO_OF_FIVE_DECODE[fiveBitGroup];
      const encoded = TWO_OF_FIVE_ENCODE[fiveBitGroup >= 0 && fiveBitGroup < 10 ? fiveBitGroup : 0] || 0;
      twoOfFive = {
        group5: fiveBitGroup,
        decoded: decoded >= 0 ? decoded : -1,
        isValid: decoded >= 0,
        parity: (fiveBitGroup < 32) ? this._popcount32(TWO_OF_FIVE_ENCODE[decoded >= 0 ? decoded : 0]) : -1,
        encoded
      };
    }

    let rsSyndrome = null;
    if (format === BARCODE_FORMATS.AZTEC) {
      const layers = Math.max(1, Math.min(32, (segNums[6] & 0xFF) || 4));
      const cwSize = AZTEC_CODEWORD_SIZES[layers] || 8;
      const rsCount = AZTEC_RS_CORRECTION[layers] || 8;
      const genPoly = RS_GENERATORS[cwSize];
      rsSyndrome = {
        layers,
        codewordSize: cwSize,
        rsCodewords: rsCount,
        generatorLength: genPoly ? genPoly.length : 0
      };
    }

    let hammingResult = null;
    if (format === BARCODE_FORMATS.MAXICODE) {
      const identity = ((segNums[4] & 0xFF) << 7) | ((segNums[5] & 0x7F));
      const codeword = HAMMING1510_TABLES.encode(identity);
      hammingResult = {
        identity15: codeword,
        decoded: HAMMING1510_TABLES.decode(codeword)
      };
    }

    const sexagesimalSlot = seg5 % 5040;
    if (isCorrectable) {
      const storeValue = ((correctedLow >> 48n) & 0xFFFFn) || 1n;
      Atomics.store(this.bigIntArray, sexagesimalSlot, storeValue);
    }

    const seg7 = segNums[7] & 0xFFFF;
    const correctedSegments = segNums.slice();
    if (isCorrectable && bitblipCount > 0) {
      for (let i = 0; i < 4; i++) {
        correctedSegments[i] = Number((correctedLow >> BigInt((3 - i) * 16)) & 0xFFFFn);
      }
      for (let i = 4; i < 8; i++) {
        correctedSegments[i] = Number((correctedHigh >> BigInt((7 - i) * 16)) & 0xFFFFn);
      }
    }

    const metadataHeader = {
      accepted: isCorrectable,
      format,
      formatName: format ? (getBarcodeFormatEccData(format)?.formatName || format) : null,
      bitblipCount,
      maxCorrectable: maxBits,
      isCorrected: isCorrectable && bitblipCount > 0,
      syndromeLow: syndromeLow.toString(16).padStart(16, '0'),
      syndromeHigh: syndromeHigh.toString(16).padStart(16, '0'),
      targetMemorySlot: sexagesimalSlot,
      twoOfFive,
      rsSyndrome,
      hammingResult,
      correctedSegments: isCorrectable ? correctedSegments : null
    };

    return this.cons(metadataHeader, omiAddressString);
  }

  decodeTwoOfFive(bits) {
    const v = TWO_OF_FIVE_DECODE[bits & 0x1F];
    return v >= 0 ? v : -1;
  }

  encodeTwoOfFive(value) {
    if (value < 0 || value > 9) return -1;
    return TWO_OF_FIVE_ENCODE[value];
  }

  rsEncode(data, nsym) {
    const gen = RS_GENERATORS[nsym];
    if (!gen) return null;
    const res = new Uint8Array(data.length + nsym);
    res.set(data);
    for (let i = 0; i < data.length; i++) {
      if (res[i] !== 0) {
        const lead = GF256_TABLES.log[res[i]];
        for (let j = 0; j <= nsym; j++) {
          res[i + j] ^= GF256_TABLES.exp[(lead + GF256_TABLES.log[gen[j]]) % 255];
        }
      }
    }
    return res;
  }

  hammingEncode1510(data10) {
    return HAMMING1510_TABLES.encode(data10);
  }

  hammingDecode1510(codeword15) {
    return HAMMING1510_TABLES.decode(codeword15);
  }
}
