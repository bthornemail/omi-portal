# OMI Framework Documents

These documents define the stable OMI framework surface for decentralized browser interfaces.

## Documents

- [Canonical Addressing](./canonical-addressing.md): the `omi-8-ffff-127-0-0-1` IPv4-mapped IPv6 browser-local root and prefix model.
- [Control Descriptors](./control-descriptors.md): non-printing C0/control semantics encapsulated as `0x00..0x3f` hierarchical OMI tokens.
- [Memory Layout](./memory-layout.md): ArrayBuffer/SharedArrayBuffer sizing rules for Float32 pre-headers, descriptor blocks, and 5040-cycle history.
- [CodeMirror BiDi Bridge](./codemirror-bidi-bridge.md): CM6 transaction interception for Unicode BiDi controls, DataView polarity, and CSSOM projection.

## Core Declaration

The canonical browser-local OMI root is:

```text
::ffff:127.0.0.1  ->  omi-8-ffff-127-0-0-1
```

Generated DOM ids and `data-omi` attributes use the hyphen-delimited token form. Raw non-printing characters are represented by hex descriptor tokens such as `0x00`, `0x1f`, and `0x3f` so browser selectors, HTML attributes, and source files remain stable.
