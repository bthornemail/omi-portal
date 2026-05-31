import { isOrbitLexerValid, extractTruthRow } from '../src/omi/delta-orbital-lexer.js';
import { computeCla4Bit } from '../src/omi/cla-adder.js';

export const METADATA_DIVIDEND_MASK = 0xFFFFFF0000000000n;

export class OmiWanLatencyProbe {
  executeProbeSweep(S, raw64BitSlotValue, targetPrimeP, explicitJInvariant) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);
    const slot64 = BigInt(raw64BitSlotValue);
    const p = Number(targetPrimeP);
    const jInvariant = Number(explicitJInvariant);

    const metadataDividend = (slot64 & METADATA_DIVIDEND_MASK) >> 40n;
    const provenanceReceipt = Number((metadataDividend >> 8n) & 0xFFFFn);
    const stepReceipt = Number(metadataDividend & 0xFFn);

    const massTotalWeight = (p - 1) / 24;
    const isMassValid = (p >= 2 && p <= 71 && (p - 1) % 24 !== 0);

    let canvasPresetColorId = "5";
    let telemetryProbeState = "STANDARD_PROBE_PASS";

    if (provenanceReceipt > 0 && isMassValid) {
      telemetryProbeState = "EICHLER_MASS_TELEMETRY_STREAM_ACTIVE";
      canvasPresetColorId = "6";
    } else if (provenanceReceipt === 0) {
      telemetryProbeState = "METADATA_DIVIDEND_MISSING_ANOMALY";
      canvasPresetColorId = "1";
    }

    if (jInvariant === 0 || jInvariant === 1728) {
      canvasPresetColorId = "3";
    }

    const simulatedAdderResult = computeCla4Bit(stepReceipt & 0x0F, provenanceReceipt & 0x0F, 1);

    return {
      accepted: (provenanceReceipt > 0),
      telemetryProbeState,
      provenanceReceipt,
      stepReceipt,
      massTotalWeight,
      canvasPresetColorId,
      simulatedAdderResult: { ...simulatedAdderResult, sumValue: simulatedAdderResult.sum },
      timelineSlot: rowData.NN % 5040
    };
  }
}
