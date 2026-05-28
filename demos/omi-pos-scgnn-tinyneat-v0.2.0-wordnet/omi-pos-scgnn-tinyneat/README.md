# OMI POS SCGNN TinyNEAT

This package turns Universal POS tags into canonical transformation-feature tokens for a default OMI graph node policy.

Pipeline:

```text
text
  → winkNLP tokenization + POS tagging
  → POS feature tokens
  → FS/GS/RS/US chiral channel projection
  → default SCGNN nodes
  → JSON Canvas graph
  → optional TinyNEAT policy evolution
```

## Canonical token vocabulary

The canonical POS vocabulary is the Universal POS set:

```text
ADJ ADP ADV AUX CCONJ DET INTJ NOUN NUM PART PRON PROPN PUNCT SCONJ SYM VERB X
```

The package maps those POS tags into four chiral channels:

| Channel | Code | JSON Canvas node role | POS projection |
|---|---:|---|---|
| FS | `0x1C` | `file` / BLOB egress | `PUNCT`, `SYM` |
| GS | `0x1D` | `group` / centroid context | `ADJ`, `DET`, `INTJ` |
| RS | `0x1E` | `link` / routing edge | `VERB`, `AUX`, `ADV`, `ADP`, `SCONJ`, `CCONJ`, `PART` |
| US | `0x1F` | `text` / Base64 ingress | `NOUN`, `PROPN`, `PRON`, `NUM`, `X` |

## Install

```bash
npm install
```

## Run the browser demo

```bash
npm run dev
```

Open the Vite URL and compile text into a JSON Canvas graph.

## Run the node demo

```bash
npm run demo -- "The chiral clock routes text into file blobs through graph links."
```

## Run tests

```bash
npm test
```

## Browserify wink-only bundle

The main package uses Vite for the full demo. If you want the exact winkNLP browserify flow:

```bash
npm run bundle:wink-browserify
```

This produces:

```text
public/wink-bundle.js
```

and exposes:

```js
window.omiPOSTags("Its quarterly profits jumped 76%.")
```

## Programmatic API

```js
import { compileTextToPOSSCGNN } from "./src/index.js";

const compiled = compileTextToPOSSCGNN("The graph routes text to file blobs.");
console.log(compiled.tokens);
console.log(compiled.features);
console.log(compiled.canvas);
```

## Design rule

POS tags are not annotations after the fact. They are the transformation tokens. The default SCGNN node therefore does not need a pretrained semantic embedding to start; it has a deterministic POS/channel address, a control code, a `/32` vertex address, and a URN closure.

---

## v0.2 WordNet centroid address layer

The POS layer remains the transformation-token layer. The new WordNet layer supplies the **base address space of term centroids**.

```text
text
  → winkNLP POS tokens
  → POS transform channels FS/GS/RS/US
  → wordpos / wordpos-web WordNet lookup
  → minimum 6 relation facts per term centroid
  → stable CIDR-like addresses
  → DOM/CSSOM tetrahedron reference frame
  → JSON Canvas graph
```

### Stability rule

A term centroid is considered stable only when its WordNet lookup produces at least six relation facts. The default relation slots are:

```text
synonym hypernym hyponym meronym holonym antonym similar entailment derivation domain
```

The first six facts are the minimum closure basis. Additional facts improve the metric without changing the ABI.

Each term receives:

```text
ipv6: 2001:db8:.../128   semantic centroid
ipv4: 127.x.y.z/32       host-route vertex address
metric.stable            relationCount >= 6
```

The package deliberately uses documentation/private-safe address spaces: `2001:db8::/32` for IPv6 and `127/8` for local IPv4 host routes.

### DOM/CSSOM tetrahedron

The browser object model is encoded as four vertices:

| Channel | Vertex | JSON Canvas role | Meaning |
|---|---|---|---|
| FS | DOM | `file` | DOM interface corpus |
| GS | CSSOM | `group` | CSS Object Model interface corpus |
| RS | CSS Typed OM | `link` | typed style-value routing corpus |
| US | Shared/Extended | `text` | interfaces extended by CSSOM specs |

The tetrahedron has six edges: `FS.GS`, `FS.RS`, `FS.US`, `GS.RS`, `GS.US`, and `RS.US`.

### Browser `wordpos-web` wiring

Install and serve the generated dictionary folder:

```bash
npm install wordpos-web wordpos
```

In a browser page that can serve `/wordpos/dict`:

```html
<script src="/wordpos/dist/wordpos.min.js"></script>
<script type="module">
  import { compileTextToWordNetTetraSCGNN } from './src/index.js';

  const wordpos = new WordPOS({
    dictPath: '/wordpos/dict',
    preload: 'n',
    includeData: true,
    profile: true
  });

  await wordpos.ready();
  const compiled = await compileTextToWordNetTetraSCGNN(
    'DOM nodes route CSSOM style rules into canvas groups.',
    { wordpos, minRelations: 6 }
  );
  console.log(compiled.tetrahedron);
  console.log(compiled.canvas);
</script>
```

For nouns, expect larger dictionary downloads. Use `preload` only when you know that POS data will be needed.

### Node/mock demo

```bash
npm run demo:wordnet -- "DOM nodes route CSSOM style rules into canvas groups."
```

The demo uses a mock WordPOS-compatible lookup so it is deterministic and does not require fetching the full WordNet DB.

### Programmatic API

```js
import { compileTextToWordNetTetraSCGNN } from './src/index.js';

const compiled = await compileTextToWordNetTetraSCGNN(text, {
  wordpos,        // real WordPOS instance or mock-compatible lookup object
  minRelations: 6
});

console.log(compiled.nodes.map((n) => n.wordnet));
console.log(compiled.tetrahedron);
console.log(compiled.canvas);
```
