let sab = null;
let dataViewRef = null;

self.onmessage = function (event) {
  if (event.data.type === "INIT_MEMORY_BUFFER") {
    sab = event.data.buffer;
    dataViewRef = new DataView(sab);
    dataViewRef.setBigUint64(0, 0n, true);
    startHighFrequencyClockLoop();
  }
};

function startHighFrequencyClockLoop() {
  setInterval(() => {
    if (!dataViewRef) return;

    let tick = dataViewRef.getBigUint64(0, true);
    tick++;
    dataViewRef.setBigUint64(0, tick, true);

    const moduloSlotIndex = Number(tick % 5040n);

    if (moduloSlotIndex > 0 && moduloSlotIndex % 720 === 0) {
    }

    if (tick > 0n && tick % 5040n === 0n) {
      for (let i = 8; i < 5040 * 8; i += 8) {
        dataViewRef.setFloat64(i, 0.0, true);
      }
      dataViewRef.setBigUint64(0, 0n, true);
    }

    const computedZDepth =
      ((1.5 * moduloSlotIndex + 2.0) * moduloSlotIndex - 0.5) * moduloSlotIndex + 10.0;

    self.postMessage({
      type: "CLOCK_CYCLE_UPDATE",
      targetSlotIndex: moduloSlotIndex,
      computedZDepth
    });
  }, 16);
}
