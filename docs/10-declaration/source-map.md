# OMI Documentation Source Map

This file is now a historical source index. The original exploratory `dev-docs/` folder has been removed from the active workspace, so canonical documentation is maintained directly in `docs/` and the structured manifest.

## Current Canonical Sources

- [OMI Object Model](../07-application/omi-object-model.md): top-level declaration of addressing, DOM/CSSOM/JSDOM surfaces, Lisp transformers, routing semantics, and memory layout.
- [OMI Core Spec](../03-network/omi-core-spec.md): implementation-facing substrate rules for pure OMI-CIDR ids, `data-omi-address`, and CSSOM selectors.
- [Canonical Addressing](../03-network/canonical-addressing.md): current 8-segment `/48` address grammar.
- [OMI File Format](../06-presentation/omi-file-format.md): binary `car` pre-header and printable dot-delimited `cdr` payload.
- [OMI Protocol Sequencing](../04-transport/omi-protocol-sequencing.md): phase ordering across editor, memory, transport, GPU, and lifecycle surfaces.
- [OMI Object Model Manifest](omi-object-model.manifest.json): machine-readable declaration used by documentation integrity tests.

## Historical Note

Some manifest `sources` entries still name their original `dev-docs/*.md` paths to preserve provenance. Those paths are not required to exist in the active package. New implementation and documentation work should cite the canonical files above.
