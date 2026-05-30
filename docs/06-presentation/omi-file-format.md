# OMI File Format

The `*.omi` file format is a binary-to-text declaration for storing an executable OMI route document. It has a binary `car` pre-header and a printable `cdr` payload.

## Frame

```text
CAR: 4 bytes
CDR: variable UTF-8 text
```

```text
+----------------------+-------------------------------------------------------------+
| CAR HEADER (4 bytes) | CDR PAYLOAD (variable length)                               |
+----------------------+----------------------+----------------------+---------------+
| 0x00..0x3f controls  | 8-segment OMI-CIDR  | context UPOS ports   | lambda cube   |
| CBOS / polarity / BOM| content address     | F-expression context | vector/text   |
+----------------------+----------------------+----------------------+---------------+
```

The `car` segment is a non-printing control pre-header. The `cdr` segment is a dot-delimited lambda-cube route:

```text
[content CIDR structure].[context UPOS ports].[Base64 Float32 or UTF-8 clamped payload]
```

## Pre-Header

The current compiler reads four bytes:

```text
byte 0: byte order / chirality
byte 1: polarity / BiDi flow
byte 2: precision stride
byte 3: token delimiter marker
```

The delimiter byte is usually `0x2d`, the ASCII hyphen used by the printable OMI-CIDR token.

## CDR Example

```text
omi-ffff-0002-5a3c-000f-02d0-0036-0000-0000/48.NOUN-VERB-SYM.AAC_QEAAAL_AykAQA
```

Decoded:

```text
content: "omi-ffff-0002-5a3c-000f-02d0-0036-0000-0000/48"
context: "NOUN-VERB-SYM"
payload: "AAC_QEAAAL_AykAQA"
```

The content address follows the same 8-segment grammar used by `RULES.omi`, `FACTS.omi`, `public/bidi.html`, and `public/bidi.css`.

Browser projection example:

```html
<circle
  id="omi-ffff-0002-5a3c-000f-02d0-0036-0000-0000/48"
  data-omi-address="omi-ffff-0002-5a3c-000f-02d0-0036-0000-0000/48" />
```

```css
[id^="omi-"] {}
[id*="-5a3c-"] {}
[id*="-02d0-"] {}
[id$="/48"] {}
```
