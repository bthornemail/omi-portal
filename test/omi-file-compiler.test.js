import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultOmiFileHeader,
  encodeOmiFile,
  OMI_FILE_HEADER,
  OmiFileSpecificationCompiler,
  parseOmiDotNotationBody,
  parseOmiFileHeader
} from "../src/index.js";

function payload(values) {
  return Buffer.from(new Float32Array(values).buffer).toString("base64url");
}

test("OMI file header parses car control bytes", () => {
  const header = parseOmiFileHeader(new Uint8Array([
    OMI_FILE_HEADER.LITTLE_LEFT,
    OMI_FILE_HEADER.POSITIVE_LTR,
    OMI_FILE_HEADER.FLOAT32,
    OMI_FILE_HEADER.HYPHEN
  ]));
  assert.equal(header.endian, "little");
  assert.equal(header.chirality, "left");
  assert.equal(header.polarity, "positive");
  assert.equal(header.bidiFlow, "ltr");
  assert.equal(header.alignment, "float32");
  assert.equal(header.delimiter, "-");
});

test("OMI file compiler reads binary car and dot-notation cdr", () => {
  const content = "omi-ffff-127-0-0-1-0x1a";
  const buffer = encodeOmiFile({
    header: defaultOmiFileHeader({ endian: "little", polarity: "positive", alignment: "float32" }),
    content,
    contextPorts: ["NOUN", "VERB", "SYM"],
    payload: new Float32Array([1.5, 2, -0.5, 10])
  });
  const compiler = new OmiFileSpecificationCompiler(new SharedArrayBuffer(128));
  const cell = compiler.compileFileStream(buffer);
  assert.equal(compiler.car(cell).endian, "little");
  assert.equal(compiler.cdr(cell).content, content);
  assert.deepEqual(compiler.cdr(cell).contextPorts, ["NOUN", "VERB", "SYM"]);
  assert.equal(compiler.cdr(cell).payload.kind, "float32");
  assert.deepEqual(compiler.cdr(cell).payload.values, [1.5, 2, -0.5, 10]);
  assert.equal(compiler.cdr(cell).dataAttributes["data-omi"], content);
});

test("OMI dot notation parser supports UTF-8 clamped payload fallback", () => {
  const header = parseOmiFileHeader(defaultOmiFileHeader());
  const cdr = parseOmiDotNotationBody("omi-ffff-127-0-0-1-0x1a.NOUN-VERB.hello_world!", header);
  assert.equal(cdr.payload.kind, "utf8-clamped");
  assert.equal(cdr.payload.text, "hello_world!");
  assert.ok(cdr.payload.vector instanceof Uint8ClampedArray);
});

test("OMI file compiler rejects malformed header and context ports", () => {
  assert.throws(
    () => parseOmiFileHeader(new Uint8Array([0x40, 0x0a, 0x20, 0x2d])),
    /exceeds 0x3f/
  );
  assert.throws(
    () => parseOmiFileHeader(new Uint8Array([0x01, 0x0a, 0x20, 0x2e])),
    /delimiter/
  );
  assert.throws(
    () => parseOmiDotNotationBody(`omi-ffff-127-0-0-1-0x1a.NOUN-NOPE.${payload([1, 2, 3, 4])}`),
    /UPOS/
  );
});
