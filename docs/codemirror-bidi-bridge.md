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

The demo surface at `/bidi.html` uses CIDR-hyphenated element IDs and `data-omi-address` attributes.

```html
<div id="omi-telemetry-panel">
  <div>Bus Connection: <span id="t-bus-conn" class="metric-val">--</span></div>
  <div>Operator: <span id="t-operator" class="metric-val">--</span></div>
  <div>Codepoint: <span id="t-codepoint" class="metric-val">--</span></div>
  <div>Token: <span id="t-token" class="metric-val">--</span></div>
  <div>Polynomial Order: <span id="t-poly" class="metric-val">--</span></div>
  <div>Stride: <span id="t-stride" class="metric-val">--</span></div>
  <div>Step: <span id="t-step" class="metric-val">--</span></div>
  <div>Ratio: <span id="t-ratio" class="metric-val">--</span></div>
  <div>Inversion Gate: <span id="t-inversion" class="metric-val">--</span></div>
  <div>List Terminator: <span id="t-lisp-nil" class="metric-val">--</span></div>
  <div>Factorial Layer: <span id="t-lattice" class="metric-val">--</span></div>
  <div>Stream Status: <span id="t-stream-dot" class="omi-inactive"></span></div>
</div>

<svg id="OMI-UNIVERSAL-GUI-ROOT" width="100%" height="480"
     viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <g>
    <!-- Chiral origin vertex -- step 15, stride 720, slot 54 -->
    <circle id="omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48"
            data-omi-address="omi-ffff-0002-0000-000f-02d0-0036-0000-0000/48"
            cx="150" cy="200" r="14" />
    <!-- Inversion gate mirror -->
    <circle id="omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48"
            data-omi-address="omi-039f-0002-5a3c-000f-02d0-0036-0000-0000/48"
            cx="450" cy="200" r="14" />
    <!-- High-density stride 120 -->
    <rect id="omi-ffff-0008-0000-003b-0078-0036-0000-0000/48"
          data-omi-address="omi-ffff-0008-0000-003b-0078-0036-0000-0000/48"
          x="640" y="80" width="60" height="60" />
    <!-- Stride 5040 liveness ring -->
    <circle id="omi-ffff-0001-0000-0000-13b0-0036-0000-0000/48"
            data-omi-address="omi-ffff-0001-0000-0000-13b0-0036-0000-0000/48"
            cx="400" cy="500" r="30" />
    <!-- Lisp nil-terminator fixed point -->
    <circle id="omi-ffff-0000-0000-0000-0000-0000-0000-0001/48"
            data-omi-address="omi-ffff-0000-0000-0000-0000-0000-0000-0001/48"
            cx="400" cy="360" r="12" />
    <!-- Factorial lattice layer 3! -->
    <polygon id="omi-ffff-0008-0000-0000-0000-0000-0003-0000/48"
             data-omi-address="omi-ffff-0008-0000-0000-0000-0000-0003-0000/48"
             points="350,400 450,400 400,480" />
    <!-- Factorial lattice layer 7! -->
    <circle id="omi-ffff-0000-0000-0000-0000-0000-0007-0000/48"
            data-omi-address="omi-ffff-0000-0000-0000-0000-0000-0007-0000/48"
            cx="400" cy="200" r="180" fill="none" />
  </g>
</svg>

<pre id="stream-log"></pre>
```

CSSOM routing uses CIDR-substring ID selectors on `<svg>` child elements. The canonical base selector applies neon-cyan fill and stroke to all `[id^="omi-"]` nodes. Semantics are encoded as hex segment values within the hyphen-delimited CIDR id:

```css
/* Base neon cyan -- all omi-prefixed CIDR nodes */
[id^="omi-"] {
  fill: rgba(0, 255, 204, 0.08);
  stroke: #00ffcc;
  stroke-width: 1px;
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.1s cubic-bezier(0.1, 0.8, 0.2, 1);
}

/* Cardinal phase (039f segment) -- thicker stroke */
[id*="-039f-"] {
  stroke-width: 2px;
}

/* Stride 720 (02d0 segment) -- amber */
[id*="-02d0-"] {
  stroke: #ffaa00;
  stroke-width: 1.5px;
}

/* Stride 120 (0078 segment) -- orange */
[id*="-0078-"] {
  stroke: #ff6600;
}

/* Stride 5040 (13b0 segment) -- cyan emphasis */
[id*="-13b0-"] {
  stroke: #00ffcc;
  stroke-width: 2px;
  fill: rgba(0, 255, 204, 0.15);
}

/* Inversion gate (5a3c segment) -- magenta glow + hover flip */
[id*="-5a3c-"] {
  stroke: #ff0055;
  filter: drop-shadow(0 0 12px #ff0055);
}
[id*="-5a3c-"]:hover {
  transform: rotateY(180deg) translateZ(20px);
  fill: rgba(255, 0, 85, 0.15);
}
```

The complete set of 14+ CSSOM segment selectors is defined in `public/bidi.css`.

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
