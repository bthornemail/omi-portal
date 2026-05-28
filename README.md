# OMI POS SCGNN TinyNEAT

This package turns Universal POS tags into canonical transformation-feature tokens for a default OMI graph node policy.

See [docs/](./docs/) for the canonical OMI framework notes on IPv4-mapped IPv6 addressing, `0x00..0x3f` control descriptors, and SharedArrayBuffer memory layout.

Pipeline:

```text
text
  → winkNLP tokenization + POS tagging
  → POS feature tokens
  → FS/GS/RS/US chiral channel projection
  → default SCGNN nodes
  → JSON Canvas graph
  → optional WordNet centroid addresses
  → optional DOM/CSSOM tetrahedron frame
  → optional 5040-slot Smith chart projection
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

The A-Frame 3D scene is available at:

```text
http://localhost:5173/aframe.html
```

The animated semantic document demo is available at:

```text
http://localhost:5173/document.html
```

## Run the node demo

```bash
npm run demo -- "The chiral clock routes text into file blobs through graph links."
```

## Run the WordNet tetrahedron demo

```bash
npm run demo:wordnet -- "DOM nodes route CSSOM style rules into canvas groups."
```

The demo uses a mock WordPOS-compatible lookup so it is deterministic and does not require fetching the full WordNet DB.

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

## WordNet centroid address layer

The POS layer remains the transformation-token layer. The WordNet layer supplies deterministic semantic centroid addresses.

```text
text
  → winkNLP POS tokens
  → wordpos / wordpos-web WordNet lookup
  → minimum 6 relation facts per term centroid
  → deterministic CIDR-style address projection
  → DOM/CSSOM tetrahedron reference frame
```

The merged rule is:

```text
POS tag = transformation token
WordNet synset relations = semantic centroid address
DOM/CSSOM = tetrahedral browser object-model frame
CIDR notation = stability metric and address projection
```

Each enriched term receives:

```text
ipv6: 2001:db8:.../128   semantic centroid
ipv4: 127.x.y.z/32       local host-route vertex
```

A term centroid is stable when its WordNet lookup produces at least six relation facts. Empty results remain addressable through the identity synonym, but they are marked unstable.

### Canonical synset cells

Every WordNet centroid also gets a canonical mnemonic cell address:

```text
synset:<POS>:<lemma>:5c<S...>:24c<C...>
```

The 5-cell is the base semantic simplex:

| Cell | Mnemonic | Role | Channel |
|---|---|---|---|
| S0 | lemma | identity term | US |
| S1 | hyper | upward abstraction | GS |
| S2 | hypo | downward instance | US |
| S3 | part | part-whole boundary | FS |
| S4 | oppo | contrast closure | RS |

The 24-cell expands that simplex into documented synset facets such as `syn.id`, `isa.hypernym`, `part.meronym`, `flow.entailment`, `qual.similar`, `opp.antonym`, and context cells. Each cell receives deterministic documentation-safe addresses under `2001:db8::/32` and `127/8`, so a term can be addressed by CIDR, by 5-cell mnemonic, or by 24-cell mnemonic.

### DOM/CSSOM tetrahedron

The browser reference frame has four vertices and six pairwise edges:

| Channel | Corpus | JSON Canvas node role |
|---|---|---|
| FS | DOM | `file` |
| GS | CSSOM | `group` |
| RS | CSS Typed OM | `link` |
| US | shared/extended browser interfaces | `text` |

## Animated documents

`compileTextToAnimatedDocument(text, options)` emits DOM-ready semantic atoms:

```js
import { compileTextToAnimatedDocument } from "./src/index.js";

const animated = await compileTextToAnimatedDocument(text, {
  wordpos,
  useTinyNEAT: true
});

document.head.append(Object.assign(document.createElement("style"), {
  textContent: animated.css
}));
document.querySelector("#document").innerHTML = animated.html;
```

Each term atom carries POS channel, CIDR address, WordNet centroid, chirality, projection, and CSS motion variables. TinyNEAT is optional; when disabled or unavailable, the compiler uses a deterministic fallback motion policy.

### Browser wordpos-web wiring

Browser use requires serving the generated `/wordpos` dictionary assets. In a page that can serve `/wordpos/dict`, pass a real WordPOS instance:

```js
import { compileTextToWordNetTetraSCGNN } from "./src/index.js";

const wordpos = new WordPOS({ dictPath: "/wordpos/dict" });
await wordpos.ready();

const compiled = await compileTextToWordNetTetraSCGNN(
  "DOM nodes route CSSOM style rules into canvas groups.",
  { wordpos, minRelations: 6 }
);
```

## Design rule

POS tags are not annotations after the fact. They are the transformation tokens. The default SCGNN node therefore does not need a pretrained semantic embedding to start; it has a deterministic POS/channel address, a control code, a `/32` vertex address, and a URN closure.
# omi-portal
