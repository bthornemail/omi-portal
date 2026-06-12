/**
 * OMI INTERPRETIVE QUQUART MACHINE (TECHNICAL REFERENCE)
 * -----------------------------------------------------------------------
 * Canonical implementation-facing register. Rejects database models;
 * implements deterministic coordinate frame reinterpretation.
 */

/** @typedef {bigint} Bitboard */

export const InterpretiveState = Object.freeze({
  Source: 0,   // |0⟩ versioned binary source
  Notation: 1, // |1⟩ declared reading surface
  Reading: 2,  // |2⟩ active interpretation route
  Receipt: 3,  // |3⟩ accepted fixed point
});

export class QuquartMachine {
  /**
   * Build a simple deterministic receipt commitment.
   * Maps source, lens, path, and outcome into a stable interpretation identity.
   * Note: In production, replace mix64 with the canonical receipt/hash primitive.
   */
  static makeReceipt(source, notationMask, activeReading, result) {
    const sourceHash = this.mix64(source);
    const notationHash = this.mix64(notationMask);
    const readingHash = this.mix64(activeReading);
    const resultHash = this.mix64(result);

    const receiptHash = this.mix64(
      sourceHash ^
      (notationHash << 1n) ^
      (readingHash << 2n) ^
      (resultHash << 3n)
    );

    return {
      sourceHash,
      notationHash,
      readingHash,
      resultHash,
      receiptHash,
    };
  }

  /**
   * Evaluates Receipt Replay Stability.
   * Proves that the receipt is a replayable commitment binding source, notation,
   * reading, and result into a stable interpretation identity.
   */
  static evaluateReceiptReplayStability(source, notationMask, activeReading, operator) {
    const result1 = operator(source);
    const receipt1 = this.makeReceipt(source, notationMask, activeReading, result1);

    // Replay the same interpretation pipeline against the stable source authority.
    const result2 = operator(source);
    const receipt2 = this.makeReceipt(source, notationMask, activeReading, result2);

    return {
      first: receipt1,
      second: receipt2,
      isStable: receipt1.receiptHash === receipt2.receiptHash,
    };
  }

  /**
   * Evaluates an interpretive candidate-reading set.
   * Evaluates multiple candidate readings concurrently without data mutation.
   */
  static evaluateCandidateReadings(source, lenses) {
    const validReadings = new Map();

    for (const lens of lenses) {
      const result = lens.evaluate(source);
      if (result.valid) {
        validReadings.set(lens.name, result.payload);
      }
    }

    return validReadings;
  }

  /**
   * Formats the register boundary using symbolic ket-like notation.
   */
  static formatKetBoundary(register) {
    const receiptPart = register.receipt
      ? register.receipt.receiptHash.toString(16)
      : "unreceipted";

    return `|omi---imo⟩{source=${register.source.toString(16)},notation=${register.notationMask.toString(16)},reading=${register.activeReading.toString(16)},receipt=${receiptPart}}`;
  }

  /**
   * Safe 64-bit mixer mapping structural inputs to deterministic verification points.
   * Note: This is a lightweight commitment helper, not cryptographic security.
   */
  static mix64(value) {
    let x = value & 0xffff_ffff_ffff_ffffn;
    x ^= x >> 30n;
    x *= 0xbf58_476d_1ce4_e5b9n;
    x &= 0xffff_ffff_ffff_ffffn;
    x ^= x >> 27n;
    x *= 0x94d0_49bb_1331_11ebn;
    x &= 0xffff_ffff_ffff_ffffn;
    x ^= x >> 31n;
    return x & 0xffff_ffff_ffff_ffffn;
  }
}

export class QuquartCoordinateSpace {
  /**
   * Determines exact and embedded ququart-coordinate parameters.
   * Safely scales using BigInt arithmetic for arbitrary bit widths.
   */
  static getSurfaceDimensions(bitWidth) {
    const states = 1n << BigInt(bitWidth);

    if (bitWidth % 2 === 0) {
      return {
        ququarts: bitWidth / 2,
        states,
        exact: true,
        embeddedStates: states,
      };
    }

    const ququarts = Math.ceil(bitWidth / 2);
    const embeddedStates = 1n << BigInt(ququarts * 2);

    return {
      ququarts,
      states,
      exact: false,
      embeddedStates,
    };
  }

  static knownSurface(name) {
    switch (name) {
      case "nibble":
        return { ququarts: 2, states: 16n, expression: "4^2" };
      case "ascii64":
        return { ququarts: 3, states: 64n, expression: "4^3" };
      case "byte":
        return { ququarts: 4, states: 256n, expression: "4^4" };
      case "ring1024":
        return { ququarts: 5, states: 1024n, expression: "4^5" };
      case "bitboard65536":
        return { ququarts: 8, states: 65536n, expression: "4^8" };
    }
  }
}

/**
 * Candidate Reconstruction Layer.
 *
 * NOTE: This is not Reed-Solomon recovery and not full MCRSGSP.
 * It is a deterministic candidate-reconstruction placeholder for local interpretive testing.
 */
export class CandidateRecoveryEngine {
  /**
   * Pulls fragmented segments back into a single candidate reading profile.
   */
  static recoverCandidate(fragments, closureWitness, validationPredicate) {
    if (fragments.length === 0) {
      return { candidate: 0n, recovered: false, reason: "no fragments" };
    }

    let candidate = 0n;
    for (const fragment of fragments) {
      candidate |= fragment;
    }

    candidate ^= closureWitness;

    if (!validationPredicate(candidate)) {
      return { candidate, recovered: false, reason: "candidate failed validation" };
    }

    return { candidate, recovered: true, reason: "candidate validated" };
  }
}
