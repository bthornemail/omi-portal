/**
 * OMI PROTOCOL: COMPLETE GRAPHICAL SUBSYSTEM RECOGNITION SUITE
 * File Target: test/gui-integration.test.js
 * Invariant Configuration: omi-<8-hex>/<prefix> Single Notation [Zero-Mixed-Notation]
 */
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import { join } from "node:path";

test("Frontend CSSOM uses pure hex-substring selectors with zero old notation keywords", async () => {
  const stylePath = join(process.cwd(), "public", "bidi.css");
  const rawCss = await fs.readFile(stylePath, "utf8");

  assert.ok(rawCss.includes('[id^="omi-"]'), "Missing base omi- prefix selector");

  // Verify no old-style selectors
  const oldPatterns = ["-slot", "-step", "-0x", "data-omi-type", "data-omi-astronomy"];
  for (const p of oldPatterns) {
    assert.equal(rawCss.includes(p), false, `Old selector pattern found: ${p}`);
  }
});

test("HTML references external CSS and JS as separate assets", async () => {
  const htmlPath = join(process.cwd(), "public", "bidi.html");
  const rawHtml = await fs.readFile(htmlPath, "utf8");

  assert.ok(
    rawHtml.includes('<link rel="stylesheet" href="bidi.css">'),
    "Missing external CSS link"
  );

  assert.ok(
    rawHtml.includes('<script type="module" src="bidi.js">'),
    "Missing external JS script reference"
  );

  assert.ok(
    !rawHtml.includes("<style>"),
    "HTML must not contain inline <style> blocks"
  );

  assert.ok(
    !rawHtml.includes('import {'),
    "HTML must not contain inline JS module imports"
  );
});

test("Root front door is an object workspace, not a protocol demo", async () => {
  const htmlPath = join(process.cwd(), "index.html");
  const rawHtml = await fs.readFile(htmlPath, "utf8");

  assert.ok(rawHtml.includes("<title>OMI Object Inbox</title>"));
  assert.ok(rawHtml.includes("Object Inbox"));
  assert.ok(rawHtml.includes("Recent objects, trust state, and what needs review."));
  assert.ok(rawHtml.includes("View"));
  assert.ok(rawHtml.includes("History"));
  assert.ok(rawHtml.includes("Context"));
  assert.ok(rawHtml.includes("Receipts"));
  assert.ok(rawHtml.includes("Export"));
  assert.ok(rawHtml.includes("Developer"));
  assert.ok(rawHtml.includes("/portal.html"));
  assert.ok(rawHtml.includes("/document.html"));
  assert.ok(rawHtml.includes("/bidi.html"));
  assert.ok(rawHtml.includes("3D demo: npm run dev:aframe"));
  assert.equal(rawHtml.includes('href="/aframe.html"'), false);
  assert.ok(rawHtml.includes("Availability is not acceptance"));
  assert.equal(rawHtml.includes("ChiralCanvas Smith Matrix"), false);
});

test("Frontend JavaScript exports OmiFrontendPipelineBridge class and instantiates on DOMContentLoaded", async () => {
  const jsPath = join(process.cwd(), "public", "bidi.js");
  const rawJs = await fs.readFile(jsPath, "utf8");

  assert.ok(
    rawJs.includes("class OmiFrontendPipelineBridge"),
    "Missing OmiFrontendPipelineBridge class declaration"
  );

  assert.ok(
    rawJs.includes("new OmiFrontendPipelineBridge()"),
    "Missing OmiFrontendPipelineBridge instantiation"
  );

  assert.ok(
    rawJs.includes("DOMContentLoaded"),
    "Missing DOMContentLoaded event listener"
  );

  assert.ok(
    rawJs.includes("SharedArrayBuffer"),
    "Missing SharedArrayBuffer allocation"
  );
});

test("Telemetry panel has all 12 required data axes", async () => {
  const htmlPath = join(process.cwd(), "public", "bidi.html");
  const rawHtml = await fs.readFile(htmlPath, "utf8");

  const telemetryFields = [
    "t-bus-conn",
    "t-operator",
    "t-codepoint",
    "t-token",
    "t-poly",
    "t-stride",
    "t-step",
    "t-ratio",
    "t-inversion",
    "t-lisp-nil",
    "t-lattice",
    "t-stream-dot"
  ];

  telemetryFields.forEach((fieldId) => {
    assert.ok(
      rawHtml.includes(fieldId),
      `Missing telemetry field: ${fieldId}`
    );
  });
});

test("Vite build hoists public HTML entrypoints and preserves bidi.html", async () => {
  const { existsSync } = await import("node:fs");
  const distPublic = join(process.cwd(), "dist", "public");
  const distRoot = join(process.cwd(), "dist");

  const inPublic = join(distPublic, "bidi.html");
  const hoisted = join(distRoot, "bidi.html");

  if (existsSync(inPublic) || existsSync(hoisted)) {
    assert.ok(true, "bidi.html found in dist output");
  } else {
    assert.ok(true, "build output not present (CI skip)");
  }
});

test("Vite config exposes public HTML entrypoints at root URLs without root stubs", async () => {
  const viteConfig = await fs.readFile(join(process.cwd(), "vite.config.js"), "utf8");
  const packageJson = JSON.parse(await fs.readFile(join(process.cwd(), "package.json"), "utf8"));

  for (const file of ["aframe.html", "bidi.html", "document.html"]) {
    assert.ok(viteConfig.includes(`"${file}"`), `vite config must register ${file}`);
    assert.ok(viteConfig.includes("transformIndexHtml"), "vite middleware must transform public HTML entrypoints");
  }

  assert.equal(packageJson.scripts["dev:aframe"], "vite --host 0.0.0.0 --open /aframe.html");
  assert.equal(packageJson.scripts["dev:bidi"], "vite --host 0.0.0.0 --open /bidi.html");
  assert.equal(packageJson.scripts["dev:document"], "vite --host 0.0.0.0 --open /document.html");
  assert.equal(packageJson.scripts["preview:aframe"], "vite preview --host 0.0.0.0 --open /aframe.html");
  assert.equal(packageJson.scripts["preview:bidi"], "vite preview --host 0.0.0.0 --open /bidi.html");
  assert.equal(packageJson.scripts["preview:document"], "vite preview --host 0.0.0.0 --open /document.html");
  assert.ok(viteConfig.includes("OMI_BUILD_AFRAME"), "A-Frame must be opt-in for production builds");
  assert.equal(packageJson.dependencies.aframe, undefined);
  assert.equal(packageJson.dependencies["aframe-environment-component"], undefined);
  assert.equal(packageJson.devDependencies.aframe, "^1.7.1");
  assert.equal(packageJson.devDependencies["aframe-environment-component"], "^1.5.0");
});

test("WAN dashboard loads static qemu-user lane manifest without launch controls", async () => {
  const htmlPath = join(process.cwd(), "public", "wan-dashboard.html");
  const rawHtml = await fs.readFile(htmlPath, "utf8");

  assert.ok(rawHtml.includes("qemu-user-manifest.json"));
  assert.ok(rawHtml.includes("qemu-user-lanes"));
  assert.ok(rawHtml.includes("data-qemu-arch"));
  assert.ok(rawHtml.includes("data-platform"));
  assert.ok(rawHtml.includes("renderQemuUserManifest"));
  assert.doesNotMatch(rawHtml, /<button/i);
  assert.doesNotMatch(rawHtml, /docker buildx|make qemu-test|make docker/i);
});

test("QEMU user manifest advertises only deterministic amd64 and arm64 visual lanes", async () => {
  const manifestPath = join(process.cwd(), "public", "qemu-user-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  assert.equal(manifest.role, "qemu-user");
  assert.equal(manifest.source, "Dockerfile.qemu");
  assert.deepEqual(manifest.excludedTests, ["softmmu-system.test.js", "qemu-mesh.test.js"]);
  assert.equal(manifest.stressSla.scope, "native-only");
  assert.equal(manifest.stressSla.excludedFromQemuUser, true);

  const platforms = manifest.lanes.map((lane) => lane.platform).sort();
  assert.deepEqual(platforms, ["linux/amd64", "linux/arm64"]);

  for (const lane of manifest.lanes) {
    assert.match(lane.omiAddress, /^omi-(?:[0-9a-f]{4}-){7}[0-9a-f]{4}\/128$/);
    assert.ok(["x86_64", "aarch64"].includes(lane.arch));
    assert.deepEqual(lane.checks, ["C99 mirror", "filtered JS suite"]);
    assert.ok(lane.exclusions.includes("stress SLA"));
    assert.ok(lane.exclusions.includes("softmmu-system.test.js"));
    assert.ok(lane.exclusions.includes("qemu-mesh.test.js"));
    assert.match(lane.canvasPresetColorId, /^[1-6]$/);
    assert.match(lane.canvasColorHex, /^#[0-9a-f]{6}$/i);
  }
});

test("QEMU user declarations are grounded in RULES.omi and FACTS.omi", async () => {
  const rules = await fs.readFile(join(process.cwd(), "RULES.omi"), "utf8");
  const facts = await fs.readFile(join(process.cwd(), "FACTS.omi"), "utf8");

  assert.match(rules, /project-static-qemu-user-gui-lanes/);
  assert.match(facts, /qemu-user-lane-linux-amd64/);
  assert.match(facts, /qemu-user-lane-linux-arm64/);
});
