/**
 * OMI PROTOCOL: WEB PROTOCOL SERVICE WORKER ROUTER
 * Routes redirected web+omi/web+omicron payloads through the existing
 * branchless orbital lexer shape without adding a new kernel namespace.
 */

const SEGMENT_COUNT = 8;
const CHIRAL_DELIMITER = 0x03BF;
const CARDINAL_DELIMITER = 0x039F;
const S3_HIGH_MASK = 0x2B00;
const S4_HIGH_MASK = 0x2F00;
const RING_SLOTS = 5040;
const SW_CONTEXT_VERSION = "omi.sw_centroid_router.v0";

const ringBuffer = typeof SharedArrayBuffer === "function"
  ? new SharedArrayBuffer(RING_SLOTS * 8)
  : null;
const ringMemory = ringBuffer ? new BigInt64Array(ringBuffer) : null;

export function parseProtocolToken(rawToken) {
  if (typeof rawToken !== "string") return null;
  const cleanToken = rawToken.trim();
  if (!cleanToken.startsWith("omi-")) return null;

  const coreTape = cleanToken.slice(4).split("/")[0];
  const segments = coreTape.split("-");
  if (segments.length !== SEGMENT_COUNT) return null;

  const S = new Uint16Array(SEGMENT_COUNT);
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    if (!/^[0-9a-f]{4}$/i.test(segments[i])) return null;
    S[i] = parseInt(segments[i], 16);
  }
  return S;
}

export function verifyProtocolShell(S) {
  if (!S || S.length !== SEGMENT_COUNT) return false;

  const L0 = S[0] >> 8;
  const L3 = S[3] & 0x00FF;
  const L4 = S[4] & 0x00FF;
  const L7 = S[7] >> 8;

  const eVar =
    (L0 - L3) ** 2 +
    (L3 - L4) ** 2 +
    (L4 - L7) ** 2;

  const eConst =
    (S[0] & 0x00FF) ** 2 +
    (S[1] - CHIRAL_DELIMITER) ** 2 +
    ((S[3] & 0xFF00) - S3_HIGH_MASK) ** 2 +
    ((S[4] & 0xFF00) - S4_HIGH_MASK) ** 2 +
    (S[6] - CARDINAL_DELIMITER) ** 2 +
    ((S[7] & 0x00FF) - 0x00FF) ** 2;

  return eVar + eConst === 0;
}

export function routeProtocolToken(rawToken) {
  const S = parseProtocolToken(rawToken);
  if (!verifyProtocolShell(S)) {
    return { valid: false, error: "MALFORMED_OMI_PROTOCOL_REJECT" };
  }

  const lensLL = S[3] & 0x00FF;
  const antecedentNN = S[2];
  const consequentMM = S[5];
  const targetSlotIndex = lensLL % RING_SLOTS;
  const packedTruthRow = (BigInt(antecedentNN) << 16n) | BigInt(consequentMM);

  if (ringMemory) {
    Atomics.store(ringMemory, targetSlotIndex, packedTruthRow);
  }

  return {
    valid: true,
    type: "OMI_CENTROID_ROUTING_PROCESSED",
    lensLL,
    antecedentNN,
    consequentMM,
    targetSlotIndex,
    packedTruthRow
  };
}

export function protocolResponseForUrl(urlLike) {
  const requestUrl = new URL(urlLike);
  const rawOmiToken =
    requestUrl.searchParams.get("chronometer") ??
    requestUrl.searchParams.get("chronograph");

  if (!rawOmiToken) return null;
  return routeProtocolToken(rawOmiToken);
}

function responseFromRoute(route) {
  if (route?.valid) {
    return new Response("COMPLIANT_OISC_PROTOCOL_ROW_INITIALIZED", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp"
      }
    });
  }
  return new Response("MALFORMED_OMI_PROTOCOL_REJECT", { status: 400 });
}

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("install", () => {
    self.skipWaiting();
    console.log(`[Omi SW Router] Service Worker installed: ${SW_CONTEXT_VERSION}`);
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
    console.log("[Omi SW Router] Centroid mesh claimed client channels.");
  });

  self.addEventListener("fetch", (event) => {
    const route = protocolResponseForUrl(event.request.url);
    if (!route) return;

    if (route.valid) {
      event.waitUntil(
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: route.type,
              lensLL: route.lensLL,
              antecedentNN: route.antecedentNN,
              consequentMM: route.consequentMM,
              targetSlotIndex: route.targetSlotIndex
            });
          });
        })
      );
    }

    event.respondWith(responseFromRoute(route));
  });
}
