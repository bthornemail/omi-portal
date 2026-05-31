import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const TARGET_PEARSON_CORRELATION = 0.803639;

export class OmiStsBenchmarkEvaluator {
  evaluateSimilarityBatch(S, dotProductValue, targetHumanSimScore) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);

    const cosineSimilarity = Math.max(-1.0, Math.min(1.0, Number(dotProductValue) / 255));
    const humanScore = Number(targetHumanSimScore) / 5.0;

    const angularSimilarity = 1.0 - (Math.acos(cosineSimilarity) / Math.PI);

    const deviationDelta = Math.abs(angularSimilarity - humanScore);
    const isCorrelationValid = (deviationDelta <= 0.25);

    let canvasPresetColorId = "5";
    let semanticAlignmentModel = "STANDARD_SIMILARITY_PASS";

    if (isCorrelationValid && angularSimilarity > 0.75) {
      semanticAlignmentModel = "HIGH_RESONANCE_SEMANTIC_MATCH";
      canvasPresetColorId = "5";
    } else if (deviationDelta > 0.4) {
      semanticAlignmentModel = "PARIAH_VECTOR_DRIFT_EVICTION";
      canvasPresetColorId = "1";
    } else {
      semanticAlignmentModel = "MODEST_COGNITIVE_TRANSITION";
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(
      Math.round(angularSimilarity * 10) & 0x0F,
      Math.round(humanScore * 10) & 0x0F, 1);

    return {
      accepted: isCorrelationValid,
      semanticAlignmentModel,
      angularSimilarity,
      targetBaselinePearson: TARGET_PEARSON_CORRELATION,
      deviationDelta,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}
