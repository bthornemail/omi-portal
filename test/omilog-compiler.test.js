import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseOmiDocument } from "../src/omi/omi-parser.js";
import {
  KEYWORD_TO_IMO,
  IMO_OP_TO_KEYWORD,
  IMO_CONTROLS,
  isNativeCharPlaneSafe,
  isNativeCharPlaneSafeStrict,
  segmentToNative,
  lowerRecordToImo,
  lowerOmiDocumentToImo,
  compileOmiParsed,
  compileOmiFile
} from "../src/omilog/omi-imo-compiler.js";

const ROOT_OMI_FILES = Object.freeze([
  "RULES.omi",
  "FACTS.omi",
  "CLOSURES.omi",
  "COMBINATORS.omi",
  "CONS.omi"
]);

async function readRepoFile(path) {
  return readFile(join(process.cwd(), path), "utf8");
}

test("KEYWORD_TO_IMO maps all six keywords", () => {
  assert.equal(KEYWORD_TO_IMO.MUST, "!");
  assert.equal(KEYWORD_TO_IMO.FACT, "=");
  assert.equal(KEYWORD_TO_IMO.EQUALS, "=");
  assert.equal(KEYWORD_TO_IMO.CLOSE, ")");
  assert.equal(KEYWORD_TO_IMO.COMBINE, "+");
  assert.equal(KEYWORD_TO_IMO.CONS, ".");
  assert.equal(Object.keys(KEYWORD_TO_IMO).length, 6);
});

test("IMO_OP_TO_KEYWORD round-trips correctly", () => {
  assert.equal(IMO_OP_TO_KEYWORD["!"], "MUST");
  assert.equal(IMO_OP_TO_KEYWORD["="], "EQUALS");
  assert.equal(IMO_OP_TO_KEYWORD[")"], "CLOSE");
  assert.equal(IMO_OP_TO_KEYWORD["+"], "COMBINE");
  assert.equal(IMO_OP_TO_KEYWORD["."], "CONS");
});

test("IMO_CONTROLS defines FS GS RS US at expected code points", () => {
  assert.equal(IMO_CONTROLS.FS, "\x1c");
  assert.equal(IMO_CONTROLS.GS, "\x1d");
  assert.equal(IMO_CONTROLS.RS, "\x1e");
  assert.equal(IMO_CONTROLS.US, "\x1f");
});

test("isNativeCharPlaneSafe accepts low ASCII and Unicode carriers", () => {
  assert.ok(isNativeCharPlaneSafe("!"));
  assert.ok(isNativeCharPlaneSafe("!0-0-0-124-1/128"));
  assert.ok(isNativeCharPlaneSafe("+/0-0-0-0-0-0-16932-18/128"));
  assert.ok(isNativeCharPlaneSafe(".\x1e0-0-0-0-0-0-49157-1/128\x1f"));
  assert.ok(isNativeCharPlaneSafe(""));
  assert.ok(isNativeCharPlaneSafe(" "));
  assert.ok(isNativeCharPlaneSafe("🛹"));
  assert.ok(isNativeCharPlaneSafe("🏷️"));
  assert.ok(isNativeCharPlaneSafe("🤴🏿"));
  assert.ok(isNativeCharPlaneSafe("0"));
  assert.ok(isNativeCharPlaneSafe("?"));
  assert.ok(isNativeCharPlaneSafe("\x00\x01\x1c\x1d\x1e\x1f"));
});

test("isNativeCharPlaneSafe rejects Latin letters and bytes 0x40-0x7E", () => {
  assert.equal(isNativeCharPlaneSafe("a"), false);
  assert.equal(isNativeCharPlaneSafe("Z"), false);
  assert.equal(isNativeCharPlaneSafe("@"), false);
  assert.equal(isNativeCharPlaneSafe("omi-"), false);
  assert.equal(isNativeCharPlaneSafe("MUST"), false);
  assert.equal(isNativeCharPlaneSafe("hello"), false);
});

test("isNativeCharPlaneSafeStrict matches isNativeCharPlaneSafe behavior", () => {
  assert.ok(isNativeCharPlaneSafeStrict("!/0-0-0-124-1/128"));
  assert.equal(isNativeCharPlaneSafeStrict("a"), false);
  assert.equal(isNativeCharPlaneSafeStrict("@"), false);
});

test("segmentToNative converts numeric segment value to decimal string", () => {
  assert.equal(segmentToNative(124), "124");
  assert.equal(segmentToNative(1), "1");
  assert.equal(segmentToNative(49157), "49157");
  assert.equal(segmentToNative(0), "0");
  assert.equal(segmentToNative(23100), "23100");
  assert.equal(segmentToNative(65535), "65535");
});

test("lowerRecordToImo lowers a MUST rule to native operator and decimal address", () => {
  const record = parseOmiDocument(
    'omi-0000-0000-0000-0000-0000-0000-007c-0001/128 MUST parse-native-omi-declarative-records',
  ).records[0];
  const line = lowerRecordToImo(record);
  assert.equal(line, "!/0-0-0-0-0-0-124-1/128");
  assert.ok(isNativeCharPlaneSafe(line));
});

test("lowerRecordToImo lowers all five keyword types", () => {
  const must = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-0084-0001/128 MUST x").records[0];
  const fact = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-0084-1001/128 FACT x").records[0];
  const close = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-0079-c001/128 CLOSE x").records[0];
  const combine = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-5040-b003/128 COMBINE x").records[0];
  const cons = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-c005-0001/128 CONS x").records[0];

  assert.equal(lowerRecordToImo(must), "!/0-0-0-0-0-0-132-1/128");
  assert.equal(lowerRecordToImo(fact), "=/0-0-0-0-0-0-132-4097/128");
  assert.equal(lowerRecordToImo(close), ")/0-0-0-0-0-0-121-49153/128");
  assert.equal(lowerRecordToImo(combine), "+/0-0-0-0-0-0-20544-45059/128");
  assert.equal(lowerRecordToImo(cons), "./0-0-0-0-0-0-49157-1/128");
});

test("lowerRecordToImo preserves suffix in address", () => {
  const record = parseOmiDocument(
    "omi-0000-0000-0000-0000-0000-0000-0000-0000/96/1-2 EQUALS omi-0000-0000-0000-0000-0000-0000-0000-0000/96/2-1"
  ).records[0];
  const line = lowerRecordToImo(record);
  assert.equal(line, "=/0-0-0-0-0-0-0-0/1-2/96");
  assert.ok(isNativeCharPlaneSafe(line));
});

test("compileOmiParsed compiles all five .omi files without violations", async () => {
  for (const file of ROOT_OMI_FILES) {
    const text = await readRepoFile(file);
    const parsed = parseOmiDocument(text, { source: file });
    assert.equal(parsed.malformed.length, 0, `${file} should have zero malformed records`);

    const result = compileOmiParsed(parsed);
    assert.ok(result.lines.length > 0, `${file} should produce .imo lines`);

    for (const line of result.lines) {
      assert.ok(isNativeCharPlaneSafe(line), `${file} .imo line contains Latin byte: ${JSON.stringify(line)}`);
    }
  }
});

test("compileOmiFile rejects source with malformed records", async () => {
  const bad = "omi-\n  (unclosed\n";
  await assert.rejects(
    () => compileOmiFile(bad, { source: "bad.omi" }),
    /malformed/
  );
});

test("isNativeCharPlaneSafe rejects input with Latin letters", () => {
  assert.equal(isNativeCharPlaneSafe("omi-address/128"), false);
  assert.equal(isNativeCharPlaneSafe("hello world"), false);
  assert.equal(isNativeCharPlaneSafe("@test"), false);
  assert.equal(isNativeCharPlaneSafe("a"), false);
  assert.equal(isNativeCharPlaneSafe("Z"), false);
  assert.equal(isNativeCharPlaneSafe(""), true);
  assert.equal(isNativeCharPlaneSafe("!/0-0-0-124-1/128"), true);
});

test(".imo output from RULES.omi contains only native-safe characters", async () => {
  const text = await readRepoFile("RULES.omi");
  const result = await compileOmiFile(text, { source: "RULES.omi" });
  const fullText = result.lines.join("\n");
  const bytes = new TextEncoder().encode(fullText);
  for (const byte of bytes) {
    if (byte >= 0x40 && byte <= 0x7e) {
      assert.fail(`Found forbidden byte 0x${byte.toString(16)} in .imo output`);
    }
  }
});

test(".imo output from FACTS.omi contains only native-safe characters", async () => {
  const text = await readRepoFile("FACTS.omi");
  const result = await compileOmiFile(text, { source: "FACTS.omi" });
  const fullText = result.lines.join("\n");
  for (let i = 0; i < fullText.length; i++) {
    const code = fullText.charCodeAt(i);
    if (code >= 0x40 && code <= 0x7e) {
      assert.fail(`FACTS .imo has forbidden byte 0x${code.toString(16)} at pos ${i}`);
    }
  }
});

test("dist/omi .imo stubs are byte-identical to fresh compilation", async () => {
  const { readFileSync } = await import("node:fs");
  for (const file of ROOT_OMI_FILES) {
    const text = await readRepoFile(file);
    const result = await compileOmiFile(text, { source: file });
    const freshImo = result.lines.join("\n") + "\n";
    const stubPath = join(process.cwd(), "dist/omi", file.replace(/\.omi$/, ".imo"));
    const stubText = readFileSync(stubPath, "utf8");
    assert.equal(freshImo, stubText, `${file} .imo stub matches fresh compilation`);
  }
});

test("Source block records produce RS/US wrapped native address markers", () => {
  const doc = `omi-0000-0000-0000-0000-0000-0000-0079-c005/128 CLOSE q-frame-q-xy-non-collapse-boundary

omi-
  (validate-first
   project-second)
-imo`;
  const parsed = parseOmiDocument(doc, { source: "test" });
  assert.ok(parsed.records[0].sourceBlock);
  const lines = Array.from(lowerOmiDocumentToImo(parsed));
  assert.equal(lines.length, 2);
  assert.equal(lines[0], ")/0-0-0-0-0-0-121-49157/128");
  assert.equal(lines[1], "\x1e0-0-0-0-0-0-121-49157/128\x1f");
  assert.ok(isNativeCharPlaneSafe(lines[1]));
});

test("Emoji in source blocks round-trips through parser-compiler pipeline", () => {
  const doc = `omi-0000-0000-0000-0000-0000-0000-c005-0022/128 CONS emoji-rewrite-pair-alist

omi-
  (omi-🛹 . omi-🏷️)
-imo`;
  const parsed = parseOmiDocument(doc, { source: "test" });
  assert.equal(parsed.malformed.length, 0);
  assert.ok(parsed.records[0].sourceBlock);
  assert.match(parsed.records[0].sourceBlock.raw, /🛹/);

  const compiled = compileOmiParsed(parsed);
  const emojiLines = compiled.lines.filter(l => l.includes("\x1e"));
  assert.ok(emojiLines.length > 0);
  assert.ok(emojiLines[0].includes("/128"));
  assert.ok(isNativeCharPlaneSafe(emojiLines[0]));
});

test("lowerOmiDocumentToImo produces correct line count for mixed source/non-source records", () => {
  const doc = [
    'omi-0000-0000-0000-0000-0000-0000-007c-0001/128 MUST rule-one',
    '',
    'omi-0000-0000-0000-0000-0000-0000-0079-c001/128 CLOSE closure-one',
    '',
    'omi-',
    '  (body)',
    '-imo',
    '',
    'omi-0000-0000-0000-0000-0000-0000-0084-1001/128 FACT fact-one',
  ].join("\n");
  const parsed = parseOmiDocument(doc, { source: "test" });
  assert.equal(parsed.records.length, 3);
  assert.equal(parsed.malformed.length, 0);
  const lines = Array.from(lowerOmiDocumentToImo(parsed));
  assert.equal(lines.length, 4); // 3 record lines + 1 source block marker
});
