import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const CODE16K_SYMBOL_CEILING = 107;

export class OmiClampedSpherePacker {
  constructor() {
    this.bufferLexical = new Uint8Array(128);
    this.bufferInflection = new Uint8Array(128);
    this.bufferPointer = new Uint8Array(128);
  }

  evaluatePackedSequence(S, charIndex, characterValue, encodingFormatStr) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const index = charIndex & 0x7F;
    const value = characterValue & 0xFF;
    const format = encodingFormatStr.trim().toLowerCase();

    if (value >= CODE16K_SYMBOL_CEILING) {
      return { accepted: false, reason: "OUT-OF-BOUNDS_107_SYMBOL_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let packagingLayerModel = "UNKNOWN_FORMAT_LANE";

    if (format === 'utf-8' || format === 'utf8') {
      this.bufferLexical[index] = value;
      packagingLayerModel = "UTF8_LEXICAL_OPEN_CLASS";
      canvasPresetColorId = "4";
    } else if (format === 'base64' || format === 'b64') {
      this.bufferInflection[index] = value;
      packagingLayerModel = "BASE64_INFLECTION_CLOSED_CLASS";
      canvasPresetColorId = "6";
    } else if (format === 'code16k' || format === '16k') {
      this.bufferPointer[index] = value;
      packagingLayerModel = "CODE16K_FUNCTIONAL_POINTER";
      canvasPresetColorId = "3";
    } else {
      return { accepted: false, reason: "UNSUPPORTED_ENCODING_PLANE_EVICTION" };
    }

    const simulatedAdderResult = computeCla4Bit(index & 0x0F, value & 0x0F, 1);

    return {
      accepted: true,
      packagingLayerModel,
      clampedIndex: index,
      clampedValue: value,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: rowData.NN % 5040
    };
  }
}
