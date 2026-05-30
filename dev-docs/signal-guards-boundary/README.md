# Face 1 — signal guards boundary

**Physical Layer — ITF Clock Sync & Code39 Framing Guards**

## 🟢 What

The physical layer is the hardware boundary of the OMI protocol stack. It answers: *how does the system establish timing, verify boot integrity, and probe network reachability?*

Three subsystems operate at this face:

1. **WAN telemetry loop** — ICMP echo probes between the tunnel core host (`74.208.190.29`) and the remote proxy edge (`69.48.202.32`) at a 5-second cadence, broadcasting results via Server-Sent Events (SSE).
2. **QEMU/NBD mesh coordinator** — manages virtual block devices (`/dev/nbd0` through `/dev/nbd7`) attached to QEMU guests, allocating raw disk images and orchestrating multi-architecture boot.
3. **Chiral FIFO engine** — POSIX named pipes (`/tmp/omi-bus/chiral_*.fifo`) for inter-process analog FFT chunk transfer between user-space processes and the runtime.

The canonical genesis token anchors the boot timeline at slot 1504:

```
omi-0100-03bf-7c00-2b01-2f01-1434-039f-01ff/48
  ^^^^  ^^^^  ^^^^  ^^^^  ^^^^  ^^^^  ^^^^  ^^^^
  CBOS  CHR   GEN    AR    AR    MM    CRD   CLS
```

## 🔵 How

### Source file map

| File | Role |
|------|------|
| `src/wan/wan-telemetry-loop.js` | `WanTelemetryLoop` — probe scheduler, ICMP simulation, SSE broadcast, uptime tracking |
| `src/wan/qemu-nbd-mesh.js` | `QemuNbdMeshCoordinator` — NBD device attach/detach, disk image allocation, guest lifecycle |
| `src/runtime/chiral-fifo-engine.js` | `OmiChiralFifoEngine` — POSIX FIFO creation, analog FFT chunk ingestion, left/right chiral slot storage |
| `src/omi/omicron-kernel.js` | Boot address validation (0x7C00–0xAA55), zero-compression expansion, canonical `/48` frame |

### Key data structures

```javascript
// WanTelemetryLoop — probe result envelope
{
  origin: "74.208.190.29",
  destination: "69.48.202.32",
  rttMs: 12.4,
  timestamp: 1717027200000,
  probeIndex: 1042
}

// Chiral FIFO slot — 2-channel FFT energy
slot[0] = leftChiralEnergy   // even opcode → constructive
slot[1] = rightChiralEnergy  // odd opcode  → destructive
```

### Test tour

| Test file | What it verifies |
|-----------|-----------------|
| `test/wan-telemetry.test.js` | Probe cycle lifecycle, SSE broadcast, history bounding, uptime calculation |
| `test/qemu-mesh.test.js` | Disk image allocation, guest summary, NBD attach/detach stubs |
| `test/chiral-fifo.test.js` | FIFO construction, FFT chunk storage, left vs right chiral sign |
| `test/softmmu-system.test.js` | MBR 0xAA55 validation, multi-arch QEMU boot simulation |

## 🔴 Extend

### FACTS.omi rules

- **Rule 0x65**: Probe cadence MUST be 5 ± 1 seconds; >10s logs drift warning
- **Rule 0x66**: Cooldown period MUST be ≥2 seconds before repeat probe
- **Rule 0x67**: Deferred probe fires once per `SAB_BOOT_SLOT` (1504) clock

### Extension points

- **Add a probe target**: Extend `WanTelemetryLoop` config with a new `{ origin, destination }` pair. The SSE broadcast channel auto-includes it.
- **Add a QEMU architecture**: Append to `bootArchitectureVariants` in `qemu-nbd-mesh.js`. Each variant specifies `{ arch, machine, binary }`.
- **New FIFO channel**: Add a slot index in `OmiChiralFifoEngine.processAnalogFFTChunk()`. The SAB layout auto-extends modulo 2.

### Performance constraints

- WAN probes must never block the event loop — the scheduler uses `setInterval` with no synchronous I/O.
- NBD image allocation uses `Buffer.alloc` with zero-fill; disk images are sparse until first write.
- FIFO writes are non-blocking (`O_NONBLOCK`) to prevent back-pressure on the FFT pipeline.
