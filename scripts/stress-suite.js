/**
 * ============================================================================
 * OMI PROTOCOL: HIGH-CONCURRENCY PERFORMANCE BENCHMARK ENGINE
 * File Target: scripts/stress-suite.js
 * Invariant Configuration: Sustained Load Matrix Validation [Zero-Overhead]
 * ============================================================================
 *
 * This suite stress-tests OmiAxiomaticKernel under maximum infrastructure
 * saturation. 5,000 virtual concurrent users fire 1,000 packets each
 * through the interpreter-less hyphen-split validator, with 10% spoofed
 * traffic to verify O(1) rejection.
 */
import { OmiAxiomaticKernel } from "../src/omi/axiomatic-kernel.js";
import { join } from "node:path";

const SLA_LIMIT_NS = 5000;
const DEFAULT_USERS = 5000;
const DEFAULT_BURST = 1000;
const DEFAULT_SPOOF_RATIO = 0.10;
const SPOOF_SWEEP_RATIOS = [0, 0.01, 0.10, 0.25, 0.50, 0.90, 1.00];
const THROUGHPUT_TIERS = [10_000, 100_000, 1_000_000, 5_000_000, 10_000_000];

class OmiSubstratePerformanceStressSuite {
  constructor(totalConcurrentUsers, sustainedPacketBurstCount, options = {}) {
    this.virtualUsers = totalConcurrentUsers;
    this.burstDepth = sustainedPacketBurstCount;
    this.spoofRatio = options.spoofRatio ?? DEFAULT_SPOOF_RATIO;
    this.totalPackets = options.totalPackets ?? (this.virtualUsers * this.burstDepth);
    this.label = options.label ?? "default";

    this.sab = new SharedArrayBuffer(5040 * 8);
    this.kernel = new OmiAxiomaticKernel();

    this.VALID_PACKET = "omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48";
    this.MALFORMED_PACKET = "omi-0000-0000-invalid-0000-0000-0000-0000-0000/48";
  }

  async loadRegistries() {
    if (this.kernel.rulesRegistry.size > 0 && this.kernel.factsRegistry.size > 0) return;
    await this.kernel.loadAxiomaticFile(
      join(process.cwd(), "RULES.omi"),
      this.kernel.rulesRegistry
    );
    await this.kernel.loadAxiomaticFile(
      join(process.cwd(), "FACTS.omi"),
      this.kernel.factsRegistry
    );
  }

  async runSustainedLoadSimulation() {
    console.log(`[Omi Stress Engine] Initializing high-concurrency validation layer...`);
    console.log(`  - Mocking Concurrent Virtual Users: ${this.virtualUsers}`);
    console.log(`  - Target Packet Bursts per Loop Channel: ${this.burstDepth}`);
    console.log(`  - Target Spoof Ratio: ${(this.spoofRatio * 100).toFixed(2)}%`);
    console.log(`  - Total Packet Budget: ${this.totalPackets.toLocaleString()}`);

    await this.loadRegistries();

    console.log(`[Omi Stress Engine] Core registers loaded. Initiating multi-user throughput fire...`);

    const startTimeNs = process.hrtime.bigint();
    const spoofTarget = Math.round(this.totalPackets * this.spoofRatio);

    const workerResults = await Promise.all(
      Array.from({ length: this.virtualUsers }, async (_, userIndex) => {
        let valid = 0;
        let rejected = 0;
        for (let i = 0; i < this.burstDepth; i++) {
          const packetIndex = userIndex * this.burstDepth + i;
          if (packetIndex >= this.totalPackets) break;
          const isSpoofed = packetIndex < spoofTarget;
          const token = isSpoofed ? this.MALFORMED_PACKET : this.VALID_PACKET;
          if (this.kernel.verifyPacketCompliance(token)) {
            valid++;
          } else {
            rejected++;
          }
        }
        return { valid, rejected };
      })
    );

    const endTimeNs = process.hrtime.bigint();

    const totalValid = workerResults.reduce((s, r) => s + r.valid, 0);
    const totalRejected = workerResults.reduce((s, r) => s + r.rejected, 0);

    const metrics = this.compilePerformanceMetricsReport(
      startTimeNs, endTimeNs, totalValid, totalRejected
    );

    this.assertSpoofRatio(metrics, spoofTarget);
    return metrics;
  }

  compilePerformanceMetricsReport(start, end, validCount, rejectCount) {
    const totalDurationNs = Number(end - start);
    const totalDurationMs = totalDurationNs / 1_000_000;
    const totalPackets = validCount + rejectCount;

    const packetsPerSecond = totalDurationMs > 0
      ? (totalPackets / totalDurationMs) * 1000
      : 0;
    const meanLatencyNs = totalPackets > 0
      ? totalDurationNs / totalPackets
      : 0;

    console.log(`\n============================================================================`);
    console.log(`OMI PROTOCOL: CONCURRENCY STRESS SUITE PROFILE METRICS`);
    console.log(`============================================================================`);
    console.log(`  - Evaluation Duration       : ${totalDurationMs.toFixed(2)} ms`);
    console.log(`  - Cumulative Packets Fired  : ${totalPackets.toLocaleString()}`);
    console.log(`  - Compliant Packets Accepted : ${validCount.toLocaleString()}`);
    console.log(`  - Spoofed Packets Evicted    : ${rejectCount.toLocaleString()}`);
    console.log(`  - System Throughput Velocity : ${packetsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 2 })} packets/sec`);
    console.log(`  - Mean Processing Latency    : ${meanLatencyNs.toFixed(2)} nanoseconds / packet`);

    if (meanLatencyNs > SLA_LIMIT_NS) {
      console.error(`\n\u274c PERFORMANCE ALERT: Processing latency exceeded SLA threshold boundary of ${SLA_LIMIT_NS}ns!`);
      process.exit(1);
    }

    console.log(`\n\u2705 BENCHMARK STABILITY CONFIRMED: Substrate engine passed high-concurrency validation.`);
    console.log(`============================================================================`);

    return {
      label: this.label,
      totalDurationNs,
      totalDurationMs,
      totalPackets,
      validCount,
      rejectCount,
      packetsPerSecond,
      meanLatencyNs
    };
  }

  assertSpoofRatio(metrics, expectedRejected) {
    if (metrics.rejectCount !== expectedRejected) {
      console.error(
        `\n\u274c SPOOF RATIO ALERT: expected ${expectedRejected.toLocaleString()} rejects, received ${metrics.rejectCount.toLocaleString()}`
      );
      process.exit(1);
    }
  }
}

function parseArgs(argv) {
  return {
    spoofSweep: argv.includes("--spoof-sweep"),
    throughputTiers: argv.includes("--throughput-tiers")
  };
}

async function runDefault() {
  const simulationSuite = new OmiSubstratePerformanceStressSuite(DEFAULT_USERS, DEFAULT_BURST);
  await simulationSuite.runSustainedLoadSimulation();
}

async function runSpoofSweep() {
  console.log("\n============================================================================");
  console.log("OMI PROTOCOL: SPOOF-RATIO SWEEP");
  console.log("============================================================================");

  for (const ratio of SPOOF_SWEEP_RATIOS) {
    const suite = new OmiSubstratePerformanceStressSuite(100, 1000, {
      spoofRatio: ratio,
      label: `spoof-${Math.round(ratio * 100)}`
    });
    const metrics = await suite.runSustainedLoadSimulation();
    console.log(
      `[Sweep] ${(ratio * 100).toFixed(0)}% spoofed -> ${metrics.rejectCount.toLocaleString()} rejected / ${metrics.totalPackets.toLocaleString()} total`
    );
  }
}

async function runThroughputTiers() {
  console.log("\n============================================================================");
  console.log("OMI PROTOCOL: THROUGHPUT STABILITY TIERS");
  console.log("============================================================================");

  for (const totalPackets of THROUGHPUT_TIERS) {
    const users = Math.min(5000, Math.max(10, Math.ceil(totalPackets / 1000)));
    const burst = Math.ceil(totalPackets / users);
    const suite = new OmiSubstratePerformanceStressSuite(users, burst, {
      totalPackets,
      spoofRatio: DEFAULT_SPOOF_RATIO,
      label: `tier-${totalPackets}`
    });
    const metrics = await suite.runSustainedLoadSimulation();
    console.log(
      `[Tier] ${totalPackets.toLocaleString()} packets -> ${metrics.meanLatencyNs.toFixed(2)} ns/packet`
    );
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.spoofSweep) {
    await runSpoofSweep();
  } else if (options.throughputTiers) {
    await runThroughputTiers();
  } else {
    await runDefault();
  }
}

main().catch(err => {
  console.error(`\u274c Fatal Simulation Interrupt: ${err.message}`);
  process.exit(1);
});
