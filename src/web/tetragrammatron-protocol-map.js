import { fnv1a32, stableJson } from "../core/deterministic-utils.js";
import { formatOmiAddressFromSegments } from "../omi/codebase-ingestion.js";
import {
  buildOmiMqttTopics,
  controlFrameToHex,
  decodeControlFrame,
  encodeControlFrame,
  formatOmiMqttTopic,
  normalizeBranch,
  receiptForBytes
} from "../distributed/omi-pseudo-persistent-network.js";

export const TETRAGRAMMATRON_PROTOCOL_MAP_VERSION = 1;
export const PROTOCOL_ROUTE_PAYLOAD_BYTES = 32;
export const PROTOCOL_FRAME_MAGIC = Object.freeze([0x4f, 0x4d, 0x49]);

export const PROTOCOL_TRANSPORTS = Object.freeze({
  "raw-binary": Object.freeze({ bit: 0, label: "raw-binary" }),
  mqtt: Object.freeze({ bit: 1, label: "mqtt" }),
  github: Object.freeze({ bit: 2, label: "github" }),
  docker: Object.freeze({ bit: 3, label: "docker" }),
  qemu: Object.freeze({ bit: 4, label: "qemu" })
});

export const DEFAULT_PROTOCOL_TRANSPORTS = Object.freeze(Object.keys(PROTOCOL_TRANSPORTS));

export const BROWSER_SURFACE_GAUGES = Object.freeze({
  DOM: Object.freeze({
    code: 0,
    surface: "DOM",
    gauge: "FS",
    controlCode: 0x1c,
    port: 0,
    role: "car",
    channel: "delta",
    authority: "runtime-object-tree"
  }),
  JSDOM: Object.freeze({
    code: 1,
    surface: "JSDOM",
    gauge: "GS",
    controlCode: 0x1d,
    port: 1,
    role: "car",
    channel: "sync",
    authority: "headless-test-mirror"
  }),
  CSSOM: Object.freeze({
    code: 2,
    surface: "CSSOM",
    gauge: "RS",
    controlCode: 0x1e,
    port: 2,
    role: "cdr",
    channel: "receipt",
    authority: "selector-media-rule-surface"
  }),
  CanvasDOM: Object.freeze({
    code: 3,
    surface: "CanvasDOM",
    gauge: "US",
    controlCode: 0x1f,
    port: 3,
    role: "cdr",
    channel: "control",
    authority: "canvas-projection-surface"
  }),
  BrowserEvent: Object.freeze({
    code: 4,
    surface: "BrowserEvent",
    gauge: "CENTROID",
    controlCode: 0x00,
    port: 4,
    role: "centroid",
    channel: "control",
    authority: "browser-standard-event-lens"
  })
});

const SURFACE_ALIASES = Object.freeze({
  browser: "BrowserEvent",
  browserevent: "BrowserEvent",
  event: "BrowserEvent",
  events: "BrowserEvent",
  canvas: "CanvasDOM",
  canvasdom: "CanvasDOM",
  dom: "DOM",
  jsdom: "JSDOM",
  cssom: "CSSOM"
});

const DEFAULT_BROWSER_PROTOCOL_ROUTES = Object.freeze([
  Object.freeze({
    id: "dom-intent-dispatch",
    surface: "DOM",
    eventType: "intent:dispatch",
    selector: "[data-omi]",
    intent: "route-dom-intentions-through-fs-storage-gauge",
    mediaQuery: "(any-pointer: fine)"
  }),
  Object.freeze({
    id: "jsdom-replay-snapshot",
    surface: "JSDOM",
    eventType: "test:replay",
    selector: "[data-omi][data-omi-centroid]",
    intent: "verify-dom-cssom-routes-without-browser-mutation",
    mediaQuery: "all"
  }),
  Object.freeze({
    id: "cssom-media-port",
    surface: "CSSOM",
    eventType: "media:change",
    selector: "@media",
    intent: "port-media-queries-through-rs-receipt-gauge",
    mediaQuery: "(prefers-reduced-motion: no-preference)"
  }),
  Object.freeze({
    id: "canvasdom-voxel-frame",
    surface: "CanvasDOM",
    eventType: "canvas:frame",
    selector: "canvas[data-omi], [data-omi-canvas]",
    intent: "project-open-world-voxels-through-us-execution-gauge",
    mediaQuery: "(dynamic-range: standard)"
  }),
  Object.freeze({
    id: "browser-component-centroid",
    surface: "BrowserEvent",
    eventType: "visibilitychange",
    selector: "document",
    intent: "resolve-browser-events-by-centroid-to-a-gauge-route",
    mediaQuery: "(update: fast)"
  })
]);

export function normalizeBrowserSurface(surface = "DOM") {
  const raw = String(surface || "DOM").trim();
  const key = raw.replace(/[\s_-]/g, "").toLowerCase();
  const canonical = SURFACE_ALIASES[key] || raw;
  if (!BROWSER_SURFACE_GAUGES[canonical]) {
    throw new RangeError(`Unsupported Tetragrammatron browser surface: ${surface}`);
  }
  return canonical;
}

export function resolveBrowserEventSurface(eventType = "") {
  const value = String(eventType || "").trim().toLowerCase();
  if (/^(test|snapshot|hydrate|jsdom|replay)[:.-]/.test(value)) return "JSDOM";
  if (/^(media|resize|style|css|animation|transition)[:.-]/.test(value) || value === "resize") return "CSSOM";
  if (/^(canvas|paint|draw|webgl|voxel|frame)[:.-]/.test(value)) return "CanvasDOM";
  if (/^(visibilitychange|pageshow|pagehide)$/.test(value)) return "CSSOM";
  return "DOM";
}

export function transportMask(transports = DEFAULT_PROTOCOL_TRANSPORTS) {
  const names = normalizeTransports(transports);
  return names.reduce((mask, name) => mask | (1 << PROTOCOL_TRANSPORTS[name].bit), 0) >>> 0;
}

export function normalizeTransports(transports = DEFAULT_PROTOCOL_TRANSPORTS) {
  const input = Array.isArray(transports) ? transports : String(transports || "").split(",");
  const names = input
    .map((name) => String(name || "").trim().toLowerCase())
    .filter(Boolean);
  const selected = names.length ? names : [...DEFAULT_PROTOCOL_TRANSPORTS];
  const unique = [...new Set(selected)];
  for (const name of unique) {
    if (!PROTOCOL_TRANSPORTS[name]) throw new RangeError(`Unsupported Tetragrammatron transport: ${name}`);
  }
  return unique.sort((a, b) => PROTOCOL_TRANSPORTS[a].bit - PROTOCOL_TRANSPORTS[b].bit);
}

export function createBrowserProtocolRoute(input = {}, options = {}) {
  const branch = normalizeBranch(input.branch || options.branch || "main");
  const requestedSurface = normalizeBrowserSurface(input.surface || options.surface || "DOM");
  const eventType = clean(input.eventType || input.event || options.eventType || "intent:dispatch");
  const resolvedSurface = requestedSurface === "BrowserEvent"
    ? resolveBrowserEventSurface(eventType)
    : requestedSurface;
  const surfaceInfo = BROWSER_SURFACE_GAUGES[resolvedSurface];
  const sourceSurfaceInfo = BROWSER_SURFACE_GAUGES[requestedSurface];
  const transports = normalizeTransports(input.transports || options.transports || DEFAULT_PROTOCOL_TRANSPORTS);
  const selector = clean(input.selector || options.selector || "[data-omi]");
  const mediaQuery = clean(input.mediaQuery || input.media || options.mediaQuery || "all");
  const intent = clean(input.intent || options.intent || "route-browser-surface-intention");
  const component = clean(input.component || options.component || "dev-portal");
  const nodeId = clean(input.nodeId || options.nodeId || "local-node");
  const routeSeed = {
    v: "tetragrammatron.browser.protocol.route.v1",
    branch,
    requestedSurface,
    resolvedSurface,
    eventType,
    selector,
    mediaQuery,
    intent,
    component,
    nodeId,
    transports
  };
  const digest = fnv1a32(stableJson(routeSeed));
  const eventHash = fnv1a32(eventType);
  const selectorHash = fnv1a32(selector);
  const mediaHash = fnv1a32(mediaQuery);
  const intentHash = fnv1a32(intent);
  const local240 = digest % 240;
  const slot5040 = digest % 5040;
  const id = clean(input.id || options.id || `${resolvedSurface.toLowerCase()}-${eventType}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""));
  const topic = formatOmiMqttTopic({ branch, channel: surfaceInfo.channel });
  const address = formatOmiAddressFromSegments([
    0x0d04,
    TETRAGRAMMATRON_PROTOCOL_MAP_VERSION,
    surfaceInfo.code,
    sourceSurfaceInfo.code,
    eventHash & 0xffff,
    selectorHash & 0xffff,
    mediaHash & 0xffff,
    digest & 0xffff
  ]);
  const route = {
    type: "tetragrammatron-browser-protocol-route",
    version: TETRAGRAMMATRON_PROTOCOL_MAP_VERSION,
    id,
    branch,
    requestedSurface,
    surface: resolvedSurface,
    sourceSurface: requestedSurface,
    gauge: surfaceInfo.gauge,
    controlCode: `0x${surfaceInfo.controlCode.toString(16).padStart(2, "0")}`,
    controlByte: surfaceInfo.controlCode,
    port: surfaceInfo.port,
    role: surfaceInfo.role,
    channel: surfaceInfo.channel,
    authority: surfaceInfo.authority,
    eventType,
    selector,
    mediaQuery,
    intent,
    component,
    nodeId,
    transports,
    transportMask: transportMask(transports),
    address,
    local240,
    slot5040,
    hashes: {
      digest,
      event: eventHash,
      selector: selectorHash,
      media: mediaHash,
      intent: intentHash
    },
    topic,
    binding: "declarative-protocol-map",
    domEventBinding: false
  };
  const binary = packBrowserProtocolRoute(route);
  return deepFreeze({
    ...route,
    binary,
    descriptors: createRouteTransportDescriptors(route, binary)
  });
}

export function encodeBrowserProtocolPayload(route) {
  const normalized = route?.binary ? { ...route, binary: undefined } : route;
  const surface = BROWSER_SURFACE_GAUGES[normalizeBrowserSurface(normalized.surface || "DOM")];
  const sourceSurface = BROWSER_SURFACE_GAUGES[normalizeBrowserSurface(normalized.sourceSurface || normalized.requestedSurface || normalized.surface || "DOM")];
  const bytes = new Uint8Array(PROTOCOL_ROUTE_PAYLOAD_BYTES);
  const view = new DataView(bytes.buffer);
  bytes[0] = PROTOCOL_FRAME_MAGIC[0];
  bytes[1] = PROTOCOL_FRAME_MAGIC[1];
  bytes[2] = PROTOCOL_FRAME_MAGIC[2];
  bytes[3] = TETRAGRAMMATRON_PROTOCOL_MAP_VERSION;
  bytes[4] = surface.code;
  bytes[5] = surface.controlCode;
  bytes[6] = Number(normalized.transportMask ?? transportMask(normalized.transports)) & 0xff;
  bytes[7] = routeFlags(normalized, sourceSurface, surface);
  view.setUint32(8, Number(normalized.hashes?.event ?? fnv1a32(normalized.eventType || "")) >>> 0, false);
  view.setUint32(12, Number(normalized.hashes?.selector ?? fnv1a32(normalized.selector || "")) >>> 0, false);
  view.setUint32(16, Number(normalized.hashes?.media ?? fnv1a32(normalized.mediaQuery || "all")) >>> 0, false);
  view.setUint32(20, Number(normalized.local240 ?? 0) >>> 0, false);
  view.setUint32(24, Number(normalized.slot5040 ?? 0) >>> 0, false);
  view.setUint32(28, Number(normalized.hashes?.digest ?? fnv1a32(stableJson(normalized))) >>> 0, false);
  return bytes;
}

export function decodeBrowserProtocolPayload(payload) {
  const bytes = toUint8Array(payload);
  if (bytes.length !== PROTOCOL_ROUTE_PAYLOAD_BYTES) {
    throw new RangeError(`Tetragrammatron protocol payload must be ${PROTOCOL_ROUTE_PAYLOAD_BYTES} bytes`);
  }
  if (bytes[0] !== PROTOCOL_FRAME_MAGIC[0] || bytes[1] !== PROTOCOL_FRAME_MAGIC[1] || bytes[2] !== PROTOCOL_FRAME_MAGIC[2]) {
    throw new TypeError("Invalid Tetragrammatron protocol payload magic");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Object.freeze({
    magic: "OMI",
    version: bytes[3],
    surfaceCode: bytes[4],
    controlByte: bytes[5],
    transportMask: bytes[6],
    flags: bytes[7],
    eventHash: view.getUint32(8, false),
    selectorHash: view.getUint32(12, false),
    mediaHash: view.getUint32(16, false),
    local240: view.getUint32(20, false),
    slot5040: view.getUint32(24, false),
    digest: view.getUint32(28, false)
  });
}

export function packBrowserProtocolRoute(route) {
  const payload = encodeBrowserProtocolPayload(route);
  const frame = encodeControlFrame(payload);
  return Object.freeze({
    payloadBytes: payload.length,
    payloadHex: bytesToHex(payload),
    frameBytes: frame.length,
    frameHex: controlFrameToHex(frame),
    receipt: receiptForBytes(frame),
    decoded: decodeBrowserProtocolPayload(payload)
  });
}

export function decodeBrowserProtocolFrame(frame) {
  const decodedFrame = decodeControlFrame(frame);
  return Object.freeze({
    ...decodedFrame,
    protocol: decodeBrowserProtocolPayload(decodedFrame.payload)
  });
}

export function createTetragrammatronProtocolMap(options = {}) {
  const branch = normalizeBranch(options.branch || "main");
  const routeInputs = options.routes || DEFAULT_BROWSER_PROTOCOL_ROUTES;
  const routes = routeInputs
    .map((route) => createBrowserProtocolRoute(route, { ...options, branch }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const routeReceipts = routes.map((route) => ({
    id: route.id,
    address: route.address,
    receipt: route.binary.receipt,
    slot5040: route.slot5040,
    local240: route.local240
  }));
  const body = {
    type: "tetragrammatron-browser-protocol-map",
    version: TETRAGRAMMATRON_PROTOCOL_MAP_VERSION,
    mode: "declarative-no-dom-listeners",
    branch,
    routeReceipts,
    topics: buildOmiMqttTopics(branch)
  };
  const signature = `omi-proto-${fnv1a32(stableJson(body)).toString(16).padStart(8, "0")}`;
  return deepFreeze({
    ...body,
    signature,
    routeCount: routes.length,
    transports: DEFAULT_PROTOCOL_TRANSPORTS,
    surfaces: BROWSER_SURFACE_GAUGES,
    routes,
    rawBinary: {
      frameBytes: routes.reduce((sum, route) => sum + route.binary.frameBytes, 0),
      receipts: routes.map((route) => route.binary.receipt)
    },
    github: {
      branch,
      statePath: `.omi/protocol/${branch.replaceAll("/", "__")}/protocol-map.json`,
      receiptsPath: `.omi/protocol/${branch.replaceAll("/", "__")}/receipts.ndjson`
    },
    docker: {
      labelPrefix: "org.omi.tetragrammatron.protocol",
      mount: "/omi/protocol"
    },
    qemu: {
      device: "virtio-serial",
      channelPrefix: "org.omi.tetragrammatron"
    }
  });
}

export function formatProtocolMapOmi(map) {
  const normalized = map || createTetragrammatronProtocolMap();
  const header = [
    "# ============================================================================",
    "# TETRAGRAMMATRON BROWSER PROTOCOL MAP",
    "# Declarative route records. DOM/JSDOM/CSSOM/Canvas/browser events are described",
    "# as replayable protocol intentions; this file does not bind DOM listeners.",
    "# ============================================================================"
  ];
  const body = normalized.routes.map((route, index) => formatProtocolRouteOmiRecord(route, index, normalized));
  return `${header.concat(body).join("\n\n")}\n`;
}

function createRouteTransportDescriptors(route, binary) {
  const routeSlug = safeSlug(route.id);
  const branchSlug = route.branch.replaceAll("/", "__");
  return Object.freeze({
    rawBinary: Object.freeze({
      frameBytes: binary.frameBytes,
      payloadBytes: binary.payloadBytes,
      receipt: binary.receipt
    }),
    mqtt: Object.freeze({
      topic: route.topic,
      qos: 1,
      retain: false,
      payload: "raw-control-frame"
    }),
    github: Object.freeze({
      branch: route.branch,
      path: `.omi/protocol/${branchSlug}/${routeSlug}.route.json`,
      receiptPath: `.omi/protocol/${branchSlug}/${routeSlug}.receipt`
    }),
    docker: Object.freeze({
      label: `org.omi.tetragrammatron.protocol.${routeSlug}`,
      mountPath: `/omi/protocol/${routeSlug}.bin`
    }),
    qemu: Object.freeze({
      device: "virtio-serial",
      channel: `org.omi.tetragrammatron.${routeSlug}`,
      payload: "raw-control-frame"
    })
  });
}

function formatProtocolRouteOmiRecord(route, index, map) {
  return [
    `${route.address}/128 SHOULD route-browser-protocol-${safeSlug(route.id)}`,
    `STATE: candidate`,
    `SURFACE: ${sanitizeLine(route.sourceSurface)}->${sanitizeLine(route.surface)}`,
    `GAUGE: ${sanitizeLine(route.gauge)} ${sanitizeLine(route.controlCode)}`,
    `EVENT: ${sanitizeLine(route.eventType)}`,
    `SELECTOR: ${sanitizeLine(route.selector)}`,
    `MEDIA: ${sanitizeLine(route.mediaQuery)}`,
    `INTENT: ${sanitizeLine(route.intent)}`,
    `TRANSPORT: ${route.transports.join(",")}`,
    `TOPIC: ${sanitizeLine(route.topic)}`,
    `RECEIPT: ${map.signature}:${index}:${route.binary.receipt}`,
    `SLIDE_RULE: slot5040=${route.slot5040} local240=${route.local240} digest=${route.hashes.digest.toString(16).padStart(8, "0")}`,
    `BOUNDARY: declarative-protocol-map-without-dom-event-listener-binding`
  ].join("\n");
}

function routeFlags(route, sourceSurface, surface) {
  let flags = 0;
  if (route.mediaQuery && route.mediaQuery !== "all") flags |= 1;
  if (route.selector && route.selector !== "*") flags |= 2;
  if (sourceSurface.surface !== surface.surface) flags |= 4;
  if (route.domEventBinding === false) flags |= 8;
  return flags & 0xff;
}

function bytesToHex(bytes) {
  return [...toUint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) return value;
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return Uint8Array.from(value);
  throw new TypeError("Expected bytes");
}

function clean(value) {
  return String(value ?? "").trim();
}

function safeSlug(value) {
  return String(value || "route").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "route";
}

function sanitizeLine(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}
