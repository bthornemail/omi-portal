# OMI Framework Documents

These documents define the stable OMI framework surface for decentralized browser interfaces.

## Entry Point

- [OMI Object Model](./omi-object-model.md): canonical declaration unifying OMI addressing, DOM/CSSOM/JSDOM, Lisp-style transformers, CIDR/IP routing, control descriptors, and memory layout.
- [OMI Distributed Protocol Prospectus](./omi-distributed-protocol.md): verification-oriented protocol declaration for algebraic cover, Fano timing, hardware engines, and compliance checks.
- [OMI File Format](./omi-file-format.md): executable `*.omi` binary-to-text frame with a 4-byte `car` pre-header and dot-notation `cdr` lambda cube.
- [OMI Protocol Sequencing](./omi-protocol-sequencing.md): deterministic phase order from CodeMirror ingestion through memory, transport metadata, GPU draw, and lifecycle sweeps.
- [OMI Object Model Manifest](./omi-object-model.manifest.json): structured machine-readable declaration curated from `dev-docs/`.
- [Source Map](./source-map.md): human index of the `dev-docs/` source material and canonicalization rules.

## Subchapters

- [Canonical Addressing](./canonical-addressing.md): the `omi-ffff-127-0-0-1` IPv4-mapped IPv6 browser-local root and prefix model.

  ::ffff:127.0.0.1  ->  omi-ffff-127-0-0-1
```

Generated DOM ids and `data-omi` attributes use the hyphen-delimited token form. Raw non-printing characters are represented by hex descriptor tokens such as `0x00`, `0x1f`, and `0x3f` so browser selectors, HTML attributes, and source files remain stable.
