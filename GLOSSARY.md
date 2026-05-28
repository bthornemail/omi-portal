# OMI Glossary

## Addressing

- **OMI**: Omicron Object Model, a canonical object-addressing layer for browser, memory, graph, and semantic surfaces.
- **`omi-*`**: Hyphen-delimited OMI identity token family used by DOM ids, `data-omi`, CSSOM selectors, and packet-like routing metadata.
- **Canonical local context root**: `omi-8-ffff-127-0-0-1`, the OMI spelling of IPv4-mapped loopback `::ffff:127.0.0.1`.
- **Deprecated shorthand**: `omi-8-127-0-0-1`; accepted for compatibility and normalized to `omi-8-ffff-127-0-0-1`.
- **`::1..::8`**: Semantic service bus range used by the framework docs for local object-model surfaces.
- **`::/128`**: Remote codepoint/root hierarchy placeholder documented as a future routing surface.
- **CIDR projection**: The use of IP prefix containment as a route-table and subtree language for OMI atoms.

## Object Surfaces

- **DOM**: Runtime element tree and native dataset carrier for OMI atoms.
- **CSSOM**: Selector and rule surface; OMI filtering prefers prefix/data-attribute selectors.
- **JSDOM**: Server/test mirror for DOM and CSSOM semantics. It is documented but not required as a runtime dependency.
- **JSON Canvas**: Graph serialization surface for compiled POS and WordNet atoms.
- **A-Frame**: Canonical 3D GUI surface for the WordNet/Prolog broker.
- **CodeMirror 6**: Text transaction surface for BiDi and DataView bridge experiments.

## Channels And Ports

- **FS**: Frame/storage surface and open UPOS content classes.
- **GS**: Graph/global surface and closed UPOS operator classes.
- **RS**: Relation/control surface for `0x00..0x3f` predicate and control descriptors.
- **US**: Unit/codepoint surface for `0x00..0x7f` terminal unit descriptors.
- **POS graph channel**: Existing graph transform mapping. It is preserved and not replaced by OMI port projection.
- **OMI port projection**: UPOS-to-FS/GS/RS/US bridge used for canonical OMI addressing metadata.

## WordNet

- **Synset centroid**: Deterministic semantic identity derived from WordNet lookup and relation facts.
- **5-cell active cells**: Base semantic simplex: lemma, hypernym, hyponym, part/whole, opposition.
- **24-cell active cells**: Expanded synset facets used for stable semantic addressing.
- **Prolog WordNet broker**: Deterministic JavaScript fact broker over local `vendor/prolog/wn_*.pl` files. It is not a live Prolog runtime in v1.
- **Fano token**: `omi-fano-*` packet-style token binding timing point, storage tier, WordNet operator, synset ids, features, slot, and payload.

## Memory And Files

- **`*.omi` file**: Dual-envelope binary-to-text container with a 4-byte non-printing `car` pre-header and variable-length `cdr` payload.
- **`car`**: Lisp-style header side of a transit cell; in OMI docs it carries route, byte order, polarity, or control metadata.
- **`cdr`**: Lisp-style payload side of a transit cell; in OMI docs it carries remainder, vector data, or semantic body.
- **SharedArrayBuffer(128)**: 32-slot Float32 pre-header/state table.
- **SharedArrayBuffer(5040 * 8)**: Factorial timeline ring buffer used by sequencing and BiDi bridge docs.
- **720 promote sweep**: Lifecycle boundary for pruning volatile or flat nodes.
- **5040 hard reset**: Lifecycle boundary for clearing active timeline registers.
