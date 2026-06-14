import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseNodeTestOutput,
  modulateTestEventToOmi,
  demodulateOmiRecord,
  modemRoundTripTestOutput,
} from "../src/omi/tetragrammatron-modem.js";
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
