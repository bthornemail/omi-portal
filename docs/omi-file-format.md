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
omi-8-ffff-127-0-0-1-0x1a.NOUN-VERB-SYM.AAC_QEAAAL_AykAQA
```

## CAR Pre-Header

| Byte | Values | Meaning |
|---|---|---|
| `0` | `0x01`, `0x02` | chirality and endian BOM: little/left or big/right |
| `1` | `0x0a`, `0x0b` | polarity and BiDi flow: positive/LTR or inverse/RTL |
| `2` | `0x20`, `0x3f` | alignment: Float32 or Float64 |
| `3` | `0x2d` | delimiter bridge: hyphen `-` |

All pre-header values must stay inside `0x00..0x3f`, except the delimiter bridge byte stores the ASCII hyphen `0x2d`.

Allocation details:

| Byte | Name | Values |
|---|---|---|
| `0` | Canonical Byte Order Serialization / BOM | `0x01` little-endian left-chiral, `0x02` big-endian right-chiral |
| `1` | Polarity and BiDi flow | `0x0a` positive LTR, `0x0b` inverse RTL |
| `2` | Cardinality and precision stride | `0x20` Float32 4-byte stride, `0x3f` Float64 8-byte stride |
| `3` | token delimiter marker | `0x2d` ASCII hyphen |

## CDR Dot Notation

The CDR has exactly three dot-delimited fields:

| Field | Meaning |
|---|---|
| content | OMI route beginning with `omi-` |
| context | hyphen-delimited UPOS ports such as `NOUN-VERB-SYM` |
| payload | URL-safe Base64 typed vector, or UTF-8 text fallback |

The dot is the table delimiter. The hyphen remains the route delimiter inside each table.

## Polynomial Payload

A Float32 payload is a 16-byte vector:

| Byte offset | Float32 index | Meaning |
|---|---:|---|
| `0..3` | `0` | FS weight |
| `4..7` | `1` | GS weight |
| `8..11` | `2` | RS weight |
| `12..15` | `3` | US weight |

The canonical 2.5D extrusion equation is:

```text
P(t) = cFS*t^3 + cGS*t^2 + cRS*t + cUS
```

Evaluation uses Horner's method:

```js
const z = ((c[0] * t + c[1]) * t + c[2]) * t + c[3];
```

## Runtime API

```js
import { OmiFileSpecificationCompiler, encodeOmiFile } from "./src/index.js";

const buffer = encodeOmiFile({
  content: "omi-8-ffff-127-0-0-1-0x1a",
  contextPorts: ["NOUN", "VERB", "SYM"],
  payload: new Float32Array([1.5, 2, -0.5, 10])
});

const compiler = new OmiFileSpecificationCompiler(new SharedArrayBuffer(128));
const cell = compiler.compileFileStream(buffer);

compiler.car(cell); // pre-header execution metadata
compiler.cdr(cell); // content route, UPOS ports, payload vector
```

The compiler exposes Lisp-style `cons`, `car`, and `cdr` primitives, matching the OMI Object Model transformer vocabulary.

## DOM/CSSOM Projection

A compiled CDR can project directly to native attributes:

```html
<g
  data-omi="omi-8-ffff-127-0-0-1-0x1a"
  data-omi-type="lambda-cube-port"
  data-omi-context-ports="NOUN VERB SYM"
  data-omi-payload-kind="float32">
</g>
```

CSSOM can route the projected file state with prefix and substring selectors:

```css
[data-omi^="omi-8-ffff-127-0-0-1"] {}
[data-omi-type="lambda-cube-port"] {}
[data-omi-context-ports~="NOUN"] {}
```
