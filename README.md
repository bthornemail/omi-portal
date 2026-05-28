# OMI Portal

OMI Portal is the root package for the Omicron Object Model experiments: deterministic POS graph transforms, WordNet centroid addressing, canonical `omi-*` indexes, DOM/CSSOM inspectors, CodeMirror BiDi memory bridges, and A-Frame semantic scenes.

The current package is the merged single-branch target. Demo snapshots under `demos/` are reference material only.

## Canonical Entry Points

- Framework declaration: [docs/omi-object-model.md](./docs/omi-object-model.md)
- Machine-readable manifest: [docs/omi-object-model.manifest.json](./docs/omi-object-model.manifest.json)
- Source map from `dev-docs/`: [docs/source-map.md](./docs/source-map.md)
- Glossary: [GLOSSARY.md](./GLOSSARY.md)
- Agent notes: [AGENTS.md](./AGENTS.md)
- Workflow skills: [SKILLS.md](./SKILLS.md)

## Browser Surfaces

The browser GUIs live in `public/` and are served from the URL root by Vite:

- `/` - 5040 Smith chart POS graph compiler
- `/document.html` - DOM/CSSOM OMI atom inspector
- `/aframe.html` - A-Frame WordNet/Prolog broker scene
- `/bidi.html` - CodeMirror 6 BiDi/DataView bridge
- `/deterministic_clock_slide_rule_routed.html` - legacy deterministic clock slide-rule reference

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the Vite URL. The public HTML files are served from root paths such as `http://localhost:5173/aframe.html`.

## Test And Build

```bash
npm test
npm run build
```

## Programmatic API

```js
import {
  buildOmiIndex,
  compileTextToAnimatedDocument,
  compileTextToPOSSCGNN,
  compileTextToWordNetTetraSCGNN,
  parseOmiAddress
} from "./src/index.js";
```

Core exports include:

- POS graph compilation and JSON Canvas projection.
- WordNet centroid compilation and synset cell addressing.
- OMI address parsing, formatting, UPOS port projection, and index construction.
- DOM/CSSOM registry helpers for browser-native filtering.
- CodeMirror BiDi bridge helpers.
- Prolog WordNet fact broker and OMI Fano token helpers.
- `*.omi` file pre-header/body compiler helpers.

## Core Model

The POS transform channel remains the existing graph behavior. WordNet synset cells remain centroid identity. The OMI port projection bridges UPOS form to FS/GS/RS/US localhost and RPC-style addresses without replacing the POS graph channel map.

Canonical local context root:

```text
omi-ffff-127-0-0-1
```

The older shorthand `omi-8-127-0-0-1` is deprecated compatibility syntax and normalizes to the canonical IPv4-mapped IPv6 form.

## Documentation Set

- [docs/canonical-addressing.md](./docs/canonical-addressing.md)
- [docs/control-descriptors.md](./docs/control-descriptors.md)
- [docs/memory-layout.md](./docs/memory-layout.md)
- [docs/codemirror-bidi-bridge.md](./docs/codemirror-bidi-bridge.md)
- [docs/prolog-wordnet-aframe.md](./docs/prolog-wordnet-aframe.md)
- [docs/omi-distributed-protocol.md](./docs/omi-distributed-protocol.md)
- [docs/omi-file-format.md](./docs/omi-file-format.md)
- [docs/omi-protocol-sequencing.md](./docs/omi-protocol-sequencing.md)

## Node Demos

```bash
npm run demo -- "The chiral clock routes text into file blobs through graph links."
npm run demo:wordnet -- "DOM nodes route CSSOM style rules into canvas groups."
```

## Browserify Wink Bundle

```bash
npm run bundle:wink-browserify
```

This writes `public/wink-bundle.js` and exposes:

```js
window.omiPOSTags("Its quarterly profits jumped 76%.");
```
