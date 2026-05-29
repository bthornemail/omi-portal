#!/usr/bin/env node
import http from "node:http";
import { OmiAxiomaticKernel } from "../src/omi/axiomatic-kernel.js";

export const WAN_NODE_CONFIG = Object.freeze({
  edge: Object.freeze({
    role: "EDGE_NODE",
    fact: "remote-node-EDGE-VM",
    ip4: "69.48.202.32",
    ip6: "2607:f1c0:f062:e900::1",
    subnet: "2607:f1c0:f062:e900::/80",
    omiAddress: "omi-2607-f1c0-f062-e900-0000-0000-0000-0001/80"
  }),
  tunnel: Object.freeze({
    role: "TUNNEL_CORE",
    fact: "remote-node-TUNNEL-VM",
    ip4: "74.208.190.29",
    ip6: "2607:f1c0:f0b7:df00::1",
    subnet: "2607:f1c0:f0b7:df00::/80",
    omiAddress: "omi-2607-f1c0-f0b7-df00-0000-0000-0000-0001/80"
  })
});

const DEFAULT_VALID_PACKET = "omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48";

function text(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

export class OmiCrossInternetSyncDaemon {
  constructor(options = {}) {
    const roleName = options.role ?? process.env.OMI_NODE_ROLE ?? "edge";
    if (!WAN_NODE_CONFIG[roleName]) {
      throw new Error(`Unknown OMI_NODE_ROLE: ${roleName}`);
    }

    this.nodeKey = roleName;
    this.node = WAN_NODE_CONFIG[roleName];
    this.peer = roleName === "tunnel" ? WAN_NODE_CONFIG.edge : WAN_NODE_CONFIG.tunnel;
    this.kernel = options.kernel ?? new OmiAxiomaticKernel();
    this.sab = options.sab ?? new SharedArrayBuffer(5040 * 8);
    this.floatArray = new Float64Array(this.sab);
    this.server = null;
  }

  createServer() {
    return http.createServer((req, res) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (req.method === "GET" && req.url === "/healthz") {
        return text(res, 200, `${this.node.role}:OK`);
      }

      if (req.method === "GET" && req.url === "/topology") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify({ node: this.node, peer: this.peer }));
      }

      if (req.method === "GET" && req.url === "/omi-stream") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });
        res.write(`event: omi-ready\ndata: ${this.node.omiAddress}\n\n`);
        return;
      }

      if (req.method === "POST" && req.url === "/verify-packet") {
        let body = "";
        req.setEncoding("utf8");
        req.on("data", chunk => {
          body += chunk;
          if (body.length > 4096) req.destroy();
        });
        req.on("end", () => {
          const incomingToken = body.trim();
          const isCompliant = this.kernel.verifyPacketCompliance(incomingToken);
          return text(
            res,
            isCompliant ? 200 : 400,
            isCompliant ? "COMPLIANT_SUBSTRATE_TOKEN_ACCEPTED" : "EVICTION_FAULT_DISMISSED"
          );
        });
        return;
      }

      return text(res, 404, "OMI_WAN_ROUTE_NOT_FOUND");
    });
  }

  async loadRegistries() {
    if (this.kernel.rulesRegistry.size === 0) {
      await this.kernel.loadAxiomaticFile("RULES.omi", this.kernel.rulesRegistry);
    }
    if (this.kernel.factsRegistry.size === 0) {
      await this.kernel.loadAxiomaticFile("FACTS.omi", this.kernel.factsRegistry);
    }
  }

  start(options = {}) {
    const host = options.host ?? process.env.OMI_BIND_HOST ?? "0.0.0.0";
    const port = Number(options.port ?? process.env.OMI_WAN_PORT ?? 8080);

    return new Promise(async (resolve, reject) => {
      try {
        await this.loadRegistries();
      } catch (err) {
        reject(err);
        return;
      }
      this.server = this.createServer();
      this.server.once("error", reject);
      this.server.listen(port, host, () => {
        const address = this.server.address();
        console.log("============================================================================");
        console.log("OMI PROTOCOL: INTERNET WAN DAEMON ENGINE RUNNING");
        console.log("============================================================================");
        console.log(`  - Operational Node Role : ${this.node.role}`);
        console.log(`  - OMI Node Address      : ${this.node.omiAddress}`);
        console.log(`  - IPv4 Boundary         : ${this.node.ip4}:${port}`);
        console.log(`  - IPv6 Boundary         : [${this.node.ip6}]:${port}`);
        console.log(`  - Listening Socket      : ${address.address}:${address.port}`);
        console.log("============================================================================");
        resolve(this.server);
      });
    });
  }

  stop() {
    if (!this.server) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.server.close(err => err ? reject(err) : resolve());
    });
  }
}

export function createDefaultProbeToken() {
  return DEFAULT_VALID_PACKET;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const instance = new OmiCrossInternetSyncDaemon();
  instance.start().catch(err => {
    console.error(`[WAN Daemon] ${err.message}`);
    process.exit(1);
  });
}
