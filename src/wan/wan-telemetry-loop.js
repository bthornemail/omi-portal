export const DEFAULT_CONFIG = Object.freeze({
  edgeIp: "69.48.202.32",
  edgePort: 8080,
  tunnelIp: "74.208.190.29",
  probeIntervalMs: 5000,
  pingCount: 3,
  maxHistory: 360,
  topologyRefreshMs: 60000,
  probeTimeoutMs: 5000,
  genesisToken: "omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48",
});

export class WanTelemetryLoop {
  #config;
  #probeFn;
  #sseClients;
  #probeHistory;
  #intervalHandle;
  #running;

  constructor(options = {}) {
    this.#config = { ...DEFAULT_CONFIG, ...options };
    this.#probeFn = options.probeFn ?? null;
    this.#sseClients = [];
    this.#probeHistory = [];
    this.#intervalHandle = null;
    this.#running = false;
  }

  get config() { return { ...this.#config }; }
  get history() { return [...this.#probeHistory]; }
  get historyCount() { return this.#probeHistory.length; }
  get sseClients() { return this.#sseClients; }
  get sseClientCount() { return this.#sseClients.length; }

  get uptime() {
    if (this.#probeHistory.length === 0) return 0;
    return this.#probeHistory.filter(p => p.health?.ok).length / this.#probeHistory.length;
  }

  get lastProbe() {
    return this.#probeHistory[this.#probeHistory.length - 1] ?? null;
  }

  get isRunning() { return this.#running; }

  addSseClient(res) {
    this.#sseClients.push(res);
    const remove = () => {
      this.#sseClients = this.#sseClients.filter(c => c !== res);
    };
    res.on("close", remove);
    return remove;
  }

  broadcast(eventType, data) {
    const raw = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.#sseClients) {
      try { res.write(raw); } catch { /* skip dead client */ }
    }
  }

  async runProbeCycle() {
    const cycleStart = Date.now();
    const { edgeIp, edgePort, pingCount, probeTimeoutMs } = this.#config;

    let pingResult;
    let healthResult;
    let verifyResult;
    let cycleError = null;

    try {
      if (this.#probeFn) {
        const results = await this.#probeFn({
          edgeIp, edgePort, pingCount, timeoutMs: probeTimeoutMs,
        });
        pingResult = results.ping ?? { lossPct: 100, rttMin: 0, rttAvg: 0, rttMax: 0, rttMdev: 0 };
        healthResult = results.health ?? { ok: false, statusCode: 0, rttMs: 0 };
        verifyResult = results.verify ?? { ok: false, statusCode: 0, rttMs: 0, response: "" };
      }
    } catch (err) {
      cycleError = err.message ?? String(err);
      pingResult = { lossPct: 100, rttMin: 0, rttAvg: 0, rttMax: 0, rttMdev: 0 };
      healthResult = { ok: false, statusCode: 0, rttMs: 0 };
      verifyResult = { ok: false, statusCode: 0, rttMs: 0, response: cycleError };
    }

    const probe = {
      ts: cycleStart,
      ping: pingResult,
      health: healthResult,
      verify: verifyResult,
      cycleMs: Date.now() - cycleStart,
      error: cycleError,
    };

    this.#probeHistory.push(probe);
    if (this.#probeHistory.length > this.#config.maxHistory) {
      this.#probeHistory.shift();
    }

    const eventData = {
      ts: cycleStart,
      rttMs: healthResult.rttMs,
      verifyMs: verifyResult.rttMs,
      pingAvg: pingResult.rttAvg,
      pingLoss: pingResult.lossPct,
      edgeOk: healthResult.ok,
      verifyOk: verifyResult.ok,
      cycleMs: probe.cycleMs,
      uptime: this.uptime,
      sseClients: this.#sseClients.length,
      probeCount: this.#probeHistory.length,
    };

    this.broadcast("wan-latency", eventData);
    return probe;
  }

  start() {
    if (this.#running) return false;
    this.#running = true;
    const tick = async () => {
      if (!this.#running) return;
      await this.runProbeCycle();
      if (this.#running) {
        this.#intervalHandle = setTimeout(tick, this.#config.probeIntervalMs);
      }
    };
    tick();
    return true;
  }

  stop() {
    this.#running = false;
    if (this.#intervalHandle) {
      clearTimeout(this.#intervalHandle);
      this.#intervalHandle = null;
    }
    return true;
  }

  reset() {
    this.stop();
    this.#probeHistory = [];
    this.#sseClients = [];
  }
}
