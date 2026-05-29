export class OmiLispKernel {
  constructor(sharedMemoryBuffer) {
    this.sab = sharedMemoryBuffer;
    this.view = new DataView(this.sab);
  }

  cons(carHeader, cdrPayload) {
    return Object.freeze({ car: carHeader, cdr: cdrPayload });
  }

  car(cell) { return cell ? cell.car : null; }
  cdr(cell) { return cell ? cell.cdr : null; }

  evaluateLispToken(omiIdString) {
    if (!omiIdString || !omiIdString.startsWith("omi-")) {
      return this.cons({ valid: false, message: "Invalid Prefix" }, null);
    }

    const tokens = omiIdString.split("-");
    const terminalToken = tokens[tokens.length - 1];

    const isListTerminatorActive = (terminalToken === "0!");

    const metadataBlock = {
      address: omiIdString,
      tokenCount: tokens.length,
      isListTerminatorActive,
      structuralMemoryWeight: isListTerminatorActive ? 1 : tokens.length * 4
    };

    return this.cons(metadataBlock, isListTerminatorActive ? null : tokens);
  }
}
