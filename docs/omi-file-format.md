# OMI File Format

The `*.omi` file format is a binary-to-text declaration for storing an executable OMI route document. It is both archival and interpretable: the first four bytes describe how to read the file, and the remaining bytes are printable route text.

## Frame

```text
CAR: 4 bytes
CDR: variable UTF-8 text
```

```text
+----------------------+-------------------------------------------------------------+
| CAR HEADER (4 bytes) | CDR PAYLOAD (variable length)                               |
+----------------------+----------------------+----------------------+---------------+
| 0x00..0x3f controls  | alphanumeric CIDR   | context UPOS ports   | lambda cube   |
| CBOS / polarity / BOM| FS / GS storage     | F-expression context | vector/text   |
+----------------------+----------------------+----------------------+---------------+
```

The `car` segment is a non-printing control pre-header. The `cdr` segment is a dot-delimited lambda-cube route:

```text
[content CIDR structure].[context UPOS ports].[Base64 Float32 or UTF-8 clamped payload]
```

Example CDR:

```text
omi-ffff-127-0-0-1-0x1a.NOUN-VERB-SYM.AAC_QEAAAL_AykAQA

  content: "omi-ffff-127-0-0-1-0x1a",

  data-omi="omi-ffff-127-0-0-1-0x1a"

[data-omi^="omi-ffff-127-0-0-1"] {}
[data-omi-type="lambda-cube-port"] {}
[data-omi-context-ports~="NOUN"] {}
```
