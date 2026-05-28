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

- Any `omi-8-127-0-0-1` example normalizes to `omi-ffff-127-0-0-1`.

  omi-ffff-127-0-0-1
```

The deprecated shorthand may remain accepted as input for compatibility. New docs, ids, and `data-omi` attributes should use the canonical IPv4-mapped IPv6 form.
