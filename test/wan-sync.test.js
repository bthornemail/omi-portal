import { test } from "node:test";
import { strict as assert } from "node:assert";
import { request } from "node:http";
import { readFile } from "node:fs/promises";
import { OmiAxiomaticKernel } from "../src/omi/axiomatic-kernel.js";
import { OmiCrossInternetSyncDaemon, WAN_NODE_CONFIG } from "../scripts/wan-sync.js";

function httpRequest(server, options, body = "") {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port, ...options }, res => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.once("error", reject);
    req.end(body);
  });
}

test("WAN FACTS register live edge and tunnel /80 mappings", async () => {
  const kernel = new OmiAxiomaticKernel();
  await kernel.loadAxiomaticFile("FACTS.omi", kernel.factsRegistry);

  const edgeFacts = kernel.queryFactsBySegment(0, 0x2607);
  assert.ok(edgeFacts.some(row => row.assignment === WAN_NODE_CONFIG.edge.fact));
  assert.ok(edgeFacts.some(row => row.assignment === WAN_NODE_CONFIG.tunnel.fact));
});

test("WAN daemon verifies compliant packets and rejects malformed packets", async () => {
  const daemon = new OmiCrossInternetSyncDaemon({ role: "edge" });
  const server = daemon.createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

  try {
    const valid = await httpRequest(
      server,
      { method: "POST", path: "/verify-packet", headers: { "Content-Type": "text/plain" } },
      "omi-039f-0002-0000-000f-02d0-0036-0000-0000/48"
    );
    assert.equal(valid.statusCode, 200);
    assert.equal(valid.body, "COMPLIANT_SUBSTRATE_TOKEN_ACCEPTED");

    const invalid = await httpRequest(
      server,
      { method: "POST", path: "/verify-packet", headers: { "Content-Type": "text/plain" } },
      "omi-0000-0000-invalid-0000-0000-0000-0000-0000/48"
    );
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.body, "EVICTION_FAULT_DISMISSED");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("WAN daemon exposes topology and COOP/COEP headers", async () => {
  const daemon = new OmiCrossInternetSyncDaemon({ role: "tunnel" });
  const server = daemon.createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

  try {
    const response = await httpRequest(server, { method: "GET", path: "/topology" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cross-origin-opener-policy"], "same-origin");
    assert.equal(response.headers["cross-origin-embedder-policy"], "require-corp");

    const topology = JSON.parse(response.body);
    assert.equal(topology.node.omiAddress, WAN_NODE_CONFIG.tunnel.omiAddress);
    assert.equal(topology.peer.omiAddress, WAN_NODE_CONFIG.edge.omiAddress);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test("WAN CSS selectors remain id-based for public subnet projections", async () => {
  const css = await readFile("public/bidi.css", "utf8");
  assert.match(css, /\[id\*="omi-2607-f1c0-f062-e900-"\]/);
  assert.match(css, /\[id\*="omi-2607-f1c0-f0b7-df00-"\]/);
  assert.doesNotMatch(css, /\[data-omi(?:-[^\]]*)?\*="omi-2607/);
});
