# OMI Distributed Protocol Prospectus

This prospectus extends the canonical [OMI Object Model](./omi-object-model.md) with the distributed protocol verification model. It is a documentation specification, not a claim that every future runtime surface is implemented.

## System Topology

OMI maps a sparse radix trie onto IPv6-style address components. A subnet boundary `X/n` defines a strict interval:

```text
IPv4: [x * 2^(32-n),  x * 2^(32-n)  + 2^(32-n)  - 1]
IPv6: [x * 2^(128-n), x * 2^(128-n) + 2^(128-n) - 1]
```

For a fixed prefix length, subnets form a partition. Any two subnets are either disjoint or nested. OMI mirrors this property with hyphen-delimited token prefixes, so DOM ancestry and CSSOM prefix selection can behave like route-table containment:

```css
[data-omi^="omi-8"] {}
[data-omi^="omi-8-ffff-127-0-0-1"] {}
```

The canonical local context boundary remains:

```text
::ffff:127.0.0.1  ->  omi-8-ffff-127-0-0-1
```

## Content And Context Layers

The semantic content range is `::1..::8`. The local context range is `::ffff:127.0.0.1`. The remote codepoint hierarchy marker is `::/128`.

Universal POS ports sit above the local loopback boundary as semantic sockets:

| Port | Class | Tags | Role |
|---|---|---|---|
| FS | open class | `NOUN`, `PROPN`, `VERB`, `ADJ` | script blocks and process boundary domains |
| GS | closed class | `ADP`, `AUX`, `CCONJ`, `NUM`, `DET`, `PART` | bitwidth shifts, loop counts, and scaling parameters |
| RS | other/control | `ADV`, `INTJ`, `PRON`, `SCONJ` | `0x00..0x3f` controls and lazy F-expression declarations |
| US | other/unit | `PUNCT`, `SYM`, `X` | `0x00..0x7f` units, S-expression leaves, and polynomial payloads |

Data transit cells use immutable Lisp-style structure:

```js
cons(carHeader, cdrPayload)
car(cell) // routing header and context
cdr(cell) // operational body and binary vectors
```

## Fano Timing

The projective timing frame is the Fano Plane `PG(2,2)`: 7 points, 7 lines, 3 points per line, and 3 lines through each point.

OMI serializes the Fano point as `p1..p7` inside `omi-fano-*` tokens. When two streams target the same synset and same lifecycle slot, the line intersection model identifies the collision domain and shifts one stream to a different slot.

Canonical lifecycle boundaries:

| Boundary | Meaning |
|---|---|
| `720` | Promote sweep, derived from `6!` |
| `5040` | Hard reset, derived from `7!` |

## Token Layouts

The implemented WordNet/Fano layout is:

```text
omi-fano-pN-local|turn-OP-SOURCE-TARGET-FEATURES-slot720-PAYLOAD
```

The two-cube UPOS prospectus layout is:

```text
omi-fano-pN-local|turn-SRC_UPOS-DST_UPOS-SOURCE-TARGET-FEATURES-slot720-PAYLOAD
```

The implemented helper stores UPOS and Universal Features as routing-frame metadata through `data-upos` and `data-ufeatures`. The two-cube layout is documented as the next grammar extension, not a replacement for the implemented operator-first WordNet route.

Synset ids use the WordNet 9-byte database shape:

```text
1xxxxxxxx -> NOUN
2xxxxxxxx -> VERB
3xxxxxxxx -> ADJ
4xxxxxxxx -> ADV
```

The payload is URL-safe Base64 for a four-term Float32 polynomial vector. The 16-byte packet shape is:

| Byte range | Value |
|---|---|
| `0` | Fano point |
| `1` | source synset category |
| `2..5` | source synset offset, little endian |
| `6..9` | polynomial term 0, Float32 little endian |
| `10..13` | polynomial term 1, Float32 little endian |
| `14..15` | lifecycle slot, little endian |

## Distributed Storage Semantics

The OMI distributed protocol extends the remote transport path (`turn` tier, `::4`) with Reed-Solomon erasure-coded fragment propagation. The semantics defined here draw from the Monotone Causal Reed-Solomon Gossip Storage Protocol (MCRSGSP) prospectus and are documented as future surfaces.

### RS(k,n) Erasure Coding

Data payloads are Reed-Solomon encoded before fragmentation:

| Parameter | Meaning |
|---|---|
| k | minimum fragments required for reconstruction |
| n | total fragments generated |

Constraint: 1 <= k <= n <= 255. Encoding uses GF(2^8). Any k fragments from any peer suffice for reconstruction.

### Fragment Identity

Each fragment is uniquely identified by:

```text
(codeword_id, version_vector, fragment_index)
```

Fragments are immutable after generation. Mutation requires creation of a new causal version.

### Gossip Exchange

Nodes periodically exchange fragment inventories through a push/pull protocol:

1. Node A advertises its version vector frontier.
2. Node B computes missing fragments from the frontier.
3. Node B requests missing fragments by codeword and index.
4. Node A transmits the requested fragments.

Recommended fanout: sqrt(network_size). Random peer sampling with configurable fanout.

### Anti-Entropy Repair

Repair triggers on:
- fragment loss detection
- peer frontier divergence
- node rejoin
- periodic maintenance cycle

Repair MUST preserve monotonicity. Repair MUST NOT delete causally valid fragments.

### Causal Closure

A fragment set S is causally closed iff every observed ancestor of every fragment in S is also in S. Closure is evaluated only over locally observed state. Nodes MUST NOT assume global visibility.

Reconstruction is valid iff:
1. all fragments share identical codeword_id
2. fragment subset is causally closed
3. |S| >= k
4. RS_decode(S) succeeds

### Candidate Reconstruction Lattice

System state is the set of all valid RS reconstructions derivable from observed fragments. This forms a monotone join-semilattice with no destructive operations. Application layers MAY define preferred candidate selection, ranking, and materialized views above protocol semantics.

## Hardware Engines

The protocol prospectus defines these runtime engines:

| Engine | Status | Role |
|---|---|---|
| Bitwise clock orchestrator | implemented partial | 5040-cycle timeline and Smith matrix support |
| Carry-lookahead adder | implemented | 4-bit CLA utilities |
| Fano collision validator | documented future | multi-user timing collision detection |
| WebRTC UDP transceiver | documented future | `turn` transport through `::4` |
| HNSW proximity graph | documented future | approximate nearest neighbors over text and geometry |
| WebGL 2 shader stream | documented future | GPU Horner evaluation for polyform extrusion |
| CodeMirror 6 transaction bridge | implemented | text-to-DataView BiDi projection |
| JSDOM validation environment | documented | headless DOM/CSSOM mirror without adding a runtime dependency |

## Verification Protocol

An OMI-compliant implementation should satisfy:

1. Zero-escape identity: generated DOM ids and `data-omi` attributes use flat hyphen-delimited tokens. Printable hex descriptors represent non-printing controls in DOM-visible routes.
2. Topological containment: subtree filtering uses id or `data-omi` prefix checks instead of bespoke DOM traversal.
3. Factorial alignment: volatile memory and network updates respect the 720 promote and 5040 reset lifecycle.
4. Context normalization: generated local addresses use `omi-8-ffff-127-0-0-1`.
5. Service-bus labeling: semantic content routes identify `::1..::8`; WordNet routes use `::3`; TURN proxy routes use `::4`.

This prospectus is represented structurally in [omi-object-model.manifest.json](./omi-object-model.manifest.json).
