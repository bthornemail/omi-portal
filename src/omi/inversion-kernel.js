export class OmiCentralInversionKernel {
  constructor(sharedArrayBuffer) {
    if (!sharedArrayBuffer || sharedArrayBuffer.byteLength < 40320) {
      throw new Error("[Omi Inversion] SharedArrayBuffer space must be at least 40320 bytes.");
    }
    this.sab = sharedArrayBuffer;
    this.view = new DataView(this.sab);
    this.INVERSION_C = 0x5A3C;
    this.PRIME_IDEAL = 73;
    this.CANONICAL_ROOT = "ffff-127-0-0-1";
  }

  cons(car, cdr) { return Object.freeze({ car, cdr }); }
  car(cell) { return cell.car; }
  cdr(cell) { return cell.cdr; }

  invertBitRegister(registerValue) {
    return (registerValue ^ this.INVERSION_C) & 0xFFFF;
  }

  executeDeltaLawStep(currentValue) {
    const x = currentValue & 0xFFFF;
    const rotl1 = ((x << 1) | (x >> 15)) & 0xFFFF;
    const rotl3 = ((x << 3) | (x >> 13)) & 0xFFFF;
    const rotr2 = ((x >> 2) | (x << 14)) & 0xFFFF;
    return (rotl1 ^ rotl3 ^ rotr2 ^ this.INVERSION_C) & 0xFFFF;
  }

  parseInversionAddress(idTokenString) {
    if (!idTokenString) return this.cons({ valid: false, error: "Empty Token" }, null);

    const tokens = idTokenString.split("-");
    const hasCentralInversionGate = tokens.includes("0x5a3c");

    const slotToken = tokens.find(t => t.startsWith("slot"));
    const absoluteTickIndex = slotToken ? parseInt(slotToken.replace("slot", ""), 10) : 0;

    const isLocalContextValid = idTokenString.includes(this.CANONICAL_ROOT);

    return this.cons(
      {
        valid: isLocalContextValid,
        hasCentralInversionGate,
        primeOrbitPeriod: 8,
        primeIdealBase: this.PRIME_IDEAL,
        targetTimelineSlot: absoluteTickIndex % 5040
      },
      hasCentralInversionGate ? new Float64Array([this.INVERSION_C]) : null
    );
  }
}
