import { isOrbitLexerValid, extractTruthRow } from './delta-orbital-lexer.js';

const POLYTOPE_5CELL = 0x05;
const POLYTOPE_24CELL = 0x18;
const POLYTOPE_600CELL = 0x258;
const POLYTOPE_120CELL = 0x78;

export class OmiPolytopicNeuralKernel {
  expandTruthTable6(tokenS) {
    if (!tokenS || !isOrbitLexerValid(tokenS)) return null;
    const row = extractTruthRow(tokenS);
    const table = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      table[i] = (row.NN ^ (i * 0x3F)) & 0x3F;
    }
    return table;
  }

  projectFiveCell(truthTable64) {
    const five = new Float64Array(5);
    for (let i = 0; i < 5; i++) {
      const idx = (i * 13) % 64;
      five[i] = (truthTable64[idx] & 0x3F) / 63;
    }
    return five;
  }

  project24Cell(truthTable64) {
    const twentyFour = new Float64Array(24);
    for (let i = 0; i < 24; i++) {
      const idx = (i * 21 + 7) % 64;
      twentyFour[i] = (truthTable64[idx] & 0x3F) / 63;
    }
    return twentyFour;
  }

  chromaticBridge(value, precision) {
    const clamped = Math.max(0, Math.min(1, value));
    const bits = 16 << precision;
    const maxVal = (1 << (bits - 1)) - 1;
    const scaled = Math.round(clamped * maxVal);
    return {
      precisionBits: bits,
      precisionLabel: ["HALF", "SINGLE", "DOUBLE", "QUAD", "OCTUPLE"][precision] || "UNKNOWN",
      scaledValue: scaled,
      canvasPresetColorId: clamped > 0.75 ? "5" : clamped > 0.5 ? "3" : clamped > 0.25 ? "2" : "6"
    };
  }

  project600CellVertices(truthTable64) {
    const vertices = new Float64Array(120);
    for (let i = 0; i < 120; i++) {
      const src = truthTable64[i % 64] & 0x3F;
      const phase = ((i * 7) & 0x3F) / 64;
      vertices[i] = ((src / 63) * 2 - 1) * Math.cos(phase * Math.PI);
    }
    return vertices;
  }

  project120CellDodecahedra(truthTable64) {
    const dodecahedra = new Float64Array(120);
    for (let i = 0; i < 120; i++) {
      const a = truthTable64[i % 64] & 0x3F;
      const b = truthTable64[(i * 3 + 17) % 64] & 0x3F;
      dodecahedra[i] = ((a / 63) + (b / 63)) / 2;
    }
    return dodecahedra;
  }

  verifySnub(projected, snubType) {
    let valid = true;
    for (let i = 1; i < projected.length; i++) {
      const diff = Math.abs(projected[i] - projected[i - 1]);
      if (diff > 0.99) { valid = false; break; }
    }
    return {
      valid,
      snubType,
      cellCount: projected.length,
      canvasPresetColorId: valid ? "5" : "1"
    };
  }

  evaluatePolytopic(tokenS, input6, precision = 0) {
    if (!tokenS || !isOrbitLexerValid(tokenS)) {
      return { accepted: false, reason: "GATE_1_STRUCTURAL_EVICTION_FAULT" };
    }
    const truthTable = this.expandTruthTable6(tokenS);
    if (!truthTable) {
      return { accepted: false, reason: "POLYTOPE_TRUTH_TABLE_EXPANSION_FAILED" };
    }
    const fiveCell = this.projectFiveCell(truthTable);
    const cell24 = this.project24Cell(truthTable);
    const vertices600 = this.project600CellVertices(truthTable);
    const dodecahedra120 = this.project120CellDodecahedra(truthTable);
    const snubResult = this.verifySnub(vertices600, "600-cell");
    const bridge = this.chromaticBridge(fiveCell[0], precision);
    return {
      accepted: true,
      truthTableSize: truthTable.length,
      fiveCellProjection: Array.from(fiveCell),
      cell24Projection: Array.from(cell24),
      vertices600Count: vertices600.length,
      dodecahedra120Count: dodecahedra120.length,
      snubResult,
      chromaticBridge: bridge,
      canvasPresetColorId: snubResult.valid ? bridge.canvasPresetColorId : "1"
    };
  }
}
