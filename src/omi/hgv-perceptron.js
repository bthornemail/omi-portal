import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

const BARYCENTRIC_2OF5 = [
  0b00011, 0b00101, 0b00110, 0b01001, 0b01010,
  0b01100, 0b10001, 0b10010, 0b10100, 0b11000
];

export class OmiHgvPerceptron {
  evaluateLayer9(tokenS, input5) {
    if (!tokenS || !isOrbitLexerValid(tokenS)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }
    const row = extractTruthRow(tokenS);
    if (!input5 || input5.length !== 5) {
      return { accepted: false, reason: "LAYER9_INPUT_DIMENSION_MISMATCH" };
    }
    const mask = ((input5[0] & 1) << 4) |
                 ((input5[1] & 1) << 3) |
                 ((input5[2] & 1) << 2) |
                 ((input5[3] & 1) << 1) |
                 (input5[4] & 1);
    const position = BARYCENTRIC_2OF5.indexOf(mask);
    if (position === -1) {
      return { accepted: false, reason: "LAYER9_NOT_2OF5_BARYCENTRIC" };
    }
    return {
      accepted: true,
      position,
      mask,
      eventStrength: (input5.reduce((a, b) => a + b, 0) / 1275) + (row.NN % 10) / 10
    };
  }

  allocateLayer10(layer9Event, isSigmoid = false) {
    if (!layer9Event.accepted) {
      return { allocated: false, reason: "LAYER9_EVICTION_PROPAGATED" };
    }
    const { position, eventStrength } = layer9Event;
    const fraction = BigInt(position * 0x10000000000000 + Math.round(eventStrength * 0xFFFFFFFFFFFFF)) & 0xFFFFFFFFFFFFFn;
    const exponent = ((position << 7) | (Math.round(eventStrength * 0x7F))) & 0x7FF;
    const sign = position < 5 ? 0n : 1n;
    const binary64Bits = (sign << 63n) | (BigInt(exponent) << 52n) | fraction;
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, binary64Bits, false);
    const activation = this.activatePerceptron(exponent, Number(fraction & 0xFFFFn), isSigmoid);
    return {
      allocated: true,
      bits: binary64Bits.toString(16),
      floatValue: view.getFloat64(0, false),
      ...activation
    };
  }

  activatePerceptron(exponentBits, fractionBits, isSigmoid = false) {
    const membranePotential = ((exponentBits & 0x7FF) / 2047) + ((fractionBits & 0xFFFF) / 65536) - 1.5;
    let output;
    let activationModel;
    if (!isSigmoid) {
      output = membranePotential >= 0 ? 1.0 : 0.0;
      activationModel = "HGV_PERCEPTRON_STEP";
    } else {
      output = 1.0 / (1.0 + Math.exp(-membranePotential));
      activationModel = "HGV_SIGMOID_CONTINUOUS";
    }
    const canvasPresetColorId = output > 0.6 ? "5" : output > 0.4 ? "3" : output < 0.05 ? "6" : "2";
    return { activationModel, membranePotential, outputConfidence: output, canvasPresetColorId };
  }

  evaluateHgv(tokenS, input5, isSigmoid = false) {
    const layer9 = this.evaluateLayer9(tokenS, input5);
    if (!layer9.accepted) {
      return { accepted: false, reason: layer9.reason, layer9 };
    }
    const layer10 = this.allocateLayer10(layer9, isSigmoid);
    return {
      accepted: true,
      layer9,
      layer10,
      activationModel: layer10.activationModel,
      outputConfidence: layer10.outputConfidence,
      canvasPresetColorId: layer10.canvasPresetColorId
    };
  }
}
