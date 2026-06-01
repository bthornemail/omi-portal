import { test } from "node:test";
import { strict as assert } from "node:assert";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import { OmiJsonCanvasKernel, convertSegmentToFp16Color } from "../src/canvas/omicron-canvas.js";

const GENESIS_TOKEN = "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48";

function readRepoFile(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function assertExists(path) {
  await access(join(process.cwd(), path), constants.R_OK);
}

test("Research assimilation: 240 bridge and factorial tower claims are canonicalized outside _temp", async () => {
  const readme = await readRepoFile("README.md");
  const glossary = await readRepoFile("GLOSSARY.md");
  const objectModel = await readRepoFile("docs/07-application/omi-object-model.md");
  const portal = await readRepoFile("public/portal.html");

  for (const doc of [readme, glossary, objectModel]) {
    assert.match(doc, /240 = 2×5!.*15×16.*6!\/3/s);
  }

  assert.match(readme, /slot5040 = fano7×720 \+ role3×240 \+ local240/);
  assert.match(objectModel, /slot5040 = fano7×720 \+ role3×240 \+ local240/);
  assert.match(glossary, /Consumer use: derive slot5040 = fano7×720 \+ role3×240 \+ local240/);

  assert.match(portal, /const ACTIVE_BYTE_SURFACE = 240/);
  assert.match(portal, /semanticSweep: SEMANTIC_ROLE \* ACTIVE_BYTE_SURFACE,\s*\/\/ 720/);
  assert.match(portal, /replayRing: FANO_POINTS \* SEMANTIC_ROLE \* ACTIVE_BYTE_SURFACE,\s*\/\/ 5040/);
  assert.match(portal, /function slot5040\(frame\)/);
});

test("Research assimilation: hidden five and four-fold selector are grounded in RULES and FACTS", async () => {
  const rules = await readRepoFile("RULES.omi");
  const facts = await readRepoFile("FACTS.omi");
  const glossary = await readRepoFile("GLOSSARY.md");

  assert.match(rules, /preserve-five-fold-packet-root/);
  assert.match(rules, /bind-five-fold-packet-to-240-bridge/);
  assert.match(rules, /project-four-fold-selector-surface/);
  assert.match(rules, /derive-shadow-canvas-from-four-fold-selector/);

  assert.match(facts, /five-fold-packet-root-verified/);
  assert.match(facts, /five-fold-packet-bound-to-240-bridge/);
  assert.match(facts, /shadow-canvas-four-fold-selector-active/);

  assert.match(glossary, /### Hidden Five/);
  assert.match(glossary, /### Four-Fold Selector Surface/);
});

test("Research assimilation: canvas color remains deterministic software state, not physics claim", async () => {
  const rules = await readRepoFile("RULES.omi");
  const readme = await readRepoFile("README.md");
  const glossary = await readRepoFile("GLOSSARY.md");

  const kernel = new OmiJsonCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const canvasObj = JSON.parse(kernel.generateOmicronCanvasSpec(S));
  const colors = new Set(canvasObj.nodes.map((node) => node.color));
  const expected = convertSegmentToFp16Color(0x1434);

  assert.equal(colors.size, 1);
  assert.equal([...colors][0], expected.baseColorHex);
  assert.equal(canvasObj.nodes.every((node) => node.omi.fp16Color.baseColorHex === expected.baseColorHex), true);
  assert.equal(canvasObj.nodes.every((node) => !("colorSpectrum" in node.omi)), true);

  assert.match(rules, /encode-translation-free-canvas-color/);
  assert.match(readme, /optical-clock language is only an analogy/);
  assert.match(glossary, /Translation-free canvas color/);
});

test("Research assimilation: MCRSGSP provenance maps only to implemented distributed carriers", async () => {
  const distributedDoc = await readRepoFile("docs/03-network/omi-distributed-protocol.md");
  const objectModel = await readRepoFile("docs/07-application/omi-object-model.md");
  const manifest = JSON.parse(await readRepoFile("docs/10-declaration/omi-object-model.manifest.json"));

  assert.match(distributedDoc, /MCRSGSP/);
  assert.match(objectModel, /MCRSGSP/);
  assert.match(distributedDoc, /provenance, not a canonical runtime/);
  assert.equal(manifest.sources.some((source) => source.path.startsWith("dev-docs/_temp/")), false);

  for (const sourcePath of [
    "src/distributed/erasure.js",
    "src/distributed/fragment-store.js",
    "src/distributed/causal-closure.js",
    "src/distributed/version-vector.js",
    "src/distributed/gossip.js",
    "src/distributed/anti-entropy.js"
  ]) {
    assert.match(distributedDoc, new RegExp(sourcePath.replaceAll("/", "\\/").replaceAll(".", "\\.")));
    await assertExists(sourcePath);
  }
});
