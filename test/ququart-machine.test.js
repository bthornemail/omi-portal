import test from "node:test";
import assert from "node:assert/strict";
import {
  InterpretiveState,
  QuquartMachine,
  QuquartCoordinateSpace,
  CandidateRecoveryEngine,
} from "../src/omi/ququart-machine.js";

const IDENTITY_OPERATOR = (x) => x;
const CONSTANT_42_OPERATOR = (_) => 42n;

test("QuquartMachine.evaluateReceiptReplayStability returns same receiptHash on deterministic replay", () => {
  const result = QuquartMachine.evaluateReceiptReplayStability(
    0xffn, 0x0fn, 0x03n, IDENTITY_OPERATOR,
  );
  assert.equal(result.first.receiptHash, result.second.receiptHash);
  assert.equal(result.isStable, true);
});

test("QuquartMachine.evaluateReceiptReplayStability is stable with constant operator", () => {
  const result = QuquartMachine.evaluateReceiptReplayStability(
    0xbaben, 0x0fn, 0x03n, CONSTANT_42_OPERATOR,
  );
  assert.equal(result.first.receiptHash, result.second.receiptHash);
  assert.equal(result.isStable, true);
});

test("changed notationMask produces different receiptHash", () => {
  const r1 = QuquartMachine.makeReceipt(0xffn, 0x0fn, 0x03n, 0xa5n);
  const r2 = QuquartMachine.makeReceipt(0xffn, 0x0en, 0x03n, 0xa5n);
  assert.notEqual(r1.receiptHash, r2.receiptHash);
});

test("changed activeReading produces different receiptHash", () => {
  const r1 = QuquartMachine.makeReceipt(0xffn, 0x0fn, 0x03n, 0xa5n);
  const r2 = QuquartMachine.makeReceipt(0xffn, 0x0fn, 0x07n, 0xa5n);
  assert.notEqual(r1.receiptHash, r2.receiptHash);
});

test("changed result produces different receiptHash", () => {
  const r1 = QuquartMachine.makeReceipt(0xffn, 0x0fn, 0x03n, 0xa5n);
  const r2 = QuquartMachine.makeReceipt(0xffn, 0x0fn, 0x03n, 0x5an);
  assert.notEqual(r1.receiptHash, r2.receiptHash);
});

test("evaluateCandidateReadings returns only valid lenses", () => {
  const lenses = [
    {
      name: "valid-lens",
      evaluate(source) {
        return { valid: true, payload: source ^ 0x5an };
      },
    },
    {
      name: "invalid-lens",
      evaluate(_source) {
        return { valid: false, payload: 0n, reason: "rejected" };
      },
    },
    {
      name: "second-valid-lens",
      evaluate(source) {
        return { valid: true, payload: source + 1n };
      },
    },
  ];

  const readings = QuquartMachine.evaluateCandidateReadings(0xffn, lenses);
  assert.equal(readings.size, 2);
  assert(readings.has("valid-lens"));
  assert(!readings.has("invalid-lens"));
  assert(readings.has("second-valid-lens"));
  assert.equal(readings.get("valid-lens"), 0xffn ^ 0x5an);
  assert.equal(readings.get("second-valid-lens"), 0x100n);
});

test("knownSurface ring1024 returns correct dimensions", () => {
  const surface = QuquartCoordinateSpace.knownSurface("ring1024");
  assert.equal(surface.ququarts, 5);
  assert.equal(surface.states, 1024n);
  assert.equal(surface.expression, "4^5");
});

test("knownSurface bitboard65536 returns correct dimensions", () => {
  const surface = QuquartCoordinateSpace.knownSurface("bitboard65536");
  assert.equal(surface.ququarts, 8);
  assert.equal(surface.states, 65536n);
  assert.equal(surface.expression, "4^8");
});

test("knownSurface nibble returns 4^2", () => {
  const surface = QuquartCoordinateSpace.knownSurface("nibble");
  assert.equal(surface.ququarts, 2);
  assert.equal(surface.states, 16n);
  assert.equal(surface.expression, "4^2");
});

test("knownSurface ascii64 returns 4^3", () => {
  const surface = QuquartCoordinateSpace.knownSurface("ascii64");
  assert.equal(surface.ququarts, 3);
  assert.equal(surface.states, 64n);
  assert.equal(surface.expression, "4^3");
});

test("knownSurface byte returns 4^4", () => {
  const surface = QuquartCoordinateSpace.knownSurface("byte");
  assert.equal(surface.ququarts, 4);
  assert.equal(surface.states, 256n);
  assert.equal(surface.expression, "4^4");
});

test("getSurfaceDimensions exact even bitWidth", () => {
  const dim = QuquartCoordinateSpace.getSurfaceDimensions(8);
  assert.equal(dim.ququarts, 4);
  assert.equal(dim.states, 256n);
  assert.equal(dim.exact, true);
  assert.equal(dim.embeddedStates, 256n);
});

test("getSurfaceDimensions odd bitWidth embeds into next ququart boundary", () => {
  const dim = QuquartCoordinateSpace.getSurfaceDimensions(5);
  assert.equal(dim.ququarts, 3);
  assert.equal(dim.states, 32n);
  assert.equal(dim.exact, false);
  assert.equal(dim.embeddedStates, 64n);
});

test("getSurfaceDimensions large bitWidth with BigInt safety", () => {
  const dim = QuquartCoordinateSpace.getSurfaceDimensions(64);
  assert.equal(dim.ququarts, 32);
  assert.equal(dim.states, 18446744073709551616n);
  assert.equal(dim.exact, true);
});

test("empty candidate recovery fails cleanly", () => {
  const result = CandidateRecoveryEngine.recoverCandidate(
    [], 0n, (_) => true,
  );
  assert.equal(result.recovered, false);
  assert.equal(result.reason, "no fragments");
});

test("invalid reconstructed candidate fails validation", () => {
  const result = CandidateRecoveryEngine.recoverCandidate(
    [0x0fn, 0xf0n], 0xffn, (_) => false,
  );
  assert.equal(result.recovered, false);
  assert.equal(result.reason, "candidate failed validation");
});

test("valid reconstructed candidate completes the loop", () => {
  const result = CandidateRecoveryEngine.recoverCandidate(
    [0x0fn, 0xf0n], 0x00n, (c) => c === (0x0fn | 0xf0n),
  );
  assert.equal(result.recovered, true);
  assert.equal(result.reason, "candidate validated");
  assert.equal(result.candidate, 0xffn);
});

test("formatKetBoundary produces expected string", () => {
  const receipt = QuquartMachine.makeReceipt(0xffn, 0x0fn, 0x03n, 0xa5n);
  const register = {
    source: 0xffn,
    notationMask: 0x0fn,
    activeReading: 0x03n,
    receipt,
  };
  const formatted = QuquartMachine.formatKetBoundary(register);
  assert(formatted.startsWith("|omi---imo⟩{"));
  assert(formatted.includes("source=ff"));
  assert(formatted.includes("notation=f"));
  assert(formatted.includes("reading=3"));
  assert(formatted.includes("receipt="));
  assert(formatted.endsWith("}"));
});

test("formatKetBoundary handles unreceipted register", () => {
  const register = {
    source: 0xffn,
    notationMask: 0x0fn,
    activeReading: 0x03n,
    receipt: null,
  };
  const formatted = QuquartMachine.formatKetBoundary(register);
  assert(formatted.includes("receipt=unreceipted"));
});

test("InterpretiveState enum values", () => {
  assert.equal(InterpretiveState.Source, 0);
  assert.equal(InterpretiveState.Notation, 1);
  assert.equal(InterpretiveState.Reading, 2);
  assert.equal(InterpretiveState.Receipt, 3);
});

test("makeReceipt produces stable five-field receipt", () => {
  const receipt = QuquartMachine.makeReceipt(0x1n, 0x2n, 0x3n, 0x4n);
  assert(typeof receipt.sourceHash === "bigint");
  assert(typeof receipt.notationHash === "bigint");
  assert(typeof receipt.readingHash === "bigint");
  assert(typeof receipt.resultHash === "bigint");
  assert(typeof receipt.receiptHash === "bigint");
});

test("mix64 is deterministic", () => {
  const a = QuquartMachine.mix64(0xdeadbeefn);
  const b = QuquartMachine.mix64(0xdeadbeefn);
  assert.equal(a, b);
});
