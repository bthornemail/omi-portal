# OMI Documentation Source Map

This source map explains how the exploratory `dev-docs/` files feed the canonical OMI Object Model documentation. It is a curated index, not a generated transcript.

## Canonical Sources

### `dev-docs/OMI( omi- ) Object Model.md`

Role: topological object-model exploration.

Extracted declarations:

- CIDR-style containment maps to hyphen-delimited OMI token prefixes.
- DOM hierarchy and CSSOM prefix selectors are the native browser routing surface.
- `cons`, `car`, and `cdr` model route/payload transfer cells.
- 720/5040 timeline cycles frame memory lifecycle.
- A-Frame, SVG, and CodeMirror are multi-modal surfaces for the same address space.

Canonicalization:

- Any `omi-8-127-0-0-1` example normalizes to `omi-8-ffff-127-0-0-1`.

### `dev-docs/Omi Object Model.md`

Role: descriptor and object-model seed.

Extracted declarations:

- `0x00..0x3f` descriptors are printable control predicates for DOM-safe addressing.
- DOM elements use `id` and `data-omi-*` attributes as the object-model index.
- CSSOM routes address subtrees through attribute selectors.
- Polynomial/Base64 payloads are leaf data, not replacements for the address grammar.

### `dev-docs/Omi Port Rendering.md`

Role: rendering and service-bus exploration.

Extracted declarations:

- `::1..::8` form semantic service buses for RPC-style delivery.
- `::3` is the WordNet broker bus.
- `::4` is the WebRTC/CoTURN transport bus.
- `::8` is the master canvas/browser surface.
- CSSOM can style service state by data attributes and token prefixes.

### `dev-docs/Omi Porting.md`

Role: port projection and network routing exploration.

Extracted declarations:

- UPOS tags project onto OMI port channels.
- Universal Features qualify content/context routes.
- WordNet operators such as `hyp`, `sim`, `ent`, `ant`, and `der` are synset routing keys.
- Fano routes combine point, transport, operator, synset ids, feature mask, slot, and payload.

### `dev-docs/Omi Declarative.md`

Role: deployment manifest exploration.

Extracted declarations:

- CodeMirror 6, Fano timing, Universal POS ports, CoTURN, Prolog WordNet, and WebGL can be described as one deployment manifest.
- The documentation phase preserves this as architecture vocabulary.

Canonicalization:

- CoTURN, WebRTC, HNSW, and WebGL shader streams are marked as documented future surfaces unless represented by local deterministic metadata.

### `dev-docs/chat.md`

Role: indexed transcript source.

Extracted declarations:

- Unicode BiDi controls can steer DataView endian polarity and layout chirality.
- CBOS/BOM/endian ideas are interpretation constraints, not alternate canonical roots.
- Lambda/F-expression ranges map to `0x00..0x3f` declarations.
- `0x00..0x7f` maps to unit/codepoint definitions and S-expression leaves.
- The manifest glossary and closure-combinator language informs the transformer model.

Canonicalization:

- The transcript is indexed for concepts and provenance. It is not copied wholesale into canonical docs.

## Existing Canonical Docs

The new OMI Object Model doc is the entry point. Existing docs remain subchapters:

- `docs/omi-distributed-protocol.md`: verification prospectus for algebraic cover, Fano timing, hardware engines, and compliance checks.
- `docs/omi-file-format.md`: `*.omi` file declaration with binary `car` pre-header and dot-notation `cdr` lambda cube.
- `docs/omi-protocol-sequencing.md`: chronological phase matrix for ingestion, memory mapping, routing, transport metadata, spatial acceleration, and lifecycle sweeps.
- `docs/canonical-addressing.md`: canonical root and prefix model.
- `docs/control-descriptors.md`: descriptor ranges and DOM-safe control encoding.
- `docs/memory-layout.md`: buffer sizing, pre-header, descriptor block, and 5040-cycle history.
- `docs/codemirror-bidi-bridge.md`: CM6 transaction and BiDi/DataView bridge.
- `docs/prolog-wordnet-aframe.md`: `::3` WordNet broker and A-Frame entity binding.

## Deprecated Forms

Deprecated generated form:

```text
omi-8-127-0-0-1
```

Canonical generated form:

```text
omi-8-ffff-127-0-0-1
```

The deprecated shorthand may remain accepted as input for compatibility. New docs, ids, and `data-omi` attributes should use the canonical IPv4-mapped IPv6 form.
