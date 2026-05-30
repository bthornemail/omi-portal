import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import {
  parseProtocolToken,
  protocolResponseForUrl,
  routeProtocolToken,
  verifyProtocolShell
} from "../public/sw-router.js";

test("Web Proxy: unescaped web+omi URL queries map accurately to valid uint16 segments", () => {
  const requestUrlQueryParam = "0500-03bf-000c-2b05-2f05-0002-039f-05ff";
  const S = parseProtocolToken(`omi-${requestUrlQueryParam}/48`);

  assert.ok(S);
  assert.equal(S[0], 0x0500);
  assert.equal(S[2], 0x000c);
  assert.equal(S[5], 0x0002);
  assert.equal(verifyProtocolShell(S), true);
});

test("Web Proxy: malformed custom protocol URLs generate errors and drop execution instantly", () => {
  const badUrlQueryParam = "0500-03bf-000c-2b05-2f06-0002-039f-05ff";
  const route = routeProtocolToken(`omi-${badUrlQueryParam}/48`);

  assert.equal(route.valid, false);
  assert.equal(route.error, "MALFORMED_OMI_PROTOCOL_REJECT");
});

test("Web Proxy: chronograph and chronometer query slots route through the same gate", () => {
  const token = "omi-0500-03bf-000c-2b05-2f05-0002-039f-05ff/48";
  const chronograph = protocolResponseForUrl(`https://127.0.0.1/bidi.html?chronograph=${encodeURIComponent(token)}`);
  const chronometer = protocolResponseForUrl(`https://127.0.0.1/bidi.html?chronometer=${encodeURIComponent(token)}`);

  assert.equal(chronograph.valid, true);
  assert.equal(chronometer.valid, true);
  assert.equal(chronograph.targetSlotIndex, 5);
  assert.equal(chronometer.packedTruthRow, (0x000cn << 16n) | 0x0002n);
});

test("Web Proxy: RULES.omi declares browser protocol and service worker mesh anchors", async () => {
  const rules = await readFile(new URL("../RULES.omi", import.meta.url), "utf8");

  assert.match(rules, /register-browser-protocol-handlers/);
  assert.match(rules, /spawn-service-worker-centroid-mesh/);
  assert.match(rules, /map-pascal-pyramid-address-space/);
});
