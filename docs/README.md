# OMI Framework Documents

This directory is the canonical specification map for OMI Portal. It is organized for protocol reviewers: start with doctrine, then native gauge, then layer documents, then implementation/prospectus surfaces.

Highest authority for conflict resolution:

```text
../AGENTS.md
-> ../DOCTRINE.md
-> omi-native-gauge-consolidated-canon.md
-> ../POSTULATES.md -> ../AXIOMS.md -> ../DECLARATIONS.md
-> ../RULES.omi / ../FACTS.omi / ../CLOSURES.omi / ../COMBINATORS.omi / ../CONS.omi
```

CIDR, IPv6, 8-segment printable ids, DOM ids, and CSS selectors are adapter/projection surfaces unless a current rule explicitly grants authority. Native OMI identity is relational descent and Omicron-framed gauge closure.

## Reviewer Path

1. [`../MANIFESTO.md`](../MANIFESTO.md) — foundational orientation.
2. [`../DOCTRINE.md`](../DOCTRINE.md) — rewrite topology and lawful receipt doctrine.
3. [`omi-native-gauge-consolidated-canon.md`](omi-native-gauge-consolidated-canon.md) — current native gauge canon and CIDR retirement.
4. [`omi-object-model.md`](omi-object-model.md) — implementation-facing object model and browser projection map.
5. [`10-declaration/LAYERS.md`](10-declaration/LAYERS.md) — layer classification and status.
6. [`10-declaration/source-map.md`](10-declaration/source-map.md) — provenance and canonical source map.

## 01 Physical

- [`01-physical/FACTS.omi`](01-physical/FACTS.omi) — hardware/network fact registries for physical-layer targets.
- [`01-physical/EBPF_DELTA_ORBITAL_GATE_v0.md`](01-physical/EBPF_DELTA_ORBITAL_GATE_v0.md) — eBPF/XDP gate for packet-bound frame validation.

## 02 Data Link

- [`02-data-link/DELTA_ORBITAL_LEXER_ABI_v0.md`](02-data-link/DELTA_ORBITAL_LEXER_ABI_v0.md) — fixed-width 128-bit frame ABI, Delta law, and Fano incidence.
- [`02-data-link/OMI_IPV6_WIRE_PROFILE_v0.md`](02-data-link/OMI_IPV6_WIRE_PROFILE_v0.md) — IPv6 source-address carrier profile. Adapter surface, not native identity.

## 03 Network

- [`03-network/canonical-addressing.md`](03-network/canonical-addressing.md) — current address-root and adapter boundary summary.
- [`03-network/omi-core-spec.md`](03-network/omi-core-spec.md) — historical/adapter implementation substrate for printable 8-segment ids, browser selectors, and legacy compatibility.
- [`03-network/omi-distributed-protocol.md`](03-network/omi-distributed-protocol.md) — distributed protocol prospectus grounded only where local source and tests exist.

## 04 Transport

- [`04-transport/omi-protocol-sequencing.md`](04-transport/omi-protocol-sequencing.md) — target phase choreography; explicitly marks unimplemented sequencer integration.
- [`03-network/omi-distributed-protocol.md`](03-network/omi-distributed-protocol.md) — implemented distributed pieces and prospectus boundary.

## 05 Session

- [`05-session/RING_OVERWRITE_POLICY_v0.md`](05-session/RING_OVERWRITE_POLICY_v0.md) — epoch and ring overwrite rules.
- [`05-session/memory-layout.md`](05-session/memory-layout.md) — SharedArrayBuffer sizing, descriptor blocks, and 5040-cycle history.

## 06 Presentation

- [`06-presentation/omi-file-format.md`](06-presentation/omi-file-format.md) — `.omi` source and `.imo` object framing.
- [`06-presentation/control-descriptors.md`](06-presentation/control-descriptors.md) — descriptor vocabulary.
- [`06-presentation/codemirror-bidi-bridge.md`](06-presentation/codemirror-bidi-bridge.md) — CodeMirror BiDi transaction surface.

## 07 Application

- [`agreement-is-all-you-need.md`](agreement-is-all-you-need.md) — First Principle and collaboration doctrine.
- [`omi-object-model.md`](omi-object-model.md) — canonical implementation framework.
- [`omi-whitepaper.md`](omi-whitepaper.md) — historical first-principles whitepaper; retain with adapter-era labels.
- [`07-application/omi-binary-quadratic-form.md`](07-application/omi-binary-quadratic-form.md) — Q-frame validation and Q-xy projection split.
- [`07-application/prolog-wordnet-aframe.md`](07-application/prolog-wordnet-aframe.md) — WordNet/Prolog and demo-only A-Frame binding.

## 08 Surface

- [`08-surface/INDEX.md`](08-surface/INDEX.md) — browser surface implementation index.
- [`omi-object-model.md`](omi-object-model.md) — DOM, CSSOM, JSON Canvas, CodeMirror, and projection surface definitions.

## 09 Diagram

- [`09-diagram/INDEX.md`](09-diagram/INDEX.md) — diagrammatic and barcode reference index.

## 10 Declaration

- [`10-declaration/omi-object-model.manifest.json`](10-declaration/omi-object-model.manifest.json) — machine-readable declaration used by tests.
- [`10-declaration/source-map.md`](10-declaration/source-map.md) — current and historical source map.
- [`10-declaration/LAYERS.md`](10-declaration/LAYERS.md) — layer classification matrix.

## Public Projection Boundary

Generated DOM ids and `data-omi-address` attributes may still use printable 8-segment adapter tokens for browser compatibility:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

Those tokens are selector and adapter handles. They do not supersede native relational descent, Omicron chirality, or the current address root.
