import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';
import { computeCla4Bit } from './cla-adder.js';

export class OmiNeuralNeuronKernel {
  activateNeuron(S, inputX, weightW, biasB, isSigmoidMode = false) {
    if (!S || !isOrbitLexerValid(S)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }

    const rowData = extractTruthRow(S);

    const x_color = (inputX[0] & 0xFF) / 255;
    const x_size  = (inputX[1] & 0xFF) / 255;
    const w_color = (weightW[0] & 0xFF) / 255;
    const w_size  = (weightW[1] & 0xFF) / 255;
    const bias = biasB / 255;

    const productZ = (x_color * w_color) + (x_size * w_size) + bias;

    let outputConfidence = 0.0;
    let canvasPresetColorId = "5";
    let activationModelType = "HARDWARE_PERCEPTRON_STEP";

    if (!isSigmoidMode) {
      outputConfidence = productZ < 0.0 ? 0.0 : 1.0;
      canvasPresetColorId = outputConfidence === 1.0 ? "5" : "1";
    } else {
      outputConfidence = 1.0 / (1.0 + Math.exp(-productZ));
      activationModelType = "SIGMOID_CONTINUOUS_NEURON";

      if (outputConfidence > 0.6) {
        canvasPresetColorId = "5";
      } else if (outputConfidence < 0.4) {
        canvasPresetColorId = "6";
      } else {
        canvasPresetColorId = "3";
      }
    }

    const simulatedAdderResult = computeCla4Bit(inputX[0] & 0x0F, weightW[1] & 0x0F, 1);

    return {
      accepted: true,
      activationModelType,
      productZ,
      outputConfidence,
      canvasPresetColorId,
      simulatedAdderResult,
      timelineSlot: rowData.NN % 5040
    };
  }
}
