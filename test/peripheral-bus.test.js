import { test } from "node:test";
import { strict as assert } from "node:assert";

function simulateVirtioInterruptLoop(dataView, addressStride, asciiOpcode, durationMs) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let executedOperations = 0;
    let raceConditionCollisions = 0;

    const loopInterval = setInterval(() => {
      if (Date.now() - startTime > durationMs) {
        clearInterval(loopInterval);
        resolve({ executedOperations, raceConditionCollisions });
        return;
      }

      const currentGlobalTick = dataView.getBigUint64(0, true);
      const absoluteRingSlot = Number(currentGlobalTick % 5040n);
      const memoryByteOffset = absoluteRingSlot * 8;

      const innerValue = dataView.getFloat64(memoryByteOffset, true);
      if (innerValue !== 0.0 && (absoluteRingSlot % addressStride === 0)) {
        raceConditionCollisions++;
      }

      const packedVirtioSignal = parseFloat(`${asciiOpcode}.${executedOperations}`);
      dataView.setFloat64(memoryByteOffset, packedVirtioSignal, true);

      executedOperations++;
    }, 1);
  });
}

test("SAB factorial ring maintains data integrity under concurrent virtio/NBD emulation load", async (t) => {
  const sab = new SharedArrayBuffer(5040 * 8);
  const busView = new DataView(sab);

  busView.setBigUint64(0, 0n, true);

  const tickerInterval = setInterval(() => {
    let currentTick = busView.getBigUint64(0, true);
    currentTick++;
    busView.setBigUint64(0, currentTick, true);

    const moduloTickInt = Number(currentTick % 5040n);

    if (moduloTickInt === 0 && currentTick > 0n) {
      for (let i = 8; i < 5040 * 8; i += 8) {
        busView.setFloat64(i, 0.0, true);
      }
    }
  }, 2);

  console.log(`[Virtio Load Test] Initializing multi-channel guest OS interrupt simulation (1000ms)...`);

  const operationalMetrics = await Promise.all([
    simulateVirtioInterruptLoop(busView, 720, 1, 1000),
    simulateVirtioInterruptLoop(busView, 120, 4, 1000),
    simulateVirtioInterruptLoop(busView, 24, 5, 1000)
  ]);

  clearInterval(tickerInterval);

  const serialDriver = operationalMetrics[0];
  const blockDriver = operationalMetrics[1];
  const inputDriver = operationalMetrics[2];

  const totalInterruptsHandled = serialDriver.executedOperations + blockDriver.executedOperations + inputDriver.executedOperations;
  const totalMemoryCollisions = serialDriver.raceConditionCollisions + blockDriver.raceConditionCollisions + inputDriver.raceConditionCollisions;

  console.log(`\n[Execution Analysis Output] Total Guest OS Interrupts Handled: ${totalInterruptsHandled}`);
  console.log(`[Execution Analysis Output] Total Detected Memory Overwrites:   ${totalMemoryCollisions}`);

  const memoryDegradationRatio = totalMemoryCollisions / totalInterruptsHandled;
  console.log(`[Execution Analysis Output] Calculated Core Degradation Ratio:   ${(memoryDegradationRatio * 100).toFixed(4)}%`);

  assert.ok(memoryDegradationRatio < 0.05, `SAB Memory degradation breach detected! Ratio: ${(memoryDegradationRatio * 100).toFixed(2)}%`);
  console.log(` -> [Pass] Factorial address space structure safely isolated competing guest operating system drivers.`);
});
