# OMI Framework Documents

Layer-organized index of the Omicron Object Model documentation framework.
See [10-declaration/LAYERS.md](10-declaration/LAYERS.md) for the full cross-reference matrix and detailed layer classification.

---

## 01 Physical — Hardware & Kernel Boundary
- [`01-physical/FACTS.omi`](01-physical/FACTS.omi) — Authoritative hardware network fact registries
- [`01-physical/EBPF_DELTA_ORBITAL_GATE_v0.md`](01-physical/EBPF_DELTA_ORBITAL_GATE_v0.md) — eBPF/XDP kernel gate at the NIC boundary

## 02 Data Link — Frame & Wire Format
- [`02-data-link/DELTA_ORBITAL_LEXER_ABI_v0.md`](02-data-link/DELTA_ORBITAL_LEXER_ABI_v0.md) — 128-bit frame AB with Δ_C law and Fano plane incidence
- [`02-data-link/OMI_IPV6_WIRE_PROFILE_v0.md`](02-data-link/OMI_IPV6_WIRE_PROFILE_v0.md) — IPv6 source address as OMI frame carrier

## 03 Network — Addressing & Routing
- [`03-network/omi-core-spec.md`](03-network/omi-core-spec.md) — Normative OMI-CIDR grammar, operators, cons primitives, factorial lattice
- [`03-network/canonical-addressing.md`](03-network/canonical-addressing.md) — 8-segment `/48` address grammar
- [`03-network/omi-distributed-protocol.md`](03-network/omi-distributed-protocol.md) — Sparse radix trie, subnet semantics, CSSOM prefix mirroring

## 04 Transport — Delivery & Propagation
- [`03-network/omi-distributed-protocol.md`](03-network/omi-distributed-protocol.md) — Gossip, anti-entropy, causal vectors, CoTURN, WebRTC
- [`04-transport/omi-protocol-sequencing.md`](04-transport/omi-protocol-sequencing.md) — Phase 3 routing & transport orchestration

## 05 Session — Lifecycle & State
- [`04-transport/omi-protocol-sequencing.md`](04-transport/omi-protocol-sequencing.md) — 4-phase pipeline with 720/5040 lifecycle sweeps
- [`05-session/RING_OVERWRITE_POLICY_v0.md`](05-session/RING_OVERWRITE_POLICY_v0.md) — Epoch-based ring buffer overwrite rules
- [`05-session/memory-layout.md`](05-session/memory-layout.md) — SharedArrayBuffer sizing and factorial memory lifecycle

## 06 Presentation — Encoding & Transformation
- [`06-presentation/omi-file-format.md`](06-presentation/omi-file-format.md) — `.omi` binary-to-text format (car pre-header + cdr lambda-cube)
- [`06-presentation/control-descriptors.md`](06-presentation/control-descriptors.md) — 0x00..0x3f descriptor vocabulary
- [`06-presentation/codemirror-bidi-bridge.md`](06-presentation/codemirror-bidi-bridge.md) — CM6 BiDi transaction bridge and memory plane

## 07 Application — Protocols & Object Model
- [`07-application/omi-object-model.md`](07-application/omi-object-model.md) — Canonical framework: 8 browser surfaces, Lisp transformers, routing, distributed semantics
- [`03-network/omi-core-spec.md`](03-network/omi-core-spec.md) — Implementation substrate with RFC 2119 conformance requirements
- [`07-application/omi-whitepaper.md`](07-application/omi-whitepaper.md) — Standalone first-principles specification
- [`07-application/prolog-wordnet-aframe.md`](07-application/prolog-wordnet-aframe.md) — Prolog WordNet synset broker and A-Frame scene binding

## 08 Surface — Browser Rendering
- [`08-surface/INDEX.md`](08-surface/INDEX.md) — Browser surface implementations index
- [`07-application/omi-object-model.md`](07-application/omi-object-model.md) — 8 browser object surfaces (DOM, CSSOM, SVG, A-Frame, etc.)

## 09 Diagram — Visual & Schematic
- [`09-diagram/INDEX.md`](09-diagram/INDEX.md) — Diagrammatic asset reference (barcode carriers, canvas export)
- `dev-docs/barcodes/` — Reference patent/spec PDFs for carrier profiles

## 10 Declaration — Manifest & Index
- [`10-declaration/omi-object-model.manifest.json`](10-declaration/omi-object-model.manifest.json) — Structured machine-readable declaration
- [`10-declaration/source-map.md`](10-declaration/source-map.md) — Historical provenance index
- [`10-declaration/LAYERS.md`](10-declaration/LAYERS.md) — Complete layer classification and cross-reference matrix

---

Generated substrate DOM ids and `data-omi-address` attributes use the hyphen-delimited 8-segment token form:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

CSSOM geometry selectors use id-prefix and id-substring selectors such as `[id^="omi-"]` and `[id*="-02d0-"]`.
