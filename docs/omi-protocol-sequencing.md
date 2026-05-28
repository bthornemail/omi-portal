# OMI Protocol Sequencing

This document defines the chronological orchestration, data marshal cycles, and execution invariants of the OMI protocol across text, memory, transport, and graphics surfaces.

## Global Lifecycle Matrix

```text
[ CodeMirror 6 ] -> [ OMI Kernel Core ] -> [ Shared Worker ]
  text mutation      token splitting       720/5040 sweeps
                         |
                         v
[ WebGL 2 Canvas ] <- [ DataView SAB ] <-> [ WebRTC Data Channel ]
  shader draw          5040 * 8 ring        unreliable UDP frame
```

The canonical sequencing pipeline has four phases:

| Phase | Name | Steps |
|---:|---|---|
| 1 | ingestion and compilation | CodeMirror transaction, lexical split, identity ingest through `car`/`cdr` |
| 2 | memory mapping and time metrics | atomic stride verification, 7-tick cascades, CLA vector resolution |
| 3 | routing and transports | local/remote filter, 16-byte binary pack, CoTURN/WebRTC broadcast |
| 4 | spatial acceleration and eviction | GPU buffering, Horner shader draw, 720/5040 lifecycle sweep |

## Phase 1: Ingestion And Lexical Compilation

1. A CodeMirror 6 `EditorView` update captures a text fragment containing an `omi-*` route.
2. The stream is split along hyphen (`-`) and dot (`.`) boundaries into unescaped token fields.
3. The Lisp transformer layer ingests the route:
   - `car` isolates process, context, storage, and routing headers.
   - `cdr` isolates semantic ports, payload vectors, and remainder fields.

The operation is a bounded string-token pass over the input length. Generated identities stay escape-free.

## Phase 2: Memory Mapping And Time Metrics

1. The memory manager checks the `SharedArrayBuffer(5040 * 8)` timeline position.
2. The clock orchestrator evaluates the 7-tick cascade profiles: `rot7`, `rot15`, `rot60`, `rot120`, `rot240`, `rot360`, and `rot720`.
3. Rotator state feeds the 4-bit carry-lookahead adder, resolving generate and propagate carry conditions.

The implemented package already contains deterministic CLA utilities and 5040-cycle memory primitives. The complete 7-rotator cascade remains a sequencing standard for future runtime expansion.

## Phase 3: Routing And Distributed Transports

1. The `car` storage route determines local or remote handling.
2. Local context routes pin to `omi-8-ffff-127-0-0-1`.
3. Remote or `turn` routes are eligible for `::4` transport metadata.
4. The network worker packs route state into a 16-byte binary frame through `DataView`.
5. A live future WebRTC implementation should use `ordered: false` and `maxRetransmits: 0` for UDP-like data-channel behavior.

The current package implements the deterministic 16-byte packet serialization for Fano/WordNet tokens. It records `turn` as route metadata but does not open a live CoTURN/WebRTC socket.

## Phase 4: Spatial Acceleration And Eviction

1. Float vectors are eligible for direct upload into graphics buffers.
2. The WebGL 2 vertex shader evaluates the 4-term characteristic polynomial using Horner's method:

```glsl
float calculatedZExtrusion = ((aCoefficients.x * uTimeStep + aCoefficients.y) * uTimeStep + aCoefficients.z) * uTimeStep + aCoefficients.w;
vec3 multiDimensionalPosition = vec3(aPosition.x, aPosition.y, aPosition.z + calculatedZExtrusion);
```

3. At `tick % 720 === 0`, the system runs the promote sweep.
4. At `tick % 5040 === 0`, the system runs the hard reset.

The current package implements deterministic canvas/memory projections and documents the shader/VBO path as the next hardware pipeline layer.

## Sequencer Compliance Assertions

An implementation validating against this sequencing standard must satisfy:

1. Non-blocking ingestion invariant: `omi-*` text transactions resolve through native token splitting over hyphen and dot boundaries, without regular-expression-heavy parsing loops in the hot path.
2. Zero-copy serialization boundary: transport and graphics handoff use raw `ArrayBuffer`, `SharedArrayBuffer`, typed arrays, or `DataView` blocks instead of JSON string objects.
3. Factorial time alignment: resource sweeps, cache evictions, and layout reset operations latch to 720 and 5040 tick milestones.
4. Context normalization: local routes normalize to `omi-8-ffff-127-0-0-1`.
5. Surface separation: CodeMirror, DOM/CSSOM, SharedArrayBuffer, WebRTC metadata, and WebGL buffers remain distinct surfaces joined by OMI route identity.

## Implementation Note

The full live WebGL VBO streaming layer should be implemented after this sequencing contract because it depends on the exact 16-byte packet shape and lifecycle invariants declared here.
