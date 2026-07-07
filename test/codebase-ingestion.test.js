import test from "node:test";
import assert from "node:assert/strict";
import {
  addressToPairWords,
  buildOmiDocuments,
  composeOmiAddressForElement,
  detectLanguage,
  ingestSourceFile,
  ingestSources,
  scanCodeSource,
  segmentWordsToPairWords
} from "../src/omi/codebase-ingestion.js";
import { parseOmiDocument } from "../src/omi/omi-parser.js";

const SAMPLE_TS = `
import assert from "node:assert";

export interface Packet {
  id: string;
}

export class Runner {
  run(value) {
    return value;
  }
}

export function fold(input) {
  return input;
}

const tick = (x) => x + 1;
const pair = 2;
assert(pair);
`;

test("detectLanguage maps supported source extensions", () => {
  assert.equal(detectLanguage("src/main.js"), "javascript");
  assert.equal(detectLanguage("src/main.ts"), "typescript");
  assert.equal(detectLanguage("kernel.c"), "c");
  assert.equal(detectLanguage("kernel.hpp"), "cpp");
  assert.equal(detectLanguage("tool.py"), "python");
  assert.equal(detectLanguage("README.md"), "generic");
});

test("scanCodeSource maps TypeScript structure into OMI categories", () => {
  const elements = scanCodeSource({
    path: "src/sample.ts",
    content: SAMPLE_TS
  });
  const categories = new Set(elements.map((element) => element.category));
  const names = new Set(elements.map((element) => element.name));

  assert(categories.has("RULES"));
  assert(categories.has("FACTS"));
  assert(categories.has("CLOSURES"));
  assert(categories.has("COMBINATORS"));
  assert(categories.has("CONS"));
  assert(names.has("Packet"));
  assert(names.has("Runner"));
  assert(names.has("fold"));
  assert(names.has("tick"));
  assert(names.has("pair"));
});

test("ingestSourceFile creates deterministic records, cells, and receipts", () => {
  const first = ingestSourceFile({
    path: "src/sample.ts",
    content: SAMPLE_TS
  });
  const second = ingestSourceFile({
    path: "src/sample.ts",
    content: SAMPLE_TS
  });

  assert.equal(first.summary.recordCount, second.summary.recordCount);
  assert.deepEqual(
    first.records.map((record) => record.address),
    second.records.map((record) => record.address)
  );
  assert(first.records.every((record) => record.address.startsWith("omi-0c0d-0002-")));
  assert(first.records.every((record) => record.telemetry.startsWith("QED slot=")));
  assert(first.records.every((record) => record.cell && Number.isInteger(record.cell.delta)));
});

test("address pair words read eight 16-bit segments as four 32-bit words", () => {
  const words = segmentWordsToPairWords([0x0c0d, 0x0002, 0x0004, 0x0010, 0xaaaa, 0xbbbb, 0xcccc, 0xdddd]);
  assert.deepEqual(words, [0x0c0d0002, 0x00040010, 0xaaaabbbb, 0xccccdddd]);

  const address = "omi-0c0d-0002-0004-0010-aaaa-bbbb-cccc-dddd";
  assert.deepEqual(addressToPairWords(address), words);
});

test("composeOmiAddressForElement is stable for the same structural element", () => {
  const element = {
    category: "COMBINATORS",
    kind: "function",
    language: "typescript",
    line: 14,
    column: 8,
    name: "fold",
    ordinal: 3,
    signature: "export function fold(input) {",
    sourcePath: "src/sample.ts"
  };

  assert.equal(composeOmiAddressForElement(element), composeOmiAddressForElement(element));
});

test("buildOmiDocuments emits parseable OMI adapter documents", () => {
  const ingestion = ingestSourceFile({
    path: "src/sample.ts",
    content: SAMPLE_TS
  });
  const documents = buildOmiDocuments(ingestion);

  for (const [fileName, text] of Object.entries(documents)) {
    const parsed = parseOmiDocument(text, { source: fileName });
    assert.equal(parsed.malformed.length, 0, fileName);
    assert.equal(parsed.records.length, ingestion.summary.categories[fileName.replace(".omi", "")]);
  }
});

test("ingestSources sorts source paths before assigning global ordinals", () => {
  const aThenB = ingestSources([
    { path: "b.py", content: "def beta():\n    return 1\n" },
    { path: "a.c", content: "int alpha(void) { return 1; }\n" }
  ]);
  const bThenA = ingestSources([
    { path: "a.c", content: "int alpha(void) { return 1; }\n" },
    { path: "b.py", content: "def beta():\n    return 1\n" }
  ]);

  assert.deepEqual(
    aThenB.records.map((record) => record.address),
    bThenA.records.map((record) => record.address)
  );
  assert.equal(aThenB.summary.categories.COMBINATORS, 2);
});
