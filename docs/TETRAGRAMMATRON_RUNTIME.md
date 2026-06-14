# Tetragrammatron Runtime

The Tetragrammatron is the runnable OMI coordination substrate that connects
proof streams to carrier words, shared memory, worker events, and live portal
projection.

It is not a replacement for POS graph semantics, WordNet synset cells, or the
existing OMI graph channels. It is a bridge layer: proof becomes a carrier,
the carrier becomes shared-memory state, and worker/backend events project that
state into the live portal surface.

## Runtime Diagram

```text
proof stream
  -> modem
  -> geometry
  -> .o
  -> memory
  -> worker
  -> backend
  -> portal
  -> receipt
```

Expanded runtime path:

```text
test output
  -> modemRoundTripToGeometryReceipts()
  -> modemFrameToMemory()
  -> workerRuntimeTick()
  -> binder.ingestBackendEvent()
  -> voxel snapshot
```

Canon line:

```text
Readable proof becomes carrier.
Carrier becomes memory.
Memory becomes worker event.
Worker event becomes live projection.
Receipt accepts.
```

## Runtime Surfaces

- `src/omi/tetragrammatron-modem.js`
  parses proof/test streams, modulates events to OMI notation, routes through
  geometry, packs `.o` carrier words, writes frames into meta-memory, and
  exposes `.o` file import/export helpers.
- `src/omi/tetragrammatron-geometry-router.js`
  is the deterministic canonical route resolver. It assigns Hopf/QuQuart/Q_xy
  geometry, `local240`, `slot5040`, `chart11`, `baseQ`, `fiberQ`, Fano/role
  coordinates, and Polybius interior coordinates.
- `src/omi/tetragrammatron-route-logger.js`
  remains an inspection and history surface for observed routes. It records
  QuQuart phases, orientation60, candidate `local240`/`slot5040` values, and
  route receipts, but it is not the acceptance authority.
- `src/omi/tetragrammatron-meta-memory.js`
  owns the `descriptorBlock` and `historyBlock` contract for worker/backend
  coordination.
- `src/omi/tetragrammatron-worker-runtime.js`
  reads descriptors, claims the routed slot, reads carrier receipts, emits
  backend events, and returns accepted/candidate/rejected state.
- `src/canvas/live-voxel-stream.js`
  projects backend events into voxel state.
- `src/wan/live-portal-binder.js`
  bridges backend events into the live portal voxel stream.
- `src/ebpf/ebpf-pipeline.bpf.c`
  provides the 32-bit XDP packet gate. Userspace proof and modem logic stay
  outside the eBPF program.

## Shared Memory Contract

```text
descriptorBlock = SharedArrayBuffer(64 * 4)
historyBlock    = SharedArrayBuffer(5040 * 8)
```

Typed views by role:

```text
Int32Array    coordination / Atomics
Uint32Array   flags and packed fields
Float32Array  readable scalar metrics
DataView      exact byte packing
BigInt64Array receipt history
```

`TETRA_DESCRIPTOR` is the canonical compact descriptor slot map.
`TETRAGRAMMATRON_DESCRIPTOR` remains as a compatibility alias.

The deterministic worker invariant is:

```text
descriptor SLOT5040 == claimed slot == history receipt slot
```

`workerRuntimeTick()` re-seeds the claim cursor from descriptor `SLOT5040`, so
the worker claims the routed slot rather than an incidental cursor slot.

Snapshots are JSON-safe and do not expose raw `SharedArrayBuffer` or `BigInt`
values.

## Route Authority

The route logger and geometry router are separate layers:

```text
tetragrammatron-route-logger.js
  = route observation / legacy route log / Tiny signal surface

tetragrammatron-geometry-router.js
  = deterministic canonical route resolver
```

Canon prefers this runtime path:

```text
geometry-router -> modem -> meta-memory -> worker-runtime -> live portal
```

The route logger remains useful for inspection and historical route receipts,
but acceptance flows through the deterministic geometry router.

## Commands

Run the modem-only proof pipeline:

```bash
npm run tetragrammatron:modem
```

Run the full live proof loop:

```bash
npm run tetragrammatron:live-proof
```

The live proof command accepts:

```bash
npm run tetragrammatron:live-proof
npm run tetragrammatron:live-proof -- path/to/test-output.txt
npm run tetragrammatron:live-proof -- --stdin < test-output.txt
```

Verify the runtime:

```bash
npm test
npm run build
make verify-safe
make verify-ebpf
```

`make verify-ebpf` compiles the BPF object and runs the user-space mirror test
for the 32-bit XDP signature law. In container environments, the `bpftool`
program load may fall back non-fatally while ELF and mirror verification still
pass.

## Boundary

The Tetragrammatron is no longer only notation. It is a proof modem, geometry
router, shared-memory coordinator, worker runtime, backend event source, and
live projection surface.

Backends compute. Receipts accept.

Release note:

```text
Tetragrammatron Runtime v0 is complete: proof streams now compile into OMI
notation, route through deterministic Hopf/QuQuart geometry, pack into .o
carriers, enter shared meta-memory, are claimed by worker runtime, and project
as backend events into the live portal. Receipt accepts.
```
