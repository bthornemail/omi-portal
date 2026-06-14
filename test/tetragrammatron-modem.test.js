import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseNodeTestOutput,
  modulateTestEventToOmi,
  demodulateOmiRecord,
  modemRoundTripTestOutput,
  modemRoundTripToGeometryReceipts,
  modemFrameToOWord,
  oWordToModemFrame,
  packModemFramesToOFile,
  unpackOFileToModemFrames,
} from "../src/omi/tetragrammatron-modem.js";
import { formatOWord } from "../src/omi/o-bitboard.js";
import { parseOmiDocument } from "../src/omi/omi-parser.js";

const SAMPLE_OUTPUT = [
  "▶ Hopf fibration",
  "  ✔ identity quaternion projects to +z axis (0.99ms)",
  "  ✖ 180° about y flips to -z (0.24ms)",
  "  ✔ 90° about y rotates z to x",
  "",
  "▶ computeQxy",
  "  ✔ BQD formula: 60x² + 16xy + 4y² (0.19ms)",
  "",
  "ℹ tests 5",
  "ℹ suites 2",
  "ℹ pass 4",
  "ℹ fail 1",
].join("\n");

describe("parseNodeTestOutput", () => {
  it("parses suite lines as running events", () => {
    const events = parseNodeTestOutput(SAMPLE_OUTPUT);
    const suites = events.filter((e) => e.status === "running");
    assert.equal(suites.length, 2);
    assert.equal(suites[0].name, "Hopf fibration");
    assert.equal(suites[1].name, "computeQxy");
  });

  it("parses pass lines with duration", () => {
    const events = parseNodeTestOutput(SAMPLE_OUTPUT);
    const passed = events.filter((e) => e.status === "passed");
    assert.ok(passed.length >= 1);
    const withDur = passed.find((e) => e.durationMs !== undefined);
    assert.ok(withDur);
    assert.equal(withDur.name, "identity quaternion projects to +z axis");
    assert.equal(withDur.durationMs, 0.99);
  });

  it("parses pass lines without duration", () => {
    const events = parseNodeTestOutput(SAMPLE_OUTPUT);
    const noDur = events.find((e) => e.name === "90° about y rotates z to x");
    assert.ok(noDur);
    assert.equal(noDur.status, "passed");
    assert.equal(noDur.durationMs, undefined);
  });

  it("parses fail lines", () => {
    const events = parseNodeTestOutput(SAMPLE_OUTPUT);
    const failed = events.filter((e) => e.status === "failed");
    assert.equal(failed.length, 1);
    assert.equal(failed[0].name, "180° about y flips to -z");
  });

  it("assigns suite context to subsequent tests", () => {
    const events = parseNodeTestOutput(SAMPLE_OUTPUT);
    const hopfTests = events.filter((e) => e.suite === "Hopf fibration" && e.status !== "running");
    assert.ok(hopfTests.length >= 2);
    for (const t of hopfTests) assert.equal(t.suite, "Hopf fibration");
  });

  it("ignores info lines (ℹ)", () => {
    const events = parseNodeTestOutput(SAMPLE_OUTPUT);
    const info = events.filter((e) => e.raw.startsWith("ℹ"));
    assert.equal(info.length, 0);
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(parseNodeTestOutput(""), []);
    assert.deepEqual(parseNodeTestOutput(null), []);
    assert.deepEqual(parseNodeTestOutput(undefined), []);
  });

  it("each event has stable id", () => {
    const events = parseNodeTestOutput(SAMPLE_OUTPUT);
    for (const e of events) {
      assert.ok(typeof e.id === "string" && e.id.length > 0);
      assert.ok(e.raw.length > 0);
      assert.equal(e.source, "node-test");
    }
  });
});

describe("modulateTestEventToOmi", () => {
  it("produces FACT record for passed event", () => {
    const event = {
      id: "abc123",
      suite: "Hopf",
      name: "test passes",
      status: "passed",
      durationMs: 1.5,
      raw: "  ✔ test passes (1.5ms)",
      source: "node-test",
    };
    const address = "omi-0000-0000-0000-0000-0000-0000-0000-0001/128";
    const omi = modulateTestEventToOmi(event, address);
    assert.ok(omi.includes("FACT"));
    assert.ok(omi.includes("test:passed:abc123"));
    assert.ok(omi.includes("INPUT: node-test"));
    assert.ok(omi.includes("PROPERTY: test passes"));
    assert.ok(omi.includes("DERIVED_FROM: Hopf"));
    assert.ok(omi.includes("TIMING: 1.5ms"));
    assert.ok(omi.includes("omi-"));
    assert.ok(omi.includes("-imo"));
  });

  it("produces MUST_NOT record for failed event", () => {
    const event = {
      id: "def456",
      suite: null,
      name: "test fails",
      status: "failed",
      raw: "  ✖ test fails",
      source: "node-test",
    };
    const address = "omi-0000-0000-0000-0000-0000-0000-0000-0002/128";
    const omi = modulateTestEventToOmi(event, address);
    assert.ok(omi.includes("MUST_NOT"));
    assert.ok(omi.includes("test:failed:def456"));
  });

  it("produces COMBINE record for suite/running event", () => {
    const event = {
      id: "ghi789",
      suite: null,
      name: "My Suite",
      status: "running",
      raw: "▶ My Suite",
      source: "node-test",
    };
    const address = "omi-0000-0000-0000-0000-0000-0000-0000-0003/128";
    const omi = modulateTestEventToOmi(event, address);
    assert.ok(omi.includes("COMBINE"));
  });

  it("round-trips through parseOmiDocument", () => {
    const event = {
      id: "rnd",
      suite: "Test",
      name: "round trip check",
      status: "passed",
      durationMs: 42,
      raw: "  ✔ round trip check (42ms)",
      source: "node-test",
    };
    const address = "omi-1111-2222-3333-4444-5555-6666-7777-8888/128";
    const omi = modulateTestEventToOmi(event, address);
    const parsed = parseOmiDocument(omi, { source: "test" });
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.malformed.length, 0);
    assert.equal(parsed.records[0].keyword, "FACT");
    assert.equal(parsed.records[0].sections.INPUT, "node-test");
    assert.equal(parsed.records[0].sections.PROPERTY, "round trip check");
    assert.ok(parsed.records[0].sourceBlock);
    assert.ok(parsed.records[0].sourceBlock.raw.includes("✔ round trip check"));
  });
});

describe("demodulateOmiRecord", () => {
  it("recovers passed status from FACT record", () => {
    const record = {
      assignment: "test:passed:abc",
      keyword: "FACT",
      sections: { PROPERTY: "my test", INPUT: "node-test" },
      sourceBlock: { raw: "  ✔ my test (1ms)\n" },
    };
    const d = demodulateOmiRecord(record);
    assert.equal(d.status, "passed");
    assert.equal(d.name, "my test");
    assert.equal(d.source, "node-test");
    assert.ok(d.raw.includes("✔ my test"));
  });

  it("recovers failed status from MUST_NOT record", () => {
    const record = {
      assignment: "test:failed:def",
      keyword: "MUST_NOT",
      sections: { PROPERTY: "broken test", INPUT: "qemu" },
    };
    const d = demodulateOmiRecord(record);
    assert.equal(d.status, "failed");
    assert.equal(d.name, "broken test");
    assert.equal(d.source, "qemu");
  });
});

describe("modemRoundTripTestOutput", () => {
  it("round-trips sample output", () => {
    const result = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    assert.ok(result.eventCount > 0);
    assert.equal(result.eventCount, result.frames.length);
  });

  it("each frame has omi notation and parsed records", () => {
    const result = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      assert.ok(typeof f.omi === "string" && f.omi.length > 0);
      assert.ok(f.parsed.records.length >= 1);
      assert.equal(f.receiptState, "candidate");
    }
  });

  it("demodulation recovers status and name", () => {
    const result = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const d = f.demodulated[0];
      assert.equal(d.name, f.event.name);
      if (d.status === "passed" || d.status === "failed") {
        assert.equal(d.status, f.event.status);
      }
    }
  });

  it("passed events produce FACT records with no malformed lines", () => {
    const result = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    let totalMalformed = 0;
    for (const f of result.frames) {
      totalMalformed += f.parsed.malformed.length;
    }
    assert.equal(totalMalformed, 0, "no malformed records from valid test output");
  });

  it("is deterministic for same input", () => {
    const r1 = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    const r2 = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    assert.equal(r1.eventCount, r2.eventCount);
    for (let i = 0; i < r1.eventCount; i++) {
      assert.equal(r1.frames[i].omi, r2.frames[i].omi);
    }
  });

  it("handles empty input gracefully", () => {
    const result = modemRoundTripTestOutput("");
    assert.equal(result.eventCount, 0);
    assert.deepEqual(result.frames, []);
  });
});

describe("integration with existing parser", () => {
  it("modulated output is readable by parseOmiDocument", () => {
    const result = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const roundTrip = parseOmiDocument(f.omi);
      assert.ok(roundTrip.records.length > 0);
      for (const r of roundTrip.records) {
        assert.ok(r.keyword);
        assert.ok(r.assignment);
      }
    }
  });

  it("source blocks preserve raw test lines", () => {
    const result = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      if (f.parsed.records[0]?.sourceBlock) {
        const raw = f.parsed.records[0].sourceBlock.raw;
        assert.ok(raw.includes(f.event.raw.trim()), "source block contains raw line");
      }
    }
  });

  it("address is a valid OMI address", () => {
    const result = modemRoundTripTestOutput(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      assert.ok(f.address.startsWith("omi-"), "address starts with omi-");
      assert.ok(f.address.endsWith("/128"), "address ends with /128");
    }
  });
});

describe("modemRoundTripToGeometryReceipts", () => {
  it("enriches each frame with geometry fields", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    assert.ok(result.eventCount > 0);
    assert.equal(result.eventCount, result.frames.length);
    for (const f of result.frames) {
      assert.ok(f.geometry, "geometry attached");
      assert.ok(typeof f.qphase === "string", f.qphase);
      assert.ok(typeof f.chart11 === "number", "chart11 is number");
      assert.ok(f.chart11 >= 0 && f.chart11 < 11, "chart11 in 0..10");
      assert.ok(typeof f.baseQ === "number", "baseQ is number");
      assert.ok(f.baseQ >= 0 && f.baseQ < 4, "baseQ in 0..3");
      assert.ok(typeof f.fiberQ === "number", "fiberQ is number");
      assert.ok(f.fiberQ >= 0 && f.fiberQ < 4, "fiberQ in 0..3");
      assert.ok(typeof f.local240 === "number", "local240 is number");
      assert.ok(f.local240 >= 0 && f.local240 < 240, "local240 in 0..239");
      assert.ok(typeof f.slot5040 === "number", "slot5040 is number");
      assert.ok(f.slot5040 >= 0 && f.slot5040 < 5040, "slot5040 in 0..5039");
      assert.ok(typeof f.receiptState === "string", "receiptState is string");
    }
  });

  it("maps passed events to US channel + accepted receipt", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      if (f.event.status === "passed") {
        assert.equal(f.node.channel, "US");
        assert.equal(f.receiptState, "accepted");
      }
    }
  });

  it("maps failed events to RS channel + candidate receipt", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      if (f.event.status === "failed") {
        assert.equal(f.node.channel, "RS");
        assert.equal(f.receiptState, "candidate");
      }
    }
  });

  it("maps running events to GS channel", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      if (f.event.status === "running") {
        assert.equal(f.node.channel, "GS");
      }
    }
  });

  it("provides summary counts", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    assert.ok(typeof result.summary.passed === "number");
    assert.ok(typeof result.summary.failed === "number");
    assert.ok(typeof result.summary.running === "number");
    assert.ok(typeof result.summary.accepted === "number");
    assert.ok(typeof result.summary.candidate === "number");
    assert.ok(result.summary.passed > 0);
    assert.equal(result.summary.failed, 1);
    assert.equal(result.summary.running, 2);
    assert.ok(result.summary.accepted > 0);
    assert.ok(result.summary.candidate > 0);
  });

  it("is deterministic for same input", () => {
    const r1 = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    const r2 = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    assert.equal(r1.eventCount, r2.eventCount);
    for (let i = 0; i < r1.eventCount; i++) {
      assert.equal(r1.frames[i].slot5040, r2.frames[i].slot5040);
      assert.equal(r1.frames[i].omi, r2.frames[i].omi);
    }
  });

  it("thrustDirection and polybius are present on geometry frames", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      if (f.receiptState === "accepted") {
        assert.ok(f.thrustDirection, "thrustDirection on accepted");
        assert.ok(typeof f.thrustDirection.a === "number", "thrust.a");
        assert.ok(typeof f.thrustDirection.b === "number", "thrust.b");
        assert.ok(typeof f.thrustDirection.c === "number", "thrust.c");
      }
    }
  });

  it("handles empty input", () => {
    const result = modemRoundTripToGeometryReceipts("");
    assert.equal(result.eventCount, 0);
    assert.deepEqual(result.frames, []);
  });
});

describe("modemFrameToOWord", () => {
  it("packs a frame into a valid 256-bit word", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    const frame = result.frames.find((f) => f.event.status === "passed");
    assert.ok(frame, "found a passed frame");
    const word = modemFrameToOWord(frame);
    const fmt = formatOWord(word);
    assert.equal(fmt.selector, 0);
    assert.equal(fmt.bits.length, 256);
    assert.ok(fmt.path >= 0, "path is non-negative");
    assert.ok(fmt.path < (1 << 19), "path fits in 19 bits");
  });

  it("selector is 0 for modem frames", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const word = modemFrameToOWord(f);
      const { selector } = formatOWord(word);
      assert.equal(selector, 0);
    }
  });

  it("path encodes baseQ/fiberQ/chart11/fano7/role3", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const word = modemFrameToOWord(f);
      const { path } = formatOWord(word);
      const expectedPath =
        (f.baseQ << 0) |
        (f.fiberQ << 2) |
        (f.chart11 << 4) |
        (f.fano7 << 8) |
        (f.role3 << 11);
      assert.equal(path, expectedPath);
    }
  });

  it("surface encodes status / receiptState / slot5040", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const word = modemFrameToOWord(f);
      const { surface } = formatOWord(word);
      const statusCode = f.event.status === "passed" ? 0 : f.event.status === "failed" ? 1 : 2;
      const rcptCode = f.receiptState === "accepted" ? 1 : f.receiptState === "rejected" ? 2 : 0;
      assert.equal(Number((surface >> 0n) & 0x3n), statusCode, "status bits");
      assert.equal(Number((surface >> 2n) & 0x3n), rcptCode, "receipt bits");
      assert.equal(Number((surface >> 28n) & 0x1FFFn), f.slot5040, "slot5040 bits");
    }
  });

  it("is deterministic for same frame", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const w1 = modemFrameToOWord(f);
      const w2 = modemFrameToOWord(f);
      assert.equal(w1, w2);
    }
  });
});

describe("oWordToModemFrame", () => {
  it("round-trips status, local240, slot5040 for all frames", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const word = modemFrameToOWord(f);
      const decoded = oWordToModemFrame(word);
      assert.equal(decoded.status, f.event.status);
      assert.equal(decoded.local240, f.local240);
      assert.equal(decoded.slot5040, f.slot5040);
    }
  });

  it("reports wordHex", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    const word = modemFrameToOWord(result.frames[0]);
    const decoded = oWordToModemFrame(word);
    assert.ok(typeof decoded.wordHex === "string");
    assert.equal(decoded.wordHex.length, 64);
    assert.ok(/^[0-9a-f]+$/.test(decoded.wordHex));
  });

  it("decodes geometry coordinates from path", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const word = modemFrameToOWord(f);
      const decoded = oWordToModemFrame(word);
      assert.equal(decoded.baseQ, f.baseQ);
      assert.equal(decoded.fiberQ, f.fiberQ);
      assert.equal(decoded.chart11, f.chart11);
      assert.equal(decoded.fano7, f.fano7);
      assert.equal(decoded.role3, f.role3);
    }
  });

  it("selector is 0", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    for (const f of result.frames) {
      const word = modemFrameToOWord(f);
      const decoded = oWordToModemFrame(word);
      assert.equal(decoded.selector, 0);
    }
  });
});

describe("packModemFramesToOFile", () => {
  it("produces one hex line per frame", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    const text = packModemFramesToOFile(result.frames);
    const lines = text.trim().split("\n");
    assert.equal(lines.length, result.eventCount);
    for (const line of lines) {
      assert.equal(line.length, 64);
      assert.ok(/^[0-9a-f]{64}$/.test(line));
    }
  });

  it("handles single frame", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    const text = packModemFramesToOFile([result.frames[0]]);
    const lines = text.trim().split("\n");
    assert.equal(lines.length, 1);
    assert.equal(lines[0].length, 64);
  });
});

describe("unpackOFileToModemFrames", () => {
  it("round-trips with packModemFramesToOFile", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    const text = packModemFramesToOFile(result.frames);
    const decoded = unpackOFileToModemFrames(text);
    assert.equal(decoded.length, result.eventCount);
    for (let i = 0; i < decoded.length; i++) {
      const d = decoded[i];
      const f = result.frames[i];
      assert.equal(d.status, f.event.status);
      assert.equal(d.local240, f.local240);
      assert.equal(d.slot5040, f.slot5040);
      assert.equal(d.baseQ, f.baseQ);
      assert.equal(d.fiberQ, f.fiberQ);
      assert.equal(d.chart11, f.chart11);
      assert.equal(d.selector, 0);
    }
  });

  it("is deterministic", () => {
    const result = modemRoundTripToGeometryReceipts(SAMPLE_OUTPUT);
    const text1 = packModemFramesToOFile(result.frames);
    const text2 = packModemFramesToOFile(result.frames);
    assert.equal(text1, text2);
    const d1 = unpackOFileToModemFrames(text1);
    const d2 = unpackOFileToModemFrames(text2);
    assert.deepEqual(d1, d2);
  });

  it("handles empty text gracefully", () => {
    const decoded = unpackOFileToModemFrames("");
    assert.deepEqual(decoded, []);
  });
});
