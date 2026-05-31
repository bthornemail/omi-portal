import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

const BARYCENTRIC_2OF5 = [
  0b00011, 0b00101, 0b00110, 0b01001, 0b01010,
  0b01100, 0b10001, 0b10010, 0b10100, 0b11000
];

export class OmiHgvKernel {
  evaluateBarycentric2of5(inputVector) {
    if (!inputVector || inputVector.length !== 5) {
      return { valid: false, reason: "INPUT_DIMENSION_MISMATCH", canvasPresetColorId: "1" };
    }
    const mask = ((inputVector[0] & 1) << 4) |
                 ((inputVector[1] & 1) << 3) |
                 ((inputVector[2] & 1) << 2) |
                 ((inputVector[3] & 1) << 1) |
                 (inputVector[4] & 1);
    const position = BARYCENTRIC_2OF5.indexOf(mask);
    if (position === -1) {
      return { valid: false, reason: "NOT_2OF5_BARYCENTRIC", canvasPresetColorId: "1" };
    }
    const sum = inputVector.reduce((a, b) => a + b, 0);
    return {
      valid: true,
      position,
      mask,
      barycentricWeight: sum / 1275,
      canvasPresetColorId: position < 5 ? "5" : "3"
    };
  }

  allocateBCD(events, position) {
    const fraction = (position * 9 + events.reduce((a, b) => a + b, 0)) & 0x7FFFFF;
    const exponent = ((position << 3) | (events[0] & 7)) & 0xFF;
    const sign = position < 5 ? 0 : 1;
    const float32Bits = (sign << 31) | (exponent << 23) | fraction;
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, float32Bits, false);
    return {
      bits: float32Bits,
      floatValue: view.getFloat32(0, false),
      signedInteger: view.getInt32(0, false),
      canvasPresetColorId: float32Bits === 0 ? "6" : sign ? "1" : "5"
    };
  }

  gaugeCoupling(layer9Result, layer10Buffer) {
    if (!layer9Result.valid) {
      return { coupled: false, reason: "LAYER9_INVALID_EVICTION" };
    }
    const coupled = this.allocateBCD(
      new Uint8Array([layer9Result.position, layer9Result.position * 3, 0, 0, 0]),
      layer9Result.position
    );
    return {
      coupled: true,
      ...coupled,
      couplingStrength: layer9Result.barycentricWeight
    };
  }

  evaluateHgv(tokenS, input5) {
    if (!tokenS || !isOrbitLexerValid(tokenS)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }
    const row = extractTruthRow(tokenS);
    const layer9 = this.evaluateBarycentric2of5(input5);
    if (!layer9.valid) {
      return { accepted: false, reason: layer9.reason };
    }
    const layer10 = this.allocateBCD(
      new Uint8Array([layer9.position, row.NN, 0, 0, 0]),
      layer9.position
    );
    return {
      accepted: true,
      layer9,
      layer10,
      timelineSlot: row.NN % 5040
    };
  }
}
