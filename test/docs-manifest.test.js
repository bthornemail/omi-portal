import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url);

test("OMI Object Model manifest declares required canonical sections", async () => {
  const manifest = JSON.parse(await readFile(new URL("../docs/10-declaration/omi-object-model.manifest.json", import.meta.url), "utf8"));
  for (const key of [
    "version",
    "canonicalRoot",
    "protocol",
    "sources",
    "addressSpaces",
    "tokenLayouts",
    "fileFormats",
    "objectSurfaces",
    "projectiveTiming",
    "hardwareEngines",
    "sequencing",
    "controlDescriptors",
    "transformers",
    "routingTables",
    "polynomial",
    "lifecycleSweeps",
    "complianceChecks",
    "terms"
  ]) {
    assert.ok(Object.hasOwn(manifest, key), `missing manifest key ${key}`);
  }

  assert.equal(manifest.canonicalRoot.omi, "omi-ffff-127-0-0-1");
  assert.equal(manifest.canonicalRoot.ipv6, "::ffff:127.0.0.1");
  assert.equal(manifest.canonicalRoot.remoteCodepointRoot, "::/128");
  assert.equal(manifest.protocol.version, "Omi-v1.2.0");
});

test("OMI Object Model manifest tracks curated dev-docs provenance without requiring build context", async () => {
  const manifest = JSON.parse(await readFile(new URL("../docs/10-declaration/omi-object-model.manifest.json", import.meta.url), "utf8"));
  const devDocsDir = join(repoRoot.pathname, "dev-docs");
  const sources = manifest.sources.map((source) => source.path).sort();

  const ignoredDrafts = [];

  const devDocs = await readdir(devDocsDir)
    .then((names) => names
      .filter((name) => name.endsWith(".md"))
      .filter((name) => !ignoredDrafts.includes(name))
      .map((name) => `dev-docs/${name}`)
      .sort())
    .catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });

  if (devDocs === null) {
    const devDocSources = sources.filter((source) => source.startsWith("dev-docs/"));
    assert.ok(devDocSources.length > 0, "manifest should retain curated dev-docs source entries");
    assert.ok(devDocSources.every((source) => source.endsWith(".md")));
    return;
  }

  const devDocSources = sources.filter(
    (s) => s.startsWith("dev-docs/") && s.endsWith(".md") && !ignoredDrafts.some((draft) => s.endsWith(draft))
  );

  assert.deepEqual(devDocSources, devDocs);
});

test("OMI Object Model manifest declares address spaces and Lisp transformers", async () => {
  const manifest = JSON.parse(await readFile(new URL("../docs/10-declaration/omi-object-model.manifest.json", import.meta.url), "utf8"));
  const addressNotations = new Set(manifest.addressSpaces.map((space) => space.notation));
  assert.ok(addressNotations.has("::1..::12"));

  const service = manifest.addressSpaces.find((space) => space.id === "semantic-service-buses");

  assert.ok(service.buses.some((bus) => bus.ipv6 === "::3" && bus.name === "prolog-wordnet-broker"));

  assert.ok(service.buses.some((bus) => bus.ipv6 === "::8" && bus.name === "master-canvas-surface"));

  assert.ok(service.buses.some((bus) => bus.ipv6 === "::10" && bus.name === "webserial-port-bus"));

  assert.ok(service.buses.some((bus) => bus.ipv6 === "::11" && bus.name === "webusb-interface-bus"));

  assert.ok(service.buses.some((bus) => bus.ipv6 === "::12" && bus.name === "webhid-device-bus"));

  const transformerIds = new Set(manifest.transformers.map((transformer) => transformer.id));
  assert.ok(transformerIds.has("cons"));
  assert.ok(transformerIds.has("car"));
  assert.ok(transformerIds.has("cdr"));

  const terms = new Set(manifest.terms.map((term) => term.term));
  assert.ok(terms.has("IPR"));
  assert.ok(terms.has("JSDOM"));
});

test("OMI Object Model manifest declares prospectus token layouts and compliance checks", async () => {
  const manifest = JSON.parse(await readFile(new URL("../docs/10-declaration/omi-object-model.manifest.json", import.meta.url), "utf8"));
  const layouts = new Set(manifest.tokenLayouts.map((layout) => layout.id));
  assert.ok(layouts.has("canonical-fs-gs-rs-us"));
  assert.ok(layouts.has("fano-wordnet-operator"));
  assert.ok(layouts.has("fano-upos-two-cube"));
  assert.ok(layouts.has("omi-file-dot-cdr"));

  const omiFile = manifest.fileFormats.find((format) => format.id === "omi-file-v0");
  assert.equal(omiFile.extension, ".omi");
  assert.equal(omiFile.car.bytes, 4);
  assert.equal(omiFile.cdr.shape, "content.context.payload");
  assert.deepEqual(omiFile.cdr.lambdaCube, [
    "content CIDR block space hierarchy",
    "context UPOS port socket pair",
    "Base64 Float32 vector payload"
  ]);

  assert.equal(manifest.projectiveTiming.geometry, "Fano Plane PG(2,2)");
  assert.equal(manifest.projectiveTiming.points, 7);
  assert.ok(manifest.projectiveTiming.lifecycle.some((entry) => entry.slot === 720));
  assert.ok(manifest.projectiveTiming.lifecycle.some((entry) => entry.slot === 5040));

  const engines = new Set(manifest.hardwareEngines.map((engine) => engine.id));
  assert.ok(engines.has("carry-lookahead-adder"));
  assert.ok(engines.has("webgl2-shader-stream"));

  const checks = new Set(manifest.complianceChecks.map((check) => check.id));
  assert.ok(checks.has("zero-escape-identity"));
  assert.ok(checks.has("topological-containment"));
  assert.ok(checks.has("factorial-alignment"));
  assert.ok(checks.has("non-blocking-ingestion"));
  assert.ok(checks.has("zero-copy-serialization-boundary"));
});

test("OMI Object Model manifest declares polynomial and lifecycle standard", async () => {
  const manifest = JSON.parse(await readFile(new URL("../docs/10-declaration/omi-object-model.manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.polynomial.evaluation, "horners-method");
  assert.equal(manifest.polynomial.payloadBytes, 16);
  assert.deepEqual(manifest.polynomial.coefficients.map((coefficient) => coefficient.term), [
    "FS_Weight",
    "GS_Weight",
    "RS_Weight",
    "US_Weight"
  ]);

  const sweeps = new Set(manifest.lifecycleSweeps.map((sweep) => sweep.condition));
  assert.ok(sweeps.has("tick % 720 === 0"));
  assert.ok(sweeps.has("tick % 5040 === 0"));

  const upos = manifest.routingTables.find((table) => table.id === "upos-port-projection");
  const fs = upos.entries.find((entry) => entry.key === "FS");
  const gs = upos.entries.find((entry) => entry.key === "GS");
  const rs = upos.entries.find((entry) => entry.key === "RS");
  const us = upos.entries.find((entry) => entry.key === "US");
  assert.deepEqual(fs.tags, ["NOUN", "PROPN", "VERB", "ADJ"]);
  assert.ok(gs.tags.includes("PART"));
  assert.ok(rs.role.includes("F-expression"));
  assert.ok(us.role.includes("S-expression"));
});

test("OMI Object Model manifest declares protocol sequencing phases", async () => {
  const manifest = JSON.parse(await readFile(new URL("../docs/10-declaration/omi-object-model.manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.sequencing.spec, "docs/04-transport/omi-protocol-sequencing.md");
  assert.deepEqual(manifest.sequencing.phases.map((phase) => phase.id), [
    "ingestion-compilation",
    "memory-time-metrics",
    "routing-transports",
    "spatial-eviction"
  ]);
  assert.deepEqual(manifest.sequencing.rotators, [
    "rot7",
    "rot15",
    "rot60",
    "rot120",
    "rot240",
    "rot360",
    "rot720"
  ]);
  assert.ok(manifest.sequencing.assertions.includes("non-blocking-ingestion"));
  assert.ok(manifest.sequencing.assertions.includes("zero-copy-serialization-boundary"));
  assert.ok(manifest.sequencing.assertions.includes("factorial-time-alignment"));
});

test("OMI research inbox claims are promoted through canonical docs, not _temp manifest entries", async () => {
  const manifest = JSON.parse(await readFile(new URL("../docs/10-declaration/omi-object-model.manifest.json", import.meta.url), "utf8"));
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const objectModel = await readFile(new URL("../docs/07-application/omi-object-model.md", import.meta.url), "utf8");
  const binaryQuadraticForm = await readFile(new URL("../docs/07-application/omi-binary-quadratic-form.md", import.meta.url), "utf8");
  const distributed = await readFile(new URL("../docs/03-network/omi-distributed-protocol.md", import.meta.url), "utf8");

  assert.equal(manifest.sources.some((source) => source.path.startsWith("dev-docs/_temp/")), false);
  assert.ok(manifest.sources.some((source) => source.path === "docs/07-application/omi-binary-quadratic-form.md" && source.canonicalStatus === "canonical"));
  assert.ok(manifest.layerMap.documentAssignments.some((source) => source.path === "docs/07-application/omi-binary-quadratic-form.md" && source.primary === "application"));
  assert.match(readme, /dev-docs\/_temp\/.*inbox/);
  assert.match(objectModel, /Promoted Research Invariants/);
  assert.match(objectModel, /240 = 2×5! = 15×16 = 6!\/3/);
  assert.match(binaryQuadraticForm, /Q_frame\(S\) validates the 128-bit OMI envelope/);
  assert.match(binaryQuadraticForm, /Q_xy\(x,y\)\s*=\s*60x²\s*\+\s*16xy\s*\+\s*4y²/);
  assert.match(binaryQuadraticForm, /Q_xy\(x,y\) projects decoded state into geometry/);
  assert.match(binaryQuadraticForm, /slot5040 = fano7×720 \+ role3×240 \+ local240/);
  assert.match(binaryQuadraticForm, /Symbols project the law\.\s*Symbols do not create the law\./);
  assert.match(distributed, /MCRSGSP/);
  assert.match(distributed, /provenance, not a canonical runtime/);
});
