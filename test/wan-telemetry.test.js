import { test, mock } from "node:test";
import { strict as assert } from "node:assert";
import { WanTelemetryLoop, DEFAULT_CONFIG } from "../src/wan/wan-telemetry-loop.js";

function makeMockProbe(results = {}) {
  return async () => ({
    ping: { lossPct: 0, rttMin: 5, rttAvg: 7, rttMax: 10, rttMdev: 1 },
    health: { ok: true, statusCode: 200, rttMs: 12 },
    verify: { ok: true, statusCode: 200, rttMs: 15, response: "COMPLIANT" },
    ...results,
  });
}

function makeFailingMockProbe() {
  return async () => {
    throw new Error("mock network failure");
  };
}

test("WanTelemetryLoop initializes with default config", () => {
  const loop = new WanTelemetryLoop();
  assert.equal(loop.config.edgeIp, DEFAULT_CONFIG.edgeIp);
  assert.equal(loop.config.edgePort, DEFAULT_CONFIG.edgePort);
  assert.equal(loop.config.tunnelIp, DEFAULT_CONFIG.tunnelIp);
  assert.equal(loop.config.probeIntervalMs, DEFAULT_CONFIG.probeIntervalMs);
  assert.equal(loop.historyCount, 0);
  assert.equal(loop.uptime, 0);
  assert.equal(loop.lastProbe, null);
  assert.equal(loop.isRunning, false);
  assert.equal(loop.sseClientCount, 0);
});

test("WanTelemetryLoop accepts custom config", () => {
  const loop = new WanTelemetryLoop({
    edgeIp: "10.0.0.1",
    probeIntervalMs: 10000,
    maxHistory: 100,
  });
  assert.equal(loop.config.edgeIp, "10.0.0.1");
  assert.equal(loop.config.probeIntervalMs, 10000);
  assert.equal(loop.config.maxHistory, 100);
});

test("runProbeCycle with mock probe stores result and broadcasts", async () => {
  const loop = new WanTelemetryLoop({
    probeFn: makeMockProbe(),
    probeIntervalMs: 60000,
  });

  let broadcastData = null;
  const origBroadcast = loop.broadcast.bind(loop);
  loop.broadcast = (eventType, data) => {
    broadcastData = data;
    origBroadcast(eventType, data);
  };

  const probe = await loop.runProbeCycle();

  assert.equal(loop.historyCount, 1);
  assert.ok(probe.ts > 0);
  assert.equal(probe.ping.lossPct, 0);
  assert.equal(probe.ping.rttAvg, 7);
  assert.equal(probe.health.ok, true);
  assert.equal(probe.health.rttMs, 12);
  assert.equal(probe.verify.ok, true);
  assert.equal(probe.verify.response, "COMPLIANT");
  assert.equal(probe.error, null);
  assert.ok(probe.cycleMs >= 0);

  assert.ok(broadcastData !== null);
  assert.equal(broadcastData.edgeOk, true);
  assert.equal(broadcastData.verifyOk, true);
  assert.equal(broadcastData.pingLoss, 0);
  assert.equal(broadcastData.uptime, 1);
  assert.equal(broadcastData.probeCount, 1);
});

test("runProbeCycle with failing probe captures error gracefully", async () => {
  const loop = new WanTelemetryLoop({
    probeFn: makeFailingMockProbe(),
    probeIntervalMs: 60000,
  });

  const probe = await loop.runProbeCycle();
  assert.equal(loop.historyCount, 1);
  assert.equal(probe.health.ok, false);
  assert.equal(probe.verify.ok, false);
  assert.equal(probe.error, "mock network failure");
  assert.equal(loop.uptime, 0);
});

test("history is bounded by maxHistory", async () => {
  const loop = new WanTelemetryLoop({
    probeFn: makeMockProbe(),
    probeIntervalMs: 60000,
    maxHistory: 3,
  });

  for (let i = 0; i < 5; i++) {
    await loop.runProbeCycle();
  }

  assert.equal(loop.historyCount, 3);
});

test("start/stop lifecycle controls the loop", async () => {
  const mockProbeFn = mock.fn(makeMockProbe());
  const loop = new WanTelemetryLoop({
    probeFn: mockProbeFn,
    probeIntervalMs: 5000,
  });

  assert.equal(loop.isRunning, false);
  const started = loop.start();
  assert.equal(started, true);
  assert.equal(loop.isRunning, true);

  await new Promise(r => setTimeout(r, 100));

  assert.equal(mockProbeFn.mock.callCount(), 1);

  const stopped = loop.stop();
  assert.equal(stopped, true);
  assert.equal(loop.isRunning, false);

  const restarted = loop.start();
  assert.equal(restarted, true);

  await new Promise(r => setTimeout(r, 50));
  loop.stop();
});

test("start is idempotent", () => {
  const loop = new WanTelemetryLoop({ probeFn: makeMockProbe(), probeIntervalMs: 60000 });
  assert.equal(loop.start(), true);
  assert.equal(loop.start(), false);
  assert.equal(loop.isRunning, true);
  loop.stop();
});

test("reset clears history and clients", () => {
  const loop = new WanTelemetryLoop({ probeFn: makeMockProbe(), probeIntervalMs: 60000 });
  loop.addSseClient({ on: () => {} });
  assert.equal(loop.sseClientCount, 1);

  loop.reset();
  assert.equal(loop.historyCount, 0);
  assert.equal(loop.sseClientCount, 0);
  assert.equal(loop.isRunning, false);
});

test("addSseClient registers and returns remove function", () => {
  const loop = new WanTelemetryLoop({ probeFn: makeMockProbe() });
  let closed = false;
  const fakeRes = {
    on(event, fn) {
      if (event === "close") closed = true;
    },
  };
  const remove = loop.addSseClient(fakeRes);
  assert.equal(loop.sseClientCount, 1);

  remove();
  assert.equal(loop.sseClientCount, 0);
});

test("broadcast sends formatted SSE to all clients", () => {
  const loop = new WanTelemetryLoop({ probeFn: makeMockProbe() });
  const writes = [];
  function makeClient(id) {
    return { write: (d) => writes.push({ client: id, data: d }), on: () => {} };
  }

  loop.addSseClient(makeClient(1));
  loop.addSseClient(makeClient(2));

  loop.broadcast("test-event", { key: "value" });

  assert.equal(writes.length, 2);
  for (const w of writes) {
    assert.match(w.data, /^event: test-event\ndata: {"key":"value"}\n\n$/);
  }
});

test("broadcast skips dead clients without throwing", () => {
  const loop = new WanTelemetryLoop({ probeFn: makeMockProbe() });
  const deadClient = {
    write() { throw new Error("write after close"); },
    on: () => {},
  };
  loop.addSseClient(deadClient);
  loop.addSseClient({ write: () => {}, on: () => {} });

  assert.doesNotThrow(() => loop.broadcast("test", {}));
});

test("uptime calculation across multiple probes", async () => {
  let failNext = false;
  const loop = new WanTelemetryLoop({
    probeFn: async () => {
      if (failNext) throw new Error("fail");
      return {
        ping: { lossPct: 0, rttMin: 5, rttAvg: 7, rttMax: 10, rttMdev: 1 },
        health: { ok: true, statusCode: 200, rttMs: 12 },
        verify: { ok: true, statusCode: 200, rttMs: 15, response: "OK" },
      };
    },
    probeIntervalMs: 60000,
  });

  await loop.runProbeCycle();
  assert.equal(loop.uptime, 1);

  await loop.runProbeCycle();
  assert.equal(loop.uptime, 1);

  failNext = true;
  await loop.runProbeCycle();
  assert.equal(loop.uptime, 2 / 3);
});

test("default config is frozen", () => {
  assert.throws(() => {
    DEFAULT_CONFIG.edgeIp = "changed";
  }, /read only property|Cannot assign/);
  assert.equal(DEFAULT_CONFIG.edgeIp, "69.48.202.32");
});
