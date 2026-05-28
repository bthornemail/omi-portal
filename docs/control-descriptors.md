# OMI Control Descriptors

OMI treats non-printing control semantics as hierarchical descriptors. The descriptors are carried as printable hex tokens in DOM ids and attributes.

Important rule: do not put raw `U+0000..U+001F` control characters into DOM ids. Use encapsulated OMI tokens such as `0x00`, `0x1f`, and `0x3f`.

## Descriptor Ranges

```text
0x00..0x1f  pre-header / C0-compatible control descriptors
0x20..0x3f  extended OMI record descriptors
0x40..0x7f  US unit/codepoint descriptors
```

Only `0x00..0x3f` are valid RS control descriptors. Only `0x00..0x7f` are valid US unit descriptors.

## Hierarchy

```text
omi-8-ffff-127-0-0-1
  -0x00..0x1f  pre-header descriptor cells
  -0x20..0x3f  record/routing descriptor cells
  -0x00..0x7f  unit/codepoint leaves
  -payload     optional URL-safe Base64 data
```

The first 32 descriptors, `0x00..0x1f`, form the OMI pre-header. The pre-header is intended to describe interpretation state before application payload:

- byte order / DataView endianness
- BiDi direction and isolation state
- BOM/CBOS boundary state
- payload view type
- lifecycle and routing flags
- active RS/US subpartition metadata

## Suggested Pre-Header Map

| RS | Role |
| --- | --- |
| `0x00` | null/root descriptor |
| `0x01` | local frame marker |
| `0x02` | remote/session frame marker |
| `0x03` | little-endian DataView read/write |
| `0x04` | big-endian DataView read/write |
| `0x05` | BiDi LTR state |
| `0x06` | BiDi RTL state |
| `0x07` | BOM present |
| `0x08` | CBOS boundary present |
| `0x09` | Float32 payload view |
| `0x0a` | Float64 payload view |
| `0x0b` | Int32/atomic payload view |
| `0x0c` | BigInt64/atomic payload view |
| `0x0d` | URL-safe Base64 payload |
| `0x0e` | JSON Canvas payload |
| `0x0f` | DOM/CSSOM selector payload |
| `0x10` | 720 promote boundary |
| `0x11` | 5040 hard reset boundary |
| `0x12` | worker-local buffer ownership |
| `0x13` | shared-worker buffer ownership |
| `0x14` | WebRTC handoff candidate |
| `0x15` | NAT64 transcription candidate |
| `0x16` | ULA/private mesh candidate |
| `0x17` | link-local candidate |
| `0x18` | multicast candidate |
| `0x19` | POS/UPOS port projection |
| `0x1a` | command/routing record |
| `0x1b` | selector/index record |
| `0x1c` | FS graph channel bridge |
| `0x1d` | GS graph channel bridge |
| `0x1e` | RS graph channel bridge |
| `0x1f` | US graph channel bridge |

## Extended RS Range

`0x20..0x3f` remains available for higher-order records:

- shape/polytope descriptors
- Fano/5040 timeline descriptors
- HNSW/vector-index records
- cross-document RPC records
- application-specific control predicates

These descriptors should remain printable in markup and binary-compatible in memory. The raw non-printing meaning is semantic; the persisted token is the hex string.
