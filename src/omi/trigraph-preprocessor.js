import { OmiSymmetricalChiralLexer } from "./chiral-lexer.js";

export class OmiTrigraphPreprocessor {
  constructor(sharedArrayBuffer) {
    this.lexer = new OmiSymmetricalChiralLexer(sharedArrayBuffer);
    this.CANONICAL_ROOT = "omi-ffff-127-0-0-1";
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  preprocessAndEvaluateStream(rawOmiString) {
    if (!rawOmiString) return this.cons({ valid: false }, null);

    let polarityScalar = 1.0;
    let synchronizedString = rawOmiString;

    if (rawOmiString.includes("??-")) {
      polarityScalar = -1.0;
      synchronizedString = rawOmiString.replace("??-", "").replace(/--+/g, "-");
    }

    const lexerCell = this.lexer.evaluateChiralTapeStream(synchronizedString);
    const headerSpecs = this.lexer.car(lexerCell);
    const payloadVector = this.lexer.cdr(lexerCell);

    if (headerSpecs.valid && payloadVector) {
      for (let i = 0; i < payloadVector.length; i++) {
        payloadVector[i] *= polarityScalar;
      }
    }

    return this.cons(
      {
        valid: headerSpecs.valid,
        appliedScalar: polarityScalar,
        hasTrigraphOperator: (polarityScalar === -1.0),
        underlyingContext: headerSpecs
      },
      payloadVector
    );
  }
}
