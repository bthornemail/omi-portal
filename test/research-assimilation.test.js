import { test } from "node:test";
import { strict as assert } from "node:assert";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { parseOmiAddressToSegments } from "../src/omi/delta-orbital-lexer.js";
import {
  convertSegmentToFp16Color,
  encodeSymbolicBase36,
  OmiBarycentricCanvasKernel,
  OmiJsonCanvasKernel,
  omiLocal240,
  omiQuadraticProject,
  omiRootDepth,
  omiSlot5040,
  projectBase36Symbol
} from "../src/canvas/omicron-canvas.js";

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

test("Research assimilation: symbolic character carriers are projection-only canon", async () => {
  const rules = await readRepoFile("RULES.omi");
  const facts = await readRepoFile("FACTS.omi");
  const readme = await readRepoFile("README.md");
  const glossary = await readRepoFile("GLOSSARY.md");
  const objectModel = await readRepoFile("docs/07-application/omi-object-model.md");

  const kernel = new OmiBarycentricCanvasKernel();
  const S = parseOmiAddressToSegments(GENESIS_TOKEN);
  const metrics = kernel.processMetadataDividend(S, 0xABC1, () => 1);

  assert.equal(encodeSymbolicBase36(120), "3C");
  assert.equal(encodeSymbolicBase36(240), "6O");
  assert.equal(encodeSymbolicBase36(24), "O");
  assert.equal(encodeSymbolicBase36(720), "K0");
  assert.equal(encodeSymbolicBase36(5040), "3W0");

  assert.equal(metrics.symbolicCarrier.authority, "projection-only");
  assert.equal(metrics.offsetIndex, metrics.timelineSlot % 36);
  assert.equal(metrics.hueAngleDegrees, metrics.offsetIndex * 10);
  assert.equal("timelineSlot" in metrics, true);
  assert.equal("coreTruthRow" in metrics, true);

  assert.match(rules, /project-base36-orbital-carriers/);
  assert.match(rules, /ground-emoji-carriers-in-unicode-data/);
  assert.match(rules, /enforce-symbolic-carrier-projection-boundary/);
  assert.match(facts, /base36-hidden-five-root-120-3C/);
  assert.match(facts, /unicode-emoji-test-source-vendor-emoji-test/);
  assert.match(facts, /symbolic-carriers-are-projection-only/);

  for (const doc of [readme, glossary, objectModel]) {
    assert.match(doc, /120\s*(?:=|->)\s*3C/);
    assert.match(doc, /240\s*(?:=|->)\s*6O/);
    assert.match(doc, /5040\s*(?:=|->)\s*3W0/);
  }
  assert.match(glossary, /Domino pair carriers and binary16 emoji registers remain research provenance/);
});

test("Research assimilation: Q_frame validates and Q_xy projects as separate quadratic laws", async () => {
  const rules = await readRepoFile("RULES.omi");
  const facts = await readRepoFile("FACTS.omi");
  const ontology = await readRepoFile("ONTOLOGY.md");
  const readme = await readRepoFile("README.md");
  const glossary = await readRepoFile("GLOSSARY.md");
  const objectModel = await readRepoFile("docs/07-application/omi-object-model.md");

  assert.equal(omiQuadraticProject(3, 3), 720);
  assert.equal(omiRootDepth(3, 3), 120);
  assert.equal(omiLocal240(1, 2), 108);
  assert.equal(omiSlot5040(6, 2, 1, 2), 4908);

  const base36 = projectBase36Symbol("A");
  assert.equal(base36.authority, "projection-only");
  assert.equal(base36.q, omiQuadraticProject(base36.x, base36.y));
  assert.equal(base36.local240, base36.q % 240);

  assert.match(rules, /project-local-state-through-omi-binary-quadratic-form/);
  assert.match(rules, /distinguish-frame-validation-from-coordinate-projection/);
  assert.match(rules, /derive-local240-from-quadratic-projection/);
  assert.match(rules, /preserve-quadratic-symbolic-projection-boundary/);
  assert.match(facts, /omi-binary-quadratic-form-documented/);
  assert.match(facts, /local240-derivable-from-quadratic-form-modulo-240/);

  for (const doc of [ontology, readme, glossary, objectModel]) {
    assert.match(doc, /Q_frame\(S\)/);
    assert.match(doc, /Q_xy\(x,y\)/);
  }
  assert.match(ontology, /Q_frame\(S\) validates the carrier/);
  assert.match(glossary, /It is not the Binary Quadratic Meta-Mask Lexer/);
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
