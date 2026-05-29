# OMI Framework Documents

These documents define the stable OMI framework surface for decentralized browser interfaces.

## Entry Points

- [OMI Object Model](./omi-object-model.md): canonical declaration unifying OMI addressing, DOM/CSSOM/JSDOM, Lisp-style transformers, CIDR/IP routing, control descriptors, and memory layout.
- [OMI Core Spec](./omi-core-spec.md): current implementation substrate for pure OMI-CIDR ids and CSSOM selectors.
- [OMI Distributed Protocol Prospectus](./omi-distributed-protocol.md): verification-oriented protocol declaration for algebraic cover, Fano timing, hardware engines, and compliance checks.
- [OMI File Format](./omi-file-format.md): executable `*.omi` binary-to-text frame with a 4-byte `car` pre-header and dot-notation `cdr` lambda cube.
- [OMI Protocol Sequencing](./omi-protocol-sequencing.md): deterministic phase order from CodeMirror ingestion through memory, transport metadata, GPU draw, and lifecycle sweeps.
- [OMI Object Model Manifest](./omi-object-model.manifest.json): structured machine-readable declaration.
- [Source Map](./source-map.md): historical provenance index and current canonical doc map.

## Subchapters

- [Canonical Addressing](./canonical-addressing.md): the current `omi-<8-hex-segments>/48` grammar.
- [Control Descriptors](./control-descriptors.md): suggested `0x00..0x3f` descriptor vocabulary.
- [Memory Layout](./memory-layout.md): SharedArrayBuffer sizing and lifecycle notes.
- [CodeMirror BiDi Bridge](./codemirror-bidi-bridge.md): CM6 transaction bridge and browser-facing BiDi state.
- [Prolog WordNet A-Frame](./prolog-wordnet-aframe.md): local JS fact broker and A-Frame scene binding.

Generated substrate DOM ids and `data-omi-address` attributes use the hyphen-delimited 8-segment token form:

```text
omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48
```

CSSOM geometry selectors use id-prefix and id-substring selectors such as `[id^="omi-"]` and `[id*="-02d0-"]`.
