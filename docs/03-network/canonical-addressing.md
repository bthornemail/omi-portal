# Canonical OMI Addressing

> **Current status:** Native OMI identity is `omi---imo`, the binary rewrite identity. The slash path `/---/` is routed interpretation. The browser-safe token shape below is an adapter form for DOM ids, CSSOM selectors, JavaScript demux, and historical axiom rows.

OMI keeps one browser-safe adapter token shape for DOM ids, CSSOM selectors, JavaScript demux, and compatibility rows:

```text
adapter-token: <seg0>-<seg1>-<seg2>-<seg3>-<seg4>-<seg5>-<seg6>-<seg7>/<claim>
```

Each segment is a 4-digit lowercase hexadecimal field. GUI and compatibility rows use `/48` as an adapter claim for local substrate frames; it is not native identity and not the native slash route.

## Adapter Segment Map

```text
[chiral] [bus] [inversion] [step/pos] [stride] [slot] [layer] [nil]
```

| Segment | Meaning | Valid examples |
|---:|---|---|
| 0 | Chiral/cardinal phase | `ffff`, `039f` |
| 1 | Service bus | `0001` through `0008` |
| 2 | Inversion gate | `0000`, `5a3c` |
| 3 | Step or UPOS port | `0000` through `003b`, UPOS bindings `0001` through `0017` |
| 4 | Factorial stride | `0078`, `02d0`, `13b0` |
| 5 | Sexagesimal slot | `0000` through `0036` |
| 6 | Factorial layer | `0000` through `0007` |
| 7 | Nil terminator | `0000`, `0001` |

Example:

```text
omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48
```

This decodes as cardinal phase, service bus `::2`, active inversion gate, step `15`, stride `720`, slot `54`, layer `0`, and active sequence.

## DOM And CSSOM Rules

Generated substrate elements carry the same value in both `id` and `data-omi-address`:

```html
<circle
  id="omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48"
  data-omi-address="omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48" />
```

CSSOM geometry selectors use id-prefix and id-substring matching over hex fields:

```css
[id^="omi-"] {}
[id*="-02d0-"] {}
[id*="-5a3c-"] {}
[id*="-0001/"] {}
```

JavaScript lookup may use `data-omi-address`, but geometric styling does not rely on `data-*` selectors.

## Local Context Root

The older localhost bridge spelling `omi-ffff-127-0-0-1` belongs to the earlier FS/GS/RS/US address layer. The current pure substrate uses the 8-segment form above. Legacy parsers may still accept older examples, but new DOM ids, CSS selectors, axiom rows, and stress packets should use the 8-segment `/48` form.

Unicode BiDi, BOM/CBOS, and DataView endianness are interpretation constraints. They do not replace the 8-segment address grammar.
