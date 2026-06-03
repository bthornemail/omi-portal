import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseOmiDocument } from "../src/omi/omi-parser.js";
import {
  LITTLE_OMICRON,
  BIG_OMICRON,
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

test("KEYWORD_TO_IMO maps all six native keyword entries", () => {
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
  assert.equal(IMO_OP_TO_KEYWORD["?"], undefined);
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
  assert.ok(isNativeCharPlaneSafe("\x00\x01\x1c\x1d\x1e\x1f"));
  assert.ok(isNativeCharPlaneSafe(LITTLE_OMICRON));
  assert.ok(isNativeCharPlaneSafe(BIG_OMICRON));
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
  assert.equal(line, `${LITTLE_OMICRON} !/0-0-0-0-0-0-124-1/128 ${BIG_OMICRON}`);
  assert.ok(isNativeCharPlaneSafe(line));
});

test("lowerRecordToImo lowers all compiler keyword operators", () => {
  const must = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-0084-0001/128 MUST x").records[0];
  const fact = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-0084-1001/128 FACT x").records[0];
  const equals = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-0084-1002/128 EQUALS y").records[0];
  const close = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-0079-c001/128 CLOSE x").records[0];
  const combine = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-5040-b003/128 COMBINE x").records[0];
  const cons = parseOmiDocument("omi-0000-0000-0000-0000-0000-0000-c005-0001/128 CONS x").records[0];

  assert.equal(lowerRecordToImo(must), `${LITTLE_OMICRON} !/0-0-0-0-0-0-132-1/128 ${BIG_OMICRON}`);
  assert.equal(lowerRecordToImo(fact), `${LITTLE_OMICRON} =/0-0-0-0-0-0-132-4097/128 ${BIG_OMICRON}`);
  assert.equal(lowerRecordToImo(equals), `${LITTLE_OMICRON} =/0-0-0-0-0-0-132-4098/128 ${BIG_OMICRON}`);
  assert.equal(lowerRecordToImo(close), `${LITTLE_OMICRON} )/0-0-0-0-0-0-121-49153/128 ${BIG_OMICRON}`);
  assert.equal(lowerRecordToImo(combine), `${LITTLE_OMICRON} +/0-0-0-0-0-0-20544-45059/128 ${BIG_OMICRON}`);
  assert.equal(lowerRecordToImo(cons), `${LITTLE_OMICRON} ./0-0-0-0-0-0-49157-1/128 ${BIG_OMICRON}`);
});

test("lowerRecordToImo preserves suffix in address", () => {
  const record = parseOmiDocument(
    "omi-0000-0000-0000-0000-0000-0000-0000-0000/96/1-2 EQUALS omi-0000-0000-0000-0000-0000-0000-0000-0000/96/2-1"
  ).records[0];
  const line = lowerRecordToImo(record);
  assert.equal(line, `${LITTLE_OMICRON} =/0-0-0-0-0-0-0-0/1-2/96 ${BIG_OMICRON}`);
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

function isOmicronByte(b) {
  return b === 0xCE || b === 0xBF || b === 0x9F;
}

function assertNoLatinBytes(text, label) {
  const bytes = new TextEncoder().encode(text);
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 0x40 && b <= 0x7e && !isOmicronByte(b)) {
      assert.fail(`${label} has forbidden Latin byte 0x${b.toString(16)} at pos ${i}`);
    }
  }
}

test(".imo output from RULES.omi contains only native-safe characters", async () => {
  const text = await readRepoFile("RULES.omi");
  const result = await compileOmiFile(text, { source: "RULES.omi" });
  assertNoLatinBytes(result.lines.join("\n"), "RULES.omi .imo");
});

test(".imo output from FACTS.omi contains only native-safe characters", async () => {
  const text = await readRepoFile("FACTS.omi");
  const result = await compileOmiFile(text, { source: "FACTS.omi" });
  assertNoLatinBytes(result.lines.join("\n"), "FACTS.omi .imo");
});

test("dist/omi .imo stubs are regeneratable (no byte-identity check since dist is gitignored)", async () => {
  for (const file of ROOT_OMI_FILES) {
    const text = await readRepoFile(file);
    const result = await compileOmiFile(text, { source: file });
    const freshImo = result.lines.join("\n") + "\n";
    assertNoLatinBytes(freshImo, `${file} .imo`);
    assert.ok(freshImo.includes(LITTLE_OMICRON), `${file} .imo contains little omicron`);
    assert.ok(freshImo.includes(BIG_OMICRON), `${file} .imo contains big omicron`);
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
  assert.equal(lines[0], `${LITTLE_OMICRON} )/0-0-0-0-0-0-121-49157/128 ${BIG_OMICRON}`);
  assert.equal(lines[1], `${LITTLE_OMICRON} \x1e0-0-0-0-0-0-121-49157/128\x1f ${BIG_OMICRON}`);
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
  assert.equal(lines.length, 4);
  for (const line of lines) {
    assert.ok(line.startsWith(LITTLE_OMICRON), `.imo line starts with little omicron: ${line}`);
    assert.ok(line.endsWith(BIG_OMICRON), `.imo line ends with big omicron: ${line}`);
  }
});

test("lowerRecordToImo output starts with ο and ends with Ο", () => {
  const record = parseOmiDocument(
    "omi-0000-0000-0000-0000-0000-0000-007c-0001/128 MUST parse-native-omi-declarative-records"
  ).records[0];
  const line = lowerRecordToImo(record);
  assert.equal(line[0], LITTLE_OMICRON);
  assert.equal(line[line.length - 1], BIG_OMICRON);
  assert.ok(line.includes("!/0-0-0-0-0-0-124-1/128"));
});

test("source block records wrap with ο and Ο delimiters", () => {
  const doc = `omi-0000-0000-0000-0000-0000-0000-0079-c005/128 CLOSE q-frame-q-xy-non-collapse-boundary

omi-
  (validate-first
   project-second)
-imo`;
  const parsed = parseOmiDocument(doc, { source: "test" });
  const lines = Array.from(lowerOmiDocumentToImo(parsed));
  assert.equal(lines.length, 2);
  assert.ok(lines[0].startsWith(LITTLE_OMICRON));
  assert.ok(lines[0].endsWith(BIG_OMICRON));
  assert.ok(lines[1].startsWith(LITTLE_OMICRON));
  assert.ok(lines[1].endsWith(BIG_OMICRON));
  assert.ok(lines[1].includes("\x1e0-0-0-0-0-0-121-49157/128\x1f"));
});

test("Omicron delimiter / wire frame alignment hex values", () => {
  assert.equal(LITTLE_OMICRON.codePointAt(0), 0x03BF);
  assert.equal(BIG_OMICRON.codePointAt(0), 0x039F);
  assert.equal(0x03BF, 959);
  assert.equal(0x039F, 927);
});

test("all five compiled .imo files contain Omicron delimiters and reject Latin bytes", async () => {
  for (const file of ROOT_OMI_FILES) {
    const text = await readRepoFile(file);
    const result = await compileOmiFile(text, { source: file });
    const fullText = result.lines.join("\n");
    assert.ok(fullText.includes(LITTLE_OMICRON), `${file} .imo contains little omicron`);
    assert.ok(fullText.includes(BIG_OMICRON), `${file} .imo contains big omicron`);
    assertNoLatinBytes(fullText, `${file} .imo`);
  }
});
