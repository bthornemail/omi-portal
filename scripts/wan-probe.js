#!/usr/bin/env node
import http from "node:http";
import net from "node:net";
import { WAN_NODE_CONFIG, createDefaultProbeToken } from "./wan-sync.js";

function connectProbe(host, port, family, timeoutMs) {
  const start = process.hrtime.bigint();
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port, family, timeout: timeoutMs });
    const finish = (ok, error = null) => {
      const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      socket.destroy();
      resolve({ ok, host, port, family, latencyMs, error });
    };
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false, "timeout"));
    socket.once("error", err => finish(false, err.code ?? err.message));
  });
}

function postVerify(host, port, family, token, timeoutMs) {
  const start = process.hrtime.bigint();
  return new Promise(resolve => {
    const req = http.request({
      host,
      port,
      family,
      method: "POST",
      path: "/verify-packet",
      timeout: timeoutMs,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": Buffer.byteLength(token)
      }
    }, res => {
      res.resume();
      res.on("end", () => {
        const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        resolve({ ok: res.statusCode === 200, statusCode: res.statusCode, host, port, family, latencyMs });
      });
    });
    req.once("timeout", () => {
      req.destroy();
      resolve({ ok: false, host, port, family, latencyMs: timeoutMs, error: "timeout" });
    });
    req.once("error", err => {
      const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      resolve({ ok: false, host, port, family, latencyMs, error: err.code ?? err.message });
    });
    req.end(token);
  });
}

function parseArgs(argv) {
  const get = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  return {
    port: Number(get("--port", process.env.OMI_WAN_PORT ?? 8080)),
    timeoutMs: Number(get("--timeout-ms", 2500)),
    verify: argv.includes("--verify"),
    token: get("--token", createDefaultProbeToken()),
    invalidToken: get("--invalid-token", "omi-0000-0000-invalid-0000-0000-0000-0000-0000/48")
  };
}

function printResult(label, result) {
  const state = result.ok ? "PASS" : "MISS";
  const detail = result.statusCode ? ` status=${result.statusCode}` : result.error ? ` error=${result.error}` : "";
  console.log(`${state} ${label} ${result.host}:${result.port} family=${result.family} latency=${result.latencyMs.toFixed(2)}ms${detail}`);
}

function printVerifyPair(label, validResult, invalidResult) {
  printResult(`${label} valid`, validResult);
  const invalidOk = invalidResult.statusCode === 400;
  printResult(`${label} invalid-reject`, { ...invalidResult, ok: invalidOk });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  for (const [name, node] of Object.entries(WAN_NODE_CONFIG)) {
    console.log(`\n[WAN Probe] ${name} ${node.omiAddress}`);
    const probes = [
      ["IPv4 TCP", connectProbe(node.ip4, options.port, 4, options.timeoutMs)],
      ["IPv6 TCP", connectProbe(node.ip6, options.port, 6, options.timeoutMs)]
    ];
    for (const [label, promise] of probes) {
      printResult(label, await promise);
    }
    if (options.verify) {
      const ipv4Valid = await postVerify(node.ip4, options.port, 4, options.token, options.timeoutMs);
      const ipv4Invalid = await postVerify(node.ip4, options.port, 4, options.invalidToken, options.timeoutMs);
      printVerifyPair("IPv4 /verify-packet", ipv4Valid, ipv4Invalid);

      const ipv6Valid = await postVerify(node.ip6, options.port, 6, options.token, options.timeoutMs);
      const ipv6Invalid = await postVerify(node.ip6, options.port, 6, options.invalidToken, options.timeoutMs);
      printVerifyPair("IPv6 /verify-packet", ipv6Valid, ipv6Invalid);
    }
  }
}

main().catch(err => {
  console.error(`[WAN Probe] ${err.message}`);
  process.exit(1);
});
