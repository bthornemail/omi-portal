import * as OProjector from "../src/omi/o-projector.js";
import * as OBitboard from "../src/omi/o-bitboard.js";
import { QuquartMachine } from "../src/omi/ququart-machine.js";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("O-Projector (.o -> .omi/.imo)", () => {
  it("projectToOMI produces a readable string for an empty word", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const omi = OProjector.projectToOMI(word);
    assert.ok(typeof omi === "string");
    assert.ok(omi.startsWith("omi---imo"));
  });

  it("projectToIMO produces a readable string for an empty word", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const imo = OProjector.projectToIMO(word);
    assert.ok(typeof imo === "string");
    assert.ok(imo.startsWith("imo---omi"));
  });

  it("projectToOMI contains the QuquartRegister ket boundary", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0xABC, surface: 0x1234n });
    const omi = OProjector.projectToOMI(word);
    assert.ok(omi.includes("|omi---imo⟩"));
    assert.ok(omi.includes("source="));
  });

  it("projectRegister builds a QuquartRegister from source word", () => {
    const word = OBitboard.packOWord({ selector: 1, path: 42, surface: 0xFFn });
    const reg = OProjector.projectRegister(word);
    assert.equal(reg.source, word);
    assert.ok(typeof reg.notationMask === "bigint");
    assert.ok(typeof reg.activeReading === "bigint");
    assert.equal(reg.receipt, null);
  });

  it("projectRegister accepts custom notationMask and activeReading", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const reg = OProjector.projectRegister(word, { notationMask: 0xABCDn, activeReading: 0x1234n });
    assert.equal(reg.notationMask, 0xABCDn);
    assert.equal(reg.activeReading, 0x1234n);
  });

  it("projectReadable returns omi, imo, and register", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0xABC, surface: 0x1234n });
    const readable = OProjector.projectReadable(word);
    assert.ok(typeof readable.omi === "string");
    assert.ok(typeof readable.imo === "string");
    assert.ok(readable.register != null);
    assert.equal(readable.register.source, word);
  });

  it("projectWithReceipt evaluates receipt replay stability", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const operator = (s) => s ^ 0x5A3Cn;
    const result = OProjector.projectWithReceipt(word, 0xFFn, operator);
    assert.ok(result.reg != null);
    assert.ok(result.isStable === true || result.isStable === false);
    assert.ok(result.readable != null);
    if (result.isStable) {
      assert.ok(result.receipt != null);
      assert.ok(result.receipt.receiptHash != null);
    }
  });

  it("projectWithReceipt produces a stable receipt for deterministic operator", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0x7A3, surface: 0xDEADn });
    const operator = (s) => s ^ 0x5A3Cn;
    const result = OProjector.projectWithReceipt(word, 0xFFn, operator);
    assert.equal(result.isStable, true);
    assert.ok(result.receipt != null);
    assert.equal(typeof result.receipt.receiptHash, "bigint");
  });

  it("formatKetBoundary is used in projection output", () => {
    const word = OBitboard.packOWord({ selector: 1, path: 0xFFF, surface: 0x42n });
    const omi = OProjector.projectToOMI(word);
    const imo = OProjector.projectToIMO(word);
    assert.ok(omi.includes("receipt="));
    assert.ok(imo.includes("receipt="));
  });

  it("selector=0 produces omi---imo, selector=1 produces imo---imo for OMI projection", () => {
    const omiWord = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const imoWord = OBitboard.packOWord({ selector: 1, path: 0, surface: 0n });
    assert.ok(OProjector.projectToOMI(omiWord).startsWith("omi---imo"));
    assert.ok(OProjector.projectToOMI(imoWord).startsWith("imo---imo"));
  });

  it("selector=0 produces imo---omi, selector=1 produces omi---omi for IMO projection", () => {
    const omiWord = OBitboard.packOWord({ selector: 0, path: 0, surface: 0n });
    const imoWord = OBitboard.packOWord({ selector: 1, path: 0, surface: 0n });
    assert.ok(OProjector.projectToIMO(omiWord).startsWith("imo---omi"));
    assert.ok(OProjector.projectToIMO(imoWord).startsWith("omi---omi"));
  });

  it("path is preserved in projection output", () => {
    const word = OBitboard.packOWord({ selector: 0, path: 0xBEEF, surface: 0n });
    const omi = OProjector.projectToOMI(word);
    assert.ok(omi.includes("path:0x0beef") || omi.includes("path:0xbeef") || omi.includes("path:0x0BEEF"));
  });
});
