import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const FANO_RESOLUTION_CEILING = 15;

export class OmiMetacircularPerceptronKernel {
  evaluateMultilayerWarp(S, inputX, weightW, constantC, isSigmoidMode = false) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const x = BigInt(inputX);
    const w = BigInt(weightW);
    const c = BigInt(constantC);

    const rotl1 = ((x << 1n) | (x >> 63n)) & 0xFFFFFFFFFFFFFFFFn;
    const rotl3 = ((w << 3n) | (w >> 61n)) & 0xFFFFFFFFFFFFFFFFn;
    const rotr2 = ((c >> 2n) | (c << 62n)) & 0xFFFFFFFFFFFFFFFFn;

    const hiddenActivationMask = rotl1 ^ rotl3 ^ rotr2 ^ BigInt(rowData.MM);
    const fanoPointIndex = Number(hiddenActivationMask & 0x07n);

    const isOrbitConvergent = (fanoPointIndex >= 1 && fanoPointIndex <= 7);
    if (!isOrbitConvergent) {
      return { accepted: false, reason: "ORBITAL_FANO_PLANE_DIVERGENCE_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let metacircularWarpModel = "HIDDEN_FANO_LINEAR_PASS";

    if (fanoPointIndex === 3 || fanoPointIndex === 7) {
      metacircularWarpModel = "MEGATRON_FIRED_HIGH_RESONANCE";
      canvasPresetColorId = "5";
    } else if (fanoPointIndex === 1) {
      metacircularWarpModel = "SUB_CRITICAL_INHIBITED_TRACK";
      canvasPresetColorId = "1";
    } else if (isSigmoidMode) {
      metacircularWarpModel = "CONTINUOUS_METACIRCULAR_CONFIDENCE";
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(fanoPointIndex, FANO_RESOLUTION_CEILING, 1);

    return {
      accepted: true,
      metacircularWarpModel,
      fanoPointIndex,
      hiddenActivationMask: hiddenActivationMask.toString(16),
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}
