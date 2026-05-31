import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export const WIKIMEDIA_SCHEMA_PRECISION = 120;

export class OmiWikimediaStructuredKernel {
  evaluateWikimediaPayload(S, subjectId, predicateId, objectId, referenceRiskByte) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const sub = Number(subjectId) & 0x7F;
    const pred = Number(predicateId) & 0x7F;
    const obj = Number(objectId) & 0x7F;
    const risk = referenceRiskByte & 0xFF;

    const isSubjectValid = (sub < WIKIMEDIA_SCHEMA_PRECISION);
    const combinedSteinerHash = sub ^ pred ^ obj;

    const normalizedReferenceRisk = risk / 255;
    const isDataCredible = (normalizedReferenceRisk <= 0.70);

    if (!isDataCredible) {
      return { accepted: false, reason: "HIGH_REFERENCE_RISK_CREDIBILITY_EVICTION" };
    }

    let canvasPresetColorId = "5";
    let wikimediaProcessingModel = "STANDARD_STRUCTURED_ARTICLE";

    if (isSubjectValid && normalizedReferenceRisk < 0.15) {
      wikimediaProcessingModel = "VERIFIED_TRUTH_INFOCUBE_MATCH";
      canvasPresetColorId = "5";
    } else if (normalizedReferenceRisk > 0.50) {
      wikimediaProcessingModel = "REFERENCE_NEEDED_WARNING_RAIL";
      canvasPresetColorId = "1";
    } else {
      wikimediaProcessingModel = "MODEST_SCHEMA_TRANSITION";
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(combinedSteinerHash & 0x0F, risk & 0x0F, 1);

    return {
      accepted: true,
      wikimediaProcessingModel,
      combinedSteinerHash,
      normalizedReferenceRisk,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}
