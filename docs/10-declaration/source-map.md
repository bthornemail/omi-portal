# OMI Documentation Source Map

This file is now a historical source index. The original exploratory `dev-docs/` folder has been removed from the active workspace, so canonical documentation is maintained directly in `docs/` and the structured manifest.

## Current Canonical Sources

- [OMI Manifesto](../../MANIFESTO.md): foundational orientation that OMI collapses representation and interpretation; notation is cipher and computation is rewrite of interpretation rather than mutation of data.
- [OMI Doctrine](../../DOCTRINE.md): canonical doctrine for OMI as rewrite topology; separates the notation-cipher invariant from derived geometries and implementation substrates.
- [OMI Object Model](../omi-object-model.md): top-level declaration of addressing, DOM/CSSOM/JSDOM surfaces, Lisp transformers, routing semantics, and memory layout.
- [OMI Core Spec](../03-network/omi-core-spec.md): implementation-facing compatibility notes for historical OMI-CIDR adapter ids, `data-omi-address`, and CSSOM selectors.
- [Canonical Addressing](../03-network/canonical-addressing.md): adapter-era 8-segment claim grammar; native OMI addressing is relational descent.
- [OMI File Format](../06-presentation/omi-file-format.md): binary `car` pre-header and printable dot-delimited `cdr` payload.
- [OMI Protocol Sequencing](../04-transport/omi-protocol-sequencing.md): phase ordering across editor, memory, transport, GPU, and lifecycle surfaces.
- [OMI Ququart Interpretation Machine](../omi-ququart-interpretation-machine.md): deterministic four-state register (source → notation → reading → receipt); structural interpretation model, not quantum computation. Runtime anchor: `src/omi/ququart-machine.ts`, test anchor: `test/ququart-machine.test.ts`.
- [OMI Object Model Manifest](omi-object-model.manifest.json): machine-readable declaration used by documentation integrity tests.

## Historical Note

Some manifest `sources` entries still name their original `dev-docs/*.md` paths to preserve provenance. Those paths are not required to exist in the active package. New implementation and documentation work should cite the canonical files above.
