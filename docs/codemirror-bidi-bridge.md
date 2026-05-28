# CodeMirror BiDi Bridge

The OMI CodeMirror bridge maps text transactions into DataView operations. It screens inserted text for non-printing Unicode BiDi markers and uses those markers to set endianness, chirality, and CSSOM projection state.

## BiDi Opcodes

| Code point | Name | OMI role |
| --- | --- | --- |
| `\u202a` | LRE | right-handed chirality |
| `\u202b` | RLE | left-handed chirality |
| `\u202d` | LRO | little-endian positive polarity |
| `\u202e` | RLO | big-endian negative polarity |
| `\u202c` | PDF | pop / CBOS boundary |

These characters are non-printing controls. In DOM ids and `data-omi` attributes, keep the canonical printable OMI token form. In editor text buffers, the controls can be present inside transaction text and interpreted by the bridge.

## Memory Plane

The bridge uses:

```js
const sab = new SharedArrayBuffer(5040 * 8);
const view = new DataView(sab);
const f32 = new Float32Array(sab);
```

`5040 * 8` bytes provides one 64-bit slot for every `7!` timeline tick. The first 8 bytes are the master tick register. Subsequent slots are read with dynamic little/big endian polarity from the BiDi controls.

For descriptor pre-header state, pair this with the canonical `SharedArrayBuffer(128)` described in [Memory Layout](./memory-layout.md).

## Runtime API

```js
import { EditorView, ViewPlugin } from "@codemirror/view";
import { compileOmiBiDiExtension } from "./src/index.js";

const sharedBuffer = new SharedArrayBuffer(5040 * 8);
const extensions = compileOmiBiDiExtension(sharedBuffer, { ViewPlugin });

new EditorView({
  doc: "",
  extensions,
  parent: document.getElementById("omi-cm6-editor-surface")
});
```

The package does not force CodeMirror as a dependency. The caller injects `ViewPlugin` from its own CM6 installation.

The repository demo page is available at:

```text
/bidi.html
```

## DOM/CSSOM Target

```html
<div id="omi-framework-root" class="omi-viewport-container">
  <div id="omi-cm6-editor-surface" class="omi-editor-viewport"></div>
  <svg id="omi-webgl-canvas-surface" width="800" height="400" data-service-bus="8">
    <g id="omi-bidi-tiling-grid">
      <path id="omi-node-active-bidi-mesh" data-omi-type="bidi-canvas-tile" d="M 0 0 H 30 V 30 H 0 Z"></path>
    </g>
  </svg>
</div>
```

```css
[data-omi-type="bidi-canvas-tile"] {
  transform-style: preserve-3d;
  transform-origin: center;
  transition: transform 0.12s cubic-bezier(0.1, 0.8, 0.2, 1), fill 0.15s ease;
}

[data-bidi-flow="LRE-LRO"] {
  unicode-bidi: bidi-override;
  direction: ltr;
  fill: rgba(0, 255, 204, 0.2);
  stroke: #00ffcc;
}

[data-bidi-flow="RLE-RLO"] {
  unicode-bidi: bidi-override;
  direction: rtl;
  fill: rgba(255, 0, 85, 0.2);
  stroke: #ff0055;
  stroke-dasharray: 4 2;
}
```

## Transaction Shape

The engine accepts transaction text containing:

```text
omi-8-[BiDi controls]-ffff-127-0-0-1-0xRS-0xUS-payload
```

Example with visible escapes:

```text
omi-8-\u202a\u202d-ffff-127-0-0-1-0x1a-0x41-AAC_QEAAAL_AykAQA
```

The core engine returns a Lisp-style cell:

```js
{
  car: { textToken, profile, isLittleEndian, chiralityCode, polarityCode },
  cdr: { extrusionDepth, cursorOffset }
}
```

The CM6 adapter writes `data-bidi-flow` and `style.transform` onto `#omi-node-active-bidi-mesh`, then advances the 720/5040 timeline.
