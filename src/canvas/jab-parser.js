import { isOrbitLexerValid, extractTruthRow } from '../omi/delta-orbital-lexer.js';
import { computeCla4Bit } from '../omi/cla-adder.js';

export const JAB_COLOR_SPECTRUM = Object.freeze({
  CYAN:    { id: 0, type: "SUBTRACTIVE_PRIMARY",   preset: "5" },
  MAGENTA: { id: 1, type: "SUBTRACTIVE_PRIMARY",   preset: "1" },
  YELLOW:  { id: 2, type: "SUBTRACTIVE_PRIMARY",   preset: "3" },
  BLACK:   { id: 3, type: "SUBTRACTIVE_PRIMARY",   preset: "6" },
  BLUE:    { id: 4, type: "ADDITIVE_SECONDARY",    preset: "5" },
  RED:     { id: 5, type: "ADDITIVE_SECONDARY",    preset: "1" },
  GREEN:   { id: 6, type: "ADDITIVE_SECONDARY",    preset: "4" },
  WHITE:   { id: 7, type: "ADDITIVE_SECONDARY",    preset: "2" }
});

const CODE16K_SETS = Object.freeze({
  A: 1, B: 2, C: 3
});

export class OmiJabCodeParser {
  parseChromaticMatrix(S, colorKeyString, activeFindersCount, ocrGlyphOffset) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const normalizedColor = colorKeyString.trim().toUpperCase();
    const colorSpec = JAB_COLOR_SPECTRUM[normalizedColor];

    if (!colorSpec) {
      return { accepted: false, reason: "OUTSIDE_CHROMATIC_SPECTRUM_EVICTION" };
    }

    if (activeFindersCount !== 4) {
      return { accepted: false, reason: "MALFORMED_FINDER_GEOMETRY_EVICTION" };
    }

    const derivedDigitValue = ocrGlyphOffset & 0x0F;
    const canvasPresetColorId = colorSpec.preset;
    const simulatedAdderResult = computeCla4Bit(derivedDigitValue, colorSpec.id, 1);

    return {
      accepted: true,
      colorType: colorSpec.type,
      colorIdCode: colorSpec.id,
      derivedDigitValue,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: Number(BigInt(rowData.NN) % 5040n)
    };
  }
}

export function evaluateChromaticModeSwitch(S, inputX, currentLayerOffset) {
  if (!S || !isOrbitLexerValid(S)) {
    return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
  }

  const rowData = extractTruthRow(S);
  const x = BigInt(inputX);

  const rotl1 = ((x << 1n) | (x >> 63n)) & 0xFFFFFFFFFFFFFFFFn;
  const rotl3 = ((x << 3n) | (x >> 61n)) & 0xFFFFFFFFFFFFFFFFn;
  const rotr2 = ((x >> 2n) | (x << 62n)) & 0xFFFFFFFFFFFFFFFFn;
  const constantC = BigInt(rowData.MM);

  const modeSwitchResult = rotl1 ^ rotl3 ^ rotr2 ^ constantC;

  const fanoPointIndex = Number(modeSwitchResult & 0x07n);
  const isFanoPointValid = (fanoPointIndex >= 1 && fanoPointIndex <= 7);

  let canvasPresetColorId = "5";
  let bridgeLayerModel = "LINEAR_CODE16K_PASS";

  if (isFanoPointValid) {
    bridgeLayerModel = "CHROMATIC_JABCODE_ACTIVE";
    if (fanoPointIndex === 3 || fanoPointIndex === 7) {
      canvasPresetColorId = "3";
    } else {
      canvasPresetColorId = "6";
    }
  } else {
    canvasPresetColorId = "1";
  }

  const simulatedAdderResult = computeCla4Bit(fanoPointIndex, Number(currentLayerOffset & 0x0F), 1);

  return {
    accepted: isFanoPointValid,
    bridgeLayerModel,
    fanoPointIndex,
    modeSwitchMask: modeSwitchResult.toString(16),
    canvasPresetColorId,
    simulatedAdderResult,
    timelineSlot: Number(BigInt(rowData.NN) % 5040n)
  };
}

export function evaluateCode16KModeSwitch(S, inputX, activeRowSetChar, currentLayerOffset) {
  if (!S || !isOrbitLexerValid(S)) {
    return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
  }

  const rowData = extractTruthRow(S);
  const targetSet = activeRowSetChar.trim().toUpperCase();
  const characterSetId = CODE16K_SETS[targetSet] || 0;

  if (characterSetId === 0) {
    return { accepted: false, reason: "INVALID_CODE16K_CHARACTER_SET_EVICTION" };
  }

  const x = BigInt(inputX);

  const rotl1 = ((x << 1n) | (x >> 63n)) & 0xFFFFFFFFFFFFFFFFn;
  const rotl3 = ((x << 3n) | (x >> 61n)) & 0xFFFFFFFFFFFFFFFFn;
  const rotr2 = ((x >> 2n) | (x << 62n)) & 0xFFFFFFFFFFFFFFFFn;
  const constantC = BigInt(rowData.MM);

  const modeSwitchResult = rotl1 ^ rotl3 ^ rotr2 ^ constantC;

  const fanoPointIndex = Number(modeSwitchResult & 0x07n);
  const isFanoPointValid = (fanoPointIndex >= 1 && fanoPointIndex <= 7);

  let canvasPresetColorId = "5";
  let bridgeLayerModel = "LINEAR_CODE16K_PASS";

  if (isFanoPointValid) {
    bridgeLayerModel = "CHROMATIC_JABCODE_ACTIVE";
    if (fanoPointIndex === 3 || fanoPointIndex === 7) {
      canvasPresetColorId = "3";
    } else if (characterSetId === 3) {
      canvasPresetColorId = "6";
    }
  } else {
    canvasPresetColorId = "1";
  }

  const simulatedAdderResult = computeCla4Bit(fanoPointIndex, characterSetId, 1);

  return {
    accepted: isFanoPointValid,
    bridgeLayerModel,
    characterSetId,
    fanoPointIndex,
    modeSwitchMask: modeSwitchResult.toString(16),
    canvasPresetColorId,
    simulatedAdderResult,
    timelineSlot: Number(BigInt(rowData.NN) % 5040n)
  };
}
