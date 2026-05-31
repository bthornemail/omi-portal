import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const FACTS_DEMO_LIMIT = 5;

export class OmiFactsParametricEvaluator {
  evaluateFactualAccuracy(S, targetExampleIndex, responseMatchScore) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const exIndex = targetExampleIndex & 0x7F;
    const rawScore = responseMatchScore & 0xFF;

    const isIndexValid = (exIndex < FACTS_DEMO_LIMIT);
    if (!isIndexValid) {
      return { accepted: false, reason: "OUT_OF_BOUNDS_FACTS_EXAMPLES_EVICTION" };
    }

    const normalizedAccuracyScore = rawScore / 255;

    let canvasPresetColorId = "5";
    let parametricAccuracyModel = "STANDARD_FACT_VERIFIED_PASS";

    if (normalizedAccuracyScore > 0.85) {
      parametricAccuracyModel = "HIGH_CONFIDENCE_PARAMETRIC_MATCH";
      canvasPresetColorId = "5";
    } else if (normalizedAccuracyScore < 0.4) {
      parametricAccuracyModel = "FACTUAL_CONTRADICTION_EVICTION_LANE";
      canvasPresetColorId = "1";
    } else {
      parametricAccuracyModel = "MODEST_ACCURACY_THRESHOLD";
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(exIndex & 0x0F, rawScore & 0x0F, 1);

    return {
      accepted: isIndexValid,
      parametricAccuracyModel,
      targetExampleIndex: exIndex,
      normalizedAccuracyScore,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}
