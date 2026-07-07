import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BROWSER_SURFACE_GAUGES,
  PROTOCOL_ROUTE_PAYLOAD_BYTES,
  createBrowserProtocolRoute,
  createTetragrammatronProtocolMap,
  decodeBrowserProtocolFrame,
  formatProtocolMapOmi
} from "../src/web/tetragrammatron-protocol-map.js";
import { parseOmiDocument } from "../src/omi/omi-parser.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("default browser protocol map covers DOM, JSDOM, CSSOM, CanvasDOM, and browser events", () => {
  const first = createTetragrammatronProtocolMap({ branch: "feature/dom-protocol" });
  const second = createTetragrammatronProtocolMap({ branch: "feature/dom-protocol" });
  const surfaces = new Set(first.routes.map((route) => route.sourceSurface));

  assert.deepEqual(first, second);
  assert.equal(first.mode, "declarative-no-dom-listeners");
  assert.equal(first.routeCount, 5);
  assert.equal(surfaces.has("DOM"), true);
  assert.equal(surfaces.has("JSDOM"), true);
  assert.equal(surfaces.has("CSSOM"), true);
  assert.equal(surfaces.has("CanvasDOM"), true);
  assert.equal(surfaces.has("BrowserEvent"), true);
  assert.equal(first.routes.every((route) => route.domEventBinding === false), true);
  assert.equal(first.transports.join(","), "raw-binary,mqtt,github,docker,qemu");
  assert.equal(BROWSER_SURFACE_GAUGES.DOM.gauge, "FS");
  assert.equal(BROWSER_SURFACE_GAUGES.CanvasDOM.gauge, "US");
});

test("browser-event centroid route resolves to a concrete gauge and raw binary control frame", () => {
  const route = createBrowserProtocolRoute({
    branch: "feature/dom-protocol",
    surface: "BrowserEvent",
    eventType: "canvas:frame",
    selector: "canvas[data-omi]",
    mediaQuery: "(min-width: 800px)",
    intent: "paint-open-world-component"
  });
  const frame = bytesFromHex(route.binary.frameHex);
  const decoded = decodeBrowserProtocolFrame(frame);

  assert.equal(route.sourceSurface, "BrowserEvent");
  assert.equal(route.surface, "CanvasDOM");
  assert.equal(route.gauge, "US");
  assert.equal(route.controlCode, "0x1f");
  assert.equal(route.descriptors.mqtt.topic, "omi/state/feature/dom-protocol/control");
  assert.equal(decoded.payloadLength, PROTOCOL_ROUTE_PAYLOAD_BYTES);
  assert.equal(decoded.protocol.magic, "OMI");
  assert.equal(decoded.protocol.surfaceCode, BROWSER_SURFACE_GAUGES.CanvasDOM.code);
  assert.equal(decoded.protocol.controlByte, 0x1f);
  assert.equal(decoded.protocol.local240, route.local240);
  assert.equal(decoded.protocol.slot5040, route.slot5040);
  assert.deepEqual([...frame.slice(0, 4)], [0x1c, 0x1d, 0x1e, 0x1f]);
  assert.deepEqual([...frame.slice(-4)], [0x1f, 0x1e, 0x1d, 0x1c]);
});

test("media query changes route digest and receipt without changing DOM listener policy", () => {
  const base = {
    branch: "main",
    surface: "CSSOM",
    eventType: "media:change",
    selector: "@media",
    intent: "route-responsive-component-port"
  };
  const small = createBrowserProtocolRoute({ ...base, mediaQuery: "(max-width: 640px)" });
  const wide = createBrowserProtocolRoute({ ...base, mediaQuery: "(min-width: 1024px)" });

  assert.notEqual(small.hashes.media, wide.hashes.media);
  assert.notEqual(small.binary.receipt, wide.binary.receipt);
  assert.equal(small.domEventBinding, false);
  assert.equal(wide.domEventBinding, false);
});

test("PROTOCOLS.omi generated from protocol map parses cleanly", () => {
  const map = createTetragrammatronProtocolMap({ branch: "main" });
  const omiText = formatProtocolMapOmi(map);
  const parsed = parseOmiDocument(omiText, { source: "PROTOCOLS.omi" });

  assert.equal(parsed.malformed.length, 0);
  assert.equal(parsed.records.length, map.routeCount);
  assert.equal(parsed.records[0].sections.BOUNDARY, "declarative-protocol-map-without-dom-event-listener-binding");
});

test("protocol map CLI writes deterministic review artifacts", () => {
  const root = mkdtempSync(join(tmpdir(), "omi-protocol-map-"));
  const outDir = join(root, "out");

  const result = execFileSync(process.execPath, [
    "scripts/tetragrammatron-protocol-map.js",
    "--out",
    outDir,
    "--branch",
    "feature/dom-protocol"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  assert.match(result, /Tetragrammatron protocol map/);
  for (const fileName of [
    "protocol-map.json",
    "routes.ndjson",
    "transport-plan.json",
    "mqtt-topics.json",
    "PROTOCOLS.omi",
    "raw-frames.bin",
    "raw-frames.hex",
    "decoded-frames.json"
  ]) {
    assert.equal(existsSync(join(outDir, fileName)), true, fileName);
  }

  const map = JSON.parse(readFileSync(join(outDir, "protocol-map.json"), "utf8"));
  const frameBytes = readFileSync(join(outDir, "raw-frames.bin"));
  const parsed = parseOmiDocument(readFileSync(join(outDir, "PROTOCOLS.omi"), "utf8"), {
    source: "PROTOCOLS.omi"
  });

  assert.equal(map.branch, "feature/dom-protocol");
  assert.equal(frameBytes.length, map.routeCount * (PROTOCOL_ROUTE_PAYLOAD_BYTES + 8));
  assert.equal(parsed.malformed.length, 0);
  assert.equal(parsed.records.length, map.routeCount);
});

function bytesFromHex(hex) {
  return Uint8Array.from(String(hex).trim().split(/\s+/).map((part) => Number.parseInt(part, 16)));
}
