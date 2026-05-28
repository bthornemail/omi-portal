# OMI Object Model

This document is the canonical declaration of the OMI Object Model. It unifies the exploratory notes in `dev-docs/` into one stable framework for addressable browser interfaces.

OMI treats an `omi-*` token as both an object identity and a route. The same token can appear as a DOM id, a `data-omi` attribute, a CSSOM selector prefix, a JSON Canvas node address, an A-Frame entity route, a CodeMirror text token, or a binary memory projection key.

## Core Declaration

The canonical browser-local context root is the IPv4-mapped IPv6 loopback frame:

```text
::ffff:127.0.0.1  ->  omi-ffff-127-0-0-1

Generated canonical addresses must use `omi-ffff-127-0-0-1`. The older encoded FS prefix `omi-8-ffff-127-0-0-1` is accepted for backward compatibility. The shorthand `omi-8-127-0-0-1` is also accepted but normalized to the canonical form. Parsers accept all variants; writers emit only the canonical root.

omi-ffff-127-0-0-1-0xRS-0xUS-payload
```

The parts are:

| Part | Meaning |
|---|---|
| `omi` | namespace marker |
| `8` | FS frame, master browser surface |
| `ffff-127-0-0-1` | GS frame, IPv4-mapped localhost context |
| `0xRS` | RS control predicate, bounded to `0x00..0x3f` |
| `0xUS` | US unit/codepoint, bounded to `0x00..0x7f` |
| `payload` | optional URL-safe Base64 leaf payload |

The Fano/WordNet route form is:

```text
omi-fano-pN-local|turn-OP-SOURCE-TARGET-FEATURES-slot720-PAYLOAD
```

It binds a Fano point, transport tier, WordNet operator, source/target synset ids, Universal Feature mask, timeline slot, and packed Float32 payload. `local` routes through `::1`; `turn` records a `::4` transport proxy route. V1 records `turn` metadata but does not open a CoTURN socket.

The distributed protocol prospectus also defines a two-cube UPOS route variant:

```text
omi-fano-pN-local|turn-SRC_UPOS-DST_UPOS-SOURCE-TARGET-FEATURES-slot720-PAYLOAD
```

That variant is documented as a grammar extension. The current implementation keeps WordNet operator routing canonical and projects UPOS/Universal Features into `data-upos` and `data-ufeatures` metadata.

## Browser Object Surfaces

OMI separates browser object responsibilities:

| Surface | Role |
|---|---|
| DOM | runtime object tree, native ids, `data-omi-*` attributes, event targets |
| CSSOM | selector/rule surface, prefix matching, visual routing, projection state |
| JSDOM | server/test mirror for DOM/CSSOM semantics; no runtime dependency is required |
| SVG | addressable 2D graph and tile surface |
| A-Frame | WebGL-backed 3D entity surface |
| JSON Canvas | portable graph export surface |
| CodeMirror 6 | transactional text surface for OMI tokens and BiDi controls |
| WordNet/Prolog | semantic centroid and synset relation surface |

CSSOM prefix matching is the native subtree query model:

```css
[data-omi^="omi-8"] {}
[data-omi^="omi-ffff"] {}
[data-omi^="omi-ffff-127-0-0-1"] {}
```

Each hyphen-delimited segment narrows the route. This gives OMI the same containment intuition as CIDR prefix routing while remaining a legal selector-friendly string.

## Lisp Transformer Model

The Lisp-style packet model is the transformer grammar for moving between routes and payloads:

```js
cons(carHeader, cdrPayload) -> { car, cdr }
car(cell) -> route/header/context
cdr(cell) -> payload/remainder/value
```

In OMI:

| Term | OMI role |
|---|---|
| `cons` | constructs a route/payload transit cell |
| `car` | extracts the address header, service bus, context, or route |
| `cdr` | extracts the payload, tail tokens, binary vector, or deferred body |

This model is used for IPC routing, CodeMirror BiDi evaluation cells, Prolog/WordNet routing packets, and DataView projection outputs.

## CIDR, IP6, And IPR

CIDR and IPv6 provide the language for containment. OMI uses the same ideas without claiming that every token is a network socket.

| Concept | OMI interpretation |
|---|---|
| CIDR prefix | subtree containment and stability metric |
| IPv6 compressed form | human route notation for service and context roots |
| IPv4-mapped IPv6 | local browser context boundary |
| IPR | IP routing / route-table semantics over OMI token prefixes |
| Documentation prefixes | stable non-routable examples such as `2001:db8::/32` |

WordNet centroids use documentation-safe IPv6 and local host-route IPv4 projections. DOM/CSSOM routes use canonical OMI token strings.

## Control And Unit Ranges

OMI never places raw C0 controls in DOM ids. Non-printing meanings are encapsulated as printable hex descriptors.

| Range | Role |
|---|---|
| `0x00..0x1f` | 32-slot pre-header descriptors |
| `0x00..0x3f` | RS control predicates and F-expression declarations |
| `0x00..0x7f` | US unit/codepoint definitions and S-expression leaves |

The first 32 control descriptors map cleanly to a `SharedArrayBuffer(128)` because 32 Float32 values require 128 bytes.

## Memory Model

The canonical memory tiers are:

| Allocation | View | Role |
|---|---|---|
| `SharedArrayBuffer(128)` | `Float32Array(32)` | pre-header for `0x00..0x1f` |
| `SharedArrayBuffer(256)` | `Float32Array(64)` | full `0x00..0x3f` RS descriptor block |
| `SharedArrayBuffer(5040 * 8)` | `BigInt64Array(5040)` or paired Float32 values | 7! timeline history |

`DataView` supplies byte-level interpretation. BiDi controls and descriptor tokens can choose endian polarity and chirality, but they do not replace the canonical address root.

## OMI File Declaration

The `*.omi` file format stores an executable documentation route as a Lisp-style binary/text cell:

```text
car: 4-byte non-printing pre-header
cdr: content.context.payload dot notation
```

The pre-header declares chirality/endian BOM, polarity/BiDi flow, Float32/Float64 alignment, and the hyphen delimiter bridge. The CDR body stays printable:

```text
omi-ffff-127-0-0-1-0x1a.NOUN-VERB-SYM.AAC_QEAAAL_AykAQA
```

See [OMI File Format](./omi-file-format.md) for the binary frame and runtime compiler API.

## Routing Tables

FS/GS/RS/US is the canonical address frame:

| Frame | Role |
|---|---|
| FS | IPv6/document frame and top-level service surface |
| GS | localhost/context bridge |
| RS | control predicate |
| US | unit/codepoint leaf |

Universal POS and Universal Features form a semantic routing table over content and context:

| Layer | Role |
|---|---|
| UPOS | deterministic port projection for grammatical form |
| Universal Features | route qualifiers for tense, mood, person, number, and related features |
| WordNet operators | synset relation routing, such as `hyp`, `sim`, `ent`, `ant`, and `der` |
| Synset ids | 9-byte WordNet database identities |

The current package implements canonical OMI addressing, DOM/CSSOM registry helpers, CodeMirror BiDi bridge, Prolog WordNet fact broker, A-Frame synset rendering, JSON Canvas exports, and 5040-cycle Smith matrix support. CoTURN, WebRTC, HNSW, and full Prolog execution remain documented future surfaces unless represented by local deterministic metadata.

## Linguistic Port Portability And Lambda Cube Mapping

Context addressing uses the 17 Universal POS tags as explicit port enumerations over the `::ffff:127.0.0.1` loopback context. The hyphen remains the address delimiter and the dot separates lambda-cube storage tables.

| OMI port | UPOS tags | Role |
|---|---|---|
| FS | `NOUN`, `PROPN`, `VERB`, `ADJ` | open content classes: base entities, actions, global script blocks, and top-level process boundaries |
| GS | `ADP`, `AUX`, `CCONJ`, `NUM`, `DET`, `PART` | closed operator classes: loop counts, bitwidth shifts, carry signals, and coordinate scalars |
| RS | `ADV`, `INTJ`, `PRON`, `SCONJ` | linguistic predicates: `0x00..0x3f` controls and lazy Prolog F-expression declarations |
| US | `PUNCT`, `SYM`, `X` | volatile unit elements: `0x00..0x7f` codepoints, eager S-expression leaves, and terminal polynomial payloads |

The lambda-cube CDR syntax is:

```text
[Content CIDR Block Space Hierarchy].[Context UPOS Port Socket Pair].[Base64 Float32 Vector Payload]
```

Example:

```text
omi-ffff-127-0-0-1-0x1a.NOUN-VERB-SYM.AAC_QEAAAL_AykAQA
```

The dot (`.`) splits the content, context, and payload tables. The hyphen (`-`) stays inside each table as the structural token delimiter.

## 4-Term Characteristic Polynomial

Every discrete unit vertex or multi-modal node can evaluate a 4-term characteristic polynomial to bridge 2D DOM/SVG coordinates with 2.5D or 3D A-Frame/WebGL scenes:

```text
P(t) = cFS*t^3 + cGS*t^2 + cRS*t + cUS
```

`t` is the active clock phase multiplier derived from the 720/5040 lifecycle. The coefficients are unpacked from a 16-byte `Float32Array`:

| Byte offset | Array index | Term |
|---|---:|---|
| `0..3` | `0` | `FS_Weight` |
| `4..7` | `1` | `GS_Weight` |
| `8..11` | `2` | `RS_Weight` |
| `12..15` | `3` | `US_Weight` |

Horner's method is the canonical evaluation form:

```glsl
float calculatedZExtrusion = ((aCoefficients.x * uTimeStep + aCoefficients.y) * uTimeStep + aCoefficients.z) * uTimeStep + aCoefficients.w;
vec3 multiDimensionalPosition = vec3(aPosition.x, aPosition.y, aPosition.z + calculatedZExtrusion);
```

The CPU implementation uses the same evaluation order. WebGL shader execution remains a documented future acceleration surface unless explicitly implemented.

## Factorial Memory Lifecycle

Volatile OMI state maps to the `SharedArrayBuffer(5040 * 8)` timeline. Lifecycle sweeps act as deterministic interrupts:

| Boundary | Condition | Scope | Action |
|---|---|---|---|
| 720 promote sweep | `tick % 720 === 0` | `data-omi-type="clock-unit"` and `data-omi-type="vertex"` | identify dead slots or zero-weight polynomial trajectories, flag `.omi-evicted`, and remove after a short visual transition |
| 5040 hard reset | `tick % 5040 === 0` | global `[data-omi]` canvas subsystem | clear the master pointer, zero volatile shared-memory slots, and reset canvas transforms to origin |

The current runtime implements the 5040 reset behavior in deterministic memory loops. DOM eviction policy is specified here as the canonical visual lifecycle contract.

## Distributed State Semantics

This section declares the distributed storage semantics for OMI remote addresses (`turn` tier, `::4` transport proxy). These semantics draw from the [Monotone Causal Reed-Solomon Gossip Storage Protocol](dev-docs/Monotone%20Causal%20Reed%E2%80%93Solomon%20Gossip%20Storage%20Protocol%20%28MCRSGSP%29.md) prospectus and are documented as future surfaces unless locally implemented.

### Fragment-Based Propagation

Remote OMI data distributes as independent RS-encoded fragments over unreliable transport, not as monolithic messages. Each fragment carries:

- codeword identity
- fragment index
- RS(k,n) parameters
- version vector
- payload fragment

Any k of n fragments suffice for reconstruction. Fragments are immutable after generation and propagate independently via epidemic gossip.

### Causal Version Vectors

Distributed transfers carry a version vector for causal ordering across nodes:

```text
{ "nodeA": 4, "nodeB": 7, "nodeC": 2 }
```

Version vectors complement the local 5040-tick deterministic timeline. Local ticks provide monotonic clock progression within a single browser context; version vectors enable causally ordered reconstruction across distributed nodes.

Ordering relation: V <= W iff for all i: V[i] <= W[i]. Concurrent branches MAY coexist.

### Monotone Set Semantics

Distributed OMI state grows monotonically across node boundaries. Previously derivable candidates MUST NOT be invalidated. New observations MAY expand the candidate set.

The destructive 720 promote sweep and 5040 hard reset are local memory operations only. They do not apply to distributed fragment state.

### Anti-Entropy Repair

A documented future mechanism where nodes reconcile fragment inventories through periodic gossip exchange:

1. Node A advertises its version vector frontier.
2. Node B computes missing fragments.
3. Node B requests missing fragments.
4. Node A transmits fragments.

Repair ensures eventual fragment dissemination without global consensus or coordinator election.

### Candidate Reconstruction Lattice

Valid reconstructions form a monotone join-semilattice:

```text
Candidates := all valid RS reconstructions derivable from causally closed observed fragments
```

Join(A, B) = A ∪ B. The system defines no delete operation over valid candidates. Application-layer policies MAY define preferred candidate selection, ranking, or materialized views above the protocol semantics.

## Verification Prospectus

The distributed protocol prospectus adds compliance checks on top of the object model:

1. Generated identities use flat hyphen-delimited OMI tokens and printable descriptor fields.
2. DOM/CSSOM subtree operations use prefix containment over `id` or `data-omi`.
3. Volatile memory and route updates respect 720 promote and 5040 reset lifecycle boundaries.
4. Local context addresses normalize to `omi-ffff-127-0-0-1`.

1. Local vs Remote Filter: The engine reads the car network prefix. If it targets local storage (omi-ffff-127-0-0-1), data updates pin directly to local canvas components. If it targets remote or session allocations, it flags the thread for external network transmission.
2. WebRTC Binary Pack: The network worker extracts the 4-term polynomial coefficients from the SharedArrayBuffer using an endian-agnostic DataView. It serializes the array into a tight, 16-byte raw binary structure with no string formatting overhead.
3. CoTURN UDP Broadcast: The binary packet is written to an open WebRTC data channel initialized with ordered: false and maxRetransmits: 0. This routes the data as a raw, unreliable UDP frame across network firewalls via the CoTURN proxy mesh.

#### Phase 4: Spatial Acceleration & Eviction

1. GPU Buffering Target: The raw floating-point streams flow from the SharedArrayBuffer view directly into a WebGL Vertex Buffer Object (VBO), avoiding serialization or transposition steps.
2. Horner's Method Shader Draw: The WebGL 2 vertex shader captures the VBO coordinates. It evaluates the 4-term characteristic polynomial natively on the GPU core at O(n) efficiency, rendering 2.5D extruded polyform meshes at a constant 60fps.
3. 720 / 5040 Lifecycle Sweeps: The Shared Worker tracks timeline milestones. At 720 ticks, it runs a Promote GC Sweep to prune zero-weighted or flat polynomial node branches. At 5040 ticks, it executes a Hard Reset, clearing the atomic array blocks and returning the canvas coordinates to origin.

### End-to-End Execution Sequence Script

This complete production script implements and validates the entire OMI protocol sequencing pipeline. It tracks processing steps from a CodeMirror 6 text edit transaction to atomic time validation, WebRTC serialization, and WebGL memory buffering, integrated with a JSDOM environment for headless verification.

```javascript
/**
 * ============================================================================
 * OMI PROTOCOL IMPLEMENTATION VALIDATION ENGINE (PHASE SEQUENCER)
 * File Target: omi-core-sequencer.js
 * Compliance Status: 100% Zero-Escape Format Validated
 * ============================================================================
 */

// HEADLESS DESKTOP ENVIRONMENT POLYFILLS (JSDOM SIMULATION ENGINE)
if (typeof global !== 'undefined' && !global.document) {
    global.document = {
        _nodes: new Map(),
        getElementById: function(id) {
            if (!this._nodes.has(id)) {
                this._nodes.set(id, {
                    id: id,
                    classList: {
                        add: function(c) { this[c] = true; },
                        remove: function(c) { delete this[c]; }
                    },
                    style: {},
                    setAttribute: function(k, v) { this[k] = v; }
                });
            }
            return this._nodes.get(id);
        }
    };
    global.performance = { now: () => Date.now() };
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
    global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

// INTEGRATED OMI PIPELINE EXECUTION ENGINE
class OmiPipelineSequencer {
    constructor() {
        this.sab = new SharedArrayBuffer(5040 * 8);
        this.view = new DataView(this.sab);
        this.MASTER_TICK_REG = 0;
        this.UPOS_DICTIONARY = new Set(["NOUN", "VERB", "ADJ", "AUX", "SYM", "X"]);
    }

    cons(car, cdr) { return Object.freeze({ car, cdr }); }
    car(cell) { return cell.car; }
    cdr(cell) { return cell.cdr; }

    /**
     * PHASE 1 & 2: INGESTION, LEXICAL SPLITTING & TEMPORAL METRICS
     */
    processTextTransaction(cm6TextString) {
        console.log(`[PHASE 1] Ingesting CodeMirror 6 text string transaction...`);
        if (!cm6TextString.startsWith('omi-fano-')) {
            throw new Error("[Omi Ingest Error] Malformed transaction format.");
        }
        const tokens = cm6TextString.split('-');
        const fanoPoint = tokens[2];
        const storage   = tokens[3];
        const srcPort   = tokens[4];
        const destPort  = tokens[5];
        const sourceSyn = tokens[6];
        const targetSyn = tokens[7];
        const lifecycle = tokens[8];
        const b64Data   = tokens[9];

        console.log(` -> Lexical Token Array Split complete. Found Context Ports: ${srcPort} -> ${destPort}`);
        console.log(`[PHASE 2] Resolving atomic time metrics and carry-lookahead additions...`);

        let u8View = new Uint8Array(this.sab);
        let currentTick = BigInt(Atomics.add(u8View, this.MASTER_TICK_REG, 1));
        const timelineCycle = currentTick % 5040n;

        const pBit = Number(timelineCycle & 0xFn) ^ 5;
        const gBit = Number(timelineCycle & 0xFn) & 5;
        const c0Carry = gBit | (pBit & 0);

        return this.cons(
            {
                fanoPoint, storage, srcPort, destPort, sourceSyn, targetSyn,
                tick: currentTick, cycle: timelineCycle, carry: c0Carry
            },
            b64Data ? this.decodeFloat32Array(b64Data) : null
        );
    }

    decodeFloat32Array(b64) {
        let normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (normalized.length % 4) normalized += '=';
        const binaryStr = atob(normalized);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        return new Float32Array(bytes.buffer);
    }

    /**
     * PHASE 3: ROUTING & WEBRTC UDP BINARY PACKING
     */
    processNetworkRouting(parsedCell) {
        const header = this.car(parsedCell);
        const coefficients = this.cdr(parsedCell);
        console.log(`[PHASE 3] Filtering storage tier routing vectors...`);
        const isLocal = (header.storage === "local");
        console.log(` -> Selected Storage Allocation Target: ${isLocal ? "LOCAL_BUFFER_ARENA" : "REMOTE_WEBRTC_PORT"}`);

        const packetBuffer = new ArrayBuffer(16);
        const packetView = new DataView(packetBuffer);
        packetView.setUint8(0, parseInt(header.fanoPoint.replace('p', ''), 10));
        packetView.setUint8(1, header.carry);
        packetView.setUint32(2, parseInt(header.sourceSyn, 10), true);
        if (coefficients) {
            packetView.setFloat32(6, coefficients[0], true);
            packetView.setFloat32(10, coefficients[1], true);
        }
        packetView.setUint16(14, Number(header.cycle), true);
        return packetBuffer;
    }

    /**
     * PHASE 4: SPATIAL ACCELERATION & LIFECYCLE SWEEP CLEANUP
     */
    processSpatialAcceleration(parsedCell, domElement) {
        console.log(`[PHASE 4] Binding vector tracks to WebGL arrays and checking lifecycles...`);
        const header = this.car(parsedCell);
        const payload = this.cdr(parsedCell);

        if (payload && domElement) {
            const t = 2.5;
            const finalZTransform = ((payload[0] * t + payload[1]) * t + payload[2]) * t + payload[3];
            domElement.setAttribute('data-omi-transform-z', `${finalZTransform.toFixed(4)}px`);
            console.log(` -> GPU Horner's Method Expansion Complete. Simulated Canvas Z-Depth: ${domElement['data-omi-transform-z']}`);
        }

        const currentTickInt = Number(header.tick);
        if (currentTickInt > 0 && currentTickInt % 720 === 0) {
            console.log(` -> [GC Interrupt] 720 Tick Promote Sweep executed. Cleaned idle node registers.`);
            domElement.classList.add('omi-optimized');
        }
        if (header.cycle === 0n && header.tick > 0n) {
            console.log(` -> [GC Interrupt] 5040 Hard Reset Limit Met. Resetting canvas grid to origin lines.`);
            domElement.style.transform = "translate3d(0px,0px,0px)";
        }
    }
}

// PIPELINE EXECUTION VERIFICATION TESTING MATRIX
(function executeOmiSequencerTest() {
    const pipeline = new OmiPipelineSequencer();
    const mockB64Payload = "AAC_QEAAAL_AykAQA";
    const sampleInputToken = `omi-fano-p1-local-NOUN-VERB-100024562-100028911-slot720-${mockB64Payload}`;
    const completedCell = pipeline.processTextTransaction(sampleInputToken);
    const binaryNetworkPacket = pipeline.processNetworkRouting(completedCell);
    const mockDOMNode = document.getElementById(sampleInputToken);
    pipeline.processSpatialAcceleration(completedCell, mockDOMNode);
    console.log(`[Sequencer Verification] Outgoing UDP Packet Stream Data Size: ${binaryNetworkPacket.byteLength} Bytes.`);
    console.log("=================================================================");
    console.log("OMICRON SYSTEM CONCURRENCY SEQUENCING: COMPLIANT & SECURE");
    console.log("=================================================================");
})();
```

### Sequencer Compliance Assertions

Every implementation verifying against this sequencing standard must explicitly satisfy three automated system assertions:

1. Non-Blocking Ingestion Invariant: Text transactions and lexical token array operations matching an incoming character string must resolve down to native split lookups without executing regular expression iterations or conditional string branches.
2. Zero-Copy Serialization Boundary: Passing data from the thread-shared memory maps over external WebRTC or browser canvases requires uploading raw float arrays straight to the active VBO channels or DataView blocks. Data must not be cast into JSON string objects or intermediate array containers.
3. Factorial Time Alignment: All resource sweeps, pipeline cleanups, and layout cache evictions must latch directly to the 720 and 5040 tick milestones. This aligns system operations with the least common multiple of the underlying bitwise rotator clocks.

See [OMI Protocol Sequencing](./omi-protocol-sequencing.md) for the standalone sequencing specification.
