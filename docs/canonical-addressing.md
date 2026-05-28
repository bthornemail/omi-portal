# Canonical OMI Addressing

OMI uses a hyphen-delimited string form so DOM, CSSOM, workers, and binary buffers can share one addressable identity model.

## Canonical Local Root

```text
IPv6 semantic form: ::ffff:127.0.0.1
OMI token form:     omi-8-ffff-127-0-0-1
```

`omi-8-ffff-127-0-0-1` is the canonical browser-local boundary. It means:

- `omi`: OMI protocol marker.
- `8`: local document/process frame, corresponding to the `::8` service/document frame used by the framework.
- `ffff`: IPv4-mapped IPv6 marker from `::ffff:0:0/96`.
- `127-0-0-1`: constrained IPv4 loopback host inside the mapped IPv6 frame.

The older shorthand `omi-8-127-0-0-1` is deprecated. Parsers may accept it as legacy input, but generated addresses normalize to `omi-8-ffff-127-0-0-1`.

## Canonical Leaf Form

```text
omi-8-ffff-127-0-0-1-0xRS-0xUS-payload
```

- `0xRS`: record/control descriptor, bounded to `0x00..0x3f`.
- `0xUS`: unit/codepoint descriptor, bounded to `0x00..0x7f`.
- `payload`: optional URL-safe Base64 payload.

Example:

```text
omi-8-ffff-127-0-0-1-0x1a-0x41-AAC_QEAAAL_AykAQA
```

## Prefix Containment

OMI preserves IPv6-style prefix thinking in DOM/CSSOM selectors:

```css
[data-omi^="omi-8"] {}
[data-omi^="omi-8-ffff"] {}
[data-omi^="omi-8-ffff-127-0-0-1"] {}
[data-omi*="-0x1a-"] {}
```

Each added token narrows the subtree. The hyphen is the structural delimiter for CSSOM prefix matching, worker routing, and buffer indexing.

## Related IPv6 Spaces

These spaces are not the local root, but can be modeled as future OMI frames:

- `64:ff9b::/96`: NAT64 transcription or translation bridge.
- `fc00::/7`: private decentralized network identities.
- `fe80::/10`: link-local scope.
- `ff00::/8`: multicast scope.
- `2001:db8::/32` and `3fff::/20`: documentation/examples only.

Unicode BiDi, BOM/CBOS, and DataView endianness do not replace the address root. They are interpretation constraints encoded inside RS descriptors or `data-omi-*` metadata.
