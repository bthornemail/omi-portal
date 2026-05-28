# OMI Object Model

This document is the canonical declaration of the OMI Object Model. It unifies the exploratory notes in `dev-docs/` into one stable framework for addressable browser interfaces.

OMI treats an `omi-*` token as both an object identity and a route. The same token can appear as a DOM id, a `data-omi` attribute, a CSSOM selector prefix, a JSON Canvas node address, an A-Frame entity route, a CodeMirror text token, or a binary memory projection key.

## Core Declaration

The canonical browser-local context root is the IPv4-mapped IPv6 loopback frame:

```text
::ffff:127.0.0.1  ->  omi-8-ffff-127-0-0-1
```

Generated addresses must use `omi-8-ffff-127-0-0-1`. The older `omi-8-127-0-0-1` form is deprecated shorthand. Parsers may accept it, but writers normalize to the IPv4-mapped form.

OMI has three primary address domains:

| Domain | IPv6 notation | OMI meaning |
|---|---|---|
| Semantic service buses | `::1..::8` | content/process delivery, RPC, and semantic subsystem routing |
| Local context root | `::ffff:127.0.0.1` | browser-local DOM/CSSOM/JSDOM context boundary |
| Remote codepoint hierarchy | `::/128` | remote or deferred codepoint hierarchy marker |

The service-bus range is:

| Bus | Role |
|---|---|
| `::1` | loopback IPC and local synchronization |
| `::2` | Lisp signaler for `cons`, `car`, and `cdr` packet structure |
| `::3` | Prolog WordNet synset broker |
| `::4` | CoTURN/TURN synset routing proxy |
| `::5` | HNSW/vector memory indexer, documented future surface |
| `::6` | CodeMirror 6 transaction bridge |
| `::7` | Fano clock guard for 720/5040 lifecycle |
| `::8` | master canvas and browser object surface |

## Address Grammar

The canonical leaf form is:

```text
omi-8-ffff-127-0-0-1-0xRS-0xUS-payload
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
[data-omi^="omi-8-ffff"] {}
[data-omi^="omi-8-ffff-127-0-0-1"] {}
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
omi-8-ffff-127-0-0-1-0x1a.NOUN-VERB-SYM.AAC_QEAAAL_AykAQA
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
omi-8-ffff-127-0-0-1-0x1a.NOUN-VERB-SYM.AAC_QEAAAL_AykAQA
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

## Verification Prospectus

The distributed protocol prospectus adds compliance checks on top of the object model:

1. Generated identities use flat hyphen-delimited OMI tokens and printable descriptor fields.
2. DOM/CSSOM subtree operations use prefix containment over `id` or `data-omi`.
3. Volatile memory and route updates respect 720 promote and 5040 reset lifecycle boundaries.
4. Local context addresses normalize to `omi-8-ffff-127-0-0-1`.
5. Semantic service routes identify `::1..::8`, with WordNet on `::3` and TURN proxy metadata on `::4`.

See [OMI Distributed Protocol Prospectus](./omi-distributed-protocol.md) for the verification-focused architecture statement.

## Protocol Sequencing

The canonical execution sequence has four phases:

1. Ingestion and lexical compilation from CodeMirror or another text source.
2. Memory mapping and time metrics over `SharedArrayBuffer(5040 * 8)`.
3. Routing and transport selection for local context or `turn` metadata.
4. Spatial acceleration and eviction through polynomial draw state and 720/5040 sweeps.

See [OMI Protocol Sequencing](./omi-protocol-sequencing.md) for the phase matrix and sequencer compliance assertions.
