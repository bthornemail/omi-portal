# OMI Protocol — Abstraction Layer Map

Each document in the OMI framework is classified by its primary layer below. Documents spanning multiple layers note secondary assignments.

---

## 01 — Physical

Hardware boundary: kernel NIC interface, CPU topology, physical machine facts.

| Document | Primary Layer | Role |
|---|---|---|
| `01-physical/FACTS.omi` | Physical | Authoritative hardware network fact registries (IP addressing, compute specs, subnet masks for tunnel core and proxy node) |
| `01-physical/EBPF_DELTA_ORBITAL_GATE_v0.md` | Physical / Data Link | eBPF/XDP kernel gate — Q(S)=0 structural envelope validation at the NIC driver boundary |

---

## 02 — Data Link

Frame structure, segment encoding, wire format, Ethernet-offset alignment.

| Document | Primary Layer | Role |
|---|---|---|
| `02-data-link/DELTA_ORBITAL_LEXER_ABI_v0.md` | Data Link / Presentation | Fixed-width 128-bit frame (`uint16_t[8]`) with Δ_C transition law, quadratic error surface Q(S)=0, and Fano plane incidence layer |
| `02-data-link/OMI_IPV6_WIRE_PROFILE_v0.md` | Data Link / Network | IPv6 source address as OMI frame carrier — big-endian segment mapping, Ethernet frame offset 0x16, endianness orientation detection |

---

## 03 — Network

IP addressing, CIDR containment, subnet routing, sparse radix trie.

| Document | Primary Layer | Role |
|---|---|---|
| `03-network/omi-core-spec.md` | Network / Application | Normative OMI-CIDR address grammar, cons/car/cdr primitives, δ_C law, sexagesimal notation, factorial runtime lattice, browser projection rules |
| `03-network/canonical-addressing.md` | Network | 8-segment hyphen-delimited `/48` address grammar with segment map |
| `03-network/omi-distributed-protocol.md` | Network / Transport | Sparse radix trie over IPv6-style address components, subnet boundary semantics, CSSOM prefix mirroring, service-bus labeling (::1..::12) |

---

## 04 — Transport

End-to-end delivery, unreliable/ordered channels, gossip propagation.

| Document | Primary Layer | Role |
|---|---|---|
| `omi-distributed-protocol.md` | Network / Transport | Gossip push-pull, anti-entropy repair, causal version vectors, CoTURN TURN proxy mesh, WebRTC UDP data channel, HNSW proximity routing |
| `04-transport/omi-protocol-sequencing.md` | Transport / Session | Phase 3 — Routing & Transports: local-vs-remote filter, 16-byte binary packet pack, CoTURN/WebRTC UDP-style broadcast metadata |

---

## 05 — Session

Connection lifecycle, epoch management, state coordination, lifecycle sweeps.

| Document | Primary Layer | Role |
|---|---|---|
| `04-transport/omi-protocol-sequencing.md` | Transport / Session | 4-phase pipeline orchestration: ingestion → memory → transport → eviction with 720/5040 lifecycle sweep boundaries |
| `05-session/RING_OVERWRITE_POLICY_v0.md` | Session | Epoch-based ring buffer overwrite rules (OW-1 through OW-5), CAS failure backoff, 5040-slot atomicAdvance |
| `05-session/memory-layout.md` | Session / Presentation | SharedArrayBuffer sizing (SAB(128), SAB(256), SAB(5040)), canonical v1 layout, factorial memory lifecycle |

---

## 06 — Presentation

Encoding, serialization, transformation, BiDi text, binary-to-text framing.

| Document | Primary Layer | Role |
|---|---|---|
| `06-presentation/omi-file-format.md` | Presentation | `.omi` binary-to-text format — 4-byte `car` pre-header (chirality, polarity, alignment, delimiter) + dot-delimited `cdr` lambda-cube payload |
| `06-presentation/control-descriptors.md` | Presentation | 0x00..0x3f descriptor vocabulary — pre-header (0x00..0x1f), extended RS records (0x20..0x3f), US units (0x40..0x7f) |
| `06-presentation/codemirror-bidi-bridge.md` | Presentation / Application | CM6 transaction bridge: BiDi opcodes (LRE, RLE, LRO, RLO, PDF), SAB memory plane, DOM/CSSOM target markup, 14+ CSSOM segment selectors |
| `02-data-link/DELTA_ORBITAL_LEXER_ABI_v0.md` | Data Link / Presentation | Lexer/tokenizer: 128-bit instruction frames, dual-gate pipeline (gate 1: Q(S)=0, gate 2: Fano resolution), 64-bit receipt slots |
| `05-session/memory-layout.md` | Session / Presentation | ArrayBuffer byte layout for descriptor blocks and history rings |

---

## 07 — Application

End-user protocols, object model, declarative framework, whitepaper.

| Document | Primary Layer | Role |
|---|---|---|
| `07-application/omi-object-model.md` | Application / Surface | Canonical framework declaration: 8 browser surfaces, Lisp transformer model (cons/car/cdr), CIDR/IPv6 containment, FS/GS/RS/US routing, factorial lifecycle, distributed state semantics |
| `03-network/omi-core-spec.md` | Network / Application | Normative implementation specification with RFC 2119 key words, MUST/SHOULD/MAY requirements, 10 conformance test categories |
| `07-application/omi-whitepaper.md` | Application | Standalone first-principles specification (OMI-WP-v0.1): 6 axioms, OMI-CIDR addressing, cons semantics, delta law, sexagesimal layer, factorial lattice, conformance |
| `07-application/prolog-wordnet-aframe.md` | Application / Surface | Prolog WordNet fact broker on service bus ::3, Fano routing token syntax, A-Frame entity binding for 3D synset rendering |

---

## 08 — Surface

Browser rendering surfaces: DOM, CSSOM, SVG, A-Frame, JSON Canvas, CodeMirror 6, WordNet/Prolog.

| Document | Primary Layer | Role |
|---|---|---|
| `07-application/omi-object-model.md` | Application / Surface | Defines all 8 browser object surfaces — DOM (runtime tree), CSSOM (selector routing), JSDOM (server mirror), SVG (2D graph), A-Frame (3D WebGL), JSON Canvas (portable graph), CodeMirror 6 (transactional text), WordNet/Prolog (synset centroid) |
| `07-application/prolog-wordnet-aframe.md` | Application / Surface | A-Frame scene binding with `<a-entity>` attributes and Prolog fact broker |
| `06-presentation/codemirror-bidi-bridge.md` | Presentation / Application | CM6 BiDi editor extension as a text surface |
| `08-surface/INDEX.md` | Surface | Index of browser surface implementations with file locations and status |

---

## 09 — Diagram

Visual schematics, barcode carrier profiles, canvas export, reference diagrams.

| Document | Primary Layer | Role |
|---|---|---|
| `09-diagram/INDEX.md` | Diagram | Reference index for visual/diagrammatic assets — barcode carrier profiles (Aztec, BeeTag, MaxiCode, USS-16K), JSON Canvas genesis export, SVG/A-Frame rendering output |
| `dev-docs/barcodes/` | Diagram (reference) | Barcode patent and specification PDFs for carrier profile reference |

---

## 10 — Declaration

Manifest, index, provenance, axioms.

| Document | Primary Layer | Role |
|---|---|---|
| `10-declaration/omi-object-model.manifest.json` | Declaration | Structured machine-readable manifest — version, sources, address spaces, token layouts, surfaces, engines, transformers, routing tables, compliance checks |
| `10-declaration/source-map.md` | Declaration | Historical provenance index — maps dev-docs/ exploratory sources to current canonical docs/ paths |
| `10-declaration/LAYERS.md` | Declaration | This file — layer-by-layer document classification and mapping |
| `README.md` | Declaration | Layer-organized entry-point index for all OMI framework documents |

---

## Layer Cross-Reference Matrix

| Document | Physical | Data Link | Network | Transport | Session | Presentation | Application | Surface | Diagram | Declaration |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `01-physical/FACTS.omi` | ● | | | | | | | | | |
| `01-physical/EBPF_DELTA_ORBITAL_GATE_v0.md` | ● | ● | | | | | | | | |
| `02-data-link/DELTA_ORBITAL_LEXER_ABI_v0.md` | | ● | | | | ○ | | | | |
| `02-data-link/OMI_IPV6_WIRE_PROFILE_v0.md` | | ● | ○ | | | | | | | |
| `03-network/omi-core-spec.md` | | | ● | | | | ○ | | | |
| `03-network/canonical-addressing.md` | | | ● | | | | | | | |
| `03-network/omi-distributed-protocol.md` | | | ● | ○ | | | | | | |
| `04-transport/omi-protocol-sequencing.md` | | | | ○ | ● | | | | | |
| `05-session/RING_OVERWRITE_POLICY_v0.md` | | | | | ● | | | | | |
| `05-session/memory-layout.md` | | | | | ● | ○ | | | | |
| `06-presentation/omi-file-format.md` | | | | | | ● | | | | |
| `06-presentation/control-descriptors.md` | | | | | | ● | | | | |
| `06-presentation/codemirror-bidi-bridge.md` | | | | | | ● | ○ | ○ | | |
| `07-application/omi-object-model.md` | | | | | | | ● | ○ | | |
| `07-application/omi-whitepaper.md` | | | | | | | ● | | | |
| `07-application/prolog-wordnet-aframe.md` | | | | | | | ● | ○ | | |
| `08-surface/INDEX.md` | | | | | | | | ● | | |
| `09-diagram/INDEX.md` | | | | | | | | | ● | |
| `README.md` | | | | | | | | | | ● |
| `10-declaration/source-map.md` | | | | | | | | | | ● |
| `10-declaration/omi-object-model.manifest.json` | | | | | | | | | | ● |
| `10-declaration/LAYERS.md` | | | | | | | | | | ● |

● Primary layer   ○ Secondary layer
