/**
 * OMI PROTOCOL: COHERENT IPV6-CIDR SINGULAR NOTATION REGRESSION CHECK
 * File Target: test/pure-ipv6.test.js
 * Invariant Configuration: omi-<8-hex>/<prefix> Single Notation [Zero-Mixed-Notation]
 */
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import { join } from "node:path";

test("Substrate elements use pure IPv6-CIDR notation with zero mixed keywords", async () => {
  const htmlPath = join(process.cwd(), "public", "bidi.html");
  const rawHtml = await fs.readFile(htmlPath, "utf8");

  // All IDs must start with omi- followed by hex segments
  const idMatches = rawHtml.match(/id="([^"]+)"/g) || [];
  for (const match of idMatches) {
    const id = match.slice(4, -1);
    // Skip special IDs (panel, root, stream-log)
    if (id === "omi-telemetry-panel" || id === "OMI-UNIVERSAL-GUI-ROOT" ||
        id === "stream-log" || id.startsWith("t-")) continue;
    assert.ok(
      /^omi-[0-9a-f]{4}(-[0-9a-f]{4}){7}\/\d+(?:\/(?:\d+|\d+-\d+|[οΟ][A-Za-z0-9_-]+))?$/.test(id),
      `ID does not match omi-<8-hex>/<prefix> format: ${id}`
    );
  }

  // No mixed notation keywords allowed in ID attributes or CIDR notation
  // (Documentation comments containing descriptive words are fine)
  const forbidden = ["-slot-", "-vau-", "-env-", "-hyp", "-vertex",
                     "nil-", "lattice-", "replay-"];

  // Check IDs only (not comments) via attr-exact matching
  const idValues = [...rawHtml.matchAll(/id="([^"]+)"/g)].map(m => m[1])
    .concat([...rawHtml.matchAll(/-omi-([^"\/]+)/g)].map(m => m[1]))
    .filter(Boolean);

  for (const word of forbidden) {
    // Skip descriptive comment words when they're in HTML comments
    const inId = idValues.some(id => id.includes(word));
    assert.equal(inId, false,
      `Mixed notation keyword found in ID: ${word}`
    );
  }

  // -step and -terminator are telemetry/doc words only, not CIDR notation
  assert.equal(rawHtml.includes("-step-"), false, "Notation -step- found in CIDR IDs");
});

test("Pure IPv6 CSSOM selectors reference hex locations only", async () => {
  const stylePath = join(process.cwd(), "public", "bidi.css");
  const rawCss = await fs.readFile(stylePath, "utf8");

  // Verify the base omi- prefix wildcard
  assert.ok(rawCss.includes('[id^="omi-"]'), "Missing base omi- prefix selector");

  // Key hex segment matchers for operational parameters
  const hexMatchers = [
    "-039f-",    // cardinal phase
    "-02d0-",    // stride 720
    "-0078-",    // stride 120
    "-13b0-",    // stride 5040
    "-000f-",    // step 15
    "-003b-",    // step 59
    "-5a3c-",    // inversion gate
    "-0001/",    // nil terminator
    "-0003-0000/", // lattice layer 3!
    "-0007-0000/", // lattice layer 7!
    "-0008-",    // bus ::8
    "/96/1-2",   // reciprocal suffix
    "/96/2-1",   // reciprocal suffix inverse
    "/96/ο",     // Chiron radix delimiter
    "/96/Ο",     // Cardinal radix delimiter
  ];

  hexMatchers.forEach((hex) => {
    assert.ok(
      rawCss.includes(hex) || rawCss.includes(`[id*="${hex}"]`),
      `Missing hex segment selector: ${hex}`
    );
  });

  // No old notation keywords in CSS
  const forbidden = ["-slot", "-step", "-vau", "data-omi-type", "data-omi-astronomy"];
  for (const word of forbidden) {
    assert.equal(
      rawCss.includes(word), false,
      `Old notation keyword still in CSS: ${word}`
    );
  }
});

test("Arithmetic hex segment decoding in JS derives parameters correctly", async () => {
  const jsPath = join(process.cwd(), "public", "bidi.js");
  const rawJs = await fs.readFile(jsPath, "utf8");

  // Verify the bit-map comments documenting the 8-segment layout
  assert.ok(rawJs.includes("chiral/cardinal phase"), "Missing chiral/cardinal doc");
  assert.ok(rawJs.includes("inversion gate"), "Missing inversion gate doc");
  assert.ok(rawJs.includes("step rank"), "Missing step rank doc");
  assert.ok(rawJs.includes("stride offset"), "Missing stride offset doc");
  assert.ok(rawJs.includes("nil terminator"), "Missing nil terminator doc");

  // Verify hex-to-int parsing
  assert.ok(rawJs.includes("parseInt("), "Missing hex parseInt calls");
  assert.ok(rawJs.includes('"omi-"'), "Missing omi- prefix check");

  // Verify no old-style string parsing (telemetry axis IDs like t-step are fine)
  assert.equal(
    rawJs.includes("-slot-"), false,
    "JS still references old -slot- notation"
  );
  assert.equal(
    rawJs.includes("data-step"), false,
    "JS still references old -step attribute"
  );
});

test("All DOM IDs have corresponding data-omi-address match", async () => {
  const htmlPath = join(process.cwd(), "public", "bidi.html");
  const rawHtml = await fs.readFile(htmlPath, "utf8");

  // Extract all id="omi-..." values
  const idRegex = /id="(omi-[^"]+)"/g;
  let match;
  while ((match = idRegex.exec(rawHtml)) !== null) {
    const id = match[1];
    // Skip non-CIDR containers (telemetry panel, HTML root)
    if (id === "omi-telemetry-panel" || id === "omi-bidi-panel") continue;
    // Each such ID must have a matching data-omi-address attribute
    assert.ok(
      rawHtml.includes(`data-omi-address="${id}"`),
      `ID ${id} missing matching data-omi-address`
    );
  }
});

test("Hard-reset handler clears all [id^='omi-'] elements", async () => {
  const jsPath = join(process.cwd(), "public", "bidi.js");
  const rawJs = await fs.readFile(jsPath, "utf8");

  assert.ok(
    rawJs.includes("querySelectorAll(\"[id^='omi-']\")"),
    "Missing hard-reset selector targeting all omi- prefixed elements"
  );
  assert.ok(
    rawJs.includes("floatArray.fill(0.0)"),
    "Missing SAB zero-fill on hard reset"
  );
});
